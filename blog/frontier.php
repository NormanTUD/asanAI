<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Frontier Topics
description: Constitutional AI, sparse autoencoders, long-context, world models, and where AI research is heading.
icon: &#128640;
part: 6
order: 8
color: text-secondary
topics: frontier, philosophy, architecture, ethics
tags: interested-layman
-->

<div class="md">
This chapter surveys the research frontier of 2025, the techniques and ideas that are emerging from labs but not yet standardized. Some will become textbook material in two years; others will fade. Knowing the landscape keeps you ahead of the curve. The topics are grouped into six themes, then closed with the open questions that define the field.
</div>

<div class="md">
## Alignment

### Constitutional AI (CAI)

Bai et al. (Anthropic, 2022) replaced most of the human labelling used by \citeauthor{ouyang2022instructgpt} (\citeyear{ouyang2022instructgpt}) with **AI self-critique against a written constitution**:

1. The model generates a response.
2. The model critiques it against a constitutional principle (“be helpful, harmless, honest”).
3. The model revises the response.
4. Iterate.
5. Train the final outputs with RL (RLAIF: RL from AI Feedback).

A typical constitution entry: *“Which response is more honest? Response A states the limits of its knowledge; Response B makes up plausible-sounding facts. Choose the more honest response.”*

CAI reduces human labelling substantially; the paper compares it with an RLHF baseline rather than with InstructGPT (\cite[Ouyang et al., 2022]{ouyang2022instructgpt}). Anthropic uses CAI for Claude 2/3/4. The same approach underlies **self-critique** in many production systems.
</div>

<div class="md">
## Interpretability
</div>

<div class="md" data-mathlevel="60">
### Sparse Autoencoders (SAEs) for Interpretability

The interpretability chapter covered **circuits**. A complementary approach: **decompose activations into sparse, interpretable features**.

