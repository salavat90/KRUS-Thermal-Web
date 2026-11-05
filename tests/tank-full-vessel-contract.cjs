const assert=require('node:assert/strict');
const {validateFullVesselMesh}=require('../3d/full-vessel-contract.js');
const {makeLayeredTankMesh}=require('../3d/layered-tetra.js');
const old=makeLayeredTankMesh({diameter:273,wall:8,insulation:45,height:1000,angular:12,steelLayers:2,insulationLayers:3,axial:4});
const report=validateFullVesselMesh(old);
assert.equal(report.valid,false);
for(const material of ['liquid','gas','support','topCap','bottomCap'])assert.ok(report.missing.includes(material));
assert.ok(report.interfaces.includes('insulation/steel'));
console.log('PASS: partial cylindrical FEM cannot masquerade as full-vessel FEM');
