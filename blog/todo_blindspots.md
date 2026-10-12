# todo_blindspots.md — the technical blind spots the textbook is still missing

Companion to **`history_todo.md`** (which tracks the historical / pre-history gaps).
This file tracks the eight **technical / practical** gaps. The execution protocol
(research → never invent a source → house style → image credit → validators →
status) is the same as in `history_todo.md` §Protocol — read that once.

Statuses: `[ ]` pending · `[~]` in progress · `[x]` done (validators green) · `[-]` descoped.

## Placement map (append at the end of each part — never renumber)

| # | Area | Home today | Decision | Slug / placement |
|---|------|-----------|----------|------------------|
| 1 | Training dynamics (a *lab*) | `loss_landscape`, `optimizerlab`, `hyperparameters` (mention-only scaling laws) | **New lab** | `trainingdynamics.php` + `.js`, Part 2, order 13 |
| 2 | Mixture of Experts | a one-box mention in `transformer.php` | **New lesson** | `mixture_of_experts.php`, Part 4, order 18 |
| 3 | KV-cache / inference ≠ training | scattered in `attentionlab`, `inference_optimization`, `production_serving` | **New lesson** | `inference_vs_training.php`, Part 5, order 19 |
| 4 | Tokenizer pathologies | `tokenizerlab` + the Strawberry demo | **New lesson** | `tokenizer_pathologies.php`, Part 4, order 19 |
| 5 | Evaluation as a discipline | `evaluation.php` (benchmarks; "build your own eval" in 6 lines) | **New lesson** | `building_evals.php`, Part 5, order 20 |
| 6 | The economic layer | absent | **New lesson** | `ai_economics.php`, Part 5, order 21 |
| 7 | Retrieval depth (beyond "RAG works") | `rag.php`, `vectorsearch.php` | **Merged into `rag.php`** | § "Retrieval, in Depth" in `rag.php` (Part 5, order 3) |
| 8 | Model → System | `agents.php`, `production_serving.php` | **Merged into `production_serving.php`** | § "From Model to Product" in `production_serving.php` (Part 5, order 14) |

These close the gap between Part 4 (architecture) and Part 5 (making AI useful) and
give the "engineering craft" half of the course a through-line it currently lacks.

---

## The eight items

### T1 — The training run as a phenomenon (NEW LAB `trainingdynamics.php` + `trainingdynamics.js`)
`[x]`
- **Gap.** Scaling laws are only *mentioned* (`training_data`, `math_iii`); there is no
  chapter that says *"here is the power-law curve, here is why, here is how you go
  compute-optimal."* Missing as *lived practice*: warmup, LR schedules (cosine, WSD),
  batch-size scaling, gradient accumulation, **why a training run diverges** (loss
  spikes, instability at scale), and μP.
- **Cover to add**
  - **Scaling laws** — Kaplan et al. 2020 ($L \propto N^{-\alpha_N} + D^{-\alpha_D}$,
    power laws in model size $N$ and data $D$); then **Chinchilla** (Hoffmann et al.
    2022): for a fixed compute budget, the *optimal* point is $N \approx D$ (train to
    ~20 tokens/param), which is how the field went from over-trained small models to
    under-trained big ones. Derive the shape, not just state it.
  - **Warmup & LR schedules** — why the first steps use a rising LR (Adam's moment
    estimates are bad when fresh); cosine decay; and **WSD** (warmup–stable–decay,
    "unrolling the WSD schedule") as the modern re-usable recipe that decouples
    "how stable is it" from "how long do I train."
  - **Batch-size scaling & the linear rule** — doubling the batch lets you double the
    LR (the Goyal et al. 2017 linear scaling rule) and changes the noise/signal trade;
    **gradient accumulation** as the way to get large effective batches on limited
    memory (this is the "lived practice" piece).
  - **Divergence, loss spikes, stability** — what a loss spike looks like, the
    "edge of stability" (a high LR that *oscillates but still descends*), gradient
    clipping, and the instability that appears at scale.
  - **μP (Maximal Update Parametrization)** — the parametrization that makes the
    *optimal hyperparameters transfer* across model widths, so you can tune on a small
    net and scale up. (Yang et al. 2022.)
