(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function trajectoriesScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var data = window.TM_GPT2_DATA;
    var el = document.createElement("div");
    el.className = "ls-traj-scene";
    el.innerHTML = '<div class="ls-traj-plot" role="img"><canvas class="ls-canvas"></canvas></div>' +
      '<div class="ls-scene-row"><label class="ls-range">Layer <input type="range" class="ls-traj-layer" min="0" max="12" step="1" value="0"><output>Embedding</output></label><button type="button" class="ls-btn ls-btn--tiny ls-traj-play">' + (DE ? "Bewegung ▶" : "Motion ▶") + '</button><button type="button" class="ls-btn ls-btn--tiny ls-traj-next">' + (DE ? "Nächste Schicht →" : "Next layer →") + '</button></div>' +
      '<div class="ls-traj-readout" aria-live="polite"></div>' +
      '<p class="ls-traj-note">' + (DE ? "Die Demo nutzt den Großkreis: Richtungen zählen, nicht Längen. Die Linien wachsen mit jeder Schicht." : "The demo uses the great circle: directions count, not lengths. The lines grow with each layer.") + '</p>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-traj-plot");
    var canvas = el.querySelector("canvas");
    var layerEl = el.querySelector(".ls-traj-layer");
    var layerOut = el.querySelector("output");
    var readout = el.querySelector(".ls-traj-readout");
    var playBtn = el.querySelector(".ls-traj-play");
    var maxLayer = data && data.points && data.points[0] ? data.points[0].length - 1 : 12;
    layerEl.max = String(maxLayer);
    var layer = 0, layerTarget = 0, displayLayer = 0, layerTween = 0, yaw = -0.62, pitch = 0.36, zoom = 0.95, drag = null;
    var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var playing = !reducedMotion, playTimer = 0;
    var size = null, ctx = null;
    var C = api.colors();
    var colors = ["green", "sky", "gold", "lilac", "lime"];
    function tokenLabel(t) { return t.replace(/^ /, "␣"); }
    function color(i) { return C[colors[i % colors.length]] || C.petrol; }
    function positions() {
      return data.points.map(function (token) {
        return token.map(function (p) {
          var len = Math.hypot(p[0], p[1], p[2]) || 1;
          return [p[0] / len, p[1] / len, p[2] / len];
        });
      });
    }
    function landmarks() {
      return data.landmarks.map(function (l) {
        var len = Math.hypot(l.value[0], l.value[1], l.value[2]) || 1;
        return { word: l.word, p: l.p, value: [l.value[0] / len, l.value[1] / len, l.value[2] / len] };
      });
    }
    function fitBounds(pts) { return V.trajBounds(pts, landmarks().map(function (l) { return l.value; })); }
    function project(v, b) { return V.trajProject(v, b, yaw, pitch, zoom, size); }
    function drawLabel(x, y, text, col, align) {
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      var tw = ctx.measureText(text).width;
      var pad = 4, h = 15;
      var bx = align === "right" ? x - tw - pad * 2 : x;
      var by = y - h / 2;
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.fillRect(bx, by, tw + pad * 2, h);
      ctx.fillStyle = col;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(text, bx + pad, y + 0.5);
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      var bg = ctx.createRadialGradient(size.w * 0.5, size.h * 0.4, 8, size.w * 0.5, size.h * 0.5, Math.max(size.w, size.h) * 0.75);
      bg.addColorStop(0, "rgba(247,250,249,.9)");
      bg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, size.w, size.h);
      var pts = positions();
      var b = fitBounds(pts);
      // faint PCA axes
      var axes = [
        { v: [1.1, 0, 0], col: C.blue, label: "PC1" },
        { v: [0, 1.1, 0], col: C.green, label: "PC2" },
        { v: [0, 0, 1.1], col: C.gold, label: "PC3" }
      ];
      axes.forEach(function (ax) {
        var o = project([0, 0, 0], b), p = project(ax.v, b);
        ctx.strokeStyle = ax.col; ctx.globalAlpha = 0.22; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = ax.col; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left"; ctx.fillText(ax.label, p.x + 4, p.y - 4);
      });
      // trajectories
      data.tokens.forEach(function (tok, i) {
        var col = color(i);
        var full = pts[i].map(function (p) { return project(p, b); });
        var upto = Math.min(full.length, Math.max(1, Math.floor(displayLayer) + 1));
        var path = full.slice(0, upto);
        var frac = displayLayer - Math.floor(displayLayer);
        if (frac > 0 && upto < full.length) {
          path.push({
            x: full[upto - 1].x + (full[upto].x - full[upto - 1].x) * frac,
            y: full[upto - 1].y + (full[upto].y - full[upto - 1].y) * frac
          });
        }
        ctx.save();
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.72;
        ctx.lineWidth = 2.4;
        ctx.lineJoin = "round";
        ctx.beginPath();
        path.forEach(function (p, k) { if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 0.55;
        for (var k = 1; k < path.length - 1; k++) {
          ctx.beginPath(); ctx.arc(path[k].x, path[k].y, 1.8, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
        }
        ctx.globalAlpha = 1;
      });
      // current layer markers and labels
      var labelBoxes = [];
      var li = Math.floor(displayLayer), lf = displayLayer - li;
      data.tokens.forEach(function (tok, i) {
        var seq = pts[i];
        if (!seq || !seq.length) return;
        var idx = Math.min(li, seq.length - 1);
        var p0 = seq[idx] || seq[0];
        var p1 = seq[Math.min(idx + 1, seq.length - 1)] || p0;
        var pv = [p0[0] + (p1[0] - p0[0]) * lf, p0[1] + (p1[1] - p0[1]) * lf, p0[2] + (p1[2] - p0[2]) * lf];
        var p = project(pv, b);
        if (idx > 0) {
          var prevRaw = seq[idx - 1];
          if (!prevRaw) return;
          var prevP = project(prevRaw, b);
          ctx.save();
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = color(i);
          ctx.globalAlpha = 0.45;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(prevP.x, prevP.y); ctx.lineTo(p.x, p.y); ctx.stroke();
          ctx.restore();
          ctx.beginPath(); ctx.arc(prevP.x, prevP.y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = color(i); ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1;
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = color(i); ctx.fill();
        ctx.strokeStyle = C.paper; ctx.lineWidth = 1.5; ctx.stroke();
        var text = tokenLabel(tok);
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        var tw = ctx.measureText(text).width + 8;
        var offsets = [[0, -20], [0, 12], [-tw - 8, -8], [8, -8], [0, -34], [0, 26]];
        var chosen = null;
        for (var oi = 0; oi < offsets.length; oi++) {
          var bx = p.x + offsets[oi][0] - (offsets[oi][0] < 0 ? tw : 0);
          var by = p.y + offsets[oi][1];
          var cand = { x: bx, y: by, w: tw, h: 15 };
          var free = bx >= 3 && by >= 3 && bx + tw <= size.w - 3 && by + 15 <= size.h - 3;
          if (free) {
            for (var lbi = 0; lbi < labelBoxes.length; lbi++) {
              var lb = labelBoxes[lbi];
              if (!(cand.x + cand.w < lb.x || lb.x + lb.w < cand.x || cand.y + cand.h < lb.y || lb.y + lb.h < cand.y)) { free = false; break; }
            }
          }
          if (free) { chosen = cand; break; }
        }
        if (!chosen) chosen = { x: Math.max(3, Math.min(size.w - tw - 3, p.x - tw / 2)), y: Math.max(3, Math.min(size.h - 18, p.y - 20)), w: tw, h: 15 };
        labelBoxes.push(chosen);
        ctx.fillStyle = "rgba(255,255,255,.88)";
        ctx.fillRect(chosen.x, chosen.y, chosen.w, chosen.h);
        ctx.fillStyle = color(i);
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillText(text, chosen.x + 4, chosen.y + 7.5);
      });
      // candidates at final layer
      if (displayLayer > data.layers.length - 1.05) {
        landmarks().slice(0, 5).forEach(function (l) {
          var p = project(l.value, b);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - 5); ctx.lineTo(p.x + 5, p.y); ctx.lineTo(p.x, p.y + 5); ctx.lineTo(p.x - 5, p.y);
          ctx.closePath(); ctx.fillStyle = C.gold; ctx.fill();
          ctx.strokeStyle = C.paper; ctx.lineWidth = 1; ctx.stroke();
          drawLabel(p.x + 8, p.y - 10, tokenLabel(l.word), C.gold, "left");
        });
      }
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillText((DE ? "GPT-2 · Zustände · Schicht: " : "GPT-2 · states · layer: ") + (data.layers[Math.round(displayLayer)] || ""), 12, 18);
      canvas.setAttribute("aria-label", DE
        ? "3D-Token-Trajektorien durch GPT-2. Schicht " + (data.layers[Math.round(displayLayer)] || "") + ", Großkreis-Metrik."
        : "3D token trajectories through GPT-2. Layer " + (data.layers[Math.round(displayLayer)] || "") + ", great-circle metric.");
      canvas.__lsTraj = { displayLayer: displayLayer, layerTarget: layerTarget };
    }
    function updateReadout() {
      var cand = layerTarget === data.layers.length - 1
        ? '<span>' + (DE ? "Kandidaten" : "Candidates") + '</span>' + data.top.slice(0, 5).map(function (t) { return '<span><b>' + api.esc(tokenLabel(t.token)) + '</b> ' + (t.p * 100).toFixed(1) + '%</span>'; }).join("")
        : '<span>' + (DE ? "Kandidaten erscheinen in der letzten Schicht." : "Candidates appear at the final layer.") + '</span>';
      readout.innerHTML = '<span>' + (DE ? "Satz" : "Sentence") + ' <b>' + api.esc(data.sentence) + '</b></span><span>' + (DE ? "Schicht" : "Layer") + ' <b>' + Math.round(displayLayer) + ' / ' + maxLayer + '</b></span>' + cand;
      layerOut.textContent = data.layers[layerTarget] || "";
    }
    function updatePlayButton() {
      if (!playBtn) return;
      playBtn.textContent = playing ? (DE ? "Pause ⏸" : "Pause ⏸") : (DE ? "Bewegung ▶" : "Motion ▶");
      playBtn.setAttribute("aria-pressed", String(playing));
    }
    function stopAuto() {
      playing = false;
      if (playTimer) { clearInterval(playTimer); playTimer = 0; }
      updatePlayButton();
    }
    function startAuto() {
      if (playTimer) clearInterval(playTimer);
      if (!playing || reducedMotion) { if (reducedMotion) playing = false; playTimer = 0; updatePlayButton(); return; }
      playTimer = setInterval(function () {
        if (!playing) return;
        setLayer((layerTarget + 1) % (maxLayer + 1));
      }, 1400);
      updatePlayButton();
    }
    function toggleAuto() {
      if (playing) stopAuto();
      else { playing = true; startAuto(); }
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    function pointer(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function setLayer(v) {
      layerTarget = Math.min(maxLayer, Math.max(0, parseInt(v, 10) || 0));
      layerEl.value = String(layerTarget);
      updateReadout();
      if (layerTween) { cancelAnimationFrame(layerTween); layerTween = 0; }
      if (reducedMotion) { displayLayer = layerTarget; updateReadout(); draw(); return; }
      var from = displayLayer, start = performance.now(), dur = (api.motion && api.motion.step) || 180;
      function step(now) {
        var t = Math.min(1, (now - start) / dur);
        var e = t * t * (3 - 2 * t);
        displayLayer = from + (layerTarget - from) * e;
        updateReadout();
        draw();
        if (t < 1) layerTween = requestAnimationFrame(step);
        else layerTween = 0;
      }
      layerTween = requestAnimationFrame(step);
      setTimeout(function () {
        if (Math.abs(displayLayer - layerTarget) > 0.01) {
          displayLayer = layerTarget;
          updateReadout();
          draw();
        }
      }, dur + 80);
    }
    layerEl.addEventListener("input", function () { stopAuto(); setLayer(layerEl.value); });
    if (playBtn) playBtn.addEventListener("click", toggleAuto);
    el.querySelector(".ls-traj-next").addEventListener("click", function () { setLayer(layerTarget + 1); });
    canvas.addEventListener("pointerdown", function (e) { drag = pointer(e); });
    function onPointerMove(e) {
      if (!drag) return;
      var p = pointer(e);
      yaw += (p.x - drag.x) * 0.008;
      pitch = Math.min(1.25, Math.max(-1.25, pitch + (p.y - drag.y) * 0.006));
      drag = p;
      draw();
    }
    function onPointerUp() { drag = null; }
    function onTheme() { C = api.colors(); draw(); }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      zoom = Math.min(2.2, Math.max(0.55, zoom * (e.deltaY > 0 ? 0.94 : 1.06)));
      draw();
    }, { passive: false });
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", onTheme);
    updateReadout();
    resize();
    updatePlayButton();
    startAuto();
    return {
      update: function () {},
      setLayer: setLayer,
      maxLayer: maxLayer,
      play: function () { playing = true; startAuto(); },
      pause: stopAuto,
      isPlaying: function () { return playing; },
      next: function () { stopAuto(); if (layerTarget >= maxLayer) return false; setLayer(layerTarget + 1); return true; },
      prev: function () { stopAuto(); if (layerTarget <= 0) return false; setLayer(layerTarget - 1); return true; },
      resize: resize,
      destroy: function () { stopAuto(); if (layerTween) cancelAnimationFrame(layerTween); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onPointerMove); window.removeEventListener("pointerup", onPointerUp); window.removeEventListener("tm:theme", onTheme); el.remove(); }
    };
  }

  core.register("trajectories", trajectoriesScene);
})();
