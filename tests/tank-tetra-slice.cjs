const assert=require('node:assert/strict');
const {sliceTetraField}=require('../3d/tetra-slice.js');
const mesh={pts:[[0,0,0],[1,0,0],[0,1,0],[0,0,1]],tets:[[0,1,2,3]]};
const temp=[0,10,20,30];
for(const plane of ['XY','XZ','YZ']){
 const at0=sliceTetraField(mesh,temp,plane,0);
 assert.ok(at0.triangles.length>=1,plane+' must intersect');
 const mid=sliceTetraField(mesh,temp,plane,.25);
 assert.ok(mid.triangles.length>=1,plane+' must intersect at 0.25');
 for(const tri of mid.triangles)for(const p of tri)assert.ok(Number.isFinite(p.t)&&p.t>=0&&p.t<=30);
 assert.equal(sliceTetraField(mesh,temp,plane,2).triangles.length,0);
}
console.log('PASS tetra slice geometry and nodal interpolation');

const labeled={...mesh,regions:['bottomCap']};const cut=sliceTetraField(labeled,temp,'XY',.25);assert.equal(cut.materials.length,cut.triangles.length);assert.ok(cut.materials.every(v=>v==='bottomCap'));console.log('PASS slice retains material labels for caps and supports');
