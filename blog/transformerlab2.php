<?php include_once("functions.php"); ?>

<div class="md">
## What Transformers do, conceptually

After a sentence is split into tokens via **Byte-Pair-Encoding (BPE)**, it is converted into vectors. However, because Transformers process all tokens in a sentence simultaneously to achieve massive parallelism, the model inherently has no sense of word order, to the attention mechanism, "The dog bit the man" and "The man bit the dog" look identical. To fix this, we use **Positional Encoding**.

Before the first transformer module, we add a unique "position signal" to each token's embedding. This is typically done using sine and cosine functions of different frequencies, ensuring that each position has a unique signature that the model can use to navigate the sequence:

$$h_{0} = \underbrace{\text{Embedding}(\text{Token})}_{\in \mathbb{R}^{d_\text{model}}} + \underbrace{\text{PositionalEncoding}(\text{pos})}_{\in \mathbb{R}^{d_\text{model}}}$$

The task of the subsequent modules is to position this **Hidden State** $h$ within a high-dimensional **Feature Space** so that it represents the sentence’s meaning relative to specific types of information. For example, in the sentence *"I will learn how transformers work"*, one attention head might link *"will"* strongly with *"learn"* to capture temporal meaning (future tense). Another might react to the relationship between *"learn"* and *"work"*. However, because of BPE tokenization, the model often works with sub-word units. In German, where "I go" is *"Ich laufe"* and "you go" is *"du läufst"*, the LLM might encode the stem *"lauf-"* (and *"läuf-"* very near to *"lauf-"*) as a core entity, while the endings *"##e"* and *"##st"* provide the grammatical context. The **Hidden State** of a token is essentially a vector being pulled in different directions by these relationships.

### The Architecture of Attention
We stack these layers deeply, sometimes hundreds of levels high. To prevent the gradient during training from vanishing (the \citealternativetitle{hochreiter1991vanishing}) into insignificance, we use the residual connection method pioneered by \citeauthor{he2015resnet}. We add the original input to the output of the attention mechanism:

$$h_1 = h_0 + \text{Attention}(\text{LayerNorm}(x))$$

Each layer contains multiple **Attention Heads** working in parallel. It is important to remember that these heads do not have a human-defined "purpose." This is similar to the \citealternativetitle{grandmotherneuron}, an urban legend in neuroscience claiming a single neuron represents one's grandmother. In the reality of the human brain, and in Transformers, meaning is emergent and distributed. As \citeauthor{heraclitus500fragments} noted: *"The hidden harmony is better than the obvious"* (which goes in the same direction as the \citealternativetitle{sutton2019bitter}). The dimensions in this space are often too abstract for human language to name and should not be antromorphized.

#### The Feed-Forward Network: The "Knowledge" Store
Once the attention heads have finished looking around the sentence to see which words relate to each other, their results are concatenated and projected back into the main Feature Space. This combined information is then passed into the **Feed-Forward Neural Network (FFN)**:

$$h_2 = h_1 + \text{FFN}(\text{LayerNorm}(y))$$

While the attention mechanism decides *what* to look at, the FFN decides *what to do* with that information. Most researchers consider the FFN, usually consisting of two dense layers with an activation function like **ReLU** or **GeLU**, to be the place where the model's "world knowledge" is stored (see \citetitle{keyvalmem}). It transforms the context-aware vector into a final state that "points" toward the most logical next concept in the embedding space.

#### From Hidden States to Probabilities
After the hidden state has passed through all layers, it is used to predict the next token. The final hidden state is compared against every token in the model's vocabulary. This is done by multiplying the state by the transpose of the original vocabulary matrix to create **Logits**:

$$\text{Logits} = h_{\text{final}} \cdot W_{\text{Vocab}}^T$$

The Logits represent raw scores for every possible word. To turn these into something we can use, we pass them through a **SoftMax** function to create a probability distribution:

$$\text{SoftMax}(\text{Logits}) \rightarrow \text{Probability of all tokens}$$

Finally, we apply **Temperature**. A **Low Temperature** makes the distribution "sharper," picking only the most likely words for accuracy. A **High Temperature** spreads the likelihood out, allowing the model to pick less obvious tokens, which results in more creative or "human-like" responses.

This architecture subordinates to the \citealternativetitle{sutton2019bitter}: it favors massive computation and data over hand-crafted linguistic rules. By using GPUs to process these vectors in parallel, the Transformer builds a context-dependent, geometrical representation of "meaning" that effectively reconstructs the world, one token at a time.
</div>
