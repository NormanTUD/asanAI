"use strict";

/**
 * Pyodide Editor Module — v3 (Fixed & Enhanced)
 * 
 * Fixes:
 *   - Stop button now actually stops webcam + sets interrupt flag
 *   - Webcam auto-starts when selecting webcam template
 *   - input_data is set in Python from webcam frames
 *   - Live prediction text shown in console (throttled)
 *   - Prediction results bar no longer overflows
 *   - Removed random fallback — shows clear waiting state instead
 *   - Removed unnecessary pe-dot-red/yellow/green
 * 
 * Convenience additions:
 *   - Auto-run on template load (optional)
 *   - Webcam auto-starts on template select
 *   - Keyboard shortcut Ctrl+Shift+W to toggle webcam
 *   - Keyboard shortcut Escape to stop
 *   - Status bar shows FPS counter during webcam
 *   - Copy output to clipboard button
 *   - Download output as text
 *   - Fullscreen editor toggle
 *   - Snippet insertion menu
 *   - Auto-save indicator
 *   - Word wrap toggle
 *   - Font size controls
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
	let isFullscreen = false;
	let wordWrap = true;
	let editorFontSize = 13;

	// Webcam state
	let webcamStream = null;
	let webcamPredicting = false;
	let webcamInterval = null;
	let webcamFPS = 5;
	let webcamFrameCount = 0;
	let webcamFPSDisplay = 0;
	let webcamFPSTimer = null;

	// Editor state
	let highlightDebounce = null;
	let autoSaveTimer = null;
	let lastSaveTime = 0;

	// Rich output cell counter
	let cellCounter = 0;

	// Interrupt flag for stopping execution
	let interruptExecution = false;

	// =========================================================================
	// DEFAULT CODE TEMPLATES
	// =========================================================================

const TEMPLATES = {
    image_webcam: `# 📷 Live Webcam Prediction
# This script runs on EVERY frame from the webcam.
# Uses class labels automatically when available.

# Initialize once (persists across frames)
if 'frame_count' not in dir():
    frame_count = 0
    info = get_model_info()
    print(f"Model: {info['input_shape']} → {info['output_shape']}")
    print(f"Layers: {info['num_layers']}, Params: {info['trainable_params']:,}")
    # Get labels from JS environment
    class_labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    if class_labels and is_classif:
        print(f"Labels: {list(class_labels)}")
    print()

if input_data is not None:
    frame_count += 1
    result = predict(input_data)
    set_prediction_result(result)

    # Show top prediction
    if isinstance(result, list) and len(result) > 1:
        top_idx = result.index(max(result))
        confidence = result[top_idx] * 100
        # Use label name if classification
        if class_labels and is_classif and top_idx < len(class_labels):
            label_name = class_labels[top_idx]
        else:
            label_name = f"Class {top_idx}"
        if frame_count % 5 == 0:
            print(f"Frame {frame_count} | 🏆 {label_name} ({confidence:.1f}%)")
else:
    print("⏳ Waiting for webcam frame...")
`,
    image_webcam_tracking: `# 📷 Webcam + Confidence Tracking
# Tracks predictions over time and detects stable classifications.

if 'frame_count' not in dir():
    frame_count = 0
    history = []
    stable_count = 0
    last_class = -1
    STABILITY_THRESHOLD = 10
    info = get_model_info()
    num_classes = info['output_shape'][-1] if info['output_shape'] else 0
    class_labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    print(f"🧠 Model: {info['input_shape']} → {num_classes} classes")
    if class_labels and is_classif:
        print(f"   Labels: {list(class_labels)}")
    print(f"   Tracking stability over {STABILITY_THRESHOLD} frames")
    print()

def get_label(idx):
    if class_labels and is_classif and idx < len(class_labels):
        return class_labels[idx]
    return f"Class {idx}"

if input_data is not None:
    frame_count += 1
    result = predict(input_data)
    set_prediction_result(result)

    if isinstance(result, list) and len(result) > 1:
        top_idx = result.index(max(result))
        confidence = result[top_idx]
        history.append({'class': top_idx, 'conf': confidence})

        if len(history) > 60:
            history = history[-60:]

        if top_idx == last_class:
            stable_count += 1
        else:
            stable_count = 1
            last_class = top_idx

        if stable_count == STABILITY_THRESHOLD:
            avg_conf = sum(h['conf'] for h in history[-STABILITY_THRESHOLD:]) / STABILITY_THRESHOLD
            print(f"🔒 STABLE: {get_label(top_idx)} for {STABILITY_THRESHOLD} frames (avg {avg_conf*100:.1f}%)")

        if frame_count % 15 == 0:
            avg_conf = sum(h['conf'] for h in history[-15:]) / min(len(history), 15)
            print(f"📊 Frame {frame_count} | Current: {get_label(top_idx)} | Avg conf: {avg_conf*100:.1f}% | Stable: {stable_count}")
`,
    image_webcam_threshold: `# 📷 Webcam + Threshold Alerts
# Only prints when confidence exceeds a threshold.

if 'frame_count' not in dir():
    frame_count = 0
    alert_count = 0
    HIGH_THRESHOLD = 0.85
    LOW_THRESHOLD = 0.30
    info = get_model_info()
    class_labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    print(f"🧠 Model: {info['input_shape']} → {info['output_shape']}")
    if class_labels and is_classif:
        print(f"   Labels: {list(class_labels)}")
    print(f"⚙️  High threshold: {HIGH_THRESHOLD*100:.0f}%")
    print(f"⚙️  Low threshold: {LOW_THRESHOLD*100:.0f}%")
    print()

def get_label(idx):
    if class_labels and is_classif and idx < len(class_labels):
        return class_labels[idx]
    return f"Class {idx}"

if input_data is not None:
    frame_count += 1
    result = predict(input_data)
    set_prediction_result(result)

    if isinstance(result, list) and len(result) > 1:
        top_idx = result.index(max(result))
        confidence = result[top_idx]

        if confidence >= HIGH_THRESHOLD:
            alert_count += 1
            print(f"🚨 HIGH [{frame_count}]: {get_label(top_idx)} at {confidence*100:.1f}% (alert #{alert_count})")
        elif confidence <= LOW_THRESHOLD:
            print(f"🤷 LOW  [{frame_count}]: Best guess {get_label(top_idx)} at {confidence*100:.1f}%")
`,
    image_webcam_multiclass: `# 📷 Webcam + Multi-Class Monitor
# Monitors all classes and reports when any class spikes.

if 'frame_count' not in dir():
    frame_count = 0
    class_peaks = {}
    info = get_model_info()
    num_classes = info['output_shape'][-1] if info['output_shape'] else 0
    class_labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    print(f"🧠 Monitoring {num_classes} classes")
    if class_labels and is_classif:
        print(f"   Labels: {list(class_labels)}")
    print(f"   Will report when any class exceeds its previous peak")
    print()
    for i in range(num_classes):
        class_peaks[i] = 0.0

def get_label(idx):
    if class_labels and is_classif and idx < len(class_labels):
        return class_labels[idx]
    return f"Class {idx}"

if input_data is not None:
    frame_count += 1
    result = predict(input_data)
    set_prediction_result(result)

    if isinstance(result, list) and len(result) > 1:
        for idx, conf in enumerate(result):
            if conf > class_peaks[idx] + 0.1:
                class_peaks[idx] = conf
                print(f"📈 NEW PEAK [{frame_count}]: {get_label(idx)} → {conf*100:.1f}%")

        if frame_count % 30 == 0:
            print(f"\\n--- Frame {frame_count} Summary ---")
            for idx in sorted(class_peaks, key=class_peaks.get, reverse=True):
                bar = "█" * int(class_peaks[idx] * 20)
                print(f"  {get_label(idx):12s}: {class_peaks[idx]*100:.1f}% {bar}")
            print()
`,
    image_webcam_smoothed: `# 📷 Webcam + Smoothed Predictions
# Averages predictions over a sliding window to reduce noise.

if 'frame_count' not in dir():
    frame_count = 0
    window_size = 10
    prediction_buffer = []
    info = get_model_info()
    num_classes = info['output_shape'][-1] if info['output_shape'] else 0
    class_labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    print(f"🧠 Model: {num_classes} classes")
    if class_labels and is_classif:
        print(f"   Labels: {list(class_labels)}")
    print(f"📊 Smoothing window: {window_size} frames")
    print()

def get_label(idx):
    if class_labels and is_classif and idx < len(class_labels):
        return class_labels[idx]
    return f"Class {idx}"

if input_data is not None:
    frame_count += 1
    result = predict(input_data)

    if isinstance(result, list) and len(result) > 1:
        prediction_buffer.append(result)
        if len(prediction_buffer) > window_size:
            prediction_buffer = prediction_buffer[-window_size:]

        num_cls = len(result)
        smoothed = [0.0] * num_cls
        for pred in prediction_buffer:
            for i in range(num_cls):
                smoothed[i] += pred[i]
        smoothed = [s / len(prediction_buffer) for s in smoothed]

        set_prediction_result(smoothed)

        top_idx = smoothed.index(max(smoothed))
        confidence = smoothed[top_idx]

        if frame_count % 10 == 0:
            raw_top = result.index(max(result))
            raw_conf = result[raw_top]
            print(f"Frame {frame_count} | Raw: {get_label(raw_top)} ({raw_conf*100:.1f}%) | Smoothed: {get_label(top_idx)} ({confidence*100:.1f}%)")
`,
    image_upload: `# 🖼️ Image Upload Prediction
# Upload an image using the 📁 button above, then run this code.

info = get_model_info()
class_labels = _labels if '_labels' in dir() and _labels else None
is_classif = _is_classification if '_is_classification' in dir() else False
print(f"Model expects: {info['input_shape']}")
if class_labels and is_classif:
    print(f"Labels: {list(class_labels)}")
print()

def get_label(idx):
    if class_labels and is_classif and idx < len(class_labels):
        return class_labels[idx]
    return f"Class {idx}"

if input_data is None:
    print("⚠️  No image uploaded yet!")
    print("   Click '📁 Upload Image' above and select an image file.")
else:
    print("🖼️  Image loaded into input_data")
    result = predict(input_data)
    print(f"\\n🎯 Prediction: {result}")
    set_prediction_result(result)

    if isinstance(result, list) and len(result) > 1:
        top_idx = result.index(max(result))
        confidence = result[top_idx] * 100
        print(f"🏆 Top: {get_label(top_idx)} ({confidence:.1f}%)")
        print()
        # Show all classes sorted
        indexed = sorted(enumerate(result), key=lambda x: x[1], reverse=True)
        for idx, conf in indexed:
            bar = "█" * int(conf * 20)
            print(f"  {get_label(idx):12s} {conf*100:5.1f}% {bar}")
`,
    random_input: `# 🎲 Random Input Prediction
# Generates random data matching your model's input shape.

info = get_model_info()
class_labels = _labels if '_labels' in dir() and _labels else None
is_classif = _is_classification if '_is_classification' in dir() else False
print(f"🧠 Model Summary")
print(f"   Layers: {info['num_layers']}")
print(f"   Input:  {info['input_shape']}")
print(f"   Output: {info['output_shape']}")
print(f"   Params: {info['trainable_params']:,} trainable")
if class_labels and is_classif:
    print(f"   Labels: {list(class_labels)}")
print()

def get_label(idx):
    if class_labels and is_classif and idx < len(class_labels):
        return class_labels[idx]
    return f"Class {idx}"

input_shape = info['input_shape']
sample_shape = [s if s is not None else 1 for s in input_shape[1:]]
print(f"📐 Sample shape: {sample_shape}")

input_list = rand_nested(sample_shape)
result = predict(input_list)
print(f"\\n🎯 Prediction: {result}")
set_prediction_result(result)

if isinstance(result, list) and len(result) > 1:
    top_idx = result.index(max(result))
    confidence = result[top_idx] * 100
    print(f"🏆 Top: {get_label(top_idx)} ({confidence:.1f}%)")
`,
    custom_data: `# ✏️ Custom Data Prediction
# Enter your own data and predict.

info = get_model_info()
input_shape = info['input_shape']
class_labels = _labels if '_labels' in dir() and _labels else None
is_classif = _is_classification if '_is_classification' in dir() else False
print(f"Model expects input shape: {input_shape}")
print(f"Model output shape: {info['output_shape']}")
if class_labels and is_classif:
    print(f"Labels: {list(class_labels)}")
print()

def get_label(idx):
    if class_labels and is_classif and idx < len(class_labels):
        return class_labels[idx]
    return f"Class {idx}"

# Auto-generate matching input for testing:
sample_shape = [s if s is not None else 1 for s in input_shape[1:]]
print(f"Generating test data with shape: {sample_shape}")
my_data = rand_nested(sample_shape)

# You can replace my_data with your own values:
# my_data = [[0.1, 0.5, 0.3, ...]]

result = predict(my_data)
print(f"\\n🎯 Result: {result}")
set_prediction_result(result)

if isinstance(result, list) and len(result) > 1:
    top_idx = result.index(max(result))
    confidence = result[top_idx] * 100
    print(f"🏆 Top: {get_label(top_idx)} ({confidence:.1f}%)")
`,
    weights_inspect: `# 🔍 Inspect Model Weights

info = get_model_info()
print("🧠 Model Architecture")
print("=" * 50)
print(f"  Layers:          {info['num_layers']}")
print(f"  Input shape:     {info['input_shape']}")
print(f"  Output shape:    {info['output_shape']}")
print(f"  Trainable:       {info['trainable_params']:,}")
print(f"  Non-trainable:   {info['non_trainable_params']:,}")
print(f"  Total params:    {info['trainable_params'] + info['non_trainable_params']:,}")
print()

class_labels = _labels if '_labels' in dir() and _labels else None
is_classif = _is_classification if '_is_classification' in dir() else False
if class_labels and is_classif:
    print(f"  Classification labels: {list(class_labels)}")
    print()

print("📋 Layer Details")
print("-" * 50)
for i, (name, ltype) in enumerate(zip(info['layer_names'], info['layer_types'])):
    print(f"  [{i}] {ltype:20s} → {name}")
print()

weights = get_weights()
if weights:
    print("⚖️  Weight Tensors")
    print("-" * 50)
    total_values = 0
    for i, w in enumerate(weights):
        if isinstance(w, list):
            shape = []
            temp = w
            while isinstance(temp, list):
                shape.append(len(temp))
                temp = temp[0] if len(temp) > 0 else []
            size = 1
            for s in shape:
                size *= s
            total_values += size
            print(f"  Weight {i}: shape={shape} ({size:,} values)")
        else:
            print(f"  Weight {i}: {type(w)}")
    print(f"\\n  Total weight values: {total_values:,}")
`,
    draw_chart: `# 📊 Draw a Bar Chart in the Console
# Uses the rich output canvas API

import random

# Create a canvas (width, height)
canvas = create_canvas(420, 220)
ctx = canvas.getContext("2d")

# Use model labels if available, otherwise defaults
class_labels = _labels if '_labels' in dir() and _labels else None
is_classif = _is_classification if '_is_classification' in dir() else False

if class_labels and is_classif:
    chart_labels = list(class_labels)
else:
    chart_labels = ["Cat", "Dog", "Bird", "Fish", "Frog"]

values = [random.random() for _ in range(len(chart_labels))]
max_val = max(values)

# Background
ctx.fillStyle = "#1e1e2e"
ctx.fillRect(0, 0, 420, 220)

# Draw bars
num_bars = len(chart_labels)
total_width = 380
bar_width = max(20, (total_width - (num_bars - 1) * 8) // num_bars)
gap = 8
start_x = (420 - (num_bars * bar_width + (num_bars - 1) * gap)) // 2

for i, (label, val) in enumerate(zip(chart_labels, values)):
    x = start_x + i * (bar_width + gap)
    bar_height = (val / max_val) * 150
    y = 185 - bar_height

    hue = i * (360 // num_bars)
    ctx.fillStyle = f"hsl({hue}, 70%, 60%)"
    ctx.fillRect(x, y, bar_width, bar_height)

    if val == max_val:
        ctx.strokeStyle = "#fff"
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, bar_width, bar_height)

    ctx.fillStyle = "#cdd6f4"
    ctx.font = "10px sans-serif"
    ctx.textAlign = "center"
    # Truncate label if too long
    short_label = label[:7] if len(label) > 7 else label
    ctx.fillText(short_label, x + bar_width/2, 202)
    ctx.fillText(f"{val:.2f}", x + bar_width/2, y - 8)

ctx.fillStyle = "#89b4fa"
ctx.font = "bold 14px sans-serif"
ctx.textAlign = "left"
ctx.fillText("📊 Random Predictions", 10, 22)

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
    bg = "rgba(108,99,255,0.05)" if i % 2 == 0 else "transparent"
    rows += f'<tr style="background:{bg}"><td>{i}</td><td>{name}</td><td>{ltype}</td></tr>'

class_labels = _labels if '_labels' in dir() and _labels else None
is_classif = _is_classification if '_is_classification' in dir() else False
labels_html = ""
if class_labels and is_classif:
    labels_html = f'<p style="color:#a6adc8;font-size:11px;">Labels: <strong style="color:#89b4fa;">{", ".join(class_labels)}</strong></p>'

html = f"""
<div style="padding:8px;">
  <h3 style="color:#89b4fa;margin:0 0 8px 0;">🧠 Model Architecture</h3>
  <table style="width:100%;">
    <thead>
      <tr><th>#</th><th>Layer Name</th><th>Type</th></tr>
    </thead>
    <tbody>{rows}</tbody>
  </table>
  <p style="color:#a6adc8;font-size:11px;margin-top:8px;">
    Total params: <strong style="color:#00d4aa;">{info['trainable_params'] + info['non_trainable_params']:,}</strong>
    (trainable: {info['trainable_params']:,})
  </p>
  {labels_html}
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
print("This is Python running in your browser via Pyodide!")
print()
print("Try editing this code and pressing ▶ Run (or Ctrl+Enter)")
print()
print("Available functions:")
print("  predict(data)        — Run model prediction")
print("  get_model_info()     — Get model architecture info")
print("  get_weights()        — Get model weights")
print("  rand_nested(shape)   — Generate random nested list")
print("  create_canvas(w, h)  — Create a drawable canvas")
print("  display(canvas)      — Show canvas in console")
print("  display_html(html)   — Render HTML in console")
print("  display_image(url)   — Show image in console")
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

			// Triple-quoted strings
			if (i < len - 2 && (code.substring(i, i + 3) === '"""' || code.substring(i, i + 3) === "'''")) {
				const quote = code.substring(i, i + 3);
				let end = code.indexOf(quote, i + 3);
				if (end === -1) end = len - 3;
				end += 3;
				html += '<span class="st">' + escapeHtml(code.substring(i, end)) + '</span>';
				i = end;
				continue;
			}

			// f-string / r-string / b-string prefix
			if ((code[i] === 'f' || code[i] === 'F' || code[i] === 'r' || code[i] === 'R' || code[i] === 'b' || code[i] === 'B') &&
				i + 1 < len && (code[i + 1] === '"' || code[i + 1] === "'")) {
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
	// LINE NUMBERS
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
	// FULLSCREEN TOGGLE
	// =========================================================================

	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
		const wrapper = document.getElementById('pyodide_editor_wrapper');
		if (!wrapper) return;

		if (isFullscreen) {
			wrapper.classList.add('pe-fullscreen');
			document.body.style.overflow = 'hidden';
		} else {
			wrapper.classList.remove('pe-fullscreen');
			document.body.style.overflow = '';
		}
	}

	// =========================================================================
	// FONT SIZE CONTROLS
	// =========================================================================

	function changeFontSize(delta) {
		editorFontSize = Math.max(10, Math.min(20, editorFontSize + delta));
		const textarea = document.getElementById('pyodide_editor_textarea');
		const highlight = document.getElementById('pyodide_editor_highlight');
		const lineNums = document.getElementById('pyodide_editor_line_numbers');

		[textarea, highlight, lineNums].forEach(function(el) {
			if (el) el.style.fontSize = editorFontSize + 'px';
		});

		var label = document.getElementById('pyodide_fontsize_label');
		if (label) label.textContent = editorFontSize + 'px';
	}

	// =========================================================================
	// WORD WRAP TOGGLE
	// =========================================================================

	function toggleWordWrap() {
		wordWrap = !wordWrap;
		const textarea = document.getElementById('pyodide_editor_textarea');
		const highlight = document.getElementById('pyodide_editor_highlight');

		const wrapValue = wordWrap ? 'pre-wrap' : 'pre';
		const overflowX = wordWrap ? 'hidden' : 'auto';

		[textarea, highlight].forEach(function(el) {
			if (el) {
				el.style.whiteSpace = wrapValue;
				el.style.overflowX = overflowX;
			}
		});
	}

	// =========================================================================
	// COPY / DOWNLOAD OUTPUT
	// =========================================================================

	function copyConsoleOutput() {
		const output = document.getElementById("pyodide_console_output");
		if (!output) return;

		const text = output.innerText || output.textContent;
		navigator.clipboard.writeText(text).then(function() {
			appendConsole("[📋 Output copied to clipboard]\n", "info");
		}).catch(function() {
			// Fallback
			var ta = document.createElement('textarea');
			ta.value = text;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			document.body.removeChild(ta);
			appendConsole("[📋 Output copied to clipboard]\n", "info");
		});
	}

	function downloadConsoleOutput() {
		const output = document.getElementById("pyodide_console_output");
		if (!output) return;

		const text = output.innerText || output.textContent;
		const blob = new Blob([text], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'pyodide_output_' + Date.now() + '.txt';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		appendConsole("[📥 Output downloaded]\n", "info");
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
		label.style.cssText = "font-size:10px;color:#6c7086;margin-bottom:4px;font-weight:600;";
		label.textContent = "Out [" + cellCounter + "]:";
		cell.appendChild(label);
		cell.appendChild(element);

		output.appendChild(cell);
		output.scrollTop = output.scrollHeight;
	}

	/**
	 * Create a canvas element that can be drawn on from Python
	 */
	function createCanvasForPython(width, height) {
		width = width || 300;
		height = height || 150;
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		canvas.style.cssText = "border-radius:4px;border:1px solid #2a2a4a;display:block;max-width:100%;background:#000;";
		return canvas;
	}

	/**
	 * Display a canvas/element in the rich console
	 */
	function displayElement(element) {
		if (!element) return;
		if (element instanceof HTMLElement) {
			appendRichOutput(element);
		} else if (typeof element === "object" && element.tagName) {
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
		img.style.cssText += "border-radius:4px;max-width:100%;display:block;";
		appendRichOutput(img);
	}

	// =========================================================================
	// INITIALIZATION
	// =========================================================================

		async function initPyodide() {
			if (pyodideReady || pyodideLoading) return;
			pyodideLoading = true;
			setStatus("⏳ Loading...", "loading");

			var maxRetries = 3;
			var attempt = 0;

			while (attempt < maxRetries) {
				attempt++;
				try {
					if (typeof loadPyodide === "undefined") {
						throw new Error("loadPyodide is not defined. Ensure libs/pyodide.js is loaded.");
					}

					pyodideInstance = await loadPyodide({
						indexURL: "libs/",
						stdout: function (text) { appendConsole(text + "\n", "stdout"); },
						stderr: function (text) { appendConsole(text + "\n", "stderr"); },
					});

					await setupPythonEnvironment();

					pyodideReady = true;
					pyodideLoading = false;
					setStatus("✓ Ready", "ready");
					return; // Success — exit
				} catch (e) {
					console.error("Pyodide init attempt " + attempt + " failed:", e);
					if (attempt < maxRetries) {
						appendConsole("[⏳ Pyodide init failed, retrying (" + attempt + "/" + maxRetries + ")...]\n", "warn");
						await new Promise(function (resolve) { setTimeout(resolve, 1000 * attempt); });
					} else {
						pyodideLoading = false;
						setStatus("✗ Failed", "error");
						appendConsole("[ERROR] Pyodide failed to initialize after " + maxRetries + " attempts: " + e.message + "\n", "stderr");
						appendConsole("[💡 Hint] Try refreshing the page or check your network connection.\n", "info");
					}
				}
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
			createCanvas: function (w, h) { return createCanvasForPython(w, h); },
			displayElement: function (el) { displayElement(el); },
			displayHtml: function (html) { displayHtml(html); },
			displayImage: function (src, w, h) { displayImage(src, w, h); },
			isInterrupted: function () { return interruptExecution; }
		});

		var pythonSetupCode = `
import json
import random
import math
from _bridge import (getModelWeights, runPrediction, getModelInfo, 
                     setPredictionResult, getModelExists,
                     createCanvas, displayElement, displayHtml, displayImage,
                     isInterrupted)
from pyodide.ffi import to_js, JsProxy
input_data = None

def check_interrupt():
    """Call this in loops to allow stopping execution."""
    if isInterrupted():
        raise KeyboardInterrupt("Execution stopped by user")

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
	// WEBCAM HANDLING (FIXED)
	// =========================================================================

	async function startWebcam() {
		const video = document.getElementById("pyodide_webcam_video");
		const btn = document.getElementById("pyodide_webcam_btn");
		const btnSimple = document.getElementById("pyodide_webcam_btn_simple");
		if (!video) return;

		// If already running, stop it
		if (webcamStream) {
			stopWebcam();
			return;
		}

		if (!pyodideReady) {
			appendConsole("[⏳ Initializing Pyodide first...]\n", "info");
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
				btn.classList.add("pe-btn-stop");
				btn.classList.remove("pe-btn-clear");
			}
			if (btnSimple) {
				btnSimple.innerHTML = "⏹ Stop Cam";
				btnSimple.classList.add("pe-btn-stop");
				btnSimple.classList.remove("pe-btn-clear");
			}

			video.onloadedmetadata = function () {
				appendConsole("[📷 Webcam started: " + video.videoWidth + "x" + video.videoHeight + "]\n", "info");
				startWebcamPredictionLoop();
			};
		} catch (e) {
			appendConsole("[Webcam Error] " + e.message + "\n", "stderr");
			if (e.name === "NotAllowedError") {
				appendConsole("[💡 Hint] Camera permission denied. Allow camera access and try again.\n", "info");
			} else if (e.name === "NotFoundError") {
				appendConsole("[💡 Hint] No camera found on this device.\n", "info");
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
		if (webcamFPSTimer) {
			clearInterval(webcamFPSTimer);
			webcamFPSTimer = null;
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
			btn.classList.remove("pe-btn-stop");
			btn.classList.add("pe-btn-clear");
		}
		if (btnSimple) {
			btnSimple.innerHTML = "📷 Webcam";
			btnSimple.classList.remove("pe-btn-stop");
			btnSimple.classList.add("pe-btn-clear");
		}

		webcamPredicting = false;
		webcamFrameCount = 0;
		webcamFPSDisplay = 0;
		appendConsole("[📷 Webcam stopped]\n", "info");
	}

	function startWebcamPredictionLoop() {
		if (webcamInterval) clearInterval(webcamInterval);
		if (webcamFPSTimer) clearInterval(webcamFPSTimer);

		webcamFrameCount = 0;

		// FPS counter
		webcamFPSTimer = setInterval(function () {
			webcamFPSDisplay = webcamFrameCount;
			webcamFrameCount = 0;
			var fpsLabel = document.getElementById("pyodide_fps_label");
			if (fpsLabel && webcamStream) {
				fpsLabel.textContent = webcamFPSDisplay + "/" + webcamFPS + " FPS";
			}
		}, 1000);

		webcamInterval = setInterval(async function () {
			if (webcamPredicting || !webcamStream || interruptExecution) return;
			webcamPredicting = true;
			try {
				await runWebcamFrame();
				webcamFrameCount++;
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

			// Check if model is still valid before doing anything
			try {
				if (!model || !model.layers || !model.predict) return;
				// Quick check: try accessing a weight to see if model is disposed
				if (model.weights && model.weights.length > 0 && model.weights[0].isDisposed) {
					console.warn("Model weights disposed, skipping frame.");
					return;
				}
			} catch (e) {
				console.warn("Model check failed, skipping frame:", e.message);
				return;
			}

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

			// Set input_data in Python so user code can access it
			if (pyodideInstance) {
				try {
					pyodideInstance.globals.set("input_data", pyodideInstance.toPy(inputList));
				} catch (e) {
					console.warn("Failed to set input_data:", e);
					return;
				}
			}

			// Also pass labels and is_classification to Python
			if (pyodideInstance) {
				try {
					var labelsList = (typeof labels !== "undefined" && Array.isArray(labels)) ? labels : [];
					var classificationFlag = (typeof is_classification !== "undefined") ? !!is_classification : false;
					pyodideInstance.globals.set("_labels", pyodideInstance.toPy(labelsList));
					pyodideInstance.globals.set("_is_classification", classificationFlag);
				} catch (e) {
					// Non-critical, continue
				}
			}

			// Re-run the user's Python script on each frame
			try {
				const textarea = document.getElementById("pyodide_editor_textarea");
				if (textarea && pyodideInstance) {
					const code = textarea.value;
					await pyodideInstance.runPythonAsync(code);
				}
			} catch (e) {
				var msg = e.message || String(e);
				// Silently skip disposed model errors — model is being rebuilt
				if (msg.includes("disposed")) {
					return;
				}
				// Skip "No model" errors silently
				if (msg.includes("No model")) {
					return;
				}
				// If user interrupted, stop the loop
				if (msg.includes("KeyboardInterrupt")) {
					stopWebcam();
					return;
				}
				// Prediction failed (transient) — skip frame
				if (msg.includes("Prediction failed")) {
					return;
				}
				// Log other errors but don't spam
				console.warn("Webcam frame script error:", msg);
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
			appendConsole("[⏳ Initializing Pyodide first...]\n", "info");
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
			appendConsole("[✓ input_data set — run your code to predict]\n", "info");
		} catch (e) {
			appendConsole("[Error] " + e.message + "\n", "stderr");
		}
	}

	// =========================================================================
	// EXECUTION (FIXED)
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
		interruptExecution = false;
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
				if (e.message && e.message.includes("KeyboardInterrupt")) {
					appendConsole("\n[⏹ Execution interrupted]\n", "warn");
					setStatus("✓ Ready", "ready");
				} else {
					handlePythonError(e);
				}
			}
		} finally {
			if (thisRun === runCounter) {
				isRunning = false;
				interruptExecution = false;
				if (stopBtn) stopBtn.disabled = true;
			}
		}

		if (livePredictEnabled && lastPredictionResult !== null) {
			showPredictionResult(lastPredictionResult);
		}
	}

	function pyodideEditorStop() {
		if (!isRunning && !webcamStream) return;

		// Stop running code
		interruptExecution = true;
		isRunning = false;
		runCounter++;

		// Stop webcam if active
		if (webcamStream) {
			stopWebcam();
		}

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
		interruptExecution = false;

		appendConsole("\n[🔄 Runtime reset]\n", "info");
		setStatus("⏳ Not loaded", "loading");
		hidePredictionResults();

		await initPyodide();
	}

	// =========================================================================
	// TEMPLATE & FPS (FIXED — auto-start webcam)
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

		// *** FIX: Auto-start webcam when loading webcam template ***
		if (name === 'image_webcam') {
			if (!webcamStream) {
				appendConsole("[📷 Auto-starting webcam...]\n", "info");
				startWebcam();
			} else {
				appendConsole("[📷 Webcam already active — predictions running live]\n", "info");
			}
		}

		// Auto-run for certain templates
		if (name === 'random_input' || name === 'weights_inspect' || name === 'hello_world') {
			setTimeout(function () {
				pyodideEditorRun();
			}, 100);
		}
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
				"import _bridge\nif not _bridge.getModelExists():\n    print('[⚠️ No model available — create/train a model first]')"
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
		if (errorMsg.includes("No input data")) return "Use webcam, upload an image, or pass data directly to predict().";
		if (errorMsg.includes("IndentationError")) return "Check indentation — use 4 spaces consistently.";
		if (errorMsg.includes("ModuleNotFoundError")) {
			var match = errorMsg.match(/No module named '([^']+)'/);
			return match ? "Module '" + match[1] + "' not available in Pyodide browser runtime." : null;
		}
		if (errorMsg.includes("shape")) return "Shape mismatch. Use get_model_info() to check expected shapes.";
		if (errorMsg.includes("NameError")) return "Variable not defined. Check for typos or run cells in order.";
		if (errorMsg.includes("TypeError")) return "Wrong argument type. Check function signatures.";
		if (errorMsg.includes("SyntaxError")) return "Check for missing colons, brackets, or quotes.";
		if (errorMsg.includes("ZeroDivisionError")) return "Division by zero. Check your math.";
		if (errorMsg.includes("IndexError")) return "Index out of range. Check array/list lengths.";
		if (errorMsg.includes("KeyError")) return "Key not found in dictionary. Check available keys.";
		if (errorMsg.includes("AttributeError")) return "Object doesn't have that attribute. Check the object type.";
		return null;
	}

	// =========================================================================
	// UI HELPERS
	// =========================================================================

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
		lines.push("🎯 Prediction (" + result.length + " classes):");
		lines.push("─".repeat(36));

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
				label: labelsList[idx] || ("Class " + idx)
			};
		});

		var sorted = indexed.slice().sort(function (a, b) { return b.value - a.value; });

		var sum = indexed.reduce(function (s, v) { return s + v.value; }, 0);
		var looksLikeProbabilities = indexed.every(function (v) {
			return v.value >= 0 && v.value <= 1;
		}) && Math.abs(sum - 1.0) < 0.05;

		if (looksLikeProbabilities) {
			for (var i = 0; i < sorted.length; i++) {
				var item = sorted[i];
				var pct = (item.value * 100).toFixed(1);
				var barLen = Math.round(item.value * 15);
				var bar = "█".repeat(barLen) + "░".repeat(15 - barLen);
				var emoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
				var labelStr = item.label.length > 10 ? item.label.substring(0, 10) : item.label;
				lines.push(emoji + " " + labelStr.padEnd(10) + " " + pct.padStart(5) + "% " + bar);
			}
		} else {
			for (var j = 0; j < indexed.length; j++) {
				var it = indexed[j];
				var valStr = it.value.toFixed(4);
				lines.push("  " + it.label.padEnd(12) + " " + valStr);
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
				lastSaveTime = Date.now();
				showAutoSaveIndicator();
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

	function showAutoSaveIndicator() {
		var el = document.getElementById("pyodide_autosave_indicator");
		if (!el) return;
		el.textContent = "💾 Saved";
		el.style.opacity = "1";
		clearTimeout(autoSaveTimer);
		autoSaveTimer = setTimeout(function () {
			el.style.opacity = "0";
		}, 2000);
	}

	// =========================================================================
	// EDITOR KEY HANDLERS & SETUP
	// =========================================================================

	function setupEditorKeyHandlers() {
		var textarea = document.getElementById("pyodide_editor_textarea");
		if (!textarea) return;

		textarea.addEventListener("input", function () {
			scheduleHighlight();
			// Debounced auto-save
			clearTimeout(autoSaveTimer);
			autoSaveTimer = setTimeout(saveEditorContent, 3000);
		});
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
					var removedChars = 0;
					var firstLineRemoved = 0;

					var dedentedLines = lines.map(function (line, idx) {
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
					var indented = lns.map(function (line) { return "    " + line; });

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
				var lineStart2 = v.lastIndexOf("\n", s - 1) + 1;
				var currentLine = v.substring(lineStart2, s);
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
				var startD = this.selectionStart;
				var valueD = this.value;
				var lsD = valueD.lastIndexOf("\n", startD - 1) + 1;
				var leD = valueD.indexOf("\n", startD);
				if (leD === -1) leD = valueD.length;
				var lineD = valueD.substring(lsD, leD);
				this.value = valueD.substring(0, leD) + "\n" + lineD + valueD.substring(leD);
				this.selectionStart = this.selectionEnd = startD + lineD.length + 1;
				scheduleHighlight();
				return;
			}

			// Escape - stop execution / close panels
			if (e.key === "Escape") {
				e.preventDefault();
				if (isRunning || webcamStream) {
					pyodideEditorStop();
				} else {
					// Close examples panel if open
					var panel = document.getElementById('pyodide_examples_panel');
					if (panel && panel.classList.contains('pe-visible')) {
						panel.classList.remove('pe-visible');
					}
				}
				return;
			}

			// Ctrl+Shift+W - toggle webcam
			if (e.key === "W" && e.ctrlKey && e.shiftKey) {
				e.preventDefault();
				if (webcamStream) {
					stopWebcam();
				} else {
					startWebcam();
				}
				return;
			}

			// Ctrl+Shift+F - toggle fullscreen
			if (e.key === "F" && e.ctrlKey && e.shiftKey) {
				e.preventDefault();
				toggleFullscreen();
				return;
			}

			// Ctrl+/ - toggle comment
			if (e.key === "/" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				toggleComment(this);
				return;
			}
		});

		// Auto-close brackets when wrapping selection
		textarea.addEventListener("keypress", function (e) {
			var pairs = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'" };
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
	// TOGGLE COMMENT (Ctrl+/)
	// =========================================================================

	function toggleComment(textarea) {
		var start = textarea.selectionStart;
		var end = textarea.selectionEnd;
		var value = textarea.value;

		var lineStart = value.lastIndexOf("\n", start - 1) + 1;
		var lineEnd = value.indexOf("\n", end);
		if (lineEnd === -1) lineEnd = value.length;

		var selectedText = value.substring(lineStart, lineEnd);
		var lines = selectedText.split("\n");

		// Check if all lines are commented
		var allCommented = lines.every(function (line) {
			return line.trimStart().startsWith("# ") || line.trimStart().startsWith("#") || line.trim() === "";
		});

		var newLines;
		if (allCommented) {
			// Uncomment
			newLines = lines.map(function (line) {
				if (line.trimStart().startsWith("# ")) {
					var idx = line.indexOf("# ");
					return line.substring(0, idx) + line.substring(idx + 2);
				} else if (line.trimStart().startsWith("#")) {
					var idx2 = line.indexOf("#");
					return line.substring(0, idx2) + line.substring(idx2 + 1);
				}
				return line;
			});
		} else {
			// Comment
			newLines = lines.map(function (line) {
				if (line.trim() === "") return line;
				return "# " + line;
			});
		}

		var newText = newLines.join("\n");
		textarea.value = value.substring(0, lineStart) + newText + value.substring(lineEnd);

		// Restore selection
		textarea.selectionStart = lineStart;
		textarea.selectionEnd = lineStart + newText.length;
		scheduleHighlight();
	}

	// =========================================================================
	// SNIPPET INSERTION
	// =========================================================================

	function insertSnippet(snippet) {
		var textarea = document.getElementById("pyodide_editor_textarea");
		if (!textarea) return;

		var start = textarea.selectionStart;
		var value = textarea.value;

		textarea.value = value.substring(0, start) + snippet + value.substring(textarea.selectionEnd);
		textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
		textarea.focus();
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
	// PUBLIC API FUNCTIONS
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
	window.pyodideToggleFullscreen = toggleFullscreen;
	window.pyodideCopyOutput = copyConsoleOutput;
	window.pyodideDownloadOutput = downloadConsoleOutput;
	window.pyodideChangeFontSize = changeFontSize;
	window.pyodideToggleWordWrap = toggleWordWrap;
	window.pyodideInsertSnippet = insertSnippet;

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
		createCanvas: createCanvasForPython,
		insertSnippet: insertSnippet
	};

})();
