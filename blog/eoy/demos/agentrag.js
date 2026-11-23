(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function agentRagScene(root, api) {
    var DE = api.lang === "de";
    var esc = api.esc;
    function L(de, en) { return DE ? de : en; }
    var ANGLE_LIMIT = 35;
    var CHUNKS = [
      {
        id: "C1", angle: 14, score: 0.97, kind: "current",
        verdict: L("passt", "fits"),
        text: L("Kraken besitzen drei Herzen: zwei für die Kiemen, eines für den Körper.", "Octopuses have three hearts: two for the gills, one for the body.")
      },
      {
        id: "C2", angle: 69, score: 0.36, kind: "other",
        verdict: L("nicht relevant", "not relevant"),
        text: L("Sie wechseln ihre Farbe in Sekunden.", "They change colour in seconds.")
      },
      {
        id: "C3", angle: 46, score: 0.69, kind: "other",
        verdict: L("nur teilweise", "only partly"),
        text: L("Ein Krake hat acht Arme mit Saugnäpfen.", "An octopus has eight arms with suckers.")
      },
      {
        id: "C4", angle: 72, score: 0.31, kind: "other",
        verdict: L("nicht relevant", "not relevant"),
        text: L("Bei Gefahr spritzen sie Tinte.", "When in danger, they squirt ink.")
      }
    ];
    var BOOK = {
      icon: "▤",
      label: L("Buch öffnen", "Open the book"),
      cmd: 'book.open("kraken.txt")'
    };
    var GUIDE = [
      { measured: false, selected: [], stage: 1, final: false, label: L("Buch öffnen: Text in vier Chunks teilen", "Open the book: split the text into four chunks") },
      { measured: true, selected: [], stage: 2, final: false, label: L("Winkel zum aktuellen Kontext messen", "Measure angles against the current context") },
      { measured: true, selected: ["C1"], stage: 3, final: false, label: L("C1 (14°) in den unsichtbaren Kontext", "Put C1 (14°) into the invisible context") },
      { measured: true, selected: ["C1"], stage: 4, final: true, label: L("Weiter generieren: „drei Herzen“", "Generate on: “three hearts”") }
    ];
    var state = { tool: "", selected: {}, step: -1 };
    var el = document.createElement("div");
    el.className = "ls-ar-scene";
    el.innerHTML =
      '<div class="ls-ar-head"><span class="ls-ar-badge">' + L("Dynamisches RAG", "Dynamic RAG") + '</span><span class="ls-ar-sub">' + L("Der Agent liest ein Buch, teilt es in Chunks und fügt nur passende Chunks in den Kontext.", "The agent reads a book, splits it into chunks, and puts only fitting chunks into the context.") + '</span><span class="ls-ar-guide"></span></div>' +
      '<div class="ls-ar-query"><span>' + L("Auftrag", "Task") + '</span><b>' + L("Beantworte die Frage aus dem Buch.", "Answer the question from the book.") + '</b></div>' +
      '<div class="ls-ar-grid">' +
        '<section class="ls-ar-col"><div class="ls-ar-col-head"><b>' + L("Buch", "Book") + '</b><span>' + L("Text → Chunks", "text → chunks") + '</span></div><div class="ls-ar-tools"></div><code class="ls-ar-cmd"></code><div class="ls-ar-book"></div></section>' +
        '<section class="ls-ar-col"><div class="ls-ar-col-head"><b>' + L("Chunks", "Chunks") + '</b><span>' + L("Winkel < 35°", "angle < 35°") + '</span></div><div class="ls-ar-list"></div><div class="ls-ar-measure"></div></section>' +
        '<section class="ls-ar-col"><div class="ls-ar-col-head"><b>' + L("Kontext", "Context") + '</b><span>' + L("unsichtbar", "invisible") + '</span></div><div class="ls-ar-current"></div><div class="ls-ar-stack"></div><p class="ls-ar-note">' + L("Das Modell liest den unsichtbaren Stapel beim nächsten Token. Du siehst nur, welche Chunks hineinwandern.", "The model reads the invisible stack at the next token. You only see which chunks go in.") + '</p></section>' +
      '</div>' +
      '<div class="ls-ar-answer" aria-live="polite"></div>' +
      '<div class="ls-ar-bottom">' +
        '<div class="ls-ar-loop"><span>' + L("Buch", "book") + '</span><i>→</i><span>' + L("Chunks", "chunks") + '</span><i>→</i><span>' + L("Winkel", "angle") + '</span><i>→</i><span>' + L("Kontext", "context") + '</span><i>→</i><span>' + L("generieren", "generate") + '</span></div>' +
        '<button type="button" class="ls-ar-reset">' + L("Zurücksetzen", "Reset") + '</button>' +
      '</div>';
    root.appendChild(el);
    var toolsEl = el.querySelector(".ls-ar-tools");
    var cmdEl = el.querySelector(".ls-ar-cmd");
    var bookEl = el.querySelector(".ls-ar-book");
    var listEl = el.querySelector(".ls-ar-list");
    var stackEl = el.querySelector(".ls-ar-stack");
    var currentEl = el.querySelector(".ls-ar-current");
    var answerEl = el.querySelector(".ls-ar-answer");
    var loopEl = el.querySelector(".ls-ar-loop");
    var guideEl = el.querySelector(".ls-ar-guide");
    var measureEl = el.querySelector(".ls-ar-measure");
    function hasBook() { return state.tool === "book"; }
    function selectedChunks() {
      return CHUNKS.filter(function (c) { return !!state.selected[c.id]; });
    }
    function measured() {
      return state.step < 0 || (state.step >= 0 && GUIDE[state.step].measured);
    }
    function finalAnswer() {
      return state.step >= 0 && GUIDE[state.step].final;
    }
    function renderTool() {
      toolsEl.innerHTML = '<button type="button" class="ls-ar-tool' + (hasBook() ? " is-on" : "") + '" data-tool="book" aria-pressed="' + (hasBook() ? "true" : "false") + '">' +
        '<span class="ls-ar-tool-icon">' + BOOK.icon + '</span><b>' + esc(BOOK.label) + '</b></button>';
      cmdEl.textContent = hasBook() ? BOOK.cmd : L("Öffne das Buch.", "Open the book.");
      bookEl.innerHTML = hasBook()
        ? CHUNKS.map(function (c) {
          return '<span class="ls-ar-book-chunk"><b>' + c.id + '</b>' + esc(c.text) + '</span>';
        }).join("")
        : '<div class="ls-ar-empty">' + L("Noch kein Buch geöffnet.", "No book opened yet.") + '</div>';
    }
    function renderChunks() {
      if (!hasBook()) {
        listEl.innerHTML = '<div class="ls-ar-empty">' + L("Öffne links das Buch. Der Agent teilt den Text dann in Chunks.", "Open the book on the left. The agent then splits the text into chunks.") + '</div>';
        measureEl.innerHTML = "";
        return;
      }
      var showMeasurement = measured();
      listEl.innerHTML = CHUNKS.map(function (c) {
        var on = !!state.selected[c.id];
        var head = '<div class="ls-ar-snip-head"><b>' + c.id + '</b><span>' + L("Buch", "book") + '</span>' +
          (showMeasurement ? '<em class="is-' + c.kind + '">' + esc(c.verdict) + '</em>' : '') + '</div>';
        var body = head + '<p>' + esc(c.text) + '</p>';
        if (!showMeasurement) return '<div class="ls-ar-snip">' + body + '<span class="ls-ar-pending">' + L("Winkel noch nicht gemessen", "angle not measured yet") + '</span></div>';
        return '<div class="ls-ar-snip' + (on ? " is-in" : "") + '">' + body +
          '<div class="ls-ar-score"><span class="ls-ar-track"><i class="' + (c.score >= 0.7 ? "is-high" : c.score >= 0.4 ? "is-mid" : "is-low") + '" style="width:' + Math.round(c.score * 100) + '%"></i></span><b class="ls-ar-angle">∠ ' + c.angle + '°</b><span>' + c.score.toFixed(2) + '</span></div>' +
          '<button type="button" class="ls-ar-add' + (on ? " is-on" : "") + '" data-snip="' + c.id + '">' + (on ? L("Im Kontext", "In context") : L("In Kontext legen", "Put in context")) + '</button>' +
        '</div>';
      }).join("");
      measureEl.innerHTML = showMeasurement
        ? '<span class="ls-ar-limit">' + L("Grenzwinkel 35°", "threshold 35°") + '</span>' +
          CHUNKS.map(function (c) {
            var fit = c.angle <= ANGLE_LIMIT;
            return '<b class="' + (fit ? "is-fit" : "is-out") + '">' + c.id + ' ' + c.angle + '° ' + (fit ? "✓" : "✗") + '</b>';
          }).join("")
        : "";
    }
    function renderContext() {
      currentEl.innerHTML = '<span>' + L("Aktueller Kontext", "Current context") + '</span>' +
        '<b>' + L("Frage: Wie viele Herzen hat ein Krake?", "Question: How many hearts does an octopus have?") + '</b>' +
        '<p><em>' + L("Bisher generiert: Ein Krake hat …", "Generated so far: An octopus has …") + '</em></p>';
      var selected = selectedChunks();
      if (!selected.length) {
        stackEl.innerHTML = '<div class="ls-ar-empty">' + L("Noch kein Chunk im unsichtbaren Kontext.", "No chunk in the invisible context yet.") + '</div>';
        return;
      }
      stackEl.innerHTML = selected.map(function (c) {
        return '<div class="ls-ar-ctx-card"><div><b>' + c.id + '</b><span>' + L("Buch", "book") + '</span></div><span class="ls-ar-blur" aria-hidden="true">' + esc(c.text) + '</span></div>';
      }).join("");
    }
    function renderAnswer() {
      var selected = selectedChunks();
      var target = selected.filter(function (c) { return c.kind === "current"; });
      var other = selected.filter(function (c) { return c.kind !== "current"; });
      var ids = function (arr) { return arr.map(function (c) { return c.id; }).join(", "); };
      var cls = "is-guess";
      var head = L("Vermutung", "Guess");
      var text = L("Ohne Buchquelle rät das Modell weiter: „Ein Krake hat …“", "Without the book the model guesses: “An octopus has …”");
      if (target.length && !other.length && finalAnswer()) {
        cls = "is-good"; head = L("Weiter generiert", "Generated continuation");
        text = L("Ein Krake hat drei Herzen. Belegt durch " + ids(target) + " im unsichtbaren Kontext.", "An octopus has three hearts. Grounded in " + ids(target) + " in the invisible context.");
      } else if (target.length && !other.length) {
        cls = "is-good"; head = L("Kontext bereit", "Context ready");
        text = L("C1 liegt unsichtbar vor. Der nächste Token kann daraus lesen.", "C1 is in the invisible context. The next token can read it.");
      } else if (target.length && other.length) {
        cls = "is-warn"; head = L("Gemischte Chunks", "Mixed chunks");
        text = L("C1 nennt drei Herzen; weitere Chunks (" + ids(other) + ") sind zu schwach relevant. Der Agent sollte sie verwerfen.", "C1 names three hearts; further chunks (" + ids(other) + ") are too weakly relevant. The agent should discard them.");
      } else if (other.length) {
        cls = "is-warn"; head = L("Falscher Chunk", "Wrong chunk");
        text = L(ids(other) + " beantwortet die Herzen-Frage nicht. Der Chunk ist zu schwach relevant.", ids(other) + " does not answer the question about hearts. The chunk is too weakly relevant.");
      }
      answerEl.className = "ls-ar-answer " + cls;
      answerEl.innerHTML = '<div><span>' + L("Generierung", "Generation") + '</span><b>' + esc(head) + '</b></div><p>' + esc(text) + '</p>';
    }
    function renderLoop() {
      var stage = state.step >= 0 ? GUIDE[state.step].stage : 0;
      Array.prototype.forEach.call(loopEl.querySelectorAll("span"), function (s, i) {
        s.classList.toggle("is-on", i === stage);
      });
    }
    function renderGuide() {
      if (state.step < 0) {
        guideEl.textContent = L("Drücke Weiter: Buch → Chunks → Winkel → Kontext → generieren", "Press Next: book → chunks → angle → context → generate");
      } else {
        guideEl.textContent = L("Schritt " + (state.step + 1) + " / " + GUIDE.length + " · ", "Step " + (state.step + 1) + " / " + GUIDE.length + " · ") + GUIDE[state.step].label;
      }
    }
    function render() {
      renderTool();
      renderChunks();
      renderContext();
      renderAnswer();
      renderLoop();
      renderGuide();
    }
    function applyGuide(step) {
      state.step = step;
      state.selected = {};
      if (step >= 0) {
        GUIDE[step].selected.forEach(function (id) { state.selected[id] = true; });
        state.tool = "book";
      } else {
        state.tool = "";
      }
      render();
    }
    function reset() { applyGuide(-1); }
    el.addEventListener("click", function (event) {
      var tool = event.target.closest ? event.target.closest("[data-tool]") : null;
      if (tool && el.contains(tool)) {
        state.tool = "book";
        render();
        return;
      }
      var add = event.target.closest ? event.target.closest("[data-snip]") : null;
      if (add && el.contains(add)) {
        var id = add.getAttribute("data-snip");
        state.selected[id] = !state.selected[id];
        render();
        return;
      }
      if (event.target.closest && event.target.closest(".ls-ar-reset")) reset();
    });
    render();
    return {
      update: function () {},
      next: function () {
        if (state.step < GUIDE.length - 1) { applyGuide(state.step + 1); return true; }
        return false;
      },
      prev: function () {
        if (state.step >= 0) { applyGuide(state.step - 1); return true; }
        return false;
      },
      hasNext: function () { return state.step < GUIDE.length - 1; },
      hasPrev: function () { return state.step >= 0; },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }
  core.register("agentrag", agentRagScene);
})();
