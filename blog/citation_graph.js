window.citationGraph = {
	// --- Modern LLMs & Scaling ---
	"ouyang2022instructgpt": [
		"kaplan2020scaling",
		"vaswani2017attention",
		"christiano2017rlhf", // Added (see below)
		"brown2020gpt3"       // Added (see below)
	],
	"kaplan2020scaling": [
		"vaswani2017attention",
		"lstm",
		"shannon1948communication" // Entropic capacity
	],
	"vaswani2017attention": [
		"bahdanau2014",       // Original Attention
		"sutskever2014seq2seq", // Added (The Seq2Seq foundation)
		"lstm",               // Comparison baseline
		"ba2016layernorm",
		"he2015resnet"        // Residual connections
	],
	"firstgpt": [ // GPT-1
		"vaswani2017attention",
		"rumelhart1986",      // Backprop
		"bengio2003neural"    // Neural Language Models
	],

	// --- Deep Learning Boom (2010s) ---
	"he2015resnet": [
		"krizhevsky2012imagenet",
		"simonyan2014vgg",    // Added (VGG)
		"ba2016layernorm",    // Normalization context
		"glorot2011deep"      // Initialization
	],
	"krizhevsky2012imagenet": [ // AlexNet
		"lecun1989backpropagation", // CNNs
		"lecun1998gradientbased",
		"rumelhart1986",
		"srivastava2014dropout", // (Note: AlexNet used dropout, Srivastava later formalized it)
		"nair2010rectified",      // ReLU
		"hubelwiesel1962"
	],
	"mikolov2013word2vec": [
		"bengio2003neural",
		"rumelhart1986"
	],
	"srivastava2014dropout": [
		"krizhevsky2012imagenet",
		"rumelhart1986"
	],

	// --- The Neural Renaissance (1980s - 2000s) ---
	"lecun1998gradientbased": [
		"lecun1989backpropagation",
		"rumelhart1986",
		"neocognitron"
	],
	"lecun1989backpropagation": [
		"rumelhart1986",
		"fukushima1980" // Neocognitron
	],
	"rumelhart1986": [
		"werbos1974",          // The true origin of backprop
		"minskyperceptrons",   // Rebutting the XOR problem
		"widrow1960adaline",    // Added (Delta rule)
		"linnainmaa1976",
		"rosenblatt1958perceptron",
		"polyak1964"
	],
	"lstm": [ // Hochreiter & Schmidhuber 1997
		"rumelhart1986",
		"hochreiter1991vanishing",
		"elman1990finding"     // Added (Simple Recurrent Networks)
	],
	"bengio2003neural": [
		"shannon1948communication", // N-grams smoothing comparison
		"rumelhart1986"
	],

	// --- The First Wave & AI Winter (1940s - 1970s) ---
	"minskyperceptrons": [
		"rosenblattperceptron",
		"mccullochpitts1943",
		"turing1937"
	],
	"rosenblattperceptron": [
		"mccullochpitts1943",
		"hebb1949organizationofbehaviour",
		"vonneumann"
	],
	"mccullochpitts1943": [
		"turing1937",
		"russell1910principia", // Added (Logical foundations)
		"cajaltextura"          // Neuroscience inspiration
	],
	"turing1950computing": [
		"turing1937",
		"lovelacequote",       // "Lady Lovelace's Objection"
		"shannon1948communication"
	],
	"turing1937": [
		"godel1931incompleteness", // Added (The Halting problem precursor)
		"hilbert1928entscheidung"  // Added (The problem being solved)
	],
	"shannon1948communication": [
		"nyquist1924certain",      // Added (Sampling)
		"hartley1928transmission", // Added (Information measure)
		"boltzmann1896",
		"boltzmann"                // Entropy concept
	],

	// --- Foundations (Pre-20th Century) ---
	"boltzmann": [
		"laplace1812analytic"      // Probability theory
	],
	"laplace1810clt": [
		"bayes1763essay",
		"gauss1809"
	],
	"bool1854": [
		"aristotleanalytics",       // Syllogistic logic
		"poisson1837"
	],
	"russell1910principia": [
		"bool1854",
		"frege1879begriffsschrift" // Added (Formal logic notation)
	],

	"bortkiewicz1898": ["poisson1837"],

	"hilbert1928entscheidung": ["russell1910principia"],
	"godel1931incompleteness": ["russell1910principia"],
	"turing1937": ["hilbert1928entscheidung", "godel1931incompleteness"],

	// --- Information Theory & Early Neural Nets ---
	"hartley1928transmission": ["nyquist1924certain"],
	"rosenblatt1958perceptron": ["mccullochpitts1943", "hebb1949"],

	// --- The Backprop & Deep Learning Era ---
	"minsky1969perceptrons": ["rosenblatt1958perceptron"],
	"hornik1991": ["rumelhart1986"],
	"elman1990finding": ["rumelhart1986"],

	// --- Modern Transformer & LLM Era ---
	"bahdanau2014": ["elman1990finding"],
};
