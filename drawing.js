"use strict";

function setup_atrament_data(idname, customfunc) {
	atrament_data[idname] = {};

	// Drawings code
	// first, we need to set up the canvas
	atrament_data[idname]["canvas"] = document.getElementById(idname);
	atrament_data[idname]["canvas"] .style.cursor = "cell";
	// instantiate Atrament
	atrament_data[idname]["atrament"] = new Atrament(
		atrament_data[idname]["canvas"], {
			width: atrament_data[idname]["canvas"].offsetWidth,
			height: atrament_data[idname]["canvas"].offsetHeight
		}
	);

	var ctx = atrament_data[idname]["canvas"] .getContext("2d");
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, atrament_data[idname]["canvas"].width, atrament_data[idname]["canvas"].height);

	// a little helper tool for logging events
	var logElement = document.getElementById("events");

	atrament_data[idname]["atrament"].addEventListener("clean", () => {
		taint_privacy();

		if(customfunc) {
			eval(customfunc);
		}
	});

	atrament_data[idname]["atrament"].addEventListener("fillstart", ({ x, y }) => {
		taint_privacy();

		atrament_data[idname]["canvas"].style.cursor = "wait";
		if(customfunc) {
			eval(customfunc);
		}
	});

	atrament_data[idname]["atrament"].addEventListener("fillend", () => {
		taint_privacy();

		atrament_data[idname]["canvas"].style.cursor = "cell";
		if(customfunc) {
			eval(customfunc);
		}
	});

	atrament_data[idname]["atrament"].addEventListener("strokeend", async () => {
		taint_privacy();

		if(customfunc) {
			try {
				eval(customfunc);
			} catch (e) {
				wrn("[get_drawing_board_on_page] Cannot run custom atrament function, probably because the model was undefined: " + e);
				console.trace();
			}
		}
	});

	atrament_data[idname]["atrament"].adaptiveStroke = true;
	atrament_data[idname]["colorpicker"] = new jscolor($("#" + idname + "_colorpicker")[0], {format:"rgb"});
	atrament_data[idname]["atrament"].weight = 20;
}

function clear_attrament (idname) {
	if(!atrament_data) {
		wrn("[clear_attrament] atrament_data not defined");
		return;
	}

	if(idname === null) {
		wrn(language[lang]["idname_is_null_returning"]);
		return;
	}

	if(idname === undefined) {
		wrn(language[lang]["idname_is_undefined_returning"]);
		return;
	}

	if(!Object.keys(atrament_data).includes(idname)) {
		wrn(`clear_attrament("${idname}"): idname = "${idname}" (type: ${typeof(idname)})not found`);
		return;
	}

	try {
		atrament_data[idname]["atrament"].context.fillStyle = "#ffffff";
		atrament_data[idname]["atrament"].context.fillRect(
			0,
			0,
			atrament_data[idname]["atrament"].canvas.width,
			atrament_data[idname]["atrament"].canvas.height
		);
	} catch (e) {
		err(e);
	}

}

function atrament_set_brush (t, idname) {
	atrament_data[idname]['atrament'].mode = 'brush';
	$(t).parent().find('.pen_size_slider').show();
	$(t).parent().find('.jscolor').show();
	green_marker(t);
	hide_colorpicker_for_eraser(idname);
}

function atrament_set_fill(t, idname) {
	atrament_data[idname]['atrament'].mode = 'fill';
	$(t).parent().find('.pen_size_slider').hide();
	$(t).parent().find('.jscolor').show();
	green_marker(t);
	hide_colorpicker_for_eraser(idname);
}

function green_marker (element) {
	$(element).parent().parent().find(".green_icon").removeClass("green_icon");
	$(element).addClass("green_icon");
}

function chose_nearest_color_picker (e) {
	var $e = $(e);

	if(!$e.length) {
		err("Cannot find element e: " + e);
		return;
	}

	var input = $(e).parent().find("input");

	if(!input.length) {
		err(language[lang]["could_not_find_input"]);
		return;
	}

	var id = $(input)[0].id.replace(/_colorpicker$/, "");

	atrament_data[id].colorpicker.show();
}

function hide_colorpicker_for_eraser (idname) {
	try {
		var box = $(atrament_data[idname].canvas).parent();

		if(atrament_data[idname]["atrament"].mode == "erase") {
			box.find(".colorpicker_elements").css("visibility", "hidden");
		} else {
			box.find(".colorpicker_elements").css("visibility", "visible");
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function clone_canvas(oldCanvas) {
	try {
		//create a new canvas
		var newCanvas = document.createElement("canvas");
		var context = newCanvas.getContext("2d");

		//set dimensions
		newCanvas.width = oldCanvas.width;
		newCanvas.height = oldCanvas.height;

		//apply the old canvas to the new one
		context.drawImage(oldCanvas, 0, 0);

		//return the new canvas
		return newCanvas;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}
