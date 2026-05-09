<?php include_once("functions.php"); ?>

<div class="md">
In the RAG chapter, we saw that a user's query is embedded into a vector and compared against stored document vectors using cosine similarity. In the web search chapter, we saw that retrieved pages are chunked and re-ranked before being fed to the LLM. But we glossed over a critical question: **how do you search through millions or billions of vectors in under 50 milliseconds?**

The answer is **vector databases** — specialized systems built from the ground up for high-dimensional similarity search. They are the invisible engine behind every RAG pipeline, every semantic search bar, and every recommendation system you've ever used.

$$
\text{Query} \;\xrightarrow{\text{embed}}\; \vec{q} \in \mathbb{R}^{768} \;\xrightarrow{\text{ANN search}}\; \text{Top-}K\text{ nearest vectors} \;\xrightarrow{\text{return docs}}\; \text{Relevant passages}
$$

**Key insight:** Vector databases don't find the *exact* nearest neighbors. They find *approximate* nearest neighbors — trading a tiny amount of accuracy for enormous speed gains. This is the engineering trick that makes RAG possible at scale.
</div>

<div id="vslab-pipeline-diagram"></div>

<div class="md">
## The Three Paradigms of Search

Before diving into vector databases, it's essential to understand what they replaced and what they complement. There are three fundamentally different approaches to finding information in a corpus:

### 1. Keyword Search (Lexical / Sparse)

The oldest and most intuitive approach. You type words, the system finds documents containing those exact words.

**How it works:** The dominant algorithm is **BM25** (Best Matching 25), an evolution of TF-IDF. For a query $q$ and document $d$:

$$
\text{BM25}(q, d) = \sum_{t \in q} \text{IDF}(t) \cdot \frac{f(t, d) \cdot (k_1 + 1)}{f(t, d) + k_1 \cdot \left(1 - b + b \cdot \frac{|d|}{\text{avgdl}}\right)}
$$

Where:
- $f(t, d)$ = frequency of term $t$ in document $d$
- $\text{IDF}(t)$ = inverse document frequency (rare words score higher)
- $k_1$ and $b$ are tuning parameters
- $|d|$ / $\text{avgdl}$ = document length normalized by average

**Strengths:** Fast, interpretable, excellent for exact matches ("error code 0x80070005").

**Weaknesses:** Completely blind to meaning. Searching "car" won't find documents about "automobile." Searching "How do I fix a broken heart?" returns cardiology articles.

### 2. Semantic Search (Dense Vector Search)

Instead of matching words, match **meanings**. Both the query and every document are converted to dense vectors by an embedding model. Search becomes geometric: find the vectors closest to the query vector.

$$
\text{sim}(\vec{q}, \vec{v}_i) = \frac{\vec{q} \cdot \vec{v}_i}{\|\vec{q}\| \; \|\vec{v}_i\|}
$$

**Strengths:** Understands synonyms, paraphrases, and conceptual similarity. "Car" matches "automobile," "vehicle," and even "Tesla Model 3."

**Weaknesses:** Can miss exact keyword matches. Searching for a specific product code like "XJ-4200" may return semantically similar but wrong products. Also, embedding models have blind spots — they can confuse "Python" (snake) with "Python" (language).

### 3. Hybrid Search

The best modern systems combine both approaches:

$$
\text{score}_{\text{hybrid}} = \alpha \cdot \text{BM25}(q, d) + (1 - \alpha) \cdot \text{cosine}(\vec{q}, \vec{d})
$$

Where $\alpha$ controls the balance. This ensures you get both exact keyword precision and semantic understanding. Most production RAG systems use hybrid search.

| Approach | Matches on | Strengths | Weaknesses |
|----------|-----------|-----------|------------|
| **Keyword (BM25)** | Exact words | Fast, precise for specific terms | No understanding of meaning |
| **Semantic (Vector)** | Meaning | Handles synonyms, paraphrases | Can miss exact matches |
| **Hybrid** | Both | Best of both worlds | More complex to implement |
</div>

<div id="vslab-search-comparison"></div>

<div class="md">
## How Vector Databases Work

A vector database is **not** a traditional relational database with an added vector column. It is a fundamentally different data structure, optimized for a fundamentally different operation: instead of `WHERE name = 'Alice'`, it answers `FIND 10 NEAREST TO [0.23, -0.87, 0.11, ...]`.

### What's stored?

Each record in a vector database contains:

| Field | Example | Purpose |
|-------|---------|---------|
| `id` | `chunk_0042` | Unique identifier |
| `vector` | $[0.023, -0.841, 0.117, \ldots]$ | 768-dim (or 1536-dim) embedding |
| `text` | "The Transformer was introduced in 2017…" | Original chunk, returned to the LLM |
| `metadata` | `{source: "vaswani2017", page: 3, date: "2017-06-12"}` | For filtering and citations |

