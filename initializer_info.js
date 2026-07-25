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

  function sampleUniform(n, mn, mx) {
    var a = []; for (var i = 0; i < n; i++) a.push(Math.random() * (mx - mn) + mn); return a;
  }
  function sampleNormal(n, mn, sd) {
    var a = []; for (var i = 0; i < n; i++) a.push(_randn() * sd + mn); return a;
  }
  function sampleTruncatedNormal(n, mn, sd, ms) {
    if (ms === undefined) ms = 2;
    var a = [];
    for (var i = 0; i < n; i++) { var v; do { v = _randn() * sd + mn; } while (Math.abs(v - mn) > ms * sd); a.push(v); }
    return a;
  }
  function gaussianPDF(x, mn, sd) {
    return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mn) / sd, 2));
  }
  function uniformPDF(x, mn, mx) { if (x < mn || x > mx) return 0; return 1 / (mx - mn); }
  function getXGrid(mn, mx, s) { var a = [], st = (mx - mn) / s; for (var i = 0; i <= s; i++) a.push(mn + i * st); return a; }
  function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

  function _escHandler(e) { if (e.key === "Escape") removePopup(); }

  // ─── TRANSLATIONS ─────────────────────────────────────────────────────────

  var i18n = {
    en: {
      title: "Initializers & Regularizers",
      initTab: "Weight Initializers", regTab: "Regularizers",
      intuition: "Intuition", formula: "The Formula",
      plotTitle: "Weight Distribution (5,000 samples)",
      regPlotTitle: "Penalty vs Weight Value",
      matrixTitle: "Example Matrix (4×5) — 20 concrete weights from the distribution above",
      regMatrixTitle: "Example Calculation — how penalty affects each weight",
      when: "When to use ? When not ?",
      selectLabel: "Choose:",
      play: "Spiel with Parameters",
      demoPlay: "Demo: Layer Size (affects visualization only)",
      configParams: "Configurable Parameters",
      demoParams: "Demo Settings (visualization only)",
      weightLabel: "Weight w", densityLabel: "Density", penaltyLabel: "Penalty",
      paramExplain: "How Parameters Work",
      paramExplainDesc: "These are the ACTUAL parameters you can set for this initializer:",
      demoExplainDesc: "These values are NOT initializer parameters — they come from your layer dimensions and are only used here for the demo visualization:",
      practicalTip: "Practical tip",
      closeOutside: "(click outside to close)"
    },
    de: {
      title: "Initialisierer & Regularisierer",
      initTab: "Gewichts-Initialisierer", regTab: "Regularisierer",
      intuition: "Intuition", formula: "Die Formel",
      plotTitle: "Gewichtsverteilung (5.000 Samples)",
      regPlotTitle: "Strafe vs. Gewichtswert",
      matrixTitle: "Beispiel-Matrix (4×5) — 20 konkrete Gewichte aus der Verteilung oben",
      regMatrixTitle: "Beispiel-Rechnung — wie die Strafe jedes Gewicht beeinflusst",
      when: "Wann verwenden ? Wann nicht ?",
      selectLabel: "Auswahl:",
      play: "Spiele mit den Parametern",
      demoPlay: "Demo: Layer-Größe (nur für die Visualisierung)",
      configParams: "Konfigurierbare Parameter",
      demoParams: "Demo-Einstellungen (nur Visualisierung)",
      weightLabel: "Gewicht w", densityLabel: "Dichte", penaltyLabel: "Strafe",
      paramExplain: "Wie die Parameter funktionieren",
      paramExplainDesc: "Das sind die tatsächlichen Parameter, die du für diesen Initialisierer einstellen kannst:",
      demoExplainDesc: "Diese Werte sind KEINE Initialisierer-Parameter — sie stammen von deinen Layer-Dimensionen und werden hier nur für die Demo-Visualisierung verwendet:",
      practicalTip: "Praktischer Tipp",
      closeOutside: "(Klick außerhalb zum Schließen)"
    }
  };

  // ─── INITIALIZER DATA ──────────────────────────────────────────────────────

  // ctrl = ACTUAL configurable parameters (matches what the UI shows)
  // demo = Demo-only settings for the visualization (fan_in, fan_out)

  var initData = {
    glorotUniform: {
      en: { analogy: "Draws weights uniformly from [-limit, limit] where limit depends on layer size. Big layers get smaller weights automatically — keeps signals stable through deep networks with tanh/sigmoid.", tip: "Think of it as automatic volume control: more neurons → quieter each neuron.", when_use: "• Default for tanh / sigmoid activations\n• Balances forward AND backward pass variance\n• Example: feed-forward net with 3 hidden layers, tanh", when_not: "• For ReLU: weights too small (half get killed)\n• Use He instead for ReLU" },
      de: { analogy: "Zieht Gewichte gleichverteilt aus [-limit, limit] abhängig von der Layergröße. Große Layer beziehen kleinere Gewichte automatisch — hält Signale stabil in tiefen Netzen mit tanh/sigmoid.", tip: "Stell es dir als automatische Lautstärkeregelung vor: mehr Neuronen → leiser jedes Neuron.", when_use: "• Standard für tanh / sigmoid Aktivierungen\n• Balanciert Vorwärts- UND Rückwärtsdurchlauf-Varianz\n• Beispiel: Feed-Forward-Netz mit 3 Hidden-Layern, tanh", when_not: "• Für ReLU: Gewichte zu klein (Hälfte stirbt)\n• He stattdessen für ReLU" },
      math: "\\text{limit} = \\sqrt{\\frac{6}{\\text{fan}_{\\text{in}} + \\text{fan}_{\\text{out}}}}\\quad W \\sim U[-\\text{limit}, \\text{limit}]",
      ctrl: { seed: { min: 0, max: 999999999, default: 42, step: 1, desc_en: "Random seed for reproducibility. Same seed = same weights.", desc_de: "Zufalls-Seed für Reproduzierbarkeit. Gleicher Seed = gleiche Gewichte.", example_en: "Change the seed to get different random values from the same distribution.", example_de: "Ändere den Seed für verschiedene Zufallswerte aus derselben Verteilung." } },
      demo: { fan_in: { min: 1, max: 1024, default: 128, step: 1 }, fan_out: { min: 1, max: 1024, default: 128, step: 1 } },
      sample: function(n, fi, fo) {
        var lim = Math.sqrt(6 / (fi + fo)); return { data: sampleUniform(n, -lim, lim), lo: -lim, hi: lim, type: "uniform", key: "limit = " + lim.toFixed(6) }; }
    },
    glorotNormal: {
      en: { analogy: "Same idea as glorotUniform but uses a bell curve. Weights cluster around 0 with fewer extreme values.", tip: "The normal version is often preferred — real weights naturally follow a bell curve.", when_use: "• tanh / sigmoid activations\n• Often preferred over uniform\n• Slightly better gradient flow", when_not: "• Not for ReLU (use He)\n• Slightly more expensive to sample" },
      de: { analogy: "Gleiche Idee wie glorotUniform, aber mit einer Glockenkurve. Gewichte clustern um 0 mit weniger extremen Werten.", tip: "Die Normal-Version wird oft bevorzugt — echte Gewichte folgen natürlicherweise einer Glockenkurve.", when_use: "• tanh / sigmoid Aktivierungen\n• Oft der uniformen Version vorgezogen\n• Etwas bessere Gradienten", when_not: "• Nicht für ReLU (He verwenden)\n• Etwas rechenaufwändiger" },
      math: "\\sigma = \\sqrt{\\frac{2}{\\text{fan}_{\\text{in}} + \\text{fan}_{\\text{out}}}}\\quad W \\sim \\mathcal{N}(0, \\sigma^2)\\text{, truncated at }\\pm 2\\sigma",
      ctrl: { seed: { min: 0, max: 999999999, default: 42, step: 1, desc_en: "Random seed.", desc_de: "Zufalls-Seed.", example_en: "Same seed = same weights.", example_de: "Gleicher Seed = gleiche Gewichte." } },
      demo: { fan_in: { min: 1, max: 1024, default: 128, step: 1 }, fan_out: { min: 1, max: 1024, default: 128, step: 1 } },
      sample: function(n, fi, fo) { var sd = Math.sqrt(2 / (fi + fo)); return { data: sampleTruncatedNormal(n, 0, sd, 2), mean: 0, std: sd, type: "normal", key: "σ = " + sd.toFixed(6) }; }
    },
    heNormal: {
      en: { analogy: "Made for ReLU! Since ReLU cuts negative values to 0, half the variance is lost. He doubles the variance to compensate. Standard for ALL modern ReLU networks.", tip: "If your network uses ReLU, this is your default. Used in ResNet, VGG, YOLO, GPT — everything modern.", when_use: "• ALL ReLU / PReLU networks (CNNs, Transformers)\n• Default for ResNet, VGG, EfficientNet\n• Keeps variance = 1 through ReLU", when_not: "• tanh / sigmoid: weights too large\n• LeakyReLU with high alpha: leCunNormal can be better" },
      de: { analogy: "Speziell für ReLU! Da ReLU negative Werte auf 0 setzt, geht die Hälfte der Varianz verloren. He verdoppelt die Varianz zum Ausgleich. Standard für ALLE modernen ReLU-Netze.", tip: "Wenn dein Netz ReLU verwendet, ist das die Standardwahl. ResNet, VGG, YOLO, GPT — alles moderne.", when_use: "• ALLE ReLU / PReLU Netze (CNNs, Transformer)\n• Standard für ResNet, VGG, EfficientNet\n• Hält Varianz = 1 durch ReLU", when_not: "• tanh / sigmoid: Gewichte zu groß\n• LeakyReLU mit hohem alpha: leCunNormal kann besser sein" },
      math: "\\sigma = \\sqrt{\\frac{2}{\\text{fan}_{\\text{in}}}}\\quad W \\sim \\mathcal{N}(0, \\sigma^2)\\text{, truncated at }\\pm 2\\sigma",
      ctrl: { seed: { min: 0, max: 999999999, default: 42, step: 1, desc_en: "Random seed.", desc_de: "Zufalls-Seed.", example_en: "Same seed = same weights.", example_de: "Gleicher Seed = gleiche Gewichte." } },
      demo: { fan_in: { min: 1, max: 1024, default: 128, step: 1 } },
      sample: function(n, fi) { var sd = Math.sqrt(2 / fi); return { data: sampleTruncatedNormal(n, 0, sd, 2), mean: 0, std: sd, type: "normal", key: "σ = " + sd.toFixed(6) }; }
    },
    heUniform: {
      en: { analogy: "Uniform version of He. Same ReLU compensation with a flat range instead of a bell curve.", tip: "heNormal is more common, but heUniform can be more stable in some architectures.", when_use: "• ReLU networks (alternative to heNormal)\n• Some find it more stable", when_not: "• heNormal generally preferred\n• Not for tanh/sigmoid" },
      de: { analogy: "Uniforme Version von He. Gleiche ReLU-Kompensation mit flachem Bereich statt Glockenkurve.", tip: "heNormal ist häufiger, aber heUniform kann in manchen Architekturen stabiler sein.", when_use: "• ReLU-Netze (Alternative zu heNormal)\n• Manchmal stabiler", when_not: "• heNormal wird bevorzugt\n• Nicht für tanh/sigmoid" },
      math: "\\text{limit} = \\sqrt{\\frac{6}{\\text{fan}_{\\text{in}}}}\\quad W \\sim U[-\\text{limit}, \\text{limit}]",
      ctrl: { seed: { min: 0, max: 999999999, default: 42, step: 1, desc_en: "Random seed.", desc_de: "Zufalls-Seed.", example_en: "Same seed = same weights.", example_de: "Gleicher Seed = gleiche Gewichte." } },
      demo: { fan_in: { min: 1, max: 1024, default: 128, step: 1 } },
      sample: function(n, fi) { var lim = Math.sqrt(6 / fi); return { data: sampleUniform(n, -lim, lim), lo: -lim, hi: lim, type: "uniform", key: "limit = " + lim.toFixed(6) }; }
    },
    leCunNormal: {
      en: { analogy: "Designed for Self-Normalizing Neural Networks (SNNs) with SeLU. Creates variance = 1 which SeLU needs to auto-normalize.", tip: "REQUIRED for SeLU. Also good for LeakyReLU with high alpha.", when_use: "• REQUIRED for SeLU activation\n• Good for LeakyReLU with high alpha\n• Keeps variance = 1", when_not: "• Standard ReLU → use He (weights too small)\n• Not for tanh/sigmoid" },
      de: { analogy: "Entwickelt für selbstnormalisierende Netze (SNNs) mit SeLU. Erzeugt Varianz = 1, die SeLU zur Auto-Normalisierung braucht.", tip: "ERFORDERLICH für SeLU. Auch gut für LeakyReLU mit hohem alpha.", when_use: "• ERFORDERLICH für SeLU\n• Gut für LeakyReLU mit hohem alpha\n• Hält Varianz = 1", when_not: "• Standard ReLU → He (Gewichte zu klein)\n• Nicht für tanh/sigmoid" },
      math: "\\sigma = \\sqrt{\\frac{1}{\\text{fan}_{\\text{in}}}}\\quad W \\sim \\mathcal{N}(0, \\sigma^2)\\text{, truncated at }\\pm 2\\sigma",
      ctrl: { seed: { min: 0, max: 999999999, default: 42, step: 1, desc_en: "Random seed.", desc_de: "Zufalls-Seed.", example_en: "Same seed = same weights.", example_de: "Gleicher Seed = gleiche Gewichte." } },
      demo: { fan_in: { min: 1, max: 1024, default: 128, step: 1 } },
      sample: function(n, fi) { var sd = Math.sqrt(1 / fi); return { data: sampleTruncatedNormal(n, 0, sd, 2), mean: 0, std: sd, type: "normal", key: "σ = " + sd.toFixed(6) }; }
    },
    leCunUniform: {
      en: { analogy: "Uniform version of LeCun. Simpler distribution, same variance.", tip: "The normal version is usually preferred.", when_use: "• When uniform with LeCun scaling needed\n• Simple alternative", when_not: "• leCunNormal usually preferred\n• Not for standard ReLU" },
      de: { analogy: "Uniforme Version von LeCun. Einfachere Verteilung, gleiche Varianz.", tip: "Die Normalversion wird meist bevorzugt.", when_use: "• Wenn Gleichverteilung mit LeCun\n• Einfache Alternative", when_not: "• leCunNormal wird bevorzugt\n• Nicht für Standard-ReLU" },
      math: "\\text{limit} = \\sqrt{\\frac{3}{\\text{fan}_{\\text{in}}}}\\quad W \\sim U[-\\text{limit}, \\text{limit}]",
      ctrl: { seed: { min: 0, max: 999999999, default: 42, step: 1, desc_en: "Random seed.", desc_de: "Zufalls-Seed.", example_en: "Same seed = same weights.", example_de: "Gleicher Seed = gleiche Gewichte." } },
      demo: { fan_in: { min: 1, max: 1024, default: 128, step: 1 } },
      sample: function(n, fi) { var lim = Math.sqrt(3 / fi); return { data: sampleUniform(n, -lim, lim), lo: -lim, hi: lim, type: "uniform", key: "limit = " + lim.toFixed(6) }; }
    },
    randomNormal: {
      en: { analogy: "Raw normal distribution with NO automatic scaling. You set mean and stddev manually. Full control but easy to misconfigure.", tip: "Only use when you know EXACTLY what distribution you want. Glorot/He tune automatically.", when_use: "• Research / custom experiments\n• When you need specific non-standard distribution", when_not: "• Most networks → glorot/He do it better\n• Wrong stddev → vanishing/exploding gradients" },
      de: { analogy: "Rohe Normalverteilung OHNE automatische Skalierung. Du setzt mean und stddev manuell. Volle Kontrolle, aber leicht falsch.", tip: "Nur wenn du GENAU weißt, was du tust. Glorot/He machen das automatisch besser.", when_use: "• Forschung / Experimente\n• Bei spezieller Nicht-Standard-Verteilung", when_not: "• Meiste Netze → glorot/He besser\n• Falsches stddev → verschwindende/explodierende Gradienten" },
      math: "W \\sim \\mathcal{N}(\\text{mean}, \\text{stddev}^2)",
      ctrl: {
        mean: { min: -1, max: 1, default: 0, step: 0.01, desc_en: "Center of the bell curve. Usually 0 (balanced pos/neg). Changing shifts ALL weights.", desc_de: "Zentrum der Glockenkurve. Normalerweise 0 (ausgewogen). Ändern verschiebt ALLE Gewichte.", example_en: "mean=0 → balanced. mean=0.5 → most weights positive (rarely useful).", example_de: "mean=0 → ausgewogen. mean=0.5 → die meisten Gewichte positiv (selten nützlich)." },
        stddev: { min: 0.001, max: 1, default: 0.05, step: 0.001, desc_en: "Spread. 0.05 → most weights between -0.1 and +0.1. Larger = riskier!", desc_de: "Streuung. 0.05 → die meisten zwischen -0.1 und +0.1. Größer = riskanter!", example_en: "For 784-input MNIST: 0.05 is safe. 0.5 → activations may explode.", example_de: "Für MNIST mit 784 Eingängen: 0.05 ist sicher. 0.5 → Aktivierungen können explodieren." },
        seed: { min: 0, max: 999999999, default: 42, step: 1, desc_en: "Random seed.", desc_de: "Zufalls-Seed.", example_en: "Same seed = same weights.", example_de: "Gleicher Seed = gleiche Gewichte." }
      },
      demo: {},
      sample: function(n, fi, fo, c) { return { data: sampleNormal(n, c.mean, c.stddev), mean: c.mean, std: c.stddev, type: "normal", key: "μ=" + c.mean.toFixed(3) + " σ=" + c.stddev.toFixed(4) }; }
    },
    randomUniform: {
      en: { analogy: "Raw uniform distribution with NO automatic scaling. You set minimum and maximum. Simple but easy to misconfigure.", tip: "Same as randomNormal — only when you need manual control.", when_use: "• When you need a specific range\n• Research", when_not: "• Use glorot/He for most cases\n• No layer-size adaptation → poor scaling" },
      de: { analogy: "Rohe Gleichverteilung OHNE automatische Skalierung. Du setzt min und max. Einfach, aber leicht falsch.", tip: "Wie randomNormal — nur bei manueller Kontrolle.", when_use: "• Wenn ein bestimmter Bereich nötig\n• Forschung", when_not: "• Glorot/He für die meisten Fälle\n• Keine Layer-Anpassung → schlechte Skalierung" },
      math: "W \\sim U[\\text{minval}, \\text{maxval}]",
      ctrl: {
        minval: { min: -1, max: 0, default: -0.05, step: 0.01, desc_en: "Minimum value. Range width = maxval - minval.", desc_de: "Minimalwert. Bereichsbreite = maxval - minval.", example_en: "minval=-0.1, maxval=0.1 → 0.2 wide.", example_de: "minval=-0.1, maxval=0.1 → 0.2 breit." },
        maxval: { min: 0, max: 1, default: 0.05, step: 0.01, desc_en: "Maximum value.", desc_de: "Maximalwert.", example_en: "Wider: minval=-0.2, maxval=0.2", example_de: "Breiter: minval=-0.2, maxval=0.2" },
        seed: { min: 0, max: 999999999, default: 42, step: 1, desc_en: "Random seed.", desc_de: "Zufalls-Seed.", example_en: "Same seed = same weights.", example_de: "Gleicher Seed = gleiche Gewichte." }
      },
      demo: {},
      sample: function(n, fi, fo, c) { return { data: sampleUniform(n, c.minval, c.maxval), lo: c.minval, hi: c.maxval, type: "uniform", key: "min=" + c.minval.toFixed(3) + " max=" + c.maxval.toFixed(3) }; }
    },
    truncatedNormal: {
      en: { analogy: "Like randomNormal, but values beyond ±2σ are discarded and re-rolled. Prevents extreme outliers.", tip: "This is the BASE for glorotNormal and heNormal — use those instead unless you need raw control.", when_use: "• Normal distribution WITHOUT outliers\n• Base for custom initializers", when_not: "• glorotNormal/heNormal ARE truncated normal with correct scaling\n• randomNormal may suffice for simple cases" },
      de: { analogy: "Wie randomNormal, aber Werte außerhalb ±2σ werden verworfen und neu gezogen. Verhindert extreme Ausreißer.", tip: "Das ist die BASIS für glorotNormal und heNormal — verwende diese stattdessen.", when_use: "• Normalverteilung OHNE Ausreißer\n• Basis für benutzerdefinierte Initialisierer", when_not: "• glorotNormal/heNormal SIND truncated normal\n• randomNormal reicht oft" },
      math: "W \\sim \\mathcal{N}(\\text{mean}, \\text{stddev}^2)\\text{, truncated at }\\pm 2\\sigma",
      ctrl: {
        mean: { min: -1, max: 1, default: 0, step: 0.01, desc_en: "Center. Usually 0.", desc_de: "Zentrum. Normalerweise 0.", example_en: "mean=0 is standard.", example_de: "mean=0 ist Standard." },
        stddev: { min: 0.001, max: 1, default: 0.05, step: 0.001, desc_en: "Spread. Values clipped at ±2σ.", desc_de: "Streuung. Werte bei ±2σ abgeschnitten.", example_en: "stddev=0.05 → most between -0.1 and +0.1, none beyond.", example_de: "stddev=0.05 → die meisten zwischen -0.1 und +0.1, keine außerhalb." },
        seed: { min: 0, max: 999999999, default: 42, step: 1, desc_en: "Random seed.", desc_de: "Zufalls-Seed.", example_en: "Same seed = same weights.", example_de: "Gleicher Seed = gleiche Gewichte." }
      },
      demo: {},
      sample: function(n, fi, fo, c) { return { data: sampleTruncatedNormal(n, c.mean, c.stddev, 2), mean: c.mean, std: c.stddev, type: "normal", key: "μ=" + c.mean.toFixed(3) + " σ=" + c.stddev.toFixed(4) + " (trunc ±2σ)" }; }
    },
    varianceScaling: {
      en: { analogy: "The Swiss Army knife of initializers. Set scale, mode (how to count neurons), and distribution. Recreate glorot, He, LeCun — or invent your own.", tip: "scale=1, mode=FAN_IN, NORMAL = heNormal. scale=1, mode=FAN_AVG, UNIFORM = glorotUniform.", when_use: "• Custom scaling needs\n• Research (different strategies)\n• When NO standard fits", when_not: "• Standard architectures → glorot/He/LeCun are clearer\n• Easy to misconfigure" },
      de: { analogy: "Das Taschenmesser der Initialisierer. Setze scale, mode (welche Neuronenzahl) und distribution. Baue glorot, He, LeCun nach — oder erfinde eigene.", tip: "scale=1, mode=FAN_IN, NORMAL = heNormal. scale=1, mode=FAN_AVG, UNIFORM = glorotUniform.", when_use: "• Benutzerdefinierte Skalierung\n• Forschung (verschiedene Strategien)\n• Wenn KEIN Standard passt", when_not: "• Standard-Architekturen → glorot/He/LeCun sind klarer\n• Leicht falsch einzustellen" },
      math: "\\sigma = \\sqrt{\\frac{\\text{scale}}{n}},\\; \\text{limit} = \\sqrt{\\frac{3\\cdot\\text{scale}}{n}}\\;\\; n = \\text{fan}_{\\text{in}}|\\text{fan}_{\\text{out}}|\\text{avg}",
      ctrl: {
        scale: { min: 0.01, max: 10, default: 1, step: 0.01, desc_en: "Overall scaling. scale=2 → twice as large weights.", desc_de: "Allgemeine Skalierung. scale=2 → doppelt so große Gewichte.", example_en: "scale=2 → more variance. scale=0.5 → less variance.", example_de: "scale=2 → mehr Varianz. scale=0.5 → weniger Varianz." },
        mode: { options: ["FAN_IN", "FAN_OUT", "FAN_AVG"], default: "FAN_IN", desc_en: "FAN_IN = inputs only (like He). FAN_OUT = outputs. FAN_AVG = average.", desc_de: "FAN_IN = nur Eingänge (wie He). FAN_OUT = Ausgänge. FAN_AVG = Durchschnitt.", example_en: "FAN_IN → He-style. FAN_AVG → Glorot-style. FAN_OUT → unusual.", example_de: "FAN_IN → He-Art. FAN_AVG → Glorot-Art. FAN_OUT → ungewöhnlich." },
        distribution: { options: ["NORMAL", "UNIFORM"], default: "NORMAL", desc_en: "NORMAL → bell curve. UNIFORM → flat range.", desc_de: "NORMAL → Glockenkurve. UNIFORM → flacher Bereich.", example_en: "NORMAL = heNormal. UNIFORM = heUniform.", example_de: "NORMAL = heNormal. UNIFORM = heUniform." },
        seed: { min: 0, max: 999999999, default: 42, step: 1, desc_en: "Random seed.", desc_de: "Zufalls-Seed.", example_en: "Same seed = same weights.", example_de: "Gleicher Seed = gleiche Gewichte." }
      },
      demo: { fan_in: { min: 1, max: 1024, default: 128, step: 1 } },
      sample: function(n, fi, fo, c) {
        var nv = fi; if (c.mode === "FAN_OUT") nv = fo; else if (c.mode === "FAN_AVG") nv = (fi + fo) / 2;
        if (c.distribution === "UNIFORM") { var lim = Math.sqrt(3 * c.scale / nv); return { data: sampleUniform(n, -lim, lim), lo: -lim, hi: lim, type: "uniform", key: "limit=" + lim.toFixed(6) }; }
        var sd = Math.sqrt(c.scale / nv); return { data: sampleTruncatedNormal(n, 0, sd, 2), mean: 0, std: sd, type: "normal", key: "σ=" + sd.toFixed(6) }; }
    },
    orthogonal: {
      en: { analogy: "Creates an orthogonal matrix: columns are perpendicular, length = gain. Preserves input norm — great for very deep or recurrent networks.", tip: "Use for very deep networks (50+ layers) or RNNs/LSTMs. For standard CNNs, HeNormal is simpler.", when_use: "• Very deep networks (vanishing gradients)\n• RNNs/LSTMs (preserves norm over time)\n• When norm-preserving needed", when_not: "• Shallow/medium nets → no benefit\n• Only for 2D matrices, not Conv filters\n• Overkill for easy tasks" },
      de: { analogy: "Erzeugt eine orthogonale Matrix: Spalten senkrecht, Länge = gain. Bewahrt die Eingabenorm — großartig für sehr tiefe oder rekursive Netze.", tip: "Verwende für sehr tiefe Netze (50+ Layer) oder RNNs/LSTMs. Für CNNs reicht HeNormal.", when_use: "• Sehr tiefe Netze (verschwindende Gradienten)\n• RNNs/LSTMs (bewahrt Norm über Zeit)\n• Wenn norm-erhaltend nötig", when_not: "• Flache/mittlere Netze → kein Vorteil\n• Nur für 2D Matrizen, nicht Conv-Filter\n• Überdimensioniert" },
      math: "W = Q\\;\\;(Q^T Q = \\text{gain}^2 \\cdot I)",
      ctrl: {
        gain: { min: 0.1, max: 5, default: 1, step: 0.1, desc_en: "Column scaling. gain=1 → norm preserved. gain=2 → amplifies input.", desc_de: "Spaltenskalierung. gain=1 → Norm erhalten. gain=2 → verstärkt Eingabe.", example_en: "gain=1 → perfect norm. gain=0.5 → shrinks. gain=2 → amplifies (risky).", example_de: "gain=1 → perfekte Norm. gain=0.5 → schrumpft. gain=2 → verstärkt (riskant)." },
        seed: { min: 0, max: 999999999, default: 42, step: 1, desc_en: "Random seed.", desc_de: "Zufalls-Seed.", example_en: "Same seed = same weights.", example_de: "Gleicher Seed = gleiche Gewichte." }
      },
      demo: { fan_in: { min: 1, max: 1024, default: 128, step: 1 } },
      sample: function(n, fi, fo, c) { var sd = c.gain / Math.sqrt(fi); return { data: sampleNormal(n, 0, sd), mean: 0, std: sd, type: "normal", key: "gain=" + c.gain.toFixed(1) }; }
    },
    zeros: {
      en: { analogy: "ALL weights are EXACTLY 0. Every neuron outputs 0, gets identical gradient — learns NOTHING (symmetry problem). Never for weights!", tip: "NEVER initialize weights with zeros. Only use for BIASES (bias_initializer='zeros' is the default and fine).", when_use: "• Bias initialization ONLY\n• Testing / debugging", when_not: "• NEVER for weights! All neurons stay identical forever" },
      de: { analogy: "ALLE Gewichte sind EXAKT 0. Jedes Neuron gibt 0 aus, identische Gradienten — lernt NICHTS (Symmetrieproblem). Niemals für Gewichte!", tip: "NIEMALS Gewichte mit Null initialisieren. Nur für BIASES (bias_initializer='zeros' ist Standard und okay).", when_use: "• NUR für Bias-Initialisierung\n• Testen / Debuggen", when_not: "• NIEMALS für Gewichte! Alle Neuronen bleiben identisch" },
      math: "W = 0",
      ctrl: {},
      demo: {},
      sample: function(n) { var a = []; for (var i = 0; i < n; i++) a.push(0); return { data: a, lo: -1, hi: 1, type: "constant", key: "ALL ZERO" }; }
    },
    ones: {
      en: { analogy: "ALL weights are EXACTLY 1. Output = sum of inputs × 1 = huge values. Same symmetry problem as zeros.", tip: "Almost never useful. Creates identical neurons + huge activations.", when_use: "• Very specific experiments\n• Testing", when_not: "• Almost never for training\n• Symmetry + huge activations" },
      de: { analogy: "ALLE Gewichte sind EXAKT 1. Ausgabe = Summe der Eingaben × 1 = riesige Werte. Gleiches Symmetrieproblem.", tip: "Fast nie nützlich. Erzeugt identische Neuronen + riesige Aktivierungen.", when_use: "• Sehr spezielle Experimente\n• Testen", when_not: "• Fast nie für Training\n• Symmetrie + riesige Aktivierungen" },
      math: "W = 1",
      ctrl: {},
      demo: {},
      sample: function(n) { var a = []; for (var i = 0; i < n; i++) a.push(1); return { data: a, lo: 0, hi: 2, type: "constant", key: "ALL ONE" }; }
    },
    constant: {
      en: { analogy: "ALL weights = same value of your choice. Same symmetry problem as zeros/ones.", tip: "Same problem: all neurons start identical → learn the same thing. Only for biases or tests.", when_use: "• Custom bias value needed\n• Testing specific values", when_not: "• Hidden layer weights (symmetry)\n• Random init is almost always better" },
      de: { analogy: "ALLE Gewichte = gleicher Wert. Gleiches Symmetrieproblem wie zeros/ones.", tip: "Gleiches Problem: alle Neuronen starten identisch. Nur für Biases oder Tests.", when_use: "• Benutzerdefinierter Bias-Wert\n• Testen bestimmter Werte", when_not: "• Verborgene Layer (Symmetrie)\n• Zufällige Init fast immer besser" },
      math: "W = \\text{value}",
      ctrl: {
        value: { min: -5, max: 5, default: 0.5, step: 0.1, desc_en: "The single value for EVERY weight.", desc_de: "Der einzelne Wert für JEDES Gewicht.", example_en: "value=0.5 → every weight = 0.5. All neurons produce identical output!", example_de: "value=0.5 → jedes Gewicht = 0.5. Alle Neuronen identisch!" }
      },
      demo: {},
      sample: function(n, fi, fo, c) { var a = []; for (var i = 0; i < n; i++) a.push(c.value); return { data: a, lo: c.value - 0.5, hi: c.value + 0.5, type: "constant", key: "ALL=" + c.value.toFixed(2) }; }
    },
    identity: {
      en: { analogy: "Identity matrix: 1s on diagonal, 0s elsewhere. Output = input × gain. Only for square weight matrices.", tip: "Layer starts as: output = input × gain. Rarely used outside residual networks.", when_use: "• Layer should start as identity\n• Residual network init\n• Specialized architectures", when_not: "• Only for square 2D matrices\n• Not for Conv layers\n• Usually not needed" },
      de: { analogy: "Einheitsmatrix: 1en auf Diagonale, 0en sonst. Ausgabe = Eingabe × gain. Nur für quadratische Matrizen.", tip: "Layer startet als: Ausgabe = Eingabe × gain. Selten außerhalb von Residualnetzen.", when_use: "• Layer soll als Identität starten\n• Residualnetz-Init\n• Spezialisierte Architekturen", when_not: "• Nur für quadratische 2D-Matrizen\n• Nicht für Conv-Layer\n• Normalerweise nicht nötig" },
      math: "W = \\text{gain} \\cdot I",
      ctrl: {
        gain: { min: 0.1, max: 5, default: 1, step: 0.1, desc_en: "Diagonal multiplier. gain=1 → identity (output=input).", desc_de: "Diagonalmultiplikator. gain=1 → Identität (Ausgabe=Eingabe).", example_en: "gain=1 → pass-through. gain=0 → dead layer. gain=2 → amplify.", example_de: "gain=1 → Durchleitung. gain=0 → toter Layer. gain=2 → Verstärkung." }
      },
      demo: {},
      sample: function(n, fi, fo, c) {
        var sz = Math.ceil(Math.sqrt(n)); var a = [];
        for (var i = 0; i < n; i++) { var r = Math.floor(i / sz), col = i % sz; a.push(r === col ? c.gain : 0); }
        return { data: a, lo: -0.5, hi: c.gain + 0.5, type: "constant", key: "gain=" + c.gain.toFixed(1) }; }
    }
  };

  // ─── REGULARIZER DATA ──────────────────────────────────────────────────────

  var regData = {
    none: {
      en: { analogy: "No penalty. Model can use any weight values freely. Maximum flexibility but overfitting risk.", tip: "Only skip regularization with TONS of data and simple models. Some L2 always helps.", when_use: "• Very simple problems\n• Baseline comparisons", when_not: "• Most real problems → overfits without reg\n• Even tiny L2 (0.0001) helps" },
      de: { analogy: "Keine Strafe. Maximale Flexibilität, aber Überanpassungsrisiko.", tip: "Nur ohne Regularisierung bei SEHR vielen Daten. Etwas L2 hilft immer.", when_use: "• Sehr einfache Probleme\n• Basisvergleiche", when_not: "• Meiste echte Probleme → overfittet\n• Schon winziges L2 (0.0001) hilft" },
      math: "\\text{Penalty} = 0",
      ctrl: {}
    },
    l1: {
      en: { analogy: "Penalty = l1 × |weight|. Small weights pushed to EXACTLY 0 (sparsity). Prunes unimportant connections.", tip: "Use L1 for feature selection: which inputs matter? Example: gene expression with 10,000 genes → L1 finds the important ones.", when_use: "• Feature selection (which inputs matter?)\n• Interpretable sparse models\n• High-dimensional data (more features than samples)", when_not: "• You only need small weights not zeros\n• L2 is smoother for generalization" },
      de: { analogy: "Strafe = l1 × |Gewicht|. Kleine Gewichte auf exakt 0 (Sparsity). Entfernt unwichtige Verbindungen.", tip: "L1 für Feature-Auswahl: welche Eingaben sind wichtig? Beispiel: Genexpression mit 10.000 Genen → L1 findet die wichtigen.", when_use: "• Feature-Auswahl\n• Interpretierbare dünn besetzte Modelle\n• Hochdimensionale Daten", when_not: "• Nur kleine Gewichte, nicht Null\n• L2 ist glatter für Generalisierung" },
      math: "\\text{Penalty} = \\text{l1} \\cdot \\sum |W|",
      ctrl: { l1: { min: 0, max: 0.1, default: 0.01, step: 0.001, desc_en: "L1 strength. Higher = more weights become exactly 0.", desc_de: "L1-Stärke. Höher = mehr Gewichte werden exakt 0.", example_en: "0.001 → mild (few zeroed). 0.01 → moderate. 0.1 → aggressive (most zeroed).", example_de: "0.001 → mild (wenige auf 0). 0.01 → moderat. 0.1 → aggressiv (meiste auf 0)." } },
      penalty: function(w, c) { return c.l1 * Math.abs(w); }
    },
    l2: {
      en: { analogy: "Penalty = l2 × weight². Large weights HEAVILY punished (quadratic!), tiny weights barely feel it. Also called weight decay.", tip: "DEFAULT regularizer for almost every neural network. Start l2=0.01. ResNet uses 0.0001 for ImageNet.", when_use: "• DEFAULT for MOST neural networks\n• Prevents overfitting on any model\n• Works with all optimizers\n• Almost always improves generalization", when_not: "• If you NEED exact zeros (L1)\n• Very high l2 → model underfits" },
      de: { analogy: "Strafe = l2 × Gewicht². Große Gewichte STARK bestraft (quadratisch!), kleine kaum. Auch Weight Decay.", tip: "STANDARD-Regularisierer für fast jedes Netz. Starte l2=0.01. ResNet nutzt 0.0001.", when_use: "• STANDARD für die meisten Netze\n• Verhindert Überanpassung\n• Funktioniert mit allen Optimierern\n• Verbessert fast immer Generalisierung", when_not: "• Wenn exakte Null nötig (L1)\n• Sehr hohes l2 → Modell unterfittet" },
      math: "\\text{Penalty} = \\text{l2} \\cdot \\sum W^2",
      ctrl: { l2: { min: 0, max: 0.1, default: 0.01, step: 0.001, desc_en: "L2 strength. Higher = smaller weights. 0.01 is a common start.", desc_de: "L2-Stärke. Höher = kleinere Gewichte. 0.01 ist guter Start.", example_en: "0.0001 → very mild. 0.01 → moderate default. 0.1 → strong (may underfit).", example_de: "0.0001 → sehr mild. 0.01 → moderater Standard. 0.1 → stark (kann unterfitten)." } },
      penalty: function(w, c) { return c.l2 * w * w; }
    },
    l1l2: {
      en: { analogy: "L1 (sparsity) + L2 (small weights) combined. L1 zeros out unimportant, L2 keeps remaining small. Best of both worlds.", tip: "Use when you want BOTH sparsity AND small model. Production model: mostly 0 (L1), stable remaining (L2).", when_use: "• When you want BOTH sparsity and small weights\n• Production: compact + stable\n• Complex models with many params", when_not: "• Tuning two hyperparams is expensive\n• Simple problems: one regularizer is enough" },
      de: { analogy: "L1 (Sparsity) + L2 (kleine Gewichte) kombiniert. L1 entfernt unwichtige, L2 hält restliche klein.", tip: "Verwende bei SOWOHL dünn besetzten ALS AUCH kleinen Modellen. Produktion: meist 0 (L1), stabil (L2).", when_use: "• SOWOHL Sparsity als auch kleine Gewichte\n• Produktion: kompakt + stabil\n• Komplexe Modelle", when_not: "• Zwei Hyperparameter aufwändig\n• Einfache Probleme: einer reicht" },
      math: "\\text{Penalty} = \\text{l1} \\cdot \\sum |W| + \\text{l2} \\cdot \\sum W^2",
      ctrl: {
        l1: { min: 0, max: 0.1, default: 0.005, step: 0.001, desc_en: "L1 strength (sparsity).", desc_de: "L1-Stärke (Sparsity).", example_en: "Controls how many weights become exactly 0.", example_de: "Bestimmt, wie viele Gewichte exakt 0 werden." },
        l2: { min: 0, max: 0.1, default: 0.005, step: 0.001, desc_en: "L2 strength (weight decay).", desc_de: "L2-Stärke (Weight Decay).", example_en: "Controls how small non-zero weights stay.", example_de: "Bestimmt, wie klein Nicht-Null-Gewichte bleiben." }
      },
      penalty: function(w, c) { return c.l1 * Math.abs(w) + c.l2 * w * w; }
    }
  };

  // ─── STATE ─────────────────────────────────────────────────────────────────

  var _state = { kind: "initializer", name: "glorotUniform", ctrl: {}, demo: {} };

  // ─── BUILD POPUP ───────────────────────────────────────────────────────────

  function buildPopup(kind, name) {
    removePopup();
    _state.kind = kind;
    _state.name = name;
    _state.ctrl = {};
    _state.demo = {};
    _lastPlotData = null;
    _lastMatrixData = null;

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
      _state.demo = {};
      _lastPlotData = null;
      _lastMatrixData = null;
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

    // Init ctrl values from defaults
    var ck = Object.keys(info.ctrl);
    if (Object.keys(_state.ctrl).length === 0) {
      for (var ci = 0; ci < ck.length; ci++) _state.ctrl[ck[ci]] = info.ctrl[ck[ci]].default !== undefined ? info.ctrl[ck[ci]].default : 0;
    }
    // Init demo values from defaults
    var dk = Object.keys(info.demo);
    if (Object.keys(_state.demo).length === 0) {
      for (var di = 0; di < dk.length; di++) _state.demo[dk[di]] = info.demo[dk[di]].default !== undefined ? info.demo[dk[di]].default : 0;
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
    ibox.style.cssText = "background:#313244;border-radius:10px;padding:12px 14px;margin-bottom:6px;font-size:13px;line-height:1.7;border-left:4px solid #f9e2af;";
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
      fbox.style.cssText = "background:#313244;border-radius:10px;padding:12px;margin-bottom:14px;border-left:4px solid #89b4fa;overflow-x:auto;text-align:center;";
      fbox.innerHTML = renderMathBlock(info.math);
      c.appendChild(fbox);
    }

    // === CONFIGURABLE PARAMETERS (only real initializer params) ===
    if (ck.length > 0) {
      var ph = _secH(isReg ? "Parameters" : t.configParams, "#fab387");
      c.appendChild(ph);

      var pbox = document.createElement("div");
      pbox.style.cssText = "background:#313244;border-radius:10px;padding:12px 14px;margin-bottom:14px;display:flex;flex-direction:column;gap:10px;";

      for (var ci = 0; ci < ck.length; ci++) {
        pbox.appendChild(_ctrlEl(ck[ci], info.ctrl[ck[ci]], c, t, "ctrl"));
      }
      c.appendChild(pbox);
    }

    // === DEMO SETTINGS (fan_in/fan_out for visualization only) ===
    if (dk.length > 0) {
      var dh = _secH(t.demoPlay, "#585b70");
      c.appendChild(dh);

      var dbox = document.createElement("div");
      dbox.style.cssText = "background:#313244;border-radius:10px;padding:12px 14px;margin-bottom:14px;display:flex;flex-direction:column;gap:10px;";

      if (!isReg) {
        var ddesc = document.createElement("div");
        ddesc.style.cssText = "font-size:11px;color:#585b70;margin-bottom:4px;font-style:italic;";
        ddesc.textContent = t.demoExplainDesc;
        dbox.appendChild(ddesc);
      }

      for (var di = 0; di < dk.length; di++) {
        dbox.appendChild(_ctrlEl(dk[di], info.demo[dk[di]], c, t, "demo"));
      }
      c.appendChild(dbox);
    }

    // Plot
    var plotH = _secH(isReg ? t.regPlotTitle : t.plotTitle, "#a6e3a1");
    c.appendChild(plotH);
    var plotBox = document.createElement("div");
    plotBox.style.cssText = "background:#313244;border-radius:10px;padding:10px;margin-bottom:14px;";
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
    mbox.style.cssText = "background:#313244;border-radius:10px;padding:12px 14px;margin-bottom:14px;overflow-x:auto;";
    c.appendChild(mbox);

    // When to use
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

    // Parameter explanations (for ctrl params only)
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
        exBox.style.cssText = "background:#313244;border-radius:8px;padding:10px 12px;margin-bottom:6px;";
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

    // Demo parameter explanations
    if (dk.length > 0) {
      var exH2 = document.createElement("h4");
      exH2.textContent = t.demoParams;
      exH2.style.cssText = "color:#585b70;margin:12px 0 4px 0;font-size:13px;";
      c.appendChild(exH2);
      var exD2 = document.createElement("div");
      exD2.style.cssText = "font-size:11px;color:#585b70;margin-bottom:8px;";
      exD2.textContent = t.demoExplainDesc;
      c.appendChild(exD2);

      for (var di = 0; di < dk.length; di++) {
        var def = info.demo[dk[di]];
        var exBox = document.createElement("div");
        exBox.style.cssText = "background:#313244;border-radius:8px;padding:10px 12px;margin-bottom:6px;";
        var exName = document.createElement("div");
        exName.style.cssText = "font-family:monospace;color:#585b70;font-size:12px;font-weight:bold;margin-bottom:2px;";
        exName.textContent = dk[di];
        exBox.appendChild(exName);
        var descEn = "Number of input" + (dk[di] === "fan_out" ? " output" : "") + " neurons. This comes from your layer's actual dimensions — not an initializer setting.";
        var descDe = "Anzahl der Eingangs-" + (dk[di] === "fan_out" ? " Ausgangs-" : "") + "Neuronen. Kommt von deinen tatsächlichen Layer-Dimensionen — keine Initialisierer-Einstellung.";
        var exDesc = document.createElement("div");
        exDesc.style.cssText = "font-size:12px;color:#585b70;line-height:1.5;font-style:italic;";
        exDesc.textContent = L() === "de" ? descDe : descEn;
        exBox.appendChild(exDesc);
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

  function _ctrlEl(key, def, contentContainer, t, store) {
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
        if (_state[store][key] === def.options[oi]) opt.selected = true;
        sel.appendChild(opt);
      }
      wrap.appendChild(sel);
      sel.onchange = function () { _state[store][key] = this.value; _onChange(contentContainer, t); };
    } else {
      var inner = document.createElement("div");
      inner.style.cssText = "display:flex;align-items:center;gap:6px;";
      var range = document.createElement("input");
      range.type = "range";
      range.min = def.min;
      range.max = def.max;
      range.step = def.step;
      range.value = _state[store][key] !== undefined ? _state[store][key] : def.default;
      range.style.cssText = "flex:1;accent-color:#89b4fa;height:4px;cursor:pointer;max-width:200px;";
      var num = document.createElement("input");
      num.type = "number";
      num.min = def.min;
      num.max = def.max;
      num.step = def.step;
      num.value = _state[store][key] !== undefined ? _state[store][key] : def.default;
      num.style.cssText = "width:68px;background:#45475a;color:#cdd6f4;border:1px solid #585b70;border-radius:4px;padding:2px 5px;font-size:12px;text-align:right;";

      var update = function () { var v = parseFloat(num.value); if (!isNaN(v)) { v = clamp(v, def.min, def.max); range.value = v; _state[store][key] = v; _onChange(contentContainer, t); } };
      range.oninput = function () { num.value = this.value; _state[store][key] = parseFloat(this.value); _onChange(contentContainer, t); };
      num.oninput = update;

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
      yL1.push(l1v * ax); yL2.push(l2v * x[i] * x[i]); yC.push(l1v * ax + l2v * x[i] * x[i]);
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
    var fi = _state.demo.fan_in || 128;
    var fo = _state.demo.fan_out || 128;
    var Nplot = 5000, Nmat = 20, total = Nplot + Nmat;

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
    if (result.key) { lo.annotations = [{ x: 0.98, y: 0.95, xref: "paper", yref: "paper", text: result.key, showarrow: false, font: { size: 10, color: "#585b70" }, align: "right" }]; }
    try { Plotly.newPlot(pd, traces, lo, { responsive: true, displayModeBar: false }); } catch (e) {}
  }

  // ─── RENDER MATRIX ─────────────────────────────────────────────────────────

  function _renderMatrix(c, t) {
    var md = document.getElementById(_POPUP_ID + "_m");
    if (!md) return;
    if (_state.kind === "regularizer") _renderRegMatrix(md);
    else _renderInitMatrix(md);
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
      h += "<div style='font-size:11px;color:#585b70;margin-bottom:6px;'>l1 = " + l1v.toFixed(4) + (hasL2 ? " &nbsp;|&nbsp; l2 = " + l2v.toFixed(4) : "") + "</div>";
    }
    h += "<table style='border-collapse:collapse;font-size:12px;width:100%;text-align:center;'>";
    h += "<tr style='background:#45475a;'><th style='padding:4px 6px;color:#cdd6f4;'>Weight w</th>";
    if (hasL1) h += "<th style='padding:4px 6px;color:#f38ba8;'>|w|</th><th style='padding:4px 6px;color:#f38ba8;'>L1 penalty</th>";
    if (hasL2) h += "<th style='padding:4px 6px;color:#89b4fa;'>w²</th><th style='padding:4px 6px;color:#89b4fa;'>L2 penalty</th>";
    h += "<th style='padding:4px 6px;color:#a6e3a1;'>Total</th></tr>";

    var sL1 = 0, sL2 = 0;
    for (var i = 0; i < exW.length; i++) {
      var w = exW[i], aw = Math.abs(w), w2 = w * w;
      var p1 = hasL1 ? l1v * aw : 0, p2 = hasL2 ? l2v * w2 : 0;
      sL1 += p1; sL2 += p2;
      h += "<tr style='background:" + (i % 2 === 0 ? "#313244" : "#363849") + ";'>";
      h += "<td style='padding:3px 6px;font-family:monospace;color:" + (w < 0 ? "#f38ba8" : "#a6e3a1") + ";'>" + w.toFixed(2) + "</td>";
      if (hasL1) h += "<td style='padding:3px 6px;font-family:monospace;color:#a6adc8;'>" + aw.toFixed(2) + "</td><td style='padding:3px 6px;font-family:monospace;color:#f38ba8;'>" + p1.toFixed(4) + "</td>";
      if (hasL2) h += "<td style='padding:3px 6px;font-family:monospace;color:#a6adc8;'>" + w2.toFixed(4) + "</td><td style='padding:3px 6px;font-family:monospace;color:#89b4fa;'>" + p2.toFixed(4) + "</td>";
      h += "<td style='padding:3px 6px;font-family:monospace;color:#a6e3a1;font-weight:bold;'>" + (p1 + p2).toFixed(4) + "</td></tr>";
    }
    h += "<tr style='background:#45475a;font-weight:bold;'><td style='padding:3px 6px;color:#cdd6f4;'>∑ total</td>";
    if (hasL1) h += "<td></td><td style='padding:3px 6px;color:#f38ba8;'>" + sL1.toFixed(4) + "</td>";
    if (hasL2) h += "<td></td><td style='padding:3px 6px;color:#89b4fa;'>" + sL2.toFixed(4) + "</td>";
    h += "<td style='padding:3px 6px;color:#a6e3a1;'>" + (sL1 + sL2).toFixed(4) + "</td></tr></table>";
    if (_state.name !== "none") { h += "<div style='font-size:11px;color:#585b70;margin-top:6px;text-align:right;'>Penalty added to loss: " + (sL1 + sL2).toFixed(4) + "</div>"; }
    if (_state.name === "none") h = "<div style='font-size:12px;color:#585b70;text-align:center;padding:8px;'>No penalty — weights can be any size.</div>";
    md.innerHTML = h;
  }

  function _renderInitMatrix(md) {
    var info = initData[_state.name];
    if (!info || !info.sample) { md.innerHTML = ""; return; }
    var R = 4, C = 5;
    var vals;
    if (_lastMatrixData && _lastMatrixData.length >= R * C) {
      vals = _lastMatrixData.slice(0, R * C);
    } else {
      var fi = _state.demo.fan_in || 128, fo = _state.demo.fan_out || 128;
      var res = info.sample(R * C, fi, fo, _state.ctrl);
      vals = res.data;
    }
    var h = "<div style='font-size:10px;color:#585b70;margin-bottom:6px;'>← These " + (R * C) + " values are SAMPLED from the distribution in the plot above</div>";
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
    btn.style.cssText = "height:18px;width:auto;cursor:pointer;margin-left:3px;vertical-align:middle;transition:transform 0.2s,opacity 0.2s;display:inline-block;opacity:0.55;";
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
    if (tr) { var ft = tr.querySelector("td:first-child"); if (ft) { ft.appendChild(btn); return; } }
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
