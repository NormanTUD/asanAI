<?php include_once("functions.php"); ?>

<div id="intro" class="md">
    # Let's Build an Image!
    Think of a digital image like a giant grid of lightbulbs. By changing the numbers in each cell, we tell the computer how bright to make each "bulb" (called a **pixel**).
</div>

<hr>

<div class="lab-section" style="display: flex; flex-direction: column; gap: 40px;">
    
    <div id="section-bw">
        <div class="md">
            ## Step 1: Grayscale (Black & White)
            In a black and white image, we only need **one number** for each pixel. 
            * **0** is like turning the light off (**Black**).
            * **255** is the maximum brightness (**White**).
            * Numbers in between make different shades of gray!
        </div>
        
        <div style="display: flex; align-items: center; gap: 40px; padding: 20px; background: #f9f9f9; border-radius: 12px; margin-top: 15px;">
            <div style="flex: 0 0 320px;">
                <div id="bw-matrix-container"></div>
            </div>
            <div style="flex: 1; text-align: center;">
                <canvas id="bw-preview-canvas" width="3" height="3" style="width: 180px; height: 180px; image-rendering: pixelated; border: 4px solid #333;"></canvas>
                <p class="md">**Your 3x3 Grayscale Drawing**</p>
            </div>
        </div>
    </div>

    <hr>

    <div id="section-rgb">
        <div class="md">
            ## Step 2: Adding Color (RGB)
            To make colors, we use **three numbers** for every single pixel: one for **Red**, one for **Green**, and one for **Blue**.
            
            We can think of a pixel $P$ as a stack of three values:
            $$P = \begin{bmatrix} \color{red}{R} \\ \color{green}{G} \\ \color{blue}{B} \end{bmatrix}$$
            
            By mixing these three primary lights at different brightness levels (0 to 255), you can create any color in the world!
        </div>

        <div style="display: flex; align-items: center; gap: 40px; padding: 20px; background: #f0f7ff; border-radius: 12px; margin-top: 15px;">
            <div style="flex: 0 0 320px;">
                <div id="rgb-combined-container"></div>
            </div>
            <div style="flex: 1; text-align: center;">
                <canvas id="rgb-preview-canvas" width="3" height="3" style="width: 180px; height: 180px; image-rendering: pixelated; border: 4px solid #333;"></canvas>
                <p class="md">**Your 3x3 Color Drawing**</p>
            </div>
        </div>
    </div>
</div>
