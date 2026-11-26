(function () {
  "use strict";

  function parseCsvPoints(text) {
    var errors = [];
    var lines = String(text == null ? "" : text).replace(/\r\n?/g, "\n").split("\n");
    var rows = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line || line.charAt(0) === "#") continue;
      rows.push({ line: i + 1, text: line });
    }
    if (!rows.length) return { points: [], errors: [{ line: 0, kind: "empty" }] };
    var sample = rows[0].text;
    var delim = null;
    var decimalComma = false;
    if (sample.indexOf(";") >= 0) {
      delim = ";";
      decimalComma = true;
    } else if (sample.indexOf("\t") >= 0) {
      delim = "\t";
      decimalComma = true;
    } else if (/,\s/.test(sample)) {
      delim = ",";
    } else if (/\s/.test(sample.trim())) {
      decimalComma = true;
    } else if (sample.indexOf(",") >= 0) {
      delim = ",";
    }
    function cellsOf(str) {
      return delim ? str.split(delim) : str.split(/\s+/);
    }
    function numOf(cell) {
      var s = String(cell == null ? "" : cell).trim();
      if (decimalComma) s = s.replace(",", ".");
      return s === "" ? NaN : Number(s);
    }
    var first = cellsOf(rows[0].text);
    var start = first.length >= 2 && isFinite(numOf(first[0])) && isFinite(numOf(first[1])) ? 0 : 1;
    var points = [];
    for (var r = start; r < rows.length; r++) {
      var cells = cellsOf(rows[r].text);
      if (cells.length < 2) { errors.push({ line: rows[r].line, kind: "columns" }); continue; }
      var x = numOf(cells[0]);
      var y = numOf(cells[1]);
      if (!isFinite(x) || !isFinite(y)) { errors.push({ line: rows[r].line, kind: "number" }); continue; }
      points.push({ x: x, y: y });
    }
    return { points: points, errors: errors };
  }

  window.TfSinusScene = function (root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var el = document.createElement("div");
    el.className = "ls-sinus-scene";
    el.innerHTML =
      '<div class="ls-sinus-stage">' +
        '<canvas class="ls-sinus-canvas" role="img"></canvas>' +
        '<div class="ls-sinus-losschart"><canvas class="ls-sinus-loss-canvas" aria-label="Loss curve"></canvas></div>' +
        '<div class="ls-sinus-matrices" hidden>' +
          '<div class="ls-sinus-matrices-head"><b>' + (DE ? "Gewichte live" : "Live weights") + '</b><span>' + (DE ? "live" : "live") + '</span><button type="button" class="ls-btn ls-btn--tiny ls-sinus-matrices-close" aria-label="' + (DE ? "Schließen" : "Close") + '">×</button></div>' +
          '<p class="ls-sinus-matrices-note"></p>' +
          '<div class="ls-sinus-matrix-grid"></div>' +
          '<div class="ls-sinus-matrix-legend"><span>' + (DE ? "Zahlen live" : "live numbers") + '</span><span>' + (DE ? "scrollen" : "scroll") + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="ls-sinus-formula" hidden></div>' +
      '<div class="ls-sinus-controls">' +
        '<button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-sinus-train">' + (DE ? "Training pausieren" : "Pause training") + '</button>' +
        '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-sinus-reset">' + (DE ? "Zurücksetzen" : "Reset") + '</button>' +
        '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-sinus-matrix-btn">' + (DE ? "Matrizen zeigen" : "Show matrices") + '</button>' +
        '<span class="ls-sinus-loss" aria-live="polite"></span>' +
      '</div>' +
      '<div class="ls-sinus-readout" aria-live="polite"></div>' +
      '<details class="ls-sinus-data" data-mode="sine" hidden>' +
        '<summary><span>' + (DE ? "Trainingsdaten" : "Training data") + '</span><span class="ls-sinus-data-count"></span></summary>' +
        '<div class="ls-sinus-data-body">' +
          '<p class="ls-sinus-data-hint">' + (DE ? "Eigene x/y-Paare eintragen oder als CSV einfügen. In der Tabelle sind Komma und Punkt als Dezimaltrennzeichen erlaubt; für CSV mit Dezimalkomma Semikolon als Trenner verwenden (z. B. 0,1;0,5). Beim Übernehmen verschwindet der Sinus, die Achsen passen sich an, und das Netz trainiert sofort auf deinen Daten. Der CSV-Text bleibt erhalten, damit du weitere Zeilen ergänzen kannst." : "Enter your own x/y pairs or paste a CSV. In the table both comma and dot work as the decimal separator; for CSV with decimal commas use semicolons (e.g. 0.1;0.5). When applied, the sine disappears, the axes fit your data, and the network trains on it immediately. The CSV text stays in place so you can add more rows.") + '</p>' +
          '<div class="ls-sinus-table-wrap"><table class="ls-sinus-table"><thead><tr><th scope="col">x</th><th scope="col">y</th><th scope="col"><span class="ls-sr-only">' + (DE ? "Aktion" : "Action") + '</span></th></tr></thead><tbody></tbody></table></div>' +
          '<div class="ls-sinus-data-row">' +
            '<button type="button" class="ls-btn ls-btn--tiny ls-sinus-add-row">+ ' + (DE ? "Zeile" : "row") + '</button>' +
            '<span class="ls-sinus-data-limit">' + (DE ? "1–500 Punkte" : "1–500 points") + '</span>' +
          '</div>' +
          '<label class="ls-sinus-csv-label">' + (DE ? "CSV einfügen" : "Paste CSV") +
            '<textarea class="ls-sinus-csv" rows="4" spellcheck="false" placeholder="x;y&#10;0,1;0,5&#10;0,2;0,7"></textarea>' +
          '</label>' +
          '<div class="ls-sinus-data-row">' +
            '<label class="ls-btn ls-btn--tiny ls-sinus-file">' + (DE ? "CSV-Datei wählen" : "Choose CSV file") + '<input type="file" class="ls-sinus-file-input" accept=".csv,.txt,text/csv,text/plain"></label>' +
            '<span class="ls-sinus-file-name"></span>' +
          '</div>' +
          '<div class="ls-sinus-data-errors" aria-live="polite"></div>' +
          '<div class="ls-sinus-data-actions">' +
            '<button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-sinus-apply">' + (DE ? "Übernehmen & trainieren" : "Apply & train") + '</button>' +
            '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-sinus-restore">' + (DE ? "Sinus wiederherstellen" : "Restore sine") + '</button>' +
          '</div>' +
          '<details class="ls-sinus-arch">' +
            '<summary>' + (DE ? "Erweitert: Netzarchitektur" : "Advanced: network architecture") + '</summary>' +
            '<div class="ls-sinus-arch-body">' +
              '<label class="ls-sinus-arch-count">' + (DE ? "Versteckte Dense-Layer" : "Hidden dense layers") + ' <input type="number" class="ls-sinus-arch-layers" min="1" max="6" step="1" value="3"></label>' +
              '<div class="ls-sinus-arch-grid"></div>' +
              '<p class="ls-sinus-arch-hint">' + (DE ? "Standard: 3 Layer × 32 Neuronen. Jeder Layer kann eine eigene Neuronenzahl haben." : "Default: 3 layers × 32 neurons. Each layer can have its own neuron count.") + '</p>' +
              '<div class="ls-sinus-data-errors ls-sinus-arch-errors" aria-live="polite"></div>' +
              '<button type="button" class="ls-btn ls-btn--tiny ls-sinus-arch-apply">' + (DE ? "Architektur übernehmen & trainieren" : "Apply architecture & train") + '</button>' +
            '</div>' +
          '</details>' +
        '</div>' +
      '</details>' +
      '<div class="ls-sinus-loss-panel" hidden></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-sinus-stage");
    var canvas = el.querySelector(".ls-sinus-canvas");
    var trainBtn = el.querySelector(".ls-sinus-train");
    var resetBtn = el.querySelector(".ls-sinus-reset");
    var matrixBtn = el.querySelector(".ls-sinus-matrix-btn");
    var matrixClose = el.querySelector(".ls-sinus-matrices-close");
    var matrixOverlay = el.querySelector(".ls-sinus-matrices");
    var matrixNodes = Array.prototype.slice.call(el.querySelectorAll("[data-matrix]"));
    var matrixFigures = Array.prototype.slice.call(el.querySelectorAll(".ls-sinus-matrix-grid figure"));
    var matrixNote = el.querySelector(".ls-sinus-matrices-note");
    var lossCanvas = el.querySelector(".ls-sinus-loss-canvas");
    var formulaEl = el.querySelector(".ls-sinus-formula");
    var formulaKey = "";
    var lossCtx = null, lossSize = null;
    var lossEl = el.querySelector(".ls-sinus-loss");
    var readout = el.querySelector(".ls-sinus-readout");
    var lossPanel = el.querySelector(".ls-sinus-loss-panel");
    var dataBox = el.querySelector(".ls-sinus-data");
    var dataCount = el.querySelector(".ls-sinus-data-count");
    var tableBody = el.querySelector(".ls-sinus-table tbody");
    var addRowBtn = el.querySelector(".ls-sinus-add-row");
    var csvInput = el.querySelector(".ls-sinus-csv");
    var fileInput = el.querySelector(".ls-sinus-file-input");
    var fileName = el.querySelector(".ls-sinus-file-name");
    var applyBtn = el.querySelector(".ls-sinus-apply");
    var restoreBtn = el.querySelector(".ls-sinus-restore");
    var dataErrors = el.querySelector(".ls-sinus-data-errors");
    var archGrid = el.querySelector(".ls-sinus-arch-grid");
    var archCountInput = el.querySelector(".ls-sinus-arch-layers");
    var archErrors = el.querySelector(".ls-sinus-arch-errors");
    var archApplyBtn = el.querySelector(".ls-sinus-arch-apply");
    var lossApi = null;
    var lossView = false;
    var C = api.colors();
    var size = null, ctx = null;
    var xsTensor = null, ysTensor = null;
    var points = [];
    var phase = "linear";
    var training = false, visible = true, timer = 0;
    var drag = null, hoverIndex = -1, fitReady = false, userStarted = false;
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var TRAIN_START = 0.10, TRAIN_END = 0.70;
    var SINE_X_MIN = -1.00, SINE_X_MAX = 1.00, SINE_Y_MIN = -0.45, SINE_Y_MAX = 1.15;
    var X_MIN = SINE_X_MIN, X_MAX = SINE_X_MAX, Y_MIN = SINE_Y_MIN, Y_MAX = SINE_Y_MAX;
    var netLayers = [32, 32, 32];
    var customData = false;
    var draftPoints = [];
    var pendingCustom = null;
    var csvDirty = false, tableDirty = false;
    var TARGET_EPOCHS = 180;
    var gen = 0;
    var data = {
      linear: { model: null, curve: [], epochs: 0, loss: 0, history: [] },
      net: { model: null, curve: [], epochs: 0, loss: 0, history: [] }
    };
    function active() { return data[phase]; }
    function fitSmall(cv, host) {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var r = (host || cv).getBoundingClientRect();
      var w = Math.max(40, Math.round(r.width));
      var h = Math.max(40, Math.round(r.height));
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      var c = cv.getContext("2d");
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: w, h: h, ctx: c };
    }
    function truth(x) { return 0.5 + 0.42 * Math.sin(2 * Math.PI * x); }
    function makePoints(reset) {
      if (reset && window.TM_SINUS_DATA) window.TM_SINUS_DATA.reset();
      var src = window.TM_SINUS_DATA && window.TM_SINUS_DATA.points;
      points = src ? src.map(function (p) { return { x: p.x, y: p.y }; }) : [];
      if (!points.length) {
        var seed = 11;
        function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
        for (var i = 0; i < 18; i++) {
          var x = 0.10 + 0.60 * i / 17;
          points.push({ x: x, y: truth(x) + (rnd() - 0.5) * 0.035 });
        }
      }
      syncDraftFromPoints();
    }
    function fmtNum(v) {
      return typeof v === "number" && isFinite(v) ? String(Math.round(v * 1000) / 1000) : "";
    }
    function csvNum(v) {
      return String(Math.round(v * 1e6) / 1e6);
    }
    function pointsToCsv(list) {
      var lines = ["x;y"];
      list.forEach(function (p) { lines.push(csvNum(p.x) + ";" + csvNum(p.y)); });
      return lines.join("\n");
    }
    function validNum(v) {
      return typeof v === "number" && isFinite(v);
    }
    function parseNumInput(raw) {
      var s = String(raw == null ? "" : raw).trim();
      if (!s) return null;
      var n = Number(s.replace(",", "."));
      return isFinite(n) ? n : NaN;
    }
    function axisTick(v) {
      var span = X_MAX - X_MIN;
      var dec = span < 0.2 ? 3 : span < 2 ? 2 : span < 20 ? 1 : 0;
      return v.toFixed(dec);
    }
    function updateRanges() {
      if (!customData || !points.length) {
        X_MIN = SINE_X_MIN; X_MAX = SINE_X_MAX; Y_MIN = SINE_Y_MIN; Y_MAX = SINE_Y_MAX;
        return;
      }
      function padRange(min, max) {
        if (!isFinite(min) || !isFinite(max)) return [-1, 1];
        if (max - min < 1e-9) { var c = min; min = c - 1; max = c + 1; }
        var pad = (max - min) * 0.08;
        return [min - pad, max + pad];
      }
      var xs = points.map(function (p) { return p.x; });
      var ys = points.map(function (p) { return p.y; });
      var xr = padRange(Math.min.apply(null, xs), Math.max.apply(null, xs));
      var yr = padRange(Math.min.apply(null, ys), Math.max.apply(null, ys));
      X_MIN = xr[0]; X_MAX = xr[1]; Y_MIN = yr[0]; Y_MAX = yr[1];
    }
    function updateDataCount() {
      if (!dataCount) return;
      dataCount.textContent = draftPoints.length + " " + (DE ? (draftPoints.length === 1 ? "Punkt" : "Punkte") : (draftPoints.length === 1 ? "point" : "points"));
    }
    function renderTable() {
      if (!tableBody) return;
      tableBody.innerHTML = "";
      draftPoints.forEach(function (p, i) {
        var tr = document.createElement("tr");
        ["x", "y"].forEach(function (axis) {
          var td = document.createElement("td");
          var input = document.createElement("input");
          input.type = "text";
          input.inputMode = "decimal";
          input.autocomplete = "off";
          input.spellcheck = false;
          input.className = "ls-sinus-cell";
          input.setAttribute("data-idx", String(i));
          input.setAttribute("data-axis", axis);
          input.setAttribute("aria-label", (DE ? (axis === "x" ? "x-Wert" : "y-Wert") : (axis === "x" ? "x value" : "y value")) + " " + (i + 1));
          input.value = fmtNum(p[axis]);
          td.appendChild(input);
          tr.appendChild(td);
        });
        var td = document.createElement("td");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ls-btn ls-btn--tiny ls-sinus-remove-row";
        btn.setAttribute("data-idx", String(i));
        btn.setAttribute("aria-label", DE ? "Zeile " + (i + 1) + " entfernen" : "Remove row " + (i + 1));
        btn.textContent = "×";
        td.appendChild(btn);
        tr.appendChild(td);
        tableBody.appendChild(tr);
      });
      updateDataCount();
    }
    function syncDraftFromPoints() {
      draftPoints = points.map(function (p) { return { x: p.x, y: p.y }; });
      renderTable();
    }
    function setTableValue(idx, axis) {
      if (!tableBody || !points[idx]) return;
      var input = tableBody.querySelector('input[data-idx="' + idx + '"][data-axis="' + axis + '"]');
      if (input) input.value = fmtNum(points[idx][axis]);
    }
    function showDataError(msg) { if (dataErrors) dataErrors.textContent = msg; }
    function clearDataError() { if (dataErrors) dataErrors.textContent = ""; }
    function formatCsvErrors(errors) {
      var msgs = errors.slice(0, 4).map(function (e) {
        if (e.kind === "empty") return DE ? "Keine Daten gefunden." : "No data found.";
        var reason = e.kind === "columns" ? (DE ? "x und y fehlen" : "x and y missing") : (DE ? "keine gültige Zahl" : "not a valid number");
        return (DE ? "Zeile " : "Line ") + e.line + ": " + reason;
      });
      if (errors.length > 4) msgs.push((DE ? "… und " : "… and ") + (errors.length - 4) + (DE ? " weitere" : " more"));
      return msgs.join(" ");
    }
    function makeTensors() {
      if (xsTensor) xsTensor.dispose();
      if (ysTensor) ysTensor.dispose();
      xsTensor = tf.tensor2d(points.map(function (p) { return [p.x]; }), [points.length, 1]);
      ysTensor = tf.tensor2d(points.map(function (p) { return [p.y]; }), [points.length, 1]);
    }
    function initialLoss(m) {
      if (!m || !xsTensor || !ysTensor) return 0;
      try {
        var pred = m.predict(xsTensor);
        var pv = pred.dataSync();
        var yv = ysTensor.dataSync();
        var sum = 0;
        for (var i = 0; i < pv.length; i++) {
          var d = pv[i] - yv[i];
          sum += d * d;
        }
        pred.dispose();
        return pv.length ? sum / pv.length : 0;
      } catch (err) {
        return 0;
      }
    }
    function buildLinear() {
      if (data.linear.model) data.linear.model.dispose();
      var m = tf.sequential();
      m.add(tf.layers.dense({ inputShape: [1], units: 1, activation: "linear" }));
      m.compile({ optimizer: tf.train.adam(0.05), loss: "meanSquaredError" });
      data.linear.model = m;
      data.linear.epochs = 0;
      data.linear.loss = initialLoss(m);
      data.linear.history = [data.linear.loss];
    }
    function buildNet() {
      if (data.net.model) data.net.model.dispose();
      var m = tf.sequential();
      m.add(tf.layers.dense({ inputShape: [1], units: netLayers[0], activation: "relu" }));
      for (var i = 1; i < netLayers.length; i++) {
        m.add(tf.layers.dense({ units: netLayers[i], activation: "relu" }));
      }
      m.add(tf.layers.dense({ units: 1, activation: "linear" }));
      m.compile({ optimizer: tf.train.adam(0.03), loss: "meanSquaredError" });
      data.net.model = m;
      data.net.epochs = 0;
      data.net.loss = initialLoss(m);
      data.net.history = [data.net.loss];
    }
    function subScript(n) {
      return String(n).split("").map(function (d) {
        return "₀₁₂₃₄₅₆₇₈₉".charAt(Number(d));
      }).join("");
    }
    function netDescriptor() {
      return "1 → " + netLayers.join(" → ") + " → 1";
    }
    function netLabel() {
      var same = netLayers.every(function (v) { return v === netLayers[0]; });
      if (DE) {
        return same
          ? netLayers.length + " versteckte Schichten, je " + netLayers[0] + " ReLU"
          : netLayers.length + " versteckte Schichten: " + netLayers.join(", ");
      }
      return same
        ? netLayers.length + " hidden layers, " + netLayers[0] + " ReLU each"
        : netLayers.length + " hidden layers: " + netLayers.join(", ");
    }
    function renderMatrixFigures(count) {
      var grid = el.querySelector(".ls-sinus-matrix-grid");
      if (!grid) return;
      grid.innerHTML = "";
      for (var i = 0; i < count; i++) {
        var fig = document.createElement("figure");
        var node = document.createElement("div");
        node.className = "ls-matrix-tex";
        node.setAttribute("data-matrix", String(i));
        var cap = document.createElement("figcaption");
        fig.appendChild(node);
        fig.appendChild(cap);
        grid.appendChild(fig);
      }
      matrixNodes = Array.prototype.slice.call(el.querySelectorAll("[data-matrix]"));
      matrixFigures = Array.prototype.slice.call(el.querySelectorAll(".ls-sinus-matrix-grid figure"));
    }
    function setDataBoxVisible() {
      if (dataBox) dataBox.hidden = phase !== "net";
    }
    function renderArchInputs(count) {
      if (!archGrid) return;
      var n = Math.max(1, Math.min(6, parseInt(count, 10) || 3));
      archGrid.innerHTML = "";
      for (var i = 0; i < n; i++) {
        var label = document.createElement("label");
        var span = document.createElement("span");
        span.textContent = (DE ? "Layer " : "Layer ") + (i + 1);
        var input = document.createElement("input");
        input.type = "number";
        input.min = "1";
        input.max = "64";
        input.step = "1";
        input.className = "ls-sinus-arch-neurons";
        input.setAttribute("data-arch-layer", String(i));
        input.value = String(netLayers[i] || 32);
        label.appendChild(span);
        label.appendChild(input);
        archGrid.appendChild(label);
      }
    }
    function showArchError(msg) { if (archErrors) archErrors.textContent = msg; }
    function clearArchError() { if (archErrors) archErrors.textContent = ""; }
    function applyCustomPoints(list) {
      if (!fitReady || !window.tf) { pendingCustom = list.slice(); return; }
      pauseTraining();
      if (timer) { clearTimeout(timer); timer = 0; }
      if (active().model) active().model.stopTraining = true;
      gen++;
      customData = true;
      points = list.map(function (p) { return { x: Number(p.x), y: Number(p.y) }; });
      syncDraftFromPoints();
      updateRanges();
      makeTensors();
      buildLinear();
      buildNet();
      predict();
      el.classList.add("is-custom-data");
      if (dataBox) { dataBox.setAttribute("data-mode", "custom"); dataBox.setAttribute("data-points", String(points.length)); }
      csvDirty = false;
      tableDirty = false;
      clearDataError();
      draw();
      updateMatrixCanvases(true);
      resumeTraining();
    }
    function restoreSine() {
      clearDataError();
      if (csvInput) csvInput.value = "";
      if (fileName) fileName.textContent = "";
      csvDirty = false;
      tableDirty = false;
      pauseTraining();
      if (timer) { clearTimeout(timer); timer = 0; }
      if (active().model) active().model.stopTraining = true;
      gen++;
      customData = false;
      el.classList.remove("is-custom-data");
      if (dataBox) { dataBox.setAttribute("data-mode", "sine"); dataBox.removeAttribute("data-points"); }
      makePoints(true);
      updateRanges();
      makeTensors();
      buildLinear();
      buildNet();
      predict();
      draw();
      updateMatrixCanvases(true);
      trainBtn.textContent = DE ? "Training starten" : "Start training";
    }
    function onApplyData() {
      clearDataError();
      var list;
      var raw = csvInput ? csvInput.value.trim() : "";
      var useCsv = csvDirty && !!raw;
      if (useCsv) {
        var parsed = parseCsvPoints(raw);
        if (parsed.errors.length) { showDataError(formatCsvErrors(parsed.errors)); return; }
        if (!parsed.points.length) { showDataError(DE ? "Keine gültigen Punkte gefunden." : "No valid points found."); return; }
        list = parsed.points;
      } else {
        list = draftPoints.map(function (p) { return { x: p.x, y: p.y }; });
        var bad = -1;
        list.forEach(function (p, i) { if (bad < 0 && (!validNum(p.x) || !validNum(p.y))) bad = i; });
        if (bad >= 0) { showDataError(DE ? "Zeile " + (bad + 1) + ": x und y müssen Zahlen sein." : "Row " + (bad + 1) + ": x and y must be numbers."); return; }
      }
      if (list.length < 1) { showDataError(DE ? "Mindestens ein Punkt nötig." : "At least one point is required."); return; }
      if (list.length > 500) { showDataError(DE ? "Höchstens 500 Punkte." : "At most 500 points."); return; }
      if (!useCsv && csvInput) csvInput.value = pointsToCsv(list);
      applyCustomPoints(list);
    }
    function applyArchitecture() {
      if (phase !== "net" || !archGrid) return;
      clearArchError();
      var count = Math.max(1, Math.min(6, parseInt(archCountInput ? archCountInput.value : "3", 10) || 3));
      var inputs = archGrid.querySelectorAll("input");
      var vals = [];
      for (var i = 0; i < count; i++) {
        var input = inputs[i];
        var v = input ? parseInt(input.value, 10) : NaN;
        if (!isFinite(v) || v < 1 || v > 64) {
          showArchError(DE ? "Layer " + (i + 1) + ": 1–64 Neuronen." : "Layer " + (i + 1) + ": 1–64 neurons.");
          return;
        }
        vals.push(v);
      }
      if (archCountInput) archCountInput.value = String(count);
      netLayers = vals;
      el.setAttribute("data-net-layers", netLayers.join(","));
      renderArchInputs(count);
      if (!fitReady || !window.tf) return;
      pauseTraining();
      if (timer) { clearTimeout(timer); timer = 0; }
      if (active().model) active().model.stopTraining = true;
      gen++;
      buildNet();
      renderMatrixFigures(netLayers.length + 1);
      predict();
      draw();
      updateMatrixCanvases(true);
      resumeTraining();
    }
    function grid() {
      var out = [];
      for (var i = 0; i <= 140; i++) out.push([X_MIN + (X_MAX - X_MIN) * i / 140]);
      return out;
    }
    function predict() {
      var a = active();
      if (!a.model || !fitReady) return;
      var g = grid();
      var y = tf.tidy(function () { return a.model.predict(tf.tensor2d(g, [g.length, 1])).dataSync(); });
      a.curve = [];
      for (var i = 0; i < g.length; i++) a.curve.push({ x: g[i][0], y: y[i] });
    }
    function curveAt(x) {
      var c = active().curve;
      if (!c.length) return 0;
      var lo = X_MIN, hi = X_MAX;
      for (var i = 1; i < c.length; i++) {
        if (c[i].x >= x) {
          var t = (x - c[i - 1].x) / Math.max(1e-9, c[i].x - c[i - 1].x);
          return c[i - 1].y + (c[i].y - c[i - 1].y) * V.clamp(t, 0, 1);
        }
      }
      return c[c.length - 1].y;
    }
    function outsideError() {
      if (customData) return null;
      var c = active().curve;
      if (!c.length) return 0;
      var s = 0, n = 0;
      c.forEach(function (p) {
        if (p.x > TRAIN_START && p.x < TRAIN_END) return;
        var d = p.y - truth(p.x);
        s += d * d; n++;
      });
      return n ? Math.sqrt(s / n) : 0;
    }
    function px(x) { return 34 + (x - X_MIN) / (X_MAX - X_MIN) * (size.w - 54); }
    function py(y) { return size.h - 40 - (y - Y_MIN) / (Y_MAX - Y_MIN) * (size.h - 74); }
    function legend(w, h, hideSine) {
      var items = [
        { label: DE ? "Daten" : "data", color: C.blue, kind: "dot" },
        { label: DE ? "Modell" : "model", color: C.green, kind: "line" }
      ];
      if (!hideSine) items.push({ label: DE ? "wahrer Sinus" : "true sine", color: C.muted, kind: "dash" });
      var x = 44, y = 16;
      items.forEach(function (it) {
        ctx.save();
        ctx.strokeStyle = it.color;
        ctx.fillStyle = it.color;
        ctx.lineWidth = it.kind === "line" ? 2.4 : 1.4;
        if (it.kind === "dash") ctx.setLineDash([4, 3]);
        if (it.kind === "dot") {
          ctx.beginPath();
          ctx.arc(x, y, 3.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(x - 7, y);
          ctx.lineTo(x + 7, y);
          ctx.stroke();
        }
        ctx.restore();
        V.label(ctx, it.label, x + 12, y, {
          font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif',
          color: C.muted, alpha: 1, bg: false
        });
        x += ctx.measureText(it.label).width + 34;
      });
    }
    function draw() {
      if (!size || lossView) return;
      ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, size.w, size.h);
      if (!customData) {
        ctx.fillStyle = V.alpha(C.coral, 0.11);
        ctx.fillRect(34, 26, px(TRAIN_START) - 34, size.h - 68);
        ctx.fillRect(px(TRAIN_END), 26, size.w - 20 - px(TRAIN_END), size.h - 68);
        ctx.fillStyle = V.alpha(C.green, 0.09);
        ctx.fillRect(px(TRAIN_START), 26, px(TRAIN_END) - px(TRAIN_START), size.h - 68);
      }
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(34, size.h - 40);
      ctx.lineTo(size.w - 20, size.h - 40);
      ctx.moveTo(34, 22);
      ctx.lineTo(34, size.h - 40);
      ctx.stroke();
      var ticks, tickLabels;
      if (customData) {
        ticks = [0, 0.25, 0.5, 0.75, 1].map(function (t) { return X_MIN + (X_MAX - X_MIN) * t; });
        tickLabels = ticks.map(axisTick);
      } else {
        ticks = [-1, -0.5, 0, 0.5, 1];
        tickLabels = ["−2π", "−π", "0", "π", "2π"];
      }
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ticks.forEach(function (t, ti) { ctx.fillText(tickLabels[ti], px(t), size.h - 34); });
      if (!customData) {
        ctx.fillStyle = V.alpha(C.green, 0.85);
        ctx.fillText(DE ? "Daten" : "data", (px(TRAIN_START) + px(TRAIN_END)) / 2, 30);
        ctx.fillStyle = V.alpha(C.coral, 0.9);
        ctx.textAlign = "left";
        ctx.fillText(DE ? "Approximation" : "extrapolation", px(TRAIN_END) + 3, 30);
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = C.muted;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        for (var i = 0; i <= 140; i++) {
          var x = X_MIN + (X_MAX - X_MIN) * i / 140;
          if (i === 0) ctx.moveTo(px(x), py(truth(x))); else ctx.lineTo(px(x), py(truth(x)));
        }
        ctx.stroke();
        ctx.restore();
      }
      var a = active();
      if (a.curve.length) {
        if (phase === "linear" && a.epochs > 4) {
          points.forEach(function (p) {
            var yhat = curveAt(p.x);
            ctx.save();
            ctx.strokeStyle = V.alpha(C.lilac, 0.72);
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(px(p.x), py(p.y));
            ctx.lineTo(px(p.x), py(yhat));
            ctx.stroke();
            ctx.restore();
          });
        }
        ctx.save();
        ctx.strokeStyle = phase === "net" ? C.green : C.petrol;
        ctx.lineWidth = 2.8;
        ctx.lineJoin = "round";
        ctx.beginPath();
        a.curve.forEach(function (p, k) { if (k === 0) ctx.moveTo(px(p.x), py(p.y)); else ctx.lineTo(px(p.x), py(p.y)); });
        ctx.stroke();
        ctx.restore();
      }
      points.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(px(p.x), py(p.y), 4, 0, Math.PI * 2);
        ctx.fillStyle = C.paper;
        ctx.fill();
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      });
      if (hoverIndex >= 0 && points[hoverIndex]) {
        var hp = points[hoverIndex];
        ctx.beginPath(); ctx.arc(px(hp.x), py(hp.y), 7, 0, Math.PI * 2);
        ctx.fillStyle = V.alpha(C.gold, .25); ctx.fill();
        ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.stroke();
      }
      legend(size.w, size.h, customData);
      V.heading(ctx, phase === "linear" ? "1 Neuron · ŷ = w x + b" : netDescriptor(), size.w - 20, 18, C.petrol, 10, 1);
      if (phase === "linear") {
        var wv = linearParams();
        V.label(ctx, (DE ? "ŷ = " : "ŷ = ") + V.fmt(wv.w) + "x + " + V.fmt(wv.b), 44, size.h - 58, {
          font: '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif',
          color: C.petrol, alpha: 1
        });
        if (a.epochs > 18) {
          var msg = DE ? "Eine Gerade kann den Sinus nur grob annähern, nicht biegen." : "A line can only approximate the sine, not bend it.";
          V.label(ctx, msg, size.w * 0.5, 42, {
            font: '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Barlow", sans-serif',
            color: C.gold, align: "center", alpha: 1
          });
        }
      } else {
        V.label(ctx, netLabel(), 44, size.h - 58, {
          font: '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif',
          color: C.petrol, alpha: 1
        });
      }
      drawLossChart();
      updateReadout();
      var desc = phase === "linear"
        ? (DE ? "ein Neuron, Gerade" : "one neuron, a line")
        : (DE ? netLayers.length + " versteckte Schichten (" + netLayers.join(", ") + " ReLU-Neuronen)" : netLayers.length + " hidden layers (" + netLayers.join(", ") + " ReLU neurons)");
      canvas.setAttribute("aria-label", (customData ? (DE ? "Eigene Daten. " : "Custom data. ") : (DE ? "Sinus-Demo. " : "Sine demo. ")) +
        (DE ? "Modell: " + desc + ". Loss " + V.fmt(a.loss, 4) + "." : "Model: " + desc + ". Loss " + V.fmt(a.loss, 4) + "."));
    }
    function linearParams() {
      var w = 0, b = 0;
      var m = data.linear.model;
      if (m && m.layers && m.layers[0]) {
        var ws = m.layers[0].getWeights();
        if (ws && ws[0]) { var k = ws[0].dataSync(); w = k[0] || 0; }
        if (ws && ws[1]) { var bias = ws[1].dataSync(); b = bias[0] || 0; }
      }
      return { w: w, b: b };
    }
    function drawLossChart() {
      if (!lossCanvas) return;
      lossSize = api.fit(lossCanvas, lossCanvas.parentNode);
      lossCtx = lossSize.ctx;
      var w = lossSize.w, h = lossSize.h;
      lossCtx.clearRect(0, 0, w, h);
      lossCtx.fillStyle = C.paper;
      lossCtx.fillRect(0, 0, w, h);
      lossCtx.strokeStyle = C.line;
      lossCtx.lineWidth = 1;
      lossCtx.beginPath();
      lossCtx.moveTo(8, h - 8);
      lossCtx.lineTo(w - 8, h - 8);
      lossCtx.stroke();
      V.label(lossCtx, "Loss (log)", 8, 11, {
        font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif',
        color: C.muted, bg: false, alpha: 1
      });
      var hist = active().history;
      if (!hist.length) return;
      var logs = hist.map(function (v) { return Math.log10(Math.max(1e-8, v)); });
      var min = Math.min.apply(null, logs), max = Math.max.apply(null, logs);
      if (max - min < 1e-6) { max += 0.5; min -= 0.5; }
      lossCtx.strokeStyle = phase === "net" ? C.green : C.petrol;
      lossCtx.lineWidth = 1.8;
      lossCtx.beginPath();
      logs.forEach(function (v, i) {
        var x = 8 + i / Math.max(1, logs.length - 1) * (w - 16);
        var y = h - 8 - (v - min) / (max - min) * (h - 18);
        if (i === 0) lossCtx.moveTo(x, y); else lossCtx.lineTo(x, y);
      });
      lossCtx.stroke();
      V.label(lossCtx, "Epoche " + active().epochs, w - 8, 11, {
        font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif',
        color: C.muted, align: "right", bg: false, alpha: 1
      });
    }
    function renderLiveFormula() {
      if (!formulaEl) return;
      if (phase !== "linear" || lossView) {
        formulaEl.hidden = true;
        formulaEl.innerHTML = "";
        formulaKey = "";
        return;
      }
      var p = linearParams();
      var key = p.w.toFixed(4) + "|" + p.b.toFixed(4);
      if (key === formulaKey) { formulaEl.hidden = false; return; }
      formulaKey = key;
      var tex = DE
        ? "\\underbrace{\\hat y = \\underbrace{w}_{\\text{Gewicht}} x + \\underbrace{b}_{\\text{Bias}}}_{\\text{live lineares Modell}} = " + p.w.toFixed(3) + "x + " + p.b.toFixed(3)
        : "\\underbrace{\\hat y = \\underbrace{w}_{\\text{weight}} x + \\underbrace{b}_{\\text{bias}}}_{\\text{live linear model}} = " + p.w.toFixed(3) + "x + " + p.b.toFixed(3);
      formulaEl.hidden = false;
      formulaEl.innerHTML = '<div class="ls-math" data-tex="' + api.esc(tex) + '" data-tex-display="true"><code class="ls-tex-source">' + api.esc(tex) + '</code></div>';
      if (api.typeset) { try { api.typeset(formulaEl); } catch (e) {} }
    }
    function updateReadout() {
      var a = active();
      lossEl.textContent = "Loss " + V.fmt(a.loss, 4);
      var model = phase === "linear" ? "1 → 1" : netDescriptor();
      var params = phase === "linear" ? linearParams() : null;
      var outside = outsideError();
      readout.innerHTML = '<span><b>' + (DE ? "Modell" : "model") + '</b> ' + model + '</span>' +
        '<span><b>' + (DE ? "Epochen" : "epochs") + '</b> ' + a.epochs + '</span>' +
        '<span><b>Loss</b> ' + V.fmt(a.loss, 4) + '</span>' +
        '<span><b>' + (DE ? "außen" : "outside") + '</b> ' + (outside == null ? "—" : V.fmt(outside, 3)) + '</span>' +
        (customData ? '<span><b>' + (DE ? "Daten" : "data") + '</b> ' + points.length + (DE ? " eigene" : " custom") + '</span>' : '') +
        (params ? '<span><b>w</b> ' + V.fmt(params.w) + '</span><span><b>b</b> ' + V.fmt(params.b) + '</span>' : '') +
        '<span><b>(x, y)</b> ' + (DE ? "input, output" : "input, output") + '</span>';
      renderLiveFormula();
    }
    var matrixLast = 0;
    function matrixTex(rows, cols, vals) {
      var out = [];
      for (var r = 0; r < rows; r++) {
        var line = [];
        for (var c = 0; c < cols; c++) line.push(Number(vals[r * cols + c]).toFixed(2));
        out.push(line.join(" & "));
      }
      return "\\begin{pmatrix}" + out.join(" \\\\ ") + "\\end{pmatrix}";
    }
    function biasTex(vals) {
      return "\\begin{pmatrix}" + Array.prototype.map.call(vals, function (v) { return Number(v).toFixed(2); }).join(" \\\\ ") + "\\end{pmatrix}";
    }
    function updateMatrixCanvases(force) {
      if (matrixOverlay.hidden) return;
      var now = performance.now();
      if (!force && now - matrixLast < 220) return;
      matrixLast = now;
      var isLinear = phase === "linear";
      var expected = isLinear ? 1 : (netLayers.length + 1);
      if (matrixFigures.length !== expected) renderMatrixFigures(expected);
      matrixFigures.forEach(function (fig, i) { fig.hidden = isLinear ? i > 0 : false; });
      var texs = [];
      if (isLinear) {
        if (!data.linear.model) return;
        var p = linearParams();
        if (matrixNote) matrixNote.textContent = DE ? "1 Neuron: W ist 1×1, b ein Skalar. Die Gerade ist ŷ = w·x + b; die Zahlen aktualisieren sich live." : "1 neuron: W is 1×1, b is a scalar. The line is ŷ = w·x + b; the numbers update live.";
        texs[0] = "W = " + matrixTex(1, 1, [p.w]) + " \\qquad b = " + biasTex([p.b]);
        if (matrixFigures[0]) matrixFigures[0].querySelector("figcaption").textContent = "W · 1×1 und b";
      } else {
        if (!data.net.model) return;
        var layers = data.net.model.layers;
        var shapes = [];
        for (var li = 0; li < layers.length; li++) {
          var layer = layers[li];
          if (!layer) { texs[li] = ""; continue; }
          var ws = layer.getWeights();
          if (!ws || !ws[0]) { texs[li] = ""; continue; }
          var kernel = ws[0], shape = kernel.shape, vals = kernel.dataSync();
          var bias = ws[1] ? ws[1].dataSync() : [];
          texs[li] = "W_{" + (li + 1) + "} = " + matrixTex(shape[0], shape[1], vals) + (bias.length ? " \\qquad b_{" + (li + 1) + "} = " + biasTex(bias) : "");
          shapes.push("W" + subScript(li + 1) + " " + shape[0] + "×" + shape[1]);
        }
        if (matrixNote) {
          matrixNote.textContent = (DE
            ? netLayers.length + " versteckte Schichten: "
            : netLayers.length + " hidden layers: ") + shapes.join(", ") +
            (DE ? ". Jede Zahl ist ein Gewicht; die Matrizen scrollen, damit alle Zahlen sichtbar werden." : ". Every number is a weight; the matrices scroll so all numbers stay readable.");
        }
        matrixFigures.forEach(function (fig, i) {
          if (fig) fig.querySelector("figcaption").textContent = "W" + subScript(i + 1);
        });
      }
      matrixNodes.forEach(function (node, i) {
        if (!node) return;
        node.setAttribute("data-tex", texs[i] || "");
        node.removeAttribute("data-tex-rendered");
        node.innerHTML = '<code class="ls-tex-source">' + api.esc(texs[i] || "") + '</code>';
      });
      if (window.TM && typeof TM.typesetMath === "function") {
        try { TM.typesetMath(matrixOverlay); } catch (e) {}
      }
    }

    function trainTick() {
      var a = active();
      if (!userStarted || !visible || !training || !a.model) { timer = 0; return; }
      var g = gen, p = phase, m = a.model;
      var epochsPer = p === "linear" ? 6 : 2;
      m.fit(xsTensor, ysTensor, { epochs: epochsPer, batchSize: Math.min(points.length, 128), shuffle: true, verbose: 0 }).then(function (h) {
        if (g !== gen || phase !== p || a.model !== m) return;
        var losses = h.history.loss;
        a.epochs += epochsPer;
        a.loss = losses[losses.length - 1];
        a.history.push(a.loss);
        if (a.history.length > 110) a.history.shift();
        predict();
        draw();
        updateMatrixCanvases();
        if (visible && training) timer = setTimeout(trainTick, reduced ? 500 : (p === "linear" ? 80 : 64));
      }).catch(function () { timer = 0; });
    }
    function resumeTraining() {
      userStarted = true;
      training = true;
      trainBtn.textContent = DE ? "Training pausieren" : "Pause training";
      if (!timer && visible && active().model) trainTick();
    }
    function pauseTraining() {
      training = false;
      trainBtn.textContent = DE ? (active().epochs ? "Training fortsetzen" : "Training starten") : (active().epochs ? "Resume training" : "Start training");
      if (timer) { clearTimeout(timer); timer = 0; }
    }
    function resetActive() {
      if (timer) { clearTimeout(timer); timer = 0; }
      if (active().model) active().model.stopTraining = true;
      training = false;
      userStarted = false;
      gen++;
      var p = phase;
      setTimeout(function () {
        if (phase !== p) return;
        if (p === "linear") buildLinear(); else buildNet();
        predict();
        draw();
        updateMatrixCanvases();
        trainBtn.textContent = DE ? "Training starten" : "Start training";
      }, 140);
    }
    function ensureLoss() {
      if (lossApi || !window.LossLandscapeScene || !lossPanel) return;
      lossApi = window.LossLandscapeScene(lossPanel, api);
    }
    function setLossMode(on) {
      lossView = !!on;
      el.classList.toggle("is-loss", lossView);
      if (formulaEl) formulaEl.hidden = lossView || phase !== "linear";
      if (lossView) {
        pauseTraining();
        ensureLoss();
        if (lossPanel) lossPanel.hidden = false;
        if (lossApi) { lossApi.resize(); lossApi.resume(); }
      } else {
        if (lossPanel) lossPanel.hidden = true;
        if (lossApi) lossApi.pause();
      }
    }
    function switchPhase(next) {
      if (next === "loss") { setLossMode(true); return; }
      if (lossView) setLossMode(false);
      if (next === phase) return;
      userStarted = false;
      pauseTraining();
      phase = next;
      el.classList.toggle("is-net", phase === "net");
      if (formulaEl) { formulaEl.hidden = phase !== "linear"; }
      if (!active().model) {
        if (phase === "linear") buildLinear(); else buildNet();
      }
      renderMatrixFigures(phase === "linear" ? 1 : netLayers.length + 1);
      setDataBoxVisible();
      predict();
      draw();
      updateMatrixCanvases(true);
      trainBtn.textContent = DE ? "Training starten" : "Start training";
    }
    function startTf() {
      userStarted = false;
      makePoints();
      makeTensors();
      buildLinear();
      buildNet();
      fitReady = true;
      if (archCountInput) archCountInput.value = String(netLayers.length);
      renderArchInputs(netLayers.length);
      el.setAttribute("data-net-layers", netLayers.join(","));
      renderMatrixFigures(phase === "linear" ? 1 : netLayers.length + 1);
      setDataBoxVisible();
      predict();
      draw();
      trainBtn.textContent = DE ? "Training starten" : "Start training";
      if (pendingCustom) {
        var pending = pendingCustom;
        pendingCustom = null;
        applyCustomPoints(pending);
      }
    }
    function initTf() {
      if (!window.tf) {
        readout.textContent = DE ? "TF.js konnte nicht geladen werden." : "TF.js could not be loaded.";
        return;
      }
      if (tf.getBackend && tf.getBackend() !== "cpu" && tf.setBackend) {
        tf.setBackend("cpu").then(startTf).catch(startTf);
      } else {
        startTf();
      }
    }
    function pointerPos(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    canvas.addEventListener("pointerdown", function (e) {
      var p = pointerPos(e);
      var best = -1, bd = 1e9;
      points.forEach(function (pt, i) {
        var d = Math.abs(px(pt.x) - p.x) + Math.abs(py(pt.y) - p.y);
        if (d < bd) { bd = d; best = i; }
      });
      if (best >= 0 && bd < 22) {
        drag = best;
        canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
      }
    });
    canvas.addEventListener("pointermove", function (e) {
      var p = pointerPos(e);
      if (drag == null) {
        var best = -1, bd = 1e9;
        points.forEach(function (pt, i) {
          var d = Math.abs(px(pt.x) - p.x) + Math.abs(py(pt.y) - p.y);
          if (d < bd) { bd = d; best = i; }
        });
        var next = best >= 0 && bd < 16 ? best : -1;
        if (next !== hoverIndex) { hoverIndex = next; draw(); canvas.style.cursor = next >= 0 ? "help" : "default"; }
        return;
      }
      var y = Y_MIN + (size.h - 40 - p.y) / (size.h - 74) * (Y_MAX - Y_MIN);
      points[drag].y = V.clamp(y, Y_MIN, Y_MAX);
      if (draftPoints[drag]) { draftPoints[drag].y = points[drag].y; setTableValue(drag, "y"); }
      tableDirty = true;
      csvDirty = false;
      if (window.TM_SINUS_DATA && window.TM_SINUS_DATA.points[drag]) window.TM_SINUS_DATA.points[drag].y = points[drag].y;
      makeTensors();
      predict();
      draw();
    });
    canvas.addEventListener("pointerup", function () { drag = null; });
    canvas.addEventListener("pointercancel", function () { drag = null; });
    canvas.addEventListener("pointerleave", function () { if (hoverIndex !== -1) { hoverIndex = -1; draw(); } });
    if (window.LearnSysDemoCore) {
      window.LearnSysDemoCore.canvasTip(canvas, function (x, y) {
        if (!size || lossView) return "";
        var best = -1, bd = 1e9;
        points.forEach(function (pt, i) {
          var d = Math.abs(px(pt.x) - x) + Math.abs(py(pt.y) - y);
          if (d < bd) { bd = d; best = i; }
        });
        if (best < 0 || bd >= 18) return DE ? "Sinus-Demo: Punkte sind Daten, die Kurve ist das Modell. Fahre über einen Punkt; ziehen verschiebt ihn." : "Sine demo: points are data, the curve is the model. Hover a point; drag to move it.";
        var pt = points[best];
        return (DE ? "Datenpunkt " : "Data point ") + (best + 1) + ": x = " + pt.x.toFixed(2) + ", y = " + pt.y.toFixed(2) + ". " + (DE ? "Ziehen verändert den Zielwert; das Modell passt seine Kurve an." : "Drag changes the target; the model adjusts its curve.");
      });
    }
    trainBtn.addEventListener("click", function () { if (training) pauseTraining(); else resumeTraining(); });
    resetBtn.addEventListener("click", resetActive);
    matrixBtn.addEventListener("click", function () {
      matrixOverlay.hidden = !matrixOverlay.hidden;
      matrixBtn.textContent = matrixOverlay.hidden ? (DE ? "Matrizen zeigen" : "Show matrices") : (DE ? "Matrizen schließen" : "Hide matrices");
      renderMatrixFigures(phase === "linear" ? 1 : netLayers.length + 1);
      updateMatrixCanvases(true);
    });
    matrixClose.addEventListener("click", function () {
      matrixOverlay.hidden = true;
      matrixBtn.textContent = DE ? "Matrizen zeigen" : "Show matrices";
    });
    if (tableBody) {
      tableBody.addEventListener("input", function (e) {
        var input = e.target && e.target.closest ? e.target.closest("input[data-axis]") : null;
        if (!input) return;
        var idx = parseInt(input.getAttribute("data-idx"), 10);
        if (!(idx >= 0 && idx < draftPoints.length)) return;
        draftPoints[idx][input.getAttribute("data-axis")] = parseNumInput(input.value);
        tableDirty = true;
        csvDirty = false;
      });
      tableBody.addEventListener("click", function (e) {
        var btn = e.target && e.target.closest ? e.target.closest(".ls-sinus-remove-row") : null;
        if (!btn) return;
        var idx = parseInt(btn.getAttribute("data-idx"), 10);
        if (!(idx >= 0 && idx < draftPoints.length)) return;
        draftPoints.splice(idx, 1);
        tableDirty = true;
        csvDirty = false;
        renderTable();
      });
    }
    if (addRowBtn) {
      addRowBtn.addEventListener("click", function () {
        var last = draftPoints[draftPoints.length - 1];
        var x = last && validNum(last.x) ? Math.round((last.x + 0.1) * 1000) / 1000 : 0;
        draftPoints.push({ x: x, y: 0 });
        tableDirty = true;
        csvDirty = false;
        renderTable();
        var input = tableBody && tableBody.querySelector('input[data-idx="' + (draftPoints.length - 1) + '"][data-axis="x"]');
        if (input) input.focus();
      });
    }
    if (csvInput) {
      csvInput.addEventListener("input", function () { csvDirty = true; tableDirty = false; });
    }
    if (applyBtn) applyBtn.addEventListener("click", onApplyData);
    if (restoreBtn) restoreBtn.addEventListener("click", restoreSine);
    if (fileInput) {
      fileInput.addEventListener("change", function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          if (csvInput) csvInput.value = String(reader.result || "");
          if (fileName) fileName.textContent = file.name;
          csvDirty = true;
          tableDirty = false;
          clearDataError();
        };
        reader.onerror = function () { showDataError(DE ? "Datei konnte nicht gelesen werden." : "Could not read the file."); };
        reader.readAsText(file);
      });
    }
    if (archCountInput) {
      archCountInput.addEventListener("input", function () { renderArchInputs(archCountInput.value); });
    }
    if (archApplyBtn) archApplyBtn.addEventListener("click", applyArchitecture);
    if (window.LearnSysDemoCore && lossCanvas) {
      window.LearnSysDemoCore.canvasTip(lossCanvas, function (x) {
        var hist = active().history;
        if (!hist.length || !lossSize) return "";
        var i = Math.round((x - 8) / Math.max(1, lossSize.w - 16) * (hist.length - 1));
        i = Math.max(0, Math.min(hist.length - 1, i));
        return (DE ? "Epoche " : "Epoch ") + i + ": Loss = " + V.fmt(hist[i], 5) + ". " + (DE ? "Log-Skala; jede Stufe ist ein Faktor 10." : "Log scale; every step is a factor of 10.");
      });
    }
    function resize() { size = api.fit(canvas, canvas); if (lossView) { if (lossApi) lossApi.resize(); } else { draw(); updateMatrixCanvases(); } }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries.some(function (en) { return en.isIntersecting; });
        if (!visible) pauseTraining(); else if (training && !timer) trainTick();
      }, { threshold: 0.05 }).observe(stage);
    }
    function nextInternal() {
      if (lossView) return lossApi ? lossApi.next() : false;
      var a = active();
      if (training) {
        pauseTraining();
        if (a.model) a.model.stopTraining = true;
        return false;
      }
      if (a.epochs === 0) { resumeTraining(); return true; }
      return false;
    }
    function prevInternal() {
      if (lossView) return lossApi ? lossApi.prev() : false;
      return false;
    }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); updateMatrixCanvases(); });
    var stageObserver = null;
    if (window.ResizeObserver) { stageObserver = new ResizeObserver(function () { resize(); }); stageObserver.observe(stage); }
    resize();
    if (window.tf) initTf(); else setTimeout(initTf, 300);
    return {
      update: function (s) {
        if (!s || !s.phase) return;
        if (s.phase === "loss") { setLossMode(true); return; }
        if (lossView) setLossMode(false);
        if (s.phase !== phase) switchPhase(s.phase);
        setDataBoxVisible();
      },
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) { return api.util.arrowKey(e, nextInternal, prevInternal); },
      resize: resize,
      pause: function () { pauseTraining(); if (lossView && lossApi) lossApi.pause(); },
      resume: function () { visible = true; if (lossView) { if (lossApi) lossApi.resume(); return; } if (training && !timer) trainTick(); },
      destroy: function () {
        training = false;
        if (timer) clearTimeout(timer);
        timer = 0;
        gen++;
        if (lossApi) { try { lossApi.destroy(); } catch (e) {} lossApi = null; }
        if (stageObserver) { stageObserver.disconnect(); stageObserver = null; }
        if (data.linear.model) data.linear.model.stopTraining = true;
        if (data.net.model) data.net.model.stopTraining = true;
        var lm = data.linear.model, nm = data.net.model, xs = xsTensor, ys = ysTensor;
        data.linear.model = null; data.net.model = null; xsTensor = null; ysTensor = null;
        setTimeout(function () {
          if (lm) lm.dispose();
          if (nm) nm.dispose();
          if (xs) xs.dispose();
          if (ys) ys.dispose();
        }, 320);
        window.removeEventListener("resize", resize);
        el.remove();
      }
    };
  };
  window.TfSinusScene.parseCsvPoints = parseCsvPoints;
})();
