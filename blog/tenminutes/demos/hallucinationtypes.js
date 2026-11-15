(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var clamp = core.clamp;
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
    function bg(w, h) {
      var g = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      g.addColorStop(0, "rgba(247,250,249,.96)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    function card(x, y, w, h, fill, stroke) {
      ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
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
    function drawFalse(w, h) {
      var pad = 20, cw = Math.min(220, w * 0.36), bh = 82;
      var lx = pad, rx = w - pad - cw, y = h * 0.30;
      card(lx, y, cw, bh, "#fff", C.lineStrong);
      text(DE ? "Trainingsdaten" : "training data", lx + 12, y + 18, '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif', C.petrol);
      text(DE ? "Berlin liegt an der Elbe." : "Berlin lies on the Elbe.", lx + 12, y + 46, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.lilac);
      card(rx, y, cw, bh, "#fff", C.lineStrong);
      text(DE ? "Modell" : "model", rx + 12, y + 18, '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif', C.petrol);
      text(DE ? "Berlin liegt an der Elbe." : "Berlin lies on the Elbe.", rx + 12, y + 46, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.ink);
      arrow(lx + cw + 6, y + bh / 2, rx - 6, y + bh / 2, C.lilac, 2);
      var pulse = 0.5 + 0.5 * Math.sin((performance.now() - t0) / 500);
      ctx.globalAlpha = 0.25 + pulse * 0.35;
      card(lx + 6, y + 36, cw - 12, 20, "rgba(145,133,190,.20)", C.lilac);
      ctx.globalAlpha = 1;
      text(DE ? "falsche Quelle" : "false source", lx + 12, y + bh + 18, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.lilac);
    }
    function drawSampling(w, h) {
      var pad = 24, n = 5, base = h - 44, maxH = h * 0.46;
      var names = DE ? ["Spree", "Elbe", "Stadt", "Fluss", "Berlin"] : ["Spree", "Elbe", "city", "river", "Berlin"];
      var probs = [0.52, 0.22, 0.12, 0.09, 0.05];
      var bw = Math.min(54, (w - pad * 2) / n - 10);
      var start = w / 2 - (n * bw + (n - 1) * 10) / 2;
      var picked = 1;
      names.forEach(function (name, i) {
        var x = start + i * (bw + 10);
        var bh = probs[i] * maxH;
        var on = i === picked;
        ctx.fillStyle = on ? C.lilac : C.sky;
        ctx.globalAlpha = on ? 0.9 : 0.55;
        ctx.fillRect(x, base - bh, bw, bh);
        ctx.globalAlpha = 1;
        text((probs[i] * 100).toFixed(0) + "%", x + bw / 2, base - bh - 7, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', on ? C.lilac : C.muted, "center");
        text(name, x + bw / 2, base + 14, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', on ? C.lilac : C.ink, "center");
      });
      var t = ((performance.now() - t0) / 1400) % 1;
      var x = start + (bw + 10) * (picked + 0.5);
      var y = base - probs[picked] * maxH - 26;
      ctx.fillStyle = C.gold;
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      text(DE ? "Zufall wählt" : "random draw", w / 2, 22, '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif', C.petrol, "center");
      text(DE ? "Berlin liegt an der Elbe." : "Berlin lies on the Elbe.", w / 2, h - 16, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.ink, "center");
    }
    function drawGap(w, h) {
      var cols = 4, rows = 3, pad = 30;
      var cell = Math.min((w - pad * 2) / cols, (h - 84) / rows) - 6;
      var startX = w / 2 - (cols * (cell + 6) - 6) / 2, startY = 54;
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var x = startX + c * (cell + 6), y = startY + r * (cell + 6);
        var hole = r === 1 && c === 2;
        card(x, y, cell, cell, hole ? "rgba(145,133,190,.08)" : "#fff", hole ? C.lilac : C.line);
        if (hole) {
          var pulse = 0.5 + 0.5 * Math.sin((performance.now() - t0) / 420);
          ctx.globalAlpha = 0.35 + pulse * 0.4;
          ctx.setLineDash([4, 4]); ctx.strokeStyle = C.lilac; ctx.strokeRect(x + 4, y + 4, cell - 8, cell - 8); ctx.setLineDash([]); ctx.globalAlpha = 1;
          text("?", x + cell / 2, y + cell / 2, '700 ' + api.font("canvas") + 'px "Barlow", sans-serif', C.lilac, "center");
        } else {
          text(String.fromCharCode(65 + r * cols + c), x + cell / 2, y + cell / 2, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.muted, "center");
        }
      }
      arrow(w / 2, startY + cell * 1.5 + 12, w / 2, startY + cell * 1.5 + 34, C.lilac, 2);
      text(DE ? "Das Modell erfindet eine Antwort." : "The model invents an answer.", w / 2, h - 18, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.ink, "center");
    }
    function drawNegation(w, h) {
      var pts = DE ? [
        { id: "happy", label: "glücklich", x: 0.22, y: 0.42, c: C.green },
        { id: "not", label: "nicht glücklich", x: 0.36, y: 0.46, c: C.blue },
        { id: "sad", label: "traurig", x: 0.80, y: 0.78, c: C.lilac },
        { id: "unhappy", label: "unglücklich", x: 0.72, y: 0.70, c: C.lilac }
      ] : [
        { id: "happy", label: "happy", x: 0.22, y: 0.42, c: C.green },
        { id: "not", label: "not happy", x: 0.36, y: 0.46, c: C.blue },
        { id: "sad", label: "sad", x: 0.80, y: 0.78, c: C.lilac },
        { id: "unhappy", label: "unhappy", x: 0.72, y: 0.70, c: C.lilac }
      ];
      function X(v) { return 36 + v * (w - 72); }
      function Y(v) { return h - 42 - v * (h - 92); }
      pts.forEach(function (p) {
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.ink;
        text(p.label, X(p.x) + 9, Y(p.y), '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.ink, "left");
      });
      var near = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      var far = Math.hypot(pts[1].x - pts[2].x, pts[1].y - pts[2].y);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = C.blue; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(X(pts[0].x), Y(pts[0].y)); ctx.lineTo(X(pts[1].x), Y(pts[1].y)); ctx.stroke();
      ctx.strokeStyle = C.lilac;
      ctx.beginPath(); ctx.moveTo(X(pts[1].x), Y(pts[1].y)); ctx.lineTo(X(pts[2].x), Y(pts[2].y)); ctx.stroke();
      ctx.setLineDash([]);
      text(DE ? "nah" : "near", (X(pts[0].x) + X(pts[1].x)) / 2, Math.min(Y(pts[0].y), Y(pts[1].y)) - 8, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.blue, "center");
      text(DE ? "weit" : "far", (X(pts[1].x) + X(pts[2].x)) / 2, Math.min(Y(pts[1].y), Y(pts[2].y)) - 8, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.lilac, "center");
      text(DE ? "„nicht glücklich“ liegt näher an „glücklich“ als an „traurig“." : "“not happy” is closer to “happy” than to “sad”.", w / 2, h - 16, '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif', C.ink, "center");
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      bg(w, h);
      if (mode === "false") drawFalse(w, h);
      else if (mode === "sampling") drawSampling(w, h);
      else if (mode === "gap") drawGap(w, h);
      else drawNegation(w, h);
      canvas.setAttribute("aria-label", captions[mode]);
    }
    function loop() {
      if (!running) return;
      draw();
      loopRaf = requestAnimationFrame(loop);
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    el.querySelectorAll("[data-mode]").forEach(function (b) {
      b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); });
    });
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
