<?php include_once("functions.php"); ?>
<div class="md">
## Historical Context

The idea of hierarchical visual feature detection was first introduced by \citeauthor{neocognitron} in \citeyear{neocognitron} in his landmark paper about the \cite[Neocognitron]{neocognitron}, which was directly inspired by \citeauthorlastnameand{hubelwiesel}'s Nobel Prize–winning research on the mammalian visual cortex. Years later, in \citeyear{lecun1989backpropagation}, LeCun et al. made the concept practical by combining convolutions with backpropagation to recognize handwritten ZIP codes for the U.S. Postal Service, the first commercially deployed convolutional neural network.

\citeauthorlastnameand{hubelwiesel}'s paper serves as the direct biological blueprint for Convolutional Neural Networks (CNNs):

* **Local Connectivity:** Cells respond only to small portions of the visual field (Receptive Fields).
* **Feature Hierarchy:** Simple features (edges) are combined to form complex features.
* **Pooling/Invariance:** The concept of complex cells corresponds to "Max-Pooling" in modern architectures, achieving translation invariance.

## What is a Convolution?

A **convolution** is a mathematical operation that slides a small grid of numbers (the **kernel** or **filter**) across an image, computing a weighted sum at every position. This single operation is the fundamental building block of **Convolutional Neural Networks (CNNs)**, the technology behind facial recognition, autonomous vehicles, medical imaging, and satellite analysis.

$$
(\mathbf{I} * \mathbf{K})(x, y) = \sum_{i} \sum_{j} \mathbf{I}(x+i,\; y+j) \cdot \mathbf{K}(i,\; j)
$$

Where $\mathbf{I}$ is the input image, $\mathbf{K}$ is the kernel, and $(x, y)$ is the output pixel coordinate. This is computed independently for each color channel (Red, Green, Blue).

## Why Does This Matter for AI?

In traditional computer vision, engineers **manually designed** kernels (like Sobel, Gaussian, or Laplacian filters) to detect edges, blur noise, or sharpen details. These hand-crafted filters work well for specific tasks but cannot generalize.

In **Deep Learning**, the paradigm shifts completely:

* **Kernels are Learnable Parameters:** Just as a Dense layer has weights adjusted during training, a CNN treats every number in the kernel as a **trainable weight**. The network discovers, through gradient descent, which filter values best extract useful features from the data.
* **Feature Extraction:** Through backpropagation, the network learns to detect simple edges in early layers and progressively more complex shapes (eyes, wheels, letters) in deeper layers, all without human intervention.
* **The Convolution Operation:** The math you see when hovering, multiplying a window of pixels by a matrix of weights, is exactly what happens billions of times inside a GPU when an AI processes an image.

## Understanding the Preset Filters

* **Sharpen:** Amplifies the difference between a pixel and its neighbors, enhancing fine detail and high-frequency information.
* **Edge Detection:** Highlights boundaries where pixel intensity changes abruptly. The result is a map of the image's structural skeleton.
* **Blur / Gaussian:** A low-pass filter that averages neighboring pixels, smoothing out noise at the cost of detail. Gaussian blur applies a bell-curve weighting so closer pixels contribute more.
* **Sobel (Horizontal / Vertical):** Directional gradient filters that respond strongly to edges in a specific orientation. Named after Irwin Sobel, who introduced them in 1968.
* **Emboss:** Creates a 3D relief effect by emphasizing directional intensity transitions.
* **Identity:** Passes the image through unchanged, a useful baseline for comparison.

**Try it yourself:** Click a preset button, then edit the numbers in the kernel grid. You are manually doing what a neural network does automatically during training.

**Hover** your mouse over the source image to see the element-wise multiplication in real-time. Notice how a single output pixel is computed as a weighted sum of its neighbors.
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

