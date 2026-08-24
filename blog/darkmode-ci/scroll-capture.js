#!/usr/bin/env node
/* scroll-capture.js — generic scroll + screenshot CLI
 *
 * A thin wrapper around lib/scroll-capture.js for one-off visual
 * inspection. Captures a page in scrollStep increments at one or both
 * themes, optionally saves DOM snapshots.
 *
 * CLI:
 *   node scroll-capture.js --url <url> --out <dir> [--themes light,dark]
 *                           [--wait 5000] [--step 700] [--max-h 20000]
 *                           [--no-modules] [--snapshot]
 *   node scroll-capture.js --slug history --out ./shots --themes light,dark
 *
 * Output:
 *   <out>/block-y<scrollY>-<theme>.png  screenshots
 *   <out>/scroll_capture.json           metadata
 */
const fs = require('fs');
const path = require('path');
const { ScrollCapture } = require('./lib/scroll-capture');
const { setTheme } = require('./lib/theme-controller');

function parseArgs() {
    const args = process.argv.slice(2);
    const opts = {
        url: null,
        slug: null,
        baseUrl: process.env.BASE_URL || 'http://localhost/asanai/blog',
        out: null,
        themes: ['light'],
        wait: parseInt(process.env.WAIT_AFTER_SCROLL_MS || '5000', 10),
        step: 700,
        maxH: 20000,
        viewport: { width: 1280, height: 800 },
        modules: true,
        snapshot: false,
        headless: true,
    };
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '--url') opts.url = args[++i];
        else if (a === '--slug') opts.slug = args[++i];
        else if (a === '--base-url') opts.baseUrl = args[++i];
        else if (a === '--out') opts.out = args[++i];
        else if (a === '--themes') opts.themes = (args[++i] || '').split(',').filter(Boolean);
        else if (a === '--wait') opts.wait = parseInt(args[++i], 10);
        else if (a === '--step') opts.step = parseInt(args[++i], 10);
        else if (a === '--max-h') opts.maxH = parseInt(args[++i], 10);
        else if (a === '--width') opts.viewport.width = parseInt(args[++i], 10);
        else if (a === '--height') opts.viewport.height = parseInt(args[++i], 10);
        else if (a === '--no-modules') opts.modules = false;
        else if (a === '--snapshot') opts.snapshot = true;
        else if (a === '--headed') opts.headless = false;
        else if (a === '--help' || a === '-h') {
            console.log(fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8'));
            process.exit(0);
        }
    }
    if (!opts.out) {
        console.error('ERROR: --out <dir> is required');
        process.exit(2);
    }
    if (!opts.url && !opts.slug) {
        console.error('ERROR: either --url <full url> or --slug <page> is required');
        process.exit(2);
    }
    return opts;
}

async function main() {
    const opts = parseArgs();
    fs.mkdirSync(opts.out, { recursive: true });

    const url = opts.url || `${opts.baseUrl}/${opts.slug}.php`;
    const slug = opts.slug || (() => {
        try { return new URL(url).pathname.replace(/^\//, '').replace(/\.php$/, '').replace(/\//g, '_'); }
        catch { return 'page'; }
    })();

    const cap = new ScrollCapture({
        baseUrl: opts.baseUrl,
        viewport: opts.viewport,
        scrollStep: opts.step,
        maxHeight: opts.maxH,
        waitAfterScrollMs: opts.wait,
        headless: opts.headless,
    });
    await cap.launch();
    try {
        const result = await cap.capturePage(slug, {
            url,
            themes: opts.themes,
            outDir: opts.out,
            waitForModules: opts.modules,
            snapshot: opts.snapshot,
        });
        fs.writeFileSync(
            path.join(opts.out, 'scroll_capture.json'),
            JSON.stringify({
                slug, url,
                pageHeight: result.pageHeight,
                viewport: opts.viewport,
                themes: opts.themes,
                wait: opts.wait,
                step: opts.step,
                maxH: opts.maxH,
                blocks: result.blocks.map(b => ({
                    y: b.y, theme: b.theme, path: b.path,
                    numElements: b.snap ? b.snap.length : null,
                }))
            }, null, 2)
        );
        console.log(`Captured ${result.blocks.length} blocks for ${slug}`);
        console.log(`Output: ${opts.out}`);
    } finally {
        await cap.close();
    }
}

main().catch(e => { console.error('FATAL', e); process.exit(2); });
