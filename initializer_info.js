"use strict";

(function () {

  var _POPUP_ID = "initializer_info_popup_overlay";
  var _PLOT_ID = "initializer_info_plot";

  var _lastPlotData = null;
  var _lastMatrixData = null;

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

  function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

  function _escHandler(e) {
    if (e.key === "Escape") removePopup();
  }

  // ─── TRANSLATIONS ─────────────────────────────────────────────────────────

  var i18n = {
    en: {
      title: "Initializers & Regularizers",
      initTab: "Weight Initializers",
      regTab: "Regularizers",
      intuition: "Intuition",
      formula: "The Formula",
      plotTitle: "Weight Distribution (5,000 samples)",
      regPlotTitle: "Penalty vs Weight Value",
      matrixTitle: "Example Matrix (4×5) — 20 concrete weights from the distribution above",
      regMatrixTitle: "Example Calculation — how penalty affects each weight",
      when: "When to use ? When not ?",
      selectLabel: "Choose:",
      play: "Play with parameters",
      weightLabel: "Weight w",
      densityLabel: "Density",
      penaltyLabel: "Penalty",
      paramExplain: "Parameter Guide",
      paramExplainDesc: "What each parameter does and when you'd change it:",
      practicalTip: "Practical tip",
      closeOutside: "(click outside to close)"
    },
    de: {
      title: "Initialisierer & Regularisierer",
      initTab: "Gewichts-Initialisierer",
      regTab: "Regularisierer",
      intuition: "Intuition",
      formula: "Die Formel",
      plotTitle: "Gewichtsverteilung (5.000 Samples)",
      regPlotTitle: "Strafe vs. Gewichtswert",
      matrixTitle: "Beispiel-Matrix (4×5) — 20 konkrete Gewichte aus der Verteilung oben",
      regMatrixTitle: "Beispiel-Rechnung — wie die Strafe jedes Gewicht beeinflusst",
      when: "Wann verwenden ? Wann nicht ?",
      selectLabel: "Auswahl:",
      play: "Spiele mit den Parametern",
      weightLabel: "Gewicht w",
      densityLabel: "Dichte",
      penaltyLabel: "Strafe",
      paramExplain: "Parameter-Erklärung",
      paramExplainDesc: "Was jeder Parameter bewirkt und wann man ihn ändert:",
      practicalTip: "Praktischer Tipp",
      closeOutside: "(Klick außerhalb zum Schließen)"
    }
  };

  // ─── DATA ──────────────────────────────────────────────────────────────────

  var initData = {
    glorotUniform: {
      en: {
        analogy: "Draws weights uniformly from [-limit, limit] where limit depends on layer size. Big layers get smaller weights automatically — this keeps signals stable through deep networks with tanh/sigmoid.",
        tip: "Think of it as an automatic volume control: more neurons → quieter each neuron.",
        when_use: "• Default for tanh / sigmoid activations\n• Balances forward AND backward pass variance\n• Example: feed-forward net with 3 hidden layers, tanh activation",
        when_not: "• For ReLU: weights end up too small (half get killed by ReLU)\n• Use He instead for ReLU networks"
      },
      de: {
        analogy: "Zieht Gewichte gleichverteilt aus [-limit, limit] abhängig von der Layergröße. Große Layer beziehen kleinere Gewichte automatisch — hält Signale stabil in tiefen Netzen mit tanh/sigmoid.",
        tip: "Stell es dir als automatische Lautstärkeregelung vor: mehr Neuronen → leiser jedes Neuron.",
        when_use: "• Standard für tanh / sigmoid Aktivierungen\n• Balanciert Vorwärts- UND Rückwärtsdurchlauf-Varianz\n• Beispiel: Feed-Forward-Netz mit 3 Hidden-Layern, tanh-Aktivierung",
        when_not: "• Für ReLU: Gewichte sind zu klein (Hälfte stirbt durch ReLU)\n• He stattdessen für ReLU-Netze verwenden"
      },
      math: "\\text{limit} = \\sqrt{\\frac{6}{\\text{fan}_{\\text{in}} + \\text{fan}_{\\text{out}}}}\\quad W \\sim U[-\\text{limit}, \\text{limit}]",
      ctrl: {
        fan_in: { min: 1, max: 1024, default: 128, step: 1, desc_en: "Number of INPUT neurons to this layer.", desc_de: "Anzahl der EINGANGS-Neuronen dieses Layers.", example_en: "e.g., a Conv2D with 64 filters × 3×3 kernel → fan_in = 64×3×3 = 576", example_de: "z.B. Conv2D mit 64 Filtern × 3×3 Kernel → fan_in = 64×3×3 = 576" },
        fan_out: { min: 1, max: 1024, default: 128, step: 1, desc_en: "Number of OUTPUT neurons from this layer.", desc_de: "Anzahl der AUSGANGS-Neuronen dieses Layers.", example_en: "e.g., next layer has 10 classes → fan_out = 10", example_de: "z.B. nächster Layer hat 10 Klassen → fan_out = 10" }
      },
      sample: function(n, fi, fo, c) {
        var limit = Math.sqrt(6 / (fi + fo));
        return { data: sampleUniform(n, -limit, limit), lo: -limit, hi: limit, type: "uniform", key: "limit = " + limit.toFixed(6) };
      }
    },
    glorotNormal: {
      en: {
        analogy: "Same idea as glorotUniform but uses a bell curve (normal distribution). Weights cluster around 0 with fewer extreme values compared to uniform.",
        tip: "The normal version is often preferred because real-world weights tend to follow a bell curve naturally.",
        when_use: "• tanh / sigmoid activations\n• Often preferred over uniform version\n• Slightly better gradient flow",
        when_not: "• Not for ReLU (use He)\n• Slightly more computationally expensive to sample"
      },
      de: {
        analogy: "Gleiche Idee wie glorotUniform, aber mit einer Glockenkurve (Normalverteilung). Gewichte clustern um 0 mit weniger extremen Werten als bei uniform.",
        tip: "Die Normal-Version wird oft bevorzugt, weil echte Gewichte natürlicherweise einer Glockenkurve folgen.",
        when_use: "• tanh / sigmoid Aktivierungen\n• Oft der uniformen Version vorgezogen\n• Etwas bessere Gradienten",
        when_not: "• Nicht für ReLU (He verwenden)\n• Etwas rechenaufwändiger zu sampeln"
      },
      math: "\\sigma = \\sqrt{\\frac{2}{\\text{fan}_{\\text{in}} + \\text{fan}_{\\text{out}}}}\\quad W \\sim \\mathcal{N}(0, \\sigma^2)\\text{, truncated at }\\pm 2\\sigma",
      ctrl: {
        fan_in: { min: 1, max: 1024, default: 128, step: 1, desc_en: "Number of input neurons.", desc_de: "Anzahl der Eingangs-Neuronen.", example_en: "Input size of your layer (e.g., 784 for MNIST)", example_de: "Eingabegröße des Layers (z.B. 784 für MNIST)" },
        fan_out: { min: 1, max: 1024, default: 128, step: 1, desc_en: "Number of output neurons.", desc_de: "Anzahl der Ausgangs-Neuronen.", example_en: "e.g., 10 classes for classification", example_de: "z.B. 10 Klassen für Klassifikation" }
      },
      sample: function(n, fi, fo, c) {
        var std = Math.sqrt(2 / (fi + fo));
        return { data: sampleTruncatedNormal(n, 0, std, 2), mean: 0, std: std, type: "normal", key: "σ = " + std.toFixed(6) };
      }
    },
    heNormal: {
      en: {
        analogy: "Made specifically for ReLU. Since ReLU cuts negative values to 0, half the variance is lost. He doubles the variance to compensate. The standard for all modern ReLU networks.",
        tip: "If your network uses ReLU (or PReLU, LeakyReLU at alpha=0), this is your default. Used in ResNet, VGG, YOLO, GPT — basically everything modern.",
        when_use: "• ALL ReLU / PReLU networks (CNNs, Transformers)\n• Default for ResNet, VGG, EfficientNet\n• Keeps variance = 1 through ReLU layers",
        when_not: "• tanh / sigmoid: weights too large, activations explode\n• LeakyReLU with high alpha: leCunNormal may work better"
      },
      de: {
        analogy: "Speziell für ReLU gemacht. Da ReLU negative Werte auf 0 setzt, geht die Hälfte der Varianz verloren. He verdoppelt die Varianz zum Ausgleich. Der Standard für alle modernen ReLU-Netze.",
        tip: "Wenn dein Netz ReLU verwendet (oder PReLU, LeakyReLU bei alpha=0), ist das die Standardwahl. Wird in ResNet, VGG, YOLO, GPT verwendet — quasi allem Modernen.",
        when_use: "• ALLE ReLU / PReLU Netze (CNNs, Transformer)\n• Standard für ResNet, VGG, EfficientNet\n• Hält Varianz = 1 durch ReLU-Layer",
        when_not: "• tanh / sigmoid: Gewichte zu groß, Aktivierungen explodieren\n• LeakyReLU mit hohem alpha: leCunNormal kann besser sein"
      },
      math: "\\sigma = \\sqrt{\\frac{2}{\\text{fan}_{\\text{in}}}}\\quad W \\sim \\mathcal{N}(0, \\sigma^2)\\text{, truncated at }\\pm 2\\sigma",
      ctrl: {
        fan_in: { min: 1, max: 1024, default: 128, step: 1, desc_en: "Number of input neurons (fan_out is NOT used — He only looks at fan_in).", desc_de: "Anzahl der Eingangs-Neuronen (fan_out wird NICHT verwendet — He nutzt nur fan_in).", example_en: "For a Conv2D with 64 filters × 3×3: fan_in = 64×9 + biases", example_de: "Für Conv2D mit 64 Filtern × 3×3: fan_in = 64×9 + Biases" }
      },
      sample: function(n, fi, fo, c) {
        var std = Math.sqrt(2 / fi);
        return { data: sampleTruncatedNormal(n, 0, std, 2), mean: 0, std: std, type: "normal", key: "σ = " + std.toFixed(6) };
      }
    },
    heUniform: {
      en: {
        analogy: "Uniform version of He. Same compensation for ReLU but uses a flat range instead of a bell curve. Slightly simpler, slightly less common.",
        tip: "heNormal is more common, but heUniform can be more stable in some architectures. Try both.",
        when_use: "• ReLU networks (alternative to heNormal)\n• Some architectures find it more stable",
        when_not: "• heNormal is generally preferred\n• Not for tanh/sigmoid"
      },
      de: {
        analogy: "Uniforme Version von He. Gleiche ReLU-Kompensation mit flachem Bereich statt Glockenkurve. Etwas einfacher, etwas seltener.",
        tip: "heNormal ist häufiger, aber heUniform kann in manchen Architekturen stabiler sein. Beide ausprobieren.",
        when_use: "• ReLU-Netze (Alternative zu heNormal)\n• Manche Architekturen finden es stabiler",
        when_not: "• heNormal wird allgemein bevorzugt\n• Nicht für tanh/sigmoid"
      },
      math: "\\text{limit} = \\sqrt{\\frac{6}{\\text{fan}_{\\text{in}}}}\\quad W \\sim U[-\\text{limit}, \\text{limit}]",
      ctrl: {
        fan_in: { min: 1, max: 1024, default: 128, step: 1, desc_en: "Number of input neurons.", desc_de: "Anzahl der Eingangs-Neuronen.", example_en: "Same as heNormal — only fan_in matters.", example_de: "Wie heNormal — nur fan_in zählt." }
      },
      sample: function(n, fi, fo, c) {
        var limit = Math.sqrt(6 / fi);
        return { data: sampleUniform(n, -limit, limit), lo: -limit, hi: limit, type: "uniform", key: "limit = " + limit.toFixed(6) };
      }
    },
    leCunNormal: {
      en: {
        analogy: "Designed for Self-Normalizing Neural Networks (SNNs) with SeLU. Creates variance = 1, which SeLU needs to auto-normalize. Also good for LeakyReLU.",
        tip: "Use this when using SeLU activation (self-normalizing nets). For LeakyReLU with alpha ≈ 0.3, this is often better than He.",
        when_use: "• REQUIRED for SeLU activation\n• Good for LeakyReLU with high alpha\n• Keeps exactly variance = 1",
        when_not: "• Standard ReLU → use He instead (leCun makes weights too small for ReLU)\n• Not designed for tanh/sigmoid"
      },
      de: {
        analogy: "Entwickelt für selbstnormalisierende Netze (SNNs) mit SeLU. Erzeugt Varianz = 1, die SeLU zur Auto-Normalisierung braucht. Auch gut für LeakyReLU.",
        tip: "Verwende dies bei SeLU-Aktivierung. Für LeakyReLU mit alpha ≈ 0.3 ist es oft besser als He.",
        when_use: "• ERFORDERLICH für SeLU-Aktivierung\n• Gut für LeakyReLU mit hohem alpha\n• Hält exakt Varianz = 1",
        when_not: "• Standard ReLU → He verwenden (leCun macht Gewichte zu klein für ReLU)\n• Nicht für tanh/sigmoid entwickelt"
      },
      math: "\\sigma = \\sqrt{\\frac{1}{\\text{fan}_{\\text{in}}}}\\quad W \\sim \\mathcal{N}(0, \\sigma^2)\\text{, truncated at }\\pm 2\\sigma",
      ctrl: {
        fan_in: { min: 1, max: 1024, default: 128, step: 1, desc_en: "Number of input neurons.", desc_de: "Anzahl der Eingangs-Neuronen.", example_en: "Standard fan_in. For SeLU, ensure weights match this exactly.", example_de: "Standard fan_in. Bei SeLU müssen Gewichte dem exakt entsprechen." }
      },
      sample: function(n, fi, fo, c) {
        var std = Math.sqrt(1 / fi);
        return { data: sampleTruncatedNormal(n, 0, std, 2), mean: 0, std: std, type: "normal", key: "σ = " + std.toFixed(6) };
      }
    },
    leCunUniform: {
      en: {
        analogy: "Uniform version of LeCun. Simpler distribution achieving the same variance. Less common than the normal version.",
        tip: "Only use this if you specifically need a uniform distribution with LeCun scaling. The normal version is usually preferred.",
        when_use: "• When uniform distribution needed with LeCun scaling\n• Simple alternative",
        when_not: "• leCunNormal is usually preferred\n• Not for standard ReLU"
      },
      de: {
        analogy: "Uniforme Version von LeCun. Einfachere Verteilung mit gleicher Varianz. Seltener als die Normalversion.",
        tip: "Nur verwenden, wenn eine Gleichverteilung mit LeCun-Skalierung benötigt wird. Die Normalversion wird meist bevorzugt.",
        when_use: "• Wenn Gleichverteilung mit LeCun-Skalierung\n• Einfache Alternative",
        when_not: "• leCunNormal wird meist bevorzugt\n• Nicht für Standard-ReLU"
      },
      math: "\\text{limit} = \\sqrt{\\frac{3}{\\text{fan}_{\\text{in}}}}\\quad W \\sim U[-\\text{limit}, \\text{limit}]",
      ctrl: {
        fan_in: { min: 1, max: 1024, default: 128, step: 1, desc_en: "Number of input neurons.", desc_de: "Anzahl der Eingangs-Neuronen.", example_en: "Standard — determines the uniform range width.", example_de: "Standard — bestimmt die Breite des Gleichverteilungsbereichs." }
      },
      sample: function(n, fi, fo, c) {
        var limit = Math.sqrt(3 / fi);
        return { data: sampleUniform(n, -limit, limit), lo: -limit, hi: limit, type: "uniform", key: "limit = " + limit.toFixed(6) };
      }
    },
    randomNormal: {
      en: {
        analogy: "Raw normal distribution with NO automatic scaling. You set the mean and standard deviation manually. Full control, but easy to misconfigure.",
        tip: "Use this when you know EXACTLY what distribution you want. For most cases, use glorot or He — they do the tuning automatically.",
        when_use: "• Research / custom experiments\n• When you need a specific non-standard distribution\n• Testing how mean affects training",
        when_not: "• Most practical networks → glorot / He do this better\n• Risk: wrong stddev → vanishing/exploding gradients"
      },
      de: {
        analogy: "Rohe Normalverteilung OHNE automatische Skalierung. Du setzt Mittelwert und Standardabweichung manuell. Volle Kontrolle, aber leicht falsch eingestellt.",
        tip: "Verwende dies, wenn du GENAU weißt, welche Verteilung du willst. Meistens machen glorot oder He das besser — automatisch.",
        when_use: "• Forschung / benutzerdefinierte Experimente\n• Wenn eine spezielle Nicht-Standard-Verteilung gebraucht wird\n• Testen wie mean das Training beeinflusst",
        when_not: "• Meiste praktische Netze → glorot / He machen es besser\n• Risiko: falsches stddev → verschwindende/explodierende Gradienten"
      },
      math: "W \\sim \\mathcal{N}(\\text{mean}, \\text{stddev}^2)",
      ctrl: {
        mean: { min: -1, max: 1, default: 0, step: 0.01, desc_en: "Center of the bell curve. Usually 0 (balanced positive/negative). Changing this shifts ALL weights positive or negative.", desc_de: "Zentrum der Glockenkurve. Normalerweise 0 (ausgewogen positiv/negativ). Ändern verschiebt ALLE Gewichte.", example_en: "mean=0 → balanced. mean=0.5 → most weights positive (bad — symmetry break!)", example_de: "mean=0 → ausgewogen. mean=0.5 → die meisten Gewichte positiv (schlecht — Symmetriebruch!)" },
        stddev: { min: 0.001, max: 1, default: 0.05, step: 0.001, desc_en: "Spread of the distribution. 0.05 = most weights between -0.1 and +0.1. 0.5 = much wider range (risky!).", desc_de: "Streuung der Verteilung. 0.05 = die meisten Gewichte zwischen -0.1 und +0.1. 0.5 = viel breiter (riskant!).", example_en: "For MNIST with 784 inputs: stddev=0.05 is safe. stddev=0.5 → activations may explode.", example_de: "Für MNIST mit 784 Eingaben: stddev=0.05 ist sicher. stddev=0.5 → Aktivierungen können explodieren." }
      },
      sample: function(n, fi, fo, c) {
        return { data: sampleNormal(n, c.mean, c.stddev), mean: c.mean, std: c.stddev, type: "normal", key: "μ=" + c.mean.toFixed(3) + " σ=" + c.stddev.toFixed(4) };
      }
    },
    randomUniform: {
      en: {
        analogy: "Raw uniform distribution with NO automatic scaling. You set minimum and maximum. Simple but easy to get wrong.",
        tip: "Same as randomNormal — only use when you need full manual control. Glorot/He tune the range automatically.",
        when_use: "• When you need a specific range\n• Simple custom layers\n• Research",
        when_not: "• Most cases → glorot or He\n• No adaptation to layer size → risk of poor scaling"
      },
      de: {
        analogy: "Rohe Gleichverteilung OHNE automatische Skalierung. Du setzt Minimum und Maximum. Einfach, aber leicht falsch eingestellt.",
        tip: "Wie randomNormal — nur bei manueller Kontrolle nötig. Glorot/He passen den Bereich automatisch an.",
        when_use: "• Wenn ein bestimmter Bereich benötigt wird\n• Einfache benutzerdefinierte Layer\n• Forschung",
        when_not: "• Meiste Fälle → glorot oder He\n• Keine Anpassung an Layergröße → Risiko schlechter Skalierung"
      },
      math: "W \\sim U[\\text{minval}, \\text{maxval}]",
      ctrl: {
        minval: { min: -1, max: 0, default: -0.05, step: 0.01, desc_en: "Minimum value. Together with maxval defines the range. Range width = maxval - minval.", desc_de: "Minimalwert. Zusammen mit maxval wird der Bereich definiert. Breite = maxval - minval.", example_en: "minval=-0.1, maxval=0.1 → range is 0.2 wide.", example_de: "minval=-0.1, maxval=0.1 → Bereich ist 0.2 breit." },
        maxval: { min: 0, max: 1, default: 0.05, step: 0.01, desc_en: "Maximum value.", desc_de: "Maximalwert.", example_en: "Make wider: minval=-0.2, maxval=0.2", example_de: "Breiter: minval=-0.2, maxval=0.2" }
      },
      sample: function(n, fi, fo, c) {
        return { data: sampleUniform(n, c.minval, c.maxval), lo: c.minval, hi: c.maxval, type: "uniform", key: "min=" + c.minval.toFixed(3) + " max=" + c.maxval.toFixed(3) };
      }
    },
    truncatedNormal: {
      en: {
        analogy: "Like randomNormal, but values beyond ±2 standard deviations are discarded and re-rolled. This clips extreme outliers that could destabilize training.",
        tip: "This is the BASE for glorotNormal and heNormal — they use truncated normal internally. Use them instead unless you need raw control.",
        when_use: "• When you need a normal distribution WITHOUT outliers\n• Base distribution for advanced custom initializers",
        when_not: "• Use glorotNormal or heNormal — they ARE truncated normal with correct scaling\n• For simple cases, randomNormal may suffice"
      },
      de: {
        analogy: "Wie randomNormal, aber Werte außerhalb ±2 Standardabweichungen werden verworfen und neu gezogen. Schneidet extreme Ausreißer ab, die Training destabilisieren könnten.",
        tip: "Das ist die BASIS für glorotNormal und heNormal — sie verwenden intern truncated normal. Verwende sie stattdessen, außer bei roher Kontrolle nötig.",
        when_use: "• Wenn Normalverteilung OHNE Ausreißer\n• Basis für fortgeschrittene benutzerdefinierte Initialisierer",
        when_not: "• glorotNormal oder heNormal verwenden — sie SIND truncated normal mit korrekter Skalierung\n• randomNormal reicht für einfache Fälle"
      },
      math: "W \\sim \\mathcal{N}(\\text{mean}, \\text{stddev}^2)\\text{, truncated at }\\pm 2\\sigma",
      ctrl: {
        mean: { min: -1, max: 1, default: 0, step: 0.01, desc_en: "Center. Usually 0.", desc_de: "Zentrum. Normalerweise 0.", example_en: "mean=0 is standard. Changing it shifts all weights.", example_de: "mean=0 ist Standard. Ändern verschiebt alle Gewichte." },
        stddev: { min: 0.001, max: 1, default: 0.05, step: 0.001, desc_en: "Spread. At ±2σ, values are clipped.", desc_de: "Streuung. Bei ±2σ werden Werte abgeschnitten.", example_en: "stddev=0.05 → most weights between -0.1 and +0.1, none beyond ±0.1", example_de: "stddev=0.05 → die meisten Gewichte zwischen -0.1 und +0.1, keine über ±0.1" }
      },
      sample: function(n, fi, fo, c) {
        return { data: sampleTruncatedNormal(n, c.mean, c.stddev, 2), mean: c.mean, std: c.stddev, type: "normal", key: "μ=" + c.mean.toFixed(3) + " σ=" + c.stddev.toFixed(4) + " (trunc ±2σ)" };
      }
    },
    varianceScaling: {
      en: {
        analogy: "The Swiss Army knife of initializers. Set scale, mode (which neuron count to use), and distribution type. You can recreate glorot, He, or LeCun — or invent your own.",
        tip: "scale=1, mode=FAN_IN, distribution=NORMAL → same as heNormal. scale=1, mode=FAN_AVG, distribution=UNIFORM → same as glorotUniform.",
        when_use: "• Custom scaling needs\n• Research (testing different scaling strategies)\n• When NO standard initializer fits",
        when_not: "• Standard architectures → glorot, He, LeCun are clearer\n• Easy to misconfigure — understand math first!"
      },
      de: {
        analogy: "Das Taschenmesser der Initialisierer. Setze scale, mode (welche Neuronenzahl) und distribution. Du kannst glorot, He oder LeCun nachbauen — oder eigene erfinden.",
        tip: "scale=1, mode=FAN_IN, distribution=NORMAL → wie heNormal. scale=1, mode=FAN_AVG, distribution=UNIFORM → wie glorotUniform.",
        when_use: "• Benutzerdefinierte Skalierung\n• Forschung (verschiedene Skalierungsstrategien testen)\n• Wenn KEIN Standard-Initialisierer passt",
        when_not: "• Standard-Architekturen → glorot, He, LeCun sind klarer\n• Leicht falsch einzustellen — zuerst Mathematik verstehen!"
      },
      math: "\\sigma = \\sqrt{\\frac{\\text{scale}}{n}},\\; \\text{limit} = \\sqrt{\\frac{3\\cdot\\text{scale}}{n}}\\;\\; n = \\text{fan}_{\\text{in}}|\\text{fan}_{\\text{out}}|\\text{avg}",
      ctrl: {
        scale: { min: 0.01, max: 10, default: 1, step: 0.01, desc_en: "Overall scaling multiplier. scale=2 → weights twice as large.", desc_de: "Allgemeiner Skalierungsmultiplikator. scale=2 → doppelt so große Gewichte.", example_en: "scale=2 makes weights larger (more variance). scale=0.5 makes them smaller.", example_de: "scale=2 macht Gewichte größer (mehr Varianz). scale=0.5 macht sie kleiner." },
        fan_in: { min: 1, max: 1024, default: 128, step: 1, desc_en: "Number of inputs.", desc_de: "Anzahl der Eingänge.", example_en: "Used when mode=FAN_IN or FAN_AVG.", example_de: "Wird bei mode=FAN_IN oder FAN_AVG verwendet." },
        mode: { options: ["FAN_IN", "FAN_OUT", "FAN_AVG"], default: "FAN_IN", desc_en: "FAN_IN = only inputs (like He). FAN_OUT = only outputs. FAN_AVG = average.", desc_de: "FAN_IN = nur Eingänge (wie He). FAN_OUT = nur Ausgänge. FAN_AVG = Durchschnitt.", example_en: "FAN_IN → He-style. FAN_AVG → Glorot-style. FAN_OUT → unusual, rarely needed.", example_de: "FAN_IN → He-Art. FAN_AVG → Glorot-Art. FAN_OUT → ungewöhnlich, selten nötig." },
        distribution: { options: ["NORMAL", "UNIFORM"], default: "NORMAL", desc_en: "NORMAL → bell curve. UNIFORM → flat range.", desc_de: "NORMAL → Glockenkurve. UNIFORM → flacher Bereich.", example_en: "NORMAL matches heNormal. UNIFORM matches heUniform.", example_de: "NORMAL entspricht heNormal. UNIFORM entspricht heUniform." }
      },
      sample: function(n, fi, fo, c) {
        var nVal = fi;
        if (c.mode === "FAN_OUT") nVal = fo;
        else if (c.mode === "FAN_AVG") nVal = (fi + fo) / 2;
        if (c.distribution === "UNIFORM") {
          var limit = Math.sqrt(3 * c.scale / nVal);
          return { data: sampleUniform(n, -limit, limit), lo: -limit, hi: limit, type: "uniform", key: "limit=" + limit.toFixed(6) + " mode=" + c.mode };
        }
        var std = Math.sqrt(c.scale / nVal);
        return { data: sampleTruncatedNormal(n, 0, std, 2), mean: 0, std: std, type: "normal", key: "σ=" + std.toFixed(6) + " mode=" + c.mode };
      }
    },
    orthogonal: {
      en: {
        analogy: "Creates a matrix where columns are perpendicular and each has length = gain. Preserves the norm of the input — great for very deep or recurrent networks where signals must not vanish.",
        tip: "Use this for very deep networks (50+ layers) or RNNs/LSTMs. For standard CNNs, HeNormal is simpler and works as well.",
        when_use: "• Very deep networks where gradients vanish\n• RNNs / LSTMs (prevents vanishing gradient over time steps)\n• When you need norm-preserving layers",
        when_not: "• Shallow to medium networks → no benefit\n• Only works for 2D matrices, not Conv filters\n• Overkill for easy tasks"
      },
      de: {
        analogy: "Erzeugt eine Matrix, deren Spalten senkrecht sind und jeweils Länge = gain haben. Bewahrt die Norm der Eingabe — großartig für sehr tiefe oder rekursive Netze.",
        tip: "Verwende für sehr tiefe Netze (50+ Layer) oder RNNs/LSTMs. Für Standard-CNNs ist HeNormal einfacher und genauso gut.",
        when_use: "• Sehr tiefe Netze (Gradienten verschwinden)\n• RNNs / LSTMs (verhindert verschwindende Gradienten)\n• Wenn norm-erhaltende Layer gebraucht werden",
        when_not: "• Flache bis mittlere Netze → kein Vorteil\n• Nur für 2D Matrizen, nicht für Conv-Filter\n• Überdimensioniert für einfache Aufgaben"
      },
      math: "W = Q\\quad\\text{(orthogonal: } Q^T Q = \\text{gain}^2 \\cdot I)",
      ctrl: {
        gain: { min: 0.1, max: 5, default: 1, step: 0.1, desc_en: "Scaling factor. gain=1 → columns have length 1 (norm-preserving). gain=2 → amplifies input norm.", desc_de: "Skalierungsfaktor. gain=1 → Spalten haben Länge 1 (norm-erhaltend). gain=2 → verstärkt Eingabenorm.", example_en: "gain=1 → input norm stays same. gain=0.5 → shrinks. gain=2 → amplifies (may explode).", example_de: "gain=1 → Eingabenorm bleibt gleich. gain=0.5 → schrumpft. gain=2 → verstärkt (kann explodieren)." }
      },
      sample: function(n, fi, fo, c) {
        var std = c.gain / Math.sqrt(fi);
        return { data: sampleNormal(n, 0, std), mean: 0, std: std, type: "normal", key: "gain=" + c.gain.toFixed(1) + " approx σ=" + std.toFixed(4) };
      }
    },
    zeros: {
      en: {
        analogy: "ALL weights are EXACTLY 0. Every neuron outputs 0, gets identical gradient, and learns NOTHING different (symmetry problem). Never use for weights!",
        tip: "NEVER initialize weights with zeros — it's a guaranteed training failure. Only use for BIASES (e.g., bias_initializer='zeros' is the default and that's fine).",
        when_use: "• Bias initialization ONLY\n• Testing / debugging / ablation studies",
        when_not: "• NEVER for weights! All neurons remain identical forever"
      },
      de: {
        analogy: "ALLE Gewichte sind EXAKT 0. Jedes Neuron gibt 0 aus, bekommt identische Gradienten und lernt NICHTS Unterschiedliches (Symmetrieproblem). Niemals für Gewichte verwenden!",
        tip: "NIEMALS Gewichte mit Null initialisieren — garantiertes Trainingsversagen. Nur für BIASES (z.B. bias_initializer='zeros' ist Standard und in Ordnung).",
        when_use: "• NUR für Bias-Initialisierung\n• Testen / Debuggen / Ablationsstudien",
        when_not: "• NIEMALS für Gewichte! Alle Neuronen bleiben für immer identisch"
      },
      math: "W = 0",
      ctrl: {},
      sample: function(n) { var arr = []; for (var i = 0; i < n; i++) arr.push(0); return { data: arr, lo: -1, hi: 1, type: "constant", key: "ALL ZERO" }; }
    },
    ones: {
      en: {
        analogy: "ALL weights are EXACTLY 1. Every output = sum of all inputs × 1 = huge values. Same symmetry problem as zeros. Almost never useful.",
        tip: "Like zeros — creates identical neurons. Only use in VERY specific architectures where you know what you're doing.",
        when_use: "• Very specific custom layer experiments\n• Testing",
        when_not: "• Almost never for practical training\n• Causes symmetry problem + huge activations"
      },
      de: {
        analogy: "ALLE Gewichte sind EXAKT 1. Jede Ausgabe = Summe aller Eingaben × 1 = riesige Werte. Gleiches Symmetrieproblem wie zeros. Fast nie nützlich.",
        tip: "Wie zeros — erzeugt identische Neuronen. Nur in SEHR speziellen Architekturen verwenden.",
        when_use: "• Sehr spezielle benutzerdefinierte Layer-Experimente\n• Testen",
        when_not: "• Fast nie für praktisches Training\n• Verursacht Symmetrieproblem + riesige Aktivierungen"
      },
      math: "W = 1",
      ctrl: {},
      sample: function(n) { var arr = []; for (var i = 0; i < n; i++) arr.push(1); return { data: arr, lo: 0, hi: 2, type: "constant", key: "ALL ONE" }; }
    },
    constant: {
      en: {
        analogy: "ALL weights are set to the SAME value of your choice. Full control, but same symmetry problem as zeros/ones.",
        tip: "Same problem as zeros: if every neuron starts with the same value, they all learn the same thing. Only use for biases or very specific tests.",
        when_use: "• When you need a specific non-random value for testing\n• Bias initialization with custom value",
        when_not: "• Hidden layer weights (symmetry problem)\n• Random initialization is almost always better"
      },
      de: {
        analogy: "ALLE Gewichte werden auf den GLEICHEN Wert deiner Wahl gesetzt. Volle Kontrolle, aber gleiches Symmetrieproblem wie zeros/ones.",
        tip: "Gleiches Problem wie zeros: wenn jedes Neuron mit demselben Wert startet, lernen alle dasselbe. Nur für Biases oder spezielle Tests.",
        when_use: "• Wenn ein bestimmter nicht-zufälliger Wert zum Testen\n• Bias-Initialisierung mit benutzerdefiniertem Wert",
        when_not: "• Verborgene Layer-Gewichte (Symmetrieproblem)\n• Zufällige Initialisierung ist fast immer besser"
      },
      math: "W = \\text{value}",
      ctrl: {
        value: { min: -5, max: 5, default: 0.5, step: 0.1, desc_en: "The single value assigned to EVERY weight in the tensor.", desc_de: "Der einzelne Wert, der JEDEM Gewicht im Tensor zugewiesen wird.", example_en: "value=0.5 → every weight is 0.5. Try it — all neurons produce identical output!", example_de: "value=0.5 → jedes Gewicht ist 0.5. Probier — alle Neuronen produzieren identische Ausgabe!" }
      },
      sample: function(n, fi, fo, c) {
        var arr = []; for (var i = 0; i < n; i++) arr.push(c.value);
        return { data: arr, lo: c.value - 0.5, hi: c.value + 0.5, type: "constant", key: "ALL=" + c.value.toFixed(2) };
      }
    },
    identity: {
      en: {
        analogy: "Creates the identity matrix: 1s on the diagonal, 0s elsewhere. Output = input × gain. Only works for square weight matrices.",
        tip: "Think of it as 'pass-through' + gain. The layer starts as: output = input × gain. Rarely used outside residual networks.",
        when_use: "• When a layer should start as the identity function\n• Residual network initialization\n• Specialized architectures",
        when_not: "• Only works for square 2D matrices\n• Not for convolutional layers\n• Usually not needed"
      },
      de: {
        analogy: "Erzeugt die Einheitsmatrix: 1en auf der Diagonale, 0en sonst. Ausgabe = Eingabe × gain. Nur für quadratische Matrizen.",
        tip: "Stell es als 'Durchreiche' + gain vor. Der Layer startet als: Ausgabe = Eingabe × gain. Selten außerhalb von Residualnetzen verwendet.",
        when_use: "• Wenn ein Layer als Identität starten soll\n• Residualnetz-Initialisierung\n• Spezialisierte Architekturen",
        when_not: "• Nur für quadratische 2D-Matrizen\n• Nicht für convolutional Layer\n• Normalerweise nicht nötig"
      },
      math: "W = \\text{gain} \\cdot I\\quad(I = \\text{Einheitsmatrix})",
      ctrl: {
        gain: { min: 0.1, max: 5, default: 1, step: 0.1, desc_en: "Diagonal multiplier. gain=1 → identity (output=input). gain=2 → output=2×input.", desc_de: "Diagonalmultiplikator. gain=1 → Identität (Ausgabe=Eingabe). gain=2 → Ausgabe=2×Eingabe.", example_en: "gain=1 → perfect pass-through. gain=0 → dead layer. gain>1 → amplification.", example_de: "gain=1 → perfekte Durchleitung. gain=0 → toter Layer. gain>1 → Verstärkung." }
      },
      sample: function(n, fi, fo, c) {
        var size = Math.ceil(Math.sqrt(n));
        var arr = [];
        for (var i = 0; i < n; i++) {
          var row = Math.floor(i / size), col = i % size;
          arr.push(row === col ? c.gain : 0);
        }
        return { data: arr, lo: -0.5, hi: c.gain + 0.5, type: "constant", key: "gain=" + c.gain.toFixed(1) };
      }
    }
  };

  var regData = {
    none: {
      en: { analogy: "No penalty added. The model can use any weight values freely. This maximizes flexibility but risks overfitting (memorizing noise instead of learning patterns).", tip: "Only skip regularization when you have TONS of data and a simple model. For anything else, some L2 helps.", when_use: "• Very simple problems (few features, abundant data)\n• Baseline comparisons", when_not: "• Most real-world problems → model overfits without regularization\n• Even small L2 (0.0001) helps generalization" },
      de: { analogy: "Keine Strafe. Das Modell kann beliebige Gewichtswerte frei nutzen. Maximale Flexibilität, aber Risiko der Überanpassung.", tip: "Nur ohne Regularisierung, wenn du SEHR viele Daten und ein einfaches Modell hast. Sonst hilft etwas L2.", when_use: "• Sehr einfache Probleme (wenige Features, viele Daten)\n• Basisvergleiche", when_not: "• Meiste echte Probleme → Modell overfittet ohne Regularisierung\n• Schon kleines L2 (0.0001) hilft der Generalisierung" },
      math: "\\text{Penalty} = 0",
      ctrl: {}
    },
    l1: {
      en: { analogy: "Penalty = l1 × |weight|. Small weights are pushed to EXACTLY 0 (sparsity). The model prunes away unimportant connections — great for feature selection.", tip: "Use L1 when you want to know which features matter. The model will zero out irrelevant weights. Example: gene expression analysis with 10,000 genes → L1 finds the important ones.", when_use: "• Feature selection (which inputs are relevant?)\n• Interpretable models (sparse = easy to understand)\n• High-dimensional data (more features than samples)", when_not: "• You only need small weights, not zero weights\n• L2 is smoother and often works better for generalization" },
      de: { analogy: "Strafe = l1 × |Gewicht|. Kleine Gewichte werden auf exakt 0 gedrückt (Sparsity). Das Modell entfernt unwichtige Verbindungen — großartig für Feature-Auswahl.", tip: "L1 verwenden, wenn du wissen willst, welche Features wichtig sind. Das Modell setzt irrelevante Gewichte auf 0. Beispiel: Genexpression mit 10.000 Genen → L1 findet die wichtigen.", when_use: "• Feature-Auswahl (welche Eingaben sind relevant?)\n• Interpretierbare Modelle (dünn besetzt = leicht verständlich)\n• Hochdimensionale Daten (mehr Features als Samples)", when_not: "• Nur kleine Gewichte, nicht Null, gewünscht\n• L2 ist glatter und oft besser für Generalisierung" },
      math: "\\text{Penalty}_{L1} = \\text{l1} \\cdot \\sum |W|",
      ctrl: { l1: { min: 0, max: 0.1, default: 0.01, step: 0.001, desc_en: "Strength of L1 penalty. Higher = more weights become exactly 0.", desc_de: "Stärke der L1-Strafe. Höher = mehr Gewichte werden exakt 0.", example_en: "0.001 → mild (few weights zeroed). 0.01 → moderate. 0.1 → aggressive (most weights zeroed).", example_de: "0.001 → mild (wenige Gewichte auf 0). 0.01 → moderat. 0.1 → aggressiv (die meisten Gewichte auf 0)." } },
      penalty: function(w, c) { return c.l1 * Math.abs(w); }
    },
    l2: {
      en: { analogy: "Penalty = l2 × weight². Large weights get HEAVILY punished (quadratic!), small weights barely feel it. Keeps all weights small but none exactly 0. Also called weight decay.", tip: "This is the DEFAULT regularizer for almost every neural network. Start with l2=0.01 and adjust. Example: ResNet uses l2=0.0001 for ImageNet.", when_use: "• Default choice for MOST neural networks\n• Prevents overfitting on any model\n• Works with all optimizers\n• Improves generalization almost always", when_not: "• If you NEED exact zeros (use L1)\n• Very high l2 → model underfits (too simple)" },
      de: { analogy: "Strafe = l2 × Gewicht². Große Gewichte werden STARK bestraft (quadratisch!), kleine kaum. Hält alle Gewichte klein, aber keins exakt 0. Auch Weight Decay genannt.", tip: "Das ist der STANDARD-Regularisierer für fast jedes neuronale Netz. Starte mit l2=0.01 und justiere. Beispiel: ResNet nutzt l2=0.0001 für ImageNet.", when_use: "• Standardwahl für die MEISTEN neuronalen Netze\n• Verhindert Überanpassung bei jedem Modell\n• Funktioniert mit allen Optimierern\n• Verbessert fast immer die Generalisierung", when_not: "• Wenn exakte Null gebraucht wird (L1)\n• Sehr hohes l2 → Modell unterfittet (zu einfach)" },
      math: "\\text{Penalty}_{L2} = \\text{l2} \\cdot \\sum W^2",
      ctrl: { l2: { min: 0, max: 0.1, default: 0.01, step: 0.001, desc_en: "Strength of L2 penalty. Higher = weights stay smaller. 0.01 is a common starting point.", desc_de: "Stärke der L2-Strafe. Höher = Gewichte bleiben kleiner. 0.01 ist ein guter Startwert.", example_en: "0.0001 → very mild (barely affects training). 0.01 → moderate default. 0.1 → strong (may underfit).", example_de: "0.0001 → sehr mild (kaum Auswirkung). 0.01 → moderater Standard. 0.1 → stark (kann unterfitten)." } },
      penalty: function(w, c) { return c.l2 * w * w; }
    },
    l1l2: {
      en: { analogy: "Combines L1 (sparsity) + L2 (small weights). L1 zeros out unimportant weights, L2 keeps the remaining ones small. Best of both worlds — but two knobs to tune.", tip: "Use this when you want a BOTH sparse AND small model. Example: a production model where you want most weights at 0 (L1) but the remaining ones stable (L2).", when_use: "• When you want BOTH sparsity and small weights\n• Production models needing compactness + stability\n• Complex models with many parameters", when_not: "• If tuning two hyperparameters is too expensive\n• Simple problems: one regularizer is often enough" },
      de: { analogy: "Kombiniert L1 (Sparsity) + L2 (kleine Gewichte). L1 entfernt unwichtige auf 0, L2 hält die restlichen klein. Beste aus beiden Welten — aber zwei Stellschrauben.", tip: "Verwende, wenn du SOWOHL dünn besetzte ALS AUCH kleine Gewichte willst. Beispiel: Produktionsmodell, das meist 0 (L1) und stabil (L2) sein soll.", when_use: "• Wenn SOWOHL Sparsity als auch kleine Gewichte\n• Produktionsmodelle: kompakt + stabil\n• Komplexe Modelle mit vielen Parametern", when_not: "• Wenn zwei Hyperparameter zu aufwändig\n• Einfache Probleme: ein Regularisierer reicht oft" },
      math: "\\text{Penalty} = \\text{l1} \\cdot \\sum |W| + \\text{l2} \\cdot \\sum W^2",
      ctrl: {
        l1: { min: 0, max: 0.1, default: 0.005, step: 0.001, desc_en: "L1 strength. Sparsity component.", desc_de: "L1-Stärke. Sparsity-Komponente.", example_en: "Controls how many weights become exactly 0.", example_de: "Bestimmt, wie viele Gewichte exakt 0 werden." },
        l2: { min: 0, max: 0.1, default: 0.005, step: 0.001, desc_en: "L2 strength. Weight decay component.", desc_de: "L2-Stärke. Weight-Decay-Komponente.", example_en: "Controls how small the non-zero weights stay.", example_de: "Bestimmt, wie klein die Nicht-Null-Gewichte bleiben." }
      },
      penalty: function(w, c) { return c.l1 * Math.abs(w) + c.l2 * w * w; }
    }
  };

  // ─── STATE ─────────────────────────────────────────────────────────────────

  var _state = { kind: "initializer", name: "glorotUniform", ctrl: {} };

  // ─── BUILD POPUP ───────────────────────────────────────────────────────────

  function buildPopup(kind, name) {
    removePopup();
    _state.kind = kind;
    _state.name = name;
    _state.ctrl = {};

    var t = i18n[L()];
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

    // Click-outside hint
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

    var initG = document.createElement("optgroup");
    initG.label = t.initTab;
    var initKeys = Object.keys(initData);
    for (var i = 0; i < initKeys.length; i++) {
      var o = document.createElement("option");
      o.value = "i:" + initKeys[i];
      o.textContent = initKeys[i];
      if (_state.kind === "initializer" && _state.name === initKeys[i]) o.selected = true;
      initG.appendChild(o);
    }
    sel.appendChild(initG);

    var regG = document.createElement("optgroup");
    regG.label = t.regTab;
    var regKeys = Object.keys(regData);
    for (var i = 0; i < regKeys.length; i++) {
      var o = document.createElement("option");
      o.value = "r:" + regKeys[i];
      o.textContent = regKeys[i];
      if (_state.kind === "regularizer" && _state.name === regKeys[i]) o.selected = true;
      regG.appendChild(o);
    }
    sel.appendChild(regG);

    sel.onchange = function () {
      var p = this.value.split(":");
      _state.kind = p[0] === "i" ? "initializer" : "regularizer";
      _state.name = p[1];
      _state.ctrl = {};
      var c = document.getElementById(_POPUP_ID + "_c");
      if (c) { _rebuild(c, i18n[L()]); setTimeout(function () { _renderPlots(c); }, 50); }
    };

    row.appendChild(sel);
    return row;
  }

  function _rebuild(c, t) {
    c.innerHTML = "";
    var isReg = _state.kind === "regularizer";
    var info = isReg ? regData[_state.name] : initData[_state.name];
    if (!info) return;

    var loc = L() === "de" ? info.de : info.en;

    // Init controls
    if (Object.keys(_state.ctrl).length === 0 && info.ctrl) {
      var ck = Object.keys(info.ctrl);
      for (var ci = 0; ci < ck.length; ci++) {
        _state.ctrl[ck[ci]] = info.ctrl[ck[ci]].default !== undefined ? info.ctrl[ck[ci]].default : 0;
      }
    }

    // Name + category
    var title = document.createElement("h3");
    title.textContent = _state.name;
    title.style.cssText = "margin:0 0 2px 0;color:#cdd6f4;font-size:18px;";
    c.appendChild(title);

    var cat = document.createElement("div");
    cat.style.cssText = "font-size:10px;color:#585b70;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;";
    cat.textContent = isReg ? t.regTab : t.initTab;
    c.appendChild(cat);

    // Intuition
    var ih = _secH(t.intuition, "#f9e2af");
    c.appendChild(ih);

    var ibox = document.createElement("div");
    ibox.style.cssText = "background:#313244;border-radius:10px;padding:12px 14px;" +
      "margin-bottom:6px;font-size:13px;line-height:1.7;border-left:4px solid #f9e2af;";
    ibox.textContent = loc.analogy;
    c.appendChild(ibox);

    if (loc.tip) {
      var tip = document.createElement("div");
      tip.style.cssText = "font-size:12px;color:#fab387;margin-bottom:14px;padding:0 4px;";
      tip.innerHTML = "💡 <b>" + t.practicalTip + ":</b> " + loc.tip;
      c.appendChild(tip);
    }

    // Formula
    if (info.math) {
      var fh = _secH(t.formula, "#89b4fa");
      c.appendChild(fh);
      var fbox = document.createElement("div");
      fbox.style.cssText = "background:#313244;border-radius:10px;padding:12px;" +
        "margin-bottom:14px;border-left:4px solid #89b4fa;overflow-x:auto;text-align:center;";
      fbox.innerHTML = renderMathBlock(info.math);
      c.appendChild(fbox);
    }

    // Interactive controls
    var ck = Object.keys(info.ctrl);
    if (ck.length > 0) {
      var ph = _secH(t.play, "#fab387");
      c.appendChild(ph);

      var pbox = document.createElement("div");
      pbox.style.cssText = "background:#313244;border-radius:10px;padding:12px 14px;" +
        "margin-bottom:14px;display:flex;flex-direction:column;gap:10px;";

      for (var ci = 0; ci < ck.length; ci++) {
        var def = info.ctrl[ck[ci]];
        var el = _ctrlEl(ck[ci], def, c, t);
        pbox.appendChild(el);
      }
      c.appendChild(pbox);
    }

    // Plot
    var plotH = _secH(isReg ? t.regPlotTitle : t.plotTitle, "#a6e3a1");
    c.appendChild(plotH);

    var plotBox = document.createElement("div");
    plotBox.style.cssText = "background:#313244;border-radius:10px;padding:10px;" +
      "margin-bottom:14px;";

    var plotDiv = document.createElement("div");
    plotDiv.id = _PLOT_ID;
    plotDiv.style.cssText = "width:100%;height:260px;";
    plotBox.appendChild(plotDiv);
    c.appendChild(plotBox);

    // Matrix
    var mh = _secH(isReg ? t.regMatrixTitle : t.matrixTitle, "#cba6f7");
    c.appendChild(mh);

    var mbox = document.createElement("div");
    mbox.id = _POPUP_ID + "_m";
    mbox.style.cssText = "background:#313244;border-radius:10px;padding:12px 14px;" +
      "margin-bottom:14px;overflow-x:auto;";
    c.appendChild(mbox);

    // When to use
    if (loc.when_use || loc.when_not) {
      var wh = _secH(t.when, "#cba6f7");
      c.appendChild(wh);

      var wg = document.createElement("div");
      wg.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;";

      if (loc.when_use) {
        var ub = document.createElement("div");
        ub.style.cssText = "background:#313244;border-radius:10px;padding:10px 12px;" +
          "border-left:4px solid #a6e3a1;font-size:12px;line-height:1.6;white-space:pre-wrap;";
        ub.textContent = loc.when_use;
        wg.appendChild(ub);
      }
      if (loc.when_not) {
        var nb = document.createElement("div");
        nb.style.cssText = "background:#313244;border-radius:10px;padding:10px 12px;" +
          "border-left:4px solid #f38ba8;font-size:12px;line-height:1.6;white-space:pre-wrap;";
        nb.textContent = loc.when_not;
        wg.appendChild(nb);
      }
      c.appendChild(wg);
    }

    // Parameter explanations
    if (ck.length > 0) {
      var exH = document.createElement("h4");
      exH.textContent = t.paramExplain;
      exH.style.cssText = "color:#585b70;margin:12px 0 4px 0;font-size:13px;";
      c.appendChild(exH);

      var exD = document.createElement("div");
      exD.style.cssText = "font-size:11px;color:#585b70;margin-bottom:8px;";
      exD.textContent = t.paramExplainDesc;
      c.appendChild(exD);

      for (var ci = 0; ci < ck.length; ci++) {
        var def = info.ctrl[ck[ci]];
        var exBox = document.createElement("div");
        exBox.style.cssText = "background:#313244;border-radius:8px;padding:10px 12px;" +
          "margin-bottom:6px;";

        var exName = document.createElement("div");
        exName.style.cssText = "font-family:monospace;color:#fab387;font-size:12px;font-weight:bold;margin-bottom:2px;";
        exName.textContent = ck[ci];
        exBox.appendChild(exName);

        var exDesc = document.createElement("div");
        exDesc.style.cssText = "font-size:12px;color:#a6adc8;line-height:1.5;margin-bottom:4px;";
        exDesc.textContent = L() === "de" ? (def.desc_de || def.desc_en) : def.desc_en;
        exBox.appendChild(exDesc);

        if (def.example_en) {
          var exExample = document.createElement("div");
          exExample.style.cssText = "font-size:11px;color:#585b70;font-style:italic;";
          exExample.textContent = "→ " + (L() === "de" ? (def.example_de || def.example_en) : def.example_en);
          exBox.appendChild(exExample);
        }

        c.appendChild(exBox);
      }
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
      sel.style.cssText = "background:#45475a;color:#cdd6f4;border:1px solid #585b70;" +
        "border-radius:4px;padding:3px 5px;font-size:12px;cursor:pointer;max-width:200px;";
      for (var oi = 0; oi < def.options.length; oi++) {
        var opt = document.createElement("option");
        opt.value = def.options[oi];
        opt.textContent = def.options[oi];
        if (_state.ctrl[key] === def.options[oi]) opt.selected = true;
        sel.appendChild(opt);
      }
      wrap.appendChild(sel);

      sel.onchange = function () {
        _state.ctrl[key] = this.value;
        _onChange(contentContainer, t);
      };
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
      num.style.cssText = "width:68px;background:#45475a;color:#cdd6f4;border:1px solid #585b70;" +
        "border-radius:4px;padding:2px 5px;font-size:12px;text-align:right;";

      var liveUpdate = function () {
        var v = parseFloat(num.value);
        if (!isNaN(v)) { v = clamp(v, def.min, def.max); range.value = v; _state.ctrl[key] = v; _onChange(contentContainer, t); }
      };

      range.oninput = function () {
        num.value = this.value;
        _state.ctrl[key] = parseFloat(this.value);
        _onChange(contentContainer, t);
      };
      num.oninput = liveUpdate;

      inner.appendChild(range);
      inner.appendChild(num);
      wrap.appendChild(inner);
    }

    return wrap;
  }

  function _onChange(c, t) {
    _lastPlotData = null;
    _lastMatrixData = null;
    _renderPlots(c);
    _renderMatrix(c, t);
  }

  // ─── RENDER PLOTS ──────────────────────────────────────────────────────────

  function _renderPlots(c) {
    var pd = document.getElementById(_PLOT_ID);
    if (!pd) return;
    if (typeof Plotly === "undefined") { pd.textContent = "[Plotly not loaded]"; return; }
    if (_state.kind === "regularizer") _renderRegPlot(pd);
    else _renderInitPlot(pd);
  }

  function _renderRegPlot(pd) {
    var info = regData[_state.name];
    if (!info) return;
    var l1v = _state.ctrl.l1 || 0;
    var l2v = _state.ctrl.l2 || 0;
    var x = getXGrid(-3, 3, 200);
    var yL1 = [], yL2 = [], yC = [];
    for (var i = 0; i < x.length; i++) {
      var ax = Math.abs(x[i]);
      yL1.push(l1v * ax);
      yL2.push(l2v * x[i] * x[i]);
      yC.push(l1v * ax + l2v * x[i] * x[i]);
    }
    var tr = [];
    if (_state.name === "l1" || _state.name === "l1l2") tr.push({ x: x, y: yL1, type: "scatter", mode: "lines", name: "L1 penalty", line: { color: "#f38ba8", width: 2 } });
    if (_state.name === "l2" || _state.name === "l1l2") tr.push({ x: x, y: yL2, type: "scatter", mode: "lines", name: "L2 penalty", line: { color: "#89b4fa", width: 2 } });
    if (_state.name === "l1l2") tr.push({ x: x, y: yC, type: "scatter", mode: "lines", name: "L1+L2", line: { color: "#a6e3a1", width: 2.5, dash: "dash" } });
    var lo = { paper_bgcolor: "#313244", plot_bgcolor: "#313244", font: { color: "#cdd6f4", size: 11 }, margin: { l: 50, r: 16, t: 8, b: 40 }, xaxis: { title: { text: "Weight w", font: { color: "#a6adc8", size: 11 } }, gridcolor: "#45475a", zerolinecolor: "#585b70" }, yaxis: { title: { text: "Penalty", font: { color: "#a6adc8", size: 11 } }, gridcolor: "#45475a", zerolinecolor: "#585b70" }, legend: { orientation: "h", xanchor: "center", x: 0.5, y: 1.15, font: { size: 10, color: "#cdd6f4" } } };
    try { Plotly.newPlot(pd, tr, lo, { responsive: true, displayModeBar: false }); } catch (e) {}
  }

  function _renderInitPlot(pd) {
    var info = initData[_state.name];
    if (!info || !info.sample) return;
    var fi = _state.ctrl.fan_in || 128;
    var fo = _state.ctrl.fan_out || 128;
    var Nplot = 5000;
    var Nmat = 20;
    var total = Nplot + Nmat;

    var result = info.sample(total, fi, fo, _state.ctrl);
    var allData = result.data;

    _lastPlotData = allData.slice(0, Nplot);
    _lastMatrixData = allData.slice(Nplot);

    var histTr = { x: _lastPlotData, type: "histogram", nbinsx: 50, name: "Sampled", marker: { color: "#89b4fa", line: { color: "#1e1e2e", width: 1 } }, opacity: 0.85, histnorm: "probability density" };
    var traces = [histTr];

    if (result.type === "normal") {
      var sorted = _lastPlotData.slice().sort(function(a,b){return a-b;});
      var lo = sorted[Math.floor(sorted.length * 0.01)] || -0.3;
      var hi = sorted[Math.floor(sorted.length * 0.99)] || 0.3;
      var pad = (hi - lo) * 0.2 || 0.1;
      var xg = getXGrid(lo - pad, hi + pad, 200);
      var yp = [];
      for (var i = 0; i < xg.length; i++) yp.push(gaussianPDF(xg[i], result.mean, result.std));
      traces.push({ x: xg, y: yp, type: "scatter", mode: "lines", name: "Theoretical PDF", line: { color: "#f38ba8", width: 2.5 } });
    } else if (result.type === "uniform") {
      var xg = getXGrid(result.lo * 1.3, result.hi * 1.3, 200);
      var yp = [];
      for (var i = 0; i < xg.length; i++) yp.push(uniformPDF(xg[i], result.lo, result.hi));
      traces.push({ x: xg, y: yp, type: "scatter", mode: "lines", name: "Theoretical PDF", line: { color: "#f38ba8", width: 2.5 } });
    }

    var mn = _lastPlotData[0], mx = _lastPlotData[0];
    for (var i = 1; i < _lastPlotData.length; i++) { if (_lastPlotData[i] < mn) mn = _lastPlotData[i]; if (_lastPlotData[i] > mx) mx = _lastPlotData[i]; }
    var pad = (mx - mn) * 0.1 || 0.1;
    if (result.type === "constant") { mn = result.lo; mx = result.hi; pad = 0.05; }

    var lo = { paper_bgcolor: "#313244", plot_bgcolor: "#313244", font: { color: "#cdd6f4", size: 11 }, margin: { l: 50, r: 16, t: 8, b: 40 }, xaxis: { title: { text: "Weight value", font: { color: "#a6adc8", size: 11 } }, gridcolor: "#45475a", zerolinecolor: "#585b70", range: [mn - pad, mx + pad] }, yaxis: { title: { text: "Density", font: { color: "#a6adc8", size: 11 } }, gridcolor: "#45475a", zerolinecolor: "#585b70" }, legend: { orientation: "h", xanchor: "center", x: 0.5, y: 1.15, font: { size: 10, color: "#cdd6f4" } }, bargap: 0.02 };

    // Key value annotation
    if (result.key) {
      lo.annotations = [{ x: 0.98, y: 0.95, xref: "paper", yref: "paper", text: result.key, showarrow: false, font: { size: 10, color: "#585b70" }, align: "right" }];
    }

    try { Plotly.newPlot(pd, traces, lo, { responsive: true, displayModeBar: false }); } catch (e) {}
  }

  // ─── RENDER MATRIX ─────────────────────────────────────────────────────────

  function _renderMatrix(c, t) {
    var md = document.getElementById(_POPUP_ID + "_m");
    if (!md) return;
    if (_state.kind === "regularizer") _renderRegMatrix(md);
    else _renderInitMatrix(md, t);
  }

  function _renderRegMatrix(md) {
    var info = regData[_state.name];
    if (!info) return;
    var exW = [-2.5, -1.0, -0.3, 0, 0.3, 0.8, 2.0];
    var hasL1 = _state.name === "l1" || _state.name === "l1l2";
    var hasL2 = _state.name === "l2" || _state.name === "l1l2";
    var l1v = _state.ctrl.l1 || 0;
    var l2v = _state.ctrl.l2 || 0;

    var h = "";
    if (_state.name !== "none") {
      h += "<div style='font-size:11px;color:#585b70;margin-bottom:6px;'>";
      h += "l1 = " + l1v.toFixed(4) + (hasL2 ? " &nbsp;|&nbsp; l2 = " + l2v.toFixed(4) : "");
      h += "</div>";
    }

    h += "<table style='border-collapse:collapse;font-size:12px;width:100%;text-align:center;'>";
    h += "<tr style='background:#45475a;'>";
    h += "<th style='padding:4px 6px;color:#cdd6f4;'>Weights w</th>";
    if (hasL1) h += "<th style='padding:4px 6px;color:#f38ba8;'>|w|</th><th style='padding:4px 6px;color:#f38ba8;'>L1 penalty</th>";
    if (hasL2) h += "<th style='padding:4px 6px;color:#89b4fa;'>w²</th><th style='padding:4px 6px;color:#89b4fa;'>L2 penalty</th>";
    h += "<th style='padding:4px 6px;color:#a6e3a1;'>Total</th>";
    h += "</tr>";

    var sumL1 = 0, sumL2 = 0;
    for (var i = 0; i < exW.length; i++) {
      var w = exW[i];
      var aw = Math.abs(w), w2 = w * w;
      var l1p = hasL1 ? l1v * aw : 0;
      var l2p = hasL2 ? l2v * w2 : 0;
      sumL1 += l1p; sumL2 += l2p;
      h += "<tr style='background:" + (i % 2 === 0 ? "#313244" : "#363849") + ";'>";
      h += "<td style='padding:3px 6px;font-family:monospace;color:" + (w < 0 ? "#f38ba8" : "#a6e3a1") + ";'>" + w.toFixed(2) + "</td>";
      if (hasL1) h += "<td style='padding:3px 6px;font-family:monospace;color:#a6adc8;'>" + aw.toFixed(2) + "</td><td style='padding:3px 6px;font-family:monospace;color:#f38ba8;'>" + l1p.toFixed(4) + "</td>";
      if (hasL2) h += "<td style='padding:3px 6px;font-family:monospace;color:#a6adc8;'>" + w2.toFixed(4) + "</td><td style='padding:3px 6px;font-family:monospace;color:#89b4fa;'>" + l2p.toFixed(4) + "</td>";
      h += "<td style='padding:3px 6px;font-family:monospace;color:#a6e3a1;font-weight:bold;'>" + (l1p + l2p).toFixed(4) + "</td></tr>";
    }

    // Sum row
    h += "<tr style='background:#45475a;font-weight:bold;'>";
    h += "<td style='padding:3px 6px;color:#cdd6f4;'>∑ total</td>";
    if (hasL1) h += "<td></td><td style='padding:3px 6px;color:#f38ba8;'>" + sumL1.toFixed(4) + "</td>";
    if (hasL2) h += "<td></td><td style='padding:3px 6px;color:#89b4fa;'>" + sumL2.toFixed(4) + "</td>";
    h += "<td style='padding:3px 6px;color:#a6e3a1;'>" + (sumL1 + sumL2).toFixed(4) + "</td></tr>";
    h += "</table>";

    if (_state.name !== "none") {
      h += "<div style='font-size:11px;color:#585b70;margin-top:6px;text-align:right;'>";
      h += "Penalty added to loss: " + (sumL1 + sumL2).toFixed(4);
      h += "</div>";
    }

    if (_state.name === "none") {
      h = "<div style='font-size:12px;color:#585b70;text-align:center;padding:8px;'>No penalty — weights can be any size.</div>";
    }

    md.innerHTML = h;
  }

  function _renderInitMatrix(md, t) {
    var info = initData[_state.name];
    if (!info || !info.sample) { md.innerHTML = ""; return; }

    var R = 4, C = 5;

    // Use cached data from the last plot render
    var vals;
    if (_lastMatrixData && _lastMatrixData.length >= R * C) {
      vals = _lastMatrixData.slice(0, R * C);
    } else {
      var fi = _state.ctrl.fan_in || 128;
      var fo = _state.ctrl.fan_out || 128;
      var res = info.sample(R * C, fi, fo, _state.ctrl);
      vals = res.data;
    }

    // Annotation: these are from the distribution above
    var h = "<div style='font-size:10px;color:#585b70;margin-bottom:6px;'>";
    h += "← These " + (R * C) + " values are SAMPLED from the distribution in the plot above";
    h += "</div>";

    var mn = vals[0], mx = vals[0];
    for (var i = 0; i < vals.length; i++) { if (vals[i] < mn) mn = vals[i]; if (vals[i] > mx) mx = vals[i]; }
    var am = Math.max(Math.abs(mn), Math.abs(mx));

    h += "<table style='border-collapse:collapse;font-size:12px;margin:0 auto;'>";
    for (var r = 0; r < R; r++) {
      h += "<tr>";
      for (var c2 = 0; c2 < C; c2++) {
        var v = vals[r * C + c2];
        var intensity = am > 0 ? Math.abs(v) / am : 0;
        intensity = clamp(intensity, 0, 1);
        var rc, gc, bc;
        if (v > 0) { rc = Math.round(200 + 55 * (1 - intensity)); gc = Math.round(180 - 120 * intensity); bc = Math.round(180 - 150 * intensity); }
        else if (v < 0) { rc = Math.round(180 - 120 * intensity); gc = Math.round(180 - 100 * intensity); bc = Math.round(200 + 55 * (1 - intensity)); }
        else { rc = 100; gc = 100; bc = 100; }
        h += "<td style='padding:5px 8px;font-family:monospace;background:rgb(" + rc + "," + gc + "," + bc + ");color:#1e1e2e;font-weight:" + (Math.abs(v) > am * 0.7 ? "bold" : "normal") + ";'>" + v.toFixed(4) + "</td>";
      }
      h += "</tr>";
    }
    h += "</table>";

    md.innerHTML = h;
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

  // ─── INJECT ICONS ──────────────────────────────────────────────────────────

  function mkBtn(type, sel) {
    var btn = document.createElement("img");
    btn.src = "_gui/icons/info.svg";
    btn.alt = "?";
    btn.style.cssText = "height:18px;width:auto;cursor:pointer;margin-left:3px;" +
      "vertical-align:middle;transition:transform 0.2s,opacity 0.2s;" +
      "display:inline-block;opacity:0.55;";
    btn.title = (L() === "de") ? "Was macht das?" : "What does this do?";
    btn.onmouseenter = function () { btn.style.transform = "scale(1.2) rotate(8deg)"; btn.style.opacity = "0.9"; };
    btn.onmouseleave = function () { btn.style.transform = "scale(1)"; btn.style.opacity = "0.55"; };
    btn.onclick = function (e) { e.preventDefault(); e.stopPropagation(); buildPopup(type, sel.value); };
    sel.addEventListener("change", function () { if (document.getElementById(_POPUP_ID)) buildPopup(type, sel.value); });
    return btn;
  }

  function injectIcon(sel, type) {
    if (sel.dataset.infoInjected) return;
    sel.dataset.infoInjected = "true";
    var btn = mkBtn(type, sel);
    var tr = sel.closest("tr");
    if (tr) {
      var firstTd = tr.querySelector("td:first-child");
      if (firstTd) { firstTd.appendChild(btn); return; }
    }
    sel.parentNode.insertBefore(btn, sel);
  }

  function injectAll() {
    var all = document.querySelectorAll("select.input_data");
    for (var i = 0; i < all.length; i++) {
      var s = all[i], c = s.className;
      if (c.indexOf("skip_connection_initializer_select") !== -1) injectIcon(s, "initializer");
      else if (c.indexOf("_regularizer") !== -1) injectIcon(s, "regularizer");
      else if (c.indexOf("_initializer") !== -1) injectIcon(s, "initializer");
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
