<?php include_once("functions.php"); ?>

<div class="md">
## How LLMs Actually Search the Web

When you ask ChatGPT, Claude, or Gemini a question that requires up-to-date information, the model doesn't "browse the internet" the way you do. Instead, a **tool-use pipeline** orchestrates a series of API calls, content fetches, and text extractions *before* the LLM ever generates a single token of its answer.

$$
\begin{gathered}
\text{User Query} \\
\downarrow \hspace{5pt} \text{\scriptsize intent detection} \\
\text{Search API call} \\
\downarrow \hspace{5pt} \text{\scriptsize fetch URLs} \\
\text{Extract text} \\
\downarrow \hspace{5pt} \text{\scriptsize chunk \& rank} \\
\text{Augmented Prompt} \\
\downarrow \\
\text{LLM Answer}
\end{gathered}
$$

**Key insight:** The LLM itself cannot "see" the internet. It relies on **external tools**, search APIs, web scrapers, and content parsers, that are orchestrated by a surrounding system. The LLM's role is to *decide when to search*, *formulate the query*, and *synthesize the results*.
</div>

<div id="wslab-pipeline-diagram"></div>

<div class="md">
## Step 1: Intent Detection, Does This Query Need a Search?

Not every question requires a web search. The system (or the LLM itself) first determines whether the query can be answered from training data alone or needs fresh information.

### How the decision is made:

| Signal | Example | Action |
|--------|---------|--------|
| Temporal keywords | "latest", "today", "2026" | → Search |
| Named entities + recency | "current CEO of Twitter" | → Search |
| Evergreen knowledge | "What is the Pythagorean theorem?" | → Answer directly |
| Explicit request | "Search the web for…" | → Search |
| Ambiguity / uncertainty | Model unsure about facts | → Search |

Modern systems use **few-shot prompting** or **fine-tuned classifiers** to make this decision. The LLM is given a system prompt like the following:
</div>

<pre class="wslab-code-block"><code>You have access to a `web_search(query)` tool.
Use it when:
- The user asks about current events or recent information
- You are not confident in your answer
- The user explicitly asks you to search

Do NOT use it when:
- The question is about well-established facts
- The question is about reasoning, math, or code logic</code></pre>

<div class="md">
## Step 2: Query Formulation

Once the LLM decides to search, it doesn't just forward the user's raw question to a search engine. It **reformulates** the query into something optimized for search:

| User says | LLM searches for |
|-----------|-------------------|
| "What's happening with the war?" | `"Ukraine Russia conflict latest developments May 2026"` |
| "Did that company go bankrupt?" | `"[company name from context] bankruptcy filing 2026"` |
| "How much does it cost now?" | `"[product name] current price 2026"` |

This is called **query transformation**, the LLM uses conversational context to produce a precise, keyword-rich search string. Some systems generate **multiple queries** to cover different angles of the question.

$$
\text{Conversational question} \;\xrightarrow{\text{LLM rewrite}}\; \text{Search-optimized query}
$$

## Step 3: The Search Engine, What's Actually Used?

This is the question everyone asks: *"What search engine does ChatGPT use?"*

### Commercial LLM providers use **Search APIs**:

| Provider | Search Backend | How it works |
|----------|---------------|--------------|
| OpenAI (ChatGPT) | **Bing Search API** (Microsoft partnership) | JSON API returns titles, snippets, URLs |
| Google (Gemini) | **Google Search** (internal) | Direct access to Google's index |
| Anthropic (Claude) | **Brave Search API** / tool-dependent | Via tool use or partner integrations |
| Perplexity | **Bing API + own crawler** | Hybrid: API results + custom index |
| You.com | **Own search index + Bing** | Proprietary index with web, news, code |

### For local/open-source LLMs:

| Solution | Type | Notes |
|----------|------|-------|
| **SearXNG** | Meta-search engine (self-hosted) | Aggregates Google, Bing, DuckDuckGo etc. without tracking |
| **Brave Search API** | Commercial API | Free tier available, privacy-focused |
| **Google Custom Search API** | Commercial API | 100 free queries/day, then paid |
| **Serper.dev** | Google SERP API | Fast, cheap, returns structured results |
| **Tavily** | AI-optimized search API | Designed specifically for LLM consumption |

### What does a Search API actually return?

The search API returns **structured JSON**, not rendered web pages:
</div>

