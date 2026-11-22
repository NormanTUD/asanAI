(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;

  function bars(n, className) {
    var out = "";
    for (var i = 0; i < n; i++) out += "<i></i>";
    return '<span class="' + className + '">' + out + "</span>";
  }

  function group(step, label, inner) {
    return '<div class="ls-hc-group" data-hc-step="' + step + '">' +
      '<span class="ls-hc-label">' + label + "</span>" + inner + "</div>";
  }

  function matrix(cols, rows) {
    var out = "";
    for (var i = 0; i < cols * rows; i++) out += "<i></i>";
    return '<span class="ls-hc-matrix" style="--hc-cols:' + cols + '">' + out + "</span>";
  }

  function headsHtml() {
    var out = "";
    for (var i = 1; i <= 4; i++) {
      out += '<span class="ls-hc-head"><b>H' + i + "</b>" + bars(4, "ls-hc-bars") + "</span>";
    }
    return '<span class="ls-hc-heads">' + out + "</span>";
  }

  function concatHtml() {
    var colors = ["sky", "green", "gold", "lilac"];
    var labels = ["h₁", "h₂", "h₃", "h₄"];
    var out = "";
    labels.forEach(function (label, i) {
      out += '<span class="ls-hc-concat-row" style="--hc-color:var(--ls-' + colors[i] + ')"><b>' + label + "</b><i></i><i></i><i></i></span>";
    });
    return '<span class="ls-hc-concat-block">' + out + "</span>";
  }

  function tokensHtml(DE) {
    var toks = DE ? ["Der", "Hund", "läuft", "."] : ["The", "dog", "runs", "."];
    return '<span class="ls-hc-tokens">' + toks.map(function (t) {
      return '<span class="ls-hc-token"><b>' + t + "</b>" + bars(3, "ls-hc-token-bars") + "</span>";
    }).join("") + "</span>";
  }

  function flowScene(root, api, mode) {
    var DE = api.lang === "de";
    var concat = mode === "concat";
    var notes = concat
      ? [
          DE ? "Jeder Head liefert pro Token einen eigenen Vektor." : "Each head produces its own vector per token.",
          DE ? "Concat hängt die vier Head-Vektoren hintereinander. Aus vier kurzen Vektoren wird ein langer." : "Concat joins the four head vectors. Four short vectors become one long one.",
          DE ? "Die Matrix <b>W<sub>O</sub></b> fasst die vier Head-Ergebnisse zu einem gemeinsamen Vektor zusammen. Das FFN bekommt also einen einzigen Token-Vektor, nicht vier getrennte Eingänge." : "The matrix <b>W<sub>O</sub></b> combines the four head results into one shared vector. The FFN therefore receives a single token vector, not four separate inputs."
        ]
      : [
          DE ? "Das FFN bekommt einen einzigen Vektor pro Token, nicht die einzelnen Heads." : "The FFN receives a single vector per token, not the individual heads.",
          DE ? "<b>W<sub>1</sub></b> macht daraus viele einzelne Hidden-Werte." : "<b>W<sub>1</sub></b> turns it into many individual hidden values.",
          DE ? "Die Aktivierung biegt jeden Hidden-Wert." : "The activation bends each hidden value.",
          DE ? "<b>W<sub>2</sub></b> macht aus den vielen Hidden-Werten wieder einen Vektor pro Token. Das Ergebnis geht zurück auf die einzelnen Tokens; jeder Token bekommt seinen eigenen neuen Vektor." : "<b>W<sub>2</sub></b> turns the many hidden values back into one vector per token. The result goes back to the individual tokens; each token receives its own new vector."
        ];
    var stage = 0;
    var last = notes.length - 1;
    var stageHtml;
    if (concat) {
      stageHtml =
        group(0, DE ? "Heads" : "heads", headsHtml()) +
        '<span class="ls-hc-arrow">→</span>' +
        group(1, "Concat", concatHtml()) +
        '<span class="ls-hc-arrow">→</span>' +
        group(2, "W_O", matrix(4, 4)) +
        '<span class="ls-hc-arrow">→</span>' +
        group(2, DE ? "Token-Vektor" : "token vector", bars(5, "ls-hc-vector")) +
        '<span class="ls-hc-arrow">→</span>' +
        group(2, "FFN", '<span class="ls-hc-box">FFN</span>');
    } else {
      stageHtml =
        group(0, DE ? "Token-Vektor" : "token vector", bars(5, "ls-hc-vector")) +
        '<span class="ls-hc-arrow">→</span>' +
        group(1, "W_1", matrix(5, 7)) +
        '<span class="ls-hc-arrow">→</span>' +
        group(1, DE ? "Hidden d_ff" : "hidden d_ff", bars(8, "ls-hc-vector")) +
        '<span class="ls-hc-arrow">→</span>' +
        group(2, "act", '<span class="ls-hc-box">GELU</span>') +
        '<span class="ls-hc-arrow">→</span>' +
        group(3, "W_2", matrix(7, 5)) +
        '<span class="ls-hc-arrow">→</span>' +
        group(3, DE ? "zurück" : "back", bars(5, "ls-hc-vector")) +
        '<span class="ls-hc-arrow">→</span>' +
        group(3, DE ? "zurück zu den Tokens" : "back to the tokens", tokensHtml(DE));
    }
    var el = document.createElement("div");
    el.className = "ls-hc-scene";
    el.innerHTML =
      '<div class="ls-hc-stage">' + stageHtml + "</div>" +
      '<p class="ls-hc-note"></p>' +
      '<p class="ls-hc-footer">' + (concat
        ? (DE ? "Wichtig: Das FFN sieht nicht die einzelnen Heads. Concat und W_O machen daraus einen Token-Vektor." : "Important: the FFN does not see the individual heads. Concat and W_O turn them into one token vector.")
        : (DE ? "Wichtig: Das FFN läuft für jedes Token einzeln. Es trennt nicht wieder nach Heads; es gibt jedem Token seinen neuen Vektor zurück." : "Important: the FFN runs separately for each token. It does not split the heads again; it gives each token its new vector back.")) + "</p>" +
      (concat ? "" : '<div class="ls-hc-sep"><div class="ls-hc-sep-head"><b>' + (DE ? "Trennen und isolieren" : "Separate and isolate") + '</b><span>' + (DE ? "Input → Hidden → Output: Bereiche werden getrennt und wieder zusammengesetzt." : "Input → Hidden → Output: regions are separated and reassembled.") + '</span></div><div class="ls-hc-sep-stage"><canvas class="ls-hc-sep-canvas" role="img" aria-label="' + (DE ? "Statisches Drei-Stufen-Bild: Input ist verworren, Hidden trennt die Bereiche, Output isoliert und setzt sie wieder zusammen." : "Static three-stage image: input is tangled, hidden separates the regions, output isolates and reassembles them.") + '"></canvas></div><p class="ls-hc-sep-note">' + (DE ? "Statisch, schematisch: Input ist verworren, Hidden trennt die Bereiche, Output isoliert sie und setzt sie wieder zusammen. Fiktives Beispiel, keine Messung." : "Static, schematic: input is tangled, hidden separates the regions, output isolates them and reassembles them. Fictional example, not a measurement.") + '</p></div>');
    root.appendChild(el);
    var note = el.querySelector(".ls-hc-note");
    var sepStage = el.querySelector(".ls-hc-sep-stage");
    var sepCanvas = el.querySelector(".ls-hc-sep-canvas");
    var sepSize = null;
    function drawSeparation() {
      if (!sepCanvas || !sepStage) return;
      sepSize = api.fit(sepCanvas, sepStage);
      var g = sepSize.ctx, w = sepSize.w, h = sepSize.h, C = api.colors();
      g.clearRect(0, 0, w, h);
      var bg = g.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, C.paper || "#fff");
      bg.addColorStop(1, C.paper2 || C.paper || "#fff");
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      var pad = Math.max(10, Math.min(18, w * 0.02));
      var gap = Math.max(10, Math.min(26, w * 0.03));
      var top = 32, bottom = 34;
      var panelW = (w - pad * 2 - gap * 2) / 3;
      var panelH = h - top - bottom;
      var titles = DE ? ["Input", "Hidden: trennen", "Output: isoliert"] : ["Input", "Hidden: separate", "Output: isolated"];
      var subs = DE ? ["verworren", "Bereiche getrennt", "neu zusammengesetzt"] : ["tangled", "regions separated", "reassembled"];
      function panelX(i) { return pad + i * (panelW + gap); }
      function pt(i, p) { return { x: panelX(i) + p[0] * panelW, y: top + p[1] * panelH }; }
      function rr(x, y, ww, hh, r) {
        var rad = Math.min(r, ww / 2, hh / 2);
        g.beginPath();
        g.moveTo(x + rad, y);
        g.arcTo(x + ww, y, x + ww, y + hh, rad);
        g.arcTo(x + ww, y + hh, x, y + hh, rad);
        g.arcTo(x, y + hh, x, y, rad);
        g.arcTo(x, y, x + ww, y, rad);
        g.closePath();
      }
      for (var pi = 0; pi < 3; pi++) {
        g.fillStyle = pi === 0 ? "rgba(201,86,86,.035)" : pi === 1 ? "rgba(159,151,0,.045)" : "rgba(99,164,75,.055)";
        rr(panelX(pi), top, panelW, panelH, 8); g.fill();
        g.strokeStyle = C.line; g.lineWidth = 1; g.stroke();
        g.fillStyle = C.petrol;
        g.font = '700 ' + Math.max(9, Math.min(12, panelW * 0.075)) + 'px "Barlow", sans-serif';
        g.textAlign = "center"; g.textBaseline = "alphabetic";
        g.fillText(titles[pi], panelX(pi) + panelW / 2, top - 12);
        g.fillStyle = C.muted;
        g.font = '600 ' + Math.max(7, Math.min(9, panelW * 0.055)) + 'px "Open Sans", sans-serif';
        g.fillText(subs[pi], panelX(pi) + panelW / 2, top + panelH + 14);
      }
      function region(i, cx, cy, rx, ry, col, dash) {
        var c = pt(i, [cx, cy]);
        g.save();
        g.setLineDash(dash || []);
        g.strokeStyle = col; g.globalAlpha = 0.55; g.lineWidth = 1.6;
        g.beginPath(); g.ellipse(c.x, c.y, rx * panelW, ry * panelH, 0, 0, Math.PI * 2); g.stroke();
        g.globalAlpha = 0.06; g.fillStyle = col; g.fill();
        g.restore();
      }
      region(0, 0.50, 0.47, 0.20, 0.20, C.petrol, [4, 3]);
      region(1, 0.28, 0.28, 0.15, 0.15, C.green, [4, 3]);
      region(1, 0.74, 0.70, 0.15, 0.15, C.gold, [4, 3]);
      region(1, 0.72, 0.28, 0.15, 0.15, C.lilac, [4, 3]);
      region(2, 0.24, 0.24, 0.15, 0.15, C.green, []);
      region(2, 0.78, 0.74, 0.15, 0.15, C.gold, []);
      region(2, 0.76, 0.24, 0.15, 0.15, C.lilac, []);
      function arrowPanel(x1, x2, y, label) {
        g.strokeStyle = C.petrol; g.fillStyle = C.petrol; g.lineWidth = 1.8;
        g.setLineDash([4, 3]);
        g.beginPath(); g.moveTo(x1, y); g.lineTo(x2, y); g.stroke();
        g.setLineDash([]);
        var head = 6;
        g.beginPath();
        g.moveTo(x2, y);
        g.lineTo(x2 - head * Math.cos(-0.5), y - head * Math.sin(-0.5));
        g.lineTo(x2 - head * Math.cos(0.5), y - head * Math.sin(0.5));
        g.closePath(); g.fill();
        g.fillStyle = C.petrol;
        g.font = '700 ' + Math.max(7, Math.min(10, gap * 0.7)) + 'px "Open Sans", sans-serif';
        g.textAlign = "center"; g.textBaseline = "alphabetic";
        g.fillText(label, (x1 + x2) / 2, y - 8);
      }
      var midY = top + panelH * 0.5;
      arrowPanel(panelX(0) + panelW + 2, panelX(1) - 2, midY, "W₁");
      arrowPanel(panelX(1) + panelW + 2, panelX(2) - 2, midY, "W₂");
      var CATS = [
        { label: DE ? "Katze" : "cat", col: "green",
          input: [[0.42, 0.44], [0.50, 0.40], [0.46, 0.52], [0.54, 0.48], [0.40, 0.36], [0.52, 0.58]],
          hidden: [[0.26, 0.28], [0.32, 0.24], [0.22, 0.34], [0.30, 0.36], [0.24, 0.20], [0.34, 0.30]],
          output: [[0.22, 0.24], [0.28, 0.20], [0.18, 0.30], [0.26, 0.32], [0.20, 0.16], [0.30, 0.26]] },
        { label: DE ? "Bank" : "bank", col: "gold",
          input: [[0.48, 0.46], [0.56, 0.42], [0.52, 0.54], [0.44, 0.50], [0.58, 0.52], [0.46, 0.38]],
          hidden: [[0.72, 0.70], [0.78, 0.64], [0.68, 0.76], [0.76, 0.78], [0.70, 0.62], [0.80, 0.72]],
          output: [[0.76, 0.74], [0.82, 0.68], [0.72, 0.80], [0.80, 0.82], [0.74, 0.66], [0.84, 0.76]] },
        { label: DE ? "König" : "king", col: "lilac",
          input: [[0.50, 0.50], [0.42, 0.48], [0.56, 0.56], [0.48, 0.42], [0.54, 0.44], [0.44, 0.56]],
          hidden: [[0.70, 0.28], [0.76, 0.24], [0.66, 0.34], [0.74, 0.36], [0.68, 0.20], [0.78, 0.30]],
          output: [[0.74, 0.24], [0.80, 0.20], [0.70, 0.30], [0.78, 0.32], [0.72, 0.16], [0.82, 0.26]] }
      ];
      CATS.forEach(function (cat) {
        var col = C[cat.col] || C.petrol;
        for (var pi = 0; pi < 3; pi++) {
          var pts = cat[pi === 0 ? "input" : pi === 1 ? "hidden" : "output"];
          pts.forEach(function (p) {
            var q = pt(pi, p);
            g.beginPath(); g.arc(q.x, q.y, pi === 2 ? 3.8 : 3.2, 0, Math.PI * 2);
            g.fillStyle = col; g.globalAlpha = pi === 0 ? 0.72 : 0.95; g.fill(); g.globalAlpha = 1;
            g.strokeStyle = C.paper; g.lineWidth = 1.1; g.stroke();
          });
        }
        var out = pt(2, cat.output[0]);
        g.fillStyle = col;
        g.font = '700 ' + Math.max(8, Math.min(10, panelW * 0.06)) + 'px "Barlow", sans-serif';
        g.textAlign = "center"; g.textBaseline = "top";
        g.fillText(cat.label, out.x, out.y + 10);
      });
      g.fillStyle = C.muted;
      g.font = '600 ' + Math.max(7, Math.min(9, w * 0.014)) + 'px "Open Sans", sans-serif';
      g.textAlign = "left"; g.textBaseline = "alphabetic";
      g.fillText(DE ? "Punkte = Token-Vektoren · Ellipse = getrennter Bereich" : "points = token vectors · ellipse = separated region", pad, h - 8);
      sepCanvas.setAttribute("aria-label", DE
        ? "Statisches Drei-Stufen-Bild: Input ist verworren, Hidden trennt die Bereiche, Output isoliert und setzt sie wieder zusammen."
        : "Static three-stage image: input is tangled, hidden separates the regions, output isolates and reassembles them.");
    }
    function resizeSep() { if (sepCanvas) { sepSize = api.fit(sepCanvas, sepStage); drawSeparation(); } }
    function onTheme() { if (sepCanvas) drawSeparation(); }
    if (sepCanvas) {
      window.addEventListener("resize", resizeSep);
      window.addEventListener("tm:theme", onTheme);
      resizeSep();
    }
    function render() {
      el.setAttribute("data-stage", String(stage));
      note.innerHTML = notes[stage] || "";
      el.querySelectorAll("[data-hc-step]").forEach(function (node) {
        var s = parseInt(node.getAttribute("data-hc-step"), 10);
        node.classList.toggle("is-on", s === stage);
        node.classList.toggle("is-dim", s !== stage);
      });
    }
    render();
    return {
      update: function (s) {
        if (s && typeof s.step === "number") {
          stage = Math.max(0, Math.min(last, s.step));
          render();
        }
      },
      next: function () {
        if (stage < last) { stage += 1; render(); return true; }
        return false;
      },
      prev: function () {
        if (stage > 0) { stage -= 1; render(); return true; }
        return false;
      },
      hasNext: function () { return stage < last; },
      hasPrev: function () { return stage > 0; },
      resize: function () { resizeSep(); },
      destroy: function () {
        window.removeEventListener("resize", resizeSep);
        window.removeEventListener("tm:theme", onTheme);
        el.remove();
      }
    };
  }

  core.register("headconcat", function (root, api) { return flowScene(root, api, "concat"); });
  core.register("ffnsplit", function (root, api) { return flowScene(root, api, "ffn"); });
})();
