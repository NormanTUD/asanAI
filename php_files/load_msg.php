<?php
	$is_dark = isset($_COOKIE["theme"]) && $_COOKIE["theme"] == "darkmode";
	$warm_rgb = $is_dark ? "233,170,96" : "190,120,50";
	$intro_glow = $is_dark ? "rgba(233,170,96,0.20)" : "rgba(150,110,66,0.28)";
	$rule_color = $is_dark ? "rgba(233,170,96,0.4)" : "rgba(150,110,66,0.38)";
	$sub_color = $is_dark ? "rgba(214,176,124,0.85)" : "rgba(150,110,66,0.88)";

	$headline = "asanAI";
	$subtitle = "machine learning made easy";

	$base_delay = 0.35;
	$letters_html = "";
	$li = 0;
	foreach (str_split($headline) as $ch) {
		$delay = $base_delay + $li * 0.04;
		$letters_html .= '<span class="loader-letter" style="animation-delay:'
			. number_format($delay, 3, ".", "") . 's">'
			. htmlspecialchars($ch, ENT_QUOTES) . '</span>';
		$li++;
	}
?>
<div class="loading_bg" id="loading_icon_wrapper">
	<img src="_gui/scads_logo.svg" class="loader-corner-logo" data-tr-alt="loading" style="position: absolute; left: 10px; top: 10px; height: 8vw">
<?php
	if($is_dark) {
?>
		<img src="_gui/logo_small_dark.png" class="loader-corner-logo" data-tr-alt="loading" style="position: absolute; right: 10px; top: 10px; height: 8vw">
<?php
	} else {
?>
		<img src="_gui/logo.svg" class="loader-corner-logo" data-tr-alt="loading" style="position: absolute; right: 10px; top: 10px; height: 8vw">
<?php
	}
?>
	<canvas id="loader-network-canvas" aria-hidden="true"></canvas>
	<div id="loader-top-group">
		<div id="loader-title-block"
			style="--intro-warm-rgb: <?php echo $warm_rgb; ?>; --intro-glow: <?php echo $intro_glow; ?>;">
			<div class="loader-title">
				<span class="loader-title-head" data-text="<?php echo htmlspecialchars($headline, ENT_QUOTES); ?>"><?php echo $letters_html; ?></span>
				<span class="loader-title-rule" style="background: <?php echo $rule_color; ?>"></span>
				<span class="loader-title-sub" style="color: <?php echo $sub_color; ?>"><?php echo htmlspecialchars($subtitle, ENT_QUOTES); ?></span>
			</div>
		</div>
		<div class="spinner"></div>
	</div>
	<div id="loader-bottom-group">
		<div id="load_msg_steps"></div>
		<div id="load_msg"></div>
	</div>
</div>
