(function () {
  "use strict";
  if (!window.LearnSys) return;

  var SHARED = {
    loop: null
  };

  var TEMP = [
    { id: "freezing", value: -30, color: "sky", label: ["Gefrierpunkt", "Freezing"] },
    { id: "icecold", value: -10, color: "lilac", label: ["Eiskalt", "Ice cold"] },
    { id: "cold", value: 5, color: "blue", label: ["Kalt", "Cold"] },
    { id: "cool", value: 18, color: "petrol", label: ["Kühl", "Cool"] },
    { id: "lukewarm", value: 30, color: "green", label: ["Lauwarm", "Lukewarm"] },
    { id: "warm", value: 55, color: "lime", label: ["Warm", "Warm"] },
    { id: "hot", value: 100, color: "gold", label: ["Heiß", "Hot"] }
  ];

  var WORDS = {
    male: { v: [0, -20], z: -0.6, label: ["Männlich", "Male"], group: "gender" },
    female: { v: [0, 20], z: -0.6, label: ["Weiblich", "Female"], group: "gender" },
    man: { v: [5, -10], z: 0, label: ["Mann", "Man"], group: "power" },
    woman: { v: [5, 10], z: 0, label: ["Frau", "Woman"], group: "power" },
    prince: { v: [15, -10], z: 0.45, label: ["Prinz", "Prince"], group: "rank" },
    princess: { v: [15, 10], z: 0.45, label: ["Prinzessin", "Princess"], group: "rank" },
    king: { v: [25, -10], z: 0.85, label: ["König", "King"], group: "rank" },
    queen: { v: [25, 10], z: 0.85, label: ["Königin", "Queen"], group: "rank" },
    power: { v: [10, 0], z: 0.25, label: ["Macht", "Power"], group: "power" }
  };
  var WORD_IDS = Object.keys(WORDS);

  var EXAMPLES = [
    { id: "king-man-woman", expr: "King - Man + Woman", label: ["König − Mann + Frau", "King − Man + Woman"] },
    { id: "man-power", expr: "Man + 2 * Power", label: ["Mann + 2 · Macht", "Man + 2 · Power"] },
    { id: "prince-power", expr: "Prince + Power", label: ["Prinz + Macht", "Prince + Power"] },
    { id: "gender", label: ["Geschlecht", "Gender"] },
    { id: "power-dir", label: ["Machtrichtung", "Power direction"] },
    { id: "directions", label: ["Alle Richtungen", "All directions"] }
  ];

  var PAIRS = [
    ["cold", "warm"], ["cold", "hot"], ["freezing", "hot"], ["freezing", "warm"]
  ];

  function esc(s) { return String(s == null ? "" : s); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

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

  function phoneScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-phone-scene";
    el.innerHTML =
      '<div class="ia-stage">' +
        '<div class="ia-phone-switch" role="tablist" aria-label="' + (DE ? "Suche oder Chat" : "Search or chat") + '">' +
          '<button type="button" class="is-on" data-phone="search" role="tab" aria-selected="true">' + (DE ? "Suche" : "Search") + '</button>' +
          '<button type="button" data-phone="chat" role="tab" aria-selected="false">' + (DE ? "Chat" : "Chat") + '</button>' +
        '</div>' +
        '<div class="ia-phones">' +
          '<div class="ia-phone is-active" id="ia-phone">' +
            '<div class="ia-phone-frame"></div>' +
            '<div class="ia-phone-notch"></div>' +
            '<div class="ia-phone-screen">' +
              '<div class="ia-app-logo" id="ia-logo" aria-hidden="true"></div>' +
              '<div class="ia-search-bar" id="ia-search-bar">' +
                '<div class="ia-search-icon" aria-hidden="true"></div>' +
                '<div class="ia-search-text" id="ia-search-text"></div>' +
                '<div class="ia-mic-btn" id="ia-mic-btn" aria-hidden="true"><div class="ia-mic-icon"></div></div>' +
              '</div>' +
              '<div class="ia-ai-card" id="ia-ai-card">' +
                '<div class="ia-ai-text" id="ia-ai-text"></div>' +
                '<div class="ia-ai-thinking" id="ia-ai-thinking" aria-hidden="true"><span></span><span></span><span></span></div>' +
              '</div>' +
              '<div class="ia-serp" id="ia-serp"></div>' +
            '</div>' +
            '<div class="ia-waveform" id="ia-waveform" aria-hidden="true">' +
              '<div class="ia-bar"></div><div class="ia-bar"></div><div class="ia-bar"></div>' +
              '<div class="ia-bar"></div><div class="ia-bar"></div><div class="ia-bar"></div>' +
              '<div class="ia-bar"></div><div class="ia-bar"></div><div class="ia-bar"></div>' +
              '<div class="ia-bar"></div><div class="ia-bar"></div>' +
            '</div>' +
          '</div>' +
          '<div class="ia-phone ia-phone--chat" id="ia-chat-phone">' +
            '<div class="ia-phone-frame"></div>' +
            '<div class="ia-phone-notch"></div>' +
            '<div class="ia-phone-screen ia-chat-screen">' +
              '<div class="ia-chat-appbar"><span>' + (DE ? "KI-Chat" : "AI chat") + '</span><i class="ia-chat-live" aria-hidden="true"></i></div>' +
              '<div class="ia-chat-thread" aria-live="polite">' +
                '<div class="ia-chat-msg is-user"><span class="ia-chat-role">' + (DE ? "Du" : "You") + '</span><span class="ia-chat-bubble ia-chat-question"></span></div>' +
                '<div class="ia-chat-msg is-ai"><span class="ia-chat-role">LLM</span><span class="ia-chat-bubble ia-chat-answer"></span><span class="ia-chat-thinking" aria-hidden="true"><i></i><i></i><i></i></span></div>' +
              '</div>' +
              '<div class="ia-chat-compose"><span class="ia-chat-placeholder">' + (DE ? "Nachricht" : "Message") + '</span><span class="ia-chat-input"></span><i class="ia-chat-send" aria-hidden="true"></i></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    root.appendChild(el);
    var stage = el.querySelector(".ia-stage");
    var phonesWrap = el.querySelector(".ia-phones");
    var chatPhone = el.querySelector("#ia-chat-phone");
    var chatScreen = el.querySelector(".ia-chat-screen");
    var searchPhone = el.querySelector("#ia-phone");
    var chatQuestionEl = el.querySelector(".ia-chat-question");
    var chatAnswerEl = el.querySelector(".ia-chat-answer");
    var chatInputEl = el.querySelector(".ia-chat-input");
    var chatComposeEl = el.querySelector(".ia-chat-compose");
    var view = "search", chatStarted = false, sequenceDone = null;
    var modeBtns = el.querySelectorAll("[data-phone]");
    function setPhone(which) {
      var isChat = which === "chat";
      if (searchPhone) searchPhone.classList.toggle("is-active", !isChat);
      if (chatPhone) chatPhone.classList.toggle("is-active", isChat);
      modeBtns.forEach(function (b) {
        var on = b.getAttribute("data-phone") === (isChat ? "chat" : "search");
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
    var logo = el.querySelector("#ia-logo");
    var searchBar = el.querySelector("#ia-search-bar");
    var searchText = el.querySelector("#ia-search-text");
    var mic = el.querySelector("#ia-mic-btn");
    var wave = el.querySelector("#ia-waveform");
    var card = el.querySelector("#ia-ai-card");
    var aiText = el.querySelector("#ia-ai-text");
    var thinking = el.querySelector("#ia-ai-thinking");
    var serp = el.querySelector("#ia-serp");
    var SATZ = DE ? "warum ist der himmel blau?" : "why is the sky blue?";
    var CHAT_Q = DE ? "Was passiert, wenn ich bei Google eine Zusammenfassung bekomme?" : "What happens when I get a summary in Google Search?";
    var CHAT_A = DE ? "Hinter der Zusammenfassung steckt ein Sprachmodell, ein sehr ähnliches wie das in diesem Chat. Es liest die Frage und schreibt die Antwort Token für Token; die Suche zeigt zusätzlich Links. Ich bin auch ein LLM, nur im Dialog: Ich bekomme deinen Text als Kontext und sage das nächste Token voraus. Dieses Wort wird an den bisherigen Text gehängt, und der ganze Text geht wieder als Kontext ins Modell. So entsteht die Antwort Schritt für Schritt." : "A language model sits behind the summary, very similar to the one in this chat. It reads the question and writes the answer token by token; Search adds links. I am also an LLM, just in a dialogue: I receive your text as context and predict the next token. That word is appended to the text so far, and the whole text goes back into the model as context. That is how the answer grows step by step.";
    var AI = DE ? [
      { t: "Der Himmel ist blau, weil Luftmoleküle kurzwelliges Licht stärker streuen als langwelliges. Blau (450 nm) wird etwa 4× mehr gestreut als Rot (650 nm): " },
      { t: "Rayleigh-Streuung", c: "b" },
      { t: "." }
    ] : [
      { t: "The sky is blue because air molecules scatter short-wavelength light more strongly than long-wavelength light. Blue (450 nm) is scattered about 4× more than red (650 nm): " },
      { t: "Rayleigh scattering", c: "b" },
      { t: "." }
    ];
    var RESULTS = DE ? [
      { name: "Wikipedia", url: "de.wikipedia.org › Rayleigh-Jeans-Gesetz", title: "Rayleigh-Jeans-Gesetz", snippet: "Das Plancksche Strahlungsgesetz ist eine Interpolationsformel der beiden anderen Gesetze.", icon: "assets/favicon_wikipedia.ico" },
      { name: "Wikipedia", url: "de.wikipedia.org › Rayleigh-Streuung", title: "Rayleigh-Streuung", snippet: "Die Streuung von Licht an Teilchen, die kleiner sind als seine Wellenlänge.", icon: "assets/favicon_wikipedia.ico" },
      { name: "Leifi Physik", url: "www.leifiphysik.de › optik › streuung", title: "Warum ist der Himmel blau?", snippet: "Kurzwelliges blaues Licht wird stärker gestreut als langwelliges rotes Licht.", icon: "assets/favicon_leifiphysik.ico" }
    ] : [
      { name: "Wikipedia", url: "en.wikipedia.org › Rayleigh–Jeans law", title: "Rayleigh–Jeans law", snippet: "The Planck law interpolates between the Rayleigh–Jeans law and Wien's law.", icon: "assets/favicon_wikipedia.ico" },
      { name: "Wikipedia", url: "en.wikipedia.org › Rayleigh scattering", title: "Rayleigh scattering", snippet: "Scattering of light by particles smaller than its wavelength.", icon: "assets/favicon_wikipedia.ico" },
      { name: "Wikipedia", url: "en.wikipedia.org › Diffuse sky radiation", title: "Diffuse sky radiation", snippet: "Short-wavelength blue light is scattered more strongly than long-wavelength red light.", icon: "assets/favicon_wikipedia.ico" }
    ];
    var timers = [];
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
    function clearTimers() { timers.forEach(function (id) { clearTimeout(id); clearInterval(id); }); timers = []; }
    function buildLogo() {
      var letters = (DE ? "Suchmaschine" : "Search Engine").split("");
      var palette = ["#63a44b", "#1275ac", "#9f9700", "#9185be", "#5c9baf", "#004b6f"];
      logo.removeAttribute("aria-hidden");
      logo.setAttribute("role", "img");
      logo.setAttribute("aria-label", DE ? "Suchmaschine" : "Search Engine");
      logo.innerHTML = letters.map(function (ch, i) {
        return '<span style="color:' + palette[i % palette.length] + '">' + (ch === " " ? "&nbsp;" : ch) + "</span>";
      }).join("");
    }
    function buildSerp() {
      serp.innerHTML = RESULTS.map(function (r, i) {
        return '<div class="ia-result r' + (i + 1) + '">' +
          '<div class="ia-res-head"><img class="ia-res-fav" src="' + r.icon + '" alt=""><div class="ia-res-lines"><span class="ia-res-name">' + r.name + '</span><span class="ia-res-url">' + r.url + '</span></div></div>' +
          '<div class="ia-res-title">' + r.title + '</div><div class="ia-res-snippet">' + r.snippet + '</div></div>';
      }).join("");
    }
    function setCentered(on) { searchBar.classList.toggle("centered", !!on); }
    function reset() {
      clearTimers();
      setCentered(true);
      searchText.textContent = "";
      searchText.classList.remove("typing");
      mic.classList.remove("listening");
      wave.classList.remove("active");
      card.classList.remove("on");
      aiText.innerHTML = "";
      thinking.classList.remove("on");
      serp.classList.remove("on");
      if (chatPhone) chatPhone.classList.remove("is-thinking", "is-answered");
      if (chatScreen) chatScreen.classList.remove("is-answering", "is-composing", "is-sent");
      if (chatQuestionEl) chatQuestionEl.textContent = "";
      if (chatAnswerEl) chatAnswerEl.textContent = "";
      if (chatInputEl) chatInputEl.textContent = "";
      chatStarted = false;
      setPhone(view);
    }
    function typeChat(el, text, speed, done) {
      if (reduce) { el.textContent = text; if (done) done(); return; }
      var i = 0;
      var timer = setInterval(function () {
        if (i < text.length) { i += 1; el.textContent = text.slice(0, i); }
        else { clearInterval(timer); if (done) done(); }
      }, speed);
      timers.push(timer);
    }
    function typeSearch(text, done) {
      if (reduce) { searchText.textContent = text; done(); return; }
      searchText.classList.add("typing");
      searchText.innerHTML = '<span class="ia-caret"></span>';
      var i = 0;
      var timer = setInterval(function () {
        if (i < text.length) {
          i += 1;
          searchText.innerHTML = text.slice(0, i) + '<span class="ia-caret"></span>';
        } else {
          clearInterval(timer);
          searchText.classList.remove("typing");
          searchText.textContent = text;
          later(done, 120);
        }
      }, 13);
      timers.push(timer);
    }
    function typeAnswer() {
      var spans = AI.map(function (seg) {
        var span = document.createElement("span");
        if (seg.c) span.className = "ia-" + seg.c;
        aiText.appendChild(span);
        return span;
      });
      if (reduce) { spans.forEach(function (span, i) { span.textContent = AI[i].t; }); return; }
      var si = 0, ci = 0;
      function tick() {
        var remaining = 8;
        while (remaining > 0 && si < spans.length) {
          var seg = AI[si];
          var take = Math.min(remaining, seg.t.length - ci);
          ci += take;
          remaining -= take;
          spans[si].textContent = seg.t.slice(0, ci);
          if (ci >= seg.t.length) { si += 1; ci = 0; }
        }
        if (si < spans.length) later(tick, 16);
      }
      tick();
    }
    function startChat() {
      if (chatStarted) return;
      chatStarted = true;
      if (chatPhone) chatPhone.classList.remove("is-thinking", "is-answered");
      if (chatScreen) chatScreen.classList.remove("is-answering", "is-sent");
      if (chatQuestionEl) chatQuestionEl.textContent = "";
      if (chatAnswerEl) chatAnswerEl.textContent = "";
      if (chatInputEl) chatInputEl.textContent = "";
      if (chatScreen) chatScreen.classList.add("is-composing");
      if (reduce) {
        if (chatQuestionEl) chatQuestionEl.textContent = CHAT_Q;
        if (chatAnswerEl) chatAnswerEl.textContent = CHAT_A;
        if (chatPhone) chatPhone.classList.add("is-answered");
        if (chatScreen) chatScreen.classList.remove("is-composing");
        if (chatScreen) chatScreen.classList.add("is-sent", "is-answering");
        if (sequenceDone) later(function () { sequenceDone(); }, 900);
        return;
      }
      typeChat(chatInputEl, CHAT_Q, 24, function () {
        if (chatInputEl) chatInputEl.textContent = "";
        if (chatQuestionEl) chatQuestionEl.textContent = CHAT_Q;
        if (chatScreen) { chatScreen.classList.remove("is-composing"); chatScreen.classList.add("is-sent"); }
        later(function () {
          if (chatPhone) chatPhone.classList.add("is-thinking");
          later(function () {
            if (chatPhone) chatPhone.classList.remove("is-thinking");
            if (chatPhone) chatPhone.classList.add("is-answered");
            if (chatScreen) chatScreen.classList.add("is-answering");
            typeChat(chatAnswerEl, CHAT_A, 5, function () { if (sequenceDone) sequenceDone(); });
          }, 360);
        }, 260);
      });
    }
    function play() {
      reset();
      buildLogo();
      buildSerp();
      if (view === "chat") { startChat(); return; }
      if (reduce) {
        searchText.textContent = SATZ;
        setCentered(false);
        card.classList.add("on");
        typeAnswer();
        serp.classList.add("on");
        if (view === "chat") startChat();
        if (view === "sequence") later(function () { setPhone("chat"); startChat(); }, 1200);
        return;
      }
      mic.classList.add("listening");
      wave.classList.add("active");
      typeSearch(SATZ, function () {
        searchText.textContent = SATZ;
        setCentered(false);
        later(function () {
          card.classList.add("on");
          thinking.classList.add("on");
          later(function () {
            thinking.classList.remove("on");
            mic.classList.remove("listening");
            wave.classList.remove("active");
            typeAnswer();
            serp.classList.add("on");
            if (view === "sequence") later(function () { setPhone("chat"); startChat(); }, 1500);
          }, 240);
        }, 320);
      });
    }
    function fit() {
      var r = stage.getBoundingClientRect();
      var scale = Math.min((r.width - 50) / 360, (r.height - 90) / 600);
      if (phonesWrap) phonesWrap.style.transform = "translate(-50%, -50%) scale(" + Math.max(0.24, scale).toFixed(3) + ")";
    }
    buildLogo();
    buildSerp();
    reset();
    var started = false, shownOnce = false;
    function startOnce() { if (started) return; started = true; play(); }
    if (reduce) startOnce();
    else if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        requestAnimationFrame(function () { requestAnimationFrame(function () { later(startOnce, 180); }); });
      }, { threshold: 0.2 });
      io.observe(stage);
    } else startOnce();
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(fit); ro.observe(stage); }
    window.addEventListener("resize", fit);
    [searchPhone, chatPhone].forEach(function (p) {
      if (p) p.addEventListener("click", function () { started = true; play(); });
    });
    modeBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        clearTimers();
        started = true;
        view = b.getAttribute("data-phone");
        reset();
        setPhone(view);
        if (view === "chat") startChat();
        else play();
      });
    });
    fit();
    return {
      update: function (s) {
        if (s && s.view) {
          view = s.view;
          if (view === "sequence") {
            setPhone("search");
            if (started) play();
            return;
          }
          setPhone(view);
          if (view === "chat") startChat();
        }
      },
      start: function () { started = true; shownOnce = true; play(); },
      onSequenceDone: function (fn) { sequenceDone = fn; },
      pause: clearTimers,
      resume: function () { if (shownOnce && started) play(); shownOnce = true; fit(); },
      resize: fit,
      destroy: function () {
        clearTimers();
        if (ro) ro.disconnect();
        window.removeEventListener("resize", fit);
        el.remove();
      }
    };
  }

  function codeScene(root, api) {
    var DE = api.lang === "de";
    var codeText = DE ? [
      "# Rayleigh-Streuung",
      "k_B = 1.380649e-23",
      "def scattering(wl, p, T):",
      "    return p / (k_B * T) / wl**4",
      "blue = scattering(450e-9, 1e5, 293)",
      "red  = scattering(650e-9, 1e5, 293)",
      "ratio = blue / red",
      'print(f"Blau wird {round(ratio, 2)}× stärker gestreut als Rot.")'
    ] : [
      "# Rayleigh scattering",
      "k_B = 1.380649e-23",
      "def scattering(wl, p, T):",
      "    return p / (k_B * T) / wl**4",
      "blue = scattering(450e-9, 1e5, 293)",
      "red  = scattering(650e-9, 1e5, 293)",
      "ratio = blue / red",
      'print(f"Blue is {round(ratio, 2)}x more strongly scattered than red.")'
    ];
    var kB = 1.380649e-23, pressure = 1e5, temp = 293;
    var blue = (pressure / (kB * temp)) / Math.pow(450e-9, 4);
    var red = (pressure / (kB * temp)) / Math.pow(650e-9, 4);
    var ratio = blue / red;
    var outText = DE
      ? "Blau wird " + ratio.toFixed(2) + "× stärker gestreut als Rot."
      : "Blue is " + ratio.toFixed(2) + "x more strongly scattered than red.";
    var agentText = DE ? "Ich denke kurz nach … Fertig. Ich schreibe himmel.py." : "Thinking briefly … done. I'll write sky.py.";
    var userText = DE ? "Schreibe ein Python-Programm, das die Rayleigh-Streuung berechnet." : "Write a Python program that computes Rayleigh scattering.";
    var el = document.createElement("div");
    el.className = "ls-code-monitor";
    el.innerHTML =
      '<div class="ls-code-frame"><div class="ls-code-screen">' +
        '<div class="ls-code-desktop" style="background-image:url(\'opera.jpg\')">' +
          '<div class="ls-code-window ls-code-window--agent">' +
            '<div class="ls-code-bar"><i></i><i></i><i></i><span>Agent</span></div>' +
            '<div class="ls-code-chat">' +
              '<div class="ls-code-msg is-agent"><span class="ls-code-agent-text"></span><span class="ls-code-thinking" aria-hidden="true"><i></i><i></i><i></i></span></div>' +
              '<div class="ls-code-msg is-agent ls-code-run-msg" hidden>' + (DE ? "Ich führe himmel.py im Terminal aus." : "I'll run sky.py in the terminal.") + '</div>' +
            '</div>' +
            '<div class="ls-code-filehead">' + (DE ? "himmel.py" : "sky.py") + '</div>' +
            '<pre class="ls-code-body"><code></code></pre>' +
            '<div class="ls-code-agent-prompt"><b>$</b><span></span></div>' +
          '</div>' +
          '<div class="ls-code-window ls-code-window--run" hidden>' +
            '<div class="ls-code-bar"><i></i><i></i><i></i><span>Terminal</span></div>' +
            '<div class="ls-code-term"><b class="ls-code-command"></b><span></span></div>' +
          '</div>' +
          '<div class="ls-code-startmenu" hidden><button type="button" data-start="agent">Agent</button><button type="button" data-start="run">Terminal</button><div class="ls-code-startjoke">' + (DE ? "Keine Updates verfügbar. Alles läuft lokal." : "No updates available. Everything runs locally.") + '</div></div>' +
          '<div class="ls-code-taskbar"><button type="button" class="ls-code-start" aria-label="Start">▦</button><button type="button" class="ls-code-task is-on" data-task="agent">Agent</button><button type="button" class="ls-code-task" data-task="run">Terminal</button><span class="ls-code-clock">14:32</span></div>' +
        '</div>' +
      '</div></div>' +
      '<button type="button" class="ls-btn ls-btn--tiny ls-code-replay" disabled>' + (DE ? "Weiter" : "Next") + '</button>';
    root.appendChild(el);
    var codeEl = el.querySelector(".ls-code-body code");
    var commandEl = el.querySelector(".ls-code-command");
    var term = el.querySelector(".ls-code-term span");
    var userPromptEl = el.querySelector(".ls-code-agent-prompt span");
    var agentMsgEl = el.querySelector(".ls-code-agent-text");
    var thinkingEl = el.querySelector(".ls-code-thinking");
    var agentWin = el.querySelector(".ls-code-window--agent");
    var runWin = el.querySelector(".ls-code-window--run");
    var runMsgEl = el.querySelector(".ls-code-run-msg");
    var replayBtn = el.querySelector(".ls-code-replay");
    var taskButtons = el.querySelectorAll("[data-task]");
    var startBtn = el.querySelector(".ls-code-start");
    var startMenu = el.querySelector(".ls-code-startmenu");
    var startItems = el.querySelectorAll("[data-start]");
    var clockEl = el.querySelector(".ls-code-clock");
    if (clockEl) {
      try { clockEl.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch (e) {}
    }
    function syntaxClass(text, lineText) {
      var t = text.trim();
      if (!t) return "";
      if (lineText.trim().indexOf("#") === 0) return "is-comment";
      if (/^(def|return|import|from|as|for|in|if|else|elif|while|with|lambda)$/.test(t)) return "is-keyword";
      if (/^(print|round|len|range|sum|min|max)$/.test(t)) return "is-builtin";
      if (/^-?\d/.test(t) || /e[+-]?\d+$/i.test(t)) return "is-number";
      if (/^[A-Za-z_]\w*\(/.test(t)) return "is-function";
      if (/^[=+\-*/%<>!]+$/.test(t) || /^[()\[\]{},.:;]+$/.test(t)) return "is-op";
      return "";
    }
    var tokens = [];
    codeText.forEach(function (line, li) {
      line.split(/(\s+)/).forEach(function (part) {
        if (part) tokens.push({ text: part, line: li, lineText: line });
      });
      tokens.push({ text: "\n", line: li, lineText: line });
    });
    var spans = tokens.map(function (t) {
      var span = document.createElement("span");
      var cls = syntaxClass(t.text, t.lineText);
      span.className = "ls-code-token" + (cls ? " " + cls : "");
      span.textContent = t.text;
      codeEl.appendChild(span);
      return span;
    });
    var timers = [], phase = "idle";
    var codePre = el.querySelector(".ls-code-body");
    function fitCode() {
      if (!codePre) return;
      var sizes = [14, 12, 10, 8, 7, 6];
      for (var i = 0; i < sizes.length; i++) {
        codePre.style.fontSize = sizes[i] + "px";
        codePre.style.lineHeight = "1.35";
        if (codePre.scrollHeight <= codePre.clientHeight + 1 && codePre.scrollWidth <= codePre.clientWidth + 1) break;
      }
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
    function show(win, on) {
      if (!win) return;
      win.hidden = !on;
      if (on) {
        win.classList.remove("is-open");
        void win.offsetWidth;
        win.classList.add("is-open");
      }
    }
    function setButton(label, disabled) {
      replayBtn.textContent = label;
      replayBtn.disabled = !!disabled;
    }
    function typeUser(done) {
      if (!userPromptEl) { if (done) done(); return; }
      var i = 0;
      var stepMs = Math.max(12, 2000 / Math.max(1, userText.length));
      function step() {
        if (i >= userText.length) { if (done) done(); return; }
        i++;
        userPromptEl.textContent = userText.slice(0, i);
        later(step, stepMs);
      }
      step();
    }
    function typeAgent(done) {
      if (!agentMsgEl) { if (done) done(); return; }
      var i = 0;
      function step() {
        if (i >= agentText.length) { if (done) done(); return; }
        i++;
        agentMsgEl.textContent = agentText.slice(0, i);
        later(step, 16);
      }
      step();
    }
    function typeCode() {
      if (agentWin) agentWin.classList.add("is-coding");
      var i = 0;
      function typeNext() {
        if (i >= spans.length) {
          phase = "ready";
          setButton(DE ? "Weiter" : "Next", false);
          later(function () { if (phase === "ready") runProgram(); }, 300);
          return;
        }
        spans[i].classList.add("is-visible");
        var delay = /^\s+$/.test(tokens[i].text) ? 0 : 24;
        i++;
        later(typeNext, delay);
      }
      later(typeNext, 180);
    }
    function reset() {
      clearTimers();
      phase = "typing";
      spans.forEach(function (s) { s.classList.remove("is-visible"); });
      if (userPromptEl) userPromptEl.textContent = "";
      if (agentMsgEl) agentMsgEl.textContent = "";
      if (agentWin) agentWin.classList.remove("is-coding");
      if (thinkingEl) thinkingEl.classList.remove("on");
      if (runMsgEl) runMsgEl.hidden = true;
      if (commandEl) commandEl.textContent = "";
      if (term) term.textContent = "";
      show(agentWin, true);
      show(runWin, false);
      syncTasks();
      setButton(DE ? "Weiter" : "Next", true);
      fitCode();
      later(function () {
        typeUser(function () {
          phase = "thinking";
          if (thinkingEl) thinkingEl.classList.add("on");
          later(function () {
            if (thinkingEl) thinkingEl.classList.remove("on");
            typeAgent(function () {
              typeCode();
            });
          }, 750);
        });
      }, 250);
    }
    function runProgram() {
      phase = "running";
      if (runMsgEl) runMsgEl.hidden = false;
      show(runWin, true);
      syncTasks();
      if (commandEl) commandEl.textContent = "";
      if (term) term.textContent = "";
      var cmd = "$ " + (DE ? "python3 himmel.py" : "python3 sky.py");
      var stepMs = 300 / Math.max(1, cmd.length);
      var j = 0;
      function typeCommand() {
        if (j >= cmd.length) {
          later(function () { if (term) term.textContent = outText; }, 260);
          later(function () {
            phase = "done";
            setButton(DE ? "Nochmal" : "Replay", false);
          }, 620);
          return;
        }
        j++;
        if (commandEl) commandEl.textContent = cmd.slice(0, j);
        later(typeCommand, stepMs * (0.7 + Math.random() * 0.6));
      }
      typeCommand();
    }
    function syncTasks() {
      taskButtons.forEach(function (b) {
        var win = b.getAttribute("data-task") === "agent" ? agentWin : runWin;
        b.classList.toggle("is-on", win && !win.hidden);
      });
    }
    taskButtons.forEach(function (b) {
      b.addEventListener("click", function () {
        var win = b.getAttribute("data-task") === "agent" ? agentWin : runWin;
        show(win, true);
        syncTasks();
      });
    });
    if (startBtn && startMenu) {
      startBtn.addEventListener("click", function () { startMenu.hidden = !startMenu.hidden; startBtn.classList.toggle("is-open", !startMenu.hidden); });
    }
    startItems.forEach(function (b) {
      b.addEventListener("click", function () {
        var win = b.getAttribute("data-start") === "agent" ? agentWin : runWin;
        show(win, true); syncTasks();
        if (startMenu) startMenu.hidden = true;
        if (startBtn) startBtn.classList.remove("is-open");
      });
    });

    replayBtn.addEventListener("click", function () {
      if (phase === "ready") runProgram();
      else if (phase === "done") reset();
    });
    reset();
    return {
      update: function () {},
      start: function () { reset(); },
      pause: function () {
        clearTimers();
        if (phase !== "ready" && phase !== "done") phase = "paused";
      },
      resume: function () { if (phase === "idle" || phase === "paused") reset(); },
      resize: function () { fitCode(); },
      destroy: function () { clearTimers(); el.remove(); }
    };
  }

  function loopScene(root, api) {
    var DE = api.lang === "de";
    var SEQ_LEN = 6;
    var MAX_STEPS = 7;
    var EOS = "<|endoftext|>";
    var NOUNS = DE ? [
      { t: "Drache", l: 3.4 }, { t: "Ritter", l: 1.1 }, { t: "Roboter", l: 0.7 }, { t: "Schloss", l: 0.4 }, { t: "Fluss", l: 0.2 }
    ] : [
      { t: "dragon", l: 3.4 }, { t: "princess", l: 1.1 }, { t: "robot", l: 0.7 }, { t: "castle", l: 0.4 }, { t: "river", l: 0.2 }
    ];
    var ACTIONS = DE ? {
      Drache: [{ t: "fliegen", l: 3.5 }, { t: "brüllen", l: 1.5 }, { t: "schlafen", l: 0.8 }, { t: "schwimmen", l: 0.5 }, { t: "singen", l: 0.3 }],
      Ritter: [{ t: "kämpfen", l: 3.4 }, { t: "reiten", l: 1.5 }, { t: "singen", l: 0.9 }, { t: "schlafen", l: 0.5 }, { t: "tanzen", l: 0.3 }],
      Roboter: [{ t: "fliegen", l: 3.3 }, { t: "piepen", l: 1.5 }, { t: "singen", l: 0.9 }, { t: "schlafen", l: 0.5 }, { t: "schwimmen", l: 0.3 }],
      Schloss: [{ t: "glänzen", l: 3.2 }, { t: "leuchten", l: 1.5 }, { t: "schlafen", l: 0.8 }, { t: "singen", l: 0.4 }],
      Fluss: [{ t: "fließen", l: 3.5 }, { t: "singen", l: 1.2 }, { t: "brüllen", l: 0.8 }, { t: "gefrieren", l: 0.5 }, { t: "glänzen", l: 0.3 }]
    } : {
      dragon: [{ t: "fly", l: 3.5 }, { t: "roar", l: 1.5 }, { t: "sleep", l: 0.8 }, { t: "swim", l: 0.5 }, { t: "sing", l: 0.3 }],
      princess: [{ t: "sing", l: 3.4 }, { t: "dance", l: 1.5 }, { t: "dream", l: 0.9 }, { t: "sleep", l: 0.5 }, { t: "swim", l: 0.3 }],
      robot: [{ t: "fly", l: 3.3 }, { t: "beep", l: 1.5 }, { t: "sing", l: 0.9 }, { t: "sleep", l: 0.5 }, { t: "swim", l: 0.3 }],
      castle: [{ t: "stand", l: 3.2 }, { t: "glow", l: 1.5 }, { t: "sleep", l: 0.8 }, { t: "sing", l: 0.4 }],
      river: [{ t: "flow", l: 3.5 }, { t: "sing", l: 1.2 }, { t: "roar", l: 0.8 }, { t: "freeze", l: 0.5 }, { t: "shine", l: 0.3 }]
    };
    var RELATIVE = DE ? {
      Drache: [{ t: "der", l: 3.6 }], Ritter: [{ t: "der", l: 3.6 }], Roboter: [{ t: "der", l: 3.6 }],
      Schloss: [{ t: "das", l: 3.6 }], Fluss: [{ t: "der", l: 3.6 }]
    } : null;
    var RELATIVE_TAIL = DE ? {
      Drache: [{ t: "welcher", l: 0.4 }], Ritter: [{ t: "welcher", l: 0.4 }], Roboter: [{ t: "welcher", l: 0.4 }],
      Schloss: [{ t: "welches", l: 0.4 }], Fluss: [{ t: "welcher", l: 0.4 }]
    } : null;
    var MODALS = DE ? [
      { t: "konnte", l: 3.0 }, { t: "wollte", l: 1.3 }, { t: "sollte", l: 0.9 }, { t: "durfte", l: 0.6 }, { t: "musste", l: 0.3 }
    ] : [
      { t: "could", l: 3.0 }, { t: "would", l: 1.3 }, { t: "loved", l: 0.9 }, { t: "tried", l: 0.6 }, { t: "wanted", l: 0.3 }
    ];
    var NEGATORS = DE ? [
      { t: "nicht", l: 3.3 }, { t: "nie", l: 1.2 }, { t: "nur", l: 0.8 }, { t: "noch", l: 0.5 }, { t: "immer", l: 0.3 }
    ] : [
      { t: "not", l: 3.3 }, { t: "never", l: 1.2 }, { t: "only", l: 0.8 }, { t: "still", l: 0.5 }, { t: "always", l: 0.3 }
    ];
    var TAIL = DE ? {
      0: [{ t: "Berg", l: 0.05 }, { t: "Garten", l: -0.15 }, { t: "Vogel", l: -0.35 }],
      2: [{ t: "möchte", l: 0.0 }, { t: "würde", l: -0.2 }],
      3: [{ t: "kaum", l: 0.0 }, { t: "auch", l: -0.2 }],
      4: [{ t: "warten", l: 0.0 }, { t: "dastehen", l: -0.2 }, { t: "wirken", l: -0.4 }]
    } : {
      0: [{ t: "mountain", l: 0.05 }, { t: "garden", l: -0.15 }, { t: "bird", l: -0.35 }],
      2: [{ t: "might", l: 0.0 }, { t: "should", l: -0.2 }],
      3: [{ t: "hardly", l: 0.0 }, { t: "also", l: -0.2 }],
      4: [{ t: "wait", l: 0.0 }, { t: "stand", l: -0.2 }, { t: "seem", l: -0.4 }]
    };
    var CONTINUE = DE ? [
      { t: "Doch", l: 3.0 }, { t: "Dann", l: 1.8 }, { t: "Der", l: 1.1 }, { t: "Ein", l: 0.7 }, { t: "Später", l: 0.4 }, { t: "Niemand", l: 0.2 }
    ] : [
      { t: "But", l: 3.0 }, { t: "Then", l: 1.8 }, { t: "The", l: 1.1 }, { t: "A", l: 0.7 }, { t: "Later", l: 0.4 }, { t: "Nobody", l: 0.2 }
    ];
    function choicesFor(gen) {
      gen = gen || generated;
      var n = gen.length;
      if (n === 0) return NOUNS;
      if (n === 1) {
        if (DE) return RELATIVE[gen[0]] || [{ t: "der", l: 3.6 }];
        var noun = gen[0];
        if (noun === "princess") return [{ t: "that", l: 3.1 }, { t: "who", l: 1.4 }];
        if (noun === "castle" || noun === "river") return [{ t: "that", l: 3.1 }, { t: "which", l: 1.4 }];
        return [{ t: "that", l: 3.1 }, { t: "who", l: 1.4 }, { t: "which", l: 0.8 }];
      }
      if (n === 2) return MODALS;
      if (n === 3) {
        if (DE) return NEGATORS;
        var verb = gen[2];
        if (verb === "could" || verb === "would") return NEGATORS;
        return [{ t: "to", l: 4.0 }];
      }
      if (n === 4) return ACTIONS[gen[0]] || (DE ? ACTIONS.Drache : ACTIONS.dragon);
      if (n === 5) return [{ t: ".", l: 3.2 }, { t: "!", l: 1.1 }, { t: "…", l: 0.7 }];
      if (n === 6) return [{ t: EOS, l: 4.0 }];
      return [];
    }
    var base = DE ? ["Es", "war", "einmal", "ein"] : ["Once", "upon", "a", "time", "there", "was", "a"];
    var generated = [];
    var loopHistory = [];
    var temp = 0.8;
    var decodeMode = "sample";
    var el = document.createElement("div");
    el.className = "ls-loop-scene";
    el.innerHTML =
      '<div class="ls-loop-sentence" aria-live="polite"></div>' +
      '<div class="ls-loop-tree" aria-live="polite"></div>' +
      '<div class="ls-loop-viz"><div class="ls-loop-bars"></div><div class="ls-loop-landscape" hidden><canvas class="ls-canvas" role="img"></canvas><div class="ls-land-tip" hidden></div><div class="ls-land-legend" aria-hidden="true"><div class="ls-land-scale"><span>' + (DE ? "unwahrscheinlich" : "unlikely") + '</span><i></i><span>' + (DE ? "wahrscheinlich" : "likely") + '</span></div><small>' + (DE ? "Ziehen zum Drehen · Klicken zum Wählen" : "Drag to rotate · click to choose") + '</small></div></div></div>' +
      '<div class="ls-loop-bottom">' +
        '<div class="ls-loop-modes" role="group" aria-label="' + (DE ? "Auswahlmodus" : "Decoding mode") + '"></div>' +
        '<div class="ls-loop-actions"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-loop-back" aria-label="' + (DE ? "Letztes Token zurücknehmen" : "Take back the last token") + '">' + (DE ? "← Zurück" : "← Back") + '</button><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-loop-next">' + (DE ? "Weiter →" : "Next →") + '</button><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-loop-reset">' + (DE ? "Neu" : "Reset") + '</button><label class="ls-range">T <input type="range" class="ls-loop-temp" min="0.05" max="1.8" step="0.05" value="0.8"><output>0.80</output></label></div>' +
        '<div class="ls-loop-readout" aria-live="polite"></div>' +
      '</div>' +
      '<div class="ls-camera-capture"><button type="button" class="ls-btn ls-btn--tiny ls-camera-btn">' + (DE ? "Kamera erfassen (temporär)" : "Capture camera (temporary)") + '</button><textarea class="ls-camera-out" readonly hidden aria-label="' + (DE ? "Aktuelle Kameraposition" : "Current camera position") + '" placeholder="' + (DE ? "Drehe die Szene und klicke auf den roten Button." : "Rotate the scene and click the red button.") + '"></textarea></div>';
    root.appendChild(el);
    var sentenceEl = el.querySelector(".ls-loop-sentence");
    var treeEl = el.querySelector(".ls-loop-tree");
    var barsEl = el.querySelector(".ls-loop-bars");
    var readout = el.querySelector(".ls-loop-readout");
    var tempEl = el.querySelector(".ls-loop-temp");
    var tempOut = el.querySelector(".ls-loop-actions output");
    var nextBtn = el.querySelector(".ls-loop-next");
    var backBtn = el.querySelector(".ls-loop-back");
    var cameraRow = el.querySelector(".ls-camera-capture");
    var cameraBtn = el.querySelector(".ls-camera-btn");
    var cameraOut = el.querySelector(".ls-camera-out");
    var landEl = el.querySelector(".ls-loop-landscape");
    var landCanvas = landEl.querySelector("canvas");
    var landTip = landEl.querySelector(".ls-land-tip");
    var landPoints = [];
    var landscape = true, landSize = null;
    var landYaw = -0.62, landPitch = 1.42, landZoom = 1, landSteep = 1;
    var landCamTween = 0;
    var landDrag = null, landMoved = false, landHits = [], landOptionPoints = [];
    var landBall = { x: 0, y: 0, init: false, animating: false };
    var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var landTrail = [];
    var pathWells = [];
    var pathProb = [];
    var navPast = [];
    var navFuture = [];
    var revealed = [];
    var liveReveal = [];
    var knownProbs = {};
    var tempShown = 0.8;
    var REVEAL_R = 0.95, REVEAL_FEATHER = 0.35;
    var lastPath = [], lastProbs = null, lastTop = null, lastWells = [], lastView = null;
    var landStaticCanvas = null, landStaticKey = "", landStaticDirty = true;
    var LAND_X = 2.95, LAND_Y = 2.05;
    var MEADOW_WORDS = DE ? ["Hund", "Katze", "Baum", "Haus", "Auto", "Buch", "Maus", "Lampe", "Blume", "Stein", "Tisch", "Stuhl", "Wasser", "Feuer", "Nacht", "Sonne", "Regen", "Mond", "Stern", "Fluss", "Berg", "Vogel", "Fisch", "Milch", "Zucker", "Tür", "Fenster", "Brücke", "Feld", "Küche", "Garten", "Schiff", "Uhr", "Straße", "Stadt", "Brot", "Apfel", "Tee", "Hut", "Glocke"] : ["Dog", "Cat", "Tree", "House", "Car", "Book", "Mouse", "Lamp", "Flower", "Stone", "Table", "Chair", "Water", "Fire", "Night", "Sun", "Rain", "Moon", "Star", "River", "Mountain", "Bird", "Fish", "Milk", "Sugar", "Door", "Window", "Bridge", "Field", "Kitchen", "Garden", "Ship", "Clock", "Road", "City", "Bread", "Apple", "Tea", "Hat", "Bell"];

    var PLANE_Z = 0.06;
    var BASE_PROB = 0.001;

    // At the end of the sentence the demo offers plausible next-sentence
    // starts. Use the same list for the bars and the landscape.
    function currentOptions() {
      return choicesFor();
    }

    // One stable token plane for the whole scene: every possible token gets
    // a fixed position once, so the map no longer rearranges itself at each
    // step. Only the heights (the current probabilities) change.
    var catalog = buildCatalog();
    var catalogByToken = {};
    catalog.forEach(function (it) { catalogByToken[it.t] = it; });
    var baseValleys = buildBaseValleys(catalog);

    function addReveal(x, y) { revealed.push({ x: x, y: y }); }
    function revealToken(tok) {
      var c = catalogByToken[tok];
      if (c) addReveal(c.x, c.y);
    }
    function revealSegment(fromTok, toTok) {
      var to = catalogByToken[toTok];
      if (!to) return;
      var from = fromTok ? catalogByToken[fromTok] : null;
      if (!from) { addReveal(to.x, to.y); return; }
      var dx = to.x - from.x, dy = to.y - from.y;
      var steps = Math.max(1, Math.ceil(Math.sqrt(dx * dx + dy * dy) / 0.35));
      for (var i = 1; i <= steps; i++) {
        var t = i / steps;
        addReveal(from.x + dx * t, from.y + dy * t);
      }
    }
    function revealSmooth(t) {
      t = Math.max(0, Math.min(1, t));
      return t * t * (3 - 2 * t);
    }
    function revealFactor(x, y) {
      var best = 0;
      function scan(list) {
        for (var i = 0; i < list.length; i++) {
          var r = list[i];
          var dx = x - r.x, dy = y - r.y;
          var f = revealSmooth((REVEAL_R - Math.sqrt(dx * dx + dy * dy)) / REVEAL_FEATHER);
          if (f > best) best = f;
        }
      }
      scan(revealed);
      scan(liveReveal);
      return best;
    }
    function seedReveal() {
      var opts = choicesFor();
      if (!opts.length) return;
      var probs = softmax(opts.map(function (o) { return o.l; }), temp);
      var top = 0;
      probs.forEach(function (p, i) { if (p > probs[top]) top = i; });
      revealToken(opts[top].t);
    }

    function buildCatalog() {
      var nodes = {};
      function node(t) {
        if (!nodes[t]) nodes[t] = { t: t, depth: null, preds: {}, succs: {}, ctx: {} };
        return nodes[t];
      }
      function link(from, to) {
        if (!from || from === to) return;
        node(from).succs[to] = 1;
        node(to).preds[from] = 1;
      }
      var seen = {};
      function walk(gen) {
        var key = gen.join("\u0001");
        if (seen[key]) return;
        seen[key] = true;
        var p = gen.length;
        var opts = p < MAX_STEPS ? choicesFor(gen) : [];
        if (!opts || !opts.length) return;
        var prev = p ? gen[p - 1] : null;
        opts.forEach(function (o) {
          var v = node(o.t);
          if (v.depth == null) v.depth = p;
          if (prev) link(prev, o.t);
          if (p === 4) v.ctx[gen[0]] = 1;
          if (p < MAX_STEPS) walk(gen.concat(o.t));
        });
      }
      walk([]);
      var maxDepth = 0;
      Object.keys(nodes).forEach(function (k) {
        if (nodes[k].depth != null && nodes[k].depth > maxDepth) maxDepth = nodes[k].depth;
      });
      var columns = {};
      Object.keys(nodes).forEach(function (k) {
        var n = nodes[k];
        if (n.depth == null) n.depth = maxDepth;
        (columns[n.depth] || (columns[n.depth] = [])).push(n);
      });
      var nounOrder = {};
      NOUNS.forEach(function (o, i) { nounOrder[o.t] = i; });
      var x0 = -LAND_X * 0.88, x1 = LAND_X * 0.88;
      function stageX(d) { return maxDepth ? x0 + (d / maxDepth) * (x1 - x0) : 0; }
      Object.keys(columns).forEach(function (d) {
        var col = columns[d];
        var span = 2 * LAND_Y * 0.9;
        col.forEach(function (n, i) {
          n.x = stageX(Number(d));
          n.y = col.length === 1 ? 0 : -span / 2 + span * i / (col.length - 1);
          // Actions keep a small x offset toward the subject they belong to,
          // so the landscape groups them around the words they follow.
          if (Number(d) === 4) {
            var idxs = Object.keys(n.ctx).map(function (k) { return nounOrder[k]; }).filter(function (v) { return v != null; });
            var idx = idxs.length ? idxs.reduce(function (a, b) { return a + b; }, 0) / idxs.length : (NOUNS.length - 1) / 2;
            n.x += (idx - (NOUNS.length - 1) / 2) * 0.30;
            var hash = 0;
            for (var ci = 0; ci < n.t.length; ci++) hash = ((hash * 33) + n.t.charCodeAt(ci)) >>> 0;
            n.x += ((hash % 9) - 4) * 0.032;
          }
        });
      });
      // Keep the very unlikely nouns at the far left edge so the demo shows
      // that they are distant, but still close enough to stay on the map.
      var rareOut = {
        "Fluss": [-0.28, 0.42], "Schloss": [-0.24, -0.42],
        "river": [-0.28, 0.42], "castle": [-0.24, -0.42]
      };
      Object.keys(nodes).forEach(function (k) {
        var off = rareOut[k];
        if (off) { nodes[k].x += off[0]; nodes[k].y += off[1]; }
      });
      // Relax vertically so every token sits near the tokens that can come
      // before or after it. The x position keeps the sentence stages apart.
      var all = Object.keys(nodes).map(function (k) { return nodes[k]; });
      for (var iter = 0; iter < 140; iter++) {
        all.forEach(function (n) {
          if (n.depth === 4) {
            var cs = 0, cw = 0;
            Object.keys(n.ctx).forEach(function (c) { cs += nodes[c].y; cw += 1; });
            if (cw) n.y = n.y * 0.4 + (cs / cw) * 0.6;
            return;
          }
          var sum = 0, w = 0;
          Object.keys(n.preds).forEach(function (p) { sum += nodes[p].y; w += 1; });
          Object.keys(n.succs).forEach(function (s) { sum += nodes[s].y * 0.55; w += 0.55; });
          Object.keys(n.ctx).forEach(function (c) { sum += nodes[c].y * 1.5; w += 1.5; });
          if (w > 0) n.y = n.y * 0.55 + (sum / w) * 0.45;
        });
        var buckets = {};
        all.forEach(function (n) {
          var key = String(n.x);
          if (!buckets[key]) buckets[key] = [];
          buckets[key].push(n);
        });
        Object.keys(buckets).forEach(function (key) {
          var col = buckets[key].slice().sort(function (a, b) { return a.y - b.y; });
          var maxGap = col[0] && col[0].depth === 4 ? 0.34 : 0.72;
          var gap = col.length > 1 ? Math.min(maxGap, (2 * LAND_Y * 0.92) / (col.length - 1)) : 0;
          for (var i = 1; i < col.length; i++) {
            if (col[i].y - col[i - 1].y < gap) col[i].y = col[i - 1].y + gap;
          }
          var limit = LAND_Y * 0.94;
          var top = col[col.length - 1].y;
          if (top > limit) { var shift = top - limit; col.forEach(function (n) { n.y -= shift; }); }
          var bottom = col[0].y;
          if (bottom < -limit) { var shift2 = -limit - bottom; col.forEach(function (n) { n.y += shift2; }); }
        });
      }
      return Object.keys(nodes).map(function (k) {
        return { t: k, x: nodes[k].x, y: nodes[k].y };
      });
    }

    // Small fixed valleys between neighbouring words. They give the paths a
    // shallow dip to cross instead of a smooth slope from one word well to
    // the next.
    function buildBaseValleys(list) {
      var out = [], seen = {};
      list.forEach(function (a, i) {
        var best = null, bestJ = -1, bd = Infinity;
        list.forEach(function (b, j) {
          if (i === j) return;
          var dx = b.x - a.x, dy = b.y - a.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < bd) { bd = d; best = b; bestJ = j; }
        });
        if (!best || bd < 0.12 || bd > 0.95) return;
        var key = [i, bestJ].sort(function (x, y) { return x - y; }).join(":");
        if (seen[key]) return;
        seen[key] = 1;
        out.push({
          x: (a.x + best.x) / 2,
          y: (a.y + best.y) / 2,
          p: 0.24,
          s: 0.13
        });
      });
      return out;
    }

    function landWells(items) {
      return items.map(function (it) { return { x: it.x, y: it.y, p: it.p }; });
    }

    // A fixed, gentle base terrain keeps the whole map present and stable.
    // Each step only adds local bumps around its current options; those bumps
    // are the areas the lantern moves to.
    function landBase(x, y) {
      var waves = 0.5 + 0.5 * Math.sin(0.9 * x + 0.4) * Math.cos(1.1 * y - 0.3);
      return BASE_PROB + 0.003 * waves;
    }
    function landProb(x, y, wells) {
      var value = 0, weight = 0;
      wells.forEach(function (w) {
        var dx = x - w.x, dy = y - w.y;
        var sigma = w.s || 0.2;
        var k = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        value += k * w.p;
        weight += k;
      });
      var base = landBase(x, y);
      var coverage = Math.min(1, weight);
      var blended = (value + base * (1 - coverage)) / (weight + (1 - coverage));
      return Math.max(BASE_PROB, Math.min(0.995, blended));
    }

    // z = −p: hohe Wahrscheinlichkeit liegt tief, die Fläche zeigt die negative Wahrscheinlichkeit.
    function landZ(p) { return -Math.max(0, Math.min(1, p)) * landSteep; }

    function landRaw(x, y, z) {
      var cy = Math.cos(landYaw), sy = Math.sin(landYaw);
      var cp = Math.cos(landPitch), sp = Math.sin(landPitch);
      var x1 = x * cy - y * sy;
      var y1 = x * sy + y * cy;
      var y2 = y1 * cp + z * sp;
      var z2 = y1 * sp + z * cp;
      return { x: x1, y: -y2, z: z2 };
    }

    function colorParts(v) {
      var m = String(v).match(/^#?([0-9a-f]{6})$/i);
      if (!m) return null;
      var h = m[1];
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    var mixColor = api.util.hexMix;
    function landColor(p, C) {
      var stops = [
        { p: 0, c: C.petrol },
        { p: 0.30, c: C.blue },
        { p: 0.55, c: C.sky },
        { p: 0.78, c: C.lime },
        { p: 1, c: C.green }
      ];
      p = Math.max(0, Math.min(1, p));
      for (var i = 1; i < stops.length; i++) {
        if (p <= stops[i].p) {
          var t = (p - stops[i - 1].p) / Math.max(0.001, stops[i].p - stops[i - 1].p);
          return mixColor(stops[i - 1].c, stops[i].c, t);
        }
      }
      return C.green;
    }

    function tweenCamera(pitch, yaw, zoom) {
      if (reducedMotion) {
        landPitch = pitch; landYaw = yaw; landZoom = zoom;
        landStaticDirty = true; drawLandscape(); return;
      }
      if (landCamTween) cancelAnimationFrame(landCamTween);
      var startP = landPitch, startY = landYaw, startZ = landZoom, start = performance.now();
      var dur = (api.motion && api.motion.camera) || 280;
      function step(now) {
        var t = Math.min(1, (now - start) / dur);
        var e = t * t * (3 - 2 * t);
        landPitch = startP + (pitch - startP) * e;
        landYaw = startY + (yaw - startY) * e;
        landZoom = startZ + (zoom - startZ) * e;
        landStaticDirty = true;
        drawLandscape();
        if (t < 1) landCamTween = requestAnimationFrame(step);
        else landCamTween = 0;
      }
      landCamTween = requestAnimationFrame(step);
    }
    function drawWordBackdrop(ctx, w, h, C) {
      var seed = 17;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      var palette = [C.green, C.sky, C.lime, C.gold, C.lilac, C.blue];
      MEADOW_WORDS.forEach(function (word, i) {
        var x = (0.06 + rnd() * 0.88) * w;
        var y = (0.08 + rnd() * 0.84) * h;
        ctx.globalAlpha = 0.035 + (i % 3) * 0.012;
        ctx.fillStyle = palette[i % palette.length];
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.fillText(word, x, y);
        ctx.beginPath();
        ctx.arc(x, y - 9, 1.4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    function frayEdges(ctx, b) {
      var seed = 29;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      for (var i = 0; i < 30; i++) {
        var side = i % 4;
        var t = rnd();
        var x, y;
        if (side === 0) { x = b.x0 + t * (b.x1 - b.x0); y = b.y0 + (rnd() - 0.5) * 12; }
        else if (side === 1) { x = b.x0 + t * (b.x1 - b.x0); y = b.y1 + (rnd() - 0.5) * 12; }
        else if (side === 2) { x = b.x0 + (rnd() - 0.5) * 12; y = b.y0 + t * (b.y1 - b.y0); }
        else { x = b.x1 + (rnd() - 0.5) * 12; y = b.y0 + t * (b.y1 - b.y0); }
        var r = 18 + rnd() * 38;
        var g = ctx.createRadialGradient(x, y, 1, x, y, r);
        g.addColorStop(0, "rgba(0,0,0,.95)");
        g.addColorStop(0.55, "rgba(0,0,0,.65)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    function drawEdgeFog(ctx, b, C) {
      var seed = 41;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      ctx.save();
      for (var i = 0; i < 18; i++) {
        var side = i % 4;
        var t = rnd();
        var x, y;
        if (side === 0) { x = b.x0 + t * (b.x1 - b.x0); y = b.y0 + (rnd() - 0.5) * 24; }
        else if (side === 1) { x = b.x0 + t * (b.x1 - b.x0); y = b.y1 + (rnd() - 0.5) * 24; }
        else if (side === 2) { x = b.x0 + (rnd() - 0.5) * 24; y = b.y0 + t * (b.y1 - b.y0); }
        else { x = b.x1 + (rnd() - 0.5) * 24; y = b.y0 + t * (b.y1 - b.y0); }
        var r = 28 + rnd() * 58;
        var g = ctx.createRadialGradient(x, y, 2, x, y, r);
        g.addColorStop(0, "rgba(255,255,255,.72)");
        g.addColorStop(0.6, "rgba(238,247,244,.45)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    function drawEdgeTokens(ctx, b, C) {
      var seed = 53;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      var edges = MEADOW_WORDS.slice(4, 18);
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (var i = 0; i < 9; i++) {
        var side = i % 4;
        var t = (i + 0.3) / 9;
        var x, y;
        if (side === 0) { x = b.x0 + t * (b.x1 - b.x0); y = b.y0 - 6 + rnd() * 10; }
        else if (side === 1) { x = b.x0 + t * (b.x1 - b.x0); y = b.y1 + 6 - rnd() * 10; }
        else if (side === 2) { x = b.x0 - 6 + rnd() * 10; y = b.y0 + t * (b.y1 - b.y0); }
        else { x = b.x1 + 6 - rnd() * 10; y = b.y0 + t * (b.y1 - b.y0); }
        var word = edges[(i * 3 + 1) % edges.length];
        ctx.globalAlpha = 0.12 + (i % 3) * 0.035;
        ctx.fillStyle = [C.muted, C.petrol, C.blue][i % 3];
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.fillText(word, x, y);
        ctx.beginPath();
        ctx.arc(x, y - 8, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    function drawLandscapeStatic(ctx, w, h) {
      var C = api.colors();
      if (w < 10 || h < 10) return;
      ctx.clearRect(0, 0, w, h);
      var sky = ctx.createRadialGradient(w * 0.5, h * 0.4, 8, w * 0.5, h * 0.5, Math.max(w, h) * 0.62);
      sky.addColorStop(0, "rgba(247,250,249,.9)");
      sky.addColorStop(0.6, "rgba(238,247,244,.55)");
      sky.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      var opts = currentOptions();
      var probs = softmax(opts.map(function (o) { return o.l; }), tempShown);
      var probByToken = {};
      knownProbs = {};
      opts.forEach(function (o, i) { probByToken[o.t] = probs[i]; knownProbs[o.t] = probs[i]; });
      var items = catalog.map(function (it) {
        var p = probByToken[it.t];
        return { t: it.t, x: it.x, y: it.y, p: p == null ? 0 : p, current: p != null, known: p != null };
      });
      liveReveal = items.filter(function (it) { return it.current; }).map(function (it) { return { x: it.x, y: it.y }; });
      var wells = landWells(items.filter(function (it) { return it.known; })).concat(pathWells, baseValleys);
      lastWells = wells;
      var currentItems = items.filter(function (it) { return it.current; }).sort(function (a, b) { return b.p - a.p; });
      var top = currentItems[0] || null;
      lastProbs = probByToken;
      lastTop = top;

      var NX = w > 700 ? 42 : 32, NY = w > 700 ? 26 : 20;
      var grid = [];
      var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      function include(rp) {
        if (rp.x < minX) minX = rp.x;
        if (rp.x > maxX) maxX = rp.x;
        if (rp.y < minY) minY = rp.y;
        if (rp.y > maxY) maxY = rp.y;
      }
      for (var i = 0; i <= NX; i++) {
        grid[i] = [];
        for (var j = 0; j <= NY; j++) {
          var gx = -LAND_X + 2 * LAND_X * i / NX;
          var gy = -LAND_Y + 2 * LAND_Y * j / NY;
          var gp = landProb(gx, gy, wells);
          var gh = landZ(gp);
          var rp = landRaw(gx, gy, gh);
          grid[i][j] = { x: gx, y: gy, p: gp, h: gp, rx: rp.x, ry: rp.y, rz: rp.z };
          include(rp);
        }
      }
      [[-LAND_X, -LAND_Y], [LAND_X, -LAND_Y], [LAND_X, LAND_Y], [-LAND_X, LAND_Y]].forEach(function (c) {
        include(landRaw(c[0], c[1], PLANE_Z));
      });
      var axisX = LAND_X + 0.26, axisY = LAND_Y + 0.10;
      include(landRaw(axisX, axisY, landZ(0)));
      include(landRaw(axisX, axisY, landZ(1)));
      var pad = Math.min(w, h) * 0.09;
      var scale = Math.min((w - pad * 2) / Math.max(0.001, maxX - minX), (h - pad * 2) / Math.max(0.001, maxY - minY)) * landZoom;
      var ox = w / 2 - (minX + maxX) / 2 * scale;
      var oy = h / 2 - (minY + maxY) / 2 * scale;
      function sx(rx) { return rx * scale + ox; }
      function sy(ry) { return ry * scale + oy; }
      lastView = { sx: sx, sy: sy };
      var sbx0 = Infinity, sbx1 = -Infinity, sby0 = Infinity, sby1 = -Infinity;
      for (var sbi = 0; sbi <= NX; sbi++) {
        for (var sbj = 0; sbj <= NY; sbj++) {
          var sbp = grid[sbi][sbj];
          var sbX = sx(sbp.rx), sbY = sy(sbp.ry);
          if (sbX < sbx0) sbx0 = sbX;
          if (sbX > sbx1) sbx1 = sbX;
          if (sbY < sby0) sby0 = sbY;
          if (sbY > sby1) sby1 = sbY;
        }
      }
      var sBounds = { x0: sbx0, y0: sby0, x1: sbx1, y1: sby1 };

      var quads = [];
      for (var qi = 0; qi < NX; qi++) {
        for (var qj = 0; qj < NY; qj++) {
          var a = grid[qi][qj], b = grid[qi + 1][qj], c = grid[qi + 1][qj + 1], d = grid[qi][qj + 1];
          quads.push({
            p: [a, b, c, d],
            h: (a.h + b.h + c.h + d.h) / 4,
            z: (a.rz + b.rz + c.rz + d.rz) / 4
          });
        }
      }
      quads.sort(function (a, b) { return b.z - a.z; });
      quads.forEach(function (q) {
        var qx = (q.p[0].x + q.p[1].x + q.p[2].x + q.p[3].x) / 4;
        var qy = (q.p[0].y + q.p[1].y + q.p[2].y + q.p[3].y) / 4;
        var rf = revealFactor(qx, qy);
        ctx.beginPath();
        ctx.moveTo(sx(q.p[0].rx), sy(q.p[0].ry));
        ctx.lineTo(sx(q.p[1].rx), sy(q.p[1].ry));
        ctx.lineTo(sx(q.p[2].rx), sy(q.p[2].ry));
        ctx.lineTo(sx(q.p[3].rx), sy(q.p[3].ry));
        ctx.closePath();
        ctx.fillStyle = landColor(q.h, C);
        ctx.globalAlpha = 0.14 + 0.86 * rf;
        ctx.fill();
        ctx.globalAlpha = 0.05 + 0.17 * rf;
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // The world does not end in a hard rectangle. The terrain edge is
      // nibbled away, fog banks sit in the gaps, and faint token names show
      // that the surrounding space is full of more tokens.
      frayEdges(ctx, sBounds);
      drawEdgeFog(ctx, sBounds, C);
      drawWordBackdrop(ctx, w, h, C);
      drawEdgeTokens(ctx, sBounds, C);

      // The lantern forecasts the next word: it sits on the deepest current
      // valley, so the plot is always one word ahead of the sentence.
      if (top) {
        var glowPt = landRaw(top.x, top.y, landZ(top.p));
        var gx = sx(glowPt.x), gy = sy(glowPt.y);
        var glowR = Math.max(44, Math.min(w, h) * 0.19);
        var glow = ctx.createRadialGradient(gx, gy, 2, gx, gy, glowR);
        glow.addColorStop(0, C.gold);
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(gx, gy, glowR, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Token-Ebene (2D), oberhalb der Wahrscheinlichkeitsfläche.
      var planeCorners = [[-LAND_X, -LAND_Y], [LAND_X, -LAND_Y], [LAND_X, LAND_Y], [-LAND_X, LAND_Y]].map(function (c) {
        var rp = landRaw(c[0], c[1], PLANE_Z);
        return { x: sx(rp.x), y: sy(rp.y) };
      });
      ctx.beginPath();
      ctx.moveTo(planeCorners[0].x, planeCorners[0].y);
      for (var pc = 1; pc < planeCorners.length; pc++) ctx.lineTo(planeCorners[pc].x, planeCorners[pc].y);
      ctx.closePath();
      ctx.fillStyle = C.paper;
      ctx.globalAlpha = 0.06;
      ctx.fill();
      ctx.globalAlpha = 0.30;
      ctx.strokeStyle = C.lineStrong;
      ctx.lineWidth = 1;
      ctx.stroke();
      for (var pg = 1; pg < 6; pg++) {
        var planeGx = -LAND_X + 2 * LAND_X * pg / 6;
        var planeGy = -LAND_Y + 2 * LAND_Y * pg / 6;
        var pa1 = landRaw(planeGx, -LAND_Y, PLANE_Z), pa2 = landRaw(planeGx, LAND_Y, PLANE_Z);
        ctx.beginPath(); ctx.moveTo(sx(pa1.x), sy(pa1.y)); ctx.lineTo(sx(pa2.x), sy(pa2.y)); ctx.stroke();
        var pb1 = landRaw(-LAND_X, planeGy, PLANE_Z), pb2 = landRaw(LAND_X, planeGy, PLANE_Z);
        ctx.beginPath(); ctx.moveTo(sx(pb1.x), sy(pb1.y)); ctx.lineTo(sx(pb2.x), sy(pb2.y)); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      var planeLabel = landRaw(-LAND_X, -LAND_Y, PLANE_Z);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(DE ? "Token-Ebene (2D)" : "token plane (2D)", sx(planeLabel.x) + 4, sy(planeLabel.y) - 4);

      // z-Achse: negative Wahrscheinlichkeit von 0 bis −1.
      var ab = landRaw(axisX, axisY, 0), at = landRaw(axisX, axisY, -1);
      ctx.strokeStyle = C.lineStrong;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sx(ab.x), sy(ab.y)); ctx.lineTo(sx(at.x), sy(at.y)); ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      [0, -0.25, -0.5, -0.75, -1].forEach(function (v) {
        var tick = landRaw(axisX, axisY, v);
        var tick2 = landRaw(axisX + 0.08, axisY, v);
        var tx = sx(tick.x), ty = sy(tick.y);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(sx(tick2.x), sy(tick2.y)); ctx.stroke();
        ctx.fillText(v === 0 ? "0" : v.toFixed(2).replace("-", "−"), tx + 6, ty + 3);
      });
      ctx.fillStyle = C.petrol;
      ctx.font = '600 ' + api.font("canvas") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "right";
      ctx.fillText(DE ? "Wahrscheinlichkeit −p" : "probability −p", sx(ab.x) - 6, sy(ab.y) - 10);

      var atEnd = generated.length >= MAX_STEPS;
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(DE ? "z = −p · tiefer = wahrscheinlicher" : "z = −p · lower = more likely", 10, 16);
      if (atEnd) ctx.fillText(DE ? "Satzende · <|endoftext|>" : "end of sentence · <|endoftext|>", 10, 29);

      var boxes = [];
      function freeBox(box) {
        for (var k = 0; k < boxes.length; k++) {
          var b2 = boxes[k];
          if (!(box.x + box.w < b2.x || b2.x + b2.w < box.x || box.y + box.h < b2.y || b2.y + b2.h < box.y)) return false;
        }
        return true;
      }
      landHits = [];
      landOptionPoints = [];

      // The runner-up at every step stays as a faint side path, so the
      // alternative routes remain visible next to the golden one.
      var altPts = [];
      loopHistory.forEach(function (entry) {
        var alts = (entry.alternatives || []).filter(function (a) {
          return a.p != null && catalogByToken[a.token];
        });
        if (!alts.length) return;
        alts.sort(function (a, b) { return b.p - a.p; });
        var alt = alts[0];
        var c = catalogByToken[alt.token];
        var prevTok = entry.index > 0 ? generated[entry.index - 1] : null;
        var from = prevTok && catalogByToken[prevTok] ? catalogByToken[prevTok] : null;
        var sp = landRaw(c.x, c.y, landZ(landProb(c.x, c.y, wells)));
        var fp = from ? landRaw(from.x, from.y, landZ(landProb(from.x, from.y, wells))) : null;
        altPts.push({
          t: alt.token,
          sx: sx(sp.x), sy: sy(sp.y),
          fx: fp ? sx(fp.x) : null,
          fy: fp ? sy(fp.y) : null
        });
      });
      if (altPts.length) {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = C.sky;
        ctx.globalAlpha = 0.38;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        altPts.forEach(function (p) {
          if (p.fx == null) return;
          ctx.moveTo(p.fx, p.fy);
          ctx.lineTo(p.sx, p.sy);
        });
        ctx.stroke();
        ctx.setLineDash([]);
        altPts.forEach(function (p) {
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 4, 0, Math.PI * 2);
          ctx.fillStyle = C.paper;
          ctx.fill();
          ctx.strokeStyle = C.sky;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
      }

      // The actual chosen path. Each chosen token keeps the probability it
      // had when it was picked, so its valley stays in the surface and the
      // golden line rolls through a chain of valleys instead of jumping
      // across the plane.
      var pathPts = [];
      generated.forEach(function (tok, idx) {
        var c = catalogByToken[tok];
        if (!c) return;
        var planePt = landRaw(c.x, c.y, PLANE_Z);
        var p = probByToken[tok];
        if (p == null && pathProb[idx] != null) p = pathProb[idx];
        var hasP = p != null;
        var surfaceP = landProb(c.x, c.y, wells);
        var surfPt = landRaw(c.x, c.y, landZ(surfaceP));
        pathPts.push({
          t: tok, idx: idx,
          px: sx(planePt.x), py: sy(planePt.y),
          sx: sx(surfPt.x), sy: sy(surfPt.y),
          p: hasP ? p : null,
          current: probByToken[tok] != null
        });
      });
      lastPath = pathPts.slice();
      var pathPByToken = {};
      pathPts.forEach(function (p) { if (p.p != null) pathPByToken[p.t] = p.p; });
      landPoints = catalog.map(function (c) {
        var p = probByToken[c.t];
        if (p == null && pathPByToken[c.t] != null) p = pathPByToken[c.t];
        var pp = landRaw(c.x, c.y, PLANE_Z);
        var sp = landRaw(c.x, c.y, landZ(landProb(c.x, c.y, wells)));
        return { t: c.t, px: sx(pp.x), py: sy(pp.y), sx: sx(sp.x), sy: sy(sp.y), p: p };
      });
      if (pathPts.length) {
        ctx.lineJoin = "round";
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = C.gold;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1;
        ctx.beginPath();
        pathPts.forEach(function (p) {
          ctx.moveTo(p.px, p.py);
          ctx.lineTo(p.sx, p.sy);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = C.paper;
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = 5;
        ctx.beginPath();
        pathPts.forEach(function (p, i) { if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy); });
        ctx.stroke();
        ctx.strokeStyle = C.gold;
        ctx.globalAlpha = 0.95;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        pathPts.forEach(function (p, i) { if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy); });
        ctx.stroke();
        ctx.globalAlpha = 1;

        pathPts.forEach(function (p) {
          ctx.beginPath();
          ctx.arc(p.px, p.py, 3, 0, Math.PI * 2);
          ctx.fillStyle = C.paper;
          ctx.fill();
          ctx.strokeStyle = C.gold;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 7, 0, Math.PI * 2);
          ctx.fillStyle = C.paper;
          ctx.fill();
          ctx.strokeStyle = C.gold;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = C.ink;
          ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(p.idx + 1), p.sx, p.sy + 0.5);
        });
        ctx.textBaseline = "middle";
      }

      currentItems.forEach(function (it) {
        var planePt = landRaw(it.x, it.y, PLANE_Z);
        var surfPt = landRaw(it.x, it.y, landZ(it.p));
        var px = sx(planePt.x), py = sy(planePt.y);
        var surfX = sx(surfPt.x), surfY = sy(surfPt.y);
        var isTop = it === top;

        ctx.strokeStyle = isTop ? C.green : C.petrol;
        ctx.globalAlpha = 0.45;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(surfX, surfY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(surfX, surfY, isTop ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isTop ? C.green : C.petrol;
        ctx.fill();
        ctx.strokeStyle = C.paper;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(px, py, isTop ? 4 : 2.6, 0, Math.PI * 2);
        ctx.fillStyle = C.paper;
        ctx.strokeStyle = isTop ? C.green : C.petrol;
        ctx.lineWidth = isTop ? 2 : 1.4;
        ctx.stroke();
        if (!atEnd) {
          landHits.push({ x: surfX - 12, y: surfY - 12, w: 24, h: 24, t: it.t });
          landOptionPoints.push({ x: surfX, y: surfY, t: it.t });
        }

        var pct = (it.p * 100).toFixed(it.p * 100 < 1 ? 1 : 0) + "%";
        ctx.font = '600 ' + api.font("canvas") + 'px "Open Sans", sans-serif';
        var tw = Math.max(ctx.measureText(it.t).width, ctx.measureText(pct).width) + 12;
        var bh = 28;
        var offsets = [[0, -bh - 8], [0, 10], [-tw / 2 - 10, -bh / 2], [tw / 2 + 10, -bh / 2], [0, -bh - 24], [0, 24]];
        var box = null;
        for (var oi = 0; oi < offsets.length; oi++) {
          var bx = px - tw / 2 + offsets[oi][0];
          var by = py - bh / 2 + offsets[oi][1];
          var cand = { x: bx, y: by, w: tw, h: bh };
          if (bx >= 4 && by >= 4 && bx + tw <= w - 4 && by + bh <= h - 4 && freeBox(cand)) { box = cand; break; }
        }
        if (!box) {
          box = { x: Math.max(4, Math.min(w - tw - 4, px - tw / 2)), y: Math.max(4, Math.min(h - bh - 4, py - bh - 8)), w: tw, h: bh };
        }
        boxes.push(box);
        if (!atEnd) landHits.push({ x: box.x, y: box.y, w: box.w, h: box.h, t: it.t });

        ctx.strokeStyle = C.line;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(box.x + box.w / 2, box.y + box.h / 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.paper;
        ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.strokeStyle = isTop ? C.green : C.line;
        ctx.lineWidth = isTop ? 1.6 : 1;
        ctx.strokeRect(box.x, box.y, box.w, box.h);
        ctx.fillStyle = C.ink;
        ctx.font = '600 ' + api.font("canvas") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(it.t, box.x + 6, box.y + 13);
        ctx.fillStyle = C.muted;
        ctx.font = api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.fillText(pct, box.x + 6, box.y + 23);
      });

      // Every other token stays on the map with a quiet label, so the whole
      // plane is populated even when it is not the current choice set.
      items.forEach(function (it) {
        if (it.current) return;
        var planePt = landRaw(it.x, it.y, PLANE_Z);
        var px = sx(planePt.x), py = sy(planePt.y);
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = C.muted;
        ctx.globalAlpha = 0.55;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.font = '500 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        var tw = ctx.measureText(it.t).width;
        var bh = 14;
        var offsets = [[0, -bh - 2], [0, 4], [-tw - 5, -bh / 2], [5, -bh / 2]];
        for (var oi = 0; oi < offsets.length; oi++) {
          var bx = px - tw / 2 + offsets[oi][0];
          var by = py - bh / 2 + offsets[oi][1];
          var cand = { x: bx, y: by, w: tw, h: bh };
          if (bx >= 3 && by >= 3 && bx + tw <= w - 3 && by + bh <= h - 3 && freeBox(cand)) {
            boxes.push(cand);
            var fog = revealFactor(it.x, it.y);
            if (fog < 0.04) { ctx.globalAlpha = 1; break; }
            ctx.fillStyle = C.muted;
            ctx.globalAlpha = 0.10 + 0.62 * fog;
            ctx.textAlign = "left";
            ctx.fillText(it.t, bx, by + 10);
            ctx.globalAlpha = 1;
            break;
          }
        }
      });

      if (top) {
        if (readout) {
          var cells = readout.querySelectorAll("span");
          if (cells[2]) cells[2].innerHTML = (DE ? "Top" : "Top") + ' <b>' + api.esc(top.t) + '</b>';
        }
        landCanvas.setAttribute("aria-label", DE
          ? "Wahrscheinlichkeitslandschaft. Token-Ebene oben, z = −p. Blau ist unwahrscheinlich, Grün wahrscheinlich. Tiefster Punkt, also höchste Wahrscheinlichkeit: " + top.t + ", " + (top.p * 100).toFixed(0) + " Prozent."
          : "Probability landscape. Token plane above, z = −p. Blue is unlikely, green likely. Deepest point, meaning highest probability: " + top.t + ", " + (top.p * 100).toFixed(0) + " percent.");
      } else {
        landCanvas.setAttribute("aria-label", DE
          ? "Wahrscheinlichkeitslandschaft. Der Satz ist beendet, das Modell hat <|endoftext|> ausgegeben."
          : "Probability landscape. The sentence is finished; the model emitted <|endoftext|>.");
      }
    }

    function drawLandBall(ctx, w, h) {
      var C = api.colors();
      var top = lastTop;
      var wells = lastWells;
      var ballTarget = null;
      if (generated.length) {
        var lastIdx = generated.length - 1;
        var lastToken = generated[lastIdx];
        var lastCat = catalogByToken[lastToken];
        if (lastCat) {
          var lastP = lastProbs ? lastProbs[lastToken] : null;
          if (lastP == null && pathProb[lastIdx] != null) lastP = pathProb[lastIdx];
          ballTarget = { x: lastCat.x, y: lastCat.y, p: lastP == null ? BASE_PROB : lastP };
        }
      }
      if (!ballTarget && top) ballTarget = top;
      if (!ballTarget || !lastView) return;
      var ballP = landProb(ballTarget.x, ballTarget.y, wells);
      var ballPt = landRaw(ballTarget.x, ballTarget.y, landZ(ballP));
      var btx = lastView.sx(ballPt.x), bty = lastView.sy(ballPt.y);
      if (!landBall.init) { landBall.x = btx; landBall.y = bty; landBall.init = true; }
      var bdx = btx - landBall.x, bdy = bty - landBall.y;
      if (reducedMotion) {
        landBall.x = btx; landBall.y = bty; landBall.animating = false;
        landTrail = [];
      } else if (Math.abs(bdx) + Math.abs(bdy) > 1.2) {
        landBall.x += bdx * 0.18;
        landBall.y += bdy * 0.18;
        landBall.animating = true;
        landTrail.push({ x: landBall.x, y: landBall.y });
        if (landTrail.length > 26) landTrail.shift();
      } else {
        landBall.x = btx; landBall.y = bty; landBall.animating = false;
      }
      if (landTrail.length > 1) {
        ctx.beginPath();
        landTrail.forEach(function (p, i) { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
        ctx.strokeStyle = C.green;
        ctx.globalAlpha = 0.30;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.ellipse(landBall.x, landBall.y + 5, 8, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,.18)";
      ctx.fill();
      var ballGrad = ctx.createRadialGradient(landBall.x - 2, landBall.y - 3, 1, landBall.x, landBall.y, 8);
      ballGrad.addColorStop(0, "#fff");
      ballGrad.addColorStop(0.4, C.green);
      ballGrad.addColorStop(1, "rgba(99,164,75,.25)");
      ctx.beginPath();
      ctx.arc(landBall.x, landBall.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = ballGrad;
      ctx.fill();
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (landBall.animating) requestAnimationFrame(drawLandscape);
    }
    function drawLandscape() {
      if (!landscape || !landSize) return;
      var w = landSize.w, h = landSize.h;
      if (w < 10 || h < 10) return;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var key = w + "x" + h + "@" + dpr;
      if (!landStaticCanvas || key !== landStaticKey) {
        landStaticCanvas = document.createElement("canvas");
        landStaticCanvas.width = Math.round(w * dpr);
        landStaticCanvas.height = Math.round(h * dpr);
        landStaticKey = key;
        landStaticDirty = true;
      }
      if (landStaticDirty) {
        var sctx = landStaticCanvas.getContext("2d");
        sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawLandscapeStatic(sctx, w, h);
        landStaticDirty = false;
      }
      var ctx = landSize.ctx;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(landStaticCanvas, 0, 0, w, h);
      drawLandBall(ctx, w, h);
    }

    function landResize() {
      if (!landscape) return;
      var r = landEl.getBoundingClientRect();
      if (r.width < 10 || r.height < 10) return;
      landSize = api.fit(landCanvas, landEl);
      landStaticDirty = true;
      drawLandscape();
    }

    function setLandscape(on) {
      landscape = !!on;
      el.classList.toggle("is-landscape", landscape);
      landEl.hidden = !landscape;
      if (!landscape) landBall.animating = false;
      if (landscape) {
        if (!landSize) landSize = api.fit(landCanvas, landEl);
        landStaticDirty = true;
        drawLandscape();
        requestAnimationFrame(landResize);
      }
    }

    function landHitAt(x, y) {
      for (var i = 0; i < landHits.length; i++) {
        var b = landHits[i];
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
      }
      var best = null, bd = 66;
      landOptionPoints.forEach(function (p) {
        var d = Math.hypot(x - p.x, y - p.y);
        if (d < bd) { bd = d; best = p; }
      });
      return best ? { t: best.t } : null;
    }

    function landPointer(e) {
      var r = landCanvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function hideLandTip() { if (landTip) landTip.hidden = true; }
    function updateLandTip(x, y) {
      if (!landTip) return;
      var best = null, bd = 18;
      landPoints.forEach(function (pt) {
        var d = Math.min(Math.hypot(x - pt.sx, y - pt.sy), Math.hypot(x - pt.px, y - pt.py));
        if (d < bd) { bd = d; best = pt; }
      });
      if (!best) { hideLandTip(); return; }
      var pct = best.p == null ? "—" : (best.p * 100).toFixed(best.p * 100 < 1 ? 1 : 0) + "%";
      var z = best.p == null ? "—" : (-best.p).toFixed(2).replace("-", "−");
      landTip.innerHTML = '<b>' + api.esc(best.t) + '</b> · p = ' + pct +
        ' · z = ' + z +
        ' · ' + (DE ? 'Tal-Tiefe' : 'valley depth') + ' = ' + pct;
      landTip.hidden = false;
      var lw = landSize ? landSize.w : landEl.clientWidth;
      var lh = landSize ? landSize.h : landEl.clientHeight;
      var tw = landTip.offsetWidth, th = landTip.offsetHeight;
      landTip.style.left = Math.max(6, Math.min(lw - tw - 6, x + 12)) + "px";
      landTip.style.top = Math.max(6, Math.min(lh - th - 6, y - th - 10)) + "px";
    }

    landCanvas.addEventListener("pointerdown", function (e) {
      if (landCamTween) { cancelAnimationFrame(landCamTween); landCamTween = 0; }
      hideLandTip();
      landMoved = false;
      landDrag = { x: e.clientX, y: e.clientY, yaw: landYaw, pitch: landPitch };
      if (landCanvas.setPointerCapture) { try { landCanvas.setPointerCapture(e.pointerId); } catch (err) {} }
    });
    landCanvas.addEventListener("pointermove", function (e) {
      var p = landPointer(e);
      if (landDrag) {
        var dx = e.clientX - landDrag.x, dy = e.clientY - landDrag.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) landMoved = true;
        landYaw = landDrag.yaw + dx * 0.008;
        landPitch = Math.min(1.52, Math.max(0.9, landDrag.pitch - dy * 0.006));
        landStaticDirty = true;
        drawLandscape();
        return;
      }
      landCanvas.style.cursor = landHitAt(p.x, p.y) ? "pointer" : "grab";
      updateLandTip(p.x, p.y);
    });
    landCanvas.addEventListener("pointerup", function (e) {
      if (landDrag && !landMoved) {
        var p = landPointer(e);
        var hit = landHitAt(p.x, p.y);
        if (hit) choose(hit.t);
      }
      landDrag = null;
      hideLandTip();
    });
    landCanvas.addEventListener("pointercancel", function () { landDrag = null; hideLandTip(); });
    landCanvas.addEventListener("pointerleave", function () { hideLandTip(); if (!landDrag) landCanvas.style.cursor = "grab"; });

    function softmax(logits, t) {
      var max = Math.max.apply(null, logits);
      var exps = logits.map(function (l) { return Math.exp((l - max) / Math.max(0.05, t)); });
      var sum = exps.reduce(function (a, b) { return a + b; }, 0);
      return exps.map(function (e) { return e / sum; });
    }
    function renderSentence() {
      var html = "";
      var all = base.map(function (tok, i) {
        if (DE && i === base.length - 1 && generated.length) tok = "ein";
        return { tok: tok, cls: "given" };
      }).concat(generated.map(function (tok) { return { tok: tok, cls: tok === EOS ? "eos" : "pred" }; }));
      all.forEach(function (item, i) {
        var noSpace = /^[.,!?;:)\]]|^…/.test(item.tok);
        if (DE && i === base.length + 1) html += ",";
        if (i && !noSpace) html += " ";
        html += '<span class="' + item.cls + '">' + api.esc(item.tok) + "</span>";
      });
      sentenceEl.innerHTML = html;
    }
    function renderTree() {
      var words = base.slice();
      if (DE && generated.length) words[words.length - 1] = "ein";
      var path = ['<span class="ls-loop-base">' + api.esc(words.join(" ")) + '</span>'];
      generated.forEach(function (tok, i) {
        path.push('<span class="ls-loop-arrow">→</span>');
        path.push('<span class="ls-loop-node">' + api.esc(tok) + (DE && i === 0 ? "," : "") + '</span>');
      });
      var opts = choicesFor();
      var next = opts.length
        ? '<span class="ls-loop-next-label">' + (DE ? "nächstes:" : "next:") + '</span> ' + opts.map(function (o) {
            return '<button type="button" class="ls-loop-branch" data-choice="' + api.esc(o.t) + '">' + api.esc(o.t) + '</button>';
          }).join('<span class="ls-loop-sep">·</span>')
        : '<span class="ls-loop-end">' + (DE ? "Satzende" : "end of sentence") + '</span>';
      treeEl.innerHTML = '<div class="ls-loop-line">' + path.join(" ") + '</div><div class="ls-loop-line">' + next + '</div>';
      treeEl.querySelectorAll("[data-choice]").forEach(function (b) {
        b.addEventListener("click", function () { choose(b.getAttribute("data-choice")); });
      });
    }
    function renderBars() {
      var opts = currentOptions();
      var atEnd = generated.length >= MAX_STEPS;
      if (backBtn) backBtn.disabled = !generated.length;
      if (!opts.length) {
        barsEl.innerHTML = '<p class="ls-loop-done">' + (DE ? "Satz beendet: <|endoftext|> ausgegeben. Die Schleife stoppt." : "Sentence finished: <|endoftext|> emitted. The loop stops.") + '</p>';
        if (nextBtn) { nextBtn.disabled = true; nextBtn.textContent = DE ? "Fertig" : "Done"; }
        readout.innerHTML = '<span>' + (DE ? "Schritt" : "Step") + ' <b>' + SEQ_LEN + ' / ' + SEQ_LEN + '</b></span><span>' + (DE ? "Ende" : "End") + ' <b>' + api.esc(EOS) + '</b></span><span>' + (DE ? "Modus" : "Mode") + ' <b>' + decodeMode + '</b></span>';
        publish();
        landStaticDirty = true;
        if (landscape) drawLandscape();
        return;
      }
      var probs = softmax(opts.map(function (o) { return o.l; }), tempShown);
      var top = 0;
      probs.forEach(function (p, i) { if (p > probs[top]) top = i; });
      var order = probs.map(function (p, i) { return { i: i, p: p }; }).sort(function (a, b) { return b.p - a.p; });
      var cut = -1;
      if (decodeMode === "greedy") cut = top;
      if (decodeMode === "topp") {
        var acc = 0;
        for (var k = 0; k < order.length; k++) { acc += order[k].p; if (acc >= 0.9) { cut = order[k].i; break; } }
      }
      var onlyEos = opts.length === 1 && opts[0].t === EOS;
      barsEl.innerHTML = opts.map(function (o, i) {
        var on = decodeMode === "greedy" ? i === top : (decodeMode === "topp" && probs[i] >= probs[cut]);
        var label = o.t === EOS ? (DE ? "Ende" : "End") : o.t;
        return '<button type="button" class="ls-loop-bar' + (on ? " is-on" : "") + '" data-bar="' + i + '"' +
          (atEnd ? ' disabled' : '') + ' title="' + api.esc(o.t) + '" aria-label="' + api.esc(o.t) + '">' +
          '<span class="ls-loop-bar-label">' + api.esc(label) + '</span>' +
          '<span class="ls-loop-bar-track"><i style="width:' + (probs[i] * 100).toFixed(1) + '%"></i></span>' +
          '<span class="ls-loop-bar-val">' + (probs[i] * 100).toFixed(0) + '%</span></button>';
      }).join("") + (onlyEos
        ? '<p class="ls-loop-eos-note">' + (DE ? "Mit diesem Token sagt das LLM, dass diese Antwort fertig ist." : "With this token the LLM says that this answer is finished.") + '</p>'
        : "");
      barsEl.querySelectorAll("[data-bar]").forEach(function (b) {
        b.addEventListener("click", function () { choose(opts[parseInt(b.getAttribute("data-bar"), 10)].t); });
      });
      if (nextBtn) {
        nextBtn.disabled = atEnd || !choicesFor().length;
        nextBtn.textContent = (atEnd || !choicesFor().length) ? (DE ? "Fertig" : "Done") : (DE ? "Weiter →" : "Next →");
      }
      var topP = opts[top] ? probs[top] : 0;
      var loss = -Math.log(Math.max(1e-9, topP));
      landSteep = 0.55 + 0.45 * topP;
      readout.innerHTML = '<span>' + (DE ? "Schritt" : "Step") + ' <b>' + generated.length + ' / ' + MAX_STEPS + '</b></span><span>' + (DE ? "Kontext" : "Context") + ' <b>' + (base.length + generated.length) + '</b></span><span>' + (DE ? "Top" : "Top") + ' <b>' + api.esc(opts[top] ? opts[top].t : "—") + ' ' + Math.round(topP * 100) + '%</b></span><span>Loss <b>' + loss.toFixed(2) + '</b></span><span>' + (DE ? "Modus" : "Mode") + ' <b>' + decodeMode + '</b></span>' +
        (atEnd ? '<span>' + (DE ? "Satzende · <|endoftext|>" : "end of sentence · <|endoftext|>") + '</span>' : '');
      publish();
      landStaticDirty = true;
      if (landscape) drawLandscape();
    }
    function samplePath() {
      var gen = [];
      var picks = DE ? ["Drache", "der", "konnte", "nicht", "fliegen", "."] : ["dragon", "that", "could", "not", "fly", "."];
      var hist = [];
      picks.forEach(function (pick) {
        var opts = choicesFor(gen);
        var alts = opts.map(function (o) { return { token: o.t, logit: o.l }; });
        var chosen = alts.filter(function (a) { return a.token === pick; })[0] || alts[0];
        hist.push({
          index: gen.length,
          chosen: chosen ? chosen.token : pick,
          alternatives: alts.filter(function (a) { return a.token !== pick; })
        });
        gen.push(pick);
      });
      return { tokens: gen, history: hist };
    }
    function snapshotState() {
      return {
        generated: generated.slice(),
        loopHistory: loopHistory.slice(),
        pathWells: pathWells.slice(),
        pathProb: pathProb.slice(),
        revealed: revealed.slice()
      };
    }
    function restoreState(s) {
      generated = s.generated.slice();
      loopHistory = s.loopHistory.slice();
      pathWells = s.pathWells.slice();
      pathProb = s.pathProb.slice();
      revealed = s.revealed.slice();
      landBall.init = false;
      landTrail = [];
      renderSentence(); renderTree(); renderBars();
    }
    function undo() {
      if (!navPast.length) return false;
      navFuture.push(snapshotState());
      restoreState(navPast.pop());
      return true;
    }
    function redo() {
      if (!navFuture.length) return false;
      navPast.push(snapshotState());
      restoreState(navFuture.pop());
      return true;
    }
    function publish() {
      var sample = samplePath();
      SHARED.loop = {
        lang: api.lang,
        base: base.slice(),
        tokens: generated.length ? generated.slice() : sample.tokens,
        history: generated.length ? loopHistory.slice() : sample.history,
        temp: temp
      };
    }
    function choose(token) {
      if (!token || generated.length >= MAX_STEPS) return;
      navPast.push(snapshotState());
      navFuture = [];
      var opts = choicesFor();
      var probs = softmax(opts.map(function (o) { return o.l; }), temp);
      var alts = opts.map(function (o, i) { return { token: o.t, logit: o.l, p: probs[i] }; });
      var pick = -1;
      opts.forEach(function (o, i) { if (o.t === token) pick = i; });
      var pickP = pick >= 0 ? probs[pick] : null;
      var prev = generated.length ? generated[generated.length - 1] : null;
      loopHistory.push({
        index: generated.length,
        chosen: token,
        alternatives: alts.filter(function (a) { return a.token !== token; })
      });
      token.split(" ").forEach(function (piece) {
        revealSegment(prev, piece);
        prev = piece;
        pathProb[generated.length] = pickP;
        if (catalogByToken[piece] && pickP != null) {
          pathWells.push({ x: catalogByToken[piece].x, y: catalogByToken[piece].y, p: pickP });
        }
        generated.push(piece);
      });
      if (generated.length > MAX_STEPS) generated = generated.slice(0, MAX_STEPS);
      renderSentence(); renderTree(); renderBars();
    }
    function sample() {
      var opts = choicesFor();
      if (!opts.length) return;
      if (decodeMode === "greedy") { choose(opts[0].t); return; }
      var probs = softmax(opts.map(function (o) { return o.l; }), temp);
      var pool = probs.map(function (p, i) { return { i: i, p: p }; });
      if (decodeMode === "topp") {
        pool.sort(function (a, b) { return b.p - a.p; });
        var acc = 0, keep = [];
        for (var i = 0; i < pool.length; i++) { keep.push(pool[i]); acc += pool[i].p; if (acc >= 0.9) break; }
        pool = keep;
        var total = pool.reduce(function (s, x) { return s + x.p; }, 0);
        pool.forEach(function (x) { x.p = x.p / total; });
      }
      var r = Math.random(), acc2 = 0;
      for (var j = 0; j < pool.length; j++) { acc2 += pool[j].p; if (r <= acc2) { choose(opts[pool[j].i].t); return; } }
      choose(opts[pool[0].i].t);
    }
    function setMode(mode) {
      decodeMode = mode;
      el.querySelectorAll(".ls-loop-modes .ls-chip").forEach(function (b) {
        b.classList.toggle("is-on", b.getAttribute("data-mode") === mode);
      });
      renderBars();
    }
    function reset() {
      generated = []; loopHistory = []; revealed = []; knownProbs = {};
      pathWells = []; pathProb = []; navPast = []; navFuture = [];
      landBall.init = false; landTrail = [];
      tempShown = temp;
      seedReveal(); renderSentence(); renderTree(); renderBars();
    }
    [
      { id: "sample", label: "Sample" }, { id: "greedy", label: "Greedy" }, { id: "topp", label: "Top-p 0.9" }
    ].forEach(function (m) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-chip" + (m.id === decodeMode ? " is-on" : "");
      b.setAttribute("data-mode", m.id);
      b.textContent = m.label;
      b.addEventListener("click", function () { setMode(m.id); });
      el.querySelector(".ls-loop-modes").appendChild(b);
    });
    el.querySelector(".ls-loop-next").addEventListener("click", sample);
    if (backBtn) backBtn.addEventListener("click", function () { undo(); });
    if (cameraBtn) cameraBtn.addEventListener("click", function () {
      var yaw = Number(landYaw.toFixed(3));
      var pitch = Number(landPitch.toFixed(3));
      var zoom = Number(landZoom.toFixed(3));
      var text = 'camera: { yaw: ' + yaw + ', pitch: ' + pitch + ', zoom: ' + zoom + ' }';
      cameraOut.value = text;
      cameraOut.hidden = false;
      cameraOut.focus();
      cameraOut.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () {});
      }
    });
    el.querySelector(".ls-loop-reset").addEventListener("click", reset);
    tempEl.addEventListener("input", function () {
      temp = parseFloat(tempEl.value) || 0.8;
      tempShown = temp;
      tempOut.textContent = temp.toFixed(2);
      renderBars();
    });
    reset();
    setLandscape(true);
    el.__lsLoopDebug = function () {
      return {
        catalog: catalog.map(function (c) { return { t: c.t, x: c.x, y: c.y }; }),
        generated: generated.slice(),
        history: loopHistory.map(function (h) {
          return { index: h.index, chosen: h.chosen, alts: (h.alternatives || []).map(function (a) { return { token: a.token, p: a.p }; }) };
        }),
        path: lastPath.map(function (p) { return { t: p.t, px: p.px, py: p.py, sx: p.sx, sy: p.sy, p: p.p }; }),
        probs: lastProbs,
        knownProbs: knownProbs,
        top: lastTop ? lastTop.t : null,
        topP: lastTop ? lastTop.p : null,
        zTop: lastTop ? landZ(lastTop.p) : null,
        temp: temp,
        tempShown: tempShown,
        revealed: revealed.length,
        valleys: baseValleys.length,
        pitch: landPitch,
        landscape: landscape
      };
    };
    function onLandTheme() { landStaticDirty = true; drawLandscape(); }
    window.addEventListener("tm:theme", onLandTheme);
    return {
      update: function (s, meta) {
        if (meta && meta.dir < 0) undo();
        else if (meta && meta.dir > 0) redo();
        if (!s) return;
        if (cameraRow) cameraRow.hidden = s.view === "top";
        if (s.camera) {
          var cp = Number(s.camera.pitch), cy = Number(s.camera.yaw), cz = Number(s.camera.zoom);
          tweenCamera(isFinite(cp) ? cp : 1.4, isFinite(cy) ? cy : -0.62, isFinite(cz) ? cz : 1);
        } else if (s.view === "top") tweenCamera(1.50, -0.62, 1);
        else if (s.view === "default") tweenCamera(1.40, -0.62, 1);
        if (s.mode) setMode(s.mode);
        if (typeof s.temp === "number") {
          temp = s.temp;
          tempShown = s.temp;
          tempEl.value = String(temp);
          tempOut.textContent = temp.toFixed(2);
          renderBars();
        }
        setLandscape(true);
        if (s.reset) reset();
      },
      onKey: function (e) {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === "z" || e.key === "Z")) { undo(); return true; }
        if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return false;
        if (e.key === "ArrowLeft") return undo();
        if (e.key !== "ArrowRight" && e.key !== " " && e.key !== "PageDown") return false;
        var opts = choicesFor();
        if (!opts.length || generated.length >= MAX_STEPS) return false;
        var top = opts[0];
        opts.forEach(function (o) { if (o.l > top.l) top = o; });
        choose(top.t);
        return true;
      },
      resize: function () { landResize(); },
      destroy: function () {
        if (landCamTween) cancelAnimationFrame(landCamTween);
        window.removeEventListener("tm:theme", onLandTheme);
        el.remove();
      }
    };
  }

  function tunnelScene(root, api) {
    var DE = api.lang === "de";
    var fallback = DE ? {
      base: ["Es", "war", "einmal", "ein"],
      tokens: ["Drache", "der", "konnte", "nicht", "fliegen", "."],
      history: [
        { index: 0, chosen: "Drache", chosenLogit: 3.4, alternatives: [{ token: "Ritter", logit: 1.1 }, { token: "Roboter", logit: 0.7 }, { token: "Schloss", logit: 0.4 }, { token: "Fluss", logit: 0.2 }] },
        { index: 1, chosen: "der", chosenLogit: 3.6, alternatives: [{ token: "das", logit: 0.7 }] },
        { index: 2, chosen: "konnte", chosenLogit: 3.0, alternatives: [{ token: "wollte", logit: 1.3 }, { token: "sollte", logit: 0.9 }, { token: "durfte", logit: 0.6 }, { token: "musste", logit: 0.3 }] },
        { index: 3, chosen: "nicht", chosenLogit: 3.3, alternatives: [{ token: "nie", logit: 1.2 }, { token: "nur", logit: 0.8 }, { token: "noch", logit: 0.5 }, { token: "immer", logit: 0.3 }] },
        { index: 4, chosen: "fliegen", chosenLogit: 3.5, alternatives: [{ token: "brüllen", logit: 1.5 }, { token: "schlafen", logit: 0.8 }, { token: "schwimmen", logit: 0.5 }, { token: "singen", logit: 0.3 }] },
        { index: 5, chosen: ".", chosenLogit: 3.2, alternatives: [{ token: "!", logit: 1.1 }, { token: "…", logit: 0.7 }] }
      ]
    } : {
      base: ["Once", "upon", "a", "time", "there", "was", "a"],
      tokens: ["dragon", "that", "could", "not", "fly", "."],
      history: [
        { index: 0, chosen: "dragon", chosenLogit: 3.4, alternatives: [{ token: "princess", logit: 1.1 }, { token: "robot", logit: 0.7 }, { token: "castle", logit: 0.4 }, { token: "river", logit: 0.2 }] },
        { index: 1, chosen: "that", chosenLogit: 3.1, alternatives: [{ token: "who", logit: 1.4 }, { token: "which", logit: 0.8 }] },
        { index: 2, chosen: "could", chosenLogit: 3.0, alternatives: [{ token: "would", logit: 1.3 }, { token: "loved", logit: 0.9 }, { token: "tried", logit: 0.6 }, { token: "wanted", logit: 0.3 }] },
        { index: 3, chosen: "not", chosenLogit: 3.3, alternatives: [{ token: "never", logit: 1.2 }, { token: "only", logit: 0.8 }, { token: "still", logit: 0.5 }, { token: "always", logit: 0.3 }] },
        { index: 4, chosen: "fly", chosenLogit: 3.5, alternatives: [{ token: "roar", logit: 1.5 }, { token: "sleep", logit: 0.8 }, { token: "swim", logit: 0.5 }, { token: "sing", logit: 0.3 }] },
        { index: 5, chosen: ".", chosenLogit: 3.2, alternatives: [{ token: "!", logit: 1.1 }, { token: "…", logit: 0.7 }] }
      ]
    };
    var loop = SHARED.loop;
    var data = loop && loop.tokens && loop.tokens.length ? loop : fallback;
    var baseTokens = (data.base || []).slice();
    var genTokens = data.tokens.slice();
    var pathTokens = baseTokens.concat(genTokens);
    var tokens = pathTokens;
    var history = data.history.slice();
    var base = baseTokens;
    var baseLen = baseTokens.length;
    var el = document.createElement("div");
    el.className = "ls-tunnel-scene";
    el.innerHTML =
      '<div class="ls-tunnel-top"><div class="ls-tunnel-sentence"></div><div class="ls-tunnel-meta-top"><span class="ls-tunnel-step"></span><span class="ls-tunnel-temp-read"></span></div></div>' +
      '<div class="ls-tunnel-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-tunnel-info"><div class="ls-tunnel-next-line"></div><div class="ls-tunnel-alts"></div></div>' +
      '<div class="ls-scene-row ls-tunnel-controls"><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-tunnel-advance">' + (DE ? "Weiter →" : "Next →") + '</button><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-tunnel-reset">' + (DE ? "Neu" : "Reset") + '</button><label class="ls-range">T <input type="range" class="ls-tunnel-temp" min="0.05" max="5" step="0.05" value="0.8"><output>0.80</output></label></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-tunnel-stage");
    var canvas = el.querySelector("canvas");
    var sentenceEl = el.querySelector(".ls-tunnel-sentence");
    var stepEl = el.querySelector(".ls-tunnel-step");
    var tempRead = el.querySelector(".ls-tunnel-temp-read");
    var nextLine = el.querySelector(".ls-tunnel-next-line");
    var altEl = el.querySelector(".ls-tunnel-alts");
    var tempEl = el.querySelector(".ls-tunnel-temp");
    var tempOut = el.querySelector("output");
    var advBtn = el.querySelector(".ls-tunnel-advance");
    var ctx = null, size = null, step = 0, temp = (data.temp != null ? data.temp : 0.8);
    tempEl.value = String(temp);
    tempOut.textContent = temp.toFixed(2);
    var yaw = -0.62, pitch = 0.82, zoom = 1;
    var hits = [], drag = null, suppress = false, highlightAlt = null;
    var camera = { scale: 1, ox: 0, oy: 0 };
    var clamp = api.util.clamp;
    function softmax(logits, t) {
      var max = Math.max.apply(null, logits);
      var exps = logits.map(function (l) { return Math.exp((l - max) / Math.max(0.05, t)); });
      var sum = exps.reduce(function (a, b) { return a + b; }, 0);
      return exps.map(function (e) { return e / sum; });
    }
    function entryAt(i) {
      if (i < baseLen) return null;
      return history[clamp(i - baseLen, 0, history.length - 1)] || history[0];
    }
    function probsAt(i) {
      if (i < baseLen) return { all: [], p: [], chosen: 1, entropy: 0.2 };
      var e = entryAt(i);
      var all = [{ token: e.chosen, logit: e.chosenLogit || 3 }].concat(e.alternatives || []);
      var p = softmax(all.map(function (o) { return o.logit; }), temp);
      var chosen = p[0];
      var entropy = 0;
      p.forEach(function (v) { if (v > 0) entropy -= v * Math.log(v); });
      return { all: all, p: p, chosen: chosen, entropy: entropy };
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function sampleAt(x) {
      var last = tokens.length - 1;
      var lo = clamp(Math.floor(x), 0, last);
      var hi = clamp(lo + 1, 0, last);
      var t = x - lo;
      var a = probsAt(lo), b = probsAt(hi);
      return { chosen: lerp(a.chosen, b.chosen, t), entropy: lerp(a.entropy, b.entropy, t) };
    }
    function sideY(index, count) {
      var side = index % 2 === 0 ? 1 : -1;
      return side * (0.62 + 0.22 * Math.floor(index / 2));
    }
    function heightAt(x, y) {
      var s = sampleAt(x);
      var width = 0.14 + 0.30 * s.entropy * (0.7 + temp * 0.2);
      var depth = 0.12 + 0.52 * s.chosen;
      var h = 0.42 - depth * Math.exp(-(y * y) / (2 * width * width));
      for (var i = 0; i < history.length; i++) {
        var e = history[i];
        var full = baseLen + i;
        var pr = probsAt(full);
        (e.alternatives || []).forEach(function (alt, k) {
          var cy = sideY(k, e.alternatives.length);
          var cx = full + 0.48 + 0.06 * Math.sin(i * 1.7 + k);
          var d = ((x - cx) * (x - cx)) / (2 * 0.13 * 0.13) + ((y - cy) * (y - cy)) / (2 * 0.10 * 0.10);
          h -= (0.12 + 0.52 * pr.p[k + 1]) * Math.exp(-d);
        });
      }
      h += 0.018 * Math.sin(x * 2.3 + y * 3.1) + 0.012 * Math.cos(x * 1.4 - y * 4.2);
      return h;
    }
    function sideInfluence(x, y) {
      var best = 0;
      for (var i = 0; i < history.length; i++) {
        var e = history[i];
        (e.alternatives || []).forEach(function (alt, k) {
          var cy = sideY(k, e.alternatives.length);
          var cx = baseLen + i + 0.48 + 0.06 * Math.sin(i * 1.7 + k);
          var d = Math.hypot((x - cx) / 0.16, (y - cy) / 0.12);
          best = Math.max(best, Math.exp(-d * d));
        });
      }
      return best;
    }
    function projectRaw(x, y, z) {
      var cx = (tokens.length - 1) / 2;
      var x0 = x - cx;
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var x1 = x0 * cy - y * sy;
      var y1 = x0 * sy + y * cy;
      var y2 = y1 * cp + z * sp;
      var z2 = y1 * sp + z * cp;
      return { x: x1 / (1 + z2 * 0.18), y: -y2 / (1 + z2 * 0.18), z: z2 };
    }
    function updateCamera() {
      var corners = [];
      var xs = [-1.8, tokens.length - 0.2];
      var ys = [-2.0, 2.0];
      var zs = [-0.35, 0.65];
      xs.forEach(function (x) { ys.forEach(function (y) { zs.forEach(function (z) { corners.push(projectRaw(x, y, z)); }); }); });
      var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      corners.forEach(function (p) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
      var pad = Math.min(28, size.w * 0.05);
      var scale = Math.min((size.w - pad * 2) / Math.max(0.001, maxX - minX), (size.h - pad * 2) / Math.max(0.001, maxY - minY));
      scale *= zoom;
      camera.scale = scale;
      camera.ox = size.w / 2 - (minX + maxX) / 2 * scale;
      camera.oy = size.h / 2 - (minY + maxY) / 2 * scale;
    }
    function project(x, y, z) {
      var p = projectRaw(x, y, z);
      return { x: p.x * camera.scale + camera.ox, y: p.y * camera.scale + camera.oy, z: p.z };
    }
    function colorFor(h, side) {
      var C = api.colors();
      if (side > 0.45 && h < 0.25) return C.gold;
      if (h < 0.05) return C.blue;
      if (h < 0.15) return C.sky;
      if (h < 0.26) return C.lime;
      return C.paper2;
    }
    function draw() {
      if (!size) resize();
      if (!ctx || !size) return;
      var C = api.colors();
      updateCamera();
      ctx.clearRect(0, 0, size.w, size.h);
      var sky = ctx.createRadialGradient(size.w * 0.5, size.h * 0.42, 10, size.w * 0.5, size.h * 0.5, Math.max(size.w, size.h) * 0.62);
      sky.addColorStop(0, "rgba(247,250,249,.9)");
      sky.addColorStop(0.55, "rgba(238,247,244,.7)");
      sky.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, size.w, size.h);

      var NX = Math.min(96, 44 + tokens.length * 4), NY = 34;
      var cells = [];
      for (var i = 0; i < NX; i++) {
        for (var j = 0; j < NY; j++) {
          var x0 = -2 + (tokens.length + 3.5) * i / NX;
          var x1 = -2 + (tokens.length + 3.5) * (i + 1) / NX;
          var y0 = -2.0 + 4.0 * j / NY;
          var y1 = -2.0 + 4.0 * (j + 1) / NY;
          var h00 = heightAt(x0, y0), h10 = heightAt(x1, y0), h11 = heightAt(x1, y1), h01 = heightAt(x0, y1);
          var p00 = project(x0, y0, h00), p10 = project(x1, y0, h10), p11 = project(x1, y1, h11), p01 = project(x0, y1, h01);
          var hAvg = (h00 + h10 + h11 + h01) / 4;
          cells.push({ pts: [p00, p10, p11, p01], z: (p00.z + p10.z + p11.z + p01.z) / 4, h: hAvg, side: sideInfluence((x0 + x1) / 2, (y0 + y1) / 2) });
        }
      }
      cells.sort(function (a, b) { return a.z - b.z; });
      cells.forEach(function (c) {
        ctx.beginPath();
        ctx.moveTo(c.pts[0].x, c.pts[0].y);
        ctx.lineTo(c.pts[1].x, c.pts[1].y);
        ctx.lineTo(c.pts[2].x, c.pts[2].y);
        ctx.lineTo(c.pts[3].x, c.pts[3].y);
        ctx.closePath();
        ctx.fillStyle = colorFor(c.h, c.side);
        ctx.globalAlpha = 0.78;
        ctx.fill();
        ctx.globalAlpha = 0.14;
        ctx.strokeStyle = C.paper;
        ctx.lineWidth = 0.55;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      history.forEach(function (e, i) {
        (e.alternatives || []).forEach(function (alt, k) {
          var cy = sideY(k, e.alternatives.length);
          var pts = [];
          for (var s = 0; s <= 18; s++) {
            var t = s / 18;
            var x = baseLen + i + t * 0.55;
            var y = t * cy;
            pts.push(project(x, y, heightAt(x, y) + 0.035));
          }
          ctx.beginPath();
          pts.forEach(function (p, k2) { if (k2 === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = C.gold;
          ctx.globalAlpha = 0.68;
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
          var end = pts[pts.length - 1];
          ctx.beginPath();
          ctx.arc(end.x, end.y, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = C.gold;
          ctx.fill();
          if (e.index === step) {
            ctx.fillStyle = C.soft;
            ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
            ctx.textAlign = "center";
            ctx.fillText(alt.token, end.x, end.y - 8);
          }
        });
      });

      var pathPts = [];
      for (var k = 0; k <= 80; k++) {
        var x = -1.7 + k / 80 * (tokens.length + 2.8);
        var y = 0;
        pathPts.push(project(x, y, heightAt(x, y) + 0.04));
      }
      ctx.save();
      ctx.shadowColor = "rgba(18,117,172,.55)";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      pathPts.forEach(function (p, i2) { if (i2 === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.85;
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      pathPts.forEach(function (p, i2) { if (i2 === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      ctx.globalAlpha = 1;

      hits = [];
      tokens.forEach(function (tok, i) {
        var p = project(i, 0, heightAt(i, 0) + 0.07);
        var on = i === baseLen + step;
        var above = i % 2 === 0;
        var label = tok;
        var fs = tokens.length > 16 ? 9 : 10;
        ctx.font = (on ? '700 ' : '600 ') + fs + 'px "Open Sans", sans-serif';
        var tw = ctx.measureText(label).width;
        var pw = tw + 12, ph = 17;
        var ly = above ? p.y - 30 : p.y + 12;
        ctx.fillStyle = on ? C.green : C.paper;
        ctx.strokeStyle = on ? C.green : C.lineStrong;
        ctx.lineWidth = 1;
        ctx.fillRect(p.x - pw / 2, ly, pw, ph);
        ctx.strokeRect(p.x - pw / 2, ly, pw, ph);
        ctx.fillStyle = on ? "#fff" : C.ink;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, p.x, ly + ph / 2 + 1);
        ctx.textBaseline = "alphabetic";
        hits.push({ x: p.x, y: ly + ph / 2, r: Math.max(18, pw / 2), step: clamp(i - baseLen, 0, genTokens.length - 1) });
      });

      var fullStep = baseLen + step;
      var bp = project(fullStep, 0, heightAt(fullStep, 0) + 0.10);
      ctx.save();
      ctx.shadowColor = "rgba(99,164,75,.65)";
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = C.green;
      ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, 12, 0, Math.PI * 2);
      ctx.strokeStyle = C.green;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;

      var pr = probsAt(baseLen + step);
      var e = entryAt(baseLen + step);
      var full = tokens;
      var sentenceHtml = "";
      var sentenceText = "";
      full.forEach(function (tok, i) {
        var noSpace = /^[.,!?;:…]/.test(tok);
        if (DE && i === baseLen + 1) { sentenceHtml += ","; sentenceText += ","; }
        if (i && !noSpace) { sentenceHtml += " "; sentenceText += " "; }
        var start = baseLen;
        var active = i === start + step;
        var pred = i >= start;
        sentenceHtml += '<span class="' + (active ? "is-active" : pred ? "is-pred" : "is-given") + '">' + api.esc(tok) + '</span>';
        sentenceText += tok;
      });
      sentenceEl.innerHTML = sentenceHtml;
      stepEl.textContent = (DE ? "Schritt " : "Step ") + (step + 1) + " / " + genTokens.length;
      tempRead.textContent = "T " + temp.toFixed(2);
      nextLine.innerHTML = '<span>' + (DE ? "Nächstes Wort" : "Next word") + '</span> <b>' + api.esc(genTokens[step] || "—") + '</b>';
      altEl.innerHTML = (e.alternatives || []).map(function (alt, k) {
        return '<button type="button" class="ls-tunnel-alt" data-alt="' + k + '">' + api.esc(alt.token) + '</button>';
      }).join("");
      altEl.querySelectorAll("[data-alt]").forEach(function (b) {
        b.addEventListener("click", function () {
          highlightAlt = parseInt(b.getAttribute("data-alt"), 10);
          draw();
        });
      });
      advBtn.disabled = step >= genTokens.length - 1;
      canvas.__lsHits = hits;
      canvas.__lsInfo = { path: tokens.length, generated: genTokens.length, step: step };
      var sentenceEnd = /[.!?…]$/.test(sentenceText) ? "" : ".";
      canvas.setAttribute("aria-label", DE
        ? "Wahrscheinlichkeitstunnel. Pfad: " + sentenceText + sentenceEnd + " Aktuelles Token: " + genTokens[step] + "."
        : "Probability tunnel. Path: " + sentenceText + sentenceEnd + " Current token: " + genTokens[step] + ".");
    }
    function refreshData() {
      var next = SHARED.loop;
      if (!next || !next.tokens || !next.tokens.length) return;
      var nextPath = (next.base || []).concat(next.tokens);
      if (nextPath.join("|") === tokens.join("|")) return;
      baseTokens = (next.base || []).slice();
      genTokens = next.tokens.slice();
      pathTokens = baseTokens.concat(genTokens);
      tokens = pathTokens;
      history = next.history.slice();
      base = baseTokens;
      baseLen = baseTokens.length;
      if (next.temp != null) { temp = next.temp; tempEl.value = String(temp); tempOut.textContent = temp.toFixed(2); }
      step = 0;
      draw();
    }
    function resize() {
      size = api.fit(canvas, stage);
      ctx = size.ctx;
      draw();
    }
    function hitAt(x, y) {
      var best = null, bd = 24;
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
        yaw += (e.clientX - drag.x) * 0.008;
        pitch = clamp(pitch + (e.clientY - drag.y) * 0.006, 0.22, 1.28);
        drag.x = e.clientX;
        drag.y = e.clientY;
        suppress = true;
        draw();
        return;
      }
      canvas.style.cursor = hitAt(p.x, p.y) ? "pointer" : "grab";
    }
    function onDown(e) {
      var p = pointerPos(e);
      if (hitAt(p.x, p.y)) { suppress = false; return; }
      drag = { x: e.clientX, y: e.clientY };
      suppress = false;
    }
    function onUp(e) {
      if (drag) { drag = null; return; }
      if (suppress) { suppress = false; return; }
      var p = pointerPos(e);
      var hit = hitAt(p.x, p.y);
      if (hit) { step = hit.step; draw(); }
    }
    advBtn.addEventListener("click", function () { step = Math.min(genTokens.length - 1, step + 1); draw(); });
    el.querySelector(".ls-tunnel-reset").addEventListener("click", function () { step = 0; draw(); });
    tempEl.addEventListener("input", function () { temp = parseFloat(tempEl.value) || 0.8; tempOut.textContent = temp.toFixed(2); draw(); });
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", function () { drag = null; });
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(stage); }
    window.addEventListener("resize", resize);
    resize();
    return {
      update: function (s) {
        refreshData();
        if (s && typeof s.step === "number") { step = clamp(s.step, 0, genTokens.length - 1); draw(); }
      },
      resume: refreshData,
      resize: resize,
      destroy: function () {
        if (ro) ro.disconnect();
        window.removeEventListener("resize", resize);
        el.remove();
      }
    };
  }

  function tokenizeScene(root, api) {
    var DE = api.lang === "de";
    var examples = DE ? {
      understanding: { label: "Verständnis", value: "Verständnis" },
      unbreakable: { label: "unzerbrechlich", value: "unzerbrechlich" },
      sentence: { label: "Sprachmodelle zerlegen Wörter in Teile", value: "Sprachmodelle zerlegen Wörter in Teile" }
    } : {
      understanding: { label: "understanding", value: "understanding" },
      unbreakable: { label: "unbreakable", value: "unbreakable" },
      sentence: { label: "Language models split words into pieces", value: "Language models split words into pieces" }
    };
    var splits = DE ? {
      "verständnis": ["ver", "ständ", "nis"],
      "unzerbrechlich": ["un", "zerbrech", "lich"],
      "sprachmodelle": ["sprach", "modell", "e"],
      "zerlegen": ["zer", "leg", "en"],
      "wörter": ["wör", "ter"],
      "teile": ["teil", "e"]
    } : {
      "understanding": ["un", "der", "stand", "ing"],
      "unbreakable": ["un", "break", "able"],
      "language": ["lang", "uage"],
      "models": ["mod", "els"],
      "split": ["split"],
      "words": ["word", "s"],
      "pieces": ["piece", "s"]
    };
    var colors = ["#63a44b", "#5c9baf", "#9f9700", "#9185be", "#869b55", "#1275ac", "#009299", "#92a19a"];
    var corpus = [
      { word: "low", count: 5 },
      { word: "lower", count: 2 },
      { word: "newest", count: 6 },
      { word: "widest", count: 3 }
    ];
    var el = document.createElement("div");
    el.className = "ls-tokenize-scene";
    el.innerHTML =
      '<div class="ls-tokenize-split">' +
        '<div class="ls-scene-row ls-tokenize-samples"><span class="ls-tokenize-label">' + (DE ? "Beispiele" : "Samples") + '</span></div>' +
        '<div class="ls-tokenize-chips" aria-live="polite"></div>' +
        '<div class="ls-tokenize-stats"></div>' +
        '<p class="ls-tokenize-note">' + (DE ? "Teil 1: Ein Token ist ein Stück Text, kein Wort. Die ID ist die Adresse in der Embedding-Tabelle." : "Part 1: a token is a piece of text, not a word. The ID is the address in the embedding table.") + '</p>' +
      '</div>' +
      '<div class="ls-bpe" hidden>' +
        '<div class="ls-bpe-head"><span class="ls-bpe-title">' + (DE ? "BPE = gelernte Kompression" : "BPE = learned compression") + '</span><span class="ls-bpe-hint">' + (DE ? "Start: Zeichen" : "Start: characters") + '</span></div>' +
        '<div class="ls-bpe-corpus" aria-live="polite"></div>' +
        '<div class="ls-bpe-stage" aria-live="polite"></div>' +
        '<div class="ls-bpe-counts" aria-live="polite"></div>' +
        '<p class="ls-bpe-note">' + (DE ? "Jeder Merge ersetzt ein häufiges Paar durch ein neues Symbol. Das Wort bleibt aus seinen Symbolen zusammensetzbar; der Text ist verlustfrei rekonstruierbar." : "Each merge replaces a frequent pair with a new symbol. The word remains reconstructable from its symbols; the text is lossless.") + '</p>' +
      '</div>' +
      '<div class="ls-tokenize-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-tokenize-prev">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-tokenize-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-tokenize-next">' + (DE ? "Weiter →" : "Next →") + '</button></div>';
    root.appendChild(el);
    var samples = el.querySelector(".ls-tokenize-samples");
    var chips = el.querySelector(".ls-tokenize-chips");
    var stats = el.querySelector(".ls-tokenize-stats");
    var splitEl = el.querySelector(".ls-tokenize-split");
    var bpeEl = el.querySelector(".ls-bpe");
    var corpusEl = el.querySelector(".ls-bpe-corpus");
    var stageEl = el.querySelector(".ls-bpe-stage");
    var countsEl = el.querySelector(".ls-bpe-counts");
    var navPrev = el.querySelector(".ls-tokenize-prev");
    var navNext = el.querySelector(".ls-tokenize-next");
    var navProgress = el.querySelector(".ls-tokenize-progress");
    var sampleKeys = ["understanding", "unbreakable", "sentence"];
    var mode = "split";
    var step = 0;
    var sampleIndex = 0;

    function cloneWords(words) {
      return words.map(function (w) { return { word: w.word, count: w.count, symbols: w.symbols.slice() }; });
    }
    function pairCounts(words) {
      var map = {};
      words.forEach(function (w) {
        for (var i = 0; i < w.symbols.length - 1; i++) {
          var key = JSON.stringify([w.symbols[i], w.symbols[i + 1]]);
          if (!map[key]) map[key] = { a: w.symbols[i], b: w.symbols[i + 1], count: 0 };
          map[key].count += w.count;
        }
      });
      return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.count - a.count; });
    }
    function mergePair(words, pair) {
      return words.map(function (w) {
        var out = [];
        for (var i = 0; i < w.symbols.length; i++) {
          if (i < w.symbols.length - 1 && w.symbols[i] === pair.a && w.symbols[i + 1] === pair.b) {
            out.push(pair.a + pair.b);
            i++;
          } else out.push(w.symbols[i]);
        }
        return { word: w.word, count: w.count, symbols: out };
      });
    }
    function totalSymbols(words) {
      return words.reduce(function (sum, w) { return sum + w.symbols.length * w.count; }, 0);
    }
    function vocabSize(words) {
      var set = {};
      words.forEach(function (w) { w.symbols.forEach(function (s) { set[s] = 1; }); });
      return Object.keys(set).length;
    }
    var stages = (function () {
      var words = corpus.map(function (c) { return { word: c.word, count: c.count, symbols: c.word.split("") }; });
      var out = [{ words: cloneWords(words), merge: null, pairs: pairCounts(words) }];
      for (var s = 0; s < 4; s++) {
        var pairs = pairCounts(words);
        if (!pairs.length) break;
        var top = pairs[0];
        words = mergePair(words, top);
        out.push({ words: cloneWords(words), merge: top, pairs: pairCounts(words) });
      }
      return out;
    })();
    var baseVocab = (function () {
      var set = {};
      corpus.forEach(function (c) { c.word.split("").forEach(function (ch) { set[ch] = 1; }); });
      return Object.keys(set).length;
    })();

    function idFor(word) { var h = 0; for (var i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) % 50000; return 10000 + h; }
    function piecesFor(word) {
      if (splits[word]) return splits[word];
      if (word.length > 8) {
        var out = [];
        for (var i = 0; i < word.length; i += 4) out.push(word.slice(i, i + 4));
        return out;
      }
      return [word];
    }
    function tokenize(text) {
      var pieces = text.split(/(\s+|[.,!?;:])/).filter(function (p) { return p.length; });
      var tokens = [];
      pieces.forEach(function (piece) {
        if (/^\s+$/.test(piece)) { tokens.push({ word: "␣", id: 220, space: true }); return; }
        if (/^[.,!?;:]$/.test(piece)) { tokens.push({ word: piece, id: idFor(piece) }); return; }
        var word = piece.toLowerCase();
        piecesFor(word).forEach(function (part, idx) {
          tokens.push({ word: part, id: idFor(part), sub: idx > 0 });
        });
      });
      return tokens;
    }
    function renderSplit() {
      var value = examples[sampleKeys[sampleIndex]].value;
      chips.innerHTML = tokenize(value).map(function (tok, i) {
        return '<span class="ls-token-chip' + (tok.sub ? " is-sub" : "") + (tok.space ? " is-space" : "") + '" style="--token-color:' + colors[i % colors.length] + '"><b>' + api.esc(tok.word) + '</b><small>id ' + tok.id + '</small></span>';
      }).join("");
      var tokens = tokenize(value);
      var spaces = tokens.filter(function (t) { return t.space; }).length;
      var subs = tokens.filter(function (t) { return t.sub; }).length;
      stats.innerHTML = '<span><b>' + tokens.length + '</b> ' + (DE ? "Tokens" : "tokens") + '</span><span><b>' + (tokens.length - spaces) + '</b> ' + (DE ? "Teile" : "pieces") + '</span><span><b>' + subs + '</b> ' + (DE ? "Subword-Splits" : "subword splits") + '</span><span><b>' + spaces + '</b> ' + (DE ? "Leerzeichen" : "whitespace") + '</span>';
      samples.querySelectorAll("[data-sample]").forEach(function (b, i) { b.classList.toggle("is-on", i === sampleIndex); });
    }
    function renderBpe() {
      var st = stages[step];
      var next = stages[step + 1];
      corpusEl.innerHTML = st.words.map(function (w) {
        var sign = "";
        w.symbols.forEach(function (sym) {
          var hi = false;
          if (next && next.merge) {
            for (var i = 0; i < w.symbols.length - 1; i++) {
              if (w.symbols[i] === next.merge.a && w.symbols[i + 1] === next.merge.b) {
                if (sym === next.merge.a || sym === next.merge.b) hi = true;
              }
            }
          }
          sign += '<span class="ls-bpe-symbol' + (hi ? " is-pair" : "") + '">' + api.esc(sym) + '</span>';
        });
        return '<div class="ls-bpe-word"><span class="ls-bpe-word-label">' + api.esc(w.word) + '</span><span class="ls-bpe-word-count">×' + w.count + '</span><span class="ls-bpe-symbols">' + sign + '</span></div>';
      }).join("");
      var mergeText = st.merge
        ? (DE ? "Stufe " + step + ": „" + st.merge.a + "“ + „" + st.merge.b + "“ → „" + st.merge.a + st.merge.b + "“ (" + st.merge.count + "×)" : "Stage " + step + ": “" + st.merge.a + "” + “" + st.merge.b + "” → “" + st.merge.a + st.merge.b + "” (" + st.merge.count + "×)")
        : (DE ? "Start: Jedes Wort besteht aus Zeichen." : "Start: every word consists of characters.");
      var nextText = next && next.merge
        ? (DE ? "Nächster Merge: „" + next.merge.a + "“ + „" + next.merge.b + "“ (" + next.merge.count + "×)" : "Next merge: “" + next.merge.a + "” + “" + next.merge.b + "” (" + next.merge.count + "×)")
        : (DE ? "Fertig: vier Merges." : "Done: four merges.");
      stageEl.innerHTML = '<b>' + api.esc(mergeText) + '</b><span>' + api.esc(nextText) + '</span>';
      countsEl.innerHTML = st.pairs.slice(0, 4).map(function (p) {
        return '<span class="ls-bpe-pair"><b>' + api.esc(p.a) + '+' + api.esc(p.b) + '</b> ' + p.count + '×</span>';
      }).join("") +
        '<span class="ls-bpe-total">' + (DE ? "Tokens im Korpus: " : "Tokens in corpus: ") + totalSymbols(st.words) + ' · ' + (DE ? "Vokabular: " : "vocabulary: ") + (baseVocab + step) + '</span>';
    }
    function render() {
      var splitMode = mode === "split";
      splitEl.hidden = !splitMode;
      bpeEl.hidden = splitMode;
      if (splitMode) renderSplit(); else renderBpe();
      var total = 3 + stages.length;
      var pos = splitMode ? step : 3 + step;
      navProgress.textContent = (pos + 1) + ' / ' + total;
      navPrev.disabled = pos === 0;
      navNext.textContent = pos === total - 1 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
    }
    function nextInternal() {
      if (mode === "split") {
        if (step < sampleKeys.length - 1) { step++; render(); return true; }
        mode = "bpe"; step = 0; render(); return true;
      }
      if (step < stages.length - 1) { step++; render(); return true; }
      return false;
    }
    function prevInternal() {
      if (mode === "bpe") {
        if (step > 0) { step--; render(); return true; }
        mode = "split"; step = sampleKeys.length - 1; render(); return true;
      }
      if (step > 0) { step--; render(); return true; }
      return false;
    }
    function nextStep() {
      if (nextInternal()) return;
      api.goNext();
    }
    function prevStep() {
      if (prevInternal()) return;
      api.goPrev();
    }
    Object.keys(examples).forEach(function (key) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-chip";
      b.setAttribute("data-sample", key);
      b.textContent = examples[key].label;
      b.addEventListener("click", function () { mode = "split"; step = sampleKeys.indexOf(key); render(); });
      samples.appendChild(b);
    });
    navPrev.addEventListener("click", prevStep);
    navNext.addEventListener("click", nextStep);
    render();
    return {
      update: function () {},
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) {
        return api.util.arrowKey(e, nextInternal, prevInternal);
      },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }

  function positionScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-position-scene";
    el.innerHTML =
      '<div class="ls-position-grid">' +
        '<div class="ls-position-panel"><canvas class="ls-position-heat"></canvas><div class="ls-position-legend"><span>−1</span><i></i><span>+1</span></div></div>' +
        '<div class="ls-position-panel"><canvas class="ls-position-curve"></canvas></div>' +
      '</div>' +
      '<div class="ls-position-compare"><div class="ls-compare-head">' + (DE ? "Relativer Abstand im selben Satz" : "Relative distance in the same sentence") + '</div><div class="ls-compare-plot"><canvas class="ls-position-methods"></canvas></div><p class="ls-compare-note">' + (DE ? "Sinus, ALiBi, RoPE · aus den Formeln berechnet." : "Sinus, ALiBi, RoPE · computed from the formulas.") + '</p></div>' +
      '<div class="ls-scene-row"><label class="ls-range">' + (DE ? "Kontext" : "Context") + ' <input type="range" class="ls-pos-context" min="16" max="128" step="8" value="64"><output>64</output></label><label class="ls-range">' + (DE ? "Dimensionen" : "Dimensions") + ' <input type="range" class="ls-pos-dims" min="2" max="64" step="2" value="24"><output>24</output></label><label class="ls-range">Position <input type="range" class="ls-pos-pos" min="0" max="10000" step="1" value="7"><output>7</output></label></div>' +
      '<div class="ls-scene-row ls-position-metric"><button type="button" class="ls-chip" data-metric="euclid">' + (DE ? "Euklid" : "Euclidean") + '</button><button type="button" class="ls-chip is-on" data-metric="angle">' + (DE ? "Winkel / Großkreis" : "Angle / great circle") + '</button><button type="button" class="ls-chip' + (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? '' : ' is-on') + '" data-rotate="1">' + (DE ? "Drehen" : "Rotate") + '</button></div>' +
      '<div class="ls-position-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var heat = el.querySelector(".ls-position-heat");
    var curve = el.querySelector(".ls-position-curve");
    var methodsCanvas = el.querySelector(".ls-position-methods");
    var contextEl = el.querySelector(".ls-pos-context");
    var dimsEl = el.querySelector(".ls-pos-dims");
    var posEl = el.querySelector(".ls-pos-pos");
    var readout = el.querySelector(".ls-position-readout");
    var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var context = 64, dims = 24, pos = 7, metric = "angle", rotate = !reducedMotion;
    var posAnim = pos;
    var heatSize = null, curveSize = null, methodsSize = null, yaw = -0.6, pitch = 0.5, drag = null, raf = 0, last = 0;
    var C = api.colors();
    var clamp = api.util.clamp;
    function pe(p, d, i) {
      var freq = Math.pow(10000, (2 * i) / Math.max(2, d));
      return i % 2 === 0 ? Math.sin(p / freq) : Math.cos(p / freq);
    }
    function drawHeat() {
      if (!heatSize) return;
      var ctx = heatSize.ctx, w = heatSize.w, h = heatSize.h;
      ctx.clearRect(0, 0, w, h);
      var padL = 34, padB = 22, padT = 8, padR = 8;
      var cols = Math.min(dims, 64), rows = Math.min(context, 128);
      var cw = (w - padL - padR) / cols, ch = (h - padT - padB) / rows;
      for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
          var v = pe(i, dims, j);
          var t = (v + 1) / 2;
          var col = t < 0.5 ? mix(C.sky, C.paper, t * 2) : mix(C.paper, C.gold, (t - 0.5) * 2);
          ctx.fillStyle = col;
          ctx.fillRect(padL + j * cw, padT + i * ch, Math.ceil(cw) + 0.5, Math.ceil(ch) + 0.5);
        }
      }
      ctx.strokeStyle = C.line;
      ctx.strokeRect(padL, padT, w - padL - padR, h - padT - padB);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "right";
      ctx.fillText("0", padL - 4, padT + 8);
      ctx.fillText(String(rows - 1), padL - 4, padT + (rows - 1) * ch + ch);
      ctx.textAlign = "center";
      ctx.fillText(DE ? "Dimension" : "dimension", padL + (w - padL - padR) / 2, h - 5);
    }
    var mix = api.util.hexMix;
    function project(x, y, z) {
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var x1 = x * cy - y * sy, y1 = x * sy + y * cy;
      var y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;
      var s = Math.min(curveSize.w * 0.45, curveSize.h * 0.36) / (1 + z2 * 0.25);
      return { x: curveSize.w / 2 + x1 * s, y: curveSize.h / 2 - y2 * s, z: z2 };
    }
    function curvePoint(t) {
      var d = Math.max(2, dims);
      return [pe(t, d, 0), pe(t, d, 1), pe(t, d, Math.min(2, d - 1))];
    }
    function unit3(v) {
      var n = Math.hypot(v[0], v[1], v[2]) || 1;
      return [v[0] / n, v[1] / n, v[2] / n];
    }
    function drawCurve() {
      if (!curveSize) return;
      var ctx = curveSize.ctx, w = curveSize.w, h = curveSize.h;
      var Cc = api.colors();
      ctx.clearRect(0, 0, w, h);
      function P(v) { return project(v[0], v[1], v[2]); }
      function line(a, b, col, alpha, width, dash) {
        var pa = P(a), pb = P(b);
        ctx.save();
        if (dash) ctx.setLineDash(dash);
        ctx.strokeStyle = col;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = width || 1;
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        ctx.restore();
      }
      var lat, lon, k, a, p;
      ctx.strokeStyle = Cc.line;
      ctx.globalAlpha = 0.32;
      ctx.lineWidth = 0.8;
      for (lat = -60; lat <= 60; lat += 30) {
        var yy = Math.sin(lat * Math.PI / 180), rr = Math.cos(lat * Math.PI / 180);
        ctx.beginPath();
        for (k = 0; k <= 60; k++) {
          a = k / 60 * Math.PI * 2;
          p = P([Math.cos(a) * rr, yy, Math.sin(a) * rr]);
          if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      for (lon = 0; lon < 180; lon += 30) {
        var lr = lon * Math.PI / 180;
        ctx.beginPath();
        for (k = 0; k <= 60; k++) {
          a = k / 60 * Math.PI * 2;
          p = P([Math.cos(a) * Math.cos(lr), Math.sin(a), Math.cos(a) * Math.sin(lr)]);
          if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      line([0, 0, 0], [1.25, 0, 0], Cc.blue, 0.65, 1.2);
      line([0, 0, 0], [0, 1.25, 0], Cc.green, 0.65, 1.2);
      line([0, 0, 0], [0, 0, 1.25], Cc.gold, 0.65, 1.2);
      function axisLabel(v, text, col) {
        var q = P(v);
        ctx.fillStyle = col;
        ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(text, q.x + 4, q.y - 3);
      }
      axisLabel([1.28, 0, 0], "x", Cc.blue);
      axisLabel([0, 1.28, 0], "y", Cc.green);
      axisLabel([0, 0, 1.28], "z", Cc.gold);
      var maxT = Math.max(1.6, posAnim);
      var steps = Math.max(260, Math.min(2200, Math.ceil(maxT * 2)));
      var prev = null;
      for (k = 0; k <= steps; k++) {
        var t = maxT * k / steps;
        var v = curvePoint(t);
        if (metric === "angle") v = unit3(v);
        var q = P(v);
        if (prev) {
          ctx.strokeStyle = Cc.blue;
          ctx.globalAlpha = 0.20 + 0.55 * (1 - (q.z + 1) / 2);
          ctx.lineWidth = 1.4 + 0.8 * (1 - (q.z + 1) / 2);
          ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
        prev = q;
      }
      ctx.globalAlpha = 1;
      var o = P([0, 0, 0]);
      var g = ctx.createRadialGradient(o.x - 2, o.y - 2, 1, o.x, o.y, 11);
      g.addColorStop(0, "rgba(255,255,255,.95)");
      g.addColorStop(0.45, Cc.blue);
      g.addColorStop(1, "rgba(18,117,172,.15)");
      ctx.beginPath(); ctx.arc(o.x, o.y, 10, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = Cc.soft; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; ctx.textAlign = "center";
      ctx.fillText(DE ? "Wort" : "word", o.x, o.y + 22);
      var cur = curvePoint(posAnim);
      if (metric === "angle") cur = unit3(cur);
      var cp = P(cur);
      var chord = P([0, 0, 0]);
      var theta = 0, vlen = Math.hypot(cur[0], cur[1], cur[2]);
      if (metric === "euclid") {
        ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = Cc.gold; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(chord.x, chord.y); ctx.lineTo(cp.x, cp.y); ctx.stroke(); ctx.restore();
      } else {
        var a0 = [1, 0, 0];
        var b0 = unit3(cur);
        var dot = Math.max(-1, Math.min(1, a0[0] * b0[0] + a0[1] * b0[1] + a0[2] * b0[2]));
        theta = Math.acos(dot);
        ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = Cc.gold; ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (k = 0; k <= 40; k++) {
          var tt = k / 40;
          var s0 = theta === 0 ? 1 : Math.sin((1 - tt) * theta) / Math.sin(theta);
          var s1 = theta === 0 ? 0 : Math.sin(tt * theta) / Math.sin(theta);
          var vv = [a0[0] * s0 + b0[0] * s1, a0[1] * s0 + b0[1] * s1, a0[2] * s0 + b0[2] * s1];
          var pp = P(vv);
          if (k === 0) ctx.moveTo(pp.x, pp.y); else ctx.lineTo(pp.x, pp.y);
        }
        ctx.stroke(); ctx.restore();
        var wp = P(a0);
        ctx.beginPath(); ctx.arc(wp.x, wp.y, 3, 0, Math.PI * 2); ctx.fillStyle = Cc.blue; ctx.fill();
      }
      ctx.save();
      ctx.shadowColor = "rgba(99,164,75,.55)";
      ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(cp.x, cp.y, 6, 0, Math.PI * 2); ctx.fillStyle = Cc.green; ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.arc(cp.x, cp.y, 6, 0, Math.PI * 2); ctx.strokeStyle = Cc.paper; ctx.lineWidth = 2; ctx.stroke();
      curve.__lsPosition = { pos: pos, maxT: maxT, steps: steps, metric: metric };
      ctx.fillStyle = Cc.muted; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; ctx.textAlign = "left";
      ctx.fillText((DE ? "Position " : "position ") + pos, 12, 18);
      ctx.textAlign = "right";
      ctx.fillText(metric === "euclid"
        ? (DE ? "Gerade im Raum" : "straight line in space")
        : (DE ? "Länge im Plot = Großkreis" : "length in plot = great circle"), w - 12, 18);
      ctx.textAlign = "left";
      ctx.fillText(metric === "euclid" ? (DE ? "Länge" : "length") : (DE ? "Großkreis" : "great circle"), cp.x + 10, cp.y + 3);
      var chordLen = Math.hypot(cur[0], cur[1], cur[2]);
      var geoLen = metric === "angle" ? theta : chordLen;
      var angleDeg = (metric === "angle" ? theta : Math.acos(Math.max(-1, Math.min(1, cur[0] / (chordLen || 1))))) * 180 / Math.PI;
      readout.innerHTML = '<span>' + (DE ? "Position" : "Position") + ' <b>' + pos + '</b></span><span>' + (DE ? "Vektor" : "vector") + ' <b>(' + cur.map(function (x) { return x.toFixed(2); }).join(", ") + ')</b></span><span>' + (metric === "angle" ? (DE ? "Distanz (Großkreis)" : "distance (great circle)") : (DE ? "Länge" : "length")) + ' <b>' + geoLen.toFixed(3) + '</b></span><span>' + (DE ? "Winkel" : "angle") + ' <b>' + angleDeg.toFixed(1) + '°</b></span>';
    }
    function drawMethods() {
      if (!methodsSize) return;
      var ctx = methodsSize.ctx, w = methodsSize.w, h = methodsSize.h;
      var Cc = api.colors();
      ctx.clearRect(0, 0, w, h);
      var padL = 28, padR = 12, padT = 22, padB = 20;
      var plotW = Math.max(10, w - padL - padR), plotH = Math.max(10, h - padT - padB);
      ctx.strokeStyle = Cc.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
      var md = Math.min(24, Math.max(2, dims));
      function pvec(p) {
        var out = [];
        for (var i = 0; i < md; i++) out.push(pe(p, md, i));
        return out;
      }
      function pdist(a, b) {
        var sum = 0;
        for (var i = 0; i < a.length; i++) sum += (a[i] - b[i]) * (a[i] - b[i]);
        return Math.sqrt(sum / a.length);
      }
      var base = pvec(0);
      var series = [
        { name: "Sinus", color: Cc.blue, f: function (d) { return Math.min(1, pdist(base, pvec(d))); } },
        { name: "ALiBi", color: Cc.gold, f: function (d) { return 1 - d / 32; } },
        { name: "RoPE", color: Cc.green, f: function (d) {
          var sum = 0, pairs = Math.max(1, Math.floor(md / 2));
          for (var i = 0; i < pairs; i++) {
            var theta = 1 / Math.pow(10000, (2 * i) / md);
            sum += Math.cos(theta * d);
          }
          return 0.5 + 0.5 * sum / pairs;
        } }
      ];
      series.forEach(function (ser) {
        ctx.strokeStyle = ser.color; ctx.lineWidth = 2; ctx.beginPath();
        for (var d = 0; d <= 32; d++) {
          var x = padL + d / 32 * plotW;
          var y = padT + (1 - Math.max(0, Math.min(1, ser.f(d)))) * plotH;
          if (d === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      var lx = padL;
      series.forEach(function (ser) {
        ctx.strokeStyle = ser.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(lx, 11); ctx.lineTo(lx + 12, 11); ctx.stroke();
        ctx.fillStyle = Cc.soft; ctx.fillText(ser.name, lx + 16, 11);
        lx += 16 + ctx.measureText(ser.name).width + 12;
      });
      ctx.fillStyle = Cc.muted; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.fillText(DE ? "relativer Abstand" : "relative distance", padL + plotW / 2, h - 4);
    }
    function draw() {
      drawHeat(); drawCurve(); drawMethods();
    }
    function resizeHeat() { heatSize = api.fit(heat, heat); drawHeat(); }
    function resizeCurve() { curveSize = api.fit(curve, curve); drawCurve(); }
    function resizeMethods() { methodsSize = api.fit(methodsCanvas, methodsCanvas.parentNode); drawMethods(); }
    function resize() { resizeHeat(); resizeCurve(); resizeMethods(); draw(); }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (now - last < 40) return;
      last = now;
      var moving = Math.abs(posAnim - pos) > 0.01;
      if (moving) {
        posAnim += (pos - posAnim) * 0.22;
        if (Math.abs(posAnim - pos) < 0.01) posAnim = pos;
      }
      if (moving || (rotate && !drag)) {
        if (rotate && !drag) yaw += 0.003;
        drawCurve();
      }
    }
    heat.addEventListener("pointerdown", function (e) {
      var r = heat.getBoundingClientRect();
      var padL = 34, padT = 8, padB = 22;
      var y = (e.clientY - r.top - padT) / (r.height - padT - padB);
      pos = Math.round(clamp(y, 0, 1) * (Math.min(context, 128) - 1));
      posEl.value = String(pos); posEl.nextElementSibling.textContent = String(pos);
      draw();
    });
    curve.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY }; });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return;
      yaw += (e.clientX - drag.x) * 0.008;
      pitch = clamp(pitch + (e.clientY - drag.y) * 0.006, -1.2, 1.2);
      drag.x = e.clientX; drag.y = e.clientY; drawCurve();
    });
    window.addEventListener("pointerup", function () { drag = null; });
    contextEl.addEventListener("input", function () { context = parseInt(contextEl.value, 10); contextEl.nextElementSibling.textContent = String(context); drawHeat(); });
    dimsEl.addEventListener("input", function () { dims = parseInt(dimsEl.value, 10); dimsEl.nextElementSibling.textContent = String(dims); drawHeat(); drawCurve(); drawMethods(); });
    posEl.addEventListener("input", function () { pos = parseInt(posEl.value, 10); posEl.nextElementSibling.textContent = String(pos); draw(); });
    el.querySelectorAll("[data-metric]").forEach(function (b) {
      b.addEventListener("click", function () {
        metric = b.getAttribute("data-metric");
        el.querySelectorAll("[data-metric]").forEach(function (x) { x.classList.toggle("is-on", x === b); });
        drawCurve();
      });
    });
    var rot = el.querySelector("[data-rotate]");
    rot.addEventListener("click", function () { rotate = !rotate; rot.classList.toggle("is-on", rotate); });
    window.addEventListener("resize", resize);
    function onTheme() { C = api.colors(); draw(); }
    window.addEventListener("tm:theme", onTheme);
    resize();
    raf = requestAnimationFrame(loop);
    return {
      update: function () {},
      pause: function () { cancelAnimationFrame(raf); raf = 0; },
      resume: function () { if (!raf) raf = requestAnimationFrame(loop); },
      resize: resize,
      destroy: function () { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("tm:theme", onTheme); el.remove(); }
    };
  }

  function noiseScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-noise-scene";
    el.innerHTML =
      '<div class="ls-noise-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-scene-row"><label class="ls-range">' + (DE ? "Kontext" : "Context") + ' <input type="range" class="ls-noise-layer" min="0" max="5" step="1" value="0"><output>0</output></label></div>' +
      '<div class="ls-noise-readout" aria-live="polite"></div>' +
      '<div class="ls-noise-explain">' +
        '<div class="ls-noise-explain-head">' + (DE ? "Wörter allein sind mehrdeutig" : "Words alone are ambiguous") + '</div>' +
        '<div class="ls-noise-explain-row"><span>new</span><p>' + (DE ? "„neu“, aber auch der Anfang von „New York“." : "“new”, but also the start of “New York”.") + '</p></div>' +
        '<div class="ls-noise-explain-row"><span>york</span><p>' + (DE ? "ein Ortsname, allein ohne klaren Bezug." : "a place name, without a clear reference on its own.") + '</p></div>' +
        '<div class="ls-noise-explain-row"><span>new york</span><p>' + (DE ? "zusammen die Stadt. Der Kontext entscheidet, welche Nachbarschaft zählt." : "together, the city. The context decides which neighbourhood counts.") + '</p></div>' +
      '</div>';
    root.appendChild(el);
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
        { id: "city", x: 0.66, y: 0.02, label: DE ? "Stadt" : "city", color: C.green }
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
      // "new" and "york" become one phrase; both point to the city.
      line(newPos, yorkPos, C.petrol, 0.18 + 0.55 * easeT, 1.4 + 2.4 * easeT);
      line(newPos, anchors[2], C.green, 0.18 + 0.72 * easeT, 1.3 + 4.2 * easeT);
      line(yorkPos, anchors[2], C.green, 0.14 + 0.68 * easeT, 1.2 + 3.8 * easeT);
      function point(p, col, label, r) {
        ctx.beginPath(); ctx.arc(px(p.x), py(p.y), r || 5, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();
        ctx.strokeStyle = C.paper; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = C.ink;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(label, px(p.x), py(p.y) - 10);
      }
      anchors.forEach(function (a) { point(a, a.color, a.label, 4.5); });
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
      destroy: function () { window.removeEventListener("resize", resize); el.remove(); }
    };
  }
  function attentionScene(root, api) {
    var DE = api.lang === "de";
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
    var context = "none";
    var selected = contexts[0].bank;
    var causal = true;
    var el = document.createElement("div");
    el.className = "ls-att-scene";
    el.innerHTML =
      '<div class="ls-att-sentences" role="group"></div>' +
      '<div class="ls-att-stage"><canvas class="ls-att-graph" role="img"></canvas></div>' +
      '<div class="ls-att-vector"><canvas class="ls-att-vector-canvas" role="img"></canvas></div>' +
      '<div class="ls-att-matrix" aria-live="polite"></div>' +
      '<div class="ls-att-formula" aria-live="polite"></div>' +
      '<details class="ls-att-mask" open><summary>' + (DE ? "Causal Mask" : "Causal mask") + '</summary>' +
        '<label><input type="checkbox" class="ls-att-causal" checked> ' + (DE ? "nur vergangene Tokens beachten" : "attend only to past tokens") + '</label>' +
        '<p>' + (DE ? "Das obere Dreieck in der Matrix ist die kausale Maske. Sie sorgt dafür, dass Tokens nur die Vergangenheit sehen können, damit sie lernen, Sätze zu vervollständigen, deren Ende sie noch nicht kennen." : "The upper triangle in the matrix is the causal mask. It makes tokens see only the past, so they learn to complete sentences whose end they do not yet know.") + '</p>' +
      '</details>' +
      '<div class="ls-att-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var sentEl = el.querySelector(".ls-att-sentences");
    var stage = el.querySelector(".ls-att-stage");
    var graph = el.querySelector(".ls-att-graph");
    var vectorStage = el.querySelector(".ls-att-vector");
    var vector = el.querySelector(".ls-att-vector-canvas");
    var matrixEl = el.querySelector(".ls-att-matrix");
    var formulaEl = el.querySelector(".ls-att-formula");
    var causalEl = el.querySelector(".ls-att-causal");
    causalEl.checked = true;
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
      ctx.textAlign = "right";
      ctx.fillText(DE ? "Zeile = Frage, Spalte = Antwort" : "row = query, column = key", w - pad, 16);
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
        ? "Attention-Graph. Zeile " + ts[selected] + ", Summe 100 Prozent."
        : "Attention graph. Row " + ts[selected] + ", sum 100 percent.");
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
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.j === selected ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = pt.j === selected ? C.green : (pt.wt > 0.05 ? C.blue : C.line);
        ctx.fill();
        ctx.strokeStyle = C.paper; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = C.ink;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        var right = pt.x > cx + scale * 0.75;
        var left = pt.x < cx - scale * 0.75;
        ctx.textAlign = right ? "right" : (left ? "left" : "center");
        ctx.fillText(pt.label, right ? pt.x - 6 : (left ? pt.x + 6 : pt.x), right || left ? pt.y + 4 : pt.y - 9);
      });
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
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
      ctx.fillText("x′ = Σ w · v", 10, 16);
      ctx.textAlign = "right";
      ctx.fillText(DE ? "Summe 100 %" : "sum 100%", w - 10, 16);
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
        terms.push('\\underbrace{' + Math.round(wt * 100) + '\\%}_{\\text{' + label + '}}\\cdot v_{\\text{' + label + '}}');
      });
      var t = '\\underbrace{x\'}_{\\substack{\\text{' + (DE ? 'neuer Vektor' : 'new vector') + '}\\\\ \\text{' + (DE ? 'für' : 'for') + ' } \\text{' + texText(formulaLabel(ts[selected])) + '}}} = ' +
        '\\underbrace{' + terms.join(' + ') + '}_{\\substack{\\text{' + (DE ? 'gewichtete Summe' : 'weighted sum') + '}\\\\ \\text{' + (DE ? 'Summe der Gewichte' : 'sum of weights') + ' } = 100\\%}}';
      formulaEl.innerHTML = '<div class="ls-math" data-tex="' + escAttr(t) + '" data-tex-display="true"><code class="ls-tex-source">' + api.esc(t) + '</code></div>';
      if (api.typeset) { try { api.typeset(formulaEl); } catch (e) {} }
    }
    function renderReadout() {
      var ts = tokens(), row = matrix()[selected], key = topKey(row, selected);
      readout.innerHTML = '<span>' + (DE ? "Zeile" : "row") + ' <b>' + api.esc(ts[selected]) + '</b></span><span>' + (DE ? "stärkster Key" : "top key") + ' <b>' + api.esc(ts[key]) + ' ' + Math.round(row[key] * 100) + '%</b></span><span>' + (DE ? "Summe" : "sum") + ' <b>100 %</b></span>';
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
    causalEl.addEventListener("change", function () { causal = causalEl.checked; draw(); });
    window.addEventListener("resize", resize);
    resize();
    return {
      update: function (s) {
        if (!s) return;
        var ctxChanged = !!s.context && s.context !== context;
        if (s.context) context = s.context;
        if (typeof s.selected === "number") selected = s.selected;
        else if (ctxChanged) selected = contextObj().bank;
        causal = causalEl.checked;
        draw();
      },
      resize: resize,
      destroy: function () { if (animRaf) cancelAnimationFrame(animRaf); window.removeEventListener("resize", resize); el.remove(); }
    };
  }
  function ffnScene(root, api) {
    var DE = api.lang === "de";
    var data = DE ? {
      fruit: {
        keys: [{ label: "Mechanik · Tür · öffnen", on: false }, { label: "Burg · Turm · König", on: true }, { label: "alt · prächtig · Garten", on: true }],
        values: [{ label: "Hinweis: Schlüssel, Tür, öffnen", on: false }, { label: "Hinweis: König, Turm, Burg", on: true }, { label: "Hinweis: alt, prächtig, Garten", on: true }],
        desc: "Die Burg-, Turm- und Königs-Muster passen; das Mechanik-Muster bleibt still."
      },
      tech: {
        keys: [{ label: "Mechanik · Tür · öffnen", on: true }, { label: "Burg · Turm · König", on: false }, { label: "alt · prächtig · Garten", on: false }],
        values: [{ label: "Hinweis: Schlüssel, Tür, öffnen", on: true }, { label: "Hinweis: König, Turm, Burg", on: false }, { label: "Hinweis: alt, prächtig, Garten", on: false }],
        desc: "Jetzt passt das Mechanik-Muster; die Burg-, Turm- und Königs-Muster bleiben still."
      }
    } : {
      fruit: {
        keys: [{ label: "mechanism · door · open", on: false }, { label: "castle · tower · king", on: true }, { label: "old · grand · garden", on: true }],
        values: [{ label: "Pull: key, door, open", on: false }, { label: "Pull: king, tower, castle", on: true }, { label: "Pull: old, grand, garden", on: true }],
        desc: "The castle, tower, and king patterns match; the mechanism pattern stays silent."
      },
      tech: {
        keys: [{ label: "mechanism · door · open", on: true }, { label: "castle · tower · king", on: false }, { label: "old · grand · garden", on: false }],
        values: [{ label: "Pull: key, door, open", on: true }, { label: "Pull: king, tower, castle", on: false }, { label: "Pull: old, grand, garden", on: false }],
        desc: "Now the mechanism pattern matches; the castle, tower, and king patterns stay silent."
      }
    };
    var labels = DE ? {
      fruitTitle: "Ich besichtige das Schloss",
      techTitle: "Ich öffne das Schloss",
      stream: "„Schloss“ + Kontext",
      output: "reicherer Vektor",
      core: "Burg · Turm · König",
      ring: "Mechanik · Tür · öffnen",
      bend: "Biegung",
      bendButton: "Raum biegen",
      separated: "getrennt",
      notSeparated: "noch nicht getrennt",
      plane: "Trennebene",
      hint: "Das ist ein MLP: Bereich anheben, bis eine Ebene trennt.",
      prev: "Voriger Kontext",
      next: "Nächster Kontext",
      step: "Kontext"
    } : {
      fruitTitle: "I ate the apple",
      techTitle: "I bought an Apple laptop",
      stream: "“apple” + context",
      output: "richer vector",
      core: "castle · tower · king",
      ring: "mechanism · door · open",
      bend: "Bend",
      bendButton: "Bend space",
      separated: "separated",
      notSeparated: "not separated",
      plane: "separating plane",
      hint: "This is an MLP: lift the region until a plane separates it.",
      prev: "Previous context",
      next: "Next context",
      step: "Context"
    };
    var el = document.createElement("div");
    el.className = "ls-ffn-scene";
    el.innerHTML =
      '<div class="ls-ffn-stepper">' +
        '<button type="button" class="ls-btn ls-btn--tiny ls-ffn-prev" aria-label="' + api.esc(labels.prev) + '">←</button>' +
        '<span class="ls-ffn-step-label" aria-live="polite"></span>' +
        '<button type="button" class="ls-btn ls-btn--tiny ls-ffn-next" aria-label="' + api.esc(labels.next) + '">→</button>' +
      '</div>' +
      '<div class="ls-ffn-contexts"></div>' +
      '<div class="ls-ffn-bend">' +
        '<div class="ls-ffn-bend-legend"><span><i class="is-core"></i>' + labels.core + '</span><span><i class="is-ring"></i>' + labels.ring + '</span></div>' +
        '<div class="ls-ffn-bend-stage"><canvas class="ls-ffn-bend-canvas" role="img"></canvas></div>' +
        '<div class="ls-ffn-bend-bar">' +
          '<label class="ls-range">' + labels.bend + ' <input type="range" class="ls-ffn-bend-range" min="0" max="1" step="0.01" value="0.65"><output>0.65</output></label>' +
          '<button type="button" class="ls-btn ls-btn--tiny ls-ffn-bend-toggle">' + labels.bendButton + '</button>' +
          '<span class="ls-ffn-bend-readout" aria-live="polite"></span>' +
        '</div>' +
      '</div>' +
      '<p class="ls-ffn-caveat">' + (DE ? "Das FFN ist ein kleines MLP pro Token. Im LLM trennt es verworrene Strukturen, damit die nächste Schicht sie leichter lesen kann. Die Beschriftungen sind eine didaktische Hilfe; die Muster sind gelernte Richtungen in W₁." : "The FFN is a small MLP per token. In the LLM it separates entangled structures so the next layer can read them more easily. The labels are a teaching aid; the patterns are learned directions in W₁.") + '</p>';
    root.appendChild(el);
    var contextsEl = el.querySelector(".ls-ffn-contexts");
    var stepperEl = el.querySelector(".ls-ffn-stepper");
    var prevBtn = el.querySelector(".ls-ffn-prev");
    var nextBtn = el.querySelector(".ls-ffn-next");
    var stepLabel = el.querySelector(".ls-ffn-step-label");
    var bendStage = el.querySelector(".ls-ffn-bend-stage");
    var bendCanvas = el.querySelector(".ls-ffn-bend-canvas");
    var bendRange = el.querySelector(".ls-ffn-bend-range");
    var bendOut = el.querySelector(".ls-ffn-bend-bar output");
    var bendReadout = el.querySelector(".ls-ffn-bend-readout");
    var bendToggle = el.querySelector(".ls-ffn-bend-toggle");
    var bend = 0.65, bendRaf = 0, size = null, ctx = null;
    var modeOrder = ["fruit", "tech"];
    var activeMode = "fruit";
    function pill(item, withState) {
      return '<span class="ls-ffn-pill ' + (item.on ? "is-fire" : "is-idle") + '">' + api.esc(item.label) +
        (withState ? '<small>' + (item.on ? (DE ? "passt" : "matches") : (DE ? "still" : "silent")) + '</small>' : '') + '</span>';
    }
    function contextCard(mode, title) {
      var d = data[mode];
      var card = document.createElement("article");
      card.className = "ls-ffn-context" + (mode === "fruit" ? " is-active" : "");
      card.setAttribute("data-mode", mode);
      card.innerHTML =
        '<div class="ls-ffn-context-head"><span class="ls-ffn-stream-pill">' + labels.stream + '</span><span class="ls-ffn-context-title">' + api.esc(title) + '</span></div>' +
        '<div class="ls-ffn-flow">' +
          '<div class="ls-ffn-group"><div class="ls-ffn-head">' + (DE ? "Muster in W₁" : "Patterns in W₁") + '</div><div class="ls-ffn-chips">' + d.keys.map(function (k) { return pill(k, true); }).join("") + '</div></div>' +
          '<span class="ls-ffn-arrow" aria-hidden="true">→</span>' +
          '<div class="ls-ffn-group"><div class="ls-ffn-head">' + (DE ? "Pull in W₂" : "Pull in W₂") + '</div><div class="ls-ffn-chips">' + d.values.map(function (v) { return pill(v, false); }).join("") + '</div></div>' +
          '<span class="ls-ffn-out-pill">' + labels.output + '</span>' +
        '</div>' +
        '<p class="ls-ffn-desc">' + d.desc + '</p>';
      contextsEl.appendChild(card);
    }
    contextCard("fruit", labels.fruitTitle);
    contextCard("tech", labels.techTitle);
    function setContext(mode) {
      if (modeOrder.indexOf(mode) < 0) return;
      activeMode = mode;
      var cards = contextsEl.querySelectorAll(".ls-ffn-context");
      Array.prototype.forEach.call(cards, function (card) {
        var on = card.getAttribute("data-mode") === mode;
        card.classList.toggle("is-active", on);
        card.setAttribute("aria-hidden", on ? "false" : "true");
      });
      var idx = modeOrder.indexOf(mode);
      stepLabel.textContent = labels.step + " " + (idx + 1) + " / " + modeOrder.length;
      prevBtn.disabled = idx <= 0;
      nextBtn.disabled = idx >= modeOrder.length - 1;
      drawBend();
    }
    function stepContext(delta) {
      var idx = modeOrder.indexOf(activeMode) + delta;
      if (idx < 0 || idx >= modeOrder.length) return false;
      setContext(modeOrder[idx]);
      return true;
    }
    prevBtn.addEventListener("click", function () { stepContext(-1); });
    nextBtn.addEventListener("click", function () { stepContext(1); });
    var ffnPoints = null, ffnEdges = null;
    function buildFfnGraph() {
      if (ffnPoints) return;
      var seed = 17;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      ffnPoints = [];
      for (var c = 0; c < 2; c++) {
        var n = c === 0 ? 90 : 150;
        for (var k = 0; k < n; k++) {
          var a = k * 2.399963229728653 + rnd() * 0.25;
          var r = c === 0 ? 0.32 * Math.sqrt((k + 0.5) / n) : 0.55 + 0.34 * Math.sqrt((k + 0.5) / n);
          ffnPoints.push({ x: Math.cos(a) * r + (rnd() - 0.5) * 0.025, y: Math.sin(a) * r + (rnd() - 0.5) * 0.025, c: c });
        }
      }
      ffnEdges = [];
      var lim = 0.15;
      for (var i = 0; i < ffnPoints.length; i++) {
        for (var j = i + 1; j < ffnPoints.length; j++) {
          if (ffnPoints[i].c !== ffnPoints[j].c) continue;
          var dx = ffnPoints[i].x - ffnPoints[j].x, dy = ffnPoints[i].y - ffnPoints[j].y;
          if (dx * dx + dy * dy < lim * lim) ffnEdges.push({ a: i, b: j });
        }
      }
    }
    function drawBend() {
      if (!size) return;
      buildFfnGraph();
      var C = api.colors();
      ctx = size.ctx;
      var w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w * 0.5, cy = h * 0.58;
      var scale = Math.min(w * 0.38, h * 0.34);
      function warp(x, y) {
        var r2 = x * x + y * y;
        return { x: x, y: y, z: bend * 1.45 * Math.exp(-r2 / 0.20) };
      }
      function project(x, y, z) {
        return { x: cx + x * scale + z * scale * 0.25, y: cy + y * scale * 0.35 - z * scale * 0.98, z: z };
      }
      ctx.strokeStyle = C.line;
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 1;
      var N = 12;
      for (var i = 0; i <= N; i++) {
        ctx.beginPath();
        for (var j = 0; j <= N; j++) {
          var wp = warp(-1 + 2 * i / N, -1 + 2 * j / N);
          var p = project(wp.x, wp.y, wp.z);
          if (j === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.beginPath();
        for (var j2 = 0; j2 <= N; j2++) {
          var wp2 = warp(-1 + 2 * j2 / N, -1 + 2 * i / N);
          var p2 = project(wp2.x, wp2.y, wp2.z);
          if (j2 === 0) ctx.moveTo(p2.x, p2.y); else ctx.lineTo(p2.x, p2.y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      var projected = ffnPoints.map(function (pt) {
        var wp = warp(pt.x, pt.y);
        var p = project(wp.x, wp.y, wp.z);
        return { x: p.x, y: p.y, z: p.z, c: pt.c };
      });
      ffnEdges.forEach(function (e) {
        var a = projected[e.a], b = projected[e.b];
        ctx.strokeStyle = a.c === 0 ? C.green : C.gold;
        ctx.globalAlpha = 0.16 + 0.12 * (1 - Math.max(0, Math.min(1, bend)));
        ctx.lineWidth = 0.65;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      projected.sort(function (a, b) { return a.z - b.z; });
      projected.forEach(function (p) {
        var active = (p.c === 0 && activeMode === "fruit") || (p.c === 1 && activeMode === "tech");
        ctx.beginPath();
        ctx.arc(p.x, p.y, (p.c === 0 ? 2.6 : 2.3) * (active ? 1.12 : 1), 0, Math.PI * 2);
        ctx.fillStyle = p.c === 0 ? C.green : C.gold;
        ctx.globalAlpha = active ? 0.9 : 0.22;
        ctx.fill();
        ctx.strokeStyle = C.paper;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = active ? 1 : 0.4;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      var lineAlpha = Math.max(0, Math.min(1, (bend - 0.45) / 0.25));
      if (lineAlpha > 0.01) {
        var ly = cy - 0.62 * scale * 0.98;
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = C.petrol;
        ctx.globalAlpha = lineAlpha;
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(16, ly); ctx.lineTo(w - 16, ly); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = C.petrol;
        ctx.globalAlpha = lineAlpha;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "right";
        ctx.fillText(labels.plane, w - 18, ly - 6);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(labels.bend + " " + bend.toFixed(2), 14, 18);
      ctx.textAlign = "center";
      ctx.fillText(DE ? "feine Punktwolke · Kanten = Nachbarschaft" : "fine point cloud · edges = neighbourhood", w / 2, h - 10);
      bendCanvas.setAttribute("aria-label", (DE ? "Feine Punktwolke des FFN-Raums. " : "Fine point cloud of the FFN space. ") + labels.hint + " " + (bend > 0.6 ? labels.separated : labels.notSeparated) + ".");
    }
    function updateBendReadout() {
      bendOut.textContent = bend.toFixed(2);
      bendReadout.textContent = labels.bend + " " + bend.toFixed(2) + " · " + (bend > 0.6 ? labels.separated : labels.notSeparated);
    }
    function setBend(v) {
      bend = Math.max(0, Math.min(1, v));
      bendRange.value = String(bend);
      updateBendReadout();
      drawBend();
    }
    function animateBend(target) {
      if (bendRaf) cancelAnimationFrame(bendRaf);
      var from = bend, t0 = performance.now(), dur = 620;
      function frame(now) {
        var t = Math.max(0, Math.min(1, (now - t0) / dur));
        var e = 1 - Math.pow(1 - t, 3);
        bend = from + (target - from) * e;
        bendRange.value = String(bend);
        updateBendReadout();
        drawBend();
        if (t < 1) bendRaf = requestAnimationFrame(frame);
        else bendRaf = 0;
      }
      bendRaf = requestAnimationFrame(frame);
    }
    bendRange.addEventListener("input", function () { setBend(parseFloat(bendRange.value) || 0); });
    bendToggle.addEventListener("click", function () { animateBend(bend > 0.5 ? 0 : 1); });
    function resize() {
      size = api.fit(bendCanvas, bendStage);
      drawBend();
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(bendStage); }
    function onTheme() { drawBend(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", onTheme);
    updateBendReadout();
    resize();
    setContext(activeMode);
    return {
      update: function (s) {
        if (s && s.mode) setContext(s.mode);
      },
      next: function () {
        if (bend < 0.94) { animateBend(1); return true; }
        return stepContext(1);
      },
      prev: function () { return stepContext(-1); },
      onKey: function (e) {
        if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return false;
        if (e.key === "ArrowLeft") return stepContext(-1);
        if (e.key === "ArrowRight") { if (bend < 0.94) { animateBend(1); return true; } return stepContext(1); }
        return false;
      },
      resize: resize,
      destroy: function () {
        if (bendRaf) cancelAnimationFrame(bendRaf);
        if (ro) ro.disconnect();
        window.removeEventListener("resize", resize);
        window.removeEventListener("tm:theme", onTheme);
        el.remove();
      }
    };
  }

  function residualScene(root, api) {
    var DE = api.lang === "de";
    var layers = DE ? ["Embedding", "Attention 1", "FFN 1", "Attention 2", "FFN 2", "Unembed"] : ["Embedding", "Attention 1", "FFN 1", "Attention 2", "FFN 2", "Unembed"];
    var updates = [
      [0.8, 0.3, 0.2, 0.5, 0.1, 0.4],
      [0.2, -0.4, 0.3, 0.1, 0.5, -0.2],
      [-0.1, 0.2, 0.4, -0.3, 0.2, 0.3],
      [0.3, 0.1, -0.2, 0.4, -0.1, 0.2],
      [0.1, -0.2, 0.3, 0.2, 0.4, -0.1],
      [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    ];
    var el = document.createElement("div");
    el.className = "ls-res-scene";
    el.innerHTML = '<div class="ls-res-stage"><canvas class="ls-canvas" role="img"></canvas></div><div class="ls-scene-row ls-res-layers"></div><div class="ls-res-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-res-stage");
    var canvas = el.querySelector("canvas");
    var layerRow = el.querySelector(".ls-res-layers");
    var readout = el.querySelector(".ls-res-readout");
    var ctx = null, size = null, current = 0, hits = [];
    var C = api.colors();
    var clamp = api.util.clamp;
    function streamAt(n) {
      var v = [0, 0, 0, 0, 0, 0];
      for (var i = 0; i <= n; i++) for (var j = 0; j < 6; j++) v[j] += updates[i][j];
      return v;
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      var w = size.w, h = size.h;
      var stream = streamAt(current);
      var update = updates[current];
      var pad = 24;
      var wide = h > 260;
      var barX0 = wide ? pad + 124 : pad;
      var barW = (w - barX0 - pad) / 6;
      var baseY = wide ? h * 0.70 : h * 0.62;
      var scale = Math.min(70, h * 0.18);
      if (wide) {
        var sentence = DE
          ? [["Die", ""], ["Katze", "att"], ["saß", "mlp"], ["auf", ""], ["der", ""], ["Matte", ""], [",", ""], ["weil", ""], ["sie", "att"], ["müde", "mlp"], ["war", ""], [".", ""]]
          : [["The", ""], ["cat", "att"], ["sat", "mlp"], ["on", ""], ["the", ""], ["mat", ""], ["because", ""], ["she", "att"], ["was", "mlp"], ["tired", ""], [".", ""]];
        ctx.fillStyle = C.paper;
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 1;
        ctx.fillRect(pad, 10, w - pad * 2, 54);
        ctx.strokeRect(pad, 10, w - pad * 2, 54);
        ctx.font = '600 ' + api.font("canvas") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        var tx = pad + 10, ty = 34;
        sentence.forEach(function (pair) {
          var word = pair[0];
          var col = pair[1] === "att" ? C.green : pair[1] === "mlp" ? C.gold : C.soft;
          ctx.fillStyle = col;
          ctx.fillText(word, tx, ty);
          tx += ctx.measureText(word + " ").width;
        });
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.fillStyle = C.green; ctx.fillText(DE ? "Attention" : "attention", pad + 10, 52);
        ctx.fillStyle = C.gold; ctx.fillText("MLP", pad + 78, 52);
        ctx.fillStyle = C.muted; ctx.fillText("Embedding", pad + 118, 52);
      }
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      for (var j = 0; j < 6; j++) {
        var x = barX0 + j * barW + barW / 2;
        var bh = stream[j] * scale;
        ctx.fillStyle = C.blue;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x - barW * 0.22, baseY - Math.max(0, bh), barW * 0.44, Math.abs(bh));
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.soft;
        ctx.fillText((DE ? "d" : "d") + (j + 1), x, baseY + 18);
        if (update[j]) {
          ctx.fillStyle = C.gold;
          ctx.fillRect(x - barW * 0.12, baseY - Math.max(0, update[j] * scale), barW * 0.24, Math.abs(update[j] * scale));
        }
      }
      ctx.strokeStyle = C.lineStrong;
      ctx.beginPath(); ctx.moveTo(barX0, baseY); ctx.lineTo(w - pad, baseY); ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.textAlign = "left";
      ctx.fillText(DE ? "blau: Stream · gold: Update" : "blue: stream · gold: update", barX0, 20);
      hits = [];
      for (var i = 0; i < layers.length; i++) {
        var on = i === current;
        if (wide) {
          var yy = 84 + i * 22;
          ctx.fillStyle = on ? C.petrol : C.paper;
          ctx.strokeStyle = on ? C.petrol : C.lineStrong;
          ctx.fillRect(pad, yy - 12, 112, 20);
          ctx.strokeRect(pad, yy - 12, 112, 20);
          ctx.fillStyle = on ? "#fff" : C.soft;
          ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
          ctx.textAlign = "left";
          ctx.fillText(layers[i], pad + 6, yy + 2);
          hits.push({ x: pad + 56, y: yy - 2, r: 28, layer: i });
        } else {
          var lw = (w - pad * 2) / 6;
          var lx = pad + i * lw;
          ctx.fillStyle = on ? C.petrol : C.paper;
          ctx.strokeStyle = on ? C.petrol : C.lineStrong;
          ctx.fillRect(lx + 1, 6, lw - 3, 18);
          ctx.strokeRect(lx + 1, 6, lw - 3, 18);
          ctx.fillStyle = on ? "#fff" : C.soft;
          ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
          ctx.textAlign = "center";
          ctx.fillText(layers[i].split(" ")[0], lx + lw / 2, 18);
          hits.push({ x: lx + lw / 2, y: 15, r: lw / 2, layer: i });
        }
      }
      readout.innerHTML = '<span>x<sub>' + current + '</sub></span><span>' + (DE ? "Stream" : "stream") + ' <b>' + stream.map(function (v) { return v.toFixed(1); }).join(" · ") + '</b></span><span>' + (DE ? "Update" : "update") + ' <b>' + update.map(function (v) { return v.toFixed(1); }).join(" · ") + '</b></span>';
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    function pick(e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      hits.forEach(function (h) { if (Math.hypot(h.x - x, h.y - y) < h.r) { current = h.layer; draw(); sync(); } });
    }
    canvas.addEventListener("pointerup", pick);
    function sync() { layerRow.querySelectorAll(".ls-chip").forEach(function (b, i) { b.classList.toggle("is-on", i === current); }); }
    layers.forEach(function (l, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-chip" + (i === current ? " is-on" : "");
      b.textContent = l;
      b.addEventListener("click", function () { current = i; draw(); sync(); });
      layerRow.appendChild(b);
    });
    window.addEventListener("resize", resize);
    resize();
    return { update: function (s) { if (s && typeof s.layer === "number") { current = clamp(s.layer, 0, layers.length - 1); draw(); sync(); } }, resize: resize, destroy: function () { window.removeEventListener("resize", resize); el.remove(); } };
  }

  function meadowScene(root, api) {
    var DE = api.lang === "de";
    var WORDS = DE ? ["Hund", "Katze", "Baum", "Haus", "Auto", "Buch", "Maus", "Lampe", "Blume", "Stein", "Tisch", "Stuhl", "Wasser", "Feuer", "Nacht", "Sonne", "Regen", "Mond", "Kaffee", "Stern", "Fluss", "Berg", "Vogel", "Fisch", "Milch", "Zucker", "Tür", "Fenster", "Brücke", "Feld", "Küche", "Garten", "Schiff", "Uhr", "Straße", "Stadt", "Brot", "Apfel", "Tee", "Hut", "Glocke"] : ["Dog", "Cat", "Tree", "House", "Car", "Book", "Mouse", "Lamp", "Flower", "Stone", "Table", "Chair", "Water", "Fire", "Night", "Sun", "Rain", "Moon", "Coffee", "Star", "River", "Mountain", "Bird", "Fish", "Milk", "Sugar", "Door", "Window", "Bridge", "Field", "Kitchen", "Garden", "Ship", "Clock", "Road", "City", "Bread", "Apple", "Tea", "Hat", "Bell"];
    var PALETTE = ["#63a44b", "#5c9baf", "#9f9700", "#9185be", "#869b55", "#1275ac", "#009299", "#92a19a"];
    var HUES = [188, 220, 260, 290, 320, 350, 15, 40, 60, 90, 140, 170, 200, 240, 280, 310, 340, 25, 50, 75, 120, 155, 195, 230, 270, 300, 330, 10, 45, 100, 160, 210, 250, 295, 335, 20, 65, 130, 185, 245, 305];
    var CW = 1120, CH = 392;
    var el = document.createElement("div");
    el.className = "ls-meadow-scene";
    el.innerHTML = '<div class="ls-meadow-stage"><canvas class="ls-canvas" role="img"></canvas></div><div class="ls-scene-row"><label class="ls-range">' + (DE ? "Wörter" : "Words") + ' <input type="range" class="ls-md-n" min="12" max="40" step="4" value="20"><output>20</output></label><label class="ls-range">T <input type="range" class="ls-md-temp" min="0.2" max="2.6" step="0.05" value="0.8"><output>0.80</output></label><label class="ls-range">k <input type="range" class="ls-md-k" min="1" max="10" step="1" value="5"><output>5</output></label><button type="button" class="ls-btn ls-btn--tiny ls-md-landscape">' + (DE ? "Landschaft" : "Landscape") + '</button></div><div class="ls-meadow-readout" aria-live="polite"></div><p class="ls-meadow-caption"></p>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-meadow-stage");
    var canvas = el.querySelector("canvas");
    var nEl = el.querySelector(".ls-md-n"), tempEl = el.querySelector(".ls-md-temp"), kEl = el.querySelector(".ls-md-k");
    var readout = el.querySelector(".ls-meadow-readout");
    var caption = el.querySelector(".ls-meadow-caption");
    var ctx = null, size = null, N = 20, T = 0.8, K = 5;
    var modeMix = 0, modeTarget = 0, modeTimer = 0;
    var anchors = [], fieldCache = {}, gapFrac = 0, pointer = { x: CW / 2, y: CH / 2 };
    var clamp = api.util.clamp;
    function hexToRgb(hex) {
      var h = String(hex || "").replace("#", "");
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
    }
    function palette() {
      var c = api.colors();
      return {
        dark: c.dark || (document.documentElement.getAttribute("data-theme") === "dark"),
        surface: hexToRgb(c.paper),
        card: hexToRgb(c.paper2),
        ink: hexToRgb(c.ink),
        muted: hexToRgb(c.muted),
        border: hexToRgb(c.lineStrong || c.line),
        edge: hexToRgb(c.soft),
        gold: hexToRgb(c.gold),
        thought: hexToRgb(c.green),
        thoughtFill: "rgba(99,164,75,.13)"
      };
    }
    function mulberry32(a) {
      return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        var t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    function smoothstep(a, b, t) {
      if (a === b) return t < a ? 0 : 1;
      t = clamp((t - a) / (b - a), 0, 1);
      return t * t * (3 - 2 * t);
    }
    function mix(c1, c2, t) {
      return [Math.round(c1[0] + (c2[0] - c1[0]) * t), Math.round(c1[1] + (c2[1] - c1[1]) * t), Math.round(c1[2] + (c2[2] - c1[2]) * t)];
    }
    function rgb(c) { return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"; }
    function hsl(h, s2, l2) {
      s2 /= 100; l2 /= 100;
      var k = function (n) { return (n + h / 30) % 12; };
      var a = s2 * Math.min(l2, 1 - l2);
      var f = function (n) { return l2 - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
      return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
    }
    function gen2D(n) {
      var rng = mulberry32(7 + n * 13);
      var cols = Math.ceil(Math.sqrt(n * CW / CH));
      var rows = Math.ceil(n / cols);
      var pts = [];
      for (var i = 0; i < n; i++) {
        var cx = i % cols;
        var cy = Math.floor(i / cols);
        var jx = (rng() - 0.5) * 0.72;
        var jy = (rng() - 0.5) * 0.72;
        pts.push({
          x: clamp((cx + 0.3 + jx) / cols * CW, 26, CW - 26),
          y: clamp((cy + 0.3 + jy) / rows * CH, 26, CH - 26),
          w: WORDS[i % WORDS.length],
          c: HUES[i % HUES.length],
          i: i
        });
      }
      return pts;
    }
    function scaleFor(a) { return Math.sqrt(CW * CH / Math.max(1, a.length)) * 0.52; }
    function nearestTwo(x, y, a) {
      var d1 = 1e18, d2 = 1e18, i1 = 0;
      for (var i = 0; i < a.length; i++) {
        var dx = x - a[i].x, dy = y - a[i].y, d = dx * dx + dy * dy;
        if (d < d1) { d2 = d1; i1 = i; d1 = d; } else if (d < d2) { d2 = d; }
      }
      return { i1: i1, d1: Math.sqrt(d1), d2: Math.sqrt(d2), m: Math.sqrt(d2) - Math.sqrt(d1) };
    }
    function colorFor(m, idx, pal, scale, arr) {
      var q = clamp(m / scale, 0, 1);
      var col = hsl(arr[idx].c, 34 + 16 * q, pal.dark ? 28 + 16 * q : 64 + 16 * q);
      var eps = 0.32 * scale;
      var edgePx = 4.8;
      if (m < eps) col = mix(col, pal.gold, 0.55 * (1 - smoothstep(edgePx, eps, m)));
      if (m < edgePx) col = mix(pal.edge, col, smoothstep(0, edgePx * 0.75, m));
      return col;
    }
    function makeField(n, pal) {
      var a = gen2D(n);
      var scale = scaleFor(a);
      var c = document.createElement("canvas");
      c.width = CW; c.height = CH;
      var cctx = c.getContext("2d");
      var img = cctx.createImageData(CW, CH);
      var cnt = 0, eps = 0.32 * scale;
      for (var y = 0; y < CH; y++) {
        for (var x = 0; x < CW; x++) {
          var n2 = nearestTwo(x, y, a);
          var col = colorFor(n2.m, n2.i1, pal, scale, a);
          var p = (y * CW + x) * 4;
          img.data[p] = col[0]; img.data[p + 1] = col[1]; img.data[p + 2] = col[2]; img.data[p + 3] = 255;
          if (n2.m < eps) cnt++;
        }
      }
      cctx.putImageData(img, 0, 0);
      return { canvas: c, gapFrac: cnt / (CW * CH) };
    }
    function fieldKey(n, pal) { return n + "|" + (pal.dark ? "d" : "l"); }
    function ensureField(n, pal) {
      var key = fieldKey(n, pal);
      if (!fieldCache[key]) fieldCache[key] = makeField(n, pal);
      return fieldCache[key];
    }
    function setN(n) { N = n; anchors = gen2D(n); gapFrac = ensureField(n, palette()).gapFrac; }
    function roundRect(g, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    }
    function drawWordPins(g, sx, sy, pal) {
      var n = anchors.length;
      var scale = clamp(sx * CW / 560, 0.8, 1.35);
      var fs = (n <= 20 ? 11 : n <= 30 ? 9.5 : 8.5) * scale;
      for (var i = 0; i < n; i++) {
        var a = anchors[i];
        var ax = a.x * sx, ay = a.y * sy;
        var r = 6 * scale;
        g.save();
        g.shadowColor = "rgba(0,0,0,.18)"; g.shadowBlur = 6; g.shadowOffsetY = 1;
        g.beginPath(); g.arc(ax, ay, r, 0, Math.PI * 2);
        g.fillStyle = rgb(pal.surface); g.fill();
        g.restore();
        g.beginPath(); g.arc(ax, ay, r, 0, Math.PI * 2);
        g.strokeStyle = rgb(pal.ink); g.globalAlpha = 0.55; g.lineWidth = 1.5; g.stroke();
        g.globalAlpha = 1;
        var ly = ay + r + 5;
        g.font = "600 " + fs + "px 'Open Sans', sans-serif";
        g.textAlign = "center"; g.textBaseline = "top";
        var tw = g.measureText(a.w).width;
        g.globalAlpha = 0.88;
        g.fillStyle = rgb(pal.surface);
        g.fillRect(ax - tw / 2 - 3, ly - 2, tw + 6, fs + 5);
        g.globalAlpha = 1;
        g.fillStyle = rgb(pal.ink);
        g.fillText(a.w, ax, ly + 1);
      }
    }
    function drawThought(g, w, h, pal) {
      var scale = scaleFor(anchors);
      var px = clamp(pointer.x, 0, CW - 1), py = clamp(pointer.y, 0, CH - 1);
      var mx = px * w / CW, my = py * h / CH;
      var radiusPx = T * scale * 1.2 * (w / CW);
      g.beginPath(); g.arc(mx, my, radiusPx, 0, Math.PI * 2);
      g.strokeStyle = rgb(pal.thought); g.globalAlpha = 0.55; g.lineWidth = 2; g.setLineDash([6, 4]); g.stroke(); g.setLineDash([]);
      g.globalAlpha = 1; g.fillStyle = pal.thoughtFill; g.fill();
      var allD = [];
      for (var i = 0; i < anchors.length; i++) allD.push({ i: i, d: Math.hypot(anchors[i].x - px, anchors[i].y - py) });
      allD.sort(function (a, b) { return a.d - b.d; });
      var near = allD.slice(0, Math.min(K, allD.length));
      var sigma = Math.max(1e-6, T * scale * 0.5);
      var scores = near.map(function (cd) { return { i: cd.i, d: cd.d, s: Math.exp(-cd.d / sigma) }; });
      var sum = scores.reduce(function (a, b) { return a + b.s; }, 0) || 1;
      var panelW = Math.min(190, w * 0.46);
      var rowH = 22;
      var panelH = near.length * rowH + 24;
      var right = mx + radiusPx + 16;
      var panelX = (right + panelW > w - 8) ? clamp(mx - radiusPx - panelW - 16, 4, w - panelW - 8) : clamp(right, 4, w - panelW - 8);
      var panelY = clamp(my - panelH / 2, 8, h - panelH - 8);
      g.globalAlpha = 0.96;
      g.fillStyle = rgb(pal.surface);
      g.fillRect(panelX, panelY, panelW, panelH);
      g.globalAlpha = 1;
      g.strokeStyle = rgb(pal.border); g.lineWidth = 1; g.strokeRect(panelX, panelY, panelW, panelH);
      g.font = "700 9px 'Open Sans', sans-serif"; g.fillStyle = rgb(pal.muted); g.textAlign = "left"; g.textBaseline = "middle";
      g.fillText(DE ? "CHANCEN" : "CHANCES", panelX + 9, panelY + 11);
      var barX = panelX + 64;
      var barMax = panelW - 64 - 42;
      for (var k = 0; k < scores.length; k++) {
        var cd = scores[k];
        var prob = cd.s / sum;
        var rowY = panelY + 28 + k * rowH;
        g.font = (k === 0 ? "700" : "400") + " 11px 'Open Sans', sans-serif";
        g.fillStyle = k === 0 ? rgb(pal.thought) : rgb(pal.ink);
        g.textAlign = "left"; g.fillText(anchors[cd.i].w, panelX + 9, rowY);
        var bw = Math.max(3, prob * barMax);
        g.fillStyle = rgb(pal.border); g.fillRect(barX, rowY - 4, barMax, 8);
        g.fillStyle = k === 0 ? rgb(pal.thought) : rgb(pal.muted); g.globalAlpha = k === 0 ? 1 : 0.5;
        g.fillRect(barX, rowY - 4, bw, 8); g.globalAlpha = 1;
        g.font = "600 9px ui-monospace, monospace"; g.fillStyle = k === 0 ? rgb(pal.thought) : rgb(pal.muted); g.textAlign = "right";
        g.fillText(Math.round(prob * 100) + "%", panelX + panelW - 7, rowY);
      }
      g.beginPath(); g.arc(mx, my, 7, 0, Math.PI * 2); g.fillStyle = rgb(pal.surface); g.fill();
      g.strokeStyle = rgb(pal.thought); g.lineWidth = 2.5; g.stroke();
      var winner = scores[0], runner = scores[1];
      var seamGap = near.length > 1 ? near[1].d - near[0].d : 0;
      if (winner) {
        var winProb = winner.s / sum;
        readout.innerHTML = '<span>' + (DE ? "Nächstes Wort" : "Nearest word") + ' <b>' + api.esc(anchors[winner.i].w) + '</b></span><span>' + (DE ? "Gewinnt mit" : "Wins with") + ' <b>' + Math.round(winProb * 100) + '%</b></span><span>' + (DE ? "Rand" : "margin") + ' <b>' + (seamGap / scale).toFixed(2) + '</b></span><span>' + (DE ? "Mehrdeutig" : "ambiguous") + ' <b>' + Math.round(gapFrac * 100) + '%</b></span>';
        if (seamGap / scale < 0.01) caption.textContent = DE
          ? "Du stehst auf einer goldenen Naht: „" + anchors[winner.i].w + "“ und „" + (runner ? anchors[runner.i].w : "?") + "“ sind fast gleich nah."
          : "You are on a golden seam: “" + anchors[winner.i].w + "” and “" + (runner ? anchors[runner.i].w : "?") + "” are almost equally near.";
        else if (winProb > 0.8) caption.textContent = DE
          ? "Tief in der Zelle von „" + anchors[winner.i].w + "“. Die nächste Naht ist weit weg."
          : "Deep inside the cell of “" + anchors[winner.i].w + "”. The nearest seam is far away.";
        else caption.textContent = DE
          ? "In der Nähe des Territoriums von „" + anchors[winner.i].w + "“, aber „" + (runner ? anchors[runner.i].w : "?") + "“ ist nah."
          : "Near the territory of “" + anchors[winner.i].w + "”, but “" + (runner ? anchors[runner.i].w : "?") + "” is close.";
      }
      canvas.setAttribute("aria-label", DE ? "Wörterfeld. Nächstes Wort: " + (winner ? anchors[winner.i].w : "") : "Word field. Nearest word: " + (winner ? anchors[winner.i].w : ""));
    }
    function drawMeadowLandscape(g, w, h, pal) {
      var scale = scaleFor(anchors);
      var yaw = -0.55, pitch = 0.92;
      function norm(a) { return { x: a.x / CW * 2 - 1, y: (1 - a.y / CH) * 1.8 - 0.9 }; }
      function raw(x, y, z) {
        var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
        var x1 = x * cy - y * sy;
        var y1 = x * sy + y * cy;
        var y2 = y1 * cp + z * sp;
        var z2 = y1 * sp + z * cp;
        return { x: x1, y: -y2, z: z2 };
      }
      var NX = 32, NY = 22, grid = [];
      var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      function include(p) { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; }
      for (var i = 0; i <= NX; i++) {
        grid[i] = [];
        for (var j = 0; j <= NY; j++) {
          var nx = -1 + 2 * i / NX, ny = -0.9 + 1.8 * j / NY;
          var mx = (nx + 1) / 2 * CW;
          var my = (1 - (ny + 0.9) / 1.8) * CH;
          var n2 = nearestTwo(mx, my, anchors);
          var p = 1 - clamp(n2.m / scale, 0, 1);
          var z = 0.06 + 0.9 * p;
          var rp = raw(nx, ny, z);
          grid[i][j] = { x: nx, y: ny, p: p, rx: rp.x, ry: rp.y, rz: rp.z };
          include(rp);
        }
      }
      [[-1, -0.9], [1, -0.9], [1, 0.9], [-1, 0.9]].forEach(function (c) { include(raw(c[0], c[1], 1.05)); });
      var pad = Math.min(w, h) * 0.08;
      var sc = Math.min((w - pad * 2) / Math.max(0.001, maxX - minX), (h - pad * 2) / Math.max(0.001, maxY - minY));
      var ox = w / 2 - (minX + maxX) / 2 * sc;
      var oy = h / 2 - (minY + maxY) / 2 * sc;
      function sx2(v) { return v * sc + ox; }
      function sy2(v) { return v * sc + oy; }
      g.save();
      g.globalAlpha = modeMix;
      g.fillStyle = rgb(pal.surface);
      g.fillRect(0, 0, w, h);
      var quads = [];
      for (var qi = 0; qi < NX; qi++) {
        for (var qj = 0; qj < NY; qj++) {
          var a = grid[qi][qj], b = grid[qi + 1][qj], c = grid[qi + 1][qj + 1], d = grid[qi][qj + 1];
          quads.push({ p: [a, b, c, d], pv: (a.p + b.p + c.p + d.p) / 4, z: (a.rz + b.rz + c.rz + d.rz) / 4 });
        }
      }
      quads.sort(function (a, b) { return a.z - b.z; });
      quads.forEach(function (q) {
        g.beginPath();
        g.moveTo(sx2(q.p[0].rx), sy2(q.p[0].ry));
        g.lineTo(sx2(q.p[1].rx), sy2(q.p[1].ry));
        g.lineTo(sx2(q.p[2].rx), sy2(q.p[2].ry));
        g.lineTo(sx2(q.p[3].rx), sy2(q.p[3].ry));
        g.closePath();
        g.fillStyle = q.pv > 0.72 ? rgb(pal.thought) : q.pv > 0.46 ? "#869b55" : q.pv > 0.24 ? "#5c9baf" : rgb(pal.card);
        g.globalAlpha = modeMix * 0.9;
        g.fill();
        g.globalAlpha = modeMix * 0.12;
        g.strokeStyle = rgb(pal.surface);
        g.lineWidth = 0.5;
        g.stroke();
        g.globalAlpha = modeMix;
      });
      var plane = [[-1, -0.9], [1, -0.9], [1, 0.9], [-1, 0.9]].map(function (c) { var p = raw(c[0], c[1], 1.05); return { x: sx2(p.x), y: sy2(p.y) }; });
      g.beginPath(); g.moveTo(plane[0].x, plane[0].y);
      for (var pi = 1; pi < plane.length; pi++) g.lineTo(plane[pi].x, plane[pi].y);
      g.closePath(); g.globalAlpha = modeMix * 0.28; g.strokeStyle = rgb(pal.border); g.lineWidth = 1; g.stroke();
      anchors.forEach(function (a) {
        var na = norm(a);
        var pp = raw(na.x, na.y, 1.05);
        var sp = raw(na.x, na.y, 0.96);
        g.globalAlpha = modeMix * 0.5;
        g.strokeStyle = rgb(pal.thought); g.setLineDash([3, 3]); g.lineWidth = 1;
        g.beginPath(); g.moveTo(sx2(pp.x), sy2(pp.y)); g.lineTo(sx2(sp.x), sy2(sp.y)); g.stroke(); g.setLineDash([]);
        g.globalAlpha = modeMix;
        g.fillStyle = rgb(pal.surface); g.strokeStyle = rgb(pal.thought); g.lineWidth = 1.4;
        g.beginPath(); g.arc(sx2(pp.x), sy2(pp.y), 3, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = rgb(pal.ink);
        g.font = "600 " + api.font("canvas-sm") + "px 'Open Sans', sans-serif";
        g.textAlign = "center";
        g.fillText(a.w, sx2(pp.x), sy2(pp.y) - 8);
      });
      g.fillStyle = rgb(pal.muted);
      g.font = "600 " + api.font("canvas-sm") + "px 'Open Sans', sans-serif";
      g.textAlign = "left";
      g.fillText(DE ? "Wiese → Landschaft · Höhe = Nähe" : "meadow → landscape · height = closeness", 10, 16);
      g.restore();
      g.globalAlpha = 1;
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var pal = palette();
      var f = ensureField(N, pal);
      gapFrac = f.gapFrac;
      ctx.clearRect(0, 0, size.w, size.h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(f.canvas, 0, 0, size.w, size.h);
      drawWordPins(ctx, size.w / CW, size.h / CH, pal);
      drawThought(ctx, size.w, size.h, pal);
      if (modeMix > 0.01) {
        drawMeadowLandscape(ctx, size.w, size.h, pal);
        if (modeMix > 0.5) {
          readout.innerHTML = '<span>' + (DE ? "Landschaft" : "landscape") + ' <b>' + (DE ? "Höhe = Nähe" : "height = closeness") + '</b></span><span>' + (DE ? "Wörter auf der Token-Ebene" : "words on the token plane") + '</span>';
          caption.textContent = DE ? "Dieselben Wörter, jetzt als Wahrscheinlichkeitslandschaft: Jedes Wort ist ein Gipfel, die Täler dazwischen sind unsicher." : "The same words as a probability landscape: every word is a peak, the valleys between them are uncertain.";
        }
      }
      nEl.nextElementSibling.textContent = N;
      tempEl.nextElementSibling.textContent = T.toFixed(2);
      kEl.nextElementSibling.textContent = K;
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    function move(e) {
      var r = canvas.getBoundingClientRect();
      pointer.x = clamp((e.clientX - r.left) / r.width * CW, 0, CW - 1);
      pointer.y = clamp((e.clientY - r.top) / r.height * CH, 0, CH - 1);
      draw();
    }
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerdown", move);
    nEl.addEventListener("input", function () { setN(parseInt(nEl.value, 10) || 12); draw(); });
    tempEl.addEventListener("input", function () { T = clamp(parseFloat(tempEl.value) || 0.8, 0.2, 2.6); draw(); });
    kEl.addEventListener("input", function () { K = clamp(parseInt(kEl.value, 10) || 5, 1, 10); draw(); });
    var landscapeBtn = el.querySelector(".ls-md-landscape");
    function animateMode() {
      modeMix += (modeTarget - modeMix) * 0.22;
      if (Math.abs(modeTarget - modeMix) < 0.02) modeMix = modeTarget;
      draw();
      if (modeMix !== modeTarget) modeTimer = setTimeout(animateMode, 16);
    }
    landscapeBtn.addEventListener("click", function () {
      modeTarget = modeTarget ? 0 : 1;
      el.setAttribute("data-landscape", String(modeTarget));
      if (modeTimer) clearTimeout(modeTimer);
      animateMode();
    });
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { fieldCache = {}; setN(N); draw(); });
    setN(N);
    resize();
    return { update: function () {}, resize: resize, destroy: function () { window.removeEventListener("resize", resize); el.remove(); } };
  }

  function softmaxScene(root, api) {
    var DE = api.lang === "de";
    var PROMPTS = {
      spaceship: {
        text: "“As the spaceship was approaching <b>the</b>”",
        rows: [
          { token: "planet", logit: -92.8636474609375 }, { token: "surface", logit: -94.18270874023438 },
          { token: "station", logit: -94.41707611083984 }, { token: "moon", logit: -94.45668029785156 },
          { token: "Earth", logit: -94.46949005126953 }, { token: "end", logit: -94.54924774169922 },
          { token: "ship", logit: -94.74138641357422 }, { token: "edge", logit: -94.87800598144531 },
          { token: "star", logit: -94.9022216796875 }, { token: "asteroid", logit: -94.97351837158203 }
        ]
      },
      planet: {
        text: "“On the deserted planet they discovered <b>a</b>”",
        rows: [
          { token: "strange", logit: -89.01858520507812 }, { token: "mysterious", logit: -89.26126861572266 },
          { token: "planet", logit: -89.26339721679688 }, { token: "large", logit: -89.2662124633789 },
          { token: "massive", logit: -89.29888916015625 }, { token: "small", logit: -89.4354476928711 },
          { token: "new", logit: -89.59513092041016 }, { token: "vast", logit: -89.6324462890625 },
          { token: "huge", logit: -89.85299682617188 }, { token: "giant", logit: -90.060302734375 }
        ]
      }
    };
    var el = document.createElement("div");
    el.className = "ls-softmax-scene";
    el.innerHTML = '<div class="ls-scene-row ls-softmax-prompts"></div><p class="softmax-context"><span class="softmax-context-label">' + (DE ? "Kontext · echte GPT-2-Logits (englisch)" : "context · real GPT-2 logits (English)") + '</span> <span class="ls-softmax-context"></span></p><div class="softmax-stage"><div class="softmax-col softmax-col--logits"><div class="softmax-col-head"><span>Token</span><span>Logit</span></div><div data-logits></div></div><svg class="softmax-ribbons" data-ribbons aria-hidden="true"><defs><linearGradient id="softmax-ribbon-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#63a44b"></stop><stop offset="100%" stop-color="#009299"></stop></linearGradient></defs></svg><div class="softmax-col softmax-col--probs"><div class="softmax-col-head"><span>' + (DE ? "Wahrscheinlichkeit" : "probability") + '</span><span>Softmax</span></div><div data-probs></div></div></div><div class="ls-scene-row"><label class="ls-range">T <input type="range" class="ls-sm-temp" min="0.2" max="2" step="0.05" value="1"><output>1.00</output></label></div><div class="ls-sm-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var prompts = el.querySelector(".ls-softmax-prompts");
    var contextEl = el.querySelector(".ls-softmax-context");
    var logitsEl = el.querySelector("[data-logits]");
    var probsEl = el.querySelector("[data-probs]");
    var ribbons = el.querySelector("[data-ribbons]");
    var tempEl = el.querySelector(".ls-sm-temp");
    var readout = el.querySelector(".ls-sm-readout");
    var state = { key: "spaceship", temp: 1, hovered: 0 };
    var pathEls = [];
    function calc() {
      var rows = PROMPTS[state.key].rows;
      var logits = rows.map(function (r) { return r.logit; });
      var max = Math.max.apply(null, logits);
      var ex = logits.map(function (v) { return Math.exp((v - max) / state.temp); });
      var sum = ex.reduce(function (a, b) { return a + b; }, 0);
      return { ex: ex, sum: sum, probs: ex.map(function (e) { return e / sum; }), max: max, min: Math.min.apply(null, logits) };
    }
    function build() {
      var rows = PROMPTS[state.key].rows;
      var c = calc();
      contextEl.innerHTML = PROMPTS[state.key].text;
      logitsEl.innerHTML = "";
      probsEl.innerHTML = "";
      rows.forEach(function (r, i) {
        var lrow = document.createElement("div");
        lrow.className = "softmax-row";
        lrow.setAttribute("tabindex", "0");
        var l1 = document.createElement("span"); l1.className = "softmax-row-label"; l1.textContent = r.token;
        var b1 = document.createElement("span"); b1.className = "softmax-bar"; var f1 = document.createElement("i"); b1.appendChild(f1);
        var v1 = document.createElement("span"); v1.className = "softmax-value"; v1.textContent = r.logit.toFixed(1);
        lrow.appendChild(l1); lrow.appendChild(b1); lrow.appendChild(v1);
        var prow = document.createElement("div");
        prow.className = "softmax-row";
        var v2 = document.createElement("span"); v2.className = "softmax-value"; v2.textContent = (c.probs[i] * 100).toFixed(1) + "%";
        var b2 = document.createElement("span"); b2.className = "softmax-bar"; var f2 = document.createElement("i"); b2.appendChild(f2);
        var l2 = document.createElement("span"); l2.className = "softmax-row-label"; l2.textContent = r.token;
        prow.appendChild(v2); prow.appendChild(b2); prow.appendChild(l2);
        var lt = (r.logit - c.min) / Math.max(0.001, c.max - c.min);
        f1.style.width = (12 + lt * 88).toFixed(1) + "%";
        f2.style.width = Math.max(1, c.probs[i] / Math.max.apply(null, c.probs) * 100).toFixed(1) + "%";
        function hover() {
          state.hovered = i;
          el.querySelectorAll(".softmax-row").forEach(function (x) { x.classList.remove("is-hot"); });
          lrow.classList.add("is-hot"); prow.classList.add("is-hot");
          pathEls.forEach(function (p, k) { if (p) p.classList.toggle("is-hot", k === i); });
          readout.innerHTML = '<span>Token <b>' + api.esc(r.token) + '</b></span><span>Logit <b>' + r.logit.toFixed(2) + '</b></span><span>exp((logit − max)/T) <b>' + c.ex[i].toFixed(4) + '</b></span><span>p <b>' + (c.probs[i] * 100).toFixed(2) + '%</b></span>';
        }
        lrow.addEventListener("mouseenter", hover); lrow.addEventListener("focus", hover);
        prow.addEventListener("mouseenter", hover); prow.addEventListener("focus", hover);
        logitsEl.appendChild(lrow); probsEl.appendChild(prow);
      });
      updateRibbons();
    }
    function updateRibbons() {
      var stage = el.querySelector(".softmax-stage");
      var sr = stage.getBoundingClientRect();
      ribbons.setAttribute("viewBox", "0 0 " + sr.width + " " + sr.height);
      var defs = '<defs><linearGradient id="softmax-ribbon-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#63a44b"></stop><stop offset="100%" stop-color="#009299"></stop></linearGradient></defs>';
      ribbons.innerHTML = defs;
      pathEls = [];
      var ls = logitsEl.querySelectorAll(".softmax-row");
      var ps = probsEl.querySelectorAll(".softmax-row");
      ls.forEach(function (l, i) {
        if (!ps[i]) return;
        var a = l.getBoundingClientRect(), b = ps[i].getBoundingClientRect();
        var x1 = a.right - sr.left, y1 = a.top + a.height / 2 - sr.top;
        var x2 = b.left - sr.left, y2 = b.top + b.height / 2 - sr.top;
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        var mx = (x1 + x2) / 2;
        path.setAttribute("d", "M" + x1 + "," + y1 + " C" + mx + "," + y1 + " " + mx + "," + y2 + " " + x2 + "," + y2);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-width", "1");
        ribbons.appendChild(path);
        pathEls[i] = path;
      });
    }
    Object.keys(PROMPTS).forEach(function (key) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-chip" + (key === state.key ? " is-on" : "");
      b.textContent = key === "spaceship" ? (DE ? "Raumschiff" : "spaceship") : (DE ? "verlassener Planet" : "deserted planet");
      b.addEventListener("click", function () {
        state.key = key;
        prompts.querySelectorAll(".ls-chip").forEach(function (x) { x.classList.toggle("is-on", x === b); });
        build();
      });
      prompts.appendChild(b);
    });
    tempEl.addEventListener("input", function () {
      state.temp = parseFloat(tempEl.value) || 1;
      tempEl.nextElementSibling.textContent = state.temp.toFixed(2);
      build();
    });
    window.addEventListener("resize", updateRibbons);
    build();
    return { update: function () {}, resize: updateRibbons, destroy: function () { window.removeEventListener("resize", updateRibbons); el.remove(); } };
  }

  function highdimScene(root, api) {
    var DE = api.lang === "de";
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
      var cells = '';
      for (var k = 0; k < cols; k++) cells += '<td>' + value(ti, k) + '</td>';
      return '<tr><th>' + api.esc(tok) + '</th>' + cells + '<td>…</td></tr>';
    }).join("");
    var el = document.createElement("div");
    el.className = "ls-highdim-scene";
    el.innerHTML =
      '<div class="ls-highdim-note">' + (DE ? "Ausschnitt: 16 von 4096 Dimensionen. Jede Zeile ist ein Vektor, jede Spalte eine Dimension." : "Slice: 16 of 4096 dimensions. Each row is a vector, each column a dimension.") + '</div>' +
      '<div class="ls-highdim-scroll"><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
      '<p class="ls-highdim-foot">' + (DE ? "Auch wenn wir uns 4096 Dimensionen nicht mehr vorstellen können: Es gelten dieselben Regeln. Mittelpunkt, Winkel und Matrixmultiplikation funktionieren koordinatenweise weiter. Nur die Zahl der Koordinaten wächst, und hier passen viel mehr unabhängige Beziehungen hinein als in zwei oder drei Dimensionen." : "Even though we cannot picture 4096 dimensions, the same rules apply. Midpoint, angle, and matrix multiplication still work coordinate by coordinate. Only the number of coordinates grows, and there is room for many more independent relations than in two or three dimensions.") + '</p>';
    root.appendChild(el);
    return { update: function () {}, resize: function () {}, destroy: function () { el.remove(); } };
  }

  function manifoldScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-manifold-scene";
    el.innerHTML = '<div class="ls-dual-manifolds"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<p class="ls-vr-note">' + (DE ? "Vietoris–Rips: zwei Punkte sind verbunden, wenn ihr Abstand unter der Schwelle liegt. Die Form entsteht aus den Punkten, nicht aus einer Fläche." : "Vietoris–Rips: two points are connected when their distance is below the threshold. The shape comes from the points, not from a surface.") + '</p>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-dual-manifolds");
    var canvas = el.querySelector("canvas");
    var C = api.colors();
    var size = null, yaw = -0.58, pitch = 0.42, zoom = 1, drag = null;
    var radius = 0.62;
    function rng(seed) {
      return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    function cloud(seed, cx, flip) {
      var r = rng(seed), pts = [];
      for (var i = 0; i < 26; i++) {
        var u = r() * 2 - 1, v = r() * 2 - 1;
        if (u * u + v * v > 1) { i--; continue; }
        var z = 0.22 * Math.sin(2.2 * u + 0.7) + 0.16 * Math.cos(2.4 * v - 0.5);
        if (flip) z = -z * 0.9 + 0.16 * u * v;
        pts.push({ p: [cx + u * 1.18, v * 0.72, z], u: u, v: v });
      }
      return pts;
    }
    var en = cloud(11, -0.84, false);
    var jp = cloud(29, 0.84, true);
    var labels = [
      { a: 4, b: 3, ea: "bank", eb: "銀行" },
      { a: 11, b: 9, ea: "river", eb: "川" },
      { a: 18, b: 17, ea: "money", eb: "お金" }
    ];
    function project(p) {
      var x = p[0], y = p[1], z = p[2];
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var x1 = x * cy - y * sy, y1 = x * sy + y * cy;
      var y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;
      var s = Math.min(size.w * 0.44, size.h * 0.46) / (1 + z2 * 0.22) * zoom;
      return { x: size.w / 2 + x1 * s, y: size.h / 2 - y2 * s, z: z2 };
    }
    function edgeSet(pts) {
      var out = [];
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var a = pts[i].p, b = pts[j].p;
          if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) <= radius) out.push({ a: a, b: b, z: (a[2] + b[2]) / 2 });
        }
      }
      return out;
    }
    function drawCloud(ctx, pts, edges, col) {
      edges.sort(function (a, b) { return a.z - b.z; });
      edges.forEach(function (e) {
        var a = project(e.a), b = project(e.b);
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.10 + 0.26 * (1 - (e.z + 1) / 2);
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      var ps = pts.map(function (q) { return { p: q.p, q: project(q.p) }; }).sort(function (a, b) { return a.q.z - b.q.z; });
      ps.forEach(function (o) {
        ctx.beginPath(); ctx.arc(o.q.x, o.q.y, 3.1, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();
        ctx.strokeStyle = C.paper; ctx.lineWidth = 1; ctx.stroke();
      });
    }
    function drawLabels(ctx) {
      labels.forEach(function (l) {
        var pe = en[l.a], pj = jp[l.b];
        if (!pe || !pj) return;
        var a = project(pe.p), b = project(pj.p);
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = C.gold;
        ctx.globalAlpha = 0.72;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = C.ink;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(l.ea, a.x, a.y - 8);
        ctx.fillText(l.eb, b.x, b.y - 8);
      });
    }
    function draw() {
      if (!size) return;
      var ctx = size.ctx, w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      var bg = ctx.createRadialGradient(w * 0.5, h * 0.42, 8, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
      bg.addColorStop(0, "rgba(247,250,249,.92)");
      bg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      var enE = edgeSet(en), jpE = edgeSet(jp);
      drawCloud(ctx, en, enE, C.blue);
      drawCloud(ctx, jp, jpE, C.green);
      drawLabels(ctx);
      ctx.fillStyle = C.muted; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left"; ctx.fillText(DE ? "Englisch" : "English", 12, 18);
      ctx.textAlign = "right"; ctx.fillStyle = C.muted; ctx.fillText(DE ? "Japanisch" : "Japanese", w - 12, 18);
      canvas.setAttribute("aria-label", DE
        ? "Zwei Punktwolken mit Vietoris–Rips-Kanten: englische Wörter links, japanische rechts, Korrespondenzen als gestrichelte Linien."
        : "Two point clouds with Vietoris–Rips edges: English words left, Japanese right, correspondences as dashed lines.");
    }
    function resize() {
      size = api.fit(canvas, stage);
      draw();
    }
    canvas.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", function (e) {
      if (!drag) return;
      yaw += (e.clientX - drag.x) * 0.008;
      pitch = Math.max(-1.2, Math.min(1.2, pitch + (e.clientY - drag.y) * 0.006));
      drag = { x: e.clientX, y: e.clientY };
      draw();
    });
    canvas.addEventListener("pointerup", function () { drag = null; });
    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      zoom = Math.max(0.6, Math.min(2.1, zoom * (e.deltaY > 0 ? 0.94 : 1.06)));
      draw();
    }, { passive: false });
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    return {
      update: function () {},
      resize: resize,
      destroy: function () { window.removeEventListener("resize", resize); el.remove(); }
    };
  }

  function mlpScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-mlp-scene";
    el.innerHTML =
      '<div class="ism-panel">' +
        '<div id="ism-copy" class="ism-copy" aria-live="polite"><div id="ism-title" class="ism-title"></div><div id="ism-body" class="ism-body"></div></div>' +
        '<div id="ism-dense-controls" class="ism-dense-controls" hidden></div>' +
        '<div class="ism-stage" id="ism-stage"><div id="ism-wrap" class="ism-wrap">' +
          '<canvas id="ism-canvas" style="display:block;width:100%;height:100%" aria-label="' + (DE ? "Eine Punktwolke: ein Kern in einem Ring wird angehoben, bis eine flache Ebene trennt" : "A point cloud: a core inside a ring is lifted until a flat plane separates them") + '"></canvas>' +
          '<div id="ism-canvas-status" class="ism-canvas-status" aria-live="polite" hidden></div>' +
        '</div><aside id="ism-side" class="ism-side"><div id="ism-formulas" class="ism-formulas" aria-live="polite"></div></aside></div>' +
        '<div class="ism-controls"><button type="button" id="ism-prev" class="ism-btn ism-btn--nav">← ' + (DE ? "Zurück" : "Back") + '</button><button type="button" id="ism-next" class="ism-btn ism-btn--nav" disabled>' + (DE ? "Weiter" : "Next") + ' →</button><button type="button" id="ism-reset-camera" class="ism-btn" aria-label="' + (DE ? "Ansicht zurücksetzen" : "Reset view") + '" title="' + (DE ? "Ansicht zurücksetzen" : "Reset view") + '">⟲</button><div id="ism-dots" class="ism-dots" role="group" aria-label="' + (DE ? "Folien" : "Slides") + '"></div><span id="ism-counter" class="ism-counter">1 / 9</span></div>' +
      '</div>';
    root.appendChild(el);
    var started = false;
    function init() {
      if (started) return;
      if (!window.IntuitionSpaceMorph) { setTimeout(init, 100); return; }
      started = true;
      try { window.IntuitionSpaceMorph.init(); } catch (e) {}
    }
    setTimeout(init, 30);
    return {
      update: function () {},
      next: function () {
        var st = window.IntuitionSpaceMorph && window.IntuitionSpaceMorph.state ? window.IntuitionSpaceMorph.state() : null;
        if (!st || st.cur >= st.count - 1) return false;
        window.IntuitionSpaceMorph.next();
        return true;
      },
      prev: function () {
        var st = window.IntuitionSpaceMorph && window.IntuitionSpaceMorph.state ? window.IntuitionSpaceMorph.state() : null;
        if (!st || st.cur <= 0) return false;
        window.IntuitionSpaceMorph.prev();
        return true;
      },
      resize: function () { if (window.IntuitionSpaceMorph && window.IntuitionSpaceMorph.resize) window.IntuitionSpaceMorph.resize(); },
      onKey: function (e) {
        var st = window.IntuitionSpaceMorph && window.IntuitionSpaceMorph.state ? window.IntuitionSpaceMorph.state() : null;
        if (!st) return false;
        if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
          if (st.cur < st.count - 1) { window.IntuitionSpaceMorph.next(); return true; }
          return false;
        }
        if (e.key === "ArrowLeft" || e.key === "PageUp") {
          if (st.cur > 0) { window.IntuitionSpaceMorph.prev(); return true; }
          return false;
        }
        return false;
      },
      destroy: function () { el.remove(); }
    };
  }

  function trajectoriesScene(root, api) {
    var DE = api.lang === "de";
    var data = window.TM_GPT2_DATA;
    var el = document.createElement("div");
    el.className = "ls-traj-scene";
    el.innerHTML = '<div class="ls-traj-plot" role="img"><canvas class="ls-canvas"></canvas></div>' +
      '<div class="ls-scene-row"><label class="ls-range">Layer <input type="range" class="ls-traj-layer" min="0" max="12" step="1" value="0"><output>Embedding</output></label><div class="ls-scene-row ls-traj-metric"><button type="button" class="ls-chip is-on" data-metric="angular">' + (DE ? "Winkel / Großkreis" : "Angle / great circle") + '</button><button type="button" class="ls-chip" data-metric="euclid">' + (DE ? "Euklid" : "Euclidean") + '</button></div><button type="button" class="ls-btn ls-btn--tiny ls-traj-next">' + (DE ? "Nächste Schicht →" : "Next layer →") + '</button></div>' +
      '<div class="ls-traj-readout" aria-live="polite"></div>' +
      '<p class="ls-traj-note">' + (DE ? "Standard hier: Winkel / Großkreis. Das ist eine andere Metrik als der gewohnte euklidische Abstand: Das Netz vergleicht am Ende Richtungen, nicht Längen. Deshalb ist der Großkreis hier relevant." : "Default here: angle / great circle. This is a different metric from the usual Euclidean distance: at the end the network compares directions, not lengths. That is why the great circle is relevant here.") + '</p>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-traj-plot");
    var canvas = el.querySelector("canvas");
    var layerEl = el.querySelector(".ls-traj-layer");
    var layerOut = el.querySelector("output");
    var readout = el.querySelector(".ls-traj-readout");
    var layer = 0, layerTarget = 0, displayLayer = 0, layerTween = 0, metric = "angular", yaw = -0.62, pitch = 0.36, zoom = 1, drag = null;
    var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var size = null, ctx = null;
    var C = api.colors();
    var colors = ["green", "sky", "gold", "lilac", "lime"];
    function tokenLabel(t) { return t.replace(/^ /, "␣"); }
    function color(i) { return C[colors[i % colors.length]] || C.petrol; }
    function positions() {
      var pts = data.points;
      if (metric === "euclid") return pts;
      return pts.map(function (token) {
        return token.map(function (p) {
          var len = Math.hypot(p[0], p[1], p[2]) || 1;
          return [p[0] / len, p[1] / len, p[2] / len];
        });
      });
    }
    function landmarks() {
      if (metric === "euclid") return data.landmarks;
      return data.landmarks.map(function (l) {
        var len = Math.hypot(l.value[0], l.value[1], l.value[2]) || 1;
        return { word: l.word, p: l.p, value: [l.value[0] / len, l.value[1] / len, l.value[2] / len] };
      });
    }
    function fitBounds(pts) {
      var min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
      function add(v) { for (var i = 0; i < 3; i++) { if (v[i] < min[i]) min[i] = v[i]; if (v[i] > max[i]) max[i] = v[i]; } }
      pts.forEach(function (tok) { tok.forEach(add); });
      landmarks().forEach(function (l) { add(l.value); });
      var c = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
      var ext = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2], 0.001);
      return { c: c, ext: ext };
    }
    function project(v, b) {
      var x = (v[0] - b.c[0]) / b.ext, y = (v[1] - b.c[1]) / b.ext, z = (v[2] - b.c[2]) / b.ext;
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var x1 = x * cy - y * sy, y1 = x * sy + y * cy;
      var y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;
      var s = Math.min(size.w * 0.40, size.h * 0.40) / (1 + z2 * 0.22) * zoom;
      return { x: size.w / 2 + x1 * s, y: size.h / 2 - y2 * s, z: z2 };
    }
    function drawLabel(x, y, text, col, align) {
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      var tw = ctx.measureText(text).width;
      var pad = 4, h = 15;
      var bx = align === "right" ? x - tw - pad * 2 : x;
      var by = y - h / 2;
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.fillRect(bx, by, tw + pad * 2, h);
      ctx.fillStyle = col;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(text, bx + pad, y + 0.5);
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      var bg = ctx.createRadialGradient(size.w * 0.5, size.h * 0.4, 8, size.w * 0.5, size.h * 0.5, Math.max(size.w, size.h) * 0.75);
      bg.addColorStop(0, "rgba(247,250,249,.9)");
      bg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, size.w, size.h);
      var pts = positions();
      var b = fitBounds(pts);
      // faint PCA axes
      var axes = [
        { v: [1.1, 0, 0], col: C.blue, label: "PC1" },
        { v: [0, 1.1, 0], col: C.green, label: "PC2" },
        { v: [0, 0, 1.1], col: C.gold, label: "PC3" }
      ];
      axes.forEach(function (ax) {
        var o = project([0, 0, 0], b), p = project(ax.v, b);
        ctx.strokeStyle = ax.col; ctx.globalAlpha = 0.22; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = ax.col; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left"; ctx.fillText(ax.label, p.x + 4, p.y - 4);
      });
      // trajectories
      data.tokens.forEach(function (tok, i) {
        var col = color(i);
        var path = pts[i].map(function (p) { return project(p, b); });
        ctx.save();
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.72;
        ctx.lineWidth = 2.4;
        ctx.lineJoin = "round";
        ctx.beginPath();
        path.forEach(function (p, k) { if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 0.55;
        for (var k = 1; k < path.length - 1; k++) {
          ctx.beginPath(); ctx.arc(path[k].x, path[k].y, 1.8, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
        }
        ctx.globalAlpha = 1;
      });
      // current layer markers and labels
      var labelBoxes = [];
      var li = Math.floor(displayLayer), lf = displayLayer - li;
      data.tokens.forEach(function (tok, i) {
        var p0 = pts[i][Math.min(li, pts[i].length - 1)] || pts[i][0];
        var p1 = pts[i][Math.min(li + 1, pts[i].length - 1)] || p0;
        var pv = [p0[0] + (p1[0] - p0[0]) * lf, p0[1] + (p1[1] - p0[1]) * lf, p0[2] + (p1[2] - p0[2]) * lf];
        var p = project(pv, b);
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = color(i); ctx.fill();
        ctx.strokeStyle = C.paper; ctx.lineWidth = 1.5; ctx.stroke();
        var text = tokenLabel(tok);
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        var tw = ctx.measureText(text).width + 8;
        var offsets = [[0, -20], [0, 12], [-tw - 8, -8], [8, -8], [0, -34], [0, 26]];
        var chosen = null;
        for (var oi = 0; oi < offsets.length; oi++) {
          var bx = p.x + offsets[oi][0] - (offsets[oi][0] < 0 ? tw : 0);
          var by = p.y + offsets[oi][1];
          var cand = { x: bx, y: by, w: tw, h: 15 };
          var free = bx >= 3 && by >= 3 && bx + tw <= size.w - 3 && by + 15 <= size.h - 3;
          if (free) {
            for (var li = 0; li < labelBoxes.length; li++) {
              var lb = labelBoxes[li];
              if (!(cand.x + cand.w < lb.x || lb.x + lb.w < cand.x || cand.y + cand.h < lb.y || lb.y + lb.h < cand.y)) { free = false; break; }
            }
          }
          if (free) { chosen = cand; break; }
        }
        if (!chosen) chosen = { x: Math.max(3, Math.min(size.w - tw - 3, p.x - tw / 2)), y: Math.max(3, Math.min(size.h - 18, p.y - 20)), w: tw, h: 15 };
        labelBoxes.push(chosen);
        ctx.fillStyle = "rgba(255,255,255,.88)";
        ctx.fillRect(chosen.x, chosen.y, chosen.w, chosen.h);
        ctx.fillStyle = color(i);
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillText(text, chosen.x + 4, chosen.y + 7.5);
      });
      // candidates at final layer
      if (displayLayer > data.layers.length - 1.05) {
        landmarks().slice(0, 5).forEach(function (l) {
          var p = project(l.value, b);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - 5); ctx.lineTo(p.x + 5, p.y); ctx.lineTo(p.x, p.y + 5); ctx.lineTo(p.x - 5, p.y);
          ctx.closePath(); ctx.fillStyle = C.gold; ctx.fill();
          ctx.strokeStyle = C.paper; ctx.lineWidth = 1; ctx.stroke();
          drawLabel(p.x + 8, p.y - 10, tokenLabel(l.word), C.gold, "left");
        });
      }
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillText((DE ? "Schicht: " : "Layer: ") + (data.layers[Math.round(displayLayer)] || ""), 12, 18);
      ctx.textAlign = "right";
      ctx.fillText(metric === "angular" ? (DE ? "Winkel / Großkreis" : "angle / great circle") : (DE ? "Euklid" : "Euclidean"), size.w - 12, 18);
      canvas.setAttribute("aria-label", DE
        ? "3D-Token-Trajektorien durch GPT-2. Schicht " + (data.layers[Math.round(displayLayer)] || "") + ", Metrik " + (metric === "angular" ? "Winkel" : "Euklid") + "."
        : "3D token trajectories through GPT-2. Layer " + (data.layers[Math.round(displayLayer)] || "") + ", metric " + (metric === "angular" ? "angle" : "Euclid") + ".");
      canvas.__lsTraj = { displayLayer: displayLayer, layerTarget: layerTarget, metric: metric };
    }
    function updateReadout() {
      var cand = layerTarget === data.layers.length - 1
        ? '<span>' + (DE ? "Kandidaten" : "Candidates") + '</span>' + data.top.slice(0, 5).map(function (t) { return '<span><b>' + api.esc(tokenLabel(t.token)) + '</b> ' + (t.p * 100).toFixed(1) + '%</span>'; }).join("")
        : '<span>' + (DE ? "Kandidaten erscheinen in der letzten Schicht." : "Candidates appear at the final layer.") + '</span>';
      readout.innerHTML = '<span>' + (DE ? "Satz" : "Sentence") + ' <b>' + api.esc(data.sentence) + '</b></span><span>' + (DE ? "Schicht" : "Layer") + ' <b>' + Math.round(displayLayer) + ' / ' + (data.layers.length - 1) + '</b></span>' + cand;
      layerOut.textContent = data.layers[layerTarget] || "";
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    function pointer(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function setLayer(v) {
      layerTarget = Math.min(12, Math.max(0, parseInt(v, 10) || 0));
      layerEl.value = String(layerTarget);
      updateReadout();
      if (layerTween) { cancelAnimationFrame(layerTween); layerTween = 0; }
      if (reducedMotion) { displayLayer = layerTarget; draw(); return; }
      var from = displayLayer, start = performance.now(), dur = (api.motion && api.motion.step) || 180;
      function step(now) {
        var t = Math.min(1, (now - start) / dur);
        var e = t * t * (3 - 2 * t);
        displayLayer = from + (layerTarget - from) * e;
        draw();
        if (t < 1) layerTween = requestAnimationFrame(step);
        else layerTween = 0;
      }
      layerTween = requestAnimationFrame(step);
    }
    layerEl.addEventListener("input", function () { setLayer(layerEl.value); });
    el.querySelectorAll("[data-metric]").forEach(function (bt) {
      bt.addEventListener("click", function () {
        metric = bt.getAttribute("data-metric");
        el.querySelectorAll("[data-metric]").forEach(function (x) { x.classList.toggle("is-on", x === bt); });
        if (layerTween) { cancelAnimationFrame(layerTween); layerTween = 0; }
        displayLayer = layerTarget;
        updateReadout(); draw();
      });
    });
    el.querySelector(".ls-traj-next").addEventListener("click", function () { setLayer(layerTarget + 1); });
    canvas.addEventListener("pointerdown", function (e) { drag = pointer(e); });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var p = pointer(e);
      yaw += (p.x - drag.x) * 0.008;
      pitch = Math.min(1.25, Math.max(-1.25, pitch + (p.y - drag.y) * 0.006));
      drag = p;
      draw();
    });
    window.addEventListener("pointerup", function () { drag = null; });
    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      zoom = Math.min(2.2, Math.max(0.55, zoom * (e.deltaY > 0 ? 0.94 : 1.06)));
      draw();
    }, { passive: false });
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    updateReadout();
    resize();
    return {
      update: function () {},
      next: function () { if (layerTarget >= 12) return false; setLayer(layerTarget + 1); return true; },
      prev: function () { if (layerTarget <= 0) return false; setLayer(layerTarget - 1); return true; },
      resize: resize,
      destroy: function () { if (layerTween) cancelAnimationFrame(layerTween); window.removeEventListener("resize", resize); el.remove(); }
    };
  }

  function blocksScene(root, api) {
    var DE = api.lang === "de";
    var blocks = DE ? [
      {
        id: "tokenizer", label: "Tokenizer", short: "Text → Tokens", icon: "T", color: "lime",
        title: "Tokenizer",
        body: "Der Tokenizer nimmt den Text und teilt ihn in kleine Textbausteine auf: Tokens. Das können Wörter, Teilwörter, Leerzeichen, Sonderzeichen oder Codefragmente sein.",
        points: ["Jedes Token bekommt eine ID.", "Die ID ist eine Adresse, keine Bedeutung.", "Seltene Wörter zerfallen oft in mehrere Tokens."]
      },
      {
        id: "embedding", label: "Embedding", short: "Tokens → Vektoren", icon: "E", color: "sky",
        title: "Embedding",
        body: "Das Embedding weist jedem Token einen Punkt in einem hochdimensionalen Raum zu. Der Punkt ist ein Vektor, keine Definition.",
        points: ["Ähnliche Kontexte führen zu ähnlichen Vektoren.", "Die Richtung trägt Bedeutung.", "Die Tabelle wird im Training gelernt."]
      },
      {
        id: "transformer", label: "Transformer-Block", short: "Attention + FFN", icon: "A", color: "green",
        title: "Transformer-Block",
        body: "Der Transformer-Block zerfällt in zwei große Teile: Attention und FFN. Attention setzt jedes Token in Beziehung zu allen Tokens im bisherigen Kontext und verschiebt es. Das FFN faltet die Tokens in einen höheren Raum, trennt Muster und faltet sie zurück.",
        points: ["Attention kontextualisiert über alle sichtbaren Tokens.", "Das FFN arbeitet danach pro Token.", "Die Details kommen in den späteren Demos."],
        sub: [
          { title: "Attention", text: "Jedes Token schaut, wie stark es mit jedem anderen Token zusammenhängt, und nimmt Information auf. So bekommt es seine Bedeutung im Kontext." },
          { title: "FFN", text: "Das Feed-Forward-Netz verschiebt jedes Token einzeln in einen höheren Raum, trennt Muster und projiziert zurück. Das macht die internen Zustände leichter unterscheidbar." }
        ]
      },
      {
        id: "repeat", label: "Wiederholen", short: "viele Blöcke", icon: "↻", color: "gold",
        title: "Wiederholen",
        body: "Attention und FFN werden viele Male hintereinander ausgeführt, teilweise bis hunderte Male. Jeder Block liest denselben laufenden Vektor und schreibt ein Update zurück; nichts wird überschrieben.",
        points: ["Jeder Block hat eigene Gewichte.", "Die Struktur ist gleich, die Parameter nicht.", "Der Kontext wird mit jeder Schicht weiter verfeinert."]
      },
      {
        id: "unembed", label: "Unembedding", short: "Vektor → Verteilung", icon: "U", color: "lilac",
        title: "Unembedding",
        body: "Nach allen Blöcken wird der letzte Vektor mit den Richtungen der Tokens verglichen. Der Winkel entscheidet, welches Token wahrscheinlich ist: je kleiner der Winkel, desto höher die Wahrscheinlichkeit. Softmax macht daraus eine Verteilung, und eines wird gezogen.",
        points: ["Verglichen werden Richtungen, nicht Längen.", "Softmax erzeugt die Wahrscheinlichkeitsverteilung.", "Der absolute Logit-Wert ist willkürlich; nur Unterschiede zählen."]
      }
    ] : [
      {
        id: "tokenizer", label: "Tokenizer", short: "text → tokens", icon: "T", color: "lime",
        title: "Tokenizer",
        body: "The tokenizer takes the text and splits it into small pieces: tokens. They can be words, subwords, spaces, punctuation, or code fragments.",
        points: ["Every token gets an ID.", "The ID is an address, not meaning.", "Rare words often split into several tokens."]
      },
      {
        id: "embedding", label: "Embedding", short: "tokens → vectors", icon: "E", color: "sky",
        title: "Embedding",
        body: "The embedding assigns every token a point in a high-dimensional space. The point is a vector, not a definition.",
        points: ["Similar contexts produce similar vectors.", "Direction carries meaning.", "The table is learned during training."]
      },
      {
        id: "transformer", label: "Transformer block", short: "attention + FFN", icon: "A", color: "green",
        title: "Transformer block",
        body: "The transformer block splits into two large parts: attention and FFN. Attention relates each token to all tokens in the context so far and shifts it. The FFN folds the tokens into a higher space, separates patterns, and folds them back.",
        points: ["Attention contextualises over all visible tokens.", "The FFN then works per token.", "The details come in the later demos."],
        sub: [
          { title: "Attention", text: "Each token checks how strongly it relates to every other token and takes in information. That is how it gets its meaning in context." },
          { title: "FFN", text: "The feed-forward network shifts each token individually into a higher space, separates patterns, and projects back. That makes the internal states easier to distinguish." }
        ]
      },
      {
        id: "repeat", label: "Repeat", short: "many blocks", icon: "↻", color: "gold",
        title: "Repeat",
        body: "Attention and FFN run many times in a row, sometimes hundreds of times. Each block reads the same running vector and writes an update back; nothing is overwritten.",
        points: ["Each block has its own weights.", "The structure is shared, the parameters are not.", "The context is refined with every layer."]
      },
      {
        id: "unembed", label: "Unembedding", short: "vector → distribution", icon: "U", color: "lilac",
        title: "Unembedding",
        body: "After all blocks, the last vector is compared with the directions of the tokens. The angle decides which token is likely: the smaller the angle, the higher the probability. Softmax turns that into a distribution, and one token is drawn.",
        points: ["Directions are compared, not lengths.", "Softmax creates the probability distribution.", "The absolute logit value is arbitrary; only differences matter."]
      }
    ];
    var index = 0;
    var el = document.createElement("div");
    el.className = "ls-blocks-scene";
    el.innerHTML = '<div class="ls-blocks-list" role="list"></div>' +
      '<div class="ls-blocks-detail" aria-live="polite"></div>' +
      '<div class="ls-blocks-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-blocks-prev">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-blocks-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-blocks-next">' + (DE ? "Weiter →" : "Next →") + '</button></div>';
    root.appendChild(el);
    var list = el.querySelector(".ls-blocks-list");
    var detail = el.querySelector(".ls-blocks-detail");
    var progress = el.querySelector(".ls-blocks-progress");
    var prevBtn = el.querySelector(".ls-blocks-prev");
    var nextBtn = el.querySelector(".ls-blocks-next");
    function color(name) { var C = api.colors(); return C[name] || C.petrol; }
    blocks.forEach(function (b, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ls-block-btn" + (i === index ? " is-on" : "");
      btn.setAttribute("data-block", b.id);
      btn.style.setProperty("--block-color", color(b.color));
      btn.innerHTML = '<span class="ls-block-icon">' + api.esc(b.icon) + '</span><span><b>' + api.esc(b.label) + '</b><small>' + api.esc(b.short) + '</small></span>';
      btn.addEventListener("click", function () { setIndex(i); });
      list.appendChild(btn);
    });
    function renderDetail() {
      var b = blocks[index];
      var html = '<div class="ls-blocks-kicker">' + (DE ? "Station " : "Station ") + (index + 1) + ' / ' + blocks.length + '</div>' +
        '<h3 class="ls-blocks-title">' + api.esc(b.title) + '</h3>' +
        '<p class="ls-blocks-body">' + api.esc(b.body) + '</p>' +
        '<ul class="ls-blocks-points">' + b.points.map(function (p) { return '<li>' + api.esc(p) + '</li>'; }).join("") + '</ul>';
      if (b.sub) {
        html += '<div class="ls-block-subgrid">' + b.sub.map(function (s) {
          return '<div class="ls-block-sub"><b>' + api.esc(s.title) + '</b><p>' + api.esc(s.text) + '</p></div>';
        }).join("") + '</div>';
      }
      detail.innerHTML = html;
      progress.textContent = (index + 1) + ' / ' + blocks.length;
      prevBtn.disabled = index === 0;
      nextBtn.textContent = index === blocks.length - 1 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
      list.querySelectorAll(".ls-block-btn").forEach(function (btn, i) {
        btn.classList.toggle("is-on", i === index);
      });
    }
    function setIndex(i) {
      index = Math.max(0, Math.min(blocks.length - 1, i));
      renderDetail();
    }
    function nextInternal() {
      if (index < blocks.length - 1) { setIndex(index + 1); return true; }
      return false;
    }
    function prevInternal() {
      if (index > 0) { setIndex(index - 1); return true; }
      return false;
    }
    function nextStep() {
      if (nextInternal()) return;
      api.goNext();
    }
    function prevStep() {
      if (prevInternal()) return;
      api.goPrev();
    }
    prevBtn.addEventListener("click", prevStep);
    nextBtn.addEventListener("click", nextStep);
    renderDetail();
    return {
      update: function () {},
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) {
        return api.util.arrowKey(e, nextInternal, prevInternal);
      },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }

  function modelScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-model-scene";
    el.innerHTML = '<div class="ls-model-stage"><canvas class="ls-canvas" role="img"></canvas>' +
        '<div class="ls-model-steps" aria-hidden="true">' +
          '<span class="is-active" data-step="data">1 ' + (DE ? "Daten" : "Data") + '</span>' +
          '<span data-step="model">2 ' + (DE ? "Modell" : "Model") + '</span>' +
          '<span data-step="loss">3 Loss</span>' +
          '<span data-step="update">4 ' + (DE ? "Update 1" : "Update 1") + '</span>' +
          '<span data-step="update2">5 ' + (DE ? "Update 2" : "Update 2") + '</span>' +
          '<span data-step="fit">6 ' + (DE ? "Fit" : "Fit") + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="ls-scene-row ls-model-controls"><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-model-next">' + (DE ? "Weiter" : "Next") + ' →</button>' +
        '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-model-train">' + (DE ? "Modell trainieren" : "Train model") + '</button>' +
        '<button type="button" class="ls-chip is-on ls-model-data">' + (DE ? "Daten" : "Data") + '</button>' +
        '<button type="button" class="ls-chip is-on ls-model-truth">' + (DE ? "Echte Funktion" : "True function") + '</button>' +
        '<button type="button" class="ls-chip ls-model-error">' + (DE ? "Fehler" : "Error") + '</button>' +
      '</div>' +
      '<div class="ls-model-readout" aria-live="polite"><span class="ls-model-text"></span><span class="ls-model-metrics"></span></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-model-stage");
    var canvas = el.querySelector("canvas");
    var readout = el.querySelector(".ls-model-text");
    var metricEl = el.querySelector(".ls-model-metrics");
    var steps = el.querySelectorAll(".ls-model-steps [data-step]");
    var nextBtn = el.querySelector(".ls-model-next");
    var trainBtn = el.querySelector(".ls-model-train");
    var dataBtn = el.querySelector(".ls-model-data");
    var truthBtn = el.querySelector(".ls-model-truth");
    var errorBtn = el.querySelector(".ls-model-error");
    var size = null, ctx = null, hits = [], active = -1, view = "plot";
    var C = api.colors();
    var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var raf = 0, fit = 0, fitTarget = 0, fitFrom = 0, fitStart = 0, fitDone = false, time = 0;
    var showData = true, showTruth = true, showError = false, showModel = false;
    var phase = 0;
    var phaseFit = [0, 0, 0, 0.28, 0.62, 1];
    var probeT = 0.82, plotBounds = null;
    var cards = DE ? [
      { id: "tokenizer", title: "Tokenizer", sub: "Text → Tokens", color: "lime", desc: "Zerlegt Text in Tokens: Stücke, die das Modell als Zahlen lesen kann." },
      { id: "embed", title: "Embedding", sub: "Tokens → Vektoren", color: "sky", desc: "Macht aus jeder Token-ID einen Vektor. Ähnliche Tokens landen nah beieinander." },
      { id: "blocks", title: "Transformer", sub: "Attention + FFN", color: "green", desc: "Attention mischt Information zwischen Tokens, das neuronale Netz rechnet pro Token. Viele Blöcke hintereinander." },
      { id: "unembed", title: "Unembedding", sub: "Vektor → Scores", color: "gold", desc: "Projiziert den letzten Vektor auf das Vokabular. Softmax macht aus den Scores Wahrscheinlichkeiten." }
    ] : [
      { id: "tokenizer", title: "Tokenizer", sub: "text → tokens", color: "lime", desc: "Splits text into tokens: pieces the model can read as numbers." },
      { id: "embed", title: "Embedding", sub: "tokens → vectors", color: "sky", desc: "Turns each token ID into a vector. Similar tokens end up close together." },
      { id: "blocks", title: "Transformer", sub: "attention + FFN", color: "green", desc: "Attention mixes information between tokens; the neural network computes per token. Many blocks in a row." },
      { id: "unembed", title: "Unembedding", sub: "vector → scores", color: "gold", desc: "Projects the last vector onto the vocabulary. Softmax turns the scores into probabilities." }
    ];
    function color(name) { return C[name] || C.petrol; }
    var clamp = api.util.clamp;
    var TRAIN_END = 0.66;
    function truth(t) { return 0.5 + 0.3 * Math.sin(2 * Math.PI * t); }
    function polyModel(t) {
      var y = 0.46209673 + 3.08660053 * t - 8.18539554 * t * t + 4.43281224 * t * t * t;
      return clamp(y, 0.02, 0.98);
    }
    function baseApprox() { return 0.5; }
    var samples = [];
    (function () {
      var seed = 7;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      for (var i = 0; i < 14; i++) {
        var t = 0.04 + (0.58 * i / 13) + (rnd() - 0.5) * 0.018;
        samples.push({ t: t, v: truth(t) + (rnd() - 0.5) * 0.045 });
      }
    })();
    function modelValueAt(t, f) {
      var eased = f * f * (3 - 2 * f);
      return baseApprox() + (polyModel(t) - baseApprox()) * eased;
    }
    function modelValue(t) { return modelValueAt(t, fit); }
    function lossAt(f) {
      if (!samples.length) return 0;
      var sum = samples.reduce(function (acc, s) {
        var d = modelValueAt(s.t, f) - s.v;
        return acc + d * d;
      }, 0);
      return sum / samples.length;
    }
    function meanError() {
      if (!samples.length) return 0;
      var sum = samples.reduce(function (acc, s) { return acc + Math.abs(modelValue(s.t) - s.v); }, 0);
      return sum / samples.length;
    }
    function outsideError() {
      var sum = 0, n = 0;
      for (var i = 0; i <= 30; i++) {
        var t = 0.7 + 0.3 * i / 30;
        var d = modelValueAt(t, fit) - truth(t);
        sum += d * d;
        n++;
      }
      return Math.sqrt(sum / n);
    }
    function updateMetrics() {
      if (!metricEl) return;
      var loss = lossAt(fit);
      metricEl.textContent = (DE ? "Daten " : "Data ") + samples.length + ' · Loss ' + loss.toFixed(3) + ' · ' + (DE ? "außen " : "outside ") + outsideError().toFixed(3);
    }
    function updateStatus() {
      var order = ["data", "model", "loss", "update", "update2", "fit"];
      steps.forEach(function (s) {
        var key = s.getAttribute("data-step");
        var i = order.indexOf(key);
        s.classList.toggle("is-active", i === phase);
        s.classList.toggle("is-done", i < phase);
      });
    }
    function updateReadout() {
      var text;
      if (active >= 0) text = cards[active].desc;
      else if (view === "blocks") text = DE ? "Ein LLM baut aus diesen vier Bausteinen eine Funktion. Klicke einen Baustein an." : "An LLM builds a function from these four blocks. Click a block.";
      else if (phase === 0) text = DE ? "Daten sammeln: 14 Punkte im Trainingsbereich. Die Sinusfunktion ist unbekannt; nur die Punkte sind sichtbar." : "Collect data: 14 points in the training range. The sine function is unknown; only the points are visible.";
      else if (phase === 1) text = DE ? "Startmodell: eine flache Schätzung. Die Parameter sind noch nicht an die Daten angepasst." : "Start model: a flat estimate. The parameters are not yet fitted to the data.";
      else if (phase === 2) text = DE ? "Loss: Die senkrechten Linien sind die Fehler im Trainingsbereich. Der Loss fasst sie zu einer Zahl zusammen." : "Loss: the vertical lines are the errors in the training range. The loss turns them into one number.";
      else if (phase < 5) text = DE ? "Update: Die Parameter bewegen die Kurve. Der Loss sinkt mit jedem Schritt." : "Update: the parameters move the curve. The loss drops with each step.";
      else if (fit < 0.98) text = DE ? "Training: Die Kurve passt sich weiter an die Daten an." : "Training: the curve keeps fitting the data.";
      else text = DE ? "Fertig: Im Trainingsbereich passt die grüne Kurve. Außerhalb extrapoliert sie falsch: Das Netz hat den Bereich approximiert, nicht die Sinusfunktion verstanden." : "Done: the green curve fits inside the training range. Outside it extrapolates badly: the network approximated the range, not the sine function.";
      readout.innerHTML = '<b>' + (DE ? "Machine Learning" : "Machine learning") + '</b> ' + api.esc(text);
      updateMetrics();
      updateStatus();
    }
    function setPhase(i) {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      phase = clamp(i, 0, 5);
      fit = phaseFit[phase];
      fitFrom = fit;
      fitTarget = fit;
      fitDone = phase === 5;
      showModel = phase >= 1;
      showError = phase >= 2;
      updateReadout();
      draw();
    }
    function nextInternal() {
      if (phase < 5) { setPhase(phase + 1); return true; }
      return false;
    }
    function prevInternal() {
      if (phase > 0) { setPhase(phase - 1); return true; }
      return false;
    }
    function nextStep() {
      if (nextInternal()) return;
      api.goNext();
    }
    function prevStep() {
      if (prevInternal()) return;
      api.goPrev();
    }
    function cardColor(c) { return color(c.color); }
    function drawCard(x, y, w, h, idx) {
      var card = cards[idx];
      var on = idx === active;
      ctx.fillStyle = on ? "rgba(255,255,255,.96)" : "rgba(255,255,255,.86)";
      ctx.strokeStyle = on ? cardColor(card) : C.lineStrong;
      ctx.lineWidth = on ? 2 : 1;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = cardColor(card);
      ctx.fillRect(x, y, w, 4);
      ctx.fillStyle = C.ink;
      ctx.font = '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(card.title, x + 9, y + 23);
      ctx.fillStyle = C.muted;
      ctx.font = '500 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.fillText(card.sub, x + 9, y + h - 10);
      hits.push({ x: x, y: y, w: w, h: h, idx: idx });
    }
    function drawArrow(x1, y1, x2, y2) {
      ctx.strokeStyle = C.lineStrong;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      var a = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 6 * Math.cos(a - 0.5), y2 - 6 * Math.sin(a - 0.5));
      ctx.lineTo(x2 - 6 * Math.cos(a + 0.5), y2 - 6 * Math.sin(a + 0.5));
      ctx.closePath();
      ctx.fillStyle = C.lineStrong;
      ctx.fill();
    }
    function drawLossInset(plotX, plotY, plotW) {
      var iw = 146, ih = 64, ix = plotX + plotW - iw - 8, iy = plotY + 8;
      ctx.fillStyle = "rgba(255,255,255,.94)";
      ctx.fillRect(ix, iy, iw, ih);
      ctx.strokeStyle = C.lineStrong;
      ctx.lineWidth = 1;
      ctx.strokeRect(ix, iy, iw, ih);
      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("Loss", ix + 7, iy + 13);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + Math.max(7, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.fillText("MSE", ix + 38, iy + 13);
      var pts = [];
      for (var i = 1; i <= 5; i++) pts.push({ i: i, v: lossAt(phaseFit[i]) });
      var vals = pts.map(function (p) { return p.v; });
      var max = Math.max.apply(null, vals.concat([0.001]));
      var min = Math.min.apply(null, vals);
      var span = Math.max(0.0001, max - min);
      var gx0 = ix + 10, gy0 = iy + 22, gw = iw - 20, gh = 30;
      ctx.strokeStyle = C.line;
      ctx.beginPath(); ctx.moveTo(gx0, gy0 + gh); ctx.lineTo(gx0 + gw, gy0 + gh); ctx.stroke();
      function lx(i) { return gx0 + (i - 1) / 4 * gw; }
      function ly(v) { return gy0 + gh - (v - min) / span * gh; }
      ctx.strokeStyle = C.petrol;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      pts.forEach(function (p, k) { if (k === 0) ctx.moveTo(lx(p.i), ly(p.v)); else ctx.lineTo(lx(p.i), ly(p.v)); });
      ctx.stroke();
      pts.forEach(function (p) {
        var on = p.i === phase;
        ctx.beginPath();
        ctx.arc(lx(p.i), ly(p.v), on ? 3.4 : 2.2, 0, Math.PI * 2);
        ctx.fillStyle = on ? C.green : C.paper;
        ctx.fill();
        ctx.strokeStyle = on ? C.green : C.petrol;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });
      ctx.fillStyle = C.ink;
      ctx.font = '700 ' + Math.max(7, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.textAlign = "right";
      ctx.fillText(lossAt(fit).toFixed(3), ix + iw - 7, iy + 13);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + Math.max(6, api.font("canvas-sm") - 2) + 'px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("1", lx(1), iy + 58);
      ctx.fillText("5", lx(5), iy + 58);
    }
    function drawPlot(w, h, pad) {
      var plotX = pad, plotY = 58, plotW = w - pad * 2, plotH = Math.max(120, h - 112);
      plotBounds = { x: plotX, y: plotY, w: plotW, h: plotH };
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      for (var gx = 0; gx <= 4; gx++) {
        var xx = plotX + plotW * gx / 4;
        ctx.beginPath(); ctx.moveTo(xx, plotY); ctx.lineTo(xx, plotY + plotH); ctx.stroke();
      }
      for (var gy = 0; gy <= 4; gy++) {
        var yy = plotY + plotH * gy / 4;
        ctx.beginPath(); ctx.moveTo(plotX, yy); ctx.lineTo(plotX + plotW, yy); ctx.stroke();
      }
      ctx.strokeStyle = C.lineStrong;
      ctx.strokeRect(plotX, plotY, plotW, plotH);
      function px(t) { return plotX + t * plotW; }
      function py(v) { return plotY + plotH - v * plotH; }
      var splitX = px(TRAIN_END);
      ctx.fillStyle = "rgba(159,151,0,.07)";
      ctx.fillRect(splitX, plotY, plotX + plotW - splitX, plotH);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = C.gold;
      ctx.globalAlpha = .65;
      ctx.beginPath(); ctx.moveTo(splitX, plotY); ctx.lineTo(splitX, plotY + plotH); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(DE ? "Trainingsbereich" : "training range", plotX + 6, plotY + 14);
      ctx.textAlign = "right";
      ctx.fillText(DE ? "außerhalb" : "outside", plotX + plotW - 6, plotY + 14);
      if (showTruth) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = C.muted;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (var i = 0; i <= 90; i++) {
          var t = i / 90;
          if (i === 0) ctx.moveTo(px(t), py(truth(t))); else ctx.lineTo(px(t), py(truth(t)));
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
      var modelPts = [];
      for (var j = 0; j <= 90; j++) {
        var tj = j / 90;
        modelPts.push({ x: px(tj), y: py(modelValue(tj)) });
      }
      if (showModel) {
        var fill = ctx.createLinearGradient(0, plotY, 0, plotY + plotH);
        fill.addColorStop(0, "rgba(99,164,75,.20)");
        fill.addColorStop(1, "rgba(99,164,75,0)");
        ctx.beginPath();
        ctx.moveTo(modelPts[0].x, plotY + plotH);
        modelPts.forEach(function (p) { ctx.lineTo(p.x, p.y); });
        ctx.lineTo(modelPts[modelPts.length - 1].x, plotY + plotH);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.beginPath();
        modelPts.forEach(function (p, i2) { if (i2 === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
        ctx.strokeStyle = "rgba(99,164,75,.16)";
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2.6;
        ctx.stroke();
      }
      if (showError) {
        samples.forEach(function (s, si) {
          var pred = modelValue(s.t);
          ctx.beginPath();
          ctx.moveTo(px(s.t), py(s.v));
          ctx.lineTo(px(s.t), py(pred));
          ctx.strokeStyle = C.coral;
          ctx.globalAlpha = 0.68;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
          if (si === 8) {
            ctx.fillStyle = C.coral;
            ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
            ctx.textAlign = "left";
            ctx.fillText(DE ? "Fehler" : "error", px(s.t) + 4, (py(s.v) + py(pred)) / 2 + 3);
          }
        });
      }
      if (showData) samples.forEach(function (s) {
        ctx.beginPath();
        ctx.arc(px(s.t), py(s.v), 4, 0, Math.PI * 2);
        ctx.fillStyle = C.paper;
        ctx.fill();
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      });
      if (showModel) {
        ctx.fillStyle = C.green;
        ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(DE ? "Modell" : "model", px(0.84), py(modelValue(0.84)) + 15);
      }
      if (showTruth) {
        ctx.fillStyle = C.muted;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(DE ? "Sinus" : "sine", px(0.84), py(truth(0.84)) - 8);
      }
      var probeX = px(probeT), trueY = py(truth(probeT)), predY = py(modelValue(probeT));
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = C.lineStrong;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(probeX, plotY);
      ctx.lineTo(probeX, plotY + plotH);
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(probeX, trueY, 5, 0, Math.PI * 2);
      ctx.fillStyle = C.paper;
      ctx.fill();
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (showModel) {
        ctx.beginPath();
        ctx.arc(probeX, predY, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = C.green;
        ctx.fill();
        ctx.strokeStyle = C.paper;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = C.petrol;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(DE ? "Vorhersage" : "prediction", probeX, Math.min(h - 4, plotY + plotH + 14));
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      var legendX = plotX + 6;
      if (showData) {
        ctx.beginPath(); ctx.arc(legendX, plotY - 16, 3.4, 0, Math.PI * 2); ctx.fillStyle = C.paper; ctx.fill(); ctx.strokeStyle = C.blue; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = C.blue; ctx.fillText(DE ? "Daten" : "data", legendX + 8, plotY - 12);
        legendX += 68;
      }
      if (showModel) {
        ctx.fillStyle = C.green;
        ctx.fillRect(legendX, plotY - 18, 18, 2.8);
        ctx.fillText(DE ? "Modell" : "model", legendX + 24, plotY - 12);
        legendX += 84;
      }
      if (showTruth) {
        ctx.fillStyle = C.muted;
        ctx.fillText(DE ? "echte Funktion" : "true function", legendX, plotY - 12);
      }
      if (phase >= 1) drawLossInset(plotX, plotY, plotW);
    }
    function drawBlocks(w, h, pad) {
      ctx.fillStyle = C.ink;
      ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(DE ? "Ein LLM aus vier Bausteinen" : "An LLM from four building blocks", w / 2, 32);
      ctx.fillStyle = C.muted;
      ctx.font = '500 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "Machine Learning + Architektur" : "machine learning + architecture", w / 2, 52);
      var narrow = w < 620;
      var gap = narrow ? 10 : 14;
      var ch = narrow ? 64 : 76;
      var pipeY = h * 0.44;
      var positions = [];
      var cw;
      if (narrow) {
        cw = (w - pad * 2 - gap) / 2;
        positions = [
          { x: pad, y: pipeY }, { x: pad + cw + gap, y: pipeY },
          { x: pad + cw + gap, y: pipeY + ch + gap }, { x: pad, y: pipeY + ch + gap }
        ];
        cards.forEach(function (c, i) { drawCard(positions[i].x, positions[i].y, cw, ch, i); });
        drawArrow(positions[0].x + cw, positions[0].y + ch / 2, positions[1].x, positions[1].y + ch / 2);
        drawArrow(positions[1].x + cw / 2, positions[1].y + ch, positions[2].x + cw / 2, positions[2].y);
        drawArrow(positions[2].x, positions[2].y + ch / 2, positions[3].x + cw, positions[3].y + ch / 2);
      } else {
        cw = Math.min(180, (w - pad * 2 - gap * 3) / 4);
        var total = cw * 4 + gap * 3;
        var startX = w / 2 - total / 2;
        cards.forEach(function (c, i) { positions.push({ x: startX + i * (cw + gap), y: pipeY }); drawCard(positions[i].x, pipeY, cw, ch, i); });
        for (var i3 = 0; i3 < 3; i3++) drawArrow(positions[i3].x + cw, pipeY + ch / 2, positions[i3 + 1].x, pipeY + ch / 2);
      }
      if (!reducedMotion) {
        var path = narrow
          ? [{ x: positions[0].x + cw / 2, y: positions[0].y + ch / 2 }, { x: positions[1].x + cw / 2, y: positions[1].y + ch / 2 }, { x: positions[2].x + cw / 2, y: positions[2].y + ch / 2 }, { x: positions[3].x + cw / 2, y: positions[3].y + ch / 2 }]
          : positions.map(function (p) { return { x: p.x + cw / 2, y: p.y + ch / 2 }; });
        var seg = (time * 0.7) % (path.length - 1);
        var si = Math.floor(seg), st = seg - si;
        var a = path[si], b = path[Math.min(path.length - 1, si + 1)] || a;
        var dotX = a.x + (b.x - a.x) * st, dotY = a.y + (b.y - a.y) * st;
        ctx.beginPath(); ctx.arc(dotX, dotY, 11, 0, Math.PI * 2); ctx.fillStyle = "rgba(99,164,75,.16)"; ctx.fill();
        ctx.beginPath(); ctx.arc(dotX, dotY, 4.5, 0, Math.PI * 2); ctx.fillStyle = C.green; ctx.fill();
        ctx.strokeStyle = C.paper; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      hits = [];
      ctx.clearRect(0, 0, size.w, size.h);
      var w = size.w, h = size.h, pad = 24;
      var bg = ctx.createRadialGradient(w * 0.5, h * 0.30, 8, w * 0.5, h * 0.5, Math.max(w, h) * 0.78);
      bg.addColorStop(0, "rgba(247,250,249,.92)");
      bg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      if (view === "blocks") drawBlocks(w, h, pad);
      else drawPlot(w, h, pad);
      canvas.__lsModel = { hits: hits, active: active, view: view };
    }
    function frame(now) {
      var active = view === "blocks" || fit < fitTarget;
      if (!active) {
        raf = 0;
        draw();
        updateReadout();
        return;
      }
      raf = requestAnimationFrame(frame);
      if (fit < fitTarget) {
        var t = Math.min(1, (now - fitStart) / 1100);
        fit = fitFrom + (fitTarget - fitFrom) * (t * t * (3 - 2 * t));
        if (t >= 1) {
          fit = fitTarget;
          fitDone = true;
          phase = 5;
          showModel = true;
          showError = true;
          updateReadout();
        }
        updateMetrics();
      }
      time = now / 1000;
      draw();
    }
    function train() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      phase = 3;
      showModel = true;
      showError = true;
      fitFrom = fit;
      fitTarget = 1;
      fitStart = performance.now();
      fitDone = false;
      updateReadout();
      if (reducedMotion) { fit = 1; phase = 5; fitDone = true; updateReadout(); draw(); return; }
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function start() {
      if (reducedMotion) { fit = 1; fitTarget = 1; draw(); return; }
      if (view === "blocks") { if (!raf) raf = requestAnimationFrame(frame); return; }
      if (fit < fitTarget) { if (!raf) raf = requestAnimationFrame(frame); return; }
      draw();
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    trainBtn.addEventListener("click", train);
    nextBtn.addEventListener("click", nextStep);
    function toggleChip(btn, on) { btn.classList.toggle("is-on", on); btn.setAttribute("aria-pressed", on ? "true" : "false"); }
    dataBtn.addEventListener("click", function () { showData = !showData; toggleChip(dataBtn, showData); updateReadout(); draw(); });
    truthBtn.addEventListener("click", function () { showTruth = !showTruth; toggleChip(truthBtn, showTruth); updateReadout(); draw(); });
    errorBtn.addEventListener("click", function () { showError = !showError; toggleChip(errorBtn, showError); updateReadout(); draw(); });
    canvas.addEventListener("pointermove", function (e) {
      if (view !== "plot" || !plotBounds) return;
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left;
      if (x < plotBounds.x || x > plotBounds.x + plotBounds.w) return;
      probeT = clamp((x - plotBounds.x) / plotBounds.w, 0, 1);
      draw();
    });
    canvas.addEventListener("pointerup", function (e) {
      if (view !== "blocks") return;
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      hits.forEach(function (h) {
        if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
          active = active === h.idx ? -1 : h.idx;
          updateReadout();
          draw();
        }
      });
    });
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    updateReadout();
    resize();
    start();
    return {
      update: function (s) {
        if (s && s.view && s.view !== view) {
          view = s.view;
          active = -1;
          setPhase(0);
        }
      },
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) {
        return api.util.arrowKey(e, nextInternal, prevInternal);
      },
      pause: function () { if (raf) { cancelAnimationFrame(raf); raf = 0; } },
      resume: function () { start(); if (reducedMotion) draw(); },
      resize: resize,
      destroy: function () { if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", resize); el.remove(); }
    };
  }

  function stackScene(root, api) {
    var DE = api.lang === "de";
    var stages = DE ? [
      { id: "tokenizer", label: "Tokenizer", sub: "Kontext → Tokens" },
      { id: "embed", label: "Embedding", sub: "Tokens → Vektoren" },
      { id: "layers", label: "Schichten × N", sub: "Attention + FFN" },
      { id: "unembed", label: "Unembedding", sub: "Vektor → Scores" }
    ] : [
      { id: "tokenizer", label: "Tokenizer", sub: "context → tokens" },
      { id: "embed", label: "Embedding", sub: "tokens → vectors" },
      { id: "layers", label: "Layers × N", sub: "attention + FFN" },
      { id: "unembed", label: "Unembedding", sub: "vector → scores" }
    ];
    var el = document.createElement("div");
    el.className = "ls-stack-scene";
    el.innerHTML = '<div class="ls-stack-stage"><canvas class="ls-canvas" role="img"></canvas></div><div class="ls-stack-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-stack-stage");
    var canvas = el.querySelector("canvas");
    var readout = el.querySelector(".ls-stack-readout");
    var ctx = null, size = null, mode = "pipeline", hits = [];
    var C = api.colors();
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      var w = size.w, h = size.h, pad = 24;
      hits = [];
      if (mode === "layer") {
        var n = 5;
        var cell = Math.min((w - pad * 2) / n, (h - pad * 2 - 30) / n);
        var x0 = w / 2 - cell * n / 2, y0 = 44;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        var labels = DE ? ["Die", "Hauptstadt", "von", "Frankreich", "ist"] : ["The", "capital", "of", "France", "is"];
        labels.forEach(function (l, i) {
          ctx.fillStyle = C.muted; ctx.fillText(l, x0 + i * cell + cell / 2, y0 - 8);
          ctx.fillText(l, x0 - 8, y0 + i * cell + cell / 2 + 3);
        });
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
          var on = j <= i;
          var wgt = on ? (1 / (i + 1)) : 0;
          ctx.fillStyle = on ? "rgba(18,117,172," + (0.15 + wgt * 0.7) + ")" : "rgba(0,75,111,.04)";
          ctx.fillRect(x0 + j * cell, y0 + i * cell, cell - 1, cell - 1);
          if (on) { ctx.fillStyle = "#fff"; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; ctx.fillText((wgt * 100).toFixed(0), x0 + j * cell + cell / 2, y0 + i * cell + cell / 2 + 3); }
        }
        ctx.fillStyle = C.soft; ctx.font = '600 ' + api.font("canvas") + 'px "Open Sans", sans-serif'; ctx.textAlign = "left";
        ctx.fillText(DE ? "Kausale Self-Attention: Zeile fragt, Spalte antwortet" : "Causal self-attention: row asks, column answers", pad, 22);
        readout.innerHTML = '<span>' + (DE ? "Maskiert" : "Masked") + ' <b>' + (DE ? "oberes Dreieck" : "upper triangle") + '</b></span><span>' + (DE ? "Jede Zeile summiert zu 1" : "Every row sums to 1") + '</span>';
        return;
      }
      if (mode === "block") {
        var by = h * 0.40;
        var bw = Math.min(126, (w - pad * 2) / 5 - 10);
        var stepX = (w - pad * 2 - bw) / 4;
        var startX = pad + bw / 2;
        function blockNode(i, title, sub, fill, stroke, ink) {
          var x = startX + i * stepX;
          ctx.fillStyle = fill;
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1.4;
          ctx.fillRect(x - bw / 2, by - 28, bw, 56);
          ctx.strokeRect(x - bw / 2, by - 28, bw, 56);
          ctx.fillStyle = ink || C.ink;
          ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif';
          ctx.textAlign = "center";
          ctx.fillText(title, x, by - 2);
          if (sub) {
            ctx.fillStyle = C.muted;
            ctx.font = api.font("canvas-sm") + 'px "Open Sans", sans-serif';
            ctx.fillText(sub, x, by + 14);
          }
          return x;
        }
        var x0 = blockNode(0, DE ? "x" : "x", DE ? "Token + Position" : "token + position", "rgba(247,249,248,.92)", C.lineStrong, C.ink);
        var x1 = blockNode(1, "Attention", DE ? "mischt Tokens" : "mixes tokens", "rgba(99,164,75,.14)", C.green, C.petrol);
        var x2 = blockNode(2, "+", "", "rgba(255,255,255,.9)", C.lineStrong, C.green);
        var x3 = blockNode(3, "FFN", DE ? "rechnet pro Token" : "computes per token", "rgba(255,255,255,.72)", C.lineStrong, C.ink);
        var x4 = blockNode(4, DE ? "x′" : "x′", DE ? "nächster Block" : "next block", "rgba(247,249,248,.92)", C.lineStrong, C.ink);
        function link(a, b, col) {
          ctx.strokeStyle = col || C.lineStrong;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(a + bw / 2, by); ctx.lineTo(b - bw / 2, by); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(b - bw / 2, by); ctx.lineTo(b - bw / 2 - 6, by - 4); ctx.lineTo(b - bw / 2 - 6, by + 4); ctx.closePath(); ctx.fillStyle = col || C.lineStrong; ctx.fill();
        }
        link(x0, x1); link(x1, x2); link(x2, x3); link(x3, x4);
        ctx.strokeStyle = C.gold;
        ctx.lineWidth = 1.3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(x0, by + 28); ctx.quadraticCurveTo((x0 + x2) / 2, by + 96, x2, by + 28); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x2, by + 28); ctx.quadraticCurveTo((x2 + x3) / 2, by + 72, x3, by + 28); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.gold;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(DE ? "Residual +" : "residual +", (x0 + x2) / 2, by + 88);
        ctx.fillStyle = C.green;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.fillText(DE ? "hier zoomt die nächste Folie hinein" : "the next slide zooms in here", x1, by - 42);
        readout.innerHTML = '<span>' + (DE ? "Block" : "Block") + ' <b>Attention + FFN</b></span><span>' + (DE ? "beide mit Residual" : "both with residual") + '</span><span>' + (DE ? "Attention mischt Tokens, FFN rechnet pro Token" : "attention mixes tokens, FFN computes per token") + '</span>';
        return;
      }
      var gap = Math.min(150, (w - pad * 2) / 4);
      var start = w / 2 - gap * 1.5;
      var y = h * 0.5;
      stages.forEach(function (s, i) {
        var x = start + i * gap;
        var on = hits.some(function (h2) { return h2.id === s.id && h2.on; });
        ctx.fillStyle = i === 2 ? "rgba(99,164,75,.12)" : "rgba(255,255,255,.72)";
        ctx.strokeStyle = i === 2 ? C.green : C.lineStrong;
        ctx.fillRect(x - 58, y - 26, 116, 52);
        ctx.strokeRect(x - 58, y - 26, 116, 52);
        ctx.fillStyle = C.ink; ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif'; ctx.textAlign = "center";
        ctx.fillText(s.label, x, y - 2);
        ctx.fillStyle = C.muted; ctx.font = api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.fillText(s.sub, x, y + 13);
        hits.push({ id: s.id, x: x, y: y, r: 62, on: false });
        if (i < stages.length - 1) {
          ctx.strokeStyle = C.lineStrong; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(x + 58, y); ctx.lineTo(x + gap - 58, y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + gap - 58, y); ctx.lineTo(x + gap - 64, y - 4); ctx.lineTo(x + gap - 64, y + 4); ctx.closePath(); ctx.fillStyle = C.lineStrong; ctx.fill();
        }
      });
      if (mode === "loop") {
        ctx.strokeStyle = C.green; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(start + 58, y + 26); ctx.lineTo(start + 58, y + 58); ctx.lineTo(start + 3 * gap - 58, y + 58); ctx.lineTo(start + 3 * gap - 58, y + 26); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.green; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; ctx.textAlign = "center";
        ctx.fillText(DE ? "Token anhängen und wiederholen" : "append token and repeat", w / 2, y + 76);
      }
      readout.innerHTML = '<span>' + (DE ? "Stufen" : "Stages") + ' <b>' + stages.map(function (s) { return s.label; }).join(" → ") + '</b></span>';
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    canvas.addEventListener("pointerup", function (e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      hits.forEach(function (h2) { if (Math.hypot(h2.x - x, h2.y - y) < h2.r) { h2.on = true; readout.innerHTML = '<span><b>' + api.esc(stages.filter(function (s) { return s.id === h2.id; })[0].label) + '</b> ' + (DE ? "ist eine Stufe im Stapel." : "is one stage in the stack.") + '</span>'; } });
    });
    window.addEventListener("resize", resize);
    resize();
    return { update: function (s) { if (s && s.mode) { mode = s.mode; draw(); } }, resize: resize, destroy: function () { window.removeEventListener("resize", resize); el.remove(); } };
  }

  function animalScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-animal-scene";
    el.innerHTML = '<div class="ls-animal-stage"><canvas class="ls-canvas" role="img"></canvas></div><div class="ls-animal-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-animal-stage");
    var canvas = el.querySelector("canvas");
    var readout = el.querySelector(".ls-animal-readout");
    var size = null, ctx = null, yaw = -0.62, pitch = 0.46, zoom = 1, drag = null, active = -1, hits = [], raf = 0, last = 0;
    var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var C = api.colors();
    var pairs = DE ? [
      { id: "lion", male: "Löwe", female: "Löwin", species: "Löwe", role: "wild", x: -0.78, z: -1.00, color: "green" },
      { id: "horse", male: "Hengst", female: "Stute", species: "Pferd", role: "domestiziert", x: 0.72, z: -0.33, color: "sky" },
      { id: "cattle", male: "Stier", female: "Kuh", species: "Rind", role: "domestiziert", x: 0.72, z: 0.33, color: "gold" },
      { id: "chicken", male: "Hahn", female: "Henne", species: "Huhn", role: "domestiziert", x: 0.72, z: 1.00, color: "lilac" }
    ] : [
      { id: "lion", male: "Lion", female: "Lioness", species: "lion", role: "wild", x: -0.78, z: -1.00, color: "green" },
      { id: "horse", male: "Stallion", female: "Mare", species: "horse", role: "domesticated", x: 0.72, z: -0.33, color: "sky" },
      { id: "cattle", male: "Bull", female: "Cow", species: "cattle", role: "domesticated", x: 0.72, z: 0.33, color: "gold" },
      { id: "chicken", male: "Rooster", female: "Hen", species: "chicken", role: "domesticated", x: 0.72, z: 1.00, color: "lilac" }
    ];
    function color(name) { return C[name] || C.petrol; }
    var clamp = api.util.clamp;
    function project(x, y, z) {
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var x1 = x * cy - y * sy, y1 = x * sy + y * cy;
      var y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;
      var s = Math.min(size.w * 0.40, size.h * 0.36) / (1 + z2 * 0.22) * zoom;
      return { x: size.w / 2 + x1 * s, y: size.h / 2 - y2 * s, z: z2 };
    }
    function updateReadout() {
      var text;
      if (active >= 0) {
        var p = pairs[active];
        text = DE
          ? p.male + " → " + p.female + ": gleiche Spezies, unterschiedliches Geschlecht. Die Rolle bleibt auf der Rollenachse."
          : p.male + " → " + p.female + ": same species, different gender. Role stays on the role axis.";
      } else {
        text = DE
          ? "Klicke ein Paar an. Die Achsen zeigen Rolle, Geschlecht und Spezies."
          : "Click a pair. The axes show role, gender, and species.";
      }
      readout.innerHTML = '<span><b>' + (DE ? "Paar" : "Pair") + '</b> ' + api.esc(text) + '</span>';
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      hits = [];
      ctx.clearRect(0, 0, size.w, size.h);
      var bg = ctx.createRadialGradient(size.w * 0.5, size.h * 0.42, 8, size.w * 0.5, size.h * 0.5, Math.max(size.w, size.h) * 0.72);
      bg.addColorStop(0, "rgba(247,250,249,.9)");
      bg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, size.w, size.h);
      var axes = [
        { a: [-1.12, 0, 0], b: [1.12, 0, 0], col: C.blue, label: DE ? "Rolle" : "role", end: [1.20, 0, 0] },
        { a: [0, -1.12, 0], b: [0, 1.12, 0], col: C.green, label: DE ? "Geschlecht" : "gender", end: [0, 1.20, 0] },
        { a: [0, 0, -1.18], b: [0, 0, 1.18], col: C.gold, label: DE ? "Spezies" : "species", end: [0, 0, 1.26] }
      ];
      axes.forEach(function (ax) {
        var pa = project(ax.a[0], ax.a[1], ax.a[2]), pb = project(ax.b[0], ax.b[1], ax.b[2]);
        ctx.strokeStyle = ax.col; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        ctx.globalAlpha = 1;
        var le = project(ax.end[0], ax.end[1], ax.end[2]);
        ctx.fillStyle = ax.col;
        ctx.font = '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(ax.label, le.x + 5, le.y - 3);
      });
      // role labels on the x-axis
      var wild = project(-0.78, -1.22, 0), dom = project(0.72, -1.22, 0);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(DE ? "wild" : "wild", wild.x, wild.y);
      ctx.fillText(DE ? "domestiziert" : "domesticated", dom.x, dom.y);
      pairs.forEach(function (p, i) {
        var on = i === active;
        var col = color(p.color);
        var m = project(p.x, -0.78, p.z), f = project(p.x, 0.78, p.z);
        var mx = m.x, my = m.y, fx = f.x, fy = f.y;
        ctx.save();
        ctx.strokeStyle = col;
        ctx.globalAlpha = on ? 1 : 0.72;
        ctx.lineWidth = on ? 3.2 : 2.2;
        ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(fx, fy); ctx.stroke();
        var ang = Math.atan2(fy - my, fx - mx);
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx - 8 * Math.cos(ang - 0.45), fy - 8 * Math.sin(ang - 0.45));
        ctx.lineTo(fx - 8 * Math.cos(ang + 0.45), fy - 8 * Math.sin(ang + 0.45));
        ctx.closePath(); ctx.fillStyle = col; ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
        [[mx, my, p.male, true], [fx, fy, p.female, false]].forEach(function (pt) {
          ctx.beginPath(); ctx.arc(pt[0], pt[1], on ? 6 : 4.5, 0, Math.PI * 2);
          ctx.fillStyle = col; ctx.fill();
          ctx.strokeStyle = C.paper; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = C.ink;
          ctx.font = (on ? '700 ' : '600 ') + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
          ctx.textAlign = "center";
          ctx.fillText(pt[2], pt[0], pt[1] + (pt[3] ? -10 : 16));
          hits.push({ x: pt[0], y: pt[1], r: 24, pair: i });
        });
        hits.push({ x: (mx + fx) / 2, y: (my + fy) / 2, r: 26, pair: i });
      });
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(DE ? "Ziehen zum Drehen · Paar anklicken" : "Drag to rotate · click a pair", 12, 18);
      canvas.setAttribute("aria-label", DE
        ? "Drei Dimensionen: Rolle, Geschlecht, Spezies. Alle Pfeile zeigen von männlich nach weiblich."
        : "Three dimensions: role, gender, species. All arrows point from male to female.");
      canvas.__lsAnimal = { active: active, pairs: pairs.length, hits: hits };
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (now - last < 40) return;
      last = now;
      if (!drag) yaw += 0.0025;
      draw();
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    function pointer(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    canvas.addEventListener("pointerdown", function (e) { drag = pointer(e); });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return;
      yaw += (e.clientX - drag.x) * 0.008;
      pitch = clamp(pitch + (e.clientY - drag.y) * 0.006, -1.1, 1.1);
      drag = pointer(e);
      draw();
    });
    window.addEventListener("pointerup", function (e) {
      if (drag) {
        var p = pointer(e);
        var moved = Math.abs(p.x - drag.x) + Math.abs(p.y - drag.y);
        drag = null;
        if (moved > 8) return;
      }
      var p = pointer(e);
      var best = -1, bd = 30;
      hits.forEach(function (h) { var d = Math.hypot(h.x - p.x, h.y - p.y); if (d < Math.max(18, h.r)) { if (d < bd) { bd = d; best = h.pair; } } });
      if (best >= 0) { active = active === best ? -1 : best; updateReadout(); draw(); }
    });
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    updateReadout();
    resize();
    if (!reducedMotion) raf = requestAnimationFrame(frame);
    return {
      update: function () {},
      pause: function () { if (raf) { cancelAnimationFrame(raf); raf = 0; } },
      resume: function () { if (!reducedMotion && !raf) raf = requestAnimationFrame(frame); else draw(); },
      resize: resize,
      destroy: function () { if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", resize); el.remove(); }
    };
  }

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
    var ctx = null, size = null, active = "relu", hits = [];
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

  function langdataScene(root, api) {
    var DE = api.lang === "de";
    var langs = [
      { id: "de", label: DE ? "Deutsch" : "German", text: "Sonnenblumen sind die besten Blumen.", gloss: DE ? "Derselbe Inhalt, andere Schrift." : "The same content, a different script." },
      { id: "en", label: DE ? "Englisch" : "English", text: "Sunflowers are the best flowers.", gloss: DE ? "Derselbe Inhalt, andere Schrift." : "The same content, a different script." },
      { id: "fr", label: DE ? "Französisch" : "French", text: "Les tournesols sont les meilleures fleurs.", gloss: DE ? "Derselbe Inhalt, andere Schrift." : "The same content, a different script." },
      { id: "ja", label: DE ? "Japanisch" : "Japanese", text: "ひまわりは最高の花です。", gloss: DE ? "Derselbe Inhalt, andere Schrift." : "The same content, a different script." },
      { id: "ar", label: DE ? "Arabisch" : "Arabic", text: "زهور عباد الشمس هي الأفضل.", gloss: DE ? "Derselbe Inhalt, von rechts nach links." : "The same content, written right to left.", rtl: true },
      { id: "zh", label: DE ? "Chinesisch" : "Chinese", text: "向日葵是最好的花。", gloss: DE ? "Derselbe Inhalt, andere Schrift." : "The same content, a different script." }
    ];
    var mix = [
      { label: "Common Crawl", pct: 60, color: "#63a44b" },
      { label: "WebText2", pct: 22, color: "#5c9baf" },
      { label: "Books1", pct: 8, color: "#9f9700" },
      { label: "Books2", pct: 8, color: "#869b55" },
      { label: "Wikipedia", pct: 3, color: "#9185be" }
    ];
    var active = DE ? "de" : "en";
    var el = document.createElement("div");
    el.className = "ls-lang-scene";
    el.innerHTML =
      '<div class="ls-lang-tabs" role="group" aria-label="' + (DE ? "Sprachen" : "Languages") + '"></div>' +
      '<div class="ls-lang-sample">' +
        '<span class="ls-lang-tag"></span>' +
        '<p class="ls-lang-text" lang="de"></p>' +
        '<p class="ls-lang-gloss"></p>' +
      '</div>' +
      '<div class="ls-lang-mix">' +
        '<div class="ls-lang-mix-head">' + (DE ? "Woraus GPT-3 lernte" : "What GPT-3 learned from") + '</div>' +
        '<div class="ls-lang-bars"></div>' +
        '<p class="ls-lang-note">' + (DE ? "GPT-3-Mix nach Brown et al. (2020), Tabelle 2.2, gerundet. Labs veröffentlichen ihre genauen Rezepte nicht." : "GPT-3 mix from Brown et al. (2020), Table 2.2, rounded. Labs do not publish their exact recipes.") + '</p>' +
      '</div>' +
      '<p class="ls-lang-caveat">' + (DE ? "Dieselbe Schleife, dieselben Gewichte: Die Schrift ändert die Tokens, nicht die Aufgabe. Manche Sprachen brauchen für denselben Inhalt mehr Tokens; der Tokenizer kann sie dadurch teurer machen (Petrov et al., 2023)." : "The same loop, the same weights: the script changes the tokens, not the task. Some languages need more tokens for the same content, so the tokenizer can make them more expensive (Petrov et al., 2023).") + '</p>' +
      '<div class="ls-tokenize-nav ls-lang-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-lang-prev">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-tokenize-progress ls-lang-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-lang-next">' + (DE ? "Weiter →" : "Next →") + '</button></div>';
    root.appendChild(el);
    var tabs = el.querySelector(".ls-lang-tabs");
    var tag = el.querySelector(".ls-lang-tag");
    var text = el.querySelector(".ls-lang-text");
    var gloss = el.querySelector(".ls-lang-gloss");
    var bars = el.querySelector(".ls-lang-bars");
    var navPrev = el.querySelector(".ls-lang-prev");
    var navNext = el.querySelector(".ls-lang-next");
    var navProgress = el.querySelector(".ls-lang-progress");
    function updateNav() {
      var idx = 0;
      langs.forEach(function (l, i) { if (l.id === active) idx = i; });
      navProgress.textContent = (idx + 1) + ' / ' + langs.length;
      navPrev.disabled = idx === 0;
      navNext.textContent = idx === langs.length - 1 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
    }
    function show(id) {
      var item = langs.filter(function (l) { return l.id === id; })[0] || langs[0];
      active = item.id;
      Array.prototype.forEach.call(tabs.querySelectorAll("button"), function (b) {
        b.classList.toggle("is-on", b.getAttribute("data-lang") === item.id);
      });
      tag.textContent = item.label;
      text.textContent = item.text;
      text.setAttribute("lang", item.id);
      text.setAttribute("dir", item.rtl ? "rtl" : "ltr");
      gloss.textContent = item.gloss;
      updateNav();
    }
    langs.forEach(function (l) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-chip" + (l.id === active ? " is-on" : "");
      b.setAttribute("data-lang", l.id);
      b.textContent = l.label;
      b.addEventListener("click", function () { show(l.id); });
      tabs.appendChild(b);
    });
    bars.innerHTML = mix.map(function (m) {
      return '<div class="ls-lang-bar"><span class="ls-lang-bar-label">' + api.esc(m.label) + '</span>' +
        '<span class="ls-lang-bar-track"><i style="width:' + m.pct + '%;background:' + m.color + '"></i></span>' +
        '<span class="ls-lang-bar-val">' + m.pct + '%</span></div>';
    }).join("");
    show(active);
    function stepLanguage(dir) {
      var idx = -1;
      langs.forEach(function (l, i) { if (l.id === active) idx = i; });
      var next = idx + dir;
      if (next < 0 || next >= langs.length) return false;
      show(langs[next].id);
      return true;
    }
    function nextStep() {
      if (stepLanguage(1)) return;
      api.goNext();
    }
    function prevStep() {
      if (stepLanguage(-1)) return;
      api.goPrev();
    }
    navPrev.addEventListener("click", prevStep);
    navNext.addEventListener("click", nextStep);
    return {
      update: function () {},
      next: function () { return stepLanguage(1); },
      prev: function () { return stepLanguage(-1); },
      onKey: function (e) {
        if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return false;
        if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") return stepLanguage(1);
        if (e.key === "ArrowLeft" || e.key === "PageUp") return stepLanguage(-1);
        return false;
      },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }

  function chineseroomScene(root, api) {
    var DE = api.lang === "de";
    var rounds = [
      {
        input: "今天天气怎么样？",
        answer: "今天天气很冷。",
        options: ["我喜欢喝茶。", "今天天气很冷。", "门是开着的。"],
        rule: ["今天天气怎么样？", "今天天气很冷。"],
        de: "Wie ist das Wetter heute? → Das Wetter ist heute kalt.",
        en: "How is the weather today? → The weather is cold today."
      },
      {
        input: "你叫什么名字？",
        answer: "我叫小明。",
        options: ["外面在下雨。", "我叫小明。", "他住在北京。"],
        rule: ["你叫什么名字？", "我叫小明。"],
        de: "Wie heißt du? → Ich heiße Xiaoming.",
        en: "What is your name? → My name is Xiaoming."
      }
    ];
    var idx = 0, score = 0, done = false;
    var el = document.createElement("div");
    el.className = "ls-cr-scene";
    el.innerHTML =
      '<div class="ls-cr-body">' +
        '<div class="ls-cr-room">' +
          '<div class="ls-cr-top"><span class="ls-cr-progress"></span><span class="ls-cr-score"></span></div>' +
          '<div class="ls-cr-incoming"><span class="ls-cr-label">' + (DE ? "Eingabe" : "Input") + '</span><p class="ls-cr-input" lang="zh"></p><p class="ls-cr-sub">' + (DE ? "Du liest die Zeichen nicht." : "You cannot read the characters.") + '</p></div>' +
          '<div class="ls-cr-book"><div class="ls-cr-book-head">' + (DE ? "Regelbuch" : "Rulebook") + '</div><table class="ls-cr-rules" lang="zh"><tbody></tbody></table></div>' +
          '<div class="ls-cr-options" role="group" lang="zh" aria-label="' + (DE ? "Antwort wählen" : "Choose an answer") + '"></div>' +
          '<p class="ls-cr-feedback" aria-live="polite"></p>' +
        '</div>' +
        '<div class="ls-cr-reveal" aria-hidden="true">' +
          '<div class="ls-cr-reveal-head">' + (DE ? "Was du gerade getan hast" : "What you just did") + '</div>' +
          '<table class="ls-cr-trans"><tbody></tbody></table>' +
          '<p class="ls-cr-note">' + (DE ? "Von außen wirkte das wie Verstehen. Innen hast du Zeichen nach Regeln ersetzt. Searle (1980) nennt das den Unterschied zwischen Symbolmanipulation und Bedeutung. Ob das ganze System versteht, ist umstritten." : "From the outside this looked like understanding. Inside you replaced symbols by rules. Searle (1980) calls this the difference between symbol manipulation and meaning. Whether the whole system understands is disputed.") + '</p>' +
          '<details class="ls-cr-systems"><summary>' + (DE ? "Ganzen Raum ansehen" : "See the whole room") + '</summary><p>' + (DE ? "Der Systems Reply sagt: Vielleicht versteht nicht die Person im Zimmer, sondern das ganze System aus Person, Regelbuch und Zimmer. Searle hält das für eine Verschiebung des Problems, nicht für eine Lösung. Die Debatte ist offen." : "The systems reply says: perhaps the person in the room does not understand, but the whole system of person, rulebook, and room does. Searle treats that as moving the problem, not solving it. The debate is open.") + '</p></details>' +
          '<button type="button" class="ls-btn ls-btn--tiny ls-cr-restart">' + (DE ? "Neu starten" : "Restart") + '</button>' +
        '</div>' +
      '</div>';
    root.appendChild(el);
    var room = el.querySelector(".ls-cr-room");
    var reveal = el.querySelector(".ls-cr-reveal");
    var progress = el.querySelector(".ls-cr-progress");
    var scoreEl = el.querySelector(".ls-cr-score");
    var inputEl = el.querySelector(".ls-cr-input");
    var rulesBody = el.querySelector(".ls-cr-rules tbody");
    var optionsEl = el.querySelector(".ls-cr-options");
    var feedback = el.querySelector(".ls-cr-feedback");
    var transBody = el.querySelector(".ls-cr-trans tbody");
    function setPanel(showReveal) {
      room.classList.toggle("is-hidden", showReveal);
      reveal.classList.toggle("is-visible", showReveal);
      room.setAttribute("aria-hidden", showReveal ? "true" : "false");
      reveal.setAttribute("aria-hidden", showReveal ? "false" : "true");
    }
    function render() {
      var r = rounds[idx];
      progress.textContent = (DE ? "Runde" : "Round") + " " + (idx + 1) + " / " + rounds.length;
      scoreEl.textContent = (DE ? "Regeln befolgt: " : "Rules followed: ") + score;
      inputEl.textContent = r.input;
      var other = rounds[(idx + 1) % rounds.length];
      rulesBody.innerHTML = "<tr><td>" + api.esc(r.rule[0]) + "</td><td>" + api.esc(r.rule[1]) + "</td></tr>" +
        "<tr><td>" + api.esc(other.rule[0]) + "</td><td>" + api.esc(other.rule[1]) + "</td></tr>";
      optionsEl.innerHTML = "";
      r.options.forEach(function (opt) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ls-cr-choice";
        b.textContent = opt;
        b.addEventListener("click", function () { choose(opt, b); });
        optionsEl.appendChild(b);
      });
      feedback.textContent = "";
      setPanel(false);
    }
    function choose(opt, btn) {
      if (done) return;
      var r = rounds[idx];
      if (opt === r.answer) {
        score++;
        btn.classList.add("is-right");
        optionsEl.querySelectorAll("button").forEach(function (b) { b.disabled = true; });
        feedback.textContent = DE ? "Richtig. Du hast die Regel befolgt, ohne die Zeichen zu verstehen." : "Correct. You followed the rule without understanding the characters.";
        setTimeout(function () {
          idx++;
          if (idx < rounds.length) render();
          else showReveal();
        }, 800);
      } else {
        btn.classList.add("is-wrong");
        btn.disabled = true;
        feedback.textContent = DE ? "Schau ins Regelbuch: Welche Ausgabe steht bei dieser Eingabe?" : "Check the rulebook: which output belongs to this input?";
      }
    }
    function showReveal() {
      done = true;
      transBody.innerHTML = "";
      rounds.forEach(function (r) {
        var tr = document.createElement("tr");
        [r.input, r.answer, DE ? r.de : r.en].forEach(function (val, i) {
          var td = document.createElement("td");
          td.textContent = val;
          if (i < 2) td.setAttribute("lang", "zh");
          if (i === 2) td.className = "ls-cr-trans-gloss";
          tr.appendChild(td);
        });
        transBody.appendChild(tr);
      });
      setPanel(true);
    }
    var restart = el.querySelector(".ls-cr-restart");
    restart.addEventListener("click", function () {
      idx = 0; score = 0; done = false;
      render();
    });
    render();
    return { update: function () {}, resize: function () {}, destroy: function () { el.remove(); } };
  }

  function historyScene(root, api) {
    var DE = api.lang === "de";
    var tabs = DE ? [
      {
        year: "~27.000 v. Chr.", label: "Ganz früh", title: "Kerben im Wolfsknochen",
        text: "Der Wolfsknochen von Dolní Věstonice trägt 55 Kerben in zwei Gruppen von 30 und 25. Die Kerben sind keine Schrift, aber sie halten Zählschritte fest. Rechnen beginnt als gegenständliches Zählen, lange bevor es Computer gibt.",
        images: [{ src: "../vestonice_wolf_bone.jpg", alt: "Der Wolfsknochen von Dolní Věstonice mit 55 Kerben", cap: "Der Wolfsknochen von Dolní Věstonice. J3n6 (2012), CC BY-SA 3.0.", href: "https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg" }],
        sources: [{ label: "J3n6 (2012), Wolf Bone from Dolní Věstonice", url: "https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg" }]
      },
      {
        year: "~300 v. Chr.", label: "Antike", title: "Tafeln und Zählbretter",
        text: "Die Salamis-Tafel ist das älteste erhaltene Zählbrett, etwa 300 v. Chr. Der Abakus macht Stellenwerte körperlich: Steine auf Linien, nicht Ziffern auf Papier. Rechnen wird ein Verfahren mit Regeln.",
        images: [{ src: "../salamic_table.jpg", alt: "Die Salamis-Tafel, das älteste erhaltene Zählbrett", cap: "Die Salamis-Tafel, ca. 300 v. Chr. Wilhelm Kubitschek (1899), Public Domain.", href: "https://de.wikipedia.org/wiki/Datei:Salaminische_Tafel_Salamis_Tablet_nach_Wilhelm_Kubitschek_Numismatische_Zeitschrift_Bd_31_Wien_1899_p._394_ff.jpg" }],
        sources: [{ label: "Wilhelm Kubitschek (1899), Salamis Tablet", url: "https://de.wikipedia.org/wiki/Datei:Salaminische_Tafel_Salamis_Tablet_nach_Wilhelm_Kubitschek_Numismatische_Zeitschrift_Bd_31_Wien_1899_p._394_ff.jpg" }]
      },
      {
        year: "Antike–1305", label: "Logik", title: "Denken als Regelwerk",
        text: "Aristoteles ordnet Schlüsse in Formen. Pāṇini beschreibt Sanskrit-Grammatik als Regelsystem. Llull kombiniert Begriffe auf drehenden Scheiben. Die Idee dahinter: Denken lässt sich als Regelwerk schreiben, nicht nur als Erfahrung.",
        images: [{ src: "../FigurScheiben.jpg", alt: "Llulls Ars Magna mit drehenden Begriffsscheiben", cap: "Llulls Ars Magna, 1305. Ramon Llull, Public Domain.", href: "https://blog.hnf.de/das-universum-des-ramon-llull/" }],
        sources: [{ label: "Ramon Llull (1305), Ars Magna", url: "https://blog.hnf.de/das-universum-des-ramon-llull/" }]
      },
      {
        year: "1673–1854", label: "Maschinen", title: "Rechnen wird mechanisch",
        text: "Leibniz baut eine Rechenmaschine für alle vier Grundrechenarten und träumt von einer universalen Zeichensprache. Babbage entwirft die Analytical Engine. Boole schreibt Logik als Algebra. Mechanik und formale Regeln rücken zusammen.",
        images: [{ src: "../Leibnizrechenmaschine.jpg", alt: "Nachbau der Leibniz-Rechenmaschine", cap: "Leibniz-Rechenmaschine, Nachbau. Eremeev (2016), CC BY-SA 4.0.", href: "https://de.wikipedia.org/wiki/Datei:Rechenmaschine_von_Leibniz_(Nachbau)_06.jpg" }],
        sources: [{ label: "Eremeev (2016), Leibniz Rechenmaschine", url: "https://de.wikipedia.org/wiki/Datei:Rechenmaschine_von_Leibniz_(Nachbau)_06.jpg" }]
      },
      {
        year: "1943–1958", label: "Neuron", title: "Das Neuron als Recheneinheit",
        text: "McCulloch und Pitts modellieren 1943 ein Neuron als logische Schwelle. Hebb formuliert 1949, dass gemeinsames Feuern Verbindungen stärkt. 1958 baut Rosenblatt das Perzeptron, das Gewichte aus Fehlern anpasst. Das Gehirn wird zum Vorbild für lernende Maschinen.",
        images: [{ src: "../walter_pitts_1954.jpg", alt: "Walter Pitts an einer Tafel, 1954", cap: "Walter Pitts, 1954. Francis Bello, Public Domain.", href: "https://commons.wikimedia.org/wiki/File:1954_Walter_Pitts_and_a_blackboard.jpg" }],
        sources: [{ label: "HNF (2023), McCulloch und Pitts", url: "https://blog.hnf.de/mcculloch-und-pitts-das-erste-neuronale-netz/" }]
      },
      {
        year: "1958–1973", label: "Perzeptron", title: "Eine Linie reicht nicht",
        text: "1958 präsentiert Rosenblatt das Perzeptron; die Mark-I-Maschine liest 400 Photozellen und lernt linear trennbare Muster. 1969 zeigen Minsky und Papert, dass eine einzelne Schicht XOR nicht lösen kann: Die vier Punkte lassen sich nicht mit einer Geraden trennen. Sie wissen, dass ein mehrschichtiges Netz das könnte; offen ist das Training. 1973 verstärkt der Lighthill-Bericht den ersten KI-Winter.",
        images: [
          { src: "../mark_i_perceptron_manual.png", alt: "Mark I Perceptron, Figur 2 aus dem Bedienhandbuch", cap: "Mark I Perceptron, Figur 2 aus dem Bedienhandbuch. John C. Hay und Albert E. Murray, Public Domain.", href: "https://commons.wikimedia.org/wiki/File:Mark_I_Perceptron,_Figure_2_of_operator%27s_manual.png" },
          { src: "../marvin_minsky_portrait.jpg", alt: "Marvin Minsky", cap: "Marvin Minsky. Steamtalks (Flickr), CC BY-SA 2.0.", href: "https://commons.wikimedia.org/wiki/File:Marvin_Minsky.jpg" }
        ],
        diagram: "xor",
        sources: [
          { label: "HNF (2019), Frank Rosenblatt und das Perzeptron", url: "https://blog.hnf.de/frank-rosenblatt/" },
          { label: "Minsky & Papert (1969), Perceptrons", url: "https://archive.org/details/perceptronsintro0000mins" },
          { label: "Lighthill (1973), Artificial Intelligence: A General Survey", url: "https://rodsmith.nz/wp-content/uploads/Lighthill_1973_Report.pdf" }
        ]
      },
      {
        year: "1961–1986", label: "Backprop", title: "Fehler rückwärts",
        text: "Rosenblatt beschreibt 1961 eine rückwärts gerichtete Fehlerkorrektur, aber ohne Gradient und Kettenregel. Linnainmaa entwickelt 1970 die reverse mode der automatischen Differentiation. 1986 popularisieren Rumelhart, Hinton und Williams Backpropagation; verborgene Schichten werden trainierbar.",
        images: [{ src: "../frank_rosenblatt_portrait.jpg", alt: "Frank Rosenblatt", cap: "Frank Rosenblatt. Anonymous (Heinz Nixdorf MuseumsForum), CC BY-SA 4.0.", href: "https://commons.wikimedia.org/wiki/File:Frank_Rosenblatt.jpg" }],
        diagram: "backprop",
        sources: [
          { label: "Rosenblatt (1961), CAL Report on Back-Propagating Errors", url: "https://archive.org/details/DTIC_AD0256582/page/n11/mode/2up" },
          { label: "Linnainmaa (1970/1976), Cumulative Rounding Error", url: "https://papers.baulab.info/papers/also/Linnainmaa-1976.pdf" },
          { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0" }
        ]
      },
      {
        year: "1989–2012", label: "Deep Learning", title: "Bilder, GPUs, tiefe Netze",
        text: "LeCun kombiniert 1989 Backpropagation mit Faltungen für handgeschriebene Postleitzahlen. Fukushima, Waibel und Zhang liefern frühe Bausteine. 2012 gewinnt AlexNet mit tiefen CNNs und GPUs die ImageNet-Challenge. Tiefe Netze werden praktisch.",
        sources: [{ label: "Krizhevsky, Sutskever & Hinton (2012), AlexNet", url: "https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf" }]
      },
      {
        year: "2014–2017", label: "Transformer", title: "Attention ersetzt die Schleife",
        text: "Bahdanau, Cho und Bengio lassen 2014 den Decoder auf die Eingabewörter zurückblicken. 2017 ersetzt der Transformer die wiederkehrende Verarbeitung durch Self-Attention und fügt Positionsinformation hinzu. Sätze lassen sich parallel verarbeiten, ohne die Wortreihenfolge zu verlieren.",
        images: [{ src: "../transformer_architecture.png", alt: "Die Encoder-Decoder-Architektur des Transformers", cap: "Transformer-Architektur, Figur 1 aus Attention Is All You Need. Ashish Vaswani et al. (Google), CC BY-SA 4.0.", href: "https://commons.wikimedia.org/wiki/File:Attention_Is_All_You_Need_-_Encoder-decoder_Architecture.png" }],
        sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }]
      },
      {
        year: "2018–2022", label: "GPT", title: "Vorhersage wird Dialog",
        text: "2018 zeigt GPT-1 mit 117 Millionen Parametern Pretraining plus Fine-Tuning. 2019 folgt GPT-2 mit 1,5 Milliarden und Prompting, 2020 GPT-3 mit 175 Milliarden und Few-Shot. 2022 zeigt Chinchilla, dass mehr Daten pro Parameter oft besser sind; ChatGPT verbindet Instruction-Tuning und RLHF.",
        sources: [
          { label: "Brown et al. (2020), GPT-3", url: "https://arxiv.org/abs/2005.14165" },
          { label: "Hoffmann et al. (2022), Chinchilla", url: "https://arxiv.org/abs/2203.15556" },
          { label: "Ouyang et al. (2022), InstructGPT", url: "https://arxiv.org/abs/2203.02155" }
        ]
      }
    ] : [
      {
        year: "~27,000 BCE", label: "Deep past", title: "Notches in a wolf bone",
        text: "The wolf bone from Dolní Věstonice carries 55 notches in two groups of 30 and 25. The notches are not writing, but they record counting steps. Arithmetic begins as embodied counting, long before computers.",
        images: [{ src: "../vestonice_wolf_bone.jpg", alt: "The Dolní Věstonice wolf bone with 55 notches", cap: "The Dolní Věstonice wolf bone. J3n6 (2012), CC BY-SA 3.0.", href: "https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg" }],
        sources: [{ label: "J3n6 (2012), Wolf Bone from Dolní Věstonice", url: "https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg" }]
      },
      {
        year: "~300 BCE", label: "Antiquity", title: "Tablets and counting boards",
        text: "The Salamis tablet is the oldest surviving counting board, from about 300 BCE. The abacus makes place value physical: stones on lines, not digits on paper. Calculation becomes a procedure with rules.",
        images: [{ src: "../salamic_table.jpg", alt: "The Salamis tablet, the oldest surviving counting board", cap: "The Salamis tablet, ca. 300 BCE. Wilhelm Kubitschek (1899), public domain.", href: "https://de.wikipedia.org/wiki/Datei:Salaminische_Tafel_Salamis_Tablet_nach_Wilhelm_Kubitschek_Numismatische_Zeitschrift_Bd_31_Wien_1899_p._394_ff.jpg" }],
        sources: [{ label: "Wilhelm Kubitschek (1899), Salamis Tablet", url: "https://de.wikipedia.org/wiki/Datei:Salaminische_Tafel_Salamis_Tablet_nach_Wilhelm_Kubitschek_Numismatische_Zeitschrift_Bd_31_Wien_1899_p._394_ff.jpg" }]
      },
      {
        year: "Antiquity–1305", label: "Logic", title: "Thought as a rulebook",
        text: "Aristotle arranges inferences into forms. Pāṇini describes Sanskrit grammar as a rule system. Llull combines concepts on rotating wheels. The idea: thought can be written as a rulebook, not only lived as experience.",
        images: [{ src: "../FigurScheiben.jpg", alt: "Llull's Ars Magna with rotating concept wheels", cap: "Llull's Ars Magna, 1305. Ramon Llull, public domain.", href: "https://blog.hnf.de/das-universum-des-ramon-llull/" }],
        sources: [{ label: "Ramon Llull (1305), Ars Magna", url: "https://blog.hnf.de/das-universum-des-ramon-llull/" }]
      },
      {
        year: "1673–1854", label: "Machines", title: "Calculation becomes mechanical",
        text: "Leibniz builds a calculator for all four arithmetic operations and dreams of a universal symbol language. Babbage designs the Analytical Engine. Boole writes logic as algebra. Mechanism and formal rules move closer together.",
        images: [{ src: "../Leibnizrechenmaschine.jpg", alt: "A replica of Leibniz's calculating machine", cap: "Leibniz calculating machine, replica. Eremeev (2016), CC BY-SA 4.0.", href: "https://de.wikipedia.org/wiki/Datei:Rechenmaschine_von_Leibniz_(Nachbau)_06.jpg" }],
        sources: [{ label: "Eremeev (2016), Leibniz Calculating Machine", url: "https://de.wikipedia.org/wiki/Datei:Rechenmaschine_von_Leibniz_(Nachbau)_06.jpg" }]
      },
      {
        year: "1943–1958", label: "Neuron", title: "The neuron as a computing unit",
        text: "McCulloch and Pitts model a neuron as a logical threshold in 1943. Hebb formulates in 1949 that neurons that fire together strengthen their connection. In 1958 Rosenblatt builds the perceptron, which adjusts weights from errors. The brain becomes the model for learning machines.",
        images: [{ src: "../walter_pitts_1954.jpg", alt: "Walter Pitts at a blackboard, 1954", cap: "Walter Pitts, 1954. Francis Bello, public domain.", href: "https://commons.wikimedia.org/wiki/File:1954_Walter_Pitts_and_a_blackboard.jpg" }],
        sources: [{ label: "HNF (2023), McCulloch and Pitts", url: "https://blog.hnf.de/mcculloch-und-pitts-das-erste-neuronale-netz/" }]
      },
      {
        year: "1958–1973", label: "Perceptron", title: "One line is not enough",
        text: "In 1958 Rosenblatt presents the perceptron; the Mark I machine reads 400 photocells and learns linearly separable patterns. In 1969 Minsky and Papert show that a single layer cannot solve XOR: the four points cannot be separated by a straight line. They know a multilayer network could; what is missing is training. In 1973 the Lighthill report deepens the first AI winter.",
        images: [
          { src: "../mark_i_perceptron_manual.png", alt: "Mark I Perceptron, figure 2 from the operator's manual", cap: "Mark I Perceptron, figure 2 from the operator's manual. John C. Hay and Albert E. Murray, public domain.", href: "https://commons.wikimedia.org/wiki/File:Mark_I_Perceptron,_Figure_2_of_operator%27s_manual.png" },
          { src: "../marvin_minsky_portrait.jpg", alt: "Marvin Minsky", cap: "Marvin Minsky. Steamtalks (Flickr), CC BY-SA 2.0.", href: "https://commons.wikimedia.org/wiki/File:Marvin_Minsky.jpg" }
        ],
        diagram: "xor",
        sources: [
          { label: "HNF (2019), Frank Rosenblatt and the Perceptron", url: "https://blog.hnf.de/frank-rosenblatt/" },
          { label: "Minsky & Papert (1969), Perceptrons", url: "https://archive.org/details/perceptronsintro0000mins" },
          { label: "Lighthill (1973), Artificial Intelligence: A General Survey", url: "https://rodsmith.nz/wp-content/uploads/Lighthill_1973_Report.pdf" }
        ]
      },
      {
        year: "1961–1986", label: "Backprop", title: "Errors backward",
        text: "Rosenblatt describes a backward error correction in 1961, but without a gradient and chain rule. Linnainmaa develops reverse-mode automatic differentiation in 1970. In 1986 Rumelhart, Hinton, and Williams popularise backpropagation; hidden layers become trainable.",
        images: [{ src: "../frank_rosenblatt_portrait.jpg", alt: "Frank Rosenblatt", cap: "Frank Rosenblatt. Anonymous (Heinz Nixdorf MuseumsForum), CC BY-SA 4.0.", href: "https://commons.wikimedia.org/wiki/File:Frank_Rosenblatt.jpg" }],
        diagram: "backprop",
        sources: [
          { label: "Rosenblatt (1961), CAL Report on Back-Propagating Errors", url: "https://archive.org/details/DTIC_AD0256582/page/n11/mode/2up" },
          { label: "Linnainmaa (1970/1976), Cumulative Rounding Error", url: "https://papers.baulab.info/papers/also/Linnainmaa-1976.pdf" },
          { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0" }
        ]
      },
      {
        year: "1989–2012", label: "Deep Learning", title: "Images, GPUs, deep networks",
        text: "LeCun combines backpropagation with convolutions in 1989 for handwritten ZIP codes. Fukushima, Waibel, and Zhang supply early building blocks. In 2012 AlexNet wins ImageNet with deep CNNs and GPUs. Deep networks become practical.",
        sources: [{ label: "Krizhevsky, Sutskever & Hinton (2012), AlexNet", url: "https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf" }]
      },
      {
        year: "2014–2017", label: "Transformer", title: "Attention replaces the loop",
        text: "Bahdanau, Cho, and Bengio let the decoder look back at the input words in 2014. In 2017 the transformer replaces recurrent processing with self-attention and adds positional information. Sentences can be processed in parallel without losing word order.",
        images: [{ src: "../transformer_architecture.png", alt: "The transformer encoder-decoder architecture", cap: "Transformer architecture, figure 1 from Attention Is All You Need. Ashish Vaswani et al. (Google), CC BY-SA 4.0.", href: "https://commons.wikimedia.org/wiki/File:Attention_Is_All_You_Need_-_Encoder-decoder_Architecture.png" }],
        sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }]
      },
      {
        year: "2018–2022", label: "GPT", title: "Prediction becomes dialogue",
        text: "In 2018 GPT-1 shows with 117 million parameters that pretraining plus fine-tuning works. In 2019 GPT-2 follows with 1.5 billion and prompting; in 2020 GPT-3 has 175 billion and few-shot learning. In 2022 Chinchilla shows that more data per parameter often helps, and ChatGPT combines instruction tuning with RLHF.",
        sources: [
          { label: "Brown et al. (2020), GPT-3", url: "https://arxiv.org/abs/2005.14165" },
          { label: "Hoffmann et al. (2022), Chinchilla", url: "https://arxiv.org/abs/2203.15556" },
          { label: "Ouyang et al. (2022), InstructGPT", url: "https://arxiv.org/abs/2203.02155" }
        ]
      }
    ];
    var index = 0;
    var el = document.createElement("div");
    el.className = "ls-history-scene";
    el.innerHTML = '<div class="ls-history-head"><span class="ls-history-kicker">' + (DE ? "Geschichte in zehn Schritten" : "History in ten steps") + '</span><span class="ls-history-hint">' + (DE ? "Tab wählen" : "Choose a tab") + '</span></div>' +
      '<div class="ls-history-tabs" role="tablist" aria-label="' + (DE ? "Geschichte" : "History") + '"></div>' +
      '<div class="ls-history-panel" role="tabpanel" aria-live="polite"></div>' +
      '<div class="ls-tokenize-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-history-prev">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-tokenize-progress ls-history-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-history-next">' + (DE ? "Weiter →" : "Next →") + '</button></div>';
    root.appendChild(el);
    var track = el.querySelector(".ls-history-tabs");
    var panel = el.querySelector(".ls-history-panel");
    var prevBtn = el.querySelector(".ls-history-prev");
    var nextBtn = el.querySelector(".ls-history-next");
    var progress = el.querySelector(".ls-history-progress");
    function diagramHTML(kind) {
      if (kind === "xor") {
        return '<svg viewBox="0 0 240 150" role="img" aria-label="' + (DE ? "XOR-Punkte: 0 und 1 wechseln sich ab; keine Gerade trennt sie." : "XOR points: 0 and 1 alternate; no straight line separates them.") + '">' +
          '<line x1="38" y1="122" x2="220" y2="122" stroke="#b9c8c3" stroke-width="1"/>' +
          '<line x1="38" y1="122" x2="38" y2="22" stroke="#b9c8c3" stroke-width="1"/>' +
          '<line x1="62" y1="28" x2="198" y2="118" stroke="#9f9700" stroke-width="1.5" stroke-dasharray="5 4"/>' +
          '<circle cx="70" cy="104" r="7" fill="#5c9baf"/><text x="70" y="132" text-anchor="middle" font-size="10" fill="#627476">0</text>' +
          '<circle cx="70" cy="38" r="7" fill="#63a44b"/><text x="70" y="20" text-anchor="middle" font-size="10" fill="#627476">1</text>' +
          '<circle cx="190" cy="104" r="7" fill="#63a44b"/><text x="190" y="132" text-anchor="middle" font-size="10" fill="#627476">1</text>' +
          '<circle cx="190" cy="38" r="7" fill="#5c9baf"/><text x="190" y="20" text-anchor="middle" font-size="10" fill="#627476">0</text>' +
          '<text x="122" y="144" text-anchor="middle" font-size="9" fill="#627476">' + (DE ? "keine Gerade trennt 0 und 1" : "no line separates 0 and 1") + '</text>' +
          '</svg>';
      }
      if (kind === "backprop") {
        function node(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="8" fill="#fff" stroke="#1275ac" stroke-width="1.6"/>'; }
        function arrow(x1, y1, x2, y2, col, dash) {
          return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + col + '" stroke-width="1.4"' + (dash ? ' stroke-dasharray="4 3"' : '') + '/>' +
            '<path d="M' + x2 + ' ' + y2 + ' l-4 -5 l6 1 z" fill="' + col + '"/>';
        }
        var html = '<svg viewBox="0 0 260 116" role="img" aria-label="' + (DE ? "Vorwärts durch das Netz, Fehler rückwärts durch Backpropagation." : "Forward through the network, error backward through backpropagation.") + '">';
        [30, 70, 100].forEach(function (y) { html += node(48, y); html += node(130, y); html += node(212, y); });
        [30, 70, 100].forEach(function (y) { html += arrow(58, y, 120, y, "#1275ac"); });
        [30, 70, 100].forEach(function (y) { html += arrow(202, y + 16, 140, y + 16, "#63a44b", true); });
        html += '<text x="130" y="14" text-anchor="middle" font-size="9" fill="#1275ac">Forward →</text>';
        html += '<text x="130" y="112" text-anchor="middle" font-size="9" fill="#63a44b">← ' + (DE ? "Fehler rückwärts" : "error backward") + '</text>';
        html += '</svg>';
        return html;
      }
      return "";
    }
    function figuresHTML(e) {
      if (!e.images || !e.images.length) return "";
      return '<div class="ls-history-figures">' + e.images.map(function (im) {
        return '<figure class="ls-history-figure"><img src="' + api.esc(im.src) + '" alt="' + api.esc(im.alt) + '" loading="lazy" decoding="async"><figcaption>' + api.esc(im.cap) + ' <a href="' + api.esc(im.href) + '" target="_blank" rel="noopener">' + (DE ? "Quelle" : "Source") + '</a></figcaption></figure>';
      }).join("") + '</div>';
    }
    function sourcesHTML(e) {
      var ss = e.sources || (e.source ? [e.source] : []);
      if (!ss.length) return "";
      return '<div class="ls-history-sources">' + ss.map(function (s) {
        return '<a class="ls-history-source" href="' + api.esc(s.url) + '" target="_blank" rel="noopener">' + api.esc(s.label) + '</a>';
      }).join("") + '</div>';
    }
    function render() {
      index = Math.max(0, Math.min(tabs.length - 1, index));
      track.innerHTML = tabs.map(function (t, i) {
        return '<button type="button" class="ls-history-node' + (i === index ? ' is-on' : '') + '" role="tab" aria-selected="' + (i === index ? 'true' : 'false') + '" data-history="' + i + '"><b>' + api.esc(t.year) + '</b><span>' + api.esc(t.label) + '</span></button>';
      }).join("");
      track.querySelectorAll("[data-history]").forEach(function (b) {
        b.addEventListener("click", function () { setIndex(parseInt(b.getAttribute("data-history"), 10)); });
      });
      var e = tabs[index];
      panel.innerHTML = '<div class="ls-history-year">' + api.esc(e.year) + '</div>' +
        '<h3 class="ls-history-title">' + api.esc(e.title) + '</h3>' +
        '<p class="ls-history-text">' + api.esc(e.text) + '</p>' +
        figuresHTML(e) +
        (e.diagram ? '<div class="ls-history-diagram">' + diagramHTML(e.diagram) + '</div>' : '') +
        sourcesHTML(e);
      progress.textContent = (index + 1) + ' / ' + tabs.length;
      prevBtn.disabled = index === 0;
      nextBtn.textContent = index === tabs.length - 1 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
      track.querySelectorAll("[data-history]").forEach(function (b, i) { b.classList.toggle("is-on", i === index); b.setAttribute("aria-selected", i === index ? "true" : "false"); });
    }
    function setIndex(i) {
      index = Math.max(0, Math.min(tabs.length - 1, i));
      render();
    }
    function nextInternal() { if (index < tabs.length - 1) { setIndex(index + 1); return true; } return false; }
    function prevInternal() { if (index > 0) { setIndex(index - 1); return true; } return false; }
    function nextStep() {
      if (nextInternal()) return;
      api.goNext();
    }
    function prevStep() {
      if (prevInternal()) return;
      api.goPrev();
    }
    prevBtn.addEventListener("click", prevStep);
    nextBtn.addEventListener("click", nextStep);
    render();
    return {
      update: function (s) {
        if (s && typeof s.tab === "number" && s.tab !== index) {
          index = s.tab;
          render();
        }
      },
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) {
        return api.util.arrowKey(e, nextInternal, prevInternal);
      },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }

  function posttrainScene(root, api) {
    var DE = api.lang === "de";
    var prompt = DE ? "Erkläre in einem Satz, warum der Himmel blau ist." : "Explain in one sentence why the sky is blue.";
    var stages = DE ? [
      {
        id: "base", label: "Basismodell", note: "Pretraining: Das Modell setzt Text fort.",
        text: "Der Himmel ist blau. Das ist eine Frage, die sich viele stellen. Man könnte auch fragen, warum Wasser nass ist, und dann kommt man schnell zu Regen, Wolken, Wetter und ..."
      },
      {
        id: "sft", label: "SFT", note: "Supervised Fine-Tuning: Menschen zeigen gute Antworten.",
        text: "Der Himmel ist blau, weil Luftmoleküle kurzwelliges Licht stärker streuen als langwelliges."
      },
      {
        id: "rlhf", label: "RLHF", note: "Menschen vergleichen Antworten; das Modell lernt die Präferenz.",
        text: "Kurz: Luftmoleküle streuen blaues Licht stärker als rotes. Deshalb wirkt der Himmel blau."
      }
    ] : [
      {
        id: "base", label: "Base model", note: "Pretraining: the model continues text.",
        text: "The sky is blue. That is a question many people ask. One could also ask why water is wet, and then you quickly get to rain, clouds, weather, and ..."
      },
      {
        id: "sft", label: "SFT", note: "Supervised fine-tuning: humans show good answers.",
        text: "The sky is blue because air molecules scatter short-wavelength light more strongly than long-wavelength light."
      },
      {
        id: "rlhf", label: "RLHF", note: "Humans compare answers; the model learns the preference.",
        text: "In short: air molecules scatter blue light more strongly than red. That is why the sky looks blue."
      }
    ];
    var step = 0, pref = null;
    var el = document.createElement("div");
    el.className = "ls-post-scene";
    el.innerHTML = '<div class="ls-post-prompt"><span>' + (DE ? "Prompt" : "Prompt") + '</span><p>' + api.esc(prompt) + '</p></div>' +
      '<div class="ls-post-tabs" role="tablist"></div>' +
      '<div class="ls-post-answer"><div class="ls-post-answer-head"><span class="ls-post-label"></span><span class="ls-post-note"></span></div><p class="ls-post-text"></p></div>' +
      '<div class="ls-post-pref" hidden><div class="ls-post-pref-head">' + (DE ? "Welche Antwort ist besser?" : "Which answer is better?") + '</div>' +
        '<div class="ls-post-pref-grid"><button type="button" data-pref="a"><b>A</b><span class="ls-post-pref-text"></span></button><button type="button" data-pref="b"><b>B</b><span class="ls-post-pref-text"></span></button></div>' +
        '<p class="ls-post-feedback" aria-live="polite"></p>' +
      '</div>' +
      '<div class="ls-tokenize-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-post-prev">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-tokenize-progress ls-post-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-post-next">' + (DE ? "Weiter" : "Next") + ' →</button></div>';
    root.appendChild(el);
    var tabs = el.querySelector(".ls-post-tabs");
    var label = el.querySelector(".ls-post-label");
    var note = el.querySelector(".ls-post-note");
    var text = el.querySelector(".ls-post-text");
    var prefBox = el.querySelector(".ls-post-pref");
    var prefButtons = el.querySelectorAll("[data-pref]");
    var prefTexts = el.querySelectorAll(".ls-post-pref-text");
    var feedback = el.querySelector(".ls-post-feedback");
    var prevBtn = el.querySelector(".ls-post-prev");
    var nextBtn = el.querySelector(".ls-post-next");
    var progress = el.querySelector(".ls-post-progress");
    function render() {
      var st = stages[step];
      tabs.innerHTML = stages.map(function (s, i) {
        return '<button type="button" class="ls-chip' + (i === step ? ' is-on' : '') + '" data-stage="' + s.id + '" role="tab" aria-selected="' + (i === step ? 'true' : 'false') + '">' + api.esc(s.label) + '</button>';
      }).join("");
      tabs.querySelectorAll("[data-stage]").forEach(function (b) {
        b.addEventListener("click", function () { setStep(stages.map(function (x) { return x.id; }).indexOf(b.getAttribute("data-stage"))); });
      });
      label.textContent = st.label;
      note.textContent = st.note;
      text.textContent = st.text;
      prefBox.hidden = step !== 2;
      if (step === 2) {
        prefTexts[0].textContent = stages[1].text;
        prefTexts[1].textContent = stages[2].text;
        prefButtons.forEach(function (b) {
          b.classList.toggle("is-on", pref === b.getAttribute("data-pref"));
          b.setAttribute("aria-pressed", pref === b.getAttribute("data-pref") ? "true" : "false");
        });
        feedback.textContent = pref === "a"
          ? (DE ? "Kürzer und direkter ist hier oft besser. Menschen wählen B häufiger; daraus lernt das Reward-Modell." : "Shorter and more direct is often better here. People pick B more often; the reward model learns from that.")
          : pref === "b"
            ? (DE ? "Richtig. Aus vielen Vergleichen lernt ein Reward-Modell; RLHF verschiebt die Antworten in diese Richtung." : "Correct. From many comparisons a reward model learns; RLHF shifts answers in this direction.")
            : (DE ? "Wähle A oder B." : "Choose A or B.");
      } else {
        feedback.textContent = "";
      }
      progress.textContent = (step + 1) + " / " + stages.length;
      prevBtn.disabled = step === 0;
      nextBtn.textContent = step === stages.length - 1 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
    }
    function setStep(i) {
      step = Math.max(0, Math.min(stages.length - 1, i));
      pref = null;
      render();
    }
    function nextInternal() { if (step < stages.length - 1) { setStep(step + 1); return true; } return false; }
    function prevInternal() { if (step > 0) { setStep(step - 1); return true; } return false; }
    function nextStep() {
      if (nextInternal()) return;
      api.goNext();
    }
    function prevStep() {
      if (prevInternal()) return;
      api.goPrev();
    }
    prefButtons.forEach(function (b) {
      b.addEventListener("click", function () { pref = b.getAttribute("data-pref"); render(); });
    });
    prevBtn.addEventListener("click", prevStep);
    nextBtn.addEventListener("click", nextStep);
    render();
    return {
      update: function (s) { if (s && typeof s.step === "number") setStep(s.step); },
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) {
        return api.util.arrowKey(e, nextInternal, prevInternal);
      },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }

  function evalScene(root, api) {
    var DE = api.lang === "de";
    var tasks = DE ? [
      { id: "mmlu", label: "MMLU", title: "MMLU · 57 Fächer", clean: 68, dirty: 92, sample: "Welche Aussage über Photosynthese ist richtig?", note: "Multiple Choice über Faktenwissen und Schlussfolgern." },
      { id: "humaneval", label: "HumanEval", title: "HumanEval · Code", clean: 55, dirty: 88, sample: "Schreibe eine Funktion, die eine Liste umdreht.", note: "Unit-Tests prüfen, ob der Code läuft." },
      { id: "gsm8k", label: "GSM8K", title: "GSM8K · Mathe", clean: 72, dirty: 95, sample: "Ein Zug fährt 60 km/h. Wie weit kommt er in 2,5 Stunden?", note: "Mehrschrittige Textaufgaben mit Zahlen." }
    ] : [
      { id: "mmlu", label: "MMLU", title: "MMLU · 57 subjects", clean: 68, dirty: 92, sample: "Which statement about photosynthesis is correct?", note: "Multiple choice over facts and reasoning." },
      { id: "humaneval", label: "HumanEval", title: "HumanEval · code", clean: 55, dirty: 88, sample: "Write a function that reverses a list.", note: "Unit tests check whether the code runs." },
      { id: "gsm8k", label: "GSM8K", title: "GSM8K · math", clean: 72, dirty: 95, sample: "A train travels 60 km/h. How far does it go in 2.5 hours?", note: "Multi-step word problems with numbers." }
    ];
    var step = 0, dirty = false;
    var el = document.createElement("div");
    el.className = "ls-eval-scene";
    el.innerHTML = '<div class="ls-eval-tabs" role="tablist"></div>' +
      '<div class="ls-eval-card"><div class="ls-eval-head"><span class="ls-eval-title"></span><span class="ls-eval-score"></span></div><div class="ls-eval-bar"><i></i></div><p class="ls-eval-sample"></p><p class="ls-eval-note"></p></div>' +
      '<label class="ls-eval-contam"><input type="checkbox" class="ls-eval-dirty"> <span>' + (DE ? "Benchmark war im Training" : "Benchmark was in training") + '</span></label>' +
      '<p class="ls-eval-caveat">' + (DE ? "Schematische Demo, keine Messung. Ein hoher Score kann aus einem Datenleck kommen." : "Schematic demo, not a measurement. A high score can come from a data leak.") + '</p>' +
      '<div class="ls-tokenize-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-eval-prev">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-tokenize-progress ls-eval-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-eval-next">' + (DE ? "Weiter" : "Next") + ' →</button></div>';
    root.appendChild(el);
    var tabs = el.querySelector(".ls-eval-tabs");
    var title = el.querySelector(".ls-eval-title");
    var scoreEl = el.querySelector(".ls-eval-score");
    var bar = el.querySelector(".ls-eval-bar i");
    var sample = el.querySelector(".ls-eval-sample");
    var note = el.querySelector(".ls-eval-note");
    var dirtyEl = el.querySelector(".ls-eval-dirty");
    var prevBtn = el.querySelector(".ls-eval-prev");
    var nextBtn = el.querySelector(".ls-eval-next");
    var progress = el.querySelector(".ls-eval-progress");
    function render() {
      var t = tasks[step];
      tabs.innerHTML = tasks.map(function (task, i) {
        return '<button type="button" class="ls-chip' + (i === step ? ' is-on' : '') + '" data-eval="' + task.id + '" role="tab" aria-selected="' + (i === step ? 'true' : 'false') + '">' + api.esc(task.label) + '</button>';
      }).join("");
      tabs.querySelectorAll("[data-eval]").forEach(function (b) {
        b.addEventListener("click", function () { setStep(tasks.map(function (x) { return x.id; }).indexOf(b.getAttribute("data-eval"))); });
      });
      var score = dirty ? t.dirty : t.clean;
      title.textContent = t.title;
      scoreEl.textContent = score + "%";
      bar.style.width = score + "%";
      sample.textContent = t.sample;
      note.textContent = t.note;
      dirtyEl.checked = dirty;
      progress.textContent = (step + 1) + " / " + tasks.length;
      prevBtn.disabled = step === 0;
      nextBtn.textContent = step === tasks.length - 1 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
    }
    function setStep(i) { step = Math.max(0, Math.min(tasks.length - 1, i)); render(); }
    function nextInternal() { if (step < tasks.length - 1) { setStep(step + 1); return true; } return false; }
    function prevInternal() { if (step > 0) { setStep(step - 1); return true; } return false; }
    function nextStep() {
      if (nextInternal()) return;
      api.goNext();
    }
    function prevStep() {
      if (prevInternal()) return;
      api.goPrev();
    }
    dirtyEl.addEventListener("change", function () { dirty = dirtyEl.checked; render(); });
    prevBtn.addEventListener("click", prevStep);
    nextBtn.addEventListener("click", nextStep);
    render();
    return {
      update: function (s) { if (s && typeof s.task === "number") setStep(s.task); },
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) {
        return api.util.arrowKey(e, nextInternal, prevInternal);
      },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }

  function mediaScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-media-scene";
    el.innerHTML = '<div class="ls-media-tabs" role="tablist">' +
        '<button type="button" class="ls-chip is-on" data-media="search" role="tab" aria-selected="true">' + (DE ? "Suche" : "Search") + '</button>' +
        '<button type="button" class="ls-chip" data-media="chat" role="tab" aria-selected="false">' + (DE ? "Chat" : "Chat") + '</button>' +
        '<button type="button" class="ls-chip" data-media="code" role="tab" aria-selected="false">Code</button>' +
      '</div>' +
      '<div class="ls-media-stage"><div class="ls-media-layer" data-layer="phone"></div><div class="ls-media-layer" data-layer="code" hidden></div></div>' +
      '<div class="ls-tokenize-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-media-prev">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-tokenize-progress ls-media-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-media-next">' + (DE ? "Weiter" : "Next") + ' →</button></div>';
    root.appendChild(el);
    var phoneLayer = el.querySelector('[data-layer="phone"]');
    var codeLayer = el.querySelector('[data-layer="code"]');
    var phoneApi = phoneScene(phoneLayer, api);
    var codeApi = codeScene(codeLayer, api);
    phoneApi.update({ view: "search" });
    var tabs = el.querySelectorAll("[data-media]");
    var prevBtn = el.querySelector(".ls-media-prev");
    var nextBtn = el.querySelector(".ls-media-next");
    var progress = el.querySelector(".ls-media-progress");
    var step = 0;
    codeApi.pause();
    function show(mode) {
      var modeName = mode === "chat" ? "chat" : (mode === "code" ? "code" : "search");
      var isPhone = modeName !== "code";
      step = modeName === "search" ? 0 : (modeName === "chat" ? 1 : 2);
      phoneLayer.hidden = !isPhone;
      codeLayer.hidden = isPhone;
      tabs.forEach(function (b) {
        var on = b.getAttribute("data-media") === modeName;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      if (isPhone) {
        codeApi.pause();
        phoneApi.update({ view: modeName });
        phoneApi.start();
      } else {
        phoneApi.pause();
        codeApi.resize();
        codeApi.start();
      }
      progress.textContent = modeName === "search" ? (DE ? "Suche" : "Search") : (modeName === "chat" ? (DE ? "Chat" : "Chat") : "Code");
      prevBtn.disabled = step === 0;
      nextBtn.textContent = step === 2 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
    }
    function nextInternal() {
      if (step < 2) { show(step === 0 ? "chat" : "code"); return true; }
      return false;
    }
    function prevInternal() {
      if (step > 0) { show(step === 2 ? "chat" : "search"); return true; }
      return false;
    }
    function nextStep() {
      if (nextInternal()) return;
      api.goNext();
    }
    function prevStep() {
      if (prevInternal()) return;
      api.goPrev();
    }
    tabs.forEach(function (b) {
      b.addEventListener("click", function () { show(b.getAttribute("data-media")); });
    });
    prevBtn.addEventListener("click", prevStep);
    nextBtn.addEventListener("click", nextStep);
    show("phone");
    return {
      update: function (s) {
        if (s && s.mode) show(s.mode);
        else if (s && typeof s.step === "number") show(s.step === 0 ? "search" : (s.step === 1 ? "chat" : "code"));
      },
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) {
        return api.util.arrowKey(e, nextInternal, prevInternal);
      },
      pause: function () { phoneApi.pause(); codeApi.pause(); },
      resume: function () { show(step === 0 ? "phone" : "code"); },
      resize: function () { phoneApi.resize(); codeApi.resize(); },
      destroy: function () { phoneApi.destroy(); codeApi.destroy(); el.remove(); }
    };
  }

  function gradientScene(root, api) {
    return window.LossLandscapeScene(root, api);
  }

  function kvcacheScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-kv-scene";
    el.innerHTML = '<div class="ls-kv-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-scene-row"><label class="ls-range">' + (DE ? "Kontext" : "Context") + ' <input type="range" class="ls-kv-tokens" min="512" max="32768" step="512" value="4096"><output>4096</output></label>' +
        '<label class="ls-range">' + (DE ? "Schichten" : "Layers") + ' <input type="range" class="ls-kv-layers" min="12" max="96" step="4" value="32"><output>32</output></label>' +
        '<label class="ls-range">Heads <input type="range" class="ls-kv-heads" min="12" max="128" step="4" value="32"><output>32</output></label>' +
        '<label class="ls-range">Head-Dim <input type="range" class="ls-kv-dim" min="64" max="128" step="64" value="128"><output>128</output></label>' +
      '</div>' +
      '<div class="ls-kv-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-kv-stage");
    var canvas = el.querySelector("canvas");
    var readout = el.querySelector(".ls-kv-readout");
    var tokensEl = el.querySelector(".ls-kv-tokens");
    var layersEl = el.querySelector(".ls-kv-layers");
    var headsEl = el.querySelector(".ls-kv-heads");
    var dimEl = el.querySelector(".ls-kv-dim");
    var tokens = 4096, layers = 32, heads = 32, dim = 128, size = null, ctx = null;
    var C = api.colors();
    function gb(bytes) { return bytes / 1e9; }
    function cacheGB() { return gb(tokens * layers * heads * dim * 2 * 2); }
    function weightGB() { return 14; }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      var w = size.w, h = size.h, pad = 28;
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, h);
      var total = 24;
      var cache = cacheGB(), weights = weightGB();
      var y = h * 0.36;
      ctx.fillStyle = C.line; ctx.fillRect(pad, y, w - pad * 2, 26);
      var cw = Math.min(1, cache / total) * (w - pad * 2);
      var ww = Math.min(1, weights / total) * (w - pad * 2);
      ctx.save();
      ctx.beginPath(); ctx.rect(pad, y, w - pad * 2, 26); ctx.clip();
      ctx.fillStyle = C.green; ctx.fillRect(pad, y, ww, 26);
      ctx.fillStyle = C.gold; ctx.fillRect(pad + ww, y, cw, 26);
      ctx.restore();
      ctx.strokeStyle = C.lineStrong; ctx.strokeRect(pad, y, w - pad * 2, 26);
      ctx.fillStyle = C.ink; ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif'; ctx.textAlign = "left";
      ctx.fillText(DE ? "24 GB GPU" : "24 GB GPU", pad, y - 14);
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.fillStyle = C.green; ctx.fillText(DE ? "Gewichte " + weights.toFixed(1) + " GB" : "weights " + weights.toFixed(1) + " GB", pad, y + 44);
      ctx.fillStyle = C.gold; ctx.fillText("KV-Cache " + cache.toFixed(1) + " GB", pad + ww + 8, y + 44);
      var fits = cache + weights <= total;
      ctx.fillStyle = fits ? C.green : C.coral;
      ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif';
      ctx.fillText(fits ? (DE ? "passt" : "fits") : (DE ? "passt nicht" : "does not fit"), pad, h - 24);
      updateReadout();
    }
    function updateReadout() {
      var cache = cacheGB(), total = cache + weightGB();
      readout.innerHTML = '<span><b>KV</b> ' + cache.toFixed(1) + ' GB</span><span><b>' + (DE ? "Gewichte" : "weights") + '</b> ' + weightGB().toFixed(1) + ' GB</span><span><b>' + (DE ? "gesamt" : "total") + '</b> ' + total.toFixed(1) + ' GB / 24 GB</span>';
    }
    function sync() { tokens = parseInt(tokensEl.value, 10); layers = parseInt(layersEl.value, 10); heads = parseInt(headsEl.value, 10); dim = parseInt(dimEl.value, 10); [tokensEl,layersEl,headsEl,dimEl].forEach(function (x) { x.nextElementSibling.textContent = x.value; }); draw(); }
    [tokensEl,layersEl,headsEl,dimEl].forEach(function (x) { x.addEventListener("input", sync); });
    function resize() { size = api.fit(canvas, stage); draw(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    return { update: function () {}, resize: resize, destroy: function () { window.removeEventListener("resize", resize); el.remove(); } };
  }

  function bookScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-book-scene";
    el.innerHTML = '<div class="ls-book-art"><canvas class="ls-book-canvas" role="img" aria-label="' + (DE ? "Ein aufgeschlagenes Buch mit einem Labyrinth" : "An open book with a labyrinth") + '"></canvas></div>' +
      '<div class="ls-book-page">' +
        '<div class="ls-book-kicker">Borges · Funes el memorioso</div>' +
        '<p class="ls-book-drop">' + (DE ? "Funes erinnert sich an alles: an jeden Stein, jede Wolke, jede Münze. Weil er nichts vergisst, kann er nicht abstrahieren. Borges schreibt, Denken heiße Unterschiede vergessen, verallgemeinern, abstrahieren." : "Funes remembers everything: every stone, every cloud, every coin. Because he forgets nothing, he cannot abstract. Borges writes that thinking means forgetting differences, generalising, abstracting.") + '</p>' +
        '<p>' + (DE ? "Ein Sprachmodell muss nicht alles speichern. Es lernt Strukturen, die viele Fälle zusammenfassen. Wer das nächste Token gut vorhersagt, trägt ein Modell der Daten in sich: Vorhersage wird Kompression." : "A language model does not store everything. It learns structures that summarise many cases. A model that predicts the next token well carries a model of the data inside it: prediction becomes compression.") + '</p>' +
        '<p>' + (DE ? "Lindsey et al. (2025) finden sogar Planung: Vor dem Reimwort hält das Modell mehrere Kandidaten bereit und baut den Satz auf sie zu. Othello-GPT entwickelt aus reinen Zugfolgen ein inneres Brettmodell. Die einfachste Art, richtig vorherzusagen, ist ein gutes inneres Modell." : "Lindsey et al. (2025) even find planning: before the rhyme word, the model holds several candidates and builds the sentence toward one. Othello-GPT develops an internal board model from move sequences alone. The simplest way to predict well is to have a good internal model.") + '</p>' +
      '</div>';
    root.appendChild(el);
    var canvas = el.querySelector(".ls-book-canvas");
    var size = null, ctx = null, C = api.colors();
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#f7f1e3"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = C.petrol; ctx.fillRect(w * .08, h * .10, w * .84, h * .80);
      ctx.fillStyle = "#efe4ca"; ctx.fillRect(w * .12, h * .14, w * .76, h * .72);
      ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.strokeRect(w * .15, h * .17, w * .70, h * .66);
      ctx.strokeStyle = C.petrol; ctx.lineWidth = 1;
      for (var i = 0; i < 8; i++) {
        var y = h * .25 + i * h * .055;
        ctx.beginPath(); ctx.moveTo(w * .22, y); ctx.lineTo(w * .78, y); ctx.stroke();
      }
      ctx.strokeStyle = C.gold; ctx.lineWidth = 2.2;
      var cx = w * .5, cy = h * .54;
      ctx.beginPath();
      for (var k = 0; k < 90; k++) {
        var a = k * .31, r = 5 + k * 1.1;
        var x = cx + Math.cos(a) * r, yy = cy + Math.sin(a) * r * .62;
        if (k === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
    }
    function resize() { size = api.fit(canvas, canvas.parentNode); draw(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    return { update: function () {}, resize: resize, destroy: function () { window.removeEventListener("resize", resize); el.remove(); } };
  }

  function compressScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-compress-scene";
    el.innerHTML = '<div class="ls-compress-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-compress-side"><div class="ls-compress-metrics"><span><b>' + (DE ? "Details" : "details") + '</b><i data-detail></i></span><span><b>' + (DE ? "Muster" : "patterns") + '</b><i data-pattern></i></span><span><b>' + (DE ? "Fehler" : "error") + '</b><i data-error></i></span></div><div class="ls-compress-readout" aria-live="polite"></div></div>' +
      '<div class="ls-compress-controls"><label class="ls-range">' + (DE ? "Kompression" : "Compression") + ' <input type="range" class="ls-compress-range" min="0" max="4" step="0.01" value="0"><output>0.00</output></label><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-compress-auto">' + (DE ? "Automatisch" : "Auto") + '</button></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-compress-stage");
    var canvas = el.querySelector("canvas");
    var side = el.querySelector(".ls-compress-side");
    var range = el.querySelector(".ls-compress-range");
    var out = range.nextElementSibling;
    var readout = el.querySelector(".ls-compress-readout");
    var detailBar = el.querySelector("[data-detail]");
    var patternBar = el.querySelector("[data-pattern]");
    var errorBar = el.querySelector("[data-error]");
    var C = api.colors();
    var palette = [C.green, C.sky, C.gold, C.lilac, C.lime, C.blue, C.teal || C.petrol, C.muted];
    var size = null, ctx = null, t = 0, raf = 0, playing = false;
    var mix = api.util.hexMix;
    var seed = 19;
    function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    var nodes = [], edges = [];
    (function build() {
      var per = 12, clusters = 12;
      for (var c = 0; c < clusters; c++) {
        var cx = (c % 4 + 0.5) / 4;
        var cy = (Math.floor(c / 4) + 0.5) / 3;
        for (var k = 0; k < per; k++) {
          var a = k / per * Math.PI * 2 + rnd() * 0.5;
          var r = 0.08 + rnd() * 0.16;
          nodes.push({ c: c, x0: rnd(), y0: rnd(), cx: cx + Math.cos(a) * r * 0.55, cy: cy + Math.sin(a) * r * 0.42, col: palette[c % palette.length] });
        }
      }
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var same = nodes[i].c === nodes[j].c;
          if (same ? rnd() < 0.42 : rnd() < 0.022) edges.push({ a: i, b: j, same: same });
        }
      }
      clusterCenters = [];
      for (var cc = 0; cc < 12; cc++) {
        var group = nodes.filter(function (n) { return n.c === cc; });
        var sx = 0, sy = 0;
        group.forEach(function (n) { sx += n.x0; sy += n.y0; });
        clusterCenters.push({ x: sx / group.length, y: sy / group.length });
      }
      superCenters = [];
      for (var sg = 0; sg < 4; sg++) {
        var sc = clusterCenters.slice(sg * 3, sg * 3 + 3);
        superCenters.push({ x: (sc[0].x + sc[1].x + sc[2].x) / 3, y: (sc[0].y + sc[1].y + sc[2].y) / 3 });
      }
      center = { x: superCenters.reduce(function (a, p) { return a + p.x; }, 0) / 4, y: superCenters.reduce(function (a, p) { return a + p.y; }, 0) / 4 };
      outer = [];
      for (var oo = 0; oo < 8; oo++) {
        var oa2 = oo / 8 * Math.PI * 2;
        outer.push({ x: center.x + Math.cos(oa2) * 0.34, y: center.y + Math.sin(oa2) * 0.34 });
      }
    })();
    var clusterCenters = [], superCenters = [
      { x: 0.30, y: 0.30 }, { x: 0.70, y: 0.30 }, { x: 0.30, y: 0.70 }, { x: 0.70, y: 0.70 }
    ];
    for (var c = 0; c < 12; c++) clusterCenters.push({ x: 0.18 + (c % 4) * 0.22, y: 0.22 + Math.floor(c / 4) * 0.28 });
    var center = { x: 0.5, y: 0.5 };
    var outer = [];
    for (var o = 0; o < 8; o++) {
      var oa = o / 8 * Math.PI * 2;
      outer.push({ x: 0.5 + Math.cos(oa) * 0.36, y: 0.5 + Math.sin(oa) * 0.36 });
    }
    function lerp(a, b, u) { return a + (b - a) * u; }
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function point(x, y, r, col, alpha) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.globalAlpha = alpha; ctx.fill();
      ctx.strokeStyle = C.paper; ctx.lineWidth = 1; ctx.globalAlpha = alpha; ctx.stroke();
      ctx.globalAlpha = 1;
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h;
      var pad = 28;
      function X(n) { return pad + n.x * (w - pad * 2); }
      function Y(n) { return pad + n.y * (h - pad * 2); }
      ctx.clearRect(0, 0, w, h);
      var bg = ctx.createRadialGradient(w * 0.5, h * 0.48, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
      bg.addColorStop(0, "rgba(252,253,252,1)");
      bg.addColorStop(0.62, "rgba(247,250,249,.96)");
      bg.addColorStop(1, "rgba(255,255,255,.72)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = C.line;
      for (var gx = pad; gx < w - pad; gx += 26) {
        for (var gy = pad; gy < h - pad; gy += 26) {
          ctx.globalAlpha = 0.22;
          ctx.fillRect(gx, gy, 1.1, 1.1);
        }
      }
      ctx.globalAlpha = 1;
      var tt = t;
      var a0 = clamp01(1 - Math.abs(tt - 0));
      var a1 = clamp01(1 - Math.abs(tt - 1));
      var a2 = clamp01(1 - Math.abs(tt - 2));
      var a3 = clamp01(1 - Math.abs(tt - 3));
      var a4 = clamp01(1 - Math.abs(tt - 4));
      var u0 = clamp01(tt);
      var u1 = clamp01(tt - 1);
      var u2 = clamp01(tt - 2);
      var u3 = clamp01(tt - 3);
      function glow(x, y, r, col, alpha) {
        ctx.save();
        ctx.shadowColor = col;
        ctx.shadowBlur = r * 2.6;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.globalAlpha = alpha; ctx.fill();
        ctx.restore();
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1; ctx.globalAlpha = alpha; ctx.stroke();
        ctx.globalAlpha = 1;
      }
      function ring(x, y, r, col, alpha) {
        ctx.save();
        ctx.strokeStyle = col; ctx.globalAlpha = alpha; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      // fibres: the same structure survives every compression level
      nodes.forEach(function (n) {
        var x0 = X({ x: n.x0 }), y0 = Y({ y: n.y0 });
        var cc = clusterCenters[n.c];
        var sc = superCenters[Math.floor(n.c / 3)];
        var x1 = X(cc), y1 = Y(cc), x2 = X(sc), y2 = Y(sc), x3 = X(center), y3 = Y(center);
        ctx.strokeStyle = n.col;
        ctx.globalAlpha = 0.045 + 0.035 * (1 - Math.min(1, tt / 4));
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 6, x1, y1);
        ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - 8, x2, y2);
        ctx.quadraticCurveTo((x2 + x3) / 2, (y2 + y3) / 2 - 6, x3, y3);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      if (tt < 1.4) {
        var crossAlpha = Math.max(0, 0.28 * (1 - tt));
        edges.forEach(function (e) {
          var a = nodes[e.a], b = nodes[e.b];
          var ax = lerp(a.x0, clusterCenters[a.c].x, u0), ay = lerp(a.y0, clusterCenters[a.c].y, u0);
          var bx = lerp(b.x0, clusterCenters[b.c].x, u0), by = lerp(b.y0, clusterCenters[b.c].y, u0);
          var pa = { x: X({x:ax}), y: Y({y:ay}) }, pb = { x: X({x:bx}), y: Y({y:by}) };
          ctx.strokeStyle = e.same ? a.col : C.muted;
          ctx.globalAlpha = e.same ? 0.26 * a0 : crossAlpha;
          ctx.lineWidth = e.same ? 1 : 0.55;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.quadraticCurveTo((pa.x + pb.x) / 2 + (e.same ? 0 : 5), (pa.y + pb.y) / 2 - 4, pb.x, pb.y);
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
        if (a0 > 0.01) nodes.forEach(function (n) {
          var x = lerp(n.x0, clusterCenters[n.c].x, u0), y = lerp(n.y0, clusterCenters[n.c].y, u0);
          glow(X({x:x}), Y({y:y}), 2.4, n.col, a0 * 0.9);
        });
      }
      if (a1 > 0.01) {
        clusterCenters.forEach(function (cc, i) {
          var x = lerp(cc.x, superCenters[Math.floor(i / 3)].x, u1);
          var y = lerp(cc.y, superCenters[Math.floor(i / 3)].y, u1);
          ring(X({x:x}), Y({y:y}), 8, palette[i % palette.length], a1 * 0.6);
          glow(X({x:x}), Y({y:y}), 5.2, palette[i % palette.length], a1);
        });
      }
      if (a2 > 0.01) {
        superCenters.forEach(function (sp) {
          var x = lerp(sp.x, center.x, u2), y = lerp(sp.y, center.y, u2);
          ring(X({x:x}), Y({y:y}), 12, C.petrol, a2 * 0.55);
          glow(X({x:x}), Y({y:y}), 7.5, C.petrol, a2);
        });
      }
      if (a3 > 0.01) {
        var cx0 = X(center), cy0 = Y(center);
        ring(cx0, cy0, 17, C.gold, a3 * 0.62);
        ring(cx0, cy0, 24, C.gold, a3 * 0.26);
        glow(cx0, cy0, 10, C.green, a3);
      }
      if (a4 > 0.01) {
        var cx = X(center), cy = Y(center);
        ring(cx, cy, 20, C.gold, a4 * 0.55);
        ring(cx, cy, 31, C.gold, a4 * 0.28);
        ctx.save();
        ctx.strokeStyle = C.gold; ctx.globalAlpha = a4 * 0.52; ctx.lineWidth = 1.3;
        ctx.setLineDash([4, 4]);
        outer.forEach(function (op) {
          var ox = X(op), oy = Y(op);
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo((cx + ox) / 2, (cy + oy) / 2 - 10, ox, oy); ctx.stroke();
        });
        ctx.restore();
        outer.forEach(function (op) { glow(X(op), Y(op), 4.2, C.gold, a4); });
        // one unseen case: the compressed rule reaches a point that was never stored
        var nw = { x: center.x + 0.30, y: center.y + 0.24 };
        var nx = X(nw), ny = Y(nw);
        ctx.save();
        ctx.strokeStyle = C.green; ctx.globalAlpha = a4 * 0.8; ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo((cx + nx) / 2, (cy + ny) / 2 - 14, nx, ny); ctx.stroke();
        ctx.restore();
        glow(nx, ny, 6, C.green, a4);
        ctx.fillStyle = C.green; ctx.globalAlpha = a4;
        ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(DE ? "neuer Fall" : "new case", nx, ny + 22);
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.muted;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(DE ? "eine Regel, viele Fälle" : "one rule, many cases", cx, cy + 46);
      }
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      var label = tt < 0.5 ? (DE ? "144 Knoten · dichtes Netz" : "144 nodes · dense graph") : tt < 1.5 ? (DE ? "12 Subcluster" : "12 subclusters") : tt < 2.5 ? (DE ? "4 Gruppen" : "4 groups") : tt < 3.5 ? (DE ? "1 Punkt" : "1 point") : (DE ? "eine universelle Regel" : "one universal rule");
      ctx.fillText(label, pad, 18);
      ctx.textAlign = "right";
      ctx.fillText(DE ? "Weiter = verdichten" : "next = compress", w - pad, 18);
      ctx.textAlign = "left";
      ctx.fillStyle = C.petrol;
      ctx.fillText(DE ? "Struktur bleibt · Details fallen" : "structure stays · details fall", pad, h - 8);
      updateReadout();
    }
    function updateReadout() {
      var details = Math.round(nodes.length * Math.max(0, 1 - t / 4));
      var patterns = Math.round(12 * Math.min(1, t / 4));
      var error = Math.pow(t / 4, 1.7) * 0.35;
      readout.innerHTML = '<span><b>' + (DE ? "Stufe" : "level") + '</b> ' + t.toFixed(2) + '</span><span><b>' + (DE ? "Knoten" : "nodes") + '</b> ' + details + '</span><span><b>' + (DE ? "Gruppen" : "groups") + '</b> ' + patterns + '</span>';
      detailBar.style.width = (Math.max(0, 1 - t / 4) * 100).toFixed(0) + '%';
      patternBar.style.width = (Math.min(1, t / 4) * 100).toFixed(0) + '%';
      errorBar.style.width = Math.min(100, error / 0.35 * 100).toFixed(0) + '%';
    }
    range.addEventListener("input", function () { stopAuto(); if (raf) cancelAnimationFrame(raf); raf = 0; playing = false; t = parseFloat(range.value) || 0; out.textContent = t.toFixed(2); draw(); });
    var autoTimers = [];
    function stopAuto() { autoTimers.forEach(clearTimeout); autoTimers = []; }
    el.querySelector(".ls-compress-auto").addEventListener("click", function () {
      stopAuto();
      if (t >= 3.99) t = 0;
      [1, 2, 3, 4].forEach(function (lvl, i) {
        if (lvl <= t) return;
        autoTimers.push(setTimeout(function () { animateTo(lvl); }, i * 1500));
      });
    });
    function resize() { size = api.fit(canvas, stage); draw(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    function animateTo(target) {
      if (playing) { playing = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
      playing = true;
      var start = performance.now(), from = t;
      function step(now) {
        if (!playing) return;
        var k = Math.min(1, (now - start) / 650);
        t = from + (target - from) * k;
        range.value = String(t);
        out.textContent = t.toFixed(2);
        draw();
        if (k < 1) raf = requestAnimationFrame(step); else playing = false;
      }
      raf = requestAnimationFrame(step);
    }
    function nextInternal() {
      stopAuto();
      if (t < 3.99) { animateTo(Math.floor(t + 0.001) + 1); return true; }
      return false;
    }
    function prevInternal() {
      stopAuto();
      if (t > 0.01) { animateTo(Math.ceil(t - 0.001) - 1); return true; }
      return false;
    }
    return {
      update: function () {},
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) {
        return api.util.arrowKey(e, nextInternal, prevInternal);
      },
      resize: resize,
      pause: function () { playing = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
      destroy: function () { if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", resize); el.remove(); }
    };
  }

  var SCENES = {





    embedding: embeddingScene,
    phone: phoneScene,
    code: codeScene,
    media: mediaScene,
    book: bookScene,
    compress: compressScene,
    loop: loopScene,
    tunnel: tunnelScene,
    tokenize: tokenizeScene,
    position: positionScene,
    attention: attentionScene,
    noise: noiseScene,
    ffn: ffnScene,
    residual: residualScene,
    meadow: meadowScene,
    softmax: softmaxScene,
    manifold: manifoldScene,
    animals: animalScene,
    model: function (root, api) { return window.TfSinusScene(root, api); },
    blocks: blocksScene,
    highdim: highdimScene,
    mlp: mlpScene,
    trajectories: trajectoriesScene,
    stack: stackScene,
    activation: activationScene,
    langdata: langdataScene,
    posttrain: posttrainScene,
    eval: evalScene,
    gradient: gradientScene,
    kvcache: kvcacheScene,
    rag: function (root, api) { return window.RagScene(root, api); },
    history: historyScene,
    chineseroom: chineseroomScene
  };

  LearnSys.defineDemo("intuition", function (root, api) {
    var host = document.createElement("div");
    host.className = "ls-scene-host";
    root.appendChild(host);
    var scenes = {};
    var scene = null, name = null;
    function makeLayer(next) {
      var layer = document.createElement("div");
      layer.className = "ls-scene-layer";
      layer.hidden = true;
      host.appendChild(layer);
      var inst = SCENES[next] ? SCENES[next](layer, api) : null;
      return { layer: layer, api: inst };
    }
    function mount(next) {
      if (!scenes[next]) scenes[next] = makeLayer(next);
      Object.keys(scenes).forEach(function (key) {
        if (key === next) return;
        var other = scenes[key];
        if (!other.layer.hidden) {
          other.layer.classList.remove("is-active");
          if (other.api && other.api.pause) { try { other.api.pause(); } catch (e) {} }
          setTimeout(function () {
            if (!other.layer.classList.contains("is-active")) other.layer.hidden = true;
          }, 250);
        }
      });
      var entry = scenes[next];
      entry.layer.hidden = false;
      void entry.layer.offsetWidth;
      entry.layer.classList.add("is-active");
      if (entry.api && entry.api.resume) { try { entry.api.resume(); } catch (e) {} }
      if (entry.api && entry.api.resize) entry.api.resize();
      name = next;
      scene = entry.api;
      if (!scene) {
        entry.layer.innerHTML = '<div class="ls-empty">' + (api.lang === "de" ? "Demo folgt." : "Demo follows.") + '</div>';
      }
    }
    return {
      update: function (s, meta) {
        var next = (s && s.scene) || "embedding";
        if (next !== name) mount(next);
        if (scene && scene.update) scene.update(s || {}, meta);
      },
      preload: function (nextName) {
        if (!nextName || scenes[nextName] || !SCENES[nextName]) return;
        var entry = makeLayer(nextName);
        if (entry.api && entry.api.pause) { try { entry.api.pause(); } catch (e) {} }
        scenes[nextName] = entry;
      },
      resize: function () { if (scene && scene.resize) scene.resize(); },
      pause: function () { if (scene && scene.pause) scene.pause(); },
      resume: function () { if (scene && scene.resume) scene.resume(); },
      next: function () { return scene && scene.next ? scene.next() : false; },
      prev: function () { return scene && scene.prev ? scene.prev() : false; },
      onKey: function (e) { return scene && scene.onKey ? scene.onKey(e) : false; },
      destroy: function () {
        Object.keys(scenes).forEach(function (key) {
          if (scenes[key].api && scenes[key].api.destroy) { try { scenes[key].api.destroy(); } catch (e) {} }
        });
        scenes = {};
        scene = null;
      }
    };
  }, { tier: 1, label: "Intuition", staticLayer: false });
})();
