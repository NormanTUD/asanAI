<div class="md">
    ## Part 4: How Words become Numbers (Tokenization)
    Before an AI can "calculate" a word, it must chop the text into pieces. This process is called **Tokenization**. Depending on how you chop, the AI "sees" the world differently.
</div>

<div class="md" style="margin-top:20px;">
    ### 1. Simple Splitting (Word-Level)
    The most intuitive way: Every time there is a space, we create a new token. 
    **Problem:** If the AI sees a new word like "Geisterhaus", it has no idea what it means, even if it knows "Geist" (Ghost) and "Haus" (House).
</div>
<div class="grid-layout">
    <div class="layers-vertical">
        <input type="text" id="token-input-spaces" class="bw-cell" style="width: 100%;" value="The King lives in a Geisterhaus" oninput="tokenize('spaces')">
    </div>
    <div id="viz-spaces" style="display: flex; flex-wrap: wrap; gap: 8px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; min-height: 50px;"></div>
</div>

<div class="md" style="margin-top:40px;">
    ### 2. N-Grams (Fixed Length)
    Here, we don't care about words. We just take every 3 characters.
    **Problem:** It’s very consistent, but it destroys the meaning. "King" becomes "Kin" and "g__", which makes it harder for the AI to find logical connections.
</div>
<div class="grid-layout">
    <div class="layers-vertical">
        <input type="text" id="token-input-trigrams" class="bw-cell" style="width: 100%;" value="The King lives in a Geisterhaus" oninput="tokenize('trigrams')">
    </div>
    <div id="viz-trigrams" style="display: flex; flex-wrap: wrap; gap: 8px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; min-height: 50px;"></div>
</div>

<div class="md" style="margin-top:40px;">
    ### 3. Sub-word Units (The ChatGPT Way)
    Modern AIs use **BPE (Byte-Pair Encoding)**. It keeps common words whole but splits rare words into known building blocks.
    **Solution:** "Geisterhaus" becomes `Geist` + `er` + `haus`. The AI can now understand a word it has never seen before by looking at its parts!
</div>
<div class="grid-layout">
    <div class="layers-vertical">
        <input type="text" id="token-input-bpe" class="bw-cell" style="width: 100%;" value="The King lives in a Geisterhaus" oninput="tokenize('bpe')">
    </div>
    <div id="viz-bpe" style="display: flex; flex-wrap: wrap; gap: 8px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; min-height: 50px;"></div>
</div>

