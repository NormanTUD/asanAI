#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
const R = '/home/norman/repos/asanai/blog';
const UA = path.join(R, '.ua');
const bj = JSON.parse(fs.readFileSync(path.join(UA, 'intermediate', 'batches.json'), 'utf8'));
const outDir = path.join(UA, 'tmp', 'batch-data');
fs.mkdirSync(outDir, { recursive: true });
const byPath = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(UA,'intermediate','scan-result.json'),'utf8')).files.map(f=>[f.path,f]));
const symBase = JSON.parse(fs.readFileSync(path.join(UA, 'intermediate', 'symbol-baseline.json'), 'utf8'));
function nodeIdFor(f){ const c=f.fileCategory; const p=c==='config'?'config':c==='docs'?'document':'file'; return `${p}:${f.path}`; }

for (const b of bj.batches) {
  const files = b.files.map(f => ({
    path: f.path, language: f.language, sizeLines: f.sizeLines, fileCategory: f.fileCategory,
    symbols: symBase[f.path] || { functions: [], classes: [] },
    importMap: b.batchImportData[f.path] || [],
    neighbors: (b.neighborMap[f.path] || []).map(n => ({ ...n, exportedFunctions: n.exportedFunctions.slice(0,30), exportedClasses: n.exportedClasses.slice(0,30) })),
  }));
  const data = {
    batchIndex: b.index, name: b.name, theme: b.theme,
    project: 'blog — From Big Bang to ChatGPT',
    outputFileName: `batch-${b.index}.json`,
    files,
  };
  fs.writeFileSync(path.join(outDir, `batch-${b.index}.json`), JSON.stringify(data, null, 1));
}
console.log('wrote %d batch data files', bj.batches.length);
