<?php include_once("functions.php"); ?>
<div class="lab-dashboard" style="display: grid; grid-template-columns: 350px 1fr; gap: 20px;">
<div class="panel">
    <h4>Configuration</h4>
    <label>Network Depth:</label>
    <input type="range" id="net-depth" min="2" max="100" value="20" 
           style="width:100%" oninput="document.getElementById('depth-val').innerText = this.value; ResNetLab.compare();">
    <center><b id="depth-val">20</b> Layers</center>
    
    <hr>
    <h4>Handling Channel Mismatches</h4>
    <p style="font-size: 0.85em; line-height: 1.4; color: #334155;">
        If Layer A has <b>4 filters</b> and Layer B has <b>2 filters</b>, we cannot add them directly. We use a <b>$1 \times 1$ Convolution</b> ($W_s$) to project the shape:
    </p>

    <div style="font-size: 0.8em; background: #fff4ed; padding: 10px; border-radius: 4px; border: 1px solid #fb923c; margin-bottom: 10px;">
        <div style="display:flex; justify-content:space-between;"><span>Source $x$:</span> <b style="color:#e65100;">[H, W, 4]</b></div>
        <div style="display:flex; justify-content:space-between;"><span>$1 \times 1$ Conv ($W_s$):</span> <b>[1, 1, 4, 2]</b></div>
        <div style="display:flex; justify-content:space-between; border-top: 1px solid #fdba74; margin-top:5px; padding-top:5px;">
            <span>Projected $x$:</span> <b style="color:#22c55e;">[H, W, 2]</b>
        </div>
    </div>

    <p style="font-size: 0.75em; color: #64748b;">
        <b>The Math:</b> $y = F(x, \{W_i\}) + W_s x$<br>
        $W_s$ is a learnable weight matrix used only when a shortcut crosses a "stride" or changes filter count.
    </p>

    <hr>
    <h4>Tensor Shape Flow</h4>
    <div style="font-size: 0.8em; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
        <div style="display:flex; justify-content:space-between;"><span>Input $x$:</span> <b>[64, 64, 3]</b></div>
        <div style="display:flex; justify-content:space-between;"><span>Conv Path:</span> <b>[64, 64, 3]</b></div>
        <div style="display:flex; justify-content:space-between; color:#3b82f6; border-top: 1px solid #ddd; margin-top:5px; padding-top:5px;">
            <span>Output ($F(x)+x$):</span> <b>[64, 64, 3]</b>
        </div>
    </div>
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
    </div>
</div>
