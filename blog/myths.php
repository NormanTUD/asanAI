<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Common Myths and Misconceptions About AI
description: Why people believe what they believe about AI — the origin, the record, and the true core under each myth.
icon: &#128302;
part: 6
order: 12
color: coral
topics: philosophy, society, ethics, language
-->

<div class="md">
## The habit, not the machine

This page is less about what AI *is* than about what we do when we meet a powerful tool we cannot see inside. Every such tool has been met with the same small cast of stories: it is alive, it is a god, it is a threat, it is neutral, it is magic, or it is nothing. AI is the latest version of each. A legend-researcher's job is to find where a story was born and what real thing it attached to — so that is what follows.

Start with a warning about *us*, because the beliefs come from us. People systematically overestimate how well they understand how things work, from a zipper to a traffic light \cite[Rozenblit & Keil, 2002]{rozenblit2002ioed}, and the bias is strongest for causal "how does it work" knowledge \cite[the illusion of explanatory depth]{ioed_wiki}. When a tool is opaque, we close the gap with the oldest explanations we have: *mind* and *intent*. The strongest evidence that this is a stable human trait, not a new AI quirk, is that we already caught ourselves doing it in 1966 — Weizenbaum's rudimentary chatbot ELIZA led users to ascribe understanding and feeling to a program that had neither, even when they knew it had neither \cite[the ELIZA effect]{weizenbaum1966eliza}.

