<?php include_once(__DIR__ . "/../functions.php"); ?>
<!--
COURSE_METADATA:
title: The Interference Pattern of Layers (Wave Geometry)
description: (Staging) How a transformer's activations pulse — expansion, compression, re-expansion — as a wave through the layers. Moved out of the former appendix; not yet part of the linear course.
icon: &#128150;
part: 6
order: 15
color: text-secondary
topics: architecture, math-iii
tags: math-heavy, staging
-->

<div class="md" data-mathlevel="60" data-optionaltitle="The Interference Pattern of Layers: Wave Geometry">
## The Interference Pattern of Layers: Wave Geometry

Information doesn't flow through a transformer in a smooth, monotonic stream. It **pulses**. If you track the activation patterns of a hidden state as it passes through all layers of a model, from layer 0 to layer 96, you see something that looks less like a pipeline and more like a **wave**: expansion, compression, expansion, compression, in a rhythmic cycle that resembles a beating mechanical heart.

### The Three Phases

Researchers have observed that transformer layers tend to organize into three broad phases:

1. **Expansion (Early Layers):** The input embedding is “opened up.” The model broadens the representation, activating many dimensions, exploring many possible interpretations of the input. The activation vector becomes **wide and diffuse**, high entropy, low certainty. This is the model asking: “What could this input mean?”

2. **Compression (Middle Layers):** The representation suddenly **contracts**. The model narrows down, suppressing irrelevant dimensions, sharpening the signal. This is the “logic check”, the phase where the model commits to an interpretation, resolves ambiguities, and performs the core reasoning. The activation vector becomes **tight and focused**, low entropy, high certainty.

3. **Re-expansion (Late Layers):** The representation opens up again, but differently. Now the model is preparing to **generate output**, it needs to fan out from a single sharp interpretation into a probability distribution over the entire vocabulary. The vector broadens again, but this time in a structured way that maps onto token probabilities.

### The Heartbeat Analogy

This expansion-compression-expansion cycle is strikingly similar to a **heartbeat**: diastole (expansion, filling with possibilities), systole (compression, pumping a decision), diastole again (expansion, distributing the result). When visualized as a waveform across layers, it literally looks like a cardiac rhythm, a **mechanical heart made of data**.

The wave pattern is not a single pulse. In deep models (96+ layers), you often see **multiple cycles**, the model performs several rounds of expansion and compression, like a heart beating multiple times per inference. Each cycle refines the representation further, and the interference between cycles creates complex patterns reminiscent of wave interference in physics.

$$ \text{Activation Width}(l) \approx A_0 + \sum_{k=1}^{K} A_k \cdot \cos\left(\frac{2\pi k \cdot l}{L} + \phi_k\right) $$

where $l$ is the layer index, $L$ is the total number of layers, and $K$ is the number of harmonic cycles. The activation width oscillates as a superposition of harmonics, literally a wave equation applied to neural network depth.

Below, you can explore this interactively. A simulated transformer processes a token through all its layers. The **wave visualization** shows the activation width (number of strongly active dimensions) at each layer. Watch the heartbeat pattern emerge. Adjust the **model depth**, **number of cycles**, and **input complexity** to see how the wave pattern changes.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="display: grid; grid-template-columns: 1fr 260px; gap: 20px; align-items: start; margin-bottom: 15px;">
        <div>
            <div style="font-family: sans-serif; font-size: 0.8em; color: #64748b; text-align: center; margin-bottom: 4px; font-weight: bold;">Activation Wave Across Layers</div>
            <canvas id="canvas-layer-wave" style="width: 100%; height: 520px; background: #0f172a; border-radius: 8px; border: 1px solid #1e293b;"></canvas>
        </div>
        <div id="wave-info-panel" style="background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; font-family: sans-serif; font-size: 0.85em; color: #475569; line-height: 1.7; max-height: 520px; overflow-y: auto;">
            <div style="font-weight: bold; font-size: 1em; color: #1e293b; margin-bottom: 8px;">💓 Layer Heartbeat</div>
            <div id="wave-phase-info">
                The activation pattern pulses through expansion, compression, and re-expansion phases, like a beating heart made of data.
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 10px 0;">
            <div style="font-weight: bold; font-size: 0.9em; color: #1e293b; margin-bottom: 6px;">📊 Current Layer</div>
            <div id="wave-layer-detail"></div>
        </div>
    </div>

    <!-- Controls -->
    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Scan Layer:</b>
            <input type="range" id="wave-scan-layer" min="0" max="95" step="1" value="0" style="width: 220px; vertical-align: middle;">
            <span id="wave-scan-val" style="font-weight: bold; color: #8b5cf6;">0 / 95</span>
        </label>
    </div>

    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569;">
            <b>Depth:</b>
            <input type="range" id="wave-depth" min="12" max="128" step="4" value="96" style="width: 140px; vertical-align: middle;">
            <span id="wave-depth-val" style="font-weight: bold; color: #3b82f6;">96</span>
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569;">
            <b>Cycles:</b>
            <input type="range" id="wave-cycles" min="1" max="5" step="0.5" value="2.5" style="width: 140px; vertical-align: middle;">
            <span id="wave-cycles-val" style="font-weight: bold; color: #f59e0b;">2.5</span>
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569;">
            <b>Complexity:</b>
            <input type="range" id="wave-complexity" min="0.2" max="1.0" step="0.05" value="0.7" style="width: 140px; vertical-align: middle;">
            <span id="wave-complexity-val" style="font-weight: bold; color: #10b981;">0.70</span>
        </label>
    </div>

    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <span style="font-family: sans-serif; font-size: 0.9em; color: #475569; font-weight: bold;">Input:</span>
        <button onclick="loadWaveInput('simple')" class="wave-input-btn" id="wi-simple" style="background: #8b5cf6; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">📝 Simple Fact</button>
        <button onclick="loadWaveInput('reasoning')" class="wave-input-btn" id="wi-reasoning" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🤔 Reasoning</button>
        <button onclick="loadWaveInput('creative')" class="wave-input-btn" id="wi-creative" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🎨 Creative</button>
        <button onclick="loadWaveInput('ambiguous')" class="wave-input-btn" id="wi-ambiguous" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🔀 Ambiguous</button>
    </div>

    <div style="display: flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="wave-show-phases" checked onchange="renderLayerWave()"> Phase regions
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="wave-show-harmonics" onchange="renderLayerWave()"> Show harmonics
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="wave-show-heatmap" checked onchange="renderLayerWave()"> Dimension heatmap
        </label>
        <button onclick="animateWaveScan()" id="wave-animate-btn" style="background: #10b981; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">▶ Scan</button>
    </div>

    <!-- Stats -->
    <div id="wave-stats" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; max-width: 800px; margin: 0 auto 15px auto;"></div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> The <b>top section</b> shows a <b>dimension heatmap</b>, each column is a layer,
        each row is a dimension of the hidden state. Bright pixels = strongly active dimensions.
        The <b>wave curve</b> below it traces the <b>activation width</b> (how many dimensions are strongly active) at each layer.
        <span style="color:#3b82f6;">Blue regions</span> = <b>expansion</b> (broad, exploratory).
        <span style="color:#ef4444;">Red regions</span> = <b>compression</b> (narrow, decisive).
        <span style="color:#10b981;">Green regions</span> = <b>re-expansion</b> (output preparation).
        The <span style="color:#f59e0b; font-weight:bold;">golden scan line</span> shows the currently inspected layer.
        Use <b>▶ Scan</b> to watch the pulse travel through the network in real time.
    </div>
</section>
