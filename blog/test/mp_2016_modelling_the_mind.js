(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroModelling");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.14;
      MP.grid(ctx, w, h, Math.max(32, Math.min(w, h) * 0.075), c.line);
      ctx.restore();

      var left = w * 0.16, right = w * 0.84;
      var mid = h * 0.5;
      var labels = ["psychology", "medicine", "neurology", "psychiatry", "cybernetics", "engineering"];
      for (var i = 0; i < 6; i++) {
        var x = left + (i / 5) * (right - left);
        var y = mid + Math.sin(i * 1.3 + t * 0.4) * h * 0.08;
        ctx.save();
        ctx.strokeStyle = c.accent;
        ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t + i);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, h * 0.22);
        ctx.lineTo(x, h * 0.78);
        ctx.stroke();
        ctx.restore();
        MP.label(ctx, labels[i], x, h * 0.84, i % 2 ? c.faint : c.muted, 8, "center");
        MP.glowDot(ctx, x, y, 2.4, c.accent2, c.accent);
      }
      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (var k = 0; k <= 100; k++) {
        var u = k / 100;
        var xx = left + u * (right - left);
        var yy = mid + Math.sin(u * Math.PI * 3 + t * 0.4) * h * 0.08;
        if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, "a scientific traveller", w * 0.5, h * 0.12, c.muted, 10, "center");
      MP.label(ctx, "disciplines are ways of being in the world", w * 0.5, h * 0.92, c.muted, 10, "center");
    }, { maxDpr: 1.6 });
  }

  var canvas = document.getElementById("travelLab");
  if (canvas) {
    var places = [
      { year: 1921, place: "Yale", disc: "Psychology", x: 0.1, y: 0.7, detail: "BA in psychology. The number question is already the centre of gravity.", carried: "logic, epistemology" },
      { year: 1928, place: "Columbia", disc: "MA + MD", x: 0.24, y: 0.32, detail: "A master's in psychology, then a medical degree — the body enters the question.", carried: "psychology → medicine" },
      { year: 1928, place: "Bellevue", disc: "Neurology", x: 0.38, y: 0.68, detail: "Experimental neurology; the brain areas responsible for epileptic seizures.", carried: "clinical neurology" },
      { year: 1930, place: "Rockland", disc: "Psychiatry", x: 0.5, y: 0.28, detail: "Rockland State Hospital for the Insane; paranoia and the logic of mind.", carried: "psychiatry + logic" },
      { year: 1934, place: "Yale", disc: "Neurophysiology", x: 0.63, y: 0.64, detail: "Dusser de Barenne's laboratory; functional organisation of the brain in primates.", carried: "experimental method" },
      { year: 1941, place: "Illinois", disc: "Neuropsychiatry / cybernetics", x: 0.77, y: 0.3, detail: "Illinois Neuropsychiatric Institute; Pitts, Meduna, insulin shock, the logical calculus.", carried: "logic + physiology + psychiatry" },
      { year: 1952, place: "MIT", disc: "Information processing", x: 0.9, y: 0.66, detail: "Research Laboratory of Electronics; the rest of his life inside information processing.", carried: "cybernetics → computation" }
    ];
    var current = 1941;
    var placeEl = document.getElementById("placeVal");
    var discEl = document.getElementById("discVal");
    var detailEl = document.getElementById("detailVal");
    var carriedEl = document.getElementById("carriedVal");

    function nearest(y) {
      var best = places[0];
      var bd = 1e9;
      places.forEach(function (p) {
        var d = Math.abs(p.year - y);
        if (d < bd) { bd = d; best = p; }
      });
      return best;
    }
    function update(y) {
      current = y;
      var p = nearest(y);
      if (placeEl) placeEl.textContent = p.place + " · " + p.year;
      if (discEl) discEl.textContent = p.disc;
      if (detailEl) detailEl.textContent = p.detail;
      if (carriedEl) carriedEl.textContent = p.carried;
    }
    MP.bindRange("travelYear", function (v) { update(v); });
    update(current);

    MP.canvas(canvas, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.18;
      MP.grid(ctx, w, h, Math.max(28, Math.min(w, h) * 0.065), c.line);
      ctx.restore();

      var pts = places.map(function (p) { return { x: p.x * w, y: p.y * h }; });
      ctx.save();
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        var mx = (a.x + b.x) / 2;
        var my = (a.y + b.y) / 2 - h * 0.1;
        if (i === 0) ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(mx, my, b.x, b.y);
      }
      ctx.stroke();
      ctx.restore();

      var activeIdx = 0;
      places.forEach(function (p, i) {
        if (p.year <= current + 0.5) activeIdx = i;
      });
      var frac = 0;
      if (activeIdx < places.length - 1) {
        var y0 = places[activeIdx].year;
        var y1 = places[activeIdx + 1].year;
        frac = MP.clamp((current - y0) / Math.max(1, y1 - y0), 0, 1);
      }

      places.forEach(function (p, i) {
        var pt = pts[i];
        var on = p.year <= current + 0.5;
        var hot = i === activeIdx;
        ctx.save();
        if (hot) { ctx.shadowBlur = 22; ctx.shadowColor = c.accent; }
        MP.dot(ctx, pt.x, pt.y, hot ? 8 : on ? 5 : 3, hot ? c.accent : on ? c.muted : c.faint);
        ctx.restore();
        if (hot) {
          ctx.save();
          ctx.strokeStyle = c.accent;
          ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 2);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 16 + Math.sin(t * 2) * 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        MP.label(ctx, p.place, pt.x, pt.y - 18, on ? c.ink : c.faint, 9, "center");
        MP.label(ctx, String(p.year), pt.x, pt.y + 18, on ? c.accent : c.faint, 8, "center");
      });

      if (activeIdx < places.length - 1) {
        var a2 = pts[activeIdx], b2 = pts[activeIdx + 1];
        var mx2 = (a2.x + b2.x) / 2;
        var my2 = (a2.y + b2.y) / 2 - h * 0.1;
        var u = 1 - frac;
        var px = u * u * a2.x + 2 * u * frac * mx2 + frac * frac * b2.x;
        var py = u * u * a2.y + 2 * u * frac * my2 + frac * frac * b2.y;
        MP.glowDot(ctx, px, py, 5, c.accent2, c.accent);
      }

      MP.label(ctx, "1921", pts[0].x, h * 0.94, c.faint, 8, "center");
      MP.label(ctx, "1952", pts[pts.length - 1].x, h * 0.94, c.faint, 8, "center");
    }, { maxDpr: 2 });
  }

  var dial = document.getElementById("crossingLab");
  if (dial) {
    var crossing = 78;
    var insightEl = document.getElementById("insightVal");
    var testEl = document.getElementById("testVal");
    var verdictEl = document.getElementById("verdictVal");

    function insight(x) { return 0.18 + 0.77 * (1 - Math.exp(-x / 28)); }
    function testability(x) { return 0.96 - 0.7 * Math.pow(x / 100, 1.25); }
    function verdict(x) {
      if (x < 25) return "safe, narrow";
      if (x < 65) return "fertile, still accountable";
      return "McCulloch country: fertile and loose";
    }
    function update(x) {
      crossing = x;
      if (insightEl) insightEl.textContent = insight(x).toFixed(2);
      if (testEl) testEl.textContent = testability(x).toFixed(2);
      if (verdictEl) verdictEl.textContent = verdict(x);
    }
    MP.bindRange("crossing", function (v) { update(v); });
    update(crossing);

    MP.canvas(dial, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.18;
      MP.grid(ctx, w, h, Math.max(28, Math.min(w, h) * 0.065), c.line);
      ctx.restore();

      var left = w * 0.1, right = w * 0.95, top = h * 0.14, bottom = h * 0.82;
      var pw = right - left, ph = bottom - top;
      ctx.save();
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, bottom);
      ctx.lineTo(right, bottom);
      ctx.stroke();
      ctx.restore();
      for (var g = 0; g <= 4; g++) {
        var yy = bottom - (g / 4) * ph;
        MP.label(ctx, (g / 4).toFixed(2), left - 10, yy, c.faint, 8, "right");
        ctx.save();
        ctx.strokeStyle = c.line;
        ctx.globalAlpha = 0.16;
        ctx.beginPath();
        ctx.moveTo(left, yy);
        ctx.lineTo(right, yy);
        ctx.stroke();
        ctx.restore();
      }
      MP.label(ctx, "value", left - 10, top - 12, c.faint, 8, "right");
      MP.label(ctx, "boundary crossing →", right, bottom + 18, c.faint, 9, "right");
      MP.label(ctx, "0", left, bottom + 18, c.faint, 8);
      MP.label(ctx, "100", right, bottom + 18, c.faint, 8, "right");

      var zoneX = left + 0.65 * pw;
      ctx.save();
      ctx.fillStyle = c.accent;
      ctx.globalAlpha = 0.06;
      ctx.fillRect(zoneX, top, right - zoneX, ph);
      ctx.strokeStyle = c.accent;
      ctx.globalAlpha = 0.3;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(zoneX, top);
      ctx.lineTo(zoneX, bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      MP.label(ctx, "McCulloch zone", zoneX + (right - zoneX) / 2, top - 12, c.accent, 8, "center");

      function curve(fn, color, width) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        for (var i = 0; i <= 100; i++) {
          var x = left + (i / 100) * pw;
          var y = bottom - fn(i) * ph;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }
      curve(insight, c.accent, 2.6);
      curve(testability, "#e5c15a", 1.8);

      var mx = left + (crossing / 100) * pw;
      ctx.save();
      ctx.strokeStyle = c.ink;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(mx, top);
      ctx.lineTo(mx, bottom);
      ctx.stroke();
      ctx.restore();
      MP.glowDot(ctx, mx, bottom - insight(crossing) * ph, 4, c.accent2, c.accent);
      MP.glowDot(ctx, mx, bottom - testability(crossing) * ph, 4, "#e5c15a", "#e5c15a");

      MP.dot(ctx, left + 14, top + 14, 4, c.accent);
      MP.label(ctx, "reach / insight", left + 24, top + 14, c.muted, 9);
      MP.dot(ctx, left + 14, top + 36, 4, "#e5c15a");
      MP.label(ctx, "testability / rigor", left + 24, top + 36, c.muted, 9);

      MP.label(ctx, "the power and the cost of blurring boundaries", w * 0.5, h * 0.95, c.muted, 9, "center");
    }, { maxDpr: 2 });
  }
})();
