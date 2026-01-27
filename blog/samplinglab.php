<?php include_once("functions.php"); ?>

<div class="md">
In natural language, there are often many ways to express the same thing, and different humans (or even the same human when asked repeatedly) may answer differently each time. 

To make the interaction feel more humane, there's something called Top-$k$-Sampling. Since you get a probability distribution of most probable words instead of just the most probable one (the probability being the cosine angle to the vector position the calculation points to), you can choose out of a selection of different words that are probable next. This used to not only select the most probable next word, but random chose any of the top $n$ most probable words and it's why an LLM may reply with differents words to the same question, even on the same model. 

This is also used to allow the model to be more creative. Letting it only chose the most likely word next, it will be very much like the training data. Chosing from the top 20 words, for example, may make it feel more creative.

There are two settings regarding top-$k$-sampling. One is the $k$, i.e. how many of the top words should be chosen from. And the Temperature $T$, which changes the probability distribution for these top $k$ words such that the less-likely words of them get a higher probability of being chosen randomly.

Adjust the temperature to change the model's "confidence" before the Top-$k$ filter is applied.
</div>

<div class="panel" style="margin-bottom: 20px; background: #f8fafc; display: flex; gap: 30px; flex-wrap: wrap;">
    <div style="flex: 1; min-width: 250px;">
        <label style="font-weight: bold; display: block; margin-bottom: 8px;">
            Temperature ($T$): <span id="temp-display" style="color: #ef4444;">1.0</span>
        </label>
        <input type="range" id="slider-temp" min="0.1" max="2.0" step="0.1" value="1.0" style="width: 100%;">
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; margin-top: 4px;">
            <span>Focused (Cold)</span>
            <span>Creative (Hot)</span>
        </div>
    </div>
    
    <div style="flex: 1; min-width: 250px;">
        <label style="font-weight: bold; display: block; margin-bottom: 8px;">
            Top-$k$: <span id="k-display" style="color: #3b82f6;">5</span>
        </label>
        <input type="range" id="slider-k" min="1" max="10" step="1" value="5" style="width: 100%;">
        <small style="color: #64748b;">Only top $k$ words survive the cut.</small>
    </div>
    
    <div style="display: flex; align-items: flex-end;">
        <button class="btn" onclick="Sampler.rollDice()">Roll for Next Word</button>
    </div>
</div>

<div class="transformer-grid">
    <div class="panel">
        <h2>Probability Distribution</h2>
        <div id="sampling-plot" style="height: 400px;"></div>
    </div>

    <div class="panel">
        <h2>Sampling Results</h2>
        <div id="results-table" style="margin-top: 10px;">
            </div>
    </div>
</div>

<style>
    .panel { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .result-row { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #f1f5f9; align-items: center; }
    .result-row.selected { background: #fef9c3; border: 2px solid #facc15; border-radius: 6px; font-weight: bold; transform: scale(1.02); }
    .result-row.discarded { opacity: 0.4; text-decoration: line-through; color: #94a3b8; }
    .bar-label { font-size: 0.8rem; font-weight: bold; }
</style>
