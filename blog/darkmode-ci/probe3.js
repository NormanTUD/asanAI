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
    // Grab all line vertices (world space) ONCE, then test occlusion against a grid of camera positions.
    const res = await page.evaluate(()=>{
        var THREE=window.THREE, group=window.__ATLAS_DEBUG.threadGroup();
        group.updateWorldMatrix(true,false);
        var mw=group.matrixWorld;
        var V=[];
        group.children.forEach(function(line){
            if(!line.geometry) return;
            var arr=line.geometry.attributes.position.array;
            for(var i=0;i<arr.length;i+=3){
                var v=new THREE.Vector3(arr[i],arr[i+1],arr[i+2]).applyMatrix4(mw);
                V.push([v.x,v.y,v.z]);
            }
        });
        function occluded(P,C){
            var dx=P[0]-C[0],dy=P[1]-C[1],dz=P[2]-C[2];
            var a=dx*dx+dy*dy+dz*dz, b=2*(C[0]*dx+C[1]*dy+C[2]*dz), c=C[0]*C[0]+C[1]*C[1]+C[2]*C[2]-1;
            var disc=b*b-4*a*c; if(disc<0)return false;
            var s=(-b-Math.sqrt(disc))/(2*a); return 0<s<1;
        }
        function front(P,C){ return (P[0]*C[0]+P[1]*C[1]+P[2]*C[2])>0; }
        function normC(C){var l=Math.hypot(C[0],C[1],C[2]);return [C[0]/l,C[1]/l,C[2]/l];}
        var report=[];
        var ds=[3.2,5,8,12,18,25];
        var nAz=12, nEl=6;
        for(var di=0;di<ds.length;di++){
            var d=ds[di]; var worstFrac=0, worstAz=0, worstEl=0, worstN=0;
            for(var ai=0;ai<nAz;ai++){
                var th=ai*2*Math.PI/nAz;
                for(var ei=0;ei<nEl;ei++){
                    var ph=0.35+ei*(1.8/ (nEl-1));
                    var sp=Math.sin(ph);
                    var C=[d*sp*Math.cos(th), d*Math.cos(ph), d*sp*Math.sin(th)];
                    var nc=normC(C);
                    var vis=0,hid=0;
                    for(var i=0;i<V.length;i++){
                        if(front(V[i],nc)){ vis++; if(occluded(V[i],C))hid++; }
                    }
                    var frac= vis? hid/vis:0;
                    if(frac>worstFrac){worstFrac=frac;worstAz=th;worstEl=ph;worstN=vis;
                      report.push({d:d,az:th.toFixed(2),el:ph.toFixed(2),frac:frac,vis:vis,hid:hid});
                    }
                }
            }
            console.log('d='+d+'  worst front-hidden-frac='+worstFrac.toFixed(4));
        }
        return { nV:V.length, top:report.sort((a,b)=>b.frac-a.frac).slice(0,12) };
    });
    console.log(JSON.stringify(res,null,1));
    await browser.close();
}
main().catch(e=>{console.error('FATAL',e.message);process.exit(2);});
