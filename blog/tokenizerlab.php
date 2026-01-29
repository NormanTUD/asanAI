<?php include_once("functions.php"); ?>

<div class="md">
    Before an AI can "calculate" a word, it must chop the text into pieces. This process is called **Tokenization**. Depending on how you chop, the AI "sees" the world differently.
</div>

<div style="background: #f0f4f8; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #3b82f6;">
    <label style="font-weight: bold; display: block; margin-bottom: 8px;">Master Input Text:</label>
    <input type="text" id="master-token-input" class="bw-cell" style="width: 90%; font-size: 1.1rem;" 
           value="The king is acting bravely"
           oninput="syncAndTokenize(this.value)">
</div>

<div class="md" style="margin-top:20px;">
## Simple Splitting (Word-Level)

The most intuitive way: Every time there is a space, we create a new token. 

Before modern subword methods, word-level splitting was the default for systems like the original **IBM Alignment Models** in the early 1990s. While \citeauthor{zipf1949human} (\citeyear{zipf1949human}) formalized the distribution problem, it was these early translation models that hit the "Out-of-Vocabulary" (OOV) wall, leading researchers to realize that treating "brave" and "bravely" as two completely unrelated IDs was inefficient.

**Problem:** If the AI sees a new word like "bravely", it has no idea what it means.
</div>
<div id="viz-spaces" class="viz-container"></div>

<div class="md" style="margin-top:40px;">
### N-Grams (Fixed Length)
Here, we don't care about words. We just take every X characters (e.g., Trigrams).

This approach of using chains of dependencies was first pioneered by \citeauthor{markov1913ngram} in \citeyear{markov1913ngram} to describe the statistical structure of language. Later, Claude Shannon expanded this in \citeyear{shannon1951communication} with '\citetitle{shannon1951communication}' and '\citetitle{shannon1951ngram}' to quantify the information content and entropy of the English language, demonstrating both character- and word-level n-gram models.

**Problem:** It’s consistent, but it often destroys the meaning of words.

    <div style="margin-top: 15px; display: flex; gap: 20px; align-items: center;">
        <div>
            <label>N-Gram Size: </label>
            <input type="number" id="ngram-size" value="3" min="1" max="10" style="width: 50px;" oninput="syncAndTokenize()">
        </div>
    </div>
</div>
<div id="viz-trigrams" class="viz-container"></div>

<div class="md" style="margin-top:40px;">
### Character-Level (The Raw View)

This treats every single letter and space as its own token. This is the most granular way to see text.

The concept of viewing text as a sequence of raw characters dates back to \citeauthor{markov1913ngram} (\citeyear{markov1913ngram}), who used it to analyze the statistical structure of Russian literature. In the era of Deep Learning, the "raw view" was revitalized by \citeauthor{sutskever2011generating} in their paper \citetitle{sutskever2011generating}, which proved that Recurrent Neural Networks could learn to predict the next character with enough precision to form coherent words and sentences from scratch.
</div>
<div id="viz-chars" class="viz-container"></div>

<div class="md" style="margin-top:40px;">
### Sub-word Units (The ChatGPT Way)
Modern AIs use **BPE (Byte-Pair Encoding)**. It keeps common words whole but splits rare words into known building blocks like `##ing` or `##ly`.

The history of BPE is a classic case of an algorithm being repurposed for a new era. Originally, \citeauthor{gage1994bpe} (\citeyear{gage1994bpe}) developed the technique strictly for data compression, using iterative byte-pair replacement to shrink files. It remained a niche compression tool until \citeauthor{sennrich2016subword} (\citeyear{sennrich2016subword}) adapted the logic into a subword tokenization strategy. This shift allowed modern models to handle rare words by breaking them into frequent fragments, effectively solving the "Out-of-Vocabulary" problem that had previously limited word-level neural networks.
</div>
<div id="viz-bpe" class="viz-container"></div>
