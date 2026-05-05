function delete_custom_drawing_layer () {
	var all_current_custom_images = $(".own_image_span");
	for (var all_current_custom_images_idx = 0; all_current_custom_images_idx < all_current_custom_images.length; all_current_custom_images_idx++) {
		var imgs = $(all_current_custom_images[all_current_custom_images_idx]).find("img,canvas");
		for (var j = 0; j < all_current_custom_images.length; j++) {
			try {
				var this_canvas_id = imgs[j].id;
				if($("#" + this_canvas_id + "_layer").length) {
					l(language[lang]["deleting_layer_for_custom_image"] + " " + this_canvas_id);
					$("#" + this_canvas_id + "_layer").remove();
					$("#" + this_canvas_id + "_layer_colorpicker").remove();
					$("#" + this_canvas_id + "_layer_slider").remove();
					delete(atrament_data[this_canvas_id]);
				}
			} catch (e) {
				//log(e);
			}
		}
	}

}

async function ensure_custom_image_layers () {
	var all_current_custom_images = $(".own_image_span");
	for (var all_current_custom_images_idx = 0; all_current_custom_images_idx < all_current_custom_images.length; all_current_custom_images_idx++) {
		var canvasses = $(all_current_custom_images[all_current_custom_images_idx]).find("img,canvas");

		for (var j = 0; j < canvasses.length; j++) {
			var this_canvas_id = canvasses[j].id;
			if(!this_canvas_id.endsWith("_layer")) {
				var base_id = btoa(await md5(get_element_xpath(canvasses[j]))).replaceAll("=", "");
				var new_canvas_id = base_id + "_layer";
				if($(new_canvas_id).length == 0) {
					add_canvas_layer(canvasses[j], 0.5, base_id);
				}
			}
		}
	}

}
