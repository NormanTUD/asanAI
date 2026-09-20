<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Hyperparameters: The Numbers You Choose
description: Weights are learned, hyperparameters are chosen. What they are, why they cannot be solved for, and how practitioners actually find good values.
icon: &#9881;
part: 2
order: 7
color: emerald
topics: training, architecture, math-i, programming
-->

<div class="md">
Every model in this course contains two kinds of numbers: **parameters**, which *learning* changes, and **hyperparameters**, which *you choose* before learning starts. This chapter is about the second kind: what it is, why it cannot be solved for, and how practitioners actually find good values.

## Two Kinds of Numbers

A **parameter** is a quantity the training algorithm updates. The weights $W$ of a transformer are parameters: they start at random values and are moved by gradient descent until the [loss](losslab.php) stops decreasing. A model may have billions of them, and you never pick one by hand.

A **hyperparameter** is a quantity that stays *fixed* during training and is *chosen* by the practitioner before it starts. It sits outside the learned weights and determines what the model is and how it is trained:

| Category | Hyperparameter | Chosen as |
|---|---|---|
| Architecture | $d_{\text{model}}$, $N$ layers, $h$ heads, FFN width, context size, vocabulary size | integers, often constrained ($d_{\text{model}}$ a multiple of $h$) |
| Optimization | learning rate, optimizer (SGD / Adam / …), batch size, number of epochs, weight decay | continuous (learning rate usually on a log scale) or categorical |
| Data | context length, tokenization scheme, data mixing | integers / categorical |
| Inference | temperature, top-$p$ | continuous (see the [Temperature & Sampling](samplinglab.php) chapter) |

You have already set several of these: the learning rate and optimizer in the [Optimizer chapter](optimizerlab.php), $d_{\text{model}}$, $h$, $N$ and context size in the [Transformer chapter](transformer.php).

