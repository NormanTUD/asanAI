<?php include_once("functions.php"); ?>

<div id="desc-1" class="md">
    ## 1. The Foundation: $f(x) = x$
    Imagine a slide where for every inch you move forward, you go exactly one inch down. It’s the simplest relationship possible.
</div>

<pre><code id="code-1" class="language-python"># This function simply returns exactly what you give it
def identity_function(x):
    return x

print(identity_function(5)) # Output: 5</code></pre>

<div id="plot-step-1" class="plot-container" style="height: 250px; margin-bottom: 40px;"></div>

<hr>

<div id="desc-6" class="md"></div>
<div style="margin-bottom: 10px;">
    Weight ($a$): <input type="range" id="slider-6-a" min="-5" max="5" step="0.1" value="1"> 
    Bias ($b$): <input type="range" id="slider-6-b" min="-10" max="10" step="1" value="0">
</div>
<div id="formula-6" style="font-size: 1.2em; margin-bottom: 10px; min-height: 1.5em;">$$f(x) = 1x + 0$$</div>

<pre><code id="code-6" class="language-python"></code></pre>

<div id="plot-step-6" class="plot-container" style="height: 300px; margin-bottom: 40px;"></div>

<hr>

<div id="desc-4" class="md">
    ## 3. The Third Dimension: $f(x, y) = x + y$
    Real life isn't just one input. When we have two inputs, the "line" becomes a flat **surface** or a sheet floating in space.
</div>

<pre><code id="code-4" class="language-python"># A function that takes two inputs
def add_inputs(x, y):
    return x + y

print(add_inputs(10, 5)) # Output: 15</code></pre>

<div id="plot-step-4" class="plot-container" style="height: 350px; margin-bottom: 40px;"></div>

<hr>

<div id="desc-7" class="md"></div>
<div style="margin-bottom: 10px;">
    Weight X ($a$): <input type="range" id="slider-7-a" min="-2" max="2" step="0.1" value="0.5"> 
    Weight Y ($b$): <input type="range" id="slider-7-b" min="-2" max="2" step="0.1" value="0.5">
</div>
<div id="formula-7" style="font-size: 1.2em; margin-bottom: 10px; min-height: 1.5em;">$$f(x, y) = 0.5x + 0.5y$$</div>

<pre><code id="code-7" class="language-python"></code></pre>

<div id="plot-step-7" class="plot-container" style="height: 400px; margin-bottom: 40px;"></div>

<hr>

<div id="desc-5" class="md"></div>
<div style="margin-bottom: 10px;">
    Frequency: <input type="range" id="slider-5-freq" min="0.1" max="2.0" step="0.1" value="0.5"> 
    Amplitude: <input type="range" id="slider-5-amp" min="0.5" max="5.0" step="0.1" value="1.0">
</div>
<div id="formula-5" style="font-size: 1.2em; margin-bottom: 10px; min-height: 1.5em;">$$f(x, y) = 1.0 \cdot (\sin(0.5x) + \sin(0.5y))$$</div>

<pre><code id="code-5" class="language-python"></code></pre>

<div id="plot-step-5" class="plot-container" style="height: 450px; margin-bottom: 40px;"></div>
