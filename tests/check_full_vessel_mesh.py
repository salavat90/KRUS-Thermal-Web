import json,sys,collections,math
from pathlib import Path
mesh=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
pts,tets,regions=mesh['pts'],mesh['tets'],mesh['regions']
required={'steel','insulation','liquid','gas','support','topCap','bottomCap'}
counts=collections.Counter(regions)
missing=required-set(counts)
assert not missing,f"Missing materials: {sorted(missing)}; counts={counts}"
assert len(tets)==len(regions)
faces=collections.defaultdict(list)
for n,(tet,region) in enumerate(zip(tets,regions)):
    assert len(set(tet))==4 and all(0<=i<len(pts) for i in tet)
    a,b,c,d=[pts[i] for i in tet]
    u=[b[i]-a[i] for i in range(3)]
    v=[c[i]-a[i] for i in range(3)]
    w=[d[i]-a[i] for i in range(3)]
    det=u[0]*(v[1]*w[2]-v[2]*w[1])-u[1]*(v[0]*w[2]-v[2]*w[0])+u[2]*(v[0]*w[1]-v[1]*w[0])
    assert abs(det)>1e-18,f"Degenerate tet {n}"
    for f in ((0,1,2),(0,1,3),(0,2,3),(1,2,3)):
        faces[tuple(sorted(tet[i] for i in f))].append(region)
assert all(len(v)<=2 for v in faces.values()),"Non-manifold faces"
interfaces=collections.Counter('/'.join(sorted(set(v))) for v in faces.values() if len(v)==2 and v[0]!=v[1])
expected={'insulation/steel','gas/steel','liquid/steel','bottomCap/steel','steel/topCap','bottomCap/support'}
missing_contacts=expected-set(interfaces)
assert not missing_contacts,f"Missing contact interfaces: {sorted(missing_contacts)}; found={dict(interfaces)}"
print("PASS",len(pts),"nodes",len(tets),"tetrahedra",dict(counts),"interfaces",dict(interfaces))
