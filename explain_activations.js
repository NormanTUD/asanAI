(function() {

  var _POPUP_ID = "explain_activation_popup_overlay";
  var _PLOT_ID = "explain_activation_plot";
  var _DEMO_ID = "explain_activation_demo";

  var _state = { name: "relu", ctrl: {} };

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

  var i18n = {
    en: {
      title: "Activation Functions",
      intuition: "Intuition", formula: "The Formula",
      plotTitle: "Function & Derivative", derivative: "Derivative",
      signalDemo: "Live Demo: Signal Transformation",
      signalDemoDesc: "See how this activation function transforms a real input signal (blue sine wave → green output)",
      when: "When to use ? When not ?",
      selectLabel: "Choose:",
      practicalTip: "Practical tip",
      closeOutside: "(click outside to close)",
      paramExplain: "Configurable Parameters",
      paramExplainDesc: "These values affect the visualization:"
    },
    de: {
      title: "Aktivierungsfunktionen",
      intuition: "Intuition", formula: "Die Formel",
      plotTitle: "Funktion & Ableitung", derivative: "Ableitung",
      signalDemo: "Live-Demo: Signal-Transformation",
      signalDemoDesc: "Sieh, wie diese Aktivierungsfunktion ein Eingangssignal verändert (blau → grün)",
      when: "Wann verwenden ? Wann nicht ?",
      selectLabel: "Auswahl:",
      practicalTip: "Praktischer Tipp",
      closeOutside: "(Klick außerhalb zum Schließen)",
      paramExplain: "Konfigurierbare Parameter",
      paramExplainDesc: "Diese Werte beeinflussen die Visualisierung:"
    }
  };

  var actData = {
    relu: {
      en: {
        analogy: "The gatekeeper: let positive signals through, block negatives entirely. Simple, fast, and the default for 90% of modern neural networks. Solves the vanishing gradient problem of sigmoid/tanh.",
        tip: "If in doubt, use ReLU. It's the default choice for hidden layers in CNNs, Transformers, and MLPs. Watch out for 'dying ReLU' where too many neurons get stuck at 0.",
        when_use: "• DEFAULT for hidden layers in most architectures\n• CNNs, Transformers, MLPs\n• Works great with He initialization\n• Fast to compute", when_not: "• Output layer: use softmax (classification) or linear (regression)\n• Very deep networks: consider ELU or Swish\n• If many neurons die (stay 0): try LeakyReLU"
      },
      de: {
        analogy: "Der Türsteher: positive Signale durchlassen, negative komplett blockieren. Einfach, schnell und Standard für 90% aller modernen Netze. Löst das Problem der verschwindenden Gradienten bei Sigmoid/tanh.",
        tip: "Im Zweifel ReLU nehmen. Standard für Hidden-Layer in CNNs, Transformern und MLPs.",
        when_use: "• STANDARD für Hidden-Layer\n• CNNs, Transformer, MLPs\n• Funktioniert mit He-Initialisierung\n• Schnell berechnet", when_not: "• Output-Layer: softmax (Klassifikation) / linear (Regression)\n• Sehr tiefe Netze: ELU oder Swish\n• Falls viele Neuronen sterben: LeakyReLU"
      },
      math: "f(x) = \\max(0, x)\\quad f'(x) = \\begin{cases}1 & x > 0\\\\0 & x \\le 0\\end{cases}",
      fn: function(x) { return Math.max(0, x); },
      dfn: function(x) { return x > 0 ? 1 : 0; },
      ctrl: {}
    },
    linear: {
      en: {
        analogy: "The transparent layer: output = input, no transformation. Used almost exclusively in the output layer for regression tasks. Never use in hidden layers — it makes the whole network equivalent to a single layer!",
        tip: "Hidden layers MUST have a non-linear activation. Linear hidden layers collapse the network into a single linear transformation — no deep learning happens.",
        when_use: "• Output layer for regression (predicting continuous values)\n• When you want raw logits (before softmax)", when_not: "• NEVER in hidden layers (defeats deep learning)\n• Classification output (use softmax instead)"
      },
      de: {
        analogy: "Die transparente Schicht: Ausgabe = Eingabe, keine Transformation. Fast nur in der Ausgabeschicht für Regression. NIEMALS in versteckten Schichten — das macht das Netz zu einer einzigen linearen Transformation!",
        tip: "Hidden-Layer MÜSSEN nichtlinear sein. Lineare Hidden-Layer machen das Netz zu einer einzelnen linearen Transformation — kein Deep Learning.",
        when_use: "• Output-Layer für Regression\n• Für rohe Logits (vor Softmax)", when_not: "• NIEMALS in Hidden-Layern\n• Klassifikation: Softmax verwenden"
      },
      math: "f(x) = x\\quad f'(x) = 1",
      fn: function(x) { return x; },
      dfn: function(x) { return 1; },
      ctrl: {}
    },
    sigmoid: {
      en: {
        analogy: "The pressure plate: maps any input to a value between 0 and 1. Gentle slope near 0, extreme values saturate to 0 or 1. Great for probabilities, but suffers from vanishing gradients in deep networks.",
        tip: "Sigmoid is historic. Use it for binary classification outputs or when you need probabilities. For hidden layers, ReLU is almost always better.",
        when_use: "• Binary classification output (probability)\n• When output MUST be between 0 and 1\n• Gating mechanisms in LSTMs", when_not: "• Hidden layers (vanishing gradient!)\n• Deep networks (>2 layers)\n• ReLU is almost always better for hidden layers"
      },
      de: {
        analogy: "Die Druckplatte: bildet jeden Eingang auf einen Wert zwischen 0 und 1 ab. Sanfte Steigung nahe 0, extreme Werte sättigen auf 0 oder 1. Gut für Wahrscheinlichkeiten, aber leidet unter verschwindenden Gradienten.",
        tip: "Sigmoid ist historisch. Für Binärklassifikation oder Wahrscheinlichkeiten. In Hidden-Layern ist ReLU fast immer besser.",
        when_use: "• Binärklassifikation (Wahrscheinlichkeit)\n• Wenn Ausgabe zwischen 0 und 1 sein muss\n• Gate-Mechanismen in LSTMs", when_not: "• Hidden-Layer (verschwindende Gradienten!)\n• Tiefe Netze (>2 Layer)\n• ReLU fast immer besser"
      },
      math: "f(x) = \\frac{1}{1 + e^{-x}}\\quad f'(x) = f(x)(1 - f(x))",
      fn: function(x) { return 1 / (1 + Math.exp(-x)); },
      dfn: function(x) { var s = 1 / (1 + Math.exp(-x)); return s * (1 - s); },
      ctrl: {}
    },
    elu: {
      en: {
        analogy: "ReLU's sophisticated cousin: keeps the ReLU behavior for positives, but smooths out the negative part with an exponential curve. No dying neurons, but slightly more expensive to compute.",
        tip: "Good for deeper networks where dying ReLU is a problem. The alpha parameter controls how negative values can go.",
        when_use: "• Deeper networks (>20 layers)\n• When dying ReLU is observed\n• Better gradient flow than ReLU", when_not: "• Shallow networks: ReLU is simpler and faster\n• Need for speed: ReLU is cheaper"
      },
      de: {
        analogy: "ReLUs anspruchsvollerer Cousin: behält ReLU-Verhalten für Positive, glättet Negative mit Exponentialkurve. Keine sterbenden Neuronen, aber etwas teurer.",
        tip: "Gut für tiefere Netze, wenn ReLU-Neuronen sterben. Alpha steuert, wie negativ Werte werden dürfen.",
        when_use: "• Tiefere Netze (>20 Layer)\n• Wenn ReLU-Neuronen sterben\n• Bessere Gradienten als ReLU", when_not: "• Flache Netze: ReLU einfacher\n• Geschwindigkeit: ReLU günstiger"
      },
      math: "f(x) = \\begin{cases}x & x > 0\\\\\\alpha(e^x - 1) & x \\le 0\\end{cases}\\quad f'(x) = \\begin{cases}1 & x > 0\\\\\\alpha e^x & x \\le 0\\end{cases}",
      fn: function(x, a) { var al = a !== undefined ? a : 1; return x > 0 ? x : al * (Math.exp(x) - 1); },
      dfn: function(x, a) { var al = a !== undefined ? a : 1; return x > 0 ? 1 : al * Math.exp(x); },
      ctrl: { alpha: { min: 0.1, max: 2, default: 1, step: 0.05, desc_en: "Controls negative saturation point. Higher = more negative values flow.", desc_de: "Steuert negative Sättigung. Höher = mehr negative Werte fließen." } }
    },
    relu6: {
      en: {
        analogy: "ReLU with a ceiling: same as ReLU, but values are clipped at 6. Used in MobileNets and quantized models where you want bounded activations.",
        tip: "Great for mobile/quantized models. The cap at 6 keeps numbers small so they fit in low-precision (e.g. 8-bit) arithmetic.",
        when_use: "• MobileNets / efficient architectures\n• Models that will be quantized (int8)\n• When bounded activations needed", when_not: "• Standard desktop/server models: regular ReLU is fine\n• If you need unbounded outputs"
      },
      de: {
        analogy: "ReLU mit Deckel: wie ReLU, aber Werte werden bei 6 gedeckelt. In MobileNets und quantisierten Modellen nützlich.",
        tip: "Gut für mobile/quantisierte Modelle. Der Deckel bei 6 hält Zahlen klein für 8-Bit-Arithmetik.",
        when_use: "• MobileNets / effiziente Architekturen\n• Modelle für Quantisierung (int8)\n• Wenn begrenzte Aktivierungen nötig", when_not: "• Normale Desktop/Server-Modelle: ReLU reicht\n• Wenn unbegrenzte Ausgaben nötig"
      },
      math: "f(x) = \\min(\\max(0, x), 6)\\quad f'(x) = \\begin{cases}1 & 0 < x < 6\\\\0 & \\text{sonst}\\end{cases}",
      fn: function(x) { return Math.min(Math.max(0, x), 6); },
      dfn: function(x) { return x > 0 && x < 6 ? 1 : 0; },
      ctrl: {}
    },
    selu: {
      en: {
        analogy: "Self-Normalizing ELU: automatically keeps the mean of activations near 0 and variance near 1 through the whole network. Designed for SNNs (Self-Normalizing Neural Networks). Requires LeCunNormal init.",
        tip: "Requires LeCunNormal initialization and AlphaDropout. If you don't use both, SELU won't self-normalize! Use for fully connected SNNs.",
        when_use: "• Self-Normalizing Neural Networks (SNNs)\n• Fully connected networks with alpha dropout\n• When automatic normalization is desired", when_not: "• Without LeCunNormal init (won't normalize!)\n• CNNs (not designed for conv layers)\n• Standard ReLU networks work just as well"
      },
      de: {
        analogy: "Selbstnormalisierende ELU: hält automatisch Mittelwert nahe 0 und Varianz nahe 1 durchs ganze Netz. Für SNNs entwickelt. Benötigt LeCunNormal-Init.",
        tip: "Erfordert LeCunNormal-Init und AlphaDropout. Ohne beides normalisiert SELU nicht!",
        when_use: "• Self-Normalizing Neural Networks\n• Fully-Connected-Netze mit AlphaDropout\n• Wenn automatische Normalisierung gewünscht", when_not: "• Ohne LeCunNormal-Init\n• CNNs (nicht für Conv-Layer)\n• ReLU-Netze funktionieren genauso gut"
      },
      math: "f(x) = \\lambda\\begin{cases}x & x > 0\\\\\\alpha(e^x - 1) & x \\le 0\\end{cases}\\quad \\lambda \\approx 1.0507,\\; \\alpha \\approx 1.6733",
      fn: function(x) { var la = 1.0507009873554805, al = 1.6732632423543784; return x > 0 ? la * x : la * al * (Math.exp(x) - 1); },
      dfn: function(x) { var la = 1.0507009873554805, al = 1.6732632423543784; return x > 0 ? la : la * al * Math.exp(x); },
      ctrl: {}
    },
    softplus: {
      en: {
        analogy: "A smooth, differentiable version of ReLU. No hard kink at 0, but also never exactly 0. Rarely used in practice — ReLU is preferred for its sparsity.",
        tip: "Softplus is mainly interesting theoretically as a 'smooth ReLU'. In practice, almost always use ReLU instead.",
        when_use: "• When a smooth, always-positive activation is needed\n• Theoretical/educational contexts", when_not: "• Almost always: ReLU is better (sparse, fast)\n• No performance advantage"
      },
      de: {
        analogy: "Eine glatte, differenzierbare Version von ReLU. Kein harter Knick bei 0, aber auch nie exakt 0. Selten verwendet — ReLU ist wegen der Sparsität bevorzugt.",
        tip: "Softplus ist hauptsächlich theoretisch interessant. In der Praxis fast immer ReLU verwenden.",
        when_use: "• Wenn glatte, immer positive Aktivierung nötig\n• Theoretische/pädagogische Kontexte", when_not: "• Fast immer: ReLU ist besser (spärlich, schnell)"
      },
      math: "f(x) = \\ln(1 + e^x)\\quad f'(x) = \\frac{1}{1 + e^{-x}} = \\sigma(x)",
      fn: function(x) { return Math.log(1 + Math.exp(x)); },
      dfn: function(x) { return 1 / (1 + Math.exp(-x)); },
      ctrl: {}
    },
    softsign: {
      en: {
        analogy: "Like tanh but with a gentler slope and polynomial tails instead of exponential. Outputs between -1 and 1, but saturates more slowly than tanh.",
        tip: "Rarely used. If you need a tanh-like activation, tanh itself is usually preferred.",
        when_use: "• When slower saturation than tanh is desired\n• Alternative to tanh in very specific architectures", when_not: "• tanh is more common and well-tested\n• ReLU variants dominate modern practice"
      },
      de: {
        analogy: "Wie tanh, aber sanfterer Abfall und polynomiale Enden statt exponentieller. Ausgabe zwischen -1 und 1, aber sättigt langsamer als tanh.",
        tip: "Selten verwendet. Falls eine tanh-ähnliche Aktivierung nötig, ist tanh selbst meist besser.",
        when_use: "• Wenn langsamere Sättigung als tanh gewünscht\n• Alternative in speziellen Architekturen", when_not: "• tanh ist verbreiteter und getesteter\n• ReLU-Varianten dominieren"
      },
      math: "f(x) = \\frac{x}{1 + |x|}\\quad f'(x) = \\frac{1}{(1 + |x|)^2}",
      fn: function(x) { return x / (1 + Math.abs(x)); },
      dfn: function(x) { var d = 1 + Math.abs(x); return 1 / (d * d); },
      ctrl: {}
    },
    softmax: {
      en: {
        analogy: "The democracy: turns a vector of raw scores into a probability distribution that sums to 1. Each value gets e^x'd, then divided by the total. The highest score gets the largest share. Used in the output layer for multi-class classification.",
        tip: "ALWAYS use in the output layer for multi-class classification with categorical crossentropy loss. Never use in hidden layers (destroys relative information).",
        when_use: "• Output layer for multi-class classification\n• When you need a probability distribution over categories\n• Attention mechanisms in Transformers", when_not: "• Hidden layers (loses information)\n• Binary classification: sigmoid instead\n• Regression: linear instead"
      },
      de: {
        analogy: "Die Demokratie: wandelt rohe Bewertungen in eine Wahrscheinlichkeitsverteilung (Summe=1). Jeder Wert wird e^x, dann durch die Gesamtsumme geteilt. Für Mehrklassen-Klassifikation.",
        tip: "IMMER in der Ausgabeschicht für Mehrklassen-Klassifikation mit Categorical Crossentropy. Nie in Hidden-Layern.",
        when_use: "• Output für Mehrklassen-Klassifikation\n• Wenn Wahrscheinlichkeitsverteilung nötig\n• Attention-Mechanismen", when_not: "• Hidden-Layer\n• Binärklassifikation: Sigmoid\n• Regression: Linear"
      },
      math: "f(x_i) = \\frac{e^{x_i}}{\\sum_{j} e^{x_j}}",
      fn: null,
      dfn: null,
      ctrl: {}
    },
    tanh: {
      en: {
        analogy: "The centering force: maps input to [-1, 1], zero-centered like a nicer sigmoid. Strong gradients near 0, saturation at extremes. Was the default before ReLU took over.",
        tip: "Zero-centered output is its advantage over sigmoid. Still used in RNNs/LSTMs (cell gates) and some autoencoders. ReLU is better for most hidden layers though.",
        when_use: "• RNNs / LSTMs (cell and gate activations)\n• Autoencoders\n• When zero-centered activation is beneficial\n• Output for [-1, 1] range", when_not: "• Most hidden layers: ReLU is better\n• Very deep networks (vanishing gradient)\n• Binary classification output: sigmoid gives proper probabilities"
      },
      de: {
        analogy: "Die Zentrierkraft: bildet auf [-1, 1] ab, null-zentriert wie ein netterer Sigmoid. Starke Gradienten nahe 0, Sättigung an den Enden. War Standard vor ReLU.",
        tip: "Null-zentrierte Ausgabe ist der Vorteil gegenüber Sigmoid. Noch in RNNs/LSTMs und Autoencodern. ReLU ist für Hidden-Layer besser.",
        when_use: "• RNNs / LSTMs\n• Autoencoder\n• Wenn null-zentrierte Aktivierung nützt\n• Ausgabe für [-1, 1]", when_not: "• Meiste Hidden-Layer: ReLU besser\n• Sehr tiefe Netze\n• Binärklassifikation: Sigmoid"
      },
      math: "f(x) = \\frac{e^x - e^{-x}}{e^x + e^{-x}}\\quad f'(x) = 1 - f(x)^2",
      fn: function(x) { return Math.tanh(x); },
      dfn: function(x) { var t = Math.tanh(x); return 1 - t * t; },
      ctrl: {}
    }
  };

  // ─── BUILD POPUP ──────────────────────────────────────────────────────

  function buildPopup(name) {
    removePopup();
    _state.name = name;
    _state.ctrl = {};

    var t = i18n[L()];
    var info = actData[name];
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
    setTimeout(function () { _renderPlots(content); }, 50);
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

    var keys = Object.keys(actData);
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
      var info = actData[_state.name];
      var ck = Object.keys(info.ctrl || {});
      for (var ci = 0; ci < ck.length; ci++) {
        _state.ctrl[ck[ci]] = info.ctrl[ck[ci]].default !== undefined ? info.ctrl[ck[ci]].default : 0;
      }
      var c = document.getElementById(_POPUP_ID + "_c");
      if (c) { _rebuild(c, i18n[L()]); setTimeout(function () { _renderPlots(c); }, 50); }
    };

    row.appendChild(sel);
    return row;
  }

  function _rebuild(c, t) {
    c.innerHTML = "";
    var info = actData[_state.name];
    if (!info) return;
    var loc = L() === "de" ? info.de : info.en;
    var ck = Object.keys(info.ctrl || {});

    if (Object.keys(_state.ctrl).length === 0) {
      for (var ci = 0; ci < ck.length; ci++) _state.ctrl[ck[ci]] = info.ctrl[ck[ci]].default !== undefined ? info.ctrl[ck[ci]].default : 0;
    }

    var title = document.createElement("h3");
    title.textContent = _state.name + "()";
    title.style.cssText = "margin:0 0 2px 0;color:#cdd6f4;font-size:18px;";
    c.appendChild(title);
    var cat = document.createElement("div");
    cat.style.cssText = "font-size:10px;color:#585b70;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;";
    cat.textContent = "Activation Function";
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

    var plotH = _secH(t.plotTitle, "#a6e3a1");
    c.appendChild(plotH);
    var plotBox = document.createElement("div");
    plotBox.style.cssText = "background:#313244;border-radius:10px;padding:10px;margin-bottom:10px;";
    var plotDiv = document.createElement("div");
    plotDiv.id = _PLOT_ID;
    plotDiv.style.cssText = "width:100%;height:260px;";
    plotBox.appendChild(plotDiv);
    c.appendChild(plotBox);

    if (info.fn !== null) {
      var dh = _secH(t.signalDemo, "#fab387");
      c.appendChild(dh);
      var ddesc = document.createElement("div");
      ddesc.style.cssText = "font-size:11px;color:#585b70;margin-bottom:6px;font-style:italic;";
      ddesc.textContent = t.signalDemoDesc;
      c.appendChild(ddesc);
      var demoBox = document.createElement("div");
      demoBox.style.cssText = "background:#313244;border-radius:10px;padding:10px;margin-bottom:14px;";
      var demoDiv = document.createElement("div");
      demoDiv.id = _DEMO_ID;
      demoDiv.style.cssText = "width:100%;height:180px;";
      demoBox.appendChild(demoDiv);
      c.appendChild(demoBox);
    }

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

  function _onChange(c, t) { _renderPlots(c); }

  // ─── RENDER PLOTS ─────────────────────────────────────────────────────

  function _renderPlots(c) {
    var pd = document.getElementById(_PLOT_ID);
    if (!pd) return;
    if (typeof Plotly === "undefined") { pd.textContent = "[Plotly not loaded]"; return; }
    _renderActPlot(pd);
    var dd = document.getElementById(_DEMO_ID);
    if (dd) _renderActDemo(dd);
  }

  function _renderActPlot(pd) {
    var info = actData[_state.name];
    if (!info) return;
    if (info.fn === null) {
      Plotly.newPlot(pd, [], { paper_bgcolor: "#313244", plot_bgcolor: "#313244", font: { color: "#cdd6f4", size: 11 }, xaxis: { visible: false }, yaxis: { visible: false }, annotations: [{ x: 0.5, y: 0.5, xref: "paper", yref: "paper", text: _state.name + " operates on a full vector — cannot plot as 1D function. See the formula above.", showarrow: false, font: { size: 13, color: "#a6adc8" } }] }, { responsive: true, displayModeBar: false });
      return;
    }

    var x = getXGrid(-6, 6, 300);
    var y = [], dy = [];
    var alphaVal = _state.ctrl.alpha !== undefined ? _state.ctrl.alpha : undefined;
    for (var i = 0; i < x.length; i++) {
      y.push(info.fn(x[i], alphaVal));
      dy.push(info.dfn(x[i], alphaVal));
    }

    var fnTrace = { x: x, y: y, type: "scatter", mode: "lines", name: "f(x)", line: { color: "#89b4fa", width: 3 } };
    var dfTrace = { x: x, y: dy, type: "scatter", mode: "lines", name: "f'(x)", line: { color: "#f38ba8", width: 2, dash: "dash" } };
    var zeroLine = { x: x, y: x.map(function(){return 0;}), type: "scatter", mode: "lines", line: { color: "#585b70", width: 1 }, hoverinfo: "none", showlegend: false };

    var lo = {
      paper_bgcolor: "#313244", plot_bgcolor: "#313244", font: { color: "#cdd6f4", size: 11 },
      margin: { l: 50, r: 16, t: 8, b: 40 },
      xaxis: { title: { text: "x", font: { color: "#a6adc8", size: 11 } }, gridcolor: "#45475a", zerolinecolor: "#585b70", range: [-6.5, 6.5] },
      yaxis: { title: { text: "f(x)", font: { color: "#a6adc8", size: 11 } }, gridcolor: "#45475a", zerolinecolor: "#585b70" },
      legend: { orientation: "h", xanchor: "center", x: 0.5, y: 1.15, font: { size: 10, color: "#cdd6f4" } }
    };

    var refKey = "α=" + (alphaVal !== undefined ? alphaVal.toFixed(2) : "—");
    lo.annotations = [{ x: 0.98, y: 0.95, xref: "paper", yref: "paper", text: refKey, showarrow: false, font: { size: 10, color: "#585b70" }, align: "right" }];

    try { Plotly.newPlot(pd, [zeroLine, fnTrace, dfTrace], lo, { responsive: true, displayModeBar: false }); } catch (e) {}
  }

  function _renderActDemo(dd) {
    var info = actData[_state.name];
    if (!info || info.fn === null) { dd.innerHTML = ""; return; }

    var x = getXGrid(-6, 6, 200);
    var alphaVal = _state.ctrl.alpha !== undefined ? _state.ctrl.alpha : undefined;
    var signal = [];
    for (var i = 0; i < x.length; i++) {
      signal.push(2.5 * Math.sin(x[i]) + 1.2 * Math.sin(2.5 * x[i] + 1));
    }
    var transformed = [];
    for (var i = 0; i < signal.length; i++) {
      transformed.push(info.fn(signal[i], alphaVal));
    }

    var inputTrace = { x: x, y: signal, type: "scatter", mode: "lines", name: "Input signal", line: { color: "#89b4fa", width: 2, opacity: 0.6 } };
    var outputTrace = { x: x, y: transformed, type: "scatter", mode: "lines", name: "After " + _state.name + "()", line: { color: "#a6e3a1", width: 3 } };
    var zeroLine = { x: x, y: x.map(function(){return 0;}), type: "scatter", mode: "lines", line: { color: "#585b70", width: 1 }, hoverinfo: "none", showlegend: false };

    var lo = {
      paper_bgcolor: "#313244", plot_bgcolor: "#313244", font: { color: "#cdd6f4", size: 11 },
      margin: { l: 50, r: 16, t: 8, b: 40 },
      xaxis: { title: { text: "x", font: { color: "#a6adc8", size: 11 } }, gridcolor: "#45475a", zerolinecolor: "#585b70" },
      yaxis: { title: { text: "value", font: { color: "#a6adc8", size: 11 } }, gridcolor: "#45475a", zerolinecolor: "#585b70" },
      legend: { orientation: "h", xanchor: "center", x: 0.5, y: 1.15, font: { size: 10, color: "#cdd6f4" } }
    };

    try { Plotly.newPlot(dd, [zeroLine, inputTrace, outputTrace], lo, { responsive: true, displayModeBar: false }); } catch (e) {}
  }

  // ─── REMOVE POPUP ─────────────────────────────────────────────────────

  function removePopup() {
    var overlay = document.getElementById(_POPUP_ID);
    if (overlay) {
      var pd = document.getElementById(_PLOT_ID);
      if (pd && typeof Plotly !== "undefined") { try { Plotly.purge(pd); } catch (e) {} }
      var dd = document.getElementById(_DEMO_ID);
      if (dd && typeof Plotly !== "undefined") { try { Plotly.purge(dd); } catch (e) {} }
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
    if (sel.dataset.actInfoInjected) return;
    sel.dataset.actInfoInjected = "true";
    var btn = mkBtn(function () { return sel.value; });
    var tr = sel.closest("tr");
    if (tr) {
      var ft = tr.querySelector("td:first-child");
      if (ft) { ft.appendChild(btn); return; }
    }
    sel.parentNode.insertBefore(btn, sel);
  }

  function injectAll() {
    var sel = document.querySelectorAll("select.input_data.activation, select.input_field.activation");
    for (var i = 0; i < sel.length; i++) injectIcon(sel[i]);
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
