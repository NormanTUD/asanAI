<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The December Calendar
description: Thirty-one days, thirty-one doors — a guided December through the ideas that make modern AI and LLMs understandable.
icon: &#127876;
part: 6
order: 18
color: rose
topics: history, language, society, philosophy
tags: interested-layman
featured: true
-->

<?php
$mn_december_lessons = [];
foreach (parse_course_metadata() as $mn_part => $mn_modules) {
	foreach ($mn_modules as $mn_module) {
		$mn_december_lessons[$mn_module['slug']] = $mn_module;
	}
}

$mn_december_days = [
	1 => [
		'title' => 'The Machine That Predicts the Next Word',
		'blurb' => 'Start with the single idea the whole course is built on: an LLM is a next-token predictor. Follow one word through tokenization, attention, and sampling — and see why prediction can look like understanding.',
		'slugs' => ['intuition'],
	],
	2 => [
		'title' => 'Where AI Came From',
		'blurb' => 'A compact history of the currents that converged on modern AI: counting and logic, the perceptron, the first AI winter, and the hardware that made deep learning possible.',
		'slugs' => ['history'],
	],
	3 => [
		'title' => 'The Mathematical Bedrock',
		'blurb' => 'The mathematical language every network speaks: sums, functions, and logarithms; then vectors, matrices, tensors, and the operations that combine them.',
		'slugs' => ['math_i', 'math_ii'],
	],
	4 => [
		'title' => 'Space and Language',
		'blurb' => 'First the working geometry of a forward pass — similarity, projection, symmetry. Then the long human history that turned language into something a machine can process.',
		'slugs' => ['geometry_ii', 'language'],
	],
	5 => [
		'title' => 'Thinking in Distributions',
		'blurb' => 'Real data is not noise. Distributions, Bayes, entropy, and Markov chains are how AI reasons under uncertainty and how an LLM models the next token.',
		'slugs' => ['statistics_i', 'statistics_ii'],
	],
	6 => [
		'title' => 'Failure as a Teacher',
		'blurb' => 'A model learns from a loss function, and the simplest model shows how: one weight, one bias, and a line that tries to fit the data.',
		'slugs' => ['losslab', 'minimalneuron'],
	],
	7 => [
		'title' => 'How a Network Learns From Its Mistakes',
		'blurb' => 'The derivative is the learning signal; backpropagation is how it reaches every weight. This is the engine that made deep learning possible.',
		'slugs' => ['derivativelab', 'backproplab'],
	],
	8 => [
		'title' => 'Gradients at Scale',
		'blurb' => 'Automatic differentiation makes backprop practical at scale; optimizers turn gradients into a path downhill. Meet the machinery behind every training run.',
		'slugs' => ['autodiff', 'optimizerlab'],
	],
	9 => [
		'title' => 'From Gates to Goals',
		'blurb' => 'Non-linear gates give a network its expressive power. Reinforcement learning gives it a way to learn from reward — the machinery behind RLHF, DPO, and GRPO.',
		'slugs' => ['activationlab', 'reinforcement_learning'],
	],
	10 => [
		'title' => 'Stacking Layers',
		'blurb' => 'Deep learning is function composition. See why depth beats width, what overfitting looks like, and how a model can memorize without understanding.',
		'slugs' => ['deeplearninglab', 'overandunderfittinglab'],
	],
	11 => [
		'title' => 'Going Deeper, Staying Stable',
		'blurb' => 'Residual connections made very deep networks trainable; layer normalization kept them stable. Together they are the plumbing of every modern transformer block.',
		'slugs' => ['resnetlab', 'normalizationlab'],
	],
	12 => [
		'title' => 'From Words to Vectors',
		'blurb' => 'Tokenization chops text into pieces; embeddings place those pieces in a geometric space where meaning has directions and distances.',
		'slugs' => ['tokenizerlab', 'embeddinglab'],
	],
	13 => [
		'title' => 'Memory and Attention',
		'blurb' => 'Recurrent networks carry state through a loop; attention lets every token look directly at every other. The second idea changed everything.',
		'slugs' => ['recurrent_networks', 'attentionlab'],
	],
	14 => [
		'title' => 'The Transformer, Assembled',
		'blurb' => 'Position tells the model what order it is in; the transformer combines embeddings, attention, and feed-forward layers into the architecture behind modern LLMs.',
		'slugs' => ['positionalembeddingslab', 'transformer'],
	],
	15 => [
		'title' => 'Choosing the Next Token',
		'blurb' => 'A model outputs a probability distribution, not a sentence. Sampling decides what comes out; mechanistic interpretability asks what is happening inside.',
		'slugs' => ['samplinglab', 'mechanistic_interpretability'],
	],
	16 => [
		'title' => 'Facts and Algorithms',
		'blurb' => 'Where does "Paris" live inside a network? And how can a transformer execute an algorithm that exists only in its prompt?',
		'slugs' => ['fact_lookup', 'algorithms'],
	],
	17 => [
		'title' => 'What Machines See and Understand',
		'blurb' => 'Convolution learns to see edges, parts, and objects; multimodal models connect those pixels to words. Two chapters on how machines understand images.',
		'slugs' => ['computer_vision', 'multimodal'],
	],
	18 => [
		'title' => 'Making Images, Sound, and Video',
		'blurb' => 'Diffusion models generate images by learning to reverse noise; speech and music models turn sound into tokens. The generative stack beyond text.',
		'slugs' => ['diffusion', 'speech_audio', 'music_video_generation'],
	],
	19 => [
		'title' => 'The Making of an Assistant',
		'blurb' => 'A pretrained model becomes useful through post-training. Behind the assistant sits a carefully curated dataset — and a long pipeline from raw text to instruction-following.',
		'slugs' => ['finetuninglab', 'training_data'],
	],
	20 => [
		'title' => 'When the Model Needs the World',
		'blurb' => 'Why models lie, and how retrieval gives them documents they were never trained on. RAG, web search, and the pipeline that puts fresh knowledge in front of the model.',
		'slugs' => ['hallucinations', 'rag', 'websearch'],
	],
	21 => [
		'title' => 'Agents, Memory, and the Search Underneath',
		'blurb' => 'An agent wraps an LLM in a loop with tools, a scratchpad, and a plan. The context window is the memory it all lives in — and the vector index is how it finds things.',
		'slugs' => ['agents', 'vectorsearch', 'contextwindows'],
	],
	22 => [
		'title' => 'Safety and Sovereignty',
		'blurb' => 'Prompt injection and jailbreaks are not bugs you can patch once. And if you want privacy or offline use, you can run a capable model on your own machine.',
		'slugs' => ['security_inference', 'running_locally'],
	],
	23 => [
		'title' => 'Thinking and Measuring',
		'blurb' => 'Chain-of-thought and test-time compute make models reason longer; benchmarks try to measure whether the result is real.',
		'slugs' => ['reasoning', 'evaluation'],
	],
	24 => [
		'title' => 'Trust and the Craft of Asking',
		'blurb' => 'Why confidence is not correctness, and how calibration and abstention can make a model\'s uncertainty useful. Then the practical craft of talking to an LLM.',
		'slugs' => ['reliability', 'promptengineering'],
	],
	25 => [
		'title' => 'The Money and the Map',
		'blurb' => 'Why inference is a different computation from training; what a token actually costs; and who is building frontier models outside Silicon Valley.',
		'slugs' => ['inference_vs_training', 'ai_economics', 'global_ai_ecosystem'],
	],
	26 => [
		'title' => 'The Mind Behind the Machine',
		'blurb' => 'The evolved mind that made computation possible, and the two-way mirror between brains and machines.',
		'slugs' => ['human_mind', 'mirror_in_machine'],
	],
	27 => [
		'title' => 'The Frontier and the Alignment Problem',
		'blurb' => 'What the research frontier is betting on next — and the alignment problem that has to be solved for any of it to be safe.',
		'slugs' => ['frontier', 'alignment'],
	],
	28 => [
		'title' => 'Rules and Minds',
		'blurb' => 'The legal landscape around AI, and the philosophical questions underneath it: reason, grounding, consciousness, and what it means to think.',
		'slugs' => ['law_regulation', 'philosophy'],
	],
	29 => [
		'title' => 'Surprises and Discovery',
		'blurb' => 'The abilities nobody trained for — in-context learning, chain-of-thought, world models — and the models now turning prediction into scientific discovery.',
		'slugs' => ['unexpected_capabilities', 'ai_for_science'],
	],
	30 => [
		'title' => 'Society and Survival',
		'blurb' => 'How AI is changing art, work, education, and truth — and a neutral survey of the existential-risk hypothesis, separated from what remains speculation.',
		'slugs' => ['ai_and_society', 'ai_existential_risk'],
	],
	31 => [
		'title' => 'Myths and the Map of Everything',
		'blurb' => 'The stories we tell about AI, read as modern folklore, and the map of everything: a globe of every person, place, and idea in the course. Close the year by zooming out.',
		'slugs' => ['myths', 'atlas'],
	],
];

