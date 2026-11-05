'use strict';
// |q| = lambda * |grad T| in W/m² for each linear tetrahedron.
// This is local conductive heat-flux DENSITY, not total heat loss (W).
function tetraFluxDensity(mesh,temperature,conductivity){
 const result=new Float64Array(mesh.tets.length);
 for(let q=0;q<mesh.tets.length;q++){
  const ids=mesh.tets[q],p=ids.map(i=>mesh.pts[i]);
  const a=p[0],u=p[1].map((x,i)=>x-a[i]),v=p[2].map((x,i)=>x-a[i]),w=p[3].map((x,i)=>x-a[i]);
  const cross=(x,y)=>[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
  const dot=(x,y)=>x.reduce((s,n,i)=>s+n*y[i],0);
  const det=dot(u,cross(v,w));
  if(Math.abs(det)<1e-18)throw Error('Degenerate tetra '+q);
  const du=temperature[ids[1]]-temperature[ids[0]],dv=temperature[ids[2]]-temperature[ids[0]],dw=temperature[ids[3]]-temperature[ids[0]];
  const c1=cross(v,w),c2=cross(w,u),c3=cross(u,v);
  const grad=c1.map((x,i)=>(du*x+dv*c2[i]+dw*c3[i])/det);
  const k=conductivity[mesh.regions[q]];
  if(!(k>0))throw Error('Missing conductivity for '+mesh.regions[q]);
  result[q]=k*Math.hypot(...grad);
 }
 return Array.from(result);
}
if(typeof module!=='undefined')module.exports={tetraFluxDensity};
