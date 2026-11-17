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
        '<button type="button" class="ls-sim-tab" data-mode="angle" role="tab" aria-selected="false">' + (DE ? "Winkel" : "Angle") + '</button>' +
        '<button type="button" class="ls-sim-tab" data-mode="scale" role="tab" aria-selected="false">' + (DE ? "Skaleninvarianz" : "Scale invariance") + '</button>' +
        '<button type="button" class="ls-sim-tab" data-mode="unembed" role="tab" aria-selected="false">Unembedding</button>' +
      '</div>' +
      '<div class="ls-sim-stage"><canvas class="ls-sim-canvas" role="img"></canvas></div>' +
      '<div class="ls-sim-controls ls-sim-map-controls">' +
        '<label class="ls-sim-pick">' + (DE ? "Wort" : "Word") + ' <select class="ls-sim-select"></select></label>' +
      '</div>' +
      '<div class="ls-sim-controls ls-sim-angle-controls" hidden>' +
        '<label class="ls-range">' + (DE ? "Vektor A" : "Vector A") + ' <input type="range" class="ls-sim-angle-a" min="0" max="360" step="1" value="360"><output>360°</output></label>' +
        '<label class="ls-range">' + (DE ? "Vektor B" : "Vector B") + ' <input type="range" class="ls-sim-angle-b" min="0" max="360" step="1" value="90"><output>90°</output></label>' +
      '</div>' +
      '<div class="ls-sim-controls ls-sim-scale-controls" hidden>' +
        '<label class="ls-range">' + (DE ? "Länge von B" : "Magnitude of B") + ' <input type="range" class="ls-sim-scale" min="0.3" max="3" step="0.05" value="1.6"><output>1.60×</output></label>' +
      '</div>' +
      '<div class="ls-sim-controls ls-sim-unembed-controls" hidden><button type="button" class="ls-btn ls-btn--tiny ls-sim-replay">' + (DE ? "Nochmal" : "Again") + '</button><button type="button" class="ls-btn ls-btn--tiny ls-sim-next-angle">' + (DE ? "Nächster Winkel" : "Next angle") + '</button><div class="ls-sim-unembed-list" hidden></div></div>' +
      '<div class="ls-sim-readout" aria-live="polite"></div>' +
      '<p class="ls-sim-caption"></p>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-sim-stage");
    var canvas = el.querySelector("canvas");
    var select = el.querySelector(".ls-sim-select");
    var tabBtns = Array.prototype.slice.call(el.querySelectorAll(".ls-sim-tab"));
    var mapControls = el.querySelector(".ls-sim-map-controls");
    var angleControls = el.querySelector(".ls-sim-angle-controls");
    var scaleControls = el.querySelector(".ls-sim-scale-controls");
    var angleAInput = el.querySelector(".ls-sim-angle-a");
    var angleBInput = el.querySelector(".ls-sim-angle-b");
    var angleAOut = angleAInput ? angleAInput.nextElementSibling : null;
    var angleBOut = angleBInput ? angleBInput.nextElementSibling : null;
    var scaleInput = el.querySelector(".ls-sim-scale");
    var scaleOut = scaleInput ? scaleInput.nextElementSibling : null;
    var unembedControls = el.querySelector(".ls-sim-unembed-controls");
    var unembedReplay = el.querySelector(".ls-sim-replay");
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
    var mode = "map";
    var angleA = 360, angleB = 90, scaleMag = 1.6;
    var hits = [];
    var C = api.colors();
    var clamp = api.util.clamp;

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
    function drawDirections() {
      if (!size) return;
      C = api.colors();
      var ctx = size.ctx, w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, w, h);
      var cx = w * .32, cy = h * .52, r = Math.min(w * .27, h * .38);
      ctx.strokeStyle = C.line;
      ctx.globalAlpha = .55;
      ctx.lineWidth = 1;
      for (var k = 1; k <= 3; k++) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * k / 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(cx - r * 1.1, cy);
      ctx.lineTo(cx + r * 1.1, cy);
      ctx.moveTo(cx, cy - r * 1.1);
      ctx.lineTo(cx, cy + r * 1.1);
      ctx.stroke();
      ctx.globalAlpha = 1;
      var q = WORDS[selected];
      var qa = Math.atan2(q.y, q.x);
      var rows = [];
      WORDS.forEach(function (ww, i) {
        if (i === selected) return;
        var a = Math.atan2(ww.y, ww.x);
        var diff = a - qa;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        var ad = Math.abs(diff);
        rows.push({ i: i, w: ww, a: a, diff: diff, ad: ad, cos: Math.cos(diff), deg: ad * 180 / Math.PI });
      });
      rows.sort(function (a, b) { return a.ad - b.ad; });
      var top = rows.slice(0, 5);
      hits = [];
      WORDS.forEach(function (ww, i) {
        var a = Math.atan2(ww.y, ww.x);
        var x = cx + Math.cos(a) * r, y = cy - Math.sin(a) * r;
        var isSel = i === selected;
        var isTop = top.some(function (t) { return t.i === i; });
        ctx.strokeStyle = isSel ? C.green : isTop ? C.gold : C.line;
        ctx.globalAlpha = isSel ? 1 : isTop ? .75 : .35;
        ctx.lineWidth = isSel ? 2.4 : isTop ? 1.4 : 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, isSel ? 4.2 : isTop ? 3 : 2.2, 0, Math.PI * 2);
        ctx.fillStyle = isSel ? C.green : isTop ? C.gold : C.muted;
        ctx.fill();
        hits.push({ x: x, y: y, i: i });
        if (isSel || isTop) drawRayLabel(word(ww), x, y, cx, cy, w, h, isSel, w * .63);
      });
      var qx = cx + Math.cos(qa) * r, qy = cy - Math.sin(qa) * r;
      var ox = cx + Math.cos(qa) * r * 1.45, oy = cy - Math.sin(qa) * r * 1.45;
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = V.alpha(C.green, .7);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(qx, qy);
      ctx.lineTo(ox, oy);
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(ox, oy, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = C.green;
      ctx.fill();
      ctx.fillStyle = C.green;
      ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(DE ? "gleiche Richtung, anderer Abstand" : "same direction, different distance", Math.min(ox + 8, w * .62 - 80), oy + 2);
      if (top.length) {
        var t = top[0];
        var aa = qa, bb = t.a, d = t.diff;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r * .42, -aa, -bb, d < 0);
        ctx.closePath();
        ctx.fillStyle = V.alpha(C.gold, .16);
        ctx.fill();
        ctx.strokeStyle = C.gold;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = C.gold;
        ctx.font = '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(Math.round(t.deg) + "°", cx + Math.cos((aa + bb) / 2) * r * .52, cy - Math.sin((aa + bb) / 2) * r * .52);
      }
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + Math.max(12, api.font("canvas") * .9) + 'px "Barlow", sans-serif';
      ctx.fillText(DE ? "Wörter sind Richtungen" : "Words are directions", 18, 28);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "Winkel = Ähnlichkeit · Länge zählt nicht" : "angle = similarity · length does not count", 18, 45);
      var bx = w * .64, by = 64, bw = w - bx - 18;
      ctx.textAlign = "left";
      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + Math.max(10, api.font("canvas-sm")) + 'px "Barlow", sans-serif';
      ctx.fillText(DE ? "nächste Richtungen" : "nearest directions", bx, 28);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "kleinster Winkel zuerst" : "smallest angle first", bx, 44);
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
      caption.textContent = DE ? "Wörter sind Richtungen, keine Punkte. Der Winkel ist die Ähnlichkeit; die Länge spielt keine Rolle. Zwei Punkte auf derselben Richtung können weit auseinanderliegen und haben trotzdem Winkel 0°." : "Words are directions, not points. The angle is the similarity; length does not matter. Two points on the same direction can be far apart and still have angle 0°.";
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
      caption.textContent = DE ? "Der Winkel ist die Ähnlichkeit der Richtungen. Dot nahe 1: ähnlich; nahe 0: neutral; negativ: entgegengesetzt. Das ist eine Interpretation der gelernten Richtungen, kein Wahrheitsbeweis." : "The angle is the similarity of directions. Dot near 1: similar; near 0: neutral; negative: opposite. This is an interpretation of learned directions, not a proof of truth.";
    }
    function drawScale() {
      var s = circleScene(), ctx = s.ctx, cx = s.cx, cy = s.cy, r = s.r;
      var a = 35 * Math.PI / 180;
      var magA = 0.55, magB = 0.55 * scaleMag;
      var lenA = r * magA, lenB = r * magB;
      var ax = cx + Math.cos(a) * lenA, ay = cy - Math.sin(a) * lenA;
      var bx = cx + Math.cos(a) * lenB, by = cy - Math.sin(a) * lenB;
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = V.alpha(C.lilac, .8);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.restore();
      V.arrow(ctx, cx, cy, ax, ay, C.blue, 3);
      V.arrow(ctx, cx, cy, bx, by, C.green, 3);
      ctx.fillStyle = C.blue;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("A", ax + 7, ay - 3);
      ctx.fillStyle = C.green;
      ctx.fillText("B", bx + 7, by - 3);
      ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.fillStyle = C.blue;
      ctx.fillText("|A| = " + magA.toFixed(2), ax + 7, ay + 14);
      ctx.fillStyle = C.green;
      ctx.fillText("|B| = " + magB.toFixed(2), bx + 7, by + 14);
      ctx.fillStyle = C.gold;
      ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("0°", cx + Math.cos(a) * r * .45 + 18, cy - Math.sin(a) * r * .45 - 10);
      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(DE ? "Länge vs. Richtung" : "Length vs. direction", 18, 28);
      readout.innerHTML = '<span>|A| <b>' + magA.toFixed(2) + '</b></span><span>|B| <b>' + magB.toFixed(2) + '</b></span><span>' + (DE ? "Winkel" : "angle") + ' <b>0.0°</b></span><span>Cos <b>1.000</b></span>';
      caption.textContent = DE ? "A und B zeigen in dieselbe Richtung. B ist länger, die Spitzen liegen weit auseinander, aber der Winkel ist 0° und der Cosinus 1. Die Länge ändert die Ähnlichkeit nicht." : "A and B point in the same direction. B is longer, the tips are far apart, but the angle is 0° and the cosine is 1. Length does not change the similarity.";
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
          setUnembedFocus(unembedPinned);
        });
      });
      updateAngleList();
    }
    function drawRayLabel(text, x, y, cx, cy, w, h, active, maxX) {
      var dx = x - cx, dy = y - cy, len = Math.hypot(dx, dy) || 1;
      var lx = x + dx / len * 9, ly = y + dy / len * 9;
      var align = dx >= 0 ? "left" : "right";
      var c = size.ctx;
      c.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      var tw = c.measureText(text).width;
      if (align === "left") lx = Math.min(lx, maxX - tw);
      else lx = Math.max(lx, 8);
      ly = Math.max(14, Math.min(h - 14, ly));
      var bx = align === "left" ? lx : lx - tw;
      c.fillStyle = V.alpha(C.paper, .92);
      c.fillRect(bx - 2, ly - 7, tw + 4, 14);
      c.fillStyle = active ? C.green : C.soft;
      c.textAlign = align;
      c.textBaseline = "middle";
      c.fillText(text, lx, ly);
    }
    function drawUnembed(now) {
      if (!size) return;
      var ctx = size.ctx, w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, h);
      var cx = w * 0.28, cy = h * 0.50, r = Math.min(w * 0.24, h * 0.38);
      ctx.strokeStyle = C.line; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      var t = unembedStart ? Math.min(1, (now - unembedStart) / 650) : 1;
      var scan = Math.floor(t * UN_TOKENS.length);
      var rows = unembedData();
      var focus = unembedFocus >= 0 && rows[unembedFocus] ? rows[unembedFocus] : null;
      var hx = cx + Math.cos(UN_ANGLE) * r, hy = cy - Math.sin(UN_ANGLE) * r;
      var panelW = Math.min(360, Math.max(150, w * 0.36));
      var bx = w - 16 - panelW;
      var barX = bx + Math.min(72, panelW * 0.30);
      var bw = Math.min(210, panelW - (barX - bx) - 42);
      var labelMaxX = bx - 8;
      var rayLabels = [];
      UN_TOKENS.forEach(function (tok, i) {
        var a = tok.a * Math.PI / 180;
        var x = cx + Math.cos(a) * r, y = cy - Math.sin(a) * r;
        ctx.strokeStyle = C.line; ctx.globalAlpha = 0.28; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = C.muted; ctx.beginPath(); ctx.arc(x, y, 2.3, 0, Math.PI * 2); ctx.fill();
        rayLabels.push({ text: tok.t.trim(), x: x, y: y, active: !!(focus && tok.t === focus.t) });
        if (i < scan || (focus && tok.t === focus.t)) {
          var d = tok.a * Math.PI / 180 - UN_ANGLE;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, focus && tok.t === focus.t ? r * 0.42 : r * 0.32, UN_ANGLE, UN_ANGLE + d, d < 0); ctx.closePath();
          ctx.fillStyle = V.alpha(focus && tok.t === focus.t ? C.green : C.gold, 0.14); ctx.fill();
          ctx.strokeStyle = focus && tok.t === focus.t ? C.green : C.gold; ctx.globalAlpha = focus && tok.t === focus.t ? 1 : 0.55; ctx.lineWidth = focus && tok.t === focus.t ? 2.4 : 1; ctx.stroke(); ctx.globalAlpha = 1;
        }
        if (focus && tok.t === focus.t) {
          ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = C.green; ctx.fill();
          ctx.strokeStyle = C.paper; ctx.lineWidth = 1.4; ctx.stroke();
        }
      });
      V.arrow(ctx, cx, cy, hx, hy, C.petrol, 3.2);
      ctx.fillStyle = C.petrol; ctx.font = '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif'; ctx.textAlign = "center"; ctx.fillText("h", hx, hy - 9);
      rayLabels.forEach(function (l) { drawRayLabel(l.text, l.x, l.y, cx, cy, w, h, l.active, labelMaxX); });
      ctx.textBaseline = "alphabetic";
      // right: sorted probabilities in a fixed-width panel
      var probs = V.softmax(rows.map(function (x) { return x.cos; }), 0.35);
      ctx.textAlign = "left"; ctx.fillStyle = C.petrol; ctx.font = '700 ' + Math.max(10, api.font("canvas-sm")) + 'px "Barlow", sans-serif'; ctx.fillText(DE ? "Wahrscheinlichkeit" : "probability", bx, 20);
      ctx.fillStyle = C.muted; ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif'; ctx.fillText(DE ? "kleinster Winkel → höchste" : "smallest angle → highest", bx, 34);
      var listTop = 48;
      var rowStep = Math.min(22, (h - listTop - 16) / Math.max(1, rows.length - 1));
      rows.forEach(function (row, i) {
        var y = listTop + i * rowStep;
        var p = probs[i] || 0;
        var grow = Math.max(0, Math.min(1, (t - 0.55) / 0.45));
        if (focus && row.t === focus.t) { ctx.fillStyle = C.green; ctx.fillRect(bx - 4, y - 9, 3, 13); }
        ctx.fillStyle = C.ink; ctx.font = '600 ' + Math.max(9, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif'; ctx.textAlign = "left"; ctx.fillText(row.t, bx, y);
        ctx.fillStyle = C.line; ctx.fillRect(barX, y - 6, bw, 7);
        ctx.fillStyle = i === 0 ? C.green : C.blue; ctx.fillRect(barX, y - 6, bw * p * grow, 7);
        ctx.fillStyle = C.muted; ctx.textAlign = "right"; ctx.fillText(Math.round(p * 100 * grow) + "%", barX + bw, y);
      });
      var top = rows[0], bottom = rows[rows.length - 1];
      var focusTxt = focus ? '<span>' + (DE ? "Winkel" : "angle") + ' <b>' + focus.t + ' · ' + Math.round(Math.abs(focus.diff) * 180 / Math.PI) + '°</b></span>' : '';
      readout.innerHTML = '<span><b>h</b> ' + (DE ? "letzter Vektor nach allen Transformer-Blöcken" : "final vector after all transformer blocks") + '</span><span>h → ' + rows.length + ' ' + (DE ? "Token-Richtungen" : "token directions") + '</span><span>' + (DE ? "kleinster Winkel" : "smallest angle") + ' <b>' + top.t + ' · ' + Math.round(Math.abs(top.diff) * 180 / Math.PI) + '°</b></span><span>' + (DE ? "größter" : "largest") + ' <b>' + bottom.t + ' · ' + Math.round(Math.abs(bottom.diff) * 180 / Math.PI) + '°</b></span>' + focusTxt;
      caption.textContent = DE ? "h ist der letzte Vektor, der aus den Transformer-Blöcken kommt. In ihn ist der gesamte Kontext wieder und wieder unter verschiedenen Heads eingemischt worden. W_U vergleicht h mit jeder Token-Richtung; der kleinste Winkel wird zum höchsten Logit, Softmax macht daraus eine Verteilung. Fahre über einen Vorschlag oder klicke ihn an: Der Winkel wird hervorgehoben." : "h is the final vector coming out of the transformer blocks. The entire context has been mixed into it again and again under different heads. W_U compares h with every token direction; the smallest angle becomes the highest logit, and softmax turns that into a distribution. Hover or click a suggestion to highlight its angle.";
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
      var order = { directions: 0, angle: 1, scale: 2, unembed: 3 };
      var modeChanged = next !== mode;
      var dir = order[next] < order[mode] ? -1 : 1;
      mode = next;
      el.classList.toggle("is-unembed", mode === "unembed");
      tabBtns.forEach(function (b) { var on = b.getAttribute("data-mode") === mode; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", String(on)); });
      if (mapControls) mapControls.hidden = mode !== "directions";
      if (angleControls) angleControls.hidden = mode !== "angle";
      if (scaleControls) scaleControls.hidden = mode !== "scale";
      if (unembedControls) unembedControls.hidden = mode !== "unembed";
      if (unembedList) {
        unembedList.hidden = mode !== "unembed";
        if (mode === "unembed") renderUnembedList();
      }
      if (mode === "unembed") startUnembed(); else if (unembedRaf) { cancelAnimationFrame(unembedRaf); unembedRaf = 0; }
      function apply() { draw(); }
      if (modeChanged && size && V && V.crossfadeCanvas) V.crossfadeCanvas(canvas, apply, { dir: dir, duration: 280 });
      else apply();
      if (modeChanged) {
        reveal(mapControls, 0);
        reveal(angleControls, 0);
        reveal(scaleControls, 0);
        reveal(unembedControls, 0);
        reveal(readout, 30);
        reveal(caption, 60);
      }
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
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
    if (scaleInput) scaleInput.addEventListener("input", function () { scaleMag = parseFloat(scaleInput.value) || 1; if (scaleOut) scaleOut.textContent = scaleMag.toFixed(2) + "×"; draw(); });
    if (unembedReplay) unembedReplay.addEventListener("click", function () {
      unembedFocus = -1; unembedPinned = -1; unembedStep = -1;
      updateAngleList();
      startUnembed();
    });
    if (nextAngleBtn) nextAngleBtn.addEventListener("click", function () {
      var rows = unembedData();
      if (!rows.length) return;
      unembedStep = (unembedStep + 1) % rows.length;
      unembedPinned = unembedStep;
      setUnembedFocus(unembedStep);
    });
    if (angleAOut) angleAOut.textContent = Math.round(angleA) + "°";
    if (angleBOut) angleBOut.textContent = Math.round(angleB) + "°";
    if (scaleOut) scaleOut.textContent = scaleMag.toFixed(2) + "×";
    select.addEventListener("change", function () { choose(parseInt(select.value, 10)); });
    canvas.addEventListener("pointerup", function (e) {
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
    choose(0);
    setMode("directions");
    resize();
    return {
      update: function (s) { if (s && s.mode) setMode(s.mode); },
      next: function () { return false; },
      prev: function () { return false; },
      resize: resize,
      pause: function () {},
      resume: function () { draw(); },
      destroy: function () { if (unembedRaf) cancelAnimationFrame(unembedRaf); window.removeEventListener("resize", resize); window.removeEventListener("tm:theme", draw); el.remove(); }
    };
  };
})();
