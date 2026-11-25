"use strict";

var RIBBON_TOOLTIP_KEYS = {
	"#asanai_main_logo": "ribbon_logo_description",
	"#dataset": "ribbon_dataset_description",
	"#reset_model": "ribbon_reset_model_description",
	"#data_origin": "ribbon_data_origin_description",
	"#model_dataset": "ribbon_model_dataset_description",
	"#loss": "ribbon_loss_description",
	"#metric": "ribbon_metric_description",
	"#inputShape": "ribbon_input_shape_description",
	"#outputShape": "ribbon_output_shape_description",
	"#auto_input_shape": "ribbon_auto_input_shape_description",
	"#number_of_layers": "ribbon_number_of_layers_description",
	"#height": "ribbon_height_description",
	"#width": "ribbon_width_description",
	"#max_number_of_files_per_category": "ribbon_images_per_category_description",
	".train_neural_network_button": "ribbon_start_training_description",
	".retrain_neural_network_button": "ribbon_retrain_description",
	"#divide_by": "ribbon_divide_by_description",
	"#mode_chooser": "ribbon_mode_description",
	"#theme_choser": "ribbon_theme_description",
	"#backend_chooser": "ribbon_backend_description",
	"#which_webcam": "ribbon_webcam_description",
	"#shuffle_before_each_epoch": "ribbon_shuffle_before_epoch_description",
	"#enable_tf_debug": "ribbon_tf_debug_description",
	"#default_resize_method": "ribbon_resize_method_description",
	"#set_all_kernel_initializers": "ribbon_set_all_kernel_initializers_description",
	"#set_all_bias_initializers": "ribbon_set_all_bias_initializers_description",
	"#set_all_activation_functions": "ribbon_set_all_activations_description",
	"#set_all_activation_functions_except_last_layer": "ribbon_set_all_activations_except_last_description",
	"#change_initializers_selector": "ribbon_initializer_selector_description",
	"#set_all_initializers_value_mean": "ribbon_initializer_mean_description",
	"#set_all_initializers_value_value": "ribbon_initializer_value_description",
	"#set_all_initializers_value_distribution": "ribbon_initializer_distribution_description",
	"#set_all_initializers_value_mode": "ribbon_initializer_mode_description",
	"#set_all_initializers_value_scale": "ribbon_initializer_scale_description",
	"#set_all_initializers_value_maxval": "ribbon_initializer_maxval_description",
	"#set_all_initializers_value_minval": "ribbon_initializer_minval_description",
	"#set_all_initializers_value_stddev": "ribbon_initializer_stddev_description",
	"#set_all_initializers_value_seed": "ribbon_initializer_seed_description",
	"#optimizer": "ribbon_optimizer_description",
	"#augment_rotate_images": "ribbon_augment_rotate_description",
	"#number_of_rotations": "ribbon_augment_rotations_description",
	"#augment_invert_images": "ribbon_augment_invert_description",
	"#augment_flip_left_right": "ribbon_augment_flip_description",
	"#augment_brightness": "ribbon_augment_brightness_description",
	"#augment_brightness_amount": "ribbon_augment_brightness_amount_description",
	"#augment_contrast": "ribbon_augment_contrast_description",
	"#augment_contrast_amount": "ribbon_augment_contrast_amount_description",
	"#augment_saturation": "ribbon_augment_saturation_description",
	"#augment_saturation_amount": "ribbon_augment_saturation_amount_description",
	"#augment_grayscale": "ribbon_augment_grayscale_description",
	"#augment_noise": "ribbon_augment_noise_description",
	"#augment_noise_amount": "ribbon_augment_noise_amount_description",
	"#max_activation_iterations": "ribbon_max_activation_iterations_description",
	"#max_activation_lr": "ribbon_max_activation_lr_description",
	"#max_activated_neuron_image_size": "ribbon_max_activated_image_size_description",
	"#max_neurons_fcnn": "ribbon_max_neurons_fcnn_description",
	"#show_input_layer_fcnn": "ribbon_show_input_layer_fcnn_description",
	"#min_time_between_batch_plots": "ribbon_batch_plot_interval_description",
	"#show_bars_instead_of_numbers": "ribbon_show_bars_description",
	"#visualize_images_in_grid": "ribbon_visualize_grid_description",
	"#max_number_of_images_in_grid": "ribbon_grid_image_count_description",
	"#show_raw_data": "ribbon_show_raw_data_description",
	"#pixel_size": "ribbon_pixel_size_description",
	"#kernel_pixel_size": "ribbon_kernel_pixel_size_description",
	"#log": "ribbon_log_description",
	"#log_ribbon button[onclick*='copy_to_clipboard']": "ribbon_copy_log_description",
	"#log_ribbon button[onclick*='confirmAndRunTests']": "ribbon_run_tests_description",
	"#imprint_ribbon button[onclick*='mailto']": "ribbon_contact_mail_description",
	"#imprint_ribbon button[onclick*='arxiv']": "ribbon_paper_description",
	"#imprint_ribbon button[onclick*='github']": "ribbon_code_description",
	"#imprint_ribbon button[onclick*='sources_popup']": "ribbon_sources_description",
	"#manual_page_link": "ribbon_help_description",
	"#upload_file_dialog": "ribbon_upload_model_description",
	"#tiny_graph_li": "ribbon_tiny_graph_description",
	"#language_shower span[onclick*='update_lang(\"de\")']": "ribbon_language_german",
	"#language_shower span[onclick*='update_lang(\"en\")']": "ribbon_language_english",
	"#ribbon_shower span[onclick*='update_lang(\"de\")']": "ribbon_language_german",
	"#ribbon_shower span[onclick*='update_lang(\"en\")']": "ribbon_language_english"
};

