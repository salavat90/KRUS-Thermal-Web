const assert=require('node:assert/strict');const {makeAnnulusTetraMesh}=require('../3d/annulus-tetra.js');
for(const angular of [12,36]){const m=makeAnnulusTetraMesh({innerRadius:1,outerRadius:1.1,height:3.5,angular,radial:3,axial:8});assert.equal(m.stats.nodes,(8+1)*(3+1)*angular);assert.equal(m.stats.tetrahedra,angular*3*8*6);assert.ok(m.stats.minVolume>0);console.log('mesh',angular,m.stats)}
