(function (global) {
    "use strict";

var API_NAME = "NeuralSpaceWarps";
var INSTANCE_KEY = "__NEURAL_SPACE_WARPS_INSTANCE__";

if (global[INSTANCE_KEY]) {
    global.NeuralSpaceWarps = global[INSTANCE_KEY].api;
    return;
}

var instance = null;

/*
 * Keine console.*-Aufrufe.
 *
 * Erwartete globale Logger:
 *   err(...)
 *   l(...)
 *   info(...)
 *   dbg(...)
 *
 * Wenn sie nicht vorhanden sind, bleibt der Visualizer still.
 */

function callLogger(name, args) {
    var logger = global[name];

    if (typeof logger !== "function") {
        return;
    }

    try {
        logger.apply(global, args);
    } catch (_) {}
}

function logError() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("[NeuralSpaceWarps]");
    callLogger("err", args);
}

function logInfo() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("[NeuralSpaceWarps]");
    callLogger("info", args);
}

function logDebug() {
    if (!instance || !instance.options.debug) {
        return;
    }

    var args = Array.prototype.slice.call(arguments);
    args.unshift("[NeuralSpaceWarps]");
    callLogger("dbg", args);
}

function logNormal() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("[NeuralSpaceWarps]");
    callLogger("l", args);
}

function fail(message) {
    logError(message);
    throw new Error(message);
}

function hasTF() {
    return !!(
        global.tf &&
        typeof global.tf.tensor === "function" &&
        typeof global.tf.model === "function"
    );
}

function hasPlotly() {
    return !!(
        global.Plotly &&
        typeof global.Plotly.react === "function"
    );
}

function isNumber(value) {
    return typeof value === "number" && isFinite(value);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function arrayEquals(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
        return false;
    }

    if (a.length !== b.length) {
        return false;
    }

    for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}

function shapeText(shape) {
    if (!Array.isArray(shape)) {
        return "?";
    }

    return "[" + shape.map(function (x) {
        return x === null ? "batch" : String(x);
    }).join(", ") + "]";
}

function resolveTarget(target) {
    if (!target) {
        return null;
    }

    if (typeof target === "string") {
        return document.querySelector(target);
    }

    if (target.nodeType === 1) {
        return target;
    }

    return null;
}

function getCurrentModel(options) {
    if (options && options.model) {
        return options.model;
    }

    return global.model || null;
}

function getLayerClass(layer) {
    try {
        if (layer && typeof layer.getClassName === "function") {
            return String(layer.getClassName());
        }
    } catch (_) {}

    return layer && layer.constructor
        ? String(layer.constructor.name || "Layer")
        : "Layer";
}

function getTensorShape(tensorLike) {
    if (!tensorLike) {
        return null;
    }

    if (Array.isArray(tensorLike.shape)) {
        return tensorLike.shape.slice();
    }

    return null;
}

function getLayerInputShape(layer) {
    try {
        if (layer.input && Array.isArray(layer.input.shape)) {
            return layer.input.shape.slice();
        }

        if (
            Array.isArray(layer.inputShape) &&
            layer.inputShape.length
        ) {
            return layer.inputShape.slice();
        }
    } catch (_) {}

    return null;
}

function getLayerOutputShape(layer) {
    try {
        if (layer.output && Array.isArray(layer.output.shape)) {
            return layer.output.shape.slice();
        }

        if (Array.isArray(layer.outputShape)) {
            return layer.outputShape.slice();
        }
    } catch (_) {}

    return null;
}

function getFeatureDimension(shape) {
    if (!Array.isArray(shape)) {
        return null;
    }

    /*
     * Unterstützt ausschließlich:
     *
     *   [batch, features]
     *
     * Also echte kleine Vektorräume:
     *
     *   R¹ -> R²
     *   R² -> R³
     *   R³ -> R²
     *
     * Bild-/Sequenz-/Conv-Räume werden absichtlich nicht
     * stillschweigend flatteniert.
     */
    if (shape.length !== 2) {
        return null;
    }

    var featureDimension = shape[1];

    if (
        typeof featureDimension !== "number" ||
        !Number.isInteger(featureDimension) ||
        featureDimension < 1
    ) {
        return null;
    }

    return featureDimension;
}

function isCompatibleSpaceDimension(dimension) {
    return (
        typeof dimension === "number" &&
        Number.isInteger(dimension) &&
        dimension >= 1 &&
        dimension <= 3
    );
}

function getVisibleLayers(model) {
    if (!model || !Array.isArray(model.layers)) {
        return [];
    }

    return model.layers.filter(function (layer) {
        var name = String(layer.name || "");
        var cls = getLayerClass(layer).toLowerCase();

        if (cls === "inputlayer") {
            return false;
        }

        if (name.indexOf("skip_proj_") >= 0) {
            return false;
        }

        if (name.indexOf("skip_add_") >= 0) {
            return false;
        }

        if (name.indexOf("skip_scale_") >= 0) {
            return false;
        }

        return true;
    });
}

