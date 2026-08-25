<?php
/* ════════════════════════════════════════════════════════════════
   KNOWLEDGE MAP — The Web of This Course
   Every module is a node. Every shared citation, cross-reference,
   and shared concept is an edge. Search everything, click to explore.
   ════════════════════════════════════════════════════════════════ */
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

/* ── Concept dictionary: concept → keywords that signal it ──
   Only DISTINCTIVE keywords count. Generic buzzwords (token, matrix,
   image, history, compute…) appear in nearly every module and would
   drown the real relationships, so they are deliberately excluded. */
$KM_CONCEPTS = [
	'Calculus & Derivatives'      => ['derivative', 'chain rule', 'partial derivative', 'integral', 'differential calculus', 'differentiation'],
	'Linear Algebra'              => ['linear algebra', 'matrix multiplication', 'vector space', 'eigenvalue', 'basis vector', 'linear transformation'],
	'Probability & Distributions' => ['probability distribution', 'gaussian', 'normal distribution', 'bernoulli', 'binomial', 'poisson', 'expected value', 'law of large numbers', 'central limit theorem'],
	'Statistics & Inference'      => ['maximum likelihood', 'regression', 'standard deviation', 'hypothesis test', 'bayesian', 'correlation coefficient', 'sample mean', 'confidence interval'],
	'Optimization'                => ['gradient descent', 'optimizer', 'sgd', 'adam optimizer', 'learning rate', 'momentum', 'loss landscape', 'stochastic optimization', 'convergence'],
	'Loss Functions'              => ['loss function', 'cross-entropy', 'mean squared error', 'binary cross', 'objective function'],
	'Backpropagation'             => ['backpropagation', 'backprop', 'automatic differentiation', 'autodiff', 'backward pass', 'reverse-mode', 'chain rule'],
	'Neural Networks'             => ['neural network', 'perceptron', 'deep learning', 'feedforward', 'fully connected', 'hidden layer', 'multi-layer'],
	'Activation Functions'        => ['activation function', 'relu', 'sigmoid', 'tanh', 'gelu', 'swish', 'leaky relu'],
	'Attention'                   => ['attention', 'self-attention', 'attention head', 'attention mechanism', 'attention is all you need'],
	'Transformer'                 => ['transformer', 'multi-head', 'encoder-decoder', 'positional encoding', 'positional embedding', 'masked self-attention'],
	'Tokenization'                => ['tokenization', 'tokenizer', 'byte-pair', 'bpe', 'subword', 'vocabulary', 'tokens'],
	'Embeddings'                  => ['embedding', 'word2vec', 'cosine similarity', 'embedding layer', 'semantic space', 'embedding space'],
	'Context Windows'             => ['context window', 'context length', 'long context', 'sequence length', 'context size'],
	'Recurrent Networks'          => ['rnn', 'lstm', 'gru', 'recurrent network', 'long short-term', 'vanishing gradient', 'recurrent layer'],
	'Convolutions & Vision'       => ['convolution', 'cnn', 'convolutional', 'feature map', 'visual cortex', 'convolutional network'],
	'Residual Networks'           => ['resnet', 'residual', 'skip connection', 'residual stream', 'identity mapping', 'residual block'],
	'Normalization'               => ['layer normalization', 'layer norm', 'batch normalization', 'batch norm', 'normalization layer'],
	'Regularization'              => ['regularization', 'dropout', 'overfitting', 'underfitting', 'weight decay', 'early stopping'],
	'Training Data'               => ['training data', 'dataset', 'corpus', 'annotated', 'synthetic data', 'data quality', 'label quality'],
	'Fine-Tuning'                 => ['fine-tuning', 'finetun', 'transfer learning', 'instruction tuning', 'post-training', 'parameter-efficient'],
	'Reinforcement Learning'      => ['reinforcement learning', 'reward', 'ppo', 'dqn', 'actor-critic', 'reward model'],
	'RLHF & Alignment'            => ['rlhf', 'human feedback', 'preference', 'alignment', 'constitutional', 'preference optimization'],
	'AI Agents'                   => ['tool use', 'function calling', 'autonomous agent', 'orchestrator', 'multi-agent', 'reasoning loop', 'agentic'],
	'Retrieval (RAG)'             => ['retrieval-augmented', 'retrieval', 'rag', 'chunk', 'relevance', 'reranking', 'retriever'],
	'Vector Databases'            => ['vector database', 'vector search', 'similarity search', 'nearest neighbor', 'hnsw', 'ann index'],
	'Web Search'                  => ['web search', 'search engine', 'browser', 'serp', 'crawl', 'search results'],
	'Hallucinations'              => ['hallucination', 'confabulation', 'factual accuracy', 'factual error'],
	'Safety & Risks'              => ['ai safety', 'harmful', 'misuse', 'jailbreak', 'dangerous capability', 'safety training', 'harmful content'],
	'Security & Privacy'          => ['security', 'adversarial attack', 'prompt injection', 'privacy', 'data leakage', 'poisoning', 'attack surface'],
	'Interpretability'            => ['interpretability', 'mechanistic', 'circuit', 'superposition', 'sparse autoencoder', 'sae', 'polysemanticity', 'interpretable'],
	'Scaling Laws'                => ['scaling law', 'power law', 'bitter lesson', 'scaling behavior', 'compute-optimal'],
	'Evaluation'                  => ['benchmark', 'evaluation', 'accuracy', 'perplexity', 'win rate', 'benchmarks'],
	'Reasoning'                   => ['chain-of-thought', 'cot', 'test-time compute', 'verifier', 'logical reasoning', 'reasoning step'],
	'Prompting'                   => ['prompt engineering', 'few-shot', 'in-context learning', 'zero-shot', 'prompting'],
	'Inference Optimization'      => ['quantization', 'kv cache', 'pruning', 'distillation', 'latency', 'throughput', 'speculative decoding', 'inference cost'],
	'GPU & Hardware'              => ['gpu', 'cuda', 'tpu', 'memory bandwidth', 'flops', 'accelerator', 'graphics card'],
	'Deployment & Serving'        => ['deployment', 'serving', 'production', 'container', 'docker', 'local model', 'open-source model', 'deployed'],
	'Diffusion Models'            => ['diffusion', 'denoising', 'latent diffusion', 'generative model', 'stable diffusion', 'diffusion model'],
	'Multimodal'                  => ['multimodal', 'vision-language', 'image captioning', 'vlm', 'clip', 'text-to-image', 'multimodal model'],
	'Speech & Audio'              => ['speech', 'audio', 'whisper', 'text-to-speech', 'asr', 'speech recognition', 'audio model'],
	'Symbolic AI & Knowledge'     => ['symbolic', 'knowledge graph', 'rule-based', 'expert system', 'ontology', 'neuro-symbolic', 'symbolic reasoning'],
	'Language & Linguistics'      => ['linguistics', 'grammar', 'syntax', 'semantics', 'sanskrit', 'chomsky', 'morpheme', 'distributional hypothesis'],
	'History of AI'               => ['turing', 'perceptron', 'dartmouth', 'artificial intelligence', 'von neumann', 'ai winter', 'darpa'],
	'Philosophy & Ethics'         => ['philosophy', 'ethics', 'consciousness', 'morality', 'responsibility', 'existential', 'ethical'],
	'Law & Regulation'            => ['regulation', 'copyright', 'liability', 'eu ai act', 'data protection', 'governance', 'legislation'],
	'Economics'                   => ['economics', 'productivity', 'business model', 'economic', 'commercial'],
	'Frontier & Future'           => ['frontier', 'agi', 'superintelligence', 'artificial general', 'existential risk', 'next-generation'],
];

/* ── Excluded files (not course modules / tool pages) ── */
$KM_EXCLUDE = ['index', 'index_full', 'functions', 'search', 'graph', 'literature', 'asanai_blog_proxy', 'knowledge_map', 'category_theory', 'commutation', 'layer_commuting_diagram', 'math_deri', '_aurora_test'];

/* ── Part colors (match course parts 0–6) ── */
$KM_PART_COLORS = [
	0 => '#94a3b8', 1 => '#818cf8', 2 => '#38bdf8', 3 => '#34d399',
	4 => '#fbbf24', 5 => '#f472b6', 6 => '#c084fc',
];
$KM_PART_NAMES = [
	0 => 'Prologue', 1 => 'Foundations', 2 => 'How Networks Learn', 3 => 'Deep Learning & Vision',
	4 => 'The Transformer Revolution', 5 => 'Making AI Useful', 6 => 'Bigger Questions',
];

function km_clean_text($html) {
	$html = preg_replace('/<\?php.*?\?[>]/s', '', $html);
	$html = preg_replace('/<script[^>]*>.*?<\/script>/is', '', $html);
	$html = preg_replace('/<style[^>]*>.*?<\/style>/is', '', $html);
	$text = strip_tags($html);
	$text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
	$text = preg_replace('/\s+/u', ' ', $text);
	return trim($text);
}

function km_clean_heading($text) {
	$text = preg_replace('/\\\\(?:footcite|cite|citeauthor|citeauthorlastnameand|citetitle|citeyear|citealternativetitle|citeurl)(?:\[[^\]]*\])?\{[^}]*\}/', '', $text);
	$text = preg_replace('/\$[^$]*\$/', '', $text);
	$text = preg_replace('/[#*`]/', '', $text);
	$text = preg_replace('/\[([^\]]*)\]\([^)]*\)/', '$1', $text);
	$text = preg_replace('/\s+/u', ' ', $text);
	return trim($text);
}

function km_slugify($text) {
	$text = preg_replace('/[^\w\s\p{L}]/u', '', $text);
	$text = preg_replace('/[-\s]+/u', '-', $text);
	$text = trim($text, '-');
	return mb_strtolower($text);
}

