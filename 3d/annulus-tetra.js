'use strict';
// Structured conforming tetrahedral mesh for a cylindrical annulus only.
// Coordinates in metres. Adjacent cells share node indices.
function makeAnnulusTetraMesh({innerRadius,outerRadius,height,angular=48,radial=4,axial=12}){
 if(!(innerRadius>0&&outerRadius>innerRadius&&height>0&&Number.isInteger(angular)&&angular>=8&&Number.isInteger(radial)&&radial>=1&&Number.isInteger(axial)&&axial>=1))throw Error('Invalid annulus mesh parameters');
 const pts=[],tets=[];
 const index=(k,j,i)=>((k*(radial+1)+j)*angular+(i%angular));
 for(let k=0;k<=axial;k++)for(let j=0;j<=radial;j++)for(let i=0;i<angular;i++){
  const r=innerRadius+(outerRadius-innerRadius)*j/radial,a=2*Math.PI*i/angular;
  pts.push([r*Math.cos(a),-height/2+height*k/axial,r*Math.sin(a)]);
 }
 // Consistent diagonal on every circumferential-radial quadrilateral.
 // Each prism is divided into 3 tetrahedra using a consistent vertex ordering.
 for(let k=0;k<axial;k++)for(let j=0;j<radial;j++)for(let i=0;i<angular;i++){
  const a=index(k,j,i),b=index(k,j,i+1),c=index(k,j+1,i),d=index(k,j+1,i+1);
  const A=index(k+1,j,i),B=index(k+1,j,i+1),C=index(k+1,j+1,i),D=index(k+1,j+1,i+1);
  const prisms=[[a,b,d,A,B,D],[a,d,c,A,D,C]];
  for(const [u,v,w,U,V,W] of prisms)tets.push([u,v,w,W],[u,v,V,W],[u,U,V,W]);
 }
 let minVolume=Infinity,negative=0;
 for(const t of tets){
  const [a,b,c,d]=t.map(i=>pts[i]),u=b.map((v,i)=>v-a[i]),v=c.map((x,i)=>x-a[i]),w=d.map((x,i)=>x-a[i]);
  const vol=(u[0]*(v[1]*w[2]-v[2]*w[1])-u[1]*(v[0]*w[2]-v[2]*w[0])+u[2]*(v[0]*w[1]-v[1]*w[0]))/6;
  if(Math.abs(vol)<1e-15)throw Error('Degenerate tetrahedron');
  if(vol<0)negative++;
  minVolume=Math.min(minVolume,Math.abs(vol));
 }
 return {pts,tets,stats:{nodes:pts.length,tetrahedra:tets.length,minVolume,negative}};
}
if(typeof module!=='undefined')module.exports={makeAnnulusTetraMesh};
