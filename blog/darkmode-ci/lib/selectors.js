/**
 * Selector classification — distinguishes fixed/HUD/overlay UI from
 * real page content. Used to filter out false positives in bug detection.
 *
 * Add new HUD ancestors or IDs here when you add new overlay UI.
 */

const FIXED_HUD_ANCESTORS = [
    'drawer-panel', 'drawer-header', 'drawer-backdrop',
    'topics-overlay', 'topics-backdrop', 'topics-header',
    'search-overlay', 'search-backdrop',
    'curiosity-score', 'cl-progress',
    'toc-bar', 'module-nav', 'search-trigger', 'topics-toggle',
    'theme-toggle', 'drawer-toggle',
];

const FIXED_HUD_IDS = [
    'search-trigger', 'theme-toggle', 'topics-toggle', 'drawer-toggle',
    'topics-count', 'topics-overlay', 'topics-backdrop', 'topics-close',
    'search-overlay', 'curiosity-score', 'cl-progress',
];

/** Returns true when sel or anc looks like a fixed/HUD/overlay element. */
function isHudElement(sel, anc) {
    if (!sel) return false;
    const combined = (sel || '') + ' ' + (anc || '');
    return FIXED_HUD_ANCESTORS.some(s => combined.includes(s)) ||
           FIXED_HUD_IDS.some(id => sel.includes('#' + id));
}

/** Returns true when the tag is one we should skip (SVG, math, plots, ...). */
function isSkippableTag(sel) {
    if (!sel) return true;
    const tag = sel.split(/[.#]/)[0].toLowerCase();
    const SKIP_TAGS = [
        'svg','g','path','rect','circle','tspan','defs',
        'canvas','foreignobject','br','meta','link','script','style',
        'math','mrow','mi','mo','mn','msup','msub','mfrac','mtable',
        'mtr','mtd','munderover','mover','munder','mtext','annotation',
        'semantics','merror','mglyph'
    ];
    if (SKIP_TAGS.includes(tag)) return true;
    if (/MathJax|mjx-|katex|plotly|echarts|js-plotly|tml-/i.test(sel)) return true;
    return false;
}

/** Build a stable CSS selector for an element (tag + #id + .class classes). */
function makeSelector(el) {
    let s = (el.tagName || '').toLowerCase();
    if (!s) return '';
    if (el.id) return s + '#' + el.id;
    if (el.className && typeof el.className === 'string') {
        const c = el.className.trim().split(/\s+/).filter(x => x).slice(0, 3).join('.');
        if (c) s += '.' + c;
    }
    return s;
}

module.exports = {
    FIXED_HUD_ANCESTORS,
    FIXED_HUD_IDS,
    isHudElement,
    isSkippableTag,
    makeSelector,
};
