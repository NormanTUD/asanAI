(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function attentionScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    function tokenLabel(tok, i) { return (i > 0 ? "␣" : "") + tok; }
    function roundRect(c, x, y, w, h, r) {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }
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
    graph.setAttribute("data-tip", DE ? "Kanten zeigen Attention-Gewichte; klicke ein Token, um seine Zeile zu sehen." : "Edges show attention weights; click a token to see its row.");
    vector.setAttribute("data-tip", DE ? "Gewichtete Summe der Value-Vektoren; der Pfeil r ist die Mischung." : "Weighted sum of the value vectors; the arrow r is the mixture.");
    matrixEl.setAttribute("data-tip", DE ? "Tabelle aller Attention-Gewichte; eine Zeile zeigt die Verteilung eines Tokens." : "Table of all attention weights; one row shows a token's distribution.");
    formulaEl.setAttribute("data-tip", DE ? "Die Formel zeigt r als gewichtete Summe der Values." : "The formula shows r as a weighted sum of the values.");
    readout.setAttribute("data-tip", DE ? "Nennt die aktive Zeile und den stärksten Key." : "Names the active row and the strongest key.");
    var C = api.colors();
    var graphSize = null, vectorSize = null, graphHits = [], vectorHits = [];
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
    function topWeights(row, ts, n) {
      return row.map(function (wt, j) { return { wt: wt, j: j }; })
        .sort(function (a, b) { return b.wt - a.wt; })
        .slice(0, n)
        .filter(function (x) { return x.wt > 0.005; })
        .map(function (x) { return Math.round(x.wt * 100) + "% " + tokenLabel(ts[x.j], x.j); })
        .join(" · ");
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
        return '<button type="button" class="ls-att-sentence' + (c.id === context ? ' is-on' : '') + '" data-ctx="' + c.id + '" data-tip="' + (DE ? "Wechselt den Satz und damit die Bedeutung von Bank." : "Switches the sentence and with it the meaning of bank.") + '">' +
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
      var ts = tokens(), n = ts.length, row = displayRow(), m = matrix();
      var pad = 18, gap = (w - pad * 2) / n, y = h - 46;
      graphHits = [];
      var maxBox = Math.min(96, gap - 5);
      var px = [];
      ctx.save();
      ctx.strokeStyle = C.line;
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 1;
      for (var gl = 0; gl <= 4; gl++) {
        var gy = 24 + gl * ((y - 58) / 4);
        ctx.beginPath(); ctx.moveTo(12, gy); ctx.lineTo(w - 12, gy); ctx.stroke();
      }
      ctx.restore();
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ts.forEach(function (tok, i) {
        var label = tokenLabel(tok, i);
        var tw = ctx.measureText(label).width;
        var bw = Math.max(44, Math.min(maxBox, tw + 18));
        px[i] = { x: pad + gap * (i + 0.5), w: bw };
      });
      var y0 = y - 16;
      for (var i = 0; i < n; i++) {
        for (var j = i + 1; j < n; j++) {
          var wt = (m[i][j] + m[j][i]) / 2;
          if (wt < 0.005) continue;
          var x1 = px[i].x, x2 = px[j].x;
          var mid = (x1 + x2) / 2;
          var lift = 26 + Math.abs(j - i) * 7 + wt * 42;
          var cy = Math.max(22, y0 - lift);
          ctx.strokeStyle = C.petrol;
          ctx.globalAlpha = Math.min(0.22, 0.04 + wt * 0.55);
          ctx.lineWidth = 0.55 + wt * 4.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x1, y0);
          ctx.quadraticCurveTo(mid, cy, x2, y0);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      var sel = px[selected];
      if (sel) {
        row.forEach(function (wt, j) {
          if (j === selected || wt < 0.005) return;
          var x1 = sel.x, x2 = px[j].x;
          var mid = (x1 + x2) / 2;
          var lift = 34 + Math.abs(j - selected) * 9 + wt * 58;
          var cy = Math.max(22, y0 - lift);
          var on = wt >= 0.16;
          ctx.strokeStyle = on ? C.blue : C.petrol;
          ctx.globalAlpha = 0.24 + Math.min(0.66, wt * 0.9);
          ctx.lineWidth = 1.6 + wt * 13;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x1, y0);
          ctx.quadraticCurveTo(mid, cy, x2, y0);
          ctx.stroke();
          var ang = Math.atan2(y0 - cy, x2 - mid);
          var ah = 7 + wt * 8;
          var aw = 4 + wt * 5;
          ctx.beginPath();
          ctx.moveTo(x2, y0);
          ctx.lineTo(x2 - ah * Math.cos(ang) + aw * Math.sin(ang), y0 - ah * Math.sin(ang) - aw * Math.cos(ang));
          ctx.lineTo(x2 - ah * Math.cos(ang) - aw * Math.sin(ang), y0 - ah * Math.sin(ang) + aw * Math.cos(ang));
          ctx.closePath();
          ctx.fillStyle = on ? C.blue : C.petrol;
          ctx.globalAlpha = 0.35 + Math.min(0.55, wt);
          ctx.fill();
          ctx.fillStyle = C.petrol;
          ctx.globalAlpha = 0.8;
          ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
          ctx.textAlign = "center";
          ctx.fillText(Math.round(wt * 100) + "%", mid, Math.max(12, cy - 6));
        });
        ctx.strokeStyle = C.green;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(sel.x, y0 - 4, Math.min(sel.w / 2 + 5, 26), Math.PI * 1.08, Math.PI * 1.92);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ts.forEach(function (tok, i) {
        var x = px[i].x, bw = px[i].w;
        var on = i === selected;
        var wt = row[i] || 0;
        var col = on ? C.green : (i === 0 && context !== "none" ? C.gold : C.blue);
        if (on) {
          ctx.beginPath();
          ctx.ellipse(x, y, bw / 2 + 7, 22, 0, 0, Math.PI * 2);
          ctx.fillStyle = C.green;
          ctx.globalAlpha = 0.10;
          ctx.fill();
        }
        ctx.globalAlpha = on ? 0.96 : Math.min(0.72, 0.16 + wt * 0.85);
        ctx.fillStyle = col;
        roundRect(ctx, x - bw / 2, y - 16, bw, 32, 7);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = on ? C.green : C.lineStrong;
        ctx.lineWidth = on ? 2 : 1;
        roundRect(ctx, x - bw / 2, y - 16, bw, 32, 7);
        ctx.stroke();
        ctx.fillStyle = (on || (wt > 0.46 && i !== 0)) ? "#fff" : C.ink;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.fillText(tokenLabel(tok, i), x, y + 1);
        ctx.fillStyle = C.muted;
        ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
        ctx.fillText(Math.round(wt * 100) + "%", x, y + 27);
        graphHits.push({ x: x - bw / 2, y: y - 16, w: bw, h: 32, i: i });
      });
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + (api.font("canvas-sm") * 0.82) + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "␣ = Leerzeichen · Kante = Attention-Gewicht" : "␣ = whitespace · edge = attention weight", pad, 8);
      ctx.textAlign = "right";
      ctx.fillStyle = C.petrol;
      ctx.fillText((DE ? "Zeile " : "row ") + tokenLabel(ts[selected], selected), w - pad, 8);
      ctx.textBaseline = "alphabetic";
      graph.setAttribute("aria-label", DE
        ? "Vollverbundener Attention-Graph. Zeile " + tokenLabel(ts[selected], selected) + ". Kante = Gewicht."
        : "Fully connected attention graph. Row " + tokenLabel(ts[selected], selected) + ". Edge = weight.");
    }
    function drawVector() {
      if (!vectorSize) return;
      var ctx = vectorSize.ctx, w = vectorSize.w, h = vectorSize.h;
      ctx.clearRect(0, 0, w, h);
      var ts = tokens(), row = displayRow();
      var cx = w * 0.5, cy = h * 0.54;
      var scale = Math.min((w - 90) / 3, (h - 70) / 2.2);
      ctx.strokeStyle = C.line;
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1;
      for (var gi = -2; gi <= 2; gi++) {
        var gy = cy + gi * scale * 0.45;
        ctx.beginPath(); ctx.moveTo(cx - scale * 1.9, gy); ctx.lineTo(cx + scale * 1.9, gy); ctx.stroke();
        var gx = cx + gi * scale * 0.65;
        ctx.beginPath(); ctx.moveTo(gx, cy - scale * 1.15); ctx.lineTo(gx, cy + scale * 1.15); ctx.stroke();
      }
      ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.moveTo(cx - scale * 1.9, cy); ctx.lineTo(cx + scale * 1.9, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - scale * 1.15); ctx.lineTo(cx, cy + scale * 1.15); ctx.stroke();
      ctx.globalAlpha = 1;
      vectorHits = [];
      var sumX = 0, sumY = 0;
      var pts = [];
      ts.forEach(function (tok, j) {
        var e = EMB[tok] || [0, 0];
        var wt = row[j] || 0;
        sumX += e[0] * wt; sumY += e[1] * wt;
        pts.push({ x: cx + e[0] * scale, y: cy - e[1] * scale, label: tokenLabel(tok, j), wt: wt, j: j, ex: e[0], ey: e[1] });
        vectorHits.push({ x: cx + e[0] * scale, y: cy - e[1] * scale, r: 15, j: j, label: tokenLabel(tok, j), wt: wt });
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
      ctx.fillText("r", ex + 7, ey - 6);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + (api.font("canvas-sm") * 0.82) + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(DE ? "␣ = Leerzeichen" : "␣ = whitespace", 8, 12);
      ctx.fillStyle = C.petrol;
      ctx.textAlign = "right";
      ctx.fillText("r = Σ w · v", w - 8, 12);
      vectorHits.push({ x: ex, y: ey, r: 18, rMix: true, cx: sumX, cy: sumY });
      ctx.textAlign = "left";
      vector.setAttribute("aria-label", DE
        ? "2D-Embeddings. Gewichtete Summe der Value-Vektoren für " + tokenLabel(ts[selected], selected) + "; r = (" + sumX.toFixed(2) + ", " + sumY.toFixed(2) + ")."
        : "2-D embeddings. Weighted sum of the value vectors for " + tokenLabel(ts[selected], selected) + "; r = (" + sumX.toFixed(2) + ", " + sumY.toFixed(2) + ").");
    }
    function renderTable() {
      var ts = tokens(), m = matrix();
      var html = '<table><thead><tr><th></th>' + ts.map(function (t, j) { return '<th>' + api.esc(tokenLabel(t, j)) + '</th>'; }).join("") + '</tr></thead><tbody>';
      m.forEach(function (row, i) {
        html += '<tr data-row="' + i + '"' + (i === selected ? ' class="is-on"' : '') + ' data-tip="' + api.esc((DE ? "Zeile " : "Row ") + tokenLabel(ts[i], i) + ". " + topWeights(m[i], ts, 3) + (DE ? ". Klicken wählt diese Zeile." : ". Click to select this row.")) + '"><th>' + api.esc(tokenLabel(ts[i], i)) + '</th>';
        row.forEach(function (wt) {
          var pct = Math.round(wt * 100);
          var alpha = Math.min(0.80, 0.10 + wt * 0.95);
          var ink = wt > 0.48 ? "#fff" : C.ink;
          html += '<td style="background:rgba(18,117,172,' + alpha.toFixed(2) + ');color:' + ink + '">' + pct + '%</td>';
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
      var t = '\\underbrace{r}_{\\substack{\\text{' + (DE ? 'Mischung' : 'mixture') + '}\\\\ \\text{' + (DE ? 'für' : 'for') + ' } \\text{' + texText(formulaLabel(ts[selected])) + '}}} = ' +
        '\\underbrace{' + terms.join(' + ') + '}_{\\substack{\\text{' + (DE ? 'gewichtete Summe' : 'weighted sum') + '}\\\\ \\text{' + (DE ? 'Summe aller Gewichte' : 'sum of all weights') + ' } = 1}}';
      formulaEl.innerHTML = '<div class="ls-math" data-tex="' + escAttr(t) + '" data-tex-display="true"><code class="ls-tex-source">' + api.esc(t) + '</code></div>';
      if (api.typeset) { try { api.typeset(formulaEl); } catch (e) {} }
    }
    function renderReadout() {
      var ts = tokens(), row = matrix()[selected], key = topKey(row, selected);
      readout.innerHTML = '<span>' + (DE ? "Zeile" : "row") + ' <b>' + api.esc(tokenLabel(ts[selected], selected)) + '</b></span><span>' + (DE ? "stärkster Key" : "top key") + ' <b>' + api.esc(tokenLabel(ts[key], key)) + ' ' + Math.round(row[key] * 100) + '%</b></span><span><b>r</b> ' + 'r = Σ w · v</span>';
    }
    function animateRow(target) {
      if (animRaf) cancelAnimationFrame(animRaf);
      var old = animRow && animRow.length === target.length ? animRow.slice() : target.slice();
      animFrom = old; animTo = target.slice(); animStart = performance.now(); animRow = old;
      var rowDur = (api.motion && api.motion.scale) ? api.motion.scale(320) : 320;
      function frame(now) {
        var t = Math.min(1, (now - animStart) / rowDur);
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
    core.canvasTip(graph, function (x, y) {
      var m = matrix(), ts = tokens();
      for (var i = 0; i < graphHits.length; i++) {
        var h = graphHits[i];
        if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
          return (DE ? "Token " : "Token ") + tokenLabel(ts[h.i], h.i) + ". " + topWeights(m[h.i], ts, 3) + (DE ? ". Klicken zeigt diese Zeile im Graphen." : ". Click to show this row in the graph.");
        }
      }
      return "";
    });
    core.canvasTip(vector, function (x, y) {
      var best = null, bestD = 1e9;
      for (var i = 0; i < vectorHits.length; i++) {
        var h = vectorHits[i];
        var d = Math.hypot(x - h.x, y - h.y);
        if (d < (h.r || 14) && d < bestD) { best = h; bestD = d; }
      }
      if (!best) return "";
      if (best.rMix) return DE ? "r = gewichtete Summe der Value-Vektoren: (" + best.cx.toFixed(2) + ", " + best.cy.toFixed(2) + ")." : "r = weighted sum of the value vectors: (" + best.cx.toFixed(2) + ", " + best.cy.toFixed(2) + ").";
      return (DE ? "Token " : "Token ") + best.label + ": " + Math.round(best.wt * 100) + (DE ? "% Gewicht im aktuellen Mix." : "% weight in the current mixture.");
    });
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
      hasNext: function () {
        return contexts.map(function (c) { return c.id; }).indexOf(context) < contexts.length - 1;
      },
      hasPrev: function () {
        return contexts.map(function (c) { return c.id; }).indexOf(context) > 0;
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
