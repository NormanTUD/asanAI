function delete_custom_drawing_layer() {
    var all_current_custom_images = $(".own_image_span");
    for (var all_current_custom_images_idx = 0; all_current_custom_images_idx < all_current_custom_images.length; all_current_custom_images_idx++) {
        var imgs = $(all_current_custom_images[all_current_custom_images_idx]).find("img,canvas");
        for (var j = 0; j < imgs.length; j++) {
            try {
                var this_canvas_id = imgs[j].id;
                if (this_canvas_id && $("#" + this_canvas_id + "_layer").length) {
                    l(language[lang]["deleting_layer_for_custom_image"] + " " + this_canvas_id);
                    $("#" + this_canvas_id + "_layer").remove();
                    $("#" + this_canvas_id + "_layer_controls").remove();
                    delete(atrament_data[this_canvas_id + "_layer"]);
                }
            } catch (e) {
                //log(e);
            }
        }
    }
}

async function ensure_custom_image_layers() {
    var all_current_custom_images = $(".own_image_span");
    for (var all_current_custom_images_idx = 0; all_current_custom_images_idx < all_current_custom_images.length; all_current_custom_images_idx++) {
        var this_span = $(all_current_custom_images[all_current_custom_images_idx]);
        var canvasses = this_span.find("img,canvas");

        for (var j = 0; j < canvasses.length; j++) {
            var canvas_element = canvasses[j];
            var this_canvas_id = canvas_element.id;

            if (!this_canvas_id) {
                // Assign a unique ID if the element doesn't have one
                this_canvas_id = "segimg_" + uuidv4();
                canvas_element.id = this_canvas_id;
            }

            // Skip elements that ARE layers themselves
            if (this_canvas_id.endsWith("_layer")) {
                continue;
            }

            // Check if a layer already exists for this specific element
            var layer_id = this_canvas_id + "_layer";
            if ($("#" + layer_id).length > 0) {
                // Layer already exists, update its position in case the image moved/resized
                _update_layer_position(canvas_element);
                continue;
            }

            add_canvas_layer(canvas_element, 0.5);
        }
    }
}

function _update_layer_position(canvas_element) {
    var layer_id = canvas_element.id + "_layer";
    var $layer = $("#" + layer_id);
    if ($layer.length) {
        var el_width = canvas_element.width || $(canvas_element).width() || 150;
        var el_height = canvas_element.height || $(canvas_element).height() || 150;

        // Update CSS position
        $layer.css({
            left: canvas_element.offsetLeft + "px",
            top: canvas_element.offsetTop + "px",
            width: el_width + "px",
            height: el_height + "px"
        });

        // Update actual canvas dimensions if they changed
        if ($layer[0].width !== el_width || $layer[0].height !== el_height) {
            $layer[0].width = el_width;
            $layer[0].height = el_height;

            // Re-initialize atrament since canvas size changed
            if (atrament_data[layer_id]) {
                atrament_data[layer_id]["atrament"] = new Atrament($layer[0], {
                    width: el_width,
                    height: el_height
                });
                atrament_data[layer_id]["atrament"].adaptiveStroke = false;
                atrament_data[layer_id]["atrament"].weight = 20;
                clear_attrament(layer_id);
            }
        }
    }
}

function _create_drawing_layer_canvas(canvas, layer_id, el_width, el_height, transparency) {
    var layer = document.createElement("canvas");
    layer.id = layer_id;
    layer.width = el_width;
    layer.height = el_height;
    layer.style.position = "absolute";
    layer.style.left = canvas.offsetLeft + "px";
    layer.style.top = canvas.offsetTop + "px";
    layer.style.width = el_width + "px";
    layer.style.height = el_height + "px";
    layer.style.backgroundColor = "white";
    layer.style.opacity = transparency;
    layer.style.zIndex = "10";
    layer.style.cursor = "crosshair";
    $(canvas).after(layer);
    return layer;
}

function _init_layer_atrament(layer, layer_id, el_width, el_height) {
    atrament_data[layer_id] = {};
    atrament_data[layer_id]["atrament"] = new Atrament(layer, {
        width: el_width,
        height: el_height
    });
    atrament_data[layer_id]["atrament"].adaptiveStroke = false;
    atrament_data[layer_id]["atrament"].weight = 20;
    atrament_data[layer_id]["atrament"].mode = "draw";
    clear_attrament(layer_id);
}

