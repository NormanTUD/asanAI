const puppeteer = require('puppeteer-core');
async function main() {
    const browser = await puppeteer.launch({ executablePath:'/usr/bin/chromium', headless:'new',
        args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 700 });
    const logs=[]; page.on('console',m=>logs.push(m.text()));
    await page.goto('http://localhost/asanai/blog/atlas.php', { waitUntil:'load', timeout:90000 });
    await page.waitForFunction(()=>{var st=window.__ATLAS_DEBUG&&window.__ATLAS_DEBUG.state;return st&&st.threads&&st.threads.length>0;},{timeout:60000}).catch(e=>console.log('boot:',e.message));
    await new Promise(r=>setTimeout(r,2500));
    const res = await page.evaluate(()=>{
        var st=window.__ATLAS_DEBUG.state;
        var tg=window.__ATLAS_DEBUG.threadGroup();
        tg.updateWorldMatrix(true,false);
        var vis=0, hidden=0, opacities={}, k=0;
        var minR=999,maxR=0;
        tg.children.forEach(function(ln){
            if(ln.visible)vis++; else hidden++;
            if(ln.visible){ k++; opacities[ln.material.opacity.toFixed(2)]=(opacities[ln.material.opacity.toFixed(2)]||0)+1; }
            if(ln.geometry&&ln.geometry.attributes.position){
                var arr=ln.geometry.attributes.position.array;
                var mw=tg.matrixWorld;
                for(var i=0;i<arr.length;i+=3){
                    var x=arr[i],y=arr[i+1],z=arr[i+2];
                    var v=new (window.THREE.Vector3)(x,y,z).applyMatrix4(mw);
                    var r=Math.hypot(v.x,v.y,v.z); if(r<minR)minR=r; if(r>maxR)maxR=r;
                }
            }
        });
        return { d:st.d, phi:st.phi, theta:st.theta, year:st.year,
                 nThreads:st.threads.length, lineObjs:tg.children.length,
                 visible:vis, hidden:hidden, opacities:opacities,
                 minLineR:minR.toFixed(3), maxLineR:maxR.toFixed(3),
                 tshow:st.tshow };
    });
    console.log(JSON.stringify(res,null,1));
    await browser.close();
}
main().catch(e=>{console.error('FATAL',e.message);process.exit(2);});
