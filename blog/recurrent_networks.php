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
tags: math-heavy
math: 60
-->

<div class="md" data-mathlevel="55">
## The recurrent idea

### The Loop

A feedforward network answers one question and forgets it. The token that left the model's mind is gone — the next token is produced without the first one having made a mark. But language is *sequential*: the meaning of “was” arrives only with what came before. \citeauthor{colah2015lstm}'s classic walkthrough (\citeyear{colah2015lstm}) puts it simply:

> Humans don't start their thinking from scratch every second. … You don't throw everything away and start thinking from scratch again. Your thoughts have persistence.

A **recurrent neural network (RNN)** gives a network the same trick: a loop that feeds its own output back in. Instead of a stack of layers, it is a chain of copies of one network, each passing a **hidden state** $\mathbf{h}_{t-1}$ to the next — the machine keeps reading its own writing.

$$\mathbf{h}_t = \tanh\!\big(\mathbf{W}_h \mathbf{h}_{t-1} + \mathbf{W}_x \mathbf{x}_t + \mathbf{b}\big)$$
</div>

<div class="md">
### Unrolling: One Network, Many Copies

The recurrence is easiest to read when it is **unrolled** across time — drawn as a sequence of identical networks, one per step, each handing its state forward:

<figure style="background:var(--mn-surface, #f8fafc); padding:24px 16px; border-radius:12px; border:1px solid var(--mn-border, #e2e8f0); margin:15px 0; max-width:680px; margin-left:auto; margin-right:auto;">
	<img style="width:100%; border-radius:6px;" src="rnn_unrolled.svg" alt="An unrolled recurrent neural network: the same looped network drawn as a chain of copies that pass a hidden state from one step to the next" />
	<figcaption style="margin-top:10px; font-size:0.8rem; color:var(--mn-text-secondary, #64748b); text-align:center;">
		The recurrent loop unfolded as a chain — $\mathbf{a}$ is the input, $\mathbf{h}$ the state the copies hand to each other, $\mathbf{y}$ the output. [Diagram: fdeloche, CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Recurrent_neural_network_unfold.svg)
	</figcaption>
</figure>

“Recurrent” hides a beautiful fact: the *same* weight matrices $\mathbf{W}_h$, $\mathbf{W}_x$ are used at **every** step. There is one network, applied many times. This is the weight-sharing trick from the [computer vision chapter](computer_vision.php) — a filter that slides over time instead of over space \cite[see also the fixed-weight argument in]{colah2014conv}. It is also why \citeauthor{colah2015lstm} calls RNNs “intimately related to sequences and lists”: they are *the* natural architecture for data that arrives one step at a time.
</div>

<div class="md" data-mathlevel="60">
## The long-distance problem

### The Long-Distance Problem

Because the state must be *propagated* — multiplied through the chain, step by step — far-apart context is fragile. Predicting the next word in *“the clouds are in the sky”* needs only recent words. But finish *“I grew up in France … I speak fluent __”*, and the answer depends on something from sentences ago. In the long gap, an RNN must remember the word “France” while doing all the intervening work.

\citeauthor{colah2015lstm} captures the state of things precisely:

> In theory, RNNs are absolutely capable of handling such “long-term dependencies.” … In practice, RNNs don't seem to be able to learn them.

The failure mode is the [vanishing gradient](backproplab.php). Unrolling an RNN computes gradients through many multiplications of the same matrix; if its eigenvalues sit below 1, the signal *shrinks* toward zero — mathematically, a long step sequence compounds the decay into the exponential $\lambda^{k}$ that [attention later sidesteps entirely](attentionlab.php) \cite{colah2015backprop,hochreiter1991vanishing}. The problem was diagnosed early by \citeauthor{hochreiter1991vanishing} (\citeyear{hochreiter1991vanishing}) and formalized by \citeauthor{bengio1994learning} — but the fix arrived as an explicit memory.
</div>

<div class="md" data-mathlevel="62">
### The LSTM's Conveyor Belt

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
</div>

<div class="md">
### The Family Tree

What follows is a pruning of the idea, not a new invention. The **gated recurrent unit (GRU)** of \citeauthor{cho2014gru} (\citeyear{cho2014gru}) merges the forget and input gates into one **update gate**, and weds the memory to the output via a **reset gate** — two gates instead of three, fewer parameters, similar performance \cite{cho2014gru}. And when \citeauthor{greff2015lstm} and colleagues *searched* the space of LSTM variants systematically, they reached a deflating but reassuring conclusion: the best variants are only marginally better than the plain, standard LSTM \cite{greff2015lstm}.

