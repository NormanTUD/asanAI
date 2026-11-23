(function () {
  "use strict";

  var wheel = document.getElementById("zm-wheel");
  var marks = document.getElementById("zm-wheel-marks");
  var hand = document.getElementById("zm-wheel-hand");
  var yearEl = document.getElementById("zm-year");
  var wheelCount = document.getElementById("zm-wheel-count");
  var tabs = document.getElementById("zm-tabs");
  var eraEl = document.getElementById("zm-era");
  var titleEl = document.getElementById("zm-title");
  var textEl = document.getElementById("zm-text");
  var art = document.getElementById("zm-art");
  var threadEl = document.getElementById("zm-thread");
  var sourceEl = document.getElementById("zm-source");
  var readout = document.getElementById("zm-readout");
  var countEl = document.getElementById("zm-count");
  if (!wheel || !art) return;

  var STATIONS = [
    {
      year: "ca. 30.000 BP",
      short: ["Knochen", "bone"],
      era: ["Ganz früh", "Deep past"],
      title: ["Kerben im Wolfsknochen", "Notches in a wolf bone"],
      text: [
        "Der Wolfsknochen von Dolní Věstonice trägt 55 Kerben, in zwei Gruppen von 30 und 25; die Datierung liegt bei etwa 27.000 Jahren vor heute. Die Kerben sind wahrscheinlich Zählmarken, keine Schrift; die Deutung ist umstritten. Der Ishango-Knochen aus dem Kongo, rund 20.000 Jahre alt, zeigt ebenfalls Gruppen von Kerben. Rechnen beginnt als gegenständliches Zählen.",
        "The wolf bone from Dolní Věstonice carries 55 notches in two groups of 30 and 25; it is dated to about 27,000 years before present. The notches are probably tally marks, not writing; their interpretation is disputed. The Ishango bone from the Congo, about 20,000 years old, also shows groups of notches. Arithmetic begins as embodied counting."
      ],
      hint: ["Klicke Kerben an. Die Gruppen sind 30 und 25; zusammen 55.", "Click notches. The groups are 30 and 25; together 55."],
      source: { label: "Wikipedia: Tally stick", url: "https://en.wikipedia.org/wiki/Tally_stick" },
      thread: [false, true, false, false]
    },
    {
      year: "1305",
      short: ["Llull", "Llull"],
      era: ["Logik · Llull", "Logic · Llull"],
      title: ["Denken als Regelwerk", "Thought as a rulebook"],
      text: [
        "Aristoteles ordnet Schlüsse in Formen; Pāṇini beschreibt Sanskrit-Grammatik als Regelsystem. Llull kombiniert auf den drehenden Scheiben seiner Ars Magna (1305) Begriffe mechanisch. Die Idee: Denken lässt sich als Regelwerk schreiben und mit einer Maschine kombinieren, nicht nur als Erfahrung.",
        "Aristotle arranges inferences into forms; Pāṇini describes Sanskrit grammar as a system of rules. Llull combines concepts mechanically on the rotating discs of his Ars Magna (1305). The idea: thinking can be written as a rulebook and combined by a machine, not only lived as experience."
      ],
      hint: ["Drehe die beiden Scheiben. Die Kombination ist ein erzeugter Satz, keine Wahrheit.", "Turn both discs. The combination is a generated sentence, not a truth."],
      source: { label: "Ramon Llull, Ars Magna (1305)", url: "https://blog.hnf.de/das-universum-des-ramon-llull/" },
      thread: [true, false, false, false]
    },
    {
      year: "1673–1843",
      short: ["Maschinen", "machines"],
      era: ["Maschinen", "Machines"],
      title: ["Rechnen wird mechanisch", "Calculation becomes mechanical"],
      text: [
        "Leibniz beginnt 1673 mit einer Rechenmaschine für alle vier Grundrechenarten; fertig wird sie 1694, arbeitet aber unzuverlässig. Babbage entwirft ab 1837 die Analytical Engine mit getrenntem Store und Mill; Ada Lovelace beschreibt 1843, wie darauf algorithmisch gerechnet werden kann. Mechanik und formale Regeln rücken zusammen.",
        "Leibniz begins a calculating machine for all four arithmetic operations in 1673; it is finished in 1694 but works unreliably. Babbage designs the Analytical Engine from 1837 with a separate store and mill; Ada Lovelace describes in 1843 how algorithms can run on it. Mechanics and formal rules move closer together."
      ],
      hint: ["Tippe eine Zahl und addiere sie. Die Maschine ist ein schematischer Nachbau.", "Enter a number and add it. The machine is a schematic reconstruction."],
      source: { label: "Wikipedia: Analytical Engine", url: "https://en.wikipedia.org/wiki/Analytical_Engine" },
      thread: [false, true, false, true]
    },
    {
      year: "1854",
      short: ["Boole", "Boole"],
      era: ["Logik als Algebra", "Logic as algebra"],
      title: ["Gesetze des Denkens", "Laws of thought"],
      text: [
        "Boole schreibt 1854 die Logik als Algebra. Aus Wahrheitswerten werden Symbole, aus Schlüssen Rechenregeln. Damit lässt sich prüfen, ob ein Schluss gültig ist, ohne an Bedeutung zu appellieren.",
        "Boole writes logic as algebra in 1854. Truth values become symbols, inferences become rules of calculation. That makes it possible to check whether an inference is valid without appealing to meaning."
      ],
      hint: ["Schalte A, B und C. Die Lampe zeigt A ∧ (B ∨ ¬C).", "Toggle A, B, and C. The lamp shows A ∧ (B ∨ ¬C)."],
      source: { label: "Boole (1854), An Investigation of the Laws of Thought", url: "https://archive.org/details/investigationofl00bool" },
      thread: [true, false, false, false]
    },
    {
      year: "1943–1949",
      short: ["Neuron", "neuron"],
      era: ["Neuron", "Neuron"],
      title: ["Das Neuron als Recheneinheit", "The neuron as a computing unit"],
      text: [
        "McCulloch und Pitts modellieren 1943 ein Neuron als logische Schwelle: ein Netz aus Alles-oder-nichts-Zellen, das Boolesche Funktionen berechnet. Hebb formuliert 1949 die erste einflussreiche Lernregel: Wenn Zelle A Zelle B wiederholt feuert, wächst die Verbindung. Die Kurzformel „neurons that fire together, wire together“ ist später; sie steht so nicht in Hebbs Buch.",
        "McCulloch and Pitts model a neuron as a logical threshold in 1943: a network of all-or-nothing cells that computes Boolean functions. Hebb formulates the first influential learning rule in 1949: when cell A repeatedly fires cell B, the connection grows. The slogan “neurons that fire together, wire together” is later; it is not in Hebb's book in that form."
      ],
      hint: ["Schalte die Eingänge und die Schwelle. Zwei Eingänge mit Schwelle 2 ergeben AND.", "Toggle the inputs and the threshold. Two inputs with threshold 2 give AND."],
      source: { label: "McCulloch & Pitts (1943)", url: "https://doi.org/10.1007/BF02478259" },
      thread: [true, false, true, false]
    },
    {
      year: "1958–1973",
      short: ["Perzeptron", "perceptron"],
      era: ["Perzeptron", "Perceptron"],
      title: ["Eine Linie reicht nicht", "One line is not enough"],
      text: [
        "1958 präsentiert Rosenblatt das Perzeptron; die erste Software lief 1957 auf einer IBM 704, die Mark-I-Hardware baute sein Team zwischen 1959 und 1960. Die Maschine liest 400 Photozellen und lernt linear trennbare Muster. 1969 zeigen Minsky und Papert, dass eine einzelne Schicht XOR nicht lösen kann; 1973 verstärkt der Lighthill-Bericht den ersten KI-Winter.",
        "Rosenblatt presents the perceptron in 1958; the first software ran in 1957 on an IBM 704, and his team built the Mark I hardware between 1959 and 1960. The machine reads 400 photocells and learns linearly separable patterns. In 1969 Minsky and Papert show that a single layer cannot solve XOR; in 1973 the Lighthill report deepens the first AI winter."
      ],
      hint: ["Ziehe an den Gewichten. Lade XOR und sieh, warum eine Gerade nicht reicht.", "Pull the weights. Load XOR and see why one line is not enough."],
      source: { label: "Minsky & Papert (1969), Perceptrons", url: "https://archive.org/details/perceptronsintro0000mins" },
      thread: [false, false, true, true]
    },
    {
      year: "2014–2022",
      short: ["Transformer", "transformer"],
      era: ["Attention", "Attention"],
      title: ["Attention ersetzt die Schleife", "Attention replaces the loop"],
      text: [
        "Bahdanau, Cho und Bengio lassen 2014 den Decoder auf die Eingabewörter zurückblicken. 2017 ersetzt der Transformer die wiederkehrende Verarbeitung durch Self-Attention und fügt Positionsinformation hinzu. 2018 zeigt GPT-1 Pretraining plus Fine-Tuning, 2020 GPT-3 mit 175 Milliarden Parametern Few-Shot; 2022 zeigt InstructGPT SFT plus RLHF.",
        "Bahdanau, Cho, and Bengio let the decoder look back at the input words in 2014. In 2017 the Transformer replaces recurrence with self-attention and adds positional information. In 2018 GPT-1 shows pretraining plus fine-tuning, in 2020 GPT-3 with 175 billion parameters shows few-shot; in 2022 InstructGPT shows SFT plus RLHF."
      ],
      hint: ["Klicke ein Token. Die Balken zeigen, wie stark es die anderen liest.", "Click a token. The bars show how strongly it reads the others."],
      source: { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" },
      thread: [false, false, true, true]
    }
  ];

  var THREADS = [
    ["Logik", "Logic"],
    ["Mechanik", "Mechanics"],
    ["Lernen", "Learning"],
    ["Hardware", "Hardware"]
  ];

  var state = { index: 0 };
  var artifactResize = null;
  var artifactRedraw = null;

  function L(de, en) { return T2.t(de, en); }
  function station() { return STATIONS[state.index]; }

  function buildTabs() {
    tabs.innerHTML = STATIONS.map(function (s, i) {
      return '<button type="button" class="proto-chip' + (i === state.index ? ' is-on' : '') + '" data-zm-tab="' + i + '" role="tab" aria-selected="' + (i === state.index ? 'true' : 'false') + '">' + L(s.short[0], s.short[1]) + '</button>';
    }).join("");
    tabs.querySelectorAll("[data-zm-tab]").forEach(function (b) {
      b.addEventListener("click", function () { setStation(parseInt(b.getAttribute("data-zm-tab"), 10)); });
    });
  }

  function renderWheel() {
    var NS = "http://www.w3.org/2000/svg";
    marks.innerHTML = "";
    var R = 78;
    for (var i = 0; i < STATIONS.length; i++) {
      var a = (-90 + i * (360 / STATIONS.length)) * Math.PI / 180;
      var x = 110 + Math.cos(a) * R;
      var y = 110 + Math.sin(a) * R;
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("class", "zm-mark" + (i === state.index ? " is-on" : ""));
      c.setAttribute("cx", x.toFixed(1));
      c.setAttribute("cy", y.toFixed(1));
      c.setAttribute("r", i === state.index ? "7.5" : "5.5");
      c.setAttribute("data-station", String(i));
      c.setAttribute("tabindex", "0");
      c.setAttribute("role", "button");
      c.setAttribute("aria-label", L("Station ", "Station ") + (i + 1) + ": " + L(STATIONS[i].title[0], STATIONS[i].title[1]));
      marks.appendChild(c);
      var t = document.createElementNS(NS, "text");
      t.setAttribute("class", "zm-mark-label");
      t.setAttribute("x", x.toFixed(1));
      t.setAttribute("y", (y + 2.8).toFixed(1));
      t.textContent = "0" + (i + 1);
      marks.appendChild(t);
    }
    var activeA = (-90 + state.index * (360 / STATIONS.length)) * Math.PI / 180;
    hand.setAttribute("x2", (110 + Math.cos(activeA) * 78).toFixed(1));
    hand.setAttribute("y2", (110 + Math.sin(activeA) * 78).toFixed(1));
    yearEl.textContent = station().year;
    wheelCount.textContent = "0" + (state.index + 1) + " / 0" + STATIONS.length;
    wheel.setAttribute("aria-valuenow", String(state.index + 1));
    wheel.setAttribute("aria-valuetext", L("Station ", "station ") + (state.index + 1) + ": " + L(station().title[0], station().title[1]));
    countEl.textContent = L("Station ", "Station ") + (state.index + 1) + " / " + STATIONS.length;
  }

  function renderCard() {
    var s = station();
    eraEl.textContent = L(s.era[0], s.era[1]);
    titleEl.textContent = L(s.title[0], s.title[1]);
    textEl.textContent = L(s.text[0], s.text[1]);
    sourceEl.innerHTML = '<b>' + L("Quelle", "Source") + ':</b> <a href="' + s.source.url + '" target="_blank" rel="noopener">' + T2.esc(s.source.label) + '</a>';
    threadEl.innerHTML = THREADS.map(function (t, i) {
      return '<span class="' + (s.thread[i] ? "is-on" : "") + '"><i></i>' + L(t[0], t[1]) + '</span>';
    }).join("");
    art.innerHTML = "";
    artifactResize = null;
    artifactRedraw = null;
    buildArtifact(state.index, art);
    readout.innerHTML = T2.esc(L(s.hint[0], s.hint[1]));
    requestAnimationFrame(function () {
      if (artifactResize) { try { artifactResize(); } catch (e) {} }
    });
  }

  function setStation(i) {
    state.index = T2.clamp(i, 0, STATIONS.length - 1);
    renderWheel();
    buildTabs();
    renderCard();
  }

  /* ---------- artefacts ---------- */

  function buildArtifact(index, host) {
    if (index === 0) buildBone(host);
    else if (index === 1) buildLlull(host);
    else if (index === 2) buildLeibniz(host);
    else if (index === 3) buildBoole(host);
    else if (index === 4) buildNeuron(host);
    else if (index === 5) buildPerceptron(host);
    else buildAttention(host);
  }

  function buildBone(host) {
    var wrap = document.createElement("div");
    wrap.className = "zm-bone";
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 420 150");
    svg.innerHTML =
      '<path class="bone-body" d="M54 42c-12-18 16-30 30-16h252c14-14 42-2 30 16 14 4 14 46 0 50 12 18-16 30-30 16H84c-14 14-42 2-30-16-14-4-14-46 0-50Z"/>';
    var groupA = document.createElementNS(ns, "text");
    groupA.setAttribute("class", "bone-group-label");
    groupA.setAttribute("x", "160");
    groupA.setAttribute("y", "128");
    groupA.textContent = "30";
    var groupB = document.createElementNS(ns, "text");
    groupB.setAttribute("class", "bone-group-label");
    groupB.setAttribute("x", "302");
    groupB.setAttribute("y", "128");
    groupB.textContent = "25";
    svg.appendChild(groupA);
    svg.appendChild(groupB);
    for (var i = 0; i < 55; i++) {
      var x = 92 + (i < 30 ? i * 4.2 : 30 * 4.2 + 14 + (i - 30) * 4.2);
      var line = document.createElementNS(ns, "line");
      line.setAttribute("class", "notch");
      line.setAttribute("x1", x.toFixed(1));
      line.setAttribute("x2", x.toFixed(1));
      line.setAttribute("y1", i % 2 ? "48" : "54");
      line.setAttribute("y2", i % 2 ? "92" : "86");
      line.setAttribute("data-notch", String(i));
      svg.appendChild(line);
    }
    wrap.appendChild(svg);
    var tools = document.createElement("div");
    tools.className = "zm-bone-tools";
    var count = document.createElement("span");
    count.className = "zm-bone-count";
    var groupBtn = document.createElement("button");
    groupBtn.type = "button";
    groupBtn.className = "proto-btn proto-btn--ghost";
    groupBtn.textContent = L("Gruppen zeigen", "Show groups");
    tools.appendChild(count);
    tools.appendChild(groupBtn);
    wrap.appendChild(tools);
    host.appendChild(wrap);
    var counted = 0;
    function updateBone() {
      count.textContent = counted + " / 55 " + L("Kerben", "notches");
      readout.innerHTML = counted === 0
        ? T2.esc(L("Klicke eine Kerbe an. Die Gruppen sind 30 und 25.", "Click a notch. The groups are 30 and 25."))
        : T2.esc(L("Du hast " + counted + " Kerben gezählt. Die Gruppen sind 30 und 25; zusammen 55.", "You counted " + counted + " notches. The groups are 30 and 25; together 55."));
    }
    svg.addEventListener("click", function (e) {
      var n = e.target.closest ? e.target.closest("[data-notch]") : null;
      if (!n) return;
      n.classList.toggle("is-counted");
      counted = svg.querySelectorAll(".notch.is-counted").length;
      updateBone();
    });
    groupBtn.addEventListener("click", function () {
      var on = svg.querySelectorAll(".notch.is-group").length > 0;
      svg.querySelectorAll(".notch").forEach(function (n) { n.classList.toggle("is-group", !on); });
      groupBtn.textContent = on ? L("Gruppen zeigen", "Show groups") : L("Gruppen ausblenden", "Hide groups");
      readout.innerHTML = T2.esc(L(
        "Zwei Gruppen: 30 und 25. Zusammen 55. Die Deutung als Zählmarken ist plausibel, aber umstritten.",
        "Two groups: 30 and 25. Together 55. The reading as tally marks is plausible but disputed."
      ));
    });
    updateBone();
  }

  function buildLlull(host) {
    var A = L(
      "Güte|Größe|Ewigkeit|Macht|Weisheit|Liebe",
      "Goodness|Greatness|Eternity|Power|Wisdom|Love"
    ).split("|");
    var B = L(
      "Gott|Engel|Himmel|Mensch|Tier|Pflanze",
      "God|Angel|Heaven|Human|Animal|Plant"
    ).split("|");
    var ai = 0, bi = 0;
    var wrap = document.createElement("div");
    wrap.className = "zm-llull";
    function disc(labels, letter) {
      var d = document.createElement("div");
      d.className = "zm-disc";
      var ring = document.createElement("div");
      ring.className = "zm-disc-ring";
      d.appendChild(ring);
      labels.forEach(function (label, i) {
        var a = (-90 + i * 60) * Math.PI / 180;
        var span = document.createElement("span");
        span.textContent = label;
        span.style.left = (50 + Math.cos(a) * 37) + "%";
        span.style.top = (50 + Math.sin(a) * 37) + "%";
        span.setAttribute("data-i", String(i));
        d.appendChild(span);
      });
      var core = document.createElement("div");
      core.className = "zm-disc-core";
      core.textContent = letter;
      d.appendChild(core);
      return d;
    }
    var discA = disc(A, "A");
    var discB = disc(B, "B");
    var side = document.createElement("div");
    side.className = "zm-llull-side";
    var out = document.createElement("div");
    out.className = "zm-llull-out";
    var btnA = document.createElement("button");
    btnA.type = "button";
    btnA.className = "proto-btn proto-btn--ghost";
    btnA.textContent = L("A drehen", "Turn A");
    var btnB = document.createElement("button");
    btnB.type = "button";
    btnB.className = "proto-btn proto-btn--ghost";
    btnB.textContent = L("B drehen", "Turn B");
    side.appendChild(out);
    side.appendChild(btnA);
    side.appendChild(btnB);
    wrap.appendChild(discA);
    wrap.appendChild(discB);
    wrap.appendChild(side);
    host.appendChild(wrap);
    function updateLlull() {
      discA.querySelectorAll("span").forEach(function (s) { s.classList.toggle("is-on", parseInt(s.getAttribute("data-i"), 10) === ai); });
      discB.querySelectorAll("span").forEach(function (s) { s.classList.toggle("is-on", parseInt(s.getAttribute("data-i"), 10) === bi); });
      discA.querySelector(".zm-disc-ring").style.setProperty("--rot", (-ai * 60) + "deg");
      discB.querySelector(".zm-disc-ring").style.setProperty("--rot", (-bi * 60) + "deg");
      out.innerHTML = '<b>' + T2.esc(A[ai]) + '</b> · ' + T2.esc(B[bi]);
      readout.innerHTML = T2.esc(L(
        "Die Scheiben erzeugen " + A[ai] + " · " + B[bi] + ". Die Kombination ist mechanisch erzeugt; ob sie wahr ist, entscheidet sie nicht.",
        "The discs generate " + A[ai] + " · " + B[bi] + ". The combination is generated mechanically; whether it is true is not decided by the machine."
      ));
    }
    btnA.addEventListener("click", function () { ai = (ai + 1) % A.length; updateLlull(); });
    btnB.addEventListener("click", function () { bi = (bi + 1) % B.length; updateLlull(); });
    updateLlull();
  }

  function buildLeibniz(host) {
    var wrap = document.createElement("div");
    wrap.className = "zm-calc";
    var entry = "", total = 0;
    var display = document.createElement("div");
    display.className = "zm-calc-display";
    var displayValue = document.createElement("span");
    var displayLabel = document.createElement("small");
    display.appendChild(displayValue);
    display.appendChild(displayLabel);
    var gear = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    gear.setAttribute("class", "zm-gear");
    gear.setAttribute("viewBox", "0 0 24 24");
    gear.innerHTML = '<circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
    var keypad = document.createElement("div");
    keypad.className = "zm-keypad";
    var keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "C", "＋"];
    keys.forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "zm-key";
      b.textContent = k;
      b.addEventListener("click", function () {
        if (k === "C") { entry = ""; total = 0; updateCalc(); return; }
        if (k === "＋") {
          if (entry) {
            total += parseInt(entry, 10);
            entry = "";
            wrap.classList.add("is-working");
            setTimeout(function () { wrap.classList.remove("is-working"); }, 620);
          }
          updateCalc();
          return;
        }
        if (entry.length < 4) entry += k;
        updateCalc();
      });
      keypad.appendChild(b);
    });
    var row = document.createElement("div");
    row.className = "zm-calc-row";
    row.appendChild(gear);
    var label = document.createElement("span");
    label.className = "t2-meta";
    label.textContent = L("Summe", "Total");
    row.appendChild(label);
    wrap.appendChild(display);
    wrap.appendChild(keypad);
    wrap.appendChild(row);
    host.appendChild(wrap);
    function updateCalc() {
      displayValue.textContent = entry || String(total);
      displayLabel.textContent = entry ? L("Eingabe", "entry") : L("Summe", "total");
      readout.innerHTML = T2.esc(L(
        "Eingabe " + (entry || "0") + ", Summe " + total + ". Die Maschine addiert Ziffern für Ziffer; Übertrag und Mechanik sind hier schematisch.",
        "Entry " + (entry || "0") + ", total " + total + ". The machine adds digit by digit; carry and mechanics are schematic here."
      ));
    }
    updateCalc();
  }

  function buildBoole(host) {
    var wrap = document.createElement("div");
    wrap.className = "zm-bool";
    var formula = document.createElement("div");
    formula.className = "zm-bool-formula";
    formula.textContent = "A ∧ (B ∨ ¬C)";
    var row = document.createElement("div");
    row.className = "zm-bool-row";
    var lamp = document.createElement("div");
    lamp.className = "zm-lamp";
    var inputs = {};
    ["A", "B", "C"].forEach(function (name) {
      var label = document.createElement("label");
      label.className = "t2-switch";
      var input = document.createElement("input");
      input.type = "checkbox";
      input.checked = name !== "C";
      inputs[name] = input;
      var sw = document.createElement("span");
      label.appendChild(input);
      label.appendChild(sw);
      label.appendChild(document.createTextNode(name));
      row.appendChild(label);
    });
    wrap.appendChild(formula);
    wrap.appendChild(row);
    wrap.appendChild(lamp);
    host.appendChild(wrap);
    function updateBool() {
      var A = inputs.A.checked ? 1 : 0;
      var B = inputs.B.checked ? 1 : 0;
      var C = inputs.C.checked ? 1 : 0;
      var value = A && (B || !C) ? 1 : 0;
      lamp.textContent = String(value);
      lamp.classList.toggle("is-on", !!value);
      readout.innerHTML = T2.esc(L(
        "A=" + A + ", B=" + B + ", C=" + C + " → " + value + ". Die Form ist eine Rechenregel über Wahrheitswerten.",
        "A=" + A + ", B=" + B + ", C=" + C + " → " + value + ". The form is a rule of calculation over truth values."
      ));
    }
    Object.keys(inputs).forEach(function (k) { inputs[k].addEventListener("change", updateBool); });
    updateBool();
  }

  function buildNeuron(host) {
    var wrap = document.createElement("div");
    wrap.className = "zm-neuron";
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 220 100");
    svg.innerHTML =
      '<line class="syn" data-syn="a" x1="28" y1="30" x2="86" y2="50"/><line class="syn" data-syn="b" x1="28" y1="70" x2="86" y2="50"/><circle class="cell" data-cell="a" cx="22" cy="30" r="9"/><circle class="cell" data-cell="b" cx="22" cy="70" r="9"/><circle class="cell" data-cell="out" cx="100" cy="50" r="17"/><line class="syn" data-syn="out" x1="117" y1="50" x2="172" y2="50"/><circle class="cell" data-cell="lamp" cx="185" cy="50" r="13"/>';
    var labels = document.createElementNS("http://www.w3.org/2000/svg", "text");
    labels.setAttribute("x", "22");
    labels.setAttribute("y", "34");
    labels.setAttribute("text-anchor", "middle");
    labels.setAttribute("font-size", "9");
    labels.setAttribute("fill", "currentColor");
    labels.textContent = "A";
    var labels2 = labels.cloneNode(true);
    labels2.setAttribute("y", "74");
    labels2.textContent = "B";
    svg.appendChild(labels);
    svg.appendChild(labels2);
    var row = document.createElement("div");
    row.className = "zm-neuron-row";
    var btnA = document.createElement("button");
    btnA.type = "button";
    btnA.className = "proto-chip";
    btnA.textContent = "A = 0";
    var btnB = document.createElement("button");
    btnB.type = "button";
    btnB.className = "proto-chip";
    btnB.textContent = "B = 0";
    var th = document.createElement("input");
    th.type = "range";
    th.min = "1";
    th.max = "2";
    th.step = "1";
    th.value = "2";
    var thLabel = document.createElement("span");
    thLabel.className = "zm-neuron-sum";
    row.appendChild(btnA);
    row.appendChild(btnB);
    row.appendChild(th);
    row.appendChild(thLabel);
    var sumEl = document.createElement("div");
    sumEl.className = "zm-neuron-sum";
    wrap.appendChild(svg);
    wrap.appendChild(row);
    wrap.appendChild(sumEl);
    host.appendChild(wrap);
    var a = 0, b = 0;
    function updateNeuron() {
      var threshold = parseInt(th.value, 10);
      var sum = a + b;
      var fires = sum >= threshold;
      btnA.textContent = "A = " + a;
      btnB.textContent = "B = " + b;
      btnA.classList.toggle("is-on", !!a);
      btnB.classList.toggle("is-on", !!b);
      thLabel.textContent = L("Schwelle ", "threshold ") + threshold;
      sumEl.textContent = L("Summe ", "sum ") + sum + (fires ? L(" ≥ ", " ≥ ") : L(" < ", " < ")) + threshold;
      svg.querySelector('[data-syn="a"]').classList.toggle("is-on", !!a);
      svg.querySelector('[data-syn="b"]').classList.toggle("is-on", !!b);
      svg.querySelector('[data-cell="a"]').classList.toggle("is-on", !!a);
      svg.querySelector('[data-cell="b"]').classList.toggle("is-on", !!b);
      svg.querySelector('[data-cell="out"]').classList.toggle("is-on", fires);
      svg.querySelector('[data-syn="out"]').classList.toggle("is-on", fires);
      svg.querySelector('[data-cell="lamp"]').classList.toggle("is-on", fires);
      readout.innerHTML = T2.esc(L(
        "Summe " + sum + ", Schwelle " + threshold + ": " + (fires ? "das Neuron feuert." : "das Neuron feuert nicht.") + " Zwei Eingänge mit Schwelle 2 ergeben AND; mit Schwelle 1 ergibt sich OR.",
        "Sum " + sum + ", threshold " + threshold + ": " + (fires ? "the neuron fires." : "the neuron does not fire.") + " Two inputs with threshold 2 give AND; with threshold 1 it gives OR."
      ));
    }
    btnA.addEventListener("click", function () { a = a ? 0 : 1; updateNeuron(); });
    btnB.addEventListener("click", function () { b = b ? 0 : 1; updateNeuron(); });
    th.addEventListener("input", updateNeuron);
    updateNeuron();
  }

  function buildPerceptron(host) {
    var wrap = document.createElement("div");
    wrap.className = "zm-perceptron";
    var canvas = document.createElement("canvas");
    canvas.setAttribute("aria-label", L("Punkte zweier Klassen und eine Trennlinie", "Points of two classes and a separating line"));
    var side = document.createElement("div");
    side.className = "zm-perceptron-side";
    var acc = document.createElement("div");
    acc.className = "zm-perceptron-acc";
    var w1 = slider(L("w₁", "w₁"), -2, 2, 0.1, 0.9);
    var w2 = slider(L("w₂", "w₂"), -2, 2, 0.1, -0.6);
    var bias = slider(L("b", "b"), -2, 2, 0.1, 0);
    var btnXor = document.createElement("button");
    btnXor.type = "button";
    btnXor.className = "proto-btn proto-btn--ghost";
    btnXor.textContent = "XOR";
    var btnLin = document.createElement("button");
    btnLin.type = "button";
    btnLin.className = "proto-btn proto-btn--ghost";
    btnLin.textContent = L("Linear", "Linear");
    side.appendChild(acc);
    side.appendChild(w1.el);
    side.appendChild(w2.el);
    side.appendChild(bias.el);
    side.appendChild(btnXor);
    side.appendChild(btnLin);
    wrap.appendChild(canvas);
    wrap.appendChild(side);
    host.appendChild(wrap);
    var xor = false;
    var linear = [
      [-0.75, 0.55, 0], [-0.52, 0.18, 0], [-0.38, 0.72, 0], [-0.82, -0.12, 0],
      [0.62, -0.45, 1], [0.78, 0.12, 1], [0.42, -0.72, 1], [0.28, 0.52, 1]
    ];
    var xorData = [
      [-0.72, -0.72, 0], [0.72, 0.72, 0],
      [-0.72, 0.72, 1], [0.72, -0.72, 1]
    ];
    function data() { return xor ? xorData : linear; }
    function draw() {
      var box = T2.fit(canvas, canvas);
      var ctx = box.ctx, w = box.w, h = box.h;
      ctx.clearRect(0, 0, w, h);
      var pad = 16;
      function X(x) { return pad + ((x + 1.2) / 2.4) * (w - pad * 2); }
      function Y(y) { return h - pad - ((y + 1.2) / 2.4) * (h - pad * 2); }
      ctx.strokeStyle = T2.cssVar("--line") || "#d8d2c2";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad, Y(0)); ctx.lineTo(w - pad, Y(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(0), pad); ctx.lineTo(X(0), h - pad); ctx.stroke();
      var a = parseFloat(w1.input.value), b = parseFloat(w2.input.value), c = parseFloat(bias.input.value);
      var correct = 0;
      data().forEach(function (p) {
        var pred = (a * p[0] + b * p[1] + c) >= 0 ? 1 : 0;
        if (pred === p[2]) correct++;
        ctx.beginPath();
        ctx.arc(X(p[0]), Y(p[1]), 5, 0, Math.PI * 2);
        ctx.fillStyle = p[2] ? (T2.cssVar("--green") || "#63a44b") : (T2.cssVar("--rose") || "#c0565a");
        ctx.globalAlpha = 0.92;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgba(0,0,0,.18)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      ctx.save();
      ctx.strokeStyle = T2.cssVar("--ink") || "#1b2a2b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (Math.abs(b) > 0.02) {
        var y1 = -(a * -1.2 + c) / b;
        var y2 = -(a * 1.2 + c) / b;
        ctx.moveTo(X(-1.2), Y(y1));
        ctx.lineTo(X(1.2), Y(y2));
      } else if (Math.abs(a) > 0.02) {
        var xv = -c / a;
        ctx.moveTo(X(xv), Y(-1.2));
        ctx.lineTo(X(xv), Y(1.2));
      }
      ctx.stroke();
      ctx.restore();
      var accuracy = correct / data().length;
      acc.textContent = L("Genauigkeit ", "accuracy ") + accuracy.toFixed(2);
      readout.innerHTML = T2.esc(xor
        ? L("XOR: Eine einzelne Gerade trennt die Klassen nicht. Genauigkeit " + accuracy.toFixed(2) + ". Das ist die Grenze, die Minsky und Papert 1969 betonen.", "XOR: a single line does not separate the classes. Accuracy " + accuracy.toFixed(2) + ". That is the limit Minsky and Papert stress in 1969.")
        : L("Linear trennbar: Eine Gerade kann die Klassen trennen. Genauigkeit " + accuracy.toFixed(2) + ". Ziehe an den Gewichten.", "Linearly separable: one line can separate the classes. Accuracy " + accuracy.toFixed(2) + ". Pull the weights."));
    }
    function slider(label, min, max, step, value) {
      var el = document.createElement("label");
      el.className = "t2-range";
      var span = document.createElement("span");
      span.textContent = label + " " + value;
      var input = document.createElement("input");
      input.type = "range";
      input.min = min; input.max = max; input.step = step; input.value = value;
      el.appendChild(span);
      el.appendChild(input);
      input.addEventListener("input", function () {
        span.textContent = label + " " + parseFloat(input.value).toFixed(1);
        draw();
      });
      return { el: el, input: input };
    }
    btnXor.addEventListener("click", function () { xor = true; draw(); });
    btnLin.addEventListener("click", function () { xor = false; draw(); });
    artifactResize = draw;
    artifactRedraw = draw;
    requestAnimationFrame(draw);
  }

  function buildAttention(host) {
    var tokens = L("Die|Katze|sitzt|auf|der", "The|cat|sat|on|the").split("|");
    var wrap = document.createElement("div");
    wrap.className = "zm-attn";
    var tokenRow = document.createElement("div");
    tokenRow.className = "zm-attn-tokens";
    var bars = document.createElement("div");
    bars.className = "zm-attn-bars";
    var note = document.createElement("p");
    note.className = "zm-attn-note";
    note.textContent = L("Self-Attention: jedes Token liest alle anderen. Die Gewichte sind schematisch.", "Self-attention: every token reads all others. The weights are schematic.");
    wrap.appendChild(tokenRow);
    wrap.appendChild(bars);
    wrap.appendChild(note);
    host.appendChild(wrap);
    var weights = tokens.map(function (_, i) {
      var row = tokens.map(function (_, j) { return 1 / (1 + Math.abs(i - j)) + ((i * 3 + j * 5) % 4) * 0.18; });
      var sum = row.reduce(function (a, b) { return a + b; }, 0);
      return row.map(function (v) { return v / sum; });
    });
    var selected = 1;
    function render() {
      tokenRow.innerHTML = tokens.map(function (t, i) {
        return '<button type="button" class="proto-chip' + (i === selected ? ' is-on' : '') + '" data-tok="' + i + '">' + t + '</button>';
      }).join("");
      tokenRow.querySelectorAll("[data-tok]").forEach(function (b) {
        b.addEventListener("click", function () { selected = parseInt(b.getAttribute("data-tok"), 10); render(); });
      });
      var row = weights[selected];
      bars.innerHTML = tokens.map(function (t, j) {
        return '<div class="zm-attn-row"><span>' + t + '</span><div class="zm-attn-track"><i style="width:' + (row[j] * 100).toFixed(0) + '%"></i></div><b>' + Math.round(row[j] * 100) + '%</b></div>';
      }).join("");
      var top = row.indexOf(Math.max.apply(null, row));
      readout.innerHTML = T2.esc(L(
        "„" + tokens[selected] + "“ liest vor allem „" + tokens[top] + "“ (" + Math.round(row[top] * 100) + " %). Attention mischt die Values der anderen Tokens; sie ersetzt die Schleife, nicht die Positionsinformation.",
        "“" + tokens[selected] + "” reads mostly “" + tokens[top] + "” (" + Math.round(row[top] * 100) + "%). Attention mixes the values of the other tokens; it replaces the loop, not positional information."
      ));
    }
    render();
  }

  /* wheel interaction */
  var drag = null;
  wheel.addEventListener("click", function (e) {
    var mark = e.target.closest ? e.target.closest("[data-station]") : null;
    if (mark) setStation(parseInt(mark.getAttribute("data-station"), 10));
  });
  wheel.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); setStation(state.index + 1); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); setStation(state.index - 1); }
    else if (e.key === "Home") { e.preventDefault(); setStation(0); }
    else if (e.key === "End") { e.preventDefault(); setStation(STATIONS.length - 1); }
    else if (e.key === "Enter" || e.key === " ") {
      var t = document.activeElement;
      if (t && t.getAttribute("data-station") != null) { e.preventDefault(); setStation(parseInt(t.getAttribute("data-station"), 10)); }
    }
  });
  wheel.addEventListener("pointerdown", function (e) {
    drag = { x: e.clientX, y: e.clientY };
    try { wheel.setPointerCapture(e.pointerId); } catch (err) {}
  });
  wheel.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) < 26 && Math.abs(dy) < 26) return;
    if (Math.abs(dx) >= Math.abs(dy)) setStation(state.index + (dx > 0 ? 1 : -1));
    else setStation(state.index + (dy > 0 ? 1 : -1));
    drag = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener("pointerup", function () { drag = null; });

  document.querySelectorAll("[data-zm-prev]").forEach(function (b) { b.addEventListener("click", function () { setStation(state.index - 1); }); });
  document.querySelectorAll("[data-zm-next]").forEach(function (b) { b.addEventListener("click", function () { setStation(state.index + 1); }); });

  T2.onLang(function () { renderWheel(); buildTabs(); renderCard(); });
  T2.onTheme(function () { if (artifactRedraw) { try { artifactRedraw(); } catch (e) {} } });
  T2.onResize(art, function () { if (artifactResize) { try { artifactResize(); } catch (e) {} } });

  renderWheel();
  buildTabs();
  renderCard();
})();
