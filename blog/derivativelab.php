<?php include_once("functions.php"); ?>

<div class="md">
    ## How AI "Learns" to Get Better

    In AI, we don't always know the right answer immediately. Instead, we use a **Loss Function**—think of this as a "Scoreboard" that tells us how many mistakes the AI is making. 

    The goal of an AI is to get the lowest score possible (zero mistakes). To do that, the AI has to figure out which direction to move to find the bottom of the valley.

    ### Finding the Way Down
    Imagine you are standing on a foggy mountain. You can't see the bottom, but you can feel the ground under your feet. To find the way down, you:
    1.  **Look Ahead:** Take a tiny "probe" step ($h$) to the side.
    2.  **Check the Change:** See if that step made your height go up or down.
    3.  **Calculate the Slope:** This tells you how steep the hill is right where you are standing.
    
    In math, we write this simple "steepness check" like this:
    
    $$\text{Slope} \approx \frac{f(x + h) - f(x)}{h}$$
    
    ### Moving Toward the Goal: Gradient Descent
    Once the AI knows which way is "downhill," it updates its position. This is called **Gradient Descent**. 
    
    * **The Slope:** Tells us the direction.
    * **The Learning Rate:** Tells us how big of a step to take.
    * **The Update:** If the slope is positive (going up), the AI moves the opposite way to go down.

    $$x_{\text{new}} = x_{\text{old}} - (\text{Learning Rate} \times \text{Slope})$$
</div>

<div class="derivative-lab-container" style="padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; flex-direction: column; gap: 20px; background: #fff;">
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
        <div>
            <label><b>1. Pick a Landscape</b></label>
            <select id="deriv-func-select" class="btn" style="width: 100%; margin-top: 5px; padding: 5px;">
                <option value="x*x">Simple Valley (x²)</option>
                <option value="Math.cos(x)">Waves (cos x)</option>
                <option value="Math.pow(x,4)/4 - Math.pow(x,2)">Complex Hills (Non-Convex)</option>
            </select>
        </div>
        
        <div>
            <label><b>2. Your Position ($x$)</b></label>
            <input type="range" id="deriv-x-slider" min="-4" max="4" step="0.01" value="1.5" style="width: 100%;">
            <div style="display:flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                <span id="deriv-x-value" style="font-family: monospace;">x = 1.50</span>
                <button id="take-step" class="btn-primary" style="padding: 5px 12px; font-size: 0.85em; cursor: pointer; background: #10b981; color: white; border: none; border-radius: 4px;">Take 1 Step Down $\to$</button>
            </div>
        </div>
        
        <div>
            <label><b>3. Look-ahead Distance ($h$)</b></label>
            <input type="range" id="deriv-h-slider" min="0.0001" max="2" step="0.01" value="0.8" style="width: 100%;">
            <span id="deriv-h-value" style="font-family: monospace;">h = 0.80</span>
        </div>
    </div>

    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div id="plot-derivative" style="flex: 2; min-width: 300px; height: 450px;"></div>
        
        <div id="deriv-stats" style="flex: 1; min-width: 250px; padding: 15px; border-left: 4px solid #10b981; background: #f8fafc;">
            <h4 style="margin-top:0;">The Math Breakdown</h4>
            <div id="math-output">
                </div>
            <hr style="margin: 15px 0; border: 0; border-top: 1px solid #e2e8f0;">
            <h4 style="margin-top:0;">AI Decision</h4>
            <div id="ai-logic" style="font-size: 0.95em; line-height: 1.6;">
                </div>
        </div>
    </div>
</div>

<div class="md" style="margin-top: 30px;">
    ### What to Watch For
    1.  **The "Probe" Step:** Notice the red line. It shows the AI "looking ahead" by distance $h$. If you make $h$ very small, the AI gets a much more accurate sense of the slope exactly where it is standing.
    2.  **Learning in Action:** Click **"Take 1 Step Down."** The AI calculates the steepness and automatically moves the slider toward the bottom. This is how a self-driving car or a chatbot improves—it keeps moving "downhill" until its errors are as small as possible.
    3.  **Getting Stuck:** Try the "Complex Hills" landscape. If you start the AI in the wrong place, it might find a small valley and get stuck there, even if there is a much deeper valley further away!
</div>
