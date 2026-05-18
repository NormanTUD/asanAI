"use strict";

/**
 * Pyodide Editor Module
 * With live webcam predictions, image upload, and multi-input-type support.
 */

(function () {
	// =========================================================================
	// STATE
	// =========================================================================

	let pyodideInstance = null;
	let pyodideReady = false;
	let pyodideLoading = false;
	let isRunning = false;
	let livePredictEnabled = true;
	let lastPredictionResult = null;
	let runCounter = 0;

	// Webcam state
	let webcamStream = null;
	let webcamAnimationFrame = null;
	let webcamPredicting = false;
	let webcamInterval = null;
	let webcamFPS = 5; // predictions per second

	// =========================================================================
	// DEFAULT CODE TEMPLATES
	// =========================================================================

	const TEMPLATES = {
		image_webcam: `# Live Webcam Prediction
# This code runs automatically each frame when webcam is active.
# 'input_data' is pre-filled with the current webcam frame as a nested list
# matching your model's input shape.

info = get_model_info()
print(f"Input shape: {info['input_shape']}, Output shape: {info['output_shape']}")

# input_data is already provided by the webcam capture system
result = predict(input_data)
print(f"Prediction: {result}")
set_prediction_result(result)
`,
		image_upload: `# Image Upload Prediction
# Upload an image using the button above, then run this code.
# 'input_data' is pre-filled with the uploaded image pixels.

info = get_model_info()
print(f"Model expects: {info['input_shape']}")

result = predict(input_data)
print(f"Prediction: {result}")
set_prediction_result(result)
`,
		random_input: `# Random Input Prediction
# Generates random data matching your model's input shape.

info = get_model_info()
print(f"Model layers: {info['num_layers']}")
print(f"Input shape: {info['input_shape']}")
print(f"Output shape: {info['output_shape']}")

input_shape = info['input_shape']
sample_shape = [s if s is not None else 1 for s in input_shape[1:]]
print(f"Sample shape: {sample_shape}")

input_list = rand_nested(sample_shape)
result = predict(input_list)
print(f"Prediction: {result}")
set_prediction_result(result)
`,
		custom_data: `# Custom Data Prediction
# Enter your own data and predict.

info = get_model_info()
input_shape = info['input_shape']
print(f"Model expects input shape: {input_shape}")
print(f"Model output shape: {info['output_shape']}")

# Example: for a model expecting [None, 4] (4 features):
# my_data = [0.5, 0.3, 0.8, 0.1]

# Example: for a model expecting [None, 28, 28, 1] (grayscale image):
# my_data = [[[pixel/255.0] for pixel in row] for row in image_rows]

# Auto-generate matching input for testing:
sample_shape = [s if s is not None else 1 for s in input_shape[1:]]
my_data = rand_nested(sample_shape)

result = predict(my_data)
print(f"Result: {result}")
set_prediction_result(result)
`,
		weights_inspect: `# Inspect Model Weights

info = get_model_info()
print(f"Layers: {info['num_layers']}")
print(f"Layer names: {info['layer_names']}")
print(f"Layer types: {info['layer_types']}")
print(f"Trainable params: {info['trainable_params']}")
print(f"Non-trainable params: {info['non_trainable_params']}")
print()

weights = get_weights()
if weights:
    for i, w in enumerate(weights):
        if isinstance(w, list):
            # Get shape
            shape = []
            temp = w
            while isinstance(temp, list):
                shape.append(len(temp))
                temp = temp[0] if len(temp) > 0 else []
            print(f"  Weight {i}: shape={shape}")
        else:
            print(f"  Weight {i}: {type(w)}")
`
	};

	const DEFAULT_CODE = TEMPLATES.random_input;

	// =========================================================================
	// INITIALIZATION
	// =========================================================================

	async function initPyodide() {
		if (pyodideReady || pyodideLoading) return;
		pyodideLoading = true;
		setStatus("Loading Pyodide...");

		try {
			if (typeof loadPyodide === "undefined") {
				throw new Error("loadPyodide is not defined. Ensure libs/pyodide.js is loaded.");
			}

			pyodideInstance = await loadPyodide({
				indexURL: "libs/",
				stdout: (text) => appendConsole(text + "\n", "stdout"),
				stderr: (text) => appendConsole(text + "\n", "stderr"),
			});

			await setupPythonEnvironment();

			pyodideReady = true;
			pyodideLoading = false;
			setStatus("Pyodide: ready ✓");
		} catch (e) {
			pyodideLoading = false;
			setStatus("Pyodide: load failed ✗");
			appendConsole("[ERROR] Failed to initialize Pyodide: " + e.message + "\n", "stderr");
			console.error("Pyodide init error:", e);
		}
	}

	async function setupPythonEnvironment() {
		pyodideInstance.globals.set("_js_model_ref", null);
		pyodideInstance.globals.set("_js_prediction_result", null);

		pyodideInstance.registerJsModule("_bridge", {
			getModelWeights: function () { return getModelWeightsForPython(); },
			runPrediction: function (inputData) { return runPredictionForPython(inputData); },
			getModelInfo: function () { return getModelInfoForPython(); },
			setPredictionResult: function (result) {
				lastPredictionResult = result;
				showPredictionResult(result);
			},
			getModelExists: function () {
				return !!(typeof model !== "undefined" && model && model.layers);
			}
		});

		var pythonSetupCode = [
"import json",
"import random",
"import math",
"from _bridge import getModelWeights, runPrediction, getModelInfo, setPredictionResult, getModelExists",
"from pyodide.ffi import to_js, JsProxy",
"",
"# Global that webcam/image upload will fill before running user code",
"input_data = None",
"",
"def get_weights():",
"    if not getModelExists():",
"        raise RuntimeError('No model available. Please create/train a model first.')",
"    raw = getModelWeights()",
"    if raw is None:",
"        return None",
"    if isinstance(raw, JsProxy):",
"        return raw.to_py()",
"    return raw",
"",
"def predict(data=None):",
"    global input_data",
"    if data is None:",
"        data = input_data",
"    if data is None:",
"        raise RuntimeError('No input data. Provide data or use webcam/upload.')",
"    if not getModelExists():",
"        raise RuntimeError('No model available. Please create/train a model first.')",
"    if isinstance(data, JsProxy):",
"        data = data.to_py()",
"    elif not isinstance(data, list):",
"        try:",
"            data = list(data)",
"        except (TypeError, ValueError):",
"            raise TypeError('input_data must be a list or convertible to list')",
"    raw = runPrediction(to_js(data, dict_converter=None))",
"    if raw is None:",
"        return None",
"    if isinstance(raw, JsProxy):",
"        return raw.to_py()",
"    return raw",
"",
"def get_model_info():",
"    if not getModelExists():",
"        raise RuntimeError('No model available. Please create/train a model first.')",
"    raw = getModelInfo()",
"    if isinstance(raw, JsProxy):",
"        return raw.to_py()",
"    return raw",
"",
"def set_prediction_result(result):",
"    if isinstance(result, list):",
"        pass",
"    elif isinstance(result, JsProxy):",
"        result = result.to_py()",
"    else:",
"        try:",
"            result = list(result)",
"        except (TypeError, ValueError):",
"            result = [result]",
"    setPredictionResult(to_js(result, dict_converter=None))",
"",
"def rand_nested(shape):",
"    if len(shape) == 0:",
"        return random.random()",
"    if len(shape) == 1:",
"        return [random.random() for _ in range(shape[0])]",
"    return [rand_nested(shape[1:]) for _ in range(shape[0])]",
"",
"print('Python environment ready.')",
"print('Functions: predict(data), get_model_info(), get_weights(), set_prediction_result(r), rand_nested(shape)')",
		].join("\n");

		await pyodideInstance.runPythonAsync(pythonSetupCode);
	}

	// =========================================================================
	// JS <-> PYTHON BRIDGE FUNCTIONS
	// =========================================================================

	function getModelWeightsForPython() {
		try {
			if (!model || !model.getWeights) return null;
			const weights = model.getWeights();
			const result = [];
			for (let i = 0; i < weights.length; i++) {
				if (!weights[i].isDisposed) {
					result.push(weights[i].arraySync());
				}
			}
			return result;
		} catch (e) {
			console.error("getModelWeightsForPython error:", e);
			return null;
		}
	}

	function runPredictionForPython(inputData) {
		try {
			if (!model || !model.predict) return null;

			let jsInput;
			if (inputData && typeof inputData.toJs === "function") {
				jsInput = inputData.toJs();
			} else if (Array.isArray(inputData)) {
				jsInput = inputData;
			} else {
				jsInput = Array.from(inputData);
			}

			const inputTensor = tf.tensor(jsInput).expandDims(0);

			let processedTensor = inputTensor;
			const divideByEl = document.getElementById("divide_by");
			if (divideByEl && parseFloat(divideByEl.value) > 0) {
				processedTensor = tf.divNoNan(inputTensor, parseFloat(divideByEl.value));
			}

			const predictionTensor = model.predict(processedTensor);
			const results = predictionTensor.dataSync();
			const resultArray = Array.from(results);

			inputTensor.dispose();
			if (processedTensor !== inputTensor) processedTensor.dispose();
			predictionTensor.dispose();

			return resultArray;
		} catch (e) {
			console.error("runPredictionForPython error:", e);
			throw new Error("Prediction failed: " + e.message);
		}
	}

	function getModelInfoForPython() {
		try {
			if (!model || !model.layers) return null;

			const info = {
				num_layers: model.layers.length,
				input_shape: model.layers[0] && model.layers[0].input ? model.layers[0].input.shape : null,
				output_shape: model.outputShape || null,
				layer_names: model.layers.map(function(l) { return l.name; }),
				layer_types: model.layers.map(function(l) { return l.getClassName(); }),
				trainable_params: 0,
				non_trainable_params: 0
			};

			if (model.weights) {
				for (let i = 0; i < model.weights.length; i++) {
					var w = model.weights[i];
					var count = w.shape.reduce(function(a, b) { return a * b; }, 1);
					if (w.trainable) {
						info.trainable_params += count;
					} else {
						info.non_trainable_params += count;
					}
				}
			}

			return info;
		} catch (e) {
			console.error("getModelInfoForPython error:", e);
			return { error: e.message };
		}
	}

	// =========================================================================
	// WEBCAM HANDLING
	// =========================================================================

	async function startWebcam() {
		const video = document.getElementById("pyodide_webcam_video");
		const btn = document.getElementById("pyodide_webcam_btn");
		if (!video) return;

		try {
			webcamStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "environment", width: { ideal: 320 }, height: { ideal: 320 } },
				audio: false
			});
			video.srcObject = webcamStream;
			video.play();

			document.getElementById("pyodide_webcam_container").style.display = "block";
			if (btn) btn.textContent = "⏹ Stop Webcam";
			btn.onclick = stopWebcam;

			// Wait for video to be ready
			video.onloadedmetadata = function() {
				startWebcamPredictionLoop();
			};
		} catch (e) {
			appendConsole("[Webcam Error] " + e.message + "\n", "stderr");
			if (e.name === "NotAllowedError") {
				appendConsole("[Hint] Camera permission denied. Allow camera access and try again.\n", "info");
			} else if (e.name === "NotFoundError") {
				appendConsole("[Hint] No camera found on this device.\n", "info");
			}
		}
	}

	function stopWebcam() {
		const video = document.getElementById("pyodide_webcam_video");
		const btn = document.getElementById("pyodide_webcam_btn");

		if (webcamInterval) {
			clearInterval(webcamInterval);
			webcamInterval = null;
		}
		if (webcamAnimationFrame) {
			cancelAnimationFrame(webcamAnimationFrame);
			webcamAnimationFrame = null;
		}
		if (webcamStream) {
			webcamStream.getTracks().forEach(function(track) { track.stop(); });
			webcamStream = null;
		}
		if (video) {
			video.srcObject = null;
		}

		document.getElementById("pyodide_webcam_container").style.display = "none";
		if (btn) {
			btn.textContent = "📷 Start Webcam";
			btn.onclick = startWebcam;
		}
		webcamPredicting = false;
	}

	function startWebcamPredictionLoop() {
		if (webcamInterval) clearInterval(webcamInterval);

		webcamInterval = setInterval(async function() {
			if (webcamPredicting) return; // skip if previous prediction still running
			if (!webcamStream) return;
			if (!pyodideReady) return;
			if (isRunning) return;

			webcamPredicting = true;
			try {
				await runWebcamFrame();
			} catch (e) {
				// Don't spam console on every frame error
				console.warn("Webcam prediction error:", e);
			}
			webcamPredicting = false;
		}, 1000 / webcamFPS);
	}

	async function runWebcamFrame() {
		const video = document.getElementById("pyodide_webcam_video");
		const canvas = document.getElementById("pyodide_webcam_canvas");
		if (!video || !canvas || video.readyState < 2) return;

		// Get model input shape to know target size
		const info = getModelInfoForPython();
		if (!info || !info.input_shape) return;

		const inputShape = info.input_shape; // e.g. [None, 40, 40, 3]
		const targetH = inputShape[1] || 40;
		const targetW = inputShape[2] || 40;
		const channels = inputShape[3] || 3;

		// Draw video frame to canvas at target size
		canvas.width = targetW;
		canvas.height = targetH;
		const ctx = canvas.getContext("2d");
		ctx.drawImage(video, 0, 0, targetW, targetH);

		// Get pixel data
		const imageData = ctx.getImageData(0, 0, targetW, targetH);
		const pixels = imageData.data; // RGBA flat array

		// Convert to nested list matching model input: [H, W, C]
		const inputList = pixelsToNestedList(pixels, targetH, targetW, channels);

		// Set input_data in Python and run prediction
		await runPredictionWithData(inputList);
	}

	function pixelsToNestedList(pixels, height, width, channels) {
		// pixels is Uint8ClampedArray in RGBA format
		const divideBy = getDivideByValue();
		const result = [];

		for (let y = 0; y < height; y++) {
			const row = [];
			for (let x = 0; x < width; x++) {
				const idx = (y * width + x) * 4;
				const pixel = [];
				for (let c = 0; c < channels; c++) {
					let val = pixels[idx + c]; // R, G, B (skip A if channels=3)
					if (divideBy > 0) {
						val = val / divideBy;
					}
					pixel.push(val);
				}
				// Handle grayscale (channels=1): average RGB
				if (channels === 1) {
					let avg = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
					if (divideBy > 0) avg = avg / divideBy;
					row.push([avg]);
				} else {
					row.push(pixel);
				}
			}
			result.push(row);
		}
		return result;
	}

	function getDivideByValue() {
		const el = document.getElementById("divide_by");
		if (el && parseFloat(el.value) > 0) {
			return parseFloat(el.value);
		}
		return 0;
	}

	// =========================================================================
	// IMAGE UPLOAD HANDLING
	// =========================================================================

	function handleImageUpload(event) {
		const file = event.target.files[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			appendConsole("[Error] Please select an image file.\n", "stderr");
			return;
		}

		const reader = new FileReader();
		reader.onload = function(e) {
			const img = new Image();
			img.onload = function() {
				displayUploadedImage(img);
				processUploadedImage(img);
			};
			img.onerror = function() {
				appendConsole("[Error] Failed to load image.\n", "stderr");
			};
			img.src = e.target.result;
		};
		reader.readAsDataURL(file);
	}

	function displayUploadedImage(img) {
		const preview = document.getElementById("pyodide_image_preview");
		if (!preview) return;

		preview.style.display = "block";
		const canvas = document.getElementById("pyodide_image_canvas");
		if (!canvas) return;

		// Display at reasonable size
		const maxDisplay = 200;
		const scale = Math.min(maxDisplay / img.width, maxDisplay / img.height, 1);
		canvas.width = Math.round(img.width * scale);
		canvas.height = Math.round(img.height * scale);
		const ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
	}

	async function processUploadedImage(img) {
		const info = getModelInfoForPython();
		if (!info || !info.input_shape) {
			appendConsole("[Error] No model loaded. Cannot determine input shape.\n", "stderr");
			return;
		}

		const inputShape = info.input_shape;
		const targetH = inputShape[1] || img.height;
		const targetW = inputShape[2] || img.width;
		const channels = inputShape[3] || 3;

		// Resize image to model's expected input
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = targetW;
		tempCanvas.height = targetH;
		const ctx = tempCanvas.getContext("2d");
		ctx.drawImage(img, 0, 0, targetW, targetH);

		const imageData = ctx.getImageData(0, 0, targetW, targetH);
		const inputList = pixelsToNestedList(imageData.data, targetH, targetW, channels);

		appendConsole("[Image loaded: " + img.width + "x" + img.height + " → resized to " + targetW + "x" + targetH + "x" + channels + "]\n", "info");

		// Run prediction with this data
		await runPredictionWithData(inputList);
	}

	// =========================================================================
	// UNIFIED PREDICTION RUNNER
	// =========================================================================

	/**
	 * Sets input_data in Python and runs the user's code (or auto-predicts).
	 * This is used by webcam, image upload, and manual data entry.
	 */
	async function runPredictionWithData(inputList) {
		if (!pyodideReady) {
			await initPyodide();
			if (!pyodideReady) return;
		}

		try {
			// Set input_data in Python as a global
			pyodideInstance.globals.set("input_data", pyodideInstance.toPy(inputList));

			// If user code is in the editor, run it; otherwise just predict
			const textarea = document.getElementById("pyodide_editor_textarea");
			const code = textarea ? textarea.value : "";

			if (code.includes("predict") || code.includes("input_data")) {
				// Run user code which should use input_data
				if (!isRunning) {
					isRunning = true;
					runCounter++;
					const thisRun = runCounter;

					try {
						await pyodideInstance.runPythonAsync(code);
					} catch (e) {
						// For webcam, don't spam errors — just log once
						if (!webcamStream) {
							handlePythonError(e);
						} else {
							console.warn("Webcam prediction code error:", e.message || e);
						}
					} finally {
						if (thisRun === runCounter) {
							isRunning = false;
						}
					}
				}
			} else {
				// No user code references input — just run predict directly
				var quickPredict = [
"result = predict(input_data)",
"set_prediction_result(result)",
				].join("\n");

				await pyodideInstance.runPythonAsync(quickPredict);
			}
		} catch (e) {
			console.warn("runPredictionWithData error:", e);
		}
	}

	// =========================================================================
	// EDITOR FUNCTIONALITY
	// =========================================================================

	function setupEditorKeyHandlers() {
		const textarea = document.getElementById("pyodide_editor_textarea");
		if (!textarea) return;

		textarea.addEventListener("keydown", function (e) {
			if (e.key === "Tab") {
				e.preventDefault();
				const start = this.selectionStart;
				const end = this.selectionEnd;
				const value = this.value;

				if (e.shiftKey) {
					const beforeSelection = value.substring(0, start);
					const afterSelection = value.substring(end);
					const lineStart = beforeSelection.lastIndexOf("\n") + 1;
					const textToProcess = value.substring(lineStart, end);
					const lines = textToProcess.split("\n");

					let removedChars = 0;
					let firstLineRemoved = 0;
					const dedentedLines = lines.map(function(line, idx) {
						if (line.startsWith("\t")) {
							if (idx === 0) firstLineRemoved = 1;
							removedChars++;
							return line.substring(1);
						} else if (line.startsWith("    ")) {
							if (idx === 0) firstLineRemoved = 4;
							removedChars += 4;
							return line.substring(4);
						}
						return line;
					});

					this.value = value.substring(0, lineStart) + dedentedLines.join("\n") + afterSelection;
					this.selectionStart = Math.max(lineStart, start - firstLineRemoved);
					this.selectionEnd = end - removedChars;
				} else if (start !== end) {
					const beforeSelection = value.substring(0, start);
					const lineStart = beforeSelection.lastIndexOf("\n") + 1;
					const textToProcess = value.substring(lineStart, end);
					const lines = textToProcess.split("\n");
					const indentedLines = lines.map(function(line) { return "    " + line; });
					const addedChars = lines.length * 4;

					this.value = value.substring(0, lineStart) + indentedLines.join("\n") + value.substring(end);
					this.selectionStart = start + 4;
					this.selectionEnd = end + addedChars;
				} else {
					this.value = value.substring(0, start) + "    " + value.substring(end);
					this.selectionStart = this.selectionEnd = start + 4;
				}
				return;
			}

			if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
				e.preventDefault();
				const start = this.selectionStart;
				const value = this.value;
				const lineStart = value.lastIndexOf("\n", start - 1) + 1;
				const currentLine = value.substring(lineStart, start);
				const indent = currentLine.match(/^[\t ]*/)[0];
				const trimmedLine = currentLine.trimEnd();
				let newIndent = indent;
				if (trimmedLine.endsWith(":")) {
					newIndent += "    ";
				}
				// Dedent after return/break/continue/pass
				if (/^\s*(return|break|continue|pass)\b/.test(trimmedLine)) {
					if (newIndent.length >= 4) {
						newIndent = newIndent.substring(4);
					}
				}
				const insertion = "\n" + newIndent;
				this.value = value.substring(0, start) + insertion + value.substring(this.selectionEnd);
				this.selectionStart = this.selectionEnd = start + insertion.length;
				return;
			}

			if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				pyodideEditorRun();
				return;
			}

			if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				saveEditorContent();
				appendConsole("[Saved to browser storage]\n", "info");
				return;
			}

			// Ctrl+D - duplicate line
			if (e.key === "d" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				const start = this.selectionStart;
				const value = this.value;
				const lineStart = value.lastIndexOf("\n", start - 1) + 1;
				const lineEnd = value.indexOf("\n", start);
				const line = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
				const insertion = "\n" + line;
				const insertPos = lineEnd === -1 ? value.length : lineEnd;
				this.value = value.substring(0, insertPos) + insertion + value.substring(insertPos);
				this.selectionStart = this.selectionEnd = start + insertion.length;
				return;
			}
		});

		textarea.addEventListener("keypress", function (e) {
			const pairs = { "(": ")", "[": "]", "{": "}" };
			const char = e.key;

			if (pairs[char]) {
				const start = this.selectionStart;
				const end = this.selectionEnd;
				const value = this.value;

				if (start !== end) {
					e.preventDefault();
					const selected = value.substring(start, end);
					this.value = value.substring(0, start) + char + selected + pairs[char] + value.substring(end);
					this.selectionStart = start + 1;
					this.selectionEnd = end + 1;
				}
			}
		});

		loadEditorContent();
	}

	function saveEditorContent() {
		const textarea = document.getElementById("pyodide_editor_textarea");
		if (textarea) {
			try {
				localStorage.setItem("pyodide_editor_content", textarea.value);
			} catch (e) {}
		}
	}

	function loadEditorContent() {
		const textarea = document.getElementById("pyodide_editor_textarea");
		if (!textarea) return;

		try {
			const saved = localStorage.getItem("pyodide_editor_content");
			if (saved !== null && saved.length > 0) {
				textarea.value = saved;
			} else {
				textarea.value = DEFAULT_CODE;
			}
		} catch (e) {
			textarea.value = DEFAULT_CODE;
		}
	}

	function loadTemplate(name) {
		const textarea = document.getElementById("pyodide_editor_textarea");
		if (!textarea) return;
		if (TEMPLATES[name]) {
			textarea.value = TEMPLATES[name];
			saveEditorContent();
			appendConsole("[Loaded template: " + name + "]\n", "info");
		}
	}

	// =========================================================================
	// EXECUTION
	// =========================================================================

	async function pyodideEditorRun() {
		if (isRunning) {
			appendConsole("[Already running, please wait or stop first]\n", "warn");
			return;
		}

		const textarea = document.getElementById("pyodide_editor_textarea");
		if (!textarea) return;

		const code = textarea.value;
		if (!code.trim()) {
			appendConsole("[No code to run]\n", "warn");
			return;
		}

		saveEditorContent();

		if (!pyodideReady) {
			appendConsole("[Initializing Pyodide, please wait...]\n", "info");
			await initPyodide();
			if (!pyodideReady) {
				appendConsole("[ERROR] Pyodide failed to initialize. Cannot run code.\n", "stderr");
				return;
			}
		}

		isRunning = true;
		runCounter++;
		const thisRun = runCounter;

		const runBtn = document.getElementById("pyodide_run_btn");
		const stopBtn = document.getElementById("pyodide_stop_btn");

		if (stopBtn) stopBtn.disabled = false;

		setStatus("Running...");
		hideErrorIndicator();

		appendConsole("\n--- Run #" + thisRun + " ---\n", "info");

		try {
			await refreshModelInPython();
			await pyodideInstance.runPythonAsync(code);

			if (isRunning && thisRun === runCounter) {
				appendConsole("--- Done ---\n", "info");
				setStatus("Pyodide: ready ✓");
			}
		} catch (e) {
			if (thisRun === runCounter) {
				handlePythonError(e);
			}
		} finally {
			if (thisRun === runCounter) {
				isRunning = false;
				if (runBtn) runBtn.disabled = false;
				if (stopBtn) stopBtn.disabled = true;
			}
		}

		if (livePredictEnabled && lastPredictionResult !== null) {
			showPredictionResult(lastPredictionResult);
		}
	}

	function pyodideEditorStop() {
		if (!isRunning) return;

		isRunning = false;
		runCounter++;
		appendConsole("\n[Execution stopped by user]\n", "warn");
		setStatus("Pyodide: ready ✓");

		const runBtn = document.getElementById("pyodide_run_btn");
		const stopBtn = document.getElementById("pyodide_stop_btn");
		if (runBtn) runBtn.disabled = false;
		if (stopBtn) stopBtn.disabled = true;
	}

	function pyodideEditorClear() {
		const output = document.getElementById("pyodide_console_output");
		if (output) output.textContent = "";
		hideErrorIndicator();
		hidePredictionResults();
	}

	async function pyodideEditorReset() {
		if (isRunning) {
			pyodideEditorStop();
		}

		pyodideReady = false;
		pyodideLoading = false;
		pyodideInstance = null;
		lastPredictionResult = null;

		appendConsole("\n[Runtime reset. Will reinitialize on next run.]\n", "info");
		setStatus("Pyodide: not loaded");
		hidePredictionResults();

		await initPyodide();
	}

	// =========================================================================
	// WEBCAM HANDLING
	// =========================================================================

	async function startWebcam() {
		const video = document.getElementById("pyodide_webcam_video");
		const btn = document.getElementById("pyodide_webcam_btn");
		if (!video) return;

		if (!pyodideReady) {
			appendConsole("[Initializing Pyodide first...]\n", "info");
			await initPyodide();
			if (!pyodideReady) {
				appendConsole("[ERROR] Cannot start webcam without Pyodide.\n", "stderr");
				return;
			}
		}

		try {
			webcamStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "environment", width: { ideal: 320 }, height: { ideal: 320 } },
				audio: false
			});
			video.srcObject = webcamStream;
			video.play();

			document.getElementById("pyodide_webcam_container").style.display = "block";
			if (btn) {
				btn.textContent = "\u23F9 Stop Webcam";
				btn.onclick = stopWebcam;
			}

			video.onloadedmetadata = function() {
				appendConsole("[Webcam started: " + video.videoWidth + "x" + video.videoHeight + "]\n", "info");
				startWebcamPredictionLoop();
			};
		} catch (e) {
			appendConsole("[Webcam Error] " + e.message + "\n", "stderr");
			if (e.name === "NotAllowedError") {
				appendConsole("[Hint] Camera permission denied. Allow camera access and try again.\n", "info");
			} else if (e.name === "NotFoundError") {
				appendConsole("[Hint] No camera found on this device.\n", "info");
			} else if (e.name === "NotReadableError") {
				appendConsole("[Hint] Camera is in use by another application.\n", "info");
			}
		}
	}

	function stopWebcam() {
		const video = document.getElementById("pyodide_webcam_video");
		const btn = document.getElementById("pyodide_webcam_btn");

		if (webcamInterval) {
			clearInterval(webcamInterval);
			webcamInterval = null;
		}
		if (webcamStream) {
			webcamStream.getTracks().forEach(function(track) { track.stop(); });
			webcamStream = null;
		}
		if (video) {
			video.srcObject = null;
		}

		var container = document.getElementById("pyodide_webcam_container");
		if (container) container.style.display = "none";

		if (btn) {
			btn.textContent = "\uD83D\uDCF7 Start Webcam";
			btn.onclick = startWebcam;
		}
		webcamPredicting = false;
		appendConsole("[Webcam stopped]\n", "info");
	}

	function startWebcamPredictionLoop() {
		if (webcamInterval) clearInterval(webcamInterval);

		webcamInterval = setInterval(async function() {
			if (webcamPredicting) return;
			if (!webcamStream) return;
			if (!pyodideReady) return;
			if (isRunning) return;

			webcamPredicting = true;
			try {
				await runWebcamFrame();
			} catch (e) {
				console.warn("Webcam frame error:", e);
			}
			webcamPredicting = false;
		}, 1000 / webcamFPS);
	}

	async function runWebcamFrame() {
		const video = document.getElementById("pyodide_webcam_video");
		const canvas = document.getElementById("pyodide_webcam_canvas");
		if (!video || !canvas || video.readyState < 2) return;

		var info = getModelInfoForPython();
		if (!info || !info.input_shape) return;

		var inputShape = info.input_shape;
		var targetH = inputShape[1] || 40;
		var targetW = inputShape[2] || 40;
		var channels = inputShape[3] || 3;

		canvas.width = targetW;
		canvas.height = targetH;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(video, 0, 0, targetW, targetH);

		var imageData = ctx.getImageData(0, 0, targetW, targetH);
		var inputList = pixelsToNestedList(imageData.data, targetH, targetW, channels);

		// Run prediction directly via JS bridge (faster than going through Python for webcam)
		try {
			var resultArray = runPredictionForPython(inputList);
			if (resultArray) {
				lastPredictionResult = resultArray;
				showPredictionResult(resultArray);
			}
		} catch (e) {
			console.warn("Webcam prediction error:", e);
		}
	}

	function pixelsToNestedList(pixels, height, width, channels) {
		var divideBy = getDivideByValue();
		var result = [];

		for (var y = 0; y < height; y++) {
			var row = [];
			for (var x = 0; x < width; x++) {
				var idx = (y * width + x) * 4;
				if (channels === 1) {
					var avg = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
					if (divideBy > 0) avg = avg / divideBy;
					row.push([avg]);
				} else {
					var pixel = [];
					for (var c = 0; c < channels; c++) {
						var val = pixels[idx + c];
						if (divideBy > 0) val = val / divideBy;
						pixel.push(val);
					}
					row.push(pixel);
				}
			}
			result.push(row);
		}
		return result;
	}

	function getDivideByValue() {
		var el = document.getElementById("divide_by");
		if (el && parseFloat(el.value) > 0) {
			return parseFloat(el.value);
		}
		return 0;
	}

	// =========================================================================
	// IMAGE UPLOAD HANDLING
	// =========================================================================

	function handleImageUpload(event) {
		var file = event.target.files[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			appendConsole("[Error] Please select an image file.\n", "stderr");
			return;
		}

		var reader = new FileReader();
		reader.onload = function(e) {
			var img = new Image();
			img.onload = function() {
				displayUploadedImage(img);
				processUploadedImage(img);
			};
			img.onerror = function() {
				appendConsole("[Error] Failed to load image.\n", "stderr");
			};
			img.src = e.target.result;
		};
		reader.onerror = function() {
			appendConsole("[Error] Failed to read file.\n", "stderr");
		};
		reader.readAsDataURL(file);
	}

	function displayUploadedImage(img) {
		var preview = document.getElementById("pyodide_image_preview");
		if (!preview) return;

		preview.style.display = "block";
		var canvas = document.getElementById("pyodide_image_canvas");
		if (!canvas) return;

		var maxDisplay = 200;
		var scale = Math.min(maxDisplay / img.width, maxDisplay / img.height, 1);
		canvas.width = Math.round(img.width * scale);
		canvas.height = Math.round(img.height * scale);
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
	}

	async function processUploadedImage(img) {
		if (!pyodideReady) {
			appendConsole("[Initializing Pyodide first...]\n", "info");
			await initPyodide();
			if (!pyodideReady) {
				appendConsole("[ERROR] Cannot process image without Pyodide.\n", "stderr");
				return;
			}
		}

		var info = getModelInfoForPython();
		if (!info || !info.input_shape) {
			appendConsole("[Error] No model loaded. Cannot determine input shape.\n", "stderr");
			return;
		}

		var inputShape = info.input_shape;
		var targetH = inputShape[1] || img.height;
		var targetW = inputShape[2] || img.width;
		var channels = inputShape[3] || 3;

		var tempCanvas = document.createElement("canvas");
		tempCanvas.width = targetW;
		tempCanvas.height = targetH;
		var ctx = tempCanvas.getContext("2d");
		ctx.drawImage(img, 0, 0, targetW, targetH);

		var imageData = ctx.getImageData(0, 0, targetW, targetH);
		var inputList = pixelsToNestedList(imageData.data, targetH, targetW, channels);

		appendConsole("[Image: " + img.width + "x" + img.height + " \u2192 " + targetW + "x" + targetH + "x" + channels + "]\n", "info");

		// Set input_data in Python and run user code
		try {
			pyodideInstance.globals.set("input_data", pyodideInstance.toPy(inputList));

			var textarea = document.getElementById("pyodide_editor_textarea");
			var code = textarea ? textarea.value : "";

			if (code.includes("input_data") || code.includes("predict")) {
				await pyodideEditorRun();
			} else {
				// Quick predict without user code
				var resultArray = runPredictionForPython(inputList);
				if (resultArray) {
					lastPredictionResult = resultArray;
					showPredictionResult(resultArray);
					appendConsole("Prediction: [" + resultArray.map(function(v) { return v.toFixed(4); }).join(", ") + "]\n", "stdout");
				}
			}
		} catch (e) {
			appendConsole("[Error] " + e.message + "\n", "stderr");
		}
	}

	// =========================================================================
	// TEMPLATE LOADING
	// =========================================================================

	function loadTemplate(name) {
		var textarea = document.getElementById("pyodide_editor_textarea");
		if (!textarea) return;
		if (TEMPLATES[name]) {
			textarea.value = TEMPLATES[name];
			saveEditorContent();
			appendConsole("[Loaded template: " + name + "]\n", "info");
		}
	}

	// =========================================================================
	// FPS CONTROL
	// =========================================================================

	function setWebcamFPS(fps) {
		webcamFPS = Math.max(1, Math.min(30, parseInt(fps) || 5));
		var label = document.getElementById("pyodide_fps_label");
		if (label) label.textContent = webcamFPS + " FPS";

		// Restart loop if active
		if (webcamStream && webcamInterval) {
			startWebcamPredictionLoop();
		}
	}

	// =========================================================================
	// LIVE PREDICTIONS
	// =========================================================================

	let livePredictDebounceTimer = null;

	function pyodideLivePredictChanged() {
		const checkbox = document.getElementById("pyodide_live_predict");
		livePredictEnabled = checkbox ? checkbox.checked : false;
	}

	function setupLivePredictions() {
		const textarea = document.getElementById("pyodide_editor_textarea");
		if (!textarea) return;

		textarea.addEventListener("input", function () {
			if (!livePredictEnabled) return;
			if (isRunning) return;

			clearTimeout(livePredictDebounceTimer);
			livePredictDebounceTimer = setTimeout(async function() {
				if (!livePredictEnabled) return;
				if (isRunning) return;

				var code = textarea.value;
				if (code.includes("set_prediction_result") || code.includes("predict(")) {
					await pyodideEditorRun();
				}
			}, 1500);
		});
	}

	// =========================================================================
	// REFRESH MODEL
	// =========================================================================

	async function refreshModelInPython() {
		if (!pyodideInstance) return;

		try {
			var checkCode = [
"import _bridge",
"_model_available = _bridge.getModelExists()",
"if not _model_available:",
"    print('[Warning] No model available. Create or train a model first.')",
			].join("\n");

			await pyodideInstance.runPythonAsync(checkCode);
		} catch (e) {
			console.warn("refreshModelInPython:", e);
		}
	}

	// =========================================================================
	// ERROR HANDLING
	// =========================================================================

	function handlePythonError(e) {
		let errorMsg = "";

		if (e && e.message) {
			errorMsg = e.message;
		} else if (typeof e === "string") {
			errorMsg = e;
		} else {
			errorMsg = String(e);
		}

		let formattedError = "";

		if (errorMsg.includes("Traceback")) {
			formattedError = errorMsg;
		} else if (errorMsg.includes("PythonError")) {
			formattedError = errorMsg.replace("PythonError: ", "");
		} else if (errorMsg.includes("SyntaxError")) {
			formattedError = "SyntaxError: " + errorMsg;
		} else {
			formattedError = "Error: " + errorMsg;
		}

		appendConsole(formattedError + "\n", "stderr");
		showErrorIndicator();
		setStatus("Pyodide: error \u2717");

		var hints = getErrorHints(errorMsg);
		if (hints) {
			appendConsole("[Hint] " + hints + "\n", "info");
		}
	}

	function getErrorHints(errorMsg) {
		if (errorMsg.includes("No model available")) {
			return "Create a model in the main interface first, then run your code.";
		}
		if (errorMsg.includes("IndentationError")) {
			return "Check your indentation. Use consistent spaces (not mixed tabs/spaces).";
		}
		if (errorMsg.includes("ModuleNotFoundError")) {
			var match = errorMsg.match(/No module named '([^']+)'/);
			if (match) {
				return "Module '" + match[1] + "' not available. Try: import micropip; await micropip.install('" + match[1] + "')";
			}
		}
		if (errorMsg.includes("shape")) {
			return "Shape mismatch. Use get_model_info() to check expected shapes.";
		}
		if (errorMsg.includes("NameError")) {
			return "Variable/function not found. Check for typos.";
		}
		if (errorMsg.includes("TypeError")) {
			return "Type error. Check argument types.";
		}
		if (errorMsg.includes("ValueError")) {
			return "Value error. Check data dimensions and values.";
		}
		if (errorMsg.includes("IndexError")) {
			return "Index out of range.";
		}
		if (errorMsg.includes("KeyError")) {
			return "Key not found. Use .keys() to see available keys.";
		}
		if (errorMsg.includes("AttributeError")) {
			return "Attribute not found. Use dir(obj) to inspect.";
		}
		return null;
	}

	// =========================================================================
	// UI HELPERS
	// =========================================================================

	function appendConsole(text, type) {
		const output = document.getElementById("pyodide_console_output");
		if (!output) return;

		const span = document.createElement("span");
		span.textContent = text;

		switch (type) {
			case "stderr":
				span.style.color = "#ff5555";
				break;
			case "warn":
				span.style.color = "#ffaa00";
				break;
			case "info":
				span.style.color = "#888888";
				break;
			case "stdout":
			default:
				span.style.color = "#00ff00";
				break;
		}

		output.appendChild(span);

		// Limit console lines to prevent memory issues
		while (output.childNodes.length > 500) {
			output.removeChild(output.firstChild);
		}

		output.scrollTop = output.scrollHeight;
	}

	function setStatus(text) {
		var el = document.getElementById("pyodide_status");
		if (el) el.textContent = text;
	}

	function showErrorIndicator() {
		var el = document.getElementById("pyodide_error_indicator");
		if (el) el.style.display = "inline";
	}

	function hideErrorIndicator() {
		var el = document.getElementById("pyodide_error_indicator");
		if (el) el.style.display = "none";
	}

	function showPredictionResult(result) {
		var container = document.getElementById("pyodide_prediction_results");
		var output = document.getElementById("pyodide_prediction_output");
		if (!container || !output) return;

		container.style.display = "block";

		var displayText = "";
		try {
			if (result === null || result === undefined) {
				displayText = "(no prediction result)";
			} else if (typeof result === "object" && result.toJs) {
				displayText = formatPredictionResult(result.toJs());
			} else if (Array.isArray(result)) {
				displayText = formatPredictionResult(result);
			} else {
				displayText = JSON.stringify(result, null, 2);
			}
		} catch (e) {
			displayText = String(result);
		}

		output.textContent = displayText;
	}

	function formatPredictionResult(result) {
		if (!Array.isArray(result)) {
			return JSON.stringify(result, null, 2);
		}

		var lines = [];
		lines.push("Prediction (" + result.length + " outputs):");
		lines.push("\u2500".repeat(40));

		var labelsList = [];
		try {
			if (typeof labels !== "undefined" && Array.isArray(labels)) {
				labelsList = labels;
			}
		} catch (e) {}

		var indexed = result.map(function(val, idx) {
			return {
				index: idx,
				value: typeof val === "number" ? val : parseFloat(val),
				label: labelsList[idx] || ("Output " + idx)
			};
		});

		var sorted = indexed.slice().sort(function(a, b) { return b.value - a.value; });

		var sum = indexed.reduce(function(s, v) { return s + v.value; }, 0);
		var looksLikeProbabilities = indexed.every(function(v) {
			return v.value >= 0 && v.value <= 1;
		}) && Math.abs(sum - 1.0) < 0.05;

		if (looksLikeProbabilities) {
			lines.push("(sorted by confidence)");
			for (var i = 0; i < sorted.length; i++) {
				var item = sorted[i];
				var pct = (item.value * 100).toFixed(2);
				var bar = "\u2588".repeat(Math.round(item.value * 20));
				lines.push("  " + item.label.padEnd(20) + " " + pct.padStart(7) + "%  " + bar);
			}
		} else {
			for (var j = 0; j < indexed.length; j++) {
				var it = indexed[j];
				var valStr = it.value.toFixed(6);
				lines.push("  " + it.label.padEnd(20) + " " + valStr);
			}
		}

		return lines.join("\n");
	}

	function hidePredictionResults() {
		var container = document.getElementById("pyodide_prediction_results");
		if (container) container.style.display = "none";
	}

	// =========================================================================
	// PUBLIC API
	// =========================================================================

	function getLastPyodidePrediction() {
		return lastPredictionResult;
	}

	function clearPyodidePrediction() {
		lastPredictionResult = null;
		hidePredictionResults();
	}

	function isPyodideReady() {
		return pyodideReady;
	}

	function isPyodideRunning() {
		return isRunning;
	}

	async function runPythonCode(code) {
		if (!pyodideReady) {
			await initPyodide();
			if (!pyodideReady) {
				throw new Error("Pyodide failed to initialize");
			}
		}
		await refreshModelInPython();
		return await pyodideInstance.runPythonAsync(code);
	}

	async function loadPyodidePackage(packages) {
		if (!pyodideReady) {
			await initPyodide();
		}
		if (!pyodideInstance) {
			throw new Error("Pyodide is not available");
		}

		var pkgList = Array.isArray(packages) ? packages : [packages];
		setStatus("Loading " + pkgList.join(", ") + "...");
		appendConsole("[Loading packages: " + pkgList.join(", ") + "]\n", "info");

		try {
			await pyodideInstance.loadPackage(pkgList);
			appendConsole("[Packages loaded successfully]\n", "info");
			setStatus("Pyodide: ready \u2713");
		} catch (e) {
			appendConsole("[Failed to load packages: " + e.message + "]\n", "stderr");
			setStatus("Pyodide: ready \u2713");
			throw e;
		}
	}

	// =========================================================================
	// EDITOR KEY HANDLERS
	// =========================================================================

	function setupEditorKeyHandlers() {
		const textarea = document.getElementById("pyodide_editor_textarea");
		if (!textarea) return;

		textarea.addEventListener("keydown", function (e) {
			if (e.key === "Tab") {
				e.preventDefault();
				var start = this.selectionStart;
				var end = this.selectionEnd;
				var value = this.value;

				if (e.shiftKey) {
					var beforeSelection = value.substring(0, start);
					var afterSelection = value.substring(end);
					var lineStart = beforeSelection.lastIndexOf("\n") + 1;
					var textToProcess = value.substring(lineStart, end);
					var lines = textToProcess.split("\n");
					var removedChars = 0;
					var firstLineRemoved = 0;

					var dedentedLines = lines.map(function(line, idx) {
						if (line.startsWith("    ")) {
							if (idx === 0) firstLineRemoved = 4;
							removedChars += 4;
							return line.substring(4);
						} else if (line.startsWith("\t")) {
							if (idx === 0) firstLineRemoved = 1;
							removedChars++;
							return line.substring(1);
						}
						return line;
					});

					this.value = value.substring(0, lineStart) + dedentedLines.join("\n") + afterSelection;
					this.selectionStart = Math.max(lineStart, start - firstLineRemoved);
					this.selectionEnd = end - removedChars;
				} else if (start !== end) {
					var beforeSel = value.substring(0, start);
					var ls = beforeSel.lastIndexOf("\n") + 1;
					var proc = value.substring(ls, end);
					var lns = proc.split("\n");
					var indented = lns.map(function(line) { return "    " + line; });

					this.value = value.substring(0, ls) + indented.join("\n") + value.substring(end);
					this.selectionStart = start + 4;
					this.selectionEnd = end + (lns.length * 4);
				} else {
					this.value = value.substring(0, start) + "    " + value.substring(end);
					this.selectionStart = this.selectionEnd = start + 4;
				}
				return;
			}

			if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
				e.preventDefault();
				var s = this.selectionStart;
				var v = this.value;
				var lineStart = v.lastIndexOf("\n", s - 1) + 1;
				var currentLine = v.substring(lineStart, s);
				var indent = currentLine.match(/^[\t ]*/)[0];
				var trimmedLine = currentLine.trimEnd();
				var newIndent = indent;

				if (trimmedLine.endsWith(":")) {
					newIndent += "    ";
				}
				// Dedent after return/break/continue/pass
				if (/^\s*(return|break|continue|pass)\b/.test(trimmedLine)) {
					if (newIndent.length >= 4) {
						newIndent = newIndent.substring(4);
					} else if (newIndent.length >= 1 && newIndent[0] === "\t") {
						newIndent = newIndent.substring(1);
					}
				}

				var insertion = "\n" + newIndent;
				this.value = v.substring(0, s) + insertion + v.substring(this.selectionEnd);
				this.selectionStart = this.selectionEnd = s + insertion.length;
				return;
			}

			if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				pyodideEditorRun();
				return;
			}

			if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				saveEditorContent();
				appendConsole("[Saved to browser storage]\n", "info");
				return;
			}

			// Ctrl+D - duplicate line
			if (e.key === "d" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				var start = this.selectionStart;
				var value = this.value;
				var ls = value.lastIndexOf("\n", start - 1) + 1;
				var le = value.indexOf("\n", start);
				if (le === -1) le = value.length;
				var line = value.substring(ls, le);
				this.value = value.substring(0, le) + "\n" + line + value.substring(le);
				this.selectionStart = this.selectionEnd = start + line.length + 1;
				return;
			}
		});

		textarea.addEventListener("keypress", function (e) {
			var pairs = { "(": ")", "[": "]", "{": "}" };
			var char = e.key;

			if (pairs[char]) {
				var start = this.selectionStart;
				var end = this.selectionEnd;
				var value = this.value;

				if (start !== end) {
					e.preventDefault();
					var selected = value.substring(start, end);
					this.value = value.substring(0, start) + char + selected + pairs[char] + value.substring(end);
					this.selectionStart = start + 1;
					this.selectionEnd = end + 1;
				}
			}
		});

		loadEditorContent();
	}

	// =========================================================================
	// INITIALIZATION ON DOM READY
	// =========================================================================

	function initWhenReady() {
		setupEditorKeyHandlers();
		setupLivePredictions();

		var observer = new MutationObserver(function (mutations) {
			for (var i = 0; i < mutations.length; i++) {
				var mutation = mutations[i];
				if (mutation.type === "attributes" && mutation.attributeName === "style") {
					var tab = document.getElementById("pyodide_editor_tab");
					if (tab && tab.style.display !== "none" && !pyodideReady && !pyodideLoading) {
						initPyodide();
					}
				}
			}
		});

		var pyodideTab = document.getElementById("pyodide_editor_tab");
		if (pyodideTab) {
			observer.observe(pyodideTab, { attributes: true, attributeFilter: ["style"] });

			if (pyodideTab.style.display !== "none" && pyodideTab.offsetParent !== null) {
				initPyodide();
			}
		}

		setInterval(saveEditorContent, 30000);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initWhenReady);
	} else {
		setTimeout(initWhenReady, 0);
	}

	// =========================================================================
	// EXPOSE GLOBAL FUNCTIONS
	// =========================================================================

	window.pyodideEditorRun = pyodideEditorRun;
	window.pyodideEditorStop = pyodideEditorStop;
	window.pyodideEditorClear = pyodideEditorClear;
	window.pyodideEditorReset = pyodideEditorReset;
	window.pyodideLivePredictChanged = pyodideLivePredictChanged;
	window.pyodideStartWebcam = startWebcam;
	window.pyodideStopWebcam = stopWebcam;
	window.pyodideHandleImageUpload = handleImageUpload;
	window.pyodideLoadTemplate = loadTemplate;
	window.pyodideSetWebcamFPS = setWebcamFPS;

	window.PyodideEditor = {
		getLastPrediction: getLastPyodidePrediction,
		clearPrediction: clearPyodidePrediction,
		isReady: isPyodideReady,
		isRunning: isPyodideRunning,
		runCode: runPythonCode,
		loadPackage: loadPyodidePackage,
		init: initPyodide,
		startWebcam: startWebcam,
		stopWebcam: stopWebcam
	};

})();
