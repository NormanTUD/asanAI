#!/usr/bin/env node
import fs from 'fs';
const UA = '/home/norman/repos/asanai/blog/.ua';
const INTER = UA + '/intermediate';
const g = JSON.parse(fs.readFileSync(INTER + '/assembled-graph.json', 'utf8'));
const nodeIds = new Set(g.nodes.map(n => n.id));
const FILE_LEVEL = new Set(['file','config','document','service','pipeline','table','schema','resource','endpoint']);
const KNOWN = /^(file|config|document|service|pipeline|table|schema|resource|endpoint):/;

// ---- normalize layers (already normalized, but re-verify) ----
let layers = JSON.parse(fs.readFileSync(INTER + '/layers.json', 'utf8'));
if (Array.isArray(layers.layers)) layers = layers.layers;
for (const l of layers) {
  if (l.nodes) { l.nodeIds = l.nodes.map(n => typeof n === 'string' ? n : n.id); delete l.nodes; }
  if (!l.id) l.id = 'layer:' + String(l.name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  l.nodeIds = (l.nodeIds || []).map(id => KNOWN.test(id) ? id : 'file:' + id).filter(id => nodeIds.has(id));
}

// ---- normalize tour ----
let tour = JSON.parse(fs.readFileSync(INTER + '/tour.json', 'utf8'));
if (tour && tour.steps && !Array.isArray(tour)) tour = tour.steps;
tour = (Array.isArray(tour) ? tour : []).map((s, i) => {
  const o = {};
  o.order = Number(s.order) || (i + 1);
  o.title = s.title || ('Step ' + (i+1));
  o.description = s.description ?? s.whyItMatters ?? '';
  o.nodeIds = (s.nodeIds || s.nodesToInspect || []).map(id => KNOWN.test(id) ? id : 'file:' + id).filter(id => nodeIds.has(id));
  if (typeof s.languageLesson === 'string' && s.languageLesson) o.languageLesson = s.languageLesson;
  return o;
}).sort((a, b) => a.order - b.order);

// ---- assemble full KnowledgeGraph ----
const COMMIT = 'a6f570ced0a7fe530f4fdd725ecd5a45af351285';
const scan = JSON.parse(fs.readFileSync(INTER + '/scan-result.json', 'utf8'));
const graph = {
  version: '1.0.0',
  project: {
    name: 'blog — From Big Bang to ChatGPT',
    languages: scan.languages,
    frameworks: scan.frameworks,
    description: scan.description,
    analyzedAt: new Date().toISOString(),
    gitCommitHash: COMMIT,
  },
  nodes: g.nodes,
  edges: g.edges,
  layers,
  tour,
};
fs.writeFileSync(INTER + '/assembled-graph.json', JSON.stringify(graph, null, 2));
console.log('KnowledgeGraph assembled: nodes', graph.nodes.length, 'edges', graph.edges.length, 'layers', layers.length, 'tourSteps', tour.length);
// quick dangling check
let dl=0; for(const l of layers)for(const id of l.nodeIds)if(!nodeIds.has(id))dl++;
let tl=0; for(const s of tour)for(const id of s.nodeIds)if(!nodeIds.has(id))tl++;
console.log('layer dangling:', dl, 'tour dangling:', tl);
