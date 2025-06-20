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

				auto_predict_webcam_interval = setInterval(predict_webcam, 400);
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
			for (var i = 0; i < available_webcams.length; i++) {
				$("#which_webcam").append($("<option>", {
					value: i,
					text: available_webcams[i]
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

function create_video_element_and_append(webcam) {
	webcam.hide().html("");
	var videoElement = document.createElement("video");

	var w = 250;
	var h = 200;
	videoElement.id = "created_video_element";
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
