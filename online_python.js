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

	var _consoleBatch = [];
	var _consoleFlushRAF = null;
	var _consoleScrollRAF = null;

	var _cachedLineHeight = 18;
	var _cachedClientHeight = 400;
	var _layoutCacheTimer = null;

	var _lastHighlightTime = 0;
	var _highlightThrottleMs = 32; // ~30fps max for highlighting
	var _predictionUpdateRAF = null;
	var _pendingPredictionText = null;

	// =========================================================================
	// DEFAULT CODE TEMPLATES
	// =========================================================================

// =========================================================================
// PRE-INJECTED PYTHON HELPERS (invisible boilerplate, always available)
// =========================================================================

const PYTHON_PRELUDE = `
# === PRE-INJECTED HELPERS (always available, fully overridable) ===

def _get_label(idx, labels=None, is_classif=None):
    """Get human-readable label for a class index."""
    if labels is None:
        labels = _labels if '_labels' in dir() and _labels else None
    if is_classif is None:
        is_classif = _is_classification if '_is_classification' in dir() else False
    if labels and is_classif and idx < len(labels):
        return labels[idx]
    return f"Class {idx}"

def _setup_model():
    """Standard model setup — returns info dict with common fields populated."""
    info = get_model_info()
    labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    is_image = len(info['input_shape']) == 4
    return {
        'info': info,
        'labels': labels,
        'is_classif': is_classif,
        'is_image': is_image,
        'input_shape': info['input_shape'],
        'output_shape': info['output_shape'],
        'num_classes': info['output_shape'][-1] if info['output_shape'] else 0,
        'frame_count': 0,
    }

def _sample_shape(input_shape=None):
    """Get sample input shape (strips batch dim, replaces None with 1)."""
    if input_shape is None:
        input_shape = get_model_info()['input_shape']
    return [s if s is not None else 1 for s in input_shape[1:]]

def _format_result(result, labels=None, is_classif=None):
    """Format prediction result as a human-readable string."""
    if labels is None:
        labels = _labels if '_labels' in dir() and _labels else None
    if is_classif is None:
        is_classif = _is_classification if '_is_classification' in dir() else False
    if isinstance(result, list) and len(result) > 1 and is_classif:
        top_idx = result.index(max(result))
        conf = result[top_idx] * 100
        label = _get_label(top_idx, labels, is_classif)
        return f"🏆 {label} ({conf:.1f}%)"
    elif isinstance(result, list) and len(result) > 1:
        vals = ', '.join(f'{v:.4f}' for v in result[:5])
        suffix = '...' if len(result) > 5 else ''
        return f"Output: [{vals}{suffix}]"
    else:
        return f"Result: {result}"

def _print_model_summary(info=None):
    """Print a formatted model summary."""
    if info is None:
        info = get_model_info()
    labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    print(f"Model Summary")
    print(f"   Input:  {info['input_shape']}")
    print(f"   Output: {info['output_shape']}")
    print(f"   Layers: {info['num_layers']}")
    print(f"   Params: {info['trainable_params']:,} trainable")
    if labels and is_classif:
        print(f"   Labels: {list(labels)}")
    print()

def _print_all_classes(result, labels=None, is_classif=None):
    """Print sorted class predictions with bar chart."""
    if labels is None:
        labels = _labels if '_labels' in dir() and _labels else None
    if is_classif is None:
        is_classif = _is_classification if '_is_classification' in dir() else False
    if not isinstance(result, list) or len(result) <= 1:
        print(f"  Result: {result}")
        return
    indexed = sorted(enumerate(result), key=lambda x: x[1], reverse=True)
    for idx, conf in indexed:
        bar = "█" * int(conf * 20)
        label = _get_label(idx, labels, is_classif)
        print(f"  {label:12s} {conf*100:5.1f}% {bar}")

def _predict_and_show(data=None, verbose=True):
    """Predict on data, set result in UI, and optionally print formatted output."""
    result = predict(data)
    set_prediction_result(result)
    if verbose:
        print(f"🎯 {_format_result(result)}")
    return result

def _draw_bar_chart(values, chart_labels=None, title="📊 Chart", width=420, height=220):
    """Draw a bar chart on a canvas and display it."""
    import random as _r
    if chart_labels is None:
        labels_list = _labels if '_labels' in dir() and _labels else None
        chart_labels = list(labels_list) if labels_list else [f"Item {i}" for i in range(len(values))]
    
    max_val = max(values) if values else 1
    num_bars = len(values)
    canvas = create_canvas(width, height)
    ctx = canvas.getContext("2d")
    
    ctx.fillStyle = "#1e1e2e"
    ctx.fillRect(0, 0, width, height)
    
    bar_width = max(20, (width - 40 - (num_bars - 1) * 8) // num_bars)
    gap = 8
    start_x = (width - (num_bars * bar_width + (num_bars - 1) * gap)) // 2
    
    for i, (label, val) in enumerate(zip(chart_labels, values)):
        x = start_x + i * (bar_width + gap)
        bar_height = (val / max_val) * (height - 70)
        y = height - 35 - bar_height
        hue = i * (360 // max(num_bars, 1))
        
        ctx.fillStyle = f"hsl({hue}, 70%, 60%)"
        ctx.fillRect(x, y, bar_width, bar_height)
        
        if val == max_val:
            ctx.strokeStyle = "#fff"
            ctx.lineWidth = 2
            ctx.strokeRect(x, y, bar_width, bar_height)
        
        ctx.fillStyle = "#cdd6f4"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        short = label[:7] if len(label) > 7 else label
        ctx.fillText(short, x + bar_width / 2, height - 18)
        ctx.fillText(f"{val:.2f}", x + bar_width / 2, y - 8)
    
    ctx.fillStyle = "#89b4fa"
    ctx.font = "bold 14px sans-serif"
    ctx.textAlign = "left"
    ctx.fillText(title, 10, 22)
    
    display(canvas)

def _smooth_predictions(buffer):
    """Average a list of prediction arrays (sliding window smoothing)."""
    if not buffer:
        return []
    num_cls = len(buffer[0])
    smoothed = [0.0] * num_cls
    for pred in buffer:
        for i in range(num_cls):
            smoothed[i] += pred[i]
    return [s / len(buffer) for s in smoothed]

def _top_prediction(result):
    """Return (index, confidence) of the top prediction."""
    if not result:
        return 0, 0.0
    top_idx = result.index(max(result))
    return top_idx, result[top_idx]

def _get_tensor_shape(w):
    """Get shape of a nested list (weight tensor)."""
    shape = []
    temp = w
    while isinstance(temp, list):
        shape.append(len(temp))
        temp = temp[0] if len(temp) > 0 else []
    return shape
`;

// =========================================================================
// DEFAULT CODE TEMPLATES (drastically shortened using pre-injected helpers)
// =========================================================================

