<?php include_once("functions.php"); ?>

<div class="lab-dashboard" style="display: flex; flex-direction: column; gap: 20px; padding: 20px; font-family: sans-serif;">
    <div class="header-full" style="background: #1e293b; color: white; padding: 15px; border-radius: 8px;">
        <h3 style="margin:0;">🖼️ Multi-Feature Map Explorer</h3>
        <p style="margin: 5px 0 0 0; opacity: 0.8;">Parallele Merkmalserkennung in einem Convolutional Layer</p>
    </div>

    <div style="display: grid; grid-template-columns: 300px 1fr; gap: 20px;">
        <div class="panel" style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <h4>1. Input Image</h4>
            <div style="text-align:center;">
                <canvas id="feat-src" width="100" height="100" style="border:2px solid #ccc; width:200px; image-rendering:pixelated;"></canvas>
                <p><small>Grayscale Source (100x100)</small></p>
            </div>
            <hr>
            <div class="math-panel" style="font-size: 0.85rem; color: #64748b;">
                <strong>Mathematik:</strong>
                <p>Jeder Filter erzeugt einen eigenen "Channel" im Output-Tensor.</p>
                <code>Output[:,:,n] = Input * Kernel_n</code>
            </div>
        </div>

        <div class="panel" style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <h4>2. Parallel Feature Maps</h4>
            <div id="feature-maps-container" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                </div>
        </div>
    </div>
</div>
