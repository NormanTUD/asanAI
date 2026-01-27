<?php include_once("functions.php"); ?>

<div class="md">
*By **Norman Koch** (ScaDS.AI/Technical University of Dresden)*

## Goal of this text

The goal of this site is that everyone who is willing to spend some time reading here and experimenting around can learn what AI is and how it works, and how to implement very simple systems from scratch. The Understanding also includes things like chatGPT, which we'll tackle from a very technical point of view.

This journey will lead you through a quick intro into classical programming to AI programming, and the mathematical foundations required to understand them, and it'll act as a starting point for you to go further into this topic by yourself.

It will assume nothing except that you understand English and know mathematical concepts at the level of $ 1 + 1 = 2 $, and every concept will be explained not only in theory, but by practical and easily usable example.

We will not cover all forms of AI, but only Neural Network. There are many different forms of systems that are generally considered AI, though.

## Programming

In classical programming, you need to write every single step that has to be done with data. Like this:
</div>

<pre><code class="language-python">x = 1 + 1

print(x)
</code></pre>

<div class="md">
This initializes a *variable* called $ x $, calculates the value of $ 1 + 1 $ and sets $ x $ to it. *Variables* can be thought of as containers for values which you can use instead of concrete values.

The line with <tt>print</tt> then prints out this value to the command line.

You can also use more variables, like the next example uses $ y $, which, in term, uses the value of $ x $ to print $ 3 $ after calculating its values.
</div>

<pre><code class="language-python">x = 1 + 1 # x = 2
y = x + 1 # y = 2 + 1 = 3
print(y)
</code></pre>

<div class="md">
Let's now introduce **functions**. A function is something that accepts inputs and calculates an output, where the rules are specified from how to get from the inputs to the outputs. Functions are useful, as they model reality.
</div>

<pre><code class="language-python">def identity(x):
    return x # Returns x unchanged
</code></pre>

When we have such a function, we can go through a list of values, like $1$, $2$, $\dots$, and plug them into the function, and use the resulting number as a position indicator, and create a so-called "plot" from it. That is, we show it in a diagram where $x$ is left-to-right and $y$, the result, is the vertical direction. The identity function looks like this:

<div id="plot-step-1" class="plot-container" style="height: 250px; margin-bottom: 40px;"></div>

We can now also introduce parameters, $a$ and $b$ (which will later be the so-called **weights**): $ f(x) = ax + b $. A changes the slope of the line, while b moves it up- or downwards.

<pre><code class="language-python">def straight_line(a, b, x):
    return a*x + b
</code></pre>

<div class="md">
You can experiment around with how the parameters by changing them with the sliders:
</div>

<div style="margin-bottom: 10px;">
    $a$: <input type="range" id="slider-6-a" min="-5" max="5" step="0.1" value="1"> 
    $b$: <input type="range" id="slider-6-b" min="-10" max="10" step="1" value="0">
</div>
<div id="formula-6" style="font-size: 1.2em; margin-bottom: 10px; min-height: 1.5em;">$$f(x) = 1x + 0$$</div>

<div id="code-6-container"></div>

<div id="plot-step-6" class="plot-container" style="height: 300px; margin-bottom: 40px;"></div>

<div id="desc-4" class="md">
	For example, the $ \text{add} $-function takes 2 inputs, and adds them to each other with the rule $ \text{Output} = \text{First input} + \text{second input} $. We may use shorter names like $x$ and $y$ instead of $\text{First input}$. In python, it looks like this:
</div>

<div id="code-4-container">
<pre class="language-python"><code class="language-python"># A function that takes two inputs
def add(x, y):
    return x + y

print(add(10, 5)) # Output: 15</code></pre>
</div>

<div id="plot-step-4" class="plot-container" style="height: 350px; margin-bottom: 40px;"></div>


<div class="md">
We can use this $\text{add}$ function in the code, similiar to what we had before.
</div>

<pre><code class="language-python">result = add(1, 2) # Calls the 'add' function with x = 1 and y = 2,
                   # which calculates 1+2 and returns 3, which is saved in the variable result
print(result) # The result is then printed
</code></pre>


<div class="md">
Of course, we can also parameterize this function: $y = f(x, y) = ax + by$. You can also play around with how this changes the results of this function in the next plot:
</div>

