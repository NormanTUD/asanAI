<?php include_once("functions.php"); ?>

<div class="md">
Training a model costs millions of dollars — but **serving** it costs millions *per day*. Inference optimization makes LLMs practical to deploy.

### Quantization

Reduce the precision of model weights from 32-bit floats to 8-bit or 4-bit integers. The model gets smaller and faster with minimal quality loss (\cite[Dettmers et al., 2022]{dettmers2022llmint8}).

$$
W_{\text{float32}} \overset{\text{quantize}}{\longrightarrow} W_{\text{int8}} \quad \Rightarrow \quad 4\times \text{ smaller}, \sim 2\text{--}3\times \text{ faster}
$$

| Precision | Bits/weight | Model size (7B params) | Quality loss |
|-----------|-------------|------------------------|--------------|
| FP32 | 32 | 28 GB | Baseline |
| FP16 | 16 | 14 GB | Negligible |
| INT8 | 8 | 7 GB | ~1% |
| INT4 | 4 | 3.5 GB | ~3–5% |

### KV-Cache

During autoregressive generation, the model recomputes attention over all previous tokens at each step. The **KV-cache** stores the Key and Value matrices from previous tokens so they don't need to be recomputed (\cite[Pope et al., 2023]{pope2023efficiently}):

$$
\text{Without cache: } O(n^2) \text{ per token} \qquad \text{With cache: } O(n) \text{ per token}
$$

The tradeoff: the cache grows linearly with sequence length and consumes GPU memory.

### Speculative Decoding

Use a small, fast **draft model** to generate $k$ candidate tokens, then verify them in parallel with the large model. If the large model agrees, you get $k$ tokens for the cost of ~1 forward pass \cite[Leviathan et al., 2023]{leviathan2023speculative}.

$$
\underbrace{\text{Draft model 1B}}_{\text{fast, imprecise}} \overset{k \text{ tokens}}{\longrightarrow} \underbrace{\text{Main model 70B}}_{\text{slow, precise, verifies in parallel}} \rightarrow 2\text{--}3\times \text{ speedup}
$$

### Distillation

Train a small **student** model to mimic the outputs of a large **teacher** model. The student learns the teacher's "dark knowledge" — the full probability distribution over tokens, not just the top-1 answer (\cite[Hinton et al., 2015]{hinton2015distilling}).

$$
\mathcal{L}_{\text{distill}} = \text{KL}\bigl(\, p_{\text{teacher}}(\cdot \mid x) \,\Vert\, p_{\text{student}}(\cdot \mid x) \,\bigr)
$$

| Technique | What it saves | Tradeoff |
|-----------|---------------|----------|
| Quantization | Memory + compute | Slight quality loss |
| KV-Cache | Redundant computation | Memory usage grows |
| Speculative decoding | Latency | Needs a good draft model |
| Distillation | Deploy smaller model | One-time training cost |
</div>

<div id="seclab-quant-demo"></div>
