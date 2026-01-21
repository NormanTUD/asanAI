<?php include_once("functions.php"); ?>

<div class="md">
# Interactive Position Tester

Adjust the sequence length to see how the unique "signature" of each position evolves.
</div>

<div style="margin-bottom: 20px;">
	Length: <input type="range" id="pe-len" min="1" max="20" value="5" oninput="PositionalLab.renderTable(this.value); document.getElementById('pe-val').innerText = this.value">
	<span id="pe-val">5</span> tokens
</div>

<div id="pe-viz-container" style="overflow-x: auto; background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 10px;"></div>
