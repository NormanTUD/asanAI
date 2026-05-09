<?php include_once("functions.php"); ?>

<div class="md">
Every time you send a message to an LLM, the model doesn't "remember" your previous conversations from some internal database. It doesn't have a persistent memory like a human brain. Instead, it reads **everything** — the system prompt, the conversation history, any retrieved documents — as a single, flat sequence of tokens. This sequence is the **context window**, and it is the LLM's entire universe of awareness for that single inference.

$$
\text{Context Window} = [\underbrace{\text{System Prompt}}_{\sim 500 \text{ tokens}} \;|\; \underbrace{\text{Conversation History}}_{\text{variable}} \;|\; \underbrace{\text{Retrieved Docs (RAG)}}_{\text{variable}} \;|\; \underbrace{\text{Current Query}}_{\text{variable}}]
$$

**Key insight:** The context window is not "memory" in the human sense. It is a **fixed-size input buffer**. Once it's full, something must be dropped. Once the conversation ends, everything is gone unless explicitly saved externally.
</div>

<div id="cwlab-window-diagram"></div>

<div class="md">
## What Is a Context Window?

A context window (also called "context length") is the **maximum number of tokens** the model can process in a single forward pass. It includes *everything*: the system prompt, all previous messages in the conversation, any injected documents, and the new query.

### Context Window Sizes (2025-2026)

| Model | Context Window | Approximate Equivalent |
|-------|---------------|----------------------|
| GPT-2 (2019) | 1,024 tokens | ~750 words / 1.5 pages |
| GPT-3 (2020) | 2,048 tokens | ~1,500 words / 3 pages |
| GPT-3.5 (2022) | 4,096 tokens | ~3,000 words / 6 pages |
| GPT-4 (2023) | 8,192 / 32K / 128K | ~6K–96K words |
| Claude 3 (2024) | 200,000 tokens | ~150K words / 1 novel |
| Gemini 1.5 Pro (2024) | 1,000,000 tokens | ~750K words / 5 novels |
| Gemini 2.5 (2025) | 1,000,000+ tokens | ~750K+ words |
| Claude Opus 4 (2025) | 200,000 tokens | ~150K words |
| GPT-4.1 (2025) | 1,000,000 tokens | ~750K words |

The growth has been exponential: from 1K tokens in 2019 to 1M+ tokens in 2025 — a **1000x increase** in just 6 years.

### Tokens ≠ Words

A rough conversion:
- **English:** 1 token ≈ 0.75 words (or ~4 characters)
- **Code:** 1 token ≈ 0.4 words (more tokens per "word" due to syntax)
- **Non-Latin scripts:** Often more tokens per word

$$
\text{128K tokens} \approx 96{,}000 \text{ words} \approx 300 \text{ pages} \approx 1 \text{ novel}
$$

## Why Does the Context Window Exist?

The context window isn't an arbitrary limitation — it emerges from the **architecture** of the Transformer itself.

### The Self-Attention Bottleneck

In standard self-attention, every token attends to every other token. For a sequence of length $n$:

$$
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right) V
$$

The $QK^T$ matrix has dimensions $n \times n$. This means:

- **Compute:** $O(n^2 \cdot d)$ — quadratic in sequence length
- **Memory:** $O(n^2)$ — the attention matrix must be stored for backpropagation

| Context Length | Attention Matrix Size | Memory (float16) |
|---------------|----------------------|------------------|
| 1,024 | 1M entries | ~2 MB |
| 8,192 | 67M entries | ~134 MB |
| 32,768 | 1B entries | ~2 GB |
| 128,000 | 16B entries | ~32 GB |
| 1,000,000 | 1T entries | ~2 TB |

At 1 million tokens, the naive attention matrix would require **2 terabytes** of memory — clearly impossible. So how do modern models handle it?

## How Models Achieve Long Context

### 1. KV Cache: Remembering Without Recomputing

During autoregressive generation (producing one token at a time), the model doesn't recompute attention over the entire sequence from scratch for each new token. Instead, it maintains a **Key-Value (KV) Cache**:

$$
\text{For token } t: \quad K_t = [K_1, K_2, \ldots, K_{t-1}, K_t], \quad V_t = [V_1, V_2, \ldots, V_{t-1}, V_t]
$$

