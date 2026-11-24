(function () {
  "use strict";

  var t = function (de, en) { return window.Proto ? Proto.t(de, en) : de; };
  var HEAD_NAMES = { prev: "Previous-Token-Head", ind: "Induction-Head" };

  var ROUNDS = [
    { tokens: ["A", "7", "B", "3", "C", "9", "A"], label: "A → ?" },
    { tokens: ["◆", "●", "▲", "■", "◆"], label: "◆ → ?" },
    { tokens: ["x", "q", "y", "w", "z", "e", "y"], label: "y → ?" },
    { tokens: ["1", "4", "2", "8", "1"], label: "1 → ?" },
    { tokens: ["red", "blue", "green", "yellow", "red"], label: "red → ?" }
  ].map(function (r) {
    var toks = r.tokens.slice();
    var query = toks[toks.length - 1];
    var source = toks.indexOf(query);
    if (source < 0 || source >= toks.length - 1) source = 0;
    var copy = source + 1;
    var prev = toks[toks.length - 2];
    var prevSource = -1;
    for (var i = toks.length - 2; i >= 0; i--) {
      if (toks[i] === prev) { prevSource = i; break; }
    }
    var baseline = prevSource >= 0 && prevSource + 1 < toks.length - 1 ? toks[prevSource + 1] : null;
    return {
      tokens: toks,
      label: r.label,
      query: query,
      source: source,
      copy: copy,
      answer: toks[copy],
      baseline: baseline
    };
  });

  var root = document.querySelector(".ct-stage");
  if (!root) return;

  var seqEl = document.getElementById("ct-sequence");
  var predEl = document.getElementById("ct-prediction");
  var patternNote = document.getElementById("ct-pattern-note");
  var roundLabel = document.getElementById("ct-round-label");
  var roundsEl = document.getElementById("ct-rounds");
  var baselineEl = document.getElementById("ct-baseline");
  var orderBadge = document.getElementById("ct-order-badge");
  var benchHint = document.getElementById("ct-bench-hint");
  var headsEl = document.getElementById("ct-heads");
  var slotsEl = Array.prototype.slice.call(root.querySelectorAll("[data-slot]"));
  var connector = document.getElementById("ct-connector");
  var runBtn = document.getElementById("ct-run");
  var clearBtn = document.getElementById("ct-clear");
  var resetBtn = document.getElementById("ct-reset");
  var scoreEl = document.getElementById("ct-score");
  var scoreBig = document.getElementById("ct-score-big");
  var meterEl = document.getElementById("ct-meter");
  var hintEl = document.getElementById("ct-hint");
  var readout = document.getElementById("ct-readout");
  var ablatePanel = document.getElementById("ct-ablate-panel");
  var ablPrev = document.getElementById("ct-abl-prev");
  var ablInd = document.getElementById("ct-abl-ind");
  var ablateScore = document.getElementById("ct-ablate-score");
  var toastEl = document.getElementById("ct-toast");

  var state = {
    slots: [null, null],
    selected: null,
    round: 0,
    ran: false,
    score: 0,
    ablatePrev: false,
    ablateInd: false,
    builtOnce: false
  };
  var toastTimer = 0;

  function en() { return window.Proto && Proto.lang() === "en"; }
  function headIcon(id) { return id === "prev" ? "↩" : "⧉"; }
  function headLabel(id) {
    return id === "prev" ? "Previous-Token-Head" : "Induction-Head";
  }
  function roundData() { return ROUNDS[state.round]; }
  function isCorrectOrder() {
    return state.slots[0] === "prev" && state.slots[1] === "ind";
  }
  function hasBoth() { return !!state.slots[0] && !!state.slots[1]; }
  function isAblated() { return state.ablatePrev || state.ablateInd; }
  function liveScore() {
    if (!state.ran) return 0;
    if (!isCorrectOrder() || isAblated()) return 0;
    return 5;
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 3400);
  }

  function renderSlots() {
    slotsEl.forEach(function (slot, i) {
      var id = state.slots[i];
      slot.classList.toggle("is-filled", !!id);
      slot.classList.toggle("is-selected", !id && !!state.selected);
      var filled = slot.querySelector(".ct-slot-filled");
      filled.innerHTML = id
        ? '<span class="ct-head-ico">' + headIcon(id) + '</span><span>' + headLabel(id) + '</span>'
        : "";
    });
    headsEl.querySelectorAll("[data-head]").forEach(function (b) {
      var id = b.getAttribute("data-head");
      var where = b.querySelector(".ct-head-where");
      var at = state.slots.indexOf(id);
      b.classList.toggle("is-selected", state.selected === id);
      b.classList.toggle("is-assigned", at >= 0);
      where.textContent = at >= 0
        ? (en() ? "in layer " + (at + 1) : "in Schicht " + (at + 1))
        : "";
    });
    var selected = state.selected;
    benchHint.textContent = selected
      ? (en() ? "Now pick a layer for " + headLabel(selected) : "Jetzt Schicht für " + headLabel(selected) + " wählen")
      : (en() ? "Pick a head, then a layer" : "Head wählen, dann Schicht");
  }

  function renderSequence() {
    var d = roundData();
    var good = state.ran && liveScore() === 5;
    var bad = state.ran && !good;
    var html = d.tokens.map(function (tok, i) {
      var cls = "ct-token";
      var sub = "";
      if (i === d.tokens.length - 1) {
        cls += " is-query";
        sub = en() ? "query" : "Query";
      }
      if (good && i === d.source) { cls += " is-source"; sub = en() ? "earlier" : "früher"; }
      if (good && i === d.copy) { cls += " is-copy"; sub = en() ? "copied" : "kopiert"; }
      return '<span class="' + cls + '">' + esc(tok) + (sub ? '<span class="ct-token-sub">' + sub + '</span>' : "") + '</span>';
    }).join("");
    var hidden;
    if (!state.ran) {
      hidden = '<span class="ct-token is-hidden">?</span>';
    } else if (good) {
      hidden = '<span class="ct-token is-revealed">' + esc(d.answer) + '<span class="ct-token-sub">' + (en() ? "copy" : "Kopie") + '</span></span>';
    } else {
      hidden = '<span class="ct-token is-wrong">' + esc(d.baseline || "?") + '<span class="ct-token-sub">' + (en() ? "one layer" : "eine Schicht") + '</span></span>';
    }
    seqEl.innerHTML = html + hidden;
    roundLabel.textContent = (state.round + 1) + " / " + ROUNDS.length;
  }

  function renderPrediction() {
    var d = roundData();
    var good = state.ran && liveScore() === 5;
    var html = "";
    if (!state.ran) {
      html += '<span class="ct-pred-label">' + (en() ? "expected" : "erwartet") + '</span>';
      html += '<span class="ct-pred-pill is-ghost">' + esc(d.answer) + '</span>';
      html += '<span class="ct-pred-label">' + (en() ? "one layer" : "eine Schicht") + '</span>';
      html += '<span class="ct-pred-pill is-ghost">' + esc(d.baseline || "—") + '</span>';
    } else {
      html += '<span class="ct-pred-label">' + (en() ? "circuit" : "Schaltkreis") + '</span>';
      html += '<span class="ct-pred-pill ' + (good ? "is-good" : "is-bad") + '"><b>' + esc(good ? d.answer : (d.baseline || "—")) + '</b> ' + (good ? "✓" : "✕") + '</span>';
      html += '<span class="ct-pred-label">' + (en() ? "expected" : "erwartet") + '</span>';
      html += '<span class="ct-pred-pill">' + esc(d.answer) + '</span>';
    }
    predEl.innerHTML = html;
    if (!state.ran) {
      patternNote.innerHTML = en()
        ? 'The query is the last <b>' + esc(d.query) + '</b>. What followed the earlier <b>' + esc(d.query) + '</b>? That is the token to copy.'
        : 'Die Query ist das letzte <b>' + esc(d.query) + '</b>. Was folgte auf das frühere <b>' + esc(d.query) + '</b>? Das ist das Token, das kopiert wird.';
    } else if (good) {
      patternNote.innerHTML = en()
        ? 'The earlier <b>' + esc(d.query) + '</b> was followed by <b>' + esc(d.answer) + '</b>. The induction head finds that spot and copies the value.'
        : 'Auf das frühere <b>' + esc(d.query) + '</b> folgte <b>' + esc(d.answer) + '</b>. Der Induction-Head findet die Stelle und kopiert den Value.';
    } else {
      patternNote.innerHTML = en()
        ? 'The one-layer model only sees the previous token <b>' + esc(d.tokens[d.tokens.length - 2]) + '</b> and predicts <b>' + esc(d.baseline || "nothing") + '</b>. It never looks back to the earlier <b>' + esc(d.query) + '</b>.'
        : 'Das Ein-Schicht-Modell sieht nur das vorherige Token <b>' + esc(d.tokens[d.tokens.length - 2]) + '</b> und sagt <b>' + esc(d.baseline || "nichts") + '</b> voraus. Es schaut nie auf das frühere <b>' + esc(d.query) + '</b> zurück.';
    }
  }

  function renderRounds() {
    var n = state.ran ? liveScore() : 0;
    roundsEl.innerHTML = ROUNDS.map(function (r, i) {
      var dot = "ct-round-dot";
      if (state.ran) dot += liveScore() === 5 ? " is-ok" : " is-bad";
      return '<button type="button" class="ct-round' + (i === state.round ? " is-on" : "") + '" data-round="' + i + '">' +
        '<span class="ct-round-top"><span class="ct-round-num">' + (i + 1) + '</span><span class="' + dot + '"></span></span>' +
        '<span class="ct-round-word">' + esc(r.tokens[r.tokens.length - 1]) + '</span>' +
        '<span class="ct-round-arrow">→ ' + (state.ran && liveScore() === 5 ? esc(r.answer) : "?") + '</span>' +
      '</button>';
    }).join("");
    scoreEl.textContent = n + " / 5";
    scoreBig.textContent = n + " / 5";
    scoreBig.style.color = n === 5 ? "var(--g-green)" : n > 0 ? "var(--g-ink)" : "var(--g-rose)";
    meterEl.style.width = (n / 5 * 100) + "%";
  }

  function renderBaseline() {
    var n = state.ran ? liveScore() : 0;
    baselineEl.innerHTML =
      '<div class="ct-baseline-row"><b>' + (en() ? "one layer" : "eine Schicht") + '</b><span class="ct-baseline-track"><i style="width:0%"></i></span><span class="ct-baseline-val">0 / 5</span></div>' +
      '<div class="ct-baseline-row is-you"><b>' + (en() ? "your circuit" : "dein Schaltkreis") + '</b><span class="ct-baseline-track"><i style="width:' + (n / 5 * 100) + '%"></i></span><span class="ct-baseline-val">' + n + ' / 5</span></div>';
  }

  function renderAblation() {
    ablatePanel.hidden = !(state.ran && isCorrectOrder());
    if (ablatePanel.hidden) return;
    ablatePanel.classList.toggle("is-broken", isAblated());
    ablateScore.innerHTML = isAblated()
      ? '0 / 5 <small>' + (en() ? "circuit broken" : "Schaltkreis kaputt") + '</small>'
      : '5 / 5 <small>' + (en() ? "circuit intact" : "Schaltkreis intakt") + '</small>';
    ablateScore.style.color = isAblated() ? "var(--g-rose)" : "var(--g-green)";
  }

  function renderStatus() {
    var good = state.ran && liveScore() === 5;
    connector.classList.toggle("is-live", good && hasBoth());
    if (!hasBoth()) {
      orderBadge.textContent = en() ? "not built yet" : "noch nicht gebaut";
    } else if (!isCorrectOrder()) {
      orderBadge.textContent = en() ? "wrong order" : "falsche Reihenfolge";
    } else if (isAblated()) {
      orderBadge.textContent = en() ? "ablated" : "ablatiert";
    } else if (state.ran) {
      orderBadge.textContent = en() ? "built · 5 / 5" : "gebaut · 5 / 5";
    } else {
      orderBadge.textContent = en() ? "ready to test" : "bereit zum Test";
    }
    runBtn.disabled = !hasBoth();
    clearBtn.disabled = !hasBoth() && !state.selected;
  }

  function renderReadout() {
    if (!hasBoth()) {
      readout.innerHTML = en()
        ? '<b>Build the circuit.</b> Pick a head, then a layer. Both layers need one head.'
        : '<b>Baue den Schaltkreis.</b> Wähle einen Head, dann eine Schicht. Beide Schichten brauchen einen Head.';
      hintEl.textContent = en()
        ? "The workbench is on the right. Start with the previous-token head."
        : "Die Werkbank ist rechts. Fang mit dem Previous-Token-Head an.";
      return;
    }
    if (!isCorrectOrder()) {
      readout.innerHTML = en()
        ? '<b>The induction head has nothing to match.</b> In layer 1 it searches for keys that layer 1 has not written. Swap the two heads.'
        : '<b>Der Induction-Head hat nichts zu matchen.</b> In Schicht 1 sucht er Keys, die Schicht 1 noch nicht geschrieben hat. Tausche die beiden Heads.';
      hintEl.textContent = en()
        ? "Layer 1 must write the predecessor keys before layer 2 can match them."
        : "Schicht 1 muss die Vorgänger-Keys schreiben, bevor Schicht 2 sie matchen kann.";
      return;
    }
    if (!state.ran) {
      readout.innerHTML = en()
        ? '<b>The circuit stands.</b> Test it on five patterns. The same two heads should copy every one.'
        : '<b>Der Schaltkreis steht.</b> Teste ihn an fünf Mustern. Dieselben zwei Heads sollen jedes kopieren.';
      hintEl.textContent = en()
        ? "Press “Test the circuit”."
        : "Drücke „Schaltkreis testen“.";
      return;
    }
    if (isAblated()) {
      var what = state.ablatePrev && state.ablateInd
        ? (en() ? "both heads" : "beide Heads")
        : state.ablatePrev
          ? (en() ? "the previous-token head" : "der Previous-Token-Head")
          : (en() ? "the induction head" : "der Induction-Head");
      readout.innerHTML = en()
        ? '<b>0 / 5.</b> Without ' + what + ' the copy fails. The ablation is the causal test: the circuit is necessary, not just correlated.'
        : '<b>0 / 5.</b> Ohne ' + what + ' scheitert die Kopie. Die Ablation ist der kausale Test: Der Schaltkreis ist nötig, nicht nur korreliert.';
      hintEl.textContent = en()
        ? "Switch the head back on and the five patterns return."
        : "Schalte den Head wieder ein, dann kommen die fünf Muster zurück.";
      return;
    }
    readout.innerHTML = en()
      ? '<b>5 / 5.</b> The pattern was in the context. The circuit did not know it; it looked back, matched the earlier token, and copied what followed.'
      : '<b>5 / 5.</b> Das Muster stand im Kontext. Der Schaltkreis wusste es nicht; er schaute zurück, matchte das frühere Token und kopierte, was folgte.';
    hintEl.textContent = en()
      ? "Now use the ablation below to break it on purpose."
      : "Nutze jetzt die Ablation unten, um ihn gezielt kaputt zu machen.";
  }

  function renderAll() {
    renderSlots();
    renderSequence();
    renderPrediction();
    renderRounds();
    renderBaseline();
    renderAblation();
    renderStatus();
    renderReadout();
  }

  function esc(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function selectHead(id) {
    if (state.selected === id) {
      state.selected = null;
    } else {
      state.selected = id;
      var at = state.slots.indexOf(id);
      if (at >= 0) state.slots[at] = null;
    }
    renderAll();
  }

  function placeInSlot(i) {
    if (!state.selected) {
      if (state.slots[i]) {
        state.selected = state.slots[i];
        state.slots[i] = null;
        renderAll();
      }
      return;
    }
    var id = state.selected;
    var other = state.slots.indexOf(id);
    if (other >= 0) state.slots[other] = null;
    state.slots[i] = id;
    state.selected = null;
    renderAll();
  }

  headsEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-head]");
    if (!b) return;
    selectHead(b.getAttribute("data-head"));
  });

  slotsEl.forEach(function (slot, i) {
    slot.addEventListener("click", function () { placeInSlot(i); });
  });

  roundsEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-round]");
    if (!b) return;
    state.round = parseInt(b.getAttribute("data-round"), 10);
    renderAll();
  });

  runBtn.addEventListener("click", function () {
    if (!hasBoth()) {
      toast(t("Beide Schichten brauchen einen Head.", "Both layers need a head."));
      return;
    }
    state.ran = true;
    state.score = liveScore();
    if (isCorrectOrder() && !isAblated()) {
      var first = !state.builtOnce;
      state.builtOnce = true;
      if (first) toast(t("5 / 5. Das Muster war im Kontext.", "5 / 5. The pattern was in the context."));
    } else if (!isCorrectOrder()) {
      toast(t("Falsche Reihenfolge. Schicht 1 muss die Keys schreiben.", "Wrong order. Layer 1 must write the keys."));
    } else {
      toast(t("Beide Heads sind nötig.", "Both heads are necessary."));
    }
    renderAll();
  });

  clearBtn.addEventListener("click", function () {
    state.slots = [null, null];
    state.selected = null;
    state.ran = false;
    state.score = 0;
    state.ablatePrev = false;
    state.ablateInd = false;
    ablPrev.checked = false;
    ablInd.checked = false;
    renderAll();
  });

  ablPrev.addEventListener("change", function () {
    state.ablatePrev = ablPrev.checked;
    state.ran = true;
    renderAll();
  });
  ablInd.addEventListener("change", function () {
    state.ablateInd = ablInd.checked;
    state.ran = true;
    renderAll();
  });

  resetBtn.addEventListener("click", function () {
    state.slots = [null, null];
    state.selected = null;
    state.round = 0;
    state.ran = false;
    state.score = 0;
    state.ablatePrev = false;
    state.ablateInd = false;
    state.builtOnce = false;
    ablPrev.checked = false;
    ablInd.checked = false;
    toastEl.classList.remove("is-on");
    renderAll();
  });

  if (window.Proto && Proto.onLang) Proto.onLang(renderAll);
  renderAll();
})();
