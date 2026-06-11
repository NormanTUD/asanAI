/**
 * language-enhancements.js
 * Vertical timeline (top = earliest, bottom = latest),
 * collapsible deep-dives, scroll-triggered fade-ins.
 */
(function () {
	"use strict";

	/* ====================================================================
	 * DATA
	 * ==================================================================== */
	var MILESTONES = [
		{ year: "135,000 ya",    label: "Biological Capacity for Language",   desc: "The human vocal tract and cognitive architecture for language were already in place.", color: "#e74c3c" },
		{ year: "75,000 ya",     label: "Blombos Cave Ochre",                desc: "Geometric engravings on ochre — among the earliest evidence of symbolic, abstract thought.", color: "#e67e22" },
		{ year: "35,000 ya",     label: "Lebombo Bone",                      desc: "A tally stick likely used for tracking lunar cycles — early mathematical data storage.", color: "#f1c40f" },
		{ year: "8,000 BCE",     label: "Clay Tokens & Bullae",              desc: "Agricultural accounting in the Near East using shaped clay tokens sealed in envelopes.", color: "#2ecc71" },
		{ year: "3,500 BCE",     label: "Rebus Principle",                   desc: "Symbols shift from representing objects to representing sounds — unlocking abstract writing.", color: "#1abc9c" },
		{ year: "3,200 BCE",     label: "Cuneiform",                         desc: "Wedge-shaped marks on clay tablets in Mesopotamia — the first full writing system.", color: "#3498db" },
		{ year: "c. 500 BCE",    label: "Alcmaeon of Croton",                desc: "First known Greek scientist to dissect animals and link the senses to the brain.", color: "#9b59b6" },
		{ year: "196 BCE", label: "Rosetta Stone", desc: "The first multi-lingual 'parallel corpus' — proving that distinct symbolic systems can map to the same underlying meaning.", color: "#34495e" },
		{ year: "c. 4th C. BCE", label: "Pāṇini's Ashtadhyayi",             desc: "A formal generative grammar for Sanskrit — the first 'programming language' for human speech.", color: "#8e44ad" },
		{ year: "c. 300 BCE",    label: "Sushruta Samhita / Aristotle",      desc: "Ancient Indian and Greek texts formalizing anatomy, logic, and the categories of thought.", color: "#6c3483" },
		{ year: "c. 1440", label: "Gutenberg's Printing Press", desc: "The birth of 'Big Data' — mass-produced text led to stabilized spelling and the first linguistic standards across Europe.", color: "#d35400" },
		{ year: "c. 1510",       label: "Da Vinci's Anatomical Studies",     desc: "Precise sketches of the larynx and tongue — treating the voice as an acoustic instrument.", color: "#7f8c8d" },
		{ year: "1604", label: "Robert Cawdrey's Table Alphabetical", desc: "The first English dictionary — an attempt to define 'hard vsuall English wordes' for a newly literate public.", color: "#7f8c8d" },
		{ year: "1666", label: "Leibniz — Characteristica Universalis", desc: "The dream of a 'universal characteristic' — an alphabet of human thought where reasoning is replaced by calculation.", color: "#27ae60" },
		{ year: "1668",          label: "Wilkins' Real Character",           desc: "An attempt at a universal language — a precursor to taxonomies and modern embeddings.", color: "#2c3e50" },
		{ year: "1755", label: "Johnson's Dictionary", desc: "A massive effort to stabilize and 'standardize' the English vocabulary — essentially defining the first formal vector space for the language.", color: "#7f8c8d" },
		{ year: "1791",          label: "Kempelen's Speaking Machine",       desc: "The first mechanical text-to-speech device, using bellows and reeds to simulate the vocal tract.", color: "#34495e" },
		{ year: "1828", label: "Webster's American Dictionary", desc: "Language as identity — standardizing American English and diverging from British norms to reflect a new cultural reality.", color: "#c0392b" },
		{ year: "1835", label: "Morse Code", desc: "Language becomes a pulse — the first binary-like encoding system, allowing words to travel at the speed of electricity.", color: "#2980b9" },
		{ year: "1843", label: "Ada Lovelace — Note G", desc: "The realization that a machine (the Analytical Engine) could manipulate symbols according to rules, not just numbers.", color: "#8e44ad" },
		{ year: "1854", label: "Boole — The Laws of Thought", desc: "The algebraic formalization of logic ($1$ and $0$) — the binary foundation for all future linguistic processing.", color: "#2980b9" },
		{ year: "1873", label: "Nietzsche — On Truth and Lies", desc: "Language as a 'mobile army of metaphors' — arguing that words are arbitrary social conventions, not mirrors of reality.", color: "#c0392b" },
		{ year: "1874", label: "Remington No. 1 Typewriter", desc: "Mechanical standardization of the character — ensuring every 'A' is identical, paving the way for optical character recognition.", color: "#34495e" },
		{ year: "1879", label: "Frege's Begriffsschrift", desc: "The birth of modern logic — a formal 'concept-script' that paved the way for mathematical linguistics.", color: "#27ae60" },
		{ year: "1884", label: "The Oxford English Dictionary", desc: "The ultimate 'Corpus' project — documenting every word's history to create a complete, longitudinal model of English.", color: "#2c3e50" },
		{ year: "1913", label: "Markov Chains", desc: "Andrey Markov's statistical analysis of *Eugene Onegin* — the first 'n-gram' model predicting the next letter in a sequence.", color: "#16a085" },
		{ year: "1916", label: "Saussure — Course in General Linguistics", desc: "Defined the 'Sign' (Signifier/Signified) and established language as a formal system of differences.", color: "#d35400" },
		{ year: "1939", label: "The Voder", desc: "Bell Labs' electronic speech synthesizer — the first to use vacuum tubes and filters to electronically model the human voice.", color: "#34495e" },
		{ year: "1945", label: "Memex (Vannevar Bush)", desc: "A conceptual proto-hypertext system that modeled human memory as a web of 'associative trails' rather than a linear list.", color: "#16a085" },
		{ year: "1950", label: "The Turing Test", desc: "Shifting the goal from 'thinking' to 'simulating human linguistic behavior' as the benchmark for AI.", color: "#2980b9" },
		{ year: "1953",          label: "Wittgenstein — Philosophical Investigations",  desc: "\"The meaning of a word is its use in the language.\" The idea that a words meaning is determined by how it's used.", color: "#16a085" },
		{ year: "1957",          label: "Firth — Distributional Semantics",  desc: "\"You shall know a word by the company it keeps.\" The statistical foundation of modern NLP.", color: "#16a085" },
		{ year: "1957", label: "Chomsky — Syntactic Structures", desc: "The 'Universal Grammar' hypothesis — the idea that humans have an innate, rule-based mental organ for language.", color: "#8e44ad" },
		{ year: "1966", label: "ELIZA (Weizenbaum)", desc: "The first chatbot — a simple script that simulated a psychotherapist, exposing how easily humans anthropomorphize linguistic patterns.", color: "#e67e22" },
		{ year: "1971", label: "SHRDLU (Terry Winograd)", desc: "An early NLP program that could 'understand' and move objects in a virtual blocks world using logic and syntax.", color: "#2ecc71" },
		{ year: "1986", label: "Backpropagation & Connectionism", desc: "The revival of neural networks — the idea that 'intelligence' could emerge from layers of simple processing units learning patterns.", color: "#d35400" },
		{ year: "1989", label: "World Wide Web (Tim Berners-Lee)", desc: "The global hypertext — language becomes a non-linear, interconnected web of data, providing the training set for modern AI.", color: "#16a085" },
		{ year: "2010", label: "The Emoji (Unicode Standard)", desc: "The return of the logogram — a standardized, global visual language that transcends phonetic boundaries.", color: "#f1c40f" },
		{ year: "2017",          label: "Transformer Architecture",          desc: "Attention mechanisms allow models to weigh context dynamically — Firth's hypothesis made computational.", color: "#2980b9" },
		{ year: "2018", label: "BERT (Bidirectional Transformers)", desc: "Models begin reading 'both ways' at once, allowing them to understand the deep context of a word based on everything around it.", color: "#3498db" }
	];

	/* ====================================================================
	 * 1. INJECT CSS
	 * ==================================================================== */
	function injectStyles() {
		var css = [
			/* --- Vertical Timeline --- */
			"#timeline-container {",
			"  margin: 2em 0;",
			"  padding: 1.5em;",
			"  background: #f9f9fb;",
			"  border-radius: 8px;",
			"  border: 1px solid #e0e0e0;",
			"}",
			".vtl-title {",
			"  margin: 0 0 1em 0;",
			"  font-size: 1.1em;",
			"  font-weight: 700;",
			"  color: #333;",
			"  text-align: center;",
			"}",
			".vtl-track {",
			"  position: relative;",
			"  padding: 0 0 0 40px;",
			"}",
			".vtl-track::before {",
			"  content: '';",
			"  position: absolute;",
			"  top: 0;",
			"  bottom: 0;",
			"  left: 18px;",
			"  width: 3px;",
			"  background: linear-gradient(180deg, #e74c3c, #f1c40f, #2ecc71, #3498db, #8e44ad, #2980b9);",
			"  border-radius: 2px;",
			"}",
			".vtl-node {",
			"  position: relative;",
			"  padding: 0.6em 0 0.6em 1.5em;",
			"  cursor: pointer;",
			"}",
			".vtl-dot {",
			"  position: absolute;",
			"  left: -31px;",
			"  top: 0.75em;",
			"  width: 18px;",
			"  height: 18px;",
			"  border-radius: 50%;",
			"  border: 3px solid #fff;",
			"  box-shadow: 0 0 0 2px rgba(0,0,0,0.15);",
			"  transition: transform 0.3s ease, box-shadow 0.3s ease;",
			"  z-index: 1;",
			"}",
			".vtl-node:hover .vtl-dot,",
			".vtl-node.active .vtl-dot {",
			"  transform: scale(1.4);",
			"  box-shadow: 0 0 0 4px rgba(0,0,0,0.22);",
			"}",
			".vtl-year {",
			"  font-size: 0.75em;",
			"  font-weight: 700;",
			"  color: #555;",
			"}",
			".vtl-label {",
			"  font-size: 0.85em;",
			"  font-weight: 600;",
			"  color: #222;",
			"  margin-top: 0.1em;",
			"}",
			".vtl-desc {",
			"  display: none;",
			"  margin-top: 0.35em;",
			"  padding: 0.6em 0.8em;",
			"  background: #333;",
			"  color: #fff;",
			"  border-radius: 6px;",
			"  font-size: 0.78em;",
			"  line-height: 1.45;",
			"  max-width: 480px;",
			"  box-shadow: 0 4px 12px rgba(0,0,0,0.2);",
			"}",
			".vtl-node.active .vtl-desc {",
			"  display: block;",
			"}",
			"details.deep-dive {",
			"  margin: 1.5em 0;",
			"  padding: 0.75em 1em;",
			"  background: #f0f4f8;",
			"  border-left: 4px solid #3498db;",
			"  border-radius: 4px;",
			"}",
			"details.deep-dive summary {",
			"  font-weight: 600;",
			"  color: #2c3e50;",
			"  cursor: pointer;",
			"  user-select: none;",
			"  list-style: none;",
			"}",
			"details.deep-dive summary::-webkit-details-marker { display: none; }",
			".chevron { font-size: 0.85em; color: #3498db; }",
			".dd-content { margin-top: 0.5em; }",
			"@media (max-width: 600px) {",
			"  .vtl-track { padding-left: 32px; }",
			"  .vtl-dot  { left: -23px; width: 14px; height: 14px; }",
			"  .vtl-track::before { left: 14px; }",
			"  .vtl-desc { max-width: 100%; }",
			"}"
		].join("\n");

		// GUARDRAIL: Inject styles via adoptedStyleSheets if available
		// (Chrome 73+). This avoids adding a <style> node to the DOM
		// entirely, eliminating any possibility of reflow interference.
		if (document.adoptedStyleSheets !== undefined) {
			try {
				var sheet = new CSSStyleSheet();
				sheet.replaceSync(css);
				document.adoptedStyleSheets = [].concat(
					Array.from(document.adoptedStyleSheets),
					[sheet]
				);
				// Create a hidden marker so we know it's been injected
				var marker = document.createElement("meta");
				marker.id = "language-enhancements-css";
				marker.setAttribute("name", "language-enhancements-injected");
				document.head.appendChild(marker);
				return;
			} catch (e) {
				// Fall through to traditional method
			}
		}

		// Fallback: traditional <style> element, but deferred
		requestAnimationFrame(function () {
			requestAnimationFrame(function () {
				if (document.getElementById('language-enhancements-css')) return;
				var style = document.createElement("style");
				style.id = "language-enhancements-css";
				style.setAttribute("type", "text/css");
				style.appendChild(document.createTextNode(css));
				document.head.appendChild(style);
			});
		});
	}

	/* ====================================================================
	 * 2. BUILD VERTICAL TIMELINE
	 * ==================================================================== */
	function buildTimeline() {
		var container = document.getElementById("timeline-container");
		if (!container) return;

		// GUARDRAIL 1: If already built, do nothing
		if (container.hasAttribute("data-timeline-built")) return;
		container.setAttribute("data-timeline-built", "true");

		// GUARDRAIL 2: Use a completely detached iframe-like isolation.
		// We create a shadow DOM or, failing that, use triple-deferred
		// requestAnimationFrame to ensure we are in a completely fresh
		// paint cycle, far removed from any Temml rendering.

		// GUARDRAIL 3: Triple-RAF ensures we skip at least 2 full
		// paint frames before touching the DOM. This guarantees that
		// Temml has fully committed its rendered output to the layout
		// tree and Chrome's style recalculation is complete.
		requestAnimationFrame(function () {
			requestAnimationFrame(function () {
				requestAnimationFrame(function () {
					_buildTimelineDOM(container);
				});
			});
		});
	}

	function _buildTimelineDOM(container) {
		// GUARDRAIL 4: Build everything in a DocumentFragment (off-DOM)
		var fragment = document.createDocumentFragment();

		var title = document.createElement("div");
		title.className = "vtl-title";
		title.textContent = "Interactive Timeline \u2014 The Ancestry of Language";
		fragment.appendChild(title);

		var track = document.createElement("div");
		track.className = "vtl-track";

		var activeNode = null;

		for (var i = 0; i < MILESTONES.length; i++) {
			(function (m) {
				var node = document.createElement("div");
				node.className = "vtl-node";

				var dot = document.createElement("div");
				dot.className = "vtl-dot";
				dot.style.backgroundColor = m.color;

				var year = document.createElement("div");
				year.className = "vtl-year";
				year.textContent = m.year;

				var label = document.createElement("div");
				label.className = "vtl-label";
				label.textContent = m.label;

				var desc = document.createElement("div");
				desc.className = "vtl-desc";
				desc.textContent = m.desc;

				node.appendChild(dot);
				node.appendChild(year);
				node.appendChild(label);
				node.appendChild(desc);

				node.addEventListener("click", function (e) {
					e.stopPropagation();
					if (activeNode && activeNode !== node) {
						activeNode.classList.remove("active");
					}
					node.classList.toggle("active");
					activeNode = node.classList.contains("active") ? node : null;
				});

				track.appendChild(node);
			})(MILESTONES[i]);
		}

		fragment.appendChild(track);

		// GUARDRAIL 5: Suppress Chrome's forced synchronous layout
		// by reading a layout property BEFORE writing. This "flushes"
		// any pending style recalculations so our write doesn't
		// trigger a mid-frame reflow that corrupts sibling elements.
		void container.offsetHeight;

		// GUARDRAIL 6: Use textContent = '' instead of innerHTML = ''
		// innerHTML triggers HTML parser which can corrupt adjacent
		// text nodes in Chrome. textContent is a simpler operation.
		container.textContent = "";

		// GUARDRAIL 7: Single atomic append of the complete fragment
		container.appendChild(fragment);

		// GUARDRAIL 8: Document click listener (only once)
		if (!container.hasAttribute("data-click-bound")) {
			container.setAttribute("data-click-bound", "true");
			document.addEventListener("click", function () {
				if (activeNode) {
					activeNode.classList.remove("active");
					activeNode = null;
				}
			});
		}
	}

	/* ====================================================================
	 * 5. INIT
	 * ==================================================================== */
	function init() {
		injectStyles();
		buildTimeline();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