<div style="display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start; justify-content: center;">
	<div style="position: relative; line-height: 0; display: inline-block;">
		<b style="line-height: 1.5; display: block;">Original (Hover me!)</b>
		<canvas id="conv-src-display" class="vision-canvas" width="50" height="50" style="cursor: crosshair; border: 2px solid #cbd5e1; border-radius: 6px;"></canvas>
		<div id="conv-focus" style="position: absolute; border: 2px solid red; pointer-events: none; display: none; box-sizing: border-box; z-index: 10; border-radius: 2px;"></div>
		<div id="pixel-info" style="display:none; margin-top:6px; font-size:0.75rem; font-family:monospace; line-height:1.5; gap:8px;"></div>
	</div>

	<div>
		<b>Filter Kernel</b><br>
		Size: <input type="number" id="k-size" value="3" min="1" max="7" step="2" onchange="initVisionLab()" style="width:50px;">
		<table id="kernel-table" style="margin-top: 10px; border-collapse: collapse;"></table>
		<div style="margin-top:10px;">
			<b style="font-size:0.8rem;">Kernel Heatmap</b><br>
			<canvas id="kernel-viz" width="3" height="3" style="width:80px; height:80px; image-rendering:pixelated; border:1px solid #cbd5e1; border-radius:4px; margin-top:4px;"></canvas>
			<div style="font-size:0.65rem; color:#94a3b8; margin-top:2px;">
				<span style="color:#3b82f6;">■</span> Positive
				<span style="color:#ef4444; margin-left:6px;">■</span> Negative
			</div>
		</div>
	</div>

	<div id="conv-res-container" style="position: relative; line-height: 0; display: inline-block;">
		<b style="line-height: 1.5; display: block;">Filtered Result</b>
		<canvas id="conv-res" class="vision-canvas" width="50" height="50" style="border: 2px solid #cbd5e1; border-radius: 6px;"></canvas>
		<div id="conv-crosshair" style="position: absolute; pointer-events: none; display: none; z-index: 10;">
			<div style="position: absolute; width: 12px; height: 2px; background: red; left: -6px; top: -1px;"></div>
			<div style="position: absolute; width: 2px; height: 12px; background: red; left: -1px; top: -6px;"></div>
		</div>
	</div>
</div>

<div id="conv-math-step" style="margin-top: 20px; padding: 18px; background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1px solid #cbd5e0; border-radius: 10px; font-size: 0.85rem; overflow-x: auto; min-height: 100px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.04);">
	<span style="color:#94a3b8; font-style:italic;">👆 Move your mouse over the source image to see the convolution math computed in real-time for each pixel...</span>
</div>

<img id="conv-src-hidden" src="stop_sign.jpg" crossorigin="anonymous" style="display:none">
<div id="visionlab-console" style="display: none" class="status-console"></div>

<div class="lab-dashboard" style="display: flex; flex-direction: column; gap: 20px; padding: 20px">
<div class="md">
## The Power of Hierarchy: Building Complexity from Simplicity

A deep learning model doesn't identify a "stop sign" in a single leap. Instead, it constructs an understanding through a **layered hierarchy of abstraction**, where each successive layer examines the output of the previous one to discover increasingly complex patterns. This mirrors the architecture of the human visual cortex, where neurons in area V1 respond to simple oriented edges, while neurons in higher areas respond to faces and objects.

### Layer 1: Primitive Edge Detection

The first convolutional layer acts like a microscopic scanner. Each kernel examines a tiny local window of pixels (e.g., $3 \times 3$) to detect basic **primitives**: horizontal lines, vertical lines, diagonal edges, and color gradients.

At this stage, the network has no concept of a "sign", it only knows that there is a strong vertical gradient at coordinate $(23, 41)$ or a diagonal edge at $(67, 12)$. These raw detections form **feature maps**, one per kernel.

The four feature maps below show exactly this: each filter responds to edges at a different orientation.

### Layer 2: Pattern Composition, Finding Corners and Curves

The second convolutional layer doesn't look at the original image at all. Instead, it looks at the **feature maps** produced by Layer 1.

