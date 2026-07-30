<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Training Data Curation
description: Common Crawl, FineWeb, deduplication, contamination, and why data is half the secret.
icon: &#128190;
part: 5
order: 39
color: rose
-->

<div class="md">
A frontier LLM is roughly **half algorithm, half data**. The same architecture trained on 1 trillion curated tokens outperforms one trained on 10 trillion unfiltered tokens. This chapter covers what data is used, how it is filtered, deduplicated, and decontaminated — and why every frontier lab guards its data recipes as their most valuable trade secret.
</div>

<div class="md">
## The Scale of Modern Training Data

Frontier LLMs are trained on **10–15 trillion tokens**. The composition is roughly:

| Source | Approx % | Tokens | Notes |
|--------|----------|--------|-------|
| Web (Common Crawl, etc.) | 50–70% | 5–10T | Raw HTML, requires heavy filtering |
| Code (GitHub, etc.) | 10–15% | 1–2T | Critical for code generation |
| Books | 5–10% | 0.5–1T | Long-form, high quality |
| Scientific papers | 3–5% | 200–500B | arXiv, PubMed, etc. |
| Wikipedia | 1–2% | 100–200B | High-quality reference text |
| Math (synthetic) | 2–5% | 200–500B | Web pages, Math StackExchange |
| Conversational / instruction | 2–5% | 200–500B | Curated human dialogues |
| Multimodal captions | 5–10% | 500B–1T | Alt-text, image captions |

The **Chinchilla scaling law** (Hoffmann et al., 2022) suggests that for a given compute budget, models are best trained when tokens $\approx 20 \times$ parameters. So a 70B model needs ~1.4T tokens to be "Chinchilla-optimal"; frontier models now train on $10 \times$ that, trading sample efficiency for capability.
</div>

<div class="md">
## Common Crawl: The Foundation

**Common Crawl** (commoncrawl.org) is a non-profit that has been archiving web pages since 2008. Each month, it crawls ~3 billion URLs, producing ~300 TB of raw HTML. After deduplication and WARC-packaging, this yields ~30 TB of useful text per month.

**Petals** is the resulting dataset: ~250B unique URLs crawled, ~9 PB of raw data. LLMs use a small, heavily-filtered subset.

The pipeline:

1. **Crawl**: WARC files of HTML pages.
2. **Extract text**: tools like **trafilatura**, **jusText**, or Resiliparse strip HTML, scripts, ads.
3. **Language identification**: fastText-based model (`lid.176.bin`) classifies each document; non-target languages are dropped.
4. **Quality filtering**: see below.
5. **Deduplication**: see below.
6. **Decontamination**: see below.
</div>

<div id="pipeline-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Quality Filtering

Web text is mostly junk: SEO spam, machine-translated articles, product listings with 50 keyword variations, "Lorem ipsum", repetitive template content. A model trained on this learns to mimic junk.

Standard filters:

* **Length filter**: drop documents < 100 or > 100,000 characters.
* **Mean word length**: drop documents with abnormally long "words" (often base64 or random tokens).
* **Symbol-to-word ratio**: drop if > 0.1 (mostly punctuation / numbers).
* **Bullet-point ratio**: drop if > 90% lines are bullets (often lists).
* **Stop-word fraction**: English text has 20–30% stop-words. Lower indicates non-natural text.
* **Perplexity filter**: compute perplexity under a small reference LM (KenLM). High perplexity → outlier text. Drop top/bottom percentiles.
* **Classifier filter**: train a binary classifier on (Good = Wikipedia/Wikipedia-like, Bad = random web pages). Apply to all documents. **Gopher rules** (Rae et al., DeepMind, 2021) and **C4** rules (Raffel et al.) are the most cited.

FineWeb (HuggingFace, 2024) pushed this further: 1.3T tokens of *English-only* web data filtered with **FastText** (high-quality vs. low-quality classifier) and aggressive deduplication. FineWeb-Edu adds an educational-quality classifier.
</div>

<div id="filter-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Deduplication

