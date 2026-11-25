/**
 * Theme controller — toggles html.dark class + cookie + meta theme-color.
 *
 * The blog uses document.documentElement.classList.toggle('dark') as the
 * single source of truth, mirrored to the `theme` cookie. This helper also
 * waits one tick so any MutationObserver-based re-renderers can fire.
 */

/**
 * Set the page theme.
 * @param {import('puppeteer-core').Page} page
 * @param {'light' | 'dark'} theme
 * @param {Object} [opts]
 * @param {number} [opts.settleMs=1000]  Time to wait after toggling so
 *   MutationObservers and CSS transitions can complete.
 * @param {string} [opts.cookiePath='/']
 * @param {string} [opts.cookieDomain]  Defaults to the current page origin.
 */
async function setTheme(page, theme, opts = {}) {
    const settleMs = opts.settleMs ?? 1000;
    const cookiePath = opts.cookiePath || '/';
    await page.evaluate((t, path) => {
        const html = document.documentElement;
        if (t === 'dark') html.classList.add('dark');
        else html.classList.remove('dark');
        document.cookie = `theme=${t}; path=${path}; max-age=${60 * 60 * 24 * 365}`;
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = t === 'dark' ? '#0f172a' : '#ffffff';
    }, theme, cookiePath);
    if (settleMs > 0) {
        await new Promise(r => setTimeout(r, settleMs));
    }
}

/** Pre-set the theme cookie before navigating so the page boots in the desired theme. */
async function presetCookie(browser, baseUrl, theme) {
    await browser.setCookie({
        name: 'theme',
        value: theme,
        url: baseUrl,
    });
}

/** Returns true if the page is currently in dark mode. */
async function isDark(page) {
    return await page.evaluate(() => document.documentElement.classList.contains('dark'));
}

module.exports = { setTheme, presetCookie, isDark };
