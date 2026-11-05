const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('fem-beta.html','utf8');
const match=html.match(/function fem\(p\)\{[\s\S]*?\n\}\nlet worker=null;/);
assert.ok(match,'FEM solver function found');
const context={Math,Number,Float64Array,Map,Array,Error};
vm.createContext(context);vm.runInContext(match[0].replace(/\nlet worker=null;$/,''),context);
const base={diam:273,wall:8,ins:45,power:30,count:2,air:-45,h:12,ki:.04,ks:45,kw:.6,water:5,mode:'closed'};
const run=p=>vm.runInContext('fem('+JSON.stringify(p)+')',context,{timeout:30000});
for(const mode of ['closed','fixed']){
 const m=run({...base,mode});
 assert.ok(Number.isFinite(m.water)&&Number.isFinite(m.qout));
 assert.ok(m.tri.length>2000);
 assert.ok(Math.abs(m.balance)<1,'energy balance '+mode+': '+m.balance);
 if(mode==='fixed')assert.ok(Math.abs(m.water-5)<.5);
 console.log('PASS',mode,'triangles',m.tri.length,'iterations',m.iterations,'water',m.water,'qout',m.qout,'balance',m.balance);
}
const a=run({...base,power:0,mode:'closed'});
assert.ok(Math.abs(a.water-base.air)<1,'no heater should equilibrate to ambient');
console.log('PASS zero-source equilibrium');
