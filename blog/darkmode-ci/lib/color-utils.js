/**
 * Color utilities — parsing, luminance, contrast ratio.
 * Used by every module that needs to compare theme-aware colors.
 */

/** Parse an `rgb(...)` / `rgba(...)` string into {r, g, b, a}. Returns null on failure. */
function parseRgba(s) {
    if (typeof s !== 'string') return null;
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map(x => x.trim());
    return {
        r: +p[0],
        g: +p[1],
        b: +p[2],
        a: p.length > 3 ? +p[3] : 1
    };
}

/** Relative luminance per WCAG 2.x. */
function relLum(c) {
    const f = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

/** WCAG contrast ratio between two colors (already-parsed {r,g,b,a} objects). */
function contrastRatio(c1, c2) {
    const L1 = relLum(c1), L2 = relLum(c2);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

/** Euclidean RGB distance, 0..441.67. */
function colorDist(a, b) {
    if (!a || !b) return Infinity;
    return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

/** "light" | "mid" | "dark" classification based on luminance. */
function luminanceBand(c) {
    if (!c) return 'transparent';
    const l = relLum(c);
    if (l > 0.85) return 'light';
    if (l > 0.6) return 'lightish';
    if (l > 0.4) return 'mid';
    if (l > 0.2) return 'darkish';
    return 'dark';
}

/** Pick a light foreground color that yields >= target contrast on the dark bg. */
function pickReadableForeground(darkBg, safeColors, minContrast = 4.5) {
    for (const c of safeColors) {
        if (contrastRatio(c.c, darkBg) >= minContrast) return c.name;
    }
    return safeColors[0].name;
}

module.exports = {
    parseRgba,
    relLum,
    contrastRatio,
    colorDist,
    luminanceBand,
    pickReadableForeground
};
