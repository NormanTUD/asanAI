<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: An Intuition of how Large Language Models (LLMs) work
description: Large Language Models are next-word prediction machines. See the autoregressive loop in action.
icon: &#128161;
part: 1
order: 1
color: accent
topics: history, philosophy, society
tags: interested-layman
-->
<style>
#autoregressive-viz .ar-sentence { padding:14px 16px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; min-height:48px; display:flex; align-items:center; flex-wrap:wrap; }
#autoregressive-viz .ar-word { padding:1px 4px; border-radius:3px; margin-right:6px; }
#autoregressive-viz .ar-orig { color:#b45309; background:#fef3c7; font-weight:bold; }
#autoregressive-viz .ar-added { color:#16a34a; background:#dcfce7; font-weight:bold; }
#autoregressive-viz .ar-ctx { color:#1e293b; }
#autoregressive-viz .ar-row { display:flex; align-items:center; gap:10px; padding:10px 16px; margin-top:8px; background:#eff6ff; border-radius:8px; border-left:3px solid #3b82f6; }
#autoregressive-viz .ar-label { color:#64748b; }
#autoregressive-viz .ar-prob { color:#94a3b8; font-size:0.8em; margin-left:auto; }
#autoregressive-viz .ar-pill { padding:2px 8px; border-radius:4px; font-weight:bold; animation: arPulse 0.6s ease-in-out; cursor:pointer; }
#autoregressive-viz .ar-pred { background:#dbeafe; color:#1e40af; transition: background 0.15s; }
#autoregressive-viz .ar-pred:hover { background:#bfdbfe; }
#autoregressive-viz .ar-stop { background:#fee2e2; color:#dc2626; }
#autoregressive-viz .ar-legend { display:flex; align-items:center; margin-top:10px; padding:0 4px; }
#autoregressive-viz .ar-legend-items { display:flex; gap:14px; font-size:0.75em; color:#64748b; }
#autoregressive-viz .ar-swatch { padding:0 3px; border-radius:2px; }
#autoregressive-viz .ar-swatch-input { color:#b45309; background:#fef3c7; }
#autoregressive-viz .ar-swatch-gen { color:#1e293b; }
#autoregressive-viz .ar-swatch-added { color:#16a34a; background:#dcfce7; }
#autoregressive-viz .ar-swatch-next { color:#1e40af; background:#dbeafe; }
html.dark #autoregressive-viz .ar-sentence { background:var(--mn-bg-subtle); border-color:var(--mn-border); }
html.dark #autoregressive-viz .ar-ctx { color:var(--mn-text); }
html.dark #autoregressive-viz .ar-orig { color:#fcd34d; background:#422006; }
html.dark #autoregressive-viz .ar-added { color:#86efac; background:#022c22; }
html.dark #autoregressive-viz .ar-row { background:#1e3a8a; }
html.dark #autoregressive-viz .ar-label,
html.dark #autoregressive-viz .ar-prob,
html.dark #autoregressive-viz .ar-legend-items { color:var(--mn-text-muted); }
html.dark #autoregressive-viz .ar-pred { background:#1e3a8a; color:#bfdbfe; }
html.dark #autoregressive-viz .ar-pred:hover { background:#1e40af; }
html.dark #autoregressive-viz .ar-stop { background:#450a0a; color:#fca5a5; }
html.dark #autoregressive-viz .ar-swatch-input { color:#fcd34d; background:#422006; }
html.dark #autoregressive-viz .ar-swatch-gen { color:var(--mn-text); }
html.dark #autoregressive-viz .ar-swatch-added { color:#86efac; background:#022c22; }
html.dark #autoregressive-viz .ar-swatch-next { color:#bfdbfe; background:#1e3a8a; }

/* === Embedding demo (lndw style — Power / Gender) === */
#embedding-demo {
	background: var(--mn-surface);
	border: 1px solid var(--mn-border);
	border-radius: 16px;
	padding: 20px 22px 18px;
	margin: 16px auto;
	max-width: 880px;
	box-shadow: 0 1px 0 rgba(0,0,0,.04), 0 14px 38px -20px rgba(0,0,0,.22);
	transition: background .3s ease, border-color .3s ease;
}
html.dark #embedding-demo {
	background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
	border-color: #334155;
	box-shadow: 0 1px 0 rgba(255,255,255,.04), 0 18px 48px -16px rgba(0,0,0,.7);
}
#embedding-demo .emb-head {
	text-align: center;
	font-size: 1.05rem;
	font-weight: 700;
	color: var(--mn-text);
	margin-bottom: 14px;
	letter-spacing: .01em;
}
#embedding-demo .emb-stage {
	display: grid;
	grid-template-columns: 1fr;
	gap: 14px;
}
@media (min-width: 860px) {
	#embedding-demo .emb-stage { grid-template-columns: 1.6fr 1fr; }
}
#embedding-demo #embedding-viz-plot {
	height: 460px;
	background: var(--mn-bg);
	border-radius: 12px;
	border: 1px solid var(--mn-border-light);
	transition: background .3s ease, border-color .3s ease;
}
html.dark #embedding-demo #embedding-viz-plot {
	background: rgba(15,23,42,.55);
	border-color: rgba(148,163,184,.18);
}
#embedding-demo .emb-toolbar {
	display: flex;
	flex-direction: column;
	gap: 10px;
}
#embedding-demo .emb-toolbar input[type="text"] {
	width: 100%;
	padding: 9px 12px;
	border-radius: 8px;
	border: 1px solid var(--mn-border);
	background: var(--mn-bg);
	color: var(--mn-text);
	font-size: .95em;
	font-family: inherit;
	box-sizing: border-box;
	transition: border-color .15s, background .3s, color .3s;
}
#embedding-demo .emb-toolbar input[type="text"]:focus {
	outline: none;
	border-color: #6366f1;
	box-shadow: 0 0 0 3px rgba(99,102,241,.18);
}
#embedding-demo #embedding-arithmetic-input { font-family: ui-monospace, "Cascadia Code", "JetBrains Mono", monospace; }
#embedding-demo .emb-quick {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}
#embedding-demo .emb-chip {
	background: var(--mn-bg-subtle);
	border: 1px solid var(--mn-border-light);
	border-radius: 999px;
	padding: 5px 12px;
	font-size: .82em;
	font-weight: 600;
	color: var(--mn-text-secondary);
	cursor: pointer;
	transition: all .15s ease;
	font-family: ui-monospace, "Cascadia Code", "JetBrains Mono", monospace;
}
#embedding-demo .emb-chip:hover {
	background: linear-gradient(135deg, rgba(99,102,241,.12), rgba(99,102,241,.04));
	border-color: #6366f1;
	color: #4f46e5;
	transform: translateY(-1px);
}
html.dark #embedding-demo .emb-chip:hover {
	background: rgba(99,102,241,.2);
	color: #c7d2fe;
}
#embedding-demo .emb-chip.active {
	background: linear-gradient(135deg, #6366f1, #4f46e5);
	border-color: #4f46e5;
	color: #fff;
	box-shadow: 0 4px 12px -4px rgba(99,102,241,.6);
}
#embedding-demo #embedding-arithmetic-result {
	margin-top: 2px;
	padding: 10px 12px;
	border-radius: 8px;
	background: var(--mn-bg-subtle);
	border-left: 3px solid #10b981;
	min-height: 24px;
	font-size: .92em;
	color: var(--mn-text);
	font-family: ui-monospace, "Cascadia Code", "JetBrains Mono", monospace;
	transition: background .3s, color .3s;
}
#embedding-demo #embedding-arithmetic-result b { color: var(--mn-heading); }
#embedding-demo #embedding-arithmetic-result .res-dim { color: var(--mn-text-muted); font-size: .85em; }
html.dark #embedding-demo #embedding-arithmetic-result {
	background: rgba(15,23,42,.55);
	border-left-color: #34d399;
	color: var(--mn-text);
}
#embedding-demo .emb-hint {
	margin: 14px 0 0;
	padding: 10px 14px;
	background: var(--mn-bg);
	border-radius: 10px;
	border: 1px dashed var(--mn-border);
	color: var(--mn-text-secondary);
	font-size: .9em;
	line-height: 1.55;
	text-align: center;
	transition: background .3s, color .3s, border-color .3s;
}
#embedding-demo .emb-hint b { color: var(--mn-text); }
html.dark #embedding-demo .emb-hint {
	background: rgba(15,23,42,.4);
		color: #cbd5e1;
	border-color: rgba(148,163,184,.3);
}




