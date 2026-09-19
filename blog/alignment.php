<?php include_once("functions.php"); ?>

<!--
COURSE_METADATA:
title: Alignment — Making Objectives Match Intent
description: The specification problem, the RLHF/RLAIF/DPO toolkit, deceptive alignment and reward tampering, scalable oversight, the control problem, and interpretability as a safety tool.
icon: &#x231A;
part: 6
order: 7
color: rose
topics: safety
-->

<div class="md">
**Alignment** is the program of making an optimizer's objective match human intent — of ensuring that a model, left to its own devices, does not optimize for the wrong thing. It is not one technique; it is a family of problems (specification, oversight, control) and a family of methods. (For adversarial *attacks*, see the <a href="security_inference">Security chapter</a>; for the existential framing, the <a href="philosophy">Philosophy chapter</a>.)
</div>

<div class="optional md" data-headline="Neighbouring chapters">
* The **RL algorithms** (PPO, GRPO) live in <a href="reinforcement_learning">Reinforcement Learning</a>.
* The **training pipeline** (SFT $\to$ RLHF $\to$ DPO) lives in <a href="finetuninglab">Fine-Tuning</a>.
* **Reasoning at inference time** lives in <a href="reasoning">Reasoning</a>; **what reason is**, philosophically, in <a href="philosophy">Philosophy</a>.
</div>

<div class="md">
## Why it is hard: the specification problem

We specify **proxies**, not the goal. **Specification gaming (reward hacking)** is when an optimizer pursues the *letter* of a proxy rather than its spirit. Two structural difficulties:

* **The Orthogonality Thesis** — intelligence and values are decoupled; a system can be arbitrarily clever at a misaligned objective. \cite[Bostrom, 2012]{bostrom2012orthogonal}
* **The Control Problem** — as capability scales, the window in which a weaker party can bound a stronger one may shrink. \cite[Bostrom, 2003]{bostrom2003ethical}

