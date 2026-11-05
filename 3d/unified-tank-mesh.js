'use strict';
// First unified conforming tetrahedral *geometry* prototype.
// Cartesian cells share vertices and face diagonals. Materials are classified by cell center.
// Thin walls are only resolved when voxel pitch is sufficiently small; do not use for engineering FEM yet.
function makeUnifiedTankMesh(p={}){
 const d=p.diameter??2000,h=p.height??3500,wall=p.wall??8,ins=p.insulation??100;
 const supports=p.supports??4,fill=p.fill??30;
 const nx=p.nx??18,ny=p.ny??28,nz=p.nz??18;
 const legWidth=p.legWidth??120,legHeight=p.legHeight??450;
 if(![d,h,wall,ins,supports,fill,nx,ny,nz,legWidth,legHeight].every(Number.isFinite)||
    d<=2*wall||h<=0||wall<=0||ins<0||supports<0||supports>32||!Number.isInteger(supports)||
    fill<0||fill>100||![nx,ny,nz].every(v=>Number.isInteger(v)&&v>=4&&v<=128)||
    legWidth<=0||legHeight<=0)throw Error('Invalid unified tank geometry');
 const R=d/2000,ri=R-wall/1000,outer=R+ins/1000,H=h/1000,legH=legHeight/1000,legW=legWidth/1000;
 const extent=outer+legW,low=-H/2-ins/1000-legH,high=H/2+ins/1000;
 const dx=2*extent/nx,dy=(high-low)/ny,dz=2*extent/nz;
 const pts=[],tets=[],regions=[],counts={steel:0,insulation:0,liquid:0,gas:0,support:0};
 const idx=(i,j,k)=>(j*(nz+1)+k)*(nx+1)+i;
 for(let j=0;j<=ny;j++)for(let k=0;k<=nz;k++)for(let i=0;i<=nx;i++)pts.push([-extent+i*dx,low+j*dy,-extent+k*dz]);
 const offsets=[[0,0,0],[1,0,0],[0,0,1],[1,0,1],[0,1,0],[1,1,0],[0,1,1],[1,1,1]];
 const patterns=[[0,1,3,7],[0,1,5,7],[0,2,3,7],[0,2,6,7],[0,4,5,7],[0,4,6,7]];
 const liquidLevel=-H/2+H*fill/100;
 const supportPositions=Array.from({length:supports},(_,i)=>{const a=2*Math.PI*i/Math.max(1,supports);return [R*.72*Math.cos(a),R*.72*Math.sin(a)]});
 function material(x,y,z){
  const r=Math.hypot(x,z),ay=Math.abs(y),cap=H/2;
  if(y< -cap&&y>=-cap-legH&&supportPositions.some(([sx,sz])=>Math.abs(x-sx)<=legW/2&&Math.abs(z-sz)<=legW/2))return 'support';
  if(ay<=cap){
   if(r<=ri)return y<=liquidLevel?'liquid':'gas';
   if(r<=R)return 'steel';
   if(r<=outer)return 'insulation';
  }else if(ay<=cap+wall/1000&&r<=R)return 'steel';
  else if(ay<=cap+ins/1000+wall/1000&&r<=outer)return 'insulation';
  return null;
 }
 for(let j=0;j<ny;j++)for(let k=0;k<nz;k++)for(let i=0;i<nx;i++){
  const x=-extent+(i+.5)*dx,y=low+(j+.5)*dy,z=-extent+(k+.5)*dz;
  const region=material(x,y,z);if(!region)continue;
  const ids=offsets.map(([di,dj,dk])=>idx(i+di,j+dj,k+dk));
  for(const pat of patterns){tets.push(pat.map(v=>ids[v]));regions.push(region);counts[region]++}
 }
 return {pts,tets,regions,stats:{nodes:pts.length,tetrahedra:tets.length,counts,pitch:[dx,dy,dz],thinWallResolved:Math.min(dx,dy,dz)<=wall/1000,warning:'Voxel approximation. Material boundaries are stair-stepped, supports contacts approximate, thin steel may not resolve. NOT validated for thermal FEM.'}};
}
if(typeof module!=='undefined')module.exports={makeUnifiedTankMesh};
