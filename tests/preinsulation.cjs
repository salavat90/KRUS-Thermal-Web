'use strict';
const assert=require('node:assert/strict');
const {solveRandomThermal}=require('../experimental/random-thermal.js');
const N=72,R=65,rings=26,pts=[[0,0]],tri=[];
const idx=(j,i)=>1+j*N+(i%N);
for(let j=1;j<=rings;j++)for(let i=0;i<N;i++){const a=2*Math.PI*i/N,r=R*j/rings;pts.push([r*Math.cos(a),r*Math.sin(a)])}
for(let i=0;i<N;i++)tri.push(0,idx(0,i),idx(0,i+1));
for(let j=0;j<rings-1;j++)for(let i=0;i<N;i++){const a=idx(j,i),b=idx(j,i+1),c=idx(j+1,i),d=idx(j+1,i+1);tri.push(a,c,d,a,d,b)}
const p={d:60,wall:5,ins:20,preins:10,kpre:.013,cd:6,cables:1,power:20,air:-30,h:12,kw:.6,ks:45,ki:.04,kc:.25,water:5,mode:'closed'};
const center=[(p.d/2+p.preins+p.cd/2)*Math.cos(Math.PI/4),(p.d/2+p.preins+p.cd/2)*Math.sin(Math.PI/4)];
const a=solveRandomThermal({pts,tri,centers:[center],p});
assert.ok(Number.isFinite(a.water)&&Number.isFinite(a.qout));
assert.ok(Math.abs(a.balance)<.1,'balance '+a.balance);
const b=solveRandomThermal({pts,tri,centers:[center],p:{...p,kpre:.04}});
assert.ok(Math.abs(a.water-b.water)>.01,'preinsulation conductivity must affect temperature');
console.log('PASS preinsulation influences thermal result; balance',a.balance);