Duplicate or near-duplicate documents **inflate training cost and can cause memorization**. Dedup is essential.

### Exact Deduplication

Hash each document (SHA-256 over normalized text); keep only one copy of each hash. Catches verbatim copies but not near-duplicates.

### Fuzzy Deduplication (MinHash)

Compute $k$ hash functions over $n$-grams of each document; the **MinHash signature** approximates the Jaccard similarity between document pairs in $O(k)$ space.

$$
\text{MinHash}(h_1, \dots, h_k) = (\min_i h_1(g_i), \dots, \min_i h_k(g_i))
$$

Documents with identical MinHash signatures have high Jaccard similarity. Threshold of $0.8$ Jaccard catches near-duplicates.

### Substring Deduplication (Suffix Array)

For very large corpora, build a **suffix array** across the entire corpus and identify repeated substrings of length $\geq k$ (typically $k = 100$ characters). Drop all but one occurrence. **PaCoRA** (MosaicML) and **SemDeDup** (Abbas et al., 2023) extend this to semantic duplicates via embedding-based clustering.
</div>

<div id="dedup-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Decontamination

A document in the training set may **contain benchmark items verbatim**. Models that have seen the test set are not being honestly evaluated.

### Standard Decontamination Pipeline

1. Build a list of benchmark items (questions, options, answers, code stubs).
2. **n-gram overlap**: for each training document, compute the longest common n-gram with any benchmark item. If $> k$ (typically $k = 8$ for words, $k = 50$ for characters), drop or rewrite the document.
3. **Suffix array approach**: index all benchmark items as substrings; find all training documents containing them.

### Limitations

* **Paraphrase contamination**: rewriting a benchmark question in different words is hard to detect.
* **Translation contamination**: a French-language model could be tested on French versions of English benchmarks; cross-lingual contamination is harder.
* **Adversarial contamination**: bad actors can post benchmark items publicly to poison future training sets.

Sophisticated methods (ProxiMix, D-Clean) combine overlap detection with **perplexity filtering**: documents that the model finds "surprisingly low-perplexity" are flagged for review. FrontierMath and ARC-AGI use private, novel questions precisely to avoid this issue.
</div>

<div class="md">
## Specialized Datasets

Beyond raw web text, frontier models train on carefully curated datasets:

* **The Pile** (Gao et al., 2020): 825 GB of diverse text from 22 sources (PubMed, ArXiv, GitHub, Wikipedia, StackExchange, etc.). Open dataset, but reported to contain some benchmark contamination.
* **RedPajama** (Together, 2023): open replication of LLaMA's training mix. 1.2T tokens, all sources documented.
* **SlimPajama** (Cerebras, 2023): cleaned, deduplicated version of RedPajama. 627B tokens.
* **FineWeb** (HuggingFace, 2024): 1.3T high-quality English tokens.
* **FineWeb-Edu** (HuggingFace, 2024): 1.3T tokens scored for educational quality.
* **Cosmopedia** (HuggingFace, 2024): 25B tokens of synthetic textbooks generated by Mixtral.
* **The Stack** (BigCode, 2022): 6 TB of source code in 358 languages.
* **OBELICS** (Laurençon et al., 2023): multimodal web-text dataset.

Open recipes (RedPajama, FineWeb) have been critical for the open-source LLM movement: anyone can reproduce a near-frontier training mix.
</div>

<div class="md">
## Data Mixing: The Frontier Secret

How much web vs. code vs. math? This is largely **undocumented and proprietary**. The Chinchilla authors found the *exact* mix doesn't matter as long as the total data is large enough. But recent work shows:

* **Code data** disproportionately helps reasoning (LLaMA, Mistral, Qwen all emphasize code).
* **Math data** is critical for arithmetic; even small amounts help.
* **Multilingual data** is under-studied — most frontier models are still 70–90% English.
* **Instruction data** is best added *after* pretraining, not mixed in.
* **DPO/preference data** should be 100K–1M examples, not millions.

