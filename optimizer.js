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


