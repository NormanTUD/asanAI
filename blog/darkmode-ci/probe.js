#!/usr/bin/env node
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost/asanai/blog/atlas.php';
const D = process.env.D || '3.2';
async function main() {
    const browser = await puppeteer.launch({ executablePath:'/usr/bin/chromium', headless:'new',
        args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 700 });
    const errs=[]; page.on('pageerror',e=>errs.push(e.message));
    await page.goto(URL, { waitUntil:'load', timeout:90000 });
    await page.waitForFunction(()=>{var st=window.__ATLAS_DEBUG&&window.__ATLAS_DEBUG.state;return st&&st.dots.length>0;},{timeout:60000}).catch(e=>console.log('boot:',e.message));
    await new Promise(r=>setTimeout(r,2000));
    const res = await page.evaluate((dTarget)=>{
        var AD=window.__ATLAS_DEBUG, THREE=window.THREE;
        var cam=AD.camera(), earth=AD.earth(), group=AD.threadGroup();
        var st=AD.state;
        // park camera at the requested distance, default angle
        st.tD=st.d=parseFloat(dTarget);
        // force all threads visible so we can inspect them
        st.tshow.influence=true; st.tshow.journey=true; st.tshow.signal=true;
        st.year=2026;
        group.updateWorldMatrix(true,false);
        var mw=group.matrixWorld;
        var camPos=cam.position.clone();
        var occFront=0, visFront=0, occAll=0, totAll=0;
        var occRadiusMax=0, occCountAtR={};
        // occlusion: segment [camPos,P] vs sphere r=1 at origin
        function occluded(P){
            var Dv=new THREE.Vector3().subVectors(P,camPos);
            var a=Dv.dot(Dv), b=2*camPos.dot(Dv), c=camPos.dot(camPos)-1;
            var disc=b*b-4*a*c; if(disc<0)return false;
            var s=(-b-Math.sqrt(disc))/(2*a); return 0<s<1;
        }
        group.children.forEach(function(line){
            if(!line.geometry) return;
            var arr=line.geometry.attributes.position.array;
            for(var i=0;i<arr.length;i+=3){
                var v=new THREE.Vector3(arr[i],arr[i+1],arr[i+2]);
                v.applyMatrix4(mw);
                var r=v.length();
                var front = v.clone().normalize().dot(camPos.clone().normalize())>0;
                var oc=occluded(v);
                totAll++; if(oc)occAll++;
                if(front){ visFront++; if(oc){ occFront++; occRadiusMax=Math.max(occRadiusMax,r);
                    var b=Math.floor(r*100); occCountAtR[b]=(occCountAtR[b]||0)+1; } }
            }
        });
        // radius histogram of occluded-front points
        var hist={}; for(var k in occCountAtR) hist[(k/100).toFixed(2)]=occCountAtR[k];
        return { camD:camPos.length(), camPos:[camPos.x.toFixed(2),camPos.y.toFixed(2),camPos.z.toFixed(2)],
                 totAll, occAll, visFront, occFront, occFrontFrac:(occFront/visFront).toFixed(4),
                 occRadiusMax:occRadiusMax.toFixed(3), hist, earthR:1, nThreads:group.children.length };
    }, D);
    console.log(JSON.stringify(res,null,1));
    console.log('pageerrors:', errs.slice(0,5));
    await browser.close();
}
main().catch(e=>{console.error('FATAL',e.message);process.exit(2);});
