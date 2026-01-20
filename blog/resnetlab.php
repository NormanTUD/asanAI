<?php include_once("functions.php"); ?>
<div class="lab-dashboard" style="grid-template-columns: 350px 1fr;">
    <div class="header-full">
        <h3 style="margin:0;">🏗️ ResNet & Gradient Flow</h3>
        <button onclick="ResNetLab.compare()" class="btn" style="background:#22c55e; color:white;">🔄 Simulate Gradients</button>
    </div>

    <div class="panel">
        <h4>Residual Learning Theory</h4>
        <div class="predict-box" style="background:#fff7ed; border-color:#fdba74; margin-bottom:15px;">
            Instead of learning $H(x)$ directly, we learn the residual mapping:
            $$\mathrm{Output} = F(x) + x$$
            Where $x$ represents the Identity Shortcut.
        </div>
        <hr>
        <label>Network Depth (Layers):</label>
        <input type="range" id="net-depth" min="2" max="100" value="20" 
               style="width:100%" oninput="document.getElementById('depth-val').innerText = this.value; ResNetLab.compare();">
        <center><b id="depth-val">20</b> Layers</center>
    </div>

    <div class="center-column">
        <div class="panel">
            <h4>Gradient Propagation</h4>
            <div id="gradient-plot" style="height:400px; width:100%;"></div>
        </div>
    </div>
</div>

<script>
    // Ensure the script runs once the DOM is fully loaded
    window.addEventListener('load', () => {
        if(typeof ResNetLab !== 'undefined') ResNetLab.compare();
    });
</script>
