<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: What Machines See
description: How a computer learns to see — the convolution, the feature hierarchy, the full CNN pipeline, then the task stack: detection, segmentation, SAM, Vision Transformers and 3D.
icon: &#128065;
part: 3
order: 5
color: emerald
topics: vision, architecture, programming, multimodal
-->

<div class="md">
This chapter is everything a vision model does and how it does it. First the **mechanism** — a sliding kernel (the convolution) and the feature hierarchy it builds; then the **full pipeline** that turns features into a class; and finally the **task stack** on top — **classification → detection → segmentation → 3D** — each a harder, more spatial question than the last.
</div>

<div class="md">
## Historical Context

The idea of hierarchical visual feature detection was first introduced by \citeauthor{neocognitron} in \citeyear{neocognitron} in his landmark paper about the \cite[Neocognitron]{neocognitron}, which was directly inspired by \citeauthorlastnameand{hubelwiesel}'s Nobel Prize–winning research on the mammalian visual cortex. Years later, in \citeyear{lecun1989backpropagation}, LeCun et al. made the concept practical by combining convolutions with backpropagation to recognize handwritten ZIP codes for the U.S. Postal Service, the first commercially deployed convolutional neural network.

\citeauthorlastnameand{hubelwiesel}'s paper serves as the direct biological blueprint for Convolutional Neural Networks (CNNs):

* **Local Connectivity:** Cells respond only to small portions of the visual field (Receptive Fields).
* **Feature Hierarchy:** Simple features (edges) are combined to form complex features.
* **Pooling/Invariance:** The concept of complex cells corresponds to “Max-Pooling” in modern architectures, achieving translation invariance.

## What is a Convolution?

A **convolution** is a mathematical operation that slides a small grid of numbers (the **kernel** or **filter**) across an image, computing a weighted sum at every position. This single operation is the fundamental building block of **Convolutional Neural Networks (CNNs)**, the technology behind facial recognition, autonomous vehicles, medical imaging, and satellite analysis.

$$
(\mathbf{I} * \mathbf{K})(x, y) = \sum_{i} \sum_{j} \mathbf{I}(x+i,\; y+j) \cdot \mathbf{K}(-i,\; -j)
$$

Where $\mathbf{I}$ is the input image, $\mathbf{K}$ is the kernel, and $(x, y)$ is the output pixel coordinate. This is computed independently for each color channel (Red, Green, Blue).

In one sentence, Olah captures the whole operation:

> The kernel slides to every position of the image and computes a new pixel
> as a weighted sum of the pixels it floats over.

\cite[Olah, 2014]{colah2014conv} Two consequences of that single idea are easy to miss. First, in a *learned* CNN the very same kernel is reused at every position — in the layer's weight matrix the same few values repeat along each diagonal, so identical neurons and identical weights are the same statement \cite[Olah, 2014]{colah2014conv}. Reusing one component across many positions is **weight tying** in a vision setting \cite[Olah, 2015]{colah2015types}. Second, although a convolution looks like an $O(n^2)$ sum, it can be evaluated in $O(n\log n)$ with the right transform, and it is this fast, parallel form that made large convolutions practical on GPUs \cite[Olah, 2014]{colah2014conv}.

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
<div id="computer_vision-console" style="display: none" class="status-console"></div>

<div class="lab-dashboard" style="display: flex; flex-direction: column; gap: 20px; padding: 20px">
<div class="md">
## The Power of Hierarchy: Building Complexity from Simplicity

A deep learning model doesn't identify a “stop sign” in a single leap. Instead, it constructs an understanding through a **layered hierarchy of abstraction**, where each successive layer examines the output of the previous one to discover increasingly complex patterns. This mirrors the architecture of the human visual cortex, where neurons in area V1 respond to simple oriented edges, while neurons in higher areas respond to faces and objects.

### Layer 1: Primitive Edge Detection

The first convolutional layer acts like a microscopic scanner. Each kernel examines a tiny local window of pixels (e.g., $3 \times 3$) to detect basic **primitives**: horizontal lines, vertical lines, diagonal edges, and color gradients.

At this stage, the network has no concept of a “sign”, it only knows that there is a strong vertical gradient at coordinate $(23, 41)$ or a diagonal edge at $(67, 12)$. These raw detections form **feature maps**, one per kernel.

The four feature maps below show exactly this: each filter responds to edges at a different orientation.

### Layer 2: Pattern Composition, Finding Corners and Curves

The second convolutional layer doesn't look at the original image at all. Instead, it looks at the **feature maps** produced by Layer 1.