function inspectModel(model, options) {
    var result = {
        ok: false,
        reason: "",
        model: model,
        layers: [],
        signature: ""
    };

    if (!hasTF()) {
        result.reason = "TensorFlow.js fehlt.";
        return result;
    }

    if (!hasPlotly()) {
        result.reason = "Plotly fehlt.";
        return result;
    }

    if (!model) {
        result.reason = "window.model ist nicht vorhanden.";
        return result;
    }

    if (!Array.isArray(model.layers)) {
        result.reason = "model.layers ist keine gültige Liste.";
        return result;
    }

    var visibleLayers = getVisibleLayers(model);

    if (!visibleLayers.length) {
        result.reason = "Das Modell besitzt keine sichtbaren Layer.";
        return result;
    }

    var signatureParts = [];

    for (var i = 0; i < visibleLayers.length; i++) {
        var layer = visibleLayers[i];
        var inputShape = getLayerInputShape(layer);
        var outputShape = getLayerOutputShape(layer);
        var inputDimension = getFeatureDimension(inputShape);
        var outputDimension = getFeatureDimension(outputShape);

        signatureParts.push(
            i + ":" +
            getLayerClass(layer) + ":" +
            shapeText(inputShape) + "->" +
            shapeText(outputShape)
        );

        logDebug(
            "Layerprüfung",
            i,
            layer.name,
            "input:",
            inputShape,
            "output:",
            outputShape,
            "inputDimension:",
            inputDimension,
            "outputDimension:",
            outputDimension
        );

        if (!inputShape) {
            result.reason =
                "Layer " + i + " besitzt keine lesbare Input-Shape.";
            return result;
        }

        if (!outputShape) {
            result.reason =
                "Layer " + i + " besitzt keine lesbare Output-Shape.";
            return result;
        }

        if (inputShape.length !== 2) {
            result.reason =
                "Layer " + i + " ist nicht plotbar: " +
                "Input-Rang " + inputShape.length +
                " statt 2. Erwartet wird [batch, features].";
            return result;
        }

        if (outputShape.length !== 2) {
            result.reason =
                "Layer " + i + " ist nicht plotbar: " +
                "Output-Rang " + outputShape.length +
                " statt 2.";
            return result;
        }

        if (!isCompatibleSpaceDimension(inputDimension)) {
            result.reason =
                "Layer " + i + " ist nicht plotbar: Input-Raum " +
                "ist " + inputDimension +
                "D. Erlaubt sind nur 1D, 2D oder 3D.";
            return result;
        }

        if (!isCompatibleSpaceDimension(outputDimension)) {
            result.reason =
                "Layer " + i + " ist nicht plotbar: Output-Raum " +
                "ist " + outputDimension +
                "D. Erlaubt sind nur 1D, 2D oder 3D.";
            return result;
        }

        /*
         * Ein Layer muss eine echte symbolische Einzel-Eingabe besitzen.
         * Bei Concatenate/Add mit mehreren Inputs wäre die Darstellung
         * eines einzelnen A -> B-Raums mehrdeutig.
         */
        if (Array.isArray(layer.input)) {
            result.reason =
                "Layer " + i +
                " besitzt mehrere Inputs und wird nicht automatisch geplottet.";
            return result;
        }

        result.layers.push({
            index: i,
            layer: layer,
            name: layer.name || ("layer_" + i),
            className: getLayerClass(layer),
            inputShape: inputShape,
            outputShape: outputShape,
            inputDimension: inputDimension,
            outputDimension: outputDimension
        });
    }

    if (!result.layers.length) {
        result.reason = "Keine geeigneten Layer gefunden.";
        return result;
    }

    result.signature = signatureParts.join("|");
    result.ok = true;

    return result;
}

/*
 * Prüft nur Shapes und Modelstruktur.
 * Es wird hier noch keine Prediction und kein Datenzugriff ausgeführt.
 */
function checkCanRender(model, options) {
    var inspection = inspectModel(model, options);

    if (!inspection.ok) {
        logDebug(
            "Visualizer bleibt verborgen.",
            inspection.reason
        );
    } else {
        logDebug(
            "Visualizer ist kompatibel.",
            inspection.layers.length,
            "Layer können dargestellt werden."
        );
    }

    return inspection;
}

function createRoot() {
    var root = document.createElement("section");

    root.className = "nsw-root";

    root.innerHTML = `
        <div class="nsw-header">
            <div>
                <div class="nsw-title">
                    Neural Space Warps
                </div>
                <div class="nsw-subtitle">
                    Layer als Funktionen f : A → B · vollständige kleine Räume
                </div>
            </div>

            <div class="nsw-status">
                –
            </div>
        </div>

        <div class="nsw-toolbar">
            <label>
                Layer
                <select class="nsw-layer"></select>
            </label>

            <label>
                Raumgröße
                <input
                    class="nsw-range"
                    type="range"
                    min="0.25"
                    max="3"
                    step="0.05"
                    value="1">
                <span class="nsw-range-value">1.00</span>
            </label>

            <label>
                Gitter
                <select class="nsw-resolution">
                    <option value="9">9 × 9</option>
                    <option value="13" selected>13 × 13</option>
                    <option value="17">17 × 17</option>
                    <option value="23">23 × 23</option>
                </select>
            </label>

            <button class="nsw-play">
                ▶ Abspielen
            </button>

            <button class="nsw-refresh">
                ↻ Jetzt prüfen
            </button>
        </div>

        <div class="nsw-plot"></div>

        <div class="nsw-meta">
            <div class="nsw-meta-title">
                –
            </div>
            <div class="nsw-meta-body">
                –
            </div>
        </div>
    `;

    return root;
}

