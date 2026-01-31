<?php include_once("functions.php"); ?>

<div class="md">
## Goal of this text

The goal of this site is that everyone who is willing to spend some time reading here and experimenting around can learn what Artificial Intelligence is and how some of those systems work. The Understanding also includes things like chatGPT, which we'll tackle from a very technical point of view.

This journey will lead you through a quick intro into classical programming to AI programming, and the mathematical foundations required to understand them, and it'll act as a starting point for you to go further into this topic by yourself.

It will assume nothing except that you understand English and know mathematical concepts at the level of $ 1 + 1 = 2 $, and every concept will be explained not only in theory, but by practical and easily usable example.

There are many different forms of systems that are generally considered AI, but we will not cover all forms of AI here, but only Neural Networks, as they turned out to be one of the most useful ones.

## Programming

In classical programming, you need to write every single step that has to be done with data. Like this:
</div>

<pre><code class="language-python">x = 1 + 1

print(x)
</code></pre>

<div class="md">
This initializes a *variable* called $ x $, calculates the value of $ 1 + 1 $ and sets $ x $ to it. *Variables* can be thought of as containers for values which you can use instead of concrete values.

According to \citeauthor{historyofmathematicalnotation} (Vol. 1, p. 381), the naming of the variable $x$ for the unknown was started by \citeauthor{lageometrie} in \citeyear{lageometrie}, where he used $a, b, c$ for *known* quantities, and $x, y, z$ for *unknown* ones. We will not follow this strictly, though.

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
    Amplitude: <input type="range" id="slider-5-amp" min="0.5" max="5.0" step="0.1" value="1.0">
    Frequence: <input type="range" id="slider-5-freq" min="0.1" max="2.0" step="0.1" value="0.5"> 
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

## What are approximations?

In traditional programming, we aim for **exactness**. If you write a function to calculate a tax rate, you want the result to be 100% correct every single time. However, the real world is messy and doesn't always follow simple, rigid rules.

An **approximation** (from latin *approximacioun*, "act of coming near or close", see \citetitle{approximationetymology}) is a result that is "close enough" to the truth to be useful, even if it isn't perfect.

### Why AI uses approximations
Most tasks we want AI to solve, like recognizing a face, translating a language, or driving a car, are too complex for "if-then" logic. 

* **Complexity:** There is no single mathematical formula for a "cat." A cat can be any color, in any pose, and in any lighting.
* **The Goal:** Instead of looking for a perfect rule, AI looks for a **statistical likelihood**. It approximates the pattern of a cat based on the thousands of examples it has seen.

### Accuracy vs. Precision
When we talk about models being "good enough," we are looking at the balance of error.
* **A "Perfect" Model:** Would have 0% error but is often impossible to build for complex data.
* **An "Approximate" Model:** Might be 98% accurate. While it may occasionally mistake a fluffy pillow for a cat, its ability to process millions of images in seconds makes it incredibly valuable anyways.

**Key takeaway:** AI doesn't "know" what a cat is in the way humans do. It has simply built a very sophisticated mathematical approximation of "cat-ness."

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
    Start Position ($x$): <input type="range" id="slider-vector-x" min="0" max="5" step="0.5" value="1">
    Start Position ($y$): <input type="range" id="slider-vector-y" min="0" max="5" step="0.5" value="1">
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

## The Sum Symbol $ \sum $

In AI, we often deal with thousands or even millions of numbers at once. If we wanted to describe adding them all up, writing $x_1 + x_2 + x_3 + \dots$ would take up too much space. To solve this, mathematicians use the Greek letter **Sigma** ($\sum$) as a shorthand for "summation". This symbol for summation was introduced by \citeauthor{euler1755} in \citeyear{euler1755} (see p. 61, \citetitle{historyofmathematicalnotation}, Volume 2).

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
## Factorial Function
The factorial $n!$ is the product of all positive integers from 1 to $n$:
$n! = n \times (n-1) \times \dots \times 1$

### Why $0! = 1$?
1. **Combinatorics:** $n!$ represents the number of ways to arrange $n$ objects. There is exactly $1$ way to arrange zero items (the empty set).
2. **Consistency:** To maintain the recursive property $(n-1)! = \frac{n!}{n}$, setting $n=1$ yields $0! = \frac{1!}{1} = 1$.

### Reasoning and History
The notation $n!$ was introduced by **Christian Kramp** in 1808. He sought a notation to simplify the large products found in **combinatorics** and **power series**. 

Defining $0! = 1$ is a "combinatorial convention." It ensures that fundamental formulas, such as the **Binomial Coefficient** $\binom{n}{k} = \frac{n!}{k!(n-k)!}$, remain valid when $k=0$ or $k=n$. Without this definition, these essential mathematical laws would require complex exceptions or result in division by zero.
</div>

<div class="md">
## Euler's Number ($e$)

$e$ is not an arbitrary constant; it is the natural language of growth and change. It is often used in math and machine learning.

### What is $e$? (The Mathematical Definition)
Euler's number ($e \approx 2.71828$) is an irrational number defined by the limit of compound interest as the frequency of compounding approaches infinity. Mathematically, it is defined as:

