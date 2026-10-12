<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Tokenization: How Words become Numbers
description: How words become numbers — word-level, N-gram, and subword methods compared — and the quiet bias that follows: token inflation, the byte-level floor, and the road toward tokenizer-free models.
icon: &#9000;
part: 4
order: 1
color: sky
topics: language, programming, architecture
tags: code-heavy
math: 30
-->

<div class="md">
Before an AI can “calculate” a word, it must chop the text into pieces. This process is called **Tokenization**. Depending on how you chop, the AI “sees” the world differently.
</div>

<div class="optional md" data-headline="Where these token IDs go">
A tokenizer's output is a list of **integers**, token IDs in $\{0, 1, \dots, |V|-1\}$. The very next step in every Transformer is to look each ID up in a trainable matrix $E \in \mathbb{R}^{|V| \times d}$ to get a vector. That lookup is what brings you into the <a href="embeddinglab">Embeddings chapter</a>. Everything below this chapter is “before the lookup”; everything in Embeddings is “after”.
</div>

<div id="tokenizer-section">

    <!-- ═══════════════════ STICKY INPUT BAR ═══════════════════ -->
    <div id="sticky-input-wrapper">
        <div class="sticky-input-inner">
            <div class="sticky-input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="4 7 4 4 20 4 20 7"></polyline>
                    <line x1="9" y1="20" x2="15" y2="20"></line>
                    <line x1="12" y1="4" x2="12" y2="20"></line>
                </svg>
            </div>
            <input type="text" id="master-token-input" class="bw-cell"
                   value="The king is acting bravely and wisely and the queen is also acting wisely and bravely"
                   oninput="syncAndTokenize(this.value)"
                   placeholder="Type or paste any text here…"
                   autocomplete="off"
                   spellcheck="false">
        </div>
    </div>

    <!-- ═══════════════════ WORD-LEVEL ═══════════════════ -->
    <div class="tokenizer-method-card" data-method="spaces">
        <div class="method-header">
            <div>
                <h2 class="method-title">Simple Splitting <span class="method-subtitle">Word-Level</span></h2>
            </div>
            <span class="section-token-count"></span>
        </div>
        <div class="md">
The most intuitive way: Every time there is a space, comma, dot etc., we create a new token.

Before modern subword methods, word-level splitting was the default for systems like the original **IBM Alignment Models** in the early 1990s. While \citeauthor{zipf1949human} (\citeyear{zipf1949human}) formalized the distribution problem, it was these early translation models that hit the “Out-of-Vocabulary” (OOV) wall, leading researchers to realize that treating “brave” and “bravely” as two completely unrelated IDs was inefficient.

**Problem:** If the AI sees a new word like “bravely”, it has no idea what it means.
        </div>
        <div id="viz-spaces" class="viz-container"></div>
    </div>

    <!-- ═══════════════════ N-GRAMS ═══════════════════ -->
    <div class="tokenizer-method-card" data-method="trigrams">
        <div class="method-header">
            <div>
                <h2 class="method-title">N-Grams <span class="method-subtitle">Fixed Length</span></h2>
            </div>
            <span class="section-token-count"></span>
        </div>
        <div class="md">
Here, we don't care about words. We just take every X characters (e.g., Trigrams).

This approach of using chains of dependencies was first pioneered by \citeauthor{markov1913ngram} in \citeyear{markov1913ngram} to describe the statistical structure of language.

Later, *Claude Shannon* expanded the idea of word-level Analysis and $n$-gram-Models with his works \cite[Mathematical Theory of Communication]{shannon1948communication} (released in \citeyear{shannon1948communication}) and \citetitle{shannon1951communication} (released in \citeyear{shannon1951communication}), in which he quantified the information content and entropy of the English language.

**Problem:** It's consistent, but it often destroys the meaning of words.
        </div>
        <div class="ngram-controls">
            <label for="ngram-size">N-Gram Size</label>
            <input type="range" id="ngram-size" value="3" min="1" max="10" oninput="syncAndTokenize(); this.nextElementSibling.textContent = this.value;">
            <span class="ngram-value">3</span>
        </div>
        <div id="viz-trigrams" class="viz-container"></div>
    </div>

    <!-- ═══════════════════ CHARACTER-LEVEL ═══════════════════ -->
    <div class="tokenizer-method-card" data-method="chars">
        <div class="method-header">
            <div>
                <h2 class="method-title">Character-Level <span class="method-subtitle">The Raw View</span></h2>
            </div>
            <span class="section-token-count"></span>
        </div>
        <div class="md">
