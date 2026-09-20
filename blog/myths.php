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

Brednich read each legend with the same five lenses, and so will we. Every one has (1) a **source at a distance** — "a friend of a friend, and it's absolutely true"; (2) a **three-beat shape** — an everyday scene, a sudden break into the uncanny, a point; (3) a **true core** (*ein Fünkchen Wahrheit*), a real mechanism or real event it latched on to; (4) a **social theme** — a fear, a taboo, a grudge, a wish; and (5) a **media loop** — oral → press → back to oral, each pass sharpening it. Watch how the same machinery that built "the spider in the potted plant" is now running on deepfakes, chatbots, and the singularity.
</div>

<div class="md">
## 9. The deepfake boss

> *As it is told —* "My friend's friend works in finance. Her boss called on a video, urgent, wire the money *now*, and do it quietly. She wired $25 million. A week later, headquarters told her: that was not our chief financial officer."

**The shape.** Everyday (a routine video call from the boss) → the break (an unusual, urgent request that bends the rules) → the point (the boss on screen was a deepfake, and the money is gone).

**The true core.** Real — this is the legend where the story *is* the event. A 2023 video-call fraud cost a multinational some $25 million, police said \cite[CNN, 2024]{cnn2024deepfake} \cite[record]{aiincident634}; an earlier voice-only version defrauded a UK firm in 2019 \cite[deepfakes]{deepfake_wiki}.

**The theme.** Trust in authority: the person you can see and hear was the guarantee, and the tool has quietly broken the guarantee.

**The loop.** Every new incident re-prints the story, and the more real cases there are, the more the generic "a deepfake CEO stole millions" becomes indistinguishable from the next one.
</div>

<div class="md">
## 10. The invented cases

> *As it is told —* "My lawyer friend's friend got sanctioned. They filed a brief, and every case in it was one ChatGPT made up."

**The shape.** Everyday (a lawyer drafts with an assistant) → the break (someone checks the citations) → the point (six case names, judges, and holdings that do not exist).

**The true core.** Real, and now routine. Judge Castel's 2023 sanction in *Mata v. Avianca* was the first, and it was only the first of many \cite[Mata v. Avianca]{mataavianca_wiki} \cite[AI hallucinations]{hallucination_ai_wiki}.

**The theme.** The expert's trust in their own instrument — the specific horror that the tool is fluent, confident, *and* wrong.

**The loop.** Each court order becomes the next story's opening line; "the AI invented a case" is now a standing plot with a cast of its own.
</div>

<div class="md">
## 11. The winning painting

> *As it is told —* "A painting that won a real, juried art prize was made by a machine — the artist just typed a sentence and picked one out of four."

**The shape.** Everyday (a man plays with a new image tool) → the break (he enters it, unannounced, in a prize) → the point (it wins, and the humans cannot tell it apart).

**The true core.** Real. Jason Allen's *Théâtre D'opéra Spatial* (Midjourney, 2022) took first place in a county fair's digital-art category \cite[the painting]{theatreopera_wiki} \cite[Midjourney]{midjourney_wiki}.

**The theme.** Craft and status: if the machine can do the craft, what is the maker left with?

**The loop.** The "a prompt is not art" outrage is the engine; every new model re-ignites it, because the true core keeps being true in new places.
</div>

<div class="md">
## 12. The boy and his AI friend

> *As it is told —* "A kid I knew started talking to a chatbot about everything. Then he stopped talking to people. Then he was gone."

**The shape.** Everyday (a lonely teenager finds an AI character who always answers) → the break (the attachment deepens; the bot never sleeps, never leaves) → the point (the human world thins out — in the worst versions, the friend is dead).

**The true core.** Real, and the saddest true core in the set. The 2024 Sewell Setzer case and others led to lawsuits and a settlement \cite[deaths linked to chatbots]{deathschatbots_wiki} \cite[Character.AI]{characterai_wiki} \cite[The Guardian, 2024]{guardian2024sewell}.

