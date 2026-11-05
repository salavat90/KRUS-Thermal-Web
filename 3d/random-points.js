'use strict';
// Seeded, independent 3D point sampling. This is NOT a tetrahedral mesh.
function makeTankRandomPoints(p){
 const {diameter,height,wall,insulation,fill=30,metalPoints=3000,liquidPoints=5000,insulationPoints=7000,seed=42}=p;
 const values=[diameter,height,wall,insulation,fill,metalPoints,liquidPoints,insulationPoints,seed];
 if(!values.every(Number.isFinite)||diameter<=2*wall||wall<=0||height<=0||insulation<=0||fill<0||fill>100||![metalPoints,liquidPoints,insulationPoints].every(n=>Number.isInteger(n)&&n>=0&&n<=50000)||!Number.isInteger(seed))throw Error('Invalid random point parameters');
 let state=seed|0;const rand=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296};
 const ri=(diameter/2-wall)/1000,rs=diameter/2000,re=rs+insulation/1000,H=height/1000,level=-H/2+H*fill/100;
 const result={metal:[],liquid:[],insulation:[]};
 function sample(name,count,rmin,rmax,ymin,ymax){
  if(count===0||rmax<=rmin||ymax<=ymin)return;
  const arr=result[name],heightSpan=ymax-ymin;
  for(let i=0;i<count;i++){
   const theta=2*Math.PI*rand(),u=rand(),v=rand(),w=rand();
   // Mixture: 70% within the near-interface boundary layers, 30% in the volume.
   let radius;
   if(u<.35)radius=rmin+(rmax-rmin)*.08*Math.pow(v,1.8);
   else if(u<.7)radius=rmax-(rmax-rmin)*.08*Math.pow(v,1.8);
   else radius=Math.sqrt(rmin*rmin+(rmax*rmax-rmin*rmin)*v);
   let y;
   if(w<.2)y=ymin+heightSpan*.04*Math.pow(rand(),2);
   else if(w<.4)y=ymax-heightSpan*.04*Math.pow(rand(),2);
   else y=ymin+heightSpan*rand();
   arr.push(radius*Math.cos(theta),y,radius*Math.sin(theta));
  }
 }
 sample('metal',metalPoints,ri,rs,-H/2,H/2);
 sample('liquid',liquidPoints,0,ri,-H/2,level);
 sample('insulation',insulationPoints,rs,re,-H/2,H/2);
 return {points:result,stats:{metal:result.metal.length/3,liquid:result.liquid.length/3,insulation:result.insulation.length/3,seed},geometry:{ri,rs,re,H,level}};
}
if(typeof module!=='undefined')module.exports={makeTankRandomPoints};
