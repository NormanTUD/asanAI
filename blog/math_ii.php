<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Math II — Linear Algebra for AI
description: Vector spaces, tensors, function composition, Hadamard product, matrix transposition.
icon: &#128290;
part: 1
order: 3
color: accent
topics: math-ii
-->

<script src="math.js"></script>

<div class="md">
Modern AI is, at its core, applied linear algebra. Every image, every word, every token lives in a high-dimensional **vector space**. This chapter introduces the mathematical objects that make neural networks possible: vectors, matrices, tensors, and the operations that combine them.

If you complete this chapter, the rest of the textbook  embeddings, attention, gradients, activations  will read as natural applications of these primitives.
</div>

<div class="md">
## Vector Spaces

### 1D: The Line

In 1D, you only have one “degree of freedom.” You can go forward or backward.
* **Concept:** A single number describes your entire universe.
</div>

<div style="background: var(--mn-bg); padding: 15px; border: 1px solid var(--mn-border); border-radius: 8px;">
    <strong>Value ($x$):</strong> <input type="range" id="v1-slider" min="-5" max="5" step="0.1" value="2">
    <div id="v1-math" style="font-size: 1.2em; margin: 10px 0; color: #2563eb;">$$\vec{v} = \begin{pmatrix} 2.0 \end{pmatrix}$$</div>
    <div id="v1-plot" style="width:100%; height:80px;"></div>
</div>

<div class="md">
### 2D: The Plane

By adding a second number, we unlock an infinite flat surface.
</div>

<div style="background: var(--mn-bg); padding: 15px; border: 1px solid var(--mn-border); border-radius: 8px;">
    <strong>X:</strong> <input type="range" id="v2-x" min="-5" max="5" step="0.1" value="3">
    <strong>Y:</strong> <input type="range" id="v2-y" min="-5" max="5" step="0.1" value="4">
    <div id="v2-math" style="font-size: 1.2em; margin: 10px 0; color: #059669;">$$\vec{v} = \begin{pmatrix} 3.0 \\ 4.0 \end{pmatrix}$$</div>
    <div id="v2-plot" style="width:100%; height:300px;"></div>
</div>

<div class="md">
### 3D: The Color Cube

<div class="image-row md">
	<figure>
		<img src="rgb_color_cube.png" alt="RGB color cube diagram" />
		<figcaption class="md">\citealternativetitle{rgb_color_cube}: every visible color corresponds to a single point inside this cube, parameterized by its Red, Green, and Blue coordinates.</figcaption>
	</figure>
</div>

In 3D, we can represent volume. A great way to visualize this is **Color Space**. Every color you see on this screen is just a vector in a 3D space where the axes are **Red**, **Green**, and **Blue**.
</div>

<div style="background: var(--mn-bg); padding: 15px; border: 1px solid var(--mn-border); border-radius: 8px;">
    <div style="display: flex; gap: 10px;">
        R: <input type="range" id="v3-r" min="0" max="255" value="120">
        G: <input type="range" id="v3-g" min="0" max="255" value="50">
        B: <input type="range" id="v3-b" min="0" max="255" value="200">
    </div>
    <div id="v3-math" style="font-size: 1.2em; margin: 10px 0;">$$\vec{v}_{color} = \begin{pmatrix} 120 \\ 50 \\ 200 \end{pmatrix}$$</div>
    <div id="v3-plot" style="width:100%; height:400px;"></div>
</div>

<div class="md">
### 4D and Beyond: The “Feature” Space

We cannot “see” 4D, but we can **describe** it. In AI, dimensions are just “features.” Imagine we are describing a “Fruit.” We can use a 4D vector to describe:

1. **Sweetness**
2. **Sourness**
3. **Firmness**
4. **Seed Count**

Every fruit is now a point in a 4D “Fruit Space.”
</div>

<div style="background: var(--mn-bg); padding: 15px; border: 1px solid var(--mn-border); border-radius: 8px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <span>Sweet: <input type="range" id="v4-1" min="0" max="10" value="8"></span>
        <span>Sour: <input type="range" id="v4-2" min="0" max="10" value="2"></span>
        <span>Firm: <input type="range" id="v4-3" min="0" max="10" value="5"></span>
        <span>Seeds: <input type="range" id="v4-4" min="0" max="10" value="9"></span>
    </div>
    <div id="v4-math" style="font-size: 1.2em; margin: 20px 0; text-align: center; color: #7c3aed;">
        $$\vec{v}_{fruit} = \begin{pmatrix} 8 \\ 2 \\ 5 \\ 9 \end{pmatrix}$$
    </div>
    <div id="v4-plot" style="width:100%; height:250px;"></div>
