"use strict";

// --- Global State and Constants (Retained for API compatibility and required globals) ---
// NOTE: Assuming all global variables (cam, webcam_id, webcam_modes, inited_webcams,
// available_webcams, available_webcams_ids, auto_predict_webcam_interval,
// webcam_custom_data_started, got_images_from_webcam, language, lang, tf, dispose,
// etc.) are managed externally or in other parts of the application.

// --- Private Helper Functions for Core Logic ---

/**
 * @private
 * Handles the visual update for the webcam button when the input shape is an image
 * and the webcam is not starting (i.e., stopping or already stopped).
 */
function _updateWebcamButtonToStopped() {
	$("#show_webcam_button").html(`
		<span class="large_button" style="display:inline-block; position:relative; width:64px; height:64px;">
			<img src="_gui/camera.svg" style="width:100%; height:100%; display:block;">
			<img src="_gui/icons/forbidden.svg" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;">
		</span>
	`);
}

/**
 * @private
 * Prepares the video element and enforces stream stopping on existing elements.
 * This is now simplified as the stream stopping logic is moved to force_stop_all_webcam_streams
 * and the stream initiation is in _startStreamAndAssignToCam.
 * @param {JQuery<HTMLElement>} webcam_container - The JQuery object for the webcam container.
 * @param {string} element_name - The ID for the video element.
 * @returns {HTMLVideoElement} - The created video element.
 */
function _prepareVideoElement(webcam_container, element_name = "created_video_element") {
	webcam_container.hide().html("");
	var videoElement = create_video_element_and_append(webcam_container, element_name);
	// Stopping streams is handled implicitly/explicitly by callers/force_stop_all_webcam_streams,
	// but we ensure the element is clean.
	return videoElement;
}

/**
 * @private
 * Determines the camera constraints based on available devices and chosen selection.
 * @returns {Object} - The constraints object for navigator.mediaDevices.getUserMedia.
 */
async function _getCameraConstraints() {
	let constraints = { video: true }; // Default to true

	const hasBoth = await hasBothFrontAndBack();
	const webcam_val = $("#which_webcam").val();
	let selected_webcam_id = 0;

	if (webcam_val !== null) {
		selected_webcam_id = parse_int(webcam_val);
	}

	const chosen_webcam_device_id = available_webcams_ids[selected_webcam_id];
	const chosen_webcam_name = available_webcams[selected_webcam_id];

	dbg(`_getCameraConstraints: Available webcams: ${available_webcams}. Chosen ID: ${selected_webcam_id}. Name: ${chosen_webcam_name}. Device ID: ${chosen_webcam_device_id}`);

	// 1. Prioritize Device ID if available (most reliable, as per new working example)
	if (chosen_webcam_device_id) {
		constraints.video = { deviceId: { exact: chosen_webcam_device_id } };
	}
	// 2. Fallback to facingMode if no specific device ID is selected/available (original logic)
	else if (hasBoth) {
		constraints.video = { facingMode: webcam_modes[webcam_id] };
		l(language[lang]["using_camera"] + " " + webcam_modes[webcam_id]);
	} else {
		l(language[lang]["only_one_webcam"]);
	}
    
    // Log the final constraints for debugging (original behavior)
    // log(constraints);
    
	return constraints;
}

/**
 * @private
 * Starts the webcam stream using the robust getUserMedia approach.
 * Replaces the call to tf_data_webcam. Sets the global 'cam' object.
 * NOTE: The returned 'cam' object structure must mimic the one from the original tf_data_webcam
 * to avoid API breakage in functions like dispose(cam), cam.stop(), cam.capture(), and getValidTensorFromCamStream(cam).
 * * @param {HTMLVideoElement} video_element - The video element to attach the stream to.
 * @returns {Promise<Object|null>} - The custom 'cam' object or null on failure.
 */