function injectStyles() {
    if (document.getElementById("nsw-style")) {
        return;
    }

    var style = document.createElement("style");
    style.id = "nsw-style";

    style.textContent = `
        .nsw-root {
            width: min(1180px, calc(100vw - 32px));
            margin: 24px auto;
            color: #e8eefc;
            background:
                linear-gradient(
                    180deg,
                    rgba(17, 28, 49, .98),
                    rgba(7, 13, 25, .98)
                );
            border: 1px solid rgba(137, 167, 218, .28);
            border-radius: 18px;
            overflow: hidden;
            box-shadow:
                0 24px 80px rgba(0, 0, 0, .36),
                inset 0 1px 0 rgba(255,255,255,.05);
            font-family:
                Inter, ui-sans-serif, system-ui,
                -apple-system, BlinkMacSystemFont,
                "Segoe UI", sans-serif;
        }

        .nsw-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 17px 19px 14px;
            border-bottom: 1px solid rgba(137, 167, 218, .18);
        }

        .nsw-title {
            font-weight: 850;
            font-size: 19px;
            letter-spacing: -.45px;
            background:
                linear-gradient(
                    90deg,
                    #7cf9d0,
                    #9fb5ff,
                    #ff9ec7
                );
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }

        .nsw-subtitle {
            color: #91a5ca;
            font-size: 11px;
            margin-top: 4px;
        }

        .nsw-status {
            color: #91a5ca;
            font-size: 11px;
            text-align: right;
            max-width: 360px;
        }

        .nsw-toolbar {
            display: flex;
            flex-wrap: wrap;
            align-items: end;
            gap: 10px 14px;
            padding: 12px 17px;
            background: rgba(4, 10, 22, .72);
            border-bottom: 1px solid rgba(137, 167, 218, .16);
        }

        .nsw-toolbar label {
            display: flex;
            flex-direction: column;
            gap: 5px;
            color: #9eb0d0;
            font-size: 11px;
            min-width: 120px;
        }

        .nsw-toolbar select,
        .nsw-toolbar button {
            color: #e8eefc;
            background: #101c34;
            border: 1px solid #34486e;
            border-radius: 7px;
            padding: 7px 9px;
            font: inherit;
            cursor: pointer;
        }

        .nsw-toolbar select:hover,
        .nsw-toolbar button:hover {
            border-color: #7cf9d0;
        }

        .nsw-toolbar input[type=range] {
            accent-color: #7cf9d0;
            width: 130px;
        }

        .nsw-range-value {
            color: #e8eefc;
            font-variant-numeric: tabular-nums;
        }

        .nsw-plot {
            width: 100%;
            height: 690px;
            background:
                radial-gradient(
                    ellipse at 30% 0%,
                    #172744 0%,
                    #08101f 60%
                );
        }

        .nsw-meta {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 15px;
            padding: 14px 17px 17px;
            background: rgba(4, 10, 22, .72);
            border-top: 1px solid rgba(137, 167, 218, .16);
        }

        .nsw-meta-title {
            color: #7cf9d0;
            font-weight: 800;
            font-size: 12px;
        }

        .nsw-meta-body {
            color: #a9bad7;
            font-size: 12px;
            line-height: 1.55;
        }

        @media(max-width:760px) {
            .nsw-meta {
                grid-template-columns: 1fr;
            }

            .nsw-plot {
                height: 560px;
            }
        }
    `;

    document.head.appendChild(style);
}

/*
 * Baut einen unabhängigen Sub-Model-Ausdruck:
 *
 *     layerModel : layer.input -> layer.output
 *
 * Dadurch wird ausschließlich der betreffende Layer untersucht.
 * Es werden keine Trainingsdaten und keine gespeicherten Activations
 * benötigt.
 */
function makeLayerFunction(layer) {
    try {
        if (!layer.input || !layer.output) {
            logDebug(
                "Layerfunktion nicht erzeugbar:",
                layer.name,
                "input oder output fehlt."
            );
            return null;
        }

        var layerModel = global.tf.model({
            inputs: layer.input,
            outputs: layer.output
        });

        logDebug(
            "Layerfunktion erzeugt:",
            layer.name,
            shapeText(getLayerInputShape(layer)),
            "->",
            shapeText(getLayerOutputShape(layer))
        );

        return layerModel;
    } catch (e) {
        logDebug(
            "Layerfunktion konnte nicht erzeugt werden:",
            layer.name,
            e.message || e
        );

        return null;
    }
}

