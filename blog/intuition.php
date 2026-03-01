<?php include_once("functions.php"); ?>

<div class="md">
## 

We can think of LLMs as machines that predict the next most likely word, given a context. Only one word at a time. That word is appended to the input and fed back in, repeating until a special `|endoftext|` token signals the end. In this example, the user enters the text "Once upon a" and lets the LLM continue.

**Step 1:** The text the user has entered is inputted into the LLM:

$$\text{Next Word} = \text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}}) \rightarrow \text{time}$$

**Step 2:** The next word, predicted by the previous step, is attached, and the whole new text is inputted again:

$$\text{New Input} = \underbrace{\text{Once upon a}}_{\text{User Input}} + \underbrace{\text{time}}_{\text{Word 1}} = \text{Once upon a time}$$

**Step 3:** This is repeated until we get a special `|endoftext|` signal, signifying the end of the text.
$$\text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}} \ \underbrace{\text{time}}_{\text{Word 1}}) \rightarrow \underbrace{\text{there}}_{\text{Word 2}}$$

$$\text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}} \ \underbrace{\text{time there}}_{\text{Words 1–2}}) \rightarrow \underbrace{\text{was}}_{\text{Word 3}}$$

$$\text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}} \ \underbrace{\text{time there was}}_{\text{Words 1–3}}) \rightarrow \underbrace{\text{a}}_{\text{Word 4}}$$

$$\text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}} \ \underbrace{\text{time there was a}}_{\text{Words 1–4}}) \rightarrow \underbrace{\text{dragon.}}_{\text{Word 5}}$$

$$\text{LLM}(\underbrace{\text{Once upon a}}_{\text{User Input}} \ \underbrace{\text{time there was a dragon.}}_{\text{Words 1–5}}) \rightarrow \underbrace{\texttt{|endoftext|}}_{\text{Stop}}$$

**Final output: "Once upon a time there was a dragon."**
</div>

<!-- ============================================================ -->
<!-- STEP 0: AUTOREGRESSIVE LOOP VISUALIZATION -->
<!-- ============================================================ -->
<div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;
            margin:15px 0; max-width:720px; margin-left:auto; margin-right:auto;">
    <div style="text-align:center; margin-bottom:12px;">
        <span style="font-size:1.05rem; font-weight:bold; color:#1e293b;">
	    🔄 The Autoregressive Loop: One Word at a Time
	</span>
    </div>
    <div id="autoregressive-viz" style="min-height:200px;"></div>
    <div style="display:flex; gap:10px; justify-content:center; margin-top:12px;">
	<button id="autoregressive-play" onclick="AutoregressiveViz.animate()"
		style="background:#3b82f6; color:white; border:none; padding:8px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">
	    ▶ Play Generation
	</button>
	<button onclick="AutoregressiveViz.reset()"
		style="background:#64748b; color:white; border:none; padding:8px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">
	    ↺ Reset
	</button>
    </div>
</div>

<div class="md">
## How does the Computer find the next word?

The LLM learned to predict the next word by reading **massive** amounts of text (books, websites, articles) and noticing patterns in how language works, and also learning facts from the texts it read. But how does it actually go from a string of words to a prediction? Let's walk through it.

### Step 1: Tokenization

Computers don't understand words. They understand numbers. So the very first thing an LLM does is **chop the input into small pieces called tokens**.

$$\text{"Once upon a time"} \rightarrow [\text{"Once"}, \ \text{"upon"}, \ \text{"a"}, \ \text{"time"}]$$

Most tokens are common words or word fragments. For example, `"understanding"` might be split into `"under"` + `"standing"`, two tokens. This way the model can handle words it has never seen before by combining pieces it *has* seen.

What it splits and where is dependent on the data it has seen. It choses that automatically.
</div>

<!-- ============================================================ -->
<!-- STEP 1: TOKENIZATION VISUALIZATION -->
<!-- ============================================================ -->
<div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;
	    margin:15px 0; max-width:720px; margin-left:auto; margin-right:auto;">
    <div style="text-align:center; margin-bottom:12px;">
	<span style="font-size:1.05rem; font-weight:bold; color:#1e293b;">
	    ✂️ Step 1: Tokenization: Chopping Text into Pieces
	</span>
    </div>
    <input type="text" id="tokenizer-input"
	   style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-size:1em; margin-bottom:12px;"
	   placeholder="Type something... e.g., 'The transformer is playing greatly'"
	   value="The transformer is playing greatly">
    <div id="tokenizer-output" style="min-height:60px;"></div>
    <div id="tokenizer-stats" style="margin-top:10px;"></div>
    <div style="margin-top:10px; padding:10px; background:#fff; border-radius:8px; border:1px dashed #cbd5e1; font-size:0.8em; color:#64748b;">
	💡 Try typing <b>"understanding"</b> or <b>"unbreakable"</b> to see subword splitting in action.
	The model breaks unknown words into known pieces it learned during training.
    </div>
