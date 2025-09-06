async function show_webcam (force_restart) {
	if(force_restart) {
		stop_webcam();
	}

	await init_webcams();

	try {
		var stopped = 0;

		if(await input_shape_is_image()) {
			$("#show_webcam_button").html("<span class='large_button'><img src=\"_gui/icons/webcam.svg\" class=\"large_icon\" /><img src=\"_gui/icons/forbidden.svg\" class=\"large_icon\" /></span>");
			if(cam) {
				stop_webcam();
				stopped = 1;
				$(".only_when_webcam_on").hide();
			} else {
				var webcam = $("#webcam");
				// predict
				var video_element = create_video_element_and_append(webcam);
				force_stop_all_webcam_streams(video_element);

				cam_config = get_cam_config();

				if(await hasBothFrontAndBack()) {
					l(language[lang]["using_camera"] + "" + webcam_modes[webcam_id]);
					cam_config["video"]["facingMode"] = webcam_modes[webcam_id];
				} else {
					l(language[lang]["only_one_webcam"]);
				}

				var webcam_val = $("#which_webcam").val();
				var selected_webcam_id = 0;

				if (webcam_val !== null) {
					selected_webcam_id = parse_int(webcam_val);
				}

				var chosen_webcam_name = available_webcams[selected_webcam_id];
				var chosen_webcam_device_id = available_webcams_ids[selected_webcam_id];

				dbg(`show_webcam: Available webcams: ${available_webcams}. Chosen ID: ${selected_webcam_id}. Name: ${chosen_webcam_name}. Name: ${chosen_webcam_device_id}`);

				if(!cam_config.video.facingMode && available_webcams.length > 1) {
					cam_config["video"]["deviceId"] = chosen_webcam_device_id;
				}

				if(available_webcams.length > 1) {
					cam_config["video"]["deviceId"] = chosen_webcam_device_id;
				}

				//log(cam_config);
				cam = await tf_data_webcam(video_element, cam_config);

				auto_predict_webcam_interval = setInterval(predict_webcam, 200);
				$(".only_when_webcam_on").show();
			}
		} else {
			$("#webcam").hide().html("");
			if(cam) {
				cam.stop();
			}

			clearInterval(auto_predict_webcam_interval);
		}

		if(force_restart && stopped) {
			await show_webcam();
		}
	} catch (e) {
		err(e);
	}

	return cam;
}

async function switch_to_next_camera_predict () {
	webcam_id++;
	webcam_id = webcam_id % (webcam_modes.length);
	await show_webcam(1);
}

async function init_webcams () {
	if(inited_webcams) {
		return;
	}

	show_overlay(getCameraSearchHTML());

	taint_privacy();

	inited_webcams = true;
	l(language[lang]["checking_webcams"]);

	var available_webcam_data = await get_available_cams();
	available_webcams = available_webcam_data[0];
	available_webcams_ids = available_webcam_data[1];

	dbg("[init_webcams] Number of available cams: " + available_webcams.length);

	if(available_webcams.length) {
		dbg("[init_webcams] Webcam(s) were found. Enabling webcam related features.");
		dbg("[init_webcams] List of found webcams: " + available_webcams.join(", "));
		$(".only_when_webcam").show();

		if(await hasBothFrontAndBack()) {
			$(".only_when_front_and_back_camera").show();
		} else {
			$(".only_when_front_and_back_camera").hide();
		}

		if(available_webcams.length > 1) {
			$(".only_when_multiple_webcams").show();
			for (var webcam_idx = 0; webcam_idx < available_webcams.length; webcam_idx++) {
				$("#which_webcam").append($("<option>", {
					value: webcam_idx,
					text: available_webcams[webcam_idx]
				}));
			}
		} else {
			$(".only_when_multiple_webcams").hide();
		}
	} else {
		wrn("[init_webcams] No webcams were found. Disabling webcam related features.");
		$(".only_when_webcam").hide();
		$(".only_when_multiple_webcams").hide();
		$(".only_when_front_and_back_camera").hide();
	}

	remove_overlay();
}

