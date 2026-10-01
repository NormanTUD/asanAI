#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
const R = '/home/norman/repos/asanai/blog';
const UA = path.join(R, '.ua');
const scan = JSON.parse(fs.readFileSync(path.join(UA, 'intermediate', 'scan-result.json'), 'utf8'));
const importMap = scan.importMap;
const files = scan.files;
const byPath = Object.fromEntries(files.map(f => [f.path, f]));
const symBase = JSON.parse(fs.readFileSync(path.join(UA, 'intermediate', 'symbol-baseline.json'), 'utf8'));

// Parse COURSE_METADATA part from top-level lesson PHP files
function partOf(rel) {
  if (!rel.endsWith('.php')) return null;
  try {
    const t = fs.readFileSync(path.join(R, rel), 'utf8');
    const m = t.match(/COURSE_METADATA:[^>]*?part\s*[:=]\s*(\d+)/i);
    if (m) return parseInt(m[1], 10);
  } catch {}
  return null;
}
// slug -> part for top-level php lessons
const phpPart = {};
for (const f of files) if (f.path.endsWith('.php') && !f.path.includes('/')) {
  const p = partOf(f.path); if (p) phpPart[f.path.replace(/\.php$/, '')] = p;
}

// Decide group key for each file
const groupOf = {};
for (const f of files) {
  const p = f.path;
  if (p.startsWith('lndw/')) groupOf[p] = 'lndw';
  else if (p.startsWith('lndw_history/')) groupOf[p] = 'lndw_history';
  else if (p.startsWith('darkmode-ci/')) groupOf[p] = 'darkmode-ci';
  else if (p.startsWith('py/')) groupOf[p] = 'py';
  else if (p.startsWith('coq/')) groupOf[p] = 'coq';
  else if (p.startsWith('tests/') || p.startsWith('test/')) groupOf[p] = 'tests';
  else if (p.startsWith('learnsys/')) groupOf[p] = 'learnsys';
  else if (p.startsWith('todo/')) groupOf[p] = 'todo';
  else {
    // top-level: lesson php -> its part; paired js follows the php's part
    if (p.endsWith('.php')) {
      const slug = p.replace(/\.php$/, '');
      groupOf[p] = phpPart[slug] ? `part-${phpPart[slug]}` : 'infra';
    } else if (p.endsWith('.js')) {
      const slug = p.replace(/\.js$/, '');
      groupOf[p] = phpPart[slug] ? `part-${phpPart[slug]}` : 'infra';
    } else if (p.endsWith('.html')) {
      const slug = p.replace(/\.html$/, '');
      groupOf[p] = phpPart[slug] ? `part-${phpPart[slug]}` : 'infra';
    } else {
      groupOf[p] = 'infra';
    }
  }
}

// Collect groups
const groups = {};
for (const f of files) (groups[groupOf[f.path]] ||= []).push(f);

const LINE_BUDGET = 9000; // per batch
const NAME = {
  'part-1': 'Part 1 — Foundations', 'part-2': 'Part 2 — How Neural Networks Learn',
  'part-3': 'Part 3 — Deep Learning & Vision', 'part-4': 'Part 4 — The Transformer Revolution',
  'part-5': 'Part 5 — Making AI Useful', 'part-6': 'Part 6 — Bigger Questions',
  'infra': 'Core Infrastructure & Course Shell',
  'lndw': 'lndw — Language/Network Demo Collection', 'lndw_history': 'lndw_history',
  'darkmode-ci': 'darkmode-ci — Theme Screenshot CI', 'py': 'py — Python Reference Implementations',
  'coq': 'coq — Formalizations (Coq)', 'tests': 'tests — Test Suite',
  'learnsys': 'learnsys', 'todo': 'todo — WIP Scratch',
};

