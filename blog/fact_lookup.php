<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Where "Paris" Lives — How an LLM Retrieves a Fact
description: A walk through the forward pass: residual streams, MLP key-value memory, attention, the linear representation hypothesis, and the honest limits of what we know.
icon: &#127757;
part: 4
order: 27
color: sky
topics: interpretability, architecture, language, math-ii
-->

<div class="md">
Type the words **"The capital of France is "** into a chat model. Press enter. The next token comes back: **"Paris"**. Most users treat this as ordinary. It is not. It is, arguably, the deepest open question in modern AI, dressed up as a trivia question.

The picture we sketch in this chapter is the best current answer that the mechanistic interpretability community has been able to put together. Each piece is backed by experiments on real models. Each piece is also incomplete. We will be honest about both. *Nobody* knows the full story, not the model authors, not the interpretability researchers, not the theorists. What we have is a stack of partial theories, each with published evidence, that together form a coherent working picture. The picture is, by the consensus of the field, *almost certainly not the whole picture*.
</div>

<div class="md">
## 0. The question, re-framed

First, the word "knows". It is doing a lot of work in the question "how does it know to reply Paris?", and most of that work is misleading. We do **not** mean:

- conscious recall,
- declarative memory in the human sense,
- a database lookup,
- a symbolic reasoning step,
- the model "understanding" geography.

We mean something much more specific and much more boring. The trained model is a function

<p>$$\underbrace{f_\theta}_{\text{the trained network}} \;:\; \underbrace{\mathcal{X}}_{\text{all possible token sequences}} \;\longrightarrow\; \underbrace{\Delta^{|V|-1}}_{\text{a probability distribution over the vocabulary}}$$</p>

<p>$$\underbrace{\text{the trained network takes a prompt and returns a probability distribution over the next token.}}_{\text{the same statement, in plain English}}$$</p>

Here $\mathcal{X}$ is the set of all finite token sequences, $V$ is the vocabulary of size $|V|$, and $\Delta^{|V|-1}$ is the probability simplex (the set of all probability distributions over $|V|$ outcomes). The question becomes: *why does $f_\theta$, applied to the prompt "The capital of France is", assign high probability to the token "Paris"?* That is a well-posed mathematical question. The answer will not tell us what Paris *is*. It will tell us what shape of computation inside the network produces that token.

The whole rest of this chapter is an answer to that question, in eleven pieces, with the bits we don't know labelled honestly as we go.

<div class="optional md" data-headline="A note on what 'fact retrieval' even means inside a next-token predictor">
A language model is trained to do one thing: predict the next token in a sequence. It is *not* trained on a curriculum of trivia questions, and it is *not* given a goal of being factually accurate. It is trained on a slice of human text, with the loss $-\log P(t_{i+1} \mid t_1, \ldots, t_i)$. The fact "the capital of France is Paris" is only useful to the model insofar as it lowers that loss on internet text. If, in some hypothetical corpus, every sentence that started "the capital of France is" were followed by the word "Lyon", the model would learn "Lyon" with equal enthusiasm, and with the same kind of internal mechanism. This is what people mean when they say language models have no "ground truth" — they are not in the business of truth, they are in the business of likelihood. That a likelihood-maximizer ends up saying anything we would call a fact at all is itself one of the surprises of the last decade, and it is what makes the question worth asking.
</div>
</div>

<div class="md">
## 1. What the model actually computes, top to bottom

The forward pass that turns "The capital of France is " into a distribution over next tokens is short. In a modern decoder-only Transformer like those behind GPT, Claude, and LLaMA, it looks like this:

<p>$$\underbrace{t_1, \ldots, t_n}_{\text{token IDs}} \xrightarrow{W_E} \underbrace{x_1^{(0)}, \ldots, x_n^{(0)}}_{\text{embeddings} + \text{positions}} \xrightarrow{\text{block 1}} \cdots \xrightarrow{\text{block } L} \underbrace{x_1^{(L)}, \ldots, x_n^{(L)}}_{\text{final residual stream}} \xrightarrow{W_U} \underbrace{\ell \in \mathbb{R}^{|V|}}_{\text{logits}} \xrightarrow{\text{softmax}} p$$</p>

