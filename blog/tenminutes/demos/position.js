(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function positionScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-position-scene";
    el.innerHTML =
      '<div class="ls-position-grid">' +
        '<div class="ls-position-panel"><canvas class="ls-position-heat"></canvas><div class="ls-position-legend"><span>−1</span><i></i><span>+1</span></div></div>' +
        '<div class="ls-position-panel"><canvas class="ls-position-curve"></canvas></div>' +
      '</div>' +
      '<p class="ls-position-note">' + (DE ? "Auf Kreisbahnen in verschiedenen Dimensionen werden verschiedene Wellen addiert. Jede Dimension hat eine andere Frequenz; zusammen ergibt das den Fingerabdruck der Position." : "Positions are added as waves on circular orbits in different dimensions. Each dimension has a different frequency; together they form the position fingerprint.") + '</p>' +
      '<div class="ls-scene-row"><label class="ls-range">' + (DE ? "Kontext" : "Context") + ' <input type="range" class="ls-pos-context" min="16" max="128" step="8" value="64"><output>64</output></label><label class="ls-range">' + (DE ? "Dimensionen" : "Dimensions") + ' <input type="range" class="ls-pos-dims" min="2" max="64" step="2" value="24"><output>24</output></label><label class="ls-range">Position <input type="range" class="ls-pos-pos" min="0" max="10000" step="1" value="7"><output>7</output></label></div>' +
      '<div class="ls-scene-row ls-position-metric"><span class="ls-position-metric-label">' + (DE ? "Winkel" : "Angle") + '</span><button type="button" class="ls-chip' + (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? '' : ' is-on') + '" data-rotate="1">' + (DE ? "Drehen" : "Rotate") + '</button></div>' +
      '<div class="ls-position-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var heat = el.querySelector(".ls-position-heat");
    var curve = el.querySelector(".ls-position-curve");
    var contextEl = el.querySelector(".ls-pos-context");
    var dimsEl = el.querySelector(".ls-pos-dims");
    var posEl = el.querySelector(".ls-pos-pos");
    var readout = el.querySelector(".ls-position-readout");
    var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var context = 64, dims = 24, pos = 7, rotate = !reducedMotion;
    var posAnim = pos;
    var trail = [pos];
    var sweep = null;
    var heatSize = null, curveSize = null, yaw = -0.6, pitch = 0.5, drag = null, raf = 0, last = 0;
    var C = api.colors();
    var clamp = api.util.clamp;
    function pe(p, d, i) {
      var pair = Math.floor(i / 2);
      var freq = Math.pow(10000, (2 * pair) / Math.max(2, d));
      return i % 2 === 0 ? Math.sin(p / freq) : Math.cos(p / freq);
    }
    function drawHeat() {
      if (!heatSize) return;
      var ctx = heatSize.ctx, w = heatSize.w, h = heatSize.h;
      ctx.clearRect(0, 0, w, h);
      var padL = 34, padB = 22, padT = 8, padR = 8;
      var cols = Math.min(dims, 64), rows = Math.min(context, 128);
      var cw = (w - padL - padR) / cols, ch = (h - padT - padB) / rows;
      for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
          var v = pe(i, dims, j);
          var t = (v + 1) / 2;
          var col = t < 0.5 ? mix(C.sky, C.paper, t * 2) : mix(C.paper, C.gold, (t - 0.5) * 2);
          ctx.fillStyle = col;
          ctx.fillRect(padL + j * cw, padT + i * ch, Math.ceil(cw) + 0.5, Math.ceil(ch) + 0.5);
        }
      }
      ctx.strokeStyle = C.line;
      ctx.strokeRect(padL, padT, w - padL - padR, h - padT - padB);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "right";
      ctx.fillText("0", padL - 4, padT + 8);
      ctx.fillText(String(rows - 1), padL - 4, padT + (rows - 1) * ch + ch);
      ctx.textAlign = "center";
      ctx.fillText(DE ? "Dimension" : "dimension", padL + (w - padL - padR) / 2, h - 5);
    }
    var mix = api.util.hexMix;
    function project(x, y, z) {
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var x1 = x * cy - y * sy, y1 = x * sy + y * cy;
      var y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;
      var s = Math.min(curveSize.w * 0.45, curveSize.h * 0.36) / (1 + z2 * 0.25);
      return { x: curveSize.w / 2 + x1 * s, y: curveSize.h / 2 - y2 * s, z: z2 };
    }
    function curvePoint(t) {
      var d = Math.max(2, dims);
      return [pe(t, d, 0), pe(t, d, 1), pe(t, d, Math.min(2, d - 1))];
    }
    function unit3(v) {
      var n = Math.hypot(v[0], v[1], v[2]) || 1;
      return [v[0] / n, v[1] / n, v[2] / n];
    }
    function drawCurve() {
      if (!curveSize) return;
      var ctx = curveSize.ctx, w = curveSize.w, h = curveSize.h;
      var Cc = api.colors();
      ctx.clearRect(0, 0, w, h);
      function P(v) { return project(v[0], v[1], v[2]); }
      function line(a, b, col, alpha, width, dash) {
        var pa = P(a), pb = P(b);
        ctx.save();
        if (dash) ctx.setLineDash(dash);
        ctx.strokeStyle = col;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = width || 1;
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        ctx.restore();
      }
      var lat, lon, k, a, p;
      ctx.strokeStyle = Cc.line;
      ctx.globalAlpha = 0.32;
      ctx.lineWidth = 0.8;
      for (lat = -60; lat <= 60; lat += 30) {
        var yy = Math.sin(lat * Math.PI / 180), rr = Math.cos(lat * Math.PI / 180);
        ctx.beginPath();
        for (k = 0; k <= 60; k++) {
          a = k / 60 * Math.PI * 2;
          p = P([Math.cos(a) * rr, yy, Math.sin(a) * rr]);
          if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      for (lon = 0; lon < 180; lon += 30) {
        var lr = lon * Math.PI / 180;
        ctx.beginPath();
        for (k = 0; k <= 60; k++) {
          a = k / 60 * Math.PI * 2;
          p = P([Math.cos(a) * Math.cos(lr), Math.sin(a), Math.cos(a) * Math.sin(lr)]);
          if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      line([0, 0, 0], [1.25, 0, 0], Cc.blue, 0.65, 1.2);
      line([0, 0, 0], [0, 1.25, 0], Cc.green, 0.65, 1.2);
      line([0, 0, 0], [0, 0, 1.25], Cc.gold, 0.65, 1.2);
      function axisLabel(v, text, col) {
        var q = P(v);
        ctx.fillStyle = col;
        ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(text, q.x + 4, q.y - 3);
      }
      axisLabel([1.28, 0, 0], "x", Cc.blue);
      axisLabel([0, 1.28, 0], "y", Cc.green);
      axisLabel([0, 0, 1.28], "z", Cc.gold);
      trail.forEach(function (p) {
        var pp = P(unit3(curvePoint(p)));
        ctx.beginPath(); ctx.arc(pp.x, pp.y, 2.1, 0, Math.PI * 2);
        ctx.fillStyle = Cc.green; ctx.globalAlpha = 0.62; ctx.fill();
      });
      ctx.globalAlpha = 1;
      var startVec = curvePoint(0);
      var curVec = curvePoint(posAnim);
      var startP = unit3(startVec);
      var curP = unit3(curVec);
      var sp = P(startP), cp = P(curP);
      var origin = P([0, 0, 0]);
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = Cc.petrol;
      ctx.globalAlpha = 0.32;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(cp.x, cp.y);
      ctx.stroke();
      ctx.restore();
      if (api.visual && api.visual.tokenChip) {
        api.visual.tokenChip(ctx, DE ? "Hund" : "dog", origin.x, origin.y - 16, Cc.petrol, Cc, { size: api.font("canvas-sm") });
        ctx.fillStyle = Cc.muted;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(DE ? "Token" : "token", origin.x, origin.y + 20);
        ctx.textBaseline = "alphabetic";
      }
      var dot = Math.max(-1, Math.min(1, startP[0] * curP[0] + startP[1] * curP[1] + startP[2] * curP[2]));
      var theta = Math.acos(dot);
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = Cc.gold; ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (k = 0; k <= 64; k++) {
        var tt = k / 64;
        var s0 = theta < 1e-6 ? 1 : Math.sin((1 - tt) * theta) / Math.sin(theta);
        var s1 = theta < 1e-6 ? 0 : Math.sin(tt * theta) / Math.sin(theta);
        var vv = [startP[0] * s0 + curP[0] * s1, startP[1] * s0 + curP[1] * s1, startP[2] * s0 + curP[2] * s1];
        var pp = P(vv);
        if (k === 0) ctx.moveTo(pp.x, pp.y); else ctx.lineTo(pp.x, pp.y);
      }
      ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2); ctx.fillStyle = Cc.blue; ctx.fill();
      ctx.fillStyle = Cc.blue; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; ctx.textAlign = "left";
      ctx.fillText(DE ? "Start" : "start", sp.x + 7, sp.y - 5);
      ctx.save();
      ctx.shadowColor = "rgba(99,164,75,.55)"; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(cp.x, cp.y, 6, 0, Math.PI * 2); ctx.fillStyle = Cc.green; ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.arc(cp.x, cp.y, 6, 0, Math.PI * 2); ctx.strokeStyle = Cc.paper; ctx.lineWidth = 2; ctx.stroke();
      var geoLen = theta;
      var angleDeg = theta * 180 / Math.PI;
      curve.__lsPosition = { pos: pos, trail: trail.slice(), sweeping: !!sweep, metric: "angle", start: startVec, current: curVec, distance: geoLen, angle: theta };
      ctx.fillStyle = Cc.muted; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; ctx.textAlign = "left";
      ctx.fillText((DE ? "Position " : "position ") + Math.round(posAnim), 12, 18);
      ctx.textAlign = "right";
      ctx.fillText(DE ? "Winkel" : "angle", w - 12, 18);
      ctx.textAlign = "left";
      readout.innerHTML = '<span>' + (DE ? "Position" : "Position") + ' <b>' + Math.round(posAnim) + '</b></span><span>' + (DE ? "Vektor" : "vector") + ' <b>(' + curVec.map(function (x) { return x.toFixed(2); }).join(", ") + ')</b></span><span>' + (DE ? "Bogenlänge" : "arc length") + ' <b>' + geoLen.toFixed(3) + '</b></span><span>' + (DE ? "Winkel" : "angle") + ' <b>' + angleDeg.toFixed(1) + '°</b></span>';
    }
    function draw() {
      drawHeat(); drawCurve();
    }
    function resizeHeat() { heatSize = api.fit(heat, heat); drawHeat(); }
    function resizeCurve() { curveSize = api.fit(curve, curve); drawCurve(); }
    function resize() { resizeHeat(); resizeCurve(); draw(); }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (now - last < 40) return;
      last = now;
      if (sweep) {
        var st = clamp((now - sweep.start) / sweep.duration, 0, 1);
        var eased = st * st * (3 - 2 * st);
        pos = Math.round(sweep.from + (sweep.to - sweep.from) * eased);
        posAnim = pos;
        if (posEl) {
          posEl.value = String(pos);
          posEl.nextElementSibling.textContent = String(pos);
        }
        var lastTrail = trail.length ? trail[trail.length - 1] : pos;
        for (var tp = lastTrail + 12; tp < pos; tp += 12) trail.push(tp);
        if (pos > lastTrail) trail.push(pos);
        if (st >= 1) {
          pos = sweep.to; posAnim = pos; trail.push(pos);
          sweep = null;
          if (posEl) { posEl.value = String(pos); posEl.nextElementSibling.textContent = String(pos); }
        }
        drawCurve();
        return;
      }
      var moving = Math.abs(posAnim - pos) > 0.01;
      if (moving) {
        posAnim += (pos - posAnim) * 0.22;
        if (Math.abs(posAnim - pos) < 0.01) posAnim = pos;
      }
      if (moving || (rotate && !drag)) {
        if (rotate && !drag) yaw += 0.003;
        drawCurve();
      }
    }
    heat.addEventListener("pointerdown", function (e) {
      var r = heat.getBoundingClientRect();
      var padL = 34, padT = 8, padB = 22;
      var y = (e.clientY - r.top - padT) / (r.height - padT - padB);
      pos = Math.round(clamp(y, 0, 1) * (Math.min(context, 128) - 1));
      posEl.value = String(pos); posEl.nextElementSibling.textContent = String(pos);
      draw();
    });
    curve.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY }; });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return;
      yaw += (e.clientX - drag.x) * 0.008;
      pitch = clamp(pitch + (e.clientY - drag.y) * 0.006, -1.2, 1.2);
      drag.x = e.clientX; drag.y = e.clientY; drawCurve();
    });
    window.addEventListener("pointerup", function () { drag = null; });
    contextEl.addEventListener("input", function () { context = parseInt(contextEl.value, 10); contextEl.nextElementSibling.textContent = String(context); drawHeat(); });
    dimsEl.addEventListener("input", function () { dims = parseInt(dimsEl.value, 10); dimsEl.nextElementSibling.textContent = String(dims); drawHeat(); drawCurve(); });
    posEl.addEventListener("input", function () { sweep = null; pos = parseInt(posEl.value, 10); posAnim = pos; trail = [pos]; posEl.nextElementSibling.textContent = String(pos); draw(); });
    var rot = el.querySelector("[data-rotate]");
    rot.addEventListener("click", function () { rotate = !rotate; rot.classList.toggle("is-on", rotate); });
    window.addEventListener("resize", resize);
    function onTheme() { C = api.colors(); draw(); }
    window.addEventListener("tm:theme", onTheme);
    resize();
    raf = requestAnimationFrame(loop);
    function finishSweep() {
      if (!sweep) return;
      sweep = null;
      pos = 10000; posAnim = 10000;
      trail = [];
      for (var tv = 0; tv <= 10000; tv += 12) trail.push(tv);
      if (posEl) { posEl.value = "10000"; posEl.nextElementSibling.textContent = "10000"; }
      draw();
    }
    function next() {
      if (sweep) { finishSweep(); return true; }
      if (pos >= 10000) return false;
      trail = [pos];
      sweep = { from: pos, to: 10000, start: performance.now(), duration: 5000 };
      return true;
    }
    function prev() {
      if (sweep) { sweep = null; return true; }
      if (trail.length > 1 || pos > 0) { pos = 0; posAnim = 0; trail = [0]; if (posEl) { posEl.value = "0"; posEl.nextElementSibling.textContent = "0"; } draw(); return true; }
      return false;
    }
    return {
      update: function () {},
      busy: function () { return !!sweep; },
      finish: finishSweep,
      next: next,
      prev: prev,
      onKey: function (e) { return api.util.arrowKey(e, next, prev); },
      pause: function () { cancelAnimationFrame(raf); raf = 0; },
      resume: function () { if (!raf) raf = requestAnimationFrame(loop); },
      resize: resize,
      destroy: function () { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("tm:theme", onTheme); el.remove(); }
    };
  }

  core.register("position", positionScene);
})();
