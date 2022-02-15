"use strict";

function assertationFailed (message) {
	this.message = message;
};


function assert(boolean_value, exception_message) {
	if(!boolean_value) {
		console.trace();
		throw new assertationFailed(exception_message);
	}
}
