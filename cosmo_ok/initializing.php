<script>
	language = <?php print json_encode($GLOBALS["translations"]); ?>;

	enable_cosmo_debug = false;
<?php
	if(file_exists("/etc/cosmo_debug")) {
?>
		enable_cosmo_debug = true;
<?php
	}
?>

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
			l("WebGL is not supported");
		}

		canvas = undefined;

		return supported;
	}

	has_webgl = hasWebGL();

	git_hash = "<?php print get_git_hash(); ?>";

	if(!git_hash) {
		console.error("git_hash not defined");
	}

	original_title = document.title;

	traindata_struct =
<?php
		include("traindata.php");
?>
</script>