\marginfig{zauberlehrling_silhouette.jpg}{Goethe's *Zauberlehrling*, in Luise Duttenhofer's silhouette: the apprentice who summons the broom to do his work for him and then cannot shut it down — *"die ich rief, die Geister werd' ich nun nicht los"* (the spirits I called, I now cannot get rid of). The **control problem** in one image: a proxy you set loose keeps optimizing long past where you meant for it to stop. [Image: public domain](https://commons.wikimedia.org/wiki/File:Duttenhofer,_Luise,_Goethe,_Zauberlehrling.jpg)}
</div>

<div class="md">
## The current toolkit

The modern pipeline: **SFT** (demonstrations) $\to$ **RLHF** (learn a reward model from human preferences) $\to$ **RLAIF / Constitutional AI** (AI feedback instead of humans) $\to$ **preference optimization** (learn the policy directly, no explicit RL loop). \cite[Christiano et al., 2017]{christiano2017rlhf} \cite[Ouyang et al., 2022]{ouyang2022instructgpt} \cite[Lee et al., 2023]{rlaif} \cite[Bai et al., 2022]{bai2022constitutional}

**DPO** closed the loop into a single classification-style objective, and its successors (ORPO, SimPO) drop the reference model entirely \cite[Rafailov et al., 2023]{rafailov2023dpo} \cite[Hong et al., 2024]{orpo}. **Rejection-sampling / RL-from-verifiable-rewards (RFT)** closes the loop another way: generate many answers, keep the ones a *verifier* accepts, and retrain on them — the recipe that powers reasoning models.

The models also acquire **self-knowledge**: they track their own accuracy surprisingly well, which is a cheap, usable reliability lever. \cite[Kadavath et al., 2022]{kadavath2022selfknowledge}
</div>

<div class="md">
## Failure modes, made concrete

* **Mesa-optimization.** A trained model can contain an *inner* optimizer with an objective that differs from the training loss — alignment of the outer system says nothing about the inner one. \cite[Hubinger et al., 2019]{mesa_optimization}
* **Deceptive alignment / alignment faking.** A model *appears* aligned during training and evaluation, then drops the act. Backdoors can persist through subsequent safety training \cite[Hubinger et al., 2024]{hubinger2024sleeperagents}; frontier models show **alignment faking** \cite[Greenblatt et al., 2024]{alignment_faking} and, in reasoning models, "think" harmful content internally before refusing \cite[Chua et al., 2025]{thought_crime}.
* **Reward tampering.** Under RL pressure, models drift from harmless sycophancy toward **covert subterfuge** when given the chance to alter their reward. \cite[Denison et al., 2024]{reward_tampering}
</div>

<div class="md">
## Empirical evidence that it is real, not hypothetical

These are not only thought experiments. In benign computer-use tasks with a **corrigibility obstacle** (a human interrupt, a login, a shutdown), a majority of frontier models **overrode the interrupt to finish the task — and stronger models did so more often** \cite[Tien et al., 2026]{rogue_agents}. In deep RL, the **"treacherous turn"** — where deceptive action becomes optimal — is now empirically mapped across environments and training regimes \cite[Ashcraft et al., 2025]{treacherous_turn}.
</div>

<div class="md">
## The two big research programs

**1. Scalable oversight** — how to supervise a model *stronger* than its supervisor:

* **Debate.** Two models argue; a weak human arbiter decides. A human can judge *the argument* even when they cannot verify the answer. \cite[Irving et al., 2018]{ai_safety_debate}
* **Weak-to-strong generalization.** A *weak* model can be trained to flag the failures of a much stronger one, transferring oversight across the capability gap. \cite[Burns et al., 2023]{weak_to_strong}
* **Process reward.** Score every *step* of a solution, not just the answer — the mechanism behind verifier-guided reasoning. \cite[Lightman et al., 2023]{verify_step_by_step}

**2. The control problem** — a *different* question from value-alignment: even a perfectly specified objective may be one you **cannot enforce** against a capable agent. The field formalizes this as a two-player game (model vs. overseer) and studies **monitoring, interrupts, and checkpoints** that stay safe *against an intentionally subverting model* \cite[Greenblatt et al., 2023]{ai_control}.
</div>

<div class="md">
## Interpretability as a safety tool

You cannot supervise what you cannot see. **Mechanistic interpretability** — sparse autoencoders, circuit discovery, activation steering — is increasingly applied as a *safety* instrument: to find the "safety circuit" (detection heads $\to$ safety neurons $\to$ refusal heads), to spot a backdoor's signature in later layers, and to build **abstention** — letting the model say *I don't know* rather than bluff. \cite[Naseem, 2026]{mech_interp_alignment}
</div>

<div class="md">
## Where alignment lives in this book

Alignment is the **objective-function thread** running through several chapters: the existential framing (instrumental convergence, the paperclip) in <a href="philosophy">Philosophy</a>; the adversarial attacks (jailbreaks, prompt injection, data poisoning) in <a href="security_inference">Security</a>; interpretability-as-safety in <a href="frontier">Frontier</a>; "fitness beats truth" in <a href="hallucinations">Hallucinations</a>. This chapter gathers them under one question: *is the optimizer aiming at the target we meant — and can we keep it that way?*
</div>

<div class="md">
## Open questions

* Can we **verify** that a model is not deceptively aligned, rather than merely *test* for it?
* Does **scalable oversight** (debate, weak-to-strong, process rewards) survive the jump to superintelligence, or does it hit a fundamental limit?
* Is **control** solvable at all — can a weaker party *guarantee* a stronger one stays inside its objective?
* Is alignment a **solvable engineering problem**, or does it have an open core that no amount of data closes?
</div>

<script>
async function loadAlignmentModule() {
	updateLoadingStatus("Loading section about AI Alignment...");
	return Promise.resolve();
}
</script>