/* === Attention bank/river/money demo (lndw style) === */
#attn-demo {
	background: var(--mn-surface);
	border: 1px solid var(--mn-border);
	border-radius: 14px;
	padding: 18px 22px;
	margin: 16px auto;
	max-width: 760px;
	box-shadow: 0 1px 0 rgba(0,0,0,.04), 0 10px 30px -18px rgba(0,0,0,.18);
}
html.dark #attn-demo { box-shadow: 0 1px 0 rgba(0,0,0,.4), 0 14px 36px -16px rgba(0,0,0,.6); }
#attn-demo .attn-sentence {
	text-align: center;
	padding: 14px 20px;
	background: var(--mn-bg-subtle);
	border-radius: 10px;
	border: 1px solid var(--mn-border-light);
	margin-bottom: 12px;
	font-size: 1.15em;
	color: var(--mn-text);
	font-weight: 500;
	min-height: 1.5em;
	line-height: 1.7;
	display: block;
	transition: background .35s, border-color .35s, color .35s;
}
#attn-demo .attn-sentence .attn-word-bank { color: #3b82f6; font-weight: 700; }
#attn-demo .attn-sentence .attn-word-river { color: #10b981; font-weight: 700; }
#attn-demo .attn-sentence .attn-word-money { color: #f59e0b; font-weight: 700; }
#attn-demo .attn-sentence .attn-word-both  { color: #8b5cf6; font-weight: 700; }
#attn-demo .attn-stepper {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 14px;
	margin-bottom: 10px;
}
#attn-demo .attn-step-btn {
	cursor: pointer;
	background: var(--mn-bg-subtle);
	border: 1px solid var(--mn-border);
	border-radius: 8px;
	width: 34px;
	height: 34px;
	font-size: 1.2em;
	font-weight: 700;
	color: var(--mn-text);
	transition: background .15s, transform .15s, border-color .15s;
}
#attn-demo .attn-step-btn:hover:not(:disabled) { background: var(--mn-surface-raised); border-color: #6366f1; color: #6366f1; }
#attn-demo .attn-step-btn:disabled { opacity: .35; cursor: default; }
#attn-demo .attn-step-label {
	font-weight: 700;
	font-size: .98em;
	color: var(--mn-text);
	white-space: nowrap;
	min-width: 140px;
	text-align: center;
}
#attn-demo .attn-step-label .em { color: #6366f1; }
#attn-demo .attn-caption {
	margin-top: 4px;
	text-align: center;
	font-size: .92em;
	color: var(--mn-text-secondary);
	min-height: 1.6em;
	line-height: 1.55;
}
#attn-demo .attn-caption b { color: var(--mn-text); }
#attn-demo #transformer-plot {
	height: 420px;
	background: var(--mn-surface);
	border-radius: 10px;
	border: 1px solid var(--mn-border-light);
}

/* === FFN Apple demo (gorgeous dark mode) === */
#ffn-demo {
	background: var(--mn-surface);
	border: 1px solid var(--mn-border);
	border-radius: 16px;
	padding: 22px 22px 18px;
	margin: 18px auto;
	max-width: 880px;
	box-shadow: 0 1px 0 rgba(0,0,0,.04), 0 14px 38px -20px rgba(0,0,0,.22);
}
html.dark #ffn-demo {
	background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
	border-color: #334155;
	box-shadow: 0 1px 0 rgba(255,255,255,.04), 0 18px 48px -16px rgba(0,0,0,.7);
}
#ffn-demo .ffn-ctl-row {
	display: flex;
	gap: 10px;
	justify-content: center;
	margin-bottom: 18px;
	flex-wrap: wrap;
}
#ffn-demo .ffn-ctl {
	padding: 9px 18px;
	border-radius: 10px;
	border: 1px solid var(--mn-border);
	background: var(--mn-bg);
	color: var(--mn-text);
	cursor: pointer;
	font-weight: 600;
	font-size: .95em;
	transition: all .2s ease;
}
#ffn-demo .ffn-ctl:hover {
	border-color: #6366f1;
	color: #6366f1;
	transform: translateY(-1px);
}
#ffn-demo .ffn-ctl.active-fruit {
	background: linear-gradient(135deg, #fef3c7, #fde68a);
	border-color: #f59e0b;
	color: #92400e;
	box-shadow: 0 0 0 1px rgba(245,158,11,.4), 0 8px 22px -10px rgba(245,158,11,.55);
}
#ffn-demo .ffn-ctl.active-tech {
	background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
	border-color: #6366f1;
	color: #312e81;
	box-shadow: 0 0 0 1px rgba(99,102,241,.45), 0 8px 22px -10px rgba(99,102,241,.55);
}
html.dark #ffn-demo .ffn-ctl.active-fruit {
	background: linear-gradient(135deg, rgba(245,158,11,.22), rgba(217,119,6,.32));
	border-color: #f59e0b;
	color: #fde68a;
	box-shadow: 0 0 0 1px rgba(245,158,11,.55), 0 10px 30px -10px rgba(245,158,11,.45);
}
html.dark #ffn-demo .ffn-ctl.active-tech {
	background: linear-gradient(135deg, rgba(99,102,241,.25), rgba(67,56,202,.35));
	border-color: #818cf8;
	color: #c7d2fe;
	box-shadow: 0 0 0 1px rgba(99,102,241,.55), 0 10px 30px -10px rgba(99,102,241,.5);
}

#ffn-demo #ffn-viz-container {
	position: relative;
	height: 360px;
	background: var(--mn-bg);
	border-radius: 12px;
	border: 1px solid var(--mn-border-light);
	padding: 24px 20px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	overflow: hidden;
	transition: background .3s ease, border-color .3s ease;
}
html.dark #ffn-demo #ffn-viz-container {
	background: rgba(15,23,42,.55);
	border-color: rgba(148,163,184,.18);
}
#ffn-demo .ffn-col-head {
	font-weight: 700;
	color: var(--mn-text-secondary);
	margin-bottom: 10px;
	font-size: .92em;
	letter-spacing: .02em;
}
#ffn-demo #ffn-input-box {
	background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
	border: 2px solid #818cf8;
	color: #312e81;
	box-shadow: 0 8px 22px -10px rgba(99,102,241,.55), inset 0 1px 0 rgba(255,255,255,.4);
}
html.dark #ffn-demo #ffn-input-box {
	background: linear-gradient(135deg, rgba(99,102,241,.28), rgba(67,56,202,.42));
	border-color: #818cf8;
	color: #e0e7ff;
	box-shadow: 0 10px 28px -10px rgba(99,102,241,.55), inset 0 1px 0 rgba(255,255,255,.08);
}
#ffn-demo #ffn-output-box {
	background: linear-gradient(135deg, #dcfce7, #bbf7d0);
	border: 2px solid #34d399;
	color: #065f46;
	box-shadow: 0 8px 22px -10px rgba(16,185,129,.55), inset 0 1px 0 rgba(255,255,255,.4);
}
html.dark #ffn-demo #ffn-output-box {
	background: linear-gradient(135deg, rgba(16,185,129,.28), rgba(5,150,105,.42));
	border-color: #34d399;
	color: #bbf7d0;
	box-shadow: 0 10px 28px -10px rgba(16,185,129,.55), inset 0 1px 0 rgba(255,255,255,.08);
}
#ffn-demo .ffn-pill {
	padding: 11px 13px;
	border-radius: 10px;
	font-size: .88em;
	font-weight: 700;
	transition: all .4s cubic-bezier(.2,.8,.2,1);
	text-align: center;
}
#ffn-demo .ffn-pill.idle {
	background: var(--mn-bg-subtle);
	border: 1px solid var(--mn-border-light);
	color: var(--mn-text-muted);
	opacity: .7;
}
#ffn-demo .ffn-pill.fire {
	background: linear-gradient(135deg, #fef3c7, #fde68a);
	border: 1px solid #f59e0b;
	color: #92400e;
	box-shadow: 0 0 0 1px rgba(245,158,11,.4), 0 8px 20px -8px rgba(245,158,11,.6);
}
html.dark #ffn-demo .ffn-pill.fire {
	background: linear-gradient(135deg, rgba(245,158,11,.3), rgba(217,119,6,.4));
	border-color: #f59e0b;
	color: #fde68a;
	box-shadow: 0 0 0 1px rgba(245,158,11,.5), 0 10px 28px -8px rgba(245,158,11,.45);
}
#ffn-demo .ffn-pill.fire-tech {
	background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
	border: 1px solid #6366f1;
	color: #312e81;
	box-shadow: 0 0 0 1px rgba(99,102,241,.4), 0 8px 20px -8px rgba(99,102,241,.6);
}
html.dark #ffn-demo .ffn-pill.fire-tech {
	background: linear-gradient(135deg, rgba(99,102,241,.32), rgba(67,56,202,.42));
	border-color: #818cf8;
	color: #e0e7ff;
	box-shadow: 0 0 0 1px rgba(99,102,241,.55), 0 10px 28px -8px rgba(99,102,241,.5);
}
#ffn-demo .ffn-pill .ffn-sub {
	font-size: .78em;
	font-weight: 600;
	margin-top: 4px;
	opacity: .85;
}
#ffn-demo .ffn-pill.idle .ffn-sub { color: var(--mn-text-muted); }
#ffn-demo .ffn-pill.fire .ffn-sub { color: #b45309; }
#ffn-demo .ffn-pill.fire-tech .ffn-sub { color: #4338ca; }
html.dark #ffn-demo .ffn-pill.fire .ffn-sub { color: #fcd34d; }
html.dark #ffn-demo .ffn-pill.fire-tech .ffn-sub { color: #c7d2fe; }

