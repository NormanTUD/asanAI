"use strict";

function get_shape_from_file (file) {
	if(file === null) {
		return null;
	}
	var input_shape_line = file.split("\n")[0];
	var shape_match = /^#\s*shape \(\d+,\s*(.*)\)$/.exec(input_shape_line);

	if(1 in shape_match) {
		return shape_match[1];
	}
	return null;
}

function get_dimensionality_from_layer_name (layer_type) {
	var match = layer_type.match(/(\d+)[dD]$/);

	if(match) {
		return match[1];
	}
	return null;
}

function get_full_shape_from_file (file) {
	if(file === null) {
		return null;
	}
	var input_shape_line = file.split("\n")[0];
	var shape_match = /^#\s*shape \((.*)\)$/.exec(input_shape_line);
	if(1 in shape_match) {
		return shape_match[1];
	}
	return null;
}

function md5(inputString) {
	var hc = "0123456789abcdef";
	function rh(n) {var j,s="";for(j=0;j<=3;j++) s+=hc.charAt((n>>(j*8+4))&0x0F)+hc.charAt((n>>(j*8))&0x0F);return s;}
	function ad(x,y) {var l=(x&0xFFFF)+(y&0xFFFF);var m=(x>>16)+(y>>16)+(l>>16);return (m<<16)|(l&0xFFFF);}
	function rl(n,c)            {return (n<<c)|(n>>>(32-c));}
	function cm(q,a,b,x,s,t)    {return ad(rl(ad(ad(a,q),ad(x,t)),s),b);}
	function ff(a,b,c,d,x,s,t)  {return cm((b&c)|((~b)&d),a,b,x,s,t);}
	function gg(a,b,c,d,x,s,t)  {return cm((b&d)|(c&(~d)),a,b,x,s,t);}
	function hh(a,b,c,d,x,s,t)  {return cm(b^c^d,a,b,x,s,t);}
	function ii(a,b,c,d,x,s,t)  {return cm(c^(b|(~d)),a,b,x,s,t);}
	function sb(x) {
		var i;var nblk=((x.length+8)>>6)+1;var blks=new Array(nblk*16);for(i=0;i<nblk*16;i++) blks[i]=0;
		for(i=0;i<x.length;i++) blks[i>>2]|=x.charCodeAt(i)<<((i%4)*8);
		blks[i>>2]|=0x80<<((i%4)*8);blks[nblk*16-2]=x.length*8;return blks;
	}
	var i, x = sb(inputString),
		a = 1732584193,
		b = -271733879,
		c = -1732584194,
		d = 271733878,
		olda,
		oldb,
		oldc,
		oldd;
	for(i = 0; i < x.length; i += 16) {
		olda = a;
		oldb = b;
		oldc = c;
		oldd = d;
		a = ff(a,b,c,d,x[i+ 0], 7, -680876936);
		d = ff(d,a,b,c,x[i+ 1],12, -389564586);
		c = ff(c,d,a,b,x[i+ 2],17,  606105819);
		b = ff(b,c,d,a,x[i+ 3],22,-1044525330);
		a = ff(a,b,c,d,x[i+ 4], 7, -176418897);
		d = ff(d,a,b,c,x[i+ 5],12, 1200080426);

		c = ff(c,d,a,b,x[i+ 6],17,-1473231341);
		b = ff(b,c,d,a,x[i+ 7],22,  -45705983);
		a = ff(a,b,c,d,x[i+ 8], 7, 1770035416);

		d = ff(d,a,b,c,x[i+ 9],12,-1958414417);
		c = ff(c,d,a,b,x[i+10],17,     -42063);
		b = ff(b,c,d,a,x[i+11],22,-1990404162);

		a = ff(a,b,c,d,x[i+12], 7, 1804603682);
		d = ff(d,a,b,c,x[i+13],12,  -40341101);
		c = ff(c,d,a,b,x[i+14],17,-1502002290);

		b = ff(b,c,d,a,x[i+15],22, 1236535329);
		a = gg(a,b,c,d,x[i+ 1], 5, -165796510);
		d = gg(d,a,b,c,x[i+ 6], 9,-1069501632);

		c = gg(c,d,a,b,x[i+11],14,  643717713);
		b = gg(b,c,d,a,x[i+ 0],20, -373897302);
		a = gg(a,b,c,d,x[i+ 5], 5, -701558691);

		d = gg(d,a,b,c,x[i+10], 9,   38016083);
		c = gg(c,d,a,b,x[i+15],14, -660478335);
		b = gg(b,c,d,a,x[i+ 4],20, -405537848);

		a = gg(a,b,c,d,x[i+ 9], 5,  568446438);
		d = gg(d,a,b,c,x[i+14], 9,-1019803690);
		c = gg(c,d,a,b,x[i+ 3],14, -187363961);

		b = gg(b,c,d,a,x[i+ 8],20, 1163531501);
		a = gg(a,b,c,d,x[i+13], 5,-1444681467);
		d = gg(d,a,b,c,x[i+ 2], 9,  -51403784);

		c = gg(c,d,a,b,x[i+ 7],14, 1735328473);
		b = gg(b,c,d,a,x[i+12],20,-1926607734);
		a = hh(a,b,c,d,x[i+ 5], 4,    -378558);

		d = hh(d,a,b,c,x[i+ 8],11,-2022574463);
		c = hh(c,d,a,b,x[i+11],16, 1839030562);
		b = hh(b,c,d,a,x[i+14],23,  -35309556);

		a = hh(a,b,c,d,x[i+ 1], 4,-1530992060);
		d = hh(d,a,b,c,x[i+ 4],11, 1272893353);
		c = hh(c,d,a,b,x[i+ 7],16, -155497632);

		b = hh(b,c,d,a,x[i+10],23,-1094730640);
		a = hh(a,b,c,d,x[i+13], 4,  681279174);
		d = hh(d,a,b,c,x[i+ 0],11, -358537222);

		c = hh(c,d,a,b,x[i+ 3],16, -722521979);
		b = hh(b,c,d,a,x[i+ 6],23,   76029189);
		a = hh(a,b,c,d,x[i+ 9], 4, -640364487);

		d = hh(d,a,b,c,x[i+12],11, -421815835);
		c = hh(c,d,a,b,x[i+15],16,  530742520);
		b = hh(b,c,d,a,x[i+ 2],23, -995338651);

		a = ii(a,b,c,d,x[i+ 0], 6, -198630844);
		d = ii(d,a,b,c,x[i+ 7],10, 1126891415);
		c = ii(c,d,a,b,x[i+14],15,-1416354905);

		b = ii(b,c,d,a,x[i+ 5],21,  -57434055);
		a = ii(a,b,c,d,x[i+12], 6, 1700485571);
		d = ii(d,a,b,c,x[i+ 3],10,-1894986606);

		c = ii(c,d,a,b,x[i+10],15,   -1051523);
		b = ii(b,c,d,a,x[i+ 1],21,-2054922799);
		a = ii(a,b,c,d,x[i+ 8], 6, 1873313359);

		d = ii(d,a,b,c,x[i+15],10,  -30611744);
		c = ii(c,d,a,b,x[i+ 6],15,-1560198380);
		b = ii(b,c,d,a,x[i+13],21, 1309151649);

		a = ii(a,b,c,d,x[i+ 4], 6, -145523070);
		d = ii(d,a,b,c,x[i+11],10,-1120210379);
		c = ii(c,d,a,b,x[i+ 2],15,  718787259);

		b = ii(b,c,d,a,x[i+ 9],21, -343485551);
		a = ad(a,olda);
		b = ad(b,oldb);
		c = ad(c,oldc);
		d = ad(d,oldd);

	}
	return rh(a)+rh(b)+rh(c)+rh(d);
}

function get_current_status_hash () {
	var html_code = '';

	var allitems = [];
	allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName('input'));
	allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName('checkbox'));
	allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName('select'));
	allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName('textarea'));

	allitems.forEach(function (x) { 
		var item = $(x);
		html_code += ";;;;;;;" + x.id + ";;;;" + x.className + "=" + x.value + ";;;;" + x.checked
	})

	return md5(html_code);
}

function get_item_value (layer, classname) {
	assert(typeof(layer) == "number", "Layer is not an integer, but " + typeof(layer));
	assert(typeof(classname) == "string", "classname '" + classname + "' is not a string, but " + typeof(classname));

	var layer_settings = $(".layer_setting");
	if(typeof(classname) == "string") {
		if($($(layer_settings[layer]).find("." + classname)[0]).attr("type") == "checkbox") {
			return $($(layer_settings[layer]).find("." + classname)[0]).is(":checked");
		} else {
			var data = $($(layer_settings[layer]).find("." + classname)[0]).val();
			return data;
		}
	} else {
		for (var this_classname in classname) {
			if($($(layer_settings[layer]).find("." + this_classname)[0]).attr("type") == "checkbox") {
				var data = $($(layer_settings[layer]).find("." + this_classname)[0]).is(":checked");
				return data;
			} else {
				var data = $($(layer_settings[layer]).find("." + this_classname)[0]).val();
				if(data) {
					return data;
				}
			}
		}
		return null;
	}
}

function set_item_value (layer, classname, value) {
	assert(typeof(layer) == "number", "Layer is not an integer, but " + typeof(layer));
	assert(typeof(classname) == "string", "classname '" + classname + "' is not a string, but " + typeof(classname));
	assert(["string", "number", "boolean"].includes(typeof(value)), "value '" + value + "' for " + classname + " is not a string or number, but " + typeof(value));

	var layer_settings = $(".layer_setting");
	var found_layer = $($(layer_settings[layer]).find("." + classname)[0]);
	if(found_layer.attr("type") == "checkbox") {
		found_layer.prop("checked", value == 1 ? true : false);
	} else {
		found_layer.val(value);
	}
}

function get_tr_str_for_description (desc) {
	assert(typeof(desc) == "string", desc + " is not string but " + typeof(desc));
	return "<tr><td>Description:</td><td><i>" + desc + "</i></td></tr>";
}

function isNumeric(str) {
	if (typeof str != "string") return false; // we only process strings!
	return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
		!isNaN(parseFloat(str)); // ...and ensure strings of whitespace fail
}

