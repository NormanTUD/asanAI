"use strict";

function _updateWebcamButtonToStopped() {
	$("#show_webcam_button").html(`
		<span class="large_button" style="display:inline-block; position:relative; width:64px; height:64px;">
			<img src="_gui/camera.svg" style="width:100%; height:100%; display:block;">
			<img src="_gui/icons/forbidden.svg" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;">
		</span>
	`);
}

function _prepareVideoElement(webcam_container, element_name = "created_video_element") {
	webcam_container.hide().html("");
	var videoElement = create_video_element_and_append(webcam_container, element_name);
	return videoElement;
}

async function _getCameraConstraints() {
	let constraints = { video: true };

	const hasBoth = await hasBothFrontAndBack();
	const webcam_val = $("#which_webcam").val();
	let selected_webcam_id = 0;

	if (webcam_val !== null) {
		selected_webcam_id = parse_int(webcam_val);
	}

	const chosen_webcam_device_id = available_webcams_ids[selected_webcam_id];
	const chosen_webcam_name = available_webcams[selected_webcam_id];

	dbg(`_getCameraConstraints: Available webcams: ${available_webcams}. Chosen ID: ${selected_webcam_id}. Name: ${chosen_webcam_name}. Device ID: ${chosen_webcam_device_id}`);

	if (chosen_webcam_device_id) {
		constraints.video = { deviceId: { exact: chosen_webcam_device_id } };
	} else if (hasBoth) {
		constraints.video = { facingMode: webcam_modes[webcam_id] };
		l(language[lang]["using_camera"] + " " + webcam_modes[webcam_id]);
	} else {
		l(language[lang]["only_one_webcam"]);
	}

	return constraints;
}

async function _startStreamAndAssignToCam(video_element) {
	force_stop_all_webcam_streams(video_element);
	if (cam) stop_webcam();

	const constraints = await _getCameraConstraints();

	let stream = null;
	try {
		stream = await navigator.mediaDevices.getUserMedia(constraints);

		const camWrapper = {
			stream: stream,
			video: video_element,
			stop: function() {
				this.stream.getTracks().forEach(t => t.stop());
				this.video.srcObject = null;
			},
			capture: async function() {
				return await captureTensorViaTempVideo(this.stream, 4000);
			}
		};

		video_element.srcObject = stream;
		video_element.play();

		await waitForMetadataOrTimeout(video_element, 2000);

		window.cam = camWrapper;
		return window.cam;

	} catch (e) {
		err("Error starting webcam stream: " + e.message);
		window.cam = null;
		return null;
	}
}

async function _startWebcamPredictionStream() {
	const webcam = $("#webcam");
	const video_element = _prepareVideoElement(webcam);

	window.cam = await _startStreamAndAssignToCam(video_element);

	if (window.cam) {
		webcam.show();
		auto_predict_webcam_interval = setInterval(predict_webcam, 200);
		$(".only_when_webcam_on").show();
		return 0;
	} else {
		return 1;
	}
}

function _stopWebcamPredictionStream() {
	stop_webcam();
	$(".only_when_webcam_on").hide();
	return 1;
}

async function _startWebcamDataStream(video_element) {
	l(language[lang]["starting_webcam"]);
	$("#webcam_start_stop").html(trm("disable_webcam"));
	await update_translations();

	window.cam = await _startStreamAndAssignToCam(video_element);

	if (window.cam) {
		dbg("get_data_from_webcam: cam was set");
		$("#webcam_data").show();
	} else {
		dbg("get_data_from_webcam: cam SHOULD have been set but was not");
		l(language[lang]["error_starting_webcam"]);
		$("#webcam_start_stop").html(trm("enable_webcam"));
		await update_translations();
		return;
	}

	$(".webcam_data_button").show();
	webcam_custom_data_started = true;
}

function _stopWebcamDataStream() {
	l(language[lang]["stopping_webcam"]);
	$("#webcam_start_stop").html(trm("enable_webcam"));
	update_translations(); // await not possible

	$(".webcam_data_button").hide();
	$("#webcam_data").hide().html("");
	if (cam) {
		cam.stop();
		window.cam = null;
	}
	webcam_custom_data_started = false;
	return 1;
}