#ffn-demo #ffn-explanation {
	margin-top: 16px;
	padding: 12px 16px;
	background: var(--mn-bg);
	border-radius: 10px;
	border: 1px dashed var(--mn-border);
	color: var(--mn-text-secondary);
	font-size: .92em;
	text-align: center;
	line-height: 1.6;
	transition: background .3s ease, color .3s ease;
}
#ffn-demo #ffn-explanation b { color: var(--mn-text); }
html.dark #ffn-demo #ffn-explanation {
	background: rgba(15,23,42,.55);
	color: #cbd5e1;
	border-color: rgba(148,163,184,.3);
}
html.dark #ffn-demo #ffn-explanation b { color: #f1f5f9; }
#ffn-demo svg#ffn-lines path { transition: stroke .35s ease, stroke-width .35s ease; }

/* === Simplified isosurface ("truth tunnel") — ported from foam_of_meaning === */
.mn-iso {
	margin: 18px 0;
	padding: clamp(12px, 2.5vw, 18px);
	border-radius: var(--mn-radius-lg);
	border: 1px solid var(--mn-border);
	background: var(--mn-surface);
	box-shadow: var(--mn-shadow-md);
}
.mn-iso-grid {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 190px;
	gap: 14px;
	align-items: start;
}
@media (max-width: 640px) {
	.mn-iso-grid { grid-template-columns: 1fr; }
}
#mn-iso-canvas {
	display: block;
	width: 100%;
	height: clamp(340px, 46vw, 470px);
	background: #0f172a;
	border-radius: var(--mn-radius-md);
	border: 1px solid #1e293b;
}
.mn-iso-side {
	padding: 14px;
	border-radius: var(--mn-radius-md);
	border: 1px solid var(--mn-border);
	background: var(--mn-bg-subtle);
}
.mn-iso-kicker {
	font: 700 .62rem/1 var(--mn-font-mono);
	letter-spacing: .14em;
	text-transform: uppercase;
	color: var(--mn-text-muted);
}
.mn-iso-next {
	margin: .5em 0 .15em;
	font: 700 clamp(1.35rem, 1rem + 1.2vw, 1.9rem)/1.1 var(--mn-font-heading);
	color: var(--mn-heading);
	word-break: break-word;
}
.mn-iso-next.is-end { font-size: 1.15rem; color: var(--mn-text-muted); }
.mn-iso-meta {
	margin-top: .6em;
	font-size: .78rem;
	line-height: 1.5;
	color: var(--mn-text-secondary);
}
.mn-iso-meta b { color: var(--mn-text); font-family: var(--mn-font-mono); }
.mn-iso-conf {
	display: inline-block;
	padding: .22em .6em;
	border-radius: 999px;
	font: 700 .66rem/1 var(--mn-font-mono);
	letter-spacing: .06em;
	text-transform: uppercase;
	border: 1px solid transparent;
}
.mn-iso-conf.is-certain { color: var(--mn-sky); background: color-mix(in srgb, var(--mn-sky) 14%, transparent); border-color: color-mix(in srgb, var(--mn-sky) 35%, transparent); }
.mn-iso-conf.is-likely { color: var(--mn-emerald); background: color-mix(in srgb, var(--mn-emerald) 14%, transparent); border-color: color-mix(in srgb, var(--mn-emerald) 35%, transparent); }
.mn-iso-conf.is-open { color: var(--mn-coral); background: color-mix(in srgb, var(--mn-coral) 14%, transparent); border-color: color-mix(in srgb, var(--mn-coral) 35%, transparent); }
.mn-iso-conf.is-wide { color: var(--mn-rose); background: color-mix(in srgb, var(--mn-rose) 14%, transparent); border-color: color-mix(in srgb, var(--mn-rose) 35%, transparent); }
.mn-iso-controls {
	display: flex;
	flex-wrap: wrap;
	gap: 14px 22px;
	align-items: center;
	margin-top: 14px;
}
.mn-iso-btn {
	appearance: none;
	cursor: pointer;
	padding: .55em 1.05em;
	border-radius: 10px;
	border: 1px solid var(--mn-border);
	background: var(--mn-bg-subtle);
	color: var(--mn-text);
	font: 700 .85rem var(--mn-font-body);
	transition: border-color .15s ease, color .15s ease, transform .15s ease;
}
.mn-iso-btn:hover { border-color: var(--mn-accent); color: var(--mn-accent); transform: translateY(-1px); }
.mn-iso-btn:active { transform: translateY(0); }
.mn-iso-temp {
	display: flex;
	align-items: center;
	gap: .6em;
	font-size: .82rem;
	font-weight: 600;
	color: var(--mn-text-secondary);
}
.mn-iso-temp input[type="range"] { width: min(230px, 42vw); accent-color: var(--mn-coral); }
.mn-iso-temp b { min-width: 2.6em; color: var(--mn-heading); font-family: var(--mn-font-mono); text-align: right; }
</style>
<div class="md mn-mathstack">
We can think of LLMs as machines that predict the next most likely word, given a context — only one word at a time. That word is appended to the input and fed back in, and the loop repeats until a special `|endoftext|` token signals the end.

In the example below, the user enters the text “Once upon a” and lets the LLM continue.

**Step 1.** The text is put into the LLM:

$$\text{Next Word} = \text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}}) \rightarrow \text{time}$$

**Step 2.** The predicted word is attached, and the whole new text is fed back in:

$$\text{New Input} = \underbrace{\text{Once upon a}}_{\text{User Input}} + \underbrace{\text{time}}_{\text{Word 1}} = \text{Once upon a time}$$

**Step 3.** It repeats — each answer becomes part of the next question — until the model emits the stop signal:

$$\text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}} \ \underbrace{\text{time}}_{\text{Word 1}}) \rightarrow \underbrace{\text{there}}_{\text{Word 2}}$$

$$\text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}} \ \underbrace{\text{time there}}_{\text{Words 1–2}}) \rightarrow \underbrace{\text{was}}_{\text{Word 3}}$$

$$\text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}} \ \underbrace{\text{time there was}}_{\text{Words 1–3}}) \rightarrow \underbrace{\text{a}}_{\text{Word 4}}$$

$$\text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}} \ \underbrace{\text{time there was a}}_{\text{Words 1–4}}) \rightarrow \underbrace{\text{dragon.}}_{\text{Word 5}}$$

$$\text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}} \ \underbrace{\text{time there was a dragon.}}_{\text{Words 1–5}}) \rightarrow \underbrace{\texttt{|endoftext|}}_{\text{Stop}}$$

**Final output: “Once upon a time there was a dragon.”**
</div>

<!-- ============================================================ -->
<!-- STEP 0: AUTOREGRESSIVE LOOP VISUALIZATION -->
<!-- ============================================================ -->
<div class="mn-demo-panel">
	<div class="mn-demo-title">🔄 The Autoregressive Loop: One Word at a Time</div>
	<div class="mn-demo-sub">Press play and watch the sentence build itself, one prediction at a time.</div>
	<div id="autoregressive-viz" style="min-height:200px;"></div>
	<div style="display:flex; gap:10px; justify-content:center; margin-top:12px;">
		<button id="autoregressive-play" onclick="AutoregressiveViz.animate()"
			style="background:#3b82f6; color:white; border:none; padding:8px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">
			▶ Play Generation
		</button>
		<button onclick="AutoregressiveViz.reset()"
			style="background:#64748b; color:white; border:none; padding:8px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">
			↺ Reset
		</button>
	</div>
</div>

<div class="mn-aha">
	<div class="mn-aha-kicker">The aha</div>
	<p class="mn-aha-big">It writes by reading itself.</p>
	<p class="mn-aha-sub">There is no plan, no outline, no “dragon” stored anywhere. Every word it produces is appended to its own input and becomes the context for the next — the output <b>is</b> the input, one step later.</p>
