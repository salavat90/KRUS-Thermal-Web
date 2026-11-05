const assert=require('node:assert/strict');
const {makeUnifiedTankMesh}=require('../3d/unified-tank-mesh.js');
const p={diameter:2000,height:3000,wall:200,insulation:300,supports:4,fill:30,nx:22,ny:30,nz:22,legWidth:300,legHeight:600};
const a=makeUnifiedTankMesh(p),b=makeUnifiedTankMesh({...p,supports:0});
for(const m of ['steel','insulation','liquid','gas','support'])assert.ok(a.stats.counts[m]>0,m+' missing');
assert.equal(b.stats.counts.support,0);
assert.ok(a.stats.tetrahedra>a.stats.counts.steel);
const faces=new Map();
for(const t of a.tets)for(const f of [[0,1,2],[0,1,3],[0,2,3],[1,2,3]]){const key=f.map(i=>t[i]).sort((x,y)=>x-y).join(':');faces.set(key,(faces.get(key)||0)+1)}
assert.ok([...faces.values()].every(n=>n===1||n===2),'nonmanifold tetra faces');
console.log('PASS unified voxel tetra geometry',a.stats);