### The Brute-Force Problem

Given $N$ vectors of dimension $d$, a naive exact search computes:

$$
\text{sim}(\vec{q}, \vec{v}_i) \quad \forall \; i \in \{1, \ldots, N\}
$$

That's $O(N \cdot d)$ operations per query. For 1 billion vectors at 768 dimensions, that's **768 billion floating-point operations per query**. At even 1 TFLOP/s, that's nearly a second — far too slow for real-time applications.

The solution: **Approximate Nearest Neighbor (ANN)** algorithms that sacrifice a tiny amount of recall (typically 95-99%) for dramatic speed improvements (1000x or more).

## ANN Algorithms: How Billions of Vectors Are Searched in Milliseconds

### HNSW (Hierarchical Navigable Small World)

HNSW is the most popular ANN algorithm in production today. It builds a **multi-layer graph** where each vector is a node, and edges connect nearby vectors.

**Intuition:** Imagine navigating a city. At the top layer, you have highways connecting distant landmarks (coarse navigation). At lower layers, you have local streets connecting nearby buildings (fine navigation). To find a specific address, you start on the highway, jump to the right neighborhood, then walk the local streets.

**How it works:**

1. **Index time:** Each new vector is inserted into the graph. At each layer, it connects to its nearest existing neighbors. Higher layers are sparser (fewer nodes), lower layers are denser.

2. **Query time:**
   - Start at the top (sparsest) layer
   - Greedily move to the neighbor closest to the query vector
   - When no closer neighbor exists at this layer, drop down one level
   - Repeat until reaching the bottom (densest) layer
   - Return the $K$ closest nodes found

$$
\text{Search complexity: } O(\log N) \quad \text{vs. brute force } O(N)
$$

**Result:** Searching 1 billion vectors takes ~100-200 "hops" instead of 1 billion comparisons.
</div>

<div id="vslab-hnsw-diagram"></div>

<div class="md">
### IVF (Inverted File Index)

IVF takes a different approach: **pre-cluster** the vectors, then only search relevant clusters.

**How it works:**

1. **Index time:** Run k-means clustering to partition all $N$ vectors into $C$ clusters (called Voronoi cells). Store which vectors belong to which cluster.

2. **Query time:**
   - Find the $n_{\text{probe}}$ clusters whose centroids are closest to $\vec{q}$
   - Only search vectors within those clusters
   - Return the top-$K$ results

If $C = 1000$ and $n_{\text{probe}} = 10$, you only search 1% of the database.

$$
\text{Search cost} \approx O\left(\frac{N \cdot n_{\text{probe}}}{C}\right) \ll O(N)
$$

**Tradeoff:** More probes = higher recall but slower. Fewer probes = faster but might miss relevant vectors in neighboring clusters.

### Product Quantization (PQ)

PQ addresses a different bottleneck: **memory**. Storing 1 billion 768-dimensional float32 vectors requires:

$$
10^9 \times 768 \times 4 \text{ bytes} = 3.07 \text{ TB of RAM}
$$

PQ compresses each vector by:
1. Splitting the 768 dimensions into $M$ subspaces (e.g., 96 groups of 8 dimensions)
2. Within each subspace, learning a codebook of 256 centroids via k-means
3. Replacing each sub-vector with its nearest centroid's **1-byte ID**

Compressed size: $10^9 \times 96 \times 1 \text{ byte} = 96 \text{ GB}$ — a **32x compression**.

Distance computation uses precomputed lookup tables, making it extremely fast despite the compression.

### Comparison of ANN Algorithms

| Algorithm | Speed | Memory | Recall | Best for |
|-----------|-------|--------|--------|----------|
| **HNSW** | Very fast | High (full vectors + graph) | 95-99% | Low-latency production search |
| **IVF** | Fast | Medium | 90-98% | Large-scale batch search |
| **PQ** | Fast | Very low | 85-95% | Memory-constrained environments |
| **IVF-PQ** | Fast | Low | 90-97% | Billion-scale search |
| **HNSW + PQ** | Very fast | Medium | 93-98% | Best balance for production |

In practice, these are often **combined**: HNSW for the graph navigation, PQ for memory compression, and IVF for pre-filtering. Libraries like FAISS support all combinations.

## The Vector Database Landscape

### Open-Source Libraries (embedded, no server)

| Library | Creator | Language | Notes |
|---------|---------|----------|-------|
| **FAISS** | Meta AI | C++ / Python | The gold standard. Supports IVF, PQ, HNSW. Runs on GPU |
| **Annoy** | Spotify | C++ / Python | Tree-based. Fast reads, slow writes. Used for recommendations |
| **HNSWlib** | Yury Malkov | C++ / Python | Pure HNSW implementation. Very fast |
| **USearch** | Unum | C++ / many bindings | Compact, fast, cross-platform |