</div>

<div class="md">
## How Computers see data: Tensors

If you want to talk to an AI about images, you can't just show it a picture. You have to turn everything into numbers. In the AI world, we call every container of numbers a **Tensor**.

Think of Tensors like a ladder of complexity:

### The Scalar (rank 0)

A **Scalar** is just one single number.

Imagine a single lightbulb. The number tells you how bright it is: **0** is off (black), **255** is full power (white).

$$s \in \left\{0, 1, 2, 3, 4, \dots, 254, 255\right\} \quad \text{Example:} \quad s = 255$$

### The Vector (rank 1)

A **Vector** is a list of numbers. They are sometimes written with an arrow above them, like this: $\vec{v}$.

To make a color, a computer needs a list of 3 numbers: one for Red, one for Green, and one for Blue. This “package” is a vector.

$$\vec{v} = \begin{pmatrix} r \\ g \\ b \end{pmatrix}$$

$$\text{Example:} \quad \vec{v} = \begin{pmatrix} 255 \\ 0 \\ 0 \end{pmatrix} \text{ (Pure Red!)}$$

Vectors can also be understood as arrows in space. For example, the vector $\begin{pmatrix} 3 \\ 4 \end{pmatrix}$, means: move 3 to the right and 4 to the top.
</div>

<div id="vector-plot" style="width:100%; max-width:400px; height:400px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;"></div>

<div class="md">
Vectors are not “glued” to one spot. A vector is simply a set of instructions (like “3 right, 4 up”). You can start that instruction anywhere in space, and it is still the same vector!
</div>

<div style="text-align: center; margin-bottom: 10px;">
    Start Position ($x$): <input type="range" id="slider-vector-x" min="0" max="5" step="0.5" value="1">
    Start Position ($y$): <input type="range" id="slider-vector-y" min="0" max="5" step="0.5" value="1">
</div>

<div id="movable-vector-plot" style="width:100%; max-width:400px; height:400px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;"></div>

<div class="md">
Vectors can also have many more dimensions, way too many to visually display them. And they can also be multiplied with by a scalar (multiplying each value in the vector by this scalar):

$$ c \cdot \vec{v} = c \cdot \begin{pmatrix} v_1 \\ v_2 \end{pmatrix} = \begin{pmatrix} c \cdot v_1 \\ c \cdot v_2 \end{pmatrix}$$

$$ 2 \cdot \begin{pmatrix} 3 \\ 4 \end{pmatrix} = \begin{pmatrix} 2 \cdot 3 \\ 2 \cdot 4 \end{pmatrix} = \begin{pmatrix} 6 \\ 8 \end{pmatrix}$$

Vectors can also be added:

$$ \begin{pmatrix} 1 \\ 2 \end{pmatrix} + \begin{pmatrix} 3 \\ 4 \end{pmatrix} = \begin{pmatrix} 1 + 3 \\ 2 + 4 \end{pmatrix} = \begin{pmatrix} 4 \\ 6 \end{pmatrix} $$

### The Matrix (rank 2)

A **Matrix** is a grid of numbers (like a spreadsheet).

A **Black & White photo** is just a Matrix. Each spot in the grid tells the computer how bright that specific pixel is, when we say $0$ means “black”, $255$ means white and everything inbetween are different shades of gray.

$$M = \begin{pmatrix} 255 & 0 \\ 0 & 255 \end{pmatrix}$$

</div>

<div id="section-bw">
	<div style="display: flex; align-items: center; gap: 40px; padding: 20px; border-radius: 12px; margin-top: 15px;">
		<div id="bw-matrix-container"></div>
		<canvas id="bw-preview-canvas" width="3" height="3" style="width: 180px; height: 180px; image-rendering: pixelated; border: 4px solid #333;"></canvas>
	</div>
</div>

<div class="md">
### The Tensor (the umbrella term)

**The Secret:** In AI, *Tensor* is the umbrella word for “any rectangular array of numbers.” A scalar is a rank-0 tensor, a vector is a rank-1 tensor, a matrix is a rank-2 tensor, and once we stack matrices we get a **rank-3+ tensor**. This lets the neural network treat every piece of data with the same set of math rules.

