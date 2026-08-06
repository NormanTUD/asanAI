<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Math I — The Numerical Foundations
description: Programming, functions, sums, products, infinity, Euler's number, exponentials, logarithms.
icon: &#128290;
part: 1
order: 3
color: accent
topics: math-i
-->

<div class="md">
Before we can understand a Neural Network, we have to understand the language it speaks: **mathematics**. This first of three math chapters covers the numerical foundations — the symbols and operations that appear constantly in AI code.

By the end, you will be comfortable with the sum symbol $\sum$, Euler's number $e$, logarithms, and the way a computer represents "infinity" without crashing.
</div>

<div class="md">
## Programming

In classical programming, you need to write every single step that has to be done with data. Like this:
</div>

<pre><code class="language-python">x = 1 + 1

print(x)
</code></pre>

<div class="md">
This initializes a *variable* called $ x $, calculates the value of $ 1 + 1 $ and sets $ x $ to it. *Variables* can be thought of as containers for values which you can use instead of concrete values.
</div>

<div class="optional md" data-headline="Why are variables often called 'x'?">
According to \citeauthor{historyofmathematicalnotation} (Vol. 1, p. 381), the naming of the variable $x$ for the unknown was started by \citeauthor{lageometrie} in \citeyear{lageometrie}, where he used $a, b, c$ for *known* quantities, and $x, y, z$ for *unknown* ones. We will not follow this strictly, though.
</div>

<div class="md">
The line with <tt>print</tt> then prints out this value to the command line.

You can also use more variables, like the next example uses $ y $, which, in turn, uses the value of $ x $ to print $ 3 $ after calculating its values.
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

<div class="md">
When we have such a function, we can go through a list of values, like $1$, $2$, $\dots$, and plug them into the function, and use the resulting number as a position indicator, and create a so-called "plot" from it. That is, we show it in a diagram where $x$ is left-to-right and $y$, the result, is the vertical direction. The identity function looks like this:
</div>

<div id="plot-step-1" class="plot-container" style="height: 250px; margin-bottom: 40px;"></div>

<div class="md">
We can now also introduce parameters, $a$ and $b$ (which will later be the so-called **weights**): $ f(x) = ax + b $. A changes the slope of the line, while b moves it up- or downwards.
</div>

<pre><code class="language-python">def straight_line(a, b, x):
    return a*x + b
</code></pre>

<div class="md">
For example, the $ \text{add} $-function takes 2 inputs, and adds them to each other with the rule $ \text{Output} = \text{First input} + \text{second input} $. We may use shorter names like $x$ and $y$ instead of $\text{First input}$. In python, it looks like this:
</div>

<pre><code class="language-python"># A function that takes two inputs
def add(x, y):
    return x + y

print(add(10, 5)) # Output: 15</code></pre>

<div class="md">
Of course, we can also parameterize this function: $f(x, y) = ax + by$.

For mathematically understanding functions, you need to understand sets first, which luckily is quite simple. A set is a collection of things, like the collection of positive natural numbers smaller than 4: $\left\{1, 2, 3\right\}$. A function now, mathematically speaking, is a rule to transform each input of one set into exactly one element of another set. Like, for example, the function $y = f(x) = x \cdot 2$, transforms the input $x$ to $y$ with the rule $x\cdot 2$.

Sets do not need to contain only numbers, though. A set can be *anything*. Sets can contain sets, or sets can contain images, or people, or whatever else that can be listed. The *set* of jobs could be something like this: $\left\{\text{programmer}, \text{janitor}, \text{cashier}, \dots\right\}$. Sets can have a limited number of elements (and even be empty), or have an unlimited amount of elements, like the set of all numbers. Since, for each number, there's always a larger number, the set never ends.