// Build batches: split each group into sub-batches by line budget
const MIN_MERGE = 2000;
const rawBatches = [];
const order = ['infra', 'part-1', 'part-2', 'part-3', 'part-4', 'part-5', 'part-6',
  'lndw', 'lndw_history', 'py', 'coq', 'tests', 'darkmode-ci', 'learnsys', 'todo'];
for (const g of order) {
  const fs2 = (groups[g] || []).slice().sort((a, b) => a.path.localeCompare(b.path));
  // group by slug so lesson php+js(+html) stay adjacent
  const bySlug = {};
  for (const f of fs2) { const slug = f.path.split('/').pop().replace(/\.[a-z0-9]+$/i, ''); (bySlug[slug] ||= []).push(f); }
  const flat = Object.values(bySlug).flat();
  let cur = [], curLines = 0;
  const emit = () => { if (cur.length) { rawBatches.push({ theme: g, name: NAME[g], files: cur, lines: cur.reduce((a, x) => a + x.sizeLines, 0) }); cur = []; curLines = 0; } };
  for (const f of flat) {
    if (curLines + f.sizeLines > LINE_BUDGET && cur.length) emit();
    cur.push(f); curLines += f.sizeLines;
  }
  emit();
}
// Merge tiny same-theme batches into a neighbor to reduce dispatch count
{
  const byTheme = {};
  for (const b of rawBatches) (byTheme[b.theme] ||= []).push(b);
  const merged = [];
  for (const theme of Object.keys(byTheme)) {
    let bs = byTheme[theme].slice();
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < bs.length; i++) {
        if (bs[i].lines < MIN_MERGE) {
          const target = bs[i - 1] && bs[i - 1].lines + bs[i].lines <= LINE_BUDGET ? i - 1
            : bs[i + 1] && bs[i + 1].lines + bs[i].lines <= LINE_BUDGET ? i + 1 : -1;
          if (target !== -1) {
            const t = bs[target]; t.files = t.files.concat(bs[i].files); t.lines += bs[i].lines;
            bs.splice(i, 1); changed = true; break;
          }
        }
      }
    }
    merged.push(...bs);
  }
  rawBatches.length = 0; rawBatches.push(...merged);
}

// Assign batch indexes
const batches = rawBatches.map((b, i) => ({ index: i, theme: b.theme, name: b.name, files: b.files }));

// Build batchImportData + neighborMap per batch
const batchOfFile = {}; // file path -> batch index
batches.forEach((b, i) => b.files.forEach(f => batchOfFile[f.path] = i));

function nodeIdFor(f) {
  const cat = f.fileCategory;
  const prefix = cat === 'config' ? 'config' : cat === 'docs' ? 'document' : 'file';
  return `${prefix}:${f.path}`;
}
for (const b of batches) {
  const bid = b.index;
  const bidData = {}; const neighborMap = {};
  for (const f of b.files) {
    const imps = importMap[f.path] || [];
    bidData[f.path] = imps;
    const neighbors = [];
    for (const imp of imps) {
      if (batchOfFile[imp] !== bid) {
        const nf = byPath[imp]; if (!nf) continue;
        const sym = symBase[imp] || { functions: [], classes: [] };
        neighbors.push({ id: nodeIdFor(nf), name: nf.path.split('/').pop(), type: 'file', path: imp, exportedFunctions: sym.functions.slice(0, 40), exportedClasses: sym.classes.slice(0, 40) });
      }
    }
    neighborMap[f.path] = neighbors;
  }
  b.batchImportData = bidData;
  b.neighborMap = neighborMap;
}

const totalFiles = batches.reduce((a, b) => a + b.files.length, 0);
const out = { totalBatches: batches.length, totalFiles, batches };
fs.writeFileSync(path.join(UA, 'intermediate', 'batches.json'), JSON.stringify(out, null, 2));
console.log('batches.json: %d batches, %d files', batches.length, totalFiles);
for (const b of batches) console.log(`  [${b.index}] ${b.name} — ${b.files.length} files, ${b.files.reduce((a, f) => a + f.sizeLines, 0)} lines`);
