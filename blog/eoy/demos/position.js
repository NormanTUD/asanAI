(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function positionScene(root, api) {
    var DE = api.lang === "de";
    function L(de, en) { return DE ? de : en; }
    var el = document.createElement("div");
    el.className = "ls-position-scene";
    el.innerHTML =
      '<div class="ls-position-grid">' +
        '<div class="ls-position-panel"><div class="ls-position-space-note">' + (DE ? "Hochdimensionaler Raum · Positionen 0–100000 (256 Zeilen gesampelt) · 3D = Projektion" : "High-dimensional space · positions 0–100000 (256 sampled rows) · 3D = projection") + '</div><canvas class="ls-position-heat" aria-label="' + L("Heatmap der Positionskodierungen über 256 gesampelte Positionen und 64 Dimensionen; über eine Zelle fahren zeigt Position, Dimension, Frequenz, Sinus, Kosinus und Wert.", "Heatmap of positional encodings over 256 sampled positions and 64 dimensions; hover a cell for position, dimension, frequency, sine, cosine and value.") + '"></canvas><div class="ls-position-heat-cursor" aria-hidden="true"><span></span></div><div class="ls-position-legend" data-tip="' + L("Zellfarbe: Sinus-/Kosinuswert von −1 bis +1. Der Mittelwert ist Petrol, nicht Weiß, damit die Punkte auf dem weißen Hintergrund sichtbar bleiben.", "Cell colour: sine/cosine value from −1 to +1. The middle is petrol, not white, so points stay visible on the white background.") + '"><span>−1</span><i></i><span>+1</span></div><div class="ls-position-hue-legend" data-tip="' + L("Farbe der Trail-Punkte: Position von 0 bis 100000. Dieselbe Farbskala läuft links als schmaler Streifen neben der Heatmap.", "Trail-point colour: position from 0 to 100000. The same scale runs as a thin strip beside the heatmap.") + '"><span>0</span><i></i><span>100k</span><em>' + L("Position", "position") + '</em></div></div>' +
        '<div class="ls-position-right"><div class="ls-position-metric"><span>' + (DE ? "Metrik" : "Metric") + '</span><div class="ls-position-metric-btns" role="group" aria-label="' + (DE ? "Metrik der Positionsdarstellung" : "Position visualisation metric") + '"><button type="button" data-pos-metric="greatcircle" class="is-on" data-tip="' + L("Großkreis: vergleicht die Richtungen der Positionsvektoren über den Winkel auf der Einheitskugel; 0° heißt gleiche Richtung.", "Great circle: compares the directions of the position vectors by the angle on the unit sphere; 0° means the same direction.") + '">' + (DE ? "Großkreis (Winkel)" : "Great circle (angle)") + '</button><button type="button" data-pos-metric="euclid" data-tip="' + L("Euklid: vergleicht die rohen Positionsvektoren über ihre Länge; die Distanz wächst mit dem Abstand der Positionen.", "Euclidean: compares the raw position vectors by their length; the distance grows with the separation of the positions.") + '">' + (DE ? "Euklid (Distanz)" : "Euclidean (distance)") + '</button></div></div><div class="ls-position-panel"><canvas class="ls-position-curve" aria-label="' + L("Kurve der Distanz zwischen Position 0 und der gewählten Position unter der aktuellen Metrik; der aktuelle Wert steht in der Anzeige darunter.", "Distance curve between position 0 and the selected position under the current metric; the current value is in the readout below.") + '"></canvas></div><label class="ls-range" hidden>Position <input type="range" class="ls-pos-pos" min="0" max="100000" step="1" value="7"><output>7</output></label></div>' +
      '</div>' +
      '<div class="ls-position-readout" aria-live="polite" data-tip="' + L("Zeigt die gewählte Position, die Metrik, den Winkel bzw. die Distanz und den aktuellen Heatmap-Wert.", "Shows the selected position, metric, angle or distance, and the current heatmap value.") + '"></div>';
    root.appendChild(el);
    var heat = el.querySelector(".ls-position-heat");
    heat.setAttribute("data-ls-canvas-tip", "1");
    var heatCursor = el.querySelector(".ls-position-heat-cursor");
    var curve = el.querySelector(".ls-position-curve");
    curve.setAttribute("data-ls-canvas-tip", "1");
    var posEl = el.querySelector(".ls-pos-pos");
    var readout = el.querySelector(".ls-position-readout");
    var metricBtns = Array.prototype.slice.call(el.querySelectorAll("[data-pos-metric]"));
    var metric = "greatcircle";
    var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var context = 100000, dims = 64, pos = 7, rotate = !reducedMotion;
    var posAnim = pos;
    function addTrailTo(target) {
      target = clamp(Math.round(target || 0), 0, 100000);
      trail = trail.filter(function (v) { return v <= target; });
      if (target <= 2000) {
        var set = Object.create(null);
        trail.forEach(function (v) { set[v] = 1; });
        for (var t = 0; t <= target; t++) set[t] = 1;
        trail = Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
        return;
      }
      var step = Math.max(12, Math.ceil(target / 1200));
      var last = trail.length ? trail[trail.length - 1] : -1;
      for (var u = last + step; u < target; u += step) trail.push(u);
      if (trail[trail.length - 1] !== target) trail.push(target);
      trail.sort(function (a, b) { return a - b; });
    }
    var clamp = api.util.clamp;
    var trail = [];
    var trailPoints = [], hoverTrail = -1, heatHover = null;
    var reveal = false;
    var sweep = null;
    var heatSize = null, curveSize = null, yaw = -0.6, pitch = 0.5, drag = null, raf = 0, last = 0;
    var C = api.colors();
    function pe(p, d, i) {
      var pair = Math.floor(i / 2);
      var freq = Math.pow(10000, (2 * pair) / Math.max(2, d));
      return i % 2 === 0 ? Math.sin(p / freq) : Math.cos(p / freq);
    }
    function updateHeatCursor() {
      if (!heatCursor || !heatSize) return;
      var padL = 34, padB = 22, padT = 8, padR = 8;
      var rows = Math.min(context, 256);
      var ch = (heatSize.h - padT - padB) / rows;
      var row = Math.max(0, Math.min(rows - 1, Math.round(posAnim / Math.max(1, context - 1) * (rows - 1))));
      heatCursor.style.left = padL + "px";
      heatCursor.style.width = Math.max(0, heatSize.w - padL - padR) + "px";
      heatCursor.style.top = (padT + row * ch + ch / 2) + "px";
      var label = heatCursor.querySelector("span");
      if (label) label.textContent = "p " + Math.round(posAnim);
    }
    function drawHeat() {
      if (!heatSize) return;
      var ctx = heatSize.ctx, w = heatSize.w, h = heatSize.h;
      ctx.clearRect(0, 0, w, h);
      var padL = 34, padB = 22, padT = 8, padR = 8;
      var cols = Math.min(dims, 64), rows = Math.min(context, 256);
      function rowPosition(row) { return Math.round(row * (context - 1) / (rows - 1)); }
      var cw = (w - padL - padR) / cols, ch = (h - padT - padB) / rows;
      for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
          var v = pe(rowPosition(i), dims, j);
          var t = (v + 1) / 2;
          var col = t < 0.5 ? mix(C.sky, C.petrol, t * 2) : mix(C.petrol, C.gold, (t - 0.5) * 2);
          ctx.fillStyle = col;
          ctx.fillRect(padL + j * cw, padT + i * ch, Math.ceil(cw) + 0.5, Math.ceil(ch) + 0.5);
        }
      }
      for (var hi = 0; hi < rows; hi++) {
        ctx.fillStyle = positionColor(rowPosition(hi));
        ctx.fillRect(padL - 8, padT + hi * ch, 4, Math.ceil(ch) + 0.5);
      }
      ctx.strokeStyle = C.line;
      ctx.strokeRect(padL, padT, w - padL - padR, h - padT - padB);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "right";
      ctx.fillText("0", padL - 4, padT + 8);
      ctx.fillText(String(context - 1), padL - 4, padT + (rows - 1) * ch + ch);
      ctx.textAlign = "center";
      ctx.fillText(DE ? "Dimension" : "dimension", padL + (w - padL - padR) / 2, h - 5);
      if (heatHover && heatHover.row >= 0 && heatHover.col >= 0 && heatHover.row < rows && heatHover.col < cols) {
        var hx = padL + heatHover.col * cw, hy = padT + heatHover.row * ch;
        ctx.save();
        ctx.strokeStyle = C.petrol || C.ink;
        ctx.lineWidth = 1.6;
        ctx.strokeRect(hx + 0.5, hy + 0.5, Math.max(3, cw - 1), Math.max(3, ch - 1));
        ctx.restore();
        var pair = Math.floor(heatHover.col / 2);
        var freq = Math.pow(10000, (2 * pair) / Math.max(2, dims));
        var isSin = heatHover.col % 2 === 0;
        var actualPosition = rowPosition(heatHover.row);
        var val = pe(actualPosition, dims, heatHover.col);
        var lines = [
          L("Zeile: Position ", "row: position ") + actualPosition + L(" (0–100000, gesampelt)", " (0–100000, sampled)"),
          L("Spalte: Dimension ", "column: dimension ") + heatHover.col + L(" (0–63)", " (0–63)"),
          L("Paar ", "pair ") + (pair + 1) + " · " + (isSin ? "sin" : "cos"),
          L("Frequenz ", "frequency ") + freq.toFixed(2),
          (isSin ? "sin(" : "cos(") + actualPosition + " / " + freq.toFixed(2) + ") = " + val.toFixed(3)
        ];
        var tw = 236, th = lines.length * 13 + 10;
        var tx = heatHover.x + 12 + tw > w ? heatHover.x - tw - 10 : heatHover.x + 12;
        var ty = heatHover.y + 12 + th > h ? heatHover.y - th - 10 : heatHover.y + 12;
        tx = Math.max(6, Math.min(w - tw - 6, tx));
        ty = Math.max(6, Math.min(h - th - 6, ty));
        ctx.fillStyle = "rgba(8, 20, 24, .93)";
        ctx.fillRect(tx, ty, tw, th);
        ctx.strokeStyle = C.lineStrong;
        ctx.lineWidth = 1;
        ctx.strokeRect(tx + 0.5, ty + 0.5, tw - 1, th - 1);
        ctx.fillStyle = "#f4fbfd";
        ctx.font = '600 10px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        lines.forEach(function (line, i) { ctx.fillText(line, tx + 7, ty + 6 + i * 13); });
        ctx.textBaseline = "alphabetic";
      }
    }
    var mix = api.util.hexMix;
    function positionColor(p) {
      var t = Math.max(0, Math.min(1, p / Math.max(1, context)));
      return t < 0.5 ? mix(C.blue, C.lilac, t * 2) : mix(C.lilac, C.gold, (t - 0.5) * 2);
    }
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
    function posVec(t) {
      var v = curvePoint(t);
      return metric === "euclid" ? v : unit3(v);
    }
    function syncMetric() {
      metricBtns.forEach(function (b) {
        var on = b.getAttribute("data-pos-metric") === metric;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
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
      if (metric !== "euclid") {
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
      var origin = P([0, 0, 0]);
      function drawToken() {
        ctx.beginPath(); ctx.arc(origin.x, origin.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = Cc.petrol; ctx.fill();
        ctx.strokeStyle = Cc.paper; ctx.lineWidth = 2; ctx.stroke();
        if (api.visual && api.visual.tokenChip) {
          api.visual.tokenChip(ctx, DE ? "Katze" : "cat", origin.x, origin.y - 16, Cc.petrol, Cc, { size: api.font("canvas-sm") });
          ctx.fillStyle = Cc.muted;
          ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(DE ? "Token" : "token", origin.x, origin.y + 20);
          ctx.textBaseline = "alphabetic";
        }
      }
      if (!reveal) {
        drawToken();
        curve.__lsPosition = { pos: pos, trail: [], sweeping: false, metric: metric, start: posVec(0), current: posVec(posAnim), distance: 0, angle: 0 };
        readout.innerHTML = "";
        return;
      }
      trailPoints = [];
      trail.forEach(function (p) {
        var pp = P(posVec(p));
        trailPoints.push({ value: p, x: pp.x, y: pp.y });
      });
      trailPoints.forEach(function (tp) {
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = positionColor(tp.value);
        ctx.globalAlpha = 0.86;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (hoverTrail >= 0 && !trailPoints[hoverTrail]) hoverTrail = -1;
      if (hoverTrail >= 0) {
        var hp = trailPoints[hoverTrail];
        ctx.beginPath(); ctx.arc(hp.x, hp.y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = Cc.gold; ctx.lineWidth = 2; ctx.stroke();
        var hlabel = (DE ? "Katze · Position " : "cat · position ") + hp.value;
        ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 2) + 'px "Open Sans", sans-serif';
        var htw = ctx.measureText(hlabel).width;
        var hlx = Math.max(htw / 2 + 6, Math.min(w - htw / 2 - 6, hp.x));
        var hly = Math.max(12, Math.min(h - 12, hp.y - 12));
        ctx.fillStyle = "rgba(255,255,255,.94)";
        ctx.fillRect(hlx - htw / 2 - 3, hly - 7, htw + 6, 14);
        ctx.fillStyle = Cc.petrol;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(hlabel, hlx, hly);
      }
      ctx.globalAlpha = 1;
      ctx.textBaseline = "alphabetic";
      var startP = posVec(0);
      var curP = posVec(posAnim);
      var sp = P(startP), cp = P(curP);
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
      drawToken();
      var dot = 0, theta = 0, dist = 0;
      if (metric !== "euclid") {
        dot = Math.max(-1, Math.min(1, startP[0] * curP[0] + startP[1] * curP[1] + startP[2] * curP[2]));
        theta = Math.acos(dot);
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
        dist = theta;
      } else {
        dist = Math.hypot(startP[0] - curP[0], startP[1] - curP[1], startP[2] - curP[2]);
        ctx.save();
        ctx.strokeStyle = Cc.gold;
        ctx.lineWidth = 2.4;
        ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(cp.x, cp.y); ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath(); ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2); ctx.fillStyle = Cc.blue; ctx.fill();
      ctx.fillStyle = Cc.blue; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; ctx.textAlign = "left";
      ctx.fillText(DE ? "Start" : "start", sp.x + 7, sp.y - 5);
      var currentColor = positionColor(posAnim);
      ctx.save();
      ctx.shadowColor = "rgba(0,75,111,.45)"; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(cp.x, cp.y, 6, 0, Math.PI * 2); ctx.fillStyle = currentColor; ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.arc(cp.x, cp.y, 6, 0, Math.PI * 2); ctx.strokeStyle = Cc.ink; ctx.lineWidth = 1.5; ctx.stroke();
      var geoLen = dist;
      var angleDeg = theta * 180 / Math.PI;
      curve.__lsPosition = { pos: pos, trail: trail.slice(), sweeping: !!sweep, metric: metric, start: startP, current: curP, distance: geoLen, angle: theta };
      ctx.fillStyle = Cc.muted; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; ctx.textAlign = "left";
      ctx.fillText((DE ? "Position " : "position ") + Math.round(posAnim), 12, 18);
      ctx.textAlign = "left";
      if (hoverTrail >= 0 && trailPoints[hoverTrail]) {
        var hpv = trailPoints[hoverTrail].value;
        var hv = posVec(hpv);
        if (metric === "euclid") {
          var hdist = Math.hypot(startP[0] - hv[0], startP[1] - hv[1], startP[2] - hv[2]);
          readout.innerHTML = '<span>' + (DE ? "Position" : "Position") + ' <b>' + Math.round(hpv) + '</b></span><span>' + (DE ? "Vektor" : "vector") + ' <b>(' + hv.map(function (x) { return x.toFixed(2); }).join(", ") + ')</b></span><span>' + (DE ? "Euklid-Distanz" : "Euclidean distance") + ' <b>' + hdist.toFixed(3) + '</b></span>';
        } else {
          var hdot = Math.max(-1, Math.min(1, startP[0] * hv[0] + startP[1] * hv[1] + startP[2] * hv[2]));
          var htheta = Math.acos(hdot);
          readout.innerHTML = '<span>' + (DE ? "Position" : "Position") + ' <b>' + Math.round(hpv) + '</b></span><span>' + (DE ? "Vektor" : "vector") + ' <b>(' + hv.map(function (x) { return x.toFixed(2); }).join(", ") + ')</b></span><span>' + (DE ? "Bogenlänge" : "arc length") + ' <b>' + htheta.toFixed(3) + '</b></span><span>' + (DE ? "Winkel" : "angle") + ' <b>' + (htheta * 180 / Math.PI).toFixed(1) + '°</b></span>';
        }
      } else {
        readout.innerHTML = "";
      }
    }
    function draw() {
      drawHeat(); drawCurve(); updateHeatCursor();
    }
    function resizeHeat() { heatSize = api.fit(heat, heat); drawHeat(); updateHeatCursor(); }
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
        hoverTrail = -1;
        if (posEl) {
          posEl.value = String(pos);
          posEl.nextElementSibling.textContent = String(pos);
        }
        addTrailTo(pos);
        if (st >= 1) {
          pos = sweep.to; posAnim = pos; addTrailTo(pos);
          sweep = null;
          if (posEl) { posEl.value = String(pos); posEl.nextElementSibling.textContent = String(pos); }
        }
        drawCurve();
        updateHeatCursor();
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
        updateHeatCursor();
      }
    }
    heat.addEventListener("pointermove", function (e) {
      if (!heatSize) return;
      var r = heat.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var padL = 34, padB = 22, padT = 8, padR = 8;
      var cols = Math.min(dims, 64), rows = Math.min(context, 256);
      var cw = (heatSize.w - padL - padR) / cols, ch = (heatSize.h - padT - padB) / rows;
      var col = Math.floor((x - padL) / cw), row = Math.floor((y - padT) / ch);
      if (col < 0 || row < 0 || col >= cols || row >= rows) {
        if (heatHover) { heatHover = null; drawHeat(); }
        return;
      }
      heatHover = { row: row, col: col, x: x, y: y };
      drawHeat();
    });
    heat.addEventListener("pointerleave", function () {
      if (!heatHover) return;
      heatHover = null;
      drawHeat();
    });
    heat.addEventListener("pointerdown", function (e) {
      reveal = true;
      var r = heat.getBoundingClientRect();
      var padL = 34, padT = 8, padB = 22;
      var y = (e.clientY - r.top - padT) / (r.height - padT - padB);
      pos = Math.round(clamp(y, 0, 1) * (Math.min(context, 128) - 1));
      posEl.value = String(pos); posEl.nextElementSibling.textContent = String(pos);
      addTrailTo(pos);
      draw();
    });
    curve.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY }; });
    curve.addEventListener("pointermove", function (e) {
      if (drag) return;
      var r = curve.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var best = -1, bd = 16;
      trailPoints.forEach(function (tp, i) {
        var d = Math.hypot(tp.x - x, tp.y - y);
        if (d < bd) { bd = d; best = i; }
      });
      if (best !== hoverTrail) { hoverTrail = best; drawCurve(); }
    });
    curve.addEventListener("pointerleave", function () {
      if (hoverTrail !== -1) { hoverTrail = -1; drawCurve(); }
    });
    core.canvasTip(curve, function (x, y) {
      var best = null, bd = 18;
      trailPoints.forEach(function (tp) {
        var d = Math.hypot(tp.x - x, tp.y - y);
        if (d < bd) { bd = d; best = tp; }
      });
      if (!best) return L("Kurve der Distanz zwischen Position 0 und der gewählten Position. Fahre über einen Trail-Punkt für seinen Wert.", "Distance curve between position 0 and the selected position. Hover a trail point for its value.");
      return L("Position ", "Position ") + Math.round(best.value) + L(" auf dem Trail. Die Heatmap zeigt Position, Dimension und Sinus-/Kosinuswert; ein Klick auf die Heatmap setzt die Position.", " on the trail. The heatmap shows position, dimension, and sine/cosine value; click the heatmap to set the position.");
    });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return;
      yaw += (e.clientX - drag.x) * 0.008;
      pitch = clamp(pitch + (e.clientY - drag.y) * 0.006, -1.2, 1.2);
      drag.x = e.clientX; drag.y = e.clientY; drawCurve();
    });
    window.addEventListener("pointerup", function () { drag = null; });
    posEl.addEventListener("input", function () { reveal = true; sweep = null; hoverTrail = -1; pos = parseInt(posEl.value, 10); posAnim = pos; addTrailTo(pos); posEl.nextElementSibling.textContent = String(pos); draw(); });
    metricBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        setMetric(b.getAttribute("data-pos-metric") === "euclid" ? "euclid" : "greatcircle");
      });
    });
    syncMetric();
    window.addEventListener("resize", resize);
    function onTheme() { C = api.colors(); draw(); }
    window.addEventListener("tm:theme", onTheme);
    resize();
    raf = requestAnimationFrame(loop);
    function finishSweep() {
      if (!sweep) return;
      reveal = true;
      sweep = null;
      pos = 100000; posAnim = 100000;
      var set = Object.create(null);
      trail.forEach(function (v) { set[v] = 1; });
      for (var tv = 0; tv <= 2000; tv++) set[tv] = 1;
      trail = Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
      addTrailTo(pos);
      if (posEl) { posEl.value = "100000"; posEl.nextElementSibling.textContent = "100000"; }
      draw();
    }
    function setMetric(nextMetric) {
      metric = nextMetric === "euclid" ? "euclid" : "greatcircle";
      syncMetric();
      drawCurve();
    }
    function resetToStart() {
      sweep = null;
      reveal = true;
      pos = 0;
      posAnim = 0;
      hoverTrail = -1;
      trail = [];
      addTrailTo(0);
      if (posEl) { posEl.value = "0"; posEl.nextElementSibling.textContent = "0"; }
      draw();
    }
    function startSweep() {
      if (pos >= 100000) return false;
      reveal = true;
      sweep = { from: pos, to: 100000, start: performance.now(), duration: 5000 };
      drawCurve();
      return true;
    }
    function next() {
      if (sweep) { finishSweep(); return true; }
      if (!reveal) {
        resetToStart();
        return startSweep();
      }
      if (metric === "greatcircle") {
        if (pos < 100000) return startSweep();
        setMetric("euclid");
        resetToStart();
        return startSweep();
      }
      if (pos < 100000) return startSweep();
      return false;
    }
    function prev() {
      if (sweep) { sweep = null; return true; }
      if (pos > 0) { reveal = true; pos = 0; posAnim = 0; addTrailTo(0); if (posEl) { posEl.value = "0"; posEl.nextElementSibling.textContent = "0"; } draw(); return true; }
      return false;
    }
    return {
      update: function () {},
      busy: function () { return !!sweep; },
      speedUp: function () {
        if (!sweep) return false;
        var now = performance.now();
        sweep.from = pos;
        sweep.start = now;
        sweep.duration = 140;
        return true;
      },
      finish: finishSweep,
      next: next,
      prev: function () { return false; },
      hasNext: function () { return !(metric === "euclid" && pos >= 100000); },
      hasPrev: function () { return false; },
      onKey: function (e) { return api.util.arrowKey(e, next, prev); },
      pause: function () { cancelAnimationFrame(raf); raf = 0; },
      resume: function () { if (!raf) raf = requestAnimationFrame(loop); },
      resize: resize,
      destroy: function () { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("tm:theme", onTheme); el.remove(); }
    };
  }

  core.register("position", positionScene);
})();