function _create_layer_controls(layer_id, el_width, layer, transparency) {
    var controls_container = document.createElement("div");
    controls_container.id = `${layer_id}_controls`;
    controls_container.className = "segmentation_layer_controls";
    controls_container.style.display = "block";
    controls_container.style.clear = "both";
    controls_container.style.marginTop = "4px";
    controls_container.style.marginBottom = "8px";
    controls_container.style.maxWidth = el_width + "px";

    var color_picker_code = `<input type="text" name="value" id='${layer_id}_colorpicker' class="show_data jscolor" style="width: 50px;" value="#000000" onchange="atrament_data['${layer_id}']['atrament'].color='#'+this.value;" />`;
    $(controls_container).append(color_picker_code);

    var transparency_label = document.createElement("span");
    transparency_label.textContent = " Opacity: ";
    transparency_label.style.fontSize = "11px";
    $(controls_container).append(transparency_label);

    var transparency_slider = document.createElement("input");
    transparency_slider.id = layer_id + "_slider";
    transparency_slider.type = "range";
    transparency_slider.min = 0;
    transparency_slider.max = 1;
    transparency_slider.step = 0.01;
    transparency_slider.value = transparency;
    transparency_slider.style.width = "60px";
    transparency_slider.style.verticalAlign = "middle";
    transparency_slider.addEventListener("input", function() {
        layer.style.opacity = this.value;
    });
    $(controls_container).append(transparency_slider);

    var pensize_label = document.createElement("span");
    pensize_label.textContent = " Pen: ";
    pensize_label.style.fontSize = "11px";
    $(controls_container).append(pensize_label);

    var pensize_slider = document.createElement("input");
    pensize_slider.id = `${layer_id}_pensize`;
    pensize_slider.className = "show_data";
    pensize_slider.type = "range";
    pensize_slider.min = 1;
    pensize_slider.max = 100;
    pensize_slider.step = 1;
    pensize_slider.value = 20;
    pensize_slider.style.width = "60px";
    pensize_slider.style.verticalAlign = "middle";
    pensize_slider.addEventListener("input", function() {
        atrament_data[layer_id]['atrament'].weight = parse_float(this.value);
    });
    $(controls_container).append(pensize_slider);

    var clear_btn = document.createElement("button");
    clear_btn.textContent = "Clear";
    clear_btn.style.fontSize = "11px";
    clear_btn.style.marginLeft = "4px";
    clear_btn.addEventListener("click", function(e) {
        e.preventDefault();
        clear_attrament(layer_id);
    });
    $(controls_container).append(clear_btn);

    return controls_container;
}

function add_canvas_layer(canvas, transparency) {
    assert(typeof(canvas) == "object", "add_canvas_layer(canvas, transparency): canvas is not an object");
    assert(is_numeric(transparency) || typeof(transparency) == "number", "add_canvas_layer(canvas, transparency): transparency is not a number");

    var canvas_id = canvas.id;
    var layer_id = canvas_id + "_layer";

    var $parent = $(canvas).closest(".own_image_span");
    if (!$parent.length) {
        $parent = $(canvas).parent();
    }

    $parent.css({
        "position": "relative",
        "display": "inline-block"
    });

    var el_width = canvas.width || $(canvas).width() || 150;
    var el_height = canvas.height || $(canvas).height() || 150;

    var layer = _create_drawing_layer_canvas(canvas, layer_id, el_width, el_height, transparency);

    _init_layer_atrament(layer, layer_id, el_width, el_height);

    var controls_container = _create_layer_controls(layer_id, el_width, layer, transparency);
    $parent.after(controls_container);

    try {
        atrament_data[layer_id]["colorpicker"] = new jscolor($("#" + layer_id + "_colorpicker")[0], {format: "rgb"});
    } catch(e) {
        wrn("[add_canvas_layer] Could not initialize jscolor: " + e);
    }
}

async function change_last_responsible_layer_for_image_output() {
    if (is_classification) {
        return;
    }

    var current_layer_status_hash = await get_current_layer_container_status_hash();

    if (last_image_output_shape_hash == current_layer_status_hash) {
        return;
    }

    last_image_output_shape_hash = current_layer_status_hash;

    var layer_types = get_layer_type_array();

    var last_layer_nr = null;

    for (var layer_type_idx = layer_types.length - 1; layer_type_idx >= 0; layer_type_idx--) {
        if (last_layer_nr === null && ["dense", "conv2d"].includes(layer_types[layer_type_idx])) {
            last_layer_nr = layer_type_idx;
        }
    }

    if (typeof(last_layer_nr) == "number" && last_layer_nr >= 0) {
        if ($($(".layer_setting")[last_layer_nr]).find(".units,.filters").val() != 3) {
            l(sprintf(language[lang]["setting_neurons_or_filters_of_layer_n_to_3"], last_layer_nr));
            $($(".layer_setting")[last_layer_nr]).find(".units,.filters").val(3).trigger("change");
        }

        if ($($(".layer_setting")[last_layer_nr]).find(".activation").val() != "linear") {
            l(sprintf(language[lang]["setting_activation_function_of_layer_n_to_linear"], last_layer_nr));
            $($(".layer_setting")[last_layer_nr]).find(".activation").val("linear").trigger("change");
        }
    } else {
        wrn("[change_last_responsible_layer_for_image_output] Last layer number could not be found. Do you have any Dense or Conv2d layers?");
    }
}