This treats every single letter and space as its own token. This is the most granular way to see text.

The concept of viewing text as a sequence of raw characters dates back to \citeauthor{markov1913ngram} (\citeyear{markov1913ngram}), who used it to analyze the statistical structure of Russian literature. In the era of Deep Learning, the “raw view” was revitalized by \citeauthor{sutskever2011generating} in their paper \citetitle{sutskever2011generating}, which proved that Recurrent Neural Networks could learn to predict the next character with enough precision to form coherent words and sentences from scratch.
        </div>
        <div id="viz-chars" class="viz-container"></div>
    </div>

    <!-- ═══════════════════ WORDPIECE ═══════════════════ -->
    <div class="tokenizer-method-card" data-method="wordpiece">
        <div class="method-header">
            <div>
                <h2 class="method-title">WordPiece <span class="method-subtitle">The BERT Way</span></h2>
            </div>
            <span class="section-token-count"></span>
        </div>
        <div class="md">
WordPiece is a subword method closely related to BPE, but instead of merging the most *frequent* pair, it greedily merges the pair whose combination most improves the **likelihood of the training data**. The original formulation (Schuster & Nakajima 2012), introduced to handle the massive character sets of Japanese and Korean, optimizes that likelihood directly through an iterative procedure, it has no closed-form per-pair score. The ratio shown below is a separate, simpler *approximation* used by BERT-style implementations, not the original objective. WordPiece later became famous as the tokenizer behind Google's **BERT**. Continuation fragments are marked with `##` (e.g., “tokenization” → `token`, `##iza`, `##tion`). GPT-style models use BPE instead because byte-level BPE is simpler to train at scale and guarantees coverage of any input without needing an unknown-token fallback.
        </div>

	<div class="optional md" data-headline="The WordPiece-Algorithm">
		<ol>
		  <li>
		    <strong>Initialize the vocabulary</strong> with every character present in the training data.
		  </li>
		  <li>
		    <strong>Score every candidate pair</strong>, but instead of raw frequency, WordPiece is *defined* as merging the pair that most increases the likelihood of the training data (the original formulation of Schuster & Nakajima 2012). That likelihood-based objective is not equivalent to a closed-form pair score, so implementations use an approximation: BERT-style tokenizers score each candidate pair with a likelihood-ratio measure:
		    <p align="center">
		      $$\text{score}(a, b) = \frac{\text{freq}(ab)}{\text{freq}(a) \times \text{freq}(b)}$$
		    </p>
		    This closed-form ratio is a *simplification*, not the original formulation, it favors merging pairs whose co-occurrence is high <em>relative to</em> how often each piece appears independently, which is why the formula is a *ratio* rather than a raw frequency: BPE uses raw frequency, BERT-style WordPiece uses the ratio.
		  </li>
		  <li>
		    <strong>Merge the highest-scoring pair</strong> and add the new symbol to the vocabulary.
		  </li>
		  <li>
		    <strong>Repeat</strong> until the desired vocabulary size is reached.
		  </li>
		  <li>
		    <strong>Tokenize new text</strong> using a <strong>greedy longest-match-first</strong> approach: scan from the beginning of each word, find the longest substring that exists in the vocabulary, emit it, then continue with the remainder. Continuation fragments are prefixed with <code>##</code> (e.g., <code>tokenization</code> &rarr; <code>token</code>, <code>##iza</code>, <code>##tion</code>).
		  </li>
		</ol>
        </div>
        <div id="viz-wordpiece" class="viz-container"></div>
    </div>

    <!-- ═══════════════════ BPE ═══════════════════ -->
    <div class="tokenizer-method-card" data-method="bpe">
        <div class="method-header">
            <div>
                <h2 class="method-title">Sub-word Units <span class="method-subtitle">The ChatGPT Way</span></h2>
            </div>
            <span class="section-token-count"></span>
        </div>
        <div class="md">
Modern AIs use **BPE (Byte-Pair Encoding)**. It keeps common words whole but splits rare words into known building blocks like `ing` or `ly`.

