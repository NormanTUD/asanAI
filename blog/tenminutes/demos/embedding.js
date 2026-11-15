(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function embeddingScene(root, api) {
    var DE = api.lang === "de";
    var C = api.colors();
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
    var dimMix = 0, dimTarget = 0;
    var st = {
      mode: "space", dim: 1, selected: "king", arithmetic: "King - Man + Woman",
      pair: ["cold", "warm"], group: null, yaw: -0.55, pitch: 0.78, zoom: 1, tables: false
    };

    function color(name) { return C[name] || C.ink; }
    function groupColor(g) {
      if (g === "gender") return color("green");
      if (g === "power") return color("gold");
      if (g === "rank") return color("lilac");
      return color("muted");
    }
    function text(loc) { return DE ? loc[0] : loc[1]; }
    var smoothstep = api.util.smoothstep;
    function wordLabel(id) { return text(WORDS[id].label); }
    function buildMiniTable() {
      if (!miniTable) return;
      var ids = ["man", "woman", "prince", "princess", "king", "queen", "power"];
      var head = '<tr><th></th><th>' + (DE ? "Macht" : "Power") + '</th><th>' + (DE ? "Geschlecht" : "Gender") + '</th><th>' + (DE ? "Rang" : "Rank") + '</th></tr>';
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
        '<p class="ls-highdim-foot">' + (DE ? "Auch wenn wir uns 4096 Dimensionen nicht mehr vorstellen können: Es gelten dieselben Regeln. Mittelpunkt, Winkel und Matrixmultiplikation funktionieren koordinatenweise weiter. Nur die Zahl der Koordinaten wächst, und hier passen viel mehr unabhängige Beziehungen hinein als in zwei oder drei Dimensionen." : "Even though we cannot picture 4096 dimensions, the same rules apply. Midpoint, angle, and matrix multiplication still work coordinate by coordinate. Only the number of coordinates grows, and there is room for many more independent relations than in two or three dimensions.") + '</p>';
    }
    function tempById(id) {
      for (var i = 0; i < TEMP.length; i++) if (TEMP[i].id === id) return TEMP[i];
      return TEMP[0];
    }
    function nearestTemp(value) {
      var best = TEMP[0];
      for (var i = 1; i < TEMP.length; i++) {
        if (Math.abs(TEMP[i].value - value) < Math.abs(best.value - value)) best = TEMP[i];
      }
      return best;
    }
    function nearestWord(v) {
      var best = null, bd = Infinity;
      WORD_IDS.forEach(function (id) {
        var w = WORDS[id];
        var d = Math.hypot(v[0] - w.v[0], v[1] - w.v[1]);
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
          var ev = evalExpr(example.expr);
          if (ev && ev.kind === "vec") {
            result = { v: ev.v, near: nearestWord(ev.v).id };
            steps = exprSteps(example.expr).steps;
          }
        } else if (st.arithmetic === "gender" || st.arithmetic === "power-dir" || st.arithmetic === "directions") {
          dirMode = st.arithmetic;
        }
      }
      return { result: result, steps: steps, dirMode: dirMode, example: example };
    }
    function evalExpr(expr) {
      var toks = expr.match(/[A-Za-z]+|\d+|[+\-*()/]/g) || [];
      var i = 0;
      function factor() {
        var t = toks[i++];
        if (t === "(") { var v = expression(); if (toks[i] === ")") i++; return v; }
        if (/^\d+$/.test(t)) return { kind: "num", n: parseInt(t, 10) };
        var found = null;
        WORD_IDS.forEach(function (id) {
          if (WORDS[id].label[0].toLowerCase() === t.toLowerCase() || WORDS[id].label[1].toLowerCase() === t.toLowerCase() || id.toLowerCase() === t.toLowerCase()) found = id;
        });
        if (!found) return { kind: "num", n: 0 };
        return { kind: "vec", v: WORDS[found].v.slice() };
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
          else if (left.kind === "vec" && right.kind === "vec") left.v = [left.v[0] + right.v[0], left.v[1] + right.v[1]];
          else if (left.kind === "vec" && right.kind === "num") left.v = left.v.map(function (x) { return x + right.n; });
          else if (left.kind === "num" && right.kind === "vec") left = { kind: "vec", v: right.v.map(function (x) { return x + left.n; }) };
        }
        return left;
      }
      return expression();
    }
    function exprSteps(expr) {
      var toks = expr.match(/[A-Za-z]+|\d+|[+\-*()/]/g) || [];
      var pos = null, sign = 1, mult = 1, steps = [];
      toks.forEach(function (t) {
        if (t === "+") { sign = 1; return; }
        if (t === "-") { sign = -1; return; }
        if (t === "*") return;
        if (/^\d+$/.test(t)) { mult = parseInt(t, 10); return; }
        var found = null;
        WORD_IDS.forEach(function (id) {
          if (WORDS[id].label[0].toLowerCase() === t.toLowerCase() || WORDS[id].label[1].toLowerCase() === t.toLowerCase() || id.toLowerCase() === t.toLowerCase()) found = id;
        });
        if (!found) return;
        var v = WORDS[found].v;
        var next = pos
          ? [pos[0] + sign * mult * v[0], pos[1] + sign * mult * v[1]]
          : [sign * mult * v[0], sign * mult * v[1]];
        if (pos) steps.push({ from: pos.slice(), to: next.slice(), label: (sign > 0 ? "+ " : "− ") + wordLabel(found) });
        pos = next;
        sign = 1;
        mult = 1;
      });
      return { pos: pos, steps: steps };
    }
    function normPoint(v) {
      return { x: (v[0] - 12.5) / 15, y: v[1] / 22, z: 0 };
    }
    function project(x, y, z) {
      var yMix = smoothstep(0, 1, dimMix);
      var zMix = smoothstep(1, 2, dimMix);
      var planeTilt = 0.18 * yMix;
      var yaw = st.yaw * (planeTilt + (1 - planeTilt) * zMix);
      var pitch = st.pitch * (planeTilt + (1 - planeTilt) * zMix);
      var cy = Math.cos(yaw), sy = Math.sin(yaw);
      var cp = Math.cos(pitch), sp = Math.sin(pitch);
      var x1 = x * cy - y * sy * yMix;
      var y1 = x * sy + y * cy * yMix;
      var z1 = z * zMix;
      var y2 = y1 * cp - z1 * sp;
      var z2 = y1 * sp + z1 * cp;
      var s = Math.min(size.w, size.h) * 0.34 * st.zoom / (1 + z2 * 0.3);
      return { x: size.w * 0.5 + x1 * s, y: size.h * 0.52 - y2 * s, z: z2, s: s };
    }
    function tempX(value) {
      var pad = Math.min(52, size.w * 0.08);
      return pad + (value + 40) / 150 * (size.w - pad * 2);
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
      var ax = tempX(a.value), bx = tempX(b.value);
      var my = size.h * 0.58;
      ctx.strokeStyle = C.petrol;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax, my);
      ctx.lineTo(bx, my);
      ctx.stroke();
      var avg = (a.value + b.value) / 2;
      var mx = tempX(avg);
      var near = nearestTemp(avg);
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
        drawLabel(String(t.value), x, above ? my - 32 : my + 40, C.muted, "center", 9);
        hits.push({ id: t.id, x: x, y: my, r: 16, kind: "temp" });
      });
      drawLabel(DE ? "TEMPERATUR" : "TEMPERATURE", 24, 26, C.muted, "left", 9);
      drawLabel(DE ? "Klicke zwei Punkte" : "Click two points", size.w - 24, 26, C.muted, "right", 9);
      var sym = Math.abs(avg - near.value) < 0.5 ? "=" : "≈";
      drawLabel(a.value + " + " + b.value + " = " + (a.value + b.value) + "  ·  " + avg.toFixed(1) + " " + sym + " " + text(near.label) + "  ·  " + (DE ? "Fehler " : "error ") + Math.abs(avg - near.value).toFixed(1), size.w / 2, size.h - 22, C.soft, "center", 11);
      canvas.setAttribute("aria-label", DE
        ? "Temperaturlinie. " + text(a.label) + " und " + text(b.label) + ", Mittelpunkt " + avg.toFixed(1) + ", nahe " + text(near.label) + "."
        : "Temperature line. " + text(a.label) + " and " + text(b.label) + ", midpoint " + avg.toFixed(1) + ", near " + text(near.label) + ".");
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
      var x0 = -1.15, x1 = 1.15, y0 = -1.15, y1 = 1.15, z0 = -0.95, z1 = 1.0;
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
      var planeAlpha = smoothstep(0.02, 0.72, yMix) * (1 - zMix);
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
        var zEnd = project(0, 0, 1.0);
        drawArrow(origin.x, origin.y, zEnd.x, zEnd.y, "rgba(0,75,111,.24)", 1.2);
        ctx.globalAlpha = zMix;
        drawLabel(DE ? "RANG" : "RANK", zEnd.x + 6, zEnd.y, C.muted, "left", 9);
        ctx.globalAlpha = 1;
      }

      var cr = currentResult();
      var result = cr.result, steps = cr.steps, dirMode = cr.dirMode;
      var groupAlpha = 1 - smoothstep(0, 0.5, dimMix);
      var individualAlpha = smoothstep(0, 0.5, dimMix);

      var drawList = WORD_IDS.map(function (id) {
        var w = WORDS[id];
        var p = project((w.v[0] - 12.5) / 15, w.v[1] / 22, w.z);
        return { id: id, p: p };
      });
      drawList.sort(function (a, b) { return a.p.z - b.p.z; });

      if (individualAlpha > 0.05 && dimMix > 0.5) {
        ctx.save();
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 1;
        ctx.globalAlpha = individualAlpha * 0.18;
        drawList.forEach(function (item) {
          if (item.id === st.selected) return;
          ctx.beginPath();
          ctx.moveTo(origin.x, origin.y);
          ctx.lineTo(item.p.x, item.p.y);
          ctx.stroke();
        });
        if (st.selected && WORDS[st.selected]) {
          var selectedWord = WORDS[st.selected];
          var selectedPoint = project((selectedWord.v[0] - 12.5) / 15, selectedWord.v[1] / 22, selectedWord.z);
          ctx.strokeStyle = C.green;
          ctx.globalAlpha = individualAlpha * 0.7;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(origin.x, origin.y);
          ctx.lineTo(selectedPoint.x, selectedPoint.y);
          ctx.stroke();
        }
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
      var pathAlpha = smoothstep(0.55, 1, dimMix);
      if (pathAlpha > 0.01 && !dirMode) {
        function freePath(fromId, toId) {
          var wa = WORDS[fromId], wb = WORDS[toId];
          var a = project((wa.v[0] - 12.5) / 15, wa.v[1] / 22, wa.z);
          var b = project((wb.v[0] - 12.5) / 15, wb.v[1] / 22, wb.z);
          var mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - 34;
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = C.green;
          ctx.globalAlpha = 0.55;
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx, my, b.x, b.y); ctx.stroke();
          ctx.restore();
        }
        ctx.globalAlpha = pathAlpha;
        freePath("man", "woman");
        freePath("king", "queen");
        ctx.fillStyle = C.green;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(DE ? "2D: freie Wege" : "2D: free paths", size.w / 2, size.h - 16);
        ctx.globalAlpha = 1;
      }

      var roomAlpha = smoothstep(1.5, 2, dimMix);
      if (roomAlpha > 0.01) {
        ctx.globalAlpha = roomAlpha;
        ctx.fillStyle = C.green;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(DE ? "Jedes Wort ist eine Richtung vom Ursprung" : "Every word is a direction from the origin", size.w / 2, size.h - 16);
        ctx.globalAlpha = 1;
      }

      if (dirMode) {
        function arrowWord(from, to, col, dash) {
          var a = project((WORDS[from].v[0] - 12.5) / 15, WORDS[from].v[1] / 22, WORDS[from].z);
          var b = project((WORDS[to].v[0] - 12.5) / 15, WORDS[to].v[1] / 22, WORDS[to].z);
          drawArrow(a.x, a.y, b.x, b.y, col, 1.8, dash || null);
        }
        if (individualAlpha > 0.5 && (dirMode === "gender" || dirMode === "directions")) {
          arrowWord("man", "woman", C.green, [4, 3]);
          arrowWord("king", "queen", C.green, [4, 3]);
        }
        if (dirMode === "power-dir" || dirMode === "directions") {
          arrowWord("man", "prince", C.gold, [4, 3]);
          arrowWord("prince", "king", C.gold, [4, 3]);
          arrowWord("woman", "princess", C.gold, [4, 3]);
          arrowWord("princess", "queen", C.gold, [4, 3]);
        }
      }

      if (steps.length) {
        steps.forEach(function (step) {
          var a = normPoint(step.from), b = normPoint(step.to);
          var pa = project(a.x, a.y, WORDS.power.z);
          var pb = project(b.x, b.y, WORDS.power.z);
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = C.blue;
          ctx.globalAlpha = 0.55;
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
        ctx.globalAlpha = individualAlpha;
        drawList.forEach(function (item) {
          var id = item.id, p = item.p;
          var selected = id === st.selected;
          var hovered = id === hover;
          var hit = drawPoint(p.x, p.y, id, selected, hovered);
          if (individualAlpha > 0.5) hits.push({ id: id, x: hit.x, y: hit.y, r: hit.r + 10, kind: "word" });
          var labelY = p.y - 12;
          if (id === "power") labelY = p.y + 20;
          drawLabel(wordLabel(id), p.x, labelY, selected ? groupColor(WORDS[id].group) : C.soft, "center", 11);
          if (hovered) {
            drawLabel("(" + WORDS[id].v[0] + ", " + WORDS[id].v[1] + ")", p.x, p.y + 18, C.muted, "center", 9);
          }
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
        ? "Interaktiver Embedding-Raum in " + modeLabel + ". Wörter sind anklickbar; im 3D-Modus kannst du ziehen."
        : "Interactive embedding space in " + modeLabel + ". Words are clickable; in 3D you can drag.");
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
      syncMiniSelection();
    }

    function updateReadout() {
      if (st.mode === "temperature") {
        var a = tempById(st.pair[0]), b = tempById(st.pair[1]);
        var avg = (a.value + b.value) / 2;
        var near = nearestTemp(avg);
        var sym = Math.abs(avg - near.value) < 0.5 ? "=" : "≈";
        readout.innerHTML = '<b>' + esc(a.value) + '</b> + <b>' + esc(b.value) + '</b> = <b>' + esc(a.value + b.value) + '</b> · ' +
          esc(avg.toFixed(1)) + ' ' + esc(sym) + ' <b>' + esc(text(near.label)) + '</b> · ' + esc(DE ? 'Fehler' : 'error') + ' ' + esc(Math.abs(avg - near.value).toFixed(1));
        setTex("\\underbrace{" + a.value + "}_{\\text{" + text(a.label) + "}} + \\underbrace{" + b.value + "}_{\\text{" + text(b.label) + "}} = \\underbrace{" + (a.value + b.value) + "}_{\\text{" + (DE ? "Summe" : "sum") + "}} \\qquad \\underbrace{" + avg.toFixed(1) + "}_{\\text{" + (DE ? "Mittelwert" : "midpoint") + "}} " + sym + " \\underbrace{" + near.value + "}_{\\text{" + text(near.label) + "}}\\;\\text{(" + (DE ? "Abweichung" : "error") + " " + Math.abs(avg - near.value).toFixed(1) + ")}");
        return;
      }
      var cr = currentResult();
      var result = cr.result, dirMode = cr.dirMode, example = cr.example;
      if (dirMode) {
        var desc = dirMode === "gender"
          ? (DE ? "Eine gelernte Richtung verbindet Mann und Frau sowie König und Königin." : "One learned direction connects man and woman, and king and queen.")
          : dirMode === "power-dir"
            ? (DE ? "Eine andere gelernte Richtung führt von Mann zu Prinz zu König." : "Another learned direction moves from man to prince to king.")
            : (DE ? "Zwei gelernte Richtungen: Geschlecht und Macht." : "Two learned directions: gender and power.");
        readout.innerHTML = esc(desc);
        var tex = dirMode === "gender"
          ? "\\underbrace{\\vec{x}_{\\text{" + wordLabel("woman") + "}} - \\vec{x}_{\\text{" + wordLabel("man") + "}}}_{\\text{" + (DE ? "Geschlechtsschritt" : "gender step") + "}} = \\underbrace{\\vec{x}_{\\text{" + wordLabel("queen") + "}} - \\vec{x}_{\\text{" + wordLabel("king") + "}}}_{\\text{" + (DE ? "derselbe Schritt" : "the same step") + "}}"
          : dirMode === "power-dir"
            ? "\\underbrace{\\vec{x}_{\\text{" + wordLabel("prince") + "}} - \\vec{x}_{\\text{" + wordLabel("man") + "}}}_{\\text{" + (DE ? "Machtschritt" : "power step") + "}} = \\underbrace{\\vec{x}_{\\text{" + wordLabel("king") + "}} - \\vec{x}_{\\text{" + wordLabel("prince") + "}}}_{\\text{" + (DE ? "noch ein Schritt" : "another step") + "}}"
            : "\\begin{aligned}\\underbrace{\\vec{x}_{\\text{" + wordLabel("woman") + "}} - \\vec{x}_{\\text{" + wordLabel("man") + "}}}_{\\text{" + (DE ? "Geschlecht" : "gender") + "}} &= \\underbrace{\\vec{x}_{\\text{" + wordLabel("queen") + "}} - \\vec{x}_{\\text{" + wordLabel("king") + "}}}_{\\text{" + (DE ? "dieselbe Richtung" : "same direction") + "}} \\\\ \\underbrace{\\vec{x}_{\\text{" + wordLabel("prince") + "}} - \\vec{x}_{\\text{" + wordLabel("man") + "}}}_{\\text{" + (DE ? "Macht" : "power") + "}} &= \\underbrace{\\vec{x}_{\\text{" + wordLabel("king") + "}} - \\vec{x}_{\\text{" + wordLabel("prince") + "}}}_{\\text{" + (DE ? "dieselbe Richtung" : "same direction") + "}}\\end{aligned}";
        setTex(tex);
        return;
      }
      if (result) {
        readout.innerHTML = '<b>' + esc(example ? text(example.label) : "") + '</b> · (' + esc(result.v[0].toFixed(1)) + ', ' + esc(result.v[1].toFixed(1)) + ') · ' +
          (DE ? "nächstes Wort" : "nearest word") + ': <b>' + esc(wordLabel(result.near)) + '</b>';
        setTex("\\underbrace{\\text{" + (example ? text(example.label) : "") + "}}_{\\text{" + (DE ? "Vektoren addieren" : "add the vectors") + "}} = \\begin{pmatrix}" + result.v[0].toFixed(1) + "\\\\" + result.v[1].toFixed(1) + "\\end{pmatrix} \\approx \\underbrace{\\text{" + wordLabel(result.near) + "}}_{\\text{" + (DE ? "Ergebnis" : "result") + "}}");
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
        readout.innerHTML = '<b>' + esc(wordLabel(st.selected)) + '</b> · (' + esc(w.v[0]) + ', ' + esc(w.v[1]) + ')';
        setTex("\\underbrace{\\vec{x}_{\\text{" + wordLabel(st.selected) + "}}}_{\\text{" + (DE ? "gelerntes Wort" : "learned word") + "}} = \\begin{pmatrix}" + w.v[0] + "\\\\" + w.v[1] + "\\end{pmatrix}");
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
            st.dim = i; dimTarget = i; st.group = null;
            if (i !== 2) st.showHighdim = false;
            syncControls(); ensureLoop();
          }));
        });
        var reset = document.createElement("button");
        reset.type = "button";
        reset.className = "ls-btn ls-btn--ghost ls-btn--tiny";
        reset.textContent = DE ? "Ansicht" : "View";
        reset.addEventListener("click", function () { st.yaw = -0.55; st.pitch = 0.78; st.zoom = 1; draw(); });
        row1.appendChild(reset);
        if (st.dim === 2) {
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
          var label = text(tempById(pair[0]).label) + " + " + text(tempById(pair[1]).label);
          row2.appendChild(makeChip(label, st.pair[0] === pair[0] && st.pair[1] === pair[1], function () {
            st.pair = pair.slice(); syncControls(); draw();
          }));
        });
      } else {
        EXAMPLES.forEach(function (ex) {
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
        WORD_IDS.forEach(function (id) {
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

    function applyState(s) {
      if (!s) return;
      if (s.mode) st.mode = s.mode;
      if (typeof s.dim === "number") { st.dim = s.dim; dimTarget = s.dim; }
      if (s.selected) st.selected = s.selected;
      if (s.arithmetic !== undefined) st.arithmetic = s.arithmetic;
      if (s.pair) st.pair = s.pair.slice();
      st.group = s.group ? s.group.slice() : null;
      st.tables = !!s.tables;
      st.showHighdim = !!s.showHighdim;
      if (st.dim !== 2) st.showHighdim = false;
      syncControls();
      draw();
      ensureLoop();
    }

    function currentExampleIndex() {
      for (var i = 0; i < EXAMPLES.length; i++) {
        if (EXAMPLES[i].id === st.arithmetic) return i;
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
      if (st.mode !== "space" || st.dim !== 2) return false;
      var idx = currentExampleIndex();
      if (idx < 0) idx = -1;
      if (idx >= EXAMPLES.length - 1) return false;
      st.arithmetic = EXAMPLES[idx + 1].id;
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
      if (st.mode !== "space" || st.dim !== 2) return false;
      var idx = currentExampleIndex();
      if (idx <= 0) return false;
      st.arithmetic = EXAMPLES[idx - 1].id;
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
        st.pair = state.pair || ["cold", "warm"];
        st.group = state.group || null;
        renderControls();
        updateReadout();
        maxControls = Math.max(maxControls, controls.scrollHeight);
        maxFormula = Math.max(maxFormula, formula.scrollHeight);
      }
      measure({ mode: "temperature", dim: 0, selected: null, arithmetic: null, pair: ["cold", "warm"] });
      measure({ mode: "temperature", dim: 0, selected: null, arithmetic: null, pair: ["freezing", "hot"] });
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
      var cH = Math.ceil(maxControls);
      var fH = Math.min(Math.ceil(maxFormula), maxAllowed);
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
      if (Math.abs(dimMix - dimTarget) > 0.002) {
        dimMix += (dimTarget - dimMix) * 0.13;
        if (Math.abs(dimMix - dimTarget) < 0.002) dimMix = dimTarget;
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
    scheduleReserve();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleReserve);
    return {
      update: function (s) { applyState(s || {}); },
      next: nextExample,
      prev: prevExample,
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
