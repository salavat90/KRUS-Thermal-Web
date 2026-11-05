const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../3d/fem-lab.html'),'utf8');
for(const id of ['slicePlane','sliceOffset','sliceCanvas','sliceMesh','slicePoints','sliceLegend','supports','supportArea','supportLength','metalPoints','insulationPoints','seed'])assert.ok(html.includes('id="'+id+'"'),'missing main FEM UI: '+id);
for(const src of ['tetra-thermal.js','tetra-slice.js','attachments-heat.js'])assert.ok(html.includes(src),'missing script: '+src);
assert.ok(html.includes('solveTankTetra(p)'));
assert.ok(html.includes('sliceTetraField('));
assert.ok(!html.includes('unified-fem.js'),'coarse voxel FEM must not replace validated lab');
console.log('PASS primary FEM Lab UI preserves thermal slices, random vertices and attachment controls');