**Dolma** (AI2, 2024), **RedPajama-V2** (Together, 2024), and **DataComp-LM** (DCLM, 2024) are open efforts to systematically study data mixes. DataComp-LM showed that a 7B model trained on a carefully-filtered 5T tokens can outperform a model trained on 5× more data with weak filtering.
</div>

<div class="md">
## Synthetic Data

With natural data exhaust, frontier labs increasingly generate **synthetic training data**:

* **Self-instruct**: prompt the model to generate variations of seed instructions.
* **Constitutional AI**: model generates responses, critiques them against rules, revises.
* **Distillation**: a stronger model generates high-quality responses that a smaller model is then trained on.
* **Problem synthesis**: generate math problems with verifiable solutions.

Risks:

* **Model collapse** (Shumailov et al., 2024): training on a model's own outputs causes drift away from the true data distribution over generations.
* **Loss of diversity**: synthetic data tends to converge to common modes.
* **Reward hacking**: synthetic data optimized for a verifier is gamed.

OpenAI's **WebGPT** and DeepMind's **Sparrow** demonstrated that synthetic preference data can substitute for expensive human labelling, at the cost of ceiling effects (you can't exceed your teacher's quality).
</div>

<div class="md">
## Practical Recipe (Llama 3-style)

For those training their own models, the rough sequence is:

