(function () {
  "use strict";

  var world = document.getElementById("th-world");
  var canvas = document.getElementById("th-canvas");
  var workspace = document.getElementById("th-workspace");
  var wsKicker = document.getElementById("th-ws-kicker");
  var wsCore = document.getElementById("th-ws-core");
  var wsNote = document.getElementById("th-ws-note");
  var art = document.getElementById("th-art");
  var readout = document.getElementById("th-readout");
  var phiEl = document.getElementById("th-phi");
  var phiBar = document.getElementById("th-phi-bar");
  var theoryName = document.getElementById("th-theory-name");
  var theoryAbout = document.getElementById("th-theory-about");
  var seats = document.getElementById("th-seats");
  if (!world || !canvas) return;

  var MODULES = ["vision", "language", "memory", "emotion", "motor"];
  var moduleEls = {};
  var cutEls = {};
  var centers = {};
  var wsCenter = { x: 0, y: 0 };
  var canvasBox = null;
  var iitNodes = [];

  var state = {
    theory: "workspace",
    mode: "access",
    live: { vision: true, language: true, memory: true, emotion: true, motor: true },
    stimulus: "apple",
    broadcasted: false,
    dissociated: false
  };

  var THEORIES = {
    workspace: {
      name: ["Global Workspace", "Global workspace"],
      about: [
        "Viele Subsysteme rechnen getrennt und schreiben nur ihre Ergebnisse in einen gemeinsamen Arbeitsraum. Dort stehen Ergebnisse für Bericht, Kontrolle und Schlussfolgerungen bereit, nicht die Wege, auf denen sie entstanden sind.",
        "Many subsystems compute separately and write only their results into a shared workspace. There the results are available for report, control, and inference, not the paths that produced them."
      ],
      note: ["niemand sitzt im Zuschauerraum", "no one sits in the audience"],
      core: ["●", "●"]
    },
    iit: {
      name: ["IIT · Phi", "IIT · Phi"],
      about: [
        "Bewusstsein ist die geeinte Ursache-Wirkungs-Struktur eines Systems. Phi misst, wie irreduzibel diese Struktur ist. Kappe Leitungen und sieh, wie die Struktur in Teile zerfällt.",
        "Consciousness is a system's unified cause-effect structure. Phi measures how irreducible that structure is. Cut lines and watch the structure fall apart."
      ],
      note: ["Phi ist hier schematisch", "Phi is schematic here"],
      core: ["Φ", "Φ"]
    },
    predictive: {
      name: ["Predictive Processing", "Predictive processing"],
      about: [
        "Das Gehirn sagt Sinnesdaten voraus und minimiert Überraschung oder freie Energie. Wahrnehmung ist kontrollierte Halluzination. Der Workspace zeigt die beste Vorhersage; Fehler wandern zurück.",
        "The brain predicts sensory input and minimises surprise or free energy. Perception is controlled hallucination. The workspace shows the best prediction; errors travel back."
      ],
      note: ["Vorhersage und Fehler", "prediction and error"],
      core: ["P", "P"]
    },
    idealism: {
      name: ["Analytischer Idealismus", "Analytic idealism"],
      about: [
        "Nicht Materie erzeugt Bewusstsein, sondern Bewusstsein ist fundamental. Materie ist die Außenseite mentaler Prozesse; individuelle Geister sind dissoziierte Teile eines universalen Bewusstseins.",
        "Matter does not produce consciousness; consciousness is fundamental. Matter is the outside view of mental processes; individual minds are dissociated parts of a universal consciousness."
      ],
      note: ["ein Feld, viele Perspektiven", "one field, many perspectives"],
      core: ["1", "1"]
    },
    mysterian: {
      name: ["Mysterianismus", "Mysterianism"],
      about: [
        "Bewusstsein könnte eine kognitive Grenze sein: Ratten lernen ein Labyrinth, aber keine Gleichungen. Die Wand markiert die Grenze unserer Erklärbarkeit, nicht eine Antwort.",
        "Consciousness may be a cognitive limit: rats learn a maze but not equations. The wall marks the limit of our explainability, not an answer."
      ],
      note: ["die Grenze liegt außerhalb", "the limit lies beyond"],
      core: ["?", "?"]
    }
  };

  var STIMULI = {
    apple: {
      modules: ["vision", "emotion"],
      core: ["Apfel", "apple"],
      short: ["Roter Apfel", "red apple"],
      sense: ["ein rotes, rundes Ding", "a red, round thing"]
    },
    word: {
      modules: ["language", "memory"],
      core: ["„Apfel“", "“apple”"],
      short: ["Das Wort „Apfel“", "the word “apple”"],
      sense: ["ein Wort mit Bedeutung", "a word with meaning"]
    },
    pain: {
      modules: ["emotion", "motor"],
      core: ["! ", "! "],
      short: ["Schmerz", "pain"],
      sense: ["ein Signal, das Handlung verlangt", "a signal that demands action"]
    }
  };

  var cut = {
    on: ["Die Leitung zu {name} ist gekappt.", "The line to {name} is cut."],
    off: ["Die Leitung zu {name} ist wieder offen.", "The line to {name} is open again."],
    none: ["Keine Leitung ist offen. Der Workspace bleibt dunkel.", "No line is open. The workspace stays dark."],
    all: ["Alle Leitungen sind offen. Der Workspace kann broadcasten.", "All lines are open. The workspace can broadcast."]
  };

  function L(de, en) { return T2.t(de, en); }
  function moduleName(m) {
    var names = {
      vision: ["Sehen", "Vision"],
      language: ["Sprache", "Language"],
      memory: ["Gedächtnis", "Memory"],
      emotion: ["Emotion", "Emotion"],
      motor: ["Motor", "Motor"]
    };
    return L(names[m][0], names[m][1]);
  }

  function theory() { return THEORIES[state.theory]; }
  function liveCount() { return MODULES.filter(function (m) { return state.live[m]; }).length; }

  function narrate(html) { readout.innerHTML = html; }

  function setCore(text, word) {
    wsCore.textContent = text;
    wsCore.classList.toggle("is-word", !!word);
  }

  function updateChips() {
    document.querySelectorAll("[data-theory]").forEach(function (b) {
      var on = b.getAttribute("data-theory") === state.theory;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll("[data-th-mode]").forEach(function (b) {
      var on = b.getAttribute("data-th-mode") === state.mode;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function updatePhi() {
    var factor = { workspace: 1, iit: 1, predictive: 0.86, idealism: 0.7, mysterian: 0.34 }[state.theory] || 1;
    var phi = (liveCount() / MODULES.length) * factor;
    if (state.mode === "experience") phi *= 0.88;
    phiEl.textContent = phi.toFixed(2);
    phiBar.style.width = Math.round(phi * 100) + "%";
  }

  function updateDynamicText() {
    var t = theory();
    theoryName.textContent = L(t.name[0], t.name[1]);
    theoryAbout.textContent = L(t.about[0], t.about[1]);
    var modeSuffix = state.mode === "experience" ? L(" · Erleben", " · experience") : L(" · Zugang", " · access");
    if (state.broadcasted) {
      wsKicker.textContent = L("Broadcast", "Broadcast") + modeSuffix;
      wsNote.textContent = state.mode === "experience"
        ? L("wie es sich anfühlt, bleibt offen", "what it feels like remains open")
        : L("Ergebnis im Arbeitsraum", "result in the workspace");
    } else {
      wsKicker.textContent = L(t.name[0], t.name[1]) + modeSuffix;
      wsNote.textContent = L(t.note[0], t.note[1]);
    }
    MODULES.forEach(function (m) {
      var b = cutEls[m];
      if (!b) return;
      b.setAttribute("aria-label", (state.live[m] ? L("Verbindung kappen: ", "Cut connection: ") : L("Verbindung öffnen: ", "Open connection: ")) + moduleName(m));
      b.title = b.getAttribute("aria-label");
    });
    seats.querySelector(".th-seat-label").textContent = state.mode === "experience"
      ? L("leere Ränge", "empty seats")
      : L("Publikum", "audience");
  }

  function renderArt() {
    iitNodes = [];
    if (state.theory === "workspace") {
      art.innerHTML = '<div class="th-ring r1"></div><div class="th-ring r2"></div><div class="th-ring r3"></div>';
    } else if (state.theory === "iit") {
      var html = "";
      for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 5; col++) {
          html += '<span data-row="' + row + '" data-col="' + col + '" data-module="' + MODULES[col] + '" style="left:' + (16 + col * 17) + '%;top:' + (22 + row * 18) + '%"></span>';
        }
      }
      art.innerHTML = '<div class="th-iit">' + html + '</div>';
      updateIITState();
      layoutIIT();
    } else if (state.theory === "predictive") {
      art.innerHTML = '<div class="th-ripple"></div><div class="th-ripple"></div><div class="th-ripple"></div><div class="th-ripple"></div><div class="th-ring r1"></div><div class="th-ring r2"></div>';
    } else if (state.theory === "idealism") {
      art.innerHTML = '<div class="th-field"></div><div class="th-ring r1"></div><div class="th-ring r2"></div><div class="th-ring r3"></div>';
    } else {
      art.innerHTML = '<div class="th-wall"></div>';
    }
  }

  function updateIITState() {
    art.querySelectorAll(".th-iit span").forEach(function (n) {
      var m = n.getAttribute("data-module");
      n.classList.toggle("is-off", !state.live[m]);
    });
  }

  function layoutIIT() {
    var box = art.querySelector(".th-iit");
    if (!box) { iitNodes = []; return; }
    var wr = world.getBoundingClientRect();
    iitNodes = Array.prototype.map.call(box.querySelectorAll("span"), function (n) {
      var r = n.getBoundingClientRect();
      return {
        x: r.left - wr.left + r.width / 2,
        y: r.top - wr.top + r.height / 2,
        row: parseInt(n.getAttribute("data-row"), 10),
        col: parseInt(n.getAttribute("data-col"), 10),
        m: n.getAttribute("data-module")
      };
    });
  }

  function buildCuts() {
    MODULES.forEach(function (m) {
      if (cutEls[m]) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "th-cut";
      b.setAttribute("data-cut", m);
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { toggleCut(m); });
      world.appendChild(b);
      cutEls[m] = b;
    });
  }

  function layout() {
    var wr = world.getBoundingClientRect();
    MODULES.forEach(function (m) {
      var el = moduleEls[m];
      if (!el) return;
      var r = el.getBoundingClientRect();
      centers[m] = { x: r.left - wr.left + r.width / 2, y: r.top - wr.top + r.height / 2 };
    });
    var ws = workspace.getBoundingClientRect();
    wsCenter = { x: ws.left - wr.left + ws.width / 2, y: ws.top - wr.top + ws.height / 2 };
    MODULES.forEach(function (m) {
      var b = cutEls[m];
      if (!b || !centers[m]) return;
      b.style.left = ((centers[m].x + wsCenter.x) / 2 - 10) + "px";
      b.style.top = ((centers[m].y + wsCenter.y) / 2 - 10) + "px";
    });
    layoutIIT();
  }

  function resizeCanvas() {
    canvasBox = T2.fit(canvas, world);
  }

  function toggleCut(m) {
    state.live[m] = !state.live[m];
    moduleEls[m].classList.toggle("is-cut", !state.live[m]);
    cutEls[m].setAttribute("aria-pressed", state.live[m] ? "false" : "true");
    updatePhi();
    updateIITState();
    if (state.theory === "iit") layoutIIT();
    var text = state.live[m] ? cut.off : cut.on;
    narrate(L(text[0], text[1]).replace("{name}", moduleName(m)));
    if (!liveCount()) setCore("—", false);
    else if (state.broadcasted) setCore(STIMULI[state.stimulus].core[0], true);
  }

  function setMode(mode) {
    state.mode = mode;
    world.setAttribute("data-mode", mode);
    updateChips();
    updatePhi();
    updateDynamicText();
    if (mode === "experience") {
      narrate(L(
        "Von außen ist der Bericht messbar. Ob der Broadcast sich von innen wie etwas anfühlt, zeigt diese Bühne nicht. Genau diese Lücke bleibt offen.",
        "From outside the report is measurable. Whether the broadcast feels like something from the inside is not shown by this stage. That gap remains open."
      ));
      if (state.broadcasted) setCore("?", false);
    } else {
      narrate(L(
        "Zugang heißt: Information ist für Bericht, Kontrolle und Schlussfolgerungen verfügbar. Klicke einen Reiz und beobachte, was in den Workspace kommt.",
        "Access means information is available for report, control, and inference. Click a stimulus and watch what reaches the workspace."
      ));
      if (state.broadcasted) setCore(STIMULI[state.stimulus].core[0], true);
    }
  }

  function setTheory(name) {
    if (!THEORIES[name]) return;
    state.theory = name;
    state.broadcasted = false;
    world.setAttribute("data-theory", name);
    workspace.classList.remove("is-live");
    setCore(L(theory().core[0], theory().core[1]), false);
    renderArt();
    updateChips();
    updatePhi();
    updateDynamicText();
    narrate(L(theory().about[0], theory().about[1]));
    resizeCanvas();
    layout();
  }

  function broadcast(source) {
    var stim = STIMULI[state.stimulus];
    var sources = source ? [source] : stim.modules.filter(function (m) { return state.live[m]; });
    if (!sources.length) {
      narrate(L(cut.none[0], cut.none[1]));
      return;
    }
    sources.forEach(function (m) {
      pulses.push({ m: m, t: 0, speed: 1.9, fired: false, stim: state.stimulus });
    });
    if (state.theory === "predictive") {
      rings.push({ r: 30, alpha: 0.55 });
      rings.push({ r: 60, alpha: 0.28 });
    }
    if (state.theory === "idealism") {
      var field = art.querySelector(".th-field");
      if (field) {
        field.style.animation = "none";
        void field.offsetWidth;
        field.style.animation = "";
      }
    }
    state.broadcasted = true;
    var names = sources.map(moduleName).join(L(" und ", " and "));
    var short = L(stim.short[0], stim.short[1]);
    if (state.mode === "experience") {
      setCore("?", false);
      narrate(L(
        names + " melden " + short + ". Von außen ist der Bericht da. Ob " + L(stim.sense[0], stim.sense[1]) + " sich wie etwas anfühlt, bleibt von außen unsichtbar.",
        names + " report " + short + ". From outside the report is there. Whether " + L(stim.sense[0], stim.sense[1]) + " feels like anything remains invisible from outside."
      ));
    } else {
      setCore(L(stim.core[0], stim.core[1]), true);
      narrate(L(
        names + " melden " + short + ". Der Workspace zeigt das Ergebnis, nicht den Weg. Nur was hier ankommt, kann berichtet und kontrolliert werden.",
        names + " report " + short + ". The workspace shows the result, not the path. Only what arrives here can be reported and controlled."
      ));
    }
    wsKicker.textContent = L("Broadcast", "Broadcast") + (state.mode === "experience" ? L(" · Erleben", " · experience") : L(" · Zugang", " · access"));
    wsNote.textContent = state.mode === "experience"
      ? L("wie es sich anfühlt, bleibt offen", "what it feels like remains open")
      : L("Ergebnis im Arbeitsraum", "result in the workspace");
    workspace.classList.add("is-live");
    rings.push({ r: 24, alpha: 0.5 });
  }

  function reset() {
    MODULES.forEach(function (m) { state.live[m] = true; moduleEls[m].classList.remove("is-cut"); cutEls[m].setAttribute("aria-pressed", "false"); });
    state.broadcasted = false;
    setTheory(state.theory);
    setMode("access");
    narrate(L(
      "Alles zurückgesetzt. Fünf Module rechnen getrennt; der Workspace ist bereit.",
      "Everything reset. Five modules compute separately; the workspace is ready."
    ));
  }

  function chooseStimulus(name) {
    if (!STIMULI[name]) return;
    state.stimulus = name;
    document.querySelectorAll("[data-stim]").forEach(function (b) {
      b.classList.toggle("is-on", b.getAttribute("data-stim") === name);
    });
    narrate(L(
      "Reiz gewählt: " + L(STIMULI[name].short[0], STIMULI[name].short[1]) + ". Drücke Broadcast oder klicke ein beteiligtes Modul.",
      "Stimulus selected: " + L(STIMULI[name].short[0], STIMULI[name].short[1]) + ". Press Broadcast or click a participating module."
    ));
  }

  /* Canvas: connections, ambient particles, broadcast pulses. */
  var ambient = {};
  var pulses = [];
  var rings = [];
  var last = 0;
  var loop = T2.loop(function (now) {
    if (!canvasBox) return;
    var dt = last ? Math.min(0.06, (now - last) / 1000) : 0.016;
    last = now;
    draw(dt);
  });

  function accent() { return T2.cssVar("--th-accent", world) || "#b3a8e6"; }
  function lineColor() { return T2.cssVar("--th-line", world) || "rgba(154,214,232,.18)"; }

  function draw(dt) {
    var ctx = canvasBox.ctx, w = canvasBox.w, h = canvasBox.h;
    ctx.clearRect(0, 0, w, h);
    var ac = accent();

    if (state.theory === "iit") {
      drawIIT(ctx);
    }

    MODULES.forEach(function (m) {
      var c = centers[m];
      if (!c) return;
      if (state.live[m]) {
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(wsCenter.x, wsCenter.y);
        ctx.strokeStyle = lineColor();
        ctx.lineWidth = 1;
        ctx.stroke();
        if (!ambient[m]) ambient[m] = T2.particles(5, MODULES.indexOf(m) + 3);
        ambient[m].forEach(function (p) {
          p.t += dt * p.speed * (state.mode === "experience" ? 0.5 : 1);
          if (p.t > 1) p.t -= 1;
          var x = T2.lerp(c.x, wsCenter.x, p.t) + p.jitter * 6 * Math.sin(p.t * 9);
          var y = T2.lerp(c.y, wsCenter.y, p.t) + p.jitter * 6 * Math.cos(p.t * 7);
          if (state.theory === "mysterian" && x > w * 0.68) return;
          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = ac;
          ctx.globalAlpha = 0.18 + 0.24 * Math.sin(p.t * Math.PI);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
      }
    });

    for (var i = pulses.length - 1; i >= 0; i--) {
      var p = pulses[i];
      p.t += dt * p.speed;
      var c2 = centers[p.m];
      if (!c2) { pulses.splice(i, 1); continue; }
      var t = T2.clamp(p.t, 0, 1);
      var x = T2.lerp(c2.x, wsCenter.x, T2.ease(t));
      var y = T2.lerp(c2.y, wsCenter.y, T2.ease(t));
      ctx.beginPath();
      ctx.arc(x, y, 4.2, 0, Math.PI * 2);
      ctx.fillStyle = ac;
      ctx.shadowColor = ac;
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
      if (t >= 1 && !p.fired) {
        p.fired = true;
        rings.push({ r: 30, alpha: 0.45 });
      }
      if (t >= 1) pulses.splice(i, 1);
    }

    for (var j = rings.length - 1; j >= 0; j--) {
      var r = rings[j];
      r.r += dt * 120;
      r.alpha -= dt * 0.55;
      if (r.alpha <= 0) { rings.splice(j, 1); continue; }
      ctx.beginPath();
      ctx.arc(wsCenter.x, wsCenter.y, r.r, 0, Math.PI * 2);
      ctx.strokeStyle = ac;
      ctx.globalAlpha = r.alpha;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawIIT(ctx) {
    if (iitNodes.length < 2) return;
    var ac = accent();
    for (var i = 0; i < iitNodes.length; i++) {
      var a = iitNodes[i];
      for (var j = i + 1; j < iitNodes.length; j++) {
        var b = iitNodes[j];
        var adjacent = (a.row === b.row && Math.abs(a.col - b.col) === 1) ||
                       (a.col === b.col && Math.abs(a.row - b.row) === 1);
        if (!adjacent) continue;
        if (!state.live[a.m] && !state.live[b.m]) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = ac;
        ctx.globalAlpha = (state.live[a.m] && state.live[b.m]) ? 0.22 : 0.08;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  /* Wire up. */
  MODULES.forEach(function (m) {
    moduleEls[m] = world.querySelector('[data-module="' + m + '"]');
    moduleEls[m].addEventListener("click", function () { broadcast(m); });
  });
  buildCuts();

  document.querySelectorAll("[data-theory]").forEach(function (b) {
    b.addEventListener("click", function () { setTheory(b.getAttribute("data-theory")); });
  });
  document.querySelectorAll("[data-th-mode]").forEach(function (b) {
    b.addEventListener("click", function () { setMode(b.getAttribute("data-th-mode")); });
  });
  document.querySelectorAll("[data-stim]").forEach(function (b) {
    b.addEventListener("click", function () { chooseStimulus(b.getAttribute("data-stim")); });
  });
  document.querySelector("[data-th-broadcast]").addEventListener("click", function () { broadcast(null); });
  document.querySelector("[data-th-reset]").addEventListener("click", reset);

  var resizeStop = T2.onResize(world, function () { resizeCanvas(); layout(); });
  T2.onTheme(function () { resizeCanvas(); draw(0); });
  T2.onLang(function () {
    updateDynamicText();
    layout();
  });

  chooseStimulus("apple");
  resizeCanvas();
  layout();
  updateDynamicText();
  updatePhi();
  renderArt();
  layout();
  setMode("access");
  loop.start();

  window.addEventListener("beforeunload", function () {
    loop.stop();
    resizeStop();
  });
})();