There are certain sets that are useful to know, like $\mathbb{N}$, which is the set of all natural numbers, or $\mathbb{R}$, which is the set of all real numbers (i.e. all numbers we use in every day life when not simply counting, e.g. $1.8$ or $3.14$, but also every number from $\mathbb{N}$, or the set of so-called **boolean values** $\mathbb{B} = \left\{\text{True}, \text{False}\right\}$, but a set does not need to be any of them.

Functions define a rule so that, for each element of a set, if you apply the rules the function defines, you end up with an element in another (or even the same) set of elements.

Another example for a function could be something like the function $\text{is\_even}(x)$, which takes any positive integer (the natural numbers) and returns $\text{True}$ if it is the number is even, and else $\text{False}$. Here, the input set is $\mathbb{N}$, which is math-speak for "all the natural numbers" ($\left\{0, 1, 2, 3, 4, 5, 6, \dots\right\}$), and the output set the input set is mapped to is just $\left\{\text{True}, \text{False}\right\}$ $(\mathbb{B})$.

We can say that an element $x$ is part of a set $S$, like $3$ is in the set $\mathbb{N}$ by writing: $x \in S$, for example, saying that 3 is in the set of natural numbers, we can write $3 \in \mathbb{N}$. We can also negate it by saying $\pi=3.14159265\dots$ is *not* in the natural numbers: $\pi \not\in \mathbb{N}$.
</div>

<div class="md">
## Classical programming vs. AI

In classical programming, you would specify each step by hand to define a function, but for some functions, this is barely possible since the problem is ill-defined or way too complex.

For example, imagine you need a program to tell images of cats and dogs apart. Where do you start? You cannot simply write a function that checks for every single pixel value, because then you'd need to know every single possible image of a cat or a dog, which is an infinite amount.

This is where AI comes in. AI replaces the idea of a hand-written *function* with a *model* that does what you want, and doesn't do it by a list of handwritten rules, but learns how to do it by example. For example, you may have a large set of images of cats and dogs, and the information for each image, if it shows a cat or a dog. Then, you'd have 2 sets, one, the set of all images, and the set of results like $\left\{\text{cat}, \text{dog}\right\}$, where each Image is mapped to one of those results, ie. you know that you want $\text{function}\left(\text{Image of a cat}\right) \rightarrow \text{cat}$ and $\text{function}\left(\text{Image of a dog}\right) \rightarrow \text{dog}$. AI then learns how to get from that input to that output. You only provide basic building blocks it should use, which depend on the type of task you want it to solve.

This model will (most probably) not be perfect. But it can be **good enough** to be useful.

Throughout this course, we will look into these building blocks and how the computer then creates this model, and how these building blocks work. We'll start with very simple building blocks for simple numbers, and then go to building blocks to classify images, and end up with Transformers, which are the basic structure for chatGPT, which all take ideas from each other.
</div>

<div class="md">
## The Sum Symbol $ \sum $

In AI, we often deal with thousands or even millions of numbers at once. If we wanted to describe adding them all up, writing $x_1 + x_2 + x_3 + \dots$ would take up too much space. To solve this, mathematicians use the Greek letter **Sigma** ($\sum$) as a shorthand for "summation". This symbol for summation was introduced by \citeauthor{euler1755} in \citeyear{euler1755} (see p. 61, § 438, \citetitle{historyofmathematicalnotation}, Volume 2).

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
## The Product Symbol $\prod$

The Greek **capital Pi** ($\prod$) is the mathematical shorthand for repeated multiplication. It works similar to the $\sum$:

$$\prod_{i = 1}^5 i = 1 \cdot 2 \cdot 3 \cdot 4 \cdot 5 = 120 $$

### The Factorial

A special type of function often encountered in combinatorics and calculus is the **factorial**. It represents the product of all positive integers less than or equal to a non-negative integer $n$.

Factorials ($n!$) are the product of all positive integers up to $n$:

$$n! = \prod_{k=1}^{n} k = 1 \cdot 2 \cdot 3 \cdot \dots \cdot n$$

According to \citeauthor{historyofmathematicalnotation} (Vol. 2, p. 71, § 448), the familiar exclamation point notation $n!$ was introduced by \citeauthor{kramp1808} in his work \citetitle{kramp1808} (\citeyear{kramp1808}). Before this, mathematicians often used a L-shaped symbol to denote the same operation.

In programming, we can define this function using **recursion**, where a function calls itself to solve smaller versions of the same problem:
</div>

<pre><code class="language-python">def factorial(n):
    if n == 0:
        return 1 # By definition, 0! is 1
    else:
        return n * factorial(n - 1)

print(factorial(5)) # calculates 5 * 4 * 3 * 2 * 1 = 120
</code></pre>

<div class="md">
The factorial grows extremely quickly, much faster than exponential functions. This growth is essential when calculating the number of possible permutations (orderings) of a set of objects.
</div>

<div class="optional md" data-headline="Why is 0! = 1?">
1. **Combinatorics:** $n!$ represents the number of ways to arrange $n$ objects. There is exactly $1$ way to arrange zero items (the empty set).
2. **Consistency:** To maintain the recursive property $(n-1)! = \frac{n!}{n}$, setting $n=1$ yields $0! = \frac{1!}{1} = 1$.
</div>

<div class="optional md" data-headline="Reasoning and History">
The notation $n!$ was introduced by \citeauthor{kramp1808} in \citeyear{kramp1808} (p. XI). He sought a notation to simplify the large products found in **combinatorics** and **power series**.

Defining $0! = 1$ is a "combinatorial convention". It ensures that fundamental formulas, such as the **Binomial Coefficient** $\binom{n}{k} = \frac{n!}{k!(n-k)!}$, remain valid when $k=0$ or $k=n$. Without this definition, these essential mathematical laws would require complex exceptions or result in division by zero.
</div>

<div class="md">
## Arithmetic with $\infty$ in Computing

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
* Similarly, $\frac{\infty}{\infty}$ is $\text{NaN}$.

### The Concept of Limits ($\lim$)

In computing, we treat $\infty$ as a value, but in mathematics, we use limits to describe behavior.

* **The Vanishing Fraction:** As the denominator $x$ becomes infinitely large, the ratio $\frac{n}{x}$ shrinks to zero.
    $$\lim_{x \to \infty} \frac{n}{x} = 0$$

* **Exponential Decay (Masking):** In Softmax layers, we use $e^{-\infty}$. Mathematically, this is the limit of the natural exponential function as it moves toward negative infinity.
    $$\lim_{x \to -\infty} e^x = 0$$

* **Indeterminate Forms:** Limits explain why $\frac{\infty}{\infty}$ is $\text{NaN}$. Different functions reach infinity at different speeds, so the result isn't a single number. For example:
    $$\lim_{x \to \infty} \frac{x^2}{x} = \infty \quad \text{vs.} \quad \lim_{x \to \infty} \frac{x}{x^2} = 0$$

## Euler's Number ($e$)

$e$ is not an arbitrary constant; it is the natural language of growth and change. It is often used in math and machine learning. Euler's number ($e \approx 2.71828$) is an irrational number defined by the limit of compound interest as the frequency of compounding approaches infinity. Mathematically, it is defined as:

$$e = \lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n$$

The $\lim$ means we look what happens when $n$ reaches $\infty$. Some numbers get bigger when they go towards infinity, some numbers get smaller and some go towards a certain specific number, which is then called convergence. This equation converges, that means, the higher the $n$ gets, the more closely that number comes to the irrational number $e$.

The formula $e = \lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n$ wasn't just invented; it was discovered through the logic of **compound interest**.

Imagine you have 1.00 Euro in a bank that gives you 100% interest per year.

* **Compounded Annually ($n=1$):** At the end of the year, you have $(1 + 1)^1 = 2.00 \text{ Euro}$.
* **Compounded Semi-Annually ($n=2$):** You get 50% halfway through, and 50% at the end. But the second 50% applies to the interest you already earned! $(1 + 0.5)^2 = 2.25 \text{ Euro}$.
* **Compounded Monthly ($n=12$):** $(1 + 1/12)^{12} \approx 2.61 \text{ Euro}$.

While the limit above is the definition, $e$ can be calculated using a Taylor Series (an infinite sum):

$$e = \lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n = \sum_{n=0}^{\infty} \frac{1}{n!} = \frac{1}{0!} + \frac{1}{1!} + \frac{1}{2!} + \frac{1}{3!} + \frac{1}{4!} \dots$$
$$e = 1 + 1 + 0.5 + 0.1666 + 0.0416 \dots \approx 2.71828$$

The equation asks: *"What if we compound every single microsecond? What if the interest is calculated continuously?"* As $n$ (the frequency of compounding) goes to infinity, the result doesn't explode to infinity. Instead, it hits a "natural ceiling." That ceiling is exactly **2.71828...** or $e$. It is the maximum possible result of 100% growth shared over infinite intervals.
</div>

<div class="optional md" data-headline="History of the Taylor Series">
The idea of summing infinite series to achieve finite results dates back to antiquity, notably Zeno's paradox, later addressed through Archimedes's method of exhaustion. In the 14th century, \citeauthor{madhava} gave the earliest known examples of specific Taylor series, for sine, cosine, and arctangent, though not the general method. His followers in the Kerala school developed further expansions over the following two centuries.

In early 1671, James Gregory independently discovered something like the general Maclaurin series (see \citetitle{gregoryachievements}), but never published his method, believing he had merely rediscovered work by Isaac Newton. In 1691–1692, Newton wrote down an explicit general formulation in an unpublished draft of \citetitle{newtonquadratura}, but the relevant sections were omitted from the 1704 publication.

It was not until 1715 that \citeauthor{taylor1715} published the first general method for constructing these series (pp. 21–23), after whom they are now named. The special case centered at zero was later named after \citeauthor{maclaurin}, who published the relevant work in 1742.
</div>

<div class="md">
## Exponentiation

In its simplest form, exponentiation is repeated multiplication. If we ask, "What is 2 to the power of 3?" ($2^3$), we mean:

$$\underbrace{2 \times 2 \times 2}_\text{3 times} = 8$$

In the expression $b^y = x$:
* **$b$** is the **base**.
* **$y$** is the **exponent**.
* **$x$** is the **result**.

While we often start with whole numbers, the exponent $y$ can also be a **floating-point number** (a decimal). For example, $2^{0.5}$ is the same as the square root of 2 ($\approx 1.414$). When the exponent is a fraction, we are no longer just "counting" multiplications; we are looking at continuous growth. This transition from discrete steps to a continuous curve is what makes exponentiation so powerful in modeling natural processes.
</div>

<div class="optional md" data-headline="Why is $2^{0.5}$ the square root?">
The reason $2^{0.5}$ (or $2^{1/2}$) equals $\sqrt{2}$ comes from the fundamental rule of exponents: when you multiply two powers with the same base, you add the exponents:
$$b^m \times b^n = b^{m+n}$$

If we multiply $2^{0.5}$ by itself, the rule says:
$$2^{0.5} \times 2^{0.5} = 2^{0.5 + 0.5} = 2^1 = 2$$
Since $2^{0.5}$ is a number that, when multiplied by itself, results in $2$, it fits the literal definition of a square root. This logic extends to any floating-point number; for instance, $2^{0.333}$ is approximately the cube root ($\sqrt[3]{2}$) because adding $0.333 + 0.333 + 0.333$ brings us back to roughly $2^1$.
</div>

<div class="optional md" data-headline="What about negative numbers?">
Negative exponents do not mean the result becomes negative; instead, they represent the **reciprocal** (division). A negative exponent tells you to "divide" instead of "multiply."
$$2^{-3} = \frac{1}{2^3} = \frac{1}{8} = 0.125$$

In the context of the continuous curve, as the exponent moves into negative territory, the result simply gets closer and closer to zero, but never quite touches it. This is why logarithms (the inverse) are so useful, they allow us to work with these tiny, microscopic fractions by looking at the exponent instead of the decimal.
</div>

<div class="md">
## Logarithms: Reversing the Process

A logarithm is the inverse operation of exponentiation. It asks the opposite question. Instead of asking for the result of a growth process, it asks: **"To what power must we raise the base to get this specific result?"** ($b^? = x$).

For example, if we ask "To what power must we raise 2 to get 8?" ($\log_2(8) = ?$), the answer is 3.

Abstractly, a logarithm transforms a scale of growth (multiplicative) into a scale of steps (additive). It tells you the "size" or "order of magnitude" of a number rather than just its value.
</div>

<div class="optional md" data-headline="The Historical Problem: Calculation Fatigue">
Logarithms were introduced in \citeyear{napier1614} by the Scottish mathematician John Napier in his landmark work \citealternativetitle{napier1614}.

**The Practical Problem:** During the Renaissance, scientists, especially astronomers like Johannes Kepler, were drowning in data. To calculate the orbits of planets, they had to multiply and divide massive numbers with many decimal places. For example, calculating the position of Mars required multiplying long sines and cosines of angles. Doing this by hand took months and a single tiny error could ruin the calculations.

Napier's breakthrough allowed researchers to perform **multiplication by simply adding**:

$$\log(A \times B) = \log(A) + \log(B)$$

By using "Log Tables," an astronomer could look up the logarithms of two giant numbers, add them, and then find the corresponding "anti-logarithm" to get the product. This revolutionary efficiency led the mathematician \citeauthor{laplace1821} to say in \citeyear{laplace1821}: *"Logarithms, by shortening the labors, doubled the life of the astronomer"* (p. 96).
</div>

<div class="optional md" data-headline="How is the Logarithm calculated today?">
Modern computers calculate logarithms using infinite series. One of the most fundamental is the \citealternativetitle{mercator1668} (p. 32f) for the natural logarithm ($\ln$):

$$\ln(1+x) = \sum_{n=1}^{\infty} (-1)^{n+1} \frac{x^n}{n} = x - \frac{x^2}{2} + \frac{x^3}{3} - \frac{x^4}{4} + \dots$$
</div>

<div class="md">
### The Change of Base

In practice, most mathematical libraries only "know" how to calculate the natural logarithm (base $e \approx 2.718$). To find the logarithm for any other base $a$, we use the **Change of Base Formula**:

$$\log_a(x) = \frac{\ln(x)}{\ln(a)}$$

This works because the logarithm is essentially a scaling factor. If you know the "natural" rate of growth, you can find the rate of growth for any other base by simply dividing by the "cost" of that base in natural terms. This allows a computer to solve any logarithmic problem using just one optimized core function.

While logarithms were born from the needs of 17th-century astronomers, they are essential for Artificial Intelligence today. In neural networks, we use them to prevent numerical errors when dealing with tiny probabilities and to calculate how "wrong" a model is during training. We will dive deeper into "Log Loss" and "Softmax" in the upcoming sections.
</div>

<div style="background: var(--mn-bg); padding: 20px; border: 1px solid var(--mn-border); border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
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

    <div id="log-equation-display" style="text-align: center; font-size: 1.3em; margin-top: 15px; min-height: 50px; background: var(--mn-bg-subtle); padding: 10px; border-radius: 6px;">
	$$ \log_{2}(8) = 3 $$
    </div>

    <div id="log-plot" style="width:100%; height:400px;"></div>
</div>

<div class="md">
## The Mathematical Concept: The Role of $\infty$

While we often view infinity as an endless loop or an impossibly large number, in the context of computer science and Large Language Models (LLMs), it acts as a functional tool. It allows systems to handle "impossible" states or "hidden" information without crashing the underlying logic. The use of the symbol $\infty$ for the concept of infinity dates back to \citeyear{wallis1655}, according to \citeauthor{historyofmathematicalnotation} (Vol. 1, p. 214).
</div>

<script>
// Reuse the original math.js content if available
if (typeof loadMathIModule === 'undefined') {
	async function loadMathIModule() {
		updateLoadingStatus("Loading section about Math I...");
		return Promise.resolve();
	}
}

// Identity plot
(function() {
	const plotEl = document.getElementById('plot-step-1');
	if (plotEl && typeof Plotly !== 'undefined') {
		const xs = [], ys = [];
		for (let x = -5; x <= 5; x += 0.1) { xs.push(x); ys.push(x); }
		Plotly.newPlot('plot-step-1', [{ x: xs, y: ys, mode: 'lines', line: { color: '#3b82f6', width: 3 } }], {
			paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
			margin: { t: 20, b: 40, l: 50, r: 20 }, xaxis: { title: 'x' }, yaxis: { title: 'y = x' }
		}, { responsive: true });
	}
})();

// Logarithm interactive plot
(function() {
	const sliderBase = document.getElementById('slider-log-base');
	const sliderX = document.getElementById('slider-log-x');
	const dispBase = document.getElementById('disp-log-base');
	const dispX = document.getElementById('disp-log-x');
	const formulaContainer = document.getElementById('log-equation-display');
	if (!sliderBase || !sliderX || typeof Plotly === 'undefined') return;

	function getThemeColor(c) {
		return getComputedStyle(document.documentElement).getPropertyValue(c).trim() || '#1e293b';
	}

	function renderLog() {
		const b = parseFloat(sliderBase.value);
		const inputX = parseFloat(sliderX.value);
		dispBase.textContent = b.toFixed(1);
		dispX.textContent = inputX.toFixed(1);

		const xValues = [], yValues = [];
		for (let i = 0.1; i <= 50; i += 0.5) {
			xValues.push(i);
			yValues.push(Math.log(i) / Math.log(b));
		}
		const currentY = Math.log(inputX) / Math.log(b);
		const minY = Math.min(...yValues, currentY);
		const maxY = Math.max(...yValues, currentY);
		const padding = (maxY - minY) * 0.1 || 1;

		const traceCurve = {
			x: xValues, y: yValues, mode: 'lines',
			name: 'log base ' + b.toFixed(1),
			line: { color: '#2563eb', width: 3 }
		};
		const tracePoint = {
			x: [inputX], y: [currentY], mode: 'markers',
			name: 'Your Value',
			marker: { size: 12, color: '#db2777', line: { color: 'white', width: 2 } }
		};
		const traceLines = {
			x: [inputX, inputX, 0], y: [0, currentY, currentY], mode: 'lines',
			showlegend: false,
			line: { color: getThemeColor('--mn-text-muted'), width: 1, dash: 'dash' }
		};
		const layout = {
			paper_bgcolor: 'rgba(0,0,0,0)',
			plot_bgcolor: 'rgba(0,0,0,0)',
			font: { color: getThemeColor('--mn-text') },
			title: { text: 'The Logarithm', font: { size: 16 } },
			xaxis: { title: 'Input (x)', range: [0, 52], zeroline: true,
				gridcolor: getThemeColor('--mn-border-light'),
				tickfont: { color: getThemeColor('--mn-text-secondary') } },
			yaxis: { title: 'Output (y)', range: [minY - padding, maxY + padding],
				zeroline: true,
				gridcolor: getThemeColor('--mn-border-light'),
				tickfont: { color: getThemeColor('--mn-text-secondary') } },
			margin: { l: 50, r: 20, b: 50, t: 40 },
			showlegend: false,
			hovermode: 'closest'
		};
		Plotly.react('log-plot', [traceCurve, traceLines, tracePoint], layout);

		const tex = `$$ \\log_{${b.toFixed(1)}}(${inputX.toFixed(1)}) = ${currentY.toFixed(2)} \\iff ${b.toFixed(1)}^{${currentY.toFixed(2)}} = ${inputX.toFixed(1)} $$`;
		formulaContainer.innerHTML = tex;
		if (typeof render_temml === 'function') render_temml();
	}

	sliderBase.addEventListener('input', renderLog);
	sliderX.addEventListener('input', renderLog);
	renderLog();
})();
</script>
