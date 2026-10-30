<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Symbolic AI, Knowledge Graphs & Neuro-Symbolic AI
description: The other branch of AI: formal logic, knowledge representation, and the new synthesis.
icon: &#128200;
part: 5
order: 11
color: rose
topics: programming, philosophy, architecture
tags: logic-heavy, code-heavy
-->

<div class="md">
For most of its history, AI was **symbolic**: explicit rules, logical inference, hand-curated knowledge. The neural revolution displaced it, but did not destroy it. The 2020s have seen a renaissance: knowledge graphs, formal verification, neuro-symbolic hybrids, and LLM agents that use tools and APIs as symbolic primitives.

This chapter traces the other branch of AI and shows how it complements neural networks.
</div>

<div class="md">
## Before the program: logic and its limits

Symbolic AI begins with the logicist dream that all of mathematics could be derived from logic. Frege's *Begriffsschrift* (1879) invented modern quantifier notation and tried to reduce arithmetic to logical laws; Russell and Whitehead's *Principia Mathematica* (1910-13) carried the project through, after Russell's paradox exposed its foundations (\cite[Frege, 1879]{frege1879}; \cite[Russell & Whitehead, 1910]{russell1910pm}; \cite[Russell's paradox]{russell_paradox_sep}). Hilbert's programme then asked for a finitary consistency proof and a decision procedure for first-order logic (\cite[Hilbert & Ackermann, 1928]{hilbert1928entscheidung}). Gödel's 1931 theorems ended the dream in its strong form: any consistent, effectively axiomatized system strong enough for arithmetic is incomplete and cannot prove its own consistency (\cite[Gödel, 1931]{godel1931incompleteness}; \cite[SEP]{sep_godel_incompleteness}).

## Foundations

Turing's 1936 paper supplied the missing negative answer: no mechanical procedure can decide, for every first-order formula, whether it is provable (\cite[Turing, 1936]{turing1936}). In 1950 he replaced the question of mechanism with an operational test -- can a machine's text replies be distinguished from a person's? -- and made "Can machines think?" an empirical question (\cite[Turing, 1950]{turing1950computing}). Six years later, the 1956 Dartmouth Summer Research Project named the field and set its agenda: language, neural nets, abstraction, creativity, and the conjecture that every feature of intelligence can be described precisely enough for a machine to simulate it (\cite[McCarthy et al., 1955]{mccarthy1955dartmouth}).

### Newell & Simon 1976: The Philosophy of Computer Science as Empirical Inquiry

Before the technical material, it is worth pausing on the philosophical manifesto that grounded the entire symbolic-AI tradition in a defence of itself as a *science*. \citeauthor{newell1976empirical} (\citeyear{newell1976empirical}) — Allen Newell and Herbert A. Simon, in the ACM Turing Award lecture "Computer Science as Empirical Inquiry" (the 1975 award was given to Newell and Simon jointly, and the published paper is the joint form) — make a sustained case that computer science is not *applied mathematics* and not *engineering*, but an *empirical* science on a par with physics or biology, whose natural objects are **symbol systems** and whose characteristic method is the construction of *symbols and search*.

<div class="smart-quote" data-cite="newell1976empirical">
Computer science is an empirical discipline. [...] We build computers and programs for two reasons: (a) to provide a human service (the computer as servant), and (b) to experiment with symbolic processes (the computer as simulation chamber). [...] The urge to make computers more and more intelligent is, therefore, an urge to provide a tool for the empirical study of intelligence.
</div>