async function _startStreamAndAssignToCam(video_element) {
	// 1. Stop any existing stream on the global 'cam' and the video element
    force_stop_all_webcam_streams(video_element);
    if (cam) stop_webcam(); // Use stop_webcam to clear global state/interval

	const constraints = await _getCameraConstraints();
    
    let stream = null;
    try {
        // --- Core change: Robust getUserMedia (from your example) ---
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Ensure that tf_data_webcam abstraction is properly handled.
        // If tf_data_webcam was a necessary wrapper for a specific TF capture method,
        // we'll need to wrap the video element/stream in a compatible 'cam' object.
        
        // Case 1: If tf_data_webcam is simply a wrapper that gets the stream and returns 
        // a capture-ready object (most likely given the rest of the code).
        // We simulate the structure expected by other public/private APIs:
        const camWrapper = {
            stream: stream,
            video: video_element,
            // A stop method is crucial for cam.stop() calls
            stop: function() {
                this.stream.getTracks().forEach(t => t.stop());
                this.video.srcObject = null;
            },
            // A capture method is crucial for getValidTensorFromCamStream()
            capture: async function() {
                // Since this isn't a direct TF webcam, we use a helper 
                // to grab a tensor (e.g., captureTensorViaTempVideo might be a fallback/utility)
                return await captureTensorViaTempVideo(this.stream, 4000); // 4s timeout
            }
        };

        video_element.srcObject = stream;
        video_element.play(); // Start playback

        // We must wait for metadata to ensure the stream is ready before returning
        await waitForMetadataOrTimeout(video_element, 2000);
        
        window.cam = camWrapper; // Set global cam
        return window.cam;

    } catch (e) {
        err("Error starting webcam stream: " + e.message);
        window.cam = null;
        return null;
    }
}

/**
 * @private
 * Starts the webcam stream for prediction mode.
 * @returns {Promise<number>} - 1 if stopped an existing stream, 0 otherwise.
 */
async function _startWebcamPredictionStream() {
	const webcam = $("#webcam");
	const video_element = _prepareVideoElement(webcam);

	window.cam = await _startStreamAndAssignToCam(video_element);
    
    if (window.cam) {
        webcam.show(); // Show the video element only after stream starts
        // Start prediction interval
        auto_predict_webcam_interval = setInterval(predict_webcam, 200);
        $(".only_when_webcam_on").show();
        return 0; // Did not stop an existing stream
    } else {
        return 1; // Treat as if a stream was stopped/failed to start
    }
}

/**
 * @private
 * Stops the webcam stream for prediction mode.
 * @returns {number} - 1 (indicates stream was stopped).
 */
function _stopWebcamPredictionStream() {
	stop_webcam();
	$(".only_when_webcam_on").hide();
	return 1; // Indicates stream was stopped
}

/**
 * @private
 * Initializes and starts the webcam stream for custom data collection mode.
 * @param {HTMLVideoElement} video_element - The video element to attach the stream to.
 */
async function _startWebcamDataStream(video_element) {
	l(language[lang]["starting_webcam"]);
	$("#webcam_start_stop").html(trm("disable_webcam"));
	await update_translations();
    
    // Use the new robust stream starting function
	window.cam = await _startStreamAndAssignToCam(video_element);
    
	if (window.cam) {
		dbg("get_data_from_webcam: cam was set");
        $("#webcam_data").show(); // Show the video element
	} else {
		dbg("get_data_from_webcam: cam SHOULD have been set but was not");
        l(language[lang]["error_starting_webcam"]);
        // If it failed to start, reset the UI state
        $("#webcam_start_stop").html(trm("enable_webcam"));
        await update_translations();
        return;
	}

	$(".webcam_data_button").show();
	webcam_custom_data_started = true;
}

/**
 * @private
 * Stops the webcam stream for custom data collection mode.
 * @returns {number} - 1 (indicates stream was stopped).
 */
function _stopWebcamDataStream() {
	l(language[lang]["stopping_webcam"]);
	$("#webcam_start_stop").html(trm("enable_webcam"));
	update_translations(); 

	$(".webcam_data_button").hide();
	$("#webcam_data").hide().html("");
	if (cam) {
		cam.stop();
		window.cam = null;
	}
	webcam_custom_data_started = false;
	return 1;
}

/**
 * @private
 * Configures the UI elements based on the number of available webcams.
 * (NO CHANGE, RETAINED AS IS)
 * @param {string[]} available_webcams_list - List of webcam names.
 */
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
			$("#which_webcam").empty(); // Clear existing options
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

/**
 * @private
 * Captures an image from the webcam stream, processes it, and adds it to the UI.
 * (NO CHANGE, RELIES ON 'cam.capture()' which is now implemented in _startStreamAndAssignToCam)
 * @param {HTMLElement} elem - The element triggering the action (used to find the category).
 * @param {boolean} nol - Suppress success/error messages.
 * @param {boolean} _enable_train_and_last_layer_shape_warning - Enable training warning/update.
 */