function mn_december_accent(int $part): string {
	$map = [
		1 => 'sky',
		2 => 'emerald',
		3 => 'accent',
		4 => 'coral',
		5 => 'rose',
		6 => 'text-secondary',
	];
	return $map[$part] ?? 'accent';
}

function mn_december_part_label(array $parts): string {
	$parts = array_values(array_unique(array_map('intval', $parts)));
	sort($parts);
	if (!$parts) return '';
	if (count($parts) === 1) return 'Part ' . $parts[0];
	return 'Parts ' . $parts[0] . '–' . end($parts);
}

function mn_december_part_title(array $parts): string {
	$parts = array_values(array_unique(array_map('intval', $parts)));
	sort($parts);
	if (!$parts) return '';
	$titles = course_part_titles();
	$names = [];
	foreach ($parts as $part) {
		$names[] = 'Part ' . $part . (isset($titles[$part]['title']) ? ' · ' . $titles[$part]['title'] : '');
	}
	return implode(' / ', $names);
}

$mn_december_article_count = 0;
$mn_december_parts_seen = [];
foreach ($mn_december_days as $mn_day) {
	foreach ($mn_day['slugs'] as $mn_slug) {
		if (!isset($mn_december_lessons[$mn_slug])) continue;
		$mn_december_article_count++;
		$mn_december_parts_seen[(int)$mn_december_lessons[$mn_slug]['part']] = true;
	}
}
$mn_december_today = (int)date('n') === 12 ? (int)date('j') : 0;
?>

