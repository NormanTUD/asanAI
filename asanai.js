class asanai {
	constructor () {
		var last_tested_tf_version = "4.11.0";
		var last_tested_jquery_version = "3.6.0";
		var last_tested_plotly_version = "2.14.0";

		this.tf_version = this.get_version(`tf.version["tfjs-core"]`, last_tested_tf_version, "tensorflow.js");
		this.jquery_version = this.get_version(`jQuery().jquery`, last_tested_jquery_version, "jQuery");
		this.plotly_version = this.get_version(`Plotly.version`, last_tested_plotly_version, "Plotly");
	}

	get_version (code, last_tested, name) {
		code = "try { " + code + "} catch (e) { if(Object.keys(e).includes('message')) { e = e.message }; err(e) }";
		try {
			var res = eval(code);
			if(res != last_tested) {
				this.wrn(`Your ${name}-version is ${res}, but the last tested one was ${last_tested}. Keep that in mind. It may result in errors.`);
			}
			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			throw new Error(e);
		}
	}

	wrn (...msgs) {
		var msg = "";
		for (var i = 0; i < msgs.length; i++) {
			if(Object.keys(msgs[i]).includes("message")) {
				msgs[i] = msgs[i].message;
			}

			console.warn(msgs[i]);
			msg = msg + "\n" + msgs[i];
		}

		return msg;
	}

	err (...msgs) {
		var msg = "";
		for (var i = 0; i < msgs.length; i++) {
			if(Object.keys(msgs[i]).includes("message")) {
				msgs[i] = msgs[i].message;
			}

			console.error(msgs[i]);
			msg = msg + "\n" + msgs[i];
		}

		return msg;
	}
}

//var a = new asanai();
