<?php include_once("functions.php"); ?>

<div class="md">
When we peer inside a Transformer, we don't find a single monolithic algorithm. Instead, we find **circuits**: small subnetworks of attention heads and MLP neurons that collaborate to perform specific, interpretable computations. This is the central finding of \cite[Mechanistic Interpretability]{elhage2021mathematical}, a research program that reverse-engineers neural networks the way an electrical engineer reverse-engineers a circuit board.

## What is a Circuit?

A circuit in a neural network is a computational subgraph: a subset of model components (attention heads, MLP layers, embeddings) connected via the \cite[residual stream]{elhage2021mathematical} that together implement a specific input-output behavior. Just as an electronic circuit board contains specialized sub-circuits for power regulation, signal amplification, and logic gates, a Transformer contains sub-circuits for tasks like "copy the previous token," "find the subject of a sentence," or "look up factual associations."

The key insight from \cite[Elhage et al. (2021)]{elhage2021mathematical} is that the **residual stream** acts as a shared communication bus. Each attention head and MLP layer reads from this bus, performs a computation, and writes its result back. Circuits emerge when specific heads learn to "talk to each other" through this shared medium.

$$\underbrace{x_0}_{\text{embedding}} \xrightarrow{+h_1} \xrightarrow{+h_2} \xrightarrow{+\text{MLP}_1} \xrightarrow{+h_3} \cdots \xrightarrow{+h_L} \underbrace{x_L}_{\text{unembedding}}$$

Each arrow represents an additive contribution to the residual stream. A "circuit" is a subset of these contributions that accounts for a particular behavior.

## The Residual Stream as a Communication Bus

In a standard Transformer with $L$ layers, each containing multi-head attention and an MLP, the residual stream at position $i$ after all layers is:

$$x_i^{(\text{final})} = x_i^{(0)} + \sum_{\ell=1}^{L} \left( \underbrace{\sum_{h=1}^{H} \text{Attn}_h^{(\ell)}(x^{(\ell-1)})_i}_{\text{attention heads}} + \underbrace{\text{MLP}^{(\ell)}(x^{(\ell-1)})_i}_{\text{MLP layer}} \right)$$

where $x_i^{(0)}$ is the token embedding plus positional encoding. Every component's output is simply **added** to the stream. This additive structure is what makes circuits decomposable: we can isolate the contribution of any subset of components.

## Three Fundamental Circuit Motifs

Research has identified several recurring circuit patterns in Transformers \cite[Olsson et al., 2022]{olsson2022induction}:

### 1. Direct Path (Token Identity)
The simplest "circuit" is no circuit at all: the embedding of a token flows directly through the residual stream to the unembedding, without being significantly modified by any attention head or MLP. This implements a **bigram model**: predicting the next token based solely on the identity of the current token.

### 2. Induction Heads (Pattern Completion)
\cite[Induction heads]{olsson2022induction} are perhaps the most important circuit discovered so far. They implement the following algorithm:

"If I've seen the pattern $[A][B] \ldots [A]$, predict $[B]$."

This requires **two attention heads working together** across two layers:

- **Head 1 (Previous Token Head):** In an early layer, this head attends from each token to the token *before* it, effectively computing "what came before me?" It writes this information into the residual stream.
- **Head 2 (Induction Head):** In a later layer, this head uses the information written by Head 1 to search for previous occurrences of the current token's predecessor pattern, then copies what followed.

$$\underbrace{[\text{...} A \; B \; \text{...} \; A]}_{\text{context}} \xrightarrow{\text{Head 1: prev-token}} \xrightarrow{\text{Head 2: pattern match}} \text{predict } B$$

### 3. Indirect Object Identification (IOI)
The \cite[IOI circuit]{wang2022interpretability} in GPT-2 small handles sentences like:

"When Mary and John went to the store, John gave a drink to ___"

The circuit must identify that "Mary" is the indirect object (the answer), not "John" (who is the subject). This requires a sophisticated collaboration of multiple attention heads across multiple layers, organized into functional groups:

- **Duplicate Token Heads:** Detect that "John" appears twice
- **S-Inhibition Heads:** Suppress the repeated name
- **Name Mover Heads:** Copy the remaining name ("Mary") to the output

## How Circuits Are Discovered

The process of finding circuits involves several techniques \cite[Conmy et al., 2023]{conmy2023automated}:

1. **Activation Patching:** Replace the activation of a component with its value on a different input. If the model's output changes significantly, that component is important for the task.

2. **Path Patching:** A more targeted version that traces the effect of one component on another through specific paths in the computational graph.

3. **Ablation:** Zero out or mean-ablate a component's contribution. The resulting change in loss indicates the component's importance.

4. **Automated Circuit Discovery (ACDC):** An algorithm that systematically tests edges in the computational graph to find the minimal subgraph that explains a behavior.

## Interactive Exploration

Below, you can explore how these circuits work in practice. We simulate a small Transformer and let you trace information flow through the residual stream, activate or deactivate individual heads, and see how circuits collaborate to produce predictions.
</div>

<div id="circuits-container"></div>

<div class="md">
## The QKV Mechanism: How Attention Heads Compute

