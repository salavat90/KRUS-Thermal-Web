'use strict';
const assert=require('node:assert/strict');
const {solveRandomThermal}=require('../experimental/random-thermal.js');
function mesh(){
 const pts=[[0,0]],tri=[],N=72,rings=12,R=50;
 const idx=(j,i)=>1+j*N+(i%N);
 for(let j=1;j<=rings;j++)for(let i=0;i<N;i++){const a=2*Math.PI*i/N,r=R*j/rings;pts.push([r*Math.cos(a),r*Math.sin(a)])}
 for(let i=0;i<N;i++)tri.push(0,idx(0,i),idx(0,i+1));
 for(let j=0;j<rings-1;j++)for(let i=0;i<N;i++){const a=idx(j,i),b=idx(j,i+1),c=idx(j+1,i),d=idx(j+1,i+1);tri.push(a,c,d,a,d,b)}
 return {pts,tri};
}
const base={d:60,wall:5,ins:20,cd:6,cables:1,power:20,air:-30,h:12,kw:.6,ks:45,ki:.04,kc:.25,water:5,mode:'closed'};
const {pts,tri}=mesh(),ang=Math.PI/4,centers=[[(base.d/2+base.cd/2)*Math.cos(ang),(base.d/2+base.cd/2)*Math.sin(ang)]];
function run(p){return solveRandomThermal({pts,tri,centers,p})}
const a=run(base),b=run({...base,power:30}),zero=run({...base,power:0});
assert.ok(Math.abs(a.balance)<.05,'energy conservation '+a.balance);
assert.ok(Math.abs(a.source-20)<1e-9);
assert.ok(b.water>a.water,'higher power must heat water');
assert.ok(b.qout>a.qout,'higher power must raise losses');
assert.ok(Math.abs(zero.water-base.air)<.2,'zero source equilibrium');
assert.ok(Math.abs(zero.qout)<.2,'zero source losses');
const fixed=run({...base,mode:'fixed',power:0});
assert.ok(Math.abs(fixed.water-5)<.1,'fixed water condition');
assert.ok(Math.abs(fixed.qwater-fixed.qout)<.05,'fixed water heat flux');
console.log('PASS: energy, power response, no-source equilibrium, fixed-water heat flux');
console.log(JSON.stringify({closed:a,zero:{water:zero.water,qout:zero.qout},fixed:{water:fixed.water,qout:fixed.qout,qwater:fixed.qwater}},(k,v)=>k==='t'||k==='regions'?undefined:v,2));
