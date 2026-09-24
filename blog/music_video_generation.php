<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: AI Music & Video Generation
description: From Mozart's dice to Sora — how machines compress sound and frames into tokens, then run transformers over them.
icon: &#127916;
part: 4
order: 16
color: coral
topics: multimodal, audio, video, generation, architecture
tags: deep-dive, reading-heavy
math: 50
-->

<div class="md" data-lesson-id="music_video_generation">
<figure style="margin: 1em 0 1.5em 0;">
	<img style="width: 100%; height: auto; display: block; border-radius: 6px;" src="diffusion_astronaut.webp" alt="A still image of an astronaut riding a horse, generated from a text prompt by a diffusion model" />
	<figcaption>This still was painted from a text prompt by a diffusion model. The same family of machines now *animates* stills like this into coherent video — and a closely related family writes whole songs from a single line of text. That is the story of this chapter. \cite[Image: Stable Diffusion 3.5]{diffusion_astronaut_img}</figcaption>
</figure>

In 1787, Mozart wrote down a card game. Roll some dice, look up a table, and a little minuet you have never heard assembles itself bar by bar — a *Musikalisches Würfelspiel*, a musical dice game. It was not artificial intelligence. It was a recipe: swap a few interchangeable phrases, and a new tune falls out. The composer's hand was, on purpose, removed from the loop.

