<?php include_once("functions.php"); ?>
<div class="md">
A Transformer doesn't just look at a word's vector; it looks at the **entire sentence**. 
It asks: *"Which other words should I pay attention to?"*
</div>

<div class="md" style="margin-top:20px;">
### The "Context" Lab
Type **"bank river"** (Nature) or **"bank money"** (Finance) into the field below. 
The AI will "pull" the word **Bank** towards the meaning of its neighbor.
</div>

<div class="grid-layout">
    <div class="layers-vertical">
        <h2>Context Input</h2>
        <input type="text" id="trans-input" class="bw-cell" style="width: 100%; padding: 10px; font-weight: bold;" 
               value="bank river" oninput="runAttention()">
        
        <div id="trans-console" class="status-console" style="height: 120px;">
            Ready. Type 'bank river' or 'bank money'...
        </div>

        <p style="font-size: 0.8rem; color: #64748b;">
            *Orange line = Attention. The diamond shows where "Bank" moves in context.*
        </p>
    </div>
    <div id="transformer-plot" class="plot-container" style="height: 450px; background: #fff;"></div>
</div>


