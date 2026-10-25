(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroMysterium");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.14;
      MP.grid(ctx, w, h, Math.max(32, Math.min(w, h) * 0.075), c.line);
      ctx.restore();

      var cx = w * 0.5;
      var cy = h * 0.5;
      var r = Math.min(w, h) * 0.22;
      for (var side = 0; side < 2; side++) {
        var sx = side ? cx + r * 1.2 : cx - r * 1.2;
        ctx.save();
        ctx.strokeStyle = side ? c.accent : c.muted;
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (var i = 0; i <= 40; i++) {
          var a = (i / 40) * Math.PI * 2;
          var rr = r * (0.55 + 0.1 * Math.sin(a * 5 + t + side));
          var x = sx + Math.cos(a) * rr;
          var y = cy + Math.sin(a) * rr * 0.7;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      for (var k = 0; k < 9; k++) {
        var yy = cy + (k - 4) * (r * 0.14);
        ctx.save();
        ctx.strokeStyle = c.accent;
        ctx.setLineDash([3, 5]);
        ctx.globalAlpha = 0.18 + 0.15 * Math.sin(t * 1.2 + k);
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.5, yy);
        ctx.lineTo(cx + r * 0.5, yy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      MP.label(ctx, "organism", cx - r * 1.2, cy + r * 0.95, c.muted, 10, "center");
      MP.label(ctx, "machine", cx + r * 1.2, cy + r * 0.95, c.accent, 10, "center");
      MP.label(ctx, "isomorphism?", cx, cy - r * 0.9, c.ink, 12, "center", '"Iowan Old Style", Georgia, serif');
      MP.label(ctx, "a local yes, a global unknown", w * 0.5, h * 0.92, c.muted, 10, "center");
    }, { maxDpr: 1.6 });
  }

  var canvas = document.getElementById("isoLab");
  if (!canvas) return;

  var left = [
    { id: "heart", label: "heart" },
    { id: "brain", label: "brain" },
    { id: "kidney", label: "kidney" },
    { id: "whole", label: "whole organism" }
  ];
  var right = [
    { id: "pump", label: "pump" },
    { id: "computer", label: "computer" },
    { id: "filter", label: "filter" },
    { id: "none", label: "no known machine" }
  ];
  var correct = { 0: 0, 1: 1, 2: 2, 3: 3 };
  var pairs = {};
  var selected = -1;
  var mode = "function";
  var wrong = 0;
  var hits = { left: [], right: [] };
  var pairsEl = document.getElementById("pairsVal");
  var structEl = document.getElementById("structVal");
  var wholeEl = document.getElementById("wholeVal");

  function updateReadout() {
    var n = Object.keys(pairs).length;
    if (pairsEl) pairsEl.textContent = n + " / 4";
    if (structEl) structEl.textContent = mode === "function" ? "functional only" : "not established";
    if (wholeEl) wholeEl.textContent = pairs[3] === 3 ? "analogy is heuristic" : "open";
  }
  function setMode(m) {
    mode = m;
    document.querySelectorAll("[data-mode]").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-mode") === mode); });
    updateReadout();
  }
  document.querySelectorAll("[data-mode]").forEach(function (b) {
    b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); });
  });
  MP.on("revealPairs", "click", function () {
    pairs = { 0: 0, 1: 1, 2: 2 };
    selected = -1;
    updateReadout();
  });
  MP.on("resetPairs", "click", function () {
    pairs = {}; selected = -1; wrong = 0;
    updateReadout();
  });
  setMode("function");

  canvas.addEventListener("pointerdown", function (e) {
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var best = null, bd = 1e9;
    hits.left.forEach(function (h) {
      var d = Math.hypot(h.x - x, h.y - y);
      if (d < bd) { bd = d; best = { side: "left", i: h.i }; }
    });
    hits.right.forEach(function (h) {
      var d = Math.hypot(h.x - x, h.y - y);
      if (d < bd) { bd = d; best = { side: "right", i: h.i }; }
    });
    if (!best || bd > 60) return;
    if (best.side === "left") {
      selected = best.i;
    } else if (selected >= 0) {
      if (correct[selected] === best.i) {
        pairs[selected] = best.i;
      } else {
        wrong = 1;
      }
      selected = -1;
    }
    updateReadout();
  });

  MP.canvas(canvas, function (ctx, w, h, t, dt) {
    var c = MP.colors();
    wrong *= 0.94;
    ctx.save();
    ctx.globalAlpha = 0.2;
    MP.grid(ctx, w, h, Math.max(28, Math.min(w, h) * 0.065), c.line);
    ctx.restore();

    var lx = w * 0.24;
    var rx = w * 0.76;
    var ys = [0.2, 0.4, 0.6, 0.8].map(function (v) { return v * h; });
    hits.left = []; hits.right = [];

    MP.label(ctx, "ORGANISM", lx, h * 0.08, c.faint, 10, "center");
    MP.label(ctx, "MACHINE", rx, h * 0.08, c.faint, 10, "center");
    MP.label(ctx, "is a specified part isomorphic to a specified machine?", w * 0.5, h * 0.08, c.accent, 10, "center");

    ys.forEach(function (y, i) {
      var leftActive = selected === i;
      var leftPaired = pairs[i] !== undefined;
      ctx.save();
      if (leftActive) { ctx.shadowBlur = 20; ctx.shadowColor = c.accent; }
      MP.rr(ctx, lx - 78, y - 20, 156, 40, 10);
      ctx.fillStyle = leftActive || leftPaired ? c.accent : c.panel2;
      ctx.globalAlpha = leftActive ? 0.22 : leftPaired ? 0.14 : 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = leftActive ? c.accent : c.line;
      ctx.lineWidth = leftActive ? 2 : 1;
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, left[i].label, lx, y, leftPaired ? c.ink : c.muted, 12, "center");
      hits.left.push({ i: i, x: lx, y: y });

      MP.rr(ctx, rx - 88, y - 20, 176, 40, 10);
      ctx.fillStyle = c.panel2;
      ctx.fill();
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 1;
      ctx.stroke();
      MP.label(ctx, right[i].label, rx, y, c.muted, 12, "center");
      hits.right.push({ i: i, x: rx, y: y });
    });

    Object.keys(pairs).forEach(function (k) {
      var i = parseInt(k, 10);
      var j = pairs[i];
      if (j === 3) return;
      var a = { x: lx + 82, y: ys[i] };
      var b = { x: rx - 92, y: ys[j] };
      var midx = (a.x + b.x) / 2;
      var midy = (a.y + b.y) / 2;
      ctx.save();
      if (mode === "function") {
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.85;
        ctx.setLineDash([]);
        ctx.shadowBlur = 14;
        ctx.shadowColor = c.accent;
      } else {
        ctx.strokeStyle = "#d96b6b";
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([4, 6]);
      }
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.bezierCurveTo(midx, a.y, midx, b.y, b.x, b.y);
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, mode === "function" ? "function" : "structure?", midx, midy - 8, mode === "function" ? c.accent : "#d96b6b", 8, "center");
    });

    if (wrong > 0.02) {
      ctx.save();
      ctx.globalAlpha = wrong;
      ctx.strokeStyle = "#d96b6b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 - 20, h * 0.5 - 20);
      ctx.lineTo(w * 0.5 + 20, h * 0.5 + 20);
      ctx.moveTo(w * 0.5 + 20, h * 0.5 - 20);
      ctx.lineTo(w * 0.5 - 20, h * 0.5 + 20);
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, "not isomorphic", w * 0.5, h * 0.5 + 34, "#d96b6b", 10, "center");
    }

    MP.label(ctx, "click an organism, then its machine", w * 0.5, h * 0.94, c.muted, 9, "center");
  }, { maxDpr: 2 });
})();