| Object | Rank | Shape | Example |
|--------|------|-------|---------|
| Scalar | 0 |  | $s = 5$ |
| Vector | 1 | $(d,)$ | color $= (r, g, b)$ |
| Matrix | 2 | $(h, w)$ | a black-and-white image |
| Tensor | 3+ | $(h, w, c, \dots)$ | a color image is $(h, w, 3)$ |

A **Color Photo** is a rank-3 tensor: a stack of three matrices (one each for Red, Green, Blue), all sitting on top of each other.

$$\mathcal{T} \in \text{Height} \times \text{Width} \times \text{Colors}$$

### The Mathematical View: A $3 \times 3 \times 3$ Tensor

When you type numbers into the grid, the computer organizes them into a structured math object. Here is how your **Color Image** looks as a formal Tensor $\mathcal{T}$.

Notice how each “cell” of the grid is actually a vector (a vertical list) of three values:
</div>

$$
\mathcal{T}_{3 \times 3 \text{ color image}} = \begin{pmatrix}
\begin{pmatrix} \color{red}{r_{1,1}} \\ \color{green}{g_{1,1}} \\ \color{blue}{b_{1,1}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{1,2}} \\ \color{green}{g_{1,2}} \\ \color{blue}{b_{1,2}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{1,3}} \\ \color{green}{g_{1,3}} \\ \color{blue}{b_{1,3}} \end{pmatrix} \\ \\
\begin{pmatrix} \color{red}{r_{2,1}} \\ \color{green}{g_{2,1}} \\ \color{blue}{b_{2,1}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{2,2}} \\ \color{green}{g_{2,2}} \\ \color{blue}{b_{2,2}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{2,3}} \\ \color{green}{g_{2,3}} \\ \color{blue}{b_{2,3}} \end{pmatrix} \\ \\
\begin{pmatrix} \color{red}{r_{3,1}} \\ \color{green}{g_{3,1}} \\ \color{blue}{b_{3,1}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{3,2}} \\ \color{green}{g_{3,2}} \\ \color{blue}{b_{3,2}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{3,3}} \\ \color{green}{g_{3,3}} \\ \color{blue}{b_{3,3}} \end{pmatrix}
\end{pmatrix}
$$

<div class="md">
The form a tensor has is called a *shape*. The shape defines how many rows and columns a tensor has, and how many nested tensors it has. For example, an image with $ 32 \cdot 32 $ pixels and 3 channels (one for red, green and blue each) has a shape of $ \left[ 32, 32, 3 \right] $.

* **The Grid:** The large outer brackets $\begin{pmatrix} \dots \end{pmatrix}$ represent the **Shape** (Rows and Columns).
* **The Depth:** Each small inner bracket $\begin{pmatrix} r \\ g \\ b \end{pmatrix}$ is the **Feature Vector** for a single pixel.
* **The Coordinates:** The numbers like $_{1,2}$ mean: “Row 1, Column 2”.

To make colors, we use **three numbers** for every single pixel: one for **Red**, one for **Green**, and one for **Blue**.

We can think of a pixel $P$ as a stack of three values:

$$P = \begin{pmatrix} \color{red}{R} \\ \color{green}{G} \\ \color{blue}{B} \end{pmatrix}$$

By mixing these three primary lights at different brightness levels (0 to 255), you can create any color in the world!
</div>

<div id="section-rgb">
	<div style="display: flex; align-items: center; gap: 40px; padding: 20px; border-radius: 12px; margin-top: 15px;">
			<div id="rgb-combined-container"></div>
			<canvas id="rgb-preview-canvas" width="3" height="3" style="width: 180px; height: 180px; image-rendering: pixelated; border: 4px solid #333;"></canvas>
	</div>
</div>

<div class="md">
You can then use full images as tensors, ie you can write an image into a variable, and pass it to functions, and get a vector out of it again:

$$ f\left(\text{Image}\right) = \begin{pmatrix} \text{Probability cat} \\ \text{Probability dog} \end{pmatrix} $$

This function, when it is not manually written, we call Model, as it models the behaviour of a function (and thus, acts as this function, even though it is just an approximation for it).

With other methods of making numbers from data (like Embeddings to create numbers from texts, like chatGPT does, which we will discuss later on), we can create models that do all kinds of stuff. For example, we could create a function that maps $\text{Text} \rightarrow \text{Music}$ or $\text{Image} \rightarrow \text{Text}$.

