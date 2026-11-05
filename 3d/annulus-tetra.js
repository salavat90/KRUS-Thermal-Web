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
 // Six-tetrahedron Freudenthal decomposition per structured hexahedral cell.
 // All adjacent cells share identical face diagonals, including periodic angular seam.
 const cornerOffsets=[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]];
 const templates=[[0,1,3,7],[0,1,5,7],[0,2,3,7],[0,2,6,7],[0,4,5,7],[0,4,6,7]];
 for(let k=0;k<axial;k++)for(let j=0;j<radial;j++)for(let i=0;i<angular;i++){
  const ids=cornerOffsets.map(([di,dj,dk])=>index(k+dk,j+dj,i+di));
  for(const t of templates)tets.push(t.map(v=>ids[v]));
 }
 let minVolume=Infinity,negative=0;
 for(const t of tets){
  const [a,b,c,d]=t.map(i=>pts[i]),u=b.map((v,i)=>v-a[i]),v=c.map((x,i)=>x-a[i]),w=d.map((x,i)=>x-a[i]);
  const vol=(u[0]*(v[1]*w[2]-v[2]*w[1])-u[1]*(v[0]*w[2]-v[2]*w[0])+u[2]*(v[0]*w[1]-v[1]*w[0]))/6;
  if(Math.abs(vol)<1e-15)throw Error('Degenerate tetrahedron');
  if(vol<0){negative++;[t[1],t[2]]=[t[2],t[1]];}
  minVolume=Math.min(minVolume,Math.abs(vol));
 }
 return {pts,tets,stats:{nodes:pts.length,tetrahedra:tets.length,minVolume,negative}};
}
if(typeof module!=='undefined')module.exports={makeAnnulusTetraMesh};