Five stages, each a deterministic matrix operation plus an elementwise nonlinearity.

1. **Tokenization.** The string is split into tokens from a fixed vocabulary $V$ (size $|V| \approx 32\text{k} - 200\text{k}$ depending on the tokenizer). Each token is an integer $t_i$.
2. **Embedding.** Each integer $t_i$ is looked up in an embedding matrix $W_E \in \mathbb{R}^{|V| \times d}$, giving a vector $x_i^{(0)} \in \mathbb{R}^d$. A positional embedding is added to encode the position.
3. **$L$ Transformer blocks.** Each block computes, at every position $i$, an attention output and an MLP output, and *adds* both to the residual stream. We will spend most of this chapter inside this step.
4. **Unembedding.** The last residual stream at the *final position* (the position where we want to predict the next token) is multiplied by the unembedding matrix $W_U \in \mathbb{R}^{d \times |V|}$ to produce a logit vector $\ell$.
5. **Softmax.** The logits are exponentiated and normalized to produce a probability distribution $p$ over the vocabulary.

That is the entire computation. There is no lookup table, no symbolic database, no hidden "memory module" the model secretly consults. There is just $W_E$, $L$ stacked blocks, $W_U$, and a softmax. All the "knowledge" of Paris is in the weights $\theta$.

This sounds too austere to be true. The next sections will fill in how it can nevertheless produce Paris.
</div>

<div class="md">
## 2. The residual stream as a public scratchpad

The single most important structural fact about a Transformer is the **residual stream**: a single vector $x_i^{(\ell)} \in \mathbb{R}^d$ at every layer $\ell$ and every position $i$, to which every component *adds* its output \cite{elhage2021mathematical}. Concretely:

<p>$$x_i^{(\ell)} = x_i^{(\ell-1)} + \text{attn}^{(\ell)}(x^{(\ell-1)})_i + \text{MLP}^{(\ell)}(x^{(\ell-1)})_i$$</p>

After $L$ layers,

<p>$$x_i^{(L)} = x_i^{(0)} + \sum_{\ell=1}^{L} \Big( \text{attn}^{(\ell)}(x^{(\ell-1)})_i + \text{MLP}^{(\ell)}(x^{(\ell-1)})_i \Big)$$</p>

The residual stream is a *public* scratchpad: every attention head and every MLP layer reads from it and writes to it. The crucial word is *additive*: nothing in the architecture forces components to overwrite each other, they just add their contributions. This means a circuit for any specific behavior can be isolated as a sum of contributions from specific components at specific layers \cite{elhage2021mathematical}.

For our prompt, the residual stream at the final position starts as the embedding of " ", plus a positional encoding for position 5. After $L$ iterations of "attention read this, MLP write something", it ends up as a vector that, when multiplied by $W_U$, gives a logit on "Paris" that is much larger than the logit on "Lyon" or "Berlin".

<div class="optional md" data-headline="Why 'additive' matters, geometrically">
If you have ever tried to debug a neural network where one component *overwrites* another's output, you know the pain: the intermediate state is non-recoverable, and you cannot reason about what each component contributed. The residual connection $x \mapsto x + f(x)$ is the architectural choice that turns a Transformer from a black box into a *decomposable* black box. Every component's contribution is literally a vector that can be read off the residual stream and inspected. Almost every interpretability trick we will use in this chapter rests on this additivity.
</div>
</div>

<div class="md">
## 3. Attention: routing "France" to the end

For the prompt "The capital of France is ", the first thing the model has to do is *figure out which tokens matter*. The word "is" is a verb that wants an object. The object is a country. The country is "France", which appeared three tokens earlier. The mechanism for this routing is **self-attention** \cite{vaswani2017attention}.

Each attention head computes three projections of the residual stream at every position:

<p>$$Q_i = W_Q x_i, \qquad K_i = W_K x_i, \qquad V_i = W_V x_i$$</p>

The attention pattern is the softmax of query-key dot products:

<p>$$\alpha_{i \to j} = \mathrm{softmax}_j\!\left(\frac{Q_i^\top K_j}{\sqrt{d_k}}\right)$$</p>

and the head's output at position $i$ is

