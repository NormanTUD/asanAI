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

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function maxAbsCoord(points) {
    var max = 0;

    for (var i = 0; i < points.length; i++) {
        var p = points[i];

        for (var c = 0; c < p.length; c++) {
            var v = Math.abs(Number(p[c]) || 0);

            if (v > max) {
                max = v;
            }
        }
    }

    return max;
}

/*
 * Liest die echten Eingabedaten (global_x) als Zeilen zurück — die
 * tatsächlichen Trainingsdaten, nicht das synthetische Gitter.
 */
function getInputDataPoints() {
    var x = global.global_x;

    if (!x) {
        return null;
    }

    try {
        var rows = tensorRows(x);

        return rows && rows.length ? rows : null;
    } catch (_) {
        return null;
    }
}

function collectTraceXYZ(traces) {
    var x = [];
    var y = [];
    var z = [];

    for (var i = 0; i < traces.length; i++) {
        x.push(traces[i].x || []);
        y.push(traces[i].y || []);
        z.push(traces[i].z || []);
    }

    return { x: x, y: y, z: z };
}

/*
 * Letztes Safety-Netz vor Plotly: jeder Trace wird abgebaut und seine
 * x/y/z-Koordinaten auf endliche Zahlen gezwungen (NaN/±Inf -> 0). So kann
 * selbst ein numerisch kaputter Layer den Plot nie crashen oder kaputt
 * rendern — die restlichen Felder bleiben unverändert erhalten.
 */
function sanitizeTraces(traces) {
    if (!Array.isArray(traces)) {
        return [];
    }

    return traces.map(function (t) {
        if (!t || typeof t !== "object") {
            return { type: "scatter3d", mode: "markers", x: [], y: [], z: [] };
        }

        var clean = Object.assign({}, t);

        /*
         * 'surface'-Traces haben ein 2D-z (Zeilen-Array). Das wäre hier
         * falsch abgeflacht. Sie werden von uns mit garantiert endlichen
         * Werten gebaut, also unverändert lassen.
         */
        if (t.type === "surface") {
            return clean;
        }

        for (var a = 0; a < 3; a++) {
            var axis = ["x", "y", "z"][a];
            var arr = t[axis];

            if (!Array.isArray(arr)) {
                clean[axis] = [];
                continue;
            }

            var sa = new Array(arr.length);

            for (var j = 0; j < arr.length; j++) {
                var v = Number(arr[j]);
                sa[j] = isFinite(v) ? v : 0;
            }

            clean[axis] = sa;
        }

        return clean;
    });
}

function sameXYZLength(from, to) {
    if (!from || !to) {
        return false;
    }

    if (from.x.length !== to.x.length) {
        return false;
    }

    for (var i = 0; i < to.x.length; i++) {
        if (
            from.x[i].length !== to.x[i].length ||
            from.y[i].length !== to.y[i].length ||
            from.z[i].length !== to.z[i].length
        ) {
            return false;
        }
    }

    return true;
}

function coalesceCoord(from, to, t) {
    /*
     * verschachtelte Arrays (z. B. die 2D-z-Zeilen eines 'surface'-Traces)
     * werden NICHT ge-lerpt — sie bleiben unverändert. Nur flache Zahlen
     * werden interpoliert; nicht-endliche Werte fallen auf das Ziel zurück.
     */
    if (Array.isArray(from) || Array.isArray(to)) {
        return to;
    }

    var fv = Number(from);
    var tv = Number(to);

    if (!isFinite(fv) || !isFinite(tv)) {
        return tv;
    }

    return fv + (tv - fv) * t;
}

function lerpTraceXYZ(from, to, t) {
    if (!sameXYZLength(from, to)) {
        return to;
    }

    var x = [];
    var y = [];
    var z = [];

    for (var i = 0; i < to.x.length; i++) {
        var xi = [];
        var yi = [];
        var zi = [];

        for (var j = 0; j < to.x[i].length; j++) {
            xi.push(coalesceCoord(from.x[i][j], to.x[i][j], t));
            yi.push(coalesceCoord(from.y[i][j], to.y[i][j], t));
            zi.push(coalesceCoord(from.z[i][j], to.z[i][j], t));
        }

        x.push(xi);
        y.push(yi);
        z.push(zi);
    }

    return { x: x, y: y, z: z };
}

function plotStructureSig(traces, layerIndex) {
    var parts = ["L" + layerIndex, traces.length];

    for (var i = 0; i < traces.length; i++) {
        var t = traces[i];

        parts.push(
            (t.type || "?") +
            ":" + (t.x || []).length +
            ":" + (t.mode === "markers" ? "p" : "l")
        );
    }

    return parts.join("|");
}

/*
 * Signatur der Layout-"Chrome" (Titel, Achsentitel, Annotationen) — also
 * allem Text, das Data-Morph (restyle) NICHT aktualisiert. Wechselt sie
 * (z. B. beim Sprachwechsel), muss ein kompletter Plotly.react laufen.
 */
function layoutChromeSig(layout) {
    if (!layout) {
        return "";
    }

    var parts = [];
    parts.push(layout.title && layout.title.text ? layout.title.text : "");

    var scene = layout.scene || {};
    parts.push(scene.xaxis && scene.xaxis.title ? scene.xaxis.title : "");
    parts.push(scene.yaxis && scene.yaxis.title ? scene.yaxis.title : "");
    parts.push(scene.zaxis && scene.zaxis.title ? scene.zaxis.title : "");

    var ann = layout.annotations || [];
    for (var i = 0; i < ann.length; i++) {
        parts.push(ann[i].text || "");
    }

    return parts.join("");
}

function identityMatrix(n) {
    var m = [];

    for (var i = 0; i < n; i++) {
        m.push(new Array(n).fill(0));
        m[i][i] = 1;
    }

    return m;
}

/*
 * Zyklische Jacobi-Eigendekomposition einer symmetrischen Matrix.
 * Liefert { values: [eig. Werte, absteigend], vectors: [Spalten = Eigenvektoren] }.
 */
function jacobiEigen(A, n) {
    var M = A.map(function (row) {
        return row.slice();
    });

    var V = identityMatrix(n);
    var maxSweeps = 60;

    for (var sweep = 0; sweep < maxSweeps; sweep++) {
        var off = 0;

        for (var p = 0; p < n; p++) {
            for (var q = p + 1; q < n; q++) {
                off += M[p][q] * M[p][q];
            }
        }

        if (off < 1e-16) {
            break;
        }

        for (var p2 = 0; p2 < n; p2++) {
            for (var q2 = p2 + 1; q2 < n; q2++) {
                var appq = M[p2][q2];

                if (Math.abs(appq) < 1e-17) {
                    continue;
                }

                var theta = (M[q2][q2] - M[p2][p2]) / (2 * appq);
                var t =
                    (theta < 0 ? -1 : 1) /
                    (Math.abs(theta) + Math.sqrt(theta * theta + 1));
                var c = 1 / Math.sqrt(t * t + 1);
                var s = t * c;

                for (var i = 0; i < n; i++) {
                    var mip = M[i][p2];
                    var miq = M[i][q2];
                    M[i][p2] = c * mip - s * miq;
                    M[i][q2] = s * mip + c * miq;
                }

                for (var j = 0; j < n; j++) {
                    var mpj = M[p2][j];
                    var mqj = M[q2][j];
                    M[p2][j] = c * mpj - s * mqj;
                    M[q2][j] = s * mpj + c * mqj;
                }

                for (var k = 0; k < n; k++) {
                    var vkp = V[k][p2];
                    var vkq = V[k][q2];
                    V[k][p2] = c * vkp - s * vkq;
                    V[k][q2] = s * vkp + c * vkq;
                }
            }
        }
    }

    var values = [];

    for (var i2 = 0; i2 < n; i2++) {
        values.push(M[i2][i2]);
    }

    var order = values
        .map(function (_, idx) {
            return idx;
        })
        .sort(function (a, b) {
            return values[b] - values[a];
        });

    var vectors = [];

    for (var col = 0; col < n; col++) {
        var vec = [];

        for (var r = 0; r < n; r++) {
            vec.push(V[r][order[col]]);
        }

        vectors.push(vec);
    }

    var sortedValues = order.map(function (idx) {
        return values[idx];
    });

    return {
        values: sortedValues,
        vectors: vectors
    };
}

/*
 * Reduziert N×D Daten auf N×targetDim via PCA (Top-K-Hauptkomponenten).
 * Bei d <= targetDim werden fehlende Dimensionen mit 0 aufgefüllt.
 */
function pcaReduce(rows, targetDim) {
    if (!rows || !rows.length) {
        return [];
    }

    targetDim = Math.max(1, Math.floor(targetDim) || 1);
    var n = rows.length;
    var d = (rows[0] && rows[0].length) || 0;

    if (!isFinite(d) || d < 1) {
        d = 1;
    }

    if (d <= targetDim) {
        return rows.map(function (r) {
            var o = [];

            for (var j = 0; j < targetDim; j++) {
                o.push(j < r.length ? Number(r[j]) || 0 : 0);
            }

            return o;
        });
    }

    /* Ein einziger Punkt trägt keine Kovarianz (Division durch n-1=0). */
    if (n < 2) {
        return rows.map(function (r) {
            var o = [];

            for (var j = 0; j < targetDim; j++) {
                o.push(j < r.length ? Number(r[j]) || 0 : 0);
            }

            return o;
        });
    }

    var mean = new Array(d).fill(0);

    for (var i = 0; i < n; i++) {
        for (var j = 0; j < d; j++) {
            mean[j] += (Number(rows[i][j]) || 0) / n;
        }
    }

    var centered = rows.map(function (r) {
        var o = [];

        for (var j = 0; j < d; j++) {
            o.push((Number(r[j]) || 0) - mean[j]);
        }

        return o;
    });

    var C = [];

    for (var a = 0; a < d; a++) {
        C.push(new Array(d).fill(0));
    }

    for (var i2 = 0; i2 < n; i2++) {
        for (var a2 = 0; a2 < d; a2++) {
            for (var b2 = 0; b2 < d; b2++) {
                C[a2][b2] +=
                    centered[i2][a2] * centered[i2][b2] / (n - 1);
            }
        }
    }

    var eig = jacobiEigen(C, d);
    var out = [];

    for (var i3 = 0; i3 < n; i3++) {
        var o = [];

        for (var k = 0; k < targetDim; k++) {
            var dot = 0;

            for (var j2 = 0; j2 < d; j2++) {
                dot += centered[i3][j2] * eig.vectors[k][j2];
            }

            o.push(dot);
        }

        out.push(o);
    }

    return out;
}

