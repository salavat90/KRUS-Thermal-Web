const assert=require('node:assert/strict');
const {makeAnnulusTetraMesh}=require('../3d/annulus-tetra.js');
for(const angular of [12,36]){
 const radial=3,axial=8;
 const m=makeAnnulusTetraMesh({innerRadius:1,outerRadius:1.1,height:3.5,angular,radial,axial});
 assert.equal(m.stats.nodes,(axial+1)*(radial+1)*angular);
 assert.equal(m.stats.tetrahedra,angular*radial*axial*6);
 assert.ok(m.stats.minVolume>0);
 const faces=new Map();
 for(const t of m.tets)for(const f of [[0,1,2],[0,1,3],[0,2,3],[1,2,3]]){
  const key=f.map(i=>t[i]).sort((a,b)=>a-b).join(':');faces.set(key,(faces.get(key)||0)+1);
 }
 assert.ok([...faces.values()].every(v=>v===1||v===2),'nonmanifold faces');
 const boundary=[...faces.values()].filter(v=>v===1).length;
 assert.equal(boundary,4*angular*(radial+axial),'unexpected internal cracks or missing boundary faces');
 console.log('PASS conforming annulus',angular,m.stats,'boundary faces',boundary);
}
