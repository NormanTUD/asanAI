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

/* === Embedding demo (lndw style — Macht / Geschlecht) === */
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
	display: flex;
	align-items: center;
	justify-content: center;
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
</style><div class="md">
We can think of LLMs as machines that predict the next most likely word, given a context. Only one word at a time. That word is appended to the input and fed back in, repeating until a special `|endoftext|` token signals the end. In this example, the user enters the text “Once upon a” and lets the LLM continue.

**Step 1:** The text the user has entered is inputted into the LLM:
</div>

$$\text{Next Word} = \text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}}) \rightarrow \text{time}$$

<div class="md">
**Step 2:** The next word, predicted by the previous step, is attached, and the whole new text is inputted again:
</div>

$$\text{New Input} = \underbrace{\text{Once upon a}}_{\text{User Input}} + \underbrace{\text{time}}_{\text{Word 1}} = \text{Once upon a time}$$

<div class="md">
**Step 3:** This is repeated until we get a special `|endoftext|` signal, signifying the end of the text.
</div>

$$\text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}} \ \underbrace{\text{time}}_{\text{Word 1}}) \rightarrow \underbrace{\text{there}}_{\text{Word 2}}$$

$$\text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}} \ \underbrace{\text{time there}}_{\text{Words 1–2}}) \rightarrow \underbrace{\text{was}}_{\text{Word 3}}$$

$$\text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}} \ \underbrace{\text{time there was}}_{\text{Words 1–3}}) \rightarrow \underbrace{\text{a}}_{\text{Word 4}}$$

$$\text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}} \ \underbrace{\text{time there was a}}_{\text{Words 1–4}}) \rightarrow \underbrace{\text{dragon.}}_{\text{Word 5}}$$

$$\text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}} \ \underbrace{\text{time there was a dragon.}}_{\text{Words 1–5}}) \rightarrow \underbrace{\texttt{|endoftext|}}_{\text{Stop}}$$

<div class="md">
**Final output: “Once upon a time there was a dragon.”**
</div>

<!-- ============================================================ -->
<!-- STEP 0: AUTOREGRESSIVE LOOP VISUALIZATION -->
<!-- ============================================================ -->
<div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;
            margin:15px 0; max-width:720px; margin-left:auto; margin-right:auto;">
    <div style="text-align:center; margin-bottom:12px;">
        <span style="font-size:1.05rem; font-weight:bold; color:#1e293b;">
	    🔄 The Autoregressive Loop: One Word at a Time
	</span>
    </div>
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

<div class="md">
## How does the Computer find the next word?

The LLM learned to predict the next word by reading **massive** amounts of text (books, websites, articles) and noticing patterns in how language works, and also learning facts from the texts it read. But how does it actually go from a string of words to a prediction? Let's walk through it.

### Step 1: Tokenization

Computers don't understand words. They understand numbers. So the very first thing an LLM does is **chop the input into small pieces called tokens**. We can first think of these tokens as words, but they don't have to be. They can be sub-words, numbers or any part of a text. While we humans think in words, the LLM “thinks” in tokens.

$$\text{“Once upon a time”} \rightarrow [\text{“Once”}, \ \text{“upon”}, \ \text{“a”}, \ \text{“time”}]$$

Most tokens are common words or word fragments. For example, `"understanding"` might be split into `"under"` + `"standing"`, two tokens. This way the model can handle words it has never seen before by combining pieces it *has* seen.

What it splits and where is dependent on the data it has seen. It chooses that automatically depending on the training data, and after it has been chosen, it stays fixed.
</div>

<!-- ============================================================ -->
<!-- STEP 1: TOKENIZATION VISUALIZATION -->
<!-- ============================================================ -->
<div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;
	    margin:15px 0; max-width:720px; margin-left:auto; margin-right:auto;">
    <div style="text-align:center; margin-bottom:12px;">
	<span style="font-size:1.05rem; font-weight:bold; color:#1e293b;">
	    ✂️ Step 1: Tokenization: Chopping Text into Pieces
	</span>
    </div>
    <input type="text" id="tokenizer-input"
	   style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-size:1em; margin-bottom:12px;"
	   placeholder="Type something... e.g., 'The transformer is playing greatly'"
	   value="The transformer is playing greatly">
    <div id="tokenizer-output" style="min-height:60px;"></div>
    <div id="tokenizer-stats" style="margin-top:10px;"></div>
    <div style="margin-top:10px; padding:10px; background:#fff; border-radius:8px; border:1px dashed #cbd5e1; font-size:0.8em; color:#64748b;">
	💡 Try typing <b>“understanding”</b> or <b>“unbreakable”</b> to see subword splitting in action.
	The model breaks unknown words into known pieces it learned during training.
    </div>
</div>

