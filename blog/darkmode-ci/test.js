#!/usr/bin/env node
/* Darkmode Theme-Switch + Font-Readability Tester
 *
 * For each page in the blog:
 *   1. Scroll through in fixed steps
 *   2. Wait WAIT_AFTER_SCROLL_MS after each scroll
 *   3. Toggle light ↔ dark, screenshot, snapshot DOM
 *   4. Detect theme-switch bugs + font-readability issues + stuck-white
 *      pixel clusters
 *
 * Writes:
 *   ./darkmode-ci-out/<page>/block-NN-yYYY-{light,dark}.png   raw screenshots
 *   ./darkmode-ci-out/_stream.jsonl                            per-block findings
 *   ./darkmode-ci-out/bug_report.json                          final structured report
 *   ./darkmode-ci-out/summary.json                             top-level summary
 *
 * Exit code:
 *   0  clean (no critical/bad bugs, no stuck-white clusters)
 *   1  bugs found (good for CI gating)
 *   2  fatal error
 *
 * CLI:
 *   node test.js                          # all pages, 10s scroll wait
 *   node test.js --only history,index
 *   node test.js --wait 5000 --parallel 4
 *   node test.js --json                   # machine-readable summary on stdout
 */
const fs = require('fs');
const path = require('path');
const { ScrollCapture } = require('./lib/scroll-capture');
const { snapshotVisibleElements, identifyElementAtPoint } = require('./lib/element-snapshot');
const { detectBlock } = require('./lib/bug-detector');
const { setTheme } = require('./lib/theme-controller');

// ---------- CLI ----------
function parseArgs() {
    const args = process.argv.slice(2);
    const opts = {
        only: null,
        wait: parseInt(process.env.WAIT_AFTER_SCROLL_MS || '10000', 10),
        parallel: parseInt(process.env.PARALLEL || '3', 10),
        baseUrl: process.env.BASE_URL || 'http://localhost/asanai/blog',
        out: process.env.OUT_DIR || path.join(__dirname, 'darkmode-ci-out'),
        json: false,
        headless: true,
    };
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '--only') opts.only = (args[++i] || '').split(',').filter(Boolean);
        else if (a === '--wait') opts.wait = parseInt(args[++i], 10);
        else if (a === '--parallel') opts.parallel = parseInt(args[++i], 10);
        else if (a === '--base-url') opts.baseUrl = args[++i];
        else if (a === '--out') opts.out = args[++i];
        else if (a === '--json') opts.json = true;
        else if (a === '--headed') opts.headless = false;
        else if (a === '--help' || a === '-h') {
            console.log(fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8'));
            process.exit(0);
        }
    }
    return opts;
}

const ALL_PAGES = [
    'index', 'intro', 'history', 'untold_history', 'philosophy', 'symbolic_ai',
    'minimalneuron', 'activationlab', 'intuition', 'differentiation',
    'derivativelab', 'autodiff', 'backproplab', 'losslab', 'optimizerlab',
    'overandunderfittinglab', 'deeplearninglab', 'resnetlab',
    'normalizationlab', 'embeddinglab', 'positionalembeddingslab',
    'traininglab', 'finetuninglab', 'samplinglab', 'temperaturelab',
    'tokenizerlab', 'visionlab', 'attentionlab', 'transformer',
    'contextwindows', 'mechanistic_interpretability', 'algorithms',
    'rag', 'vectorsearch', 'websearch', 'hallucinations',
    'promptengineering', 'evaluation', 'reasoning',
    'inference_optimization', 'production_serving',
    'reinforcement_learning', 'security_inference',
    'training_data', 'training_infrastructure',
    'multimodal', 'speech_audio', 'language',
    'agents', 'global_ai_ecosystem', 'diffusion',
    'law_regulation', 'running_locally', 'knowledge_map',
    'math', 'math_i', 'math_ii', 'math_iii',
    'statistics', 'statistics_i', 'statistics_ii',
    'alternative_architectures', 'graph', 'literature',
    'frontier', 'appendix'
];

