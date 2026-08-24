/**
 * Bug detector — given light + dark element snapshots + screenshot paths,
 * identifies:
 *   1. Theme-switch bugs (bg + color stayed identical, but the dark
 *      bg is "visibly wrong" — i.e., still light)
 *   2. Stuck-white pixel clusters (containers that stayed white in dark)
 *   3. Font-readability issues (text contrast below WCAG AA on dark bg)
 *
 * Used by test.js and any custom test scripts.
 */

const { parseRgba, relLum, contrastRatio } = require('./color-utils');
const { findStuckWhiteClusters } = require('./pixel-diff');
const { isHudElement, isSkippableTag } = require('./selectors');

const DARK_PAGE_BG = { r: 15, g: 23, b: 42, a: 1 };

// Colors that the design uses as fixed accents — these are intentional
// and should NOT be reported as bugs even though they don't change.
const ACCENT_COLORS = new Set([
    'rgb(99, 102, 241)',   // indigo-500
    'rgb(79, 70, 229)',    // indigo-600
    'rgb(67, 56, 202)',    // indigo-700
    'rgb(129, 140, 248)',  // indigo-400
]);

/**
 * Match light and dark snapshots element-by-element by selector+position.
 * @returns {Array<{light, dark}>}
 */
function matchPairs(light, dark) {
    const used = new Set();
    const pairs = [];
    for (const le of light) {
        let best = -1, bestDist = 30;
        for (let k = 0; k < dark.length; k++) {
            if (used.has(k)) continue;
            const de = dark[k];
            if (de.sel !== le.sel) continue;
            const d = Math.abs(de.x - le.x) + Math.abs(de.y - le.y);
            if (d > 5) continue;
            if (d < bestDist) { best = k; bestDist = d; }
        }
        if (best < 0) continue;
        used.add(best);
        pairs.push({ light: le, dark: dark[best] });
    }
    return pairs;
}

/**
 * Detect theme-switch bugs.
 */
function detectThemeBugs(pairs) {
    const bugs = [];
    for (const { light: le, dark: de } of pairs) {
        const lb = parseRgba(le.bg), db = parseRgba(de.bg);
        const lc = parseRgba(le.color), dc = parseRgba(de.color);
        if (!lb || !db || !lc || !dc) continue;
        const bgDiff = Math.abs(lb.r - db.r) + Math.abs(lb.g - db.g) + Math.abs(lb.b - db.b);
        const colDiff = Math.abs(lc.r - dc.r) + Math.abs(lc.g - dc.g) + Math.abs(lc.b - dc.b);
        if (bgDiff >= 5 || colDiff >= 5) continue;
        // Both stayed identical — is it intentional?
        if (le.backdrop || de.backdrop) continue;
        const dbStr = `rgb(${db.r}, ${db.g}, ${db.b})`;
        if (ACCENT_COLORS.has(dbStr)) continue;
        if (le.h < 20 && le.w < 30) continue;
        if (isHudElement(le.sel, le.ancSel)) continue;
        if (isSkippableTag(le.sel)) continue;
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
    return bugs;
}

/**
 * Detect font-readability issues against WCAG AA (4.5:1 normal, 3:1 large).
 */
function detectFontIssues(darkElements) {
    const issues = [];
    for (const de of darkElements) {
        if (!de.hasText) continue;
        if (de.fontSize <= 0) continue;
        if (isSkippableTag(de.sel)) continue;
        const dc = parseRgba(de.color);
        const db = parseRgba(de.bg);
        if (!dc) continue;
        let effBg = db;
        if (!db || db.a === 0) effBg = DARK_PAGE_BG;
        const ratio = contrastRatio(dc, effBg);
        const isLarge = de.fontSize >= 18;
        const minRatio = isLarge ? 3 : 4.5;
        const tooSmall = de.fontSize < 11;
        if (ratio < minRatio) {
            issues.push({
                sel: de.sel, anc: de.ancSel,
                fontSize: de.fontSize, color: de.color, bg: de.bg,
                contrast: +ratio.toFixed(2), required: minRatio,
                x: de.x, y: de.y, w: de.w, h: de.h,
                severity: ratio < 2 ? 'critical' : (ratio < 3 ? 'bad' : 'warn')
            });
        } else if (tooSmall && de.hasText) {
            issues.push({
                sel: de.sel, anc: de.ancSel,
                fontSize: de.fontSize, color: de.color, bg: de.bg,
                contrast: +ratio.toFixed(2), required: 4.5,
                x: de.x, y: de.y, w: de.w, h: de.h,
                severity: 'tiny-font'
            });
        }
    }
    return issues;
}

/**
 * Run all detections on a block.
 * @returns {Promise<{bugs, fontIssues, whiteClusters}>}
 */
async function detectBlock(lightSnap, darkSnap, lightShot, darkShot, opts = {}) {
    const pairs = matchPairs(lightSnap, darkSnap);
    const bugs = detectThemeBugs(pairs);
    const fontIssues = detectFontIssues(darkSnap);
    let whiteClusters = [];
    if (lightShot && darkShot) {
        whiteClusters = await findStuckWhiteClusters(lightShot, darkShot, opts);
    }
    return { bugs, fontIssues, whiteClusters };
}

module.exports = {
    matchPairs,
    detectThemeBugs,
    detectFontIssues,
    detectBlock,
    DARK_PAGE_BG,
    ACCENT_COLORS: [...ACCENT_COLORS],
};