<div class="md" data-mathlevel="45" data-optionaltitle="Step 2: Embedding">
### Step 2: Embedding

A raw token doesn't tell the model anything about what a word *means*. So the model replaces each token with a **long list of numbers** (called a vector) that represents its meaning.

$$\text{“König”} \rightarrow [0.22, \ 0.85, \ -0.41, \ 0.09, \ \ldots, \ 0.63]$$

These vectors live in a high-dimensional space where **words with similar meanings end up close together**. To make this tangible, the demo below plots a tiny slice of that space — just two semantic axes that the model might discover: **Macht** (power) and **Geschlecht** (gender). “Mann” and “Prinz” sit close on the Macht axis; “Mann” and “Frau” sit close on the Geschlechts axis. Nobody hand-designs these positions. The model learns them automatically during training, purely from seeing which words appear in similar contexts across billions of sentences.

What's remarkable is that this space captures **relationships**, not just similarity. The most famous example:

$$\vec{\text{König}} - \vec{\text{Mann}} + \vec{\text{Frau}} \approx \vec{\text{Königin}}$$

The direction from “Mann” to “Frau” represents the concept of gender. That same direction, applied to “König,” lands you right next to “Königin.” The model was never told any of this — these relationships emerge on their own, just from reading text.

Real networks don't just use 2 dimensions, but **thousands**. Too many to visualize. But the basic idea — position encodes meaning, direction encodes relationship — stays the same.
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

<div class="md">
### Step 3: Positional Encoding

“The dog bites man” means something very different from “The man bites dog.” Same words, different order. So a **positional encoding** is added to each token's embedding, a unique signal that says “I'm the 1st word,” “I'm the 2nd word,” and so on.

$$\text{Final Input} = \text{Embedding}(\text{token}) + \text{Position}(\text{index})$$

Now each token carries two pieces of information: **what it is** and **where it is**.

This is required, because the embedding and attention operations have no built-in notion of sequence order, so without it, “dog bites man” and “man bites dog” would look identical to the model.
</div>

<!-- ============================================================ -->
<!-- STEP 3: POSITIONAL ENCODING VISUALIZATION -->
<!-- ============================================================ -->
<div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;
	    margin:15px 0; max-width:720px; margin-left:auto; margin-right:auto;">
    <div style="text-align:center; margin-bottom:12px;">
	<span style="font-size:1.05rem; font-weight:bold; color:#1e293b;">
	    📐 Step 3: Positional Encoding: Where Am I in the Sentence?
	</span>
    </div>

    <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
	<label style="font-size:0.85em; color:#475569; font-weight:bold;">Dimensions to show:</label>
	<input type="range" id="pe-num-dims" min="2" max="12" step="1" value="8"
	       style="flex:1; accent-color:#8b5cf6;">
	<span style="font-weight:bold; color:#8b5cf6; min-width:24px;">8</span>
    </div>

    <!-- Sine/Cosine wave plot -->
    <div id="positional-encoding-plot" data-plot-theme="self" style="height:300px; background:var(--mn-surface, #fff); border-radius:8px; border:1px solid #e2e8f0; margin-bottom:12px;"></div>

    <!-- Heatmap -->
    <div style="font-weight:bold; color:#1e293b; margin-bottom:6px;">Positional Encoding Heatmap</div>
    <div id="positional-encoding-heatmap" data-plot-theme="self" style="height:300px; background:var(--mn-surface, #fff); border-radius:8px; border:1px solid #e2e8f0; margin-bottom:12px;"></div>

    <!-- Same word, different positions demo -->
    <div style="font-weight:bold; color:#1e293b; margin-bottom:6px;">Same Word, Different Positions</div>
    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:8px;">
	<input type="text" id="pe-demo-word" value="cat" placeholder="Word"
	       style="width:80px; padding:6px; border-radius:6px; border:1px solid #cbd5e1;">
	<label style="font-size:0.85em; color:#475569;">Pos 1:
	    <input type="number" id="pe-demo-pos1" value="0" min="0" max="19"
		   style="width:50px; padding:4px; border-radius:4px; border:1px solid #cbd5e1;">
	</label>
	<label style="font-size:0.85em; color:#475569;">Pos 2:
	    <input type="number" id="pe-demo-pos2" value="5" min="0" max="19"
		   style="width:50px; padding:4px; border-radius:4px; border:1px solid #cbd5e1;">
	</label>
    </div>
    <div id="pe-addition-demo"></div>
</div>

<div class="md">
### Step 4: The Transformer Layers

This is the heart of the model, the **Transformer architecture** introduced in \citeyear{vaswani2017attention}. The token vectors flow through **many layers** stacked on top of each other (modern LLMs can have 80+ layers). Each layer refines the model's understanding a little more. This is done by adding the output of each layer to the existing data, instead of overwriting it, so that nothing learned earlier gets thrown away:

