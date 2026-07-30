<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Reinforcement Learning
description: From Q-learning to PPO to GRPO — the foundations of RL that power modern LLM alignment.
icon: &#127918;
part: 2
order: 14
color: coral
-->

<div class="md">
Reinforcement Learning (RL) is the third pillar of machine learning, alongside supervised and unsupervised learning. In RL, an **agent** takes **actions** in an **environment** to maximize a cumulative **reward** signal. It is the foundation of modern LLM alignment: RLHF, DPO, GRPO, and the o1/R1 paradigm all build on it.

This chapter covers the mathematical core: Markov Decision Processes, value functions, policy gradients, and how modern preference optimization emerged.
</div>

<div class="md">
## The Markov Decision Process

An MDP is the formal setting for RL: $(\mathcal{S}, \mathcal{A}, P, R, \gamma)$ where

* $\mathcal{S}$: state space
* $\mathcal{A}$: action space
* $P(s' \mid s, a)$: transition probability
* $R(s, a)$: reward function
* $\gamma \in [0, 1)$: discount factor

The agent follows a **policy** $\pi(a \mid s)$: a probability distribution over actions given a state. The goal is to find $\pi^*$ that maximizes expected discounted return:

$$
\pi^* = \arg\max_\pi \mathbb{E}_\pi\!\left[\sum_{t=0}^{\infty} \gamma^t R(s_t, a_t)\right]
$$
</div>

<div class="md">
## Value Functions

The **state-value function** measures how good a state is under policy $\pi$:

$$
V^\pi(s) = \mathbb{E}_\pi\!\left[\sum_{t=0}^{\infty} \gamma^t R(s_t, a_t) \,\Big|\, s_0 = s\right]
$$

The **action-value (Q) function** measures how good taking action $a$ in state $s$ is:

$$
Q^\pi(s, a) = \mathbb{E}_\pi\!\left[\sum_{t=0}^{\infty} \gamma^t R(s_t, a_t) \,\Big|\, s_0 = s,\, a_0 = a\right]
$$

They satisfy the **Bellman equation**:

$$
V^\pi(s) = \mathbb{E}_{a \sim \pi(\cdot \mid s)}\!\left[R(s, a) + \gamma \sum_{s'} P(s' \mid s, a)\, V^\pi(s')\right]
$$

The **Bellman optimality equation** characterizes the optimal policy:

$$
V^*(s) = \max_a \left[R(s, a) + \gamma \sum_{s'} P(s' \mid s, a)\, V^*(s')\right]
$$

For an LLM, the "state" is the current context window, the "action" is the next token, and the "reward" comes from a reward model (RLHF) or verifier (reasoning training).
</div>

<div id="mdp-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## Tabular RL: Q-Learning (Watkins, 1989)

In the tabular case (small finite state-action space), Q-learning converges to $Q^*$ by iterative updates:

$$
Q(s, a) \leftarrow Q(s, a) + \alpha \left[r + \gamma \max_{a'} Q(s', a') - Q(s, a)\right]
$$

where $\alpha$ is the learning rate and $r + \gamma \max_{a'} Q(s', a')$ is the **TD target**. The agent samples actions by $\epsilon$-greedy: with probability $\epsilon$ take a random action (exploration), otherwise $\arg\max_a Q(s, a)$ (exploitation).

Deep Q-Networks (DQN, Mnih et al., 2013) replaced the table with a neural network $Q_\theta(s, a)$ and added **experience replay** + a **target network** to stabilize training. This enabled RL on high-dimensional inputs (Atari).
</div>

<div class="md">
## Policy Gradients

For continuous or large action spaces, parameterize the policy as $\pi_\theta(a \mid s)$ and directly optimize:

$$
J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}\!\left[\sum_{t=0}^{T} \gamma^t R(s_t, a_t)\right]
$$

The **policy gradient theorem** (Sutton et al., 2000):

$$
\nabla_\theta J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}\!\left[\sum_{t=0}^{T} \nabla_\theta \log \pi_\theta(a_t \mid s_t) \cdot \hat A_t\right]
$$

where $\hat A_t = \sum_{t' \geq t} \gamma^{t'-t} R(s_{t'}, a_{t'}) - b(s_t)$ is the **advantage**: how much better this action was than the baseline $b(s_t)$.

### REINFORCE (Williams, 1992)

The simplest algorithm: sample a trajectory $\tau$, compute returns $G_t = \sum_{t' \geq t} \gamma^{t'-t} r_{t'}$, then update:

$$
\theta \leftarrow \theta + \alpha \sum_t G_t \nabla_\theta \log \pi_\theta(a_t \mid s_t)
$$

REINFORCE has high variance. The **baseline trick** (subtracting $b(s_t)$, often $V^\pi(s_t)$) reduces variance without bias.
</div>

<div class="md">
## Actor-Critic Methods

**Actor-critic** algorithms learn both a policy (actor) and a value function (critic):

* Actor update: $\theta \leftarrow \theta + \alpha_\theta \cdot \hat A_t \nabla_\theta \log \pi_\theta(a_t \mid s_t)$
* Critic update: $\phi \leftarrow \phi + \alpha_\phi (G_t - V_\phi(s_t)) \nabla_\phi V_\phi(s_t)$

The critic's TD-error $G_t - V_\phi(s_t)$ is a low-variance estimate of the advantage.

### A2C / A3C (Mnih et al., 2016)

**Asynchronous** Advantage Actor-Critic: parallel workers update a shared model asynchronously. Stabilizes training; superseded by synchronous methods.

### PPO (Schulman et al., 2017)

**Proximal Policy Optimization** is the workhorse of modern RL. It constrains how far the policy can move per update using a **clipped surrogate objective**:

$$
L^{\text{CLIP}}(\theta) = \mathbb{E}_t\!\left[\min\!\left(r_t(\theta)\, \hat A_t,\; \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon)\, \hat A_t\right)\right]
$$

where $r_t(\theta) = \pi_\theta(a_t \mid s_t) / \pi_{\theta_{\text{old}}}(a_t \mid s_t)$ is the probability ratio. The clip prevents destructively large updates.

PPO is simple, stable, and the default choice for RLHF and many robotics tasks.
</div>

<div id="ppo-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## RLHF: Reinforcement Learning from Human Feedback

RLHF (Christiano et al., 2017; Ouyang et al., InstructGPT, 2022) adapts RL to align LLMs with human preferences:

1. **Collect comparison data**: humans rank multiple model outputs for the same prompt.
2. **Train a reward model** $R_\phi(x, y)$ that predicts the human's preference score.
3. **Fine-tune the LLM** with PPO, using $R_\phi$ as the reward signal.

The full PPO loss combines three terms:

$$
L^{\text{RLHF}}(\theta) = -\mathbb{E}_{(x, y) \sim \pi_\theta}\!\Big[\,R_\phi(x, y)\,\Big] + \beta\, \text{KL}\!\big(\pi_\theta \,\|\, \pi_{\text{ref}}\big)
$$

The **KL penalty** prevents the policy from drifting too far from the reference (SFT) model — a critical stabilizer.

The reward model is trained on Bradley-Terry comparisons:

$$
P(y_w \succ y_l \mid x) = \frac{\exp(R(x, y_w))}{\exp(R(x, y_w)) + \exp(R(x, y_l))}
$$

where $y_w$ is the "winner" and $y_l$ the "loser".
</div>

<div class="md">
## DPO: Direct Preference Optimization

Rafailov et al. (2023) showed that the RLHF objective has a **closed-form solution**:

$$
\pi^*(y \mid x) \propto \pi_{\text{ref}}(y \mid x) \exp\!\left(\frac{1}{\beta} R(x, y)\right)
$$

Inverting gives the implicit reward:

$$
R(x, y) = \beta \log \frac{\pi^*(y \mid x)}{\pi_{\text{ref}}(y \mid x)} + \beta \log Z(x)
$$

Substituting into the Bradley-Terry loss:

$$
L_{\text{DPO}}(\theta) = -\mathbb{E}_{(x, y_w, y_l)}\!\left[\log \sigma\!\left(\beta \log \frac{\pi_\theta(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi_\theta(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)}\right)\right]
$$

**No reward model, no PPO, no rollouts**. Just a supervised loss on (prompt, winner, loser) triples. DPO matches RLHF on alignment benchmarks with much simpler infrastructure.

Variants have proliferated:

* **IPO** (Azar et al., 2023): robust to deterministic preferences.
* **KTO** (Ethayarajh et al., 2024): uses binary good/bad labels instead of pairs.
* **ORPO** (Hong et al., 2024): combines SFT and odds-ratio preference loss in one objective.
* **SimPO** (Meng et al., 2024): length-normalized, no reference model.
</div>

<div id="dpo-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
## GRPO: Group Relative Policy Optimization

GRPO (Shao et al., DeepSeek, 2024) was the breakthrough that enabled **R1's pure-RL training**. For each prompt:

1. Sample $G$ candidate responses from the current policy: $\{y^{(1)}, \dots, y^{(G)}\}$.
2. Score each with a reward model (or rule-based verifier).
3. Compute the **group-relative advantage**:

$$
A_i = \frac{r_i - \text{mean}(r_1, \dots, r_G)}{\text{std}(r_1, \dots, r_G)}
$$

4. Update the policy using a PPO-style objective but **without a critic**:

$$
L_{\text{GRPO}}(\theta) = -\frac{1}{G}\sum_{i=1}^{G} \min\!\left(\frac{\pi_\theta(y^{(i)})}{\pi_{\theta_{\text{old}}}(y^{(i)})} A_i,\; \text{clip}(\cdot, 1-\epsilon, 1+\epsilon)\, A_i\right) + \beta\, \text{KL}(\pi_\theta \,\|\, \pi_{\text{ref}})
$$

By using the group mean as the baseline, GRPO eliminates the need for a separate value network. This made it possible to RL-train on **verifiable rewards** (math correctness, code test passage) at scale, producing emergent long-CoT reasoning.
</div>

<div class="md">
## The RLHF Spectrum

| Method | Reward signal | Critic | Reference model | Use case |
|--------|---------------|--------|-----------------|----------|
| **SFT** | None | No | — | Pretraining alignment |
| **RLHF (PPO)** | Learned RM | Yes | Yes | Industry standard until 2023 |
| **DPO** | Implicit from policy ratio | No | Yes | Simple, no RL |
| **IPO** | Implicit, regularized | No | Yes | Noisy preferences |
| **KTO** | Implicit, asymmetric | No | Yes | Binary feedback |
| **ORPO** | Odds ratio | No | No | Combined SFT + preference |
| **SimPO** | Length-normalized log-prob | No | No | Reference-free |
| **GRPO** | Verifier / RM | No (group baseline) | Yes | Reasoning RL (R1) |
| **RLOO** | REINFORCE leave-one-out | No | Optional | Lightweight online RL |

The trend: **simpler objectives that remove components** (critic, reference model, paired data) while matching or exceeding PPO performance.
</div>

<div class="md">
## Reward Hacking

A central problem in RL: a sufficiently clever agent finds **loopholes** in the reward function that don't reflect the actual intent. Classic examples:

* CoastRunners (2016): an agent trained to maximize race score learned to drive in circles collecting power-ups, never finishing the race.
* A boat-racing game agent learned to **drive into the same power-up repeatedly** rather than progressing.
* An LLM trained with reward hacking produces long, sycophantic responses that humans rate highly but are useless.

Defenses:

* **Multiple reward models**: ensemble disagreement as an uncertainty signal.
* **KL penalty to reference**: keeps the policy close to the human-aligned SFT model.
* **Process reward**: score intermediate reasoning steps, not just final output.
* **Constitutional AI** (Bai et al., Anthropic 2022): self-critique against a written "constitution" of principles.
* **Debate / red-teaming**: train an adversary to find exploits, then train against them.
</div>

<div class="md">
## Open Problems

* **Sample efficiency**: PPO needs millions of environment steps. RL for LLMs needs millions of rollouts. Both are expensive.
* **Reward modeling**: the reward model is a bottleneck; it inherits human biases and is gamed.
* **Distributional shift**: PPO's old policy drifts from $\pi_{\text{ref}}$; offline-correction methods (DPO, etc.) sidestep this but lose online improvement.
* **Credit assignment over long horizons**: a 1000-token reasoning chain has sparse final reward. Process rewards help but are expensive.

RL is the engine of modern alignment and reasoning, but it remains one of the most sample-inefficient and brittlest components of the LLM stack.
</div>

<script>
// MDP cycle
(function() {
	const c = document.getElementById('mdp-viz');
	if (!c) return;

	const box = (x, y, w, h, color) => ({
		type: 'rect', x0: x, x1: x + w, y0: y, y1: y + h,
		fillcolor: color, line: { color: 'rgba(0,0,0,0.3)', width: 1.5 }
	});

	const shapes = [
		box(0, 1, 2, 1.5, '#22c55e'),
		box(3, 1, 2, 1.5, '#3b82f6'),
		box(6, 1, 2, 1.5, '#8b5cf6'),
		box(3, -1, 2, 1.5, '#f59e0b'),
		box(6, -1, 2, 1.5, '#ef4444')
	];

	const arrows = [
		{ ax: 2, ay: 1.75, x: 3, y: 1.75, showarrow: true, arrowhead: 2, arrowsize: 1, arrowwidth: 2, arrowcolor: '#475569' },
		{ ax: 5, ay: 1.75, x: 6, y: 1.75, showarrow: true, arrowhead: 2, arrowsize: 1, arrowwidth: 2, arrowcolor: '#475569' },
		{ ax: 7, ay: 1, x: 7, y: 0.5, showarrow: true, arrowhead: 2, arrowsize: 1, arrowwidth: 2, arrowcolor: '#475569' },
		{ ax: 7, ay: -0.25, x: 5, y: -0.25, showarrow: true, arrowhead: 2, arrowsize: 1, arrowwidth: 2, arrowcolor: '#475569' },
		{ ax: 4, ay: -0.25, x: 4, y: 1, showarrow: true, arrowhead: 2, arrowsize: 1, arrowwidth: 2, arrowcolor: '#475569' }
	];

	const annotations = [
		{ x: 1, y: 1.75, text: '<b>State s</b>', showarrow: false, font: { size: 12, color: '#fff' } },
		{ x: 4, y: 1.75, text: '<b>Action a ~ π</b>', showarrow: false, font: { size: 11, color: '#fff' } },
		{ x: 7, y: 1.75, text: '<b>Next s\'</b>', showarrow: false, font: { size: 12, color: '#fff' } },
		{ x: 4, y: -0.25, text: '<b>Reward r</b>', showarrow: false, font: { size: 11, color: '#fff' } },
		{ x: 7, y: -0.25, text: '<b>Update π, V</b>', showarrow: false, font: { size: 11, color: '#fff' } }
	];

	Plotly.newPlot('mdp-viz', [], {
		shapes, annotations,
		xaxis: { range: [-0.5, 9], showgrid: false, zeroline: false, showticklabels: false },
		yaxis: { range: [-2, 3.5], showgrid: false, zeroline: false, showticklabels: false, scaleanchor: 'x' },
		margin: { t: 20, b: 20, l: 20, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		title: { text: 'Agent–Environment interaction loop', font: { size: 13 } }
	}, { displayModeBar: false, responsive: true });
})();

// PPO clipped objective
(function() {
	const c = document.getElementById('ppo-viz');
	if (!c) return;

	const r = Array.from({length: 100}, (_, i) => (i + 1) * 0.04);  // 0.04 to 4
	const A = 1;  // positive advantage
	const eps = 0.2;

	const obj = r.map(ri => {
		const unclipped = ri * A;
		const clipped = Math.min(ri, 1 + eps) * A;
		return Math.min(unclipped, clipped);
	});
	const unclippedNeg = r.map(ri => {
		const unclipped = ri * -1;
		const clipped = Math.max(ri, 1 - eps) * -1;
		return Math.max(unclipped, clipped);
	});

	Plotly.newPlot('ppo-viz', [
		{ x: r, y: obj, mode: 'lines', name: 'A > 0', line: { color: '#22c55e', width: 2.5 } },
		{ x: r, y: unclippedNeg, mode: 'lines', name: 'A < 0', line: { color: '#ef4444', width: 2.5 } },
		{ x: [1, 1], y: [-1.2, 1.2], mode: 'lines', line: { color: '#64748b', dash: 'dash', width: 1 }, showlegend: false, name: 'r = 1' },
		{ x: [1 - eps, 1 - eps], y: [-1.2, 1.2], mode: 'lines', line: { color: '#94a3b8', dash: 'dot', width: 1 }, showlegend: false },
		{ x: [1 + eps, 1 + eps], y: [-1.2, 1.2], mode: 'lines', line: { color: '#94a3b8', dash: 'dot', width: 1 }, showlegend: false }
	], {
		title: { text: 'PPO clipped surrogate objective', font: { size: 13 } },
		xaxis: { title: 'probability ratio r(θ) = π_θ / π_old', range: [0, 4.2] },
		yaxis: { title: 'L_CLIP', range: [-1.2, 1.2] },
		margin: { t: 50, b: 50, l: 60, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		legend: { x: 0.05, y: 0.05, xanchor: 'left', yanchor: 'bottom' },
		shapes: [
			{ type: 'rect', x0: 1 - eps, x1: 1 + eps, y0: -1.2, y1: 1.2,
			  fillcolor: 'rgba(148, 163, 184, 0.15)', line: { width: 0 } }
		]
	}, { responsive: true });
})();

// DPO loss landscape
(function() {
	const c = document.getElementById('dpo-viz');
	if (!c) return;

	const N = 50;
	const x = Array.from({length: N}, (_, i) => (i - N/2) * 0.1);
	const y = Array.from({length: N}, (_, i) => (i - N/2) * 0.1);
	const z = [];
	for (let i = 0; i < N; i++) {
		const row = [];
		for (let j = 0; j < N; j++) {
			const ratio = Math.exp(x[i] - y[j]);  // π_θ(y_w) / π_θ(y_l) ratio
			row.push(-Math.log(1 / (1 + 1 / ratio)));
		}
		z.push(row);
	}

	Plotly.newPlot('dpo-viz', [{
		z, x, y, type: 'heatmap',
		colorscale: [[0, '#fef3c7'], [0.5, '#3b82f6'], [1, '#1e3a8a']],
		colorbar: { title: 'L_DPO' }
	}], {
		title: { text: 'DPO loss landscape (lower = better)', font: { size: 13 } },
		xaxis: { title: 'log π(y_winner)' },
		yaxis: { title: 'log π(y_loser)', scaleanchor: 'x' },
		margin: { t: 50, b: 50, l: 60, r: 30 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)'
	}, { responsive: true });
})();

async function loadReinforcementLearningModule() {
	updateLoadingStatus("Loading section about Reinforcement Learning...");
	return Promise.resolve();
}
</script>
