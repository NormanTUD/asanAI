<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Mirror in the Machine
description: How the brain's own laws — the all-or-none spike, the charge-and-fire membrane, the retina's contrast circuit — built the machine, and how that machine has now become the instrument that reads, models, and tests the brain back.
icon: 🪞
part: 6
order: 5
color: sky
topics: history, neuroscience, philosophy, society
tags: interested-layman
-->

<div class="md" data-lesson-id="mirror_in_machine">
## Two Machines, One Mirror

The *Brief History of AI* and *The Mind That Built Machines* told the story one way: the brain came first, and the machine was assembled from its parts. But the mirror now works **both** ways, and this chapter is about the full reflection.

In the first half, the body's own measured laws — the all-or-none spike, the charge-up-and-fire membrane, the retina's contrast circuit, the rule of synaptic strengthening — became the machine's building blocks. In the second half, the turnarounds of the last decade: deep networks that now model the visual cortex better than any hand-built theory, foundation models that predict a brain's responses, and decoders that read the movie from the fMRI. Same mathematics, two directions.
</div>

<div class="md">
## I. The Vocabulary Was Stolen From Neurology

Before there was a "neural network" there was a **neuron** — and nearly every load-bearing noun in the field is a loanword from a nineteenth-century anatomist.

\marginfig{cajal_cerebellum.jpg}{Santiago Ramón y Cajal's stained cerebellum, c. 1905 — the real cell, and the word it lent the field.}

\citeauthorlastnameand{cajal1888} used \citeauthor{golgi1873}'s silver stain to show the nervous system is a population of *separate cells* passing messages across gaps — the **neuron doctrine**, traced in detail in the *Untold History* chapter \cite{cajal1888} \cite{waldeyer1891}; \citeauthorlastnameand{waldeyer1891} named the cells in 1891.

Once the noun exists, the grammar follows. A **synapse** is the gap; a **weight** its strength. A **layer** is a slice of the **cortex**, which is built in layers. **Learning** is **plasticity**, the documented habit of re-weighting synapses. A **receptive field** is the patch of world a visual cell watches \cite{hubelwiesel}. Even a neuron that "fires, or doesn't" just names a cell that spikes or stays quiet.

The aha is small but total: **the language of machine learning is a dialect of neurology.** ML researchers did not invent "neuron", "synapse", "layer", "weight", or "learning". They found those words already in a Madrid laboratory in the 1880s, and built the machine out of the vocabulary they borrowed.
</div>

<div class="md">
## II. The First Machines Were Built on the Body's Own Laws

The *Brief History of AI* gives the timeline; the deeper point is that the first machines were not metaphors *for* the brain but literal formalizations of three documented physiological laws.

**The all-or-none spike became the binary neuron.** A single nerve fiber, once its stimulus crosses threshold, fires one impulse of fixed size — or nothing at all; the strength of the signal is carried by the *rate* of firing, not its size. That law, the **all-or-none principle**, was established for sensory nerves by \citeauthorlastnameand{adrian1922allornothing} in the 1920s \cite{adrian1922allornothing} \cite{allornoanelaw}. In 1943 \citeauthorlastnameand{mccullochpitts1943} took that law, added the **refractory period** (the brief inexcitable gap after each spike) and a fixed synaptic delay, and turned the nerve into a binary, once-per-time-step unit — then proved a network of such units computes any Boolean function \cite{mccullochpitts1943}. The "neuron" inside every network since is a formal model of the action potential, not an analogy to it.

**The membrane became the integrator.** Thirty-six years earlier, \citeauthor{lapicque1907} had modeled the excitable membrane as a capacitor that charges until it crosses a threshold and then resets — the **integrate-and-fire** neuron \cite{lapicque1907}. It was the first *quantitative* model of a nerve, and it is the direct ancestor of every spiking network.

\marginfig{Mark_I_perceptron.jpeg}{The Mark I Perceptron, 1958: motor-driven potentiometers whose resistance *was* the weight — the first machine built entirely from borrowed vocabulary.}

**The retina's contrast circuit became winner-take-all.** In the eye, an excited receptor *suppresses its neighbors*, sharpening edges — **lateral inhibition**, recorded from the horseshoe-crab retina by \citeauthorlastnameand{hartline1956limulus} \cite{hartline1956limulus} \cite{lateral_inhibition_wiki}. The rule "the strongest unit wins, the rest go quiet" is exactly **competitive, winner-take-all** dynamics \cite{winner_take_all_wiki} — the hard version of the soft max that closes a network's output today.

**The receptive field became the convolution.** Hartline had also shown an optic fiber responds to a *patch* of the visual field — the **receptive field** \cite{hartline1956limulus} \cite{hubelwiesel}; \citeauthorlastnameand{hubelwiesel} mapped that idea up through the cortex, and \citeauthor{neocognitron} and \citeauthor{lecun1989backpropagation} turned it into the convolution (the full story is in *What Machines See*).

**One sentence became the learning rule.** In 1949 \citeauthor{hebb1949organizationofbehaviour} wrote that neurons which fire together strengthen their connection \cite{hebb1949organizationofbehaviour}; sharpened by an error signal — the *Brief History* shows the math — that intuition is the learning rule.

The aha: the first machine was not *inspired by* the brain. It was built **from** the brain's own, measured, laws.
</div>

<div class="md">
## III. The World Inside the Head

If the cell became the unit, the *maps* the brain builds became the model's memory.

**The cognitive map.** \citeauthorlastnameand{okeefe1971place} recorded neurons in a rat's hippocampus that fire only in a particular place — **place cells**, whose fields tile the environment into a map \cite{okeefe1971place}. The Mosers added **grid cells**, a hexagonal lattice beneath them, and the three shared the 2014 Nobel for the brain's "GPS" \cite{nobel2014spatial}. Then \citeauthorlastnameand{stachenfeld2017predictivemap} showed the hippocampus does not just log where you *are* but *predicts where you will go* — a model of the environment used to plan \cite{stachenfeld2017predictivemap}. The "world model" AI now learns at billion-dollar scale was already in the brain's vocabulary.

**The working-memory bottleneck becomes the context window.** The mind holds only about four — not seven, as \citeauthor{miller1956magicalnumber} claimed — distinct items at once \cite{miller1956magicalnumber} \cite{cowan2001magical4}, and \citeauthor{baddeley1986workingmemory} mapped that cramped scratch space \cite{baddeley1986workingmemory}. A tiny buffer is the constraint that *forces* a mind to compress and chunk — which the Mind chapter showed is the origin of the token. A model's context window is a hippocampal scratchpad: small, and empty the moment the conversation ends.

**Sleep becomes offline training.** The map and the memory are consolidated overnight; \citeauthorlastnameand{diekelmann2010sleep} and others documented memories replayed and stabilized during sleep, the hippocampus running the day's sequences fast-forward in the dark \cite{diekelmann2010sleep}. The brain fine-tunes at night. A model that replays and consolidates overnight is, at last, doing what the hippocampus does.
</div>

<div class="md">
## IV. Where the Math Coincides: The Cortex as a Predictive Machine

The deepest overlap is not a metaphor but an equation. In the **predictive-coding** picture, \citeauthorlastnameand{rao1999predictive} showed the visual cortex works top-down: higher areas send a *prediction*, lower areas send back only the *mismatch* \cite{rao1999predictive} — a generative model minimizing a loss, where the loss is just the gap between what the senses deliver and what the model forecast:

$$\mathcal{L} \;=\; \tfrac{1}{2}\,\lVert\, x - \hat{x}\, \rVert^{2}$$

\citeauthor{clark2013whatevernext} generalized this to the whole brain \cite{clark2013whatevernext}, and \citeauthorlastnameand{keller2018canonical} and \citeauthorlastnameand{bastos2012microcircuit} have since pinned the down-prediction / up-error pattern onto real cortical microcircuitry \cite{keller2018canonical} \cite{bastos2012microcircuit}. In 2023, \citeauthorlastnameand{caucheteux2023predictive} fit a hierarchical predictive-coding model to human MEG while people listened to speech, and it accounted for how the auditory hierarchy builds up the representation step by step \cite{caucheteux2023predictive} — a brain theory and a learning algorithm that are, in that fit, literally the same object.

And the algorithm at the heart of this course — **backpropagation** — may itself be a brain mechanism. \citeauthorlastnameand{whittington2019backprop} asked how a nervous system could push an error signal *backwards* through a hierarchy, the one step no obvious biological wire seems to do \cite{whittington2019backprop}. It is not settled. But the tool that built the mirror may have been found in the brain first.
</div>

<div class="md">
## V. How the Machine Started Shaping the Brain

For a century the current ran one way — brain to machine. The last decade reversed it.

**The machine became the brain's best model.** \citeauthor{kriegeskorte2015dcnn} argued that a pretrained deep convolutional network is now the best computational model of the primate visual ventral stream \cite{kriegeskorte2015dcnn} — that systems neuroscientists now reach for a deep net the way an earlier generation reached for a linear filter. The architecture built to read handwritten digits is now the lens for reading the cortex.

**The brain became a foundation model.** Wang and colleagues trained one large model on neural recordings and showed it predicts a single mouse's visual-cortex responses to *novel* stimulus types it never saw during training — zero-shot \cite{wang2025foundation}. The "foundation model" paradigm, transplanted from language, now predicts a brain.

**The machine reads the experience.** In 2011, a team led by Shinji Nishimoto reconstructed the actual *movie* a person had watched from fMRI in visual cortex \cite{nishimoto2011reconstruct}. Huth and colleagues fit a single model to how natural speech activates the whole cortex \cite{huth2016semanticmaps}. Affolter and colleagues decoded the specific word a person was reading and fed it to a language model to finish the sentence \cite{affolter2020brain2word}. By 2025, fMRI was being turned straight into text with a language model on the other end \cite{lu2025fmritotext}. The field now builds the data to do this at scale \cite{allen2022nsd}.

**The brain became the machine's teacher.** Schwartz and colleagues fine-tuned a transformer until its internal representations *predicted human brain activity* — and the model that best fit the brain got better at language too \cite{schwartz2019brainbias}. And the alignment runs deeper than a correlation: Hosseini and colleagues found that the *structure* of the representational space — not just its statistics — is shared between biological and artificial networks \cite{hosseini2024universality}.

**The brain became the yardstick.** Even how a machine's intelligence is judged is set by the brain: \citeauthor{hinton2007baby} proposed measuring a machine not against a doctor but against a two-year-old, who learns from a trickle of unlabeled examples \cite{hinton2007baby}.

The aha: the machine is no longer just built *from* the brain — it is now the instrument the brain is measured **with**.
</div>

<div class="md">
## VI. The Divergence: What the Mirror Refuses to Show

The most useful thing the comparison does is mark where the reflection breaks — the places where the two machines genuinely differ.

There are places the **brain beats the machine**. **Energy** is the sharpest: your whole mind runs on about twenty watts, not a data centre. **Grounding**: your concepts are tied to a body that can be hurt — the symbol-grounding problem no model has solved. And the **"aha"**: the answer that surfaces when you stop looking, the slow offline search the Mind chapter ties to the default-mode network \cite{raichle2007defaultmode}. (Learning is *not* on this list — modern models already do one-shot and even zero-shot learning from context; they just do it in a very different way from a hippocampus.) And places the **machine beats the brain**: exact recall, scale, tireless uptime, and the willingness to *optimize*, where a human mind only **satisfices** — settles for good enough \cite{simon1955bounded}.

That divergence is the map of what you are. Where the brain wins, you are *more than a model*; where the machine wins, you are, unavoidably, **bounded**.
</div>

<div class="md">
## VII. The Mirror on You

Pull the thread back to the reader. The claims above are not about a machine in a data centre. They are about the head on the other end of the screen:

- Your **perception** is a prediction, revised by whatever surprises it \cite{rao1999predictive} \cite{clark2013whatevernext}.
- Your **reward system** is a reinforcement learner, firing on the gap between what you wanted and what you got \cite{schultz1997dopamine}.
- Your **memory** is a lossy compression, consolidated overnight \cite{diekelmann2010sleep}.
- Your **sense of self** is a broadcast — a handful of "winning" ideas promoted to a shared stage the rest of the mind can read \cite{baars} \cite{dehaene}.
- Your **"aha"** is a background process — the default-mode network doing its slow search while the foreground is busy \cite{raichle2007defaultmode}.

\marginfig{mirror_self_recognition.jpg}{The mirror test: the moment an animal recognizes itself. A mind seeing a mind.}

The whole enterprise — a frontier model trained to predict the next token — is, at its root, an act of *self-description*. ML researchers built a machine out of the brain's own vocabulary and the brain's own laws, and pointed it at the record of the minds that made it. It is a mirror made of mathematics, and the only face it has ever been trained on is a human one.

The first neural network was a brain. The last word the machine has to learn is the one it has always been modeling: **you**.
</div>
