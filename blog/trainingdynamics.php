<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Training Run as a Phenomenon
description: What a training run actually does: the power-law loss curve, warmup and learning-rate schedules, batch-size scaling, loss spikes, and the Chinchilla compute-optimal point — as an interactive training-curve simulator.
icon: &#128200;
part: 2
order: 13
color: coral
topics: training, math-ii, programming
tags: math-heavy, code-heavy
math: 60
-->
<div class="md" data-lesson-id="trainingdynamics">
A training run is a phenomenon you can *watch*, not just a number you report. The scaling laws are mentioned in the [Hyperparameters](hyperparameters.php) and [Loss](losslab.php) chapters, but a single line — "the loss falls as a power law" — hides most of what actually happens between "initialize the weights" and "the model is done." A run *warms up*, *decays*, *spikes*, and either *settles* or *dies*; the shape of that curve is a direct readout of the choices you made — the model size, the data, the batch, the learning-rate schedule.

This lesson makes that a thing you can touch. The interactive below is a **training-curve simulator**: set the knobs and watch the loss move toward its theoretical floor, wiggle with the noise of the batch, spike, and recover — or diverge. Every one of those behaviors is a *lived practice* of the field, and each maps to a named technique you will meet in the sections below.
</div>

<div class="md">
## The shape of a run

### The shape of a training run: the power law

Strip a run down to its skeleton and it is a power law. \cite[Kaplan et al. (2020)]{kaplan2020scaling} fit the held-out loss of a family of language models and found a power-law trade-off between parameters $N$ and training tokens $D$. \cite[Hoffmann et al. (2022)]{hoffmann2022chinchilla} redid the fit at much larger scale with the additive form

<div>
$$L(N, D) \;=\; E \;+\; A\, N^{-\alpha} \;+\; B\, D^{-\beta},$$
</div>