### Managed Vector Databases (server-based)

| Database | Type | Key Feature |
|----------|------|-------------|
| **Pinecone** | Fully managed cloud | Easiest to use, no infrastructure to manage |
| **Weaviate** | Open-source + cloud | Built-in hybrid search (BM25 + vector) |
| **Qdrant** | Open-source + cloud | Rich filtering, Rust-based, fast |
| **Chroma** | Open-source | Lightweight, designed for prototyping |
| **Milvus** | Open-source + cloud | Billion-scale, GPU-accelerated |
| **pgvector** | PostgreSQL extension | Add vector search to existing Postgres DB |

### How to Choose?

| If you need… | Use… |
|--------------|------|
| Quick prototype / learning | **Chroma** or **FAISS** |
| Production RAG with filtering | **Qdrant** or **Weaviate** |
| Billion-scale search | **Milvus** or **FAISS** with IVF-PQ |
| Minimal infrastructure | **Pinecone** (managed) or **pgvector** (if you already use Postgres) |
| Hybrid search out of the box | **Weaviate** |

## The Embedding Model: The Unsung Hero

A vector database is only as good as the vectors you put into it. The **embedding model** determines the quality of semantic search.

### What makes a good embedding model?

1. **Semantic faithfulness:** Similar meanings → similar vectors
2. **Dimensionality:** Higher dimensions capture more nuance but cost more memory and compute
3. **Training data:** Models trained on diverse text generalize better
4. **Instruction-awareness:** Modern models accept a task prefix ("search_query:", "search_document:") to optimize for retrieval

### Popular Embedding Models (2025-2026)

| Model | Dimensions | Creator | Notes |
|-------|-----------|---------|-------|
| `text-embedding-3-small` | 1536 | OpenAI | Good general-purpose, API-based |
| `text-embedding-3-large` | 3072 | OpenAI | Higher quality, higher cost |
| `bge-base-en-v1.5` | 768 | BAAI | Open-source, strong performance |
| `e5-mistral-7b-instruct` | 4096 | Microsoft | LLM-based embeddings, very high quality |
| `nomic-embed-text-v1.5` | 768 | Nomic AI | Open-source, Matryoshka (variable dim) |
| `mxbai-embed-large-v1` | 1024 | Mixedbread | Top-tier open-source |

### The Embedding Pipeline
</div>

<pre class="vslab-code-block"><code># Pseudocode: Indexing documents into a vector database

from embedding_model import embed
from vector_db import VectorDB

db = VectorDB(algorithm="hnsw", dimensions=768)

# 1. Chunk documents
chunks = split_into_chunks(documents, size=400, overlap=50)

# 2. Embed each chunk
for chunk in chunks:
    vector = embed(chunk.text)  # → [0.023, -0.841, 0.117, ...]
    db.insert(
        id=chunk.id,
        vector=vector,
        text=chunk.text,
        metadata={"source": chunk.source, "page": chunk.page}
    )

# 3. Query
query_vector = embed("How does attention work in transformers?")
results = db.search(query_vector, top_k=5)

# results = [
#   {id: "chunk_42", score: 0.91, text: "Self-attention computes..."},
#   {id: "chunk_17", score: 0.87, text: "The attention mechanism..."},
#   ...
# ]</code></pre>

<div class="md">
## Chunking: The Art of Splitting Documents

How you split documents into chunks has a **massive** impact on retrieval quality. Too large, and irrelevant text dilutes the signal. Too small, and critical context is lost.

### Chunking Strategies

| Strategy | How it works | Pros | Cons |
|----------|-------------|------|------|
| **Fixed-size** | Split every $N$ tokens | Simple, predictable | Splits mid-sentence |
| **Sentence-based** | Split on sentence boundaries | Preserves meaning | Variable sizes |
| **Paragraph-based** | Split on paragraph breaks | Natural units | Can be too large |
| **Recursive** | Try large splits first, then smaller | Respects document structure | More complex |
| **Semantic** | Split when embedding similarity drops | Meaning-aware boundaries | Slow, requires embedding calls |

### Overlap

Most systems use **overlapping chunks** — each chunk shares 50-100 tokens with its neighbors. This ensures that information at chunk boundaries isn't lost:

$$
\text{Chunk}_1: \text{tokens } [0, 400] \quad \text{Chunk}_2: \text{tokens } [350, 750] \quad \text{Chunk}_3: \text{tokens } [700, 1100]
$$

The 50-token overlap means a sentence split between chunks appears in full in at least one of them.