function quote_python (item) {
	if(item === undefined) {
		return "";
	}

	if(typeof(item) == "object") {
		return JSON.stringify(item);
	} else {
		if(isNumeric(item)) {
			return item;
		} else if(/^\d+(,\d+)*$/.test(item)) {
			return "[" + item + "]";
		} else if(item == "True" || item == "False") {
			return item;
		} else if(item.includes("get_shape")) {
			return item;
		} else if(item.startsWith("[")) {
			return item;
		} else {
			return '"' + item + '"';
		}
	}

	return item;
}

function get_js_name (name) {
	if(name in python_names_to_js_names) {
		return python_names_to_js_names[name];
	}
	return name;
}

function get_python_name (name) {
	if(name in js_names_to_python_names) {
		return js_names_to_python_names[name];
	}
	return name;
}

function visual_help_text (text) {
	if(text == "initializer") {
		text = "";
		text += "<h2>ones</h2>"
		text += "$$ \\begin{pmatrix} 1 & 1 & 1 \\\\ \n 1 & 1 & 1 \\\\ \n 1 & 1 & 1 \\end{pmatrix} $$";

		text += "<h2>zeros</h2>"
		text += "$$ \\begin{pmatrix} 0 & 0 & 0 \\\\ \n 0 & 0 & 0 \\\\ \n 0 & 0 & 0 \\end{pmatrix} $$";
	}

	$("#visual_help_tab").html("<center>" + text + "</center>");

	MathJax.Hub.Queue(["Typeset",MathJax.Hub]);

	$("#visualization_tab_label").click();
	$("#visual_help_tab_label").show();
	$("#visual_help_tab_label").parent().show();
	$("#visual_help_tab_label").click();
}

function visual_help_text_image (filename, text) {
	$("#visual_help_tab").html(text + "<br><center><img style='width: 80%' src='visualhelp/" + filename + "' /></center>");
	$("#visualization_tab_label").click();
	$("#visual_help_tab_label").show();
	$("#visual_help_tab_label").parent().show();
	$("#visual_help_tab_label").click();
}

function visual_help_array (filenames) {
	$("#visual_help_tab").html("<center>");
	for (var i = 0; i < filenames.length; i++) {
		var filename = filesnames[0];
		$("#visual_help_tab").append("<img style='width: 80%' src='visualhelp/" + filename + "' />");
	}
	$("#visual_help_tab").append("</center>");
	$("#visualization_tab_label").click();
	$("#visual_help_tab_label").show();
	$("#visual_help_tab_label").parent().show();
	$("#visual_help_tab_label").click();
}

function visual_help (filename) {
	$("#visual_help_tab").html("<center><img style='width: 80%' src='visualhelp/" + filename + "' /></center>");
	$("#visualization_tab_label").click();
	$("#visual_help_tab_label").show();
	$("#visual_help_tab_label").parent().show();
	$("#visual_help_tab_label").click();
}

function get_tr_str_for_layer_table (desc, classname, type, data, nr) {
	var str = "<tr>";

	var help = "";
	if(desc.toLowerCase().includes("activation function")) {
		help = "<sup><a style='cursor: help;' onclick='plot_activation($($(this).parent().parent().parent().find(\"td\")[1]).find(\"select\").val())'>?</a></sup>";
	} else if (desc.toLowerCase().includes("strides")) {
		help = "<sup><a style='cursor: help;' onclick='visual_help_text_image(\"strides.svg\", \"Stride 1: preserve resolution.<br>Stride 2+: downsample<br>\")'>?</a></sup>";
	} else if (desc.toLowerCase().includes("filter")) {
		help = "<sup><a style='cursor: help;' onclick='visual_help(\"filter.svg\")'>?</a></sup>";
	} else if (desc.toLowerCase().includes("kernel-size")) {
		help = "<sup><a style='cursor: help;' onclick='visual_help(\"filter.svg\")'>?</a></sup>";
	} else if (desc.toLowerCase().includes("padding")) {
		help = "<sup><a style='cursor: help;' onclick='visual_help(\"padding.svg\")'>?</a></sup>";
	} else if (desc.toLowerCase().includes("dilation")) {
		help = "<sup><a style='cursor: help;' onclick='visual_help(\"dilation_rate.svg\")'>?</a></sup>";
	} else if (desc.toLowerCase().includes("kernel initializer")) {
		help = "<sup><a style='cursor: help;' onclick='write_initializer_values(" + nr + ")'>?</a></sup>";
	}

	str += "<td>" + desc + help + ":</td>";
	str += "<td>";
		if(type == "select") {
			str += "<select class='input_data " + classname + "' onchange='updated_page()'>";
			for (const [key, value] of Object.entries(data)) {
				str += '<option value="' + key + '">' + value + '</option>';
			}
			str += "</select>";
		} else if(type == "text") {
			var placeholder = "";

			if("placeholder" in data) {
				placeholder = " placeholder='" + data["placeholder"] + "' ";
			}

			var pre_text = "";
			if("text" in data) {
				var text = data["text"];
				if(typeof(data["text"]) == "function") {
					text = data["text"](nr);
				}

				pre_text = " value='" + text + "' ";
			}

			str += '<input class="input_data ' + classname + '" ' + pre_text + placeholder + ' type="text"  onchange="updated_page()" onkeyup="updated_page()" />';
		} else if(type == "number") {
			str += "<input class='input_data " + classname + "' type='number' ";
			
			if("min" in data) {
				str += " min=" + data["min"] + " ";
			}

			if("max" in data) {
				str += " max=" + data["max"] + " ";
			}

			if("step" in data) {
				str += " step=" + data["step"] + " ";
			}

			if("value" in data) {
				str += " value=" + data["value"] + " ";
			}

			str += " onchange='updated_page()' onkeyup='updated_page()' />";
		} else if(type == "checkbox") {
			str += "<input type='checkbox' class='input_data " + classname + "' onchange='updated_page();' ";
			if("status" in data && data["status"] == "checked") {
				str += " checked='CHECKED' ";
			}
			str += " />";

		} else {
			alert("Invalid table type: " + type);
		}
	str += "</td>";

	return str;
}

function add_theta_option (type, nr) {
	return get_tr_str_for_layer_table("Theta", "theta", "number", { "min": 0, "max": 1000, "step": 1, "value": -1 }, nr);
}

function add_axis_option (type, nr) {
	return get_tr_str_for_layer_table("Axis", "axis", "number", { "min": -1, "max": 1000, "step": 1, "value": get_default_option(type, "axis") }, nr);
}

function add_max_value_option (type, nr) {
	return get_tr_str_for_layer_table("Max-Value", "max_value", "number", { "min": 0, "max": 1000, "step": 1, "value": get_default_option(type, "max_value") }, nr);
}

function add_size_option (type, nr) {
	return get_tr_str_for_layer_table("Size", "size", "text", { "text": "2,2", "placeholder": "2 comma-seperated numbers" }, nr);
}

function add_target_shape_option (type, nr) {
	return get_tr_str_for_layer_table("Target-Shape", "target_shape", "text", { "text": calculate_default_target_shape(nr), "placeholder": "Array-Shape" }, nr);
}

function add_dilation_rate_option (type, nr) {
	return get_tr_str_for_layer_table("Dilation-Rate", "dilation_rate", "text", { "text": "", "placeholder": "1-3 numbers" }, nr);
}

function add_padding_option (type, nr) {
	return get_tr_str_for_layer_table("Padding", "padding", "select", { "valid": "valid", "same": "same", "causal": "causal"}, nr);
}

function add_filters_option (type, nr) {
	return get_tr_str_for_layer_table("Filters", "filters", "number", { "min": 1, "max": 256, "step": 1, "value": get_default_option(type, "filters") }, nr);
}

function add_pool_size_option (type, nr) {
	var str = "";

	var dimensionality = get_dimensionality_from_layer_name(type);

	var letter_code = 'x'.charCodeAt();
	for (var i = 0; i < dimensionality; i++) {
		var letter = String.fromCharCode(letter_code);
		str += get_tr_str_for_layer_table("Pool-Size " + letter, "pool_size_" + letter, "number", { "min": 1, "max": 4096, "step": 1, "value": get_default_option(type, "pool_size")[i] }, nr);
		letter_code++;
	}
	return str;
}

function add_kernel_size_option (type, nr) {
	var str = "";
	var dimensionality = get_dimensionality_from_layer_name(type);

	var letter_code = 'x'.charCodeAt();
	for (var i = 0; i < dimensionality; i++) {
		var letter = String.fromCharCode(letter_code);
		str += get_tr_str_for_layer_table("Kernel-Size " + letter, "kernel_size_" + letter, "number", { "min": 1, "max": 4096, "step": 1, "value": get_default_option(type, "kernel_size")[i] }, nr);
		letter_code++;
	}
	return str;
}

function add_strides_option (type, nr) {
	var str = "";
	var dimensionality = get_dimensionality_from_layer_name(type);

	var letter_code = 'x'.charCodeAt();
	for (var i = 0; i < dimensionality; i++) {
		var letter = String.fromCharCode(letter_code);
		str += get_tr_str_for_layer_table("Strides " + letter, "strides_" + letter, "number", { "min": 1, "max": 4096, "step": 1, "value": get_default_option(type, "strides")[i] }, nr);
		letter_code++;
	}
	return str;
}

function add_alpha_option (type, nr) {
	return get_tr_str_for_layer_table("Alpha", "alpha", "number", { "min": 0, "max": 100, "step": 0.01, "value": get_default_option(type, "alpha") }, nr);
}

function add_dropout_rate_option (type, nr) {
	return get_tr_str_for_layer_table("Dropout rate (in %)", "dropout_rate", "number", { "min": 0, "max": 1, "step": 0.05, "value": get_default_option(type, "dropout_rate") }, nr);
}

function add_max_features_option (type, nr) {
	return get_tr_str_for_layer_table("Max features", "max_features", "number", { "min": 1, "max": 4096, "step": 1, "value": get_default_option(type, "max_features") }, nr);
}

function add_momentum_option (type, nr) {
	return get_tr_str_for_layer_table("Momentum", "momentum", "number", { "min": 0, "max": 8192, "step": 0.01, "value": get_default_option(type, "momentum") }, nr);
}

