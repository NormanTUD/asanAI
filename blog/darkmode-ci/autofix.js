#!/usr/bin/env node
/* Auto-Fix Generator for Dark-Mode Bugs
 *
 * Reads _stream.jsonl from the test runner and applies CSS rules to
 * style.css. Only "safe" fixes are applied:
 *   - Font issues with severity 'critical' or 'bad' (contrast < 3)
 *   - Stuck-white containers not in known HUD/overlay
 *   - MathJax/Plotly/SVG elements are skipped
 *
 * CLI:
 *   node autofix.js                      # use default paths
 *   node autofix.js --stream <path>      # custom stream file
 *   node autofix.js --css <path>          # target stylesheet
 *   node autofix.js --dry-run            # print, don't write
 *   node autofix.js --only-critical      # only critical severity
 *   node autofix.js --include-stuck-white # also fix stuck-white containers
 */
const fs = require('fs');
const path = require('path');
const { parseRgba, contrastRatio, pickReadableForeground } = require('./lib/color-utils');
const { isHudElement, isSkippableTag } = require('./lib/selectors');

function parseArgs() {
    const args = process.argv.slice(2);
    const opts = {
        stream: process.env.STREAM_PATH || path.join(__dirname, 'darkmode-ci-out', '_stream.jsonl'),
        css: process.env.CSS_PATH || path.join(__dirname, '..', 'style.css'),
        out: process.env.OUT_DIR || path.join(__dirname, 'darkmode-ci-out'),
        dryRun: false,
        onlyCritical: false,
        includeStuckWhite: false,
    };
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '--stream') opts.stream = args[++i];
        else if (a === '--css') opts.css = args[++i];
        else if (a === '--out') opts.out = args[++i];
        else if (a === '--dry-run') opts.dryRun = true;
        else if (a === '--only-critical') opts.onlyCritical = true;
        else if (a === '--include-stuck-white') opts.includeStuckWhite = true;
        else if (a === '--help' || a === '-h') {
            console.log(fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8'));
            process.exit(0);
        }
    }
    return opts;
}

const DARK_PAGE_BG = { r: 15, g: 23, b: 42 };
const SAFE_LIGHT_COLORS = [
    { c: { r: 226, g: 232, b: 240 }, name: '#e2e8f0' },
    { c: { r: 203, g: 213, b: 225 }, name: '#cbd5e1' },
    { c: { r: 248, g: 250, b: 252 }, name: '#f8fafc' },
    { c: { r: 96,  g: 165, b: 250 }, name: '#60a5fa' },
    { c: { r: 129, g: 140, b: 248 }, name: '#818cf8' },
];

function findSafeColor() {
    return pickReadableForeground(DARK_PAGE_BG, SAFE_LIGHT_COLORS, 4.5);
}

/**
 * Make a selector more general by stripping dynamic IDs and tag-only selectors.
 * E.g. `a#ref-planck-abc12.cite-stealth.iframe-safe-link` →
 *      `a.cite-stealth.iframe-safe-link`
 * `span` → `span`  (kept; called out as a bare-tag rule but only if safe)
 */
