<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: From Stone Age Tools to ChatGPT: Beyond the Black Box
description: The big picture: what this course is about and how it connects human history to modern AI.
icon: &#127758;
part: 0
order: 0
color: accent
topics: history, philosophy, math, society
-->

<div class="image-row md">
	<figure>
		<img src="cave_hands.jpg" alt="Hand stencils at Cueva de las Manos, Argentina" />
		<figcaption class="md">Hand stencils at \cite[Cueva de las Manos]{cuevadelasmanos_image}, Argentina (c. 7300 BC - 700 AD). Paint was sprayed through bone pipes onto hands pressed against the rock wall.</figcaption>
	</figure>
	<figure>
		<img src="FrankRosenblattWiringPerceptron.jpg" alt="Perceptron Wiring" />
		<figcaption class="md">\citetitle[Wiring the Perceptron (1958), the first artificial neural network with a formal learning rule]{perceptronimagewiring}</figcaption>
	</figure>
</div>

<div class="md">
While most modern discussions about Artificial Intelligence focus on its current capabilities or its potential to replace human labor, this text takes a different approach. We are not just interested in what AI can do today. We are interested in the **intellectual history** and the specific technicalities that made these systems possible.

This is a journey through the evolution of human thought where technical milestones are inseparable from their historical and philosophical environments.

## A Synthesis of Science and History

To understand a Neural Network is to understand a tapestry of ideas that often sidetracked into unexpected fields:

* **Astronomy and Precision:** We will see how astronomers from the fourth century and beyond, trying to map the stars with imperfect data, developed the very optimization tools that allow modern LLMs to learn from the internet.
* **The Technical and The Philosophical:** We will not just look at code. We will explore how concepts of logic, language, and "Geist" have transitioned from philosophical debates into billions of trainable parameters.
* **AI in Society:** We address the technology as a cultural mirror by looking at how these systems interact with human values, the risks of hallucinations, and the ethical responsibility of building intelligent tools.

We will try to overcome the "\citetitle{twocultures}-Problem", i.e. that the sciences and the humanities have become split into two distinct worlds, unable to communicate or understand the methods and values of the other. We believe that reality is One, and different sciences are different ways of looking at the same world and as such, we need both ways of looking at it.

## An Interactive Playground

This site is not a book to be read passively. It is designed as a playground for exploration.

* **Learn by Doing:** The core of this experience is interactivity. You are encouraged to move the sliders, input your own data, and click through visualizations. Curiosity is the primary engine of learning here. Try to see where the logic holds and where it breaks.
* **Navigating Complexity:** At times, the mathematics will get heavy. You do not need to master every equation on the first pass. If a technical section feels overwhelming, skip it, play with the interactive models, and return to the theory once you have built an intuitive feel for how the numbers move.
* **Not every topic may be of interest to you**: Use the *table of contents* to navigate, you can skip all sections that are of no interest to you.
* **The Starting Point:** We assume no prior knowledge beyond good English reading capability and the practical knowledge of a Stone Ager, and the willingness to put in effort into reading and working with this document. That said, the climb is steep: we start from nothing but quickly ascend into dense mathematics and complex architectures. You will not grasp everything on the first read — and that is fine. Use the interactive demos to build intuition, skip sections that feel too heavy, and come back later. Expect to re-read, tinker, and take your time.

## Pick Your Interests — A Course That Adapts to You

Not every topic sparks the same curiosity for everyone. Some readers live for the equations. Others want the philosophical questions. Others want the hardware details. Others just want to know how to talk to ChatGPT well. This course is too long to consume in one shape, so it adapts to **you**.

Look at the top-right corner of the page — next to the **dark-mode toggle** you'll find a small 🎯 button. Click it to open the **interest picker**:

* **Toggle a topic** and the rest of the site quietly rearranges itself: sections you don't care about get tucked behind a soft "skipped" banner instead of vanishing, so you can still see they exist (and click once to peek if curiosity strikes).
* **Your choices are saved in a cookie** — they survive reloads and travel with you between pages. No account, no signup.
* **It's playful on purpose.** There are presets like *Show Everything*, *Just Essentials* and a 🎲 *Surprise Me* button that picks a random subset to start with — a way to discover corners of the course you didn't know you'd enjoy.

Below is your current pick. Tap any pill to flip it on or off:

<div data-topics-inline class="inline-topics"></div>

A few things worth knowing:

* **Nothing is gone for good.** Skipped sections show a banner like *“Math section skipped”* with a single-click *Peek anyway* button. So you can stay focused without losing the road map of what the course covers.
* **The course tiles on the home page react, too.** Tiles for topics you've muted gently fade back, marked *“saved for later”*. They're still one click away if you change your mind.
* **You can change your mind any time.** There is no score, no penalty. The picker is a dial, not a quiz.

Use it as much or as little as you like. Some readers will ignore it and read straight through. Others will turn off everything except *History* and *Philosophy*. Both are completely valid paths through the material.

## What You Will Achieve

By the time you reach the end of this journey, you will have moved from basic arithmetic to a deep technical understanding of modern Large Language Models. You will be able to:

* **Explain the inner workings** of Neural Networks, from simple Perceptrons to the complex Transformer architectures that power ChatGPT.
* **Manipulate and optimize** data models using the same mathematical principles of probability and approximation used by researchers.
* **Critically evaluate** the societal and philosophical implications of AI, understanding both its technical brilliance and its inherent limitations.

You will see that AI is not a sudden magic invention, but the technical and philosophical culmination of centuries of human inquiry.

## Navigating the Ladder of Abstraction

To truly grasp the nature of Artificial Intelligence, we will move through various levels of abstraction, much like the framework described by \citeauthor{hayakawa}. Understanding these systems requires the ability to climb up and down this "ladder" fluently:

- **The Concrete Base**: At the lowest rungs, we deal with the "process level", the raw, physical bits of data and the specific numerical weights in a matrix.
- **The Intermediate Technicalities**: As we ascend, we group these specifics into functional concepts like Backpropagation or Gradient Descent. These are the tools that organize raw data into recognizable patterns.
- **The High-Level Abstract**: At the top of the ladder, we reach broad terms like "Topology", "Fiber Bundles", "Intelligence," "Logic," and "Ethics." While these allow us to discuss the impact of AI on society, they remain grounded in the mathematical rungs beneath them.

This text is designed to help you navigate these shifts. We will constantly move from a philosophical "why" down to a mathematical "how," ensuring that the most abstract concepts remain tied to concrete reality.

## A Note on the Authors' Bias

[[t:philosophy]]
We authors have a soft spot for the *Two Cultures* conversation. We believe that to understand AI well, you need a foot in the mathematics, a foot in the humanities, and a willingness to wade through history. This is unusual — most courses of this size are pure engineering or pure philosophy. We picked the harder middle path because we think the most interesting questions live there. If you mute the Philosophy topic, you won't lose the technical material; you'll just lose the occasional nudge to *think about what it all means*.
[[/t]]

[[t:math]]
If you mute Math, you'll see that a lot of the interactive sliders and live demos still work — they're designed to give you intuition even when the equations are hidden. Look at the picture, move the slider, *feel* the shape of the curve. That's the part most readers keep, even when the symbols themselves get tucked away.
[[/t]]

[[t:history]]
If History isn't your thing, you'll still get the technical ladder. But you'll miss the long, strange arc from Ishango bones to attention heads — which, in our opinion, is the most poetic part of the whole story. Skim it later when you have an evening to spare.
[[/t]]

[[t:ethics]]
If you mute Ethics, you'll skip the chapters on hallucinations, alignment, and societal impact. Those are increasingly the chapters the working world reads first. Consider leaving them on even if you don't think of yourself as a "philosophy person" — they're closer to *engineering risk* than to armchair speculation.
[[/t]]

[[t:hardware]]
Muting Hardware is the right move if you mainly want to *use* AI rather than run it. You'll skip GPU lore, inference optimization, and running models locally. The rest of the course doesn't lean on those sections.
[[/t]]

## Disclaimer

This tutorial was built with the help of Google Gemini, Claude, ChatGPT and other LLM systems. We've done our best to verify the code and info, but please double-check before using it in production.
</div>

<?php
	if(!isCli()) {
?>
<div class="md">
## Please report Errors!

Please report errors to <a href="mailto:<?php echo hide_email('norman.koch@tu-dresden.de'); ?>">my email</a>. I try my best to keep this site as factually correct as possible, but I may get things wrong or incomplete, and thus am happy to get any feedback.
</div>
<?php
	}
?>