</div>

<div class="mn-hook">
	<span class="mn-hook-kicker">Still curious?</span>
	<p class="mn-hook-q">Fine. But how does a string of words turn into a <em>probability</em> for the next one?</p>
	<div class="mn-hook-tease">The machine has five steps. Let us open it up and follow a single word through <span class="mn-hook-arrow" aria-hidden="true">↓</span></div>
</div>

<div class="md">
## How does the computer find the next word?

The LLM learned to predict the next word by reading **massive** amounts of text — books, websites, articles — noticing the patterns in how language works, and picking up facts along the way. But how does it get from a string of words to a single prediction? It happens in five steps. We will follow one word through all of them.

### Step 1: Tokenization

Computers don't understand words. They understand numbers. So the very first thing an LLM does is **chop the input into small pieces called tokens**. We can first think of these tokens as words, but they don't have to be. They can be sub-words, numbers, or any part of a text. While we humans think in words, the LLM “thinks” in tokens.

$$\text{“Once upon a time”} \rightarrow [\text{“Once”}, \ \text{“upon”}, \ \text{“a”}, \ \text{“time”}]$$

Most tokens are common words or word fragments. `"understanding"` might split into `"under"` + `"standing"` — two tokens. That is the quiet genius of it: a word the model has never seen can still be assembled from pieces it knows by heart.

Where a word splits depends on the data the model was trained on. It chooses that automatically, and once chosen, the vocabulary stays fixed for the life of the model — a fixedness with strange consequences for the rare tokens almost nobody ever trained on (\cite[Li et al., 2024]{glitchtokens}).
</div>

<div class="mn-aha">
	<div class="mn-aha-kicker">The aha</div>
	<p class="mn-aha-big">It can read words it has never seen.</p>
	<p class="mn-aha-sub">Break every unfamiliar word into familiar pieces and nothing is truly new. The vocabulary never has to grow — <code>transformer</code> is just <code>trans</code> + <code>form</code> + <code>er</code>, three pieces the model already knows.</p>
</div>

<!-- ============================================================ -->
<!-- STEP 1: TOKENIZATION VISUALIZATION -->
<!-- ============================================================ -->
<div class="mn-demo-panel">
	<div class="mn-demo-title">✂️ Step 1: Tokenization — chopping text into pieces</div>
	<div class="mn-demo-sub">Type a word and watch it break into the pieces the model actually reads.</div>
	<input type="text" id="tokenizer-input" class="mn-demo-input"
	   placeholder="Type something... e.g., 'The transformer is playing greatly'"
	   value="The transformer is playing greatly">
	<div id="tokenizer-output" style="min-height:60px; margin-top:12px;"></div>
	<div id="tokenizer-stats" style="margin-top:10px;"></div>
	<div class="mn-demo-hint">
	💡 Try typing <b>“understanding”</b> or <b>“unbreakable”</b> to see subword splitting in action.
	The model breaks unknown words into known pieces it learned during training.
	</div>
</div>

<details class="mn-psst">
	<summary><span class="mn-psst-key" aria-hidden="true">+</span>A detour: tokens that break the machine<span class="mn-psst-hint">open</span></summary>
	<div class="mn-psst-body">
		<p>Some tokens are almost never seen in training, so their embeddings stay nearly arbitrary. Feed one to a model and it can spill nonsense or start reciting its training data — the “understanding” only reaches as far as the text it happened to read.</p>
	</div>
</details>

<div class="mn-thread">
	<a class="mn-thread-item mn-thread-fwd" target="_blank" rel="noopener" href="tokenizerlab.php"><span class="mn-thread-label">Go deeper</span>Tokenization: How Words become Numbers</a>
</div>

<div class="mn-hook">
	<span class="mn-hook-kicker">Next</span>
	<p class="mn-hook-q">By itself, a number means nothing. So how does <em>“time”</em> come to mean something — and <em>“truth”</em> come to mean something nearby?</p>
	<div class="mn-hook-tease">Every token gets a place in space <span class="mn-hook-arrow" aria-hidden="true">↓</span></div>
</div>

<div class="md" data-mathlevel="45">
### Step 2: Embedding

A raw token tells the model nothing about what a word *means*. So the model replaces each token with a **long list of numbers** — a vector — that stands for its meaning.

$$\text{“King”} \rightarrow [0.22, \ 0.85, \ -0.41, \ 0.09, \ \ldots, \ 0.63]$$

These vectors live in a high-dimensional space where **words with similar meanings end up close together**. To make this tangible, the demo below plots a tiny slice of that space — just two semantic axes the model might discover: **Power** and **Gender**. “Man” and “Prince” sit close on the Power axis; “Man” and “Woman” sit close on the Gender axis. Nobody hand-designs these positions. The model learns them automatically during training, purely from seeing which words turn up in similar company across billions of sentences.

And the space doesn't just capture similarity — it captures **relationships**. The most famous example:

$$\vec{\text{King}} - \vec{\text{Man}} + \vec{\text{Woman}} \approx \vec{\text{Queen}}$$

The direction from “Man” to “Woman” stands for the concept of gender. Carry that same direction from “King” and you land right next to “Queen.” Nobody typed that rule in — it fell out of the statistics of the text (\cite[Word2Vec]{mikolov2013word2vec}).

Real networks don't use two dimensions but **thousands** — far too many to picture. The principle stays the same: position encodes meaning, direction encodes relationship.
</div>

<!-- ============================================================ -->
<!-- STEP 2: EMBEDDING VISUALIZATION (lndw style — Power / Gender) -->
<!-- ============================================================ -->
<div id="embedding-demo">
    <div class="emb-head">📍 Step 2: Embedding — Words as Points in Space</div>

    <div class="emb-stage">
	<div id="embedding-viz-plot" data-plot-theme="self"></div>
	<div class="emb-toolbar">
	    <input type="text" id="embedding-viz-input"
		   placeholder="Words to highlight (e.g. Man Woman Prince King)"
		   value="Man Woman Prince King">
	    <div class="emb-quick">
		<button class="emb-chip" data-ex="King - Man + Woman" type="button">King − Man + Woman</button>
		<button class="emb-chip" data-ex="Man + Power" type="button">Man + Power</button>
		<button class="emb-chip" data-ex="Woman + 2*Power" type="button">Woman + 2·Power</button>
		<button class="emb-chip" data-ex="Prince + Power" type="button">Prince + Power</button>
		<button class="emb-chip" data-ex="directions" type="button">↗ Directions</button>
	    </div>
	    <input type="text" id="embedding-arithmetic-input"
		   placeholder="e.g. King - Man + Woman"
		   value="King - Man + Woman">
	    <div id="embedding-arithmetic-result"></div>
	</div>
    </div>

    <p class="emb-hint">
	💡 <b>Directions encode meaning.</b>
	The vector <i>Man → Woman</i> points in a direction that's the same wherever you take it —
	and so does <i>Man → Prince</i>.
	The model was never taught this — it emerged from the texts themselves.
    </p>
</div>

<div class="mn-aha">
	<div class="mn-aha-kicker">The aha</div>
	<p class="mn-aha-big">Meaning became arithmetic.</p>
	<p class="mn-aha-sub">Nobody told the model that <em>Man → Woman</em> is the same arrow as <em>King → Queen</em>. The relationship simply <b>is</b> a direction in the space — and arithmetic on directions turns out to be arithmetic on ideas.</p>
</div>

<div class="mn-thread">
	<a class="mn-thread-item mn-thread-fwd" target="_blank" rel="noopener" href="embeddinglab.php"><span class="mn-thread-label">Go deeper</span>Embeddings: The Geometry of Meaning</a>
</div>

<div class="mn-hook">
	<span class="mn-hook-kicker">Next</span>
	<p class="mn-hook-q">There is still a blind spot: to the model, <em>“dog bites man”</em> and <em>“man bites dog”</em> look exactly the same.</p>
	<div class="mn-hook-tease">So how does <em>order</em> get back in? <span class="mn-hook-arrow" aria-hidden="true">↓</span></div>
</div>

<div class="md">
### Step 3: Positional Encoding

“The dog bites man” means something very different from “The man bites dog.” Same words, different order. So a **positional encoding** is added to each token's embedding — a unique signal that says “I'm the 1st word,” “I'm the 2nd word,” and so on.

$$\text{Final Input} = \text{Embedding}(\text{token}) + \text{Position}(\text{index})$$

Now each token carries two pieces of information: **what it is** and **where it is**. This is not a nicety — the embedding and attention operations have no built-in notion of sequence order, so without it, the two sentences above would be indistinguishable to the model.
</div>