1. **Source raw data**: Common Crawl dumps, GitHub, ArXiv, StackExchange, books from public sources.
2. **Extract text**: HTML → plain text with WARC extraction.
3. **Language ID**: fastText, keep target languages.
4. **Quality filter**: heuristic rules + classifier (e.g., FineWeb's quality classifier).
5. **Deduplicate**: exact hash + MinHash + suffix-array.
6. **Decontaminate**: against benchmarks you care about.
7. **Mix and balance**: per-source sampling weights, target ratio (e.g., 50% web, 15% code, 10% books, 5% math).
8. **Tokenize**: BPE/SentencePiece over a representative sample.
9. **Pack**: concatenate and chunk into fixed-length training sequences.

This pipeline takes weeks of engineering and significant compute. The result is what you train on.
</div>

<div class="md">
## Why Data Is Half the Secret

A famous result from the **DataComp-LM** benchmark: at fixed compute, model quality scales linearly with the **quality-adjusted token count**. Doubling the data quality is equivalent to doubling model size.

The implication: data work has higher ROI than architecture work for most practitioners. A 1B model on FineWeb-Edu often beats a 3B model on Common Crawl. Frontier labs spend **half their training-team headcount on data**, not on algorithms.
</div>

<script>
// Pipeline visualization
(function() {
	const c = document.getElementById('pipeline-viz');
	if (!c) return;

	const stages = [
		{ x: 0, label: 'Web crawl\n~300 TB', color: '#475569', tokens: '300 TB raw' },
		{ x: 2.5, label: 'HTML → Text\n~30 TB', color: '#64748b', tokens: '30 TB text' },
		{ x: 5, label: 'Language ID\n+ Quality filter', color: '#3b82f6', tokens: '5 TB high-quality' },
		{ x: 7.5, label: 'Deduplication', color: '#0ea5e9', tokens: '2 TB unique' },
		{ x: 10, label: 'Decontaminate', color: '#22c55e', tokens: '1.8 TB clean' },
		{ x: 12.5, label: 'Mix + Tokenize', color: '#8b5cf6', tokens: '~1T tokens' }
	];

	const shapes = stages.map(s => ({
		type: 'rect', x0: s.x, x1: s.x + 2, y0: 1, y1: 3,
		fillcolor: s.color, line: { color: 'rgba(0,0,0,0.4)', width: 1.5 }
	}));

	const annotations = [];
	stages.forEach(s => {
		annotations.push({ x: s.x + 1, y: 2, text: '<b>' + s.label.replace('\n', '<br>') + '</b>', showarrow: false, font: { size: 10, color: '#fff' } });
		annotations.push({ x: s.x + 1, y: 0.4, text: '<i>' + s.tokens + '</i>', showarrow: false, font: { size: 9, color: '#94a3b8' } });
	});

	const arrows = stages.slice(0, -1).map((s, i) => ({
		ax: s.x + 2, ay: 2, x: stages[i + 1].x, y: 2,
		showarrow: true, arrowhead: 2, arrowsize: 1, arrowwidth: 2, arrowcolor: '#475569'
	}));

	Plotly.newPlot('pipeline-viz', [], {
		shapes, annotations,
		xaxis: { range: [-1, 16], showgrid: false, zeroline: false, showticklabels: false },
		yaxis: { range: [-0.5, 3.5], showgrid: false, zeroline: false, showticklabels: false, scaleanchor: 'x' },
		margin: { t: 20, b: 20, l: 20, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		title: { text: 'Common Crawl → training tokens (data funnel)', font: { size: 13 } }
	}, { displayModeBar: false, responsive: true });
})();

// Quality filter histogram
(function() {
	const c = document.getElementById('filter-viz');
	if (!c) return;

	const x = Array.from({length: 50}, (_, i) => i / 50);
	const y = x.map(xi => 8 * Math.exp(-((xi - 0.7) ** 2) / 0.05) + 1.5 * Math.exp(-((xi - 0.3) ** 2) / 0.02) + 0.4 * Math.exp(-((xi - 0.1) ** 2) / 0.005));

	const kept = x.map((xi, i) => xi >= 0.55 ? y[i] : 0);

	Plotly.newPlot('filter-viz', [
		{ x, y, type: 'bar', marker: { color: '#94a3b8' }, name: 'all docs' },
		{ x, y: kept, type: 'bar', marker: { color: '#22c55e' }, name: 'kept (quality ≥ 0.55)' }
	], {
		title: { text: 'Quality classifier score distribution', font: { size: 13 } },
		xaxis: { title: 'classifier score (0 = junk, 1 = high-quality)' },
		yaxis: { title: 'document count' },
		margin: { t: 50, b: 50, l: 60, r: 20 },
		barmode: 'overlay',
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		legend: { x: 0.65, y: 0.95 },
		shapes: [{ type: 'line', x0: 0.55, x1: 0.55, y0: 0, y1: 9, line: { color: '#ef4444', dash: 'dash', width: 2 } }]
	}, { responsive: true });
})();

// Deduplication: document similarity matrix
(function() {
	const c = document.getElementById('dedup-viz');
	if (!c) return;

	const N = 24;
	const z = [];
	for (let i = 0; i < N; i++) {
		const row = [];
		for (let j = 0; j < N; j++) {
			if (i === j) row.push(1);
			else if (Math.abs(i - j) <= 2 && Math.random() > 0.4) row.push(0.85 + Math.random() * 0.1);
			else if ((i < 6 && j < 6) || (i >= 6 && i < 12 && j >= 6 && j < 12) || (i >= 12 && i < 18 && j >= 12 && j < 18) || (i >= 18 && j >= 18)) {
				if (Math.random() > 0.6) row.push(0.7 + Math.random() * 0.2);
				else row.push(Math.random() * 0.3);
			}
			else row.push(Math.random() * 0.2);
		}
		z.push(row);
	}

	Plotly.newPlot('dedup-viz', [{
		z, type: 'heatmap',
		colorscale: [[0, '#0f172a'], [0.5, '#fbbf24'], [1, '#ef4444']],
		zmin: 0, zmax: 1,
		colorbar: { title: 'Jaccard' }
	}], {
		title: { text: 'Document similarity matrix (blocks = near-duplicate clusters)', font: { size: 13 } },
		xaxis: { showticklabels: false },
		yaxis: { showticklabels: false, autorange: 'reversed' },
		margin: { t: 50, b: 30, l: 30, r: 30 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)'
	}, { responsive: true });
})();

async function loadTrainingDataModule() {
	updateLoadingStatus("Loading section about Training Data Curation...");
	return Promise.resolve();
}
</script>
