<?php include_once("functions.php"); ?>

<div id="image-desc-1" class="md">
    ## 1. Pixels as Vectors
    In digital imaging, a single pixel isn't just a point; it's a **vector** in space. For a standard color image, each pixel consists of three dimensions: **Red**, **Green**, and **Blue**.
    
    We represent a single pixel $P$ as:
    $$P = \begin{bmatrix} R \\ G \\ B \end{bmatrix}$$
</div>

<div class="lab-section" style="display: flex; flex-direction: column; gap: 30px;">
    
    <div style="display: flex; align-items: center; gap: 40px; padding: 20px;">
        <div style="flex: 0 0 320px;">
            <div id="desc-bw" class="md">
                ### Grayscale (1-Channel)
                A grayscale pixel is a scalar value $x \in [0, 255]$.
            </div>
            <div id="bw-matrix-container"></div>
        </div>
        <div style="flex: 1; text-align: center;">
            <canvas id="bw-preview-canvas" width="3" height="3" style="width: 160px; height: 160px; image-rendering: pixelated; border: 1px solid #ccc;"></canvas>
            <p class="md">_3x3 Grayscale Preview_</p>
        </div>
    </div>

    <hr>

    <div style="display: flex; align-items: center; gap: 40px; padding: 20px; border-radius: 12px;">
        <div style="flex: 0 0 320px;">
            <div id="desc-rgb" class="md">
                ### Color (3-Channel Stack)
                Here, each cell is a 3D vector. Adjust the values to see how the computer "mixes" light.
            </div>
            <div id="rgb-combined-container"></div>
        </div>
        <div style="flex: 1; text-align: center;">
            <canvas id="rgb-preview-canvas" width="3" height="3" style="width: 160px; height: 160px; image-rendering: pixelated; border: 1px solid #ccc;"></canvas>
            <p class="md">_3x3 RGB Preview_</p>
        </div>
    </div>
</div>

<hr>

<div id="image-desc-2" class="md">
    ### Deep Learning Context: Residuals
    In modern architectures like **ResNets** or **Transformers**, we often add vectors together:
    $$y = f(x) + x$$
    This "Skip Connection" allows the gradient to flow through deep networks without vanishing.
</div>
