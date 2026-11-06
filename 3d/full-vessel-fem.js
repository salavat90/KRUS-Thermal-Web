'use strict';
// Coupled P1 tetrahedral steady conduction for a conforming imported vessel mesh.
// Liquid is thermostated; gas is conductive (no fluid motion). All solid regions
// share nodal unknowns, including caps and supports. Exterior faces use Robin BC.
function solveFullVesselFEM(mesh,p){
 const pts=mesh.pts,tets=mesh.tets,regions=mesh.regions;
 if(!Array.isArray(pts)||!Array.isArray(tets)||!Array.isArray(regions)||tets.length!==regions.length)throw Error('Invalid vessel mesh');
 const names=['steel','topCap','bottomCap','insulation','liquid','gas','support'];
 const k={steel:p.lambdaSteel,topCap:p.lambdaSteel,bottomCap:p.lambdaSteel,insulation:p.lambdaInsulation,liquid:p.lambdaLiquid??.6,gas:p.lambdaGas??.026,support:p.lambdaSupport??p.lambdaSteel};
 const count={};for(const name of regions)count[name]=(count[name]||0)+1;
 for(const name of names)if(!(count[name]>0))throw Error('Missing FEM domain: '+name);
 if(Object.values(k).some(v=>!Number.isFinite(v)||v<=0))throw Error('Invalid material conductivity');
 const Ti=p.tProduct,Ta=p.tAmbient,h=p.hOutside;
 if(![Ti,Ta,h].every(Number.isFinite)||h<=0)throw Error('Invalid boundary conditions');
 const used=new Set();for(const tet of tets)for(const id of tet)used.add(id);
 const original=[...used].sort((a,b)=>a-b),lookup=new Map(original.map((id,i)=>[id,i]));
 const n=original.length,rows=Array.from({length:n},()=>new Map()),diag=new Float64Array(n),rhs=new Float64Array(n),fixed=new Uint8Array(n);
 const add=(i,j,v)=>{if(i===j)diag[i]+=v;else rows[i].set(j,(rows[i].get(j)||0)+v)};
 const faces=new Map(),local=[[0,1,2],[0,1,3],[0,2,3],[1,2,3]];
 for(let q=0;q<tets.length;q++){
  const ids=tets[q].map(id=>lookup.get(id)),P=ids.map(id=>pts[original[id]]);
  const e=[1,2,3].map(j=>P[j].map((v,c)=>v-P[0][c]));
  const [a,b,c]=e,det=a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]);
  if(!Number.isFinite(det)||Math.abs(det)<1e-18)throw Error('Degenerate tetra '+q);
  const inv=[
   [(b[1]*c[2]-b[2]*c[1])/det,(a[2]*c[1]-a[1]*c[2])/det,(a[1]*b[2]-a[2]*b[1])/det],
   [(b[2]*c[0]-b[0]*c[2])/det,(a[0]*c[2]-a[2]*c[0])/det,(a[2]*b[0]-a[0]*b[2])/det],
   [(b[0]*c[1]-b[1]*c[0])/det,(a[1]*c[0]-a[0]*c[1])/det,(a[0]*b[1]-a[1]*b[0])/det]
  ];
  const grads=[[-inv[0][0]-inv[0][1]-inv[0][2],-inv[1][0]-inv[1][1]-inv[1][2],-inv[2][0]-inv[2][1]-inv[2][2]]];
  for(let j=0;j<3;j++)grads.push([inv[0][j],inv[1][j],inv[2][j]]);
  const factor=k[regions[q]]*Math.abs(det)/6;
  for(let i=0;i<4;i++)for(let j=0;j<4;j++)add(ids[i],ids[j],factor*grads[i].reduce((s,v,z)=>s+v*grads[j][z],0));
  if(regions[q]==='liquid')for(const id of ids)fixed[id]=1;
  for(const face of local){
   const f=face.map(j=>ids[j]),key=f.slice().sort((x,y)=>x-y).join(':');
   if(faces.has(key)){const v=faces.get(key);v.count++;}else faces.set(key,{f,region:regions[q],count:1});
  }
 }
 const boundary=[];
 for(const {f,region,count:owners} of faces.values()){
  if(owners>2)throw Error('Non-manifold mesh face');
  if(owners!==1)continue;
  // Exposed liquid and gas surfaces are not assigned external convection here.
  if(region==='liquid'||region==='gas')continue;
  const P=f.map(i=>pts[original[i]]),u=P[1].map((v,j)=>v-P[0][j]),v=P[2].map((x,j)=>x-P[0][j]);
  const area=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])/2;
  boundary.push({f,area,region});
  for(let i=0;i<3;i++){rhs[f[i]]+=h*Ta*area/3;for(let j=0;j<3;j++)add(f[i],f[j],h*area*(i===j?1/6:1/12))}
 }
 if(!fixed.some(Boolean))throw Error('Liquid domain has no fixed nodes');
 const x=new Float64Array(n),b=new Float64Array(n),r=new Float64Array(n),z=new Float64Array(n),d=new Float64Array(n),Ad=new Float64Array(n);
 let rz=0,norm=0;
 for(let i=0;i<n;i++){x[i]=fixed[i]?Ti:Ta;if(fixed[i])continue;let v=rhs[i];for(const [j,a] of rows[i])if(fixed[j])v-=a*Ti;b[i]=v}
 for(let i=0;i<n;i++){if(fixed[i])continue;let ax=diag[i]*x[i];for(const [j,a] of rows[i])if(!fixed[j])ax+=a*x[j];r[i]=b[i]-ax;z[i]=r[i]/diag[i];d[i]=z[i];rz+=r[i]*z[i];norm+=b[i]*b[i]}
 let iterations=0,residual=Infinity;
 for(;iterations<10000;iterations++){
  let rr=0;for(let i=0;i<n;i++)if(!fixed[i])rr+=r[i]*r[i];
  residual=Math.sqrt(rr)/Math.max(1,Math.sqrt(norm));if(residual<1e-8)break;
  let den=0;for(let i=0;i<n;i++){if(fixed[i])continue;let v=diag[i]*d[i];for(const [j,a] of rows[i])if(!fixed[j])v+=a*d[j];Ad[i]=v;den+=d[i]*v}
  if(!(den>0))throw Error('FEM matrix not positive definite');
  const alpha=rz/den;let next=0;
  for(let i=0;i<n;i++){if(fixed[i])continue;x[i]+=alpha*d[i];r[i]-=alpha*Ad[i];z[i]=r[i]/diag[i];next+=r[i]*z[i]}
  const beta=next/rz;for(let i=0;i<n;i++)if(!fixed[i])d[i]=z[i]+beta*d[i];rz=next;
 }
 if(iterations===10000)throw Error('FEM solver did not converge');
 let qIn=0;for(let i=0;i<n;i++)if(fixed[i]){let value=diag[i]*x[i]-rhs[i];for(const [j,a] of rows[i])value+=a*x[j];qIn+=value}
 const qByRegion={};let qOut=0;
 for(const {f,area,region} of boundary){const q=h*area*(f.reduce((s,i)=>s+x[i],0)/3-Ta);qOut+=q;qByRegion[region]=(qByRegion[region]||0)+q}
 let min=Infinity,max=-Infinity;for(const t of x){min=Math.min(min,t);max=Math.max(max,t)}
 const overshoot=Math.max(0,max-Math.max(Ti,Ta),Math.min(Ti,Ta)-min);
 const relativeBalance=Math.abs(qIn-qOut)/Math.max(1,Math.abs(qIn),Math.abs(qOut));
 const tempTolerance=1e-3,energyTolerance=1e-3;
 const physics={
  overshoot,relativeBalance,
  valid:overshoot<=tempTolerance&&relativeBalance<=energyTolerance,
  message:overshoot>tempTolerance?'НАРУШЕН ПРИНЦИП МАКСИМУМА':relativeBalance>energyTolerance?'НЕ СОШЁЛСЯ ТЕПЛОВОЙ БАЛАНС':'Контроль диапазона температур и теплового баланса пройден'
 };
 if(!physics.valid)throw Error('Контроль физики FEM: '+physics.message+
  '; T=['+min.toFixed(4)+','+max.toFixed(4)+'] °C, границы=['+Ta+','+Ti+
  '] °C, qIn='+qIn.toFixed(4)+' Вт, qOut='+qOut.toFixed(4)+' Вт, относительный дисбаланс='+relativeBalance.toExponential(3));
 // Remap tetra indices to active FEM nodes for slicing and visualization.
 const remapped={pts:original.map(id=>pts[id]),tets:tets.map(t=>t.map(id=>lookup.get(id))),regions,stats:{nodes:n,tetrahedra:tets.length,randomInteriorNodes:0,counts:count}};
 return {mesh:remapped,temperature:Array.from(x),qIn,qOut,qByRegion,balance:qIn-qOut,iterations,relativeResidual:residual,min,max,physics,fullVessel:true};
}
if(typeof module!=='undefined')module.exports={solveFullVesselFEM};
