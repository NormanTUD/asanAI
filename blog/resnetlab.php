<?php include_once("functions.php"); ?>
<div class="lab-dashboard" style="display: grid; grid-template-columns: 350px 1fr; gap: 20px;">
    <div class="header-full" style="grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 15px; border-radius: 8px;">
        <h3 style="margin:0;">🏗️ ResNet Architecture & Shapes</h3>
        <button onclick="ResNetLab.compare()" class="btn" style="background:#22c55e; color:white;">🔄 Run Simulation</button>
    </div>

    <div class="panel">
        <h4>Configuration</h4>
        <label>Network Depth:</label>
        <input type="range" id="net-depth" min="2" max="100" value="20" 
               style="width:100%" oninput="document.getElementById('depth-val').innerText = this.value; ResNetLab.compare();">
        <center><b id="depth-val">20</b> Layers</center>
        
        <hr>
        <h4>Tensor Shape Flow</h4>
        <div style="font-size: 0.8em; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
            <div style="display:flex; justify-content:space-between;"><span>Input $x$:</span> <b>[64, 64, 3]</b></div>
            <div style="display:flex; justify-content:space-between;"><span>Conv Path:</span> <b>[64, 64, 3]</b></div>
            <div style="display:flex; justify-content:space-between; color:#3b82f6; border-top: 1px solid #ddd; margin-top:5px; padding-top:5px;">
                <span>Output ($F(x)+x$):</span> <b>[64, 64, 3]</b>
            </div>
        </div>
        <p style="font-size: 0.75em; color: #64748b; margin-top:10px;">
            Note: "Same" padding is required so the spatial dimensions don't change, allowing the addition.
        </p>
    </div>

    <div class="center-column">
        <div class="panel" style="margin-bottom: 20px;">
            <h4>Visual Graph</h4>
            <div id="network-viz" style="height:100px; width:100%; background:white; border-radius:8px;"></div>
        </div>

        <div class="panel" style="margin-bottom: 20px;">
            <h4>Gradient Propagation Plot</h4>
            <div id="gradient-plot" style="height:300px; width:100%;"></div>
        </div>

        <div class="panel">
            <h4>TF.js Code Snippet</h4>
            <div class="md">
                <pre><code id="code-display" class="language-javascript"></code></pre>
            </div>
        </div>
    </div>
</div>
