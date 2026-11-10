<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="Quantization, GGUF, llama.cpp, and what it takes to run a capable model on a laptop.">
	<meta name="theme-color" content="#ffffff">
	<title>Running a Model Yourself | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
</head>
<body data-lesson="running_locally" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>You do not need <em>a data centre.</em></h1>
					<p class="hero-deck">A quantized model can run on a laptop, a phone, or a single consumer GPU. The trade-off is capability and speed against control and privacy.</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> Compression makes it fit</div>
						<h2 class="section-title">Fewer bits, smaller footprint.</h2>
						<div class="prose">
							<p>The first half of the course was about how models work. The next question is where they run. A large model is too big to fit in ordinary memory at full precision. Quantization stores the weights in fewer bits, which shrinks the model and speeds up inference at the cost of some quality. The arithmetic is worth doing once: a 7B model at 16 bits needs about 14 GB for the weights alone; at 4 bits it needs about 3.5 GB. That is the difference between a data-centre GPU and a laptop.</p>
							<p>“4-bit” does not mean every weight is simply rounded to one of sixteen values. Quantizers usually work in small groups, store a scale and a zero point per group, and keep sensitive layers at higher precision. The result is not identical to the original; it is a different model with a similar behaviour and a smaller memory footprint (<a href="https://arxiv.org/abs/2305.14314" rel="noopener">Dettmers et al., 2023</a>; <a href="https://arxiv.org/abs/2210.17323" rel="noopener">Frantar et al., 2023</a>).</p>
							<p>GGUF is a common file format for quantized models. Engines such as <a href="https://github.com/ggerganov/llama.cpp" rel="noopener">llama.cpp</a> run it efficiently on CPUs and consumer GPUs; <a href="https://ollama.com/" rel="noopener">Ollama</a> and <a href="https://lmstudio.ai/" rel="noopener">LM Studio</a> wrap the engine in a friendlier interface. The format matters because it packages the weights, the tokenizer, and the metadata together, so the engine does not have to guess how the model was built.</p>
						</div>
					</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> What local gives you</div>
						<h2 class="section-title">Privacy, control, and a trade-off.</h2>
						<div class="prose">
							<p>Local inference keeps your data on your machine. It works offline, has no per-token bill, and lets you experiment without an API. On Apple Silicon, unified memory makes larger models practical on a laptop.</p>
							<p>The trade-off is real: a local model is usually smaller or more compressed than a frontier API model. For many tasks that is enough; for the hardest ones it is not. A hybrid is common: local for drafts, search, and private data; cloud for the hard final answer. And local does not automatically mean private: logs, plugins, and network calls can still leak information. The privacy case depends on the whole stack, not only on where the weights run.</p>
							<p>Quality is the other hidden variable. A 4-bit model can be close to its 16-bit parent on many tasks and noticeably worse on long reasoning chains, code, and rare languages. The only reliable test is your own evaluation set, run on both versions. “It runs” is not the same as “it is good enough”.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Quantization</b><span>Store weights in fewer bits to fit the model into memory.</span></div>
							<div class="keypoint"><b>GGUF</b><span>A common format for local, quantized models.</span></div>
							<div class="keypoint"><b>Engines</b><span>llama.cpp, Ollama, and LM Studio run the model.</span></div>
							<div class="keypoint"><b>Trade-offs</b><span>Local means privacy and control, but often less capability.</span></div>
						</div>
					</section>

					<section class="section-block" id="start">
						<div class="section-kicker"><span class="sk-num">03</span> Your first local model</div>
						<h2 class="section-title">Pick your shell, run three commands.</h2>
						<div class="prose">
							<p>The fastest route is <a href="https://ollama.com/" rel="noopener">Ollama</a>. Install it once, pull a small model, and run it. The commands are the same idea on every platform; the shell syntax is different. Choose your system:</p>
						</div>
						<div class="code-tabs" role="group" aria-label="Choose your shell">
							<button class="chip is-on" type="button" data-shell="unix">Linux / macOS</button>
							<button class="chip" type="button" data-shell="powershell">Windows PowerShell</button>
							<button class="chip" type="button" data-shell="cmd">Windows CMD</button>
						</div>
						<div class="code-block is-on" data-shell-panel="unix">
						<pre><code># install Ollama (Linux; on macOS use the app or: brew install ollama)
curl -fsSL https://ollama.com/install.sh | sh

# download and run a small model
ollama pull llama3.1:8b
ollama run llama3.1:8b "Explain transformers in three sentences."

# check what is running and what you have
ollama ps
ollama list</code></pre>
						</div>
						<div class="code-block" data-shell-panel="powershell">
						<pre><code># install Ollama (or download the Windows installer from ollama.com)
winget install Ollama.Ollama

# download and run a small model
ollama pull llama3.1:8b
ollama run llama3.1:8b "Explain transformers in three sentences."

# call the local API from PowerShell
Invoke-RestMethod http://localhost:11434/api/generate -Method Post -Body '{"model":"llama3.1:8b","prompt":"Hello"}'</code></pre>
						</div>
						<div class="code-block" data-shell-panel="cmd">
						<pre><code>:: install Ollama from ollama.com, then open a new terminal
