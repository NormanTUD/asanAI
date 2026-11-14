(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function tunnelScene(root, api) {
    var DE = api.lang === "de";
    var fallback = DE ? {
      base: ["Es", "war", "einmal", "ein"],
      tokens: ["Drache", "der", "konnte", "nicht", "fliegen", "."],
      history: [
        { index: 0, chosen: "Drache", chosenLogit: 3.4, alternatives: [{ token: "Ritter", logit: 1.1 }, { token: "Roboter", logit: 0.7 }, { token: "Schloss", logit: 0.4 }, { token: "Fluss", logit: 0.2 }] },
        { index: 1, chosen: "der", chosenLogit: 3.6, alternatives: [{ token: "das", logit: 0.7 }] },
        { index: 2, chosen: "konnte", chosenLogit: 3.0, alternatives: [{ token: "wollte", logit: 1.3 }, { token: "sollte", logit: 0.9 }, { token: "durfte", logit: 0.6 }, { token: "musste", logit: 0.3 }] },
        { index: 3, chosen: "nicht", chosenLogit: 3.3, alternatives: [{ token: "nie", logit: 1.2 }, { token: "nur", logit: 0.8 }, { token: "noch", logit: 0.5 }, { token: "immer", logit: 0.3 }] },
        { index: 4, chosen: "fliegen", chosenLogit: 3.5, alternatives: [{ token: "brüllen", logit: 1.5 }, { token: "schlafen", logit: 0.8 }, { token: "schwimmen", logit: 0.5 }, { token: "singen", logit: 0.3 }] },
        { index: 5, chosen: ".", chosenLogit: 3.2, alternatives: [{ token: "!", logit: 1.1 }, { token: "…", logit: 0.7 }] }
      ]
    } : {
      base: ["Once", "upon", "a", "time", "there", "was", "a"],
      tokens: ["dragon", "that", "could", "not", "fly", "."],
      history: [
        { index: 0, chosen: "dragon", chosenLogit: 3.4, alternatives: [{ token: "princess", logit: 1.1 }, { token: "robot", logit: 0.7 }, { token: "castle", logit: 0.4 }, { token: "river", logit: 0.2 }] },
        { index: 1, chosen: "that", chosenLogit: 3.1, alternatives: [{ token: "who", logit: 1.4 }, { token: "which", logit: 0.8 }] },
        { index: 2, chosen: "could", chosenLogit: 3.0, alternatives: [{ token: "would", logit: 1.3 }, { token: "loved", logit: 0.9 }, { token: "tried", logit: 0.6 }, { token: "wanted", logit: 0.3 }] },
        { index: 3, chosen: "not", chosenLogit: 3.3, alternatives: [{ token: "never", logit: 1.2 }, { token: "only", logit: 0.8 }, { token: "still", logit: 0.5 }, { token: "always", logit: 0.3 }] },
        { index: 4, chosen: "fly", chosenLogit: 3.5, alternatives: [{ token: "roar", logit: 1.5 }, { token: "sleep", logit: 0.8 }, { token: "swim", logit: 0.5 }, { token: "sing", logit: 0.3 }] },
        { index: 5, chosen: ".", chosenLogit: 3.2, alternatives: [{ token: "!", logit: 1.1 }, { token: "…", logit: 0.7 }] }
      ]
    };
    var loop = SHARED.loop;
    var data = loop && loop.tokens && loop.tokens.length ? loop : fallback;
    var baseTokens = (data.base || []).slice();
    var genTokens = data.tokens.slice();
    var pathTokens = baseTokens.concat(genTokens);
    var tokens = pathTokens;
    var history = data.history.slice();
    var base = baseTokens;
    var baseLen = baseTokens.length;
    var el = document.createElement("div");
    el.className = "ls-tunnel-scene";
    el.innerHTML =
      '<div class="ls-tunnel-top"><div class="ls-tunnel-sentence"></div><div class="ls-tunnel-meta-top"><span class="ls-tunnel-step"></span><span class="ls-tunnel-temp-read"></span></div></div>' +
      '<div class="ls-tunnel-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-tunnel-info"><div class="ls-tunnel-next-line"></div><div class="ls-tunnel-alts"></div></div>' +
      '<div class="ls-scene-row ls-tunnel-controls"><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-tunnel-advance">' + (DE ? "Weiter →" : "Next →") + '</button><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-tunnel-reset">' + (DE ? "Neu" : "Reset") + '</button><label class="ls-range">T <input type="range" class="ls-tunnel-temp" min="0.05" max="5" step="0.05" value="0.8"><output>0.80</output></label></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-tunnel-stage");
    var canvas = el.querySelector("canvas");
    var sentenceEl = el.querySelector(".ls-tunnel-sentence");
    var stepEl = el.querySelector(".ls-tunnel-step");
    var tempRead = el.querySelector(".ls-tunnel-temp-read");
    var nextLine = el.querySelector(".ls-tunnel-next-line");
    var altEl = el.querySelector(".ls-tunnel-alts");
    var tempEl = el.querySelector(".ls-tunnel-temp");
    var tempOut = el.querySelector("output");
    var advBtn = el.querySelector(".ls-tunnel-advance");
    var ctx = null, size = null, step = 0, temp = (data.temp != null ? data.temp : 0.8);
    tempEl.value = String(temp);
    tempOut.textContent = temp.toFixed(2);
    var yaw = -0.62, pitch = 0.82, zoom = 1;
    var hits = [], drag = null, suppress = false, highlightAlt = null;
    var camera = { scale: 1, ox: 0, oy: 0 };
    var clamp = api.util.clamp;
    function softmax(logits, t) {
      var max = Math.max.apply(null, logits);
      var exps = logits.map(function (l) { return Math.exp((l - max) / Math.max(0.05, t)); });
      var sum = exps.reduce(function (a, b) { return a + b; }, 0);
      return exps.map(function (e) { return e / sum; });
    }
    function entryAt(i) {
      if (i < baseLen) return null;
      return history[clamp(i - baseLen, 0, history.length - 1)] || history[0];
    }
    function probsAt(i) {
      if (i < baseLen) return { all: [], p: [], chosen: 1, entropy: 0.2 };
      var e = entryAt(i);
      var all = [{ token: e.chosen, logit: e.chosenLogit || 3 }].concat(e.alternatives || []);
      var p = softmax(all.map(function (o) { return o.logit; }), temp);
      var chosen = p[0];
      var entropy = 0;
      p.forEach(function (v) { if (v > 0) entropy -= v * Math.log(v); });
      return { all: all, p: p, chosen: chosen, entropy: entropy };
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function sampleAt(x) {
      var last = tokens.length - 1;
      var lo = clamp(Math.floor(x), 0, last);
      var hi = clamp(lo + 1, 0, last);
      var t = x - lo;
      var a = probsAt(lo), b = probsAt(hi);
      return { chosen: lerp(a.chosen, b.chosen, t), entropy: lerp(a.entropy, b.entropy, t) };
    }
    function sideY(index, count) {
      var side = index % 2 === 0 ? 1 : -1;
      return side * (0.62 + 0.22 * Math.floor(index / 2));
    }
    function heightAt(x, y) {
      var s = sampleAt(x);
      var width = 0.14 + 0.30 * s.entropy * (0.7 + temp * 0.2);
      var depth = 0.12 + 0.52 * s.chosen;
      var h = 0.42 - depth * Math.exp(-(y * y) / (2 * width * width));
      for (var i = 0; i < history.length; i++) {
        var e = history[i];
        var full = baseLen + i;
        var pr = probsAt(full);
        (e.alternatives || []).forEach(function (alt, k) {
          var cy = sideY(k, e.alternatives.length);
          var cx = full + 0.48 + 0.06 * Math.sin(i * 1.7 + k);
          var d = ((x - cx) * (x - cx)) / (2 * 0.13 * 0.13) + ((y - cy) * (y - cy)) / (2 * 0.10 * 0.10);
          h -= (0.12 + 0.52 * pr.p[k + 1]) * Math.exp(-d);
        });
      }
      h += 0.018 * Math.sin(x * 2.3 + y * 3.1) + 0.012 * Math.cos(x * 1.4 - y * 4.2);
      return h;
    }
    function sideInfluence(x, y) {
      var best = 0;
      for (var i = 0; i < history.length; i++) {
        var e = history[i];
        (e.alternatives || []).forEach(function (alt, k) {
          var cy = sideY(k, e.alternatives.length);
          var cx = baseLen + i + 0.48 + 0.06 * Math.sin(i * 1.7 + k);
          var d = Math.hypot((x - cx) / 0.16, (y - cy) / 0.12);
          best = Math.max(best, Math.exp(-d * d));
        });
      }
      return best;
    }
    function projectRaw(x, y, z) {
      var cx = (tokens.length - 1) / 2;
      var x0 = x - cx;
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var x1 = x0 * cy - y * sy;
      var y1 = x0 * sy + y * cy;
      var y2 = y1 * cp + z * sp;
      var z2 = y1 * sp + z * cp;
      return { x: x1 / (1 + z2 * 0.18), y: -y2 / (1 + z2 * 0.18), z: z2 };
    }
    function updateCamera() {
      var corners = [];
      var xs = [-1.8, tokens.length - 0.2];
      var ys = [-2.0, 2.0];
      var zs = [-0.35, 0.65];
      xs.forEach(function (x) { ys.forEach(function (y) { zs.forEach(function (z) { corners.push(projectRaw(x, y, z)); }); }); });
      var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      corners.forEach(function (p) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
      var pad = Math.min(28, size.w * 0.05);
      var scale = Math.min((size.w - pad * 2) / Math.max(0.001, maxX - minX), (size.h - pad * 2) / Math.max(0.001, maxY - minY));
      scale *= zoom;
      camera.scale = scale;
      camera.ox = size.w / 2 - (minX + maxX) / 2 * scale;
      camera.oy = size.h / 2 - (minY + maxY) / 2 * scale;
    }
    function project(x, y, z) {
      var p = projectRaw(x, y, z);
      return { x: p.x * camera.scale + camera.ox, y: p.y * camera.scale + camera.oy, z: p.z };
    }
    function colorFor(h, side) {
      var C = api.colors();
      if (side > 0.45 && h < 0.25) return C.gold;
      if (h < 0.05) return C.blue;
      if (h < 0.15) return C.sky;
      if (h < 0.26) return C.lime;
      return C.paper2;
    }
    function draw() {
      if (!size) resize();
      if (!ctx || !size) return;
      var C = api.colors();
      updateCamera();
      ctx.clearRect(0, 0, size.w, size.h);
      var sky = ctx.createRadialGradient(size.w * 0.5, size.h * 0.42, 10, size.w * 0.5, size.h * 0.5, Math.max(size.w, size.h) * 0.62);
      sky.addColorStop(0, "rgba(247,250,249,.9)");
      sky.addColorStop(0.55, "rgba(238,247,244,.7)");
      sky.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, size.w, size.h);

      var NX = Math.min(96, 44 + tokens.length * 4), NY = 34;
      var cells = [];
      for (var i = 0; i < NX; i++) {
        for (var j = 0; j < NY; j++) {
          var x0 = -2 + (tokens.length + 3.5) * i / NX;
          var x1 = -2 + (tokens.length + 3.5) * (i + 1) / NX;
          var y0 = -2.0 + 4.0 * j / NY;
          var y1 = -2.0 + 4.0 * (j + 1) / NY;
          var h00 = heightAt(x0, y0), h10 = heightAt(x1, y0), h11 = heightAt(x1, y1), h01 = heightAt(x0, y1);
          var p00 = project(x0, y0, h00), p10 = project(x1, y0, h10), p11 = project(x1, y1, h11), p01 = project(x0, y1, h01);
          var hAvg = (h00 + h10 + h11 + h01) / 4;
          cells.push({ pts: [p00, p10, p11, p01], z: (p00.z + p10.z + p11.z + p01.z) / 4, h: hAvg, side: sideInfluence((x0 + x1) / 2, (y0 + y1) / 2) });
        }
      }
      cells.sort(function (a, b) { return a.z - b.z; });
      cells.forEach(function (c) {
        ctx.beginPath();
        ctx.moveTo(c.pts[0].x, c.pts[0].y);
        ctx.lineTo(c.pts[1].x, c.pts[1].y);
        ctx.lineTo(c.pts[2].x, c.pts[2].y);
        ctx.lineTo(c.pts[3].x, c.pts[3].y);
        ctx.closePath();
        ctx.fillStyle = colorFor(c.h, c.side);
        ctx.globalAlpha = 0.78;
        ctx.fill();
        ctx.globalAlpha = 0.14;
        ctx.strokeStyle = C.paper;
        ctx.lineWidth = 0.55;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      history.forEach(function (e, i) {
        (e.alternatives || []).forEach(function (alt, k) {
          var cy = sideY(k, e.alternatives.length);
          var pts = [];
          for (var s = 0; s <= 18; s++) {
            var t = s / 18;
            var x = baseLen + i + t * 0.55;
            var y = t * cy;
            pts.push(project(x, y, heightAt(x, y) + 0.035));
          }
          ctx.beginPath();
          pts.forEach(function (p, k2) { if (k2 === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = C.gold;
          ctx.globalAlpha = 0.68;
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
          var end = pts[pts.length - 1];
          ctx.beginPath();
          ctx.arc(end.x, end.y, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = C.gold;
          ctx.fill();
          if (e.index === step) {
            ctx.fillStyle = C.soft;
            ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
            ctx.textAlign = "center";
            ctx.fillText(alt.token, end.x, end.y - 8);
          }
        });
      });

      var pathPts = [];
      for (var k = 0; k <= 80; k++) {
        var x = -1.7 + k / 80 * (tokens.length + 2.8);
        var y = 0;
        pathPts.push(project(x, y, heightAt(x, y) + 0.04));
      }
      ctx.save();
      ctx.shadowColor = "rgba(18,117,172,.55)";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      pathPts.forEach(function (p, i2) { if (i2 === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.85;
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      pathPts.forEach(function (p, i2) { if (i2 === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      ctx.globalAlpha = 1;

      hits = [];
      tokens.forEach(function (tok, i) {
        var p = project(i, 0, heightAt(i, 0) + 0.07);
        var on = i === baseLen + step;
        var above = i % 2 === 0;
        var label = tok;
        var fs = tokens.length > 16 ? 9 : 10;
        ctx.font = (on ? '700 ' : '600 ') + fs + 'px "Open Sans", sans-serif';
        var tw = ctx.measureText(label).width;
        var pw = tw + 12, ph = 17;
        var ly = above ? p.y - 30 : p.y + 12;
        ctx.fillStyle = on ? C.green : C.paper;
        ctx.strokeStyle = on ? C.green : C.lineStrong;
        ctx.lineWidth = 1;
        ctx.fillRect(p.x - pw / 2, ly, pw, ph);
        ctx.strokeRect(p.x - pw / 2, ly, pw, ph);
        ctx.fillStyle = on ? "#fff" : C.ink;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, p.x, ly + ph / 2 + 1);
        ctx.textBaseline = "alphabetic";
        hits.push({ x: p.x, y: ly + ph / 2, r: Math.max(18, pw / 2), step: clamp(i - baseLen, 0, genTokens.length - 1) });
      });

      var fullStep = baseLen + step;
      var bp = project(fullStep, 0, heightAt(fullStep, 0) + 0.10);
      ctx.save();
      ctx.shadowColor = "rgba(99,164,75,.65)";
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = C.green;
      ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, 12, 0, Math.PI * 2);
      ctx.strokeStyle = C.green;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;

      var pr = probsAt(baseLen + step);
      var e = entryAt(baseLen + step);
      var full = tokens;
      var sentenceHtml = "";
      var sentenceText = "";
      full.forEach(function (tok, i) {
        var noSpace = /^[.,!?;:…]/.test(tok);
        if (DE && i === baseLen + 1) { sentenceHtml += ","; sentenceText += ","; }
        if (i && !noSpace) { sentenceHtml += " "; sentenceText += " "; }
        var start = baseLen;
        var active = i === start + step;
        var pred = i >= start;
        sentenceHtml += '<span class="' + (active ? "is-active" : pred ? "is-pred" : "is-given") + '">' + api.esc(tok) + '</span>';
        sentenceText += tok;
      });
      sentenceEl.innerHTML = sentenceHtml;
      stepEl.textContent = (DE ? "Schritt " : "Step ") + (step + 1) + " / " + genTokens.length;
      tempRead.textContent = "T " + temp.toFixed(2);
      nextLine.innerHTML = '<span>' + (DE ? "Nächstes Wort" : "Next word") + '</span> <b>' + api.esc(genTokens[step] || "—") + '</b>';
      altEl.innerHTML = (e.alternatives || []).map(function (alt, k) {
        return '<button type="button" class="ls-tunnel-alt" data-alt="' + k + '">' + api.esc(alt.token) + '</button>';
      }).join("");
      altEl.querySelectorAll("[data-alt]").forEach(function (b) {
        b.addEventListener("click", function () {
          highlightAlt = parseInt(b.getAttribute("data-alt"), 10);
          draw();
        });
      });
      advBtn.disabled = step >= genTokens.length - 1;
      canvas.__lsHits = hits;
      canvas.__lsInfo = { path: tokens.length, generated: genTokens.length, step: step };
      var sentenceEnd = /[.!?…]$/.test(sentenceText) ? "" : ".";
      canvas.setAttribute("aria-label", DE
        ? "Wahrscheinlichkeitstunnel. Pfad: " + sentenceText + sentenceEnd + " Aktuelles Token: " + genTokens[step] + "."
        : "Probability tunnel. Path: " + sentenceText + sentenceEnd + " Current token: " + genTokens[step] + ".");
    }
    function refreshData() {
      var next = SHARED.loop;
      if (!next || !next.tokens || !next.tokens.length) return;
      var nextPath = (next.base || []).concat(next.tokens);
      if (nextPath.join("|") === tokens.join("|")) return;
      baseTokens = (next.base || []).slice();
      genTokens = next.tokens.slice();
      pathTokens = baseTokens.concat(genTokens);
      tokens = pathTokens;
      history = next.history.slice();
      base = baseTokens;
      baseLen = baseTokens.length;
      if (next.temp != null) { temp = next.temp; tempEl.value = String(temp); tempOut.textContent = temp.toFixed(2); }
      step = 0;
      draw();
    }
    function resize() {
      size = api.fit(canvas, stage);
      ctx = size.ctx;
      draw();
    }
    function hitAt(x, y) {
      var best = null, bd = 24;
      hits.forEach(function (h) {
        var d = Math.hypot(h.x - x, h.y - y);
        if (d < Math.max(bd, h.r)) { bd = d; best = h; }
      });
      return best;
    }
    function pointerPos(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function onMove(e) {
      var p = pointerPos(e);
      if (drag) {
        yaw += (e.clientX - drag.x) * 0.008;
        pitch = clamp(pitch + (e.clientY - drag.y) * 0.006, 0.22, 1.28);
        drag.x = e.clientX;
        drag.y = e.clientY;
        suppress = true;
        draw();
        return;
      }
      canvas.style.cursor = hitAt(p.x, p.y) ? "pointer" : "grab";
    }
    function onDown(e) {
      var p = pointerPos(e);
      if (hitAt(p.x, p.y)) { suppress = false; return; }
      drag = { x: e.clientX, y: e.clientY };
      suppress = false;
    }
    function onUp(e) {
      if (drag) { drag = null; return; }
      if (suppress) { suppress = false; return; }
      var p = pointerPos(e);
      var hit = hitAt(p.x, p.y);
      if (hit) { step = hit.step; draw(); }
    }
    advBtn.addEventListener("click", function () { step = Math.min(genTokens.length - 1, step + 1); draw(); });
    el.querySelector(".ls-tunnel-reset").addEventListener("click", function () { step = 0; draw(); });
    tempEl.addEventListener("input", function () { temp = parseFloat(tempEl.value) || 0.8; tempOut.textContent = temp.toFixed(2); draw(); });
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", function () { drag = null; });
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(stage); }
    window.addEventListener("resize", resize);
    resize();
    return {
      update: function (s) {
        refreshData();
        if (s && typeof s.step === "number") { step = clamp(s.step, 0, genTokens.length - 1); draw(); }
      },
      resume: refreshData,
      resize: resize,
      destroy: function () {
        if (ro) ro.disconnect();
        window.removeEventListener("resize", resize);
        el.remove();
      }
    };
  }

  core.register("tunnel", tunnelScene);
})();
