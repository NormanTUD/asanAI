#!/usr/bin/env node
/* Side-by-side image generator for darkmode-ci
 *
 * Creates a comparison image: light | dark | dark-annotated (with red
 * boxes around stuck-white clusters).
 *
 * Usage: node make-sxs.js [page-slug]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const PNG = require('pngjs').PNG;

const OUT = path.join(__dirname, 'darkmode-ci-out');
const SXS_DIR = path.join(__dirname, 'sxs');

function mkdirp(d) { fs.mkdirSync(d, { recursive: true }); }

async function main() {
    const targetPage = process.argv[2];
    mkdirp(SXS_DIR);

    const pages = fs.readdirSync(OUT).filter(p => {
        const s = fs.statSync(path.join(OUT, p));
        return s.isDirectory() && (!targetPage || p === targetPage);
    });

    let totalImages = 0;
    for (const page of pages) {
        const dir = path.join(OUT, page);
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.png') && f.includes('light.png'));
        const pageSxsDir = path.join(SXS_DIR, page);
        mkdirp(pageSxsDir);

        for (const lightFile of files) {
            const blockMatch = lightFile.match(/block-(\d+)-y(\d+)-light\.png/);
            if (!blockMatch) continue;
            const idx = blockMatch[1];
            const y = blockMatch[2];
            const lightPath = path.join(dir, lightFile);
            const darkFile = lightFile.replace('-light.png', '-dark.png');
            const darkPath = path.join(dir, darkFile);
            if (!fs.existsSync(darkPath)) continue;

            // Try to load cluster data from stream
            const streamPath = path.join(OUT, '_stream.jsonl');
            let clusters = [];
            if (fs.existsSync(streamPath)) {
                const lines = fs.readFileSync(streamPath, 'utf8').split('\n').filter(Boolean);
                for (const line of lines) {
                    try {
                        const d = JSON.parse(line);
                        if (d.page === page && d.block == idx) {
                            clusters = d.whiteClusters || [];
                            break;
                        }
                    } catch {}
                }
            }

            // Annotate dark with red boxes
            if (clusters.length > 0) {
                const dark = PNG.sync.read(fs.readFileSync(darkPath));
                const drawBox = (x, y, w, h) => {
                    x = Math.max(0, Math.round(x));
                    y = Math.max(0, Math.round(y));
                    w = Math.min(dark.width - x, Math.round(w));
                    h = Math.min(dark.height - y, Math.round(h));
                    for (let i = 0; i < w; i++) {
                        for (const yy of [y, y + h - 1]) {
                            if (yy < 0 || yy >= dark.height) continue;
                            const j = (yy * dark.width + (x + i)) << 2;
                            dark.data[j] = 255;
                            dark.data[j + 1] = 0;
                            dark.data[j + 2] = 0;
                        }
                    }
                    for (let i = 0; i < h; i++) {
                        for (const xx of [x, x + w - 1]) {
                            if (xx < 0 || xx >= dark.width) continue;
                            const j = ((y + i) * dark.width + xx) << 2;
                            dark.data[j] = 255;
                            dark.data[j + 1] = 0;
                            dark.data[j + 2] = 0;
                        }
                    }
                };
                for (const c of clusters.slice(0, 10)) {
                    drawBox(c.x, c.y, c.w, c.h);
                }
                const annotatedPath = path.join(pageSxsDir, `block-${idx}-y${y}-annotated.png`);
                fs.writeFileSync(annotatedPath, PNG.sync.write(dark));
            }

            const sxsPath = path.join(pageSxsDir, `block-${idx}-y${y}-sxs.png`);
            const annotated = path.join(pageSxsDir, `block-${idx}-y${y}-annotated.png`);
            try {
                const inputs = fs.existsSync(annotated)
                    ? `${lightPath} ${darkPath} ${annotated}`
                    : `${lightPath} ${darkPath}`;
                const cols = fs.existsSync(annotated) ? 3 : 2;
                execSync(`convert ${inputs} +append -bordercolor '#888' -border 2x2 ${sxsPath}`, { stdio: 'pipe' });
                totalImages++;
            } catch (e) {
                console.error(`Failed ${page}/${idx}: ${e.message.slice(0, 80)}`);
            }
        }
        console.log(`${page}: done`);
    }
    console.log(`\nCreated ${totalImages} side-by-side images in ${SXS_DIR}`);
}

main().catch(e => { console.error(e); process.exit(1); });
