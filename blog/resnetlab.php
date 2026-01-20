<?php include_once("functions.php"); ?>
<style>
    .concept-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 10px; }
    .math { color: #2563eb; font-weight: bold; }
</style>

<div class="lab-dashboard" style="grid-template-columns: 350px 1fr;">
    <div class="header-full">
        <h3 style="margin:0;">🏗️ ResNet & Gradient Flow</h3>
        <button onclick="ResNetLab.compare()" class="btn" style="background:#22c55e; color:white;">🔄 Simulate Gradients</button>
    </div>

    <div class="panel">
        <h4>Lab Controls</h4>
        <label>Network Depth (Layers):</label>
        <input type="range" id="net-depth" min="2" max="100" value="20" 
               style="width:100%" oninput="document.getElementById('depth-val').innerText = this.value; ResNetLab.compare();">
        <center><b id="depth-val">20</b> Layers</center>
        
        <hr>
        
        <h4>The "Vanishing" Problem</h4>
        <p style="font-size: 0.85em; color: #64748b;">
            In a <b>Plain Network</b>, we multiply gradients by weights at every layer. 
            If the gradient is $0.9$, after 20 layers it becomes $0.9^{20} \approx 0.12$. 
            The signal "dies" before reaching early layers.
        </p>
        
        <div class="concept-card">
            <small><b>ResNet Solution:</b></small><br>
            By adding the input $x$ to the output $F(x)$, the derivative becomes:
            <div style="text-align:center; padding: 10px 0;">
                $\frac{\partial}{\partial x}(F(x) + x) = \frac{\partial F}{\partial x} + 1$
            </div>
            The <span class="math">+1</span> ensures the gradient flows even if $F(x)$ is crushed!
        </div>
    </div>

    <div class="center-column">
        <div class="panel" style="margin-bottom: 20px;">
            <h4>Network Architecture Map</h4>
            <div id="network-viz" style="width:100%; height:120px; background: #f8fafc; border-radius: 8px; border: 1px inset #f1f5f9;">
                </div>
            <p style="font-size: 0.75em; color: #94a3b8; margin-top: 5px;">
                🔵 Blue arcs represent <b>Skip Connections</b> (Identity shortcuts) skipping every 2 layers.
            </p>
        </div>

        <div class="panel">
            <h4>Gradient Propagation Strength</h4>
            <div id="gradient-plot" style="height:350px; width:100%;"></div>
        </div>
    </div>
</div>

<script src="resnetlab.js"></script>
<script>
    window.addEventListener('load', () => {
        if(typeof ResNetLab !== 'undefined') ResNetLab.compare();
    });
</script>
