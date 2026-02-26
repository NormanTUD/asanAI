<?php include_once("functions.php"); ?>

<div class="md">
## An Intuition of how Large Language Models (LLMs) work

We can think of LLMs as machines that predict the next most likely word, given a context. Only one word at a time. That word is appended to the input and fed back in, repeating until a special `|endoftext|` token signals the end. In this example, the user enters the text "Once upon a" and lets the LLM continue.

**Step 1: The First Guess**
$$\text{Next Word} = \text{LLM}(\underbrace{\text{"Once upon a"}}_{\text{User Input}}) \rightarrow \text{"time"}$$

**Step 2: The Glue**
$$\text{New Input} = \underbrace{\text{"Once upon a"}}_{\text{User Input}} + \underbrace{\text{"time"}}_{\text{Word 1}} = \text{"Once upon a time"}$$

**Step 3: The Repeat**
$$\text{LLM}(\underbrace{\text{"Once upon a"}}_{\text{User Input}} \ \underbrace{\text{"time"}}_{\text{Word 1}}) \rightarrow \underbrace{\text{"there"}}_{\text{Word 2}}$$

$$\text{LLM}(\underbrace{\text{"Once upon a"}}_{\text{User Input}} \ \underbrace{\text{"time there"}}_{\text{Words 1–2}}) \rightarrow \underbrace{\text{"was"}}_{\text{Word 3}}$$

$$\text{LLM}(\underbrace{\text{"Once upon a"}}_{\text{User Input}} \ \underbrace{\text{"time there was"}}_{\text{Words 1–3}}) \rightarrow \underbrace{\text{"a"}}_{\text{Word 4}}$$

$$\text{LLM}(\underbrace{\text{"Once upon a"}}_{\text{User Input}} \ \underbrace{\text{"time there was a"}}_{\text{Words 1–4}}) \rightarrow \underbrace{\text{"dragon."}}_{\text{Word 5}}$$

$$\text{LLM}(\underbrace{\text{"Once upon a"}}_{\text{User Input}} \ \underbrace{\text{"time there was a dragon."}}_{\text{Words 1–5}}) \rightarrow \underbrace{\texttt{|endoftext|}}_{\text{Stop}}$$

**Final output: "Once upon a time there was a dragon."**

## How does the network do that?

It looks at huge amounts of text and detects how it is structurized and how to imitate it.

First, the input is tokenized
Then Embedding
Then Positional Embedding
Then run through many layers
x = x + layer
Residue stream as global workbook where many "expert" systems for many small things work, like Attention Heads that can see what verb connects to what objects or things like that. Each of these "experts" checks only one "simple" thing (all by doing math).
Then neural networks to decide based on the infos they learnt, where the next would should be.

This document will look into all of those steps in great detail.





## How does the network do that?

The LLM learned to predict the next word by reading **massive** amounts of text (books, websites, articles) and noticing patterns in how language works. But how does it actually go from a string of words to a prediction? Let's walk through it.


### Step 1: Tokenization

Computers don't understand words. They understand numbers. So the very first thing an LLM does is **chop the input into small pieces called tokens**.

$$\text{"Once upon a time"} \rightarrow [\text{"Once"}, \ \text{"upon"}, \ \text{"a"}, \ \text{"time"}]$$

Most tokens are common words or word fragments. For example, `"understanding"` might be split into `"under"` + `"standing"`, two tokens. This way the model can handle words it has never seen before by combining pieces it *has* seen.


### Step 2: Embedding

A raw token doesn't tell the model anything about what a word *means*. So the model replaces each token with a **long list of numbers** (called a vector) that represents its meaning.

$$\text{"king"} \rightarrow [0.22, \ 0.85, \ -0.41, \ 0.09, \ \ldots, \ 0.63]$$

These vectors live in a high-dimensional space where **words with similar meanings end up close together**. "King" and "queen" are near each other. "Banana" and "monarchy" are far apart. Nobody hand-designs these vectors. The model learns them automatically during training, purely from seeing which words appear in similar contexts across billions of sentences.

What's remarkable is that this space captures *relationships*, not just similarity. The most famous example:

$$\vec{\text{king}} - \vec{\text{man}} + \vec{\text{woman}} \approx \vec{\text{queen}}$$

The direction from "man" to "woman" represents something like the concept of gender. That same direction, applied to "king," lands you right next to "queen." The model was never told any of this. These relationships emerge on their own, just from reading text.


### Step 3: Positional Encoding

"The dog bites man" means something very different from "The man bites dog." Same words, different order. So a **positional encoding** is added to each token's embedding, a unique signal that says "I'm the 1st word," "I'm the 2nd word," and so on.

$$\text{Final Input} = \text{Embedding}(\text{token}) + \text{Position}(\text{index})$$

Now each token carries two pieces of information: **what it is** and **where it is**.

This is required, because the embedding and attention operations have no built-in notion of sequence order, so without it, "dog bites man" and "man bites dog" would look identical to the model.

### Step 4: The Transformer Layers

This is the heart of the model. The token vectors flow through **many layers** stacked on top of each other (modern LLMs can have 80+ layers). Each layer refines the model's understanding a little more.

You can think of the token vectors as a **shared notebook** (researchers call it the *residual stream*). Each layer reads from the notebook, does some thinking, and **writes its findings back**:

$$\mathbf{x} := \mathbf{x} + \text{Layer}(\mathbf{x})$$

The `+ x` means each layer **adds** information rather than replacing it. Nothing learned earlier gets thrown away.

Inside each layer, two things happen:

#### 4a: Attention - "Which other words matter for *this* word?"

Attention lets the model **look at other tokens** to understand context. In *"The cat sat on the mat because **it** was tired"*, what does "it" refer to? An **attention head** figures this out by comparing "it" to every other word and deciding that "it" is most related to "cat."

The model has **many attention heads** running in parallel, each a tiny specialist. One might track which noun a pronoun refers to, another might connect verbs to their objects, another might notice adjectives describing nearby nouns.

#### 4b: Feed-Forward Network - "What do I conclude?"

After attention has gathered context, a small **neural network** processes each token individually. This is where the model applies knowledge it memorized during training: facts, patterns, and rules of language.

If attention is *gathering clues*, the feed-forward network is *drawing conclusions*.


### Step 5: The Final Prediction

After all layers, the model takes the **last token's vector** and produces a **score for every word in the vocabulary** (often 50,000+ words). These scores are converted into probabilities:

$$P(\text{"time"}) = 0.72, \quad P(\text{"day"}) = 0.08, \quad P(\text{"hill"}) = 0.002, \quad \ldots$$

The model then **picks a word**, usually one of the top candidates, with a bit of randomness so it doesn't always say the exact same thing. That's what makes it creative.

And then, as we saw in Part I, that word gets appended to the input and the whole process repeats, one word at a time, until the model decides it's done.

**The key insight:** There is no "understanding" module, no grammar checker, no knowledge database. It's all just vectors flowing through layers of simple math: addition, multiplication, and comparison. But stack enough of these simple operations together, and something that *looks a lot like understanding* emerges.

</div>