ollama pull llama3.1:8b
ollama run llama3.1:8b "Explain transformers in three sentences."
ollama ps
ollama list</code></pre>
						</div>
						<div class="prose">
							<p>If you prefer llama.cpp directly, the CLI is one binary plus a model file. On Linux or macOS: <code>./llama-cli -m model.gguf -p "Hello" -n 200</code>. On Windows the binary is <code>llama-cli.exe</code>. The <code>-n</code> flag is the number of tokens to generate; <code>-c</code> sets the context window.</p>
							<p>Start small. A 7B or 8B model at 4-bit is the easiest first run; it fits on a laptop and downloads quickly. Move up only when a task actually fails. The <strong>quantization level</strong> is the next knob: Q4_K_M is a common balance, Q5 or Q6 preserve more quality, Q2 or Q3 are smaller but noticeably rougher. The <strong>context length</strong> is the memory multiplier: a long conversation needs a larger KV cache, so a model that fits at 4K may not fit at 32K.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Install</b><span>Ollama is the shortest path; llama.cpp is the reference engine.</span></div>
							<div class="keypoint"><b>Pull and run</b><span><code>ollama pull</code>, then <code>ollama run</code>.</span></div>
							<div class="keypoint"><b>Quantization</b><span>Q4_K_M is a good default; higher Q keeps more quality.</span></div>
							<div class="keypoint"><b>Context</b><span>The KV cache grows with context length and can break the fit.</span></div>
						</div>
					</section>

					<section class="section-block" id="extra">
						<div class="section-kicker"><span class="sk-num">04</span> The hardware reality</div>
						<h2 class="section-title">VRAM, unified memory, context.</h2>
						<div class="prose">
							<p>The weights are only part of the memory bill. A model also needs room for activations, the KV cache, and the runtime. The KV cache grows with the context length, so a long conversation can use much more memory than the model alone.</p>
							<p>Consumer GPUs have limited VRAM. Apple Silicon uses unified memory, which lets the CPU and GPU share a large pool; that is why a laptop can run a 70B model in 4-bit. A server GPU has more compute but less memory per dollar than a large unified-memory machine.</p>
							<p>Quantization trades quality for size and speed. A 4-bit model is much smaller than a 16-bit model, but it is not identical. The right choice depends on the task, the hardware, and whether privacy or control matters more than raw capability. Fine-tuning locally is possible too, especially with parameter-efficient methods such as LoRA (<a href="https://arxiv.org/abs/2106.09685" rel="noopener">Hu et al., 2021</a>) and 4-bit QLoRA (<a href="https://arxiv.org/abs/2305.14314" rel="noopener">Dettmers et al., 2023</a>), but that is a separate decision from inference.</p>
						</div>
					</section>

					<div class="demo demo--paper" data-demo="vram">
						<div class="demo-head">
							<div>
								<p class="demo-title">Will it fit? <span>· demo</span></p>
								<p class="demo-sub">Choose a model, a precision, and a device. The estimate is a rough starting point, not a benchmark.</p>
							</div>
							<span class="demo-badge">estimate</span>
						</div>
						<div class="demo-body">
							<div class="calc-grid">
								<div class="calc-field">
									<label for="vram-model">Parameters</label>
									<select id="vram-model" data-vram-model>
										<option value="7">7B</option>
										<option value="13">13B</option>
										<option value="70">70B</option>
										<option value="120">120B</option>
									</select>
								</div>
								<div class="calc-field">
									<label for="vram-bits">Weight precision</label>
									<select id="vram-bits" data-vram-bits>
										<option value="4">4-bit</option>
										<option value="8">8-bit</option>
										<option value="16">16-bit</option>
									</select>
								</div>
								<div class="calc-field">
									<label for="vram-device">Device memory</label>
									<select id="vram-device" data-vram-device>
										<option value="8">Phone · 8 GB</option>
										<option value="16">Laptop · 16 GB</option>
										<option value="24">GPU · 24 GB</option>
										<option value="64">Mac · 64 GB</option>
										<option value="320">Server · 320 GB</option>
									</select>
								</div>
							</div>
							<div class="demo-readout">
								<div><b>Weights + overhead</b><span data-vram-mem>...</span></div>
								<div><b>Fit</b><span data-vram-fit>...</span></div>
								<div><b>Precision</b><span>quantized</span></div>
							</div>
							<p class="mix-note" data-vram-note>Weights plus rough runtime overhead. Context length and KV cache can add several more gigabytes.</p>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>The estimate is a starting point; context and KV cache add more.</span></div>
					</div>






					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">05</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">Local AI trades some capability for ownership.</p>
							<p class="aha-sub">The question is not 'can it run?' but 'is it good enough, fast enough, and private enough for this task?'</p>
						</div>
					</section>
				</article>
			</div>
		</div>
	</main>

	<script>
	(function () {
		"use strict";
		document.querySelectorAll("[data-shell]").forEach(function (btn) {
			btn.addEventListener("click", function () {
				var key = btn.getAttribute("data-shell");
				document.querySelectorAll("[data-shell]").forEach(function (b) { b.classList.toggle("is-on", b === btn); });
				document.querySelectorAll("[data-shell-panel]").forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-shell-panel") === key); });
			});
		});
	})();
	</script>
	<script src="assets/site.js?v=<?php echo filemtime(__DIR__.'/assets/site.js'); ?>"></script>
	<script src="assets/demos.js?v=<?php echo filemtime(__DIR__.'/assets/demos.js'); ?>"></script>
</body>
</html>
