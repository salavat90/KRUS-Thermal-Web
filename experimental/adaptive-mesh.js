'use strict';
function makeAdaptiveMesh(p){
 const pi=Math.PI,sec=48,ri=p.d/2-p.wall,ro=p.d/2,R=ro+p.ins;
 if(!(ri>0&&p.wall>0&&p.ins>0&&p.cd>0&&p.count>=1&&p.count<=3))throw Error('Invalid geometry');
 const radii=[0,ri*.5,ri,ro,ro+p.ins*.22,ro+p.ins*.55,R];
 let pts=[[0,0]],tri=[],material=[],idx=(j,i)=>1+j*sec+(i%sec);
 for(let j=1;j<radii.length;j++)for(let i=0;i<sec;i++){let a=2*pi*i/sec;pts.push([radii[j]*Math.cos(a),radii[j]*Math.sin(a)])}
 // first ring fans from origin
 for(let i=0;i<sec;i++){tri.push([0,idx(0,i),idx(0,i+1)]);material.push(1)}
 for(let j=0;j<radii.length-2;j++)for(let i=0;i<sec;i++){
  let a=idx(j,i),b=idx(j,i+1),c=idx(j+1,i),d=idx(j+1,i+1);
  tri.push([a,c,d],[a,d,b]);material.push(j<1?1:j<2?2:3,j<1?1:j<2?2:3);
 }
 const centers=Array.from({length:p.count},(_,i)=>{let a=(135+i*60-90)*pi/180,r=ro+p.cd/2;return [r*Math.cos(a),r*Math.sin(a)]});
 function refine(mark){
  const mid=new Map(),edge=(a,b)=>a<b?a+':'+b:b+':'+a;
  for(let i=0;i<tri.length;i++)if(mark[i]){
   let t=tri[i];for(let e=0;e<3;e++){let a=t[e],b=t[(e+1)%3],key=edge(a,b);if(!mid.has(key)){mid.set(key,pts.length);pts.push([(pts[a][0]+pts[b][0])/2,(pts[a][1]+pts[b][1])/2])}}
  }
  const nt=[],nm=[];
  for(let i=0;i<tri.length;i++){
   const [a,b,c]=tri[i],ab=mid.get(edge(a,b)),bc=mid.get(edge(b,c)),ca=mid.get(edge(c,a));
   const edges=[ab!==undefined,bc!==undefined,ca!==undefined],count=edges.filter(Boolean).length;
   let pieces;
   if(count===0)pieces=[[a,b,c]];
   else if(count===1)pieces=ab!==undefined?[[a,ab,c],[ab,b,c]]:bc!==undefined?[[b,bc,a],[bc,c,a]]:[[c,ca,b],[ca,a,b]];
   else if(count===2){
    pieces=ab===undefined?[[c,ca,bc],[ca,a,b],[ca,b,bc]]:bc===undefined?[[a,ab,ca],[ab,b,c],[ab,c,ca]]:[[b,bc,ab],[bc,c,a],[bc,a,ab]];
   }else pieces=[[a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]];
   for(let t of pieces){nt.push(t);nm.push(material[i])}
  }
  tri=nt;material=nm;
 }
 for(let pass=0;pass<3;pass++){
  const marked=tri.map((t,i)=>{
   const x=(pts[t[0]][0]+pts[t[1]][0]+pts[t[2]][0])/3,y=(pts[t[0]][1]+pts[t[1]][1]+pts[t[2]][1])/3;
   const near=Math.min(...centers.map(c=>Math.hypot(x-c[0],y-c[1])));
   const maxEdge=Math.max(...[0,1,2].map(j=>Math.hypot(pts[t[j]][0]-pts[t[(j+1)%3]][0],pts[t[j]][1]-pts[t[(j+1)%3]][1])));
   const target=near<p.cd*2?p.cd*.65:near<p.cd*5?p.cd*1.6:near<p.cd*12?p.cd*4:Math.max(5,R*.18);
   return maxEdge>target*(pass===0?2:1.3);
  });
  if(!marked.some(Boolean))break;
  refine(marked);
  if(tri.length>100000)throw Error('Mesh element budget exceeded');
 }
 let minArea=Infinity,negative=0;
 for(let t of tri){let [a,b,c]=t.map(i=>pts[i]),A=((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;if(A<0)negative++;minArea=Math.min(minArea,Math.abs(A))}
 const edges=new Map();for(let t of tri)for(let j=0;j<3;j++){let a=t[j],b=t[(j+1)%3],k=a<b?a+':'+b:b+':'+a;edges.set(k,(edges.get(k)||0)+1)}
 return {pts,tri,material,centers,stats:{nodes:pts.length,triangles:tri.length,minArea,negative,nonManifold:[...edges.values()].filter(n=>n>2).length}};
}
if(typeof module!=='undefined')module.exports={makeAdaptiveMesh};
