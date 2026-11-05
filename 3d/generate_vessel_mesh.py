"""Generate a conforming 3D vessel tetra mesh with Gmsh OCC BooleanFragments.

Usage:
    pip install gmsh
    python 3d/generate_vessel_mesh.py --output vessel-mesh.json

This is an offline meshing step; the browser FEM solver is not yet wired to this file.
"""
import argparse
import json
import math
from pathlib import Path

def build(output, diameter=2000, height=3500, wall=8, insulation=100,
          fill=30, supports=4, support_width=120, support_height=450,
          mesh_size=80):
    import gmsh
    if not 0 < wall < diameter/2 or insulation <= 0 or not 0 <= fill <= 100:
        raise ValueError("Invalid vessel geometry")
    if not 0 <= supports <= 32 or mesh_size <= 0:
        raise ValueError("Invalid supports or mesh size")
    R=diameter/2000
    ri=R-wall/1000
    re=R+insulation/1000
    H=height/1000
    t=wall/1000
    ins=insulation/1000
    gmsh.initialize()
    try:
        gmsh.model.add("KRUS_full_vessel")
        occ=gmsh.model.occ
        parts={}
        def cylinder(radius,y,length):
            return occ.addCylinder(0,y,0,0,length,0,radius)
        def ring(outer,inner,y,length):
            big=cylinder(outer,y,length)
            small=cylinder(inner,y,length)
            result,_=occ.cut([(3,big)],[(3,small)],removeObject=True,removeTool=True)
            return result[0][1]
        parts["steel"]=[ring(R,ri,-H/2,H)]
        # Caps include the interior radius, and contact the cylindrical wall on their rim.
        parts["topCap"]=[cylinder(R,H/2,t)]
        parts["bottomCap"]=[cylinder(R,-H/2-t,t)]
        parts["insulation"]=[
            ring(re,R,-H/2-t,H+2*t),
            cylinder(re,H/2+t,ins),
            cylinder(re,-H/2-t-ins,ins),
        ]
        fluid_height=H*fill/100
        parts["liquid"]=[cylinder(ri,-H/2,fluid_height)] if fluid_height>0 else []
        parts["gas"]=[cylinder(ri,-H/2+fluid_height,H-fluid_height)] if fluid_height<H else []
        parts["support"]=[]
        w=support_width/1000
        leg=support_height/1000
        for i in range(supports):
            angle=2*math.pi*i/max(1,supports)
            x=.72*R*math.cos(angle)
            z=.72*R*math.sin(angle)
            parts["support"].append(occ.addBox(x-w/2,-H/2-t-leg,z-w/2,w,leg,w))
        # Supports pass through the bottom insulation to contact the steel bottom cap.
        # Subtract their physical volumes from insulation BEFORE fragmentation.
        # The supports themselves remain unchanged, so they have no overlapping
        # material volume but retain common contact faces with adjacent materials.
        if parts["support"]:
            cut_insulation,_=occ.cut(
                [(3,tag) for tag in parts["insulation"]],
                [(3,tag) for tag in parts["support"]],
                removeObject=True,removeTool=False
            )
            parts["insulation"]=[tag for dim,tag in cut_insulation if dim==3]
            if not parts["insulation"]:
                raise RuntimeError("Support cut removed the entire insulation domain")
        occ.synchronize()
        original=[(3,tag) for tags in parts.values() for tag in tags]
        # OCC fragments produce conformal interfaces, including between supports and lower cap.
        _,mapping=occ.fragment(original,[])
        occ.synchronize()
        # Map each original material to its fragments. OCC may return overlapping maps at
        # coincident interfaces; each volume must have exactly one owning material.
        owners={}
        names=[name for name,tags in parts.items() for _ in tags]
        for name,fragments in zip(names,mapping):
            for dim,tag in fragments:
                if dim!=3: continue
                if tag in owners and owners[tag]!=name:
                    raise RuntimeError(f"Ambiguous material volume {tag}: {owners[tag]} vs {name}")
                owners[tag]=name
        for name in parts:
            tags=[tag for tag,owner in owners.items() if owner==name]
            if tags:
                group=gmsh.model.addPhysicalGroup(3,tags)
                gmsh.model.setPhysicalName(3,group,name)
        gmsh.option.setNumber("Mesh.CharacteristicLengthMin", min(t/2,mesh_size/1000))
        gmsh.option.setNumber("Mesh.CharacteristicLengthMax", mesh_size/1000)
        gmsh.option.setNumber("Mesh.Algorithm3D", 10)
        gmsh.model.mesh.generate(3)
        node_tags,coords,_=gmsh.model.mesh.getNodes()
        points={int(tag):[float(coords[3*i+j]) for j in range(3)] for i,tag in enumerate(node_tags)}
        index={tag:i for i,tag in enumerate(points)}
        pts=list(points.values())
        tets=[]
        regions=[]
        for _,physical in gmsh.model.getPhysicalGroups(3):
            name=gmsh.model.getPhysicalName(3,physical)
            for volume in gmsh.model.getEntitiesForPhysicalGroup(3,physical):
                types,_,element_nodes=gmsh.model.mesh.getElements(3,volume)
                for typ,nodes in zip(types,element_nodes):
                    if gmsh.model.mesh.getElementProperties(typ)[0]!="Tetrahedron 4":
                        raise RuntimeError("Only first-order tetrahedra are supported")
                    for i in range(0,len(nodes),4):
                        tets.append([index[int(n)] for n in nodes[i:i+4]])
                        regions.append(name)
        payload={"pts":pts,"tets":tets,"regions":regions,
                 "metadata":{"units":"m","meshType":"conformal OCC fragments",
                             "thermalSolved":False,"supports":supports,"fillPercent":fill}}
        Path(output).write_text(json.dumps(payload,separators=(",",":")),encoding="utf-8")
        return {"nodes":len(pts),"tetrahedra":len(tets),"materials":sorted(set(regions))}
    finally:
        gmsh.finalize()

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",default="vessel-mesh.json")
    parser.add_argument("--mesh-size",type=float,default=80)
    args=parser.parse_args()
    print(build(args.output,mesh_size=args.mesh_size))