<div class="md" data-lesson-id="december">
## Thirty-One Doors into AI

This December, the course opens one door a day. Each door is a short reading path — one, two, or three chapters that belong together — and the sequence follows the course itself: from the first intuition about next-token prediction, through the mathematics of learning and the transformer, to retrieval, agents, safety, and the larger questions.

The calendar is curated for a reader who wants to understand what modern AI and LLMs are and how they work, not for someone who wants to train a model from scratch. The mathematical chapters are here where they earn their place; the specialist engineering chapters are left as optional side doors. Read one door a day in December, or use the page as a map and jump to whatever you need.

**How to use it:** read the day's articles in the order listed. The opening days are gentle; the middle is the technical core; the last week zooms out. Every article is interactive, and the whole calendar is just a guided path through the existing course.
</div>

<div class="mn-december-meta">
	<span><strong>31</strong> days</span>
	<span><strong><?php echo $mn_december_article_count; ?></strong> articles</span>
	<span><strong><?php echo count($mn_december_parts_seen); ?></strong> parts</span>
	<span>Curated for a general reader</span>
</div>

<div class="mn-december-legend" aria-label="Color key for course parts">
<?php
$mn_december_part_titles = course_part_titles();
foreach ($mn_december_part_titles as $mn_part_num => $mn_part_info):
	$mn_part_color = mn_december_accent((int)$mn_part_num);