* **Searching for Patterns in Patterns:** If a “45° Diagonal” activation appears adjacent to a “90° Vertical” activation, Layer 2 can learn to interpret this spatial co-occurrence as a **corner**.
* **Expanding the Receptive Field:** Because each layer's kernel covers a region of the *previous* layer's output, deeper layers effectively “see” a much larger area of the original image. A $3 \times 3$ kernel in Layer 2, applied to Layer 1's output, actually represents a $5 \times 5$ region of the raw input.
* **The Heatmap Below:** The combined heatmap squares the activations to amplify regions where multiple filters fire simultaneously, these are the corners and junctions of the octagonal stop sign.

### Deeper Layers: From Parts to Objects

In a full-scale network (e.g., ResNet-50 with 50 layers, or VGG-16 with 16 layers), this process repeats:

* **Middle Layers (3–8):** Combine corners and curves to detect **parts**, a bolt head, a letter shape, the red octagonal border of a sign.
* **Deep Layers (9+):** Combine parts into **whole objects**, concluding with high mathematical certainty that the cluster of detected shapes is a **Stop Sign** and not, say, a red umbrella.
* **Final Layers:** Produce a probability distribution over all possible classes (e.g., 97.3% stop sign, 1.5% yield sign, 1.2% traffic light...).

The more layers, the more abstract and complex the representations become. However, adding layers also increases the risk of **overfitting** (memorizing training data rather than learning general patterns) and **vanishing gradients** (where learning signals fade to zero in very deep networks, a problem addressed by skip connections in ResNets).

**The Mathematical Heartbeat:** Every step of this intelligence, from finding a tiny line to identifying a vehicle, is powered by the same **Convolution Operation** you see in the math box above. By stacking these simple multiplications, the AI transforms raw numbers into visual logic.

</div>
    <div style="display: grid; grid-template-columns: 280px 1fr; gap: 20px;">
        <div class="panel" style="padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; height: fit-content;">
            <div style="text-align:center;">
                <canvas id="feat-src" width="100" height="100" style="border:2px solid #cbd5e1; width:200px; image-rendering:pixelated; border-radius: 4px;"></canvas>
                <p class="md">Source Image (by \citeauthor{stopsignimage})</p>
            </div>
<div style="margin-top: 20px; padding: 12px; border-radius: 8px; font-size: 0.8rem; color: var(--mn-text-secondary); border: 1px solid var(--mn-border);">
				<strong style="color: var(--mn-text-primary);">🔍 How to read the feature maps:</strong><br>
				Each matrix (kernel) acts as a specialized “eye” that searches for specific patterns. Bright pixels in the output mean the filter found a strong match at that location. Dark pixels mean no match was detected.
			</div>
        </div>

        <div id="filter-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
        </div>
    </div>
</div>

<div class="md">
## Building the classifier: the full CNN pipeline

The convolution explorer above shows a single filter. A real classifier stacks many of them, then bridges the gap from a 2D grid of features to a final class probability.

The final decision layer (a **Dense** layer) wants a flat list of numbers, not a grid. A **Flatten** layer "unrolls" the feature maps — a $3 \times 3$ map becomes a single vector of nine — so every feature found across the image can be combined into one score. Flatten has **no learnable parameters**; it is pure reshaping.

$$
\underbrace{\begin{pmatrix}1&2&3\\4&5&6\\7&8&9\end{pmatrix}}_{3\times3\ \text{grid}}
\xrightarrow{\text{Flatten}}
\underbrace{\begin{pmatrix}1&2&3&4&5&6&7&8&9\end{pmatrix}}_{1\times9\ \text{vector}}
$$

The full flow, from raw image to probability:

$$
\underbrace{\text{Image}}_{100\times100\times3}
\xrightarrow{\text{Conv2D}}
\underbrace{\text{Feature maps}}_{98\times98\times32}
\xrightarrow{\text{MaxPool}}
\underbrace{\text{Downsampled}}_{49\times49\times32}
\xrightarrow{\text{Flatten}}
\underbrace{\text{Vector}}_{76832\times1}
\xrightarrow{\text{Dense}}
\underbrace{P(\text{class})}
$$

Every arrow is differentiable, so backpropagation trains the whole stack **end-to-end**.
</div>

<?php
$pytorch = get_string_of_file_or_die("py/visionlab/pytorch.py");
$tensorflow = get_string_of_file_or_die("py/visionlab/tensorflow.py");

