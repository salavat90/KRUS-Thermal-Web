'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const dataset=JSON.parse(fs.readFileSync('validation/elcut-reference.json','utf8'));
assert.equal(dataset.cases.length,15);
const ids=new Set();
for(const c of dataset.cases){
 assert.ok(!ids.has(c.id),'duplicate '+c.id);ids.add(c.id);
 for(const k of ['nominalDiameterMm','insulationMm','ambientMinC','alphaWm2K','insulationLambda','heatLossReferenceWm','heaterPowerWm']){
  assert.ok(Number.isFinite(c[k]),c.id+': '+k+' missing');
 }
 assert.ok(c.nominalDiameterMm>0&&c.insulationMm>0&&c.insulationLambda>0&&c.alphaWm2K>0);
 for(const mode of ['circulating','thermalBalance']){
  assert.ok(Number.isFinite(c.elcut[mode].productC));
  assert.ok(Number.isFinite(c.elcut[mode].cableC));
 }
}
// Independent exact solution for concentric pipe + insulation, no cable:
// q = (Tinner-Tambient)/(ln(ro/ri)/(2*pi*ksteel)+ln(rins/ro)/(2*pi*kins)+1/(h*2*pi*rins)).
function cylinderLoss({ri,ro,rins,steelK,insK,h,tInner,tAmbient}){
 const R=Math.log(ro/ri)/(2*Math.PI*steelK)+Math.log(rins/ro)/(2*Math.PI*insK)+1/(h*2*Math.PI*rins);
 return (tInner-tAmbient)/R;
}
const p={ri:.125,ro:.1365,rins:.1815,steelK:45,insK:.04,h:12,tInner:5,tAmbient:-45};
const q=cylinderLoss(p);
assert.ok(q>0&&q<200);
assert.ok(Math.abs(cylinderLoss({...p,tInner:-45,tAmbient:5})+q)<1e-10,'sign reversal');
assert.ok(Math.abs(cylinderLoss({...p,tInner:5,tAmbient:5}))<1e-12,'zero gradient');
assert.ok(cylinderLoss({...p,insK:.08})>q,'higher insulation conductivity increases loss');
assert.ok(cylinderLoss({...p,h:24})>q,'higher external convection increases loss');
assert.ok(cylinderLoss({...p,rins:.23})<q,'thicker insulation reduces loss for this pipe');
console.log('PASS 15 reference cases: schema, unique IDs and numeric fields');
console.log('PASS independent analytical cylindrical heat-loss invariants');
console.log('Analytical example q='+q.toFixed(6)+' W/m');
console.log('NOTE: This is an independent reference, not a passed KRUS-vs-ELCUT comparison.');
