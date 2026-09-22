<?php include_once("functions.php"); ?>
<iframe id="f" src="map.php" style="width:1200px;height:900px;border:0"></iframe>
<pre id="out">PROBE pending</pre>
<script>
function finish(msg) {
	document.getElementById('out').textContent = msg;
	try {
		var w = document.getElementById('f').contentWindow;
		w.requestAnimationFrame = function () { return 0; };
	} catch (e) {}
}
function measure(d, w) {
	var wrap = d.getElementById('atlas-canvas-wrap');
	var cv = d.getElementById('atlas-canvas');
	return 'wrap=' + wrap.clientWidth + 'x' + wrap.clientHeight +
		' canvasCss=' + cv.style.width + 'x' + cv.style.height +
		' stageW=' + Math.round(d.getElementById('atlas-stage').getBoundingClientRect().width);
}
var t0 = Date.now();
var iv = setInterval(function () {
	if (Date.now() - t0 > 50000) { clearInterval(iv); finish('PROBE TIMEOUT'); return; }
	try {
		var f = document.getElementById('f');
		var d = f.contentDocument;
		var w = f.contentWindow;
		var wrap = d.getElementById('atlas-canvas-wrap');
		var cv = d.getElementById('atlas-canvas');
		if (!wrap || !cv || !cv.style.width) { return; }
		var before = measure(d, w);
		w.dispatchEvent(new w.Event('resize'));
		setTimeout(function () {
			clearInterval(iv);
			finish('PROBE ' + before + '  ||  after-resize: ' + measure(d, w));
		}, 1200);
	} catch (e) {}
}, 400);
</script>
