const assert=require('node:assert/strict');const {makeTankRandomPoints:f}=require('../3d/random-points.js');
const p={diameter:2000,height:3500,wall:8,insulation:100,fill:30,metalPoints:300,liquidPoints:500,insulationPoints:700,seed:42};
const a=f(p),b=f(p),c=f({...p,seed:43});
assert.deepEqual(a.points,b.points);assert.notDeepEqual(a.points,c.points);
assert.deepEqual([a.stats.metal,a.stats.liquid,a.stats.insulation],[300,500,700]);
for(const [name,coords] of Object.entries(a.points))for(let i=0;i<coords.length;i+=3){
 const [x,y,z]=coords.slice(i,i+3),r=Math.hypot(x,z),g=a.geometry;
 assert.ok(y>=-g.H/2&&y<=g.H/2);
 if(name==='metal')assert.ok(r>=g.ri-1e-10&&r<=g.rs+1e-10);
 if(name==='liquid')assert.ok(r<=g.ri+1e-10&&y<=g.level+1e-10);
 if(name==='insulation')assert.ok(r>=g.rs-1e-10&&r<=g.re+1e-10);
}
console.log('PASS random 3D material point clouds, seed, count and domain containment');