Three claims in this passage do the heavy lifting for the rest of the chapter. First, computer science is **empirical**, not a priori; the test of a system is whether it runs in the world, not whether its axioms are derivable from logic. This is the move that licenses the entire culture of *benchmarks* (the Turing test, ImageNet, MMLU, the Winograd Schema, ARC-AGI) the rest of this course uses to grade systems. Second, the relevant kind of *experiment* is the *construction* of a computer program that exhibits the phenomenon; the program is the hypothesis, and running it is the experiment. The symbolic AI research program — STRIPS, Soar, Cyc, theorem provers, expert systems — is not *applications* of computer science to psychology; it *is* computer science as the empirical study of symbolic processes. Third, the central object of study is the **symbol system**, an architecture that *designates*, *interprets*, and *acts on* tokens by rule. The rest of the paper works out the consequences: physical symbol systems are *realisable* (you can build them), *universal* (they can simulate any other symbol system), and *sufficient for general intelligent action* — the now-famous **physical symbol system hypothesis**, that "a physical symbol system has the necessary and sufficient means for general intelligent action."

The substantive section of the paper is a defence of that hypothesis on three grounds — behavioural, neural, and psychological — using the 1956 Logic Theory Machine (the first program to prove theorems in Principia Mathematica), the General Problem Solver (means-ends analysis over state spaces), and the chess and perception programs as data points. The methodological lesson is that *each new layer of complexity* the AI field tackles — from logic to problem solving to perception to language — extends the same pattern: design a symbol system, run it, observe its behaviour, debug it against a held-out set of problems, publish the result. This is the research methodology that produced the symbolic-AI tradition in this chapter.

Read against the modern course, two things stand out. First, Newell and Simon are explicit that the **symbol system** and the **neural substrate** are not rivals; the physical-symbol-system hypothesis is silent about whether the substrate is silicon, vacuum tubes, or neurons, and is silent about whether the symbols are *implemented* by distributed subsymbolic representations or by explicit pointers. The symbolic/connectionist split that haunts the field for half a century after the paper is not the split the paper makes; the paper makes the split *between* *systems that exhibit intelligent behaviour by manipulating symbols* and *systems that exhibit intelligent behaviour without doing so*, and it argues that the first kind is the easier one to engineer and study. The neural revolution of the 2010s changed the cost calculus but not the philosophical point: a Transformer *is* a physical symbol system in Newell and Simon's sense — it designates tokens, interprets them by rule, and acts on them by emitting other tokens — implemented in a sub-symbolic substrate. Second, the **empirical methodology** of the paper is the same methodology the rest of this course uses: build a system, run it on a benchmark, publish the score, debug, iterate. Every chapter that ends with a benchmark plot (Perplexity on text, BLEU on translation, accuracy on MMLU, success rate on agent tasks) is the 2020s continuation of the empirical-research program Newell and Simon proposed for computer science in 1976. The disagreement is about what *kind* of symbol system best buys the score; the *agreement* on what counts as evidence for an answer is the paper's lasting contribution.

The clearest way to see what Newell and Simon are doing is to read the paper *against* \citeauthor{brooks1990elephants} (\citeyear{brooks1990elephants}), added in the philosophy chapter. \citeauthor{brooks1990elephants}'s manifesto is a *rejection* of the "cognition as symbol manipulation" programme on engineering grounds: he argues that the symbol-manipulation programme fails to produce robots that work in the real world, and that *subsumption-style* layered sensorimotor loops work better. \citeauthor{newell1976empirical} are committed to the opposite programme but, ironically, *on the same empirical ground*: they argue that the symbol-manipulation programme *does* produce systems that exhibit intelligent behaviour, and that no other programme has yet produced systems with comparable breadth. The 2020s answer is that both are partly right: modern AI is best modelled as a *hybrid*, with a sub-symbolic substrate implementing a symbolic policy (a Transformer), surrounded by tools and verifiers that act as explicit symbolic primitives. The hybrid is, in a sense, what Newell and Simon would have predicted if they had known what 2026 hardware looks like; the hybrid is also, in a different sense, what Brooks would have predicted if he had known what 2026 software looks like.
</div>

