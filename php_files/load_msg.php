<div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; pointer-events: none; background-color: white; user-select: none;" id="loading_icon_wrapper">
	<img src="_gui/scads_logo.svg" class="invert_in_dark_mode" alt="Loading..." style="position: absolute; left: 10px; top: 10px; height: 8vw">
<?php
	if(isset($_COOKIE["theme"])) {
		if($_COOKIE["theme"] == "darkmode") {
?>
			<img src="_gui/logo_small_dark.png" class="invert_in_dark_mode" alt="Loading..." style="position: absolute; right: 10px; top: 10px; height: 8vw">
<?php
		} else {
?>
			<img src="_gui/logo.svg" class="invert_in_dark_mode" alt="Loading..." style="position: absolute; right: 10px; top: 10px; height: 8vw">
<?php
		}
	} else {
?>
		<img src="_gui/logo.svg" class="invert_in_dark_mode" alt="Loading..." style="position: absolute; right: 10px; top: 10px; height: 8vw">
<?php
	}
?>
	<div class="spinner"></div>
	<br>
	<div id="load_msg"></div>
</div>
