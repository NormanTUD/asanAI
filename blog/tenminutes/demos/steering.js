(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp;

  function steeringScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var C = api.colors();
    var LIGHT = "#eef7f4";
    var MUTED = "rgba(238,247,244,.62)";
    var W = {
      man: { p: [0, -1, 0], label: ["Mann", "Man"], col: "sky" },
      woman: { p: [0, 1, 0], label: ["Frau", "Woman"], col: "green" },
      king: { p: [1, -1, 0.5], label: ["König", "King"], col: "gold" },
      queen: { p: [1, 1, 0.5], label: ["Königin", "Queen"], col: "gold", target: true },
      prince: { p: [0.55, -1, 0.2], label: ["Prinz", "Prince"], col: "lilac" },
      princess: { p: [0.55, 1, 0.2], label: ["Prinzessin", "Princess"], col: "lilac" },
      power: { p: [0.8, 0, 0.2], label: ["Macht", "Power"], col: "sky" },
      money: { p: [0.2, 0, -0.9], label: ["Geld", "Money"], col: "green" },
      river: { p: [-0.85, 0, -0.25], label: ["Fluss", "River"], col: "blue" },
      past: { p: [-0.7, 0, 0.6], label: ["gestern", "yesterday"], col: "muted" },
      future: { p: [0.7, 0, 0.6], label: ["morgen", "tomorrow"], col: "muted" }
    };
    var START = W.man.p.slice();
    var TARGET = W.queen.p.slice();
    var START_DIST = dist(START, TARGET) || 1;
    var OPS = [
      { id: "woman", vec: [0, 2, 0], col: "green", label: ["Frau", "Woman"], sub: ["Geschlecht +", "Gender +"], group: "recipe" },
      { id: "power", vec: [0.8, 0, 0.2], col: "gold", label: ["Macht", "Power"], sub: ["Einfluss +", "Influence +"], group: "recipe" },
      { id: "rank", vec: [0.2, 0, 0.3], col: "lilac", label: ["Rang", "Rank"], sub: ["Rang +", "Rank +"], group: "recipe" },
      { id: "not", kind: "negate", col: "lilac", label: ["nicht", "not"], sub: ["dreht", "flips"], group: "modifier" },
      { id: "very", kind: "scale", scale: 1.7, col: "green", label: ["sehr", "very"], sub: ["× 1,7", "× 1.7"], group: "modifier" },
      { id: "less", kind: "scale", scale: 0.45, col: "blue", label: ["weniger", "less"], sub: ["× 0,45", "× 0.45"], group: "modifier" },
      { id: "money", vec: [0.2, 0, -0.9], col: "green", label: ["Geld", "Money"], sub: ["Kontext", "context"], group: "context" },
      { id: "river", vec: [-0.85, 0, -0.25], col: "blue", label: ["Fluss", "River"], sub: ["Kontext", "context"], group: "context" },
      { id: "past", vec: [-0.7, 0, 0.6], col: "muted", label: ["gestern", "yesterday"], sub: ["Zeit", "time"], group: "context" }
    ];

    function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
    function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
    function scale(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    function text(loc) { return DE ? loc[0] : loc[1]; }

    var el = document.createElement("div");
    el.className = "ls-steer-scene";
    el.innerHTML =
      '<div class="ls-steer-stage">' +
        '<canvas class="ls-steer-canvas" role="img"></canvas>' +
        '<div class="ls-steer-hud"><span class="ls-steer-hud-chip">' + (DE ? "Ziel" : "Target") + ' <b>' + text(W.queen.label) + '</b></span><span class="ls-steer-hud-chip ls-steer-distance"></span></div>' +
        '<div class="ls-steer-legend"><span><i style="background:' + (C.green || "#63a44b") + '"></i>' + (DE ? "Geschlecht" : "Gender") + '</span><span><i style="background:' + (C.gold || "#9f9700") + '"></i>' + (DE ? "Macht / Rang" : "Power / rank") + '</span><span><i style="background:' + (C.sky || "#5c9baf") + '"></i>' + (DE ? "Kontext" : "Context") + '</span></div>' +
      '</div>' +
      '<div class="ls-steer-lower">' +
        '<div class="ls-steer-console">' +
          '<div class="ls-steer-label">' + (DE ? "Richtungen" : "Directions") + '</div>' +
          '<div class="ls-steer-ops" role="group" aria-label="' + (DE ? "Wortrichtungen" : "Word directions") + '"></div>' +
          '<div class="ls-steer-sequence" aria-live="polite"></div>' +
          '<div class="ls-steer-actions"><button type="button" class="ls-btn ls-btn--tiny ls-steer-reset">' + (DE ? "Zurücksetzen" : "Reset") + '</button><button type="button" class="ls-btn ls-btn--tiny ls-steer-over">' + (DE ? "Übersteuern" : "Oversteer") + '</button></div>' +
        '</div>' +
        '<div class="ls-steer-side">' +
          '<div class="ls-steer-label">' + (DE ? "Steuerung" : "Steering") + '</div>' +
          '<div class="ls-steer-gauge"><div class="ls-steer-gauge-track"><i></i></div><b class="ls-steer-gauge-mark"></b><div class="ls-steer-gauge-legend"><span>' + (DE ? "schwach" : "weak") + '</span><span>' + (DE ? "sweet spot" : "sweet spot") + '</span><span>' + (DE ? "übersteuert" : "oversteered") + '</span></div></div>' +
          '<div class="ls-steer-probs"></div>' +
        '</div>' +
      '</div>' +
      '<div class="ls-steer-readout" aria-live="polite"></div>' +
      '<p class="ls-steer-note">' + (DE ? "Ein Punkt im Raum, ein Ziel. Die Wortchips sind Richtungen, keine festen Orte. Die 3D-Projektion ist eine didaktische Hilfe; im echten Modell liegen hunderte Dimensionen dazwischen." : "A point in space, a target. The word chips are directions, not fixed places. The 3D projection is a teaching aid; in a real model hundreds of dimensions sit in between.") + '</p>';
    root.appendChild(el);

    var stage = el.querySelector(".ls-steer-stage");
    var canvas = el.querySelector(".ls-steer-canvas");
    var opsEl = el.querySelector(".ls-steer-ops");
    var sequence = el.querySelector(".ls-steer-sequence");
    var probsEl = el.querySelector(".ls-steer-probs");
    var gaugeMark = el.querySelector(".ls-steer-gauge-mark");
    var distanceEl = el.querySelector(".ls-steer-distance");
    var readout = el.querySelector(".ls-steer-readout");
    var resetBtn = el.querySelector(".ls-steer-reset");
    var overBtn = el.querySelector(".ls-steer-over");
    var size = null, ctx = null;
    var point = START.slice(), display = START.slice(), trail = [START.slice()];
    var steps = [], pending = [], negateNext = false, scaleNext = 1;
    var hoverOp = null, drag = null, yaw = -0.52, pitch = 0.3, zoom = 1;
    var animRaf = 0, pulseRaf = 0, reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var bounds = V.trajBounds(
      Object.keys(W).map(function (k) { return W[k].p; }),
      [[-1.7, -1.4, 0.9], [1.9, 1.4, 0.9], [1.9, 0.2, -1.2]]
    );

    function labelColor(key) { return C[key] || C.petrol || "#004b6f"; }
    function addOpButtons() {
      OPS.forEach(function (op) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ls-steer-op" + (op.group === "recipe" ? " is-recipe" : "");
        b.setAttribute("data-op", op.id);
        b.innerHTML = '<i style="background:' + labelColor(op.col) + '"></i><b>' + esc(text(op.label)) + '</b><small>' + esc(text(op.sub)) + '</small>';
        b.addEventListener("click", function () { useOp(op); });
        b.addEventListener("mouseenter", function () { hoverOp = op; draw(); });
        b.addEventListener("focus", function () { hoverOp = op; draw(); });
        b.addEventListener("mouseleave", function () { hoverOp = null; draw(); });
        b.addEventListener("blur", function () { hoverOp = null; draw(); });
        opsEl.appendChild(b);
      });
    }

    function useOp(op) {
      if (op.kind === "negate") {
        negateNext = !negateNext;
        pending.push({ id: op.id, label: text(op.label) });
        sync();
        return;
      }
      if (op.kind === "scale") {
        scaleNext = op.scale;
        pending.push({ id: op.id, label: text(op.label) });
        sync();
        return;
      }
      var vec = scale(op.vec, scaleNext * (negateNext ? -1 : 1));
      var label = pending.map(function (p) { return p.label; }).concat([text(op.label)]).join(" ");
      steps.push({ vec: vec, label: label });
      pending = [];
      negateNext = false;
      scaleNext = 1;
      recompute();
      sync();
    }

    function recompute() {
      var next = START.slice();
      steps.forEach(function (s) { next = add(next, s.vec); });
      point = next;
      trail = [START.slice()].concat(steps.map(function (_, i) {
        var p = START.slice();
        for (var k = 0; k <= i; k++) p = add(p, steps[k].vec);
        return p;
      }));
      animateTo(next);
    }

    function animateTo(next) {
      if (animRaf) cancelAnimationFrame(animRaf);
      var from = display.slice(), t0 = performance.now(), dur = reduced ? 0 : 420;
      point = next.slice();
      function frame(now) {
        var t = dur ? Math.min(1, (now - t0) / dur) : 1;
        var e = 1 - Math.pow(1 - t, 3);
        display = [from[0] + (point[0] - from[0]) * e, from[1] + (point[1] - from[1]) * e, from[2] + (point[2] - from[2]) * e];
        draw();
        if (t < 1) animRaf = requestAnimationFrame(frame); else animRaf = 0;
      }
      if (!dur) { display = point.slice(); draw(); return; }
      animRaf = requestAnimationFrame(frame);
    }

    function reset() {
      steps = []; pending = []; negateNext = false; scaleNext = 1;
      point = START.slice(); display = START.slice(); trail = [START.slice()];
      if (animRaf) { cancelAnimationFrame(animRaf); animRaf = 0; }
      sync(); draw();
    }

    function oversteer() {
      reset();
      steps = [
        { vec: [0, 2, 0], label: DE ? "Frau" : "Woman" },
        { vec: [1.44, 0, 0.36], label: DE ? "sehr Macht" : "very Power" },
        { vec: [1.44, 0, 0.36], label: DE ? "sehr Macht" : "very Power" },
        { vec: [1.44, 0, 0.36], label: DE ? "sehr Macht" : "very Power" }
      ];
      recompute(); sync();
    }

    function nearest(p) {
      return Object.keys(W).map(function (k) {
        return { key: k, d: dist(p, W[k].p), word: text(W[k].label), col: W[k].col };
      }).sort(function (a, b) { return a.d - b.d; });
    }
    function probabilities(p) {
      var list = nearest(p).slice(0, 6);
      var ex = list.map(function (n) { return Math.exp(-(n.d * n.d) / 0.22); });
      var sum = ex.reduce(function (a, b) { return a + b; }, 0) || 1;
      return list.map(function (n, i) { return { word: n.word, p: ex[i] / sum, col: n.col, key: n.key }; });
    }
    function status() {
      var d = dist(point, TARGET);
      var control = clamp(1 - d / START_DIST, 0, 1.25);
      if (d < 0.18) return { id: "sweet", text: DE ? "Ziel erreicht" : "Target reached", control: control };
      var along = dot([point[0] - START[0], point[1] - START[1], point[2] - START[2]], [TARGET[0] - START[0], TARGET[1] - START[1], TARGET[2] - START[2]]) / (START_DIST * START_DIST);
      if (along > 1.18) return { id: "over", text: DE ? "übersteuert" : "oversteered", control: control };
      return { id: "weak", text: DE ? "noch zu schwach" : "still too weak", control: control };
    }

    function sync() {
      var st = status();
      var p = probabilities(point);
      sequence.innerHTML = '<span class="ls-steer-seq-label">' + (DE ? "Zug" : "Move") + ':</span>' +
        (steps.length ? steps.map(function (s) { return '<span>' + esc(s.label) + '</span>'; }).join('<i>→</i>') : '<span class="is-empty">' + (DE ? "Start bei Mann" : "Start at Man") + '</span>') +
        (pending.length ? '<i>+</i>' + pending.map(function (m) { return '<span class="is-pending">' + esc(m.label) + '</span>'; }).join(' ') : '');
      gaugeMark.style.left = (clamp(st.control / 1.25, 0, 1) * 100).toFixed(1) + "%";
      gaugeMark.setAttribute("data-state", st.id);
      distanceEl.innerHTML = (DE ? "Distanz" : "Distance") + ' <b>' + dist(point, TARGET).toFixed(2) + '</b>';
      probsEl.innerHTML = p.slice(0, 4).map(function (x) {
        return '<div class="ls-steer-prob" data-target="' + (x.key === "queen" ? "1" : "0") + '"><span>' + esc(x.word) + '</span><i><b style="width:' + Math.max(1, x.p * 100).toFixed(1) + '%;background:' + labelColor(x.col) + '"></b></i><em>' + (x.p * 100).toFixed(0) + '%</em></div>';
      }).join("");
      readout.innerHTML = '<span class="is-' + st.id + '">' + st.text + '</span><span>' + (DE ? "nächste Wörter" : "nearest words") + ': <b>' + esc(p.slice(0, 3).map(function (x) { return x.word; }).join(" · ")) + '</b></span>' + (pending.length ? '<span>' + (DE ? "wartet auf Richtung" : "waiting for a direction") + '</span>' : '');
      canvas.setAttribute("aria-label", (DE ? "Semantischer Punkt. " : "Semantic point. ") + st.text + ". " + (DE ? "Nächste Wörter: " : "Nearest words: ") + p.slice(0, 3).map(function (x) { return x.word; }).join(", ") + ".");
    }

    function tag(x, y, txt, col, align) {
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      var tw = ctx.measureText(txt).width;
      var pad = 5, h = 18;
      var bx = align === "right" ? x - tw - pad * 2 : x;
      ctx.fillStyle = "rgba(0, 21, 29,.82)";
      ctx.fillRect(bx, y - h / 2, tw + pad * 2, h);
      ctx.strokeStyle = col; ctx.globalAlpha = .42; ctx.strokeRect(bx + .5, y - h / 2 + .5, tw + pad * 2 - 1, h - 1); ctx.globalAlpha = 1;
      ctx.fillStyle = LIGHT; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(txt, bx + pad, y + .5);
    }

    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      var bg = ctx.createRadialGradient(w * .52, h * .44, 12, w * .52, h * .48, Math.max(w, h) * .82);
      bg.addColorStop(0, "rgba(0,75,111,.42)");
      bg.addColorStop(.55, "rgba(0,36,48,.9)");
      bg.addColorStop(1, "#00131b");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      // orbit rings
      var c0 = V.trajProject([0, 0, 0], bounds, yaw, pitch, zoom, size);
      [0.9, 1.35].forEach(function (r, ri) {
        ctx.beginPath();
        for (var i = 0; i <= 64; i++) {
          var a = i / 64 * Math.PI * 2;
          var pp = V.trajProject([Math.cos(a) * r, Math.sin(a) * r, 0], bounds, yaw, pitch, zoom, size);
          if (i === 0) ctx.moveTo(pp.x, pp.y); else ctx.lineTo(pp.x, pp.y);
        }
        ctx.strokeStyle = ri ? "rgba(238,247,244,.09)" : "rgba(92,155,175,.16)";
        ctx.lineWidth = 1; ctx.stroke();
      });
      // axes
      [[1.55, 0, 0], [0, 1.55, 0], [0, 0, 1.05]].forEach(function (ax, i) {
        var a = V.trajProject([-ax[0], -ax[1], -ax[2]], bounds, yaw, pitch, zoom, size);
        var b = V.trajProject(ax, bounds, yaw, pitch, zoom, size);
        ctx.strokeStyle = [C.green, C.gold, C.sky][i] || C.sky; ctx.globalAlpha = .2; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.globalAlpha = 1;
      });
      // cloud
      Object.keys(W).forEach(function (k) {
        var word = W[k];
        if (k === "queen") return;
        var p = V.trajProject(word.p, bounds, yaw, pitch, zoom, size);
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = labelColor(word.col); ctx.fill();
        ctx.globalAlpha = .4; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fillStyle = labelColor(word.col); ctx.fill(); ctx.globalAlpha = 1;
        tag(p.x + 8, p.y, text(word.label), labelColor(word.col));
      });
      // target
      var t = V.trajProject(TARGET, bounds, yaw, pitch, zoom, size);
      var pulse = reduced ? 0 : (performance.now() % 2200) / 2200;
      ctx.beginPath(); ctx.arc(t.x, t.y, 13 + pulse * 6, 0, Math.PI * 2);
      ctx.strokeStyle = C.gold; ctx.globalAlpha = .5 - pulse * .3; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(t.x, t.y, 5, 0, Math.PI * 2); ctx.fillStyle = C.gold; ctx.fill();
      tag(t.x + 10, t.y - 16, (DE ? "Ziel · " : "Target · ") + text(W.queen.label), C.gold);
      // trail
      if (trail.length > 1) {
        ctx.beginPath();
        trail.forEach(function (q, i) {
          var p = V.trajProject(q, bounds, yaw, pitch, zoom, size);
          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = C.green; ctx.globalAlpha = .72; ctx.lineWidth = 3; ctx.lineJoin = "round";
        ctx.shadowColor = C.green; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }
      // hover direction
      if (hoverOp && hoverOp.vec) {
        var hv = scale(hoverOp.vec, scaleNext * (negateNext ? -1 : 1));
        var a = V.trajProject(display, bounds, yaw, pitch, zoom, size);
        var b = V.trajProject(add(display, hv), bounds, yaw, pitch, zoom, size);
        ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = labelColor(hoverOp.col); ctx.lineWidth = 1.5; ctx.globalAlpha = .9;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
        ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fillStyle = labelColor(hoverOp.col); ctx.fill();
      }
      // current point
      var p = V.trajProject(display, bounds, yaw, pitch, zoom, size);
      ctx.beginPath(); ctx.arc(p.x, p.y, 18 + (reduced ? 0 : pulse * 3), 0, Math.PI * 2);
      ctx.fillStyle = "rgba(134,155,85,.13)"; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = C.lime || C.green; ctx.shadowColor = C.green; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fillStyle = LIGHT; ctx.fill();
      // formula marker
      ctx.fillStyle = MUTED; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; ctx.textAlign = "left";
      ctx.fillText(DE ? "Punkt = Start + Summe der Richtungen" : "point = start + sum of directions", 16, h - 16);
    }

    addOpButtons();
    function resize() { size = api.fit(canvas, stage); draw(); }
    function pointer(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    canvas.addEventListener("pointerdown", function (e) { drag = pointer(e); canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var p = pointer(e);
      yaw += (p.x - drag.x) * .008;
      pitch = clamp(pitch + (p.y - drag.y) * .006, -1.1, 1.1);
      drag = p; draw();
    });
    canvas.addEventListener("pointerup", function () { drag = null; });
    canvas.addEventListener("pointercancel", function () { drag = null; });
    canvas.addEventListener("wheel", function (e) { e.preventDefault(); zoom = clamp(zoom * (e.deltaY > 0 ? .94 : 1.06), .55, 2.1); draw(); }, { passive: false });
    resetBtn.addEventListener("click", reset);
    overBtn.addEventListener("click", oversteer);
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    function tick() { if (!reduced) { draw(); pulseRaf = requestAnimationFrame(tick); } }
    function startPulse() { if (!reduced && !pulseRaf) pulseRaf = requestAnimationFrame(tick); }
    function stopPulse() { if (pulseRaf) { cancelAnimationFrame(pulseRaf); pulseRaf = 0; } }
    sync(); resize(); startPulse();
    return {
      update: function () {},
      next: function () {
        var recipe = ["woman", "power", "rank"];
        if (steps.length >= 3) return false;
        var op = OPS.filter(function (x) { return x.id === recipe[steps.length]; })[0];
        if (!op) return false;
        useOp(op); return true;
      },
      prev: function () {
        if (!steps.length) return false;
        steps.pop(); recompute(); sync(); return true;
      },
      finish: function () {
        if (steps.length >= 3) return;
        ["woman", "power", "rank"].slice(steps.length).forEach(function (id) {
          var op = OPS.filter(function (x) { return x.id === id; })[0];
          if (op) useOp(op);
        });
      },
      pause: function () { stopPulse(); if (animRaf) { cancelAnimationFrame(animRaf); animRaf = 0; } },
      resume: function () { display = point.slice(); startPulse(); draw(); },
      resize: resize,
      destroy: function () {
        stopPulse(); if (animRaf) cancelAnimationFrame(animRaf);
        window.removeEventListener("resize", resize);
        el.remove();
      }
    };
  }

  core.register("steering", steeringScene);
})();
