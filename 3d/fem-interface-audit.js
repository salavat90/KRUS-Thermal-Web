'use strict';
// Topology and material-interface audit for any shared-node tetrahedral mesh.
// This is a prerequisite for coupling tank caps and supports to the FEM matrix.
function auditTetraInterfaces(mesh){
 const {pts,tets,regions}=mesh;
 if(!Array.isArray(pts)||!Array.isArray(tets)||!Array.isArray(regions)||regions.length!==tets.length)throw Error('Invalid mesh arrays');
 const faces=new Map(),counts={},volumes={},invalid=[];
 const local=[[0,1,2],[0,1,3],[0,2,3],[1,2,3]];
 for(let q=0;q<tets.length;q++){
  const tet=tets[q],mat=regions[q];counts[mat]=(counts[mat]||0)+1;
  if(tet.length!==4||new Set(tet).size!==4||tet.some(i=>!Number.isInteger(i)||i<0||i>=pts.length)){invalid.push(q);continue}
  const [a,b,c,d]=tet.map(i=>pts[i]);
  const u=b.map((v,i)=>v-a[i]),v=c.map((x,i)=>x-a[i]),w=d.map((x,i)=>x-a[i]);
  const volume=Math.abs(u[0]*(v[1]*w[2]-v[2]*w[1])-u[1]*(v[0]*w[2]-v[2]*w[0])+u[2]*(v[0]*w[1]-v[1]*w[0]))/6;
  if(!Number.isFinite(volume)||volume<=1e-16)invalid.push(q);
  volumes[mat]=(volumes[mat]||0)+volume;
  for(const face of local){
   const key=face.map(i=>tet[i]).sort((a,b)=>a-b).join(':');
   if(!faces.has(key))faces.set(key,[]);
   faces.get(key).push({tet:q,material:mat});
  }
 }
 const interfaces={},exterior={},nonmanifold=[];
 for(const [key,owners] of faces){
  if(owners.length>2){nonmanifold.push(key);continue}
  if(owners.length===1)exterior[owners[0].material]=(exterior[owners[0].material]||0)+1;
  else if(owners[0].material!==owners[1].material){
   const pair=[owners[0].material,owners[1].material].sort().join(' / ');
   interfaces[pair]=(interfaces[pair]||0)+1;
  }
 }
 return {counts,volumes,interfaces,exterior,nonmanifold:nonmanifold.length,invalidTetrahedra:invalid.length,faceCount:faces.size,valid:invalid.length===0&&nonmanifold.length===0};
}
if(typeof module!=='undefined')module.exports={auditTetraInterfaces};
