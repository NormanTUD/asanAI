(function() {

  var _POPUP_ID = "explain_activation_popup_overlay";
  var _PLOT_ID = "explain_activation_plot";

  var _state = { kind: "activation", name: "relu", ctrl: {} };

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

  // ─── TRANSLATIONS ─────────────────────────────────────────────────────

  var i18n = {
    en: {
      title: "Activation Functions & Constraints",
      actTab: "Activation Functions", constraintTab: "Constraints",
      intuition: "Intuition", formula: "The Formula",
      plotTitle: "Function & Derivative", derivative: "Derivative",
      when: "When to use ? When not ?",
      selectLabel: "Choose:",
      practicalTip: "Practical tip",
      constrBefore: "Before Constraint", constrAfter: "After Constraint",
      closeOutside: "(click outside to close)",
      alpha: "Alpha (α)",
      maxNormVal: "Max Norm",
      minMaxNormMin: "Min Norm",
      minMaxNormMax: "Max Norm",
      constrVizTitle: "Weight Vectors — before vs after",
      paramExplain: "Configurable Parameters",
      paramExplainDesc: "These values affect the visualization:"
    },
    de: {
      title: "Aktivierungsfunktionen & Constraints",
      actTab: "Aktivierungsfunktionen", constraintTab: "Constraints",
      intuition: "Intuition", formula: "Die Formel",
      plotTitle: "Funktion & Ableitung", derivative: "Ableitung",
      when: "Wann verwenden ? Wann nicht ?",
      selectLabel: "Auswahl:",
      practicalTip: "Praktischer Tipp",
      constrBefore: "Vor dem Constraint", constrAfter: "Nach dem Constraint",
      closeOutside: "(Klick außerhalb zum Schließen)",
      alpha: "Alpha (α)",
      maxNormVal: "Max Norm",
      minMaxNormMin: "Min Norm",
      minMaxNormMax: "Max Norm",
      constrVizTitle: "Gewichtsvektoren — vor vs nach",
      paramExplain: "Konfigurierbare Parameter",
      paramExplainDesc: "Diese Werte beeinflussen die Visualisierung:"
    }
  };

  // ─── ACTIVATION DATA ────────────────────────────────────────────────────

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
    },
    LeakyReLU: {
      en: {
        analogy: "ReLU with a safety net: instead of blocking negative values entirely, it lets a tiny fraction (alpha) through. Prevents dying neurons while keeping most ReLU benefits.",
        tip: "Use when you observe dead neurons (many activations stuck at 0). alpha=0.1 or 0.2 is common. Higher alpha = more gradient flow for negatives.",
        when_use: "• When dying ReLU is a problem\n• Deeper networks where some neurons die\n• GANs (often preferred over ReLU)", when_not: "• Most standard networks: ReLU is simpler\n• If alpha is too high: network may not learn sparse features"
      },
      de: {
        analogy: "ReLU mit Sicherheitsnetz: statt negative Werte komplett zu blockieren, lässt es einen winzigen Bruchteil (alpha) durch. Verhindert sterbende Neuronen.",
        tip: "Bei toten Neuronen (viele Aktivierungen bei 0) verwenden. alpha=0.1 oder 0.2 üblich.",
        when_use: "• Wenn ReLU-Neuronen sterben\n• Tiefere Netze\n• GANs", when_not: "• Meiste Netze: ReLU einfacher\n• Zu hohes alpha: lernt keine spärlichen Features"
      },
      math: "f(x) = \\begin{cases}x & x > 0\\\\\\alpha x & x \\le 0\\end{cases}\\quad f'(x) = \\begin{cases}1 & x > 0\\\\\\alpha & x \\le 0\\end{cases}",
      fn: function(x, a) { var al = a !== undefined ? a : 0.1; return x > 0 ? x : al * x; },
      dfn: function(x, a) { var al = a !== undefined ? a : 0.1; return x > 0 ? 1 : al; },
      ctrl: { alpha: { min: 0.01, max: 0.5, default: 0.1, step: 0.01, desc_en: "Slope for negative inputs. Higher = more information flows for negatives.", desc_de: "Steigung für negative Eingaben. Höher = mehr Information für Negative fließt." } }
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

  function buildPopup(kind, name) {
    removePopup();
    _state.kind = kind;
    _state.name = name;
    _state.ctrl = {};

    var t = i18n[L()];
    var isCon = kind === "constraint";
    var db = isCon ? conData : actData;
    var info = db[name];
    if (!info) return;

    // Init ctrl defaults
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

    var actG = document.createElement("optgroup");
    actG.label = t.actTab;
    var actKeys = Object.keys(actData);
    for (var i = 0; i < actKeys.length; i++) {
      var o = document.createElement("option");
      o.value = "a:" + actKeys[i];
      o.textContent = actKeys[i];
      if (_state.kind === "activation" && _state.name === actKeys[i]) o.selected = true;
      actG.appendChild(o);
    }
    sel.appendChild(actG);

    var conG = document.createElement("optgroup");
    conG.label = t.constraintTab;
    var conKeys = Object.keys(conData);
    for (var i = 0; i < conKeys.length; i++) {
      var o = document.createElement("option");
      o.value = "c:" + conKeys[i];
      o.textContent = conKeys[i];
      if (_state.kind === "constraint" && _state.name === conKeys[i]) o.selected = true;
      conG.appendChild(o);
    }
    sel.appendChild(conG);

    sel.onchange = function () {
      var p = this.value.split(":");
      _state.kind = p[0] === "a" ? "activation" : "constraint";
      _state.name = p[1];
      _state.ctrl = {};
      var db = _state.kind === "constraint" ? conData : actData;
      var info = db[_state.name];
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
    var isCon = _state.kind === "constraint";
    var db = isCon ? conData : actData;
    var info = db[_state.name];
    if (!info) return;

    var loc = L() === "de" ? info.de : info.en;
    var ck = Object.keys(info.ctrl || {});

    // Init ctrl if empty
    if (Object.keys(_state.ctrl).length === 0) {
      for (var ci = 0; ci < ck.length; ci++) _state.ctrl[ck[ci]] = info.ctrl[ck[ci]].default !== undefined ? info.ctrl[ck[ci]].default : 0;
    }

    // Name + category
    var title = document.createElement("h3");
    title.textContent = _state.name + (isCon ? "" : "()");
    title.style.cssText = "margin:0 0 2px 0;color:#cdd6f4;font-size:18px;";
    c.appendChild(title);
    var cat = document.createElement("div");
    cat.style.cssText = "font-size:10px;color:#585b70;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;";
    cat.textContent = isCon ? t.constraintTab : t.actTab;
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

    // Configurable parameters
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

    // Plot
    if (!isCon) {
      var plotH = _secH(t.plotTitle, "#a6e3a1");
      c.appendChild(plotH);
    } else {
      var plotH = _secH(t.constrVizTitle, "#a6e3a1");
      c.appendChild(plotH);
    }
    var plotBox = document.createElement("div");
    plotBox.style.cssText = "background:#313244;border-radius:10px;padding:10px;margin-bottom:14px;";
    var plotDiv = document.createElement("div");
    plotDiv.id = _PLOT_ID;
    plotDiv.style.cssText = "width:100%;height:260px;";
    plotBox.appendChild(plotDiv);
    c.appendChild(plotBox);

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

  function _onChange(c, t) {
    _renderPlots(c);
  }

  // ─── RENDER PLOTS ─────────────────────────────────────────────────────

  function _renderPlots(c) {
    var pd = document.getElementById(_PLOT_ID);
    if (!pd) return;
    if (typeof Plotly === "undefined") { pd.textContent = "[Plotly not loaded]"; return; }
    if (_state.kind === "constraint") _renderConstrPlot(pd);
    else _renderActPlot(pd);
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

  function _renderConstrPlot(pd) {
    var info = conData[_state.name];
    if (!info || !info.apply) { pd.innerHTML = ""; return; }

    // Generate random weight vectors
    var before = [], after = [];
    var n = 16;
    for (var i = 0; i < n; i++) {
      var x = (Math.random() * 4) - 2;
      var y = (Math.random() * 4) - 2;
      before.push([x, y]);
    }

    var ctrl = _state.ctrl;
    for (var i = 0; i < before.length; i++) {
      var w = before[i];
      var res;
      if (_state.name === "maxNorm") res = info.apply(w, ctrl.max_norm);
      else if (_state.name === "minMaxNorm") res = info.apply(w, ctrl.min_norm, ctrl.max_norm);
      else res = info.apply(w);
      after.push(res);
    }

    var maxR = 3;
    var bx = before.map(function(p){return p[0];}), by = before.map(function(p){return p[1];});
    var ax = after.map(function(p){return p[0];}), ay = after.map(function(p){return p[1];});

    // Draw reference circles
    var circles = [];
    if (_state.name === "maxNorm") {
      var r = ctrl.max_norm;
      var a = getXGrid(0, 2 * Math.PI, 80); var cx = [], cy = [];
      for (var i = 0; i < a.length; i++) { cx.push(r * Math.cos(a[i])); cy.push(r * Math.sin(a[i])); }
      circles.push({ x: cx, y: cy, type: "scatter", mode: "lines", name: "max_norm boundary", line: { color: "#585b70", width: 1.5, dash: "dot" }, hoverinfo: "none" });
    } else if (_state.name === "unitNorm") {
      var a = getXGrid(0, 2 * Math.PI, 80); var cx = [], cy = [];
      for (var i = 0; i < a.length; i++) { cx.push(Math.cos(a[i])); cy.push(Math.sin(a[i])); }
      circles.push({ x: cx, y: cy, type: "scatter", mode: "lines", name: "unit circle", line: { color: "#585b70", width: 1.5, dash: "dot" }, hoverinfo: "none" });
    } else if (_state.name === "minMaxNorm") {
      var a = getXGrid(0, 2 * Math.PI, 80);
      var cx1 = [], cy1 = [], cx2 = [], cy2 = [];
      for (var i = 0; i < a.length; i++) { cx1.push(ctrl.min_norm * Math.cos(a[i])); cy1.push(ctrl.min_norm * Math.sin(a[i])); cx2.push(ctrl.max_norm * Math.cos(a[i])); cy2.push(ctrl.max_norm * Math.sin(a[i])); }
      circles.push({ x: cx1, y: cy1, type: "scatter", mode: "lines", name: "min_norm", line: { color: "#585b70", width: 1, dash: "dot" }, hoverinfo: "none" });
      circles.push({ x: cx2, y: cy2, type: "scatter", mode: "lines", name: "max_norm", line: { color: "#585b70", width: 1.5, dash: "dot" }, hoverinfo: "none" });
    }

    var beforeTrace = { x: bx, y: by, type: "scatter", mode: "markers", name: i18n[L()].constrBefore, marker: { color: "#f38ba8", size: 8, opacity: 0.6 } };
    var afterTrace = { x: ax, y: ay, type: "scatter", mode: "markers", name: i18n[L()].constrAfter, marker: { color: "#a6e3a1", size: 8, opacity: 0.9 } };

    // Lines connecting before->after
    var lx = [], ly = [];
    for (var i = 0; i < before.length; i++) {
      lx.push(before[i][0], after[i][0], null);
      ly.push(before[i][1], after[i][1], null);
    }
    var connTrace = { x: lx, y: ly, type: "scatter", mode: "lines", line: { color: "#585b70", width: 1 }, hoverinfo: "none", showlegend: false };

    var traces = [connTrace].concat(circles).concat([beforeTrace, afterTrace]);

    var lo = {
      paper_bgcolor: "#313244", plot_bgcolor: "#313244", font: { color: "#cdd6f4", size: 11 },
      margin: { l: 50, r: 16, t: 8, b: 40 },
      xaxis: { title: { text: "w₁", font: { color: "#a6adc8", size: 11 } }, gridcolor: "#45475a", zerolinecolor: "#585b70", range: [-maxR, maxR], scaleanchor: "y", scaleratio: 1 },
      yaxis: { title: { text: "w₂", font: { color: "#a6adc8", size: 11 } }, gridcolor: "#45475a", zerolinecolor: "#585b70", range: [-maxR, maxR] },
      legend: { orientation: "h", xanchor: "center", x: 0.5, y: 1.15, font: { size: 10, color: "#cdd6f4" } }
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
    btn.onclick = function (e) { e.preventDefault(); e.stopPropagation(); var s = selGetter(); if (s) buildPopup(s.kind, s.name); };
    return btn;
  }

  function injectIcon(sel, kind) {
    if (sel.dataset.actInfoInjected) return;
    sel.dataset.actInfoInjected = "true";
    var btn = mkBtn(function () { return { kind: kind, name: sel.value }; });
    var tr = sel.closest("tr");
    if (tr) {
      var ft = tr.querySelector("td:first-child");
      if (ft) { ft.appendChild(btn); return; }
    }
    sel.parentNode.insertBefore(btn, sel);
  }

  function injectAll() {
    // Activation selects (per-layer)
    var actSelects = document.querySelectorAll("select.input_data.activation, select.input_field.activation");
    for (var i = 0; i < actSelects.length; i++) {
      injectIcon(actSelects[i], "activation");
    }

    // Constraint selects
    var conSelects = document.querySelectorAll("select.input_data, select.input_field");
    for (var i = 0; i < conSelects.length; i++) {
      var c = conSelects[i].className;
      if (c.indexOf("_constraint") !== -1) injectIcon(conSelects[i], "constraint");
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
