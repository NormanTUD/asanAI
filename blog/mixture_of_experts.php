<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Mixture of Experts
description: Routing, load balancing, shared experts, and why sparse models decouple capacity from compute — the architecture behind most frontier models.
icon: &#128268;
part: 4
order: 18
color: sky
topics: architecture, training
tags: math-heavy, code-heavy
math: 55
-->

<div class="md" data-lesson-id="mixture_of_experts">
The transformer you have been building all this chapter passes every token through every weight: one dense feed-forward block per layer, and that block is the bulk of the model's parameters. That means the model's **capacity** (how many parameters it stores) and its **compute per token** (how many it actually uses) are the same number — you cannot have one without the other. **Mixture of Experts (MoE)** breaks that lock. It lets a model *store* a very large number of parameters while *activating* only a small fraction for each token — so you get the knowledge of a 600-billion-parameter model at the speed and cost of a 30-billion one. By 2026 this is not a niche trick; it is how most frontier models are built (\cite[Jiang et al., Mixtral (2024)]{mixtral2024}, \cite[DeepSeek-V3 (2024)]{deepseekv3tech2024}), and it is the single most important reason the "size of a model" question has quietly become two questions: *total* and *active*.
</div>

<div class="md">
## The architecture

### The core idea: swap the FFN for a bank of routed experts

Recall the per-layer structure from [The Transformer](transformer.php): an attention block, then a feed-forward (FFN) block. The FFN is where most parameters live — roughly two of the three parameters in a layer sit in it. The MoE move, introduced by \cite[Shazeer et al. (2017)]{shazeer2017moe}, is to replace that single FFN with a **bank of $E$ experts** — a set of smaller FFNs — plus a tiny **router** (a.k.a. the gating network) that decides, for each token, which experts to use.

Given a token's hidden state $h$, the router computes a score for each expert and the model keeps only the **top-$k$** (often $k=1$ or $k=2$):

<div>
$$ y = \sum_{i \in \text{top-}k\,(g(h))} g(h)_{i}\, \text{Expert}_{i}(h) $$
</div>

Everything else about the model — the attention, the residual stream, the other layers — is unchanged. The only difference is that the FFN layer is now *conditional*: different tokens go through different experts. The total parameter count grows by a factor of $E$ (you built $E$ FFNs), but each token touches only $k$ of them, so the **active** parameters grow by $k$, not by $E$. That is the whole trick in one line: **capacity scales with $E$; compute scales with $k$.**

<figure>
	<svg viewBox="0 0 560 150" role="img" aria-label="A MoE layer: a router fans a token out to a bank of experts, two of which are selected" style="width:100%; height:auto; max-width:560px; display:block; margin:0 auto;">
		<defs>
			<marker id="moearrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--mn-text-secondary)"/></marker>
		</defs>
		<rect x="8" y="58" width="92" height="34" rx="8" fill="var(--mn-bg-subtle)" stroke="var(--mn-border)"/>
		<text x="54" y="80" text-anchor="middle" font-size="13" fill="var(--mn-text)">token h</text>
		<rect x="150" y="45" width="92" height="60" rx="8" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="196" y="72" text-anchor="middle" font-size="13" fill="var(--mn-text)">router</text>
		<text x="196" y="90" text-anchor="middle" font-size="11" fill="var(--mn-text-secondary)">top-k gate</text>
		<line x1="100" y1="75" x2="148" y2="75" stroke="var(--mn-text-secondary)" stroke-width="1.5" marker-end="url(#moearrow)"/>
		<rect x="300" y="6" width="70" height="26" rx="6" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="335" y="23" text-anchor="middle" font-size="12" fill="var(--mn-text)">exp 1</text>
		<rect x="300" y="38" width="70" height="26" rx="6" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="335" y="55" text-anchor="middle" font-size="12" fill="var(--mn-text)">exp 2</text>
		<rect x="300" y="70" width="70" height="26" rx="6" fill="none" stroke="var(--mn-border)"/>
		<text x="335" y="87" text-anchor="middle" font-size="12" fill="var(--mn-text-secondary)">exp 3</text>
		<rect x="300" y="102" width="70" height="26" rx="6" fill="none" stroke="var(--mn-border)"/>
		<text x="335" y="119" text-anchor="middle" font-size="12" fill="var(--mn-text-secondary)">exp 4</text>
		<text x="335" y="145" text-anchor="middle" font-size="11" fill="var(--mn-text-secondary)">… E experts</text>
		<line x1="242" y1="66" x2="298" y2="19" stroke="var(--mn-accent)" stroke-width="1.5" marker-end="url(#moearrow)"/>
		<line x1="242" y1="72" x2="298" y2="51" stroke="var(--mn-accent)" stroke-width="1.5" marker-end="url(#moearrow)"/>
		<line x1="242" y1="78" x2="298" y2="83" stroke="var(--mn-border)" stroke-width="1" stroke-dasharray="3 3"/>
		<line x1="242" y1="84" x2="298" y2="115" stroke="var(--mn-border)" stroke-width="1" stroke-dasharray="3 3"/>
		<text x="420" y="23" font-size="12" fill="var(--mn-text-secondary)">active</text>
		<text x="420" y="55" font-size="12" fill="var(--mn-text-secondary)">active</text>
		<text x="420" y="87" font-size="12" fill="var(--mn-text-secondary)">idle</text>
		<text x="420" y="119" font-size="12" fill="var(--mn-text-secondary)">idle</text>
	</svg>
	<figcaption class="md">A MoE layer. The router (a small linear layer) scores all $E$ experts and the token is computed only by the $k$ it selects — here two of four. The idle experts cost memory, not compute, for this token.</figcaption>
