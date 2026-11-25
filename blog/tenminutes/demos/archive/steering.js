(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp;

  function steeringScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var C = api.colors();
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

    var LINKS = [
      ["man", "woman"], ["king", "queen"], ["prince", "princess"],
      ["king", "prince"], ["queen", "princess"], ["power", "king"],
      ["money", "river"], ["past", "future"]
    ];
    var DUST = (function () {
      var d = [], seed = 41;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      for (var i = 0; i < 34; i++) d.push({ x: (rnd() - .5) * 3.6, y: (rnd() - .5) * 3.2, z: (rnd() - .5) * 2.2, s: .4 + rnd() * 1.4, p: rnd() * 6.28, a: .04 + rnd() * .10, r: .7 + rnd() * 1.6 });
      return d;
    })();
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
        '<div class="ls-steer-hud"><span class="ls-steer-hud-chip">' + (DE ? "Ziel" : "Target") + ' <b>' + text(W.queen.label) + '</b></span><span class="ls-steer-hud-title">' + (DE ? "Semantische Landschaft" : "Semantic landscape") + '</span><span class="ls-steer-hud-chip ls-steer-distance"></span></div>' +
        '<div class="ls-steer-legend"><span><i style="background:' + (C.green || "#63a44b") + '"></i>' + (DE ? "Geschlecht" : "Gender") + '</span><span><i style="background:' + (C.gold || "#9f9700") + '"></i>' + (DE ? "Macht / Rang" : "Power / rank") + '</span><span><i style="background:' + (C.sky || "#5c9baf") + '"></i>' + (DE ? "Kontext" : "Context") + '</span></div>' +
        '<div class="ls-steer-whisper" aria-hidden="true"></div>' +
      '</div>' +
      '<div class="ls-steer-lower">' +
        '<div class="ls-steer-console">' +
          '<div class="ls-steer-label">' + (DE ? "Richtungen" : "Directions") + '</div>' +
          '<div class="ls-steer-ops" role="group" aria-label="' + (DE ? "Wortrichtungen" : "Word directions") + '"></div>' +
          '<div class="ls-steer-sequence" aria-live="polite"></div>' +
          '<div class="ls-steer-formula">e<sub>neu</sub> = e<sub>alt</sub> + α · d<sub>Wort</sub><span>' + (DE ? "Richtung plus Distanz" : "direction plus distance") + '</span></div>' +
          '<div class="ls-steer-actions"><button type="button" class="ls-btn ls-btn--tiny ls-steer-analogy">' + (DE ? "König − Mann + Frau" : "King − Man + Woman") + '</button><button type="button" class="ls-btn ls-btn--tiny ls-steer-reset">' + (DE ? "Zurücksetzen" : "Reset") + '</button><button type="button" class="ls-btn ls-btn--tiny ls-steer-over">' + (DE ? "Übersteuern" : "Oversteer") + '</button></div>' +
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
    var whisper = el.querySelector(".ls-steer-whisper");
    var readout = el.querySelector(".ls-steer-readout");
    var resetBtn = el.querySelector(".ls-steer-reset");
    var overBtn = el.querySelector(".ls-steer-over");
    var analogyBtn = el.querySelector(".ls-steer-analogy");
    var size = null, ctx = null;
    var point = START.slice(), display = START.slice(), trail = [START.slice()];
    var steps = [], pending = [], negateNext = false, scaleNext = 1;
    var hoverOp = null, drag = null, yaw = -0.52, pitch = 0.3, zoom = 1.22;
    var animRaf = 0, pulseRaf = 0, burst = 0, lastStatus = "", reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var bounds = V.trajBounds(
      Object.keys(W).map(function (k) { return W[k].p; }),
      [[-1.7, -1.4, 0.9], [1.9, 1.4, 0.9], [1.9, 0.2, -1.2]]
    );
    function project(v) {
      var x = (v[0] - bounds.c[0]) / bounds.ext;
      var y = (v[1] - bounds.c[1]) / bounds.ext;
      var z = (v[2] - bounds.c[2]) / bounds.ext;
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var x1 = x * cy - y * sy, y1 = x * sy + y * cy;
      var y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;
      var s = Math.min(size.w * .46, size.h * .78) * zoom / (1 + z2 * .20);
      return { x: size.w * .5 + x1 * s, y: size.h * .52 - y2 * s, z: z2 };
    }

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
      burst = 0; lastStatus = "";
      if (animRaf) { cancelAnimationFrame(animRaf); animRaf = 0; }
      sync(); draw();
    }

    function analogy() {
      reset();
      steps = [{ vec: [1, 2, .5], label: DE ? "König − Mann + Frau" : "King − Man + Woman" }];
      recompute(); sync();
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
      if (st.id === "sweet" && lastStatus !== "sweet") burst = performance.now();
      lastStatus = st.id;
      if (whisper) {
        whisper.textContent = st.id === "sweet" ? (DE ? "Du hast den Punkt bewegt." : "You moved the point.") : st.id === "over" ? (DE ? "Zu weit." : "Too far.") : steps.length ? (DE ? "Noch nicht am Ziel." : "Not at the target yet.") : (DE ? "Wähle eine Richtung." : "Choose a direction.");
        whisper.setAttribute("data-state", st.id);
      }
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
      if (bx + tw + pad * 2 > size.w - 6) bx = size.w - tw - pad * 2 - 6;
      if (bx < 6) bx = 6;
      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.fillRect(bx, y - h / 2, tw + pad * 2, h);
      ctx.strokeStyle = col; ctx.globalAlpha = .45; ctx.strokeRect(bx + .5, y - h / 2 + .5, tw + pad * 2 - 1, h - 1); ctx.globalAlpha = 1;
      ctx.fillStyle = C.ink; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(txt, bx + pad, y + .5);
    }

    function terrainColor(t) {
      t = clamp(t, 0, 1);
      return t < .58 ? V.mix(C.green, C.gold, t / .58) : V.mix(C.gold, C.lilac, (t - .58) / .42);
    }

    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h, now = performance.now();
      ctx.clearRect(0, 0, w, h);
      var bg = ctx.createRadialGradient(w * .52, h * .44, 12, w * .52, h * .48, Math.max(w, h) * .82);
      bg.addColorStop(0, "#ffffff");
      bg.addColorStop(.62, "#fbfdfc");
      bg.addColorStop(1, "#f2f7f5");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      // soft aurora light, made only from the palette
      var au = ctx.createRadialGradient(w * .79, h * .24, 0, w * .79, h * .24, Math.max(w, h) * .56);
      au.addColorStop(0, V.alpha(C.gold, .10)); au.addColorStop(.46, V.alpha(C.gold, .025)); au.addColorStop(1, V.alpha(C.gold, 0));
      ctx.fillStyle = au; ctx.fillRect(0, 0, w, h);
      var at = ctx.createRadialGradient(w * .20, h * .73, 0, w * .20, h * .73, Math.max(w, h) * .50);
      at.addColorStop(0, V.alpha(C.teal || C.petrol, .08)); at.addColorStop(.55, V.alpha(C.teal || C.petrol, .015)); at.addColorStop(1, V.alpha(C.teal || C.petrol, 0));
      ctx.fillStyle = at; ctx.fillRect(0, 0, w, h);
      // semantic floor: a soft energy landscape around the target
      var N = 20, floor = [], range = 1.8;
      function floorZ(x, y) { return -1.16 + 0.48 * clamp(dist([x, y, 0], TARGET) / 2.15, 0, 1); }
      for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) {
        var x0 = -range + 2 * range * j / N, x1 = -range + 2 * range * (j + 1) / N;
        var y0 = -range + 2 * range * i / N, y1 = -range + 2 * range * (i + 1) / N;
        var p0 = project([x0, y0, floorZ(x0, y0)]);
        var p1 = project([x1, y0, floorZ(x1, y0)]);
        var p2 = project([x1, y1, floorZ(x1, y1)]);
        var p3 = project([x0, y1, floorZ(x0, y1)]);
        var mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        floor.push({ p: [p0, p1, p2, p3], z: (p0.z + p1.z + p2.z + p3.z) / 4, t: dist([mx, my, 0], TARGET) / 2.15 });
      }
      floor.sort(function (a, b) { return a.z - b.z; });
      floor.forEach(function (c) {
        ctx.beginPath(); ctx.moveTo(c.p[0].x, c.p[0].y); ctx.lineTo(c.p[1].x, c.p[1].y); ctx.lineTo(c.p[2].x, c.p[2].y); ctx.lineTo(c.p[3].x, c.p[3].y); ctx.closePath();
        ctx.fillStyle = terrainColor(c.t); ctx.globalAlpha = .58; ctx.fill();
        ctx.globalAlpha = .42; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = .9; ctx.stroke();
      });
      ctx.globalAlpha = 1;
      // topographic contours around the target valley
      [0.45, 0.9, 1.35, 1.8].forEach(function (r, ci) {
        ctx.beginPath();
        for (var q = 0; q <= 72; q++) {
          var a = q / 72 * Math.PI * 2;
          var x = TARGET[0] + Math.cos(a) * r, y = TARGET[1] + Math.sin(a) * r;
          var pp = project([x, y, floorZ(x, y) + .004]);
          if (q === 0) ctx.moveTo(pp.x, pp.y); else ctx.lineTo(pp.x, pp.y);
        }
        ctx.strokeStyle = ci % 2 ? C.sky : C.gold; ctx.globalAlpha = .13 - ci * .012; ctx.lineWidth = .9; ctx.stroke();
      });
      ctx.globalAlpha = 1;
      // orbit rings
      [0.9, 1.35].forEach(function (r, ri) {
        ctx.beginPath();
        for (var k = 0; k <= 64; k++) {
          var a = k / 64 * Math.PI * 2;
          var pp = project([Math.cos(a) * r, Math.sin(a) * r, 0]);
          if (k === 0) ctx.moveTo(pp.x, pp.y); else ctx.lineTo(pp.x, pp.y);
        }
        ctx.strokeStyle = ri ? "rgba(0,75,111,.10)" : "rgba(92,155,175,.22)";
        ctx.lineWidth = 1; ctx.stroke();
      });
      // axes and their meanings
      [[1.55, 0, 0], [0, 1.55, 0], [0, 0, 1.05]].forEach(function (ax, ai) {
        var a = project([-ax[0], -ax[1], -ax[2]]);
        var b = project(ax);
        ctx.strokeStyle = [C.sky, C.green, C.lilac][ai] || C.sky; ctx.globalAlpha = .34; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.globalAlpha = 1;
        tag(b.x + 5, b.y, [DE ? "Macht" : "Power", DE ? "Geschlecht" : "Gender", DE ? "Rang" : "Rank"][ai], [C.sky, C.green, C.lilac][ai], "left");
      });
      // semantic links: the small constellations behind the words
      LINKS.forEach(function (pair) {
        var a = W[pair[0]], b = W[pair[1]];
        if (!a || !b) return;
        var pa = project(a.p), pb = project(b.p);
        var mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2 - 9;
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.quadraticCurveTo(mx, my, pb.x, pb.y);
        ctx.strokeStyle = C.sky; ctx.globalAlpha = .13; ctx.lineWidth = .8; ctx.stroke();
      });
      ctx.globalAlpha = 1;
      // floating dust gives the space depth without adding a new hue
      DUST.forEach(function (d, di) {
        var x = d.x + Math.sin(now * .00018 * d.s + d.p) * .10;
        var y = d.y + Math.cos(now * .00014 * d.s + d.p) * .08;
        var p = project([x, y, d.z]);
        ctx.beginPath(); ctx.arc(p.x, p.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = [C.sky, C.green, C.gold][di % 3]; ctx.globalAlpha = d.a; ctx.fill();
      });
      ctx.globalAlpha = 1;
      // word cloud
      Object.keys(W).forEach(function (k) {
        var word = W[k];
        if (k === "queen") return;
        var p = project(word.p);
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = labelColor(word.col); ctx.fill();
        ctx.globalAlpha = .18; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fillStyle = labelColor(word.col); ctx.fill(); ctx.globalAlpha = 1;
        tag(p.x + 9, p.y, text(word.label), labelColor(word.col));
      });
      // target
      var t = project(TARGET);
      var pulse = reduced ? 0 : (now % 2200) / 2200;
      var glow = ctx.createRadialGradient(t.x, t.y, 2, t.x, t.y, 76);
      glow.addColorStop(0, V.alpha(C.gold, .18)); glow.addColorStop(.42, V.alpha(C.gold, .06)); glow.addColorStop(1, V.alpha(C.gold, 0));
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(t.x, t.y, 76, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.strokeStyle = C.gold; ctx.globalAlpha = .22; ctx.lineWidth = .9;
      for (var ray = 0; ray < 4; ray++) {
        var ra = ray * Math.PI / 2 + pulse * .18;
        ctx.beginPath(); ctx.moveTo(t.x + Math.cos(ra) * 21, t.y + Math.sin(ra) * 21); ctx.lineTo(t.x + Math.cos(ra) * 31, t.y + Math.sin(ra) * 31); ctx.stroke();
      }
      ctx.restore();
      ctx.beginPath(); ctx.arc(t.x, t.y, 13 + pulse * 7, 0, Math.PI * 2);
      ctx.strokeStyle = C.gold; ctx.globalAlpha = .58 - pulse * .28; ctx.lineWidth = 2.4; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(t.x, t.y, 5.5, 0, Math.PI * 2); ctx.fillStyle = C.gold; ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      tag(t.x + 11, t.y - 17, (DE ? "Ziel · " : "Target · ") + text(W.queen.label), C.gold);
      // remaining distance to the target
      var cp = project(display);
      ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = C.gold; ctx.globalAlpha = .36; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cp.x, cp.y); ctx.lineTo(t.x, t.y); ctx.stroke(); ctx.restore();
      // trail
      if (trail.length > 1) {
        ctx.beginPath();
        trail.forEach(function (q, ti) {
          var p = project(q);
          if (ti === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = "#ffffff"; ctx.globalAlpha = .9; ctx.lineWidth = 6; ctx.lineJoin = "round"; ctx.stroke();
        ctx.strokeStyle = C.green; ctx.globalAlpha = .86; ctx.lineWidth = 3.2; ctx.shadowColor = C.green; ctx.shadowBlur = 9; ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }
      // hover direction
      if (hoverOp && hoverOp.vec) {
        var hv = scale(hoverOp.vec, scaleNext * (negateNext ? -1 : 1));
        var ha = project(display);
        var hb = project(add(display, hv));
        ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = labelColor(hoverOp.col); ctx.lineWidth = 1.8; ctx.globalAlpha = .95;
        ctx.beginPath(); ctx.moveTo(ha.x, ha.y); ctx.lineTo(hb.x, hb.y); ctx.stroke(); ctx.restore();
        ctx.beginPath(); ctx.arc(hb.x, hb.y, 3.5, 0, Math.PI * 2); ctx.fillStyle = labelColor(hoverOp.col); ctx.fill();
      }
      // ground shadow and current point
      var sh = project([display[0], display[1], floorZ(display[0], display[1])]);
      ctx.beginPath(); ctx.ellipse(sh.x, sh.y + 2, 20, 7, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,35,45,.10)"; ctx.fill();
      var p = project(display);
      if (burst && !reduced) {
        var age = (now - burst) / 1000;
        if (age < 1) {
          ctx.beginPath(); ctx.arc(p.x, p.y, 24 + age * 84, 0, Math.PI * 2);
          ctx.strokeStyle = C.gold; ctx.globalAlpha = (1 - age) * .38; ctx.lineWidth = 1.6; ctx.stroke(); ctx.globalAlpha = 1;
        }
      }
      ctx.beginPath(); ctx.arc(p.x, p.y, 19 + (reduced ? 0 : pulse * 4), 0, Math.PI * 2);
      ctx.fillStyle = "rgba(99,164,75,.12)"; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = C.lime || C.green; ctx.shadowColor = C.green; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill();
      tag(p.x + 11, p.y + 17, DE ? "Punkt" : "Point", C.green);
      // quiet drag hint, never competing with the closing line
      if (w > 520) {
        ctx.fillStyle = C.muted; ctx.font = '600 ' + api.font("canvas-xs") + 'px "Open Sans", sans-serif'; ctx.textAlign = "left";
        ctx.fillText(DE ? "ziehen zum Drehen" : "drag to rotate", 16, h - 14);
      }
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
    analogyBtn.addEventListener("click", analogy);
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