<div style="margin-bottom: 10px;">
    $a$: <input type="range" id="slider-7-a" min="-2" max="2" step="0.1" value="0.5"> 
    $b$: <input type="range" id="slider-7-b" min="-2" max="2" step="0.1" value="0.5">
</div>
<div id="formula-7" style="font-size: 1.2em; margin-bottom: 10px; min-height: 1.5em;">$$f(x, y) = 0.5x + 0.5y$$</div>

<div id="code-7-container"></div>

<div id="plot-step-7" class="plot-container" style="height: 400px; margin-bottom: 40px;"></div>

<div class="md">
We can also use other functions, like $\sin$ (the sine) in our functions, and we can also parameterize them to get more complex patterns:
</div>

<div id="desc-5" class="md"></div>
<div style="margin-bottom: 10px;">
    Frequence: <input type="range" id="slider-5-freq" min="0.1" max="2.0" step="0.1" value="0.5"> 
    Amplitude: <input type="range" id="slider-5-amp" min="0.5" max="5.0" step="0.1" value="1.0">
</div>
<div id="formula-5" style="font-size: 1.2em; margin-bottom: 10px; min-height: 1.5em;">$$f(x, y) = 1.0 \cdot (\sin(0.5x) + \sin(0.5y))$$</div>

<div id="code-5-container"></div>

<div id="plot-step-5" class="plot-container" style="height: 450px; margin-bottom: 40px;"></div>

<div class="md">
For mathematically understanding functions, you need to understand sets first, which luckily is quite simple. A set is a collection of things, like the collection of positive natural numbers smaller than 4: $\left\{1, 2, 3\right\}$. A function now, mathematically speaking, is a rule to transform each input of one set into exactly one element of another set. Like, for example, the function $y = f(x) = x \cdot 2$, transforms the input $x$ to $y$ with the rule $x\cdot 2$.

Sets do not need to contain only numbers, though. A set can be *anything*. Sets can contain sets, or sets can contain images, or people, or whatever else that can be listed. The *set* of jobs could be something like this: $\left\{\text{programmer}, \text{janitor}, \text{cashier}, \dots\right\}$. Sets can have a limited number of elements (and even be empty), or have an unlimited amount of elements, like the set of all numbers. Since, for each number, there's always a larger number, the set never ends.

