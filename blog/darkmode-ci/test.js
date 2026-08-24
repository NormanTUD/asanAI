#!/usr/bin/env node
/* Darkmode Theme-Switch + Font-Readability Tester
 *
 * CLI:
 *   node test.js                          # default: all pages, 10s scroll wait
 *   node test.js --only history,index     # specific pages
 *   node test.js --wait 5000 --parallel 4 # tune timing
 *   node test.js --json                   # machine-readable output
 *
 * Environment overrides:
 *   WAIT_AFTER_SCROLL_MS  (default 10000)
 *   PARALLEL              (default 3)
 *   BASE_URL              (default http://localhost/asanai/blog)
 *   VIEWPORT_W            (default 1280)
 *   VIEWPORT_H            (default 800)
 *   SCROLL_STEP           (default 700)
 *   MAX_HEIGHT            (default 20000)
 *
 * Output:
 *   ./darkmode-ci-out/<page>/block-NN-yYYY-{light,dark}.png   (raw screenshots)
 *   ./darkmode-ci-out/_stream.jsonl                            (per-block findings)
 *   ./darkmode-ci-out/bug_report.json                          (final structured report)
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// ---------- CLI args ----------
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

// ---------- Constants ----------
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

// ---------- Helpers ----------
function mkdirp(d) { fs.mkdirSync(d, { recursive: true }); }
function relLum(c) {
    const f = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}
function parseRgba(s) {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map(x => x.trim());
    return { r: +p[0], g: +p[1], b: +p[2], a: p.length > 3 ? +p[3] : 1 };
}
function contrastRatio(c1, c2) {
    const L1 = relLum(c1), L2 = relLum(c2);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

// Selector classification — list of fixed/HUD/overlay ancestors + ids
const FIXED_HUD_ANCESTORS = [
    'drawer-panel', 'drawer-header', 'drawer-backdrop',
    'topics-overlay', 'topics-backdrop', 'topics-header',
    'search-overlay', 'search-backdrop',
    'curiosity-score', 'cl-progress'
];
const FIXED_HUD_IDS = [
    'search-trigger', 'theme-toggle', 'topics-toggle', 'drawer-toggle',
    'topics-count', 'topics-overlay', 'topics-backdrop', 'topics-close',
    'search-overlay', 'curiosity-score'
];
function isHudElement(sel, anc) {
    const combined = (sel || '') + ' ' + (anc || '');
    return FIXED_HUD_ANCESTORS.some(s => combined.includes(s)) ||
           FIXED_HUD_IDS.some(id => sel && sel.includes('#' + id));
}

// ---------- Page interaction ----------
async function setTheme(page, theme) {
    await page.evaluate((t) => {
        const html = document.documentElement;
        if (t === 'dark') html.classList.add('dark');
        else html.classList.remove('dark');
        document.cookie = 'theme=' + t + '; path=/; max-age=' + 60*60*24*365;
    }, theme);
    await new Promise(r => setTimeout(r, 1000));
}
async function getPageHeight(page) {
    return await page.evaluate(() => Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight));
}
async function scrollTo(page, y) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.evaluate(() => new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
}

// ---------- Snapshot ----------
async function snapshot(page) {
    return await page.evaluate(() => {
        const out = [];
        const all = document.body.querySelectorAll('*');
        const vpH = window.innerHeight, vpW = window.innerWidth;
        for (const el of all) {
            const r = el.getBoundingClientRect();
            if (r.width <= 0 || r.height <= 0) continue;
            if (r.bottom < 0 || r.top > vpH) continue;
            if (r.right < 0 || r.left > vpW) continue;
            const cs = getComputedStyle(el);
            const bg = cs.backgroundColor;
            const color = cs.color;
            const fontSize = parseFloat(cs.fontSize);
            const hasText = (el.textContent || '').trim().length > 0;
            if (cs.visibility === 'hidden' || cs.display === 'none') continue;
            if (parseFloat(cs.opacity) < 0.1) continue;
            const sel = el.tagName.toLowerCase() +
                (el.id ? '#' + el.id : '') +
                (el.className && typeof el.className === 'string'
                    ? '.' + el.className.trim().split(/\s+/).filter(x=>x).slice(0,3).join('.') : '');
            const tag = el.tagName.toLowerCase();
            if (['svg','g','path','rect','circle','tspan','defs','canvas','foreignobject','br','meta','link','script','style'].includes(tag)) continue;
            const hasBackdrop = cs.backdropFilter && cs.backdropFilter !== 'none';
            let ancSel = '';
            let p = el.parentElement;
            for (let d = 0; p && d < 2; d++, p = p.parentElement) {
                if (p.id) { ancSel = '#' + p.id; break; }
                if (p.className && typeof p.className === 'string') {
                    ancSel = p.tagName.toLowerCase() + '.' +
                        p.className.trim().split(/\s+/).filter(x=>x).slice(0,2).join('.');
                    break;
                }
            }
            out.push({
                sel, ancSel, bg, color, fontSize, hasText, backdrop: hasBackdrop,
                inlineBg: el.style.backgroundColor || '',
                inlineColor: el.style.color || '',
                x: Math.round(r.left), y: Math.round(r.top),
                w: Math.round(r.width), h: Math.round(r.height)
            });
            if (out.length > 800) break;
        }
        return out;
    });
}

// ---------- Pixel diff ----------
async function findStuckWhiteClusters(lightPath, darkPath, png) {
    const light = png.sync.read(fs.readFileSync(lightPath));
    const dark  = png.sync.read(fs.readFileSync(darkPath));
    const W = dark.width, H = dark.height;
    const mask = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) << 2;
            const la = (light.data[i] + light.data[i+1] + light.data[i+2]) / 3;
            const da = (dark.data[i] + dark.data[i+1] + dark.data[i+2]) / 3;
            const d = Math.abs(light.data[i] - dark.data[i]) +
                      Math.abs(light.data[i+1] - dark.data[i+1]) +
                      Math.abs(light.data[i+2] - dark.data[i+2]);
            if (la > 235 && da > 235 && d < 30) mask[y * W + x] = 1;
        }
    }
    const visited = new Uint8Array(W * H);
    const clusters = [];
    const stack = [];
    const MIN_CLUSTER = 800;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const idx = y * W + x;
            if (!mask[idx] || visited[idx]) continue;
            let minX = x, maxX = x, minY = y, maxY = y, count = 0;
            stack.push(idx);
            while (stack.length) {
                const j = stack.pop();
                if (visited[j]) continue;
                visited[j] = 1;
                if (!mask[j]) continue;
                count++;
                const jx = j % W, jy = (j - jx) / W;
                if (jx < minX) minX = jx;
                if (jx > maxX) maxX = jx;
                if (jy < minY) minY = jy;
                if (jy > maxY) maxY = jy;
                if (jx > 0)        stack.push(j - 1);
                if (jx < W - 1)    stack.push(j + 1);
                if (jy > 0)        stack.push(j - W);
                if (jy < H - 1)    stack.push(j + W);
            }
            if (count >= MIN_CLUSTER) {
                const w = maxX - minX + 1, h = maxY - minY + 1;
                const aspect = Math.max(w, h) / Math.min(w, h);
                if (aspect > 5 || w < 10 || h < 10) continue;
                clusters.push({ x: minX, y: minY, w, h, pixels: count });
            }
        }
    }
    return clusters;
}

// ---------- Bug classification ----------
function compareBlocks(light, dark) {
    const bugs = [];
    const fontIssues = [];
    const ACCENT_COLORS = ['rgb(99, 102, 241)', 'rgb(79, 70, 229)', 'rgb(67, 56, 202)'];
    for (const le of light) {
        let best = -1, bestDist = 30;
        for (let k = 0; k < dark.length; k++) {
            const de = dark[k];
            if (de.sel !== le.sel) continue;
            const d = Math.abs(de.x - le.x) + Math.abs(de.y - le.y);
            if (d > 5) continue;
            if (d < bestDist) { best = k; bestDist = d; }
        }
        if (best < 0) continue;
        const de = dark[best];
        const lb = parseRgba(le.bg), db = parseRgba(de.bg);
        const lc = parseRgba(le.color), dc = parseRgba(de.color);
        if (!lb || !db || !lc || !dc) continue;
        const bgDiff = Math.abs(lb.r-db.r) + Math.abs(lb.g-db.g) + Math.abs(lb.b-db.b);
        const colDiff = Math.abs(lc.r-dc.r) + Math.abs(lc.g-dc.g) + Math.abs(lc.b-dc.b);
        if (bgDiff < 5 && colDiff < 5) {
            if (le.backdrop || de.backdrop) continue;
            const dbStr = `rgb(${db.r}, ${db.g}, ${db.b})`;
            if (ACCENT_COLORS.includes(dbStr)) continue;
            if (le.h < 20 && le.w < 30) continue;
            if (isHudElement(le.sel, le.ancSel)) continue;
            const darkBgLum = relLum(db);
            const darkBgAlpha = db.a;
            if (darkBgLum > 0.7 && darkBgAlpha > 0.5) {
                bugs.push({
                    sel: le.sel, anc: le.ancSel,
                    lightBg: le.bg, darkBg: de.bg,
                    lightColor: le.color, darkColor: de.color,
                    x: le.x, y: le.y, w: le.w, h: le.h,
                    fontSize: le.fontSize,
                    severity: darkBgLum > 0.9 ? 'critical' : 'warning'
                });
            }
        }
    }
    for (const de of dark) {
        if (!de.hasText) continue;
        if (de.fontSize <= 0) continue;
        const tag = de.sel.split(/[.#]/)[0].toLowerCase();
        if (['svg','g','path','rect','circle','tspan','defs','canvas','foreignobject'].includes(tag)) continue;
        if (/MathJax|mjx-|katex|plotly|echarts|js-plotly/i.test(de.sel)) continue;
        const dc = parseRgba(de.color);
        const db = parseRgba(de.bg);
        if (!dc) continue;
        let effBg = db;
        if (!db || db.a === 0) effBg = { r: 15, g: 23, b: 42, a: 1 };
        const ratio = contrastRatio(dc, effBg);
        const isLarge = de.fontSize >= 18;
        const minRatio = isLarge ? 3 : 4.5;
        const tooSmall = de.fontSize < 11;
        if (ratio < minRatio) {
            fontIssues.push({
                sel: de.sel, anc: de.ancSel,
                fontSize: de.fontSize, color: de.color, bg: de.bg,
                contrast: +ratio.toFixed(2), required: minRatio,
                x: de.x, y: de.y, w: de.w, h: de.h,
                severity: ratio < 2 ? 'critical' : (ratio < 3 ? 'bad' : 'warn')
            });
        } else if (tooSmall && de.hasText) {
            fontIssues.push({
                sel: de.sel, anc: de.ancSel,
                fontSize: de.fontSize, color: de.color, bg: de.bg,
                contrast: +ratio.toFixed(2), required: 4.5,
                x: de.x, y: de.y, w: de.w, h: de.h,
                severity: 'tiny-font'
            });
        }
    }
    return { bugs, fontIssues };
}

async function identifyElementAtPoint(page, x, y) {
    return await page.evaluate((px, py) => {
        const stack = document.elementsFromPoint(px, py);
        for (const el of stack) {
            const tag = el.tagName.toLowerCase();
            if (['html','body','document'].includes(tag)) continue;
            if (tag === 'svg' || tag === 'g' || tag === 'path' || tag === 'rect') continue;
            let sel = el.tagName.toLowerCase();
            if (el.id) sel += '#' + el.id;
            else if (el.className && typeof el.className === 'string') {
                sel += '.' + el.className.trim().split(/\s+/).filter(x=>x).slice(0,2).join('.');
            }
            const cs = getComputedStyle(el);
            return {
                sel, tag,
                bg: cs.backgroundColor,
                color: cs.color,
                text: (el.innerText || '').slice(0, 60).replace(/\n/g, ' '),
                backdrop: cs.backdropFilter && cs.backdropFilter !== 'none',
                opacity: cs.opacity,
                position: cs.position,
                inlineBg: el.style.backgroundColor || '',
                inlineColor: el.style.color || ''
            };
        }
        return null;
    }, x, y);
}

// ---------- Per-page test ----------
async function testPage(browser, opts, pageSlug) {
    const url = `${opts.baseUrl}/${pageSlug}.php`;
    const pageDir = path.join(opts.out, pageSlug);
    mkdirp(pageDir);
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    const VW = parseInt(process.env.VIEWPORT_W || '1280', 10);
    const VH = parseInt(process.env.VIEWPORT_H || '800', 10);
    await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 });
    const findings = { page: pageSlug, url, blocks: [], errors: [] };
    try {
        await page.setCookie({ name: 'theme', value: 'light', url: opts.baseUrl });
        const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        if (!resp || !resp.ok()) {
            findings.errors.push(`HTTP ${resp ? resp.status() : 'no response'}`);
            return findings;
        }
        try {
            await page.waitForFunction(
                () => (typeof window._modulesLoaded === 'undefined') || window._modulesLoaded,
                { timeout: 30000 });
        } catch { /* ok */ }
        await new Promise(r => setTimeout(r, 2000));

        const SCROLL_STEP = parseInt(process.env.SCROLL_STEP || '700', 10);
        const MAX_HEIGHT = parseInt(process.env.MAX_HEIGHT || '20000', 10);

        const fullH = await getPageHeight(page);
        const pageHeight = Math.min(fullH, MAX_HEIGHT);

        const positions = [0];
        for (let y = SCROLL_STEP; y < pageHeight; y += SCROLL_STEP) positions.push(y);
        if (positions[positions.length - 1] < pageHeight - VH) {
            positions.push(Math.max(0, pageHeight - VH));
        }

        const png = require('pngjs');

        for (let i = 0; i < positions.length; i++) {
            const y = positions[i];
            await scrollTo(page, y);
            await new Promise(r => setTimeout(r, opts.wait));
            await setTheme(page, 'light');
            const lightSnap = await snapshot(page);
            const lightShot = path.join(pageDir, `block-${String(i).padStart(2,'0')}-y${y}-light.png`);
            await page.screenshot({ path: lightShot, captureBeyondViewport: false });
            await setTheme(page, 'dark');
            const darkSnap = await snapshot(page);
            const darkShot = path.join(pageDir, `block-${String(i).padStart(2,'0')}-y${y}-dark.png`);
            await page.screenshot({ path: darkShot, captureBeyondViewport: false });
            const cmp = compareBlocks(lightSnap, darkSnap);
            const whiteClusters = await findStuckWhiteClusters(lightShot, darkShot, png);
            for (const c of whiteClusters.slice(0, 5)) {
                const cx = c.x + Math.floor(c.w / 2);
                const cy = c.y + Math.floor(c.h / 2);
                await setTheme(page, 'dark');
                c.element = await identifyElementAtPoint(page, cx, cy);
            }
            findings.blocks.push({
                y, lightShot, darkShot,
                numElements: lightSnap.length,
                numBugs: cmp.bugs.length,
                numFontIssues: cmp.fontIssues.length,
                numWhiteClusters: whiteClusters.length,
                bugs: cmp.bugs,
                fontIssues: cmp.fontIssues,
                whiteClusters
            });
            fs.appendFileSync(
                path.join(opts.out, '_stream.jsonl'),
                JSON.stringify({
                    page: pageSlug, block: i, y,
                    bugs: cmp.bugs, fontIssues: cmp.fontIssues,
                    whiteClusters: whiteClusters.map(c => ({
                        ...c, element: c.element && {
                            sel: c.element.sel, bg: c.element.bg,
                            backdrop: c.element.backdrop, inlineBg: c.element.inlineBg
                        }
                    }))
                }) + '\n');
            await setTheme(page, 'light');
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
    mkdirp(opts.out);
    fs.writeFileSync(path.join(opts.out, '_stream.jsonl'), '');
    const SYSTEM_CHROMIUM = '/usr/bin/chromium';
    const browser = await puppeteer.launch({
        executablePath: SYSTEM_CHROMIUM,
        headless: opts.headless,
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    const all = [];
    const queue = [...pages];
    const startedAt = Date.now();
    const workers = Array.from({ length: opts.parallel }, async (_, wid) => {
        while (queue.length) {
            const slug = queue.shift();
            if (!slug) return;
            const t0 = Date.now();
            const f = await testPage(browser, opts, slug);
            all.push(f);
            const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
            const totElapsed = ((Date.now() - startedAt) / 1000 / 60).toFixed(1);
            const bugs = f.blocks.reduce((s, b) => s + b.numBugs, 0);
            const fonts = f.blocks.reduce((s, b) => s + b.numFontIssues, 0);
            const whites = f.blocks.reduce((s, b) => s + b.numWhiteClusters, 0);
            const log = `[w${wid} ${totElapsed}m] ${slug.padEnd(30)} bugs=${bugs} font=${fonts} whitePx=${whites} ${elapsed}s`;
            if (opts.json) process.stderr.write(log + '\n');
            else console.log(log);
            fs.writeFileSync(path.join(opts.out, 'partial.json'), JSON.stringify(all, null, 2));
        }
    });
    await Promise.all(workers);
    await browser.close();
    const reportPath = path.join(opts.out, 'bug_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(all, null, 2));
    // Final summary
    const totalBugs = all.reduce((s, p) => s + p.blocks.reduce((x, b) => x + b.numBugs, 0), 0);
    const totalFont = all.reduce((s, p) => s + p.blocks.reduce((x, b) => x + b.numFontIssues, 0), 0);
    const totalWhites = all.reduce((s, p) => s + p.blocks.reduce((x, b) => x + b.numWhiteClusters, 0), 0);
    const summary = {
        pages: all.length,
        totalBugs,
        totalFontIssues: totalFont,
        totalWhiteClusters: totalWhites,
        durationSec: ((Date.now() - startedAt) / 1000).toFixed(1)
    };
    fs.writeFileSync(path.join(opts.out, 'summary.json'), JSON.stringify(summary, null, 2));
    if (opts.json) {
        process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
    } else {
        console.log(`\nDone. ${reportPath}`);
        console.log(`Summary: ${summary.pages} pages, ${summary.totalBugs} theme bugs, ${summary.totalFontIssues} font issues, ${summary.totalWhites} stuck-white clusters (${summary.durationSec}s)`);
    }
    // Exit code: 0 if clean (no critical/bad bugs), 1 otherwise
    const critFontIssues = all.reduce((s, p) => s + p.blocks.reduce((x, b) =>
        x + b.fontIssues.filter(fi => fi.severity === 'critical' || fi.severity === 'bad').length, 0), 0);
    process.exit(critFontIssues + totalBugs > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL', e); process.exit(2); });
