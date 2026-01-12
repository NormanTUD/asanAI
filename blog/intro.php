<?php include_once("functions.php"); ?>
<div class="md">

<pre><code class="language-python">
import numpy as np

# Ein 3x3 Pixel Bild mit 3 Farbkanälen (RGB)
# Shape: (Height, Width, Channels)
image_tensor = np.zeros((3, 3, 3))

# Einem Pixel (Mitte) die Farbe Rot geben
# Koordinaten: Row 1, Col 1, RGB-Werte
image_tensor[1, 1] = [255, 0, 0]

print("Tensor Shape:", image_tensor.shape)
print("Pixel-Daten:\n", image_tensor)
</code></pre>

## Programming

TODO Functions replaced with models, model models a function (but is not exactly the same)

In classical programm, you would specify each step by hand. In AI, it learns by example. TODO

Instead of using an exactly hand specified function to do something, you use a model that *approximates* doing that something.

## How Computers "Speak" Math: Tensors 🤖

If you want to talk to an AI about images, you can't just show it a picture. You have to turn everything into numbers. In the AI world, we call every container of numbers a **Tensor**.

Think of Tensors like a ladder of complexity:

## 1. The Scalar (Level 0)
A **Scalar** is just one single number. 
Imagine a single lightbulb. The number tells you how bright it is: **0** is off (black), **255** is full power (white).
$$s \in \mathbb{R} \quad \text{Example:} \quad s = 255$$

## 2. The Vector (Level 1)
A **Vector** is a list of numbers. 
To make a color, a computer needs a list of 3 numbers: one for Red, one for Green, and one for Blue. This "package" is a vector.
$$\vec{v} = \begin{pmatrix} r \\ g \\ b \end{pmatrix} \quad \text{Example:} \quad \vec{v} = \begin{pmatrix} 255 \\ 0 \\ 0 \end{pmatrix} \text{ (Pure Red!)}$$


## 3. The Matrix (Level 2)
A **Matrix** is a grid of numbers (like a spreadsheet).
A **Black & White photo** is just a Matrix. Each spot in the grid tells the computer how bright that specific pixel is.
$$M = \begin{pmatrix} 255 & 0 \\ 0 & 255 \end{pmatrix}$$


## 4. The Tensor (Level 3 and beyond)
When we stack many matrices together, we get a high-level **Tensor**.
A **Color Photo** is a 3D Tensor. It’s a stack of three matrices: a Red one, a Green one, and a Blue one, all sitting on top of each other.
$$\mathcal{T} \in \text{Height} \times \text{Width} \times \text{Colors}$$


> **The Secret:** In AI, we call *everything* a Tensor. A single number is just a "Level 0 Tensor." This makes it easy for the brain of the AI (the Neural Network) because it treats every piece of data with the same set of math rules!

## The Mathematical View: A $3 \times 3 \times 3$ Tensor

When you type numbers into the grid, the computer organizes them into a structured math object. Here is how your **Color Image** looks as a formal Tensor $\mathcal{T}$.

Notice how each "cell" of the grid is actually a vector (a vertical list) of three values:

$$
\mathcal{T} = \begin{pmatrix}
\begin{pmatrix} r_{1,1} \\ g_{1,1} \\ b_{1,1} \end{pmatrix} & \begin{pmatrix} r_{1,2} \\ g_{1,2} \\ b_{1,2} \end{pmatrix} & \begin{pmatrix} r_{1,3} \\ g_{1,3} \\ b_{1,3} \end{pmatrix} \\ \\
\begin{pmatrix} r_{2,1} \\ g_{2,1} \\ b_{2,1} \end{pmatrix} & \begin{pmatrix} r_{2,2} \\ g_{2,2} \\ b_{2,2} \end{pmatrix} & \begin{pmatrix} r_{2,3} \\ g_{2,3} \\ b_{2,3} \end{pmatrix} \\ \\
\begin{pmatrix} r_{3,1} \\ g_{3,1} \\ b_{3,1} \end{pmatrix} & \begin{pmatrix} r_{3,2} \\ g_{3,2} \\ b_{3,2} \end{pmatrix} & \begin{pmatrix} r_{3,3} \\ g_{3,3} \\ b_{3,3} \end{pmatrix}
\end{pmatrix}
$$

## Decoding the Notation:
* **The Grid:** The large outer brackets $\begin{pmatrix} \dots \end{pmatrix}$ represent the **Shape** (Rows and Columns).
* **The Depth:** Each small inner bracket $\begin{pmatrix} r \\ g \\ b \end{pmatrix}$ is the **Feature Vector** for a single pixel.
* **The Coordinates:** The numbers like $_{1,2}$ mean: "Row 1, Column 2".

> **Why this matters:** When a Neural Network "looks" at your image, it performs math operations on this exact structure. It multiplies these matrices by other matrices (called Weights) to find patterns like edges, circles, or faces!
</div>