$$\mathbf{x} := \mathbf{x} + \text{Layer}(\mathbf{x})$$

This is called a **Residual Stream**, originally invented for preventing the **Vanishing Gradient Problem**, but now, additionally, acts as a **shared notebook**. Each layer reads from the notebook, does some thinking, and **writes its findings back** to it.

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

It is important to note that not all attention heads do something that is humanly interpretable. They may look like they're reacting to nouns or verbs, but in reality, it's just a pattern learnt from statistics. They are not programmed to react to those words, and they don't 'know' what they are.

#### 4b: Feed-Forward Network - “What do I conclude?”

After attention has gathered context, a small **neural network** processes each token individually. This is where the model applies knowledge it memorized during training: facts, patterns, and rules of language.

If attention is *gathering clues*, the feed-forward network is *drawing conclusions*.

If Attention is about *looking around* at other words, the Feed-Forward Network (FFN) is about *looking inward* into the model's memory.

The Feed-Forward-Network is often thought of as the **\cite[Knowledge bank]{keyvalmem}** of a Transformer. Here it is decided, in what direction in the Embedding Space the **Contextualized Embedding** should be moved to get closer to a meaningful next word.

Three things happen, in order:

1. **The Detectors** — the model expands the word's vector to check for thousands of specific patterns (“Is this a French landmark?” “Is this about technology?”).
2. **The Filter** — a mathematical filter (ReLU) zeroes out any detector that didn't find a match. Only the strong signals survive.
3. **The Knowledge** — for every detector that fired, the model adds associated facts back into the token's vector.

Let's look at the word **“Apple”**. Because of the *Attention* step, its vector already contains clues about its context. Watch how the FFN reacts differently based on that context.
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
            <div class="ffn-col-head">Input Vector</div>
            <div id="ffn-input-box" class="ffn-pill">
                “Apple” + Context
            </div>
        </div>

        <div style="width: 180px; text-align: center; z-index: 2;">
            <div class="ffn-col-head">Pattern Detectors</div>
            <div id="ffn-detectors" style="display: flex; flex-direction: column; gap: 10px;">
                </div>
        </div>

        <div style="width: 200px; text-align: center; z-index: 2;">
            <div class="ffn-col-head">Added Knowledge</div>
            <div id="ffn-facts" style="display: flex; flex-direction: column; gap: 10px;">
                </div>
        </div>

        <div style="width: 120px; text-align: center; z-index: 2;">
            <div class="ffn-col-head">Output Vector</div>
            <div id="ffn-output-box" class="ffn-pill">
                Enriched Vector
            </div>
        </div>

        <svg id="ffn-lines" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none;">
            </svg>

    </div>

    <div id="ffn-explanation">
        Select a context above to see how the FFN processes it.
    </div>
</div>

<div class="md" data-mathlevel="55">
Technically, this is expressed with the formula:
$$ \text{FFN}(x) = W_2 \cdot \max(0, W_1 \cdot x + b_1) + b_2 $$
Where $W_1$ acts as the detectors, the $\max(0, ...)$ is the ReLU filter shutting down negative matches, and $W_2$ contains the knowledge vectors that get added together.

#### 4c: All together

The result of both, the Attention Heads and then the Feed-Forward-Network, are then returned and simply added to the **Residual Stream**.

Neither the **Attention Heads** nor the **Neural Network** are configured by hand. They learn what to look for by looking at massive amounts of data.
</div>

<!-- ============================================================ -->
<!-- STEP 4: TRANSFORMER LAYERS - RESIDUAL STREAM -->
<!-- ============================================================ -->
<div id="residual-stream-plot"></div>

<div style="display:flex; align-items:center; gap:14px; margin-top:14px; justify-content:center; flex-wrap:wrap;">
    <button id="residual-stream-prev" onclick="ResidualStreamViz.prevLayer()"
        style="padding:9px 18px; border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc; cursor:pointer; font-size:14px;">
        ← Prev
    </button>
    <span id="residual-stream-layer-label"
        style="font-weight:bold; font-size:15px; min-width:110px; text-align:center; color:#1e293b;">
        Embedding
    </span>
    <button id="residual-stream-next" onclick="ResidualStreamViz.nextLayer()"
        style="padding:9px 22px; border-radius:8px; border:none; background:#3b82f6; color:#fff; cursor:pointer; font-size:14px; font-weight:600;">
        Next Layer →
    </button>
    <input type="range" id="residual-stream-layer" min="0" max="3" value="0"
        oninput="ResidualStreamViz.setLayer(parseInt(this.value))"
        style="width:140px; margin-left:8px;">
    <button onclick="ResidualStreamViz.reset()"
        style="padding:9px 14px; border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc; cursor:pointer; font-size:13px; color:#64748b;">
        Reset
    </button>
