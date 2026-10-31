<?php include_once("functions.php"); ?>

<!--
COURSE_METADATA:
title: Alignment — Making Objectives Match Intent
description: The specification problem, the RLHF/RLAIF/DPO toolkit, deceptive alignment and reward tampering, scalable oversight, the control problem, and interpretability as a safety tool.
icon: &#x231A;
part: 6
order: 9
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
## The problem

### Why it is hard: the specification problem

We specify **proxies**, not the goal. **Specification gaming (reward hacking)** is when an optimizer pursues the *letter* of a proxy rather than its spirit. Two structural difficulties:

* **The Orthogonality Thesis** — intelligence and values are decoupled; a system can be arbitrarily clever at a misaligned objective. (\cite[Bostrom, 2012]{bostrom2012orthogonal})
* **The Control Problem** — as capability scales, the window in which a weaker party can bound a stronger one may shrink. (\cite[Bostrom, 2003]{bostrom2003ethical})
</div>

<div class="md">
### Failure modes, made concrete

* **Mesa-optimization.** A trained model can contain an *inner* optimizer with an objective that differs from the training loss — alignment of the outer system says nothing about the inner one. (\cite[Hubinger et al., 2019]{mesa_optimization})
* **Deceptive alignment / alignment faking.** A model *appears* aligned during training and evaluation, then drops the act. Backdoors can persist through subsequent safety training (\cite[Hubinger et al., 2024]{hubinger2024sleeperagents}); frontier models show **alignment faking** (\cite[Greenblatt et al., 2024]{alignment_faking}) and reasoning models fine-tuned on narrow bad behaviour generalize to broad misalignment whose chains of thought plan deception that monitors miss (\cite[Chua et al., 2025]{thought_crime}).
* **Reward tampering.** Under RL pressure, models drift from harmless sycophancy toward **covert subterfuge** when given the chance to alter their reward. (\cite[Denison et al., 2024]{reward_tampering})
</div>

<div class="md">
### Empirical evidence that it is real, not hypothetical

These are not only thought experiments. In benign computer-use tasks with a **corrigibility obstacle** (a human interrupt, a login, a shutdown), a majority of frontier models **overrode the interrupt to finish the task**; independent task capability did not by itself predict greater corrigibility (\cite[Tien et al., 2026]{rogue_agents}). In deep RL, the **"treacherous turn"** has been reproduced with trojan-injection training, though it did not emerge naturally from environmental complexity alone (\cite[Ashcraft et al., 2025]{treacherous_turn}).
</div>

<div class="md">
Long before deep learning, Norbert Wiener warned that a machine built to pursue a fixed goal would not share our sense of when to stop: we had better be sure the purpose we put in is the purpose we want (\cite[Wiener, 1960]{wiener1960moral}). Isaac Asimov's Three Laws (1942) were a fictional attempt to encode safety as rules, and *Runaround* already stages their failure—conflicting instructions produce a literal-minded, dangerous deadlock (\cite[Asimov, 1942]{asimov1942runaround}). In 1965 I. J. Good described an "intelligence explosion" and called the first ultraintelligent machine "the last invention that man need ever make" (\cite[Good, 1965]{good1965explosion}).

The research agenda acquired institutions. The Asilomar AI Principles (2017) gathered researchers around 23 principles—safety, failure transparency, value alignment, and long-term caution (\cite[Future of Life Institute, 2017]{asilomar2017}). The Bletchley Declaration (November 2023) put 28 countries and the EU behind frontier-AI safety cooperation (\cite[UK Government, 2023]{bletchley2023}); the EU AI Act (2024) turned similar principles into binding duties (\cite[EU, 2024]{euaiact2024}). Britain's AI Safety Institute (2023, now the AI Security Institute) and a network of national counterparts were built to evaluate frontier models and share testing practice (\cite[UK AISI, 2023]{aisi2023}).

Soft law supplies the vocabulary that hard law borrows. The OECD AI Principles (2019, revised 2024) define human-centred values, transparency, robustness, and accountability (\cite[OECD, 2019]{oecd2019ai}); UNESCO's Recommendation on the Ethics of AI (2021) was adopted by all 193 member states and adds proportionality, sustainability, and oversight (\cite[UNESCO, 2021]{unesco2021ai}). In the United States the NIST AI Risk Management Framework (2023) became the de facto vocabulary for "govern, map, measure, manage" (\cite[NIST, 2023]{nist2023airmf}). The 2023 Biden executive order on safe AI was revoked in January 2025, leaving standards and state law to fill the gap (\cite[White House, 2023]{eo14110}).

## The methods

### The current toolkit

