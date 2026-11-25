<div id="training_tab" class="tab" style="float: right; width: 100%">
	<br>
	<button class="train_neural_network_button hide_in_cosmo_mode" style="width: 150px;" onclick="train_neural_network()"><span class="TRANSLATEME_start_training"></span></button>
	<br>
	<div class="overlay_each_other">
		<div class="show_only_in_cosmo_mode" style="display: none">
			<span id="program_looks_at_data_span">
				<span class="TRANSLATEME_program_looks_at_data"></span><br>
				<hr class="cosmo_hr">
			</span>

			<span id="cosmo_training_predictions_explanation" style="display:none">
				<span class="TRANSLATEME_predictions_explanation_while_training"></span><br>
			</span>

			<span id="cosmo_training_grid_stage_explanation" style="display: none">
				<span class="TRANSLATEME_the_further_on_top_the_better"></span><br>
			</span>

			<span id="show_current_accuracy" style="display: none"></span><br>

			<span id="cosmo_training_plotly_explanation" style="display:none">
				<span class="TRANSLATEME_graph_explanation"></span><br>
			</span>
		</div>
		<div id='show_cosmo_epoch_status' class="show_only_in_cosmo_mode" style="display: none">
			<hr class="cosmo_hr">
			<span id="network_has_seen_msg" style="display: none">
				<span class="TRANSLATEME_currently_the_network_has_seen"></span>
				<span id="time_estimate_cosmo">00:00</span>.
			</span>
		</div>
		<span id="show_after_training" style="display: none" class="TRANSLATEME_training_done_text"></span>
		<span id="canvas_grid_visualization"></span>
		<span id="show_visualization_here_in_cosmo"></span>
		<br>
		<div id="training_content">
			<div id="simplest_training_data_visualization" style="display: none"></div>
			<div id="plotly_epoch_history_div" style="display: none">
				<div id="plotly_epoch_history"></div>
			</div>

			<div style="display: none" class="hide_in_cosmo_mode">
				<div id="plotly_batch_history"></div>
			</div>

			<div style="display: none" class="hide_in_cosmo_mode">
				<div id="plotly_time_per_batch"></div>
			</div>

			<div style="display: none" class="hide_in_cosmo_mode">
				<div id="plotly_memory_history"></div>
			</div>
		</div>
	</div>
	<div id="confusion_matrix_training"></div>
</div>

