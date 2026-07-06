"use strict";

async function change_optimizer() {
	var type = get_optimizer();
	$(".optimizer_metadata").hide();

	$("#" + type + "_metadata").show();

	await updated_page();

	await get_model_data();
}

function set_momentum(val) {
	$("#momentum_" + get_optimizer()).val(val);
}

function set_optimizer_special_sgd_rmsprop_from_config(config) {
	if (["sgd", "rmsprop"].includes(config["optimizer"])) {
		set_learning_rate(config["learningRate"]);
	}
}

function set_optimizer_special_rmsprop_from_config(config) {
	if (config["optimizer"] == "rmsprop") {
		l(language[lang]["setting_optimizer_to_rmsprop"]);
		set_rho(config["rho"]);
		set_decay(config["decay"]);
		set_epsilon(config["epsilon"]);
	}
}

function set_optimizer_special_momentum_rmsprop_from_config(config) {
	if (["momentum", "rmsprop"].includes(config["optimizer"])) {
		set_momentum(config["momentum"]);
	}
}

function set_optimizer(val, trigger_change = 1) {
	assert(typeof(val) == "string", val + " is not an string but " + typeof(val));
	l(language[lang]["set_optimizer_to"] + val);
	$("#optimizer").val(val);
	if(trigger_change) {
		$("#optimizer").trigger("change");
	}
}

function set_epsilon(val) {
	$("#epsilon_" + get_optimizer()).val(val);
}

function set_decay(val) {
	$("#decay_" + get_optimizer()).val(val);
}

function set_rho(val) {
	$("#rho_" + get_optimizer()).val(val);
}

function set_learning_rate(val) {
	$("#learningRate_" + get_optimizer()).val(val);
}

function setOptimizerTooltips() {
	const lang = window.lang;

	optimizer_infos_json.forEach(function(optimizer) {
		const optimizerName = optimizer.optimizer;
		const infoText = optimizer.info[lang];
		const variables = optimizer.variable_info;

		$(`#${optimizerName}_metadata .TRANSLATEME_optimizer`).attr('title', infoText);

		Object.keys(variables).forEach(function(variableName) {
			const tooltipText = variables[variableName][lang];
			$(`#${optimizerName}_metadata .TRANSLATEME_${variableName}`).attr('title', tooltipText);
		});
	});
}

function get_optimizer() {
	return $("#optimizer").val();
}
