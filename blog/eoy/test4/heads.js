(function () {
  "use strict";

  var t = function (de, en) { return window.Proto ? Proto.t(de, en) : de; };
  var NAMES_DE = ["Tier", "Straße", "es"];
  var NAMES_EN = ["animal", "street", "it"];
  var C = [
    { x: 350, y: 80 },
    { x: 120, y: 470 },
    { x: 580, y: 470 }
  ];
  var TARGET = [0, 1];
  var LEARNED = [
    [0.6667, 0.1282, 0.2051],
    [0.1096, 0.7534, 0.1370]
  ];
  var WIN = 0.30;

  var root = document.getElementById("hd-simplex");
  if (!root) return;

  var svg = root;
  var board = svg.closest(".hd-board");
  var p1 = document.getElementById("hd-p1");
  var p2 = document.getElementById("hd-p2");
  var target0 = document.getElementById("hd-target-0");
  var target1 = document.getElementById("hd-target-1");
  var pct = [
    document.getElementById("hd-pct-0"),
    document.getElementById("hd-pct-1"),
    document.getElementById("hd-pct-2")
  ];
  var learnedEls = [
    document.getElementById("hd-learned-0"),
    document.getElementById("hd-learned-1")
  ];
  var learnedPanel = document.getElementById("hd-learned-panel");
  var learnedRows = document.getElementById("hd-learned-rows");
  var barsEl = document.getElementById("hd-bars");
  var scoreEl = document.getElementById("hd-score");
  var meterEl = document.getElementById("hd-meter");
  var hintEl = document.getElementById("hd-hint");
  var readout = document.getElementById("hd-readout");
  var goalEl = document.getElementById("hd-goal");
  var phaseBadge = document.getElementById("hd-phase-badge");
  var phaseTitle = document.getElementById("hd-phase-title");
  var unlockBtn = document.getElementById("hd-unlock");
  var resetBtn = document.getElementById("hd-reset");
  var headsEl = document.getElementById("hd-heads");
  var presetsEl = document.getElementById("hd-presets");
  var toastEl = document.getElementById("hd-toast");
  var floatEl = document.getElementById("hd-float");
  var caption = document.getElementById("hd-svg-caption");
  var boardHint = document.getElementById("hd-board-hint");

  var state = {
    phase: 1,
    head: 0,
    alpha: [mix(1 / 3, 1 / 3, 1 / 3), mix(1 / 3, 1 / 3, 1 / 3)],
    drag: -1,
    won: false
  };
  var toastTimer = 0;

  function mix(a, b, c) { return [a, b, c]; }
  function names() { return Proto && Proto.lang() === "en" ? NAMES_EN : NAMES_DE; }
  function sum(a) { return a[0] + a[1] + a[2]; }
  function clampAlpha(a) {
    var b = [Math.max(0, a[0]), Math.max(0, a[1]), Math.max(0, a[2])];
    var s = sum(b);
    if (s <= 1e-9) return mix(1 / 3, 1 / 3, 1 / 3);
    return mix(b[0] / s, b[1] / s, b[2] / s);
  }
  function toPoint(a) {
    return {
      x: a[0] * C[0].x + a[1] * C[1].x + a[2] * C[2].x,
      y: a[0] * C[0].y + a[1] * C[1].y + a[2] * C[2].y
    };
  }
  function bary(px, py) {
    var a = C[0], b = C[1], c = C[2];
    var d = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    if (Math.abs(d) < 1e-9) return mix(1 / 3, 1 / 3, 1 / 3);
    var w1 = ((b.y - c.y) * (px - c.x) + (c.x - b.x) * (py - c.y)) / d;
    var w2 = ((c.y - a.y) * (px - c.x) + (a.x - c.x) * (py - c.y)) / d;
    return clampAlpha([w1, w2, 1 - w1 - w2]);
  }
  function margin(a, target) {
    var others = [0, 1, 2].filter(function (i) { return i !== target; });
    return a[target] - Math.max(a[others[0]], a[others[1]]);
  }
  function activeAlpha() {
    return state.phase === 1 ? state.alpha[0] : state.alpha[state.head];
  }
  function setActiveAlpha(a) {
    if (state.phase === 1) {
      state.alpha[0] = a;
      state.alpha[1] = a.slice();
    } else {
      state.alpha[state.head] = a;
    }
  }
  function pctText(a) {
    return a.map(function (v) { return Math.round(v * 100) + "%"; });
  }

  function render() {
    var en = Proto && Proto.lang() === "en";
    var nm = names();
    var a = activeAlpha();
    var score;
    var m = [margin(state.alpha[0], TARGET[0]), margin(state.alpha[1], TARGET[1])];
    if (state.phase === 1) {
      m[0] = margin(state.alpha[0], TARGET[0]);
      m[1] = margin(state.alpha[0], TARGET[1]);
    }
    score = Math.min(m[0], m[1]);

    var nowWon = state.phase === 2 && score >= WIN;
    if (nowWon && !state.won) toast(t("Zwei Köpfe. Zwei Fragen. Ein Budget.", "Two heads. Two questions. One budget."));
    state.won = nowWon;

    var pt1 = toPoint(state.alpha[0]);
    p1.setAttribute("transform", "translate(" + pt1.x.toFixed(1) + " " + pt1.y.toFixed(1) + ")");
    var pt2 = toPoint(state.alpha[1]);
    p2.setAttribute("transform", "translate(" + pt2.x.toFixed(1) + " " + pt2.y.toFixed(1) + ")");
    p1.classList.toggle("is-active", state.phase === 1 || state.head === 0);
    p1.classList.toggle("is-dim", state.phase === 2 && state.head !== 0);
    p1.querySelector(".hd-point-label").textContent = state.phase === 1 ? "H1+H2" : "H1";
    if (state.phase === 1) {
      p2.hidden = true;
    } else {
      p2.hidden = false;
      p2.classList.toggle("is-active", state.head === 1);
      p2.classList.toggle("is-dim", state.head !== 1);
    }

    var pcts = pctText(a);
    pct[0].textContent = pcts[0];
    pct[1].textContent = pcts[1];
    pct[2].textContent = pcts[2];

    target0.classList.toggle("is-hit", m[0] >= WIN);
    target1.classList.toggle("is-hit", m[1] >= WIN);
    target0.classList.toggle("is-dead", state.phase === 2 && state.head === 1);
    target1.classList.toggle("is-dead", state.phase === 2 && state.head === 0);

    barsEl.innerHTML = [0, 1].map(function (h) {
      var mm = m[h];
      var width = Math.min(50, Math.abs(mm) * 50);
      var left = mm >= 0 ? 50 : 50 - width;
      var label = h === 0 ? (en ? "Head 1 → animal" : "Head 1 → Tier") : (en ? "Head 2 → street" : "Head 2 → Straße");
      var cls = mm >= WIN ? "is-ok" : "is-bad";
      return '<div class="hd-bar"><span class="hd-bar-label">' + label + '</span>' +
        '<span class="hd-bar-track"><i class="hd-bar-fill' + (mm < 0 ? " is-neg" : "") + '" style="left:' + left + '%;width:' + width + '%"></i></span>' +
        '<span class="hd-bar-val ' + cls + '">' + (mm >= 0 ? "+" : "") + mm.toFixed(2) + '</span></div>';
    }).join("");

    scoreEl.textContent = (score >= 0 ? "+" : "") + score.toFixed(2);
    scoreEl.style.color = score >= WIN ? "var(--g-green)" : score < 0 ? "var(--g-rose)" : "var(--g-ink)";
    meterEl.style.width = Math.max(0, Math.min(1, score / 0.6)) * 100 + "%";

    phaseBadge.textContent = state.phase === 1 ? "01 / 02" : "02 / 02";
    phaseTitle.textContent = state.phase === 1 ? "1 / 2" : "2 / 2";
    boardHint.textContent = state.phase === 1 ? "Σ α = 1 · ein Punkt" : "Σ α = 1 · zwei Punkte";
    caption.textContent = state.phase === 1
      ? (en ? "Σ α = 1 · one point, one budget" : "Σ α = 1 · ein Punkt, ein Budget")
      : (en ? "Σ α = 1 · two heads, two points" : "Σ α = 1 · zwei Köpfe, zwei Punkte");

    headsEl.querySelectorAll("[data-head]").forEach(function (b) {
      b.classList.toggle("is-on", parseInt(b.getAttribute("data-head"), 10) === state.head);
    });
    presetsEl.querySelectorAll("[data-corner]").forEach(function (b) {
      b.setAttribute("aria-pressed", "false");
    });

    if (state.phase === 1) {
      goalEl.innerHTML = en
        ? 'One head, two questions. Put the single point near <b>animal</b> and near <b>street</b> at the same time. Watch the two margins.'
        : 'Ein Kopf, zwei Fragen. Lege den einen Punkt gleichzeitig nahe an <b>Tier</b> und nahe an <b>Straße</b>. Beobachte die beiden Margins.';
      hintEl.textContent = score <= 0
        ? (en ? "One point cannot be in two corners. The minimum stays at or below zero." : "Ein Punkt kann nicht in zwei Ecken liegen. Das Minimum bleibt bei oder unter null.")
        : (en ? "Getting closer, but one of the two margins still pays for it." : "Näher dran, aber eine der beiden Margins zahlt dafür.");
    } else if (!state.won) {
      goalEl.innerHTML = en
        ? 'Now each head has its own point. Set <b>Head 1</b> to <b>animal</b> and <b>Head 2</b> to <b>street</b>. Get both margins to at least +0.30.'
        : 'Jetzt hat jeder Kopf seinen eigenen Punkt. Setze <b>Head 1</b> auf <b>Tier</b> und <b>Head 2</b> auf <b>Straße</b>. Bringe beide Margins auf mindestens +0,30.';
      hintEl.textContent = en
        ? "Switch heads with the chips above, then drag that head's point."
        : "Wechsle den Kopf oben und ziehe dann seinen Punkt.";
    } else {
      goalEl.innerHTML = en
        ? '<b>Solved.</b> One budget, two allocations. This is why multiple heads exist.'
        : '<b>Gelöst.</b> Ein Budget, zwei Allokationen. Deshalb gibt es mehrere Köpfe.';
      hintEl.textContent = en
        ? "The two learned diamonds below are the model's own two allocations."
        : "Die beiden Diamanten unten sind die gelernten Allokationen des Modells.";
    }

    if (state.phase === 1) {
      readout.innerHTML = en
        ? '<b>One point for both questions.</b> animal ' + pcts[0] + ', street ' + pcts[1] + ', it ' + pcts[2] + '. Head 1 margin ' + fmtSigned(m[0]) + ', Head 2 margin ' + fmtSigned(m[1]) + '.'
        : '<b>Ein Punkt für beide Fragen.</b> Tier ' + pcts[0] + ', Straße ' + pcts[1] + ', es ' + pcts[2] + '. Head-1-Margin ' + fmtSigned(m[0]) + ', Head-2-Margin ' + fmtSigned(m[1]) + '.';
    } else {
      var a1 = pctText(state.alpha[0]);
      var a2 = pctText(state.alpha[1]);
      readout.innerHTML = en
        ? '<b>Head 1</b> animal ' + a1[0] + ' · <b>Head 2</b> street ' + a2[1] + '. Both margins ' + fmtSigned(m[0]) + ' and ' + fmtSigned(m[1]) + '.'
        : '<b>Head 1</b> Tier ' + a1[0] + ' · <b>Head 2</b> Straße ' + a2[1] + '. Beide Margins ' + fmtSigned(m[0]) + ' und ' + fmtSigned(m[1]) + '.';
    }

    if (state.phase === 1) {
      unlockBtn.hidden = false;
      unlockBtn.disabled = false;
      unlockBtn.textContent = en ? "Unlock the second head" : "Zweiten Kopf freischalten";
    } else {
      unlockBtn.hidden = true;
    }
    headsEl.querySelector('[data-head="1"]').disabled = state.phase === 1;

    if (state.won) {
      learnedPanel.hidden = false;
      learnedEls.forEach(function (el, h) {
        var p = toPoint(LEARNED[h]);
        el.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ")");
        if (el.hidden) {
          el.hidden = false;
          el.classList.add("is-on");
        }
      });
      learnedRows.innerHTML = [0, 1].map(function (h) {
        var aL = LEARNED[h];
        var label = h === 0 ? "Head 1" : "Head 2";
        return '<div class="hd-learned-row' + (h === 1 ? " hd-learned-row--sky" : "") + '"><b>' + label + '</b><span class="hd-learned-bar"><i style="width:' + (aL[TARGET[h]] * 100).toFixed(0) + '%"></i></span><span>' + nm[TARGET[h]] + ' ' + Math.round(aL[TARGET[h]] * 100) + '%</span></div>';
      }).join("");
    } else {
      learnedPanel.hidden = true;
      learnedEls.forEach(function (el) { el.hidden = true; el.classList.remove("is-on"); });
    }

  }

  function fmtSigned(v) { return (v >= 0 ? "+" : "") + v.toFixed(2); }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 3200);
  }

  function setActiveFromEvent(e) {
    var pt = svgPoint(e);
    if (!pt) return null;
    var a = bary(pt.x, pt.y);
    setActiveAlpha(a);
    render();
    return pt;
  }
  function svgPoint(e) {
    var r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    var vb = svg.viewBox.baseVal;
    return {
      x: (e.clientX - r.left) / r.width * vb.width,
      y: (e.clientY - r.top) / r.height * vb.height
    };
  }
  function nearestPoint(pt) {
    var best = -1, bd = 26;
    var p = toPoint(state.alpha[0]);
    var d1 = Math.hypot(pt.x - p.x, pt.y - p.y);
    if (d1 < bd) { bd = d1; best = 0; }
    if (state.phase === 2) {
      var q = toPoint(state.alpha[1]);
      var d2 = Math.hypot(pt.x - q.x, pt.y - q.y);
      if (d2 < bd) { best = 1; }
    }
    return best;
  }

  svg.addEventListener("pointerdown", function (e) {
    if (e.button != null && e.button !== 0) return;
    var pt = svgPoint(e);
    if (!pt) return;
    var near = nearestPoint(pt);
    if (near >= 0) {
      state.head = near;
      state.drag = near;
    } else {
      state.drag = state.phase === 1 ? 0 : state.head;
      setActiveFromEvent(e);
    }
    if (svg.setPointerCapture) { try { svg.setPointerCapture(e.pointerId); } catch (err) {} }
    e.preventDefault();
  });
  svg.addEventListener("pointermove", function (e) {
    var pt = svgPoint(e);
    if (!pt) return;
    if (state.drag >= 0) {
      setActiveFromEvent(e);
    }
    var near = nearestPoint(pt);
    if (near >= 0) {
      var a = state.alpha[near];
      var box = board.getBoundingClientRect();
      var screen = toScreen(toPoint(a));
      floatEl.innerHTML = "<b>H" + (near + 1) + "</b> " + pctText(a).join(" · ");
      floatEl.style.left = (screen.x - box.left) + "px";
      floatEl.style.top = (screen.y - box.top) + "px";
      floatEl.classList.add("is-on");
    } else {
      floatEl.classList.remove("is-on");
    }
  });
  function endDrag() { state.drag = -1; }
  svg.addEventListener("pointerup", endDrag);
  svg.addEventListener("pointercancel", endDrag);
  svg.addEventListener("pointerleave", function () {
    floatEl.classList.remove("is-on");
    endDrag();
  });
  function toScreen(p) {
    var r = svg.getBoundingClientRect();
    var vb = svg.viewBox.baseVal;
    return { x: r.left + p.x / vb.width * r.width, y: r.top + p.y / vb.height * r.height };
  }

  svg.addEventListener("keydown", function (e) {
    var step = e.shiftKey ? 0.05 : 0.018;
    var a = activeAlpha().slice();
    var changed = true;
    if (e.key === "ArrowLeft") { a[1] += step; a[2] -= step; }
    else if (e.key === "ArrowRight") { a[1] -= step; a[2] += step; }
    else if (e.key === "ArrowUp") { a[0] += step; a[1] -= step / 2; a[2] -= step / 2; }
    else if (e.key === "ArrowDown") { a[0] -= step; a[1] += step / 2; a[2] += step / 2; }
    else changed = false;
    if (!changed) return;
    e.preventDefault();
    setActiveAlpha(clampAlpha(a));
    render();
  });

  headsEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-head]");
    if (!b || b.disabled) return;
    state.head = parseInt(b.getAttribute("data-head"), 10);
    render();
  });

  presetsEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-corner]");
    if (!b) return;
    var corner = parseInt(b.getAttribute("data-corner"), 10);
    var a = [0.15, 0.15, 0.15];
    a[corner] = 0.70;
    setActiveAlpha(a);
    render();
  });

  unlockBtn.addEventListener("click", function () {
    if (state.phase === 2) return;
    state.phase = 2;
    state.head = 1;
    state.alpha[1] = state.alpha[0].slice();
    toast(t("Zweiter Kopf frei. Jetzt hat jede Frage ihren eigenen Punkt.", "Second head unlocked. Now each question has its own point."));
    render();
  });

  resetBtn.addEventListener("click", function () {
    state.phase = 1;
    state.head = 0;
    state.alpha = [mix(1 / 3, 1 / 3, 1 / 3), mix(1 / 3, 1 / 3, 1 / 3)];
    state.won = false;
    state.drag = -1;
    toastEl.classList.remove("is-on");
    floatEl.classList.remove("is-on");
    render();
  });

  if (window.Proto && Proto.onLang) Proto.onLang(render);
  render();
})();
