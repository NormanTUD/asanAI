const { PNG } = require('pngjs');
const fs = require('fs');
const a = PNG.sync.read(fs.readFileSync('/tmp/atlas_on.png'));
const b = PNG.sync.read(fs.readFileSync('/tmp/atlas_off.png'));
let diff=0, maxd=0;
for(let i=0;i<a.data.length;i+=4){
    const d=Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+Math.abs(a.data[i+2]-b.data[i+2]);
    if(d>10)diff++;
    if(d>maxd)maxd=d;
}
console.log('pixels changed(>10/765):',diff,'maxdelta:',maxd,'total:',a.width*a.height);