function add_units_option (type, nr) {
	return get_tr_str_for_layer_table("Units", "units", "number", { "min": 1, "max": 8192, "step": 1, "value": get_default_option(type, "units") }, nr);
}

function add_use_bias_option(type, nr) {
	return get_tr_str_for_layer_table("Use Bias", "use_bias", "checkbox", { "status": "checked" }, nr);
}

function add_scale_option (type, nr) {
	return get_tr_str_for_layer_table("Scale?", "scale", "checkbox", { "status": "checked" }, nr);
}

function add_center_option (type, nr) {
	return get_tr_str_for_layer_table("Center?", "center", "checkbox", { "status": "checked" }, nr);
}

function add_trainable_option (type, nr) {
	return get_tr_str_for_layer_table("Trainable", "trainable", "checkbox", { "status": "checked" }, nr);
}

function add_recurrent_initializer_option (type, nr) {
	return get_tr_str_for_layer_table("Recurrent Initializer", "recurrent_initializer", "select", initializers, nr);
}

function add_kernel_regularizer_option (type, nr) {
	return get_tr_str_for_layer_table("Kernel Regularizer", "kernel_regularizer", "select", initializers, nr);
}

function add_recurrent_constraint_option (type, nr) {
	return get_tr_str_for_layer_table("Recurrent Contraint", "recurrent_constraint", "select", constraints, nr);
}

function add_dtype_option (type, nr) {
	return get_tr_str_for_layer_table("DType", "dtype", "select", dtypes, nr);
}

function add_bias_constraint_option (type, nr) {
	return get_tr_str_for_layer_table("Bias Contraint", "bias_constraint", "select", constraints, nr);
}

function add_stddev_option (type, nr) {
	return get_tr_str_for_layer_table("Standard-Deviation", "stddev", "number", { "min": 0, "value": get_default_option(type, "stddev") }, nr);
}

function add_rate_option (type, nr) {
	return get_tr_str_for_layer_table("Dropout rate (0 to 1)", "dropout", "number", { "min": 0, "max": 1, "step": 0.1, "value": get_default_option(type, "dropout") }, nr);
}

function add_dropout_option (type, nr) {
	return get_tr_str_for_layer_table("Dropout rate (0 to 1)", "dropout", "number", { "min": 0, "max": 1, "step": 0.1, "value": get_default_option(type, "dropout") }, nr);
}

function add_recurrent_dropout_option (type, nr) {
	return get_tr_str_for_layer_table("Recurrent dropout rate (0 to 1)", "recurrent_dropout", "number", { "min": 0, "max": 1, "step": 0.1, "value": get_default_option(type, "recurrent_dropout") }, nr);
}

function add_return_sequences_option (type, nr) {
	return get_tr_str_for_layer_table("Return sequences?", "return_sequences", "checkbox", { "status": "checked" }, nr);
}

function add_unroll_option (type, nr) {
	return get_tr_str_for_layer_table("Unroll?", "unroll", "checkbox", { "status": "checked" }, nr);
}

function add_recurrent_activation_option (type, nr) {
	return get_tr_str_for_layer_table("Recurrent Activation function", "recurrent_activation", "select", activations, nr);
}

function add_unit_forget_bias_option (type, nr) {
	return get_tr_str_for_layer_table("Unit forget bias", "unit_forget_bias", "checkbox", { "status": "checked" }, nr);
}

function add_implementation_option (type, nr) {
	return get_tr_str_for_layer_table("Implementation", "implementation", "select", implementation_modes, nr);
}

function add_kernel_constraint_option (type, nr) {
	return get_tr_str_for_layer_table("Kernel Contraint", "kernel_constraint", "select", constraints, nr);
}

function add_return_state_option (type, nr) {
	return get_tr_str_for_layer_table("Return state?", "return_state", "checkbox", { "status": "" }, nr);
}

function add_stateful_option (type, nr) {
	return get_tr_str_for_layer_table("Stateful?", "stateful", "checkbox", { "status": "" }, nr);
}

function add_go_backwards_option (type, nr) {
	return get_tr_str_for_layer_table("Go Backwards?", "go_backwards", "checkbox", { "status": "" }, nr);
}

function add_epsilon_option (type, nr) {
	return get_tr_str_for_layer_table("Epsilon multiplier", "epsilon", "number", { "min": -1, "max": 1, "step": 0.0001, "value": get_default_option(type, "epsilon") }, nr);
}

function add_depth_multiplier_option (type, nr) {
	return get_tr_str_for_layer_table("Depth multiplier", "depth_multiplier", "number", { "min": 0, "max": 1, "step": 0.1, "value": get_default_option(type, "depth_multiplier") }, nr);
}

function add_depthwise_initializer_option (type, nr) {
	return get_tr_str_for_layer_table("Depthwise Initializer", "depthwise_initializer", "select", initializers, nr);
}

function add_gamma_constraint_option (type, nr) {
	return get_tr_str_for_layer_table("Gamma contraint", "gamma_constraint", "select", constraints, nr);
}

function add_beta_constraint_option (type, nr) {
	return get_tr_str_for_layer_table("Beta contraint", "beta_constraint", "select", constraints, nr);
}

function add_depthwise_constraint_option (type, nr) {
	return get_tr_str_for_layer_table("Depthwise contraint", "depthwise_constraint", "select", constraints, nr);
}

function add_moving_variance_initializer_option (type, nr) {
	return get_tr_str_for_layer_table("Moving variance Initializer", "moving_variance_initializer", "select", initializers, nr);
}

function add_moving_mean_initializer_option (type, nr) {
	return get_tr_str_for_layer_table("Moving mean Initializer", "moving_mean_initializer", "select", initializers, nr);
}

function add_interpolation_option (type, nr) {
	return get_tr_str_for_layer_table("Interpolation", "interpolation", "select", interpolation, nr);
}

function add_beta_initializer_option (type, nr) {
	return get_tr_str_for_layer_table("Beta Initializer", "beta_initializer", "select", initializers, nr);
}

function add_gamma_initializer_option (type, nr) {
	return get_tr_str_for_layer_table("Gamma Initializer", "gamma_initializer", "select", initializers, nr);
}

function add_pointwise_initializer_option (type, nr) {
	return get_tr_str_for_layer_table("Pointwise Initializer", "pointwise_initializer", "select", initializers, nr);
}

function add_pointwise_constraint_option (type, nr) {
	return get_tr_str_for_layer_table("Pointwise contraint", "pointwise_constraint", "select", constraints, nr);
}

async function get_number_of_training_items () {
	let training_data = await _get_training_data();
	var keys = Object.keys(training_data);
	var number = 0;
	for (var key in keys) {
		number += Object.entries(training_data)[key][1].length;
	}
	return number;
}

async function _get_configuration (index) {
	assert(["string", "undefined"].includes(typeof(index)), "Index must be either string or undefined, but is " + typeof(index) + " (" + index + ")");

	var data = undefined;
	if(index) {
		if(Object.keys(status_saves).includes(index)) {
			log("getting " + index);
			data = {};
			data["keras"] = JSON.parse(status_saves[index]);
		} else {
			log("Index " + index + " could not be found");
		}
	}

	if(typeof(data) == "undefined") {
		try {
			data = await $.getJSON("traindata/" + $("#dataset_category").val() + "/" + $("#dataset").val() + ".json");
			if(!local_store.getItem("tensorflowjs_models/mymodel")) {
				data["keras"] = await $.getJSON("traindata/" + $("#dataset_category").val() + "/" + $("#dataset").val() + "_keras.json");
			} else {
				try {
					data["keras"] = JSON.parse(local_store.getItem("tensorflowjs_models/mymodel"));
				} catch (e) {
					log(e);
					local_store.setItem("tensorflowjs_models/mymodel", null)
					data["keras"] = await $.getJSON("traindata/" + $("#dataset_category").val() + "/" + $("#dataset").val() + "_keras.json");
				}
			}
		} catch (e) {
			log(e);
			data = await $.getJSON("traindata/" + $("#dataset_category").val() + "/default.json");
		}
	}

	return data;
}

function copy_to_clipboard (text) {
	var dummy = document.createElement("textarea");
	document.body.appendChild(dummy);
	dummy.value = text;
	dummy.select();
	document.execCommand("copy");
	document.body.removeChild(dummy);
}

function copy_id_to_clipboard (idname) {
	var serialized = $("#" + idname).text();
	copy_to_clipboard(serialized);
}

function copy_layer_data (layer_id) {
	var serialized = $($(".layer_data")[layer_id]).text();
	copy_to_clipboard(serialized);
}

function change_number_of_images () {
	max_images_per_layer = parseInt($("#max_images_per_layer").val());
}

function enable_disable_kernel_images () {
	if($("#show_layer_data").is(":checked")) {
		$("#show_kernel_images").prop("disabled", false);
		$("#data_plotter").show();
	} else {
		$("#show_kernel_images").prop("disabled", true);
		$("#data_plotter").hide();
	}
	set_ribbon_min_width();
}

function change_kernel_pixel_size () {
	kernel_pixel_size = parseInt($("#kernel_pixel_size").val());
}

function change_max_activation_pixel_size () {
	max_activation_pixel_size = parseInt($("#max_activation_pixel_size").val());
}

function change_pixel_size () {
	pixel_size = parseInt($("#pixel_size").val());
}

function change_height () {
	change_width_or_height("height", 1);
}

function change_width () {
	change_width_or_height("width", 0);
}

function change_width_or_height (name, inputshape_index) {
	if(["width", "height"].includes(name)) {
		var value = parseInt($("#" + name).val());
		var inputShape = get_input_shape();
		inputShape[inputshape_index] = value;
		set_input_shape("[" + inputShape.join(", ") + "]");
		eval(name + " = " + value);
		layer_structure_cache = null;
		updated_page();
	} else {
		console.error("Invalid name in change_width_or_height: " + name + ", must be either 'width' or 'height'");
	}
}

