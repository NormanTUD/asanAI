#!/usr/bin/env node
const puppeteer = require('puppeteer-core');
const URL = 'http://localhost/asanai/blog/atlas.php';
async function main() {
    const browser = await puppeteer.launch({ executablePath:'/usr/bin/chromium', headless:'new',
        args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 700 });
    await page.goto(URL, { waitUntil:'load', timeout:90000 });
    await page.waitForFunction(()=>{var st=window.__ATLAS_DEBUG&&window.__ATLAS_DEBUG.state;return st&&st.dots.length>0;},{timeout:60000}).catch(e=>console.log('boot:',e.message));
    await new Promise(r=>setTimeout(r,1500));
    const res = await page.evaluate(()=>{
        var AD=window.__ATLAS_DEBUG, THREE=window.THREE;
        var group=AD.threadGroup(); group.updateWorldMatrix(true,false);
        var mw=group.matrixWorld;
        var rs=[], min=1e9,max=0;
        var nearSurface=0; // radius < 1.03 (would mean old 1.01 base)
        group.children.forEach(function(line){
            if(!line.geometry) return;
            var arr=line.geometry.attributes.position.array;
            for(var i=0;i<arr.length;i+=3){
                var v=new THREE.Vector3(arr[i],arr[i+1],arr[i+2]).applyMatrix4(mw);
                var r=v.length(); rs.push(r);
                if(r<min)min=r; if(r>max)max=r;
                if(r<1.03) nearSurface++;
            }
        });
        rs.sort(function(a,b){return a-b;});
        var q=f=>rs[Math.floor(f*rs.length)];
        return { n:rs.length, min:+min.toFixed(4), p01:+q(0.01).toFixed(4), med:+q(0.5).toFixed(4), max:+max.toFixed(4), nearSurface };
    });
    console.log('LINE VERTEX RADII  '+JSON.stringify(res));
    // also dump the actual greatCircle base from the served function
    const src = await page.evaluate(()=>{
        var m = String(bootAtlas).match(/ARC_BASE\s*=\s*([0-9.]+)/);
        return m? m[1] : 'not found in source';
    }).catch(()=>'?');
    console.log('ARC_BASE in live bootAtlas source:', src);
    await browser.close();
}
main().catch(e=>{console.error('FATAL',e.message);process.exit(2);});
