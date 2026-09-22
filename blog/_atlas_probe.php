<?php include_once("functions.php"); ?>
<iframe id="f" src="map.php" style="width:1200px;height:900px;border:0"></iframe>
<pre id="out">PROBE pending</pre>
<script>
function probe() {
	var d;
	try { d = document.getElementById('f').contentDocument; } catch (e) { return; }
	var wrap = d.getElementById('atlas-canvas-wrap');
	if (!wrap || !wrap.clientWidth) { return; }
	var w = document.getElementById('f').contentWindow;
	w.requestAnimationFrame = function () { return 0; };
	w.cancelAnimationFrame = function () {};
	var cv = d.getElementById('atlas-canvas');
	var stage = d.getElementById('atlas-stage');
	document.getElementById('out').textContent = 'PROBE wrap=' + wrap.clientWidth + 'x' + wrap.clientHeight +
		' canvasCss=' + cv.style.width + 'x' + cv.style.height +
		' canvasBox=' + Math.round(cv.getBoundingClientRect().width) + 'x' + Math.round(cv.getBoundingClientRect().height) +
		' stageBox=' + Math.round(stage.getBoundingClientRect().width) +
		' sideBox=' + Math.round(d.getElementById('atlas-side').getBoundingClientRect().width) +
		' iframeWin=' + w.innerWidth;
}
var t0 = Date.now();
var iv = setInterval(function () {
	try { probe(); } catch (e) {}
	if (Date.now() - t0 > 40000 || document.getElementById('out').textContent.indexOf('PROBE wrap=') === 0) {
		clearInterval(iv);
	}
}, 400);
</script>
