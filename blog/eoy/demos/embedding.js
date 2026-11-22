(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, WORD_IDS_3D = core.WORD_IDS_3D, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function embeddingScene(root, api) {
    var DE = api.lang === "de";
    var C = api.colors();
    var V = window.LearnSysVisuals;
    var scene = document.createElement("div");
    scene.className = "ls-embed-scene";
    scene.innerHTML =
      '<div class="ls-embed-stage"><canvas class="ls-canvas" role="img"></canvas><div class="ls-embed-mini-table" hidden></div><div class="ls-embed-highdim" hidden></div></div>' +
      '<div class="ls-scene-controls"></div>' +
      '<div class="ls-scene-readout ls-sr-only" aria-live="polite"></div>' +
      '<div class="ls-scene-formula"><div class="ls-math" data-tex=""></div></div>';
    root.appendChild(scene);
    var stage = scene.querySelector(".ls-embed-stage");
    var canvas = scene.querySelector("canvas");
    var controls = scene.querySelector(".ls-scene-controls");
    var readout = scene.querySelector(".ls-scene-readout");
    var formula = scene.querySelector(".ls-scene-formula");
    var miniTable = scene.querySelector(".ls-embed-mini-table");
    var highdimEl = scene.querySelector(".ls-embed-highdim");
    var mathEl = formula.querySelector(".ls-math");
    var ctx = null, size = null, raf = 0, last = 0, reserveTimer = 0, reserveIdle = 0;
    var hits = [], hover = null, drag = null, suppressClick = false;
    var dimMix = 0, dimTarget = 0, dimAnim = null, stateApplied = false;
    var VIEW_PRESETS = [
      { yaw: -0.55, pitch: 0.78, zoom: 1 },
      { yaw: 0.00, pitch: 1.08, zoom: 1 },
      { yaw: 0.82, pitch: 0.38, zoom: 1 }
    ];
    var viewPreset = 0, camTarget = null;
    var st = {
      mode: "space", dim: 1, selected: "king", arithmetic: "King - Man + Woman",
      pair: ["cold", "lukewarm"], group: null, yaw: -0.55, pitch: 0.78, zoom: 1, tables: false,
      vectorMode: false
    };

    function color(name) { return C[name] || C.ink; }
    function groupColor(g) {
      if (g === "gender") return color("green");
      if (g === "power") return color("gold");
      if (g === "rank") return color("lilac");
      if (g === "animal") return color("sky");
      if (g === "fiction") return color("lime");
      return color("muted");
    }
    function text(loc) { return DE ? loc[0] : loc[1]; }
    var smoothstep = api.util.smoothstep;
    function wordLabel(id) { return text(WORDS[id].label); }
    function examplesForDim() {
      return EXAMPLES.filter(function (ex) { return !ex.only3d || st.dim === 2; });
    }
    function wordIdsForDim(withZ) {
      return withZ ? WORD_IDS.concat(WORD_IDS_3D) : WORD_IDS;
    }
    function tokenAlphaFor(mix) {
      if (mix <= 0 || mix >= 1) return 1;
      if (mix < 0.24) return 1 - smoothstep(0, 0.24, mix);
      if (mix < 0.68) return 0;
      return smoothstep(0.68, 1, mix);
    }
    function buildMiniTable() {
      if (!miniTable) return;
      var ids = ["man", "woman", "prince", "princess", "king", "queen", "power", "maleDog", "femaleDog", "wizard", "sorceress"];
      var head = '<tr><th></th><th>' + (DE ? "Macht" : "Power") + '</th><th>' + (DE ? "Geschlecht" : "Gender") + '</th><th>' + (DE ? "Rang · Welt" : "Rank · world") + '</th></tr>';
      var body = ids.map(function (id) {
        var w = WORDS[id];
        var x = ((w.v[0] - 12.5) / 15).toFixed(2);
        var y = (w.v[1] / 22).toFixed(2);
        var z = w.z.toFixed(2);
        return '<tr data-word="' + id + '" tabindex="0" aria-selected="false"><th>' + api.esc(wordLabel(id)) + '</th><td>' + x + '</td><td>' + y + '</td><td>' + z + '</td></tr>';
      }).join("");
      miniTable.setAttribute("role", "group");
      miniTable.setAttribute("aria-label", DE ? "Tabelle der drei Dimensionen" : "Table of the three dimensions");
      miniTable.innerHTML = '<div class="ls-embed-mini-head">' + (DE ? "Die drei Dimensionen, die du siehst" : "The three dimensions you see") + '</div><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table>';
    }
    function syncMiniSelection() {
      if (!miniTable) return;
      miniTable.querySelectorAll("tr[data-word]").forEach(function (tr) {
        var on = tr.getAttribute("data-word") === st.selected;
        tr.classList.toggle("is-selected", on);
        tr.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
    function selectWord(id) {
      if (!WORDS[id]) return;
      st.selected = id;
      st.group = null;
      syncControls();
      draw();
    }
    function buildHighdimTable() {
      if (!highdimEl) return;
      var tokens = DE ? ["Bank", "Fluss", "Geld", "König", "Königin", "Bedeutung"] : ["bank", "river", "money", "king", "queen", "meaning"];
      var cols = 16;
      function value(ti, j) {
        var x = Math.sin((ti + 1) * 12.9898 + (j + 1) * 78.233) * 43758.5453;
        x = x - Math.floor(x);
        return (x * 2 - 1).toFixed(2);
      }
      var head = '<tr><th></th>';
      for (var j = 0; j < cols; j++) head += '<th>d' + (j + 1) + '</th>';
      head += '<th>…</th></tr>';
      var body = tokens.map(function (tok, ti) {
        var cells = "";
        for (var k = 0; k < cols; k++) cells += "<td>" + value(ti, k) + "</td>";
        return "<tr><th>" + api.esc(tok) + "</th>" + cells + "<td>…</td></tr>";
      }).join("");
      highdimEl.innerHTML =
        '<div class="ls-highdim-note">' + (DE ? "Ausschnitt: 16 von 4096 Dimensionen. Jede Zeile ist ein Vektor, jede Spalte eine Dimension." : "Slice: 16 of 4096 dimensions. Each row is a vector, each column a dimension.") + '</div>' +
        '<div class="ls-highdim-scroll"><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
        '<p class="ls-highdim-foot">' + (DE ? "Auch wenn wir uns 4096 Dimensionen nicht mehr vorstellen können: Es gelten dieselben Regeln. Differenz, Winkel und Matrixmultiplikation funktionieren koordinatenweise weiter. Nur die Zahl der Koordinaten wächst, und hier passen viel mehr unabhängige Beziehungen hinein als in zwei oder drei Dimensionen." : "Even though we cannot picture 4096 dimensions, the same rules apply. Difference, angle, and matrix multiplication still work coordinate by coordinate. Only the number of coordinates grows, and there is room for many more independent relations than in two or three dimensions.") + '</p>';
    }
    function tempById(id) {
      for (var i = 0; i < TEMP.length; i++) if (TEMP[i].id === id) return TEMP[i];
      return TEMP[0];
    }
    function tempByValue(value) {
      var best = TEMP[0], bd = Infinity;
      TEMP.forEach(function (t) {
        var d = Math.abs(t.value - value);
        if (d < bd) { bd = d; best = t; }
      });
      return best;
    }
    function nearestWord(v) {
      var best = null, bd = Infinity;
      wordIdsForDim(v.length > 2).forEach(function (id) {
        var w = WORDS[id];
        var dz = v.length > 2 ? (v[2] - w.z) : 0;
        var d = Math.hypot(v[0] - w.v[0], v[1] - w.v[1], dz);
        if (d < bd) { bd = d; best = id; }
      });
      return { id: best, dist: bd };
    }
    function powerGroups() {
      var map = {};
      WORD_IDS.forEach(function (id) {
        var x = (WORDS[id].v[0] - 12.5) / 15;
        var key = x.toFixed(3);
        if (!map[key]) map[key] = { x: x, ids: [] };
        map[key].ids.push(id);
      });
      return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return a.x - b.x; });
    }
    function groupAtX(x) {
      var best = null, bd = Infinity;
      powerGroups().forEach(function (g) {
        var d = Math.abs(g.x - x);
        if (d < bd) { bd = d; best = g; }
      });
      return best;
    }
    function currentResult() {
      var result = null, steps = [], dirMode = null, example = null;
      if (st.arithmetic) {
        EXAMPLES.forEach(function (e) { if (e.id === st.arithmetic && e.expr) example = e; });
        if (example) {
          var ev = evalExpr(example.expr, st.dim === 2);
          if (ev && ev.kind === "vec") {
            result = { v: ev.v, near: nearestWord(ev.v).id };
            steps = exprSteps(example.expr, st.dim === 2).steps;
          }
        } else if (st.arithmetic === "gender" || st.arithmetic === "power-dir" || st.arithmetic === "directions" || st.arithmetic === "layers") {
          dirMode = st.arithmetic;
        }
      }
      return { result: result, steps: steps, dirMode: dirMode, example: example };
    }
    function evalExpr(expr, withZ) {
      var toks = expr.match(/[A-Za-z]+|\d+|[+\-*()/]/g) || [];
      var i = 0;
      function factor() {
        var t = toks[i++];
        if (t === "(") { var v = expression(); if (toks[i] === ")") i++; return v; }
        if (/^\d+$/.test(t)) return { kind: "num", n: parseInt(t, 10) };
        var found = null;
        wordIdsForDim(withZ).forEach(function (id) {
          if (WORDS[id].label[0].toLowerCase() === t.toLowerCase() || WORDS[id].label[1].toLowerCase() === t.toLowerCase() || id.toLowerCase() === t.toLowerCase()) found = id;
        });
        if (!found) return { kind: "num", n: 0 };
        var vv = WORDS[found].v.slice();
        if (withZ) vv.push(WORDS[found].z);
        return { kind: "vec", v: vv };
      }
      function term() {
        var left = factor();
        while (toks[i] === "*" || toks[i] === "/") {
          var op = toks[i++];
          var right = factor();
          if (left.kind === "num" && right.kind === "num") {
            left.n = op === "*" ? left.n * right.n : (right.n ? left.n / right.n : 0);
          } else if (left.kind === "vec" && right.kind === "num") {
            var s = op === "*" ? right.n : (right.n ? 1 / right.n : 0);
            left.v = left.v.map(function (x) { return x * s; });
          } else if (left.kind === "num" && right.kind === "vec" && op === "*") {
            left = { kind: "vec", v: right.v.map(function (x) { return x * left.n; }) };
          }
        }
        return left;
      }
      function expression() {
        var sign = 1;
        if (toks[i] === "+") i++;
        else if (toks[i] === "-") { i++; sign = -1; }
        var left = term();
        if (left.kind === "num") left.n *= sign;
        else left.v = left.v.map(function (x) { return x * sign; });
        while (toks[i] === "+" || toks[i] === "-") {
          var op = toks[i++];
          var right = term();
          if (op === "-") {
            if (right.kind === "num") right.n = -right.n;
            else right.v = right.v.map(function (x) { return -x; });
          }
          if (left.kind === "num" && right.kind === "num") left.n += right.n;
          else if (left.kind === "vec" && right.kind === "vec") left.v = left.v.map(function (x, k) { return x + (right.v[k] || 0); });
          else if (left.kind === "vec" && right.kind === "num") left.v = left.v.map(function (x) { return x + right.n; });
          else if (left.kind === "num" && right.kind === "vec") left = { kind: "vec", v: right.v.map(function (x) { return x + left.n; }) };
        }
        return left;
      }
      return expression();
    }
    function exprSteps(expr, withZ) {
      var toks = expr.match(/[A-Za-z]+|\d+|[+\-*()/]/g) || [];
      var pos = null, sign = 1, mult = 1, steps = [];
      toks.forEach(function (t) {
        if (t === "+") { sign = 1; return; }
        if (t === "-") { sign = -1; return; }
        if (t === "*") return;
        if (/^\d+$/.test(t)) { mult = parseInt(t, 10); return; }
        var found = null;
        wordIdsForDim(withZ).forEach(function (id) {
          if (WORDS[id].label[0].toLowerCase() === t.toLowerCase() || WORDS[id].label[1].toLowerCase() === t.toLowerCase() || id.toLowerCase() === t.toLowerCase()) found = id;
        });
        if (!found) return;
        var v = WORDS[found].v.slice();
        if (withZ) v.push(WORDS[found].z);
        var next = pos
          ? pos.map(function (x, k) { return x + sign * mult * v[k]; })
          : v.map(function (x) { return sign * mult * x; });
        if (pos) steps.push({ from: pos.slice(), to: next.slice(), label: (sign > 0 ? "+ " : "− ") + wordLabel(found) });
        pos = next;
        sign = 1;
        mult = 1;
      });
      return { pos: pos, steps: steps };
    }
    function texNum(x) {
      if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
      return x.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    }
    function findWordId(token, withZ) {
      var found = null;
      wordIdsForDim(withZ).forEach(function (id) {
        if (WORDS[id].label[0].toLowerCase() === token.toLowerCase() ||
            WORDS[id].label[1].toLowerCase() === token.toLowerCase() ||
            id.toLowerCase() === token.toLowerCase()) found = id;
      });
      return found;
    }
    function vectorExprTex(expr, dims) {
      var toks = expr.match(/[A-Za-z]+|\d+|[+\-*()/]/g) || [];
      var parts = [];
      toks.forEach(function (t) {
        if (t === "+" || t === "-") { parts.push(t); return; }
        if (t === "*") { parts.push("\\cdot"); return; }
        if (t === "/") { parts.push("\\div"); return; }
        if (t === "(") { parts.push("\\left("); return; }
        if (t === ")") { parts.push("\\right)"); return; }
        if (/^\d+$/.test(t)) { parts.push(t); return; }
        var id = findWordId(t, dims === 3);
        if (!id) { parts.push("\\text{" + t + "}"); return; }
        var v = WORDS[id].v.slice(0, dims === 1 ? 1 : 2);
        if (dims === 3) v.push(WORDS[id].z);
        var body = dims === 1 ? texNum(v[0]) : "\\begin{pmatrix}" + v.map(texNum).join("\\\\") + "\\end{pmatrix}";
        parts.push("\\underbrace{" + body + "}_{\\text{" + wordLabel(id) + "}}");
      });
      return parts.join(" ");
    }
    function normPoint(v) {
      return { x: (v[0] - 12.5) / 15, y: v[1] / 22, z: v.length > 2 ? v[2] : 0 };
    }
    function project(x, y, z) {
      var yMix = smoothstep(0.18, 0.86, dimMix);
      var zMix = smoothstep(1, 2, dimMix);
      var planeTilt = 0.18 * yMix * zMix;
      var yaw = st.yaw * (planeTilt + (1 - planeTilt) * zMix);
      var pitch = st.pitch * (planeTilt + (1 - planeTilt) * zMix);
      var cy = Math.cos(yaw), sy = Math.sin(yaw);
      var cp = Math.cos(pitch), sp = Math.sin(pitch);
      var x1 = x * cy - y * sy * yMix;
      var y1 = x * sy + y * cy * yMix;
      var z1 = z * zMix;
      var y2 = y1 * cp - z1 * sp;
      var z2 = y1 * sp + z1 * cp;
      var scale = 0.34 - 0.02 * zMix;
      var centerY = 0.52 + 0.03 * zMix;
      var s = Math.min(size.w, size.h) * scale * st.zoom / (1 + z2 * 0.3);
      return { x: size.w * 0.5 + x1 * s, y: size.h * centerY - y2 * s, z: z2, s: s };
    }
    function tempX(value) {
      var pad = Math.min(52, size.w * 0.08);
      return pad + value / 100 * (size.w - pad * 2);
    }

    function setFont(sizePx, weight, family) {
      ctx.font = (weight || 600) + " " + sizePx + "px " + (family || '"Open Sans", sans-serif');
    }
    function drawLabel(value, x, y, fill, align, font) {
      ctx.fillStyle = fill || C.ink;
      setFont(font || 10, font || 600, font ? "Barlow, sans-serif" : '"Open Sans", sans-serif');
      ctx.textAlign = align || "center";
      ctx.fillText(value, x, y);
    }
    function drawArrow(x1, y1, x2, y2, color, width, dash) {
      ctx.save();
      if (dash) ctx.setLineDash(dash);
      ctx.strokeStyle = color;
      ctx.lineWidth = width || 1.6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
      var a = Math.atan2(y2 - y1, x2 - x1);
      var head = 7;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - head * Math.cos(a - 0.42), y2 - head * Math.sin(a - 0.42));
      ctx.lineTo(x2 - head * Math.cos(a + 0.42), y2 - head * Math.sin(a + 0.42));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
    function drawPoint(x, y, id, selected, hovered) {
      var w = WORDS[id];
      var col = groupColor(w.group);
      var r = selected ? 7 : (hovered ? 6 : 4.5);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = 2;
      ctx.stroke();
      if (selected) {
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (hovered) {
        ctx.beginPath();
        ctx.arc(x, y, r + 3, 0, Math.PI * 2);
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      return { x: x, y: y, r: r };
    }
    function drawGrid1D() {
      ctx.strokeStyle = "rgba(0,75,111,.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(24, size.h * 0.58);
      ctx.lineTo(size.w - 24, size.h * 0.58);
      ctx.stroke();
      for (var i = 0; i < TEMP.length; i++) {
        var x = tempX(TEMP[i].value);
        ctx.beginPath();
        ctx.moveTo(x, size.h * 0.58 - 5);
        ctx.lineTo(x, size.h * 0.58 + 5);
        ctx.stroke();
      }
    }
    function drawTemperature() {
      hits = [];
      drawGrid1D();
      var a = tempById(st.pair[0]), b = tempById(st.pair[1]);
      var target = tempByValue(a.value + b.value);
      var ax = tempX(a.value), bx = tempX(target.value);
      var my = size.h * 0.58;
      ctx.strokeStyle = C.petrol;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax, my);
      ctx.lineTo(bx, my);
      ctx.stroke();
      var mx = tempX(target.value);
      ctx.beginPath();
      ctx.moveTo(mx, my - 7);
      ctx.lineTo(mx + 7, my);
      ctx.lineTo(mx, my + 7);
      ctx.lineTo(mx - 7, my);
      ctx.closePath();
      ctx.fillStyle = C.gold;
      ctx.fill();
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = 2;
      ctx.stroke();
      TEMP.forEach(function (t, i) {
        var x = tempX(t.value);
        var on = t.id === a.id || t.id === b.id;
        var hot = hover === t.id;
        ctx.beginPath();
        ctx.arc(x, my, on ? 7 : (hot ? 6 : 4.5), 0, Math.PI * 2);
        ctx.fillStyle = color(t.color);
        ctx.fill();
        ctx.strokeStyle = C.paper;
        ctx.lineWidth = 2;
        ctx.stroke();
        if (on || hot) {
          ctx.beginPath();
          ctx.arc(x, my, on ? 11 : 9, 0, Math.PI * 2);
          ctx.strokeStyle = on ? C.green : C.blue;
          ctx.globalAlpha = 0.55;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        var above = i % 2 === 0;
        drawLabel(text(t.label), x, above ? my - 18 : my + 26, on ? C.ink : C.muted, "center", 10);
        hits.push({ id: t.id, x: x, y: my, r: 16, kind: "temp" });
      });
      drawLabel(DE ? "TEMPERATUR" : "TEMPERATURE", 24, 26, C.muted, "left", 9);
      drawLabel(DE ? "Klicke zwei Punkte" : "Click two points", size.w - 24, 26, C.muted, "right", 9);
      drawLabel(text(a.label) + " + " + text(b.label) + " = " + text(target.label), size.w / 2, size.h - 22, C.soft, "center", 11);
      canvas.setAttribute("aria-label", DE
        ? "Temperaturlinie. " + text(a.label) + " plus " + text(b.label) + " ergibt " + text(target.label) + "."
        : "Temperature line. " + text(a.label) + " plus " + text(b.label) + " equals " + text(target.label) + ".");
      updateReadout();
    }
    function drawLine3D(a, b, alpha) {
      ctx.strokeStyle = "rgba(0,75,111," + alpha + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    function drawPlaneGrid() {
      for (var g = -1; g <= 1; g += 0.5) {
        drawLine3D(project(g, -1, 0), project(g, 1, 0), .10);
        drawLine3D(project(-1, g, 0), project(1, g, 0), .10);
      }
    }
    function drawRoomGrid(zMix) {
      var x0 = -1.15, x1 = 1.15, y0 = -1.15, y1 = 1.15, z0 = -1.45, z1 = 1.65;
      var step = 0.25;
      ctx.globalAlpha = zMix;
      for (var g = x0; g <= x1 + 0.001; g += step) drawLine3D(project(g, y0, z0), project(g, y1, z0), .060);
      for (var g2 = y0; g2 <= y1 + 0.001; g2 += step) drawLine3D(project(x0, g2, z0), project(x1, g2, z0), .060);
      for (var g3 = x0; g3 <= x1 + 0.001; g3 += step) drawLine3D(project(g3, y1, z0), project(g3, y1, z1), .072);
      for (var g4 = z0; g4 <= z1 + 0.001; g4 += step) drawLine3D(project(x0, y1, g4), project(x1, y1, g4), .072);
      for (var g5 = y0; g5 <= y1 + 0.001; g5 += step) drawLine3D(project(x0, g5, z0), project(x0, g5, z1), .072);
      for (var g6 = z0; g6 <= z1 + 0.001; g6 += step) drawLine3D(project(x0, y0, g6), project(x0, y1, g6), .072);
      drawLine3D(project(x0, y1, z0), project(x1, y1, z0), .16);
      drawLine3D(project(x0, y0, z0), project(x0, y1, z0), .16);
      drawLine3D(project(x0, y1, z0), project(x0, y1, z1), .16);
      drawLine3D(project(x0, y1, z1), project(x1, y1, z1), .12);
      drawLine3D(project(x0, y1, z1), project(x0, y0, z1), .12);
      ctx.globalAlpha = 1;
    }
    function drawSpace() {
      hits = [];
      var yMix = smoothstep(0, 1, dimMix);
      var zMix = smoothstep(1, 2, dimMix);
      if (zMix > 0.02) drawRoomGrid(zMix);
      var planeAlpha = smoothstep(0.18, 0.86, dimMix) * (1 - zMix);
      if (planeAlpha > 0.01) {
        ctx.globalAlpha = planeAlpha;
        drawPlaneGrid();
        ctx.globalAlpha = 1;
      }
      var axisAlpha = 1 - smoothstep(0.04, 0.42, yMix);
      if (axisAlpha > 0.01) {
        ctx.globalAlpha = axisAlpha;
        var axisA = project(-1.15, 0, 0);
        var axisB = project(1.15, 0, 0);
        drawLine3D(axisA, axisB, .16);
        ctx.globalAlpha = 1;
      }
      var origin = project(0, 0, 0);
      var xEnd = project(1.15, 0, 0);
      drawArrow(origin.x, origin.y, xEnd.x, xEnd.y, "rgba(0,75,111,.30)", 1.2);
      drawLabel(DE ? "MACHT" : "POWER", xEnd.x + 6, xEnd.y + 3, C.muted, "left", 9);
      if (yMix > 0.05) {
        var yEnd = project(0, 1.15, 0);
        drawArrow(origin.x, origin.y, yEnd.x, yEnd.y, "rgba(0,75,111,.30)", 1.2);
        ctx.globalAlpha = yMix;
        drawLabel(DE ? "GESCHLECHT" : "GENDER", yEnd.x, yEnd.y - 8, C.muted, "center", 9);
        ctx.globalAlpha = 1;
      }
      if (zMix > 0.05) {
        var zEnd = project(0, 0, 1.7);
        drawArrow(origin.x, origin.y, zEnd.x, zEnd.y, "rgba(0,75,111,.24)", 1.2);
        ctx.globalAlpha = zMix;
        drawLabel(DE ? "RANG · WELT" : "RANK · WORLD", zEnd.x + 6, zEnd.y, C.muted, "left", 9);
        ctx.globalAlpha = 1;
      }

      var cr = currentResult();
      var result = cr.result, steps = cr.steps, dirMode = cr.dirMode;
      var tokenAlpha = tokenAlphaFor(dimMix);
      canvas.__lsTokenAlpha = tokenAlpha;
      var groupAlpha = (1 - smoothstep(0, 0.5, dimMix)) * tokenAlpha;
      var individualAlpha = smoothstep(0, 0.5, dimMix) * tokenAlpha;
      var threeDAlpha = smoothstep(1.15, 1.95, dimMix);

      var drawList = WORD_IDS.map(function (id) {
        var w = WORDS[id];
        var p = project((w.v[0] - 12.5) / 15, w.v[1] / 22, w.z);
        return { id: id, p: p, threeD: false };
      });
      if (threeDAlpha > 0.01) {
        WORD_IDS_3D.forEach(function (id) {
          var w = WORDS[id];
          var p = project((w.v[0] - 12.5) / 15, w.v[1] / 22, w.z);
          drawList.push({ id: id, p: p, threeD: true });
        });
      }
      drawList.sort(function (a, b) { return a.p.z - b.p.z; });

      if (st.vectorMode && zMix > 0.5 && individualAlpha > 0.05) {
        drawList.forEach(function (item) {
          var itemAlpha = individualAlpha * (item.threeD ? threeDAlpha : 1);
          if (itemAlpha < 0.01) return;
          var selected = item.id === st.selected;
          var col = selected ? C.green : groupColor(WORDS[item.id].group);
          ctx.globalAlpha = itemAlpha * (selected ? 0.92 : 0.30);
          drawArrow(origin.x, origin.y, item.p.x, item.p.y, col, selected ? 2.2 : 1.0);
        });
        ctx.globalAlpha = 1;
        drawLabel(DE ? "Jedes Wort ist ein Pfeil vom Ursprung: Richtung = Bedeutung" : "Every word is an arrow from the origin: direction = meaning", size.w / 2, size.h - 18, C.petrol, "center", 10);
        drawLabel(DE ? "Ursprung" : "origin", origin.x + 6, origin.y + 14, C.muted, "left", 9);
      } else if (individualAlpha > 0.05 && dimMix > 1.15 && st.selected && WORDS[st.selected]) {
        var selectedWord = WORDS[st.selected];
        var selectedPoint = project((selectedWord.v[0] - 12.5) / 15, selectedWord.v[1] / 22, selectedWord.z);
        ctx.save();
        ctx.strokeStyle = C.green;
        ctx.globalAlpha = individualAlpha * 0.7;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(selectedPoint.x, selectedPoint.y);
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 1;
        drawLabel(DE ? "Ursprung" : "origin", origin.x + 6, origin.y + 14, C.muted, "left", 9);
      }

      if (groupAlpha > 0.01) {
        ctx.globalAlpha = groupAlpha;
        powerGroups().forEach(function (g) {
          if (g.ids.length < 2) return;
          var p = project(g.x, 0, 0);
          ctx.save();
          ctx.strokeStyle = C.lilac;
          ctx.setLineDash([3, 3]);
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(p.x - 7, p.y - 14); ctx.lineTo(p.x - 7, p.y + 14);
          ctx.moveTo(p.x + 7, p.y - 14); ctx.lineTo(p.x + 7, p.y + 14);
          ctx.moveTo(p.x - 7, p.y - 14); ctx.lineTo(p.x + 7, p.y - 14);
          ctx.moveTo(p.x - 7, p.y + 14); ctx.lineTo(p.x + 7, p.y + 14);
          ctx.stroke();
          ctx.restore();
          ctx.fillStyle = C.lilac;
          ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
          ctx.textAlign = "center";
          ctx.fillText(g.ids.length + (DE ? " Wörter teilen sich eine Stelle" : " words share one position"), p.x, p.y + 28);
        });
        ctx.fillStyle = C.lilac;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(DE ? "1D: kein freier Weg zwischen ihnen" : "1D: no free path between them", size.w / 2, size.h - 16);
        ctx.globalAlpha = 1;
      }
      if (dirMode) {
        ctx.globalAlpha = individualAlpha;
        function arrowWord(from, to, col, dash) {
          var a = project((WORDS[from].v[0] - 12.5) / 15, WORDS[from].v[1] / 22, WORDS[from].z);
          var b = project((WORDS[to].v[0] - 12.5) / 15, WORDS[to].v[1] / 22, WORDS[to].z);
          drawArrow(a.x, a.y, b.x, b.y, col, 1.8, dash || null);
        }
        if (individualAlpha > 0.5 && (dirMode === "gender" || dirMode === "directions")) {
          arrowWord("man", "woman", C.green, [4, 3]);
          arrowWord("king", "queen", C.green, [4, 3]);
          if (st.dim === 2) {
            arrowWord("maleDog", "femaleDog", C.sky, [4, 3]);
            arrowWord("wizard", "sorceress", C.lime, [4, 3]);
          }
        }
        if (dirMode === "layers" && st.dim === 2) {
          arrowWord("man", "maleDog", C.sky, [4, 3]);
          arrowWord("man", "wizard", C.lime, [4, 3]);
          arrowWord("woman", "femaleDog", C.sky, [4, 3]);
          arrowWord("woman", "sorceress", C.lime, [4, 3]);
        }
        if (dirMode === "power-dir" || dirMode === "directions") {
          arrowWord("man", "prince", C.gold, [4, 3]);
          arrowWord("prince", "king", C.gold, [4, 3]);
          arrowWord("woman", "princess", C.gold, [4, 3]);
          arrowWord("princess", "queen", C.gold, [4, 3]);
        }
        ctx.globalAlpha = 1;
      }

      if (steps.length) {
        steps.forEach(function (step) {
          var a = normPoint(step.from), b = normPoint(step.to);
          var pa = project(a.x, a.y, a.z);
          var pb = project(b.x, b.y, b.z);
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = C.blue;
          ctx.globalAlpha = individualAlpha * 0.55;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
          ctx.restore();
        });
      }

      if (groupAlpha > 0.01) {
        ctx.globalAlpha = groupAlpha;
        powerGroups().forEach(function (g) {
          var p = project(g.x, 0, 0);
          var key = g.ids.join("+");
          var on = (st.group && st.group.length === g.ids.length && st.group.every(function (id) { return g.ids.indexOf(id) >= 0; })) ||
            (!st.group && st.selected && g.ids.indexOf(st.selected) >= 0);
          var hot = hover === key;
          var r = on ? 8 : (hot ? 7 : 5.5);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = groupColor(WORDS[g.ids[0]].group);
          ctx.fill();
          ctx.strokeStyle = C.paper;
          ctx.lineWidth = 2;
          ctx.stroke();
          if (on) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2);
            ctx.strokeStyle = C.petrol;
            ctx.globalAlpha = groupAlpha * 0.5;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.globalAlpha = groupAlpha;
          }
          if (hot) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, r + 3, 0, Math.PI * 2);
            ctx.strokeStyle = C.blue;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          var label = wordLabel(g.ids[0]) + (g.ids.length > 1 ? " +" + (g.ids.length - 1) : "");
          drawLabel(label, p.x, p.y - 17, on ? C.petrol : C.soft, "center", 10);
          if (g.ids.length > 1) drawLabel("×" + g.ids.length, p.x, p.y + 21, C.muted, "center", 9);
          if (groupAlpha > 0.5) hits.push({ id: key, ids: g.ids.slice(), x: p.x, y: p.y, r: 18, kind: "group" });
        });
        if (result && groupAlpha > 0.5) {
          var rg = groupAtX((result.v[0] - 12.5) / 15);
          if (rg) {
            var gp = project(rg.x, 0, 0);
            ctx.beginPath();
            ctx.moveTo(gp.x, gp.y - 8);
            ctx.lineTo(gp.x + 8, gp.y);
            ctx.lineTo(gp.x, gp.y + 8);
            ctx.lineTo(gp.x - 8, gp.y);
            ctx.closePath();
            ctx.fillStyle = C.gold;
            ctx.fill();
            ctx.strokeStyle = C.paper;
            ctx.lineWidth = 2;
            ctx.stroke();
            var rgLabel = wordLabel(rg.ids[0]) + (rg.ids.length > 1 ? " +" + (rg.ids.length - 1) : "");
            drawLabel("≈ " + rgLabel, gp.x, gp.y + 27, C.petrol, "center", 11);
          }
        }
        ctx.globalAlpha = 1;
      }

      if (individualAlpha > 0.01) {
        drawList.forEach(function (item) {
          var id = item.id, p = item.p;
          var itemAlpha = individualAlpha * (item.threeD ? threeDAlpha : 1);
          if (itemAlpha < 0.01) return;
          ctx.globalAlpha = itemAlpha;
          var selected = id === st.selected;
          var hovered = id === hover;
          var hit;
          if (st.vectorMode && zMix > 0.5) {
            var tipCol = selected ? C.green : groupColor(WORDS[id].group);
            ctx.beginPath();
            ctx.arc(p.x, p.y, selected ? 3.4 : 2.1, 0, Math.PI * 2);
            ctx.fillStyle = tipCol;
            ctx.fill();
            ctx.strokeStyle = C.paper;
            ctx.lineWidth = 1.3;
            ctx.stroke();
            hit = { x: p.x, y: p.y, r: selected ? 9 : 7 };
          } else {
            hit = drawPoint(p.x, p.y, id, selected, hovered);
          }
          if (itemAlpha > 0.5) hits.push({ id: id, x: hit.x, y: hit.y, r: hit.r + 10, kind: "word" });
          var labelY = p.y - 12;
          if (id === "power") labelY = p.y + 20;
          drawLabel(wordLabel(id), p.x, labelY, selected ? groupColor(WORDS[id].group) : C.soft, "center", 11);
          if (hovered) {
            var extra = item.threeD ? ", " + WORDS[id].z.toFixed(2) : "";
            drawLabel("(" + WORDS[id].v[0] + ", " + WORDS[id].v[1] + extra + ")", p.x, p.y + 18, C.muted, "center", 9);
          }
          ctx.globalAlpha = 1;
        });
        if (result && individualAlpha > 0.5) {
          var rp = normPoint(result.v);
          var pp = project(rp.x, rp.y, WORDS.power.z);
          ctx.beginPath();
          ctx.moveTo(pp.x, pp.y - 8);
          ctx.lineTo(pp.x + 8, pp.y);
          ctx.lineTo(pp.x, pp.y + 8);
          ctx.lineTo(pp.x - 8, pp.y);
          ctx.closePath();
          ctx.fillStyle = C.gold;
          ctx.fill();
          ctx.strokeStyle = C.paper;
          ctx.lineWidth = 2;
          ctx.stroke();
          drawLabel("≈ " + wordLabel(result.near), pp.x, pp.y + 24, C.petrol, "center", 11);
        }
        ctx.globalAlpha = 1;
      }

      var modeLabel = dimMix < 0.5 ? "1D" : (dimMix < 1.5 ? "2D" : "3D");
      drawLabel("EMBEDDING · " + modeLabel, 24, 26, C.muted, "left", 9);
      drawLabel(DE ? "Ziehen zum Drehen · Wörter anklicken" : "Drag to rotate · click words", size.w - 24, 26, C.muted, "right", 9);
      canvas.setAttribute("aria-label", DE
        ? "Interaktiver Embedding-Raum in " + modeLabel + ". Wörter sind anklickbar; im 3D-Modus kannst du ziehen." + (st.vectorMode ? " Wörter werden als Pfeile vom Ursprung gezeigt." : "")
        : "Interactive embedding space in " + modeLabel + ". Words are clickable; in 3D you can drag." + (st.vectorMode ? " Words are shown as arrows from the origin." : ""));
      updateReadout();
    }
    function draw() {
      if (!size) resize();
      if (!size || !ctx) return;
      ctx.clearRect(0, 0, size.w, size.h);
      if (st.mode === "temperature") drawTemperature();
      else drawSpace();
      canvas.__lsHits = hits;
      canvas.__lsState = st;
      canvas.__lsDimMix = dimMix;
      syncMiniSelection();
    }

    function updateReadout() {
      if (st.mode === "temperature") {
        var a = tempById(st.pair[0]), b = tempById(st.pair[1]);
        var target = tempByValue(a.value + b.value);
        var aLabel = text(a.label);
        var bLabel = text(b.label);
        var targetLabel = text(target.label);
        readout.innerHTML = '<b>' + esc(aLabel) + '</b> + <b>' + esc(bLabel) + '</b> = <b>' + esc(targetLabel) + '</b>';
        setTex("\\underbrace{" + texNum(a.value) + "}_{\\text{" + aLabel + "}} + \\underbrace{" + texNum(b.value) + "}_{\\text{" + bLabel + "}} = \\underbrace{" + texNum(target.value) + "}_{\\text{" + targetLabel + "}}");
        return;
      }
      var cr = currentResult();
      var result = cr.result, dirMode = cr.dirMode, example = cr.example;
      if (dirMode) {
        var desc = dirMode === "gender"
          ? (DE ? "In echten Embeddings verbindet eine gelernte Richtung Mann und Frau sowie König und Königin; in dieser Demo ist sie konstruiert." : "In real embeddings one learned direction connects man and woman, and king and queen; in this demo it is constructed.")
          : dirMode === "power-dir"
            ? (DE ? "In echten Embeddings führt eine andere gelernte Richtung von Mann zu Prinz zu König; hier ist auch sie konstruiert." : "In real embeddings another learned direction moves from man to prince to king; here it is constructed as well.")
            : dirMode === "layers"
              ? (DE ? "Dieselbe Geschlechtsrichtung erscheint in der Tier- und Figurenebene; die dritte Achse verschiebt die Punkte nach unten oder oben." : "The same gender direction appears in the animal and fiction layers; the third axis moves the points down or up.")
              : (DE ? "Zwei konstruierte Richtungen: Geschlecht und Macht." : "Two constructed directions: gender and power.");
        readout.innerHTML = esc(desc);
        var tex = dirMode === "gender"
          ? "\\underbrace{\\vec{x}_{\\text{" + wordLabel("woman") + "}} - \\vec{x}_{\\text{" + wordLabel("man") + "}}}_{\\text{" + (DE ? "Geschlechtsschritt" : "gender step") + "}} = \\underbrace{\\vec{x}_{\\text{" + wordLabel("queen") + "}} - \\vec{x}_{\\text{" + wordLabel("king") + "}}}_{\\text{" + (DE ? "derselbe Schritt" : "the same step") + "}}"
          : dirMode === "power-dir"
            ? "\\underbrace{\\vec{x}_{\\text{" + wordLabel("prince") + "}} - \\vec{x}_{\\text{" + wordLabel("man") + "}}}_{\\text{" + (DE ? "Machtschritt" : "power step") + "}} = \\underbrace{\\vec{x}_{\\text{" + wordLabel("king") + "}} - \\vec{x}_{\\text{" + wordLabel("prince") + "}}}_{\\text{" + (DE ? "noch ein Schritt" : "another step") + "}}"
            : dirMode === "layers"
              ? "\\begin{aligned}\\underbrace{\\vec{x}_{\\text{" + wordLabel("femaleDog") + "}} - \\vec{x}_{\\text{" + wordLabel("maleDog") + "}}}_{\\text{" + (DE ? "Geschlecht, Tierebene" : "gender, animal layer") + "}} &= \\underbrace{\\vec{x}_{\\text{" + wordLabel("woman") + "}} - \\vec{x}_{\\text{" + wordLabel("man") + "}}}_{\\text{" + (DE ? "Geschlecht, Menschenebene" : "gender, human layer") + "}} \\\\ \\underbrace{\\vec{x}_{\\text{" + wordLabel("sorceress") + "}} - \\vec{x}_{\\text{" + wordLabel("wizard") + "}}}_{\\text{" + (DE ? "Geschlecht, Figurenebene" : "gender, fiction layer") + "}} &= \\underbrace{\\vec{x}_{\\text{" + wordLabel("queen") + "}} - \\vec{x}_{\\text{" + wordLabel("king") + "}}}_{\\text{" + (DE ? "dieselbe Richtung" : "same direction") + "}}\\end{aligned}"
              : "\\begin{aligned}\\underbrace{\\vec{x}_{\\text{" + wordLabel("woman") + "}} - \\vec{x}_{\\text{" + wordLabel("man") + "}}}_{\\text{" + (DE ? "Geschlecht" : "gender") + "}} &= \\underbrace{\\vec{x}_{\\text{" + wordLabel("queen") + "}} - \\vec{x}_{\\text{" + wordLabel("king") + "}}}_{\\text{" + (DE ? "dieselbe Richtung" : "same direction") + "}} \\\\ \\underbrace{\\vec{x}_{\\text{" + wordLabel("prince") + "}} - \\vec{x}_{\\text{" + wordLabel("man") + "}}}_{\\text{" + (DE ? "Macht" : "power") + "}} &= \\underbrace{\\vec{x}_{\\text{" + wordLabel("king") + "}} - \\vec{x}_{\\text{" + wordLabel("prince") + "}}}_{\\text{" + (DE ? "dieselbe Richtung" : "same direction") + "}}\\end{aligned}";
        setTex(tex);
        return;
      }
      if (result) {
        readout.innerHTML = '<b>' + esc(example ? text(example.label) : "") + '</b> · (' + result.v.map(function (x) { return esc(x.toFixed(1)); }).join(', ') + ') · ' +
          (DE ? "nächstes Wort" : "nearest word") + ': <b>' + esc(wordLabel(result.near)) + '</b>';
        var dims = st.dim === 0 ? 1 : (st.dim === 2 ? 3 : 2);
        var resV = result.v.slice(0, dims);
        var resultTex = dims === 1 ? texNum(resV[0]) : "\\begin{pmatrix}" + resV.map(texNum).join("\\\\") + "\\end{pmatrix}";
        setTex(vectorExprTex(example ? example.expr : "", dims) + " = \\underbrace{" + resultTex + "}_{\\approx \\text{" + wordLabel(result.near) + "}}");
        return;
      }
      var groupIds = st.group;
      if (!groupIds && st.selected && st.dim === 0) {
        powerGroups().forEach(function (g) {
          if (g.ids.indexOf(st.selected) >= 0) groupIds = g.ids;
        });
      }
      if (groupIds && groupIds.length > 1 && st.dim === 0) {
        readout.innerHTML = groupIds.map(wordLabel).join(" / ");
        setTex("\\underbrace{x_{\\text{" + wordLabel(groupIds[0]) + "}} = x_{\\text{" + wordLabel(groupIds[1]) + "}}}_{\\text{" + (DE ? "dieselbe 1D-Position" : "the same 1D position") + "}}");
        return;
      }
      if (st.selected) {
        var w = WORDS[st.selected];
        var wv = st.dim === 2 ? [w.v[0], w.v[1], w.z] : [w.v[0], w.v[1]];
        readout.innerHTML = '<b>' + esc(wordLabel(st.selected)) + '</b> · (' + wv.map(function (x) { return esc(x); }).join(', ') + ')';
        setTex("\\underbrace{\\vec{x}_{\\text{" + wordLabel(st.selected) + "}}}_{\\text{" + (DE ? "konstruierter Wortvektor" : "constructed word vector") + "}} = \\begin{pmatrix}" + wv.join("\\\\") + "\\end{pmatrix}");
        return;
      }
      readout.textContent = DE ? "Klicke ein Wort im Raum." : "Click a word in the space.";
      setTex("\\text{" + (DE ? "Klicke ein Wort im Raum." : "Click a word in the space.") + "}");
    }
    function setTex(tex) {
      if (!mathEl) return;
      if (!tex) {
        mathEl.removeAttribute("data-tex");
        mathEl.removeAttribute("data-tex-rendered");
        mathEl.innerHTML = "";
        return;
      }
      mathEl.setAttribute("data-tex", tex);
      mathEl.removeAttribute("data-tex-rendered");
      if (api.typeset) api.typeset(formula);
    }

    function makeChip(label, on, handler) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-chip" + (on ? " is-on" : "");
      b.textContent = label;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.addEventListener("click", handler);
      return b;
    }
    function syncTableVisibility() {
      var showHigh = st.mode === "space" && st.dim === 2 && !!st.showHighdim;
      if (miniTable) miniTable.hidden = !(st.mode === "space" && st.dim === 2 && st.tables && !showHigh);
      if (highdimEl) highdimEl.hidden = !showHigh;
      if (stage) stage.classList.toggle("is-highdim", showHigh);
    }
    function renderControls() {
      controls.innerHTML = "";
      var row1 = document.createElement("div");
      row1.className = "ls-scene-row";
      row1.appendChild(makeChip(DE ? "Temperatur" : "Temperature", st.mode === "temperature", function () {
        st.mode = "temperature"; st.group = null; st.showHighdim = false; syncControls(); draw(); ensureLoop();
      }));
      row1.appendChild(makeChip(DE ? "Bedeutung" : "Meaning", st.mode === "space", function () {
        st.mode = "space"; syncControls(); draw(); ensureLoop();
      }));
      if (st.mode === "space") {
        ["1D", "2D", "3D"].forEach(function (label, i) {
          row1.appendChild(makeChip(label, st.dim === i, function () {
            st.dim = i; animateDimTo(i); st.group = null;
            if (i !== 2 && st.selected && WORDS[st.selected] && WORDS[st.selected].only3d) st.selected = "king";
            if (i !== 2 && st.arithmetic) {
              var curEx = EXAMPLES.filter(function (e) { return e.id === st.arithmetic; })[0];
              if (curEx && curEx.only3d) st.arithmetic = null;
            }
            if (i !== 2) st.showHighdim = false;
            syncControls(); ensureLoop();
          }));
        });
        var reset = document.createElement("button");
        reset.type = "button";
        reset.className = "ls-btn ls-btn--ghost ls-btn--tiny";
        reset.textContent = DE ? "Ansicht" : "View";
        reset.title = DE ? "Nächste Ansicht" : "Next view";
        reset.setAttribute("aria-label", DE ? "Nächste Ansicht" : "Next view");
        reset.addEventListener("click", function () {
          viewPreset = (viewPreset + 1) % VIEW_PRESETS.length;
          camTarget = VIEW_PRESETS[viewPreset];
          if (api.onHint) api.onHint((DE ? "Ansicht " : "View ") + (viewPreset + 1) + " / " + VIEW_PRESETS.length);
          ensureLoop();
        });
        row1.appendChild(reset);
        if (st.dim === 2) {
          row1.appendChild(makeChip(DE ? "Pfeile" : "Arrows", st.vectorMode, function () {
            st.vectorMode = !st.vectorMode; syncControls(); draw();
          }));
          var tableBtn = document.createElement("button");
          tableBtn.type = "button";
          tableBtn.className = "ls-btn ls-btn--ghost ls-btn--tiny";
          tableBtn.textContent = st.showHighdim ? (DE ? "← 3D" : "← 3D") : (DE ? "4096 Dimensionen" : "4096 dimensions");
          tableBtn.addEventListener("click", function () {
            st.showHighdim = !st.showHighdim;
            if (st.showHighdim) buildHighdimTable();
            syncControls();
            draw();
          });
          row1.appendChild(tableBtn);
        }
      }
      syncTableVisibility();
      controls.appendChild(row1);

      var row2 = document.createElement("div");
      row2.className = "ls-scene-row";
      if (st.mode === "temperature") {
        PAIRS.forEach(function (pair) {
          var p0 = tempById(pair[0]), p1 = tempById(pair[1]);
          var label = text(p0.label) + " + " + text(p1.label);
          row2.appendChild(makeChip(label, st.pair[0] === pair[0] && st.pair[1] === pair[1], function () {
            st.pair = pair.slice(); syncControls(); draw();
          }));
        });
      } else {
        examplesForDim().forEach(function (ex) {
          row2.appendChild(makeChip(text(ex.label), st.arithmetic === ex.id, function () {
            st.arithmetic = st.arithmetic === ex.id ? null : ex.id; syncControls(); draw();
          }));
        });
        var select = document.createElement("select");
        select.className = "ls-word-select";
        select.setAttribute("aria-label", DE ? "Wort auswählen" : "Select a word");
        var opt0 = document.createElement("option");
        opt0.value = "";
        opt0.textContent = DE ? "Wort …" : "Word …";
        select.appendChild(opt0);
        var selectIds = st.dim === 2 ? WORD_IDS.concat(WORD_IDS_3D) : WORD_IDS;
        selectIds.forEach(function (id) {
          var opt = document.createElement("option");
          opt.value = id;
          opt.textContent = wordLabel(id);
          select.appendChild(opt);
        });
        select.value = st.selected || "";
        select.addEventListener("change", function () {
          st.selected = select.value || null;
          st.group = null;
          draw();
        });
        row2.appendChild(select);
      }
      controls.appendChild(row2);
    }
    function syncControls() { renderControls(); }

    function animateDimTo(target) {
      target = clamp(target, 0, 2);
      if (target === dimTarget && !dimAnim) return;
      dimAnim = { from: dimMix, to: target, elapsed: 0, last: 0, duration: 1400 };
      dimTarget = target;
      ensureLoop();
    }
    function applyState(s) {
      if (!s) return;
      var modeChanged = !!(s.mode && s.mode !== st.mode);
      if (s.mode) st.mode = s.mode;
      if (typeof s.dim === "number") {
        var nextDim = clamp(s.dim, 0, 2);
        if (nextDim !== st.dim) animateDimTo(nextDim);
        else dimTarget = nextDim;
        st.dim = nextDim;
      }
      if (s.selected) st.selected = s.selected;
      if (st.dim !== 2 && st.selected && WORDS[st.selected] && WORDS[st.selected].only3d) st.selected = "king";
      if (s.arithmetic !== undefined) st.arithmetic = s.arithmetic;
      if (st.dim !== 2 && st.arithmetic) {
        var curEx = EXAMPLES.filter(function (e) { return e.id === st.arithmetic; })[0];
        if (curEx && curEx.only3d) st.arithmetic = null;
      }
      if (s.pair) st.pair = s.pair.slice();
      st.group = s.group ? s.group.slice() : null;
      st.tables = !!s.tables;
      st.vectorMode = !!s.vectorMode;
      st.showHighdim = !!s.showHighdim;
      if (st.dim !== 2) { st.showHighdim = false; st.vectorMode = false; }
      syncControls();
      function paint() { draw(); ensureLoop(); }
      if (modeChanged && stateApplied && V && V.crossfadeCanvas) {
        V.crossfadeCanvas(canvas, paint, { dir: st.mode === "space" ? 1 : -1, duration: 300 });
        if (controls && controls.animate && !api.reducedMotion) {
          try {
            controls.animate([
              { opacity: 0, transform: "translateY(4px)" },
              { opacity: 1, transform: "none" }
            ], { duration: 240, delay: 30, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
          } catch (e) {}
        }
      } else {
        paint();
      }
      stateApplied = true;
    }

    function currentExampleIndex() {
      var list = examplesForDim();
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === st.arithmetic) return i;
      }
      return -1;
    }
    function currentPairIndex() {
      for (var i = 0; i < PAIRS.length; i++) {
        if ((PAIRS[i][0] === st.pair[0] && PAIRS[i][1] === st.pair[1]) ||
            (PAIRS[i][0] === st.pair[1] && PAIRS[i][1] === st.pair[0])) return i;
      }
      return -1;
    }
    function nextExample() {
      if (st.mode === "temperature") {
        var pi = currentPairIndex();
        if (pi < 0) pi = -1;
        if (pi >= PAIRS.length - 1) return false;
        st.pair = PAIRS[pi + 1].slice();
        syncControls();
        draw();
        ensureLoop();
        return true;
      }
      if (st.mode !== "space" || st.dim < 1) return false;
      var list = examplesForDim();
      var idx = currentExampleIndex();
      if (idx < 0) idx = -1;
      if (idx >= list.length - 1) return false;
      st.arithmetic = list[idx + 1].id;
      syncControls();
      draw();
      ensureLoop();
      return true;
    }
    function prevExample() {
      if (st.mode === "temperature") {
        var pi = currentPairIndex();
        if (pi <= 0) return false;
        st.pair = PAIRS[pi - 1].slice();
        syncControls();
        draw();
        ensureLoop();
        return true;
      }
      if (st.mode !== "space" || st.dim < 1) return false;
      var list = examplesForDim();
      var idx = currentExampleIndex();
      if (idx <= 0) return false;
      st.arithmetic = list[idx - 1].id;
      syncControls();
      draw();
      ensureLoop();
      return true;
    }

    function hitAt(x, y) {
      var best = null, bd = 22;
      hits.forEach(function (h) {
        var d = Math.hypot(h.x - x, h.y - y);
        if (d < Math.max(bd, h.r)) { bd = d; best = h; }
      });
      return best;
    }
    function pointerPos(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function onMove(e) {
      var p = pointerPos(e);
      if (drag) {
        camTarget = null;
        viewPreset = -1;
        st.yaw += (e.clientX - drag.x) * 0.008;
        st.pitch = clamp(st.pitch + (e.clientY - drag.y) * 0.006, 0.15, 1.35);
        drag.x = e.clientX;
        drag.y = e.clientY;
        suppressClick = true;
        draw();
        return;
      }
      var hit = hitAt(p.x, p.y);
      var next = hit ? hit.id : null;
      if (next !== hover) {
        hover = next;
        canvas.style.cursor = next ? "pointer" : (st.mode === "space" && dimTarget > 1 ? "grab" : "default");
        draw();
      }
    }
    function onDown(e) {
      var p = pointerPos(e);
      var hit = hitAt(p.x, p.y);
      if (hit) {
        suppressClick = false;
        drag = null;
        return;
      }
      if (st.mode === "space" && dimTarget > 1) {
        drag = { x: e.clientX, y: e.clientY };
        suppressClick = false;
        canvas.style.cursor = "grabbing";
        if (canvas.setPointerCapture) try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      }
    }
    function onUp(e) {
      if (drag) {
        drag = null;
        canvas.style.cursor = "grab";
        return;
      }
      if (suppressClick) { suppressClick = false; return; }
      var p = pointerPos(e);
      var hit = hitAt(p.x, p.y);
      if (!hit) return;
      if (hit.kind === "temp") {
        var id = hit.id;
        if (st.pair[0] === id) st.pair = [st.pair[1], st.pair[0]];
        else st.pair = [st.pair[0], id];
        syncControls();
        draw();
      } else if (hit.kind === "group") {
        st.group = hit.ids.slice();
        st.selected = hit.ids[0];
        syncControls();
        draw();
      } else {
        st.group = null;
        st.selected = hit.id;
        draw();
      }
    }
    function onWheel(e) {
      if (st.mode !== "space" || dimTarget < 2) return;
      e.preventDefault();
      camTarget = null;
      viewPreset = -1;
      st.zoom = clamp(st.zoom * (e.deltaY > 0 ? 0.94 : 1.06), 0.55, 2.2);
      draw();
    }
    function reserveHeights() {
      var saved = {
        mode: st.mode, dim: st.dim, selected: st.selected, arithmetic: st.arithmetic,
        pair: st.pair.slice(), group: st.group ? st.group.slice() : null
      };
      var maxControls = 0, maxFormula = 0;
      function measure(state) {
        st.mode = state.mode;
        st.dim = state.dim;
        st.selected = state.selected;
        st.arithmetic = state.arithmetic;
        st.pair = state.pair || ["cold", "lukewarm"];
        st.group = state.group || null;
        renderControls();
        updateReadout();
        maxControls = Math.max(maxControls, controls.scrollHeight);
        maxFormula = Math.max(maxFormula, formula.scrollHeight);
      }
      measure({ mode: "temperature", dim: 0, selected: null, arithmetic: null, pair: ["cold", "lukewarm"] });
      measure({ mode: "space", dim: 0, selected: "king", arithmetic: null });
      measure({ mode: "space", dim: 0, selected: "male", arithmetic: null, group: ["male", "female"] });
      measure({ mode: "space", dim: 1, selected: "king", arithmetic: null });
      measure({ mode: "space", dim: 2, selected: "king", arithmetic: null });
      EXAMPLES.forEach(function (ex) {
        measure({ mode: "space", dim: 1, selected: null, arithmetic: ex.id });
        measure({ mode: "space", dim: 2, selected: null, arithmetic: ex.id });
      });
      st.mode = saved.mode;
      st.dim = saved.dim;
      st.selected = saved.selected;
      st.arithmetic = saved.arithmetic;
      st.pair = saved.pair;
      st.group = saved.group;
      renderControls();
      draw();
      var maxAllowed = size && size.w < 560 ? 132 : 170;
      var cH = Math.max(Math.ceil(maxControls), 106);
      var fH = Math.min(Math.max(Math.ceil(maxFormula), 112), maxAllowed);
      if (Math.abs((parseFloat(controls.style.minHeight) || 0) - cH) > 1) controls.style.minHeight = cH + "px";
      if (Math.abs((parseFloat(formula.style.minHeight) || 0) - fH) > 1) {
        formula.style.minHeight = fH + "px";
        formula.style.maxHeight = fH + "px";
      }
    }
    function runReserve() {
      reserveTimer = 0;
      if (reserveIdle && window.cancelIdleCallback) { try { window.cancelIdleCallback(reserveIdle); } catch (e) {} }
      reserveIdle = 0;
      if (window.requestIdleCallback) {
        reserveIdle = window.requestIdleCallback(reserveHeights, { timeout: 1200 });
      } else {
        reserveHeights();
      }
    }
    function scheduleReserve() {
      clearTimeout(reserveTimer);
      if (reserveIdle && window.cancelIdleCallback) { try { window.cancelIdleCallback(reserveIdle); } catch (e) {} }
      reserveIdle = 0;
      reserveTimer = setTimeout(runReserve, 140);
    }
    function resize() {
      size = api.fit(canvas, stage);
      ctx = size.ctx;
      draw();
      scheduleReserve();
    }
    function ensureLoop() {
      if (!raf) raf = requestAnimationFrame(loop);
    }
    function loop(now) {
      raf = 0;
      if (now - last < 33) { ensureLoop(); return; }
      last = now;
      var changed = false;
      if (dimAnim) {
        if (!dimAnim.last) dimAnim.last = now;
        // Clamp dt so a paused/throttled tab resumes smoothly instead of jumping.
        var dt = Math.min(50, Math.max(0, now - dimAnim.last));
        dimAnim.last = now;
        dimAnim.elapsed = Math.min(dimAnim.duration, dimAnim.elapsed + dt);
        var p = dimAnim.elapsed / dimAnim.duration;
        dimMix = lerp(dimAnim.from, dimAnim.to, ease(p));
        if (p >= 1) {
          dimMix = dimAnim.to;
          dimTarget = dimMix;
          dimAnim = null;
        }
        changed = true;
      }
      if (camTarget) {
        st.yaw += (camTarget.yaw - st.yaw) * 0.18;
        st.pitch += (camTarget.pitch - st.pitch) * 0.18;
        st.zoom += (camTarget.zoom - st.zoom) * 0.18;
        if (Math.abs(camTarget.yaw - st.yaw) < 0.002 &&
            Math.abs(camTarget.pitch - st.pitch) < 0.002 &&
            Math.abs(camTarget.zoom - st.zoom) < 0.002) {
          st.yaw = camTarget.yaw;
          st.pitch = camTarget.pitch;
          st.zoom = camTarget.zoom;
          camTarget = null;
        }
        changed = true;
      }
      if (changed) draw();
      if (changed) ensureLoop();
    }

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", function () { hover = null; draw(); });
    canvas.addEventListener("wheel", onWheel, { passive: false });
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { resize(); });
      ro.observe(stage);
    }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    dimMix = st.dim;
    dimTarget = st.dim;
    buildMiniTable();
    buildHighdimTable();
    if (miniTable) {
      miniTable.addEventListener("click", function (e) {
        var tr = e.target.closest("tr[data-word]");
        if (tr) selectWord(tr.getAttribute("data-word"));
      });
      miniTable.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        var tr = e.target.closest("tr[data-word]");
        if (!tr) return;
        e.preventDefault();
        selectWord(tr.getAttribute("data-word"));
      });
    }
    renderControls();
    resize();
    reserveHeights();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleReserve);
    return {
      update: function (s) {
        applyState(s || {});
      },
      next: nextExample,
      prev: prevExample,
      hasNext: function () {
        if (st.mode === "temperature") {
          var pi = currentPairIndex();
          if (pi < 0) pi = -1;
          return pi < PAIRS.length - 1;
        }
        if (st.mode !== "space" || st.dim < 1) return false;
        var list = examplesForDim();
        var idx = currentExampleIndex();
        if (idx < 0) idx = -1;
        return idx < list.length - 1;
      },
      hasPrev: function () {
        if (st.mode === "temperature") return currentPairIndex() > 0;
        if (st.mode !== "space" || st.dim < 1) return false;
        return currentExampleIndex() > 0;
      },
      pause: function () { if (raf) { cancelAnimationFrame(raf); raf = 0; } },
      resume: function () { ensureLoop(); },
      resize: resize,
      destroy: function () {
        if (raf) cancelAnimationFrame(raf);
        clearTimeout(reserveTimer);
        if (reserveIdle && window.cancelIdleCallback) { try { window.cancelIdleCallback(reserveIdle); } catch (e) {} }
        if (ro) ro.disconnect();
        window.removeEventListener("resize", resize);
        scene.parentNode.removeChild(scene);
      }
    };
  }

  core.register("embedding", embeddingScene);
})();
