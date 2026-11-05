const assert=require('node:assert/strict');
const {solveFullVesselFEM}=require('../3d/full-vessel-fem.js');
// Seven tetrahedra, each sharing one triangular face with its neighbor.
const pts=[];for(let i=0;i<10;i++){const a=i*2.3999632297;pts.push([Math.cos(a),Math.sin(a),i*.37])}
const regions=['liquid','steel','gas','topCap','insulation','bottomCap','support'];
const tets=regions.map((_,i)=>[i,i+1,i+2,i+3]);
const p={lambdaSteel:45,lambdaInsulation:.04,lambdaSupport:45,tProduct:80,tAmbient:-40,hOutside:12};
const r=solveFullVesselFEM({pts,tets,regions},p);
assert.ok(Number.isFinite(r.qOut)&&r.qOut>0);
assert.ok(Math.abs(r.balance)<1e-5,'energy balance '+r.balance);
assert.ok(r.temperature.every(v=>Number.isFinite(v)));
assert.ok(r.qByRegion.support!==undefined);
console.log('PASS coupled seven-region tetra solver',r.qOut,r.balance,r.iterations);
