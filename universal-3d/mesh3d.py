"""Generate an OCC 3D pipe assembly and conforming tetrahedral mesh.
Run: pip install gmsh; python universal-3d/mesh3d.py KRUS-piping-CAD-input.json mesh.json
Units: metres. This is experimental; mesh quality and thermal BC require validation.
"""
import sys,json,math
def generate(project,out,size=.12):
 import gmsh
 assert project['schema']=='KRUS.Thermal.Piping.v1'
 nodes={n['id']:n['p'] for n in project['nodes']}
 if not project['segments']:raise ValueError('No segments')
 gmsh.initialize()
 try:
  gmsh.model.add('KRUS_pipes')
  occ=gmsh.model.occ
  shells=[];channels=[];outer=[]
  for e in project['segments']:
   a=nodes[e['a']];b=nodes[e['b']];d=[b[i]-a[i] for i in range(3)]
   R=float(e['diameter'])/2000;w=float(e['wall'])/1000;ins=float(e['insulation'])/1000
   if not(0<w<R and ins>=0 and math.dist(a,b)>1e-5):raise ValueError('Bad pipe '+e['id'])
   shells.append((3,occ.addCylinder(*a,*d,R)))
   channels.append((3,occ.addCylinder(*a,*d,R-w)))
   outer.append((3,occ.addCylinder(*a,*d,R+ins)))
  def union(vol):
   if len(vol)==1:return vol
   result,_=occ.fuse(vol[:1],vol[1:],removeObject=True,removeTool=True)
   return result
  env=union(shells);fluid=union(channels);outside=union(outer)
  steel,_=occ.cut(env,fluid,removeObject=False,removeTool=False)
  insulation,_=occ.cut(outside,env,removeObject=False,removeTool=False)
  parts={'steel':steel,'insulation':insulation,'fluid':fluid}
  original=[(name,entity) for name,ents in parts.items() for entity in ents]
  _,mapping=occ.fragment([original[0][1]],[v for _,v in original[1:]],removeObject=True,removeTool=True)
  occ.synchronize()
  material={}
  for (name,_),outparts in zip(original,mapping):
   for dim,tag in outparts:
    if dim!=3:continue
    if tag in material and material[tag]!=name:raise ValueError('Material overlap at volume '+str(tag))
    material[tag]=name
  ids={'steel':1,'insulation':2,'fluid':3}
  for name,id in ids.items():
   tags=[tag for tag,mat in material.items() if mat==name]
   if tags:gmsh.model.addPhysicalGroup(3,tags,id);gmsh.model.setPhysicalName(3,id,name)
  gmsh.option.setNumber('Mesh.CharacteristicLengthMax',size)
  gmsh.option.setNumber('Mesh.CharacteristicLengthMin',size*.35)
  gmsh.model.mesh.generate(3)
  nodeids,xyz,_=gmsh.model.mesh.getNodes()
  index={int(n):i for i,n in enumerate(nodeids)}
  pts=[list(map(float,xyz[i:i+3])) for i in range(0,len(xyz),3)]
  tets=[];regions=[]
  for name,id in ids.items():
   for tag in gmsh.model.getEntitiesForPhysicalGroup(3,id):
    types,_,arrays=gmsh.model.mesh.getElements(3,int(tag))
    for typ,arr in zip(types,arrays):
     if gmsh.model.mesh.getElementProperties(typ)[3]!=4:raise ValueError('First order tetrahedra only')
     for i in range(0,len(arr),4):
      tets.append([index[int(v)] for v in arr[i:i+4]]);regions.append(name)
  if not tets:raise ValueError('No tetrahedra')
  with open(out,'w') as f:json.dump({'points':pts,'tets':tets,'regions':regions},f)
  return len(pts),len(tets)
 finally:gmsh.finalize()
if __name__=='__main__':
 with open(sys.argv[1]) as f:project=json.load(f)
 print('nodes/tets',generate(project,sys.argv[2],float(sys.argv[3]) if len(sys.argv)>3 else .12))