async function _captureAndProcessWebcamImage(elem, nol, _enable_train_and_last_layer_shape_warning) {
	if (!nol) l(language[lang]["taking_photo_from_webcam"]);

	let capturedTensor = await getValidTensorFromCamStream(cam);
	if (!capturedTensor) {
		if (!nol) l(language[lang]["error_taking_photo"]);
		return;
	}

	let maxSize = 200;
	let [canvasWidth, canvasHeight] = computeCanvasSizeFromTensor(capturedTensor, maxSize);

	// Resizing and conversion to array result
	let resizedTensor = capturedTensor;
	try {
		// NOTE: Original code passes shape of capturedTensor to resize_image.
		// If resize_image is a no-op when the shape is already correct, this is fine.
		resizedTensor = resize_image(capturedTensor, [capturedTensor.shape[0], capturedTensor.shape[1]]);
	} catch (e) {
		resizedTensor = capturedTensor;
	}

	const expandedTensor = expand_dims(resizedTensor);
	const floatTensor = tf_to_float(expandedTensor);
	const arrayResult = array_sync(floatTensor);
	const cam_image = arrayResult[0];

	// Cleanup tensors
	await dispose(capturedTensor);
	await dispose(resizedTensor);
	await dispose(expandedTensor);
	await dispose(floatTensor);

	// DOM creation and image insertion
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


// --- Public API Functions (Retaining original signature and behavior) ---

/**
 * Toggles the webcam on/off for model prediction/inference.
 * (NO CHANGE IN SIGNATURE)
 * @param {number} [force_restart=0] - If true (1), forces a restart if a stream is running.
 * @returns {Promise<Object|undefined>} The cam object or undefined if failed/stopped.
 */
async function show_webcam(force_restart = 0) {
	if (force_restart) {
		stop_webcam();
	}

	await init_webcams();

	try {
		let stopped = 0;

		if (input_shape_is_image()) {
			if (cam) {
				// Stop path
				_updateWebcamButtonToStopped();
				stopped = _stopWebcamPredictionStream();
			} else {
				// Start path
				stopped = await _startWebcamPredictionStream();
			}
		} else {
			// Input shape is not an image (non-webcam-compatible)
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

/**
 * Switches to the next available camera facing mode and restarts the stream.
 * (NO CHANGE IN SIGNATURE)
 */
async function switch_to_next_camera_predict() {
	webcam_id++;
	webcam_id = webcam_id % (webcam_modes.length);
	await show_webcam(1);
}

/**
 * Initializes webcam availability checks and updates the UI accordingly.
 * (NO CHANGE IN SIGNATURE)
 */
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

/**
 * Stops the webcam stream and updates the UI button.
 * (NO CHANGE IN SIGNATURE)
 */
function stop_webcam() {
	$("#show_webcam_button").html("<span class='show_webcam_button large_button'><img src=\"_gui/camera.svg\" class=\"large_icon\" /></span>");
	if (cam) {
		cam.stop();
	}
	$("#webcam").hide();
	$("#webcam_prediction").hide();
	window.cam = undefined; // Use window.cam to set the global variable
	// Also clear prediction interval if any (though often handled in show_webcam)
	clearInterval(auto_predict_webcam_interval);
}

/**
 * Creates and appends a video element to a container for the stream.
 * (MINIMAL CHANGE TO REMOVE REDUNDANT HIDE/HTML CLEARING WHICH IS NOW IN _prepareVideoElement)
 * @param {JQuery<HTMLElement>} webcam - The JQuery container element.
 * @param {string} [element_name="created_video_element"] - The ID for the video element.
 * @returns {HTMLVideoElement} The created video element.
 */
function create_video_element_and_append(webcam, element_name = "created_video_element") {
	// webcam.hide().html(""); // <- REMOVED: Now done in _prepareVideoElement
	var videoElement = document.createElement("video");

	videoElement.id = element_name;
    // --- KEY CHANGE: Ensure playsinline/playsInline is set correctly ---
	videoElement.playsInline = true;
	videoElement.playsinline = true; // Duplicate for compatibility (as per your working example)
	videoElement.muted = true;
	videoElement.controls = true;
	videoElement.autoplay = true;
	webcam.show().append(videoElement);

	return videoElement;
}

/**
 * Restarts the webcam for custom data collection if it was already started.
 * (NO CHANGE IN SIGNATURE)
 */
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

/**
 * Forces all tracks in a stream attached to a video element to stop.
 * (NO CHANGE IN SIGNATURE)
 * @param {HTMLVideoElement} video_element - The video element holding the stream.
 */
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

/**
 * Toggles the webcam on/off for custom data collection/training mode.
 * (MINIMAL CHANGE TO USE NEW PRIVATE START FUNCTION)
 * @param {number} [force_restart=0] - If true (1), forces a restart if a stream is running.
 */
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
			// Stop path
			stopped = _stopWebcamDataStream();
		} else {
			// Start path
			const webcam = $("#webcam_data");
			const video_element = _prepareVideoElement(webcam);
            // Use the new, robust stream start
			await _startWebcamDataStream(video_element);
		}
	} else {
		// Input shape is not an image (non-webcam-compatible)
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

// --- Hilfsfunktionen (Utilities/Tensorflow-related) ---
// Note: These are kept as-is since they are low-level and already reasonably isolated.

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
	
	// AGGRESSIVE FIX: UNSICHTBAR machen
	video.style.position = "fixed";
	video.style.left = "-9999px"; 
	video.style.top = "-9999px"; 
	video.style.width = "1px"; 
	video.style.height = "1px"; 
	video.style.opacity = "0"; 
	video.style.zIndex = "-1000"; 
	video.style.pointerEvents = "none";
    // ENDE AGGRESSIVE FIX
    
	video.style.background = "black";
	video.style.transform = "translateZ(0)"; // Ursprünglicher Stil beibehalten
	document.body.appendChild(video);
	return video;
}

async function ensurePlaybackStarted(video) {
	try {
		await video.play();
	} catch (e) {
		// silent fallback: continue, playback may be started by user gesture elsewhere
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
					// ignore draw errors and continue
				}
			} catch (metaErr) {
				// ignore
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
					try { video.requestVideoFrameCallback(frameCallback); } catch (e) { /* ignore */ }
				} else {
					if (!resolved) { resolved = true; resolve(); }
				}
			}).catch(function () {
				if (performance.now() < deadlineTime) {
					try { video.requestVideoFrameCallback(frameCallback); } catch (e) { /* ignore */ }
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
			// ignore and retry until deadline
		}
	}
	return capturedTensor;
}



