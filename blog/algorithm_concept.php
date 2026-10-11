<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Algorithm as a Concept
description: For two thousand years, algorithms were done but never studied. How a procedure became a mathematical object — and the 1928 question that forced the entire modern theory of computation to be invented.
icon: &#129518;
part: 1
order: 13
color: sky
topics: history, programming, math-i
tags: interested-layman
math: 30
-->

<div class="md" data-lesson-id="algorithm_concept">
You have used the word *algorithm* so many times it has lost all meaning. A sorting step is an algorithm. A search is an algorithm. The way your coffee machine cycles through its modes is, in the strict sense, an algorithm. But there is a question almost nobody asks, and it is the one this whole field was eventually built around: **what makes a procedure an *algorithm* — as opposed to just a set of steps you happen to run?**

Two properties, and they are the entire game.

* **It must terminate.** An algorithm is not an infinite loop. It must *finish*, in a finite number of steps, for every input it promises to handle.
* **It must be correct — by construction.** Not "it usually works," not "we tested a few cases," but *guaranteed* right, by an argument that holds for *every* input.

A procedure that has both is an algorithm. The rest of this chapter is the story of those two properties — and of how, in a single decade, they went from being quietly *practiced* for two thousand years to being rigorously *studied*.
</div>

<div class="md">
## The first non-trivial algorithm: Euclid (c. 300 BC)

The oldest algorithm still in use every day sits in Euclid's *Elements*, Book VII \cite[Euclidean algorithm]{euclideanalgorithm} \cite[The Elements]{euclidelements}. Given two whole numbers, find their **greatest common divisor** — the largest number that divides both. The procedure:

> Divide the larger by the smaller. Replace the pair by *(the smaller, the remainder)*. Repeat until the remainder is zero. The last non-zero remainder is the answer.

It is an algorithm in the full, strong sense — and the *why* is the point, because it is the earliest example we have of someone *checking the two properties*.

* **Termination.** Each remainder is smaller than the divisor it came from, and a remainder is always smaller than the divisor. So the second number of the pair, the divisor, strictly shrinks at every step. A list of positive integers that keeps shrinking cannot go on forever — it *must* reach zero. That is not a hope that it will stop; it is a proof that it will.
* **Correctness.** The load-bearing fact is $gcd(a, b) = gcd(b, a - qb)$: taking away a multiple of one number from the other never changes the two numbers' common divisor. Every single step preserves the answer; and when the process ends, the answer is sitting in the last non-zero remainder.

For the next two thousand years, this was just *the way you found a common divisor*. Nobody wrote "this procedure provably terminates and is provably correct," because the idea of checking those two things **in general** had not yet occurred to anyone.
</div>

<div id="gcd-lab" style="max-width: var(--mn-col-width); margin: 1.5em auto; padding: 20px; border: 1px solid var(--mn-border); border-radius: 12px; background: var(--mn-surface);">
	<h3 style="margin-top:0; color: var(--mn-text);">Watch it terminate</h3>
	<p style="color: var(--mn-text); line-height:1.5;">Pick two positive integers and run the algorithm. Watch the middle column shrink — that shrinking is the *proof* the process has to stop.</p>
	<div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap; margin: 12px 0;">
		<label style="color:var(--mn-text);">a <input type="number" id="gcd-a" value="462" min="1" style="width:90px; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-surface); color:var(--mn-text);"></label>
		<label style="color:var(--mn-text);">b <input type="number" id="gcd-b" value="132" min="1" style="width:90px; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-surface); color:var(--mn-text);"></label>
		<button id="gcd-run" class="btn btn-train" onclick="GCD.run()">Run the algorithm</button>
	</div>
	<table id="gcd-steps" style="width:100%; border-collapse:collapse;"></table>
	<p id="gcd-result" style="font-family:monospace; color:var(--mn-text);"></p>
</div>

<div class="md">
### Another shape of algorithm: the Sieve of Eratosthenes (c. 240 BC)

A little later, and a little further east, the same two millennia-old craft produced a different *shape* of procedure: the \cite[Sieve of Eratosthenes]{sieveoferatosthenes}. Given a limit $n$, list every number from 2 to $n$, then cross off every multiple of 2, then every multiple of 3, then 5, and so on. What is left standing is exactly the set of primes.

