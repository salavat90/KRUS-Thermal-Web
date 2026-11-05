'use strict';
const PI=Math.PI,assert=require('node:assert/strict');
function annulus(rings,sectors){
 const ri=.1365,ro=.1815,k=.04,h=12,Ti=5,Ta=-45;
 const pts=[],tri=[],edges=[],at=(j,i)=>j*sectors+(i%sectors);
 for(let j=0;j<=rings;j++)for(let i=0;i<sectors;i++){let r=ri+(ro-ri)*j/rings,a=2*PI*i/sectors;pts.push([r*Math.cos(a),r*Math.sin(a)])}
 for(let j=0;j<rings;j++)for(let i=0;i<sectors;i++){let a=at(j,i),b=at(j,i+1),c=at(j+1,i),d=at(j+1,i+1);tri.push([a,c,d],[a,d,b])}
 for(let i=0;i<sectors;i++)edges.push([at(rings,i),at(rings,i+1)]);
 const n=pts.length,K=Array.from({length:n},()=>new Map()),f=new Float64Array(n),fixed=i=>i<sectors;
 const add=(a,b,v)=>K[a].set(b,(K[a].get(b)||0)+v);
 for(const t of tri){let p=t.map(i=>pts[i]),A=Math.abs((p[1][0]-p[0][0])*(p[2][1]-p[0][1])-(p[2][0]-p[0][0])*(p[1][1]-p[0][1]))/2;
 let bx=[p[1][1]-p[2][1],p[2][1]-p[0][1],p[0][1]-p[1][1]],by=[p[2][0]-p[1][0],p[0][0]-p[2][0],p[1][0]-p[0][0]];
 for(let a=0;a<3;a++)for(let b=0;b<3;b++)add(t[a],t[b],k*(bx[a]*bx[b]+by[a]*by[b])/(4*A))}
 for(const [a,b] of edges){let L=Math.hypot(pts[a][0]-pts[b][0],pts[a][1]-pts[b][1]);add(a,a,h*L/3);add(b,b,h*L/3);add(a,b,h*L/6);add(b,a,h*L/6);f[a]+=h*Ta*L/2;f[b]+=h*Ta*L/2}
 let d=new Float64Array(n),b=new Float64Array(n),adj=Array.from({length:n},()=>[]);
 for(let i=sectors;i<n;i++){let rhs=f[i];for(const [j,v] of K[i]){if(fixed(j))rhs-=v*Ti;else if(j===i)d[i]+=v;else adj[i].push([j,v])}b[i]=rhs}
 let x=new Float64Array(n),r=new Float64Array(n),z=new Float64Array(n),p=new Float64Array(n),Ap=new Float64Array(n),rz=0,norm=0;
 for(let i=sectors;i<n;i++){r[i]=b[i];z[i]=r[i]/d[i];p[i]=z[i];rz+=r[i]*z[i];norm+=b[i]*b[i]}
 let res=Infinity,iter=0;
 for(;iter<10000;iter++){let rr=0;for(let i=sectors;i<n;i++)rr+=r[i]*r[i];res=Math.sqrt(rr);if(res<Math.max(1e-12,Math.sqrt(norm)*1e-10))break;
 let den=0;for(let i=sectors;i<n;i++){let v=d[i]*p[i];for(const [j,a] of adj[i])v+=a*p[j];Ap[i]=v;den+=p[i]*v}assert.ok(den>0);let alpha=rz/den,next=0;
 for(let i=sectors;i<n;i++){x[i]+=alpha*p[i];r[i]-=alpha*Ap[i];z[i]=r[i]/d[i];next+=r[i]*z[i]}let beta=next/rz;for(let i=sectors;i<n;i++)p[i]=z[i]+beta*p[i];rz=next}
 assert.ok(iter<10000,'PCG convergence');
 for(let i=0;i<sectors;i++)x[i]=Ti;
 let qout=0,qin=0;for(const [a,b] of edges){let L=Math.hypot(pts[a][0]-pts[b][0],pts[a][1]-pts[b][1]);qout+=h*L*((x[a]+x[b])/2-Ta)}
 for(let i=0;i<sectors;i++){let v=-f[i];for(const [j,a] of K[i])v+=a*x[j];qin+=v}
 let exact=(Ti-Ta)/(Math.log(ro/ri)/(2*PI*k)+1/(h*2*PI*ro));
 return {nodes:n,triangles:tri.length,iterations:iter,heatLossWm:qout,analyticalWm:exact,relativeError:Math.abs(qout-exact)/exact,energyResidualWm:qin-qout};
}
const meshes=[[4,48],[8,96],[16,192]].map(x=>annulus(...x));
for(const m of meshes)console.log(JSON.stringify(m));
assert.ok(meshes[2].relativeError<meshes[1].relativeError&&meshes[1].relativeError<meshes[0].relativeError);
assert.ok(meshes[2].relativeError<.005);
assert.ok(meshes.every(m=>Math.abs(m.energyResidualWm)<1e-5));
console.log('PASS: P1 triangular FEM, mesh convergence, and conservation');
