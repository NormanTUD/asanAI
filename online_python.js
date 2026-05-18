"use strict";

/**
 * Pyodide Editor Module — v2 (Jupyter-like Rich Output)
 * 
 * Features:
 *   - Syntax highlighting with proper line numbers
 *   - Simple / Advanced mode toggle
 *   - Rich console output: canvases, HTML, images (like Jupyter cells)
 *   - Clear console button
 *   - Examples panel
 *   - Webcam + image upload for model prediction
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
	let isAdvancedMode = false;

	// Webcam state
	let webcamStream = null;
	let webcamPredicting = false;
	let webcamInterval = null;
	let webcamFPS = 5;

	// Editor state
	let highlightDebounce = null;

	// Rich output cell counter
	let cellCounter = 0;

	// =========================================================================
	// DEFAULT CODE TEMPLATES
	// =========================================================================

	const TEMPLATES = {
		image_webcam: `# 📷 Live Webcam Prediction
# Click the 📷 Webcam button below to start your camera.
# This code auto-starts the webcam if not already running.

import _bridge

# Auto-start webcam if not running
if not hasattr(_bridge, '_webcam_started'):
    from js import document
    btn = document.getElementById("pyodide_webcam_btn")
    if btn:
        btn.click()
    _bridge._webcam_started = True
    print("📷 Starting webcam... Run again once camera is active.")
else:
    info = get_model_info()
    print(f"Input shape: {info['input_shape']}, Output shape: {info['output_shape']}")
    
    if input_data is not None:
        result = predict(input_data)
        print(f"Prediction: {result}")
        set_prediction_result(result)
    else:
        print("⏳ Waiting for webcam frame... Run again in a moment.")
        # Fallback: use random data to test
        sample_shape = [s if s is not None else 1 for s in info['input_shape'][1:]]
        result = predict(rand_nested(sample_shape))
        print(f"(Random fallback) Prediction: {result}")
        set_prediction_result(result)
`,
		image_upload: `# 🖼️ Image Upload Prediction
# Upload an image using the button above, then run this code.
# 'input_data' is pre-filled with the uploaded image pixels.

info = get_model_info()
print(f"Model expects: {info['input_shape']}")

result = predict(input_data)
print(f"Prediction: {result}")
set_prediction_result(result)
`,
		random_input: `# 🎲 Random Input Prediction
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
		custom_data: `# ✏️ Custom Data Prediction
# Enter your own data and predict.

info = get_model_info()
input_shape = info['input_shape']
print(f"Model expects input shape: {input_shape}")
print(f"Model output shape: {info['output_shape']}")

# Auto-generate matching input for testing:
sample_shape = [s if s is not None else 1 for s in input_shape[1:]]
my_data = rand_nested(sample_shape)

result = predict(my_data)
print(f"Result: {result}")
set_prediction_result(result)
`,
		weights_inspect: `# 🔍 Inspect Model Weights

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
            shape = []
            temp = w
            while isinstance(temp, list):
                shape.append(len(temp))
                temp = temp[0] if len(temp) > 0 else []
            print(f"  Weight {i}: shape={shape}")
        else:
            print(f"  Weight {i}: {type(w)}")
`,
		draw_chart: `# 📊 Draw a Bar Chart in the Console
# Uses the rich output canvas API

import random

# Create a canvas (width, height)
canvas = create_canvas(400, 200)
ctx = canvas.getContext("2d")

# Data
labels = ["Cat", "Dog", "Bird", "Fish", "Frog"]
values = [random.random() for _ in range(5)]
max_val = max(values)

# Background
ctx.fillStyle = "#1e1e2e"
ctx.fillRect(0, 0, 400, 200)

# Draw bars
bar_width = 60
gap = 15
start_x = 30

for i, (label, val) in enumerate(zip(labels, values)):
    x = start_x + i * (bar_width + gap)
    bar_height = (val / max_val) * 140
    y = 170 - bar_height
    
    # Bar gradient color
    hue = i * 60
    ctx.fillStyle = f"hsl({hue}, 70%, 60%)"
    ctx.fillRect(x, y, bar_width, bar_height)
    
    # Label
    ctx.fillStyle = "#cdd6f4"
    ctx.font = "11px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(label, x + bar_width/2, 190)
    
    # Value on top
    ctx.fillText(f"{val:.2f}", x + bar_width/2, y - 5)

# Title
ctx.fillStyle = "#89b4fa"
ctx.font = "bold 14px sans-serif"
ctx.textAlign = "left"
ctx.fillText("📊 Random Predictions", 10, 20)

# Display it!
display(canvas)
print("Chart drawn! ✨")
`,
		draw_canvas: `# 🎨 Custom Canvas Drawing
# Draw shapes, gradients, and patterns

import math

canvas = create_canvas(300, 300)
ctx = canvas.getContext("2d")

# Dark background
ctx.fillStyle = "#0f0f1a"
ctx.fillRect(0, 0, 300, 300)

# Draw concentric circles with rainbow colors
cx, cy = 150, 150
for i in range(20, 0, -1):
    hue = (i * 18) % 360
    ctx.beginPath()
    ctx.arc(cx, cy, i * 7, 0, 2 * math.pi)
    ctx.fillStyle = f"hsla({hue}, 80%, 50%, 0.6)"
    ctx.fill()

# Draw some stars
import random
ctx.fillStyle = "#ffffff"
for _ in range(50):
    x = random.randint(0, 300)
    y = random.randint(0, 300)
    size = random.random() * 2
    ctx.beginPath()
    ctx.arc(x, y, size, 0, 2 * math.pi)
    ctx.fill()

# Title
ctx.fillStyle = "#fff"
ctx.font = "bold 16px sans-serif"
ctx.textAlign = "center"
ctx.fillText("🌈 Rainbow Circles", 150, 25)

display(canvas)
print("Canvas art complete! 🎨")
`,
		html_table: `# 📋 Render an HTML Table
# Display rich HTML directly in the console

info = get_model_info()

# Build an HTML table of layer info
rows = ""
for i, (name, ltype) in enumerate(zip(info['layer_names'], info['layer_types'])):
    rows += f"<tr><td>{i}</td><td>{name}</td><td>{ltype}</td></tr>"

html = f"""
<div style="padding:8px;">
  <h3 style="color:#89b4fa;margin:0 0 8px 0;">🧠 Model Architecture</h3>
  <table>
    <thead>
      <tr><th>#</th><th>Layer Name</th><th>Type</th></tr>
    </thead>
    <tbody>{rows}</tbody>
  </table>
  <p style="color:#a6adc8;font-size:11px;margin-top:8px;">
    Total params: <strong style="color:#00d4aa;">{info['trainable_params'] + info['non_trainable_params']:,}</strong>
    (trainable: {info['trainable_params']:,})
  </p>
</div>
"""

display_html(html)
print("Table rendered! 📋")
`,
		pixel_art: `# 🕹️ Pixel Art Editor
# Draw pixel art on a small grid, displayed scaled up

canvas = create_canvas(256, 256)
ctx = canvas.getContext("2d")

# 16x16 pixel grid
grid_size = 16
pixel_size = 256 // grid_size

# Define a simple sprite (smiley face)
# 0=transparent, 1=yellow, 2=black, 3=red
palette = {
    0: "#0f0f1a",
    1: "#ffd93d",
    2: "#1a1a2e",
    3: "#ff6b6b",
    4: "#00d4aa"
}

sprite = [
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,2,2,1,1,1,1,2,2,1,1,1,0],
    [1,1,1,1,2,2,1,1,1,1,2,2,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,3,1,1,1,1,1,1,1,1,3,1,1,1],
    [1,1,1,1,3,1,1,1,1,1,1,3,1,1,1,1],
    [0,1,1,1,1,3,3,3,3,3,3,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
]

# Draw pixels
for y, row in enumerate(sprite):
    for x, color_idx in enumerate(row):
        ctx.fillStyle = palette.get(color_idx, "#000")
        ctx.fillRect(x * pixel_size, y * pixel_size, pixel_size, pixel_size)

# Grid lines (subtle)
ctx.strokeStyle = "rgba(255,255,255,0.05)"
ctx.lineWidth = 0.5
for i in range(grid_size + 1):
    ctx.beginPath()
    ctx.moveTo(i * pixel_size, 0)
    ctx.lineTo(i * pixel_size, 256)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i * pixel_size)
    ctx.lineTo(256, i * pixel_size)
    ctx.stroke()

display(canvas)
print("🕹️ Pixel art rendered! Try editing the sprite array.")
`,
		hello_world: `# 👋 Hello World!
# The simplest example to get started.

print("Hello, World! 🌍")
print("This is Python running in your browser!")
print()
print("Try editing this code and pressing ▶ Run (or Ctrl+Enter)")
`
	};

	const DEFAULT_CODE = TEMPLATES.hello_world;

	// =========================================================================
	// SYNTAX HIGHLIGHTING
	// =========================================================================

	const PY_KEYWORDS = new Set([
		'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
		'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
		'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
		'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
		'try', 'while', 'with', 'yield'
	]);

	const PY_BUILTINS = new Set([
		'print', 'len', 'range', 'int', 'float', 'str', 'list', 'dict',
		'tuple', 'set', 'bool', 'type', 'isinstance', 'enumerate', 'zip',
		'map', 'filter', 'sorted', 'reversed', 'abs', 'max', 'min', 'sum',
		'any', 'all', 'open', 'input', 'round', 'format', 'repr', 'id',
		'hex', 'oct', 'bin', 'chr', 'ord', 'super', 'object', 'staticmethod',
		'classmethod', 'property', 'hasattr', 'getattr', 'setattr', 'delattr',
		'vars', 'dir', 'help', 'iter', 'next', 'slice', 'Exception',
		'ValueError', 'TypeError', 'KeyError', 'IndexError', 'RuntimeError',
		'StopIteration', 'AttributeError', 'ImportError', 'NameError',
		// Custom environment functions
		'predict', 'get_model_info', 'get_weights', 'set_prediction_result',
		'rand_nested', 'create_canvas', 'display', 'display_html', 'display_image'
	]);

	const PY_CONSTANTS = new Set(['True', 'False', 'None']);

	function highlightPython(code) {
		let html = '';
		let i = 0;
		const len = code.length;

		while (i < len) {
			// Comments
			if (code[i] === '#') {
				let end = code.indexOf('\n', i);
				if (end === -1) end = len;
				html += '<span class="cm">' + escapeHtml(code.substring(i, end)) + '</span>';
				i = end;
				continue;
			}

			// f-strings and triple-quoted strings
			if (i < len - 2 && (code.substring(i, i + 3) === '"""' || code.substring(i, i + 3) === "'''")) {
				const quote = code.substring(i, i + 3);
				let end = code.indexOf(quote, i + 3);
				if (end === -1) end = len - 3;
				end += 3;
				html += '<span class="st">' + escapeHtml(code.substring(i, end)) + '</span>';
				i = end;
				continue;
			}

			// f-string prefix
			if ((code[i] === 'f' || code[i] === 'F' || code[i] === 'r' || code[i] === 'R' || code[i] === 'b' || code[i] === 'B') &&
				i + 1 < len && (code[i + 1] === '"' || code[i + 1] === "'")) {
				const prefix = code[i];
				const quoteChar = code[i + 1];
				let j = i + 2;
				while (j < len && code[j] !== quoteChar) {
					if (code[j] === '\\') j++;
					j++;
				}
				j++;
				html += '<span class="st">' + escapeHtml(code.substring(i, j)) + '</span>';
				i = j;
				continue;
			}

			// Strings (single/double quoted)
			if (code[i] === '"' || code[i] === "'") {
				const quoteChar = code[i];
				let j = i + 1;
				while (j < len && code[j] !== quoteChar) {
					if (code[j] === '\\') j++;
					j++;
				}
				j++;
				html += '<span class="st">' + escapeHtml(code.substring(i, j)) + '</span>';
				i = j;
				continue;
			}

			// Decorators
			if (code[i] === '@' && (i === 0 || code[i - 1] === '\n')) {
				let end = i + 1;
				while (end < len && /[a-zA-Z0-9_.]/.test(code[end])) end++;
				html += '<span class="dc">' + escapeHtml(code.substring(i, end)) + '</span>';
				i = end;
				continue;
			}

			// Numbers
			if (/[0-9]/.test(code[i]) && (i === 0 || /[\s\(\[\{,=:+\-*/<>!%&|^~]/.test(code[i - 1]))) {
				let end = i;
				while (end < len && /[0-9.eExXoObBa-fA-F_]/.test(code[end])) end++;
				html += '<span class="nu">' + escapeHtml(code.substring(i, end)) + '</span>';
				i = end;
				continue;
			}

			// Words (identifiers, keywords, builtins)
			if (/[a-zA-Z_]/.test(code[i])) {
				let end = i;
				while (end < len && /[a-zA-Z0-9_]/.test(code[end])) end++;
				const word = code.substring(i, end);

				if (word === 'self' || word === 'cls') {
					html += '<span class="sf">' + escapeHtml(word) + '</span>';
				} else if (PY_CONSTANTS.has(word)) {
					html += '<span class="cn">' + escapeHtml(word) + '</span>';
				} else if (PY_KEYWORDS.has(word)) {
					html += '<span class="kw">' + escapeHtml(word) + '</span>';
				} else if (PY_BUILTINS.has(word)) {
					html += '<span class="bi">' + escapeHtml(word) + '</span>';
				} else if (end < len && code[end] === '(') {
					html += '<span class="fn">' + escapeHtml(word) + '</span>';
				} else {
					html += '<span class="tx">' + escapeHtml(word) + '</span>';
				}
				i = end;
				continue;
			}

			// Operators
			if (/[+\-*/%=<>!&|^~]/.test(code[i])) {
				html += '<span class="op">' + escapeHtml(code[i]) + '</span>';
				i++;
				continue;
			}

			// Default
			html += '<span class="tx">' + escapeHtml(code[i]) + '</span>';
			i++;
		}

		return html;
	}

	function escapeHtml(text) {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	// =========================================================================
	// LINE NUMBERS (FIXED)
	// =========================================================================

	function updateLineNumbers() {
		const textarea = document.getElementById('pyodide_editor_textarea');
		const lineNumbersEl = document.getElementById('pyodide_editor_line_numbers');
		if (!textarea || !lineNumbersEl) return;

		const lineCount = textarea.value.split('\n').length;
		const numbers = [];
		for (let i = 1; i <= lineCount; i++) {
			numbers.push(i);
		}
		// Use \n joined string — the element uses white-space:pre so each \n = new line
		lineNumbersEl.textContent = numbers.join('\n');
	}

	// =========================================================================
	// HIGHLIGHT SYNC
	// =========================================================================

	function updateHighlight() {
		const textarea = document.getElementById('pyodide_editor_textarea');
		const highlightEl = document.getElementById('pyodide_editor_highlight');
		if (!textarea || !highlightEl) return;

		const code = textarea.value;
		highlightEl.innerHTML = highlightPython(code) + '\n';
		updateLineNumbers();
	}

	function scheduleHighlight() {
		if (highlightDebounce) cancelAnimationFrame(highlightDebounce);
		highlightDebounce = requestAnimationFrame(updateHighlight);
	}

	function syncScroll() {
		const textarea = document.getElementById('pyodide_editor_textarea');
		const highlightEl = document.getElementById('pyodide_editor_highlight');
		const lineNumbersEl = document.getElementById('pyodide_editor_line_numbers');
		if (!textarea) return;

		if (highlightEl) {
			highlightEl.scrollTop = textarea.scrollTop;
			highlightEl.scrollLeft = textarea.scrollLeft;
		}
		if (lineNumbersEl) {
			lineNumbersEl.style.marginTop = (-textarea.scrollTop) + 'px';
		}
	}

	// =========================================================================
	// MODE TOGGLE (Simple / Advanced)
	// =========================================================================

	function toggleMode() {
		isAdvancedMode = !isAdvancedMode;
		const wrapper = document.getElementById('pyodide_editor_wrapper');
		if (!wrapper) return;

		if (isAdvancedMode) {
			wrapper.classList.remove('pe-simple-mode');
			appendConsole("[🔀 Advanced mode enabled]\n", "info");
		} else {
			wrapper.classList.add('pe-simple-mode');
			appendConsole("[🔀 Simple mode enabled]\n", "info");
		}

		try {
			localStorage.setItem('pyodide_editor_mode', isAdvancedMode ? 'advanced' : 'simple');
		} catch (e) {}
	}

	function loadMode() {
		try {
			var saved = localStorage.getItem('pyodide_editor_mode');
			isAdvancedMode = saved === 'advanced';
		} catch (e) {
			isAdvancedMode = false;
		}

		var wrapper = document.getElementById('pyodide_editor_wrapper');
		if (wrapper) {
			if (!isAdvancedMode) {
				wrapper.classList.add('pe-simple-mode');
			} else {
				wrapper.classList.remove('pe-simple-mode');
			}
		}
	}

	// =========================================================================
	// EXAMPLES PANEL
	// =========================================================================

	function toggleExamples() {
		var panel = document.getElementById('pyodide_examples_panel');
		if (!panel) return;
		panel.classList.toggle('pe-visible');
	}

	// =========================================================================
	// RICH CONSOLE OUTPUT (Jupyter-like)
	// =========================================================================

	/**
	 * Append text to the console
	 */
	function appendConsole(text, type) {
		const output = document.getElementById("pyodide_console_output");
		if (!output) return;

		const span = document.createElement("span");
		span.style.display = "block";
		span.style.whiteSpace = "pre-wrap";
		span.style.wordWrap = "break-word";
		span.style.fontFamily = "'Fira Code', 'JetBrains Mono', 'Consolas', monospace";
		span.style.fontSize = "12px";
		span.style.lineHeight = "1.5";
		span.textContent = text;

		switch (type) {
			case "stderr": span.style.color = "#ff6b6b"; break;
			case "warn": span.style.color = "#ffd93d"; break;
			case "info": span.style.color = "#6c7086"; break;
			case "stdout": default: span.style.color = "#00ff88"; break;
		}

		output.appendChild(span);

		// Limit children
		while (output.childNodes.length > 500) {
			output.removeChild(output.firstChild);
		}
		output.scrollTop = output.scrollHeight;
	}

	/**
	 * Append a rich output cell (canvas, HTML, image) to the console
	 */
	function appendRichOutput(element) {
		const output = document.getElementById("pyodide_console_output");
		if (!output) return;

		cellCounter++;
		const cell = document.createElement("div");
		cell.className = "pe-output-cell";
		cell.setAttribute("data-cell", cellCounter);

		const label = document.createElement("div");
		label.style.fontSize = "10px";
		label.style.color = "#6c7086";
		label.style.marginBottom = "4px";
		label.textContent = "Out [" + cellCounter + "]:";
		cell.appendChild(label);

		cell.appendChild(element);
		output.appendChild(cell);
		output.scrollTop = output.scrollHeight;
	}

	/**
	 * Create a canvas element that can be drawn on from Python
	 * Returns a real DOM canvas (not yet appended — call display() to show it)
	 */
	function createCanvasForPython(width, height) {
		width = width || 300;
		height = height || 150;
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		canvas.style.borderRadius = "4px";
		canvas.style.border = "1px solid #2a2a4a";
		canvas.style.display = "block";
		canvas.style.maxWidth = "100%";
		canvas.style.background = "#000";
		return canvas;
	}

	/**
	 * Display a canvas/element in the rich console
	 */
	function displayElement(element) {
		if (!element) return;
		// If it's a canvas or any DOM element, wrap it in a cell
		if (element instanceof HTMLElement) {
			appendRichOutput(element);
		} else {
			appendConsole(String(element) + "\n", "stdout");
		}
	}

	/**
	 * Display raw HTML in the console
	 */
	function displayHtml(htmlString) {
		const wrapper = document.createElement("div");
		wrapper.className = "pe-html-output";
		wrapper.innerHTML = htmlString;
		appendRichOutput(wrapper);
	}

	/**
	 * Display an image (from URL or data URL) in the console
	 */
	function displayImage(src, width, height) {
		const img = document.createElement("img");
		img.src = src;
		if (width) img.style.width = width + "px";
		if (height) img.style.height = height + "px";
		img.style.borderRadius = "4px";
		img.style.maxWidth = "100%";
		appendRichOutput(img);
	}

	// =========================================================================
	// INITIALIZATION
	// =========================================================================

	async function initPyodide() {
		if (pyodideReady || pyodideLoading) return;
		pyodideLoading = true;
		setStatus("⏳ Loading...", "loading");

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
			setStatus("✓ Ready", "ready");
		} catch (e) {
			pyodideLoading = false;
			setStatus("✗ Failed", "error");
			appendConsole("[ERROR] Failed to initialize Pyodide: " + e.message + "\n", "stderr");
			console.error("Pyodide init error:", e);
		}
	}

	async function setupPythonEnvironment() {
		pyodideInstance.globals.set("_js_model_ref", null);
		pyodideInstance.globals.set("_js_prediction_result", null);

		// Register the bridge module with rich output support
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
			},
			// Rich output functions
			createCanvas: function (w, h) { return createCanvasForPython(w, h); },
			displayElement: function (el) { displayElement(el); },
			displayHtml: function (html) { displayHtml(html); },
			displayImage: function (src, w, h) { displayImage(src, w, h); }
		});

		var pythonSetupCode = `
import json
import random
import math
from _bridge import (getModelWeights, runPrediction, getModelInfo, 
                     setPredictionResult, getModelExists,
                     createCanvas, displayElement, displayHtml, displayImage)
from pyodide.ffi import to_js, JsProxy
input_data = None

def get_weights():
    if not getModelExists():
        raise RuntimeError('No model available. Please create/train a model first.')
    raw = getModelWeights()
    if raw is None:
        return None
    if isinstance(raw, JsProxy):
        return raw.to_py()
    return raw

def predict(data=None):
    global input_data
    if data is None:
        data = input_data
    if data is None:
        raise RuntimeError('No input data. Provide data or use webcam/upload.')
    if not getModelExists():
        raise RuntimeError('No model available. Please create/train a model first.')
    if isinstance(data, JsProxy):
        data = data.to_py()
    elif not isinstance(data, list):
        try:
            data = list(data)
        except (TypeError, ValueError):
            raise TypeError('input_data must be a list or convertible to list')
    raw = runPrediction(to_js(data, dict_converter=None))
    if raw is None:
        return None
    if isinstance(raw, JsProxy):
        return raw.to_py()
    return raw

def get_model_info():
    if not getModelExists():
        raise RuntimeError('No model available. Please create/train a model first.')
    raw = getModelInfo()
    if isinstance(raw, JsProxy):
        return raw.to_py()
    return raw

def set_prediction_result(result):
    if isinstance(result, list):
        pass
    elif isinstance(result, JsProxy):
        result = result.to_py()
    else:
        try:
            result = list(result)
        except (TypeError, ValueError):
            result = [result]
    setPredictionResult(to_js(result, dict_converter=None))

def rand_nested(shape):
    if len(shape) == 0:
        return random.random()
    if len(shape) == 1:
        return [random.random() for _ in range(shape[0])]
    return [rand_nested(shape[1:]) for _ in range(shape[0])]

# ===== RICH OUTPUT API (Jupyter-like) =====

def create_canvas(width=300, height=150):
    """Create a canvas element. Draw on it, then call display(canvas) to show it."""
    return createCanvas(width, height)

def display(obj):
    """Display a canvas or other element in the console output."""
    if obj is None:
        print("(None)")
        return
    if isinstance(obj, JsProxy):
        displayElement(obj)
    elif isinstance(obj, (list, dict)):
        display_html("<pre>" + json.dumps(obj, indent=2, default=str) + "</pre>")
    else:
        print(str(obj))

def display_html(html_str):
    """Render raw HTML in the console output (like Jupyter)."""
    displayHtml(html_str)

def display_image(src, width=None, height=None):
    """Display an image from a URL or data URL in the console."""
    displayImage(src, width or 0, height or 0)

print('🐍 Python environment ready!')
print('📦 Functions: predict(), get_model_info(), get_weights(), rand_nested(shape)')
print('🎨 Rich output: create_canvas(w,h), display(canvas), display_html(html), display_image(url)')
`;

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
				layer_names: model.layers.map(function (l) { return l.name; }),
				layer_types: model.layers.map(function (l) { return l.getClassName(); }),
				trainable_params: 0,
				non_trainable_params: 0
			};

			if (model.weights) {
				for (let i = 0; i < model.weights.length; i++) {
					var w = model.weights[i];
					var count = w.shape.reduce(function (a, b) { return a * b; }, 1);
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
		const btnSimple = document.getElementById("pyodide_webcam_btn_simple");
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
				btn.innerHTML = "⏹ Stop Webcam";
				btn.onclick = stopWebcam;
			}
			if (btnSimple) {
				btnSimple.innerHTML = "⏹ Stop Cam";
				btnSimple.onclick = stopWebcam;
			}

			video.onloadedmetadata = function () {
				appendConsole("[📷 Webcam started: " + video.videoWidth + "x" + video.videoHeight + "]\n", "info");
				startWebcamPredictionLoop();
			};
		} catch (e) {
			appendConsole("[Webcam Error] " + e.message + "\n", "stderr");
			if (e.name === "NotAllowedError") {
				appendConsole("[Hint] Camera permission denied.\n", "info");
			} else if (e.name === "NotFoundError") {
				appendConsole("[Hint] No camera found.\n", "info");
			}
		}
	}

	function stopWebcam() {
		const video = document.getElementById("pyodide_webcam_video");
		const btn = document.getElementById("pyodide_webcam_btn");
		const btnSimple = document.getElementById("pyodide_webcam_btn_simple");

		if (webcamInterval) {
			clearInterval(webcamInterval);
			webcamInterval = null;
		}
		if (webcamStream) {
			webcamStream.getTracks().forEach(function (track) { track.stop(); });
			webcamStream = null;
		}
		if (video) video.srcObject = null;

		var container = document.getElementById("pyodide_webcam_container");
		if (container) container.style.display = "none";

		if (btn) {
			btn.innerHTML = "📷 Webcam";
			btn.onclick = startWebcam;
		}
		if (btnSimple) {
			btnSimple.innerHTML = "📷 Webcam";
			btnSimple.onclick = startWebcam;
		}
		webcamPredicting = false;
		appendConsole("[Webcam stopped]\n", "info");
	}

	function startWebcamPredictionLoop() {
		if (webcamInterval) clearInterval(webcamInterval);

		webcamInterval = setInterval(async function () {
			if (webcamPredicting || !webcamStream) return;
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
		if (el && parseFloat(el.value) > 0) return parseFloat(el.value);
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
		reader.onload = function (e) {
			var img = new Image();
			img.onload = function () {
				displayUploadedImage(img);
				processUploadedImage(img);
			};
			img.onerror = function () {
				appendConsole("[Error] Failed to load image.\n", "stderr");
			};
			img.src = e.target.result;
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
			if (!pyodideReady) return;
		}

		var info = getModelInfoForPython();
		if (!info || !info.input_shape) {
			appendConsole("[Error] No model loaded.\n", "stderr");
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

		appendConsole("[🖼️ Image: " + img.width + "x" + img.height + " → " + targetW + "x" + targetH + "x" + channels + "]\n", "info");

		try {
			pyodideInstance.globals.set("input_data", pyodideInstance.toPy(inputList));
			await pyodideEditorRun();
		} catch (e) {
			appendConsole("[Error] " + e.message + "\n", "stderr");
		}
	}

	// =========================================================================
	// EXECUTION
	// =========================================================================

	async function pyodideEditorRun() {
		if (isRunning) {
			appendConsole("[⏳ Already running...]\n", "warn");
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
			appendConsole("[⏳ Initializing Pyodide...]\n", "info");
			await initPyodide();
			if (!pyodideReady) {
				appendConsole("[ERROR] Pyodide failed to initialize.\n", "stderr");
				return;
			}
		}

		isRunning = true;
		runCounter++;
		const thisRun = runCounter;

		const stopBtn = document.getElementById("pyodide_stop_btn");
		if (stopBtn) stopBtn.disabled = false;

		setStatus("⚡ Running...", "loading");
		hideErrorIndicator();

		appendConsole("\n─── Run #" + thisRun + " ───\n", "info");

		try {
			await refreshModelInPython();
			await pyodideInstance.runPythonAsync(code);

			if (isRunning && thisRun === runCounter) {
				appendConsole("─── ✓ Done ───\n", "info");
				setStatus("✓ Ready", "ready");
			}
		} catch (e) {
			if (thisRun === runCounter) {
				handlePythonError(e);
			}
		} finally {
			if (thisRun === runCounter) {
				isRunning = false;
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
		appendConsole("\n[⏹ Stopped]\n", "warn");
		setStatus("✓ Ready", "ready");

		const stopBtn = document.getElementById("pyodide_stop_btn");
		if (stopBtn) stopBtn.disabled = true;
	}

	function pyodideEditorClear() {
		const output = document.getElementById("pyodide_console_output");
		if (output) output.innerHTML = "";
		hideErrorIndicator();
		hidePredictionResults();
	}

	async function pyodideEditorReset() {
		if (isRunning) pyodideEditorStop();

		pyodideReady = false;
		pyodideLoading = false;
		pyodideInstance = null;
		lastPredictionResult = null;
		cellCounter = 0;

		appendConsole("\n[🔄 Runtime reset]\n", "info");
		setStatus("⏳ Not loaded", "loading");
		hidePredictionResults();

		await initPyodide();
	}

	// =========================================================================
	// TEMPLATE & FPS
	// =========================================================================

	function loadTemplate(name) {
		const textarea = document.getElementById("pyodide_editor_textarea");
		if (!textarea || !TEMPLATES[name]) return;
		textarea.value = TEMPLATES[name];
		saveEditorContent();
		scheduleHighlight();
		appendConsole("[📄 Loaded template: " + name + "]\n", "info");

		// Close examples panel after selection
		var panel = document.getElementById('pyodide_examples_panel');
		if (panel) panel.classList.remove('pe-visible');
	}

	function setWebcamFPS(fps) {
		webcamFPS = Math.max(1, Math.min(15, parseInt(fps) || 5));
		var label = document.getElementById("pyodide_fps_label");
		if (label) label.textContent = webcamFPS + " FPS";
		if (webcamStream && webcamInterval) startWebcamPredictionLoop();
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
			if (!livePredictEnabled || isRunning) return;

			clearTimeout(livePredictDebounceTimer);
			livePredictDebounceTimer = setTimeout(async function () {
				if (!livePredictEnabled || isRunning) return;
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
			await pyodideInstance.runPythonAsync(
				"import _bridge\nif not _bridge.getModelExists():\n    print('[⚠️ No model available]')"
			);
		} catch (e) {
			console.warn("refreshModelInPython:", e);
		}
	}

	// =========================================================================
	// ERROR HANDLING
	// =========================================================================

	function handlePythonError(e) {
		let errorMsg = e && e.message ? e.message : String(e);
		let formattedError = errorMsg.includes("Traceback") ? errorMsg :
			errorMsg.includes("PythonError") ? errorMsg.replace("PythonError: ", "") :
			"Error: " + errorMsg;

		appendConsole(formattedError + "\n", "stderr");
		showErrorIndicator();
		setStatus("✗ Error", "error");

		var hints = getErrorHints(errorMsg);
		if (hints) appendConsole("[💡 Hint] " + hints + "\n", "info");
	}

	function getErrorHints(errorMsg) {
		if (errorMsg.includes("No model available")) return "Create a model first using the visual editor.";
		if (errorMsg.includes("IndentationError")) return "Check indentation — use 4 spaces.";
		if (errorMsg.includes("ModuleNotFoundError")) {
			var match = errorMsg.match(/No module named '([^']+)'/);
			return match ? "Module '" + match[1] + "' not available in Pyodide browser runtime." : null;
		}
		if (errorMsg.includes("shape")) return "Shape mismatch. Use get_model_info() to check expected shapes.";
		if (errorMsg.includes("NameError")) return "Variable not defined. Check for typos or run cells in order.";
		if (errorMsg.includes("TypeError")) return "Wrong argument type. Check function signatures.";
		return null;
	}

	// =========================================================================
	// UI HELPERS
	// =========================================================================

	function appendConsole(text, type) {
		const output = document.getElementById("pyodide_console_output");
		if (!output) return;

		const span = document.createElement("span");
		span.style.display = "inline";
		span.textContent = text;

		switch (type) {
			case "stderr": span.style.color = "#ff6b6b"; break;
			case "warn": span.style.color = "#ffd93d"; break;
			case "info": span.style.color = "#6c7086"; break;
			case "stdout": default: span.style.color = "#00ff88"; break;
		}

		output.appendChild(span);

		while (output.childNodes.length > 500) {
			output.removeChild(output.firstChild);
		}
		output.scrollTop = output.scrollHeight;
	}

	function appendRichOutput(element) {
		const output = document.getElementById("pyodide_console_output");
		if (!output) return;

		cellCounter++;
		const cell = document.createElement("div");
		cell.className = "pe-output-cell";
		cell.setAttribute("data-cell", cellCounter);

		const label = document.createElement("div");
		label.style.cssText = "font-size:10px;color:#6c7086;margin-bottom:4px;font-weight:600;";
		label.textContent = "Out [" + cellCounter + "]:";
		cell.appendChild(label);
		cell.appendChild(element);

		output.appendChild(cell);
		output.scrollTop = output.scrollHeight;
	}

	function createCanvasForPython(width, height) {
		width = width || 300;
		height = height || 150;
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		canvas.style.cssText = "border-radius:4px;border:1px solid #2a2a4a;display:block;max-width:100%;background:#000;";
		return canvas;
	}

	function displayElement(element) {
		if (!element) return;
		if (element instanceof HTMLElement) {
			appendRichOutput(element);
		} else if (typeof element === "object" && element.tagName) {
			// JsProxy wrapping a DOM element
			appendRichOutput(element);
		} else {
			appendConsole(String(element) + "\n", "stdout");
		}
	}

	function displayHtml(htmlString) {
		const wrapper = document.createElement("div");
		wrapper.className = "pe-html-output";
		wrapper.innerHTML = htmlString;
		appendRichOutput(wrapper);
	}

	function displayImage(src, width, height) {
		const img = document.createElement("img");
		img.src = src;
		if (width) img.style.width = width + "px";
		if (height) img.style.height = height + "px";
		img.style.cssText += "border-radius:4px;max-width:100%;display:block;";
		appendRichOutput(img);
	}

	function setStatus(text, type) {
		var el = document.getElementById("pyodide_status");
		if (!el) return;
		el.textContent = text;
		el.className = 'pe-badge';
		switch (type) {
			case "ready": el.className += ' pe-badge-ready'; break;
			case "error": el.className += ' pe-badge-error'; break;
			case "loading": default: el.className += ' pe-badge-loading'; break;
		}
	}

	function showErrorIndicator() {
		var el = document.getElementById("pyodide_error_indicator");
		if (el) el.style.display = "inline-flex";
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
		lines.push("🎯 Prediction (" + result.length + " outputs):");
		lines.push("─".repeat(40));

		var labelsList = [];
		try {
			if (typeof labels !== "undefined" && Array.isArray(labels)) {
				labelsList = labels;
			}
		} catch (e) { }

		var indexed = result.map(function (val, idx) {
			return {
				index: idx,
				value: typeof val === "number" ? val : parseFloat(val),
				label: labelsList[idx] || ("Output " + idx)
			};
		});

		var sorted = indexed.slice().sort(function (a, b) { return b.value - a.value; });

		var sum = indexed.reduce(function (s, v) { return s + v.value; }, 0);
		var looksLikeProbabilities = indexed.every(function (v) {
			return v.value >= 0 && v.value <= 1;
		}) && Math.abs(sum - 1.0) < 0.05;

		if (looksLikeProbabilities) {
			lines.push("(sorted by confidence)");
			for (var i = 0; i < sorted.length; i++) {
				var item = sorted[i];
				var pct = (item.value * 100).toFixed(2);
				var bar = "█".repeat(Math.round(item.value * 20));
				var emoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
				lines.push(emoji + " " + item.label.padEnd(18) + " " + pct.padStart(7) + "%  " + bar);
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
	// EDITOR PERSISTENCE
	// =========================================================================

	function saveEditorContent() {
		var textarea = document.getElementById("pyodide_editor_textarea");
		if (textarea) {
			try {
				localStorage.setItem("pyodide_editor_content", textarea.value);
			} catch (e) { }
		}
	}

	function loadEditorContent() {
		var textarea = document.getElementById("pyodide_editor_textarea");
		if (!textarea) return;

		try {
			var saved = localStorage.getItem("pyodide_editor_content");
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
	// EDITOR KEY HANDLERS & SETUP
	// =========================================================================

	function setupEditorKeyHandlers() {
		var textarea = document.getElementById("pyodide_editor_textarea");
		if (!textarea) return;

		textarea.addEventListener("input", scheduleHighlight);
		textarea.addEventListener("scroll", syncScroll);

		textarea.addEventListener("keydown", function (e) {
			// Tab handling
			if (e.key === "Tab") {
				e.preventDefault();
				var start = this.selectionStart;
				var end = this.selectionEnd;
				var value = this.value;

				if (e.shiftKey) {
					// Dedent
					var beforeSelection = value.substring(0, start);
					var lineStart = beforeSelection.lastIndexOf("\n") + 1;
					var textToProcess = value.substring(lineStart, end);
					var lines = textToProcess.split("\n");
					var removedChars =
 0;
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

					this.value = value.substring(0, lineStart) + dedentedLines.join("\n") + value.substring(end);
					this.selectionStart = Math.max(lineStart, start - firstLineRemoved);
					this.selectionEnd = end - removedChars;
				} else if (start !== end) {
					// Indent selection
					var beforeSel = value.substring(0, start);
					var ls = beforeSel.lastIndexOf("\n") + 1;
					var proc = value.substring(ls, end);
					var lns = proc.split("\n");
					var indented = lns.map(function(line) { return "    " + line; });

					this.value = value.substring(0, ls) + indented.join("\n") + value.substring(end);
					this.selectionStart = start + 4;
					this.selectionEnd = end + (lns.length * 4);
				} else {
					// Insert 4 spaces
					this.value = value.substring(0, start) + "    " + value.substring(end);
					this.selectionStart = this.selectionEnd = start + 4;
				}
				scheduleHighlight();
				return;
			}

			// Enter - auto indent
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
				scheduleHighlight();
				return;
			}

			// Ctrl+Enter - run
			if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				pyodideEditorRun();
				return;
			}

			// Ctrl+S - save
			if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				saveEditorContent();
				appendConsole("[💾 Saved to browser storage]\n", "info");
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
				scheduleHighlight();
				return;
			}
		});

		// Auto-close brackets when wrapping selection
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
					scheduleHighlight();
				}
			}
		});

		// Load content and do initial highlight
		loadEditorContent();
		loadMode();
		scheduleHighlight();
	}

	// =========================================================================
	// INITIALIZATION ON DOM READY
	// =========================================================================

	function initWhenReady() {
		setupEditorKeyHandlers();
		setupLivePredictions();

		// Watch for tab visibility to auto-init Pyodide
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

		// Auto-save every 30 seconds
		setInterval(saveEditorContent, 30000);
	}

	// =========================================================================
	// PUBLIC API FUNCTIONS (were missing!)
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
		setStatus("📦 Loading...", "loading");
		appendConsole("[Loading packages: " + pkgList.join(", ") + "]\n", "info");

		try {
			await pyodideInstance.loadPackage(pkgList);
			appendConsole("[✓ Packages loaded]\n", "info");
			setStatus("✓ Ready", "ready");
		} catch (e) {
			appendConsole("[✗ Failed: " + e.message + "]\n", "stderr");
			setStatus("✓ Ready", "ready");
			throw e;
		}
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
	window.pyodideToggleMode = toggleMode;
	window.pyodideToggleExamples = toggleExamples;

	window.PyodideEditor = {
		getLastPrediction: getLastPyodidePrediction,
		clearPrediction: clearPyodidePrediction,
		isReady: isPyodideReady,
		isRunning: isPyodideRunning,
		runCode: runPythonCode,
		loadPackage: loadPyodidePackage,
		init: initPyodide,
		startWebcam: startWebcam,
		stopWebcam: stopWebcam,
		displayHtml: displayHtml,
		displayImage: displayImage,
		appendRichOutput: appendRichOutput,
		createCanvas: createCanvasForPython
	};

})();
