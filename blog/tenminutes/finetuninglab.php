<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="Pretraining, SFT, preference optimization, and the post-training stack that makes a model helpful.">
	<meta name="theme-color" content="#ffffff">
	<title>Turning a Predictor into an Assistant | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
</head>
<body data-lesson="finetuninglab" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>The assistant is <em>made after pretraining.</em></h1>
					<p class="hero-deck">A pretrained model is a very good internet simulator. It does not yet follow instructions, refuse harmful requests, or hold a conversation. Post-training is how it becomes an assistant.</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> From raw text to instructions</div>
						<h2 class="section-title">Teaching the format.</h2>
						<div class="prose">
							<p>Sampling chose tokens. Now the predictor becomes an assistant. Pretraining teaches next-token prediction on a huge corpus: the <a href="intuition">next-token loop</a>. The result is fluent but uncontrolled. Supervised fine-tuning then shows the model examples of instructions and good answers, teaching it the format of a conversation (<a href="https://arxiv.org/abs/2203.02155" rel="noopener">Ouyang et al., 2022</a>).</p>
							<p>Fine-tuning changes behaviour, when to answer, when to refuse, how to structure a response, and which tone to use. Why not just prompt? A prompt can shape one conversation; fine-tuning bakes a behaviour into the weights, so it survives across prompts and users.</p>
						</div>
					</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> Preferences and reasoning</div>
						<h2 class="section-title">Aligning behaviour.</h2>
						<div class="prose">
							<p>Preference optimization goes further. Humans (or a model) compare answers, and the model is trained to prefer the better one. RLHF first trains a model to predict human preferences, then optimises answers against that learned judge (<a href="https://arxiv.org/abs/1706.03741" rel="noopener">Christiano et al., 2017</a>). DPO skips the separate judge: it directly raises the probability of the preferred answer relative to the rejected one (<a href="https://arxiv.org/abs/2305.18290" rel="noopener">Rafailov et al., 2023</a>). Catastrophic forgetting means that narrow instruction data can erase abilities from pretraining; that is why labs mix general text back in.</p>
							<p>Reasoning models add another stage: reinforcement learning on problems with verifiable answers (<a href="https://arxiv.org/abs/2501.12948" rel="noopener">Guo et al., 2025</a>), building on DeepSeekMath (<a href="https://arxiv.org/abs/2402.03300" rel="noopener">Shao et al., 2024</a>), so the model learns to think longer and check its work. The total post-training cost is small compared with pretraining, but it shapes most of what users experience. It cannot add knowledge the base model never saw, and narrow instruction data can degrade general language ability.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Pretraining</b><span>Next-token prediction on a large corpus creates a raw model.</span></div>
							<div class="keypoint"><b>SFT</b><span>Instruction examples teach the assistant format.</span></div>
							<div class="keypoint"><b>Preferences</b><span>Comparing answers aligns the model with human judgments.</span></div>
							<div class="keypoint"><b>Reasoning RL</b><span>Verifiable tasks can teach the model to think longer.</span></div>
						</div>
					</section>

					<section class="section-block" id="refusal">
						<div class="section-kicker"><span class="sk-num">03</span> The refusal direction</div>
						<h2 class="section-title">One axis can flip a refusal.</h2>
						<div class="prose">
							<p>Refusal is learned during post-training, and it leaves a surprisingly simple trace in the weights. <a href="https://arxiv.org/abs/2406.11717" rel="noopener">Arditi et al. (2024)</a> studied 13 open-source chat models up to 72B parameters and found that refusal is mediated by a <strong>one-dimensional subspace</strong>. They estimate a single direction from the difference in mean activations between harmful and harmless instructions, and it is both necessary and sufficient: erase that direction from the residual stream and the model stops refusing harmful requests; add it and the model refuses even harmless ones.</p>
							<p>The projection of the current activation onto that direction behaves like a scalar “how much the model wants to refuse right now.” The direction is not a moral module and the threshold is not a universal constant. The paper shows that a rank-one weight edit can remove the behaviour while benchmark accuracy barely moves, which is why the result matters for both safety and interpretability.</p>
							<p>The demo below is a schematic, not a measurement on a real model. Move the request along the refusal axis and set the threshold. The point is the shape of the mechanism: one projection, one comparison, one answer.</p>
						</div>
						<div class="demo demo--paper" data-demo="refusal">
							<div class="demo-head">
								<div>
									<p class="demo-title">Where refusal crosses the line <span>· demo</span></p>
									<p class="demo-sub">Click the plane or drag the sliders. Move the request along the refusal direction and set the threshold; nothing else in the model changes, only the projection onto one axis decides the answer.</p>
								</div>
								<span class="demo-badge">schematic</span>
							</div>
							<div class="demo-body">
								<canvas class="demo-canvas demo-canvas--md" data-refusal-canvas aria-label="A request vector projected onto the refusal direction, with a threshold that flips the answer"></canvas>
								<div class="demo-controls">
									<label>Projection r·h <input type="range" data-refusal-proj min="-1" max="1" step="0.01" value="0.32"><output data-refusal-proj-out>0.32</output></label>
									<label>Threshold θ <input type="range" data-refusal-threshold min="-0.5" max="0.8" step="0.01" value="0.45"><output data-refusal-threshold-out>0.45</output></label>
								</div>
								<div class="demo-readout demo-readout--3">
									<div><b>Projection</b><span data-refusal-value>...</span></div>
									<div><b>Threshold</b><span data-refusal-threshold-value>...</span></div>
									<div><b>Answer</b><span data-refusal-status>...</span></div>
								</div>
								<p class="demo-hint" data-refusal-note></p>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Refusal is not a separate module bolted on top. In these models it is a direction in the residual stream, and its projection is a single number.</span></div>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>One direction</b><span>Refusal is mediated by a one-dimensional subspace across 13 chat models.</span></div>
							<div class="keypoint"><b>Necessary and sufficient</b><span>Erasing it stops refusal; adding it causes refusal of harmless prompts.</span></div>
							<div class="keypoint"><b>Brittle</b><span>A rank-one weight edit can remove the behaviour with little benchmark change.</span></div>
							<div class="keypoint"><b>Schematic</b><span>The demo shows the projection and threshold, not a measurement.</span></div>
						</div>
					</section>

					<div class="demo demo--paper timeline-shell" data-demo="timeline" data-arrow-nav>
						<div class="demo-head">
							<div>
								<p class="demo-title">From raw model to assistant <span>· demo</span></p>
								<p class="demo-sub">Post-training is a pipeline. Select a stage to see what it adds.</p>
							</div>
						</div>
						<div class="demo-body">
							<div class="timeline-scroller">
								<button class="tl-scroll-btn" type="button" data-timeline-prev data-arrow-prev aria-label="Scroll left">‹</button>
								<div class="timeline-track" data-timeline-track role="group" aria-label="From raw model to assistant">
									<button class="tl-node is-active" type="button" data-meta="01 · Base" data-title="Pretraining" data-body="Next-token prediction on a huge corpus creates a fluent but uncontrolled model."><span class="tl-dot"></span><span class="tl-date">01</span><span class="tl-name">Base</span></button>
									<button class="tl-node" type="button" data-meta="02 · SFT" data-title="Supervised fine-tuning" data-body="Instruction-and-answer examples teach the format of a conversation and the shape of a helpful response."><span class="tl-dot"></span><span class="tl-date">02</span><span class="tl-name">SFT</span></button>
									<button class="tl-node" type="button" data-meta="03 · Prefs" data-title="Preference optimization" data-body="Humans or a model compare answers. The model learns to prefer the better one, using RLHF or DPO-style methods."><span class="tl-dot"></span><span class="tl-date">03</span><span class="tl-name">Prefs</span></button>
									<button class="tl-node" type="button" data-meta="04 · Reason" data-title="Reasoning RL" data-body="Verifiable problems teach the model to think longer, backtrack, and check its work."><span class="tl-dot"></span><span class="tl-date">04</span><span class="tl-name">Reason</span></button>
								</div>
								<button class="tl-scroll-btn" type="button" data-timeline-next data-arrow-next aria-label="Scroll right">›</button>
							</div>
							<div class="tl-panel no-figure" data-timeline-panel aria-live="polite"></div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>Each stage adds a different kind of behaviour: format, preferences, then reasoning.</span></div>
					</div>

					<div class="demo demo--paper" data-demo="preference" data-arrow-nav>
						<div class="demo-head">
							<div>
								<p class="demo-title">A preference pair <span>· demo</span></p>
								<p class="demo-sub">Which answer would you prefer for: <span data-pref-question>...</span></p>
							</div>
							<span class="demo-badge">RLHF / DPO</span>
						</div>
						<div class="demo-body">
							<div class="pref-grid">
								<button class="pref-card" type="button" data-pref="a"><b>Answer A</b><p></p></button>
								<button class="pref-card" type="button" data-pref="b"><b>Answer B</b><p></p></button>
							</div>
							<div class="demo-controls">
								<button class="btn-demo" type="button" data-pref-next data-arrow-next>Another pair →</button>
							</div>
							<div class="demo-readout">
								<div><b>Your choice</b><span data-pref-choice>...</span></div>
								<div><b>Signal</b><span data-pref-signal>...</span></div>
								<div><b>What changes</b><span>the policy</span></div>
							</div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>A preference pair is training data. The model learns the judgment behind the choice, not only the words of the answer.</span></div>
					</div>







					<section class="section-block" id="lora">
						<div class="section-kicker"><span class="sk-num">04</span> Making it affordable</div>
						<h2 class="section-title">LoRA, QLoRA, and when to fine-tune.</h2>
						<div class="prose">
							<p>Full fine-tuning updates every weight and needs memory for gradients, optimizer state, and activations. <strong>LoRA</strong> (<a href="https://arxiv.org/abs/2106.09685" rel="noopener">Hu et al., 2021</a>) freezes the base model and trains two small low-rank matrices per layer. Instead of changing a d×d matrix, it learns ΔW = B·A with factors of size r×d and d×r. With d = 4096 and r = 8, that is 65,536 numbers instead of 16.7 million, about 256 times fewer. The bet is that the task-specific change is low-dimensional: it shifts a few directions, not the whole space. That works well for a style or a format; it is the wrong tool for genuinely new knowledge. The adapter stays tiny and can be swapped at inference. <strong>QLoRA</strong> (<a href="https://arxiv.org/abs/2305.14314" rel="noopener">Dettmers et al., 2023</a>) quantizes the frozen base to 4-bit and trains the adapters on top, which is how a single consumer GPU can fine-tune a 7B model.</p>
							<details class="collapse-card">
								<summary class="cc-label">The low-rank arithmetic</summary>
								<p>Full fine-tuning stores gradients and Adam state for every parameter, often three to four times the model size. LoRA stores two factors with 2·r·d numbers; at d = 4096 and r = 8 that is 65,536. The saving is real, but the assumption is about the task change, not about the model being low-dimensional in general.</p>
							</details>
							<p>Fine-tuning is not the first tool to reach for. Try prompting, few-shot examples, and retrieval first. Fine-tune when you need a consistent style or format, a domain vocabulary, or a narrow task with many examples. It is a poor way to add fresh facts: the knowledge has to come from data, and narrow instruction data can erase earlier abilities. A practical recipe mixes some general data back in, holds out a real evaluation set, and compares against the base model before shipping.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>LoRA</b><span>Train small low-rank adapters; keep the base frozen.</span></div>
							<div class="keypoint"><b>QLoRA</b><span>Quantize the base to 4-bit, train adapters on top.</span></div>
							<div class="keypoint"><b>Data</b><span>Quality and coverage matter more than the optimizer.</span></div>
							<div class="keypoint"><b>When not to</b><span>Use prompting, retrieval, or tools before fine-tuning.</span></div>
						</div>
					</section>

					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">05</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">Most of the assistant's personality is learned after pretraining.</p>
							<p class="aha-sub">The base model supplies the language; post-training supplies the behaviour.</p>
						</div>
					</section>
				</article>
			</div>
		</div>
	</main>

	<script src="assets/site.js?v=<?php echo filemtime(__DIR__.'/assets/site.js'); ?>"></script>
	<script src="assets/demos.js?v=<?php echo filemtime(__DIR__.'/assets/demos.js'); ?>"></script>
</body>
</html>