Each new token only computes its own $Q_t$ and attends to the cached $K$ and $V$ from all previous tokens. This reduces generation from $O(n^2)$ to $O(n)$ per token — but the cache itself grows linearly with sequence length.

**KV Cache Memory:**

$$
\text{KV Cache Size} = 2 \times n_{\text{layers}} \times n_{\text{heads}} \times d_{\text{head}} \times n_{\text{tokens}} \times \text{bytes per element}
$$

For a 70B parameter model with 128K context:
$$
2 \times 80 \times 64 \times 128 \times 128{,}000 \times 2 \text{ bytes} \approx 167 \text{ GB}
$$

This is why long-context inference requires enormous GPU memory — the KV cache alone can exceed the model weights.

### 2. Flash Attention: Taming the Quadratic Beast

**Flash Attention** (Tri Dao, 2022) doesn't change the *math* of attention — it changes the *memory access pattern*. Instead of materializing the full $n \times n$ attention matrix in GPU high-bandwidth memory (HBM), it:

1. Splits $Q$, $K$, $V$ into small blocks that fit in fast SRAM
2. Computes attention block-by-block
3. Never stores the full attention matrix

Result: **exact** attention with $O(n)$ memory instead of $O(n^2)$, and 2-4x faster due to reduced memory bandwidth usage.

$$
\text{Standard Attention: } O(n^2) \text{ memory} \quad \xrightarrow{\text{Flash Attention}} \quad O(n) \text{ memory, same result}
$$

### 3. Sliding Window Attention

Instead of attending to *all* previous tokens, each token only attends to the most recent $w$ tokens (the "window"):

$$
\text{Attention}_i = \text{softmax}\left(\frac{Q_i \cdot K_{[i-w:i]}^T}{\sqrt{d_k}}\right) V_{[i-w:i]}
$$

With a window of $w = 4096$, a 128K-token sequence uses $O(n \cdot w)$ instead of $O(n^2)$ — a massive reduction.

**But doesn't this lose long-range information?** In deep networks, information propagates across layers. If layer 1 sees tokens $[0, 4096]$ and layer 2 sees the *output* of layer 1 (which already encodes information from $[0, 4096]$), then layer 2 effectively has indirect access to a much wider range. After $L$ layers with window $w$, the effective receptive field is $L \times w$.

### 4. Grouped-Query Attention (GQA)

Standard multi-head attention uses separate $K$ and $V$ projections for each head. GQA shares $K$ and $V$ across groups of heads:

| Variant | K/V heads | Q heads | KV Cache Size |
|---------|-----------|---------|---------------|
| Multi-Head (MHA) | 64 | 64 | 100% |
| Grouped-Query (GQA) | 8 | 64 | 12.5% |
| Multi-Query (MQA) | 1 | 64 | 1.6% |

GQA reduces KV cache memory by 8x with minimal quality loss — essential for serving long-context models.

### 5. Ring Attention / Sequence Parallelism

For extremely long sequences (1M+ tokens), the KV cache doesn't fit on a single GPU. **Ring Attention** distributes the sequence across multiple GPUs in a ring topology:

- Each GPU holds a chunk of the sequence
- KV blocks are passed around the ring
- Each GPU computes its local attention against the circulating KV blocks

This allows context windows to scale with the number of GPUs, limited only by hardware budget.

## The "Lost in the Middle" Problem

Even if a model *can* process 200K tokens, does it actually *use* all of them equally?

Research consistently shows that LLMs exhibit a **U-shaped attention pattern**: they attend most strongly to the **beginning** and **end** of the context, while information in the middle receives less attention.
</div>

<div id="cwlab-lost-middle-diagram"></div>

<div class="md">
### Why does this happen?

1. **Positional encoding bias:** Early tokens have well-learned positional embeddings; middle tokens are in a "flat" region
2. **Recency bias:** The most recent tokens are closest in the KV cache and receive stronger attention
3. **Training distribution:** During pre-training, the most important information (instructions, key facts) tends to appear at the beginning or end of documents

### Practical implications:

| Scenario | Effect |
|----------|--------|
| Important fact at position 1,000 of 100,000 | ✅ Likely found (near beginning) |
| Important fact at position 50,000 of 100,000 | ⚠️ May be missed (middle) |
| Important fact at position 99,000 of 100,000 | ✅ Likely found (near end) |