$cvcodetabs = array(
	"PyTorch" => '<div class="md"><b>PyTorch</b> is explicit: you define the forward pass tensor by tensor, which is why it is the research default.</div>\n<pre><code class="language-python">'.$pytorch.'</code></pre>',
	"TensorFlow" => '<div class="md"><b>TensorFlow</b> stacks layers "Sequential"-style; its Keras API is the go-to for rapid prototyping.</div>\n<pre><code class="language-python">'.$tensorflow.'</code></pre>',
);
render_gem_tabs($cvcodetabs, "computer_vision");
?>
<div class="md">
Both versions train with `python3 tf.py --mode train --path dataset` (one subfolder of images per class) and classify with `python3 tf.py --mode predict --path dataset/cat/1.jpg`, saving `classifier.pth` (PyTorch) or `classifier.keras` (TensorFlow). In one line the pipeline is: **normalize $\to$ conv (features) $\to$ pool (invariance) $\to$ flatten $\to$ dense + softmax ($P(\text{class})$)** — each step differentiable, which is what makes end-to-end learning possible.
</div>

<div class="md">
## From classification to detection

**Classification** asks one question of a whole image: *which of the labels?* ImageNet \cite[Krizhevsky et al., 2012]{krizhevsky2012imagenet} and the ResNet that dominated it \cite[He et al., 2015]{he2015resnet} are the reference points. **Detection** asks for *many* objects at once, each with a box and a label, measured by **mAP** across IoU thresholds. Two families emerged:

| Family | Idea | Method |
|--------|------|--------|
| Two-stage | Propose regions, then classify | **R-CNN** \cite[Girshick et al., 2014]{girshick2014rcnn} → **Faster R-CNN** (learned proposals) \cite[Ren et al., 2015]{ren2015faster} |
| One-stage | Predict boxes in one pass | **YOLO** \cite[Redmon et al., 2016]{redmon2016yolo} — detection as a single regression, fast enough for real time |

Two-stage was more accurate; one-stage was faster. The gap closed as both scaled — the same lesson as everywhere in this book.
</div>

<div class="md">
## Segmentation: pixels, not boxes

Boxes are coarse. **Segmentation** labels at the pixel level: **semantic** (each pixel → class), **instance** (each object separated), **panoptic** (both).

* **U-Net** \cite[Ronneberger et al., 2015]{ronneberger2015unet}: encoder–decoder with skip connections; the biomedical workhorse, trainable on few images.
* **Mask R-CNN** \cite[He et al., 2017]{he2017maskrcnn}: Faster R-CNN plus a branch that predicts a **mask per instance**.
* **Segment Anything (SAM)** \cite[Kirillov et al., 2023]{kirillov2023sam}: a *promptable* foundation model — point at an object, it segments it. Trained on **1 billion masks**, it transfers zero-shot. The "ImageNet moment" for segmentation.
</div>

<div class="image-row md">
<figure style="max-width:720px; margin:1.5em auto; text-align:center;">
	<img src="sam_demo.png" alt="The same scene segmented into different objects by pointing at different parts, produced by the Segment Anything Model" style="width:100%; height:auto; border-radius:6px;" />
	<figcaption class="md">One image, several prompts: SAM segments whatever you point at, zero-shot. \cite[Image: Segment Anything Model demo]{sam_demo_img}</figcaption>
</figure>
</div>

<div class="md">
## ViTs: the Transformer arrives in vision

The **Vision Transformer (ViT)** \cite[Dosovitskiy et al., 2021]{dosovitskiy2021vit} splits an image into 16×16 **patches**, treats them as tokens, and runs a plain Transformer. With enough data it matches or beats the best CNNs — the convolution's inductive bias is useful but not essential. Two companions completed the picture: **MAE** \cite[He et al., 2022]{he2021mae}, self-supervised pretraining by masking 75% of patches; and **CLIP** \cite[Radford et al., 2021]{radford2021clip}, contrastive pretraining on (image, caption) pairs, giving vision a *text* interface — the bridge to <a href="multimodal">Multimodal</a> and <a href="diffusion">Diffusion</a>.
</div>

<div class="md">
## Beyond 2D: the world

Real vision is 3D and dynamic: **pose** (keypoints), **depth**, **point clouds**, and **NeRF**-style radiance fields that render novel views. Generative models now produce 3D and video, not just stills (see <a href="diffusion">Diffusion</a>).

**Why it matters.** This perception stack is what <a href="agents">agents</a> and embodied AI rely on, and why a multimodal LLM can *see*. The vision foundation models — SAM, ViT, CLIP — tell **the same scaling story as LLMs, applied to pixels**: gather a huge corpus, pre-train one model, fine-tune it into any task.
</div>