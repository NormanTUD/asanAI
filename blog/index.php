<?php include_once("functions.php"); ?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>From Stone Age Tools to ChatGPT</title>
	<?php load_base_js(); ?>
</head>
<body>
<div id="loader" role="status" aria-live="polite" aria-label="Loading course content">
	<div class="spinner" aria-hidden="true"></div>
	<p id="loader-status">Initializing AI Course...</p>
	<div id="loader-checklist" aria-hidden="true"></div>
</div>

<div id="contents" style="display: none">

<div class="course-hero">
	<h1>From Stone Age Tools to ChatGPT</h1>
</div>

<?php incl("From Stone Age Tools to ChatGPT: Beyond the Black Box", "intro"); ?>

<div class="course-overview">

<!-- PART I -->
<div class="course-part">
	<div class="course-part-header" style="--part-color: var(--mn-accent)">
		<h2>Foundations</h2>
		<p>Where we came from, what language is, and the mathematical bedrock beneath AI.</p>
	</div>
	<div class="course-tiles">
		<a href="intuition" class="course-tile" style="--tile-accent: var(--mn-accent)">
			<div class="course-tile-icon">&#128161;</div>
			<h3>An Intuition for LLMs</h3>
			<p>Large Language Models are next-word prediction machines. See the autoregressive loop in action.</p>
		</a>
		<a href="history" class="course-tile" style="--tile-accent: var(--mn-accent)">
			<div class="course-tile-icon">&#128220;</div>
			<h3>Brief History of AI</h3>
			<p>From stone tools to computation, the shifting currents that merged into modern AI.</p>
		</a>
		<a href="math" class="course-tile" style="--tile-accent: var(--mn-accent)">
			<div class="course-tile-icon">&#128290;</div>
			<h3>Basic Math Concepts</h3>
			<p>Functions, variables, and parameters, the classical programming vs. neural network mindset.</p>
		</a>
		<a href="language" class="course-tile" style="--tile-accent: var(--mn-accent)">
			<div class="course-tile-icon">&#128483;</div>
			<h3>The History of Language</h3>
			<p>From Sanskrit to LLMs, how millions of years of linguistic evolution led to digital minds.</p>
		</a>
		<a href="statistics" class="course-tile" style="--tile-accent: var(--mn-accent)">
			<div class="course-tile-icon">&#128200;</div>
			<h3>Statistics</h3>
			<p>AI is applied statistics. Distributions, probability, and the mathematical backbone of learning.</p>
		</a>
	</div>
</div>

<!-- PART II -->
<div class="course-part">
	<div class="course-part-header" style="--part-color: var(--mn-coral)">
		<h2>How Neural Networks Learn</h2>
		<p>The learning algorithm step by step, from loss functions to live training.</p>
	</div>
	<div class="course-tiles">
		<a href="losslab" class="course-tile" style="--tile-accent: var(--mn-coral)">
			<div class="course-tile-icon">&#127919;</div>
			<h3>Loss: Teaching through Failure</h3>
			<p>How models know they're wrong, MSE, cross-entropy, and the mathematics of measuring error.</p>
		</a>
		<a href="differentiation" class="course-tile" style="--tile-accent: var(--mn-coral)">
			<div class="course-tile-icon">&#128208;</div>
			<h3>Differentiation</h3>
			<p>The derivative: one of the most important ideas in all of mathematics, from secant to tangent.</p>
		</a>
		<a href="autodiff" class="course-tile" style="--tile-accent: var(--mn-coral)">
			<div class="course-tile-icon">&#9881;</div>
			<h3>Automatic Differentiation</h3>
			<p>How machines compute gradients at scale, the chain rule, forward and reverse mode.</p>
		</a>
		<a href="backproplab" class="course-tile" style="--tile-accent: var(--mn-coral)">
			<div class="course-tile-icon">&#8634;</div>
			<h3>Backpropagation</h3>
			<p>The 1986 algorithm that made deep learning possible, forward pass, backward pass, weight updates.</p>
		</a>
		<a href="optimizerlab" class="course-tile" style="--tile-accent: var(--mn-coral)">
			<div class="course-tile-icon">&#127757;</div>
			<h3>The Optimizer</h3>
			<p>Navigating the loss landscape, SGD, Momentum, and Adam compared interactively.</p>
		</a>
		<a href="minimalneuron" class="course-tile" style="--tile-accent: var(--mn-coral)">
			<div class="course-tile-icon">&#10024;</div>
			<h3>Smallest Neural Network</h3>
			<p>The simplest AI: y = ax + b. A single neuron, linear regression, and the birth of learning.</p>
		</a>
		<a href="activationlab" class="course-tile" style="--tile-accent: var(--mn-coral)">
			<div class="course-tile-icon">&#9889;</div>
			<h3>Activation Functions</h3>
			<p>The neural decision makers, why without non-linearity, a network collapses to nothing.</p>
		</a>
		<a href="traininglab" class="course-tile" style="--tile-accent: var(--mn-coral)">
			<div class="course-tile-icon">&#127918;</div>
			<h3>Live Training Lab</h3>
			<p>Watch a neural network learn in real time, decision boundaries, weights, and activations.</p>
		</a>
	</div>
