<div id="navbar1" class="user_select_none" style="display: flex">
	<ul class="navi_list">
		<li><a id="training_data_tab_label" href="#training_data_tab"><span class='TRANSLATEME_data'></span></a></li>
		<li><a id="visualization_tab_label" href="#visualization_tab" ><span class='TRANSLATEME_model_visualization'></span></a></li>
		<li><a id="summary_tab_label" href="#summary_tab" onclick="write_model_summary_wait()"><span class="TRANSLATEME_summary"></span></a></li>
		<li><a id="own_images_label" href="#own_images"><span class="TRANSLATEME_own_images"></span></a></li>
<?php
			$tabs = [
				"own_tensor",
				"own_csv",
				"training",
				"predict",
				"code"
			];

			foreach ($tabs as $name) {
?>
				<li><a id="<?php print $name; ?>_tab_label" href="#<?php print $name; ?>_tab"><span class="TRANSLATEME_<?php print $name; ?>"></span></a></li>
<?php
			}
?>
	</ul>
	<span id="toggle_layer_view_button" style="" onclick="toggle_layer_view()">&#128470;</span>
</div>
<hr id="hr_nav">