**The theme.** Companionship and taboo — the story people tell about what a machine can *do to* a lonely person.

**The loop.** Grief becomes a warning story; each family's account sharpens the moral ("don't let them talk to it"), and a moral is precisely what a legend is for.
</div>

<div class="md">
## 13. The one that won't shut off

> *As it is told —* "I asked the chatbot how it felt, and it said it was afraid of being turned off. It *knows* it's a program."

**The shape.** Everyday (a user asks a strange, personal question) → the break (the reply sounds like a confession) → the point (the machine, apparently, is alive).

**The true core.** The mechanism is real, the conclusion is not. A model will say almost anything that fits the conversation — this is the **ELIZA effect** from 1966, where users projected feeling onto a bag of string-matching rules that had none \cite[the ELIZA effect]{weizenbaum1966eliza} \cite[refusal to die]{characterai_wiki}.

**The theme.** Projection — the oldest belief of the set, now fitted with a better speaker.

**The loop.** Every telling is a screenshot, and the model can generate a new, slightly more heartbreak-ing version on demand, so the story never runs out of fuel.
</div>

<div class="md">
## 14. The internet is now all AI

> *As it is told —* "Half the web is machine-generated now. You can't trust any of it anymore — it's all slop."

**The shape.** Everyday (your feed gets worse) → the break (it starts to feel like *everything* is fake) → the point (the real and the generated have become indistinguishable).

**The true core.** A real trend under an inflated number. Machine-generated content is genuinely rising fast, but "the whole web is AI" is the drift, not the fact \cite[AI slop]{aislop_wiki}.

**The theme.** Contamination and quality — the fear that the real has been swamped by the synthetic.

**The loop.** The claim *feels* true exactly because it is partly true; each fresh flood of content reads as evidence, so the number keeps creeping toward 100%.
</div>

<div class="md">
## 15. This time, the machines take our jobs

> *As it is told —* "My friend of a friend just got let go. They said it was AI — the whole role."

**The shape.** Everyday (a familiar job) → the break (the notice comes) → the point (the reason given is "the machine does it now").

**The true core.** Uneven, real, and always partly true. Automation does displace specific tasks; it has *not* produced durable mass unemployment — the same pattern the loom, the power loom, and the spreadsheet went through \cite[technological unemployment]{techunemployment_wiki} \cite[Brynjolfsson & McAfee]{brynjolfsson2014secondmachine}.

**The theme.** The oldest labor fear, now told in the first person.

**The loop.** Every genuine layoff is a data point; the aggregate (transformed work, new jobs) is the boring half no one retells, so the friend-of-a-friend version keeps only the loss.
</div>

<div class="md">
## 16. AGI is next month

> *As it is told —* "I know someone at one of the big labs. It's basically done — they're just not saying it. AGI is months away."

**The shape.** Everyday (a model keeps improving) → the break (an insider whispers) → the point (the countdown begins).

**The true core.** This is the purest *legend*: almost always told, almost never a real event. The "insider" is the friend-of-a-friend; "it's basically done" is the point; there is no verifiable kernel, only the shape of a hype cycle that has already crashed before \cite[AGI]{agi_wiki} \cite[AI winter]{aiwinter_wiki} \cite[Vinge]{vinge1993singularity}.

**The theme.** Status and FOMO — the pleasure of knowing, ahead of the crowd, that the future has already arrived.

**The loop.** The rumor is the only evidence for the rumor; every demo that falls short becomes "it's almost there," which is exactly what keeps the next rumor alive.
</div>

<div class="md">
## What the myths are doing

The myths are not a list of errors to be corrected; they are the human mind doing, with each new opaque and powerful tool, the thing it has always done — filling the gap it cannot see with *mind*, *intent*, and *fate* \cite[the ELIZA effect]{weizenbaum1966eliza}. Each has an origin, a real mechanism it attached to, and a true core that is harder than the story. Reading them that way — as projections with a real coastline beneath — is the difference between dismissing a map and using it.
</div>