function update_python_code () {
	var redo_graph = 0;

	var input_shape = [width, height, number_channels];

	var loss = document.getElementById("loss").value;
	var optimizer_type = document.getElementById("optimizer").value;
	var metric_type = document.getElementById("metric").value;
	var batchSize = document.getElementById("batchSize").value;
	var dataset_category = document.getElementById("dataset_category").value;

	var python_code = "";

	if(dataset_category == "own") {
		input_shape = eval("[" + get_shape_from_file(x_file) + "]");
		if(input_shape === null) {
			return 0;
		}
	}

	var epochs = parseInt(document.getElementById("epochs").value);

	$("#pythoncontainer").show();

	python_code += "import keras\n";
	python_code += "import numpy as np\n";
	python_code += "import tensorflow as tf\n";
	python_code += "from keras.optimizers import *\n";
	python_code += "from keras.layers import *\n";
	python_code += "epochs = " + epochs + "\n";

	if(dataset_category == "image") {
		python_code += "from tensorflow.keras.preprocessing.image import ImageDataGenerator\n";
		python_code += "height = " + height + "\n";
		python_code += "width = " + width + "\n";
		python_code += "image_data_generator = keras.preprocessing.image.ImageDataGenerator(validation_split=" + (parseInt($("#validationSplit").val()) / 100) + ")\n";
		python_code += "image_set = image_data_generator.flow_from_directory('image/" + $("#dataset").val() + "', target_size=(width, height), color_mode='rgb')\n";

		x_shape = "[width, height, 3]";
	} else if(dataset_category == "own") {
		// TODO does not work for e.g. logic category!
		var x_shape = get_full_shape_from_file(x_file);
		var y_shape = get_full_shape_from_file(y_file);
		if(x_shape === null) {
			x_shape = $("#input_shape").val();

		}

		python_code += "x = np.loadtxt('x.txt').reshape([" + x_shape + "])\n";
		python_code += "y = np.loadtxt('y.txt').reshape([" + y_shape + "])\n";
	} else {
		python_code += "import re\n";
		python_code += "def get_shape (filename):\n";
		python_code += "    with open(filename) as f:\n";
		python_code += "        first_line = f.readline()\n";
		python_code += "        match = re.search(r'shape: \\((.*)\\)', first_line)\n";
		python_code += "        return eval('[' + match[1] + ']')\n";
		python_code += "x = np.loadtxt('x.txt').reshape(get_shape('x.txt'))\n";
		python_code += "y = np.loadtxt('y.txt').reshape(get_shape('y.txt'))\n";
	}

	python_code += "model = keras.models.Sequential()\n";

	var layer_types = $(".layer_type");
	var layer_settings = $(".layer_setting");

	for (var i = 0; i < get_numberoflayers(); i++) {
		var type = $(layer_types[i]).val();

		var data = {};

		if(i == 0) {
			if(["own", "image"].includes(dataset_category)) {
				data["input_shape"] = x_shape;
			} else {
				data["input_shape"] = "get_shape('x.txt')";
			}
		}

		if(type in layer_options) {
			for (var j = 0; j < layer_options[type]["options"].length; j++) {
				var option_name = layer_options[type]["options"][j];
				if(option_name == "pool_size") {
					data[get_python_name(option_name)] = [parseInt(get_item_value(i, "pool_size_x")), parseInt(get_item_value(i, "pool_size_y"))];
				} else if(option_name == "strides") {
					data[get_python_name(option_name)] = [parseInt(get_item_value(i, "strides_x")), parseInt(get_item_value(i, "strides_y"))];
				} else if(option_name == "kernel_size") {
					data[get_python_name(option_name)] = [parseInt(get_item_value(i, "kernel_size_x")), parseInt(get_item_value(i, "kernel_size_y"))];
				} else if(option_name == "size") {
					data[get_python_name(option_name)] = eval("[" + get_item_value(i, "size") + "]");
				} else if(option_name == "dilation_rate") {
					data[get_python_name(option_name)] = eval("[" + get_item_value(i, "dilation_rate") + "]");
				} else if(option_name == "target_shape") {
					data[get_python_name(option_name)] = eval("[" + get_item_value(i, "target_shape") + "]");
				} else if(option_name == "activation") {
					data[get_python_name(option_name)] = get_python_name(get_item_value(i, option_name));
				} else {
					data[get_python_name(option_name)] = get_item_value(i, option_name);
				}
			}

			python_code += "model.add(" + get_python_name(type) + "(";

			redo_graph++;
		}
		var params = [];
		for (const [key, value] of Object.entries(data)) {
			if(key == "dtype" && i == 0 || key != "dtype") {
				if(typeof(value) != "undefined") {
					params.push(get_python_name(key) + "=" + quote_python(get_python_name(value)));
				}
			}
		}

		python_code += params.join(",\n\t");
		if(params.length) {
			python_code += "\n";
		}
		python_code += "))\n";
	}


	var model_data = {
		loss: loss,
		optimizer: optimizer_type,
		metrics: metric_type
	};

	if(optimizer_type == "sgd") {
		model_data["learningRate"] = document.getElementById("learningRate_" + optimizer_type).value;
		python_code += "opt = tf.keras.optimizers.SGD(learningRate=" + model_data["learningRate"] + ", momentum=" + model_data["momentum"] + ")\n";
	} else {
		python_code += "opt = '" + optimizer_type + "'\n";
	}

	python_code += "model.compile(optimizer=opt, loss='" + get_python_name(loss) + "', metrics=['" + get_python_name(metric_type) + "'])\n";
	python_code += "model.summary()\n";

	if(dataset_category == "image") {
		python_code += "model.fit_generator(image_set, epochs=epochs)";
	} else {
		python_code += "model.fit(x, y, epochs=epochs)";
	}

	document.getElementById("python").innerHTML = python_code;
	document.getElementById("python").style.display = "block";
	Prism.highlightAll();

	return redo_graph;
}

function updated_page(no_graph_restart, disable_auto_enable_valid_layer_types) {
	if(is_setting_config) {
		return;
	}
	//console.trace();
	var numberoflayers = get_numberoflayers();
	show_or_hide_bias_initializer(numberoflayers);
	if(disable_show_python_and_create_model) {
		return;
	}

	var recompiled = false;

	try {
		recompiled = compile_model();
	} catch (e) {
		log("There was an error compiling the model" + e);
	};


	var redo_graph = update_python_code();

	if(model && redo_graph && !no_graph_restart) {
		restart_fcnn();
		restart_lenet();
		restart_alexnet();
	}

	try {
		write_descriptions();
	} catch (e) {
		console.warn(e);
	}

	identify_layers(numberoflayers);

	layer_structure_cache = null;

	/*
	if((typeof(disable_auto_enable_valid_layer_types) == "undefined" || !disable_auto_enable_valid_layer_types) && !global_disable_auto_enable_valid_layer_types) {
		disable_all_invalid_layers();
	}
	*/

	add_layer_debuggers();

	if(!disabling_saving_status) {
		if(recompiled) {
			save_current_status();
		}
	}

	set_ribbon_min_width();

	show_dtype_only_first_layer();

	return 1;
}

function change_optimizer () {
	var type = $("#optimizer").val();
	$(".optimizer_metadata").hide();

	$("#" + type + "_metadata").show();

	updated_page(1);
}

function set_momentum (val) {
	$("#momentum_" + $("#optimizer").val()).val(val);
}

function set_validationSplit (val) {
	$("#validationSplit").val(val);
}

function set_epsilon (val) {
	$("#epsilon_" + $("#optimizer").val()).val(val);
}

function set_decay (val) {
	$("#decay_" + $("#optimizer").val()).val(val);
}

function set_rho (val) {
	$("#rho_" + $("#optimizer").val()).val(val);
}

function set_learningRate (val) {
	$("#learningRate_" + $("#optimizer").val()).val(val);
}

function byteToMB (varbyte) {
	var mb = Math.round((varbyte / (1024 * 1024)) * 100) / 100;
	return varbyte + " (" + mb + "MB)";
}

function print_memory () {
	$("#memorycontainer").show();
	$("#memory").html();

	var mem = tf.memory();

	var msg = 
		"numBytes: " + byteToMB(mem.numBytes) + "\n" +
		"numBytesInGPU: " + byteToMB(mem.numBytes) + "\n" +
		"numDataBuffers: " + mem.numDataBuffers + "\n" +
		"numTensors: " + mem.numTensors + "\n" +
		"unreliable? " + mem.unreliable;

	$("#memory").html("<pre>" + msg + "</pre>");
}

function reset_history () {
	$("#history").html("");
	$("#historycontainer").hide();
}

function write_history (h) {
	var keys = Object.keys(h["history"])

	var string = "<tr><td>Epoch</td>";
	for (var i = 0; i < keys.length; i++) {
		string += "<th>" + keys[i] + "</th>";
	}
	string += "</tr>";

	for (var e = 0; e < h["epoch"].length; e++) {
		string += "<tr style='border: 1px solid black;'>";
		string += "<td style='border: 1px solid black;'>" + (e + 1) + "</td>";
		for (var i = 0; i < keys.length; i++) {
			string += "<td style='border: 1px solid black;'>" + h["history"][keys[i]][e] + "</td>";
		}

	}

	$("#history").html("<table style='width: 100%; border: 1px solid black;'>" + string + "</table>");
}

function write_model_summary () {
	$("#summarycontainer").show();
	var logBackup = console.log;
	var logMessages = [];

	console.log = function() {
		logMessages.push.apply(logMessages, arguments);
	};

	model.summary();

	write_to_summary(logMessages.join("\n"));

	console.log = logBackup;
}

function reset_summary () {
	$("#summarycontainer").hide();
	$("#summary").html("");
}

function write_to_summary (val) {
	assert(typeof(val) == "string", val + " is not an string but " + typeof(val));
	$("#summary").html("<pre>" + val + "</pre>");
}

function set_optimizer (val) {
	assert(typeof(val) == "string", val + " is not an string but " + typeof(val));
	$("#optimizer").val(val);
}

function set_metric (val) {
	assert(typeof(val) == "string", val + " is not an string but " + typeof(val));
	$("#metric").val(val);
}

function set_loss (val) {
	assert(typeof(val) == "string", val + " is not an string but " + typeof(val));
	$("#loss").val(val);
}

function get_epochs () {
	return parseInt($("#epochs").val());
}

function get_batchSize () {
	return parseInt($("#batchSize").val());
}

function set_batchSize (val) {
	assert(typeof(val) == "number", val + " is not an integer but " + typeof(val));
	$("#batchSize").val(val);
}

