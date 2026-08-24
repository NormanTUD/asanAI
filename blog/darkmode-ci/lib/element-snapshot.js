/**
 * Element snapshot — captures every visible element's computed style +
 * bounding rect. Used to detect theme-switch bugs and font-readability
 * issues.
 *
 * Runs inside page.evaluate so it has access to the live DOM.
 */

const { makeSelector } = require('./selectors');

/**
 * Capture visible elements in the current viewport.
 * @param {import('puppeteer-core').Page} page
 * @param {Object} [opts]
 * @param {number} [opts.maxElements=800]
 * @returns {Promise<Array<{
 *   sel: string, ancSel: string,
 *   bg: string, color: string, fontSize: number,
 *   hasText: boolean, backdrop: boolean,
 *   inlineBg: string, inlineColor: string,
 *   x: number, y: number, w: number, h: number
 * }>>}
 */
async function snapshotVisibleElements(page, opts = {}) {
    const maxElements = opts.maxElements || 800;
    return await page.evaluate((limit) => {
        // SKIP_TAGS inlined here — page.evaluate runs in the browser
        // context, so the Node.js isSkippableTag helper is not visible.
        const SKIP_TAGS = new Set([
            'svg','g','path','rect','circle','tspan','defs',
            'canvas','foreignobject','br','meta','link','script','style'
        ]);
        const SKIP_RE = /MathJax|mjx-|katex|plotly|echarts|js-plotly/i;
        const out = [];
        const all = document.body.querySelectorAll('*');
        const vpH = window.innerHeight, vpW = window.innerWidth;
        for (const el of all) {
            const r = el.getBoundingClientRect();
            if (r.width <= 0 || r.height <= 0) continue;
            if (r.bottom < 0 || r.top > vpH) continue;
            if (r.right < 0 || r.left > vpW) continue;
            const cs = getComputedStyle(el);
            if (cs.visibility === 'hidden' || cs.display === 'none') continue;
            if (parseFloat(cs.opacity) < 0.1) continue;
            const sel = el.tagName.toLowerCase() +
                (el.id ? '#' + el.id : '') +
                (el.className && typeof el.className === 'string'
                    ? '.' + el.className.trim().split(/\s+/).filter(x => x).slice(0, 3).join('.')
                    : '');
            const tag = el.tagName.toLowerCase();
            if (SKIP_TAGS.has(tag)) continue;
            if (SKIP_RE.test(sel)) continue;
            const hasBackdrop = cs.backdropFilter && cs.backdropFilter !== 'none';
            let ancSel = '';
            let p = el.parentElement;
            for (let d = 0; p && d < 2; d++, p = p.parentElement) {
                if (p.id) { ancSel = '#' + p.id; break; }
                if (p.className && typeof p.className === 'string') {
                    ancSel = p.tagName.toLowerCase() + '.' +
                        p.className.trim().split(/\s+/).filter(x => x).slice(0, 2).join('.');
                    break;
                }
            }
            out.push({
                sel, ancSel,
                bg: cs.backgroundColor,
                color: cs.color,
                fontSize: parseFloat(cs.fontSize),
                hasText: (el.textContent || '').trim().length > 0,
                backdrop: hasBackdrop,
                inlineBg: el.style.backgroundColor || '',
                inlineColor: el.style.color || '',
                x: Math.round(r.left), y: Math.round(r.top),
                w: Math.round(r.width), h: Math.round(r.height),
            });
            if (out.length >= limit) break;
        }
        return out;
    }, maxElements);
}

/**
 * Identify the element at viewport coordinates (x, y), skipping
 * HTML/BODY/SVG so we get a useful CSS selector.
 */
async function identifyElementAtPoint(page, x, y) {
    return await page.evaluate((px, py) => {
        const stack = document.elementsFromPoint(px, py);
        for (const el of stack) {
            const tag = el.tagName.toLowerCase();
            if (['html', 'body', 'document'].includes(tag)) continue;
            if (['svg', 'g', 'path', 'rect', 'circle', 'tspan'].includes(tag)) continue;
            let sel = el.tagName.toLowerCase();
            if (el.id) sel += '#' + el.id;
            else if (el.className && typeof el.className === 'string') {
                sel += '.' + el.className.trim().split(/\s+/).filter(x => x).slice(0, 2).join('.');
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

module.exports = { snapshotVisibleElements, identifyElementAtPoint };
