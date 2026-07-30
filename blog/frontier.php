<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Frontier Topics
description: Constitutional AI, sparse autoencoders, long-context, world models, and where AI research is heading.
icon: &#128640;
part: 6
order: 42
color: text-secondary
-->

<div class="md">
This chapter surveys the research frontier of 2025 — the techniques and ideas that are emerging from labs but not yet standardized. Some will become textbook material in two years; others will fade. Knowing the landscape keeps you ahead of the curve.
</div>

<div class="md">
## Constitutional AI (CAI)

Bai et al. (Anthropic, 2022) replaced most of \cite[\\cite[ouyang2022instructgpt]]{ouyang2022instructgpt}'s human-labelling with **AI self-critique against a written constitution**:

1. The model generates a response.
2. The model critiques it against a constitutional principle ("be helpful, harmless, honest").
3. The model revises the response.
4. Iterate.
5. Train the final outputs with RL (RLAIF: RL from AI Feedback).

A typical constitution entry: *"Which response is more honest? Response A states the limits of its knowledge; Response B makes up plausible-sounding facts. Choose the more honest response."*

CAI reduces human labelling by ~10× while matching \cite[\\cite[ouyang2022instructgpt]]{ouyang2022instructgpt} on harmlessness benchmarks. Anthropic uses CAI for Claude 2/3/4. The same approach underlies **self-critique** in many production systems.
</div>

<div class="md">
## Sparse Autoencoders (SAEs) for Interpretability

The interpretability chapter covered **circuits**. A complementary approach: **decompose activations into sparse, interpretable features**.

