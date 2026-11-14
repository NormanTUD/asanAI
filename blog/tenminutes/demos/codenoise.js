(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function codeNoiseScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var el = document.createElement("div");
    el.className = "ls-codenoise-scene";
    el.innerHTML = '<div class="ls-codenoise-stage"><canvas class="ls-codenoise-canvas" role="img"></canvas></div>' +
      '<div class="ls-codenoise-modes" role="group" aria-label="' + (DE ? "Code-Kontext" : "Code context") + '">' +
        '<button type="button" class="ls-chip is-on" data-code-mode="neutral">' + (DE ? "Neutral" : "Neutral") + '</button>' +
        '<button type="button" class="ls-chip" data-code-mode="js">JavaScript</button>' +
        '<button type="button" class="ls-chip" data-code-mode="py">Python</button>' +
      '</div>' +
      '<div class="ls-codenoise-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-codenoise-stage");
    var canvas = el.querySelector(".ls-codenoise-canvas");
    var readout = el.querySelector(".ls-codenoise-readout");
    var buttons = Array.prototype.slice.call(el.querySelectorAll("[data-code-mode]"));
    var C = api.colors();
    var size = null, ctx = null, mode = "neutral";
    var TOKENS = [
      { t: "function", lang: "js", base: [-0.82, 0.44], color: C.blue },
      { t: "def", lang: "py", base: [-0.78, -0.42], color: C.green },
      { t: "quickSort", lang: "js", base: [0.74, 0.54], color: C.blue },
      { t: "quick_sort", lang: "py", base: [0.78, -0.48], color: C.green },
      { t: "quicksort", lang: "neutral", base: [0.06, 0.88], color: C.gold },
      { t: "quick sort", lang: "neutral", base: [0.02, -0.86], color: C.gold }
    ];
    function chip(ctx, text, x, y, color, alpha, active) {
      ctx.save();
      ctx.font = '700 ' + Math.max(10, api.font("canvas-sm") + 1) + 'px ui-monospace,"Cascadia Code",Menlo,Consolas,monospace';
      var tw = ctx.measureText(text).width;
      var w = tw + 16, h = 26;
      var bx = x - w / 2, by = y - h / 2;
      ctx.globalAlpha = alpha;
      if (active) {
        ctx.shadowColor = V.alpha(color, 0.45);
        ctx.shadowBlur = 14;
      }
      ctx.fillStyle = C.paper;
      ctx.fillRect(bx, by, w, h);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = active ? color : V.alpha(color, 0.55);
      ctx.lineWidth = active ? 2 : 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, w - 1, h - 1);
      ctx.fillStyle = active ? color : V.alpha(color, 0.72);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x, y + 1);
      ctx.restore();
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, w, h);
      var bg = ctx.createRadialGradient(w * 0.5, h * 0.46, 8, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
      bg.addColorStop(0, V.alpha(C.paper2, 0.86));
      bg.addColorStop(1, V.alpha(C.paper, 0));
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      V.grid(ctx, w, h, C, 28, 0.13);
      var cx = w * 0.5, cy = h * 0.48;
      var scale = Math.min(w * 0.33, h * 0.34);
      var activeMode = mode === "js" || mode === "py";
      var centerGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 42);
      centerGlow.addColorStop(0, V.alpha(C.green, 0.26));
      centerGlow.addColorStop(0.55, V.alpha(C.gold, 0.10));
      centerGlow.addColorStop(1, V.alpha(C.paper, 0));
      ctx.fillStyle = centerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 42, 0, Math.PI * 2);
      ctx.fill();
      TOKENS.forEach(function (tok, i) {
        var active = activeMode && tok.lang === mode;
        var neutral = mode === "neutral";
        var pull = active ? 0.34 : 0;
        var x = cx + tok.base[0] * (1 - pull) * scale;
        var y = cy - tok.base[1] * (1 - pull) * scale;
        var weight = neutral ? 0.16 : (active ? 0.42 : 0.035);
        var alpha = neutral ? 0.78 : (active ? 1 : 0.28);
        ctx.save();
        ctx.globalAlpha = 0.10 + weight;
        ctx.strokeStyle = tok.color;
        ctx.lineWidth = 1 + weight * 12;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo((cx + x) / 2 + (i % 2 ? 18 : -18), (cy + y) / 2 - 22, x, y);
        ctx.stroke();
        ctx.restore();
        chip(ctx, tok.t, x, y, tok.color, alpha, active);
      });
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fillStyle = C.green;
      ctx.fill();
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = 2;
      ctx.stroke();
      V.label(ctx, DE ? "Bedeutung" : "meaning", cx, cy - 26, { font: '700 ' + Math.max(11, api.font("canvas-sm") + 1) + 'px "Barlow", sans-serif', color: C.petrol, align: "center" });
      V.label(ctx, DE ? "sortieren" : "sort", cx, cy + 26, { font: '600 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif', color: C.muted, align: "center" });
      V.heading(ctx, DE ? "Code-Oberfläche ist Rauschen" : "Code surface is noise", 14, 18, C.petrol, 10, 1);
      V.heading(ctx, mode === "neutral" ? (DE ? "Neutral" : "Neutral") : (mode === "js" ? "JavaScript" : "Python"), w - 14, 18, C.muted, 10, 1);
      canvas.setAttribute("aria-label", DE
        ? "Code-Oberfläche: function, def, quickSort, quick_sort und Varianten; Attention zieht die Formen der aktiven Sprache zur Bedeutung."
        : "Code surface: function, def, quickSort, quick_sort, and variants; attention pulls the active language's forms toward the meaning.");
      updateReadout();
    }
    function updateReadout() {
      if (mode === "js") {
        readout.innerHTML = '<span><b>JavaScript</b> function + quickSort</span><span><b>Attention</b> 42% + 42%</span><span>' + (DE ? "Die Formen rücken zur Bedeutung." : "The forms move toward the meaning.") + '</span>';
      } else if (mode === "py") {
        readout.innerHTML = '<span><b>Python</b> def + quick_sort</span><span><b>Attention</b> 42% + 42%</span><span>' + (DE ? "Die Formen rücken zur Bedeutung." : "The forms move toward the meaning.") + '</span>';
      } else {
        readout.innerHTML = '<span><b>' + (DE ? "Neutral" : "Neutral") + '</b> ' + (DE ? "alle Formen streuen" : "all forms scatter") + '</span><span><b>Attention</b> ' + (DE ? "schwach" : "weak") + '</span><span>' + (DE ? "Wähle JavaScript oder Python." : "Choose JavaScript or Python.") + '</span>';
      }
    }
    function setMode(next) {
      mode = next === "js" || next === "py" ? next : "neutral";
      buttons.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-code-mode") === mode); });
      draw();
    }
    buttons.forEach(function (b) {
      b.addEventListener("click", function () { setMode(b.getAttribute("data-code-mode")); });
    });
    function resize() { size = api.fit(canvas, stage); draw(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    return {
      update: function (s) { if (s && s.codeMode) setMode(s.codeMode); },
      setMode: setMode,
      next: function () { return false; },
      prev: function () { return false; },
      resize: resize,
      pause: function () {},
      resume: function () { draw(); },
      destroy: function () { window.removeEventListener("resize", resize); el.remove(); }
    };
  }

  core.register("codenoise", codeNoiseScene);
})();
