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
    var layer = 0, layerTarget = 0, displayLayer = 0, layerTween = 0, yaw = -0.62, pitch = 0.36, zoom = 1.35, drag = null;
    var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var playing = !reducedMotion, playTimer = 0;
    var raf = 0, lastTick = 0, running = !reducedMotion, autoPaused = false;
    var size = null, ctx = null;
    var C = api.colors();
    var colors = ["green", "sky", "gold", "lilac", "lime"];
    var PAD_X = 26, PAD_Y = 26;
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
    function fitBounds(pts) {
      var flat = [];
      pts.forEach(function (tok) { tok.forEach(function (p) { flat.push(p); }); });
      return V.trajBounds(flat, landmarks().map(function (l) { return l.value; }));
    }
    function project(v, b) {
      var view = { w: Math.max(80, size.w - PAD_X * 2), h: Math.max(80, size.h - PAD_Y * 2) };
      var p = V.trajProject(v, b, yaw, pitch, zoom, view);
      return { x: p.x + PAD_X, y: p.y + PAD_Y, z: p.z };
    }
    function roundRect(x, y, w, h, r) {
      var rr = Math.min(r || 4, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }
    function pillMetrics(text) {
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      return { w: ctx.measureText(text).width + 24, h: 18 };
    }
    function drawPillAt(text, bx, by, col, candidate) {
      var m = pillMetrics(text);
      ctx.save();
      ctx.shadowColor = "rgba(0,25,35,.14)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = V.alpha(C.paper, .94);
      roundRect(bx, by, m.w, m.h, 5);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = V.alpha(col, .38);
      ctx.lineWidth = 1;
      roundRect(bx, by, m.w, m.h, 5);
      ctx.stroke();
      if (candidate) {
        var cx = bx + 9, cy = by + m.h / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 4); ctx.lineTo(cx + 4, cy); ctx.lineTo(cx, cy + 4); ctx.lineTo(cx - 4, cy);
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(bx + 9, by + m.h / 2, 3, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      }
      ctx.fillStyle = C.ink;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(text, bx + 17, by + m.h / 2 + 0.5);
    }
    function placePill(text, p, col, boxes, candidate) {
      var m = pillMetrics(text);
      var anchors = [
        { x: p.x - m.w / 2, y: p.y - m.h - 9 },
        { x: p.x - m.w / 2, y: p.y + 9 },
        { x: p.x - m.w - 13, y: p.y - m.h / 2 },
        { x: p.x + 13, y: p.y - m.h / 2 },
        { x: p.x - m.w / 2, y: p.y - m.h * 2 - 14 },
        { x: p.x - m.w / 2, y: p.y + m.h + 14 }
      ];
      var chosen = null;
      for (var i = 0; i < anchors.length; i++) {
        var a = anchors[i];
        var bx = Math.max(PAD_X, Math.min(size.w - PAD_X - m.w, a.x));
        var by = Math.max(PAD_Y, Math.min(size.h - PAD_Y - m.h, a.y));
        var free = true;
        for (var b = 0; b < boxes.length; b++) {
          var bb = boxes[b];
          if (!(bx + m.w < bb.x || bb.x + bb.w < bx || by + m.h < bb.y || bb.y + bb.h < by)) { free = false; break; }
        }
        if (free) { chosen = { x: bx, y: by }; break; }
      }
      if (!chosen) chosen = { x: PAD_X, y: PAD_Y };
      boxes.push({ x: chosen.x, y: chosen.y, w: m.w, h: m.h });
      drawPillAt(text, chosen.x, chosen.y, col, candidate);
    }
    function traceSmooth(points) {
      if (!points || points.length < 2) return;
      ctx.moveTo(points[0].x, points[0].y);
      for (var i = 0; i < points.length - 1; i++) {
        var p0 = points[i - 1] || points[i];
        var p1 = points[i];
        var p2 = points[i + 1];
        var p3 = points[i + 2] || p2;
        ctx.bezierCurveTo(
          p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6,
          p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6,
          p2.x, p2.y
        );
      }
    }
    function drawGlobe(b) {
      var origin = project([0, 0, 0], b);
      var rings = [];
      [-0.78, -0.48, 0, 0.48, 0.78].forEach(function (z) {
        var r = Math.sqrt(Math.max(0, 1 - z * z));
        var pts = [];
        for (var a = 0; a <= 64; a++) {
          var t = a / 64 * Math.PI * 2;
          pts.push(project([Math.cos(t) * r, Math.sin(t) * r, z], b));
        }
        rings.push({ pts: pts, col: z === 0 ? C.green : C.sky, alpha: z === 0 ? .14 : .065, dash: z === 0 ? [4, 6] : null });
      });
      [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4].forEach(function (A) {
        var pts = [];
        for (var a = 0; a <= 40; a++) {
          var phi = -Math.PI / 2 + a / 40 * Math.PI;
          pts.push(project([Math.cos(A) * Math.cos(phi), Math.sin(A) * Math.cos(phi), Math.sin(phi)], b));
        }
        rings.push({ pts: pts, col: C.petrol, alpha: .05, dash: null });
      });
      ctx.save();
      rings.forEach(function (ring) {
        ctx.beginPath();
        ring.pts.forEach(function (p, i) { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
        ctx.strokeStyle = V.alpha(ring.col, ring.alpha);
        ctx.lineWidth = ring.dash ? 1 : 0.8;
        if (ring.dash) ctx.setLineDash(ring.dash);
        ctx.stroke();
        ctx.setLineDash([]);
      });
      var glow = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, Math.min(size.w, size.h) * 0.46);
      glow.addColorStop(0, V.alpha(C.sky, .10));
      glow.addColorStop(0.45, V.alpha(C.green, .035));
      glow.addColorStop(1, V.alpha(C.paper, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size.w, size.h);
      ctx.beginPath(); ctx.arc(origin.x, origin.y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = V.alpha(C.petrol, .16); ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(origin.x, origin.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = V.alpha(C.petrol, .35); ctx.fill();
      ctx.restore();
    }
    function pointAlong(points, t) {
      if (!points || points.length < 2) return points && points[0] ? points[0] : null;
      var x = Math.max(0, Math.min(points.length - 1, t * (points.length - 1)));
      var i = Math.floor(x), f = x - i;
      var a = points[Math.min(i, points.length - 1)];
      var b = points[Math.min(i + 1, points.length - 1)];
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    }
    function draw(now) {
      if (!size) return;
      now = now || performance.now();
      ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      var bg = ctx.createRadialGradient(size.w * 0.48, size.h * 0.38, 8, size.w * 0.5, size.h * 0.5, Math.max(size.w, size.h) * 0.78);
      bg.addColorStop(0, V.alpha(C.paper, .55));
      bg.addColorStop(0.55, V.alpha(C.paper, .12));
      bg.addColorStop(1, V.alpha(C.paper, .92));
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size.w, size.h);
      var pts = positions();
      var b = fitBounds(pts);
      drawGlobe(b);
      var origin = project([0, 0, 0], b);
      var axes = [
        { v: [1.1, 0, 0], col: C.blue, label: "PC1" },
        { v: [0, 1.1, 0], col: C.green, label: "PC2" },
        { v: [0, 0, 1.1], col: C.gold, label: "PC3" }
      ];
      axes.forEach(function (ax) {
        var o = project([0, 0, 0], b), p = project(ax.v, b);
        var px = Math.max(PAD_X + 18, Math.min(size.w - PAD_X - 40, p.x));
        var py = Math.max(PAD_Y + 14, Math.min(size.h - PAD_Y - 16, p.y));
        ctx.save();
        ctx.strokeStyle = V.alpha(ax.col, .22);
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(px, py); ctx.stroke();
        ctx.restore();
        ctx.beginPath(); ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = V.alpha(ax.col, .55);
        ctx.fill();
        ctx.fillStyle = V.alpha(ax.col, .72);
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(ax.label, Math.max(PAD_X, px + 5), Math.max(PAD_Y + 10, py - 5));
      });
      var projected = pts.map(function (seq) {
        return seq.map(function (p) { return project(p, b); });
      });
      var li = Math.floor(displayLayer), lf = displayLayer - li;
      var heads = data.tokens.map(function (tok, i) {
        var seq = pts[i];
        var idx = Math.min(li, seq.length - 1);
        var p0 = seq[idx] || seq[0];
        var p1 = seq[Math.min(idx + 1, seq.length - 1)] || p0;
        var pv = [p0[0] + (p1[0] - p0[0]) * lf, p0[1] + (p1[1] - p0[1]) * lf, p0[2] + (p1[2] - p0[2]) * lf];
        var p = project(pv, b);
        return { i: i, tok: tok, col: color(i), p: p, z: p.z };
      });
      heads.sort(function (a, b) { return a.z - b.z; });
      ctx.save();
      heads.forEach(function (h) {
        ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(h.p.x, h.p.y);
        ctx.strokeStyle = V.alpha(h.col, .10);
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 5]);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.restore();
      var order = projected.map(function (seq, i) {
        var z = 0;
        seq.forEach(function (p) { z += p.z; });
        return { i: i, z: z / seq.length };
      }).sort(function (a, b) { return a.z - b.z; });
      order.forEach(function (item) {
        var i = item.i, col = color(i), full = projected[i];
        var upto = Math.min(full.length, Math.max(1, Math.floor(displayLayer) + 1));
        var path = full.slice(0, upto);
        var frac = displayLayer - Math.floor(displayLayer);
        if (frac > 0 && upto < full.length) {
          path.push({
            x: full[upto - 1].x + (full[upto].x - full[upto - 1].x) * frac,
            y: full[upto - 1].y + (full[upto].y - full[upto - 1].y) * frac
          });
        }
        if (path.length < 2) return;
        var grad = ctx.createLinearGradient(path[0].x, path[0].y, path[path.length - 1].x, path[path.length - 1].y);
        grad.addColorStop(0, V.alpha(col, .10));
        grad.addColorStop(0.55, V.alpha(col, .62));
        grad.addColorStop(1, V.alpha(col, .95));
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = V.alpha(col, .10);
        ctx.lineWidth = 10;
        ctx.beginPath(); traceSmooth(path); ctx.stroke();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.4;
        ctx.shadowColor = V.alpha(col, .32);
        ctx.shadowBlur = 8;
        ctx.beginPath(); traceSmooth(path); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = V.alpha(C.paper, .26);
        ctx.lineWidth = 0.7;
        ctx.beginPath(); traceSmooth(path); ctx.stroke();
        ctx.restore();
        for (var k = 1; k < path.length - 1; k++) {
          ctx.beginPath(); ctx.arc(path[k].x, path[k].y, 1.7, 0, Math.PI * 2);
          ctx.fillStyle = V.alpha(col, .5);
          ctx.fill();
        }
        for (var s = 0; s < 2; s++) {
          var phase = ((now / 2800) + i * 0.17 + s * 0.5) % 1;
          var spark = pointAlong(path, phase);
          if (!spark) continue;
          ctx.beginPath(); ctx.arc(spark.x, spark.y, 2.1 + s * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = V.alpha(col, .95);
          ctx.shadowColor = col;
          ctx.shadowBlur = 9;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
      heads.forEach(function (h) {
        var pulse = 0.5 + 0.5 * Math.sin(now / 700 + h.i * 1.3);
        var gr = 16 + 6 * pulse;
        var glow = ctx.createRadialGradient(h.p.x, h.p.y, 0, h.p.x, h.p.y, gr);
        glow.addColorStop(0, V.alpha(h.col, .28 + .10 * pulse));
        glow.addColorStop(0.55, V.alpha(h.col, .10));
        glow.addColorStop(1, V.alpha(h.col, 0));
        ctx.fillStyle = glow;
        ctx.fillRect(h.p.x - gr, h.p.y - gr, gr * 2, gr * 2);
        ctx.beginPath(); ctx.arc(h.p.x, h.p.y, 9 + 2 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = V.alpha(h.col, .25);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath(); ctx.arc(h.p.x, h.p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = h.col;
        ctx.fill();
        ctx.strokeStyle = V.alpha(C.paper, .9);
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.beginPath(); ctx.arc(h.p.x - 1.5, h.p.y - 1.5, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = V.alpha(C.paper, .8);
        ctx.fill();
      });
      var labelBoxes = [];
      heads.forEach(function (h) {
        placePill(tokenLabel(h.tok), h.p, h.col, labelBoxes, false);
      });
      if (displayLayer > data.layers.length - 1.05) {
        landmarks().slice(0, 5).forEach(function (l) {
          var p = project(l.value, b);
          var pulse = 0.5 + 0.5 * Math.sin(now / 900 + p.x * 0.01);
          ctx.save();
          ctx.shadowColor = C.gold;
          ctx.shadowBlur = 10 + 6 * pulse;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - 6); ctx.lineTo(p.x + 6, p.y); ctx.lineTo(p.x, p.y + 6); ctx.lineTo(p.x - 6, p.y);
          ctx.closePath();
          ctx.fillStyle = C.gold;
          ctx.fill();
          ctx.restore();
          ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
          ctx.strokeStyle = V.alpha(C.gold, .25);
          ctx.lineWidth = 1;
          ctx.stroke();
          placePill(tokenLabel(l.word), { x: p.x + 12, y: p.y + 2 }, C.gold, labelBoxes, true);
        });
      }
      var status = (DE ? "GPT-2 · Zustände · Schicht: " : "GPT-2 · states · layer: ") + (data.layers[Math.round(displayLayer)] || "");
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      var sw = ctx.measureText(status).width + 28;
      ctx.save();
      ctx.fillStyle = V.alpha(C.paper, .82);
      roundRect(10, 8, sw, 20, 6);
      ctx.fill();
      ctx.strokeStyle = V.alpha(C.line, .75);
      ctx.lineWidth = 1;
      roundRect(10, 8, sw, 20, 6);
      ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.arc(19, 18, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = C.green;
      ctx.fill();
      ctx.fillStyle = C.petrol;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(status, 27, 18.5);
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
    function visualLoop(now) {
      if (!running) return;
      if (now - lastTick >= 32) { lastTick = now; draw(now); }
      raf = requestAnimationFrame(visualLoop);
    }
    function startLoop() {
      if (reducedMotion || raf) return;
      running = true;
      raf = requestAnimationFrame(visualLoop);
    }
    function stopLoop() {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
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
    startLoop();
    startAuto();
    return {
      update: function () {},
      setLayer: setLayer,
      maxLayer: maxLayer,
      play: function () { playing = true; startAuto(); startLoop(); },
      pause: function () { stopLoop(); if (playing) { autoPaused = true; stopAuto(); } },
      resume: function () { startLoop(); if (autoPaused) { autoPaused = false; playing = true; startAuto(); } },
      isPlaying: function () { return playing; },
      next: function () { stopAuto(); if (layerTarget >= maxLayer) return false; setLayer(layerTarget + 1); return true; },
      prev: function () { stopAuto(); if (layerTarget <= 0) return false; setLayer(layerTarget - 1); return true; },
      resize: resize,
      destroy: function () { stopLoop(); stopAuto(); if (layerTween) cancelAnimationFrame(layerTween); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onPointerMove); window.removeEventListener("pointerup", onPointerUp); window.removeEventListener("tm:theme", onTheme); el.remove(); }
    };
  }

  core.register("trajectories", trajectoriesScene);
})();
