<?php include_once("functions.php"); ?>

<div class="md">
Before an AI can "calculate" a word, it must chop the text into pieces. This process is called **Tokenization**. Depending on how you chop, the AI "sees" the world differently.
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
The most intuitive way: Every time there is a space, we create a new token.

Before modern subword methods, word-level splitting was the default for systems like the original **IBM Alignment Models** in the early 1990s. While \citeauthor{zipf1949human} (\citeyear{zipf1949human}) formalized the distribution problem, it was these early translation models that hit the "Out-of-Vocabulary" (OOV) wall, leading researchers to realize that treating "brave" and "bravely" as two completely unrelated IDs was inefficient.

**Problem:** If the AI sees a new word like "bravely", it has no idea what it means.
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

The concept of viewing text as a sequence of raw characters dates back to \citeauthor{markov1913ngram} (\citeyear{markov1913ngram}), who used it to analyze the statistical structure of Russian literature. In the era of Deep Learning, the "raw view" was revitalized by \citeauthor{sutskever2011generating} in their paper \citetitle{sutskever2011generating}, which proved that Recurrent Neural Networks could learn to predict the next character with enough precision to form coherent words and sentences from scratch.
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
WordPiece is a subword method closely related to BPE, but instead of merging the most *frequent* pair, it merges the pair that most improves the **likelihood of the training data**. It was introduced by \citeauthor{schuster2012wordpiece} (\citeyear{schuster2012wordpiece}) to handle the massive character sets of Japanese and Korean, and later became famous as the tokenizer behind Google's **BERT**. Continuation fragments are marked with `##` (e.g., "tokenization" → `token`, `##iza`, `##tion`). GPT-style models use BPE instead because byte-level BPE is simpler to train at scale and guarantees coverage of any input without needing an unknown-token fallback.
        </div>

	<div class="optional md" data-headline="The WordPiece-Algorithm">
		<ol>
		  <li>
		    <strong>Initialize the vocabulary</strong> with every character present in the training data — identical to BPE's starting point.
		  </li>
		  <li>
		    <strong>Score every candidate pair</strong> — but instead of raw frequency, WordPiece computes which merge would most improve the <strong>likelihood of the training data</strong>. The scoring formula is typically:
		    <p align="center">
		      $$\text{score}(a, b) = \frac{\text{freq}(ab)}{\text{freq}(a) \times \text{freq}(b)}$$
		    </p>
		    This favors merging pairs whose co-occurrence is high <em>relative to</em> how often each piece appears independently.
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
Modern AIs use **BPE (Byte-Pair Encoding)**. It keeps common words whole but splits rare words into known building blocks like `##ing` or `##ly`.

The history of BPE is a classic case of an algorithm being repurposed for a new era. Originally, \citeauthor{gage1994bpe} (\citeyear{gage1994bpe}) developed the technique strictly for data compression, using iterative byte-pair replacement to shrink files. It remained a niche compression tool until \citeauthor{sennrich2016subword} (\citeyear{sennrich2016subword}) adapted the logic into a subword tokenization strategy. This shift allowed modern models to handle rare words by breaking them into frequent fragments, effectively solving the "Out-of-Vocabulary" problem that had previously limited word-level neural networks.
        </div>


	<div class="optional md" data-headline="The BPE-Algorithm">
		<ol>
		  <li>
		    <strong>Initialize the vocabulary</strong> with every individual character (or byte) that appears in the training corpus.
		  </li>
		  <li>
		    <strong>Count all adjacent symbol pairs</strong> across the corpus.<br>
		    <em>For example, in a corpus containing "car" (5×) and "cable" (3×), the pair <b>c a</b> appears 8 times total.</em>
		  </li>
		  <li>
		    <strong>Merge the most frequent pair</strong> into a single new symbol and add it to the vocabulary.<br>
		    This is the core step — BPE always picks the pair with the <strong>highest frequency</strong>.
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

</div>