The message of that search echoes [the universality discussion in the toolkit](https://asanai.scads.ai): architecture cleverness buys freedom from *unavoidable* failure, but the winning configurations cluster together — “all about the same” \cite{colah2015lstm}. What actually scaled, as [the next chapter](attentionlab.php) shows, was not a better gate but *removing the chain entirely* — \citeauthor{colah2015lstm} ends his walkthrough with an honest roadmap:

> …the next step in the intellectual progression toward better language understanding is attention. … the idea of letting every step look at other information in the input sequence — and figuring out what's important.
</div>

<div class="md" data-mathlevel="55">
### From sequences to translations: seq2seq

The recurrent loop becomes much more useful when you give it a job with two different sequences. **Sequence-to-sequence** learning (seq2seq), introduced in 2014 by Sutskever, Vinyals, and Le and independently by Cho et al., pairs two recurrent networks (\cite[Sutskever et al., 2014]{sutskever2014seq2seq}; \cite[Cho et al., 2014]{cho2014gru}):

* an **encoder** reads the source sentence one token at a time and compresses it into a single **context vector** — the final hidden state;
* a **decoder** is initialized with that vector and generates the target sentence token by token, feeding its own previous output back in.

For a source $x_1,\dots,x_T$ and target $y_1,\dots,y_{T'}$:

$$
\underbrace{h_t = \mathrm{LSTM}_{\mathrm{enc}}(x_t, h_{t-1})}_{\text{read the source one token at a time}},
\qquad
\underbrace{c = h_T}_{\text{compress the whole source into one vector}}
$$
$$
\underbrace{s_t = \mathrm{LSTM}_{\mathrm{dec}}(y_{t-1}, s_{t-1}, c)}_{\text{generate the target one token at a time}},
\qquad
\underbrace{p(y_t \mid y_{1:t-1}, c) = \mathrm{softmax}(W_s s_t + b_s)}_{\text{predict the next target token from the decoder state}}
$$

The context vector is the paradigm's central wager: that the meaning of a sentence of any length can be stored as a point in a fixed-dimensional space, and unfolded back into another language. It is also its central weakness. Everything the decoder knows about the source must pass through those few numbers, so quality falls as sentences get longer. Sutskever et al. found a cheap partial fix: **reverse the source sentence**, which puts the first source words — the ones that predict the first target words — close to the context vector.

**Attention** removed the bottleneck. \citeauthor{bahdanau2014} let the decoder compute, at every output step, a weighted sum over *all* encoder states:

$$
\underbrace{c_i = \sum_{j=1}^{T}\alpha_{ij}h_j}_{\text{a per-step summary of the source}},
\qquad
\underbrace{\alpha_{ij} = \frac{\exp(e_{ij})}{\sum_k \exp(e_{ik})}}_{\text{softmax over source positions}},
\qquad
\underbrace{e_{ij} = a(s_{i-1}, h_j)}_{\text{a learned alignment score}}
$$

That per-step alignment is the direct ancestor of the self-attention inside every Transformer: instead of one compressed summary, the decoder learns *where to look* (\cite[Bahdanau et al., 2014]{bahdanau2014}).

Training introduced a protocol that every modern language model still uses. **Teacher forcing** feeds the decoder the *true* previous token at every step, not its own prediction, so all positions can be scored in one parallel pass (\cite[Bengio et al., 2015]{bengio2015scheduled}). At inference the gold prefix is gone and the model consumes its own outputs; the mismatch between the two conditions is called **exposure bias**. Scheduled sampling, which gradually replaces gold tokens with model predictions during training, was the recurrent era's remedy. At Transformer scale the problem largely receded in practice, but the protocol did not: next-token training *is* teacher forcing with a causal mask.

The seq2seq form outlived the recurrence. Google's production GNMT system stacked eight LSTM layers per side, the Transformer kept the encoder–decoder skeleton and replaced the recurrent core with attention, T5 recast every task as text-to-text, and Whisper carried the same shape into speech recognition.
</div>

<div class="mn-quiz" data-quiz="recurrent_networks"><script type="application/json">{"title": "Networks with memory", "questions": [{"q": "What makes a network recurrent?", "options": ["Its hidden state from one step is fed back in at the next step", "It has more than one layer", "It uses attention", "It is trained twice"], "answer": 0, "explain": "The loop carries information from earlier inputs forward through the sequence."}, {"q": "What does “unrolling” a recurrent network mean?", "options": ["Drawing it as one copy of the same network per time step, sharing the weights", "Deleting the loop", "Training it backwards", "Converting it into a transformer"], "answer": 0, "explain": "Unrolled, it is a very deep network — which is why backpropagation through time faces vanishing gradients."}, {"q": "What does the LSTM's cell state (“conveyor belt”) achieve?", "options": ["Information can flow across many steps with little change, controlled by gates", "It removes the need for training", "It stores the whole training set", "It makes the network non-sequential"], "answer": 0, "explain": "Additive updates through forget and input gates let gradients survive over long distances."}, {"q": "What is the long-distance problem of simple RNNs?", "options": ["Information from far back fades — gradients vanish over many steps", "They cannot process short sentences", "They forget the most recent word first", "They need a GPU per word"], "answer": 0, "explain": "Repeated multiplication by the same matrix shrinks (or explodes) the signal."}, {"q": "What did attention fix in the seq2seq model?", "options": ["The fixed-size context-vector bottleneck, by letting the decoder look at every encoder state", "The tokenizer", "The learning rate", "The training data"], "answer": 0, "explain": "Per-step alignment replaced the single compressed summary and became the ancestor of self-attention."}]}</script></div>