This is one reason **RAG remains valuable** even with million-token context windows: RAG places the most relevant information at the *top* of the context, where attention is strongest.

## Context Window vs. RAG: When to Use Which?

This is one of the most important practical decisions in building LLM applications:
</div>

<div id="cwlab-compare-grid">
    <div class="cwlab-compare-card cwlab-card-blue">
        <span class="cwlab-tag cwlab-tag-blue">Long Context ("Stuff it all in")</span>
        <ul>
            <li>Put all documents directly into the prompt</li>
            <li>Simple — no retrieval infrastructure needed</li>
            <li>Model sees everything, can find unexpected connections</li>
            <li><strong>Cost:</strong> Pay for all tokens, even irrelevant ones</li>
            <li><strong>Limit:</strong> Still bounded by max context length</li>
            <li><strong>Risk:</strong> "Lost in the middle" — may miss buried facts</li>
        </ul>
    </div>
    <div class="cwlab-compare-card cwlab-card-green">
        <span class="cwlab-tag cwlab-tag-green">RAG ("Retrieve only what's relevant")</span>
        <ul>
            <li>Search millions of documents, inject only top-K chunks</li>
            <li>Scales to unlimited corpus size</li>
            <li>Relevant info placed at top of context (high attention)</li>
            <li><strong>Cost:</strong> Pay only for retrieved chunks</li>
            <li><strong>Limit:</strong> Retrieval quality depends on embedding model</li>
            <li><strong>Risk:</strong> May miss relevant docs if retrieval fails</li>
        </ul>
    </div>
</div>

<div class="md">
### The Decision Framework

| Situation | Best Approach |
|-----------|--------------|
| Small document set (< 50 pages) | Long context — just put it all in |
| Large corpus (1000+ documents) | RAG — can't fit everything |
| Need to find unexpected connections | Long context — model sees everything |
| Need precise, targeted answers | RAG — retrieves exactly what's relevant |
| Cost-sensitive application | RAG — uses fewer tokens per query |
| Simple Q&A over a single PDF | Long context — no infrastructure needed |
| Production system with many users | RAG — amortized indexing cost |

### The Best of Both Worlds

In practice, the most effective systems combine both:

$$
\underbrace{\text{RAG retrieves top-20 chunks}}_{\text{from millions of documents}} \;\xrightarrow{\text{inject}}\; \underbrace{\text{Long context processes all 20}}_{\text{model reasons over retrieved set}}
$$

RAG handles the *discovery* problem (finding needles in haystacks), while long context handles the *reasoning* problem (synthesizing information across multiple retrieved passages).

## How LLMs "Remember" Across Conversations

LLMs have **no built-in persistent memory**. Each API call is stateless — the model has no idea what you asked it yesterday. So how do systems like ChatGPT seem to "remember" you?

### Strategy 1: Conversation History in Context

The simplest approach: prepend the entire conversation history to each new message.
</div>

<pre class="cwlab-code-block"><code># What the API actually receives on message #5:

System: You are a helpful assistant.

User: What is the capital of France?
Assistant: The capital of France is Paris.

User: What about Germany?
Assistant: The capital of Germany is Berlin.

User: And Italy?
Assistant: The capital of Italy is Rome.

User: Which of those three is the largest by population?
# ← The model needs all previous context to answer this</code></pre>

<div class="md">
**Problem:** As conversations grow, they eventually exceed the context window. Solutions:

| Strategy | How it works | Tradeoff |
|----------|-------------|----------|
| **Truncation** | Drop oldest messages | Loses early context |
| **Summarization** | LLM summarizes old messages into a compact paragraph | Lossy compression |
| **Sliding window** | Keep last N messages + system prompt | Simple but forgetful |
| **Hierarchical** | Summarize old → keep recent in full | Best quality, more complex |

### Strategy 2: External Memory Systems

For persistent memory across sessions, systems store information externally:

| System | How it works |
|--------|-------------|
| **ChatGPT Memory** | Extracts key facts ("User prefers Python") → stores in a database → injects into system prompt |
| **Vector memory** | Embeds past conversations → stores in vector DB → retrieves relevant memories when similar topics arise |
| **File-based memory** | Writes structured notes to files (CLAUDE.md, memory.json) → reads them at session start |
| **Graph memory** | Stores entities and relationships in a knowledge graph → queries for relevant connections |
</div>