<pre class="wslab-code-block"><code>{
  "results": [
    {
      "title": "Transformer Architecture Explained - 2026 Update",
      "url": "https://example.com/transformers-2026",
      "snippet": "The transformer architecture has evolved significantly since...",
      "date": "2026-04-15"
    },
    {
      "title": "New Advances in Attention Mechanisms",
      "url": "https://arxiv.org/abs/2026.12345",
      "snippet": "We propose a novel linear attention variant that reduces...",
      "date": "2026-03-22"
    }
  ]
}</code></pre>

<div class="md">
The LLM receives **titles, snippets, and URLs**, not full page content (at least not from the search step alone). This is similar to what you see on a Google results page before clicking any link.

## Step 4: Content Fetching, Loading the Actual Web Pages

Snippets from search results are often too short to answer complex questions. So the system **fetches full page content** from the top-ranked URLs. This is where it gets interesting.

### How web pages are loaded:
</div>

<pre class="wslab-code-block"><code>URL → HTTP GET request → Raw HTML → Parser → Clean text</code></pre>

<div class="md">
### The technical pipeline:

**1. HTTP Fetch**
A server-side process makes an HTTP GET request to the URL. This is *not* a browser, it's a headless HTTP client (like `curl`, Python's `requests`, or Node's `fetch`).

**2. HTML Parsing &amp; Cleaning**
Raw HTML is full of navigation bars, ads, scripts, and boilerplate. The system uses content extraction tools:

| Tool | What it does |
|------|--------------|
| **Readability.js** (Mozilla) | Extracts the "main content" from a page (like Reader Mode) |
| **Trafilatura** (Python) | Extracts and cleans article text from HTML |
| **BeautifulSoup** | General HTML parser, extract specific elements |
| **Playwright / Puppeteer** | Full headless browser, handles JavaScript-rendered pages |
| **Jina Reader API** | Converts any URL to clean markdown via API call |

**3. JavaScript-Rendered Pages (SPAs)**
Many modern websites render content with JavaScript. A simple HTTP GET returns an empty `&lt;div id="root"&gt;&lt;/div&gt;`. For these, the system needs a **headless browser** (Playwright/Puppeteer) that:
- Loads the page
- Executes JavaScript
- Waits for content to render
- Then extracts the final DOM

**4. Output: Clean Text or Markdown**
The extracted content is converted to plain text or markdown, stripping all HTML tags, scripts, styles, and navigation elements. This clean text is what gets fed to the LLM.

$$
\text{HTML (50KB)} \;\xrightarrow{\text{extract}}\; \text{Clean text (3KB)} \;\xrightarrow{\text{chunk}}\; \text{Relevant passages}
$$
</div>

<div id="wslab-fetch-diagram"></div>

<div class="md">
## Step 5: Chunking &amp; Ranking Retrieved Content

A single web page might contain 5,000+ tokens of text, too much to include for every result. The system:

1. **Chunks** the extracted text into passages (200–500 tokens each)
2. **Re-ranks** chunks by relevance to the original query using either:
   - Cosine similarity (same as RAG)
   - A **cross-encoder re-ranker** (a small model that scores query-passage pairs directly)
   - Simple keyword/BM25 scoring

Only the **top chunks** from the **top pages** make it into the final prompt.

### Token budget management:
</div>

<pre class="wslab-code-block"><code>Available context: ~128,000 tokens
System prompt:         ~500 tokens
User conversation:   ~2,000 tokens
Retrieved content:   ~4,000 tokens  ← carefully budgeted
Generation space:    ~2,000 tokens
─────────────────────────────────
Remaining unused:  ~119,500 tokens</code></pre>

<div class="md">
The system is conservative, it doesn't fill the entire context window with search results. It selects only the most relevant passages to keep the LLM focused.

## Step 6: Prompt Assembly &amp; Generation

The final prompt sent to the LLM looks something like this:
</div>

<pre class="wslab-code-block"><code>System: You are a helpful assistant with access to web search results.
Answer the user's question based on the search results provided.
Cite your sources using [1], [2], etc.
If the search results don't contain enough information, say so.

Search Results:

[1] Source: example.com/transformers-2026 (April 15, 2026)
"The transformer architecture has evolved significantly since the original
'Attention Is All You Need' paper. In 2026, the dominant variant uses..."

[2] Source: arxiv.org/abs/2026.12345 (March 22, 2026)
"We propose a novel linear attention variant that reduces computational
complexity from O(n²) to O(n) while maintaining 97% of standard..."

