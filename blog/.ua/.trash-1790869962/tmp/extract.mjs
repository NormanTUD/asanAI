#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = '/home/norman/repos/asanai/blog';
const UA = path.join(PROJECT_ROOT, '.ua');
const scope = fs.readFileSync(path.join(UA, 'tmp', 'scope.txt'), 'utf8').split('\n').map(s => s.trim()).filter(Boolean);

const CODE_EXT = new Set(['js', 'php', 'py', 'v']);
function ext(p) { const m = p.match(/\.([a-z0-9]+)$/i); return m ? m[1].toLowerCase() : ''; }
function isDottedDot(p) { return /(^|\/)\.[a-z.]+$/.test(p); } // .htaccess, .user.ini

function categorize(p) {
  const e = ext(p);
  if (CODE_EXT.has(e)) return 'code';
  if (['json','ini','yml','yaml','toml'].includes(e)) return 'config';
  if (isDottedDot(p)) return 'config';
  if (e === 'sh') return 'script';
  if (e === 'html') return 'markup';
  if (['md','rst','tex'].includes(e)) return 'docs';
  if (e === 'txt') return 'data';
  if (['css'].includes(e)) return 'code';
  return 'other';
}
function langFor(p) {
  const e = ext(p);
  if (e === 'js') return 'javascript';
  if (e === 'php') return 'php';
  if (e === 'py') return 'python';
  if (e === 'v') return 'coq';
  if (e === 'css') return 'css';
  if (e === 'html') return 'html';
  if (e === 'md') return 'markdown';
  if (e === 'json') return 'json';
  if (e === 'sh') return 'shell';
  if (e === 'yml') return 'yaml';
  if (e === 'ini') return 'ini';
  if (isDottedDot(p)) return 'config';
  if (e === 'txt') return 'text';
  return 'other';
}
function lineCount(p) {
  try { const c = fs.readFileSync(p, 'utf8'); return c.split('\n').length; } catch { return 0; }
}

// ---- symbol extraction (regex heuristics) ----
function extractSymbols(text, lang) {
  const funcs = new Set(), classes = new Set();
  const lines = text.split('\n');
  if (lang === 'javascript' || lang === 'css' || lang === 'html') {
    if (lang === 'javascript') {
      for (const ln of lines) {
        let m;
        if ((m = ln.match(/^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/))) funcs.add(m[1]);
        if ((m = ln.match(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:function\b|[^=]*=>)/))) funcs.add(m[1]);
        if ((m = ln.match(/^\s*class\s+([A-Za-z_$][\w$]*)\b/))) classes.add(m[1]);
      }
    }
  } else if (lang === 'php') {
    for (const ln of lines) {
      let m;
      if ((m = ln.match(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/))) funcs.add(m[1]);
      if ((m = ln.match(/\bclass\s+([A-Za-z_$][\w$]*)\b/))) classes.add(m[1]);
    }
  } else if (lang === 'python') {
    for (const ln of lines) {
      let m;
      if ((m = ln.match(/^\s*def\s+([A-Za-z_]\w*)\s*\(/))) funcs.add(m[1]);
      if ((m = ln.match(/^\s*class\s+([A-Za-z_]\w*)\b/))) classes.add(m[1]);
    }
  } else if (lang === 'coq') {
    for (const ln of lines) {
      let m;
      if ((m = ln.match(/^\s*(?:Definition|Fixpoint|Let|Lemma|Theorem|Corollary|Example|Fact|Prop)\s+([A-Za-z_]\w*)/))) funcs.add(m[1]);
      if ((m = ln.match(/^\s*(?:Inductive|Coinductive|Record|Variant|Class)\s+([A-Za-z_]\w*)/))) classes.add(m[1]);
    }
  }
  return { functions: [...funcs], classes: [...classes] };
}

