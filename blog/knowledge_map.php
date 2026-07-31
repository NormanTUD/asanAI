<?php
/* ════════════════════════════════════════════════════════════════
   KNOWLEDGE MAP — The Web of This Course
   Every module is a node. Every shared citation, cross-reference,
   and shared concept is an edge. Search everything, click to explore.
   ════════════════════════════════════════════════════════════════ */

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
$KM_EXCLUDE = ['index', 'index_full', 'functions', 'search', 'graph', 'literature', 'asanai_blog_proxy', 'knowledge_map', 'category_theory', 'commutation', 'layer_commuting_diagram', 'math_deri'];

/* ── Part colors (match course parts 0–6) ── */
$KM_PART_COLORS = [
	0 => '#94a3b8', 1 => '#6366f1', 2 => '#0ea5e9', 3 => '#10b981',
	4 => '#f59e0b', 5 => '#ec4899', 6 => '#8b5cf6',
];
$KM_PART_NAMES = [
	0 => 'Prologue', 1 => 'Foundations', 2 => 'How Networks Learn', 3 => 'Deep Learning & Vision',
	4 => 'The Transformer Revolution', 5 => 'Making AI Useful', 6 => 'Bigger Questions',
];

function km_clean_text($html) {
	$html = preg_replace('/<\?php.*?\?>/s', '', $html);
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

	/* cross-links to other module pages */
	$links = [];
	if (preg_match_all('/href=["\']([a-zA-Z0-9_\-]+)(?:\.php)?(?:#[^"\']*)?["\']/i', $content, $lm)) {
		foreach ($lm[1] as $t) {
			$t = trim($t, '/');
			if ($t !== $slug) $links[$t] = true;
		}
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
		'links'       => array_keys($links),
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
	foreach ($m['links'] as $t) {
		if ($t !== $slug && isset($modules[$t])) {
			km_add_edge($edges, $slug, $t, 'link', 1, [$t]);
		}
	}
	foreach ($m['citations'] as $ck) {
		foreach ($moduleKeys as $other) {
			if ($other === $slug) continue;
			if (in_array($ck, $modules[$other]['citations'], true)) {
				km_add_edge($edges, $slug, $other, 'citation', 1, [$ck]);
			}
		}
	}
}

$conceptPairs = [];
foreach ($moduleKeys as $i => $a) {
	foreach ($moduleKeys as $j => $b) {
		if ($j <= $i) continue;
		$shared = array_intersect_key($modules[$a]['concepts'], $modules[$b]['concepts']);
		if (count($shared) > 0) {
			$pairs = $shared;
			ksort($pairs);
			$conceptPairs[] = ['a' => $a, 'b' => $b, 'n' => count($shared), 'names' => array_keys($pairs)];
		}
	}
}

/* keep concept pairs with most shared concepts; cap per module to avoid a hairball */
$capPerModule = 14;
$conceptDegree = [];
usort($conceptPairs, fn($x, $y) => $y['n'] <=> $x['n']);
$selectedConceptPairs = [];
foreach ($conceptPairs as $p) {
	$aCount = $conceptDegree[$p['a']] ?? 0;
	$bCount = $conceptDegree[$p['b']] ?? 0;
	if ($aCount >= $capPerModule || $bCount >= $capPerModule) continue;
	if (($p['n'] >= 3 && $aCount < $capPerModule && $bCount < $capPerModule) || $p['n'] >= 4) {
		$selectedConceptPairs[] = $p;
		$conceptDegree[$p['a']] = $aCount + 1;
		$conceptDegree[$p['b']] = $bCount + 1;
	}
}

foreach ($selectedConceptPairs as $p) {
	km_add_edge($edges, $p['a'], $p['b'], 'concept', $p['n'], $p['names']);
}

/* course learning-path edges (n → n+1 in course order) */
$ordered = $modules;
usort($ordered, function($a, $b) {
	if ($a['part'] !== $b['part']) return $a['part'] <=> $b['part'];
	return $a['order'] <=> $b['order'];
});
$orderedSlugs = array_column($ordered, 'id');
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
	'conceptPair'=> count($selectedConceptPairs),
];

$KM = [
	'nodes'    => array_values($modules),
	'edges'    => $edgeList,
	'parts'    => $KM_PART_NAMES,
	'colors'   => $KM_PART_COLORS,
	'concepts' => $KM_CONCEPTS,
	'stats'    => $stats,
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Web of Knowledge — Course Map</title>
<script>
function toggleTheme() {
	var html = document.documentElement;
	var isDark = !html.classList.contains('dark');
	if (isDark) html.classList.add('dark'); else html.classList.remove('dark');
	var btn = document.getElementById('km-theme-toggle');
	if (btn) btn.innerHTML = isDark ? '&#9788;' : '&#9790;';
	var meta = document.querySelector('meta[name="theme-color"]');
	if (meta) meta.content = isDark ? '#0f172a' : '#ffffff';
	document.cookie = 'theme=' + (isDark ? 'dark' : 'light') + '; path=/; max-age=' + 60*60*24*365;
}
(function() {
	if (document.cookie.indexOf('theme=') === -1) {
		if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) toggleTheme();
	}
})();
</script>
<style>
:root {
	--km-bg: #ffffff;
	--km-surface: #f8fafc;
	--km-surface2: #ffffff;
	--km-border: #e2e8f0;
	--km-text: #1e293b;
	--km-text-soft: #475569;
	--km-text-mute: #94a3b8;
	--km-accent: #6366f1;
	--km-shadow: 0 10px 30px rgba(15,23,42,0.08);
}
html.dark {
	--km-bg: #0f172a;
	--km-surface: #16213a;
	--km-surface2: #1e293b;
	--km-border: #334155;
	--km-text: #e2e8f0;
	--km-text-soft: #cbd5e1;
	--km-text-mute: #94a3b8;
	--km-accent: #818cf8;
	--km-shadow: 0 10px 30px rgba(0,0,0,0.45);
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
	background: var(--km-bg);
	color: var(--km-text);
	font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
	min-height: 100vh;
}
a { color: var(--km-accent); text-decoration: none; }

