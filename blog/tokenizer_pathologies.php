<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Tokenizer Pathologies
description: The quiet bias in how text becomes tokens: multilingual token inflation, byte-level BPE versus unigram, and the road toward tokenizer-free models.
icon: &#128172;
part: 4
order: 19
color: sky
topics: architecture, language
tags: code-heavy
math: 30
-->

<div class="md" data-lesson-id="tokenizer_pathologies">
[Tokenization](tokenizerlab.php) showed you the *mechanism*: how a stream of characters is chopped into a fixed vocabulary of subwords so a discrete, finite model can process open-ended text. This chapter is the *consequence* of that mechanism — the part that is easy to miss because it is invisible in a single-language demo. A tokenizer is not a neutral preprocessing step. It is a **bias**, baked into the model before a single weight is trained, and it prices every language differently. Two of the most consequential, least-discussed properties of a modern LLM — why it costs more to speak in one language than another, and why it sometimes fails in exactly the ways the [Strawberry demo](tokenizerlab.php) hinted at — live here.
</div>

<div class="md">
## The choices that were never obvious

Building a vocabulary is a decision, not a default. The options form a spectrum, and each one optimizes a different trade-off:

<figure>
	<svg viewBox="0 0 560 90" role="img" aria-label="The subword spectrum from word-level to byte-level, with BPE and unigram in between" style="width:100%; height:auto; max-width:560px; display:block; margin:0 auto;">
		<line x1="20" y1="45" x2="540" y2="45" stroke="var(--mn-border)" stroke-width="2"/>
		<circle cx="40" cy="45" r="7" fill="var(--mn-accent)"/>
		<text x="40" y="75" text-anchor="middle" font-size="12" fill="var(--mn-text)">word-level</text>
		<text x="40" y="24" text-anchor="middle" font-size="11" fill="var(--mn-text-secondary)">small vocab, many unknowns</text>
		<circle cx="190" cy="45" r="7" fill="var(--mn-accent)"/>
		<text x="190" y="75" text-anchor="middle" font-size="12" fill="var(--mn-text)">BPE</text>
		<text x="190" y="24" text-anchor="middle" font-size="11" fill="var(--mn-text-secondary)">merge frequent pairs</text>
		<circle cx="340" cy="45" r="7" fill="var(--mn-accent)"/>
		<text x="340" y="75" text-anchor="middle" font-size="12" fill="var(--mn-text)">unigram</text>
		<text x="340" y="24" text-anchor="middle" font-size="11" fill="var(--mn-text-secondary)">LM-pruned, stochastic</text>
		<circle cx="490" cy="45" r="7" fill="var(--mn-accent)"/>
		<text x="490" y="75" text-anchor="middle" font-size="12" fill="var(--mn-text)">byte-level</text>
		<text x="490" y="24" text-anchor="middle" font-size="11" fill="var(--mn-text-secondary)">never an unknown</text>
	</svg>
	<figcaption class="md">The subword spectrum. Moving from word-level to byte-level trades vocabulary size for robustness: the finer the unit, the smaller the vocabulary and the fewer the "cannot be represented" cases.</figcaption>
</figure>

* **Word-level** — one token per word. The vocabulary is the size of the language, so a million-word corpus needs a million-dimensional embedding, and any word outside the vocabulary is an *unknown token*. It works for a small, closed language; it does not scale.
* **BPE (Byte Pair Encoding)** — \cite[Sennrich et al., 2016]{sennrich2016subword}. Start from characters and *repeatedly merge the most frequent adjacent pair* in the training text, until the vocabulary reaches the target size. The result is a set of subwords that are efficient for *frequent* words and decomposable for *rare* ones. This is the workhorse.
* **Unigram (SentencePiece)** — \cite[Kudo, 2018]{kudo2018unigram}. Instead of greedily merging, fit a *unigram language model* over candidate subwords and keep the set that best explains the corpus, pruning down to the target size (with stochastic segmentation at inference). It is language-model-driven rather than merge-driven, and is what many modern multilingual models use.
* **Byte-level BPE** — \cite[Radford et al., GPT-2 (2019)]{gpt2}. The starting alphabet is not the characters of a single script but **all 256 bytes**. Because every byte is a token, *nothing is ever unknown*: any language, any emoji, any corrupted byte, is representable. The cost is that a single character of a non-ASCII script can be several bytes, so several tokens.

