"use strict";

/**
 * Pyodide Editor Module
 */

(function () {
	// =========================================================================
	// STATE
	// =========================================================================

	let pyodideInstance = null;
	let pyodideReady = false;
	let pyodideLoading = false;
	let isRunning = false;
	let abortController = null;
	let livePredictEnabled = true;
	let lastPredictionResult = null;
	let runCounter = 0;
	let editorHistory = [];
	let historyIndex = -1;

	// Default example code
const DEFAULT_CODE = `# Python Code Editor - Pyodide (stdlib only, no numpy required)
#
# Available functions:
#   get_weights()       - Returns model weights as nested Python lists
#   predict(input_data) - Run prediction, returns results as Python list
#   get_model_info()    - Returns dict with model architecture info
#   set_prediction_result(result) - Store result for JS to grab
#   rand_nested(shape)  - Generate random nested list matching a shape
#
# To install numpy (optional, requires internet):
#   import micropip
#   await micropip.install("numpy")
#   import numpy as np

# Get model info
info = get_model_info()
print(f"Model layers: {info['num_layers']}")
print(f"Input shape: {info['input_shape']}")
print(f"Output shape: {info['output_shape']}")

# Create sample input matching the model's expected input shape
input_shape = info['input_shape']
# Remove batch dimension (first None)
sample_shape = [s if s is not None else 1 for s in input_shape[1:]]
print(f"Sample input shape (no batch): {sample_shape}")

# Generate random input using stdlib
input_list = rand_nested(sample_shape)
print(f"Sample input generated")

# Run prediction
result = predict(input_list)
print(f"Prediction result: {result}")

# Store result for JS to grab
set_prediction_result(result)
`;

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

			// No numpy loading — just set up the environment with stdlib only
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


	/**
	 * Set up the Python-side environment with helper functions.
	 * IMPORTANT: The Python code string must have NO leading indentation
	 * because Python is whitespace-sensitive.
	 */
async function setupPythonEnvironment() {
	pyodideInstance.globals.set("_js_model_ref", null);
	pyodideInstance.globals.set("_js_prediction_result", null);

	pyodideInstance.registerJsModule("_bridge", {
		getModelWeights: function () {
			return getModelWeightsForPython();
		},
		runPrediction: function (inputData) {
			return runPredictionForPython(inputData);
		},
		getModelInfo: function () {
			return getModelInfoForPython();
		},
		setPredictionResult: function (result) {
			lastPredictionResult = result;
			showPredictionResult(result);
		},
		getModelExists: function () {
			return !!(typeof model !== "undefined" && model && model.layers);
		}
	});

	// Python setup code — NO numpy, stdlib only.
	// Using array.join to avoid any indentation issues from JS template literals.
	var pythonSetupCode = [
"import json",
"import random",
"import math",
"from _bridge import getModelWeights, runPrediction, getModelInfo, setPredictionResult, getModelExists",
"from pyodide.ffi import to_js, JsProxy",
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
"def predict(input_data):",
"    if not getModelExists():",
"        raise RuntimeError('No model available. Please create/train a model first.')",
"    if isinstance(input_data, list):",
"        pass",
"    elif isinstance(input_data, JsProxy):",
"        input_data = input_data.to_py()",
"    else:",
"        try:",
"            input_data = list(input_data)",
"        except (TypeError, ValueError):",
"            raise TypeError('input_data must be a list or convertible to list')",
"    raw = runPrediction(to_js(input_data, dict_converter=None))",
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
"print('Python environment ready. (stdlib only, no numpy)')",
"print('Available: get_weights(), predict(input), get_model_info(), set_prediction_result(result), rand_nested(shape)')",
"print('To install numpy: import micropip; await micropip.install(\"numpy\")')",
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
					const indentedLines = lines.map(function(line) { return "\t" + line; });
					const addedChars = lines.length;

					this.value = value.substring(0, lineStart) + indentedLines.join("\n") + value.substring(end);
					this.selectionStart = start + 1;
					this.selectionEnd = end + addedChars;
				} else {
					this.value = value.substring(0, start) + "\t" + value.substring(end);
					this.selectionStart = this.selectionEnd = start + 1;
				}
				return;
			}

			// Enter key - auto-indent
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
				const insertion = "\n" + newIndent;
				this.value = value.substring(0, start) + insertion + value.substring(this.selectionEnd);
				this.selectionStart = this.selectionEnd = start + insertion.length;
				return;
			}

			// Ctrl+Enter or Cmd+Enter - Run code
			if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				pyodideEditorRun();
				return;
			}

			// Ctrl+S or Cmd+S - Save
			if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				saveEditorContent();
				appendConsole("[Saved to browser storage]\n", "info");
				return;
			}
		});

		textarea.addEventListener("keypress", function (e) {
			const pairs = { "(": ")", "[": "]", "{": "}", "\"": "\"", "'": "'" };
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
		if (runBtn) runBtn.disabled = true;
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
		setStatus("Pyodide: error ✗");

		const hints = getErrorHints(errorMsg);
		if (hints) {
			appendConsole("[Hint] " + hints + "\n", "info");
		}
	}

	function getErrorHints(errorMsg) {
		if (errorMsg.includes("No model available")) {
			return "Create a model in the main interface first, then run your code.";
		}
		if (errorMsg.includes("IndentationError")) {
			return "Check your indentation. Python uses consistent indentation (tabs or spaces, not mixed).";
		}
		if (errorMsg.includes("ModuleNotFoundError")) {
			var match = errorMsg.match(/No module named '([^']+)'/);
			if (match) {
				return "Module '" + match[1] + "' is not available. Try: import micropip; await micropip.install('" + match[1] + "')";
			}
		}
		if (errorMsg.includes("shape")) {
			return "Shape mismatch. Check get_model_info() to see expected input/output shapes.";
		}
		if (errorMsg.includes("NameError")) {
			return "A variable or function name was not found. Check for typos.";
		}
		if (errorMsg.includes("TypeError")) {
			return "A type error occurred. Check that you're passing the correct types to functions.";
		}
		if (errorMsg.includes("ValueError")) {
			return "A value error occurred. Check your input data dimensions and values.";
		}
		if (errorMsg.includes("ZeroDivisionError")) {
			return "Division by zero detected. Check your arithmetic operations.";
		}
		if (errorMsg.includes("IndexError")) {
			return "Index out of range. Check your array/list indexing.";
		}
		if (errorMsg.includes("KeyError")) {
			return "Key not found in dictionary. Check available keys with .keys().";
		}
		if (errorMsg.includes("AttributeError")) {
			return "Attribute not found on object. Use dir(obj) to see available attributes.";
		}
		if (errorMsg.includes("RuntimeError") && errorMsg.includes("model")) {
			return "Model-related runtime error. Ensure the model is created and compiled before running predictions.";
		}
		if (errorMsg.includes("OverflowError") || errorMsg.includes("MemoryError")) {
			return "Resource limit hit. Try reducing data sizes or resetting the runtime.";
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
		output.scrollTop = output.scrollHeight;
	}

	function setStatus(text) {
		const el = document.getElementById("pyodide_status");
		if (el) el.textContent = text;
	}

	function showErrorIndicator() {
		const el = document.getElementById("pyodide_error_indicator");
		if (el) el.style.display = "inline";
	}

	function hideErrorIndicator() {
		const el = document.getElementById("pyodide_error_indicator");
		if (el) el.style.display = "none";
	}

	function showPredictionResult(result) {
		const container = document.getElementById("pyodide_prediction_results");
		const output = document.getElementById("pyodide_prediction_output");
		if (!container || !output) return;

		container.style.display = "block";

		let displayText = "";
		try {
			if (result === null || result === undefined) {
				displayText = "(no prediction result)";
			} else if (typeof result === "object" && result.toJs) {
				var jsResult = result.toJs();
				displayText = formatPredictionResult(jsResult);
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

		let lines = [];
		lines.push("Prediction (" + result.length + " outputs):");
		lines.push("─".repeat(40));

		// Try to match with labels if available
		let labelsList = [];
		try {
			if (typeof labels !== "undefined" && Array.isArray(labels)) {
				labelsList = labels;
			}
		} catch (e) { /* no labels available */ }

		// Create indexed results with optional labels
		const indexed = result.map(function(val, idx) {
			return {
				index: idx,
				value: typeof val === "number" ? val : parseFloat(val),
				label: labelsList[idx] || ("Output " + idx)
			};
		});

		// Sort by value descending for classification-like outputs
		const sorted = indexed.slice().sort(function(a, b) { return b.value - a.value; });

		// Determine if this looks like probabilities (all values between 0 and 1, sum ~1)
		const sum = indexed.reduce(function(s, v) { return s + v.value; }, 0);
		const looksLikeProbabilities = indexed.every(function(v) {
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
				var valStr = typeof it.value === "number" ? it.value.toFixed(6) : String(it.value);
				lines.push("  " + it.label.padEnd(20) + " " + valStr);
			}
		}

		return lines.join("\n");
	}

	function hidePredictionResults() {
		const container = document.getElementById("pyodide_prediction_results");
		if (container) container.style.display = "none";
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
	// PUBLIC API - Grab predictions from JS
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
			setStatus("Pyodide: ready ✓");
		} catch (e) {
			appendConsole("[Failed to load packages: " + e.message + "]\n", "stderr");
			setStatus("Pyodide: ready ✓");
			throw e;
		}
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

	window.PyodideEditor = {
		getLastPrediction: getLastPyodidePrediction,
		clearPrediction: clearPyodidePrediction,
		isReady: isPyodideReady,
		isRunning: isPyodideRunning,
		runCode: runPythonCode,
		loadPackage: loadPyodidePackage,
		init: initPyodide
	};

})();