<div class="mn-aha">
	<div class="mn-aha-kicker">The aha</div>
	<p class="mn-aha-big">Without it, word order does not exist.</p>
	<p class="mn-aha-sub">Strip the positional signal out and <em>“dog bites man”</em> and <em>“man bites dog”</em> collapse into the identical, unordered bag of tokens — the same thing to the model, opposite things to you.</p>
</div>

<!-- ============================================================ -->
<!-- STEP 3: POSITIONAL ENCODING VISUALIZATION -->
<!-- ============================================================ -->
<div class="mn-demo-panel">
	<div class="mn-demo-title">📐 Step 3: Positional Encoding — where am I in the sentence?</div>
	<div class="mn-demo-sub">Each position gets its own wave-like fingerprint, added onto the token's vector.</div>

	<div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
		<label style="font-size:0.85em; color:var(--mn-text-secondary); font-weight:bold;">Dimensions to show:</label>
		<input type="range" id="pe-num-dims" min="2" max="12" step="1" value="8" style="flex:1; accent-color:#8b5cf6;">
		<span style="font-weight:bold; color:#8b5cf6; min-width:24px;">8</span>
	</div>

	<!-- Sine/Cosine wave plot -->
	<div id="positional-encoding-plot" data-plot-theme="self" style="height:300px; background:var(--mn-surface); border-radius:8px; border:1px solid var(--mn-border); margin-bottom:12px;"></div>

	<!-- Heatmap -->
	<div style="font-weight:bold; color:var(--mn-heading); margin-bottom:6px;">Positional Encoding Heatmap</div>
	<div id="positional-encoding-heatmap" data-plot-theme="self" style="height:300px; background:var(--mn-surface); border-radius:8px; border:1px solid var(--mn-border); margin-bottom:12px;"></div>

	<!-- Same word, different positions demo -->
	<div style="font-weight:bold; color:var(--mn-heading); margin-bottom:6px;">Same Word, Different Positions</div>
	<div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:8px; align-items:center;">
		<input type="text" id="pe-demo-word" value="cat" placeholder="Word" class="mn-demo-input" style="width:96px;">
		<label style="font-size:0.85em; color:var(--mn-text-secondary);">Pos 1:
			<input type="number" id="pe-demo-pos1" value="0" min="0" max="19" class="mn-demo-input" style="width:68px;">
		</label>
		<label style="font-size:0.85em; color:var(--mn-text-secondary);">Pos 2:
			<input type="number" id="pe-demo-pos2" value="5" min="0" max="19" class="mn-demo-input" style="width:68px;">
		</label>
	</div>
	<div id="pe-addition-demo"></div>
</div>

<div class="mn-thread">
	<a class="mn-thread-item mn-thread-fwd" target="_blank" rel="noopener" href="positionalembeddingslab.php"><span class="mn-thread-label">Go deeper</span>Positional Embeddings</a>
</div>

<div class="mn-hook">
	<span class="mn-hook-kicker">Next</span>
	<p class="mn-hook-q">Now every token knows <em>what</em> it is and <em>where</em> it is. But not one of them has spoken to another yet.</p>
	<div class="mn-hook-tease">Time to open the transformer <span class="mn-hook-arrow" aria-hidden="true">↓</span></div>
</div>

<div class="md">
### Step 4: The Transformer Layers

This is the heart of the model — the **Transformer architecture** (\cite[Vaswani et al., 2017]{vaswani2017attention}). The token vectors flow through **many layers** stacked on top of each other (modern LLMs can have 80+ layers), each one refining the model's understanding a little more.

Call the vector a token starts with $\mathbf{x}_{0}$. Every layer *adds* its output to what is already there instead of overwriting it, so that nothing learned earlier is ever thrown away. If layer $l$ reads $\mathbf{h}_{l}$ and writes back its own contribution, the rule is:

$$\mathbf{h}_{1} = \mathbf{x}_{0} + \text{Layer}(\mathbf{x}_{0}), \qquad \mathbf{h}_{2} = \mathbf{h}_{1} + \text{Layer}(\mathbf{h}_{1}), \qquad \ldots$$

In general $\mathbf{h}_{l+1} = \mathbf{h}_{l} + \text{Layer}(\mathbf{h}_{l})$, starting from $\mathbf{h}_{0} = \mathbf{x}_{0}$.

This running vector is called the **residual stream**. It was originally invented to prevent the **vanishing gradient problem**, but it also acts as a **shared notebook**: each layer reads from the notebook, does some thinking, and **writes its findings back** to it.

#### 4a: Attention - “Which other words matter for *this* word?”

Attention lets the model **look at other tokens** to understand context. In *“The cat sat on the mat because **it** was tired”*, what does “it” refer to? An **attention head** figures this out by comparing “it” to every other word and deciding that “it” is most related to “cat”.

Attention Heads solve what linguists call **Long Distance Dependencies**: a word at the beginning of a long text may influence the meaning of a word at the very end. Attention allows to find out which word attends to which other word over short or even very long texts, and it can do so over the whole **context length** of the LLM model.

It does so by moving the Embedding of a word in dependence of the context it's used in to a place called **contextualized Embedding** that looks not only at the word, but at the context the word is used in.

This is best exemplified when using words that have multiple meanings, like “bank”, which could be a **river bank**, or a **bank** where you put your **money**.

Cycle through the examples below. Notice how the diamond — the contextualized “Bank” — leaps toward the neighbor that defines it. This is what **Attention** does: it looks at the context a word is used in, and moves the **Embedding** of a word in the **Embedding Space** to a point closer to its meaning in the context it's used in.

</div>

<div id="attn-demo">
	<div class="attn-stepper">
		<button class="attn-step-btn" id="attn-prev" type="button" title="Previous example">‹</button>
		<span class="attn-step-label" id="attn-step-label">1 / 4</span>
		<button class="attn-step-btn" id="attn-next" type="button" title="Next example">›</button>
	</div>
	<div class="attn-sentence" id="attn-sentence">I walk to the <span class="attn-word-bank">bank</span>.</div>
	<div id="transformer-plot" data-plot-theme="self"></div>
	<div class="attn-caption" id="attn-caption">No context word — <b>Bank</b> stays in the middle, ambiguous.</div>
</div>

<div class="md">
LLM models have **many attention heads** running in parallel, each a tiny specialist. One might track which noun a pronoun refers to, another might connect verbs to their objects, another might notice adjectives describing nearby nouns.

It matters, though, that not every head does something a human can read off. A head may look like it reacts to nouns or verbs while in reality it is just a pattern learned from statistics — not programmed to react to those words, and not "knowing" what they are (\cite[Elhage et al., 2021]{elhage2021mathematical}).
</div>

<div class="mn-aha">
	<div class="mn-aha-kicker">The aha</div>
	<p class="mn-aha-big">Context physically moves the word.</p>
	<p class="mn-aha-sub">“Bank” is not one fixed point. In the context of <em>water</em> it slides toward the river sense; in the context of <em>money</em>, toward finance. Attention does not care how far away the clue is — it reads the <b>context</b> and moves the vector wherever the context points.</p>
</div>

<div class="mn-thread">
	<a class="mn-thread-item mn-thread-fwd" target="_blank" rel="noopener" href="attentionlab.php"><span class="mn-thread-label">Go deeper</span>The Semantic Tug-of-War: How Transformers 'Think'</a>
</div>

<details class="mn-psst">
	<summary><span class="mn-psst-key" aria-hidden="true">+</span>A detour: the head that means nothing<span class="mn-psst-hint">open</span></summary>
	<div class="mn-psst-body">
		<p>Some heads do have a crisp job a human can name — but many fire on patterns no one would ever write down, and the model works perfectly well anyway. A head is a filter the training process stumbled onto, not a job description written by a designer; even the readable ones are usually understood only after the fact.</p>
	</div>
</details>

<div class="mn-hook">
	<span class="mn-hook-kicker">Next</span>
	<p class="mn-hook-q">Attention has gathered the clues. So where does the model keep all the facts it is about to bring to bear?</p>
	<div class="mn-hook-tease">It looks inward, into the feed-forward network <span class="mn-hook-arrow" aria-hidden="true">↓</span></div>
</div>

<div class="md">
#### 4b: Feed-Forward Network - “What do I conclude?”

After attention has gathered context, a small **neural network** processes each token on its own. Unlike attention, it does not look at other tokens — it looks at one token's vector and transforms it. In a modern LLM this block holds about **two-thirds of all the parameters**, which is why most of the model's stored knowledge lives here (\cite[Geva et al., 2021]{geva2021kv}).

The usual cartoon says three things happen: pattern detectors fire, a filter zeroes the weak ones, and knowledge is added back. That is a useful first picture — but the modern version is sharper and a little stranger:

- **It is a key → value memory.** The first matrix holds thousands of *keys*: patterns in the token's vector. When a key matches, the second matrix writes a *value* — not a stored sentence, but a **distribution over the next tokens** that this kind of pattern tends to be followed by. Lower layers key on shallow patterns (word forms, syntax); upper layers key on meaning.
- **It is where facts are recalled.** In the middle layers the FFN behaves like an associative memory for subject → attribute facts. Researchers can locate a single fact there and edit the weights to change it: the ROME method can make a model “believe” a different capital of France without retraining it (\cite[Meng et al., 2022]{meng2022locating}).
- **The clean little cards are a convenient lie.** Real neurons are mostly *polysemantic* — one neuron responds to several unrelated things — because the model packs far more features than it has neurons, a phenomenon called superposition (\cite[Elhage et al., 2022]{elhage2022superposition}). Sparse autoencoders can untangle those activations into features a human can actually read (\cite[Bricken et al., 2023]{bricken2023monosemanticity}; \cite[Cunningham et al., 2023]{cunningham2023sparse}).
- **Modern FFNs are often gated, and sometimes replaced.** Many current models swap the hard ReLU for a gated activation such as SwiGLU, where one branch controls how much of another passes through (\cite[Shazeer, 2020]{shazeer2020glu}). And because this block is so large, some models replace it with a **mixture of experts** — many FFNs, with each token routed to only a few of them (\cite[Fedus et al., 2022]{fedus2022switch}).

Let us follow the word **“Apple”**. Thanks to attention, its vector already carries clues about its context. Depending on whether those clues say *eating* or *buying*, a different set of keys matches — and a different value distribution is written into the stream.
</div>

<div id="ffn-demo">
    <div class="ffn-ctl-row">
        <button class="ffn-ctl" id="btn-ffn-fruit" type="button" onclick="FFNViz.setScenario('apple_fruit')">
            🍎 Context: “eating an apple”
        </button>
        <button class="ffn-ctl" id="btn-ffn-tech" type="button" onclick="FFNViz.setScenario('apple_tech')">
            💻 Context: “buying an apple”
        </button>
    </div>

    <div id="ffn-viz-container">

        <div style="width: 120px; text-align: center; z-index: 2;">
            <div class="ffn-col-head">Residual stream</div>
            <div id="ffn-input-box" class="ffn-pill">
                “Apple” + context
            </div>
        </div>

        <div style="width: 180px; text-align: center; z-index: 2;">
            <div class="ffn-col-head">Keys · patterns in W₁</div>
            <div id="ffn-detectors" style="display: flex; flex-direction: column; gap: 10px;">
                </div>
        </div>

        <div style="width: 200px; text-align: center; z-index: 2;">
            <div class="ffn-col-head">Values · next-token hints</div>
            <div id="ffn-facts" style="display: flex; flex-direction: column; gap: 10px;">
                </div>
        </div>

        <div style="width: 120px; text-align: center; z-index: 2;">
            <div class="ffn-col-head">Written back</div>
            <div id="ffn-output-box" class="ffn-pill">
                richer vector
            </div>
        </div>

        <svg id="ffn-lines" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none;">
            </svg>

    </div>

    <div id="ffn-explanation">
        Choose a context: the same word meets a different set of keys.
    </div>
</div>

<div class="mn-aha">
	<div class="mn-aha-kicker">The aha</div>
	<p class="mn-aha-big">The same word, two different meanings.</p>
	<p class="mn-aha-sub">“Apple” is one vector, but a different set of keys matches depending on the company it keeps — and each key writes a different value: pie and juice, or Mac and iPhone. The model did not look a fact up; a pattern matched, and a distribution over the next words shifted.</p>
</div>

<div class="mn-thread">
	<a class="mn-thread-item mn-thread-fwd" target="_blank" rel="noopener" href="fact_lookup.php"><span class="mn-thread-label">Go deeper</span>Where 'Paris' Lives — How an LLM Retrieves a Fact</a>
</div>

<div class="md" data-mathlevel="55">
Technically, this is expressed with the formula:

$$ \text{FFN}(x) = W_2 \cdot \max(0, W_1 \cdot x + b_1) + b_2 $$

Here $W_1$ holds the keys, the $\max(0, \ldots)$ keeps only the strong matches (many modern models replace it with a gated activation), and $W_2$ writes the values — the shift in the next-token distribution.

#### 4c: All together

The outputs of the attention heads, and then of the feed-forward network, are added straight back to the **residual stream** — nothing is overwritten, every layer only adds.

And crucially, neither the attention heads nor the feed-forward network are configured by hand. They learn what to look for by looking at massive amounts of data.
</div>

<!-- ============================================================ -->
<!-- STEP 4: TRANSFORMER LAYERS - RESIDUAL STREAM -->
<!-- ============================================================ -->
<div class="mn-demo-panel">
	<div class="mn-demo-title">Step 4: The Residual Stream — one shared notebook</div>
	<div class="mn-demo-sub">Step through the layers and watch the running representation build up, one write at a time.</div>
	<div id="residual-stream-plot"></div>

	<div style="display:flex; align-items:center; gap:14px; margin-top:14px; justify-content:center; flex-wrap:wrap;">
		<button id="residual-stream-prev" onclick="ResidualStreamViz.prevLayer()"
			style="padding:9px 18px; border-radius:8px; border:1px solid var(--mn-border); background:var(--mn-bg-subtle); color:var(--mn-text); cursor:pointer; font-size:14px;">
			← Prev
		</button>
		<span id="residual-stream-layer-label"
			style="font-weight:bold; font-size:15px; min-width:110px; text-align:center; color:var(--mn-heading);">
			x₀ · Embedding
		</span>
		<button id="residual-stream-next" onclick="ResidualStreamViz.nextLayer()"
			style="padding:9px 22px; border-radius:8px; border:none; background:#3b82f6; color:#fff; cursor:pointer; font-size:14px; font-weight:600;">
			Next Layer →
		</button>
		<input type="range" id="residual-stream-layer" min="0" max="3" value="0"
			oninput="ResidualStreamViz.setLayer(parseInt(this.value))"
			style="width:140px; margin-left:8px;">
		<button onclick="ResidualStreamViz.reset()"
			style="padding:9px 14px; border-radius:8px; border:1px solid var(--mn-border); background:var(--mn-bg-subtle); color:var(--mn-text-secondary); cursor:pointer; font-size:13px;">
			Reset
		</button>
	</div>

	<div id="residual-stream-info" style="margin-top:14px;"></div>
</div>

<div class="mn-aha">
	<div class="mn-aha-kicker">The aha</div>
	<p class="mn-aha-big">Nothing is ever overwritten.</p>
	<p class="mn-aha-sub">Every layer reads the same running stream — “what the sentence means so far” — thinks for a moment, and writes its finding back, added on top. Eighty layers deep, the original word is still in there. The network is less a pipeline than one <b>shared notebook</b>, passed hand to hand and annotated by everyone.</p>
</div>

<div class="mn-thread">
	<a class="mn-thread-item mn-thread-fwd" target="_blank" rel="noopener" href="transformer.php"><span class="mn-thread-label">Go deeper</span>The Architecture of Meaning: A Deep Dive into Transformers</a>
</div>

<div class="mn-hook">
	<span class="mn-hook-kicker">Next</span>
	<p class="mn-hook-q">After eighty layers, one vector is left standing in the stream. How does a list of numbers become an actual <em>word</em>?</p>
	<div class="mn-hook-tease">The last step turns geometry back into language <span class="mn-hook-arrow" aria-hidden="true">↓</span></div>
</div>

<div class="md">
### Step 5: The Final Prediction

After all the layers, the model takes the **last token's vector** and produces a **score for every word in its vocabulary** (often 50,000+ words). Those scores are turned into probabilities:

$$P(\text{“time”}) = 0.72, \quad P(\text{“day”}) = 0.08, \quad P(\text{“hill”}) = 0.002, \quad \ldots$$

Then it **picks a word** — usually one of the top candidates, but with a little randomness, so it doesn't say the exact same thing every time. And then, as in the very first example, that word is appended to the input and the whole process begins again, one word at a time, until the model decides it is done.
</div>