function set_epochs (val) {
	assert(typeof(val) == "number", val + " is not an integer but " + typeof(val));
	document.getElementById("epochs").value = val;
}

function set_numberoflayers (val) {
	assert(typeof(val) == "number", val + " is not an integer but " + typeof(val));
	document.getElementById("numberoflayers").value = val;
	return val;
}

function get_numberoflayers () {
	return parseInt(document.getElementById("numberoflayers").value);
}

function init_epochs(val) {
	assert(typeof(val) == "number", "init_epochs(" + val + ") is not an integer but " + typeof(val));
	set_epochs(val);
}

function init_numberoflayers(val) {
	assert(typeof(val) == "number", "init_numberoflayers(" + val + ") is not an integer but " + typeof(val));

	if(val == number_of_initialized_layers) {
		return;
	}

	set_numberoflayers(val);

	show_layers(get_numberoflayers());

	number_of_initialized_layers = val;
	updated_page();
}

function get_option_for_layer_by_type (nr) {
	assert(typeof(nr) == "number", "get_option_for_layer_by_type(" + nr + ") is not a number, but " + typeof(nr));

	var type = $($(".layer_type")[nr]).val();

	if(!type) {
		$($(".layer_type")[nr]).children().children().each(function() {
			if($(this).val() == 'dense') {
				$(this).prop("selected", true);
			}
		});
		type = $($(".layer_type")[nr]).val();
		console.log("Cannot determine type of layer " + nr);
	}

	var str = "";

	var kernel_initializer_string = get_tr_str_for_layer_table("Kernel Initializer", "kernel_initializer", "select", initializers, nr);
	var bias_initializer_string = get_tr_str_for_layer_table("Bias Initializer", "bias_initializer", "select", initializers, nr);
	var activation_string = get_tr_str_for_layer_table("Activation function", "activation", "select", activations, nr);

	for (var [key, value] of Object.entries(layer_options)) {
		if(key == type) {
			if(value["description"]) {
				str += get_tr_str_for_description(value["description"]);
			} else {
				alert("No description given for " + key);
			}

			if(value["options"]) {
				var options = value["options"];
				for (var j = 0; j < options.length; j++) {
					var item = options[j];
					if (item == "activation") {
						str += activation_string;
					} else if (item == "kernel_initializer") {
						str += kernel_initializer_string;
					} else if (item == "bias_initializer") {
						str += bias_initializer_string;
					} else {
						eval("str += add_" + item + "_option(type, nr);");
					}
				}
			} else {
				alert("No options given for " + key);
			}
		}
	}

	return str;
}

function set_option_for_layer(thisitem) {
	assert(typeof(thisitem) == "object", "set_option_for_layer(" + thisitem + ") is not an object but " + typeof(thisitem));

	layer_structure_cache = 0;

	var real_nr = null;

	$(thisitem).
	parent(). // td
	parent(). // tr
	parent(). // tbody
	parent(). // table
	parent(). // layer_setting
	parent(). // li
	parent(). // layers_container
	children().each(function (nr, elem) {
		if($(elem).find(thisitem).length >= 1) {
			real_nr = nr;
		}
	});

	assert(typeof(real_nr) == "number", "found real_nr is not an integer but " + typeof(real_nr));

	set_option_for_layer_by_layer_nr(real_nr);

	var chosen_option = $($(".layer_setting")[real_nr]).find(".layer_type").val()
	$($(".layer_setting")[real_nr]).find("option").each(function (i, x) {
		if(chosen_option == $(x).val()) {
			$(x).attr('selected','selected');
		} else {
			$(x).removeAttr('selected');
		}
	})

	updated_page(null, 1);
}

function set_option_for_layer_by_layer_nr (real_nr) {
	assert(typeof(real_nr) == "number", "set_option_for_layer_by_layer_nr(" + real_nr + ") is not a number but " + typeof(real_nr));


	$($(".layer_options_internal")[real_nr]).html(get_option_for_layer_by_type(real_nr));

	if(get_activation_list().includes($($(".layer_type")[real_nr]).val())) {
		$($(".whatisthis_activation")[real_nr]).show();
	} else {
		$($(".whatisthis_activation")[real_nr]).hide();
	}

	var nr = 0;
	var current_type = $($(".layer_type")[0]).val();

	write_descriptions();
	updated_page(null, 1);
}

function toggle_options (item) {
	assert(typeof(item) == "object", "toggle_options(" + item + ") is not an object but " + typeof(item));

	$(item).parent().parent().parent().next().toggle();
	write_descriptions();
}

function disable_invalid_layers_event (e, thisitem) {
	assert(typeof(e) == "object", "disable_all_invalid_layers(e -> " + e + " is not an object but " + typeof(e));
	assert(typeof(thisitem) == "object", "disable_all_invalid_layers(e, thisitem -> " + thisitem + " is not an [object HTMLSelectElement] but " + typeof(thisitem));

	e.preventDefault();
	var layer_nr = null;

	$(thisitem).
	parent(). // td
	parent(). // tr
	parent(). // tbody
	parent(). // table
	parent(). // layer_setting
	parent(). // li
	parent(). // layers_container
	children().each(function (nr, elem) {
		if($(elem).find(thisitem).length >= 1) {
			layer_nr = nr;
		}
	});

	enable_valid_layer_types(layer_nr);

	//hide_empty_groups(layer_nr);
}

function disable_all_invalid_layers () {
	document.body.style.pointerEvents = "none";
	disable_all_invalid_layers_from(0);
	document.body.style.pointerEvents = "";
}

function disable_all_invalid_layers_from (start) {
	assert(typeof(start) == "number", "disable_all_invalid_layers_from(" + start + ") is not a number but " + typeof(start));

	favicon_spinner();
	for (var i = start; i < get_numberoflayers(); i++) {
		enable_valid_layer_types(i);
	}
	favicon_default();
}

function enable_valid_layer_types (layer_nr) {
	assert(typeof(layer_nr) == "number", "enable_valid_layer_types(" + layer_nr + ") is not a number but " + typeof(layer_nr));

	var valid_layer_types = get_valid_layer_types(layer_nr);

	var original_value = $($($($(".layer_setting")[layer_nr])).find(".layer_type")[0]).val();

	var options = $($($('.layer_type')[layer_nr]).children().children());

	var original_value = $($($($(".layer_setting")[layer_nr])).find(".layer_type")[0]).val();

	for (var i = 0; i < options.length; i++) {
		if(!$(options[i]).is(":selected")) {
			$(options[i]).prop("disabled", true);
			//$(options[i]).prop("hidden", false); // Disabled until hide_empty_groups works
		}

		if(valid_layer_types.includes($(options[i]).prop('value'))) {
			$(options[i]).prop("disabled", false);
		} else {
			//$(options[i]).prop("hidden", true); // Disabled until hide_empty_groups works
		}
	}
}

function option_for_layer (nr) {
	assert(typeof(nr) == "number", "option_for_layer(" + nr + ") is not a number but " + typeof(number));

	var this_event = "set_option_for_layer(this)";
	var str = "";
	str += "<tr>";
		str += "<td>";
			str += "<button style='cursor: context-menu' class='show_data' onclick='toggle_options(this)'>Advanced</button>";
			str += "<div class='whatisthis_activation' style='display:none'><a onclick='plot_activation($($(\".layer_type\")[" + nr + "]).val())'>What is this?</a></div>";
		str += "</td>";
		str += "<td>";
			str += "<select onfocus='disable_invalid_layers_event(event, this)' onchange='" + this_event + "' class='input_data layer_type'>";
			//str += "<select onchange='" + this_event + "' class='input_data layer_type'>";
				var last_category = '';
				for (var key of layer_names) {
					var this_category = layer_options[key].category;
					if(last_category != this_category) {
						if(last_category != "") {
							str += "</optgroup>";
						}
						str += '<optgroup label="' + this_category + '">';
						last_category = this_category;
					}
					str += "<option value='" + key + "'>" + get_python_name(key) + "</option>";
				}
				str += "</optgroup>";
			str += "</select>";
			str += "<script>set_option_for_layer($('select').last());</script>";
		str += "</td>";
	str += "</tr>";
	str += "<tbody class='layer_options_internal' style='display: none'></tbody>";

	return str;
}

function remove_layer (item) {
	assert(typeof(item) == "object", "item is not an object but " + typeof(item));

	var number_of_layers_element = document.getElementById("numberoflayers");
	var old_value = parseInt(number_of_layers_element.value);
	if(old_value > 1) {
		save_current_status();
		$($(item).parent()[0]).parent().remove()

		layer_structure_cache = null;
		number_of_layers_element.value = old_value - 1;

		updated_page();
		disable_all_non_selected_layer_types();

		if(get_numberoflayers() - 1 == 0) {
			$(".remove_layer").prop("disabled", true)
			$(".remove_layer").hide();
		} else {
			$(".remove_layer").prop("disabled", false)
			$(".remove_layer").show();
		}
	} else {
		Swal.fire({
			icon: 'error',
			title: 'Oops...',
			text: 'You cannot remove the last layer of your model.',
		})

	}
}

function get_element_xpath (element) {
	assert(typeof(element) == "object", "item is not an object but " + typeof(element));

	const idx = (sib, name) => sib
		? idx(sib.previousElementSibling, name||sib.localName) + (sib.localName == name)
		: 1;
	const segs = elm => !elm || elm.nodeType !== 1
		? ['']
		: elm.id && document.getElementById(elm.id) === elm
		? [`id("${elm.id}")`]
		: [...segs(elm.parentNode), `${elm.localName.toLowerCase()}[${idx(elm)}]`];
	return segs(element).join('/');
}