/*
 * Schnelle Dimensionsreduktion für SEHR hohe Räume (>128D, z. B. Bilder):
 * zufällige Projektion (Johnson–Lindenstrauss) auf `targetDim`D.
 *
 * Jacobi-PCA wäre hier O(D^3) — für D=784 pro Render zu teuer. Eine feste,
 * seeded Zufallsmatrix projiziert in O(N*D), erhält Abstände bis auf einen
 * bekannten Faktor und ist über Renders hinweg stabil.
 */
function randomProject(rows, targetDim, seed) {
    if (!rows || !rows.length) {
        return [];
    }

    targetDim = Math.max(1, Math.floor(targetDim) || 1);
    var n = rows.length;
    var d = (rows[0] && rows[0].length) || 0;

    if (!isFinite(d) || d < 1) {
        d = 1;
    }

    if (d <= targetDim) {
        return rows.map(function (r) {
            var o = [];

            for (var j = 0; j < targetDim; j++) {
                o.push(j < r.length ? Number(r[j]) || 0 : 0);
            }

            return o;
        });
    }

    var rnd = mulberry32(seed || 0x5eed1);
    var scale = 1 / Math.sqrt(targetDim);

    /* Feste Zufallsmatrix R (targetDim x d) — für alle Zeilen identisch. */
    var R = [];

    for (var k = 0; k < targetDim; k++) {
        var rrow = new Array(d);

        for (var j = 0; j < d; j++) {
            rrow[j] = (rnd() * 2 - 1) * scale;
        }

        R.push(rrow);
    }

    var out = [];

    for (var i = 0; i < n; i++) {
        var row = rows[i];
        var o = [];

        for (var kk = 0; kk < targetDim; kk++) {
            var dot = 0;

            for (var j2 = 0; j2 < d; j2++) {
                dot += (Number(row[j2]) || 0) * R[kk][j2];
            }

            o.push(dot);
        }

        out.push(o);
    }

    return out;
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

/*
 * Flache Feature-Dimension aus einer (batch-, …) Shape.
 *
 *   [batch, f]        -> f          (R^f)
 *   [batch, H, W]     -> H * W      (Bildausschnitt)
 *   [batch, H, W, C]  -> H * W * C  (CNN-Bild)
 *
 * shape[0] ist der Batch (oft null) und wird übersprungen.
 */
function featureDimFromShape(shape) {
    if (!Array.isArray(shape) || shape.length < 2) {
        return null;
    }

    var dim = 1;

    for (var i = 1; i < shape.length; i++) {
        var s = shape[i];

        if (
            typeof s !== "number" ||
            !Number.isInteger(s) ||
            s < 1
        ) {
            return null;
        }

        dim *= s;

        /* Overflow/absurde-Shape-Guard. */
        if (!isFinite(dim) || dim > MAX_FEATURE_DIMENSION) {
            return null;
        }
    }

    return dim;
}

function getFeatureDimension(shape) {
    return featureDimFromShape(shape);
}

/*
 * Feature-Dimensionen jeder Größe sind plottbar: kleine (1–3D) als
 * Gitterfläche, alles darüber als Punktwolke, per PCA (≤128D) bzw.
 * zufälliger Projektion (>128D, Johnson–Lindenstrauss) auf 3D reduziert.
 * Die Grenze ist nur ein saner Obergrenzen-Wert gegen abstruse Shapes.
 */
var MAX_FEATURE_DIMENSION = 1000000;

function isCompatibleFeatureDimension(dimension) {
    return (
        typeof dimension === "number" &&
        Number.isInteger(dimension) &&
        dimension >= 1 &&
        dimension <= MAX_FEATURE_DIMENSION
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

var lastCheckLogKey = "";

function inspectModel(model, options) {
    var result = {
        ok: false,
        reason: "",
        model: model,
        layers: [],
        signature: ""
    };

    if (!hasTF()) {
        result.reason = t("nsw_tf_missing", "TensorFlow.js fehlt.");
        return result;
    }

    if (!hasPlotly()) {
        result.reason = t("nsw_plotly_missing", "Plotly fehlt.");
        return result;
    }

    if (!model) {
        result.reason = t(
            "nsw_model_missing_msg",
            "window.model ist nicht vorhanden."
        );
        return result;
    }

    if (!Array.isArray(model.layers)) {
        result.reason = t(
            "nsw_bad_layers",
            "model.layers ist keine gültige Liste."
        );
        return result;
    }

    var visibleLayers = getVisibleLayers(model);

    if (!visibleLayers.length) {
        result.reason = t(
            "nsw_no_visible_layers",
            "Das Modell besitzt keine sichtbaren Layer."
        );
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

        if (!inputShape) {
            result.reason = fmt(
                "nsw_layer_no_input_shape",
                "Layer %d besitzt keine lesbare Input-Shape.",
                [i]
            );
            return result;
        }

        if (!outputShape) {
            result.reason = fmt(
                "nsw_layer_no_output_shape",
                "Layer %d besitzt keine lesbare Output-Shape.",
                [i]
            );
            return result;
        }

        /*
         * Immer plottbar: Rank 2+ (Vektor, Bild, Sequenz). Kleine Räume
         * (≤3D) werden als Gitterfläche gezeichnet, alles darüber als
         * Punktwolke per PCA / zufälliger Projektion auf 2D reduziert.
         */
        if (inputShape.length < 2) {
            result.reason = fmt(
                "nsw_layer_input_rank",
                "Layer %d ist nicht plotbar: Input-Rang %d (mindestens [batch, …] nötig).",
                [i, inputShape.length]
            );
            return result;
        }

        if (outputShape.length < 2) {
            result.reason = fmt(
                "nsw_layer_output_rank",
                "Layer %d ist nicht plotbar: Output-Rang %d (mindestens [batch, …] nötig).",
                [i, outputShape.length]
            );
            return result;
        }

        if (!isCompatibleFeatureDimension(inputDimension)) {
            result.reason = fmt(
                "nsw_layer_input_dim",
                "Layer %d ist nicht plotbar: Input-Dimension %d außerhalb des erlaubten Bereichs.",
                [i, inputDimension]
            );
            return result;
        }

        if (!isCompatibleFeatureDimension(outputDimension)) {
            result.reason = fmt(
                "nsw_layer_output_dim",
                "Layer %d ist nicht plotbar: Output-Dimension %d außerhalb des erlaubten Bereichs.",
                [i, outputDimension]
            );
            return result;
        }

        /*
         * Ein Layer muss eine echte symbolische Einzel-Eingabe besitzen.
         * Bei Concatenate/Add mit mehreren Inputs wäre die Darstellung
         * eines einzelnen A -> B-Raums mehrdeutig.
         */
        if (Array.isArray(layer.input)) {
            result.reason = fmt(
                "nsw_layer_multi_input",
                "Layer %d besitzt mehrere Inputs und wird nicht automatisch geplottet.",
                [i]
            );
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
        result.reason = t(
            "nsw_no_suitable_layers",
            "Keine geeigneten Layer gefunden."
        );
        return result;
    }

    /*
     * Größte Feature-Dimension über alle Ebenen (Eingabe + Layer-Outputs).
     * >2 bedeutet: die Ebene kann nicht nativ eingezeichnet werden und
     * braucht eine 2D-Projektion (PCA) — das wollen wir ankündigen.
     */
    var maxDim = 0;

    for (var m = 0; m < result.layers.length; m++) {
        if (m === 0) {
            maxDim = Math.max(
                maxDim,
                result.layers[m].inputDimension || 0
            );
        }

        maxDim = Math.max(
            maxDim,
            result.layers[m].outputDimension || 0
        );
    }

    result.maxDim = maxDim;
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

    var key = inspection.ok
        ? "ok:" + inspection.signature
        : "fail:" + inspection.reason;

    if (key !== lastCheckLogKey) {
        lastCheckLogKey = key;

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
                    <span class="TRANSLATEME_nsw_subtitle"></span>
                </div>
            </div>

            <div class="nsw-status">
                –
            </div>
        </div>

        <div class="nsw-toolbar">
            <label>
                <span class="TRANSLATEME_nsw_dimred_label"></span>
                <select class="nsw-dimred">
                    <option value="pca" selected data-tr-option="nsw_dimred_pca">PCA (auto)</option>
                    <option value="first3" data-tr-option="nsw_dimred_first3">Erste 3 Dimensionen</option>
                    <option value="4dc" data-tr-option="nsw_dimred_4dc">4D + Farbe</option>
                </select>
            </label>

            <label>
                <span class="TRANSLATEME_nsw_range_label"></span>
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
                <span class="TRANSLATEME_nsw_grid_label"></span>
                <select class="nsw-resolution">
                    <option value="9">9 × 9</option>
                    <option value="13" selected>13 × 13</option>
                    <option value="17">17 × 17</option>
                    <option value="23">23 × 23</option>
                </select>
            </label>

            <label class="nsw-connections-wrap">
                <input
                    class="nsw-connections"
                    type="checkbox"
                    checked>
                <span class="TRANSLATEME_nsw_connections"></span>
            </label>

            <button class="nsw-refresh">
                ↻ <span class="TRANSLATEME_nsw_refresh"></span>
            </button>
        </div>

        <div class="nsw-plot"></div>

        <div class="nsw-pca-ask" style="display:none">
            <div class="nsw-pca-ask-title">
                <span class="TRANSLATEME_nsw_pca_ask_title"></span>
            </div>
            <div class="nsw-pca-ask-body">
                <span class="TRANSLATEME_nsw_pca_ask_body"></span>
            </div>
            <div class="nsw-pca-ask-actions">
                <button class="nsw-pca-yes">
                    <span class="TRANSLATEME_nsw_pca_yes"></span>
                </button>
                <button class="nsw-pca-no">
                    <span class="TRANSLATEME_nsw_pca_no"></span>
                </button>
            </div>
        </div>

        <div class="nsw-pca-declined" style="display:none">
            <span class="TRANSLATEME_nsw_pca_declined"></span>
            <button class="nsw-pca-yes-again">
                <span class="TRANSLATEME_nsw_pca_yes"></span>
            </button>
        </div>

        <div class="nsw-pca-warn" style="display:none">
            <span class="TRANSLATEME_nsw_pca_warn"></span>
        </div>

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

        .nsw-range-value,
        .nsw-viewscale-value {
            color: #e8eefc;
            font-variant-numeric: tabular-nums;
        }

        .nsw-toolbar label.nsw-connections-wrap {
            flex-direction: row;
            align-items: center;
            min-width: 0;
            gap: 7px;
            user-select: none;
        }

        .nsw-toolbar input.nsw-connections {
            accent-color: #7cf9d0;
            width: 16px;
            height: 16px;
            margin: 0;
            cursor: pointer;
        }

        .nsw-check {
            min-width: 0;
            display: inline-flex;
            flex-direction: row;
            align-items: center;
            gap: 7px;
            cursor: pointer;
            user-select: none;
        }

        .nsw-check input[type=checkbox] {
            accent-color: #7cf9d0;
            width: 16px;
            height: 16px;
            margin: 0;
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

        .nsw-pca-ask,
        .nsw-pca-declined {
            margin: 10px 17px;
            padding: 15px 17px;
            border: 1px solid rgba(255, 200, 120, .4);
            border-radius: 10px;
            background: rgba(60, 44, 10, .5);
            color: #f0e6d2;
        }

        .nsw-pca-ask-title {
            font-weight: 800;
            font-size: 14px;
            color: #ffd27c;
            margin-bottom: 7px;
        }

        .nsw-pca-ask-body {
            font-size: 12.5px;
            line-height: 1.55;
            margin-bottom: 12px;
        }

        .nsw-pca-ask-actions button,
        .nsw-pca-declined button {
            margin-right: 8px;
            padding: 6px 14px;
            border-radius: 8px;
            border: 1px solid rgba(150, 172, 214, .4);
            background: rgba(150, 172, 214, .12);
            color: #e8eefc;
            cursor: pointer;
            font-size: 12.5px;
        }

        .nsw-pca-ask-actions button:hover,
        .nsw-pca-declined button:hover {
            background: rgba(150, 172, 214, .24);
        }

        .nsw-pca-warn {
            margin: 8px 17px 0;
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid rgba(255, 150, 120, .4);
            background: rgba(70, 30, 20, .5);
            color: #ffd0c0;
            font-size: 12px;
            line-height: 1.5;
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

        .nsw-status-body {
            padding: 40px 22px 48px;
            color: #c9d6ef;
            font-size: 14px;
            line-height: 1.6;
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
    var n = Math.max(1, resolution | 0);
    var step = n > 1 ? (2 * range) / (n - 1) : 0;

    for (var j = 0; j < n; j++) {
        values.push(-range + step * j);
    }

    return values;
}

/*
 * Anzahl der Probe-Punkte für hohe Eingabe-Dimensionen (Bilder, >3D).
 * Ein Gitter ist dort nicht darstellbar, also nehmen wir eine feste,
 * deterministische Handvoll Punkte und warp sie durch den Layer.
 */
var HIGH_DIM_SAMPLES = 24;

/*
 * Flaches Array (Länge = Produkt(shape)) in verschachtelte Form nach
 * `shape` umformen. [H,W,C] -> [[[...],[...]], ...] etc.
 */
function reshapeInto(flat, shape, pos) {
    pos = pos || 0;
    flat = Array.isArray(flat) ? flat : [];

    if (shape.length === 1) {
        var n = shape[0];
        var arr = [];

        for (var k = 0; k < n; k++) {
            var idx = pos + k;
            arr.push(idx < flat.length ? Number(flat[idx]) || 0 : 0);
        }

        return arr;
    }

    var restCount = 1;

    for (var i = 1; i < shape.length; i++) {
        restCount *= shape[i];
    }

    var out = [];

    for (var s = 0; s < shape[0]; s++) {
        out.push(
            reshapeInto(
                flat,
                shape.slice(1),
                pos + s * restCount
            )
        );
    }

    return out;
}

function reshapeToShape(flat, shape) {
    return reshapeInto(flat, shape, 0);
}

function gridPoints(dim, axis, resolution) {
    var points = [];

    if (dim === 1) {
        for (var i = 0; i < axis.length; i++) {
            points.push([axis[i]]);
        }
    } else if (dim === 2) {
        for (var y = 0; y < resolution; y++) {
            for (var x = 0; x < resolution; x++) {
                points.push([axis[x], axis[y]]);
            }
        }
    } else {
        for (var z = 0; z < resolution; z++) {
            for (var y = 0; y < resolution; y++) {
                for (var x = 0; x < resolution; x++) {
                    points.push([axis[x], axis[y], axis[z]]);
                }
            }
        }
    }

    return points;
}

/* Deterministischer PRNG (stabile Probe-Punkte über Renders hinweg). */
function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6D2B79F5) | 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function sampleProbePoints(flatDim, range, n) {
    var rnd = mulberry32(0x5eed0);
    var points = [];

    for (var p = 0; p < n; p++) {
        var row = [];

        for (var d = 0; d < flatDim; d++) {
            row.push((rnd() * 2 - 1) * range);
        }

        points.push(row);
    }

    return points;
}

/*
 * Erzeugt die Probe-Punkte für einen Layer-Input.
 *
 *   - Input-Shape nativ (z. B. [null, 2] oder [null, 28, 28, 1]).
 *   - ≤3D  → Gitter (die "Fläche"), so ein 2D-Layer eine Fläche zeigt.
 *   - >3D  → deterministische Sample-Punkte (Bild/Sequenz-Raum).
 *
 * Liefert flache Punkte (für die 3D-Reduktion) UND die nativ geformten
 * Tensor-Daten (für den echten Layer-Aufruf).
 */
function createDomainPoints(inputShape, range, resolution) {
    /* Range / Resolution robust machen (Control könnte 0/NaN/leer liefern). */
    range =
        isFinite(Number(range)) && Number(range) > 0
            ? Number(range)
            : 1;
    resolution =
        isFinite(Number(resolution)) && Number(resolution) >= 1
            ? Math.floor(Number(resolution))
            : 13;
    resolution = Math.max(1, Math.min(resolution, 40));

    /* Native Shape robust: nur gültige positive Integer-Dimensionen, sonst 1D. */
    var nativeShape = [];

    if (Array.isArray(inputShape)) {
        for (var i = 1; i < inputShape.length; i++) {
            var s = inputShape[i];

            if (
                typeof s === "number" &&
                Number.isInteger(s) &&
                s >= 1
            ) {
                nativeShape.push(s);
            }
        }
    }

    if (!nativeShape.length) {
        nativeShape = [1];
    }

    var flatDim = 1;

    for (var j = 0; j < nativeShape.length; j++) {
        flatDim *= nativeShape[j];
    }

    if (!isFinite(flatDim) || flatDim < 1) {
        nativeShape = [1];
        flatDim = 1;
    }

    var isGrid = flatDim <= 3;
    var axis = isGrid ? createAxisValues(flatDim, range, resolution) : [];

    /*
     * Sample-Anzahl bei hohen D so wählen, dass N*D in Grenzen bleibt
     * (sonst riesige Input-Tensoren / langsamer Layer-Call).
     */
    var sampleCount = Math.max(
        4,
        Math.min(
            HIGH_DIM_SAMPLES,
            Math.floor(200000 / Math.max(1, flatDim))
        )
    );

    var points = isGrid
        ? gridPoints(flatDim, axis, resolution)
        : sampleProbePoints(flatDim, range, sampleCount);

    return {
        points: points,
        nativeShape: nativeShape,
        flatDim: flatDim,
        isGrid: isGrid,
        gridDim: isGrid ? flatDim : 0,
        resolution: isGrid ? resolution : 0,
        axis: axis,
        tensor: points.map(function (flat) {
            return reshapeToShape(flat, nativeShape);
        })
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

/*
 * Like tensorRows, aber für beliebigen Rank (≥2): der Batch-Achse (Axis 0)
 * wird jeder Sample auf einen FLACHEN Feature-Vektor gezogen.
 *   [N, F]     -> N Zeilen à F
 *   [N, H, W]  -> N Zeilen à H*W
 *   [N, H, W,C]-> N Zeilen à H*W*C
 */
function tensorRowsFlatten(tensor) {
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
        return flattenInto(row, []);
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

    /* Defensive Guardrails: kaputtes Domain/Layer sofort sauber ablehnen. */
    if (
        !layerInfo ||
        !layerInfo.layer ||
        !domain ||
        !Array.isArray(domain.points) ||
        !domain.points.length ||
        !Array.isArray(domain.nativeShape) ||
        !domain.nativeShape.length
    ) {
        return null;
    }

    var layer = layerInfo.layer;
    var inputTensor = null;
    var outputTensor = null;
    var layerModel = null;

    try {
        /*
         * Input im NATIVEN Shape bauen (nicht [N, flatDim]): ein Conv-Layer
         * braucht z. B. [N, H, W, C], ein Dense-Layer [N, features].
         */
        inputTensor = tf.tensor(
            Array.isArray(domain.tensor) ? domain.tensor : domain.points,
            [domain.points.length].concat(domain.nativeShape)
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

        if (!outputTensor) {
            return null;
        }

        /*
         * Volldimensionale, FLACHGEZOGENE Zeilen (nicht auf 3D gekürzt):
         * [N, H, W, C] -> [N][H*W*C]. Die Reduktion auf 3D (embed3 /
         * PCA / Zufallsprojektion) passiert erst bei der Darstellung.
         */
        var rawOutput = tensorRowsFlatten(outputTensor);

        /*
         * Output harden: nicht-endliche Werte (NaN/±Inf, z. B. durch
         * Overflow bei großen Gewichten) zu 0, Zeilen gleichlang. Wenn die
         * Hälfte kaputt ist, halten wir den Layer für numerisch nicht
         * evaluable (failStreak regelt den Rest).
         */
        var bad = 0;
        var total = 0;
        var outDim = 0;
        var output = [];

        for (var oi = 0; oi < rawOutput.length; oi++) {
            var raw = Array.isArray(rawOutput[oi])
                ? rawOutput[oi]
                : [rawOutput[oi]];
            outDim = Math.max(outDim, raw.length);

            var cr = [];

            for (var oj = 0; oj < raw.length; oj++) {
                var v = Number(raw[oj]);
                total++;

                if (!isFinite(v)) {
                    bad++;
                    v = 0;
                }

                cr.push(v);
            }

            output.push(cr);
        }

        for (var oi2 = 0; oi2 < output.length; oi2++) {
            while (output[oi2].length < outDim) {
                output[oi2].push(0);
            }
        }

        if (!output.length || !outDim) {
            return null;
        }

        if (total > 0 && bad / total > 0.5) {
            logDebug(
                "Raum verworfen (zu viele nicht-endliche Werte):",
                layerInfo.name,
                bad + "/" + total
            );

            return null;
        }

        logDebug(
            "Raum abgetastet:",
            layerInfo.name,
            "Punkte:",
            domain.points.length
        );

        return {
            input: domain.points,
            output: output,
            inputDimension: layerInfo.inputDimension,
            outputDimension: outDim,
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

function createTraces(space, amount, mode) {
    var traces = [];

    if (
        !space ||
        !Array.isArray(space.input) ||
        !Array.isArray(space.output)
    ) {
        return traces;
    }

    /*
     * Input (≤3D) und Output (beliebig, per PCA/Erste-3/4D auf 3D) auf
     * darstellbare 3D-Punkte reduzieren. Reihenfolge bleibt erhalten,
     * damit die Gitter-Topologie weiter stimmt.
     */
    var input3d = reduceTo3D(
        space.input,
        space.inputDimension,
        mode
    ).xyz;

    var output3d = reduceTo3D(
        space.output,
        space.outputDimension,
        mode
    ).xyz;

    /*
     * Animated-Input + Gitter brauchen 1:1 passende Punktanzahl. Ein Layer,
     * der die Batch-Größe ändert, würde sonst interpolatePoints/
     * Gitter-Indizes aus dem Ruder laufen lassen — dann nur Output zeigen.
     */
    var matched =
        input3d.length > 0 &&
        input3d.length === output3d.length;

    if (matched) {
        var animatedInput = input3d.map(function (point, index) {
            return interpolatePoints(
                point,
                output3d[index],
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

        /*
         * Gitterlinien nur für kleine Eingabe-Räume (≤3D, ein echtes
         * Gitter). Hohe Dimensionen sind Sample-Punkte — da gibt es keine
         * Gitter-Topologie, also nur die (reduzierten) Punkte.
         */
        if (
            isFinite(space.inputDimension) &&
            space.inputDimension <= 3
        ) {
            traces.push.apply(
                traces,
                addGridLineTraces(
                    input3d,
                    output3d,
                    space.resolution,
                    space.inputDimension,
                    space.outputDimension,
                    amount
                )
            );
        }
    }

    if (amount >= 0.999 && output3d.length) {
        traces.push(
            addPointTrace(
                output3d,
                "Raum f(A) nach Layer",
                "#ff9ec7",
                0.92
            )
        );
    }

    return traces;
}

function createLayout(layerInfo, space, amount, camera, halfRange) {
    /*
     * Symmetrische, um 0 zentrierte Achsen-Range basierend auf der Daten-
     * Ausdehnung. Dadurch "atmet" der Raum nicht bei jedem Re-Render (kein
     * Auto-Fit-Zoom) und der Ursprung liegt in der Mitte.
     */
    var h =
        isNumber(halfRange) && halfRange > 0 ? halfRange : 1;

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
            aspectmode: "cube",
            camera: camera || {
                eye: {
                    x: 1.55,
                    y: 1.4,
                    z: 1.35
                }
            },
            xaxis: {
                title: t("nsw_axis_d1", "Dimension 1"),
                range: [-h, h],
                color: "#8fa4c9",
                gridcolor: "#263754",
                zerolinecolor: "#405477"
            },
            yaxis: {
                title: t("nsw_axis_d2", "Dimension 2"),
                range: [-h, h],
                color: "#8fa4c9",
                gridcolor: "#263754",
                zerolinecolor: "#405477"
            },
            zaxis: {
                title: t("nsw_axis_d3", "Dimension 3"),
                range: [-h, h],
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
        t("nsw_meta_map", "Abbildung:") +
        " <b>f : R" +
        layerInfo.inputDimension +
        " → R" +
        layerInfo.outputDimension +
        "</b><br>" +
        t("nsw_meta_input_shape", "Input-Shape:") + " " +
        shapeText(layerInfo.inputShape) +
        "<br>" +
        t("nsw_meta_output_shape", "Output-Shape:") + " " +
        shapeText(layerInfo.outputShape) +
        "<br>" +
        t("nsw_meta_sampled", "Abgetastete Raum-Punkte:") + " " +
        space.input.length +
        "<br>" +
        t(
            "nsw_meta_repr",
            "Darstellung: vollständiges Gitter, keine Trainingsdaten."
        );
}

function plotConfig() {
    return {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: [
            "toImage",
            "sendDataToCloud"
        ]
    };
}

/*
 * Echte Eingabedaten (global_x) als Punkte in den Raum legen — nur für
 * den ersten Layer, da dort die Rohtypen mit der Input-Dimension passen.
 */
function buildInputDataTraces(layerInfo, space, amount) {
    var out = [];

    if (!instance || !instance.options.showData) {
        return out;
    }

    if (instance.layerIndex !== 0) {
        return out;
    }

    var rows = getInputDataPoints();

    if (!rows || !rows.length) {
        return out;
    }

    if (rows[0].length !== layerInfo.inputDimension) {
        return out;
    }

    var tf = global.tf;
    var inputTensor = null;
    var outputTensor = null;
    var inputPts = rows.map(embed3);

    try {
        inputTensor = tf.tensor(
            rows,
            [rows.length, layerInfo.inputDimension]
        );

        outputTensor =
            typeof layerInfo.layer.call === "function"
                ? layerInfo.layer.call(inputTensor)
                : null;

        if (Array.isArray(outputTensor)) {
            outputTensor = outputTensor[0];
        }

        if (outputTensor) {
            var outPts = tensorRows(outputTensor).map(embed3);

            if (outPts.length === inputPts.length) {
                out.push(
                    addPointTrace(
                        inputPts,
                        "Eingabedaten x",
                        "#ffd27c",
                        0.95
                    )
                );

                if (amount >= 0.999) {
                    out.push(
                        addPointTrace(
                            outPts,
                            "f(x) an Eingabedaten",
                            "#7c9cff",
                            0.95
                        )
                    );
                }
            }
        }
    } catch (_) {} finally {
        if (inputTensor && inputTensor.dispose) {
            inputTensor.dispose();
        }

        if (outputTensor && outputTensor.dispose) {
            outputTensor.dispose();
        }
    }

    return out;
}

function tweenPlotXYZ(from, to, ms, onFrame) {
    if (!sameXYZLength(from, to)) {
        instance.displayXYZ = to;
        onFrame(to);
        return;
    }

    var token = ++instance.morphToken;
    var start = performance.now();
    var frames = 0;

    function frame(now) {
        if (!instance || token !== instance.morphToken) {
            return;
        }

        var t = clamp((now - start) / ms, 0, 1);
        var e = easeInOutCubic(t);
        var cur = lerpTraceXYZ(from, to, e);

        instance.displayXYZ = cur;
        onFrame(cur);

        /*
         * Sicherheitsdeckel: auch bei einem (ausnahmsweise) eingefrorenen
         * Zeitstempel darf die Loop nie endlos weiterlaufen.
         */
        if (t < 1 && ++frames < 240) {
            requestAnimationFrame(frame);
        }
    }

    requestAnimationFrame(frame);
}

/*
 * Plottet — aber clever:
 *  - Struktur-Wechsel oder Erstplot  -> komplettes Plotly.react.
 *  - Nur Daten geändert (morph)      -> sanftes Data-Morph via restyle
 *                                        (Kamera + Szene bleiben stehen).
 */
function applyPlot(traces, layout, morph) {
    /* Safety-Netz: endliche Koordinaten, bevor Plotly irgendwas sieht. */
    traces = sanitizeTraces(traces);

    var plot = instance.plot;

    if (!plot) {
        return false;
    }

    var sig = plotStructureSig(traces, instance.layerIndex);
    var chromeSig = layoutChromeSig(layout);
    var firstTime =
        !instance.hasPlotted ||
        instance.lastPlotSig !== sig ||
        instance.lastLayoutSig !== chromeSig;

    if (firstTime || !morph) {
        try {
            global.Plotly.react(plot, traces, layout, plotConfig());
        } catch (_) {
            return false;
        }

        instance.hasPlotted = true;
        instance.lastPlotSig = sig;
        instance.lastLayoutSig = chromeSig;
        instance.lastPlotXYZ = collectTraceXYZ(traces);
        instance.displayXYZ = collectTraceXYZ(traces);

        return true;
    }

    instance.lastLayoutSig = chromeSig;

    var toXYZ = collectTraceXYZ(traces);
    var fromXYZ = instance.displayXYZ || instance.lastPlotXYZ;

    if (layout && layout.scene && layout.scene.xaxis) {
        try {
            global.Plotly.relayout(plot, {
                scene: {
                    xaxis: { range: layout.scene.xaxis.range },
                    yaxis: { range: layout.scene.yaxis.range },
                    zaxis: { range: layout.scene.zaxis.range }
                }
            });
        } catch (_) {}
    }

    tweenPlotXYZ(fromXYZ, toXYZ, 380, function (cur) {
        try {
            global.Plotly.restyle(plot, {
                x: cur.x,
                y: cur.y,
                z: cur.z
            });
        } catch (_) {}
    });

    instance.lastPlotSig = sig;
    instance.lastPlotXYZ = toXYZ;

    return true;
}

var FLOW_COLORS = [
    "#ffd27c", "#7cf9d0", "#9fb5ff", "#ff9ec7",
    "#7c9cff", "#f9a07c", "#7cf9f0", "#d07cff"
];

/*
 * Reduziert eine Ebene auf eine 2D-Projektion (x, y, 0). Die z-Komponente
 * ist IMMER 0 — die Ebenen-Höhe (der Layer-Index) wird vom Caller als z
 * gesetzt. Damit ist z im 3D-Raum rein die Layer-Ebene (diskret) und x,y
 * sind die (reduzierten) Feature-Koordinaten.
 *
 *   dim <= 2 : native 2D (keine Reduktion, keine PCA-Warnung)
 *   dim >= 3 : PCA auf 2 Komponenten (Zufallsprojektion ab 129D) — das ist
 *              eine verlustbehaftete Projektion, also usedPca = true.
 *
 * usedPca signalisiert, dass die gezeigten Koordinaten NICHT die originalen
 * Dimensionen sind (sondern eine 2D-Projektion).
 */
function reduceTo3D(points, dim, mode) {
    var color4 = null;
    var xyz;
    var usedPca = false;

    /* Defensive: keine Punkte → leeres Ergebnis, kein Crash weiter unten. */
    if (!points || !points.length) {
        return { xyz: [], color4: null, usedPca: false };
    }

    /* Dimension robust machen (aus Space/Shape, könnte undef/NaN sein). */
    if (!isFinite(Number(dim)) || Number(dim) < 1) {
        dim = (points[0] && points[0].length) || 1;
    } else {
        dim = Number(dim);
    }

    if (dim <= 2) {
        /*
         * dim <= 2: keine dritte (Höhen-)Dimension vorhanden → c3 = 0.
         * Die Ebene ist dann flach (kein Falten im z-Raum möglich).
         */
        xyz = points.map(function (r) {
            return [
                Number(r[0]) || 0,
                Number(r[1]) || 0,
                0
            ];
        });
    } else if (mode === "first3") {
        /* Erste drei original-Dimensionen — deterministisch, keine PCA. */
        xyz = points.map(function (r) {
            return [
                Number(r[0]) || 0,
                Number(r[1]) || 0,
                Number(r[2]) || 0
            ];
        });
    } else {
        /*
         * dim >= 3: auf drei Komponenten reduzieren. c1,c2 = Raum (x,y),
         * c3 = Datenhöhe, mit der die Ebene im z-Raum "faltet".
         * >128D: Jacobi-PCA ist O(D^3) und pro Render zu teuer → feste
         * Zufallsprojektion (JL). Beides ist eine Projektion → usedPca.
         */
        var reduced = dim > 128
            ? randomProject(points, 3, 0x5eed1)
            : pcaReduce(points, 3);

        usedPca = true;

        if (mode === "4dc") {
            color4 = reduced.map(function (r) {
                return Number(r[2]) || 0;
            });
        }

        xyz = reduced.map(function (r) {
            return [
                Number(r[0]) || 0,
                Number(r[1]) || 0,
                Number(r[2]) || 0
            ];
        });
    }

    return { xyz: xyz, color4: color4, usedPca: usedPca };
}

/*
 * Führt die echten Eingabedaten (global_x, sonst Beispieldaten) durch alle
 * Layer und liefert die Zwischenräume als Ebenen:
 *   levels[0] = Eingabe, levels[k+1] = nach Layer k.
 */
function buildFlowLevels(amount) {
    var empty = {
        levels: [[]],
        dims: [0],
        isGrid: false,
        gridDim: 0,
        resolution: 0,
        synthetic: true
    };

    if (
        !instance ||
        !instance.inspection ||
        !Array.isArray(instance.inspection.layers) ||
        !instance.inspection.layers.length ||
        !global.tf
    ) {
        return empty;
    }

    var layers = instance.inspection.layers;
    var tf = global.tf;
    var first = layers[0];

    if (!first || !Array.isArray(first.inputShape)) {
        return empty;
    }

    /* Control-Safe: Element/Value darf null/NaN sein. */
    var rangeEl = instance.root.querySelector(".nsw-range");
    var resEl = instance.root.querySelector(".nsw-resolution");
    var range = Number(rangeEl && rangeEl.value) || 1;
    var resolution = Number(resEl && resEl.value) || 13;

    /*
     * Start = Probe im Eingabe-Raum: ≤3D ein Gitter (→ Fläche),
     * >3D deterministische Sample-Punkte. Dieses Gitter wird dann durch
     * alle Layer gewarpt — jede Ebene ist damit eine (verzerrte) Fläche.
     */
    var domain = createDomainPoints(first.inputShape, range, resolution);
    var current = domain.points;

    if (!current || !current.length) {
        return empty;
    }

    /*
     * Playhead (Abspielen): bei amount < 1 nur einen Teil der Eingabepunkte
     * zeigen — jeder Layer zeigt dann das Bild dieses Teils. So "fließt" die
     * Eingabe sichtbar durch das Netzwerk.
     */
    if (typeof amount === "number" && isFinite(amount) && amount < 1) {
        var nShow = Math.max(
            1,
            Math.ceil(current.length * Math.max(0, amount))
        );

        if (nShow < current.length) {
            current = current.slice(0, nShow);
        }
    }

    var levels = [current];
    var dims = [domain.flatDim];

    for (var k = 0; k < layers.length; k++) {
        var tIn = null;
        var tOut = null;

        var inNative =
            Array.isArray(layers[k].inputShape)
                ? layers[k].inputShape.slice(1)
                : [];

        if (!inNative.length || !current.length) {
            break;
        }

        /*
         * Reihenlänge muss zur nativen Eingabe-Dimension passen, sonst
         * würde der Layer-Call sinnlos fehlschlagen — dann abbrechen.
         */
        var flatNeed = inNative.reduce(function (a, b) { return a * b; }, 1);

        if (
            !Array.isArray(current[0]) ||
            current[0].length !== flatNeed
        ) {
            break;
        }

        try {
            tIn = tf.tensor(
                current.map(function (flat) {
                    return reshapeToShape(flat, inNative);
                }),
                [current.length].concat(inNative)
            );

            if (typeof layers[k].layer.call === "function") {
                tOut = layers[k].layer.call(tIn);
            }

            if (Array.isArray(tOut)) {
                tOut = tOut[0];
            }

            if (tOut) {
                var rows = tensorRowsFlatten(tOut);

                if (
                    Array.isArray(rows) &&
                    rows.length === current.length &&
                    Array.isArray(rows[0])
                ) {
                    current = rows;
                    levels.push(rows);
                    dims.push(rows[0].length || 0);
                }
            }
        } catch (_) {
            break;
        } finally {
            if (tIn && tIn.dispose) {
                tIn.dispose();
            }

            if (tOut && tOut.dispose) {
                tOut.dispose();
            }
        }
    }

    return {
        levels: levels,
        dims: dims,
        isGrid: domain.isGrid,
        gridDim: domain.gridDim,
        resolution: domain.resolution,
        synthetic: !domain.isGrid
    };
}

/*
 * Zeichnet die (verzerrte) Gitterfläche einer Ebene als Linien, damit ein
 * 2D-Layer nicht nur Punkte, sondern eine FLÄCHE zeigt. Die Punkte stehen
 * in Gitter-Reihenfolge (index = y*resolution + x).
 */
function levelSurfaceTraces(pts, gridDim, resolution, color) {
    var out = [];

    function line(idxFn, count) {
        var xs = [], ys = [], zs = [];

        for (var t = 0; t < count; t++) {
            var p = pts[idxFn(t)];
            xs.push(p[0]);
            ys.push(p[1]);
            zs.push(p[2]);
        }

        return {
            type: "scatter3d",
            mode: "lines",
            x: xs,
            y: ys,
            z: zs,
            line: { color: color, width: 2 },
            opacity: 0.5,
            hoverinfo: "skip",
            showlegend: false
        };
    }

    if (gridDim === 1) {
        out.push(line(function (t) { return t; }, pts.length));
    } else if (gridDim === 2 && pts.length === resolution * resolution) {
        for (var y = 0; y < resolution; y++) {
            out.push(
                line(
                    function (x) { return y * resolution + x; },
                    resolution
                )
            );
        }

        for (var x = 0; x < resolution; x++) {
            out.push(
                line(
                    function (y) { return y * resolution + x; },
                    resolution
                )
            );
        }
    }

    return out;
}

/*
 * GEFÜLLTE, halbtransparente 2D-Referenz-Oberfläche (Koordinaten-Ebene)
 * für einen Layer, der nach R2 abbildet.
 *
 * Wichtig: Eine 1D->2D-Abbildung erzeugt mathematisch nur eine KURVE in
 * einer Ebene — der Input hat nur eine Freiheitsgrade. Um trotzdem eine
 * sichtbare FLÄCHE zu zeigen, zeichnen wir die 2D-Ebene des Outputs als
 * gefüllte, durchscheinende Oberfläche; die eigentliche Kurve (das Bild des
 * 1D-Inputs) liegt als Punkte darauf. Damit liest sich der mittlere Layer
 * als "Fläche mit einer Kurve drin" statt als "nur eine Linie".
 *
 * Die Fläche bekommt eine winzige Z-Rampe (0.0005 pro Zelle), damit sie in
 * Plotly zuverlässig gerendert wird (perfekt flache Flächen können je nach
 * Blickwinkel verschwinden) — die Rampe ist visuell nicht wahrnehmbar.
 */
function referenceSurface(levelZ, size, divisions, color) {
    if (!isFinite(levelZ) || !isFinite(size) || size <= 0) {
        return [];
    }

    /*
     * Absichtlich GROBES Gitter (wenige Zellen): Ein feines 10×10-Netz
     * zeigt seine Triangulierung als "Spinnennetz". Mit wenigen Zellen ist
     * die Fläche eine saubere, durchscheinende Platte ohne Mesh-Linien.
     */
    divisions = Math.max(1, Math.min(4, Math.floor(divisions) || 2));
    var half = size / 2;
    var n = divisions + 1;
    var xs = [];
    var zgrid = [];

    for (var i = 0; i < n; i++) {
        xs.push(-half + (size * i) / divisions);
    }

    for (var r = 0; r < n; r++) {
        var row = [];
        for (var c = 0; c < n; c++) {
            row.push(levelZ + (r + c) * 0.0005);
        }
        zgrid.push(row);
    }

    return [
        {
            type: "surface",
            x: xs,
            y: xs,
            z: zgrid,
            opacity: 0.14,
            showscale: false,
            hoverinfo: "skip",
            showsurface: true,
            lighting: { ambient: 1, diffuse: 0, specular: 0, roughness: 1 },
            colorscale: [[0, color], [1, color]]
        }
    ];
}

/*
 * Durchgängige, halbtransparente Mesh-Fläche (mesh3d) durch ein VERFORMTES
 * res×res-Gitter. Die Vertices sind die echten (gewarpten) Punkte der Ebene;
 * c3 (Datenhöhe) lässt die Fläche im z-Raum falten — statt einer generischen
 * flachen Platte. Nur für 2D-Grid-Ebenen (genau res×res Punkte in Gitter-
 * Reihenfolge). Bei jedem Guardrail-Fehler: [] (keine Fläche, kein Crash).
 */
function buildMeshSurfaceTraces(pts, resolution, color) {
    var out = [];
    var res = Math.floor(Number(resolution));

    /* G1: Auflösung muss ein gültiges Integer >= 2 sein. */
    if (!isFinite(res) || res < 2 || res > 40) {
        return out;
    }

    /* G2: exakt res×res Punkte, sonst kein reguläres Gitter. */
    var expected = res * res;
    if (!pts || !Array.isArray(pts) || pts.length !== expected) {
        return out;
    }

    /* G3: alle Vertex-Koordinaten endlich (kein NaN/Inf in die Mesh). */
    for (var p = 0; p < pts.length; p++) {
        var pt = pts[p];
        if (
            !Array.isArray(pt) ||
            pt.length < 3 ||
            !isFinite(Number(pt[0])) ||
            !isFinite(Number(pt[1])) ||
            !isFinite(Number(pt[2]))
        ) {
            return out;
        }
    }

    var xs = [], ys = [], zs = [], colors = [];
    for (var p2 = 0; p2 < pts.length; p2++) {
        xs.push(Number(pts[p2][0]));
        ys.push(Number(pts[p2][1]));
        zs.push(Number(pts[p2][2]));
        colors.push(color);
    }

    var i3 = [], j3 = [], k3 = [];
    var last = expected - 1;

    function tri(a, b, c) {
        /* G4: Index-Overflow-Check pro Eckpunkt. */
        if (
            a < 0 || a > last ||
            b < 0 || b > last ||
            c < 0 || c > last
        ) {
            return;
        }
        i3.push(a);
        j3.push(b);
        k3.push(c);
    }

    for (var r = 0; r < res - 1; r++) {
        for (var c = 0; c < res - 1; c++) {
            var a = r * res + c;
            var b = r * res + (c + 1);
            var d = (r + 1) * res + c;
            var e = (r + 1) * res + (c + 1);
            tri(a, b, d);
            tri(b, e, d);
        }
    }

    if (!i3.length) {
        return out;
    }

    out.push({
        type: "mesh3d",
        x: xs,
        y: ys,
        z: zs,
        i: i3,
        j: j3,
        k: k3,
        color: colors,
        opacity: 0.3,
        flatshading: true,
        showscale: false,
        showsurface: true,
        hoverinfo: "skip",
        showlegend: false
    });

    return out;
}

/*
 * Durchgehende VERBINDUNGSFÄDEN: jeder Eingabepunkt wird zu EINER
 * ununterbrochenen Linie, die ALLE Ebenen durchläuft (Index i in jeder
 * Ebene). Das ist das "durchgängig" im Gegensatz zu je-Ebene-Stücken.
 *
 * WICHTIG: jeder Faden ist ein EIGENER Trace (kein NaN-Trenner), weil
 * sanitizeTraces() NaN→0 umwandelt — ein gemeinsamer Trace mit NaN-Trennern
 * würde daher Sprunglinien durch den Ursprung zeichnen. Pro Faden ein Trace
 * ist sauber und bleibt durchgängig. Thread-Anzahl wird auf maxThreads
 * gedeckelt (ein 2D-Grid hätte sonst res² Fäden).
 */
function buildThreadTraces(placed, maxThreads, color, width) {
    var out = [];

    /* G5: mind. 2 Ebenen und konsistente Punktzahl (Minimum über alle). */
    if (!placed || !Array.isArray(placed) || placed.length < 2) {
        return out;
    }

    var nPoints = Infinity;
    for (var k = 0; k < placed.length; k++) {
        var n = placed[k] && placed[k].xyz ? placed[k].xyz.length : 0;
        if (n < nPoints) {
            nPoints = n;
        }
    }
    if (!isFinite(nPoints) || nPoints < 1) {
        return out;
    }

    var maxT = Math.max(1, Math.floor(Number(maxThreads)) || 16);
    var step = Math.max(1, Math.ceil(nPoints / maxT));
    var levels = placed.length;

    for (var i = 0; i < nPoints; i += step) {
        var xs = [], ys = [], zs = [], ok = true;

        for (var k2 = 0; k2 < levels; k2++) {
            var pt = placed[k2].xyz[i];
            if (
                !pt ||
                !isFinite(Number(pt[0])) ||
                !isFinite(Number(pt[1])) ||
                !isFinite(Number(pt[2]))
            ) {
                /* G6: defekter Punkt → diesen Faden überspringen. */
                ok = false;
                break;
            }
            xs.push(Number(pt[0]));
            ys.push(Number(pt[1]));
            zs.push(Number(pt[2]));
        }

        if (!ok || xs.length < 2) {
            continue;
        }

        out.push({
            type: "scatter3d",
            mode: "lines",
            name: "",
            x: xs,
            y: ys,
            z: zs,
            line: {
                color: color,
                width: width
            },
            showlegend: false,
            hoverinfo: "skip"
        });
    }

    return out;
}

function buildFlowView(amount) {
    var flow = buildFlowLevels(amount);

    if (
        !flow ||
        !Array.isArray(flow.levels) ||
        !flow.levels.length
    ) {
        return { traces: [], layout: {}, levels: 0, meta: flow || {} };
    }

    var mode =
        instance.options && instance.options.dimReduction
            ? instance.options.dimReduction
            : "pca";

    /* Verbindungen an/aus (Toolbar-Toggle). Default: an. */
    var showConnections = !(
        instance.options && instance.options.showConnections === false
    );

    var R = 1;
    var HEIGHT = 0.32;
    var layers =
        (instance.inspection && instance.inspection.layers) || [];

    var numLevels = flow.levels.length;
    var placed = [];
    var anyPca = false;

    /*
     * Jede Ebene: auf 3 Komponenten reduzieren (c1,c2 = Raum x,y; c3 =
     * Datenhöhe), zentrieren, auf Einheit skalieren und bei z = Layer-Index
     * + (zentrierte, normierte) Datenhöhe anlegen. c3 lässt die Ebene im
     * z-Raum "falten" (z. B. durch ReLU/ nicht-lineare Transformationen).
     */
    for (var k = 0; k < numLevels; k++) {
        var red = reduceTo3D(
            flow.levels[k],
            flow.dims[k],
            mode
        );

        anyPca = anyPca || !!red.usedPca;
        var xyz = red.xyz || [];

        /* G7: leere/defekte Ebene → leere Ebene, kein Crash. */
        if (!xyz.length) {
            placed.push({
                xyz: [],
                color4: red.color4,
                dim: flow.dims[k],
                levelZ: k,
                pca: !!red.usedPca
            });
            continue;
        }

        var m1 = 0, m2 = 0, m3 = 0;
        for (var p = 0; p < xyz.length; p++) {
            m1 += xyz[p][0];
            m2 += xyz[p][1];
            m3 += xyz[p][2];
        }
        m1 /= xyz.length;
        m2 /= xyz.length;
        m3 /= xyz.length;

        var sp1 = 0, sp2 = 0, sp3 = 0;
        for (var p2 = 0; p2 < xyz.length; p2++) {
            var a1 = Math.abs(xyz[p2][0] - m1);
            var a2 = Math.abs(xyz[p2][1] - m2);
            var a3 = Math.abs(xyz[p2][2] - m3);
            if (a1 > sp1) { sp1 = a1; }
            if (a2 > sp2) { sp2 = a2; }
            if (a3 > sp3) { sp3 = a3; }
        }

        /* G8: Skalierung nur bei endlichem, positivem Spread (sonst 1). */
        var spread = Math.max(sp1, sp2);
        var s = (isFinite(spread) && spread > 1e-9) ? (R / spread) : 1;
        var hn = (isFinite(sp3) && sp3 > 1e-9) ? (HEIGHT / sp3) : 0;
        var levelZ = k;

        var norm = xyz.map(function (pt) {
            var nx = (pt[0] - m1) * s;
            var ny = (pt[1] - m2) * s;
            var nz = levelZ + (pt[2] - m3) * hn;
            return [
                isFinite(nx) ? nx : 0,
                isFinite(ny) ? ny : 0,
                isFinite(nz) ? nz : levelZ
            ];
        });

        placed.push({
            xyz: norm,
            color4: red.color4,
            dim: flow.dims[k],
            levelZ: levelZ,
            pca: !!red.usedPca,
            cx: m1,
            cy: m2,
            s: s
        });
    }

    var traces = [];
    var maxZ = Math.max(0, numLevels - 1);
    var annotations = [];

    var isGrid2D = flow.isGrid && flow.gridDim === 2;
    var isSynthetic = !flow.isGrid;
    var res = Math.floor(Number(flow.resolution)) || 0;
    var res2 = res * res;

    function labelFor(idx) {
        var tInput = t("nsw_input", "Eingabe");
        var tGrid = t("nsw_grid", "Gitter");
        var tExample = t("nsw_example", "(Beispiel)");
        var tLayer = t("nsw_layer", "Layer");

        return idx === 0
            ? tInput +
              (flow.isGrid ? " · " + tGrid : " " + tExample) +
              " · R" + flow.dims[0]
            : tLayer + " " + (idx - 1) +
              " · " + (layers[idx - 1] ? layers[idx - 1].name : idx - 1) +
              " · R" + flow.dims[idx];
    }

    /* G9: Mesh nur, wenn die Ebene ein echtes 2D-Gitter (res×res) UND eine
     * Ausgabe mit >= 2 Raum-Dimensionen ist. Ein 1D-Output kollabiert zu
     * einer Linie → dort wäre eine Mesh degeneriert (Fäden zeigen sie). */
    function hasMeshAt(idx) {
        return (
            isGrid2D &&
            flow.dims[idx] >= 2 &&
            placed[idx].xyz.length === res2
        );
    }

    /* 1) Referenzebenen (Hintergrund): 2D-Abbildung ohne volle Mesh. */
    for (var kr = 0; kr < numLevels; kr++) {
        if (
            kr >= 1 &&
            flow.dims[kr] === 2 &&
            placed[kr].xyz.length &&
            !hasMeshAt(kr)
        ) {
            traces.push.apply(
                traces,
                referenceSurface(
                    placed[kr].levelZ,
                    2.8,
                    10,
                    "rgba(150,172,214,1)"
                )
            );
        }
    }

    /* 2) Durchgehende Verbindungsfäden (jeder Punkt → alle Ebenen). */
    if (showConnections && numLevels >= 2) {
        traces.push.apply(
            traces,
            buildThreadTraces(
                placed,
                24,
                "rgba(205,220,255,.24)",
                1.5
            )
        );
    }

    /* 3) Flächen / Punkte (Vordergrund). */
    for (var k2 = 0; k2 < numLevels; k2++) {
        var color = FLOW_COLORS[k2 % FLOW_COLORS.length];

        if (hasMeshAt(k2)) {
            /* 2D-Grid-Ebene mit >= 2D-Ausgabe → transparente Mesh-Fläche. */
            traces.push.apply(
                traces,
                buildMeshSurfaceTraces(
                    placed[k2].xyz,
                    res,
                    color
                )
            );
        } else if (isSynthetic) {
            /* Synthetisch (hohe D, kein Gitter) → Punkte + Fäden. */
            if (placed[k2].xyz.length) {
                traces.push(
                    addPointTrace(
                        placed[k2].xyz,
                        labelFor(k2),
                        color,
                        0.9
                    )
                );
            }
        }
        /* 1D-Grid-Ebene: keine Punkte — die Fäden zeigen die Linie. */

        annotations.push({
            x: 1.75,
            y: 0,
            z: placed[k2].levelZ,
            text: "<b>" + labelFor(k2) + "</b>",
            showarrow: false,
            xanchor: "left",
            font: { color: color, size: 13 }
        });
    }

    var layout = {
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        margin: { l: 0, r: 0, t: 62, b: 0 },
        title: {
            text:
                "<b>" + t("nsw_flow_title", "Netzwerk-Flow") + "</b> · " +
                fmt("nsw_layers", "%d Layer", [layers.length]) + " · " +
                (flow.isGrid
                    ? fmt("nsw_grid_points", "%d Gitterpunkte / Fläche", [flow.levels[0].length])
                    : fmt("nsw_points", "%d Punkte", [flow.levels[0].length])),
            font: { color: "#e8eefc", size: 17 }
        },
        legend: { font: { color: "#dbe6ff" } },
        scene: {
            bgcolor: "#08101f",
            aspectmode: "cube",
            camera: { eye: { x: 2.3, y: -1.3, z: 0.7 } },
            xaxis: {
                title: t("nsw_axis_x", "x"),
                range: [-1.7, 1.7],
                color: "#8fa4c9",
                gridcolor: "#263754",
                zerolinecolor: "#405477"
            },
            yaxis: {
                title: t("nsw_axis_y", "y"),
                range: [-1.7, 1.7],
                color: "#8fa4c9",
                gridcolor: "#263754",
                zerolinecolor: "#405477"
            },
            zaxis: {
                title: t("nsw_axis_layer", "Layer"),
                range: [-0.45, maxZ + 0.45],
                tickvals: (function () {
                    var tv = [];
                    for (var q = 0; q <= maxZ; q++) {
                        tv.push(q);
                    }
                    return tv;
                })(),
                color: "#8fa4c9",
                gridcolor: "#263754",
                zerolinecolor: "#405477"
            }
        },
        annotations: annotations,
        transition: { duration: 650, easing: "cubic-in-out" }
    };

    return {
        traces: traces,
        layout: layout,
        levels: numLevels,
        meta: flow,
        pca: anyPca
    };
}

function flowNeedsPca() {
    if (!instance || !instance.inspection) {
        return false;
    }

    var mode =
        (instance.options && instance.options.dimReduction) || "pca";

    /*
     * Nur die PCA-Projektions-Modi verlieren die originalen Dimensionen.
     * "first3" zeigt echte (Teil-)Dimensionen und braucht keine Warnung.
     */
    var isProjection = mode === "pca" || mode === "4dc";
    return isProjection && (instance.inspection.maxDim || 0) > 2;
}

/*
 * PCA-Gate-UI: "ask" (Fragen), "declined" (abgelehnt), "warn" (gewarnt,
 * Plot sichtbar) oder "none". Der Plot wird nur bei "warn"/"none" gezeigt.
 */
function setPcaAsk(state) {
    if (!instance || !instance.root) {
        return;
    }

    var root = instance.root;
    var ask = root.querySelector(".nsw-pca-ask");
    var declined = root.querySelector(".nsw-pca-declined");
    var warn = root.querySelector(".nsw-pca-warn");
    var plot = root.querySelector(".nsw-plot");

    if (ask) {
        ask.style.display = state === "ask" ? "block" : "none";
    }

    if (declined) {
        declined.style.display = state === "declined" ? "block" : "none";
    }

    if (warn) {
        warn.style.display = state === "warn" ? "block" : "none";
    }

    if (plot) {
        plot.style.display =
            (state === "ask" || state === "declined") ? "none" : "block";
    }
}

function renderFlow(morph, amount) {
    if (!instance || !instance.inspection.ok) {
        return false;
    }

    /*
     * PCA-Gate: Braucht das Modell eine Projektion (dim>2 mit PCA), fragen
     * wir BEVOR wir rendern — die Koordinaten wären dann nicht die
     * originalen Dimensionen. Einmal pro Modell entschieden.
     */
    if (flowNeedsPca()) {
        var choice = instance.pcaChoice || "pending";

        if (choice === "pending") {
            if (!instance.pcaAskShown) {
                setPcaAsk("ask");
                instance.pcaAskShown = true;
            }

            return false;
        }

        if (choice === "no") {
            if (!instance.pcaDeclinedShown) {
                setPcaAsk("declined");
                instance.pcaDeclinedShown = true;
            }

            return false;
        }

        /* choice === "yes": Warnung zeigen, dann normal rendern. */
        setPcaAsk("warn");
    } else {
        setPcaAsk("none");
        instance.pcaChoice = "pending";
        instance.pcaAskShown = false;
        instance.pcaDeclinedShown = false;
    }

    var amt =
        typeof amount === "number" && isFinite(amount)
            ? Math.max(0, Math.min(1, amount))
            : 1;

    var view = buildFlowView(amt);

    applyPlot(view.traces, view.layout, !!morph);

    var status = instance.root.querySelector(".nsw-status");

    if (status) {
        status.textContent =
            fmt("nsw_levels", "%d Ebenen", [view.levels]) + " · " +
            fmt("nsw_points", "%d Punkte", [view.meta.levels[0].length]) +
            " · " + t("nsw_flow_title", "Netzwerk-Flow");
    }

    return true;
}

function flowFingerprint(inspection) {
    var parts = ["flow:" + inspection.layers.length];

    for (var i = 0; i < inspection.layers.length; i++) {
        parts.push(
            layerFingerprint(inspection.layers[i].layer)
        );
    }

    return parts.join("|");
}

function renderCurrent(amount, animate, morph) {
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
        layerInfo.inputShape,
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
        /*
         * Einzelner Fehlschlag (z. B. kurzzeitig disposed Kernel während
         * der App das Modell neu baut) reißt den Visualizer NICHT mehr
         * ab — sonst flickert er bei jedem Model-Update. Erst nach
         * anhaltendem Fehlschlag aufgeben.
         */
        instance.failStreak =
            (instance.failStreak || 0) + 1;

        logDebug(
            "Layer wird übersprungen (Fehler " +
            instance.failStreak + "x), weil er numerisch nicht " +
            "ausgewertet werden konnte:",
            layerInfo.name
        );

        if (instance.failStreak >= 8) {
            removeVisualizer(
                "Layer " + layerInfo.name +
                " konnte nicht numerisch ausgewertet werden."
            );
        }

        return false;
    }

    instance.failStreak = 0;
    instance.space = space;

    var traces = createTraces(
        space,
        amount,
        instance.options.dimReduction
    );
    traces = traces.concat(
        buildInputDataTraces(layerInfo, space, amount)
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

    /*
     * Datenbasierte, symmetrische Ansicht um 0. Gedämpft geglättet,
     * damit der Raum nicht bei jedem Update springt; manuell über die
     * Ansicht-Skala anpassbar.
     */
    var extent = maxAbsCoord(space.output);

    if (instance.options.showData && instance.layerIndex === 0) {
        var dataRows = getInputDataPoints();

        if (dataRows) {
            extent = Math.max(extent, maxAbsCoord(dataRows));
        }
    }

    var viewScale =
        Number(
            instance.root.querySelector(".nsw-viewscale").value
        ) || 1;

    var targetHalf = Math.max(0.5, extent * 1.15);

    instance.autoHalf =
        isNumber(instance.autoHalf) && instance.autoHalf > 0
            ? lerp(instance.autoHalf, targetHalf, 0.3)
            : targetHalf;

    var halfRange = instance.autoHalf * viewScale;

    var layout = createLayout(
        layerInfo,
        space,
        amount,
        currentCamera,
        halfRange
    );

    applyPlot(traces, layout, !!morph);

    updateMeta(layerInfo, space);

    var status = instance.root.querySelector(
        ".nsw-status"
    );

    status.textContent = fmt(
        "nsw_status_check",
        "%d kompatible Layer · Prüfung alle %d ms",
        [instance.inspection.layers.length, instance.options.pollInterval]
    );

    logDebug(
        "Plot aktualisiert:",
        layerInfo.name
    );

    return true;
}

function renderLayerImmediately() {
    instance.animationToken++;

    /*
     * Es gibt nur noch EINEN Blick: der vollständige Netzwerk-Flow —
     * alle Layer übereinander, immer. Der "Layer"- und "Modus"-Selector
     * sind entfernt; renderFlow() wird immer verwendet.
     */
    var ok = renderFlow(true);

    if (ok) {
        instance.lastFingerprint =
            flowFingerprint(instance.inspection);

        instance.hasRendered = true;
        instance.lastRenderedVisible = isPlotVisible();
    }

    return ok;
}

function animateCurrentLayer() {
    if (!instance || !instance.inspection.ok) {
        return;
    }

    var token = ++instance.animationToken;
    /* Play-Animation läuft im React-Pfad — laufendes Data-Morph stoppen. */
    instance.morphToken++;
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

        renderFlow(true, amount);

        if (amount < 1) {
            requestAnimationFrame(frame);
        }
    }

    renderFlow(false, 0);
    requestAnimationFrame(frame);
}

function updateLayerSelect() {
    var select = instance.root.querySelector(
        ".nsw-layer"
    );

    /* Der Layer-Selector ist entfernt — nichts mehr zu füllen. */
    if (!select) {
        return;
    }

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

/*
 * Dim-Reduktion ist nur relevant, wenn mindestens ein Layer mehr als 3
 * Feature-Dimensionen hat. Bei kleinen Modellen wird der Regler
 * automatisch deaktiviert (graue out), damit nichts verwirrt.
 */
function syncDimReductionControl() {
    if (!instance || !instance.root) {
        return;
    }

    var sel = instance.root.querySelector(".nsw-dimred");

    if (!sel) {
        return;
    }

    var needs = false;

    for (var i = 0; i < instance.inspection.layers.length; i++) {
        var L = instance.inspection.layers[i];

        if (
            (L.inputDimension || 0) > 3 ||
            (L.outputDimension || 0) > 3
        ) {
            needs = true;
            break;
        }
    }

    sel.disabled = !needs;
    sel.style.opacity = needs ? "1" : "0.4";
    sel.title = needs
        ? ""
        : t(
            "nsw_dimred_tooltip",
            "Nur nötig, wenn ein Layer mehr als 3 Dimensionen hat."
        );
}

function triggerTranslations() {
    /*
     * Das Panel wird zur Laufzeit gebaut, also muss die Translation selbst
     * angestoßen werden (update_translations() scannt TRANSLATEME_-Klassen).
     */
    try {
        if (
            global.update_translations &&
            typeof global.update_translations === "function"
        ) {
            global.update_translations();
        }
    } catch (_) {}
}

/*
 * Übersetzt einen Key über das globale Translation-System (language[lang]).
 * Fällt auf den mitgegebenen Fallback (oder den Key selbst) zurück.
 */
function t(key, fallback) {
    try {
        if (
            global.language &&
            global.lang &&
            global.language[global.lang] &&
            global.language[global.lang][key]
        ) {
            return global.language[global.lang][key];
        }
    } catch (_) {}

    return fallback != null ? fallback : key;
}

/* Wie t(), aber ersetzt %d-Platzhalter nacheinander durch nums. */
function fmt(key, fallback, nums) {
    var s = t(key, fallback);
    var i = 0;
    return String(s).replace(/%d/g, function () {
        return i < nums.length ? String(nums[i++]) : "%d";
    });
}

function bindEvents() {
    var root = instance.root;

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

    root.querySelector(".nsw-dimred").onchange =
        function (event) {
            instance.options.dimReduction = event.target.value;
            instance.pcaChoice = "pending";
            instance.pcaAskShown = false;
            instance.pcaDeclinedShown = false;
            renderLayerImmediately();
        };

    root.querySelector(".nsw-refresh").onclick =
        function () {
            checkNow(true);
        };

    var conn = root.querySelector(".nsw-connections");

    if (conn) {
        conn.onchange = function (event) {
            instance.options.showConnections = !!event.target.checked;
            renderLayerImmediately();
        };
    }

    var yes = root.querySelector(".nsw-pca-yes");

    if (yes) {
        yes.onclick = function () {
            instance.pcaChoice = "yes";
            instance.pcaAskShown = false;
            renderLayerImmediately();
        };
    }

    var no = root.querySelector(".nsw-pca-no");

    if (no) {
        no.onclick = function () {
            instance.pcaChoice = "no";
            instance.pcaAskShown = false;
            renderLayerImmediately();
        };
    }

    var yesAgain = root.querySelector(".nsw-pca-yes-again");

    if (yesAgain) {
        yesAgain.onclick = function () {
            instance.pcaChoice = "yes";
            instance.pcaDeclinedShown = false;
            renderLayerImmediately();
        };
    }

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

/*
 * Der Tab ist IMMER sichtbar — unabhängig davon, ob das aktuelle Modell
 * plottbar ist. Im Panel wird entweder der Plot oder eine Erklärung
 * angezeigt. Wir zeigen ihn genau einmal (Flag), damit update_translations()
 * nicht bei jedem Poll neu läuft. Falls beim ersten Aufruf das DOM noch
 * nicht da ist, probiert der nächste Poll es erneut.
 */
var tabShownOk = false;

function setTabVisible() {
    if (tabShownOk) {
        return;
    }

    try {
        if (typeof global.show_tab_label === "function") {
            global.show_tab_label("space_warps_tab_label");
            tabShownOk = true;
        }
    } catch (_) {}
}

function getContainer() {
    var target = resolveTarget(instanceOptions.target);

    if (target) {
        return target;
    }

    var c = document.createElement("div");
    document.body.appendChild(c);
    return c;
}

/*
 * Zeigt eine kurze Erklärung im Panel (z. B. "Modell nicht plottbar"),
 * wenn kein Plot erzeugt werden kann.
 */
function showStatusMessage(text) {
    var container = getContainer();

    if (!container) {
        return;
    }

    /*
     * Gleiches Text-Meldung bereits da? Dann nichts neu bauen (sonst
     * churnen wir bei jedem Poll das DOM).
     */
    var existing = container.querySelector(".nsw-status-body");

    if (existing && existing.textContent === text) {
        return;
    }

    container.innerHTML = "";
    injectStyles();

    var root = document.createElement("section");
    root.className = "nsw-root";

    var head = document.createElement("div");
    head.className = "nsw-header";

    var title = document.createElement("div");
    title.className = "nsw-title";
    title.textContent = "Neural Space Warps";
    head.appendChild(title);

    var body = document.createElement("div");
    body.className = "nsw-status-body";
    body.textContent = text;
    root.appendChild(head);
    root.appendChild(body);

    container.appendChild(root);
}

/*
 * Ist der Plot gerade sichtbar? (Tab aktiv + nicht display:none.)
 * Wenn nicht, rechnen wir nichts — der letzte Stand bleibt im Div.
 */
function isPlotVisible() {
    if (!instance || !instance.plot) {
        return false;
    }

    try {
        var el = instance.plot;
        if (el.offsetWidth <= 0 || el.offsetHeight <= 0) {
            return false;
        }

        if (
            global.getComputedStyle &&
            global.getComputedStyle(el).display === "none"
        ) {
            return false;
        }

        return true;
    } catch (_) {
        return false;
    }
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

    /*
     * Tab bleibt sichtbar — das Panel zeigt danach eine Erklärung.
     */

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
        morphToken: 0,
        lastFingerprint: null,
        hasRendered: false,
        hasPlotted: false,
        lastPlotSig: null,
        lastLayoutSig: null,
        lastPlotXYZ: null,
        displayXYZ: null,
        autoHalf: 0,
        lastRenderedVisible: false,
        userCamAt: 0,
        pcaChoice: "pending",
        pcaAskShown: false,
        pcaDeclinedShown: false,
        lastLang: null
    };

    global[INSTANCE_KEY] = {
        api: api,
        instance: instance
    };

    instance.plot = root.querySelector(".nsw-plot");

    updateLayerSelect();
    syncDimReductionControl();
    bindEvents();
    triggerTranslations();

    /*
     * Immer einen Erst-Paint anlegen — auch, falls der Tab gerade
     * inaktiv ist. Sobald der Plot sichtbar wird, korrigiert der Poll
     * das Layout (re-Render), damit nichts "leer" bleibt.
     */
    renderLayerImmediately();

    lastVisibleReason = "";
    setTabVisible();

    logInfo(
        "SpaceWarps aktiv: " +
        inspection.layers.length +
        " kompatible Layer. Tab 'Space Warps' eingeblendet."
    );

    /*
     * Struktur-Details einmalig beim Mount (debug) — nicht bei jedem Poll.
     */
    logDebug(
        "Model-Struktur erkannt (" +
        inspection.layers.length + " Layer):"
    );

    for (var d = 0; d < inspection.layers.length; d++) {
        var li = inspection.layers[d];
        logDebug(
            "  Layer " + d + " " + li.name +
            " " + shapeText(li.inputShape) +
            "->" + shapeText(li.outputShape) +
            " (" + li.inputDimension + "D -> " +
            li.outputDimension + "D)"
        );
    }
}

var lastVisibleReason = "";

function reportReason(reason) {
    if (reason === lastVisibleReason) {
        return;
    }

    lastVisibleReason = reason;
    logInfo("SpaceWarps verborgen: " + reason);
}

function checkNow(force) {
    /*
     * Tab immer sicherstellen — rettet auch den Fall, dass start() vor dem
     * Tab-DOM lief. Läuft dank Flag nur einmal wirklich.
     */
    setTabVisible();

    var model = getCurrentModel(
        instanceOptions
    );

    if (!model) {
        reportReason(t("nsw_no_model", "Kein Modell vorhanden"));

        if (instance) {
            removeVisualizer(
                t("nsw_model_missing", "Modell fehlt.")
            );
        }

        showStatusMessage(
            t(
                "nsw_no_model_msg",
                "Noch kein Modell vorhanden. Baue oder lade ein Modell, um die Layer-Räume zu sehen."
            )
        );

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

        showStatusMessage(
            t(
                "nsw_not_plottable",
                "Aktuelles Modell ist hier nicht plottbar: "
            ) +
            inspection.reason
        );

        return false;
    }

    if (!instance) {
        /*
         * Erst jetzt wird überhaupt ein Singleton erzeugt.
         */
        mountVisualizer(inspection);
        return true;
    }

    /*
     * Nur bei echter Architektur-Änderung (Layer-Anzahl/-Namen/-Shapes)
     * neu aufbauen. Wenn die App dasselbe Modell-Objekt neu anlegt oder
     * nur Gewichtungs-Tensoren ersetzt (selbe Architektur), bauen wir NICHT
     * um — sonst flickert der Plot bei jedem Model-Update/Scroll.
     */
    var changed =
        instance.inspection.signature !==
        inspection.signature;

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
        /*
         * Rechnen nur, wenn der Plot wirklich sichtbar und verlegt ist.
         * Unsichtbar → letzter Stand bleibt im Div, nichts wird berechnet.
         * `force` (Tab-Klick, Refresh-Button) zwingt nur den Fingerprint-
         * Check, nicht das Rendern in ein 0-Size-Div.
         */
        if (isPlotVisible()) {
            var shownLayer = inspection.layers[instance.layerIndex];
            var isFlow = instance.options.viewMode === "flow";
            var fp = isFlow
                ? flowFingerprint(inspection)
                : layerFingerprint(
                    shownLayer ? shownLayer.layer : null
                );

            /*
             * Gewichte kurzzeitig weg (App baut Modell neu / disposed
             * Kernel)? Dann jetzt NICHT rendern — der Versuch würde
             * fehlschlagen und den Visualizer reißen. Nacher Poll
             * erneut prüfen, wenn die Gewichte wieder da sind.
             */
            if (fp.indexOf("fp-err") !== -1) {
                return true;
            }

            var userRotating =
                instance.userCamAt &&
                (performance.now() - instance.userCamAt) < 1200;

            /*
             * War der letzte Render im Verborgenen (Tab inaktiv)? Dann
             * jetzt neu zeichnen, damit das Layout korrekt ist — das ist
             * der robuste "endlich sichtbar" -Fix.
             */
            var needsLayoutFix =
                instance.hasRendered &&
                instance.lastRenderedVisible === false;

            /*
             * Sprachwechsel? Das DOM (Toolbar/Dialog) übersetzt
             * update_translations() selbst; der Plotly-Plot (Titel, Achsen,
             * Layer-Labels, Status) muss dafür neu aufgebaut werden.
             */
            var curLang = (function () {
                try {
                    return (global && global.lang) || "";
                } catch (_) {
                    return "";
                }
            })();

            var langChanged =
                instance.hasRendered &&
                instance.lastLang != null &&
                curLang !== instance.lastLang;

            var needRender =
                !instance.hasRendered ||
                !!force ||
                needsLayoutFix ||
                langChanged ||
                fp !== instance.lastFingerprint;

            if (
                needRender &&
                (!userRotating || !instance.hasRendered || needsLayoutFix)
            ) {
                logDebug(
                    (needsLayoutFix ? "Layout-Fix (jetzt sichtbar), " :
                     langChanged ? "Sprache geändert, " :
                     instance.hasRendered ? "Gewichte geändert, " : "Erster ") +
                    "berechne Raum neu:" +
                    (shownLayer ? shownLayer.name : "")
                );

                renderLayerImmediately();
                instance.lastLang = curLang;
            }
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
    autoCheck: true,
    showData: false,
    viewMode: "flow",
    dimReduction: "pca",
    showConnections: true
};

function start(options) {
    options = options || {};

    instanceOptions = Object.assign(
        {},
        instanceOptions,
        options
    );

    /*
     * Der Tab ist immer da — sofort nach dem Start, unabhängig vom Modell.
     */
    setTabVisible();

    if (!hasTF()) {
        logDebug(
            "Start abgebrochen: TensorFlow.js fehlt."
        );

        showStatusMessage(
            "TensorFlow.js ist nicht geladen — der Visualizer kann " +
            "keine Layer auswerten."
        );

        return api;
    }

    if (!hasPlotly()) {
        logDebug(
            "Start abgebrochen: Plotly fehlt."
        );

        showStatusMessage(
            "Plotly ist nicht geladen — der 3D-Plot kann nicht gezeigt werden."
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
                function () {
                    checkNow(false);
                },
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
    checkNow(true);

    /*
     * Tab gerade erst angeklickt? Dann ist das Panel im selben Tick oft
     * noch nicht verlegt (jQuery UI zeigt es nach dem inline-Handler).
     * Ein kurzer Nachlauf holt den ersten Render, sobald es layout-gegriffen hat.
     */
    if (instance && instance.plot && !isPlotVisible()) {
        setTimeout(function () {
            if (instance && instance.plot) {
                checkNow(true);
            }
        }, 90);
    }
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
