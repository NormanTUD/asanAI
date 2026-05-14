<?php include_once("functions.php"); ?>

<div class="smart-quote" data-cite="alankayfuture">
The best way to predict the future is to invent it.
</div>

<div class="md">
## What is RAG?

A standard LLM can only use what it memorised during training. Ask it about a document it never saw, and it either **hallucinates** or says *"I don't know."*

**Retrieval-Augmented Generation (RAG)** gives the LLM an external, searchable memory. Before the model generates an answer, a *retriever* finds the most relevant passages from a document store and injects them into the prompt. The LLM then answers **grounded in those passages**.

$$
\text{Query} \;\xrightarrow{\text{embed}}\; \vec{q} \;\xrightarrow{\text{search}}\; \text{Top-}K\text{ chunks} \;\xrightarrow{\text{augment prompt}}\; \text{LLM} \;\rightarrow\; \text{Grounded Answer}
$$

**Key insight:** The LLM's weights are *never changed*. RAG is purely an **input-enrichment** strategy.
</div>

<div id="raglab-pipeline-diagram"></div>

<div class="md">
## The RAG Pipeline, Step by Step

### Phase 1: Indexing (offline, done once)

**Step 1, Chunk the documents.**
Split each source (PDF, webpage, database row) into small, overlapping passages, typically 200–500 tokens. Overlap ensures no information falls between the cracks.

**Step 2, Embed each chunk.**
Pass every chunk through an *embedding model* (e.g. OpenAI `text-embedding-3-small` or open-source `bge-base`). This converts text into a **dense vector**, a list of, say, 768 floating-point numbers that encodes the *meaning* of the passage:

$$
\text{chunk}_i \;\xrightarrow{\text{Embedding Model}}\; \vec{v}_i \in \mathbb{R}^{768}
$$

**Step 3, Store in a vector database.**
Save every $(\vec{v}_i,\; \text{chunk\_text}_i,\; \text{metadata}_i)$ triple in a specialised database optimised for nearest-neighbor search (FAISS, Pinecone, Weaviate, Chroma, Qdrant).

### Phase 2: Retrieval + Generation (online, every query)

**Step 4, Embed the query.**
The user's question is passed through the *same* embedding model, producing $\vec{q}$ in the same vector space.

**Step 5, Similarity search.**
The vector DB finds the $K$ stored chunks whose vectors are closest to $\vec{q}$, usually via **cosine similarity**:

$$
\text{sim}(\vec{q}, \vec{v}_i) = \frac{\vec{q} \cdot \vec{v}_i}{\|\vec{q}\| \; \|\vec{v}_i\|}
$$

Approximate nearest-neighbor algorithms like **HNSW** handle billions of vectors in **&lt; 50 ms**.

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
The LLM reads the enriched prompt and produces a **grounded** answer. Hallucination is dramatically reduced because the relevant facts are *right there* in the context window.
</div>

<div class="md">
## How Data Is Stored: Vector Databases

A vector database is **not** a traditional SQL database. It doesn't search by keyword matching. It indexes high-dimensional vectors so that *semantic similarity* queries are fast.

### What's actually stored?

| Field | Example | Purpose |
|-------|---------|---------|
| `id` | `doc_0042` | Unique identifier |
| `vector` | $[0.023, -0.841, 0.117, \ldots]$ | 768-dim embedding, the searchable "meaning" |
| `text` | "The Transformer was introduced in 2017…" | Original chunk, returned to the LLM |
| `metadata` | `{source: "vaswani2017", page: 3}` | Filtering, citations |

### How is search so fast?

Brute-force comparison against millions of vectors would be $O(n \cdot d)$ per query, too slow. Vector DBs use **Approximate Nearest Neighbor (ANN)** algorithms:

- **HNSW** (Hierarchical Navigable Small World): builds a multi-layer graph. Searching "hops" through the graph, narrowing in on the target region, like navigating a city by jumping between landmarks. *Most popular in production.*
- **IVF** (Inverted File Index): clusters vectors into Voronoi cells at index time. At query time, only a few nearby cells are searched.
- **Product Quantization**: compresses vectors into compact codes, trading a tiny bit of accuracy for massive memory savings.

