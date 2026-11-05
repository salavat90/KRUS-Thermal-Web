'use strict';
const fs=require('node:fs'),vm=require('node:vm');
const data=JSON.parse(fs.readFileSync('validation/elcut-reference.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if(!code)throw Error('Solver script missing');
const defaults={d:273,w:8,ins:45,kp:45,ki:.04,kc:.25,cd:6,pow:30,count:2,ang:135,kw:.6,air:-45,h:12,waterSet:5,mode:'closed'};
const els=new Map();
for(const [id,v] of Object.entries(defaults))els.set(id,{value:String(v),style:{},addEventListener(){}});
els.set('fields',{set innerHTML(x){this.value=x},get innerHTML(){return this.value},addEventListener(){}});
for(const id of ['metrics','status'])els.set(id,{innerHTML:'',textContent:''});
const ctx={setTransform(){},fillRect(){},save(){},restore(){},translate(){},scale(){},beginPath(){},arc(){},fill(){},stroke(){},drawImage(){},createImageData(){return {data:new Uint8ClampedArray(130*130*4)}}};
els.set('c',{clientWidth:800,clientHeight:700,getContext(){return ctx},addEventListener(){},getBoundingClientRect(){return {left:0,top:0}}});
els.set('run',{});els.set('fit',{});
const sandbox={console,Math,Number,Float64Array,Uint8Array,Int16Array,document:{getElementById:id=>{if(!els.has(id))throw Error('Missing DOM field '+id);return els.get(id)},createElement:()=>({getContext(){return ctx}})},window:{addEventListener(){}},devicePixelRatio:1};
vm.createContext(sandbox);vm.runInContext(code,sandbox,{timeout:1000});
const results=[];
for(const c of data.cases){
 for(const [mode,krusMode] of [['circulating','fixed'],['thermalBalance','closed']]){
  // Explicit provisional assumptions; NOT a physically matched ELCUT case.
  const assumptions={outerDiameterMm:c.nominalDiameterMm,wallMm:Math.min(5,c.nominalDiameterMm*.08),cableDiameterMm:6,
    pipeLambda:45,cableLambda:.25,waterLambda:.6,firstCableClockDegrees:135,cableSpacingDegrees:60,
    totalCablePowerWm:c.heaterPowerWm*c.layingCoefficient,
    fixedWaterTemperatureC:c.requiredC,waterModel:krusMode};
  const vals={d:assumptions.outerDiameterMm,w:assumptions.wallMm,ins:c.insulationMm,kp:45,ki:c.insulationLambda,kc:.25,cd:6,
    pow:c.heaterPowerWm,count:c.layingCoefficient,ang:135,kw:.6,air:c.ambientMinC,h:c.alphaWm2K,waterSet:c.requiredC,mode:krusMode};
  for(const [k,v] of Object.entries(vals))els.get(k).value=String(v);
  let result={id:c.id,mode,mesh:'130x130',status:'not-comparable',assumptions,elcut:c.elcut[mode],heatLossReferenceWm:c.heatLossReferenceWm};
  const begin=Date.now();
  try{
    const m=vm.runInContext('solve()',sandbox,{timeout:30000});
    result={...result,execution:'completed',krus:{productC:m.waterMean,cableC:m.max,heatLossWm:m.loss,sourceWm:m.power,
      balanceWm:m.residual,iterations:m.it},difference:{productC:m.waterMean-c.elcut[mode].productC,
      cableC:m.max-c.elcut[mode].cableC},durationMs:Date.now()-begin};
  }catch(e){result={...result,execution:'failed',error:String(e.message||e),durationMs:Date.now()-begin};}
  results.push(result);
  console.log(result.id,mode,result.execution,result.durationMs+'ms');
 }
}
fs.mkdirSync('validation/output',{recursive:true});
fs.writeFileSync('validation/output/low-res-comparison.json',JSON.stringify({generatedAt:new Date().toISOString(),warning:'Exploratory runs with assumed geometry; NOT ELCUT validation.',results},null,2));
const head=['case','mode','execution','ELCUT_product_C','KRUS_product_C','delta_product_C','ELCUT_cable_C','KRUS_hotspot_C','delta_C','KRUS_loss_Wm','KRUS_balance_Wm','duration_ms','error'];
const lines=[head.join(';')];
for(const r of results)lines.push([r.id,r.mode,r.execution,r.elcut.productC,r.krus?.productC??'',r.difference?.productC??'',r.elcut.cableC,r.krus?.cableC??'',r.difference?.cableC??'',r.krus?.heatLossWm??'',r.krus?.balanceWm??'',r.durationMs,r.error??''].join(';'));
fs.writeFileSync('validation/output/low-res-comparison.csv','\ufeff'+lines.join('\r\n'));
console.log('Completed:',results.filter(r=>r.execution==='completed').length,'/',results.length);
console.log('All results are PROVISIONAL and not validated against ELCUT geometry.');
