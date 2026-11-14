(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function codeSemanticScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var el = document.createElement("div");
    el.className = "ls-codesem-scene";
    el.innerHTML = '<div class="ls-codesem-stage"><canvas class="ls-codesem-canvas" role="img"></canvas></div>' +
      '<div class="ls-codesem-modes" role="group" aria-label="' + (DE ? "Kontext" : "Context") + '">' +
        '<button type="button" class="ls-chip is-on" data-sem-mode="both">' + (DE ? "Beide" : "Both") + '</button>' +
        '<button type="button" class="ls-chip" data-sem-mode="py">Python</button>' +
        '<button type="button" class="ls-chip" data-sem-mode="js">JavaScript</button>' +
      '</div>' +
      '<div class="ls-codesem-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-codesem-stage");
    var canvas = el.querySelector(".ls-codesem-canvas");
    var readout = el.querySelector(".ls-codesem-readout");
    var modeBtns = Array.prototype.slice.call(el.querySelectorAll("[data-sem-mode]"));
    var C = api.colors();
    var size = null, ctx = null, mode = "both";
    var TOKENS = [
      { t: "def", lang: "py", y: 0.24, node: "fn", color: C.green },
      { t: "quick_sort", lang: "py", y: 0.40, node: "qs", color: C.green },
      { t: "function", lang: "js", y: 0.60, node: "fn", color: C.blue },
      { t: "quickSort", lang: "js", y: 0.76, node: "qs", color: C.blue }
    ];
    function chip(ctx, text, x, y, color, alpha, active) {
      ctx.save();
      ctx.font = '700 ' + Math.max(10, api.font("canvas-sm") + 1) + 'px ui-monospace,"Cascadia Code",Menlo,Consolas,monospace';
      var tw = ctx.measureText(text).width;
      var w = tw + 16, h = 26;
      var bx = x - w / 2, by = y - h / 2;
      ctx.globalAlpha = alpha;
      if (active) { ctx.shadowColor = V.alpha(color, 0.42); ctx.shadowBlur = 14; }
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
    function node(ctx, x, y, label, sub, color, active) {
      ctx.save();
      var glow = ctx.createRadialGradient(x, y, 2, x, y, 34);
      glow.addColorStop(0, V.alpha(color, active ? 0.34 : 0.14));
      glow.addColorStop(1, V.alpha(C.paper, 0));
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fillStyle = active ? color : V.alpha(color, 0.55);
      ctx.fill();
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = C.paper;
      ctx.font = '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Barlow", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sub, x, y + 0.5);
      V.label(ctx, label, x, y - 26, { font: '700 ' + Math.max(10, api.font("canvas-sm") + 1) + 'px "Barlow", sans-serif', color: active ? color : C.petrol, align: "center" });
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, w, h);
      var bg = ctx.createRadialGradient(w * 0.55, h * 0.48, 8, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
      bg.addColorStop(0, V.alpha(C.paper2, 0.9));
      bg.addColorStop(1, V.alpha(C.paper, 0));
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      V.grid(ctx, w, h, C, 28, 0.13);
      var leftX = w * 0.20, nodeX = w * 0.72;
      var fnY = h * 0.32, qsY = h * 0.68;
      var pyOn = mode === "both" || mode === "py";
      var jsOn = mode === "both" || mode === "js";
      var fnActive = pyOn || jsOn;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = V.alpha(C.line, 0.9);
      ctx.lineWidth = 1;
      ctx.strokeRect(w * 0.045, h * 0.105, w * 0.34, h * 0.79);
      ctx.restore();
      V.label(ctx, DE ? "Oberfläche · Rauschen" : "surface · noise", w * 0.045 + 6, h * 0.105 - 8, { font: '600 ' + Math.max(9, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif', color: C.muted, bg: false });
      V.label(ctx, DE ? "Bedeutung" : "meaning", nodeX, h * 0.105 - 8, { font: '700 ' + Math.max(10, api.font("canvas-sm")) + 'px "Barlow", sans-serif', color: C.petrol, align: "center" });
      V.label(ctx, "Python", w * 0.06, h * 0.18, { font: '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif', color: C.green });
      V.label(ctx, "JavaScript", w * 0.06, h * 0.54, { font: '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif', color: C.blue });
      TOKENS.forEach(function (tok) {
        var on = tok.lang === "py" ? pyOn : jsOn;
        var x = leftX, y = h * tok.y;
        var tx = nodeX, ty = tok.node === "fn" ? fnY : qsY;
        ctx.save();
        ctx.globalAlpha = on ? 0.55 : 0.12;
        ctx.strokeStyle = tok.color;
        ctx.lineWidth = on ? 2 : 1;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo((x + tx) / 2, (y + ty) / 2 - (tok.node === "fn" ? 24 : -24), tx, ty);
        ctx.stroke();
        ctx.restore();
        chip(ctx, tok.t, x, y, tok.color, on ? 1 : 0.22, on);
      });
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(nodeX, fnY + 18);
      ctx.lineTo(nodeX, qsY - 18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(nodeX, qsY - 18);
      ctx.lineTo(nodeX - 5, qsY - 27);
      ctx.lineTo(nodeX + 5, qsY - 27);
      ctx.closePath();
      ctx.fillStyle = C.gold;
      ctx.fill();
      ctx.restore();
      V.label(ctx, DE ? "ruft auf" : "calls", nodeX + 10, (fnY + qsY) / 2, { font: '600 ' + Math.max(9, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif', color: C.gold });
      node(ctx, nodeX, fnY, DE ? "Funktionsaufruf" : "function call", "f()", C.petrol, fnActive);
      node(ctx, nodeX, qsY, "Quicksort", "Q", C.green, fnActive);
      V.heading(ctx, DE ? "Verschiedene Oberflächen, eine Bedeutung" : "Different surfaces, one meaning", 14, 18, C.petrol, 10, 1);
      V.heading(ctx, mode === "both" ? (DE ? "Beide" : "Both") : (mode === "py" ? "Python" : "JavaScript"), w - 14, 18, C.muted, 10, 1);
      canvas.setAttribute("aria-label", DE
        ? "Abstrakte Repräsentation: def und function zeigen auf denselben Funktionsaufruf; quick_sort und quickSort auf denselben Quicksort-Knoten."
        : "Abstract representation: def and function point to the same function call; quick_sort and quickSort to the same Quicksort node.");
      updateReadout();
    }
    function updateReadout() {
      if (mode === "py") {
        readout.innerHTML = '<span><b>Python</b> def + quick_sort</span><span><b>' + (DE ? "abstrakt" : "abstract") + '</b> f() → Quicksort</span><span>' + (DE ? "Attention hebt die gemeinsame Bedeutung hervor." : "Attention highlights the shared meaning.") + '</span>';
      } else if (mode === "js") {
        readout.innerHTML = '<span><b>JavaScript</b> function + quickSort</span><span><b>' + (DE ? "abstrakt" : "abstract") + '</b> f() → Quicksort</span><span>' + (DE ? "Attention hebt die gemeinsame Bedeutung hervor." : "Attention highlights the shared meaning.") + '</span>';
      } else {
        readout.innerHTML = '<span><b>' + (DE ? "Beide" : "Both") + '</b> def/function → f(); quick_sort/quickSort → Quicksort</span><span>' + (DE ? "Die Oberfläche ist Rauschen." : "The surface is noise.") + '</span>';
      }
    }
    function setMode(next) {
      mode = next === "py" || next === "js" ? next : "both";
      modeBtns.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-sem-mode") === mode); });
      draw();
    }
    modeBtns.forEach(function (b) {
      b.addEventListener("click", function () { setMode(b.getAttribute("data-sem-mode")); });
    });
    function resize() { size = api.fit(canvas, stage); draw(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    return {
      update: function (s) { if (s && s.semMode) setMode(s.semMode); },
      setMode: setMode,
      next: function () { return false; },
      prev: function () { return false; },
      resize: resize,
      pause: function () {},
      resume: function () { draw(); },
      destroy: function () { window.removeEventListener("resize", resize); el.remove(); }
    };
  }

  core.register("codesemantic", codeSemanticScene);
})();
