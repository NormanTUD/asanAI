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

In 1787 Mozart wrote down a card game. Roll some dice, look up a table, and a little minuet you have never heard assembles itself bar by bar. It was not artificial intelligence — it was a recipe for swapping interchangeable phrases. But it already contained the whole idea: **music is recombination**, and if you can list the moves and the legal orderings, a machine can *choose* among them.

Three centuries later, someone types a sentence into a box and a machine called **Sora** dreams up a full minute of video — a coherent little world with moving objects, a shifting camera, and, it turned out, a surprising sense of how physical things behave \cite[Sora (OpenAI, 2024)]{brooks2024sora}.

These are the same question asked twice: **can a machine make something that feels made?** And the punchline — the thing this chapter is really about — is that the machine that writes a three-minute song and the machine that renders a one-minute movie are, under the hood, *almost the same animal*. They differ in one learned detail and share everything else.
</div>

<div class="md">
## The long road to a machine that composes

Before there were deep neural networks, "a machine makes music" meant something else entirely. For most of that time it meant *a machine follows a recipe a human wrote, with a little randomness stirred in*. Understanding that older meaning makes the deep-learning era land harder.

### Machines that make music without ears

The oldest trick is to **remove the composer's hand**. In the 1910s Marcel Duchamp let chance pick the notes of a "score" that was really a joke about the pretensions of music. In 1951 John Cage composed *Music of Changes* by consulting the *I Ching*, throwing stalks to decide pitch and duration — deliberately emptying intention out of the piece. The question was never "can we make good music?" It was "what is left of *composition* when the decisions come from somewhere else?"