The boundary is not perfectly clean. A learning-rate *schedule* is a function you choose whose value changes over time, and every optimizer carries its own hyperparameters (Adam's $\beta_1$, $\beta_2$, $\epsilon$), so choices nest inside other choices.

## Why a Hyperparameter Is Not a Constant

A constant of a model (say, the value of $e$ in a softmax) changes neither the model nor its training. A hyperparameter does both:

* **Architecture hyperparameters change the model itself.** $d_{\text{model}} = 768$ and $d_{\text{model}} = 128$ are not two settings of the same model; they are two different function classes with different weight-matrix shapes. Choosing $d_{\text{model}}$ is the choice of *which* set of functions the optimizer may search over.
* **Optimization hyperparameters change the process, not just its speed.** The learning rate does not merely pace the descent: gradient descent with a different step size follows a different trajectory and can settle in a different minimum. Two runs that differ only in learning rate are different experiments, not one experiment at two speeds.
* **Data hyperparameters change the objective.** A different context length or a different tokenizer changes the loss the model is actually minimizing.

Consequence: there is no equation of the form $\text{hyperparameter} = f(\text{task})$ that you can solve. The only way to know what a choice is worth is to run a training and measure the result.

## Why the Search Is Hard

1. **Evaluation is expensive.** One point in the search space costs one full training run. At real scale that means days on thousands of GPUs; even the in-browser demo costs seconds per point.
2. **The objective is noisy.** Two runs with the same hyperparameters but different random seeds land at slightly different losses. A search must average over noise or it optimizes luck.
3. **The space is mixed and constrained.** Discrete values ($N$, $h$), continuous values (learning rate, best explored on a log scale), categorical choices (optimizer), plus constraints such as $d_{\text{model}} \bmod h = 0$. A method that only handles one of these cannot handle the whole space.
4. **Hyperparameters interact.** Learning rate and batch size must be chosen together: doubling the batch size typically invalidates the learning rate that worked before. The search space is not a grid of independent dials.

## How Hyperparameters Are Actually Found

### Expert knowledge and transfer

Most published models ship with a hyperparameter table whose values were inherited from the previous model with a few adjustments. Transfer works because architectures and objectives change slowly between papers — and it fails silently when the task or scale changes, because nothing tells you the inherited value is no longer good.

### Scaling laws

At the frontier, search is partly replaced by *fitted laws*. \cite[Kaplan et al., 2020]{kaplan2020scaling} showed that the loss of a language model depends on the number of parameters $N$, the number of training tokens $D$ and the compute $C$ as smooth power laws. Fit the laws on cheap small models and you can extrapolate the target size for a fixed budget. \cite[Hoffmann et al., 2022]{hoffmann2022chinchilla} redid the analysis on a larger scale and found that for a fixed compute budget, models should be trained on roughly 20 times as many tokens as they have parameters — far more than the then-standard practice, which had been copied between papers for years. A fitted law can thus overturn a prior belief that no single experiment would have questioned.

### Grid search

The simplest systematic method: choose a grid of candidate values per hyperparameter and train on every combination. With $n$ points on each of $d$ axes this costs $n^d$ trainings, which grows so fast that grid search is only affordable for $d \approx 2$–3 — and it wastes budget on combinations where the unimportant axes are varied pointlessly.

### Random search

Draw configurations at random (uniformly for discrete values, log-uniformly for positive continuous ones like the learning rate) and train on them. \cite[Bergstra & Bengio, 2012]{bergstra2010random} showed that for a fixed evaluation budget, random search matches or beats grid search in most realistic settings: when only a few hyperparameters matter much, a grid spreads its points across the values of the ones that do not, while random search keeps covering the full range of every axis.

### Bayesian optimization

Build a probabilistic *surrogate model* of $\text{config} \mapsto \text{loss}$ from the evaluations already performed, and choose the next configuration by balancing **exploitation** (where the surrogate predicts a good loss) against **exploration** (where it is still uncertain). Two standard instantiations:

* **Gaussian-process surrogates** \cite[Snoek et al., 2012]{snoek2012practical}: a Gaussian process is placed over the loss function; an acquisition function (e.g. expected improvement) picks the next point from the balance of predicted quality and uncertainty.
* **TPE (Tree-structured Parzen Estimators)** \cite[Bergstra et al., 2013]{bergstra2013science}: instead of a full process, the observed configurations are split into those that gave a *good* loss and those that gave a *bad* one; each group is modeled by its own density, and the next configuration is sampled where the good density is high relative to the bad one.

\cite[Hyperopt]{hyperopt} is the open-source implementation this family is usually run with. The defining property of the whole approach: *every evaluation makes the next one smarter*, so the search is sequential and budget-aware rather than exhaustive.

### Multi-fidelity search

A bad configuration usually announces itself early: the loss curves of doomed runs separate from the survivors within the first few epochs. Multi-fidelity methods therefore run many trials briefly and extend only the ones that are winning, so a fixed budget buys far more distinct configurations than running each trial to completion.

## A Tool for the Search: OmniOpt

If you have a model whose training can be run as a program, the search does not have to be done by hand. \cite[ScaDS.AI Dresden/Leipzig]{omniopt} has developed exactly such an instrument: **OmniOpt**, a hyperparameter optimization tool that wraps a stochastic Bayesian optimizer (TPE, via \cite{hyperopt}) around your own program.

* Your program is a **black box** in any programming language on Linux: it reads the hyperparameters as command-line arguments, trains, and prints the objective value to standard output.
* OmniOpt proposes the next configurations, balancing exploration and exploitation, and checks and installs all dependencies automatically.
* The evaluations are distributed automatically over the HPC system at TU Dresden — more than 40,000 CPUs and several hundred GPUs.
* The results come back as the full table of evaluated configurations plus 2D slices of the search space as color maps and parallel-coordinate plots.
* It is free for users with an account on the HPC system of TU Dresden, and a training session, "Hyperparameter Optimization with OmniOpt", is offered regularly.

See the [project page](https://scads.ai/transfer-and-service/software/omniopt/).
</div>