// ---- import extraction (raw specifiers) ----
function extractImports(text, lang, p) {
  const specs = [];
  if (lang === 'javascript') {
    let m;
    const reImport = /import\s+(?:[\w${}\s,*]+\s+from\s+)?['"]([^'"]+)['"]/g;
    const reRequire = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((m = reImport.exec(text))) specs.push(m[1]);
    while ((m = reRequire.exec(text))) specs.push(m[1]);
  } else if (lang === 'php') {
    const re = /\b(?:include|include_once|require|require_once)\s*\(\s*["']([^"']+)["']/g;
    let m; while ((m = re.exec(text))) specs.push(m[1]);
  } else if (lang === 'python') {
    let m;
    const reFrom = /^\s*from\s+([\w.]+)\s+import/gm;
    const reImp = /^\s*import\s+([\w.]+(?:\s*,\s*[\w.]+)*)/gm;
    while ((m = reFrom.exec(text))) specs.push(m[1]);
    while ((m = reImp.exec(text))) for (const part of m[1].split(',')) specs.push(part.trim());
  }
  return specs;
}

// ---- resolve a raw specifier to an in-project relative path (or null) ----
function resolveSpecifier(spec, fromRel, lang) {
  if (!spec) return null;
  if (/^(https?:|\/\/|data:)/.test(spec)) return null;
  if (/^[\w.]+(\/[\w.]+)*$/.test(spec) && !spec.startsWith('.') && !spec.startsWith('/') && lang === 'python') {
    // python module; try <spec>.py
    const cand = spec.replace(/\./g, '/') + '.py';
    return exists(cand) ? cand : null;
  }
  // JS/PHP relative or absolute-ish
  const base = path.posix.dirname(fromRel);
  let abs = null;
  if (spec.startsWith('./') || spec.startsWith('../')) {
    abs = path.posix.normalize(path.posix.join(base, spec));
  } else if (spec.startsWith('/')) {
    abs = spec.replace(/^\//, '');
  } else {
    abs = path.posix.normalize(path.posix.join(base, spec));
  }
  if (exists(abs)) return abs;
  // try adding extension
  if (!/\.[a-z0-9]+$/i.test(abs)) {
    for (const e of ['js', 'php', 'html', 'json', 'css']) {
      if (exists(abs + '.' + e)) return abs + '.' + e;
    }
  }
  return null;
}
function exists(rel) { try { return fs.statSync(path.join(PROJECT_ROOT, rel)).isFile(); } catch { return false; } }

// ---- build file inventory + importMap ----
const files = [];
const importMap = {};
const symbolBaseline = {};
const byExt = {}, byCat = {}, byLang = {};

for (const rel of scope) {
  const full = path.join(PROJECT_ROOT, rel);
  const lang = langFor(rel);
  const cat = categorize(rel);
  let text = '';
  try { text = fs.readFileSync(full, 'utf8'); } catch {}
  const n = lineCount(full);
  const sym = (lang === 'javascript' || lang === 'php' || lang === 'python' || lang === 'coq') ? extractSymbols(text, lang) : { functions: [], classes: [] };
  const impRaw = extractImports(text, lang, rel);
  const resolved = [...new Set(impRaw.map(s => resolveSpecifier(s, rel, lang)).filter(Boolean))];
  files.push({ path: rel, language: lang, sizeLines: n, fileCategory: cat, symbols: sym });
  importMap[rel] = resolved;
  symbolBaseline[rel] = sym;
  byExt[ext(rel) || '(none)'] = (byExt[ext(rel) || '(none)'] || 0) + 1;
  byCat[cat] = (byCat[cat] || 0) + 1;
  byLang[lang] = (byLang[lang] || 0) + 1;
}

const scan = {
  projectName: 'blog — From Big Bang to ChatGPT',
  description: 'A free digital textbook / interactive course that takes the reader from Stone Age tools and the history of math and machines, through the math of deep learning, to how modern LLMs actually work. PHP templates + vanilla JS, served statically; interactive in-browser visualizations throughout.',
  projectRoot: PROJECT_ROOT,
  languages: Object.keys(byLang).sort(),
  frameworks: ['PHP (server-side templates)', 'Vanilla JavaScript', 'TensorFlow.js', 'Plotly', 'ECharts', 'Three.js', 'Temml (TeX)'],
  totalFiles: files.length,
  filesByCategory: byCat,
  filesByExtension: byExt,
  filesByLanguage: byLang,
  files,
  importMap,
};
fs.mkdirSync(path.join(UA, 'intermediate'), { recursive: true });
fs.writeFileSync(path.join(UA, 'intermediate', 'scan-result.json'), JSON.stringify(scan, null, 2));
fs.writeFileSync(path.join(UA, 'intermediate', 'symbol-baseline.json'), JSON.stringify(symbolBaseline, null, 2));
console.log('scan-result.json written: %d files', files.length);
console.log('byCategory:', JSON.stringify(byCat));
console.log('byLanguage:', JSON.stringify(byLang));
const withImports = Object.entries(importMap).filter(([,v]) => v.length).length;
console.log('files with in-project imports:', withImports);