</figure>
</div>

<div class="md">
### Routing: a learned sparse switch

The router looks trivial — in the original it is a single linear projection to $E$ scores — but its *behavior* is the whole story. In the standard **top-$k$** form, the router computes a softmax over the $E$ experts, keeps the $k$ largest, and renormalizes those $k$ to sum to one; the token's output is the weighted sum of those $k$ experts' outputs. The router is trained *end-to-end* with the rest of the model, so it learns to send "this kind of token" to the experts that are good at it. In practice the experts specialize: some become good at grammar, some at code, some at numerals, and the router routes accordingly. The model can therefore afford to be *bad at most things* in any one expert, because each expert only ever sees the slice of tokens that gets routed to it.

A later refinement, used in \cite[DeepSeek-V3 (2024)]{deepseekv3tech2024}, replaces the softmax-over-all-experts with a **sigmoid** gate: each expert is scored independently (a "no-routing"/fine-grained variant), the top-$k$ are chosen, and the selection is *noised* during training (a small random perturbation on the scores) so the router does not settle into a brittle deterministic partition too early. The difference is subtle but it matters at scale: the sigmoid variant keeps every expert *reachable* for any token, which is exactly what you want when $E$ is in the hundreds. The deeper point is that routing is a **learned sparse switch**: the model is no longer one function but a family of them, and the router is the part that picks which family member to run — a decision that is itself learned, not designed.
</div>

<div class="md">
### Load balancing: why the experts would otherwise collapse

Here is the failure mode that a MoE must fight, and the reason a whole class of training machinery exists. A router left to itself **collapses**. Because routing a token to a single expert is "cheaper" in gradient terms than splitting it across several, an unbalanced router drifts until a few experts grab *almost all* the traffic and the rest starve. The model's effective capacity then silently shrinks back toward a dense model — you built $E$ experts and the router quietly uses two.

\cite[Fedus et al., Switch Transformers (2022)]{switchtransformers2022} made two changes that let MoE scale to a trillion parameters. First, **top-1 routing** — a single expert per token — which is simpler and faster than top-2 and is enough *if* the experts stay balanced. Second, the **load-balancing auxiliary loss**, which directly punishes the collapse. Let $f_i$ be the fraction of tokens that *select* expert $i$ as a top expert, and let $P_i$ be the mean router *probability* assigned to expert $i$. The loss is

<div>
$$ \mathcal{L}_{\text{aux}} = E \cdot \sum_{i=1}^{E} f_i \, P_i $$
</div>

and it is minimized when every expert is used evenly ($f_i = P_i = 1/E$). It is added to the task loss with a small weight $\alpha$:

<div>
$$ \mathcal{L}_{\text{total}} = \mathcal{L}_{\text{task}} + \alpha\, \mathcal{L}_{\text{aux}} $$
</div>

The two terms pull in opposite directions. The task loss wants to route each token to whatever expert answers it best (which drifts toward collapse); the aux loss wants to spread tokens evenly. The balance between them — set by $\alpha$ and by how large $E$ is — decides how specialized the experts end up. Too little aux loss and the model collapses; too much and it over-balances into "every expert does the same thing," and you have paid for $E$ experts to get a dense model back.

