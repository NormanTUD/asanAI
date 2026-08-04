<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Reinforcement Learning
description: From Q-learning to PPO to GRPO — the foundations of RL that power modern LLM alignment.
icon: &#127918;
part: 2
order: 15
color: coral
-->

<div class="md">
Reinforcement Learning (RL) is the third pillar of machine learning, alongside supervised and unsupervised learning. In RL, an **agent** takes **actions** in an **environment** to maximize a cumulative **reward** signal. It is the foundation of modern LLM alignment: **RLHF**, DPO, GRPO, and the o1/R1 paradigm all build on it.

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

For an LLM, the "state" is the current context window, the "action" is the next token, and the "reward" comes from a reward model (**RLHF**) or verifier (reasoning training).
</div>

<div class="md">
## Tabular RL: Q-Learning (\cite[Watkins, 1989]{watkins1989qlearning} converges to $Q^*$ by iterative updates:

$$
Q(s, a) \leftarrow Q(s, a) + \alpha \left[r + \gamma \max_{a'} Q(s', a') - Q(s, a)\right]
$$

where $\alpha$ is the learning rate and $r + \gamma \max_{a'} Q(s', a')$ is the **TD target**. The agent samples actions by $\epsilon$-greedy: with probability $\epsilon$ take a random action (exploration), otherwise $\arg\max_a Q(s, a)$ (exploitation).

Deep Q-Networks (\cite[Mnih et al., 2013]{mnih2013dqn}, Mnih et al., 2013) replaced the table with a neural network $Q_\theta(s, a)$ and added **experience replay** + a **target network** to stabilize training. This enabled RL on high-dimensional inputs (Atari).
</div>

<div class="md">
## Policy Gradients

For continuous or large action spaces, parameterize the policy as $\pi_\theta(a \mid s)$ and directly optimize:

$$
J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}\!\left[\sum_{t=0}^{T} \gamma^t R(s_t, a_t)\right]
$$

The **policy gradient theorem** \cite[Sutton & Barto, 2018]{sutton2018reinforcement}:

$$
\nabla_\theta J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}\!\left[\sum_{t=0}^{T} \nabla_\theta \log \pi_\theta(a_t \mid s_t) \cdot \hat A_t\right]
$$

where $\hat A_t = \sum_{t' \geq t} \gamma^{t'-t} R(s_{t'}, a_{t'}) - b(s_t)$ is the **advantage**: how much better this action was than the baseline $b(s_t)$.

### REINFORCE (\cite[Williams, 1992]{williams1992reinforce} has high variance. The **baseline trick** (subtracting $b(s_t)$, often $V^\pi(s_t)$) reduces variance without bias.
</div>

<div class="md">
## Actor-Critic Methods

**Actor-critic** algorithms learn both a policy (actor) and a value function (critic):

* Actor update: $\theta \leftarrow \theta + \alpha_\theta \cdot \hat A_t \nabla_\theta \log \pi_\theta(a_t \mid s_t)$
* Critic update: $\phi \leftarrow \phi + \alpha_\phi (G_t - V_\phi(s_t)) \nabla_\phi V_\phi(s_t)$

The critic's TD-error $G_t - V_\phi(s_t)$ is a low-variance estimate of the advantage.

### A2C / A3C (\cite[Mnih et al., 2016]{mnih2016a3c}

**Asynchronous** Advantage Actor-Critic: parallel workers update a shared model asynchronously. Stabilizes training; superseded by synchronous methods.

### PPO \cite[Schulman et al., 2017]{schulman2017ppo}

**Proximal Policy Optimization** is the workhorse of modern RL. It constrains how far the policy can move per update using a **clipped surrogate objective**:

$$
L^{\text{CLIP}}(\theta) = \mathbb{E}_t\!\left[\min\!\left(r_t(\theta)\, \hat A_t,\; \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon)\, \hat A_t\right)\right]
$$

where $r_t(\theta) = \pi_\theta(a_t \mid s_t) / \pi_{\theta_{\text{old}}}(a_t \mid s_t)$ is the probability ratio. The clip prevents destructively large updates.

PPO is simple, stable, and the default choice for **RLHF** and many robotics tasks.
</div>

<div class="md">
## RLHF: Reinforcement Learning from Human Feedback

**RLHF** (Christiano et al., 2017; Ouyang et al., InstructGPT, 2022) adapts RL to align LLMs with human preferences:

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
## DPO: \cite[Rafailov et al., 2023]{rafailov2023dpo} Optimization

Rafailov et al. (2023) showed that the **RLHF** objective has a **closed-form solution**:

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

**No reward model, no PPO, no rollouts**. Just a supervised loss on (prompt, winner, loser) triples. DPO matches **RLHF** on alignment benchmarks with much simpler infrastructure.

Variants have proliferated:

* **IPO** \cite[Azar et al., 2023]{azar2023ipo}: robust to deterministic preferences.
* **KTO** \cite[Ethayarajh et al., 2024]{ethayarajh2024kto}: uses binary good/bad labels instead of pairs.
* **ORPO** \cite[Hong et al., 2024]{hong2024orpo}: combines SFT and odds-ratio preference loss in one objective.
* **SimPO** \cite[Meng et al., 2024]{meng2024simpo}: length-normalized, no reference model.
</div>

<div class="md">
## GRPO: \cite[Shao et al., 2024]{shao2024grpo} Policy Optimization

GRPO (Shao et al., DeepSeek, 2024) was the breakthrough that enabled **R1's pure-RL training**. For each prompt:

1. Sample $G$ candidate responses from the current policy: $\{y^{(1)}, \dots, y^{(G)}\}$.
2. Score each with a reward model (or rule-based verifier).
3. Compute the **\cite[Shao et al., 2024]{shao2024grpo} advantage**:

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
* **\cite[Du et al., 2023]{du2023multiagent} / red-teaming**: train an adversary to find exploits, then train against them.
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
async function loadReinforcementLearningModule() {
	updateLoadingStatus("Loading section about Reinforcement Learning...");
	return Promise.resolve();
}
</script>
