<?php include_once("functions.php"); ?>
<iframe id="f" src="map.php" style="width:1200px;height:900px;border:0"></iframe>
<pre id="out">PROBE pending</pre>
<script>
setTimeout(function () {
	try {
		var d = document.getElementById('f').contentDocument;
		var wrap = d.getElementById('atlas-canvas-wrap');
		var cv = d.getElementById('atlas-canvas');
		var stage = d.getElementById('atlas-stage');
		document.getElementById('out').textContent = 'PROBE wrap=' + wrap.clientWidth + 'x' + wrap.clientHeight +
			' canvasCss=' + cv.style.width + 'x' + cv.style.height +
			' canvasBox=' + Math.round(cv.getBoundingClientRect().width) + 'x' + Math.round(cv.getBoundingClientRect().height) +
			' stageBox=' + Math.round(stage.getBoundingClientRect().width) +
			' sideBox=' + Math.round(d.getElementById('atlas-side').getBoundingClientRect().width);
	} catch (e) {
		document.getElementById('out').textContent = 'PROBE ERR ' + e;
	}
}, 7000);
</script>