Where Euclid's algorithm *reduces* a problem step by step, the sieve **filters** a finite set. It is still an algorithm, for the same two reasons: it *terminates* (once the smallest number you have not crossed off, $p$, satisfies $p^2 > n$, nothing below $n$ can still be composite, so you are done), and it is *correct by construction* (a number survives the sieve only if none of the primes below it divide it, which is precisely what being prime means). Two algorithms, separated by a few decades and a city, both defined long before the word *computer* existed, both pinned down by the identical pair: **it stops, and it is right.**

<figure style="float: right; width: 24%; max-width: 220px; margin: 0 0 1em 1em;">
	<img style="width: 100%; height: auto; display: block;" src="eratosthenes.jpg" alt="Engraving of Eratosthenes of Cyrene" />
	<figcaption class="md">Eratosthenes of Cyrene (c. 276–194 BC), from a later engraving. Public domain.</figcaption>
</figure>
</div>

<div class="md">
## The gap: two thousand years of *doing*, none of *studying*

Here is the gap the rest of the course has been circling. For all that, the algorithm was never a **thing**. It was a **verb**. People *did* algorithms; no one *studied* them as objects with properties you could check.

The name is itself a fossil of that gap. *Algorithm* is the Latinized form of the name of the Persian mathematician al-Khwarizmi, whose ninth-century arithmetic gave us the word \cite[the etymology of "algorithm" (Wikipedia)]{historyofmath_wikipedia} — the course traces al-Khwarizmi himself in [The Brief History of AI](history.php). But al-Khwarizmi *named and catalogued* procedures — he did not ask the question that actually matters, and that nobody had asked before:

> Is there a **general, universal** procedure? Can one machine, running one rule, decide the answer to *any* problem in a class — not just *this* gcd, or *this* sieve, but *any* instance, for all time?

Naming a class of things is not the same as asking whether the class has a single procedure that handles all of it. That question — and it is *the* question — sat unasked until the twentieth century.
</div>

<div class="md">
## The question that built everything: the Entscheidungsproblem (1928)

In 1928 the mathematician David Hilbert (\cite[Hilbert & Ackermann, 1928]{hilbert1928entscheidung}) posed a question that had been waiting, unasked, for two thousand years. In German it is the **Entscheidungsproblem**, the decision problem:

> Given any statement of arithmetic — or, more generally, any formula of logic — does there exist a **general, mechanical procedure** that decides, in a finite number of steps, whether the statement is provable?

This is exactly the question Euclid's two properties had been pointing at all along. An *algorithm* was, quietly, a candidate *answer*: a mechanical procedure that terminates and is correct. The Entscheidungsproblem asks whether such a procedure exists **in general** — not for this problem, but for the whole class. Hilbert was confident the answer was **yes**; he was actively looking for the procedure.

The answer, delivered two years later by two independent mathematicians wielding two tools that looked nothing alike, was **no**.

<figure style="float: right; width: 24%; max-width: 220px; margin: 0 0 1em 1em;">
	<img style="width: 100%; height: auto; display: block;" src="hilbert_1907.jpg" alt="David Hilbert, 1907" />
	<figcaption class="md">David Hilbert (1862–1943), 1907. Public domain.</figcaption>
</figure>
</div>

<div class="md">
## 1936: two machines, one answer

