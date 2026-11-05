'use strict';
// Shared-node structured tetrahedral mesh of the cylindrical steel wall and insulation.
// Ends, supports, liquid and gas are NOT meshed by this module.
function makeLayeredTankMesh({diameter=2000,wall=8,insulation=100,height=3500,angular=48,steelLayers=2,insulationLayers=5,axial=16}={}){
 const vals=[diameter,wall,insulation,height,angular,steelLayers,insulationLayers,axial];
 if(!vals.every(Number.isFinite)||diameter<=2*wall||wall<=0||insulation<=0||height<=0||angular<8||steelLayers<1||insulationLayers<1||axial<1||![angular,steelLayers,insulationLayers,axial].every(Number.isInteger))throw Error('Invalid tank mesh parameters');
 const ri=(diameter/2-wall)/1000,rs=diameter/2000,re=rs+insulation/1000,H=height/1000;
 const radii=[];
 for(let j=0;j<=steelLayers;j++)radii.push(ri+(rs-ri)*j/steelLayers);
 for(let j=1;j<=insulationLayers;j++)radii.push(rs+(re-rs)*j/insulationLayers);
 const nr=radii.length-1,pts=[],tets=[],regions=[];
 const idx=(k,j,i)=>((k*(nr+1)+j)*angular+(i%angular));
 for(let k=0;k<=axial;k++)for(let j=0;j<=nr;j++)for(let i=0;i<angular;i++){
  const a=2*Math.PI*i/angular,r=radii[j];pts.push([r*Math.cos(a),-H/2+H*k/axial,r*Math.sin(a)]);
 }
 const offsets=[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]];
 const patterns=[[0,1,3,7],[0,1,5,7],[0,2,3,7],[0,2,6,7],[0,4,5,7],[0,4,6,7]];
 let minVolume=Infinity,corrected=0;
 for(let k=0;k<axial;k++)for(let j=0;j<nr;j++)for(let i=0;i<angular;i++){
  const ids=offsets.map(([di,dj,dk])=>idx(k+dk,j+dj,i+di));
  for(const pattern of patterns){
   const t=pattern.map(c=>ids[c]),[a,b,c,d]=t.map(id=>pts[id]);
   const u=b.map((x,m)=>x-a[m]),v=c.map((x,m)=>x-a[m]),w=d.map((x,m)=>x-a[m]);
   const vol=(u[0]*(v[1]*w[2]-v[2]*w[1])-u[1]*(v[0]*w[2]-v[2]*w[0])+u[2]*(v[0]*w[1]-v[1]*w[0]))/6;
   if(Math.abs(vol)<1e-16)throw Error('Degenerate tetrahedron');
   if(vol<0){[t[1],t[2]]=[t[2],t[1]];corrected++}
   minVolume=Math.min(minVolume,Math.abs(vol));
   tets.push(t);regions.push(j<steelLayers?'steel':'insulation');
  }
 }
 const interfaceNodes=[];
 for(let k=0;k<=axial;k++)for(let i=0;i<angular;i++)interfaceNodes.push(idx(k,steelLayers,i));
 return {pts,tets,regions,interfaceNodes,stats:{nodes:pts.length,tetrahedra:tets.length,steelTetrahedra:regions.filter(x=>x==='steel').length,insulationTetrahedra:regions.filter(x=>x==='insulation').length,interfaceNodes:interfaceNodes.length,minVolume,corrected}};
}
if(typeof module!=='undefined')module.exports={makeLayeredTankMesh};