- **Home.** New **lab** `trainingdynamics.php` + `.js` — the interactive centre should
  let the reader pick $N$, $D$, batch, LR schedule, and *watch* the loss curve move
  along the power law, go compute-optimal, spike, and recover (a training-curve
  simulator with the scaling-law overlay). Part 2, order 13.
- **Sources to verify.** `kaplan2020scaling` (exists); `brown2020gpt3` (exists);
  **Chinchilla / Hoffmann et al. 2022** (arXiv 2204.02312 — check for an existing key,
  else add); Goyal et al. 2017 "Accurate, Large-Batch Training" (arXiv 1706.02677);
  the WSD schedule paper; **μP** (Yang et al. 2022, arXiv 2203.03466).
- **Interactive (required).** the training-run simulator described above; theme-reactive
  Plotly; lazy-init.

### T2 — Mixture of Experts (NEW LESSON `mixture_of_experts.php`)
`[x]`
- **Gap.** MoE is one optional box in `transformer.php`, but the frontier in 2026 is
  largely MoE (DeepSeek-V3, Mixtral, Qwen, and very likely GPT-4). A whole
  architecture block is being given a single paragraph.
- **Cover to add**
  - **The idea** — replace the one dense MLP per layer with $E$ experts and a **router**
    (gating) that sends each token to the top-$k$ experts; only the selected experts
    compute, so *capacity* grows while *compute per token* stays roughly fixed.
  - **Routing** — the top-$k$ gate (softmax → top-k → renormalize); the DeepSeek
    **No-Routing / sigmoid** variant; routing as a learned sparse switch.
  - **Load balancing** — the aux loss that stops one expert being chosen for everything
    (Switch Transformer, Fedus et al. 2022); why without it the experts collapse.
  - **Shared experts** — the trick (DeepSeek-V3) of a set of *always-on* experts in
    addition to the *routed* ones: the shared experts carry the common knowledge, the
    routed experts carry the specialist knowledge.
  - **Expert parallelism** — how you shard experts across devices (EP) and the
    all-to-all communication that makes MoE expensive to *serve* even if cheap to
    train.
  - **Why it matters for the economics** — a MoE model has more total params but fewer
    *active* params per token, which is exactly the knob the [economics](ai_economics)
    and [inference](inference_vs_training) chapters turn.
- **Home.** New lesson `mixture_of_experts.php`, Part 4 (architecture), order 18 —
  right after [alternative architectures](alternative_architectures).
- **Sources to verify.** `shazeer2017moe` (exists); `fedus2022switch` (exists); the
  Mixtral / DeepSeek-V3 / Qwen technical reports (check for existing keys; add with
  verified URLs if absent).
- **Images.** a router→top-k experts diagram (draw it; no license needed).

### T3 — The KV-cache: why inference is a different animal than training (NEW LESSON `inference_vs_training.php`)
`[x]`
- **Gap.** The KV-cache is mentioned in `attentionlab`, `inference_optimization` and
  `production_serving`, but the *concept* — that inference and training are different
  forms of computation, that **prefill** and **decode** are different regimes
  (compute-bound vs **memory-bound**), and that this determines the whole serving
  economy — is scattered and never unified.
- **Cover to add**
  - **Training = parallel over a batch; inference = sequential over a stream.** Training
    sees the whole sequence at once (dense matrix multiplies, compute-bound). Decode
    produces one token at a time and must re-read every past token's K,V.
  - **The KV-cache** — store each past token's Key and Value so the next token's
    attention doesn't recompute them; the cache grows linearly with sequence length.
  - **Prefill vs decode** — prefill (processing the prompt) is **compute-bound**;
    decode (one token per step) is **memory-bandwidth-bound** (you move the KV-cache
    and weights to read a single token). ARMs/this is *the* split that shapes serving.
  - **Why it determines the economics** — decode cost is dominated by *reading the
    KV-cache*, which is why long contexts get expensive, why **quantization**,
    **PagedAttention** (vLLM) and **continuous batching** exist, and why "how many
    tokens/second" and "how many concurrent users" are different questions.
  - Land on the [Inference optimization](inference_optimization) and [Production
    serving](production_serving) chapters, which already cover the *optimizations*;
    this chapter gives them the *reason*.