function createAxisValues(dimension, range, resolution) {
    var values = [];

    if (dimension === 1) {
        for (var i = 0; i < resolution; i++) {
            values.push(
                -range + (2 * range * i) / (resolution - 1)
            );
        }

        return values;
    }

    for (var j = 0; j < resolution; j++) {
        values.push(
            -range + (2 * range * j) / (resolution - 1)
        );
    }

    return values;
}

function createDomainPoints(dimension, range, resolution) {
    var axis = createAxisValues(
        dimension,
        range,
        resolution
    );

    var points = [];

    if (dimension === 1) {
        for (var i = 0; i < axis.length; i++) {
            points.push([axis[i]]);
        }

        return {
            points: points,
            axis: axis,
            resolution: resolution
        };
    }

    if (dimension === 2) {
        for (var y = 0; y < resolution; y++) {
            for (var x = 0; x < resolution; x++) {
                points.push([
                    axis[x],
                    axis[y]
                ]);
            }
        }

        return {
            points: points,
            axis: axis,
            resolution: resolution
        };
    }

    for (var z = 0; z < resolution; z++) {
        for (var y3 = 0; y3 < resolution; y3++) {
            for (var x3 = 0; x3 < resolution; x3++) {
                points.push([
                    axis[x3],
                    axis[y3],
                    axis[z]
                ]);
            }
        }
    }

    return {
        points: points,
        axis: axis,
        resolution: resolution
    };
}

function embed3(point) {
    return [
        Number(point[0] || 0),
        Number(point[1] || 0),
        Number(point[2] || 0)
    ];
}

function interpolatePoints(a, b, amount) {
    var result = [];

    for (var i = 0; i < 3; i++) {
        result.push(
            a[i] + (b[i] - a[i]) * amount
        );
    }

    return result;
}

function tensorRows(tensor) {
    var array = tensor.arraySync();

    if (!Array.isArray(array)) {
        return [[Number(array)]];
    }

    if (tensor.shape.length === 1) {
        return array.map(function (value) {
            return [Number(value)];
        });
    }

    return array.map(function (row) {
        return row.map(Number);
    });
}

function flattenInto(value, output) {
    output = output || [];

    if (Array.isArray(value)) {
        for (var i = 0; i < value.length; i++) {
            flattenInto(value[i], output);
        }
    } else {
        output.push(Number(value));
    }

    return output;
}

function layerFingerprint(layer) {
    try {
        if (!layer || typeof layer.getWeights !== "function") {
            return "no-weights";
        }

        var weights = layer.getWeights();

        if (!weights || !weights.length) {
            return "no-weights";
        }

        /*
         * Gewichtungen des Layers "fingern" wir, um zu erkennen, ob sich
         * irgendetwas geändert hat. Bewusst nur gestreift (max. ~4096 Werte
         * pro Tensor), damit es auch bei großen Kernels billig bleibt.
         */
        var parts = [];
        var h = 0;

        for (var w = 0; w < weights.length; w++) {
            var tensor = weights[w];
            var shape = (tensor.shape || []).slice();
            parts.push(shape.join(","));

            var flat = flattenInto(tensor.arraySync(), []);
            var n = flat.length;
            var stride = Math.max(1, Math.floor(n / 4096));

            for (var i = 0; i < n; i += stride) {
                h = (h * 31 + Math.round(flat[i] * 1e4)) >>> 0;
            }

            h = (h * 31 + n) >>> 0;
        }

        return parts.join("|") + "#" + h;
    } catch (e) {
        return "fp-err";
    }
}

function evaluateLayerFunction(layerInfo, domain) {
    var tf = global.tf;
    var layer = layerInfo.layer;
    var inputTensor = null;
    var outputTensor = null;
    var layerModel = null;

    try {
        inputTensor = tf.tensor(
            domain.points,
            [
                domain.points.length,
                layerInfo.inputDimension
            ]
        );

        /*
         * Primär: layer.call(x) — die direkteste, robusteste Art, einen
         * einzelnen Layer vorwärtslaufen zu lassen. Fallback: Sub-Modell.
         */
        if (typeof layer.call === "function") {
            outputTensor = layer.call(inputTensor);
        } else {
            layerModel = makeLayerFunction(layer);

            if (!layerModel) {
                return null;
            }

            outputTensor = layerModel.predict(inputTensor);
        }

        if (Array.isArray(outputTensor)) {
            outputTensor = outputTensor[0];
        }

        var outputRows = tensorRows(outputTensor);

        var output = outputRows.map(function (row) {
            return embed3(row);
        });

        logDebug(
            "Raum abgetastet:",
            layerInfo.name,
            "Punkte:",
            domain.points.length
        );

        return {
            input: domain.points.map(embed3),
            output: output,
            inputDimension: layerInfo.inputDimension,
            outputDimension: layerInfo.outputDimension,
            resolution: domain.resolution,
            axis: domain.axis
        };
    } catch (e) {
        logDebug(
            "Raum konnte nicht ausgewertet werden:",
            layerInfo.name,
            e.message || e
        );

        return null;
    } finally {
        if (outputTensor && typeof outputTensor.dispose === "function") {
            outputTensor.dispose();
        }

        if (inputTensor && typeof inputTensor.dispose === "function") {
            inputTensor.dispose();
        }

        if (
            layerModel &&
            typeof layerModel.dispose === "function"
        ) {
            layerModel.dispose();
        }
    }
}

