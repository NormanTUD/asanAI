class asanai {
	constructor () {
		var last_tested_tf_version = "4.11.0";
		var last_tested_jquery_version = "3.6.0";

		var tf_version;
		var jquery_version;

		try {
			tf_version = tf.version["tfjs-core"];
		} catch (e) {
			return this.err(e);	
		}

		try {
			jquery_version = jQuery().jquery;
		} catch (e) {
			return this.err(e);	
		}

		if(tf_version != last_tested_tf_version) {
			this.wrn(`Your tensorflow-version is ${tf_version}. The last tested one was ${last_tested_tf_version}`);
		}

		if(jquery_version != last_tested_jquery_version) {
			this.wrn(`Your jQuery-version is ${jquery_version}. The last tested one was ${last_tested_jquery_version}`);
		}

		this.tf_version = tf_version;
		this.jquery_version = jquery_version;
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