- **Home.** New lesson `inference_vs_training.php`, Part 5, order 19.
- **Sources to verify.** the KV-cache / PagedAttention (vLLM, Kwon et al. 2023,
  arXiv 2309.06180 — check for existing key); FlashAttention (Dao et al., 2022/2023);
  the prefill/decode distinction (a stable survey or the vLLM paper is fine).
- **Interactive (strong candidate).** a plot of *tokens/second* vs *sequence length*
  for prefill (flat-ish) vs decode (falling), and a running KV-cache size bar — make the
  two regimes visible.

### T4 — Tokenizer pathologies as a system (NEW LESSON `tokenizer_pathologies.php`)
`[x]`
- **Gap.** `tokenizerlab` + the Strawberry demo show *how* BPE works, but not the
  *pathologies*: why multilinguality suffers, why the same information costs more in
  some scripts, byte-level vs BPE vs unigram, and the frontier move to
  **tokenizer-free** architectures.
- **Cover to add**
  - **Why multilinguality hurts** — a tokenizer trained mostly on English has many
    English subwords and few others; a non-Latin script (Thai, Devanagari, Cyrillic)
    often needs **3–5× more tokens per word** because its characters/words aren't in
    the high-frequency subword set. Show the per-language token-per-word count.
  - **Tokenizer bias as a cost question** — the same sentence costs more *inference
    tokens* in Hindi than in English, so it costs **× more API money** (billed per
    token) and has a shorter effective context window. "Language is priced by the
    tokenizer."
  - **Byte-level vs BPE vs unigram** — byte-level BPE (GPT-2: never an "unknown
    token," every byte is representable) vs sentencepiece *unigram* (language-model
    trained) vs classical BPE; what each optimizes and the trade-offs (vocab size,
    rare tokens, the "strawberry needs 3 tokens" phenomenon).
  - **Tokenizer-free frontiers** — the trend to remove the discrete-token bottleneck:
    **byte-level** models that predict raw bytes, and **byte-latent / continuous**
    representations (e.g. BLT-style byte-latent transformers, "MegaByte"-class
    approaches). This is a live 2025–26 thread — **verify each named model has a stable
    2xx source before citing it; if you cannot verify a source, describe it in prose
    without a hard `\cite` rather than invent a reference.**
- **Home.** New lesson `tokenizer_pathologies.php`, Part 4, order 19 — the dark side of
  [Tokenization](tokenizerlab).
- **Sources to verify.** the sentencepiece / unigram (Kudo 2018, arXiv 1808.06226);
  BPE (Sennrich 2015, arXiv 1508.07909, `sennrich2016subword` exists); the multilingual
  token-count / "fairseq / multilingual tokenization" work; **verify the byte-latent /
  MegaByte / BLT frontier items exist with stable URLs before citing.**
- **Interactive (strong candidate).** the "same sentence, many languages" token-counter:
  the reader types a sentence, picks a language, and sees the token count + relative
  API cost vs English.

### T5 — Evaluation as a discipline (NEW LESSON `building_evals.php`)
`[x]`
- **Gap.** `evaluation.php` is good but is about *public* benchmarks; the #1 practical
  skill — **how do you build an eval for your own problem?** — is given six lines.