</div>

<div id="residual-stream-info" style="margin-top:14px;"></div>

<div class="md">
### Step 5: The Final Prediction

After all layers, the model takes the **last token's vector** and produces a **score for every word in the vocabulary** (often 50,000+ words). These scores are converted into probabilities:

$$P(\text{“time”}) = 0.72, \quad P(\text{“day”}) = 0.08, \quad P(\text{“hill”}) = 0.002, \quad \ldots$$

The model then **picks a word**, usually one of the top candidates, with a bit of randomness so it doesn't always say the exact same thing. That's what makes it creative.

And then, as we saw in Part I, that word gets appended to the input and the whole process repeats, one word at a time, until the model decides it's done.
</div>

<!-- ============================================================ -->
<!-- STEP 5: FINAL PREDICTION -->
<!-- ============================================================ -->
<div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;
            margin:15px 0; max-width:720px; margin-left:auto; margin-right:auto;">
    <div style="text-align:center; margin-bottom:12px;">
        <span style="font-size:1.05rem; font-weight:bold; color:#1e293b;">
            🎯 Step 5: The Final Prediction: Probability over Vocabulary
        </span>
        <div style="font-size:0.85em; color:#64748b; margin-top:4px;">
            Input: “Once upon a” → What comes next?
        </div>
    </div>

    <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
        <span style="font-size:0.85em; color:#3b82f6; font-weight:bold;">🎯 Greedy</span>
        <input type="range" id="prediction-temperature" min="0.1" max="3.0" step="0.05" value="1.0"
               style="flex:1; accent-color:#f59e0b;">
        <span style="font-size:0.85em; color:#ef4444; font-weight:bold;">🎲 Creative</span>
        <span id="prediction-temp-val"
              style="font-size:0.9em; font-weight:bold; color:#1e293b; min-width:120px; text-align:right;">1.00 (balanced)</span>
    </div>

    <div id="prediction-plot" data-plot-theme="self" style="height:350px; background:var(--mn-surface, #fff); border-radius:8px; border:1px solid #e2e8f0; margin-bottom:10px;"></div>
    <div id="prediction-info"></div>

    <div style="margin-top:10px; padding:10px; background:#fff; border-radius:8px; border:1px dashed #cbd5e1; font-size:0.8em; color:#64748b;">
        💡 <b>Temperature</b> controls randomness. At T→0, the model always picks the top word (greedy).
        At high T, the distribution flattens and rare words get a chance, that's what makes LLMs “creative.”
        The model doesn't “know” the answer; it assigns probabilities and <b>samples</b>.
    </div>
</div>

<div class="md" data-mathlevel="55" data-optionaltitle="The key insight">
## The key insight

There is no “understanding” module, no grammar checker, no knowledge database. It's all just vectors flowing through layers of simple math: addition, multiplication, and comparison. But stack enough of these simple operations together, and something that *looks a lot like understanding* emerges.

### Why next-token prediction is so powerful

The goal of minimizing cross-entropy loss is not a shallow objective. There is a deep connection between **prediction** and **compression**. The Kolmogorov complexity $K(x)$ of a string $x$ is the length of the shortest program that produces it. Solomonoff's theory of inductive inference proves that the optimal predictor for any sequence is the one that finds the shortest description (maximum compression) of the data seen so far. Cross-entropy loss, which LLMs minimize, is an upper bound on the compressibility of the text. A model that achieves low cross-entropy has found a short description of the statistical structure of language.

The hypothesis that drives much of modern scaling research goes further: to compress natural language well, you must model the **causal structure of the world** that generates language. When the training text says “I dropped the glass and it ___,” predicting “shattered” requires an implicit model of gravity, material properties, and causation. The model does not need to be explicitly taught physics; the compression objective pushes it to discover physical regularities because they reduce prediction error. This is the dominant interpretation of why scaling works: more parameters allow more compression, which requires more accurate world models, which produces more “intelligent” behavior. **From this perspective, intelligence and optimal compression go hand in hand** — intelligence is not a separate objective that has to be optimized directly.

This framing is best read as a productive working hypothesis, not a proved identity. Solomonoff's theorem is a result about *prediction*, not about *understanding*: an optimal predictor must be a compressor, but it does not settle whether a *particular* predictor, including a modern LLM, has anything resembling genuine world knowledge — or whether fluent prediction can arise from large-scale surface pattern-matching alone, the position associated with \citeauthor{bender2021stochasticparrots}'s stochastic-parrots critique. The empirical evidence does not yet fully adjudicate the question; the practical success of scaling makes the compression-as-intelligence view hard to dismiss, but it remains a contested and deeply philosophical claim rather than a settled fact.
</div>
