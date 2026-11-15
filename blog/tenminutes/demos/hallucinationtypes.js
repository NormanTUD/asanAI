(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var clamp = core.clamp, ease = core.ease;
  function hallucinationTypesScene(root, api) {
    var DE = api.lang === "de";
    var modes = ["false", "sampling", "gap", "negation"];
    var labels = DE
      ? { "false": "Falsche Daten", sampling: "Sampling", gap: "Lücken", negation: "Negation" }
      : { "false": "False data", sampling: "Sampling", gap: "Gaps", negation: "Negation" };
    var captions = DE
      ? {
          "false": "Das Modell wiederholt eine falsche Quelle mit ruhiger Stimme.",
          sampling: "Zufall im Sampling kann einen plausiblen, aber falschen Pfad wählen.",
          gap: "Fehlt Wissen, füllt das Modell die Lücke mit einer Erfindung.",
          negation: "„Nicht glücklich“ ist nicht „traurig“: Es bleibt näher an „glücklich“."
        }
      : {
          "false": "The model repeats a false source in a calm voice.",
          sampling: "Randomness in sampling can pick a plausible but false path.",
          gap: "When knowledge is missing, the model fills the gap with an invention.",
          negation: "“Not happy” is not “sad”: it stays closer to “happy”."
        };
    var mode = "false";
    var t0 = performance.now();
    var loopRaf = 0, running = true;
    var el = document.createElement("div");
    el.className = "ls-ht-scene";
    el.innerHTML =
      '<div class="ls-ht-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-ht-controls">' + modes.map(function (m) {
        return '<button type="button" class="ls-chip' + (m === mode ? " is-on" : "") + '" data-mode="' + m + '">' + labels[m] + '</button>';
      }).join("") + '</div>' +
      '<div class="ls-ht-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-ht-stage");
    var canvas = el.querySelector("canvas");
    var readout = el.querySelector(".ls-ht-readout");
    var size = null, ctx = null;
    var C = api.colors();
    function setMode(m) {
      if (modes.indexOf(m) < 0 || m === mode) return;
      mode = m;
      t0 = performance.now();
      el.querySelectorAll("[data-mode]").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-mode") === mode); });
      readout.textContent = captions[mode];
      draw();
    }
    function bg(w, h, accent) {
      var g = ctx.createRadialGradient(w * 0.5, h * 0.38, 8, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      g.addColorStop(0, "rgba(247,250,249,.98)");
      g.addColorStop(0.42, accent + "10");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(0,75,111,.045)";
      ctx.lineWidth = 1;
      for (var y = 40; y < h; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
    }
    function card(x, y, w, h, fill, stroke, glow) {
      if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 18; }
      ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.strokeRect(x, y, w, h);
    }
    function text(str, x, y, font, color, align, baseline) {
      ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align || "left"; ctx.textBaseline = baseline || "middle"; ctx.fillText(str, x, y);
    }
    function arrow(x1, y1, x2, y2, color, width) {
      var a = Math.atan2(y2 - y1, x2 - x1), h = 7;
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width || 1.6;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - h * Math.cos(a - 0.42), y2 - h * Math.sin(a - 0.42)); ctx.lineTo(x2 - h * Math.cos(a + 0.42), y2 - h * Math.sin(a + 0.42)); ctx.closePath(); ctx.fill();
    }
    function glowDot(x, y, r, color) {
      ctx.shadowColor = color; ctx.shadowBlur = 18;
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    function iconDatabase(x, y, s, color) {
      ctx.strokeStyle = color; ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.35, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y + s * 0.7, s, s * 0.35, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x - s, y + s * 0.7); ctx.moveTo(x + s, y); ctx.lineTo(x + s, y + s * 0.7); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y + s * 0.35, s, s * 0.35, 0, 0, Math.PI); ctx.stroke();
    }
    function iconDie(x, y, s, color) {
      ctx.strokeStyle = color; ctx.fillStyle = "#fff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(x - s, y - s, s * 2, s * 2); ctx.fill(); ctx.stroke();
      [[-0.45, -0.45], [0.45, 0.45], [0, 0]].forEach(function (p) {
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + p[0] * s, y + p[1] * s, 2.4, 0, Math.PI * 2); ctx.fill();
      });
    }
    function iconGap(x, y, s, color) {
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.strokeRect(x - s, y - s, s * 0.7, s * 0.7);
      ctx.strokeRect(x + s * 0.3, y - s, s * 0.7, s * 0.7);
      ctx.strokeRect(x - s, y + s * 0.3, s * 0.7, s * 0.7);
      ctx.setLineDash([3, 3]); ctx.strokeRect(x + s * 0.3, y + s * 0.3, s * 0.7, s * 0.7); ctx.setLineDash([]);
    }
    function particles(w, h, now, color) {
      for (var i = 0; i < 26; i++) {
        var x = ((i * 73 + now / (28 + i % 5)) % w + w) % w;
        var y = ((i * 41 + Math.sin(now / 900 + i) * 24 + h * 0.16) % h + h) % h;
        ctx.globalAlpha = 0.04 + (i % 4) * 0.018;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, 1 + (i % 3) * 0.7, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function orbitRing(w, h, now, color) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.10;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 7]);
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, Math.min(w, h) * 0.43, now / 3200, now / 3200 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    function iconNot(x, y, s, color) {
      ctx.strokeStyle = color; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(x - s, y + s); ctx.lineTo(x + s, y + s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s, y + s); ctx.lineTo(x + s * 1.4, y + s * 0.3); ctx.stroke();
    }
    function drawFalse(w, h, now) {
      var pad = 18, cw = Math.min(230, w * 0.38), bh = 88;
      var lx = pad, rx = w - pad - cw, y = h * 0.26;
      var pulse = 0.5 + 0.5 * Math.sin((now - t0) / 420);
      iconDatabase(lx + 30, y + 26, 15, C.lilac);
      card(lx, y, cw, bh, "#fff", C.lineStrong, pulse > 0.5 ? C.lilac : null);
      text(DE ? "Trainingsdaten" : "training data", lx + 56, y + 18, '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif', C.petrol);
      text(DE ? "Berlin liegt an der Elbe." : "Berlin lies on the Elbe.", lx + 14, y + 52, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.lilac);
      ctx.globalAlpha = 0.22 + pulse * 0.3;
      card(lx + 6, y + 40, cw - 12, 22, "rgba(145,133,190,.28)", C.lilac, C.lilac);
      ctx.globalAlpha = 1;
      card(rx, y, cw, bh, "#fff", C.lineStrong, C.lilac);
      text(DE ? "Modell" : "model", rx + 14, y + 18, '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif', C.petrol);
      text(DE ? "Berlin liegt an der Elbe." : "Berlin lies on the Elbe.", rx + 14, y + 52, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.ink);
      text("95%", rx + cw - 16, y + 18, '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif', C.lilac, "right");
      var ax1 = lx + cw + 6, ax2 = rx - 6, ay = y + bh / 2;
      arrow(ax1, ay, ax2, ay, C.lilac, 2);
      for (var i = 0; i < 5; i++) {
        var u = ((now / 1100) + i / 5) % 1;
        glowDot(ax1 + (ax2 - ax1) * u, ay + Math.sin(u * Math.PI * 2) * 4, 2.2, C.lilac);
      }
      text(DE ? "falsche Quelle" : "false source", lx + 14, y + bh + 18, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.lilac);
      text(DE ? "wird ruhig wiederholt" : "repeated calmly", rx + 14, y + bh + 18, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.muted);
    }
    function drawSampling(w, h, now) {
      var cx = w * 0.34, cy = h * 0.48, r = Math.min(78, h * 0.26);
      var names = DE ? ["Spree", "Elbe", "Stadt", "Fluss", "Berlin"] : ["Spree", "Elbe", "city", "river", "Berlin"];
      var ang0 = (now - t0) / 700;
      var picked = 1;
      ctx.save();
      ctx.translate(cx, cy);
      for (var i = 0; i < names.length; i++) {
        var a1 = ang0 + i * Math.PI * 2 / names.length;
        var a2 = a1 + Math.PI * 2 / names.length;
        var on = i === picked;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, a1, a2); ctx.closePath();
        ctx.fillStyle = on ? "rgba(159,151,0,.30)" : (i % 2 ? "rgba(92,155,175,.12)" : "rgba(99,164,75,.10)");
        ctx.fill();
        ctx.strokeStyle = on ? C.gold : C.line; ctx.lineWidth = on ? 2 : 1; ctx.stroke();
        ctx.save(); ctx.rotate((a1 + a2) / 2); ctx.translate(r * 0.55, 0);
        ctx.fillStyle = on ? C.petrol : C.muted; ctx.font = '600 9px "Open Sans", sans-serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(names[i], 0, 0); ctx.restore();
      }
      ctx.rotate(ang0 * 2.2);
      ctx.strokeStyle = C.gold; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 1.02, 0); ctx.stroke();
      ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(r * 1.02, 0, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      glowDot(cx, cy, 6, C.gold);
      ctx.save();
      ctx.translate(w * 0.62, h * 0.26);
      ctx.rotate(Math.sin((now - t0) / 260) * 0.25);
      iconDie(0, 0, 18, C.gold);
      ctx.restore();
      text(DE ? "Zufall wählt" : "random draw", w * 0.62, h * 0.26 + 34, '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif', C.petrol, "center");
      card(w * 0.52, h * 0.64, w * 0.42, 54, "#fff", C.lineStrong, C.gold);
      text(DE ? "Berlin liegt an der Elbe." : "Berlin lies on the Elbe.", w * 0.52 + 14, h * 0.64 + 20, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.ink);
      text(DE ? "gewählt: Elbe" : "chosen: Elbe", w * 0.52 + 14, h * 0.64 + 40, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.gold);
      text(DE ? "ein unwahrscheinliches Token" : "an unlikely token", cx, cy + r + 18, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.muted, "center");
    }
    function drawGap(w, h, now) {
      var pad = 26, cols = 5, rows = 3, cell = Math.min((w - pad * 2) / cols, (h - 100) / rows) - 8;
      var sx = w * 0.32 - (cols * (cell + 8) - 8) / 2, sy = 54;
      var hole = { r: 1, c: 3 };
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var x = sx + c * (cell + 8), y = sy + r * (cell + 8);
        var isHole = r === hole.r && c === hole.c;
        card(x, y, cell, cell, isHole ? "rgba(92,155,175,.10)" : "#fff", isHole ? C.sky : C.line);
        if (isHole) {
          var pulse = 0.5 + 0.5 * Math.sin((now - t0) / 380);
          ctx.globalAlpha = 0.35 + pulse * 0.45;
          ctx.setLineDash([4, 4]); ctx.strokeStyle = C.sky; ctx.strokeRect(x + 4, y + 4, cell - 8, cell - 8); ctx.setLineDash([]); ctx.globalAlpha = 1;
          text("?", x + cell / 2, y + cell / 2, '700 ' + api.font("canvas") + 'px "Barlow", sans-serif', C.sky, "center");
        }
      }
      iconGap(w * 0.78, h * 0.28, 20, C.sky);
      text(DE ? "Wissenslücke" : "knowledge gap", w * 0.78, h * 0.28 + 36, '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif', C.petrol, "center");
      var hx = sx + hole.c * (cell + 8) + cell / 2, hy = sy + hole.r * (cell + 8) + cell / 2;
      var mx = w * 0.78, my = h * 0.28;
      ctx.setLineDash([4, 4]); arrow(mx, my + 28, hx, hy, C.sky, 1.6); ctx.setLineDash([]);
      for (var i = 0; i < 4; i++) { var u = ((now / 1000) + i / 4) % 1; glowDot(mx + (hx - mx) * u, my + 28 + (hy - my - 28) * u, 2, C.sky); }
      text(DE ? "Modell erfindet" : "model invents", (mx + hx) / 2, Math.min(my + 28, hy) - 10, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.sky, "center");
      card(w * 0.50, h - 62, w * 0.42, 44, "#fff", C.lineStrong, C.sky);
      text(DE ? "Eine plausible, falsche Antwort" : "A plausible, false answer", w * 0.50 + 12, h - 40, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.ink);
    }
    function drawNegation(w, h, now) {
      var pts = DE ? [
        { id: "happy", label: "glücklich", x: 0.20, y: 0.46, c: C.green },
        { id: "not", label: "nicht glücklich", x: 0.36, y: 0.46, c: C.blue },
        { id: "sad", label: "traurig", x: 0.82, y: 0.76, c: C.lilac },
        { id: "unhappy", label: "unglücklich", x: 0.72, y: 0.70, c: C.lilac }
      ] : [
        { id: "happy", label: "happy", x: 0.20, y: 0.46, c: C.green },
        { id: "not", label: "not happy", x: 0.36, y: 0.46, c: C.blue },
        { id: "sad", label: "sad", x: 0.82, y: 0.76, c: C.lilac },
        { id: "unhappy", label: "unhappy", x: 0.72, y: 0.70, c: C.lilac }
      ];
      function X(v) { return 38 + v * (w - 76); }
      function Y(v) { return h - 56 - v * (h - 106); }
      iconNot(w * 0.10, h * 0.16, 12, C.blue);
      text(DE ? "keine saubere Umkehrung" : "not a clean reversal", w * 0.10 + 20, h * 0.16 + 14, '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif', C.petrol);
      var near = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      var far = Math.hypot(pts[1].x - pts[2].x, pts[1].y - pts[2].y);
      ctx.beginPath();
      pts.forEach(function (p, i) { if (i === 0) ctx.moveTo(X(p.x), Y(p.y)); else ctx.lineTo(X(p.x), Y(p.y)); });
      ctx.closePath();
      ctx.fillStyle = "rgba(99,164,75,.055)"; ctx.fill();
      ctx.setLineDash([5, 4]); ctx.strokeStyle = C.blue; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(X(pts[0].x), Y(pts[0].y)); ctx.lineTo(X(pts[1].x), Y(pts[1].y)); ctx.stroke();
      ctx.strokeStyle = C.lilac;
      ctx.beginPath(); ctx.moveTo(X(pts[1].x), Y(pts[1].y)); ctx.lineTo(X(pts[2].x), Y(pts[2].y)); ctx.stroke();
      ctx.setLineDash([]);
      pts.forEach(function (p) {
        glowDot(X(p.x), Y(p.y), 6, p.c);
        text(p.label, X(p.x) + 10, Y(p.y), '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.ink, "left");
      });
      text(DE ? "nah" : "near", (X(pts[0].x) + X(pts[1].x)) / 2, Math.min(Y(pts[0].y), Y(pts[1].y)) - 9, '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.blue, "center");
      text(DE ? "weit" : "far", (X(pts[1].x) + X(pts[2].x)) / 2, Math.min(Y(pts[1].y), Y(pts[2].y)) - 9, '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.lilac, "center");
      var barsX = w * 0.46, barsY = h - 54, maxW = w * 0.42;
      var norm = Math.max(near, far);
      text(DE ? "Abstand zu glücklich" : "distance to happy", barsX, barsY - 18, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.blue);
      ctx.fillStyle = "rgba(18,117,172,.12)"; ctx.fillRect(barsX, barsY - 10, maxW, 8);
      ctx.fillStyle = C.blue; ctx.fillRect(barsX, barsY - 10, maxW * near / norm, 8);
      text(DE ? "Abstand zu traurig" : "distance to sad", barsX, barsY + 14, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.lilac);
      ctx.fillStyle = "rgba(145,133,190,.12)"; ctx.fillRect(barsX, barsY + 22, maxW, 8);
      ctx.fillStyle = C.lilac; ctx.fillRect(barsX, barsY + 22, maxW * far / norm, 8);
      text(DE ? "„nicht glücklich“ liegt näher an „glücklich“." : "“not happy” is closer to “happy”.", w / 2, h - 12, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.ink, "center");
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h, now = performance.now();
      ctx.clearRect(0, 0, w, h);
      var accent = mode === "false" ? "#9185be" : (mode === "sampling" ? "#9f9700" : (mode === "gap" ? "#5c9baf" : "#63a44b"));
      bg(w, h, accent);
      particles(w, h, now, accent);
      orbitRing(w, h, now, accent);
      var age = now - t0;
      if (age < 900) {
        var pr = clamp(age / 900, 0, 1);
        ctx.globalAlpha = 0.20 * (1 - pr);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(w * 0.5, h * 0.5, 18 + pr * Math.min(w, h) * 0.48, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (mode === "false") drawFalse(w, h, now);
      else if (mode === "sampling") drawSampling(w, h, now);
      else if (mode === "gap") drawGap(w, h, now);
      else drawNegation(w, h, now);
      canvas.setAttribute("aria-label", captions[mode]);
    }
    function loop() { if (!running) return; draw(); loopRaf = requestAnimationFrame(loop); }
    function resize() { size = api.fit(canvas, stage); draw(); }
    el.querySelectorAll("[data-mode]").forEach(function (b) { b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); }); });
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    readout.textContent = captions[mode];
    resize();
    loopRaf = requestAnimationFrame(loop);
    return {
      update: function (s) { if (s && s.mode) setMode(s.mode); },
      next: function () { var i = modes.indexOf(mode); if (i < modes.length - 1) { setMode(modes[i + 1]); return true; } return false; },
      prev: function () { var i = modes.indexOf(mode); if (i > 0) { setMode(modes[i - 1]); return true; } return false; },
      pause: function () { running = false; if (loopRaf) cancelAnimationFrame(loopRaf); loopRaf = 0; },
      resume: function () { if (!running) { running = true; loopRaf = requestAnimationFrame(loop); } },
      resize: resize,
      destroy: function () { running = false; if (loopRaf) cancelAnimationFrame(loopRaf); window.removeEventListener("resize", resize); el.remove(); }
    };
  }
  core.register("hallucinationtypes", hallucinationTypesScene);
})();