<p>$$\text{head}(x)_i = W_O \sum_j \alpha_{i \to j}\, V_j$$</p>

For our prompt, in the early layers, attention is mostly doing *local* work — each token looks at its neighbours. By the middle layers, particular attention heads have learned to route specific pieces of information. One head, in some layer, becomes a "previous-token head" that attends to whatever came immediately before each token. Another head, in a later layer, learns to attend *from the final position back to the position where "France" sits* \cite{olsson2022induction}. The result is that the residual stream at the final position ends up containing information about "France" that the embedding alone did not put there.

A useful decomposition, due to \citeauthor{elhage2021mathematical} \cite{elhage2021mathematical}, is to split each head into its **QK circuit** ($W_Q^\top W_K$, the matrix that decides *where to look*) and its **OV circuit** ($W_O W_V$, the matrix that decides *what to write when looking*). For an "I want to read 'France'" head, the QK matrix makes the final position attend strongly to the "France" position, and the OV matrix is approximately the identity in the relevant subspace — it copies what it reads.
</div>

<div class="md">
## 4. The MLP as a soft key-value memory

If attention is the routing layer — the part that figures out *which* information matters — then the **MLP layers** are where the *content* of the model's knowledge actually lives. This is the most important conceptual claim in this chapter, and it has substantial experimental support.

A Transformer block's MLP is a two-layer feed-forward network applied independently at every position:

<p>$$\text{MLP}(x) = \sigma(x W_1 + b_1)\, W_2 + b_2$$</p>

with $\sigma$ typically being GeLU. \citeauthor{keyvalmem} \cite{keyvalmem} made the observation that turned this into a research program: the rows of $W_1$ can be read as **keys** (input patterns the neuron "looks for"), and the corresponding columns of $W_2$ as **values** (vectors to write into the residual stream when that key matches). The activation $\sigma(x W_1)$ is the *soft* match score against every key.

The analogy to a hash table is exact. A literal hash table would, given $x$, find the one key $k^*$ that exactly matches and return its value $v^*$. The MLP does the same thing *approximately*: multiple keys can match with different scores, and the output is a weighted average of their values, weighted by match strength. This is a **soft associative memory**:

<p>$$\text{MLP}(x) \;\approx\; \sum_{j} \underbrace{\sigma(x \cdot k_j)}_{\text{key match}} \cdot \underbrace{v_j}_{\text{value}}$$</p>

How big is this memory? For GPT-2 small ($d = 768$, $d_{\text{ff}} = 4d = 3072$), each MLP layer has 3072 keys and 3072 values. Twelve layers gives roughly $12 \times 3072 \approx 37{,}000$ key-value pairs. For a frontier-scale model in the 70B–400B parameter range, the total number of FFN parameters is in the hundreds of billions, distributed across 80+ layers, each with $d_{\text{ff}} \approx 4d$ to $8d$ keys. The numbers get large enough that, even after correcting for the fact that many "keys" are not interpretable as anything human-friendly, there is enough capacity to store a remarkable amount of associative knowledge.

<div class="optional md" data-headline="Why 'soft' matters for what counts as a 'fact'">
A hard hash table stores a fact or it doesn't. A soft key-value memory does something more interesting: it stores *fuzzy* facts. The key "the capital of France is" and the key "France's capital is" can both partially activate the same value vector — that's why the model answers Paris whether you phrase the question as "the capital of France is", "what is the capital of France", or "Paris is the capital of". In a hard lookup world, only one of those phrasings would hit. The fuzziness is what makes the model robust to paraphrase.
</div>

### Where "Paris" specifically lives

So there is a cloud of soft key-value pairs in the model's weights. The question is: is "Paris is the capital of France" stored *somewhere specific*, or is it smeared across millions of pairs in some inseparable way? The experimental evidence from the last few years is, surprisingly clearly: *somewhere specific*.

\citeauthor{dai2022knowledgeneurons} \cite{dai2022knowledgeneurons} introduced the **knowledge neuron** framework. For a relational fact like "the Space Needle is in Seattle", they:

1. Run the cloze query "The Space Needle is located in the city of \_\_\_" through the model and identify the layer where the answer first becomes confidently "Seattle".
2. Use integrated-gradients attribution to find which neurons in that layer's MLP, and which intermediate dimensions in the residual stream, are most responsible for the prediction.
3. **Suppress** those neurons (set their activations to zero) and watch the prediction collapse to "Seattle" → other plausible city, or "Seattle" → something unrelated.
4. **Amplify** those neurons and watch the prediction become over-confidently "Seattle" even in contexts where it shouldn't.

For BERT-style models, they find a small number of mid-layer MLP neurons whose activation is robustly correlated with the expression of specific facts. The correlations are not perfectly monosemantic (more on this in §9), but they are strong enough to suggest that the model *is* doing something like "for this subject–relation pair, write the corresponding object into the residual stream" at identifiable locations.

This is the closest thing we have to a smoking gun: there exist *local, causally important* sites in the network for specific factual associations. Not a single "grandmother cell" — a small cluster of mid-layer MLP neurons acting as a soft key-value pair.
</div>

<div class="md">
## 5. Opening up one fact: ROME

The most dramatic experimental evidence that facts live in identifiable, narrow regions of the weights comes from \citeauthor{meng2022locating} \cite{meng2022locating} and their method **ROME** — *Rank-One Model Editing*.

Their procedure:

1. Identify, for a specific factual prompt like "The Eiffel Tower is in", *which* mid-layer MLP block in the model (they studied GPT-J) is most responsible for the prediction "Paris". They do this with causal tracing: they run the model, then re-run it with one component at a time replaced by a corrupted version, and measure how much the prediction degrades.
2. Confirm that the responsible block is small in scope: most other facts are unaffected by perturbations to that block.
3. **Edit** the fact by applying a rank-one update to the block's $W_2$ matrix, chosen so that the block now reads "The Eiffel Tower is in → Rome" instead.

The result: after the edit, the model says Rome when asked about the Eiffel Tower, says Rome when asked "Where is the Eiffel Tower?", says Rome when given "Eiffel Tower: ___" — and, crucially, *still says Paris when asked about the capital of France*. The edit is local. The new fact is added without disrupting nearby facts.

This is more than an editing trick. It is direct experimental evidence that **factual associations are stored as low-rank, locally-modifiable structures in the weights**. If facts were smeared diffusely across the network, no rank-one update could change one without ruining others. The fact that this works — and works robustly across many subjects and relations \cite{meng2022memit} — is the strongest evidence we have that the soft-key-value-memory picture in §4 is more than just an analogy.

<div class="optional md" data-headline="What ROME does not prove">
Honest caveats. ROME is not a complete theory of fact storage. It is one experimental tool that shows *some* facts can be edited locally; it does not show that *all* facts are stored this way. Multi-hop facts, rare facts, and facts that contradict earlier-trained facts are harder to edit cleanly. And the edits sometimes do ripple, in ways that are not yet fully understood. The picture in §4 is therefore a *best current model* of fact storage, with explicit annotations about where it is shaky.
</div>
</div>

<div class="md">
## 6. Facts as directions: the linear representation hypothesis

The third piece of the picture is the most surprising, and the most contested.

A long line of work, going back to the famous "king − man + woman ≈ queen" result on word embeddings, has found that *semantic relations are linear operations in the model's representation space*. \citeauthor{park2024linear} \cite{park2024linear} made this rigorous with the **linear representation hypothesis**: a concept like "country → capital" is a *direction* in the residual stream, and the model's internal representations of words are arranged so that moving along that direction in the embedding of "France" lands you near the embedding of "Paris".

Concretely, if $\gamma(w) \in \mathbb{R}^{d}$ denotes the unembedding-row vector for word $w$ (so that the logit for $w$ is $\gamma(w) \cdot x$), the hypothesis predicts

<p>$$\gamma(\text{Paris}) \;-\; \gamma(\text{France}) \;\approx\; \gamma(\text{Berlin}) \;-\; \gamma(\text{Germany}) \;\approx\; \gamma(\text{Tokyo}) \;-\; \gamma(\text{Japan})$$</p>

That is: the *vector* from "France" to "Paris" is approximately the same vector as the one from "Germany" to "Berlin". The relation "is the capital of" is being represented as a single direction $\bar{r}$ in the unembedding space, such that for any country $c$,

