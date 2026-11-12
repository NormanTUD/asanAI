/*
 * LearnSys 2.0 — Ten Minutes reading and demo layer.
 * Public API: LearnSys.mount, .defineDemo, .scene, .util, .motion, .prefs.
 * A demo factory is (root, api) -> { update, resize?, destroy?, getScene? }.
 * Static content belongs on .ls-canvas--static; changing content on
 * .ls-canvas--dynamic. Step changes animate only the changed objects;
 * day changes may morph the dynamic layer. See LEARN_SYSTEM.md.
 */
"use strict";
(function () {
  var LS = {};
  var KEY = "tm_learnsys_pref_v1";
  var LANG = "de";
  var S = null;
  var STRINGS = {
    de: {
      position: "Position", positionOf: "Position {n} von 9",
      of: "von", step: "Schritt", stepOf: "Schritt {n} / {total}",
      prevStep: "Vorheriger Schritt", nextStep: "Nächster Schritt",
      prevDay: "Vorheriger Tag", nextDay: "Nächster Tag",
      back: "Zurück", forward: "Weiter", depth: "Tiefe",
      short: "Kurz", standard: "Standard", deep: "Tief", all: "Alles",
      path: "Weg", allPaths: "Alle Wege", text: "Text",
      textSmaller: "Text kleiner", textLarger: "Text größer",
      demoLarge: "Demo groß", showText: "Text zeigen",
      day: "Tag", days: "Tage", noDays: "Noch keine Tage.",
      demoNotFound: "Demo nicht gefunden: ",
      deepDive: "Tiefer eintauchen", question: "Frage", questions: "Fragen",
      context: "Kontext", oneLevel: "Eine Ebene tiefer", sources: "Quellen",
      moreInLesson: "Mehr in der Lektion →", clickExample: "Klicken für ein Beispiel",
      watch: "Beobachte", defaultHint: "Klicken, ziehen, beobachten.",
      helpTitle: "Tastatur und Position", helpStep: "Schritt zurück / vor",
      helpDay: "Tag zurück / vor", helpJump: "Fünf Schritte zurück / vor",
      helpPos: "Position, auch mehrstellig (z. B. 1 1)",
      helpHome: "Erster / letzter Tag", helpMix: "Anderer Mix",
      helpDepth: "Tiefe öffnen", helpDown: "Nächste zugeklappte Box öffnen", helpFocus: "Demo groß",
      helpFont: "Text größer / kleiner", helpHelp: "Hilfe öffnen / schließen",
      interactiveDemo: "Interaktive Demo", stepRail: "Schrittleiste",
      depthQuestions: "{n} Fragen", depthQuestion: "{n} Frage", questionIndex: "Fragen", questionContext: "Was ist der Kontext?", questionDeep: "Warum ist das so?",
      textSize: "Textgröße", mixLabel: "Mix"
    },
    en: {
      position: "Position", positionOf: "Position {n} of 9",
      of: "of", step: "Step", stepOf: "Step {n} / {total}",
      prevStep: "Previous step", nextStep: "Next step",
      prevDay: "Previous day", nextDay: "Next day",
      back: "Back", forward: "Next", depth: "Depth",
      short: "Short", standard: "Standard", deep: "Deep", all: "All",
      path: "Path", allPaths: "All paths", text: "Text",
      textSmaller: "Smaller text", textLarger: "Larger text",
      demoLarge: "Large demo", showText: "Show text",
      day: "Day", days: "Days", noDays: "No days yet.",
      demoNotFound: "Demo not found: ",
      deepDive: "Go deeper", question: "question", questions: "questions",
      context: "Context", oneLevel: "One level deeper", sources: "Sources",
      moreInLesson: "More in the lesson →", clickExample: "Click for an example",
      watch: "Watch", defaultHint: "Click, drag, observe.",
      helpTitle: "Keyboard and position", helpStep: "Step back / forward",
      helpDay: "Day back / forward", helpJump: "Five steps back / forward",
      helpPos: "Position, multi-digit (e.g. 1 1)",
      helpHome: "First / last day", helpMix: "Another mix",
      helpDepth: "Open depth", helpDown: "Open the next collapsed box", helpFocus: "Large demo",
      helpFont: "Text larger / smaller", helpHelp: "Open / close help",
      interactiveDemo: "Interactive demo", stepRail: "Step rail",
      depthQuestions: "{n} questions", depthQuestion: "{n} question", questionIndex: "Questions", questionContext: "What is the context?", questionDeep: "Why is that so?",
      textSize: "Text size", mixLabel: "Mix"
    }
  };
  function setLang(lang) {
    LANG = lang === "en" ? "en" : "de";
    S = STRINGS[LANG];
  }
  function t(key, vars) {
    var out = (S && S[key]) || STRINGS.de[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) {
      out = out.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
    });
    return out;
  }
  var root = null;
  var cfg = null;
  var state = { track: "all", depth: "standard", font: 1, day: 0, step: 0 };
  var demo = null;
  var currentDemoDay = null;
  var els = {};
  var tipTimer = 0;
  var tipTerm = null;
  var cueObserver = null;
  var cueSuppressUntil = 0;
  var cuesArmed = false;
  var ignoreScroll = false;
  var posCount = 10;
  var posBuffer = "";
  var posTimer = 0;

  var FONT_LEVELS = [
    { id: "s", label: "Klein", body: 15, title: 24, small: 11 },
    { id: "m", label: "Normal", body: 17, title: 28, small: 12 },
    { id: "l", label: "Groß", body: 19, title: 32, small: 13 },
    { id: "xl", label: "Sehr groß", body: 21, title: 36, small: 14 },
    { id: "xxl", label: "Maximal", body: 23, title: 40, small: 15 }
  ];
  var FONT_MIN = 0, FONT_MAX = FONT_LEVELS.length - 1;
  function normalizeFont(v) {
    v = parseInt(v, 10);
    if (!isFinite(v)) return 1;
    return clamp(v, FONT_MIN, FONT_MAX);
  }
  function fontPx(role) {
    var body = FONT_LEVELS[normalizeFont(state.font)].body;
    var px = body;
    if (role === "micro") px = body * .58;
    else if (role === "ui") px = body * .82;
    else if (role === "ui-sm") px = body * .72;
    else if (role === "readout") px = body * .95;
    else if (role === "canvas") px = body * .68;
    else if (role === "canvas-sm") px = body * .58;
    return Math.max(9, Math.round(px * 10) / 10);
  }
  var TRACK_LABEL = {};
  var GLOSSARY = {
    matrix: {
      label: "Matrix",
      short: "Ein Gitter aus Zahlen. Jede Zeile und Spalte hat eine Bedeutung.",
      long: "Eine Matrix ist ein rechteckiges Gitter aus Zahlen. In einem Bild kann eine 3×3-Matrix ein kleiner Pixelausschnitt sein; in einem Netz ist eine Gewichtsmatrix eine gelernte Abbildung von einem Vektor auf einen anderen. Die Form sagt, was hineingeht und was herauskommt: eine 3×3-Matrix bildet drei Zahlen auf drei Zahlen ab.",
      lesson: "computer_vision",
      svg: '<svg viewBox="0 0 120 84" aria-hidden="true"><g fill="none" stroke="#004b6f" stroke-width="1.2"><rect x="12" y="10" width="30" height="24"/><rect x="45" y="10" width="30" height="24"/><rect x="78" y="10" width="30" height="24"/><rect x="12" y="37" width="30" height="24"/><rect x="45" y="37" width="30" height="24"/><rect x="78" y="37" width="30" height="24"/><rect x="12" y="64" width="30" height="10"/><rect x="45" y="64" width="30" height="10"/><rect x="78" y="64" width="30" height="10"/></g><g fill="#004b6f" font-family="Barlow,sans-serif" font-size="10" text-anchor="middle"><text x="27" y="26">1</text><text x="60" y="26">0</text><text x="93" y="26">2</text><text x="27" y="53">0</text><text x="60" y="53">1</text><text x="93" y="53">0</text><text x="27" y="71">2</text><text x="60" y="71">0</text><text x="93" y="71">1</text></g></svg>'
    },
    vektor: {
      label: "Vektor",
      short: "Eine Liste von Zahlen, die einen Punkt oder eine Richtung beschreibt.",
      long: "Ein Vektor ist eine geordnete Liste von Zahlen. Als Punkt gelesen, sagt er, wo etwas liegt; als Pfeil gelesen, sagt er, wohin es zeigt. Ein Token wird im Modell zu einem Vektor, weil das Modell nur mit Zahlen rechnen kann. Die Richtung ist oft wichtiger als die Länge: Zwei Vektoren können unterschiedlich lang sein und trotzdem in dieselbe Richtung zeigen.",
      lesson: "embeddinglab",
      svg: '<svg viewBox="0 0 120 84" aria-hidden="true"><g stroke="#dbe3e0" stroke-width="1"><line x1="12" y1="70" x2="108" y2="70"/><line x1="12" y1="12" x2="12" y2="70"/></g><line x1="12" y1="70" x2="92" y2="24" stroke="#1275ac" stroke-width="2.4"/><circle cx="92" cy="24" r="4" fill="#63a44b"/><text x="70" y="66" fill="#627476" font-family="Open Sans,sans-serif" font-size="9">v = (3, 2)</text></svg>'
    },
    token: {
      label: "Token",
      short: "Ein Stück Text, das das Modell als Zahl liest.",
      long: "Ein Token ist ein Stück Text aus einem festen Vokabular: ein Wort, ein Wortteil, ein Satzzeichen oder ein Byte. Das Modell sieht nicht die Buchstaben, sondern die ID des Tokens. Deshalb kann es Wörter, die es nie gesehen hat, aus bekannten Teilen zusammensetzen, und deshalb ist Rechtschreibung für das Modell eine Rekonstruktion.",
      lesson: "tokenizerlab",
      svg: '<svg viewBox="0 0 120 84" aria-hidden="true"><g font-family="Open Sans,sans-serif" font-size="9"><rect x="6" y="24" width="30" height="22" fill="#eef7f4" stroke="#63a44b"/><text x="10" y="38" fill="#1f5a3b">un</text><rect x="40" y="24" width="40" height="22" fill="#f5faff" stroke="#1275ac"/><text x="44" y="38" fill="#004b6f">believ</text><rect x="84" y="24" width="30" height="22" fill="#f5f2fb" stroke="#9185be"/><text x="88" y="38" fill="#4a3f73">able</text></g></svg>'
    },
    attention: {
      label: "Attention",
      short: "Ein Mechanismus, der Tokens gewichtet und Information zwischen ihnen bewegt.",
      long: "Attention lässt jedes Token die anderen lesen. Aus einem Query und den Keys entstehen Scores; Softmax macht daraus Gewichte, die zu 1 summieren. Die Ausgabe ist eine gewichtete Mischung der Values. Das ist ein endliches Budget: Wenn ein Token mehr bekommt, bekommt jedes andere weniger.",
      lesson: "attentionlab",
      svg: '<svg viewBox="0 0 120 84" aria-hidden="true"><g fill="#627476" font-family="Open Sans,sans-serif" font-size="8"><text x="10" y="72">she</text><text x="46" y="72">Maria</text><text x="84" y="72">bank</text></g><g fill="none" stroke="#1275ac"><path d="M18 64 Q40 20 54 64" stroke-width="1.2" opacity=".35"/><path d="M18 64 Q48 10 54 64" stroke-width="3.4" opacity=".95"/><path d="M18 64 Q60 30 92 64" stroke-width="2" opacity=".6"/></g><circle cx="18" cy="64" r="3" fill="#004b6f"/></svg>'
    },
    softmax: {
      label: "Softmax",
      short: "Macht aus Scores eine Verteilung, die zu 1 summiert.",
      long: "Softmax exponiert jeden Score, sodass alle Werte positiv werden, und teilt durch die Summe. Die Reihenfolge bleibt erhalten, der größte Score bekommt die meiste Masse. Verschiebt man alle Scores um dieselbe Konstante, ändert sich nichts; deshalb zieht man vorher das Maximum ab. Die Basis e ist Konvention.",
      lesson: "transformer",
      svg: '<svg viewBox="0 0 120 84" aria-hidden="true"><g fill="#63a44b"><rect x="12" y="46" width="12" height="24"/><rect x="30" y="36" width="12" height="34"/><rect x="48" y="24" width="12" height="46"/><rect x="66" y="38" width="12" height="32"/><rect x="84" y="52" width="12" height="18"/></g><line x1="10" y1="70" x2="110" y2="70" stroke="#004b6f"/><text x="44" y="16" fill="#627476" font-family="Open Sans,sans-serif" font-size="8">Σ = 1</text></svg>'
    },
    residual: {
      label: "Residual Stream",
      short: "Ein laufender Vektor, in den jede Schicht ein Update schreibt.",
      long: "Der Residual Stream ist der gemeinsame Vektor eines Tokens. Jede Schicht liest ihn, berechnet ein Update und addiert es. Nichts wird überschrieben. Das gibt dem Gradienten einen kurzen Pfad zurück und erlaubt es späten Schichten, die ursprüngliche Information noch zu sehen.",
      lesson: "transformer",
      svg: '<svg viewBox="0 0 120 84" aria-hidden="true"><line x1="14" y1="58" x2="106" y2="58" stroke="#004b6f" stroke-width="2"/><g fill="#fff" stroke="#1275ac"><rect x="20" y="40" width="18" height="18"/><rect x="46" y="40" width="18" height="18"/><rect x="72" y="40" width="18" height="18"/></g><g fill="#004b6f" font-family="Open Sans,sans-serif" font-size="8"><text x="22" y="52">+A</text><text x="48" y="52">+M</text><text x="74" y="52">+A</text></g><path d="M14 58 Q60 18 106 58" fill="none" stroke="#63a44b" stroke-width="1.2" opacity=".6"/></svg>'
    },
    embedding: {
      label: "Embedding",
      short: "Ein gelernter Vektor für ein Token.",
      long: "Ein Embedding ist eine Zeile in einer gelernten Tabelle: Token-ID hinein, Vektor heraus. Wörter mit ähnlichen Kontexten bekommen ähnliche Vektoren. Die Tabelle ist nur der Start; Attention und das FFN schreiben den Vektor danach um.",
      lesson: "embeddinglab",
      svg: '<svg viewBox="0 0 120 84" aria-hidden="true"><g fill="#63a44b"><circle cx="28" cy="28" r="4"/><circle cx="48" cy="24" r="4"/><circle cx="66" cy="30" r="4"/><circle cx="86" cy="22" r="4"/></g><g fill="#1275ac"><circle cx="34" cy="54" r="4"/><circle cx="54" cy="60" r="4"/><circle cx="74" cy="52" r="4"/><circle cx="94" cy="58" r="4"/></g><g stroke="#9185be" stroke-width="1" stroke-dasharray="3 3"><line x1="28" y1="28" x2="34" y2="54"/><line x1="48" y1="24" x2="54" y2="60"/></g></svg>'
    },
    kernel: {
      label: "Kernel",
      short: "Ein kleines Fenster gelernter Gewichte, das über ein Bild gleitet.",
      long: "Ein Kernel ist eine kleine Matrix, zum Beispiel 3×3. An jeder Bildposition werden die Pixel unter dem Fenster mit den Kernel-Gewichten multipliziert und summiert. Derselbe Kernel wird überall wiederverwendet; deshalb lernt das Netz ein Muster einmal und erkennt es an vielen Stellen.",
      lesson: "computer_vision",
      svg: '<svg viewBox="0 0 120 84" aria-hidden="true"><rect x="10" y="14" width="60" height="60" fill="#f7f9f8" stroke="#dbe3e0"/><g stroke="#b9c8c3"><line x1="30" y1="14" x2="30" y2="74"/><line x1="50" y1="14" x2="50" y2="74"/><line x1="10" y1="34" x2="70" y2="34"/><line x1="10" y1="54" x2="70" y2="54"/></g><rect x="27" y="31" width="26" height="26" fill="none" stroke="#63a44b" stroke-width="2.4"/><g fill="#004b6f" font-family="Barlow,sans-serif" font-size="10"><text x="80" y="34">-1</text><text x="98" y="34">0</text><text x="80" y="50">1</text><text x="98" y="50">0</text></g></svg>'
    },
    gradient: {
      label: "Gradient",
      short: "Die Richtung, in die der Fehler am stärksten steigt.",
      long: "Der Gradient zeigt bergauf. Der Optimizer geht in die Gegenrichtung, weil er den Fehler kleiner machen will. Die Lernrate entscheidet, wie weit er geht. In einem tiefen Netz wird der Gradient mit der Kettenregel von der Ausgabe zurück zu jedem Parameter berechnet.",
      lesson: "minimalneuron",
      svg: '<svg viewBox="0 0 120 84" aria-hidden="true"><path d="M10 66 Q40 10 110 66" fill="none" stroke="#004b6f" stroke-width="2"/><circle cx="58" cy="34" r="4" fill="#63a44b"/><line x1="58" y1="34" x2="82" y2="52" stroke="#9f9700" stroke-width="2"/><polygon points="82,52 76,50 80,46" fill="#9f9700"/><text x="64" y="30" fill="#627476" font-family="Open Sans,sans-serif" font-size="8">-∇L</text></svg>'
    },
    loss: {
      label: "Loss",
      short: "Eine Zahl, die sagt, wie falsch das Modell liegt.",
      long: "Der Loss macht aus einer Vorhersage ein Lernsignal. Bei einer Linie ist es oft der mittlere quadratische Fehler; bei einem Klassifikator die Kreuzentropie. Der Loss definiert eine Fläche: Jede Parameterwahl ist ein Punkt, die Höhe ist der Fehler.",
      lesson: "minimalneuron",
      svg: '<svg viewBox="0 0 120 84" aria-hidden="true"><path d="M10 20 Q60 100 110 20" fill="none" stroke="#004b6f" stroke-width="2"/><g stroke="#dbe3e0"><line x1="12" y1="70" x2="108" y2="70"/><line x1="12" y1="14" x2="12" y2="70"/></g><circle cx="60" cy="60" r="4" fill="#9185be"/><text x="66" y="58" fill="#627476" font-family="Open Sans,sans-serif" font-size="8">Minimum</text></svg>'
    },
    parameter: {
      label: "Parameter",
      short: "Eine Zahl, die das Modell während des Trainings ändern darf.",
      long: "Parameter sind die Regler eines Modells: Gewichte und Biases. Das Training sucht Werte, die den Loss senken. Ein großes Modell hat Milliarden solcher Zahlen; keine davon bedeutet allein etwas, erst ihr Zusammenspiel erzeugt das Verhalten.",
      lesson: "minimalneuron",
      svg: '<svg viewBox="0 0 120 84" aria-hidden="true"><g stroke="#004b6f" stroke-width="2"><line x1="14" y1="42" x2="106" y2="42"/></g><g fill="#63a44b"><circle cx="30" cy="42" r="6"/><circle cx="62" cy="42" r="6"/><circle cx="92" cy="42" r="6"/></g><g fill="#627476" font-family="Open Sans,sans-serif" font-size="8"><text x="22" y="64">a</text><text x="54" y="64">b</text><text x="84" y="64">c</text></g></svg>'
    },
    layer: {
      label: "Layer",
      short: "Eine Stufe, die den Vektor transformiert.",
      long: "Ein Layer nimmt einen Vektor, verändert ihn und gibt ihn weiter. Im Transformer besteht eine Schicht aus Attention, FFN, Residualverbindung und Normalisierung. Die Struktur wiederholt sich, die gelernten Gewichte jeder Schicht sind verschieden.",
      lesson: "deeplearninglab",
      svg: '<svg viewBox="0 0 120 84" aria-hidden="true"><g fill="#fff" stroke="#1275ac"><rect x="18" y="46" width="24" height="16"/><rect x="48" y="46" width="24" height="16"/><rect x="78" y="46" width="24" height="16"/></g><g stroke="#63a44b" stroke-width="1.4"><line x1="42" y1="54" x2="48" y2="54"/><line x1="72" y1="54" x2="78" y2="54"/></g><text x="22" y="36" fill="#627476" font-family="Open Sans,sans-serif" font-size="8">x</text><text x="82" y="36" fill="#627476" font-family="Open Sans,sans-serif" font-size="8">x + f(x)</text></svg>'
    }
  };

  var GLOSSARY_ALIASES = {
    "matrix": "matrix", "matrizen": "matrix", "matrixen": "matrix",
    "vektor": "vektor", "vektoren": "vektor", "vector": "vektor", "vectors": "vektor",
    "token": "token", "tokens": "token",
    "attention": "attention", "aufmerksamkeit": "attention",
    "softmax": "softmax",
    "residual stream": "residual", "residual": "residual",
    "embedding": "embedding", "embeddings": "embedding",
    "kernel": "kernel", "filter": "kernel",
    "gradient": "gradient", "gradienten": "gradient",
    "loss": "loss", "fehler": "loss",
    "parameter": "parameter", "gewichte": "parameter", "weights": "parameter",
    "layer": "layer", "schicht": "layer", "schichten": "layer"
  };
  var GLOSSARY_EN = {
    matrix: {
      label: "Matrix",
      short: "A grid of numbers. Each row and column has a meaning.",
      long: "A matrix is a rectangular grid of numbers. A 3×3 matrix can be a small pixel patch; in a network a weight matrix is a learned map from one vector to another. The shape says what goes in and what comes out: a 3×3 matrix maps three numbers to three numbers."
    },
    vektor: {
      label: "Vector",
      short: "A list of numbers that describes a point or a direction.",
      long: "A vector is an ordered list of numbers. Read as a point, it says where something is; read as an arrow, it says where it points. A token becomes a vector because the model can only compute with numbers. Direction often matters more than length: two vectors can differ in length and still point the same way."
    },
    token: {
      label: "Token",
      short: "A piece of text that the model reads as a number.",
      long: "A token is a piece of text from a fixed vocabulary: a word, a word piece, a punctuation mark, or a byte. The model sees the token ID, not the letters. That is why it can build unseen words from known pieces, and why spelling is a reconstruction."
    },
    attention: {
      label: "Attention",
      short: "A mechanism that weights tokens and moves information between them.",
      long: "Attention lets every token read the others. A query and the keys produce scores; softmax turns them into weights that sum to one. The output is a weighted mix of the values. It is a finite budget: more for one token means less for the others."
    },
    softmax: {
      label: "Softmax",
      short: "Turns scores into a distribution that sums to one.",
      long: "Softmax exponentiates every score so all values become positive, then divides by the sum. The order is preserved, and the largest score gets the most mass. Shifting all scores by the same constant changes nothing, so the maximum is often subtracted first. The base e is a convention."
    },
    residual: {
      label: "Residual Stream",
      short: "A running vector that every layer writes an update into.",
      long: "The residual stream is a token's shared vector. Every layer reads it, computes an update, and adds it. Nothing is overwritten. That gives gradients a short path back and lets late layers still see the original signal."
    },
    embedding: {
      label: "Embedding",
      short: "A learned vector for a token.",
      long: "An embedding is a row in a learned table: token ID in, vector out. Words with similar contexts get similar vectors. The table is only the start; attention and the FFN rewrite the vector afterwards."
    },
    kernel: {
      label: "Kernel",
      short: "A small window of learned weights that slides over an image.",
      long: "A kernel is a small matrix, for example 3×3. At every image position the pixels under the window are multiplied by the kernel weights and summed. The same kernel is reused everywhere, so a pattern is learned once and recognised in many places."
    },
    gradient: {
      label: "Gradient",
      short: "The direction in which the loss rises most steeply.",
      long: "The gradient points uphill. The optimizer walks the other way to make the loss smaller. The learning rate decides how far it goes. In a deep network the gradient is computed backwards from the output to every parameter with the chain rule."
    },
    loss: {
      label: "Loss",
      short: "A number that says how wrong the model is.",
      long: "The loss turns a prediction into a learning signal. For a line it is often mean squared error; for a classifier, cross-entropy. The loss defines a surface: each parameter choice is a point, the height is the error."
    },
    parameter: {
      label: "Parameter",
      short: "A number the model may change during training.",
      long: "Parameters are the model's knobs: weights and biases. Training searches for values that lower the loss. A large model has billions of them; no single one means anything on its own, only their interplay creates the behaviour."
    },
    layer: {
      label: "Layer",
      short: "A stage that transforms the vector.",
      long: "A layer takes a vector, changes it, and passes it on. In a transformer a layer is attention, FFN, residual connection, and normalization. The structure repeats; each layer has its own learned weights."
    }
  };
  function glossary(id) {
    var g = GLOSSARY[id];
    if (!g) return null;
    if (LANG === "en" && GLOSSARY_EN[id]) {
      var e = GLOSSARY_EN[id];
      return { label: e.label, short: e.short, long: e.long, lesson: g.lesson, svg: g.svg };
    }
    return g;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function normSpace(s) { return String(s).replace(/\s+/g, " ").trim(); }
  function termId(raw) {
    var k = normSpace(raw).toLowerCase();
    return GLOSSARY_ALIASES[k] || k.replace(/[^a-z0-9]+/g, "-");
  }
  function termHTML(text) {
    return String(text).split(/(\[\[[^\]]+\]\])/g).map(function (part) {
      var m = part.match(/^\[\[([^\]]+)\]\]$/);
      if (!m) return esc(part);
      var id = termId(m[1]);
      var label = m[1];
      var g = glossary(id);
      if (!g) return esc(label);
      return '<span class="ls-term-wrap">' +
        '<button type="button" class="ls-term" data-term="' + esc(id) + '">' + esc(label) + '</button>' +
        '<span class="ls-term-note" hidden>' +
          '<span class="ls-term-def">' + esc(g.long) + '</span>' +
          '<span class="ls-term-visual">' + g.svg + '</span>' +
          '<a class="ls-term-link" href="' + esc(g.lesson) + '">' + esc(t("moreInLesson")) + '</a>' +
        '</span>' +
      '</span>';
    }).join("");
  }
  function proseBlock(text) { return '<p>' + termHTML(text) + '</p>'; }

  function activeDay() {
    return cfg.days[state.day] || cfg.days[0];
  }
  function activeStep() {
    var d = activeDay();
    return d.steps[clamp(state.step, 0, d.steps.length - 1)];
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        track: state.track, depth: state.depth, font: state.font, day: state.day, step: state.step
      }));
    } catch (e) {}
  }
  function load() {
    try {
      var p = JSON.parse(localStorage.getItem(KEY) || "{}");
      if (p.track) state.track = p.track;
      if (p.depth) state.depth = p.depth;
      state.font = normalizeFont(p.font);
      if (typeof p.day === "number") state.day = p.day;
      if (typeof p.step === "number") state.step = p.step;
    } catch (e) {}
  }

  function buildUI() {
    var tickTotal = 10;
    if (cfg.singleDay) {
      var sd = activeDay();
      var stepCount = sd ? sd.steps.length : 1;
      tickTotal = stepCount;
    }
    posCount = tickTotal;
    var posHtml = "";
    for (var pi = 0; pi < posCount; pi++) {
      var posLabel = t("positionOf", { n: pi, total: Math.max(1, posCount - 1) });
      posHtml += '<button type="button" data-pos="' + pi + '" title="' + esc(posLabel) + '" aria-label="' + esc(posLabel) + '">' + pi + '</button>';
    }
    var helpRows = [
      ['<kbd>←</kbd><kbd>→</kbd>', t("helpStep")],
      ['<kbd>Shift</kbd> + <kbd>←</kbd><kbd>→</kbd>', cfg.singleDay ? t("helpJump") : t("helpDay")],
      ['<kbd>0</kbd> … <kbd>9</kbd>', t("helpPos")],
      ['<kbd>Home</kbd> / <kbd>End</kbd>', t("helpHome")],
      ['<kbd>R</kbd>', t("helpMix")],
      ['<kbd>D</kbd>', t("helpDepth")],
      ['<kbd>↓</kbd>', t("helpDown")],
      ['<kbd>F</kbd>', t("helpFocus")],
      ['<kbd>+</kbd> / <kbd>−</kbd>', t("helpFont")],
      ['<kbd>?</kbd> / <kbd>Esc</kbd>', t("helpHelp")]
    ].map(function (row) {
      return '<span>' + row[0] + '</span><span>' + esc(row[1]) + '</span>';
    }).join("");
    root.innerHTML =
      '<div class="ls-app' + (cfg.mix ? ' ls-app--mix' : '') + '">' +
        '<header class="ls-top">' +
          '<div class="ls-top-head">' +
            '<div class="ls-now"><span class="ls-now-kicker" id="ls-now-kicker"></span><b class="ls-now-title" id="ls-now-title"></b></div>' +
            '<div class="ls-controls">' +
              '<label class="ls-field"><span>' + esc(t("path")) + '</span><select class="ls-select" id="ls-track"></select></label>' +
              '<div class="ls-field"><span>' + esc(t("depth")) + '</span><div class="ls-seg" id="ls-depth">' +
                '<button type="button" data-depth="short">' + esc(t("short")) + '</button>' +
                '<button type="button" data-depth="standard">' + esc(t("standard")) + '</button>' +
                '<button type="button" data-depth="deep">' + esc(t("deep")) + '</button>' +
              '</div></div>' +
              '<div class="ls-field ls-font" aria-label="' + esc(t("textSize")) + '"><span>' + esc(t("text")) + '</span><button type="button" class="ls-btn ls-btn--tiny" data-font-step="-1" id="ls-font-minus" aria-label="' + esc(t("textSmaller")) + '">A−</button><output id="ls-font-out" aria-live="polite">100%</output><button type="button" class="ls-btn ls-btn--tiny" data-font-step="1" id="ls-font-plus" aria-label="' + esc(t("textLarger")) + '">A+</button></div>' +
              '<button type="button" class="ls-btn ls-btn--ghost" id="ls-all">' + esc(t("all")) + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="ls-top-nav">' +
            '<div class="ls-day-row"><button type="button" class="ls-day-nav" data-day-nav="-1" aria-label="' + esc(t("prevDay")) + '" title="' + esc(t("prevDay")) + '">←<span class="ls-day-nav-word">' + esc(t("back")) + '</span></button><div class="ls-days" id="ls-days" role="tablist" aria-label="' + esc(t("days")) + '"></div><button type="button" class="ls-day-nav" data-day-nav="1" aria-label="' + esc(t("nextDay")) + '" title="' + esc(t("nextDay")) + '"><span class="ls-day-nav-word">' + esc(t("forward")) + '</span>→</button></div>' +
            '<div class="ls-progress"><div class="ls-progress-bar"><span id="ls-progress-fill"></span></div><div class="ls-step-row"><span class="ls-step-count" id="ls-step-count"></span><div class="ls-steps" id="ls-steps"></div></div></div>' +
          '</div>' +
        '</header>' +
        '<main class="ls-main">' +
          '<section class="ls-text" aria-live="polite">' +
            '<div class="ls-text-scroll">' +
              (cfg.mix ? '<div class="ls-navbar" id="ls-navbar"><button type="button" class="ls-btn ls-btn--tiny" id="ls-nav-prev" title="' + esc(t("prevStep")) + '" aria-label="' + esc(t("prevStep")) + '">←</button><div class="ls-nav-pos ls-mix-pos" id="ls-mix-pos" aria-label="' + esc(cfg.singleDay ? t("stepRail") : t("position") + " 0 … " + (posCount - 1)) + '">' + posHtml + '</div><button type="button" class="ls-btn ls-btn--tiny" id="ls-nav-next" title="' + esc(t("nextStep")) + '" aria-label="' + esc(t("nextStep")) + '">→</button></div>' : '') +
              '<div class="ls-kicker" id="ls-kicker"></div>' +
              '<h1 class="ls-title" id="ls-title"></h1>' +
              '<div class="ls-body" id="ls-body"></div>' +
              '<div class="ls-watch" id="ls-watch"></div>' +
              '<div class="ls-cues" id="ls-cues"></div>' +
              '<div class="ls-extras" id="ls-extras"></div>' +
              '<div class="ls-actions">' +
                '<button type="button" class="ls-btn" id="ls-prev" aria-label="' + esc(t("prevStep")) + '">←</button>' +
                '<button type="button" class="ls-btn ls-btn--primary" id="ls-next">' + esc(t("forward")) + ' →</button>' +
                '<button type="button" class="ls-btn ls-btn--ghost" id="ls-depth-btn">' + esc(t("depth")) + '</button>' +
              '</div>' +
            '</div>' +
          '</section>' +
          '<section class="ls-stage" id="ls-stage" aria-label="' + esc(t("interactiveDemo")) + '">' +
            '<div class="ls-stage-head"><span id="ls-stage-kicker"></span><b id="ls-stage-title"></b><button type="button" class="ls-btn ls-btn--tiny ls-focus-btn" id="ls-focus" aria-pressed="false">' + esc(t("demoLarge")) + '</button></div>' +
            '<div class="ls-demo" id="ls-demo"></div>' +
            '<div class="ls-stage-foot"><span id="ls-stage-hint"></span><span class="ls-credit" id="ls-credit"></span></div>' +
          '</section>' +
        '</main>' +
        '<div class="ls-tip" id="ls-tip" role="tooltip" hidden></div>' +
        '<div class="ls-help" id="ls-help" hidden><b>' + esc(t("helpTitle")) + '</b><div class="ls-help-grid">' + helpRows + '</div></div>' +
      '</div>';

    els.app = root.querySelector(".ls-app");
    els.textScroll = root.querySelector(".ls-text-scroll");
    els.track = root.querySelector("#ls-track");
    els.depth = root.querySelector("#ls-depth");
    els.all = root.querySelector("#ls-all");
    els.openDepth = root.querySelector("#ls-open-depth");
    els.nowKicker = root.querySelector("#ls-now-kicker");
    els.nowTitle = root.querySelector("#ls-now-title");
    els.stepCount = root.querySelector("#ls-step-count");
    els.mixPos = root.querySelectorAll("#ls-mix-pos [data-pos]");
    els.navPrev = root.querySelector("#ls-nav-prev");
    els.navNext = root.querySelector("#ls-nav-next");
    els.help = root.querySelector("#ls-help");
    els.fontOut = root.querySelector("#ls-font-out");
    els.fontMinus = root.querySelector("#ls-font-minus");
    els.fontPlus = root.querySelector("#ls-font-plus");
    els.focus = root.querySelector("#ls-focus");
    els.kicker = root.querySelector("#ls-kicker");
    els.title = root.querySelector("#ls-title");
    els.body = root.querySelector("#ls-body");
    els.watch = root.querySelector("#ls-watch");
    els.cues = root.querySelector("#ls-cues");
    els.extras = root.querySelector("#ls-extras");
    els.prev = root.querySelector("#ls-prev");
    els.next = root.querySelector("#ls-next");
    els.depthBtn = root.querySelector("#ls-depth-btn");
    els.stageKicker = root.querySelector("#ls-stage-kicker");
    els.stageTitle = root.querySelector("#ls-stage-title");
    els.demo = root.querySelector("#ls-demo");
    els.stageHint = root.querySelector("#ls-stage-hint");
    els.credit = root.querySelector("#ls-credit");
    els.days = root.querySelector("#ls-days");
    els.dayNav = root.querySelectorAll("[data-day-nav]");
    els.steps = root.querySelector("#ls-steps");
    els.progress = root.querySelector("#ls-progress-fill");
    els.tip = root.querySelector("#ls-tip");

    els.track.innerHTML = '<option value="all">' + esc(t("allPaths")) + '</option>' + cfg.tracks.map(function (tr) {
      return '<option value="' + esc(tr.id) + '">' + esc(tr.label) + ' · ' + esc(t("day")) + ' ' + esc(tr.days) + '</option>';
    }).join("");
    els.track.value = state.track;

  }

  function applyFont() {
    var f = FONT_LEVELS[state.font];
    els.app.setAttribute("data-font", f.id);
    els.app.style.setProperty("--ls-fs-body", f.body + "px");
    els.app.style.setProperty("--ls-fs-title", f.title + "px");
    els.app.style.setProperty("--ls-fs-small", f.small + "px");
    var pct = Math.round(f.body / FONT_LEVELS[1].body * 100);
    if (els.fontOut) els.fontOut.textContent = pct + "%";
    if (els.fontMinus) els.fontMinus.disabled = state.font <= FONT_MIN;
    if (els.fontPlus) els.fontPlus.disabled = state.font >= FONT_MAX;
  }
  function setFont(i) {
    state.font = normalizeFont(i);
    applyFont();
    save();
  }
  function toggleFocus() {
    hideTip();
    var on = els.app.classList.toggle("is-demo-focus");
    els.focus.setAttribute("aria-pressed", on ? "true" : "false");
    els.focus.textContent = on ? t("showText") : t("demoLarge");
    if (demo && demo.resize) setTimeout(function () { demo.resize(); }, 260);
  }
  function renderTop() {
    applyFont();
    els.track.value = state.track;
    els.depth.querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("is-on", b.getAttribute("data-depth") === state.depth);
    });
  }

  var lastCenteredDay = -1;
  function updateRailOverflow() {
    if (!els.days) return;
    els.days.classList.toggle("is-scrollable", els.days.scrollWidth > els.days.clientWidth + 1);
  }
  function centerActiveDay(force) {
    if (!els.days) return;
    var a = els.days.querySelector(".ls-day.is-on");
    if (!a) return;
    if (!force && lastCenteredDay === state.day) return;
    lastCenteredDay = state.day;
    var left = a.offsetLeft - (els.days.clientWidth - a.offsetWidth) / 2;
    els.days.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }
  function renderDays() {
    var all = cfg.days;
    els.dayNav.forEach(function (b) {
      var dir = parseInt(b.getAttribute("data-day-nav"), 10);
      b.disabled = all.length < 2 || (dir < 0 && state.day <= 0) || (dir > 0 && state.day >= all.length - 1);
    });
    if (!all.length) {
      els.days.innerHTML = '<div class="ls-empty">' + esc(t("noDays")) + '</div>';
      return;
    }
    els.days.innerHTML = all.map(function (d, i) {
      var on = i === state.day;
      var dim = state.track !== "all" && d.track !== state.track;
      var track = TRACK_LABEL[d.track] ? TRACK_LABEL[d.track].label : d.track;
      var cls = "ls-day" + (on ? " is-on" : "") + (dim ? " is-dim" : "") + (i > 0 && all[i - 1].track !== d.track ? " is-track-start" : "");
      return '<button type="button" class="' + cls + '" data-day="' + i + '" data-day-id="' + esc(d.id) + '" data-track="' + esc(d.track) + '" role="tab" aria-selected="' + on + '"' + (on ? ' aria-current="step"' : '') +
        ' aria-label="' + esc(track + ": " + d.label + " " + d.title) + '" title="' + esc(track + " · " + d.title) + '">' +
        '<span class="ls-day-num">' + esc(d.label) + '</span><span class="ls-day-name">' + esc(d.title) + '</span></button>';
    }).join("");
    requestAnimationFrame(function () { updateRailOverflow(); centerActiveDay(); });
  }
  function renderSteps() {
    var d = activeDay();
    els.steps.innerHTML = d.steps.map(function (s, i) {
      var stepLabel = t("step") + " " + (i + 1);
      return '<button type="button" class="ls-dot' + (i === state.step ? " is-on" : "") + '" data-step="' + i + '" aria-label="' + esc(stepLabel) + '">' + (i + 1) + '</button>';
    }).join("");
    els.progress.style.width = ((state.step + 1) / d.steps.length * 100).toFixed(1) + "%";
    if (els.stepCount) els.stepCount.textContent = t("stepOf", { n: state.step + 1, total: d.steps.length });
  }

  function mathBlock(tex, display) {
    return '<div class="ls-math" data-tex="' + esc(tex) + '" data-tex-display="' + (display === false ? "false" : "true") + '"><code class="ls-tex-source">' + esc(tex) + '</code></div>';
  }
  function depthTree(s, d) {
    var ctx = s.context || "";
    var ctxTex = s.contextTex || "";
    var deep = s.deep || "";
    var deepTex = s.deepTex || "";
    var boxes = (s.boxes || []).concat(state.step === 0 ? (d.boxes || []) : []);
    var sources = (s.sources || []).concat(state.step === 0 ? (d.sources || []) : []);
    var count = (ctx || ctxTex ? 1 : 0) + (deep || deepTex ? 1 : 0) + boxes.length + (sources.length ? 1 : 0);
    if (!count) return "";
    var rootOpen = state.depth === "standard" || state.depth === "deep" ? " open" : "";
    var firstOpen = state.depth === "deep" ? " open" : "";
    var contextQ = s.contextTitle || t("questionContext");
    var deepQ = s.deepTitle || t("questionDeep");
    var qItems = [];
    if (ctx || ctxTex) qItems.push({ id: "q-context", label: contextQ });
    if (deep || deepTex) qItems.push({ id: "q-deep", label: deepQ });
    boxes.forEach(function (b) {
      qItems.push({ id: "q-box-" + b.id, label: (b.lens ? b.lens + " · " : "") + (b.title || "Detail") });
    });
    var indexHtml = '<div class="ls-question-index" aria-label="' + esc(t("questionIndex")) + '">' +
      qItems.map(function (q) {
        return '<button type="button" data-qid="' + esc(q.id) + '">' + esc(q.label) + '</button>';
      }).join("") + '</div>';
    var html = '<div class="ls-depth-tree">' + indexHtml +
      '<details class="ls-deepbox ls-deepbox--root"' + rootOpen + '>' +
        '<summary>' + esc(t("deepDive")) + ' <span class="ls-depth-count">' + esc(t(count === 1 ? "depthQuestion" : "depthQuestions", { n: count })) + '</span></summary>';
    if (ctx || ctxTex) {
      html += '<details class="ls-deepbox" data-qid="q-context"' + firstOpen + '>' +
        '<summary>' + esc(contextQ) + '</summary>' +
        (ctx ? '<p>' + termHTML(ctx) + '</p>' : '') +
        (ctxTex ? mathBlock(ctxTex) : '') +
        '</details>';
    }
    if (deep || deepTex) {
      html += '<details class="ls-deepbox" data-qid="q-deep">' +
        '<summary>' + esc(deepQ) + '</summary>' +
        (deep ? '<p>' + termHTML(deep) + '</p>' : '') +
        (deepTex ? mathBlock(deepTex) : '') +
        '</details>';
    }
    boxes.forEach(function (b) {
      html += '<details class="ls-deepbox" data-qid="q-box-' + esc(b.id) + '">' +
        '<summary>' + esc(b.lens ? b.lens + " · " : "") + esc(b.title || "Detail") + '</summary>' +
        (b.body ? '<p>' + termHTML(b.body || "") + '</p>' : '') +
        (b.tex ? mathBlock(b.tex) : '') +
        '</details>';
    });
    if (sources.length) {
      html += '<details class="ls-deepbox"><summary>' + esc(t("sources")) + '</summary><ul class="ls-sources">' +
        sources.map(function (src) {
          return '<li><a href="' + esc(src.url) + '" target="_blank" rel="noopener">' + esc(src.label) + '</a></li>';
        }).join("") + '</ul></details>';
    }
    return html + '</details></div>';
  }
  function openDepth() {
    var wasDeep = state.depth === "deep";
    if (state.depth === "short") state.depth = "standard";
    else if (state.depth === "standard") state.depth = "deep";
    renderTop();
    renderText();
    var root = els.extras.querySelector(".ls-deepbox--root");
    if (root) root.open = true;
    var first = els.extras.querySelector(".ls-deepbox:not(.ls-deepbox--root)");
    if (first) first.open = true;
    if (wasDeep) {
      els.extras.querySelectorAll("details").forEach(function (d) { d.open = true; });
    }
    els.extras.scrollIntoView({ behavior: "smooth", block: "start" });
    save();
  }
  function openAllDepth() {
    state.depth = "deep";
    renderText();
    els.extras.querySelectorAll("details").forEach(function (d) { d.open = true; });
    els.extras.scrollIntoView({ behavior: "smooth", block: "start" });
    save();
  }
  function openNextClosedBox() {
    if (!els.extras) return false;
    var all = els.extras.querySelectorAll("details");
    var candidates = Array.prototype.filter.call(all, function (d) {
      if (d.open) return false;
      var p = d.parentElement;
      while (p) {
        if (p.tagName === "DETAILS" && !p.open) return false;
        p = p.parentElement;
      }
      return true;
    });
    if (!candidates.length) return false;
    var host = els.textScroll || els.extras;
    var hostTop = host.getBoundingClientRect().top;
    var next = candidates.filter(function (d) {
      return d.getBoundingClientRect().top > hostTop + 8;
    })[0] || candidates[0];
    next.open = true;
    next.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  function setupCues() {
    if (cueObserver) { cueObserver.disconnect(); cueObserver = null; }
    if (!("IntersectionObserver" in window) || !els.cues || els.cues.hidden || !cuesArmed) return;
    cueObserver = new IntersectionObserver(function (entries) {
      if (performance.now() < cueSuppressUntil) return;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var cue = null;
        try { cue = JSON.parse(el.getAttribute("data-cue") || "{}"); } catch (e) {}
        if (!cue) return;
        els.cues.querySelectorAll(".ls-cue").forEach(function (x) {
          x.classList.toggle("is-active", x === el);
        });
        if (demo && demo.update) demo.update(cue);
      });
    }, { root: els.textScroll, rootMargin: "-46% 0px -46% 0px", threshold: 0 });
    els.cues.querySelectorAll(".ls-cue").forEach(function (el) { cueObserver.observe(el); });
  }
  function renderCues(s) {
    if (cueObserver) { cueObserver.disconnect(); cueObserver = null; }
    var cues = (s && s.cues) || [];
    if (!els.cues) return;
    if (!cues.length) {
      els.cues.innerHTML = "";
      els.cues.hidden = true;
      return;
    }
    els.cues.hidden = false;
    var reset = JSON.stringify(s.demoState || {});
    els.cues.innerHTML = '<div class="ls-cue ls-cue--reset" data-cue="' + esc(reset) + '" aria-hidden="true"></div>' +
      cues.map(function (c) {
        return '<div class="ls-cue" role="button" tabindex="0" aria-label="' + esc(c.title || c.label || "") + '" data-cue="' + esc(JSON.stringify(c.state || {})) + '">' +
          '<div class="ls-cue-kicker">' + esc(c.label || t("depth")) + '</div>' +
          '<h3>' + esc(c.title || "") + '</h3>' +
          '<p>' + termHTML(c.text || "") + '</p>' +
        '</div>';
      }).join("");
    bindTerms(els.cues);
    els.cues.querySelectorAll(".ls-cue:not(.ls-cue--reset)").forEach(function (card) {
      function activate() {
        var cue = null;
        try { cue = JSON.parse(card.getAttribute("data-cue") || "{}"); } catch (e) {}
        if (!cue) return;
        els.cues.querySelectorAll(".ls-cue").forEach(function (x) { x.classList.toggle("is-active", x === card); });
        if (demo && demo.update) demo.update(cue);
        if (els.demo) els.demo.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      card.addEventListener("click", activate);
      card.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); activate(); }
      });
    });
    setupCues();
  }

  function typesetScope(scope) {
    if (!scope) return;
    if (cfg && typeof cfg.typeset === "function") {
      try { cfg.typeset(scope); } catch (e) {}
      return;
    }
    if (window.TM && typeof window.TM.typesetMath === "function") {
      try { window.TM.typesetMath(scope); } catch (e) {}
    }
  }
  function typesetText() { typesetScope(els.textScroll); }

  function renderText() {
    var d = activeDay();
    var s = activeStep();
    if (els.nowKicker) els.nowKicker.textContent = d.label + " · " + (TRACK_LABEL[d.track] ? TRACK_LABEL[d.track].label : d.track);
    if (els.nowTitle) els.nowTitle.textContent = d.title;
    updatePosRail();
    els.kicker.textContent = s.kicker || d.kicker;
    els.title.textContent = s.title;
    els.body.innerHTML = proseBlock(s.body || "");
    renderCues(s);
    var depth = depthTree(s, d);
    els.extras.innerHTML = depth;
    els.extras.hidden = !depth;
    els.watch.innerHTML = s.watch ? '<b>' + esc(t("watch")) + '</b> ' + termHTML(s.watch) : "";
    els.watch.hidden = !s.watch;
    bindTerms(els.body);
    bindTerms(els.watch);
    bindTerms(els.extras);
    var openBtn = els.extras.querySelector("[data-open-depth]");
    if (openBtn) openBtn.addEventListener("click", openDepth);
    els.extras.querySelectorAll(".ls-question-index button").forEach(function (b) {
      b.addEventListener("click", function () {
        var rootBox = els.extras.querySelector(".ls-deepbox--root");
        if (rootBox) rootBox.open = true;
        var target = els.extras.querySelector('[data-qid="' + b.getAttribute("data-qid") + '"]');
        if (!target) return;
        target.open = true;
        setTimeout(function () {
          var host = els.textScroll || els.extras;
          var top = target.getBoundingClientRect().top - host.getBoundingClientRect().top;
          host.scrollTo({ top: host.scrollTop + top - 12, behavior: "smooth" });
          try { target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); } catch (e) {}
        }, 40);
      });
    });
    typesetText();
  }

  function renderStage() {
    var d = activeDay();
    var s = activeStep();
    els.stageKicker.textContent = d.kicker;
    els.stageTitle.textContent = s.title;
    els.stageHint.textContent = s.watch || t("defaultHint");
    els.credit.textContent = d.credit || "";
    mountDemo(d, s);
  }

  function mountDemo(d, s) {
    if (morphHiddenEl) { morphHiddenEl.style.opacity = ""; morphHiddenEl = null; }
    if (demo && currentDemoDay === d.id) {
      if (demo.update) demo.update(s.demoState || {});
      return;
    }
    if (demo && demo.destroy) {
      try { demo.destroy(); } catch (e) {}
    }
    demo = null;
    currentDemoDay = d.id;
    els.demo.innerHTML = "";
    var fn = DEMOS[d.demo];
    if (!fn) {
      els.demo.innerHTML = '<div class="ls-empty">' + esc(t("demoNotFound")) + esc(d.demo) + '</div>';
      return;
    }
    demo = fn(els.demo, {
      lang: LANG,
      colors: colors,
      esc: esc,
      termHTML: termHTML,
      font: fontPx,
      fit: fitCanvas,
      fitPair: fitPair,
      typeset: typesetScope,
      motion: LS.motion,
      scene: LS.scene,
      util: LS.util,
      onHint: function (text) { els.stageHint.textContent = text; },
      go: go,
      goStep: function (step) { go(state.day, step); }
    });
    if (demo && demo.update) demo.update(s.demoState || {});
  }

  function renderAll() {
    hideTip();
    renderTop();
    renderDays();
    renderSteps();
    renderText();
    renderStage();
    save();
  }


  var morphRaf = 0;
  var morphOverlay = null;
  var morphHiddenEl = null;
  function copyCanvas(src) {
    var c = document.createElement("canvas");
    c.width = src.width;
    c.height = src.height;
    c.getContext("2d").drawImage(src, 0, 0);
    return c;
  }
  function sampleCanvas(canvas, target) {
    var w = canvas.width, h = canvas.height;
    var ctx = canvas.getContext("2d");
    var data;
    try { data = ctx.getImageData(0, 0, w, h).data; } catch (e) { return []; }
    var step = Math.max(6, Math.round(Math.sqrt((w * h) / (target || 1600))));
    var pts = [];
    for (var y = 0; y < h; y += step) {
      for (var x = 0; x < w; x += step) {
        var i = (y * w + x) * 4;
        var a = data[i + 3];
        if (a < 20) continue;
        var r = data[i], g = data[i + 1], b = data[i + 2];
        if (r > 248 && g > 248 && b > 248 && a > 220) continue;
        pts.push({ x: x, y: y, r: r, g: g, b: b, a: a / 255 });
      }
    }
    pts.sort(function (A, B) { return A.y - B.y || A.x - B.x; });
    return pts;
  }
  function runFlowMorph(oldCanvas, newCanvas, done) {
    if (morphRaf) cancelAnimationFrame(morphRaf);
    if (morphOverlay && morphOverlay.parentNode) morphOverlay.parentNode.removeChild(morphOverlay);
    if (morphHiddenEl) { morphHiddenEl.style.opacity = ""; morphHiddenEl = null; }
    var oldPts = sampleCanvas(oldCanvas, 1400);
    var newPts = sampleCanvas(newCanvas, 1400);
    if (!oldPts.length || !newPts.length) { done(); return; }
    var host = els.demo;
    var overlay = document.createElement("canvas");
    overlay.className = "ls-morph-overlay";
    overlay.width = newCanvas.width;
    overlay.height = newCanvas.height;
    host.appendChild(overlay);
    morphOverlay = overlay;
    var ctx = overlay.getContext("2d");
    var w = overlay.width, h = overlay.height;
    var cx = w / 2, cy = h / 2;
    function angle(p) { return Math.atan2(p.y - cy, p.x - cx); }
    function radius(p) { return Math.hypot(p.x - cx, p.y - cy); }
    oldPts.sort(function (a, b) { return angle(a) - angle(b) || radius(a) - radius(b); });
    newPts.sort(function (a, b) { return angle(a) - angle(b) || radius(a) - radius(b); });
    var N = Math.max(oldPts.length, newPts.length);
    var pairs = [];
    for (var i = 0; i < N; i++) {
      pairs.push({ a: oldPts[i % oldPts.length], b: newPts[i % newPts.length] });
    }
    var cols = 16, rows = 10;
    var gw = cols + 1, gh = rows + 1;
    var field = new Array(gw * gh);
    var sigma = Math.max(w, h) * 0.18;
    var inv = 1 / (2 * sigma * sigma);
    var maxD = Math.min(w, h) * 0.34;
    for (var gy = 0; gy < gh; gy++) {
      for (var gx = 0; gx < gw; gx++) {
        var vx = gx * w / cols, vy = gy * h / rows;
        var sum = 0, sx = 0, sy = 0;
        for (var k = 0; k < pairs.length; k++) {
          var p = pairs[k];
          var ddx = p.a.x - vx, ddy = p.a.y - vy;
          var wt = Math.exp(-(ddx * ddx + ddy * ddy) * inv);
          sx += (p.b.x - p.a.x) * wt;
          sy += (p.b.y - p.a.y) * wt;
          sum += wt;
        }
        var fx = sum ? sx / sum : 0;
        var fy = sum ? sy / sum : 0;
        var fl = Math.hypot(fx, fy);
        if (fl > maxD) { fx *= maxD / fl; fy *= maxD / fl; }
        field[gy * gw + gx] = { x: fx, y: fy };
      }
    }
    function drawWarp(src, alpha, k) {
      ctx.globalAlpha = alpha;
      var cw = w / cols, ch = h / rows;
      for (var j = 0; j < rows; j++) {
        for (var ii = 0; ii < cols; ii++) {
          var x0 = ii * cw, y0 = j * ch, x1 = x0 + cw, y1 = y0 + ch;
          var f00 = field[j * gw + ii];
          var f10 = field[j * gw + ii + 1];
          var f11 = field[(j + 1) * gw + ii + 1];
          var f01 = field[(j + 1) * gw + ii];
          var a = { x: x0 + k * f00.x, y: y0 + k * f00.y };
          var b = { x: x1 + k * f10.x, y: y0 + k * f10.y };
          var c = { x: x1 + k * f11.x, y: y1 + k * f11.y };
          var d = { x: x0 + k * f01.x, y: y1 + k * f01.y };
          var minX = Math.min(a.x, b.x, c.x, d.x) - 1;
          var minY = Math.min(a.y, b.y, c.y, d.y) - 1;
          var maxX = Math.max(a.x, b.x, c.x, d.x) + 1;
          var maxY = Math.max(a.y, b.y, c.y, d.y) + 1;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.lineTo(c.x, c.y);
          ctx.lineTo(d.x, d.y);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(src, x0, y0, cw + 1, ch + 1, minX, minY, maxX - minX, maxY - minY);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    }
    var t0 = performance.now();
    var dur = 180;
    function frame(now) {
      var t = clamp((now - t0) / dur, 0, 1);
      var e = ease(t);
      ctx.clearRect(0, 0, w, h);
      var glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.min(w, h) * 0.55);
      glow.addColorStop(0, "rgba(99,164,75," + (0.05 * Math.sin(Math.PI * e)).toFixed(3) + ")");
      glow.addColorStop(0.5, "rgba(18,117,172," + (0.032 * Math.sin(Math.PI * e)).toFixed(3) + ")");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      drawWarp(oldCanvas, 1 - e, e);
      drawWarp(newCanvas, e, 1 - e);
      ctx.globalAlpha = 1;
      if (t < 1) {
        morphRaf = requestAnimationFrame(frame);
      } else {
        morphRaf = 0;
        if (morphHiddenEl) { morphHiddenEl.style.opacity = ""; morphHiddenEl = null; }
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        morphOverlay = null;
        done();
      }
    }
    newCanvas.style.opacity = "0";
    morphHiddenEl = newCanvas;
    morphRaf = requestAnimationFrame(frame);
  }

  function dynamicCanvas() {
    return els.demo.querySelector(".ls-canvas--dynamic") || els.demo.querySelector(".ls-canvas");
  }
  function morphCanvasSwap(fn, done) {
    if (morphHiddenEl) { morphHiddenEl.style.opacity = ""; morphHiddenEl = null; }
    var oldCanvas = dynamicCanvas();
    var snap = oldCanvas ? copyCanvas(oldCanvas) : null;
    fn();
    var newCanvas = dynamicCanvas();
    if (snap && newCanvas) {
      runFlowMorph(snap, newCanvas, done);
    } else {
      done();
    }
  }

  function swap(fn, morph, canvasMorph) {
    if (canvasMorph) {
      morphCanvasSwap(fn, function () {});
      return;
    }
    fn();
  }
  function go(day, step) {
    hideTip();
    var oldDay = state.day;
    var oldStep = state.step;
    var oldDemo = cfg.days[oldDay] ? cfg.days[oldDay].demo : null;
    state.day = clamp(day, 0, cfg.days.length - 1);
    var d = cfg.days[state.day];
    if (state.track !== "all" && d.track !== state.track) state.track = d.track;
    state.step = clamp(step, 0, d.steps.length - 1);
    var dayChanged = oldDay !== state.day;
    var demoChanged = oldDemo !== d.demo;
    var stepChanged = oldStep !== state.step;
    var changed = dayChanged || demoChanged || stepChanged;
    var elementStep = stepChanged && !dayChanged && !demoChanged && ELEMENT_ANIM[d.demo];
    var canvasMorph = changed && CANVAS_DEMOS[oldDemo] && CANVAS_DEMOS[d.demo] && (dayChanged || demoChanged || FLOW_ON_STEP[d.demo]);
    if (els.textScroll) {
      cuesArmed = false;
      ignoreScroll = true;
      els.textScroll.scrollTop = 0;
      setTimeout(function () { ignoreScroll = false; }, 140);
    }
    cueSuppressUntil = performance.now() + 500;
    swap(renderAll, changed && !INTERNAL_MORPH[d.demo] && !elementStep, canvasMorph);
    if (dayChanged && els.app) {
      var dir = state.day > oldDay ? "next" : "prev";
      els.app.classList.remove("is-day-next", "is-day-prev");
      void els.app.offsetWidth;
      els.app.classList.add("is-day-" + dir);
      setTimeout(function () { els.app.classList.remove("is-day-next", "is-day-prev"); }, 260);
    }
  }
  function next() {
    var d = activeDay();
    if (state.step < d.steps.length - 1) go(state.day, state.step + 1);
    else {
      var list = cfg.days;
      var pos = list.indexOf(d);
      if (pos >= 0 && pos < list.length - 1) go(pos + 1, 0);
    }
  }
  function prev() {
    var d = activeDay();
    if (state.step > 0) go(state.day, state.step - 1);
    else {
      var list = cfg.days;
      var pos = list.indexOf(d);
      if (pos > 0) {
        var p = list[pos - 1];
        go(pos - 1, p.steps.length - 1);
      }
    }
  }

  function shuffle() {
    if (!cfg.days.length) return;
    if (cfg.singleDay) {
      var sd = activeDay();
      var pick = sd.steps.length > 1 ? Math.floor(Math.random() * sd.steps.length) : 0;
      if (pick === state.step) pick = (pick + 1) % sd.steps.length;
      go(state.day, pick);
      return;
    }
    var next = state.day;
    if (cfg.days.length > 1) {
      while (next === state.day) next = Math.floor(Math.random() * cfg.days.length);
    }
    go(next, 0);
  }
  function prevDay() {
    if (cfg.singleDay) {
      var sd = activeDay();
      go(state.day, clamp(state.step - 5, 0, sd.steps.length - 1));
      return;
    }
    if (state.day > 0) go(state.day - 1, 0);
  }
  function nextDay() {
    if (cfg.singleDay) {
      var sd = activeDay();
      go(state.day, clamp(state.step + 5, 0, sd.steps.length - 1));
      return;
    }
    if (state.day < cfg.days.length - 1) go(state.day + 1, 0);
  }
  function goPosition(n) {
    if (!cfg.days.length) return;
    n = Math.max(0, parseInt(n, 10) || 0);
    if (cfg.singleDay) {
      var d = activeDay();
      var lastStep = d.steps.length - 1;
      var step;
      if (n >= posCount) step = n;
      else if (posCount === d.steps.length) step = n;
      else step = posCount > 1 ? Math.round(n / (posCount - 1) * lastStep) : 0;
      go(state.day, clamp(step, 0, lastStep));
      return;
    }
    var last = cfg.days.length - 1;
    var day;
    if (n >= posCount) day = n;
    else day = posCount > 1 ? Math.round(n / (posCount - 1) * last) : 0;
    go(clamp(day, 0, last), 0);
  }
  function centerRail(rail, active) {
    if (!rail || !active) return;
    var railRect = rail.getBoundingClientRect();
    var activeRect = active.getBoundingClientRect();
    var target = rail.scrollLeft + activeRect.left - railRect.left - (rail.clientWidth - activeRect.width) / 2;
    rail.scrollLeft = Math.max(0, target);
  }
  function updatePosRail() {
    if (!els.mixPos || !els.mixPos.length) return;
    var total, pos;
    if (cfg.singleDay) {
      total = activeDay().steps.length;
      if (posCount === total) pos = state.step;
      else pos = total > 1 ? Math.round(state.step / (total - 1) * (posCount - 1)) : 0;
    } else {
      total = cfg.days.length;
      pos = total > 1 ? Math.round(state.day / (total - 1) * (posCount - 1)) : 0;
    }
    pos = clamp(pos, 0, posCount - 1);
    var active = null;
    var rail = els.mixPos[0] ? els.mixPos[0].parentNode : null;
    els.mixPos.forEach(function (b) {
      var on = parseInt(b.getAttribute("data-pos"), 10) === pos;
      b.classList.toggle("is-on", on);
      if (on) {
        b.setAttribute("aria-current", "step");
        active = b;
      } else b.removeAttribute("aria-current");
    });
    if (rail) {
      rail.classList.toggle("is-scrollable", rail.scrollWidth > rail.clientWidth + 1);
      if (active) {
        centerRail(rail, active);
        requestAnimationFrame(function () { centerRail(rail, active); });
      }
    }
  }
  function pressPositionDigit(digit) {
    posBuffer += String(digit);
    clearTimeout(posTimer);
    posTimer = setTimeout(function () { posBuffer = ""; }, 500);
    var n = parseInt(posBuffer, 10);
    if (!isFinite(n)) return;
    if (posBuffer.length === 1) {
      goPosition(n);
    } else {
      goPosition(n);
      posBuffer = "";
      clearTimeout(posTimer);
    }
  }
  function resetPositionBuffer() {
    posBuffer = "";
    clearTimeout(posTimer);
  }
  function toggleHelp(force) {
    if (!els.help) return;
    var show = typeof force === "boolean" ? force : els.help.hidden;
    els.help.hidden = !show;

  }
  function goDay(id) {
    var i = cfg.days.map(function (d) { return d.id; }).indexOf(id);
    if (i >= 0) go(i, 0);
    return i;
  }

  function setTrack(id) {
    hideTip();
    var oldDay = state.day;
    var oldDemo = cfg.days[oldDay] ? cfg.days[oldDay].demo : null;
    state.track = id;
    var list = id === "all" ? cfg.days : cfg.days.filter(function (d) { return d.track === id; });
    if (list.length && list.indexOf(cfg.days[state.day]) === -1) {
      state.day = cfg.days.indexOf(list[0]);
      state.step = 0;
    }
    var d = cfg.days[state.day];
    var changed = oldDay !== state.day || oldDemo !== (d ? d.demo : null);
    if (els.textScroll) {
      cuesArmed = false;
      ignoreScroll = true;
      els.textScroll.scrollTop = 0;
      setTimeout(function () { ignoreScroll = false; }, 140);
    }
    cueSuppressUntil = performance.now() + 500;
    swap(renderAll, changed, changed && CANVAS_DEMOS[oldDemo] && CANVAS_DEMOS[d ? d.demo : ""]);
    setTimeout(function () { centerActiveDay(true); }, 80);
  }
  function setDepth(d) {
    hideTip();
    state.depth = d;
    renderTop();
    renderText();
    save();
  }

  function bindTerms(scope) {
    scope.querySelectorAll(".ls-term").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("mouseenter", function () { showTip(btn); });
      btn.addEventListener("focus", function () { showTip(btn); });
      btn.addEventListener("mouseleave", function () { hideTipSoon(); });
      btn.addEventListener("blur", function () { hideTipSoon(); });
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        hideTip();
        var wrap = btn.parentNode;
        var note = wrap ? wrap.querySelector(".ls-term-note") : null;
        if (!note) return;
        note.hidden = !note.hidden;
        wrap.classList.toggle("is-open", !note.hidden);
      });
    });
  }

  function showTip(btn) {
    var id = btn.getAttribute("data-term");
    var g = glossary(id);
    if (!g) return;
    clearTimeout(tipTimer);
    tipTerm = btn;
    els.tip.innerHTML = '<div class="ls-tip-kicker">' + esc(g.label) + '</div><p>' + esc(g.short) + '</p><span class="ls-tip-more">' + esc(t("clickExample")) + '</span>';
    els.tip.hidden = false;
    var r = btn.getBoundingClientRect();
    var w = 300;
    var left = clamp(r.left + r.width / 2 - w / 2, 12, window.innerWidth - w - 12);
    var top = r.bottom + 8;
    if (top + 120 > window.innerHeight) top = r.top - 128;
    els.tip.style.width = w + "px";
    els.tip.style.left = left + "px";
    els.tip.style.top = top + "px";
  }
  function hideTipSoon() { tipTimer = setTimeout(hideTip, 140); }
  function hideTip() { if (els.tip) els.tip.hidden = true; tipTerm = null; }
  function openTermNote(btn) {
    if (!btn) return;
    var wrap = btn.parentNode;
    var note = wrap ? wrap.querySelector(".ls-term-note") : null;
    if (!note) return;
    note.hidden = false;
    wrap.classList.add("is-open");
    if (note.scrollIntoView) note.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function bindDayRail() {
    var el = els.days;
    if (!el || el.dataset.railBound) return;
    el.dataset.railBound = "1";
    var down = false, moved = false, startX = 0, startLeft = 0, pid = null;
    el.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      pid = e.pointerId;
      el.classList.add("is-dragging");
      try { el.setPointerCapture(pid); } catch (err) {}
    });
    el.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 5) moved = true;
      el.scrollLeft = startLeft - dx;
    });
    function endDrag() {
      if (!down) return;
      down = false;
      el.classList.remove("is-dragging");
      try {
        if (pid != null && el.hasPointerCapture(pid)) el.releasePointerCapture(pid);
      } catch (err) {}
      if (moved) {
        el.dataset.suppressClick = "1";
        setTimeout(function () { delete el.dataset.suppressClick; }, 0);
      }
    }
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("pointerleave", endDrag);
    el.addEventListener("click", function (e) {
      if (el.dataset.suppressClick) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    el.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (!e.deltaY) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }, { passive: false });
  }

  function bind() {
    bindDayRail();
    if (els.tip) {
      els.tip.addEventListener("mouseenter", function () { clearTimeout(tipTimer); });
      els.tip.addEventListener("mouseleave", hideTipSoon);
      els.tip.addEventListener("click", function () {
        var btn = tipTerm;
        hideTip();
        openTermNote(btn);
      });
    }
    els.track.addEventListener("change", function () { setTrack(els.track.value); });
    els.depth.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-depth]");
      if (b) setDepth(b.getAttribute("data-depth"));
    });
    els.all.addEventListener("click", function () {
      state.track = "all";
      state.depth = "deep";
      renderAll();
      openAllDepth();
    });
    if (els.openDepth) els.openDepth.addEventListener("click", openDepth);
    els.depthBtn.addEventListener("click", openDepth);
    if (els.navPrev) els.navPrev.addEventListener("click", prev);
    if (els.navNext) els.navNext.addEventListener("click", next);
    els.mixPos.forEach(function (b) {
      b.addEventListener("click", function () { goPosition(parseInt(b.getAttribute("data-pos"), 10)); });
    });
    if (els.fontMinus) els.fontMinus.addEventListener("click", function () { setFont(state.font - 1); });
    if (els.fontPlus) els.fontPlus.addEventListener("click", function () { setFont(state.font + 1); });
    if (els.focus) els.focus.addEventListener("click", toggleFocus);
    els.prev.addEventListener("click", prev);
    els.next.addEventListener("click", next);
    if (els.textScroll) {
      els.textScroll.addEventListener("scroll", function () {
        hideTip();
        if (ignoreScroll || cuesArmed) return;
        cuesArmed = true;
        setupCues();
      }, { passive: true });
      els.textScroll.addEventListener("wheel", function () {
        if (cuesArmed) return;
        cuesArmed = true;
        setupCues();
      }, { passive: true });
      els.textScroll.addEventListener("touchmove", function () {
        if (cuesArmed) return;
        cuesArmed = true;
        setupCues();
      }, { passive: true });
    }
    els.days.addEventListener("click", function (e) {
      var b = e.target.closest("[data-day]");
      if (b) go(parseInt(b.getAttribute("data-day"), 10), 0);
    });
    els.steps.addEventListener("click", function (e) {
      var b = e.target.closest("[data-step]");
      if (b) go(state.day, parseInt(b.getAttribute("data-step"), 10));
    });
    els.dayNav.forEach(function (b) {
      b.addEventListener("click", function () {
        var list = cfg.days;
        var pos = list.indexOf(activeDay());
        var next = pos + parseInt(b.getAttribute("data-day-nav"), 10);
        if (next >= 0 && next < list.length) go(next, 0);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { resetPositionBuffer(); hideTip(); toggleHelp(false); return; }
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (/^[0-9]$/.test(e.key) && !e.altKey) { e.preventDefault(); pressPositionDigit(e.key); return; }
      resetPositionBuffer();
      if (demo && demo.onKey && demo.onKey(e)) { e.preventDefault(); return; }
      if (e.key === "?" || e.key === "h" || e.key === "H") { e.preventDefault(); toggleHelp(); return; }
      if (e.shiftKey && e.key === "ArrowRight") { e.preventDefault(); nextDay(); return; }
      if (e.shiftKey && e.key === "ArrowLeft") { e.preventDefault(); prevDay(); return; }
      if (e.key === "PageDown") { e.preventDefault(); nextDay(); return; }
      if (e.key === "PageUp") { e.preventDefault(); prevDay(); return; }
      if (e.key === "ArrowDown" && openNextClosedBox()) { e.preventDefault(); return; }
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "Home") { e.preventDefault(); go(0, 0); }
      else if (e.key === "End") {
        e.preventDefault();
        var endDay = cfg.singleDay ? activeDay() : cfg.days[cfg.days.length - 1];
        go(cfg.singleDay ? state.day : cfg.days.length - 1, (endDay && endDay.steps.length ? endDay.steps.length - 1 : 0));
      }
      else if (e.key === "r" || e.key === "R") { e.preventDefault(); shuffle(); }
      else if (e.key === "f" || e.key === "F") { e.preventDefault(); toggleFocus(); }
      else if (e.key === "d" || e.key === "D") { e.preventDefault(); openDepth(); }
      else if (e.altKey && e.key === "0") { e.preventDefault(); setFont(1); }
      else if (e.key === "+" || e.key === "=") { e.preventDefault(); setFont(state.font + 1); }
      else if (e.key === "-") { e.preventDefault(); setFont(state.font - 1); }
    });
    window.addEventListener("resize", function () {
      hideTip();
      if (demo && demo.resize) demo.resize();
      lastCenteredDay = -1;
      requestAnimationFrame(function () { updateRailOverflow(); centerActiveDay(true); });
    });
  }

  function colors() {
    var css = getComputedStyle(document.documentElement);
    function v(n, f) { var x = css.getPropertyValue(n); return (x || f).trim(); }
    return {
      ink: v("--tm-ink", "#000"),
      soft: v("--tm-ink-soft", "#2c464d"),
      muted: v("--tm-muted", "#627476"),
      line: v("--tm-line", "#dbe3e0"),
      lineStrong: v("--tm-line-strong", "#b9c8c3"),
      paper: v("--tm-paper", "#fff"),
      paper2: v("--tm-paper-2", "#f7f9f8"),
      petrol: v("--tm-petrol", "#004b6f"),
      blue: v("--tm-blue", "#1275ac"),
      green: v("--tm-green", "#63a44b"),
      lime: v("--tm-lime", "#869b55"),
      gold: v("--tm-gold", "#9f9700"),
      lilac: v("--tm-coral", "#9185be"),
      sky: v("--tm-sky", "#5c9baf")
    };
  }

  function fitCanvas(canvas, host) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var r = (host || canvas).getBoundingClientRect();
    var w = Math.max(320, Math.round(r.width));
    var h = Math.max(240, Math.round(r.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h, ctx: ctx };
  }
  function fitPair(wrap, a, b) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var r = wrap.getBoundingClientRect();
    var w = Math.max(320, Math.round(r.width));
    var h = Math.max(240, Math.round(r.height));
    a.width = Math.round(w * dpr);
    a.height = Math.round(h * dpr);
    b.width = Math.round(w * dpr);
    b.height = Math.round(h * dpr);
    var ca = a.getContext("2d");
    var cb = b.getContext("2d");
    ca.setTransform(dpr, 0, 0, dpr, 0, 0);
    cb.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h, a: ca, b: cb };
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function arrow(ctx, x1, y1, x2, y2, color, width) {
    var a = Math.atan2(y2 - y1, x2 - x1);
    var head = 7;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width || 1.4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(a - 0.42), y2 - head * Math.sin(a - 0.42));
    ctx.lineTo(x2 - head * Math.cos(a + 0.42), y2 - head * Math.sin(a + 0.42));
    ctx.closePath();
    ctx.fill();
  }
  function chipRow(root, items, active, onPick) {
    var row = document.createElement("div");
    row.className = "ls-chips";
    items.forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-chip" + (it.id === active ? " is-on" : "");
      b.textContent = it.label;
      b.addEventListener("click", function () {
        row.querySelectorAll(".ls-chip").forEach(function (x) { x.classList.remove("is-on"); });
        b.classList.add("is-on");
        onPick(it.id);
      });
      row.appendChild(b);
    });
    root.appendChild(row);
    return row;
  }

  function demoAttention(root, api) {
    root.innerHTML = '<div class="ls-att"><canvas class="ls-canvas"></canvas><div class="ls-att-ui"></div></div>';
    var canvas = root.querySelector(".ls-canvas");
    var ui = root.querySelector(".ls-att-ui");
    var C = api.colors();
    var TOKENS = ["Maria", "told", "the", "bank", "that", "she", "would", "repay", "the", "loan"];
    var HEADS = {
      coreference: { label: "Koreferenz", row: [0.60, 0.04, 0.02, 0.08, 0.01, 0.14, 0.02, 0.02, 0.03, 0.04] },
      syntax: { label: "Syntax", row: [0.10, 0.18, 0.12, 0.05, 0.18, 0.10, 0.10, 0.12, 0.03, 0.02] },
      meaning: { label: "Bedeutung", row: [0.05, 0.03, 0.05, 0.30, 0.02, 0.06, 0.03, 0.02, 0.19, 0.25] }
    };
    var st = { query: 5, head: "coreference", showArcs: true, showBudget: true };
    var curRow = null, fromRow = null, toRow = null, animT = 1, animStart = 0;
    var arcMix = 1, arcTarget = 1, budgetMix = 1, budgetTarget = 1;
    var hover = -1, phase = 0, raf = 0, last = 0, size = null;
    var uiChips = chipRow(ui, [
      { id: "coreference", label: "Koreferenz" },
      { id: "syntax", label: "Syntax" },
      { id: "meaning", label: "Bedeutung" }
    ], st.head, function (id) { st.head = id; setTarget(); });

    function rowFor(q) {
      if (q === 5) return HEADS[st.head].row.slice();
      var row = TOKENS.map(function () { return 0.03; });
      row[q] += 0.32;
      if (q > 0) row[q - 1] += 0.16;
      if (q < TOKENS.length - 1) row[q + 1] += 0.10;
      var sum = row.reduce(function (a, b) { return a + b; }, 0);
      return row.map(function (v) { return v / sum; });
    }
    function tokenAt(x, y, w, h) {
      var compact = w < 620;
      if (compact) {
        var iy = 54 + hover * 36;
        return (y > 36 && y < 36 + TOKENS.length * 36) ? Math.floor((y - 36) / 36) : -1;
      }
      var gap = Math.min(94, (w - 70) / TOKENS.length);
      var start = (w - gap * TOKENS.length) / 2 + gap / 2;
      var ty = h * 0.22;
      if (y < ty - 26 || y > ty + 26) return -1;
      var idx = Math.round((x - start) / gap);
      return (idx >= 0 && idx < TOKENS.length) ? idx : -1;
    }
    function setTarget() {
      fromRow = curRow ? curRow.slice() : rowFor(st.query);
      toRow = rowFor(st.query);
      animT = 0;
      animStart = performance.now();
      arcTarget = st.showArcs ? 1 : 0;
      budgetTarget = st.showBudget ? 1 : 0;
    }
    function draw() {
      if (!size) size = fitCanvas(canvas, canvas);
      var w = size.w, h = size.h, ctx = size.ctx;
      ctx.clearRect(0, 0, w, h);

      var compact = w < 620;
      if (!curRow) { curRow = rowFor(st.query); fromRow = curRow.slice(); toRow = curRow.slice(); }
      var row = curRow;
      var maxJ = row.indexOf(Math.max.apply(null, row));
      ctx.fillStyle = C.muted;
      ctx.font = '600 11px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("QUERY: " + TOKENS[st.query].toUpperCase(), 24, 26);
      ctx.textAlign = "right";
      ctx.fillText(HEADS[st.head].label.toUpperCase() + " · Σ = 1.00", w - 24, 26);

      if (compact) {
        var x0 = 24, x1 = w - 24;
        for (var i = 0; i < TOKENS.length; i++) {
          var yy = 48 + i * 36;
          var active = i === st.query;
          ctx.fillStyle = active ? C.green : (hover === i ? C.blue : C.paper2);
          ctx.strokeStyle = active ? C.green : C.line;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.rect(x0, yy - 15, 130, 26);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = active ? "#fff" : C.ink;
          ctx.font = '600 12px "Open Sans", sans-serif';
          ctx.textAlign = "left";
          ctx.fillText(TOKENS[i], x0 + 8, yy + 3);
          var bw = (x1 - x0 - 160) * row[i];
          ctx.fillStyle = active ? C.green : C.blue;
          ctx.globalAlpha = 0.7;
          ctx.fillRect(x0 + 145, yy - 8, bw, 12);
          ctx.globalAlpha = 1;
          ctx.fillStyle = C.muted;
          ctx.font = '10px "Open Sans", sans-serif';
          ctx.textAlign = "right";
          ctx.fillText(Math.round(row[i] * 100) + "%", x1, yy + 3);
        }
        return;
      }

      var gap = Math.min(94, (w - 70) / TOKENS.length);
      var start = (w - gap * TOKENS.length) / 2 + gap / 2;
      var ty = h * 0.22;
      var xs = [];
      ctx.textAlign = "center";
      for (var t = 0; t < TOKENS.length; t++) {
        xs.push(start + t * gap);
        var tw = ctx.measureText(TOKENS[t]).width;
        ctx.font = '600 13px "Open Sans", sans-serif';
        tw = ctx.measureText(TOKENS[t]).width;
        var pw = Math.max(44, tw + 18);
        var activeT = t === st.query;
        ctx.fillStyle = activeT ? C.green : (hover === t ? C.blue : C.paper);
        ctx.strokeStyle = activeT ? C.green : C.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(xs[t] - pw / 2, ty - 14, pw, 28);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = activeT ? "#fff" : C.ink;
        ctx.font = '600 13px "Open Sans", sans-serif';
        ctx.fillText(TOKENS[t], xs[t], ty + 4);
        if (activeT) {
          ctx.beginPath();
          ctx.arc(xs[t], ty, 24 + 3 * Math.sin(phase), 0, Math.PI * 2);
          ctx.strokeStyle = C.green;
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      if (arcMix > 0.01) {
        for (var j = 0; j < TOKENS.length; j++) {
          var wj = row[j];
          if (wj < 0.012 || j === st.query) continue;
          var x1 = xs[st.query], x2 = xs[j];
          var mid = (x1 + x2) / 2;
          var ctrlY = ty - 46 - 130 * wj;
          ctx.beginPath();
          ctx.moveTo(x1, ty + 16);
          ctx.quadraticCurveTo(mid, ctrlY, x2, ty + 16);
          ctx.strokeStyle = C.blue;
          ctx.globalAlpha = 0.07 * arcMix;
          ctx.lineWidth = 1.8 + 9 * wj + 7;
          ctx.stroke();
          ctx.globalAlpha = (0.14 + 0.86 * wj) * arcMix;
          ctx.lineWidth = 0.8 + 9 * wj;
          ctx.stroke();
          ctx.globalAlpha = 1;
          if (wj >= 0.12) {
            ctx.fillStyle = C.blue;
            ctx.globalAlpha = arcMix;
            ctx.font = '600 10px "Open Sans", sans-serif';
            ctx.textAlign = "center";
            ctx.fillText(Math.round(wj * 100) + "%", mid, ctrlY + 10);
            ctx.globalAlpha = 1;
          }
        }
      }

      if (budgetMix > 0.01) {
        ctx.globalAlpha = budgetMix;
        var bx = 24, by = h - 58, bw = w - 48, bh = 18;
        ctx.fillStyle = C.paper2;
        ctx.fillRect(bx, by, bw, bh);
        var cursor = bx;
        var palette = [C.green, C.sky, C.gold, C.lilac, C.lime, C.blue, C.petrol];
        for (var k = 0; k < TOKENS.length; k++) {
          var sw = bw * row[k];
          ctx.fillStyle = palette[k % palette.length];
          ctx.globalAlpha = budgetMix * (k === st.query ? 1 : 0.78);
          ctx.fillRect(cursor, by, Math.max(0, sw - 1), bh);
          ctx.globalAlpha = budgetMix;
          cursor += sw;
        }
        ctx.strokeStyle = C.petrol;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = C.muted;
        ctx.font = '600 10px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText("Ein Head, ein Budget: jede Zeile summiert zu 1.00", bx, by - 8);
        ctx.textAlign = "right";
        ctx.fillText("1.00", bx + bw, by - 8);
        ctx.globalAlpha = 1;
      }
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (now - last < 45) return;
      last = now;
      phase += 0.06;
      var changed = false;
      if (animT < 1) {
        animT = clamp((now - animStart) / 300, 0, 1);
        var ae = ease(animT);
        for (var ai = 0; ai < curRow.length; ai++) curRow[ai] = lerp(fromRow[ai], toRow[ai], ae);
        changed = true;
      }
      if (Math.abs(arcMix - arcTarget) > 0.005) { arcMix += (arcTarget - arcMix) * 0.16; changed = true; }
      if (Math.abs(budgetMix - budgetTarget) > 0.005) { budgetMix += (budgetTarget - budgetMix) * 0.16; changed = true; }
      if (changed) draw();
    }
    function onMove(e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var idx = tokenAt(x, y, r.width, r.height);
      if (idx !== hover) { hover = idx; canvas.style.cursor = idx >= 0 ? "pointer" : "default"; draw(); }
    }
    function onClick(e) {
      var r = canvas.getBoundingClientRect();
      var idx = tokenAt(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
      if (idx >= 0) { st.query = idx; setTarget(); }
    }
    function resize() { size = fitCanvas(canvas, canvas); draw(); }
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", function () { hover = -1; draw(); });
    canvas.addEventListener("click", onClick);
    window.addEventListener("resize", resize);
    uiChips = uiChips;
    resize();
    raf = requestAnimationFrame(loop);
    return {
      update: function (s) {
        if (s && typeof s.query === "number") st.query = s.query;
        if (s && s.head) st.head = s.head;
        if (s && typeof s.showArcs === "boolean") st.showArcs = s.showArcs;
        if (s && typeof s.showBudget === "boolean") st.showBudget = s.showBudget;
        ui.querySelectorAll(".ls-chip").forEach(function (b, i) {
          b.classList.toggle("is-on", ["coreference", "syntax", "meaning"][i] === st.head);
        });
        if (!curRow) { curRow = rowFor(st.query); fromRow = curRow.slice(); toRow = curRow.slice(); }
        setTarget();
      },
      resize: resize,
      destroy: function () {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
      }
    };
  }
  function demoEmbedding(root, api) {
    root.innerHTML = '<div class="ls-embed"><canvas class="ls-canvas"></canvas><div class="ls-embed-ui"></div></div>';
    var canvas = root.querySelector(".ls-canvas");
    var ui = root.querySelector(".ls-embed-ui");
    var C = api.colors();
    var WORDS = {
      freezing: { t: -1.00, x: -0.92, y: -0.10, z: -0.25, label: "Gefrieren", g: "temp", temp: 1 },
      cold:     { t: -0.50, x: -0.60, y: 0.16, z: 0.05, label: "Kalt", g: "temp", temp: 1 },
      lukewarm: { t: 0.00, x: -0.12, y: 0.38, z: 0.25, label: "Lauwarm", g: "temp", temp: 1 },
      warm:     { t: 0.50, x: 0.34, y: 0.22, z: 0.48, label: "Warm", g: "temp", temp: 1 },
      hot:      { t: 1.00, x: 0.84, y: -0.08, z: 0.72, label: "Heiß", g: "temp", temp: 1 },
      man:      { t: -0.30, x: -0.46, y: 0.58, z: 0.18, label: "Mann", g: "gender" },
      woman:    { t: 0.30, x: 0.04, y: 0.58, z: 0.40, label: "Frau", g: "gender" },
      king:     { t: -0.20, x: -0.20, y: 0.84, z: 0.62, label: "König", g: "royal" },
      queen:    { t: 0.40, x: 0.36, y: 0.84, z: 0.82, label: "Königin", g: "royal" },
      paris:    { t: 0.62, x: 0.60, y: -0.52, z: 0.30, label: "Paris", g: "capital" },
      france:   { t: 0.22, x: 0.24, y: -0.72, z: 0.52, label: "Frankreich", g: "capital" },
      germany:  { t: 0.72, x: 0.86, y: -0.72, z: 0.62, label: "Deutschland", g: "capital" },
      berlin:   { t: 0.92, x: 1.00, y: -0.52, z: 0.82, label: "Berlin", g: "capital" },
      puppy:    { t: 0.10, x: 0.20, y: 0.00, z: -0.52, label: "Welpe", g: "animal" },
      dog:      { t: 0.50, x: 0.50, y: -0.10, z: -0.30, label: "Hund", g: "animal" },
      cat:      { t: 0.66, x: 0.76, y: 0.00, z: -0.10, label: "Katze", g: "animal" },
      bank:     { t: -0.62, x: -0.70, y: -0.46, z: -0.42, label: "Bank", g: "context" },
      bankRiver:{ t: -0.86, x: -0.92, y: -0.62, z: -0.58, label: "Ufer", g: "context", ghost: 1 },
      bankMoney:{ t: -0.38, x: -0.48, y: -0.24, z: -0.22, label: "Geld", g: "context", ghost: 1 }
    };
    var PAIRS = [
      ["man", "woman", "gender"], ["king", "queen", "gender"],
      ["france", "paris", "capital"], ["germany", "berlin", "capital"],
      ["puppy", "dog", "animal"]
    ];
    var GROUP = { temp: C.green, gender: C.blue, royal: C.petrol, capital: C.gold, animal: C.lilac, context: C.sky };
    var st = { dim: 0, target: 0, mode: "line", selected: "king" };
    var mix = 0, dragYaw = 0, dragPitch = 0, dragging = false, lx = 0, ly = 0;
    var hover = null, raf = 0, last = 0, size = null, phase = 0;
    var uiChips = chipRow(ui, [
      { id: "0", label: "1D" },
      { id: "1", label: "2D" },
      { id: "2", label: "3D" }
    ], "0", function (id) {
      st.target = parseInt(id, 10);
      st.dim = st.target;
      if (api.onHint) {
        var mode = st.target < 0.5 ? "1D · Linie" : (st.target < 1.5 ? "2D · Ebene" : "3D · Raum");
        api.onHint(mode + " · klicke 1D / 2D / 3D oder drehe den Raum");
      }
    });

    function coords(w) {
      var x = lerp(w.t, w.x, clamp(mix, 0, 1));
      var y = lerp(0, w.y, clamp(mix, 0, 1));
      var z = lerp(0, w.z, clamp(mix - 1, 0, 1));
      return { x: x, y: y, z: z };
    }
    function project(w, wpx, hpx) {
      var c = coords(w);
      var tilt = clamp(mix - 1, 0, 1);
      var yaw = 0.52 + dragYaw;
      var pitch = 0.12 + 0.72 * tilt + dragPitch;
      var x1 = c.x * Math.cos(yaw) - c.y * Math.sin(yaw);
      var y1 = c.x * Math.sin(yaw) + c.y * Math.cos(yaw);
      var y2 = y1 * Math.cos(pitch) - c.z * Math.sin(pitch) * tilt;
      var z2 = y1 * Math.sin(pitch) + c.z * Math.cos(pitch) * tilt;
      var s = Math.min(wpx, hpx) * 0.31 / (1 + z2 * 0.22);
      return { X: wpx * 0.5 + x1 * s, Y: hpx * 0.53 - y2 * s, Z: z2, S: s, c: c };
    }
    function nearest(x, y, w, h) {
      var best = null, bd = 24;
      Object.keys(WORDS).forEach(function (k) {
        var d = WORDS[k];
        if (d.ghost && mix < 1.4) return;
        var p = project(d, w, h);
        var dd = Math.hypot(p.X - x, p.Y - y);
        if (dd < bd) { bd = dd; best = k; }
      });
      return best;
    }
    function draw() {
      if (!size) size = fitCanvas(canvas, canvas);
      var w = size.w, h = size.h, ctx = size.ctx;
      ctx.clearRect(0, 0, w, h);

      var halo = ctx.createRadialGradient(w * 0.54, h * 0.49, 10, w * 0.54, h * 0.49, Math.min(w, h) * 0.62);
      halo.addColorStop(0, "rgba(99,164,75,.055)");
      halo.addColorStop(0.45, "rgba(18,117,172,.035)");
      halo.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      var tilt = clamp(mix - 1, 0, 1);
      var planeAlpha = clamp((mix - 0.3) / 0.5, 0, 1) * (1 - tilt) * 0.38;
      if (planeAlpha > 0.004) {
        ctx.save();
        ctx.globalAlpha = planeAlpha;
        ctx.strokeStyle = C.petrol;
        ctx.lineWidth = 1;
        for (var g = -1; g <= 1; g += 0.5) {
          var a = project({ t: g, x: g, y: -1.1, z: 0 }, w, h);
          var b = project({ t: g, x: g, y: 1.1, z: 0 }, w, h);
          ctx.beginPath(); ctx.moveTo(a.X, a.Y); ctx.lineTo(b.X, b.Y); ctx.stroke();
          var c1 = project({ t: g, x: -1.1, y: g, z: 0 }, w, h);
          var c2 = project({ t: g, x: 1.1, y: g, z: 0 }, w, h);
          ctx.beginPath(); ctx.moveTo(c1.X, c1.Y); ctx.lineTo(c2.X, c2.Y); ctx.stroke();
        }
        ctx.restore();
      }
      var cubeAlpha = tilt * 0.30;
      if (cubeAlpha > 0.004) {
        function line3(ax, ay, az, bx, by, bz) {
          var p1 = project({ t: ax, x: ax, y: ay, z: az }, w, h);
          var p2 = project({ t: bx, x: bx, y: by, z: bz }, w, h);
          ctx.beginPath(); ctx.moveTo(p1.X, p1.Y); ctx.lineTo(p2.X, p2.Y); ctx.stroke();
        }
        ctx.save();
        ctx.globalAlpha = cubeAlpha;
        ctx.strokeStyle = C.petrol;
        ctx.lineWidth = 0.9;
        for (var q = -1; q <= 1; q += 0.5) {
          line3(-1.1, q, -1.1, 1.1, q, -1.1);
          line3(q, -1.1, -1.1, q, 1.1, -1.1);
          line3(-1.1, 1.1, q, 1.1, 1.1, q);
          line3(-1.1, q, -1.1, -1.1, q, 1.1);
          line3(-1.1, -1.1, q, -1.1, 1.1, q);
        }
        ctx.globalAlpha = Math.min(0.72, cubeAlpha * 2.2);
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 1.3;
        line3(0, 0, 0, 1.35, 0, 0);
        line3(0, 0, 0, 0, 1.35, 0);
        line3(0, 0, 0, 0, 0, 1.35);
        ctx.fillStyle = C.muted;
        ctx.font = '700 10px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        var ax = project({ t: 1.42, x: 1.42, y: 0, z: 0 }, w, h);
        var ay = project({ t: 0, x: 0, y: 1.42, z: 0 }, w, h);
        var az = project({ t: 0, x: 0, y: 0, z: 1.42 }, w, h);
        ctx.fillText("x", ax.X + 3, ax.Y + 3);
        ctx.fillText("y", ay.X + 3, ay.Y + 3);
        ctx.fillText("z", az.X + 3, az.Y + 3);
        ctx.restore();
      }

      if (mix < 0.55) {
        var l0 = project({ t: -1.15, x: -1.15, y: 0, z: 0 }, w, h);
        var l1 = project({ t: 1.15, x: 1.15, y: 0, z: 0 }, w, h);
        ctx.strokeStyle = C.petrol;
        ctx.globalAlpha = (1 - mix / 0.55) * 0.5;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(l0.X, l0.Y); ctx.lineTo(l1.X, l1.Y); ctx.stroke();
        ctx.globalAlpha = 1;
        [-1, 0, 1].forEach(function (t) {
          var p = project({ t: t, x: t, y: 0, z: 0 }, w, h);
          ctx.beginPath(); ctx.arc(p.X, p.Y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = C.petrol; ctx.fill();
          ctx.fillStyle = C.muted;
          ctx.font = '600 9px "Open Sans", sans-serif';
          ctx.textAlign = "center";
          ctx.fillText(t > 0 ? "+1" : String(t), p.X, p.Y + 18);
        });
      }

      if (st.mode === "arrows" && mix > 0.7) {
        PAIRS.forEach(function (p) {
          var A = WORDS[p[0]], B = WORDS[p[1]];
          if (!A || !B) return;
          var a = project(A, w, h), b = project(B, w, h);
          ctx.globalAlpha = 0.18 + 0.35 * clamp((mix - 0.7) / 0.6, 0, 1);
          arrow(ctx, a.X, a.Y, b.X, b.Y, GROUP[p[2]] || C.blue, 1.3);
          ctx.globalAlpha = 1;
        });
      }
      if (st.mode === "context" && mix > 0.7) {
        var bank = WORDS.bank, r = WORDS.bankRiver, m = WORDS.bankMoney;
        var pb = project(bank, w, h), pr = project(r, w, h), pm = project(m, w, h);
        ctx.globalAlpha = 0.55;
        ctx.setLineDash([4, 4]);
        arrow(ctx, pb.X, pb.Y, pr.X, pr.Y, C.sky, 1.1);
        arrow(ctx, pb.X, pb.Y, pm.X, pm.Y, C.gold, 1.1);
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
      if (st.mode === "neighbors" && mix > 0.6 && WORDS[st.selected]) {
        var sel = WORDS[st.selected];
        var ps = project(sel, w, h);
        var others = Object.keys(WORDS).filter(function (k) { return k !== st.selected && !WORDS[k].ghost; }).map(function (k) {
          var p = WORDS[k];
          return { k: k, d: Math.hypot(p.x - sel.x, p.y - sel.y, (p.z || 0) - (sel.z || 0)) };
        }).sort(function (a, b) { return a.d - b.d; }).slice(0, 3);
        others.forEach(function (o) {
          var pp = project(WORDS[o.k], w, h);
          ctx.beginPath(); ctx.moveTo(ps.X, ps.Y); ctx.lineTo(pp.X, pp.Y);
          ctx.strokeStyle = C.blue;
          ctx.globalAlpha = 0.28;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.globalAlpha = 1;
        });
      }

      var keys = Object.keys(WORDS).filter(function (k) {
        var d = WORDS[k];
        if (d.ghost && mix < 1.4) return false;
        if (d.temp) return true;
        return mix > 0.25;
      }).sort(function (a, b) { return project(WORDS[a], w, h).Z - project(WORDS[b], w, h).Z; });
      keys.forEach(function (k, idx) {
        var d = WORDS[k];
        var p = project(d, w, h);
        var isSel = k === st.selected;
        var isHover = k === hover;
        var col = GROUP[d.g] || C.petrol;
        var alpha = d.temp ? 1 : clamp((mix - 0.25) / 0.55, 0, 1);
        if (d.ghost) alpha *= 0.55;
        ctx.globalAlpha = alpha;
        var glow = ctx.createRadialGradient(p.X, p.Y, 0, p.X, p.Y, 18);
        glow.addColorStop(0, col + "33");
        glow.addColorStop(1, col + "00");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(p.X, p.Y, 18, 0, Math.PI * 2); ctx.fill();
        if (isSel) {
          ctx.beginPath();
          ctx.arc(p.X, p.Y, 11 + 2 * Math.sin(phase), 0, Math.PI * 2);
          ctx.strokeStyle = col;
          ctx.globalAlpha = alpha * 0.45;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.globalAlpha = alpha;
        }
        ctx.beginPath();
        ctx.arc(p.X, p.Y, isSel ? 5.6 : (isHover ? 5 : 3.8), 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        if (isSel || isHover) {
          ctx.strokeStyle = C.paper;
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
        ctx.fillStyle = isSel ? C.ink : C.soft;
        ctx.font = (isSel ? '700 ' : '600 ') + '10px "Open Sans", sans-serif';
        var above = idx % 2 === 0;
        ctx.textAlign = "left";
        ctx.fillText(d.label, p.X + 9, p.Y + (above ? -8 : 14));
        ctx.globalAlpha = 1;
      });

      var label = mix < 0.5 ? "1D · Linie" : (mix < 1.5 ? "2D · Ebene" : "3D · Raum");
      ctx.font = '700 11px "Barlow", sans-serif';
      var bw = ctx.measureText(label).width + 18;
      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.fillRect(14, 12, bw, 24);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.strokeRect(14.5, 12.5, bw - 1, 23);
      ctx.fillStyle = C.petrol;
      ctx.textAlign = "left";
      ctx.fillText(label, 23, 28);
      ctx.fillStyle = C.muted;
      ctx.font = '600 9px "Open Sans", sans-serif';
      ctx.textAlign = "right";
      ctx.fillText("Temperatur → Ähnlichkeit → Beziehungen", w - 20, 24);
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;
      last = now;
      phase += 0.05;
      var target = st.target;
      if (Math.abs(mix - target) > 0.003) {
        mix += (target - mix) * 0.08;
        draw();
      } else if (Math.abs(mix - target) <= 0.003 && mix !== target) {
        mix = target;
        draw();
      }
      if (dragging) {
        dragYaw += 0.0008;
        draw();
      }
    }
    function onMove(e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (dragging) {
        dragYaw += (e.clientX - lx) * 0.008;
        dragPitch = clamp(dragPitch + (e.clientY - ly) * 0.005, -0.5, 0.5);
        lx = e.clientX; ly = e.clientY;
        draw();
        return;
      }
      var k = nearest(x, y, r.width, r.height);
      if (k !== hover) { hover = k; canvas.style.cursor = k ? "pointer" : "grab"; draw(); }
    }
    function onDown(e) { dragging = true; lx = e.clientX; ly = e.clientY; canvas.style.cursor = "grabbing"; }
    function onUp() { dragging = false; canvas.style.cursor = "grab"; }
    function onClick(e) {
      var r = canvas.getBoundingClientRect();
      var k = nearest(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
      if (k) { st.selected = k; draw(); }
    }
    function resize() { size = fitCanvas(canvas, canvas); draw(); }
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("mouseleave", function () { hover = null; });
    canvas.addEventListener("click", onClick);
    window.addEventListener("resize", resize);
    canvas.style.cursor = "grab";
    uiChips = uiChips;
    resize();
    raf = requestAnimationFrame(loop);
    return {
      update: function (s) {
        if (s && typeof s.dim === "number") {
          st.target = clamp(s.dim, 0, 2);
          st.dim = st.target;
        }
        if (s && s.mode) st.mode = s.mode;
        if (s && s.selected && WORDS[s.selected]) st.selected = s.selected;
        ui.querySelectorAll(".ls-chip").forEach(function (b, i) {
          b.classList.toggle("is-on", i === st.target);
        });
        if (api.onHint) {
          var mode = st.target < 0.5 ? "1D · Linie" : (st.target < 1.5 ? "2D · Ebene" : "3D · Raum");
          api.onHint(mode + " · klicke 1D / 2D / 3D oder drehe den Raum");
        }
        draw();
      },
      resize: resize,
      destroy: function () {
        cancelAnimationFrame(raf);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("resize", resize);
      }
    };
  }

  var CONV_CACHE = null;
  function demoConvolution(root, api) {
    root.innerHTML = '<div class="ls-conv"><div class="ls-canvas-wrap"><canvas class="ls-canvas ls-canvas--static"></canvas><canvas class="ls-canvas ls-canvas--dynamic"></canvas></div><div class="ls-conv-ui"></div></div>';
    var wrap = root.querySelector(".ls-canvas-wrap");
    var staticCanvas = root.querySelector(".ls-canvas--static");
    var canvas = root.querySelector(".ls-canvas--dynamic");
    var ui = root.querySelector(".ls-conv-ui");
    var C = api.colors();
    var KERNELS = {
      edge: { label: "Kante", m: [-1, -1, -1, -1, 8, -1, -1, -1, -1] },
      blur: { label: "Weichzeichnen", m: [1, 1, 1, 1, 1, 1, 1, 1, 1] },
      sharpen: { label: "Schärfen", m: [0, -1, 0, -1, 5, -1, 0, -1, 0] },
      sobelH: { label: "Sobel H", m: [-1, -2, -1, 0, 0, 0, 1, 2, 1] },
      sobelV: { label: "Sobel V", m: [-1, 0, 1, -2, 0, 2, -1, 0, 1] }
    };
    var st = { mode: "pixels", kernel: "edge" };
    var S = 96;
    var sample = document.createElement("canvas");
    sample.width = S; sample.height = S;
    var sctx = sample.getContext("2d", { willReadFrequently: true });
    var data = null;
    var feature = document.createElement("canvas");
    feature.width = S - 2; feature.height = S - 2;
    var fctx = feature.getContext("2d");
    var img = CONV_CACHE && CONV_CACHE.img ? CONV_CACHE.img : new Image();
    var imgReady = false, fallbackMode = false;
    var size = null, raf = 0, last = 0, scan = { on: false, t: 0 };
    var pointer = { x: 0.5, y: 0.5, in: false };
    if (CONV_CACHE) {
      imgReady = true;
      fallbackMode = !!CONV_CACHE.fallback;
      data = new Uint8ClampedArray(CONV_CACHE.data);
      var init = sctx.createImageData(S, S);
      init.data.set(data);
      sctx.putImageData(init, 0, 0);
      computeFeature();
    }
    var uiChips = chipRow(ui, [
      { id: "pixels", label: "Pixel" },
      { id: "kernel", label: "Kernel" },
      { id: "feature", label: "Feature-Map" },
      { id: "hierarchy", label: "Hierarchie" }
    ], st.mode, function (id) { st.mode = id; draw(); });
    var kernelChips = document.createElement("div");
    kernelChips.className = "ls-chips ls-chips--sub";
    Object.keys(KERNELS).forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-chip" + (k === st.kernel ? " is-on" : "");
      b.textContent = KERNELS[k].label;
      b.addEventListener("click", function () {
        st.kernel = k;
        kernelChips.querySelectorAll(".ls-chip").forEach(function (x) { x.classList.remove("is-on"); });
        b.classList.add("is-on");
        computeFeature();
        draw();
      });
      kernelChips.appendChild(b);
    });
    ui.appendChild(kernelChips);
    var scanBtn = document.createElement("button");
    scanBtn.type = "button";
    scanBtn.className = "ls-btn ls-btn--tiny";
    scanBtn.textContent = "Scannen ▶";
    scanBtn.addEventListener("click", function () {
      scan.on = !scan.on;
      if (scan.on) scan.t = 0;
      scanBtn.textContent = scan.on ? "Stopp ■" : "Scannen ▶";
    });
    ui.appendChild(scanBtn);

    function fallback() {
      fallbackMode = true;
      sctx.fillStyle = "#f7f9f8";
      sctx.fillRect(0, 0, S, S);
      sctx.fillStyle = "#c0392b";
      sctx.beginPath();
      var cx = S / 2, cy = S / 2, r = S * 0.37;
      for (var i = 0; i < 8; i++) {
        var a = -Math.PI / 8 + i * Math.PI / 4;
        var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        if (i === 0) sctx.moveTo(x, y); else sctx.lineTo(x, y);
      }
      sctx.closePath();
      sctx.fill();
      sctx.fillStyle = "#fff";
      sctx.font = '700 ' + Math.round(S * 0.19) + 'px Barlow, sans-serif';
      sctx.textAlign = "center";
      sctx.textBaseline = "middle";
      sctx.fillText("STOP", cx, cy + 2);
      try { data = sctx.getImageData(0, 0, S, S).data; } catch (e) { data = null; }
      imgReady = true;
      if (data) CONV_CACHE = { img: null, data: data, fallback: true };
      computeFeature();
      draw();
    }
    function prepare() {
      try {
        sctx.drawImage(img, 0, 0, S, S);
        data = sctx.getImageData(0, 0, S, S).data;
        imgReady = true;
        CONV_CACHE = { img: img, data: data, fallback: false };
        computeFeature();
        draw();
      } catch (e) {
        fallback();
      }
    }
    if (!CONV_CACHE) {
      img.onload = prepare;
      img.onerror = fallback;
      img.src = "../stop_sign.jpg";
    }

    function computeFeature() {
      if (!data) return;
      var out = fctx.createImageData(S - 2, S - 2);
      var m = KERNELS[st.kernel].m;
      for (var y = 1; y < S - 1; y++) {
        for (var x = 1; x < S - 1; x++) {
          var sumR = 0, sumG = 0, sumB = 0;
          for (var ky = -1; ky <= 1; ky++) {
            for (var kx = -1; kx <= 1; kx++) {
              var idx = ((y + ky) * S + (x + kx)) * 4;
              var w = m[(ky + 1) * 3 + (kx + 1)];
              sumR += data[idx] * w;
              sumG += data[idx + 1] * w;
              sumB += data[idx + 2] * w;
            }
          }
          var scale = st.kernel === "blur" ? 1 / 9 : 0.5;
          var o = ((y - 1) * (S - 2) + (x - 1)) * 4;
          out.data[o] = clamp(128 + sumR * scale, 0, 255);
          out.data[o + 1] = clamp(128 + sumG * scale, 0, 255);
          out.data[o + 2] = clamp(128 + sumB * scale, 0, 255);
          out.data[o + 3] = 255;
        }
      }
      fctx.putImageData(out, 0, 0);
    }

    function scanPoint() {
      if (scan.on) return { x: 0.12 + 0.76 * scan.t, y: 0.5 + 0.26 * Math.sin(scan.t * Math.PI * 2) };
      return pointer;
    }
    function draw() {
      if (!size) size = fitPair(wrap, staticCanvas, canvas);
      var w = size.w, h = size.h, stctx = size.a, ctx = size.b;
      stctx.clearRect(0, 0, w, h);
      ctx.clearRect(0, 0, w, h);
      if (!imgReady) {
        ctx.fillStyle = C.muted;
        ctx.font = '600 12px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText("Bild wird geladen …", w / 2, h / 2);
        return;
      }
      var pad = 24, top = 44;
      var leftW = Math.max(220, w * 0.56);
      var iw = Math.min(leftW - 2 * pad, h - top - 120);
      var ih = iw;
      var ix = pad, iy = top + 8;
      var rightX = leftW + 18;
      var rightW = Math.max(160, w - rightX - pad);
      var fw = Math.min(rightW, h - top - 100);
      var fh = fw;

      if (st.mode === "hierarchy") {
        var panels = [
          { k: "edge", label: "Kanten", color: C.blue },
          { k: "blur", label: "Texturen", color: C.lime },
          { k: "sobelH", label: "Teile", color: C.gold }
        ];
        var pw = (w - 2 * pad - 24) / 3;
        panels.forEach(function (p, i) {
          var px = pad + i * (pw + 12);
          var py = 58;
          var oldK = st.kernel;
          st.kernel = p.k;
          computeFeature();
          ctx.fillStyle = C.paper2;
          ctx.fillRect(px, py, pw, pw);
          ctx.drawImage(feature, px, py, pw, pw);
          ctx.strokeStyle = C.line;
          ctx.strokeRect(px, py, pw, pw);
          ctx.fillStyle = p.color;
          ctx.font = '700 11px "Barlow", sans-serif';
          ctx.textAlign = "left";
          ctx.fillText(p.label, px, py - 8);
          st.kernel = oldK;
        });
        computeFeature();
        ctx.fillStyle = C.ink;
        ctx.font = '700 13px "Barlow", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText("Früh: Kanten → Mitte: Teile → Spät: Objekt", pad, h - 34);
        return;
      }

      stctx.drawImage(imgReady && !fallbackMode ? img : sample, ix, iy, iw, ih);
      stctx.strokeStyle = C.line;
      stctx.lineWidth = 1;
      stctx.strokeRect(ix, iy, iw, ih);
      stctx.fillStyle = C.muted;
      stctx.font = '600 10px "Open Sans", sans-serif';
      stctx.textAlign = "left";
      stctx.fillText("Eingabe · 96 × 96", ix, iy - 7);

      var sp = scanPoint();
      var cx = ix + clamp(sp.x, 0, 1) * iw;
      var cy = iy + clamp(sp.y, 0, 1) * ih;
      var cell = iw / S;
      if (st.mode === "pixels") {
        ctx.strokeStyle = C.line;
        ctx.globalAlpha = 0.5;
        var stride = Math.max(4, Math.round(S / 24));
        for (var px = 0; px <= S; px += stride) {
          ctx.beginPath(); ctx.moveTo(ix + px * cell, iy); ctx.lineTo(ix + px * cell, iy + ih); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ix, iy + px * cell); ctx.lineTo(ix + iw, iy + px * cell); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 1.5 * cell, cy - 1.5 * cell, 3 * cell, 3 * cell);
        ctx.fillStyle = C.petrol;
        ctx.font = '600 11px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText("Jede Zelle ist ein RGB-Vektor. Das Netz sieht Zahlen.", ix, iy + ih + 20);
        return;
      }

      if (st.mode === "kernel" || st.mode === "feature") {
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 1.5 * cell, cy - 1.5 * cell, 3 * cell, 3 * cell);
        var kx = ix, ky = iy + ih + 12;
        var m = KERNELS[st.kernel].m;
        var kcell = 22;
        for (var r = 0; r < 3; r++) {
          for (var c2 = 0; c2 < 3; c2++) {
            ctx.fillStyle = C.paper2;
            ctx.fillRect(kx + c2 * kcell, ky + r * kcell, kcell, kcell);
            ctx.strokeStyle = C.line;
            ctx.strokeRect(kx + c2 * kcell, ky + r * kcell, kcell, kcell);
            ctx.fillStyle = C.ink;
            ctx.font = '600 9px "Barlow", sans-serif';
            ctx.textAlign = "center";
            ctx.fillText(String(m[r * 3 + c2]), kx + c2 * kcell + kcell / 2, ky + r * kcell + 14);
          }
        }
        ctx.fillStyle = C.muted;
        ctx.font = '600 10px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText("Kernel · " + KERNELS[st.kernel].label, kx, ky - 6);
      }

      if (st.mode === "feature") {
        ctx.fillStyle = C.paper2;
        ctx.fillRect(rightX, iy, fw, fh);
        ctx.drawImage(feature, rightX, iy, fw, fh);
        ctx.strokeStyle = C.line;
        ctx.strokeRect(rightX, iy, fw, fh);
        ctx.fillStyle = C.muted;
        ctx.font = '600 10px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText("Feature-Map · " + KERNELS[st.kernel].label, rightX, iy - 7);
        var fx = rightX + clamp(sp.x, 0, 1) * fw;
        var fy = iy + clamp(sp.y, 0, 1) * fh;
        ctx.strokeStyle = C.blue;
        ctx.globalAlpha = 0.45;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(fx, fy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(fx, fy, 4, 0, Math.PI * 2);
        ctx.fillStyle = C.green;
        ctx.fill();
      }
      stctx.fillStyle = C.muted;
      stctx.font = '10px "Open Sans", sans-serif';
      stctx.textAlign = "left";
      stctx.fillText(fallbackMode ? "Fallback-Schild (Bild nicht lesbar)" : "Foto: Matthew Paul Argall, CC0", ix, h - 22);
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;
      last = now;
      if (scan.on) {
        scan.t += 0.006;
        if (scan.t >= 1) { scan.t = 1; scan.on = false; scanBtn.textContent = "Scannen ▶"; }
        draw();
      } else if (pointer.in) {
        draw();
      }
    }
    function onMove(e) {
      var r = canvas.getBoundingClientRect();
      var w = size ? size.w : r.width, h = size ? size.h : r.height;
      var pad = 24, top = 44;
      var leftW = Math.max(220, w * 0.56);
      var iw = Math.min(leftW - 2 * pad, h - top - 120);
      var ix = pad, iy = top + 8;
      var x = e.clientX - r.left, y = e.clientY - r.top;
      pointer.x = clamp((x - ix) / iw, 0, 1);
      pointer.y = clamp((y - iy) / iw, 0, 1);
      pointer.in = x > ix && x < ix + iw && y > iy && y < iy + iw;
      if (pointer.in) draw();
    }
    function resize() { size = fitPair(wrap, staticCanvas, canvas); draw(); }
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", function () { pointer.in = false; draw(); });
    window.addEventListener("resize", resize);
    uiChips = uiChips;
    resize();
    raf = requestAnimationFrame(loop);
    return {
      update: function (s) {
        if (s && s.mode) st.mode = s.mode;
        if (s && s.kernel && KERNELS[s.kernel]) st.kernel = s.kernel;
        ui.querySelectorAll(".ls-chips:first-child .ls-chip").forEach(function (b, i) {
          b.classList.toggle("is-on", ["pixels", "kernel", "feature", "hierarchy"][i] === st.mode);
        });
        kernelChips.querySelectorAll(".ls-chip").forEach(function (b, i) {
          b.classList.toggle("is-on", Object.keys(KERNELS)[i] === st.kernel);
        });
        computeFeature();
        draw();
      },
      resize: resize,
      destroy: function () {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
      }
    };
  }
  function demoSampling(root, api) {
    var C = api.colors();
    var PROMPTS = {
      story: { label: "Geschichte", text: "Once upon a time there was a", items: [
        ["story", 2.3], ["fact", 1.7], ["code", 1.2], ["once", 0.9], ["a", 0.7], ["the", 0.4], ["dragon", 0.1], ["silence", -0.4]
      ] },
      fact: { label: "Fakten", text: "The capital of France is", items: [
        ["Paris", 4.6], ["Lyon", 1.4], ["France", 1.0], ["the", 0.5], ["a", 0.2], ["city", 0.1], ["Nice", -0.2], ["Marseille", -0.5]
      ] }
    };
    var st = { prompt: "story", temp: 0.9, topP: 0.9, filter: "topp", topK: 4, minP: 0.1, sampled: null };
    root.innerHTML =
      '<div class="ls-sampling">' +
        '<div class="ls-samp-head"><span class="ls-kicker" id="ls-samp-kicker"></span><div class="ls-samp-prompt" id="ls-samp-prompt"></div></div>' +
        '<canvas class="ls-canvas" aria-label="Wahrscheinlichkeiten der nächsten Tokens"></canvas>' +
        '<div class="ls-samp-controls">' +
          '<label class="ls-range">Temperatur <input type="range" id="ls-samp-temp" min="0.1" max="2" step="0.05" value="0.9"><output id="ls-samp-temp-out">0.90</output></label>' +
          '<label class="ls-range">Top-p <input type="range" id="ls-samp-topp" min="0.1" max="1" step="0.05" value="0.9"><output id="ls-samp-topp-out">0.90</output></label>' +
          '<label class="ls-field ls-field--inline">Filter <select id="ls-samp-filter" class="ls-select"><option value="topp">Top-p</option><option value="topk">Top-k</option><option value="minp">Min-p</option></select></label>' +
          '<button type="button" class="ls-btn ls-btn--primary" id="ls-samp-draw">Ziehen →</button>' +
          '<button type="button" class="ls-btn ls-btn--ghost" id="ls-samp-reset">Reset</button>' +
        '</div>' +
        '<div class="ls-samp-readout" id="ls-samp-readout"></div>' +
      '</div>';
    var canvas = root.querySelector("canvas");
    var promptEl = root.querySelector("#ls-samp-prompt");
    var kicker = root.querySelector("#ls-samp-kicker");
    var readout = root.querySelector("#ls-samp-readout");
    var temp = root.querySelector("#ls-samp-temp");
    var tempOut = root.querySelector("#ls-samp-temp-out");
    var topp = root.querySelector("#ls-samp-topp");
    var toppOut = root.querySelector("#ls-samp-topp-out");
    var filter = root.querySelector("#ls-samp-filter");
    var drawBtn = root.querySelector("#ls-samp-draw");
    var resetBtn = root.querySelector("#ls-samp-reset");
    var size = null;
    var curMap = null, fromMap = null, toMap = null, animT = 1, animStart = 0, raf = 0;

    function probsFor() {
      var items = PROMPTS[st.prompt].items;
      var max = Math.max.apply(null, items.map(function (x) { return x[1]; }));
      var t = Math.max(0.05, st.temp);
      var ex = items.map(function (x) { return Math.exp((x[1] - max) / t); });
      var sum = ex.reduce(function (a, b) { return a + b; }, 0);
      return items.map(function (x, i) { return { t: x[0], p: ex[i] / sum, logit: x[1] }; });
    }
    function survivors(ps) {
      var arr = ps.slice().sort(function (a, b) { return b.p - a.p; });
      var keep = [];
      if (st.filter === "topk") {
        keep = arr.slice(0, Math.max(1, st.topK));
      } else if (st.filter === "minp") {
        var floor = arr[0].p * st.minP;
        keep = arr.filter(function (x) { return x.p >= floor; });
      } else {
        var acc = 0;
        for (var i = 0; i < arr.length; i++) {
          keep.push(arr[i]); acc += arr[i].p;
          if (acc >= st.topP) break;
        }
      }
      var sum = keep.reduce(function (a, b) { return a + b.p; }, 0) || 1;
      keep.forEach(function (x) { x.q = x.p / sum; });
      return { keep: keep, all: arr };
    }
    function draw() {
      if (!size) size = fitCanvas(canvas, canvas);
      var w = size.w, h = size.h, ctx = size.ctx;
      ctx.clearRect(0, 0, w, h);
      var ps = probsFor();
      var s = survivors(ps);
      var keepSet = new Set(s.keep.map(function (x) { return x.t; }));
      var maxP = Math.max.apply(null, s.keep.map(function (x) { return x.q || x.p; }).concat([0.0001]));
      var pad = 14, labelW = Math.min(94, w * 0.22), valW = 48;
      var barX = pad + labelW + 10;
      var barW = Math.max(60, w - barX - valW - pad);
      var rowH = Math.min(38, (h - 2 * pad) / s.all.length);
      var font = Math.max(9, Math.min(13, rowH * 0.36));
      ctx.textBaseline = "middle";
      for (var i = 0; i < s.all.length; i++) {
        var x = s.all[i];
        var kept = keepSet.has(x.t);
        var sampled = st.sampled === x.t;
        var y = pad + i * rowH + rowH * 0.5;
        ctx.fillStyle = kept ? (sampled ? C.gold : C.ink) : C.muted;
        ctx.globalAlpha = kept ? 1 : 0.38;
        ctx.font = (sampled ? "700 " : "600 ") + font + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(x.t, pad, y);
        var tw = barW;
        ctx.fillStyle = "rgba(0,75,111,.07)";
        ctx.fillRect(barX, y - rowH * 0.26, tw, rowH * 0.52);
        var p = curMap && curMap[x.t] != null ? curMap[x.t] : (kept ? (x.q || x.p) : x.p);
        var fw = Math.min(tw, tw * Math.max(0, p) / maxP);
        if (kept) {
          var grd = ctx.createLinearGradient(barX, 0, barX + tw, 0);
          if (sampled) {
            grd.addColorStop(0, "#9f9700");
            grd.addColorStop(1, "#c8b21a");
          } else {
            grd.addColorStop(0, "#63a44b");
            grd.addColorStop(1, "#5c9baf");
          }
          ctx.fillStyle = grd;
        } else {
          ctx.fillStyle = "rgba(146,161,154,.45)";
        }
        ctx.fillRect(barX, y - rowH * 0.26, fw, rowH * 0.52);
        if (kept && fw > 3) {
          ctx.fillStyle = "rgba(255,255,255,.35)";
          ctx.fillRect(barX, y - rowH * 0.26, Math.min(8, fw), rowH * 0.52);
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = kept ? C.soft : C.muted;
        ctx.font = '600 ' + Math.max(8, font - 1) + 'px "Open Sans", sans-serif';
        ctx.textAlign = "right";
        ctx.fillText((p * 100).toFixed(1) + "%", w - pad, y);
      }
      if (st.sampled) {
        ctx.fillStyle = "rgba(159,151,0,.08)";
        ctx.fillRect(0, 0, w, h);
      }
    }
    function startLoop() {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    }
    function loop(now) {
      if (animT >= 1) { raf = 0; return; }
      animT = clamp((now - animStart) / 280, 0, 1);
      var e = ease(animT);
      Object.keys(toMap).forEach(function (k) {
        if (fromMap[k] == null) fromMap[k] = toMap[k];
        curMap[k] = lerp(fromMap[k], toMap[k], e);
      });
      draw();
      if (animT >= 1) { raf = 0; return; }
      raf = requestAnimationFrame(loop);
    }
    function render() {
      var ps = probsFor();
      var s = survivors(ps);
      var ent = -ps.reduce(function (a, x) { return a + (x.p > 0 ? x.p * Math.log2(x.p) : 0); }, 0);
      var keepSet = new Set(s.keep.map(function (x) { return x.t; }));
      var target = {};
      s.all.forEach(function (x) {
        target[x.t] = keepSet.has(x.t) ? (x.q || x.p) : x.p;
      });
      var same = curMap && Object.keys(target).every(function (k) { return curMap[k] != null; }) &&
        Object.keys(curMap).every(function (k) { return target[k] != null; });
      if (same) {
        fromMap = {};
        Object.keys(target).forEach(function (k) { fromMap[k] = curMap[k]; });
        toMap = target;
        animT = 0;
        animStart = performance.now();
        startLoop();
      } else {
        curMap = target;
        fromMap = target;
        toMap = target;
        animT = 1;
      }
      kicker.textContent = "Verteilung · " + PROMPTS[st.prompt].label;
      promptEl.textContent = PROMPTS[st.prompt].text;
      readout.innerHTML = '<span><b>Survivors</b> ' + s.keep.length + ' / ' + ps.length + '</span><span><b>Entropie</b> ' + ent.toFixed(2) + ' bit</span><span><b>Sampled</b> ' + (st.sampled || "—") + '</span>';
      temp.value = st.temp; tempOut.textContent = Number(st.temp).toFixed(2);
      topp.value = st.topP; toppOut.textContent = Number(st.topP).toFixed(2);
      filter.value = st.filter;
      draw();
    }
    temp.addEventListener("input", function () { st.temp = parseFloat(temp.value) || 0.9; st.sampled = null; render(); });
    topp.addEventListener("input", function () { st.topP = parseFloat(topp.value) || 0.9; st.sampled = null; render(); });
    filter.addEventListener("change", function () { st.filter = filter.value; st.sampled = null; render(); });
    drawBtn.addEventListener("click", function () {
      var s = survivors(probsFor());
      var r = Math.random(), acc = 0, pick = s.keep[0];
      for (var i = 0; i < s.keep.length; i++) { acc += s.keep[i].q; if (r <= acc) { pick = s.keep[i]; break; } }
      st.sampled = pick.t;
      render();
    });
    resetBtn.addEventListener("click", function () { st.sampled = null; st.temp = 0.9; st.topP = 0.9; st.filter = "topp"; render(); });
    window.addEventListener("resize", function () { size = fitCanvas(canvas, canvas); draw(); });
    render();
    return {
      update: function (s) {
        if (s && s.prompt && PROMPTS[s.prompt]) st.prompt = s.prompt;
        if (s && typeof s.temp === "number") st.temp = s.temp;
        if (s && typeof s.topP === "number") st.topP = s.topP;
        if (s && s.filter) st.filter = s.filter;
        st.sampled = null;
        render();
      },
      resize: function () { size = fitCanvas(canvas, canvas); draw(); },
      destroy: function () { if (raf) cancelAnimationFrame(raf); }
    };
  }

  function demoTransformer(root, api) {
    root.innerHTML = '<div class="ls-tr"><div class="ls-canvas-wrap"><canvas class="ls-canvas ls-canvas--static"></canvas><canvas class="ls-canvas ls-canvas--dynamic"></canvas></div><div class="ls-tr-ui"></div></div>';
    var wrap = root.querySelector(".ls-canvas-wrap");
    var staticCanvas = root.querySelector(".ls-canvas--static");
    var canvas = root.querySelector(".ls-canvas--dynamic");
    var ui = root.querySelector(".ls-tr-ui");
    var C = api.colors();
    var TOKENS = ["the", "city", "capital", "France", "Lyon", "Paris"];
    var LAYERS = [
      [0.28, 0.21, 0.18, 0.14, 0.11, 0.08],
      [0.12, 0.26, 0.24, 0.18, 0.12, 0.08],
      [0.05, 0.10, 0.30, 0.25, 0.18, 0.12],
      [0.03, 0.04, 0.08, 0.18, 0.34, 0.33],
      [0.01, 0.02, 0.03, 0.06, 0.22, 0.66],
      [0.01, 0.01, 0.01, 0.02, 0.08, 0.87],
      [0.00, 0.00, 0.00, 0.01, 0.03, 0.96]
    ];
    var NAMES = ["Embedding", "Attn 1", "MLP 1", "Attn 2", "MLP 2", "Attn 3", "Output"];
    var BASE = [0.35, 0.5, 0.28, 0.62, 0.44, 0.3, 0.55, 0.4, 0.33, 0.48];
    var UPDATES = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0.18, 0.24, 0.12, 0.2, 0.16, 0.22, 0.1, 0.18, 0.2, 0.16],
      [0.12, 0.16, 0.22, 0.14, 0.18, 0.12, 0.2, 0.16, 0.14, 0.12],
      [0.1, 0.14, 0.1, 0.16, 0.12, 0.18, 0.14, 0.1, 0.14, 0.16],
      [0.08, 0.12, 0.16, 0.1, 0.14, 0.1, 0.12, 0.18, 0.1, 0.08]
    ];
    var st = { layer: 0, mode: "lens" };
    var cur = LAYERS[0].slice();
    var curRes = BASE.slice();
    var fromP = cur.slice(), toP = cur.slice();
    var fromR = curRes.slice(), toR = curRes.slice();
    var animT = 1, animDur = 520, animStart = 0;
    var activePos = 0, activeFrom = 0, activeTo = 0, activeT = 1, activeStart = 0;
    var size = null, raf = 0, last = 0;
    var uiChips = chipRow(ui, [
      { id: "residual", label: "Residual" },
      { id: "lens", label: "Logit-Linse" }
    ], st.mode, function (id) { st.mode = id; draw(); });
    var range = document.createElement("input");
    range.type = "range"; range.min = "0"; range.max = String(LAYERS.length - 1); range.step = "1"; range.value = "0";
    range.className = "ls-tr-range";
    range.setAttribute("aria-label", "Layer");
    range.addEventListener("input", function () { setLayer(parseInt(range.value, 10)); });
    ui.appendChild(range);

    function setLayer(l) {
      l = clamp(l, 0, LAYERS.length - 1);
      if (l === st.layer) return;
      fromP = cur.slice();
      fromR = curRes.slice();
      activeFrom = activePos;
      activeTo = l;
      activeT = 0;
      activeStart = performance.now();
      st.layer = l;
      toP = LAYERS[l].slice();
      var res = BASE.slice();
      for (var i = 1; i <= Math.min(l, UPDATES.length - 1); i++) {
        for (var j = 0; j < res.length; j++) res[j] += UPDATES[i][j];
      }
      toR = res;
      animT = 0;
      animStart = performance.now();
      range.value = String(l);
      draw();
    }
    function blockAt(x, y, w, h) {
      var top = 48, bh = 28, gap = 16;
      var bx = 24, bw = Math.min(150, w * 0.26);
      var idx = Math.floor((y - top) / (bh + gap));
      if (x < bx || x > bx + bw || idx < 0 || idx >= NAMES.length) return -1;
      var by = top + idx * (bh + gap);
      return (y >= by && y <= by + bh) ? idx : -1;
    }
    function draw() {
      if (!size) size = fitPair(wrap, staticCanvas, canvas);
      var w = size.w, h = size.h, sctx = size.a, ctx = size.b;
      sctx.clearRect(0, 0, w, h);
      ctx.clearRect(0, 0, w, h);
      var top = 48, bh = 28, gap = 16;
      var bx = 24, bw = Math.min(150, w * 0.26);
      var cx = bx + bw + 28;
      var rx = Math.max(cx + 110, w * 0.56);
      var rw = Math.max(150, w - rx - 24);
      sctx.strokeStyle = C.petrol;
      sctx.lineWidth = 2;
      sctx.beginPath();
      sctx.moveTo(bx + bw + 14, top + bh / 2);
      sctx.lineTo(bx + bw + 14, top + (NAMES.length - 1) * (bh + gap) + bh / 2);
      sctx.stroke();
      for (var i = 0; i < NAMES.length; i++) {
        var by = top + i * (bh + gap);
        sctx.fillStyle = C.paper;
        sctx.strokeStyle = C.line;
        sctx.lineWidth = 1;
        sctx.fillRect(bx, by, bw, bh);
        sctx.strokeRect(bx, by, bw, bh);
        sctx.fillStyle = C.ink;
        sctx.font = '600 11px "Open Sans", sans-serif';
        sctx.textAlign = "left";
        sctx.fillText(NAMES[i], bx + 9, by + 18);
        var v = BASE.slice();
        for (var u = 1; u <= Math.min(i, UPDATES.length - 1); u++) {
          for (var j = 0; j < v.length; j++) v[j] += UPDATES[u][j];
        }
        var maxV = Math.max.apply(null, v) * 1.15;
        for (var k = 0; k < v.length; k++) {
          var bwid = 3, bhh = Math.max(2, v[k] / maxV * 18);
          sctx.fillStyle = C.blue;
          sctx.globalAlpha = 0.45;
          sctx.fillRect(bx + bw + 18 + k * 5, by + bh - 5 - bhh, bwid, bhh);
          sctx.globalAlpha = 1;
        }
      }
      sctx.fillStyle = C.muted;
      sctx.font = '600 10px "Open Sans", sans-serif';
      sctx.textAlign = "left";
      sctx.fillText("Residual Stream · ein Vektor pro Token", bx, 28);
      sctx.fillText("Updates", bx + bw + 12, 28);
      if (st.mode === "lens") {
        sctx.fillText("Nächster Token · Logit-Linse", rx, 28);
        sctx.font = '10px "Open Sans", sans-serif';
        sctx.fillText("The capital of France is ___", rx, h - 28);
      } else {
        sctx.font = '10px "Open Sans", sans-serif';
        sctx.fillText("Die Balken zeigen den laufenden Vektor, nicht die Ausgabe.", rx, 60);
      }

      var activeY = top + activePos * (bh + gap);
      ctx.fillStyle = C.green;
      ctx.fillRect(bx, activeY, bw, bh);
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(bx, activeY, bw, bh);
      ctx.fillStyle = "#fff";
      ctx.font = '600 11px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(NAMES[st.layer], bx + 9, activeY + 18);
      ctx.beginPath();
      ctx.arc(bx + bw + 14, activeY + bh / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = C.green;
      ctx.fill();

      if (st.mode === "lens") {
        for (var t = 0; t < TOKENS.length; t++) {
          var ry = 52 + t * 38;
          var p = cur[t];
          ctx.fillStyle = C.paper2;
          ctx.fillRect(rx, ry, rw, 18);
          ctx.fillStyle = t === 5 ? C.green : (t === 4 ? C.gold : C.sky);
          ctx.globalAlpha = 0.85;
          ctx.fillRect(rx, ry, rw * p, 18);
          ctx.globalAlpha = 1;
          ctx.fillStyle = C.ink;
          ctx.font = '600 11px "Open Sans", sans-serif';
          ctx.textAlign = "left";
          ctx.fillText(TOKENS[t], rx, ry - 4);
          ctx.textAlign = "right";
          ctx.fillText(Math.round(p * 100) + "%", rx + rw, ry - 4);
          if (p > 0.5) {
            ctx.strokeStyle = C.green;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(rx - 1, ry - 1, rw + 2, 20);
          }
        }
      }
      ctx.fillStyle = C.muted;
      ctx.font = '10px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("Layer " + st.layer + " / " + (LAYERS.length - 1) + " · " + NAMES[st.layer], bx, h - 22);
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;
      last = now;
      var changed = false;
      if (animT < 1) {
        animT = clamp((now - animStart) / animDur, 0, 1);
        var e = ease(animT);
        for (var i = 0; i < cur.length; i++) {
          cur[i] = lerp(fromP[i], toP[i], e);
          curRes[i] = lerp(fromR[i], toR[i], e);
        }
        changed = true;
      }
      if (activeT < 1) {
        activeT = clamp((now - activeStart) / 300, 0, 1);
        activePos = lerp(activeFrom, activeTo, ease(activeT));
        changed = true;
      }
      if (changed) draw();
    }
    function onClick(e) {
      var r = canvas.getBoundingClientRect();
      var idx = blockAt(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
      if (idx >= 0) setLayer(idx);
    }
    function resize() { size = fitPair(wrap, staticCanvas, canvas); draw(); }
    canvas.addEventListener("click", onClick);
    window.addEventListener("resize", resize);
    uiChips = uiChips;
    resize();
    raf = requestAnimationFrame(loop);
    return {
      update: function (s) {
        if (s && typeof s.layer === "number") setLayer(s.layer);
        if (s && s.mode) st.mode = s.mode;
        ui.querySelectorAll(".ls-chips .ls-chip").forEach(function (b, i) {
          b.classList.toggle("is-on", ["residual", "lens"][i] === st.mode);
        });
        draw();
      },
      resize: resize,
      destroy: function () {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
      }
    };
  }
  function demoSpaceMorph(root, api) {
    root.innerHTML = '<iframe class="ls-iframe" src="spacemorph_demo.html" title="Space Morph: das MLP biegt den Raum"></iframe>';
    return {
      update: function () {},
      resize: function () {},
      destroy: function () {}
    };
  }
  function demoHyper(root, api) {
    root.innerHTML = '<div class="ls-hyper"><canvas class="ls-canvas"></canvas><div class="ls-hyper-ui"></div></div>';
    var canvas = root.querySelector(".ls-canvas");
    var ui = root.querySelector(".ls-hyper-ui");
    var C = api.colors();
    var N = 22, EXT = 1.35;
    var st = { mode: "2d", c: 0, yaw: 0.7, pitch: 0.92, zoom: 1.05, ball: { a: -0.8, b: 0.75 }, trail: [] };
    var mix = 0, targetMix = 0;
    var size = null, raf = 0, last = 0, dragging = false, lx = 0, ly = 0;
    var training = false;
    var uiChips = chipRow(ui, [
      { id: "2d", label: "2D" },
      { id: "3d", label: "3D" },
      { id: "4d", label: "4D" }
    ], st.mode, function (id) { setMode(id); });
    var cWrap = document.createElement("label");
    cWrap.className = "ls-range ls-range--hyper";
    cWrap.innerHTML = 'c <input type="range" min="0" max="1" step="0.01" value="0"><output>0.00</output>';
    var cRange = cWrap.querySelector("input");
    var cOut = cWrap.querySelector("output");
    cRange.addEventListener("input", function () {
      st.c = parseFloat(cRange.value) || 0;
      cOut.textContent = st.c.toFixed(2);
      draw();
    });
    ui.appendChild(cWrap);
    var trainBtn = document.createElement("button");
    trainBtn.type = "button";
    trainBtn.className = "ls-btn ls-btn--primary ls-btn--tiny";
    trainBtn.textContent = "Trainieren →";
    trainBtn.addEventListener("click", function () { training = true; st.trail = []; });
    ui.appendChild(trainBtn);
    var resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "ls-btn ls-btn--ghost ls-btn--tiny";
    resetBtn.textContent = "Reset";
    resetBtn.addEventListener("click", function () {
      training = false;
      st.ball = { a: -0.8, b: 0.75 };
      st.trail = [];
      st.c = 0;
      cRange.value = "0";
      cOut.textContent = "0.00";
      draw();
    });
    ui.appendChild(resetBtn);

    function loss(a, b, c) {
      var r2 = a * a + b * b;
      return 0.55 * (r2 - 1) * (r2 - 1) + 0.18 * (a - b) * (a - b) + 0.55 * c * c + 0.08 * Math.sin(2.2 * a) * Math.sin(2.2 * b);
    }
    function setMode(m) {
      st.mode = m;
      targetMix = m === "2d" ? 0 : 1;
      ui.querySelectorAll(".ls-chip").forEach(function (b, i) {
        b.classList.toggle("is-on", ["2d", "3d", "4d"][i] === m);
      });
      cWrap.style.display = m === "4d" ? "flex" : "none";
      if (m !== "4d") { st.c = 0; cRange.value = "0"; cOut.textContent = "0.00"; }
      draw();
    }
    function hexRgb(h) {
      h = h.replace("#", "");
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    function mixColor(c1, c2, t) {
      var a = hexRgb(c1), b = hexRgb(c2);
      return "rgb(" + Math.round(lerp(a[0], b[0], t)) + "," + Math.round(lerp(a[1], b[1], t)) + "," + Math.round(lerp(a[2], b[2], t)) + ")";
    }
    function lossColor(v) {
      var low = C.green, mid = C.gold, high = C.lilac;
      if (v < 0.5) return mixColor(low, mid, v / 0.5);
      return mixColor(mid, high, (v - 0.5) / 0.5);
    }
    function project(x, y, z, w, h) {
      var m = ease(clamp(mix, 0, 1));
      var yaw = st.yaw;
      var pitch = st.pitch * m;
      var x1 = x * Math.cos(yaw) - y * Math.sin(yaw);
      var y1 = x * Math.sin(yaw) + y * Math.cos(yaw);
      var z1 = z * m * 0.9;
      var y2 = y1 * Math.cos(pitch) - z1 * Math.sin(pitch);
      var z2 = y1 * Math.sin(pitch) + z1 * Math.cos(pitch);
      var s = Math.min(w, h) * 0.30 * st.zoom / (1 + z2 * 0.25);
      return { X: w * 0.5 + x1 * s, Y: h * 0.54 - y2 * s, Z: z2, S: s };
    }
    function heightAt(a, b) { return loss(a, b, st.c); }
    function draw() {
      if (!size) size = fitCanvas(canvas, canvas);
      var w = size.w, h = size.h, ctx = size.ctx;
      ctx.clearRect(0, 0, w, h);

      var maxLoss = 0;
      var i, j;
      for (i = 0; i <= N; i++) for (j = 0; j <= N; j++) {
        var v0 = heightAt(-EXT + 2 * EXT * i / N, -EXT + 2 * EXT * j / N);
        if (v0 > maxLoss) maxLoss = v0;
      }
      maxLoss = maxLoss || 1;
      var cells = [];
      for (i = 0; i < N; i++) {
        for (j = 0; j < N; j++) {
          var a0 = -EXT + 2 * EXT * i / N, a1 = -EXT + 2 * EXT * (i + 1) / N;
          var b0 = -EXT + 2 * EXT * j / N, b1 = -EXT + 2 * EXT * (j + 1) / N;
          var z00 = heightAt(a0, b0) / maxLoss, z10 = heightAt(a1, b0) / maxLoss;
          var z11 = heightAt(a1, b1) / maxLoss, z01 = heightAt(a0, b1) / maxLoss;
          var p00 = project(a0, b0, z00, w, h), p10 = project(a1, b0, z10, w, h);
          var p11 = project(a1, b1, z11, w, h), p01 = project(a0, b1, z01, w, h);
          var zAvg = (z00 + z10 + z11 + z01) / 4;
          var cMix = st.mode === "4d" ? 0.25 + 0.35 * st.c : 0;
          cells.push({ pts: [p00, p10, p11, p01], z: zAvg, col: lossColor(zAvg), cMix: cMix });
        }
      }
      cells.sort(function (A, B) { return A.z - B.z; });
      cells.forEach(function (cell) {
        var p = cell.pts;
        ctx.beginPath();
        ctx.moveTo(p[0].X, p[0].Y);
        ctx.lineTo(p[1].X, p[1].Y);
        ctx.lineTo(p[2].X, p[2].Y);
        ctx.lineTo(p[3].X, p[3].Y);
        ctx.closePath();
        ctx.fillStyle = cell.cMix ? mixColor(cell.col, C.blue, cell.cMix) : cell.col;
        ctx.globalAlpha = 0.78;
        ctx.fill();
        ctx.globalAlpha = 0.16;
        ctx.strokeStyle = C.paper;
        ctx.lineWidth = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      if (mix < 0.35) {
        ctx.strokeStyle = C.petrol;
        ctx.globalAlpha = (1 - mix / 0.35) * 0.55;
        ctx.lineWidth = 1;
        for (i = 0; i < N; i++) {
          ctx.beginPath();
          for (j = 0; j <= N; j++) {
            var pp = project(-EXT + 2 * EXT * i / N, -EXT + 2 * EXT * j / N, heightAt(-EXT + 2 * EXT * i / N, -EXT + 2 * EXT * j / N) / maxLoss, w, h);
            if (j === 0) ctx.moveTo(pp.X, pp.Y); else ctx.lineTo(pp.X, pp.Y);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      var bz = heightAt(st.ball.a, st.ball.b) / maxLoss;
      var bp = project(st.ball.a, st.ball.b, bz, w, h);
      var floor = project(st.ball.a, st.ball.b, 0, w, h);
      ctx.strokeStyle = C.petrol;
      ctx.globalAlpha = 0.35;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(bp.X, bp.Y); ctx.lineTo(floor.X, floor.Y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      if (st.trail.length > 1) {
        ctx.beginPath();
        st.trail.forEach(function (t, idx) {
          var tp = project(t.a, t.b, heightAt(t.a, t.b) / maxLoss, w, h);
          if (idx === 0) ctx.moveTo(tp.X, tp.Y); else ctx.lineTo(tp.X, tp.Y);
        });
        ctx.strokeStyle = C.gold;
        ctx.lineWidth = 1.6;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.arc(bp.X, bp.Y, 6, 0, Math.PI * 2);
      ctx.fillStyle = C.paper;
      ctx.fill();
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(bp.X - 2, bp.Y - 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = C.green;
      ctx.fill();

      ctx.fillStyle = C.muted;
      ctx.font = '600 10px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("Loss-Landschaft · a, b" + (st.mode === "4d" ? " · c = " + st.c.toFixed(2) : ""), 24, 26);
      ctx.textAlign = "right";
      ctx.fillText(st.mode === "4d" ? "4D-Schnitt: Farbe = c" : (st.mode === "2d" ? "2D · Draufsicht" : "3D · Fläche"), w - 24, 26);
      if (st.mode === "4d") {
        var ax = w - 56, ay = h - 70;
        ctx.strokeStyle = C.petrol;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - 70); ctx.stroke();
        ctx.beginPath(); ctx.arc(ax, ay - 70 * st.c, 5, 0, Math.PI * 2);
        ctx.fillStyle = C.blue; ctx.fill();
        ctx.fillStyle = C.muted;
        ctx.font = '600 10px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText("c", ax, ay + 14);
      }
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;
      last = now;
      if (Math.abs(mix - targetMix) > 0.002) {
        mix += (targetMix - mix) * 0.12;
        draw();
      }
      if (training) {
        var e = 0.008;
        var ga = (loss(st.ball.a + e, st.ball.b, st.c) - loss(st.ball.a - e, st.ball.b, st.c)) / (2 * e);
        var gb = (loss(st.ball.a, st.ball.b + e, st.c) - loss(st.ball.a, st.ball.b - e, st.c)) / (2 * e);
        st.ball.a -= 0.045 * ga;
        st.ball.b -= 0.045 * gb;
        if (st.trail.length === 0 || Math.hypot(st.ball.a - st.trail[st.trail.length - 1].a, st.ball.b - st.trail[st.trail.length - 1].b) > 0.03) {
          st.trail.push({ a: st.ball.a, b: st.ball.b });
          if (st.trail.length > 70) st.trail.shift();
        }
        if (Math.hypot(ga, gb) < 0.012) training = false;
        draw();
      }
    }
    function onDown(e) {
      dragging = true;
      lx = e.clientX; ly = e.clientY;
      canvas.style.cursor = "grabbing";
    }
    function onMove(e) {
      if (!dragging) return;
      st.yaw += (e.clientX - lx) * 0.008;
      st.pitch = clamp(st.pitch + (e.clientY - ly) * 0.006, 0.15, 1.35);
      lx = e.clientX; ly = e.clientY;
      draw();
    }
    function onUp() { dragging = false; canvas.style.cursor = "grab"; }
    function onWheel(e) {
      e.preventDefault();
      st.zoom = clamp(st.zoom * (e.deltaY > 0 ? 0.94 : 1.06), 0.5, 2.2);
      draw();
    }
    function onClick(e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var best = null, bd = 30;
      for (var a = -EXT; a <= EXT; a += 0.12) {
        for (var b = -EXT; b <= EXT; b += 0.12) {
          var p = project(a, b, heightAt(a, b) / 1.5, r.width, r.height);
          var d = Math.hypot(p.X - x, p.Y - y);
          if (d < bd) { bd = d; best = { a: a, b: b }; }
        }
      }
      if (best) { st.ball = best; st.trail = []; draw(); }
    }
    function resize() { size = fitCanvas(canvas, canvas); draw(); }
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("click", onClick);
    window.addEventListener("resize", resize);
    canvas.style.cursor = "grab";
    uiChips = uiChips;
    cWrap.style.display = "none";
    resize();
    raf = requestAnimationFrame(loop);
    return {
      update: function (s) {
        if (s && s.mode) setMode(s.mode);
        if (s && typeof s.c === "number") { st.c = s.c; cRange.value = String(s.c); cOut.textContent = s.c.toFixed(2); }
        draw();
      },
      resize: resize,
      destroy: function () {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("resize", resize);
      }
    };
  }

  function demoHistory(root, api) {
    var POINTS = [
      {
        date: "ca. 18.000 v. Chr.",
        name: "Ishango-Knochen",
        img: "../ishango.jpg",
        alt: "Der Ishango-Knochen mit gruppierten Kerben",
        cap: "Ishango-Knochen. Bild: Ben2, <a href=\"https://commons.wikimedia.org/wiki/File:Os_d%27Ishango_IRSNB.JPG\" rel=\"noopener\">CC BY-SA 3.0</a>.",
        note: "Kerben speichern Zahlen außerhalb des Kopfes. Die Gruppen sind ein Hinweis, kein entschlüsselter Text."
      },
      {
        date: "ca. 200–60 v. Chr.",
        name: "Antikythera",
        img: "../antikythera.jpg",
        alt: "Fragmente des Antikythera-Mechanismus",
        cap: "Fragmente des Antikythera-Mechanismus. Bild: Therese Clutario, <a href=\"https://commons.wikimedia.org/wiki/File:Fragments_of_the_Antikythera_Mechanism.jpg\" rel=\"noopener\">CC BY 2.0</a>.",
        note: "Zahnräder bilden den Lauf von Himmelskörpern nach. Rechnen wird ein Mechanismus."
      },
      {
        date: "1833–1843",
        name: "Babbage & Ada",
        img: "../babbage.jpg",
        alt: "Babbages Analytical Engine",
        cap: "Babbages Analytical Engine. Bild: John Cummings, <a href=\"https://commons.wikimedia.org/wiki/File:Babbages_Analytical_Engine,_1834-1871._(9660574685).jpg\" rel=\"noopener\">CC BY-SA 2.0</a>.",
        note: "Die Analytical Engine trennt Rechenwerk und Anweisung. Ada Lovelace beschreibt, was ein Programm sein könnte."
      }
    ];
    root.innerHTML = '<div class="ls-hist"><div class="ls-hist-track"></div><div class="ls-hist-card"><figure><img alt=""><figcaption></figcaption></figure><div class="ls-hist-meta"><span class="ls-hist-date"></span><b class="ls-hist-name"></b><p class="ls-hist-note"></p></div></div></div>';
    var track = root.querySelector(".ls-hist-track");
    var img = root.querySelector("img");
    var cap = root.querySelector("figcaption");
    var date = root.querySelector(".ls-hist-date");
    var name = root.querySelector(".ls-hist-name");
    var note = root.querySelector(".ls-hist-note");
    track.innerHTML = POINTS.map(function (p, i) {
      return '<button type="button" class="ls-hist-node" data-hist="' + i + '"><span>' + api.esc(p.date) + '</span><b>' + api.esc(p.name) + '</b></button>';
    }).join("");
    var nodes = track.querySelectorAll("[data-hist]");
    var current = 0;
    function render(i) {
      current = Math.max(0, Math.min(POINTS.length - 1, i));
      var p = POINTS[current];
      nodes.forEach(function (b) { b.classList.toggle("is-on", parseInt(b.getAttribute("data-hist"), 10) === current); });
      img.src = p.img;
      img.alt = p.alt;
      cap.innerHTML = p.cap;
      date.textContent = p.date;
      name.textContent = p.name;
      note.textContent = p.note;
    }
    nodes.forEach(function (b) {
      b.addEventListener("click", function () { api.goStep(parseInt(b.getAttribute("data-hist"), 10)); });
    });
    render(0);
    return {
      update: function (s) { render(s && typeof s.history === "number" ? s.history : 0); },
      resize: function () {},
      destroy: function () { root.innerHTML = ""; }
    };
  }

  function demoActivation(root, api) {
    var C = api.colors();
    var st = { fn: "relu" };
    root.innerHTML =
      '<div class="ls-act">' +
        '<div class="ls-act-plot"><canvas class="ls-canvas"></canvas></div>' +
        '<div class="ls-act-chips">' +
          '<button type="button" class="ls-chip is-on" data-fn="relu">ReLU</button>' +
          '<button type="button" class="ls-chip" data-fn="tanh">tanh</button>' +
          '<button type="button" class="ls-chip" data-fn="sigmoid">sigmoid</button>' +
          '<button type="button" class="ls-chip" data-fn="gelu">GELU</button>' +
        '</div>' +
        '<div class="ls-act-readout"><span>Form <b data-fn-name>ReLU</b></span><span>Werte <b data-fn-range>0 … ∞</b></span><span><b data-fn-shape>harter Knick</b></span></div>' +
      '</div>';
    var canvas = root.querySelector("canvas");
    var chips = root.querySelectorAll("[data-fn]");
    var nameEl = root.querySelector("[data-fn-name]");
    var rangeEl = root.querySelector("[data-fn-range]");
    var shapeEl = root.querySelector("[data-fn-shape]");
    function fn(name, x) {
      if (name === "relu") return Math.max(0, x);
      if (name === "tanh") return Math.tanh(x);
      if (name === "sigmoid") return 1 / (1 + Math.exp(-x));
      return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)));
    }
    var META = {
      relu: ["ReLU", "0 … ∞", "harter Knick"],
      tanh: ["tanh", "−1 … 1", "weiche S-Kurve"],
      sigmoid: ["sigmoid", "0 … 1", "weiche S-Kurve"],
      gelu: ["GELU", "≈ −0,17 … ∞", "glatter Durchlass"]
    };
    function draw() {
      var f = api.fit(canvas, canvas.parentNode);
      var w = f.w, h = f.h, ctx = f.ctx;
      var pad = 28;
      var x0 = pad, x1 = w - pad, y0 = h - pad, y1 = pad;
      var X0 = -4, X1 = 4, Y0 = -1.5, Y1 = 2.5;
      function px(x) { return x0 + (x - X0) / (X1 - X0) * (x1 - x0); }
      function py(y) { return y0 - (y - Y0) / (Y1 - Y0) * (y0 - y1); }
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      for (var gx = -4; gx <= 4; gx++) {
        ctx.beginPath(); ctx.moveTo(px(gx), y0); ctx.lineTo(px(gx), y1); ctx.stroke();
      }
      for (var gy = -1; gy <= 2; gy++) {
        ctx.beginPath(); ctx.moveTo(x0, py(gy)); ctx.lineTo(x1, py(gy)); ctx.stroke();
      }
      ctx.strokeStyle = C.petrol;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x0, py(0)); ctx.lineTo(x1, py(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px(0), y0); ctx.lineTo(px(0), y1); ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '600 10px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("x", x1 - 8, py(0) + 14);
      ctx.textAlign = "center";
      ctx.fillText("f(x)", px(0) + 18, y1 + 6);
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (var i = 0; i <= 180; i++) {
        var x = X0 + (X1 - X0) * i / 180;
        var y = Math.max(Y0, Math.min(Y1, fn(st.fn, x)));
        if (i === 0) ctx.moveTo(px(x), py(y));
        else ctx.lineTo(px(x), py(y));
      }
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.font = '700 12px "Barlow", sans-serif';
      ctx.textAlign = "right";
      ctx.fillText(META[st.fn][0], x1 - 4, y1 + 14);
    }
    function setFn(name) {
      if (!META[name]) return;
      st.fn = name;
      chips.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-fn") === name); });
      nameEl.textContent = META[name][0];
      rangeEl.textContent = META[name][1];
      shapeEl.textContent = META[name][2];
      draw();
    }
    chips.forEach(function (b) {
      b.addEventListener("click", function () { setFn(b.getAttribute("data-fn")); });
    });
    return {
      update: function (s) { if (s && s.fn) setFn(s.fn); },
      resize: draw,
      destroy: function () { root.innerHTML = ""; }
    };
  }

  var CANVAS_DEMOS = { attention: 1, embedding: 1, transformer: 1, convolution: 1, sampling: 1, hyper: 1, activation: 1 };
  var INTERNAL_MORPH = { embedding: 1, hyper: 1, spacemorph: 1 };
  var FLOW_ON_STEP = {};
  var ELEMENT_ANIM = { attention: 1, transformer: 1, convolution: 1, sampling: 1, activation: 1 };
  var DEMOS = {
    attention: demoAttention,
    embedding: demoEmbedding,
    transformer: demoTransformer,
    convolution: demoConvolution,
    sampling: demoSampling,
    hyper: demoHyper,
    activation: demoActivation,
    history: demoHistory,
    spacemorph: demoSpaceMorph
  };


  function filterDays(days, track) {
    return (days || []).filter(function (d) {
      return !track || track === "all" || d.track === track;
    });
  }
  function normalizePrefs(raw) {
    raw = raw || {};
    var depths = ["short", "standard", "deep"];
    return {
      track: typeof raw.track === "string" && raw.track ? raw.track : "all",
      depth: depths.indexOf(raw.depth) >= 0 ? raw.depth : "standard",
      font: normalizeFont(raw.font),
      day: Math.max(0, parseInt(raw.day, 10) || 0),
      step: Math.max(0, parseInt(raw.step, 10) || 0)
    };
  }
  var SCENE_TYPES = ["rect", "circle", "point", "line", "arc", "label", "bar", "image", "mesh"];
  function sceneValidate(scene) {
    if (!scene || !Array.isArray(scene.primitives)) throw new Error("scene.primitives must be an array");
    var seen = {};
    scene.primitives.forEach(function (p) {
      if (!p || typeof p.id !== "string" || !p.id) throw new Error("primitive id required");
      if (seen[p.id]) throw new Error("duplicate primitive id: " + p.id);
      seen[p.id] = 1;
      if (SCENE_TYPES.indexOf(p.type) < 0) throw new Error("unknown primitive type: " + p.type);
    });
    return true;
  }
  function sceneDiff(prev, next) {
    var p = (prev && prev.primitives) || [];
    var n = (next && next.primitives) || [];
    var pm = {}, nm = {};
    p.forEach(function (x) { pm[x.id] = x; });
    n.forEach(function (x) { nm[x.id] = x; });
    var persistent = [], exit = [], enter = [];
    Object.keys(pm).forEach(function (id) {
      if (nm[id]) persistent.push({ id: id, prev: pm[id], next: nm[id] });
      else exit.push(pm[id]);
    });
    Object.keys(nm).forEach(function (id) { if (!pm[id]) enter.push(nm[id]); });
    return {
      persistent: persistent,
      exit: exit,
      enter: enter,
      camera: { prev: (prev && prev.camera) || null, next: (next && next.camera) || null }
    };
  }
  function isNum(v) { return typeof v === "number" && isFinite(v); }
  function lerpFields(a, b, t) {
    if (isNum(a) && isNum(b)) return lerp(a, b, t);
    if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
      return a.map(function (v, i) { return lerpFields(v, b[i], t); });
    }
    if (a && b && typeof a === "object" && typeof b === "object") {
      var o = {};
      Object.keys(b).forEach(function (k) { o[k] = lerpFields(a[k], b[k], t); });
      return o;
    }
    return t < 0.5 ? a : b;
  }
  function sceneInterpolate(prev, next, t) {
    var e = ease(clamp(t, 0, 1));
    var d = sceneDiff(prev, next);
    var out = [];
    d.persistent.forEach(function (p) { out.push(lerpFields(p.prev, p.next, e)); });
    if (e < 0.5) {
      d.exit.forEach(function (x) {
        out.push(lerpFields(x, Object.assign({}, x, { opacity: 0 }), e * 2));
      });
    } else {
      d.enter.forEach(function (x) {
        out.push(lerpFields(Object.assign({}, x, { opacity: 0 }), x, (e - 0.5) * 2));
      });
    }
    return {
      camera: lerpFields(d.camera.prev || {}, d.camera.next || {}, e),
      primitives: out
    };
  }
  function sceneRender(ctx, scene, opts) {
    opts = opts || {};
    (scene.primitives || []).forEach(function (p) {
      ctx.save();
      ctx.globalAlpha = p.opacity == null ? 1 : p.opacity;
      if (p.type === "rect") {
        ctx.fillStyle = p.fill || "transparent";
        if (p.fill) ctx.fillRect(p.x, p.y, p.w, p.h);
        if (p.stroke) {
          ctx.strokeStyle = p.stroke;
          ctx.lineWidth = p.lineWidth || 1;
          ctx.strokeRect(p.x, p.y, p.w, p.h);
        }
      } else if (p.type === "circle" || p.type === "point") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r || 4, 0, Math.PI * 2);
        if (p.fill) { ctx.fillStyle = p.fill; ctx.fill(); }
        if (p.stroke) { ctx.strokeStyle = p.stroke; ctx.lineWidth = p.lineWidth || 1; ctx.stroke(); }
      } else if (p.type === "line") {
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y1);
        ctx.lineTo(p.x2, p.y2);
        ctx.strokeStyle = p.stroke || "#000";
        ctx.lineWidth = p.lineWidth || 1;
        ctx.stroke();
      } else if (p.type === "arc") {
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y1);
        ctx.quadraticCurveTo(p.cx, p.cy, p.x2, p.y2);
        ctx.strokeStyle = p.stroke || "#000";
        ctx.lineWidth = p.lineWidth || 1;
        ctx.stroke();
      } else if (p.type === "label") {
        ctx.fillStyle = p.fill || "#000";
        ctx.font = p.font || '600 12px "Open Sans", sans-serif';
        ctx.textAlign = p.align || "left";
        ctx.textBaseline = p.baseline || "alphabetic";
        ctx.fillText(p.text || "", p.x, p.y);
      } else if (p.type === "bar") {
        ctx.fillStyle = p.track || "rgba(0,75,111,.07)";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = p.fill || "#63a44b";
        ctx.fillRect(p.x, p.y, p.w * clamp(p.value || 0, 0, 1), p.h);
      } else if (p.type === "image") {
        if (p.image) ctx.drawImage(p.image, p.x, p.y, p.w, p.h);
      } else if (p.type === "mesh") {
        var pts = p.vertices || [];
        if (pts.length) {
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
          ctx.closePath();
          if (p.fill) { ctx.fillStyle = p.fill; ctx.fill(); }
          if (p.stroke) { ctx.strokeStyle = p.stroke; ctx.lineWidth = p.lineWidth || 1; ctx.stroke(); }
        }
      }
      ctx.restore();
    });
  }
  function sceneFromCanvas(canvas) {
    return {
      camera: null,
      primitives: [{
        id: "canvas", type: "image", x: 0, y: 0,
        w: canvas.width, h: canvas.height, image: canvas, opacity: 1
      }]
    };
  }
  var DEMO_META = {};
  DEMO_META.attention = { tier: 1, label: "Attention", staticLayer: false };
  DEMO_META.embedding = { tier: 2, label: "Embedding", staticLayer: false };
  DEMO_META.transformer = { tier: 2, label: "Transformer", staticLayer: true };
  DEMO_META.convolution = { tier: 2, label: "Convolution", staticLayer: true };
  DEMO_META.sampling = { tier: 1, label: "Sampling", staticLayer: false };
  DEMO_META.hyper = { tier: 2, label: "Hyperparameter", staticLayer: false };
  DEMO_META.activation = { tier: 1, label: "Aktivierung", staticLayer: false };
  DEMO_META.history = { tier: 1, label: "Geschichte", staticLayer: false };
  DEMO_META.spacemorph = { tier: 0, label: "Space Morph", staticLayer: false, iframe: true };
  function defineDemo(name, factory, meta) {
    DEMOS[name] = factory;
    DEMO_META[name] = meta || {};
  }
  LS.version = "2.0";
  LS.lang = function () { return LANG; };
  LS.t = t;
  LS.motion = { step: 180, day: 180, camera: 240, text: 70, enter: 160, exit: 120, stagger: 40 };
  LS.util = {
    clamp: clamp, lerp: lerp, ease: ease, normSpace: normSpace,
    normalizeFont: normalizeFont, fontLevels: FONT_LEVELS, fontMin: FONT_MIN, fontMax: FONT_MAX,
    filterDays: filterDays, normalizePrefs: normalizePrefs
  };
  LS.scene = {
    types: SCENE_TYPES, validate: sceneValidate, diff: sceneDiff,
    interpolate: sceneInterpolate, render: sceneRender, fromCanvas: sceneFromCanvas
  };
  LS.defineDemo = defineDemo;
  LS.getDemoMeta = function (name) { return DEMO_META[name] || {}; };
  LS.prefs = { normalize: normalizePrefs, key: KEY };

  LS.mount = function (el, config) {
    root = el;
    cfg = config;
    setLang(cfg.lang);
    load();
    if (!cfg.tracks) cfg.tracks = [];
    cfg.tracks.forEach(function (t) { TRACK_LABEL[t.id] = t; });
    if (state.track !== "all" && !TRACK_LABEL[state.track]) state.track = "all";
    if (state.day >= cfg.days.length) state.day = 0;
    if (cfg.mix && cfg.days.length) {
      state.track = "all";
      state.day = typeof cfg.startDay === "number" ? clamp(cfg.startDay, 0, cfg.days.length - 1) : Math.floor(Math.random() * cfg.days.length);
      if (cfg.singleDay) state.day = typeof cfg.startDay === "number" ? clamp(cfg.startDay, 0, cfg.days.length - 1) : 0;
      state.step = 0;
    }
    if (cfg.singleDay && cfg.days.length === 1 && state.step >= cfg.days[0].steps.length) state.step = 0;
    if (state.track !== "all") {
      var trackDays = cfg.days.filter(function (d) { return d.track === state.track; });
      if (trackDays.length && trackDays.indexOf(cfg.days[state.day]) === -1) {
        state.day = cfg.days.indexOf(trackDays[0]);
        state.step = 0;
      }
    }
    buildUI();
    bind();
    renderAll();
  };
  LS.state = function () { return state; };
  LS.setTrack = setTrack;
  LS.setDepth = setDepth;
  LS.setFont = setFont;
  LS.openAll = openAllDepth;
  LS.go = go;
  LS.goDay = goDay;
  LS.shuffle = shuffle;
  LS.goPosition = goPosition;
  LS.prevDay = prevDay;
  LS.nextDay = nextDay;
  LS.days = function () { return cfg.days.map(function (d) { return { id: d.id, label: d.label, title: d.title, track: d.track, demo: d.demo, steps: d.steps.length }; }); };
  if (typeof module !== "undefined" && module.exports) module.exports = LS;
  if (typeof window !== "undefined") window.LearnSys = LS;
})();
