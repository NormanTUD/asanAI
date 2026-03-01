<?php include_once("functions.php"); ?>

<div class="md">
## Training
### Grokking

**\cite[Grokking]{grokking}** is a phenomenon in deep learning where a model suddenly transitions from **memorization** to **generalization** long after it seems to have plateaued.
Originally identified by **Power et al. (2022)**, this "aha moment" occurs when a model achieves 100% training accuracy but 0% validation accuracy for an extended period,
only to have validation accuracy jump to 100% within a few epochs. This indicates a shift from high-frequency noise-fitting to the discovery of an underlying algorithmic pattern.
Structurally, this is often marked by a transition in **attention matrices** from messy, uniform distributions to clean, highly structured representations.

## Math

### How are Sine and Cosine calculated?

Computers evaluate sine and cosine using **Taylor Series** (infinite polynomial approximations):

$$\sin\theta = \theta - \frac{\theta^3}{3!} + \frac{\theta^5}{5!} - \frac{\theta^7}{7!} + \dots \qquad \cos\theta = 1 - \frac{\theta^2}{2!} + \frac{\theta^4}{4!} - \frac{\theta^6}{6!} + \dots$$

The more terms you include, the better the approximation. You can explore this below.

</div>
<!-- ─── Interactive: Taylor Series Approximation ─── -->
<div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 20px 0;">
    <p style="color:#64748b; font-size:0.9em;">Increase the number of terms to see how the polynomial converges to the true $\sin$ curve. With just 5 terms, the match is nearly perfect over $[-2\pi, 2\pi]$!</p>

    <div style="margin-bottom:10px;">
        <strong>Number of Taylor terms $N$:</strong>
        <input type="range" id="slider-taylor-n" min="1" max="10" step="1" value="1" style="width:250px;">
        <span id="disp-taylor-n" style="font-family:monospace; font-weight:bold; color:#2563eb;">1</span>
    </div>

    <div id="taylor-formula" style="text-align:center; font-size:1.1em; margin:10px 0; background:#f8fafc; padding:10px; border-radius:6px; min-height:40px; overflow-x:auto; white-space:nowrap;"></div>

    <div id="plot-taylor" class="plot-container" style="width:100%; height:350px;"></div>
</div>