The first implementations followed quickly. Newell, Shaw, and Simon's Logic Theory Machine (1956) proved 38 of the first 52 theorems in Chapter 2 of *Principia Mathematica*, and found a shorter proof than Russell and Whitehead's for one of them (\cite[Newell & Simon, 1956]{newell1956logictheorist}). Their General Problem Solver (1957) generalized the trick into means-ends analysis: compare current and goal states, find the difference, and apply an operator that reduces it (\cite[Newell, Shaw & Simon, 1957]{newell1957gps}). McCarthy's LISP (1960) then gave symbolic AI its own language -- programs and data both lists, recursion as the basic control structure (\cite[McCarthy, 1960]{mccarthy1960lisp}; \cite[Lisp]{lisp_wiki}).

<div class="optional md" data-headline="Neuro-symbolic isn't new — it's old friends meeting again">
The synthesis below happens naturally once you read three other chapters: <a href="reasoning">Reasoning</a> (CoT is *implicit* logic the network learned), <a href="mechanistic_interpretability">Mechanistic Interpretability</a> (the circuits you find inside a Transformer often look like AND/OR/NOT gates), and <a href="agents">AI Agents</a> (ReAct-style tool use is symbolic reasoning wrapped around a neural policy). The “neuro-symbolic” framing just makes the marriage explicit.
</div>

<div class="md">
### The Two Branches

| | Symbolic (GOFAI) | Neural (Connectionist) |
|---|---|---|
| **Representation** | Symbols, rules, logic | Vectors, weights |
| **Reasoning** | Formal inference | Pattern recognition |
| **Knowledge** | Hand-curated | Learned from data |
| **Transparency** | Traceable proof | Black box |
| **Robustness** | Strong (provable) | Brittle (adversarial) |
| **Sample efficiency** | High | High data needs |
| **Scaling** | Knowledge engineering bottleneck | Compute + data |

Both have strengths the other lacks. **Neuro-symbolic AI** is the synthesis.
</div>

<div class="md" data-mathlevel="50">
## Knowledge representation

### Knowledge Representation: From Logic to RDF

The classical symbolic AI stack rests on **first-order logic** and its extensions.

#### Propositional Logic

Variables are boolean; connectives $\land, \lor, \neg, \implies$ combine them. Decidable; SAT solvers are highly optimized.

#### First-Order Logic (FOL)

Adds $\forall$ (forall), $\exists$ (exists), predicates $P(x)$, and functions $f(x)$. More expressive; semi-decidable.

A simple FOL knowledge base:

$$
\begin{aligned}
&\forall x\, (\text{Human}(x) \implies \text{Mortal}(x)) \\
&\text{Human}(\text{Socrates}) \\
&\therefore \text{Mortal}(\text{Socrates})
\end{aligned}
$$

#### Description Logics (DLs)

A fragment of FOL designed to be **decidable** while still expressive. Foundation of the **Semantic Web**:

* **Concepts** (classes): Human, Mammal, Vehicle
* **Roles** (properties): hasParent, drives, owns
* **Individuals**: Socrates, Plato
* **Constructors**: $\sqcap$ (intersection), $\sqcup$ (union), $\neg$ (negation), $\exists R.C$ (exists role filler)

The standard **SROIQ** description logic underlies **OWL 2 DL** (the description-logic profile of the Web Ontology Language).
</div>

<div class="md">
### RDF, RDFS, OWL, SPARQL

The Semantic Web stack (W3C standards):

* **RDF** (Resource Description Framework): triple representation $\langle \text{subject}, \text{predicate}, \text{object} \rangle$.

```
<http://example.org/Socrates> <http://example.org/type> <http://example.org/Human> .
<http://example.org/Socrates> <http://example.org/hasTeacher> <http://example.org/Plato> .
```

* **RDFS** (RDF Schema): class hierarchies, property hierarchies.
* **OWL** (Web Ontology Language): full description logic, cardinality constraints, equivalence, disjointness.
* **SPARQL**: SQL-like query language for RDF.

Major public knowledge graphs:

* **Wikidata**: 100M+ items, the open community-edited KG.
* **DBpedia**: extracted from Wikipedia infoboxes.
* **Google Knowledge Graph**: powers search infoboxes.
* **ConceptNet**: 34M commonsense assertions.
* **WordNet**: lexical KG (synonymy, hypernymy).
* **UMLS**: medical KG (3M+ concepts).
* **Amazon Product Graph, Facebook Entity Graph**: industrial-scale closed KGs.
</div>

<div id="kg-viz" style="width:100%; max-width:var(--mn-col-width); margin:1em auto; height:520px;"></div>

<div class="md">
### Reasoning Over Knowledge Graphs

A KG query is **graph pattern matching**:

```sparql
SELECT ?x WHERE {
  ?x rdf:type :Human .
  ?x :hasTeacher ?y .
  ?y rdf:type :Philosopher .
}
```

Reasoners (Pellet, HermiT, FaCT++) implement **tableau-based** algorithms that check consistency and infer new triples. Tasks:

* **Subsumption**: is $A$ a subclass of $B$?
* **Instance checking**: is $a$ an instance of $C$?
* **Consistency**: does the KG have a model?
* **Realization**: find the most specific class for an individual.

For **rule-based reasoning** beyond OWL, **Datalog** and **Prolog** are used. Modern graph databases (Neo4j, Amazon Neptune, Stardog, TigerGraph) add **property graphs**: nodes and edges with arbitrary attributes.

Resolution gave symbolic reasoning its industrial engine. Robinson's 1965 rule -- resolve two clauses on a complementary literal, with unification handling variables -- made first-order theorem proving a single uniform inference step (\cite[Robinson, 1965]{robinson1965resolution}). Kowalski's 1974 "Predicate Logic as a Programming Language" turned resolution into computation: a logic program is a set of Horn clauses, and answering a query is proof search (\cite[Kowalski, 1974]{kowalski1974prolog}). Colmerauer and Roussel's Prolog (1972-73) implemented that idea and became the language of expert systems, natural-language parsers, and later Datalog engines (\cite[Colmerauer & Roussel, 1973]{colmerauer1973prolog}).
</div>

<div class="md" data-mathlevel="55">
#### Embedding-Based KG Reasoning

To bridge symbolic KGs with neural methods, several **KG embedding** methods learn vector representations of entities and relations:

* **TransE** \cite{bordes2013transe}: $\mathbf{h} + \mathbf{r} \approx \mathbf{t}$ (translation in embedding space).
* **DistMult** \cite{yang2015distmult}: bilinear $\langle \mathbf{h}, \mathbf{r}, \mathbf{t} \rangle$ score.
* **ComplEx**: extends to complex-valued embeddings for asymmetric relations.
* **RotatE** \cite{sun2019rotate}: rotation in complex space, captures composition.
* **GraphSAGE** \cite{hamilton2017graphsage} / **R-GCN** \cite{schlichtkrull2018rgcn}: graph neural networks over the KG structure.

These enable **link prediction**: given $(h, r, ?)$, predict $t$, completing missing triples. Used in recommendation, drug repurposing, fraud detection.
</div>

<div class="md">
## The knowledge-engineering cycle

