<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Tokenization: How Words become Numbers
description: How words become numbers — word-level, N-gram, and subword methods compared — and the quiet failures that follow: token inflation, glitch tokens, numeric and Unicode artifacts, the byte-level floor, and the road toward tokenizer-free models.
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                    <polyline points="4 7 4 4 20 4 20 7"></polyline>
                    <line x1="9" y1="20" x2="15" y2="20"></line>
                    <line x1="12" y1="4" x2="12" y2="20"></line>
                </svg>
            </div>
            <input type="text" id="master-token-input" class="bw-cell"
                   value="The king is acting bravely and wisely and the queen is also acting wisely and bravely"
                   oninput="syncAndTokenize(this.value)"
                   placeholder="Type or paste any text here…"
                   aria-label="Text to tokenize"
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
            <button type="button" onclick="document.getElementById('tokenization-failure-input').value='strawberry'; showTokenizationFailure('strawberry');"
                    style="padding:6px 14px; border:1px solid #fca5a5; border-radius:6px; background:var(--mn-surface, #fff); color:var(--mn-text, #1e293b); cursor:pointer; font-size:0.85rem;">🍓 strawberry</button>
            <button type="button" onclick="document.getElementById('tokenization-failure-input').value='banana'; showTokenizationFailure('banana');"
                    style="padding:6px 14px; border:1px solid #fca5a5; border-radius:6px; background:var(--mn-surface, #fff); color:var(--mn-text, #1e293b); cursor:pointer; font-size:0.85rem;">🍌 banana</button>
            <button type="button" onclick="document.getElementById('tokenization-failure-input').value='mississippi'; showTokenizationFailure('mississippi');"
                    style="padding:6px 14px; border:1px solid #fca5a5; border-radius:6px; background:var(--mn-surface, #fff); color:var(--mn-text, #1e293b); cursor:pointer; font-size:0.85rem;">🌊 mississippi</button>
            <button type="button" onclick="document.getElementById('tokenization-failure-input').value='antidisestablishment'; showTokenizationFailure('antidisestablishment');"
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
## When the vocabulary is a graveyard: glitch tokens

Token inflation is a *quantitative* failure: the pieces are real, there are simply too many of them. There is also a stranger, *qualitative* failure. Sometimes a string becomes a single token during tokenizer training, but the model itself almost never sees that token during pretraining. The token exists in the vocabulary, it has an ID, an embedding row, and a place in every weight matrix, but its parameters are barely trained. The result is a **glitch token**: an input the tokenizer handles perfectly and the model has no learned meaning for.

The canonical examples come from the GPT-2/GPT-3 tokenizer (the `·` below marks a leading space). In 2023, \citeauthor{rumbelow2023solidgold} collected strings such as `·SolidGoldMagikarp`, `·petertodd`, and `·externalToEVA` that produced bizarre, evasive, or repetitive behavior when used as prompts, including failures to repeat or spell the string back (\cite[Rumbelow & Watkins, 2023]{rumbelow2023solidgold}). The likely cause is a mismatch between the corpus used to *train the tokenizer* and the corpus used to *train the model*: a token can be frequent in the tokenizer's corpus (usernames, code handles, scraped strings) and absent from the model's training data, leaving its embedding close to its random initialization.

Glitch tokens are the extreme end of a continuum, not a handful of curiosities. \cite[Land & Bartolo (2024)]{land2024fishing} showed that undertrained tokens are widespread and can be found automatically by comparing a token's frequency in the tokenizer corpus with its exposure in the model. \cite[Li et al. (2024)]{glitchtokens} built a taxonomy and detection pipeline for them, and \cite[Zhang et al. (2024)]{glitchprober2024} extended detection and mitigation. The practical lesson is not “avoid one weird string”; it is that **a vocabulary entry is not a learned concept**.
</div>

<div class="md">
The documented examples are mostly ordinary-looking strings. That is the point: nothing in the surface form tells you whether the token was trained.

