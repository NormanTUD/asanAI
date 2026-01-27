<?php include_once("functions.php"); ?>

<div class="md">
    In AI, we don't always know the right answer immediately. Instead, we use a **Loss Function**—think of this as a "Scoreboard" that tells us how many mistakes the AI is making. 

    The goal of an AI is to get the lowest score possible (zero mistakes). To do that, the AI has to figure out which direction to move to find the bottom of the valley.

    ## Finding the Way Down
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

### Understanding the Partial Derivative ($\partial$)

In the interactive lab above, we looked at a function with only one input ($x$). For that, we use the standard $d$ to represent a derivative. However, AI models usually have millions of inputs. When we deal with multiple variables, we use the **partial derivative** symbol: $\partial$.

#### The Theory: Isolation
The partial derivative is a way to measure how a single variable affects the final result while ignoring everything else.

* **The Problem:** In a complex system, changing two things at once makes it impossible to know which change caused the result.
* **The Solution:** We "freeze" all variables except one. We treat those frozen variables as if they were plain, unmoving numbers (constants).
* **The Symbol:** We write $\frac{\partial f}{\partial x}$ to say: "Find the slope of function $f$, but only look at the $x$ direction."

#### The Practical Example: Minimizing Prediction Error

Imagine an AI trying to predict house prices. To improve, the AI needs to minimize its **Loss** ($f$), which represents the mathematical "distance" between its guess and the actual price. In this scenario, the Loss depends on two internal settings the AI is adjusting: the weight given to **Size** ($x$) and the weight given to **Age** ($y$).

Let’s define the **Loss Function** as:
$$f(x, y) = x^2 + 3y$$

To reduce the error, the AI needs to know which direction to "step" by calculating partial derivatives.

**Step A: Find the influence of the Size weight ($\frac{\partial f}{\partial x}$)**
To do this, we treat the **Age weight** ($y$) as a constant.
* The derivative of $x^2$ is $2x$.
* Since $3y$ is treated as a constant, its derivative is $0$.
* **Result:** $\frac{\partial f}{\partial x} = 2x$.
* **Concrete Number:** If the current weight for size is $x = 4$, the gradient is $2(4) = \mathbf{8}$. This tells the AI that increasing this weight will significantly increase the error, so it should move in the opposite direction.

**Step B: Find the influence of the Age weight ($\frac{\partial f}{\partial y}$)**
Now, we treat the **Size weight** ($x$) as the constant.
* Since $x^2$ is now a constant, its derivative is $0$.
* The derivative of $3y$ is $3$.
* **Result:** $\frac{\partial f}{\partial y} = \mathbf{3}$.
* **Concrete Number:** The gradient is a constant 3. This means for every unit we increase the age weight, the error increases by 3 units. To minimize loss, the AI knows it must decrease this weight.

#### Why it Matters for AI
The AI combines these individual slopes into a **Gradient Vector**:
$$\nabla f = [8, 3]$$

This vector tells the AI exactly how much to adjust each "knob" (Size and Age) to reach the goal. Just like the **"Take 1 Step Down"** button in your lab, the AI uses these numbers to move toward the minimum error by updating each variable independently:
* $x_\text{new} = x_\text{old} - (\text{Learning Rate} \times 8)$
* $y_\text{new} = y_\text{old} - (\text{Learning Rate} \times 3)$

### The "Backpropagation" Bridge: The Chain Rule

You’ve learned how to find the slope of one hill. But a Deep AI is like a **chain of hills**. When the AI makes a mistake at the very end (the output), it has to figure out which "knob" at the very beginning (the input) caused it.

This is called **Backpropagation**, and it relies on the **Chain Rule**.

#### The Message Passing
Imagine three gears connected in a line: Gear A, Gear B, and Gear C.
* If you turn Gear A, it turns Gear B.
* If Gear B turns, it turns Gear C.

If you want to know how fast Gear C moves when you touch Gear A, you just multiply the ratios:
$$\frac{\partial \text{Output}}{\partial \text{Input}} = \frac{\partial \text{Node B}}{\partial \text{Input}} \times \frac{\partial \text{Output}}{\partial \text{Node B}}$$

#### Why "Back"?
In AI, we calculate the error at the end first. We then pass that "error message" backward through the chain. Each layer multiplies the incoming message by its own local slope.
</div>
