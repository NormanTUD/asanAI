#!/usr/bin/env node
/* cap_atlas.js — capture the Atlas globe to inspect thread rendering */
const puppeteer = require('puppeteer-core');

const URL = process.env.URL || 'http://localhost/asanai/blog/map.php';

async function main() {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: 'new',
        args: [
            '--no-sandbox', '--disable-dev-shm-usage',
            '--enable-unsafe-swiftshader', '--use-gl=angle',
            '--use-angle=swiftshader', '--window-size=1400,900'
        ]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    const logs = [];
    page.on('console', m => logs.push(m.type() + ': ' + m.text()));
    page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));

    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
    // wait for loader to hide (atlas booted)
    await page.waitForFunction(
        () => {
            var l = document.getElementById('atlas-loader');
            return l && l.classList.contains('hide');
        },
        { timeout: 45000 }
    ).catch(e => console.log('loader wait:', e.message));
    await new Promise(r => setTimeout(r, 3000));

    const dbg = await page.evaluate(() => {
        var D = window.__ATLAS_DEBUG;
        if (!D) return { err: 'no debug' };
        var st = D.state;
        return {
            dots: st.dots.length,
            threads: st.threads.length,
            guardrails: D.guardrails(),
            d: st.d
        };
    }).catch(e => ({ err: e.message }));
    console.log('ATLAS', JSON.stringify(dbg));

    // capture the canvas region
    await page.screenshot({ path: '/tmp/opencode/atlas_full.png' });
    const canvas = await page.$('#atlas-canvas');
    if (canvas) { await canvas.screenshot({ path: '/tmp/opencode/atlas_canvas.png' }); }

    console.log('CONSOLE LOGS:');
    logs.slice(0, 60).forEach(l => console.log('  ' + l));

    await browser.close();
}
main().catch(e => { console.error('FATAL', e); process.exit(2); });