- **Cover to add**
  - **From benchmark to your-own eval** — the difference between "report MMLU" and
    "measure whether *my* feature works for *my* users."
  - **Rubric design** — turn a vague "good answer" into a scored rubric: criteria,
    anchors, what a 3 looks like vs a 5; and why a rubric is a *specification*, not a
    vibe.
  - **Inter-annotator agreement (IAA)** — if two people score the same answers, how
    often do they agree? Cohen's κ / Krippendorff's α; what agreement number means your
    rubric is sound and what means it isn't.
  - **LLM-as-judge calibration** — you already use LLM-as-judge (in `evaluation.php`);
    here, how you *calibrate* it: agree it with humans on a held-out subset, measure the
    agreement, and only trust it where it agrees. (Fixes the "judge inherits its
    biases" failure.)
  - **Variance & significance at n=100** — with 100 examples, is a 5% lift real or noise?
    Bootstrapping / confidence intervals on an accuracy; why "it went up 2 points"
    means nothing without an error bar; the multiple-comparisons trap when you A/B many
    prompts.
- **Home.** New lesson `building_evals.php`, Part 5, order 20 — the practitioner
  companion to [Evaluation](evaluation).
- **Sources to verify.** Cohen's κ (Cohen 1960); Krippendorff's α; LLM-as-judge
  calibration (Zheng et al. / the G-Eval paper, arXiv 2303.16634); a
  bootstrapping/significance reference. Reuse `zheng2023lmsys` if present.
- **Interactive (candidate).** a tiny "is this difference real?" toy: two success
  rates with n, and a bootstrap distribution of the difference — shows when 5% is
  noise.

### T6 — The economic layer (NEW LESSON `ai_economics.php`)
`[x]`
- **Gap.** The course has society but not the *price* layer: what does training cost as
  a function of params and tokens, the **6ND** FLOPs rule, inference cost per token,
  why **caching saves ~10×**, and why a 7B model on a laptop is economically a
  different animal from an API call. This connects the math to reality and is missing
  as a coherent thread.
- **Cover to add**
  - **The 6ND rule** — forward + backward for a transformer is ≈ **$6ND$** FLOPs
    ($N$ params, $D$ tokens). Derive it (why the "6," why it's independent of the
    exact architecture to first order) and use it to estimate training cost.
  - **Training compute → cost** — FLOPs → GPU-hours → $, with a realistic FLOP/s per
    GPU and the MFU (model FLOP utilization) discount (you get ~40% of peak, not 100%).
    "This is why a frontier model costs what it costs."
  - **Inference cost per token** — active-params × 2 FLOPs/token (forward only, no 3×),
    so a MoE model's *active* params set its serving cost, not its total.
  - **Why caching saves ~10×** — prompt/system-prompt caching: the prefill FLOPs are
    paid once and reused, so a repeated prefix is far cheaper per call.
  - **7B-on-a-laptop vs the API** — the *fixed* cost of owning hardware vs the
    *per-token* cost of renting it; breakeven; why local is great for a heavy,
    steady, private workload and expensive for a light one. Tie to
    [Running locally](running_locally) and [Inference optimization](inference_optimization).
- **Home.** New lesson `ai_economics.php`, Part 5, order 21 — the math-to-dollar
  bridge. (Could also live in Part 6; Part 5 keeps it with the engineering craft.)
- **Sources to verify.** the 6ND estimate (it's standard; cite a stable reference or
  present it as a derivation); a GPU FLOP/s / MFU reference; prompt-caching
  documentation (provider docs) for the "~10×."
- **Interactive (required).** a "price your training run" calculator: pick $N$, $D$,
  GPU type → FLOPs → hours → $; and a "price your tokens" one for inference + caching.

### T7 — Retrieval beyond "RAG works" (merged into `rag.php`)
`[x]`
- **Gap.** `rag.php` and `vectorsearch.php` cover the happy path. Missing: chunking as
  a *decision*, **hybrid search (BM25 + dense) implemented**, **reranking** (cross-
  encoders) in detail, **contextual retrieval** (Anthropic 2024), and — importantly —
  **why RAG often underperforms** (retrieval errors propagate, "lost in the middle",
  context pollution).
- **Cover to add**
  - **Chunking as a decision problem** — fixed-size vs semantic vs recursive vs
    "by heading"; the chunk is the *unit of retrieval* and its size/overlap is the
    single highest-leverage, least-discussed knob. Trade recall vs context-dilution.
  - **Hybrid search (BM25 + dense)** — why lexical (BM25, exact term match, great for
    rare terms/IDs) and semantic (dense, great for paraphrase) disagree, and how you
    combine them (reciprocal rank fusion or a learned score). Implement the RRF.
  - **Reranking** — the two-stage funnel: cheap recall (top-50) then a **cross-encoder**
    that scores each (query, doc) pair precisely and keeps the top-5. Why a cross-
    encoder can't do first-stage (O(N) forward passes) but is ideal for second-stage.
  - **Contextual retrieval** (Anthropic, 2024) — prepending an LLM-written context to
    each chunk at index time so a small, out-of-context chunk becomes retrievable; the
    ~50% drop in retrieval-failure rate.
  - **Why RAG fails (the honest half)** — **retrieval errors propagate** (a bad
    retrieval → a confident wrong answer); **"lost in the middle"** (Liu et al. 2023:
    models use the start and end of a long context best, and forget the middle);
    **context pollution** (the retrieved-but-wrong chunk steers the answer). These are
    why "just add RAG" is not a free lunch.
- **Home.** Merged into `rag.php` as § "Retrieval, in Depth" (Part 5, order 3),
  between "Limitations & Failure Modes" and "Summary"; `retrieval_deep_dive.php`
  deleted. The deep dive behind [RAG](rag) and [Semantic search](vectorsearch).
- **Sources to verify.** BM25 (`robertson2009bm25` exists); Reciprocal Rank Fusion;
  cross-encoders (Nogueira et al., "The Role of Pre-trained Linguistic Representations"
  / MonoT5); **Anthropic "Contextual Retrieval" (2024)** — verify the stable URL
  (anthropic.com/news/contextual-retrieval); **Liu et al. 2023 "Lost in the Middle"**
  (arXiv 2307.03172).
- **Interactive (strong candidate).** a hybrid-recall + rerank funnel: show a query,
  the BM25 top-k, the dense top-k, the fused list, and the cross-encoder rescoring —
  make the two-stage design visible.

### T8 — From model to system (merged into `production_serving.php`)
`[x]`
- **Gap.** The biggest structural hole. The course has `agents.php` and
  `production_serving.php`, but a modern LLM product is a **pipeline** — router,
  guardrails, tool-calling schema, retry logic, fallback models, observability,
  cost-tracking. That is not a deployment detail; it *is* the architecture of the
  application. A "Vom Modell zum Produkt" chapter closes the gap between Part 4 and
  Part 5.
- **Cover to add**
  - **The model is a component, not the system.** Reframe: an LLM product is a set of
    services around a stochastic component that *sometimes fails*.
  - **The router** — pick the right model (big vs small vs specialized) per query for
    cost/quality/latency; the cheap-model-then-escalate pattern.
  - **Guardrails** — input and output filters (safety, PII, format validation,
    "does this answer the question?") as *enforced* layers, not prompts.
  - **Tool-calling schema** — the contract (JSON schema) between the model and your
    tools; how a schema is a *specification* the model fills in (ties to
    [Agents](agents)).
  - **Retry, fallback, and degradation** — the model is non-deterministic: retry with a
    backoff on a failure, fall back to a smaller/cheaper model, and define what the
    product does when *all* models are down. (Determinism is a property you build, not
    one the model has.)
  - **Observability** — logs/metrics/traces of every call (prompt, completion, tokens,
    latency, cost, success); without it you cannot debug a 1-in-200 failure.
  - **Cost tracking** — per-request and per-user token accounting as a first-class
    feature; the bridge to [The economic layer](ai_economics).
- **Home.** Merged into `production_serving.php` as § "From Model to Product: the
  pipeline around the model" (Part 5, order 14), between "Hardware" and
  "Observability"; the two Observability sections were merged into one, and
  `from_model_to_product.php` deleted.
- **Sources to verify.** a stable reference for LLM-gateway / guardrail patterns
  (e.g. the OpenAI/Anthropic platform docs, or a well-known systems write-up); the
  tool-calling / function-calling spec. Reuse the existing `agents.php` and
  `production_serving.php` content by linking, not repeating.
- **Interactive (candidate).** a "build the pipeline" diagram the reader assembles:
  query → router → guardrails → model → validation → retry/fallback → cost ledger,
  with each stage toggleable and a live cost/latency estimate.

---

## Verification note (for the frontier items)
T4 (tokenizer-free: MegaByte / BLT), T1 (WSD), T2 (DeepSeek-V3 / Mixtral / Qwen tech
reports) and T7 (Anthropic Contextual Retrieval) cite **very recent (2024–26) frontier
work**. Per the "never invent a source" rule: verify each named item exists and has a
**stable URL that returns 2xx** before adding it to `literature.js`. If a source cannot
be verified, describe the idea in prose *without* a hard `\cite` (or cite only the
verifiable primary source). Do not add a key just to make the prose look grounded.
