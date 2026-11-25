"use strict";

function set_cookie(name, value, days = 365) {
	var expires = "";
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = "; expires=" + date.toUTCString();
	}

	// Set SameSite and secure attributes
	var cookieOptions = "; SameSite=None; secure";

	document.cookie = name + "=" + (value || "") + expires + "; path=/" + cookieOptions;
}

function get_cookie(name) {
	var nameEQ = name + "=";
	var ca = document?.cookie?.split(";");

	if(!ca) {
		return null;
	}

	for(var ca_idx = 0; ca_idx < ca.length; ca_idx++) {
		var c = ca[ca_idx];
		while (c.charAt(0)==" ") c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function delete_cookie(name) {
	document.cookie = name +"=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

function get_get(paramName, _default) {
	var urlParams = new URLSearchParams(window.location.search);
	var res = urlParams.get(paramName);
	if(res !== null && res !== "") {
		return res;
	}

	return _default;
}

function set_get(paramName, paramValue) {
	var urlParams = new URLSearchParams(window.location.search);
	urlParams.set(paramName, paramValue);

	// Update the URL with the new parameter
	var newUrl = `${window.location.origin}${window.location.pathname}?${urlParams.toString()}`;

	try {
		history.replaceState(null, "", newUrl); // Update the URL without reloading the page
	} catch (error) {
		// Handle error: Log and warn about the error
		wrn("[set_get] Error updating URL:", error);
		// You can add more intelligent handling here if needed
	}
}