const TEMPLATES = {
    image_webcam: `# 📷 Live Webcam Prediction
# Runs on EVERY frame from the webcam.

if 'state' not in dir():
    state = _setup_model()
    _print_model_summary()

if input_data is not None:
    state['frame_count'] += 1
    result = _predict_and_show(input_data, verbose=False)

    if state['frame_count'] % 5 == 0:
        print(f"Frame {state['frame_count']} | {_format_result(result)}")
else:
    print("⏳ Waiting for webcam frame...")
`,

    image_webcam_tracking: `# 📷 Webcam + Confidence Tracking
# Tracks predictions over time and detects stable classifications.

STABLE_THRESHOLD = 10

if 'state' not in dir():
    state = _setup_model()
    state['history'] = []
    state['stable_count'] = 0
    state['last_class'] = -1
    _print_model_summary()
    print(f"   Tracking stability over {STABLE_THRESHOLD} frames\\n")

if input_data is not None:
    state['frame_count'] += 1
    result = predict(input_data)
    set_prediction_result(result)

    if isinstance(result, list) and len(result) > 1:
        top_idx, confidence = _top_prediction(result)
        state['history'].append({'class': top_idx, 'conf': confidence})
        if len(state['history']) > 60:
            state['history'] = state['history'][-60:]

        # Check stability
        if top_idx == state['last_class']:
            state['stable_count'] += 1
        else:
            state['stable_count'] = 1
            state['last_class'] = top_idx

        if state['stable_count'] == STABLE_THRESHOLD:
            recent = state['history'][-STABLE_THRESHOLD:]
            avg = sum(h['conf'] for h in recent) / len(recent)
            print(f"🔒 STABLE: {_get_label(top_idx)} for {STABLE_THRESHOLD} frames (avg {avg*100:.1f}%)")

        if state['frame_count'] % 15 == 0:
            recent = state['history'][-15:]
            avg = sum(h['conf'] for h in recent) / len(recent)
            print(f"📊 Frame {state['frame_count']} | {_get_label(top_idx)} | Avg: {avg*100:.1f}% | Stable: {state['stable_count']}")
`,

    image_webcam_threshold: `# 📷 Webcam + Threshold Alerts
# Only prints when confidence exceeds a threshold.

HIGH_THRESHOLD = 0.85
LOW_THRESHOLD = 0.30

if 'state' not in dir():
    state = _setup_model()
    state['alert_count'] = 0
    _print_model_summary()
    print(f"⚙️  High: {HIGH_THRESHOLD*100:.0f}% | Low: {LOW_THRESHOLD*100:.0f}%\\n")

if input_data is not None:
    state['frame_count'] += 1
    result = predict(input_data)
    set_prediction_result(result)

    if isinstance(result, list) and len(result) > 1:
        top_idx, confidence = _top_prediction(result)
        label = _get_label(top_idx)
        fc = state['frame_count']

        if confidence >= HIGH_THRESHOLD:
            state['alert_count'] += 1
            print(f"🚨 HIGH [{fc}]: {label} at {confidence*100:.1f}% (alert #{state['alert_count']})")
        elif confidence <= LOW_THRESHOLD:
            print(f"🤷 LOW  [{fc}]: Best guess {label} at {confidence*100:.1f}%")
`,

    image_webcam_multiclass: `# 📷 Webcam + Multi-Class Monitor
# Reports when any class exceeds its previous peak.

if 'state' not in dir():
    state = _setup_model()
    state['peaks'] = {i: 0.0 for i in range(state['num_classes'])}
    _print_model_summary()
    print(f"   Monitoring {state['num_classes']} classes for new peaks\\n")

if input_data is not None:
    state['frame_count'] += 1
    result = predict(input_data)
    set_prediction_result(result)

    if isinstance(result, list) and len(result) > 1:
        for idx, conf in enumerate(result):
            if conf > state['peaks'][idx] + 0.1:
                state['peaks'][idx] = conf
                print(f"📈 NEW PEAK [{state['frame_count']}]: {_get_label(idx)} → {conf*100:.1f}%")

        if state['frame_count'] % 30 == 0:
            print(f"\\n--- Frame {state['frame_count']} Summary ---")
            for idx in sorted(state['peaks'], key=state['peaks'].get, reverse=True):
                bar = "█" * int(state['peaks'][idx] * 20)
                print(f"  {_get_label(idx):12s}: {state['peaks'][idx]*100:.1f}% {bar}")
            print()
`,

    image_webcam_smoothed: `# 📷 Webcam + Smoothed Predictions
# Averages predictions over a sliding window to reduce noise.

WINDOW_SIZE = 10

if 'state' not in dir():
    state = _setup_model()
    state['buffer'] = []
    _print_model_summary()
    print(f"📊 Smoothing window: {WINDOW_SIZE} frames\\n")

if input_data is not None:
    state['frame_count'] += 1
    result = predict(input_data)

    if isinstance(result, list) and len(result) > 1:
        state['buffer'].append(result)
        if len(state['buffer']) > WINDOW_SIZE:
            state['buffer'] = state['buffer'][-WINDOW_SIZE:]

        smoothed = _smooth_predictions(state['buffer'])
        set_prediction_result(smoothed)

        if state['frame_count'] % 10 == 0:
            raw_idx, raw_conf = _top_prediction(result)
            sm_idx, sm_conf = _top_prediction(smoothed)
            print(f"Frame {state['frame_count']} | Raw: {_get_label(raw_idx)} ({raw_conf*100:.1f}%) | Smooth: {_get_label(sm_idx)} ({sm_conf*100:.1f}%)")
`,

    custom_data: `# ✏️ Custom Data Prediction
# Enter your own data and predict.

info = get_model_info()
_print_model_summary()

# Auto-generate matching input for testing:
shape = _sample_shape()
print(f"Generating test data with shape: {shape}")
my_data = rand_nested(shape)

# You can replace my_data with your own values:
# my_data = [[0.1, 0.5, 0.3, ...]]

result = _predict_and_show(my_data)
print()
_print_all_classes(result)
`,

    weights_inspect: `# 🔍 Inspect Model Weights

info = get_model_info()
_print_model_summary()

print("📋 Layer Details")
print("-" * 50)
for i, (name, ltype) in enumerate(zip(info['layer_names'], info['layer_types'])):
    print(f"  [{i}] {ltype:20s} → {name}")
print()

weights = get_weights()
if weights:
    print("⚖️  Weight Tensors")
    print("-" * 50)
    total = 0
    for i, w in enumerate(weights):
        if isinstance(w, list):
            shape = _get_tensor_shape(w)
            size = 1
            for s in shape:
                size *= s
            total += size
            print(f"  Weight {i}: shape={shape} ({size:,} values)")
    print(f"\\n  Total weight values: {total:,}")
`,

    draw_chart: `# 📊 Draw a Bar Chart in the Console

import random

labels_list = _labels if '_labels' in dir() and _labels else ["Cat", "Dog", "Bird", "Fish", "Frog"]
values = [random.random() for _ in range(len(labels_list))]

_draw_bar_chart(values, list(labels_list), "📊 Random Predictions")
print("Chart drawn! ✨")
`,

    draw_canvas: `# 🎨 Custom Canvas Drawing

import math
import random

canvas = create_canvas(300, 300)
ctx = canvas.getContext("2d")

# Background
ctx.fillStyle = "#0f0f1a"
ctx.fillRect(0, 0, 300, 300)

# Stars
ctx.fillStyle = "#ffffff"
for _ in range(50):
    x, y = random.randint(0, 300), random.randint(0, 300)
    ctx.beginPath()
    ctx.arc(x, y, random.random() * 2, 0, 2 * math.pi)
    ctx.fill()

# Rainbow circles
for i in range(20, 0, -1):
    hue = (i * 18) % 360
    ctx.beginPath()
    ctx.arc(150, 150, i * 7, 0, 2 * math.pi)
    ctx.fillStyle = f"hsla({hue}, 80%, 50%, 0.6)"
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

info = get_model_info()
total_params = info['trainable_params'] + info['non_trainable_params']

rows = ""
for i, (name, ltype) in enumerate(zip(info['layer_names'], info['layer_types'])):
    bg = "rgba(108,99,255,0.05)" if i % 2 == 0 else "transparent"
    rows += f'<tr style="background:{bg}"><td>{i}</td><td>{name}</td><td>{ltype}</td></tr>'

labels_html = ""
labels_list = _labels if '_labels' in dir() and _labels else None
if labels_list:
    labels_html = f'<p style="color:#a6adc8;font-size:11px;">Labels: <strong style="color:#89b4fa;">{", ".join(labels_list)}</strong></p>'

html = f"""
<div style="padding:8px;">
  <h3 style="color:#89b4fa;margin:0 0 8px 0;">Model Architecture</h3>
  <table style="width:100%;">
    <thead><tr><th>#</th><th>Layer Name</th><th>Type</th></tr></thead>
    <tbody>{rows}</tbody>
  </table>
  <p style="color:#a6adc8;font-size:11px;margin-top:8px;">
    Total params: <strong style="color:#00d4aa;">{total_params:,}</strong>
    (trainable: {info['trainable_params']:,})
  </p>
  {labels_html}
</div>
"""
display_html(html)
print("Table rendered! 📋")
`,

    pixel_art: `# 🕹️ Pixel Art Editor

GRID_SIZE = 16
CANVAS_SIZE = 256
PIXEL_SIZE = CANVAS_SIZE // GRID_SIZE

PALETTE = {0: "#0f0f1a", 1: "#ffd93d", 2: "#1a1a2e", 3: "#ff6b6b", 4: "#00d4aa"}

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

canvas = create_canvas(CANVAS_SIZE, CANVAS_SIZE)
ctx = canvas.getContext("2d")

for y, row in enumerate(SPRITE):
    for x, color_idx in enumerate(row):
        ctx.fillStyle = PALETTE.get(color_idx, "#000")
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)

# Grid overlay
ctx.strokeStyle = "rgba(255,255,255,0.05)"
ctx.lineWidth = 0.5
for i in range(GRID_SIZE + 1):
    ctx.beginPath(); ctx.moveTo(i * PIXEL_SIZE, 0); ctx.lineTo(i * PIXEL_SIZE, CANVAS_SIZE); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, i * PIXEL_SIZE); ctx.lineTo(CANVAS_SIZE, i * PIXEL_SIZE); ctx.stroke()

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
print("  predict(data)           — Run model prediction")
print("  get_model_info()        — Get model architecture info")
print("  get_weights()           — Get model weights")
print("  rand_nested(shape)      — Generate random nested list")
print("  create_canvas(w, h)     — Create a drawable canvas")
print("  display(canvas)         — Show canvas in console")
print("  display_html(html)      — Render HTML in console")
print("  display_image(url)      — Show image in console")
print()
print("Pre-injected helpers (call or override):")
print("  _setup_model()          — Setup + return state dict")
print("  _print_model_summary()  — Print formatted model info")
print("  _predict_and_show(data) — Predict + display result")
print("  _format_result(result)  — Format result as string")
print("  _print_all_classes(r)   — Print sorted class bars")
print("  _get_label(idx)         — Get label for class index")
print("  _sample_shape()         — Get sample input shape")
print("  _draw_bar_chart(vals)   — Draw bar chart on canvas")
print("  _smooth_predictions(buf)— Average prediction buffer")
print("  _top_prediction(result) — Get (idx, conf) of top class")
`,

    generic_io: `# 🔌 Generic Input / Output
# Works with any model shape — generates matching random input.

_print_model_summary()

shape = _sample_shape()
print(f"📐 Generating input with shape: {shape}")

my_input = rand_nested(shape)
print(f"   Sample (first 80 chars): {str(my_input)[:80]}...")
print()

result = _predict_and_show(my_input)
print()

if isinstance(result, list) and len(result) > 1:
    _print_all_classes(result)
elif isinstance(result, list):
    print(f"   (Regression — {len(result)} output values)")
    for i, v in enumerate(result[:10]):
        print(f"   [{i}] {v:.6f}")
    if len(result) > 10:
        print(f"   ... ({len(result) - 10} more)")
`,

    image_snapshot_rps: `# ✊✋✌️ Rock Paper Scissors — 2 Players!
# Camera stays LIVE. Press 📸 Snap for Player 1, then Player 2.
# Auto-detects German & English labels (Schere/Scissors, Stein/Rock, Papier/Paper).

if 'game' not in dir():
    state = _setup_model()
    rps_map = _rps_detect_mapping(state['labels'])
    game = {'rps_map': rps_map, 'turn': 1, 'round': 0,
            'player1_score': 0, 'player2_score': 0, 'player1_move': None}
    print("\\n✊✋✌️  ROCK PAPER SCISSORS")
    print("📸 Snap Player 1, then Player 2!\\n")

if input_data is not None:
    result = predict(input_data)
    set_prediction_result(result)

    # Only consider classes in the RPS mapping (ignore extra outputs)
    rps_indices = list(game['rps_map'].keys())
    rps_scores = [(i, result[i]) for i in rps_indices if i < len(result)]
    idx, conf = max(rps_scores, key=lambda x: x[1])
    move = game['rps_map'][idx]
    emoji = _RPS_EMOJI[move]

    if game['turn'] == 1:
        game['player1_move'] = (move, conf)
        game['turn'] = 2
        print(f"👤 Player 1: {emoji} {move} ({conf*100:.0f}%) — now snap Player 2!")
    else:
        player1_move, player1_conf = game['player1_move']
        player2_move, player2_conf = move, conf
        game['turn'] = 1
        game['round'] += 1

        outcome = _rps_winner(player1_move, player2_move)
        if outcome == 'player1': game['player1_score'] += 1
        elif outcome == 'player2': game['player2_score'] += 1

        tag = {'draw': '🤝 DRAW', 'player1': '👑 Player 1 wins!', 'player2': '👑 Player 2 wins!'}
        print(f"══ Round {game['round']} ══════════════════")
        print(f"  Player 1: {_RPS_EMOJI[player1_move]} {player1_move} ({player1_conf*100:.0f}%)")
        print(f"  Player 2: {_RPS_EMOJI[player2_move]} {player2_move} ({player2_conf*100:.0f}%)")
        print(f"  → {tag[outcome]}")
        print(f"  Score: {game['player1_score']} — {game['player2_score']}\\n")
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

		// BATCH ALL DOM READS FIRST
		var webcamBtn = document.getElementById("pyodide_webcam_btn");
		var webcamBtnSimple = document.getElementById("pyodide_webcam_btn_simple");
		var panel = document.getElementById('pyodide_examples_panel');
		var textarea = document.getElementById("pyodide_editor_textarea");
		var currentCode = textarea ? textarea.value : '';

		// BATCH ALL DOM WRITES
		if (webcamBtn) webcamBtn.style.display = imageModel ? "" : "none";
		if (webcamBtnSimple) webcamBtnSimple.style.display = imageModel ? "" : "none";

		if (!imageModel && webcamStream) {
			appendConsole("[📷 Webcam stopped — model input shape is not image-like]\n", "warn");
			stopWebcam();
		}

		if (panel) {
			if (imageModel) {
				panel.classList.remove('pe-no-image-model');
			} else {
				panel.classList.add('pe-no-image-model');
			}
		}

		if (!imageModel && textarea) {
			if (currentCode.includes("# 📷 Live Webcam") || currentCode.includes("frame_count")) {
				textarea.value = TEMPLATES.generic_io;
				scheduleHighlight();
				saveEditorContent();
				appendConsole("[📄 Switched to generic I/O template (model is not image-based)]\n", "info");
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

			// GUARDRAIL: Skip entirely if count hasn't changed
			if (currentCount && parseInt(currentCount, 10) === lineCount) return;

			// Build string only if count changed
			var numbers = '';
			for (var i = 1; i <= lineCount; i++) {
				numbers += i + '\n';
			}

			// GUARDRAIL: Double-check cache to avoid redundant textContent set
			if (_lineNumbersCache === numbers) return;
			_lineNumbersCache = numbers;

			// Single DOM write — no reads after this
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
			if (_templateLoading) return;
			if (_scrollPending) return;
			_scrollPending = true;

			if (_scrollRAF) return; // Already scheduled, don't double-schedule
			_scrollRAF = requestAnimationFrame(function() {
				_scrollRAF = null;
				_scrollPending = false;

				var textarea = document.getElementById('pyodide_editor_textarea');
				if (!textarea) return;

				var highlightEl = document.getElementById('pyodide_editor_highlight');
				var lineNumbersEl = document.getElementById('pyodide_editor_line_numbers');

				// BATCH READ (single read pass)
				var scrollTop = textarea.scrollTop;
				var scrollLeft = textarea.scrollLeft;

				// BATCH WRITE (no reads after this)
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
			if (document.getElementById('pe-scroll-perf-css')) return; // Don't inject twice

			var style = document.createElement('style');
			style.id = 'pe-scroll-perf-css';
			style.textContent = `
/* Prevent scroll-anchor reflow on console output */
#pyodide_console_output {
    overflow-anchor: none;
    contain: layout style;
    will-change: scroll-position;
    transform: translateZ(0);
}

