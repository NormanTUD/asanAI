const puppeteer = require('puppeteer-core');
async function shot(browser, hide){
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 700 });
    await page.goto('http://localhost/asanai/blog/atlas.php', { waitUntil:'load', timeout:90000 });
    await page.waitForFunction(()=>{var st=window.__ATLAS_DEBUG&&window.__ATLAS_DEBUG.state;return st&&st.threads&&st.threads.length>0;},{timeout:60000});
    await new Promise(r=>setTimeout(r,2500));
    if(hide){ await page.evaluate(()=>{ window.__ATLAS_DEBUG.threadGroup().visible=false; });
      await new Promise(r=>setTimeout(r,300)); }
    const buf = await page.screenshot({ type:'png' });
    await page.close();
    return buf;
}
async function main(){
    const browser = await puppeteer.launch({ executablePath:'/usr/bin/chromium', headless:'new',
        args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader'] });
    const on  = await shot(browser,false);
    const off = await shot(browser,true);
    await browser.close();
    require('fs').writeFileSync('/tmp/atlas_on.png',on);
    require('fs').writeFileSync('/tmp/atlas_off.png',off);
    console.log('wrote pngs on='+on.length+' off='+off.length);
}
main().catch(e=>{console.error('FATAL',e.message);process.exit(2);});