| Token (the `·` marks a leading space) | What was reported | What it reveals |
|---|---|---|
| `·SolidGoldMagikarp` | Refusals, repetitions, and confusion when asked to repeat or spell it | A token can exist without a usable embedding |
| `·petertodd` | Bizarre associations and unstable completions | The model may pattern-match the *string's* scraped context, not its meaning |
| `·externalToEVA` | Evasive or malformed answers | Code identifiers can become tokens the language model never learned |
| `·davidjl` | Unstable, sometimes evasive behavior | A username can be a single token and a blind spot |

The pattern is general: **the tokenizer's training corpus and the model's training corpus are not the same corpus.** A tokenizer can create a token for a string that is frequent in its own data and then hand the model an embedding row that almost never receives a gradient. The model cannot tell you what the token means, because it was never taught.
</div>

<div class="md">
This is also a security property. A token the model handles unpredictably is a potential bypass: adversarial tokenization can change a model's behavior or slip text past a classifier that segments it differently (\cite[Geh et al., 2025]{geh2025adversarialtokenization}; \cite[Schulz et al., 2025]{tokenbreak2025}). The lesson for anyone deploying a model is dull but important: **test the tokenizer, not just the model**, and treat “this string is one token” as a claim to verify rather than a guarantee.
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

<div class="md">
## The rest of the bestiary

Glitch tokens are one member of a family. Once you look at text as *tokens* rather than characters, several other failure modes become visible. None of them is exotic; all of them are consequences of the same decision to cut text at statistically convenient boundaries.

### Numbers do not survive the trip

A number is a sequence of digits; a tokenizer sees a string and may group it in ways that depend on frequency rather than place value. `1234` may be one token while `1235` becomes `123` + `5`; a decimal point, a leading zero, or a thousands separator can change the segmentation again. The model then has to do arithmetic across pieces that do not line up with the digits, which is one reason arithmetic accuracy depends on *how the number was written* (\cite[Singh & Strouse, 2024]{singh2024tokenizationcounts}). The fix is not “train harder”; it is to choose a representation that preserves the structure, for example digit-wise tokenization or an external calculator.

### A space is not nothing

Leading and trailing spaces belong to tokens. A prompt ending in `The answer is` and one ending in `The answer is ` can have different next-token distributions, because the final token is different. This matters most at the boundary between a prompt and a generated continuation, where a partial token can force the model into an awkward segmentation. Recent work shows that models can often recover from *non-canonical* tokenizations, but the distribution shift is real and measurable (\cite[Zheng et al., 2025]{zheng2025brokentokens}). Boundary-aware prompting and token healing exist precisely to avoid handing the model a split it did not expect.

### One visible character, many tokens

