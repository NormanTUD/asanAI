<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Economics of AI
description: API business models, training vs inference economics, and who pays for intelligence.
icon: &#128176;
part: 6
order: 41
color: text-secondary
-->

<div class="md">
A frontier LLM costs roughly \$100M to train \cite[Patel & Cottier, 2023]{patel2023gpu}, ~\$1M/day to serve at scale, and ~\$0.01 per typical user query. Who pays for this? How do companies make money? When does self-hosting beat APIs? When do small open models beat GPT-4o?

This chapter is the financial-engineering complement to the technical chapters above. Estimates are drawn from publicly disclosed numbers, vendor pricing pages, and analyst reports; treat them as approximations, not audited figures.
</div>

<div class="md">
## The Cost Stack

Training cost has three components:

* **Compute**: ~85% of the bill for frontier training. Llama 3 405B used ~30 million H100-hours, ≈ \$100M at \$3/hour \cite[Patel & Cottier, 2023]{patel2023gpu}.
* **Data acquisition and curation**: ~5%. Mostly engineering salaries, not data purchase (yet).
* **Engineering talent**: ~10%. ~50–200 staff at frontier labs, \$200K–\$1M average.

Inference cost is dominated by:

* **Compute** (especially GPU depreciation): ~70%.
* **Power and cooling**: ~15%. A 1 GW data center is the upper limit of current infrastructure.
* **Networking and storage**: ~5%.
* **Personnel**: ~10%.

The unit economics for an LLM API call:

$$
\text{cost per token} = \frac{\text{GPU-hour cost}}{\text{tokens per GPU-hour}}
$$

For a 70B model on an H100 with vLLM continuous batching \cite[at roughly \$2/hr on-demand][]{kwon2023vllm}: ~\$0.0003 per 1K output tokens at retail GPU prices, ~\$0.0001 at hyperscaler rates.
</div>

<div class="md">
## The Frontier Lab Business Models

### OpenAI (closed)

* **ChatGPT subscription**: \$20/month (Plus), \$200/month (Pro), \$25–\$200/employee/month (Team/Enterprise). ~700M weekly users by 2025.
* **API**: per-token pricing, \$2.50–\$10 per 1M output tokens for GPT-4o \cite[OpenAI, 2024]{openai2023apipricing}.
* **Revenue**: estimated \$5–\$10B annualized in 2025, growing 3× year-over-year.
* **Strategy**: closed frontier models + consumer brand.

### Anthropic (closed)

* **Claude API + Enterprise**. Estimated \$5B annualized revenue in 2025 \cite[Anthropic, 2024]{anthropic2024funding}.
* **Strategy**: enterprise-focused, "safety-first" branding, partnerships with AWS, Google Cloud.
* **2024 valuation**: ~\$60B.

### Google DeepMind / Gemini

* **Bundled into Google Cloud** (Vertex AI), Workspace (Gmail, Docs AI features), Search, Android.
* **Strategy**: integration into existing Google products; Gemini powers 2+ billion users via Workspace and Search AI Overviews.

### Meta (open)

* **Llama models are free** (with license restrictions on 700M+ MAU companies).
* **Strategy**: open-source as a moat against proprietary competitors; revenue comes indirectly through ad engagement on Meta platforms.

### Mistral (open)

* **Mixtral, Mistral Large**: open weights + commercial API (La Plateforme).
* **Strategy**: European champion; partnerships with Microsoft Azure, Snowflake.

### DeepSeek (open, China)

* **DeepSeek-V3, R1**: open weights + cheap API (\$0.27/M input tokens) \cite[DeepSeek, 2024]{deepseek2024v3}.
* **Strategy**: Chinese open-source dominance; reportedly trained at \$5M cost using H800s.
</div>

<div class="md">
## Self-Hosting Economics

The breakeven analysis:

