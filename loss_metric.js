"use strict";

function set_loss_and_metric_if_not_already_set(val) {
	if(get_loss() != val) {
		set_loss(val, 1);
	}

	if(get_metric() != val) {
		set_metric(val, 1);
	}
}

function set_loss_and_metric (loss, metric) {
	if(!metric) {
		metric = loss;
		if(metric == "binaryCrossentropy") {
			metric = "categoricalCrossentropy";
		}
	}

	set_loss(loss);
	set_metric(metric);
}

function get_loss() {
	return $("#loss").val();
}

function set_loss(val, trigger_change = 1) {
	l(language[lang]["set_loss_to"] + val);

	assert(losses.includes(val), loss + " is not a valid loss. It must be in " + losses.join(", "));
	assert(typeof(val) == "string", val + " is not an string but " + typeof(val));

	const $loss = $("#loss");

	if(get_loss() != val) {
		$loss.val(val);
		if(trigger_change) {
			$loss.trigger("change");
		}
	}
}

function set_metric(val, trigger_change = 1) {
	l(language[lang]["set_metric_to"] + val);

	if(Object.keys(metric_shortnames).includes(val)) {
		val = metric_shortnames[val];
	}

	assert(metrics.includes(val), metric + " is not a valid metric. It must be in " + metrics.join(", "));
	assert(typeof(val) == "string", val + " is not an string but " + typeof(val));

	if(get_metric() != val) {
		$("#metric").val(val);
		if(trigger_change) {
			$("#metric").trigger("change");
		}
	}
}

function get_metric() {
	return $("#metric").val();
}

async function change_metrics() {
	var new_metric = get_metric();

	l(language[lang]["changed_metrics"]);
	$("#metric_equation").html("");

	await updated_page(1);
}

function set_is_classification () {
	if(get_loss() == "categoricalCrossentropy") {
		is_classification = true;
	} else {
		is_classification = false;
	}
}


