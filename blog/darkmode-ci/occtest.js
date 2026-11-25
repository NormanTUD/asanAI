const puppeteer = require('puppeteer-core');
async function shot(browser, fn, label){
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 700 });
    await page.goto('http://localhost/asanai/blog/atlas.php', { waitUntil:'load', timeout:90000 });
    await page.waitForFunction(()=>{var st=window.__ATLAS_DEBUG&&window.__ATLAS_DEBUG.state;return st&&st.threads&&st.threads.length>0;},{timeout:60000});
    await new Promise(r=>setTimeout(r,2500));
    await page.evaluate(fn);
    await new Promise(r=>setTimeout(r,300));
    const buf = await page.screenshot({ type:'png' });
    console.log(label, 'size=',buf.length);
    require('fs').writeFileSync('/tmp/'+label+'.png',buf);
    await page.close();
    return buf;
}
async function main(){
    const browser = await puppeteer.launch({ executablePath:'/usr/bin/chromium', headless:'new',
        args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader'] });
    const base = await shot(browser, ()=>{}, 'base');
    await shot(browser, ()=>{ var d=window.__ATLAS_DEBUG; d.earthVisible&&0; }, 'noop');
    await browser.close();
}
main().catch(e=>{console.error('FATAL',e.message);process.exit(2);});