* **Searching for Patterns in Patterns:** If a "45° Diagonal" activation appears adjacent to a "90° Vertical" activation, Layer 2 can learn to interpret this spatial co-occurrence as a **corner**.
* **Expanding the Receptive Field:** Because each layer's kernel covers a region of the *previous* layer's output, deeper layers effectively "see" a much larger area of the original image. A $3 \times 3$ kernel in Layer 2, applied to Layer 1's output, actually represents a $5 \times 5$ region of the raw input.
* **The Heatmap Below:** The combined heatmap squares the activations to amplify regions where multiple filters fire simultaneously, these are the corners and junctions of the octagonal stop sign.

### Deeper Layers: From Parts to Objects

In a full-scale network (e.g., ResNet-50 with 50 layers, or VGG-16 with 16 layers), this process repeats:

* **Middle Layers (3–8):** Combine corners and curves to detect **parts**, a bolt head, a letter shape, the red octagonal border of a sign.
* **Deep Layers (9+):** Combine parts into **whole objects**, concluding with high mathematical certainty that the cluster of detected shapes is a **Stop Sign** and not, say, a red umbrella.
* **Final Layers:** Produce a probability distribution over all possible classes (e.g., 97.3% stop sign, 1.2% yield sign, 0.8% traffic light...).

The more layers, the more abstract and complex the representations become. However, adding layers also increases the risk of **overfitting** (memorizing training data rather than learning general patterns) and **vanishing gradients** (where learning signals fade to zero in very deep networks, a problem addressed by skip connections in ResNets).

**The Mathematical Heartbeat:** Every step of this intelligence, from finding a tiny line to identifying a vehicle, is powered by the same **Convolution Operation** you see in the math box above. By stacking these simple multiplications, the AI transforms raw numbers into visual logic.

</div>
    <div style="display: grid; grid-template-columns: 280px 1fr; gap: 20px;">
        <div class="panel" style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; height: fit-content;">
            <div style="text-align:center;">
                <canvas id="feat-src" width="100" height="100" style="border:2px solid #cbd5e1; width:200px; image-rendering:pixelated; border-radius: 4px;"></canvas>
                <p class="md">Source Image (by \citeauthor{stopsignimage})</p>
            </div>
            <div style="margin-top: 20px; padding: 12px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 8px; font-size: 0.8rem; color: #475569; border: 1px solid #e2e8f0;">
                <strong>🔍 How to read the feature maps:</strong><br>
                Each matrix (kernel) acts as a specialized "eye" that searches for specific patterns. Bright pixels in the output mean the filter found a strong match at that location. Dark pixels mean no match was detected.
            </div>
        </div>

        <div id="filter-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
        </div>
    </div>
</div>

<div class="md">

## From Visuals to Code: Building a Neural Network

Above, you manually adjusted a single kernel to see how it affects an image. In a real-world **Convolutional Neural Network (CNN)**, the computer doesn't just use one kernel; it learns many different kernels at once to find various features.

To go from a complex image (a 3D tensor) to a final decision, like "Stop Sign" or "Not a Stop Sign", we need to bridge the gap between the 2D grid and a final numerical probability. This is where **Flattening** comes in.

### The Flatten Layer: Unrolling the Grid

A Convolutional layer preserves the "grid" shape of an image to find spatial patterns like edges and corners. However, the final decision-making layer (the **Dense** layer) expects a simple, flat list of numbers.

* **What it does:** It "unrolls" the grid. For example, if your feature map is a $3 \times 3$ grid, Flattening turns those 9 pixels into a single vertical list (Vector) of 9 numbers.
* **Why we do it:** It allows the AI to take every feature it found across the entire image and combine them into a final mathematical score using a weighted sum.
* **No learnable parameters:** Unlike Conv2D or Dense layers, Flatten has zero trainable weights, it is purely a structural reshaping operation.

$$
\underbrace{\begin{pmatrix}
1 & 2 & 3 \\
4 & 5 & 6 \\
7 & 8 & 9
\end{pmatrix}}_{\text{3x3 Grid (Matrix)}}
\xrightarrow{\text{Flatten}}
\underbrace{\begin{pmatrix}
1 & 2 & 3 & 4 & 5 & 6 & 7 & 8 & 9
\end{pmatrix}}_{\text{1x9 Vector}}
$$

