(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function noiseScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-noise-scene";
    el.innerHTML =
      '<div class="ls-noise-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-scene-row"><label class="ls-range">' + (DE ? "Kontext" : "Context") + ' <input type="range" class="ls-noise-layer" min="0" max="5" step="1" value="0"><output>0</output></label></div>' +
      '<div class="ls-noise-readout" aria-live="polite"></div>' +
      '<div class="ls-noise-explain">' +
        '<div class="ls-noise-explain-head">' + (DE ? "Wörter sind neutral; der Kontext trägt Bedeutung" : "Words are neutral; the context carries meaning") + '</div>' +
        '<p class="ls-noise-explain-row"><span data-tex="\\text{new}" data-tex-display="false">new</span><span class="ls-noise-explain-text">' + (DE ? "steht zwischen Auto, Zukunft, Neubeginn, Neujahr und Neugier." : "sits between car, future, new beginning, New Year, and curiosity.") + '</span></p>' +
        '<p class="ls-noise-explain-row"><span data-tex="\\text{york}" data-tex-display="false">york</span><span class="ls-noise-explain-text">' + (DE ? "steht zwischen York (Western Australia), York (England) und York Chocolate, einer Katzenrasse." : "sits between York (Western Australia), York (England), and York Chocolate, a cat breed.") + '</span></p>' +
        '<p class="ls-noise-explain-row"><span data-tex="\\text{new york}" data-tex-display="false">new york</span><span class="ls-noise-explain-text">' + (DE ? "zusammen in der Nähe von Empire State Building, Freiheitsstatue und der US-Großstadt." : "together near the Empire State Building, the Statue of Liberty, and the US metropolis.") + '</span></p>' +
      '</div>';
    root.appendChild(el);
    if (api.typeset) { try { api.typeset(el); } catch (err) {} }
    var stage = el.querySelector(".ls-noise-stage");
    var canvas = el.querySelector("canvas");
    var slider = el.querySelector(".ls-noise-layer");
    var out = el.querySelector(".ls-noise-scene output");
    var readout = el.querySelector(".ls-noise-readout");
    var layer = 0, size = null;
    var C = api.colors();
    function lerp(a, b, t) { return a + (b - a) * t; }
    function draw() {
      if (!size) return;
      var ctx = size.ctx, w = size.w, h = size.h;
      var t = layer / 5;
      var easeT = t * t * (3 - 2 * t);
      ctx.clearRect(0, 0, w, h);
      var pad = 24;
      function px(x) { return pad + (x + 1.1) / 2.2 * (w - pad * 2); }
      function py(y) { return pad + (0.9 - y) / 1.8 * (h - pad * 2); }
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      for (var g = -1; g <= 1; g += 0.5) {
        ctx.beginPath(); ctx.moveTo(px(-1.1), py(g)); ctx.lineTo(px(1.1), py(g)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px(g), py(-0.9)); ctx.lineTo(px(g), py(0.9)); ctx.stroke();
      }
      var anchors = [
        { id: "car", x: -0.82, y: 0.32, label: DE ? "Auto" : "car", color: C.muted },
        { id: "england", x: -0.78, y: -0.44, label: "England", color: C.muted },
        { id: "future", x: -0.88, y: 0.78, label: DE ? "Zukunft" : "future", color: C.gold },
        { id: "newyear", x: -0.88, y: 0.60, label: DE ? "Neujahr" : "New Year", color: C.gold },
        { id: "curiosity", x: -0.88, y: 0.10, label: DE ? "Neugier" : "curiosity", color: C.gold },
        { id: "city", x: 0.40, y: 0.02, label: DE ? "Stadt · New York" : "city · New York", color: C.green }
      ];
      var newPos = { x: lerp(-0.58, 0.40, easeT), y: lerp(0.46, 0.16, easeT) };
      var yorkPos = { x: lerp(-0.46, 0.40, easeT), y: lerp(-0.34, -0.10, easeT) };
      function line(a, b, col, alpha, width, dash) {
        ctx.save();
        if (dash) ctx.setLineDash(dash);
        ctx.strokeStyle = col;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = width || 1.3;
        ctx.beginPath(); ctx.moveTo(px(a.x), py(a.y)); ctx.lineTo(px(b.x), py(b.y)); ctx.stroke();
        ctx.restore();
      }
      var alt = 1 - easeT;
      // The ambiguous alternatives fade as the context arrives.
      line(newPos, anchors[0], C.gold, 0.15 + 0.45 * alt, 1.2 + alt * 1.4, [3, 4]);
      line(yorkPos, anchors[1], C.gold, 0.12 + 0.38 * alt, 1.2 + alt * 1.2, [3, 4]);
      [2, 3, 4].forEach(function (ai) { line(newPos, anchors[ai], C.gold, 0.10 + 0.34 * alt, 1.0 + alt * 1.1, [3, 4]); });
      // "new" and "york" become one phrase; both point to the city.
      line(newPos, yorkPos, C.petrol, 0.18 + 0.55 * easeT, 1.4 + 2.4 * easeT);
      line(newPos, anchors[2], C.green, 0.18 + 0.72 * easeT, 1.3 + 4.2 * easeT);
      line(yorkPos, anchors[2], C.green, 0.14 + 0.68 * easeT, 1.2 + 3.8 * easeT);
      function point(p, col, label, r, opt) {
        var o = opt || {};
        ctx.beginPath(); ctx.arc(px(p.x), py(p.y), r || 5, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();
        ctx.strokeStyle = C.paper; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = C.ink;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = o.align || "center";
        var dx = o.align === "left" ? 8 : o.align === "right" ? -8 : 0;
        ctx.fillText(label, px(p.x) + dx, py(p.y) + (o.dy || -10));
      }
      anchors.forEach(function (a, i) {
        point(a, a.color, a.label, 4.5, a.id === "city" ? { align: "left", dy: 4 } : null);
      });
      var landmarks = [
        { x: 0.58, y: 0.26, label: "Empire State Building" },
        { x: 0.58, y: 0.46, label: DE ? "Freiheitsstatue" : "Statue of Liberty" }
      ];
      landmarks.forEach(function (l) {
        ctx.beginPath();
        ctx.arc(px(l.x), py(l.y), 3, 0, Math.PI * 2);
        ctx.fillStyle = C.lineStrong || C.muted;
        ctx.fill();
        ctx.fillStyle = C.muted;
        ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(l.label, px(l.x) + 7, py(l.y) + 3);
      });
      point(newPos, C.petrol, "new", 6);
      point(yorkPos, C.petrol, "york", 6);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(DE ? "new + york → New York" : "new + york → New York", 10, 16);
      var wCar = 0.42 * alt;
      var wEngland = 0.30 * alt;
      var wYork = 0.18;
      var wCity = 0.08 + 0.72 * easeT;
      var wSelf = Math.max(0.02, 1 - wCar - wEngland - wYork - wCity);
      readout.innerHTML = '<span>' + (DE ? "new′ =" : "new′ =") + ' <b>' + (wSelf * 100).toFixed(0) + '% new</b> + <b>' + (wCar * 100).toFixed(0) + '% ' + (DE ? "Auto" : "car") + '</b> + <b>' + (wEngland * 100).toFixed(0) + '% England</b> + <b>' + (wYork * 100).toFixed(0) + '% york</b> + <b>' + (wCity * 100).toFixed(0) + '% ' + (DE ? "Stadt" : "city") + '</b></span><span>' + (DE ? "Summe 100 %" : "sum 100%") + '</span>';
      canvas.setAttribute("aria-label", DE
        ? "Attention reduziert Rauschen: new und york bewegen sich mit dem Kontext zu Stadt, während Auto und England verblassen. Kontext " + layer + "."
        : "Attention reduces noise: new and york move toward city with the context while car and England fade. Context " + layer + ".");
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    slider.addEventListener("input", function () {
      layer = parseInt(slider.value, 10) || 0;
      out.textContent = String(layer);
      draw();
    });
    window.addEventListener("resize", resize);
    out.textContent = "0";
    resize();
    return {
      update: function (s) {
        if (s && typeof s.layer === "number") {
          layer = Math.max(0, Math.min(5, s.layer));
          slider.value = String(layer);
          out.textContent = String(layer);
          draw();
        }
      },
      resize: resize,
      next: function () {
        if (layer >= 5) return false;
        layer++; slider.value = String(layer); out.textContent = String(layer); draw(); return true;
      },
      prev: function () {
        if (layer <= 0) return false;
        layer--; slider.value = String(layer); out.textContent = String(layer); draw(); return true;
      },
      onKey: function (e) {
        if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { if (layer >= 5) return false; layer++; slider.value = String(layer); out.textContent = String(layer); draw(); return true; }
        if (e.key === "ArrowLeft" || e.key === "PageUp") { if (layer <= 0) return false; layer--; slider.value = String(layer); out.textContent = String(layer); draw(); return true; }
        return false;
      },
      destroy: function () { window.removeEventListener("resize", resize); el.remove(); }
    };
  }
  core.register("noise", noiseScene);
})();