function addPointTrace(points, title, color, opacity) {
    return {
        type: "scatter3d",
        mode: "markers",
        name: title,
        x: points.map(function (p) { return p[0]; }),
        y: points.map(function (p) { return p[1]; }),
        z: points.map(function (p) { return p[2]; }),
        marker: {
            size: 2.3,
            color: color,
            opacity: opacity
        },
        hovertemplate:
            title +
            "<br>x: %{x:.3f}" +
            "<br>y: %{y:.3f}" +
            "<br>z: %{z:.3f}" +
            "<extra></extra>"
    };
}

function addGridLineTraces(
    inputPoints,
    outputPoints,
    resolution,
    inputDimension,
    outputDimension,
    amount
) {
    var traces = [];

    function makeLine(points, title, color, width, opacity) {
        return {
            type: "scatter3d",
            mode: "lines",
            name: title,
            x: points.map(function (p) { return p[0]; }),
            y: points.map(function (p) { return p[1]; }),
            z: points.map(function (p) { return p[2]; }),
            line: {
                color: color,
                width: width
            },
            opacity: opacity,
            hoverinfo: "skip",
            showlegend: false
        };
    }

    function animatedPoint(index) {
        return interpolatePoints(
            inputPoints[index],
            outputPoints[index],
            amount
        );
    }

    if (inputDimension === 1) {
        var line1 = [];

        for (var i = 0; i < inputPoints.length; i++) {
            line1.push(animatedPoint(i));
        }

        traces.push(
            makeLine(
                line1,
                "Raumkurve",
                "#7cf9d0",
                6,
                0.95
            )
        );

        return traces;
    }

    if (inputDimension === 2) {
        for (var y = 0; y < resolution; y++) {
            var horizontal = [];

            for (var x = 0; x < resolution; x++) {
                horizontal.push(
                    animatedPoint(y * resolution + x)
                );
            }

            traces.push(
                makeLine(
                    horizontal,
                    "Gitter",
                    "#7cf9d0",
                    3,
                    0.82
                )
            );
        }

        for (var x2 = 0; x2 < resolution; x2++) {
            var vertical = [];

            for (var y2 = 0; y2 < resolution; y2++) {
                vertical.push(
                    animatedPoint(y2 * resolution + x2)
                );
            }

            traces.push(
                makeLine(
                    vertical,
                    "Gitter",
                    "#ff9ec7",
                    3,
                    0.82
                )
            );
        }

        return traces;
    }

    /*
     * Für 3D-Eingangsräume werden drei Familien paralleler Linien
     * dargestellt. Das ist ein Drahtgitter des vollständigen Würfels.
     */
    for (var z = 0; z < resolution; z++) {
        for (var y3 = 0; y3 < resolution; y3++) {
            var xy = [];

            for (var x3 = 0; x3 < resolution; x3++) {
                xy.push(
                    animatedPoint(
                        z * resolution * resolution +
                        y3 * resolution +
                        x3
                    )
                );
            }

            traces.push(
                makeLine(
                    xy,
                    "Gitter",
                    "#7cf9d0",
                    2,
                    0.65
                )
            );
        }
    }

    for (var z2 = 0; z2 < resolution; z2++) {
        for (var x4 = 0; x4 < resolution; x4++) {
            var xz = [];

            for (var y4 = 0; y4 < resolution; y4++) {
                xz.push(
                    animatedPoint(
                        z2 * resolution * resolution +
                        y4 * resolution +
                        x4
                    )
                );
            }

            traces.push(
                makeLine(
                    xz,
                    "Gitter",
                    "#ff9ec7",
                    2,
                    0.65
                )
            );
        }
    }

    for (var y5 = 0; y5 < resolution; y5++) {
        for (var x5 = 0; x5 < resolution; x5++) {
            var yz = [];

            for (var z3 = 0; z3 < resolution; z3++) {
                yz.push(
                    animatedPoint(
                        z3 * resolution * resolution +
                        y5 * resolution +
                        x5
                    )
                );
            }

            traces.push(
                makeLine(
                    yz,
                    "Gitter",
                    "#ffd166",
                    2,
                    0.65
                )
            );
        }
    }

    return traces;
}

function createTraces(space, amount) {
    var traces = [];

    var animatedInput = space.input.map(function (point, index) {
        return interpolatePoints(
            point,
            space.output[index],
            amount
        );
    });

    traces.push(
        addPointTrace(
            animatedInput,
            "Raum f(A)",
            "#7cf9d0",
            0.78
        )
    );

    traces.push.apply(
        traces,
        addGridLineTraces(
            space.input,
            space.output,
            space.resolution,
            space.inputDimension,
            space.outputDimension,
            amount
        )
    );

    if (amount >= 0.999) {
        traces.push(
            addPointTrace(
                space.output,
                "Raum f(A) nach Layer",
                "#ff9ec7",
                0.92
            )
        );
    }

    return traces;
}