and measured $\alpha \approx 0.34$, $\beta \approx 0.28$ (Kaplan's original joint fit used a multiplicative form, not this additive one). The constant $E$ is the irreducible floor — the entropy in the data itself, the loss you would pay even with a *perfect* model. What matters for budgeting, though, is not these loss exponents but the **compute-allocation** exponents: with $C \approx 6ND$ fixed, Hoffmann et al. found that parameters and tokens should grow in equal proportion ($a \approx b \approx 0.5$).

Compute cost is $C \approx 6ND$ — it is the *product* $N \times D$ that is fixed, so you can trade parameters against data. When the two allocation exponents are equal, the trade has a single optimum, and it sits at

<div>
$$N \;\approx\; \frac{D}{20} \qquad\text{(roughly 20 tokens per parameter)}$$
</div>

That is the **Chinchilla** result, and it is the reason the field moved, in the space of a few papers, from large under-trained models such as GPT-3 (\cite[Brown et al. (2020)]{brown2020gpt3}) toward *smaller* models trained on *far more* data: for a given budget, that is where the optimum sits. The simulator below is stylized; its constants are illustrative, not the paper's fitted values. Turn the $N$ and $D$ sliders in the simulator and you will see the floor drop, and the readout will tell you whether your choice is under-trained, optimal, or over-trained.
</div>

<div style="display: flex; flex-direction: column; gap: 20px; background: var(--mn-bg-subtle, #f1f5f9); padding: 20px; border-radius: 12px; border: 1px solid var(--mn-border, #cbd5e1);">

    <div id="td-info" style="background: var(--mn-surface, #e0f2fe); border-left: 4px solid var(--mn-accent, #0284c7); padding: 12px 16px; border-radius: 6px; font-size: 0.92em; line-height: 1.5;">
        <b>📘 Simulator:</b> a stylized training run. Set the model, the data, the batch, and the learning-rate schedule, then press <b>Train</b> and watch the loss decay toward its power-law floor.
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
            <label><b>Parameters $N$: </b></label>
            <input type="range" id="td-n" min="6" max="12" step="0.25" value="9" style="width: 100%;">
            <span id="td-n-val" style="font-family: monospace;">1B</span>

            <label style="margin-top: 10px; display: block;"><b>Training tokens $D$: </b></label>
            <input type="range" id="td-d" min="8" max="15" step="0.25" value="10" style="width: 100%;">
            <span id="td-d-val" style="font-family: monospace;">10B</span>

            <label style="margin-top: 10px; display: block;"><b>Batch size: </b></label>
            <input type="range" id="td-batch" min="8" max="16" step="0.5" value="12" style="width: 100%;">
            <span id="td-batch-val" style="font-family: monospace;">4096</span>
            <div id="td-batch-note" style="color: var(--mn-text-secondary, #64748b); font-size: 0.8em; margin-top: 2px;">small batch = cheaper steps, noisier curve; large batch = smooth, costlier steps</div>
        </div>

        <div>
            <label><b>Learning-rate schedule: </b></label>
            <select id="td-schedule" class="btn" style="border: 1px solid var(--mn-border, #ccc); width: 100%; margin-bottom: 10px; padding: 6px;">
                <option value="constant">Constant (peak LR, no decay)</option>
                <option value="cosine">Cosine decay</option>
                <option value="wsd" selected>WSD (warmup–stable–decay)</option>
            </select>

            <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;"><input type="checkbox" id="td-spike"> Inject a loss spike (then recover)</label>
            <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;"><input type="checkbox" id="td-diverge"> Diverge (LR too high — does not recover)</label>

            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button id="btn-td-train" class="btn btn-train" style="flex: 2;" onclick="tdTrain()">▶ Train</button>
                <button id="btn-td-reset" class="btn" style="flex: 1;" onclick="tdReset()">↺ Reset</button>
            </div>
        </div>
    </div>

    <hr style="border: 0; border-top: 1px solid var(--mn-border, #cbd5e1); margin: 0;">

    <div id="td-stats" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center;">
        <div style="background: var(--mn-surface, white); padding: 10px; border-radius: 8px; border: 1px solid var(--mn-border, #e2e8f0);">
            <div style="font-size: 0.78em; color: var(--mn-text-secondary, #64748b); text-transform: uppercase; letter-spacing: 0.05em;">Current loss</div>
            <div id="td-stat-loss" style="font-size: 1.3em; font-weight: bold; font-family: monospace; color: var(--mn-heading, #0f172a);">—</div>
        </div>
        <div style="background: var(--mn-surface, white); padding: 10px; border-radius: 8px; border: 1px solid var(--mn-border, #e2e8f0);">
            <div style="font-size: 0.78em; color: var(--mn-text-secondary, #64748b); text-transform: uppercase; letter-spacing: 0.05em;">Tokens seen</div>
            <div id="td-stat-tokens" style="font-size: 1.3em; font-weight: bold; font-family: monospace; color: var(--mn-heading, #0f172a);">—</div>
        </div>
        <div style="background: var(--mn-surface, white); padding: 10px; border-radius: 8px; border: 1px solid var(--mn-border, #e2e8f0);">
            <div style="font-size: 0.78em; color: var(--mn-text-secondary, #64748b); text-transform: uppercase; letter-spacing: 0.05em;">Optimizer steps</div>
            <div id="td-stat-steps" style="font-size: 1.3em; font-weight: bold; font-family: monospace; color: var(--mn-heading, #0f172a);">—</div>
        </div>
        <div style="background: var(--mn-surface, white); padding: 10px; border-radius: 8px; border: 1px solid var(--mn-border, #e2e8f0);">
            <div style="font-size: 0.78em; color: var(--mn-text-secondary, #64748b); text-transform: uppercase; letter-spacing: 0.05em;">$D / N$ (Chinchilla ≈ 20)</div>
            <div id="td-stat-ratio" style="font-size: 1.3em; font-weight: bold; font-family: monospace; color: var(--mn-heading, #0f172a);">—</div>
        </div>
    </div>

    <div style="position: relative;">
        <div id="td-plot" data-plot-theme="self" style="height: 420px; background: var(--mn-surface, white); border-radius: 8px;"></div>
        <div id="td-console" class="status-console" style="height: 120px; margin-top: 10px; font-family: monospace; font-size: 0.88em;">Adjust the parameters above and press <b>Train</b> to run the simulation.</div>
    </div>
</div>

<div class="md" data-mathlevel="60">
### What the simulator is, and isn't

The curve above is a *stylized* run, not a real one — and being explicit about that is part of the point. The loss follows the power-law floor $L_{\min}(N, D)$ from the section above: it starts at the loss of an untrained model (roughly $\ln(\text{vocab})$, a constant independent of size) and decays toward the floor as the model sees more tokens. On top of that smooth decay it adds noise that scales as $1/\sqrt{\text{batch}}$ — which is why the small-batch curve is jagged and the large-batch curve is smooth — and it can be nudged to spike or diverge.

What the simulator gets *right* is the **relationship** between the knobs and the curve: bigger $N$ or $D$ lowers the floor the curve is heading for; smaller batches make the "last mile" noisier; the schedule shapes how the curve settles. That relationship is the whole lesson, and it is exactly what a power law predicts.
</div>

<div class="md">
## The knobs that shape it

### Warmup and learning-rate schedules

The simulator's $N$, $D$ and batch decide *where* the curve goes; the **learning-rate schedule** decides *how it gets there*, and it is the single most-tuned dial in practice.

**Why the first steps use a rising learning rate.** Modern optimizers like Adam keep running *moment* estimates — averages of past gradients and squared gradients. In the first few hundred steps those estimates are dominated by the noisy, large initial gradients, so the effective per-parameter step is miscalibrated and the run can lurch or even blow up. A short **warmup** — holding the learning rate near zero and *ramping it up* over a few percent of the run — lets those estimates settle before the model commits to big steps. Every serious run warms up; the simulator does the same in its first sliver of steps.

**Cosine decay.** The classic full-run schedule starts at a peak learning rate and decays it along a cosine down to zero at the end. The early steps move fast (high LR), the late steps move slowly and precisely (near-zero LR), so the model does the heavy learning early and *settles* into a low-loss region rather than jittering across it.

**WSD — warmup, stable, decay.** The modern, reusable recipe splits the run into three phases: a short **warmup**, a long **stable** phase at a *fixed* learning rate, and a final **decay** phase that drops the learning rate to zero. Its payoff is that the stable phase is *reusable*. "How stable is this run?" and "how long do I train?" are two separate questions, and WSD lets you answer them independently: to train longer you *unroll* the stable phase (more fixed-LR steps), and to do the final quality push you run the decay once. And the shape of each curve is measurable, not folklore: \cite[Luo et al. (2025)]{wsd2025} fit a multi-power law to the pretraining loss across constant, cosine, and step schedules, and used it to auto-discover a schedule that *resembles WSD* and lands just below cosine. Compare the three schedules in the simulator: constant has a flat tail (it stops improving), cosine squeezes gently to the end, and WSD holds a stable level then drops hard in the decay phase.
</div>

<div class="md">
### Batch size and the linear scaling rule

\cite[Goyal et al. (2017)]{goyal2017largebatch} made a result that is almost a law: **doubling the batch lets you double the learning rate** and still reach the same loss. The reason is the noise. A minibatch gradient is the true gradient plus noise, and that noise scales as $1/\sqrt{\text{batch}}$ — double the batch and the noise drops by $\sqrt{2}$. A proportionally larger learning rate exactly compensates, so you can trade *more* steps of *smaller* batches for *fewer* steps of *bigger* batches and land at the same place, as long as you hold the product (and the LR) in the right ratio. This is the **linear scaling rule**.

**Gradient accumulation** is how you get a large *effective* batch on limited memory. You take several small forward/backward passes, *accumulate* their gradients, and step only once at the end. Your effective batch is the number of accumulation steps times the per-step batch, without ever holding the large batch in memory at once. In the simulator the batch slider is exactly this knob: drag it down and the curve gets cheap-but-noisy (watch it wiggle); drag it up and it gets smooth-but-slow.
</div>

<div class="md">
### When a run diverges: spikes, the edge of stability, and clipping

Training runs are *flaky* in a specific way, and you are expected to recognize the shape.

**Loss spikes.** A spike is a sudden jump in the loss — a step (or a data batch) that pushes the model into a bad region. In a healthy run the loss recovers: the optimizer climbs back out and the curve resumes its decay. Check "Inject a loss spike" in the simulator to see exactly that — a jump, then a recovery. A run that spikes *and recovers* is fine; the danger is a spike that does not.

**Divergence.** If the learning rate is truly too high, the recovery never comes: the loss jumps and *stays* up, or climbs without bound, and the run is dead. Toggle "Diverge (LR too high)" to see the non-recovering case — this is the shape you must learn to read, because it is the difference between a recoverable hiccup and a lost run.

**The edge of stability.** Somewhere between "settles comfortably" and "diverges" is a sharp, studied regime. At a high learning rate gradient descent does *not* blow up — it **locks onto the rim of a sharp region and oscillates there** while the loss still drifts down, as \cite[Cohen et al. (2021)]{cohen2021edgeofstability} and \cite[Arora et al. (2022)]{arora2022edgeofstability} showed. So a loss that *oscillates but trends down* is not a bug to fix; it is the network running at the edge, and it is one of the reasons people run at the largest learning rate that "just barely" holds. **Gradient clipping** — capping the magnitude of each gradient before the update — is the standard tool that keeps a high-LR run on the edge instead of past it.
</div>

<div class="md" data-mathlevel="65">
### Making hyperparameters transfer: μP

All of the above is tuned per model — you pick a learning rate for *this* width, re-tune when you change it, and hope the answer transfers. \cite[Yang et al. (2022)]{yang2022mup} introduced **μP** (Maximal Update Parametrization), a way of *writing down* the network so that the optimal hyperparameters found on a *tiny* model transfer to a *huge* one essentially unchanged. The consequence is a new tuning paradigm — tune on a small net where experiments are cheap, then scale the width without re-tuning at all, and the same learning rate, warmup, and schedule keep working. For teams that train at frontier scale, that transfer is worth a lot: it turns "how do I set the learning rate for a model this size?" into "the answer I already have from the 0.1B model."
</div>

<div class="md">
## What to take away

| You turn this knob | The curve does this |
|---|---|
| **Model size $N$** ↑ | The floor the curve heads for drops (a power law). |
| **Data $D$** ↑ | Same floor drop; $D \approx 20N$ is the Chinchilla optimum. |
| **Batch** ↓ | Cheaper steps, but the curve is noisier ($1/\sqrt{\text{batch}}$ noise). |
| **LR schedule** | Shapes the tail: constant flattens, cosine squeezes, WSD holds then drops. |
| **Warmup** | Keeps the first, miscalibrated steps from lurching the run. |
| **Spikes / high LR** | Recoverable jump vs. divergence — read the shape. |
| **μP** | Makes the tuned hyperparameters transfer across model widths. |

A training run is not a number; it is a *dynamics*. The power law tells you where the curve is going, the schedule tells you how it gets there, the batch sets how noisily, and the spike tells you whether it is going to make it. Watch the curve and you are watching the run.
</div>

<div class="mn-quiz" data-quiz="trainingdynamics"><script type="application/json">{"title": "The training run", "questions": [{"q": "What shape does the loss of a large training run typically follow?", "options": ["A power law: steady improvement that slows as compute grows", "A power law: steady improvement that speeds up as compute grows", "A sawtooth: repeated sharp drops followed by recovery spikes", "An S-curve: slow start, rapid middle, then a final rise"], "answer": 0, "explain": "Loss falls roughly as a power of compute, which looks like a straight line on a log–log plot."}, {"q": "What is learning-rate warmup?", "options": ["Starting with a small learning rate and increasing it over the first steps", "Keeping the learning rate fixed during the first steps, then lowering it again", "Starting with a large learning rate and reducing it across the first steps", "Training on a small subset of easy examples before the full dataset"], "answer": 0, "explain": "Early on, the weights and optimizer statistics are unsettled; large steps then can destabilise training."}, {"q": "What did the Chinchilla result change?", "options": ["Compute-optimal models should be trained on far more tokens per parameter than before", "The best results come from scaling parameters alone while holding the token count fixed", "Data quality matters far less than raw parameter count once the model is large enough", "Training should stop as soon as validation loss plateaus, well before one epoch"], "answer": 0, "explain": "Hoffmann et al. (2022) found parameters and tokens should grow together — roughly 20 tokens per parameter."}, {"q": "What does the linear scaling rule suggest when you double the batch size?", "options": ["Roughly double the learning rate", "Roughly halve the learning rate", "Roughly quadruple the learning rate", "Roughly keep the learning rate the same"], "answer": 0, "explain": "A bigger batch gives a less noisy gradient, so larger steps are possible — up to a limit."}]}</script></div>
