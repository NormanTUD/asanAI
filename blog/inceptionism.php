<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Inceptionism: What the Network Sees
description: Turn the network around — tune the image instead of the weights, and watch neurons dream of bananas, dumbbells, and towers.
icon: &#128065;
part: 3
order: 7
color: accent
topics: architecture, generative, interpretability, history
-->

<div class="md">
## The Network Turned Upside Down

Everything so far trained a network by adjusting **weights** so that an input maps to a correct output. The original Inceptionism essay by \citeauthor{mordvintsev2015inceptionism} (\citeyear{mordvintsev2015inceptionism}) asks what happens if you **freeze the weights and adjust the input instead**: run gradient *ascent* on one class score, and the pixel values themselves start to echo whatever the network has stored about that class \cite{mordvintsev2015inceptionism}.

Start from pure noise, maximize the “banana” output, and the noise organizes into a banana — first a blurry, surreal one, then, zoomed in with feedback, an endless cascade of banana-things. The authors describe the mechanism in plainly human terms \cite{mordvintsev2015inceptionism}:

> …this can be thought of as essentially an “inception”-like process, where the network will produce a recurring signal … just as it is with children, who consider the clouds and see animals.

> “A child's mind sees objects in clouds — the network sees them in noise.”
</div>

<div class="md">
## Gradient Ascent on a Class

A classifier trained on ImageNet computes a score for each of ~22,000 classes. In forward mode the image is fixed and the network reads it; in dream mode the roles flip — a single random seed gradient-ascented on the “banana” channel. The same image can be optimized for *any* class or any region of it, and the network's layer depth decides the visual style: low layers produce edges, curves and simple strokes; high layers assemble **whole objects** from what they represent \cite{mordvintsev2015inceptionism}.
</div>

<div style="display:flex; gap:16px; flex-wrap:wrap; justify-content:center; margin:16px 0;">
	<figure style="margin:0; flex:1 1 300px; max-width:440px; background:var(--mn-surface, #f8fafc); padding:14px; border-radius:12px; border:1px solid var(--mn-border, #e2e8f0);">
		<img src="noise_to_banana.png" style="width:100%; border-radius:6px;" alt="Random noise gradually transforming into a banana as the network is gradient-descented toward that class" />
		<figcaption style="font-size:0.8rem; margin-top:8px; color:var(--mn-text-secondary, #64748b);">Left: random noise. Right: the same pixels after maximizing the “banana” class — the noise *learns* to be a banana.</figcaption>
	</figure>
	<figure style="margin:0; flex:1 1 300px; max-width:440px; background:var(--mn-surface, #f8fafc); padding:14px; border-radius:12px; border:1px solid var(--mn-border, #e2e8f0);">
		<img src="inceptionism_classvis.png" style="width:100%; border-radius:6px;" alt="A grid of class visualizations: rows ordered by how strongly the network recognizes each class, showing surreal multi-object compositions" />
		<figcaption style="font-size:0.8rem; margin-top:8px; color:var(--mn-text-secondary, #64748b);">Row after row of class visualizations — surreally colorful, because the network draws each class with its whole learned world. \cite[Figures: original Inceptionism essay, CC BY 4.0]{mordvintsev2015inceptionism}</figcaption>
	</figure>
</div>

<div class="md">
## Let the Network Choose: Layer by Layer

Instead of prescribing a class, feed the network a photo and ask it to *enhance whatever it detected* — “whatever you see there, I want more of it”. The chosen layer then sets the whole visual vocabulary: \citeauthor{mordvintsev2015inceptionism} note that the first layers are sensitive to basic features, edges and their orientations, so they over-interpret the input as strokes and simple ornament-like patterns, while high layers assemble these into complete objects \cite{mordvintsev2015inceptionism}.
</div>

<figure style="background:var(--mn-surface, #f8fafc); padding:16px; border-radius:12px; border:1px solid var(--mn-border, #e2e8f0); margin:16px 0; max-width:680px; margin-left:auto; margin-right:auto;">
	<img src="inceptionism_ibis.png" style="width:100%; border-radius:6px;" alt="A photo of addax antelopes next to a deep-dream rendering where a lower network layer over-interprets the scene as colorful strokes and ornament-like patterns" />
	<figcaption style="font-size:0.8rem; margin-top:8px; color:var(--mn-text-secondary, #64748b); text-align:center;">Left: photo of grazing addax antelopes (original photo by Zachi Evenor). Right: the same pixels over-interpreted by a *low* layer — strokes and ornaments, not animals — processed by Günther Noack. \cite[Composite from the original Inceptionism essay, CC BY 4.0]{mordvintsev2015inceptionism}</figcaption>
</figure>

<div class="md">
## Dream Logic: The Weightlifter's Dumbbells

The funniest artifact of the process is that the dreams obey the network's *natural environment*. Asked to dream a dumbbell, the network repeatedly produced pictures of a **weightlifter holding one up** — not because the weights encode a dumbbell standing alone, but because, in the training world, dumbbells practically never appear without a person \cite{mordvintsev2015inceptionism}. The dream exposes the training distribution's hidden scenery.

