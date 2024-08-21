{
	var tf_exists = 1;

	try {
		tf;
	} catch (e) {
		tf_exists = 0;
	}

	if(!tf_exists) {
		alert("The tensorflow library could not be loaded. This is a serious bug. The site will not work without. Try reloading with CTRL F5.");
	}

	var plotly_exists = 1;

	try {
		Plotly;
	} catch (e) {
		plotly_exists = 0;
	}

	if(!plotly_exists) {
		alert("The plotly library could not be loaded. This is a serious bug. The site will not work without. Try reloading with CTRL F5.");
	}
}
