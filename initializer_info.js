"use strict";

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

  function _randn() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  function sampleUniform(n, min, max) {
    var arr = [];
    for (var i = 0; i < n; i++) arr.push(Math.random() * (max - min) + min);
    return arr;
  }

  function sampleNormal(n, mean, stddev) {
    var arr = [];
    for (var i = 0; i < n; i++) arr.push(_randn() * stddev + mean);
    return arr;
  }

  function sampleTruncatedNormal(n, mean, stddev, maxStd) {
    if (maxStd === undefined) maxStd = 2;
    var arr = [];
    for (var i = 0; i < n; i++) {
      var val;
      do { val = _randn() * stddev + mean; } while (Math.abs(val - mean) > maxStd * stddev);
      arr.push(val);
    }
    return arr;
  }

  function gaussianPDF(x, mean, stddev) {
    return (1 / (stddev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stddev, 2));
  }

  function uniformPDF(x, min, max) {
    if (x < min || x > max) return 0;
    return 1 / (max - min);
  }

  function getXGrid(min, max, steps) {
    var arr = [];
    var step = (max - min) / steps;
    for (var i = 0; i <= steps; i++) arr.push(min + i * step);
    return arr;
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  // ─── ESC HANDLER ───────────────────────────────────────────────────────────

  function _escHandler(e) {
    if (e.key === "Escape") removePopup();
  }

  // ─── TRANSLATIONS ─────────────────────────────────────────────────────────

  var i18n = {
    en: {
      title: "Initializers & Regularizers",
      initializerTab: "Weight Initializers",
      regularizerTab: "Regularizers",
      intuitionTitle: "Intuition",
      mathTitle: "The Formula",
      plotTitle: "Weight Distribution",
      regPlotTitle: "Penalty vs Weight Value",
      matrixTitle: "Example Matrix (4 × 5)",
      regMatrixTitle: "Example Calculation",
      whenTitle: "When to use",
      paramsTitle: "Parameters",
      selectLabel: "Choose:",
      playTitle: "Interactive Controls",
      SAMPLE_SIZE: "~5,000 sampled weights",
      weightLabel: "Weight w",
      penaltyLabel: "Penalty",
      densityLabel: "Density",
      regExplanation: "Regularizers add a penalty to the loss to prevent overfitting.",
      l1Desc: "L1 pushes weights toward 0 (sparsity)",
      l2Desc: "L2 keeps weights small (weight decay)"
    },
    de: {
      title: "Initialisierer & Regularisierer",
      initializerTab: "Gewichts-Initialisierer",
      regularizerTab: "Regularisierer",
      intuitionTitle: "Intuition",
      mathTitle: "Die Formel",
      plotTitle: "Gewichtsverteilung",
      regPlotTitle: "Strafe vs. Gewichtswert",
      matrixTitle: "Beispiel-Matrix (4 × 5)",
      regMatrixTitle: "Beispiel-Rechnung",
      whenTitle: "Wann verwenden",
      paramsTitle: "Parameter",
      selectLabel: "Auswahl:",
      playTitle: "Interaktive Steuerung",
      SAMPLE_SIZE: "~5.000 sample Gewichte",
      weightLabel: "Gewicht w",
      penaltyLabel: "Strafe",
      densityLabel: "Dichte",
      regExplanation: "Regularisierer fügen eine Strafe zur Verlustfunktion hinzu um Überanpassung zu verhindern.",
      l1Desc: "L1 drückt Gewichte in Richtung 0 (Sparsity)",
      l2Desc: "L2 hält Gewichte klein (Weight Decay)"
    }
  };

  // ─── INITIALIZER INFO DATA ─────────────────────────────────────────────────

  var initializerInfo = {
    glorotUniform: {
      en: {
        analogy: "The classic all-rounder. It picks random weights from a range that depends on the layer size. Big layers get small weights to keep the signal stable. Named after Xavier Glorot who showed this prevents gradients from vanishing or exploding in deep networks with tanh/sigmoid.",
        when_use: "• Good default for tanh and sigmoid activation\n• Balances variance between input and output\n• Works for Dense and Conv2D layers",
        when_not: "• For ReLU activation use He instead\n• For very deep networks consider He or LeCun"
      },
      de: {
        analogy: "Der klassische Allrounder. Er wählt zufällige Gewichte aus einem Bereich, der von der Layergröße abhängt. Große Layer bekommen kleine Gewichte um das Signal stabil zu halten. Benannt nach Xavier Glorot, der zeigte, dass dies verhindert, dass Gradienten in tiefen Netzen mit tanh/sigmoid verschwinden oder explodieren.",
        when_use: "• Gute Standardwahl für tanh und sigmoid Aktivierung\n• Balanciert die Varianz zwischen Eingabe und Ausgabe\n• Funktioniert für Dense und Conv2D Layer",
        when_not: "• Für ReLU Aktivierung He verwenden\n• Für sehr tiefe Netze He oder LeCun in Betracht ziehen"
      },
      math: "\\text{limit} = \\sqrt{\\frac{6}{\\text{fan}_{\\text{in}} + \\text{fan}_{\\text{out}}}}\\\\W \\sim U[-\\text{limit}, \\text{limit}]",
      params: { seed: "integer (optional)" },
      controls: { fan_in: { min: 1, max: 1024, default: 128, step: 1 }, fan_out: { min: 1, max: 1024, default: 128, step: 1 } },
      sample: function(n, fi, fo, ctrl) {
        var limit = Math.sqrt(6 / (fi + fo));
        return { data: sampleUniform(n, -limit, limit), min: -limit, max: limit, type: "uniform", limit: limit };
      }
    },
    glorotNormal: {
      en: {
        analogy: "Like glorotUniform but uses a bell curve (normal distribution) instead of a flat range. The weights cluster around 0, with fewer extreme values.",
        when_use: "• Good for tanh/sigmoid activations\n• Often preferred over the uniform version\n• Can give slightly better gradients",
        when_not: "• Not ideal for ReLU (use He)\n• May be slightly slower to sample than uniform"
      },
      de: {
        analogy: "Wie glorotUniform, aber verwendet eine Glockenkurve (Normalverteilung) statt eines flachen Bereichs. Die Gewichte clustern um 0, mit weniger extremen Werten.",
        when_use: "• Gut für tanh/sigmoid Aktivierungen\n• Oft der uniformen Version vorgezogen\n• Kann etwas bessere Gradienten liefern",
        when_not: "• Nicht ideal für ReLU (He verwenden)\n• Kann etwas langsamer zu sampeln sein als uniform"
      },
      math: "\\sigma = \\sqrt{\\frac{2}{\\text{fan}_{\\text{in}} + \\text{fan}_{\\text{out}}}}\\\\W \\sim \\mathcal{N}(0, \\sigma^2)\\text{ (truncated at 2 sigma)}",
      params: { seed: "integer (optional)" },
      controls: { fan_in: { min: 1, max: 1024, default: 128, step: 1 }, fan_out: { min: 1, max: 1024, default: 128, step: 1 } },
      sample: function(n, fi, fo, ctrl) {
        var stddev = Math.sqrt(2 / (fi + fo));
        return { data: sampleTruncatedNormal(n, 0, stddev, 2), mean: 0, stddev: stddev, type: "normal" };
      }
    },
    heNormal: {
      en: {
        analogy: "Made for ReLU! Since ReLU cuts off negative values, half the variance is lost. He compensates by making the weights slightly bigger. The standard choice for modern deep CNNs (ResNet, VGG).",
        when_use: "• Best choice for ReLU and PReLU\n• Keeps variance stable through ReLU layers\n• Standard for ResNet, VGG, etc.",
        when_not: "• May cause exploding gradients with tanh/sigmoid\n• For LeakyReLU: leCunNormal can work better"
      },
      de: {
        analogy: "Gemacht für ReLU! Da ReLU negative Werte abschneidet, geht die Hälfte der Varianz verloren. He gleicht das aus, indem die Gewichte etwas größer werden. Die Standardwahl für moderne CNNs (ResNet, VGG).",
        when_use: "• Beste Wahl für ReLU und PReLU\n• Hält die Varianz durch ReLU-Layer stabil\n• Standard für ResNet, VGG, etc.",
        when_not: "• Kann zu explodierenden Gradienten bei tanh/sigmoid führen\n• Für LeakyReLU: leCunNormal kann besser sein"
      },
      math: "\\sigma = \\sqrt{\\frac{2}{\\text{fan}_{\\text{in}}}}\\\\W \\sim \\mathcal{N}(0, \\sigma^2)\\text{ (truncated at 2 sigma)}",
      params: { seed: "integer (optional)" },
      controls: { fan_in: { min: 1, max: 1024, default: 128, step: 1 } },
      sample: function(n, fi, fo, ctrl) {
        var stddev = Math.sqrt(2 / fi);
        return { data: sampleTruncatedNormal(n, 0, stddev, 2), mean: 0, stddev: stddev, type: "normal" };
      }
    },
    heUniform: {
      en: {
        analogy: "The uniform version of He. Same idea — compensate for ReLU's negative cutoff — but uses a flat range instead of a bell curve.",
        when_use: "• Good for ReLU\n• Can be more stable than heNormal in some cases\n• Simpler distribution",
        when_not: "• heNormal often preferred\n• Not for tanh/sigmoid"
      },
      de: {
        analogy: "Die uniforme Version von He. Gleiche Idee — kompensiert die ReLU-Abschneidung — aber verwendet einen flachen Bereich statt einer Glockenkurve.",
        when_use: "• Gut für ReLU\n• Kann in manchen Fällen stabiler sein als heNormal\n• Einfachere Verteilung",
        when_not: "• heNormal wird oft bevorzugt\n• Nicht für tanh/sigmoid"
      },
      math: "\\text{limit} = \\sqrt{\\frac{6}{\\text{fan}_{\\text{in}}}}\\\\W \\sim U[-\\text{limit}, \\text{limit}]",
      params: { seed: "integer (optional)" },
      controls: { fan_in: { min: 1, max: 1024, default: 128, step: 1 } },
      sample: function(n, fi, fo, ctrl) {
        var limit = Math.sqrt(6 / fi);
        return { data: sampleUniform(n, -limit, limit), min: -limit, max: limit, type: "uniform", limit: limit };
      }
    },
    leCunNormal: {
      en: {
        analogy: "Designed for Self-Normalizing Neural Networks with SeLU activation. Creates the specific variance that preserves SeLU's normalizing property. Also good for LeakyReLU.",
        when_use: "• Required for SeLU activation (self-normalizing nets)\n• Good for LeakyReLU\n• Keeps variance of 1 through the layer",
        when_not: "• Overkill for standard ReLU (use He instead)\n• Not for tanh/sigmoid"
      },
      de: {
        analogy: "Entwickelt für selbstnormalisierende neuronale Netze mit SeLU-Aktivierung. Erzeugt die spezifische Varianz, die SeLUs normalisierende Eigenschaft bewahrt. Auch gut für LeakyReLU.",
        when_use: "• Erforderlich für SeLU-Aktivierung (selbstnormalisierende Netze)\n• Gut für LeakyReLU\n• Hält Varianz von 1 durch den Layer",
        when_not: "• Überdimensioniert für Standard-ReLU (He verwenden)\n• Nicht für tanh/sigmoid"
      },
      math: "\\sigma = \\sqrt{\\frac{1}{\\text{fan}_{\\text{in}}}}\\\\W \\sim \\mathcal{N}(0, \\sigma^2)\\text{ (truncated at 2 sigma)}",
      params: { seed: "integer (optional)" },
      controls: { fan_in: { min: 1, max: 1024, default: 128, step: 1 } },
      sample: function(n, fi, fo, ctrl) {
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
      controls: { fan_in: { min: 1, max: 1024, default: 128, step: 1 } },
      sample: function(n, fi, fo, ctrl) {
        var limit = Math.sqrt(3 / fi);
        return { data: sampleUniform(n, -limit, limit), min: -limit, max: limit, type: "uniform", limit: limit };
      }
    },
    randomNormal: {
      en: {
        analogy: "Simple normal distribution with configurable mean and standard deviation. No smart scaling — you control the spread manually.",
        when_use: "• When you need specific mean/stddev values\n• Research and experimentation",
        when_not: "• For most practical cases use glorot or He instead\n• Can easily cause vanishing/exploding gradients"
      },
      de: {
        analogy: "Einfache Normalverteilung mit konfigurierbarem Mittelwert und Standardabweichung. Keine intelligente Skalierung — du kontrollierst die Streuung manuell.",
        when_use: "• Wenn spezifische mean/stddev Werte benötigt werden\n• Forschung und Experimente",
        when_not: "• Für die meisten praktischen Fälle glorot oder He verwenden\n• Kann leicht zu verschwindenden/explodierenden Gradienten führen"
      },
      math: "W \\sim \\mathcal{N}(\\text{mean}, \\text{stddev}^2)",
      params: { mean: "0", stddev: "0.05", seed: "integer (optional)" },
      controls: { mean: { min: -1, max: 1, default: 0, step: 0.01 }, stddev: { min: 0.001, max: 1, default: 0.05, step: 0.001 } },
      sample: function(n, fi, fo, ctrl) {
        return { data: sampleNormal(n, ctrl.mean, ctrl.stddev), mean: ctrl.mean, stddev: ctrl.stddev, type: "normal" };
      }
    },
    randomUniform: {
      en: {
        analogy: "Simple uniform distribution. You set the min and max values. No adaptation to layer size.",
        when_use: "• When you need a specific range\n• Simple setups where layer size is constant",
        when_not: "• Most cases: use glorot or He instead\n• Risk of poor scaling for variable-sized layers"
      },
      de: {
        analogy: "Einfache Gleichverteilung. Du setzt die min und max Werte. Keine Anpassung an die Layergröße.",
        when_use: "• Wenn ein bestimmter Bereich benötigt wird\n• Einfache Setups mit konstanter Layergröße",
        when_not: "• Meistens glorot oder He stattdessen verwenden\n• Risiko schlechter Skalierung bei variablen Layergrößen"
      },
      math: "W \\sim U[\\text{minval}, \\text{maxval}]",
      params: { minval: "-0.05", maxval: "0.05", seed: "integer (optional)" },
      controls: { minval: { min: -1, max: 0, default: -0.05, step: 0.01 }, maxval: { min: 0, max: 1, default: 0.05, step: 0.01 } },
      sample: function(n, fi, fo, ctrl) {
        return { data: sampleUniform(n, ctrl.minval, ctrl.maxval), min: ctrl.minval, max: ctrl.maxval, type: "uniform" };
      }
    },
    truncatedNormal: {
      en: {
        analogy: "Like randomNormal, but values more than 2 standard deviations from the mean are thrown away and re-sampled. This prevents extreme weight values that could cause training instability.",
        when_use: "• When you want a normal distribution without outliers\n• Often used as the base for glorotNormal and heNormal",
        when_not: "• Use glorotNormal or heNormal instead — they do the same but smarter\n• For simple cases randomNormal may suffice"
      },
      de: {
        analogy: "Wie randomNormal, aber Werte mehr als 2 Standardabweichungen vom Mittelwert werden verworfen und neu gezogen. Das verhindert extreme Gewichtswerte, die zu Trainingsinstabilität führen könnten.",
        when_use: "• Wenn eine Normalverteilung ohne Ausreißer gewünscht ist\n• Oft als Basis für glorotNormal und heNormal verwendet",
        when_not: "• glorotNormal oder heNormal stattdessen verwenden — sie tun dasselbe aber intelligenter\n• Für einfache Fälle reicht randomNormal"
      },
      math: "W \\sim \\mathcal{N}(\\text{mean}, \\text{stddev}^2)\\text{, truncated at }\\pm 2\\sigma",
      params: { mean: "0", stddev: "0.05", seed: "integer (optional)" },
      controls: { mean: { min: -1, max: 1, default: 0, step: 0.01 }, stddev: { min: 0.001, max: 1, default: 0.05, step: 0.001 } },
      sample: function(n, fi, fo, ctrl) {
        return { data: sampleTruncatedNormal(n, ctrl.mean, ctrl.stddev, 2), mean: ctrl.mean, stddev: ctrl.stddev, type: "normal" };
      }
    },
    varianceScaling: {
      en: {
        analogy: "The most flexible initializer. You control the scale, the mode (how to count neurons), and the distribution type. It's like glorot/He but with knobs for everything.",
        when_use: "• When you need fine-grained control\n• Research and custom architectures",
        when_not: "• For standard architectures use glorot or He\n• Easy to misconfigure (wrong scale/mode/distribution)"
      },
      de: {
        analogy: "Der flexibelste Initialisierer. Du kontrollierst die Skalierung, den Modus (wie Neuronen gezählt werden) und die Verteilungsart. Es ist wie glorot/He, aber mit Reglern für alles.",
        when_use: "• Wenn feine Kontrolle benötigt wird\n• Forschung und benutzerdefinierte Architekturen",
        when_not: "• Für Standardarchitekturen glorot oder He verwenden\n• Leicht falsch zu konfigurieren (falsche scale/mode/distribution)"
      },
      math: "\\text{stddev} = \\sqrt{\\frac{\\text{scale}}{n}}\\quad(\\text{normal})\\\\\\text{limit} = \\sqrt{3 \\cdot \\text{scale} / n}\\quad(\\text{uniform})\\\\n = \\text{fan}_{\\text{in}}\\,|\\,\\text{fan}_{\\text{out}}\\,|\\,\\text{avg}",
      params: { scale: "1.0", mode: "FAN_IN / FAN_OUT / FAN_AVG", distribution: "NORMAL / UNIFORM", seed: "integer (optional)" },
      controls: { scale: { min: 0.01, max: 10, default: 1, step: 0.01 }, fan_in: { min: 1, max: 1024, default: 128, step: 1 }, mode: { options: ["FAN_IN", "FAN_OUT", "FAN_AVG"], default: "FAN_IN" }, distribution: { options: ["NORMAL", "UNIFORM"], default: "NORMAL" } },
      sample: function(n, fi, fo, ctrl) {
        var nVal = fi;
        if (ctrl.mode === "FAN_OUT") nVal = fo;
        else if (ctrl.mode === "FAN_AVG") nVal = (fi + fo) / 2;
        if (ctrl.distribution === "UNIFORM") {
          var limit = Math.sqrt(3 * ctrl.scale / nVal);
          return { data: sampleUniform(n, -limit, limit), min: -limit, max: limit, type: "uniform", limit: limit };
        }
        var stddev = Math.sqrt(ctrl.scale / nVal);
        return { data: sampleTruncatedNormal(n, 0, stddev, 2), mean: 0, stddev: stddev, type: "normal" };
      }
    },
    orthogonal: {
      en: {
        analogy: "Creates a random orthogonal matrix — the weight matrix's columns are perpendicular and have length 1. This preserves the input norm through the layer, which helps very deep networks train better.",
        when_use: "• Very deep networks (50+ layers)\n• Recurrent networks (RNNs, LSTMs)",
        when_not: "• Shallow networks don't benefit much\n• Only works for 2D weight matrices (not Conv filters)"
      },
      de: {
        analogy: "Erzeugt eine zufällige orthogonale Matrix — die Spalten der Gewichtsmatrix sind senkrecht zueinander und haben Länge 1. Das bewahrt die Eingabenorm durch den Layer, was sehr tiefen Netzen hilft.",
        when_use: "• Sehr tiefe Netze (50+ Layer)\n• Wiederkehrende Netze (RNNs, LSTMs)",
        when_not: "• Flache Netze profitieren kaum\n• Funktioniert nur für 2D Gewichtsmatrizen (nicht Conv-Filter)"
      },
      math: "W = Q\\quad\\text{where}\\quad Q^T Q = I",
      params: { gain: "1.0", seed: "integer (optional)" },
      controls: { gain: { min: 0.1, max: 5, default: 1, step: 0.1 } },
      sample: function(n, fi, fo, ctrl) {
        var stddev = ctrl.gain / Math.sqrt(fi);
        return { data: sampleNormal(n, 0, stddev), mean: 0, stddev: stddev, type: "normal" };
      }
    },
    zeros: {
      en: {
        analogy: "Sets all weights to zero. Every neuron starts identical — they all output zero. This causes the symmetry problem: identical neurons get identical gradients and learn nothing different. Only use for biases, never for weights.",
        when_use: "• Good for bias initialization\n• Testing/debugging",
        when_not: "• NEVER for weights! All neurons become identical\n• Causes symmetry problem"
      },
      de: {
        analogy: "Setzt alle Gewichte auf Null. Jedes Neuron startet identisch — alle geben Null aus. Das verursacht das Symmetrieproblem: identische Neuronen bekommen identische Gradienten. Nur für Biases verwenden, niemals für Gewichte.",
        when_use: "• Gut für Bias-Initialisierung\n• Testen/Debuggen",
        when_not: "• NIEMALS für Gewichte! Alle Neuronen werden identisch\n• Verursacht Symmetrieproblem"
      },
      math: "W = 0",
      params: {},
      controls: {},
      sample: function(n, fi, fo, ctrl) {
        var arr = []; for (var i = 0; i < n; i++) arr.push(0);
        return { data: arr, min: -0.1, max: 0.1, type: "constant" };
      }
    },
    ones: {
      en: {
        analogy: "Sets all weights to 1. Like zeros, this creates identical neurons (symmetry problem). Rarely useful — only for very specific architectures or testing.",
        when_use: "• Very specific custom architectures\n• Testing/debugging",
        when_not: "• Almost never for weights (symmetry problem)\n• Not for biases either (biases are usually 0)"
      },
      de: {
        analogy: "Setzt alle Gewichte auf 1. Wie bei Null erzeugt dies identische Neuronen (Symmetrieproblem). Selten nützlich — nur für sehr spezielle Architekturen oder Tests.",
        when_use: "• Sehr spezielle benutzerdefinierte Architekturen\n• Testen/Debuggen",
        when_not: "• Fast nie für Gewichte (Symmetrieproblem)\n• Auch nicht für Biases (Biases sind normalerweise 0)"
      },
      math: "W = 1",
      params: {},
      controls: {},
      sample: function(n, fi, fo, ctrl) {
        var arr = []; for (var i = 0; i < n; i++) arr.push(1);
        return { data: arr, min: 0.9, max: 1.1, type: "constant" };
      }
    },
    constant: {
      en: {
        analogy: "Sets all weights to any value you choose. Full control but same symmetry problem as zeros/ones.",
        when_use: "• When you need a specific non-random value\n• Testing\n• Bias initialization",
        when_not: "• Not for hidden layer weights (symmetry problem)\n• Random initialization almost always better"
      },
      de: {
        analogy: "Setzt alle Gewichte auf einen beliebigen Wert deiner Wahl. Volle Kontrolle, aber dasselbe Symmetrieproblem wie zeros/ones.",
        when_use: "• Wenn ein bestimmter nicht-zufälliger Wert benötigt wird\n• Testen\n• Bias-Initialisierung",
        when_not: "• Nicht für verborgene Layer-Gewichte (Symmetrieproblem)\n• Zufällige Initialisierung ist fast immer besser"
      },
      math: "W = \\text{value}",
      params: { value: "0.5" },
      controls: { value: { min: -5, max: 5, default: 0.5, step: 0.1 } },
      sample: function(n, fi, fo, ctrl) {
        var arr = []; for (var i = 0; i < n; i++) arr.push(ctrl.value);
        return { data: arr, min: ctrl.value - 0.1, max: ctrl.value + 0.1, type: "constant" };
      }
    },
    identity: {
      en: {
        analogy: "Creates the identity matrix — 1s on the diagonal, 0s elsewhere. The output equals the input. Only works for square weight matrices.",
        when_use: "• When you want a layer to start as the identity\n• Residual network initializations",
        when_not: "• Only works for square 2D matrices\n• Not for convolutional layers\n• Rarely needed"
      },
      de: {
        analogy: "Erzeugt die Einheitsmatrix — 1en auf der Diagonale, 0en sonst. Die Ausgabe ist gleich der Eingabe. Funktioniert nur für quadratische Gewichtsmatrizen.",
        when_use: "• Wenn ein Layer als Identität starten soll\n• Residuale Netze (ResNet) Initialisierungen",
        when_not: "• Funktioniert nur für quadratische 2D-Matrizen\n• Nicht für convolutional Layer\n• Selten benötigt"
      },
      math: "W = I\\quad(\\text{Einheitsmatrix})",
      params: { gain: "1.0" },
      controls: { gain: { min: 0.1, max: 5, default: 1, step: 0.1 } },
      sample: function(n, fi, fo, ctrl) {
        var size = Math.ceil(Math.sqrt(n));
        var arr = [];
        for (var i = 0; i < n; i++) {
          var row = Math.floor(i / size), col = i % size;
          arr.push(row === col ? ctrl.gain : 0);
        }
        return { data: arr, min: -0.1, max: ctrl.gain + 0.1, type: "constant" };
      }
    }
  };

  // ─── REGULARIZER INFO DATA ────────────────────────────────────────────────

  var regularizerInfo = {
    none: {
      en: {
        analogy: "No regularization. The model is free to use any weight values. This can lead to overfitting (memorizing the training data instead of learning general patterns).",
        when_use: "• Very simple problems (few features, lots of data)\n• When you want the most flexible model",
        when_not: "• Most real-world problems need SOME regularization\n• Without regularization the model may overfit easily"
      },
      de: {
        analogy: "Keine Regularisierung. Das Modell kann beliebige Gewichtswerte verwenden. Das kann zu Überanpassung führen (Auswendiglernen der Trainingsdaten statt Lernen allgemeiner Muster).",
        when_use: "• Sehr einfache Probleme (wenige Features, viele Daten)\n• Wenn das flexibelste Modell gewünscht ist",
        when_not: "• Die meisten echten Probleme brauchen IRGENDEINE Regularisierung\n• Ohne Regularisierung kann das Modell leicht überanpassen"
      },
      math: "\\text{Penalty} = 0",
      controls: {}
    },
    l1: {
      en: {
        analogy: "L1 adds a penalty equal to the absolute value of each weight. This pushes small weights to exactly 0 (sparsity). Think of it as a 'use it or lose it' penalty — unimportant connections get pruned away completely.",
        when_use: "• Feature selection (pushes irrelevant weights to 0)\n• Interpretability (sparse models)\n• When you want exactly 0 weights",
        when_not: "• If you only need small weights (use L2 instead)\n• L1 can cause instability with some optimizers"
      },
      de: {
        analogy: "L1 addiert eine Strafe in Höhe des absoluten Werts jedes Gewichts. Das drückt kleine Gewichte auf exakt 0 (Sparsity). Denk daran wie eine 'benutze es oder verliere es'-Strafe — unwichtige Verbindungen werden komplett entfernt.",
        when_use: "• Feature-Auswahl (drückt irrelevante Gewichte auf 0)\n• Interpretierbarkeit (dünn besetzte Modelle)\n• Wenn exakte 0-Gewichte gewünscht sind",
        when_not: "• Wenn nur kleine Gewichte gebraucht werden (L2 stattdessen)\n• L1 kann bei manchen Optimierern Instabilität verursachen"
      },
      math: "\\text{Penalty}_{L1} = \\text{l1} \\cdot \\sum |W|",
      controls: { l1: { min: 0, max: 0.1, default: 0.01, step: 0.001 } },
      penalty: function(w, ctrl) { return ctrl.l1 * Math.abs(w); }
    },
    l2: {
      en: {
        analogy: "L2 adds a penalty equal to the SQUARE of each weight. Large weights get heavily punished, small weights barely feel it. This keeps all weights small but not exactly 0. Also called weight decay.",
        when_use: "• Default choice for most neural networks\n• Prevents overfitting by keeping weights small\n• Works well with most optimizers",
        when_not: "• If you need sparsity (use L1 instead)\n• Very high L2 can underfit (model becomes too simple)"
      },
      de: {
        analogy: "L2 addiert eine Strafe in Höhe des QUADRATS jedes Gewichts. Große Gewichte werden stark bestraft, kleine Gewichte spüren es kaum. Das hält alle Gewichte klein, aber nicht exakt 0. Auch 'Weight Decay' genannt.",
        when_use: "• Standardwahl für die meisten neuronalen Netze\n• Verhindert Überanpassung durch kleine Gewichte\n• Funktioniert gut mit den meisten Optimierern",
        when_not: "• Wenn Sparsity benötigt wird (L1 stattdessen)\n• Sehr hohes L2 kann zu Unteranpassung führen (Modell wird zu einfach)"
      },
      math: "\\text{Penalty}_{L2} = \\text{l2} \\cdot \\sum W^2",
      controls: { l2: { min: 0, max: 0.1, default: 0.01, step: 0.001 } },
      penalty: function(w, ctrl) { return ctrl.l2 * w * w; }
    },
    l1l2: {
      en: {
        analogy: "The best of both worlds — L1 for sparsity AND L2 for small weights. L1 prunes unimportant connections to 0 while L2 keeps the remaining weights small. You get a compact AND stable model.",
        when_use: "• When you want both sparsity AND small weights\n• Complex models with many parameters\n• Best regularizer if you can tune both parameters",
        when_not: "• More hyperparameters to tune (l1 and l2)\n• If the dataset is very small, simpler regularization may be enough"
      },
      de: {
        analogy: "Das Beste aus beiden Welten — L1 für Sparsity UND L2 für kleine Gewichte. L1 entfernt unwichtige Verbindungen auf 0 während L2 die verbleibenden Gewichte klein hält. Ein kompaktes UND stabiles Modell.",
        when_use: "• Wenn sowohl Sparsity als auch kleine Gewichte gewünscht sind\n• Komplexe Modelle mit vielen Parametern\n• Bester Regularisierer wenn beide Parameter eingestellt werden können",
        when_not: "• Mehr Hyperparameter zum Einstellen (l1 und l2)\n• Bei sehr kleinen Datensätzen reicht einfachere Regularisierung"
      },
      math: "\\text{Penalty}_{L1L2} = \\text{l1} \\cdot \\sum |W| + \\text{l2} \\cdot \\sum W^2",
      controls: { l1: { min: 0, max: 0.1, default: 0.005, step: 0.001 }, l2: { min: 0, max: 0.1, default: 0.005, step: 0.001 } },
      penalty: function(w, ctrl) { return ctrl.l1 * Math.abs(w) + ctrl.l2 * w * w; }
    }
  };

  // ─── STATE ─────────────────────────────────────────────────────────────────

  var _state = {
    kind: "initializer",
    name: "glorotUniform",
    controls: {}
  };

  // ─── BUILD POPUP ───────────────────────────────────────────────────────────

  function buildPopup(kind, name) {
    removePopup();
    _state.kind = kind;
    _state.name = name;

    var t = i18n[L()];
    var modal = _buildModalShell(t);

    // ─── Selector row ───
    var selectorRow = _buildSelector(modal, t);
    modal.appendChild(selectorRow);

    // ─── Content container (rebuilt when selector changes) ───
    var content = document.createElement("div");
    content.id = _POPUP_ID + "_content";
    modal.appendChild(content);

    // ─── Build initial content ───
    _rebuildContent(content, t);

    // ─── Finish overlay ───
    var overlay = document.createElement("div");
    overlay.id = _POPUP_ID;
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;" +
      "background:rgba(0,0,0,0.75);z-index:99999;display:flex;align-items:center;" +
      "justify-content:center;padding:16px;box-sizing:border-box;";
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.addEventListener("keydown", _escHandler);

    setTimeout(function () { _renderPlot(content); }, 50);
  }

  function _buildModalShell(t) {
    var modal = document.createElement("div");
    modal.style.cssText = "background:#1e1e2e;color:#cdd6f4;border-radius:16px;" +
      "width:min(97vw,1100px);max-height:94vh;overflow-y:auto;padding:28px 32px;" +
      "position:relative;box-shadow:0 30px 80px rgba(0,0,0,0.7);" +
      "font-family:'Segoe UI',system-ui,sans-serif;";

    var closeBtn = document.createElement("button");
    closeBtn.innerHTML = "✕";
    closeBtn.style.cssText = "position:sticky;top:0;float:right;background:#f38ba8;" +
      "border:none;color:#1e1e2e;font-size:20px;font-weight:bold;width:36px;height:36px;" +
      "border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;" +
      "transition:transform 0.2s;z-index:10;margin-left:auto;flex-shrink:0;";
    closeBtn.onmouseenter = function () { closeBtn.style.transform = "scale(1.2)"; };
    closeBtn.onmouseleave = function () { closeBtn.style.transform = "scale(1)"; };
    closeBtn.onclick = removePopup;
    modal.appendChild(closeBtn);

    return modal;
  }

  function _buildSelector(modal, t) {
    var row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;";

    var label = document.createElement("span");
    label.style.cssText = "font-size:14px;color:#a6adc8;";
    label.textContent = t.selectLabel;
    row.appendChild(label);

    var select = document.createElement("select");
    select.style.cssText = "background:#45475a;color:#cdd6f4;border:1px solid #585b70;" +
      "border-radius:6px;padding:6px 10px;font-size:14px;cursor:pointer;flex:1;min-width:200px;";

    // Initializers group
    var initOptgroup = document.createElement("optgroup");
    initOptgroup.label = t.initializerTab;
    var initKeys = Object.keys(initializerInfo);
    for (var i = 0; i < initKeys.length; i++) {
      var opt = document.createElement("option");
      opt.value = "init:" + initKeys[i];
      opt.textContent = initKeys[i];
      if (_state.kind === "initializer" && _state.name === initKeys[i]) opt.selected = true;
      initOptgroup.appendChild(opt);
    }
    select.appendChild(initOptgroup);

    // Regularizers group
    var regOptgroup = document.createElement("optgroup");
    regOptgroup.label = t.regularizerTab;
    var regKeys = Object.keys(regularizerInfo);
    for (var i = 0; i < regKeys.length; i++) {
      var opt = document.createElement("option");
      opt.value = "reg:" + regKeys[i];
      opt.textContent = regKeys[i];
      if (_state.kind === "regularizer" && _state.name === regKeys[i]) opt.selected = true;
      regOptgroup.appendChild(opt);
    }
    select.appendChild(regOptgroup);

    select.onchange = function () {
      var val = this.value;
      var parts = val.split(":");
      _state.kind = parts[0] === "init" ? "initializer" : "regularizer";
      _state.name = parts[1];
      _state.controls = {};
      var content = document.getElementById(_POPUP_ID + "_content");
      if (content) _rebuildContent(content, i18n[L()]);
    };

    row.appendChild(select);
    return row;
  }

  function _rebuildContent(container, t) {
    container.innerHTML = "";
    var isReg = _state.kind === "regularizer";
    var info = isReg ? regularizerInfo[_state.name] : initializerInfo[_state.name];
    if (!info) return;

    // Init controls state from defaults
    if (Object.keys(_state.controls).length === 0 && info.controls) {
      var cKeys = Object.keys(info.controls);
      for (var ci = 0; ci < cKeys.length; ci++) {
        var def = info.controls[cKeys[ci]].default;
        _state.controls[cKeys[ci]] = def !== undefined ? def : 0;
      }
    }

    // Title
    var title = document.createElement("h2");
    var displayName = _state.name.charAt(0).toUpperCase() + _state.name.slice(1);
    title.textContent = displayName;
    title.style.cssText = "margin:0 0 4px 0;color:#89b4fa;font-size:20px;";
    container.appendChild(title);

    // Category label
    var catLabel = document.createElement("div");
    catLabel.style.cssText = "font-size:11px;color:#585b70;margin-bottom:14px;" +
      "text-transform:uppercase;letter-spacing:1px;";
    catLabel.textContent = isReg ? t.regularizerTab : t.initializerTab;
    container.appendChild(catLabel);

    // Intuition
    var locInfo = L() === "de" ? info.de : info.en;
    var intH = document.createElement("h3");
    intH.textContent = t.intuitionTitle;
    intH.style.cssText = "color:#f9e2af;margin:0 0 6px 0;font-size:15px;";
    container.appendChild(intH);

    var intBox = document.createElement("div");
    intBox.style.cssText = "background:#313244;border-radius:10px;padding:14px;" +
      "margin-bottom:16px;font-size:13px;line-height:1.7;border-left:4px solid #f9e2af;";
    intBox.textContent = locInfo.analogy;
    container.appendChild(intBox);

    // Math
    if (info.math) {
      var mathH = document.createElement("h3");
      mathH.textContent = t.mathTitle;
      mathH.style.cssText = "color:#89b4fa;margin:16px 0 6px 0;font-size:15px;";
      container.appendChild(mathH);

      var mathBox = document.createElement("div");
      mathBox.style.cssText = "background:#313244;border-radius:10px;padding:14px;" +
        "margin-bottom:16px;border-left:4px solid #89b4fa;overflow-x:auto;text-align:center;";
      mathBox.innerHTML = renderMathBlock(info.math);
      container.appendChild(mathBox);
    }

    // Interactive Controls
    if (info.controls && Object.keys(info.controls).length > 0) {
      var playH = document.createElement("h3");
      playH.textContent = t.playTitle;
      playH.style.cssText = "color:#fab387;margin:16px 0 6px 0;font-size:15px;";
      container.appendChild(playH);

      var controlsBox = document.createElement("div");
      controlsBox.style.cssText = "background:#313244;border-radius:10px;padding:14px;" +
        "margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;";

      var cKeys = Object.keys(info.controls);
      for (var ci = 0; ci < cKeys.length; ci++) {
        var ctrlDef = info.controls[cKeys[ci]];
        var ctrlEl = _buildControl(cKeys[ci], ctrlDef, container, t);
        controlsBox.appendChild(ctrlEl);
      }
      container.appendChild(controlsBox);
    }

    // Plot
    var plotH = document.createElement("h3");
    plotH.textContent = isReg ? t.regPlotTitle : t.plotTitle;
    plotH.style.cssText = "color:#a6e3a1;margin:16px 0 6px 0;font-size:15px;";
    container.appendChild(plotH);

    var plotBox = document.createElement("div");
    plotBox.style.cssText = "background:#313244;border-radius:10px;padding:12px;" +
      "margin-bottom:16px;position:relative;";

    if (!isReg) {
      var sampleLabel = document.createElement("div");
      sampleLabel.style.cssText = "font-size:10px;color:#585b70;margin-bottom:4px;text-align:right;";
      sampleLabel.textContent = t.SAMPLE_SIZE;
      plotBox.appendChild(sampleLabel);
    }

    var plotDiv = document.createElement("div");
    plotDiv.id = _PLOT_ID;
    plotDiv.style.cssText = "width:100%;height:280px;";
    plotBox.appendChild(plotDiv);
    container.appendChild(plotBox);

    // Example matrix
    if (!isReg) {
      _buildInitMatrix(container, info, t);
    } else {
      _buildRegMatrix(container, info, t);
    }

    // When to use
    if (locInfo.when_use) {
      var whenH = document.createElement("h3");
      whenH.textContent = t.whenTitle;
      whenH.style.cssText = "color:#cba6f7;margin:16px 0 6px 0;font-size:15px;";
      container.appendChild(whenH);

      var whenGrid = document.createElement("div");
      whenGrid.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;";

      var useBox = document.createElement("div");
      useBox.style.cssText = "background:#313244;border-radius:10px;padding:12px;" +
        "border-left:4px solid #a6e3a1;font-size:12px;line-height:1.6;white-space:pre-wrap;";
      useBox.textContent = locInfo.when_use;
      whenGrid.appendChild(useBox);

      if (locInfo.when_not) {
        var notBox = document.createElement("div");
        notBox.style.cssText = "background:#313244;border-radius:10px;padding:12px;" +
          "border-left:4px solid #f38ba8;font-size:12px;line-height:1.6;white-space:pre-wrap;";
        notBox.textContent = locInfo.when_not;
        whenGrid.appendChild(notBox);
      }
      container.appendChild(whenGrid);
    }

    // Params reference table
    if (info.params && Object.keys(info.params).length > 0) {
      var paramH = document.createElement("h3");
      paramH.textContent = t.paramsTitle;
      paramH.style.cssText = "color:#585b70;margin:12px 0 6px 0;font-size:13px;";
      container.appendChild(paramH);

      var paramTable = document.createElement("table");
      paramTable.style.cssText = "width:100%;border-collapse:collapse;margin-bottom:16px;" +
        "font-size:12px;background:#313244;border-radius:8px;overflow:hidden;";

      var pKeys = Object.keys(info.params);
      for (var pi = 0; pi < pKeys.length; pi++) {
        var row = document.createElement("tr");
        row.style.cssText = pi % 2 === 0 ? "background:#313244;" : "background:#363849;";
        var c1 = document.createElement("td");
        c1.style.cssText = "padding:4px 10px;color:#fab387;font-family:monospace;width:30%;";
        c1.textContent = pKeys[pi];
        var c2 = document.createElement("td");
        c2.style.cssText = "padding:4px 10px;color:#a6adc8;";
        c2.textContent = info.params[pKeys[pi]];
        row.appendChild(c1);
        row.appendChild(c2);
        paramTable.appendChild(row);
      }
      container.appendChild(paramTable);
    }

    // Render plot after DOM insertion
    setTimeout(function () { _renderPlot(container); }, 50);
    _renderMatrix(container, info, t);
  }

  // ─── BUILD CONTROL ─────────────────────────────────────────────────────────

  function _buildControl(key, ctrlDef, contentContainer, t) {
    var wrapper = document.createElement("div");
    wrapper.style.cssText = "display:flex;flex-direction:column;gap:4px;min-width:140px;flex:1;";

    var label = document.createElement("label");
    label.style.cssText = "font-size:11px;color:#a6adc8;";
    label.textContent = key;
    wrapper.appendChild(label);

    if (ctrlDef.options) {
      // Select control
      var sel = document.createElement("select");
      sel.style.cssText = "background:#45475a;color:#cdd6f4;border:1px solid #585b70;" +
        "border-radius:4px;padding:4px 6px;font-size:12px;cursor:pointer;";
      for (var oi = 0; oi < ctrlDef.options.length; oi++) {
        var opt = document.createElement("option");
        opt.value = ctrlDef.options[oi];
        opt.textContent = ctrlDef.options[oi];
        if (_state.controls[key] === ctrlDef.options[oi]) opt.selected = true;
        sel.appendChild(opt);
      }
      sel.onchange = function () {
        _state.controls[key] = this.value;
        _onControlChange(contentContainer, t);
      };
      wrapper.appendChild(sel);
    } else {
      // Range + number combo
      var inner = document.createElement("div");
      inner.style.cssText = "display:flex;align-items:center;gap:6px;";

      var range = document.createElement("input");
      range.type = "range";
      range.min = ctrlDef.min;
      range.max = ctrlDef.max;
      range.step = ctrlDef.step;
      range.value = _state.controls[key] !== undefined ? _state.controls[key] : ctrlDef.default;
      range.style.cssText = "flex:1;accent-color:#89b4fa;height:4px;cursor:pointer;";

      var num = document.createElement("input");
      num.type = "number";
      num.min = ctrlDef.min;
      num.max = ctrlDef.max;
      num.step = ctrlDef.step;
      num.value = _state.controls[key] !== undefined ? _state.controls[key] : ctrlDef.default;
      num.style.cssText = "width:70px;background:#45475a;color:#cdd6f4;border:1px solid #585b70;" +
        "border-radius:4px;padding:3px 6px;font-size:12px;text-align:right;";

      range.oninput = function () {
        num.value = this.value;
        _state.controls[key] = parseFloat(this.value);
        _onControlChange(contentContainer, t);
      };
      num.oninput = function () {
        var v = parseFloat(this.value);
        if (!isNaN(v)) {
          v = clamp(v, ctrlDef.min, ctrlDef.max);
          range.value = v;
          _state.controls[key] = v;
          _onControlChange(contentContainer, t);
        }
      };

      inner.appendChild(range);
      inner.appendChild(num);
      wrapper.appendChild(inner);
    }

    return wrapper;
  }

  function _onControlChange(contentContainer, t) {
    _renderPlot(contentContainer);
    var info = _state.kind === "regularizer" ? regularizerInfo[_state.name] : initializerInfo[_state.name];
    _renderMatrix(contentContainer, info, t);
  }

  // ─── RENDER PLOT ───────────────────────────────────────────────────────────

  function _renderPlot(container) {
    var pd = document.getElementById(_PLOT_ID);
    if (!pd) return;
    if (typeof Plotly === "undefined") { pd.textContent = "[Plotly not loaded]"; return; }

    if (_state.kind === "regularizer") {
      _renderRegPlot(pd);
    } else {
      _renderInitPlot(pd);
    }
  }

  function _renderRegPlot(pd) {
    var info = regularizerInfo[_state.name];
    if (!info) return;

    var l1Mult = _state.controls.l1 || 0;
    var l2Mult = _state.controls.l2 || 0;

    var x = getXGrid(-3, 3, 200);
    var yL1 = [], yL2 = [], yCombined = [];

    for (var i = 0; i < x.length; i++) {
      var absX = Math.abs(x[i]);
      yL1.push(l1Mult * absX);
      yL2.push(l2Mult * x[i] * x[i]);
      yCombined.push(l1Mult * absX + l2Mult * x[i] * x[i]);
    }

    var traces = [];

    if (_state.name === "l1" || _state.name === "l1l2") {
      traces.push({ x: x, y: yL1, type: "scatter", mode: "lines", name: "L1 penalty", line: { color: "#f38ba8", width: 2 } });
    }
    if (_state.name === "l2" || _state.name === "l1l2") {
      traces.push({ x: x, y: yL2, type: "scatter", mode: "lines", name: "L2 penalty", line: { color: "#89b4fa", width: 2 } });
    }
    if (_state.name === "l1l2") {
      traces.push({ x: x, y: yCombined, type: "scatter", mode: "lines", name: "L1+L2 combined", line: { color: "#a6e3a1", width: 2.5, dash: "dash" } });
    }

    var layout = {
      paper_bgcolor: "#313244", plot_bgcolor: "#313244",
      font: { color: "#cdd6f4", size: 11 },
      margin: { l: 50, r: 16, t: 8, b: 40 },
      xaxis: { title: { text: "Weight w", font: { color: "#a6adc8", size: 11 } }, gridcolor: "#45475a", zerolinecolor: "#585b70" },
      yaxis: { title: { text: "Penalty", font: { color: "#a6adc8", size: 11 } }, gridcolor: "#45475a", zerolinecolor: "#585b70" },
      legend: { orientation: "h", xanchor: "center", x: 0.5, y: 1.15, font: { size: 10, color: "#cdd6f4" } }
    };

    try { Plotly.newPlot(pd, traces, layout, { responsive: true, displayModeBar: false }); } catch (e) {}
  }

  function _renderInitPlot(pd) {
    var info = initializerInfo[_state.name];
    if (!info || !info.sample) return;

    var fanIn = _state.controls.fan_in || 128;
    var fanOut = _state.controls.fan_out || 128;
    var N = 5000;

    var result = info.sample(N, fanIn, fanOut, _state.controls);

    var histTrace = {
      x: result.data, type: "histogram", nbinsx: 50,
      name: "Sampled weights",
      marker: { color: "#89b4fa", line: { color: "#1e1e2e", width: 1 } },
      opacity: 0.85, histnorm: "probability density"
    };
    var traces = [histTrace];

    // Theoretical PDF
    if (result.type === "normal") {
      var sorted = result.data.slice().sort(function(a,b){return a-b;});
      var lo = sorted[Math.floor(sorted.length * 0.01)] || -0.3;
      var hi = sorted[Math.floor(sorted.length * 0.99)] || 0.3;
      var pad = (hi - lo) * 0.2 || 0.1;
      var xGrid = getXGrid(lo - pad, hi + pad, 200);
      var pdfVals = [];
      for (var i = 0; i < xGrid.length; i++) {
        pdfVals.push(gaussianPDF(xGrid[i], result.mean, result.stddev));
      }
      traces.push({ x: xGrid, y: pdfVals, type: "scatter", mode: "lines", name: "Theoretical PDF", line: { color: "#f38ba8", width: 2.5 } });
    } else if (result.type === "uniform") {
      var xGrid = getXGrid(result.min * 1.3, result.max * 1.3, 200);
      var pdfVals = [];
      for (var i = 0; i < xGrid.length; i++) {
        pdfVals.push(uniformPDF(xGrid[i], result.min, result.max));
      }
      traces.push({ x: xGrid, y: pdfVals, type: "scatter", mode: "lines", name: "Theoretical PDF", line: { color: "#f38ba8", width: 2.5 } });
    }

    // Data range for x-axis
    var allVals = result.data;
    var minVal = allVals[0], maxVal = allVals[0];
    for (var i = 1; i < allVals.length; i++) {
      if (allVals[i] < minVal) minVal = allVals[i];
      if (allVals[i] > maxVal) maxVal = allVals[i];
    }
    var pad = (maxVal - minVal) * 0.1 || 0.1;
    if (result.type === "constant") { minVal = result.min; maxVal = result.max; pad = 0.05; }

    var layout = {
      paper_bgcolor: "#313244", plot_bgcolor: "#313244",
      font: { color: "#cdd6f4", size: 11 },
      margin: { l: 50, r: 16, t: 8, b: 40 },
      xaxis: { title: { text: "Weight value", font: { color: "#a6adc8", size: 11 } }, gridcolor: "#45475a", zerolinecolor: "#585b70", range: [minVal - pad, maxVal + pad] },
      yaxis: { title: { text: "Density", font: { color: "#a6adc8", size: 11 } }, gridcolor: "#45475a", zerolinecolor: "#585b70" },
      legend: { orientation: "h", xanchor: "center", x: 0.5, y: 1.15, font: { size: 10, color: "#cdd6f4" } },
      bargap: 0.02
    };

    try { Plotly.newPlot(pd, traces, layout, { responsive: true, displayModeBar: false }); } catch (e) {}
  }

  // ─── EXAMPLE MATRIX ────────────────────────────────────────────────────────

  function _buildInitMatrix(container, info, t) {
    var matrixH = document.createElement("h3");
    matrixH.textContent = t.matrixTitle;
    matrixH.style.cssText = "color:#cba6f7;margin:16px 0 6px 0;font-size:15px;";
    container.appendChild(matrixH);

    var matrixBox = document.createElement("div");
    matrixBox.id = _POPUP_ID + "_matrix";
    matrixBox.style.cssText = "background:#313244;border-radius:10px;padding:14px;" +
      "margin-bottom:16px;overflow-x:auto;";
    container.appendChild(matrixBox);
  }

  function _buildRegMatrix(container, info, t) {
    var matrixH = document.createElement("h3");
    matrixH.textContent = t.regMatrixTitle;
    matrixH.style.cssText = "color:#cba6f7;margin:16px 0 6px 0;font-size:15px;";
    container.appendChild(matrixH);

    var matrixBox = document.createElement("div");
    matrixBox.id = _POPUP_ID + "_matrix";
    matrixBox.style.cssText = "background:#313244;border-radius:10px;padding:14px;" +
      "margin-bottom:16px;overflow-x:auto;";
    container.appendChild(matrixBox);
  }

  function _renderMatrix(container, info, t) {
    var matrixDiv = document.getElementById(_POPUP_ID + "_matrix");
    if (!matrixDiv) return;

    if (_state.kind === "regularizer") {
      _renderRegMatrix(matrixDiv, info, t);
    } else {
      _renderInitMatrix(matrixDiv, info, t);
    }
  }

  function _renderRegMatrix(matrixDiv, info, t) {
    // Example weights: some small, some large
    var exampleWeights = [-2.5, -1.0, -0.3, 0, 0.3, 0.8, 2.0];
    var hasL1 = _state.name === "l1" || _state.name === "l1l2";
    var hasL2 = _state.name === "l2" || _state.name === "l1l2";

    var l1Val = _state.controls.l1 || 0;
    var l2Val = _state.controls.l2 || 0;

    var html = "";
    if (_state.name !== "none") {
      html += "<div style='font-size:12px;color:#a6adc8;margin-bottom:8px;'>";
      html += "l1 = " + l1Val.toFixed(4) + (hasL2 ? " &nbsp;|&nbsp; l2 = " + l2Val.toFixed(4) : "");
      html += "</div>";
    }

    html += "<table style='border-collapse:collapse;font-size:13px;width:100%;text-align:center;'>";
    html += "<tr style='background:#45475a;'>";
    html += "<th style='padding:6px 8px;color:#cdd6f4;'>Weight w</th>";
    if (hasL1) html += "<th style='padding:6px 8px;color:#f38ba8;'>|w|</th><th style='padding:6px 8px;color:#f38ba8;'>L1 penalty</th>";
    if (hasL2) html += "<th style='padding:6px 8px;color:#89b4fa;'>w²</th><th style='padding:6px 8px;color:#89b4fa;'>L2 penalty</th>";
    html += "<th style='padding:6px 8px;color:#a6e3a1;'>Total penalty</th>";
    html += "</tr>";

    for (var i = 0; i < exampleWeights.length; i++) {
      var w = exampleWeights[i];
      var absW = Math.abs(w);
      var w2 = w * w;
      var l1p = hasL1 ? l1Val * absW : 0;
      var l2p = hasL2 ? l2Val * w2 : 0;
      var total = l1p + l2p;

      html += "<tr style='background:" + (i % 2 === 0 ? "#313244" : "#363849") + ";'>";
      html += "<td style='padding:5px 8px;font-family:monospace;color:" + (w < 0 ? "#f38ba8" : "#a6e3a1") + ";'>" + w.toFixed(2) + "</td>";
      if (hasL1) html += "<td style='padding:5px 8px;font-family:monospace;color:#a6adc8;'>" + absW.toFixed(2) + "</td><td style='padding:5px 8px;font-family:monospace;color:#f38ba8;'>" + l1p.toFixed(4) + "</td>";
      if (hasL2) html += "<td style='padding:5px 8px;font-family:monospace;color:#a6adc8;'>" + w2.toFixed(4) + "</td><td style='padding:5px 8px;font-family:monospace;color:#89b4fa;'>" + l2p.toFixed(4) + "</td>";
      html += "<td style='padding:5px 8px;font-family:monospace;color:#a6e3a1;font-weight:bold;'>" + total.toFixed(4) + "</td>";
      html += "</tr>";
    }
    html += "</table>";

    if (_state.name !== "none") {
      // Summary
      var sumL1 = 0, sumL2 = 0;
      for (var i = 0; i < exampleWeights.length; i++) {
        var w = exampleWeights[i];
        if (hasL1) sumL1 += l1Val * Math.abs(w);
        if (hasL2) sumL2 += l2Val * w * w;
      }
      html += "<div style='font-size:11px;color:#585b70;margin-top:8px;text-align:right;'>";
      html += "Total added to loss: " + (sumL1 + sumL2).toFixed(4);
      html += "</div>";
    }

    matrixDiv.innerHTML = html;
  }

  function _renderInitMatrix(matrixDiv, info, t) {
    if (!info.sample) { matrixDiv.innerHTML = "<span style='color:#585b70;font-size:12px;'>No matrix visualization</span>"; return; }

    var fanIn = _state.controls.fan_in || 128;
    var fanOut = _state.controls.fan_out || 128;
    var ROWS = 4, COLS = 5;

    var result = info.sample(ROWS * COLS, fanIn, fanOut, _state.controls);
    var vals = result.data;

    // Find min/max for color scaling
    var mn = vals[0], mx = vals[0];
    for (var i = 0; i < vals.length; i++) {
      if (vals[i] < mn) mn = vals[i];
      if (vals[i] > mx) mx = vals[i];
    }
    var absMax = Math.max(Math.abs(mn), Math.abs(mx));

    // Formula display
    var formulaHtml = "";
    if (result.type === "uniform" && result.limit !== undefined) {
      formulaHtml = "<div style='font-size:11px;color:#585b70;margin-bottom:6px;'>";
      formulaHtml += "limit = " + result.limit.toFixed(6) + " &nbsp;→&nbsp; W ∈ [" + (-result.limit).toFixed(6) + ", " + result.limit.toFixed(6) + "]";
      formulaHtml += "</div>";
    } else if (result.type === "normal" && result.stddev !== undefined) {
      formulaHtml = "<div style='font-size:11px;color:#585b70;margin-bottom:6px;'>";
      formulaHtml += "μ = " + (result.mean || 0).toFixed(6) + " &nbsp; σ = " + result.stddev.toFixed(6);
      formulaHtml += "</div>";
    }

    var html = formulaHtml;
    html += "<table style='border-collapse:collapse;font-size:13px;margin:0 auto;'>";

    for (var r = 0; r < ROWS; r++) {
      html += "<tr>";
      for (var c = 0; c < COLS; c++) {
        var idx = r * COLS + c;
        var v = vals[idx];
        // Color: red for positive, blue for negative, intensity by magnitude
        var intensity = absMax > 0 ? Math.abs(v) / absMax : 0;
        intensity = clamp(intensity, 0, 1);
        var rColor, gColor, bColor;
        if (v > 0) {
          rColor = Math.round(200 + 55 * (1 - intensity));
          gColor = Math.round(180 - 120 * intensity);
          bColor = Math.round(180 - 150 * intensity);
        } else if (v < 0) {
          rColor = Math.round(180 - 120 * intensity);
          gColor = Math.round(180 - 100 * intensity);
          bColor = Math.round(200 + 55 * (1 - intensity));
        } else {
          rColor = 100; gColor = 100; bColor = 100;
        }

        html += "<td style='padding:6px 10px;font-family:monospace;background:rgb(" + rColor + "," + gColor + "," + bColor + ");" +
          "color:#1e1e2e;font-weight:" + (Math.abs(v) > absMax * 0.7 ? "bold" : "normal") + ";'>";
        html += v.toFixed(4);
        html += "</td>";
      }
      html += "</tr>";
    }
    html += "</table>";

    matrixDiv.innerHTML = html;
  }

  // ─── REMOVE POPUP ──────────────────────────────────────────────────────────

  function removePopup() {
    var overlay = document.getElementById(_POPUP_ID);
    if (overlay) {
      var pd = document.getElementById(_PLOT_ID);
      if (pd && typeof Plotly !== "undefined") { try { Plotly.purge(pd); } catch (e) {} }
      overlay.remove();
    }
    document.removeEventListener("keydown", _escHandler);
  }

  // ─── INJECT INFO ICONS ─────────────────────────────────────────────────────

  function makeBtn(type, select) {
    var btn = document.createElement("img");
    btn.src = "_gui/icons/info.svg";
    btn.alt = "?";
    btn.style.cssText = "height:20px;width:auto;cursor:pointer;margin-left:4px;" +
      "vertical-align:middle;transition:transform 0.2s,opacity 0.2s;" +
      "display:inline-block;opacity:0.6;";
    btn.title = (L() === "de") ? "Was macht das?" : "What does this do?";
    btn.onmouseenter = function () { btn.style.transform = "scale(1.2) rotate(8deg)"; btn.style.opacity = "1"; };
    btn.onmouseleave = function () { btn.style.transform = "scale(1)"; btn.style.opacity = "0.6"; };
    btn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      buildPopup(type, select.value);
    };

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

    // Insert icon into the first <td> of the parent <tr> (label cell)
    var tr = select.closest("tr");
    if (tr) {
      var firstTd = tr.querySelector("td:first-child");
      if (firstTd) {
        firstTd.appendChild(btn);
        return;
      }
    }
    // Fallback: insert before the select
    select.parentNode.insertBefore(btn, select);
  }

  // ─── WATCH FOR DYNAMICALLY CREATED SELECTS ─────────────────────────────────

  function injectForAllUninjected() {
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