function createLayout(layerInfo, space, amount, camera) {
    var title =
        "<b>" + layerInfo.name + "</b>" +
        " · f : R" + layerInfo.inputDimension +
        " → R" + layerInfo.outputDimension;

    if (amount > 0.01 && amount < 0.99) {
        title +=
            " · Transformation " +
            Math.round(amount * 100) + "%";
    }

    return {
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        margin: {
            l: 0,
            r: 0,
            t: 62,
            b: 0
        },
        title: {
            text: title,
            font: {
                color: "#e8eefc",
                size: 17
            }
        },
        legend: {
            font: {
                color: "#dbe6ff"
            }
        },
        scene: {
            bgcolor: "#08101f",
            aspectmode: "auto",
            camera: camera || {
                eye: {
                    x: 1.55,
                    y: 1.4,
                    z: 1.35
                }
            },
            xaxis: {
                title: "Dimension 1",
                color: "#8fa4c9",
                gridcolor: "#263754",
                zerolinecolor: "#405477"
            },
            yaxis: {
                title: "Dimension 2",
                color: "#8fa4c9",
                gridcolor: "#263754",
                zerolinecolor: "#405477"
            },
            zaxis: {
                title: "Dimension 3",
                color: "#8fa4c9",
                gridcolor: "#263754",
                zerolinecolor: "#405477"
            }
        },
        transition: {
            duration: 650,
            easing: "cubic-in-out"
        }
    };
}

function updateMeta(layerInfo, space) {
    var root = instance.root;
    var title = root.querySelector(".nsw-meta-title");
    var body = root.querySelector(".nsw-meta-body");

    title.textContent =
        layerInfo.name +
        " · " +
        layerInfo.className;

    body.innerHTML =
        "Abbildung: <b>f : R" +
        layerInfo.inputDimension +
        " → R" +
        layerInfo.outputDimension +
        "</b><br>" +
        "Input-Shape: " +
        shapeText(layerInfo.inputShape) +
        "<br>" +
        "Output-Shape: " +
        shapeText(layerInfo.outputShape) +
        "<br>" +
        "Abgetastete Raum-Punkte: " +
        space.input.length +
        "<br>" +
        "Darstellung: vollständiges Gitter, keine Trainingsdaten.";
}

function renderCurrent(amount, animate) {
    if (!instance || !instance.inspection.ok) {
        return false;
    }

    var layerInfo =
        instance.inspection.layers[instance.layerIndex];

    if (!layerInfo) {
        return false;
    }

    var resolution = Number(
        instance.root.querySelector(".nsw-resolution").value
    );

    var range =
        Number(
            instance.root.querySelector(".nsw-range").value
        );

    var domain = createDomainPoints(
        layerInfo.inputDimension,
        range,
        resolution
    );

    logDebug(
        "Berechne Raum:",
        layerInfo.name,
        "f: R" + layerInfo.inputDimension +
        " -> R" + layerInfo.outputDimension,
        "range:",
        range,
        "resolution:",
        resolution
    );

    var space = evaluateLayerFunction(
        layerInfo,
        domain
    );

    if (!space) {
        logDebug(
            "Layer wird übersprungen, weil er numerisch nicht ausgewertet werden konnte:",
            layerInfo.name
        );

        removeVisualizer(
            "Layer " + layerInfo.name +
            " konnte nicht numerisch ausgewertet werden."
        );

        return false;
    }

    instance.space = space;

    var traces = createTraces(
        space,
        amount
    );

    /*
     * Aktuellen Blickwinkel übernehmen, damit ein Re-Render (z. B. weil
     * sich die Gewichte geändert haben) die Kamera NICHT zurücksetzt.
     */
    var currentCamera = null;

    try {
        if (
            instance.plot &&
            instance.plot._fullLayout &&
            instance.plot._fullLayout.scene &&
            instance.plot._fullLayout.scene.camera
        ) {
            currentCamera =
                instance.plot._fullLayout.scene.camera;
        }
    } catch (_) {}

    var layout = createLayout(
        layerInfo,
        space,
        amount,
        currentCamera
    );

    var config = {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: [
            "toImage",
            "sendDataToCloud"
        ]
    };

    global.Plotly.react(
        instance.plot,
        traces,
        layout,
        config
    );

    updateMeta(layerInfo, space);

    var status = instance.root.querySelector(
        ".nsw-status"
    );

    status.textContent =
        instance.inspection.layers.length +
        " kompatible Layer · " +
        "Prüfung alle " +
        instance.options.pollInterval +
        " ms";

    logDebug(
        "Plot aktualisiert:",
        layerInfo.name
    );

    return true;
}