[3] Source: blog.research.ai/attention (January 8, 2026)
"Recent benchmarks show that modern attention mechanisms achieve..."

User: What are the latest advances in transformer architecture?</code></pre>

<div class="md">
The LLM then generates an answer **grounded in these sources**, citing them inline, exactly like what you're reading right now.

## The Full Architecture Diagram
</div>

<pre class="wslab-code-block"><code>┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                           │
│  "What are the latest advances in transformers?"            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  ORCHESTRATOR / AGENT                        │
│  • Receives user query                                      │
│  • Asks LLM: "Should I search?"                             │
│  • LLM says: "Yes, search for: transformer architecture     │
│    advances 2026"                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   SEARCH API                                 │
│  • Bing / Google / Brave / SearXNG                          │
│  • Returns: titles, snippets, URLs (JSON)                   │
│  • Typically top 5-10 results                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 CONTENT FETCHER                              │
│  • HTTP GET to top 3-5 URLs                                 │
│  • Headless browser if needed (JS-rendered sites)           │
│  • Timeout: 5-10 seconds per page                           │
│  • Parallel fetching for speed                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               CONTENT EXTRACTOR                              │
│  • Readability.js / Trafilatura / custom parser             │
│  • Strips: nav, ads, scripts, styles, headers, footers     │
│  • Output: clean markdown or plain text                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              CHUNKER &amp; RE-RANKER                            │
│  • Split text into 200-500 token chunks                     │
│  • Score each chunk against original query                  │
│  • Select top-K chunks (usually 3-8)                        │
│  • Total token budget: ~3000-6000 tokens                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              PROMPT ASSEMBLER                                │
│  • System prompt + search results + user query              │
│  • Adds source metadata (URL, date) for citations           │
│  • Manages token budget                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    LLM                                       │
│  • Reads augmented prompt                                   │
│  • Generates grounded answer with citations                 │
│  • May request additional searches (multi-turn)             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  USER SEES ANSWER                            │
│  "Recent advances include linear attention [1], sparse      │
│   mixture-of-experts [2] and..." with clickable sources     │
└─────────────────────────────────────────────────────────────┘</code></pre>

<div class="md">
## Open-Source Web Search: SearXNG

For privacy-conscious or self-hosted setups, **SearXNG** is the most popular choice. It's a meta-search engine that aggregates results from multiple search providers without sending user data to any of them.

SearXNG queries Google, Bing, DuckDuckGo, Brave, and dozens of other engines simultaneously, then deduplicates and merges the results. The LLM system talks to SearXNG via a local API endpoint.

$$
\text{LLM} \;\xrightarrow{\text{query}}\; \text{SearXNG} \;\xrightarrow{\text{fan-out}}\; \begin{cases} \text{Google} \\ \text{Bing} \\ \text{DuckDuckGo} \\ \text{Brave} \\ \vdots \end{cases} \;\xrightarrow{\text{merge}}\; \text{Unified results}
$$

## Tool Use / Function Calling: The Mechanism

The LLM doesn't have "built-in" web access. Instead, it uses a protocol called **function calling** (or **tool use**):

**1.** The system prompt defines available tools:
</div>

<pre class="wslab-code-block"><code>{
  "tools": [
    {
      "name": "web_search",
      "description": "Search the web for current information",
      "parameters": {
        "query": { "type": "string", "description": "Search query" }
      }
    },
    {
      "name": "fetch_page",
      "description": "Fetch and extract content from a URL",
      "parameters": {
        "url": { "type": "string", "description": "URL to fetch" }
      }
    }
  ]
}</code></pre>

<div class="md">
**2.** The LLM generates a **structured tool call** instead of a text response:
</div>

<pre class="wslab-code-block"><code>// LLM output (not shown to user):
{
  "tool_call": "web_search",
  "arguments": { "query": "transformer architecture advances 2026" }
}</code></pre>

<div class="md">
**3.** The orchestrator **executes** the tool call and returns results to the LLM.

**4.** The LLM reads the results and either:
   - Generates a final answer, or
   - Makes another tool call (e.g., `fetch_page` for more detail)

This loop can repeat multiple times, the LLM might search, read a page, search again with refined terms, then finally answer.

## Custom Sites vs. Open Web Browsing

There's an important distinction between how LLMs handle **specified URLs** versus **open web search**:
</div>

