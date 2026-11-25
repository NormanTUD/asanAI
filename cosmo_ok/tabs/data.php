<div id="training_data_tab" class="tab">
	<div id="lenet_example_cosmo" class="tab" style="display: none">

		<span class="TRANSLATEME_we_want_to_train_this_model_5_categories" style="display: block"></span>
		<br>
		<center>
			<table border=0>
				<tr>
					<td class='cosmo_example_table'><span class="TRANSLATEME_fire"></span></td>
					<td class='cosmo_example_table'><span class="TRANSLATEME_mandatory"></span></td>
					<td class='cosmo_example_table'><span class="TRANSLATEME_prohibition"></span></td>
					<td class='cosmo_example_table'><span class="TRANSLATEME_rescue"></span></td>
					<td class='cosmo_example_table'><span class="TRANSLATEME_warning"></span></td>
				</tr>
				<tr>
					<td class='cosmo_example_table'><img class='example_imgs_cosmo_mode' src='traindata/signs/fire/116px-Fire_Class_B.svg.png'></td>
					<td class='cosmo_example_table'><img class='example_imgs_cosmo_mode' src='traindata/signs/mandatory/120px-DIN_4844-2_D-M001.svg.png'></td>
					<td class='cosmo_example_table'><img class='example_imgs_cosmo_mode' src='traindata/signs/prohibition/120px-DIN_4844-2_D-P001.svg.png'></td>
					<td class='cosmo_example_table'><img class='example_imgs_cosmo_mode' src='traindata/signs/rescue/120px-DIN_4844-2_WSE001.svg.png'></td>
					<td class='cosmo_example_table'><img class='example_imgs_cosmo_mode' src='traindata/signs/warning/120px-D-W002_Warning_orange.svg.png'></td>
				</tr>
			</table>
		</center>
		<hr class="cosmo_hr">
		<br>
		<img style='width: 90%; max-height: 600px; max-width: 800px;' src="lang/__de__signs_network_cosmo.svg"><br>
	</div>
	<div id="beschreibung_cosmo_laden" style="display: none">
		<hr class="cosmo_hr">
		<span class="TRANSLATEME_the_more_variations_the_model_sees"></span>
	</div>
	<span class="user_select_none">
		<div id="percentage" class="user_select_none reset_before_train_network"></div>
		<button id="stop_downloading" onclick="stop_downloading_data=true" style="display: none">Stop downloading and start training</button>
	</span>
	<div id="photos" style="display: none; height: 95%; min-height: 400px; overflow-y: auto" class="tab reset_before_train_network"><br>Click 'Start training' to start downloading the training data and then train on them.</div>
	<div id="cosmo_mode_visualization" class="tab"></div>
	<div id="xy_display_data" style="display: none; height: 400px; max-height: 400px; overflow-y: auto" class="tab reset_before_train_network"><br>Click 'Start training' to start downloading the training data and then train on them.</div>
	<div class="" id="download_data" style="display: none"></div>
</div>
