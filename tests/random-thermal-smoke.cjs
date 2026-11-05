'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('experimental/random-thermal.js','utf8');
const ctx={Math,Number,Float64Array,Uint8Array,Map,Array,Error,module:{exports:{}}};
vm.createContext(ctx);vm.runInContext(src,ctx);
const p={d:40,wall:4,ins:10,cd:6,cables:1,power:10,air:-20,h:12,kw:.6,ks:45,ki:.04,kc:.25,water:5,mode:'closed'};
const pts=[[0,0]],tri=[],N=36,R=30;
for(let j=1;j<=6;j++)for(let i=0;i<N;i++){let a=2*Math.PI*i/N,r=R*j/6;pts.push([r*Math.cos(a),r*Math.sin(a)])}
const idx=(j,i)=>1+j*N+(i%N);
for(let i=0;i<N;i++)tri.push(0,idx(0,i),idx(0,i+1));
for(let j=0;j<5;j++)for(let i=0;i<N;i++){let a=idx(j,i),b=idx(j,i+1),c=idx(j+1,i),d=idx(j+1,i+1);tri.push(a,c,d,a,d,b)}
const center=[(p.d/2+p.cd/2)*Math.cos(Math.PI/4),(p.d/2+p.cd/2)*Math.sin(Math.PI/4)];
const m=ctx.module.exports.solveRandomThermal({pts,tri,centers:[center],p});
assert.ok(Number.isFinite(m.water));assert.ok(Math.abs(m.balance)<.1,'energy balance '+m.balance);
assert.ok(m.cableMax[0]>p.air);console.log('PASS experimental random FEM',m.iterations,m.balance,m.cableMax);
