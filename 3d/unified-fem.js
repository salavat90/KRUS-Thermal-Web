'use strict';
const meshLib=typeof require==='function'?require('./unified-tank-mesh.js'):null;
function solveUnifiedTankFEM(p){
 const mesh=(meshLib?meshLib.makeUnifiedTankMesh:makeUnifiedTankMesh)(p);
 const {pts,tets,regions,stats}=mesh;
 const wall=p.wall/1000,ins=p.insulation/1000;
 // A Cartesian grid must resolve BOTH the wall and insulation. Otherwise refuse.
 if(stats.pitch[0]>wall/2||stats.pitch[2]>wall/2||stats.pitch[1]>wall/2)throw Error('Сетка не разрешает стенку: нужен шаг не более '+(wall*500).toFixed(2)+' мм по всем осям. Для промышленного расчёта необходим body-fitted генератор.');
 if(ins>0&&Math.max(...stats.pitch)>ins/2)throw Error('Сетка не разрешает изоляцию');
 const k={steel:p.lambdaSteel??45,insulation:p.lambdaInsulation??.04,liquid:p.lambdaLiquid??.6,gas:p.lambdaGas??.026,support:p.lambdaSupport??45};
 if(Object.values(k).some(v=>!Number.isFinite(v)||v<=0))throw Error('Некорректная теплопроводность');
 const Ti=p.tProduct??80,Ta=p.tAmbient??-40,h=p.hOutside??12;
 if(![Ti,Ta,h].every(Number.isFinite)||h<=0)throw Error('Некорректные граничные условия');
 const active=new Map(),ids=[];
 for(const tet of tets)for(const id of tet)if(!active.has(id)){active.set(id,ids.length);ids.push(id)}
 const n=ids.length,rows=Array.from({length:n},()=>new Map()),rhs=new Float64Array(n),fixed=new Uint8Array(n),diag=new Float64Array(n);
 const add=(i,j,v)=>{if(i===j)diag[i]+=v;else rows[i].set(j,(rows[i].get(j)||0)+v)};
 const faceMap=new Map();
 const faceKeys=[[0,1,2],[0,1,3],[0,2,3],[1,2,3]];
 for(let q=0;q<tets.length;q++){
  const t=tets[q].map(id=>active.get(id)),P=t.map(id=>pts[ids[id]]);
  const e=[1,2,3].map(j=>P[j].map((v,c)=>v-P[0][c]));
  const [a,b,c]=e;
  const det=a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]);
  if(Math.abs(det)<1e-18)throw Error('Вырожденный тетраэдр');
  const inv=[
   [(b[1]*c[2]-b[2]*c[1])/det,(a[2]*c[1]-a[1]*c[2])/det,(a[1]*b[2]-a[2]*b[1])/det],
   [(b[2]*c[0]-b[0]*c[2])/det,(a[0]*c[2]-a[2]*c[0])/det,(a[2]*b[0]-a[0]*b[2])/det],
   [(b[0]*c[1]-b[1]*c[0])/det,(a[1]*c[0]-a[0]*c[1])/det,(a[0]*b[1]-a[1]*b[0])/det]
  ];
  const grads=[[-inv[0][0]-inv[0][1]-inv[0][2],-inv[1][0]-inv[1][1]-inv[1][2],-inv[2][0]-inv[2][1]-inv[2][2]]];
  for(let j=0;j<3;j++)grads.push([inv[0][j],inv[1][j],inv[2][j]]);
  const coeff=k[regions[q]]*Math.abs(det)/6;
  for(let i=0;i<4;i++)for(let j=0;j<4;j++)add(t[i],t[j],coeff*grads[i].reduce((s,v,z)=>s+v*grads[j][z],0));
  for(const face of faceKeys){
   const f=face.map(j=>t[j]),key=f.slice().sort((x,y)=>x-y).join(':');
   if(faceMap.has(key))faceMap.delete(key);else faceMap.set(key,{f,region:regions[q]});
  }
 }
 // For this validation stage, the liquid is thermostated (Dirichlet), gas is conductive.
 for(let q=0;q<tets.length;q++)if(regions[q]==='liquid')for(const id of tets[q])fixed[active.get(id)]=1;
 let exposed=0;
 for(const {f,region} of faceMap.values()){
  if(region==='liquid')continue;
  const P=f.map(i=>pts[ids[i]]),u=P[1].map((v,j)=>v-P[0][j]),v=P[2].map((x,j)=>x-P[0][j]);
  const A=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])/2;
  exposed++;
  for(let i=0;i<3;i++){rhs[f[i]]+=h*Ta*A/3;for(let j=0;j<3;j++)add(f[i],f[j],h*A*(i===j?1/6:1/12))}
 }
 if(!fixed.some(Boolean))throw Error('Нет термостатируемой жидкой области');
 const x=new Float64Array(n),b=new Float64Array(n),r=new Float64Array(n),z=new Float64Array(n),d=new Float64Array(n),Ad=new Float64Array(n);
 let rz=0,norm=0;
 for(let i=0;i<n;i++){x[i]=fixed[i]?Ti:Ta;if(fixed[i])continue;let v=rhs[i];for(const [j,g] of rows[i])if(fixed[j])v-=g*Ti;b[i]=v}
 for(let i=0;i<n;i++){if(fixed[i])continue;let ax=diag[i]*x[i];for(const [j,g] of rows[i])if(!fixed[j])ax+=g*x[j];r[i]=b[i]-ax;z[i]=r[i]/diag[i];d[i]=z[i];rz+=r[i]*z[i];norm+=b[i]*b[i]}
 let iterations=0,residual=Infinity;
 for(;iterations<10000;iterations++){
  let rr=0;for(let i=0;i<n;i++)if(!fixed[i])rr+=r[i]*r[i];
  residual=Math.sqrt(rr)/Math.max(1,Math.sqrt(norm));if(residual<1e-8)break;
  let den=0;for(let i=0;i<n;i++){if(fixed[i])continue;let v=diag[i]*d[i];for(const [j,g] of rows[i])if(!fixed[j])v+=g*d[j];Ad[i]=v;den+=d[i]*v}
  if(!(den>0))throw Error('FEM матрица не положительно определена');
  const alpha=rz/den;let next=0;
  for(let i=0;i<n;i++){if(fixed[i])continue;x[i]+=alpha*d[i];r[i]-=alpha*Ad[i];z[i]=r[i]/diag[i];next+=r[i]*z[i]}
  const beta=next/rz;for(let i=0;i<n;i++)if(!fixed[i])d[i]=z[i]+beta*d[i];rz=next;
 }
 if(iterations===10000)throw Error('PCG не сошёлся');
 let qIn=0;for(let i=0;i<n;i++)if(fixed[i]){let v=diag[i]*x[i]-rhs[i];for(const [j,g] of rows[i])v+=g*x[j];qIn+=v}
 let qOut=0;for(const {f,region} of faceMap.values()){if(region==='liquid')continue;const P=f.map(i=>pts[ids[i]]),u=P[1].map((v,j)=>v-P[0][j]),v=P[2].map((v,j)=>v-P[0][j]);const A=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])/2;qOut+=h*A*(f.reduce((s,i)=>s+x[i],0)/3-Ta)}
 return {mesh,activeNodeIds:ids,temperature:Array.from(x),qIn,qOut,balance:qIn-qOut,iterations,residual,exposedFaces:exposed,method:'Voxel tetra FEM; liquid Dirichlet; approximate contacts and geometry'};
}
if(typeof module!=='undefined')module.exports={solveUnifiedTankFEM};
