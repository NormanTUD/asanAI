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
This initializes a *variable* called $ x $, calculates the value of $ 1 + 1 $ and sets $ x $ to it. *Variables* can be though of as containers for values which you can use instead of concrete values. Imagine a website where the user can enter his or her age, and the website will tell you if you are older than 18 or younger. The $ \text{age} $ is then a variable which the user enters, and which can be checked further with code.

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
For mathematically understanding functions, you need to understand sets first, which luckily is quite simple. A set is a collection of things, like the collection of positive natural numbers smaller than 4: $\left\{1, 2, 3\right\}$. A function now, mathematically speaking, is a rule to transform each input of one set into one element of another set. Like, for example, the function $y = f(x) = x * 2$, transforms the input $x$ to $y$ with the rule $x * 2$.

Sets do not need to contain only numbers, though. A set can be *anything*. Sets can contain sets, or sets can contain images, or people, or whatever else. The *set* of jobs could be something like this: $\left\{\text{programmer}, \text{janitor}, \text{cashier}, \dots\right\}$. Sets can have a limited number of elements (and even be empty), or have an unlimited amount of elements, like the set of all numbers. Since, for each number, there's always a larger number, the set never ends.

Functions define a rule so that, for each element of a set, if you apply the rules the function defines, you end up with an element in another (or even the same) set of elements. 

Another example for a function could be something like the function $\text{is_even}(x)$, which takes any positive integer (the natural numbers) and returns $\text{True}$ if it is the number is even, and else $\text{False}$. Here, the input set is $\mathbb{N}$, which is math-speak for "all the natural numbers" ($\left\{1, 2, 3, 4, 5, 6, \dots\right\}$), and the output set the input set is mapped to is just $\left\{\text{True}, \text{False}\right\}$.

# Classical programming vs. AI

In classical programm, you would specify each step by hand to define a function, but for some functions, this is barely possible since the problem is ill-defined or way too complex.

For example, imagine you need a program to tell images of cats and dogs apart. Where do you start? You cannot simply write a function that checks for every single pixel value, because then you'd need to know every single possible image of a cat or a dog, which is an infinite amount.

This is where AI comes in. AI replaces the idea of a hand-written *function* with a *model* that does what you want, and doesn't do it by a list of handwritten rules, but learns how to do it by example. For example, you may have a large set of images of cats and dogs, and the information for each image, if it shows a cat or a dog. Then, you'd have 2 sets, one, the set of all images, and the set of results like $\left\{\text{cat}, \text{dog}\right\}$, where each Image is mapped to one of those results, ie. you know that you want $\text{function}\left\{\text{Image of a cat}\right\} \rightarrow \text{cat}$ and $\text{function}\left\{\text{Image of a dog}\right\} \rightarrow \text{dog}$. AI then learns how to get from that input to that output. You only provide basic building blocks it should use, which depend on the type of task you want it to solve.

Throughout this course, we will look into these building blocks and how the computer then creates this model.


In AI, it learns by example, and you only give it different building blocks it can combine to approximate a function.

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
