<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="What a context window is, why it is not human memory, and how attention cost shapes long conversations.">
	<meta name="theme-color" content="#ffffff">
	<title>The Memory It Can Hold | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
</head>
<body data-lesson="contextwindows" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>The model only knows <em>what is in the window.</em></h1>
					<p class="hero-deck">A context window is not a persistent memory. It is the entire input the model can see in one forward pass: system prompt, history, documents, and your new question.</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> A fixed input buffer</div>
						<h2 class="section-title">Everything competes for space.</h2>
						<div class="prose">
							<p>Attention can only see the window. Every token in the conversation occupies space in it. When the window is full, something has to be dropped, summarised, or moved outside the model. The model does not remember earlier turns unless they are still in the window.</p>
							<p>Window sizes have grown from a thousand tokens to hundreds of thousands or more. Why not make the window infinite? Because attention over a long sequence is expensive and the model still has to find the relevant part. A larger window is a larger desk, not a better filing system.</p>
						</div>
					</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> Why long context is hard</div>
						<h2 class="section-title">Attention has a cost.</h2>
						<div class="prose">
							<p>Self-attention (<a href="https://arxiv.org/abs/1706.03762" rel="noopener">Vaswani et al., 2017</a>) compares every token with every other token, so the cost grows roughly quadratically with length. For knowledge outside the window, systems use retrieval: search a document store and inject the relevant passages. That is why context and RAG are close cousins.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Input buffer</b><span>The context window is the model's entire view for one inference.</span></div>
							<div class="keypoint"><b>Token budget</b><span>System prompt, history, documents, and query all compete for space.</span></div>
							<div class="keypoint"><b>Attention cost</b><span>Longer sequences make attention more expensive.</span></div>
							<div class="keypoint"><b>Retrieval</b><span>External search extends what the model can use.</span></div>
						</div>
					</section>

					<section class="section-block" id="extra">
						<div class="section-kicker"><span class="sk-num">03</span> Working memory in practice</div>
						<h2 class="section-title">Long context is not free.</h2>
						<div class="prose">
							<p>The KV cache stores the keys and values for every token in the context, so the model does not recompute the past at every step. The cache grows with the context length and can dominate memory during long conversations (<a href="https://arxiv.org/abs/2309.06180" rel="noopener">Kwon et al., 2023</a>). Efficient attention kernels (<a href="https://arxiv.org/abs/2205.14135" rel="noopener">Dao et al., 2022</a>) help with the arithmetic, not with that memory bill.</p>
							<p>Long-context models also have to learn to use the middle of a long window; information near the start or end is often easier to retrieve (<a href="https://arxiv.org/abs/2307.03172" rel="noopener">Liu et al., 2023</a>). Retrieval and long context are complementary: the window decides how much the model can see, and retrieval decides what is worth seeing.</p>
						</div>
					</section>

					<div class="demo demo--paper" data-demo="budget">
						<div class="demo-head">
							<div>
								<p class="demo-title">The context budget <span>· demo</span></p>
								<p class="demo-sub">Everything the model sees competes for one budget. Shrink the window and watch history and documents fall out.</p>
							</div>
							<span class="demo-badge">live</span>
						</div>
						<div class="demo-body">
							<div class="budget-stack">
								<div class="budget-row" data-budget-block data-tokens="800" data-required="1">
									<span class="budget-label">System prompt</span>
									<span class="budget-track"><span class="budget-fill"></span></span>
									<span class="budget-tokens">800</span>
								</div>
								<div class="budget-row" data-budget-block data-tokens="120" data-required="1">
									<span class="budget-label">Your question</span>
									<span class="budget-track"><span class="budget-fill"></span></span>
									<span class="budget-tokens">120</span>
								</div>
								<div class="budget-row" data-budget-block data-tokens="1600">
									<span class="budget-label">Conversation</span>
									<span class="budget-track"><span class="budget-fill"></span></span>
									<span class="budget-tokens">1,600</span>
								</div>
								<div class="budget-row" data-budget-block data-tokens="2400">
									<span class="budget-label">Documents</span>
									<span class="budget-track"><span class="budget-fill"></span></span>
									<span class="budget-tokens">2,400</span>
								</div>
							</div>
							<div class="demo-controls">
								<label>Window <input type="range" data-budget-window min="2" max="8" step="1" value="4"><output data-budget-window-out>4k tokens</output></label>
							</div>
							<div class="demo-readout">
								<div><b>Window</b><span>2-8k</span></div>
								<div><b>Free</b><span data-budget-free>...</span></div>
								<div><b>What falls out</b><span>history / docs</span></div>
							</div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>A bigger window helps, but it is still a budget. Retrieval exists because the model cannot keep everything in view.</span></div>
					</div>






					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">04</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">A context window is working memory, not a database.</p>
							<p class="aha-sub">If it is not in the window, the model cannot use it, unless a retrieval system puts it there.</p>
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