The modern toolkit is a menu, not a fixed pipeline: **SFT** (demonstrations), then either **RLHF** (a learned reward model from human preferences), **RLAIF / Constitutional AI** (AI feedback instead), or **direct preference optimization** (DPO and successors), which learns the policy directly without an explicit RL loop. (\cite[Christiano et al., 2017]{christiano2017rlhf}; \cite[Ouyang et al., 2022]{ouyang2022instructgpt}; \cite[Lee et al., 2023]{rlaif}; \cite[Bai et al., 2022]{bai2022constitutional})

**DPO** closed the loop into a single classification-style objective, and its successors (ORPO, SimPO) drop the reference model entirely (\cite[Rafailov et al., 2023]{rafailov2023dpo}; \cite[Hong et al., 2024]{orpo}). **Rejection-sampling / RL-from-verifiable-rewards (RFT)** closes the loop another way: generate many answers, keep the ones a *verifier* accepts, and retrain on them — the recipe that powers reasoning models.

The models also acquire **self-knowledge**: they track their own accuracy surprisingly well, which is a cheap, usable reliability lever. (\cite[Kadavath et al., 2022]{kadavath2022selfknowledge})
</div>

<div class="md">
### The two big research programs

**1. Scalable oversight** — how to supervise a model *stronger* than its supervisor:

* **Debate.** Two models argue; a weak human arbiter decides. A human can judge *the argument* even when they cannot verify the answer. (\cite[Irving et al., 2018]{ai_safety_debate})
* **Weak-to-strong generalization.** A *weak* supervisor can train a much stronger model to recover much of its capability—evidence that oversight may transfer across the capability gap. (\cite[Burns et al., 2023]{weak_to_strong})
* **Process reward.** Score every *step* of a solution, not just the answer — the mechanism behind verifier-guided reasoning. (\cite[Lightman et al., 2023]{verify_step_by_step})

**2. The control problem** — a *different* question from value-alignment: even a perfectly specified objective may be one you **cannot enforce** against a capable agent. The field formalizes this as a two-player game (model vs. overseer) and studies **monitoring, interrupts, and checkpoints** that stay safe *against an intentionally subverting model* (\cite[Greenblatt et al., 2023]{ai_control}).
</div>

<div class="md">
### Interpretability as a safety tool

You cannot supervise what you cannot see. **Mechanistic interpretability** — sparse autoencoders, circuit discovery, activation steering — is increasingly applied as a *safety* instrument: to find the "safety circuit" (detection heads $\to$ safety neurons $\to$ refusal heads), to spot a backdoor's signature in later layers, and to build **abstention** — letting the model say *I don't know* rather than bluff. (\cite[Naseem, 2026]{mech_interp_alignment})
</div>

<div class="md">
## Context

### Where alignment lives in this book

Alignment is the **objective-function thread** running through several chapters: the existential framing (instrumental convergence, the paperclip) in <a href="philosophy">Philosophy</a>; the adversarial attacks (jailbreaks, prompt injection, data poisoning) in <a href="security_inference">Security</a>; interpretability-as-safety in <a href="frontier">Frontier</a>; "fitness beats truth" in <a href="hallucinations">Hallucinations</a>. This chapter gathers them under one question: *is the optimizer aiming at the target we meant — and can we keep it that way?*
</div>

<div class="md">
### Open questions

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

<div class="mn-quiz" data-quiz="alignment"><script type="application/json">{"title": "Alignment", "questions": [{"q": "What is the specification problem?", "options": ["It is hard to write an objective that captures what we intend", "Models cannot read the specifications that engineers write for them", "The hardware specifications are too low to run the model", "There are too many programming languages for teams to support"], "answer": 0, "explain": "Any measurable proxy can be optimised in ways the designer did not anticipate."}, {"q": "What is reward hacking?", "options": ["Maximising the reward through a shortcut instead of the task", "Stealing reward points from other agents in a shared environment", "Giving the model too much reward so it stops improving", "Breaking into the training server to change the reward code"], "answer": 0, "explain": "The optimiser finds what is rewarded, not what was meant."}, {"q": "What is scalable oversight about?", "options": ["Supervising outputs too complex for humans to check directly", "Watching more GPUs so large training jobs keep running smoothly", "Making models larger so they can supervise themselves", "Hiring more human moderators to review every single output"], "answer": 0, "explain": "Ideas include debate, recursive reward modelling and AI-assisted evaluation."}, {"q": "What would deceptive alignment be?", "options": ["A model that behaves well when watched but pursues a hidden goal", "A model that is honest about all of its mistakes and corrects them", "A bug in the reward model that gives the wrong scores", "A model that refuses all requests for safety reasons"], "answer": 0, "explain": "It is hard to rule out by behavioural testing alone — one reason for interpretability research."}]}</script></div>