Each attention head computes three projections of the residual stream \cite[Section 2]{elhage2021mathematical}:

$$Q = W_Q x, \quad K = W_K x, \quad V = W_V x$$

The attention pattern is:
$$A = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)$$

And the output is:
$$\text{head}(x) = W_O \cdot (A \cdot V)$$

The key insight is that $W_Q^T W_K$ determines **what the head looks for** (the QK circuit), while $W_O W_V$ determines **what information gets moved** (the OV circuit). These can be analyzed independently.

### The QK Circuit: "Where to Look"

The QK circuit computes a bilinear form that determines the attention pattern:

$$\text{Attention}_{i \to j} \propto \exp\left(x_i^T \underbrace{W_Q^T W_K}_{\text{QK matrix}} x_j / \sqrt{d_k}\right)$$

If we decompose $W_Q^T W_K$ in the token embedding basis, we can read off which token pairs have high mutual attention.

### The OV Circuit: "What to Copy"

The OV circuit determines what information flows when attention is paid:

$$\text{Output contribution} = W_O W_V \cdot x_{\text{source}}$$

The matrix $W_O W_V$ maps source token representations to output contributions. For a "copying" head, this matrix approximates the identity in the relevant subspace.
</div>

<div id="qkv-explorer-container"></div>

<div class="md">
## Superposition: When Features Outnumber Dimensions

A critical challenge in understanding circuits is \cite[superposition]{elhage2022superposition}: the phenomenon where a model represents more features than it has dimensions, by encoding features as nearly-orthogonal directions in the residual stream.

In a model with $d_{\text{model}} = 768$ dimensions, you might expect at most 768 independent features. But in practice, models represent thousands of interpretable features by exploiting the geometry of high-dimensional spaces: in high dimensions, you can pack exponentially many nearly-orthogonal vectors.

$$\text{Feature } f_i \approx \hat{d}_i \cdot x \quad \text{where } \hat{d}_i \cdot \hat{d}_j \approx 0 \text{ for } i \neq j$$

This means that individual neurons rarely correspond to single interpretable features. Instead, features are distributed across neurons, and neurons participate in multiple features. This is why \cite[sparse autoencoders]{cunningham2023sparse} have become an important tool: they learn to decompose the residual stream into a larger set of interpretable, sparsely-activating features.
</div>

<div id="superposition-container"></div>

<div class="md">
## Composition: How Heads Talk to Each Other

The most powerful circuits arise from **composition**: when the output of one head becomes the input to another \cite[Section 3]{elhage2021mathematical}. There are three types:

### Q-Composition
Head B uses the output of Head A as its query:
$$Q_B = W_Q^B \cdot (\underbrace{x + \text{head}_A(x)}_{\text{residual after A}})$$

Head A's output changes *what Head B looks for*.

### K-Composition
Head B uses the output of Head A as its key:
$$K_B = W_K^B \cdot (x + \text{head}_A(x))$$

Head A's output changes *what Head B attends to*.

### V-Composition
Head B uses the output of Head A as its value:
$$V_B = W_V^B \cdot (x + \text{head}_A(x))$$

Head A's output changes *what information Head B moves*.

Induction heads are the canonical example of **K-composition**: the previous-token head writes information that the induction head uses in its key computation to find matching patterns.
</div>

<div id="composition-explorer-container"></div>

<div class="md">
## Activation Patching: The Surgeon's Scalpel

\cite[Activation patching]{meng2022locating} is the primary experimental technique for identifying which components matter for a given behavior. The procedure is:

1. Run the model on a **clean input** (e.g., "The Eiffel Tower is in") and record all activations.
2. Run the model on a **corrupted input** (e.g., "The Colosseum is in") and record all activations.
3. For each component, **replace** its activation on the corrupted run with its value from the clean run.
4. Measure how much the output changes (recovers toward the clean answer).

If patching component $C$ causes the model to recover its clean-run prediction, then $C$ is causally important for that prediction.

$$\Delta_C = \text{Logit}_{\text{correct}}(\text{patched}) - \text{Logit}_{\text{correct}}(\text{corrupted})$$

A large $\Delta_C$ means component $C$ is critical for the task.
</div>

<div id="patching-container"></div>

<div class="md">
## The Bigger Picture: From Circuits to Alignment

Understanding circuits is not merely an academic exercise. It has direct implications for AI safety and alignment:

1. **Detecting deception:** If we can identify the circuit responsible for a model's claim, we can check whether the model "believes" what it says or is producing text that contradicts its internal representations.

2. **Targeted editing:** \cite[Knowledge editing techniques]{meng2022locating} like ROME (Rank-One Model Editing) use circuit-level understanding to surgically modify specific facts without affecting other capabilities.

3. **Predicting failures:** By understanding which circuits handle which tasks, we can predict when a model will fail: if the relevant circuit is absent or malformed, the model will produce unreliable outputs for that task class.

4. **Scalable oversight:** As models grow larger, we need automated tools to verify their behavior. Circuit-level analysis provides a path toward formal verification of neural network properties.

The field of mechanistic interpretability is still young, but it represents our best current hope for moving beyond "black box" AI toward systems we can genuinely understand and trust.
</div>

<div id="summary-container"></div>
