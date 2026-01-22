<?php include_once("functions.php"); ?>
<div class="md">
## Convolutions, or how a computer can see

This module demonstrates the fundamental operation behind **Convolutional Neural Networks (CNNs)**, the technology that powers facial recognition, self-driving cars, and medical imaging.

In traditional computer vision, engineers manually designed kernels (like the ones in the buttons above) to find edges or blur noise. In **Deep Learning**, we don't pick these numbers ourselves.

* **Kernels are Learnable Parameters:** Just as a standard "Dense" neural layer has weights it adjusts during training, a CNN treats every number in the Filter Kernel as a **weight**.
* **Feature Extraction:** Through backpropagation, the AI learns which numbers to put in the kernel to detect useful features. It might start by learning simple edges (Sobel filters) in early layers and progress to complex shapes (eyes, wheels) in deeper layers.
* **The Convolution Operation:** The math you see when hovering—multiplying a window of pixels by a matrix of weights—is exactly what happens billions of times inside a GPU when an AI processes an image.

* **Sharpen/Edge Detection:** These are "Feature Extractors" that highlight high-frequency information.
* **Blur:** This acts as a "Low-pass filter," removing noise but also removing detail.
* **Manual Edit:** Try changing the numbers in the grid. You are manually "training" the network to respond to different patterns.

**Note:** Hover your mouse over the source image to see the matrix multiplication in real-time. Notice how a single pixel in the output is a weighted sum of its neighbors.
</div>
    
    <div style="margin-bottom: 15px; display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="btn" onclick="setKernel([[0,-1,0],[-1,5,-1],[0,-1,0]])">Sharpen</button>
        <button class="btn" onclick="setKernel([[1/9,1/9,1/9],[1/9,1/9,1/9],[1/9,1/9,1/9]])">Blur</button>
        <button class="btn" onclick="setKernel([[-1,-1,-1],[-1,8,-1],[-1,-1,-1]])">Edge</button>
        <button class="btn" onclick="setKernel([[0,0,0],[0,1,0],[0,0,0]])">Identity</button>
        <button class="btn" onclick="setKernel([[-1,-2,-1],[0,0,0],[1,2,1]])">Sobel Horizontal</button>
        <button class="btn" onclick="setKernel([[-1,0,1],[-2,0,2],[-1,0,1]])">Sobel Vertical</button>
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

<div class="lab-dashboard" style="display: flex; flex-direction: column; gap: 20px; padding: 20px">
<div class="md">
### The Power of Hierarchy: Building Complexity
In deep learning, an AI doesn't identify a "stop sign" in a single leap. Instead, it builds an understanding of the image through a **layered hierarchy**, where each successive layer looks at the one before it to find increasingly complex patterns.

#### 1. Layer 1: Simple Edges
The first layer acts like a microscopic scanner. It only looks at a tiny window of pixels—the $3 \times 3$ kernel—to find basic "primitive" features like lines, angles, or color gradients. At this stage, the AI has no concept of a "sign"; it only knows that there is a vertical line or a diagonal edge at a specific coordinate.


#### 2. Layer 2: Pattern Composition
The second layer in a CNN doesn't look at the raw pixels of the original image; it looks at the **Feature Maps** produced by Layer 1.
* **Searching for Patterns in Patterns:** Layer 2 searches for specific combinations of edges. For example, if it detects a "45° Diagonal" activation right next to a "90° Vertical" activation, it interprets this combination as a **corner**.
* **Expanding the "Receptive Field":** As layers get deeper, each "pixel" in the resulting map represents a much larger area of the original image. This is why the Heatmap highlights the general octagonal shape rather than just thin, disconnected lines.

#### 3. Deep Layers: From Geometry to Objects
In a full-scale network, this process repeats across dozens or even hundreds of layers:
* **Middle Layers:** Combine corners and curves to detect "parts" like a bolt, a letter, or the specific red octagonal boundary of a sign.
* **Final Layers:** Combine those parts to realize the **Global Concept**—concluding with high mathematical certainty that the cluster of detected shapes is a **Stop Sign**.

**The Mathematical Heartbeat:** Every step of this intelligence—from finding a tiny line to identifying a vehicle—is powered by the same **Convolution Operation** you see in the math box. By stacking these simple multiplications, the AI transforms raw numbers into visual logic.

</div>
    <div style="display: grid; grid-template-columns: 280px 1fr; gap: 20px;">
        <div class="panel" style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; height: fit-content;">
            <div style="text-align:center;">
                <canvas id="feat-src" width="100" height="100" style="border:2px solid #cbd5e1; width:200px; image-rendering:pixelated; border-radius: 4px;"></canvas>
                <p style="color: #64748b; font-size: 0.8rem;">Source Image</p>
            </div>
            <div style="margin-top: 20px; padding: 10px; background: #f8fafc; border-radius: 6px; font-size: 0.8rem; color: #475569;">
                <strong>Info:</strong> Each matrix (kernel) acts as a specialized "eye" that searches for specific patterns in the image.
            </div>
        </div>

        <div id="filter-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            </div>
    </div>
</div>