var RIBBON_GROUP_TOOLTIP_KEYS = {
	"#home_ribbon .ribbon-group-title .TRANSLATEME_dataset_and_network": "ribbon_group_dataset_and_network_description",
	"#home_ribbon .ribbon-group-title .TRANSLATEME_loss_metric_data_and_shape": "ribbon_group_loss_metric_data_and_shape_description",
	"#home_ribbon .ribbon-group-title .TRANSLATEME_layers": "ribbon_group_layers_description",
	"#home_ribbon .ribbon-group-title .TRANSLATEME_hyperparameters": "ribbon_group_hyperparameters_description",
	"#home_ribbon .ribbon-group-title .TRANSLATEME_image_options": "ribbon_group_image_options_description",
	"#home_ribbon .ribbon-group-title .TRANSLATEME_training": "ribbon_group_training_description",
	"#tf_ribbon_settings .ribbon-group-title .TRANSLATEME_gui_mode_style": "ribbon_group_gui_mode_style_description",
	"#tf_ribbon_settings .ribbon-group-title .TRANSLATEME_tf_backend": "ribbon_group_tf_backend_description",
	"#tf_ribbon_settings .ribbon-group-title .TRANSLATEME_webcam_options": "ribbon_group_webcam_options_description",
	"#tf_ribbon_settings .ribbon-group-title .TRANSLATEME_weights_shuffle_resize": "ribbon_group_weights_shuffle_resize_description",
	"#tf_ribbon_settings .ribbon-group-title .TRANSLATEME_set_all_initializers": "ribbon_group_set_all_initializers_description",
	"#tf_ribbon_settings .ribbon-group-title .TRANSLATEME_optimizer": "ribbon_group_optimizer_description",
	"#tf_ribbon_augmentation .ribbon-group-title .TRANSLATEME_augmentation": "ribbon_group_augmentation_description",
	"#visualization_ribbon .ribbon-group-title .TRANSLATEME_max_activated_neurons": "ribbon_group_max_activated_neurons_description",
	"#visualization_ribbon .ribbon-group-title .TRANSLATEME_fcnn_batch_plot": "ribbon_group_fcnn_batch_plot_description",
	"#visualization_ribbon .ribbon-group-title .TRANSLATEME_various_plots": "ribbon_group_various_plots_description",
	"#visualization_ribbon .ribbon-group-title .TRANSLATEME_layer_data_flow": "ribbon_group_layer_data_flow_description",
	"#log_ribbon .ribbon-group-title .TRANSLATEME_log_label": "ribbon_group_log_description"
};

function _set_ribbon_tooltip ($element, key, text, force = false) {
	if(!$element.length) return;

	var existing_key = $element.attr("data-tr-title");

	if(force || !existing_key) {
		$element.attr("data-tr-title", key);
		if(text) {
			$element.attr("title", text);
		}
		return;
	}

	var existing_text = (typeof language !== "undefined" && language[lang]) ? language[lang][existing_key] : null;
	if(existing_text && !$element.attr("title")) {
		$element.attr("title", existing_text);
	}
}

function _set_ribbon_label_tooltip ($control, key, text, force = false) {
	var $label_cell = $control.closest("tr").children("td").first();
	if(!$label_cell.length) return;
	_set_ribbon_tooltip($label_cell, key, text, force);
}

function setRibbonTooltips () {
	var translations = (typeof language !== "undefined" && language[lang]) ? language[lang] : {};

	Object.keys(RIBBON_TOOLTIP_KEYS).forEach(function (selector) {
		var key = RIBBON_TOOLTIP_KEYS[selector];
		var text = translations[key];

		$(selector).each(function () {
			_set_ribbon_tooltip($(this), key, text);
			_set_ribbon_label_tooltip($(this), key, text);
			var id = $(this).attr("id");
			if(id) {
				_set_ribbon_tooltip($('label[for="' + id + '"]'), key, text);
			}
		});
	});

	Object.keys(RIBBON_GROUP_TOOLTIP_KEYS).forEach(function (selector) {
		var key = RIBBON_GROUP_TOOLTIP_KEYS[selector];
		_set_ribbon_tooltip($(selector), key, translations[key]);
	});

	_set_ribbon_label_tooltip($("#inputShape"), "ribbon_shapes_description", translations["ribbon_shapes_description"], true);
}