| Cost component | Hyperscaler rate | Self-host (H100) |
|----------------|------------------|------------------|
| GPU-hour | \$2–\$4 (cloud) | \$1.50 (amortized) |
| 70B tokens/s throughput (16×H100) | \$0.0004/1K | \$0.0002/1K |
| Inference at 100M tokens/day | \$40/day | \$20/day |
| At 10B tokens/day | \$4K/day | \$2K/day |
| Engineering (FTE) | \$0 (managed) | \$300K/year |

**Breakeven**: ~10–50M tokens/day. Below that, APIs win on flexibility. Above, self-hosting wins on cost.

For enterprise: at \$1M+ annual AI spend, the 5× cost reduction of self-hosting justifies hiring 1–2 ML engineers.
</div>

<div class="md">
## The Open vs Closed Debate

| Argument | Open-source supporters | Closed-source supporters |
|----------|------------------------|--------------------------|
| **Safety** | More eyes find more bugs; transparency enables research | Frontier capability requires concentrated resources and safety investments |
| **Competition** | Prevents lock-in; democratizes access | Closed labs can fund the compute that pushes frontier |
| **Customization** | Full fine-tune access | Limited to API customization |
| **Speed** | Community innovation outpaces any single lab | Frontier labs have unique data, talent, compute |
| **Geopolitics** | Western open models counter Chinese models | Open models can be weaponized |

Reality in 2025: **both ecosystems thrive**. The frontier (GPT-4o, Claude 4, Gemini 2) is closed; the long tail (Llama, Mistral, Qwen, DeepSeek, Phi) is open. Open models reach within 5–15% of closed frontier at 1/20th the cost.

The economic significance: **open models commoditize the "good enough" tier**. Most enterprise use cases don't need GPT-4o; they need a fine-tuned Llama 3.1 70B for \$50K/year instead of \$1M/year.
</div>

<div class="md">
## Pricing Models for AI Products

Building a product on top of LLMs requires **unit economics that scale**:

### Per-token Pricing

The simplest: pass through API costs with a margin. Common for developer tools (Cursor, Cody).

### Per-seat Subscription

ChatGPT, Claude Pro, Copilot. Bundles unlimited usage; economics depend on average usage per seat.

### Per-outcome Pricing

Charge per successful task (per lead generated, per code merged, per document processed). Higher willingness to pay; harder to implement.

### Usage-based Tiered

Tier 1: free, basic usage. Tier 2: \$20/month, more usage. Tier 3: enterprise, unlimited.

### Freemium with Watermarking

Free tier uses a smaller/cheaper model; paid tier uses frontier.

### Revenue-share

Charge a percentage of customer revenue (e.g., AI sales agent charges 5% of incremental sales).

The challenge: **gross margins**. If your service costs \$0.10 per call and you charge \$0.20, your margin is 50% before overhead. Successful AI products target **70%+ gross margin** by:

* Aggressive caching (most queries are repeats)
* Routing: small model first, large model fallback
* Token compression
* Asynchronous batching for non-urgent workloads
</div>

<div class="md">
## The Inference Cost Reduction Curve

Hardware and algorithmic improvements are **driving inference costs down by ~10× per year**:

* 2020: GPT-3 inference at ~\$0.06 / 1K tokens.
* 2023: GPT-4 ~\$0.03 / 1K tokens.
* 2024: GPT-4o ~\$0.01 / 1K tokens.
* 2025: DeepSeek V3 ~\$0.001 / 1K tokens \cite[DeepSeek, 2024]{deepseek2024v3}.

Drivers:

* **Hardware**: A100 → H100 → B200 (each ~2× perf/W).
* **Custom silicon**: Groq LPU, Cerebras WSE, AWS Trainium.
* **Quantization**: int8 → int4 → int2 with manageable quality loss.
* **Architectural improvements**: FlashAttention \cite[Dao et al., 2022]{dao2022flashattention}, paged attention \cite[Kwon et al., 2023]{kwon2023vllm}, speculative decoding \cite[Leviathan et al., 2023]{leviathan2023spec}.
* **Distillation** \cite[Hinton et al., 2015]{hinton2015distilling}: 70B models approximating 400B quality.