An SAE has an encoder $E: \mathbb{R}^d \to \mathbb{R}^{d'}$ with $d' \gg d$ (e.g., $d' = 100{,}000$ features), applies a sparsity penalty, and reconstructs via a decoder $D: \mathbb{R}^{d'} \to \mathbb{R}^d$:

$$
\mathcal{L} = \|x - D(E(x))\|^2 + \lambda \|E(x)\|_1
$$

The L1 penalty forces only a few features to be active for any input. Anthropic's work on Claude 3 Sonnet (2024) found:

* A single SAE feature activated on **Golden Gate Bridge** references, across languages, image descriptions, and even ASCII art (\cite[Templeton et al., 2024]{anthropic2024goldengate}).
* Features for **code bugs**, **refusal**, **deception** could be identified.
* Anthropic reported these features in Claude 3 Sonnet; whether they are **universal** across model families is still an open question.

The “**Golden Gate Claude**” demonstration (\cite[Templeton et al., 2024]{anthropic2024goldengate}) amplified a single feature to make the model obsessed with the Golden Gate Bridge. This is direct evidence that specific, semantically meaningful features can be **causally manipulated** at inference time.
</div>

<div class="md">
### Mechanistic Interpretability Frontier

From the Mechanistic Interpretability chapter's foundation, frontier work in 2024–2025:

* **Sparse autoencoders** (see above), millions of features per model.
* **Causal scrubbing** (\cite[Chan et al., 2022]{redman2024causalscrubbing}): formally verify which circuits implement a behavior.
* **Cross-model universality**: do circuits transfer across models? Yes, partially, “induction heads” appear in every Transformer.
* **Alignment-via-interpretability**: identify features for “deception”, “harm”, “sycophancy” and steer the model away from them. **Representation engineering** (\cite[Zou et al., 2023]{zou2023repeng}) is the umbrella term.

The dream: an **“MRI for AI”**, read the activations, identify misbehavior, fix it surgically. Not realized, but progressing.
</div>

<div class="md">
## Reasoning and Inference-Time Compute

### Process Reward Models in Production

Recall from the Reasoning chapter: a **Process Reward Model** scores every step of a CoT, not just the final answer. In production:

* **\citealternativetitle{zhang2024mathshepherd}**: auto-labels step correctness by checking if subsequent steps can reach the answer.
* **Critic models** (Qwen, DeepSeek): separate models trained to score the quality of intermediate steps.
* **Tree search**: best-of-N with PRM-guided search gives dramatic improvements on hard math .

The trade-off: PRMs add 2–5× inference cost. Used selectively on the hardest 10–20% of queries.
</div>

<div class="md">
### Test-Time Training

A 2024 idea: **train at inference time on the test input itself**. \cite[Sun et al. (2024)]{sun2024ttt} showed that fine-tuning a small adapter on the test prompt's distribution before answering improves performance on distribution-shifted tasks.

For a hard reasoning problem: take the prompt, generate some self-supervised variants, train a tiny LoRA on them, then answer. Especially powerful when the test domain differs from pretraining.

The trade-off: latency. (\cite[Sun et al., 2024]{sun2024ttt}) adds seconds-to-minutes per query. Useful for offline batch processing, not real-time chat.
</div>

<div class="md">
## Scale and Efficiency

### Long Context Beyond a Million Tokens

The 2024–2025 long-context arms race:

* Gemini 1.5 Pro: 1M tokens (commercial); 10M in research.
* Claude 3.5 Sonnet: 200K tokens.
* GPT-4o: 128K.
* Llama 3.1: 128K.
* Yi-Lightning, Qwen 2.5: 200K–1M.

Techniques enabling this:

* **RoPE scaling** (\cite[Su et al., 2021]{su2021rope}): interpolate or extrapolate rotary position embeddings. **YaRN** (\cite[Peng et al., 2023]{peng2023yarn}) extends this with frequency-aware scaling.
* **ALiBi** (\cite[Press et al., 2022]{press2022alibi}): linear bias to attention scores; doesn't require position embedding changes.
* **Ring Attention** (\cite[Li et al., 2023]{li2023seqparallel}): sequence parallelism with overlap of compute and communication.
* **InfLLM**: training-free long-context via KV compression (\cite[Xiao et al., 2024]{infllm2024}).
* **Landmark Attention** (\cite[Mohtashami & Jaggi, 2023]{mohtashami2023landmark}): append “landmark” tokens summarizing past context.

The **lost-in-the-middle** problem remains: models perform best on information at the start or end of the context window, worse in the middle. The reason is poorly understood but reproducible across architectures.

For evaluation, **needle-in-a-haystack** tests are now standard: insert a specific fact at a random position; ask the model to retrieve it. Performance degrades as context length grows.
</div>

<div class="md" data-mathlevel="45">
### Mixture of Depths (MoD)

Raposo et al. (Google DeepMind, 2024): instead of every token passing through every layer, **route tokens through different numbers of layers** (\cite[Raposo et al., 2024]{raposo2024mod}). Easy tokens skip; hard tokens use full depth.

$$
\text{tokens through layer } l = \begin{cases} \text{skip} & \text{if } p_\theta(x) < r \\ \text{process} & \text{otherwise} \end{cases}
$$

Result: ~50% compute reduction at equal quality. The capacity is preserved; the routing learns to allocate it.

Related: **early exit** (\cite[Elhoushi et al., 2024]{elhoushi2024early}), **conditional computation** (\cite[Fedus et al., 2022]{fedus2022switch}).
</div>

<div class="md">
## Agents and Embodiment

### Agentic Architectures

See the AI Agents chapter for the basics. Frontier developments:

* **\cite[Multi-Agent]{du2023multiagent}** (\cite[Du et al., 2023]{du2023multiagent}): multiple LLMs argue; a judge picks the best. Improves reasoning accuracy 5–15%.
* **Toolformer-style self-taught tool use** (\cite[Schick et al., 2023]{schick2023toolformer}; Gorilla, \cite[Patil et al., 2023]{patil2023gorilla}): models learn to call thousands of APIs.
* **Computer use agents**: Anthropic's Claude can interact with a real desktop. OpenAI's Operator. Google Jarvis (rumored). All powered by screenshot→action Transformers.
* **Code agents**: SWE-Agent, AutoCodeRover, Devin, autonomous software engineering. Still unreliable but improving.
* **Hierarchical agents**: a planner agent delegates to specialist sub-agents. Used in many production systems.

GAIA (Mialon et al., 2023, Meta) tests realistic agent tasks: “find the CEO of the company that acquired Twitter's recommendation team and their phone number on the website”. Frontier agents solve ~50% of these; humans solve 92%.
</div>

<div class="md">
### World Models and Embodied AI

LLMs reason in language; **world models** reason in simulation. Yann LeCun has argued for years that LLMs lack the grounding necessary for true intelligence, and **Joint Embedding Predictive Architectures** (JEPA) are his proposed alternative.

Key 2024–2025 results:

* **Genie 2** (DeepMind, 2024): generates playable 3D environments from a single image.
* **V-JEPA 2** (Meta, 2025): self-supervised video prediction at scale.
* **Dreamer V3** (\cite[Hafner et al., 2023]{hafner2023dreamer}): world model enables Minecraft diamond collection from scratch.
* **Sora** (OpenAI, 2024): world-model-like video generation, though OpenAI doesn't explicitly call it one.
* **RT-2 / PaLM-E / OpenVLA**: vision-language-action models for robot control.

The hypothesis: **true general intelligence requires internal simulation of consequences**, which pure text models lack. Whether this is correct is an open question; LeCun's position paper argues that prediction in representation space, not token prediction, is the missing ingredient (\cite[LeCun, 2022]{lecun2022path}).
</div>

<div class="md">
## Language and Memory

### Multilingual and Low-Resource AI

LLMs are still **predominantly English-centric** in training:

* Llama 3.1: ~90% English tokens (the Llama 3 report publishes this figure).
* GPT-4o and DeepSeek-V3: their training mixes are not public, so exact percentages should not be treated as established.

This biases models toward English cultural norms, knowledge, and reasoning patterns. Frontier efforts in 2025:

* **African languages** (Yoruba, Amharic, Swahili): covered by **Aya** (Cohere), **Lesan AI** (Tigrinya, Amharic).
* **Indic languages**: **AI4Bharat** (Tamil, Bengali, Hindi, etc.), **Navarasa-2.0** (15 Indic languages).
* **Chinese**: Qwen, DeepSeek, GLM, InternLM.
* **Arabic**: Jais, Falcon, Allam.

Low-resource languages are evaluated with benchmarks like **XTREME-S**, **AfroBench**, **INCLUDE**.

The challenge: high-quality training data in these languages is scarce. Solutions: **machine-translated** data (with quality filters), **synthetic data** generation, **cross-lingual transfer** from high-resource languages.
</div>

<div class="md">
### Memory and Continual Learning

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
## The 2026 Snapshot: Which Ideas Stuck

A model zoo is not a curriculum, but the releases of 2023–2026 are a useful audit of which research ideas survived contact with scale. Five patterns recur across otherwise unrelated labs.

**1. Sparse mixture-of-experts became the default at the frontier.** DeepSeek-V3 (671B total, 37B active) reported frontier quality from a disclosed final training run of roughly \$5.6M (\cite[DeepSeek-AI, 2024]{deepseek2024v3}); Kimi K2 pushed open weights to a trillion parameters with the MuonClip optimizer (\cite[Kimi Team, 2025]{kimi2025k2}); LongCat-Flash reached 560B with about 27B active and was reported as trained on Chinese accelerators (\cite[LongCat Team, 2025]{longcat2025}). The economic logic is the one from the [Mixture of Experts](mixture_of_experts.php) chapter: capacity scales with total parameters, cost with active ones.

**2. Hybrid attention layouts replaced pure dense attention.** gpt-oss alternates dense and sliding-window attention layers and gives every head a learned sink logit (\cite[OpenAI, 2025]{gptoss2025}); MiniMax built its line on lightning attention, a linear-attention variant interleaved with softmax attention (\cite[MiniMax, 2025]{minimax2025lightning}); DeepSeek-V2 introduced multi-head latent attention to shrink the KV cache (\cite[DeepSeek-AI, 2024]{deepseek2024v2}). The goal in every case is the same: keep exact attention where it matters, and stop paying quadratic cost everywhere.

**3. Reasoning became a training target, not a prompt trick.** RLVR — reinforcement learning against programmatic verifiers — turned chain-of-thought from something users coaxed out of a model into something models are trained to produce. DeepSeek-R1 published the recipe and open weights (\cite[Guo et al., 2025]{guo2025deepseekr1}), and the o-series, Claude's extended thinking, and Gemini's thinking modes made the inference-compute dial a product feature.

**4. Hybrid thinking modes arrived.** Qwen3 trained dense and mixture-of-experts models with both a fast, non-thinking mode and a slower reasoning mode, selectable per request (\cite[Qwen Team, 2025]{qwen2025qwen3}) — an acknowledgment that most queries do not need a thousand tokens of deliberation.

**5. Open weights moved from “small models” to frontier-adjacent scale.** Llama 3 405B was **one of the first** open-weight models widely described as competitive with closed frontier systems (\cite[Grattafiori et al., 2024]{llama3herd2024}); Llama 4 added native multimodality and MoE (\cite[Meta AI, 2025]{meta2025llama4}); Gemma 3 brought multimodality and long context to the small-model tier (\cite[Gemma Team, 2025]{gemma2025v3}); Qwen3 and Kimi K2 became standard bases for fine-tuning. The open ecosystem no longer trails by a full generation on architecture — mainly on data and compute.

**6. Interpretability moved into the system card.** Frontier safety reports now routinely include sparse-autoencoder features, attribution graphs, activation steering, and activation verbalizers — the techniques of the [Mechanistic Interpretability](mechanistic_interpretability.php) chapter — as evidence about internal states rather than as research curiosities (\cite[Lindsey et al., 2025]{anthropic2025biology}; \cite[Pan et al., 2024]{pan2024latentqa}).

**7. Diffusion language models became a real alternative.** LLaDA showed that masked diffusion could train an 8B instruction-following model from scratch, and Mercury and Gemini Diffusion brought parallel decoding to products (\cite[Nie et al., 2025]{nie2025llada}). Whether dLLMs close the quality gap at the frontier is still open, but “autoregressive or bust” is no longer the default assumption.

The through-line: the Transformer did not get replaced. It got **specialized** — sparse experts, hybrid attention, learned sinks, compressed caches, and a second axis of compute at inference time.
</div>

<div class="md">
## Open Questions

* Will the next paradigm shift come from **architectures** (post-Transformer), **scaling** (more data/compute), or **inference** (test-time compute, agents)?
* Can interpretability mature into a **safety discipline**, predicting and preventing failures before deployment?
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

<div class="mn-quiz" data-quiz="frontier"><script type="application/json">{"title": "Frontier topics", "questions": [{"q": "What is Constitutional AI?", "options": ["Training a model to critique and revise answers against principles", "An AI system regulated by a national constitution and a court system", "A model that drafts and votes on new laws for a country", "A voting system where models elect the best answer for users"], "answer": 0, "explain": "AI feedback guided by a “constitution” reduces the need for human labels on harmful content."}, {"q": "What is meant by “inference-time compute” as a frontier?", "options": ["Letting models think longer at answer time on hard tasks", "Training bigger models for longer on more training data", "Compressing vocabularies so models run on smaller devices", "Running the model only on phones instead of servers"], "answer": 0, "explain": "Reasoning models trade more tokens for better answers."}, {"q": "What is a “world model” in this context?", "options": ["An internal model of how an environment behaves, for planning", "A detailed map of the Earth used for navigation and route planning", "A model trained only on geography, borders and place names", "A map of the Earth used only for basic navigation tasks"], "answer": 0, "explain": "Whether LLMs have one, and how to build better ones, is an open research question."}, {"q": "Why is interpretability listed as a frontier for safety?", "options": ["Understanding what a model computes could reveal hidden flaws", "It makes models faster by removing unnecessary layers", "It replaces training by directly editing the model's weights", "It is already solved, so little further safety work is needed"], "answer": 0, "explain": "Reading internal features might detect deception or hidden objectives."}]}</script></div>