</div>

<div class="md">
### Step 2: Embedding

A raw token doesn't tell the model anything about what a word *means*. So the model replaces each token with a **long list of numbers** (called a vector) that represents its meaning.

$$\text{"king"} \rightarrow [0.22, \ 0.85, \ -0.41, \ 0.09, \ \ldots, \ 0.63]$$

These vectors live in a high-dimensional space where **words with similar meanings end up close together**. "King" and "queen" are near each other. "Banana" and "monarchy" are far apart. Nobody hand-designs these vectors. The model learns them automatically during training, purely from seeing which words appear in similar contexts across billions of sentences.

What's remarkable is that this space captures *relationships*, not just similarity. The most famous example:

$$\vec{\text{king}} - \vec{\text{man}} + \vec{\text{woman}} \approx \vec{\text{queen}}$$

The direction from "man" to "woman" represents something like the concept of gender. That same direction, applied to "king," lands you right next to "queen." The model was never told any of this. These relationships emerge on their own, just from reading text.

Real networks don't just use 2 or 3 dimensional Embedding Spaces, but thousands of dimensions. That are too many to visualizable, but the basic idea stays the same.
</div>

<!-- ============================================================ -->
<!-- STEP 2: EMBEDDING VISUALIZATION -->
<!-- ============================================================ -->
<div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;
	    margin:15px 0; max-width:720px; margin-left:auto; margin-right:auto;">
    <div style="text-align:center; margin-bottom:12px;">
	<span style="font-size:1.05rem; font-weight:bold; color:#1e293b;">
	    📍 Step 2: Embedding: Words as Points in Space
	</span>
    </div>
    <input type="text" id="embedding-viz-input"
	   style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-size:1em; margin-bottom:8px;"
	   placeholder="Type words to highlight (e.g., king queen man woman)"
	   value="king queen man woman">
    <div id="embedding-viz-plot" style="height:400px; background:#fff; border-radius:8px; border:1px solid #e2e8f0;"></div>

    <!-- Vector Arithmetic -->
    <div style="margin-top:14px; padding:12px; background:#fff; border-radius:8px; border:1px solid #e2e8f0;">
	<div style="font-weight:bold; color:#1e293b; margin-bottom:8px;">🧮 Vector Arithmetic</div>
	<div style="display:flex; gap:8px;">
	    <input type="text" id="embedding-arithmetic-input"
		   style="flex:1; padding:8px; border-radius:6px; border:1px solid #cbd5e1; font-family:monospace;"
		   placeholder="e.g., king - man + woman"
			onkeyup="EmbeddingViz.doArithmetic()"
		   value="king - man + woman">
	</div>
	<div id="embedding-arithmetic-result" style="margin-top:8px; min-height:24px;"></div>
    </div>
</div>

<div class="md">
### Step 3: Positional Encoding

"The dog bites man" means something very different from "The man bites dog." Same words, different order. So a **positional encoding** is added to each token's embedding, a unique signal that says "I'm the 1st word," "I'm the 2nd word," and so on.

$$\text{Final Input} = \text{Embedding}(\text{token}) + \text{Position}(\text{index})$$

Now each token carries two pieces of information: **what it is** and **where it is**.

This is required, because the embedding and attention operations have no built-in notion of sequence order, so without it, "dog bites man" and "man bites dog" would look identical to the model.
</div>