Result: querying **1 billion vectors in ~50 ms** on a single machine.
</div>

<div class="md">
## 🔍 Interactive: Similarity Search Demo
</div>

<div id="raglab-demo-container">
    <p class="raglab-demo-subtitle">Type a query and see which "documents" match by cosine similarity. This is a toy demo using tiny vectors, real systems use 768+ dimensions, but the principle is identical.</p>
    <input type="text" id="raglab-query-input" placeholder="Try: &quot;How do neural networks learn?&quot;" value="How do neural networks learn?" />
    <button id="raglab-search-btn">🔎 Search</button>
    <div id="raglab-results"></div>
    <details class="raglab-details">
        <summary>How does this demo work?</summary>
        <p>Each "document" and your query are mapped to a tiny vector using keyword heuristics (a stand-in for a real embedding model). The system computes cosine similarity between your query vector and every document vector, then ranks them. In production, the embedding model is a neural network and vectors have hundreds of dimensions.</p>
    </details>
</div>

<div class="md">
## RAG vs. In-Context Learning (ICL)

**In-Context Learning** is when you put examples or instructions directly in the prompt and the LLM "learns" the task on the fly, no weight updates, just pattern-matching over the provided tokens.

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
### Why do they *seem* different?

ICL relies on whatever the user manually puts in the prompt. RAG **automates the selection** using vector search. The LLM itself doesn't know the difference, it just sees tokens in its context window either way. The magic of RAG is in the retrieval step *before* the LLM runs.

$$
\underbrace{\text{RAG}}_{\text{automated retrieval}} \;\longrightarrow\; \underbrace{\text{ICL}}_{\text{LLM reads retrieved chunks}}
$$

## RAG and Long Context Windows

Modern LLMs have ever-growing context windows: 128K tokens (GPT-4), 200K (Claude), even 1M+ (Gemini). So why bother with RAG?
</div>

<div id="raglab-context-table"></div>

<div class="md">
### The "Lost in the Middle" Problem

Research shows that LLMs pay the most attention to the **beginning** and **end** of long contexts, often ignoring information buried in the middle. Even if a 200K-token window *can* hold your data, the model may fail to *use* it.

RAG sidesteps this by only injecting the 3–5 most relevant chunks, keeping them front-and-center where attention is strongest.

In practice, **RAG + long context** work together: RAG retrieves the top 10–20 chunks, and the long context window gives the model room to reason over all of them at once.

## Limitations &amp; Failure Modes

- **Garbage in, garbage out.** If the document store contains wrong information, RAG will confidently retrieve and present it.
- **Chunking matters.** If a critical fact is split across two chunks and neither is retrieved, the answer will be incomplete.
- **Embedding blind spots.** Embedding models can misjudge similarity, a query about "Python" (the snake) might retrieve docs about "Python" (the language).
- **No reasoning over absence.** RAG can't tell you "this information doesn't exist in the database." It will retrieve the *closest* thing, which may be irrelevant.
- **Latency.** The retrieval step adds ~50–200 ms per query.

## Summary

| Question | Answer |
|----------|--------|
| What is RAG? | Fetch relevant docs $\rightarrow$ inject into prompt $\rightarrow$ LLM answers grounded in evidence |
| How is data stored? | As dense vectors in a vector DB, indexed with ANN algorithms like HNSW |
| How is data found? | Cosine similarity between $\vec{q}$ and stored $\vec{v}_i$. Top-$K$ results returned |
| RAG vs. ICL? | ICL = manual prompt engineering. RAG = automated retrieval that *feeds* ICL. Complementary |
| RAG vs. long context? | RAG searches millions of docs cheaply. Long context holds ~1 book expensively. Best used together |
| Are the LLM's weights changed? | **No.** RAG only changes the *input*. The model itself is untouched |
</div>