<div class="smart-quote red" data-cite="box1987empirical">
  All models are wrong, but some are useful.
</div>
</div>

<div class="md">
## Chaining Functions (Composition)

In programming and math, we often want to take the result of one function and plug it directly into another. This is called **composition**. If we have a function $f$ and a function $g$, applying $f$ first and then $g$ is written as $(g \circ f)(x)$, which is just a shorthand for $g(f(x))$.

You can experiment with how two linear functions combine. Adjust the sliders to see how the “inner” function $f$ and the “outer” function $g$ create a new, composed result.
</div>

<div style="background: var(--mn-surface, #f9f9f9); padding: 15px; border-radius: 8px; border: 1px solid #eee;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
            <strong>Function $f(x) = ax + b$</strong><br>
            a: <input type="range" id="slider-comp-a" min="-2" max="2" step="0.1" value="1"><br>
            b: <input type="range" id="slider-comp-b" min="-5" max="5" step="0.5" value="0">
        </div>
        <div>
            <strong>Function $g(x) = cx + d$</strong><br>
            c: <input type="range" id="slider-comp-c" min="-2" max="2" step="0.1" value="0.5"><br>
            d: <input type="range" id="slider-comp-d" min="-5" max="5" step="0.5" value="2">
        </div>
    </div>
    <div id="composition-formula" style="text-align: center; margin: 15px 0; font-size: 1.1em; color: #2563eb;">
        $(g \circ f)(x) = g(ax + b)$
    </div>
    <div id="plot-composition" style="width:100%; height:350px;"></div>
</div>

<div class="optional md" data-headline="As a category-theoretical diagram">
We can visualize these relationships using a square diagram. It shows that there are two ways to reach the same result: either you transform your data first and then apply a function, or you apply a modified version of that function to your raw data. In Category Theory, $A, B, C$ are *objects* (which can be any mathematical objects, like sets) and $f$ and $g$ (the arrows) are so-called *morphisms* (which can be anything that connects mathematical objects to each other, like functions). When both paths lead to the same result, we say the diagram **commutes**.

<center>
<?php
	include("commutation.html");
?>
</center>
</div>

<div class="md">
## The Hadamard Product ($\odot$)

The **Hadamard Product** ($\odot$) was formally introduced by \citeauthor{hadamardproduct} in \citeyear{hadamardproduct} within his thesis \citetitle{hadamardproduct}. It was designed to solve the practical problem of identifying **singularities** in complex power series. By multiplying coefficients element-wise, defined for vectors as $\vec{a} \odot \vec{b} = (a_1 b_1, \dots, a_n b_n)^T$, Hadamard could predict the analytic continuation and boundaries of new functions derived from known ones.

While standard matrix multiplication follows the “row-by-column” rule, the **Hadamard Product** (also known as the *element-wise product*) is much more straightforward. It takes two matrices or vectors of the **same dimensions** and multiplies the elements that occupy the same position.

In the context of Deep Learning, the $\odot$ symbol is ubiquitous. It is used in **Layer Normalization** to scale normalized values by a learnable parameter $\gamma$, and in **Gating Mechanisms** (like LSTMs or GRUs) to decide which information should pass through a “gate.”

### Mathematical Definition

For two vectors $\vec{a}$ and $\vec{b}$ of length $n$, the product is defined as:

$$\vec{a} \odot \vec{b} = \begin{pmatrix} a_1 \cdot b_1 \\ a_2 \cdot b_2 \\ \vdots \\ a_n \cdot b_n \end{pmatrix}$$

Adjust the values in vectors $\vec{a}$ and $\vec{b}$ to see how the resulting vector is calculated element-by-element.
</div>

