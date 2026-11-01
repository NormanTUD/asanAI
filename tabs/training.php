<div id="training_tab" class="tab" style="float: right; width: 100%">
	<br>
	<button class="train_neural_network_button" style="width: 150px;" onclick="train_neural_network()"><span class="TRANSLATEME_start_training"></span></button>
	<br>
	<div class="overlay_each_other">
		<span id="show_after_training" style="display: none" class="TRANSLATEME_training_done_text"></span>
		<span id="canvas_grid_visualization"></span>
		<br>
		<div id="training_content">
			<div id="training_live_metrics" class="training-live-metrics" style="display: none">
				<div class="TRANSLATEME_training_live_title tlm-heading"></div>
				<div class="tlm-card">
					<span class="TRANSLATEME_training_live_epoch tlm-label"></span>
					<span class="tlm-value" id="tlm_epoch">—</span>
					<div class="tlm-progress"><div id="tlm_progress_fill"></div></div>
				</div>
				<div class="tlm-card">
					<span class="TRANSLATEME_loss tlm-label"></span>
					<span class="tlm-value" id="tlm_loss">—</span>
					<span class="tlm-sub" id="tlm_loss_sub"></span>
				</div>
				<div class="tlm-card">
					<span class="TRANSLATEME_training_live_val_loss tlm-label"></span>
					<span class="tlm-value" id="tlm_val_loss">—</span>
					<span class="tlm-sub" id="tlm_val_loss_sub"></span>
				</div>
				<div class="tlm-card" id="tlm_metric_card">
					<span class="tlm-label" id="tlm_metric_label">—</span>
					<span class="tlm-value" id="tlm_metric">—</span>
					<span class="tlm-sub" id="tlm_metric_sub"></span>
				</div>
				<div class="tlm-card">
					<span class="tlm-label" id="tlm_best_label">—</span>
					<span class="tlm-value" id="tlm_best">—</span>
					<span class="tlm-sub" id="tlm_best_sub"></span>
				</div>
				<div class="tlm-card">
					<span class="TRANSLATEME_training_live_time_left tlm-label"></span>
					<span class="tlm-value" id="tlm_time_left">—</span>
				</div>
			</div>

			<div id="plotly_metric_history_div" style="display: none">
				<div id="plotly_metric_history"></div>
			</div>

			<div id="training_class_history_div" style="display: none">
				<div class="TRANSLATEME_training_class_history_title tlm-heading"></div>
				<div id="training_class_history_split" class="tlm-sub"></div>
				<div id="plotly_training_class_history"></div>
			</div>

			<div id="training_hard_examples_div" style="display: none">
				<div class="TRANSLATEME_training_hard_examples_title tlm-heading"></div>
				<div id="training_hard_examples" class="training-hard-examples"></div>
			</div>

			<div id="simplest_training_data_visualization" style="display: none"></div>

			<div id="bend_graph"></div>

			<div id="training_history_tabs" style="display: none"></div>

			<div id="plotly_epoch_history_div" style="display: none">
				<div id="plotly_epoch_history"></div>
			</div>

			<div id="auto_loss_landscape"></div>
		</div>
	</div>
	<div id="multi_run_stats"></div>
	<div id="neural_organism"></div>
	<div id="confusion_matrix_training"></div>
</div>

