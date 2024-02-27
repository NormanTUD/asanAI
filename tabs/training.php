<div id="training_tab" class="tab" style="float: right; width: 100%">
	<br>
	<button class="train_neural_network_button" style="width: 150px;" onclick="train_neural_network()"><span class="TRANSLATEME_start_training"></span></button>
	<br>
	<div class="overlay_each_other">
		<span id="show_after_training" style="display: none" class="TRANSLATEME_training_done_text"></span>
		<span id="canvas_grid_visualization"></span>
		<br>
		<div id="training_content">
			<div id="simplest_training_data_visualization" style="display: none"></div>
			<div id="plotly_epoch_history_div" style="display: none">
				<div id="plotly_epoch_history"></div>
			</div>

			<div style="display: none">
				<div id="plotly_batch_history"></div>
			</div>

			<div style="display: none">
				<div id="plotly_time_per_batch"></div>
			</div>

			<div style="display: none">
				<div id="plotly_memory_history"></div>
			</div>
		</div>
	</div>
	<div id="confusion_matrix_training"></div>
</div>

