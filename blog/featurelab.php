<?php include_once("functions.php"); ?>

<div class="lab-dashboard" style="grid-template-columns: 320px 1fr;">
    <div class="header-full">
        <h3 style="margin:0;">🖼️ Feature Map Explorer</h3>
        <div class="config-bar">
            <button onclick="FeatureLab.run()" class="btn" style="background:#3b82f6; color:white;">🔄 Filter Anwenden</button>
        </div>
    </div>

    <div class="panel">
        <h4>1. Input & Filter</h4>
        <div style="text-align:center; margin-bottom:15px;">
            <canvas id="feat-src" width="50" height="50" style="border:1px solid #ccc; width:120px; image-rendering:pixelated;"></canvas>
            <p><small>Input (Grayscale)</small></p>
        </div>
        
        <div style="margin-bottom:10px;">
            <label>Voreinstellung:</label>
            <select id="kernel-preset" onchange="FeatureLab.loadPreset(this.value)" style="width:100%; padding:5px;">
                <option value="horizontal">Horizontal Edge</option>
                <option value="vertical">Vertical Edge</option>
                <option value="sobel">Sobel X</option>
                <option value="blur">Gaussian Blur</option>
                <option value="sharpen">Sharpen</option>
            </select>
        </div>
        
        <hr>
        <b>Manueller Kernel (3x3):</b>
        <div id="kernel-editor" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:5px; margin-top:10px;">
            </div>
    </div>

    <div class="center-column">
        <div class="panel">
            <h4>2. Filter Output (Feature Map)</h4>
            
            <div style="display:flex; gap:20px; align-items:center; justify-content:center; flex-wrap: wrap; padding: 20px;">
                <div style="text-align:center;">
                    <small>Gewählte Matrix</small>
                    <div id="kernel-viz" style="font-family:monospace; background:#f1f5f9; padding:15px; border-radius:8px; border:1px solid #cbd5e1; min-width:100px;"></div>
                </div>
                <div style="font-size:2em; color:#94a3b8;">→</div>
                <div style="text-align:center;">
                    <canvas id="feat-res" width="50" height="50" style="width:250px; image-rendering:pixelated; border:2px solid #3b82f6; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);"></canvas>
                    <b style="display:block; margin-top:10px; color:#3b82f6;">Resultierende Feature Map</b>
                </div>
            </div>
        </div>

        <div class="math-panel">
            <h4>📓 Tensor-Mathematik</h4>
            <div class="math-tex" id="feat-math">
                Eingabe-Form: $$\mathrm{[Batch, Height, Width, Channels]}$$
                Operation (Faltung): $$\mathrm{Output} = \sigma(Input * Kernel + Bias)$$
                Der Kernel rutscht über das Bild und berechnet das Skalarprodukt pro Fenster.
            </div>
        </div>
    </div>
</div>

<style>
    .k-val:focus { border-color: #3b82f6; outline: none; background: #eff6ff; }
    #kernel-viz { line-height: 1.5; white-space: pre; font-size: 0.9rem; color: #1e293b; }
</style>
