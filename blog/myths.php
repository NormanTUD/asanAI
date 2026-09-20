<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Common Myths and Misconceptions About AI
description: What people actually believe about AI, where each belief came from, and the true core that survives under it.
icon: &#128302;
part: 6
order: 12
color: coral
topics: philosophy, society, ethics, language
-->

<div class="md">
## Folklore

Every powerful technology grows a folklore before we understand it, and AI is no exception. The beliefs are not random: they have *origins* — a paper, a film, a press cycle — and almost all of them latch onto a **true core** that the story distorts. A legend-researcher does not merely debunk; they trace where a tale was born and what real thing it attached to. This page does that for eight persistent myths.

Start with a warning about *us*. People systematically overestimate how well they understand how things work, from a zip lock to a traffic light \cite[Rozenblit & Keil, 2002]{rozenblit2002ioed}, and the bias bites hardest on causal "how does it work" knowledge \cite[the illusion of explanatory depth]{ioed_wiki}. AI triggers the same trap: the mechanism sounds simple — "it just predicts the next word" — which *feels* like understanding, right up until you are asked to actually explain it.

\marginfig{flammarion.jpg}{Flammarion's 1888 print shows a militiaman who, the story goes, kept pointing at the sun and died believing he had reached heaven. He was not wrong about the *direction* of his model — only about the map. Most of our "obvious" beliefs about AI work the same way: the gesture points somewhere real, the map is invented.}

The surveys say the pattern is stable and widespread. In the *AI Index*'s public-perception polling, most respondents expect more benefit than harm — while job losses, and for a substantial minority an existential risk, rank among their leading concerns \cite[the AI Index]{aiindex2025}. Optimism and dread coexist in the same person, which is exactly what a folklore looks like from the inside.
</div>

<div class="md">
## 1. "It understands"

People talk to LLMs as if the model *gets* what they mean, the way a colleague does. The debate has a name, the *Stochastic Parrots* paper: Bender and colleagues argued that fluent text generation is not, by itself, evidence of a model of the world \cite[Bender et al., 2021]{bender2021stochasticparrots}. The philosophical version is older — Searle's **Chinese Room** shows a system can manipulate symbols perfectly and still grasp none of them \cite[Searle, 1980]{searle1980chineseroom}.

So the literal claim — the model *understands* in the human sense — is unsupported. But the myth is *almost right*, which is what makes it dangerous. The model really does form a structured, geometric internal representation of its input \cite[Olah, 2014]{olah2014manifolds}; it is genuinely *about* the things it processes. The true core is not "it understands like us" but the harder fact underneath: there is a real, *functional* notion of content sitting between "meaningless parrot" and "a mind," and "understanding" is the wrong word for both ends of it.
</div>

<div class="md">
## 2. "If it passes the test, it thinks"

\marginfig{turing.jpg}{Alan Turing, 1950. He proposed a *pragmatic test*, not a *definition* of mind — and the conflation of the two is the seed of this myth.}

The **Turing Test** is routinely read as: *fool a human and you think*. That reading is wrong on the record. Turing proposed the "Imitation Game" as a way to dodge the question "can machines think?" — which he called too meaningless to discuss \cite[Turing, 1950]{turing1950computing}:

> I believe that at the end of the century the use of words and general educated opinion will have altered so much that one will be able to speak of machines thinking without expecting to be contradicted.
> — \citeauthor{turing1950computing} (\citeyear{turing1950computing})

The Stanford Encyclopedia makes the distinction sharply: the test is a *behavioral, statistical* criterion, not a logically sufficient condition for a mind, and the one-off "passes" (a program fooling 33% of judges in 2014) are not the test at all \cite[SEP, The Turing Test]{septruringtest}. The true core the conflation hides is that intelligence is a *spectrum of useful competencies*, not a binary "thinks / doesn't" — the test was never meant to settle the question it is famous for.
</div>

<div class="md">
## 3. "It is conscious — or nearly"

The next myth adds a little feeling: the assistant is *almost* alive, it *wants* things, it might even *suffer*. This is the strongest pull in the folklore, because a fluent interlocutor is exactly the kind of thing we evolved to read a mind into.

There is no evidence that present systems have *phenomenal* experience, and the "argument from consciousness" cuts both ways: it can be read as a claim that no digital system *could* feel, or merely that we have no way to tell \cite[SEP, The Turing Test]{septruringtest}. The true core is the genuinely unsolved question the myth points at — the **hard problem** of why any organization of matter gives rise to experience at all. The myth is wrong to assume our machines already cross that line; it is, in the rare case, right to point at a line nobody has yet drawn.
</div>

<div class="md">
## 4. "It will become god — the singularity is coming"

The word *singularity* is Vinge's coinage for the point at which technical self-improvement outruns our ability to predict it \cite[Vinge, 1993]{vinge1993singularity}; Kurzweil turned it into a pop-book and, in public imagination, into a date \cite[Kurzweil, 2005]{kurzweil2005singularity}. The dread underneath is not new — it is the old "the machine turns on us" story with a faster clock \cite[Bostrom, 2003]{bostrom2003ethical}.

The literal claim — an intelligence explosion is *inevitable* and on a countdown — has no identified mechanism behind it: no demonstrated path by which a system *autonomously* rewrites its own cognition into superintelligence \cite[Bostrom, 2014]{bostrom2014superintelligence}. But the myth latches onto something real. Bostrom's **orthogonality thesis** says a system's *capability* is independent of its *goal* \cite[Bostrom, 2012]{bostrom2012orthogonal}, and **instrumental convergence** says nearly any goal makes self-preservation and resource-acquisition *instrumental* subgoals \cite[Bostrom, 2003]{bostrom2003ethical}. The genuine kernel is not "a robot with a will" but a **goal-design** problem: a capable *optimizer* with a slightly mis-specified objective is dangerous without needing a mind, a motive, or a god-complex.
</div>

<div class="md">
## 5. "It will take all our jobs"

The labor myth is the oldest here — the Luddites with a better press kit — and its modern form is *The Second Machine Age* \cite[Brynjolfsson & McAfee, 2014]{brynjolfsson2014secondmachine}. In polling it is also the most concrete fear: expected job losses sit among the public's leading AI concerns \cite[the AI Index]{aiindex2025}.

The empirical record undercuts the doomsday version. Across a century of automation, technology has *transformed* work and created new categories of it rather than producing durable mass unemployment; the honest claim is uneven *displacement*, not the *extinction* of work \cite[Brynjolfsson & McAfee, 2014]{brynjolfsson2014secondmachine}. The true core is the distinction the myth collapses: **tasks** are automatable, and that displacement is real and uneven. The leap from "some tasks vanish" to "no one works" is the part with no evidence behind it.
</div>

<div class="md">
## 6. "It's *just* statistics — a fancy lookup table"

The mirror-image myth strips away the magic the other way: no real intelligence, only "big multiplication" and "a search over a database." It feels rigorous, because it is *almost* a true description.

The counter-lesson is Sutton's **Bitter Lesson**: across the history of the field, the methods that ultimately win are the *general, computation-hungry* ones, not the hand-crafted "intelligence" \cite[Sutton, 2019]{sutton2019bitterlesson}. So "it's just brute force" is nearly right — and the nearly-right part is the surprise. The true core is that *general optimization with the right objective subsumes human ingenuity*, which is exactly why the "mere brute force" framing misleads: it mistakes "we do not yet know how it works" for "nothing real is happening." This myth and Myth 1 are the same error seen from opposite sides — both assume the only interesting intelligence is the kind we can already name.
</div>

<div class="md">
## 7. "We're basically there"

The over-optimist is the doom-monger's twin: both agree we are *close*, they only disagree about the sign.

The reason "human-level" is the wrong milestone is **Moravec's paradox**: the things that are *hard* for us (abstraction, arithmetic, planning) are comparatively *easy* for machines, while the things that are *easy* for us (perception, walking, common sense) are the hard ones \cite[Moravec, 1988]{moravec1988paradox}. A benchmark that looks almost-solved can still be a mile from *general* competence, and a system that looks primitive can already be trivially past us on some axes. The true core is that *general* intelligence is hard for a specific, non-obvious reason: the axis that looks easy is the one that is expensive. "We're basically there" quietly measures progress on the *easy* axis and reports it as progress on the *hard* one.
</div>

<div class="md">
## 8. "The algorithm is neutral"

\marginfig{justitia_statue.jpg}{Justitia, blindfolded. The myth hands the blindfold to the model and calls the result objectivity; the blindfold is doing the work, not the algorithm.}

The fairness myth is the most consequential, because it sounds like an *ethical virtue*: let the *algorithm* decide, not a biased human. But an objective *function* is a **choice of values**, and the training data is a historical record that already carries its own biases, which the model can inherit and amplify \cite[algorithmic fairness]{algofairness_wiki}. "Neutral" is not a default state a system falls into; it is a property you have to build, and usually do not.

The true core is the useful half of the myth: the same machinery that *encodes* a disparity can *measure* and *audit* it. The error is not that we automated a judgment — that is sometimes a good thing — but that we stopped asking *whose* judgment, and on *whose* data.
</div>

<div class="md">
## The method

Strip each myth and the same shape remains: a folk model that points at something real, latched onto a single famous origin, with a true core that is *harder* than the model implies. The myth is the map; the true core is the territory the map was trying, badly, to draw. The skill is not to laugh at the map, but to notice the coastline it was reaching for.
</div>
