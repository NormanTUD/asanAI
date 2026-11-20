(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function attentionScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var contexts = DE ? [
      { id: "none", sentence: "Ich gehe zur Bank.", tokens: ["Ich", "gehe", "zur", "Bank", "."], bank: 3, anchor: null, color: "muted" },
      { id: "money", sentence: "Ich bringe mein Geld auf die Bank.", tokens: ["Ich", "bringe", "mein", "Geld", "auf", "die", "Bank", "."], bank: 6, anchor: "Geld", color: "gold" },
      { id: "bench", sentence: "Ich sitze im Park auf der Bank.", tokens: ["Ich", "sitze", "im", "Park", "auf", "der", "Bank", "."], bank: 6, anchor: "Park", color: "lilac" }
    ] : [
      { id: "none", sentence: "I walk to the bank.", tokens: ["I", "walk", "to", "the", "bank", "."], bank: 4, anchor: null, color: "muted" },
      { id: "money", sentence: "I bring my money to the bank.", tokens: ["I", "bring", "my", "money", "to", "the", "bank", "."], bank: 6, anchor: "money", color: "gold" },
      { id: "bench", sentence: "I sit on the river bank in the park.", tokens: ["I", "sit", "on", "the", "river", "bank", "in", "the", "park", "."], bank: 5, anchor: "river", color: "lilac" }
    ];
    var EMB = DE ? {
      "Ich": [-1.05, 0.55],
      "gehe": [-0.55, -0.2],
      "zur": [-0.1, -0.7],
      "Bank": [0.25, 0],
      "bringe": [-0.2, 0.35],
      "mein": [-0.75, -0.15],
      "Geld": [1.8, -1.0],
      "auf": [-0.1, -0.75],
      "die": [-0.45, -0.9],
      "sitze": [-0.25, -0.1],
      "im": [-0.8, -0.35],
      "Park": [1.8, 1.0],
      "der": [-0.45, -0.9],
      ".": [-1.05, -0.8]
    } : {
      "I": [-1.05, 0.55],
      "walk": [-0.55, -0.2],
      "to": [-0.1, -0.75],
      "the": [-0.45, -0.9],
      "bank": [0.25, 0],
      "bring": [-0.2, 0.35],
      "my": [-0.75, -0.15],
      "money": [1.8, -1.0],
      "sit": [-0.25, -0.1],
      "on": [-0.8, -0.35],
      "river": [1.8, 1.0],
      "in": [-0.55, -0.45],
      "park": [0.55, 1.35],
      ".": [-1.05, -0.8]
    };
    var context = window.__lsAttContext || "none";
    var selected = (contexts.filter(function (c) { return c.id === context; })[0] || contexts[0]).bank;
    var causal = true;
    var el = document.createElement("div");
    el.className = "ls-att-scene";
    el.innerHTML =
      '<div class="ls-att-sentences" role="group"></div>' +
      '<div class="ls-att-stage"><canvas class="ls-att-graph" role="img"></canvas></div>' +
      '<div class="ls-att-vector"><canvas class="ls-att-vector-canvas" role="img"></canvas></div>' +
      '<div class="ls-att-matrix" aria-live="polite"></div>' +
      '<div class="ls-att-formula" aria-live="polite"></div>' +
      '<div class="ls-att-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var sentEl = el.querySelector(".ls-att-sentences");
    var stage = el.querySelector(".ls-att-stage");
    var graph = el.querySelector(".ls-att-graph");
    var vectorStage = el.querySelector(".ls-att-vector");
    var vector = el.querySelector(".ls-att-vector-canvas");
    var matrixEl = el.querySelector(".ls-att-matrix");
    var formulaEl = el.querySelector(".ls-att-formula");
    var readout = el.querySelector(".ls-att-readout");
    var C = api.colors();
    var graphSize = null, vectorSize = null, graphHits = [];
    var animRow = null, animFrom = null, animTo = null, animStart = 0, animRaf = 0;

    function contextObj() {
      return contexts.filter(function (x) { return x.id === context; })[0] || contexts[0];
    }
    function tokens() { return contextObj().tokens; }
    function bankIdx() { return contextObj().bank; }
    function normalize(row) {
      var s = row.reduce(function (a, b) { return a + b; }, 0) || 1;
      return row.map(function (v) { return v / s; });
    }
    function bankRowFor() {
      var ts = tokens(), n = ts.length, bi = bankIdx(), row = [];
      for (var j = 0; j < n; j++) row[j] = 0.01;
      row[bi] = 0.66;
      var anchor = contextObj().anchor;
      if (anchor) {
        var ai = ts.indexOf(anchor);
        if (ai >= 0) row[ai] += 0.22;
      }
      if (bi > 0) row[bi - 1] += 0.05;
      if (bi < n - 1) row[bi + 1] += 0.05;
      return normalize(row);
    }
    function baseRow(i, n, bi) {
      var row = [];
      for (var j = 0; j < n; j++) row[j] = 0.03;
      row[i] += 0.52;
      if (i > 0) row[i - 1] += 0.18;
      if (i < n - 1) row[i + 1] += 0.12;
      row[bi] += 0.10;
      return normalize(row);
    }
    function maskRow(row, i) {
      if (!causal) return normalize(row);
      var out = row.map(function (w, j) { return j <= i ? w : 0; });
      return normalize(out);
    }
    function matrix() {
      var ts = tokens(), n = ts.length, bi = bankIdx();
      var m = [];
      for (var i = 0; i < n; i++) {
        var row = i === bi ? bankRowFor() : baseRow(i, n, bi);
        m.push(maskRow(row, i));
      }
      return m;
    }
    function topKey(row, i) {
      var best = -1, bw = -1;
      row.forEach(function (w, j) { if (j !== i && w > bw) { bw = w; best = j; } });
      return best;
    }
    function displayRow() {
      if (animRow && animRow.length === tokens().length) return animRow;
      return matrix()[selected];
    }
    function texText(value) {
      return String(value == null ? "" : value).replace(/[\\{}$&#^_%~]/g, function (c) {
        return c === "\\" ? "\\textbackslash{}" : "\\" + c;
      });
    }
    function formulaLabel(tok) {
      if (DE && tok === "Fluss+Geld") return "Fluss + Geld";
      if (!DE && tok === "money+river") return "money + river";
      if (tok === ".") return "Punkt";
      return tok;
    }
    function escAttr(value) {
      return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    function renderSentences() {
      sentEl.innerHTML = contexts.map(function (c, i) {
        return '<button type="button" class="ls-att-sentence' + (c.id === context ? ' is-on' : '') + '" data-ctx="' + c.id + '">' +
          api.esc(c.sentence) + '</button>';
      }).join("");
      sentEl.querySelectorAll("[data-ctx]").forEach(function (b) {
        b.addEventListener("click", function () { setContext(b.getAttribute("data-ctx")); });
      });
    }
    function setContext(id) {
      if (!contexts.some(function (c) { return c.id === id; })) return;
      context = id;
      window.__lsAttContext = context;
      selected = contextObj().bank;
      renderSentences();
      draw();
    }
    function setSelected(i) {
      if (i < 0 || i >= tokens().length) return;
      selected = i;
      draw();
    }
    function drawGraph() {
      if (!graphSize) return;
      var ctx = graphSize.ctx, w = graphSize.w, h = graphSize.h;
      ctx.clearRect(0, 0, w, h);
      var ts = tokens(), n = ts.length, row = displayRow();
      var pad = 18, gap = (w - pad * 2) / n, y = h - 44;
      graphHits = [];
      var maxBox = Math.min(92, gap - 6);
      var px = [];
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ts.forEach(function (tok, i) {
        var x = pad + gap * (i + 0.5);
        var tw = ctx.measureText(tok).width;
        var bw = Math.max(38, Math.min(maxBox, tw + 18));
        px[i] = x;
        var on = i === selected;
        var wt = row[i] || 0;
        var baseCol = on ? C.green : (i === 0 && context !== "none" ? C.gold : C.blue);
        var alpha = on ? 0.92 : Math.min(0.78, 0.08 + wt * 0.95);
        ctx.fillStyle = baseCol;
        ctx.globalAlpha = alpha;
        ctx.fillRect(x - bw / 2, y - 15, bw, 30);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = on ? C.green : C.lineStrong;
        ctx.lineWidth = on ? 2 : 1;
        ctx.strokeRect(x - bw / 2, y - 15, bw, 30);
        ctx.fillStyle = (on || (wt > 0.46 && i !== 0)) ? "#fff" : C.ink;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(tok, x, y + 3);
        ctx.fillStyle = C.muted;
        ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
        ctx.fillText(Math.round(wt * 100) + "%", x, y + 26);
        graphHits.push({ x: x - bw / 2, y: y - 15, w: bw, h: 30, i: i });
      });
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(DE ? "Klicke ein Wort" : "click a word", pad, 16);
      var selX = px[selected], y0 = y - 15;
      row.forEach(function (wt, j) {
        if (wt < 0.005) return;
        if (j === selected) {
          var lr = 9 + 16 * wt;
          ctx.strokeStyle = C.blue;
          ctx.globalAlpha = 0.24 + Math.min(0.62, wt);
          ctx.lineWidth = 1.8 + wt * 6;
          ctx.beginPath();
          ctx.arc(selX, y0 - 7, lr, Math.PI * 1.08, Math.PI * 1.92);
          ctx.stroke();
          ctx.globalAlpha = 1;
          return;
        }
        var x1 = px[j];
        var mid = (selX + x1) / 2;
        var cy = Math.max(30, y - 38 - 115 * wt);
        var alpha = 0.20 + Math.min(0.68, wt);
        ctx.strokeStyle = C.blue;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 2 + wt * 16;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(selX, y0);
        ctx.quadraticCurveTo(mid, cy, x1, y0);
        ctx.stroke();
        ctx.globalAlpha = 1;
        var ang = Math.atan2(y0 - cy, x1 - mid);
        var ah = 7 + wt * 10;
        var aw = 5 + wt * 7;
        ctx.beginPath();
        ctx.moveTo(x1, y0);
        ctx.lineTo(x1 - ah * Math.cos(ang) + aw * Math.sin(ang), y0 - ah * Math.sin(ang) - aw * Math.cos(ang));
        ctx.lineTo(x1 - ah * Math.cos(ang) - aw * Math.sin(ang), y0 - ah * Math.sin(ang) + aw * Math.cos(ang));
        ctx.closePath();
        ctx.fillStyle = C.blue;
        ctx.fill();
        if (wt >= 0.02) {
          ctx.fillStyle = C.petrol;
          ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
          ctx.textAlign = "center";
          ctx.fillText(Math.round(wt * 100) + "%", mid, Math.max(12, cy - 6));
        }
      });
      graph.setAttribute("aria-label", DE
        ? "Attention-Graph. Zeile " + ts[selected] + "."
        : "Attention graph. Row " + ts[selected] + ".");
    }
    function drawVector() {
      if (!vectorSize) return;
      var ctx = vectorSize.ctx, w = vectorSize.w, h = vectorSize.h;
      ctx.clearRect(0, 0, w, h);
      var ts = tokens(), row = displayRow();
      var cx = w * 0.5, cy = h * 0.54;
      var scale = Math.min((w - 90) / 3, (h - 70) / 2.2);
      ctx.strokeStyle = C.line;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - scale * 1.9, cy); ctx.lineTo(cx + scale * 1.9, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - scale * 1.15); ctx.lineTo(cx, cy + scale * 1.15); ctx.stroke();
      ctx.globalAlpha = 1;
      var sumX = 0, sumY = 0;
      var pts = [];
      ts.forEach(function (tok, j) {
        var e = EMB[tok] || [0, 0];
        var wt = row[j] || 0;
        sumX += e[0] * wt; sumY += e[1] * wt;
        pts.push({ x: cx + e[0] * scale, y: cy - e[1] * scale, label: tok, wt: wt, j: j });
      });
      var ex = cx + sumX * scale, ey = cy - sumY * scale;
      pts.forEach(function (pt) {
        if (pt.wt > 0.005) {
          ctx.strokeStyle = pt.j === selected ? C.green : C.blue;
          ctx.globalAlpha = 0.10 + Math.min(0.55, pt.wt);
          ctx.lineWidth = 1 + pt.wt * 5;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(pt.x, pt.y); ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.j === selected ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = pt.j === selected ? C.paper : (pt.wt > 0.05 ? C.blue : C.line);
        ctx.fill();
        ctx.strokeStyle = pt.j === selected ? C.green : C.paper; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.fillStyle = C.ink;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        var right = pt.x > cx + scale * 0.75;
        var left = pt.x < cx - scale * 0.75;
        ctx.textAlign = right ? "right" : (left ? "left" : "center");
        ctx.fillText(pt.label, right ? pt.x - 6 : (left ? pt.x + 6 : pt.x), right || left ? pt.y + 4 : pt.y - 9);
      });
      var selPt = pts.filter(function (pt) { return pt.j === selected; })[0];
      if (selPt) {
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = V.alpha(C.green, 0.6);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(selPt.x, selPt.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2); ctx.fillStyle = C.green; ctx.fill(); ctx.strokeStyle = C.paper; ctx.lineWidth = 2; ctx.stroke();
      var ang = Math.atan2(ey - cy, ex - cx);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 10 * Math.cos(ang - 0.4), ey - 10 * Math.sin(ang - 0.4));
      ctx.lineTo(ex - 10 * Math.cos(ang + 0.4), ey - 10 * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fillStyle = C.green; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fillStyle = C.paper; ctx.fill();
      ctx.strokeStyle = C.green; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("x′", ex + 7, ey - 6);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      vector.setAttribute("aria-label", DE
        ? "2D-Embeddings. Gewichtete Summe der Value-Vektoren für " + ts[selected] + "; x′ = (" + sumX.toFixed(2) + ", " + sumY.toFixed(2) + ")."
        : "2-D embeddings. Weighted sum of the value vectors for " + ts[selected] + "; x′ = (" + sumX.toFixed(2) + ", " + sumY.toFixed(2) + ").");
    }
    function renderTable() {
      var ts = tokens(), m = matrix();
      var html = '<table><thead><tr><th></th>' + ts.map(function (t) { return '<th>' + api.esc(t) + '</th>'; }).join("") + '</tr></thead><tbody>';
      m.forEach(function (row, i) {
        html += '<tr data-row="' + i + '"' + (i === selected ? ' class="is-on"' : '') + '><th>' + api.esc(ts[i]) + '</th>';
        row.forEach(function (wt) {
          var pct = Math.round(wt * 100);
          var alpha = Math.min(0.80, 0.10 + wt * 0.95);
          var ink = wt > 0.48 ? "#fff" : C.ink;
          html += '<td style="background:rgba(18,117,172,' + alpha.toFixed(2) + ');color:' + ink + '">' + pct + '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
      matrixEl.innerHTML = html;
      matrixEl.querySelectorAll("tr[data-row]").forEach(function (tr) {
        tr.addEventListener("click", function () { setSelected(parseInt(tr.getAttribute("data-row"), 10)); });
      });
    }
    function renderFormula() {
      var ts = tokens(), row = matrix()[selected], terms = [];
      row.forEach(function (wt, j) {
        if (wt < 0.005 && j !== selected) return;
        var label = texText(formulaLabel(ts[j]));
        terms.push('\\underbrace{' + wt.toFixed(2) + '}_{\\text{' + label + '}}\\cdot v_{\\text{' + label + '}}');
      });
      var t = '\\underbrace{x\'}_{\\substack{\\text{' + (DE ? 'neuer Vektor' : 'new vector') + '}\\\\ \\text{' + (DE ? 'für' : 'for') + ' } \\text{' + texText(formulaLabel(ts[selected])) + '}}} = ' +
        '\\underbrace{' + terms.join(' + ') + '}_{\\substack{\\text{' + (DE ? 'gewichtete Summe' : 'weighted sum') + '}\\\\ \\text{' + (DE ? 'Summe aller Gewichte' : 'sum of all weights') + ' } = 1}}';
      formulaEl.innerHTML = '<div class="ls-math" data-tex="' + escAttr(t) + '" data-tex-display="true"><code class="ls-tex-source">' + api.esc(t) + '</code></div>';
      if (api.typeset) { try { api.typeset(formulaEl); } catch (e) {} }
    }
    function renderReadout() {
      var ts = tokens(), row = matrix()[selected], key = topKey(row, selected);
      readout.innerHTML = '<span>' + (DE ? "Zeile" : "row") + ' <b>' + api.esc(ts[selected]) + '</b></span><span>' + (DE ? "stärkster Key" : "top key") + ' <b>' + api.esc(ts[key]) + ' ' + Math.round(row[key] * 100) + '%</b></span><span><b>x′</b> ' + 'x′ = Σ w · v</span>';
    }
    function animateRow(target) {
      if (animRaf) cancelAnimationFrame(animRaf);
      var old = animRow && animRow.length === target.length ? animRow.slice() : target.slice();
      animFrom = old; animTo = target.slice(); animStart = performance.now(); animRow = old;
      function frame(now) {
        var t = Math.min(1, (now - animStart) / 320);
        var e = 1 - Math.pow(1 - t, 3);
        animRow = animTo.map(function (v, j) { return animFrom[j] + (v - animFrom[j]) * e; });
        drawGraph(); drawVector();
        if (t < 1) animRaf = requestAnimationFrame(frame);
        else { animRow = animTo.slice(); animRaf = 0; }
      }
      animRaf = requestAnimationFrame(frame);
    }
    function draw() {
      renderSentences();
      renderTable();
      renderFormula();
      renderReadout();
      animateRow(matrix()[selected].slice());
    }
    function resize() {
      graphSize = api.fit(graph, stage);
      vectorSize = api.fit(vector, vectorStage);
      animRow = matrix()[selected].slice();
      renderSentences(); renderTable(); renderFormula(); renderReadout();
      drawGraph(); drawVector();
    }
    graph.addEventListener("pointerup", function (e) {
      var r = graph.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      graphHits.forEach(function (h) {
        if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) setSelected(h.i);
      });
    });
    graph.addEventListener("pointermove", function (e) {
      var r = graph.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var hit = graphHits.some(function (h) { return x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h; });
      graph.style.cursor = hit ? "pointer" : "default";
    });
    window.addEventListener("resize", resize);
    resize();
    return {
      update: function (s) {
        if (!s) return;
        var ctxChanged = !!s.context && s.context !== context;
        if (s.context) context = s.context;
        if (typeof s.selected === "number") selected = s.selected;
        else if (ctxChanged) selected = contextObj().bank;
        draw();
      },
      setControl: function (name, value) {
        if (name === "causal") { causal = !!value; draw(); return true; }
        return false;
      },
      next: function () {
        var idx = contexts.map(function (c) { return c.id; }).indexOf(context);
        if (idx >= contexts.length - 1) return false;
        setContext(contexts[idx + 1].id);
        return true;
      },
      prev: function () {
        var idx = contexts.map(function (c) { return c.id; }).indexOf(context);
        if (idx <= 0) return false;
        setContext(contexts[idx - 1].id);
        return true;
      },
      onKey: function (e) {
        var idx = contexts.map(function (c) { return c.id; }).indexOf(context);
        if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") return idx < contexts.length - 1 ? (setContext(contexts[++idx].id), true) : false;
        if (e.key === "ArrowLeft" || e.key === "PageUp") return idx > 0 ? (setContext(contexts[--idx].id), true) : false;
        return false;
      },
      resize: resize,
      destroy: function () { if (animRaf) cancelAnimationFrame(animRaf); window.removeEventListener("resize", resize); el.remove(); }
    };
  }
  core.register("attention", attentionScene);
})();
