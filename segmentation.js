function delete_custom_drawing_layer() {
    var all_current_custom_images = $(".own_image_span");
    for (var all_current_custom_images_idx = 0; all_current_custom_images_idx < all_current_custom_images.length; all_current_custom_images_idx++) {
        var imgs = $(all_current_custom_images[all_current_custom_images_idx]).find("img,canvas");
        for (var j = 0; j < imgs.length; j++) {
            try {
                var this_canvas_id = imgs[j].id;
                if ($("#" + this_canvas_id + "_layer").length) {
                    l(language[lang]["deleting_layer_for_custom_image"] + " " + this_canvas_id);
                    $("#" + this_canvas_id + "_layer").remove();
                    $("#" + this_canvas_id + "_layer_colorpicker").remove();
                    $("#" + this_canvas_id + "_layer_slider").remove();
                    // Also remove any associated br, label text, and pen size elements
                    $("#" + this_canvas_id + "_layer_transparency_label").remove();
                    $("#" + this_canvas_id + "_layer_pensize").remove();
                    $("#" + this_canvas_id + "_layer_pensize_label").remove();
                    delete(atrament_data[this_canvas_id]);
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

        // Ensure the own_image_span has position:relative so absolutely-positioned
        // children are positioned relative to it, not a distant ancestor.
        if (this_span.css("position") === "static" || this_span.css("position") === "") {
            this_span.css("position", "relative");
        }
        // Also ensure it's displayed as a block/inline-block so it has dimensions
        if (this_span.css("display") === "inline") {
            this_span.css("display", "inline-block");
        }

        for (var j = 0; j < canvasses.length; j++) {
            var canvas_element = canvasses[j];
            var this_canvas_id = canvas_element.id;

            if (!this_canvas_id) {
                // Assign a unique ID if the element doesn't have one
                this_canvas_id = "segimg_" + uuidv4();
                canvas_element.id = this_canvas_id;
            }

            if (!this_canvas_id.endsWith("_layer")) {
                // Check if a layer already exists for this specific element
                if ($("#" + this_canvas_id + "_layer").length > 0) {
                    // Layer already exists, update its position in case the image moved
                    _update_layer_position(canvas_element);
                    continue;
                }

                // Generate a unique base_id from the element's xpath
                var base_id = btoa(await md5(get_element_xpath(canvas_element))).replaceAll("=", "");
                var new_canvas_id = base_id + "_layer";

                // Double-check: if a layer with this generated ID already exists but
                // the element's own ID-based layer doesn't, there's a collision.
                // Use the element's own ID as the base instead.
                if ($("#" + new_canvas_id).length > 0) {
                    // Collision detected - use the element's own ID as base
                    base_id = this_canvas_id;
                    new_canvas_id = base_id + "_layer";
                    if ($("#" + new_canvas_id).length > 0) {
                        // Already exists with this ID too, just update position
                        _update_layer_position(canvas_element);
                        continue;
                    }
                }

                add_canvas_layer(canvas_element, 0.5, base_id);
            }
        }
    }
}

function _update_layer_position(canvas_element) {
    // Update the position of an existing layer to match its source element
    var layer_id = canvas_element.id + "_layer";
    var $layer = $("#" + layer_id);
    if ($layer.length) {
        $layer.css({
            left: canvas_element.offsetLeft + "px",
            top: canvas_element.offsetTop + "px",
            width: canvas_element.width + "px",
            height: canvas_element.height + "px"
        });
        $layer[0].width = canvas_element.width;
        $layer[0].height = canvas_element.height;
    }
}

function add_canvas_layer(canvas, transparency, base_id) {
    assert(typeof(canvas) == "object", "add_canvas_layer(canvas, transparency, base_id): canvas is not an object");
    assert(typeof(base_id) == "string", "add_canvas_layer(canvas, transparency, base_id): base_id is not a string");
    assert(is_numeric(transparency) || typeof(transparency) == "number", "add_canvas_layer(canvas_, transparency, base_id): transparency is not a number");

    // Ensure the parent span has position:relative for proper absolute positioning
    var $parent = $(canvas).closest(".own_image_span");
    if (!$parent.length) {
        $parent = $(canvas).parent();
    }
    
    if ($parent.css("position") === "static" || $parent.css("position") === "") {
        $parent.css("position", "relative");
    }
    if ($parent.css("display") === "inline") {
        $parent.css("display", "inline-block");
    }

    // Store the original ID of the canvas element before potentially changing it
    var original_canvas_id = canvas.id;
    
    // Set the canvas ID to base_id so we can reference it
    canvas.id = base_id;

    // Create a new canvas element for the layer
    var layer = document.createElement("canvas");
    layer.id = `${base_id}_layer`;
    layer.width = canvas.width || $(canvas).width() || 150;
    layer.height = canvas.height || $(canvas).height() || 150;
    layer.style.position = "absolute";
    layer.style.left = canvas.offsetLeft + "px";
    layer.style.top = canvas.offsetTop + "px";
    layer.style.backgroundColor = "white";
    layer.style.opacity = transparency;
    layer.style.zIndex = "10"; // Ensure it's above the image

    // Append the layer canvas directly after the source canvas, inside the same parent
    $(canvas).after(layer);

    // Create a new Atrament instance for the layer
    atrament_data[layer.id] = {};
    atrament_data[layer.id]["atrament"] = new Atrament(layer);

    clear_attrament(layer.id);

    // Create a controls container for this specific layer
    var controls_container = document.createElement("div");
    controls_container.id = `${layer.id}_controls`;
    controls_container.className = "segmentation_layer_controls";
    controls_container.style.marginTop = "4px";
    controls_container.style.marginBottom = "8px";

    // Create a color picker for this layer
    var color_picker_code = `<input type="text" name="value" id='${layer.id}_colorpicker' class="show_data jscolor" style="width: 50px;" value="#000000" onchange="atrament_data['${layer.id}']['atrament'].color='#'+this.value;" />`;
    $(controls_container).append(color_picker_code);

    // Create a transparency slider for this layer
    var transparency_slider = document.createElement("input");
    transparency_slider.id = layer.id + "_slider";
    transparency_slider.type = "range";
    transparency_slider.min = 0;
    transparency_slider.max = 1;
    transparency_slider.step = 0.01;
    transparency_slider.value = transparency;
    transparency_slider.style.width = "100px";
    transparency_slider.style.verticalAlign = "middle";

    // Update the opacity of the layer when the slider value changes
    transparency_slider.addEventListener("input", function() {
        layer.style.opacity = this.value;
    });

    var transparency_label = document.createElement("span");
    transparency_label.id = `${layer.id}_transparency_label`;
    transparency_label.textContent = " Transparency: ";
    transparency_label.style.fontSize = "12px";

    $(controls_container).append(transparency_label);
    $(controls_container).append(transparency_slider);

    // Create a pen size slider for this layer
    var pensize_label = document.createElement("span");
    pensize_label.id = `${layer.id}_pensize_label`;
    pensize_label.textContent = " Pen size: ";
    pensize_label.style.fontSize = "12px";

    var pensize_slider = document.createElement("input");
    pensize_slider.id = `${layer.id}_pensize`;
    pensize_slider.className = "show_data";
    pensize_slider.type = "range";
    pensize_slider.min = 1;
    pensize_slider.max = 100;
    pensize_slider.step = 1;
    pensize_slider.value = 20;
    pensize_slider.style.width = "80px";
    pensize_slider.style.verticalAlign = "middle";
    pensize_slider.addEventListener("input", function() {
        atrament_data[layer.id]['atrament'].weight = parse_float(this.value);
    });

    $(controls_container).append(pensize_label);
    $(controls_container).append(pensize_slider);

    // Insert the controls container after the layer canvas (still inside the parent span)
    $(layer).after(controls_container);

    // Initialize jscolor for this specific color picker
    atrament_data[layer.id]["colorpicker"] = new jscolor($("#" + layer.id + "_colorpicker")[0], {format: "rgb"});
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