function generalizeSelector(sel) {
    if (!sel) return sel;
    const isBareTag = /^[a-z][a-z0-9]*$/i.test(sel);
    if (isBareTag) return null; // skip bare tags — too broad
    // Strip ID
    let s = sel.replace(/#[a-zA-Z0-9_-]+/g, '');
    // Collapse multiple dots
    s = s.replace(/\.+/g, '.');
    // If we stripped everything but a tag, treat as bare
    if (/^[a-z][a-z0-9]*\.?$/i.test(s) || !s) return null;
    return s;
}

/** Group fixes by their generalized selector so we don't generate 200 ID-specific rules. */
function groupByGeneralized(fixes) {
    const groups = new Map(); // generalizedSel -> { originalSels, color, severity, contrast, pages }
    const skipped = [];
    for (const f of fixes) {
        const gen = generalizeSelector(f.sel);
        if (!gen) {
            skipped.push({ ...f, reason: 'bare-tag selector — too broad, manual fix needed' });
            continue;
        }
        if (!groups.has(gen)) {
            groups.set(gen, {
                sel: gen,
                color: f.color,
                severity: f.severity,
                contrast: f.contrast,
                pages: new Set(f.pages),
                originalCount: 0,
            });
        }
        const g = groups.get(gen);
        g.pages.add(...f.pages);
        g.originalCount++;
    }
    return { groups, skipped };
}

function findDarkMarker(content) {
    const m = content.match(/(\/\*\s*[^*]*[Dd]arkmode[^*]*\*\/)/);
    if (m) return { pos: m.index, length: m[0].length };
    const m2 = content.match(/html\.dark\s*[\.\{]/);
    if (m2) return { pos: m2.index, length: 0 };
    return { pos: content.length, length: 0 };
}

function main() {
    const opts = parseArgs();
    if (!fs.existsSync(opts.stream)) {
        console.error(`Stream file not found: ${opts.stream}`);
        console.error('Run test.js first to generate it.');
        process.exit(2);
    }
    if (!fs.existsSync(opts.css)) {
        console.error(`CSS file not found: ${opts.css}`);
        process.exit(2);
    }

    const lines = fs.readFileSync(opts.stream, 'utf8').split('\n').filter(Boolean);

    // Aggregate font issues
    const issueMap = new Map();
    for (const line of lines) {
        let d; try { d = JSON.parse(line); } catch { continue; }
        for (const fi of d.fontIssues || []) {
            const targetSev = opts.onlyCritical ? ['critical'] : ['critical', 'bad'];
            if (!targetSev.includes(fi.severity)) continue;
            const key = fi.sel + '|' + fi.color;
            if (!issueMap.has(key)) {
                issueMap.set(key, {
                    sel: fi.sel, anc: fi.anc,
                    color: fi.color, severity: fi.severity,
                    contrast: fi.contrast, pages: new Set()
                });
            }
            issueMap.get(key).pages.add(d.page);
        }
    }

    const fixes = [];
    const skipped = [];
    for (const [key, info] of issueMap) {
        if (isHudElement(info.sel, info.anc)) {
            skipped.push({ ...info, reason: 'HUD/overlay element' });
            continue;
        }
        if (isSkippableTag(info.sel)) {
            skipped.push({ ...info, reason: 'SVG/MathJax element' });
            continue;
        }
        fixes.push({
            sel: info.sel,
            color: info.color,
            newColor: findSafeColor(),
            severity: info.severity,
            contrast: info.contrast,
            pages: [...info.pages]
        });
    }

    console.log(`Generated ${fixes.length} safe font fixes:`);
    for (const f of fixes.slice(0, 20)) {
        console.log(`  ${f.severity}  ${f.sel.padEnd(50)}  ${f.color} -> ${f.newColor}  (${f.pages.length} pages)`);
    }
    if (fixes.length > 20) console.log(`  ... and ${fixes.length - 20} more`);
    console.log(`\nSkipped ${skipped.length} as unsafe/HUD`);

    // Group by generalized selector (strip dynamic IDs, skip bare tags)
    const { groups, skipped: bareSkips } = groupByGeneralized(fixes);
    const allSkipped = [...skipped, ...bareSkips];
    if (bareSkips.length > 0) {
        console.log(`Skipped ${bareSkips.length} bare-tag selectors (too broad, manual fix needed)`);
        for (const s of bareSkips.slice(0, 10)) {
            console.log(`  ${s.sel.padEnd(40)}  reason: ${s.reason}`);
        }
        if (bareSkips.length > 10) console.log(`  ... and ${bareSkips.length - 10} more`);
    }

    const bySelector = new Map();
    for (const f of fixes) {
        const gen = generalizeSelector(f.sel);
        if (!gen) continue;
        if (!bySelector.has(gen)) bySelector.set(gen, []);
        bySelector.get(gen).push(f);
    }
    // Use the generalized group for the actual rule count
    const finalBySelector = groups;

    const cssLines = [];
    cssLines.push('');
    cssLines.push('/* ════════════════════════════════════════════════════════════');
    cssLines.push('   AUTO-GENERATED DARK-MODE FONT READABILITY FIXES');
    cssLines.push('   Generated by darkmode-ci/autofix.js');
    cssLines.push('   Improves contrast for elements that stay dark-on-dark in');
    cssLines.push('   dark mode. Safe selectors only — no HUD/overlay overrides,');
    cssLines.push('   no bare-tag selectors, no dynamic IDs.');
    cssLines.push('   ═══════════════════════════════════════════════════════════ */');
    cssLines.push('');
    for (const [gen, info] of groups) {
        cssLines.push(`html.dark ${gen} { color: ${findSafeColor()} !important; } /* was ${info.color}; ${info.originalCount} elements across ${info.pages.size} pages */`);
    }
    cssLines.push('');

    const whiteBugMap = new Map();
    if (opts.includeStuckWhite) {
        for (const line of lines) {
            let d; try { d = JSON.parse(line); } catch { continue; }
            for (const c of d.whiteClusters || []) {
                const e = c.element || {};
                if (!e.sel || e.sel === 'img' || e.sel === 'none') continue;
                if (e.backdrop) continue;
                if (isHudElement(e.sel, '')) continue;
                if (!whiteBugMap.has(e.sel)) {
                    whiteBugMap.set(e.sel, {
                        sel: e.sel,
                        bg: e.bg,
                        inlineBg: e.inlineBg,
                        pages: new Set(),
                        clusterSize: c.pixels,
                        x: c.x, y: c.y, w: c.w, h: c.h
                    });
                }
                whiteBugMap.get(e.sel).pages.add(d.page);
            }
        }
        if (whiteBugMap.size > 0) {
            cssLines.push('/* ════════════════════════════════════════════════════════════');
            cssLines.push('   AUTO-GENERATED STUCK-WHITE DARK-MODE FIXES');
            cssLines.push('   ═══════════════════════════════════════════════════════════ */');
            for (const [sel] of whiteBugMap) {
                cssLines.push(`html.dark ${sel} { background-color: var(--mn-surface, #1e293b) !important; }`);
            }
            cssLines.push('');
            console.log(`\n${whiteBugMap.size} stuck-white cluster elements to fix`);
        }
    }

    const newCss = cssLines.join('\n');
    console.log('\n=== CSS TO INSERT ===');
    console.log(newCss);

    if (opts.dryRun) {
        console.log('\n[DRY-RUN] Not writing to disk.');
        writeReport(opts, fixes, whiteBugMap, skipped);
        process.exit(0);
    }

    const styleContent = fs.readFileSync(opts.css, 'utf8');
    const backupPath = opts.css + '.bak-autofix';
    fs.writeFileSync(backupPath, styleContent);
    const marker = findDarkMarker(styleContent);
    let finalContent;
    if (marker.length > 0) {
        finalContent = styleContent.slice(0, marker.pos + marker.length)
            + '\n' + newCss
            + styleContent.slice(marker.pos + marker.length);
    } else {
        finalContent = styleContent + '\n' + newCss;
    }
    fs.writeFileSync(opts.css, finalContent);

    console.log(`\nApplied ${cssLines.filter(l => l.trim()).length} CSS rules to ${opts.css}`);
    console.log(`Backup saved to ${backupPath}`);
    writeReport(opts, fixes, whiteBugMap, skipped);
    console.log(`\nReport saved to ${opts.out}/autofix_report.json`);
}

function writeReport(opts, fixes, whiteBugMap, skipped, groups, bareSkips) {
    fs.mkdirSync(opts.out, { recursive: true });
    const report = {
        generatedAt: new Date().toISOString(),
        fontFixes: fixes,
        appliedRules: [...groups.entries()].map(([gen, info]) => ({
            selector: gen,
            newColor: findSafeColor(),
            originalColor: info.color,
            severity: info.severity,
            contrast: info.contrast,
            elementsFixed: info.originalCount,
            pages: [...info.pages],
        })),
        stuckWhiteFixes: [...whiteBugMap.entries()].map(([sel, info]) => ({ sel, ...info, pages: [...info.pages] })),
        skipped: skipped.map(s => ({ ...s, pages: [...s.pages] })),
        bareTagSkipped: (bareSkips || []).map(s => ({ ...s, pages: [...s.pages] })),
    };
    fs.writeFileSync(path.join(opts.out, 'autofix_report.json'), JSON.stringify(report, null, 2));
}

main();
