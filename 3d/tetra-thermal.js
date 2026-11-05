'use strict';
const layered=typeof require==='function'?require('./layered-tetra.js'):null;
function buildRandomizedTetraMesh(opts){
 const base=(layered?layered.makeLayeredTankMesh:makeLayeredTankMesh)(opts);
 const {pts,tets,regions}=base;
 const budgets={steel:Number(opts.metalPoints||0),insulation:Number(opts.insulationPoints||0)};
 if(!Object.values(budgets).every(v=>Number.isSafeInteger(v)&&v>=0))throw Error('Point budgets must be non-negative safe integers');
 let state=(opts.seed|0)||1;
 const rand=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296};
 // Repeated independent interior insertion allows requested counts beyond the initial tetra count.
 // Each split replaces one tetrahedron with four; its external faces are unchanged.
 for(const material of ['steel','insulation']){
  const count=budgets[material];
  let eligible=[];for(let i=0;i<regions.length;i++)if(regions[i]===material)eligible.push(i);
  let added=0;
  while(added<count){
   const batch=Math.min(count-added,eligible.length);
   for(let i=eligible.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[eligible[i],eligible[j]]=[eligible[j],eligible[i]]}
   const chosen=new Set(eligible.slice(0,batch)),newT=[],newR=[];
   for(let i=0;i<tets.length;i++){
    const t=tets[i];
    if(!chosen.has(i)){newT.push(t);newR.push(regions[i]);continue}
    const w=Array.from({length:4},()=>.25+rand()),sum=w.reduce((a,b)=>a+b,0);
    const point=[0,0,0];for(let j=0;j<4;j++)for(let c=0;c<3;c++)point[c]+=pts[t[j]][c]*w[j]/sum;
    const id=pts.length;pts.push(point);
    for(const face of [[0,1,2],[0,1,3],[0,2,3],[1,2,3]]){newT.push([id,...face.map(j=>t[j])]);newR.push(regions[i])}
   }
   tets.splice(0,tets.length,...newT);regions.splice(0,regions.length,...newR);
   added+=batch;
   eligible=[];for(let i=0;i<regions.length;i++)if(regions[i]===material)eligible.push(i);
  }
 }
 return {...base,stats:{...base.stats,nodes:pts.length,tetrahedra:tets.length,randomInteriorNodes:pts.length-base.stats.nodes}};
}
function solveTankTetra(opts){
 const mesh=buildRandomizedTetraMesh(opts),{pts,tets,regions}=mesh,n=pts.length;
 const ri=(opts.diameter/2-opts.wall)/1000,re=opts.diameter/2000+opts.insulation/1000;
 const H=opts.height/1000,Ti=opts.tProduct,Ta=opts.tAmbient,h=opts.hOutside;
 if(![Ti,Ta,h,opts.lambdaSteel,opts.lambdaInsulation].every(Number.isFinite)||h<=0||opts.lambdaSteel<=0||opts.lambdaInsulation<=0)throw Error('Invalid thermal parameters');
 const rows=Array.from({length:n},()=>new Map()),rhs=new Float64Array(n),diag=new Float64Array(n);
 const add=(a,b,v)=>{if(a===b)diag[a]+=v;else rows[a].set(b,(rows[a].get(b)||0)+v)};
 const faces=new Map(),key=f=>f.slice().sort((a,b)=>a-b).join(':');
 let minVol=Infinity;
 for(let q=0;q<tets.length;q++){
  const t=tets[q],p=t.map(i=>pts[i]),e=[1,2,3].map(j=>p[j].map((v,c)=>v-p[0][c]));
  const det=e[0][0]*(e[1][1]*e[2][2]-e[1][2]*e[2][1])-e[0][1]*(e[1][0]*e[2][2]-e[1][2]*e[2][0])+e[0][2]*(e[1][0]*e[2][1]-e[1][1]*e[2][0]);
  const vol=Math.abs(det)/6;if(vol<1e-16)throw Error('Degenerate tetrahedron');minVol=Math.min(minVol,vol);
  const inv=[
   [(e[1][1]*e[2][2]-e[1][2]*e[2][1])/det,(e[0][2]*e[2][1]-e[0][1]*e[2][2])/det,(e[0][1]*e[1][2]-e[0][2]*e[1][1])/det],
   [(e[1][2]*e[2][0]-e[1][0]*e[2][2])/det,(e[0][0]*e[2][2]-e[0][2]*e[2][0])/det,(e[0][2]*e[1][0]-e[0][0]*e[1][2])/det],
   [(e[1][0]*e[2][1]-e[1][1]*e[2][0])/det,(e[0][1]*e[2][0]-e[0][0]*e[2][1])/det,(e[0][0]*e[1][1]-e[0][1]*e[1][0])/det]
  ];
  const grad=[[-inv[0][0]-inv[0][1]-inv[0][2],-inv[1][0]-inv[1][1]-inv[1][2],-inv[2][0]-inv[2][1]-inv[2][2]]];
  for(let j=0;j<3;j++)grad.push([inv[0][j],inv[1][j],inv[2][j]]);
  const conductivity=regions[q]==='steel'?opts.lambdaSteel:opts.lambdaInsulation;
  for(let i=0;i<4;i++)for(let j=0;j<4;j++)add(t[i],t[j],conductivity*vol*grad[i].reduce((s,v,c)=>s+v*grad[j][c],0));
  for(const f of [[0,1,2],[0,1,3],[0,2,3],[1,2,3]]){const face=f.map(j=>t[j]),k=key(face);if(faces.has(k))faces.delete(k);else faces.set(k,face)}
 }
 const boundary=[];
 for(const face of faces.values()){
  const p=face.map(i=>pts[i]),r=p.map(v=>Math.hypot(v[0],v[2]));
  if(!r.every(v=>Math.abs(v-re)<1e-5))continue;
  const u=p[1].map((v,c)=>v-p[0][c]),v=p[2].map((x,c)=>x-p[0][c]);
  const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const A=Math.hypot(...cross)/2;boundary.push({face,A});
  for(let i=0;i<3;i++){rhs[face[i]]+=h*Ta*A/3;for(let j=0;j<3;j++)add(face[i],face[j],h*A*(i===j?1/6:1/12))}
 }
 const fixed=new Uint8Array(n);
 for(let i=0;i<n;i++)if(Math.abs(Math.hypot(pts[i][0],pts[i][2])-ri)<1e-5)fixed[i]=1;
 const x=new Float64Array(n),r=new Float64Array(n),z=new Float64Array(n),d=new Float64Array(n),Ad=new Float64Array(n),b=new Float64Array(n);
 let rz=0,norm=0,free=0;
 for(let i=0;i<n;i++){x[i]=fixed[i]?Ti:Ta;if(fixed[i])continue;free++;let v=rhs[i];for(const [j,a] of rows[i])if(fixed[j])v-=a*Ti;b[i]=v}
 for(let i=0;i<n;i++){if(fixed[i])continue;let ax=diag[i]*x[i];for(const [j,a] of rows[i])if(!fixed[j])ax+=a*x[j];r[i]=b[i]-ax;z[i]=r[i]/diag[i];d[i]=z[i];rz+=r[i]*z[i];norm+=b[i]*b[i]}
 let it=0,relative=Infinity;
 for(;it<8000;it++){
  let rr=0;for(let i=0;i<n;i++)if(!fixed[i])rr+=r[i]*r[i];
  relative=Math.sqrt(rr)/Math.max(1,Math.sqrt(norm));
  if(relative<1e-8)break;
  let den=0;for(let i=0;i<n;i++){if(fixed[i])continue;let v=diag[i]*d[i];for(const [j,a] of rows[i])if(!fixed[j])v+=a*d[j];Ad[i]=v;den+=d[i]*v}
  if(!(den>0))throw Error('FEM matrix not SPD');
  const alpha=rz/den;let next=0;
  for(let i=0;i<n;i++){if(fixed[i])continue;x[i]+=alpha*d[i];r[i]-=alpha*Ad[i];z[i]=r[i]/diag[i];next+=r[i]*z[i]}
  const beta=next/rz;for(let i=0;i<n;i++)if(!fixed[i])d[i]=z[i]+beta*d[i];rz=next;
 }
 if(it===8000)throw Error('PCG did not converge');
 let qOut=0;for(const {face,A} of boundary)qOut+=h*A*(face.reduce((s,i)=>s+x[i],0)/3-Ta);
 let qIn=0;for(let i=0;i<n;i++)if(fixed[i]){let f=diag[i]*x[i]-rhs[i];for(const [j,a] of rows[i])f+=a*x[j];qIn+=f}
 let min=Infinity,max=-Infinity;for(const value of x){if(value<min)min=value;if(value>max)max=value;}
 return {mesh,temperature:Array.from(x),qOut,qIn,balance:qIn-qOut,iterations:it,relativeResidual:relative,min,max,minVolume:minVol,outerFaces:boundary.length,freeNodes:free};
}
if(typeof module!=='undefined')module.exports={buildRandomizedTetraMesh,solveTankTetra};
