function delete_custom_drawing_layer () {
	var all_current_custom_images = $(".own_image_span");
	for (var all_current_custom_images_idx = 0; all_current_custom_images_idx < all_current_custom_images.length; all_current_custom_images_idx++) {
		var imgs = $(all_current_custom_images[all_current_custom_images_idx]).find("img,canvas");
		for (var j = 0; j < imgs.length; j++) {
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
                // If the canvas already has a base_id assigned, reuse it
                if(this_canvas_id && $("#" + this_canvas_id + "_layer").length > 0) {
                    continue; // layer already exists for this canvas
                }
                var base_id = btoa(await md5(get_element_xpath(canvasses[j]))).replaceAll("=", "");
                var new_canvas_id = base_id + "_layer";
                if($("#" + new_canvas_id).length == 0) {
                    add_canvas_layer(canvasses[j], 0.5, base_id);
                }
            }
        }
    }
}

function add_canvas_layer(canvas, transparency, base_id) {
	assert(typeof(canvas) == "object", "add_canvas_layer(canvas, transparency, base_id): canvas is not an object");
	assert(typeof(base_id) == "string", "add_canvas_layer(canvas, transparency, base_id): base_id is not a string");
	assert(is_numeric(transparency) || typeof(transparency) == "number", "add_canvas_layer(canvas_, transparency, base_id): transparency is not a number");
	// Get the canvas element

	// Create a new canvas element for the layer
	var layer = document.createElement("canvas");
	canvas.id = base_id;
	layer.id = `${base_id}_layer`;
	layer.width = canvas.width;
	layer.height = canvas.height;
	layer.style.position = "absolute";
	layer.style.left = canvas.offsetLeft + "px";
	layer.style.top = canvas.offsetTop + "px";
	layer.style.backgroundColor = "white";
	layer.style.opacity = transparency;

	// Add the new canvas element to the document
	$(canvas).parent().append(layer);

	// Create a new Atrament instance for the layer
	atrament_data[layer.id] = {};
	atrament_data[layer.id]["atrament"] = new Atrament(layer);

	clear_attrament(layer.id);

	// Create a transparency slider
	var transparency_slider = document.createElement("input");
	transparency_slider.id = layer.id + "_slider";
	transparency_slider.type = "range";
	transparency_slider.min = 0;
	transparency_slider.max = 1;
	transparency_slider.step = 0.01;
	transparency_slider.value = transparency;
	transparency_slider.style.position = "absolute";
	transparency_slider.style.left = canvas.offsetLeft + canvas.width + "px";
	transparency_slider.style.top = canvas.offsetTop + "px";
	transparency_slider.style.width = "100px";

	// Update the opacity of the layer when the slider value changes
	transparency_slider.addEventListener("input", function() {
		layer.style.opacity = this.value;
	});

	// Add the transparency slider to the document

	$(canvas).parent().append("<br>");
	var color_picker_code = `<input type="text" name="value" id='${layer.id}_colorpicker' class="show_data jscolor" value="#000000" onchange="atrament_data['${layer.id}']['atrament'].color='#'+this.value;"  /><br>`;
	$(canvas).parent().append(color_picker_code);
	atrament_data[layer.id]["colorpicker"] = new jscolor($("#" + layer.id + "_colorpicker")[0], {format:"rgb"});

	$(canvas).parent().append("<br>Transparency:");
	$(canvas).parent().append(transparency_slider);

	$(canvas).parent().append("<br>Pen size:");
	$(canvas).parent().append($(`<input class="show_data" type="range" min="1" oninput="atrament_data['${layer.id}']['atrament'].weight=parse_float(event.target.value);" value="20" step="1" max="100" autocomplete="off">`));
}
