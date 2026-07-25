"use strict";

// ============================================================
// INITIALIZER & REGULARIZER INFO POPUP — IIFE
// Visual explanations of weight initializers and regularizers
// using Plotly histograms and Temml math rendering.
// Bilingual (de/en) via global `lang`.
// ============================================================

(function () {

  var _POPUP_ID = "initializer_info_popup_overlay";
  var _PLOT_ID = "initializer_info_plot";

  // ─── HELPERS ───────────────────────────────────────────────────────────────

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

  // Random sampling helpers (pure JS, no TF dependency)
  function _randn() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  function sampleUniform(n, min, max) {
    var arr = [];
    for (var i = 0; i < n; i++) {
      arr.push(Math.random() * (max - min) + min);
    }
    return arr;
  }

  function sampleNormal(n, mean, stddev) {
    var arr = [];
    for (var i = 0; i < n; i++) {
      arr.push(_randn() * stddev + mean);
    }
    return arr;
  }

  function sampleTruncatedNormal(n, mean, stddev, maxStd) {
    if (maxStd === undefined) maxStd = 2;
    var arr = [];
    for (var i = 0; i < n; i++) {
      var val;
      do {
        val = _randn() * stddev + mean;
      } while (Math.abs(val - mean) > maxStd * stddev);
      arr.push(val);
    }
    return arr;
  }

  function gaussianPDF(x, mean, stddev) {
    return (1 / (stddev * Math.sqrt(2 * Math.PI))) *
      Math.exp(-0.5 * Math.pow((x - mean) / stddev, 2));
  }

  function uniformPDF(x, min, max) {
    if (x < min || x > max) return 0;
    return 1 / (max - min);
  }

  function getXGrid(min, max, steps) {
    var arr = [];
    var step = (max - min) / steps;
    for (var i = 0; i <= steps; i++) {
      arr.push(min + i * step);
    }
    return arr;
  }

  // ─── ESC HANDLER ───────────────────────────────────────────────────────────

  function _escHandler(e) {
    if (e.key === "Escape") removePopup();
  }

  // ─── TRANSLATIONS ─────────────────────────────────────────────────────────

  var i18n = {
    en: {
      title: "How do Initializers work?",
      initializerTab: "Weight Initializers",
      regularizerTab: "Regularizers",
      intuitionTitle: "Intuition",
      mathTitle: "The Formula",
      plotTitle: "Weight Distribution",
      whenTitle: "When to use",
      paramsTitle: "Parameters",
      close: "Close",
      fanInDefault: "fan_in",
      fanOutDefault: "fan_out",
      regPlotTitle: "Penalty vs Weight Value",
      regExplanation: "Regularizers add a penalty to the loss function to prevent overfitting. They encourage the model to keep weights small.",
      l1Spike: "L1 pushes weights toward 0 (sparsity)",
      l2Small: "L2 keeps weights small but not exactly 0",
      SAMPLE_SIZE: "Showing ~5,000 sampled weights"
    },
    de: {
      title: "Wie funktionieren Initialisierer?",
      initializerTab: "Gewichts-Initialisierer",
      regularizerTab: "Regularisierer",
      intuitionTitle: "Intuition",
      mathTitle: "Die Formel",
      plotTitle: "Gewichtsverteilung",
      whenTitle: "Wann verwenden",
      paramsTitle: "Parameter",
      close: "Schließen",
      fanInDefault: "fan_in",
      fanOutDefault: "fan_out",
      regPlotTitle: "Strafe vs. Gewichtswert",
      regExplanation: "Regularisierer fügen eine Strafe zur Verlustfunktion hinzu um Überanpassung zu verhindern. Sie ermutigen das Modell, Gewichte klein zu halten.",
      l1Spike: "L1 drückt Gewichte in Richtung 0 (sparsity)",
      l2Small: "L2 hält Gewichte klein, aber nicht exakt 0",
      SAMPLE_SIZE: "Zeige ~5.000 sample Gewichte"
    }
  };

  // ─── INITIALIZER INFO DATA ─────────────────────────────────────────────────

  var initializerInfo = {
    glorotUniform: {
      en: {
        analogy: "The classic all-rounder. It picks random weights from a range that depends on the layer size. Big layers get small weights to keep the signal stable. Named after Xavier Glorot who showed this prevents gradients from vanishing or exploding in deep networks with tanh/sigmoid.",
        when_use: "• Good default for tanh and sigmoid activation\n• Balances variance between input and output\n• Works for dense (Dense) and convolutional (Conv2D) layers",
        when_not: "• For ReLU activation: use He instead\n• For very deep networks: consider He or LeCun"
      },
      de: {
        analogy: "Der klassische Allrounder. Er wählt zufällige Gewichte aus einem Bereich, der von der Layergröße abhängt. Große Layer bekommen kleine Gewichte um das Signal stabil zu halten. Benannt nach Xavier Glorot, der zeigte, dass dies verhindert, dass Gradienten in tiefen Netzen mit tanh/sigmoid verschwinden oder explodieren.",
        when_use: "• Gute Standardwahl für tanh und sigmoid Aktivierung\n• Balanciert die Varianz zwischen Eingabe und Ausgabe\n• Funktioniert für dichte (Dense) und convolutional (Conv2D) Layer",
        when_not: "• Für ReLU Aktivierung: He verwenden\n• Für sehr tiefe Netze: He oder LeCun in Betracht ziehen"
      },
      math: "\\text{limit} = \\sqrt{\\frac{6}{\\text{fan}_{\\text{in}} + \\text{fan}_{\\text{out}}}}\\\\W \\sim U[-\\text{limit}, \\text{limit}]",
      params: { seed: "integer (optional)" },
      sample: function(n, fi, fo) {
        var limit = Math.sqrt(6 / (fi + fo));
        return { data: sampleUniform(n, -limit, limit), min: -limit, max: limit, type: "uniform" };
      }
    },
    glorotNormal: {
      en: {
        analogy: "Like glorotUniform but uses a bell curve (normal distribution) instead of a flat range. The weights cluster around 0, with fewer extreme values. The spread is controlled by sqrt(2/(fan_in+fan_out)).",
        when_use: "• Good for tanh/sigmoid activations\n• Often preferred over the uniform version\n• Can give slightly better gradients",
        when_not: "• Not ideal for ReLU (use He)\n• May be slightly slower to sample than uniform"
      },
      de: {
        analogy: "Wie glorotUniform, aber verwendet eine Glockenkurve (Normalverteilung) statt eines flachen Bereichs. Die Gewichte clustern um 0, mit weniger extremen Werten. Die Streuung wird durch sqrt(2/(fan_in+fan_out)) gesteuert.",
        when_use: "• Gut für tanh/sigmoid Aktivierungen\n• Oft der uniformen Version vorgezogen\n• Kann etwas bessere Gradienten liefern",
        when_not: "• Nicht ideal für ReLU (He verwenden)\n• Kann etwas langsamer zu sampeln sein als uniform"
      },
      math: "\\sigma = \\sqrt{\\frac{2}{\\text{fan}_{\\text{in}} + \\text{fan}_{\\text{out}}}}\\\\W \\sim \\mathcal{N}(0, \\sigma^2)\\text{ (truncated at 2 sigma)}",
      params: { seed: "integer (optional)" },
      sample: function(n, fi, fo) {
        var stddev = Math.sqrt(2 / (fi + fo));
        return { data: sampleTruncatedNormal(n, 0, stddev, 2), mean: 0, stddev: stddev, type: "normal" };
      }
    },
    heNormal: {
      en: {
        analogy: "Made for ReLU! Since ReLU cuts off negative values, half the variance is lost. He compensates by making the weights slightly bigger. This keeps the signal strong through ReLU layers. The standard choice for modern deep CNNs.",
        when_use: "• Best choice for ReLU and PReLU\n• Keeps variance stable through ReLU layers\n• Standard for ResNet, VGG, etc.",
        when_not: "• May cause exploding gradients with tanh/sigmoid\n• For LeakyReLU: leCunNormal can work better"
      },
      de: {
        analogy: "Gemacht für ReLU! Da ReLU negative Werte abschneidet, geht die Hälfte der Varianz verloren. He gleicht das aus, indem die Gewichte etwas größer werden. So bleibt das Signal durch ReLU-Layer stark. Die Standardwahl für moderne CNNs.",
        when_use: "• Beste Wahl für ReLU und PReLU\n• Hält die Varianz durch ReLU-Layer stabil\n• Standard für ResNet, VGG, etc.",
        when_not: "• Kann zu explodierenden Gradienten bei tanh/sigmoid führen\n• Für LeakyReLU: leCunNormal kann besser sein"
      },
      math: "\\sigma = \\sqrt{\\frac{2}{\\text{fan}_{\\text{in}}}}\\\\W \\sim \\mathcal{N}(0, \\sigma^2)\\text{ (truncated at 2 sigma)}",
      params: { seed: "integer (optional)" },
      sample: function(n, fi, fo) {
        var stddev = Math.sqrt(2 / fi);
        return { data: sampleTruncatedNormal(n, 0, stddev, 2), mean: 0, stddev: stddev, type: "normal" };
      }
    },
    heUniform: {
      en: {
        analogy: "The uniform version of He. Same idea — compensate for ReLU's negative cutoff — but uses a flat range instead of a bell curve. The range is sqrt(6/fan_in) in both directions.",
        when_use: "• Good for ReLU\n• Can be more stable than heNormal in some cases\n• Simpler distribution",
        when_not: "• heNormal often preferred\n• Not for tanh/sigmoid"
      },
      de: {
        analogy: "Die uniforme Version von He. Gleiche Idee — kompensiert die ReLU-Abschneidung — aber verwendet einen flachen Bereich statt einer Glockenkurve. Der Bereich ist sqrt(6/fan_in) in beide Richtungen.",
        when_use: "• Gut für ReLU\n• Kann in manchen Fällen stabiler sein als heNormal\n• Einfachere Verteilung",
        when_not: "• heNormal wird oft bevorzugt\n• Nicht für tanh/sigmoid"
      },
      math: "\\text{limit} = \\sqrt{\\frac{6}{\\text{fan}_{\\text{in}}}}\\\\W \\sim U[-\\text{limit}, \\text{limit}]",
      params: { seed: "integer (optional)" },
      sample: function(n, fi, fo) {
        var limit = Math.sqrt(6 / fi);
        return { data: sampleUniform(n, -limit, limit), min: -limit, max: limit, type: "uniform" };
      }
    },
    leCunNormal: {
      en: {
        analogy: "Designed for Self-Normalizing Neural Networks (SNNs) with SeLU activation. It creates a specific variance that preserves the normalizing property of SeLU. Also works well for LeakyReLU.",
        when_use: "• Required for SeLU activation (self-normalizing nets)\n• Good for LeakyReLU\n• Keeps variance of 1 through the layer",
        when_not: "• Overkill for standard ReLU (use He instead)\n• Not for tanh/sigmoid"
      },
      de: {
        analogy: "Entwickelt für selbstnormalisierende neuronale Netze (SNNs) mit SeLU-Aktivierung. Erzeugt eine spezifische Varianz, die die normalisierende Eigenschaft von SeLU bewahrt. Funktioniert auch gut für LeakyReLU.",
        when_use: "• Erforderlich für SeLU-Aktivierung (selbstnormalisierende Netze)\n• Gut für LeakyReLU\n• Hält Varianz von 1 durch den Layer",
        when_not: "• Überdimensioniert für Standard-ReLU (He verwenden)\n• Nicht für tanh/sigmoid"
      },
      math: "\\sigma = \\sqrt{\\frac{1}{\\text{fan}_{\\text{in}}}}\\\\W \\sim \\mathcal{N}(0, \\sigma^2)\\text{ (truncated at 2 sigma)}",
      params: { seed: "integer (optional)" },
      sample: function(n, fi, fo) {
        var stddev = Math.sqrt(1 / fi);
        return { data: sampleTruncatedNormal(n, 0, stddev, 2), mean: 0, stddev: stddev, type: "normal" };
      }
    },
    leCunUniform: {
      en: {
        analogy: "Uniform version of LeCun. Draws from a flat range with width sqrt(3/fan_in). Simpler than the normal version but achieves the same variance.",
        when_use: "• Alternative to leCunNormal\n• Simple and fast",
        when_not: "• leCunNormal is usually preferred\n• Not for ReLU or tanh/sigmoid as default"
      },
      de: {
        analogy: "Uniforme Version von LeCun. Zieht aus einem flachen Bereich mit Breite sqrt(3/fan_in). Einfacher als die Normalversion, aber erreicht die gleiche Varianz.",
        when_use: "• Alternative zu leCunNormal\n• Einfach und schnell",
        when_not: "• leCunNormal wird meist bevorzugt\n• Nicht als Standard für ReLU oder tanh/sigmoid"
      },
      math: "\\text{limit} = \\sqrt{\\frac{3}{\\text{fan}_{\\text{in}}}}\\\\W \\sim U[-\\text{limit}, \\text{limit}]",
      params: { seed: "integer (optional)" },
      sample: function(n, fi, fo) {
        var limit = Math.sqrt(3 / fi);
        return { data: sampleUniform(n, -limit, limit), min: -limit, max: limit, type: "uniform" };
      }
    },
    randomNormal: {
      en: {
        analogy: "Simple normal distribution with configurable mean and standard deviation. No smart scaling — you control the spread manually. Use when you need full control or want to experiment.",
        when_use: "• When you need specific mean/stddev values\n• Research/experimentation\n• When layer-size-aware scaling is not needed",
        when_not: "• For most practical cases, use glorot or He instead\n• Can easily cause vanishing/exploding gradients if misconfigured"
      },
      de: {
        analogy: "Einfache Normalverteilung mit konfigurierbarem Mittelwert und Standardabweichung. Keine intelligente Skalierung — du kontrollierst die Streuung manuell. Verwende dies, wenn du volle Kontrolle brauchst oder experimentieren willst.",
        when_use: "• Wenn spezifische mean/stddev Werte benötigt werden\n• Forschung/Experimente\n• Wenn layergrößen-abhängige Skalierung nicht nötig ist",
        when_not: "• Für die meisten praktischen Fälle glorot oder He verwenden\n• Kann leicht zu verschwindenden/explodierenden Gradienten führen"
      },
      math: "W \\sim \\mathcal{N}(\\text{mean}, \\text{stddev}^2)",
      params: { mean: "0", stddev: "0.05", seed: "integer (optional)" },
      sample: function(n, fi, fo) {
        return { data: sampleNormal(n, 0, 0.05), mean: 0, stddev: 0.05, type: "normal" };
      }
    },
    randomUniform: {
      en: {
        analogy: "Simple uniform distribution. You set the min and max values. No adaptation to layer size. Useful when you know exactly what range you want.",
        when_use: "• When you need a specific range\n• Simple setups where layer size is constant\n• Experimentation",
        when_not: "• Most cases: use glorot or He instead\n• Risk of poor scaling for variable-sized layers"
      },
      de: {
        analogy: "Einfache Gleichverteilung. Du setzt die min und max Werte. Keine Anpassung an die Layergröße. Nützlich, wenn du genau weißt, welchen Bereich du möchtest.",
        when_use: "• Wenn ein bestimmter Bereich benötigt wird\n• Einfache Setups mit konstanter Layergröße\n• Experimente",
        when_not: "• Meistens glorot oder He stattdessen verwenden\n• Risiko schlechter Skalierung bei variablen Layergrößen"
      },
      math: "W \\sim U[\\text{minval}, \\text{maxval}]",
      params: { minval: "-0.05", maxval: "0.05", seed: "integer (optional)" },
      sample: function(n, fi, fo) {
        return { data: sampleUniform(n, -0.05, 0.05), min: -0.05, max: 0.05, type: "uniform" };
      }
    },
    truncatedNormal: {
      en: {
        analogy: "Like randomNormal, but values more than 2 standard deviations from the mean are thrown away and re-sampled. This prevents extreme weight values that could cause training instabilität.",
        when_use: "• When you want a normal distribution without outliers\n• Often used as the base for glorotNormal and heNormal\n• Prevents extreme initial weights",
        when_not: "• Use glorotNormal or heNormal instead — they do the same but smarter\n• For simple cases, randomNormal might suffice"
      },
      de: {
        analogy: "Wie randomNormal, aber Werte mehr als 2 Standardabweichungen vom Mittelwert werden verworfen und neu gezogen. Das verhindert extreme Gewichtswerte, die zu Trainingsinstabilität führen könnten.",
        when_use: "• Wenn eine Normalverteilung ohne Ausreißer gewünscht ist\n• Oft als Basis für glorotNormal und heNormal verwendet\n• Verhindert extreme Anfangsgewichte",
        when_not: "• glorotNormal oder heNormal stattdessen verwenden — sie tun dasselbe aber intelligenter\n• Für einfache Fälle reicht randomNormal"
      },
      math: "W \\sim \\mathcal{N}(\\text{mean}, \\text{stddev}^2)\\text{, truncated at }\\pm 2\\sigma",
      params: { mean: "0", stddev: "0.05", seed: "integer (optional)" },
      sample: function(n, fi, fo) {
        return { data: sampleTruncatedNormal(n, 0, 0.05, 2), mean: 0, stddev: 0.05, type: "normal" };
      }
    },
    varianceScaling: {
      en: {
        analogy: "The most flexible initializer. You control the scale, the mode (how to count neurons), and the distribution type. It's like glorot/He but with knobs for everything.",
        when_use: "• When you need fine-grained control\n• Research and custom architectures\n• When no standard initializer fits your needs",
        when_not: "• For standard architectures: use glorot or He\n• Easy to misconfigure (wrong scale/mode/distribution)"
      },
      de: {
        analogy: "Der flexibelste Initialisierer. Du kontrollierst die Skalierung, den Modus (wie Neuronen gezählt werden) und die Verteilungsart. Es ist wie glorot/He, aber mit Reglern für alles.",
        when_use: "• Wenn feine Kontrolle benötigt wird\n• Forschung und benutzerdefinierte Architekturen\n• Wenn kein Standard-Initialisierer passt",
        when_not: "• Für Standardarchitekturen: glorot oder He verwenden\n• Leicht falsch zu konfigurieren (falsche scale/mode/distribution)"
      },
      math: "\\text{stddev} = \\sqrt{\\frac{\\text{scale}}{n}}\\quad(\\text{normal})\\\\\\text{limit} = \\sqrt{\\frac{3 \\cdot \\text{scale}}{n}}\\quad(\\text{uniform})\\\\n = \\text{fan}_{\\text{in}}\\,|\\,\\text{fan}_{\\text{out}}\\,|\\,\\text{avg}",
      params: { scale: "1.0", mode: "FAN_IN / FAN_OUT / FAN_AVG", distribution: "NORMAL / UNIFORM", seed: "integer (optional)" },
      sample: function(n, fi, fo) {
        var scale = 1.0;
        var stddev = Math.sqrt(scale / fi);
        return { data: sampleTruncatedNormal(n, 0, stddev, 2), mean: 0, stddev: stddev, type: "normal" };
      }
    },
    orthogonal: {
      en: {
        analogy: "Creates a random orthogonal matrix — the weight matrix's columns are perpendicular and have length 1. This preserves the input norm (length) through the layer, which helps very deep networks train better.",
        when_use: "• Very deep networks (50+ layers)\n• Recurrent networks (RNNs, LSTMs)\n• When you want to preserve input norm",
        when_not: "• Shallow networks don't benefit much\n• Only works for 2D weight matrices (not Conv filters)\n• Can be overkill for simple tasks"
      },
      de: {
        analogy: "Erzeugt eine zufällige orthogonale Matrix — die Spalten der Gewichtsmatrix sind senkrecht zueinander und haben Länge 1. Das bewahrt die Eingabenorm (Länge) durch den Layer, was sehr tiefen Netzen beim Training hilft.",
        when_use: "• Sehr tiefe Netze (50+ Layer)\n• Wiederkehrende Netze (RNNs, LSTMs)\n• Wenn die Eingabenorm erhalten bleiben soll",
        when_not: "• Flache Netze profitieren kaum\n• Funktioniert nur für 2D Gewichtsmatrizen (nicht Conv-Filter)\n• Kann für einfache Aufgaben übertrieben sein"
      },
      math: "W = Q\\quad\\text{where}\\quad Q^T Q = I",
      params: { gain: "1.0", seed: "integer (optional)" },
      sample: function(n, fi, fo) {
        return { data: sampleNormal(n, 0, 1 / Math.sqrt(fi)), mean: 0, stddev: 1 / Math.sqrt(fi), type: "normal" };
      }
    },
    zeros: {
      en: {
        analogy: "Sets all weights to zero. Every neuron starts identical — they all output zero. This is a problem because identical neurons get identical gradients and learn nothing different (symmetry break). Only use for biases, never for weights.",
        when_use: "• Good for bias initialization\n• Testing/debugging",
        when_not: "• NEVER for weights! All neurons become identical and can't learn\n• Causes symmetry problem"
      },
      de: {
        analogy: "Setzt alle Gewichte auf Null. Jedes Neuron startet identisch — alle geben Null aus. Das ist ein Problem, weil identische Neuronen identische Gradienten bekommen und nichts Unterschiedliches lernen (Symmetrieproblem). Nur für Biases verwenden, niemals für Gewichte.",
        when_use: "• Gut für Bias-Initialisierung\n• Testen/Debuggen",
        when_not: "• NIEMALS für Gewichte! Alle Neuronen werden identisch und können nichts lernen\n• Verursacht Symmetrieproblem"
      },
      math: "W = 0",
      params: {},
      sample: function(n, fi, fo) {
        var arr = [];
        for (var i = 0; i < n; i++) arr.push(0);
        return { data: arr, min: -0.1, max: 0.1, type: "constant" };
      }
    },
    ones: {
      en: {
        analogy: "Sets all weights to 1. The output becomes the sum of all inputs multiplied by 1. Like zeros, this creates identical neurons (symmetry problem). Rarely useful — only for very specific architectures.",
        when_use: "• Very specific custom architectures\n• Testing/debugging",
        when_not: "• Almost never for weights (symmetry problem)\n• Not for biases either (biases are usually 0)"
      },
      de: {
        analogy: "Setzt alle Gewichte auf 1. Die Ausgabe wird zur Summe aller Eingaben mal 1. Wie bei Null erzeugt dies identische Neuronen (Symmetrieproblem). Selten nützlich — nur für sehr spezielle Architekturen.",
        when_use: "• Sehr spezielle benutzerdefinierte Architekturen\n• Testen/Debuggen",
        when_not: "• Fast nie für Gewichte (Symmetrieproblem)\n• Auch nicht für Biases (Biases sind normalerweise 0)"
      },
      math: "W = 1",
      params: {},
      sample: function(n, fi, fo) {
        var arr = [];
        for (var i = 0; i < n; i++) arr.push(1);
        return { data: arr, min: 0.9, max: 1.1, type: "constant" };
      }
    },
    constant: {
      en: {
        analogy: "Sets all weights to any value you choose. Want all weights to be 0.5? Go ahead. This gives you full control but creates the same symmetry problem as zeros/ones.",
        when_use: "• When you need a specific non-random value\n• Testing\n• Bias initialization",
        when_not: "• Not for hidden layer weights (symmetry problem)\n• Random initialization almost always better"
      },
      de: {
        analogy: "Setzt alle Gewichte auf einen beliebigen Wert deiner Wahl. Sollen alle Gewichte 0.5 sein? Nur zu. Das gibt dir volle Kontrolle, erzeugt aber dasselbe Symmetrieproblem wie zeros/ones.",
        when_use: "• Wenn ein bestimmter nicht-zufälliger Wert benötigt wird\n• Testen\n• Bias-Initialisierung",
        when_not: "• Nicht für verborgene Layer-Gewichte (Symmetrieproblem)\n• Zufällige Initialisierung ist fast immer besser"
      },
      math: "W = \\text{value}",
      params: { value: "0.5" },
      sample: function(n, fi, fo) {
        var arr = [];
        for (var i = 0; i < n; i++) arr.push(0.5);
        return { data: arr, min: 0.4, max: 0.6, type: "constant" };
      }
    },
    identity: {
      en: {
        analogy: "Creates the identity matrix — 1s on the diagonal, 0s elsewhere. The output equals the input. Only works for square weight matrices. Useful for initializing layers close to the identity function.",
        when_use: "• When you want a layer to start as the identity function\n• Residual networks (ResNet) initializations\n• Very specific cases",
        when_not: "• Only works for square 2D matrices\n• Not for convolutional layers\n• Rarely needed"
      },
      de: {
        analogy: "Erzeugt die Einheitsmatrix — 1en auf der Diagonale, 0en sonst. Die Ausgabe ist gleich der Eingabe. Funktioniert nur für quadratische Gewichtsmatrizen. Nützlich um Layer nahe der Identitätsfunktion zu initialisieren.",
        when_use: "• Wenn ein Layer als Identitätsfunktion starten soll\n• Residuale Netze (ResNet) Initialisierungen\n• Sehr spezielle Fälle",
        when_not: "• Funktioniert nur für quadratische 2D-Matrizen\n• Nicht für convolutional Layer\n• Selten benötigt"
      },
      math: "W = I\\quad(\\text{Einheitsmatrix})",
      params: { gain: "1.0" },
      sample: function(n, fi, fo) {
        var arr = [];
        for (var i = 0; i < n; i++) arr.push(i % (Math.floor(Math.sqrt(n)) + 1) === 0 ? 1 : 0);
        return { data: arr, min: -0.1, max: 1.1, type: "constant" };
      }
    }
  };

  // ─── REGULARIZER INFO DATA ────────────────────────────────────────────────

  var regularizerInfo = {
    none: {
      en: {
        analogy: "No regularization. The model is free to use any weight values. This can lead to overfitting (memorizing the training data instead of learning general patterns).",
        when_use: "• Very simple problems (few features, lots of data)\n• When you want the most flexible model possible",
        when_not: "• Most real-world problems need SOME regularization\n• Without regularization, the model may overfit easily"
      },
      de: {
        analogy: "Keine Regularisierung. Das Modell kann beliebige Gewichtswerte verwenden. Das kann zu Überanpassung führen (Auswendiglernen der Trainingsdaten statt Lernen allgemeiner Muster).",
        when_use: "• Sehr einfache Probleme (wenige Features, viele Daten)\n• Wenn das flexibelste Modell gewünscht ist",
        when_not: "• Die meisten echten Probleme brauchen IRGENDEINE Regularisierung\n• Ohne Regularisierung kann das Modell leicht überanpassen"
      },
      math: "\\text{Penalty} = 0"
    },
    l1: {
      en: {
        analogy: "L1 adds a penalty equal to the absolute value of each weight. This pushes small weights to exactly 0 (sparsity). Think of it as a 'use it or lose it' penalty — unimportant connections get pruned away completely.",
        when_use: "• Feature selection (pushes irrelevant weights to 0)\n• Interpretability (sparse models are easier to understand)\n• When you want exactly 0 weights",
        when_not: "• If you only need small weights (use L2 instead)\n• L1 can cause instability with some optimizers"
      },
      de: {
        analogy: "L1 addiert eine Strafe in Höhe des absoluten Werts jedes Gewichts. Das drückt kleine Gewichte auf exakt 0 (Sparsity). Denk daran wie eine 'benutze es oder verliere es'-Strafe — unwichtige Verbindungen werden komplett entfernt.",
        when_use: "• Feature-Auswahl (drückt irrelevante Gewichte auf 0)\n• Interpretierbarkeit (dünn besetzte Modelle sind leichter verständlich)\n• Wenn exakte 0-Gewichte gewünscht sind",
        when_not: "• Wenn nur kleine Gewichte gebraucht werden (L2 stattdessen)\n• L1 kann bei manchen Optimierern Instabilität verursachen"
      },
      math: "\\text{Penalty} = \\text{l1} \\cdot \\sum |W|"
    },
    l2: {
      en: {
        analogy: "L2 adds a penalty equal to the SQUARE of each weight. Large weights get heavily punished, small weights barely feel it. This keeps all weights small but not exactly 0. Also called weight decay.",
        when_use: "• Default choice for most neural networks\n• Prevents overfitting by keeping weights small\n• Works well with most optimizers\n• Improves generalization",
        when_not: "• If you need sparsity (use L1 instead)\n• Very high L2 can underfit (model becomes too simple)"
      },
      de: {
        analogy: "L2 addiert eine Strafe in Höhe des QUADRATS jedes Gewichts. Große Gewichte werden stark bestraft, kleine Gewichte spüren es kaum. Das hält alle Gewichte klein, aber nicht exakt 0. Auch 'Weight Decay' genannt.",
        when_use: "• Standardwahl für die meisten neuronalen Netze\n• Verhindert Überanpassung durch kleine Gewichte\n• Funktioniert gut mit den meisten Optimierern\n• Verbessert die Generalisierung",
        when_not: "• Wenn Sparsity benötigt wird (L1 stattdessen)\n• Sehr hohes L2 kann zu Unteranpassung führen (Modell wird zu einfach)"
      },
      math: "\\text{Penalty} = \\text{l2} \\cdot \\sum W^2"
    },
    l1l2: {
      en: {
        analogy: "The best of both worlds — L1 for sparsity AND L2 for small weights. L1 prunes unimportant connections to 0 while L2 keeps the remaining weights small. You get a compact AND stable model.",
        when_use: "• When you want both sparsity AND small weights\n• Complex models with many parameters\n• Best regularizer for most cases if you can tune both parameters",
        when_not: "• More hyperparameters to tune (l1 and l2)\n• If the dataset is very small, simpler regularization might be enough"
      },
      de: {
        analogy: "Das Beste aus beiden Welten — L1 für Sparsity UND L2 für kleine Gewichte. L1 entfernt unwichtige Verbindungen auf 0 während L2 die verbleibenden Gewichte klein hält. Du bekommst ein kompaktes UND stabiles Modell.",
        when_use: "• Wenn sowohl Sparsity als auch kleine Gewichte gewünscht sind\n• Komplexe Modelle mit vielen Parametern\n• Bester Regularisierer für die meisten Fälle, wenn beide Parameter eingestellt werden können",
        when_not: "• Mehr Hyperparameter zum Einstellen (l1 und l2)\n• Wenn der Datensatz sehr klein ist, reicht einfachere Regularisierung"
      },
      math: "\\text{Penalty} = \\text{l1} \\cdot \\sum |W| + \\text{l2} \\cdot \\sum W^2"
    }
  };

  // ─── BUILD POPUP ───────────────────────────────────────────────────────────

  function buildPopup(kind, name) {
    var t = i18n[L()];
    var info;
    var isRegularizer = (kind === "regularizer");
    if (isRegularizer) {
      info = regularizerInfo[name];
    } else {
      info = initializerInfo[name];
    }
    if (!info) return;

    removePopup();

    // Overlay
    var overlay = document.createElement("div");
    overlay.id = _POPUP_ID;
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;" +
      "background:rgba(0,0,0,0.75);z-index:99999;display:flex;align-items:center;" +
      "justify-content:center;padding:16px;box-sizing:border-box;";

    // Modal
    var modal = document.createElement("div");
    modal.style.cssText = "background:#1e1e2e;color:#cdd6f4;border-radius:16px;" +
      "width:min(97vw,1000px);max-height:94vh;overflow-y:auto;padding:28px 32px;" +
      "position:relative;box-shadow:0 30px 80px rgba(0,0,0,0.7);" +
      "font-family:'Segoe UI',system-ui,sans-serif;";

    // Close button
    var closeBtn = document.createElement("button");
    closeBtn.innerHTML = "✕";
    closeBtn.style.cssText = "position:sticky;top:0;float:right;background:#f38ba8;" +
      "border:none;color:#1e1e2e;font-size:20px;font-weight:bold;width:36px;height:36px;" +
      "border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;" +
      "transition:transform 0.2s;z-index:10;margin-left:auto;";
    closeBtn.onmouseenter = function () { closeBtn.style.transform = "scale(1.2)"; };
    closeBtn.onmouseleave = function () { closeBtn.style.transform = "scale(1)"; };
    closeBtn.onclick = removePopup;
    modal.appendChild(closeBtn);

    // Title
    var title = document.createElement("h2");
    var displayName = name.charAt(0).toUpperCase() + name.slice(1);
    if (info.en && info.en.title) displayName = info.en.title;
    title.textContent = displayName;
    title.style.cssText = "margin:0 0 6px 0;color:#89b4fa;font-size:22px;";
    modal.appendChild(title);

    // Tab label
    var tabLabel = document.createElement("div");
    tabLabel.style.cssText = "font-size:12px;color:#a6adc8;margin-bottom:16px;" +
      "text-transform:uppercase;letter-spacing:1px;";
    tabLabel.textContent = isRegularizer ? t.regularizerTab : t.initializerTab;
    modal.appendChild(tabLabel);

    // ─── Intuition section ───
    var intuitionH = document.createElement("h3");
    intuitionH.textContent = t.intuitionTitle;
    intuitionH.style.cssText = "color:#f9e2af;margin:20px 0 8px 0;font-size:16px;";
    modal.appendChild(intuitionH);

    var intuitionBox = document.createElement("div");
    intuitionBox.style.cssText = "background:#313244;border-radius:12px;padding:16px;" +
      "margin-bottom:20px;font-size:14px;line-height:1.7;border-left:4px solid #f9e2af;";
    intuitionBox.textContent = (L() === "de" ? (info.de ? info.de.analogy : "") : info.en.analogy);
    modal.appendChild(intuitionBox);

    // ─── Math section ───
    if (info.math) {
      var mathH = document.createElement("h3");
      mathH.textContent = t.mathTitle;
      mathH.style.cssText = "color:#89b4fa;margin:0 0 8px 0;font-size:16px;";
      modal.appendChild(mathH);

      var mathBox = document.createElement("div");
      mathBox.style.cssText = "background:#313244;border-radius:12px;padding:16px;" +
        "margin-bottom:20px;border-left:4px solid #89b4fa;overflow-x:auto;";
      mathBox.innerHTML = renderMathBlock(info.math);
      modal.appendChild(mathBox);
    }

    // ─── Plot section (distribution for initializers, penalty for regularizers) ───
    var plotH = document.createElement("h3");
    plotH.textContent = isRegularizer ? t.regPlotTitle : t.plotTitle;
    plotH.style.cssText = "color:#a6e3a1;margin:0 0 8px 0;font-size:16px;";
    modal.appendChild(plotH);

    var plotBox = document.createElement("div");
    plotBox.style.cssText = "background:#313244;border-radius:12px;padding:12px;" +
      "margin-bottom:20px;position:relative;";

    if (isRegularizer) {
      // Explanation text above the plot
      var regDesc = document.createElement("div");
      regDesc.style.cssText = "font-size:13px;color:#a6adc8;margin-bottom:8px;";
      regDesc.textContent = t.regExplanation;
      plotBox.appendChild(regDesc);
    } else {
      var sampleLabel = document.createElement("div");
      sampleLabel.style.cssText = "font-size:11px;color:#585b70;margin-bottom:8px;text-align:right;";
      sampleLabel.textContent = t.SAMPLE_SIZE;
      plotBox.appendChild(sampleLabel);
    }

    var plotDiv = document.createElement("div");
    plotDiv.id = _PLOT_ID;
    plotDiv.style.cssText = "width:100%;height:320px;";
    plotBox.appendChild(plotDiv);
    modal.appendChild(plotBox);

    // ─── When to use / when not ───
    var locInfo = L() === "de" ? info.de : info.en;
    if (locInfo.when_use) {
      var whenH = document.createElement("h3");
      whenH.textContent = t.whenTitle;
      whenH.style.cssText = "color:#cba6f7;margin:0 0 8px 0;font-size:16px;";
      modal.appendChild(whenH);

      var whenGrid = document.createElement("div");
      whenGrid.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;";

      var useBox = document.createElement("div");
      useBox.style.cssText = "background:#313244;border-radius:12px;padding:14px;" +
        "border-left:4px solid #a6e3a1;font-size:13px;line-height:1.6;white-space:pre-wrap;";
      useBox.textContent = locInfo.when_use;
      whenGrid.appendChild(useBox);

      if (locInfo.when_not) {
        var notBox = document.createElement("div");
        notBox.style.cssText = "background:#313244;border-radius:12px;padding:14px;" +
          "border-left:4px solid #f38ba8;font-size:13px;line-height:1.6;white-space:pre-wrap;";
        notBox.textContent = locInfo.when_not;
        whenGrid.appendChild(notBox);
      }

      modal.appendChild(whenGrid);
    }

    // ─── Parameters ───
    if (info.params && Object.keys(info.params).length > 0) {
      var paramsH = document.createElement("h3");
      paramsH.textContent = t.paramsTitle;
      paramsH.style.cssText = "color:#fab387;margin:0 0 8px 0;font-size:16px;";
      modal.appendChild(paramsH);

      var paramTable = document.createElement("table");
      paramTable.style.cssText = "width:100%;border-collapse:collapse;margin-bottom:20px;" +
        "font-size:13px;background:#313244;border-radius:12px;overflow:hidden;";

      var headerRow = document.createElement("tr");
      headerRow.style.cssText = "background:#45475a;";
      var h1 = document.createElement("th");
      h1.style.cssText = "padding:8px 12px;text-align:left;color:#cdd6f4;";
      h1.textContent = "Parameter";
      var h2 = document.createElement("th");
      h2.style.cssText = "padding:8px 12px;text-align:left;color:#cdd6f4;";
      h2.textContent = "Default / Values";
      headerRow.appendChild(h1);
      headerRow.appendChild(h2);
      paramTable.appendChild(headerRow);

      var paramKeys = Object.keys(info.params);
      for (var pi = 0; pi < paramKeys.length; pi++) {
        var row = document.createElement("tr");
        row.style.cssText = pi % 2 === 0 ? "background:#313244;" : "background:#363849;";
        var c1 = document.createElement("td");
        c1.style.cssText = "padding:6px 12px;color:#fab387;font-family:monospace;";
        c1.textContent = paramKeys[pi];
        var c2 = document.createElement("td");
        c2.style.cssText = "padding:6px 12px;color:#a6adc8;";
        c2.textContent = info.params[paramKeys[pi]];
        row.appendChild(c1);
        row.appendChild(c2);
        paramTable.appendChild(row);
      }
      modal.appendChild(paramTable);
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.addEventListener("keydown", _escHandler);

    // ─── Render Plot ─────────────────────────────────────────────────────────
    setTimeout(function () {
      renderPlot(kind, name, info, isRegularizer);
    }, 50);
  }

  // ─── RENDER PLOT ───────────────────────────────────────────────────────────

  function renderPlot(kind, name, info, isRegularizer) {
    var pd = document.getElementById(_PLOT_ID);
    if (!pd) return;
    if (typeof Plotly === "undefined") {
      pd.textContent = "[Plotly not loaded]";
      return;
    }

    if (isRegularizer) {
      renderRegularizerPlot(pd, name, info);
    } else if (info.sample) {
      renderInitializerPlot(pd, name, info);
    } else {
      pd.textContent = "[No visualization data]";
    }
  }

  function renderRegularizerPlot(pd, name, info) {
    var l1Val = (name === "l1" || name === "l1l2") ? 0.01 : 0;
    var l2Val = (name === "l2" || name === "l1l2") ? 0.01 : 0;

    var x = getXGrid(-3, 3, 200);
    var yL1 = [];
    var yL2 = [];
    var yCombined = [];

    for (var i = 0; i < x.length; i++) {
      var absX = Math.abs(x[i]);
      var l1Part = l1Val * absX;
      var l2Part = l2Val * x[i] * x[i];
      yL1.push(l1Part);
      yL2.push(l2Part);
      yCombined.push(l1Part + l2Part);
    }

    var traces = [];

    if (name === "l1" || name === "l1l2") {
      traces.push({
        x: x, y: yL1,
        type: "scatter", mode: "lines",
        name: "L1 penalty (|w|)",
        line: { color: "#f38ba8", width: 2 }
      });
    }

    if (name === "l2" || name === "l1l2") {
      traces.push({
        x: x, y: yL2,
        type: "scatter", mode: "lines",
        name: "L2 penalty (w²)",
        line: { color: "#89b4fa", width: 2 }
      });
    }

    if (name === "l1l2") {
      traces.push({
        x: x, y: yCombined,
        type: "scatter", mode: "lines",
        name: "L1+L2 combined",
        line: { color: "#a6e3a1", width: 2.5, dash: "dash" }
      });
    }

    var layout = {
      paper_bgcolor: "#313244",
      plot_bgcolor: "#313244",
      font: { color: "#cdd6f4", size: 12 },
      margin: { l: 60, r: 20, t: 10, b: 50 },
      xaxis: {
        title: { text: "Weight w", font: { color: "#a6adc8" } },
        gridcolor: "#45475a",
        zerolinecolor: "#585b70"
      },
      yaxis: {
        title: { text: "Penalty", font: { color: "#a6adc8" } },
        gridcolor: "#45475a",
        zerolinecolor: "#585b70"
      },
      legend: {
        orientation: "h",
        xanchor: "center",
        x: 0.5,
        y: 1.12,
        font: { size: 11, color: "#cdd6f4" }
      }
    };

    try { Plotly.newPlot(pd, traces, layout, { responsive: true, displayModeBar: false }); } catch (e) {}
  }

  function renderInitializerPlot(pd, name, info) {
    var fanIn = 128;
    var fanOut = 128;
    var N = 5000;

    var result = info.sample(N, fanIn, fanOut);

    // Histogram trace
    var histTrace = {
      x: result.data,
      type: "histogram",
      nbinsx: 50,
      name: "Sampled weights",
      marker: {
        color: "#89b4fa",
        line: { color: "#1e1e2e", width: 1 }
      },
      opacity: 0.85,
      histnorm: "probability density"
    };

    var traces = [histTrace];

    // Theoretical PDF overlay
    if (result.type === "normal") {
      var xGrid = getXGrid(-0.3, 0.3, 200);
      var pdfVals = [];
      for (var i = 0; i < xGrid.length; i++) {
        pdfVals.push(gaussianPDF(xGrid[i], result.mean, result.stddev));
      }
      traces.push({
        x: xGrid, y: pdfVals,
        type: "scatter", mode: "lines",
        name: "Theoretical PDF",
        line: { color: "#f38ba8", width: 2.5 }
      });
    } else if (result.type === "uniform") {
      var xGrid = getXGrid(result.min * 1.2, result.max * 1.2, 200);
      var pdfVals = [];
      for (var i = 0; i < xGrid.length; i++) {
        pdfVals.push(uniformPDF(xGrid[i], result.min, result.max));
      }
      traces.push({
        x: xGrid, y: pdfVals,
        type: "scatter", mode: "lines",
        name: "Theoretical PDF",
        line: { color: "#f38ba8", width: 2.5 }
      });
    }

    var xRange;
    if (result.type === "constant") {
      xRange = [result.min, result.max];
    } else {
      var allVals = result.data;
      var minVal = allVals[0], maxVal = allVals[0];
      for (var i = 1; i < allVals.length; i++) {
        if (allVals[i] < minVal) minVal = allVals[i];
        if (allVals[i] > maxVal) maxVal = allVals[i];
      }
      var pad = (maxVal - minVal) * 0.15 || 0.1;
      xRange = [minVal - pad, maxVal + pad];
    }

    var layout = {
      paper_bgcolor: "#313244",
      plot_bgcolor: "#313244",
      font: { color: "#cdd6f4", size: 12 },
      margin: { l: 60, r: 20, t: 10, b: 50 },
      xaxis: {
        title: { text: "Weight value", font: { color: "#a6adc8" } },
        gridcolor: "#45475a",
        zerolinecolor: "#585b70",
        range: xRange
      },
      yaxis: {
        title: { text: "Density", font: { color: "#a6adc8" } },
        gridcolor: "#45475a",
        zerolinecolor: "#585b70"
      },
      legend: {
        orientation: "h",
        xanchor: "center",
        x: 0.5,
        y: 1.12,
        font: { size: 11, color: "#cdd6f4" }
      },
      bargap: 0.02
    };

    try { Plotly.newPlot(pd, traces, layout, { responsive: true, displayModeBar: false }); } catch (e) {}
  }

  // ─── REMOVE POPUP ──────────────────────────────────────────────────────────

  function removePopup() {
    var overlay = document.getElementById(_POPUP_ID);
    if (overlay) {
      var pd = document.getElementById(_PLOT_ID);
      if (pd && typeof Plotly !== "undefined") {
        try { Plotly.purge(pd); } catch (e) {}
      }
      overlay.remove();
    }
    document.removeEventListener("keydown", _escHandler);
  }

  // ─── INJECT INFO ICONS INTO INITIALIZER/REGULARIZER SELECTS ────────────────

  function makeBtn(type, select) {
    var btn = document.createElement("img");
    btn.src = "_gui/icons/info.svg";
    btn.alt = "?";
    btn.style.cssText = "height:24px;width:auto;cursor:pointer;margin-left:6px;" +
      "vertical-align:middle;transition:transform 0.2s,opacity 0.2s;" +
      "display:inline-block;opacity:0.7;";
    btn.title = (L() === "de") ? "Was macht das?" : "What does this do?";
    btn.onmouseenter = function () { btn.style.transform = "scale(1.2) rotate(8deg)"; btn.style.opacity = "1"; };
    btn.onmouseleave = function () { btn.style.transform = "scale(1)"; btn.style.opacity = "0.7"; };
    btn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      buildPopup(type, select.value);
    };

    // Watch for value changes to rebuild popup if open
    select.addEventListener("change", function () {
      if (document.getElementById(_POPUP_ID)) {
        buildPopup(type, select.value);
      }
    });

    return btn;
  }

  function injectIcon(select, type) {
    if (select.dataset.infoInjected) return;
    select.dataset.infoInjected = "true";
    var btn = makeBtn(type, select);
    select.parentNode.insertBefore(btn, select.nextSibling);
  }

  // ─── WATCH FOR DYNAMICALLY CREATED SELECTS ─────────────────────────────────

  function injectForAllUninjected() {
    // Match all select elements with class ending in _initializer or _regularizer
    var allSelects = document.querySelectorAll("select.input_data");
    for (var i = 0; i < allSelects.length; i++) {
      var sel = allSelects[i];
      var cls = sel.className;
      if (cls.indexOf("skip_connection_initializer_select") !== -1) {
        injectIcon(sel, "initializer");
      } else if (cls.indexOf("_regularizer") !== -1) {
        injectIcon(sel, "regularizer");
      } else if (cls.indexOf("_initializer") !== -1) {
        injectIcon(sel, "initializer");
      }
    }
  }

  function watchForSelects() {
    injectForAllUninjected();

    var target = document.getElementById("layers_container");
    if (!target) {
      // Retry in case DOM not ready
      setTimeout(watchForSelects, 500);
      return;
    }

    var observer = new MutationObserver(function () {
      injectForAllUninjected();
    });

    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  // ─── INIT ───────────────────────────────────────────────────────────────────

  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", watchForSelects);
    } else {
      watchForSelects();
    }
  }

  init();

})();