#pyodide_console_output > span {
    contain: layout style;
}

#pyodide_console_output > .pe-output-cell {
    contain: layout style paint;
}

#pyodide_photos_container {
    contain: layout style paint;
    content-visibility: auto;
    contain-intrinsic-size: auto 120px;
}

#pyodide_photos_strip {
    contain: content;
    will-change: contents;
    overflow-anchor: none;
}

.pe-photo-thumb {
    contain: strict;
    contain-intrinsic-size: 64px 64px;
}

/* GPU-accelerate the editor layers */
#pyodide_editor_textarea,
#pyodide_editor_highlight,
#pyodide_editor_line_numbers {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: auto !important;
    overflow-anchor: none;
    will-change: scroll-position;
    transform: translateZ(0);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
}

/* CRITICAL for Firefox: isolate highlight from triggering parent reflows */
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

/* FIREFOX FIX: Prevent .pe-editor-body from reflowing on child scroll/content changes */
.pe-editor-body {
    contain: size layout style;
    overflow: hidden;
    position: relative;
}

/* Examples panel: reduce off-screen cost */
#pyodide_examples_panel {
    contain: layout style paint;
}

#pyodide_examples_panel:not(.pe-visible) {
    content-visibility: hidden;
    contain-intrinsic-size: 0px;
}

/* FIREFOX FIX: Prevent prediction results from causing parent reflow */
#pyodide_prediction_results {
    contain: layout style paint;
    content-visibility: auto;
    contain-intrinsic-size: auto 80px;
}

#pyodide_prediction_output {
    contain: content;
    overflow: hidden;
    max-height: 300px;
    overflow-y: auto;
}

/* FIREFOX FIX: Webcam container isolation */
#pyodide_webcam_container {
    contain: layout style paint;
    content-visibility: auto;
    contain-intrinsic-size: auto 200px;
}

/* FIREFOX FIX: Toolbar should never cause reflow of editor area */
.pe-toolbar, .pe-input-bar {
    contain: layout style;
}

/* FIREFOX FIX: Prevent pe-main-layout from reflowing when console content changes */
.pe-main-layout {
    contain: layout style;
}

.pe-console-container {
    contain: layout style;
    overflow: hidden;
}

