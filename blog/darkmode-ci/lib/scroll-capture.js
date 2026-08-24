/**
 * ScrollCapture — generic scroll-and-screenshot library.
 *
 * Reusable for any puppeteer-driven visual inspection task. Handles:
 *   - booting a browser context
 *   - navigating to a URL
 *   - waiting for the loader / module system
 *   - scrolling through the page in fixed steps
 *   - waiting for lazy-loaded content to settle
 *   - taking screenshots at each position
 *   - optionally switching themes and capturing both
 *
 * Used internally by test.js; can also be called directly from any
 * other script that needs to do scroll-and-screenshot.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { setTheme, presetCookie } = require('./theme-controller');
const { snapshotVisibleElements } = require('./element-snapshot');

const DEFAULT_VIEWPORT = { width: 1280, height: 800 };

class ScrollCapture {
    /**
     * @param {Object} opts
     * @param {string} [opts.executablePath='/usr/bin/chromium']
     * @param {string} [opts.baseUrl]
     * @param {{width: number, height: number}} [opts.viewport]
     * @param {number} [opts.scrollStep=700]
     * @param {number} [opts.maxHeight=20000]
     * @param {number} [opts.waitAfterScrollMs=10000]
     * @param {number} [opts.settleAfterToggleMs=1000]
     * @param {boolean} [opts.headless=true]
     * @param {number} [opts.deviceScaleFactor=1]
     */
    constructor(opts = {}) {
        this.executablePath = opts.executablePath || '/usr/bin/chromium';
        this.baseUrl = opts.baseUrl || 'http://localhost/asanai/blog';
        this.viewport = opts.viewport || DEFAULT_VIEWPORT;
        this.scrollStep = opts.scrollStep || 700;
        this.maxHeight = opts.maxHeight || 20000;
        this.waitAfterScrollMs = opts.waitAfterScrollMs || 10000;
        this.settleAfterToggleMs = opts.settleAfterToggleMs || 1000;
        this.headless = opts.headless !== false;
        this.deviceScaleFactor = opts.deviceScaleFactor || 1;
        this.browser = null;
    }

    async launch() {
        if (this.browser) return;
        this.browser = await puppeteer.launch({
            executablePath: this.executablePath,
            headless: this.headless ? 'new' : false,
            protocolTimeout: 300000, // 5 min — some lab pages are heavy
            args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
    }

    async close() {
        if (!this.browser) return;
        await this.browser.close().catch(() => {});
        this.browser = null;
    }

    /**
     * Open a single page (in its own browser context so cookies + storage
     * are isolated).
     */
    async openPage() {
        if (!this.browser) await this.launch();
        const ctx = await this.browser.createBrowserContext();
        const page = await ctx.newPage();
        await page.setViewport({
            width: this.viewport.width,
            height: this.viewport.height,
            deviceScaleFactor: this.deviceScaleFactor,
        });
        return { ctx, page };
    }

    /**
     * Navigate to the URL and wait for the loader to finish.
     */
    async navigate(page, url, opts = {}) {
        if (opts.theme) {
            await page.setCookie({
                name: 'theme', value: opts.theme,
                url: this.baseUrl
            });
        }
        const resp = await page.goto(url, { waitUntil: opts.waitUntil || 'networkidle2', timeout: opts.timeout || 60000 });
        if (opts.waitForModules !== false) {
            try {
                await page.waitForFunction(
                    () => (typeof window._modulesLoaded === 'undefined') || window._modulesLoaded,
                    { timeout: 30000 });
            } catch { /* ok — page has no module loader */ }
        }
        await new Promise(r => setTimeout(r, opts.afterLoadMs || 2000));
        return resp;
    }

    /**
     * Scroll the page to absolute Y. Forces a layout + 2 animation frames
     * before returning so the next screenshot shows the new scroll
     * position (this is the bug that the original tester hit: page.screenshot
     * was being taken before the browser painted the new scroll position).
     */
    async scrollTo(page, y) {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.evaluate(() => new Promise(resolve => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        }));
    }

    async getPageHeight(page) {
        return await page.evaluate(() => Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight));
    }

    /**
     * Compute scroll positions covering the page in scrollStep increments,
     * capped at maxHeight.
     */
    computeScrollPositions(pageHeight) {
        const h = Math.min(pageHeight, this.maxHeight);
        const positions = [0];
        for (let y = this.scrollStep; y < h; y += this.scrollStep) positions.push(y);
        const last = positions[positions.length - 1];
        if (last < h - this.viewport.height) positions.push(Math.max(0, h - this.viewport.height));
        return positions;
    }

    /**
     * Capture the viewport at a given scroll position, optionally in
     * both themes. Returns { y, theme, path, snap }.
     */
    async captureAt(page, y, opts = {}) {
        await this.scrollTo(page, y);
        if (opts.waitAfterScrollMs !== 0) {
            await new Promise(r => setTimeout(r, opts.waitAfterScrollMs ?? this.waitAfterScrollMs));
        }
        const themes = opts.themes || ['light'];
        const results = [];
        for (const theme of themes) {
            await setTheme(page, theme, { settleMs: this.settleAfterToggleMs });
            const snap = opts.snapshot ? await snapshotVisibleElements(page) : null;
            const ts = opts.timestamp !== false
                ? new Date().toISOString().replace(/[:.]/g, '-')
                : 'now';
            const fname = opts.basename
                ? `${opts.basename}-y${y}-${theme}.png`
                : `block-y${y}-${theme}.png`;
            const path = opts.outDir ? require('path').join(opts.outDir, fname) : fname;
            if (opts.outDir) {
                require('fs').mkdirSync(opts.outDir, { recursive: true });
                await page.screenshot({ path, captureBeyondViewport: false });
            } else {
                const buf = await page.screenshot({ captureBeyondViewport: false });
                results.push({ buf, theme, y });
                continue;
            }
            results.push({ y, theme, path, snap });
        }
        return results;
    }

    /**
     * Capture an entire page: scroll through and take screenshots at
     * each position. Returns an array of { y, theme, path, snap }.
     *
     * @param {string} pageSlug   e.g. "history" — appended to baseUrl
     * @param {Object} [opts]
     * @param {string} [opts.url]   Full URL (overrides baseUrl + pageSlug)
     * @param {string[]} [opts.themes=['light']]
     * @param {string} [opts.outDir]   Where to write PNGs
     * @param {boolean} [opts.snapshot=false]   Also capture DOM snapshot
     */
    async capturePage(pageSlug, opts = {}) {
        const { ctx, page } = await this.openPage();
        try {
            const url = opts.url || `${this.baseUrl}/${pageSlug}.php`;
            await this.navigate(page, url, opts);
            const pageHeight = await this.getPageHeight(page);
            const positions = this.computeScrollPositions(pageHeight);
            const all = [];
            for (const y of positions) {
                const results = await this.captureAt(page, y, {
                    ...opts,
                    basename: pageSlug,
                });
                all.push(...results);
            }
            return { pageSlug, url, pageHeight, blocks: all };
        } finally {
            try { await ctx.close(); } catch { /* ignore */ }
        }
    }
}

module.exports = { ScrollCapture };
