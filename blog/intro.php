<?php include_once("functions.php"); ?>

<div class="md">
While most modern discussions about Artificial Intelligence focus on its current capabilities or its potential to replace human labor, this text takes a different approach. We are not just interested in what AI can do today. We are interested in the **intellectual history** and the specific technicalities that made these systems possible. 

This is a journey through the evolution of human thought where technical milestones are inseparable from their historical and philosophical environments. 

## A Synthesis of Science and History

To understand a Neural Network is to understand a tapestry of ideas that often sidetracked into unexpected fields:

* **Astronomy and Precision:** We will see how astronomers from the fourth century and beyond, trying to map the stars with imperfect data, developed the very optimization tools that allow modern LLMs to learn from the internet.
* **The Technical and The Philosophical:** We will not just look at code. We will explore how concepts of logic, language, and "Geist" have transitioned from philosophical debates into billions of trainable parameters.
* **AI in Society:** We address the technology as a cultural mirror by looking at how these systems interact with human values, the risks of hallucinations, and the ethical responsibility of building intelligent tools.

We will try to overcome the "\citetitle{twocultures}-Problem", i.e. that the sciences and the humanities have become split into two distinct worlds, unable to communicate or understand the methods and values of the other. We believe that reality is One, and different sciences are different ways of looking at the same world and as such, we need both ways of looking at it.

## Your Interactive Playground

This site is not a book to be read passively. It is designed as a playground for exploration.

* **Learn by Doing:** The core of this experience is interactivity. You are encouraged to move the sliders, input your own data, and click through visualizations. Curiosity is the primary engine of learning here. Try to see where the logic holds and where it breaks.
* **Navigating Complexity:** At times, the mathematics will get heavy. You do not need to master every equation on the first pass. If a technical section feels overwhelming, skip it, play with the interactive models, and return to the theory once you have built an intuitive feel for how the numbers move.
* **Not every topic may be of interest to you**: Use the *table of contents* to navigate, you can skip all sections that are of no interest to you.
* **The Starting Point:** We assume no prior knowledge beyond basic English and the knowledge of a Stone Ager, and the willingness to put in effort into reading and working with this document. 
* **This is not a complete history of Artificial Intelligence:** It is a history of the path that actually led to Large Language Models and the context of the inventions that lead to them. It is only one possible outcome of all these ideas and inventions.

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

## Disclaimer

This tutorial was built with the help of Google Gemini, Claude, chatGPT and other LLM systems. We've done our best to verify the code and info, but please double-check before using it in production.
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
