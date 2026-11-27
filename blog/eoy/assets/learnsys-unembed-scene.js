(function () {
  "use strict";

  window.UnembedScene = function (root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var el = document.createElement("div");
    el.className = "ls-sim-scene";
    el.innerHTML =
      '<div class="ls-sim-tabs" role="tablist">' +
        '<button type="button" class="ls-sim-tab is-on" data-mode="directions" role="tab" aria-selected="true">' + (DE ? "Richtungen" : "Directions") + '</button>' +
        '<button type="button" class="ls-sim-tab" data-mode="scale" role="tab" aria-selected="false">' + (DE ? "Skaleninvarianz" : "Scale invariance") + '</button>' +
        '<button type="button" class="ls-sim-tab" data-mode="unembed" role="tab" aria-selected="false">Unembedding</button>' +
      '</div>' +
      '<div class="ls-sim-stage"><canvas class="ls-sim-canvas" role="img"></canvas></div>' +
      '<div class="ls-sim-controls ls-sim-map-controls">' +
        '<label class="ls-sim-pick">' + (DE ? "Wort" : "Word") + ' <select class="ls-sim-select"></select></label>' +
        '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-sim-pause">' + (DE ? "Drehung stoppen" : "Stop rotation") + '</button>' +
      '</div>' +
      '<div class="ls-sim-controls ls-sim-scale-controls" hidden>' +
        '<label class="ls-range">' + (DE ? "Länge von B" : "Magnitude of B") + ' <input type="range" class="ls-sim-scale" min="0.08" max="1.05" step="0.01" value="0.40"><output>0.40</output></label>' +
      '</div>' +
      '<div class="ls-sim-controls ls-sim-unembed-controls" hidden><button type="button" class="ls-btn ls-btn--tiny ls-sim-next-angle">' + (DE ? "Nächster Winkel" : "Next angle") + '</button><div class="ls-sim-unembed-list" hidden></div></div>' +
      '<div class="ls-sim-readout" aria-live="polite"></div>' +
      '<p class="ls-sim-caption"></p>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-sim-stage");
    var canvas = el.querySelector("canvas");
    var select = el.querySelector(".ls-sim-select");
    var tabBtns = Array.prototype.slice.call(el.querySelectorAll(".ls-sim-tab"));
    var mapControls = el.querySelector(".ls-sim-map-controls");
    var pauseBtn = el.querySelector(".ls-sim-pause");
    var angleControls = el.querySelector(".ls-sim-angle-controls");
    var scaleControls = el.querySelector(".ls-sim-scale-controls");
    var angleAInput = el.querySelector(".ls-sim-angle-a");
    var angleBInput = el.querySelector(".ls-sim-angle-b");
    var angleAOut = angleAInput ? angleAInput.nextElementSibling : null;
    var angleBOut = angleBInput ? angleBInput.nextElementSibling : null;
    var scaleInput = el.querySelector(".ls-sim-scale");
    var scaleOut = scaleInput ? scaleInput.nextElementSibling : null;
    var unembedControls = el.querySelector(".ls-sim-unembed-controls");
    var unembedList = el.querySelector(".ls-sim-unembed-list");
    var nextAngleBtn = el.querySelector(".ls-sim-next-angle");
    var unembedRaf = 0, unembedStart = 0;
    var unembedFocus = -1, unembedPinned = -1, unembedStep = -1;
    var UN_ANGLE = -10 * Math.PI / 180;
    var UN_TOKENS = [
      { t: " the", a: -28 }, { t: " Paris", a: 2 }, { t: " a", a: 34 },
      { t: " city", a: 72 }, { t: " France", a: -55 }, { t: " sky", a: 128 },
      { t: " blue", a: 155 }, { t: " river", a: 205 }
    ];
    var readout = el.querySelector(".ls-sim-readout");
    var caption = el.querySelector(".ls-sim-caption");
    var size = null;
    var selected = 0;
    var mode = "directions";
    var yaw = -0.55, pitch = 0.33;
    var dirRaf = 0, dirLast = 0, dirPaused = false;
    var dragging = false, dragMoved = false, lastPX = 0, lastPY = 0;
    var angleA = 360, angleB = 90, scaleMag = 0.40;
    var scaleIndex = 0, scaleRaf = 0;
    var SCALE_VALUES = [0.08, 0.2, 0.4, 0.62, 0.85, 1.05];
    var hits = [];
    var C = api.colors();
    var clamp = api.util.clamp;
    function ease(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

    var WORDS = [
      { w: "König", e: "king", x: 0.26, y: 0.22, z: 0.68, c: "royal" },
      { w: "Königin", e: "queen", x: 0.10, y: 0.34, z: 0.66, c: "royal" },
      { w: "Prinz", e: "prince", x: 0.42, y: 0.34, z: 0.58, c: "royal" },
      { w: "Prinzessin", e: "princess", x: 0.30, y: 0.48, z: 0.74, c: "royal" },
      { w: "Krone", e: "crown", x: 0.58, y: 0.10, z: 1.02, c: "royal" },
      { w: "Schloss", e: "castle", x: 0.48, y: 0.52, z: 0.48, c: "royal" },
      { w: "Thron", e: "throne", x: 0.64, y: 0.30, z: 0.60, c: "royal" },

      { w: "Paris", e: "Paris", x: -0.54, y: 0.62, z: 0.30, c: "city" },
      { w: "Berlin", e: "Berlin", x: -0.68, y: 0.44, z: 0.22, c: "city" },
      { w: "London", e: "London", x: -0.42, y: 0.48, z: 0.36, c: "city" },
      { w: "Rom", e: "Rome", x: -0.62, y: 0.72, z: 0.16, c: "city" },
      { w: "Wien", e: "Vienna", x: -0.78, y: 0.58, z: 0.20, c: "city" },
      { w: "Madrid", e: "Madrid", x: -0.36, y: 0.74, z: 0.28, c: "city" },

      { w: "Hund", e: "dog", x: 0.62, y: -0.12, z: -0.34, c: "animal" },
      { w: "Katze", e: "cat", x: 0.78, y: -0.02, z: -0.30, c: "animal" },
      { w: "Maus", e: "mouse", x: 0.58, y: -0.30, z: -0.42, c: "animal" },
      { w: "Vogel", e: "bird", x: 0.80, y: -0.26, z: -0.22, c: "animal" },
      { w: "Fisch", e: "fish", x: 0.66, y: -0.44, z: -0.50, c: "animal" },
      { w: "Pferd", e: "horse", x: 0.46, y: -0.02, z: -0.18, c: "animal" },

      { w: "Baum", e: "tree", x: -0.58, y: -0.42, z: -0.28, c: "nature" },
      { w: "Fluss", e: "river", x: -0.76, y: -0.56, z: -0.36, c: "nature" },
      { w: "Berg", e: "mountain", x: -0.40, y: -0.58, z: -0.16, c: "nature" },
      { w: "Meer", e: "sea", x: -0.66, y: -0.72, z: -0.44, c: "nature" },
      { w: "Wald", e: "forest", x: -0.30, y: -0.40, z: -0.20, c: "nature" },
      { w: "Sonne", e: "sun", x: -0.48, y: -0.74, z: -0.08, c: "nature" },

      { w: "Python", e: "Python", x: 0.02, y: -0.48, z: 0.10, c: "code" },
      { w: "Java", e: "Java", x: 0.20, y: -0.62, z: 0.16, c: "code" },
      { w: "Code", e: "code", x: -0.02, y: -0.70, z: 0.02, c: "code" },
      { w: "Funktion", e: "function", x: 0.32, y: -0.54, z: 0.22, c: "code" },
      { w: "Variable", e: "variable", x: 0.12, y: -0.78, z: 0.08, c: "code" },
      { w: "Schleife", e: "loop", x: 0.36, y: -0.74, z: 0.20, c: "code" },

      { w: "Computer", e: "computer", x: -0.52, y: 0.08, z: 0.44, c: "tech" },
      { w: "GPU", e: "GPU", x: -0.70, y: 0.22, z: 0.52, c: "tech" },
      { w: "Chip", e: "chip", x: -0.34, y: 0.20, z: 0.38, c: "tech" },
      { w: "Netz", e: "network", x: -0.62, y: -0.02, z: 0.46, c: "tech" },
      { w: "Daten", e: "data", x: -0.40, y: 0.02, z: 0.34, c: "tech" },
      { w: "Modell", e: "model", x: -0.74, y: -0.16, z: 0.50, c: "tech" }
    ];

    WORDS.forEach(function (w, i) {
      var option = document.createElement("option");
      option.value = String(i);
      option.textContent = DE ? w.w : w.e;
      select.appendChild(option);
    });
    selected = 0;

    function word(w) { return DE ? w.w : w.e; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    function norm(a) { return Math.sqrt(dot(a, a)); }
    function vec(w) { return [w.x, w.y, w.z]; }
    function cosine(a, b) { return dot(a, b) / ((norm(a) * norm(b)) || 1); }
    function distance(a, b) {
      var dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    function unit3(v) {
      var n = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
      return [v[0] / n, v[1] / n, v[2] / n];
    }
    function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    function proj3(p, cx, cy, R) { return V.project(p, yaw, pitch, R, cx, cy); }
    function slerp3(a, b, t) {
      var d = Math.acos(clamp(dot3(a, b), -1, 1));
      if (d < 1e-5) return a.slice();
      var sd = Math.sin(d);
      var wa = Math.sin((1 - t) * d) / sd;
      var wb = Math.sin(t * d) / sd;
      return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb];
    }
    function sphereWire(ctx, cx, cy, R, color) {
      var lat, lon, pts, p, i;
      for (lat = -60; lat <= 60; lat += 30) {
        pts = [];
        for (lon = 0; lon <= 360; lon += 12) {
          var la = lat * Math.PI / 180, lo = lon * Math.PI / 180;
          pts.push([Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)]);
        }
        ctx.beginPath();
        for (i = 0; i < pts.length; i++) {
          p = proj3(pts[i], cx, cy, R);
          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = V.alpha(color, lat === 0 ? 0.34 : 0.2);
        ctx.lineWidth = lat === 0 ? 1.3 : 0.9;
        ctx.stroke();
      }
      for (lon = 0; lon < 180; lon += 30) {
        pts = [];
        for (lat = -90; lat <= 90; lat += 12) {
          var la2 = lat * Math.PI / 180, lo2 = lon * Math.PI / 180;
          pts.push([Math.cos(la2) * Math.cos(lo2), Math.cos(la2) * Math.sin(lo2), Math.sin(la2)]);
        }
        ctx.beginPath();
        for (i = 0; i < pts.length; i++) {
          p = proj3(pts[i], cx, cy, R);
          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = V.alpha(color, 0.18);
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
    }
    function drawDirections() {
      if (!size) return;
      C = api.colors();
      var ctx = size.ctx, w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w * 0.33, cy = h * 0.53, R = Math.min(w * 0.235, h * 0.33);
      if (R < 30) return;
      var q = WORDS[selected];
      var qv = unit3(vec(q));
      var rows = [];
      WORDS.forEach(function (ww, i) {
        if (i === selected) return;
        var wv = unit3(vec(ww));
        var cos = clamp(dot3(qv, wv), -1, 1);
        var ad = Math.acos(cos);
        rows.push({ i: i, w: ww, v: wv, cos: cos, ad: ad, deg: ad * 180 / Math.PI });
      });
      rows.sort(function (a, b) { return a.ad - b.ad; });
      var top = rows.slice(0, 5);
      var topIds = top.map(function (t) { return t.i; });

      sphereWire(ctx, cx, cy, R, C.petrol);

      var pts = WORDS.map(function (ww, i) {
        var p = proj3(unit3(vec(ww)), cx, cy, R);
        return { i: i, w: ww, x: p.x, y: p.y, z: p.z };
      }).filter(function (pt) {
        return pt.i === selected || topIds.indexOf(pt.i) >= 0;
      }).sort(function (a, b) { return a.z - b.z; });

      hits = [];
      pts.forEach(function (pt) {
        var isSel = pt.i === selected;
        var isTop = topIds.indexOf(pt.i) >= 0;
        ctx.save();
        ctx.globalAlpha = isSel ? 1 : 0.9;
        ctx.strokeStyle = isSel ? C.green : C.gold;
        ctx.lineWidth = isSel ? 2.8 : 1.7;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isSel ? 5.0 : 3.6, 0, Math.PI * 2);
        ctx.fillStyle = isSel ? C.green : C.gold;
        ctx.fill();
        if (isSel || isTop) {
          ctx.strokeStyle = C.paper;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        hits.push({ x: pt.x, y: pt.y, i: pt.i });
        if (isSel || isTop) drawRayLabel(word(pt.w), pt.x, pt.y, cx, cy, w, h, isSel, w * 0.63);
      });

      // A short and a long green vector in the same direction: the angle stays 0°.
      var longP = proj3(qv, cx, cy, R);
      var shortP = proj3([qv[0] * 0.56, qv[1] * 0.56, qv[2] * 0.56], cx, cy, R);
      V.arrow(ctx, cx, cy, shortP.x, shortP.y, C.green, 3.2, 7);
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = V.alpha(C.green, 0.55);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(shortP.x, shortP.y);
      ctx.lineTo(longP.x, longP.y);
      ctx.stroke();
      ctx.restore();
      V.arrow(ctx, cx, cy, longP.x, longP.y, V.alpha(C.green, 0.72), 1.8, 6);
      ctx.fillStyle = C.green;
      ctx.font = '700 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(DE ? "gleiche Richtung · 0° · Länge egal für den Winkel" : "same direction · 0° · length irrelevant for the angle", Math.min(shortP.x + 8, w * 0.62 - 150), shortP.y + 12);

      top.slice(0, 3).forEach(function (t, k) {
        var ptsArc = [];
        for (var i = 1; i < 10; i++) {
          var p = proj3(slerp3(qv, t.v, i / 10), cx, cy, R);
          ptsArc.push(p);
        }
        ctx.beginPath();
        ptsArc.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
        ctx.strokeStyle = V.alpha(C.gold, k === 0 ? 0.9 : 0.62);
        ctx.lineWidth = k === 0 ? 2.1 : 1.4;
        ctx.stroke();
        var mid = proj3(slerp3(qv, t.v, 0.5), cx, cy, R);
        ctx.fillStyle = C.gold;
        ctx.font = '700 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(Math.round(t.deg) + "°", mid.x, mid.y - 7);
      });

      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + Math.max(12, api.font("canvas") * .9) + 'px "Barlow", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(DE ? "3D-Kugel der Richtungen" : "3D sphere of directions", 18, 28);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "Winkel = Kosinus-Ähnlichkeit · normalisierte Richtungen · ziehen zum Drehen" : "angle = cosine similarity · normalised directions · drag to rotate", 18, 45);

      var bx = w * .64, by = 64, bw = w - bx - 18;
      ctx.textAlign = "left";
      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + Math.max(10, api.font("canvas-sm")) + 'px "Barlow", sans-serif';
      ctx.fillText(DE ? "nächste Richtungen" : "nearest directions", bx, 28);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "größter Kosinus zuerst" : "largest cosine first", bx, 44);
      top.forEach(function (t, i) {
        var y = by + i * Math.min(28, (h - by - 20) / top.length);
        ctx.fillStyle = i === 0 ? C.green : C.ink;
        ctx.font = '600 ' + Math.max(9, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(word(t.w), bx, y);
        ctx.fillStyle = C.gold;
        ctx.textAlign = "right";
        ctx.fillText(Math.round(t.deg) + "°", bx + bw, y);
        ctx.fillStyle = C.muted;
        ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 2) + 'px "Open Sans", sans-serif';
        ctx.fillText("cos " + t.cos.toFixed(2), bx + bw, y + 13);
        if (i < 4) {
          ctx.strokeStyle = C.line;
          ctx.globalAlpha = .5;
          ctx.beginPath();
          ctx.moveTo(bx, y + 19);
          ctx.lineTo(bx + bw, y + 19);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });
      var topRow = top[0];
      readout.innerHTML = '<span>' + (DE ? "Wort" : "word") + ' <b>' + word(q) + '</b></span><span>' + (DE ? "nächste Richtung" : "nearest direction") + ' <b>' + word(topRow.w) + ' · ' + Math.round(topRow.deg) + '°</b></span><span>cos <b>' + topRow.cos.toFixed(2) + '</b></span>';
      caption.textContent = DE ? "Die Kugel ist eine schematische 3D-Projektion von Wortrichtungen. Der Winkel ist die Ähnlichkeit; ein kurzer und ein langer Vektor in dieselbe Richtung haben 0°, ein Punkt daneben hat einen größeren Winkel." : "The sphere is a schematic 3D projection of word directions. The angle is the similarity; a short and a long vector in the same direction have 0°, while a point off the line has a larger angle.";
      caption.setAttribute("data-caption-mode", "directions");
      canvas.setAttribute("aria-label", DE ? "3D-Kugel schematischer Wortrichtungen; der grüne Vektor ist das gewählte Wort, die Winkel zu den nächsten Richtungen stehen daneben." : "3D sphere of schematic word directions; the green vector is the chosen word, with angles to the nearest directions.");
    }

    function circleScene() {
      var ctx = size.ctx, w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, h);
      var cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.35;
      ctx.strokeStyle = C.line; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.moveTo(cx - r * 1.15, cy); ctx.lineTo(cx + r * 1.15, cy); ctx.moveTo(cx, cy - r * 1.15); ctx.lineTo(cx, cy + r * 1.15); ctx.stroke(); ctx.globalAlpha = 1;
      return { ctx: ctx, w: w, h: h, cx: cx, cy: cy, r: r };
    }
    function drawAngle() {
      var s = circleScene(), ctx = s.ctx, cx = s.cx, cy = s.cy, r = s.r;
      var a = angleA * Math.PI / 180, b = angleB * Math.PI / 180;
      var ax = cx + Math.cos(a) * r, ay = cy - Math.sin(a) * r;
      var bx = cx + Math.cos(b) * r, by = cy - Math.sin(b) * r;
      var diff = b - a;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r * 0.38, -a, -b, diff > 0); ctx.closePath();
      ctx.fillStyle = V.alpha(C.gold, 0.18); ctx.fill();
      ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; ctx.stroke();
      V.arrow(ctx, cx, cy, ax, ay, C.blue, 3);
      V.arrow(ctx, cx, cy, bx, by, C.green, 3);
      var mid = a + diff / 2;
      var lx = cx + Math.cos(mid) * r * 0.46, ly = cy - Math.sin(mid) * r * 0.46;
      ctx.fillStyle = C.gold; ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(Math.round(Math.abs(diff) * 180 / Math.PI) + "°", lx, ly);
      ctx.fillStyle = C.blue; ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillText("A", ax + 6, ay - 3);
      ctx.fillStyle = C.green; ctx.fillText("B", bx + 6, by - 3);
      ctx.fillStyle = C.petrol; ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif'; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillText(DE ? "Winkel als Ähnlichkeit" : "Angle as similarity", 18, 28);
      var dotv = Math.cos(a - b);
      var stat = dotv > 0.9 ? (DE ? "sehr ähnlich" : "very similar") : dotv > 0.1 ? (DE ? "verwandt" : "related") : dotv > -0.1 ? (DE ? "neutral" : "neutral") : (DE ? "entgegengesetzt" : "opposite");
      readout.innerHTML = '<span>Vector A <b>[' + Math.cos(a).toFixed(2) + ', ' + Math.sin(a).toFixed(2) + ']</b></span><span>Vector B <b>[' + Math.cos(b).toFixed(2) + ', ' + Math.sin(b).toFixed(2) + ']</b></span><span>Dot <b>' + dotv.toFixed(3) + '</b></span><span><b>' + stat + '</b></span>';
      caption.textContent = DE ? "Der Winkel ist die Ähnlichkeit der Richtungen. Dot nahe 1: ähnlich; nahe 0: neutral; negativ: entgegengesetzt. Das ist eine Interpretation der gezeigten Richtungen, kein Wahrheitsbeweis." : "The angle is the similarity of directions. Dot near 1: similar; near 0: neutral; negative: opposite. This is an interpretation of the shown directions, not a proof of truth.";
      caption.setAttribute("data-caption-mode", "angle");
    }
    function dirLoop(now) {
      if (mode !== "directions" || api.reducedMotion || dirPaused) { dirRaf = 0; return; }
      if (!dragging && now - dirLast > 40) {
        yaw += 0.006;
        drawDirections();
        dirLast = now;
      }
      dirRaf = requestAnimationFrame(dirLoop);
    }
    function syncPauseBtn() {
      if (!pauseBtn) return;
      pauseBtn.textContent = dirPaused ? (DE ? "Drehung starten" : "Start rotation") : (DE ? "Drehung stoppen" : "Stop rotation");
      pauseBtn.setAttribute("aria-pressed", dirPaused ? "true" : "false");
    }
    function ensureDirLoop() {
      if (mode === "directions" && !dirRaf && !api.reducedMotion && !dirPaused) {
        dirLast = performance.now();
        dirRaf = requestAnimationFrame(dirLoop);
      } else if (mode !== "directions" && dirRaf) {
        cancelAnimationFrame(dirRaf);
        dirRaf = 0;
      }
    }
    function animateScale(target) {
      if (scaleRaf) cancelAnimationFrame(scaleRaf);
      var from = scaleMag, started = performance.now();
      function frame(now) {
        var t = Math.min(1, (now - started) / 320);
        var e = 1 - Math.pow(1 - t, 3);
        scaleMag = from + (target - from) * e;
        if (scaleInput) scaleInput.value = String(scaleMag);
        if (scaleOut) scaleOut.textContent = scaleMag.toFixed(2);
        drawScale();
        if (t < 1) scaleRaf = requestAnimationFrame(frame);
        else { scaleMag = target; scaleRaf = 0; if (scaleInput) scaleInput.value = String(target); if (scaleOut) scaleOut.textContent = target.toFixed(2); drawScale(); }
      }
      scaleRaf = requestAnimationFrame(frame);
    }

    function drawScale() {
      var w = size.w, h = size.h, ctx = size.ctx;
      var cx = w * 0.47, cy = h * 0.56;
      var R = Math.min(w * 0.29, h * 0.36);
      var aA = 25 * Math.PI / 180;
      var aB = 75 * Math.PI / 180;
      var magA = 0.62, magB = scaleMag;
      var lenA = R * magA, lenB = R * magB;
      var ax = cx + Math.cos(aA) * lenA, ay = cy - Math.sin(aA) * lenA;
      var bx = cx + Math.cos(aB) * lenB, by = cy - Math.sin(aB) * lenB;
      var angleDeg = (aB - aA) * 180 / Math.PI;
      ctx.clearRect(0, 0, w, h);
      var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.72);
      glow.addColorStop(0, V.alpha(C.blue, 0.08));
      glow.addColorStop(0.45, V.alpha(C.green, 0.025));
      glow.addColorStop(1, V.alpha(C.paper, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      var goldGlow = ctx.createRadialGradient(cx + R * 0.2, cy - R * 0.55, 0, cx + R * 0.2, cy - R * 0.55, R * 0.8);
      goldGlow.addColorStop(0, V.alpha(C.gold, 0.05));
      goldGlow.addColorStop(1, V.alpha(C.gold, 0));
      ctx.fillStyle = goldGlow;
      ctx.fillRect(0, 0, w, h);
      function rr(x, y, ww, hh, rad) {
        var r0 = Math.min(rad, ww / 2, hh / 2);
        ctx.beginPath();
        ctx.moveTo(x + r0, y);
        ctx.lineTo(x + ww - r0, y);
        ctx.quadraticCurveTo(x + ww, y, x + ww, y + r0);
        ctx.lineTo(x + ww, y + hh - r0);
        ctx.quadraticCurveTo(x + ww, y + hh, x + ww - r0, y + hh);
        ctx.lineTo(x + r0, y + hh);
        ctx.quadraticCurveTo(x, y + hh, x, y + hh - r0);
        ctx.lineTo(x, y + r0);
        ctx.quadraticCurveTo(x, y, x + r0, y);
        ctx.closePath();
      }
      function pill(text, x, y, color, fs) {
        var sizePx = fs || Math.max(8, api.font("canvas-sm") - 1);
        ctx.font = '700 ' + sizePx + 'px "Barlow", "Open Sans", sans-serif';
        var tw = ctx.measureText(text).width;
        var pw = tw + 16, ph = sizePx + 11;
        var px = Math.max(8, Math.min(w - pw - 8, x - pw / 2));
        var py = Math.max(8, Math.min(h - ph - 8, y - ph / 2));
        ctx.fillStyle = V.alpha(C.paper, 0.88);
        rr(px, py, pw, ph, ph / 2);
        ctx.fill();
        ctx.strokeStyle = V.alpha(color, 0.55);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, px + pw / 2, py + ph / 2 + 0.5);
      }
      function halo(x, y, color, radius) {
        var hg = ctx.createRadialGradient(x, y, 0, x, y, radius * 4.2);
        hg.addColorStop(0, V.alpha(color, 0.55));
        hg.addColorStop(0.35, V.alpha(color, 0.18));
        hg.addColorStop(1, V.alpha(color, 0));
        ctx.fillStyle = hg;
        ctx.beginPath(); ctx.arc(x, y, radius * 4.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = V.alpha(C.paper, 0.9);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.save();
      ctx.strokeStyle = V.alpha(C.line, 0.75);
      ctx.lineWidth = 1;
      for (var sIdx = 0; sIdx < 12; sIdx++) {
        var ang = sIdx * Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * R * 0.12, cy - Math.sin(ang) * R * 0.12);
        ctx.lineTo(cx + Math.cos(ang) * R, cy - Math.sin(ang) * R);
        ctx.stroke();
      }
      [0.34, 0.67, 1].forEach(function (rad) {
        ctx.strokeStyle = V.alpha(rad === 1 ? C.lineStrong : C.line, rad === 1 ? 0.55 : 0.55);
        ctx.lineWidth = rad === 1 ? 1.4 : 1;
        ctx.beginPath(); ctx.arc(cx, cy, R * rad, 0, Math.PI * 2); ctx.stroke();
      });
      for (var tIdx = 0; tIdx < 24; tIdx++) {
        var ta = tIdx * Math.PI / 12;
        var tr0 = R * 0.985, tr1 = R * (tIdx % 2 ? 0.955 : 0.94);
        ctx.strokeStyle = V.alpha(C.lineStrong, 0.38);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ta) * tr0, cy - Math.sin(ta) * tr0);
        ctx.lineTo(cx + Math.cos(ta) * tr1, cy - Math.sin(ta) * tr1);
        ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(DE ? "Einheitskreis" : "unit circle", cx, cy - R - 6);
      ctx.restore();
      ctx.save();
      ctx.fillStyle = V.alpha(C.blue, 0.05);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = V.alpha(C.petrol, 0.55);
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.30, -aA, -aB, true);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.40, -aA, -aB, true);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      var wedge = ctx.createLinearGradient(cx, cy, cx + Math.cos((aA + aB) / 2) * R * 0.6, cy - Math.sin((aA + aB) / 2) * R * 0.6);
      wedge.addColorStop(0, V.alpha(C.gold, 0.02));
      wedge.addColorStop(1, V.alpha(C.gold, 0.24));
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.40, -aA, -aB, true);
      ctx.arc(cx, cy, R * 0.30, -aB, -aA, false);
      ctx.closePath();
      ctx.fillStyle = wedge;
      ctx.fill();
      ctx.strokeStyle = V.alpha(C.gold, 0.65);
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = V.alpha(C.blue, 0.30);
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(cx + Math.cos(aA) * R, cy - Math.sin(aA) * R);
      ctx.stroke();
      ctx.strokeStyle = V.alpha(C.green, 0.30);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(cx + Math.cos(aB) * R, cy - Math.sin(aB) * R);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = V.alpha(C.blue, 0.55);
      ctx.beginPath(); ctx.arc(cx + Math.cos(aA) * R, cy - Math.sin(aA) * R, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = V.alpha(C.green, 0.55);
      ctx.beginPath(); ctx.arc(cx + Math.cos(aB) * R, cy - Math.sin(aB) * R, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = V.alpha(C.blue, 0.75);
      ctx.shadowBlur = 20;
      V.arrow(ctx, cx, cy, ax, ay, C.blue, 3.6, 9);
      ctx.restore();
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = V.alpha(C.green, 0.75);
      ctx.shadowBlur = 20;
      V.arrow(ctx, cx, cy, bx, by, C.green, 3.6, 9);
      ctx.restore();
      halo(ax, ay, C.blue, 4.6);
      halo(bx, by, C.green, magB < 0.2 ? 4.2 : 4.6);
      ctx.save();
      ctx.strokeStyle = V.alpha(C.gold, 0.42);
      ctx.lineWidth = 1.1;
      ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      ctx.restore();
      pill("A", ax + Math.cos(aA) * 18, ay - Math.sin(aA) * 18, C.blue);
      pill("B", bx + Math.cos(aB) * 18, by - Math.sin(aB) * 18, C.green);
      var midAng = (aA + aB) / 2;
      pill(Math.round(angleDeg) + "°", cx + Math.cos(midAng) * R * 0.35, cy - Math.sin(midAng) * R * 0.35, C.gold);
      var tpx = 16, tpy = 14, tpw = Math.min(300, w * 0.56), tph = 60;
      ctx.save();
      ctx.fillStyle = V.alpha(C.paper, 0.78);
      rr(tpx, tpy, tpw, tph, 10);
      ctx.fill();
      ctx.strokeStyle = V.alpha(C.lineStrong, 0.22);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = C.gold;
      ctx.font = '700 ' + Math.max(8, api.font("canvas-sm") - 2) + 'px "Barlow", sans-serif';
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillText(DE ? "SKALENINVARIANZ" : "SCALE INVARIANCE", tpx + 14, tpy + 18);
      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + Math.max(15, Math.min(21, w * 0.022)) + 'px "Barlow", sans-serif';
      ctx.fillText(DE ? "Länge vs. Richtung" : "Length vs. direction", tpx + 14, tpy + 39);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "Richtung bleibt · Länge verändert die Distanz" : "Direction stays · length changes the distance", tpx + 14, tpy + 53);
      ctx.restore();
      var dx = Math.cos(aB) * magB - Math.cos(aA) * magA;
      var dy = Math.sin(aB) * magB - Math.sin(aA) * magA;
      var dist = Math.hypot(dx, dy);
      readout.innerHTML = '<span>|A| <b>' + magA.toFixed(2) + '</b></span><span>|B| <b>' + magB.toFixed(2) + '</b></span><span>' + (DE ? "Winkel" : "angle") + ' <b>' + Math.round(angleDeg) + '.0°</b></span><span>|A−B| <b>' + dist.toFixed(3) + '</b></span><span>Cos <b>' + Math.cos(aB - aA).toFixed(3) + '</b></span>';
      caption.textContent = DE ? "A und B zeigen in verschiedene Richtungen. Wenn du B länger machst, ändert sich die euklidische Distanz |A−B|, aber nicht der Winkel. Für den Winkel zählen nur die Richtungen; im Logit zählt auch die Länge." : "A and B point in different directions. Making B longer changes the Euclidean distance |A−B|, but not the angle. For the angle only the directions count; in the logit the length also counts.";
      caption.setAttribute("data-caption-mode", "scale");
    }
    function unembedData() {
      return UN_TOKENS.map(function (tok) {
        var d = tok.a * Math.PI / 180 - UN_ANGLE;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        return { t: tok.t, a: tok.a, diff: d, cos: Math.cos(d) };
      }).sort(function (a, b) { return Math.abs(a.diff) - Math.abs(b.diff); });
    }
    function updateAngleList() {
      if (!unembedList) return;
      unembedList.querySelectorAll("[data-angle-i]").forEach(function (btn) {
        var i = parseInt(btn.getAttribute("data-angle-i"), 10);
        btn.classList.toggle("is-on", i === unembedFocus);
        btn.setAttribute("aria-pressed", String(i === unembedPinned));
      });
    }
    function settleUnembed() {
      if (unembedRaf) { cancelAnimationFrame(unembedRaf); unembedRaf = 0; }
      unembedStart = performance.now() - 4000;
    }
    function setUnembedFocus(i) {
      unembedFocus = i;
      settleUnembed();
      updateAngleList();
      drawUnembed(performance.now());
    }
    function stepUnembed(dir) {
      var rows = unembedData();
      if (!rows.length) return false;
      var from = unembedStep < 0 ? (dir > 0 ? -1 : 0) : unembedStep;
      var next = from + dir;
      if (next < 0 || next >= rows.length) return false;
      unembedStep = next;
      unembedPinned = next;
      setUnembedFocus(next);
      return true;
    }
    function renderUnembedList() {
      if (!unembedList) return;
      var rows = unembedData();
      unembedList.innerHTML = rows.map(function (row, i) {
        var deg = Math.round(Math.abs(row.diff) * 180 / Math.PI);
        return '<button type="button" class="ls-un-angle" data-angle-i="' + i + '"><b>' + api.esc(row.t.trim()) + '</b><span>' + deg + '°</span></button>';
      }).join("");
      unembedList.querySelectorAll("[data-angle-i]").forEach(function (btn) {
        var i = parseInt(btn.getAttribute("data-angle-i"), 10);
        btn.addEventListener("mouseenter", function () { if (unembedPinned < 0) setUnembedFocus(i); });
        btn.addEventListener("focus", function () { if (unembedPinned < 0) setUnembedFocus(i); });
        btn.addEventListener("mouseleave", function () { if (unembedPinned < 0) setUnembedFocus(-1); });
        btn.addEventListener("blur", function () { if (unembedPinned < 0) setUnembedFocus(-1); });
        btn.addEventListener("click", function () {
          unembedPinned = unembedPinned === i ? -1 : i;
          if (unembedPinned >= 0) unembedStep = unembedPinned;
          setUnembedFocus(unembedPinned);
        });
      });
      updateAngleList();
      requestAnimationFrame(function () { resize(); });
    }
    function roundPath(c, x, y, w, h, r) {
      var rad = Math.min(r, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + rad, y);
      c.lineTo(x + w - rad, y);
      c.quadraticCurveTo(x + w, y, x + w, y + rad);
      c.lineTo(x + w, y + h - rad);
      c.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
      c.lineTo(x + rad, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - rad);
      c.lineTo(x, y + rad);
      c.quadraticCurveTo(x, y, x + rad, y);
      c.closePath();
    }
    function drawRayLabel(text, x, y, cx, cy, w, h, active, maxX, top) {
      var c = size.ctx;
      var dx = x - cx, dy = y - cy, len = Math.hypot(dx, dy) || 1;
      var ux = dx / len, uy = dy / len;
      var fs = Math.max(8, api.font("canvas-sm") - 1);
      c.font = '600 ' + fs + 'px "Open Sans", sans-serif';
      var tw = c.measureText(text).width;
      var pw = tw + 24, ph = fs + 11;
      var rawX = x + ux * 16;
      var px = ux >= 0 ? rawX : rawX - pw;
      px = Math.max(8, Math.min(maxX - pw, px));
      var py = Math.max(8, Math.min(h - ph - 8, y + uy * 16 - ph / 2));
      c.save();
      c.shadowColor = V.alpha(C.petrol, 0.10);
      c.shadowBlur = 9;
      c.shadowOffsetY = 2;
      c.fillStyle = V.alpha(C.paper, 0.92);
      roundPath(c, px, py, pw, ph, ph / 2);
      c.fill();
      c.restore();
      c.strokeStyle = active ? V.alpha(C.blue, 0.70) : top ? V.alpha(C.blue, 0.52) : V.alpha(C.lineStrong, 0.28);
      c.lineWidth = 1;
      roundPath(c, px, py, pw, ph, ph / 2);
      c.stroke();
      c.fillStyle = active || top ? C.blue : C.muted;
      c.beginPath();
      c.arc(px + 9, py + ph / 2, 2.5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = active ? C.petrol : top ? C.ink : C.ink;
      c.textAlign = "left";
      c.textBaseline = "middle";
      c.fillText(text, px + 15, py + ph / 2 + 0.5);
    }
    function drawUnembed(now) {
      if (!size) return;
      var ctx = size.ctx, w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      var compact = w < 620;
      var panelW = Math.min(380, Math.max(170, w * (compact ? 0.44 : 0.35)));
      var bx = w - 14 - panelW;
      var panelTop = 14, panelH = h - panelTop - 14;
      var cx = Math.min(w * (compact ? 0.24 : 0.27), bx - 40);
      var cy = h * 0.53;
      var r = Math.min(w * (compact ? 0.19 : 0.23), h * 0.36);
      r = Math.max(38, Math.min(r, bx - cx - 42));
      var t = unembedStart ? Math.min(1, (now - unembedStart) / 650) : 1;
      var rows = unembedData();
      var focus = unembedFocus >= 0 && rows[unembedFocus] ? rows[unembedFocus] : null;
      var top = rows[0];
      var hx = cx + Math.cos(UN_ANGLE) * r, hy = cy - Math.sin(UN_ANGLE) * r;
      var labelMaxX = bx - 10;
      var fsSmall = Math.max(8, api.font("canvas-sm") - 2);
      var fsLabel = Math.max(8, api.font("canvas-sm") - 1);
      function pill(text, x, y, color, fs) {
        var sizePx = fs || fsLabel;
        ctx.font = '700 ' + sizePx + 'px "Barlow", "Open Sans", sans-serif';
        var tw = ctx.measureText(text).width;
        var pw = tw + 18, ph = sizePx + 11;
        var px = Math.max(8, Math.min(w - pw - 8, x - pw / 2));
        var py = Math.max(8, Math.min(h - ph - 8, y - ph / 2));
        ctx.save();
        ctx.shadowColor = V.alpha(C.petrol, 0.10);
        ctx.shadowBlur = 9;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = V.alpha(C.paper, 0.90);
        roundPath(ctx, px, py, pw, ph, ph / 2);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = V.alpha(color, 0.55);
        ctx.lineWidth = 1;
        roundPath(ctx, px, py, pw, ph, ph / 2);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, px + pw / 2, py + ph / 2 + 0.5);
      }
      var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.66);
      glow.addColorStop(0, V.alpha(C.blue, 0.07));
      glow.addColorStop(0.5, V.alpha(C.gold, 0.025));
      glow.addColorStop(1, V.alpha(C.paper, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.strokeStyle = V.alpha(C.green, 0.74);
      ctx.lineWidth = 1.6;
      ctx.shadowColor = V.alpha(C.green, 0.22);
      ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.fillStyle = C.gold;
      ctx.font = '700 ' + fsSmall + 'px "Barlow", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("UNEMBEDDING", 18, 24);
      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + Math.max(15, Math.min(21, w * 0.022)) + 'px "Barlow", sans-serif';
      ctx.fillText(DE ? "Vektor → Token" : "vector → token", 18, 45);
      ctx.restore();
      var probs = V.softmax(rows.map(function (x) { return x.cos; }), 0.35);
      var rayLabels = [];
      UN_TOKENS.forEach(function (tok, i) {
        var a = tok.a * Math.PI / 180;
        var x = cx + Math.cos(a) * r, y = cy - Math.sin(a) * r;
        var isFocus = !!(focus && tok.t === focus.t);
        var isTop = !!(top && tok.t === top.t);
        var reveal = Math.max(0, Math.min(1, t * UN_TOKENS.length - i));
        ctx.save();
        ctx.strokeStyle = V.alpha(C.blue, isFocus ? 0.96 : isTop ? 0.72 : 0.22 + 0.38 * reveal);
        ctx.lineWidth = isFocus ? 2.6 : isTop ? 1.8 : 1.1;
        ctx.lineCap = "round";
        if (isFocus) { ctx.shadowColor = V.alpha(C.blue, 0.42); ctx.shadowBlur = 10; }
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.65 * reveal;
        ctx.beginPath();
        ctx.arc(x, y, isFocus ? 5 : isTop ? 4 : 2.8, 0, Math.PI * 2);
        ctx.fillStyle = C.blue;
        ctx.fill();
        if (isFocus || isTop) {
          ctx.strokeStyle = C.paper;
          ctx.lineWidth = 1.3;
          ctx.stroke();
        }
        ctx.restore();
        rayLabels.push({ text: tok.t.trim(), x: x, y: y, active: isFocus, top: isTop });
      });
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = V.alpha(C.petrol, 0.55);
      ctx.shadowBlur = 18;
      V.arrow(ctx, cx, cy, hx, hy, C.petrol, 3.1, 8);
      ctx.restore();
      var hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 16);
      hg.addColorStop(0, V.alpha(C.petrol, 0.26));
      hg.addColorStop(1, V.alpha(C.petrol, 0));
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(hx, hy, 16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(hx, hy, 4.2, 0, Math.PI * 2);
      ctx.fillStyle = C.petrol;
      ctx.fill();
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      var lastLabelX, lastLabelY;
      if (compact || w < 720) {
        lastLabelX = Math.min(hx, bx - 58);
        var lastEdgeY = cy - Math.sqrt(Math.max(0, r * r - (lastLabelX - cx) * (lastLabelX - cx)));
        lastLabelY = lastEdgeY - 18;
      } else {
        var lastLabelDist = r + 50;
        lastLabelX = cx + Math.cos(UN_ANGLE) * lastLabelDist;
        lastLabelY = cy - Math.sin(UN_ANGLE) * lastLabelDist;
      }
      pill(DE ? "letzter Vektor" : "last vector", lastLabelX, lastLabelY, C.petrol, fsSmall);
      rayLabels.forEach(function (l) { drawRayLabel(l.text, l.x, l.y, cx, cy, w, h, l.active, labelMaxX, l.top); });
      ctx.save();
      ctx.shadowColor = V.alpha(C.petrol, 0.10);
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = V.alpha(C.paper, 0.93);
      roundPath(ctx, bx, panelTop, panelW, panelH, 14);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = V.alpha(C.lineStrong, 0.22);
      ctx.lineWidth = 1;
      roundPath(ctx, bx, panelTop, panelW, panelH, 14);
      ctx.stroke();
      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = C.gold;
      ctx.font = '700 ' + fsSmall + 'px "Barlow", sans-serif';
      ctx.fillText(DE ? "NÄCHSTE TOKEN" : "NEXT TOKENS", bx + 18, panelTop + 24);
      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + Math.max(13, Math.min(17, panelW * 0.055)) + 'px "Barlow", sans-serif';
      ctx.fillText(DE ? "Wahrscheinlichkeit" : "Probability", bx + 18, panelTop + 46);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + fsSmall + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "größter Kosinus → höchste (normiert)" : "largest cosine → highest (normalised)", bx + 18, panelTop + 62);
      ctx.strokeStyle = V.alpha(C.line, 0.65);
      ctx.beginPath();
      ctx.moveTo(bx + 18, panelTop + 72);
      ctx.lineTo(bx + panelW - 18, panelTop + 72);
      ctx.stroke();
      ctx.restore();
      var listTop = panelTop + 86;
      var listBottom = panelTop + panelH - 16;
      var rowStep = Math.max(14, Math.min(32, (listBottom - listTop) / Math.max(1, rows.length)));
      var rowFont = rowStep < 19 ? 8 : 10;
      var barW = Math.max(40, panelW - 104);
      rows.forEach(function (row, i) {
        var y = listTop + i * rowStep + rowStep * 0.45;
        var p = probs[i] || 0;
        var grow = ease(clamp((t - 0.28 - i * 0.035) / 0.55, 0, 1));
        var isFocus = !!(focus && row.t === focus.t);
        var isTop = i === 0;
        if (isFocus) {
          ctx.fillStyle = V.alpha(C.green, 0.10);
          roundPath(ctx, bx + 8, y - rowStep * 0.48, panelW - 16, rowStep - 2, 7);
          ctx.fill();
        }
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isFocus ? C.green : C.ink;
        ctx.font = '600 ' + rowFont + 'px "Open Sans", sans-serif';
        ctx.fillText(row.t.trim(), bx + 20, y - 4);
        ctx.textAlign = "right";
        ctx.fillStyle = isFocus ? C.green : C.muted;
        ctx.font = '700 ' + rowFont + 'px "Barlow", sans-serif';
        ctx.fillText(Math.round(p * 100 * grow) + "%", bx + panelW - 18, y - 4);
        var barX = bx + 20, barY = y + 5, barH = rowStep < 19 ? 3 : 4;
        ctx.fillStyle = V.alpha(C.line, 0.70);
        roundPath(ctx, barX, barY, barW, barH, barH / 2);
        ctx.fill();
        var fillW = Math.max(2, barW * p * grow);
        var grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        grad.addColorStop(0, isTop ? C.green : C.blue);
        grad.addColorStop(1, isTop ? C.gold : C.petrol);
        ctx.fillStyle = grad;
        roundPath(ctx, barX, barY, fillW, barH, barH / 2);
        ctx.fill();
        if (isFocus) {
          ctx.fillStyle = C.green;
          ctx.fillRect(bx + 9, y - rowStep * 0.34, 3, rowStep * 0.68);
        }
      });
      var focusTxt = focus ? '<span>' + (DE ? "Winkel" : "angle") + ' <b>' + focus.t + ' · ' + Math.round(Math.abs(focus.diff) * 180 / Math.PI) + '°</b></span>' : '';
      readout.innerHTML = '<span><b>letzter Vektor</b> ' + (DE ? "des letzten Tokens in der letzten Schicht" : "of the last token in the last layer") + '</span><span>letzter Vektor → ' + rows.length + ' ' + (DE ? "Token-Richtungen" : "token directions") + '</span><span>' + (DE ? "größter Kosinus" : "largest cosine") + ' <b>' + top.t + ' · ' + Math.round(Math.abs(top.diff) * 180 / Math.PI) + '°</b></span><span>' + (DE ? "kleinster Kosinus" : "smallest cosine") + ' <b>' + rows[rows.length - 1].t + ' · ' + Math.round(Math.abs(rows[rows.length - 1].diff) * 180 / Math.PI) + '°</b></span>' + focusTxt;
      if (caption.getAttribute("data-caption-mode") !== "unembed") {
        caption.innerHTML = DE
          ? 'Der letzte Vektor des letzten Tokens in der letzten Schicht kommt aus den Transformer-Blöcken. In ihn ist der gesamte Kontext wieder und wieder unter verschiedenen Heads eingemischt worden. In dieser normalisierten Demo vergleicht <span class="ls-math ls-math--inline" data-tex="W_U" data-tex-display="false"><code class="ls-tex-source">W_U</code></span> diesen Vektor mit jeder Token-Richtung; der größte Kosinus wird zum höchsten Wert, Softmax macht daraus eine Verteilung. Im echten Logit skaliert zusätzlich die Länge der Token-Zeile. Fahre über einen Vorschlag, klicke ihn an oder gehe mit „Nächster Winkel“ bzw. den Pfeiltasten weiter, um seinen Winkel zu sehen.'
          : 'The final vector of the last token in the last layer comes out of the transformer blocks. The entire context has been mixed into it again and again under different heads. In this normalised demo <span class="ls-math ls-math--inline" data-tex="W_U" data-tex-display="false"><code class="ls-tex-source">W_U</code></span> compares this vector with every token direction; the largest cosine becomes the highest value, and softmax turns that into a distribution. In the real logit the length of the token row also scales the result. Hover over or click a suggestion, or step through them with “Next angle” or the arrow keys, to see each angle.';
        caption.setAttribute("data-caption-mode", "unembed");
        if (api.typeset) { try { api.typeset(caption); } catch (e) {} }
      }
      if (unembedRaf) { if (t < 1) unembedRaf = requestAnimationFrame(drawUnembed); else unembedRaf = 0; }
    }
    function startUnembed() {
      if (unembedRaf) cancelAnimationFrame(unembedRaf);
      unembedStart = performance.now();
      unembedRaf = requestAnimationFrame(drawUnembed);
    }
    function draw() {
      if (!size) return;
      C = api.colors();
      if (mode === "unembed") { hits = []; drawUnembed(performance.now()); }
      else if (mode === "angle") { hits = []; drawAngle(); }
      else if (mode === "scale") { hits = []; drawScale(); }
      else drawDirections();
    }
    function reveal(el, delay) {
      if (!el || el.hidden || !el.animate || api.reducedMotion) return;
      try {
        el.animate([
          { opacity: 0, transform: "translateY(5px)" },
          { opacity: 1, transform: "none" }
        ], { duration: 240, delay: delay || 0, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
      } catch (e) {}
    }
    function setMode(next) {
      var order = { directions: 0, scale: 1, unembed: 2 };
      var modeChanged = next !== mode;
      var dir = order[next] < order[mode] ? -1 : 1;
      mode = next;
      el.classList.toggle("is-unembed", mode === "unembed");
      tabBtns.forEach(function (b) { var on = b.getAttribute("data-mode") === mode; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", String(on)); });
      if (mapControls) mapControls.hidden = mode !== "directions";
      if (angleControls) angleControls.hidden = mode !== "angle";
      if (scaleControls) scaleControls.hidden = mode !== "scale";
      if (unembedControls) unembedControls.hidden = mode !== "unembed";
      if (mode === "unembed" && modeChanged) { unembedFocus = -1; unembedPinned = -1; unembedStep = -1; }
      if (unembedList) {
        unembedList.hidden = mode !== "unembed";
        if (mode === "unembed") renderUnembedList();
      }
      if (mode === "unembed") startUnembed();
      else if (unembedRaf) { cancelAnimationFrame(unembedRaf); unembedRaf = 0; }
      if (mode === "scale" && modeChanged) {
        scaleMag = SCALE_VALUES[2];
        scaleIndex = 2;
        if (scaleInput) scaleInput.value = String(scaleMag);
        if (scaleOut) scaleOut.textContent = scaleMag.toFixed(2);
      }
      function apply() { draw(); }
      if (modeChanged) requestAnimationFrame(function () { resize(); });
      if (modeChanged && size && V && V.crossfadeCanvas) V.crossfadeCanvas(canvas, apply, { dir: dir, duration: 280 });
      else apply();
      ensureDirLoop();
      if (modeChanged) {
        reveal(mapControls, 0);
        reveal(angleControls, 0);
        reveal(scaleControls, 0);
        reveal(unembedControls, 0);
        reveal(readout, 30);
        reveal(caption, 60);
      }
    }
    /* Reserve the tallest height of the controls, readout and caption rows once
       per width. The stage fills the remaining space, so without this reserve a
       tab switch would resize the canvas and move everything below it. */
    var reservedWidth = 0;
    function reserveRows() {
      var width = Math.round(el.getBoundingClientRect().width);
      if (!width || width === reservedWidth || !size) return;
      var groups = [mapControls, angleControls, scaleControls, unembedControls];
      var rows = [mapControls, angleControls, scaleControls, unembedControls, readout, caption];
      rows.forEach(function (node) { if (node) node.style.minHeight = ""; });
      var saved = { mode: mode, scale: scaleMag, index: scaleIndex, paused: dirPaused, step: unembedStep, pinned: unembedPinned, focus: unembedFocus, animating: !!unembedRaf };
      var max = [0, 0, 0, 0, 0, 0];
      function controlFor(name) {
        return name === "scale" ? scaleControls : name === "unembed" ? unembedControls : mapControls;
      }
      ["directions", "scale", "unembed"].forEach(function (name) {
        mode = name;
        el.classList.toggle("is-unembed", name === "unembed");
        groups.forEach(function (node) { if (node) node.hidden = node !== controlFor(name); });
        if (name === "scale") drawScale();
        else if (name === "unembed") { unembedFocus = -1; unembedPinned = -1; unembedStep = -1; drawUnembed(1e9); }
        else drawDirections();
        if (unembedRaf) { cancelAnimationFrame(unembedRaf); unembedRaf = 0; }
        rows.forEach(function (node, i) { if (node) max[i] = Math.max(max[i], node.offsetHeight); });
      });
      mode = saved.mode;
      scaleMag = saved.scale;
      scaleIndex = saved.index;
      dirPaused = saved.paused;
      unembedStep = saved.step;
      unembedPinned = saved.pinned;
      unembedFocus = saved.focus;
      el.classList.toggle("is-unembed", mode === "unembed");
      groups.forEach(function (node) { if (node) node.hidden = node !== controlFor(mode); });
      rows.forEach(function (node, i) { if (node && max[i] > 0) node.style.minHeight = max[i] + "px"; });
      reservedWidth = width;
      size = api.fit(canvas, stage);
      draw();
      if (mode === "unembed" && saved.animating) startUnembed();
    }
    function resize() { size = api.fit(canvas, stage); draw(); reserveRows(); }
    function choose(i) {
      selected = clamp(i, 0, WORDS.length - 1);
      select.value = String(selected);
      draw();
    }
    tabBtns.forEach(function (b) {
      b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); });
    });
    if (angleAInput) angleAInput.addEventListener("input", function () { angleA = parseFloat(angleAInput.value) || 0; if (angleAOut) angleAOut.textContent = Math.round(angleA) + "°"; draw(); });
    if (angleBInput) angleBInput.addEventListener("input", function () { angleB = parseFloat(angleBInput.value) || 0; if (angleBOut) angleBOut.textContent = Math.round(angleB) + "°"; draw(); });
    if (scaleInput) scaleInput.addEventListener("input", function () { scaleMag = parseFloat(scaleInput.value) || 0.08; scaleIndex = -1; if (scaleOut) scaleOut.textContent = scaleMag.toFixed(2); draw(); });
    if (nextAngleBtn) nextAngleBtn.addEventListener("click", function () {
      stepUnembed(1);
    });
    if (pauseBtn) pauseBtn.addEventListener("click", function () {
      dirPaused = !dirPaused;
      syncPauseBtn();
      if (dirPaused) { if (dirRaf) { cancelAnimationFrame(dirRaf); dirRaf = 0; } }
      else ensureDirLoop();
      drawDirections();
    });
    syncPauseBtn();
    if (angleAOut) angleAOut.textContent = Math.round(angleA) + "°";
    if (angleBOut) angleBOut.textContent = Math.round(angleB) + "°";
    if (scaleOut) scaleOut.textContent = scaleMag.toFixed(2);
    select.addEventListener("change", function () { choose(parseInt(select.value, 10)); });
    canvas.addEventListener("pointerdown", function (e) {
      if (mode !== "directions") return;
      if (!dirPaused && mode === "directions") {
        dirPaused = true;
        syncPauseBtn();
        if (dirRaf) { cancelAnimationFrame(dirRaf); dirRaf = 0; }
      }
      dragging = true;
      dragMoved = false;
      lastPX = e.clientX;
      lastPY = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastPX, dy = e.clientY - lastPY;
      if (Math.abs(dx) + Math.abs(dy) > 2) dragMoved = true;
      yaw += dx * 0.008;
      pitch = clamp(pitch + dy * 0.008, -1.2, 1.2);
      lastPX = e.clientX;
      lastPY = e.clientY;
      drawDirections();
      if (e.cancelable) e.preventDefault();
    });
    canvas.addEventListener("pointercancel", function () { dragging = false; });
    canvas.addEventListener("pointerup", function (e) {
      if (dragging) {
        dragging = false;
        if (dragMoved) { dragMoved = false; return; }
      }
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var best = null, bestD = 1e9;
      hits.forEach(function (hit) {
        var d = Math.hypot(hit.x - x, hit.y - y);
        if (d < bestD) { bestD = d; best = hit; }
      });
      if (best && bestD < 22) choose(best.i);
    });
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", draw);
    if (window.LearnSysDemoCore) {
      window.LearnSysDemoCore.canvasTip(canvas, function (x, y) {
        if (mode !== "directions" || !hits.length) return "";
        var best = null, bestD = 22;
        hits.forEach(function (hit) {
          var d = Math.hypot(hit.x - x, hit.y - y);
          if (d < bestD) { bestD = d; best = hit; }
        });
        if (!best) return DE ? "Wortrichtungen auf der Einheitskugel: Fahre über einen Punkt, um das Wort und seine Nachbarn zu sehen." : "Word directions on the unit sphere: hover a point to see the word and its neighbours.";
        return word(best.i) + (best.i === selected ? (DE ? " · ausgewählt. " : " · selected. ") : ". ") +
          (DE ? "Richtung auf der Einheitskugel. Klicken wählt das Wort; die Winkel zu den Nachbarn stehen im Plot." : "Direction on the unit sphere. Click to choose the word; the angles to its neighbours are shown in the plot.");
      });
    }
    var ro = null, roRaf = 0;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () {
        if (roRaf) return;
        roRaf = requestAnimationFrame(function () { roRaf = 0; resize(); });
      });
      ro.observe(stage);
    }
    choose(0);
    setMode("directions");
    resize();
    return {
      update: function (s) { if (s && s.mode) setMode(s.mode); },
      next: function () {
        if (mode === "unembed") return stepUnembed(1);
        if (mode !== "scale") return false;
        if (scaleIndex < 0) scaleIndex = 0;
        if (scaleIndex >= SCALE_VALUES.length - 1) return false;
        scaleIndex++;
        animateScale(SCALE_VALUES[scaleIndex]);
        return true;
      },
      prev: function () {
        if (mode === "unembed") return stepUnembed(-1);
        if (mode !== "scale") return false;
        if (scaleIndex < 0) scaleIndex = SCALE_VALUES.length - 2;
        if (scaleIndex <= 0) return false;
        scaleIndex--;
        animateScale(SCALE_VALUES[scaleIndex]);
        return true;
      },
      hasNext: function () {
        if (mode === "unembed") return unembedStep < unembedData().length - 1;
        return mode === "scale" && scaleIndex < SCALE_VALUES.length - 1;
      },
      hasPrev: function () {
        if (mode === "unembed") return unembedStep > 0;
        return mode === "scale" && scaleIndex !== 0;
      },
      ownsKeys: function () { return mode === "unembed"; },
      onKey: function (e) {
        if (mode !== "unembed" || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return false;
        if (e.key === "ArrowRight") return stepUnembed(1);
        if (e.key === "ArrowLeft") return stepUnembed(-1);
        return false;
      },
      resize: resize,
      pause: function () { if (dirRaf) { cancelAnimationFrame(dirRaf); dirRaf = 0; } },
      resume: function () { draw(); ensureDirLoop(); },
      destroy: function () { if (unembedRaf) cancelAnimationFrame(unembedRaf); if (dirRaf) cancelAnimationFrame(dirRaf); if (scaleRaf) cancelAnimationFrame(scaleRaf); if (ro) ro.disconnect(); if (roRaf) cancelAnimationFrame(roRaf); window.removeEventListener("resize", resize); window.removeEventListener("tm:theme", draw); el.remove(); }
    };
  };
})();
