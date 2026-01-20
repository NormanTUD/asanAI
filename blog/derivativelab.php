<?php include_once("functions.php"); ?>

<div class="md">
    ## From Functions to Optimization

    In the previous section, we looked at functions like $f(x) = ax + b$ as rules we write by hand. In **AI Programming**, we don't know what the "perfect" values for $a$ (the weight) or $b$ (the bias) are. Instead, we define a **Loss Function**—a mathematical way to measure how "wrong" our model is.

    The goal of an AI is to find the lowest point of that Loss Function (where the error is smallest). To find that bottom, the AI needs to know which way is "downhill." This is where the **Derivative** comes in.

    ### The Mathematical Foundation
    The derivative represents the **instantaneous rate of change**. In code, we can't always calculate the perfect mathematical derivative instantly, so we approximate it using the **Difference Quotient**:
    
    $$f'(x) \approx \frac{f(x + h) - f(x)}{h}$$
    
    Imagine you are standing on a hill in a thick fog. To find the way down, you take a tiny step ($h$) to the side, check if you are higher or lower than before ($\Delta y$), and calculate the steepness.

    
    ### The Optimizer: Gradient Descent
    Once we know the slope, we use it to update our "container" (the variable). In the intro, we manually set $x = 1 + 1$. In AI, the computer updates variables automatically using **Gradient Descent**:
    
    $$w_{\text{new}} = w_{\text{old}} - \eta \cdot f'(w)$$
    
    * $f'(w)$ is the **Gradient** (the slope).
    * $\eta$ (eta) is the **Learning Rate** (how big of a step we take).
    * We **subtract** the gradient because if the slope is positive (uphill), we want to go the opposite way to find the valley.
</div>

<div class="derivative-lab-container" style="padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; flex-direction: column; gap: 20px; background: #fff;">
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
        <div>
            <label><b>Function $f(x)$ (The "Landscape")</b></label>
            <select id="deriv-func-select" class="btn" style="width: 100%; margin-top: 5px; padding: 5px;">
                <option value="x*x">Quadratic: x² (Simple Valley)</option>
                <option value="Math.cos(x)">Trigonometric: cos(x)</option>
                <option value="Math.pow(x,4)/4 - Math.pow(x,2)">Non-Convex: ¼(x⁴) - x² (Complex Terrain)</option>
            </select>
        </div>
        
        <div>
            <label><b>Current Position ($x$)</b></label>
            <input type="range" id="deriv-x-slider" min="-4" max="4" step="0.01" value="1.5" style="width: 100%;">
            <div style="display:flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                <span id="deriv-x-value" style="font-family: monospace;">x = 1.50</span>
                <button id="take-step" class="btn-primary" style="padding: 5px 12px; font-size: 0.85em; cursor: pointer; background: #10b981; color: white; border: none; border-radius: 4px;">Run 1 Step of AI $\to$</button>
            </div>
        </div>
        
        <div>
            <label><b>Look-ahead Distance ($h$)</b></label>
            <input type="range" id="deriv-h-slider" min="0.0001" max="2" step="0.01" value="0.8" style="width: 100%;">
            <span id="deriv-h-value" style="font-family: monospace;">h = 0.80</span>
        </div>
    </div>

    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div id="plot-derivative" style="flex: 2; min-width: 300px; height: 450px;"></div>
        
        <div id="deriv-stats" style="flex: 1; min-width: 250px; padding: 15px; border-left: 4px solid #10b981; background: #f8fafc;">
            <h4 style="margin-top:0;">Calculus Breakdown</h4>
            <div id="math-output">
                </div>
            <hr style="margin: 15px 0; border: 0; border-top: 1px solid #e2e8f0;">
            <h4 style="margin-top:0;">Optimizer Logic</h4>
            <div id="ai-logic" style="font-size: 0.95em; line-height: 1.6;">
                </div>
        </div>
    </div>
</div>

<div class="md" style="margin-top: 30px;">
    ### Observations
    1.  **The Secant vs. The Tangent:** The red line (Secant) shows the slope over the distance $h$. As you make $h$ smaller, the red line eventually becomes the green dashed line (the Tangent), which is the true derivative at that exact point.
    2.  **Learning:** Click "Run 1 Step of AI." You will see the $x$ position update. This is exactly how a Neural Network "learns" to recognize a cat—it adjusts its internal numbers ($x$) to move toward the point where the error (the height of the curve) is lowest.
    3.  **Local Minima:** In the "Non-Convex" function, notice there are two valleys. Depending on where you start, the AI might get "stuck" in the shallow valley instead of the deep one. This is one of the biggest challenges in real AI programming!
</div>
