<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Speech & Audio Models
description: Whisper, TTS, music generation — how sound becomes tokens and back again.
icon: &#127908;
part: 4
order: 29
color: sky
-->

<div class="md">
Sound is the **last major modality** that LLMs learned to read and write. As of 2025, frontier models (GPT-4o, Gemini, Voxtral, Qwen2-Audio) handle audio natively — taking voice input, generating speech, transcribing languages, recognizing emotion, even singing.

This chapter covers how audio is represented, how it is encoded and decoded, and how Transformer-based models learn to listen and speak.
</div>

<div class="md">
## From Waveform to Tokens: Three Representations

A raw audio waveform is a 1-D signal sampled at 16 kHz or 44.1 kHz — a sequence of 16,000 to 44,100 floats **per second**. That is too dense for any model to ingest directly. Modern systems compress audio through one of three representations:

### 1. Spectrograms (and Mel-spectrograms)

A spectrogram is a 2-D representation: **time on the x-axis, frequency on the y-axis, intensity as colour**. It is computed by Short-Time Fourier Transform (STFT): split the waveform into 20–40 ms windows, compute the magnitude of the FFT, stack them.

$$
S(t, f) = \left| \sum_{n=0}^{N-1} x(n + tH)\, w(n)\, e^{-2\pi i f n / N} \right|
$$

where $w$ is a window function (Hann, Hamming) and $H$ is the hop size.

**Mel-spectrograms** warp the frequency axis to the **mel scale**, which approximates human pitch perception (logarithmic in frequency). A 10-second clip at 16 kHz becomes a mel-spectrogram of shape $(\text{mel bins}, \text{time frames}) \approx (80, 500)$.
</div>

<div id="spectrogram-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
### 2. Neural Audio Codecs (the modern approach)

For an LLM to "read" audio as discrete tokens (like text tokens), a **neural codec** compresses audio into a stream of integers. Examples:

* **SoundStream** (Google, 2021): 24 kHz mono audio → discrete codes at 6–24 kbps.
* **EnCodec** (Meta, 2022): 24 kHz stereo → discrete codes; uses a residual vector quantizer.
* **DAC** (Descript, 2023): improved quality at low bitrates.
* **Whisper's log-mel**: not discrete, but the de facto input for ASR models.

The codec has an **encoder** $E: \text{waveform} \to \mathbb{Z}^{T \times n_q}$ (frames × codebook entries) and a **decoder** $D: \mathbb{Z}^{T \times n_q} \to \text{waveform}$. With $n_q = 8$ codebooks and 75 frames per second, audio becomes 600 tokens per second — comparable in density to text.
</div>

<div id="codec-viz" style="max-width:880px; margin:1em auto;"></div>

<div class="md">
### 3. Self-Supervised Representations

Models like **wav2vec 2.0**, **HuBERT**, and **WavLM** learn speech representations by masking spans of audio and predicting the discrete latent units of a teacher model. The output is a sequence of 50 Hz contextualized vectors — perfect input for downstream ASR, speaker ID, or emotion recognition.
</div>

<div class="md">
## Speech Recognition: Whisper and Friends

**Whisper** (Radford et al., OpenAI, 2022) is the dominant open ASR model. Architecture:

* **Input**: 30-second audio chunks, converted to 80-channel log-mel spectrograms (frames at 50 Hz).
* **Encoder**: standard Transformer (ViT-style for the convolutional stem), processes the spectrogram into hidden states.
* **Decoder**: autoregressive Transformer that produces text tokens.
* **Training**: 680,000 hours of weakly-supervised multilingual audio with transcribed captions.

The model is trained with a multi-task objective: transcribe, translate to English, detect language, timestamp. Whisper-large-v3 (2023) achieves under 3% word error rate on clean English and ~10% on noisy multilingual.

**Conformer** (Gulati et al., Google, 2020) is the dominant architecture for streaming ASR. It combines convolutions (for local patterns) with self-attention (for global context) in each block. USM (Google, 2023) and SeamlessM4T (Meta, 2023) extend this to 100+ languages.
</div>

<div class="md">
## Text-to-Speech: From Tacotron to Neural Codec Models

TTS has three historical generations:

1. **Concatenative TTS** (pre-2016): stitch pre-recorded phoneme fragments. Robotic.
2. **Neural spectrogram models** (Tacotron 2, 2017): encoder–decoder produces a mel-spectrogram, a separate **vocoder** (WaveNet, WaveGlow) converts it to waveform.
3. **Codec-based models** (VALL-E, Bark, SoundStorm, 2023+): treat speech as discrete codec tokens; a Transformer LLM predicts them; the codec decoder converts to waveform. Voice cloning from a 3-second reference sample becomes trivial.

VALL-E 2 (2023) achieved human parity on LibriSpeech by treating speech as a sequence of discrete codec tokens and predicting them autoregressively, conditioned on the text and a short reference audio clip. Each output token is sampled from `P(token_t | token_<t, text, reference audio)` — the same next-token recipe used for text, applied to sound. The breakthrough was the codec: speech tokens are now as tractable as BPE tokens.
</div>

<div class="md">
## Music Generation

* **Jukebox** (OpenAI, 2020): VQ-VAE on raw audio + autoregressive Transformer. Slow, hours of music.
* **MusicGen** (Meta, 2024): single-pass Transformer over EnCodec tokens, conditioned on text and (optionally) melody.
* **Suno / Udio** (2024): closed-source, end-to-end text → song with vocals and instruments. Industry-leading quality.
* **Stable Audio** (Stability AI, 2024): latent diffusion over audio spectrograms.

