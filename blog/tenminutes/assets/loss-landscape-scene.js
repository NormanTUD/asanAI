(function () {
  "use strict";

  window.LossLandscapeScene = function (root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-loss-scene";
    el.innerHTML =
      '<div class="ls-loss-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-loss-side"><div class="ls-loss-net"></div><div class="ls-loss-status" aria-live="polite"></div></div>' +
      '<div class="ls-loss-controls">' +
        '<label class="ls-range">' + (DE ? "Lernrate" : "Learning rate") + ' <input type="range" class="ls-loss-lr" min="0.01" max="0.25" step="0.01" value="0.06"><output>0.06</output></label>' +
        '<button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-loss-train">' + (DE ? "Im Worker trainieren" : "Train in worker") + '</button>' +
        '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-loss-play">' + (DE ? "Abspielen" : "Play") + '</button>' +
        '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-loss-step">' + (DE ? "Schritt" : "Step") + '</button>' +
        '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-loss-reset">' + (DE ? "Zurücksetzen" : "Reset") + '</button>' +
      '</div>' +
      '<div class="ls-loss-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-loss-stage");
    var canvas = el.querySelector("canvas");
    var netEl = el.querySelector(".ls-loss-net");
    var statusEl = el.querySelector(".ls-loss-status");
    var readout = el.querySelector(".ls-loss-readout");
    var lrEl = el.querySelector(".ls-loss-lr");
    var lrOut = lrEl.nextElementSibling;
    var trainBtn = el.querySelector(".ls-loss-train");
    var playBtn = el.querySelector(".ls-loss-play");
    var stepBtn = el.querySelector(".ls-loss-step");
    var resetBtn = el.querySelector(".ls-loss-reset");
    var C = api.colors();
    var size = null, ctx = null, data = null, worker = null;
    var yaw = -0.72, pitch = 0.86, drag = null, ball = 0, playing = false, raf = 0;
    var minL = 0, maxL = 1;

    function mix(a, b, t) {
      function rgb(h) { h = h.replace("#", ""); return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]; }
      var A = rgb(a), B = rgb(b);
      return "rgb(" + Math.round(A[0] + (B[0]-A[0])*t) + "," + Math.round(A[1] + (B[1]-A[1])*t) + "," + Math.round(A[2] + (B[2]-A[2])*t) + ")";
    }
    function lossColor(t) {
      t = Math.max(0, Math.min(1, t));
      return t < 0.55 ? mix(C.green, C.gold, t / 0.55) : mix(C.gold, C.lilac, (t - 0.55) / 0.45);
    }
    function project(a, b, L) {
      var range = data.range || 2.4;
      var x = a / range, y = b / range;
      var z = (L - minL) / Math.max(1e-9, maxL - minL);
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var x1 = x * cy - y * sy;
      var y1 = x * sy + y * cy;
      var y2 = y1 * cp - z * 0.85 * sp;
      var z2 = y1 * sp + z * 0.85 * cp;
      var s = Math.min(size.w * 0.34, size.h * 0.42);
      return { x: size.w * 0.5 + x1 * s, y: size.h * 0.56 - y2 * s, z: z2 };
    }
    function drawNet() {
      if (!data || !data.net) { netEl.innerHTML = ""; return; }
      var n = data.net;
      var w = 190, h = 150;
      var hx = 72, hy = [18, 56, 94, 132];
      var out = { x: 168, y: 75 };
      var html = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (DE ? "Kleines neuronales Netz mit einem Eingang, vier versteckten Neuronen und einem Ausgang" : "Small neural network with one input, four hidden neurons and one output") + '">';
      for (var j = 0; j < 4; j++) {
        var ww = Math.abs(n.W1[j]);
        html += '<line x1="24" y1="75" x2="' + hx + '" y2="' + hy[j] + '" stroke="' + (n.W1[j] >= 0 ? C.green : C.lilac) + '" stroke-width="' + (0.8 + Math.min(2.2, ww * 1.5)).toFixed(2) + '" opacity=".7"/>';
        var vw = Math.abs(n.W2[j]);
        html += '<line x1="' + hx + '" y1="' + hy[j] + '" x2="' + out.x + '" y2="' + out.y + '" stroke="' + (n.W2[j] >= 0 ? C.green : C.lilac) + '" stroke-width="' + (0.8 + Math.min(2.2, vw * 1.5)).toFixed(2) + '" opacity=".7"/>';
      }
      html += '<circle cx="24" cy="75" r="7" fill="' + C.paper + '" stroke="' + C.petrol + '" stroke-width="2"/>';
      for (var k = 0; k < 4; k++) html += '<circle cx="' + hx + '" cy="' + hy[k] + '" r="6" fill="' + C.paper + '" stroke="' + C.green + '" stroke-width="2"/>';
      html += '<circle cx="' + out.x + '" cy="' + out.y + '" r="7" fill="' + C.green + '" stroke="' + C.paper + '" stroke-width="2"/>';
      html += '<text x="24" y="94" text-anchor="middle" font-size="9" fill="' + C.muted + '">x</text>';
      html += '<text x="' + out.x + '" y="94" text-anchor="middle" font-size="9" fill="' + C.muted + '">ŷ</text>';
      html += '</svg>';
      netEl.innerHTML = '<div class="ls-loss-net-title">' + (DE ? "Das echte Modell" : "The real model") + '</div>' + html +
        '<div class="ls-loss-net-meta">1 → 4 → 1 · ' + (data.params || 13) + ' ' + (DE ? "Parameter" : "parameters") + '</div>';
    }
    function draw() {
      if (!size || !data) return;
      ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, size.w, size.h);
      var n = data.z.length;
      minL = Infinity; maxL = -Infinity;
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
        minL = Math.min(minL, data.z[i][j]); maxL = Math.max(maxL, data.z[i][j]);
      }
      var cells = [];
      for (var i2 = 0; i2 < n - 1; i2++) {
        for (var j2 = 0; j2 < n - 1; j2++) {
          var a0 = -data.range + 2 * data.range * j2 / (n - 1);
          var a1 = -data.range + 2 * data.range * (j2 + 1) / (n - 1);
          var b0 = -data.range + 2 * data.range * i2 / (n - 1);
          var b1 = -data.range + 2 * data.range * (i2 + 1) / (n - 1);
          var p0 = project(a0, b0, data.z[i2][j2]);
          var p1 = project(a1, b0, data.z[i2][j2 + 1]);
          var p2 = project(a1, b1, data.z[i2 + 1][j2 + 1]);
          var p3 = project(a0, b1, data.z[i2 + 1][j2]);
          cells.push({ p: [p0, p1, p2, p3], z: (p0.z + p1.z + p2.z + p3.z) / 4, l: (data.z[i2][j2] + data.z[i2][j2 + 1] + data.z[i2 + 1][j2 + 1] + data.z[i2 + 1][j2]) / 4 });
        }
      }
      cells.sort(function (a, b) { return a.z - b.z; });
      cells.forEach(function (c) {
        var t = (c.l - minL) / Math.max(1e-9, maxL - minL);
        ctx.fillStyle = lossColor(t);
        ctx.globalAlpha = .82;
        ctx.beginPath(); ctx.moveTo(c.p[0].x, c.p[0].y); ctx.lineTo(c.p[1].x, c.p[1].y); ctx.lineTo(c.p[2].x, c.p[2].y); ctx.lineTo(c.p[3].x, c.p[3].y); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = .16; ctx.strokeStyle = C.paper; ctx.lineWidth = .6; ctx.stroke();
      });
      ctx.globalAlpha = 1;
      var tr = data.trajectory || [];
      if (tr.length > 1) {
        ctx.beginPath();
        for (var k = 0; k <= Math.min(ball, tr.length - 1); k++) {
          var q = project(tr[k].a, tr[k].b, tr[k].loss);
          if (k === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
        }
        ctx.strokeStyle = C.green; ctx.lineWidth = 2.4; ctx.stroke();
      }
      if (tr.length) {
        var cur = tr[Math.min(ball, tr.length - 1)];
        var bp = project(cur.a, cur.b, cur.loss);
        ctx.beginPath(); ctx.arc(bp.x, bp.y + 5, 10, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,0,.16)"; ctx.fill();
        ctx.beginPath(); ctx.arc(bp.x, bp.y, 8, 0, Math.PI * 2); ctx.fillStyle = C.green; ctx.fill(); ctx.strokeStyle = C.paper; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = C.ink; ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; ctx.textAlign = "left";
        ctx.fillText("Loss " + cur.loss.toFixed(4), bp.x + 12, bp.y - 10);
      }
      var o = project(-data.range, -data.range, minL), ea = project(data.range, -data.range, minL), eb = project(-data.range, data.range, minL);
      ctx.strokeStyle = C.petrol; ctx.globalAlpha = .7; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(ea.x, ea.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(eb.x, eb.y); ctx.stroke();
      ctx.fillStyle = C.petrol; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "Richtung 1" : "direction 1", ea.x + 4, ea.y);
      ctx.fillText(DE ? "Richtung 2" : "direction 2", eb.x + 4, eb.y);
      ctx.fillStyle = C.muted; ctx.textAlign = "left";
      ctx.fillText("Loss", 18, 20);
      ctx.textAlign = "right";
      ctx.fillText((DE ? "Ziehen zum Drehen" : "drag to rotate"), size.w - 18, 20);
      updateReadout();
    }
    function updateReadout() {
      if (!data) { readout.innerHTML = '<span>' + (DE ? "Worker trainiert …" : "Worker is training …") + '</span>'; return; }
      var cur = data.trajectory && data.trajectory[Math.min(ball, data.trajectory.length - 1)];
      readout.innerHTML = '<span><b>Loss</b> ' + (cur ? cur.loss.toFixed(4) : data.loss.toFixed(4)) + '</span><span><b>' + (DE ? "Modell" : "model") + '</b> 1 → 4 → 1</span><span><b>' + (DE ? "Parameter" : "parameters") + '</b> ' + data.params + '</span><span><b>' + (DE ? "Schritt" : "step") + '</b> ' + ball + ' / ' + Math.max(0, data.trajectory.length - 1) + '</span>';
    }
    function updateStatus(text) { statusEl.textContent = text; }
    function startWorker() {
      if (worker) { worker.terminate(); worker = null; }
      data = null; ball = 0; playing = false; playBtn.textContent = DE ? "Abspielen" : "Play";
      updateStatus(DE ? "Trainiere im Worker …" : "Training in worker …");
      readout.innerHTML = '<span>' + (DE ? "Die Fläche wird im Hintergrund berechnet." : "The surface is computed in the background.") + '</span>';
      worker = new Worker("assets/loss-landscape-worker.js");
      worker.onmessage = function (e) {
        data = e.data;
        minL = Infinity; maxL = -Infinity;
        updateStatus(DE ? "Fertig · Modell trainiert" : "Done · model trained");
        drawNet();
        draw();
      };
      worker.onerror = function () {
        updateStatus(DE ? "Worker-Fehler" : "Worker error");
        readout.innerHTML = '<span>' + (DE ? "Der Worker konnte nicht geladen werden." : "The worker could not be loaded.") + '</span>';
      };
      worker.postMessage({ cmd: "train", lr: parseFloat(lrEl.value) || 0.06, seed: Date.now() });
    }
    function playLoop() {
      if (!data || !data.trajectory.length) return;
      playing = true; playBtn.textContent = DE ? "Pause" : "Pause";
      function tick(now) {
        if (!playing) { raf = 0; return; }
        raf = requestAnimationFrame(tick);
        if (now - (tick.last || 0) < 120) return;
        tick.last = now;
        ball++;
        if (ball >= data.trajectory.length - 1) { ball = data.trajectory.length - 1; playing = false; playBtn.textContent = DE ? "Nochmal" : "Again"; }
        draw();
      }
      raf = requestAnimationFrame(tick);
    }
    function pause() { playing = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    trainBtn.addEventListener("click", startWorker);
    playBtn.addEventListener("click", function () {
      if (!data) return;
      if (playing) { pause(); playBtn.textContent = DE ? "Abspielen" : "Play"; return; }
      if (ball >= data.trajectory.length - 1) ball = 0;
      playLoop();
    });
    stepBtn.addEventListener("click", function () { if (!data) return; pause(); ball = Math.min(data.trajectory.length - 1, ball + 1); draw(); });
    resetBtn.addEventListener("click", function () { if (!data) return; pause(); ball = 0; draw(); });
    lrEl.addEventListener("input", function () { lrOut.textContent = (parseFloat(lrEl.value) || 0.06).toFixed(2); });
    canvas.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY }; });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return;
      yaw += (e.clientX - drag.x) * 0.008;
      pitch = Math.max(0.25, Math.min(1.3, pitch + (e.clientY - drag.y) * 0.006));
      drag.x = e.clientX; drag.y = e.clientY; draw();
    });
    window.addEventListener("pointerup", function () { drag = null; });
    function resize() { size = api.fit(canvas, stage); draw(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    startWorker();
    return {
      update: function () {},
      resize: resize,
      pause: pause,
      resume: function () { draw(); },
      destroy: function () { pause(); if (worker) worker.terminate(); worker = null; window.removeEventListener("resize", resize); el.remove(); }
    };
  };
})();
