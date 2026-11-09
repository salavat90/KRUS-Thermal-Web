"""Experimental steady-state 3D P1 tetrahedral FEM, steel+insulation+fluid.
pip install numpy scipy; python universal-3d/solve3d.py mesh.json conditions.json result.json
Fluid is fixed-temperature Dirichlet; exterior is Robin convection; heating is
uniform volumetric source in steel. Not validated for engineering design.
"""
import sys,json
from collections import defaultdict
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import spsolve
def solve(mesh,cfg):
 pts=np.asarray(mesh['points'],float);tet=np.asarray(mesh['tets'],int);tags=np.asarray(mesh['regions'])
 if len(tet)==0 or len(tags)!=len(tet):raise ValueError('Bad mesh')
 lam={'steel':float(cfg.get('lambdaSteel',45)),'insulation':float(cfg.get('lambdaInsulation',.04))}
 Tfluid=float(cfg.get('fluidTemperature',60));Ta=float(cfg.get('ambientTemperature',-40))
 h=float(cfg.get('hOutside',12));P=float(cfg.get('heaterPowerTotal',0))
 if min(lam.values())<=0 or h<0 or P<0:raise ValueError('Bad thermal conditions')
 active=np.flatnonzero(tags!='fluid');nodes=np.unique(tet[active].ravel())
 ids={int(v):i for i,v in enumerate(nodes)};n=len(nodes)
 faces=defaultdict(list)
 for ti,t in enumerate(tet):
  for ix in ((0,1,2),(0,1,3),(0,2,3),(1,2,3)):
   faces[tuple(sorted(int(t[j]) for j in ix))].append(ti)
 rr=[];cc=[];vv=[];rhs=np.zeros(n);volumes={};steelvol=0
 for ti in active:
  t=tet[ti];M=np.column_stack((np.ones(4),pts[t]))
  V=abs(np.linalg.det(M))/6
  if V<1e-15:raise ValueError('Degenerate tetrahedron')
  volumes[ti]=V
  if tags[ti]=='steel':steelvol+=V
  grad=np.linalg.inv(M)[1:,:]
  K=lam[str(tags[ti])]*V*(grad.T@grad)
  ix=[ids[int(v)] for v in t]
  for a in range(4):
   for b in range(4):rr.append(ix[a]);cc.append(ix[b]);vv.append(K[a,b])
 if P and not steelvol:raise ValueError('No heated steel')
 for ti in active:
  if tags[ti]=='steel':
   for v in tet[ti]:rhs[ids[int(v)]]+=P*volumes[ti]/steelvol/4
 fixednodes=set();exterior=[]
 for face,adj in faces.items():
  solids=[ti for ti in adj if tags[ti]!='fluid']
  if len(solids)!=1:continue
  if any(tags[ti]=='fluid' for ti in adj):
   fixednodes.update(face);continue
  if len(adj)!=1:continue
  a,b,c=pts[list(face)];area=np.linalg.norm(np.cross(b-a,c-a))/2
  ix=[ids[int(v)] for v in face]
  for i in range(3):
   rhs[ix[i]]+=h*area*Ta/3
   for j in range(3):
    rr.append(ix[i]);cc.append(ix[j]);vv.append(h*area*(2 if i==j else 1)/12)
  exterior.append((ix,area))
 fixed=np.array([ids[v] for v in fixednodes if v in ids],int)
 if not len(fixed):raise ValueError('No fluid contact')
 A=coo_matrix((vv,(rr,cc)),shape=(n,n)).tocsr()
 free=np.ones(n,bool);free[fixed]=False
 T=np.full(n,Tfluid)
 T[free]=spsolve(A[free][:,free],rhs[free]-A[free][:,fixed]@T[fixed])
 if not np.isfinite(T).all():raise ValueError('Nonfinite temperatures')
 qout=sum(h*area*(np.mean(T[ix])-Ta) for ix,area in exterior)
 qfluid=float((A@T-rhs)[fixed].sum())
 balance=P+qfluid-qout
 rel=abs(balance)/max(1,abs(P),abs(qout),abs(qfluid))
 return {'points':pts[nodes].tolist(),'tets':[[ids[int(v)] for v in tet[ti]] for ti in active],
 'regions':[str(tags[ti]) for ti in active],'temperature':T.tolist(),
 'summary':{'minC':float(T.min()),'maxC':float(T.max()),'heaterW':P,
 'ambientLossW':float(qout),'fluidReactionW':qfluid,'balanceW':float(balance),
 'relativeBalance':float(rel),'validated':bool(rel<1e-5),
 'nodes':n,'tetrahedra':len(active)}}
if __name__=='__main__':
 with open(sys.argv[1]) as f:mesh=json.load(f)
 with open(sys.argv[2]) as f:cfg=json.load(f)
 with open(sys.argv[3],'w') as f:json.dump(solve(mesh,cfg),f)