$$e = \lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n$$

The $\lim$ means we look what happens when $n$ reaches $\infty$. Some numbers get bigger when they go towards infinity, some numbers get smaller and some go towards a certain specific number, which is then called convergence. This equation converges, that means, the higher the $n$ gets, the more closely that number comes to the irrational number $e$.

#### Why exactly this equation? (The Logic of Continuous Growth)

The formula $e = \lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n$ wasn't just invented; it was discovered through the logic of **compound interest**.

Imagine you have 1.00 Euro in a bank that gives you 100% interest per year.

* **Compounded Annually ($n=1$):** At the end of the year, you have $(1 + 1)^1 = 2.00 \text{ Euro}$.
* **Compounded Semi-Annually ($n=2$):** You get 50% halfway through, and 50% at the end. But the second 50% applies to the interest you already earned! $(1 + 0.5)^2 = 2.25 \text{ Euro}$.
* **Compounded Monthly ($n=12$):** $(1 + 1/12)^{12} \approx 2.61 \text{ Euro}$.

While the limit above is the definition, $e$ is most precisely calculated using a [Taylor Series](https://en.wikipedia.org/wiki/Taylor_series) (an infinite sum):

$$e = \lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n = \sum_{n=0}^{\infty} \frac{1}{n!} = \frac{1}{0!} + \frac{1}{1!} + \frac{1}{2!} + \frac{1}{3!} + \frac{1}{4!} \dots$$
$$e = 1 + 1 + 0.5 + 0.1666 + 0.0416 \dots \approx 2.71828$$

#### The "Infinite" Leap
The equation asks: *"What if we compound every single microsecond? What if the interest is calculated continuously?"* As $n$ (the frequency of compounding) goes to infinity, the result doesn't explode to infinity. Instead, it hits a "natural ceiling." That ceiling is exactly **2.71828...** or $e$. It is the maximum possible result of 100% growth shared over infinite intervals.



## Exponentiation
In its simplest form, exponentiation is repeated multiplication. If we ask, "What is 2 to the power of 3?" ($2^3$), we mean:
$$\underbrace{2 \times 2 \times 2}_\text{3 times} = 8$$

In the expression $b^y = x$:
* **$b$** is the **base**.
* **$y$** is the **exponent**.
* **$x$** is the **result**.

While we often start with whole numbers, the exponent $y$ can also be a **floating-point number** (a decimal). For example, $2^{0.5}$ is the same as the square root of 2 ($\approx 1.414$). When the exponent is a fraction, we are no longer just "counting" multiplications; we are looking at continuous growth. This transition from discrete steps to a continuous curve is what makes exponentiation so powerful in modeling natural processes.

While we often start with whole numbers, the exponent $y$ can also be a **floating-point number** (a decimal). For example, $2^{0.5}$ is the same as the square root of 2 ($\approx 1.414$). When the exponent is a fraction, we are no longer just "counting" multiplications; we are looking at continuous growth. This transition from discrete steps to a continuous curve is what makes exponentiation so powerful in modeling natural processes.

### Why is $2^{0.5}$ the square root?
The reason $2^{0.5}$ (or $2^{1/2}$) equals $\sqrt{2}$ comes from the fundamental rule of exponents: when you multiply two powers with the same base, you add the exponents: 
$$b^m \times b^n = b^{m+n}$$

If we multiply $2^{0.5}$ by itself, the rule says:
$$2^{0.5} \times 2^{0.5} = 2^{0.5 + 0.5} = 2^1 = 2$$
Since $2^{0.5}$ is a number that, when multiplied by itself, results in $2$, it fits the literal definition of a square root. This logic extends to any floating-point number; for instance, $2^{0.333}$ is approximately the cube root ($\sqrt[3]{2}$) because adding $0.333 + 0.333 + 0.333$ brings us back to roughly $2^1$.

### What about negative numbers?
Negative exponents do not mean the result becomes negative; instead, they represent the **reciprocal** (division). A negative exponent tells you to "divide" instead of "multiply."
$$2^{-3} = \frac{1}{2^3} = \frac{1}{8} = 0.125$$

In the context of the continuous curve, as the exponent moves into negative territory, the result simply gets closer and closer to zero, but never quite touches it. This is why logarithms (the inverse) are so useful, they allow us to work with these tiny, microscopic fractions by looking at the exponent instead of the decimal.

## Logarithms: Reversing the Process
A logarithm is the inverse operation of exponentiation. It asks the opposite question. Instead of asking for the result of a growth process, it asks: **"To what power must we raise the base to get this specific result?"** ($b^? = x$).

For example, if we ask "To what power must we raise 2 to get 8?" ($\log_2(8) = ?$), the answer is 3.

Abstractly, a logarithm transforms a scale of growth (multiplicative) into a scale of steps (additive). It tells you the "size" or "order of magnitude" of a number rather than just its value.

### The Historical Problem: Calculation Fatigue
Logarithms were introduced to the world in \citeyear{napier1614} by the Scottish mathematician \citeauthor{napier1614} in his landmark work \citealternativetitle{napier1614}.

**The Practical Problem:** During the Renaissance, scientists, especially astronomers like Johannes Kepler, were drowning in data. To calculate the orbits of planets, they had to multiply and divide massive numbers with many decimal places. For example, calculating the position of Mars required multiplying long sines and cosines of angles. Doing this by hand took months and a single tiny error could ruin the entire proof.

Napier’s breakthrough allowed researchers to perform **multiplication by simply adding**:

$$\log(A \times B) = \log(A) + \log(B)$$

By using "Log Tables," an astronomer could look up the logarithms of two giant numbers, add them, and then find the corresponding "anti-logarithm" to get the product. This revolutionary efficiency led the mathematician \citeauthor{laplace1821} to say in \citeyear{laplace1821}: *"Logarithms, by shortening the labors, doubled the life of the astronomer"* (p. 96).

### How are they calculated today?
Modern computers calculate logarithms using infinite series. One of the most fundamental is the **Mercator series** for the natural logarithm ($\ln$):

$$\ln(1+x) = \sum_{n=1}^{\infty} (-1)^{n+1} \frac{x^n}{n} = x - \frac{x^2}{2} + \frac{x^3}{3} - \frac{x^4}{4} + \dots$$

#### The Change of Base
In practice, most mathematical libraries only "know" how to calculate the natural logarithm (base $e \approx 2.718$). To find the logarithm for any other base $a$, we use the **Change of Base Formula**:
$$\log_a(x) = \frac{\ln(x)}{\ln(a)}$$
This works because the logarithm is essentially a scaling factor. If you know the "natural" rate of growth, you can find the rate of growth for any other base by simply dividing by the "cost" of that base in natural terms. This allows a computer to solve any logarithmic problem using just one optimized core function.

### A Note on AI
While logarithms were born from the needs of 17th-century astronomers, they are essential for Artificial Intelligence today. In neural networks, we use them to prevent numerical errors when dealing with tiny probabilities and to calculate how "wrong" a model is during training. We will dive deeper into "Log Loss" and "Softmax" in the upcoming sections.
</div>

<div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="display: flex; flex-wrap: wrap; gap: 30px; justify-content: center; margin-bottom: 20px;">
	<div>
	    <strong>Base ($b$):</strong> <span id="disp-log-base" style="font-family: monospace; font-weight: bold; color: #2563eb;">2.0</span><br>
	    <input type="range" id="slider-log-base" min="1.1" max="10" step="0.1" value="2.0" style="width: 200px;">
	</div>
	<div>
	    <strong>Input ($x$):</strong> <span id="disp-log-x" style="font-family: monospace; font-weight: bold; color: #db2777;">8.0</span><br>
	    <input type="range" id="slider-log-x" min="0.1" max="50" step="0.1" value="8.0" style="width: 200px;">
	</div>
    </div>

    <div id="log-equation-display" style="text-align: center; font-size: 1.3em; margin-top: 15px; min-height: 50px; background: #f8fafc; padding: 10px; border-radius: 6px;">
	$$ \log_{2}(8) = 3 $$
    </div>

    <div id="log-plot" style="width:100%; height:400px;"></div>
</div>

<div class="md">
## The Mathematical Concept: The Role of Infinity ($\infty$)

While we often view infinity as an endless loop or an impossibly large number, in the context of computer science and Large Language Models (LLMs), it acts as a functional tool. It allows systems to handle "impossible" states or "hidden" information without crashing the underlying logic. The use of the symbol $\infty$ for the concept of infinity dates back to \citeyear{wallis1655}, according to \citeauthor{historyofmathematicalnotation} (Vol. 1, p. 214).

### Arithmetic with $\infty$ in Computing

In the floating-point math used by AI models, infinity follows specific rules that allow the model to simplify complex logic:

* **Absorbing Addition/Subtraction:**
	$$\infty + n = \infty$$
	$$\infty - n = \infty$$
	$$\infty + \infty = \infty$$
	Adding or subtracting any finite number $n$ to infinity changes nothing. This is used in AI to ensure that once a value reaches a certain threshold of "certainty," minor fluctuations don't distract the model.
* **The Vanishing Fraction:** $$\frac{n}{\infty} = 0$$
	Any finite number divided by infinity approaches zero. This is crucial for normalization, helping the model turn massive raw scores into manageable probabilities.
* **The Exponential Decay:** $$e^{-\infty} = 0$$
	The exponential of negative infinity is exactly zero. This is a "superpower" in machine learning. It allows us to "mask" certain pieces of data, essentially telling the model to completely ignore specific words by assigning them a value of $-\infty$. This will become useful later on in the chapter about Transformers.
* $\infty$ is not a normal *number*, though. $\infty - \infty$ is $\text{NaN}$: *Not a Number*.
* Similiarly, $\frac{\infty}{\infty}$ is $\text{NaN}$.

## Computer Science Terminology

* Integer: A whole number without a fractional component (e.g., -5, 0, 42).
* Floating Point Number: A number containing a decimal point or exponent to represent fractions (e.g., 3.14, -0.001).
</div>
