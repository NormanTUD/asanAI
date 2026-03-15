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
		{ year: "c. 4th C. BCE", label: "Pāṇini's Ashtadhyayi",             desc: "A formal generative grammar for Sanskrit — the first 'programming language' for human speech.", color: "#8e44ad" },
		{ year: "c. 300 BCE",    label: "Sushruta Samhita / Aristotle",      desc: "Ancient Indian and Greek texts formalizing anatomy, logic, and the categories of thought.", color: "#6c3483" },
		{ year: "c. 1510",       label: "Da Vinci's Anatomical Studies",     desc: "Precise sketches of the larynx and tongue — treating the voice as an acoustic instrument.", color: "#7f8c8d" },
		{ year: "1668",          label: "Wilkins' Real Character",           desc: "An attempt at a universal language — a precursor to taxonomies and modern embeddings.", color: "#2c3e50" },
		{ year: "1791",          label: "Kempelen's Speaking Machine",       desc: "The first mechanical text-to-speech device, using bellows and reeds to simulate the vocal tract.", color: "#34495e" },
		{ year: "1873", label: "Nietzsche — On Truth and Lies", desc: "Language as a 'mobile army of metaphors' — arguing that words are arbitrary social conventions, not mirrors of reality.", color: "#c0392b" },
		{ year: "1953",          label: "Wittgenstein — Philosophical Investigations",  desc: "\"The meaning of a word is its use in the language.\" The idea that a words meaning is determined by how it's used.", color: "#16a085" },
		{ year: "1957",          label: "Firth — Distributional Semantics",  desc: "\"You shall know a word by the company it keeps.\" The statistical foundation of modern NLP.", color: "#16a085" },
		{ year: "2017",          label: "Transformer Architecture",          desc: "Attention mechanisms allow models to weigh context dynamically — Firth's hypothesis made computational.", color: "#2980b9" }
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
			/* The vertical line */
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
			/* Each node row */
			".vtl-node {",
			"  position: relative;",
			"  padding: 0.6em 0 0.6em 1.5em;",
			"  cursor: pointer;",
			"}",
			/* The dot */
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

			/* --- Deep-dive collapsibles --- */
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

			/* --- Responsive --- */
			"@media (max-width: 600px) {",
			"  .vtl-track { padding-left: 32px; }",
			"  .vtl-dot  { left: -23px; width: 14px; height: 14px; }",
			"  .vtl-track::before { left: 14px; }",
			"  .vtl-desc { max-width: 100%; }",
			"}"
		].join("\n");

		var style = document.createElement("style");
		style.textContent = css;
		document.head.appendChild(style);
	}

	/* ====================================================================
	 * 2. BUILD VERTICAL TIMELINE
	 * ==================================================================== */
	function buildTimeline() {
		var container = document.getElementById("timeline-container");
		if (!container) return;

		container.innerHTML = "";

		var title = document.createElement("div");
		title.className = "vtl-title";
		title.textContent = "Interactive Timeline — The Ancestry of Language";
		container.appendChild(title);

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

		container.appendChild(track);

		document.addEventListener("click", function () {
			if (activeNode) {
				activeNode.classList.remove("active");
				activeNode = null;
			}
		});
	}

	/* ====================================================================
	 * 3. COLLAPSIBLE CHEVRONS
	 * ==================================================================== */
	function initCollapsibles() {
		var allDetails = document.querySelectorAll("details.deep-dive");
		for (var i = 0; i < allDetails.length; i++) {
			(function (el) {
				var summary = el.querySelector("summary");
				if (!summary) return;

				var chevron = document.createElement("span");
				chevron.className = "chevron";
				chevron.textContent = " ▸";
				summary.appendChild(chevron);

				el.addEventListener("toggle", function () {
					chevron.textContent = el.open ? " ▾" : " ▸";
				});
			})(allDetails[i]);
		}
	}

	/* ====================================================================
	 * 5. INIT
	 * ==================================================================== */
	function init() {
		injectStyles();
		buildTimeline();
		initCollapsibles();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