The history of BPE is a classic case of an algorithm being repurposed for a new era. Originally, \citeauthor{gage1994bpe} (\citeyear{gage1994bpe}) developed the technique strictly for data compression, using iterative byte-pair replacement to shrink files. It remained a niche compression tool until \citeauthor{sennrich2016subword} (\citeyear{sennrich2016subword}) adapted the logic into a subword tokenization strategy. This shift allowed modern models to handle rare words by breaking them into frequent fragments, effectively solving the “Out-of-Vocabulary” problem that had previously limited word-level neural networks.
        </div>

<div class="md">
**Why BPE works: Zipf's Law.** The reason BPE's merge strategy is so effective is that it mirrors the statistical structure of language itself. \citeauthor{zipf1949human} observed that in any natural language corpus, a few words (like “the,” “of,” “and”) appear with very high frequency, while most words are rare. BPE's iterative merging naturally produces a token vocabulary that follows this same distribution: common words stay intact as single tokens, while rare words are broken into fragments that reuse frequent subword units. This aligns the tokenizer's granularity with the data's statistical structure, frequent patterns get short codes, rare ones get longer compositions. In effect, BPE is a lossless compression scheme that happens to produce excellent tokenizations for language models.

**Reading it as compression.** Every merge fuses a frequent pair into a single new symbol, so each new symbol is a **short ID that replaces a longer string**. The more often a pattern appears, the more often it gets promoted to one small ID; the rarer a pattern, the more symbols (a longer code) it needs. Point the same machinery at a file instead of a corpus and it *is* a compressor: store the small merge table once, then store the shorter sequence of IDs, and you have a smaller file that decodes back to the identical original text. That is exactly how \citeauthor{gage1994bpe} used it in \citeyear{gage1994bpe}, before \citeauthor{sennrich2016subword} turned the codebook into a vocabulary.
</div>


	<div class="optional md" data-headline="The BPE-Algorithm">
		<ol>
		  <li>
		    <strong>Initialize the vocabulary</strong> with every individual character (or byte) that appears in the training corpus.
		  </li>
		  <li>
		    <strong>Count all adjacent symbol pairs</strong> across the corpus.<br>
		    <em>For example, in a corpus containing “car” (5×) and “cable” (3×), the pair <b>c a</b> appears 8 times total.</em>
		  </li>
		  <li>
		    <strong>Merge the most frequent pair</strong> into a single new symbol and add it to the vocabulary.<br>
		    This is the core step: BPE always picks the pair with the <strong>highest frequency</strong>.
		  </li>
		  <li>
		    <strong>Repeat</strong> steps 2–3 for a fixed number of merge operations (a hyperparameter).<br>
		    Each round creates a slightly larger subword unit.
		  </li>
		  <li>
		    <strong>Tokenize new text</strong> by applying the learned merge rules in order.<br>
		    Common words end up as single tokens; rare words get split into known subword fragments (e.g., <code>bravely</code> → <code>brave</code> + <code>ly</code>), effectively solving the Out-of-Vocabulary problem.
		  </li>
		</ol>
        </div>
        <div id="viz-bpe" class="viz-container"></div>
    </div>

    <!-- ═══════════════════ TOKENIZATION FAILURE DEMO ═══════════════════ -->
    <div style="background:var(--mn-bg-subtle, #fff); border:2px solid #fecaca; border-radius:12px; padding:20px; margin:20px 0;">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
            <span style="font-size:1.5rem;">🍓</span>
            <h3 style="margin:0; color:#fca5a5;">Why LLMs Can't Count Letters</h3>
        </div>
        <div class="md">
