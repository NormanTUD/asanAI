#!/usr/bin/env node
import fs from 'fs';
const R = '/home/norman/repos/asanai/blog';
const UA = R + '/.ua';
const g = JSON.parse(fs.readFileSync(UA + '/intermediate/assembled-graph.json', 'utf8'));
const FILE_LEVEL = ['file','config','document','service','pipeline','table','schema','resource','endpoint'];
// file-level nodes for architecture (with id, type, name, filePath, summary, tags)
const fileNodes = g.nodes.filter(n => FILE_LEVEL.includes(n.type)).map(n => ({ id: n.id, type: n.type, name: n.name, filePath: n.filePath, summary: n.summary, tags: n.tags }));
fs.writeFileSync(UA + '/tmp/arch-nodes.json', JSON.stringify(fileNodes, null, 1));
// all edges for architecture
fs.writeFileSync(UA + '/tmp/arch-edges.json', JSON.stringify(g.edges, null, 1));
// tour: file-level nodes + layers later + all edges
const tourNodes = g.nodes.filter(n => FILE_LEVEL.includes(n.type)).map(n => ({ id: n.id, name: n.name, filePath: n.filePath, summary: n.summary, type: n.type }));
fs.writeFileSync(UA + '/tmp/tour-nodes.json', JSON.stringify(tourNodes, null, 1));
fs.writeFileSync(UA + '/tmp/tour-edges.json', JSON.stringify(g.edges, null, 1));
console.log('arch-nodes:', fileNodes.length, 'edges:', g.edges.length);
