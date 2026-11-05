const assert=require('node:assert/strict');
const {makeAdaptiveMesh}=require('../experimental/adaptive-mesh.js');
for(const d of [50,273,1400]){
 const m=makeAdaptiveMesh({d,wall:Math.min(8,d*.08),ins:d===1400?200:45,cd:6,count:2});
 assert.ok(m.stats.triangles>0&&m.stats.nodes>0);
 assert.equal(m.stats.nonManifold,0);
 assert.ok(m.stats.minArea>0);
 assert.equal(m.stats.negative,0);
 const edges=new Map();for(const t of m.tri)for(let j=0;j<3;j++){let a=t[j],b=t[(j+1)%3],k=a<b?a+':'+b:b+':'+a;edges.set(k,(edges.get(k)||0)+1)}
 assert.ok([...edges.values()].every(n=>n===1||n===2));
 console.log('PASS mesh',d,m.stats);
}