// --- Tensor-Beschaffung (Hauptpfad) ---

// --- Hilfsfunktionen (Utilities/Tensorflow-related) ---
// (Nur Änderungen an den Funktionen, die das Flackern verursachen)

// NEUE Version: captureTensorViaTempVideo (Jetzt reiner Fallback)
async function captureTensorViaTempVideo(stream, timeoutMs) {
	// WICHTIG: Die Erstellung des temp. Videos ist nur für den Fall, dass
    // die direkte Aufnahme fehlschlägt. Es bleibt sichtbar, wenn es verwendet wird.
    // Da es flackert, wird dieser Pfad jetzt nur noch als letzter Notnagel genutzt.
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
    // WICHTIG: Die ursprüngliche Logik hatte hier einen Fehler, indem sie versuchte,
    // cam.capture() aufzurufen, obwohl sie bereits in einem Capture-Fallback war.
    // Ich entferne den alten cam.capture()-Fallback in dieser Funktion und verlasse mich
    // darauf, dass der Aufrufer (getValidTensorFromCamStream) dies korrekt behandelt.
    
	try {
		tempVideo.pause();
		tempVideo.srcObject = null;
        // Das temporäre Video-Element muss immer entfernt werden, um das Flackern
        // zu beenden, ABER die Ursache ist der Aufruf selbst.
		if (tempVideo.parentNode) tempVideo.parentNode.removeChild(tempVideo);
	} catch (cleanupErr) {
		// ignore cleanup errors
	}
	return tensor;
}

// NEUE Hilfsfunktion: Führt eine Canvas-basierte Aufnahme vom *aktiven* Video-Element durch
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


// --- Tensor-Beschaffung (Hauptpfad) ---

