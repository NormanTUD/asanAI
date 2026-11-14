(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function activationScene(root, api) {
    var DE = api.lang === "de";
    var fns = [
      { id: "relu", label: "ReLU", color: "green", desc: DE ? "flat, dann ein Anstieg" : "flat, then a rise" },
      { id: "gelu", label: "GELU", color: "gold", desc: DE ? "glatt, kleiner Dip" : "smooth, small dip" },
      { id: "sigmoid", label: "Sigmoid", color: "blue", desc: DE ? "S-Kurve, 0 bis 1" : "S-shape, 0 to 1" },
      { id: "tanh", label: "tanh", color: "lilac", desc: DE ? "S-Kurve, -1 bis 1" : "S-shape, -1 to 1" }
    ];
    var el = document.createElement("div");
    el.className = "ls-act-scene";
    el.innerHTML = '<div class="ls-act-stage"><canvas class="ls-canvas" role="img"></canvas></div><div class="ls-scene-row ls-act-chips"></div><div class="ls-act-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-act-stage");
    var canvas = el.querySelector("canvas");
    var chips = el.querySelector(".ls-act-chips");
    var readout = el.querySelector(".ls-act-readout");
    var ctx = null, size = null, active = window.__lsActLast || "relu", hits = [];
    var C = api.colors();
    function f(id, x) {
      if (id === "relu") return Math.max(0, x);
      if (id === "gelu") return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)));
      if (id === "sigmoid") return 1 / (1 + Math.exp(-x));
      return Math.tanh(x);
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      var pad = 34, w = size.w, h = size.h;
      var x0 = pad, x1 = w - pad, y0 = h - pad, y1 = pad;
      function sx(x) { return x0 + (x + 3) / 6 * (x1 - x0); }
      function sy(y) { return y0 - (y + 1.2) / 4.4 * (y0 - y1); }
      ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      for (var g = -3; g <= 3; g++) { ctx.beginPath(); ctx.moveTo(sx(g), y1); ctx.lineTo(sx(g), y0); ctx.stroke(); }
      for (var gy = -1; gy <= 3; gy++) { ctx.beginPath(); ctx.moveTo(x0, sy(gy)); ctx.lineTo(x1, sy(gy)); ctx.stroke(); }
      ctx.strokeStyle = C.lineStrong; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x0, sy(0)); ctx.lineTo(x1, sy(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx(0), y0); ctx.lineTo(sx(0), y1); ctx.stroke();
      ctx.fillStyle = C.muted; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; ctx.textAlign = "center";
      ctx.fillText("x", x1 - 4, sy(0) - 6); ctx.fillText("y", sx(0) + 8, y1 + 8);
      hits = [];
      var front = fns.filter(function (fn) { return fn.id === active; })[0];
      if (front) {
        var fn = front;
        ctx.beginPath();
        for (var i = 0; i <= 120; i++) {
          var x = -3 + 6 * i / 120;
          var px = sx(x), py = sy(f(x ? fn.id : fn.id, x));
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = C[fn.color];
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
        var end = sy(f(fn.id, 2.6));
        ctx.fillStyle = C[fn.color];
        ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(fn.label, sx(2.65), end + 3);
        hits.push({ id: fn.id, x: sx(2.65) + 12, y: end, r: 18 });
      }
      var info = fns.filter(function (fn) { return fn.id === active; })[0];
      readout.innerHTML = '<span><b>' + info.label + '</b> ' + info.desc + '</span><span>' + (DE ? "Schritt " : "Step ") + (fns.indexOf(info) + 1) + " / " + fns.length + '</span><span>' + (DE ? "ReLU ist nicht injektiv; glatte Aktivierungen bleiben für endliche Eingaben umkehrbar." : "ReLU is not injective; smooth activations stay invertible for finite inputs.") + '</span>';
      canvas.setAttribute("aria-label", DE ? "Aktivierungsfunktionen: ReLU, GELU, Sigmoid, tanh" : "Activation functions: ReLU, GELU, sigmoid, tanh");
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    fns.forEach(function (fn) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-chip" + (fn.id === active ? " is-on" : "");
      b.textContent = fn.label;
      b.addEventListener("click", function () {
        active = fn.id;
        window.__lsActLast = active;
        chips.querySelectorAll(".ls-chip").forEach(function (x) { x.classList.toggle("is-on", x === b); });
        draw();
      });
      chips.appendChild(b);
    });
    canvas.addEventListener("pointerup", function (e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      hits.forEach(function (h) { if (Math.hypot(h.x - x, h.y - y) < h.r) { active = h.id; chips.querySelectorAll(".ls-chip").forEach(function (b) { b.classList.toggle("is-on", b.textContent === fns.filter(function (f2) { return f2.id === h.id; })[0].label); }); draw(); } });
    });
    function stepFn(delta) {
      var idx = fns.map(function (fn) { return fn.id; }).indexOf(active) + delta;
      if (idx < 0 || idx >= fns.length) return false;
      active = fns[idx].id;
      window.__lsActLast = active;
      chips.querySelectorAll(".ls-chip").forEach(function (x, i) { x.classList.toggle("is-on", i === idx); });
      draw();
      return true;
    }
    window.addEventListener("resize", resize);
    resize();
    return {
      update: function () {},
      next: function () { return stepFn(1); },
      prev: function () { return stepFn(-1); },
      onKey: function (e) { return api.util.arrowKey(e, function () { return stepFn(1); }, function () { return stepFn(-1); }); },
      resize: resize,
      destroy: function () { window.removeEventListener("resize", resize); el.remove(); }
    };
  }

  core.register("activation", activationScene);
})();
