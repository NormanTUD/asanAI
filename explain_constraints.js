(function() {

  var _POPUP_ID = "explain_constraint_popup_overlay";
  var _PLOT_ID = "explain_constraint_plot";
  var _constrPoints = null;

  function L() {
    return (typeof lang !== "undefined" && lang === "de") ? "de" : "en";
  }

  function renderMath(latex) {
    if (typeof temml !== "undefined") {
      try { return temml.renderToString(latex, { displayMode: false }); }
      catch (e) { return "<code>" + latex + "</code>"; }
    }
    return "<code>" + latex + "</code>";
  }

  function renderMathBlock(latex) {
    if (typeof temml !== "undefined") {
      try { return temml.renderToString(latex, { displayMode: true }); }
      catch (e) { return "<pre>" + latex + "</pre>"; }
    }
    return "<pre>" + latex + "</pre>";
  }

  function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

  function _escHandler(e) { if (e.key === "Escape") removePopup(); }

  function getXGrid(mn, mx, s) { var a = [], st = (mx - mn) / s; for (var i = 0; i <= s; i++) a.push(mn + i * st); return a; }

  var _state = { name: "maxNorm", ctrl: {} };

  // ─── TRANSLATIONS ─────────────────────────────────────────────────────

  var i18n = {
    en: {
      title: "Weight Constraints",
      intuition: "Intuition", formula: "The Formula",
      constrVizTitle: "Weight Vectors — before vs after",
      when: "When to use ? When not ?",
      selectLabel: "Choose:",
      practicalTip: "Practical tip",
      constrBefore: "Before Constraint", constrAfter: "After Constraint",
      closeOutside: "(click outside to close)",
      regen: "🔄 Regenerate random weights",
      paramExplain: "Configurable Parameters",
      paramExplainDesc: "These values affect the visualization:"
    },
    de: {
      title: "Gewichts-Constraints",
      intuition: "Intuition", formula: "Die Formel",
      constrVizTitle: "Gewichtsvektoren — vor vs nach",
      when: "Wann verwenden ? Wann nicht ?",
      selectLabel: "Auswahl:",
      practicalTip: "Praktischer Tipp",
      constrBefore: "Vor dem Constraint", constrAfter: "Nach dem Constraint",
      closeOutside: "(Klick außerhalb zum Schließen)",
      regen: "🔄 Neue Zufallsgewichte",
      paramExplain: "Konfigurierbare Parameter",
      paramExplainDesc: "Diese Werte beeinflussen die Visualisierung:"
    }
  };

  // ─── CONSTRAINT DATA ──────────────────────────────────────────────────

  var conData = {
    maxNorm: {
      en: {
        analogy: "Sets a maximum 'volume' on each weight vector. If a neuron's weights get too large (norm > limit), they're scaled down. This prevents any single neuron from dominating. Like a leash on weight growth.",
        tip: "Common in CNNs and RNNs to prevent exploding weights. Often used with dropout. Default max_norm value is usually 2 or 3.",
        when_use: "• Recurrent networks (prevents exploding)\n• With dropout (complementary regularization)\n• CNNs with many filters", when_not: "• If weights are already small (not needed)\n• NonNeg constraint may conflict"
      },
      de: {
        analogy: "Setzt ein maximales 'Volumen' für jeden Gewichtsvektor. Wenn die Gewichte eines Neurons zu groß werden (Norm > Limit), werden sie skaliert. Verhindert Dominanz einzelner Neuronen.",
        tip: "Üblich in CNNs und RNNs gegen explodierende Gewichte. Oft mit Dropout kombiniert. Standard max_norm ist meist 2 oder 3.",
        when_use: "• Recurrent Networks\n• Mit Dropout\n• CNNs mit vielen Filtern", when_not: "• Kleine Gewichte (nicht nötig)\n• NonNeg könnte Konflikt geben"
      },
      math: "W = \\begin{cases}W & \\|W\\| \\le m\\\\m \\cdot \\frac{W}{\\|W\\|} & \\|W\\| > m\\end{cases}",
      ctrl: { max_norm: { min: 0.1, max: 5, default: 2, step: 0.1, desc_en: "Maximum norm. Higher = allows larger weights.", desc_de: "Maximale Norm. Höher = erlaubt größere Gewichte." } },
      apply: function(ws, m) {
        var n = 0; for (var i = 0; i < ws.length; i++) n += ws[i] * ws[i];
        n = Math.sqrt(n); return n <= m ? ws.slice() : ws.map(function(w) { return w * m / n; });
      }
    },
    nonNeg: {
      en: {
        analogy: "The positivity enforcer: any negative weight is simply clipped to 0. This forces all connections to be 'excitatory' — no inhibitory signals. Useful when you know a feature should only positively contribute.",
        tip: "Useful in specific scenarios: e.g., when weights represent probabilities or counts. For most cases, let weights be both positive and negative.",
        when_use: "• When weights MUST be non-negative (physical constraints)\n• Interpretable models (positive contributions only)\n• Specific scientific/engineering domains", when_not: "• Most networks (limits expressiveness)\n• ReLU activations already filter negatives\n• You'll lose half the weight space"
      },
      de: {
        analogy: "Der Positivitäts-Durchsetzer: negative Gewichte werden auf 0 gesetzt. Alle Verbindungen sind 'erregend'. Nützlich, wenn Features nur positive Beiträge liefern sollen.",
        tip: "Nützlich wenn Gewichte physikalisch nicht negativ sein dürfen. In den meisten Fällen: lass Gewichte sowohl positiv als auch negativ sein.",
        when_use: "• Wenn Gewichte nicht negativ sein dürfen\n• Interpretierbare Modelle\n• Spezielle Wissenschaft/Technik", when_not: "• Meiste Netze (schränkt Ausdruckskraft ein)\n• ReLU filtert Negative bereits\n• Verlierst die Hälfte des Gewichtsraums"
      },
      math: "W_i = \\max(0, W_i)",
      ctrl: {},
      apply: function(ws) { return ws.map(function(w) { return Math.max(0, w); }); }
    },
    unitNorm: {
      en: {
        analogy: "Forces each weight vector to have exactly length 1. All weights are scaled to lie on the surface of a hypersphere. Direction matters, magnitude doesn't. Useful for cosine-similarity based models.",
        tip: "Used in Siamese networks, face recognition (CosFace, ArcFace), and when only angle/direction matters. Rarely used in standard feed-forward networks.",
        when_use: "• Siamese / triplet networks\n• Face recognition / metric learning\n• Cosine similarity based models", when_not: "• Standard classification (magnitude matters)\n• When weights need to grow/shrink to fit data\n• Most feed-forward networks"
      },
      de: {
        analogy: "Zwingt jeden Gewichtsvektor auf Länge 1. Alle Gewichte liegen auf einer Hypersphären-Oberfläche. Richtung zählt, Größe nicht. Nützlich für Cosine-Ähnlichkeit.",
        tip: "In Siamese Networks, Gesichtserkennung, wenn nur Winkel/Richtung zählt. Selten in Standard-FFN.",
        when_use: "• Siamese / Triplet Networks\n• Gesichtserkennung\n• Cosine-Ähnlichkeit", when_not: "• Standard-Klassifikation\n• Wenn Gewichte wachsen/schrumpfen müssen\n• Meiste Feed-Forward-Netze"
      },
      math: "W = \\frac{W}{\\|W\\|}",
      ctrl: {},
      apply: function(ws) {
        var n = 0; for (var i = 0; i < ws.length; i++) n += ws[i] * ws[i];
        n = Math.sqrt(n); return n === 0 ? ws.slice() : ws.map(function(w) { return w / n; });
      }
    },
    minMaxNorm: {
      en: {
        analogy: "Both floor and ceiling for weight norm. Weights below min_norm get scaled UP, weights above max_norm get scaled DOWN. Keeps all weight vectors in a specific norm range.",
        tip: "When you need both lower and upper bounds on weight norm. Rarely used — maxNorm alone is simpler.",
        when_use: "• When weights need both min and max norm bounds\n• Specialized regularization strategies", when_not: "• maxNorm alone is simpler\n• minNorm alone is very rare"
      },
      de: {
        analogy: "Sowohl Boden als auch Decke für die Gewichtsnorm. Gewichte unter min_norm werden HOCHSKALIERT, über max_norm RUNTERSKALIERT. Hält alle Vektoren in einem Normbereich.",
        tip: "Wenn sowohl untere als auch obere Normgrenzen nötig. Selten verwendet — maxNorm allein ist einfacher.",
        when_use: "• Wenn min UND max Normgrenzen nötig\n• Spezielle Regularisierungsstrategien", when_not: "• maxNorm allein ist einfacher"
      },
      math: "W = \\begin{cases}\\text{min} \\cdot \\frac{W}{\\|W\\|} & \\|W\\| < \\text{min}\\\\W & \\text{min} \\le \\|W\\| \\le \\text{max}\\\\\\text{max} \\cdot \\frac{W}{\\|W\\|} & \\|W\\| > \\text{max}\\end{cases}",
      ctrl: { min_norm: { min: 0, max: 3, default: 0.5, step: 0.1, desc_en: "Minimum norm floor.", desc_de: "Mindestnorm." }, max_norm: { min: 0.5, max: 5, default: 2, step: 0.1, desc_en: "Maximum norm ceiling.", desc_de: "Maximalnorm." } },
      apply: function(ws, mn, mx) {
        var n = 0; for (var i = 0; i < ws.length; i++) n += ws[i] * ws[i];
        n = Math.sqrt(n); if (n === 0) return ws.slice();
        if (n < mn) return ws.map(function(w) { return w * mn / n; });
        if (n > mx) return ws.map(function(w) { return w * mx / n; });
        return ws.slice();
      }
    }
  };

  // ─── BUILD POPUP ──────────────────────────────────────────────────────

  function buildPopup(name) {
    removePopup();
    _state.name = name;
    _state.ctrl = {};
    _constrPoints = null;

    var t = i18n[L()];
    var info = conData[name];
    if (!info) return;

    var ck = Object.keys(info.ctrl || {});
    for (var ci = 0; ci < ck.length; ci++) {
      _state.ctrl[ck[ci]] = info.ctrl[ck[ci]].default !== undefined ? info.ctrl[ck[ci]].default : 0;
    }

    var modal = _modalShell(t);
    var selRow = _selectorRow(modal, t);
    modal.appendChild(selRow);

    var content = document.createElement("div");
    content.id = _POPUP_ID + "_c";
    modal.appendChild(content);
    _rebuild(content, t);

    var overlay = document.createElement("div");
    overlay.id = _POPUP_ID;
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;" +
      "background:rgba(0,0,0,0.75);z-index:99999;display:flex;align-items:center;" +
      "justify-content:center;padding:16px;box-sizing:border-box;";
    overlay.onclick = function (e) { if (e.target === overlay) removePopup(); };
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.addEventListener("keydown", _escHandler);
    setTimeout(function () { _renderPlot(content); }, 50);
  }

  function _modalShell(t) {
    var m = document.createElement("div");
    m.style.cssText = "background:#1e1e2e;color:#cdd6f4;border-radius:16px;" +
      "width:min(97vw,1100px);max-height:94vh;overflow-y:auto;padding:24px 28px;" +
      "position:relative;box-shadow:0 30px 80px rgba(0,0,0,0.7);" +
      "font-family:'Segoe UI',system-ui,sans-serif;";

    var top = document.createElement("div");
    top.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;";
    var title = document.createElement("h2");
    title.textContent = t.title;
    title.style.cssText = "margin:0;color:#89b4fa;font-size:20px;";

    var closeBtn = document.createElement("button");
    closeBtn.innerHTML = "✕";
    closeBtn.style.cssText = "background:#f38ba8;border:none;color:#1e1e2e;font-size:18px;font-weight:bold;" +
      "width:34px;height:34px;border-radius:50%;cursor:pointer;display:flex;align-items:center;" +
      "justify-content:center;transition:transform 0.2s;flex-shrink:0;";
    closeBtn.onmouseenter = function () { closeBtn.style.transform = "scale(1.2)"; };
    closeBtn.onmouseleave = function () { closeBtn.style.transform = "scale(1)"; };
    closeBtn.onclick = removePopup;
    top.appendChild(title);
    top.appendChild(closeBtn);
    m.appendChild(top);

    var hint = document.createElement("div");
    hint.style.cssText = "font-size:10px;color:#585b70;text-align:right;margin-top:-12px;margin-bottom:8px;";
    hint.textContent = t.closeOutside;
    m.appendChild(hint);
    return m;
  }

  function _selectorRow(modal, t) {
    var row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap;";

    var label = document.createElement("span");
    label.style.cssText = "font-size:13px;color:#a6adc8;";
    label.textContent = t.selectLabel;
    row.appendChild(label);

    var sel = document.createElement("select");
    sel.style.cssText = "background:#45475a;color:#cdd6f4;border:1px solid #585b70;" +
      "border-radius:6px;padding:5px 8px;font-size:13px;cursor:pointer;flex:1;min-width:180px;";

    var keys = Object.keys(conData);
    for (var i = 0; i < keys.length; i++) {
      var o = document.createElement("option");
      o.value = keys[i];
      o.textContent = keys[i];
      if (_state.name === keys[i]) o.selected = true;
      sel.appendChild(o);
    }

    sel.onchange = function () {
      _state.name = this.value;
      _state.ctrl = {};
      _constrPoints = null;
      var info = conData[_state.name];
      var ck = Object.keys(info.ctrl || {});
      for (var ci = 0; ci < ck.length; ci++) {
        _state.ctrl[ck[ci]] = info.ctrl[ck[ci]].default !== undefined ? info.ctrl[ck[ci]].default : 0;
      }
      var c = document.getElementById(_POPUP_ID + "_c");
      if (c) { _rebuild(c, i18n[L()]); setTimeout(function () { _renderPlot(c); }, 50); }
    };

    row.appendChild(sel);
    return row;
  }

  function _rebuild(c, t) {
    c.innerHTML = "";
    var info = conData[_state.name];
    if (!info) return;
    var loc = L() === "de" ? info.de : info.en;
    var ck = Object.keys(info.ctrl || {});

    if (Object.keys(_state.ctrl).length === 0) {
      for (var ci = 0; ci < ck.length; ci++) _state.ctrl[ck[ci]] = info.ctrl[ck[ci]].default !== undefined ? info.ctrl[ck[ci]].default : 0;
    }

    var title = document.createElement("h3");
    title.textContent = _state.name;
    title.style.cssText = "margin:0 0 2px 0;color:#cdd6f4;font-size:18px;";
    c.appendChild(title);
    var cat = document.createElement("div");
    cat.style.cssText = "font-size:10px;color:#585b70;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;";
    cat.textContent = "Weight Constraint";
    c.appendChild(cat);

    var ih = _secH(t.intuition, "#f9e2af");
    c.appendChild(ih);
    var ibox = document.createElement("div");
    ibox.style.cssText = "background:#313244;border-radius:10px;padding:12px 14px;margin-bottom:6px;font-size:13px;line-height:1.7;border-left:4px solid #f9e2af;";
    ibox.textContent = loc.analogy;
    c.appendChild(ibox);
    if (loc.tip) {
      var tip = document.createElement("div");
      tip.style.cssText = "font-size:12px;color:#fab387;margin-bottom:14px;padding:0 4px;";
      tip.innerHTML = "💡 <b>" + t.practicalTip + ":</b> " + loc.tip;
      c.appendChild(tip);
    }

    if (info.math) {
      var fh = _secH(t.formula, "#89b4fa");
      c.appendChild(fh);
      var fbox = document.createElement("div");
      fbox.style.cssText = "background:#313244;border-radius:10px;padding:12px;margin-bottom:14px;border-left:4px solid #89b4fa;overflow-x:auto;text-align:center;";
      fbox.innerHTML = renderMathBlock(info.math);
      c.appendChild(fbox);
    }

    if (ck.length > 0) {
      var ph = _secH(t.paramExplain, "#fab387");
      c.appendChild(ph);
      var pbox = document.createElement("div");
      pbox.style.cssText = "background:#313244;border-radius:10px;padding:12px 14px;margin-bottom:14px;display:flex;flex-direction:column;gap:10px;";
      for (var ci = 0; ci < ck.length; ci++) {
        pbox.appendChild(_ctrlEl(ck[ci], info.ctrl[ck[ci]], c, t));
      }
      c.appendChild(pbox);
    }

    var plotH = _secH(t.constrVizTitle, "#a6e3a1");
    c.appendChild(plotH);
    var plotBox = document.createElement("div");
    plotBox.style.cssText = "background:#313244;border-radius:10px;padding:10px;margin-bottom:10px;";
    var plotDiv = document.createElement("div");
    plotDiv.id = _PLOT_ID;
    plotDiv.style.cssText = "width:100%;height:300px;";
    plotBox.appendChild(plotDiv);
    c.appendChild(plotBox);

    var btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;justify-content:center;margin-bottom:14px;";
    var regBtn = document.createElement("button");
    regBtn.textContent = t.regen;
    regBtn.style.cssText = "background:#45475a;color:#cdd6f4;border:1px solid #585b70;border-radius:8px;padding:6px 14px;font-size:12px;cursor:pointer;transition:background 0.2s;";
    regBtn.onmouseenter = function () { regBtn.style.background = "#585b70"; };
    regBtn.onmouseleave = function () { regBtn.style.background = "#45475a"; };
    regBtn.onclick = function () { _constrPoints = null; _renderPlot(c); };
    btnRow.appendChild(regBtn);
    c.appendChild(btnRow);

    if (loc.when_use || loc.when_not) {
      var wh = _secH(t.when, "#cba6f7");
      c.appendChild(wh);
      var wg = document.createElement("div");
      wg.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;";
      if (loc.when_use) {
        var ub = document.createElement("div");
        ub.style.cssText = "background:#313244;border-radius:10px;padding:10px 12px;border-left:4px solid #a6e3a1;font-size:12px;line-height:1.6;white-space:pre-wrap;";
        ub.textContent = loc.when_use;
        wg.appendChild(ub);
      }
      if (loc.when_not) {
        var nb = document.createElement("div");
        nb.style.cssText = "background:#313244;border-radius:10px;padding:10px 12px;border-left:4px solid #f38ba8;font-size:12px;line-height:1.6;white-space:pre-wrap;";
        nb.textContent = loc.when_not;
        wg.appendChild(nb);
      }
      c.appendChild(wg);
    }
  }

  function _secH(text, color) {
    var h = document.createElement("h4");
    h.textContent = text;
    h.style.cssText = "color:" + color + ";margin:14px 0 6px 0;font-size:14px;";
    return h;
  }

  function _ctrlEl(key, def, contentContainer, t) {
    var wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;flex-direction:column;gap:3px;";
    var label = document.createElement("div");
    label.style.cssText = "font-size:11px;color:#a6adc8;font-family:monospace;";
    label.textContent = key;
    wrap.appendChild(label);

    if (def.options) {
      var sel = document.createElement("select");
      sel.style.cssText = "background:#45475a;color:#cdd6f4;border:1px solid #585b70;border-radius:4px;padding:3px 5px;font-size:12px;cursor:pointer;max-width:200px;";
      for (var oi = 0; oi < def.options.length; oi++) {
        var opt = document.createElement("option");
        opt.value = def.options[oi];
        opt.textContent = def.options[oi];
        if (_state.ctrl[key] === def.options[oi]) opt.selected = true;
        sel.appendChild(opt);
      }
      wrap.appendChild(sel);
      sel.onchange = function () { _state.ctrl[key] = this.value; _onChange(contentContainer, t); };
    } else {
      var inner = document.createElement("div");
      inner.style.cssText = "display:flex;align-items:center;gap:6px;";
      var range = document.createElement("input");
      range.type = "range";
      range.min = def.min;
      range.max = def.max;
      range.step = def.step;
      range.value = _state.ctrl[key] !== undefined ? _state.ctrl[key] : def.default;
      range.style.cssText = "flex:1;accent-color:#89b4fa;height:4px;cursor:pointer;max-width:200px;";
      var num = document.createElement("input");
      num.type = "number";
      num.min = def.min;
      num.max = def.max;
      num.step = def.step;
      num.value = _state.ctrl[key] !== undefined ? _state.ctrl[key] : def.default;
      num.style.cssText = "width:68px;background:#45475a;color:#cdd6f4;border:1px solid #585b70;border-radius:4px;padding:2px 5px;font-size:12px;text-align:right;";

      var update = function () { var v = parseFloat(num.value); if (!isNaN(v)) { v = clamp(v, def.min, def.max); range.value = v; _state.ctrl[key] = v; _onChange(contentContainer, t); } };
      range.oninput = function () { num.value = this.value; _state.ctrl[key] = parseFloat(this.value); _onChange(contentContainer, t); };
      num.oninput = update;
      inner.appendChild(range);
      inner.appendChild(num);
      wrap.appendChild(inner);
    }
    return wrap;
  }

  function _onChange(c, t) { _renderPlot(c); }

  // ─── RENDER PLOT ──────────────────────────────────────────────────────

  function _renderPlot(c) {
    var pd = document.getElementById(_PLOT_ID);
    if (!pd) return;
    if (typeof Plotly === "undefined") { pd.textContent = "[Plotly not loaded]"; return; }
    _renderConstrPlot(pd);
  }

  function _renderConstrPlot(pd) {
    var info = conData[_state.name];
    if (!info || !info.apply) { pd.innerHTML = ""; return; }

    if (!_constrPoints) {
      _constrPoints = [];
      for (var i = 0; i < 20; i++) {
        _constrPoints.push([(Math.random() * 5) - 2.5, (Math.random() * 5) - 2.5]);
      }
    }
    var before = _constrPoints;
    var after = [];

    var ctrl = _state.ctrl;
    for (var i = 0; i < before.length; i++) {
      var w = before[i];
      var res;
      if (_state.name === "maxNorm") res = info.apply(w, ctrl.max_norm);
      else if (_state.name === "minMaxNorm") res = info.apply(w, ctrl.min_norm, ctrl.max_norm);
      else res = info.apply(w);
      after.push(res);
    }

    var changed = 0;
    for (var i = 0; i < before.length; i++) {
      if (before[i][0] !== after[i][0] || before[i][1] !== after[i][1]) changed++;
    }

    var maxR = 3.5;
    var bx = before.map(function(p){return p[0];}), by = before.map(function(p){return p[1];});
    var ax = after.map(function(p){return p[0];}), ay = after.map(function(p){return p[1];});

    var extras = [];
    if (_state.name === "maxNorm") {
      var r = ctrl.max_norm;
      var a = getXGrid(0, 2 * Math.PI, 80); var cx = [], cy = [];
      for (var i = 0; i < a.length; i++) { cx.push(r * Math.cos(a[i])); cy.push(r * Math.sin(a[i])); }
      extras.push({ x: cx, y: cy, type: "scatter", mode: "lines", name: "max_norm boundary", line: { color: "#f38ba8", width: 2, dash: "dot" }, hoverinfo: "none" });
    } else if (_state.name === "unitNorm") {
      var a = getXGrid(0, 2 * Math.PI, 80); var cx = [], cy = [];
      for (var i = 0; i < a.length; i++) { cx.push(Math.cos(a[i])); cy.push(Math.sin(a[i])); }
      extras.push({ x: cx, y: cy, type: "scatter", mode: "lines", name: "unit circle", line: { color: "#f38ba8", width: 2, dash: "dot" }, hoverinfo: "none" });
    } else if (_state.name === "minMaxNorm") {
      var a = getXGrid(0, 2 * Math.PI, 80);
      var cx1 = [], cy1 = [], cx2 = [], cy2 = [];
      for (var i = 0; i < a.length; i++) { cx1.push(ctrl.min_norm * Math.cos(a[i])); cy1.push(ctrl.min_norm * Math.sin(a[i])); cx2.push(ctrl.max_norm * Math.cos(a[i])); cy2.push(ctrl.max_norm * Math.sin(a[i])); }
      extras.push({ x: cx1, y: cy1, type: "scatter", mode: "lines", name: "min_norm", line: { color: "#585b70", width: 1, dash: "dot" }, hoverinfo: "none" });
      extras.push({ x: cx2, y: cy2, type: "scatter", mode: "lines", name: "max_norm", line: { color: "#f38ba8", width: 2, dash: "dot" }, hoverinfo: "none" });
    }
    if (_state.name === "nonNeg") {
      extras.push({ x: [0, 0], y: [-maxR, maxR], type: "scatter", mode: "lines", name: "nonNeg boundary", line: { color: "#f38ba8", width: 2, dash: "dot" }, hoverinfo: "none" });
    }

    var beforeTrace = { x: bx, y: by, type: "scatter", mode: "markers", name: i18n[L()].constrBefore + " (" + before.length + ")", marker: { color: "#f38ba8", size: 7, opacity: 0.5 } };
    var afterTrace = { x: ax, y: ay, type: "scatter", mode: "markers", name: i18n[L()].constrAfter + " (" + after.length + ")", marker: { color: "#a6e3a1", size: 8, opacity: 0.9, symbol: "x" } };

    var lx = [], ly = [];
    for (var i = 0; i < before.length; i++) {
      lx.push(before[i][0], after[i][0], null);
      ly.push(before[i][1], after[i][1], null);
    }
    var connTrace = { x: lx, y: ly, type: "scatter", mode: "lines", line: { color: "#585b70", width: 0.8 }, hoverinfo: "none", showlegend: false };

    var traces = [connTrace].concat(extras).concat([beforeTrace, afterTrace]);

    var lo = {
      paper_bgcolor: "#313244", plot_bgcolor: "#313244", font: { color: "#cdd6f4", size: 11 },
      margin: { l: 50, r: 16, t: 8, b: 40 },
      xaxis: { title: { text: "w₁", font: { color: "#a6adc8", size: 11 } }, gridcolor: "#45475a", zerolinecolor: "#585b70", range: [-maxR, maxR], scaleanchor: "y", scaleratio: 1 },
      yaxis: { title: { text: "w₂", font: { color: "#a6adc8", size: 11 } }, gridcolor: "#45475a", zerolinecolor: "#585b70", range: [-maxR, maxR] },
      legend: { orientation: "h", xanchor: "center", x: 0.5, y: 1.15, font: { size: 10, color: "#cdd6f4" } },
      annotations: [{ x: 0.98, y: 0.02, xref: "paper", yref: "paper", text: changed + "/" + before.length + " vectors affected", showarrow: false, font: { size: 10, color: "#585b70" }, align: "right" }]
    };

    try { Plotly.newPlot(pd, traces, lo, { responsive: true, displayModeBar: false }); } catch (e) {}
  }

  // ─── REMOVE POPUP ─────────────────────────────────────────────────────

  function removePopup() {
    var overlay = document.getElementById(_POPUP_ID);
    if (overlay) {
      var pd = document.getElementById(_PLOT_ID);
      if (pd && typeof Plotly !== "undefined") { try { Plotly.purge(pd); } catch (e) {} }
      overlay.remove();
    }
    document.removeEventListener("keydown", _escHandler);
  }

  // ─── INJECT ICONS ─────────────────────────────────────────────────────

  function mkBtn(selGetter) {
    var btn = document.createElement("img");
    btn.src = "_gui/icons/info.svg";
    btn.alt = "?";
    btn.style.cssText = "height:18px;width:auto;cursor:pointer;margin-left:3px;vertical-align:middle;transition:transform 0.2s,opacity 0.2s;display:inline-block;opacity:0.55;";
    btn.title = (L() === "de") ? "Was macht das?" : "What does this do?";
    btn.onmouseenter = function () { btn.style.transform = "scale(1.2) rotate(8deg)"; btn.style.opacity = "0.9"; };
    btn.onmouseleave = function () { btn.style.transform = "scale(1)"; btn.style.opacity = "0.55"; };
    btn.onclick = function (e) { e.preventDefault(); e.stopPropagation(); var s = selGetter(); if (s) buildPopup(s); };
    return btn;
  }

  function injectIcon(sel) {
    if (sel.dataset.conInfoInjected) return;
    sel.dataset.conInfoInjected = "true";
    var btn = mkBtn(function () { return sel.value; });
    var tr = sel.closest("tr");
    if (tr) {
      var ft = tr.querySelector("td:first-child");
      if (ft) { ft.appendChild(btn); return; }
    }
    sel.parentNode.insertBefore(btn, sel);
  }

  function injectAll() {
    var sel = document.querySelectorAll("select.input_data, select.input_field");
    for (var i = 0; i < sel.length; i++) {
      var c = sel[i].className;
      if (c.indexOf("_constraint") !== -1) injectIcon(sel[i]);
    }
  }

  function watch() {
    injectAll();
    var target = document.getElementById("layers_container");
    if (!target) { setTimeout(watch, 500); return; }
    var obs = new MutationObserver(function () { injectAll(); });
    obs.observe(target, { childList: true, subtree: true, attributes: false });
  }

  function init() {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch);
    else watch();
  }

  init();

})();