<div id="wslab-compare-grid">
    <div class="wslab-compare-card wslab-card-orange">
        <span class="wslab-tag wslab-tag-orange">Direct URL Access</span>
        <ul>
            <li>User provides the URL explicitly</li>
            <li>System fetches → extracts → presents to LLM</li>
            <li>No search engine involved</li>
            <li>Fast and deterministic</li>
            <li>Limited to what user already knows exists</li>
        </ul>
    </div>
    <div class="wslab-compare-card wslab-card-purple">
        <span class="wslab-tag wslab-tag-purple">Open Web Search</span>
        <ul>
            <li>LLM formulates a search query</li>
            <li>Search API discovers relevant URLs</li>
            <li>System fetches top results → extracts → ranks → presents</li>
            <li>Can discover information user didn't know about</li>
            <li>More latency, potential for irrelevant results</li>
        </ul>
    </div>
</div>

<div class="md">
## Latency Breakdown: Where Does the Time Go?

| Step | Typical Latency | Notes |
|------|----------------|-------|
| Intent detection | ~200ms | LLM decides whether to search |
| Query formulation | ~300ms | LLM rewrites query |
| Search API call | ~200-500ms | Network round-trip to Bing/Google |
| Content fetching | ~1-3s | Parallel HTTP requests to top URLs |
| JS rendering (if needed) | ~2-5s | Headless browser startup + render |
| Content extraction | ~50ms | HTML parsing is fast |
| Chunking &amp; re-ranking | ~100-300ms | Depends on re-ranker model |
| LLM generation | ~1-5s | Token-by-token streaming |
| **Total** | **~3-10s** | This is why search answers take longer |

## Limitations &amp; Challenges

- **Paywalls &amp; login walls:** The fetcher can't access content behind authentication
- **Rate limiting:** Websites may block rapid automated requests
- **robots.txt:** Ethical systems respect crawling restrictions
- **Stale search indices:** Search engines may not have indexed very recent pages
- **JavaScript-heavy sites:** Require expensive headless browser rendering
- **Multimedia content:** Images, videos, and interactive content can't be "read"
- **Hallucinated citations:** The LLM might misattribute information to the wrong source

## Summary

| Question | Answer |
|----------|--------|
| What search engine do LLMs use? | Commercial APIs: Bing (ChatGPT), Google (Gemini), Brave. Self-hosted: SearXNG |
| How do they load web pages? | HTTP GET + content extraction (Readability.js, Trafilatura) or headless browser |
| Does the LLM itself browse? | **No.** External tools fetch data; the LLM only sees extracted text in its prompt |
| How do they decide to search? | Intent detection via system prompt rules or fine-tuned classifiers |
| How is relevance determined? | Search API ranking + re-ranking of extracted chunks via embeddings or cross-encoders |
| Why does it take longer? | Multiple network round-trips: search API + page fetches + LLM generation |
| How is this different from RAG? | RAG searches a **private** vector DB. Web search queries the **public** internet via APIs. Same principle, different data source |
</div>

<div class="md">
## 🔍 Interactive: Web Search Simulation
</div>

<div id="wslab-demo-container">
    <p class="wslab-demo-subtitle">Simulate how an LLM processes a web search query. Type a question and see the pipeline in action, from intent detection through search results to final answer assembly.</p>
    <input type="text" id="wslab-query-input" placeholder="Try: &quot;What is the latest version of Python?&quot;" value="What is the latest version of Python?" />
    <button id="wslab-search-btn">🌐 Simulate Search</button>
    <div id="wslab-results"></div>
    <details class="wslab-details">
        <summary>How does this simulation work?</summary>
        <p>This is a client-side simulation using pre-defined mock search results. In a real system, the search query would hit a live API (Bing, Google, SearXNG), fetch actual web pages, extract their content, chunk and re-rank it, then feed it to the LLM. The pipeline steps shown here mirror what actually happens behind the scenes.</p>
    </details>
</div>

<div class="md">
## Connecting It All: Web Search is RAG Over the Internet

If you understood the RAG chapter, web search is conceptually simple:

$$
\underbrace{\text{Web Search}}_{\text{RAG where the "database" is the entire internet}}
$$

The only differences are:
1. **Discovery:** RAG has a pre-built index. Web search must *find* relevant pages first.
2. **Freshness:** RAG indexes are updated periodically. Web search gets live results.
3. **Scale:** RAG searches thousands–millions of your documents. Web search covers billions of pages.
4. **Trust:** RAG sources are curated. Web sources may be unreliable.

The core pattern is identical: **retrieve relevant text → inject into prompt → generate grounded answer.**
</div>