There are certain sets that are useful to know, like $\mathbb{N}$, which is the set of all natural numbers, or $\mathbb{R}$, which is the set of all real numbers (i.e. all numbers we use in every day life when not simply counting, e.g. $1.8$ or $3.14$, but also every number from $\mathbb{N}$, or the set of so-called **boolean values** $\mathbb{B} = \left\{\text{True}, \text{False}\right\}$, but a set does not need to be any of them.

Functions define a rule so that, for each element of a set, if you apply the rules the function defines, you end up with an element in another (or even the same) set of elements. 

Another example for a function could be something like the function $\text{is\_even}(x)$, which takes any positive integer (the natural numbers) and returns $\text{True}$ if it is the number is even, and else $\text{False}$. Here, the input set is $\mathbb{N}$, which is math-speak for "all the natural numbers" ($\left\{0, 1, 2, 3, 4, 5, 6, \dots\right\}$), and the output set the input set is mapped to is just $\left\{\text{True}, \text{False}\right\}$ $(\mathbb{B})$.

We can say that an element $x$ is part of a set $S$, like $3$ is in the set $\mathbb{N}$ by writing: $x \in S$, for example, saying that 3 is in the set of natural numbers, we can write $3 \in \mathbb{N}$. We can also negate it by saying $\pi=3.14159265\dots$ is *not* in the natural numbers: $\pi \not\in \mathbb{N}$.

</div>

<div class="md">
## Classical programming vs. AI

In classical programm, you would specify each step by hand to define a function, but for some functions, this is barely possible since the problem is ill-defined or way too complex.

For example, imagine you need a program to tell images of cats and dogs apart. Where do you start? You cannot simply write a function that checks for every single pixel value, because then you'd need to know every single possible image of a cat or a dog, which is an infinite amount.

This is where AI comes in. AI replaces the idea of a hand-written *function* with a *model* that does what you want, and doesn't do it by a list of handwritten rules, but learns how to do it by example. For example, you may have a large set of images of cats and dogs, and the information for each image, if it shows a cat or a dog. Then, you'd have 2 sets, one, the set of all images, and the set of results like $\left\{\text{cat}, \text{dog}\right\}$, where each Image is mapped to one of those results, ie. you know that you want $\text{function}\left(\text{Image of a cat}\right) \rightarrow \text{cat}$ and $\text{function}\left(\text{Image of a dog}\right) \rightarrow \text{dog}$. AI then learns how to get from that input to that output. You only provide basic building blocks it should use, which depend on the type of task you want it to solve.

This model will (most probably) not be perfect. But it can be **good enough** to be useful.

Throughout this course, we will look into these building blocks and how the computer then creates this model, and how these building blocks work. We'll start with very simple building blocks for simple numbers, and then go to building blocks to classify images, and end up with Transformers, which are the basic structure for chatGPT, which all take ideas from each other.

## How Computers see data: Tensors

If you want to talk to an AI about images, you can't just show it a picture. You have to turn everything into numbers. In the AI world, we call every container of numbers a **Tensor**.

Think of Tensors like a ladder of complexity:

### The Scalar (rank 0)
A **Scalar** is just one single number. 
Imagine a single lightbulb. The number tells you how bright it is: **0** is off (black), **255** is full power (white).

$$s \in \left\{1, 2, 3, 4, 5, \dots, 254, 255\right\} \quad \text{Example:} \quad s = 255$$

### The Vector (rank 1)
A **Vector** is a list of numbers. They are sometimes written with an arrow above them, like this: $\vec{v}$.

To make a color, a computer needs a list of 3 numbers: one for Red, one for Green, and one for Blue. This "package" is a vector.
$$\vec{v} = \begin{pmatrix} r \\ g \\ b \end{pmatrix} \quad \text{Example:} \quad \vec{v} = \begin{pmatrix} 255 \\ 0 \\ 0 \end{pmatrix} \text{ (Pure Red!)}$$

Vectors can also be understood as arrows in space. For example, the vector $\begin{pmatrix} 3 \\ 4 \end{pmatrix}$, means: move 3 to the right and 4 to the top.

<div id="vector-plot" style="width:100%; max-width:400px; height:400px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;"></div>

Vectors are not "glued" to one spot. A vector is simply a set of instructions (like "3 right, 4 up"). You can start that instruction anywhere in space, and it is still the same vector!

<div style="text-align: center; margin-bottom: 10px;">
    Start Position (X): <input type="range" id="slider-vector-x" min="0" max="5" step="0.5" value="1">
    Start Position (Y): <input type="range" id="slider-vector-y" min="0" max="5" step="0.5" value="1">
</div>

<div id="movable-vector-plot" style="width:100%; max-width:400px; height:400px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;"></div>

Vectors can also have many more dimensions, way too many to visually display them. And they can also be multiplied with by a scalar (multiplying each value in the vector by this scalar):

$$ c \cdot \vec{v} = c \cdot \begin{pmatrix} v_1 \\ v_2 \end{pmatrix} = \begin{pmatrix} c \cdot v_1 \\ c \cdot v_2 \end{pmatrix} $$

$$ 2 \cdot \begin{pmatrix} 3 \\ 4 \end{pmatrix} = \begin{pmatrix} 2 \cdot 3 \\ 2 \cdot 4 \end{pmatrix} = \begin{pmatrix} 6 \\ 8 \end{pmatrix} $$

Vectors can also be added:

$$ \begin{pmatrix} 1 \\ 2 \end{pmatrix} + \begin{pmatrix} 3 \\ 4 \end{pmatrix} = \begin{pmatrix} 1 + 3 \\ 2 + 4 \end{pmatrix} = \begin{pmatrix} 4 \\ 6 \end{pmatrix} $$

### The Matrix (rank 2)
A **Matrix** is a grid of numbers (like a spreadsheet).
A **Black & White photo** is just a Matrix. Each spot in the grid tells the computer how bright that specific pixel is.
$$M = \begin{pmatrix} 255 & 0 \\ 0 & 255 \end{pmatrix}$$

</div>

    <div id="section-bw">
        <div class="md">
            In a black and white image, we only need **one number** for each pixel. 
            * **0** is like turning the light off (**Black**).
            * **255** is the maximum brightness (**White**).
            * Numbers in between make different shades of gray!
        </div>
        
        <div style="display: flex; align-items: center; gap: 40px; padding: 20px; border-radius: 12px; margin-top: 15px;">
                <div id="bw-matrix-container"></div>
                <canvas id="bw-preview-canvas" width="3" height="3" style="width: 180px; height: 180px; image-rendering: pixelated; border: 4px solid #333;"></canvas>
                <p class="md">**Your 3x3 Grayscale Drawing**</p>
        </div>
    </div>

<div class="md">

### The Tensor (rank 3 and beyond)
When we stack many matrices together, we get a high-level **Tensor**.
A **Color Photo** is a 3D Tensor. It’s a stack of three matrices: a Red one, a Green one, and a Blue one, all sitting on top of each other.
$$\mathcal{T} \in \text{Height} \times \text{Width} \times \text{Colors}$$

**The Secret:** In AI, we call *everything* a Tensor. A single number is just a "rank 0 Tensor." This makes it easy for the brain of the AI (the Neural Network) because it treats every piece of data with the same set of math rules!

## The Mathematical View: A $3 \times 3 \times 3$ Tensor

When you type numbers into the grid, the computer organizes them into a structured math object. Here is how your **Color Image** looks as a formal Tensor $\mathcal{T}$.

Notice how each "cell" of the grid is actually a vector (a vertical list) of three values:

$$
\mathcal{T}_{3 \times 3 \text{ color image}} = \begin{pmatrix}
\begin{pmatrix} \color{red}{r_{1,1}} \\ \color{green}{g_{1,1}} \\ \color{blue}{b_{1,1}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{1,2}} \\ \color{green}{g_{1,2}} \\ \color{blue}{b_{1,2}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{1,3}} \\ \color{green}{g_{1,3}} \\ \color{blue}{b_{1,3}} \end{pmatrix} \\ \\
\begin{pmatrix} \color{red}{r_{2,1}} \\ \color{green}{g_{2,1}} \\ \color{blue}{b_{2,1}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{2,2}} \\ \color{green}{g_{2,2}} \\ \color{blue}{b_{2,2}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{2,3}} \\ \color{green}{g_{2,3}} \\ \color{blue}{b_{2,3}} \end{pmatrix} \\ \\
\begin{pmatrix} \color{red}{r_{3,1}} \\ \color{green}{g_{3,1}} \\ \color{blue}{b_{3,1}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{3,2}} \\ \color{green}{g_{3,2}} \\ \color{blue}{b_{3,2}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{3,3}} \\ \color{green}{g_{3,3}} \\ \color{blue}{b_{3,3}} \end{pmatrix}
\end{pmatrix}
$$

The form a tensor has is called a *shape*. The shape defines how many rows and columns a tensor has, and how many nested tensors it has. For example, an image with $ 32 \cdot 32 $ pixels and 3 channels (one for red, green and blue each) has a shape of $ \left[ 32, 32, 3 \right] $.

* **The Grid:** The large outer brackets $\begin{pmatrix} \dots \end{pmatrix}$ represent the **Shape** (Rows and Columns).
* **The Depth:** Each small inner bracket $\begin{pmatrix} r \\ g \\ b \end{pmatrix}$ is the **Feature Vector** for a single pixel.
* **The Coordinates:** The numbers like $_{1,2}$ mean: "Row 1, Column 2".

To make colors, we use **three numbers** for every single pixel: one for **Red**, one for **Green**, and one for **Blue**.

We can think of a pixel $P$ as a stack of three values:
$$P = \begin{pmatrix} \color{red}{R} \\ \color{green}{G} \\ \color{blue}{B} \end{pmatrix}$$

By mixing these three primary lights at different brightness levels (0 to 255), you can create any color in the world!
</div>

<div id="section-rgb">
	<div style="display: flex; align-items: center; gap: 40px; padding: 20px; border-radius: 12px; margin-top: 15px;">
			<div id="rgb-combined-container"></div>
			<canvas id="rgb-preview-canvas" width="3" height="3" style="width: 180px; height: 180px; image-rendering: pixelated; border: 4px solid #333;"></canvas>
			<p class="md">**Your 3x3 Color Drawing**</p>
	</div>
</div>

<div class="md">
You can then use full images as tensors, ie you can write an image into a variable, and pass it to functions, and get a vector out of it again:

$$ f\left(\text{Image}\right) = \begin{pmatrix} \text{Probability cat} \\ \text{Probability dog} \end{pmatrix} $$

This function, when it is not manually written, we call Model, as it models the behaviour of a function (and thus, acts as this function, even though it is just an approximation for it). 

With other methods of making numbers from data (like Embeddings to create numbers from texts, like chatGPT does, which we will discuss later on), we can create models that do all kinds of stuff. For example, we could create a function that maps $\text{Text} \rightarrow \text{Music}$ or $\text{Image} \rightarrow \text{Text}$.

## The Sum Symbol $ \sum $

In AI, we often deal with thousands or even millions of numbers at once. If we wanted to describe adding them all up, writing $x_1 + x_2 + x_3 + \dots$ would take up too much space. To solve this, mathematicians use the Greek letter **Sigma** ($\sum$) as a shorthand for "summation."

Think of $\sum$ as a **"for-loop"** for addition.

### How to read the symbol
A typical summation looks like this:

$$\sum_{i=1}^{n} x_i$$

* **The Bottom ($i=1$):** This is the **start**. It tells you to start with the first item (where the index $i$ is 1).
* **The Top ($n$):** This is the **stop**. It tells you to stop once you reach the $n$-th item.
* **The Right ($x_i$):** This is the **rule**. It tells you which values you are actually adding together.

### A Concrete Example
If we have a vector $\vec{v} = \begin{pmatrix} 10 \\ 20 \\ 30 \\ 40 \end{pmatrix}$, and we want to find the sum of all its elements, we write:

$$\sum_{i=1}^{4} v_i = v_1 + v_2 + v_3 + v_4 = 10 + 20 + 30 + 40 = 100$$

### Why AI needs this: Weighted Sums
The most common use of the sum symbol in AI is the **Weighted Sum**. When a Neural Network makes a decision, it looks at different inputs (like pixels) and assigns each one a "weight" based on its importance.

If $x$ is the input and $w$ is the weight, the AI calculates a score using this formula:
$$\text{Score} = \sum_{i=1}^{n} w_i x_i$$

This is just a compact way of saying: $(w_1 \cdot x_1) + (w_2 \cdot x_2) + \dots + (w_n \cdot x_n)$.

### Implementation in Code
In classical programming, the summation symbol $\sum$ is written as a simple loop:
</div>

<pre><code class="language-python"># The manual way (how the math works)
numbers = [10, 20, 30, 40]
total = 0

for x in numbers:
    total = total + x

print(total) # Output: 100

# The shorthand way in Python
total = sum(numbers)
</code></pre>

<div class="md">

## The Mathematical Concept: The Role of Infinity ($\infty$)

While we often view infinity as an endless loop or an impossibly large number, in the context of computer science and Large Language Models (LLMs), it acts as a functional tool. It allows systems to handle "impossible" states or "hidden" information without crashing the underlying logic.

### Arithmetic with $\infty$ in Computing

In the floating-point math used by AI models, infinity follows specific rules that allow the model to simplify complex logic:

* **Absorbing Addition/Subtraction:**
	$$\infty + n = \infty$$
	$$\infty - n = \infty$$
	Adding or subtracting any finite number $n$ to infinity changes nothing. This is used in AI to ensure that once a value reaches a certain threshold of "certainty," minor fluctuations don't distract the model.
* **The Vanishing Fraction:** $$\frac{n}{\infty} = 0$$
	Any finite number divided by infinity approaches zero. This is crucial for normalization, helping the model turn massive raw scores into manageable probabilities.
* **The Exponential Decay:** $$e^{-\infty} = 0$$
	The exponential of negative infinity is exactly zero. This is a "superpower" in machine learning. It allows us to "mask" certain pieces of data, essentially telling the model to completely ignore specific words by assigning them a value of $-\infty$. This will become useful later on in the chapter about Transformers.
* $\infty$ is not a normal *number*, though. $\infty - \infty$ is $\text{NaN}$: *Not a Number*.
</div>