async function _configureWebcamUI(available_webcams_list) {
	dbg("[init_webcams] Number of available cams: " + available_webcams_list.length);

	if (available_webcams_list.length) {
		dbg("[init_webcams] Webcam(s) were found. Enabling webcam related features.");
		dbg("[init_webcams] List of found webcams: " + available_webcams_list.join(", "));
		$(".only_when_webcam").show();

		if (await hasBothFrontAndBack()) {
			$(".only_when_front_and_back_camera").show();
		} else {
			$(".only_when_front_and_back_camera").hide();
		}

		if (available_webcams_list.length > 1) {
			$(".only_when_multiple_webcams").show();
			$("#which_webcam").empty();
			for (let webcam_idx = 0; webcam_idx < available_webcams_list.length; webcam_idx++) {
				$("#which_webcam").append($("<option>", {
					value: webcam_idx,
					text: available_webcams_list[webcam_idx]
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
}

async function _captureAndProcessWebcamImage(elem, nol, _enable_train_and_last_layer_shape_warning) {
	if (!nol) l(language[lang]["taking_photo_from_webcam"]);

	let capturedTensor = await getValidTensorFromCamStream(cam);
	if (!capturedTensor) {
		if (!nol) l(language[lang]["error_taking_photo"]);
		return;
	}

	let maxSize = 200;
	let [canvasWidth, canvasHeight] = computeCanvasSizeFromTensor(capturedTensor, maxSize);

	let resizedTensor = capturedTensor;
	try {
		resizedTensor = resize_image(capturedTensor, [capturedTensor.shape[0], capturedTensor.shape[1]]);
	} catch (e) {
		resizedTensor = capturedTensor;
	}

	const expandedTensor = expand_dims(resizedTensor);
	const floatTensor = tf_to_float(expandedTensor);
	const arrayResult = array_sync(floatTensor);
	const cam_image = arrayResult[0];

	await dispose(capturedTensor);
	await dispose(resizedTensor);
	await dispose(expandedTensor);
	await dispose(floatTensor);

	const category = $(elem).parent();
	const category_name = $(category).find(".own_image_label").val();
	const base_id = await md5(category_name);
	let i = 1;
	let id = base_id + "_" + i;
	while (document.getElementById(id + "_canvas")) { i++; id = base_id + "_" + i; }

	const canvas = insertCanvasIntoCategory(elem, category_name, id, canvasWidth, canvasHeight);

	if (cam_image && cam_image.length && cam_image[0] && cam_image[0].length) {
		if (canvasWidth === cam_image[0].length && canvasHeight === cam_image.length) {
			putArrayImageToCanvas(canvas, cam_image);
		} else {
			const tempCanvas = document.createElement("canvas");
			tempCanvas.width = cam_image[0].length;
			tempCanvas.height = cam_image.length;
			putArrayImageToCanvas(tempCanvas, cam_image);
			const ctx = canvas.getContext("2d");
			ctx.drawImage(tempCanvas, 0, 0, canvasWidth, canvasHeight);
		}
	}

	if (_enable_train_and_last_layer_shape_warning) enable_train();
	if (!nol) l(language[lang]["took_photo_from_webcam"]);

	got_images_from_webcam = true;
}

async function show_webcam(force_restart = 0) {
	if (force_restart) {
		stop_webcam();
	}

	await init_webcams();

	try {
		let stopped = 0;

		if (input_shape_is_image()) {
			if (cam) {
				_updateWebcamButtonToStopped();
				stopped = _stopWebcamPredictionStream();
			} else {
				stopped = await _startWebcamPredictionStream();
			}
		} else {
			$("#webcam").hide().html("");
			if (cam) {
				cam.stop();
			}
			clearInterval(auto_predict_webcam_interval);
		}

		if (force_restart && stopped) {
			await show_webcam();
		}
	} catch (e) {
		err(e);
	}

	return cam;
}

async function switch_to_next_camera_predict() {
	webcam_id++;
	webcam_id = webcam_id % (webcam_modes.length);
	await show_webcam(1);
}

async function init_webcams() {
	if (inited_webcams) {
		return;
	}

	show_overlay(getCameraSearchHTML());
	taint_privacy();

	inited_webcams = true;
	l(language[lang]["checking_webcams"]);

	const available_webcam_data = await get_available_cams();
	available_webcams = available_webcam_data[0];
	available_webcams_ids = available_webcam_data[1];

	await _configureWebcamUI(available_webcams);

	remove_overlay();
}

function stop_webcam() {
	$("#show_webcam_button").html("<span class='show_webcam_button large_button'><img src=\"_gui/camera.svg\" class=\"large_icon\" /></span>");
	if (cam) {
		cam.stop();
	}
	$("#webcam").hide();
	$("#webcam_prediction").hide();
	window.cam = undefined;
	clearInterval(auto_predict_webcam_interval);
}

function create_video_element_and_append(webcam, element_name = "created_video_element") {
	var videoElement = document.createElement("video");

	videoElement.id = element_name;
	videoElement.playsInline = true;
	videoElement.playsinline = true;
	videoElement.muted = true;
	videoElement.controls = true;
	videoElement.autoplay = true;
	webcam.show().append(videoElement);

	return videoElement;
}

async function restart_webcam_if_needed() {
	if (webcam_custom_data_started) {
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
			} catch (_err) {
				err("Error stopping track:", _err);
			}
		}
		video_element.srcObject = null;
	}
}

async function get_data_from_webcam(force_restart = 0) {
	if (!inited_webcams) {
		await init_webcams();
	}

	if (!available_webcams.length) {
		err("No webcams found");
		return;
	}

	let stopped = 0;

	if (input_shape_is_image(1)) {
		$("#show_webcam_button_data").html("Stop webcam");
		if (cam) {
			stopped = _stopWebcamDataStream();
		} else {
			const webcam = $("#webcam_data");
			const video_element = _prepareVideoElement(webcam);
			await _startWebcamDataStream(video_element);
		}
	} else {
		$(".webcam_data_button").hide();
		$("#webcam_data").hide().html("");
		if (cam) {
			cam.stop();
		}
	}

	if (force_restart && stopped) {
		await get_data_from_webcam();
	}

	await wait_for_updated_page(1);
}

async function tryApplyTrackConstraints(track, constraints) {
	let result = null;
	try {
		result = await track.applyConstraints(constraints);
	} catch (e) {
		result = null;
	}
	return result;
}

function createVisibleTempVideo(stream) {
	let video = document.createElement("video");
	video.srcObject = stream;
	video.autoplay = true;
	video.muted = true;
	video.playsInline = true; 
	video.setAttribute("playsinline", "true"); 

	video.style.position = "fixed";
	video.style.left = "-9999px"; 
	video.style.top = "-9999px"; 
	video.style.width = "1px"; 
	video.style.height = "1px"; 
	video.style.opacity = "0"; 
	video.style.zIndex = "-1000"; 
	video.style.pointerEvents = "none";

	video.style.background = "black";
	video.style.transform = "translateZ(0)";
	document.body.appendChild(video);
	return video;
}

async function ensurePlaybackStarted(video) {
	try {
		await video.play();
	} catch (e) {
	}
}

async function waitForMetadataOrTimeout(video, timeoutMs) {
	let resolved = false;
	await new Promise(function (resolve) {
		function internal_done() {
			if (!resolved) { resolved = true; resolve(); }
		}
		if (video.readyState >= 1) {
			internal_done();
			return;
		}
		video.onloadedmetadata = function () { internal_done(); };
		setTimeout(internal_done, timeoutMs);
	});
}

async function waitForCompositedFrameWithRVFC(video, tempCanvas, deadlineTime) {
	let capturedTensor = null;
	await new Promise(function (resolve) {
		let resolved = false;
		function frameCallback(now, metadata) {
			try {
				if (metadata && metadata.height && metadata.width) {
					tempCanvas.width = metadata.width;
					tempCanvas.height = metadata.height;
				} else {
					tempCanvas.width = video.videoWidth || tempCanvas.width;
					tempCanvas.height = video.videoHeight || tempCanvas.height;
				}
				try {
					tempCanvas.getContext("2d").drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
				} catch (drawErr) {
				}
			} catch (metaErr) {
			}
			tf.browser.fromPixelsAsync(tempCanvas).then(function (tensor) {
				if (tensor && tensor.shape && tensor.shape[0] > 1 && tensor.shape[1] > 1) {
					capturedTensor = tensor;
					if (!resolved) { resolved = true; resolve(); }
					return;
				}
				try {
					dispose(tensor); // await not possible
				} catch (d) { }
				if (performance.now() < deadlineTime) {
					try { video.requestVideoFrameCallback(frameCallback); } catch (e) {}
				} else {
					if (!resolved) { resolved = true; resolve(); }
				}
			}).catch(function () {
				if (performance.now() < deadlineTime) {
					try { video.requestVideoFrameCallback(frameCallback); } catch (e) {}
				} else {
					if (!resolved) { resolved = true; resolve(); }
				}
			});
		}
		try {
			video.requestVideoFrameCallback(frameCallback);
		} catch (startErr) {
			if (!resolved) { resolved = true; resolve(); }
		}
		setTimeout(function () { if (!resolved) { resolved = true; resolve(); } }, Math.max(0, deadlineTime - performance.now()) + 50);
	});
	return capturedTensor;
}

async function waitForCompositedFrameWithRAF(video, tempCanvas, deadlineTime) {
	let capturedTensor = null;
	while (performance.now() < deadlineTime && !capturedTensor) {
		await new Promise(r => requestAnimationFrame(r));
		let width = video.videoWidth || tempCanvas.width;
		let height = video.videoHeight || tempCanvas.height;
		if (width < 2 || height < 2) continue;
		tempCanvas.width = width;
		tempCanvas.height = height;
		try {
			tempCanvas.getContext("2d").drawImage(video, 0, 0, width, height);
		} catch (drawErr) {
			continue;
		}
		try {
			let t = await tf.browser.fromPixelsAsync(tempCanvas);
			if (t && t.shape && t.shape.length === 3 && t.shape[0] > 1 && t.shape[1] > 1) {
				capturedTensor = t;
				break;
			} else {
				await dispose(t);
			}
		} catch (e) {
		}
	}
	return capturedTensor;
}

async function captureTensorViaTempVideo(stream, timeoutMs) {
	let tempVideo = createVisibleTempVideo(stream);
	await ensurePlaybackStarted(tempVideo);
	await waitForMetadataOrTimeout(tempVideo, 2000);
	let tentativeWidth = tempVideo.videoWidth || 640;
	let tentativeHeight = tempVideo.videoHeight || 480;
	let tempCanvas = document.createElement("canvas");
	tempCanvas.width = tentativeWidth;
	tempCanvas.height = tentativeHeight;
	let deadlineTime = performance.now() + timeoutMs;
	let tensor = null;
	if (typeof tempVideo.requestVideoFrameCallback === "function") {
		tensor = await waitForCompositedFrameWithRVFC(tempVideo, tempCanvas, deadlineTime);
	} else {
		tensor = await waitForCompositedFrameWithRAF(tempVideo, tempCanvas, deadlineTime);
	}

	try {
		tempVideo.pause();
		tempVideo.srcObject = null;
		if (tempVideo.parentNode) tempVideo.parentNode.removeChild(tempVideo);
	} catch (cleanupErr) {
	}
	return tensor;
}

async function _captureTensorFromActiveVideo(videoElement) {
	let tempCanvas = document.createElement("canvas");
	let width = videoElement.videoWidth || 640;
	let height = videoElement.videoHeight || 480;

	if (width < 2 || height < 2) return null;

	tempCanvas.width = width;
	tempCanvas.height = height;

	try {
		tempCanvas.getContext("2d").drawImage(videoElement, 0, 0, width, height);
		let tensor = await tf.browser.fromPixelsAsync(tempCanvas);

		if (tensor && tensor.shape && tensor.shape[0] > 1 && tensor.shape[1] > 1) {
			return tensor;
		} else {
			await dispose(tensor);
			return null;
		}
	} catch (e) {
		err("Canvas capture failed:", e);
		return null;
	}
}

async function getValidTensorFromCamStream(cam) {
	if (!cam || !cam.stream) return null;

	let tensor = await _captureTensorFromActiveVideo(cam.video);
	if (tensor) return tensor;

	let track = cam.stream.getVideoTracks()[0];
	let settings = {};
	try { settings = track.getSettings(); } catch (e) { settings = {}; }
	let width = settings.width;
	let height = settings.height;

	try { await tryApplyTrackConstraints(track, { width: { ideal: 1280 }, height: { ideal: 720 } }); } catch (e) { }

	if (!width || !height || width < 2 || height < 2) {
		tensor = await captureTensorViaTempVideo(cam.stream, 4000);
	}

	if (!tensor) {
		try {
			let direct = await cam.capture();
			if (direct && direct.shape && direct.shape.length === 3 && direct.shape[0] > 1 && direct.shape[1] > 1) {
				tensor = direct;
			} else {
				await dispose(direct);
			}
		} catch (e) {
			tensor = null;
		}
	}
	return tensor;
}

function computeCanvasSizeFromTensor(tensor, maxSize) {
	let height = tensor.shape[0];
	let width = tensor.shape[1];
	if (!maxSize) return [width, height];
	if (width <= maxSize && height <= maxSize) return [width, height];
	let ratio = Math.min(maxSize / width, maxSize / height);
	return [Math.round(width * ratio), Math.round(height * ratio)];
}

function insertCanvasIntoCategory(elem, categoryName, id, width, height) {
	let category = $(elem).parent();
	let container = $(category).find(".own_images")[0];
	let wrapper = document.createElement("div");
	wrapper.className = "own_image_span";
	wrapper.style.display = "block";
	wrapper.style.marginBottom = "8px";
	let canvas = document.createElement("canvas");
	canvas.dataset.category = categoryName;
	canvas.id = id + "_canvas";
	canvas.width = width;
	canvas.height = height;
	canvas.classList.add("webcam_series_image");
	canvas.classList.add("webcam_series_image_category_" + id);
	let del = document.createElement("span");
	del.innerHTML = "&#10060;&nbsp;&nbsp;&nbsp;";
	del.onclick = function () { delete_own_image(del); };
	wrapper.appendChild(canvas);
	wrapper.appendChild(del);
	container.insertBefore(wrapper, container.firstChild);
	return canvas;
}

function putArrayImageToCanvas(canvas, cam_image) {
	let ctx = canvas.getContext("2d");
	let h = cam_image.length;
	let w = cam_image[0].length;
	let imageData = ctx.createImageData(w, h);
	let data = imageData.data;
	let p = 0;
	for (let x = 0; x < h; x++) {
		let row = cam_image[x];
		for (let y = 0; y < w; y++) {
			let triple = row[y];
			let r = triple[0];
			let g = triple[1];
			let b = triple[2];
			data[p++] = r | 0;
			data[p++] = g | 0;
			data[p++] = b | 0;
			data[p++] = 255;
		}
	}
	ctx.putImageData(imageData, 0, 0);
}

async function take_image_from_webcam(elem, nol = false, _enable_train_and_last_layer_shape_warning = true) {
	try {
		typeassert(elem, object, "elem");
		if (!inited_webcams) await get_data_from_webcam();
		if (!cam) { await set_custom_webcam_training_data(); await show_webcam(1); }

		await _captureAndProcessWebcamImage(elem, nol, _enable_train_and_last_layer_shape_warning);

	} catch (err) {
		try { if (!nol) l(language[lang]["error_taking_photo"]); } catch (e) { }
	}
}

async function show_countdown_modal({ title, html, duration_ms }) {
	return new Promise(resolve => {
		const overlay = document.createElement("div");
		const modal = document.createElement("div");
		const title_el = document.createElement("div");
		const content_el = document.createElement("div");
		const progress = document.createElement("div");
		const progress_bar = document.createElement("div");

		overlay.style.cssText = `
	    position: fixed;
	    inset: 0;
	    background: rgba(0,0,0,0.6);
	    display: flex;
	    align-items: center;
	    justify-content: center;
	    z-index: 9999;
	`;

		modal.style.cssText = `
	    background: #111;
	    color: #eee;
	    padding: 20px 24px;
	    min-width: 320px;
	    border-radius: 8px;
	    font-family: sans-serif;
	`;

		title_el.style.cssText = `
	    font-size: 18px;
	    margin-bottom: 10px;
	`;

		content_el.style.cssText = `
	    margin-bottom: 14px;
	`;

		progress.style.cssText = `
	    height: 6px;
	    background: #333;
	    border-radius: 3px;
	    overflow: hidden;
	`;

		progress_bar.style.cssText = `
	    height: 100%;
	    width: 100%;
	    background: #4caf50;
	    transition: width 0.1s linear;
	`;

		title_el.textContent = title;
		content_el.innerHTML = html;

		progress.appendChild(progress_bar);
		modal.appendChild(title_el);
		modal.appendChild(content_el);
		modal.appendChild(progress);
		overlay.appendChild(modal);
		document.body.appendChild(overlay);

		const start = performance.now();
		const end = start + duration_ms;

		const b = content_el.querySelector("b");

		const interval = setInterval(() => {
			const now = performance.now();
			const left = Math.max(0, end - now);
			const frac = left / duration_ms;

			if (b) {
				b.textContent = (left / 1000).toFixed(1);
			}

			progress_bar.style.width = `${frac * 100}%`;

			if (left <= 0) {
				clearInterval(interval);
				overlay.remove();
				resolve();
			}
		}, 100);
	});
}

async function take_image_from_webcam_n_times(elem) {
	const number = parse_int($("#number_of_series_images").val());
	const delaybetween = parse_int($("#delay_between_images_in_series").val()) * 1000;

	dbg(`take_image_from_webcam_n_times: n=${number}, delay=${delaybetween}`);

	let timerInterval;

	const params = {
		title: language[lang]["soon_a_photo_series_will_start"],
		html: language[lang]["first_photo_will_be_taken_in_n_seconds"],
		duration_ms: 2000
	}

	await show_countdown_modal(params);

	for (let idx = 0; idx < number; idx++) {
		const msg = sprintf(language[lang]["taking_image_n_of_m"], idx + 1, number);
		log(msg); l(msg);

		dbg("Updating translations");
		await update_translations();

		dbg("Taking next image");
		await take_image_from_webcam(elem, true, false);

		dbg(`Waiting ${delaybetween} ms`);
		await delay(delaybetween);
	}

	await last_shape_layer_warning();
	enable_train();
	l(sprintf(language[lang]["done_taking_n_images"], number));
}