The implication: **tasks that were uneconomical yesterday are profitable today**. Voice agents (sub-200ms latency), real-time code review, million-token document analysis — all became viable in 2024–2025.
</div>

<div class="md">
## The Data Acquisition Economy

The shift from "scrape the web for free" to "license content" is reshaping the media industry:

* **Shutterstock** sells its image library for training; generated \$100M+ from AI licensing by 2024.
* **Reddit** (\$60M/year data deal with Google), **Stack Overflow** (\$20M+/year with multiple labs), **X (Twitter)** (\$2–\$4M/year from various AI startups) all monetize user-generated content.
* **News Corp** (with OpenAI), **Axel Springer** (with OpenAI), **Financial Times** (with OpenAI), **Associated Press** (with OpenAI) all signed multi-year content deals.
* **Academic publishers** (Elsevier, Springer Nature) are suing or licensing depending on jurisdiction.

By 2026, **content licensing will be a >\$1B/yr market** at current rates. Publishers without distinctive content (Wikipedia, government data) see their value erode; those with original reporting, scientific literature, or specialized corpora command premiums.
</div>

<div class="md">
## Energy and Geopolitics

A frontier training run consumes **gigawatt-hours**. The largest 2024 runs:

* GPT-4 training: estimated 50+ GWh (equivalent to ~5,000 US homes for a year).
* Llama 3 405B: ~30 GWh.
* Gemini Ultra: ~80 GWh.

This has political consequences:

* **US**: AI Action Plan (2025) prioritizes energy infrastructure for AI.
* **China**: State-led investment in nuclear and renewables for AI compute.
* **EU**: \cite[AI Act][]{euaiact2024} + efficiency-first approach; "AI factories" with subsidized compute.

The compute itself is now a **strategic asset**. US export controls on advanced GPUs (H100, B200) to China are a major geopolitical lever. The "AI race" is increasingly a **race for electrons**.
</div>

<div class="md">
## Job Market Economics

The labor market is bifurcating:

* **AI engineers** (building, fine-tuning, deploying LLMs): \$200K–\$1M+ at frontier labs.
* **AI-adjacent roles** (prompt engineers, AI product managers, AI safety researchers): rapidly growing.
* **AI-displaced roles**: customer support, basic content writing, simple coding. Already shrinking.
* **AI-augmented roles**: lawyers, doctors, scientists, designers. Productivity up, headcount uncertain.

A 2023 \cite[Goldman Sachs report][]{goldman2023ai} estimated 300M jobs exposed to AI automation; 7% of US employment could be displaced if generative AI scales rapidly. The actual outcome: **augmentation > replacement** for most knowledge work, with new roles emerging faster than old ones disappear.

The textbook itself is an example: this course was written by one human working with LLMs as a tool. A 2010s-era equivalent would have required a team of writers, illustrators, web developers, and editors.
</div>

<div class="md">
## Building a Profitable AI Product

A practical playbook:

1. **Validate demand first**: talk to users before writing code. Most AI startups fail because nobody wants the product.
2. **Start with the best model**: use GPT-4o or Claude for prototyping; don't waste time on a worse model until you've validated.
3. **Measure your unit economics**: token cost per user session, gross margin, payback period. If unprofitable, redesign.
4. **Switch to cheaper models when possible**: many workloads work on Llama 3.1 8B at 1/20th the cost.
5. **Cache aggressively**: prompt prefixes, common queries, embedding results.
6. **Build a moat beyond the model**: data flywheel, distribution, brand, integration depth.
7. **Watch the curve**: today's frontier is next year's commodity. Compete on what won't be commoditized.

The companies that thrive in the AI economy of 2025 are not those with the best model — they all have similar quality. They are those with the best **distribution, data, and customer intimacy**.
</div>

<script>
async function loadEconomicsModule() {
	updateLoadingStatus("Loading section about AI Economics...");
	return Promise.resolve();
}
</script>