#km-theme-toggle {
	position: fixed; top: 16px; right: 20px; z-index: 1000;
	width: 42px; height: 42px; border: 1px solid var(--km-border);
	border-radius: 12px; background: var(--km-surface2);
	box-shadow: var(--km-shadow); color: var(--km-text-soft);
	cursor: pointer; font-size: 1.2rem; display: flex;
	align-items: center; justify-content: center;
}
#km-theme-toggle:hover { color: var(--km-accent); border-color: var(--km-accent); }

.km-shell { max-width: 1720px; margin: 0 auto; padding: 24px 22px 60px; }
.km-hero { text-align: center; margin: 10px 0 6px; }
.km-hero .km-eyebrow {
	font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase;
	color: var(--km-text-mute); margin-bottom: 6px;
}
.km-hero h1 {
	margin: 0; font-size: clamp(1.7rem, 3.2vw, 2.6rem); letter-spacing: 0.01em;
}
.km-hero h1 em { font-style: normal; color: var(--km-accent); }
.km-hero p { max-width: 720px; margin: 10px auto 0; color: var(--km-text-soft); line-height: 1.6; font-size: 0.98rem; }

/* stats strip */
.km-stats {
	display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin: 18px 0 4px;
}
.km-stat {
	background: var(--km-surface2); border: 1px solid var(--km-border);
	border-radius: 12px; padding: 8px 16px; font-size: 0.85rem; color: var(--km-text-soft);
	display: flex; align-items: center; gap: 8px;
}
.km-stat b { color: var(--km-accent); font-size: 1rem; }
.km-stat .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }

/* toolbar */
.km-toolbar {
	position: sticky; top: 10px; z-index: 500; margin: 18px 0 16px;
	background: var(--km-surface2); border: 1px solid var(--km-border);
	border-radius: 16px; box-shadow: var(--km-shadow); padding: 12px 14px;
	display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
}
.km-search-wrap { position: relative; flex: 1 1 260px; min-width: 220px; }
.km-search-wrap svg {
	position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
	width: 16px; height: 16px; color: var(--km-text-mute); pointer-events: none;
}
.km-search {
	width: 100%; padding: 10px 14px 10px 38px; font-size: 0.95rem;
	background: var(--km-surface); color: var(--km-text);
	border: 1.5px solid var(--km-border); border-radius: 10px; outline: none;
	transition: border-color 0.15s;
}
.km-search:focus { border-color: var(--km-accent); }
.km-search-mode {
	position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
	font-size: 0.72rem; color: var(--km-text-mute); letter-spacing: 0.05em;
}
.km-toolbar .sep { width: 1px; height: 30px; background: var(--km-border); }
.km-chip-group { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.km-chip {
	border: 1px solid var(--km-border); background: var(--km-surface);
	color: var(--km-text-soft); border-radius: 999px; padding: 6px 12px;
	font-size: 0.8rem; cursor: pointer; user-select: none; transition: all 0.15s;
	display: flex; align-items: center; gap: 6px;
}
.km-chip .sw { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.km-chip:hover { border-color: var(--km-accent); color: var(--km-accent); }
.km-chip.on { background: var(--km-accent); border-color: var(--km-accent); color: #fff; }
.km-chip.on .sw { background: #fff !important; }
.km-select {
	padding: 7px 10px; font-size: 0.82rem; color: var(--km-text-soft);
	background: var(--km-surface); border: 1px solid var(--km-border); border-radius: 10px;
}
.km-label { font-size: 0.72rem; color: var(--km-text-mute); text-transform: uppercase; letter-spacing: 0.08em; }

/* layout */
.km-layout {
	display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: 16px;
}
.km-chart-wrap {
	position: relative; background: var(--km-surface2); border: 1px solid var(--km-border);
	border-radius: 16px; overflow: hidden; box-shadow: var(--km-shadow);
	min-height: 640px; height: calc(100vh - 250px); min-height: 560px;
}
#km-chart { width: 100%; height: 100%; }
.km-legend {
	position: absolute; top: 12px; left: 12px; z-index: 10; background: var(--km-surface2);
	border: 1px solid var(--km-border); border-radius: 12px; padding: 10px 12px;
	font-size: 0.74rem; color: var(--km-text-soft); max-width: 190px;
	box-shadow: var(--km-shadow); line-height: 1.7;
}
.km-legend .lh { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--km-text-mute); margin-bottom: 4px; }
.km-legend .sw { width: 10px; height: 10px; border-radius: 3px; display: inline-block; margin-right: 6px; vertical-align: -1px; }
.km-legend .sw.dot { border-radius: 50%; }
.km-legend b { color: var(--km-text); }
.km-hint {
	position: absolute; bottom: 12px; left: 12px; z-index: 10;
	font-size: 0.72rem; color: var(--km-text-mute); background: var(--km-surface2);
	border: 1px solid var(--km-border); border-radius: 8px; padding: 5px 10px; opacity: 0.85;
}
.km-badge {
	position: absolute; top: 12px; right: 12px; z-index: 10;
	font-size: 0.72rem; color: var(--km-text-mute); background: var(--km-surface2);
	border: 1px solid var(--km-border); border-radius: 999px; padding: 5px 12px;
}

/* side panel */
.km-panel {
	background: var(--km-surface2); border: 1px solid var(--km-border); border-radius: 16px;
	box-shadow: var(--km-shadow); overflow: hidden; display: flex; flex-direction: column;
	min-height: 560px; height: calc(100vh - 250px); min-height: 560px;
}
.km-panel-head {
	padding: 14px 16px; border-bottom: 1px solid var(--km-border);
	display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
.km-panel-head h2 { margin: 0; font-size: 1rem; }
.km-panel-head .km-close { cursor: pointer; border: 0; background: none; color: var(--km-text-mute); font-size: 1.2rem; padding: 0 4px; }
.km-panel-head .km-close:hover { color: var(--km-text); }
.km-panel-body { padding: 16px; overflow-y: auto; flex: 1; font-size: 0.9rem; line-height: 1.55; }

.km-node-detail .nd-title { font-size: 1.15rem; font-weight: 700; margin-bottom: 2px; }
.km-node-detail .nd-title .nd-icon { margin-right: 6px; }
.km-node-detail .nd-meta { font-size: 0.76rem; color: var(--km-text-mute); margin-bottom: 10px; }
.km-node-detail .nd-desc { color: var(--km-text-soft); margin-bottom: 14px; }
.km-node-detail .nd-open { display: inline-block; margin-bottom: 14px; }
.km-node-detail .nd-section { margin: 16px 0 6px; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--km-text-mute); }

.km-tag {
	display: inline-block; background: var(--km-surface); border: 1px solid var(--km-border);
	border-radius: 999px; padding: 2px 9px; font-size: 0.74rem; margin: 2px 3px 2px 0; color: var(--km-text-soft);
}
.km-conn { border: 1px solid var(--km-border); border-radius: 10px; padding: 8px 10px; margin-bottom: 8px; background: var(--km-surface); }
.km-conn .cc-type { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--km-text-mute); }
.km-conn .cc-name { font-weight: 600; font-size: 0.9rem; margin: 1px 0 3px; }
.km-conn .cc-why { font-size: 0.74rem; color: var(--km-text-soft); }
.km-conn a.cc-name:hover { color: var(--km-accent); }
.km-conn.ct-link { border-left: 3px solid #64748b; }
.km-conn.ct-citation { border-left: 3px solid #10b981; }
.km-conn.ct-concept { border-left: 3px solid #f59e0b; }
.km-conn.ct-course { border-left: 3px solid #a5b4fc; }

.km-section-row { padding: 6px 4px; border-bottom: 1px dashed var(--km-border); font-size: 0.85rem; }
.km-section-row a { color: var(--km-text-soft); }
.km-section-row a:hover { color: var(--km-accent); }

/* search results */
.km-search-res .sr-count { font-size: 0.82rem; color: var(--km-text-mute); margin-bottom: 12px; }
.km-search-res .sr-item {
	display: block; border: 1px solid var(--km-border); border-radius: 10px; padding: 10px 12px;
	margin-bottom: 9px; background: var(--km-surface); cursor: pointer;
}
.km-search-res .sr-item:hover { border-color: var(--km-accent); }
.km-search-res .sr-item.sr-active { border-color: var(--km-accent); box-shadow: 0 0 0 2px var(--km-accent); }
.km-search-res .sr-title { font-weight: 600; font-size: 0.9rem; color: var(--km-text); margin-bottom: 2px; }
.km-search-res .sr-title .badge { font-size: 0.68rem; color: var(--km-accent); border: 1px solid var(--km-accent); border-radius: 999px; padding: 0 6px; margin-left: 5px; }
.km-search-res .sr-page { font-size: 0.72rem; color: var(--km-text-mute); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
.km-search-res .sr-snippet { font-size: 0.78rem; color: var(--km-text-soft); line-height: 1.5; }
.km-search-res mark { background: #fde68a; color: #1e293b; border-radius: 3px; padding: 0 2px; }
html.dark .km-search-res mark { background: #854d0e; color: #fef3c7; }
.km-search-res .sr-empty { color: var(--km-text-mute); font-size: 0.9rem; padding: 20px 4px; text-align: center; }

.km-welcome { color: var(--km-text-soft); }
.km-welcome .w-step { display: flex; gap: 12px; margin-bottom: 14px; }
.km-welcome .w-num {
	flex: 0 0 26px; height: 26px; border-radius: 50%; background: var(--km-accent); color: #fff;
	display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700;
}
.km-welcome .w-title { font-weight: 600; color: var(--km-text); }
.km-top-concepts { margin-top: 8px; }

@media (max-width: 980px) {
	.km-layout { grid-template-columns: 1fr; }
	.km-chart-wrap, .km-panel { height: 60vh; min-height: 420px; }
}
</style>
</head>
<body>
<button id="km-theme-toggle" aria-label="Toggle dark mode" title="Toggle dark mode" onclick="toggleTheme()">&#9790;</button>

<div class="km-shell">
	<div class="km-hero">
		<div class="km-eyebrow">Interactive Overview of Every Module</div>
		<h1>The Web of <em>Knowledge</em></h1>
		<p>Every course module is a node. The edges are real relationships: shared citations, cross-references, and overlapping concepts. Type to search everything, drag to explore, click a node to see why things belong together.</p>
	</div>

	<div class="km-stats">
		<div class="km-stat"><b id="st-modules"></b> modules</div>
		<div class="km-stat"><b id="st-citations"></b> bibliography entries</div>
		<div class="km-stat"><b id="st-concepts"></b> concepts tracked</div>
		<div class="km-stat"><b id="st-edges"></b> connections</div>
		<div class="km-stat"><span class="dot" style="background:#64748b"></span>links</div>
		<div class="km-stat"><span class="dot" style="background:#10b981"></span>shared citations</div>
		<div class="km-stat"><span class="dot" style="background:#f59e0b"></span>shared concepts</div>
	</div>

	<div class="km-toolbar">
		<div class="km-search-wrap">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
			<input type="text" id="km-search" class="km-search" placeholder="Search across every module, section and citation…" spellcheck="false" autocomplete="off">
			<span class="km-search-mode" id="km-search-mode"></span>
		</div>

		<div class="sep"></div>
		<span class="km-label">edges</span>
		<div class="km-chip-group" id="km-edge-toggles">
			<div class="km-chip on" data-edge="link"><span class="sw" style="background:#64748b"></span>Links</div>
			<div class="km-chip on" data-edge="citation"><span class="sw" style="background:#10b981"></span>Citations</div>
			<div class="km-chip on" data-edge="concept"><span class="sw" style="background:#f59e0b"></span>Concepts</div>
			<div class="km-chip" data-edge="course"><span class="sw" style="background:#a5b4fc"></span>Learning path</div>
		</div>

		<div class="sep"></div>
		<span class="km-label">min shared</span>
		<select id="km-min-shared" class="km-select" title="Minimum number of shared concepts for a concept edge">
			<option value="1">1 concept</option>
			<option value="2" selected>2 concepts</option>
			<option value="3">3 concepts</option>
			<option value="4">4 concepts</option>
			<option value="5">5 concepts</option>
		</select>

		<div class="sep"></div>
		<span class="km-label">focus</span>
		<select id="km-concept" class="km-select" title="Highlight modules containing a concept">
			<option value="">Any concept</option>
		</select>
	</div>

	<div class="km-layout">
		<div class="km-chart-wrap">
			<div class="km-legend" id="km-legend"></div>
			<div class="km-badge" id="km-badge"></div>
			<div class="km-hint">drag · scroll to zoom · click a node</div>
			<div id="km-chart"></div>
		</div>

		<div class="km-panel">
			<div class="km-panel-head">
				<h2 id="km-panel-title">Explore</h2>
				<button class="km-close" id="km-panel-close" aria-label="Close panel" title="Close">&times;</button>
			</div>
			<div class="km-panel-body" id="km-panel-body"></div>
		</div>
	</div>
</div>

<script src="echarts.min.js"></script>
<script>
window.KM_DATA = <?php echo json_encode($KM, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>;
</script>
<script>
(function() {
	'use strict';

	/* ── globals ── */
	var DATA = window.KM_DATA;
	var NODES = DATA.nodes;
	var EDGES = DATA.edges;
	var PARTS = DATA.parts;
	var COLORS = DATA.colors;
	var CONCEPTS = DATA.concepts;

	var nodeMap = {};
	NODES.forEach(function(n) { nodeMap[n.id] = n; });

	var chart = echarts.init(document.getElementById('km-chart'));
	var panelBody = document.getElementById('km-panel-body');
	var panelTitle = document.getElementById('km-panel-title');
	var searchInput = document.getElementById('km-search');
	var searchModeEl = document.getElementById('km-search-mode');
	var minShared = 2;
	var edgeOn = { link: true, citation: true, concept: true, course: false };
	var partOn = {};
	for (var p in PARTS) partOn[p] = true;
	var focusConcept = '';
	var activeQuery = '';
	var activeNode = null;
	var searchAbort = null;
	var searchTimer = null;
	var resultsCache = {};
	var resultNodes = null;      /* Set of slugs matching active query */
	var lastQueryKey = '';

	/* ── stats ── */
	document.getElementById('st-modules').textContent = DATA.stats.modules;
	document.getElementById('st-citations').textContent = DATA.stats.citations;
	document.getElementById('st-concepts').textContent = DATA.stats.concepts;
	document.getElementById('st-edges').textContent = DATA.stats.edges;

	/* ── legend ── */
	var legendEl = document.getElementById('km-legend');
	var legendHtml = '<div class="lh">Node color = course part</div>';
	for (var p in PARTS) {
		legendHtml += '<div><span class="sw dot" style="background:' + COLORS[p] + '"></span>Part ' + p + ' — ' + PARTS[p] + '</div>';
	}
	legendEl.innerHTML = legendHtml;

	/* ── concept dropdown ── */
	var conceptSel = document.getElementById('km-concept');
	var conceptList = Object.keys(CONCEPTS).sort();
	conceptList.forEach(function(c) {
		var o = document.createElement('option');
		o.value = c; o.textContent = c;
		conceptSel.appendChild(o);
	});
	conceptSel.addEventListener('change', function() {
		focusConcept = conceptSel.value;
		activeNode = null;
		rebuild(false);
		if (focusConcept) {
			var pages = NODES.filter(function(n) { return n.concepts[focusConcept]; });
			renderConceptPanel(focusConcept, pages);
		} else {
			renderWelcome();
		}
	});

	/* ── part filter chips ── */
	(function buildPartChips() {
		var group = document.createElement('div');
		group.className = 'km-chip-group';
		group.style.marginLeft = '4px';
		for (var p in PARTS) {
			var chip = document.createElement('div');
			chip.className = 'km-chip on';
			chip.dataset.part = p;
			chip.innerHTML = '<span class="sw" style="background:' + COLORS[p] + '"></span>P' + p;
			chip.addEventListener('click', function() {
				var pp = this.dataset.part;
				partOn[pp] = !partOn[pp];
				this.classList.toggle('on', partOn[pp]);
				rebuild(false);
			});
			group.appendChild(chip);
		}
		var wrap = document.querySelector('.km-toolbar');
		var sep = document.createElement('div'); sep.className = 'sep';
		var lab = document.createElement('span'); lab.className = 'km-label'; lab.textContent = 'parts';
		wrap.insertBefore(lab, document.getElementById('km-edge-toggles'));
		wrap.insertBefore(sep, document.getElementById('km-edge-toggles'));
		wrap.insertBefore(group, document.getElementById('km-edge-toggles'));
	})();

	/* ── edge toggles ── */
	document.getElementById('km-edge-toggles').querySelectorAll('.km-chip').forEach(function(chip) {
		chip.addEventListener('click', function() {
			var t = this.dataset.edge;
			edgeOn[t] = !edgeOn[t];
			this.classList.toggle('on', edgeOn[t]);
			rebuild(false);
		});
	});

	document.getElementById('km-min-shared').addEventListener('change', function() {
		minShared = parseInt(this.value, 10) || 2;
		rebuild(false);
	});

	/* ── graph construction ── */
	function nodeVisible(n) {
		return partOn[n.part];
	}
	function edgeVisible(e) {
		if (!edgeOn[e.type]) return false;
		if (e.type === 'concept' && e.weight < minShared) return false;
		if (!nodeVisible(nodeMap[e.a]) || !nodeVisible(nodeMap[e.b])) return false;
		return true;
	}

	function buildOption() {
		var visibleEdges = EDGES.filter(edgeVisible);
		var edgeSet = {};
		var degree = {};
		visibleEdges.forEach(function(e) {
			edgeSet[e.a + '|' + e.b] = true;
			degree[e.a] = (degree[e.a] || 0) + 1;
			degree[e.b] = (degree[e.b] || 0) + 1;
		});

		var queryMatches = resultNodes;
		var isFiltered = activeQuery.length > 0;

		var seriesNodes = NODES.filter(nodeVisible).map(function(n) {
			var d = degree[n.id] || 0;
			var matched = !isFiltered || (queryMatches && queryMatches.has(n.id));
			var inConcept = !focusConcept || !!n.concepts[focusConcept];

			var opacity = 1;
			var labelShow = true;
			var symbolSize = 14 + Math.min(16, d * 1.1);
			if (isFiltered) {
				if (!matched) { opacity = 0.10; labelShow = false; }
				else symbolSize += 5;
			}
			if (focusConcept && !inConcept) { opacity = Math.min(opacity, 0.12); labelShow = false; }

			var c = COLORS[n.part] || '#94a3b8';
			return {
				id: n.id,
				name: n.name.replace(/_/g, ' '),
				value: n.degree,
				degree: d,
				concepts: n.concepts,
				part: n.part,
				url: n.url,
				symbolSize: symbolSize,
				draggable: true,
				itemStyle: {
					color: c,
					opacity: opacity,
					borderColor: '#ffffff',
					borderWidth: matched ? 1.5 : 1,
					shadowBlur: matched ? 10 : 0,
					shadowColor: c
				},
				label: { show: labelShow, color: COLORS[n.part], fontSize: 9 }
			};
		});

		var seriesLinks = visibleEdges.map(function(e) {
			var matchCount = 0;
			if (isFiltered && queryMatches) {
				matchCount = (queryMatches.has(e.a) ? 1 : 0) + (queryMatches.has(e.b) ? 1 : 0);
			}
			var typeStyle = edgeStyle(e);
			if (isFiltered) {
				if (matchCount === 0) typeStyle.opacity = 0.04;
				else if (matchCount === 1) typeStyle.opacity *= 0.55;
			}
			return {
				source: e.a,
				target: e.b,
				value: e.weight,
				type: e.type,
				lineStyle: typeStyle
			};
		});

		return {
			animationDuration: 400,
			tooltip: {
				trigger: 'item',
				formatter: function(params) {
					if (params.dataType === 'edge') {
						var e = params.data;
						var from = nodeMap[e.source], to = nodeMap[e.target];
						var why = [];
						if (e.type === 'citation') why.push('<b>shared citations:</b> ' + escHtml(e.citations || ''));
						if (e.type === 'concept') why.push('<b>shared concepts:</b> ' + escHtml(e.concepts || ''));
						if (e.type === 'link') why.push('<b>cross-reference</b>');
						if (e.type === 'course') why.push('<b>learning path</b>');
						return '<b>' + escHtml(from.title) + '</b> ↔ <b>' + escHtml(to.title) + '</b><br>' +
							'<span style="font-size:11px;opacity:.85">' + why.join('<br>') + '</span>';
					}
					var n = params.data;
					var desc = (n.description || '').slice(0, 160);
					return '<b style="font-size:13px">' + escHtml(n.title) + '</b>' +
						'<br><span style="font-size:11px;opacity:.7">Part ' + n.part + ' · ' + n.degree + ' connections</span>' +
						(desc ? '<br><span style="font-size:11px;color:#555">' + escHtml(desc) + '</span>' : '') +
						'<br><span style="font-size:10px;opacity:.6">click to explore</span>';
				},
				backgroundColor: 'rgba(255,255,255,0.96)',
				borderColor: '#e2e8f0',
				textStyle: { color: '#1e293b' }
			},
			series: [{
				type: 'graph',
				layout: 'force',
				roam: true,
				draggable: true,
				data: seriesNodes,
				links: seriesLinks,
				force: { repulsion: 260, edgeLength: [70, 150], gravity: 0.06, friction: 0.6 },
				lineStyle: { width: 1.2, curveness: 0.08 },
				emphasis: {
					focus: 'adjacency',
					lineStyle: { width: 3, opacity: 1 }
				},
				label: { show: true, position: 'right', formatter: '{b}', fontSize: 9 }
			}]
		};
	}

	function edgeStyle(e) {
		if (e.type === 'link') return { color: '#64748b', width: 2.2, opacity: 0.7 };
		if (e.type === 'citation') return { color: '#10b981', width: 1.6, opacity: 0.55, type: 'dashed' };
		if (e.type === 'course') return { color: '#a5b4fc', width: 1, opacity: 0.4, type: 'dotted' };
		return { color: '#f59e0b', width: Math.min(2.5, 0.6 + e.weight * 0.35), opacity: 0.45 };
	}

	var rebuildTimer = null;
	function rebuild(animate) {
		clearTimeout(rebuildTimer);
		rebuildTimer = setTimeout(function() {
			var option = buildOption();
			var nodes = option.series[0].data;
			var links = option.series[0].links;
			var badge = document.getElementById('km-badge');
			if (activeQuery) badge.textContent = nodes.filter(function(n) { return n.itemStyle.opacity > 0.3; }).length + ' matching of ' + nodes.length;
			else if (focusConcept) badge.textContent = nodes.filter(function(n) { return n.itemStyle.opacity > 0.3; }).length + ' modules with concept';
			else badge.textContent = nodes.length + ' modules · ' + links.length + ' edges';
			chart.setOption(option, { notMerge: true, lazyUpdate: true });
		}, animate === false ? 0 : 60);
	}

	/* highlight selected node */
	function focusNode(slug) {
		activeNode = slug;
		chart.dispatchAction({
			type: 'showTip',
			seriesIndex: 0,
			dataIndex: NODES.findIndex(function(n) { return n.id === slug; })
		});
	}

	/* ── search (detailed, across everything) ── */
	function detectMode(q) {
		if (/^\/.+\/$/.test(q)) return 'regex';
		if (q.charAt(0) === '~' && q.length > 1) return 'fuzzy';
		return 'normal';
	}
	function updateSearchModeHint(q) {
		var m = detectMode(q);
		searchModeEl.textContent = m === 'normal' ? '' : m + ' mode';
	}

	searchInput.addEventListener('input', function() {
		var q = searchInput.value.trim();
		updateSearchModeHint(q);
		clearTimeout(searchTimer);
		activeQuery = q;
		if (q.length < 2) {
			activeQuery = '';
			resultNodes = null;
			lastQueryKey = '';
			if (searchAbort) { searchAbort.abort(); searchAbort = null; }
			rebuild(false);
			if (focusConcept) renderConceptPanel(focusConcept, NODES.filter(function(n) { return n.concepts[focusConcept]; }));
			else if (activeNode) renderNodeDetail(nodeMap[activeNode]);
			else renderWelcome();
			return;
		}
		searchTimer = setTimeout(function() { doSearch(q); }, 220);
	});

	function doSearch(q) {
		var key = q;
		if (resultsCache[key]) { applySearchResults(key, resultsCache[key]); return; }
		if (searchAbort) searchAbort.abort();
		searchAbort = new AbortController();
		fetch('search.php?q=' + encodeURIComponent(q), { signal: searchAbort.signal })
			.then(function(r) { return r.json(); })
			.then(function(data) {
				resultsCache[key] = data;
				if (key === searchInput.value.trim()) applySearchResults(key, data);
			})
			.catch(function() {});
	}

	function applySearchResults(key, data) {
		if (key !== searchInput.value.trim()) return;
		var grouped = data.grouped || [];
		resultNodes = new Set(grouped.map(function(g) { return g.page; }));
		var items = (data.results && data.results.length > 0 && grouped.length === 0) ? data.results : grouped;
		activeQuery = key;
		renderSearchResults(key, data, items);
		rebuild(false);
	}

	function renderSearchResults(query, data, items) {
		panelTitle.textContent = 'Search results';
		var mode = data.mode || 'normal';
		var html = '<div class="km-search-res">';
		html += '<div class="sr-count">' + (data.total || 0) + ' matches across ' + items.length + ' module' + (items.length === 1 ? '' : 's') + ' for <b>' + escHtml(query) + '</b></div>';

		if (!items.length) {
			html += '<div class="sr-empty">Nothing found. Try fewer words, or <code>~fuzzy</code> / <code>/regex/</code> modes.</div></div>';
			panelBody.innerHTML = html;
			return;
		}

		items.forEach(function(r, i) {
			var hl = r.snippet || '';
			if (mode === 'regex') hl = extractMatch(hl, query);
			var page = r.page || '';
			html += '<div class="sr-item" data-slug="' + escAttr(page) + '" data-i="' + i + '">' +
				'<div class="sr-page">' + escHtml(page) + (r.count > 1 ? ' <span class="badge">' + r.count + ' sections</span>' : '') + '</div>' +
				'<div class="sr-title">' + escHtml(r.title) + '</div>' +
				'<div class="sr-snippet">' + highlight(escHtml(hl), query, mode) + '</div>' +
				'</div>';
		});
		html += '</div>';
		panelBody.innerHTML = html;

		panelBody.querySelectorAll('.sr-item').forEach(function(el) {
			el.addEventListener('mouseenter', function() {
				var slug = this.dataset.slug;
				if (nodeMap[slug]) { activeNode = slug; rebuild(false); }
			});
			el.addEventListener('mouseleave', function() {
				activeNode = null;
				rebuild(false);
			});
			el.addEventListener('click', function() {
				var idx = parseInt(this.dataset.i, 10);
				var r = items[idx];
				if (!r) return;
				window.location.href = r.url + '.php' + (r.url.indexOf('#') === -1 ? '' : '');
			});
		});
	}

	function extractMatch(snippet, q) {
		try {
			var m = snippet.match(new RegExp(q.replace(/^\/(.+)\/$/, '$1'), 'i'));
			return m ? m[0] : '';
		} catch (e) { return ''; }
	}
	function highlight(text, query, mode) {
		if (!query || mode === 'fuzzy') return text;
		var escaped = (mode === 'regex' ? (query.replace(/^\/(.+)\/$/, '$1')) : query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		if (!escaped) return text;
		var re = new RegExp('(' + escaped + ')', 'gi');
		return text.replace(re, '<mark>$1</mark>');
	}

	/* ── panel renderers ── */
	function renderWelcome() {
		panelTitle.textContent = 'Explore';
		var topConcepts = {};
		NODES.forEach(function(n) { Object.keys(n.concepts).forEach(function(c) { topConcepts[c] = (topConcepts[c] || 0) + 1; }); });
		var sorted = Object.keys(topConcepts).sort(function(a, b) { return topConcepts[b] - topConcepts[a]; }).slice(0, 18);

		var html = '<div class="km-welcome">' +
			'<div class="w-step"><div class="w-num">1</div><div><div class="w-title">Search everything</div>Every module, section, caption and citation is indexed. Type in the box — matching modules light up and their connections stay visible.</div></div>' +
			'<div class="w-step"><div class="w-num">2</div><div><div class="w-title">Hover the graph</div>Edges tell you <i>why</i> two modules belong together: shared citations (green, dashed), shared concepts (amber, thick), direct links (grey).</div></div>' +
			'<div class="w-step"><div class="w-num">3</div><div><div class="w-title">Click a node</div>The panel opens that module: its concept profile, every connection with the shared terms that justify it, and its sections to jump straight in.</div></div>' +
			'</div>';
		html += '<div class="nd-section">Most connected concepts</div><div>';
		sorted.forEach(function(c) {
			html += '<span class="km-tag" style="cursor:pointer" data-concept="' + escAttr(c) + '">' + escHtml(c) + ' · ' + topConcepts[c] + '</span>';
		});
		html += '</div></div>';
		panelBody.innerHTML = html;
		panelBody.querySelectorAll('[data-concept]').forEach(function(el) {
			el.addEventListener('click', function() {
				conceptSel.value = this.dataset.concept;
				focusConcept = conceptSel.value;
				activeNode = null;
				rebuild(false);
				var pages = NODES.filter(function(n) { return n.concepts[focusConcept]; });
				renderConceptPanel(focusConcept, pages);
			});
		});
	}

	function renderConceptPanel(concept, pages) {
		panelTitle.textContent = 'Concept: ' + concept;
		pages.sort(function(a, b) { return (b.concepts[concept] || 0) - (a.concepts[concept] || 0); });
		var html = '<div class="km-search-res"><div class="sr-count">' + pages.length + ' modules cover <b>' + escHtml(concept) + '</b></div>';
		pages.forEach(function(p) {
			html += '<div class="sr-item" data-slug="' + escAttr(p.id) + '">' +
				'<div class="sr-page">' + escHtml(p.name) + '</div>' +
				'<div class="sr-title">' + escHtml(p.title) + '</div>' +
				'<div class="sr-snippet">' + escHtml(p.description || '') + '</div>' +
				'</div>';
		});
		html += '</div>';
		panelBody.innerHTML = html;
		panelBody.querySelectorAll('.sr-item').forEach(function(el) {
			el.addEventListener('mouseenter', function() { activeNode = this.dataset.slug; rebuild(false); });
			el.addEventListener('mouseleave', function() { activeNode = null; rebuild(false); });
			el.addEventListener('click', function() { var n = nodeMap[this.dataset.slug]; if (n) renderNodeDetail(n); });
		});
	}

	function renderNodeDetail(n) {
		panelTitle.textContent = n.title;
		var html = '<div class="km-node-detail">';
		html += '<div class="nd-title"><span class="nd-icon">' + (n.icon || '') + '</span>' + escHtml(n.title) + '</div>';
		html += '<div class="nd-meta">' + escHtml(n.name) + ' · Part ' + n.part + ' (' + escHtml(PARTS[n.part]) + ') · ' + n.degree + ' connections · ' + n.wordCount.toLocaleString() + ' words</div>';
		if (n.description) html += '<div class="nd-desc">' + escHtml(n.description) + '</div>';
		html += '<a class="nd-open" href="' + escAttr(n.url) + '">Open module ↗</a>';

		var conceptArr = Object.keys(n.concepts).sort(function(a, b) { return n.concepts[b] - n.concepts[a]; }).slice(0, 14);
		if (conceptArr.length) {
			html += '<div class="nd-section">Concept profile</div><div>';
			conceptArr.forEach(function(c) {
				html += '<span class="km-tag">' + escHtml(c) + ' <b>×' + n.concepts[c] + '</b></span>';
			});
			html += '</div>';
		}

		if (n.citations.length) {
			html += '<div class="nd-section">Cited sources (' + n.citations.length + ')</div>';
			html += n.citations.map(function(c) { return '<span class="km-tag">' + escHtml(c) + '</span>'; }).join('');
		}

		/* connections */
		var conns = [];
		EDGES.forEach(function(e) {
			if (e.a === n.id) conns.push({ other: e.b, e: e });
			else if (e.b === n.id) conns.push({ other: e.a, e: e });
		});
		conns.sort(function(x, y) {
			var o = typeRank(x.e) - typeRank(y.e);
			return o !== 0 ? o : (nodeMap[y.other].degree - nodeMap[x.other].degree);
		});
		var seen = {};
		conns = conns.filter(function(c) {
			var k = c.e.type + ':' + c.other;
			if (seen[k]) return false;
			seen[k] = true; return true;
		});

		if (conns.length) {
			html += '<div class="nd-section">Connected modules (' + conns.length + ')</div>';
			conns.forEach(function(c) {
				var o = nodeMap[c.other];
				var e = c.e;
				var whyParts = [];
				var cls = 'ct-' + e.type;
				if (e.type === 'citation') { cls = 'ct-citation'; whyParts.push('shared citations: <i>' + escHtml(e.citations || '') + '</i>'); }
				if (e.type === 'concept') { cls = 'ct-concept'; whyParts.push('shared concepts: <i>' + escHtml(e.concepts || '') + '</i>'); }
				if (e.type === 'link') { cls = 'ct-link'; whyParts.push('direct cross-reference'); }
				if (e.type === 'course') { cls = 'ct-course'; whyParts.push('adjacent in the learning path'); }
				html += '<div class="km-conn ' + cls + '">' +
					'<div class="cc-type">' + e.type + ' · weight ' + e.weight + '</div>' +
					'<a class="cc-name" href="' + escAttr(o.url) + '" data-slug="' + escAttr(o.id) + '">' + escHtml(o.title) + '</a>' +
					(whyParts.length ? '<div class="cc-why">' + whyParts.join('<br>') + '</div>' : '') +
					'</div>';
			});
		}

		if (n.headings.length) {
			html += '<div class="nd-section">Sections</div>';
			n.headings.forEach(function(h) {
				var link = n.url + '#' + escAttr(h.slug);
				html += '<div class="km-section-row" style="padding-left:' + ((h.level - 1) * 12) + 'px">↳ <a href="' + link + '">' + escHtml(h.text) + '</a></div>';
			});
		}

		html += '</div>';
		panelBody.innerHTML = html;

		panelBody.querySelectorAll('a[data-slug]').forEach(function(a) {
			a.addEventListener('mouseenter', function() { activeNode = this.dataset.slug; rebuild(false); });
			a.addEventListener('mouseleave', function() { activeNode = null; rebuild(false); });
			a.addEventListener('click', function(ev) {
				ev.preventDefault();
				var slug = this.dataset.slug;
				if (nodeMap[slug]) renderNodeDetail(nodeMap[slug]);
			});
		});
	}

	function typeRank(e) {
		if (e.type === 'citation') return 0;
		if (e.type === 'link') return 1;
		if (e.type === 'concept') return 2;
		return 3;
	}

	/* ── chart events ── */
	chart.on('click', function(params) {
		if (params.dataType === 'node' && params.data) {
			var n = nodeMap[params.data.id] || params.data;
			if (n) renderNodeDetail(n);
		}
	});
	chart.on('mouseover', function(params) {
		if (params.dataType === 'node') {
			/* keep label emphasis */
		}
	});

	/* ── helpers ── */
	function escHtml(s) {
		var d = document.createElement('div');
		d.appendChild(document.createTextNode(s == null ? '' : String(s)));
		return d.innerHTML;
	}
	function escAttr(s) {
		return escHtml(s).replace(/"/g, '&quot;');
	}

	document.getElementById('km-panel-close').addEventListener('click', function() {
		activeNode = null;
		renderWelcome();
	});

	/* ── keyboard ── */
	document.addEventListener('keydown', function(e) {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchInput.focus(); searchInput.select(); }
	});

	window.addEventListener('resize', function() { chart.resize(); });

	/* ── init ── */
	renderWelcome();
	rebuild(false);
	chart.setOption(buildOption());
	window.KM_chart = chart;
})();
</script>
</body>
</html>