.pe-editor-container {
    contain: layout style;
    overflow: hidden;
}
    `;
			document.head.appendChild(style);
		}

		function updateHighlight() {
			if (_templateLoading) return;

			var textarea = document.getElementById('pyodide_editor_textarea');
			var highlightEl = document.getElementById('pyodide_editor_highlight');
			if (!textarea || !highlightEl) return;

			var code = textarea.value;

			// For very large code (>5000 chars), use viewport-based highlighting
			if (code.length > 5000) {
				// CRITICAL FIX: Cache these values — don't read layout props every highlight
				// Use a cached line height instead of forcing getComputedStyle (causes reflow in Firefox)
				var lineHeight = _cachedLineHeight || 18;
				var clientHeight = _cachedClientHeight || 400;
				var scrollTop = textarea.scrollTop;

				var visibleLines = Math.ceil(clientHeight / lineHeight);
				var startLine = Math.max(0, Math.floor(scrollTop / lineHeight) - 5);
				var endLine = startLine + visibleLines + 10;

				var lines = code.split('\n');
				var before = lines.slice(0, startLine).join('\n');
				var visible = lines.slice(startLine, endLine).join('\n');
				var after = lines.slice(endLine).join('\n');

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
			if (_templateLoading) return;
			if (highlightDebounce) cancelAnimationFrame(highlightDebounce);

			var now = performance.now();
			var elapsed = now - _lastHighlightTime;

			if (elapsed < _highlightThrottleMs) {
				// Throttle: delay until minimum interval has passed
				highlightDebounce = requestAnimationFrame(function() {
					highlightDebounce = requestAnimationFrame(function() {
						_lastHighlightTime = performance.now();
						updateHighlight();
					});
				});
			} else {
				highlightDebounce = requestAnimationFrame(function() {
					_lastHighlightTime = performance.now();
					updateHighlight();
				});
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

			var isVisible = panel.classList.contains('pe-visible');

			if (isVisible) {
				panel.classList.remove('pe-visible');
				setTimeout(function() {
					if (!panel.classList.contains('pe-visible')) {
						panel.style.display = 'none';
						panel.style.contentVisibility = 'hidden';
					}
				}, 200);
			} else {
				panel.style.contentVisibility = 'visible';
				panel.style.display = 'flex';

				// CRITICAL FIX: Do NOT use `void panel.offsetHeight` to force reflow
				// Instead, use a double-rAF to ensure the display:flex has been committed
				// before adding the transition class
				requestAnimationFrame(function() {
					requestAnimationFrame(function() {
						panel.classList.add('pe-visible');
					});
				});

				if (!_examplesTranslated) {
					_examplesTranslated = true;
					if (typeof translateElement === 'function') {
						translateElement(panel);
					}
				}
			}

			update_translations(); // await not possible here
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

		// =========================================================================
		// CONSOLE OUTPUT — BATCHED (eliminates forced reflow)
		// =========================================================================

		function appendConsole(text, type) {
			_consoleBatch.push({ text: text, type: type });

			if (!_consoleFlushRAF) {
				_consoleFlushRAF = requestAnimationFrame(flushConsole);
			}
		}

		function flushConsole() {
			_consoleFlushRAF = null;

			var output = document.getElementById("pyodide_console_output");
			if (!output || _consoleBatch.length === 0) return;

			// GUARDRAIL: Limit batch size per frame to prevent long frames
			var maxPerFrame = 50;
			var processBatch = _consoleBatch.length > maxPerFrame
				? _consoleBatch.splice(0, maxPerFrame)
				: _consoleBatch.splice(0);

			// Build a document fragment (no reflows until appended)
			var frag = document.createDocumentFragment();

			for (var i = 0; i < processBatch.length; i++) {
				var item = processBatch[i];
				var span = document.createElement("span");
				span.style.display = "inline";
				span.textContent = item.text;

				switch (item.type) {
					case "stderr": span.style.color = "#ff6b6b"; break;
					case "warn":   span.style.color = "#ffd93d"; break;
					case "info":   span.style.color = "#6c7086"; break;
					case "stdout": default: span.style.color = "#39A846"; break;
				}

				frag.appendChild(span);
			}

			// Single DOM write
			output.appendChild(frag);

			// GUARDRAIL: Prune excess nodes — but don't read scrollHeight here
			var childCount = output.childNodes.length;
			if (childCount > 500) {
				var toRemove = childCount - 400; // Remove in bulk to avoid frequent pruning
				while (toRemove-- > 0) {
					output.removeChild(output.firstChild);
				}
			}

			// If there are remaining items, schedule another flush
			if (_consoleBatch.length > 0) {
				_consoleFlushRAF = requestAnimationFrame(flushConsole);
				return; // Don't scroll until all batches are done
			}

			// Defer scroll to NEXT frame — avoids forced reflow in this frame
			if (!_consoleScrollRAF) {
				_consoleScrollRAF = requestAnimationFrame(function() {
					_consoleScrollRAF = null;
					if (output) {
						output.scrollTop = output.scrollHeight;
					}
				});
			}
		}

		/**
		 * Force-flush console immediately (use sparingly — e.g., before showing an error)
		 * This DOES cause a reflow, but only when explicitly needed.
		 */
		function flushConsoleSync() {
			if (_consoleFlushRAF) {
				cancelAnimationFrame(_consoleFlushRAF);
				_consoleFlushRAF = null;
			}
			if (_consoleScrollRAF) {
				cancelAnimationFrame(_consoleScrollRAF);
				_consoleScrollRAF = null;
			}

			var output = document.getElementById("pyodide_console_output");
			if (!output || _consoleBatch.length === 0) return;

			var frag = document.createDocumentFragment();
			for (var i = 0; i < _consoleBatch.length; i++) {
				var item = _consoleBatch[i];
				var span = document.createElement("span");
				span.style.display = "inline";
				span.textContent = item.text;
				switch (item.type) {
					case "stderr": span.style.color = "#ff6b6b"; break;
					case "warn":   span.style.color = "#ffd93d"; break;
					case "info":   span.style.color = "#6c7086"; break;
					case "stdout": default: span.style.color = "#00ff88"; break;
				}
				frag.appendChild(span);
			}
			_consoleBatch = [];
			output.appendChild(frag);

			while (output.childNodes.length > 500) {
				output.removeChild(output.firstChild);
			}

			output.scrollTop = output.scrollHeight;
		}

	/**
	 * Append a rich output cell (canvas, HTML, image) to the console
	 */
		function appendRichOutput(element) {
			var output = document.getElementById("pyodide_console_output");
			if (!output) return;

			cellCounter++;
			var cell = document.createElement("div");
			cell.className = "pe-output-cell";
			cell.setAttribute("data-cell", cellCounter);

			var label = document.createElement("div");
			label.style.cssText = "font-size:10px;color:#6c7086;margin-bottom:4px;font-weight:600;";
			label.textContent = "Out [" + cellCounter + "]:";
			cell.appendChild(label);
			cell.appendChild(element);

			// Single DOM write
			output.appendChild(cell);

			// GUARDRAIL: Defer scroll to next frame (don't read scrollHeight immediately)
			if (!_consoleScrollRAF) {
				_consoleScrollRAF = requestAnimationFrame(function() {
					_consoleScrollRAF = null;
					if (output) {
						output.scrollTop = output.scrollHeight;
					}
				});
			}
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
    return createCanvas(width, height)

def display(obj):
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
    displayHtml(html_str)

def display_image(src, width=None, height=None):
    displayImage(src, width or 0, height or 0)

# ===== PRE-INJECTED HELPERS (always available, fully overridable) =====

def _get_label(idx, labels=None, is_classif=None):
    """Get human-readable label for a class index."""
    if labels is None:
        labels = _labels if '_labels' in dir() and _labels else None
    if is_classif is None:
        is_classif = _is_classification if '_is_classification' in dir() else False
    if labels and is_classif and idx < len(labels):
        return labels[idx]
    return f"Class {idx}"

def _setup_model():
    """Standard model setup — returns info dict with common fields populated."""
    info = get_model_info()
    labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    is_image = len(info['input_shape']) == 4
    return {
        'info': info,
        'labels': labels,
        'is_classif': is_classif,
        'is_image': is_image,
        'input_shape': info['input_shape'],
        'output_shape': info['output_shape'],
        'num_classes': info['output_shape'][-1] if info['output_shape'] else 0,
        'frame_count': 0,
    }

def _sample_shape(input_shape=None):
    """Get sample input shape (strips batch dim, replaces None with 1)."""
    if input_shape is None:
        input_shape = get_model_info()['input_shape']
    return [s if s is not None else 1 for s in input_shape[1:]]

def _format_result(result, labels=None, is_classif=None):
    """Format prediction result as a human-readable string."""
    if labels is None:
        labels = _labels if '_labels' in dir() and _labels else None
    if is_classif is None:
        is_classif = _is_classification if '_is_classification' in dir() else False
    if isinstance(result, list) and len(result) > 1 and is_classif:
        top_idx = result.index(max(result))
        conf = result[top_idx] * 100
        label = _get_label(top_idx, labels, is_classif)
        return f"🏆 {label} ({conf:.1f}%)"
    elif isinstance(result, list) and len(result) > 1:
        vals = ', '.join(f'{v:.4f}' for v in result[:5])
        suffix = '...' if len(result) > 5 else ''
        return f"Output: [{vals}{suffix}]"
    else:
        return f"Result: {result}"

def _print_model_summary(info=None):
    """Print a formatted model summary."""
    if info is None:
        info = get_model_info()
    labels = _labels if '_labels' in dir() and _labels else None
    is_classif = _is_classification if '_is_classification' in dir() else False
    print(f"Model Summary")
    print(f"   Input:  {info['input_shape']}")
    print(f"   Output: {info['output_shape']}")
    print(f"   Layers: {info['num_layers']}")
    print(f"   Params: {info['trainable_params']:,} trainable")
    if labels and is_classif:
        print(f"   Labels: {list(labels)}")
    print()

def _print_all_classes(result, labels=None, is_classif=None):
    """Print sorted class predictions with bar chart."""
    if labels is None:
        labels = _labels if '_labels' in dir() and _labels else None
    if is_classif is None:
        is_classif = _is_classification if '_is_classification' in dir() else False
    if not isinstance(result, list) or len(result) <= 1:
        print(f"  Result: {result}")
        return
    indexed = sorted(enumerate(result), key=lambda x: x[1], reverse=True)
    for idx, conf in indexed:
        bar = "█" * int(conf * 20)
        label = _get_label(idx, labels, is_classif)
        print(f"  {label:12s} {conf*100:5.1f}% {bar}")

def _predict_and_show(data=None, verbose=True):
    """Predict on data, set result in UI, and optionally print formatted output."""
    result = predict(data)
    set_prediction_result(result)
    if verbose:
        print(f"🎯 {_format_result(result)}")
    return result

def _draw_bar_chart(values, chart_labels=None, title="📊 Chart", width=420, height=220):
    """Draw a bar chart on a canvas and display it."""
    if chart_labels is None:
        labels_list = _labels if '_labels' in dir() and _labels else None
        chart_labels = list(labels_list) if labels_list else [f"Item {i}" for i in range(len(values))]
    
    max_val = max(values) if values else 1
    num_bars = len(values)
    canvas = create_canvas(width, height)
    ctx = canvas.getContext("2d")
    
    ctx.fillStyle = "#1e1e2e"
    ctx.fillRect(0, 0, width, height)
    
    bar_width = max(20, (width - 40 - (num_bars - 1) * 8) // num_bars)
    gap = 8
    start_x = (width - (num_bars * bar_width + (num_bars - 1) * gap)) // 2
    
    for i, (label, val) in enumerate(zip(chart_labels, values)):
        x = start_x + i * (bar_width + gap)
        bar_height = (val / max_val) * (height - 70)
        y = height - 35 - bar_height
        hue = i * (360 // max(num_bars, 1))
        
        ctx.fillStyle = f"hsl({hue}, 70%, 60%)"
        ctx.fillRect(x, y, bar_width, bar_height)
        
        if val == max_val:
            ctx.strokeStyle = "#fff"
            ctx.lineWidth = 2
            ctx.strokeRect(x, y, bar_width, bar_height)
        
        ctx.fillStyle = "#cdd6f4"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        short = label[:7] if len(label) > 7 else label
        ctx.fillText(short, x + bar_width / 2, height - 18)
        ctx.fillText(f"{val:.2f}", x + bar_width / 2, y - 8)
    
    ctx.fillStyle = "#89b4fa"
    ctx.font = "bold 14px sans-serif"
    ctx.textAlign = "left"
    ctx.fillText(title, 10, 22)
    
    display(canvas)

def _smooth_predictions(buffer):
    """Average a list of prediction arrays (sliding window smoothing)."""
    if not buffer:
        return []
    num_cls = len(buffer[0])
    smoothed = [0.0] * num_cls
    for pred in buffer:
        for i in range(num_cls):
            smoothed[i] += pred[i]
    return [s / len(buffer) for s in smoothed]

def _top_prediction(result):
    """Return (index, confidence) of the top prediction."""
    if not result:
        return 0, 0.0
    top_idx = result.index(max(result))
    return top_idx, result[top_idx]

def _get_tensor_shape(w):
    """Get shape of a nested list (weight tensor)."""
    shape = []
    temp = w
    while isinstance(temp, list):
        shape.append(len(temp))
        temp = temp[0] if len(temp) > 0 else []
    return shape

# ─── RPS HELPERS ─────────────────────────────────────────────────

_RPS_KEYWORDS = {
    'scissors': ['scissors', 'schere', 'scheere'],
    'rock':     ['rock', 'stein', 'stone', 'fels'],
    'paper':    ['paper', 'papier'],
}
_RPS_EMOJI = {'scissors': '✌️', 'rock': '✊', 'paper': '✋'}
_RPS_WINS = {'rock': 'scissors', 'paper': 'rock', 'scissors': 'paper'}

def _rps_detect_mapping(label_list):
    """Auto-detect RPS mapping from label names (DE/EN). Returns {index: move}."""
    if not label_list or len(label_list) != 3:
        if label_list and len(label_list) != 3:
            print(f"⚠️  RPS needs exactly 3 labels, got {len(label_list)}: {list(label_list)}")
        print("   → Fallback: [0]=scissors, [1]=rock, [2]=paper")
        return {0: 'scissors', 1: 'rock', 2: 'paper'}

    mapping = {}
    used = set()
    for idx, lbl in enumerate(label_list):
        low = lbl.strip().lower()
        for move, keywords in _RPS_KEYWORDS.items():
            if low in keywords and move not in used:
                mapping[idx] = move
                used.add(move)
                break

    if len(mapping) == 3:
        for idx, move in sorted(mapping.items()):
            lname = label_list[idx]
            print(f'  {_RPS_EMOJI[move]} "{lname}" -> {move}')
        return mapping

    unmatched = [label_list[i] for i in range(3) if i not in mapping]
    print(f'⚠️  Could not identify: {unmatched}')
    print("   → Fallback: [0]=scissors, [1]=rock, [2]=paper")
    return {0: 'scissors', 1: 'rock', 2: 'paper'}

def _rps_winner(move1, move2):
    """Returns 'player1', 'player2', or 'draw'."""
    if move1 == move2: return 'draw'
    return 'player1' if _RPS_WINS[move1] == move2 else 'player2'

print('🐍 Python environment ready!')
print('📦 Functions: predict(), get_model_info(), get_weights(), rand_nested(shape)')
print('🎨 Rich output: create_canvas(w,h), display(canvas), display_html(html), display_image(url)')
print('🔧 Helpers: _setup_model(), _predict_and_show(), _print_model_summary(), _format_result()')
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

			// Wait for metadata to load
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

			// Wait for first frame to actually render (reduced from 300ms)
			// Use requestVideoFrameCallback if available, otherwise short timeout
			if (video.requestVideoFrameCallback) {
				await new Promise(function(resolve) {
					video.requestVideoFrameCallback(resolve);
				});
			} else {
				await new Promise(function(resolve) { setTimeout(resolve, 100); });
			}

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
			var _frameInProgress = false;

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
				if (!isEffectivelyVisible()) return;
				if (webcamPredicting || !webcamStream || interruptExecution) return;
				if (_frameInProgress) return; // GUARDRAIL: Skip if previous frame hasn't finished

				_frameInProgress = true;
				webcamPredicting = true;
				try {
					await runWebcamFrame();
					webcamFrameCount++;
				} catch (e) {
					console.warn("Webcam frame error:", e);
				}
				webcamPredicting = false;
				_frameInProgress = false;
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

					var runBtn = document.getElementById("pyodide_run_btn");
					if (runBtn) {
						runBtn.classList.add("pe-btn-success-flash");
						setTimeout(function() { runBtn.classList.remove("pe-btn-success-flash"); }, 1200);
					}
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

		// CRITICAL FIX: Do NOT force reflow with void el.offsetHeight
		// Instead, batch all writes together and let the browser coalesce naturally
		highlightEl.innerHTML = highlightPython(code) + '\n';
		updateLineNumbers();

		// Reset scroll positions (write-only, no reads)
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

		// --- FREEZE scrolling and highlighting during template load ---
		_templateLoading = true;

		// Cancel any pending highlight/scroll work
		if (highlightDebounce) {
			cancelAnimationFrame(highlightDebounce);
			highlightDebounce = null;
		}
		if (_scrollRAF) {
			cancelAnimationFrame(_scrollRAF);
			_scrollRAF = null;
			_scrollPending = false;
		}

		var highlightEl = document.getElementById('pyodide_editor_highlight');
		var lineNumbersEl = document.getElementById('pyodide_editor_line_numbers');

		// BATCH ALL WRITES — no reads interleaved
		textarea.value = TEMPLATES[name];
		textarea.scrollTop = 0;
		textarea.scrollLeft = 0;
		if (highlightEl) { highlightEl.scrollTop = 0; highlightEl.scrollLeft = 0; }
		if (lineNumbersEl) { lineNumbersEl.scrollTop = 0; }

		saveEditorContent();

		// Defer the expensive highlight to next frame (not immediate)
		requestAnimationFrame(function() {
			updateHighlightImmediate();

			// Close examples panel (write-only)
			var panel = document.getElementById('pyodide_examples_panel');
			if (panel) {
				panel.classList.remove('pe-visible');
				panel.style.display = 'none';
			}

			// UNFREEZE after highlight is done
			clearTimeout(_templateLoadTimer);
			_templateLoadTimer = setTimeout(function() {
				_templateLoading = false;
			}, 100);
		});

		appendConsole("[📄 Loaded template: " + name + "]\n", "info");

		// Auto-start webcam / auto-run logic
		if (name === 'image_webcam') {
			if (!webcamStream) {
				appendConsole("[📷 Auto-starting webcam...]\n", "info");
				setTimeout(startWebcam, 200); // Delay to let template settle
			}
		}
		if (name === 'random_input' || name === 'weights_inspect' || name === 'hello_world') {
			setTimeout(function () { pyodideEditorRun(); }, 200);
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

		// NEW: Check for auto-fix
		var textarea = document.getElementById("pyodide_editor_textarea");
		var code = textarea ? textarea.value : '';
		var autoFix = getAutoFix(errorMsg, code);

		if (autoFix) {
			showFixButton(autoFix);
		}
	}

	function showFixButton(autoFix) {
		var output = document.getElementById("pyodide_console_output");
		if (!output) return;

		var fixDiv = document.createElement("div");
		fixDiv.style.cssText = "margin:6px 0;padding:6px 10px;background:rgba(108,99,255,0.15);border:1px solid var(--pe-accent, #6c63ff);border-radius:6px;display:inline-flex;align-items:center;gap:8px;";

		var label = document.createElement("span");
		label.style.cssText = "font-size:12px;color:var(--pe-text, #cdd6f4);";
		label.textContent = "🔧 " + autoFix.description;

		var btn = document.createElement("button");
		btn.style.cssText = "padding:4px 12px;border-radius:4px;border:none;background:var(--pe-accent, #6c63ff);color:#fff;font-size:11px;font-weight:600;cursor:pointer;";
		btn.textContent = "Fix it";
		btn.onclick = function() {
			var textarea = document.getElementById("pyodide_editor_textarea");
			if (!textarea) return;
			var fixed = autoFix.apply(textarea.value);
			textarea.value = fixed;
			scheduleHighlight();
			saveEditorContent();
			fixDiv.remove();
			appendConsole("[🔧 Fix applied! Press ▶ Run to try again.]\n", "info");
			hideErrorIndicator();
		};

		fixDiv.appendChild(label);
		fixDiv.appendChild(btn);
		output.appendChild(fixDiv);

		// Scroll to show the fix button
		requestAnimationFrame(function() {
			output.scrollTop = output.scrollHeight;
		});
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

	function handleTabKey(textarea, e) {
		e.preventDefault();
		var start = textarea.selectionStart;
		var end = textarea.selectionEnd;
		var value = textarea.value;

		if (e.shiftKey) {
			handleDedent(textarea, start, end, value);
		} else if (start !== end) {
			handleIndentSelection(textarea, start, end, value);
		} else {
			textarea.value = value.substring(0, start) + "    " + value.substring(end);
			textarea.selectionStart = textarea.selectionEnd = start + 4;
		}
		scheduleHighlight();
	}

	function handleDedent(textarea, start, end, value) {
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

		textarea.value = value.substring(0, lineStart) + dedentedLines.join("\n") + value.substring(end);
		textarea.selectionStart = Math.max(lineStart, start - firstLineRemoved);
		textarea.selectionEnd = end - removedChars;
	}

	function handleIndentSelection(textarea, start, end, value) {
		var beforeSel = value.substring(0, start);
		var ls = beforeSel.lastIndexOf("\n") + 1;
		var proc = value.substring(ls, end);
		var lns = proc.split("\n");
		var indented = lns.map(function (line) { return "    " + line; });

		textarea.value = value.substring(0, ls) + indented.join("\n") + value.substring(end);
		textarea.selectionStart = start + 4;
		textarea.selectionEnd = end + (lns.length * 4);
	}

	function handleEnterKey(textarea, e) {
		e.preventDefault();
		var s = textarea.selectionStart;
		var v = textarea.value;
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
		textarea.value = v.substring(0, s) + insertion + v.substring(textarea.selectionEnd);
		textarea.selectionStart = textarea.selectionEnd = s + insertion.length;
		scheduleHighlight();
	}

	function handleDuplicateLine(textarea, e) {
		e.preventDefault();
		var startD = textarea.selectionStart;
		var valueD = textarea.value;
		var lsD = valueD.lastIndexOf("\n", startD - 1) + 1;
		var leD = valueD.indexOf("\n", startD);
		if (leD === -1) leD = valueD.length;
		var lineD = valueD.substring(lsD, leD);
		textarea.value = valueD.substring(0, leD) + "\n" + lineD + valueD.substring(leD);
		textarea.selectionStart = textarea.selectionEnd = startD + lineD.length + 1;
		scheduleHighlight();
	}

	function handleEscapeKey(e) {
		e.preventDefault();
		if (isRunning || webcamStream) {
			pyodideEditorStop();
		} else {
			var panel = document.getElementById('pyodide_examples_panel');
			if (panel && panel.classList.contains('pe-visible')) {
				panel.classList.remove('pe-visible');
			}
		}
	}

	function handleKeypress(textarea, e) {
		var pairs = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'" };
		var char = e.key;

		if (!pairs[char]) return;

		var start = textarea.selectionStart;
		var end = textarea.selectionEnd;
		if (start === end) return;

		e.preventDefault();
		var value = textarea.value;
		var selected = value.substring(start, end);
		textarea.value = value.substring(0, start) + char + selected + pairs[char] + value.substring(end);
		textarea.selectionStart = start + 1;
		textarea.selectionEnd = end + 1;
		scheduleHighlight();
	}

	function handleEditorKeydown(e) {
		var textarea = this;

		if (e.key === "Tab") {
			handleTabKey(textarea, e);
			return;
		}

		if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
			handleEnterKey(textarea, e);
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
			appendConsole("[💾 Saved to browser storage]\n", "info");
			return;
		}

		if (e.key === "d" && (e.ctrlKey || e.metaKey)) {
			handleDuplicateLine(textarea, e);
			return;
		}

		if (e.key === "Escape") {
			handleEscapeKey(e);
			return;
		}

		if (e.key === "W" && e.ctrlKey && e.shiftKey) {
			e.preventDefault();
			if (webcamStream) { stopWebcam(); } else { startWebcam(); }
			return;
		}

		if (e.key === "F" && e.ctrlKey && e.shiftKey) {
			e.preventDefault();
			toggleFullscreen();
			return;
		}

		if (e.key === "/" && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			toggleComment(textarea);
			return;
		}
	}

	function setupEditorKeyHandlers() {
		var textarea = document.getElementById("pyodide_editor_textarea");
		if (!textarea) return;

		textarea.addEventListener("input", function () {
			if (!_templateLoading) {
				scheduleHighlight();
			}
			clearTimeout(autoSaveTimer);
			autoSaveTimer = setTimeout(saveEditorContent, 3000);
		});

		// GUARDRAIL: Use passive listener and ensure syncScroll is already throttled
		textarea.addEventListener("scroll", syncScroll, { passive: true });
		textarea.addEventListener("keydown", handleEditorKeydown);
		textarea.addEventListener("keypress", function (e) {
			handleKeypress(this, e);
		});

		// Cache layout dimensions on resize (not on every highlight)
		var resizeTimer = null;
		window.addEventListener("resize", function() {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(cacheEditorLayout, 200);
		}, { passive: true });

		applyScrollPerformanceHints();
		loadEditorContent();
		loadMode();

		// Cache layout ONCE after initial render
		requestAnimationFrame(function() {
			cacheEditorLayout();
			scheduleHighlight();
		});
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
		injectScrollPerformanceCSS();
		applyScrollPerformanceHints();
		setupEditorKeyHandlers();
		setupLivePredictions();
		setupVisibilityObservers();

		// Cache layout dimensions after first paint
		requestAnimationFrame(function() {
			requestAnimationFrame(cacheEditorLayout);
		});

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

		// Re-cache layout on resize (throttled)
		var _resizeRAF = null;
		window.addEventListener("resize", function() {
			if (_resizeRAF) return;
			_resizeRAF = requestAnimationFrame(function() {
				_resizeRAF = null;
				cacheEditorLayout();
			});
		}, { passive: true });
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
			// Start live stream immediately when panel opens (so first snap is instant)
			if (isImageModel()) {
				ensureLiveStream();
			}
			// Also validate the needed count on open
			updatePhotosStatus();
		}
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

		if (isRunning) {
			appendConsole("[⏳ Already running...]\n", "warn");
			return;
		}

		// Auto-fix old RPS template if detected
		ensureRPSTemplateUpdated();

		// Determine photo count: use ALL captured photos (not capped by "needed")
		var photoCount = capturedPhotos.length;

		// Enforce: must be even and >= 2
		if (photoCount < 2) {
			appendConsole("[⚠️ Need at least 2 photos!]\n", "warn");
			return;
		}

		// Enforce even number of photos for RPS (pairs)
		if (photoCount % 2 !== 0) {
			photoCount = photoCount - 1; // drop the last unpaired photo
			appendConsole("[⚠️ Odd number of photos — using " + photoCount + " (need pairs)]\n", "warn");
		}

		var photoDataList = capturedPhotos.slice(0, photoCount).map(function(p) { return p.pixelData; });

		// Set labels and classification flag
		var labelsList = (typeof labels !== "undefined" && Array.isArray(labels)) ? labels : [];
		var classificationFlag = (typeof is_classification !== "undefined") ? !!is_classification : false;

		try {
			pyodideInstance.globals.set("_labels", pyodideInstance.toPy(labelsList));
			pyodideInstance.globals.set("_is_classification", classificationFlag);
		} catch (e) {
			appendConsole("[Error setting labels] " + e.message + "\n", "stderr");
		}

		// Get the code from the editor
		var textarea = document.getElementById("pyodide_editor_textarea");
		var code = textarea ? textarea.value : '';

		if (!code.trim()) {
			appendConsole("[No code to run]\n", "warn");
			return;
		}

		// Detect which template is active
		var isRPSTemplate = code.includes("ROCK PAPER SCISSORS") ||
			(code.includes("game['turn']") && code.includes("rps_map")) ||
			(code.includes("game[") && code.includes("_rps_"));

		isRunning = true;
		interruptExecution = false;
		runCounter++;
		var thisRun = runCounter;

		var stopBtn = document.getElementById("pyodide_stop_btn");
		if (stopBtn) stopBtn.disabled = false;

		setStatus("⚡ Running...", "loading");
		hideErrorIndicator();

		appendConsole("\n─── Run #" + thisRun + " ───\n", "info");

		try {
			await refreshModelInPython();

			if (isRPSTemplate) {
				// === RPS MODE: Feed photos one-by-one as input_data ===
				var numRounds = photoCount / 2;
				appendConsole("[📸 " + photoCount + " photos — playing " + numRounds + " round" + (numRounds > 1 ? "s" : "") + " of RPS...]\n", "info");

				// Reset game state for a fresh multi-round session
				await pyodideInstance.runPythonAsync("if 'game' in dir(): del game");

				for (var i = 0; i < photoCount; i++) {
					if (interruptExecution) break;

					try {
						pyodideInstance.globals.set("input_data", pyodideInstance.toPy(photoDataList[i]));
					} catch (e) {
						appendConsole("[Error setting input_data for photo " + i + "] " + e.message + "\n", "stderr");
						break;
					}

					// Run the code directly (NOT via pyodideEditorRun which has its own isRunning guard)
					await pyodideInstance.runPythonAsync(code);
				}

				// Print final summary if multiple rounds were played
				if (numRounds > 1 && !interruptExecution) {
					try {
						await pyodideInstance.runPythonAsync(
							"if 'game' in dir() and game.get('round', 0) > 1:\n" +
							"    print(f\"\\n{'═' * 36}\")\n" +
							"    print(f\"🏁 FINAL SCORE after {game['round']} rounds:\")\n" +
							"    print(f\"   Player 1: {game['player1_score']}\")\n" +
							"    print(f\"   Player 2: {game['player2_score']}\")\n" +
							"    if game['player1_score'] > game['player2_score']:\n" +
							"        print(f\"   👑 Player 1 WINS the series!\")\n" +
							"    elif game['player2_score'] > game['player1_score']:\n" +
							"        print(f\"   👑 Player 2 WINS the series!\")\n" +
							"    else:\n" +
							"        print(f\"   🤝 Series tied!\")\n" +
							"    print(f\"{'═' * 36}\\n\")\n"
						);
					} catch (e) {
						// Non-critical — summary is optional
					}
				}
			} else {
				// === GROUP BATTLE or other template: Set photos list ===
				try {
					pyodideInstance.globals.set("photos", pyodideInstance.toPy(photoDataList));
					pyodideInstance.globals.set("num_photos", photoCount);
				} catch (e) {
					appendConsole("[Error setting photos] " + e.message + "\n", "stderr");
					return;
				}

				appendConsole("[📸 " + photoCount + " photos loaded into `photos` list]\n", "info");
				await pyodideInstance.runPythonAsync(code);
			}

			if (thisRun === runCounter) {
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

	function updatePhotosStatus() {
		var statusEl = document.getElementById("pyodide_photos_status");
		if (!statusEl) return;
		var neededInput = document.getElementById("pyodide_photos_needed");
		var raw = parseInt(neededInput ? neededInput.value : 2) || 2;

		// Enforce: must be even and >= 2
		if (raw < 2) raw = 2;
		if (raw % 2 !== 0) raw = raw + 1; // round up to next even

		// Write back the corrected value
		if (neededInput && parseInt(neededInput.value) !== raw) {
			neededInput.value = raw;
		}

		var needed = raw;
		var count = capturedPhotos.length;
		var rounds = Math.floor(count / 2); // rounds based on ACTUAL captured photos
		var color = count >= needed ? "#00d4aa" : "#ffd93d";
		var roundsText = rounds >= 1 ? " (" + rounds + " round" + (rounds > 1 ? "s" : "") + ")" : "";
		statusEl.innerHTML = '<span style="color:' + color + ';">' + count + ' / ' + needed + ' photos captured' + roundsText + '</span>';
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

		// GUARDRAIL 1: Cache all DOM references upfront (single lookup pass)
		const video = document.getElementById("pyodide_webcam_video");
		const container = document.getElementById("pyodide_webcam_container");
		const neededInput = document.getElementById("pyodide_photos_needed");

		// GUARDRAIL 2: Batch all DOM reads BEFORE any writes
		const streamAlreadyLive = snapshotStream && video && 
			video.srcObject === snapshotStream && 
			!video.paused && 
			video.readyState >= 2;

		// GUARDRAIL 3: Isolate the "ensure stream" side-effect
		if (!streamAlreadyLive) {
			const streamReady = await ensureLiveStreamSafe(video, container);
			if (!streamReady) return;
		}

		if (!video || video.readyState < 2) {
			appendConsole("[⚠️ Video not ready yet, try again]\n", "warn");
			return;
		}

		const info = getModelInfoForPython();
		if (!info || !info.input_shape) {
			appendConsole("[Error] No model loaded.\n", "stderr");
			return;
		}

		const inputShape = info.input_shape;
		const targetH = inputShape[1] || 40;
		const targetW = inputShape[2] || 40;
		const channels = inputShape[3] || 3;

		// GUARDRAIL 4: Use OffscreenCanvas or willReadFrequently hint to avoid GPU stalls
		const modelCanvas = document.createElement("canvas");
		modelCanvas.width = targetW;
		modelCanvas.height = targetH;
		const modelCtx = modelCanvas.getContext("2d", { willReadFrequently: true });
		modelCtx.drawImage(video, 0, 0, targetW, targetH);

		const imageData = modelCtx.getImageData(0, 0, targetW, targetH);
		const inputList = pixelsToNestedList(imageData.data, targetH, targetW, channels);

		// GUARDRAIL 5: Generate thumbnail asynchronously using createImageBitmap + blob
		const thumbnailDataURL = await generateThumbnailAsync(video);

		const photoIndex = capturedPhotos.length;
		capturedPhotos.push({
			pixelData: inputList,
			thumbnailDataURL: thumbnailDataURL,
			index: photoIndex
		});

		// Auto-increase "needed" if user keeps snapping beyond the current needed count
		var raw = parseInt(neededInput ? neededInput.value : 2) || 2;
		if (raw < 2) raw = 2;
		if (raw % 2 !== 0) raw = raw + 1;

		if (capturedPhotos.length > raw) {
			// Round up to next even number that accommodates all captured photos
			var newNeeded = capturedPhotos.length;
			if (newNeeded % 2 !== 0) newNeeded = newNeeded + 1;
			if (neededInput) neededInput.value = newNeeded;
			raw = newNeeded;
		}

		var needed = raw;

		// GUARDRAIL 6: Batch ALL DOM writes into a single rAF
		requestAnimationFrame(function() {
			updatePhotosStrip();
			updatePhotosStatus();
		});

		// GUARDRAIL 7: Single console message (don't call appendConsole multiple times)
		var msg = capturedPhotos.length >= needed
			? "[📸 Photo " + capturedPhotos.length + "/" + needed + " ✅ All captured! Press ▶ Run]\n"
			: "[📸 Photo " + capturedPhotos.length + "/" + needed + " captured]\n";
		appendConsole(msg, "info");
	}

	async function ensureLiveStreamSafe(video, container) {
		if (!video || !container) return false;

		// READ phase: gather all state first
		const currentSrc = video.srcObject;
		const isPaused = video.paused;
		const readyState = video.readyState;
		const isAlreadyLive = snapshotStream && currentSrc === snapshotStream && !isPaused && readyState >= 2;

		if (isAlreadyLive) return true;

		// WRITE phase: stop old stream (no reads after this)
		if (currentSrc && currentSrc !== snapshotStream) {
			try {
				currentSrc.getTracks().forEach(function(t) { t.stop(); });
			} catch(e) {}
			video.srcObject = null;
		}

		// Async work (no DOM interaction during getUserMedia)
		try {
			snapshotStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "environment", width: { ideal: 320 }, height: { ideal: 320 } },
				audio: false
			});
		} catch (e) {
			appendConsole("[📸 Camera error: " + e.message + "]\n", "stderr");
			return false;
		}

		// WRITE phase: batch all DOM mutations together
		video.srcObject = snapshotStream;
		video.setAttribute("playsinline", "");
		video.muted = true;
		container.style.display = "block";

		// Wait for metadata (no DOM reads during wait)
		await new Promise(function(resolve) {
			if (video.readyState >= 2) {
				resolve();
			} else {
				video.onloadedmetadata = function() {
					resolve();
				};
			}
		});

		await video.play().catch(function() {});

		// GUARDRAIL: Use requestVideoFrameCallback instead of setTimeout
		if (video.requestVideoFrameCallback) {
			await new Promise(function(resolve) {
				video.requestVideoFrameCallback(resolve);
			});
		} else {
			await new Promise(function(resolve) { setTimeout(resolve, 50); });
		}

		appendConsole("[📷 Live camera feed active]\n", "info");
		return true;
	}

	async function generateThumbnailAsync(video) {
		// GUARDRAIL 5: Use OffscreenCanvas if available (no main-thread blocking)
		if (typeof OffscreenCanvas !== 'undefined') {
			const offscreen = new OffscreenCanvas(64, 64);
			const ctx = offscreen.getContext("2d");
			ctx.drawImage(video, 0, 0, 64, 64);
			const blob = await offscreen.convertToBlob({ type: "image/jpeg", quality: 0.5 });
			return URL.createObjectURL(blob);
		}

		// Fallback: regular canvas but yield to browser between draw and encode
		const thumbCanvas = document.createElement("canvas");
		thumbCanvas.width = 64;
		thumbCanvas.height = 64;
		const thumbCtx = thumbCanvas.getContext("2d");
		thumbCtx.drawImage(video, 0, 0, 64, 64);

		// Yield to browser before expensive toDataURL
		await new Promise(function(resolve) { setTimeout(resolve, 0); });

		return thumbCanvas.toDataURL("image/jpeg", 0.5);
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
		const strip = document.getElementById("pyodide_photos_strip");
		if (!strip) return;

		if (capturedPhotos.length === 0) {
			strip.innerHTML = '<span style="color:var(--pe-muted);font-size:11px;font-style:italic;">No photos yet — press 📸 Snap to capture</span>';
			return;
		}

		// GUARDRAIL: Only append the NEW photo instead of rebuilding everything
		const existingThumbs = strip.querySelectorAll('.pe-photo-thumb');

		if (existingThumbs.length < capturedPhotos.length) {
			// Only add the missing ones
			const frag = document.createDocumentFragment();
			for (let i = existingThumbs.length; i < capturedPhotos.length; i++) {
				const div = document.createElement('div');
				div.className = 'pe-photo-thumb';
				div.title = 'photos[' + i + ']';
				div.innerHTML = 
					'<img src="' + capturedPhotos[i].thumbnailDataURL + '" alt="Photo ' + i + '">' +
					'<div class="pe-photo-label">photos[' + i + ']</div>' +
					'<div class="pe-photo-remove" onclick="event.stopPropagation();pyodidePhotosRemove(' + i + ')">×</div>';
				frag.appendChild(div);
			}
			// Clear placeholder if it exists
			const placeholder = strip.querySelector('span');
			if (placeholder) placeholder.remove();

			strip.appendChild(frag); // Single DOM write
		} else if (existingThumbs.length > capturedPhotos.length) {
			// Photos were removed — rebuild (rare case)
			rebuildPhotosStripFull(strip);
		}
	}

	function rebuildPhotosStripFull(strip) {
		const frag = document.createDocumentFragment();
		for (let i = 0; i < capturedPhotos.length; i++) {
			const div = document.createElement('div');
			div.className = 'pe-photo-thumb';
			div.title = 'photos[' + i + ']';
			div.innerHTML = 
				'<img src="' + capturedPhotos[i].thumbnailDataURL + '" alt="Photo ' + i + '">' +
				'<div class="pe-photo-label">photos[' + i + ']</div>' +
				'<div class="pe-photo-remove" onclick="event.stopPropagation();pyodidePhotosRemove(' + i + ')">×</div>';
			frag.appendChild(div);
		}
		strip.innerHTML = '';
		strip.appendChild(frag);
	}





	function ensureRPSTemplateUpdated() {
		var textarea = document.getElementById("pyodide_editor_textarea");
		if (!textarea) return false;

		var code = textarea.value;

		// Detect OLD broken RPS template (uses _top_prediction which causes KeyError)
		var hasOldRPS = code.includes("idx, conf = _top_prediction(result)") &&
			code.includes("game['rps_map'][idx]");

		if (hasOldRPS) {
			// Replace with the fixed template
			textarea.value = TEMPLATES.image_snapshot_rps;
			scheduleHighlight();
			saveEditorContent();
			appendConsole("[🔧 Auto-updated RPS template to fix KeyError]\n", "info");
			return true;
		}

		return false;
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

	function cacheEditorLayout() {
		var textarea = document.getElementById('pyodide_editor_textarea');
		if (!textarea) return;

		// Read layout properties ONCE, outside of any write cycle
		_cachedClientHeight = textarea.clientHeight;
		var computed = getComputedStyle(textarea);
		_cachedLineHeight = parseInt(computed.lineHeight) || 18;
	}

	function scheduleCacheEditorLayout() {
		if (_layoutCacheTimer) return;
		_layoutCacheTimer = setTimeout(function() {
			_layoutCacheTimer = null;
			requestAnimationFrame(cacheEditorLayout);
		}, 500);
	}


	function showPredictionResult(result) {
		var container = document.getElementById("pyodide_prediction_results");
		var output = document.getElementById("pyodide_prediction_output");
		if (!container || !output) return;

		// Compute the text synchronously (no DOM interaction)
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

		// GUARDRAIL: Skip DOM write if text hasn't changed
		if (_pendingPredictionText === displayText) return;
		_pendingPredictionText = displayText;

		// GUARDRAIL: Coalesce rapid updates into a single rAF write
		if (_predictionUpdateRAF) return; // Already scheduled
		_predictionUpdateRAF = requestAnimationFrame(function() {
			_predictionUpdateRAF = null;
			if (container) container.style.display = "block";
			if (output) output.textContent = _pendingPredictionText;
		});
	}

// Add after the getErrorHints function

	function getAutoFix(errorMsg, code) {
		// Missing colon after def/if/for/while/class/elif/else/try/except/finally/with
		var colonMatch = errorMsg.match(/SyntaxError.*expected ':'/i) ||
			(errorMsg.includes("SyntaxError") && errorMsg.includes("expected ':'"));
		if (colonMatch || (errorMsg.includes("SyntaxError") && code)) {
			// Find the line with the error
			var lineMatch = errorMsg.match(/line (\d+)/);
			if (lineMatch) {
				var lineNum = parseInt(lineMatch[1]);
				var lines = code.split('\n');
				if (lineNum > 0 && lineNum <= lines.length) {
					var line = lines[lineNum - 1];
					// Check if it's a statement that needs a colon
					if (/^\s*(def|if|elif|else|for|while|class|try|except|finally|with)\b/.test(line) && !line.trimEnd().endsWith(':')) {
						return {
							description: 'Add missing ":" at end of line ' + lineNum,
							apply: function(currentCode) {
								var codeLines = currentCode.split('\n');
								codeLines[lineNum - 1] = codeLines[lineNum - 1].trimEnd() + ':';
								return codeLines.join('\n');
							}
						};
					}
				}
			}
		}

		// IndentationError — detect and fix the specific misindented line
		if (errorMsg.includes("IndentationError")) {
			// CRITICAL: Extract line number from the USER'S code ("<exec>"), 
			// NOT from Pyodide internals (_base.py, _pyodide, etc.)
			var execLineMatch = errorMsg.match(/File\s+"<exec>",\s+line\s+(\d+)/);

			if (execLineMatch) {
				var ln = parseInt(execLineMatch[1]);
				return {
					description: 'Fix indentation on line ' + ln + ' (align with surrounding lines)',
					apply: function(currentCode) {
						var lines = currentCode.split('\n');
						if (ln < 1 || ln > lines.length) {
							return currentCode.replace(/\t/g, '    ');
						}

						var targetLine = lines[ln - 1];
						var targetContent = targetLine.trimStart();

						// If the line is empty/whitespace-only, skip
						if (targetContent.length === 0) return currentCode;

						// Look at the previous non-empty line to determine expected indent
						var expectedIndent = 0;
						for (var i = ln - 2; i >= 0; i--) {
							var prevLine = lines[i];
							if (prevLine.trim().length === 0) continue;

							var prevIndent = prevLine.match(/^(\s*)/)[1].length;
							var prevTrimmed = prevLine.trimEnd();

							if (prevTrimmed.endsWith(':')) {
								expectedIndent = prevIndent + 4;
							} else {
								expectedIndent = prevIndent;
							}
							break;
						}

						// Also check the NEXT non-empty line for additional context
						for (var j = ln; j < lines.length; j++) {
							if (lines[j] && lines[j].trim().length > 0) {
								var nextIndent = lines[j].match(/^(\s*)/)[1].length;
								// If prev and next agree, strong signal
								// If they disagree, trust prev (since error is "unexpected indent",
								// meaning this line has MORE indent than expected)
								if (nextIndent === expectedIndent) {
									// Both neighbors agree — use this
								}
								break;
							}
						}

						// Apply fix: replace the offending line's indentation
						lines[ln - 1] = ' '.repeat(expectedIndent) + targetContent;

						return lines.join('\n');
					}
				};
			}

			// Fallback if no <exec> line found: tabs to spaces
			return {
				description: 'Fix indentation (convert tabs to 4 spaces)',
				apply: function(currentCode) {
					return currentCode.replace(/\t/g, '    ');
				}
			};
		}

		// Unclosed string
		if (errorMsg.includes("EOL while scanning string literal") || errorMsg.includes("unterminated string")) {
			var lineMatch2 = errorMsg.match(/line (\d+)/);
			if (lineMatch2) {
				var ln = parseInt(lineMatch2[1]);
				var lines2 = code.split('\n');
				if (ln > 0 && ln <= lines2.length) {
					var errLine = lines2[ln - 1];
					// Count quotes
					var singleCount = (errLine.match(/'/g) || []).length;
					var doubleCount = (errLine.match(/"/g) || []).length;
					if (singleCount % 2 !== 0) {
						return {
							description: "Add missing ' at end of line " + ln,
							apply: function(currentCode) {
								var cl = currentCode.split('\n');
								cl[ln - 1] = cl[ln - 1] + "'";
								return cl.join('\n');
							}
						};
					}
					if (doubleCount % 2 !== 0) {
						return {
							description: 'Add missing " at end of line ' + ln,
							apply: function(currentCode) {
								var cl = currentCode.split('\n');
								cl[ln - 1] = cl[ln - 1] + '"';
								return cl.join('\n');
							}
						};
					}
				}
			}
		}

		// NameError for common typos: "pritn" -> "print", "ture" -> "True", etc.
		if (errorMsg.includes("NameError")) {
			var nameMatch = errorMsg.match(/name '([^']+)' is not defined/);
			if (nameMatch) {
				var badName = nameMatch[1];
				var corrections = {
					'pritn': 'print', 'pirnt': 'print', 'prnt': 'print',
					'ture': 'True', 'treu': 'True', 'flase': 'False', 'fasle': 'False',
					'noen': 'None', 'none': 'None',
					'retrun': 'return', 'reutrn': 'return',
					'lenght': 'length', 'legth': 'len',
				};
				var fix = corrections[badName.toLowerCase()];
				if (fix) {
					return {
						description: 'Replace "' + badName + '" with "' + fix + '"',
						apply: function(currentCode) {
							return currentCode.replace(new RegExp('\\b' + badName + '\\b', 'g'), fix);
						}
					};
				}
			}
		}

		return null; // No auto-fix available
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
