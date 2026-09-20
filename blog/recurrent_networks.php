<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Networks with Memory
description: Recurrent networks and LSTMs — how a loop lets a network carry its own output into the next step, and why the cell state resists forgetting.
icon: &#8634;
part: 4
order: 5
color: sky
topics: architecture, math-i, math-ii
-->

<div class="md">
## The Loop

A feedforward network answers one question and forgets it. The token that left the model's mind is gone — the next token is produced without the first one having made a mark. But language is *sequential*: the meaning of “was” arrives only with what came before. \citeauthor{colah2015lstm}'s classic walkthrough \footcite{colah2015lstm} puts it simply:

> Humans don't start their thinking from scratch every second. … You don't throw everything away and start thinking from scratch again. Your thoughts have persistence.

A **recurrent neural network (RNN)** gives a network the same trick: a loop that feeds its own output back in. Instead of a stack of layers, it is a chain of copies of one network, each passing a **hidden state** $\mathbf{h}_{t-1}$ to the next — the machine keeps reading its own writing.

$$\mathbf{h}_t = \tanh\!\big(\mathbf{W}_h \mathbf{h}_{t-1} + \mathbf{W}_x \mathbf{x}_t + \mathbf{b}\big)$$

## Unrolling: One Network, Many Copies

The recurrence is easiest to read when it is **unrolled** across time — drawn as a sequence of identical networks, one per step, each handing its state forward:

<figure style="background:var(--mn-surface, #f8fafc); padding:24px 16px; border-radius:12px; border:1px solid var(--mn-border, #e2e8f0); margin:15px 0; max-width:680px; margin-left:auto; margin-right:auto;">
	<img style="width:100%; border-radius:6px;" src="rnn_unrolled.svg" alt="An unrolled recurrent neural network: the same looped network drawn as a chain of copies that pass a hidden state from one step to the next" />
	<figcaption style="margin-top:10px; font-size:0.8rem; color:var(--mn-text-secondary, #64748b); text-align:center;">
		The recurrent loop unfolded as a chain — $\mathbf{a}$ is the input, $\mathbf{h}$ the state the copies hand to each other, $\mathbf{y}$ the output. [Diagram: fdeloche, CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Recurrent_neural_network_unfold.svg)
	</figcaption>
</figure>

“Recurrent” hides a beautiful fact: the *same* weight matrices $\mathbf{W}_h$, $\mathbf{W}_x$ are used at **every** step. There is one network, applied many times. This is the weight-sharing trick from the [computer vision chapter](computer_vision.php) — a filter that slides over time instead of over space \cite[see also the fixed-weight argument in]{colah2014conv}. It is also why \citeauthor{colah2015lstm} calls RNNs “intimately related to sequences and lists”: they are *the* natural architecture for data that arrives one step at a time.

## The Long-Distance Problem

Because the state must be *propagated* — multiplied through the chain, step by step — far-apart context is fragile. Predicting the next word in *“the clouds are in the sky”* needs only recent words. But finish *“I grew up in France … I speak fluent __”*, and the answer depends on something from sentences ago. In the long gap, an RNN must remember the word “France” while doing all the intervening work.

\citeauthor{colah2015lstm} captures the state of things precisely:

> In theory, RNNs are absolutely capable of handling such “long-term dependencies.” … In practice, RNNs don't seem to be able to learn them.

The failure mode is the [vanishing gradient](backproplab.php). Unrolling an RNN computes gradients through many multiplications of the same matrix; if its eigenvalues sit below 1, the signal *shrinks* toward zero — mathematically, a long step sequence compounds the decay into the exponential $\lambda^{k}$ that [attention later sidesteps entirely](attentionlab.php) \cite{colah2015backprop,hochreiter1991vanishing}. The problem was diagnosed early by \citeauthor{hochreiter1991vanishing} (\citeyear{hochreiter1991vanishing}) and formalized by \citeauthor{bengio1994learning} — but the fix arrived as an explicit memory.

## The LSTM's Conveyor Belt

The **Long Short-Term Memory** network, introduced by \citeauthorlastnameand{lstm} in \citeyear{lstm}, changes what flows down the chain \cite{lstm}. Alongside the ordinary hidden state $\mathbf{h}_t$ runs a **cell state** $\mathbf{c}_t$ — a lane that is *not* transformed by every gate. \citeauthor{colah2015lstm} calls it the conveyor belt: information rides on it straight through the network, altered only by the gentle, learned interactions that **gates** apply.

Each gate is a sigmoid layer whose output lies in $[0,1]$ — it reads “how much to let through,” from closed ($0$) to wide open ($1$) \cite{colah2015lstm}. An LSTM has three:

* **The forget gate** decides what to drop from the previous state: $\mathbf{f}_t = \sigma\!\big(\mathbf{W}_f [\mathbf{h}_{t-1}, \mathbf{x}_t] + \mathbf{b}_f\big)$.
* **The input gate** writes new memory from a candidate $\tilde{\mathbf{c}}_t = \tanh\big(\mathbf{W}_c [\mathbf{h}_{t-1}, \mathbf{x}_t] + \mathbf{b}_c\big)$, scaled by $\mathbf{i}_t = \sigma\!\big(\mathbf{W}_i [\mathbf{h}_{t-1}, \mathbf{x}_t] + \mathbf{b}_i\big)$.
* The **output gate** decides what the updated state reveals as $\mathbf{h}_t = \mathbf{o}_t \odot \tanh(\mathbf{c}_t)$.

The cell update is then a soft overwrite, not a full rewrite:

$$\mathbf{c}_t = \mathbf{f}_t \odot \mathbf{c}_{t-1} + \mathbf{i}_t \odot \tilde{\mathbf{c}}_t$$

In a language model that has learned grammar, \citeauthor{colah2015lstm} notes the gates learn an interpretable job:

> …the network learned to use the cell state to keep track of whether the subject of a sentence is singular or plural, so that when a verb form is needed in the future, it can generate the correct one.

Forget the gate, keep the memory: that is the whole trick — a *single* multiplication with a number near 1 instead of a full matrix, so the gradients survive the journey across a long sentence \cite{colah2015lstm}.

## The Family Tree

What follows is a pruning of the idea, not a new invention. The **gated recurrent unit (GRU)** of \citeauthor{cho2014gru} (\citeyear{cho2014gru}) merges the forget and input gates into one **update gate**, and weds the memory to the output via a **reset gate** — two gates instead of three, fewer parameters, similar performance \cite{cho2014gru}. And when \citeauthor{greff2015lstm} and colleagues *searched* the space of LSTM variants systematically, they reached a deflating but reassuring conclusion: the best variants are only marginally better than the plain, standard LSTM \cite{greff2015lstm}.

The message of that search echoes [the universality discussion in the toolkit](https://asanai.scads.ai): architecture cleverness buys freedom from *unavoidable* failure, but the winning configurations cluster together — “all about the same” \cite{colah2015lstm}. What actually scaled, as [the next chapter](attentionlab.php) shows, was not a better gate but *removing the chain entirely* — \citeauthor{colah2015lstm} ends his walkthrough with an honest roadmap:

> …the next step in the intellectual progression toward better language understanding is attention. … the idea of letting every step look at other information in the input sequence — and figuring out what's important.
</div>