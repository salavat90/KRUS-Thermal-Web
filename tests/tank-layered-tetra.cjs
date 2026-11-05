const assert=require('node:assert/strict');
const {makeLayeredTankMesh}=require('../3d/layered-tetra.js');
for(const angular of [12,36]){
 const steelLayers=2,insulationLayers=3,axial=6,nr=steelLayers+insulationLayers;
 const m=makeLayeredTankMesh({angular,steelLayers,insulationLayers,axial});
 assert.equal(m.stats.nodes,(axial+1)*(nr+1)*angular);
 assert.equal(m.stats.tetrahedra,6*angular*nr*axial);
 assert.equal(m.stats.steelTetrahedra,6*angular*steelLayers*axial);
 assert.equal(m.stats.insulationTetrahedra,6*angular*insulationLayers*axial);
 assert.equal(m.stats.interfaceNodes,(axial+1)*angular);
 assert.ok(m.stats.minVolume>0);
 const faces=new Map(),materials=new Map();
 for(let z=0;z<m.tets.length;z++){
  const t=m.tets[z];
  for(const f of [[0,1,2],[0,1,3],[0,2,3],[1,2,3]]){
   const key=f.map(i=>t[i]).sort((a,b)=>a-b).join(':');
   faces.set(key,(faces.get(key)||0)+1);
   if(!materials.has(key))materials.set(key,new Set());materials.get(key).add(m.regions[z]);
  }
 }
 assert.ok([...faces.values()].every(v=>v===1||v===2),'non-manifold face');
 assert.equal([...faces.values()].filter(v=>v===1).length,4*angular*(nr+axial),'internal cracks');
 const interfaces=[...materials].filter(([key,types])=>types.size===2);
 assert.equal(interfaces.length,2*angular*axial,'missing steel/insulation interface');
 assert.ok(interfaces.every(([key])=>faces.get(key)===2));
 console.log('PASS layered mesh',angular,m.stats);
}

const {makeLayeredTankMesh:build}=require('../3d/layered-tetra.js');
const a=build({angular:24,steelLayers:2,insulationLayers:4,axial:8,randomize:.15,seed:42});
const b=build({angular:24,steelLayers:2,insulationLayers:4,axial:8,randomize:.15,seed:42});
const c=build({angular:24,steelLayers:2,insulationLayers:4,axial:8,randomize:.15,seed:43});
assert.deepEqual(a.pts,b.pts,'same seed must reproduce coordinates');
assert.notDeepEqual(a.pts,c.pts,'different seeds must change interior coordinates');
assert.ok(a.stats.minVolume>0);
assert.equal(a.stats.interfaceNodes,24*9);
console.log('PASS seeded random interior nodes and preserved shared interface');
