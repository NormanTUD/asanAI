"use strict";

function assertationFailed (message) {
	this.message = message;
};


function assert(boolean_value, exception_message) {
	if(!boolean_value) {
		console.trace();
		write_error(exception_message);

		$('body').css('cursor', 'default');
		$("#layers_container").sortable("enable");
		$("#ribbon,select,input,checkbox").prop("disabled", false);
		write_descriptions();
		highlight_code();

		var link = document.querySelector("link[rel~='icon']");
		if (!link) {
			link = document.createElement('link');
			link.rel = 'icon';
			document.getElementsByTagName('head')[0].appendChild(link);
		}
		link.href = 'favicon.ico';

		throw new assertationFailed(exception_message);
	} else {
		$("body").css("cursor", "default");
	}
}
