#!/usr/bin/env node
import fs from 'fs';
import crypto from 'crypto';
const R = '/home/norman/repos/asanai/blog';
const UA = R + '/.ua';
const COMMIT = 'a6f570ced0a7fe530f4fdd725ecd5a45af351285';
const scope = fs.readFileSync(UA + '/tmp/scope.txt', 'utf8').split('\n').map(s => s.trim()).filter(Boolean);

// 1. final knowledge graph = assembled (already full KnowledgeGraph)
const graph = JSON.parse(fs.readFileSync(UA + '/intermediate/assembled-graph.json', 'utf8'));
fs.writeFileSync(UA + '/knowledge-graph.json', JSON.stringify(graph, null, 2));

// 2. best-effort structural fingerprints (pure node; no @understand-anything/core available)
const files = {};
for (const rel of scope) {
  const full = R + '/' + rel;
  let sha = '', lines = 0;
  try { const b = fs.readFileSync(full); sha = crypto.createHash('sha256').update(b).digest('hex'); lines = b.toString('utf8').split('\n').length; } catch {}
  files[rel] = { sha256: sha, lines };
}
const fp = { version: '1.0.0-selfcontained', gitCommitHash: COMMIT, note: 'Content-hash + line-count baseline generated in pure Node because @understand-anything/core could not be built (current-directory-only constraint). Not the plugin fingerprint format; future plugin incremental runs will treat this as a full rebuild.', files };
fs.writeFileSync(UA + '/fingerprints.json', JSON.stringify(fp, null, 2));

// 3. meta
const meta = {
  lastAnalyzedAt: new Date().toISOString(),
  gitCommitHash: COMMIT,
  version: '1.0.0',
  analyzedFiles: scope.length,
};
fs.writeFileSync(UA + '/meta.json', JSON.stringify(meta, null, 2));

// 4. config (language en)
fs.writeFileSync(UA + '/config.json', JSON.stringify({ outputLanguage: 'en' }, null, 2));

console.log('saved knowledge-graph.json (' + graph.nodes.length + ' nodes, ' + graph.edges.length + ' edges)');
console.log('saved fingerprints.json (' + Object.keys(files).length + ' files)');
console.log('saved meta.json (analyzedFiles=' + scope.length + ')');
