#!/usr/bin/env node
/* Background watcher — monitors the dark-mode test run and applies
 * autofix whenever new data arrives.
 *
 * Run: node watch-and-fix.js
 * Stops when test.js finishes (i.e. the run.log shows "Done." or no
 * new data for 10 minutes).
 */
const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const CI_DIR = __dirname;
const STREAM = path.join(CI_DIR, 'darkmode-ci-out', '_stream.jsonl');
const RUN_LOG = path.join(CI_DIR, 'run.log');
const STYLE_CSS = path.join(CI_DIR, '..', 'style.css');
const CHECK_INTERVAL_MS = 60000; // check every minute

function lineCount() {
    try {
        return fs.readFileSync(STREAM, 'utf8').split('\n').filter(Boolean).length;
    } catch { return 0; }
}

function runFinished() {
    try {
        const log = fs.readFileSync(RUN_LOG, 'utf8');
        return log.includes('Done.') || log.includes('FATAL');
    } catch { return false; }
}

function runAutofix() {
    console.log(`[${new Date().toISOString()}] running autofix (${lineCount()} stream lines)...`);
    // Pass --include-stuck-white so we also fix the container backgrounds
    // (the stuck-white pixel clusters). Bare-tag selectors are skipped
    // automatically inside autofix.js.
    const r = spawnSync('node', ['autofix.js', '--stream', STREAM, '--css', STYLE_CSS, '--include-stuck-white'], {
        cwd: CI_DIR,
        encoding: 'utf8',
        timeout: 30000
    });
    if (r.status === 0) {
        const lines = r.stdout.split('\n');
        const applied = lines.find(l => l.includes('Applied'));
        const reportLine = lines.find(l => l.includes('report:'));
        console.log(`  ${applied || 'no Applied line'}`);
        console.log(`  ${reportLine || ''}`);
    } else {
        console.log(`  autofix failed (exit ${r.status})`);
        console.log(`  stderr: ${r.stderr.slice(0, 300)}`);
    }
}

async function main() {
    console.log(`[${new Date().toISOString()}] Starting watcher`);
    console.log(`  stream: ${STREAM}`);
    console.log(`  css:    ${STYLE_CSS}`);
    let lastCount = 0;
    let idleChecks = 0;
    while (true) {
        const current = lineCount();
        if (current !== lastCount) {
            console.log(`[${new Date().toISOString()}] stream: ${current} lines (was ${lastCount})`);
            // Apply autofix when we cross a 10-block boundary
            const lastBucket = Math.floor(lastCount / 10);
            const currentBucket = Math.floor(current / 10);
            if (currentBucket > lastBucket && current > 0) {
                runAutofix();
            }
            lastCount = current;
            idleChecks = 0;
        } else {
            idleChecks++;
            if (runFinished()) {
                console.log(`[${new Date().toISOString()}] run finished — applying final autofix`);
                runAutofix();
                break;
            }
            if (idleChecks >= 10) {
                console.log(`[${new Date().toISOString()}] no new data for ${idleChecks} minutes`);
                idleChecks = 0;
                // Still try autofix in case
                runAutofix();
            }
        }
        await new Promise(r => setTimeout(r, CHECK_INTERVAL_MS));
    }
    console.log(`[${new Date().toISOString()}] Done.`);
}

main().catch(e => { console.error(e); process.exit(1); });