> The load-balancing loss is the reason a MoE does not secretly become a dense model. Without it, the router is a greedy allocator that hoards all traffic onto the two or three experts that got ahead first, and the extra capacity you paid for goes unused.
</div>

<div class="md">
### Shared experts: the part everyone needs, plus the part each token picks

A cleaner decomposition arrived with \cite[DeepSeek-V3 (2024)]{deepseekv3tech2024}, whose two MoE ideas are now the reference design. The first is a **shared expert**: one expert is *dense* — every token goes through it — while the remaining experts are *sparse* — routed as usual. The shared expert holds the knowledge that *every* token needs (syntax, general language form), and the routed experts hold the *specialized* knowledge (a domain, a rare pattern). It is a clean split: "what everyone shares" + "what this token picks." The second idea, **auxiliary-loss-free balancing**, replaces the fixed aux penalty with a *dynamic* router whose bias grows for under-used experts and shrinks for over-used ones, so the routing self-corrects during training rather than being tugged by a separate term — reported to give a stable run at 671 billion parameters with no irrecoverable loss spikes \cite[DeepSeek-V3 (2024)]{deepseekv3tech2024}.
</div>

<div class="md">
## Systems and economics

### Expert parallelism: where the experts live

If experts are the point, the engineering question is *where they sit*. In **expert parallelism** the $E$ experts are **sharded across devices**: each accelerator holds a different subset of experts, so a 671B model's weights spread over many chips. For a given token, the system routes to the devices that hold its $k$ experts, gathers their outputs, and scatters the next token — an **all-to-all** communication pattern in both directions. This is why MoE is famously cheap to *train* per active parameter but awkward to *serve*: the all-to-all is a synchronous, latency-sensitive step, and a request can only move on once every device holding one of its experts has answered. The training side of this is [Training Infrastructure](training_infrastructure.php); the serving side is [Inference vs Training](inference_vs_training.php). The conceptual point is that *routing* (which expert) and *parallelism* (which device) are separate decisions that compose — the router decides the logic, the parallelism decides the physics.
</div>

<div class="md">
### The payoff for the economics: total vs active

Two open models made MoE concrete, and their numbers make the point:

* **Mixtral 8x7B** (\cite[Jiang et al., 2024]{mixtral2024}) — eight 7B experts per layer, top-2. **47B total** parameters, only **13B active** per token.
* **DeepSeek-V3** (\cite[DeepSeek-V3 (2024)]{deepseekv3tech2024}) — **671B total**, **37B active** per token, with the shared-expert + dynamic-routing design above.

"Active" is the number that governs inference cost and per-step training time; "total" is the number that governs memory (you must *load* every expert, even the idle ones, because you do not know which one the next token will need). The gap between the two — 47B vs 13B, 671B vs 37B — is the MoE dividend: you pay storage for all of them and compute for a fraction.

This is exactly the knob the later chapters turn. The [economic layer](ai_economics) prices a model by its *active* parameters per token, and [Inference vs Training](inference_vs_training.php) shows why the serving cost follows the cache and the active compute, not the total weights. MoE is the cleanest example in this course of a **displaced prerequisite**: the "which part of the machine handles this" question was solved long ago, in the brain (different neurons fire for different inputs) and in the switchboard of a telephone exchange. The transformer did not invent sparsity; it finally made a *learned router* of it.
</div>

<div class="mn-quiz" data-quiz="mixture_of_experts"><script type="application/json">{"title": "Mixture of experts", "questions": [{"q": "In a mixture-of-experts layer, what decides which experts process a token?", "options": ["A learned router (gate) that picks the top-k experts", "Random choice", "The token's position", "The user"], "answer": 0, "explain": "Only the selected experts run, so compute per token stays small."}, {"q": "What is the difference between total and active parameters?", "options": ["Total is all weights in the model; active is what one token actually uses", "They are always equal", "Active parameters are the trainable ones", "Total parameters are only the experts"], "answer": 0, "explain": "Capacity scales with total parameters, cost per token with active ones."}, {"q": "Why is a load-balancing loss needed?", "options": ["Otherwise the router collapses onto a few favourite experts", "To make the model smaller", "To remove the router", "To shorten training"], "answer": 0, "explain": "Encouraging even usage keeps all experts trained and the hardware busy."}, {"q": "What are shared experts?", "options": ["Experts every token passes through, for common knowledge, alongside routed specialists", "Experts shared between two companies", "Copies of the same expert", "Experts that are never used"], "answer": 0, "explain": "They hold what everyone needs, so routed experts can specialise."}]}</script></div>
