<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Retrieval-Augmented Generation: Giving LLMs a Search Engine
description: The RAG pipeline — chunking, embedding, vector search, generation — plus the parts the happy path hides: chunking strategies, hybrid BM25 + dense search, cross-encoder reranking, contextual retrieval, and the honest reasons RAG underperforms.
icon: &#128270;
part: 5
order: 3
color: rose
topics: inference, language, programming, architecture, data
tags: code-heavy
math: 40
-->

<div class="smart-quote" data-cite="alankayfuture">
The best way to predict the future is to invent it.
</div>

<div class="md">
## The pipeline

### What is RAG?

A standard LLM can only use what it memorized during training. Ask it about a document it never saw, and it either **hallucinates** or says *“I don't know.”*

**Retrieval-Augmented Generation (RAG)** — formalized by \citeauthor{lewis2020rag} in \citeyear{lewis2020rag} — gives the LLM an external, searchable memory. Before the model generates an answer, a *retriever* finds the most relevant passages from a document store and injects them into the prompt. The LLM then answers **grounded in those passages**.

$$
\text{Query} \;\xrightarrow{\text{embed}}\; \vec{q} \;\xrightarrow{\text{search}}\; \text{Top-}K\text{ chunks} \;\xrightarrow{\text{augment prompt}}\; \text{LLM} \;\rightarrow\; \text{Grounded Answer}
$$

