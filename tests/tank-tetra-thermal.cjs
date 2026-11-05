const assert=require('node:assert/strict');
const {buildRandomizedTetraMesh,solveTankTetra}=require('../3d/tetra-thermal.js');
const p={diameter:273,height:1000,wall:8,insulation:45,lambdaSteel:45,lambdaInsulation:.04,tProduct:5,tAmbient:-45,hOutside:12,angular:12,steelLayers:2,insulationLayers:2,axial:4,metalPoints:30,insulationPoints:60,seed:42};
const a=buildRandomizedTetraMesh(p),b=buildRandomizedTetraMesh(p),c=buildRandomizedTetraMesh({...p,seed:43});
assert.deepEqual(a.pts,b.pts);assert.notDeepEqual(a.pts,c.pts);
assert.equal(a.stats.randomInteriorNodes,90);
const faces=new Map();
for(const t of a.tets)for(const f of [[0,1,2],[0,1,3],[0,2,3],[1,2,3]]){const key=f.map(j=>t[j]).sort((x,y)=>x-y).join(':');faces.set(key,(faces.get(key)||0)+1)}
assert.ok([...faces.values()].every(v=>v===1||v===2),'nonmanifold faces');
const r=solveTankTetra(p);
const ri=(p.diameter/2-p.wall)/1000,ro=p.diameter/2000,re=ro+p.insulation/1000,L=p.height/1000;
const analytical=(p.tProduct-p.tAmbient)/(Math.log(ro/ri)/(2*Math.PI*p.lambdaSteel*L)+Math.log(re/ro)/(2*Math.PI*p.lambdaInsulation*L)+1/(p.hOutside*2*Math.PI*re*L));
assert.ok(Number.isFinite(r.qOut)&&r.qOut>0);
assert.ok(Math.abs(r.balance)<.05,'balance '+r.balance);
assert.ok(Math.abs(r.qOut-analytical)/analytical<.15,'analytical discrepancy '+r.qOut+' vs '+analytical);
console.log('PASS random tetra FEM',JSON.stringify({nodes:r.mesh.stats.nodes,tets:r.mesh.stats.tetrahedra,loss:r.qOut,analytical,balance:r.balance,iterations:r.iterations}));