<pre class="cwlab-code-block"><code># How ChatGPT's memory works (simplified):

# 1. After each conversation, a small model extracts key facts:
extracted = extract_facts(conversation)
# → ["User is a Python developer", "User prefers concise answers"]

# 2. Facts are stored in a database linked to the user:
memory_db.store(user_id, extracted)

# 3. At the start of each new conversation, memories are injected:
system_prompt = f"""You are a helpful assistant.

User memories:
- User is a Python developer
- User prefers concise answers
- User is working on a RAG system for legal documents
"""

# The LLM sees these memories as part of its context — it has no
# "internal" awareness that these are from previous sessions.</code></pre>

<div class="md">
The key insight: **memory is always external**. The LLM itself is stateless — it's the surrounding system that creates the illusion of continuity by carefully managing what goes into the context window at the start of each interaction. ChatGPT's memory works through a combination of detection of memory-worthy information, storing of such information, and retrieval-augmented generation [[1]](https://medium.com/@jay-chung/how-does-chatgpts-memory-feature-work-57ae9733a3f0). In addition to saved memories, it now references all past conversations to deliver responses that feel more relevant and tailored [[2]](https://openai.com/index/memory-and-new-controls-for-chatgpt/). Four layers working together create the illusion that ChatGPT knows you personally [[3]](https://llmrefs.com/blog/reverse-engineering-chatgpt-memory).

### Strategy 3: Compaction (Summarize and Continue)

For very long-running sessions (like coding agents that run for hours), the context window eventually fills up. **Compaction** summarizes the conversation so far and replaces the full history with a compressed version:

$$
\underbrace{[S, M_1, M_2, \ldots, M_{100}]}_{\text{Full history (approaching limit)}} \;\xrightarrow{\text{compaction}}\; \underbrace{[S, \text{Summary}, M_{99}, M_{100}]}_{\text{Compressed (fits again)}}
$$

This is lossy — details are inevitably lost in summarization. But combined with external memory files, critical information can persist across compaction boundaries.

### The Memory Hierarchy

The most robust systems combine multiple approaches into a layered architecture:

| Layer | Mechanism | Persistence | Capacity |
|-------|-----------|-------------|----------|
| **Working memory** | Current context window | This session only | 128K–1M tokens |
| **Short-term memory** | Conversation buffer + summarization | This session | Unlimited (via compaction) |
| **Long-term memory** | Vector DB + structured files | Across sessions | Unlimited |
| **Episodic memory** | Timestamped interaction logs | Permanent | Unlimited |

$$
\text{New session} \;\leftarrow\; \underbrace{\text{System prompt}}_{\text{identity}} + \underbrace{\text{Long-term memories}}_{\text{retrieved from DB}} + \underbrace{\text{User's new message}}_{\text{current turn}}
$$

## The KV Cache: The Hidden Memory Tax

Every token the model has ever seen in the current session lives in the **KV cache** — and this cache consumes GPU memory that grows linearly with context length.

### Why this matters for users:

| Context used | KV Cache (70B model) | Effect |
|-------------|---------------------|--------|
| 4K tokens | ~5 GB | Fast, cheap |
| 32K tokens | ~42 GB | Moderate cost |
| 128K tokens | ~167 GB | Expensive, slower |
| 1M tokens | ~1.3 TB | Requires multi-GPU, very expensive |

This is why **longer conversations cost more** — both in money (API pricing is per-token) and in latency (more KV cache = slower generation). It's also why providers set context limits: the memory cost is real and physical.

### KV Cache Optimization Techniques

| Technique | How it works | Savings |
|-----------|-------------|---------|
| **GQA** (Grouped-Query Attention) | Share K/V across head groups | 4-8x smaller cache |
| **KV Cache Quantization** | Store K/V in int8 instead of float16 | 2x smaller |
| **Sliding Window** | Only cache last $w$ tokens per layer | Bounded cache size |
| **PagedAttention** (vLLM) | Manage cache like virtual memory pages | Better GPU utilization |
| **Token eviction** | Drop least-attended tokens from cache | Bounded, but lossy |

## Practical Implications: What This Means for You

### 1. Why conversations "forget" things

If you've had a long conversation and the model seems to forget something you said earlier, it's likely because:
- The conversation exceeded the context window and old messages were truncated
- The information is in the "middle" of a long context (lost-in-the-middle effect)
- The system used compaction and the detail was lost in summarization

### 2. Why "starting a new chat" sometimes helps

A fresh conversation has an empty context window. The model's full attention capacity is available for your new question, with no interference from irrelevant prior messages.

### 3. Why RAG beats "just paste everything"

For a 10,000-page knowledge base:
- **Paste everything:** Impossible (exceeds any context window)
- **Long context (1M tokens):** Could fit ~750K words, but costs $$$, is slow, and suffers from lost-in-the-middle
- **RAG:** Retrieves only the 5 most relevant passages, places them at the top of context where attention is strongest, costs pennies

### 4. Why API pricing is per-token

Every token in your prompt consumes:
- Compute (attention is $O(n^2)$ or $O(n \cdot w)$)
- Memory (KV cache grows linearly)
- Bandwidth (data must flow through the GPU)

Longer prompts = more of all three = higher cost.

## The Future: Towards Infinite Context

Research is pushing toward effectively unlimited context through several approaches:

| Approach | Status (2026) | How it works |
|----------|--------------|--------------|
| **Ring Attention** | Production (Gemini) | Distribute sequence across GPU ring |
| **Infini-Attention** | Research | Compressive memory + local attention |
| **Landmark Attention** | Research | Mark important tokens, attend to landmarks |
| **Retrieval-augmented generation** | Production | External memory via vector search |
| **Memory-augmented Transformers** | Research | Learnable external memory banks |
| **State-space hybrids** | Production (Jamba, etc.) | SSM layers for long-range + attention for precision |

## Summary

| Question | Answer |
|----------|--------|
| What is a context window? | The maximum tokens an LLM can process in one forward pass — its entire "awareness" |
| Why does it exist? | Self-attention is $O(n^2)$; memory and compute grow with sequence length |
| What is the KV cache? | Stored Key/Value vectors from all previous tokens, enabling efficient generation |
| What is Flash Attention? | An algorithm that computes exact attention with $O(n)$ memory instead of $O(n^2)$ |
| What is "lost in the middle"? | LLMs attend more to the beginning and end of context, missing information in the middle |
| How do LLMs "remember" across chats? | They don't — external systems inject stored memories into the context window |
| Context window vs. RAG? | Context window holds everything at once (expensive). RAG retrieves only what's relevant (cheap, scalable) |
| Why do longer conversations cost more? | More tokens = more KV cache memory = more compute = higher API cost |
</div>

<div class="md">
## 🔍 Interactive: Context Window Visualizer
</div>

<div id="cwlab-demo-container">
    <p class="cwlab-demo-subtitle">Explore how a context window fills up during a conversation. Adjust the model's context size and see how different strategies handle overflow.</p>
    <div id="cwlab-controls">
        <label for="cwlab-model-select"><strong>Model:</strong></label>
        <select id="cwlab-model-select">
            <option value="4096">GPT-3.5 (4K)</option>
            <option value="8192">GPT-4 (8K)</option>
            <option value="32768">GPT-4-32K</option>
            <option value="128000" selected>GPT-4 Turbo (128K)</option>
            <option value="200000">Claude 3 (200K)</option>
            <option value="1000000">Gemini 1.5 Pro (1M)</option>
        </select>
        <button id="cwlab-add-msg-btn">➕ Add Message (~500 tokens)</button>
        <button id="cwlab-add-rag-btn">📄 Add RAG Chunks (~2000 tokens)</button>
        <button id="cwlab-reset-btn">🔄 Reset</button>
    </div>
    <div id="cwlab-visualization"></div>
    <div id="cwlab-stats"></div>
    <details class="cwlab-details">
        <summary>What does this show?</summary>
        <p>The bar represents the model's context window. The system prompt (always present) is shown in blue. Each message you add consumes space. When the window fills up, the system must either truncate old messages (red) or summarize them (yellow). RAG chunks are shown in green — notice how they consume context budget but provide targeted information. In production, the system carefully manages this budget to maximize useful information while staying within limits.</p>
    </details>
</div>
