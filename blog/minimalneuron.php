<?php include_once("functions.php"); ?>
    <h2>Minimales Neuron Lab</h2>
    <div class="grid-layout">
	<div class="layers-vertical">
	    <div class="layer-box" style="border-color:#10b981"><span class="layer-badge">INPUT</span>1 Node (x)</div>
	    <div class="layer-box" style="border-color:#8b5cf6"><span class="layer-badge">OUTPUT</span>1 Node (y)</div>
	    LR: <input type="number" id="lin-lr" value="0.1" step="0.01">
	    Epochs: <input type="number" id="lin-epochs" value="100">
	</div>
	<div>
	    <div style="display: flex; gap: 15px; flex-wrap: wrap;">
		<div id="lin-loss-chart" class="plot-container"></div>
		<div id="lin-data-chart" class="plot-container"></div>
	    </div>
	    <div id="lin-math-monitor" style="padding:15px; margin-top:10px;"></div>
	    <button id="btn-lin-train" class="btn btn-train" onclick="toggleTraining('lin')">🚀 Training Starten</button>
	    <button class="btn" style="background:#64748b; color:white; width:100%" onclick="initBlock('lin')">🔄 Reset Modell</button>
	    <div id="lin-console" class="status-console"></div>
	</div>
    </div>
