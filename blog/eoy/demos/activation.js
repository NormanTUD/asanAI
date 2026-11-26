(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function activationScene(root, api) {
    var DE = api.lang === "de";
    var fns = [
      { id: "relu", label: "ReLU", color: "green", tex: "\\operatorname{ReLU}(x)=\\max(0,x)",
        pros: DE ? ["billig und schnell", "spärlich (viele Nullen)", "keine Sättigung für positive Werte"] : ["cheap and fast", "sparse (many zeros)", "no saturation for positive values"],
        cons: DE ? ["Dead ReLU: Neuronen können dauerhaft 0 liefern", "nicht differenzierbar bei 0", "negative Information geht verloren"] : ["dead ReLU: neurons can output 0 forever", "not differentiable at 0", "negative information is lost"],
        uses: DE ? ["tiefe CNNs/MLPs", "Standard-Hidden-Layer", "Computer Vision"] : ["deep CNNs/MLPs", "standard hidden layer", "computer vision"] },
      { id: "gelu", label: "GELU", color: "gold", tex: "\\operatorname{GELU}(x)=x\\,\\Phi(x)",
        pros: DE ? ["glatt und differenzierbar", "gute Gradienten", "in Transformern bewährt"] : ["smooth and differentiable", "good gradients", "proven in transformers"],
        cons: DE ? ["teurer durch exp/tanh", "nicht monoton", "keine harte Sparsity"] : ["more expensive due to exp/tanh", "not monotonic", "no hard sparsity"],
        uses: DE ? ["Transformer/LLMs (BERT, GPT)", "moderne tiefe Netze", "Sprachmodelle"] : ["transformers/LLMs (BERT, GPT)", "modern deep networks", "language models"] },
      { id: "sigmoid", label: "Sigmoid", color: "blue", tex: "\\sigma(x)=\\frac{1}{1+e^{-x}}",
        pros: DE ? ["Ausgabe zwischen 0 und 1", "als Wahrscheinlichkeit interpretierbar", "glatt"] : ["output between 0 and 1", "interpretable as a probability", "smooth"],
        cons: DE ? ["sättigt stark", "Vanishing Gradients", "nicht nullzentriert"] : ["saturates strongly", "vanishing gradients", "not zero-centred"],
        uses: DE ? ["binäre Klassifikation", "Gates in LSTM/GRU", "Ausgabeschicht"] : ["binary classification", "gates in LSTM/GRU", "output layer"] },
      { id: "tanh", label: "tanh", color: "lilac", tex: "\\tanh(x)=\\frac{e^{2x}-1}{e^{2x}+1}",
        pros: DE ? ["nullzentriert", "glatt", "Wertebereich −1 bis 1"] : ["zero-centred", "smooth", "range −1 to 1"],
        cons: DE ? ["sättigt stark", "Vanishing Gradients", "exp ist teurer"] : ["saturates strongly", "vanishing gradients", "exp is more expensive"],
        uses: DE ? ["RNNs/LSTMs", "kleine MLPs", "Merkmals-Transformation"] : ["RNNs/LSTMs", "small MLPs", "feature transformation"] }
    ];
    var softmaxInfo = {
      pros: DE ? ["Ausgabe ist eine Verteilung (0 bis 1, Summe 1)", "Unterschiede werden verstärkt", "als Wahrscheinlichkeit interpretierbar"] : ["output is a distribution (0 to 1, sum 1)", "differences are amplified", "interpretable as a probability"],
      cons: DE ? ["kann überkonfident werden", "numerisch instabil ohne Max-Abzug", "sättigt bei großen Logits"] : ["can become overconfident", "numerically unstable without max subtraction", "saturates for large logits"],
      uses: DE ? ["Klassifikation", "nächstes Token im LLM", "Attention-Gewichte"] : ["classification", "next token in an LLM", "attention weights"]
    };
    var el = document.createElement("div");
    el.className = "ls-act-scene";
    el.innerHTML = '<div class="ls-act-stage"><canvas class="ls-canvas" role="img"></canvas><div class="ls-act-formula" aria-hidden="true">p<sub>i</sub> = e<sup>z<sub>i</sub></sup> / Σ<sub>j</sub> e<sup>z<sub>j</sub></sup></div></div>' +
      '<div class="ls-act-controls">' +
        '<div class="ls-act-chips"></div>' +
        '<div class="ls-act-softmax">' +
          '<div class="ls-act-presets" role="group" aria-label="' + (DE ? "Beispieldaten" : "Example data") + '">' +
            '<button type="button" class="ls-chip is-on" data-soft="positive">' + (DE ? "Positiv" : "Positive") + '</button>' +
            '<button type="button" class="ls-chip" data-soft="negative">' + (DE ? "Negativ" : "Negative") + '</button>' +
          '</div>' +
          '<label class="ls-act-csv-label">' + (DE ? "Eigene CSV" : "Own CSV") + '<input type="text" class="ls-act-csv" inputmode="decimal" spellcheck="false" placeholder="1, 2, 3, 4" aria-label="' + (DE ? "Eigene Werte als CSV" : "Own values as CSV") + '"></label>' +
          '<span class="ls-act-csv-status" aria-live="polite"></span>' +
        '</div>' +
      '</div>' +
      '<div class="ls-act-readout" aria-live="polite"></div>' +
      '<div class="ls-act-table-wrap"><table class="ls-act-table"><thead><tr><th>' + (DE ? "Vorteile" : "Pros") + '</th><th>' + (DE ? "Nachteile" : "Cons") + '</th><th>' + (DE ? "Anwendung" : "Use") + '</th></tr></thead><tbody><tr><td data-cell="pros"></td><td data-cell="cons"></td><td data-cell="uses"></td></tr></tbody></table></div>' +
      '<details class="ls-act-cdf"><summary>' + (DE ? "Optional: Was ist Φ (CDF)?" : "Optional: what is Φ (CDF)?") + '</summary><p>' + (DE ? "Φ(x) ist die kumulative Verteilungsfunktion (CDF) der Standardnormalverteilung: Φ(x) = P(Z ≤ x). GELU gewichtet x mit dieser Wahrscheinlichkeit; die Demo nutzt dafür die tanh-Näherung mit 0.044715." : "Φ(x) is the cumulative distribution function (CDF) of the standard normal distribution: Φ(x) = P(Z ≤ x). GELU weights x by this probability; the demo uses the tanh approximation with 0.044715 for it.") + '</p></details>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-act-stage");
    var canvas = el.querySelector("canvas");
    var chips = el.querySelector(".ls-act-chips");
    var readout = el.querySelector(".ls-act-readout");
    var tableCells = {
      pros: el.querySelector('[data-cell="pros"]'),
      cons: el.querySelector('[data-cell="cons"]'),
      uses: el.querySelector('[data-cell="uses"]')
    };
    var softChips = el.querySelectorAll("[data-soft]");
    var csvInput = el.querySelector(".ls-act-csv");
    var csvStatus = el.querySelector(".ls-act-csv-status");
    var formulaEl = el.querySelector(".ls-act-formula");
    var softPositive = [1, 2, 3, 4];
    var softNegative = [-3, -2, -1, 0];
    var softFrom = softPositive.slice();
    var softTo = softPositive.slice();
    var softMix = 1, softStart = 0, softPreset = "positive", softHits = [];
    var ctx = null, size = null, active = window.__lsActLast || "relu", hits = [];
    var fromId = active, morph = 1, morphStart = 0, morphRaf = 0;
    var mode = "activation", modeT = 0, modeFrom = 0, modeTarget = 0, modeStart = 0, modeRaf = 0;
    var csvTimer = 0;
    var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var C = api.colors();
    function f(id, x) {
      if (id === "relu") return Math.max(0, x);
      if (id === "gelu") return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)));
      if (id === "sigmoid") return 1 / (1 + Math.exp(-x));
      return Math.tanh(x);
    }
    function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
    function num(v, digits) {
      var s = v.toFixed(digits);
      return DE ? s.replace(".", ",") : s;
    }
    function mathHTML(tex) {
      var safe = esc(tex);
      return '<span class="ls-math ls-math--inline" data-tex="' + safe + '" data-tex-display="false"><code class="ls-tex-source">' + safe + '</code></span>';
    }
    function softmax(vals) {
      var max = Math.max.apply(null, vals);
      var exps = vals.map(function (v) { return Math.exp(v - max); });
      var sum = exps.reduce(function (a, b) { return a + b; }, 0) || 1;
      return exps.map(function (e) { return e / sum; });
    }
    function softDisplay() {
      var out = [];
      var mix = ease(clamp(softMix, 0, 1));
      for (var i = 0; i < softTo.length; i++) {
        var from = softFrom[i] == null ? softTo[i] : softFrom[i];
        out.push(lerp(from, softTo[i], mix));
      }
      return out;
    }
    function parseCsv(text) {
      var parts = String(text).split(/[\s,;]+/).filter(Boolean);
      if (parts.length < 2 || parts.length > 8) return null;
      var vals = parts.map(function (p) { return Number(p); });
      for (var i = 0; i < vals.length; i++) if (!isFinite(vals[i])) return null;
      return vals;
    }
    function geometry() {
      var pad = 34, w = size.w, h = size.h;
      var x0 = pad, x1 = w - pad, y0 = h - pad, y1 = pad;
      var base0 = y0 - (1.2 / 4.4) * (y0 - y1);
      var baseY = lerp(base0, y0 - 0.56 * (y0 - y1), smooth(modeT));
      return {
        pad: pad, x0: x0, x1: x1, y0: y0, y1: y1, base0: base0, baseY: baseY,
        sx: function (x) { return x0 + (x + 3) / 6 * (x1 - x0); },
        sy: function (y) { return y0 - (y + 1.2) / 4.4 * (y0 - y1); }
      };
    }
    function drawActivation(g) {
      var t = smooth(modeT), alpha = 1 - t;
      hits = [];
      if (alpha <= 0.001) return;
      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      for (var gx = -3; gx <= 3; gx++) { ctx.beginPath(); ctx.moveTo(g.sx(gx), g.y1); ctx.lineTo(g.sx(gx), g.y0); ctx.stroke(); }
      for (var gy = -1; gy <= 3; gy++) { ctx.beginPath(); ctx.moveTo(g.x0, g.sy(gy)); ctx.lineTo(g.x1, g.sy(gy)); ctx.stroke(); }
      ctx.strokeStyle = C.lineStrong;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(g.x0, g.base0); ctx.lineTo(g.x1, g.base0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(g.sx(0), g.y0); ctx.lineTo(g.sx(0), g.y1); ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("x", g.x1 - 4, g.base0 - 6);
      ctx.fillText("y", g.sx(0) + 8, g.y1 + 8);
      ctx.restore();
      var front = fns.filter(function (fn) { return fn.id === active; })[0];
      if (!front) return;
      var morphEase = ease(clamp(morph, 0, 1));
      ctx.save();
      ctx.beginPath();
      for (var i = 0; i <= 120; i++) {
        var x = -3 + 6 * i / 120;
        var value = morph < 1 ? lerp(f(fromId, x), f(front.id, x), morphEase) : f(front.id, x);
        var px = g.sx(x), py = lerp(g.sy(value), g.baseY, t);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = C[front.color];
      ctx.globalAlpha = alpha * (morph < 1 ? 0.55 + 0.45 * morphEase : 1);
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.restore();
      var endY = lerp(g.sy(f(front.id, 2.6)), g.baseY, t);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = C[front.color];
      ctx.font = '700 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      var labelY = endY + (front.id === "sigmoid" || front.id === "tanh" ? -10 : 3);
      ctx.fillText(front.label, g.sx(2.65), labelY);
      ctx.restore();
      if (modeT < 0.35) hits.push({ id: front.id, x: g.sx(2.65) + 12, y: endY, r: 18 });
    }
    function drawSoftmax(g) {
      var t = smooth(modeT);
      softHits = [];
      if (t <= 0.001) return;
      var vals = softDisplay();
      var ps = softmax(vals);
      var n = vals.length;
      var maxAbs = Math.max.apply(null, vals.map(function (v) { return Math.abs(v); }).concat([1e-9]));
      var x0 = g.x0 + 18, x1 = g.x1 - 18;
      var slotW = (x1 - x0) / n;
      var top = g.y1 + 28, bottom = g.y0 - 12;
      var upper = Math.max(24, g.baseY - top);
      var lower = Math.max(16, bottom - g.baseY);
      var unit = Math.min(upper, lower) * 0.92 / maxAbs;
      var barW = Math.min(20, slotW * 0.26);
      var stagger = Math.min(0.045, 0.28 / Math.max(1, n - 1));
      var denom = Math.max(0.01, 1 - (n - 1) * stagger);
      ctx.save();
      ctx.globalAlpha = t;
      ctx.strokeStyle = C.lineStrong;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x0, g.baseY); ctx.lineTo(x1, g.baseY); ctx.stroke();
      ctx.globalAlpha = t * 0.9;
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("z = " + (DE ? "Eingabe" : "input") + " · p = " + (DE ? "Wahrscheinlichkeit" : "probability"), x0, g.y1 + 10);
      for (var i = 0; i < n; i++) {
        var z = vals[i], p = ps[i];
        var cx = x0 + slotW * (i + 0.5);
        var grow = smooth(clamp((t - i * stagger) / denom, 0, 1));
        var zh = Math.abs(z) * unit * grow;
        var ph = p * upper * grow;
        var zTop = z >= 0 ? g.baseY - zh : g.baseY;
        ctx.globalAlpha = t * 0.55;
        ctx.fillStyle = C.blue;
        ctx.fillRect(cx - barW - 2, zTop, barW, zh);
        ctx.globalAlpha = t * 0.95;
        ctx.fillStyle = C.gold;
        ctx.fillRect(cx + 2, g.baseY - ph, barW, ph);
        ctx.globalAlpha = t * grow;
        ctx.textAlign = "center";
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.fillStyle = C.blue;
        ctx.fillText(num(z, 2), cx - barW / 2 - 1, z >= 0 ? g.baseY - zh - 6 : g.baseY + 12);
        ctx.fillStyle = C.gold;
        ctx.fillText(Math.round(p * 100) + "%", cx + barW / 2 + 1, g.baseY - ph - 6);
        softHits.push({ i: i, cx: cx, x0: x0 + slotW * i, x1: x0 + slotW * (i + 1), z: z, p: p });
      }
      ctx.restore();
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      var g = geometry();
      drawActivation(g);
      drawSoftmax(g);
    }
    function updateTable(info) {
      ["pros", "cons", "uses"].forEach(function (key) {
        var cell = tableCells[key];
        if (!cell) return;
        cell.innerHTML = '<ul>' + info[key].map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul>';
      });
    }
    function updateReadout() {
      if (mode === "softmax") {
        var ps = softmax(softDisplay());
        var sum = ps.reduce(function (a, b) { return a + b; }, 0);
        var label = softPreset === "positive" ? (DE ? "positive Werte" : "positive values") : softPreset === "negative" ? (DE ? "negative Werte" : "negative values") : (DE ? "eigene CSV" : "own CSV");
        readout.innerHTML = '<span><b>Softmax</b> ' + label + ' · ' + (DE ? "Summe p = " : "sum p = ") + num(sum, 2) + '</span><span>' + (DE ? "Große Abstände werden verstärkt; negative Werte sind erlaubt, ein Offset kürzt sich heraus." : "Large gaps are amplified; negative values are allowed, and an offset cancels out.") + '</span>';
        updateTable(softmaxInfo);
      } else {
        var info = fns.filter(function (fn) { return fn.id === active; })[0];
        readout.innerHTML = mathHTML(info.tex);
        if (api.typeset) { try { api.typeset(readout); } catch (e) {} }
        updateTable(info);
      }
    }
    function updatePresetChips() {
      softChips.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-soft") === softPreset); });
    }
    function setSoftValues(vals, preset) {
      if (!vals || vals.length < 2) return;
      softFrom = softDisplay();
      softTo = vals.slice();
      softPreset = preset || "custom";
      softMix = reducedMotion ? 1 : 0;
      softStart = performance.now();
      updatePresetChips();
      updateReadout();
      if (reducedMotion) {
        softFrom = softTo.slice();
        draw();
      } else {
        startAnim();
      }
    }
    function stepAnim(now) {
      var p = clamp((now - modeStart) / 560, 0, 1);
      modeT = lerp(modeFrom, modeTarget, ease(p));
      var s = 1;
      if (softMix < 1) {
        s = clamp((now - softStart) / 420, 0, 1);
        softMix = s;
      }
      draw();
      if (p < 1 || s < 1) modeRaf = requestAnimationFrame(stepAnim);
      else {
        modeRaf = 0;
        softMix = 1;
        softFrom = softTo.slice();
        updateReadout();
      }
    }
    function startAnim() {
      if (reducedMotion) {
        modeT = modeTarget;
        softMix = 1;
        softFrom = softTo.slice();
        draw();
        return;
      }
      modeFrom = modeT;
      modeStart = performance.now();
      if (!modeRaf) modeRaf = requestAnimationFrame(stepAnim);
    }
    function setMode(next) {
      next = next === "softmax" ? "softmax" : "activation";
      if (next === mode) { updateReadout(); return; }
      mode = next;
      el.classList.toggle("is-softmax", mode === "softmax");
      canvas.setAttribute("data-tip", mode === "softmax"
        ? (DE ? "Softmax: Eingaben z werden zu Wahrscheinlichkeiten p; Summe p = 1." : "Softmax: inputs z become probabilities p; sum p = 1.")
        : (DE ? "Aktivierungskurve; achte auf Nullpunkt und Steigung." : "Activation curve; watch the zero crossing and slope."));
      canvas.setAttribute("aria-label", mode === "softmax"
        ? (DE ? "Softmax: Eingabewerte und ihre Wahrscheinlichkeiten." : "Softmax: input values and their probabilities.")
        : (DE ? "Aktivierungsfunktionen: ReLU, GELU, Sigmoid, tanh." : "Activation functions: ReLU, GELU, sigmoid, tanh."));
      if (formulaEl) formulaEl.setAttribute("aria-hidden", mode === "softmax" ? "false" : "true");
      modeTarget = mode === "softmax" ? 1 : 0;
      updateReadout();
      startAnim();
    }
    function morphFrame(now) {
      morph = Math.min(1, (now - morphStart) / 420);
      draw();
      if (morph < 1) morphRaf = requestAnimationFrame(morphFrame);
      else morphRaf = 0;
    }
    function setActive(id) {
      if (id === active) return;
      fromId = active;
      active = id;
      window.__lsActLast = active;
      morph = reducedMotion ? 1 : 0;
      morphStart = performance.now();
      if (morphRaf) cancelAnimationFrame(morphRaf);
      if (!reducedMotion) morphRaf = requestAnimationFrame(morphFrame);
      chips.querySelectorAll(".ls-chip").forEach(function (b) {
        var fn = fns.filter(function (f2) { return f2.id === id; })[0];
        if (fn) b.classList.toggle("is-on", b.textContent === fn.label);
      });
      updateReadout();
      draw();
    }
    fns.forEach(function (fn) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-chip" + (fn.id === active ? " is-on" : "");
      b.textContent = fn.label;
      b.setAttribute("data-tip", DE ? "Stellt die Kurve auf " + fn.label + " um." : "Switches the curve to " + fn.label + ".");
      b.addEventListener("click", function () {
        setActive(fn.id);
        chips.querySelectorAll(".ls-chip").forEach(function (x) { x.classList.toggle("is-on", x === b); });
      });
      chips.appendChild(b);
    });
    softChips.forEach(function (b) {
      var isNeg = b.getAttribute("data-soft") === "negative";
      b.setAttribute("data-tip", isNeg ? "z = [-3, -2, -1, 0]" : "z = [1, 2, 3, 4]");
      b.addEventListener("click", function () {
        var preset = b.getAttribute("data-soft");
        setSoftValues(preset === "negative" ? softNegative : softPositive, preset);
      });
    });
    csvInput.addEventListener("input", function () {
      clearTimeout(csvTimer);
      csvTimer = setTimeout(function () {
        var text = csvInput.value.trim();
        if (!text) { csvStatus.textContent = ""; csvStatus.classList.remove("is-error"); return; }
        var vals = parseCsv(text);
        if (!vals) {
          csvStatus.textContent = DE ? "Bitte 2–8 Zahlen mit Komma trennen." : "Enter 2–8 numbers separated by commas.";
          csvStatus.classList.add("is-error");
          return;
        }
        csvStatus.textContent = DE ? "Übernommen: " + vals.length + " Werte" : "Applied: " + vals.length + " values";
        csvStatus.classList.remove("is-error");
        setSoftValues(vals, "custom");
      }, 220);
    });
    canvas.addEventListener("pointerup", function (e) {
      if (modeT > 0.35) return;
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      hits.forEach(function (h) {
        if (Math.hypot(h.x - x, h.y - y) < h.r) {
          setActive(h.id);
          chips.querySelectorAll(".ls-chip").forEach(function (b) {
            var fn = fns.filter(function (f2) { return f2.id === h.id; })[0];
            if (fn) b.classList.toggle("is-on", b.textContent === fn.label);
          });
        }
      });
    });
    core.canvasTip(canvas, function (px, py) {
      if (!size) return "";
      var g = geometry();
      if (modeT > 0.5) {
        if (px < g.x0 - 8 || px > g.x1 + 8 || py < g.y1 - 8 || py > g.y0 + 8) return "";
        var best = null, bd = Infinity;
        softHits.forEach(function (h) {
          var d = px >= h.x0 && px <= h.x1 ? Math.abs(px - h.cx) : Math.min(Math.abs(px - h.x0), Math.abs(px - h.x1)) + 40;
          if (d < bd) { bd = d; best = h; }
        });
        if (!best) return DE ? "Softmax: Eingaben z werden zu Wahrscheinlichkeiten p." : "Softmax: inputs z become probabilities p.";
        return DE
          ? "z_" + (best.i + 1) + " = " + num(best.z, 2) + " → p_" + (best.i + 1) + " = " + (best.p * 100).toFixed(1) + " %. Summe p = 1."
          : "z_" + (best.i + 1) + " = " + num(best.z, 2) + " → p_" + (best.i + 1) + " = " + (best.p * 100).toFixed(1) + " %. Sum p = 1.";
      }
      if (px < g.x0 - 8 || px > g.x1 + 8 || py < g.y1 - 8 || py > g.y0 + 8) return "";
      var x = clamp(-3 + (px - g.x0) / (g.x1 - g.x0) * 6, -3, 3);
      var fn = fns.filter(function (item) { return item.id === active; })[0] || fns[0];
      var value = f(active, x);
      var slope = (f(active, x + 0.01) - f(active, x - 0.01)) / 0.02;
      var zero = Math.abs(x) < 0.04 ? (DE ? " · hier liegt der Nullpunkt." : " · this is the zero crossing.") : "";
      return DE
        ? fn.label + " bei x = " + num(x, 2) + ": f(x) = " + num(value, 3) + ". Steigung ≈ " + num(slope, 2) + zero
        : fn.label + " at x = " + num(x, 2) + ": f(x) = " + num(value, 3) + ". Slope ≈ " + num(slope, 2) + zero;
    });
    function resize() { size = api.fit(canvas, stage); draw(); }
    window.addEventListener("resize", resize);
    canvas.setAttribute("data-tip", DE ? "Zeigt die Aktivierungskurve; achte auf Nullpunkt und Steigung." : "Shows the activation curve; watch the zero crossing and slope.");
    canvas.setAttribute("aria-label", DE ? "Aktivierungsfunktionen: ReLU, GELU, Sigmoid, tanh." : "Activation functions: ReLU, GELU, sigmoid, tanh.");
    function activeIndex() {
      var ids = fns.map(function (fn) { return fn.id; });
      return ids.indexOf(active);
    }
    function next() {
      if (mode === "softmax") {
        if (softPreset === "negative") return false;
        if (softPreset === "custom") { setSoftValues(softPositive, "positive"); return true; }
        setSoftValues(softNegative, "negative");
        return true;
      }
      var idx = activeIndex();
      if (idx < 0 || idx >= fns.length - 1) return false;
      setActive(fns[idx + 1].id);
      return true;
    }
    function prev() {
      if (mode === "softmax") {
        if (softPreset === "positive") return false;
        if (softPreset === "custom") { setSoftValues(softNegative, "negative"); return true; }
        setSoftValues(softPositive, "positive");
        return true;
      }
      var idx = activeIndex();
      if (idx <= 0) return false;
      setActive(fns[idx - 1].id);
      return true;
    }
    function hasNext() {
      if (mode === "softmax") return softPreset !== "negative";
      return activeIndex() < fns.length - 1;
    }
    function hasPrev() {
      if (mode === "softmax") return softPreset !== "positive";
      return activeIndex() > 0;
    }
    updateReadout();
    resize();
    return {
      update: function (s) {
        if (!s) return;
        if (s.mode === "softmax") setMode("softmax");
        else if (s.mode === "activation") setMode("activation");
      },
      next: next,
      prev: prev,
      hasNext: hasNext,
      hasPrev: hasPrev,
      resize: resize,
      destroy: function () {
        if (morphRaf) cancelAnimationFrame(morphRaf);
        if (modeRaf) cancelAnimationFrame(modeRaf);
        clearTimeout(csvTimer);
        window.removeEventListener("resize", resize);
        el.remove();
      }
    };
  }

  core.register("activation", activationScene);
})();
