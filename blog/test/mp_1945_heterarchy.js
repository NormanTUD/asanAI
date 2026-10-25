(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroHeterarchy");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      var cx = w * 0.55;
      var cy = h * 0.48;
      var R = Math.min(w, h) * 0.25;
      var r = Math.min(w, h) * 0.085;

      ctx.save();
      ctx.globalAlpha = 0.16;
      MP.grid(ctx, w, h, Math.max(30, Math.min(w, h) * 0.07), c.line);
      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.22);
      for (var i = 0; i < 48; i++) {
        var u = (i / 48) * Math.PI * 2;
        ctx.beginPath();
        for (var j = 0; j <= 96; j++) {
          var v = (j / 96) * Math.PI * 2;
          var x = (R + r * Math.cos(v)) * Math.cos(u);
          var y = (R + r * Math.cos(v)) * Math.sin(u) * 0.52 - r * Math.sin(v) * 0.35;
          if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = c.line;
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      for (var k = 0; k < 30; k++) {
        var v2 = (k / 30) * Math.PI * 2;
        ctx.beginPath();
        for (var m = 0; m <= 96; m++) {
          var u2 = (m / 96) * Math.PI * 2;
          var x2 = (R + r * Math.cos(v2)) * Math.cos(u2);
          var y2 = (R + r * Math.cos(v2)) * Math.sin(u2) * 0.52 - r * Math.sin(v2) * 0.35;
          if (m === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
        }
        ctx.strokeStyle = c.accent;
        ctx.globalAlpha = 0.06;
        ctx.stroke();
      }
      ctx.restore();

      var pts = [];
      for (var p = 0; p < 3; p++) {
        var a = (p / 3) * Math.PI * 2 - Math.PI / 2 + t * 0.18;
        pts.push({
          x: cx + Math.cos(a) * R,
          y: cy + Math.sin(a) * R * 0.52,
          a: a
        });
      }
      for (var e = 0; e < 3; e++) {
        var p1 = pts[e];
        var p2 = pts[(e + 1) % 3];
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(cx + Math.cos((p1.a + p2.a) / 2) * R * 0.55, cy + Math.sin((p1.a + p2.a) / 2) * R * 0.28, p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
        var prog = (t * 0.16 + e * 0.33) % 1;
        var mx = MP.lerp(p1.x, p2.x, prog);
        var my = MP.lerp(p1.y, p2.y, prog);
        MP.glowDot(ctx, mx, my, 2.2, c.accent2, c.accent);
      }
      pts.forEach(function (pt, i) {
        ctx.save();
        ctx.shadowBlur = 26;
        ctx.shadowColor = c.accent;
        MP.dot(ctx, pt.x, pt.y, 7, c.accent);
        ctx.restore();
        MP.label(ctx, ["A", "B", "C"][i], pt.x, pt.y, c.ink, 12, "center");
      });
      MP.label(ctx, "a cycle that no scale can flatten", w * 0.5, h * 0.92, c.muted, 10, "center");
    }, { maxDpr: 1.6 });
  }

  var canvas = document.getElementById("heterarchyLab");
  if (!canvas) return;

  var prefs = { AB: "A", BC: "B", CA: "C" };
  var view = "choice";
  var proj = null;
  var scaleVal = document.getElementById("scaleVal");
  var surfaceVal = document.getElementById("surfaceVal");
  var diadromeVal = document.getElementById("diadromeVal");

  function edge(a, b) { return prefs[a + b] === a; }
  function isCycle() {
    var a = edge("A", "B");
    var b = edge("B", "C");
    var c = edge("C", "A");
    return (a && b && c) || (!a && !b && !c);
  }
  function rank() {
    if (isCycle()) return "cyclic";
    if (edge("A", "B") && edge("B", "C") && edge("A", "C")) return "A>B>C";
    if (edge("B", "A") && edge("C", "B") && edge("C", "A")) return "C>B>A";
    if (edge("A", "C") && edge("C", "B") && edge("A", "B")) return "A>C>B";
    if (edge("B", "C") && edge("C", "A") && edge("B", "A")) return "B>C>A";
    if (edge("B", "A") && edge("A", "C") && edge("B", "C")) return "B>A>C";
    return "C>A>B";
  }
  function update() {
    var cyc = isCycle();
    if (scaleVal) scaleVal.textContent = cyc ? "No common measure" : "Single scale exists";
    if (surfaceVal) surfaceVal.textContent = cyc ? "Torus" : "Plane";
    if (diadromeVal) diadromeVal.textContent = cyc ? "1 diadrome" : "None";
    document.querySelectorAll("[data-pref]").forEach(function (btn) {
      var pair = btn.getAttribute("data-pref");
      var a = pair[0], b = pair[1];
      btn.classList.toggle("is-active", prefs[pair] === a);
      btn.setAttribute("data-side", prefs[pair]);
    });
    if (proj) proj.redraw();
  }
  function setPref(pair, value) { prefs[pair] = value; update(); }
  function cyclePref(pair) {
    var a = pair[0], b = pair[1];
    prefs[pair] = prefs[pair] === a ? b : a;
    update();
  }
  document.querySelectorAll("[data-pref]").forEach(function (btn) {
    btn.addEventListener("click", function () { cyclePref(btn.getAttribute("data-pref")); });
  });
  MP.on("presetHierarchy", "click", function () {
    prefs = { AB: "A", BC: "B", CA: "A" };
    update();
  });
  MP.on("presetHeterarchy", "click", function () {
    prefs = { AB: "A", BC: "B", CA: "C" };
    update();
  });
  MP.on("viewChoice", "click", function () {
    view = "choice";
    document.getElementById("viewChoice").classList.add("is-active");
    document.getElementById("viewNet").classList.remove("is-active");
    if (proj) proj.redraw();
  });
  MP.on("viewNet", "click", function () {
    view = "net";
    document.getElementById("viewNet").classList.add("is-active");
    document.getElementById("viewChoice").classList.remove("is-active");
    if (proj) proj.redraw();
  });

  proj = MP.canvas(canvas, function (ctx, w, h, t) {
    var c = MP.colors();
    var cyc = isCycle();
    ctx.save();
    ctx.globalAlpha = 0.22;
    MP.grid(ctx, w, h, Math.max(28, Math.min(w, h) * 0.07), c.line);
    ctx.restore();

    if (view === "choice") {
      var pts = {
        A: { x: w * 0.5, y: h * 0.18 },
        B: { x: w * 0.24, y: h * 0.74 },
        C: { x: w * 0.76, y: h * 0.74 }
      };

      if (cyc) {
        ctx.save();
        ctx.translate(w * 0.5, h * 0.55);
        ctx.strokeStyle = c.accent;
        ctx.globalAlpha = 0.14;
        ctx.lineWidth = 1;
        for (var i = 0; i < 22; i++) {
          var rx = w * 0.31;
          var ry = h * 0.23;
          ctx.beginPath();
          ctx.ellipse(0, 0, rx + i * 1.5, ry + i * 1.0, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        MP.label(ctx, "a torus is the simplest surface", w * 0.5, h * 0.06, c.accent, 11, "center");
      } else {
        MP.label(ctx, "a plane suffices", w * 0.5, h * 0.06, c.muted, 11, "center");
      }

      var pairs = [
        { key: "AB", from: "A", to: "B", curve: -0.18 },
        { key: "BC", from: "B", to: "C", curve: 0.18 },
        { key: "CA", from: "C", to: "A", curve: 0.2 }
      ];
      pairs.forEach(function (pr, idx) {
        var winner = prefs[pr.key];
        var loser = winner === pr.from ? pr.to : pr.from;
        var a = pts[winner], b = pts[loser];
        var mx = (a.x + b.x) / 2;
        var my = (a.y + b.y) / 2;
        var dx = b.x - a.x, dy = b.y - a.y;
        var len = Math.hypot(dx, dy) || 1;
        var ox = -dy / len * len * pr.curve;
        var oy = dx / len * len * pr.curve;
        ctx.save();
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 2.1;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(mx + ox, my + oy, b.x, b.y);
        ctx.stroke();
        var end = { x: b.x, y: b.y };
        var ang = Math.atan2(end.y - (my + oy), end.x - (mx + ox));
        var hx = end.x - Math.cos(ang) * 18;
        var hy = end.y - Math.sin(ang) * 18;
        MP.arrow(ctx, hx - Math.cos(ang) * 2, hy - Math.sin(ang) * 2, end.x - Math.cos(ang) * 10, end.y - Math.sin(ang) * 10, c.accent, 2.1, 9);
        ctx.restore();
        MP.label(ctx, winner + " ≻ " + loser, mx + ox * 1.5, my + oy * 1.5, c.muted, 10, "center");
      });

      if (cyc) {
        var prog = (t * 0.35) % 1;
        var path = [
          [pts.A, pts.B],
          [pts.B, pts.C],
          [pts.C, pts.A]
        ];
        var seg = Math.floor(prog * 3) % 3;
        var f = prog * 3 - Math.floor(prog * 3);
        var q = path[seg];
        var px = MP.lerp(q[0].x, q[1].x, f);
        var py = MP.lerp(q[0].y, q[1].y, f);
        MP.glowDot(ctx, px, py, 5, c.accent2, c.accent);
      }

      Object.keys(pts).forEach(function (k) {
        var p = pts[k];
        var isTop = k === "A";
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = c.accent;
        MP.dot(ctx, p.x, p.y, 22, c.panel2);
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        MP.label(ctx, k, p.x, p.y, c.ink, 14, "center", '"Iowan Old Style", Georgia, serif');
        if (!cyc) {
          var r = rank();
          var pos = r.indexOf(k) + 1;
          MP.label(ctx, "#" + pos, p.x + 34, p.y - 18, c.accent, 10, "center");
        }
      });

      MP.label(ctx, cyc ? "A ≻ B, B ≻ C, C ≻ A" : rank(), w * 0.5, h * 0.94, cyc ? c.accent : c.muted, 12, "center");
    } else {
      var centers = {
        A: { x: w * 0.5, y: h * 0.24 },
        B: { x: w * 0.24, y: h * 0.76 },
        C: { x: w * 0.76, y: h * 0.76 }
      };
      var rr = Math.min(w, h) * 0.105;
      var loops = {};
      Object.keys(centers).forEach(function (k, idx) {
        var ctr = centers[k];
        loops[k] = ctr;
        ctx.save();
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 1.6;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(ctr.x, ctr.y, rr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = c.accent;
        ctx.fill();
        ctx.restore();
        MP.label(ctx, k, ctr.x, ctr.y - 4, c.ink, 13, "center", '"Iowan Old Style", Georgia, serif');
        MP.label(ctx, "drome", ctr.x, ctr.y + 14, c.faint, 8, "center");
        var ang = t * 0.6 + idx * 2;
        MP.glowDot(ctx, ctr.x + Math.cos(ang) * rr, ctr.y + Math.sin(ang) * rr, 2.4, c.accent2, c.accent);
      });

      var links = [
        { a: "A", b: "B", active: true },
        { a: "B", b: "C", active: true },
        { a: "C", b: "A", active: cyc },
        { a: "A", b: "C", active: !cyc }
      ];
      links.forEach(function (lk) {
        if (!lk.active) return;
        var a = loops[lk.a], b = loops[lk.b];
        var mx = (a.x + b.x) / 2;
        var my = (a.y + b.y) / 2;
        if (lk.a === "C" && lk.b === "A") { mx += w * 0.11; my -= h * 0.03; }
        if (lk.a === "A" && lk.b === "C") { mx -= w * 0.02; my += h * 0.02; }
        ctx.save();
        ctx.strokeStyle = "#d96b6b";
        ctx.fillStyle = "#d96b6b";
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(mx, my, b.x, b.y);
        ctx.stroke();
        var ang2 = Math.atan2(b.y - my, b.x - mx);
        MP.arrow(ctx, b.x - Math.cos(ang2) * 24, b.y - Math.sin(ang2) * 24, b.x - Math.cos(ang2) * rr, b.y - Math.sin(ang2) * rr, "#d96b6b", 2, 8);
        ctx.restore();
        MP.label(ctx, "inhibits", mx, my - 8, "#d96b6b", 8, "center");
      });

      if (cyc) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = c.accent;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.54, Math.min(w, h) * 0.055, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        MP.label(ctx, "diallel", w * 0.5, h * 0.54, c.accent, 9, "center");
        MP.label(ctx, "the transverse link cannot be flattened", w * 0.5, h * 0.94, c.accent, 10, "center");
      } else {
        MP.label(ctx, "all links planar · a hierarchy of values", w * 0.5, h * 0.94, c.muted, 10, "center");
      }
    }
  }, { maxDpr: 2 });

  update();
})();