</div>

<!-- PART III -->
<div class="course-part">
	<div class="course-part-header" style="--part-color: var(--mn-emerald)">
		<h2>Deep Learning &amp; Vision</h2>
		<p>Stacking layers, seeing images, and the engineering that makes depth possible.</p>
	</div>
	<div class="course-tiles">
		<a href="visionlab" class="course-tile" style="--tile-accent: var(--mn-emerald)">
			<div class="course-tile-icon">&#128065;</div>
			<h3>Convolutions: How Computers See</h3>
			<p>Sliding kernels, edge detection, and the CNN revolution, with interactive filters.</p>
		</a>
		<a href="deeplearninglab" class="course-tile" style="--tile-accent: var(--mn-emerald)">
			<div class="course-tile-icon">&#127961;</div>
			<h3>Deep Learning</h3>
			<p>From linear units to deep architectures, function composition and the Universal Approximation Theorem.</p>
		</a>
		<a href="overandunderfittinglab" class="course-tile" style="--tile-accent: var(--mn-emerald)">
			<div class="course-tile-icon">&#127922;</div>
			<h3>Over- and Underfitting</h3>
			<p>The delicate balance, when a model learns the pattern vs. when it memorizes the noise.</p>
		</a>
		<a href="resnetlab" class="course-tile" style="--tile-accent: var(--mn-emerald)">
			<div class="course-tile-icon">&#128739;</div>
			<h3>ResNets &amp; Vanishing Gradients</h3>
			<p>Why plain networks fail at depth, and the elegant residual shortcut that fixed everything.</p>
		</a>
		<a href="normalizationlab" class="course-tile" style="--tile-accent: var(--mn-emerald)">
			<div class="course-tile-icon">&#9878;</div>
			<h3>Layer Normalization</h3>
			<p>Keeping activations stable, the math behind GPT's pre-norm architecture.</p>
		</a>
	</div>
</div>

<!-- PART IV -->
<div class="course-part">
	<div class="course-part-header" style="--part-color: var(--mn-sky)">
		<h2>The Transformer Revolution</h2>
		<p>The architecture that changed everything, attention, embeddings, and the circuits inside.</p>
	</div>
	<div class="course-tiles">
		<a href="tokenizerlab" class="course-tile" style="--tile-accent: var(--mn-sky)">
			<div class="course-tile-icon">&#9000;</div>
			<h3>Tokenization</h3>
			<p>How words become numbers, word-level, N-gram, and subword methods compared.</p>
		</a>
		<a href="embeddinglab" class="course-tile" style="--tile-accent: var(--mn-sky)">
			<div class="course-tile-icon">&#127758;</div>
			<h3>Embeddings: Geometry of Meaning</h3>
			<p>Words as vectors in space, from Wittgenstein to Riemannian manifolds.</p>
		</a>
		<a href="attentionlab" class="course-tile" style="--tile-accent: var(--mn-sky)">
			<div class="course-tile-icon">&#128269;</div>
			<h3>Attention: The Semantic Tug-of-War</h3>
			<p>How Transformers overcome RNN signal decay, direct access across any distance.</p>
		</a>
		<a href="positionalembeddingslab" class="course-tile" style="--tile-accent: var(--mn-sky)">
			<div class="course-tile-icon">&#128255;</div>
			<h3>Positional Embeddings</h3>
			<p>Why order matters, sine, cosine, and how Transformers know which token came first.</p>
		</a>
		<a href="samplinglab" class="course-tile" style="--tile-accent: var(--mn-sky)">
			<div class="course-tile-icon">&#127922;</div>
			<h3>Temperature &amp; Sampling</h3>
			<p>How the model picks the next word, Top-k sampling, temperature, and creative randomness.</p>
		</a>
		<a href="transformer" class="course-tile course-tile-featured" style="--tile-accent: var(--mn-sky)">
			<div class="course-tile-icon">&#129516;</div>
			<h3>The Transformer Architecture</h3>
			<p>A deep interactive dive, configure heads, layers, and dimensions, then watch it compute.</p>
		</a>
		<a href="circuits" class="course-tile" style="--tile-accent: var(--mn-sky)">
			<div class="course-tile-icon">&#128268;</div>
			<h3>Circuits Inside LLMs</h3>
			<p>Mechanistic interpretability, induction heads, direct paths, and the residual stream.</p>
		</a>
		<a href="algorithms" class="course-tile" style="--tile-accent: var(--mn-sky)">
			<div class="course-tile-icon">&#128295;</div>
			<h3>How Transformers Execute Algorithms</h3>
			<p>Grokking: when networks stop memorizing and start discovering the Discrete Fourier Transform.</p>
		</a>
	</div>