The machines were already hinting at the answer, mechanically. In **1805** the instrument-maker Johann Nepomuk Mälzel built the **Panharmonicon** \cite[Mälzel's Panharmonicon, 1805]{panharmonicon}, a large organ-like machine that could *play itself* — an automatic player that imitated a whole orchestra and even cannon fire. Beethoven, a friend, wrote *Wellington's Victory* for it. It was not a composer; it was a very elaborate pinball of sound. But a walking, self-playing orchestra was the first time a *device*, not a person, performed a complete piece — the ancestor of every "generative" music system since.

### When computers put their hands on the piano

When the first real computers appeared, the question became engineering. In the late 1940s a machine called **CSIRAC** in Adelaide played *Baa, Baa, Black Sheep*. In **1951** Christopher Strachey ran a program on a Ferranti computer in Manchester that generated the first known computer music \cite[Strachey, 1951]{strachey1952}. In **1957** a composer, Leonard Isaacson, and a mathematician, Lejaren Hiller, wrote the **Illiac Suite** for string quartet on the ILLIAC I — the first major work a computer *composed* \cite[Hiller & Isaacson's Illiac Suite]{illiac_suite}. And that same year, **Max Mathews** wrote **MUSIC**, the first computer language for *synthesizing* sound in real time \cite[Max Mathews and MUSIC]{max_mathews} — the moment the computer stopped being a calculator and became an **instrument**.

Around the same years the composer **Iannis Xenakis** went further: in *Pithoprakta* (1955) and, in 1959, *Bohuslav* for the IBM 650, he placed notes with **probability distributions** rather than rules a person could follow. Math, not taste, was the composer.

> The seed of everything in this chapter is a question the art world raised in 1951: if a machine, or a die, makes the choices, is it still composition — and who is the composer?
</div>

<div class="md">
## Music as information: the vocabulary

A machine cannot "hear" the way you do. To generate music it first has to know what the *pieces* of music are, and how to represent them as numbers. So let's name the pieces — the minimal theory a model must capture — and then the two completely different ways music gets turned into data.

### What a model has to capture

These are the coordinates of the space a music model learns to move through \cite[Overview: music theory]{music_theory}:

- **Pitch** is how high or low a note sounds; its physical cause is **frequency** in hertz. The reference note A above middle C — "concert pitch" — is standardized at **440 Hz**.
- An **octave** is the interval where one frequency is exactly **double** the other; a note and the note an octave up have the same name.
- Western keyboards divide the octave into **12 equal semitones** (*12-tone equal temperament*). Each semitone multiplies the frequency by $2^{1/12} \approx 1.0595$. This is why the piano keyboard is 12 keys to the octave.
- A **scale** is a chosen set of notes; the **major scale** follows the whole/half-step pattern *whole–whole–half–whole–whole–whole–half*. **Major vs minor** differs mostly in the third (and sixth/seventh) degree: major sounds "bright," minor "darker." That one interval is most of why a minor key feels sad.
- An **interval** is the distance between two pitches (counted in semitones, or as a frequency ratio). A **chord** is three or more notes sounded together; the basic one, a **triad**, is a root plus a third and a fifth.
- **Rhythm** is the pattern of events in time; the **beat** is the steady pulse; **meter** is how beats are grouped (a *time signature* like 4/4).
- **Timbre** ("tone colour") is what makes a piano and a violin playing the *same* note sound different. It is set not by the fundamental pitch but by the **harmonics** — the higher overtones riding on top — and by the note's loudness envelope (how it attacks and fades).
- **Dynamics** is loudness: from *pp* (very soft) to *ff* (very loud).
- **Form** is large-scale structure — verse, chorus, bridge, the ABAB or AABA shapes a song is built from.

A music-generation model is learning the *joint statistics* of all of these at once: which chords follow which, how a melody leans over a harmony, how a snare sits in the meter, what "a warm cello" sounds like.

### Two ways to write it down

Here is the crucial fork in the road, and it shapes everything after it. There are **two fundamentally different representations** of music, and they led to two different machines.

#### The symbolic score: MIDI

For a long time, "music as data" meant **MIDI** — the *Musical Instrument Digital Interface*, a standard locked in in **1983** by Ikutaro Kakehashi of Roland, Dave Smith and Chet Wood of Sequential Circuits, and the other major synth makers (Yamaha, Korg, Kawai, Oberheim) \cite[How MIDI works]{midi}. MIDI does not store sound. It stores **instructions**: *note-on at pitch 60, velocity 80, now; note-off, 300 ms later; on channel 3*. It works across 16 channels, and it says nothing about timbre at all — the sound comes from whatever keyboard or software plays the file back.

That is the whole point, and the whole limitation. MIDI is tiny and perfectly editable — you can quantize a note, transpose a chord, re-velocity a phrase — but it is a **score, not a recording**. It cannot carry the sound of a specific singer, the room of a specific studio, the grit of a specific guitar. A model that only sees MIDI can write *notes*; it cannot write *sound*.

<figure style="max-width:880px; margin:1.5em auto; text-align:center;">
	<img style="width:100%; height:auto; border-radius:6px;" src="midi_keyboard.jpg" alt="A compact two-octave MIDI controller keyboard with knobs" />
	<figcaption>A MIDI controller. It sends *note* messages — not sound — to a computer or synth, which is exactly what makes MIDI "music as data": a symbolic score you can edit, quantize and transpose, but which carries no actual audio. \cite[Photo: Melissa Goldsmith, CC BY-SA 4.0]{midi_keyboard_img}</figcaption>
</figure>

#### The raw wave: PCM

The other representation is the **recording** — the air-pressure wave itself, sampled into numbers. This is **PCM** (pulse-code modulation): you measure the pressure of the air many thousands of times a second and store each measurement as a number \cite[How sound is digitized: PCM]{pcm}.

Two numbers govern it all, and the second is a theorem. The **Nyquist–Shannon sampling theorem** says a signal can be perfectly reconstructed only if you sample it **faster than twice its highest frequency** \cite[Nyquist–Shannon sampling theorem]{nyquist_sampling}. Human hearing tops out near 20 kHz, so you must sample above 40 kHz. The Compact Disc standard, the 1980 "Red Book," chose **44,100 samples per second**, each stored as a **16-bit** number (65,536 levels, about 96 dB of dynamic range) \cite[CD-DA and the Red Book]{cd_digital_audio}.

A CD-quality minute of music is therefore about **2.6 million numbers**. That is the raw material — and it is far too dense for any model to chew directly.

<figure style="max-width:880px; margin:1.5em auto; text-align:center;">
	<img style="width:100%; height:auto; border-radius:6px;" src="oscilloscope_waveform.jpg" alt="An oscilloscope displaying a sound waveform" />
	<figcaption>Sound made visible. An oscilloscope shows a tone as a wave over time — a sine wave is a pure single frequency, a square wave is the same note stacked with its odd harmonics. PCM digitizes exactly this: it stamps the height of the wave at 44,100 points per second. \cite[Photo: Xato, public domain]{oscilloscope_waveform_img}</figcaption>
</figure>
</div>

<div class="md">
## From wax to numbers: the audio format story

Before a neural network ever compressed a song, a century of engineers did it by hand — first to *store* sound, then to *shrink* it. The story matters, because the modern neural audio codec is a direct heir of the oldest trick in this part: **throw away what the ear won't notice.**

### Analog: grooves, tape, and the voice in the box

The **phonograph** (Thomas Edison, 1877) cut a spiral groove into wax; a stylus reading the groove turned geometry back into sound. **Magnetic tape** (AEG's Magnetophon, 1935; the Ampex 200 in the US, 1948) recorded a magnetized strip instead — edit by splicing, copy by duplicating. The **vinyl LP** (Columbia, 1948) put a high-fidelity groove on a durable disc, and the **compact cassette** (Philips, 1963) put a tiny tape in your pocket. All of these are *analog*: the groove, the magnetization, the groove again — a continuous physical trace of the wave.

<figure style="max-width:880px; margin:1.5em auto; text-align:center;">
	<img style="width:100%; height:auto; border-radius:6px;" src="vinyl_lp_record.jpg" alt="A 12-inch vinyl LP record seen at an angle" />
	<figcaption>Long-playing record, 1948. The sound lives in the shape of the groove — a purely analog trace. Every copy is a physical re-recording of the wave, which is why records hiss and degrade in a way a digital file never does. \cite[Photo: Evan-Amos, public domain]{vinyl_lp_record_img}</figcaption>
</figure>

### Digital: the Red Book and the number 44,100

The digital era began when sound was converted to the PCM numbers above. **DAT** (Digital Audio Tape, Sony, 1987) digitized studio tape. But the format that changed everything was the **Compact Disc**: launched in **1982** by Sony and Philips, governed by the 1980 **Red Book** standard that fixed audio at **44.1 kHz / 16-bit** \cite[CD-DA and the Red Book]{cd_digital_audio}. A CD does not wear, does not hiss, and can be copied with perfect fidelity — because it stores *numbers*, not grooves.

<figure style="max-width:880px; margin:1.5em auto; text-align:center;">
	<img style="width:100%; height:auto; border-radius:6px;" src="cd_compact_disc.jpg" alt="A compact disc" />
	<figcaption>The compact disc (1982). Its surface is a laser-readable spiral of 0s and 1s — the first mass-market place for the 44.1 kHz / 16-bit PCM standard. \cite[Photo: liamz2r, public domain]{cd_compact_disc_img}</figcaption>
</figure>

### So what was the "first" audio format?

It is a trick question, because "first" depends on which category you mean:

- The first widely-adopted **digital** audio format was the **CD** (1982) — DAT (1987) was the other early digital medium, but it stayed in studios.
- The first popular **lossy-compressed** format was the **MP3** (standardized 1993).

So: *digital* in 1982, *compressed* in 1993.

### Compression and the ear: how MP3 works

The CD solved *storing* sound, but 2.6 million numbers a minute was too big to stream or fit on the small memory of the 1990s. The **MP3** — MPEG-1 Audio **Layer III**, standardized in **1993** by the Fraunhofer Society under Karlheinz Brandenburg, merging Fraunhofer's ASPEC with the French CCETT group's MUSICAM \cite[How MP3 works]{mp3} — solved *shrinking* it, and it did so with a genuinely clever idea: **the ear is not a perfect recorder, so throw away what it cannot hear.**

#### Hiding the loss: psychoacoustics

The ear has blind spots, and MP3 exploits two of them:

- **Simultaneous (spectral) masking**: a loud tone makes quieter tones *at nearby frequencies* inaudible. Play a loud A and a soft B next to it and you stop hearing the B.
- **Temporal masking**: a sudden loud sound blinds the ear for a few milliseconds *before* it (pre-masking) and tens of milliseconds *after* (post-masking).

A psychoacoustic model computes a **masking threshold** at every moment and every frequency — the floor below which sound is inaudible. MP3 then simply does not spend bits there. That is the entire loss: it is *perceptual*, not mathematical.

#### Turning time into frequencies: the MDCT

To act on frequencies, MP3 must move from the time domain (the waveform) to the frequency domain. It does this with the **modified discrete cosine transform (MDCT)**, a cousin of the DCT that chops the signal into short overlapping windows (50% overlap) so the transform has good resolution in both time and frequency \cite[The MDCT]{mdct}. In each window it **allocates bits by sensitivity**: full precision where the ear is sharp, almost nothing where a masking threshold hides it.

<figure style="max-width:880px; margin:1.5em auto; text-align:center;">
	<img style="width:100%; height:auto; border-radius:6px;" src="audio_spectrogram.png" alt="A spectrogram: sound shown as time on the horizontal axis and frequency on the vertical axis, coloured by intensity" />
	<figcaption>A spectrogram — time across, frequency up, brightness for loudness. This is the view a perceptual coder actually works on: MP3's MDCT turns the waveform into a picture like this and then deletes the parts the ear would not miss. A modern neural codec does the same job, but *learns* what to keep. \cite[Image: Sagenat2, CC BY-SA 4.0]{audio_spectrogram_img}</figcaption>
</figure>

The three **layers** of MPEG-1 audio are just three levels of this trade-off (Layer I simplest, Layer II sub-band, **Layer III = MP3** most efficient). The result was a ~10× shrink that *sounded* like the CD — and it became the format of the internet age.

### The heir to MP3: the neural audio codec

MP3's core insight — *discard the inaudible, learned or otherwise* — is exactly what a **neural audio codec** does, but end-to-end and with no hand-designed psychoacoustic model. **SoundStream** (Google, 2021) \cite[Zeghidour et al., 2021]{zeghidour2021soundstream} and **EnCodec** (Meta, 2022) \cite[Defossez et al., 2022]{defossez2022encodec} learn a compression that matches what MP3 achieves at a fraction of the bitrate. And they do it in a way that sets up the deep-learning story perfectly: **they turn the waveform into a short list of discrete codes.** That is the bridge from a song to a sequence a Transformer can read. We will build that codec, brick by brick, in a moment.
</div>

<div class="md">
## The engine: transformers and attention

Before we generate anything, we have to name the machine doing the generating. Both the song-writer and the video-writer are built on the same engine: the **transformer**, whose defining idea is **self-attention** \cite[Vaswani et al., 2017]{vaswani2017attention}. (The full architecture is the subject of the **Attention** chapter; here is how it is used to *generate*.)

### What a transformer block actually does

Strip a modern model to one repeating block and it does four things, in order:

1. **Self-attention** — let every position look at every other position and decide what to blend in.
2. A **feed-forward network** (two matrix multiplies with a non-linearity) applied to each position on its own.
3. A **residual connection** around each of the two — the input is added back, so gradients flow and deep networks train.
4. A **layer norm** to keep the activations at a stable scale.

At the very start, each token is turned into a vector (its **embedding**) plus a **position** signal; at the very end, a linear layer turns the final vectors into a probability over the vocabulary. Stack a few dozen of these blocks and you have GPT, MusicGen, and the denoiser inside Sora.

### Attention: learned "who looks at whom"

Self-attention is the whole trick. Every token produces three vectors: a **query** $Q$ (what am I looking for?), a **key** $K$ (what do I contain?), and a **value** $V$ (what do I contribute?). For one token, attention is:

$$
\text{Attention}(Q, K, V) \;=\; \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right) V
$$

Read it as: *compare my query to everyone's key, turn the matches into weights, and return a weighted blend of everyone's values.* It is **content-based routing** — unlike a convolution, which only looks at fixed neighbours, or a recurrence, which only looks left-to-right, attention can link token 1 directly to token 5000 in a single step. Split the computation across several **heads** (multi-head attention) and the model can track many kinds of relationships at once — melody against harmony, this object against that surface.

### Cross-attention: how the prompt steers the machine

Self-attention lets the model talk to itself. **Cross-attention** lets it talk to *you*. The query still comes from the tokens being generated, but the keys and values come from a **different** sequence — your text prompt, first run through a transformer **encoder** like CLIP \cite[Radford et al., 2021]{radford2021clip} or T5. At every step the model asks the words in your prompt "which part of this should you be steering?" The word *"cello"* claims the low, warm frequencies; *"fast"* claims the tempo. This is the same mechanism that makes a text-to-*image* model paint what you ask for — the reason your prompt has any effect at all.

### Position: how the model knows "next"

A raw sequence has no built-in sense of order, so the model is given **positional encodings** — a signal telling each token where it sits in the sequence (a learned vector, or a smooth function of its index). For music and video this is essential: *order is the whole point*. A melody is a specific order of notes; a video is a specific order of frames. In Sora the position signal is **three-dimensional**, because a token's "where" has width, height, *and* time.

### Why transformers won

You could have built these machines on older ideas — recurrent networks like WaveNet \cite[van den Oord et al., 2016]{oord2016wavenet} did, at first. They mostly lost for the reason Rich Sutton called **the Bitter Lesson** \cite[Sutton, 2019]{sutton2019bitter}: methods that scale with compute and data beat cleverly hand-crafted ones. The transformer's **next-token** objective is *modality-agnostic* — it does not care whether the tokens are words, audio codes, or video patches — and attention gives it long-range reach at fixed depth. Same architecture, new vocabulary, more data. That is the whole recipe, and it is why one codebase keeps becoming the next breakthrough.
</div>

<div class="md">
## The two ways to generate

Given a tokenizer that turns a signal into tokens, and a transformer engine, there are **two** fundamentally different ways to turn "a prompt" into "a song" or "a clip." They are both transformers at the core; they differ in *how the sequence is produced*. Knowing both is the key to reading every paper in this field.

### Family A: write it token by token (autoregressive)

This is the LLM way, applied to sound. The model predicts the **next token** given everything so far — exactly as GPT predicts the next word — and it just keeps going.

#### Next-token prediction, made musical

At each step the network outputs a score for every code in the codec's vocabulary, a **softmax** turns that into a probability, and you **sample** one token. The sampling knob is where the *dice* come back into a story that began with dice:

- **Temperature** divides the scores before the softmax. High temperature flattens the distribution (more surprises); low temperature sharpens it (more predictable).
- **Top-k** \cite[Fan et al., 2018]{fan2018topk} keeps only the $k$ most likely tokens and discards the rest.
- **Top-p (nucleus)** \cite[Holtzman et al., 2019]{holtzman2019nucleus} keeps the smallest set of tokens whose probabilities add up to $p$.

Change these knobs and you change how "on the nose" or "creative" a generated track sounds. It is the same sampling a chatbot uses to decide how to phrase its next sentence.

#### Building a song in layers

A whole song is too long to predict flatly, so the serious autoregressive machines build it **coarse-to-fine**, in layers of tokens at different rates:

- **AudioLM** (Google, 2023) first autoregressively writes low-rate **semantic tokens** that carry long-range structure — *this is the verse, the harmony drifts here* — and then a second, non-autoregressive stage fills in the high-rate **acoustic tokens** (the actual codec codes) that a decoder turns back into sound \cite[Borsos et al., 2023]{borsos2023audiolm}.
- **MusicLM** (Google, 2023) does the same as a hierarchy: a **slow** transformer lays down melody, harmony and rhythm over long timescales, a **fast** transformer adds timbre and detail, and a vocoder renders audio — which is what lets it stay coherent for *minutes* \cite[Agostinelli et al., 2023]{agostinelli2023musiqlm}.
- **MusicGen** (Meta, 2023) is the lean, open, fast version: a single transformer over EnCodec's stacked codebooks, writing them token by token, steered by a text embedding \cite[Copet et al., 2023]{copet2023musicgen}.

</div>

<div class="smart-quote" data-cite="agostinelli2023musiqlm">
MusicLM generates high-fidelity music from text descriptions such as "a calming violin melody backed by a distorted guitar riff", remaining consistent over several minutes.
</div>

<div class="md">
### Family B: sculpt it out of noise (diffusion)

The other family does not write tokens in order. It **denoises**. Start from pure static, and learn to push it — a little at a time — into a coherent signal, the way an image emerges from ink in water. (The full forward/reverse math is the **Diffusion Models** chapter \cite[Ho et al., 2020]{ho2020ddpm}; here is how it is applied to sound and video.)

#### The latent space and the denoiser

You do not denoise 2.6 million waveform numbers or a million video pixels directly — it is too expensive. First a **variational autoencoder** (a VAE, \cite[Kingma & Welling, 2013]{kingma2014vae}) compresses the signal into a small **latent** space that keeps the important content and throws away the predictable detail. The diffusion process then runs in this compact space: a network is trained to predict *the noise that was added* at each of many steps, and at generation time you start from random latent noise and denoise it step by step until a clean, novel clip or track appears \cite[Rombach et al., 2022]{rombach2022ldm}.

#### Classifier-free guidance: obeying the prompt

To make the denoiser follow your words, **classifier-free guidance** is used \cite[Ho & Salimans, 2022]{ho2022cfg}. During training the prompt is dropped some fraction of the time, so the model learns both "what a signal looks like" and "what it looks like *given this prompt*." At inference the two are combined, and the gap is amplified by a scale $w$:

$$
\tilde\epsilon \;=\; \epsilon_{\varnothing} \;+\; w \big(\epsilon_{\text{prompt}} - \epsilon_{\varnothing}\big)
$$

The bigger $w$, the more faithfully the output follows the prompt (at the cost of a more generic look). It is the prompt-knob for the diffusion family, playing the same role as temperature plays for the autoregressive family.

### The Diffusion Transformer: the unlock for video

The original diffusion denoisers were **U-Nets** — convolutional image networks. In 2023, Peebles and Xie showed you can replace the U-Net with a **transformer that operates on patches** of the latent — a **Diffusion Transformer, or DiT** \cite[Peebles & Xie, 2023]{peebles2023dit}. Two changes make it a big deal:

- The latent is cut into a grid of **patches**, each patch becoming a **token**, and the transformer attends over all of them — so the denoiser is now structurally *the same family* as an LLM.
- The timestep and the prompt are injected by **modulating the layer norms** (a trick called **adaLN**) rather than stitched in by hand, so the model always knows *how noisy* the input is and *what it was asked for*.

This was the architectural unlock for video: once the denoiser was a transformer over patches, you could scale it with everything else — and that is exactly what Sora did.
</div>

<div class="md">
## Video: the same engine, one dimension up

Now the same story, one dimension up. A video is a stack of frames plus **time**, so the questions are the same three — *how do you represent it, how do you learn it, how do you tell it what to show?* — and the answers mirror the audio ones almost one for one.

### Analog moving pictures

The **cinema** began with the Lumière brothers' paid screenings in 1895: a strip of perforated film, a frame at a time, fast enough to look like motion. Home video came decades later as a **format war**: **Betamax** (Sony, 1975) against **VHS** (JVC, 1976), the latter winning; **LaserDisc** followed in 1978. The first consumer *digital* video format was the **DVD** (1996) — MPEG-2 video on an optical disc.

<figure style="max-width:880px; margin:1.5em auto; text-align:center;">
	<img style="width:100%; height:auto; border-radius:6px;" src="film_strip_35mm.jpg" alt="A 35 millimetre cinema film strip with visible perforations" />
	<figcaption>35 mm film: motion is an illusion built from a chain of still frames, one at a time. The digital video that replaced it kept the "frames over time" idea and threw away the film. \cite[Photo: mannyisdead, CC BY 3.0]{film_strip_35mm_img}</figcaption>
</figure>

<figure style="max-width:880px; margin:1.5em auto; text-align:center;">
	<img style="width:100%; height:auto; border-radius:6px;" src="vhs_cassette.jpg" alt="A VHS videocassette, front view" />
	<figcaption>VHS (1976), the analog home-video winner. A spinning helical head reads a magnetized tape — analog all the way through, until the DVD and the internet made video digital. \cite[Photo: LoMit, CC BY-SA 4.0]{vhs_cassette_img}</figcaption>
</figure>

### How a video codec really works

Compressing video is a different game from compressing a single image, and the difference is the *killer feature*: **temporal redundancy**. In a video, almost everything in frame $t$ is the same as in frame $t-1$ — the background barely moves, the person moves a little. A video codec's entire job is to store only what *changed*.

#### Frames that borrow from their neighbours

Video is a sequence of **frames**, and codecs classify them into three types \cite[How video is compressed]{video_compression}:

- An **I-frame** (intra) is a complete picture, encoded on its own like a JPEG. It is the anchor, the keyframe every other frame leans on.
- A **P-frame** (predictive) stores only the *difference* from the previous anchor, plus a **motion vector** saying how much each piece moved.
- A **B-frame** (bi-directional) is predicted from the nearest anchor *in front of it and behind it*, giving the best compression — at the cost of being decoded out of order.

#### Within a frame and across frames

There are two compression moves, and together they are why a movie fits on a disc. **Within a frame (intra):** each 8×8 block of pixels is run through a **discrete cosine transform (DCT)**, turning it into frequencies; the high frequencies the eye barely sees are coarsely quantized (the lossy part), then entropy-coded \cite[The DCT]{dct}. **Across frames (inter):** **motion compensation** finds where each block moved since the last frame and stores the motion vector plus a small residual, instead of the whole block.

<figure style="max-width:880px; margin:1.5em auto; text-align:center;">
	<img style="width:100%; height:auto; border-radius:6px;" src="h264_coding_structure.jpg" alt="A diagram of the coding structure of H.264/AVC for a macroblock, showing intra and inter prediction paths" />
	<figcaption>The coding structure inside H.264/AVC for a single block: on the left, *intra* prediction (guess from neighbours in the same frame) and *inter* prediction (guess from a previous frame using a motion vector) both feed a DCT, quantization and entropy coding. This tiny diagram is the skeleton of almost every video you have ever streamed. \cite[Diagram: Alexandre Rebollal Lucas, public domain]{h264_coding_structure_img}</figcaption>
</figure>

The codec race is a long list of ever-better versions of exactly this: **MPEG-1** (1993, the first practical consumer digital video standard) → **H.264/AVC** (2003, the format of the streaming age) → **H.265/HEVC** (2013, ~half the bitrate) → **VP9** (2014) → **AV1** (2018, royalty-free, from the Alliance for Open Media) \cite[H.264/AVC]{h264} \cite[AV1]{av1}.

### The video tokenizer and the data

Just as audio got a neural codec, video got a **tokenizer**. In 2021, **VideoGPT** used a **VQ-VAE** to compress a video into **discrete spatio-temporal tokens** and then let a GPT-style model *write* the video token by token \cite[Yan et al., 2021]{yan2021videogpt} \cite[The VQ-VAE]{vq_vae}. **Video became a paragraph, too.**

The data problem is the same as for images and audio: you need millions of (clip, description) pairs. **WebVid-10M** (2021) scraped about ten million weakly-labelled video-text pairs from the web — the "LAION of video" \cite[Bain et al., 2021]{bain2021webvid}. And the modern models go a step further and **re-caption** their clips: a powerful vision-language model rewrites a rich, accurate description for each clip, so the words actually match the pixels — the trick DALL·E 3 made famous.

### Sora: a diffusion transformer that dreams a world

**Sora** (OpenAI, February 2024) ties every thread together \cite[Sora (OpenAI, 2024)]{brooks2024sora}. Its pipeline is a direct descendant of everything above:

- A **3D video autoencoder** (a VAE) compresses the clip into a latent space, in space *and* time.
- The latent is cut into **spacetime patches** — small 3D cubes of pixels spanning a patch of an image *and* a few frames — and **those patches are the tokens**. (An image is just a video with one frame, so images and videos share one representation.)
- A **diffusion transformer** — the DiT of the previous section — denoises those 3D tokens, conditioned on the text prompt.

The remarkable part is not the pipeline but what *emerges at scale*. With no explicit 3D training signal, Sora begins to show **3D consistency** (objects move coherently as the camera orbits), **object permanence** (a character stays the same character across shots), and simple **physical interaction** (a painter's strokes persist; a bitten burger keeps its bite marks). OpenAI frames scaling video models as "a promising path towards building general-purpose simulators of the physical world."

<div class="smart-quote" data-cite="brooks2024sora">
Scaling video generation models is a promising path towards building general purpose simulators of the physical world.
</div>

That is the 2018 **World Models** dream — let a network learn a compressed model of an environment and act inside its own dream \cite[Ha & Schmidhuber, 2018]{ha2018worldmodels} — finally realized at internet scale. The caveats are real: it still gets physics wrong (glass that will not shatter like glass, food that will not run out), and long clips drift. But the direction is unmistakable. A machine is learning to *dream a plausible world from a seed.*
</div>

<div class="md">
## Bringing it all together

### How it works with the LLM, in one breath

You have probably been wondering how any of this connects to a language model. Here is the whole answer:

There are **two families**, and both are transformers with attention at their core.

- **Autoregressive over tokens** (AudioLM, MusicGen, VideoGPT): the codec turns the signal into tokens, and the model predicts the *next token*, exactly like an LLM predicts the next word. Here the language model **is** the generator — it literally writes the audio or video, code by code.
- **Diffusion over latents** (Imagen Video, Stable Video Diffusion, Sora, AudioLDM): the signal lives in a continuous latent space, and a **diffusion transformer** learns to denoise it, while a transformer *encoder* reads the prompt and **classifier-free guidance** pushes the output toward it \cite[Liu et al., 2023]{liu2023audioldm}.

Either way the backbone is the same architecture that runs the chatbot you are reading this on. The **only** genuinely new ingredient per modality is the **tokenizer** — the learned codec that turns sound or frames into a vocabulary the Transformer can speak. Change the tokenizer, keep the engine.

### How much data, and how it lands in the tensors

**Music.** The *conditioning* data can be tiny — MusicCaps is only 5,500 description-and-music pairs \cite[MusicCaps, with MusicLM]{agostinelli2023musiqlm}. But the *audio* the model learns from is enormous: tens of thousands of hours of music. Each clip is chopped into short frames; the codec encoder maps each frame to a handful of discrete codes (roughly 75 to a few hundred per second). A three-minute song is then only on the order of $10^{4}$ to $10^{5}$ codes — **about the length of a short essay.** The network never stores the songs; it learns the *statistics* of what music sounds like, compressed into its weights.

**Video.** Sora trains on a **web-scale** corpus of clips at their native lengths, resolutions and aspect ratios \cite[Sora (OpenAI, 2024)]{brooks2024sora}. Each clip is compressed to a latent, cut into spacetime patches, and those patches become the token sequence. One second of high-definition video can be a large grid of patch-tokens; a minute is a long sequence the transformer must hold in mind. And every clip is **re-captioned** so the words match the pixels.

The common thread: **the vocabulary is not letters, it is learned codes — and the corpus is internet-scale.** The model is not a hard drive of every song and clip ever made. It is a *compressed statistical model of the space of possible sounds and scenes*, and generating is *sampling* from that space, guided by your prompt.

### The flood, and the questions it raises

The effects arrived fast. By late 2025, Deezer reported on the order of **50,000 AI-generated tracks uploaded a day — about a third of all uploads** — and began auto-tagging them and keeping them out of human-curated playlists; an AI-made country song reached the top of a Billboard chart. The law has not caught up: in the US the Copyright Office holds that **purely AI-generated works are not copyrightable** (no human author), and in the EU originality likewise requires a human's fingerprint. Meanwhile the labels fight back — **Universal Music Group and Sony Music sued Suno** for training on their catalog. So the field sits in a gap: a technology that can copy any voice or style, inside a legal system built on the assumption that a person made the thing.

> In short. Same engine, two senses: *compress the signal into tokens, run a Transformer over them, steer it with a text embedding.* That one sentence is Suno, Udio, MusicGen, VideoGPT, Sora and the rest. Everything else is scale.
</div>

<div class="md">
## The question, answered — differently

Zoom out and the story is one long arc with two turns. The first was philosophical: *remove the composer's hand* — Mozart's dice, Cage's stalks, Mälzel's self-playing organ, Xenakis' probabilities. The second is the one this chapter is about: *stop writing the rules, and let a big model infer them from the world* — until the machine can, from a sentence, dream a song or a world.

Music generation and video generation look like two different miracles to a first-time user. They are the same miracle seen from two angles: **a signal, compressed into tokens, then written by a transformer.** The dice are still there — a diffusion model "rolls the dice" in latent space at every denoising step, and a language model rolls them at every sampling step — but now the dice are guided by a prompt, and the table they roll on is a statistical model of reality.

Three centuries after Mozart rolled the dice, the question "can a machine make something that feels made?" has a working, if contested, *yes*. The open questions are the human ones — who made it, who owns it, and what we do with a machine that can dream in audio and video.
</div>
