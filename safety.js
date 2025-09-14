"use strict";

function assertation_failed (message) {
	this.message = message;
}

function assert(boolean_value, message) {
	if(!boolean_value) {
		console.trace();
		write_error(message, null, null); // cannot be async

		document.body.style.cursor = get_cursor_or_none("default");
		$("#layers_container").sortable("enable");
		$("#ribbon,select,input,checkbox").prop("disabled", false);
		write_descriptions(); // cannot be async
		highlight_code(); // cannot be async

		var link = document.querySelector("link[rel~='icon']");
		if (!link) {
			link = document.createElement("link");
			link.rel = "icon";
			document.getElementsByTagName("head")[0].appendChild(link);
		}
		link.href = "favicon.ico";

		throw new assertation_failed(message);
	} else {
		document.body.style.cursor = get_cursor_or_none("default");
	}
}

function typeassert(_var, type, name) {
	if(type == "array") {
		assert(Array.isArray(_var), `type of ${name} is not ${type}, but ${typeof(_var)}`);
	} else {
		assert(typeof(_var) == type, `type of ${name} is not ${type}, but ${typeof(_var)}`);
	}
}
