const assert=require('node:assert/strict');
const {solveUnifiedTankFEM}=require('../3d/unified-fem.js');
const p={diameter:2000,height:3500,wall:8,insulation:100,supports:4,fill:30,nx:20,ny:32,nz:20,tProduct:80,tAmbient:-40,lambdaSteel:45,lambdaInsulation:.04,hOutside:12};
assert.throws(()=>solveUnifiedTankFEM(p),/Сетка не разрешает стенку/);
console.log('PASS: underresolved real-world 8 mm wall is rejected rather than producing fake temperatures');
