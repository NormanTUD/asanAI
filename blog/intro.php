<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: From Big Bang to ChatGPT: A Peek inside the Black Box
description: The big picture: what this course is about and how it connects human history to modern AI.
icon: &#127758;
part: 0
order: 0
color: accent
topics: history, philosophy, math-i, society
tags: interested-layman
-->

<div class="image-row md">
	<figure>
		<img src="cave_hands.jpg" alt="Hand stencils at Cueva de las Manos, Argentina" />
		<figcaption class="md">Hand stencils at \cite[Cueva de las Manos]{cuevadelasmanos_image}, Argentina (c. 7300 BC - 700 AD). Paint was sprayed through bone pipes onto hands pressed against the rock wall.</figcaption>
	</figure>
	<figure>
		<img src="image.php?f=FrankRosenblattWiringPerceptron.jpg&amp;ar-base=cave_hands.jpg" alt="Perceptron Wiring" />
		<figcaption class="md">\citetitle[Wiring the Perceptron (1958), the first artificial neural network with a formal learning rule]{perceptronimagewiring}</figcaption>
	</figure>
</div>

<div class="md">
Most discussions of Artificial Intelligence start with what the systems can do today — or with the jobs they might take. This one starts earlier: with the **intellectual history** and the specific technicalities that made these systems possible. It is a journey through the evolution of human thought, in which every technical milestone stays attached to the historical and philosophical soil it grew in.

## What This Course Is — and What It Isn't

**This is** a long, free, interactive digital textbook that traces the ideas behind modern AI from Stone Age tools and the history of mathematics all the way to how large language models actually work inside. It is hands-on and often mathematically demanding: you build intuition by doing, and by the end you understand the *why* and the *how*, not just the *what*.

**This is not** a programming tutorial (you will not set up a dev environment), a "5 quick tips" article or a list of prompting tricks, or a passive overview you can skim in one evening. If you are looking for a short, surface-level introduction, this is not it. If you want the real, complete picture — history, mathematics, and machines together — you are in the right place.

## A Synthesis of Science and History

To understand a Neural Network is to understand a tapestry of ideas that kept sidetracking into unexpected fields — and the tapestry is wide: its threads begin at the **Big Bang**, pass through the forging of the elements, the first cells, and the first numbers, and run on to the first looms and the first chips. The [Brief History of AI](history.php) traces the direct intellectual lineage; [The Untold History of AI](untold_history.php) collects the displaced prerequisites that made all of it physically possible. The most consequential sidetracks:

* **Astronomy and Precision:** Astronomers from the fourth century onward, mapping the stars with imperfect data, developed the very optimization tools that let modern LLMs learn from the internet.
* **The Technical and The Philosophical:** We do not just look at code. Concepts of logic, language, and "Geist" migrate from philosophical debates into billions of trainable parameters — and we follow them the whole way.
* **AI in Society:** We treat the technology as a cultural mirror, looking at how these systems meet human values, the risks of hallucinations, and the ethical responsibility of building intelligent tools.
</div>

<div class="md topic-block" data-optionaltitle="How numbers became tokens" data-depth="60">
* **The Number and the Token:** We follow the number itself — from the Babylonians' place value and the Indian zero, through the Chinese minus sign and Leibniz's binary, to the token vocabularies modern models actually read. The "token" a Transformer predicts is a direct descendant of the first numerals, and every integer in the code you write inherits the same chain.
</div>

<div class="md">
For most of the last century, the sciences and the humanities have drifted into two separate worlds whose methods, vocabulary, and values are largely opaque to each other — a split \cite[Charles Percy Snow (1959)]{twocultures} memorably named the "two cultures" problem. We believe reality is one, and different sciences are different ways of looking at the same world — so this course needs both ways of looking at it.

## An Interactive Playground

This is not a book to be read passively. It is a playground for exploration:

* **Learn by Doing:** Move the sliders, input your own data, click through the visualizations. Curiosity is the primary engine of learning here — try to see where the logic holds and where it breaks.
* **Navigating Complexity:** At times the mathematics gets heavy. You do not need to master every equation on the first pass: skip it, play with the interactive models, and return to the theory once the numbers have an intuitive feel.
* **Pick and Skip:** Use the *table of contents* to navigate and skip all sections that are of no interest to you.
* **The Atlas:** Every person, place, institution, author, and event named in this course is a dot on [The Atlas](atlas.php) — an interactive 3D globe you can zoom from Earth, past the Moon, all the way to the Big Bang.
* **The Starting Point:** We assume no prior knowledge beyond good English reading capability, the practical knowledge of a Stone Ager, and the willingness to put in effort. That said, the climb is steep: we start from nothing but quickly ascend into dense mathematics and complex architectures. You will not grasp everything on the first read, and that is fine. Use the interactive demos to build intuition, skip what feels too heavy, and come back later. Expect to re-read, tinker, and take your time.
</div>

<div class="md">
## A Course That Adapts to You

This course is too long to consume in one shape, so it adapts to **you**. Look for the <span class="interest-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg></span> button top-right and pick your *profile* (Curious / Student / Engineer / Researcher) and *level* (High School / Undergrad / Grad / PhD); each combination loads a curated topic set. **Math is split into Math I / II / III** and **Statistics into Stats I / II**, so a high-school reader is never shoved into graduate-level integrals. If you identify more with *being* a certain kind of reader than with what you do, the picker also offers the **classic types** — the mathematician who wants the math but not the history, the builder, the historian, the philosopher — and, if you refuse to skip anything, the **polymath**, who loads everything. You can also choose how *heavy* to go: **tone** dials mute the dense math, formal logic, linguistics, or code, and **interested layman** mode keeps only the accessible, jargon-free core.

The fastest start: pick the type you're most like, or open the detailed settings and tune every topic by hand:
</div>

<div data-topics-inline="personas-first" class="inline-topics"></div>

<div class="md">
Toggle individual topics to fine-tune (click several at once — it's pure set logic, and the page reacts live). The **tone** chips switch off whatever feels heavy in one click; sections that no longer match recede behind a soft banner that tells you *why*, partially-matching ones fade back but stay readable, and home-page tiles dim in step so you can always see what exists. Your choices are saved in a cookie and survive reloads.

## What You Will Achieve

By the time you reach the end of this journey, you will have moved from basic arithmetic to a deep technical understanding of modern Large Language Models. You will be able to:

* **Explain the inner workings** of Neural Networks, from the first Perceptron to the Transformer architectures that power ChatGPT.
* **Manipulate and optimize** data models using the same mathematical principles of probability and approximation used by researchers.
* **Critically evaluate** the societal and philosophical implications of AI, understanding both its technical brilliance and its inherent limitations.

You will see that AI is not a sudden magic invention, but the technical and philosophical culmination of centuries of human inquiry.

## Navigating the Ladder of Abstraction

To truly grasp the nature of Artificial Intelligence, we will move through various levels of abstraction, much like the framework described by \citeauthor{hayakawa} — and we will train ourselves to climb up and down this "ladder" fluently:

* **The Concrete Base:** At the lowest rungs we deal with the "process level" — the raw, physical bits of data and the specific numerical weights in a matrix.
* **The Intermediate Technicalities:** As we ascend, we group these specifics into functional concepts like Backpropagation or Gradient Descent — the tools that organize raw data into recognizable patterns.
* **The High-Level Abstract:** At the top of the ladder we reach broad terms like "Topology", "Fiber Bundles", "Intelligence", "Logic", and "Ethics". They let us discuss the impact of AI on society, and they stay grounded in the mathematical rungs beneath them.

This text is designed to carry you through those shifts: we constantly move from a philosophical "why" down to a mathematical "how", keeping even the most abstract concepts tied to concrete reality.

## Disclaimer

This interactive textbook was built with the help of Google Gemini, Claude, ChatGPT and other LLM systems. We've done our best to verify the code and info, but please double-check before using it in production.
</div>

<?php
	if(!isCli()) {
?>
<div class="md">
## Please report Errors!

Please report errors to <a href="mailto:<?php echo hide_email('norman.koch@tu-dresden.de'); ?>">my email</a>. I try my best to keep this site as factually correct as possible, but I may get things wrong or incomplete — so I am happy to get any feedback.
</div>
<?php
	}
?>
