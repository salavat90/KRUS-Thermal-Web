'use strict';
// Mesh acceptance gate for a future fully coupled vessel FEM.
// Prevents the current cylindrical solver from being presented as all-domain FEM.
const REQUIRED=['steel','insulation','liquid','gas','support','topCap','bottomCap'];
function validateFullVesselMesh(mesh){
 if(!mesh||!Array.isArray(mesh.pts)||!Array.isArray(mesh.tets)||!Array.isArray(mesh.regions)||mesh.tets.length!==mesh.regions.length)throw Error('Некорректная структура FEM-сетки');
 const counts=Object.fromEntries(REQUIRED.map(k=>[k,0]));
 for(const material of mesh.regions)if(material in counts)counts[material]++;
 const missing=REQUIRED.filter(k=>counts[k]===0);
 const faces=new Map(),faceLocal=[[0,1,2],[0,1,3],[0,2,3],[1,2,3]];
 for(let q=0;q<mesh.tets.length;q++){
  const tet=mesh.tets[q];if(tet.length!==4||new Set(tet).size!==4||tet.some(id=>!Number.isInteger(id)||id<0||id>=mesh.pts.length))throw Error('Некорректный тетраэдр '+q);
  for(const face of faceLocal){
   const key=face.map(i=>tet[i]).sort((a,b)=>a-b).join(':');
   const owners=faces.get(key)||[];owners.push(mesh.regions[q]);faces.set(key,owners);
  }
 }
 const nonmanifold=[...faces.values()].filter(v=>v.length>2).length;
 const pairs=new Set();
 for(const owners of faces.values())if(owners.length===2&&owners[0]!==owners[1])pairs.add(owners.slice().sort().join('/'));
 const expected=[['steel','insulation'],['gas','steel'],['liquid','steel'],['bottomCap','support'],['steel','topCap'],['steel','bottomCap']].map(names=>names.sort().join('/'));
 const missingContacts=expected.filter(pair=>!pairs.has(pair));
 return {valid:missing.length===0&&missingContacts.length===0&&nonmanifold===0,counts,missing,missingContacts,nonmanifold,interfaces:[...pairs]};
}
if(typeof module!=='undefined')module.exports={validateFullVesselMesh,REQUIRED};
