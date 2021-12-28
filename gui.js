"use strict";

function md5(inputString) {
    var hc="0123456789abcdef";
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
    var i,x=sb(inputString),a=1732584193,b=-271733879,c=-1732584194,d=271733878,olda,oldb,oldc,oldd;
    for(i=0;i<x.length;i+=16) {olda=a;oldb=b;oldc=c;oldd=d;
        a=ff(a,b,c,d,x[i+ 0], 7, -680876936);d=ff(d,a,b,c,x[i+ 1],12, -389564586);c=ff(c,d,a,b,x[i+ 2],17,  606105819);
        b=ff(b,c,d,a,x[i+ 3],22,-1044525330);a=ff(a,b,c,d,x[i+ 4], 7, -176418897);d=ff(d,a,b,c,x[i+ 5],12, 1200080426);
        c=ff(c,d,a,b,x[i+ 6],17,-1473231341);b=ff(b,c,d,a,x[i+ 7],22,  -45705983);a=ff(a,b,c,d,x[i+ 8], 7, 1770035416);
        d=ff(d,a,b,c,x[i+ 9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,     -42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
        a=ff(a,b,c,d,x[i+12], 7, 1804603682);d=ff(d,a,b,c,x[i+13],12,  -40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);
        b=ff(b,c,d,a,x[i+15],22, 1236535329);a=gg(a,b,c,d,x[i+ 1], 5, -165796510);d=gg(d,a,b,c,x[i+ 6], 9,-1069501632);
        c=gg(c,d,a,b,x[i+11],14,  643717713);b=gg(b,c,d,a,x[i+ 0],20, -373897302);a=gg(a,b,c,d,x[i+ 5], 5, -701558691);
        d=gg(d,a,b,c,x[i+10], 9,   38016083);c=gg(c,d,a,b,x[i+15],14, -660478335);b=gg(b,c,d,a,x[i+ 4],20, -405537848);
        a=gg(a,b,c,d,x[i+ 9], 5,  568446438);d=gg(d,a,b,c,x[i+14], 9,-1019803690);c=gg(c,d,a,b,x[i+ 3],14, -187363961);
        b=gg(b,c,d,a,x[i+ 8],20, 1163531501);a=gg(a,b,c,d,x[i+13], 5,-1444681467);d=gg(d,a,b,c,x[i+ 2], 9,  -51403784);
        c=gg(c,d,a,b,x[i+ 7],14, 1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);a=hh(a,b,c,d,x[i+ 5], 4,    -378558);
        d=hh(d,a,b,c,x[i+ 8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16, 1839030562);b=hh(b,c,d,a,x[i+14],23,  -35309556);
        a=hh(a,b,c,d,x[i+ 1], 4,-1530992060);d=hh(d,a,b,c,x[i+ 4],11, 1272893353);c=hh(c,d,a,b,x[i+ 7],16, -155497632);
        b=hh(b,c,d,a,x[i+10],23,-1094730640);a=hh(a,b,c,d,x[i+13], 4,  681279174);d=hh(d,a,b,c,x[i+ 0],11, -358537222);
        c=hh(c,d,a,b,x[i+ 3],16, -722521979);b=hh(b,c,d,a,x[i+ 6],23,   76029189);a=hh(a,b,c,d,x[i+ 9], 4, -640364487);
        d=hh(d,a,b,c,x[i+12],11, -421815835);c=hh(c,d,a,b,x[i+15],16,  530742520);b=hh(b,c,d,a,x[i+ 2],23, -995338651);
        a=ii(a,b,c,d,x[i+ 0], 6, -198630844);d=ii(d,a,b,c,x[i+ 7],10, 1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);
        b=ii(b,c,d,a,x[i+ 5],21,  -57434055);a=ii(a,b,c,d,x[i+12], 6, 1700485571);d=ii(d,a,b,c,x[i+ 3],10,-1894986606);
        c=ii(c,d,a,b,x[i+10],15,   -1051523);b=ii(b,c,d,a,x[i+ 1],21,-2054922799);a=ii(a,b,c,d,x[i+ 8], 6, 1873313359);
        d=ii(d,a,b,c,x[i+15],10,  -30611744);c=ii(c,d,a,b,x[i+ 6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21, 1309151649);
        a=ii(a,b,c,d,x[i+ 4], 6, -145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+ 2],15,  718787259);
        b=ii(b,c,d,a,x[i+ 9],21, -343485551);a=ad(a,olda);b=ad(b,oldb);c=ad(c,oldc);d=ad(d,oldd);
    }
    return rh(a)+rh(b)+rh(c)+rh(d);
}

function get_current_status_hash () {
    var html_code = '';
    $("input,checkbox,select,textarea").each(function (e, x) {
        html_code += ";;;;;;;" + $(x).prop("id") + ";;;;" + $(x).prop("class") + "=" + $(x).val() + ";;;;" + $(x).is(":checked");
    })

    return md5(html_code);
}

function get_item_value (layer, classname) {
	if(typeof(classname) == "string") {
		if($($($(".layer_setting")[layer]).find("." + classname)[0]).attr("type") == "checkbox") {
			return $($($(".layer_setting")[layer]).find("." + classname)[0]).is(":checked");
		} else {
			var data = $($($(".layer_setting")[layer]).find("." + classname)[0]).val();
			return data;
		}
	} else {
		for (var this_classname in classname) {
			if($($($(".layer_setting")[layer]).find("." + this_classname)[0]).attr("type") == "checkbox") {
				var data = $($($(".layer_setting")[layer]).find("." + this_classname)[0]).is(":checked");
				return data;
			} else {
				var data = $($($(".layer_setting")[layer]).find("." + this_classname)[0]).val();
				if(data) {
					return data;
				}
			}
		}
		return null;
	}
}

function set_item_value (layer, classname, value) {
	if($($($(".layer_setting")[layer]).find("." + classname)[0]).attr("type") == "checkbox") {
		$($($(".layer_setting")[layer]).find("." + classname)[0]).prop("checked", value == 1 ? true : false);
	} else {
		$($($(".layer_setting")[layer]).find("." + classname)[0]).val(value);
	}
}

function get_tr_str_for_description (desc) {
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
		JSON.stringify(item);
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
		text += "$$ \\begin{pmatrix} 1 & 1 & 1 \\\\ \n 1 & 1 & 1 \\\\ \n 1 & 1 & 1 \\end{pmatrix}  $$";

		text += "<h2>zeros</h2>"
		text += "$$ \\begin{pmatrix} 0 & 0 & 0 \\\\ \n 0 & 0 & 0 \\\\ \n 0 & 0 & 0 \\end{pmatrix}  $$";
	}

	$("#visual_help_tab").html("<center>" + text + "</center>");

	MathJax.Hub.Queue(["Typeset",MathJax.Hub]);

	$("#visualization_tab_label").click();
	$("#visual_help_tab_label").show();
	$("#visual_help_tab_label").click();
}

function visual_help_text (filename, text) {
	$("#visual_help_tab").html(text + "<br><center><img style='width: 80%' src='visualhelp/" + filename + "' /></center>");
	$("#visualization_tab_label").click();
	$("#visual_help_tab_label").show();
	$("#visual_help_tab_label").click();
}

function visual_help (filename) {
	$("#visual_help_tab").html("<center><img style='width: 80%' src='visualhelp/" + filename + "' /></center>");
	$("#visualization_tab_label").click();
	$("#visual_help_tab_label").show();
	$("#visual_help_tab_label").click();
}

function get_tr_str_for_layer_table (desc, classname, type, data, nr) {
	var str = "<tr>";

	var help = "";
	if(desc.toLowerCase().includes("activation function")) {
		help = "<sup><a style='cursor: help;' onclick='plot_activation($($(this).parent().parent().parent().find(\"td\")[1]).find(\"select\").val())'>?</a></sup>";
	} else if (desc.toLowerCase().includes("strides")) {
		help = "<sup><a style='cursor: help;' onclick='visual_help_text(\"strides.svg\", \"Stride 1: preserve resolution.<br>Stride 2+: downsample<br>\")'>?</a></sup>";
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
			str += "<select class='input_data " + classname + "' onchange='show_python()'>";
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
				pre_text = " text='" + data["text"] + "' ";
			}

			str += '<input class="input_data ' + classname + '" ' + pre_text + placeholder + ' type="text" onkeyup="show_python()"/>';
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

			str += " onchange='show_python()' onkeyup='show_python()' />";
		} else if(type == "checkbox") {
			str += "<input type='checkbox' class='input_data " + classname + "' onchange='show_python();' ";
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

function add_theta_option (nr) {
	return get_tr_str_for_layer_table("Theta", "theta", "number", { "min": 0, "max": 1000, "step": 1, "value": -1 }, nr);
}

function add_axis_option (nr) {
	return get_tr_str_for_layer_table("Axis", "axis", "number", { "min": -1, "max": 1000, "step": 1, "value": -1 }, nr);
}

function add_max_value_option (nr) {
	return get_tr_str_for_layer_table("Max-Value", "max_value", "number", { "min": 0, "max": 1000, "step": 1, "value": 1 }, nr);
}

function add_size_option (nr) {
	return get_tr_str_for_layer_table("Size", "size", "text", { "text": "2,2", "placeholder": "2 comma-seperated numbers" }, nr);
}

function add_dilation_rate_option (nr) {
	return get_tr_str_for_layer_table("Dilation-Rate", "dilation_rate", "text", { "text": "", "placeholder": "1-3 numbers" }, nr);
}

function add_padding_option (nr) {
	return get_tr_str_for_layer_table("Padding", "padding", "select", { "valid": "valid", "same": "same", "causal": "causal"}, nr);
}

function add_pool_size_1d_option (nr) {
	var str = "";
	str += get_tr_str_for_layer_table("Pool-Size", "pool_size", "number", { "min": 1, "max": 4096, "step": 1, "value": 2 }, nr);
	return str;
}

function add_pool_size_option (nr) {
	var str = "";
	str += get_tr_str_for_layer_table("Pool-Size X", "pool_size_x", "number", { "min": 1, "max": 4096, "step": 1, "value": 2 }, nr);
	str += get_tr_str_for_layer_table("Pool-Size Y", "pool_size_y", "number", { "min": 1, "max": 4096, "step": 1, "value": 2 }, nr);
	return str;
}

function add_filters_option (nr) {
	return get_tr_str_for_layer_table("Filters", "filters", "number", { "min": 1, "max": 256, "step": 1, "value": 2 }, nr);
}

function add_kernel_size_1d_option (nr) {
	var str = "";
	str += get_tr_str_for_layer_table("Kernel-Size", "kernel_size", "number", { "min": 1, "max": 4096, "step": 1, "value": 2 }, nr);
	return str;
}

function add_kernel_size_option (nr) {
	var str = "";
	str += get_tr_str_for_layer_table("Kernel-Size X", "kernel_size_x", "number", { "min": 1, "max": 4096, "step": 1, "value": 2 }, nr);
	str += get_tr_str_for_layer_table("Kernel-Size Y", "kernel_size_y", "number", { "min": 1, "max": 4096, "step": 1, "value": 2 }, nr);
	return str;
}

function add_strides_1d_option (nr) {
	var str = "";
	str += get_tr_str_for_layer_table("Strides", "strides", "number", { "min": 1, "max": 4096, "step": 1, "value": 2 }, nr);
	return str;
}

function add_strides_option (nr) {
	var str = "";
	str += get_tr_str_for_layer_table("Strides X", "strides_x", "number", { "min": 1, "max": 4096, "step": 1, "value": 2 }, nr);
	str += get_tr_str_for_layer_table("Strides Y", "strides_y", "number", { "min": 1, "max": 4096, "step": 1, "value": 2 }, nr);
	return str;
}

function add_alpha_option (nr) {
	return get_tr_str_for_layer_table("Alpha", "alpha", "number", { "min": 0, "max": 100, "step": 0.01, "value": 1 }, nr);
}

function add_dropout_rate_option (nr) {
	return get_tr_str_for_layer_table("Dropout rate (in %)", "dropout_rate", "number", { "min": 0, "max": 100, "step": 5, "value": 25 }, nr);
}

function add_max_features_option (nr) {
	return get_tr_str_for_layer_table("Max features", "max_features", "number", { "min": 1, "max": 4096, "step": 1, "value": 3 }, nr);
}

function add_momentum_option (nr) {
	return get_tr_str_for_layer_table("Momentum", "momentum", "number", { "min": 0, "max": 8192, "step": 0.01, "value": 0.99 }, nr);
}

function add_units_option (nr) {
	return get_tr_str_for_layer_table("Units", "units", "number", { "min": 1, "max": 8192, "step": 1, "value": 2 }, nr);
}

function add_use_bias_option(nr) {
	return get_tr_str_for_layer_table("Use Bias", "use_bias", "checkbox", { "status": "checked" }, nr);
}

function add_scale_option (nr) {
	return get_tr_str_for_layer_table("Scale?", "scale", "checkbox", { "status": "checked" }, nr);
}

function add_center_option (nr) {
	return get_tr_str_for_layer_table("Center?", "center", "checkbox", { "status": "checked" }, nr);
}

function add_trainable_option (nr) {
	return get_tr_str_for_layer_table("Trainable", "trainable", "checkbox", { "status": "checked" }, nr);
}

function add_recurrent_initializer_option (nr) {
	return get_tr_str_for_layer_table("Recurrent Initializer", "recurrent_initializer", "select", initializers, nr);
}

function add_kernel_regularizer_option (nr) {
	return get_tr_str_for_layer_table("Kernel Regularizer", "kernel_regularizer", "select", initializers, nr);
}

function add_recurrent_constraint_option (nr) {
	return get_tr_str_for_layer_table("Recurrent Contraint", "recurrent_constraint", "select", constraints, nr);
}

function add_bias_constraint_option (nr) {
	return get_tr_str_for_layer_table("Bias Contraint", "bias_constraint", "select", constraints, nr);
}

function add_stddev_option (nr) {
	return get_tr_str_for_layer_table("Standard-Deviation", "dropout", "number", { "min": 0, "value": 1 }, nr);
}

function add_rate_option (nr) {
	return get_tr_str_for_layer_table("Dropout rate (0 to 1)", "dropout", "number", { "min": 0, "max": 1, "step": 0.1, "value": 0 }, nr);
}

function add_dropout_option (nr) {
	return get_tr_str_for_layer_table("Dropout rate (0 to 1)", "dropout", "number", { "min": 0, "max": 1, "step": 0.1, "value": 0 }, nr);
}

function add_recurrent_dropout_option (nr) {
	return get_tr_str_for_layer_table("Recurrent dropout rate (0 to 1)", "recurrent_dropout", "number", { "min": 0, "max": 1, "step": 0.1, "value": 0 }, nr);
}

function add_return_sequences_option (nr) {
	return get_tr_str_for_layer_table("Return sequences?", "return_sequences", "checkbox", { "status": "checked" }, nr);
}

function add_unroll_option (nr) {
	return get_tr_str_for_layer_table("Unroll?", "unroll", "checkbox", { "status": "checked" }, nr);
}

function add_recurrent_activation_option (nr) {
	return get_tr_str_for_layer_table("Recurrent Activation function", "recurrent_activation", "select", activations, nr);
}

function add_unit_forget_bias_option (nr) {
	return get_tr_str_for_layer_table("Unit forget bias", "unit_forget_bias", "checkbox", { "status": "checked" }, nr);
}

function add_implementation_option (nr) {
	return get_tr_str_for_layer_table("Implementation", "implementation", "select", implementation_modes, nr);
}

function add_kernel_constraint_option (nr) {
	return get_tr_str_for_layer_table("Kernel Contraint", "kernel_constraint", "select", constraints, nr);
}

function add_return_state_option (nr) {
	return get_tr_str_for_layer_table("Return state?", "return_state", "checkbox", { "status": "" }, nr);
}

function add_stateful_option (nr) {
	return get_tr_str_for_layer_table("Stateful?", "stateful", "checkbox", { "status": "" }, nr);
}

function add_go_backwards_option (nr) {
	return get_tr_str_for_layer_table("Go Backwards?", "go_backwards", "checkbox", { "status": "" }, nr);
}

function add_epsilon_option (nr) {
	return get_tr_str_for_layer_table("Epsilon multiplier", "epsilon", "number", { "min": -1, "max": 1, "step": 0.0001, "value": 0.001 }, nr);
}

function add_depth_multiplier_option (nr) {
	return get_tr_str_for_layer_table("Depth multiplier", "depth_multiplier", "number", { "min": 0, "max": 1, "step": 0.1, "value": 1 }, nr);
}

function add_depthwise_initializer_option (nr) {
	return get_tr_str_for_layer_table("Depthwise Initializer", "depthwise_initializer", "select", initializers, nr);
}

function add_gamma_constraint_option (nr) {
	return get_tr_str_for_layer_table("Gamma contraint", "gamma_constraint", "select", constraints, nr);
}

function add_beta_constraint_option (nr) {
	return get_tr_str_for_layer_table("Beta contraint", "beta_constraint", "select", constraints, nr);
}

function add_depthwise_constraint_option (nr) {
	return get_tr_str_for_layer_table("Depthwise contraint", "depthwise_constraint", "select", constraints, nr);
}

function add_moving_variance_initializer_option (nr) {
	return get_tr_str_for_layer_table("Moving variance Initializer", "moving_variance_initializer", "select", initializers, nr);
}

function add_moving_mean_initializer_option (nr) {
	return get_tr_str_for_layer_table("Moving mean Initializer", "moving_mean_initializer", "select", initializers, nr);
}

function add_interpolation_option (nr) {
	return get_tr_str_for_layer_table("Interpolation", "interpolation", "select", interpolation, nr);
}

function add_beta_initializer_option (nr) {
	return get_tr_str_for_layer_table("Beta Initializer", "beta_initializer", "select", initializers, nr);
}

function add_gamma_initializer_option (nr) {
	return get_tr_str_for_layer_table("Gamma Initializer", "gamma_initializer", "select", initializers, nr);
}

function add_pointwise_initializer_option (nr) {
	return get_tr_str_for_layer_table("Pointwise Initializer", "pointwise_initializer", "select", initializers, nr);
}

function add_pointwise_constraint_option (nr) {
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

async function _get_configuration () {
	var data = null;
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

function change_height () {
	height = parseInt($("#height").val());
	var inputShape = get_input_shape();
	inputShape[1] = height;
	set_input_shape("[" + inputShape.join(", ") + "]");
	show_python();
}

function change_pixel_size () {
	pixel_size = parseInt($("#pixel_size").val());
}

function change_width () {
	width = parseInt($("#width").val());
	var inputShape = get_input_shape();
	inputShape[0] = width;
	set_input_shape("[" + inputShape.join(", ") + "]");
	show_python();
}

function show_python(no_graph_restart) {
	if(disable_show_python_and_create_model) {
		return;
	}

	try {
		compile_model(1);
	} catch (e) {
		log("There was an error compiling the model" + e);
	};

	var input_shape = [width, height, number_channels];
	if($("#dataset_category").val() == "own") {
		input_shape = eval("[" + get_shape_from_file(x_file) + "]");
		if(input_shape === null) {
			return 0;
		}
	}

	if($("#dataset_category").val() =="scientific") {
		input_shape = eval("[" + $("#input_shape").val() + "]");
	}

	var epochs = $("#epochs").val();

	$("#pythoncontainer").show();
	$("#python").html("");
	$("#python").show();
	$("#python").append("import keras\n");
	$("#python").append("import numpy as np\n");
	$("#python").append("import tensorflow as tf\n");
	$("#python").append("from keras.optimizers import *\n");
	$("#python").append("from keras.layers import *\n");
	$("#python").append("epochs = " + epochs + "\n");

	if($("#dataset_category").val() == "image") {
		$("#python").append("from tensorflow.keras.preprocessing.image import ImageDataGenerator\n");
		$("#python").append("height = " + height + "\n");
		$("#python").append("width = " + width + "\n");
		$("#python").append("image_data_generator = keras.preprocessing.image.ImageDataGenerator(validation_split=" + (parseInt($("#validationSplit").val()) / 100) + ")\n");
		$("#python").append("image_set = image_data_generator.flow_from_directory('" + $("#dataset").val() + "', target_size=(width, height), color_mode='rgb')\n");

		x_shape = "[width, height, 3]";
	} else if($("#dataset_category").val() == "own") {
		// TODO does not work for e.g. logic category!
		var x_shape = get_full_shape_from_file(x_file);
		var y_shape = get_full_shape_from_file(y_file);
		if(x_shape === null) {
			x_shape = $("#input_shape").val();

		}

		$("#python").append("x = np.loadtxt('x.txt').reshape([" + x_shape + "])\n");
		$("#python").append("y = np.loadtxt('y.txt').reshape([" + y_shape + "])\n");
	} else {
		$("#python").append("import re\n");
		$("#python").append("def get_shape (filename):\n");
		$("#python").append("    with open(filename) as f:\n");
		$("#python").append("        first_line = f.readline()\n");
		$("#python").append("        match = re.search(r'shape: \\((.*)\\)', first_line)\n");
		$("#python").append("        return eval('[' + match[1] + ']')\n");
		$("#python").append("x = np.loadtxt('x.txt').reshape(get_shape('x.txt'))\n");
		$("#python").append("y = np.loadtxt('y.txt').reshape(get_shape('y.txt'))\n");
	}

	$("#python").append("model = keras.models.Sequential()\n");

	var redo_graph = 0;

	for (var i = 0; i < get_numberoflayers(); i++) {
		var html = "";
		var layer_type = $($($(".layer_setting")[i]).find(".layer_type")[0]);
		var type = $(layer_type).val();

		var data = {};

		if(i == 0) {
			if($("#dataset_category").val() == "own" || $("#dataset_category").val() == "image") {
				data["input_shape"] = x_shape;
			} else {
				data["input_shape"] = "get_shape('x.txt')";
			}
		}

		if(type in layer_options) {
			for (var j = 0; j < layer_options[type]["options"].length; j++) {
				var option_name = layer_options[type]["options"][j];
				if(option_name == "pool_size") {
					data[get_python_name(option_name)] = [get_item_value(i, "pool_size_x"), get_item_value(i, "pool_size_y")];
				} else if(option_name == "strides") {
					data[get_python_name(option_name)] = [get_item_value(i, "strides_x"), get_item_value(i, "strides_y")];
				} else if(option_name == "strides_1d") {
					data[get_python_name("strides")] = get_item_value(i, "strides");
				} else if(option_name == "pool_size_1d") {
					data[get_python_name("pool_size")] = get_item_value(i, "pool_size");
				} else if(option_name == "kernel_size") {
					data[get_python_name(option_name)] = [get_item_value(i, "kernel_size_x"), get_item_value(i, "kernel_size_y")];
				} else if(option_name == "kernel_size_1d") {
					data[get_python_name("kernel_size")] = get_item_value(i, "kernel_size");
				} else if(option_name == "size") {
					data[get_python_name(option_name)] = eval("[" + get_item_value(i, "size") + "]");
				} else if(option_name == "dilation_rate") {
					data[get_python_name(option_name)] = eval("[" + get_item_value(i, "dilation_rate") + "]");
				} else {
					data[get_python_name(option_name)] = get_item_value(i, option_name);
				}
			}

			html += "model.add(" + get_python_name(type) + "(";

			redo_graph++;
		}
		var params = [];
		for (const [key, value] of Object.entries(data)) {
			params.push(get_python_name(key) + "=" + quote_python(get_python_name(value)));
		}

		html += params.join(", ");
		html += "))\n";

		$("#python").append(html);
	}

	var loss = $("#loss").val();
	var optimizer_type = $("#optimizer").val();
	var metric_type = $("#metric").val();
	var batchSize = $("#batchSize").val();

	var model_data = {
		loss: loss,
		optimizer: optimizer_type,
		metrics: metric_type
	};

	if(optimizer_type == "sgd") {
		model_data["learning_rate"] = $("#learning_rate_" + $("#optimizer").val()).val();
		$("#python").append("opt = tf.keras.optimizers.SGD(learning_rate=" + model_data["learning_rate"] + ", momentum=" + model_data["momentum"] + ")\n");
	} else {
		$("#python").append("opt = '" + optimizer_type + "'\n");
	}

	$("#python").append("model.compile(optimizer=opt, loss='" + get_python_name($("#loss").val()) + "', metrics=['" + $("#metric").val() + "'])\n");
	$("#python").append("model.summary()\n");
	if($("#dataset_category").val() == "image") {
		$("#python").append("model.fit_generator(image_set, epochs=epochs)");
	} else {
		$("#python").append("model.fit(x, y, epochs=epochs)");
	}

	var validationSplit = parseInt($("#validationSplit").val()) / 100;

	Prism.highlightAll();

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

	identify_layers();

	return 1;
}

function change_optimizer () {
	var type = $("#optimizer").val();
	$(".optimizer_metadata").hide();

	$("#" + type + "_metadata").show();

	show_python(1);
}

function set_momentum (val) {
	$("#momentum_" + $("#optimizer").val()).val(val);
}

function set_validationSplit (val) {
	$("#validationSplit").val(val);
}

function set_epsilon (val) {
	guidebug("#epsilon_" + $("#optimizer").val());
	$("#epsilon_" + $("#optimizer").val()).val(val);
}

function set_decay (val) {
	$("#decay_" + $("#optimizer").val()).val(val);
}

function set_rho (val) {
	$("#rho_" + $("#optimizer").val()).val(val);
}

function set_learning_rate (val) {
	$("#learning_rate_" + $("#optimizer").val()).val(val);
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

function write_model_model_summary (model) {
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

function write_to_summary (x) {
	$("#summary").html("<pre>" + x + "</pre>");
}

function set_optimizer (optimizer) {
	$("#optimizer").val(optimizer);
}

function set_metric (metric) {
	$("#metric").val(metric);
}

function set_loss (loss) {
	$("#loss").val(loss);
}

function get_epochs () {
	return parseInt($("#epochs").val());
}

function get_batchSize () {
	return parseInt($("#batchSize").val());
}

function set_batchSize (batchSize) {
	$("#batchSize").val(batchSize);
}

function set_epochs (epochs) {
	$("#epochs").val(epochs);
}

function set_numberoflayers (val) {
	var val = $("#numberoflayers").val(val);
	return val;
}

function get_numberoflayers () {
	return parseInt($("#numberoflayers").val());
}

function init_epochs(val) {
	set_epochs(val);
}

function init_numberoflayers(val) {
	if(val === null) {
		val = get_numberoflayers();
	}

	set_numberoflayers(val);

	show_layers(get_numberoflayers());

	show_python();
}

function get_option_for_layer_by_type (nr) {
	var type = $($(".layer_setting")[nr]).find(".layer_type").val();

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
						eval("str += add_" + item + "_option(nr);");
					}
				}
			} else {
				alert("No options given for " + key);
			}
		}
		
	}

	str += "<tr><td>Call-Counter:</td><td><span class='call_counter'>0</span></td></tr>";

	return str;
}

function set_option_for_layer(thisitem) {
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

	$($(thisitem).parent(). // td
		parent(). // tr
		parent(). // tbody
		parent(). // table
		children()[1]). // layer_options_internal
		html(get_option_for_layer_by_type(real_nr));

	if(get_activation_list().includes($($(".layer_type")[real_nr]).val())) {
		$($(".whatisthis_activation")[real_nr]).show();
	} else {
		$($(".whatisthis_activation")[real_nr]).hide();
	}

	var nr = 0;
	var current_type = $($(".layer_type")[0]).val();
	$($($(".layer_type")[nr]).find("option[value='" + current_type + "']")[0]).attr("selected", true)

	show_python();

	write_descriptions();
}

function toggle_options (item) {
	$(item).parent().parent().parent().next().toggle();
	write_descriptions();
}

function option_for_layer (nr) {
	var this_event = "set_option_for_layer(this); show_python()";
	var str = "";
	str += "<tr>";
		str += "<td>";
			str += "<button style='cursor: context-menu' class='show_data' onclick='toggle_options(this)'>Advanced</button>";
			str += "<div class='whatisthis_activation' style='display:none'><a onclick='plot_activation($($(\".layer_type\")[" + nr + "]).val())'>What is this?</a></div>";
		str += "</td>";
		str += "<td>";
			str += "<select onchange='" + this_event + "' class='input_data layer_type'>";
				var last_category = '';
				for (var key of Object.keys(layer_options)) {
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
	$(item).parent()[0].remove()

	$("#numberoflayers").val(parseInt($("#numberoflayers").val()) - 1);

	show_python();
}

function add_layer (item) {
	$(item).parent().parent().clone().insertAfter($(item).parent().parent());

	var real_nr = null;

	$(item).parent().parent().parent().parent().parent().parent().children().each(function (nr, elem) {
		if($(elem).find(item).length >= 1) {
			real_nr = nr;
		}
	});

	$("#numberoflayers").val(parseInt($("#numberoflayers").val()) + 1);
	set_option_for_layer($($(".layer_type")[real_nr]))

	write_descriptions();
}

function sortable_layers_container () {
	$("#layers_container").sortable({
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
			write_descriptions();
			$(".descriptions_of_layers").show();
			show_python();
		},
		axis: 'y',
		revert: true
	});
}

function show_layers (number) {
	$("#layers_container").html("");

	for (var i = 0; i < number; i++) {
		var remove = "<button class='add_remove_layer_button remove_layer' onclick='remove_layer(this)'>-</button>";
		var add = "<button class='add_remove_layer_button add_layer' onclick='add_layer(this)'>+</button>&nbsp;<span class='layer_identifier'></span>";

		$("#layers_container").append(
			"<li class='ui-sortable-handle'><span class='layer_start_marker'></span><div class='container layer layer_setting glass_box'>" +
				"<div style='display:none' class='warning_container'><span style='color: yellow'>&#9888;</span><span class='warning_layer'></span></div>" +
				remove +
				add +
				"<table class='configtable'>" + 
					option_for_layer(i) +
				"</table>" +
			"</div>" +
			"<span class='layer_end_marker'></span>" +
			"</li>"
		);

		$("#layer_visualizations_tab").append(
			"<pre style='display: none;' class='layer_data'></pre>" +
			"<button style='display: none;' class='copy_layer_data_button' onclick='copy_layer_data(" + i + ")'>Copy this to clipboard</button>" +
			"<div class='input_image_grid_div' style='display: none'>Input: <div class='input_image_grid'></div></div>" +
			"<div class='output_image_grid_div' style='display: none'>Output: <div class='image_grid'></div></div>"
		);

		
		sortable_layers_container();

		$("#layers_container").droppable({
			tolerance: 'pointer'
		});

		$($('.layer_type')[i]).trigger("change")
	}

	$(".train_neural_network").show();
}

function reset_photo_gallery () {
	$("#photoscontainer").hide();
	$("#photos").html("");
}

function add_photo_to_gallery(url) {
	$("#photoscontainer").show();
	var html = "<img src='" + url + "' height='90' />";
	$("#photos").html(html + $("#photos").html() );
}

async function set_config () {
	var config = await _get_configuration();

	disable_show_python_and_create_model = true;

	if(config) {
		if(config["width"]) { $("#width").val(config["width"]); width = config["width"]; }
		if(config["height"]) { $("#height").val(config["height"]); height = config["height"]; }
		//log(config);
		var keras_layers;
		try {
			keras_layers = config["keras"]["modelTopology"]["config"]["layers"];
		} catch (e) {
			console.log(e);
			keras_layers = config["keras"]["modelTopology"]["model_config"]["layers"];
		}

		init_numberoflayers(keras_layers.length - 1);
		set_epochs(config["epochs"]);
		if(config["input_shape"]) {
			set_input_shape(config["input_shape"]);
		} else {
			determine_input_shape();
		}
		set_loss(config["loss"]);
		set_metric(config["metric"]);
		set_optimizer(config["optimizer"]);
		$("#optimizer").trigger("change");
		if(config["optimizer"] == "sgd") {
			set_learning_rate(config["learning_rate"]);
		} else if(config["optimizer"] == "rmsprop") {
			set_learning_rate(config["learning_rate"]);
			set_rho(config["rho"]);
			set_decay(config["decay"]);
			set_epsilon(config["epsilon"]);
		}

		set_batchSize(config["batchSize"]);
		set_validationSplit(config["validationSplit"]);

		for (var i = 0; i < keras_layers.length - 1; i++) {
			var layer_type = $($($(".layer_setting")[i]).find(".layer_type")[0]);
			layer_type.val(python_names_to_js_names[keras_layers[i + 1]["class_name"]]);
			layer_type.trigger("change");
			layer_type.trigger("slide");
		}

		for (var i = 0; i < keras_layers.length - 1; i++) {
			//header("Layer " + i);
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
				if(item_name in keras_layers[i + 1]["config"] && item_name != "kernel_size" && item_name != "strides" && item_name != "pool_size") {
					var value = keras_layers[i + 1]["config"][item_name];
					if(item_name == "kernel_initializer") {
						//value = get_initializer_name(value["class_name"]);
						value = detect_kernel_initializer(value);
					} else if (item_name == "bias_initializer") {
						value = get_initializer_name(value["class_name"]);
					}
					//log("Setting layer " + i + " value '" + item_name + "' to " + value);
					//log(keras_layers[i + 1]["config"]);
					set_item_value(i, item_name, value);
				} else {
					//log("item_name: " + item_name);
					if(item_name == "kernel_size" && "kernel_size" in keras_layers[i + 1]["config"]) {
						var kernel_size = keras_layers[i + 1]["config"]["kernel_size"];
						if(kernel_size.length == 1) {
							set_item_value(i, "kernel_size_x", kernel_size[0]);
						} else if(kernel_size.length == 1) {
							set_item_value(i, "kernel_size_x", kernel_size[0]);
							set_item_value(i, "kernel_size_y", kernel_size[1]);
						} else if(kernel_size.length == 2) {
							set_item_value(i, "kernel_size_x", kernel_size[0]);
							set_item_value(i, "kernel_size_y", kernel_size[1]);
							set_item_value(i, "kernel_size_z", kernel_size[2]);
						} else {
							log("Don't know what to do with kernel-size: ");
							log(kernel_size);
						}
					} else if(item_name == "strides" && "strides" in keras_layers[i + 1]["config"]) {
						var strides = keras_layers[i + 1]["config"]["strides"];
						if(strides.length == 1) {
							set_item_value(i, "strides_x", strides[0]);
						} else if(strides.length == 1) {
							set_item_value(i, "strides_x", strides[0]);
							set_item_value(i, "strides_y", strides[1]);
						} else if(strides.length == 2) {
							set_item_value(i, "strides_x", strides[0]);
							set_item_value(i, "strides_y", strides[1]);
							set_item_value(i, "strides_z", strides[2]);
						} else {
							log("Don't know what to do with strides: ");
							log(strides);
						}
					} else if(item_name == "pool_size" && "pool_size" in keras_layers[i + 1]["config"]) {
						var pool_size = keras_layers[i + 1]["config"]["pool_size"];
						if(pool_size.length == 1) {
							set_item_value(i, "pool_size_x", pool_size[0]);
						} else if(pool_size.length == 1) {
							set_item_value(i, "pool_size_x", pool_size[0]);
							set_item_value(i, "pool_size_y", pool_size[1]);
						} else if(pool_size.length == 2) {
							set_item_value(i, "pool_size_x", pool_size[0]);
							set_item_value(i, "pool_size_y", pool_size[1]);
							set_item_value(i, "pool_size_z", pool_size[2]);
						} else {
							log("Don't know what to do with pool_size: ");
							log(pool_size);
						}
					} else if(item_name == "dropout_rate" && keras_layers[i + 1]["class_name"] == "Dropout") {
						set_item_value(i, "dropout_rate", keras_layers[i + 1]["config"]["rate"] * 100);
					} else {
						//console.warn("Item not found in keras: " + item_name);
					}
				}
			});

			var units = keras_layers[i + 1]["config"]["units"];
			if(units == "number_of_categories") {
				var number_of_categories = await get_number_of_categories();
				set_item_value(i, "units", number_of_categories);
			} else {
				set_item_value(i, "units", units);
			}

			if("dilation_rate" in keras_layers[i + 1]["config"]) {
				var dilation_rate = keras_layers[i + 1]["config"]["dilation_rate"];
				var dilation_rate_str = dilation_rate.join(",");
				set_item_value(i, "dilation_rate", dilation_rate_str);
			}
		}
	}

	disable_show_python_and_create_model = false;

	create_model();

	write_descriptions();

	restart_lenet();
	restart_alexnet();
	restart_fcnn();
}

