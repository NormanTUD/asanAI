#!/usr/bin/env node
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost/asanai/blog/atlas.php';
const W = 820, H = 640;
async function main() {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: 'new',
        args: ['--no-sandbox', '--disable-dev-shm-usage',
            '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
            '--window-size=' + W + ',' + H]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H });
    const logs = [];
    page.on('console', m => logs.push(m.type() + ': ' + m.text()));
    page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));
    await page.goto(URL, { waitUntil: 'load', timeout: 90000 });
    await page.waitForFunction(() => {
        var st = window.__ATLAS_DEBUG && window.__ATLAS_DEBUG.state;
        return st && st.dots.length > 0;
    }, { timeout: 60000 }).catch(e => console.log('boot wait:', e.message));
    // scroll the stage into view so the canvas is on screen
    await page.evaluate(() => {
        var s = document.getElementById('atlas-stage');
        if (s) s.scrollIntoView({ block: 'center' });
    });
    await new Promise(r => setTimeout(r, 3500));
    const dbg = await page.evaluate(() => {
        var D = window.__ATLAS_DEBUG; var st = D.state;
        return { dots: st.dots.length, threads: st.threads.length, guardrails: D.guardrails() };
    });
    console.log('ATLAS', JSON.stringify(dbg));
    const el = await page.$('#atlas-canvas');
    if (el) {
        try {
            await el.screenshot({ path: '/tmp/opencode/atlas_canvas.png' });
            console.log('saved canvas shot');
        } catch (e) { console.log('canvas shot failed:', e.message);
            await page.screenshot({ path: '/tmp/opencode/atlas_page.png' });
            console.log('saved page shot instead');
        }
    }
    console.log('LOGS:');
    logs.slice(0, 40).forEach(l => console.log('  ' + l));
    await browser.close();
}
main().catch(e => { console.error('FATAL', e.message); process.exit(2); });