Unicode is not a one-to-one mapping from what you see to what the tokenizer receives. The same visible `é` can be one code point or `e` plus a combining acute accent; an emoji can be a single code point or a zero-width-joiner sequence of several; flags, family emoji, and right-to-left text add more cases. Normalization forms (NFC, NFD) can therefore change the token sequence without changing the rendered text (\cite[Unicode Consortium, UAX #15]{unicodeuax15}). Normalize before comparing, classifying, or hashing text — and remember that normalization is itself a lossy decision when the exact byte sequence matters.

### The same string, a different tokenizer

Token IDs are not portable. Each model family has its own vocabulary and merge rules, so the same sentence can be longer, shorter, or split at completely different places under a different tokenizer. That is why swapping a tokenizer invalidates the embedding matrix, why token counts from one model are not a budget for another, and why “the context window is 128k tokens” is a statement about a *particular* tokenizer. The tokenizer is part of the model contract, not a preprocessing detail you can change later.

### Spelling, homoglyphs, and filter evasion

If a safety filter and a generator tokenize the same text differently, an attacker can exploit the gap: invisible characters, Cyrillic letters that look Latin, leetspeak, or deliberate segmentation can change one side's view while leaving the other's meaning intact. This is the practical face of adversarial tokenization (\cite[Geh et al., 2025]{geh2025adversarialtokenization}; \cite[Schulz et al., 2025]{tokenbreak2025}). Defenses have to normalize and tokenize consistently across every component in the pipeline; a filter that reads characters while the model reads tokens is not protecting the same input.
</div>

<div class="md">
## What to do about it

The pathologies above point to a short engineering checklist:

* **Measure, don't assume.** Count tokens per word for every language you serve, and track how those counts change across model families. A per-language token budget is a real product decision.
* **Audit the vocabulary against the model's data.** Tokens that are frequent in the tokenizer corpus but rare in pretraining are candidates for pruning, retraining, or better initialization; detection is now automatic.
* **Test the ugly cases.** Spelling, copying, numbers, whitespace, emoji, combining marks, rare names, and mixed scripts belong in the evaluation set, not in the “we'll see” bucket.
* **Choose the right floor.** Byte-level BPE guarantees coverage; tokenizer-free and byte-latent approaches remove the discrete vocabulary entirely. Neither automatically removes the *statistical* bias, but they change which failures are possible.
* **Give numbers a tool.** Digit-wise tokenization, a calculator, or a code interpreter is usually more reliable than asking the model to do arithmetic on arbitrary chunks.
* **Treat the tokenizer as a versioned contract.** Document it, test it, and re-run the tests whenever the vocabulary or the model changes.

> A tokenizer is a lossy interface between text and thought. The loss is not random: it is a set of decisions about which distinctions matter, made before the model sees a single example.

The next time a model “can't count,” “can't spell,” or “goes weird” on an ordinary-looking string, ask the tokenizer first. It is often the part of the system that made the decision, and the part nobody debugged.
</div>

<div class="mn-quiz" data-quiz="tokenizerlab"><script type="application/json">{"title": "Tokenization", "questions": [{"q": "What does Byte-Pair Encoding (BPE) do to build its vocabulary?", "options": ["Repeatedly merges the most frequent adjacent pair of symbols into a new token", "Uses every dictionary word as a token", "Splits text into single letters only", "Picks tokens at random"], "answer": 0, "explain": "Frequent strings become single tokens; rare words are built from smaller pieces."}, {"q": "What is “token inflation”?", "options": ["Some languages and scripts need many more tokens for the same content", "Tokens getting more expensive every year", "The vocabulary growing during inference", "Duplicate tokens in the training data"], "answer": 0, "explain": "Tokenizers trained mostly on English split other languages into more pieces — more cost, less context."}, {"q": "What is a glitch token?", "options": ["A token that exists in the vocabulary but received little or no training signal", "A token that crashes the tokenizer", "A special token used only for safety filters", "Any token longer than one character"], "answer": 0, "explain": "Glitch tokens are vocabulary entries whose embeddings were barely trained, so the model has no stable meaning for them. SolidGoldMagikarp is the canonical example."}, {"q": "Why can a byte-level tokenizer never meet an unknown word?", "options": ["Any text can be written as a sequence of its 256 possible byte values", "It contains every word of every language", "It ignores unknown words", "It uses a spell-checker"], "answer": 0, "explain": "Bytes are the floor: everything is representable, though rare text becomes long."}, {"q": "Why do LLMs often struggle to count the letters in a word?", "options": ["They see tokens, not individual letters", "They have no memory", "Letters are removed during training", "Counting is forbidden by the tokenizer"], "answer": 0, "explain": "A word like “strawberry” may be one or a few tokens; the letters inside are not directly visible."}, {"q": "Why can arithmetic accuracy depend on how a number is written?", "options": ["The tokenizer may split the digits into chunks that do not follow place value", "The model cannot read Arabic numerals", "Numbers are always stored as words", "The decimal point is a special token"], "answer": 0, "explain": "If 1234 is one token but 1235 is 123 + 5, the model is doing arithmetic across inconsistent digit groupings."}]}</script></div>