Three centuries later, someone types a sentence into a box, and a machine called **Sora** dreams up a full minute of video — a coherent little world with moving objects, a shifting camera, and, it turned out, a surprising sense of how a physical world behaves \cite[OpenAI's Sora report, Feb 2024]{brooks2024sora}.

These two moments are the same question asked twice: **can a machine make something that feels made?** This chapter follows the long, winding answer — from dice and rules, through statistics, to the deep-learning machines that now compose songs and render films. And the punchline is that the machine which writes a three-minute song and the machine that renders a one-minute movie are, under the hood, *almost the same animal*.
</div>

<div class="md">
## 1. The old game: randomness, rules, and the dream of a machine composer

The dice game is the right place to start, because it already contains the whole idea. Music, Mozart's game understood, is **recombination**. A tune is a small number of stock moves — a cadence, a turn, a trill — rearranged. If you can list the moves and the legal orderings, you can *generate* a tune by choosing among them.

For the next century and a half, the art world kept turning this idea over. In the 1910s Duchamp let chance pick the notes of a "score" that was, frankly, a joke about the pretensions of music. In 1951 John Cage wrote *Music of Changes* by consulting the *I Ching*, throwing yarrow stalks to decide pitch and duration — deliberately emptying the composer's intention out of the piece. The point was not to make good music; it was to ask what remains of "composition" when the decisions come from somewhere else.

> The seed of everything in this chapter is a question the art world raised in 1951: if a machine, or a die, makes the choices, is it still composition — and who is the composer?

Then the machines got fast enough to actually play. In the late 1940s a machine called **CSIRAC** in Adelaide played *Baa, Baa, Black Sheep*. In 1951 Christopher Strachey, working at the University of Manchester, ran a program on a Ferranti computer that generated the first known **computer music** \cite[Strachey, 1951]{strachey1952}. In 1957 the **Illiac Suite for String Quartet** was written by a composer, Leonard Isaacson, and a mathematician, Lejaren Hiller, and played by real musicians — the first major work a computer *composed*. Around the same time, at Stanford, Max Mathews wrote **MUSIC** (1957, then MUSIC III), the first computer language for *synthesizing* sound in real time, and in 1963 he published it in *Science*. That is the moment the computer stops being a calculator and becomes an **instrument**.

<figure style="max-width:880px; margin:1.5em auto; text-align:center;">
	<img style="width:100%; height:auto; border-radius:6px;" src="1280px-BRL61-IBM_702.jpg" alt="An IBM 702 mainframe computer system with CRT memory, central processing unit, printers, tape drives and card reader" />
	<figcaption>IBM 702 mainframe, 1961 — the era's workhorse for the kind of number-crunching that turned "let a machine arrange the notes" from a joke into an engineering project. \cite[Photo: U.S. Army Ballistic Research Laboratory, public domain]{ibm702image}</figcaption>
</figure>

And in the same years, the composer **Iannis Xenakis** was doing something more radical: he wrote *Pithoprakta* (1955) and, in 1959, *Bohuslav* for the IBM 650, generating textures of sound with **stochastic** methods — the notes placed by probability distributions rather than by any rule a person could follow. Math, not taste, was the composer.

So for about thirty years, "a machine makes music" really meant *a machine follows a recipe a human wrote, with a bit of randomness stirred in*. Rule-based, algorithmic, deterministic-or-chance. Clever, fascinating — but the machine had **not** learned anything. It was executing a plan.
</div>

<div class="md">
## 2. The turn: from rules to statistics

The fifty-year question had been *"what rules do we write?"* The machine was a very obedient executor of human taste, formalized into tables and probabilities. Somewhere in the 1990s that question quietly flipped to *"what can the machine infer on its own, if we show it enough examples?"*

That flip is the whole deep-learning era in one sentence, and it landed on music first, because music is easy to feed to a computer as numbers. In 1997 **EMI** — "Experiments in Musical Intelligence," built by the composer David Cope — learned the *style* of Bach not from rules but from statistics over his actual music, and (in a much-hyped contest) appeared to out-perform a human at imitating it. It grew into **Emily Howell**. In 2010 a machine at the University of Málaga called **Iamus** — running a system called Melomics — produced what is often billed as the first "original" contemporary classical piece in a machine's own style, *Iamus' Opus 1*. And in 2002, François Pachet's **Continuator** at the Sony Computer Science Laboratory in Paris could pick up a melody where a live musician left off, continuing it in real time.

The through-line: **stop writing the rules; let the machine induce them from data.** That is not a music idea. It is the same move that made modern language models possible — and it is exactly the move this chapter is about.

> **In short.** Everything after this point — Suno, Udio, Sora, Veo, Runway — is the "infer from data" turn, applied to sound and to video. The dice and the rules are gone. The machine is watching, listening, and learning patterns on its own.
</div>

<div class="md">
## 3. The deep recipe, step one: turn sound into numbers a machine can chew

Here is the problem the deep-learning era had to solve. A song is, on disk, a **waveform** — a list of roughly 44,100 tiny pressure measurements *per second* (CD quality). That is about 2.6 million numbers in a single minute. No model can chew that directly.

So the first act of every modern music machine is **compression** — and specifically a clever kind of compression called a **neural audio codec**. The idea, made famous by WaveNet \cite[van den Oord et al., 2016]{oord2016wavenet} and then by codecs like **SoundStream** \cite[Zeghidour et al., 2021]{zeghidour2021soundstream} and **EnCodec** \cite[Defossez et al., 2022]{defossez2022encodec}, is to squeeze the dense waveform into a short list of **discrete codes** — a few hundred numbers per second instead of tens of thousands. It is like a lossy zip file, except the zip file was *learned*, so it keeps the parts of the sound a human ear actually cares about.

Why does this matter so much? Because **once audio is a sequence of discrete codes, it looks exactly like text.** A song becomes a paragraph. And a paragraph is what a language model can read and write.

> **In short.** The single trick that unlocked AI music is the codec: *sound → discrete tokens*. Do that, and music becomes just another sequence — and sequences are the home turf of the Transformer.
</div>

<div class="md" data-mathlevel="50" data-optionaltitle="The token math, made concrete">
Let's make the token idea concrete. EnCodec encodes one second of audio into a handful of codes from a small learned vocabulary (on the order of 75 to a few hundred, depending on how many "codebooks" it uses). A three-minute song is then only on the order of $10^{4}$ to $10^{5}$ codes — about the length of a short essay in words. **A song is an essay, written in a vocabulary the model invented.**

That reframe is the load-bearing wall of the whole chapter. It is the reason the same architecture that writes your email can, with the right codec, write a chorus.
</div>

<div class="md">
## 4. Music as language: how the machines actually generate a song

Now run the sequence model over those tokens. This is where the named research machines live, and they form a clean lineage:

* **WaveNet** (DeepMind, 2016) was the first to generate *raw* audio sample by sample, an autoregressive network that "wrote" the waveform \cite[van den Oord et al., 2016]{oord2016wavenet}.
* **Jukebox** (OpenAI, 2020) scaled the idea up: a hierarchical model that could generate minutes of a full song — vocals, lyrics and all \cite[Dhariwal et al., 2020]{gresser2023jukebox}.
* **AudioLM** (Google, 2023) made the "music as language" bet explicit: map audio to discrete tokens, then **language-model** them, so the model can generate *continuations* of a clip — trained on raw waveforms, no transcripts, no annotations \cite[Borsos et al., 2023]{borsos2023audiolm}.
* **MusicLM** (Google, 2023) added the text prompt: *text → music*, cast as a hierarchical sequence-to-sequence problem, producing faithful music at 24 kHz that stays coherent for several minutes \cite[Agostinelli et al., 2023]{agostinelli2023musiqlm}. It also released **MusicCaps**, a set of 5,500 music-and-description pairs.
* **MusicGen** (Meta, 2023) is the lean, fast, open cousin: a Transformer over EnCodec tokens, steered by a text embedding, controllable and quick \cite[Copet et al., 2023]{copet2023musicgen}.

</div>

<div class="smart-quote" data-cite="agostinelli2023musiqlm">
MusicLM generates high-fidelity music from text descriptions such as "a calming violin melody backed by a distorted guitar riff", remaining consistent over several minutes.
</div>

<div class="md">
Notice the recipe that all of them share, stripped of the branding:

1. **Codec** the audio into discrete tokens (EnCodec / SoundStream style).
2. **Encode the text prompt** with a Transformer encoder (CLIP or T5 — the same encoders the image and LLM world uses).
3. **Generate** the token sequence, either by *autoregressive next-token prediction* (AudioLM, MusicGen) or by a *diffusion* process over audio latents (AudioLDM \cite[Liu et al., 2023]{liu2023audioldm} and the newer music models).

**Suno** (launched December 2023) and **Udio** (April 2024) are products on exactly this recipe, scaled and polished. Suno's signature move is to use an LLM to *expand* your short prompt — "sad piano about rain" — into a rich description of melody, instruments, tempo and mood, and then hand that to a generator. The viral moment came in 2023 with **"Heart on My Sleeve,"** a fake Drake-and-Post-Malone duet, a *voice clone* that fooled millions — the moment the public felt the technology cross from clever to uncanny.

> **In short.** Suno is not a new kind of machine. It is the same two moves — *compress audio into tokens, then run a sequence model over them, guided by a text embedding* — pushed to scale. Once you see that, "it wrote a whole song" stops feeling like magic and starts feeling like the LLM writing a very unusual paragraph.
</div>

<div class="md">
## 5. The impact: a flood, and a legal vacuum

The effects hit fast. By late 2025, Deezer was reporting on the order of **50,000 AI-generated tracks uploaded a day — about a third of all uploads** — and it began auto-tagging them and keeping them out of human-curated playlists. An AI-made country song reached the top of a Billboard digital chart. The flood has a name now, "AI slop," and the economics are being felt: when a track costs a prompt, what is a "session musician" worth?

The law has not caught up. In the United States the Copyright Office has taken the position that **purely AI-generated works are not copyrightable**, because they lack a *human author*. In the EU the originality test likewise requires a human's creative fingerprint. Meanwhile the labels are fighting back: **Universal Music Group and Sony Music sued Suno** for training on their catalog without permission. So the field sits in a strange gap — a technology that can copy any voice or style, sitting in a legal system built for the assumption that a human made the thing.

> **In short.** The technology outran the rules. Ownership, consent, and the economics of authorship are now open questions the courts and the labels are still arguing over.
</div>

<div class="md">
## 6. The same engine, a second modality: video

Now the same question, one dimension up. A video is a stack of frames plus **time**. The problems are the same three: *how do you represent it, how do you learn it, how do you tell it what to show?* And the answers, one by one, mirror the music story.

**First, GANs.** In 2018, **MoCoGAN** learned to separate *what is in the scene* (content) from *how it moves* (motion), so you could re-animate one object with a different motion \cite[Tulyakov et al., 2018]{tulyakov2018mocogan}. The same year, **World Models** by David Ha and Jürgen Schmidhuber proposed a bolder idea: let a network learn a compressed model of an environment, and then train an agent to act *entirely inside its own dreamed simulation* \cite[Ha & Schmidhuber, 2018]{ha2018worldmodels}. And **Fréchet Video Distance (FVD)** gave the field a way to even *measure* whether a generated video was good \cite[Unterthiner et al., 2018]{unterthiner2018fvd}.

**Then the tokenizer turn — and here is the mirror.** In 2021, **VideoGPT** did for video exactly what the codec did for audio: a VQ-VAE compressed a video into **discrete spatio-temporal tokens**, and a GPT-style model then *wrote* the video token by token \cite[Yan et al., 2021]{yan2021videogpt}. Video became a paragraph, too. And on the data side, **WebVid-10M** (2021) assembled ~10 million weakly-labelled video-and-text pairs — the "LAION of video" \cite[Bain et al., 2021]{bain2021webvid}.

> **In short.** Watch the rhyme: audio got a *codec* (SoundStream/EnCodec); video got a *tokenizer* (VQ-VAE). Audio got *MusicLM/AudioLM*; video got *VideoGPT*. Both became "a sequence of learned tokens, written by a Transformer." The two modalities converged on the same idea within a year.
</div>

<div class="md">
## 7. Diffusion takes the wheel — and the Transformer becomes the star

The final, decisive ingredient is the same one that took over *image* generation (see the **Diffusion Models** chapter): **diffusion**, the destroy-then-learn-to-undo recipe \cite[Ho et al., 2020]{ho2020ddpm}. Applied to video, it showed up in 2022 as **Make-A-Video** (Meta) \cite[Singer et al., 2022]{singer2022makeavideo} and **Imagen Video** (Google) \cite[Ho et al., 2022]{ho2022imagenvideo} — both cascades of diffusion models that turn a text prompt into a moving, high-definition clip.

But the real unlock was architectural. The original diffusion denoisers were **U-Nets**, convoluted image networks. In 2023, Peebles and Xie showed you could replace the U-Net with a **Transformer that operates on latent patches** — a **Diffusion Transformer, or DiT** \cite[Peebles & Xie, 2023]{peebles2023dit}. That single swap mattered, because it made the video generator structurally *identical in family* to an LLM: tokens in, Transformer layers, tokens out. A year of video models — **Stable Video Diffusion** (Stability AI, open weights) \cite[Blattmann et al., 2023]{blattmann2023svid} — built on exactly that.
</div>

<div class="md">
## 8. Sora: a diffusion Transformer over spacetime, as a world simulator

**Sora** (OpenAI, February 2024) is where all the threads tie together \cite[OpenAI, 2024]{brooks2024sora}. The pipeline is a direct descendant of every idea above:

1. A **video compression network** (a VAE) squeezes raw video into a low-dimensional *latent* space, compressed in space **and time**.
2. Those latents are cut into **spacetime patches** — and these patches are the model's *tokens*. (An image is just a video with one frame, so images and videos use one representation.)
3. A **diffusion Transformer** denoises those patches, conditioned on the text prompt (which is expanded into a detailed caption by an LLM, the same trick DALL·E 3 used).

The striking part is not the pipeline but what *emerges at scale*. With no explicit 3D training signal, Sora starts to show **3D consistency** (objects move coherently as the camera orbits), **object permanence** (a character stays the same character across shots), and simple **physical interactions** (a painter's strokes persist, a bitten burger keeps its bite marks). OpenAI's framing is telling: they call scaling video models "a promising path towards building general-purpose simulators of the physical world."

<div class="smart-quote" data-cite="brooks2024sora">
Scaling video generation models is a promising path towards building general purpose simulators of the physical world.
</div>

That is the 2018 **World Models** dream \cite[Ha & Schmidhuber, 2018]{ha2018worldmodels}, realized at internet scale: a machine learning to *dream* a plausible world from a seed. The caveats are real — it still gets physics wrong (glass that doesn't shatter like glass, food that doesn't deplete) and long clips drift. But the direction is clear.
</div>

<div class="md">
## 9. How it works with the LLM, in one breath

You have probably been wondering: *"how does any of this actually connect to a language model?"* Here is the whole answer, condensed:

There are **two families** of generative machine, and both are Transformers at the core.

* **Autoregressive over tokens** (AudioLM, MusicGen, VideoGPT): the codec turns the signal into tokens, and the model predicts the *next token*, exactly like an LLM predicts the next word. Here the LLM **is** the generator — it literally writes the audio or video, code by code.
* **Diffusion over latents** (Imagen Video, SVD, Sora, AudioLDM): the signal lives in a continuous latent space, and a **diffusion Transformer** learns to denoise it. Here a Transformer *encoder* (CLIP/T5) reads the prompt and *conditions* the denoiser, while **classifier-free guidance** \cite[Ho & Salimans, 2022]{ho2022cfg} pushes the output to obey the prompt.

Either way, the backbone is the same architecture that runs the chatbot you are reading this on, and the "prompt" is handled by the same encoders. The only genuinely new ingredient per modality is the **tokenizer**: the learned codec that turns sound or frames into a vocabulary the Transformer can speak.

> **In short.** "AI music" and "AI video" are not new species of AI. They are the LLM's Transformer, pointed at a new vocabulary — audio codes here, spacetime patches there — with diffusion as an alternative engine. One organism, many senses.
</div>

<div class="md">
## 10. How much data — and how does it get into the tensors?

A last, practical question: *how much data, and how does it get loaded into the model?*

**Music.** The *conditioning* data can be small — MusicCaps is only 5,500 description-and-music pairs \cite[Agostinelli et al., 2023]{agostinelli2023musiqlm}. But the *audio* the model learns from is enormous: tens of thousands of hours of music. Each clip is chopped into short frames; a codec encoder maps each frame to a few discrete codes; those codes are the model's words. The network never stores the songs. It learns the **statistics** of what music sounds like — the grammar of melody, rhythm, timbre, and style — compressed into its weights.

**Video.** Sora trains on a **web-scale** corpus of video at native durations, resolutions and aspect ratios \cite[OpenAI, 2024]{brooks2024sora}. Each clip is compressed to a latent, cut into spacetime patches, and those patches become the token sequence. One second of high-definition video can be a large grid of patch-tokens; a minute is a long sequence the Transformer must hold in mind. Crucially, the clips are **re-captioned** — a descriptive vision-language model rewrites a rich text description for each clip, so the words actually match the pixels (the DALL·E-3 trick).

The common thread: **the vocabulary is not letters, it is learned codes — and the corpus is internet-scale.** The model is not a hard drive of every song and clip ever made. It is a *compressed statistical model of the space of possible sounds and scenes*. When it generates, it is sampling from that space, guided by your prompt.
</div>

<div class="md">
## 11. Where this leaves us

Zoom back out and the story is one long arc with two turns. The first turn was philosophical: *remove the composer's hand* — Mozart's dice, Cage's stalks, Xenakis' probabilities. The second was the one this chapter is really about: *stop writing the rules, and let a big model infer them from the world* — until the machine can, from a sentence, dream a song or a world.

Music generation and video generation look like two different miracles to a first-time user. They are the same miracle seen from two angles: **a signal, compressed into tokens, then written by a Transformer.** The dice are still there — a diffusion model "rolls the dice" in latent space at every denoising step — but now the dice are guided by a prompt, and the table they roll on is a statistical model of reality.

Three centuries after Mozart rolled the dice, the question "can a machine make something that feels made?" has a working, if controversial, *yes*. The open questions now are the human ones — who made it, who owns it, and what we do with a machine that can dream in audio and video.

> **In short.** Same engine, two senses: *compress the signal into tokens, run a Transformer over them, steer it with a text embedding.* That sentence is Suno, Udio, MusicGen, VideoGPT, Sora and the rest. Everything else is scale.
</div>