function stop_webcam() {
	$("#show_webcam_button").html("<span class='show_webcam_button large_button'><img src=\"_gui/icons/webcam.svg\" class=\"large_icon\" /></span>");
	if (cam) {
		cam.stop();
	}
	$("#webcam").hide();
	$("#webcam_prediction").hide();
	cam = undefined;
}

function create_video_element_and_append(webcam, element_name = "created_video_element") {
	webcam.hide().html("");
	var videoElement = document.createElement("video");

	var w = 250;
	var h = 200;
	videoElement.id = element_name;
	videoElement.width = w;
	videoElement.height = h;
	videoElement.playsInline = true;
	videoElement.playsinline = true;
	videoElement.muted = true;
	videoElement.controls = true;
	videoElement.autoplay = true;
	webcam.show().append(videoElement);

	return videoElement;
}

async function restart_webcam_if_needed() {
	if(webcam_custom_data_started) {
		l(language[lang]["restarting_webcam"]);
		await wait_for_updated_page(1);
		await get_data_from_webcam();
		l(language[lang]["webcam_restarted"]);
	} else {
		dbg(language[lang]["webcam_restart_not_needed"]);
	}
}

function force_stop_all_webcam_streams(video_element) {
	if (video_element.srcObject) {
		let tracks = video_element.srcObject.getTracks();
		for (let track_idx = 0; track_idx < tracks.length; track_idx++) {
			try {
				tracks[track_idx].stop();
			} catch (err) {
				console.error("Error stopping track:", err);
			}
		}
		video_element.srcObject = null;
	}
}

async function get_data_from_webcam (force_restart) {
	if(!inited_webcams) {
		await init_webcams();
	}

	if(!available_webcams.length) {
		alert("No webcams found");
		return;
	}

	var stopped = 0;

	if(await input_shape_is_image(1)) {
		$("#show_webcam_button_data").html("Stop webcam");
		if(cam) {
			l(language[lang]["stopping_webcam"]);
			$("#webcam_start_stop").html(trm("enable_webcam"));
			await update_translations();

			$(".webcam_data_button").hide();
			$("#webcam_data").hide().html("");
			if(cam) {
				cam.stop();
				cam= null;
			}
			stopped = 1;

			webcam_custom_data_started = false;
		} else {
			l(language[lang]["starting_webcam"]);
			$("#webcam_start_stop").html(trm("disable_webcam"));
			await update_translations();

			var webcam = $("#webcam_data");
			// custom data
			var video_element = create_video_element_and_append(webcam);
			force_stop_all_webcam_streams(video_element);

			cam_config = {"video": {}};

			if(await hasBothFrontAndBack()) {
				l(language[lang]["using_camera"] + " " + webcam_modes[webcam_id]);
				cam_config["video"]["facingMode"] = webcam_modes[webcam_id];
			} else {
				l(language[lang]["only_one_webcam"]);
			}

			var webcam_val = $("#which_webcam").val();
			if(webcam_val === null) {
				webcam_val = 0;
			}

			var selected_webcam_id = parse_int(webcam_val);
			var chosen_webcam_name = available_webcams[selected_webcam_id];
			var chosen_webcam_device_id = available_webcams_ids[selected_webcam_id];

			dbg(`get_data_from_webcam: Available webcams: ${available_webcams}. Chosen ID: ${selected_webcam_id}. Name: ${chosen_webcam_name}. Name: ${chosen_webcam_device_id}`);

			if (chosen_webcam_device_id) {
				cam_config["video"] = { deviceId: { exact: chosen_webcam_device_id } };
			} else if (webcam_modes[webcam_id]) {
				cam_config["video"] = { facingMode: webcam_modes[webcam_id] };
			} else {
				cam_config["video"] = true;
			}

			cam = await tf_data_webcam(video_element, cam_config);

			if(cam) {
				dbg("get_data_from_webcam: cam was set");
			} else {
				dbg("get_data_from_webcam: cam SHOULD have been set but was not");
			}

			$(".webcam_data_button").show();

			webcam_custom_data_started = true;
		}
	} else {
		$(".webcam_data_button").hide();

		$("#webcam_data").hide().html("");
		if(cam) {
			cam.stop();
		}
	}

	if(force_restart && stopped) {
		await get_data_from_webcam();
	}

	await wait_for_updated_page(1);
}