<!-- ============================================================ -->
<!-- STEP 3: POSITIONAL ENCODING VISUALIZATION -->
<!-- ============================================================ -->
<div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;
	    margin:15px 0; max-width:720px; margin-left:auto; margin-right:auto;">
    <div style="text-align:center; margin-bottom:12px;">
	<span style="font-size:1.05rem; font-weight:bold; color:#1e293b;">
	    📐 Step 3: Positional Encoding: Where Am I in the Sentence?
	</span>
    </div>

    <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
	<label style="font-size:0.85em; color:#475569; font-weight:bold;">Dimensions to show:</label>
	<input type="range" id="pe-num-dims" min="2" max="12" step="1" value="8"
	       style="flex:1; accent-color:#8b5cf6;">
	<span style="font-weight:bold; color:#8b5cf6; min-width:24px;">8</span>
    </div>

    <!-- Sine/Cosine wave plot -->
    <div id="positional-encoding-plot" style="height:300px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:12px;"></div>

    <!-- Heatmap -->
    <div style="font-weight:bold; color:#1e293b; margin-bottom:6px;">Positional Encoding Heatmap</div>
    <div id="positional-encoding-heatmap" style="height:300px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:12px;"></div>

    <!-- Same word, different positions demo -->
    <div style="font-weight:bold; color:#1e293b; margin-bottom:6px;">Same Word, Different Positions</div>
    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:8px;">
	<input type="text" id="pe-demo-word" value="cat" placeholder="Word"
	       style="width:80px; padding:6px; border-radius:6px; border:1px solid #cbd5e1;">
	<label style="font-size:0.85em; color:#475569;">Pos 1:
	    <input type="number" id="pe-demo-pos1" value="0" min="0" max="19"
		   style="width:50px; padding:4px; border-radius:4px; border:1px solid #cbd5e1;">
	</label>
	<label style="font-size:0.85em; color:#475569;">Pos 2:
	    <input type="number" id="pe-demo-pos2" value="5" min="0" max="19"
		   style="width:50px; padding:4px; border-radius:4px; border:1px solid #cbd5e1;">
	</label>
    </div>
    <div id="pe-addition-demo"></div>
</div>

<div class="md">
### Step 4: The Transformer Layers

This is the heart of the model, introduced in \citeyear{vaswani2017attention}. The token vectors flow through **many layers** stacked on top of each other (modern LLMs can have 80+ layers). Each layer refines the model's understanding a little more.

You can think of the token vectors as a **shared notebook** (researchers call it the *residual stream*). Each layer reads from the notebook, does some thinking, and **writes its findings back**:

$$\mathbf{x} := \mathbf{x} + \text{Layer}(\mathbf{x})$$

The `x +` means each layer **adds** information rather than replacing it. Nothing learned earlier gets thrown away.

#### 4a: Attention - "Which other words matter for *this* word?"

Attention lets the model **look at other tokens** to understand context. In *"The cat sat on the mat because **it** was tired"*, what does "it" refer to? An **attention head** figures this out by comparing "it" to every other word and deciding that "it" is most related to "cat".

Attention Heads solve what linguists call **Long Distance Dependencies**: a word at the beginning of a long text may influence the meaning of a word at the very end. Attention allows to find out which word attends to which other word over short or even very long texts, and it can do so over the whole **context length** of the LLM model.

It does so by moving the Embedding of a word in dependence of the context it's used in to a place called **contextualized Embedding** that looks not only at the word, but at the context the word is used in.

This is best exemplified when using words that have multiple meanings, like "bank", which could be a **river bank**, or a **bank** where you put your **money**.

Type **"bank river"** or **"bank money"** below. Notice how the diamond, the contextualized "Bank", leaps toward the neighbor that defines it. This is what **Attention** does: it looks at the context a word is used in, and moves the **Embedding** of a word in the **Embedding Space** to a point closer to it's meaning in the context its used in.

</div>

<div class="layers-vertical">
	<input type="text" id="trans-input" class="bw-cell" style="width: 90%;" value="bank river" oninput="runAttention()">
	<p>The diamond shows where "Bank" moves in context.</p>
</div>
<div id="transformer-plot" class="plot-container" style="height: 450px; background: #fff;"></div>

<script>
	runAttention();
</script>

<div class="md">
LLM models have **many attention heads** running in parallel, each a tiny specialist. One might track which noun a pronoun refers to, another might connect verbs to their objects, another might notice adjectives describing nearby nouns.

It is important to note that not all attention heads to something that is humanly interpretable. They may look like they're reacting to nouns or verbs, but in reality, it's just a pattern learnt from statistics. They are not programmed to react to those words, and they don't 'know' what they are.

#### 4b: Feed-Forward Network - "What do I conclude?"

After attention has gathered context, a small **neural network** processes each token individually. This is where the model applies knowledge it memorized during training: facts, patterns, and rules of language.