function add_layer (item) {
	assert(typeof(item) == "object", "item is not an object but " + typeof(item));

	save_current_status();
	layer_structure_cache = null;

	$(item).parent().parent().clone().insertAfter($(item).parent().parent());

	var real_nr = null;

	var item_xpath = get_element_xpath(item);

	var add_layer_buttons = $(".add_layer");
	for (var nr = 0; nr < add_layer_buttons.length; nr++) {
		var elem = add_layer_buttons[nr];
		if(item_xpath == get_element_xpath(elem)) {
			real_nr = nr;
		}
	}

	$("#numberoflayers").val(parseInt($("#numberoflayers").val()) + 1);

	var previous_layer_type = $($($($(".layer_setting")[real_nr])).find(".layer_type")[0]).val();
	var new_layer_type = previous_layer_type;
	if(new_layer_type == "flatten") {
		new_layer_type = "dense";
	}
	$($($($(".layer_setting")[real_nr + 1])).find(".layer_type")[0]).val(new_layer_type);

	updated_page();

	write_descriptions();

	$(".remove_layer").prop("disabled", false)
	$(".remove_layer").show();
}

function sortable_layers_container (layers_container) {
	assert(typeof(layers_container) == "object", "layers_container is not an object but " + typeof(layers_container));

	var error_div = $("#error");

	layers_container.sortable({
		cursor: "move",
		handle: 'div',
		helper:	'clone',
		forcePlaceholderSize: true,
		placeholder: 'placeholder',
		start: function(e, ui){
			ui.placeholder.height(ui.item.height());
			ui.placeholder.css('visibility', 'visible');
			$(".descriptions_of_layers").hide();
		},
		update: function(e, ui){
			var prev_throw_compile_exception = throw_compile_exception;
			throw_compile_exception = true;
			try {
				compile_model();
				error_div.html("");
				error_div.parent().hide();
			} catch (e) {
				if(mode == "amateur") {
					$("#layers_container").sortable('cancel');
					alert("Dropping this layer there causes the model.compile command to fail. Reverting this drop:\n" + e);
					try {
						compile_model();
					} catch (e) {};
					error_div.html("");
					error_div.parent().hide();
					compile_model();
				} else {
					error_div.html(e);
					error_div.parent().show();
				}
			};
			throw_compile_exception = prev_throw_compile_exception;

			$(".descriptions_of_layers").show();
			updated_page();
			write_descriptions();
		},
		axis: 'y',
		revert: true
	});

	layers_container.droppable({
		tolerance: 'pointer'
	});
}

function disable_all_non_selected_layer_types() {
	var all_options = $(".layer_type").children().children();

	for (var i = 0; i < all_options.length; i++) {
		var this_all_options = $(all_options[i]);
		if(!this_all_options.is(":selected")) {
			if(this_all_options.val() != "dense") {
				this_all_options.prop("disabled", true)
			}
		} else {
			this_all_options.prop("selected", true)
		}
	}

}

function show_layers (number) {
	assert(typeof(number) == "number", "show_layer(" + number + ") is not a number but " + typeof(number));

	var layers_container = $("#layers_container");

	var layers_container_str = "";
	var layer_visualizations_tab_str = "";

	var remove = "<button class='add_remove_layer_button remove_layer' onclick='remove_layer(this)'>-</button>";
	var add = "<button class='add_remove_layer_button add_layer' onclick='add_layer(this)'>+</button>&nbsp;";

	for (var i = 0; i < number; i++) {
		layers_container_str += 
			"<li class='ui-sortable-handle'><span class='layer_start_marker'></span><div class='container layer layer_setting glass_box'>" +
				"<div style='display:none' class='warning_container'><span style='color: yellow'>&#9888;</span><span class='warning_layer'></span></div>" +
				remove +
				add +
				"Layer&nbsp;<span class='layer_nr_desc'></span>" +
				"<span class='call_counter_container'>(<span class='call_counter'>0</span>)&nbsp;</span>" +
				"<span class='layer_identifier'></span>" +
				"<table class='configtable'>" + 
					option_for_layer(i) +
				"</table>" +
				//"<span class='layer_data_visualizations' style='display: none'><span class='input_visualization'></span><span class='kernel_visualization'></span> = <span class='filter_visualization'></span></span>" +
			"</div>" +
			"<span class='layer_end_marker'></span>" +
			"</li>"
		;

		layer_visualizations_tab_str +=
			"<div class='layer_data'></div>" +
			//"<button style='display: none;' class='copy_layer_data_button' onclick='copy_layer_data(" + i + ")'>Copy this to clipboard</button>" +
			"<div class='input_image_grid_div' style='display: none'>Input: <div class='input_image_grid'></div><hr></div>" +
			"<div class='kernel_image_grid_div' style='display: none'>Filter-Kernel: <div class='filter_image_grid'></div><hr></div>" +
			"<div class='output_image_grid_div' style='display: none'>Output: <div class='image_grid'></div></div>"
			"<br>";
		;
	}

	layers_container.html(layers_container_str);

	$("#layer_visualizations_tab").html(layer_visualizations_tab_str);

	$('.layer_type').trigger("change");

	sortable_layers_container(layers_container);

	document.getElementById("train_neural_network_button").style.display = 'block';
}

function reset_photo_gallery () {
	$("#photoscontainer").hide();
	document.getElementById("photos").innerHTML = "";
}

function add_photo_to_gallery(url) {
	assert(typeof(url) == "string", url + " is not a string but " + typeof(url));

	var photoscontainer = $("#photoscontainer");

	if(photoscontainer.css("display") == "none") {
		photoscontainer.show();
	}
	var html = "<img src='" + url + "' height='90' />";
	$("#photos").html(html + $("#photos").html() );
}

function set_xyz_values (j, name, values) {
	assert(typeof(j) == "number", "j must be number, is: " + typeof(number));
	assert(typeof(name) == "string", "name must be string, is: " + typeof(number));
	assert(typeof(values) == "object", "name must be object, is: " + typeof(number));

	var letter = 'x';
	for (var i = 0; i < values.length; i++) {
		var this_name = name + "_" + String.fromCharCode(letter.charCodeAt() + i)
		set_item_value(j, this_name, values[i]);
	}
}

async function set_config (index) {
	assert(["string", "undefined"].includes(typeof(index)), "Index must be either string or undefined, but is " + typeof(index) + " (" + index + ")");

	is_setting_config = true;

	var config = await _get_configuration(index);

	disable_show_python_and_create_model = true;

	if(config) {
		if(!index) {
			if(config["width"]) { $("#width").val(config["width"]); width = config["width"]; }
			if(config["height"]) { $("#height").val(config["height"]); height = config["height"]; }

			if(config["divide_by"]) {
				$("#divide_by").val(config["divide_by"]);
			} else {
				$("#divide_by").val(1);
			}
		}

		var keras_layers;
		try {
			keras_layers = config["keras"]["modelTopology"]["config"]["layers"];
		} catch (e) {
			log(e);
			log(config);
			try {
				log("Trying more...");
				keras_layers = config["keras"]["modelTopology"]["model_config"]["layers"];
				if(keras_layers === undefined) {
					throw("keras_layers is undefined");
				}
			} catch (e) {
				log(e);
				try {
					log("Trying even more...");
					keras_layers = config["keras"]["modelTopology"]["model_config"]["config"]["layers"];
				} catch (e) {
					try {
						keras_layers = config["keras"]["keras"]["modelTopology"]["config"]["layers"];
					} catch (e) {
						log(e);
						log(config);
						try {
							log("Trying more...");
							keras_layers = config["keras"]["keras"]["modelTopology"]["model_config"]["layers"];
							if(keras_layers === undefined) {
								throw("keras_layers is undefined");
							}
						} catch (e) {
							log(e);
							try {
								log("Trying even more...");
								keras_layers = config["keras"]["keras"]["modelTopology"]["model_config"]["config"]["layers"];
							} catch (e) {
								try {
									log("Last ressort...");
									keras_layers = config["layers"];
								} catch (e) {
									log(e)
									alert("Tried everything, could not load model, sorry.");
								}
							}
						}
					}
				}
			}
		}

		if(keras_layers === undefined) {
			console.warn("Error loading the model");
			log(config);
		}

		init_numberoflayers(keras_layers.length - (keras_layers[0]["class_name"] == "InputLayer" ? 1 : 0));

		if(config["input_shape"]) {
			set_input_shape(config["input_shape"]);
		} else {
			determine_input_shape();
		}

		if(!index) {
			set_epochs(config["epochs"]);
			set_loss(config["loss"]);
			set_metric(config["metric"]);
			set_optimizer(config["optimizer"]);
			
			if(config["width"]) {
				$("#width").val(config["width"]);
				change_width();
			}

			if(config["height"]) {
				$("#height").val(config["height"]);
				change_height();
			}

			$("#optimizer").trigger("change");

			if(config["optimizer"] == "rmsprop") {
				set_rho(config["rho"]);
				set_decay(config["decay"]);
				set_epsilon(config["epsilon"]);
			}

			if (["sgd", "rmsprop"].includes(config["optimizer"])) {
				set_learningRate(config["learningRate"]);
			}

			if (["monentum", "rmsprop"].includes(config["optimizer"])) {
				set_momentum(config["momentum"]);
			}

			set_batchSize(parseInt(config["batchSize"]));
			set_validationSplit(config["validationSplit"]);
		}

		var j = 0;
		for (var i = 0; i < keras_layers.length; i++) {
			if(keras_layers[i]["class_name"] == "InputLayer") {
				continue;
			}
			var layer_type = $($($(".layer_setting")[j]).find(".layer_type")[0]);
			layer_type.val(python_names_to_js_names[keras_layers[i]["class_name"]]);
			layer_type.trigger("change");
			layer_type.trigger("slide");
			j++;
		}

		j = 0;
		for (var i = 0; i < keras_layers.length; i++) {
			if(keras_layers[i]["class_name"] == "InputLayer") {
				continue;
			}

			//log("i: " + i + ", " + keras_layers[i]["class_name"]);

			var datapoints = [
				"kernel_initializer",
				"bias_initializer",
				"activation",
				"pool_size",
				"padding", 
				"strides",
				"filters", 
				"kernel_size",
				"dropout_rate", 
				"max_features",
				"trainable",
				"use_bias"
			];

			datapoints.forEach(function (item_name) {
				if(item_name in keras_layers[i]["config"] && item_name != "kernel_size" && item_name != "strides" && item_name != "pool_size") {
					var value = keras_layers[i]["config"][item_name];
					if(item_name == "kernel_initializer") {
						value = detect_kernel_initializer(value);
					} else if (item_name == "bias_initializer") {
						value = get_initializer_name(value["class_name"]);
					}
					set_item_value(j, item_name, value);
				} else {
					//log("item_name: " + item_name);
					if(["kernel_size", "strides", "pool_size"].includes(item_name) && item_name in keras_layers[i]["config"]) {
						var values = keras_layers[i]["config"][item_name];
						set_xyz_values(j, item_name, values);
					} else if(item_name == "dropout_rate" && keras_layers[i]["class_name"] == "Dropout") {
						set_item_value(j, "dropout_rate", keras_layers[i]["config"]["rate"]);
					} else {
						//console.warn("Item not found in keras: " + item_name);
					}
				}
			});

			var units = keras_layers[i]["config"]["units"];
			if(units == "number_of_categories") {
				var number_of_categories = await get_number_of_categories();
				set_item_value(j, "units", number_of_categories);
			} else {
				if(Object.keys(keras_layers[i]["config"]).includes("units")) {
					set_item_value(j, "units", units);
				}
			}

			if("dilation_rate" in keras_layers[i]["config"]) {
				var dilation_rate = keras_layers[i]["config"]["dilation_rate"];
				var dilation_rate_str = dilation_rate.join(",");
				set_item_value(j, "dilation_rate", dilation_rate_str);
			}
			j++;
		}
	}

	disable_show_python_and_create_model = false;

	model = create_model(model);
	compile_model();
	add_layer_debuggers();

	/*
	restart_lenet();
	restart_alexnet();
	restart_fcnn();
	*/
	disable_all_non_selected_layer_types();

	write_descriptions();

	is_setting_config = false;

	updated_page();
}