<!-- ============================================================ -->
<!-- STEP 5: FINAL PREDICTION -->
<!-- ============================================================ -->
<div class="mn-demo-panel">
	<div class="mn-demo-title">🎯 Step 5: The Final Prediction — a probability over the whole vocabulary</div>
	<div class="mn-demo-sub">Input: “Once upon a” → what comes next? Drag the temperature to change the model's mood.</div>

	<div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
		<span style="font-size:0.85em; color:#3b82f6; font-weight:bold;">🎯 Greedy</span>
		<input type="range" id="prediction-temperature" min="0.1" max="3.0" step="0.05" value="1.0" style="flex:1; accent-color:#f59e0b;">
		<span style="font-size:0.85em; color:#ef4444; font-weight:bold;">🎲 Creative</span>
		<span id="prediction-temp-val" style="font-size:0.9em; font-weight:bold; color:var(--mn-heading); min-width:120px; text-align:right;">1.00 (balanced)</span>
	</div>

	<div id="prediction-plot" data-plot-theme="self" style="height:350px; background:var(--mn-surface); border-radius:8px; border:1px solid var(--mn-border); margin-bottom:10px;"></div>
	<div id="prediction-info"></div>

	<div class="mn-demo-hint">
	💡 <b>Temperature</b> controls randomness. At T→0 the model always picks the top word (greedy); at high T the distribution flattens and rare words get a chance — that is where LLM “creativity” comes from. The model does not <b>know</b> the answer. It assigns probabilities and <b>samples</b>.
	</div>
</div>

<div class="md">
### The truth tunnel

A single prediction is one slice through a tube of plausible continuations. Step through the sentence and watch the tube narrow as the context closes the options — then turn up the temperature and watch it inflate again.
</div>

<div class="mn-iso">
	<div class="mn-iso-grid">
		<canvas id="mn-iso-canvas" aria-label="A path through embedding space wrapped in a glowing probability isosurface"></canvas>
		<aside class="mn-iso-side">
			<div class="mn-iso-kicker">Next word</div>
			<div class="mn-iso-next" id="mn-iso-next">capital</div>
			<div class="mn-iso-meta" id="mn-iso-meta"></div>
		</aside>
	</div>
	<div class="mn-iso-controls">
		<button type="button" class="mn-iso-btn" id="mn-iso-advance">Next word →</button>
		<label class="mn-iso-temp">
			<span>Temperature</span>
			<input type="range" id="mn-iso-temp" min="0.05" max="2.0" step="0.05" value="0.8">
			<b id="mn-iso-temp-val">0.80</b>
		</label>
	</div>
</div>

<div class="mn-aha">
	<div class="mn-aha-kicker">The aha</div>
	<p class="mn-aha-big">It does not know the answer. It rolls dice.</p>
	<p class="mn-aha-sub">The model never decides that something <em>is</em> right. It builds a distribution over the entire vocabulary and draws from it — so the very thing we call creativity is a controlled amount of randomness in the draw.</p>
</div>

<div class="mn-thread">
	<a class="mn-thread-item mn-thread-fwd" target="_blank" rel="noopener" href="samplinglab.php"><span class="mn-thread-label">Go deeper</span>Temperature &amp; Sampling</a>
</div>

<div class="md" data-mathlevel="55">
## The key insight

There is no “understanding” module, no grammar checker, no knowledge database. It's all just vectors flowing through layers of simple math: addition, multiplication, and comparison. But stack enough of these simple operations together, and something that *looks a lot like understanding* emerges.

### Why next-token prediction is so powerful

The goal of minimizing cross-entropy loss is not a shallow objective. There is a deep connection between **prediction** and **compression**. The Kolmogorov complexity $K(x)$ of a string $x$ is the length of the shortest program that produces it. Solomonoff's theory of inductive inference proves that the optimal predictor for any sequence is the one that finds the shortest description (maximum compression) of the data seen so far. Cross-entropy loss, which LLMs minimize, is an upper bound on the compressibility of the text. A model that achieves low cross-entropy has found a short description of the statistical structure of language.

The hypothesis that drives much of modern scaling research goes further: to compress natural language well, you must model the **causal structure of the world** that generates language. When the training text says “I dropped the glass and it ___,” predicting “shattered” requires an implicit model of gravity, material properties, and causation. The model does not need to be explicitly taught physics; the compression objective pushes it to discover physical regularities because they reduce prediction error. This is the dominant interpretation of why scaling works: more parameters allow more compression, which requires more accurate world models, which produces more “intelligent” behavior. **From this perspective, intelligence and optimal compression go hand in hand** — intelligence is not a separate objective that has to be optimized directly.

This framing is best read as a productive working hypothesis, not a proved identity. Solomonoff's theorem is a result about *prediction*, not about *understanding*: an optimal predictor must be a compressor, but it does not settle whether a *particular* predictor, including a modern LLM, has anything resembling genuine world knowledge — or whether fluent prediction can arise from large-scale surface pattern-matching alone, the position associated with \citeauthor{bender2021stochasticparrots}'s stochastic-parrots critique. The empirical evidence does not yet fully adjudicate the question; the practical success of scaling makes the compression-as-intelligence view hard to dismiss, but it remains a contested and deeply philosophical claim rather than a settled fact.
</div>

<div class="mn-aha">
	<div class="mn-aha-kicker">The aha</div>
	<p class="mn-aha-big">Prediction and compression are the same goal.</p>
	<p class="mn-aha-sub">To predict the next word well, a model has to find the shortest description of the data — and the shortest description of language keeps requiring a model of the <b>world</b> that produced it. Push prediction far enough and it presses into understanding.</p>
</div>


<!-- ============================================================ -->
<!-- THE MEADOW OF WORDS — a Voronoi field over the vocabulary     -->
<!-- ============================================================ -->
<style>
#word-meadow-wrap .wm-tour {
	display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;
	margin: 0 0 12px;
}
#word-meadow-wrap .wm-step {
	appearance: none; cursor: pointer;
	padding: 5px 11px; border-radius: 999px;
	border: 1px solid var(--mn-border);
	background: var(--mn-bg);
	color: var(--mn-text-secondary);
	font: 600 .72rem/1.2 inherit;
	transition: background .15s ease, color .15s ease, border-color .15s ease;
}
#word-meadow-wrap .wm-step:hover { border-color: var(--mn-accent); color: var(--mn-text); }
#word-meadow-wrap .wm-step.is-active {
	background: color-mix(in srgb, var(--mn-accent) 16%, var(--mn-surface));
	border-color: color-mix(in srgb, var(--mn-accent) 55%, var(--mn-border));
	color: var(--mn-heading);
}
#word-meadow-wrap .wm-canvas {
	display: block; width: 100%; height: 460px;
	border-radius: var(--mn-radius-md);
	border: 1px solid var(--mn-border);
	background: var(--mn-surface);
	cursor: crosshair;
	touch-action: none;
}
#word-meadow-wrap .wm-legend {
	display: flex; flex-wrap: wrap; gap: 8px 16px;
	margin: 9px 2px 0; font-size: .72rem; color: var(--mn-text-muted);
}
#word-meadow-wrap .wm-legend span { display: inline-flex; align-items: center; gap: 6px; }
#word-meadow-wrap .wm-legend i {
	width: 12px; height: 12px; border-radius: 50%;
	display: inline-block; flex: 0 0 auto;
}
#word-meadow-wrap .wm-legend .wm-dot { background: var(--mn-surface); border: 2px solid var(--mn-text-secondary); }
#word-meadow-wrap .wm-legend .wm-seam { width: 14px; height: 3px; border-radius: 2px; background: var(--mn-text-secondary); }
#word-meadow-wrap .wm-legend .wm-band { background: color-mix(in srgb, #d97706 45%, transparent); border-radius: 3px; }
#word-meadow-wrap .wm-legend .wm-thought { background: #0f766e; }
#word-meadow-wrap .wm-controls {
	display: grid; grid-template-columns: 1fr 1fr; gap: 12px 22px;
	margin-top: 14px; align-items: start;
}
#word-meadow-wrap .wm-ctl { display: block; font-size: .76rem; color: var(--mn-text-secondary); }
#word-meadow-wrap .wm-ctl b { color: var(--mn-text); font-variant-numeric: tabular-nums; }
#word-meadow-wrap .wm-ctl input[type=range] {
	display: block; width: 100%; margin-top: 6px;
	accent-color: var(--mn-accent); cursor: pointer;
}
#word-meadow-wrap .wm-ctl.wm-temp input[type=range] { accent-color: #b45309; }
#word-meadow-wrap .wm-ctl.wm-temp b { color: #b45309; }
#word-meadow-wrap .wm-nav {
	display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
	margin-top: 14px;
}
#word-meadow-wrap .wm-nav button {
	appearance: none; cursor: pointer;
	padding: 7px 16px; border-radius: 8px;
	border: 1px solid var(--mn-border);
	background: var(--mn-bg);
	color: var(--mn-text);
	font: 600 .8rem/1.2 inherit;
	transition: border-color .15s ease, background .15s ease;
}
#word-meadow-wrap .wm-nav button:hover { border-color: var(--mn-accent); }
#word-meadow-wrap .wm-nav button:disabled { opacity: .45; cursor: default; border-color: var(--mn-border); }
#word-meadow-wrap .wm-readouts {
	display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 10px; margin-top: 13px;
}
#word-meadow-wrap .wm-box {
	padding: 9px 12px; border-radius: 10px;
	background: var(--mn-bg);
	border: 1px solid var(--mn-border);
	min-width: 0;
}
#word-meadow-wrap .wm-box .wm-k { font-size: .67rem; color: var(--mn-text-muted); line-height: 1.25; }
#word-meadow-wrap .wm-box .wm-v {
	font: 700 1.02rem/1.3 var(--mn-font-heading);
	color: var(--mn-heading); margin-top: 2px;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