$modules = [];
foreach (glob('*.php') as $file) {
	$slug = basename($file, '.php');
	if (in_array($slug, $KM_EXCLUDE, true)) continue;

	$content = @file_get_contents($file);
	if (!$content) continue;
	if (!preg_match('/COURSE_METADATA:/', $content)) continue;

	$meta = ['title' => $slug, 'description' => '', 'icon' => '', 'part' => 0, 'order' => 999];
	if (preg_match('/<!--\s*\n?\s*COURSE_METADATA:\s*\n((?:.*\n)*?)\s*-->/', $content, $m)) {
		foreach (explode("\n", $m[1]) as $line) {
			$line = trim($line);
			if (preg_match('/^(\w+):\s*(.+)$/', $line, $mm)) {
				$meta[$mm[1]] = trim($mm[2]);
			}
		}
	}

	$text = km_clean_text($content);
	$lower = mb_strtolower($text);

	/* citations */
	$cites = [];
	if (preg_match_all('/\\\\(?:footcite|cite|citeauthor|citeauthorlastnameand|citetitle|citeyear|citealternativetitle|citeurl)(?:\[[^\]]*\])?\{([^}]+)\}/', $content, $cm)) {
		foreach ($cm[1] as $k) { $k = trim($k); if ($k !== '') $cites[$k] = true; }
	}

	/* concept hits */
	$conceptCounts = [];
	foreach ($KM_CONCEPTS as $label => $kws) {
		$hits = 0;
		foreach ($kws as $kw) {
			if ($kw === '') continue;
			if (preg_match('/\b' . preg_quote($kw, '/') . '/iu', $text)) $hits++;
		}
		if ($hits > 0) $conceptCounts[$label] = $hits;
	}
	arsort($conceptCounts);

	/* headings (h1–h3 + markdown) for section navigation */
	$headings = [];
	$seen = [];
	if (preg_match_all('/<h([1-3])[^>]*>(.*?)<\/h\1>/is', $content, $hm, PREG_SET_ORDER)) {
		foreach ($hm as $h) {
			$t = km_clean_heading(strip_tags($h[2]));
			if ($t === '' || mb_strlen($t) < 3) continue;
			$key = mb_strtolower($t);
			if (isset($seen[$key])) continue;
			$seen[$key] = true;
			$headings[] = ['text' => $t, 'slug' => km_slugify($t), 'level' => (int)$h[1]];
		}
	}
	if (preg_match_all('/^\s*#{1,3}\s+(.+?)\s*#*\s*$/m', $content, $hm)) {
		foreach ($hm[1] as $h) {
			$t = km_clean_heading($h);
			if ($t === '' || mb_strlen($t) < 3) continue;
			$key = mb_strtolower($t);
			if (isset($seen[$key])) continue;
			$seen[$key] = true;
			$headings[] = ['text' => $t, 'slug' => km_slugify($t), 'level' => 3];
		}
	}
	$headings = array_slice($headings, 0, 40);

	$modules[$slug] = [
		'id'          => $slug,
		'name'        => $slug,
		'title'       => $meta['title'],
		'description' => $meta['description'],
		'icon'        => $meta['icon'],
		'part'        => isset($meta['part']) ? (int)$meta['part'] : 0,
		'order'       => isset($meta['order']) ? (int)$meta['order'] : 999,
		'url'         => $slug . '.php',
		'concepts'    => $conceptCounts,
		'citations'   => array_keys($cites),
		'headings'    => $headings,
		'wordCount'   => str_word_count($text),
	];
}

/* ── Build edges ── */
$edges = [];
$edgeIndex = [];

function km_add_edge(&$edges, $a, $b, $type, $weight, $reasons) {
	$key = $a < $b ? "$a|$b" : "$b|$a";
	if (!isset($edges[$key])) {
		$edges[$key] = ['a' => $a, 'b' => $b, 'type' => $type, 'weight' => 0, 'reasons' => []];
	}
	$edges[$key]['weight'] += $weight;
	$edges[$key]['reasons'][$type] = array_values(array_unique(array_merge(
		$edges[$key]['reasons'][$type] ?? [],
		$reasons
	)));
}

$moduleKeys = array_keys($modules);

foreach ($moduleKeys as $slug) {
	$m = $modules[$slug];
	foreach ($m['citations'] as $ck) {
		foreach ($moduleKeys as $other) {
			if ($other === $slug) continue;
			if (in_array($ck, $modules[$other]['citations'], true)) {
				km_add_edge($edges, $slug, $other, 'citation', 1, [$ck]);
			}
		}
	}
}

/* ── Concept affinity (TF–IDF) ─────────────────────────────────────
   Every shared concept contributes idf² to a pair's affinity, where
   idf = ln(1 + total_modules / modules_covering_that_concept).
   Concepts covered by nearly every module weigh almost nothing;
   distinctive ones weigh a lot. Pairs below the threshold are
   dropped, so the graph stays readable. */
$KM_CONCEPT_MIN = 12;
$pagesWith = [];
foreach ($modules as $m) {
	foreach ($m['concepts'] as $c => $v) $pagesWith[$c] = ($pagesWith[$c] ?? 0) + 1;
}
$idf = [];
foreach ($pagesWith as $c => $n) $idf[$c] = log(1 + count($modules) / $n);

$conceptPairs = [];
foreach ($moduleKeys as $i => $a) {
	foreach ($moduleKeys as $j => $b) {
		if ($j <= $i) continue;
		$shared = array_intersect_key($modules[$a]['concepts'], $modules[$b]['concepts']);
		if (!$shared) continue;
		$dot = 0;
		foreach ($shared as $c => $v) $dot += $idf[$c] * $idf[$c];
		/* strong pairs anywhere, or moderately strong pairs inside a part */
		$samePart = $modules[$a]['part'] === $modules[$b]['part'];
		if ($dot < $KM_CONCEPT_MIN && !($samePart && $dot >= 4.5)) continue;
		ksort($shared);
		$conceptPairs[] = ['a' => $a, 'b' => $b, 'w' => round($dot, 1), 'names' => array_keys($shared)];
	}
}
usort($conceptPairs, fn($x, $y) => $y['w'] <=> $x['w']);

foreach ($conceptPairs as $p) {
	km_add_edge($edges, $p['a'], $p['b'], 'concept', $p['w'], $p['names']);
}

/* course learning-path edges (n → n+1 in course order) */
$ordered = $modules;
usort($ordered, function($a, $b) {
	if ($a['part'] !== $b['part']) return $a['part'] <=> $b['part'];
	return $a['order'] <=> $b['order'];
});
$orderedSlugs = array_column($ordered, 'id');
$kmPath = $orderedSlugs;
$kmOrderIndex = array_flip($kmPath);
foreach ($modules as &$m) $m['orderIndex'] = $kmOrderIndex[$m['id']];
unset($m);
for ($i = 0; $i < count($orderedSlugs) - 1; $i++) {
	km_add_edge($edges, $orderedSlugs[$i], $orderedSlugs[$i + 1], 'course', 1, []);
}

$edgeList = array_values($edges);
foreach ($edgeList as &$e) {
	if (isset($e['reasons']['link']))    $e['linkText']    = implode(', ', $e['reasons']['link']);
	if (isset($e['reasons']['citation']))$e['citeText']   = implode(', ', $e['reasons']['citation']);
	if (isset($e['reasons']['concept'])) $e['conceptText']= implode(', ', $e['reasons']['concept']);
	$e['types'] = array_keys($e['reasons']);
}

/* degrees */
$degree = [];
foreach ($edgeList as $e) {
	$degree[$e['a']] = ($degree[$e['a']] ?? 0) + 1;
	$degree[$e['b']] = ($degree[$e['b']] ?? 0) + 1;
}
foreach ($modules as &$m) $m['degree'] = $degree[$m['id']] ?? 0;
unset($m);

$stats = [
	'modules'    => count($modules),
	'citations'  => count(array_unique(array_merge(...array_column($modules, 'citations')))),
	'edges'      => count($edgeList),
	'concepts'   => count($KM_CONCEPTS),
	'conceptPair'=> count($conceptPairs),
];