Symbolic AI's first commercial wave was knowledge engineering. DENDRAL inferred molecular structures from mass spectra, MYCIN recommended antibiotics from hundreds of if-then rules, and both showed that hand-coded expertise could beat general search in a narrow domain (\cite[Feigenbaum et al., 1969]{feigenbaum1965dendral}; \cite[Shortliffe & Buchanan, 1976]{shortliffe1976mycin}). The details explain why the recipe spread. DENDRAL pruned the search for one compound from more than eleven million candidate structures to about twenty-two thousand, which could then be tested individually; MYCIN separated its rules from its inference engine, so the engine could be reused as the first expert-system shell (EMYCIN), and in a blind clinical test it prescribed antibiotics as well as, or better than, nine human clinicians \cite{crevier1993ai}. The commercial breakthrough was XCON (originally R1), John McDermott's VAX configurer for the Digital Equipment Corporation: about three hundred rules in 1979 grew to more than three thousand by 1984, and the system configured ten machine models \cite{crevier1993ai}. Winograd's SHRDLU (1972) embedded language in a tiny blocks world, so every word had a referent (\cite[Winograd, 1972]{winograd1972understanding}). McCarthy and Hayes had already named the obstacle: the frame problem, deciding what stays unchanged when an action occurs (\cite[McCarthy & Hayes, 1969]{mccarthy1969some}). Cyc, begun in 1984, was the maximalist response -- a hand-built common-sense ontology and inference engine -- but knowledge acquisition did not scale (\cite[Cyc]{cyc_wiki}).

The semantic web was the attempt to make that knowledge public and composable: RDF triples, OWL ontologies, and SPARQL queries, standardized by the W3C and promoted in Berners-Lee, Hendler, and Lassila's 2001 *Scientific American* article (\cite[Berners-Lee et al., 2001]{berners2001sw}). Google's 2012 Knowledge Graph showed the industrial version -- a proprietary graph of entities and relations behind search answers (\cite[Singhal, 2012]{singhal2012knowledge}). The current revival is neuro-symbolic: neural networks handle perception and ambiguity, while symbolic engines supply exact inference and verification, as in DeepProbLog and AlphaGeometry (\cite[Manhaeve et al., 2018]{manhaeve2018deepproblog}; \cite[Trinh et al., 2024]{trinh2024alphageometry}; \cite[Garcez & Lamb, 2020]{garcez2020neurosymbolic}).

## Hybrid systems

### Symbolic Reasoning in 2025: LLMs + Tools

Modern LLMs use **tools** as symbolic primitives:

* **Web search**: query → fetch results → summarize.
* **Code execution**: generate Python → run in sandbox → use output.
* **Calculator**: “what is 17 × 23?” → call a calculator → return 391.
* **Database query**: “users in Berlin” → generate SQL → execute → return rows.
* **API calls**: “book a flight” → call Skyscanner API.

Frameworks: LangChain, LlamaIndex, AutoGen, CrewAI, LangGraph, OpenAI's function-calling, Anthropic's tool use.

The LLM acts as a **planner and natural-language interface**; the symbolic system provides **grounded computation**.
</div>

<div class="md">
### Formal Verification and Theorem Proving

Symbolic AI is critical for **provable correctness**:

* **Lean, Coq, Isabelle, Agda**: interactive theorem provers. Used in mathematics (Liquid Tensor Experiment), cryptography (zk-SNARKs), and verified software (CompCert, seL4).
* **SAT solvers** (CaDiCaL, Kissat, CryptoMiniSat): scale to millions of variables. Industry-standard for hardware verification, planning, scheduling.
* **SMT solvers** (Z3, CVC5): extend SAT with theories (arithmetic, arrays, bit-vectors).
* **Model checkers** (SPIN, TLC for TLA+): verify state machines, distributed systems, protocols.

#### LLM + Theorem Proving (the 2024 frontier)

The Lean-based **“AI for math”** initiative (DeepMind, 2024; OpenAI, 2024) has produced LLMs that:

1. Generate a candidate proof in natural language + Lean code.
2. Submit to Lean's kernel for verification.
3. If verification fails, refine using the error message.
4. Iterate.

The combined AlphaProof and AlphaGeometry system (\cite[DeepMind, 2024]{deepmind2024alphaproof}) reached silver-medal level at IMO 2024, solving four of the six problems. Subsequent work has solved IMO 2025 problems. The combination of **neural intuition** + **symbolic verification** is the most promising path to provably correct mathematical reasoning.
</div>

<div class="md">
### Neuro-Symbolic Architectures

