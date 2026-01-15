<?php include_once("functions.php"); ?>

<div class="md">
## Goal of this site

The goal of this site is that everyone who is willing to spend some time reading here and experimenting around can learn what AI is and how it works, and how to implement very simple systems from scratch. The Understanding also includes things like chatGPT, which we'll tackle from a very technical point of view.

This journey will lead you through a quick intro into classical programming to AI programming, and the mathematical foundations required to understand them, and it'll act as a starting point for you to go further into this topic by yourself.

It will assume nothing except that you understand English and know mathematical concepts at the level of $ 1 + 1 = 2 $.

## Programming

In classical programming, you need to write every single step that has to be done with data. Like this:
</div>

<pre><code class="language-python">x = 1 + 1

print(x)
</code></pre>

<div class="md">
This initializes a *variable* called $ x $, calculates the value of $ 1 + 1 $ and sets $ x $ to it. *Variables* can be though of as containers for values which you can use instead of concrete values. Imagine a website where the user can enter his or her age, and the website will tell you if you are older than 18 or younger. The $ \\text{age} $ is then a variable which the user enters, and which can be checked further with code.

The line with <tt>print</tt> then prints out this value to the command line.

You can also use more variables, like the next example uses $ y $, which, in term, uses the value of $ x $ to print $ 3 $ after calculating it's values.
</div>

<pre><code class="language-python">x = 1 + 1 # x = 2
y = x + 1 # y = 2 + 1 = 3
print(y)
</code></pre>

<div class="md">
Let's now introduce **functions**. A function is something that accepts inputs and calculates an output, where the rules are specified from how to get from the inputs to the outputs.

For example, the $ \text{add} $-function takes 2 inputs, and adds them to each other with the rule $ \text{Output} = \text{First input} + \text{second input} $. We may use shorter names like $x$ and $y$ instead of $\text{First input}$. In python, it looks like this:
</div>

<pre><code class="language-python">def add(x, y):
    return x + y # returns the result of x + y to the place where it's called
</code></pre>

<div class="md">
We can use this $\text{add}$ function in the code, similiar to what we had before.
</div>

<pre><code class="language-python">result = add(1, 2) # Calls the 'add' function with x = 1 and y = 2,
                   # which calculates 1+2 and returns 3, which is saved in the variable result
print(result) # The result is then printed
</code></pre>


<div class="md">
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
