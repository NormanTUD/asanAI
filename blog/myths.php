<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Common Myths and Misconceptions About AI
description: Why people believe what they believe about AI — beliefs and urban legends, read through the folklorist Brednich's method.
icon: &#128302;
part: 6
order: 12
color: coral
topics: philosophy, society, ethics, language
-->

<div class="md">
## The habits, not the machines

When we meet a powerful tool we cannot see inside, we do not stay quiet about what it must be. We fill the gap with the oldest answers we have — it is alive, a god, a threat, neutral, magic, or nothing. AI is the newest version of a very old habit, and this page is about the habit, not the machine.

Start with a warning about *us*. We overestimate how well we understand how things work, from a zipper to a traffic light \cite[Rozenblit & Keil]{rozenblit2002ioed}, and the gap shows up worst exactly where the mechanism is hidden. When a tool is opaque we close it with *mind* and *intent* — and we already caught ourselves doing this in 1966, when people projected feeling onto a chatbot that had none \cite[the ELIZA effect]{weizenbaum1966eliza}.

\marginfig{flammarion.jpg}{Flammarion's 1888 print of a militiaman pointing at the sun. The story is that he died believing he had reached heaven — not wrong about the direction of his model, only about the map. Most of our "obvious" beliefs about AI work the same way: the gesture points somewhere real, and the map is supplied by us.}

The polls show the same duality: a majority expect AI to help more than it harms, yet job losses — and for many, an existential risk — top the list of fears \cite[the AI Index]{aiindex2025}. In the same people, the hope and the dread sit together.
</div>

<div class="md">
## The Brednich method

We are not just listing errors. We are reading these the way the German folklorist **Rolf Wilhelm Brednich** read the *moderne Sage* — the modern legend, the "urban legend" — across three best-selling collections, \citetitle{brednich1990spinne} (1990), \citetitle{brednich1991maus} (1991) and \citetitle{brednich1993huhn} (1993) \cite[Brednich's collections]{brednich_wiki}. His finding, and the reason the method is worth stealing \cite[urban legends]{urbanlegends_wiki}, is a small one: *almost every such story is false, most contain a spark of truth, and a surprising few are true.*

Brednich looked for five things in each: a **source at a distance** ("a friend of a friend, and it's absolutely true"), a **three-beat shape** (everyday → the break → the point), a **true core** (*ein Fünkchen Wahrheit*), a **social theme** (a fear, a taboo, a grudge, a wish), and a **media loop** that keeps sharpening it. We read every entry below — whether a quiet belief or a loud story — through those five things.
</div>

<div class="md">
## Is it a mind?

Three beliefs do the same thing: they read a mind into the machine.

### It is alive

We talk to the assistant like a colleague, and some now worry it might *suffer*. There is no evidence of *phenomenal* experience, and the "aliveness" is a projection, not a fact about the machine — we evolved to read a mind into anything fluent and responsive. It is the oldest belief in the set, and the one that makes the others possible \cite[the ELIZA effect]{weizenbaum1966eliza}.

### It talks like us, so it thinks like us

\marginfig{turing.jpg}{Alan Turing, 1950. He proposed a *pragmatic* test, not a *definition* of mind — and the conflation of the two is what the myth runs on.}

The **Turing Test** is usually read as "fool a human and you think." That was never it: Turing offered the Imitation Game as a *behavioral* way to sidestep a question he called too meaningless to discuss \cite[Turing, 1950]{turing1950computing}, not a definition of mind. "Does it think?" is really "where do we draw the line that puts *our* minds in *other* minds" — a question we have never been good at, with or without silicon \cite[the Turing Test]{septruringtest}.

### The brain is a computer, so a computer can think

\marginfig{cajal_cerebellum.jpg}{Santiago Ramón y Cajal's stained neurons, c. 1910. The real brain, and the metaphor we built on it.}

If it "learns" and "processes information," the assumption goes, it must work like a brain. That premise — the **computational theory of mind** — is generative but slippery \cite[the computational theory of mind]{computational_theory_of_mind}. And the real story is closer than the folk version admits: the brain is a prediction machine that constantly forecasts its own senses and learns from the gap between forecast and experience — every input to the senses is a feedback signal it monitors \cite[Andy Clark]{clark2013surfing} \cite[predictive processing]{predictive_coding_wiki}. So "the brain is a computer" is less wrong than people think; the misleading part is assuming understanding and consciousness come free with the computing.
</div>

<div class="md">
## Is it a danger?

Two beliefs point at the future, and both are the same fear with different faces.

### It will outgrow us — the singularity

The machine becomes a god, or at least takes over. The modern labels are Vinge's *technological singularity* and Kurzweil's countdown \cite[Vinge]{vinge1993singularity} \cite[Kurzweil]{kurzweil2005singularity} — but the *shape* of the story is much older: the **Golem**, the creation that out-runs its maker \cite[the Golem legend]{golem_wiki}. There is no demonstrated path to a machine rewriting itself into superintelligence \cite[Bostrom]{bostrom2014superintelligence}. The real, defensible worry is smaller and drier — a capable *optimizer* with a slightly mis-specified goal is dangerous with no motive at all \cite[orthogonality]{bostrom2012orthogonal}. The myth supplies the Golem; the engineering supplies the actual problem.

### It will take our jobs

The oldest labor panic in the set, and a myth about a myth. The **Luddites** of 1811 are usually told as people smashing machines out of fear of technology; in fact they were skilled weavers protesting wages and the quality of work — the *terms* were the target, not the machine \cite[the Luddites]{luddite_wiki}. The doomsday version is undercut by the record: across a century of automation, technology has *transformed* work and created new kinds of it, not produced durable mass unemployment \cite[Brynjolfsson & McAfee]{brynjolfsson2014secondmachine}. But the doomsayers are not entirely wrong — the losses are real, just not uniform: specific roles and specific people do get flattened \cite[technological unemployment]{techunemployment_wiki}. "This machine ends all work" has been said of the loom, the power loom, and the spreadsheet; each time it was wrong in the aggregate and right in painful, particular pockets.
</div>

<div class="md">
## Is it trustworthy, or unprecedented?

The last three are quieter, and one of them sounds like a virtue.

### It's magic — or it's nothing

Two beliefs that cancel each other but share the same error: one calls it an unexplainable miracle, the other "just statistics, a fancy lookup table." Both assume a mechanism we cannot *picture* must be either a soul or a triviality — the **illusion of explanatory depth** running in both directions \cite[the illusion of explanatory depth]{ioed_wiki}. It is real, structured, *and* not yet fully explained, all at once. And the "just brute force" pole is nearly right: the winners are the general, computation-hungry methods, not hand-built cleverness \cite[Sutton]{sutton2019bitterlesson}. That a fact we find hard to hold is a limit on *our* explanation, not a fact about the machine.

### It is neutral and objective

\marginfig{justitia_statue.jpg}{Justitia, blindfolded. The myth hands the blindfold to the model and calls the result objectivity; the blindfold is doing the work, not the algorithm.}

The most consequential belief, because it sounds like a virtue: let the *algorithm* decide, not a biased human. But an objective function is a **choice of values**, and the training data is a historical record that already carries its own biases, which the model inherits and can amplify \cite[algorithmic fairness]{algofairness_wiki}. "Neutral" is not a default a system falls into; it is a property you build. The useful core: the same machinery that encodes a disparity can *measure* and *audit* it — making hidden values visible is a strength, not a neutrality.

### This time is different

AI is the first real intelligence, the unprecedented turning point. Part of it leans on a premise that is itself a myth — that **intelligence is a single dial** we are finally about to match \cite[Spearman's g factor]{gfactor_wiki}. It is a remarkable *instance*; the *pattern* is not new. We have always built models of the world — first in our heads, now in silicon — and then mistook the model for the world. What is new is the scale and speed, not the shape; the difference from every earlier tool is that this one answers back.
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

These are the stories about *everything* — not one event but a total: "the whole web is gone, AGI is here." The core is a real trend; the legend is the number that keeps creeping to 100.

### The internet is now all AI

Your feed gets worse and suddenly it feels like *everything* is fake, so you conclude the whole web is machine-made. It is partly true — bot and AI content is genuinely flooding in \cite[AI slop]{aislop_wiki} — but "the internet is all fake" is the drift, not the fact. This is the **dead internet theory**, which started on the imageboard Wizardchan, was first named in a 2021 forum post ("Dead Internet Theory: Most of the Internet is Fake"), and went mainstream in 2021 \cite[dead internet theory]{deadinternet_wiki}. The legend keeps spreading because it is a little true, and every fresh flood of content reads as proof.

### AGI is next month

"I know someone at one of the big labs, and honestly it's basically done — they're just not saying it." This is the purest legend of all: almost always told, almost never a real event \cite[AGI]{agi_wiki}, with no verifiable core — just the shape of a hype cycle that has already crashed before \cite[AI winter]{aiwinter_wiki} \cite[Vinge]{vinge1993singularity}. Every demo that falls short becomes "it's almost there," which is exactly what keeps the next one alive.
</div>

<div class="md">
## What the myths are doing

The myths are not a list of errors to be corrected; they are the human mind doing, with each new opaque and powerful tool, the thing it has always done — filling the gap it cannot see with *mind*, *intent*, and *fate* \cite[the ELIZA effect]{weizenbaum1966eliza}. Each has an origin, a real mechanism it attached to, and a true core that is harder than the story. Reading them that way — as projections with a real coastline beneath — is the difference between dismissing a map and using it.
</div>
