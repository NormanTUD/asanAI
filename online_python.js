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

	// Multi-photo state
	let capturedPhotos = []; // Array of {pixelData: [...nested list...], thumbnailDataURL: "...", index: N}

	var _scrollRAF = null;
	var _examplesToggling = false;
	var _examplesTranslated = false;
	var _tabObserver = null;

	var _scrollPending = false;

	var _templateLoading = false;
	var _templateLoadTimer = null;

	var _lineNumbersCache = '';

	// =========================================================================
	// DEFAULT CODE TEMPLATES
	// =========================================================================

const TEMPLATES = {
	image_webcam: `# 📷 Live Webcam Prediction
# Runs on EVERY frame from the webcam.

def setup():
    info = get_model_info()
    state = {
        'frame_count': 0,
        'input_shape': info['input_shape'],
        'is_image': len(info['input_shape']) == 4,
        'labels': _labels if '_labels' in dir() and _labels else None,
        'is_classif': _is_classification if '_is_classification' in dir() else False,
    }
    print(f"Model: {info['input_shape']} → {info['output_shape']}")
    print(f"Layers: {info['num_layers']}, Params: {info['trainable_params']:,}")
    print(f"Input type: {'Image' if state['is_image'] else 'Flat/Sequence'}")
    if state['labels'] and state['is_classif']:
        print(f"Labels: {list(state['labels'])}")
    print()
    return state

def get_label(idx, labels, is_classif):
    if labels and is_classif and idx < len(labels):
        return labels[idx]
    return f"Class {idx}"

def format_classification(result, labels, is_classif):
    top_idx = result.index(max(result))
    confidence = result[top_idx] * 100
    label = get_label(top_idx, labels, is_classif)
    return f"🏆 {label} ({confidence:.1f}%)"

def format_regression(result):
    vals = ', '.join(f'{v:.4f}' for v in result[:5])
    suffix = '...' if len(result) > 5 else ''
    return f"Output: [{vals}{suffix}]"

# Initialize once
if 'state' not in dir():
    state = setup()

if input_data is not None:
    state['frame_count'] += 1
    result = predict(input_data)
    set_prediction_result(result)

    if state['frame_count'] % 5 == 0:
        fc = state['frame_count']
        if isinstance(result, list) and len(result) > 1 and state['is_classif']:
            print(f"Frame {fc} | {format_classification(result, state['labels'], state['is_classif'])}")
        elif isinstance(result, list) and not state['is_classif']:
            print(f"Frame {fc} | {format_regression(result)}")
        else:
            print(f"Frame {fc} | Result: {result}")
else:
    print("⏳ Waiting for webcam frame...")
`,

	image_webcam_tracking: `# 📷 Webcam + Confidence Tracking
# Tracks predictions over time and detects stable classifications.

def setup():
    info = get_model_info()
    labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    print(f"🧠 Model: {info['input_shape']} → {info['output_shape'][-1]} classes")
    if labels and is_classif:
        print(f"   Labels: {list(labels)}")
    print(f"   Tracking stability over 10 frames")
    print()
    return {
        'frame_count': 0,
        'history': [],
        'stable_count': 0,
        'last_class': -1,
        'threshold': 10,
        'labels': labels,
        'is_classif': is_classif,
    }

def get_label(idx, s):
    if s['labels'] and s['is_classif'] and idx < len(s['labels']):
        return s['labels'][idx]
    return f"Class {idx}"

def check_stability(s, top_idx, history):
    if top_idx == s['last_class']:
        s['stable_count'] += 1
    else:
        s['stable_count'] = 1
        s['last_class'] = top_idx

    if s['stable_count'] == s['threshold']:
        recent = history[-s['threshold']:]
        avg_conf = sum(h['conf'] for h in recent) / len(recent)
        print(f"🔒 STABLE: {get_label(top_idx, s)} for {s['threshold']} frames (avg {avg_conf*100:.1f}%)")

if 'state' not in dir():
    state = setup()

if input_data is not None:
    state['frame_count'] += 1
    result = predict(input_data)
    set_prediction_result(result)

    if isinstance(result, list) and len(result) > 1:
        top_idx = result.index(max(result))
        confidence = result[top_idx]
        state['history'].append({'class': top_idx, 'conf': confidence})

        if len(state['history']) > 60:
            state['history'] = state['history'][-60:]

        check_stability(state, top_idx, state['history'])

        if state['frame_count'] % 15 == 0:
            recent = state['history'][-15:]
            avg_conf = sum(h['conf'] for h in recent) / len(recent)
            print(f"📊 Frame {state['frame_count']} | Current: {get_label(top_idx, state)} | Avg conf: {avg_conf*100:.1f}% | Stable: {state['stable_count']}")
`,

	image_webcam_threshold: `# 📷 Webcam + Threshold Alerts
# Only prints when confidence exceeds a threshold.

HIGH_THRESHOLD = 0.85
LOW_THRESHOLD = 0.30

def setup():
    info = get_model_info()
    labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    print(f"🧠 Model: {info['input_shape']} → {info['output_shape']}")
    if labels and is_classif:
        print(f"   Labels: {list(labels)}")
    print(f"⚙️  High threshold: {HIGH_THRESHOLD*100:.0f}%")
    print(f"⚙️  Low threshold: {LOW_THRESHOLD*100:.0f}%")
    print()
    return {'frame_count': 0, 'alert_count': 0, 'labels': labels, 'is_classif': is_classif}

def get_label(idx, s):
    if s['labels'] and s['is_classif'] and idx < len(s['labels']):
        return s['labels'][idx]
    return f"Class {idx}"

if 'state' not in dir():
    state = setup()

if input_data is not None:
    state['frame_count'] += 1
    result = predict(input_data)
    set_prediction_result(result)

    if isinstance(result, list) and len(result) > 1:
        top_idx = result.index(max(result))
        confidence = result[top_idx]
        fc = state['frame_count']
        label = get_label(top_idx, state)

        if confidence >= HIGH_THRESHOLD:
            state['alert_count'] += 1
            print(f"🚨 HIGH [{fc}]: {label} at {confidence*100:.1f}% (alert #{state['alert_count']})")
        elif confidence <= LOW_THRESHOLD:
            print(f"🤷 LOW  [{fc}]: Best guess {label} at {confidence*100:.1f}%")
`,

	image_webcam_multiclass: `# 📷 Webcam + Multi-Class Monitor
# Reports when any class exceeds its previous peak.

def setup():
    info = get_model_info()
    num_classes = info['output_shape'][-1] if info['output_shape'] else 0
    labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    print(f"🧠 Monitoring {num_classes} classes")
    if labels and is_classif:
        print(f"   Labels: {list(labels)}")
    print(f"   Will report when any class exceeds its previous peak")
    print()
    return {
        'frame_count': 0,
        'peaks': {i: 0.0 for i in range(num_classes)},
        'num_classes': num_classes,
        'labels': labels,
        'is_classif': is_classif,
    }

def get_label(idx, s):
    if s['labels'] and s['is_classif'] and idx < len(s['labels']):
        return s['labels'][idx]
    return f"Class {idx}"

def print_summary(s):
    print(f"\\n--- Frame {s['frame_count']} Summary ---")
    for idx in sorted(s['peaks'], key=s['peaks'].get, reverse=True):
        bar = "█" * int(s['peaks'][idx] * 20)
        print(f"  {get_label(idx, s):12s}: {s['peaks'][idx]*100:.1f}% {bar}")
    print()

if 'state' not in dir():
    state = setup()

if input_data is not None:
    state['frame_count'] += 1
    result = predict(input_data)
    set_prediction_result(result)

    if isinstance(result, list) and len(result) > 1:
        for idx, conf in enumerate(result):
            if conf > state['peaks'][idx] + 0.1:
                state['peaks'][idx] = conf
                print(f"📈 NEW PEAK [{state['frame_count']}]: {get_label(idx, state)} → {conf*100:.1f}%")

        if state['frame_count'] % 30 == 0:
            print_summary(state)
`,

	image_webcam_smoothed: `# 📷 Webcam + Smoothed Predictions
# Averages predictions over a sliding window to reduce noise.

WINDOW_SIZE = 10

def setup():
    info = get_model_info()
    num_classes = info['output_shape'][-1] if info['output_shape'] else 0
    labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    print(f"🧠 Model: {num_classes} classes")
    if labels and is_classif:
        print(f"   Labels: {list(labels)}")
    print(f"📊 Smoothing window: {WINDOW_SIZE} frames")
    print()
    return {
        'frame_count': 0,
        'buffer': [],
        'labels': labels,
        'is_classif': is_classif,
    }

def get_label(idx, s):
    if s['labels'] and s['is_classif'] and idx < len(s['labels']):
        return s['labels'][idx]
    return f"Class {idx}"

def smooth_predictions(buffer):
    num_cls = len(buffer[0])
    smoothed = [0.0] * num_cls
    for pred in buffer:
        for i in range(num_cls):
            smoothed[i] += pred[i]
    return [s / len(buffer) for s in smoothed]

def top_prediction(result):
    top_idx = result.index(max(result))
    return top_idx, result[top_idx]

if 'state' not in dir():
    state = setup()

if input_data is not None:
    state['frame_count'] += 1
    result = predict(input_data)

    if isinstance(result, list) and len(result) > 1:
        state['buffer'].append(result)
        if len(state['buffer']) > WINDOW_SIZE:
            state['buffer'] = state['buffer'][-WINDOW_SIZE:]

        smoothed = smooth_predictions(state['buffer'])
        set_prediction_result(smoothed)

        if state['frame_count'] % 10 == 0:
            raw_idx, raw_conf = top_prediction(result)
            sm_idx, sm_conf = top_prediction(smoothed)
            print(f"Frame {state['frame_count']} | Raw: {get_label(raw_idx, state)} ({raw_conf*100:.1f}%) | Smoothed: {get_label(sm_idx, state)} ({sm_conf*100:.1f}%)")
`,

	image_upload: `# 🖼️ Image Upload Prediction
# Upload an image using the 📁 button above, then run this code.

def setup():
    info = get_model_info()
    labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    print(f"Model expects: {info['input_shape']}")
    if labels and is_classif:
        print(f"Labels: {list(labels)}")
    print()
    return {'labels': labels, 'is_classif': is_classif}

def get_label(idx, s):
    if s['labels'] and s['is_classif'] and idx < len(s['labels']):
        return s['labels'][idx]
    return f"Class {idx}"

def print_sorted_classes(result, s):
    indexed = sorted(enumerate(result), key=lambda x: x[1], reverse=True)
    for idx, conf in indexed:
        bar = "█" * int(conf * 20)
        print(f"  {get_label(idx, s):12s} {conf*100:5.1f}% {bar}")

s = setup()

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
        print(f"🏆 Top: {get_label(top_idx, s)} ({result[top_idx]*100:.1f}%)")
        print()
        print_sorted_classes(result, s)
`,

	random_input: `# 🎲 Random Input Prediction
# Generates random data matching your model's input shape.

def get_label(idx):
    labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    if labels and is_classif and idx < len(labels):
        return labels[idx]
    return f"Class {idx}"

def print_model_summary(info):
    print(f"🧠 Model Summary")
    print(f"   Layers: {info['num_layers']}")
    print(f"   Input:  {info['input_shape']}")
    print(f"   Output: {info['output_shape']}")
    print(f"   Params: {info['trainable_params']:,} trainable")

def make_sample_shape(input_shape):
    return [s if s is not None else 1 for s in input_shape[1:]]

info = get_model_info()
labels = _labels if '_labels' in dir() and _labels else None
is_classif = _is_classification if '_is_classification' in dir() else False

print_model_summary(info)
if labels and is_classif:
    print(f"   Labels: {list(labels)}")
print()

sample_shape = make_sample_shape(info['input_shape'])
print(f"📐 Sample shape: {sample_shape}")

result = predict(rand_nested(sample_shape))
print(f"\\n🎯 Prediction: {result}")
set_prediction_result(result)

if isinstance(result, list) and len(result) > 1:
    top_idx = result.index(max(result))
    print(f"🏆 Top: {get_label(top_idx)} ({result[top_idx]*100:.1f}%)")
`,

	custom_data: `# ✏️ Custom Data Prediction
# Enter your own data and predict.

def get_label(idx):
    labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    if labels and is_classif and idx < len(labels):
        return labels[idx]
    return f"Class {idx}"

def make_sample_shape(input_shape):
    return [s if s is not None else 1 for s in input_shape[1:]]

info = get_model_info()
input_shape = info['input_shape']
labels = _labels if '_labels' in dir() and _labels else None
is_classif = _is_classification if '_is_classification' in dir() else False

print(f"Model expects input shape: {input_shape}")
print(f"Model output shape: {info['output_shape']}")
if labels and is_classif:
    print(f"Labels: {list(labels)}")
print()

# Auto-generate matching input for testing:
sample_shape = make_sample_shape(input_shape)
print(f"Generating test data with shape: {sample_shape}")
my_data = rand_nested(sample_shape)

# You can replace my_data with your own values:
# my_data = [[0.1, 0.5, 0.3, ...]]

result = predict(my_data)
print(f"\\n🎯 Result: {result}")
set_prediction_result(result)

if isinstance(result, list) and len(result) > 1:
    top_idx = result.index(max(result))
    print(f"🏆 Top: {get_label(top_idx)} ({result[top_idx]*100:.1f}%)")
`,

	weights_inspect: `# 🔍 Inspect Model Weights

def print_header(info):
    print("🧠 Model Architecture")
    print("=" * 50)
    print(f"  Layers:          {info['num_layers']}")
    print(f"  Input shape:     {info['input_shape']}")
    print(f"  Output shape:    {info['output_shape']}")
    print(f"  Trainable:       {info['trainable_params']:,}")
    print(f"  Non-trainable:   {info['non_trainable_params']:,}")
    print(f"  Total params:    {info['trainable_params'] + info['non_trainable_params']:,}")
    print()

def print_labels():
    labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    if labels and is_classif:
        print(f"  Classification labels: {list(labels)}")
        print()

def print_layers(info):
    print("📋 Layer Details")
    print("-" * 50)
    for i, (name, ltype) in enumerate(zip(info['layer_names'], info['layer_types'])):
        print(f"  [{i}] {ltype:20s} → {name}")
    print()

def get_tensor_shape(w):
    shape = []
    temp = w
    while isinstance(temp, list):
        shape.append(len(temp))
        temp = temp[0] if len(temp) > 0 else []
    return shape

def print_weights(weights):
    if not weights:
        return
    print("⚖️  Weight Tensors")
    print("-" * 50)
    total_values = 0
    for i, w in enumerate(weights):
        if isinstance(w, list):
            shape = get_tensor_shape(w)
            size = 1
            for s in shape:
                size *= s
            total_values += size
            print(f"  Weight {i}: shape={shape} ({size:,} values)")
        else:
            print(f"  Weight {i}: {type(w)}")
    print(f"\\n  Total weight values: {total_values:,}")

info = get_model_info()
print_header(info)
print_labels()
print_layers(info)
print_weights(get_weights())
`,

	draw_chart: `# 📊 Draw a Bar Chart in the Console

import random

def get_chart_labels():
    labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    if labels and is_classif:
        return list(labels)
    return ["Cat", "Dog", "Bird", "Fish", "Frog"]

def draw_background(ctx, w, h):
    ctx.fillStyle = "#1e1e2e"
    ctx.fillRect(0, 0, w, h)

def draw_bar(ctx, x, y, width, height, hue, is_max):
    ctx.fillStyle = f"hsl({hue}, 70%, 60%)"
    ctx.fillRect(x, y, width, height)
    if is_max:
        ctx.strokeStyle = "#fff"
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, width, height)

def draw_label(ctx, text, value, x, y_label, y_value):
    ctx.fillStyle = "#cdd6f4"
    ctx.font = "10px sans-serif"
    ctx.textAlign = "center"
    short = text[:7] if len(text) > 7 else text
    ctx.fillText(short, x, y_label)
    ctx.fillText(f"{value:.2f}", x, y_value)

def draw_title(ctx, text):
    ctx.fillStyle = "#89b4fa"
    ctx.font = "bold 14px sans-serif"
    ctx.textAlign = "left"
    ctx.fillText(text, 10, 22)

# Main
chart_labels = get_chart_labels()
values = [random.random() for _ in range(len(chart_labels))]
max_val = max(values)
num_bars = len(chart_labels)

canvas = create_canvas(420, 220)
ctx = canvas.getContext("2d")
draw_background(ctx, 420, 220)

total_width = 380
bar_width = max(20, (total_width - (num_bars - 1) * 8) // num_bars)
gap = 8
start_x = (420 - (num_bars * bar_width + (num_bars - 1) * gap)) // 2

for i, (label, val) in enumerate(zip(chart_labels, values)):
    x = start_x + i * (bar_width + gap)
    bar_height = (val / max_val) * 150
    y = 185 - bar_height
    hue = i * (360 // num_bars)

    draw_bar(ctx, x, y, bar_width, bar_height, hue, val == max_val)
    draw_label(ctx, label, val, x + bar_width / 2, 202, y - 8)

draw_title(ctx, "📊 Random Predictions")
display(canvas)
print("Chart drawn! ✨")
`,

	draw_canvas: `# 🎨 Custom Canvas Drawing

import math
import random

def draw_background(ctx, w, h):
    ctx.fillStyle = "#0f0f1a"
    ctx.fillRect(0, 0, w, h)

def draw_rainbow_circles(ctx, cx, cy, count=20):
    for i in range(count, 0, -1):
        hue = (i * 18) % 360
        ctx.beginPath()
        ctx.arc(cx, cy, i * 7, 0, 2 * math.pi)
        ctx.fillStyle = f"hsla({hue}, 80%, 50%, 0.6)"
        ctx.fill()

def draw_stars(ctx, w, h, count=50):
    ctx.fillStyle = "#ffffff"
    for _ in range(count):
        x = random.randint(0, w)
        y = random.randint(0, h)
        size = random.random() * 2
        ctx.beginPath()
        ctx.arc(x, y, size, 0, 2 * math.pi)
        ctx.fill()

def draw_centered_title(ctx, text, x, y):
    ctx.fillStyle = "#fff"
    ctx.font = "bold 16px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(text, x, y)

canvas = create_canvas(300, 300)
ctx = canvas.getContext("2d")

draw_background(ctx, 300, 300)
draw_rainbow_circles(ctx, 150, 150)
draw_stars(ctx, 300, 300)
draw_centered_title(ctx, "🌈 Rainbow Circles", 150, 25)

display(canvas)
print("Canvas art complete! 🎨")
`,

	html_table: `# 📋 Render an HTML Table

def build_layer_rows(info):
    rows = ""
    for i, (name, ltype) in enumerate(zip(info['layer_names'], info['layer_types'])):
        bg = "rgba(108,99,255,0.05)" if i % 2 == 0 else "transparent"
        rows += f'<tr style="background:{bg}"><td>{i}</td><td>{name}</td><td>{ltype}</td></tr>'
    return rows

def build_labels_html():
    labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    if labels and is_classif:
        return f'<p style="color:#a6adc8;font-size:11px;">Labels: <strong style="color:#89b4fa;">{", ".join(labels)}</strong></p>'
    return ""

info = get_model_info()
total_params = info['trainable_params'] + info['non_trainable_params']

html = f"""
<div style="padding:8px;">
  <h3 style="color:#89b4fa;margin:0 0 8px 0;">🧠 Model Architecture</h3>
  <table style="width:100%;">
    <thead>
      <tr><th>#</th><th>Layer Name</th><th>Type</th></tr>
    </thead>
    <tbody>{build_layer_rows(info)}</tbody>
  </table>
  <p style="color:#a6adc8;font-size:11px;margin-top:8px;">
    Total params: <strong style="color:#00d4aa;">{total_params:,}</strong>
    (trainable: {info['trainable_params']:,})
  </p>
  {build_labels_html()}
</div>
"""

display_html(html)
print("Table rendered! 📋")
`,

	pixel_art: `# 🕹️ Pixel Art Editor

GRID_SIZE = 16
CANVAS_SIZE = 256
PIXEL_SIZE = CANVAS_SIZE // GRID_SIZE

PALETTE = {
    0: "#0f0f1a",
    1: "#ffd93d",
    2: "#1a1a2e",
    3: "#ff6b6b",
    4: "#00d4aa",
}

SPRITE = [
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

def draw_pixels(ctx, sprite, palette, pixel_size):
    for y, row in enumerate(sprite):
        for x, color_idx in enumerate(row):
            ctx.fillStyle = palette.get(color_idx, "#000")
            ctx.fillRect(x * pixel_size, y * pixel_size, pixel_size, pixel_size)

def draw_grid(ctx, grid_size, pixel_size, canvas_size):
    ctx.strokeStyle = "rgba(255,255,255,0.05)"
    ctx.lineWidth = 0.5
    for i in range(grid_size + 1):
        ctx.beginPath()
        ctx.moveTo(i * pixel_size, 0)
        ctx.lineTo(i * pixel_size, canvas_size)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, i * pixel_size)
        ctx.lineTo(canvas_size, i * pixel_size)
        ctx.stroke()

canvas = create_canvas(CANVAS_SIZE, CANVAS_SIZE)
ctx = canvas.getContext("2d")

draw_pixels(ctx, SPRITE, PALETTE, PIXEL_SIZE)
draw_grid(ctx, GRID_SIZE, PIXEL_SIZE, CANVAS_SIZE)

display(canvas)
print("🕹️ Pixel art rendered! Try editing the SPRITE array.")
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
`,

	generic_io: `# 🔌 Generic Input / Output
# Works with any model shape — generates matching random input.

def get_label(idx):
    labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    if labels and is_classif and idx < len(labels):
        return labels[idx]
    return f"Class {idx}"

def make_sample_shape(input_shape):
    return [s if s is not None else 1 for s in input_shape[1:]]

def print_model_info(info):
    print(f"🧠 Model Info")
    print(f"   Input shape:  {info['input_shape']}")
    print(f"   Output shape: {info['output_shape']}")
    print(f"   Layers: {info['num_layers']}")
    print(f"   Params: {info['trainable_params']:,} trainable")
    print()

def print_classification_result(result):
    top_idx = result.index(max(result))
    confidence = result[top_idx] * 100
    label = get_label(top_idx)
    print(f"🏆 Top class: {label} ({confidence:.1f}%)")

def print_regression_result(result):
    print(f"   (Regression/multi-output — {len(result)} output values)")
    for i, v in enumerate(result[:10]):
        print(f"   [{i}] {v:.6f}")
    if len(result) > 10:
        print(f"   ... ({len(result) - 10} more)")

info = get_model_info()
labels = _labels if '_labels' in dir() and _labels else None
is_classif = _is_classification if '_is_classification' in dir() else False

print_model_info(info)

sample_shape = make_sample_shape(info['input_shape'])
print(f"📐 Generating input with shape: {sample_shape}")

my_input = rand_nested(sample_shape)
print(f"   Sample input (first 5 values): {str(my_input)[:80]}...")
print()

result = predict(my_input)
set_prediction_result(result)

print(f"🎯 Output ({len(result)} values):")
print(f"   {result}")
print()

if isinstance(result, list) and len(result) > 1 and is_classif:
    print_classification_result(result)
elif isinstance(result, list):
    print_regression_result(result)
`,

	image_snapshot_rps: `# ✊✋✌️ Rock Paper Scissors — 2 Players!
# Camera stays LIVE. Press 📸 Snap for Player 1, then Player 2.

RPS_NAMES = ['rock', 'paper', 'scissors']
RPS_EMOJI = {'rock': '✊', 'paper': '✋', 'scissors': '✌️'}
WINS_OVER = {'rock': 'scissors', 'paper': 'rock', 'scissors': 'paper'}

def init_game():
    info = get_model_info()
    num_classes = info['output_shape'][-1] if info['output_shape'] else 0
    labels = _labels if '_labels' in dir() and _labels else None
    rps_map = {i: RPS_NAMES[i % 3] for i in range(num_classes)}

    print("✊✋✌️  ROCK PAPER SCISSORS — 2 PLAYERS")
    print("═" * 40)
    if labels:
        for i in range(num_classes):
            print(f"  {RPS_EMOJI[rps_map[i]]} {labels[i]} → {rps_map[i]}")
    print()
    print("📸 Press SNAP for Player 1, then SNAP again for Player 2!")
    print("═" * 40)
    print()

    return {
        'round': 0, 'p1_score': 0, 'p2_score': 0,
        'turn': 1, 'p1_move': None,
        'labels': labels, 'rps_map': rps_map,
        'num_classes': num_classes,
    }

def classify_frame(result, g):
    top = result.index(max(result))
    conf = result[top]
    move = g['rps_map'][top]
    label = g['labels'][top] if g['labels'] and top < len(g['labels']) else f"Class {top}"
    return top, conf, move, label

def determine_winner(p1, p2):
    m1, m2 = p1[2], p2[2]
    if m1 == m2:
        return 'draw', None, None
    elif WINS_OVER[m1] == m2:
        return 'p1', p1, p2
    else:
        return 'p2', p2, p1

def print_round_result(g, p1, p2, outcome):
    g['round'] += 1
    if outcome == 'draw':
        g['p1_score'] += 0
        result_text = "🤝 DRAW!"
        e1, e2 = "😐", "😐"
    elif outcome == 'p1':
        g['p1_score'] += 1
        result_text = "👑 Player 1 WINS!"
        e1, e2 = "🏆", "😢"
    else:
        g['p2_score'] += 1
        result_text = "👑 Player 2 WINS!"
        e1, e2 = "😢", "🏆"

    print(f"══ Round {g['round']} ═══════════════════════")
    print(f"  {e1} P1: {RPS_EMOJI[p1[2]]} {p1[2]} ({p1[3]}, {p1[1]*100:.0f}%)")
    print(f"  {e2} P2: {RPS_EMOJI[p2[2]]} {p2[2]} ({p2[3]}, {p2[1]*100:.0f}%)")
    print(f"  → {result_text}")
    print()
    print(f"  Score: P1 {g['p1_score']} — P2 {g['p2_score']}")
    print()

if 'game' not in dir():
    game = init_game()

if input_data is not None:
    result = predict(input_data)
    set_prediction_result(result)
    move_data = classify_frame(result, game)

    if game['turn'] == 1:
        game['p1_move'] = move_data
        game['turn'] = 2
        print(f"👤 Player 1 snapped! → {RPS_EMOJI[move_data[2]]} {move_data[2]} ({move_data[1]*100:.0f}%)")
        print(f"   Now press 📸 Snap for Player 2!")
        print()
    else:
        p1 = game['p1_move']
        p2 = move_data
        game['turn'] = 1
        game['p1_move'] = None

        outcome, _, _ = determine_winner(p1, p2)
        print_round_result(game, p1, p2, outcome)
`,

	image_group_battle: `# ⚔️ Group Battle — Capture photos, pair off, find winners!
#
# 1. Click "📸 Multi-Snap" to capture photos
# 2. Press "▶ Run with Photos"
#
# Set beats = None for "highest confidence wins"
beats = None

def setup():
    info = get_model_info()
    lbls = _labels if '_labels' in dir() and _labels else None
    is_cls = _is_classification if '_is_classification' in dir() else False
    return lbls, is_cls, info

def classify_all(photo_list, lbls, is_cls):
    """Classify all photos in one pass and return player dicts."""
    players = []
    for i, photo in enumerate(photo_list):
        result = predict(photo)
        check_interrupt()
        top_idx = result.index(max(result)) if len(result) > 1 else 0
        conf = result[top_idx] if len(result) > 1 else (result[0] if result else 0.0)
        label = lbls[top_idx] if lbls and top_idx < len(lbls) else f"Class {top_idx}"
        players.append({'num': i+1, 'label': label, 'confidence': conf})
        print(f"  📷 Photo {i+1}: {label} ({conf*100:.1f}%)")
    return players

def battle(p1, p2, rules):
    """Determine winner between two players."""
    if rules:
        m1, m2 = p1['label'].lower().strip(), p2['label'].lower().strip()
        if m1 != m2:
            if rules.get(m1) == m2:
                return p1, f"{m1} beats {m2}"
            if rules.get(m2) == m1:
                return p2, f"{m2} beats {m1}"
    # Default: highest confidence wins
    winner = p1 if p1['confidence'] >= p2['confidence'] else p2
    return winner, f"{winner['confidence']*100:.1f}% wins"

# === MAIN ===
if 'photos' not in dir() or not photos:
    print("⚠️  No photos captured!")
    print("  1. Click '📸 Multi-Snap'")
    print("  2. Snap each player")
    print("  3. Press '▶ Run with Photos'")
else:
    lbls, is_cls, info = setup()

    print("⚔️  GROUP BATTLE")
    print("═" * 40)
    print(f"  Photos: {num_photos} | Mode: {'Rules' if beats else 'Confidence'}")
    if lbls:
        print(f"  Labels: {list(lbls)}")
    print("═" * 40)

    players = classify_all(list(photos[:num_photos]), lbls, is_cls)
    print()

    if num_photos % 2 == 1:
        print(f"  ⚠️ Odd number — Photo {num_photos} gets a BYE")

    print("⚔️  MATCHUPS:")
    print("─" * 40)

    winners = []
    for i in range(0, num_photos - 1, 2):
        p1, p2 = players[i], players[i+1]
        winner, reason = battle(p1, p2, beats)
        winners.append(winner)
        print(f"  📷{p1['num']} {p1['label']} ({p1['confidence']*100:.0f}%)"
              f" vs 📷{p2['num']} {p2['label']} ({p2['confidence']*100:.0f}%)")
        print(f"    → 👑 Photo {winner['num']} wins! ({reason})\\n")

    print("═" * 40)
    print("🏆 WINNERS:")
    for w in winners:
        print(f"   👑 Photo {w['num']}: {w['label']} ({w['confidence']*100:.1f}%)")
    print("═" * 40)
`,
};

	const DEFAULT_CODE = TEMPLATES.hello_world;

	// =========================================================================
	// MODEL INPUT TYPE DETECTION
	// =========================================================================

	function isImageModel() {
		try {
			if (!model || !model.layers || !model.layers[0] || !model.layers[0].input) return false;
			var shape = model.layers[0].input.shape; // e.g. [null, 40, 40, 3]
			return shape.length === 4; // [batch, H, W, C]
		} catch (e) {
			return false;
		}
	}

	function getModelInputRank() {
		try {
			if (!model || !model.layers || !model.layers[0] || !model.layers[0].input) return null;
			return model.layers[0].input.shape.length;
		} catch (e) {
			return null;
		}
	}

	/**
	 * Call this whenever the model changes.
	 * Hides webcam buttons and stops webcam if model is not image-like.
	 */
	function updateWebcamAvailability() {
		var imageModel = isImageModel();
		var webcamBtn = document.getElementById("pyodide_webcam_btn");
		var webcamBtnSimple = document.getElementById("pyodide_webcam_btn_simple");
		var fpsControls = document.querySelector('.pe-input-bar [oninput*="pyodideSetWebcamFPS"]');
		var fpsLabel = document.getElementById("pyodide_fps_label");
		var liveCheckbox = document.getElementById("pyodide_live_predict");

		// Hide/show webcam buttons
		if (webcamBtn) webcamBtn.style.display = imageModel ? "" : "none";
		if (webcamBtnSimple) webcamBtnSimple.style.display = imageModel ? "" : "none";

		// Hide FPS controls for non-image models
		if (fpsControls) fpsControls.parentElement.style.display = imageModel ? "" : "none";

		// If webcam is active and model is no longer image-compatible, stop it
		if (!imageModel && webcamStream) {
			appendConsole("[📷 Webcam stopped — model input shape is not image-like]\n", "warn");
			stopWebcam();
		}

		// *** FIX 5: Use a single class on the panel instead of looping through cards ***
		var panel = document.getElementById('pyodide_examples_panel');
		if (panel) {
			if (imageModel) {
				panel.classList.remove('pe-no-image-model');
			} else {
				panel.classList.add('pe-no-image-model');
			}
		}

		// If current code is a webcam template and model changed to non-image, replace with generic
		if (!imageModel) {
			var textarea = document.getElementById("pyodide_editor_textarea");
			if (textarea) {
				var code = textarea.value;
				if (code.includes("# 📷 Live Webcam") || code.includes("frame_count")) {
					textarea.value = TEMPLATES.generic_io;
					scheduleHighlight();
					saveEditorContent();
					appendConsole("[📄 Switched to generic I/O template (model is not image-based)]\n", "info");
				}
			}
		}
	}


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
			var textarea = document.getElementById('pyodide_editor_textarea');
			var lineNumbersEl = document.getElementById('pyodide_editor_line_numbers');
			if (!textarea || !lineNumbersEl) return;

			var lineCount = textarea.value.split('\n').length;
			var currentCount = lineNumbersEl.getAttribute('data-lines');
			if (currentCount && parseInt(currentCount) === lineCount) return;

			// Build string only if count changed
			var numbers = '';
			for (var i = 1; i <= lineCount; i++) {
				numbers += i + '\n';
			}

			// Avoid setting textContent if it hasn't changed (prevents reflow)
			if (_lineNumbersCache === numbers) return;
			_lineNumbersCache = numbers;

			lineNumbersEl.textContent = numbers;
			lineNumbersEl.setAttribute('data-lines', lineCount);
		}

		function applyScrollPerformanceHints() {
			var textarea = document.getElementById('pyodide_editor_textarea');
			var highlightEl = document.getElementById('pyodide_editor_highlight');
			var lineNumbersEl = document.getElementById('pyodide_editor_line_numbers');

			[textarea, highlightEl, lineNumbersEl].forEach(function(el) {
				if (!el) return;
				el.style.willChange = 'scroll-position, transform';
				el.style.contain = 'layout style';
				// Use GPU-accelerated layer
				el.style.transform = 'translateZ(0)';
				el.style.backfaceVisibility = 'hidden';
			});
		}

		function syncScroll() {
			// Skip scroll sync entirely while a template is being loaded
			if (_templateLoading) return;

			if (_scrollPending) return;
			_scrollPending = true;

			if (_scrollRAF) cancelAnimationFrame(_scrollRAF);
			_scrollRAF = requestAnimationFrame(function() {
				_scrollRAF = null;
				_scrollPending = false;

				var textarea = document.getElementById('pyodide_editor_textarea');
				var highlightEl = document.getElementById('pyodide_editor_highlight');
				var lineNumbersEl = document.getElementById('pyodide_editor_line_numbers');
				if (!textarea) return;

				var scrollTop = textarea.scrollTop;
				var scrollLeft = textarea.scrollLeft;

				if (highlightEl) {
					highlightEl.scrollTop = scrollTop;
					highlightEl.scrollLeft = scrollLeft;
				}
				if (lineNumbersEl) {
					lineNumbersEl.scrollTop = scrollTop;
				}
			});
		}


	// =========================================================================
	// HIGHLIGHT SYNC
	// =========================================================================

		function injectScrollPerformanceCSS() {
			var style = document.createElement('style');
			style.id = 'pe-scroll-perf-css';
			style.textContent = `
	/* GPU-accelerate the editor layers */
	#pyodide_editor_textarea,
	#pyodide_editor_highlight,
	#pyodide_editor_line_numbers {
	    -webkit-overflow-scrolling: touch;
	    scroll-behavior: auto !important; /* Disable smooth scroll on these — we want instant */
	    overflow-anchor: none; /* Prevent scroll anchoring interference */
	    will-change: scroll-position;
	    transform: translateZ(0);
	    backface-visibility: hidden;
	    -webkit-backface-visibility: hidden;
	}

	/* Reduce paint cost of highlight overlay */
	#pyodide_editor_highlight {
	    pointer-events: none;
	    contain: strict;
	    content-visibility: auto;
	    contain-intrinsic-size: auto 500px;
	}

	/* Reduce layout cost of line numbers */
	#pyodide_editor_line_numbers {
	    contain: content;
	    content-visibility: auto;
	    contain-intrinsic-size: auto 500px;
	}

	/* Examples panel: reduce off-screen cost */
	#pyodide_examples_panel {
	    contain: layout style paint;
	}

	#pyodide_examples_panel:not(.pe-visible) {
	    content-visibility: hidden;
	}

	/* Prevent layout shift during template load */
	.pe-editor-area {
	    contain: size layout;
	    overflow: hidden;
	}
    `;
			document.head.appendChild(style);
		}

		function updateHighlight() {
			if (_templateLoading) return; // Don't fight with template load

			var textarea = document.getElementById('pyodide_editor_textarea');
			var highlightEl = document.getElementById('pyodide_editor_highlight');
			if (!textarea || !highlightEl) return;

			var code = textarea.value;

			// For very large code (>5000 chars), use a simpler/faster approach
			if (code.length > 5000) {
				// Only highlight visible portion + buffer
				var scrollTop = textarea.scrollTop;
				var lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 18;
				var visibleLines = Math.ceil(textarea.clientHeight / lineHeight);
				var startLine = Math.max(0, Math.floor(scrollTop / lineHeight) - 5);
				var endLine = startLine + visibleLines + 10;

				var lines = code.split('\n');
				var before = lines.slice(0, startLine).join('\n');
				var visible = lines.slice(startLine, endLine).join('\n');
				var after = lines.slice(endLine).join('\n');

				// Only syntax-highlight the visible portion
				var html = escapeHtml(before) + (before ? '\n' : '') +
					highlightPython(visible) + 
					(after ? '\n' : '') + escapeHtml(after) + '\n';
				highlightEl.innerHTML = html;
			} else {
				highlightEl.innerHTML = highlightPython(code) + '\n';
			}

			updateLineNumbers();
			syncScroll();
		}

		function scheduleHighlight() {
			// Don't schedule during template loading — updateHighlightImmediate handles it
			if (_templateLoading) return;
			if (highlightDebounce) cancelAnimationFrame(highlightDebounce);
			highlightDebounce = requestAnimationFrame(updateHighlight);
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

			var isVisible = panel.classList.contains('pe-visible');

			if (isVisible) {
				panel.classList.remove('pe-visible');
				// Use a short delay before hiding to allow CSS transition
				setTimeout(function() {
					if (!panel.classList.contains('pe-visible')) {
						panel.style.display = 'none';
						panel.style.contentVisibility = 'hidden';
					}
				}, 200);
			} else {
				panel.style.contentVisibility = 'visible';
				panel.style.display = 'flex';
				// Force reflow before adding class for smooth transition
				void panel.offsetHeight;
				panel.classList.add('pe-visible');

				if (!_examplesTranslated) {
					_examplesTranslated = true;
					if (typeof translateElement === 'function') {
						translateElement(panel);
					}
				}
			}
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

					// Yield to the browser before heavy work
					await new Promise(function(resolve) { setTimeout(resolve, 0); });

					pyodideInstance = await loadPyodide({
						indexURL: "libs/",
						stdout: function (text) { appendConsole(text + "\n", "stdout"); },
						stderr: function (text) { appendConsole(text + "\n", "stderr"); },
					});

					// Yield again before setting up the Python env
					await new Promise(function(resolve) { setTimeout(resolve, 0); });

					await setupPythonEnvironment();

					pyodideReady = true;
					pyodideLoading = false;
					setStatus("✓ Ready", "ready");
					return;
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

				// Determine expected input shape
				var expectedShape = null;
				try {
					if (model.layers && model.layers[0] && model.layers[0].input) {
						expectedShape = model.layers[0].input.shape; // e.g. [null, 2] or [null, 40, 40, 3]
					}
				} catch (e) {}

				let inputTensor = tf.tensor(jsInput);

				// Auto-add batch dimension if needed
				if (expectedShape && inputTensor.shape.length === expectedShape.length - 1) {
					inputTensor = inputTensor.expandDims(0);
				} else if (inputTensor.shape.length < (expectedShape ? expectedShape.length : 2)) {
					inputTensor = inputTensor.expandDims(0);
				}

				// Validate shape matches (ignoring batch dim)
				if (expectedShape) {
					var tensorShape = inputTensor.shape;
					var shapeOk = tensorShape.length === expectedShape.length;
					if (shapeOk) {
						for (var i = 1; i < expectedShape.length; i++) {
							if (expectedShape[i] !== null && expectedShape[i] !== tensorShape[i]) {
								shapeOk = false;
								break;
							}
						}
					}
					if (!shapeOk) {
						// Try to reshape
						var targetShape = [1];
						for (var j = 1; j < expectedShape.length; j++) {
							targetShape.push(expectedShape[j] || tensorShape[j] || 1);
						}
						try {
							var reshaped = inputTensor.reshape(targetShape);
							inputTensor.dispose();
							inputTensor = reshaped;
						} catch (reshapeErr) {
							inputTensor.dispose();
							throw new Error(
								"Input shape mismatch: got " + JSON.stringify(tensorShape) + 
								" but model expects " + JSON.stringify(expectedShape) +
								". Reshape failed: " + reshapeErr.message
							);
						}
					}
				}

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
			if (!isImageModel()) {
				appendConsole("[⚠️ Webcam not available — model input shape is not image-like (needs [batch, H, W, C])]\n", "warn");
				appendConsole("[💡 Hint] Your model expects input shape: " +
					JSON.stringify(model.layers[0].input.shape) +
					". Use the generic I/O template instead.\n", "info");
				return;
			}

			const video = document.getElementById("pyodide_webcam_video");
			const btn = document.getElementById("pyodide_webcam_btn");
			const btnSimple = document.getElementById("pyodide_webcam_btn_simple");
			const stopBtn = document.getElementById("pyodide_stop_btn");
			if (!video) return;

			// If already running, stop it
			if (webcamStream) {
				stopWebcam();
				return;
			}

			// Auto-load webcam template if editor has no webcam-related code
			const textarea = document.getElementById("pyodide_editor_textarea");
			if (textarea) {
				const code = textarea.value;
				const hasWebcamCode = code.includes("input_data") || code.includes("predict(") || code.includes("webcam");
				if (!hasWebcamCode || code === DEFAULT_CODE) {
					textarea.value = TEMPLATES.image_webcam;
					scheduleHighlight();
					saveEditorContent();
					appendConsole("[📄 Auto-loaded webcam template]\n", "info");
				}
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

				// *** FIX: Enable stop button when webcam starts ***
				if (stopBtn) stopBtn.disabled = false;

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
				if (stopBtn) stopBtn.disabled = true;
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
			const stopBtn = document.getElementById("pyodide_stop_btn");

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

			// *** FIX: Disable stop button when webcam stops (unless code is still running) ***
			if (stopBtn && !isRunning) stopBtn.disabled = true;

			webcamPredicting = false;
			webcamFrameCount = 0;
			webcamFPSDisplay = 0;
			appendConsole("[📷 Webcam stopped]\n", "info");
		}

		// =========================================================================
		// SNAPSHOT MODE — keeps live stream, only captures model input on snap
		// =========================================================================

		let snapshotStream = null;
		let snapshotVideo = null;

		/**
		 * Ensures the live webcam feed is running and visible.
		 * Does NOT stop the stream — it stays live.
		 */
		async function ensureLiveStream() {
		    const video = document.getElementById("pyodide_webcam_video");
		    const container = document.getElementById("pyodide_webcam_container");
		    if (!video || !container) return false;

		    // Already have a live stream running on the video element
		    if (snapshotStream && video.srcObject === snapshotStream && !video.paused && video.readyState >= 2) {
			return true;
		    }

		    // Stop any old frozen/capture streams on the video
		    if (video.srcObject && video.srcObject !== snapshotStream) {
			try {
			    video.srcObject.getTracks().forEach(function(t) { t.stop(); });
			} catch(e) {}
			video.srcObject = null;
		    }

		    // Start a fresh live stream
		    try {
			snapshotStream = await navigator.mediaDevices.getUserMedia({
			    video: { facingMode: "environment", width: { ideal: 320 }, height: { ideal: 320 } },
			    audio: false
			});
		    } catch (e) {
			appendConsole("[📸 Camera error: " + e.message + "]\n", "stderr");
			return false;
		    }

		    video.srcObject = snapshotStream;
		    video.setAttribute("playsinline", "");
		    video.muted = true;
		    container.style.display = "block";

		    await new Promise(function(resolve) {
			if (video.readyState >= 2) {
			    resolve();
			} else {
			    video.onloadedmetadata = function() {
				video.play();
				resolve();
			    };
			}
		    });

		    await video.play().catch(function() {});

		    // Wait a moment for frames to actually flow
		    await new Promise(function(resolve) { setTimeout(resolve, 300); });

		    appendConsole("[📷 Live camera feed active]\n", "info");
		    return true;
		}

		/**
		 * Takes a snapshot: grabs the CURRENT frame from the live video,
		 * resizes it to model input size, sets input_data, and runs the code.
		 * The live video stream is NEVER stopped.
		 */
		async function takeSnapshot() {
		    if (!isImageModel()) {
			appendConsole("[⚠️ Snapshot requires an image model]\n", "warn");
			return;
		    }

		    if (!pyodideReady) {
			appendConsole("[⏳ Initializing Pyodide first...]\n", "info");
			await initPyodide();
			if (!pyodideReady) return;
		    }

		    // Ensure live stream is running (starts it if not already)
		    const streamReady = await ensureLiveStream();
		    if (!streamReady) return;

		    const video = document.getElementById("pyodide_webcam_video");
		    if (!video || video.readyState < 2) {
			appendConsole("[⚠️ Video not ready yet, try again]\n", "warn");
			return;
		    }

		    // Get model input dimensions
		    var info = getModelInfoForPython();
		    if (!info || !info.input_shape) {
			appendConsole("[Error] No model loaded.\n", "stderr");
			return;
		    }

		    var inputShape = info.input_shape;
		    var targetH = inputShape[1] || 40;
		    var targetW = inputShape[2] || 40;
		    var channels = inputShape[3] || 3;

		    // === Grab current frame and resize to model input size ===
		    var modelCanvas = document.createElement("canvas");
		    modelCanvas.width = targetW;
		    modelCanvas.height = targetH;
		    var modelCtx = modelCanvas.getContext("2d");
		    modelCtx.drawImage(video, 0, 0, targetW, targetH);

		    var imageData = modelCtx.getImageData(0, 0, targetW, targetH);
		    var inputList = pixelsToNestedList(imageData.data, targetH, targetW, channels);

		    // Set input_data in Python (video stays live — we only changed the data)
		    try {
			pyodideInstance.globals.set("input_data", pyodideInstance.toPy(inputList));

			var labelsList = (typeof labels !== "undefined" && Array.isArray(labels)) ? labels : [];
			var classificationFlag = (typeof is_classification !== "undefined") ? !!is_classification : false;
			pyodideInstance.globals.set("_labels", pyodideInstance.toPy(labelsList));
			pyodideInstance.globals.set("_is_classification", classificationFlag);
		    } catch (e) {
			appendConsole("[Error setting input] " + e.message + "\n", "stderr");
			return;
		    }

		    appendConsole("[📸 Snap! Frame captured (" + targetW + "x" + targetH + ") — stream still live]\n", "info");

		    // Auto-run the code
		    await pyodideEditorRun();
		}

		/**
		 * Stops the snapshot live stream (called from stop button or cleanup)
		 */
		function stopSnapshotStream() {
		    if (snapshotStream) {
			snapshotStream.getTracks().forEach(function(t) { t.stop(); });
			snapshotStream = null;
		    }
		    var video = document.getElementById("pyodide_webcam_video");
		    if (video && video.srcObject) {
			video.srcObject = null;
		    }
		    var container = document.getElementById("pyodide_webcam_container");
		    if (container) container.style.display = "none";
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
			if (!isEffectivelyVisible()) return;  // <-- ADD THIS
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

			// Check if model is still valid
			try {
				if (!model || !model.layers || !model.predict) return;
				if (model.weights && model.weights.length > 0 && model.weights[0].isDisposed) {
					return;
				}
			} catch (e) {
				return;
			}

			var info = getModelInfoForPython();
			if (!info || !info.input_shape) return;

			var inputShape = info.input_shape; // e.g. [null, 40, 40, 3] or [null, 2]
			var inputRank = inputShape.length; // 4 = image model, 2 = flat model

			var inputList;

			if (inputRank === 4) {
				// *** IMAGE MODEL: send pixel data as [H, W, C] ***
				var targetH = inputShape[1] || 40;
				var targetW = inputShape[2] || 40;
				var channels = inputShape[3] || 3;

				canvas.width = targetW;
				canvas.height = targetH;
				var ctx = canvas.getContext("2d");
				ctx.drawImage(video, 0, 0, targetW, targetH);

				var imageData = ctx.getImageData(0, 0, targetW, targetH);
				inputList = pixelsToNestedList(imageData.data, targetH, targetW, channels);
			} else if (inputRank === 3) {
				// *** 3D input (e.g. [null, timesteps, features]) — extract some features from frame ***
				var dim1 = inputShape[1] || 1;
				var dim2 = inputShape[2] || 1;

				// Use average pixel values as a rough feature extraction
				canvas.width = dim1;
				canvas.height = dim2;
				var ctx3 = canvas.getContext("2d");
				ctx3.drawImage(video, 0, 0, dim1, dim2);
				var imgData3 = ctx3.getImageData(0, 0, dim1, dim2);

				inputList = [];
				for (var i = 0; i < dim1; i++) {
					var row = [];
					for (var j = 0; j < dim2; j++) {
						var idx = (i * dim2 + j) * 4;
						var avg = (imgData3.data[idx] + imgData3.data[idx+1] + imgData3.data[idx+2]) / 3;
						var divBy = getDivideByValue();
						if (divBy > 0) avg = avg / divBy;
						row.push(avg);
					}
					inputList.push(row);
				}
			} else if (inputRank === 2) {
				// *** FLAT MODEL (e.g. [null, 2]) — extract summary features from frame ***
				var numFeatures = inputShape[1] || 1;

				// Draw a small frame and extract features
				canvas.width = 8;
				canvas.height = 8;
				var ctx2 = canvas.getContext("2d");
				ctx2.drawImage(video, 0, 0, 8, 8);
				var imgData2 = ctx2.getImageData(0, 0, 8, 8);

				// Extract N features from the frame (average brightness regions)
				inputList = [];
				var totalPixels = 64; // 8x8
				var pixelsPerFeature = Math.max(1, Math.floor(totalPixels / numFeatures));

				for (var f = 0; f < numFeatures; f++) {
					var sum = 0;
					var count = 0;
					for (var p = f * pixelsPerFeature; p < Math.min((f + 1) * pixelsPerFeature, totalPixels); p++) {
						var pidx = p * 4;
						sum += (imgData2.data[pidx] + imgData2.data[pidx+1] + imgData2.data[pidx+2]) / 3;
						count++;
					}
					var featureVal = count > 0 ? sum / count : 0;
					var divByFlat = getDivideByValue();
					if (divByFlat > 0) featureVal = featureVal / divByFlat;
					else featureVal = featureVal / 255.0; // normalize to 0-1 by default for flat models
					inputList.push(featureVal);
				}
			} else {
				// Unknown rank — skip
				return;
			}

			// Set input_data in Python
			if (pyodideInstance) {
				try {
					pyodideInstance.globals.set("input_data", pyodideInstance.toPy(inputList));
				} catch (e) {
					return;
				}
			}

			// Pass labels and is_classification to Python
			if (pyodideInstance) {
				try {
					var labelsList = (typeof labels !== "undefined" && Array.isArray(labels)) ? labels : [];
					var classificationFlag = (typeof is_classification !== "undefined") ? !!is_classification : false;
					pyodideInstance.globals.set("_labels", pyodideInstance.toPy(labelsList));
					pyodideInstance.globals.set("_is_classification", classificationFlag);
				} catch (e) {
					// Non-critical
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
				if (msg.includes("disposed") || msg.includes("No model") || msg.includes("Prediction failed")) {
					return;
				}
				if (msg.includes("KeyboardInterrupt")) {
					stopWebcam();
					return;
				}
				console.warn("Webcam frame script error:", msg);
			}
		}

		function pixelsToNestedList(pixels, height, width, channels) {
			// Do NOT divide here — let runPredictionForPython handle it
			var result = [];
			for (var y = 0; y < height; y++) {
				var row = [];
				for (var x = 0; x < width; x++) {
					var idx = (y * width + x) * 4;
					if (channels === 1) {
						var avg = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
						row.push([avg]);
					} else {
						var pixel = [];
						for (var c = 0; c < channels; c++) {
							pixel.push(pixels[idx + c]);
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
			// AUTOCOMPLETE GUARD: Never auto-execute during or shortly after autocomplete
			if (window._acInserting) return;
			if (window._acRecentlyInserted) return;

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
			if (!isRunning && !webcamStream && !snapshotStream) return;

			interruptExecution = true;
			isRunning = false;
			runCounter++;

			if (webcamStream) {
				stopWebcam();
			}

			// Also stop snapshot live stream
			if (snapshotStream) {
				stopSnapshotStream();
			}

			appendConsole("\n[⏹ Stopped]\n", "warn");
			setStatus("✓ Ready", "ready");

			const stopBtn = document.getElementById("pyodide_stop_btn");
			if (stopBtn) stopBtn.disabled = true;

			var wrapper = document.getElementById("pyodide_editor_wrapper");
			if (wrapper) {
				wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
			}
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

	function updateHighlightImmediate() {
		var textarea = document.getElementById('pyodide_editor_textarea');
		var highlightEl = document.getElementById('pyodide_editor_highlight');
		if (!textarea || !highlightEl) return;

		var code = textarea.value;

		// Temporarily disable pointer events and transitions during bulk update
		highlightEl.style.pointerEvents = 'none';
		highlightEl.style.transition = 'none';

		highlightEl.innerHTML = highlightPython(code) + '\n';
		updateLineNumbers();

		// Force layout recalc, then re-enable
		void highlightEl.offsetHeight; // Force reflow

		highlightEl.style.pointerEvents = '';
		highlightEl.style.transition = '';

		// Ensure scroll is at top for new content
		highlightEl.scrollTop = 0;
		highlightEl.scrollLeft = 0;
	}

	function loadTemplate(name) {
		const textarea = document.getElementById("pyodide_editor_textarea");
		if (!textarea || !TEMPLATES[name]) return;

		if (name.startsWith('image_webcam') && !isImageModel()) {
			appendConsole("[⚠️ Webcam templates require an image model]\n", "warn");
			name = 'generic_io';
		}

		// --- FREEZE scrolling during template load ---
		_templateLoading = true;

		// Immediately reset scroll position BEFORE changing content
		textarea.scrollTop = 0;
		textarea.scrollLeft = 0;

		var highlightEl = document.getElementById('pyodide_editor_highlight');
		var lineNumbersEl = document.getElementById('pyodide_editor_line_numbers');
		if (highlightEl) { highlightEl.scrollTop = 0; highlightEl.scrollLeft = 0; }
		if (lineNumbersEl) { lineNumbersEl.scrollTop = 0; }

		// Set new content
		textarea.value = TEMPLATES[name];
		saveEditorContent();

		// Force immediate highlight (not debounced) so content is ready
		updateHighlightImmediate();

		// Close examples panel
		var panel = document.getElementById('pyodide_examples_panel');
		if (panel) {
			panel.classList.remove('pe-visible');
			panel.style.display = 'none';
		}

		appendConsole("[📄 Loaded template: " + name + "]\n", "info");

		// --- UNFREEZE after a short delay to let the browser settle ---
		clearTimeout(_templateLoadTimer);
		_templateLoadTimer = setTimeout(function() {
			_templateLoading = false;
		}, 150);

		// Auto-start webcam / auto-run logic (unchanged)
		if (name === 'image_webcam') {
			if (!webcamStream) {
				appendConsole("[📷 Auto-starting webcam...]\n", "info");
				startWebcam();
			}
		}
		if (name === 'random_input' || name === 'weights_inspect' || name === 'hello_world') {
			setTimeout(function () { pyodideEditorRun(); }, 100);
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
				// AUTOCOMPLETE GUARD
				if (window._acInserting) return;

				if (!livePredictEnabled || isRunning) return;

				clearTimeout(livePredictDebounceTimer);
				livePredictDebounceTimer = setTimeout(async function () {
					// Check AGAIN — the flag might have been set and cleared during the delay
					// Also check the secondary "cooldown" flag
					if (window._acInserting) return;
					if (window._acRecentlyInserted) return;
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

			// Check if classification mode
			var isClassif = false;
			try {
				if (typeof is_classification !== "undefined") {
					isClassif = !!is_classification;
				}
			} catch (e) {}

			// If NOT classification, just show raw values without labels
			if (!isClassif) {
				var lines = [];
				lines.push("🎯 Output (" + result.length + " values):");
				lines.push("─".repeat(36));
				for (var k = 0; k < result.length; k++) {
					var val = typeof result[k] === "number" ? result[k] : parseFloat(result[k]);
					lines.push("  [" + k + "] " + val.toFixed(6));
				}
				return lines.join("\n");
			}

			// Classification mode — show labels and bars
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

	function autoResizeTextarea() {
		// REMOVED / NO-OP: This function causes severe layout thrashing
		// (resetting height to 'auto' then reading scrollHeight forces synchronous reflow)
		// which directly conflicts with scroll performance.
		// The editor should use a fixed height with overflow:auto instead.
	}

	function setupEditorKeyHandlers() {
		var textarea = document.getElementById("pyodide_editor_textarea");
		if (!textarea) return;

		textarea.addEventListener("input", function () {
			// Don't schedule highlight during template loading
			if (!_templateLoading) {
				scheduleHighlight();
			}
			// Debounced auto-save
			clearTimeout(autoSaveTimer);
			autoSaveTimer = setTimeout(saveEditorContent, 3000);
		});

		// PASSIVE scroll listener — tells browser we won't call preventDefault()
		// This allows the browser to scroll immediately without waiting for JS
		textarea.addEventListener("scroll", syncScroll, { passive: true });

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

		applyScrollPerformanceHints();

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

	function handleTabMutation(mutation) {
		if (mutation.type !== "attributes" || mutation.attributeName !== "style") return;
		var tab = document.getElementById("pyodide_editor_tab");
		if (!tab || tab.style.display === "none" || pyodideReady || pyodideLoading) return;

		if (window.requestIdleCallback) {
			requestIdleCallback(function() { initPyodide(); }, { timeout: 5000 });
		} else {
			setTimeout(function() { initPyodide(); }, 500);
		}
	}

	function initWhenReady() {
		injectScrollPerformanceCSS();   // <-- FIX 10
		applyScrollPerformanceHints();  // <-- FIX 2
		setupEditorKeyHandlers();
		setupLivePredictions();
		setupVisibilityObservers();

		// Watch for tab visibility to auto-init Pyodide IN THE BACKGROUND
		_tabObserver = new MutationObserver(function (mutations) {
			for (var i = 0; i < mutations.length; i++) {
				handleTabMutation(mutations[i]);
			}
		});

		var pyodideTab = document.getElementById("pyodide_editor_tab");
		if (pyodideTab) {
			_tabObserver.observe(pyodideTab, { attributes: true, attributeFilter: ["style"] });

			if (pyodideTab.style.display !== "none" && pyodideTab.offsetParent !== null) {
				if (window.requestIdleCallback) {
					requestIdleCallback(function() { initPyodide(); }, { timeout: 2000 });
				} else {
					setTimeout(function() { initPyodide(); }, 100);
				}
			}
		}

		// Auto-save every 30 seconds
		setInterval(saveEditorContent, 30000);
	}

	// =========================================================================
	// MULTI-PHOTO CAPTURE (Group Snap)
	// =========================================================================

	function togglePhotosPanel() {
	    var container = document.getElementById("pyodide_photos_container");
	    if (!container) return;

	    if (container.style.display === "block") {
		container.style.display = "none";
	    } else {
		container.style.display = "block";
		// Ensure live stream is running for snapping
		if (isImageModel()) {
		    ensureLiveStream();
		}
	    }
	}

	async function photosSnap() {
	    if (!isImageModel()) {
		appendConsole("[⚠️ Multi-snap requires an image model]\n", "warn");
		return;
	    }

	    if (!pyodideReady) {
		appendConsole("[⏳ Initializing Pyodide first...]\n", "info");
		await initPyodide();
		if (!pyodideReady) return;
	    }

	    // Ensure live stream is running
	    var streamReady = await ensureLiveStream();
	    if (!streamReady) return;

	    var video = document.getElementById("pyodide_webcam_video");
	    if (!video || video.readyState < 2) {
		appendConsole("[⚠️ Video not ready yet, try again]\n", "warn");
		return;
	    }

	    // Get model input dimensions
	    var info = getModelInfoForPython();
	    if (!info || !info.input_shape) {
		appendConsole("[Error] No model loaded.\n", "stderr");
		return;
	    }

	    var inputShape = info.input_shape;
	    var targetH = inputShape[1] || 40;
	    var targetW = inputShape[2] || 40;
	    var channels = inputShape[3] || 3;

	    // Grab current frame and resize to model input size
	    var modelCanvas = document.createElement("canvas");
	    modelCanvas.width = targetW;
	    modelCanvas.height = targetH;
	    var modelCtx = modelCanvas.getContext("2d");
	    modelCtx.drawImage(video, 0, 0, targetW, targetH);

	    var imageData = modelCtx.getImageData(0, 0, targetW, targetH);
	    var inputList = pixelsToNestedList(imageData.data, targetH, targetW, channels);

	    // Also create a larger thumbnail for display
	    var thumbCanvas = document.createElement("canvas");
	    thumbCanvas.width = 128;
	    thumbCanvas.height = 128;
	    var thumbCtx = thumbCanvas.getContext("2d");
	    thumbCtx.drawImage(video, 0, 0, 128, 128);
	    var thumbnailDataURL = thumbCanvas.toDataURL("image/jpeg", 0.7);

	    // Store the photo
	    var photoIndex = capturedPhotos.length;
	    capturedPhotos.push({
		pixelData: inputList,
		thumbnailDataURL: thumbnailDataURL,
		index: photoIndex
	    });

	    // Update the visual strip
	    updatePhotosStrip();

	    // Update status
	    var needed = parseInt(document.getElementById("pyodide_photos_needed").value) || 4;
	    updatePhotosStatus();

	    appendConsole("[📸 Photo " + (photoIndex + 1) + " captured (" + targetW + "x" + targetH + ")]\n", "info");

	    if (capturedPhotos.length >= needed) {
		appendConsole("[✅ All " + needed + " photos captured! Press ▶ Run with Photos or use photos[] in your code]\n", "info");
	    }
	}

	function photosRemove(index) {
	    capturedPhotos.splice(index, 1);
	    // Re-index
	    for (var i = 0; i < capturedPhotos.length; i++) {
		capturedPhotos[i].index = i;
	    }
	    updatePhotosStrip();
	    updatePhotosStatus();
	}

	function photosClear() {
	    capturedPhotos = [];
	    updatePhotosStrip();
	    updatePhotosStatus();
	    appendConsole("[🗑️ All photos cleared]\n", "info");
	}

	function updatePhotosStrip() {
	    var strip = document.getElementById("pyodide_photos_strip");
	    if (!strip) return;

	    if (capturedPhotos.length === 0) {
		strip.innerHTML = '<span style="color:var(--pe-muted);font-size:11px;font-style:italic;">No photos yet — press 📸 Snap to capture</span>';
		return;
	    }

	    var html = '';
	    for (var i = 0; i < capturedPhotos.length; i++) {
		html += '<div class="pe-photo-thumb" title="photos[' + i + ']">';
		html += '<img src="' + capturedPhotos[i].thumbnailDataURL + '" alt="Photo ' + i + '">';
		html += '<div class="pe-photo-label">photos[' + i + ']</div>';
		html += '<div class="pe-photo-remove" onclick="event.stopPropagation();pyodidePhotosRemove(' + i + ')">×</div>';
		html += '</div>';
	    }
	    strip.innerHTML = html;
	}

	function updatePhotosStatus() {
	    var statusEl = document.getElementById("pyodide_photos_status");
	    if (!statusEl) return;
	    var needed = parseInt(document.getElementById("pyodide_photos_needed").value) || 4;
	    var count = capturedPhotos.length;
	    var color = count >= needed ? "#00d4aa" : "#ffd93d";
	    statusEl.innerHTML = '<span style="color:' + color + ';">' + count + ' / ' + needed + ' photos captured</span>';
	}

	async function photosRun() {
	    if (capturedPhotos.length === 0) {
		appendConsole("[⚠️ No photos captured yet! Press 📸 Snap first.]\n", "warn");
		return;
	    }

	    if (!pyodideReady) {
		appendConsole("[⏳ Initializing Pyodide first...]\n", "info");
		await initPyodide();
		if (!pyodideReady) return;
	    }

	    // Set the photos list in Python
	    try {
		var photoDataList = capturedPhotos.map(function(p) { return p.pixelData; });
		pyodideInstance.globals.set("photos", pyodideInstance.toPy(photoDataList));
		pyodideInstance.globals.set("num_photos", capturedPhotos.length);

		// Also set labels and classification flag
		var labelsList = (typeof labels !== "undefined" && Array.isArray(labels)) ? labels : [];
		var classificationFlag = (typeof is_classification !== "undefined") ? !!is_classification : false;
		pyodideInstance.globals.set("_labels", pyodideInstance.toPy(labelsList));
		pyodideInstance.globals.set("_is_classification", classificationFlag);
	    } catch (e) {
		appendConsole("[Error setting photos] " + e.message + "\n", "stderr");
		return;
	    }

	    appendConsole("[📸 " + capturedPhotos.length + " photos loaded into `photos` list — running code...]\n", "info");

	    // Run the editor code
	    await pyodideEditorRun();
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
	// VISIBILITY-BASED PAUSE/RESUME
	// =========================================================================

	let editorVisible = true;
	let pageVisible = true;

	function isEffectivelyVisible() {
	    return editorVisible && pageVisible;
	}

	function pauseCalculations() {
	    if (webcamInterval) {
		clearInterval(webcamInterval);
		webcamInterval = null;
	    }
	    if (webcamFPSTimer) {
		clearInterval(webcamFPSTimer);
		webcamFPSTimer = null;
	    }
	}

	function resumeCalculations() {
	    // Only resume webcam loop if stream is still active
	    if (webcamStream && !webcamInterval) {
		startWebcamPredictionLoop();
	    }
	}

	function onVisibilityChange() {
	    var wasVisible = isEffectivelyVisible();

	    // Check page visibility
	    pageVisible = !document.hidden;

	    // Now check if state changed
	    var nowVisible = isEffectivelyVisible();

	    if (wasVisible && !nowVisible) {
		pauseCalculations();
	    } else if (!wasVisible && nowVisible) {
		resumeCalculations();
	    }
	}

	function setupVisibilityObservers() {
	    // 1. Page Visibility API (tab switch, minimize)
	    document.addEventListener("visibilitychange", onVisibilityChange);

	    // 2. IntersectionObserver (scrolled out of view, hidden div)
	    var wrapper = document.getElementById("pyodide_editor_wrapper");
	    if (wrapper && window.IntersectionObserver) {
		var observer = new IntersectionObserver(function(entries) {
		    var wasVisible = isEffectivelyVisible();
		    editorVisible = entries[0].isIntersecting;
		    var nowVisible = isEffectivelyVisible();

		    if (wasVisible && !nowVisible) {
			pauseCalculations();
		    } else if (!wasVisible && nowVisible) {
			resumeCalculations();
		    }
		}, {
		    threshold: 0.05  // At least 5% visible to be considered "visible"
		});
		observer.observe(wrapper);
	    }

	    // 3. Also watch the parent tab div for display:none toggling
	    var pyodideTab = document.getElementById("pyodide_editor_tab");
	    if (pyodideTab && window.MutationObserver) {
		var mutObs = new MutationObserver(function() {
		    var wasVisible = isEffectivelyVisible();
		    // Check if the tab is hidden via display:none
		    editorVisible = (pyodideTab.style.display !== "none" && pyodideTab.offsetParent !== null);
		    var nowVisible = isEffectivelyVisible();

		    if (wasVisible && !nowVisible) {
			pauseCalculations();
		    } else if (!wasVisible && nowVisible) {
			resumeCalculations();
		    }
		});
		mutObs.observe(pyodideTab, { attributes: true, attributeFilter: ["style", "class"] });
	    }
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
	window.pyodideOnModelChanged = updateWebcamAvailability;
	window.pyodideSnapshot = takeSnapshot;
	window.pyodideTogglePhotos = togglePhotosPanel;
	window.pyodidePhotosSnap = photosSnap;
	window.pyodidePhotosRemove = photosRemove;
	window.pyodidePhotosClear = photosClear;
	window.pyodidePhotosRun = photosRun;

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
		insertSnippet: insertSnippet,
		onModelChanged: updateWebcamAvailability,
		snapshot: takeSnapshot,
		togglePhotos: togglePhotosPanel,
		photosSnap: photosSnap,
		photosClear: photosClear,
		photosRun: photosRun,
		getCapturedPhotos: function() { return capturedPhotos; }
	};

})();