?>
	<span><i style="--legend-color: var(--mn-<?php echo htmlspecialchars($mn_part_color); ?>)"></i>Part <?php echo (int)$mn_part_num; ?> · <?php echo htmlspecialchars($mn_part_info['title']); ?></span>
<?php endforeach; ?>
</div>

<?php if ($mn_december_today > 0): ?>
<p class="mn-december-today-jump"><a href="#day-<?php echo $mn_december_today; ?>">Open today's door →</a></p>
<?php endif; ?>

<div class="mn-december-grid">
<?php foreach ($mn_december_days as $mn_day_num => $mn_day): ?>
<?php
	$mn_day_parts = [];
	foreach ($mn_day['slugs'] as $mn_slug) {
		if (isset($mn_december_lessons[$mn_slug])) {
			$mn_day_parts[] = (int)$mn_december_lessons[$mn_slug]['part'];
		}
	}
	if (!$mn_day_parts) continue;
	$mn_day_part_label = mn_december_part_label($mn_day_parts);
	$mn_day_part_title = mn_december_part_title($mn_day_parts);
	$mn_day_accent = mn_december_accent(min($mn_day_parts));
	$mn_is_today = ($mn_december_today === (int)$mn_day_num);
?>
	<article class="mn-december-day<?php echo $mn_is_today ? ' is-today' : ''; ?>" id="day-<?php echo (int)$mn_day_num; ?>" style="--day-accent: var(--mn-<?php echo htmlspecialchars($mn_day_accent); ?>)" aria-labelledby="day-<?php echo (int)$mn_day_num; ?>-title">
		<div class="mn-december-day-top">
			<span class="mn-december-day-num" aria-hidden="true"><?php echo str_pad((string)$mn_day_num, 2, '0', STR_PAD_LEFT); ?></span>
			<span class="mn-december-day-part" title="<?php echo htmlspecialchars($mn_day_part_title); ?>"><?php echo htmlspecialchars($mn_day_part_label); ?></span>
			<?php if ($mn_is_today): ?><span class="mn-december-today">Today</span><?php endif; ?>
		</div>
		<h3 id="day-<?php echo (int)$mn_day_num; ?>-title"><?php echo htmlspecialchars($mn_day['title']); ?></h3>
		<p class="mn-december-blurb"><?php echo htmlspecialchars($mn_day['blurb']); ?></p>
		<ol class="mn-december-articles">
<?php foreach ($mn_day['slugs'] as $mn_slug): ?>
<?php
			if (!isset($mn_december_lessons[$mn_slug])) continue;
			$mn_lesson = $mn_december_lessons[$mn_slug];
?>
			<li><a href="<?php echo htmlspecialchars($mn_lesson['url']); ?>" title="<?php echo htmlspecialchars($mn_lesson['description'] ?? ''); ?>"><?php echo htmlspecialchars($mn_lesson['title']); ?></a></li>
<?php endforeach; ?>
		</ol>
	</article>
<?php endforeach; ?>
</div>

<div class="md">
## Further Doors

The calendar deliberately leaves out the specialist engineering chapters — distributed training, serving stacks, inference kernels — and the deepest mathematical excursions into topology, sheaves, and category theory. They are all still in the course. Use the [course overview](index.php) to browse the full shelf, or open the [Atlas](atlas.php) for a different way through the same material: a globe of every person, place, and idea that appears in these pages.
</div>

