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

<!--
	TODO: Mathe I, II, III, Statistics I, II, depending on where you are, to lower the amount of it at once
-->

<div id="contents" style="display: none">
<?php
	#incl('Derivatives: How AI "Learns" to get better', "derivativelab");
	#incl("Topology and the Geometry of Thought", "topology");

	incl("From Stone Age Tools to ChatGPT: Beyond the Black Box", "intro");
	incl("An Intuition of how Large Language Models (LLMs) work", "intuition");
	incl("Brief History of AI", "history");
	incl("Basic math concepts", "math");
	incl("The History of Language: From Sanskrit to LLMs", "language");
	incl("Statistics: A useful helper in AI", "statistics");
	incl("Loss: Teaching through Failure", "losslab");
	incl('Differentiation: The Mathematics of Change', "differentiation");
	incl('Automatic Differentiation: How Machines Learn', "autodiff");
	incl("Backpropagation: How a Neural Network Learns From Its Mistakes", "backproplab");
	incl("The Optimizer: Navigating the Loss Landscape", "optimizerlab");
	incl("Smallest possible neural network", "minimalneuron");
	incl("Activation Functions: The Neural Decision Makers", "activationlab");
	incl("Live Training of a Neural Network", "traininglab");
	incl("Convolutions: How a Computer Learns to See", "visionlab");
	incl("Deep Learning", "deeplearninglab");
	incl("Over- and underfitting", "overandunderfittinglab");
	incl("Deep Learning Mechanics: ResNets & Vanishing Gradients", "resnetlab");
	incl("Understanding Layer Normalization", "normalizationlab");
	incl("Tokenization: How Words become Numbers", "tokenizerlab");
	incl("Embeddings: The Geometry of Meaning", "embeddinglab");
	incl("The Semantic Tug-of-War: How Transformers 'Think'", "attentionlab");
	incl("Positional Embeddings", "positionalembeddingslab");
	incl("Temperature & Sampling", "samplinglab");
	incl("The Architecture of Meaning: A Deep Dive into Transformers", "transformer");
	incl("Fine-Tuning: From Internet Scrape to Human Alignment", "finetuninglab");
	incl("Hallucinations and Dangers of AI and How to use AI Safely", "hallucinations");
	incl("Retrieval-Augmented Generation: Giving LLMs a Search Engine", "rag");
	incl("How LLMs Search the Web: Behind the Scenes", "websearch");
	incl("Semantic Search & Vector Databases: Finding Needles in Haystacks", "vectorsearch");
	incl("Context Windows & Memory: What LLMs Can Hold in Mind", "contextwindows");
	incl("Security & Adversarial Attacks", "security_inference");
	incl("Inference Optimization", "inference_optimization");
	incl("Prompt Engineering: How to talk to LLMs", "promptengineering");
	incl("Philosophical and societal implications, ethical usage of AI", "philosophy");
	incl("Appendix", "appendix");
?>
</div>
</body>
</html>
