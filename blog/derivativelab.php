<?php include_once("functions.php"); ?>
<div class="md">
    ### The Mathematical Foundation
    The derivative represents the **instantaneous rate of change**. In code, we approximate this using the **Difference Quotient**:
    
    $$f'(x) \approx \frac{f(x + h) - f(x)}{h}$$
    
    As $h \to 0$, this approximation becomes the exact derivative. In AI, we use this to update weights via **Gradient Descent**:
    
    $$w_{new} = w_{old} - \eta \cdot f'(w)$$
    
    where $\eta$ is the **Learning Rate**.
</div>

<div class="derivative-lab-container" style="padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; flex-direction: column; gap: 20px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
        <div>
            <label><b>Function $f(x)$</b></label>
            <select id="deriv-func-select" class="btn" style="width: 100%; margin-top: 5px;">
                <option value="x*x">Quadratic: x²</option>
                <option value="Math.cos(x)">Trigonometric: cos(x)</option>
                <option value="Math.pow(x,4)/4 - Math.pow(x,2)">Non-Convex: x⁴/4 - x²</option>
            </select>
        </div>
        
        <div>
            <label><b>Position ($x$)</b></label>
            <input type="range" id="deriv-x-slider" min="-4" max="4" step="0.01" value="1.5" style="width: 100%;">
            <div style="display:flex; justify-content: space-between;">
                <span id="deriv-x-value">x = 1.50</span>
                <button id="take-step" class="btn-primary" style="padding: 2px 10px; font-size: 0.8em;">Step AI $\to$</button>
            </div>
        </div>
        
        <div>
            <label><b>Step Size ($h$)</b></label>
            <input type="range" id="deriv-h-slider" min="0.0001" max="2" step="0.01" value="0.8" style="width: 100%;">
            <span id="deriv-h-value">h = 0.80</span>
        </div>
    </div>

    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div id="plot-derivative" style="flex: 2; min-width: 300px; height: 450px;"></div>
        
        <div id="deriv-stats" style="flex: 1; min-width: 250px; padding: 15px; border-left: 2px solid #10b981;">
            <h4 style="margin-top:0;">Calculus Breakdown</h4>
            <div id="math-output">
                </div>
            <hr style="margin: 15px 0; border: 0; border-top: 1px solid #eee;">
            <h4 style="margin-top:0;">Optimizer Logic</h4>
            <div id="ai-logic" style="font-size: 0.9em;"></div>
        </div>
    </div>
</div>
