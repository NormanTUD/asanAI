(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroFrog");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.14;
      MP.grid(ctx, w, h, Math.max(32, Math.min(w, h) * 0.075), c.line);
      ctx.restore();

      var ex = w * 0.32, ey = h * 0.5;
      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.ellipse(ex, ey, w * 0.15, h * 0.11, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ex, ey, h * 0.035, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      for (var r = 0; r < 3; r++) {
        ctx.save();
        ctx.strokeStyle = r === 1 ? c.accent : c.line;
        ctx.globalAlpha = r === 1 ? 0.35 : 0.18;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ex, ey, h * (0.1 + r * 0.055), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      var sheets = [0.42, 0.37, 0.32, 0.27];
      sheets.forEach(function (yy, i) {
        var x0 = w * 0.55, x1 = w * 0.92;
        ctx.save();
        ctx.strokeStyle = i === 0 ? c.accent : c.line;
        ctx.globalAlpha = 0.18 + i * 0.08;
        ctx.lineWidth = 1;
        for (var k = 0; k <= 10; k++) {
          var x = x0 + (k / 10) * (x1 - x0);
          ctx.beginPath();
          ctx.moveTo(x, h * (yy + 0.18));
          ctx.lineTo(x + 20, h * yy);
          ctx.stroke();
        }
        ctx.restore();
        MP.glowDot(ctx, w * (0.58 + 0.03 * Math.sin(t + i)), h * (yy + 0.1), 2, c.accent2, c.accent);
      });
      MP.label(ctx, "retina", w * 0.32, h * 0.86, c.muted, 9, "center");
      MP.label(ctx, "four maps in the tectum", w * 0.74, h * 0.9, c.accent, 9, "center");
      MP.label(ctx, "the eye sends a language, not a picture", w * 0.5, h * 0.1, c.muted, 10, "center");
    }, { maxDpr: 1.6 });
  }

  var canvas = document.getElementById("frogLab");
  if (!canvas) return;

  var st = {
    speed: 0.7,
    auto: true,
    dim: 0,
    bug: { x: 0.25, y: 0.1 },
    dets: { contrast: true, convexity: true, moving: true, dimming: true },
    bins: [],
    acc: 0,
    drag: false,
    spikes: 0
  };
  var speedEl = document.getElementById("frogSpeedVal");
  var activeEl = document.getElementById("activeDets");
  var spikeEl = document.getElementById("spikeCount");
  var seed = MP.mulberry32(1959);

  MP.bindRange("frogSpeed", function (v) { st.speed = v; });
  MP.on("toggleAuto", "click", function () {
    st.auto = !st.auto;
    var b = document.getElementById("toggleAuto");
    if (b) { b.classList.toggle("is-active", st.auto); b.textContent = st.auto ? "Auto motion" : "Manual motion"; }
  });
  MP.on("dimLight", "click", function () { st.dim = 1; });
  MP.on("resetFrog", "click", function () {
    st.bins = []; st.spikes = 0; st.bug.x = 0.25; st.bug.y = 0.1; st.auto = true; st.dim = 0;
  });
  document.querySelectorAll("[data-det]").forEach(function (b) {
    b.addEventListener("click", function () {
      var key = b.getAttribute("data-det");
      st.dets[key] = !st.dets[key];
      b.classList.toggle("is-active", st.dets[key]);
      updateActive();
    });
  });
  function updateActive() {
    var n = Object.keys(st.dets).filter(function (k) { return st.dets[k]; }).length;
    if (activeEl) activeEl.textContent = n + " / 4";
  }
  updateActive();

  function areaRect(w, h) {
    return { x: w * 0.04, y: h * 0.12, w: w * 0.46, h: h * 0.76 };
  }
  canvas.addEventListener("pointerdown", function (e) {
    var rect = canvas.getBoundingClientRect();
    var ar = areaRect(rect.width, rect.height);
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    if (x < ar.x || x > ar.x + ar.w || y < ar.y || y > ar.y + ar.h) return;
    st.drag = true;
    st.auto = false;
    st.bug.x = ((x - ar.x) / ar.w) * 2 - 1;
    st.bug.y = ((y - ar.y) / ar.h) * 2 - 1;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!st.drag) return;
    var rect = canvas.getBoundingClientRect();
    var ar = areaRect(rect.width, rect.height);
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    st.bug.x = MP.clamp(((x - ar.x) / ar.w) * 2 - 1, -1, 1);
    st.bug.y = MP.clamp(((y - ar.y) / ar.h) * 2 - 1, -1, 1);
  });
  canvas.addEventListener("pointerup", function () { st.drag = false; });

  function features() {
    var d = Math.hypot(st.bug.x, st.bug.y);
    var sp = st.auto ? st.speed : st.drag ? 1.4 : 0.2;
    return {
      contrast: Math.exp(-d * d * 5),
      convexity: Math.exp(-d * d * 9) * (1 - MP.clamp(sp / 1.4, 0, 1) * 0.72),
      moving: MP.clamp(sp, 0, 1.4) * Math.exp(-d * d * 3.2),
      dimming: st.dim
    };
  }

  MP.canvas(canvas, function (ctx, w, h, t, dt) {
    var c = MP.colors();
    var ar = areaRect(w, h);
    if (st.auto && !st.drag) {
      st.bug.x = Math.cos(t * 0.55) * 0.62;
      st.bug.y = Math.sin(t * 0.83) * 0.5;
    }
    st.dim *= Math.exp(-(dt || 0.016) * 1.7);

    var f = features();
    st.acc += dt || 0.016;
    while (st.acc >= 0.085) {
      st.acc -= 0.085;
      var row = {};
      var keys = ["contrast", "convexity", "moving", "dimming"];
      keys.forEach(function (k) {
        var on = st.dets[k] && seed() < (0.025 + f[k] * 0.94);
        row[k] = on;
        if (on) st.spikes++;
      });
      st.bins.push(row);
      if (st.bins.length > 82) st.bins.shift();
    }

    ctx.save();
    ctx.globalAlpha = 0.18;
    MP.grid(ctx, w, h, Math.max(26, Math.min(w, h) * 0.06), c.line);
    ctx.restore();

    ctx.save();
    var dark = 0.06 + st.dim * 0.35;
    ctx.fillStyle = "#0a1208";
    ctx.globalAlpha = 1;
    MP.rr(ctx, ar.x, ar.y, ar.w, ar.h, 12);
    ctx.fill();
    ctx.restore();

    for (var i = 0; i < 34; i++) {
      var gx = ar.x + ((i * 0.61803398875) % 1) * ar.w;
      var gy = ar.y + ((i * 0.41421356237) % 1) * ar.h;
      ctx.save();
      ctx.strokeStyle = i % 4 === 0 ? c.accent : c.line;
      ctx.globalAlpha = 0.08 + (i % 4 === 0 ? 0.08 : 0);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + 6, gy - 12);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = c.accent;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(ar.x + ar.w / 2, ar.y + ar.h / 2, Math.min(ar.w, ar.h) * 0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(ar.x + ar.w / 2 - 9, ar.y + ar.h / 2);
    ctx.lineTo(ar.x + ar.w / 2 + 9, ar.y + ar.h / 2);
    ctx.moveTo(ar.x + ar.w / 2, ar.y + ar.h / 2 - 9);
    ctx.lineTo(ar.x + ar.w / 2, ar.y + ar.h / 2 + 9);
    ctx.stroke();
    ctx.restore();
    MP.label(ctx, "receptive field", ar.x + ar.w / 2, ar.y + ar.h / 2 - Math.min(ar.w, ar.h) * 0.2 - 12, c.faint, 8, "center");

    var bx = ar.x + ar.w / 2 + st.bug.x * ar.w * 0.42;
    var by = ar.y + ar.h / 2 + st.bug.y * ar.h * 0.42;
    ctx.save();
    ctx.globalAlpha = 0.3;
    MP.dot(ctx, bx + 4, by + 5, 15, "#000000");
    ctx.restore();
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = c.accent;
    MP.dot(ctx, bx, by, 14, "#111a10");
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(bx, by, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    MP.label(ctx, "bug", bx, by + 26, c.accent, 8, "center");

    MP.label(ctx, "visual field", ar.x + 10, ar.y + 14, c.faint, 9);
    MP.label(ctx, "drag the bug", ar.x + ar.w - 10, ar.y + ar.h - 12, c.faint, 8, "right");

    var rx = w * 0.56;
    var rw = w * 0.4;
    var top = h * 0.14;
    var rowH = h * 0.16;
    var rows = [
      { key: "contrast", label: "sustained contrast", color: "#e8a34b" },
      { key: "convexity", label: "net convexity · bug perceiver", color: "#b8dc55" },
      { key: "moving", label: "moving edge", color: "#6db8ff" },
      { key: "dimming", label: "net dimming", color: "#f07b9a" }
    ];

    rows.forEach(function (row, ri) {
      var y = top + ri * rowH;
      MP.label(ctx, row.label, rx, y - 8, st.dets[row.key] ? row.color : c.faint, 8);
      ctx.save();
      ctx.strokeStyle = c.line;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rx, y);
      ctx.lineTo(rx + rw, y);
      ctx.stroke();
      ctx.restore();
      var n = st.bins.length;
      var step = rw / 82;
      for (var bi = 0; bi < n; bi++) {
        if (!st.bins[bi][row.key]) continue;
        var x = rx + rw - (n - bi) * step;
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = row.color;
        ctx.fillStyle = row.color;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(x - step * 0.3, y - 5, Math.max(2, step * 0.6), 10);
        ctx.restore();
      }
      if (st.dets[row.key] && f[row.key] > 0.55 && ri === 1) {
        MP.label(ctx, "BUG", rx + rw - 22, y + 18, row.color, 9, "right");
      }
    });

    MP.label(ctx, "spike rasters · time →", rx + rw, h * 0.92, c.faint, 9, "right");
    MP.label(ctx, "four operations, four fibers", rx, h * 0.92, c.muted, 9);

    if (speedEl) speedEl.textContent = st.speed.toFixed(2);
    if (spikeEl) spikeEl.textContent = st.spikes;
  }, { maxDpr: 2 });
})();
