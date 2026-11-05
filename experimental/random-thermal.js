'use strict';
function solveRandomThermal(input){
 const {pts,tri,centers,p}=input, n=pts.length,nt=tri.length/3;
 const ro=p.d/2000,ri=ro-p.wall/1000,R=ro+p.ins/1000;
 const k=[0,p.kw,p.ks,p.ki,p.kc],regions=new Uint8Array(nt),area=new Float64Array(nt),sources=new Float64Array(nt);
 const diag=new Float64Array(n),rhs=new Float64Array(n),rows=Array.from({length:n},()=>new Map()),outer=new Map();
 const add=(a,b,v)=>{if(a===b)diag[a]+=v;else rows[a].set(b,(rows[a].get(b)||0)+v)};
 let cableAreas=new Float64Array(p.cables),cableTris=Array.from({length:p.cables},()=>[]);
 for(let q=0;q<nt;q++){
  const ids=[tri[3*q],tri[3*q+1],tri[3*q+2]],v=ids.map(i=>pts[i]),cx=(v[0][0]+v[1][0]+v[2][0])/3000,cy=(v[0][1]+v[1][1]+v[2][1])/3000,r=Math.hypot(cx,cy);
  let reg=r<ri?1:r<ro?2:3,cable=-1;
  for(let j=0;j<centers.length;j++)if(Math.hypot(cx-centers[j][0]/1000,cy-centers[j][1]/1000)<p.cd/2000){reg=4;cable=j;break}
  const A=Math.abs((v[1][0]-v[0][0])*(v[2][1]-v[0][1])-(v[2][0]-v[0][0])*(v[1][1]-v[0][1]))/2e6;
  if(!(A>1e-17))throw Error('Вырожденный треугольник');
  regions[q]=reg;area[q]=A;
  if(cable>=0){cableAreas[cable]+=A;cableTris[cable].push(q)}
 }
 // Source is integrated over each cable-labeled triangle. A cable must be resolved by the mesh.
 for(let j=0;j<p.cables;j++){
  if(cableAreas[j]<=0)throw Error('Кабель '+(j+1)+' не разрешён сеткой; увеличьте количество точек');
  for(let q of cableTris[j])sources[q]=p.power*area[q]/cableAreas[j];
 }
 for(let q=0;q<nt;q++){
  const ids=[tri[3*q],tri[3*q+1],tri[3*q+2]],v=ids.map(i=>pts[i]),bx=[v[1][1]-v[2][1],v[2][1]-v[0][1],v[0][1]-v[1][1]],by=[v[2][0]-v[1][0],v[0][0]-v[2][0],v[1][0]-v[0][0]];
  // All length factors cancel in 2D P1 stiffness.
  for(let a=0;a<3;a++)for(let b=0;b<3;b++)add(ids[a],ids[b],k[regions[q]]*(bx[a]*bx[b]+by[a]*by[b])/(4*area[q]*1e6));
  for(let a=0;a<3;a++)rhs[ids[a]]+=sources[q]/3;
 }
 // External boundary is the convex hull of the sampled circular domain.
 const boundary=new Map();
 for(let q=0;q<nt;q++)for(let e=0;e<3;e++){
  const a=tri[3*q+e],b=tri[3*q+(e+1)%3],key=a<b?a+':'+b:b+':'+a;
  if(boundary.has(key))boundary.delete(key);else boundary.set(key,[a,b]);
 }
 for(const [a,b] of boundary.values()){
  const L=Math.hypot(pts[a][0]-pts[b][0],pts[a][1]-pts[b][1])/1000;
  add(a,a,p.h*L/3);add(b,b,p.h*L/3);add(a,b,p.h*L/6);add(b,a,p.h*L/6);
  rhs[a]+=p.h*p.air*L/2;rhs[b]+=p.h*p.air*L/2;
 }
 const fixed=new Uint8Array(n);
 if(p.mode==='fixed')for(let i=0;i<n;i++)if(Math.hypot(pts[i][0],pts[i][1])/1000<ri-1e-8)fixed[i]=1;
 const x=new Float64Array(n),b=new Float64Array(n),r=new Float64Array(n),z=new Float64Array(n),d=new Float64Array(n),Ad=new Float64Array(n);
 let norm=0,rz=0;
 for(let i=0;i<n;i++){x[i]=fixed[i]?p.water:p.air;if(fixed[i])continue;let v=rhs[i];for(const [j,g] of rows[i])if(fixed[j])v-=g*p.water;b[i]=v}
 for(let i=0;i<n;i++){if(fixed[i])continue;if(!(diag[i]>0))throw Error('Некорректная FEM-матрица');let ax=diag[i]*x[i];for(const [j,g] of rows[i])if(!fixed[j])ax+=g*x[j];r[i]=b[i]-ax;z[i]=r[i]/diag[i];d[i]=z[i];rz+=r[i]*z[i];norm+=b[i]*b[i]}
 let iterations=0,res=Infinity;
 for(;iterations<5000;iterations++){
  let rr=0;for(let i=0;i<n;i++)if(!fixed[i])rr+=r[i]*r[i];res=Math.sqrt(rr);
  if(res<Math.max(1e-9,Math.sqrt(norm)*1e-8))break;
  let den=0;for(let i=0;i<n;i++){if(fixed[i])continue;let v=diag[i]*d[i];for(const [j,g] of rows[i])if(!fixed[j])v+=g*d[j];Ad[i]=v;den+=d[i]*v}
  if(!(den>0))throw Error('Матрица не положительно определена');
  let alpha=rz/den,next=0;for(let i=0;i<n;i++){if(fixed[i])continue;x[i]+=alpha*d[i];r[i]-=alpha*Ad[i];z[i]=r[i]/diag[i];next+=r[i]*z[i]}
  let beta=next/rz;for(let i=0;i<n;i++)if(!fixed[i])d[i]=z[i]+beta*d[i];rz=next;
 }
 if(iterations===5000)throw Error('Решатель не сошёлся за 5000 итераций');
 let qout=0;
 for(const [a,b] of boundary.values()){let L=Math.hypot(pts[a][0]-pts[b][0],pts[a][1]-pts[b][1])/1000;qout+=p.h*L*((x[a]+x[b])/2-p.air)}
 let qwater=0;if(p.mode==='fixed')for(let i=0;i<n;i++)if(fixed[i]){let v=diag[i]*x[i]-rhs[i];for(const [j,g] of rows[i])v+=g*x[j];qwater-=v}
 let min=Infinity,max=-Infinity,water=0,nwater=0,cableMax=Array.from({length:p.cables},()=>-Infinity);
 for(let i=0;i<n;i++){min=Math.min(min,x[i]);max=Math.max(max,x[i]);if(Math.hypot(pts[i][0],pts[i][1])/1000<ri){water+=x[i];nwater++}}
 for(let j=0;j<p.cables;j++)for(const q of cableTris[j])for(let a=0;a<3;a++)cableMax[j]=Math.max(cableMax[j],x[tri[3*q+a]]);
 return {t:Array.from(x),regions:Array.from(regions),min,max,water:water/nwater,cableMax,qout,qwater,source:p.power*p.cables,balance:p.power*p.cables+qwater-qout,iterations,triangles:nt};
}
if(typeof module!=='undefined')module.exports={solveRandomThermal};
