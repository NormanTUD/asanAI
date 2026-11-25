/**
 * Pixel-diff — finds clusters of pixels that differ (or stay the same)
 * between two PNG screenshots of the same viewport at the same scroll
 * position but with different themes applied.
 */

const fs = require('fs');
const PNG = require('pngjs');

// pngjs 7.x moved `sync` under `PNG.PNG.sync` (it's `png.sync` in 6.x).
// Detect once and reuse.
const PNG_SYNC = (PNG.PNG && PNG.PNG.sync) || PNG.sync;
function pngSyncRead(buf) { return PNG_SYNC.read(buf); }

/**
 * Find clusters of WHITE pixels in BOTH light and dark screenshots, at
 * approximately the same position. These are containers that didn't
 * switch to dark mode.
 *
 * @param {string} lightPath
 * @param {string} darkPath
 * @param {Object} [opts]
 * @param {number} [opts.minCluster=800]
 * @param {number} [opts.whiteThreshold=235]
 * @param {number} [opts.maxSimilarity=30]
 * @param {number} [opts.maxAspectRatio=5]
 * @returns {Promise<Array<{x, y, w, h, pixels}>>}
 */
async function findStuckWhiteClusters(lightPath, darkPath, opts = {}) {
    const minCluster = opts.minCluster || 800;
    const whiteThreshold = opts.whiteThreshold || 235;
    const maxSimilarity = opts.maxSimilarity || 30;
    const maxAspectRatio = opts.maxAspectRatio || 5;

    const light = pngSyncRead(fs.readFileSync(lightPath));
    const dark  = pngSyncRead(fs.readFileSync(darkPath));
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
            if (la > whiteThreshold && da > whiteThreshold && d < maxSimilarity) {
                mask[y * W + x] = 1;
            }
        }
    }
    return floodClusters(mask, W, H, { minCluster, maxAspectRatio });
}

/**
 * Find clusters of pixels that differ strongly between light and dark
 * (potential theme-switch bugs).
 */
async function findChangedClusters(lightPath, darkPath, opts = {}) {
    const minCluster = opts.minCluster || 500;
    const minDifference = opts.minDifference || 100;
    const light = pngSyncRead(fs.readFileSync(lightPath));
    const dark  = pngSyncRead(fs.readFileSync(darkPath));
    const W = dark.width, H = dark.height;
    const mask = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) << 2;
            const d = Math.abs(light.data[i] - dark.data[i]) +
                      Math.abs(light.data[i+1] - dark.data[i+1]) +
                      Math.abs(light.data[i+2] - dark.data[i+2]);
            if (d > minDifference) mask[y * W + x] = 1;
        }
    }
    return floodClusters(mask, W, H, { minCluster });
}

function floodClusters(mask, W, H, { minCluster = 50, maxAspectRatio = Infinity } = {}) {
    const visited = new Uint8Array(W * H);
    const clusters = [];
    const stack = [];
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
                if (jx > 0)     stack.push(j - 1);
                if (jx < W - 1) stack.push(j + 1);
                if (jy > 0)     stack.push(j - W);
                if (jy < H - 1) stack.push(j + W);
            }
            if (count >= minCluster) {
                const w = maxX - minX + 1, h = maxY - minY + 1;
                const aspect = Math.max(w, h) / Math.min(w, h);
                if (aspect > maxAspectRatio) continue;
                if (w < 10 || h < 10) continue;
                clusters.push({ x: minX, y: minY, w, h, pixels: count });
            }
        }
    }
    return clusters;
}

module.exports = { findStuckWhiteClusters, findChangedClusters };
