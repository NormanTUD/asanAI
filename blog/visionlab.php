<?php include_once("functions.php"); ?>
    <h2>Vision Lab (Convolution & Matrix)</h2>
    
    <div style="margin-bottom: 15px; display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="btn" onclick="setKernel([[0,-1,0],[-1,5,-1],[0,-1,0]])">Sharpen</button>
        <button class="btn" onclick="setKernel([[1/9,1/9,1/9],[1/9,1/9,1/9],[1/9,1/9,1/9]])">Blur</button>
        <button class="btn" onclick="setKernel([[-1,-1,-1],[-1,8,-1],[-1,-1,-1]])">Edge</button>
        <button class="btn" onclick="setKernel([[0,0,0],[0,1,0],[0,0,0]])">Identity</button>
        <button class="btn" onclick="setKernel([[-1,-2,-1],[0,0,0],[1,2,1]])">Sobel H</button>
        <button class="btn" onclick="setKernel([[-1,0,1],[-2,0,2],[-1,0,1]])">Sobel V</button>
        <button class="btn" onclick="setKernel([[-2,-1,0],[-1,1,1],[0,1,2]])">Emboss</button>
        <button class="btn" onclick="setKernel([[1/16,2/16,1/16],[2/16,4/16,2/16],[1/16,2/16,1/16]])">Gaussian</button>
    </div>

    <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start;">
        <div style="position: relative; line-height: 0; display: inline-block;">
            <b style="line-height: 1.5; display: block;">Original (Hover me!)</b>
            <canvas id="conv-src-display" class="vision-canvas" width="50" height="50" style="cursor: none; border: 1px solid #ccc;"></canvas>
            <div id="conv-focus" style="position: absolute; border: 2px solid red; pointer-events: none; display: none; box-sizing: border-box; z-index: 10;"></div>
        </div>

        <div>
            <b>Filter Kernel</b><br>
            Size: <input type="number" id="k-size" value="3" min="1" max="5" step="2" onchange="initVisionLab()">
            <table id="kernel-table" style="margin-top: 10px; border-collapse: collapse;"></table>
        </div>

        <div id="conv-res-container" style="position: relative; line-height: 0; display: inline-block;">
            <b style="line-height: 1.5; display: block;">Filtered Result</b>
            <canvas id="conv-res" class="vision-canvas" width="50" height="50" style="border: 1px solid #ccc;"></canvas>
            <div id="conv-crosshair" style="position: absolute; pointer-events: none; display: none; z-index: 10;">
                <div style="position: absolute; width: 10px; height: 2px; background: red; left: -5px; top: -1px;"></div>
                <div style="position: absolute; width: 2px; height: 10px; background: red; left: -1px; top: -5px;"></div>
            </div>
        </div>
    </div>

    <div id="conv-math-step" style="margin-top: 20px; padding: 15px; background: #f8fafc; border: 1px solid #cbd5e0; border-radius: 8px; font-size: 0.85rem; overflow-x: auto; min-height: 100px;">
        Move mouse over the image to see the math...
    </div>

    <img id="conv-src-hidden" src="example.jpg" crossorigin="anonymous" style="display:none">
    <div id="visionlab-console" style="display: none" class="status-console"></div>

<div class="md">
# 2. Vision Lab
This module demonstrates how **Convolutional Neural Networks** perform edge detection and feature extraction.
* **Sharpen:** Highlights contrasts.
* **Blur:** Smoothens the image.
> **Note:** Hover your mouse over the source image to see the matrix multiplication in real-time.
</div>
