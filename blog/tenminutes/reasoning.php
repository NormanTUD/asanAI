<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="Chain-of-thought, self-consistency, test-time compute, and the shift from bigger training to longer inference.">
	<meta name="theme-color" content="#ffffff">
	<title>Thinking Longer | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
</head>
<body data-lesson="reasoning" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>The model can <em>think longer.</em></h1>
					<p class="hero-deck">For years, scaling meant training a bigger model. Reasoning models add another axis: give the model more computation at inference time and let it explore, check, and revise.</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> Thinking in the open</div>
						<h2 class="section-title">Use the context as a scratchpad.</h2>
						<div class="prose">
							<p>Prompting was how to ask. Now the model can spend more computation before answering. Chain-of-thought prompting (<a href="https://arxiv.org/abs/2201.11903" rel="noopener">Wei et al., 2022</a>) asks the model to write intermediate steps instead of jumping to an answer. On arithmetic and logic, this often improves accuracy because the model can use the context as a scratchpad (the context window). It is not a different model or a hidden reasoning module: the model is still predicting tokens, but the intermediate tokens give the later predictions more to condition on.</p>
							<p>Self-consistency (<a href="https://arxiv.org/abs/2203.11171" rel="noopener">Wang et al., 2022</a>) samples several reasoning paths and takes the majority answer. Tree of thoughts (<a href="https://arxiv.org/abs/2305.10601" rel="noopener">Yao et al., 2023</a>) explores branches and evaluates them. These methods trade more computation for better answers. They work best when the problem has a checkable answer and the model's errors are not correlated; if every path makes the same wrong assumption, voting does not save you.</p>
							<p><strong>Chain-of-thought as a scratchpad.</strong> The steps are not a separate reasoning module. They are tokens the model writes into the context and then reads back, so a fixed-depth forward pass can carry out a computation of unbounded length. Nye et al. (2021) showed the effect directly: a frozen language model could add, evaluate polynomials, and execute short programs when it was asked to emit intermediate results into a <a href="https://arxiv.org/abs/2112.00114" rel="noopener">scratchpad</a>. The context window is the working memory; the written tokens are the intermediate state.</p>
							<p>A 2026 Anthropic study found a second, silent workspace inside the model. The <a href="https://transformer-circuits.pub/2026/workspace/index.html" rel="noopener">J-space</a> is a small set of internal representations that the model can report, hold in mind, and use for multi-step reasoning even when they never appear in the output. It is not the written scratchpad: it operates in the residual stream, in one forward pass. The authors connect it to the global workspace theory of conscious access, while noting that the transformer has no recurrent loops and that the result says nothing about whether the model feels anything. The <a href="philosophy">philosophy page</a> takes up that question; here the practical point is that a model can think in two registers, one written and one silent.</p>
						</div>
					</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> Learning to reason</div>
						<h2 class="section-title">More compute, more checking.</h2>
						<div class="prose">
							<p>The o1/R1 generation goes further: the model is trained with reinforcement learning on problems that can be checked (<a href="https://arxiv.org/abs/2402.03300" rel="noopener">Shao et al., 2024</a>), so it learns when to think longer, backtrack, and verify. The reasoning process can be much longer than the final answer. A user-facing “summary of reasoning” may be only that: a summary. It is not a guaranteed transcript of the computation that produced the answer, and a fluent explanation can be reconstructed after the fact.</p>
							<p>More thinking is not always better. The model can reason confidently in the wrong direction, long chains are expensive, and on a simple task the extra tokens add latency without improving the answer. The useful question is whether the extra computation buys a real improvement on the task, not whether the explanation sounds thorough. The practical pattern is generate, then verify: use a checker when the answer can be checked, and a second model or prompt when it cannot.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Chain-of-thought</b><span>Write intermediate steps instead of jumping to an answer.</span></div>
							<div class="keypoint"><b>Self-consistency</b><span>Sample multiple paths and compare answers.</span></div>
							<div class="keypoint"><b>Test-time compute</b><span>Spend more computation during inference.</span></div>
							<div class="keypoint"><b>Verification</b><span>Checking is as important as generating.</span></div>
						</div>
					</section>


					<figure>
						<img src="../image.php?f=theseus_minotaur_mosaic.jpg&amp;w=900&amp;q=82" alt="Theseus and the Minotaur mosaic" loading="lazy">
						<figcaption>Theseus and the Minotaur, House of the Labyrinth, Pompeii. Mosaic: ancient Roman, <a href="https://commons.wikimedia.org/wiki/File:Theseus_and_the_Minotaur_mosaic_Room_42_(Mau-Overbeck_1884_plans)_House_of_the_Labyrinth_Pompeii.jpg" rel="noopener">public domain</a>.</figcaption>
					</figure>

					<div class="demo demo--paper" data-demo="reasoning">
						<div class="demo-head">
							<div>
								<p class="demo-title">Fast answer, or checked answer <span>· demo</span></p>
								<p class="demo-sub">The same model. One path jumps; the other spends tokens on the steps. Then sample five paths and see what voting does.</p>
							</div>
							<span class="demo-badge">interactive</span>
						</div>
						<div class="demo-body">
							<div class="chip-row" data-reasoning-problems></div>
							<p class="prose" style="margin:12px 0 0"><strong>Problem:</strong> <span data-reasoning-question></span></p>
							<div class="seg" style="margin-top:12px" data-reasoning-modes>
								<button type="button" data-reasoning-mode="answer">Answer only</button>
								<button class="is-on" type="button" data-reasoning-mode="steps">Think step by step</button>
							</div>
							<div class="cot-steps" data-reasoning-steps></div>
							<p class="cot-answer" data-reasoning-answer></p>
							<div class="demo-kpis">
								<div class="demo-kpi"><b>Tokens</b><span data-reasoning-tokens>...</span></div>
								<div class="demo-kpi"><b>Confidence</b><span data-reasoning-confidence>...</span></div>
							</div>
							<div class="demo-controls">
								<button class="btn-demo btn-demo--green" type="button" data-reasoning-sample>Sample 5 paths →</button>
								<button class="btn-demo" type="button" data-reasoning-reset>Reset</button>
							</div>
							<p class="demo-hint" data-reasoning-votes></p>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>Thinking longer helps when the steps can be checked. Majority voting only helps when the errors are not all identical.</span></div>
					</div>






					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">03</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">Intelligence can be bought at inference time, not only at training time.</p>
							<p class="aha-sub">Thinking longer helps when the extra steps can be checked; otherwise it just costs more.</p>
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