These are not interchangeable. What each optimizes — vocabulary size, robustness to unseen input, per-language efficiency — is a choice that the training corpus makes *for you*, usually without you noticing.
</div>

<div class="md">
## The pathology: token inflation

Here is the property that matters. A tokenizer trained mostly on one language builds a vocabulary that is *efficient* for that language and *inefficient* for others. A subword is a token; the model charges you one token of compute, one slot of context window, and one unit of API cost for each one. And the *same meaning* does not cost the same number of tokens in every language.

A word that is a single high-frequency subword in the dominant language may need several tokens in another — because its characters, syllables, or words were never frequent enough in the training corpus to be merged into a single subword. For many lower-resource and non-Latin scripts (Thai, Devanagari, Cyrillic, and a long tail of others) the result is routinely **several times more tokens per word** than English, a disparity now measured and analyzed as a form of infrastructure bias in its own right \cite[Teklehaymanot & Nejdl, 2025]{tokenbias2025}. The same sentence, translated faithfully, is *longer* in the low-resource language at the token layer — even though it says the same thing.

This is not a bug in the model; it is a property of the *tokenizer*, fixed before training. And it compounds in three places at once:

1. **Cost.** Tokens are billed per token. A conversation that runs 3–5× longer in tokens costs 3–5× more API money, for an equal amount of meaning.
2. **Context.** The context window is measured in tokens. A longer tokenization means the same document *fills the window sooner*, so the model sees less of it — a silent, per-language reduction in effective context.
3. **Capacity.** The model's attention has a fixed token budget per sequence. A language that spends more tokens per word gets *fewer words of attention* for the same budget.

> Language is priced by the tokenizer. The model's competence in a given language is, partly, a function of how *cheap* that language is in tokens — a quantity decided by a vocabulary trained on a corpus that was, in practice, not that language.
</div>

<div class="md">
## Byte-level: the floor, not the fix

Byte-level BPE \cite[Radford et al., GPT-2 (2019)]{gpt2} solved the *worst* failure — a token the model cannot even *represent*. Because the alphabet is all 256 bytes, every possible input has a tokenization; there is no unknown token, no "cannot read this script." That is a genuine, large win: a byte-level model can, in principle, read *any* language, including ones it was barely trained on.

But byte-level does **not** remove the inflation — it only removes the *failure to represent it*. A Thai sentence is still more bytes (hence more tokens) than the same sentence in English, because the information is denser per character in a script with a large alphabet. Byte-level is the **floor**: it guarantees you can tokenize anything. The *relative* cost between languages remains, because it is a property of the languages themselves (how much information per byte), not of the tokenizer's vocabulary.
</div>

<div class="md">
## The frontier: removing the discrete bottleneck

The current research direction is to shrink, or remove, the discrete-token bottleneck altogether. The clearest first step is **byte-to-byte** pretraining: model over raw bytes rather than over a hand-built subword vocabulary, so there is no per-language vocabulary to be biased by \cite[Xue et al., ByT5 (2022)]{byt52022}. Beyond that, the 2025–26 frontier explores **byte-latent / continuous** representations — learning a continuous "pre-token" space the model predicts over, sidestepping the fixed 256-byte (or fixed-vocabulary) discretization. Whether that actually closes the per-language gap, or merely moves the bias into the continuous representation, is an open question; the honest statement is that the *idea* — stop making a fixed vocabulary the unit of thought — is live and consequential, even where the named systems are not yet settled into stable references you can cite.

The practical takeaway does not depend on the frontier. A tokenizer is a **decision with economic and fairness consequences**, not a detail. If you deploy a model multilingually, the question "how many tokens does a sentence in language *L* cost, relative to the dominant language?" is a real number, it is not one, and it should be measured — because the model's *effective* context window, and its *price*, are different for every language it serves.
</div>
