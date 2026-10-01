const puppeteer=require('puppeteer-core');const fs=require('fs');const {PNG}=require('pngjs');
(async()=>{
const b=await puppeteer.launch({executablePath:'/usr/bin/chromium',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const p=await b.newPage();
await p.setViewport({width:1000,height:760});
await p.goto('http://localhost/asanai/blog/atlas.php',{waitUntil:'load',timeout:90000});
await p.waitForFunction(()=>window.__ATLAS_DEBUG&&window.__ATLAS_DEBUG.state&&window.__ATLAS_DEBUG.state.threads.length>0,{timeout:60000});
await new Promise(r=>setTimeout(r,2500));
await p.evaluate(()=>window.__ATLAS_DEBUG.freeze());
const data=await p.evaluate(()=>{
  var V3=window.THREE.Vector3;
  var cam=window.__ATLAS_DEBUG.camera();
  var tg=window.__ATLAS_DEBUG.threadGroup(); tg.updateWorldMatrix(true,false);
  var cv=cam.matrixWorldInverse.elements; // use manual project
  function toScreen(v){
    var x=v.x,y=v.y,z=v.z;
    // view space
    var vx=cv[0]*x+cv[4]*y+cv[8]*z+cv[12];
    var vy=cv[1]*x+cv[5]*y+cv[9]*z+cv[13];
    var vz=cv[2]*x+cv[6]*y+cv[10]*z+cv[14];
    // projection
    var pe=cam.projectionMatrix.elements;
    var w=pe[3]*x+pe[7]*y+pe[11]*z+pe[15];
    var cx=(pe[0]*x+pe[4]*y+pe[8]*z+pe[12]);
    var cy=(pe[1]*x+pe[5]*y+pe[9]*z+pe[13]);
    if(w===0)return null;
    var nx=cx/w, ny=cy/w;
    return {px:(nx*0.5+0.5)*1000, py:(1-(ny*0.5+0.5))*760, vz:vz, infront:vz<0};
  }
  var out=[];
  var count=0;
  tg.children.forEach(function(ln,idx){
    if(!ln.geometry||!ln.visible)return;
    var arr=ln.geometry.attributes.position.array;
    // midpoint vertex
    var mid=Math.floor(arr.length/6);
    var v=new V3(arr[mid*3],arr[mid*3+1],arr[mid*3+2]).applyMatrix4(tg.matrixWorld);
    var s=toScreen(v);
    if(s&&s.infront){ out.push({idx:idx,kind:ln.userData.thread.kind,from:ln.userData.thread.from,to:ln.userData.thread.to,px:Math.round(s.px),py:Math.round(s.py),r:+v.length().toFixed(2),op:ln.material.opacity}); count++; }
    if(count>=8)throw 'enough';
  });
  return out;
});
const shot=PNG.sync.read(await p.screenshot({type:'png'}));
function px(x,y){var i=(y*shot.width+x)*4;return [shot.data[i],shot.data[i+1],shot.data[i+2]];}
data.forEach(function(d){
  var c=px(d.px,d.py);
  console.log('idx',d.idx,d.kind,d.from,'->',d.to,'@px',d.px+','+d.py,'r='+d.r,'op='+d.op,'pixel='+c.join(','));
});
await b.close();
})().catch(e=>{console.error('E',e.message);process.exit(2);});