All rely on the same principle: **audio as a sequence of discrete tokens** + autoregressive or diffusion generation.
</div>

<div class="md">
## Unified Speech–Text Models (2024+)

The frontier is a single Transformer that handles text, audio, and image tokens interchangeably:

* **GPT-4o** (OpenAI, 2024): real-time voice conversation with emotional nuance. Audio tokens are interleaved with text tokens in one residual stream.
* **Gemini 1.5/2** (Google): native audio understanding (transcription, translation, classification) and generation.
* **Voxtral** (Mistral, 2025): open-weight 24B audio model.
* **Qwen2-Audio** (Alibaba, 2024): open-weights audio chat model.

The training data for these is massive: trillions of audio-text interleaved examples. Internally, audio is encoded into the LLM's vocabulary; the model is trained as a normal next-token predictor.
</div>

<div class="md">
## Key Concepts Recap

| Concept | Reference | Key formula/idea |
|---------|-----------|------------------|
| Spectrogram | Time × Frequency | STFT magnitude |
| Mel-spectrogram | Perceptually warped frequency | $\text{mel}(f) = 2595 \log_{10}(1 + f/700)$ |
| Neural codec | Discrete audio tokens | $D(E(x)) \approx x$ |
| Whisper | Encoder–decoder Transformer | 80-mel input → text tokens |
| VALL-E | Codec-LM TTS | $P(\text{tokens} \mid \text{text}, \text{reference})$ |
| Conformer | Conv + Attention | Local + global context per layer |
| Unified multimodal | Text + audio tokens | One Transformer for both |

The shift from "speech recognition" (separate ASR model) and "speech synthesis" (separate TTS model) to **one model that speaks and listens** is now complete in 2025. The remaining frontier is **real-time, low-latency, expressive speech** — natural conversation rather than turn-taking.
</div>

<script>
// Spectrogram visualization: time vs frequency
(function() {
	const c = document.getElementById('spectrogram-viz');
	if (!c) return;

	const T = 100, F = 40;
	const z = [];
	for (let f = 0; f < F; f++) {
		const row = [];
		for (let t = 0; t < T; t++) {
			// Synthesize "speech-like" pattern: formant frequencies that drift
			const formant1 = Math.exp(-Math.pow((f - 12 - 4*Math.sin(t*0.05)) / 3, 2));
			const formant2 = Math.exp(-Math.pow((f - 24 - 6*Math.sin(t*0.03)) / 3, 2)) * 0.6;
			const noise = Math.random() * 0.05;
			row.push(formant1 + formant2 + noise);
		}
		z.push(row);
	}

	Plotly.newPlot('spectrogram-viz', [{
		z, type: 'heatmap',
		colorscale: [[0, '#0f172a'], [0.3, '#1e3a8a'], [0.6, '#fbbf24'], [1, '#fef3c7']],
		showscale: true,
		colorbar: { title: 'dB', thickness: 12 }
	}], {
		title: { text: 'Mel-spectrogram: time × mel-frequency × intensity', font: { size: 13 } },
		xaxis: { title: 'time (frames, 50 Hz)', showticklabels: false },
		yaxis: { title: 'mel-frequency', autorange: 'reversed', showticklabels: false },
		margin: { t: 50, b: 50, l: 60, r: 30 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)'
	}, { responsive: true });
})();

// Codec: waveform → tokens → waveform
(function() {
	const c = document.getElementById('codec-viz');
	if (!c) return;

	const N = 200;
	const samples = Array.from({length: N}, (_, i) => Math.sin(i * 0.2) * 0.5 + Math.sin(i * 0.7) * 0.3);

	// Quantize to discrete tokens (round to 16 levels)
	const levels = 16;
	const tokens = samples.map(v => Math.round((v + 1) / 2 * (levels - 1)));

	const box = (x0, y0, w, h, color) => ({
		type: 'rect', xref: 'x', yref: 'y', x0, x1: x0 + w, y0, y1: y0 + h,
		fillcolor: color, line: { color: 'rgba(0,0,0,0.3)', width: 0.5 }
	});

	const shapes = tokens.map((t, i) => box(i, 0, 1, t / (levels - 1) * 4 + 0.3, '#0ea5e9'));

	Plotly.newPlot('codec-viz', [
		{ y: samples.map(v => v + 5.5), mode: 'lines', line: { color: '#22c55e', width: 1.5 }, name: 'waveform' },
		{ x: tokens.map((_, i) => i + 0.5), y: tokens.map(t => t / (levels - 1) * 4 + 0.3), mode: 'markers', marker: { symbol: 'square', size: 8, color: '#ef4444' }, name: 'codec tokens' }
	], {
		title: { text: 'Audio codec: continuous waveform → discrete tokens (one token per ~13 ms)', font: { size: 13 } },
		xaxis: { range: [0, N], showticklabels: false, showgrid: false, zeroline: false },
		yaxis: { range: [-1, 7], showticklabels: false, showgrid: false, zeroline: false },
		margin: { t: 50, b: 30, l: 30, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		shapes,
		legend: { x: 0.02, y: 0.98 }
	}, { responsive: true });
})();


async function loadSpeechAudioModule() {
	updateLoadingStatus("Loading section about Speech & Audio Models...");
	return Promise.resolve();
}
</script>