\marginfig{inceptionism_dumbbells.png}{The network's dumbbell dream: a dumbbell *and* a weightlifter holding it — "dumbbells don't usually appear without people holding them" \cite{mordvintsev2015inceptionism}. \cite[Figure: original Inceptionism essay, CC BY 4.0]{mordvintsev2015inceptionism}}

The same effect recurs everywhere: clouds swirled into **birds**, rocks rebuilt as **towers and pagodas**, leaves peppered with **animals**, even a **duck-billed platypus** appearing in a portrait's armpit. Each is a feedback loop — *recognize, amplify, repeat* — until the network's own expectation takes over. This is **engineered pareidolia**, the machine counterpart of the face in the [Jupiter photograph](hallucinations.php) or in everyday household objects: our visual system and a convolutional net both **project trained patterns onto ambiguous input**.
</div>

<div style="display:flex; gap:16px; flex-wrap:wrap; justify-content:center; margin:16px 0;">
	<figure style="margin:0; flex:1 1 300px; max-width:440px; background:var(--mn-surface, #f8fafc); padding:14px; border-radius:12px; border:1px solid var(--mn-border, #e2e8f0);">
		<img src="inceptionism_sky_arrow.png" style="width:100%; border-radius:6px;" alt="A blue sky with clouds next to a deep-dream rendering that turns the cloud shapes into swirling animal-like forms" />
		<figcaption style="font-size:0.8rem; margin-top:8px; color:var(--mn-text-secondary, #64748b);">“If a cloud looks a little bit like a bird, the network will make it look more like a bird” — repeat the loop and a detailed *bird* emerges from the sky. \cite[Figure: original Inceptionism essay, CC BY 4.0]{mordvintsev2015inceptionism}</figcaption>
	</figure>
	<figure style="margin:0; flex:1 1 300px; max-width:440px; background:var(--mn-surface, #f8fafc); padding:14px; border-radius:12px; border:1px solid var(--mn-border, #e2e8f0);">
		<img src="inceptionism_funny_animals.png" style="width:100%; border-radius:6px;" alt="Four deep-dream panels showing hybrid animals named Admiral Dog, Pig-Snail, Camel-Bird, and Dog-Fish" />
		<figcaption style="font-size:0.8rem; margin-top:8px; color:var(--mn-text-secondary, #64748b);">Trained mostly on animals, the network reads the world as animals — but the concepts are so abstract that its dreams are *remixes*: Admiral Dog, Pig-Snail, Camel-Bird, Dog-Fish. \cite[Figure: original Inceptionism essay, CC BY 4.0]{mordvintsev2015inceptionism}</figcaption>
	</figure>
</div>

<div class="md">
The over-interpretation is deliberate and childlike — the essay's own words \cite{mordvintsev2015inceptionism}:

> …even a relatively simple neural network can be used to over-interpret an image, just like as children we enjoyed watching clouds and interpreting the random shapes.

But because the data is stored at such a high abstraction, the results are an interesting remix of these learned features — neither faithful reproductions nor noise, but the network's own hybrids.

## The Dream Map

An especially revealing variant: instead of starting from noise, start from a real photo. Editing it by gradient ascent shows *where* the network already had opinions — \citeauthor{mordvintsev2015inceptionism} call the visualization a **dream map**, showing which regions the network "understood" as what:
</div>

<figure style="background:var(--mn-surface, #f8fafc); padding:16px; border-radius:12px; border:1px solid var(--mn-border, #e2e8f0); margin:16px 0; max-width:680px; margin-left:auto; margin-right:auto;">
	<img src="inceptionism_dream_map.png" style="width:100%; border-radius:6px;" alt="A dream map: a transformed photograph annotated with the object labels the network assigns to different regions of the image" />
	<figcaption style="font-size:0.8rem; margin-top:8px; color:var(--mn-text-secondary, #64748b); text-align:center;">Above, a network's own interpretation of a photo, annotated with the labels it perceives: “tower-like” and “animal-like” regions are precisely where the dream edit later mutates them. \cite[Figure: original Inceptionism essay, CC BY 4.0]{mordvintsev2015inceptionism}</figcaption>
</figure>

<div class="md">
## Fractal Dreams

Zoom the dream into a pattern and run the loop again — the process never settles. Each new pattern is parsed by the network and amplified into new objects, which themselves re-enter the loop: towers sprout from rocks, birds spiral from clouds, and every iteration of the zoom yields *more intricate* structure. In the post's own, now-famous formulation \cite{mordvintsev2015inceptionism}:

> Because of the fractal-like feedback, zooming in on a group of pixels yields an endless stream of new patterns, details, and objects — often whole new worlds.

## A Tool, Not a Mirror

The essay ends on a refreshing note. The authors are explicit that these images are **not** a faithful picture of what the network “knows”, but rather *petri dishes for the network's errors and biases* — the weightlifter is exactly the kind of hallucination that leaks training-distribution priors. And they unashamedly welcome the artistic use: neural networks as an instrument, alongside the [perceptual style transfer](computer_vision.php) toolchain, for painters and photographers \cite{mordvintsev2015inceptionism}.

> Maybe today it is a little artificial and blurry, but the neural network then is a tool for artists — and what the network sees, *you* can learn to see: the next time a cloud looks like a face, remember the network that would agree.

*All images on this page come from the original blog post and are licensed by **Google Inc.** under a [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/), except for the MIT Places-database images, which are not used here.*
</div>