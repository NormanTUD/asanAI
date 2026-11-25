<script>
	const _default_language = "en";
	var lang = "en";

	var language = <?php print json_encode($GLOBALS["translations"]); ?>;

	function hasWebGL() {
		var supported;

		try {
			var canvas = document.createElement('canvas');
			supported = !!window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
		} catch(e) {
			supported = false;
		}

		try {
			// let is by no means required, but will help us rule out some old browsers/devices with potentially buggy implementations: http://caniuse.com/#feat=let
			eval('let foo = 123;');
		} catch (e) {
			supported = false;
		}

		if (!supported) {
			console.log("WebGL not supported");
		}

		canvas = undefined;

		return supported;
	}

	var has_webgl = hasWebGL();

	var git_hash = "<?php print get_git_hash(); ?>";

	if(!git_hash) {
		console.error("git_hash not defined");
	}

	var original_title = document.title;

	var traindata_struct =
<?php
		include("php_files/traindata.php");
?>
</script>