<p>$$\gamma(\text{capital}(c)) \;\approx\; \gamma(c) + \bar{r}$$</p>

A related and equally striking line of evidence is the **function vector** finding of \citeauthor{todd2024functionvectors} \cite{todd2024functionvectors}. They give the model an in-context task — a few examples of "French: chien → dog; Spanish: gato → cat; English: ___ → ?" — and show that a small number of attention heads in the middle layers carry a *single vector* that encodes "the task is translate from {French, Spanish, English} to English". They then extract that vector from one prompt, *inject* it into the residual stream of an entirely different prompt ("the cheese is ___"), and the model performs the translation task on the new prompt, even though the new prompt has no in-context examples.

Putting §4 and §6 together: **a fact is not stored as a key-value pair in one location, but as a *direction* in the residual stream that the key-value lookup is responsible for writing**. The MLP at layer $\ell$ contains the key "if input looks like a country with a capital-relation context, write the vector $\bar{r}$ into the residual stream". The unembedding $W_U$ then converts $\bar{r}$ into the logit pattern that puts mass on the correct answer.

This is the linear-representation + soft-key-value-memory picture in one breath. It is the picture that *most* current interpretability researchers are betting on, and it has the strongest convergence between theory (Park et al.'s causal inner product) and experiment (ROME, function vectors, knowledge neurons).
</div>

<div class="md">
## 7. Watching the answer form: the logit lens

All of the above is the result of careful *post-hoc* analysis: you run the model, find what mattered, edit it, see what changes. There is also a much simpler trick that lets you *watch the answer form in real time* as the forward pass progresses: the **logit lens**.

The idea, introduced by \citeauthor{nostalgebraist2020logitlens} \cite{nostalgebraist2020logitlens} and refined into the **tuned lens** by \citeauthor{belrose2023tunedlens} \cite{belrose2023tunedlens}, is to apply the unembedding matrix $W_U$ to the residual stream at *every* layer, not just the final one:

<p>$$\text{logits}^{(\ell)} = W_U \cdot x^{(\ell)}$$</p>

In a well-trained Transformer, the intermediate residual streams are already *approximately* in the unembedding basis (this is a consequence of the residual structure, weight decay, and the fact that the model is being trained end-to-end to produce a useful final residual stream). So the logits you get from intermediate layers are a meaningful, if imperfect, readout of "what would the model predict if it had to stop here?".

Empirically, for a prompt like "The capital of France is", the logit-lens readout across layers looks something like:

| Layer | Top decoded token | Interpretation |
|---|---|---|
| 1–4 | "France", "Paris", "the" | shallow pattern matching; nothing confident yet |
| 5–10 | "Paris", "Lyon", "Versailles" | the right semantic neighbourhood |
| 15–25 | "Paris" with growing margin | the model has decided |
| 30–40 | "Paris" with high margin | refinement, hedging, suppression of alternatives |

The midpoint is where the *decision* happens, in the sense that "Paris" enters the top-1 and stays there. The last 20 or so layers are mostly refinement: nudging the probability mass around, suppressing alternative candidates ("Lyon", "Versailles"), making sure the next-character predictions ("P", "Pa", "Par", "Pari", "Paris") stay consistent. This is also why **early-exit** methods — predicting from layer $L/2$ instead of layer $L$ — sometimes work surprisingly well \cite{elhage2021mathematical}: by the middle, the model has often already committed to the answer.

<div class="optional md" data-headline="What the logit lens is and is not">
The logit lens is a *diagnostic*, not a measurement of what the model is "thinking". When you apply $W_U$ at layer 15, you are asking: *if I had to output a token right now, which one would I pick?* The model does not actually output a token at layer 15. The lens tells you what the residual stream at layer 15 has come to represent in unembedding space — which is informative, because the unembedding is what determines the final output. The **tuned lens** \cite{belrose2023tunedlens} improves on this by learning a small per-layer affine correction, which fixes the bias that earlier layers use slightly different bases than the unembedding expects. Use the logit lens for intuition, the tuned lens when you want to be rigorous.
</div>
</div>

<div class="md">
## 8. The attractor analogy, honestly

There is a tempting picture that goes like this. The residual stream starts somewhere — a vector near the embedding of " ", perturbed by attention that has read "France" from earlier. As it passes through layer after layer, it gets *pulled* toward a region of $\mathbb{R}^d$ that decodes to "Paris". Other prompts — "The capital of Germany is", "2 + 2 =", "Once upon a" — get pulled toward different regions. The picture is of basins of attraction, like a Hopfield network or a dynamical system with fixed points.

This picture is *suggestive* and *partially grounded*, but it is not, as of this writing, a theorem. Let us say what is and isn't known.

### What is grounded

The connection between Transformer attention and modern Hopfield networks is mathematically precise. \citeauthor{ramsauer2020hopfield} \cite{ramsauer2020hopfield} showed that the attention update rule

<p>$$\xi_i^{\text{new}} = \mathrm{softmax}(\beta \, X X^\top)\, X$$</p>

with $\beta \propto 1/\sqrt{d_k}$, is *exactly* the update rule of a continuous-state Hopfield network with energy function

<p>$$E = -\mathrm{lse}(\beta, X X^\top) + \tfrac{1}{2}\xi^\top \xi + \tfrac{1}{2}\sum_j x_j^\top x_j$$</p>

where $\mathrm{lse}$ is the log-sum-exp. The classical Hopfield network of \citeauthor{hopfield1982} \cite{hopfield1982} was the original "associative memory with basins of attraction" architecture. So the *attention mechanism* in a Transformer is, formally, an iterative retrieval rule from a generalized Hopfield model. That is a real mathematical fact.

### What is suggested but not proven

From this, it is *tempting* to conclude that the whole residual stream is being "attracted" toward stored memory states across layers. The logit-lens evidence (§7) is consistent with this picture — predictions become more confident as layers progress, as if the residual stream is converging toward an attractor. The function-vector evidence (§6) is consistent — small vectors steer predictions, as if the residual stream were being gently pushed toward a different basin.

### What is wrong with the picture

Three honest problems with calling this "attractor dynamics" in the strict sense:

1. **No iteration to convergence.** A Transformer runs for a *fixed* $L$ layers and then stops. There is no convergence criterion, no "until the residual stream stops changing" loop. The forward pass is a finite-length trajectory, not a flow. Calling the endpoint an "attractor" is loose.
2. **No energy function for the *whole* model.** Ramsauer et al.'s result gives an energy function for the *attention* operation alone. The MLP layers, the residual connections, and the layer-normalization steps between blocks do not obviously combine into a single energy function. Whether the full Transformer is a gradient-flow on some learned energy is an open conjecture, not a theorem.
3. **Linear-ish, not nonlinear.** Real Hopfield dynamics are nonlinear, and "basin of attraction" is a nonlinear concept. The Transformer dynamics are mostly linear-ish (residual connections, layer norm) with isolated nonlinearities (softmax, GeLU). It is not clear that the language of basins carries over.

So: the *attention* part of the Transformer is mathematically a Hopfield-style associative memory. The *whole* Transformer is, *maybe*, doing something attractor-like, but the evidence is empirical (logit lens, function vectors) and the formal justification is incomplete.

### On chaos theory

You may have heard LLMs described as "high-dimensional dynamical systems", and dynamical systems make people think of chaos. Let us be careful here, because the word *chaos* has a technical meaning (sensitivity to initial conditions, topological mixing, dense periodic orbits) that does not strictly apply.

The forward pass of an LLM is *deterministic*. Given the same prompt and the same weights, you get the same logits. So it is not literally chaotic in the sense of "small changes blow up exponentially over time". What *is* true is that the learned function is **sensitive to its inputs in semantically meaningful ways**: a one-token change in the prompt ("The capital of France is" → "The capital of Germany is") produces a large, semantically coherent change in the output. This is sensitivity *of the function*, not sensitivity *of a dynamical system*. The word "chaos" is evocative but technically wrong here.

The forward pass is also, empirically, mostly **contractive**: semantically similar prompts land nearby in the residual stream. That is the opposite of chaos. So when this chapter says "the residual stream is being attracted toward a region that decodes to Paris", the right word is *attraction*, in the colloquial sense, not *chaos* in the dynamical-systems sense. Take the analogy as a useful lens, not a literal claim about the math.
</div>

<div class="md">
## 9. Superposition: why there is no "grandmother cell"

There is an obvious question lurking behind §4 and §5. If facts live in MLP neurons, why is it that you cannot just open up a 7-billion-parameter model, look at the neurons one by one, and find the neuron that fires for "Paris"?

The answer is **superposition** \cite{elhage2022superposition}: the model represents more features than it has dimensions, by encoding features as nearly-orthogonal directions in activation space.

In high dimensions, you can pack exponentially many nearly-orthogonal vectors. If $d = 4096$, the number of unit vectors that are pairwise at angle at least $90° - \epsilon$ is exponential in $d$. The model exploits this: it stores thousands or millions of interpretable features ("this is a French word", "this is the subject of a sentence", "this token activates the 'capital of X' key") as directions in the residual stream, *not* as individual neurons. A single neuron ends up participating in many features; a single feature ends up spread across many neurons.

This is why the knowledge-neuron finding of \citeauthor{dai2022knowledgeneurons} \cite{dai2022knowledgeneurons} is *remarkable*: it works *despite* superposition. Some neurons end up monosemantic for specific facts because, during training, the optimization finds it cheaper to dedicate a few neurons to frequently-retrieved facts than to spread those facts across the superposition soup.

The systematic way to *recover* monosemantic features from a superposed residual stream is the **sparse autoencoder** \cite{cunningham2023sparse}. A sparse autoencoder is a small network trained to decompose the residual stream into a much larger dictionary of sparse features, such that each feature fires for a single human-interpretable concept. This is an active research area; the current best SAEs recover tens of millions of interpretable features from a frontier model, and they have been used to find features that correlate with specific factual associations, specific syntactic structures, specific sentiment, and specific safety-relevant concepts.
</div>

<div class="md">
## 10. Three honest limits

The picture in §3–§9 is the best current account, and it is the one most mechanistic interpretability researchers would defend at a conference. It is also incomplete in ways that matter.

### Scale gap

Almost all the experiments cited in this chapter — ROME, knowledge neurons, induction heads, logit lens — were done on models in the 100M–7B parameter range: BERT-base, GPT-2 small, GPT-J. Frontier models in 2025–2026 are 100× to 1000× larger. There is *no rigorous evidence* that the same mechanisms apply at scale. It is plausible that 70B-parameter models use additional mechanisms we have not yet discovered (more elaborate multi-step retrieval, more compositional circuits, more hierarchical memory). We genuinely do not know.

### Multi-hop and composition

The picture works well for single-hop retrieval: "the capital of X is Y" → look up X, return Y. It is much less clear for multi-hop: "the wife of the actor who played Batman in 1989 is". This requires the model to *compose* several retrieved facts: identify Batman-1989 → Michael Keaton, identify Keaton's wife → Caroline McWilliams (or whoever the model thinks). We do not have a clean mechanistic story for this. There is some evidence that multi-hop reasoning uses chains of attention heads acting as a kind of scratchpad in the residual stream \cite{olsson2022induction}, but it is not as crisp as the single-fact picture. This is one of the most active areas of current research.

### Facts vs. world models

When the model says "Paris", is it because it has an internal *model* of the world in which France has a capital called Paris? Or is it because it has memorized a soft key-value pair that happens to fire on this context?

The most striking evidence that LLMs *can* build internal models — not just lookups — comes from \citeauthor{li2022othello_iclr} \cite{li2022othello_iclr}. They trained a GPT-style model on legal Othello moves *with no information about the board*. Probing experiments revealed that the model had spontaneously built an internal representation of the board state, accurate enough that interventions on the representation produced the predicted changes in next-move predictions. This is a *world model*, in a meaningful sense, learned purely from next-token prediction.

For factual knowledge about the real world, the situation is murkier. Frontier models behave as if they have a *partial* world model: they can answer questions they were never directly trained on, by combining retrieved facts. But it is unclear whether that world model is a coherent geometric structure in the residual stream (something like a map of Europe with Paris marked on it) or a vast, mostly-flat lookup table with cross-references. Probably both, in unknown proportions.

The honest summary is that the *mechanism* of fact retrieval is reasonably well-understood at small scale and for single-hop facts, and that the *structure* of what is being retrieved — flat lookup vs. hierarchical world model — is one of the deepest open questions in interpretability.
</div>

<div class="md">
## 11. Putting it together

Here is the picture in one breath, with citations:

<p>$$\underbrace{t_1, \ldots, t_n}_{\text{tokens}} \xrightarrow{W_E} \underbrace{x^{(0)}}_{\text{resid. stream}} \xrightarrow{L \text{ times}} \underbrace{x^{(L)}}_{\text{resid. stream}} \xrightarrow{W_U} \underbrace{\ell}_{\text{logits}} \xrightarrow{\text{softmax}} \underbrace{p}_{\text{distribution}}$$</p>

At each of the $L$ iterations:

- **Attention** \cite{vaswani2017attention, elhage2021mathematical} routes information between positions: in our prompt, the critical job is making the final position attend back to the position holding "France".
- **MLP** \cite{keyvalmem} performs a soft key-value lookup: somewhere in the weight matrices $W_1, W_2$ is a key that activates on "country with capital-relation context" and a value that writes the "capital-of-X" direction \cite{park2024linear} into the residual stream.
- **Residual addition** \cite{elhage2021mathematical} accumulates these contributions into a single public vector.
- After the final layer, **$W_U$ unembeds** the residual stream into vocabulary logits. The logit for "Paris" is large because the residual stream has been pulled close to the unembedding direction of "Paris".
- **Softmax** turns the logits into a probability distribution over the next token.

This picture has been confirmed in pieces by ROME-style edits \cite{meng2022locating, meng2022memit}, knowledge-neuron attributions \cite{dai2022knowledgeneurons}, function-vector steering \cite{todd2024functionvectors}, induction-head analysis \cite{olsson2022induction}, logit-lens inspection \cite{nostalgebraist2020logitlens, belrose2023tunedlens}, and superposition-aware feature extraction \cite{elhage2022superposition, cunningham2023sparse}. It is consistent with the Hopfield-network interpretation of attention \cite{ramsauer2020hopfield, hopfield1982}. It is also, almost certainly, not the whole picture for frontier-scale models or multi-hop reasoning.

That is the state of the art in mid-2026. The next token "Paris" is not retrieved from a database. It is *computed*, by a function $f_\theta$ that maps an input vector to a residual stream that has been nudged, layer by layer, into a region of $\mathbb{R}^d$ where the unembedding matrix gives high logit to the right answer. We know roughly *which* layers do the nudging, *which* matrices hold the knowledge, *which* directions encode which relations. We do not yet know *why* this is the optimal way to store the information, *whether* the same mechanism works at frontier scale, or *whether* the model has anything like an internal world map of Europe with Paris marked on it.

Those are open questions. They are the questions the next decade of interpretability research will be asking.
</div>

<div class="md">
## 12. What to carry away

Five things, restated as a checklist.

1. **"Knows" means: the function $f_\theta$ assigns high probability to the right token.** Nothing more. Nothing less. This is a precise mathematical claim and a useful starting point.
2. **Knowledge lives in the MLP layers as soft key-value pairs.** Attention is the routing layer; MLPs are the storage. This is supported by ROME, knowledge neurons, and function vectors.
3. **Facts are directions in the residual stream.** "Capital of X" is a direction; adding it to the embedding of "France" gives you the embedding of "Paris". This is the linear representation hypothesis, and it is the picture most consistent with all the experimental evidence.
4. **The decision happens in the middle layers, not the end.** By roughly layer $L/2$, the model has usually committed to "Paris" and the rest is refinement. This is the logit-lens finding.
5. **The picture is incomplete.** Scale gap, multi-hop composition, and the lookup-vs-world-model distinction are all open. Anyone who tells you they have the full story is selling something.

If those five points are in your head, you understand roughly as much about fact retrieval in LLMs as any working researcher in 2026. The remaining open questions are deep, but the parts we *do* know are now formally grounded, experimentally tested, and converging on a coherent picture.
</div>
</div>