$KM = [
	'nodes'    => array_values($modules),
	'edges'    => $edgeList,
	'parts'    => $KM_PART_NAMES,
	'colors'   => $KM_PART_COLORS,
	'concepts' => $KM_CONCEPTS,
	'path'     => $kmPath,
	'stats'    => $stats,
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#0a0f1f">
<title>The Web of Knowledge, Course Map</title>
<script>
(function() {
	function apply(theme) {
		var t = theme === 'light' ? 'light' : 'dark';
		document.documentElement.classList.toggle('light', t === 'light');
		var meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.content = t === 'light' ? '#f2f4fb' : '#0a0f1f';
	}
	apply(document.cookie.indexOf('theme=light') !== -1 ? 'light' : 'dark');
	window.__kmSetTheme = function(t) {
		document.cookie = 'theme=' + t + '; path=/; max-age=' + 60*60*24*365;
		apply(t);
	};
})();
</script>
<style>
* { box-sizing: border-box; }
:root {
	--bg0: #0a0f1f; --bg1: #101a33; --bg2: #0c1226;
	--card: rgba(19,28,56,.82); --card-solid: #141d3a;
	--line: rgba(120,145,210,.16); --line-strong: rgba(150,170,230,.38);
	--ink: #e9eeff; --ink-soft: #aab6d8; --ink-mute: #6b7aa8;
	--accent: #8ab4ff; --accent2: #c084fc;
	--shadow: 0 24px 70px rgba(0,0,0,.5);
	--r: 18px;
	--glow: rgba(138,180,255,.12);
}
html.light {
	--bg0: #f2f4fb; --bg1: #ffffff; --bg2: #e9edf8;
	--card: rgba(255,255,255,.9); --card-solid: #ffffff;
	--line: rgba(30,50,90,.14); --line-strong: rgba(60,90,160,.32);
	--ink: #16203a; --ink-soft: #4a5678; --ink-mute: #8a94b4;
	--accent: #3b6fd4; --accent2: #7c4fd4;
	--shadow: 0 24px 60px rgba(40,60,120,.18);
	--glow: rgba(60,110,220,.10);
}
html, body { margin: 0; padding: 0; }
body {
	background: var(--bg0); color: var(--ink);
	font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
	-webkit-font-smoothing: antialiased;
	overflow-x: hidden;
}
::selection { background: rgba(138,180,255,.35); }
a { color: var(--accent); text-decoration: none; }

/* ── hero ── */
.km-hero { text-align: center; padding: 30px 18px 8px; }
.km-eyebrow {
	display: inline-flex; align-items: center; gap: 8px;
	font-size: .72rem; letter-spacing: .22em; text-transform: uppercase;
	color: var(--ink-mute); margin-bottom: 12px;
}
.km-eyebrow::before, .km-eyebrow::after { content: ""; width: 34px; height: 1px; background: var(--line-strong); }
.km-title {
	margin: 0; font-size: clamp(1.9rem, 4vw, 3rem); font-weight: 800; letter-spacing: -.02em;
	background: linear-gradient(100deg, #7dd3fc, #c084fc 45%, #f472b6 80%);
	-webkit-background-clip: text; background-clip: text; color: transparent;
}
.km-title .of { background: none; color: var(--ink); -webkit-text-fill-color: var(--ink); }
.km-sub { max-width: 660px; margin: 10px auto 0; color: var(--ink-soft); line-height: 1.65; font-size: .95rem; }
.km-stats { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin: 16px 0 2px; }
.km-stat {
	font-size: .78rem; color: var(--ink-mute); padding: 5px 12px;
	border: 1px solid var(--line); border-radius: 999px; background: var(--card);
	display: inline-flex; align-items: center; gap: 6px;
}
.km-stat b { color: var(--ink); font-weight: 700; }
.km-stat .sw { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

/* ── stage ── */
.km-stage {
	display: flex; flex-direction: column; gap: 14px;
	margin: 6px auto 34px; padding: 0 18px;
	max-width: 1560px;
}
.km-canvas {
	position: relative; height: calc(100vh - 250px); min-height: 520px;
	border: 1px solid var(--line); border-radius: var(--r);
	overflow: hidden; box-shadow: var(--shadow);
	background:
		radial-gradient(120% 90% at 50% -10%, var(--bg1) 0%, transparent 55%),
		radial-gradient(60% 45% at 85% 100%, rgba(124,84,212,.10) 0%, transparent 60%),
		radial-gradient(55% 45% at 8% 100%, rgba(56,189,248,.10) 0%, transparent 60%),
		var(--bg0);
}
.km-canvas::after {
	content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 1;
	background-image:
		radial-gradient(rgba(160,185,255,.12) 1px, transparent 1.4px),
		radial-gradient(rgba(160,185,255,.08) 1px, transparent 1.4px);
	background-size: 38px 38px, 19px 19px;
	background-position: 0 0, 9px 9px;
	mask-image: radial-gradient(120% 100% at 50% 0%, #000 40%, transparent 95%);
}
#km-chart { position: absolute; inset: 0; z-index: 2; }
.km-lane-glow { position: absolute; left: -8%; width: 116%; height: 92px; pointer-events: none; z-index: 0; border-radius: 50%; filter: blur(26px); opacity: .07; }
.km-lane-label {
	position: absolute; left: 10px; z-index: 3; font-size: .66rem; letter-spacing: .12em;
	text-transform: uppercase; color: var(--ink-mute); pointer-events: none;
	transform: translateY(-50%); display: flex; align-items: center; gap: 7px; white-space: nowrap;
}
.km-lane-label .sw { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }

/* legend + controls */
.km-legend {
	position: absolute; top: 14px; left: 14px; z-index: 6;
	background: var(--card); border: 1px solid var(--line); border-radius: 14px;
	padding: 10px 12px; backdrop-filter: blur(10px); max-width: 210px;
}
.km-legend .lh { font-size: .62rem; text-transform: uppercase; letter-spacing: .14em; color: var(--ink-mute); margin-bottom: 7px; }
.km-legend .lg-row { display: flex; align-items: center; gap: 8px; font-size: .72rem; color: var(--ink-soft); padding: 2.5px 0; line-height: 1.25; }
.km-legend .lg-row .sw { width: 9px; height: 9px; border-radius: 50%; flex: 0 0 auto; }
.km-legend .edge-row { margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--line); }
.km-legend .edge-row .lg-row .sw { width: 16px; height: 0; border-top: 2px solid; border-radius: 0; }
.km-legend .edge-row .lg-row.dash .sw { border-top-style: dashed; }
.km-legend .edge-row .lg-row.glow .sw { border-top: 3px solid; filter: drop-shadow(0 0 3px rgba(255,255,255,.35)); }

.km-controls {
	position: absolute; top: 14px; right: 14px; z-index: 6;
	display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;
}
.km-pill {
	display: inline-flex; align-items: center; gap: 6px;
	font-size: .74rem; color: var(--ink-soft); cursor: pointer; user-select: none;
	padding: 6px 12px; border-radius: 999px;
	background: var(--card); border: 1px solid var(--line);
	transition: all .18s;
}
.km-pill .sw { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.km-pill:hover { border-color: var(--line-strong); color: var(--ink); }
.km-pill.on { background: var(--line-strong); border-color: var(--line-strong); color: var(--ink); }
.km-pill.off { opacity: .55; }
.km-pill.off .sw { background: transparent !important; }
.km-iconbtn {
	width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;
	font-size: .95rem; cursor: pointer; color: var(--ink-soft);
	background: var(--card); border: 1px solid var(--line); border-radius: 999px; transition: all .18s;
}
.km-iconbtn:hover { color: var(--ink); border-color: var(--line-strong); }

/* search */
.km-search-wrap { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); z-index: 7; width: min(520px, 62%); }
.km-search {
	width: 100%; padding: 11px 40px 11px 42px; font-size: .92rem;
	background: var(--card); color: var(--ink);
	border: 1px solid var(--line-strong); border-radius: 999px;
	backdrop-filter: blur(12px); outline: none; box-shadow: var(--shadow);
	transition: border-color .18s, box-shadow .18s;
}
.km-search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--glow), var(--shadow); }
.km-search-ic {
	position: absolute; left: 15px; top: 50%; transform: translateY(-50%);
	width: 15px; height: 15px; color: var(--ink-mute); pointer-events: none;
}
.km-search-kbd {
	position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
	font-size: .62rem; color: var(--ink-mute); border: 1px solid var(--line); border-radius: 5px; padding: 1px 6px; pointer-events: none;
}
.km-results {
	position: absolute; top: 62px; left: 50%; transform: translateX(-50%);
	z-index: 8; width: min(520px, 100%);
	background: var(--card); border: 1px solid var(--line); border-radius: 16px;
	box-shadow: var(--shadow); backdrop-filter: blur(16px); overflow: hidden;
	display: none; max-height: min(62vh, 540px);
}
.km-results.show { display: block; }
.km-results .rs-head { padding: 11px 14px 7px; font-size: .76rem; color: var(--ink-soft); border-bottom: 1px solid var(--line); }
.km-results .rs-body { overflow-y: auto; max-height: calc(min(62vh, 540px) - 40px); }
.km-results .rs-item {
	display: flex; gap: 10px; padding: 10px 14px; cursor: pointer; border-bottom: 1px solid var(--line);
	transition: background .15s;
}
.km-results .rs-item:last-child { border-bottom: 0; }
.km-results .rs-item:hover, .km-results .rs-item.hot { background: var(--glow); }
.km-results .rs-ic {
	width: 30px; height: 30px; flex: 0 0 30px; border-radius: 9px;
	display: flex; align-items: center; justify-content: center; font-size: 15px;
	background: rgba(255,255,255,.06);
}
.km-results .rs-t { font-size: .84rem; font-weight: 600; color: var(--ink); }
.km-results .rs-p { font-size: .64rem; color: var(--ink-mute); text-transform: uppercase; letter-spacing: .08em; margin-top: 1px; }
.km-results .rs-s { font-size: .74rem; color: var(--ink-soft); line-height: 1.45; margin-top: 3px; }
.km-results .rs-n { font-size: .62rem; color: var(--accent); border: 1px solid var(--accent); border-radius: 999px; padding: 0 6px; margin-left: 5px; }
.km-results mark { background: rgba(251,191,36,.35); color: var(--ink); border-radius: 3px; padding: 0 2px; }
.km-results .rs-empty { padding: 24px 16px; text-align: center; color: var(--ink-mute); font-size: .82rem; }

/* hint */
.km-hint { position: absolute; bottom: 12px; left: 14px; z-index: 5; font-size: .7rem; color: var(--ink-mute); display: flex; gap: 14px; align-items: center; }
.km-hint kbd { border: 1px solid var(--line); border-radius: 5px; padding: 1px 5px; font-size: .62rem; }

/* detail card */
.km-detail {
	position: absolute; top: 0; right: 0; bottom: 0; z-index: 9; width: 380px;
	background: var(--card-solid); border-left: 1px solid var(--line);
	box-shadow: -24px 0 70px rgba(0,0,0,.4);
	transform: translateX(104%); transition: transform .28s cubic-bezier(.2,.8,.25,1);
	display: flex; flex-direction: column; overflow: hidden;
}
.km-detail.show { transform: translateX(0); }
.km-detail-head { position: relative; padding: 20px 20px 14px; color: #fff; }
.km-detail-head::after { content: ""; position: absolute; inset: 0; background: linear-gradient(160deg, var(--dh-c, #6366f1), rgba(10,15,31,.96) 78%); }
.km-detail-head > * { position: relative; z-index: 1; }
.km-detail-head .dh-icon { font-size: 26px; margin-bottom: 4px; }
.km-detail-head .dh-part { font-size: .64rem; letter-spacing: .16em; text-transform: uppercase; opacity: .8; }
.km-detail-head h2 { margin: 2px 0 4px; font-size: 1.35rem; line-height: 1.2; letter-spacing: -.01em; }
.km-detail-head .dh-x {
	position: absolute; top: 12px; right: 12px; z-index: 2; width: 30px; height: 30px;
	border: 0; border-radius: 999px; background: rgba(255,255,255,.14); color: #fff;
	font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.km-detail-head .dh-x:hover { background: rgba(255,255,255,.28); }
.km-detail-body { flex: 1; overflow-y: auto; padding: 16px 20px 22px; font-size: .86rem; color: var(--ink-soft); line-height: 1.6; }
.km-detail-body .ds-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.km-detail-body .ds-chip { font-size: .68rem; padding: 3px 9px; border-radius: 999px; border: 1px solid var(--line); color: var(--ink-soft); }
.km-detail-body .ds-desc { margin-bottom: 14px; }
.km-detail-body .ds-sec { font-size: .66rem; text-transform: uppercase; letter-spacing: .16em; color: var(--ink-mute); margin: 18px 0 8px; display: flex; align-items: center; gap: 8px; }
.km-detail-body .ds-sec::after { content: ""; flex: 1; height: 1px; background: var(--line); }
.km-tag {
	display: inline-block; font-size: .7rem; padding: 3px 9px; margin: 2px 3px 2px 0;
	border-radius: 999px; border: 1px solid var(--line); color: var(--ink-soft); background: var(--glow);
}
.km-conn { display: flex; align-items: flex-start; gap: 9px; padding: 7px 0; border-bottom: 1px dashed var(--line); }
.km-conn:last-child { border-bottom: 0; }
.km-conn .cc-dot { width: 9px; height: 9px; border-radius: 50%; flex: 0 0 auto; margin-top: 5px; }
.km-conn .cc-main { min-width: 0; }
.km-conn .cc-name { font-weight: 600; color: var(--ink); font-size: .84rem; }
.km-conn .cc-name:hover { color: var(--accent); }
.km-conn .cc-why { font-size: .7rem; color: var(--ink-mute); margin-top: 1px; }
.km-sec-link { display: block; padding: 4px 0; font-size: .78rem; color: var(--ink-soft); }
.km-sec-link:hover { color: var(--accent); }
.km-open {
	display: inline-flex; align-items: center; gap: 8px; margin-top: 16px;
	padding: 10px 16px; border-radius: 12px; font-size: .84rem; font-weight: 600; color: #fff;
	background: linear-gradient(120deg, var(--dh-c, #6366f1), var(--dh-c2, #8b5cf6));
	box-shadow: 0 8px 24px rgba(0,0,0,.35); transition: transform .15s;
}
.km-open:hover { transform: translateY(-1px); }

/* timeline */
.km-timeline {
	position: relative; height: 58px; border: 1px solid var(--line); border-radius: 14px;
	background: var(--card); overflow: hidden; flex: 0 0 auto;
}
.km-timeline .tl-rail { position: absolute; left: 0; right: 0; top: 50%; height: 2px; transform: translateY(-50%); background: var(--line); }
.km-timeline .tl-dot {
	position: absolute; top: 50%; width: 12px; height: 12px; border-radius: 50%;
	border: 2px solid var(--card-solid); transform: translate(-50%, -50%);
	cursor: pointer; transition: transform .15s, box-shadow .15s; z-index: 2;
}
.km-timeline .tl-dot:hover { transform: translate(-50%, -50%) scale(1.45); box-shadow: 0 0 12px currentColor; }
.km-timeline .tl-dot.on { transform: translate(-50%, -50%) scale(1.3); box-shadow: 0 0 0 3px var(--glow); }
.km-timeline .tl-part {
	position: absolute; top: 2px; font-size: .58rem; letter-spacing: .14em; text-transform: uppercase;
	color: var(--ink-mute); transform: translateX(-50%); z-index: 1; white-space: nowrap;
}
.km-timeline .tl-part .sw { width: 7px; height: 7px; border-radius: 50%; display: inline-block; margin-right: 5px; }

/* ── universe (concept) view ── */
.km-switch { display: inline-flex; align-items: center; background: var(--card); border: 1px solid var(--line); border-radius: 999px; padding: 3px; gap: 2px; }
.km-sw { font-size: .74rem; color: var(--ink-mute); cursor: pointer; padding: 5px 12px; border-radius: 999px; border: 0; background: transparent; transition: color .18s, background .18s; }
.km-sw.on { background: var(--line-strong); color: var(--ink); }
.km-focus {
	position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); z-index: 6;
	display: flex; align-items: center; gap: 7px; white-space: nowrap;
	font-size: .7rem; color: var(--ink-soft); background: var(--card); border: 1px solid var(--line);
	padding: 7px 14px; border-radius: 999px; backdrop-filter: blur(10px); pointer-events: none;
}
.km-focus b { color: var(--ink); }
#km-canvas.draggable { cursor: grab; }
#km-canvas.draggable.drag { cursor: grabbing; }
.km-mod-row { display: flex; align-items: center; gap: 9px; padding: 6px 8px; margin: 0 -8px; border-radius: 10px; cursor: pointer; }
.km-mod-row:hover { background: var(--glow); }
.km-mod-row .m-dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; }
.km-mod-row .m-t { font-weight: 600; color: var(--ink); font-size: .82rem; }
.km-neigh { cursor: pointer; }
.km-neigh:hover { border-color: var(--line-strong); color: var(--ink); }

@media (max-width: 900px) {
	.km-detail { width: 100%; }
	.km-search-wrap { width: calc(100% - 190px); left: 12px; transform: none; }
	.km-controls { max-width: 170px; }
	.km-legend { display: none; }
}
</style>
</head>
<body>

<div class="km-hero">
	<div class="km-eyebrow">Interactive course map</div>
	<h1 class="km-title">The Web of <span class="of">Knowledge</span></h1>
	<p class="km-sub">The <b>Universe</b> view puts every concept of the course on a Poincaré disk: the most-used ideas shine biggest, and you can shift the focal point to zoom into any neighbourhood. Switch to the <b>Course</b> view to walk the seven parts module by module.</p>
	<div class="km-stats">
		<div class="km-stat"><b id="st-modules">, </b> modules</div>
		<div class="km-stat"><b id="st-edges">, </b> connections</div>
		<div class="km-stat"><b id="st-citations">, </b> citations</div>
		<div class="km-stat"><b id="st-concepts">, </b> concepts tracked</div>
	</div>
</div>

<div class="km-stage">
	<div class="km-canvas" id="km-canvas">
		<div class="km-lane-label" id="km-lane-labels" style="display:none"></div>

		<div class="km-legend" id="km-legend"></div>

		<div class="km-controls">
			<div class="km-switch" id="km-switch">
				<button class="km-sw on" data-view="universe">✦ Universe</button>
				<button class="km-sw" data-view="course">Course</button>
			</div>
			<div id="km-pills"></div>
			<button class="km-iconbtn" id="km-theme" title="Toggle theme">◐</button>
		</div>

		<div class="km-search-wrap">
			<svg class="km-search-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
			<input type="text" id="km-search" class="km-search" placeholder="Search every module, section and citation…" spellcheck="false" autocomplete="off">
			<span class="km-search-kbd" id="km-kbd">Ctrl K</span>
		</div>

		<div class="km-results" id="km-results"></div>
		<div class="km-hint" id="km-hint"><span>click a star to make it the focus</span><span>scroll to zoom</span><span><kbd>Esc</kbd> close</span></div>
		<div class="km-focus" id="km-focus" style="display:none"></div>

		<div id="km-chart"></div>

		<div class="km-detail" id="km-detail"></div>
	</div>

	<div class="km-timeline" id="km-timeline"></div>
</div>

<script src="echarts.min.js"></script>
<script>
window.KM_DATA = <?php echo json_encode($KM, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>;
</script>
<script>
(function() {
	'use strict';

	var DATA = window.KM_DATA;
	var NODES = DATA.nodes, EDGES = DATA.edges, PARTS = DATA.parts, COLORS = DATA.colors, CONCEPTS = DATA.concepts, PATH = DATA.path;
	var nodeMap = {};
	NODES.forEach(function(n) { nodeMap[n.id] = n; });

	var chart = echarts.init(document.getElementById('km-chart'));
	var canvas = document.getElementById('km-canvas');
	var state = { edgeOn: { citation: true, concept: true, path: true }, query: '', resultSet: null, highlight: null, view: 'course', univEdges: true, uFocus: null };

	/* stats */
	document.getElementById('st-modules').textContent = DATA.stats.modules;
	document.getElementById('st-edges').textContent = DATA.stats.edges;
	document.getElementById('st-citations').textContent = DATA.stats.citations;
	document.getElementById('st-concepts').textContent = DATA.stats.concepts;

	/* ── color helpers ── */
	function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
	function mix(h1, h2, t) { var a = hex2rgb(h1), b = hex2rgb(h2); return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')'; }
	function lighten(h, t) { return mix(h, '#ffffff', t); }

	/* ── layout: seven lanes, one per part, course order flows left→right ── */
	function layout(w, h) {
		var L = 96, top = 56, bottom = 40;
		var laneH = (h - top - bottom) / 7;
		var usable = w - L - 30;
		var groups = [];
		for (var p = 0; p < 7; p++) {
			groups[p] = NODES.filter(function(n) { return n.part === p; })
				.sort(function(a, b) { return a.order - b.order || (a.id < b.id ? -1 : 1); });
		}
		var jitter = [-11, 0, 11, 5, -5, 9, -8];
		for (var p = 0; p < groups.length; p++) {
			var arr = groups[p], laneY = top + (p + 0.5) * laneH;
			var span = usable - 26;
			arr.forEach(function(m, i) {
				m._x = L + 15 + (i + 0.5) * (span / Math.max(1, arr.length));
				m._y = laneY + jitter[m.orderIndex % jitter.length];
			});
		}
		return { L: L, top: top, laneH: laneH, groups: groups };
	}

	function nodeRadius(n) { return 16 + Math.min(13, n.degree * 0.3); }

	/* ── edge styles ── */
	function edgeStyle(e) {
		if (e.type === 'citation') return { color: '#34d399', width: 1.6, opacity: 0.6, type: 'dashed', curveness: 0.16 };
		return { color: '#fbbf24', width: 1.05, opacity: 0.24, curveness: 0.13 };
	}

	/* ── build the ECharts option ── */
	function buildOption(w, h) {
		var geo = layout(w, h);

		var visibleEdges = EDGES.filter(function(e) { return state.edgeOn[e.type]; });
		var highlight = state.highlight;
		var near = null;
		if (highlight) {
			near = {};
			near[highlight] = true;
			visibleEdges.forEach(function(e) { if (e.a === highlight) near[e.b] = true; if (e.b === highlight) near[e.a] = true; });
		}
		var querying = state.query.length > 0;

		var nodes = NODES.map(function(n) {
			var r = nodeRadius(n);
			var c = COLORS[n.part] || '#94a3b8';
			var op = 1;
			if (querying) { var mq = state.resultSet && state.resultSet.has(n.id); if (!mq) op = 0.06; }
			if (highlight && !near[n.id]) op = Math.min(op, 0.07);
			return {
				id: n.id, name: n.name, title: n.title, icon: n.icon, part: n.part, url: n.url,
				concepts: n.concepts, value: n.degree,
				x: n._x, y: n._y, symbolSize: r, draggable: false,
				itemStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: lighten(c, 0.3) }, { offset: 1, color: c }
					]),
					opacity: op,
					shadowBlur: (highlight && near[n.id]) ? 26 : 9,
					shadowColor: c,
					borderColor: lighten(c, 0.55),
					borderWidth: 1.3
				},
				label: {
					show: op > 0.25,
					position: (n.orderIndex % 2 === 0) ? 'bottom' : 'top',
					formatter: function() { return '{i|' + n.icon + '} {n|' + n.name.replace(/_/g, ' ') + '}'; },
					rich: { i: { fontSize: 11.5, color: '#fff', opacity: 0.92 }, n: { fontSize: 10, fontWeight: 600, color: lighten(c, 0.5) } }
				}
			};
		});

		var links = visibleEdges.map(function(e) {
			var st = edgeStyle(e);
			if (querying) {
				var m = (state.resultSet && (state.resultSet.has(e.a) || state.resultSet.has(e.b)));
				if (!m) st.opacity *= 0.15;
			}
			if (highlight) {
				var t = (e.a === highlight || e.b === highlight);
				if (!t) st.opacity *= 0.12; else st.width = Math.max(st.width, 2);
			}
			return {
				source: e.a, target: e.b, value: e.weight, type: e.type,
				citeText: e.citeText || '', conceptText: e.conceptText || '',
				lineStyle: st
			};
		});

		var option = {
			animationDuration: 650,
			animationEasing: 'cubicOut',
			backgroundColor: 'transparent',
			grid: { left: 0, right: 0, top: 0, bottom: 0 },
			xAxis: { min: 0, max: w, show: false },
			yAxis: { min: 0, max: h, show: false },
			tooltip: {
				confine: true,
				backgroundColor: 'rgba(16,22,45,.96)',
				borderColor: 'rgba(150,170,230,.35)',
				borderWidth: 1,
				padding: [10, 13],
				textStyle: { color: '#e9eeff', fontSize: 12 },
				extraCssText: 'box-shadow:0 16px 40px rgba(0,0,0,.5);border-radius:12px;',
				formatter: function(params) {
					if (params.dataType === 'edge') {
						var e = params.data;
						var from = nodeMap[e.source], to = nodeMap[e.target];
						var why = '';
						if (e.type === 'citation') why = 'shared citations: <b>' + escHtml(e.citeText) + '</b>';
						else if (e.type === 'concept') why = 'shared concepts: <b>' + escHtml(e.conceptText) + '</b>';
						else why = 'learning path';
						return '<b style="font-size:12.5px">' + escHtml(from.title) + '</b> ↔ <b style="font-size:12.5px">' + escHtml(to.title) + '</b>' +
							'<br><span style="font-size:11px;opacity:.75">' + why + '</span>';
					}
					var n = params.data;
					var desc = (n.description || '').slice(0, 170);
					return '<b style="font-size:13px">' + n.icon + ' ' + escHtml(n.title) + '</b>' +
						'<br><span style="font-size:11px;opacity:.7">Part ' + n.part + ' · ' + n.degree + ' connections</span>' +
						(desc ? '<br><span style="font-size:11px;opacity:.85;color:#c6d2f5">' + escHtml(desc) + '</span>' : '') +
						'<br><span style="font-size:10px;opacity:.55">click to open</span>';
				}
			},
			series: []
		};

		/* the journey path: a flowing line with a travelling light */
		if (state.edgeOn.path) {
			var points = PATH.map(function(id) { var n = nodeMap[id]; return [n._x, h - n._y]; });
			var stops = [], curPart = null, i = 0, total = points.length;
			for (i = 0; i < total; i++) {
				var pp = nodeMap[PATH[i]].part;
				if (pp !== curPart) { if (curPart !== null) stops.push({ offset: i / total, color: COLORS[curPart] }); curPart = pp; }
			}
			stops.push({ offset: 1, color: COLORS[curPart] });
			option.series.push({
				type: 'lines',
				coordinateSystem: 'cartesian2d',
				z: 2,
				polyline: true,
				silent: true,
				emphasis: { disabled: true },
				blur: { lineStyle: { opacity: 0.5 } },
				data: [{
					coords: points,
					lineStyle: {
						width: 2.5, opacity: 0.55,
						color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: stops }
					},
					effect: { show: true, period: 8, trailLength: 0.4, symbol: 'circle', symbolSize: 5, color: '#ffffff' }
				}]
			});
		}

		option.series.push({
			type: 'graph',
			layout: 'none',
			roam: false,
			z: 4,
			data: nodes,
			links: links,
			lineStyle: { width: 1.3 },
			emphasis: {
				focus: 'adjacency',
				itemStyle: { shadowBlur: 30 },
				lineStyle: { width: 2.4, opacity: 0.95 }
			},
			blur: { itemStyle: { opacity: 0.1 }, lineStyle: { opacity: 0.04 }, label: { opacity: 0.25 } }
		});

		return option;
	}

	var rebuildTimer = null;
	function rebuild(animate) {
		clearTimeout(rebuildTimer);
		rebuildTimer = setTimeout(function() {
			var opt = state.view === 'universe'
				? buildUniverseOption(chart.getWidth(), chart.getHeight())
				: buildOption(chart.getWidth(), chart.getHeight());
			chart.setOption(opt, { notMerge: true, lazyUpdate: true });
		}, animate === false ? 0 : 30);
	}

	/* ── lane labels + glows ── */
	function renderLaneDecor() {
		var w = chart.getWidth(), h = chart.getHeight();
		var geo = layout(w, h);
		canvas.querySelectorAll('.km-lane-glow').forEach(function(el) { el.remove(); });
		var labelsEl = document.getElementById('km-lane-labels');
		labelsEl.innerHTML = '';
		labelsEl.style.display = 'block';
		for (var p = 0; p < 7; p++) {
			var g = document.createElement('div');
			g.className = 'km-lane-glow';
			g.style.top = (geo.top + (p + 0.5) * geo.laneH - 46) + 'px';
			g.style.background = 'radial-gradient(ellipse at center, ' + COLORS[p] + ', transparent 70%)';
			canvas.appendChild(g);
			var lab = document.createElement('div');
			lab.className = 'km-lane-label';
			lab.style.top = (geo.top + (p + 0.5) * geo.laneH) + 'px';
			lab.innerHTML = '<span class="sw" style="background:' + COLORS[p] + '"></span>' + escHtml('P' + p + ' · ' + PARTS[p]);
			labelsEl.appendChild(lab);
		}
	}

	/* ── controls (built per view in the universe block) ── */
	document.getElementById('km-theme').addEventListener('click', function() {
		var t = document.documentElement.classList.contains('light') ? 'dark' : 'light';
		window.__kmSetTheme(t);
	});

	/* ── detail card ── */
	var detailEl = document.getElementById('km-detail');
	function openDetail(n) {
		state.highlight = n.id;
		var c = COLORS[n.part] || '#6366f1';
		var conns = [];
		EDGES.forEach(function(e) {
			if (e.a === n.id) conns.push({ other: nodeMap[e.b], e: e });
			else if (e.b === n.id) conns.push({ other: nodeMap[e.a], e: e });
		});
		var rank = { citation: 0, link: 1, concept: 2, course: 3 };
		conns.sort(function(x, y) {
			var r = (rank[x.e.type] || 9) - (rank[y.e.type] || 9);
			return r !== 0 ? r : y.e.weight - x.e.weight;
		});
		var seen = {}, uniq = [];
		conns.forEach(function(cx) { var k = cx.e.type + '|' + cx.other.id; if (!seen[k]) { seen[k] = true; uniq.push(cx); } });
		var ci = 0, cc = 0, wc = 0;
		Object.keys(n.citations || {}).forEach(function() { ci++; });
		Object.keys(n.concepts || {}).forEach(function() { cc++; });
		if (n.wordCount) wc = n.wordCount;

		var conceptArr = Object.keys(n.concepts || {}).sort(function(a, b) { return n.concepts[b] - n.concepts[a]; }).slice(0, 14);

		var html = '<div class="km-detail-head" style="--dh-c:' + c + ';--dh-c2:' + lighten(c, -0.35) + '">' +
			'<button class="dh-x" id="km-detail-x">✕</button>' +
			'<div class="dh-part">Part ' + n.part + ' · ' + escHtml(PARTS[n.part]) + '</div>' +
			'<div class="dh-icon">' + n.icon + '</div>' +
			'<h2>' + escHtml(n.title) + '</h2>' +
			'</div>' +
			'<div class="km-detail-body">' +
			'<div class="ds-meta">' +
			'<span class="ds-chip">' + n.name + '</span>' +
			'<span class="ds-chip">' + wc.toLocaleString() + ' words</span>' +
			'<span class="ds-chip">' + uniq.length + ' connections</span>' +
			'<span class="ds-chip">' + ci + ' citations</span>' +
			'<span class="ds-chip">' + cc + ' concepts</span>' +
			'</div>';

		if (n.description) html += '<div class="ds-desc">' + escHtml(n.description) + '</div>';

		if (conceptArr.length) {
			html += '<div class="ds-sec">Concept profile</div><div>';
			conceptArr.forEach(function(k) { html += '<span class="km-tag">' + escHtml(k) + '</span>'; });
			html += '</div>';
		}

		/* neighbours in the journey */
		var pathNeighbors = [];
		var pi = PATH.indexOf(n.id);
		if (pi > 0) pathNeighbors.push({ rel: 'came from', other: nodeMap[PATH[pi - 1]] });
		if (pi > -1 && pi < PATH.length - 1) pathNeighbors.push({ rel: 'leads to', other: nodeMap[PATH[pi + 1]] });

		html += '<div class="ds-sec">Connections</div>';
		var edgeDot = { citation: '#34d399', concept: '#fbbf24', course: '#ffffff' };
		var edgeLabel = { citation: 'shared citation', concept: 'shared concepts', course: 'learning path' };
		uniq.slice(0, 14).forEach(function(cx) {
			var e = cx.e, o = cx.other;
			var why = [];
			if (e.type === 'citation' && e.citeText) why.push('cites: ' + e.citeText);
			if (e.type === 'concept' && e.conceptText) why.push(e.conceptText);
			if (e.type === 'course') why.push('next in the journey');
			html += '<div class="km-conn">' +
				'<span class="cc-dot" style="background:' + (edgeDot[e.type] || '#94a3b8') + '"></span>' +
				'<div class="cc-main">' +
				'<a class="cc-name" data-slug="' + escAttr(o.id) + '" href="#">' + o.icon + ' ' + escHtml(o.title) + '</a>' +
				'<div class="cc-why">' + edgeLabel[e.type] + (why.length ? ' · ' + escHtml(why.join(', ')) : '') + '</div>' +
				'</div></div>';
		});
		if (uniq.length > 14) html += '<div class="cc-why" style="padding:6px 0 2px;color:var(--ink-mute)">+ ' + (uniq.length - 14) + ' more on the map</div>';

		if (pathNeighbors.length) {
			html += '<div class="ds-sec">In the journey</div>';
			pathNeighbors.forEach(function(pn) {
				html += '<div class="km-conn"><span class="cc-dot" style="background:#fff"></span>' +
					'<div class="cc-main"><span class="cc-why" style="color:var(--ink-mute)">' + pn.rel + '</span><br>' +
					'<a class="cc-name" data-slug="' + escAttr(pn.other.id) + '" href="#">' + pn.other.icon + ' ' + escHtml(pn.other.title) + '</a></div></div>';
			});
		}

		if (n.citations && Object.keys(n.citations).length) {
			html += '<div class="ds-sec">Cited sources</div>';
			Object.keys(n.citations).forEach(function(k) { html += '<span class="km-tag">' + escHtml(k) + '</span>'; });
		}

		if (n.headings && n.headings.length) {
			html += '<div class="ds-sec">Sections</div>';
			n.headings.slice(0, 10).forEach(function(hh) {
				html += '<a class="km-sec-link" href="' + escAttr(n.url + '#' + hh.slug) + '">↳ ' + escHtml(hh.text) + '</a>';
			});
			if (n.headings.length > 10) html += '<div class="cc-why" style="color:var(--ink-mute)">+ ' + (n.headings.length - 10) + ' more sections in the module</div>';
		}

		html += '<a class="km-open" href="' + escAttr(n.url) + '" style="--dh-c:' + c + '">Open module ↗</a>' +
			'</div>';

		detailEl.innerHTML = html;
		detailEl.classList.add('show');

		detailEl.querySelectorAll('a[data-slug]').forEach(function(a) {
			a.addEventListener('click', function(ev) {
				ev.preventDefault();
				var o = nodeMap[a.dataset.slug];
				if (o) { openDetail(o); rebuild(false); }
			});
			a.addEventListener('mouseenter', function() { state.highlight = a.dataset.slug; rebuild(false); });
			a.addEventListener('mouseleave', function() { state.highlight = n.id; rebuild(false); });
		});
		document.getElementById('km-detail-x').addEventListener('click', closeDetail);
	}
	function closeDetail() {
		detailEl.classList.remove('show');
		state.highlight = null;
		rebuild(false);
	}
	chart.on('click', function(params) {
		if (cDrag.moved) { cDrag.moved = false; return; }
		if (state.view === 'universe') {
			if (params.dataType === 'node' && params.data && cIdX[params.data.name] != null) {
				var c = cNodes[cIdX[params.data.name]];
				flyTo(c.bx, c.by, c.name);
				openConcept(c);
			}
			return;
		}
		if (params.dataType === 'node' && params.data && nodeMap[params.data.id]) openDetail(nodeMap[params.data.id]);
	});

	/* ── timeline ── */
	function buildTimeline() {
		var tl = document.getElementById('km-timeline');
		tl.innerHTML = '<div class="tl-rail"></div>';
		var N = PATH.length, W = tl.clientWidth - 40, left = 20;
		var groupStart = {};
		var curPart = null, firstIdx = 0;
		PATH.forEach(function(id, i) {
			var p = nodeMap[id].part;
			if (p !== curPart) { curPart = p; groupStart[p] = i; }
			var x = left + (i / (N - 1)) * W;
			var dot = document.createElement('div');
			dot.className = 'tl-dot';
			dot.style.left = x + 'px';
			dot.style.background = COLORS[p];
			dot.style.color = COLORS[p];
			dot.title = nodeMap[id].title;
			dot.dataset.slug = id;
			tl.appendChild(dot);
		});
		Object.keys(groupStart).forEach(function(p) {
			var i = groupStart[p];
			var x = left + (i / (N - 1)) * W;
			var lab = document.createElement('div');
			lab.className = 'tl-part';
			lab.style.left = x + 'px';
			lab.innerHTML = '<span class="sw" style="background:' + COLORS[p] + '"></span>' + escHtml('P' + p + ' ' + PARTS[p]);
			tl.appendChild(lab);
		});
		tl.querySelectorAll('.tl-dot').forEach(function(dot) {
			dot.addEventListener('mouseenter', function() { state.highlight = dot.dataset.slug; rebuild(false); });
			dot.addEventListener('mouseleave', function() { state.highlight = null; rebuild(false); });
			dot.addEventListener('click', function() { openDetail(nodeMap[dot.dataset.slug]); });
		});
	}
	buildTimeline();

	/* ── search ── */
	var searchInput = document.getElementById('km-search');
	var resultsEl = document.getElementById('km-results');
	var searchTimer = null, searchAbort = null, resultsCache = {};
	var lastQuery = '';

	function doSearch(q) {
		var key = q;
		if (resultsCache[key]) { applyResults(key, resultsCache[key]); return; }
		if (searchAbort) searchAbort.abort();
		searchAbort = new AbortController();
		fetch('search.php?q=' + encodeURIComponent(q), { signal: searchAbort.signal })
			.then(function(r) { return r.json(); })
			.then(function(data) { resultsCache[key] = data; if (key === searchInput.value.trim()) applyResults(key, data); })
			.catch(function() {});
	}

	function applyResults(key, data) {
		if (key !== searchInput.value.trim()) return;
		var grouped = data.grouped || [];
		state.resultSet = new Set(grouped.map(function(g) { return g.page; }));
		var items = (data.results && data.results.length > 0 && grouped.length === 0) ? data.results : grouped;
		renderResults(key, data, items);
		rebuild(false);
	}

	function renderResults(query, data, items) {
		var mode = data.mode || 'normal';
		var html = '<div class="rs-head">' + (data.total || 0) + ' matches · ' + items.length + ' module' + (items.length === 1 ? '' : 's') + ' for <b>' + escHtml(query) + '</b></div>';
		if (!items.length) {
			html += '<div class="rs-empty">Nothing found. Try fewer words, or <code>~fuzzy</code> / <code>/regex/</code>.</div>';
			resultsEl.innerHTML = html;
			resultsEl.classList.add('show');
			return;
		}
		html += '<div class="rs-body">';
		items.forEach(function(r, i) {
			var page = r.page || '';
			var n = nodeMap[page];
			html += '<div class="rs-item" data-slug="' + escAttr(page) + '" data-i="' + i + '">' +
				'<div class="rs-ic">' + (n ? n.icon : '📄') + '</div>' +
				'<div><div class="rs-t">' + escHtml(r.title) + (r.count > 1 ? ' <span class="rs-n">' + r.count + '</span>' : '') + '</div>' +
				'<div class="rs-p">' + escHtml(page) + '</div>' +
				'<div class="rs-s">' + highlight(escHtml(r.snippet || ''), query, mode) + '</div></div></div>';
		});
		html += '</div>';
		resultsEl.innerHTML = html;
		resultsEl.classList.add('show');

		resultsEl.querySelectorAll('.rs-item').forEach(function(el) {
			el.addEventListener('mouseenter', function() {
				resultsEl.querySelectorAll('.rs-item').forEach(function(x) { x.classList.remove('hot'); });
				el.classList.add('hot');
				state.highlight = el.dataset.slug;
				rebuild(false);
			});
			el.addEventListener('mouseleave', function() {
				el.classList.remove('hot');
				state.highlight = null;
				rebuild(false);
			});
			el.addEventListener('click', function() {
				var r2 = items[parseInt(el.dataset.i, 10)];
				if (r2 && nodeMap[r2.page]) openDetail(nodeMap[r2.page]);
			});
		});
	}

	function highlight(text, query, mode) {
		if (!query || mode === 'fuzzy') return text;
		var escaped = (mode === 'regex' ? query.replace(/^\/(.+)\/$/, '$1') : query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		if (!escaped) return text;
		return text.replace(new RegExp('(' + escaped + ')', 'gi'), '<mark>$1</mark>');
	}

	searchInput.addEventListener('input', function() {
		var q = searchInput.value.trim();
		clearTimeout(searchTimer);
		lastQuery = q;
		if (q.length < 2) {
			state.query = '';
			state.resultSet = null;
			state.highlight = null;
			resultsEl.classList.remove('show');
			if (searchAbort) { searchAbort.abort(); searchAbort = null; }
			rebuild(false);
			return;
		}
		state.query = q;
		rebuild(false);
		searchTimer = setTimeout(function() { doSearch(q); }, 220);
	});
	searchInput.addEventListener('focus', function() { if (state.query) resultsEl.classList.add('show'); });

	/* ── keyboard ── */
	document.addEventListener('keydown', function(e) {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchInput.focus(); searchInput.select(); }
		if (e.key === 'Escape') {
			if (detailEl.classList.contains('show')) { closeDetail(); return; }
			searchInput.value = ''; searchInput.dispatchEvent(new Event('input'));
			searchInput.blur();
		}
	});

	/* ═══════════════════════════════════════════════════════════
	   UNIVERSE VIEW — concepts as stars, Poincaré focus navigation
	   ═══════════════════════════════════════════════════════════ */
	var cNodes = [], cEdges = [], cIdX = {}, R_disp = 300;
	var focus = { x: 0, y: 0 }, strength = 2.6, focusName = null;
	var cDrag = { active: false, moved: false };
	var animId = null;

	function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

	function buildConceptGraph() {
		var freq = {}, partCnt = {}, hitSum = {};
		NODES.forEach(function(n) {
			var cs = n.concepts || {};
			Object.keys(cs).forEach(function(k) {
				freq[k] = (freq[k] || 0) + 1;
				hitSum[k] = (hitSum[k] || 0) + cs[k];
				if (!partCnt[k]) partCnt[k] = {};
				partCnt[k][n.part] = (partCnt[k][n.part] || 0) + cs[k];
			});
		});

		var co = {};
		NODES.forEach(function(n) {
			var cs = Object.keys(n.concepts || {});
			for (var i = 0; i < cs.length; i++) for (var j = i + 1; j < cs.length; j++) {
				var a = cs[i], b = cs[j];
				if (a > b) { var t = a; a = b; b = t; }
				co[a + '|' + b] = (co[a + '|' + b] || 0) + 1;
			}
		});
		var list = [];
		Object.keys(co).forEach(function(k) { if (co[k] >= 4) list.push({ k: k, w: co[k] }); });
		list.sort(function(a, b) { return b.w - a.w; });
		var deg = {}, picked = [];
		list.forEach(function(l) {
			var ab = l.k.split('|');
			if ((deg[ab[0]] || 0) < 8 && (deg[ab[1]] || 0) < 8) {
				picked.push({ a: ab[0], b: ab[1], w: l.w });
				deg[ab[0]] = (deg[ab[0]] || 0) + 1; deg[ab[1]] = (deg[ab[1]] || 0) + 1;
			}
		});
		cEdges = picked;

		/* importance: how central the concept is to the blog overall
		   · freq  = number of modules that mention it (breadth)
		   · hits  = sum of keyword matches (depth of coverage)
		   · deg   = strong ties in the concept co-occurrence graph (centrality) */
		cNodes = Object.keys(freq).map(function(k) {
			var pc = partCnt[k], best = 0, bp = 0;
			Object.keys(pc).forEach(function(pp) { if (pc[pp] > best) { best = pc[pp]; bp = +pp; } });
			var f = freq[k], h = hitSum[k], d = deg[k] || 0;
			return {
				name: k,
				freq: f,
				hits: h,
				degree: d,
				importance: f * 0.85 + h * 0.18 + d * 1.4,
				part: bp
			};
		});
		cNodes.sort(function(a, b) { return b.importance - a.importance; });
		cIdX = {};
		cNodes.forEach(function(c, i) { cIdX[c.name] = i; });

		forceLayout();
		focusName = cNodes[0].name;
		focus.x = cNodes[0].bx; focus.y = cNodes[0].by;
	}

	/* deterministic, name-derived hue so every concept gets its own color */
	function conceptHue(name) {
		var h = 0;
		for (var i = 0; i < name.length; i++) {
			h = ((h << 5) - h) + name.charCodeAt(i);
			h |= 0;
		}
		return ((h % 360) + 360) % 360;
	}
	function conceptColor(name, l, s) {
		return 'hsl(' + conceptHue(name) + ',' + (s != null ? s : 70) + '%,' + (l != null ? l : 56) + '%)';
	}

	function forceLayout() {
		var n = cNodes.length, i, j, k;
		var s = 42;
		var rng = function() { s = (s * 16807) % 2147483647; return s / 2147483647; };
		for (i = 0; i < n; i++) {
			var r = Math.sqrt(rng()) * 0.85, th = rng() * Math.PI * 2;
			cNodes[i].bx = r * Math.cos(th); cNodes[i].by = r * Math.sin(th);
			cNodes[i].vx = 0; cNodes[i].vy = 0;
		}
		var L = 0.26, rep = 0.0032, spr = 0.09, damp = 0.55, cl = 0.055;
		for (k = 0; k < 650; k++) {
			for (i = 0; i < n; i++) { cNodes[i].fx = 0; cNodes[i].fy = 0; }
			for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
				var a = cNodes[i], b = cNodes[j];
				var dx = b.bx - a.bx, dy = b.by - a.by;
				var d2 = dx * dx + dy * dy + 1e-7, d = Math.sqrt(d2);
				var f = rep * L * L / d2;
				var fx = f * dx / d, fy = f * dy / d;
				a.fx -= fx; a.fy -= fy; b.fx += fx; b.fy += fy;
			}
			for (i = 0; i < cEdges.length; i++) {
				var e = cEdges[i], a = cNodes[cIdX[e.a]], b = cNodes[cIdX[e.b]];
				var dx = b.bx - a.bx, dy = b.by - a.by;
				var d = Math.sqrt(dx * dx + dy * dy + 1e-7);
				var f = (d - L) * spr;
				var fx = f * dx / d, fy = f * dy / d;
				a.fx += fx; a.fy += fy; b.fx -= fx; b.fy -= fy;
			}
			for (i = 0; i < n; i++) {
				var p = cNodes[i];
				p.vx = (p.vx + p.fx) * damp; p.vy = (p.vy + p.fy) * damp;
				var v = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
				if (v > cl) { p.vx *= cl / v; p.vy *= cl / v; }
				p.bx += p.vx; p.by += p.vy;
				var r2 = Math.sqrt(p.bx * p.bx + p.by * p.by);
				if (r2 > 0.98) { p.bx *= 0.9653 / r2; p.by *= 0.9653 / r2; p.vx *= 0.4; p.vy *= 0.4; }
			}
		}
		var maxR = 0;
		for (i = 0; i < n; i++) { var rr = Math.sqrt(cNodes[i].bx * cNodes[i].bx + cNodes[i].by * cNodes[i].by); if (rr > maxR) maxR = rr; }
		if (maxR > 1e-6) for (i = 0; i < n; i++) { cNodes[i].bx /= maxR; cNodes[i].by /= maxR; }
	}

	function project(w, h) {
		R_disp = Math.min(w, h) / 2 - 46;
		var cx = w / 2, cy = h / 2, S = strength;
		for (var i = 0; i < cNodes.length; i++) {
			var c = cNodes[i];
			var dx = c.bx - focus.x, dy = c.by - focus.y;
			var d = Math.sqrt(dx * dx + dy * dy);
			var M = d < 1e-6 ? S : S / (1 + S * d);
			var dd = d * S / (1 + S * d) * R_disp * 1.12;
			var ux = d < 1e-6 ? 0 : dx / d, uy = d < 1e-6 ? 0 : dy / d;
			c.x = cx + ux * dd; c.y = cy - uy * dd;
			c.M = M; c.scaleF = 0.2 + 0.9 * Math.pow(M / S, 1.4);
		}
	}

	function buildUniverseOption(w, h) {
		project(w, h);
		var querying = state.query.length > 0;
		var boostSet = null;
		if (querying && state.resultSet) {
			boostSet = {};
			state.resultSet.forEach(function(id) {
				var cs = (nodeMap[id] && nodeMap[id].concepts) || {};
				Object.keys(cs).forEach(function(k) { boostSet[k] = true; });
			});
		}
		var nodes = cNodes.map(function(c) {
			var sF = c.scaleF;
			var baseHue = conceptHue(c.name);
			var cMid   = conceptColor(c.name, 54);
			var cLite  = conceptColor(c.name, 72);
			var cEdge  = conceptColor(c.name, 78);
			var sz = Math.max(5, (8 + c.importance * 0.55) * sF);
			var op = 1;
			if (querying && boostSet && !boostSet[c.name]) op = 0.12;
			var isFocus = (focusName === c.name);
			return {
				id: c.name, name: c.name, value: c.freq, freq: c.freq, hits: c.hits,
				importance: c.importance, degree: c.degree, part: c.part,
				symbolSize: sz, x: c.x, y: c.y,
				itemStyle: {
					color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.6, [
						{ offset: 0, color: cLite }, { offset: 1, color: cMid }
					]),
					opacity: op,
					shadowBlur: isFocus ? 36 : 12,
					shadowColor: cMid,
					borderColor: cEdge,
					borderWidth: isFocus ? 2 : 1.2
				},
				label: {
					show: op > 0.2 && (sF > 0.48 || c.importance >= 22),
					formatter: c.name,
					color: cEdge,
					fontSize: Math.max(6, Math.min(13, 10.5 * sF)),
					fontWeight: 600,
					textShadowColor: 'rgba(0,0,0,.75)',
					textShadowBlur: 5
				}
			};
		});
		var links = [];
		if (state.univEdges) {
			cEdges.forEach(function(e) {
				var a = cNodes[cIdX[e.a]], b = cNodes[cIdX[e.b]];
				var avg = (a.scaleF + b.scaleF) / 2;
				var op = 0.08 + 0.5 * (e.w / 27) * avg;
				if (querying && boostSet && !(boostSet[e.a] && boostSet[e.b])) op *= 0.15;
				links.push({
					source: e.a, target: e.b, value: e.w,
					lineStyle: { width: 0.8 + 0.9 * (e.w / 27), opacity: op, color: '#8ea4d8', curveness: 0 }
				});
			});
		}
		var graphic = [{
			type: 'circle', silent: true, z: 1,
			shape: { cx: w / 2, cy: h / 2, r: R_disp },
			style: { stroke: 'rgba(150,175,235,.28)', fill: 'rgba(120,150,220,.025)', lineWidth: 1.2, lineDash: [6, 8] }
		}];
		if (focusName && cIdX[focusName] != null) {
			var fc = cNodes[cIdX[focusName]];
			graphic.push({
				type: 'circle', silent: true, z: 2,
				shape: { cx: w / 2, cy: h / 2, r: (8 + fc.importance * 0.55) * fc.scaleF + 9 },
				style: { stroke: conceptColor(fc.name, 78), fill: 'transparent', lineWidth: 1 }
			});
		}
		return {
			animationDuration: 450,
			backgroundColor: 'transparent',
			grid: { left: 0, right: 0, top: 0, bottom: 0 },
			xAxis: { min: 0, max: w, show: false },
			yAxis: { min: 0, max: h, show: false },
			graphic: graphic,
			tooltip: {
				confine: true, trigger: 'item',
				backgroundColor: 'rgba(16,22,45,.96)',
				borderColor: 'rgba(150,170,230,.35)', borderWidth: 1,
				padding: [10, 13],
				textStyle: { color: '#e9eeff', fontSize: 12 },
				extraCssText: 'box-shadow:0 16px 40px rgba(0,0,0,.5);border-radius:12px;',
				formatter: function(params) {
					if (params.dataType === 'edge') {
						return '<b style="font-size:12.5px">' + escHtml(params.data.source) + '</b> ↔ <b style="font-size:12.5px">' + escHtml(params.data.target) + '</b>' +
							'<br><span style="font-size:11px;opacity:.75">co-occur in <b>' + (params.data.value || 0) + '</b> modules</span>';
					}
					var c = params.data || {};
					var freq = (c.freq != null) ? c.freq : (c.value != null ? c.value : 0);
					var hits = c.hits || 0;
					var imp = Math.round(c.importance || 0);
					return '<b style="font-size:13px">✦ ' + escHtml(c.name) + '</b>' +
						'<br><span style="font-size:11px;opacity:.75">used in <b>' + freq + '</b> modules · <b>' + hits + '</b> mentions · importance <b>' + imp + '</b></span>' +
						'<br><span style="font-size:10px;opacity:.55">click to make the focal point</span>';
				}
			},
			series: [{
				type: 'graph', layout: 'none', roam: false, z: 4,
				data: nodes, links: links,
				lineStyle: { width: 1 },
				emphasis: {
					focus: 'adjacency',
					itemStyle: { shadowBlur: 30 },
					lineStyle: { width: 2.2, opacity: 0.9 }
				},
				blur: { itemStyle: { opacity: 0.12 }, lineStyle: { opacity: 0.04 }, label: { opacity: 0.25 } }
			}]
		};
	}

	function updateFocusBadge() {
		var el = document.getElementById('km-focus');
		if (!el) return;
		if (focusName && cIdX[focusName] != null) {
			el.innerHTML = '<b>✦ ' + escHtml(focusName) + '</b> is the focus · ' + strength.toFixed(1) + '×<span style="opacity:.6">· drag to pan · scroll to zoom</span>';
		} else {
			el.innerHTML = '<span style="opacity:.6">drag to pan · scroll to zoom</span>';
		}
	}

	function flyTo(bx, by, name) {
		cancelAnimationFrame(animId);
		if (name) focusName = name;
		var t0 = performance.now(), dur = 560, fx0 = focus.x, fy0 = focus.y;
		function step() {
			var t = Math.min(1, (performance.now() - t0) / dur);
			var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
			focus.x = fx0 + (bx - fx0) * e; focus.y = fy0 + (by - fy0) * e;
			updateFocusBadge();
			rebuild(false);
			if (t < 1) animId = requestAnimationFrame(step);
		}
		animId = requestAnimationFrame(step);
	}

	function openConcept(c) {
		state.uFocus = c.name;
		var col = conceptColor(c.name, 54);
		var colDark = conceptColor(c.name, 38);
		var mods = [];
		NODES.forEach(function(n) { var cs = n.concepts || {}; if (cs[c.name]) mods.push({ n: n, cnt: cs[c.name] }); });
		mods.sort(function(a, b) { return b.cnt - a.cnt; });
		var neigh = cEdges.filter(function(e) { return e.a === c.name || e.b === c.name; })
			.sort(function(x, y) { return y.w - x.w; }).slice(0, 10);
		var html = '<div class="km-detail-head" style="--dh-c:' + col + ';--dh-c2:' + colDark + '">' +
			'<button class="dh-x" id="km-detail-x">✕</button>' +
			'<div class="dh-part">Concept · Part ' + c.part + ' · ' + escHtml(PARTS[c.part]) + '</div>' +
			'<div class="dh-icon">✦</div>' +
			'<h2>' + escHtml(c.name) + '</h2>' +
			'</div>' +
			'<div class="km-detail-body">' +
			'<div class="ds-meta">' +
			'<span class="ds-chip">used in ' + (c.freq || 0) + ' modules</span>' +
			'<span class="ds-chip">' + (c.hits || 0) + ' mentions</span>' +
			'<span class="ds-chip">importance ' + Math.round(c.importance || 0) + '</span>' +
			'<span class="ds-chip">' + neigh.length + ' strongest ties</span>' +
			'</div>' +
			'<div class="ds-desc" style="font-size:.78rem;color:var(--ink-mute)">Stars are sized by importance to the blog overall: how many modules mention the concept, how deeply, and how tightly it ties the others together. Click a module below to open it, or a neighbour chip to fly to it.</div>' +
			'<div class="ds-sec">Used in ' + mods.length + ' modules</div>';
		mods.forEach(function(m) {
			var nn = m.n;
			html += '<div class="km-mod-row" data-slug="' + escAttr(nn.id) + '">' +
				'<span class="m-dot" style="background:' + (COLORS[nn.part] || '#94a3b8') + '"></span>' +
				'<span>' + nn.icon + '</span>' +
				'<span class="m-t">' + escHtml(nn.title) + '</span>' +
				'<span style="margin-left:auto;font-size:.66rem;color:var(--ink-mute)">' + m.cnt + '×</span>' +
				'</div>';
		});
		html += '<div class="ds-sec">Strongest neighbours</div>';
		neigh.forEach(function(e) {
			var oname = e.a === c.name ? e.b : e.a;
			html += '<span class="km-tag km-neigh" data-focus="' + escAttr(oname) + '">' + escHtml(oname) + ' <span style="opacity:.5">· ' + e.w + '</span></span>';
		});
		html += '<button class="km-open" id="km-focus-btn" style="--dh-c:' + col + ';width:100%;justify-content:center;border:0;cursor:pointer">✦ Make the focal point</button>' +
			'</div>';
		detailEl.innerHTML = html;
		detailEl.classList.add('show');
		document.getElementById('km-detail-x').addEventListener('click', closeDetail);
		document.getElementById('km-focus-btn').addEventListener('click', function() { flyTo(c.bx, c.by, c.name); });
		detailEl.querySelectorAll('.km-mod-row').forEach(function(row) {
			row.addEventListener('click', function() {
				var o = nodeMap[row.dataset.slug];
				if (o) { openDetail(o); rebuild(false); }
			});
		});
		detailEl.querySelectorAll('.km-neigh').forEach(function(ch) {
			ch.addEventListener('click', function() {
				var oc = cNodes[cIdX[ch.dataset.focus]];
				if (oc) { flyTo(oc.bx, oc.by, oc.name); openConcept(oc); }
			});
		});
		rebuild(false);
	}

	/* ── view switching ── */
	function buildPills() {
		var el = document.getElementById('km-pills');
		el.innerHTML = '';
		var defs = state.view === 'universe'
			? [{ key: 'univEdges', label: '<span class="sw" style="background:#8ea4d8"></span>Connections', on: state.univEdges }]
			: [
				{ key: 'citation', label: '<span class="sw" style="background:#34d399"></span>Citations', on: state.edgeOn.citation },
				{ key: 'concept', label: '<span class="sw" style="background:#fbbf24"></span>Concepts', on: state.edgeOn.concept },
				{ key: 'path', label: '<span class="sw" style="background:#fff"></span>Journey', on: state.edgeOn.path }
			];
		defs.forEach(function(d) {
			var chip = document.createElement('div');
			chip.className = 'km-pill ' + (d.on ? 'on' : 'off');
			chip.innerHTML = d.label;
			chip.addEventListener('click', function() {
				if (state.view === 'universe') { state.univEdges = !state.univEdges; }
				else { state.edgeOn[d.key] = !state.edgeOn[d.key]; }
				buildPills();
				rebuild(false);
			});
			el.appendChild(chip);
		});
	}

	function renderLegend() {
		var el = document.getElementById('km-legend');
		var html;
		if (state.view === 'universe') {
			html = '<div class="lh">Concepts — size = importance</div>';
			cNodes.slice(0, 8).forEach(function(c) {
				html += '<div class="lg-row"><span class="sw" style="background:' + conceptColor(c.name, 56) + '"></span>' + escHtml(c.name) + '<span style="margin-left:auto;opacity:.6">' + Math.round(c.importance || 0) + '</span></div>';
			});
			html += '<div class="edge-row"><div class="lh">Threads</div>' +
				'<div class="lg-row"><span class="sw" style="background:#8ea4d8"></span>co-occurrence</div></div>';
			el.innerHTML = html;
			return;
		}
		html = '<div class="lh">Parts — one lane each</div>';
		for (var p = 0; p < 7; p++) {
			html += '<div class="lg-row"><span class="sw" style="background:' + COLORS[p] + '"></span>P' + p + ' · ' + escHtml(PARTS[p]) + '</div>';
		}
		html += '<div class="edge-row"><div class="lh">Threads</div>' +
			'<div class="lg-row"><span class="sw" style="background:#34d399"></span>shared citations</div>' +
			'<div class="lg-row"><span class="sw" style="background:#fbbf24"></span>shared concepts</div>' +
			'<div class="lg-row glow"><span class="sw" style="background:#fff"></span>the course journey</div></div>';
		el.innerHTML = html;
	}

	function setView(v) {
		state.view = v;
		document.querySelectorAll('.km-sw').forEach(function(b) { b.classList.toggle('on', b.dataset.view === v); });
		var tl = document.getElementById('km-timeline');
		if (tl) tl.style.display = v === 'universe' ? 'none' : '';
		var ll = document.getElementById('km-lane-labels');
		if (ll) ll.style.display = v === 'course' ? 'block' : 'none';
		var fb = document.getElementById('km-focus');
		if (fb) fb.style.display = v === 'universe' ? '' : 'none';
		var hint = document.getElementById('km-hint');
		if (hint) hint.innerHTML = v === 'universe'
			? '<span>click a star to make it the focus</span><span>scroll to zoom</span><span><kbd>Esc</kbd> close</span>'
			: '<span>hover to trace</span><span>click a star to explore</span><span><kbd>Esc</kbd> close</span>';
		canvas.classList.toggle('draggable', v === 'universe');
		if (v === 'course') { renderLaneDecor(); buildTimeline(); }
		buildPills();
		renderLegend();
		if (v === 'universe') updateFocusBadge();
		rebuild(false);
	}

	document.getElementById('km-switch').addEventListener('click', function(e) {
		var b = e.target.closest('.km-sw');
		if (b && b.dataset.view && b.dataset.view !== state.view) setView(b.dataset.view);
	});

	/* ── universe interaction: pan + Poincaré zoom via zrender ── */
	var zr = chart.getZr();
	zr.on('mousedown', function(e) {
		if (state.view !== 'universe') return;
		cDrag.active = true; cDrag.moved = false;
		cDrag.sx = e.offsetX; cDrag.sy = e.offsetY;
		cDrag.fx = focus.x; cDrag.fy = focus.y;
		canvas.classList.add('drag');
	});
	zr.on('mousemove', function(e) {
		if (!cDrag.active || state.view !== 'universe') return;
		var dx = e.offsetX - cDrag.sx, dy = e.offsetY - cDrag.sy;
		if (Math.abs(dx) + Math.abs(dy) > 3) cDrag.moved = true;
		if (cDrag.moved) {
			focus.x = clamp(cDrag.fx - dx / R_disp, -1.3, 1.3);
			focus.y = clamp(cDrag.fy + dy / R_disp, -1.3, 1.3);
			updateFocusBadge();
			rebuild(false);
		}
	});
	zr.on('mouseup', function() { cDrag.active = false; canvas.classList.remove('drag'); });
	zr.on('mousewheel', function(e) {
		if (state.view !== 'universe') return;
		var ev = e.event;
		if (ev && ev.preventDefault) ev.preventDefault();
		var d = e.zrDelta != null ? e.zrDelta : (e.wheelDelta || (e.deltaY != null ? -e.deltaY : 0));
		strength = clamp(strength + (d > 0 ? 0.28 : -0.28), 1.3, 7);
		updateFocusBadge();
		rebuild(false);
	});

	/* ── helpers ── */
	function escHtml(s) { var d = document.createElement('div'); d.appendChild(document.createTextNode(s == null ? '' : String(s))); return d.innerHTML; }
	function escAttr(s) { return escHtml(s).replace(/"/g, '&quot;'); }

	window.addEventListener('resize', function() {
		chart.resize();
		if (state.view === 'course') { renderLaneDecor(); buildTimeline(); }
		rebuild(false);
	});

	/* ── init ── */
	buildConceptGraph();
	setView('universe');
	window.KM_chart = chart;
	if (window.__KM_TEST) {
		window.KM_test = {
			chart: chart,
			getConceptState: function() { return { nodes: cNodes, edges: cEdges, focus: focus, strength: strength, view: state.view, focusName: focusName }; },
			project: project, flyTo: flyTo, openConcept: openConcept, setView: setView, buildPills: buildPills
		};
	}
})();
</script>
</body>
</html>