async function init_dataset () {
	clicked_on_tab = 0;
	init_download_link();
	init_numberoflayers(1);
	init_epochs(2);
	init_batchsize().then(() => {
		if($("#dataset_category").val() != "own") {
			set_config().then(() => {
				show_python();
			});
		}
	});
	$('a[href="#visualization_tab"]').click();

	$("#tfvis_tab_training_performance_graph").html("");
	$("#tfvis_tab_history_graphs").html("");

	$(".training_performance_tabs").hide();

	$("#history").html("");
	$("#memory").html("");
}

function init_download_link () {
	if($("#dataset_category").val() != "own") {
		$("#download_data").html("Download the training data <a href='traindata/zip.php?dataset=" + $("#dataset").val() + "&dataset_category=" + $("#dataset_category").val() + "'>here</a>.");
		$("#download_data").show();
	} else {
		$("#download_data").hide();
	}
}

async function init_batchsize(val) {
	//var max = await get_number_of_training_items();

	set_batchSize(val);
}

async function get_number_of_categories () {
	var training_data_info = await _get_training_data();
	var num = Object.keys(training_data_info).length;
	return num;
}

async function init_dataset_category () {
	clicked_on_tab = 0;
	var category = $("#dataset_category").val();
	xy_data = null;

	var show_items = {
		"image_resize_dimensions": ["image"],

		"max_values": ["scientific"],
		"max_values.parent": ["scientific"],

		"resizedimensions": ["image"],
		"resizedimensions.parent": ["image"],

		"prepare_data": ["own"],
		"prepare_data.parent": ["own"],

		"tensor_type_div": ["logic", "scientific", "own"],

		"input_shape_div": ["logic", "scientific", "own"],
		"input_shape_div.parent": ["logic", "scientific", "own"],

		"predict_own": ["own"],

		"upload_file": ["image"],

		"imageresizecontainer": ["image"]
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
			dataset += "<option value='tiny'>Cat or dog (tiny)</option>";
			dataset += "<option value='small'>Cat or dog (small)</option>";
			dataset += "<option value='catordog'>Cat or dog (GIANT)</option>";
			dataset += "<option value='color'>Color</option>";
		} else if(category == "logic") {
			dataset += "<option value='xor'>XOR</option>";
		}

		$("#train_data_set_group").show();
		$("#upload_own_data_group").hide();
		$("#dataset_div").show();
		$("#dataset").html(dataset);
		$("#upload_x").hide();
		$("#upload_x").parent().hide();
		$("#upload_y").hide();
		$("#upload_y").parent().hide();
		set_config().then(() => {
			show_python();
		});
	} else {
		$("#train_data_set_group").hide();
		$("#upload_own_data_group").show();
		$("#dataset_div").hide();
		$("#upload_x").show();
		$("#upload_x").parent().show();
		$("#upload_y").show();
		$("#upload_y").parent().show();
		$("#numberoflayers").val(1);
		init_numberoflayers(3);
	}

	init_download_link();
}

function clean_gui () {
	reset_summary();
	$("#errorcontainer").hide();
	$("#error").html("");
	write_descriptions();
}

function set_input_shape (val) {
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

	show_python(1);
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
	Object.keys(layer_options).forEach(function eachKey(key) {
		if(layer_options[key]["category"] == "Activation") {
			array.push(key);
		}
	})
	return array;
}

function change_favicon (path) {
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
	write_descriptions();
}

function enable_everything () {
	$('body').css('cursor', 'default');
	$("#layers_container").sortable("enable");
	$("#ribbon,select,input,checkbox").prop("disabled", false);
	write_descriptions();
}

function detect_kernel_initializer (original_kernel_initializer_data) {
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
		log("No mode");
		log(kernel_initializer_data);

		return original_kernel_initializer_data["class_name"];
	}
}

function updated_gui () {
	var new_current_status_hash = get_current_status_hash();
	if(new_current_status_hash == current_status_hash) {
		return false;
	}

	current_status_hash = new_current_status_hash;

	return true;
}