</div>

<!-- PART V -->
<div class="course-part">
	<div class="course-part-header" style="--part-color: var(--mn-rose)">
		<h2>Making AI Useful</h2>
		<p>Fine-tuning, retrieval, search, safety, and the practical craft of working with LLMs.</p>
	</div>
	<div class="course-tiles">
		<a href="finetuninglab" class="course-tile" style="--tile-accent: var(--mn-rose)">
			<div class="course-tile-icon">&#127912;</div>
			<h3>Fine-Tuning &amp; RLHF</h3>
			<p>From internet scrape to human alignment, instruction pairs, reward models, and scaling laws.</p>
		</a>
		<a href="hallucinations" class="course-tile" style="--tile-accent: var(--mn-rose)">
			<div class="course-tile-icon">&#9888;</div>
			<h3>Hallucinations &amp; Dangers</h3>
			<p>Why AI lies, how pattern completion goes wrong, and using AI safely.</p>
		</a>
		<a href="rag" class="course-tile" style="--tile-accent: var(--mn-rose)">
			<div class="course-tile-icon">&#128270;</div>
			<h3>Retrieval-Augmented Generation</h3>
			<p>Giving LLMs a search engine, chunking, embedding, and the RAG pipeline.</p>
		</a>
		<a href="websearch" class="course-tile" style="--tile-accent: var(--mn-rose)">
			<div class="course-tile-icon">&#127760;</div>
			<h3>How LLMs Search the Web</h3>
			<p>Behind the scenes of tool use, intent detection, fetch, extract, and rank.</p>
		</a>
		<a href="vectorsearch" class="course-tile" style="--tile-accent: var(--mn-rose)">
			<div class="course-tile-icon">&#128279;</div>
			<h3>Semantic Search &amp; Vector Databases</h3>
			<p>Finding needles in haystacks, BM25, dense vectors, hybrid search, and ANN.</p>
		</a>
		<a href="contextwindows" class="course-tile" style="--tile-accent: var(--mn-rose)">
			<div class="course-tile-icon">&#128196;</div>
			<h3>Context Windows &amp; Memory</h3>
			<p>What LLMs can hold in mind, from GPT-2's 1K to Gemini's 1M+ tokens.</p>
		</a>
		<a href="security_inference" class="course-tile" style="--tile-accent: var(--mn-rose)">
			<div class="course-tile-icon">&#128274;</div>
			<h3>Security &amp; Adversarial Attacks</h3>
			<p>Prompt injection, jailbreaking, data poisoning, and the defenses against them.</p>
		</a>
		<a href="inference_optimization" class="course-tile" style="--tile-accent: var(--mn-rose)">
			<div class="course-tile-icon">&#9889;</div>
			<h3>Inference Optimization</h3>
			<p>Training costs millions; serving costs millions per day. Quantization, KV-cache, and distillation.</p>
		</a>
		<a href="promptengineering" class="course-tile" style="--tile-accent: var(--mn-rose)">
			<div class="course-tile-icon">&#9999;</div>
			<h3>Prompt Engineering</h3>
			<p>The practical craft of talking to LLMs, roles, delimiters, and canonicalization.</p>
		</a>
	</div>
</div>

<!-- PART VI -->
<div class="course-part">
	<div class="course-part-header" style="--part-color: var(--mn-text-secondary)">
		<h2>Bigger Questions</h2>
		<p>Philosophy, ethics, and the open problems at the frontier of AI.</p>
	</div>
	<div class="course-tiles">
		<a href="philosophy" class="course-tile" style="--tile-accent: var(--mn-text-secondary)">
			<div class="course-tile-icon">&#128218;</div>
			<h3>Philosophy &amp; Ethics</h3>
			<p>The Turing Test, the Vector Grounding Problem, Mary's Room, sentience, and what it means to think.</p>
		</a>
		<a href="appendix" class="course-tile" style="--tile-accent: var(--mn-text-secondary)">
			<div class="course-tile-icon">&#128214;</div>
			<h3>Appendix</h3>
			<p>Grokking, sine &amp; cosine, Taylor series, and the group structure of positional embeddings.</p>
		</a>
	</div>
</div>

</div>

</div>
</body>
</html>