This layer was first described systematically by Yann LeCun in his \citeyear{lecun1998gradientbased} paper \citetitle{lecun1998gradientbased}.

### The Complete CNN Pipeline

Here is the full data flow from raw image to classification:

$$
\underbrace{\text{Image}}_{\text{100×100×3}}
\xrightarrow{\text{Conv2D}}
\underbrace{\text{Feature Maps}}_{\text{98×98×32}}
\xrightarrow{\text{MaxPool}}
\underbrace{\text{Downsampled}}_{\text{49×49×32}}
\xrightarrow{\text{Flatten}}
\underbrace{\text{Vector}}_{\text{76832×1}}
\xrightarrow{\text{Dense}}
\underbrace{\text{Output}}_{\text{P(class)}}
$$

Each arrow represents a differentiable transformation. Because every step is differentiable, we can compute gradients end-to-end and use backpropagation to train the entire pipeline jointly.

### Implementation: TensorFlow vs. PyTorch

The two most popular libraries for AI are \citealternativetitle{tensorflow2016} and \citealternativetitle{pytorch}. Here is how you define a simple network that uses a Convolutional layer, Flattens the result, and uses a Dense layer for the final output.
</div>

<?php
$pytorch = get_string_of_file_or_die("py/visionlab/pytorch.py");
$tensorflow = get_string_of_file_or_die("py/visionlab/tensorflow.py");

$visionlabcodetabs = array(
	"PyTorch" => '
<div class="md">
<b>PyTorch</b> is more explicit, requiring you to define the "Forward Pass" where data flows through the model. This gives you fine-grained control over every tensor operation, making it the preferred choice in research settings.

You can call this script with the same parameters as you can call the <b>TensorFlow</b> one.
</div>
<pre><code class="language-python">'.$pytorch.'</code></pre>
	',
	"TensorFlow" => '<div class="md">
<b>TensorFlow</b> uses a "Sequential" style where you stack layers like LEGO blocks. Its high-level Keras API makes it the go-to choice for rapid prototyping and production deployment.
</div>
<pre><code class="language-python">'.$tensorflow.'</code></pre>
',
);

render_gem_tabs($visionlabcodetabs, "visionlab");
?>
<div class="md">
Both the PyTorch and TensorFlow versions can be trained with `python3 tf.py --mode train --path dataset`, where `dataset` is a folder containing one subfolder of images for each category the model should learn. The trained model is saved as `classifier.keras` (TensorFlow) or `classifier.pth` (PyTorch). You can then classify new images with `python3 tf.py --mode predict --path dataset/cat/1.jpg`.
</div>

<div class="md">
### Summary of the Full CNN Flow

$$
\begin{array}{c}
\text{Raw Pixels} \\
\downarrow \\
\text{Normalize } [0,1] \\
\downarrow \\
\text{Conv2D (Feature Maps)} \\
\downarrow \\
\text{MaxPool (Downsample)} \\
\downarrow \\
\text{Flatten (Vector)} \\
\downarrow \\
\text{Dense + Sigmoid} \\
\downarrow \\
P(\text{class})
\end{array}
$$

1. **Input:** A raw image tensor (e.g., $100 \times 100 \times 3$ for RGB).
2. **Rescaling:** Normalize pixel values from $[0, 255]$ to $[0, 1]$ for numerical stability.
3. **Conv2D Layer:** Learns $N$ kernels to extract spatial features, edges, textures, gradients.
4. **MaxPooling:** Reduces spatial dimensions by keeping only the strongest activations in each window, providing translation invariance.
5. **Flatten:** Converts the 2D feature grid into a 1D vector so it can be fed into a Dense layer.
6. **Dense Layer:** Weighs all extracted features together to produce a final classification score.
7. **Sigmoid / Softmax:** Squashes the output into a probability between 0 and 1 (binary) or a probability distribution (multi-class).

Each of these steps is **differentiable**, meaning gradients can flow backward through the entire pipeline during training, this is the essence of **end-to-end learning**.
</div>