If attention is *gathering clues*, the feed-forward network is *drawing conclusions*.

If Attention is about *looking around* at other words, the Feed-Forward Network (FFN) is about *looking inward* into the model's memory.

The Feed-Foward-Network is often thought of as the **\cite[Knowledge bank]{keyvalmem}** of a Transformer. Here it is decided, in what direction in the Embedding Space the **Contextualized Embedding** should be moved to get closer to a meaningful next word.

1. **The Detectors (Layer 1):** The model expands the word's vector to check for thousands of specific patterns. ("Is this a French landmark?" "Is this about technology?")
2. **The Filter (Activation Function):** A mathematical filter (like ReLU) zeroes out any detector that didn't find a match. Only the strong signals survive.
3. **The Knowledge (Layer 2):** For every detector that "fired," the model adds associated facts back into the token's vector.

Let's look at the word **"Apple"**. Because of the *Attention* step, its vector already contains clues about its context. Watch how the FFN reacts differently based on that context.
</div>

<div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;
            margin:15px 0; max-width:800px; margin-left:auto; margin-right:auto; font-family: system-ui, sans-serif;">
    <div style="display:flex; gap:10px; justify-content:center; margin-bottom:20px;">
        <button onclick="FFNViz.setScenario('apple_fruit')" id="btn-ffn-fruit"
                style="padding:8px 16px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; cursor:pointer; font-weight:bold; transition: 0.2s;">
            🍎 Context: "eating an apple"
        </button>
        <button onclick="FFNViz.setScenario('apple_tech')" id="btn-ffn-tech"
                style="padding:8px 16px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; cursor:pointer; font-weight:bold; transition: 0.2s;">
            💻 Context: "buying an apple"
        </button>
    </div>

    <div id="ffn-viz-container" style="position: relative; height: 350px; background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 20px; display: flex; justify-content: space-between; align-items: center; overflow: hidden;">

        <div style="width: 120px; text-align: center; z-index: 2;">
            <div style="font-weight: bold; color: #475569; margin-bottom: 8px;">Input Vector</div>
            <div id="ffn-input-box" style="background: #e0e7ff; border: 2px solid #818cf8; padding: 10px; border-radius: 8px; font-weight: bold; color: #312e81; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                "Apple" + Context
            </div>
        </div>

        <div style="width: 180px; text-align: center; z-index: 2;">
            <div style="font-weight: bold; color: #475569; margin-bottom: 8px;">Pattern Detectors</div>
            <div id="ffn-detectors" style="display: flex; flex-direction: column; gap: 10px;">
                </div>
        </div>

        <div style="width: 200px; text-align: center; z-index: 2;">
            <div style="font-weight: bold; color: #475569; margin-bottom: 8px;">Added Knowledge</div>
            <div id="ffn-facts" style="display: flex; flex-direction: column; gap: 10px;">
                </div>
        </div>

        <div style="width: 120px; text-align: center; z-index: 2;">
            <div style="font-weight: bold; color: #475569; margin-bottom: 8px;">Output Vector</div>
            <div id="ffn-output-box" style="background: #dcfce7; border: 2px solid #34d399; padding: 10px; border-radius: 8px; font-weight: bold; color: #065f46; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                Enriched Vector
            </div>
        </div>

        <svg id="ffn-lines" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none;">
            </svg>

    </div>

    <div id="ffn-explanation" style="margin-top:15px; padding:12px; background:#fff; border-radius:8px; border:1px dashed #cbd5e1; font-size:0.9em; color:#475569; text-align: center;">
        Select a context above to see how the FFN processes it.
    </div>
</div>

<div class="md">
Technically, this is expressed with the formula:
$$ \text{FFN}(x) = W_2 \cdot \max(0, W_1 \cdot x + b_1) + b_2 $$
Where $W_1$ acts as the detectors, the $\max(0, ...)$ is the ReLU filter shutting down negative matches, and $W_2$ contains the knowledge vectors that get added together.

#### 4c: All together

The result of both, the Attention Heads and then the Feed-Forward-Network, are then returned and simply added to the **Residual Stream**.

Neither the **Attention Heads** nor the **Neural Network** are configured by hand. They learn what to look for by looking at massive amounts of data.
</div>

