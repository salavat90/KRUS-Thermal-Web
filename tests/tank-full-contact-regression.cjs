const assert=require('node:assert/strict');
const {validateFullVesselMesh}=require('../3d/full-vessel-contract.js');
const materials=['steel','insulation','liquid','gas','support','topCap','bottomCap'];
// Each material has at least one tetra; deliberately connect pairs with shared faces.
const pts=[],tets=[],regions=[];
function tetra(a,b,c,d,region){tets.push([a,b,c,d]);regions.push(region)}
// A common steel tetra with each required contact on distinct faces.
for(let i=0;i<20;i++)pts.push([i,Math.sin(i),Math.cos(i)]);
tetra(0,1,2,3,'steel');
tetra(0,1,2,4,'insulation');
tetra(0,1,3,5,'liquid');
tetra(0,2,3,6,'gas');
tetra(1,2,3,7,'topCap');
tetra(1,2,7,8,'bottomCap');
tetra(2,7,8,9,'support');
const report=validateFullVesselMesh({pts,tets,regions});
assert.equal(report.missing.length,0);
assert.ok(report.interfaces.includes('insulation/steel'));
assert.ok(report.interfaces.includes('bottomCap/support'));
assert.ok(!report.missingContacts.includes('steel/insulation'));
assert.ok(!report.missingContacts.includes('steel/support'));
console.log('PASS normalized interface ordering and support-to-bottom-cap contact',report);