function renderLayerImmediately() {
    instance.animationToken++;
    var ok = renderCurrent(1, false);

    if (ok) {
        var layerInfo =
            instance.inspection.layers[instance.layerIndex];

        instance.lastFingerprint =
            layerInfo
                ? layerFingerprint(layerInfo.layer)
                : null;
    }

    return ok;
}

function animateCurrentLayer() {
    if (!instance || !instance.inspection.ok) {
        return;
    }

    var token = ++instance.animationToken;
    var start = performance.now();
    var duration = instance.options.animationDuration;

    function frame(time) {
        if (!instance || token !== instance.animationToken) {
            return;
        }

        var amount = clamp(
            (time - start) / duration,
            0,
            1
        );

        renderCurrent(amount, true);

        if (amount < 1) {
            requestAnimationFrame(frame);
        }
    }

    renderCurrent(0, false);
    requestAnimationFrame(frame);
}

function updateLayerSelect() {
    var select = instance.root.querySelector(
        ".nsw-layer"
    );

    select.innerHTML = "";

    instance.inspection.layers.forEach(function (layer, index) {
        var option = document.createElement("option");

        option.value = index;
        option.textContent =
            layer.name +
            " · R" +
            layer.inputDimension +
            " → R" +
            layer.outputDimension;

        select.appendChild(option);
    });

    instance.layerIndex = clamp(
        instance.layerIndex,
        0,
        Math.max(0, instance.inspection.layers.length - 1)
    );

    select.value = instance.layerIndex;
}

function bindEvents() {
    var root = instance.root;

    root.querySelector(".nsw-layer").onchange =
        function (event) {
            instance.layerIndex =
                Number(event.target.value);

            renderLayerImmediately();
        };

    root.querySelector(".nsw-range").oninput =
        function (event) {
            var value = Number(event.target.value);

            root.querySelector(
                ".nsw-range-value"
            ).textContent = value.toFixed(2);

            renderLayerImmediately();
        };

    root.querySelector(".nsw-resolution").onchange =
        function () {
            renderLayerImmediately();
        };

    root.querySelector(".nsw-play").onclick =
        function () {
            animateCurrentLayer();
        };

    root.querySelector(".nsw-refresh").onclick =
        function () {
            checkNow();
        };

    /*
     * Merken, wann der Nutzer zuletzt die Kamera bedient hat, damit wir
     * einen gewichtsgetriebenen Re-Render nicht in mitten eines Drehens
     * loslassen.
     */
    if (
        instance.plot &&
        typeof instance.plot.addEventListener === "function"
    ) {
        instance.plot.addEventListener("plotly_relayout", function () {
            instance.userCamAt = performance.now();
        });
    }
}

function ensureMounted() {
    if (instance && instance.root) {
        return true;
    }

    return false;
}

function setTabVisible(visible) {
    try {
        if (visible) {
            if (typeof global.show_tab_label === "function") {
                global.show_tab_label("space_warps_tab_label");
            }
        } else {
            if (typeof global.hide_tab_label === "function") {
                global.hide_tab_label("space_warps_tab_label");
            }
        }
    } catch (_) {}
}

function removeVisualizer(reason) {
    if (!instance) {
        return;
    }

    logDebug(
        "Visualizer wird entfernt:",
        reason
    );

    if (instance.pollTimer) {
        clearInterval(instance.pollTimer);
        instance.pollTimer = null;
    }

    if (
        instance.plot &&
        global.Plotly &&
        typeof global.Plotly.purge === "function"
    ) {
        try {
            global.Plotly.purge(instance.plot);
        } catch (_) {}
    }

    if (
        instance.root &&
        instance.root.parentNode
    ) {
        instance.root.parentNode.removeChild(
            instance.root
        );
    }

    var options = instance.options;

    instance = null;

    global[INSTANCE_KEY] = null;

    setTabVisible(false);

    logDebug(
        "Visualizer vollständig entfernt."
    );

    /*
     * options wird absichtlich nicht erneut gemountet.
     * Der nächste Poll darf nur dann wieder mounten, wenn die
     * Shapes erneut kompatibel sind.
     */
    void options;
}

function mountVisualizer(inspection) {
    if (instance) {
        return;
    }

    var target = resolveTarget(
        instanceOptions.target
    );

    var container;

    if (target) {
        container = target;
    } else {
        container = document.createElement("div");
        document.body.appendChild(container);
    }

    container.innerHTML = "";

    injectStyles();

    /*
     * Der Root wird erst hier erzeugt, nachdem die Prüfung bestanden hat.
     * Dadurch erscheint bei inkompatiblen Shapes nicht einmal ein leeres
     * Singleton-Panel.
     */
    var root = createRoot();
    container.appendChild(root);

    instance = {
        root: root,
        plot: null,
        inspection: inspection,
        options: Object.assign({}, instanceOptions),
        layerIndex: 0,
        space: null,
        pollTimer: null,
        animationToken: 0,
        lastFingerprint: null,
        userCamAt: 0
    };

    global[INSTANCE_KEY] = {
        api: api,
        instance: instance
    };

    instance.plot = root.querySelector(".nsw-plot");

    updateLayerSelect();
    bindEvents();
    renderLayerImmediately();

    lastVisibleReason = "";
    setTabVisible(true);

    logInfo(
        "SpaceWarps aktiv: " +
        inspection.layers.length +
        " kompatible Layer. Tab 'Space Warps' eingeblendet."
    );
}