function show_or_hide_load_weights () {
	$("#load_weights_button").hide();

	if($("#dataset_category").val() != "own") {
		var category_text = $("#dataset_category option:selected").text();
		var dataset = $("#dataset option:selected").text();
		var this_struct = traindata_struct[category_text]["datasets"][dataset];
		var keys = Object.keys(this_struct);

		if(keys.includes("weights_file")) {
			$("#load_weights_button").show();
		}
	}
}

async function init_dataset () {
	clicked_on_tab = 0;
	init_download_link();
	init_epochs(2);

	set_batchSize(2);

	$('a[href="#visualization_tab"]').click();

	$("#tfvis_tab_training_performance_graph").html("");
	$("#tfvis_tab_history_graphs").html("");

	$(".training_performance_tabs").hide();

	$("#history").html("");
	$("#memory").html("");

	save_current_status();
}

function init_download_link () {
	if($("#dataset_category").val() != "own") {
		$("#download_data").html("Download the training data <a href='traindata/zip.php?dataset=" + $("#dataset").val() + "&dataset_category=" + $("#dataset_category").val() + "'>here</a>.");
		$("#download_data").show();
	} else {
		$("#download_data").hide();
	}
}

async function get_number_of_categories () {
	var training_data_info = await _get_training_data();
	var num = Object.keys(training_data_info).length;
	return num;
}

async function init_dataset_category () {
	status_saves = [];
	state_stack = [];
	future_state_stack = [];

	show_hide_undo_buttons();

	clicked_on_tab = 0;
	var category = $("#dataset_category").val();

	assert(typeof(category) == "string", "init_dataset_category -> category from $(#dataset_category).val() is not a string, but " + typeof(category));

	xy_data = null;

	var show_items = {
		"image_resize_dimensions": ["image"],
		"upload_file": ["image"],
		"imageresizecontainer": ["image"],
		"black_and_white": ["image"],
		"resizedimensions": ["image"],
		"resizedimensions.parent": ["image"],

		"max_values": [],
		"max_values.parent": [],

		"prepare_data": ["own"],
		"prepare_data.parent": ["own"],
		"predict_own": ["own"],

		"tensor_type_div": ["logic", "own"],
		"input_shape_div": ["logic", "own"],
		"input_shape_div.parent": ["logic", "own"]
	};

	var item_names = Object.keys(show_items);

	for (var i = 0; i < item_names.length; i++) {
		var pages_to_show_on = show_items[item_names[i]];
		var item_name = item_names[i];
		if(pages_to_show_on.includes(category)) {
			if(item_name.endsWith(".parent")) {
				item_name = item_name.replace(/\.parent/, '');
				$("#" + item_name).parent().show();
			} else {
				$("#" + item_name).show();
			}
		} else {
			if(item_name.endsWith(".parent")) {
				item_name = item_name.replace(/\.parent/, '');
				$("#" + item_name).parent().hide();
			} else {
				$("#" + item_name).hide();
			}
		}
	}

	$("#input_text").hide();

	if(category != "own") {
		var dataset = "";
		if(category == "image") {
			//dataset += "<option value='layertest'>layertest</option>";
			dataset += "<option value='tiny'>Cat or dog</option>";
		} else if(category == "logic") {
			dataset += "<option value='xor'>XOR</option>";
		}

		$("#inputShape").attr("readonly", true); 
		$("#train_data_set_group").show();
		$("#upload_own_data_group").hide();
		$("#dataset_div").show();
		$("#dataset").html(dataset);
		$("#upload_x").hide();
		$("#upload_x").parent().hide();
		$("#upload_y").hide();
		$("#upload_y").parent().hide();
		set_config().then(() => {
			updated_page(0, 0);
		});
	} else {
		$("#train_data_set_group").hide();
		$("#upload_own_data_group").show();
		$("#dataset_div").hide();
		$("#upload_x").show();
		$("#upload_x").parent().show();
		$("#upload_y").show();
		$("#upload_y").parent().show();
		init_numberoflayers(3);
		$("#inputShape").attr("readonly", false); 
	}

	init_download_link();
	init_categories();

	number_of_initialized_layers = 0;
}

function clean_gui () {
	reset_summary();
	$("#errorcontainer").hide();
	$("#error").html("");
	write_descriptions();
}

function set_input_shape (val) {
	assert(typeof(val) == "string", "set_input_shape(" + val + "), val is not string, but " + typeof(val));

	$("#inputShape").val(val);
	return get_input_shape();
}

function get_input_shape () {
	var code = $("#inputShape").val();
	if(!code.startsWith("[")) {
		code = "[" + code + "]";
	}
	return eval(code);
}

function change_metrics () {
	var new_metric = $("#metric").val();

	$("#metric_equation").html("");

	if(new_metric == "mse") {
		$("#metric_equation").html("$ \\mathrm{MSE} = \\sum^{N}_{i=1}\\frac{\\left(\\hat{y} - y\\right)^2}{N} $");
		MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
	}

	updated_page(1);
}

function show_optimizer_help () {
	var optimizer_type = $("#optimizer").val();

	$("#help").html("");

	$("#help").html(optimizer_type);

	$("#help").append("<br><a style='cursor: help;' onclick='$(\"#help\").hide()'>Close help</a>");
	$("#help").show();
}

function get_activation_list () {
	var array = [];
	layer_names.forEach(function eachKey(key) {
		if(layer_options[key]["category"] == "Activation") {
			array.push(key);
		}
	})
	return array;
}

function change_favicon (path) {
	assert(typeof(path) == "string", "Path for change_favicon(" + path + ") is not a string, but " + typeof(path));

	var link = document.querySelector("link[rel~='icon']");
	if (!link) {
		link = document.createElement('link');
		link.rel = 'icon';
		document.getElementsByTagName('head')[0].appendChild(link);
	}
	link.href = path;
}

function favicon_default () {
	change_favicon("favicon.ico");
}

function favicon_spinner () {
	change_favicon("loading_favicon.gif");
}

var local_store = window.localStorage;

local_store.clear();

function disable_everything () {
	$('body').css('cursor', 'wait');
	$("#layers_container").sortable("disable");
	$("#ribbon,select,input,checkbox").prop("disabled", true);
	$("#ribbon,select,input,checkbox").prop("disabled", true);
	$(".show_data").prop("disabled", false);
	write_descriptions();
	Prism.highlightAll();
}

function enable_everything () {
	$('body').css('cursor', 'default');
	$("#layers_container").sortable("enable");
	$("#ribbon,select,input,checkbox").prop("disabled", false);
	write_descriptions();
	Prism.highlightAll();
}

function detect_kernel_initializer (original_kernel_initializer_data) {
	assert(typeof(original_kernel_initializer_data) == "object", "Parameter for detect_kernel_initializer(" + original_kernel_initializer_data + ") is not an array, but " + typeof(original_kernel_initializer_data));

	var kernel_initializer_data = original_kernel_initializer_data["config"];

	if("mode" in kernel_initializer_data) {
		if(kernel_initializer_data["mode"].toLowerCase().includes("avg")) {
			if(kernel_initializer_data["distribution"] == "uniform") {
				return "glorotUniform";
			} else if (kernel_initializer_data["distribution"] == "normal") {
				return "glorotNormal";
			}
		} else if(kernel_initializer_data["mode"].toLowerCase().includes("in")) {
			if(kernel_initializer_data["scale"] == 2) {
				if(kernel_initializer_data["distribution"] == "uniform") {
					return "heUniform";
				} else if (kernel_initializer_data["distribution"] == "normal") {
					return "heNormal";
				}
			} else if(kernel_initializer_data["scale"] == 1) {
				if(kernel_initializer_data["distribution"] == "uniform") {
					return "leCunUniform";
				} else if (kernel_initializer_data["distribution"] == "normal") {
					return "leCunNormal";
				}
			}
		} else {
			log("Not fanAvg, nor FanIn");
			log(kernel_initializer_data);
		}
	} else {
		//log("No mode");
		//log(kernel_initializer_data);

		return original_kernel_initializer_data["class_name"];
	}
}

function show_or_hide_bias_initializer (numberoflayers) {
	var layer_settings = $(".layer_setting");
	for (var i = 0; i < numberoflayers; i++) {
		var this_layer = $(layer_settings[i]);
		var use_bias_setting = this_layer.find(".use_bias");
		if(use_bias_setting.length) {
			if($(use_bias_setting[0]).is(":checked")) {
				this_layer.find(".bias_initializer").parent().parent().show()
			} else {
				this_layer.find(".bias_initializer").parent().parent().hide()
			}
		}
	}
}

