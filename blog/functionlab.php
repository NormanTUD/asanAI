<?php include_once("functions.php"); ?>

<div class="md">
    ## 1. The Foundation: $f(x) = x$
    Before we add complexity, we start with a 1:1 relationship. Every step forward is one step up.
</div>
<div id="plot-step-1" class="plot-container" style="height: 250px; margin-bottom: 40px;"></div>

<div class="md">
    ## 2. Interactive: Adjusting the Line ($ax + b$)
    In Machine Learning, we adjust two things:
    * **Weight ($a$):** How steep is the slope?
    * **Bias ($b$):** Where does the line start on the vertical axis?
</div>
<div style="margin-bottom: 10px;">
    Weight: <input type="range" id="slider-6-a" min="-5" max="5" step="0.1" value="1"> 
    Bias: <input type="range" id="slider-6-b" min="-10" max="10" step="1" value="0">
</div>
<div id="plot-step-6" class="plot-container" style="height: 300px; margin-bottom: 40px;"></div>

<div class="md">
    ## 3. Adding a Dimension: $f(x, y) = x + y$
    When we have two inputs ($x$ and $y$), our line becomes a **surface**. It represents how two different factors combine to create one result.
</div>
<div id="plot-step-4" class="plot-container" style="height: 350px; margin-bottom: 40px;"></div>

<div class="md">
    ## 4. Interactive: Tilting the Surface ($ax + by$)
    Just like the 2D line, we can give different "importance" (weights) to each input. Watch how the paper tilts when you change the weight of $x$ versus $y$.
</div>
<div style="margin-bottom: 10px;">
    Weight X: <input type="range" id="slider-7-a" min="-2" max="2" step="0.1" value="0.5"> 
    Weight Y: <input type="range" id="slider-7-b" min="-2" max="2" step="0.1" value="0.5">
</div>
<div id="plot-step-7" class="plot-container" style="height: 400px; margin-bottom: 40px;"></div>

<div class="md">
    ## 5. Complexity: Non-Linearity
    Real-world data isn't always a flat sheet. Functions like **Sine** create waves, allowing AI to model complex patterns like sound or images.
</div>
<div id="plot-step-5" class="plot-container" style="height: 400px; margin-bottom: 40px;"></div>

<div id="plot-step-2" style="display:none;"></div>
<div id="plot-step-3" style="display:none;"></div>