## Metadata Filtering: Narrowing Before Searching

Raw vector search returns the semantically closest chunks regardless of source, date, or category. **Metadata filtering** adds structured constraints:
</div>

<pre class="vslab-code-block"><code># Search only in documents from 2026, tagged as "research"
results = db.search(
    vector=query_vector,
    top_k=5,
    filter={
        "year": {"$gte": 2026},
        "category": "research"
    }
)</code></pre>

<div class="md">
This is called **pre-filtering** (narrow first, then search) or **post-filtering** (search first, then narrow). Pre-filtering is faster but can miss relevant results; post-filtering is more thorough but slower. Most modern vector databases support both.

## Re-Ranking: The Second Pass

Vector search retrieves candidates quickly but approximately. A **re-ranker** then scores each candidate more carefully:

| Stage | Speed | Quality | Model |
|-------|-------|---------|-------|
| **Retrieval** (vector search) | ~10ms for millions of docs | Good (approximate) | Bi-encoder (separate embeddings) |
| **Re-ranking** | ~50-200ms for top 20-50 | Excellent | Cross-encoder (joint query-doc scoring) |

A **bi-encoder** embeds query and document separately — fast but can miss subtle interactions. A **cross-encoder** reads query and document *together* as a single input — slow but much more accurate.

$$
\underbrace{\text{Vector DB: } 1M \rightarrow 50}_{\text{fast, approximate}} \;\xrightarrow{\text{re-ranker}}\; \underbrace{50 \rightarrow 5}_{\text{slow, precise}} \;\rightarrow\; \text{LLM prompt}
$$

This two-stage pipeline is standard in production RAG systems.

## Connecting It All: Vector Search Powers Everything

Vector databases are not just for RAG. They are the backbone of:

| Application | What's stored | What's queried |
|-------------|--------------|----------------|
| **RAG** | Document chunks | User questions |
| **Semantic search** | Web pages, articles | Search queries |
| **Recommendation** | Product/content embeddings | User preference vectors |
| **Duplicate detection** | Document embeddings | New documents |
| **Image search** | CLIP image embeddings | Text descriptions |
| **Anomaly detection** | Normal behavior vectors | New observations |

The core operation is always the same: embed → store → search → retrieve.

## Limitations & Challenges

- **Embedding quality ceiling:** If the embedding model doesn't capture a distinction, the vector DB can't find it
- **Curse of dimensionality:** In very high dimensions, distances between all points converge, making search harder
- **Index staleness:** Adding new documents requires re-indexing or incremental updates
- **Cold start:** An empty vector DB has nothing to search — you need documents first
- **Multilingual gaps:** Embedding models may perform unevenly across languages
- **No reasoning:** Vector search finds *similar* content, not *correct* answers — that's the LLM's job

## Summary

| Question | Answer |
|----------|--------|
| What is a vector database? | A database optimized for high-dimensional similarity search using ANN algorithms |
| How is it different from SQL? | SQL matches exact values. Vector DBs match *meanings* via geometric distance |
| How is search so fast? | ANN algorithms (HNSW, IVF, PQ) reduce $O(N)$ to $O(\log N)$ |
| What is HNSW? | A multi-layer graph where search "hops" from coarse to fine, like navigating highways → local streets |
| Keyword vs. semantic vs. hybrid? | Keywords match words, semantic matches meaning, hybrid combines both |
| What is re-ranking? | A second, more accurate pass over retrieved candidates using a cross-encoder |
| What is chunking? | Splitting documents into 200-500 token passages for indexing |
| Which vector DB should I use? | Chroma for prototyping, Qdrant/Weaviate for production, FAISS/Milvus for billion-scale |
</div>

<div class="md">
## 🔍 Interactive: Keyword vs. Semantic Search
</div>

<div id="vslab-demo-container">
    <p class="vslab-demo-subtitle">Type a query and compare how keyword search (BM25) and semantic search (vector similarity) rank the same set of documents. Notice how they disagree on ambiguous or conceptual queries.</p>
    <input type="text" id="vslab-query-input" placeholder="Try: &quot;How do machines understand language?&quot;" value="How do machines understand language?" />
    <button id="vslab-search-btn">🔎 Compare Search Methods</button>
    <div id="vslab-results"></div>
    <details class="vslab-details">
        <summary>How does this demo work?</summary>
        <p>Keyword search counts exact word overlaps (a simplified BM25). Semantic search uses tag-based heuristic vectors as a stand-in for a real embedding model and computes cosine similarity. In production, the embedding model is a neural network producing 768+ dimensional vectors, and BM25 uses proper term frequency and inverse document frequency calculations. The principle is identical: keyword search matches surface forms, semantic search matches meaning.</p>
    </details>
</div>
