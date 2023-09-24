<div id="navbar1" class="user_select_none" style="display: flex">
	<ul class="navi_list">
<?php
			$tabs = [
				"training_data",
				"visualization",
				"summary",
				"own_images",
				"own_tensor",
				"own_csv",
				"training",
				"predict",
				"code"
			];

			$onclicks = array(
				"summary" => "write_model_summary_wait()"
			);

			foreach ($tabs as $name) {
				$onclick = "";

				if(isset($onclicks[$name])) {
					$onclick = ' onclick="'.$onclicks[$name].'"';
				}
?>
				<li style='display: none;'><a id="<?php print $name; ?>_tab_label" href="#<?php print $name; ?>_tab"<?php print $onclick; ?> ><span class="TRANSLATEME_<?php print $name; ?>"></span></a></li>
<?php
			}
?>
	</ul>
	<span id="toggle_layer_view_button" style="" onclick="toggle_layer_view()">&#128470;</span>
</div>
<hr id="hr_nav">