<div style="background: var(--mn-bg); padding: 25px; border: 1px solid var(--mn-border); border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin: 20px 0;">
    <div style="display: flex; justify-content: space-around; align-items: center; gap: 15px; flex-wrap: wrap;">
        <div style="text-align: center;">
            <strong style="color: #64748b;">Vector $\vec{a}$</strong><br>
            <input type="number" id="h-a1" value="3" style="width: 60px; margin: 4px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;"><br>
            <input type="number" id="h-a2" value="-2" style="width: 60px; margin: 4px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;"><br>
            <input type="number" id="h-a3" value="5" style="width: 60px; margin: 4px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;">
        </div>
        <div style="font-size: 2rem; color: #94a3b8;">$\odot$</div>
        <div style="text-align: center;">
            <strong style="color: #64748b;">Vector $\vec{b}$</strong><br>
            <input type="number" id="h-b1" value="2" step="0.5" style="width: 60px; margin: 4px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;"><br>
            <input type="number" id="h-b2" value="0.5" step="0.5" style="width: 60px; margin: 4px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;"><br>
            <input type="number" id="h-b3" value="10" step="0.5" style="width: 60px; margin: 4px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;">
        </div>
        <div style="font-size: 2rem; color: #94a3b8;">$=$</div>
        <div id="hadamard-display" style="min-width: 180px; background: var(--mn-bg-subtle); padding: 20px; border-radius: 8px; border: 1px dashed var(--mn-border); text-align: center;">
            </div>
    </div>
</div>

<div class="md">
## Matrix Transposition

Transposing a matrix means flipping it over its main diagonal, turning rows into columns and columns into rows. If $A$ is an $m \times n$ matrix with elements $a_{ij}$, then the transpose $A^T$ is an $n \times m$ matrix where $(A^T)_{ij} = A_{ji}$.

Example:

$$A = \begin{pmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \end{pmatrix}
\quad \Longrightarrow \quad
A^T = \begin{pmatrix} 1 & 4 \\ 2 & 5 \\ 3 & 6 \end{pmatrix}$$
</div>

<div class="optional md" data-headline="History of Matrix Transposition">
The idea of matrix transposition was introduced in 1858 by the British mathematician \citeauthor{cayleymemoirmatrices} in his paper \citetitle{cayleymemoirmatrices}. It arose from the study of bilinear and quadratic forms, where swapping rows and columns was needed to express symmetry properties.
</div>

<div class="md">
## Softmax and Cross-Entropy

Two vector operations appear so often in AI that they deserve explicit definitions here, even though they are first motivated in the Statistics and Loss chapters.

### Softmax: vector → probability distribution

Given a vector of real-valued scores $\vec{z} \in \mathbb{R}^{K}$ (called **logits**), the **softmax** turns it into a vector of probabilities that sum to $1$:

$$
\text{softmax}(\vec{z})_i = \frac{e^{z_i}}{\sum_{j=1}^{K} e^{z_j}}
$$

The exponential emphasises differences: a logit gap of $1$ becomes a ratio of $e \approx 2.7$, a gap of $2$ becomes $e^2 \approx 7.4$. This is the operation behind the output layer of a classification network and behind every next-token probability in an LLM (see the Attention chapter).

### Cross-entropy: measuring the gap between two distributions

Given a true probability distribution $\vec{y}$ (one-hot for a single correct class) and a predicted distribution $\hat{\vec{y}}$ (the model's softmax output), the **cross-entropy** is

$$
H(\vec{y}, \hat{\vec{y}}) = -\sum_{i=1}^{K} y_i \, \log \hat{y}_i
$$

For a one-hot true label where $y_c = 1$ for the correct class $c$, this collapses to

$$
L_{\text{CE}} = -\log \hat{y}_c
$$

That is: cross-entropy loss for a single example is just the **negative log-probability the model assigned to the correct class**. This is the standard classification loss (see the Loss chapter) and, paired with softmax, has the elegant property

$$
\frac{\partial L_{\text{CE}}}{\partial z_i} = \hat{y}_i - y_i
$$

i.e. the gradient is just “predicted minus actual”  the reason softmax + cross-entropy is the canonical pairing.
</div>

<script>
// The plot initializers live in math.js (loaded above). There is no
// math_ii.js, so none of these get registered in the module loader queue —
// initialize the page's plots directly here instead.
(function () {
	let initialized = false;

	function initMathIIPlots() {
		if (initialized) return;
		if (typeof Plotly === 'undefined') return;
		initialized = true;

		renderBWTable();
		updateBWPreview();
		renderRGBCombinedTable();
		updateRGBPreview();
		renderVectorPlot();
		renderMovableVector();
		initCompositionPlot();
		initHadamard();
		initInteractiveVectorSpaces();
	}

	async function loadMathIIModule() {
		updateLoadingStatus("Loading section about Math II...");
		initMathIIPlots();
		return Promise.resolve();
	}

	initMathIIPlots();
})();
</script>