<!-- ============================================================ -->
<!-- STEP 4: TRANSFORMER LAYERS - RESIDUAL STREAM -->
<!-- ============================================================ -->
<div id="residual-stream-plot"></div>

<div style="display:flex; align-items:center; gap:14px; margin-top:14px; justify-content:center; flex-wrap:wrap;">
    <button id="residual-stream-prev" onclick="ResidualStreamViz.prevLayer()"
        style="padding:9px 18px; border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc; cursor:pointer; font-size:14px;">
        ← Prev
    </button>
    <span id="residual-stream-layer-label"
        style="font-weight:bold; font-size:15px; min-width:110px; text-align:center; color:#1e293b;">
        Embedding
    </span>
    <button id="residual-stream-next" onclick="ResidualStreamViz.nextLayer()"
        style="padding:9px 22px; border-radius:8px; border:none; background:#3b82f6; color:#fff; cursor:pointer; font-size:14px; font-weight:600;">
        Next Layer →
    </button>
    <input type="range" id="residual-stream-layer" min="0" max="3" value="0"
        oninput="ResidualStreamViz.setLayer(parseInt(this.value))"
        style="width:140px; margin-left:8px;">
    <button onclick="ResidualStreamViz.reset()"
        style="padding:9px 14px; border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc; cursor:pointer; font-size:13px; color:#64748b;">
        Reset
    </button>
</div>

<div id="residual-stream-info" style="margin-top:14px;"></div>

<div class="md">
### Step 5: The Final Prediction

After all layers, the model takes the **last token's vector** and produces a **score for every word in the vocabulary** (often 50,000+ words). These scores are converted into probabilities:

$$P(\text{"time"}) = 0.72, \quad P(\text{"day"}) = 0.08, \quad P(\text{"hill"}) = 0.002, \quad \ldots$$

The model then **picks a word**, usually one of the top candidates, with a bit of randomness so it doesn't always say the exact same thing. That's what makes it creative.

And then, as we saw in Part I, that word gets appended to the input and the whole process repeats, one word at a time, until the model decides it's done.
</div>

<!-- ============================================================ -->
<!-- STEP 5: FINAL PREDICTION -->
<!-- ============================================================ -->
<div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;
            margin:15px 0; max-width:720px; margin-left:auto; margin-right:auto;">
    <div style="text-align:center; margin-bottom:12px;">
        <span style="font-size:1.05rem; font-weight:bold; color:#1e293b;">
            🎯 Step 5: The Final Prediction: Probability over Vocabulary
        </span>
        <div style="font-size:0.85em; color:#64748b; margin-top:4px;">
            Input: "Once upon a" → What comes next?
        </div>
    </div>

    <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
        <span style="font-size:0.85em; color:#3b82f6; font-weight:bold;">🎯 Greedy</span>
        <input type="range" id="prediction-temperature" min="0.1" max="3.0" step="0.05" value="1.0"
               style="flex:1; accent-color:#f59e0b;">
        <span style="font-size:0.85em; color:#ef4444; font-weight:bold;">🎲 Creative</span>
        <span id="prediction-temp-val"
              style="font-size:0.9em; font-weight:bold; color:#1e293b; min-width:120px; text-align:right;">1.00 (balanced)</span>
    </div>

    <div id="prediction-plot" style="height:350px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:10px;"></div>
    <div id="prediction-info"></div>

    <div style="margin-top:10px; padding:10px; background:#fff; border-radius:8px; border:1px dashed #cbd5e1; font-size:0.8em; color:#64748b;">
        💡 <b>Temperature</b> controls randomness. At T→0, the model always picks the top word (greedy).
        At high T, the distribution flattens and rare words get a chance, that's what makes LLMs "creative."
        The model doesn't "know" the answer; it assigns probabilities and <b>samples</b>.
    </div>
</div>

<div class="md">
## The key insight

There is no "understanding" module, no grammar checker, no knowledge database. It's all just vectors flowing through layers of simple math: addition, multiplication, and comparison. But stack enough of these simple operations together, and something that *looks a lot like understanding* emerges.

## What this document will be about

We will try to cover every topic here in as much detail as is required to really understand them, from the point of view of a programmer, a mathematician and a historian. We will try to find which ideas lead to this type of system, and how they all work and play together. For each point we try to make, we implemented interactive demos so you can not only read passively, but try to understand by *doing*.

Instead of brushing off topics, we will go into all the required-to-know details of all topics to fully understand how they work.
</div>
