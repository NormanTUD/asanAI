<?php include_once("functions.php"); ?>
<div class="lab-dashboard" style="grid-template-columns: 350px 1fr;">
    <div class="header-full">
        <h3 style="margin:0;">🏗️ ResNet & Gradient Flow</h3>
        <button onclick="ResNetLab.compare()" class="btn" style="background:#22c55e; color:white;">🔄 Gradienten-Simulation</button>
    </div>

    <div class="panel">
        <h4>Residual Learning Theorie</h4>
        <div class="predict-box" style="background:#fff7ed; border-color:#fdba74; margin-bottom:15px;">
            Statt $H(x)$ direkt zu lernen, lernen wir die Differenz:
            $$\mathrm{Output} = F(x) + x$$
            Dabei ist $x$ die Identität (Identity Shortcut).
        </div>
        <hr>
        <label>Netzwerk-Tiefe (Layer):</label>
        <input type="range" id="net-depth" min="2" max="100" value="20" 
               style="width:100%" oninput="document.getElementById('depth-val').innerText = this.value; ResNetLab.compare();">
        <center><b id="depth-val">20</b> Ebenen</center>
    </div>

    <div class="center-column">
        <div class="panel">
            <h4>Gradient Propagation</h4>
            <div id="gradient-plot" style="height:400px; width:100%;"></div>
        </div>
    </div>
</div>

<script>
    // Sicherstellen, dass das Skript erst läuft, wenn alles da ist
    window.addEventListener('load', () => {
        if(typeof ResNetLab !== 'undefined') ResNetLab.compare();
    });
</script>
