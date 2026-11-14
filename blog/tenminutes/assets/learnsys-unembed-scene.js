(function () {
  "use strict";

  window.UnembedScene = function (root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-sim-scene";
    el.innerHTML =
      '<div class="ls-sim-stage"><canvas class="ls-sim-canvas" role="img"></canvas></div>' +
      '<div class="ls-sim-controls">' +
        '<label class="ls-sim-pick">' + (DE ? "Wort" : "Word") + ' <select class="ls-sim-select"></select></label>' +
        '<button type="button" class="ls-chip ls-sim-metric is-on" data-metric="angle" aria-pressed="true">' + (DE ? "Winkel" : "angle") + '</button>' +
        '<button type="button" class="ls-chip ls-sim-metric" data-metric="euclid" aria-pressed="false">' + (DE ? "Euklidisch" : "Euclidean") + '</button>' +
      '</div>' +
      '<div class="ls-sim-readout" aria-live="polite"></div>' +
      '<p class="ls-sim-caption"></p>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-sim-stage");
    var canvas = el.querySelector("canvas");
    var select = el.querySelector(".ls-sim-select");
    var metricBtns = Array.prototype.slice.call(el.querySelectorAll(".ls-sim-metric"));
    var readout = el.querySelector(".ls-sim-readout");
    var caption = el.querySelector(".ls-sim-caption");
    var size = null;
    var selected = 0;
    var metric = "angle";
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
    function ranked() {
      var q = vec(WORDS[selected]);
      var maxD = 0;
      WORDS.forEach(function (w, i) {
        if (i === selected) return;
        maxD = Math.max(maxD, distance(q, vec(w)));
      });
      var rows = [];
      WORDS.forEach(function (w, i) {
        if (i === selected) return;
        var d = distance(q, vec(w));
        var score = metric === "angle" ? Math.max(0, Math.min(1, cosine(q, vec(w)))) : Math.max(0, Math.min(1, 1 - d / (maxD || 1)));
        rows.push({ i: i, pct: Math.round(score * 100), score: score });
      });
      rows.sort(function (a, b) { return b.score - a.score; });
      return rows;
    }
    function map(w, h, x, y) {
      var pad = 34;
      return {
        x: pad + ((x + 1) / 2) * (w - pad * 2),
        y: h - pad - ((y + 1) / 2) * (h - pad * 2)
      };
    }
    function draw() {
      if (!size) return;
      C = api.colors();
      var ctx = size.ctx, w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.globalAlpha = 0.24;
      for (var gx = 0; gx <= 8; gx++) {
        var xx = 8 + (w - 16) * gx / 8;
        ctx.beginPath(); ctx.moveTo(xx, 8); ctx.lineTo(xx, h - 8); ctx.stroke();
      }
      for (var gy = 0; gy <= 6; gy++) {
        var yy = 8 + (h - 16) * gy / 6;
        ctx.beginPath(); ctx.moveTo(8, yy); ctx.lineTo(w - 8, yy); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      var rows = ranked();
      var top = rows.slice(0, 5);
      var q = WORDS[selected];
      var qp = map(w, h, q.x, q.y);
      hits = [];
      top.forEach(function (r) {
        var ww = WORDS[r.i], p = map(w, h, ww.x, ww.y);
        ctx.strokeStyle = C.gold;
        ctx.globalAlpha = 0.12 + r.score * 0.48;
        ctx.lineWidth = 0.8 + r.score * 2.1;
        ctx.beginPath(); ctx.moveTo(qp.x, qp.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      WORDS.forEach(function (ww, i) {
        var p = map(w, h, ww.x, ww.y);
        var isSel = i === selected;
        var isTop = top.some(function (r) { return r.i === i; });
        var label = word(ww);
        hits.push({ x: p.x, y: p.y, i: i });
        ctx.beginPath();
        ctx.arc(p.x, p.y, isSel ? 5.2 : isTop ? 3.8 : 2.7, 0, Math.PI * 2);
        ctx.fillStyle = isSel ? C.green : isTop ? C.gold : C.muted;
        ctx.fill();
        if (isSel) {
          ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
          ctx.strokeStyle = C.green; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalAlpha = 1;
        }
        if (!isSel && !isTop) return;
        var fs = isSel ? Math.max(12, api.font("canvas-sm") + 2) : Math.max(10, api.font("canvas-sm"));
        ctx.font = (isSel ? "700 " : "600 ") + fs + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        if (isSel) {
          ctx.textBaseline = "bottom";
          ctx.fillStyle = C.green;
          ctx.fillText(label, p.x, p.y - 9);
        } else {
          ctx.textBaseline = "top";
          ctx.fillStyle = C.ink;
          ctx.fillText(label, p.x, p.y + 10);
          var r = top.filter(function (x) { return x.i === i; })[0];
          ctx.font = "700 " + Math.max(8, api.font("canvas-sm") - 2) + 'px "Open Sans", sans-serif';
          ctx.fillStyle = C.gold;
          ctx.fillText(r.pct + "%", p.x, p.y + 23);
        }
      });
      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + Math.max(12, api.font("canvas") * 0.9) + 'px "Barlow", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(DE ? "Ähnliche Worte finden" : "Finding similar words", 18, 28);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "2D-Projektion · Zahl = Ähnlichkeit, keine Wahrscheinlichkeit" : "2D projection · number = similarity, not probability", 18, 45);
      var head = metric === "angle" ? (DE ? "Winkel" : "angle") : (DE ? "Euklidisch" : "Euclidean");
      ctx.textAlign = "right";
      ctx.fillStyle = C.green;
      ctx.font = '700 ' + Math.max(10, api.font("canvas-sm") + 1) + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "Metrik: " + head : "metric: " + head, w - 18, 28);
      ctx.textAlign = "left";
      var list = top.map(function (r) { return word(WORDS[r.i]) + " " + r.pct + "%"; }).join(" · ");
      readout.innerHTML = '<span>' + (DE ? "Wort" : "word") + ' <b>' + word(q) + '</b></span><span>' + (DE ? "Metrik" : "metric") + ' <b>' + head + '</b></span><span>' + (DE ? "Top 5" : "top 5") + ' <b>' + list + '</b></span>';
      caption.textContent = DE
        ? "W_U hat eine Zeile pro Token. Das Skalarprodukt misst, wie ähnlich die Richtungen sind: Winkel ignorieren die Länge, der euklidische Abstand nicht. Klicke ein Wort oder wähle es unten."
        : "W_U has one row per token. The dot product measures how similar the directions are: angles ignore length, Euclidean distance does not. Click a word or choose one below.";
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    function choose(i) {
      selected = clamp(i, 0, WORDS.length - 1);
      select.value = String(selected);
      draw();
    }
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
    metricBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        metric = btn.getAttribute("data-metric");
        metricBtns.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-on", on);
          b.setAttribute("aria-pressed", String(on));
        });
        draw();
      });
    });
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", draw);
    choose(0);
    resize();
    return {
      update: function () {},
      resize: resize,
      pause: function () {},
      resume: function () { draw(); },
      destroy: function () { window.removeEventListener("resize", resize); window.removeEventListener("tm:theme", draw); el.remove(); }
    };
  };
})();