// ---------- Per-page test ----------
async function testPage(scrollCap, opts, pageSlug) {
    const url = `${opts.baseUrl}/${pageSlug}.php`;
    const pageDir = path.join(opts.out, pageSlug);
    fs.mkdirSync(pageDir, { recursive: true });
    const { ctx, page } = await scrollCap.openPage();
    const findings = { page: pageSlug, url, blocks: [], errors: [] };
    try {
        await page.setCookie({ name: 'theme', value: 'light', url: opts.baseUrl });
        const resp = await scrollCap.navigate(page, url, { theme: 'light' });
        if (!resp || !resp.ok()) {
            findings.errors.push(`HTTP ${resp ? resp.status() : 'no response'}`);
            return findings;
        }
        const pageHeight = await scrollCap.getPageHeight(page);
        const positions = scrollCap.computeScrollPositions(pageHeight);

        for (let i = 0; i < positions.length; i++) {
            const y = positions[i];
            await scrollCap.scrollTo(page, y);
            await new Promise(r => setTimeout(r, opts.wait));
            // Light
            await setTheme(page, 'light', { settleMs: 1000 });
            const lightSnap = await snapshotVisibleElements(page);
            const lightShot = path.join(pageDir, `block-${String(i).padStart(2,'0')}-y${y}-light.png`);
            await page.screenshot({ path: lightShot, captureBeyondViewport: false });
            // Dark
            await setTheme(page, 'dark', { settleMs: 1000 });
            const darkSnap = await snapshotVisibleElements(page);
            const darkShot = path.join(pageDir, `block-${String(i).padStart(2,'0')}-y${y}-dark.png`);
            await page.screenshot({ path: darkShot, captureBeyondViewport: false });
            // Detect bugs
            const detection = await detectBlock(lightSnap, darkSnap, lightShot, darkShot);
            // Identify elements at white cluster centers
            for (const c of detection.whiteClusters.slice(0, 5)) {
                const cx = c.x + Math.floor(c.w / 2);
                const cy = c.y + Math.floor(c.h / 2);
                await setTheme(page, 'dark', { settleMs: 0 });
                c.element = await identifyElementAtPoint(page, cx, cy);
            }
            findings.blocks.push({
                y, lightShot, darkShot,
                numElements: lightSnap.length,
                numBugs: detection.bugs.length,
                numFontIssues: detection.fontIssues.length,
                numWhiteClusters: detection.whiteClusters.length,
                bugs: detection.bugs,
                fontIssues: detection.fontIssues,
                whiteClusters: detection.whiteClusters,
            });
            fs.appendFileSync(
                path.join(opts.out, '_stream.jsonl'),
                JSON.stringify({
                    page: pageSlug, block: i, y,
                    bugs: detection.bugs,
                    fontIssues: detection.fontIssues,
                    whiteClusters: detection.whiteClusters.map(c => ({
                        ...c, element: c.element && {
                            sel: c.element.sel, bg: c.element.bg,
                            backdrop: c.element.backdrop, inlineBg: c.element.inlineBg
                        }
                    }))
                }) + '\n');
            await setTheme(page, 'light', { settleMs: 500 });
        }
    } catch (e) {
        findings.errors.push(String(e));
    } finally {
        try { await ctx.close(); } catch { /* ignore */ }
    }
    return findings;
}

// ---------- Main ----------
async function main() {
    const opts = parseArgs();
    const pages = opts.only || ALL_PAGES;
    fs.mkdirSync(opts.out, { recursive: true });
    fs.writeFileSync(path.join(opts.out, '_stream.jsonl'), '');

    const scrollCap = new ScrollCapture({
        baseUrl: opts.baseUrl,
        waitAfterScrollMs: opts.wait,
        headless: opts.headless,
    });
    await scrollCap.launch();

    const all = [];
    const queue = [...pages];
    const startedAt = Date.now();
    const log = (msg) => {
        if (opts.json) process.stderr.write(msg + '\n');
        else console.log(msg);
    };

    const workers = Array.from({ length: opts.parallel }, async (_, wid) => {
        while (queue.length) {
            const slug = queue.shift();
            if (!slug) return;
            const t0 = Date.now();
            const f = await testPage(scrollCap, opts, slug);
            all.push(f);
            const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
            const totElapsed = ((Date.now() - startedAt) / 1000 / 60).toFixed(1);
            const bugs = f.blocks.reduce((s, b) => s + b.numBugs, 0);
            const fonts = f.blocks.reduce((s, b) => s + b.numFontIssues, 0);
            const whites = f.blocks.reduce((s, b) => s + b.numWhiteClusters, 0);
            log(`[w${wid} ${totElapsed}m] ${slug.padEnd(30)} bugs=${bugs} font=${fonts} whitePx=${whites} ${elapsed}s`);
            fs.writeFileSync(path.join(opts.out, 'partial.json'), JSON.stringify(all, null, 2));
        }
    });
    await Promise.all(workers);
    await scrollCap.close();

    const reportPath = path.join(opts.out, 'bug_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(all, null, 2));
    const totalBugs = all.reduce((s, p) => s + p.blocks.reduce((x, b) => x + b.numBugs, 0), 0);
    const totalFont = all.reduce((s, p) => s + p.blocks.reduce((x, b) => x + b.numFontIssues, 0), 0);
    const totalWhites = all.reduce((s, p) => s + p.blocks.reduce((x, b) => x + b.numWhiteClusters, 0), 0);
    const summary = {
        pages: all.length,
        totalBugs,
        totalFontIssues: totalFont,
        totalWhiteClusters: totalWhites,
        durationSec: +((Date.now() - startedAt) / 1000).toFixed(1)
    };
    fs.writeFileSync(path.join(opts.out, 'summary.json'), JSON.stringify(summary, null, 2));
    if (opts.json) {
        process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
    } else {
        console.log(`\nDone. ${reportPath}`);
        console.log(`Summary: ${summary.pages} pages, ${summary.totalBugs} theme bugs, ${summary.totalFontIssues} font issues, ${summary.totalWhites} stuck-white clusters (${summary.durationSec}s)`);
    }
    // Exit code: 1 if any critical/bad bugs or stuck-white clusters
    const critFontIssues = all.reduce((s, p) => s + p.blocks.reduce((x, b) =>
        x + b.fontIssues.filter(fi => fi.severity === 'critical' || fi.severity === 'bad').length, 0), 0);
    process.exit(critFontIssues + totalBugs + totalWhites > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL', e); process.exit(2); });