var lastVisibleReason = "";

function reportReason(reason) {
    if (reason === lastVisibleReason) {
        return;
    }

    lastVisibleReason = reason;
    logInfo("SpaceWarps verborgen: " + reason);
}

function checkNow() {
    var model = getCurrentModel(
        instanceOptions
    );

    if (!model) {
        reportReason("Kein Modell vorhanden");

        if (instance) {
            removeVisualizer(
                "Modell fehlt."
            );
        }

        return false;
    }

    var inspection = checkCanRender(
        model,
        instanceOptions
    );

    if (!inspection.ok) {
        reportReason(inspection.reason);

        if (instance) {
            removeVisualizer(
                inspection.reason
            );
        }

        return false;
    }

    if (!instance) {
        /*
         * Erst jetzt wird überhaupt ein Singleton erzeugt.
         */
        mountVisualizer(inspection);
        return true;
    }

    var changed =
        instance.inspection.signature !==
        inspection.signature ||
        instance.inspection.model !== model;

    if (changed) {
        logDebug(
            "Model oder Shape-Signatur geändert; Visualizer wird neu aufgebaut."
        );

        removeVisualizer(
            "Model/Shape geändert."
        );

        mountVisualizer(inspection);
        return true;
    }

    /*
     * Nur neu berechnen, wenn sich die Gewichte des angezeigten Layers
     * tatsächlich geändert haben (z. B. während des Trainings). Ruht das
     * Modell, passiert gar nichts. Außerdem pausieren wir, solange der
     * Nutzer gerade die Kamera dreht, damit ihm der Plot nicht unter den
     * Fingern weg neu gezeichnet wird.
     */
    instance.inspection = inspection;

    if (instance.plot) {
        var shownLayer = inspection.layers[instance.layerIndex];
        var fp = layerFingerprint(
            shownLayer ? shownLayer.layer : null
        );

        var userRotating =
            instance.userCamAt &&
            (performance.now() - instance.userCamAt) < 1200;

        if (fp !== instance.lastFingerprint && !userRotating) {
            logDebug(
                "Gewichte geändert, berechne Raum neu:" +
                (shownLayer ? shownLayer.name : "")
            );

            renderLayerImmediately();
        }
    }

    return true;
}

var instanceOptions = {
    target: null,
    model: null,
    debug: false,
    pollInterval: 750,
    animationDuration: 1800,
    autoCheck: true
};

function start(options) {
    options = options || {};

    instanceOptions = Object.assign(
        {},
        instanceOptions,
        options
    );

    if (!hasTF()) {
        logDebug(
            "Start abgebrochen: TensorFlow.js fehlt."
        );

        return api;
    }

    if (!hasPlotly()) {
        logDebug(
            "Start abgebrochen: Plotly fehlt."
        );

        return api;
    }

    if (instanceOptions.autoCheck) {
        if (instanceOptions.pollTimer) {
            clearInterval(
                instanceOptions.pollTimer
            );
        }

        instanceOptions.pollTimer =
            setInterval(
                checkNow,
                instanceOptions.pollInterval
            );
    }

    /*
     * Sofortprüfung zusätzlich zum Intervall.
     * Es wird nur geprüft; es werden keine Daten geladen.
     */
    checkNow();

    return api;
}

function stop() {
    if (instanceOptions.pollTimer) {
        clearInterval(
            instanceOptions.pollTimer
        );

        instanceOptions.pollTimer = null;
    }

    if (instance) {
        removeVisualizer(
            "Manuell gestoppt."
        );
    }
}

function refresh() {
    return checkNow();
}

function destroy() {
    stop();
}

function getInstance() {
    return instance;
}

function getState() {
    var model = getCurrentModel(instanceOptions);
    var inspection = null;

    if (model) {
        try {
            inspection = checkCanRender(model, instanceOptions);
        } catch (e) {
            inspection = {
                ok: false,
                reason: "inspect threw: " + (e.message || e)
            };
        }
    }

    return {
        hasTF: hasTF(),
        hasPlotly: hasPlotly(),
        modelFound: !!model,
        layerCount: model && Array.isArray(model.layers)
            ? model.layers.length
            : 0,
        inspectionOk: inspection ? inspection.ok : false,
        inspectionReason: inspection ? inspection.reason : "no-model",
        compatibleLayers: inspection && inspection.layers
            ? inspection.layers.length
            : 0,
        instanceExists: !!instance,
        targetFound: !!(
            instanceOptions.target &&
            resolveTarget(instanceOptions.target)
        )
    };
}

var api = {
    start: start,
    refresh: refresh,
    stop: stop,
    destroy: destroy,
    getInstance: getInstance,
    getState: getState
};

global[INSTANCE_KEY] = {
    api: api,
    instance: null
};

global.NeuralSpaceWarps = api;

})(window);