Kurt Gödel had already delivered the first blow in 1931 with his incompleteness theorems \cite[Gödel's incompleteness theorems (1931)]{godel1931incompleteness}: no consistent system strong enough for arithmetic can prove every true statement in it. But incompleteness left a door open — it says some truths escape *proof*, not that no *procedure* could still decide which statements are decidable. The decision problem was still, as far as anyone could tell, on the table.

In 1936, independently, and to the best of our knowledge unaware of each other's work, **Alonzo Church** and **Alan Turing** each wrote down a rigorous formalism for "mechanical procedure," and each used it to answer the 1928 question with a proof that the answer is **no** \cite[The Church–Turing Thesis (SEP)]{churchturing1936}.

* **Church** worked with the λ-calculus: pure rewriting of symbols, a formalism that reads like algebra.
* **Turing** built a *machine* — a finite controller that reads one symbol at a time from, and writes symbols to, an infinite strip of tape, moving left or right according to its current state \cite[Turing, On Computable Numbers (1936)]{turing1937}.

The two formalisms look nothing alike. One is a calculus; the other is a physical picture of a head on a tape. And yet they compute *exactly* the same set of functions — every problem one can solve, the other can solve too. That coincidence is so load-bearing that it has its own name: the \cite[Church–Turing thesis (SEP)]{churchturing1936}.

And the upshot for the 1928 question: within this shared class of "what a machine can do," there are true statements of arithmetic for which **no** decision procedure exists. The Entscheidungsproblem has *no solution* — not because no one was clever enough to find the procedure, but because the procedure is provably *there*. The question itself has no "yes."

<figure>
	<img style="max-width: 100%; width: 100%; height: auto; display: block; margin: 0 auto;" src="turing_machine_2a.svg" alt="A Turing machine: states reading and writing symbols on a tape" />
	<figcaption class="md">A Turing machine: a finite set of states reading and writing symbols on an infinite tape, moving left or right. Public domain diagram (after Kleene).</figcaption>
</figure>
</div>

<div class="md">
## The payoff: the algorithm becomes an object

Step back, and the whole chapter is one turning point.

* For two millennia, people **ran** procedures — Euclid's gcd, the sieve — and never asked *what made them work*.
* One question — *is there a general method?* (the Entscheidungsproblem, 1928) — forced the procedure itself to become a **mathematical object** with checkable properties: *does it terminate? is it correct? what is it even able to reach?*
* Answering that question (Church, Turing, 1936) did not merely settle a logic puzzle. It **invented the theory of computation** — the study of *computation as a thing you can reason about*, not just a thing you do.

That is the "displaced prerequisite" this lesson is filling. Everything you will read later in [How Transformers Execute Algorithms](algorithms.php) and [Software](software.php) — the idea that a computation has a *cost*, a *guarantee*, and a *limit* — rests on the fact that, in 1936, the algorithm stopped being a verb and became a noun. You can now hold one in your hand and take it apart: ask whether it stops, prove whether it is right, and measure how much work it does. Euclid had the algorithm. Hilbert asked the question. Church and Turing built the machine that *is* the answer.

> A procedure becomes an **algorithm** when two things hold: it **terminates** for every input it promises to handle, and it is **correct by construction**. The question "is there a *general* procedure?" — the Entscheidungsproblem, 1928 — is what turned that property from a verb into an object, and forced the entire theory of computation to be built.
</div>

<script>
GCD = {
	run() {
		var a = parseInt(document.getElementById("gcd-a").value, 10);
		var b = parseInt(document.getElementById("gcd-b").value, 10);
		if (isNaN(a) || isNaN(b) || a < 1 || b < 1) {
			document.getElementById("gcd-result").textContent = "Enter two positive integers.";
			return;
		}
		var steps = [];
		var x = a, y = b, n = 0;
		while (y !== 0 && n < 100000) {
			var r = x % y;
			steps.push([x, y, r]);
			x = y;
			y = r;
			n++;
		}
		var cell = "padding:6px 10px; border:1px solid var(--mn-border); color:var(--mn-text); font-family:monospace; text-align:center;";
		var head = "padding:6px 10px; border:1px solid var(--mn-border); color:var(--mn-text-secondary); text-align:center; font-size:0.9em;";
		var html = "<tr><th style='" + head + "'>dividend (a)</th><th style='" + head + "'>divisor (b)</th><th style='" + head + "'>remainder</th></tr>";
		steps.forEach(function (s) {
			html += "<tr><td style='" + cell + "'>" + s[0] + "</td><td style='" + cell + "'>" + s[1] + "</td><td style='" + cell + "'>" + s[2] + "</td></tr>";
		});
		document.getElementById("gcd-steps").innerHTML = html;
		document.getElementById("gcd-result").textContent = "gcd(" + a + ", " + b + ") = " + x + "  ·  " + steps.length + " step" + (steps.length === 1 ? "" : "s") + "  ·  it stopped because the divisor reached 0.";
	}
};
(function () { GCD.run(); })();
</script>