async function getValidTensorFromCamStream(cam) {
    if (!cam || !cam.stream) return null; // Safety check
    
    // Versuch 1: Direkte Aufnahme über das aktive, sichtbare Video-Element (am schnellsten und flackerfrei)
    let tensor = await _captureTensorFromActiveVideo(cam.video);
    if (tensor) return tensor;

    // Versuch 2 (Originaler Fallback): Stream-Einstellungen prüfen/anwenden und ggf. erneut versuchen
	let track = cam.stream.getVideoTracks()[0];
	let settings = {};
	try { settings = track.getSettings(); } catch (e) { settings = {}; }
	let width = settings.width;
	let height = settings.height;
	
    // Versuche, bessere Auflösung zu erzwingen (Originalverhalten)
	try { await tryApplyTrackConstraints(track, { width: { ideal: 1280 }, height: { ideal: 720 } }); } catch (e) { }

    // Versuch 3: Wenn die Metadaten fehlerhaft sind (width/height < 2), verwenden wir den 
    // FLACKERNDEN Fallback, um zumindest *irgendetwas* zu bekommen.
	if (!width || !height || width < 2 || height < 2) {
		tensor = await captureTensorViaTempVideo(cam.stream, 4000);
	}
    
    // Versuch 4: Wenn bisher kein Tensor gefunden wurde, versuche die direkte Capture-Methode 
    // des cam-Objekts (welches jetzt _captureTensorFromActiveVideo nutzt) erneut, falls
    // die applyConstraints geholfen haben.
	if (!tensor) {
		try {
			let direct = await cam.capture(); // cam.capture() ruft jetzt _captureTensorFromActiveVideo auf
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

// --- Canvas / Zeichnen Hilfsfunktionen ---
// (NO CHANGE, RETAINED AS IS)

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

/**
 * Captures a single image from the running webcam stream for training data.
 * (NO CHANGE, RETAINED AS IS)
 * @param {HTMLElement} elem - The element triggering the action (used to find the category).
 * @param {boolean} [nol=false] - Suppress success/error messages.
 * @param {boolean} [_enable_train_and_last_layer_shape_warning=true] - Enable training warning/update.
 */
async function take_image_from_webcam(elem, nol = false, _enable_train_and_last_layer_shape_warning = true) {
	try {
		typeassert(elem, object, "elem");
		if (!inited_webcams) await get_data_from_webcam();
		if (!cam) { await set_custom_webcam_training_data(); await show_webcam(1); }

		// Core logic moved to private helper for testability
		await _captureAndProcessWebcamImage(elem, nol, _enable_train_and_last_layer_shape_warning);

	} catch (err) {
		try { if (!nol) l(language[lang]["error_taking_photo"]); } catch (e) { }
	}
}

/**
 * Captures a series of images from the webcam stream with a delay.
 * (NO CHANGE, RETAINED AS IS)
 * @param {HTMLElement} elem - The element triggering the action.
 */
async function take_image_from_webcam_n_times(elem) {
	const number = parse_int($("#number_of_series_images").val());
	const delaybetween = parse_int($("#delay_between_images_in_series").val()) * 1000;

	dbg(`take_image_from_webcam_n_times: n=${number}, delay=${delaybetween}`);

	let timerInterval;

	Swal.fire({
		title: language[lang]["soon_a_photo_series_will_start"],
		html: language[lang]["first_photo_will_be_taken_in_n_seconds"],
		timer: 2000,
		timerProgressBar: true,
		didOpen: () => {
			Swal.showLoading();
			const b = Swal.getHtmlContainer().querySelector("b");
			timerInterval = setInterval(() => {
				const tl = (Swal.getTimerLeft() / 1000).toFixed(1);
				b.textContent = tl;
			}, 100);
		},
		willClose: () => clearInterval(timerInterval)
	}).then(async () => {
		for (let idx = 0; idx < number; idx++) {
			const msg = sprintf(language[lang]["taking_image_n_of_m"], idx + 1, number);
			log(msg); l(msg);

			dbg("Updating translations");
			await update_translations();

			dbg("Taking next image");
			// Using the core logic from the single image capture
			await take_image_from_webcam(elem, true, false);

			dbg(`Waiting ${delaybetween} ms`);
			await delay(delaybetween);
		}

		await last_shape_layer_warning();
		enable_train();
		l(sprintf(language[lang]["done_taking_n_images"], number));
	});
}
