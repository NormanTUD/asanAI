<?php include_once("functions.php"); ?>

<div class="md" style="max-width: 800px; margin: 0 auto;">

## The Vanishing Gradient Problem

To train a neural network, we use **Backpropagation**. This algorithm calculates how much each weight contributed to the final error (loss) so we can adjust the weights to reduce that error.

Mathematically, we use the **Chain Rule** of calculus. In a standard "Plain" network (like VGG or AlexNet), the input $x$ passes through a series of layers to produce output $y$.

$$ y = f_L(f_{L-1}(... f_1(x)...)) $$

During backpropagation, to find the gradient of the loss $\mathcal{L}$ with respect to the first layer's weights, we must multiply the derivatives of *every* layer in the network:

$$ \frac{\partial \mathcal{L}}{\partial x_0} = \frac{\partial \mathcal{L}}{\partial x_L} \cdot \underbrace{\frac{\partial x_L}{\partial x_{L-1}} \cdot \frac{\partial x_{L-1}}{\partial x_{L-2}} \cdots \frac{\partial x_1}{\partial x_0}}_{\text{Multiplicative Chain}} $$

### Why "Vanishing"?
If the derivatives (gradients) in this chain are small (e.g., $< 1$), multiplying many of them together causes the result to shrink exponentially.
* **Plain Network:** $0.9 \times 0.9 \times 0.9 \dots \approx 0$
* **Result:** The early layers stop learning because their gradient update is effectively zero. Deep networks become impossible to train.

This was first mathematically accurately described by \citeauthor{hochreiter1991vanishing} in his Diplomarbeit \citetitle{hochreiter1991vanishing}, the term 'Vanishing Gradient' was first coined by Yoshua Bengio et al. in their \citeyear{bengio1994learning} paper '\citetitle{bengio1994learning}'.

## The Residual Solution

ResNet (Residual Network) changes the fundamental building block. Instead of trying to learn the mapping $H(x)$ directly, we ask the network to learn the **residual** (the difference) $F(x) := H(x) - x$. The original mapping is reconstructed as:

$$ y = F(x, \{W_i\}) + x $$

Where:
* $x$ is the input to the block (the "Identity Connection").
* $F(x)$ is the learned transformation (usually 2 or 3 convolution layers).

### The Gradient "Superhighway"
Let's look at the gradient of this new block during backpropagation:

$$ \frac{\partial y}{\partial x} = \frac{\partial (F(x) + x)}{\partial x} = \frac{\partial F(x)}{\partial x} + \mathbf{1} $$

The **$+1$** term is the magic. It ensures that the gradient can flow directly from the later layers to the earlier layers without being multiplied by the weights of the intermediate layers. Even if the weights in $F(x)$ are very small (causing $\frac{\partial F}{\partial x} \approx 0$), the gradient signal is preserved by the identity term.

## Handling Dimension Mismatches ($1 \times 1$ Convs)

The equation $y = F(x) + x$ requires that the dimensions of $x$ and $F(x)$ be identical so they can be added element-wise. However, Convolutional Neural Networks (CNNs) often change dimensions to process features at different scales:
1.  **Downsampling:** Reducing Height/Width (Stride > 1).
2.  **Channel Expansion:** Increasing the number of filters (Depth).

When the dimensions don't match, we cannot simply add $x$. We must transform $x$ using a **projection shortcut** ($W_s$):

$$ y = F(x, \{W_i\}) + W_s x $$

### The $1 \times 1$ Convolution
The most common way to implement $W_s$ is a **$1 \times 1$ Convolution**.
* **Spatial:** A $1 \times 1$ kernel does not look at neighboring pixels; it preserves the spatial height and width ($H \times W$).
* **Depth:** It acts as a linear projection across the channels. If input $x$ has $C_\text{in}$ channels and we need $C_\text{out}$ channels, the $1 \times 1$ layer performs a weighted sum of the input channels to produce the desired output depth.


#### Mathematical Operation at a single pixel $(i, j)$:
If input $x \in \mathbb{R}^{H \times W \times C_\text{in}}$ and we want output $y \in \mathbb{R}^{H \times W \times C_\text{out}}$:

$$ y_{i,j,k} = \sum_{c=0}^{C_\text{in}} w_{k,c} \cdot x_{i,j,c} $$

This allows the network to match the "shape" of the main path $F(x)$ so the residual connection can still function, keeping the flow of gradients intact.

</div>

<div class="lab-container" style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;">
    
    <div class="panel">
        <i>Visual Graph</i>
        <div id="network-viz" style="height:150px; width:100%; background:white; border-radius:8px; margin-top:10px;"></div>
    </div>

    <div class="panel">
        <i>Gradient Propagation Plot:</i>
        <div id="gradient-plot" style="height:300px; width:100%;"></div>
    </div>

    <div class="panel" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start;">
        <div>
            <label><b>Network Depth:</b></label>
            <input type="range" id="net-depth" min="2" max="100" value="20" 
                   style="width:100%" oninput="document.getElementById('depth-val').innerText = this.value; ResNetLab.compare();">
            <center><b id="depth-val">20</b> Layers</center>
            
            <hr>
            <i>Tensor Shape Flow</i>
            <div style="font-size: 0.8em; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0; margin-top:10px;">
                <div style="display:flex; justify-content:space-between;"><span>Input $x$:</span> <b>[64, 64, 3]</b></div>
                <div style="display:flex; justify-content:space-between;"><span>Conv Path:</span> <b>[64, 64, 3]</b></div>
                <div style="display:flex; justify-content:space-between; color:#3b82f6; border-top: 1px solid #ddd; margin-top:5px; padding-top:5px;">
                    <span>Output ($F(x)+x$):</span> <b>[64, 64, 3]</b>
                </div>
            </div>
        </div>

        <div>
            <i>Handling Channel Mismatches</i>
            <p style="font-size: 0.85em; line-height: 1.4; color: #334155; margin-bottom:10px;">
                If Layer A has <b>4 filters</b> and Layer B has <b>2 filters</b>, we use a <b>$1 \times 1$ Convolution</b> ($W_s$) to project the shape:
            </p>

            <div style="font-size: 0.8em; background: #fff4ed; padding: 10px; border-radius: 4px; border: 1px solid #fb923c;">
                <div style="display:flex; justify-content:space-between;"><span>Source $x$:</span> <b style="color:#e65100;">[H, W, 4]</b></div>
                <div style="display:flex; justify-content:space-between;"><span>$1 \times 1$ Conv ($W_s$):</span> <b>[1, 1, 4, 2]</b></div>
                <div style="display:flex; justify-content:space-between; border-top: 1px solid #fdba74; margin-top:5px; padding-top:5px;">
                    <span>Projected $x$:</span> <b style="color:#22c55e;">[H, W, 2]</b>
                </div>
            </div>
            <p style="font-size: 0.75em; color: #64748b; margin-top:10px;">
                <b>The Math:</b> $y = F(x, \{W_i\}) + W_s x$
            </p>
        </div>
    </div>
</div>