An SAE has an encoder $E: \mathbb{R}^d \to \mathbb{R}^{d'}$ with $d' \gg d$ (e.g., $d' = 100{,}000$ features), applies a sparsity penalty, and reconstructs via a decoder $D: \mathbb{R}^{d'} \to \mathbb{R}^d$:

$$
\mathcal{L} = \|x - D(E(x))\|^2 + \lambda \|E(x)\|_1
$$

The L1 penalty forces only a few features to be active for any input. Anthropic's work on Claude 3 Sonnet (2024) found:

* A single SAE feature activated on **\cite[Templeton et al., 2024]{anthropic2024goldengate} Bridge** references — across languages, image descriptions, and even ASCII art.
* Features for **code bugs**, **refusal**, **deception** could be identified.
* Some features are **universal** across model families (Llama, GPT, Claude).

The "**\cite[Templeton et al., 2024]{anthropic2024goldengate} Claude**" demonstration (Anthropic, 2024) amplified a single feature to make the model obsessed with the \cite[Templeton et al., 2024]{anthropic2024goldengate} Bridge. This is the first direct evidence that specific, semantically meaningful features can be **causally manipulated** at inference time.
</div>

<div class="md">
## Long Context Beyond a Million Tokens

The 2024–2025 long-context arms race:

* Gemini 1.5 Pro: 1M tokens (commercial); 10M in research.
* Claude 3.5 Sonnet: 200K tokens.
* GPT-4o: 128K.
* Llama 3.1: 128K.
* Yi-Lightning, Qwen 2.5: 200K–1M.

Techniques enabling this:

* **RoPE scaling** (\\cite[su2021rope]): interpolate or extrapolate rotary position embeddings. **YaRN** (\\cite[peng2023yarn]) extends this with frequency-aware scaling.
* **ALiBi** (\\cite[press2022alibi]): linear bias to attention scores; doesn't require position embedding changes.
* **Ring Attention** (\\cite[li2023seqparallel]): sequence parallelism with overlap of compute and communication.
* **InfLLM** (Mini\\cite[ma2024bitnet]): training-free long-context via KV compression.
* **Landmark Attention** (\cite[Mohtashami & Jaggi, 2023]{mohtashami2023landmark}: append "landmark" tokens summarizing past context.

The **lost-in-the-middle** problem remains: models perform best on information at the start or end of the context window, worse in the middle. The reason is poorly understood but reproducible across architectures.

For evaluation, **needle-in-a-haystack** tests are now standard: insert a specific fact at a random position; ask the model to retrieve it. Performance degrades as context length grows.
</div>

<div class="md">
## Process Reward Models in Production

Recall from the Reasoning chapter: a **Process Reward Model** scores every step of a CoT, not just the final answer. In production:

* **Math-Shepherd** (\\cite[zhang2024mathshepherd]): auto-labels step correctness by checking if subsequent steps can reach the answer.
* **Critic models** (Qwen, DeepSeek): separate models trained to score the quality of intermediate steps.
* **Tree search**: best-of-N with PRM-guided search gives dramatic improvements on hard math (o1-mini with PRM ≈ GPT-4 on AIME).

The trade-off: PRMs add 2–5× inference cost. Used selectively on the hardest 10–20% of queries.
</div>

<div class="md">
## \cite[Bubeck et al., 2023]{fedus2022moe} of Depths (MoD)

Raposo et al. (Google DeepMind, 2024): instead of every token passing through every layer, **route tokens through different numbers of layers**. Easy tokens skip; hard tokens use full depth.

$$
\text{tokens through layer } l = \begin{cases} \text{skip} & \text{if } p_\theta(x) < r \\ \text{process} & \text{otherwise} \end{cases}
$$

Result: ~50% compute reduction at equal quality. The capacity is preserved; the routing learns to allocate it.

Related: **early exit** (\\cite[elhoushi2024early]), **conditional computation** (\\cite[fedus2022moe]), **Skrr** (skip-routing, \\cite[sakurai2024skrr]).
</div>

<div class="md">
## Test-Time Training (\cite[Sun et al., 2024]{sun2024ttt})

A 2024 idea: **train at inference time on the test input itself**. Sun et al. (2024) showed that fine-tuning a small adapter on the test prompt's distribution before answering improves performance on distribution-shifted tasks.

For a hard reasoning problem: take the prompt, generate some self-supervised variants, train a tiny LoRA on them, then answer. Especially powerful when the test domain differs from pretraining.

The trade-off: latency. \cite[Sun et al., 2024]{sun2024ttt} adds seconds-to-minutes per query. Useful for offline batch processing, not real-time chat.
</div>

<div class="md">
## Agentic Architectures

See the AI Agents chapter for the basics. Frontier developments:

* **Multi-agent \cite[\\cite[du2023multiagent]]{du2023multiagent}** (\\cite[du2023multiagent]): multiple LLMs argue; a judge picks the best. Improves reasoning accuracy 5–15%.
* **Toolformer-style self-taught tool use** (\\cite[schick2023toolformer]; Gorilla, \\cite[patil2023gpu]): models learn to call thousands of APIs.
* **Computer use agents**: Anthropic's Claude can interact with a real desktop. OpenAI's Operator. Google Jarvis (rumored). All powered by screenshot→action Transformers.
* **Code agents**: SWE-Agent, AutoCodeRover, Devin — autonomous software engineering. Still unreliable but improving.
* **Hierarchical agents**: a planner agent delegates to specialist sub-agents. Used in many production systems.

A 2025 benchmark (GAIA, Mialon et al., Meta) tests realistic agent tasks: "find the CEO of the company that acquired Twitter's recommendation team and their phone number on the website". Frontier agents solve ~50% of these; humans solve 92%.
</div>

<div class="md">
## World Models and Embodied AI

LLMs reason in language; **world models** reason in simulation. Yann LeCun has argued for years that LLMs lack the grounding necessary for true intelligence, and **Joint Embedding Predictive Architectures** (JEPA) are his proposed alternative.

Key 2024–2025 results:

* **Genie 2** (DeepMind, 2024): generates playable 3D environments from a single image.
* **V-JEPA 2** (Meta, 2025): self-supervised video prediction at scale.
* **Dreamer V3** (\\cite[hafner2023dreamer]): world model enables Minecraft diamond collection from scratch.
* **Sora** (OpenAI, 2024): world-model-like video generation, though OpenAI doesn't explicitly call it one.
* **RT-2 / PaLM-E / OpenVLA**: vision-language-action models for robot control.

The hypothesis: **true general intelligence requires internal simulation of consequences**, which pure text models lack. Whether this is correct is an open \cite[\\cite[du2023multiagent]]{du2023multiagent}.
</div>

<div class="md">
## Energy-Efficient and Carbon-Conscious AI

Concerns about AI's energy footprint have moved from academic to mainstream:

* **Training energy**: GPT-4 estimated 50 GWh, equivalent to 5,000 US homes for a year.
* **Inference energy**: at scale, inference exceeds training. A popular chatbot app with 1B daily queries uses ~1 GWh/day — the output of a small nuclear plant.
* **Carbon intensity**: depends on grid mix. A French data center (mostly nuclear) trains a frontier model at 5% the carbon of a Polish one (mostly coal).
* **Water**: cooling data centers consumes water; Llama 3 training reportedly used 1.3M liters.

Mitigations:

* **Algorithmic efficiency**: distillation, quantization, MoE.
* **Hardware**: H100 is 2× more efficient than A100; B200 is 2× more than H100.
* **Renewable-powered data centers**: Google, Microsoft have signed PPAs for solar/wind matching 100% of operational use.
* **Workload scheduling**: run training when renewable supply is high (geographic arbitrage).
* **PUE (Power Usage Effectiveness)**: efficient data centers achieve 1.1; poor ones 2.0+. AWS, Google lead at ~1.1.

The **ML.ENERGY** leaderboard and **Green Software Foundation** are pushing for standardized reporting.
</div>

<div class="md">
## Multilingual and Low-Resource AI

LLMs are still **predominantly English-centric** in training:

* Llama 3.1: ~90% English tokens.
* GPT-4o: ~85%.
* DeepSeek-V3: ~75% (more Chinese than Western models).

This biases models toward English cultural norms, knowledge, and reasoning patterns. Frontier efforts in 2025:

* **African languages** (Yoruba, Amharic, Swahili): covered by **Aya** (Cohere), **Lesan AI** (Tigrinya, Amharic).
* **Indic languages**: **AI4Bharat** (Tamil, Bengali, Hindi, etc.), **Navarasa-2.0** (15 Indic languages).
* **Chinese**: Qwen, DeepSeek, GLM, InternLM.
* **Arabic**: Jais, Falcon, Allam.

Low-resource languages are evaluated with benchmarks like **XTREME-S**, **AfroBench**, **INCLUDE**.

The challenge: high-quality training data in these languages is scarce. Solutions: **machine-translated** data (with quality filters), **synthetic data** generation, **cross-lingual transfer** from high-resource languages.
</div>

<div class="md">
## Memory and Continual Learning

LLMs are **stateless**: they don't learn from interactions. Every conversation starts fresh. The 2024–2025 frontier in long-term memory:

* **External memory stores**: vector databases, structured stores (Letta, MemGPT), fact databases.
* **Memory-augmented Transformers**: kNN-LM, RAG with learnable retrieval.
* **Tool-based memory**: the model calls a memory API to save/retrieve facts.
* **Titans** (Google, 2024): a Transformer with a learned long-term memory module. Surpasses Transformers on million-token tasks.
* **Test-time training**: see above.
* **Continual learning**: training on a stream of new data without forgetting old. Still unsolved at frontier scale.

For practical deployments: a good **memory + retrieval layer** is more useful than a longer context window.
</div>

<div class="md">
## Mechanistic Interpretability Frontier

From the Mechanistic Interpretability chapter's foundation, frontier work in 2024–2025:

* **Sparse autoencoders** (see above) — millions of features per model.
* **Causal scrubbing** (\\cite[redman2024causalscrubbing]): formally verify which circuits implement a behavior.
* **Cross-model universality**: do circuits transfer across models? Yes, partially — "induction heads" appear in every Transformer.
* **Alignment-via-interpretability**: identify features for "deception", "harm", "sycophancy" and steer the model away from them. **Representation engineering** (Zou et al., 2023) is the umbrella term.

The dream: an **"MRI for AI"** — read the activations, identify misbehavior, fix it surgically. Not realized, but progressing.
</div>

<div class="md">
## Open Questions

* Will the next paradigm shift come from **architectures** (post-Transformer), **scaling** (more data/compute), or **inference** (test-time compute, agents)?
* Can interpretability mature into a **safety discipline** — predicting and preventing failures before deployment?
* Will **multimodal** models converge to a single architecture (one Transformer for everything) or remain specialists (one for vision, one for speech)?
* Will **open models** close the gap to frontier, or will the frontier pull away indefinitely?
* Will **economic value** concentrate among the few companies with frontier-scale compute, or diffuse widely?

The answers will reshape technology, economics, and society in ways that are not yet visible. What is certain: this is a remarkable time to be studying the field.
</div>

<script>
async function loadFrontierModule() {
	updateLoadingStatus("Loading section about Frontier Topics...");
	return Promise.resolve();
}
</script>
