[x] intuition: in " 🔄 The Autoregressive Loop: One Word at a Time " dieser "predicts:" block ist im dark mode weiß und nicht schön. gleiches für den plot bei  📍 Step 2: Embedding: Words as Points in Space  und die plots bei  📐 Step 3: Positional Encoding: Where Am I in the Sentence? , die sind auch weißer bg. das soll dynamisch sich anpassen an dark und light mode. gleiches für  🎯 Step 5: The Final Prediction: Probability over Vocabulary . 
[x] math_iv: die  Explore: Group Axioms on a Clock (ℤ₁₂)  plots haben keinen dark background im dark mode. das "Unlink 3D — two chained rings through a fold" lassen sich nicht durch die faltung da unchainen.
[x] language: sprache ist ein fenster in die welt. die welt als ganzes hat extrem viele aspekte auf die man schauen kann. oft schauen sprachen auf die selben konzepte und benennen sie unterschiedlich, aber manchmal kann auch eine sprache etwas benennen was ne andere nicht kennt. füge das ein.
[x] information_market: erwähne auch Isidor von Sevilla, den schutzpatron der informatiker und des internets. research him deeply
[x] autodiff: der plot in Interactive: Vanishing & Exploding Gradients ist im dark mode häßlich mit weißem background
[x] coherent_difference: "\begin{array}{c|c}
\text{Theory} & \text{Where it lands on the chain} \\
\hline
\text{Sets} & \text{Distinction, Relation} \\
\text{Type theory} & \text{Relation, Transformation, with type-level structure} \\
\text{Category theory} & \text{Transformation, Coherence} \\
\text{Topology} & \text{Locality} \\
\text{Sheaves} & \text{Compatibility} \to \text{Gluing} \to \text{Globality} \\
\infty\text{-Sheaves, HoTT} & \text{Compatibility as higher Coherence} \\
\text{Fiber bundles, manifolds} & \text{Globality + Invariance} \\
\text{Embedding spaces} & \text{All of the above, applied to meaning} \\
\text{Transformer architecture} & \text{Gluing local token data into a global sequence meaning} \\
\text{Deep ReLU net (Origami)} & \text{Crease = Distinction; regions = Locality; continuity on the crease = Compatibility}
\end{array}" diese tabele nach markdown konvertieren. 
[x] embeddinglab: "In a Transformer (like ChatGPT), this is the “Handshake.” When a word “looks” at another word, it calculates the Dot Product. If the result is high, the AI knows those words are contextually related. This will be explained in more detail later on." derp lot der danach kommt mit den 2 vektoren ist im dark mode mit weißem background und häßlich
[x] recurrent_networks: entferne die footnote, mach daraus n normales cite.
[x] samplinglab: in "# Speculative Sampling" ist die formel \text{accept } x \text{ with probability } \min\!\left(1,\, \frac{P_{\text{target}}(x)}{P_{\text{draft}}(x)}\right);\; \text{on rejection, resample from } \frac{\max\!\left(0,\, P_{\text{target}}(x) - P_{\text{draft}}(x)\right)}{\sum_{x'} \max\!\left(0,\, P_{\text{target}}(x') - P_{\text{draft}}(x')\right)} zu breit über den rechten rand raus
[x] diffusion: der plot in "style="display:flex; align-items:center; gap:1px; height:60px;"" nach dem §"Step 2 · embed — each token is mapped to a vector of numbers (here 16-dim for display; CLIP uses 768, T5 uses 4096)." geht rechts aus dem bildschirm raus. außerdem kommt die fehlermeldung "[glossary] DROP-CAP DRIFT: --cl-dc-* changed {"lines":"","size":""} -> {"lines":"","size":"208.7px"} without a viewport resize. Re-pinning last known good values. start.js:1883:14
    dropcapCanary http://localhost/asanai/blog/start.js?v=1791188584:1883
    periodicSweep http://localhost/asanai/blog/start.js?v=1791188584:1917
[glossary] DROP-CAP DRIFT: paragraph geometry 763x173 -> 763x202"
[x] multimodal: wenn ich auf den plot in "For a 224×224 image with P=16: n=196 patches. ViT-L/14 processes this with 24 layers, 16 heads, d=1024, yielding ~304M parameters. Modern ViTs (EVA-02, SigLIP) push to P=14 patches on 448×448 inputs, yielding >1000 tokens per image." klicke wird der ganze bildschirm dunkel und es passiert nix.
[x] algorithms: der plot nach "The residual after this approximation has Frobenius norm under 0.55% of the norm of WL." ist weiß im dark mode. auch der plot bei "Interactive Exploration" beim "function call" ist im dark mode weiß. genauso wie " Click “Add Example” to see how ambiguity decreases as you provide more detailed examples. With few-shot prompting, even many examples leave room for wrong rules. " nicht an den dark mode angepasst ist der plot
[x] mechanistic_interpretability: 🔁 Interactive: Looped Transformer as a Computer auch da ist ads " 🔁 This cycle: Load 3 into scratchpad " "PC = 0" im dark mode ugly. 
[x] positionalembeddingslab: das scheitert aktuell.  start.js:107:10
[glossary] DROP-CAP DRIFT: --cl-dc-* changed {"lines":"","size":""} -> {"lines":"","size":"208.7px"} without a viewport resize. Re-pinning last known good values. start.js:1883:14
[glossary] DROP-CAP DRIFT: paragraph geometry 763x115 -> 763x148 start.js:1890:14
[glossary] DROP-CAP DRIFT: --cl-dc-* changed {"lines":"","size":""} -> {"lines":"","size":"208.7px"} without a viewport resize. Re-pinning last known good values. start.js:1883:14
[glossary] DROP-CAP DRIFT: paragraph geometry 763x148 -> 763x152 start.js:1890:14
Uncaught TypeError: can't access property "textContent", document.getElementById(...) is null
    updateUnitCircle http://localhost/asanai/blog/positionalembeddingslab.js?v=1791188584:15
    initSineCosine http://localhost/asanai/blog/positionalembeddingslab.js?v=1791188584:93
    loadPositionalEmbeddingsModule http://localhost/asanai/blog/positionalembeddingslab.js?v=1791188584:577
    _peLazyObserver http://localhost/asanai/blog/positionalembeddingslab.js?v=1791188584:554
    _peLazyObserver http://localhost/asanai/blog/positionalembeddingslab.js?v=1791188584:547
positionalembeddingslab.js:15:12
Uncaught TypeError: can't access property "textContent", document.getElementById(...) is null
    updateUnitCircle http://localhost/asanai/blog/positionalembeddingslab.js?v=1791188584:15
12 positionalembeddingslab.js:15:12, fixe das. und die überschriftenzeile "Component 	Dim 0 	Dim 1 	Dim 2 	Dim 3" ist ugly in weißem bg.

[x] promptengineering: die fonts im plot bei "# Prompt Injection Defense" sind auf dem hellen grünen oder roten background schwer lesbar

[x] finetuninglab: "$$ \mathcal{L}_{\text{SFT}}(\theta) = -\sum_{(x, y) \in \mathcal{D}} \sum_{t=1}^{|y|} \log \pi_\theta(y_t \mid x, y_{data=”” sources:=”” =”” human-written=”” (highest=”” quality):=”” openai’s=”” early=”” instructgpt=”” used=”” ~13k=”” human-written=”” examples.=”” distilled=”” from=”” stronger=”” models=”” (scalable):=”” self-instruct,=”” wizardlm,=”” alpaca.=”” use=”” gpt-4=”” to=”” generate=”” 100k–1m=”” synthetic=”” (cheap,=”” controllable):=”” constitutional=”” ai,=”” evol-instruct,=”” magpie.=”” a=”” typical=”” 2025=”” sft=”” dataset:=”” llama=”” 3=”” ~10m=”” key=”” insights:=”” quality=””> quantity*: 10K carefully curated examples beat 1M noisy ones." diese formel rendert nicht

[x] und "# Practical Fine-Tuning Recipe"  ist kein codeblock so richtig, schaue wie andere code blocks das machen, speicher den code in den ordner py.

[x] verschiebe den ordner atlas nach atlas_data oder so so dass es nicht mehr mit atlas.php/atlas verwechselt wird, benenne das auch in den dateien, pfaden, agents.md usw um

[ ] always cite original publications when you can, add them to literature.js and link where you got infos from. read them thoroughly.
