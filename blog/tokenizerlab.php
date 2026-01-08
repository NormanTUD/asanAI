<?php include_once("functions.php"); ?>

<div class="md">
    ## Part 4: How Words become Numbers (Tokenization)
    Before an AI can "calculate" a word, it must chop the text into pieces. This process is called **Tokenization**. Depending on how you chop, the AI "sees" the world differently.
</div>

<div style="background: #f0f4f8; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #3b82f6;">
    <label style="font-weight: bold; display: block; margin-bottom: 8px;">Master Input Text:</label>
    <input type="text" id="master-token-input" class="bw-cell" style="width: 100%; font-size: 1.1rem;" 
           value="The king lives in a Geisterhaus." 
           oninput="syncAndTokenize(this.value)">
    
    <div style="margin-top: 15px; display: flex; gap: 20px; align-items: center;">
        <div>
            <label>N-Gram Size: </label>
            <input type="number" id="ngram-size" value="3" min="1" max="10" style="width: 50px;" oninput="syncAndTokenize()">
        </div>
    </div>
</div>

<div class="md" style="margin-top:20px;">
    ### Simple Splitting (Word-Level)
    The most intuitive way: Every time there is a space, we create a new token. 
    **Problem:** If the AI sees a new word like "Geisterhaus", it has no idea what it means.
</div>
<div id="viz-spaces" class="viz-container"></div>

<div class="md" style="margin-top:40px;">
    ### N-Grams (Fixed Length)
    Here, we don't care about words. We just take every X characters (e.g., Trigrams). 
    **Problem:** It’s consistent, but it often destroys the meaning of words.
</div>
<div id="viz-trigrams" class="viz-container"></div>

<div class="md" style="margin-top:40px;">
    ### Character-Level (The Raw View)
    This treats every single letter and space as its own token. This is the most granular way to see text.
</div>
<div id="viz-chars" class="viz-container"></div>

<div class="md" style="margin-top:40px;">
    ### Sub-word Units (The ChatGPT Way)
    Modern AIs use **BPE (Byte-Pair Encoding)**. It keeps common words whole but splits rare words into known building blocks like `##ness` or `##haus`.
</div>
<div id="viz-bpe" class="viz-container"></div>

<style>
    .viz-container {
        display: flex; 
        flex-wrap: wrap; 
        gap: 8px; 
        padding: 15px; 
        background: #f8fafc; 
        border-radius: 8px; 
        border: 1px solid #e2e8f0; 
        min-height: 50px;
        margin-top: 10px;
    }
</style>