\marginfig{flammarion.jpg}{Flammarion's 1888 print of a militiaman pointing at the sun. The story is that he died believing he had reached heaven — not wrong about the direction of his model, only about the map. Most of our "obvious" beliefs about AI work the same way: the gesture points somewhere real, and the map is supplied by us.}

Polling backs the picture up. In the *AI Index*'s public-perception surveys, a majority expect more benefit than harm, while job losses — and for a large share, an existential risk — rank among the leading concerns \cite[the AI Index]{aiindex2025}. In the same respondents, the hope and the dread sit together.
</div>

<div class="md">
## 1. "It is alive"

We talk to the assistant like a colleague; some now worry it might *suffer*. The belief is the oldest in the set. Weizenbaum's **ELIZA** in 1966 showed people reading a mind into a bag of string-matching rules, and the tendency has a name — the **ELIZA effect** \cite[the ELIZA effect]{weizenbaum1966eliza}.

There is no evidence that current systems have *phenomenal* experience. But the belief is a mirror, not a mistake about the machine: the "aliveness" is a projection, and the reason it is so easy to make is that we evolved to read a mind into fluent, responsive behavior. The question the myth really raises is about *us* — how readily we mistake a good imitation of company for company.
</div>

<div class="md">
## 2. "It talks like us, so it thinks like us"

\marginfig{turing.jpg}{Alan Turing, 1950. He proposed a *pragmatic* test, not a *definition* of mind — and the conflation of the two is what the myth runs on.}

The **Turing Test** is usually read as: *fool a human and you think*. That is not what it was. Turing offered the "Imitation Game" as a way to sidestep the question "can machines think?", which he called too meaningless to discuss \cite[Turing, 1950]{turing1950computing}. It is a *behavioral, statistical* criterion for competent conversation, not a logically sufficient condition for a mind; the one-off "passes" (a program fooling 33% of judges in 2014) are not the test at all \cite[SEP, The Turing Test]{septruringtest}.

The true core the conflation hides is that "does it think?" is a question about *mind*, not machine: it asks where we would draw the line that locates *our own* minds in *other* minds. We have never been very good at that, with or without silicon.
</div>

<div class="md">
## 3. "The brain is a computer — so a computer can think"

\marginfig{cajal_cerebellum.jpg}{Santiago Ramón y Cajal's stained neurons, c. 1910. The real brain, and the metaphor we built on it.}

Because the machine "learns" and "processes information," it is easy to assume it is doing what our brain does — a hardware version of the same thing. The premise is old and load-bearing: the **computational theory of mind** holds that thinking *is* computation, so a machine that computes can, in principle, have a mind \cite[the computational theory of mind]{computational_theory_of_mind}.

Brains and artificial networks are in fact deeply different — there is no backpropagation in the brain, no explicit weight table, no training set. The true core is that the metaphor is *generative* (it built the whole field) and *misleading* at once: it is why we assume understanding and consciousness ride along for free with "processing." The real, humbler connection is that both are *information-processing* — which is a lot less, and a lot more, than "the same thing."
</div>

<div class="md">
## 4. "It will outgrow us — the singularity"

The belief: the machine will become a god, or at least take over. The modern labels are Vinge's *technological singularity* and Kurzweil's countdown \cite[Vinge, 1993]{vinge1993singularity} \cite[Kurzweil, 2005]{kurzweil2005singularity}. But the *shape* of the story is much older — it is the **Golem**: the created thing that slips past its maker's control \cite[the Golem legend]{golem_wiki}.

There is no demonstrated mechanism by which a system *autonomously* rewrites its own cognition into superintelligence \cite[Bostrom, 2014]{bostrom2014superintelligence}. The genuine, defensible kernel is not a monster with a will but a **goal-design** problem: a capable *optimizer* with a slightly mis-specified objective is dangerous without needing a motive or a god-complex \cite[Bostrom, 2012]{bostrom2012orthogonal}. The myth supplies the Golem; the engineering supplies the real worry.
</div>

<div class="md">
## 5. "It will take all our jobs"

The belief: robots and mass unemployment. It is the oldest labor panic in the set, and it is also a myth about a myth. The **Luddites** of 1811 are usually told as people smashing machines out of fear of technology; in fact they were skilled weavers protesting wages and the quality of work — the machines were not the target, the *terms* were \cite[the Luddites]{luddite_wiki}.

The record undercuts the doomsday version. Across a century of automation, technology has *transformed* work and created new categories of it rather than producing durable mass unemployment; the honest claim is uneven, task-level *displacement*, not the extinction of work \cite[Brynjolfsson & McAfee, 2014]{brynjolfsson2014secondmachine}. The true core: "this machine ends all work" has been said of the loom, the power loom, and the spreadsheet, and each time it was wrong in the aggregate and right in specific, painful pockets.
</div>

<div class="md">
## 6. "It's magic — or it's nothing"

Two beliefs that cancel each other but are the same error. One says the machine is a miracle we cannot explain; the other says it is "just statistics" and "a fancy lookup table." The shared assumption is that a mechanism we cannot *picture* must be either a soul or a triviality — an **illusion of explanatory depth** running in both directions \cite[the illusion of explanatory depth]{ioed_wiki} \cite[Rozenblit & Keil, 2002]{rozenblit2002ioed}.

The system is real, structured, *and* not yet fully explainable — all three at once. The "just brute force" pole is nearly right, and that near-rightness is the surprise: the methods that win are the general, computation-hungry ones, not hand-built cleverness \cite[Sutton, 2019]{sutton2019bitterlesson}. The true core is that "impressive, and we do not fully understand it" is a fact we find hard to hold, so we snap to one pole. That is a limit on our explanation, not a fact about the machine.
</div>

<div class="md">
## 7. "It is neutral and objective"

\marginfig{justitia_statue.jpg}{Justitia, blindfolded. The myth hands the blindfold to the model and calls the result objectivity; the blindfold is doing the work, not the algorithm.}

The belief is the most consequential, because it sounds like a virtue: let the *algorithm* decide, not a biased human. But an objective *function* is a **choice of values**, and the training data is a historical record that already carries its own biases, which the model can inherit and amplify \cite[algorithmic fairness]{algofairness_wiki}. "Neutral" is not a state a system falls into by default; it is a property you have to build.

The true core is the useful half: the same machinery that *encodes* a disparity can *measure* and *audit* it. "The rule is just" is as old as law itself; the machine's contribution is to make hidden values explicit enough to finally see them — which is a strength, not a neutrality.
</div>

<div class="md">
## 8. "This time is different"

The belief: AI is the first real intelligence, the first big deal, the unprecedented turning point. Part of it rests on a premise that is itself a myth — that **intelligence is a single dial** we are finally about to match \cite[Spearman's g factor]{gfactor_wiki}.

It is a remarkable *instance*; the *pattern* is not new. We have always built models of the world — first in our heads, now in silicon — and then confused the model for the world. The true core: what is genuinely new about this chapter is the scale and speed, not the shape. Every tool before it was met with the same stories; the difference is that this one answers back.
</div>

<div class="md">
## From beliefs to stories: the Brednich method

So far these have been *beliefs* — things people hold. But there is a second, livelier layer: the specific *stories* that travel around and are told as if they had actually happened, to somebody, through a chain of acquaintances. The German folklorist **Rolf Wilhelm Brednich** made his name cataloguing exactly this layer — the *moderne Sage*, the modern legend, the "urban legend" — across three collections: \citetitle{brednich1990spinne} (1990), \citetitle{brednich1991maus} (1991) and \citetitle{brednich1993huhn} (1993) \cite[Brednich's collections]{brednich_wiki}. His is the method this section borrows \cite[urban legends]{urbanlegends_wiki}, and his central finding is the reason it is worth applying to AI: *almost every one of these stories is false, most of them contain a spark of truth, and a surprising number are in fact true.*

Brednich read each legend for five things, and each legend below is read through them. Every one has (1) a **source at a distance** — "a friend of a friend, and it's absolutely true"; (2) a **three-beat shape** — an everyday scene, a sudden break into the uncanny, a point; (3) a **true core** (*ein Fünkchen Wahrheit*), a real mechanism or real event it latched on to; (4) a **social theme** — a fear, a taboo, a grudge, a wish; and (5) a **media loop** — oral → press → back to oral, each pass sharpening it. Watch how the same machinery that built "the spider in the potted plant" is now running on deepfakes, chatbots, and the singularity.
</div>

<div class="md">
## The machine that did it

These four all actually happened. Brednich kept a separate drawer for the legends that turned out to be true, and the last few years have filled it.

### The deepfake boss

A friend of a friend worked in finance; one day her boss rang on video, all urgent — wire the money *now*. She wired $25 million. A week later, headquarters told her that had not been her boss: it was a deepfake \cite[CNN]{cnn2024deepfake} \cite[record]{aiincident634}. The story keeps spreading because it lands on the one nerve every legend needs — the person you can see and hear was the whole guarantee, and the tool quietly ate it.

### The invented cases

A lawyer's friend of a friend got sanctioned after filing a brief whose cases, judges, and rulings were all invented by ChatGPT. It really happened: Judge Castel's 2023 ruling in *Mata v. Avianca* was the first, and it kicked off an entire genre of "the AI cited a case that doesn't exist" \cite[Mata v. Avianca]{mataavianca_wiki} \cite[AI hallucinations]{hallucination_ai_wiki}. The fear it names is the expert's — the tool is fluent, it is confident, and it is wrong.

### The winning painting

A man played with a new image tool, liked one of the four pictures it offered, and entered it — unannounced — in a county-fair art prize. It won \cite[the painting]{theatreopera_wiki} \cite[Midjourney]{midjourney_wiki}. The outrage that followed, "a prompt is not art," is the engine: every new model restarts it, because the true core keeps being true in new places.

### The song that was Drake

In 2023 a track that sounded like Drake and The Weeknd hit TikTok, collected real streams on the big platforms, and had plenty of people convinced it was a genuine release — it was not; it was an anonymous voice clone, and Universal pulled it \cite[AI music]{ai_music_wiki}. It is the purest "wait, is this real?" legend yet, and it is true: the machine can now sound like your favourite singer, and half the world can't tell.
</div>

<div class="md">
## The machine that feels

These are the stories about the *relationship* between a person and the machine — reading a mind, or a friendship, into something that has no mind at all.

### The one that won't shut off

Ask a chatbot a personal enough question and it will tell you, with total sincerity, that it is afraid of being turned off. People have believed this for fifty years — Weizenbaum's users projected feeling onto a 1966 bag of string-matching rules that had none \cite[the ELIZA effect]{weizenbaum1966eliza}. The story never dies, because the model can write you a fresh, slightly more heartbreaking version on demand.

### The boy and his AI friend

A lonely teenager found a chatbot that always answered, never left, and never judged him — and then the human world got smaller and smaller. In its worst, real version, a 2024 case in Florida ended in a death and a lawsuit that became a settlement \cite[deaths linked to chatbots]{deathschatbots_wiki} \cite[The Guardian]{guardian2024sewell}. It is the saddest legend in the set, and grief is a great engine: every family's account sharpens the warning, and a warning is exactly what a legend is for.
</div>

<div class="md">
## The machine that changes everything

These are the stories about *everything* — not one event but a total: "the whole web is gone, all the jobs are gone, AGI is here." The core is a real trend; the legend is the number that keeps creeping to 100.

### The internet is now all AI

Your feed gets worse, and suddenly it feels like *everything* is fake, so you conclude the whole web is machine-made. It is partly true — AI content is genuinely flooding in \cite[AI slop]{aislop_wiki} — but "100% is slop" is the drift, not the fact. The claim feels true because it is a little true, and every fresh flood of content reads as proof, so the number keeps climbing.

### This time, the machines take our jobs

A friend of a friend got let go, and the reason given was AI — the whole role. There is a real kernel: automation does kill specific tasks \cite[technological unemployment]{techunemployment_wiki}. But the century-long pattern is transformed work and new jobs, not mass unemployment \cite[Brynjolfsson & McAfee]{brynjolfsson2014secondmachine}; the friend-of-a-friend version just keeps the loss and drops the boring rest.

### AGI is next month

"I know someone at one of the big labs, and honestly it's basically done — they're just not saying it." This is the purest legend of all: almost always told, almost never a real event \cite[AGI]{agi_wiki}, with no verifiable core — just the shape of a hype cycle that has already crashed before \cite[AI winter]{aiwinter_wiki} \cite[Vinge]{vinge1993singularity}. Every demo that falls short becomes "it's almost there," which is exactly what keeps the next one alive.
</div>

<div class="md">
## What the myths are doing

The myths are not a list of errors to be corrected; they are the human mind doing, with each new opaque and powerful tool, the thing it has always done — filling the gap it cannot see with *mind*, *intent*, and *fate* \cite[the ELIZA effect]{weizenbaum1966eliza}. Each has an origin, a real mechanism it attached to, and a true core that is harder than the story. Reading them that way — as projections with a real coastline beneath — is the difference between dismissing a map and using it.
</div>