<style>
.mn-december-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem 1.1rem;
	margin: 0.2rem 0 0.9rem;
	padding: 0.7rem 0.95rem;
	background: var(--mn-bg-subtle);
	border-left: 3px solid var(--mn-accent);
	border-radius: 0 var(--mn-radius-sm) var(--mn-radius-sm) 0;
	font-size: 0.8rem;
	color: var(--mn-text-secondary);
}
.mn-december-meta strong {
	color: var(--mn-heading);
	font-weight: 600;
}
.mn-december-legend {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
	gap: 0.4rem 0.9rem;
	margin: 0 0 1.2rem;
	font-family: var(--mn-font-mono);
	font-size: 0.64rem;
	letter-spacing: 0.03em;
	color: var(--mn-text-muted);
}
.mn-december-legend span {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
}
.mn-december-legend i {
	display: inline-block;
	width: 0.5rem;
	height: 0.5rem;
	border-radius: 999px;
	background: var(--legend-color, var(--mn-accent));
}
.mn-december-today-jump {
	margin: 0 0 1.1rem;
	font-family: var(--mn-font-mono);
	font-size: 0.75rem;
}
.mn-december-today-jump a {
	color: var(--mn-accent);
	text-decoration: none;
	border-bottom: 1px solid currentColor;
}
.mn-december-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
	gap: 0.9rem;
	margin: 0 0 1.8rem;
}
.mn-december-day {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	min-width: 0;
	padding: 0.95rem 1rem 1rem;
	background: var(--mn-surface);
	border: 1px solid var(--mn-border);
	border-top: 3px solid var(--day-accent, var(--mn-accent));
	border-radius: var(--mn-radius-md);
	scroll-margin-top: 90px;
	transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
}
.mn-december-day:hover {
	border-color: var(--day-accent, var(--mn-accent));
	box-shadow: 0 8px 22px -12px var(--mn-border);
	transform: translateY(-1px);
}
.mn-december-day.is-today {
	background: var(--mn-bg-warm);
	box-shadow: 0 0 0 2px var(--day-accent, var(--mn-accent));
}
.mn-december-day-top {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 0.5rem;
}
.mn-december-day-num {
	font-family: var(--mn-font-heading);
	font-size: 1.85rem;
	font-weight: 700;
	line-height: 0.9;
	color: var(--day-accent, var(--mn-accent));
	font-variant-numeric: tabular-nums;
}
.mn-december-day-part {
	font-family: var(--mn-font-mono);
	font-size: 0.61rem;
	line-height: 1.25;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	color: var(--mn-text-muted);
}
.mn-december-today {
	margin-left: auto;
	padding: 0.08rem 0.4rem;
	border: 1px solid currentColor;
	border-radius: 999px;
	font-family: var(--mn-font-mono);
	font-size: 0.58rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--day-accent, var(--mn-accent));
}
.mn-december-day h3 {
	margin: 0.15rem 0 0;
	font-size: 1rem;
	line-height: 1.28;
	color: var(--mn-heading);
}
.mn-december-blurb {
	margin: 0;
	font-size: 0.82rem;
	line-height: 1.45;
	color: var(--mn-text-secondary);
}
.mn-december-articles {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	margin: auto 0 0;
	padding: 0.6rem 0 0;
	border-top: 1px solid var(--mn-border-light);
	list-style: none;
	font-size: 0.84rem;
	line-height: 1.35;
}
.mn-december-articles li {
	position: relative;
	padding-left: 0.9rem;
}
.mn-december-articles li::before {
	content: "→";
	position: absolute;
	left: 0;
	top: 0.08em;
	font-family: var(--mn-font-mono);
	font-size: 0.68rem;
	color: var(--day-accent, var(--mn-accent));
}
.mn-december-articles a {
	color: var(--mn-text);
	text-decoration: none;
	border-bottom: 1px solid transparent;
}
.mn-december-articles a:hover,
.mn-december-articles a:focus-visible {
	color: var(--day-accent, var(--mn-accent));
	border-bottom-color: currentColor;
	text-decoration: none;
}
@media (max-width: 600px) {
	.mn-december-grid {
		grid-template-columns: 1fr;
	}
}
@media (prefers-reduced-motion: reduce) {
	.mn-december-day {
		transition: none;
	}
	.mn-december-day:hover {
		transform: none;
	}
}
</style>
