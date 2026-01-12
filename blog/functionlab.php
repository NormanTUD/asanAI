<?php include_once("functions.php"); ?>

<div class="md">
    ## 1. The Foundation: $f(x) = x$
    Imagine a slide where for every inch you move forward, you go exactly one inch down. It’s the simplest relationship possible: the output is a perfect mirror of the input.
</div>

<pre><code class="language-python"># This function simply returns exactly what you give it
def identity_function(x):
    return x

print(identity_function(5)) # Output: 5
</code></pre>

<div id="plot-step-1" class="plot-container" style="height: 250px; margin-bottom: 40px;"></div>

<hr>

<div class="md">
    ## 2. Interactive: The Straight Line ($ax + b$)
    In AI, we call these **Weights** ($a$) and **Biases** ($b$). 
    * The **Weight** ($a$) changes the steepness (slope). 
    * The **Bias** ($b$) moves the whole line up or down. 
    By tuning these two numbers, a computer can try to "draw" a line that goes through a group of messy data points.
</div>

<div style="margin-bottom: 10px;">
    Weight ($a$): <input type="range" id="slider-6-a" min="-5" max="5" step="0.1" value="1"> 
    Bias ($b$): <input type="range" id="slider-6-b" min="-10" max="10" step="1" value="0">
</div>
<div id="formula-6" style="font-size: 1.2em; margin-bottom: 10px; min-height: 1.5em;">$$f(x) = 1x + 0$$</div>

<pre><code class="language-python"># Predict a value based on weight 'a' and bias 'b'
def linear_predict(x, a, b):
    return a * x + b

# If a=2 and b=1, then f(3) = 2*3 + 1 = 7
print(linear_predict(3, 2, 1)) # Output: 7
</code></pre>

<div id="plot-step-6" class="plot-container" style="height: 300px; margin-bottom: 40px;"></div>

<hr>

<div class="md">
    ## 3. The Third Dimension: $f(x, y) = x + y$
    Real life isn't just one input. Think of a house price: it depends on the size ($x$) AND the location ($y$). When we have two inputs, the "line" becomes a flat **surface** or a sheet floating in space.
</div>

<pre><code class="language-python"># A function that takes two inputs
def add_inputs(x, y):
    return x + y

print(add_inputs(10, 5)) # Output: 15
</code></pre>

<div id="plot-step-4" class="plot-container" style="height: 350px; margin-bottom: 40px;"></div>

<hr>

<div class="md">
    ## 4. Interactive: The Slanted Plane ($ax + by$)
    Just like before, we can give each input its own "importance" (Weight). If $a$ is high, $x$ matters a lot. If $b$ is zero, $y$ is ignored completely. This is how a Neural Network starts to prioritize information.
</div>

<div style="margin-bottom: 10px;">
    Weight X ($a$): <input type="range" id="slider-7-a" min="-2" max="2" step="0.1" value="0.5"> 
    Weight Y ($b$): <input type="range" id="slider-7-b" min="-2" max="2" step="0.1" value="0.5">
</div>
<div id="formula-7" style="font-size: 1.2em; margin-bottom: 10px; min-height: 1.5em;">$$f(x, y) = 0.5x + 0.5y$$</div>

<pre><code class="language-python"># Weighted sum of two inputs
def weighted_sum(x, y, weight_a, weight_b):
    return (weight_a * x) + (weight_b * y)

print(weighted_sum(10, 10, 0.8, 0.2)) # Output: 10.0
</code></pre>

<div id="plot-step-7" class="plot-container" style="height: 400px; margin-bottom: 40px;"></div>

<hr>

<div class="md">
    ## 5. Interactive: Non-Linearity (Waves)
    The world isn't made of flat sheets. To recognize a face or a cat, AI needs to understand **curves**. We use "Activation Functions" (like Sine waves or Sigmoids) to turn flat planes into complex landscapes with hills and valleys.
</div>

<div style="margin-bottom: 10px;">
    Frequency: <input type="range" id="slider-5-freq" min="0.1" max="2.0" step="0.1" value="0.5"> 
    Amplitude: <input type="range" id="slider-5-amp" min="0.5" max="5.0" step="0.1" value="1.0">
</div>
<div id="formula-5" style="font-size: 1.2em; margin-bottom: 10px; min-height: 1.5em;">$$f(x, y) = 1.0 \cdot (\sin(0.5x) + \sin(0.5y))$$</div>

<pre><code class="language-python">import math

# Using a wavy function to create complex patterns
def wave_function(x, y, freq, amp):
    return amp * (math.sin(freq * x) + math.sin(freq * y))

print(wave_function(1.0, 1.0, 0.5, 1.0)) # Output: ~0.958
</code></pre>

<div id="plot-step-5" class="plot-container" style="height: 450px; margin-bottom: 40px;"></div>