/* Diese Funktion sollte eigentlich leere Gruppen verstecken, aber hat nie geklappt. Daher: TODO, aber ohne Eile! */
function hide_empty_groups (layer_nr) {
	assert(typeof(layer_nr) == "number", "hide_empty_groups(" + layer_nr + "), layer_nr is not an integer but " + typeof(layer_nr));

	$($(".layer_type")[layer_nr]).children().each(function (i, group) {
		var children = $(group).children();

		var number_of_enabled_children = 0;
		for (var j = 0; j < children.length; j++) {
			if(!($(children[j]).is(":disabled") || $(children[j]).is(":selected"))) {
				number_of_enabled_children += 1;
			}
		}

		log("number_of_enabled_children of " + $($($(".layer_type")[layer_nr]).children()[i]).prop("label") + ": " + number_of_enabled_children);

		if(number_of_enabled_children) {
			$(group).show();
		} else {
			$(group).hide();
		}
	})
}

function set_all_kernel_initializers () {
	var chosen_value = $("#set_all_kernel_initializers").val();
	var initializer_keys = Object.keys(initializers);
	if(initializer_keys.includes(chosen_value)) {
		$(".kernel_initializer").val(chosen_value)
	}

	$("#set_all_kernel_initializers").val("none");

	updated_page();
}

function set_all_bias_initializers () {
	var chosen_value = $("#set_all_bias_initializers").val();
	var initializer_keys = Object.keys(initializers);
	if(initializer_keys.includes(chosen_value)) {
		$(".bias_initializer").val(chosen_value)
	}

	$("#set_all_bias_initializers").val("none");

	updated_page();
}

function set_all_activation_functions () {
	var chosen_value = $("#set_all_activation_functions").val();
	var keys = Object.keys(activations);
	if(keys.includes(chosen_value)) {
		$(".activation").val(chosen_value)
	}

	$("#set_all_activation_functions").val("none");

	updated_page();
}

function last_index (array) {
	assert(typeof(array) == "object", "last_index(" + array + ") is not an array but " + typeof(array));
	return array.length - 1;
}

async function save_current_status () {
	var index = get_current_status_hash();
	if(state_stack.includes(index) || future_state_stack.includes(index)) {
		return;
	}

	var save_this_data = undefined;

	await model.save(tf.io.withSaveHandler(artifacts => {
		save_this_data = artifacts;
	}));

	status_saves[index] = JSON.stringify(save_this_data);

	future_state_stack = [];

	if(last_index(state_stack) == -1 || state_stack[last_index(state_stack)] != index) {
		state_stack.push(index);
	}

	show_hide_undo_buttons();
}

function undo () {
	if(state_stack.length > 1) {
		var old_index = state_stack.pop();
		var this_index = state_stack.pop();
		future_state_stack.unshift(old_index); // Add to beginning of future_state_stack
		if(last_index(state_stack) == -1 || state_stack[last_index(state_stack)] != this_index) {
			state_stack.push(this_index);
		}

		var old_disabling_saving_status = disabling_saving_status;
		disabling_saving_status = true;

		set_config(this_index);

		disabling_saving_status = old_disabling_saving_status;
	} else {
		//log("No undo-stack");
	}

	show_hide_undo_buttons();
}

function redo () {
	if(future_state_stack.length) {
		var this_index = future_state_stack.shift();
		if(last_index(state_stack) == -1 || state_stack[last_index(state_stack)] != this_index) {
			state_stack.push(this_index); // Add to end of state_stack
		}

		var old_disabling_saving_status = disabling_saving_status;
		disabling_saving_status = true;

		set_config(this_index);

		disabling_saving_status = old_disabling_saving_status;

	} else {
		//log("No redo-stack");
	}

	show_hide_undo_buttons();
}

function enable_symbol (name) {
	assert(typeof(name) == "string", name + " is not a string but " + typeof(name));
	var el = document.getElementById(name);
	assert(typeof(el) == "object", "document.getElementById(" + name + ") is not an object");
	el.classList.remove("disabled_symbol");
	el.classList.add("enabled_symbol");
}

function disable_symbol (name) {
	assert(typeof(name) == "string", name + " is not a string but " + typeof(name));
	var el = document.getElementById(name);
	assert(typeof(el) == "object", "document.getElementById(" + name + ") is not an object");
	el.classList.remove("enabled_symbol");
	el.classList.add("disabled_symbol");
}

function show_hide_undo_buttons () {
	disable_symbol("undo_button");
	disable_symbol("redo_button");

	if(state_stack.length > 1) {
		enable_symbol("undo_button");
	}

	if(future_state_stack.length) {
		enable_symbol("redo_button");
	}


	//debug_undo_redo_stack();
}

function debug_undo_redo_stack () {
	console.clear();

	header("State-Stack:");
	log(state_stack);

	header("Redo-Stack:");
	log(future_state_stack);

	header("status_saves:");
	log(Object.keys(status_saves));
}

function open_save_dialog () {
	openPopup("save_dialog");
}

function openPopup(name) {
	assert(typeof(name) == "string", name + " is not a string but " + typeof(name));
	var el = document.getElementById(name);
	assert(typeof(el) == "object", "document.getElementById(" + name + ") is not an object");
	el.style.display = 'block';
}

function closePopup(name) {
	assert(typeof(name) == "string", name + " is not a string but " + typeof(name));
	var el = document.getElementById(name);
	assert(typeof(el) == "object", "document.getElementById(" + name + " is not an object");
	el.style.display = 'none';
}

function upload_model(evt) {
	let files = evt.target.files;

	let f = files[0];

	let reader = new FileReader();

	// Closure to capture the file information.
	reader.onload = (function(theFile) {
		return function(e) {
			local_store.setItem("tensorflowjs_models/mymodel", e.target.result);
		};
	})(f);

	reader.readAsText(f);

	set_config();

	add_layer_debuggers();
}

async function upload_weights(evt) {
	let files = evt.target.files;

	let f = files[0];

	let reader = new FileReader();

	// Closure to capture the file information.
	reader.onload = (() => function(theFile) {
		return function(e) {

		};
	})(f);

	reader.readAsText(f);

	var modelUpload = document.getElementById('upload_model');
	var weightsUpload = document.getElementById('upload_weights');

	model = await tf.loadLayersModel(tf.io.browserFiles([modelUpload.files[0], weightsUpload.files[0]]));

	add_layer_debuggers();

	$("#predictcontainer").show();
	$('a[href="#predict_tab"]').click();
}

var handle_x_file = async function (evt) {
	x_file = await evt.target.files[0].text();
	set_input_shape("[" + get_shape_from_file(x_file) + "]");
	updated_page();
}

var handle_y_file = async function (evt) {
	y_file = await evt.target.files[0].text();
	y_shape = get_shape_from_file(y_file);
	$("#y_shape_div").show();
	$("#y_shape").val(y_shape);
	updated_page();
}

function get_sum_of_items_childrens_width (item) {
	var total_width = 0;

	$(item).each(function(index) {
		total_width += parseInt($(this).width(), 10);
	});

	return total_width;
}

function get_max_ribbon_width () {
	return 1600;

	// TODO
	var max_width = 0;
	$("#ribbon").children().each(function (i, el) {
		var this_val = get_sum_of_items_childrens_width(el);
		if(this_val > max_width) {
			max_width = this_val;
		}
	});

	return max_width;
}

function set_ribbon_min_width () {
	$("#ribbon").css({"min-width": ''});

	$("#ribbon").css({
		"min-width": parseInt(get_max_ribbon_width() * 1.001) + "px"
	});
}

function load_weights () {
	var category_text = $("#dataset_category option:selected").text();
	var dataset = $("#dataset option:selected").text();
	var this_struct = traindata_struct[category_text]["datasets"][dataset];

	var weights_file = this_struct["weights_file"];

	$.ajax({
		url: weights_file,
		success: function (data) {
			set_weights_from_json_object(data);
		}
	});
}

function show_dtype_only_first_layer () {
	for (var i = 0; i < get_numberoflayers(); i++) {
		if(i == 0) {
			$($(".dtype")[i]).parent().parent().show()
		} else {
			$($(".dtype")[i]).parent().parent().hide()
		}
	}
}

function attrChangeName(elem, attr, new_attr) {
	var data = $(elem).attr(attr);
	$(elem).attr(new_attr, data);
	$(elem).removeAttr(attr);
}

function is_hidden_or_has_hidden_parent (element) {
	if($(element).css("display") == "none") {
		return true;
	}

	var parents = $(element).parents();

	for (var i = 0; i < parents.length; i++) {
		if($(parents[i]).css("display") == "none") {
			return true;
		}
	}

	return false;
}

function disable_hidden_chardin_entries () {
	var items = $("[data-intro],[data-introdisabled]");

	for (var i = 0; i < items.length; i++) {
		var target = $(items[i]);
		if(is_hidden_or_has_hidden_parent(target)) {
			attrChangeName(target, "data-intro", "data-introdisabled");
		} else {
			attrChangeName(target, "data-introdisabled", "data-intro");
		}
	}

	chardinJs = $("body").chardinJs();

	var activated_items = $("[data-intro]");

	if(activated_items.length > 0) {
		$("#chardinjs_help_icon").removeClass("disabled_symbol").css("cursor", "help").click(function(){ disable_hidden_chardin_entries(); chardinJs.start(); });
	} else {
		$("#chardinjs_help_icon").addClass("disabled_symbol").css("cursor", "not-allowed").attr("onclick", "").unbind("click");
	}

}

function create_clip_path_for_element (divname) {
	var offset_top = $(divname).offset()["top"];
	var offset_left = $(divname).offset()["left"];

	var width = $(divname).width();
	var height = $(divname).height();

	var left = offset_left;
	var right = left + width;

	var top_y = offset_top;
	var bottom_y = top_y + height;

	var string = `polygon(
	0 0,            /* ganz oben links */
	0 100%,         /* ganz unten links */

	${left}px 100%,       /* abschluss links */

	${left}px ${top_y}px,        /* frame oben links */
	${right}px ${top_y}px,        /* frame oben rechts*/

	${right}px ${bottom_y}px,        /* frame unten rechts */
	${left}px ${bottom_y}px,        /* frame unten links */

	${left}px 100%,       /* abschluss rechts */

	100% 100%,      /* ganz unten rechts */
	100% 0          /* ganz oben rechts */
	);
	`;
	return string;
}
