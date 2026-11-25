(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroNumber");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.14;
      MP.grid(ctx, w, h, Math.max(32, Math.min(w, h) * 0.075), c.line);
      ctx.restore();

      var left = w * 0.16, right = w * 0.84;
      var top = h * 0.28, bot = h * 0.72;
      var n = 7;
      for (var i = 0; i < n; i++) {
        var y = top + (i / (n - 1)) * (bot - top);
        var x1 = left + Math.sin(t * 0.5 + i) * 3;
        var x2 = right + Math.cos(t * 0.45 + i) * 3;
        ctx.save();
        ctx.strokeStyle = c.accent;
        ctx.globalAlpha = 0.18 + 0.12 * Math.sin(t * 1.2 + i);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.bezierCurveTo(w * 0.38, y - 30, w * 0.62, y + 30, x2, y);
        ctx.stroke();
        ctx.restore();
        MP.dot(ctx, x1, y, 4, c.muted);
        MP.glowDot(ctx, x2, y, 4, c.accent, c.accent);
      }
      MP.label(ctx, "days", left, h * 0.18, c.muted, 10, "center");
      MP.label(ctx, "pebbles", right, h * 0.18, c.accent, 10, "center");
      MP.label(ctx, "number = one-to-one correspondence", w * 0.5, h * 0.88, c.muted, 10, "center");
    }, { maxDpr: 1.6 });
  }

  var corr = document.getElementById("corrLab");
  if (corr) {
    var days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    var pairs = {};
    var selected = -1;
    var hits = { left: [], right: [] };
    var pairCountEl = document.getElementById("pairCount");
    var numberEl = document.getElementById("numberVal");

    function updateReadout() {
      var n = Object.keys(pairs).length;
      if (pairCountEl) pairCountEl.textContent = n + " / 7";
      if (numberEl) numberEl.textContent = n === 7 ? "7" : "—";
    }
    MP.on("pairAll", "click", function () {
      pairs = {}; for (var i = 0; i < 7; i++) pairs[i] = i; selected = -1; updateReadout();
    });
    MP.on("resetCorr", "click", function () { pairs = {}; selected = -1; updateReadout(); });
    updateReadout();

    corr.addEventListener("pointerdown", function (e) {
      var rect = corr.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var best = null, bd = 1e9;
      hits.left.forEach(function (h) { var d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = { side: "left", i: h.i }; } });
      hits.right.forEach(function (h) { var d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = { side: "right", i: h.i }; } });
      if (!best || bd > 50) return;
      if (best.side === "left") {
        selected = best.i;
      } else if (selected >= 0) {
        pairs[selected] = best.i;
        selected = -1;
      }
      updateReadout();
    });

    MP.canvas(corr, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.2;
      MP.grid(ctx, w, h, Math.max(28, Math.min(w, h) * 0.065), c.line);
      ctx.restore();
      var lx = w * 0.24, rx = w * 0.76;
      var top = h * 0.16, bot = h * 0.84;
      hits.left = []; hits.right = [];
      MP.label(ctx, "DAYS", lx, h * 0.09, c.faint, 9, "center");
      MP.label(ctx, "PEBBLES", rx, h * 0.09, c.faint, 9, "center");

      for (var i = 0; i < 7; i++) {
        var y = top + (i / 6) * (bot - top);
        var active = selected === i;
        ctx.save();
        if (active) { ctx.shadowBlur = 18; ctx.shadowColor = c.accent; }
        MP.dot(ctx, lx, y, 7, active ? c.accent : c.panel2);
        ctx.strokeStyle = active ? c.accent2 : c.line;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(lx, y, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        MP.label(ctx, days[i], lx - 34, y, active ? c.ink : c.muted, 10, "right");
        hits.left.push({ i: i, x: lx, y: y });
        MP.dot(ctx, rx, y, 5, c.muted);
        hits.right.push({ i: i, x: rx, y: y });
      }

      Object.keys(pairs).forEach(function (k) {
        var i = parseInt(k, 10);
        var j = pairs[i];
        var y1 = top + (i / 6) * (bot - top);
        var y2 = top + (j / 6) * (bot - top);
        ctx.save();
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 1.6;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(lx + 9, y1);
        ctx.bezierCurveTo(w * 0.4, y1, w * 0.6, y2, rx - 7, y2);
        ctx.stroke();
        ctx.restore();
        MP.glowDot(ctx, rx, y2, 3.4, c.accent2, c.accent);
      });

      MP.label(ctx, "click a day, then a pebble", w * 0.5, h * 0.94, c.muted, 9, "center");
      if (Object.keys(pairs).length === 7) {
        MP.label(ctx, "7 = the class of all classes in 1–1 correspondence with these", w * 0.5, h * 0.04, c.accent, 9, "center");
      }
    }, { maxDpr: 2 });
  }

  var venn = document.getElementById("vennLab");
  if (venn) {
    var idx = 8;
    var probMode = false;
    var prob = 0.5;
    var names = ["contradiction", "NOR", "¬A ∧ B", "¬A", "A ∧ ¬B", "¬B", "XOR", "NAND", "AND", "IFF", "B", "A → B", "A", "B → A", "OR", "tautology"];
    var nameEl = document.getElementById("vennName");
    var bitsEl = document.getElementById("vennBits");
    var probEl = document.getElementById("vennProb");
    var probWrap = document.getElementById("probWrap");

    function setIdx(v) {
      idx = v;
      var input = document.getElementById("vennIndex");
      if (input) { input.value = v; MP.rangeFill(input); }
      renderMeta();
    }
    function bit(i) { return (idx >> i) & 1; }
    function renderMeta() {
      if (nameEl) nameEl.textContent = names[idx];
      if (bitsEl) bitsEl.textContent = "" + bit(3) + bit(2) + bit(1) + bit(0);
      if (probEl) {
        var probs = [(1 - prob) * (1 - prob), prob * (1 - prob), prob * (1 - prob), prob * prob];
        var total = 0;
        for (var i = 0; i < 4; i++) if (bit(i)) total += probs[i];
        probEl.textContent = total.toFixed(3);
      }
    }
    MP.bindRange("vennIndex", function (v) { idx = Math.round(v); renderMeta(); });
    MP.bindRange("probP", function (v) { prob = v; renderMeta(); });
    MP.on("probMode", "click", function () {
      probMode = !probMode;
      var b = document.getElementById("probMode");
      if (b) { b.classList.toggle("is-active", probMode); b.textContent = probMode ? "Probabilistic" : "Certain"; }
      if (probWrap) probWrap.style.opacity = probMode ? "1" : "0.4";
      renderMeta();
    });
    [["vennAND", 8], ["vennOR", 14], ["vennXOR", 6], ["vennNAND", 7], ["vennIMPL", 11], ["vennIFF", 9], ["vennTaut", 15], ["vennContra", 0]].forEach(function (pair) {
      MP.on(pair[0], "click", function () { setIdx(pair[1]); });
    });
    renderMeta();

    MP.canvas(venn, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.18;
      MP.grid(ctx, w, h, Math.max(28, Math.min(w, h) * 0.065), c.line);
      ctx.restore();

      var cx = w * 0.32, cy = h * 0.52;
      var R = Math.min(w, h) * 0.25;
      var ax = cx - R * 0.5, bx = cx + R * 0.5;
      var probs = [(1 - prob) * (1 - prob), prob * (1 - prob), prob * (1 - prob), prob * prob];
      var regionBit = [0, 1, 2, 3];

      function fillRegion(bitIndex, color) {
        var on = bit(bitIndex);
        var col = on ? color : null;
        if (!col) return;
        ctx.save();
        ctx.globalAlpha = 0.32;
        ctx.fillStyle = col;
        if (bitIndex === 0) {
          ctx.beginPath();
          ctx.rect(0, 0, w, h);
          ctx.arc(ax, cy, R, 0, Math.PI * 2);
          ctx.arc(bx, cy, R, 0, Math.PI * 2);
          ctx.clip("evenodd");
          ctx.fillRect(0, 0, w, h);
        } else if (bitIndex === 1) {
          ctx.beginPath(); ctx.arc(bx, cy, R, 0, Math.PI * 2); ctx.clip();
          ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.arc(ax, cy, R, 0, Math.PI * 2); ctx.clip("evenodd");
          ctx.fillRect(0, 0, w, h);
        } else if (bitIndex === 2) {
          ctx.beginPath(); ctx.arc(ax, cy, R, 0, Math.PI * 2); ctx.clip();
          ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.arc(bx, cy, R, 0, Math.PI * 2); ctx.clip("evenodd");
          ctx.fillRect(0, 0, w, h);
        } else {
          ctx.beginPath(); ctx.arc(ax, cy, R, 0, Math.PI * 2); ctx.clip();
          ctx.beginPath(); ctx.arc(bx, cy, R, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }

      fillRegion(0, c.accent);
      fillRegion(1, c.accent);
      fillRegion(2, c.accent);
      fillRegion(3, c.accent);

      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(ax, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      MP.label(ctx, "A", ax - R * 0.62, cy - R - 14, c.muted, 12, "center");
      MP.label(ctx, "B", bx + R * 0.62, cy - R - 14, c.muted, 12, "center");

      var centers = [
        { x: cx, y: cy + R * 0.95 },
        { x: bx + R * 0.45, y: cy },
        { x: ax - R * 0.45, y: cy },
        { x: cx, y: cy }
      ];
      centers.forEach(function (p, i) {
        var on = bit(i);
        var label = probMode ? probs[i].toFixed(2) : (on ? "1" : "0");
        if (on) {
          ctx.save();
          ctx.shadowBlur = 16;
          ctx.shadowColor = c.accent;
          MP.dot(ctx, p.x, p.y, probMode ? 5 : 6, c.accent);
          ctx.restore();
        } else {
          MP.dot(ctx, p.x, p.y, 3, c.faint);
        }
        MP.label(ctx, label, p.x, p.y - (on ? 16 : 13), on ? c.accent : c.faint, 9, "center");
      });

      var tx = w * 0.66, ty = h * 0.24;
      MP.label(ctx, "truth table", tx, ty - 30, c.faint, 9);
      MP.label(ctx, "A  B  f", tx, ty - 12, c.muted, 9);
      for (var r = 0; r < 4; r++) {
        var A = (r >> 1) & 1;
        var B = r & 1;
        var bi = r === 0 ? 0 : r === 1 ? 1 : r === 2 ? 2 : 3;
        var v = bit(bi);
        var yy = ty + 12 + r * 26;
        MP.label(ctx, A + "  " + B + "  " + v, tx, yy, v ? c.accent : c.faint, 10);
        if (v) MP.dot(ctx, tx + 64, yy, 2.4, c.accent);
      }
      MP.label(ctx, names[idx], tx, ty + 130, c.accent, 12);
      if (probMode) {
        MP.label(ctx, "P(f) = " + probEl.textContent, tx, ty + 156, c.muted, 10);
      }

      MP.label(ctx, "two circles, four regions, sixteen functions", w * 0.5, h * 0.95, c.muted, 9, "center");
    }, { maxDpr: 2 });
  }
})();