\marginfig{library_card_catalog.jpg}{A library card catalog is the pre-digital RAG: the knowledge lives *outside* the “librarian's head” (the LLM) in an external, searchable index, and a trustworthy answer comes from retrieving the right index cards before responding — exactly what the retrieve-then-generate pipeline automates with vectors. Image: [TBurmeister (WMF), CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Card_catalog_at_the_Indiana_State_Library_-_interior_view_of_catalog_cards.jpg).}

**Key insight:** The LLM's weights are *never changed*. RAG is purely an **input-enrichment** strategy.
</div>

<div id="raglab-pipeline-diagram"></div>

<div class="md">
### The RAG Pipeline, Step by Step

#### Phase 1: Indexing (offline, done once)

**Step 1, Chunk the documents.**
Split each source (PDF, webpage, database row) into small, overlapping passages, typically 200–500 tokens. Overlap ensures no information falls between the cracks.

**Step 2, Embed each chunk.**
Pass every chunk through an *embedding model* (e.g. OpenAI `text-embedding-3-small`, 1,536 dims, or open-source `bge-base`, 768 dims, see the <a href="embeddinglab">Embeddings chapter</a> for how these vectors are built and why similar concepts end up geometrically close). This converts text into a **dense vector**, a list of floating-point numbers that encodes the *meaning* of the passage:

$$
\text{chunk}_i \;\xrightarrow{\text{Embedding Model}}\; \vec{v}_i \in \mathbb{R}^{1536}
$$

**Step 3, Store in a vector database.**
Save every $(\vec{v}_i,\; \text{chunk\_text}_i,\; \text{metadata}_i)$ triple in a specialised database optimized for nearest-neighbor search (FAISS, Pinecone, Weaviate, Chroma, Qdrant).
</div>

<div class="md" data-mathlevel="50">
#### Phase 2: Retrieval + Generation (online, every query)

**Step 4, Embed the query.**
The user's question is passed through the *same* embedding model, producing $\vec{q}$ in the same vector space.

**Step 5, Similarity search.**
The vector DB finds the $K$ stored chunks whose vectors are closest to $\vec{q}$, usually via **cosine similarity**:

$$
\text{sim}(\vec{q}, \vec{v}_i) = \frac{\vec{q} \cdot \vec{v}_i}{\|\vec{q}\| \; \|\vec{v}_i\|}
$$

Approximate nearest-neighbor indexes like **HNSW** \cite{malkov2018hnsw} keep queries in the millisecond range by visiting only a small part of the graph.

**Step 6, Augment the prompt.**
The retrieved chunks are prepended to the user's question:
</div>

<pre class="raglab-code-block"><code>System: Answer based ONLY on the following context.

Context:
[Chunk 1 text here]
[Chunk 2 text here]
[Chunk 3 text here]

User: What is the capital of Assyria?</code></pre>

<div class="md">
**Step 7, Generate.**
The LLM reads the enriched prompt and produces an answer conditioned on the retrieved evidence. Hallucination can drop sharply when the right passage is present, but RAG does not guarantee grounding: the model can still ignore, misread, or overrule the context.
</div>

<div class="md">
### How Data Is Stored: Vector Databases

A vector database is **not** a traditional SQL database. It doesn't search by keyword matching. It indexes high-dimensional vectors so that *semantic similarity* queries are fast.

#### What's actually stored?

| Field | Example | Purpose |
|-------|---------|---------|
| `id` | `doc_0042` | Unique identifier |
| `vector` | $[0.023, -0.841, 0.117, \ldots]$ | 768-dim embedding, the searchable “meaning” |
| `text` | “The Transformer was introduced in 2017…” | Original chunk, returned to the LLM |
| `metadata` | `{source: "vaswani2017", page: 3}` | Filtering, citations |

#### How is search so fast?

Brute-force comparison against millions of vectors would be $O(n \cdot d)$ per query, too slow. Vector DBs use **Approximate Nearest Neighbor (ANN)** algorithms:

- **HNSW** (Hierarchical Navigable Small World) \cite{malkov2018hnsw}: builds a multi-layer graph. Searching “hops” through the graph, narrowing in on the target region, like navigating a city by jumping between landmarks. *Most popular in production.*
- **IVF** (Inverted File Index): clusters vectors into Voronoi cells at index time. At query time, only a few nearby cells are searched.
- **Product Quantization** \cite{jegou2011pq}: compresses vectors into compact codes, trading a tiny bit of accuracy for massive memory savings.

Result: with quantized indexes, a billion vectors can be queried in tens of milliseconds on a single machine — at the cost of some accuracy and a large memory footprint.
</div>

<div class="md">
## RAG in context

### 🔍 Interactive: Similarity Search Demo
</div>

<div id="raglab-demo-container">
    <p class="raglab-demo-subtitle">Type a query and see which “documents” match by cosine similarity. This is a toy demo using tiny vectors, real systems use 768+ dimensions, but the principle is identical.</p>
    <input type="text" id="raglab-query-input" placeholder="Try: &quot;How do neural networks learn?&quot;" value="How do neural networks learn?" />
    <button id="raglab-search-btn">🔎 Search</button>
    <div id="raglab-results"></div>
    <details class="raglab-details">
        <summary>How does this demo work?</summary>
        <p>Each “document” and your query are mapped to a tiny vector using keyword heuristics (a stand-in for a real embedding model). The system computes cosine similarity between your query vector and every document vector, then ranks them. In production, the embedding model is a neural network and vectors have hundreds of dimensions.</p>
    </details>
</div>

<div class="md">
### RAG vs. In-Context Learning (ICL)

**In-Context Learning** is when you put examples or instructions directly in the prompt and the LLM “learns” the task on the fly, no weight updates, just pattern-matching over the provided tokens.

RAG and ICL are **complementary**, not competing. In fact, **RAG feeds into ICL**: the retrieved documents *become* the in-context examples the model reasons over.
</div>

<div id="raglab-compare-grid">
    <div class="raglab-compare-card raglab-card-blue">
        <span class="raglab-tag raglab-tag-blue">In-Context Learning</span>
        <ul>
            <li>The model reads examples/instructions in the prompt</li>
            <li>Limited to what fits in the context window</li>
            <li>The <strong>human</strong> (or a program) decides what to include</li>
            <li>Works for any task: translation, code, reasoning…</li>
        </ul>
    </div>
    <div class="raglab-compare-card raglab-card-green">
        <span class="raglab-tag raglab-tag-green">RAG</span>
        <ul>
            <li>An <strong>automated retriever</strong> selects what to put in the prompt</li>
            <li>Can search over <strong>millions of documents</strong>, far beyond any context window</li>
            <li>Specialised for knowledge-grounded Q&amp;A</li>
            <li>The LLM still uses ICL to reason over the retrieved chunks</li>
        </ul>
    </div>
</div>

<div class="md">
#### Why do they *seem* different?

ICL relies on whatever the user manually puts in the prompt. RAG **automates the selection** using vector search. The LLM itself doesn't know the difference, it just sees tokens in its context window either way. The magic of RAG is in the retrieval step *before* the LLM runs.

<p>$$ \underbrace{\text{RAG}}_{\text{automated retrieval}} \;\longrightarrow\; \underbrace{\text{ICL}}_{\text{LLM reads retrieved chunks}} $$</p>

### RAG and Long Context Windows

Modern LLMs have ever-growing context windows: 128K tokens (GPT-4 Turbo), 200K (Claude 3), even 1M+ (Gemini 1.5). So why bother with RAG?
</div>

<div id="raglab-context-table"></div>

<div class="md">
#### The “Lost in the Middle” Problem

Research shows that LLMs pay the most attention to the **beginning** and **end** of long contexts, often ignoring information buried in the middle \cite{liu2023lostmiddle}. Even if a 200K-token window *can* hold your data, the model may fail to *use* it.

RAG mitigates this by shrinking the context to a handful of chunks, but it does not abolish the effect: a relevant chunk placed in the middle of even a short retrieved set can be underused, so ordering matters.

In practice, **RAG + long context** work together: RAG retrieves the top 10–20 chunks, and the long context window gives the model room to reason over all of them at once.

## Making RAG work

### Limitations &amp; Failure Modes

- **Garbage in, garbage out.** If the document store contains wrong information, RAG will confidently retrieve and present it.
- **Indirect prompt injection.** Because RAG feeds retrieved text straight into the prompt, malicious instructions hidden in a document can try to hijack the model (see the Security chapter).
- **Chunking matters.** If a critical fact is split across two chunks and neither is retrieved, the answer will be incomplete.
- **Embedding blind spots.** Embedding models can misjudge similarity, a query about “Python” (the snake) might retrieve docs about “Python” (the language).
- **No reasoning over absence by default.** A naive top-$k$ retriever always returns *something*, so it cannot distinguish “not in the corpus” from “ranked just below the cutoff.” Abstention, score thresholds, and coverage checks are needed to make absence detectable.
- **Latency.** The retrieval step adds ~50–200 ms per query.

</div>

<div class="md">
### Retrieval, in Depth

The happy path — embed the corpus, retrieve the nearest chunks, hand them to the model — is what the sections above walk (see also [Semantic search](vectorsearch.php)). This deeper half is what happens in practice, and it is mostly about the parts the happy path hides — **how you cut the corpus into chunks** (the single highest-leverage, least-discussed knob), **how you combine keyword and semantic search**, **how you rerank** with a second, more expensive model, and — the half the demos never show — **why retrieval-augmented generation so often underperforms** and how to find out whether *your* failure is in the retrieval or the generation.
</div>

<div class="md">
#### Chunking is a decision, not a default

Before anything is embedded, the corpus must be **chunked** — cut into pieces, because the model will be asked to answer from a *few* of them, not the whole. The chunk is the **unit of retrieval**: it is the granularity at which "relevant" is decided and at which context is *spent*. And its size and boundaries are the highest-leverage choice in the whole pipeline, because they set two opposing costs at once.

The standard cuts, and what each optimizes:

* **Fixed-size** — split by character/token count (say, 400 tokens, 50 overlap). Cheap and uniform, but it cuts in the middle of sentences, definitions, and code blocks, so a chunk can contain half of a thought and the other half of a *different* one.
* **Recursive / structural** — split on document structure first (headings, paragraphs, code fences, list items), then fall back to a size limit only when a section is too big. Respects the document's own boundaries, which is usually what "a relevant unit" actually means.
* **Semantic** — split where the *topic* changes (a drop in embedding similarity between consecutive sentences). Better at keeping a chunk coherent, but more expensive and more fragile to fit.

The trade is **recall versus context-dilution**, and it is the whole game. A chunk that is *too small* splits a relevant answer across two chunks, so retrieving one gives you a partial, misleading piece (low recall of the *complete* answer). A chunk that is *too big* pulls in a lot of irrelevant text along with the relevant bit, so the model's attention is *diluted* across a context full of noise (you retrieve the answer, but drowned in context). There is no universal right size — it depends on the document and the question — which is why it is a *decision* you tune per corpus, not a number you copy from a template.

> The chunk is the atom of the system. Get the atom wrong and no amount of better embedding, better fusion, or better model fixes it: you are asking the model to reconstruct a thought from the fragments of its neighbor.
</div>

<div class="md">
#### Hybrid search: BM25 and dense are different questions

[Dense](vectorsearch.php) retrieval asks "which chunks are *semantically close* to this query?" — great for **paraphrase** (the query "how do I undo my last commit" matches "reverting a commit" even though no word is shared). But it is weak on **exact, rare terms**: a product ID, an error code, a proper noun, a specific API flag. Those are the things a *lexical* retriever — **BM25** (\cite[Robertson & Zaragoza, 2009]{robertson2009bm25}) — is built for: it scores by term match, weighted by how rare the term is across the corpus, and it does not care whether the query and the document *mean* the same thing, only whether they *share* the right words.

A query that is half paraphrase and half exact term ("how do I configure `max_tokens` for the gpt-4o model?") is answered best by *both* at once — the dense side finds "how do I configure", the lexical side finds "`max_tokens`" and "gpt-4o". **Hybrid search** retrieves with both and **fuses** the two ranked lists. The standard fusion is **reciprocal rank fusion (RRF)**: for each document, sum over the two lists a score that depends only on its *rank* in that list,

<div>
$$ \text{RRF}(d) = \sum_{r \in \{\text{bm25, dense}\}} \frac{1}{k + \text{rank}_r(d)} $$
</div>

with $k$ a constant (commonly 60). RRF is attractive because it needs no calibrated scores — it uses only *rank* — and it is robust: a document that is rank 3 in BM25 and rank 1 in dense fuses to a top result even if the two scoring functions are on totally different scales. This is why hybrid retrieval is now the default production pattern rather than an experiment, and why the [BEIR](beir2021) benchmark matters — it showed that no single retriever dominates across tasks and that BM25 remains a hard-to-beat out-of-domain baseline \cite[Thakur et al., BEIR (2021)]{beir2021}.

<figure>
	<svg viewBox="0 0 560 150" role="img" aria-label="A two-stage retrieval funnel: BM25 and dense recall fuse via RRF, then a cross-encoder rescues the top few" style="width:100%; height:auto; max-width:560px; display:block; margin:0 auto;">
		<defs><marker id="moearrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--mn-text-secondary)"/></marker></defs>
		<rect x="20" y="12" width="120" height="34" rx="8" fill="var(--mn-bg-subtle)" stroke="var(--mn-border)"/>
		<text x="80" y="34" text-anchor="middle" font-size="12" fill="var(--mn-text)">BM25 recall</text>
		<text x="80" y="58" text-anchor="middle" font-size="10" fill="var(--mn-text-secondary)">top-50, cheap, lexical</text>
		<rect x="20" y="98" width="120" height="34" rx="8" fill="var(--mn-bg-subtle)" stroke="var(--mn-border)"/>
		<text x="80" y="120" text-anchor="middle" font-size="12" fill="var(--mn-text)">dense recall</text>
		<text x="80" y="144" text-anchor="middle" font-size="10" fill="var(--mn-text-secondary)">top-50, cheap, semantic</text>
		<rect x="220" y="55" width="120" height="40" rx="8" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="280" y="79" text-anchor="middle" font-size="12" fill="var(--mn-text)">RRF fuse</text>
		<line x1="140" y1="29" x2="218" y2="70" stroke="var(--mn-text-secondary)" stroke-width="1.5"/>
		<line x1="140" y1="115" x2="218" y2="80" stroke="var(--mn-text-secondary)" stroke-width="1.5"/>
		<rect x="400" y="55" width="140" height="40" rx="8" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="470" y="73" text-anchor="middle" font-size="12" fill="var(--mn-text)">cross-encoder</text>
		<text x="470" y="90" text-anchor="middle" font-size="10" fill="var(--mn-text-secondary)">rescore, keep top-5</text>
		<line x1="340" y1="75" x2="398" y2="75" stroke="var(--mn-accent)" stroke-width="1.5" marker-end="url(#moearrow)"/>
		<text x="370" y="67" text-anchor="middle" font-size="10" fill="var(--mn-text-secondary)">~60 docs</text>
		<text x="470" y="120" text-anchor="middle" font-size="10" fill="var(--mn-text-secondary)">expensive but precise</text>
	</svg>
	<figcaption class="md">The two-stage funnel. Cheap recall (BM25 + dense, fused by RRF) gathers a broad candidate set; an expensive cross-encoder then reads each (query, doc) pair and keeps only the best. You cannot run the cross-encoder first — it is too slow over the whole corpus.</figcaption>
</figure>
</div>

<div class="md">
#### Reranking: the expensive second look

Dense and BM25 are **first-stage** retrievers: they are cheap, so they can score *all* of the corpus, but they do so *coarsely* — a dense model scores the query and a document *separately* (two encodings, one distance), so it never actually reads them together. A **cross-encoder** is the **second-stage** reranker: it takes the query *and* a candidate document as a single input, runs them through a transformer *jointly*, and outputs a relevance score for that pair. Because it reads the pair, it is far more precise — it can tell that a chunk *mentions* the topic but does not *answer* the question, which a first-stage similarity cannot.

But a cross-encoder is $O(N)$ — one expensive forward pass per candidate — so it is **impossible as a first stage** (you would run it over the whole corpus). That is the entire logic of the two-stage design: cheap recall gathers maybe 50–100 candidates (broad, possibly wrong), and the cross-encoder rescues the *top few* (narrow, precise). You spend the expensive computation only where it matters, on the shortlist. The funnel shape — wide and cheap, then narrow and expensive — is the same shape as a search engine, a recruiting pipeline, and a courtroom; retrieval borrowed it because the arithmetic forced it.
</div>

<div class="md">
#### Contextual retrieval: fix the chunk at index time

A recurring failure is that a chunk, *out of context*, is not retrievable. A paragraph that says "the failure mode was severe" is a great answer — but if the word "failure" never appears in the query, no retriever finds it, because the chunk, standing alone, does not say what it is *about*. **Contextual retrieval** \cite[Ford, Anthropic (2024)]{contextualretrieval2024} addresses this at **index time**: before embedding a chunk, prepend a short piece of LLM-written context that orients the chunk ("this paragraph is from a post-mortem about the checkout service's 2024-03-14 incident, and it describes the failure mode"), so the *enriched* chunk is what gets embedded and retrieved. Reported to cut the retrieval-failure rate by roughly half \cite[Ford, Anthropic (2024)]{contextualretrieval2024}.

The idea generalizes: retrieval quality is set at **index time** as much as query time, and you can spend LLM compute at index time — once, per chunk — to make each chunk self-sufficient. It is the retrieval analog of doing the hard work up front.
</div>

<div class="md">
#### Why RAG underperforms: the honest half

None of the above is a substitute for the fact that RAG *fails*, and the failure modes are structural (\cite[Gao et al., 2023]{ragsurvey2023}):

* **Retrieval errors propagate.** The model answers from what it is *given*. If the retrieval misses the right chunk — because the chunk is small, out-of-context, or a rare-term case the dense side lost — the model is handed a partial or wrong context and then *confidently* answers from it. The error is in the retrieval, but it looks like a model failure. This is why you must be able to tell the two apart (see the [Evaluation](evaluation.php) chapter, including its section on building your own eval): a "bad answer" whose retrieved context was actually *wrong or incomplete* is a retrieval bug, not a model bug.
* **Lost in the middle.** Even when the right chunk *is* retrieved, it may not be *used*. \cite[Liu et al. (2023)]{liu2023lostmiddle} showed that models use the **start and end** of a long context best and use the **middle** worst — a "U-shaped" attention over the given context. So a relevant chunk buried in the middle of a long retrieved context is retrieved but *ignored*. This is a model property, not a retrieval one, and it is why *how many* chunks you stuff in, and *in what order*, matters as much as *which* chunks.
* **Context pollution.** The chunks you retrieve are *assumed* relevant; some are not. A retrieved-but-wrong chunk does not just fail to help — it *steers* the answer, because the model is told "here is your context" and integrates what it is given. Retrieval that is slightly wrong is worse than no retrieval at all, in the sense that it adds *confident* noise to the context the model is asked to rely on.

The through-line: RAG is not a feature you add; it is a **pipeline with two failure points** (retrieval and integration), and each has its own diagnosis. "Just add RAG" is not a free lunch because the two halves fail independently, and the second hides the first — a confidently wrong answer from a *good* model over a *bad* context is the hardest failure to see, because everything in the model looks fine.
</div>

<div class="md">
### Summary

| Question | Answer |
|----------|--------|
| What is RAG? | Fetch relevant docs $\rightarrow$ inject into prompt $\rightarrow$ LLM answers grounded in evidence |
| How is data stored? | As dense vectors in a vector DB, indexed with ANN algorithms like HNSW |
| How is data found? | Cosine similarity between $\vec{q}$ and stored $\vec{v}_i$. Top-$K$ results returned |
| RAG vs. ICL? | ICL = manual prompt engineering. RAG = automated retrieval that *feeds* ICL. Complementary |
| RAG vs. long context? | RAG searches millions of docs cheaply. Long context holds ~1 book expensively. Best used together |
| Are the LLM's weights changed? | **No.** RAG only changes the *input*. The model itself is untouched |
</div>

<div class="md">
## History

### Bush 1945: The Memex, Hypertext, and Personal Information Retrieval

The RAG pipeline described in this chapter has a longer ancestry than 2020. Its conceptual blueprint — a personal, queryable store of human knowledge with associative links between documents, retrieved at the moment of use to augment a human's thinking — was drawn in 1945 by \citeauthor{bush1945aswemaythink} (\citeyear{bush1945aswemaythink}) in *The Atlantic Monthly*, in an essay that became the founding text of hypertext and personal information retrieval. \citeauthor{bush1945aswemaythink} named the device the **memex** ("memory extender") and described it as a desk-sized electromechanical console that would store a personal library of microfilmed books and records, let the user consult them on translucent screens at will, and — this is the part the field remembered — allow the user to build **associative trails** between documents by stringing them together with named links, so that consulting one document would automatically pull up the next.

<div class="smart-quote" data-cite="bush1945aswemaythink">
The human mind operates by association. With one item in its grasp, it snaps instantly to the next that is suggested by the association of thoughts, in accordance with some intricate web of trails carried by the cells of the brain. [...] Selection by association, rather than indexing, may yet be mechanized.
</div>

Bush's diagnosis of why such a device was needed has aged remarkably well. He calls the problem the *crisis of selection*: the volume of published knowledge had grown past any human's ability to keep up with, and the existing tools for finding it — Dewey indices, the Library of Congress catalog, professional abstracting services — were optimised for *retrieval by metadata* (title, author, subject) and were useless for the question the working scholar actually asks, which is *what do I already have in my head that connects to this*. Bush's answer was to mechanise a different operation: not "search by keyword", but **"follow a trail of associated items"**, where each item can name the next. The trail is the user's private graph of "this reminds me of that", which the memex stores and lets the user replay, share, and accumulate.

Read against the present chapter, the mapping to RAG is exact:

| Memex (1945) | Modern RAG |
|---|---|
| Personal library of microfilmed documents | A vector index of an organisation's documents |
| "Selection by association" | Embedding-based semantic search (or hybrid BM25 + dense) |
| Stored, named **trails** linking documents | Stored, retrieved **chunks** injected into an LLM prompt |
| "The human mind snaps instantly to the next item" | The LLM attends over retrieved context to produce the next token |
| Consulting a doc on the translucent screen | Reading a chunk out of a vector DB at query time |
| The memex user's associative memory | The LLM's context window |

Three differences matter. First, Bush's "association" was *human-defined* — the user built the trails — whereas modern dense retrieval learns associations from co-occurrence statistics; this is Bush in spirit (associative access) but not in mechanism (machine-learned similarity). Second, Bush's device **augmented a human reader**, not an LLM; the LLM is the new reader, and the augmentation has been upgraded from "the user's cognition" to "the model's prompt". Third, and most strikingly, Bush's essay did **not** anticipate the cheapness constraint that defines modern RAG: he imagined dedicated microfilm hardware in every office, while contemporary RAG assumes the documents already live somewhere (the web, a wiki, an email archive) and only the *index* and the *retriever* are new. In every other respect — personal library, associative access, named links, retrieved at the moment of use to support the user's train of thought — \citeauthor{bush1945aswemaythink}'s memex is the engineering plan a modern RAG system executes eighty years later.

Two things did not have to wait eighty years. \citeauthor{bush1945aswemaythink}'s central *technical* prediction — that information would be retrieved by **associative** rather than by **alphabetical or categorical** links — is now the standard practice in retrieval: dense vectors retrieve by learned similarity, not by category. And his central *cultural* prediction — that the volume of human knowledge was about to outrun any individual's ability to navigate it without mechanical aid — is now the universal assumption of every knowledge-worker's morning.
</div>

<div class="md">
### Before embeddings: SMART, tf-idf, and BM25

Long before neural embeddings, retrieval was lexical and statistical. Gerard Salton's SMART system represented documents as vectors of term weights and ranked them by cosine similarity, the direct ancestor of today's vector scoring. The weighting scheme now called tf-idf — term frequency down-weighted by how rare a term is across the collection — grew out of that work, and the probabilistic Okapi BM25 ranker, developed in the 1990s, is still a hard baseline \cite{salton1975vectorspace, salton1988termweighting, robertson2009bm25}. Modern hybrid RAG runs this old machinery beside its embeddings.

### Open-domain QA: retrieve, then read

Open-domain question answering turned retrieval into a benchmark problem. The TREC QA tracks of the late 1990s asked systems to answer factoid questions from a large text collection, joining retrieval and answer extraction in one pipeline \cite{voorhees1999trecqa}. SQuAD (2016) then isolated the reading-comprehension half: given a paragraph, find the answer span \cite{rajpurkar2016squad}. The two-stage pattern — retrieve passages, then read them — is exactly the shape of RAG.

### Dense retrieval: DPR and REALM

The neural turn came when retrieval itself was trained. Dense Passage Retrieval (DPR) replaced sparse term matching with two BERT encoders, one for questions and one for passages, trained so that a question's vector is close to its gold passage; it beat BM25 on open-domain QA \cite{karpukhin2020dpr}. REALM went further, pre-training a language model with a learned retriever and treating the retrieved document as a latent variable \cite{guu2020realm}. These papers made retrieval a differentiable, learned component rather than a fixed inverted index.

### RAG, RETRO, Atlas, Self-RAG, GraphRAG

Lewis et al.'s RAG (2020) paired a DPR retriever with a seq2seq generator and marginalised over retrieved passages during generation \cite{lewis2020rag}. RETRO retrieved from trillions of tokens at the level of token chunks and fused the retrieved neighbours into the transformer's attention \cite{borgeaud2022retro}; Atlas showed that a strong retriever plus a modest reader could reach few-shot state of the art on knowledge-intensive tasks \cite{izacard2022atlas}. Self-RAG later trained a model to emit reflection tokens that decide when to retrieve and whether a passage supports the claim \cite{asai2023selfrag}, while GraphRAG built an entity-and-relation graph over the corpus and summarised its communities to answer global questions \cite{edge2024graphrag}.
</div>

<div class="mn-quiz" data-quiz="rag"><script type="application/json">{"title": "Retrieval-augmented generation", "questions": [{"q": "What does retrieval-augmented generation do?", "options": ["Retrieves relevant documents and puts them into the prompt before the model answers", "Retrains the entire model on a new document collection before answering each question", "Removes hallucinations completely by deleting every unsupported sentence it finds", "Increases the model's parameter count so that it can memorize many more facts"], "answer": 0, "explain": "Fresh or private knowledge enters through the context, not the weights."}, {"q": "Why are documents split into chunks before indexing?", "options": ["Smaller pieces can be matched precisely and fit into the context window", "Because embedding models only accept one word or a short phrase at a time", "To remove duplicate passages and keep only the newest version", "To make each passage easier for a human reader to skim quickly"], "answer": 0, "explain": "Chunk size trades off precision against context."}, {"q": "What is hybrid search?", "options": ["Combining keyword search (e.g. BM25) with dense vector search", "Searching the same query in two different natural languages at once", "Running two separate embedding models on two different GPUs", "Retrieving both images and text from a mixed-media document store"], "answer": 0, "explain": "Keywords catch exact names and numbers; vectors catch paraphrases."}, {"q": "What does a cross-encoder re-ranker do?", "options": ["Reads query and candidate together to re-score the top results more accurately", "Encrypts the retrieved documents so that only the model itself can read them", "Translates the query and documents into a single shared natural language", "Generates the final answer directly from the retrieved documents and the user query"], "answer": 0, "explain": "It is slower than vector search, so it is applied only to a short list."}]}</script></div>