The synthesis takes several forms:

| Approach | Description | Example |
|----------|-------------|---------|
| **Neural + symbolic modules** | NN does perception, symbolic does reasoning | AlphaGeometry (\cite[Trinh et al., 2024]{trinh2024alphageometry}), AlphaProof |
| **Neural representations, symbolic inference** | Embeddings + logical rules | Logic Tensor Networks, NLProlog |
| **Symbolic priors on neural nets** | Constraints in loss function | Physics-informed NNs, constraint satisfaction |
| **NN as heuristic for symbolic search** | Learned policy for tree search | AlphaGo, theorem provers |
| **Differentiable logic** | Soft logic, gradient through rules | DeepProbLog, NARS |
| **LLM + tool use** | Neural planner, symbolic tools | ReAct \cite{yao2023react}, Toolformer, agents |

#### AlphaGeometry (DeepMind, 2024)

Solves IMO (\cite[Trinh et al., 2024]{trinh2024alphageometry}) problems: a Transformer generates candidate constructions, a symbolic DDAR (deductive database) verifies. Solved 25 of the 30 IMO geometry problems from 2000–2022, close to the average human gold medallist.

#### Toolformer

A Transformer that learns to **call APIs** (calculator, search, translation) by self-supervised training on examples where API calls improve perplexity (\cite[Schick et al., 2023]{schick2023toolformer}). Pure neural, but uses symbolic tools.

#### Logic Tensor Networks (Serafini & Garcez, 2016)

Embed logical rules as soft constraints on neural network outputs. Combines first-order logic with deep learning in a single end-to-end trainable system.

#### DeepProbLog

Extends ProbLog (probabilistic logic programming) with neural predicates (\cite[Manhaeve et al., 2018]{manhaeve2018deepproblog}). A neural net outputs probabilities; the probabilistic logic engine reasons over them.
</div>

<div class="md">
## Trade-offs and future

### When Symbolic Wins

Pure neural is bad at:

* **Exact computation** (arithmetic, code execution)
* **Formal verification** (proofs, model checking)
* **Structured prediction with hard constraints** (valid JSON, valid SQL, valid chemical structures)
* **Deterministic reproducibility** (same input → same output)
* **Long-tail factual queries** (a KG knows every entity; an LLM hallucinates)

When you need provable, deterministic, exact results: use a symbolic system, possibly wrapped by an LLM as the interface.

### When Neural Wins

* Open-ended generation (text, images, audio, video).
* Pattern recognition (vision, speech, anomalies).
* Tasks where rules are unknown or hard to specify.
* Handling natural-language inputs robustly.

### The Future: Hybrid by Default

By 2030, the standard production AI system will be:

* An LLM at the top, doing natural-language understanding and planning.
* Calling symbolic tools (calculators, code interpreters, databases, KGs, APIs).
* With formal verification of critical outputs.
* Trained jointly on text, code, and structured data (SQL, JSON, RDF).

The dichotomy is dissolving. The student who masters **both** branches will be far more capable than one trained in either alone.
</div>