Type a word like **“strawberry”** below and watch how BPE splits it. The model never sees individual letters, it sees whatever fragments the tokenizer produced during training.
        </div>
        <div style="margin:12px 0;">
            <input type="text" id="tokenization-failure-input" class="bw-cell"
                   value="strawberry"
                   oninput="showTokenizationFailure(this.value)"
                   style="width:100%; padding:10px; border-radius:8px; border:2px solid #fca5a5; font-size:1.1rem; box-sizing:border-box;"
                   autocomplete="off" spellcheck="false">
        </div>
        <div id="tokenization-failure-vis" style="background:var(--mn-bg-subtle, #fef2f2); border-radius:8px; padding:16px; min-height:60px; font-family:monospace; font-size:1.1rem; line-height:2; color:var(--mn-text, #1e293b);"></div>
        <div id="tokenization-failure-explain" style="margin-top:10px; padding:12px; background:var(--mn-bg-subtle, #fff); border-radius:8px; border:1px dashed #fca5a5; font-size:0.9em; color:var(--mn-text-secondary, #475569);"></div>
        <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
            <button onclick="document.getElementById('tokenization-failure-input').value='strawberry'; showTokenizationFailure('strawberry');"
                    style="padding:6px 14px; border:1px solid #fca5a5; border-radius:6px; background:var(--mn-surface, #fff); color:var(--mn-text, #1e293b); cursor:pointer; font-size:0.85rem;">🍓 strawberry</button>
            <button onclick="document.getElementById('tokenization-failure-input').value='banana'; showTokenizationFailure('banana');"
                    style="padding:6px 14px; border:1px solid #fca5a5; border-radius:6px; background:var(--mn-surface, #fff); color:var(--mn-text, #1e293b); cursor:pointer; font-size:0.85rem;">🍌 banana</button>
            <button onclick="document.getElementById('tokenization-failure-input').value='mississippi'; showTokenizationFailure('mississippi');"
                    style="padding:6px 14px; border:1px solid #fca5a5; border-radius:6px; background:var(--mn-surface, #fff); color:var(--mn-text, #1e293b); cursor:pointer; font-size:0.85rem;">🌊 mississippi</button>
            <button onclick="document.getElementById('tokenization-failure-input').value='antidisestablishment'; showTokenizationFailure('antidisestablishment');"
                    style="padding:6px 14px; border:1px solid #fca5a5; border-radius:6px; background:var(--mn-surface, #fff); color:var(--mn-text, #1e293b); cursor:pointer; font-size:0.85rem;">📚 antidisestablishment</button>
        </div>
    </div>

</div>

<div class="md">
## The Consequence: Tokenization as a Bias

The first part of this chapter showed you the *mechanism*: how a stream of characters is chopped into a fixed vocabulary of subwords so a discrete, finite model can process open-ended text. This second part is the *consequence* of that mechanism — the part that is easy to miss because it is invisible in a single-language demo. A tokenizer is not a neutral preprocessing step. It is a **bias**, baked into the model before a single weight is trained, and it prices every language differently. Two of the most consequential, least-discussed properties of a modern LLM — why it costs more to speak in one language than another, and why it sometimes fails in exactly the ways the Strawberry demo above hinted at — live here.
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
* **BPE (Byte Pair Encoding)** (\cite[Sennrich et al., 2016]{sennrich2016subword}) — start from characters and *repeatedly merge the most frequent adjacent pair* in the training text, until the vocabulary reaches the target size. The result is a set of subwords that are efficient for *frequent* words and decomposable for *rare* ones. This is the workhorse.
* **Unigram (SentencePiece)** (\cite[Kudo, 2018]{kudo2018unigram}) — instead of greedily merging, fit a *unigram language model* over candidate subwords and keep the set that best explains the corpus, pruning down to the target size (with stochastic segmentation at inference). It is language-model-driven rather than merge-driven, and is what many modern multilingual models use.
* **Byte-level BPE** — \cite[Radford et al., GPT-2 (2019)]{gpt2}. The starting alphabet is not the characters of a single script but **all 256 bytes**. Because every byte is a token, *nothing is ever unknown*: any language, any emoji, any corrupted byte, is representable. The cost is that a single character of a non-ASCII script can be several bytes, so several tokens.

These are not interchangeable. What each optimizes — vocabulary size, robustness to unseen input, per-language efficiency — is a choice that the training corpus makes *for you*, usually without you noticing.
</div>

<div class="md">
## The pathology: token inflation

Here is the property that matters. A tokenizer trained mostly on one language builds a vocabulary that is *efficient* for that language and *inefficient* for others. A subword is a token; the model charges you one token of compute, one slot of context window, and one unit of API cost for each one. And the *same meaning* does not cost the same number of tokens in every language.

A word that is a single high-frequency subword in the dominant language may need several tokens in another — because its characters, syllables, or words were never frequent enough in the training corpus to be merged into a single subword. For many lower-resource and non-Latin scripts (Thai, Devanagari, Cyrillic, and a long tail of others) the result is routinely **several times more tokens per word** than English, a disparity now measured and analyzed as a form of infrastructure bias in its own right (\cite[Teklehaymanot & Nejdl, 2025]{tokenbias2025}). The same sentence, translated faithfully, is *longer* in the low-resource language at the token layer — even though it says the same thing.

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