#word-meadow-wrap .wm-box .wm-s { font-size: .68rem; color: var(--mn-text-secondary); margin-top: 1px; }
#word-meadow-wrap .wm-box.amber { background: color-mix(in srgb, #d97706 9%, var(--mn-bg)); border-color: color-mix(in srgb, #d97706 30%, var(--mn-border)); }
#word-meadow-wrap .wm-box.amber .wm-v { color: #b45309; }
#word-meadow-wrap .wm-box.rose { background: color-mix(in srgb, #be185d 8%, var(--mn-bg)); border-color: color-mix(in srgb, #be185d 26%, var(--mn-border)); }
#word-meadow-wrap .wm-box.rose .wm-v { color: #be185d; }
#word-meadow-wrap .wm-caption {
	margin-top: 11px; padding: 10px 14px;
	border-left: 3px solid var(--mn-accent);
	border-radius: 0 var(--mn-radius-md) var(--mn-radius-md) 0;
	background: var(--mn-bg);
	color: var(--mn-text-secondary);
	font-size: .84rem; line-height: 1.55;
	min-height: 3.1em;
}
#word-meadow-wrap .wm-caption b { color: var(--mn-text); }
@media (max-width: 620px) {
	#word-meadow-wrap .wm-controls { grid-template-columns: 1fr; }
	#word-meadow-wrap .wm-readouts { grid-template-columns: 1fr; }
}
</style>

<div class="md">
## The Meadow of Words

A model thinks in a continuous space, yet it must speak in a **finite** vocabulary. This meadow shows how a thought becomes a word: every word is a pin in the field, every point of the field is a possible next-thought, and the thought simply falls into the cell of the **nearest** word. The seams between cells are exactly the places where two words are equally near — where language runs out.

> **In one line:** a language model is a finite vocabulary laid over an infinite space of meaning — and a loop that keeps falling from one point in that space to the next word.
</div>

<div id="word-meadow-wrap" class="mn-demo-panel">
	<div class="mn-demo-title">The geometry of choosing a word</div>
	<div class="mn-demo-sub">Words are pins; each one owns the region of thoughts closest to it. The line between two regions is a seam where the thought could tip either way.</div>

	<div class="wm-tour" role="group" aria-label="Guided tour">
		<button type="button" class="wm-step is-active" data-wstep="0">1 · The meadow</button>
		<button type="button" class="wm-step" data-wstep="1">2 · A clear thought</button>
		<button type="button" class="wm-step" data-wstep="2">3 · On the seam</button>
		<button type="button" class="wm-step" data-wstep="3">4 · More words</button>
		<button type="button" class="wm-step" data-wstep="4">5 · Temperature</button>
		<button type="button" class="wm-step" data-wstep="5">6 · Expressibility gap</button>
	</div>

	<canvas id="wm-canvas" class="wm-canvas" aria-label="A two-dimensional meadow partitioned into the cells of a finite vocabulary">A meadow of words: every word owns a cell, and every thought falls into the nearest word's cell.</canvas>

	<div class="wm-legend" aria-hidden="true">
		<span><i class="wm-dot"></i>word (pin)</span>
		<span><i class="wm-seam"></i>seam: here the winner changes</span>
		<span><i class="wm-band"></i>ambiguous band</span>
		<span><i class="wm-thought"></i>thought</span>
	</div>

	<div class="wm-controls">
		<label class="wm-ctl" for="wm-sN"><span>Dictionary size</span> <b id="wm-rN">12</b>
			<input type="range" id="wm-sN" min="4" max="40" step="1" value="12">
		</label>
		<label class="wm-ctl wm-temp" for="wm-sT"><span>Temperature (how open the draw is)</span> <b id="wm-rT">0.80</b>
			<input type="range" id="wm-sT" min="10" max="300" step="1" value="80">
		</label>
	</div>

	<div class="wm-nav">
		<button type="button" id="wm-prev">← Previous</button>
		<button type="button" id="wm-next">Next →</button>
	</div>

	<div class="wm-readouts">
		<div class="wm-box">
			<div class="wm-k">Thought falls into the cell of</div>
			<div class="wm-v" id="wm-rWord">—</div>
			<div class="wm-s" id="wm-rCell">move the pointer across the field</div>
		</div>
		<div class="wm-box amber">
			<div class="wm-k">Winning chance</div>
			<div class="wm-v" id="wm-rProb">—</div>
			<div class="wm-s" id="wm-rRunner">runner-up: —</div>
		</div>
		<div class="wm-box rose">
			<div class="wm-k">Margin to the nearest seam (0 = on it)</div>
			<div class="wm-v" id="wm-rEdge">—</div>
			<div class="wm-s" id="wm-rGap">ambiguous zone: —</div>
		</div>
	</div>

	<div id="wm-caption" class="wm-caption"></div>

</div>

<div class="md" data-mathlevel="40">
### The same construction in any dimension

The meadow is a **Voronoi partition** of thought space. With word pins $a_1, \dots, a_n$, the cell of word $w$ is the set of thoughts for which $a_w$ is the nearest pin:

<div>
$$C_w = \{\, h : \|h - a_w\| \le \|h - a_v\| \ \text{for every } v \,\}$$
</div>

- In **one dimension** the cells are intervals and the seams are isolated points.
- In **two dimensions** (the meadow) the cells are polygons and the seams are straight segments: the places where the thought is exactly equally far from two words.
- In the **thousands of dimensions** of a real LLM, the cells are convex polytopes whose shared walls are $(d-1)$-dimensional hyperplanes. Nothing else changes: whichever cell contains the thought wins the word, and the distance to the nearest wall measures how undecided the model is.

The idea that a concept is a **region** rather than a single point is the conceptual spaces of \citeauthor{gardenfors2000conceptual} (\citeyear{gardenfors2000conceptual}). The machine-learning version — hidden states on a latent semantic manifold, tokens as Voronoi regions, and a lower bound on the share of states that no finite vocabulary can resolve — is worked out by \citeauthor{mabrok2026latent} (\citeyear{mabrok2026latent}). Because the seam has no thickness in one place but wraps around every cell, the fraction of near-seam states does not go away when the dictionary grows; it only gets thinner, never empty.
</div>

<div class="mn-aha">
	<div class="mn-aha-kicker">The aha</div>
	<p class="mn-aha-big">The vocabulary tiles the space of thoughts.</p>
	<p class="mn-aha-sub">Every word owns a cell; every thought falls into exactly one. Choosing a word is not a lookup but a <b>partition</b> — and the seams, where two cells meet, are where the model is genuinely unsure. Grow the dictionary and the cells shrink; the seams never vanish.</p>
</div>

<div class="mn-thread">
	<a class="mn-thread-item mn-thread-fwd" target="_blank" rel="noopener" href="foam_of_meaning.php"><span class="mn-thread-label">Go deeper</span>The Foam of Meaning — the geometry of ambiguity</a>
</div>

<div class="md">
## The loop, all the way down

A language model is a loop that turns geometry into words, and words back into geometry.

Text arrives as **tokens** and becomes **vectors**. Position is folded in. Layer after layer, **attention** lets every vector look at its neighbours while the **residual stream** carries all earlier findings forward untouched. The last vector is then scored against the entire **vocabulary** and turned into a probability distribution — and one word is drawn. That word is appended to the input, and the loop starts again.

Nowhere in that loop is a shelf of stored facts, and nowhere is a little module labelled "understanding". Meaning lives in the **geometry** — in directions, distances, and regions — and the model's only task at each step is to place the next thought somewhere in that space. The meadow is that last step seen up close: a finite vocabulary cutting an infinite space of possible thoughts into cells, with a seam wherever two words are equally near. Prediction is the walk; language is the trail it leaves.

> **In one line:** a large language model is a next-word predictor trained on a vast slice of human text — and at scale, that simple loop starts to behave like a model of language, of reasoning, and of the world behind them.
</div>
