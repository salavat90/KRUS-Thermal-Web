'use strict';
// Exact plane/tetrahedron intersections with linearly interpolated nodal temperatures.
// Output triangles in 2D coordinates; coplanar faces are handled by unique-point deduplication.
function sliceTetraField(mesh,temperature,plane='XZ',offset=0){
 const axis={XY:2,XZ:1,YZ:0}[plane];
 if(axis===undefined||!Number.isFinite(offset))throw Error('Invalid slice plane');
 const axes=plane==='XY'?[0,1]:plane==='XZ'?[0,2]:[1,2],tris=[],eps=1e-10;
 const edges=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
 const counts={},materials=[];
 for(let q=0;q<mesh.tets.length;q++){
  const tet=mesh.tets[q],region=mesh.regions?.[q]||'unknown';
  const pts=tet.map(id=>mesh.pts[id]),dist=pts.map(p=>p[axis]-offset);
  if(dist.every(d=>d>eps)||dist.every(d=>d< -eps))continue;
  const poly=[];
  function add(p,t){
   if(poly.some(q=>Math.hypot(q.x-p[axes[0]],q.y-p[axes[1]])<eps))return;
   poly.push({x:p[axes[0]],y:p[axes[1]],t});
  }
  for(let i=0;i<4;i++)if(Math.abs(dist[i])<=eps)add(pts[i],temperature[tet[i]]);
  for(const [a,b] of edges){
   if(dist[a]*dist[b]>=-eps*eps||Math.abs(dist[a]-dist[b])<eps)continue;
   const f=dist[a]/(dist[a]-dist[b]);
   if(f< -eps||f>1+eps)continue;
   const p=pts[a].map((v,k)=>v+(pts[b][k]-v)*f);
   add(p,temperature[tet[a]]+(temperature[tet[b]]-temperature[tet[a]])*f);
  }
  if(poly.length<3)continue;
  const cx=poly.reduce((s,p)=>s+p.x,0)/poly.length,cy=poly.reduce((s,p)=>s+p.y,0)/poly.length;
  poly.sort((a,b)=>Math.atan2(a.y-cy,a.x-cx)-Math.atan2(b.y-cy,b.x-cx));
  for(let j=1;j<poly.length-1;j++){
   const t=[poly[0],poly[j],poly[j+1]];
   const area=Math.abs((t[1].x-t[0].x)*(t[2].y-t[0].y)-(t[1].y-t[0].y)*(t[2].x-t[0].x));
   if(area>1e-15){tris.push(t);materials.push(region);counts[region]=(counts[region]||0)+1;}
  }
 }
 return {triangles:tris,materials,plane,offset,counts};
}
if(typeof module!=='undefined')module.exports={sliceTetraField};