<script>
// KG triple visualization
(function() {
	const c = document.getElementById('kg-viz');
	if (!c) return;

	const nodes = [
		{ id: 'Socrates', x: 2, y: 3, color: '#3b82f6' },
		{ id: 'Plato', x: 6, y: 4, color: '#3b82f6' },
		{ id: 'Aristotle', x: 7, y: 1.5, color: '#3b82f6' },
		{ id: 'Human', x: 1, y: 6, color: '#22c55e' },
		{ id: 'Philosopher', x: 5, y: 6.5, color: '#22c55e' },
		{ id: 'Greek', x: 3.5, y: 7.5, color: '#22c55e' }
	];

	const edges = [
		['Socrates', 'Plato', 'hasTeacher'],
		['Plato', 'Aristotle', 'hasTeacher'],
		['Socrates', 'Human', 'type'],
		['Plato', 'Human', 'type'],
		['Aristotle', 'Human', 'type'],
		['Socrates', 'Philosopher', 'type'],
		['Plato', 'Philosopher', 'type'],
		['Aristotle', 'Philosopher', 'type'],
		['Philosopher', 'Human', 'subClassOf'],
		['Greek', 'Human', 'subClassOf']
	];

	const findNode = id => nodes.find(n => n.id === id);
	const shapes = [];
	const annotations = [];

	for (const e of edges) {
		const a = findNode(e[0]), b = findNode(e[1]);
		shapes.push({
			type: 'line', x0: a.x, x1: b.x, y0: a.y, y1: b.y,
			line: { color: '#cbd5e1', width: 2 }
		});
		annotations.push({
			x: (a.x + b.x) / 2 + 0.15, y: (a.y + b.y) / 2 + 0.15,
			text: '<i>' + e[2] + '</i>', showarrow: false,
			font: { size: 11, color: '#e2e8f0', family: 'monospace' },
			bgcolor: 'rgba(15, 23, 42, 0.75)', borderpad: 2
		});
	}

	for (const n of nodes) {
		shapes.push({
			type: 'circle', x0: n.x - 0.4, x1: n.x + 0.4, y0: n.y - 0.3, y1: n.y + 0.3,
			fillcolor: n.color, line: { color: 'rgba(0,0,0,0.3)', width: 1.5 }
		});
		annotations.push({
			x: n.x, y: n.y, text: '<b>' + n.id + '</b>', showarrow: false, font: { size: 13, color: '#fff' }
		});
	}

	Plotly.newPlot('kg-viz', [], {
		shapes, annotations,
		xaxis: { range: [-0.5, 8], showgrid: false, zeroline: false, showticklabels: false },
		yaxis: { range: [0, 9], showgrid: false, zeroline: false, showticklabels: false, scaleanchor: 'x' },
		margin: { t: 50, b: 30, l: 30, r: 30 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		title: { text: 'Knowledge graph: blue = individuals, green = classes', font: { size: 14, color: '#e2e8f0' } }
	}, { displayModeBar: false, responsive: true });
})();

async function loadSymbolicAiModule() {
	updateLoadingStatus("Loading section about Symbolic AI & Knowledge Graphs...");
	return Promise.resolve();
}
</script>

<div class="mn-quiz" data-quiz="symbolic_ai"><script type="application/json">{"title": "Symbolic AI", "questions": [{"q": "What is the physical symbol system hypothesis (Newell & Simon)?", "options": ["Symbol manipulation is necessary and sufficient for general intelligence", "Intelligence requires a biological brain, not symbol manipulation", "All artificial intelligence must be built on neural networks trained on text", "Symbols are meaningless without a physical body to ground them in the world"], "answer": 0, "explain": "It was the founding bet of classical AI."}, {"q": "What is the basic unit of an RDF knowledge graph?", "options": ["A triple: subject – predicate – object", "A single pixel stored in a raster image", "A token embedding in a vector space", "A decision tree learned from data"], "answer": 0, "explain": "For example (Paris, capitalOf, France)."}, {"q": "Where does symbolic AI still win?", "options": ["Where exact, verifiable, explainable reasoning over rules is required", "Recognising cats and other objects in noisy, varied photographs", "Writing poetry that must follow an exact rhyme scheme and metre", "Transcribing speech from recordings that contain heavy background noise"], "answer": 0, "explain": "Theorem provers, planners and databases give guarantees that neural nets do not."}, {"q": "What does “neuro-symbolic” mean?", "options": ["Combining neural networks with symbolic reasoning or tools", "A neural network whose weights are made of discrete symbols", "AI applied to the diagnosis of neurological diseases", "Replacing explicit symbols with learned neuron activations"], "answer": 0, "explain": "For example, an LLM that writes code or queries a solver, which then computes exactly."}]}</script></div>
