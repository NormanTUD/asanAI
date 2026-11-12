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
      '<div class="ls-embed-stage"><canvas class="ls-canvas" role="img"></canvas><div class="ls-embed-mini-table" hidden aria-hidden="true"></div></div>' +
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
    var mathEl = formula.querySelector(".ls-math");
    var ctx = null, size = null, raf = 0, last = 0, reserveTimer = 0;
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
    function wordLabel(id) { return text(WORDS[id].label); }
    function buildMiniTable() {
      if (!miniTable) return;
      var ids = ["king", "queen", "man", "woman"];
      var cols = 5;
      function value(ti, j) {
        var x = Math.sin((ti + 1) * 12.9898 + (j + 1) * 78.233) * 43758.5453;
        x = x - Math.floor(x);
        return (x * 2 - 1).toFixed(2);
      }
      var head = '<tr><th></th>';
      for (var j = 0; j < cols; j++) head += '<th>d' + (j + 1) + '</th>';
      head += '<th>…</th></tr>';
      var body = ids.map(function (id, ti) {
        var cells = "";
        for (var k = 0; k < cols; k++) cells += "<td>" + value(ti, k) + "</td>";
        return "<tr><th>" + api.esc(wordLabel(id)) + "</th>" + cells + "<td>…</td></tr>";
      }).join("");
      miniTable.innerHTML = '<div class="ls-embed-mini-head">' + (DE ? "Ausschnitt: 5 von 4096 Dimensionen" : "Slice: 5 of 4096 dimensions") + '</div><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table>';
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
      var yMix = clamp(dimMix, 0, 1);
      var zMix = clamp(dimMix - 1, 0, 1);
      var yaw = st.yaw * zMix;
      var pitch = st.pitch * zMix;
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
      var yMix = clamp(dimMix, 0, 1);
      var zMix = clamp(dimMix - 1, 0, 1);
      if (zMix > 0.02) drawRoomGrid(zMix);
      if (dimMix > 0.05 && zMix < 0.98) {
        ctx.globalAlpha = 1 - zMix;
        drawPlaneGrid();
        ctx.globalAlpha = 1;
      }
      if (dimMix < 0.05) {
        var axisA = project(-1.15, 0, 0);
        var axisB = project(1.15, 0, 0);
        drawLine3D(axisA, axisB, .16);
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
      var groupAlpha = 1 - clamp(dimMix / 0.5, 0, 1);
      var individualAlpha = clamp(dimMix / 0.5, 0, 1);

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

      if (dimMix < 0.05) {
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
      }
      if (dimMix > 0.95 && !dirMode) {
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
        freePath("man", "woman");
        freePath("king", "queen");
        ctx.fillStyle = C.green;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(DE ? "2D: freie Wege" : "2D: free paths", size.w / 2, size.h - 16);
      }

      if (dimMix > 1.5) {
        ctx.fillStyle = C.green;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(DE ? "Jedes Wort ist eine Richtung vom Ursprung" : "Every word is a direction from the origin", size.w / 2, size.h - 16);
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
    function renderControls() {
      controls.innerHTML = "";
      var row1 = document.createElement("div");
      row1.className = "ls-scene-row";
      row1.appendChild(makeChip(DE ? "Temperatur" : "Temperature", st.mode === "temperature", function () {
        st.mode = "temperature"; st.group = null; syncControls(); draw(); ensureLoop();
      }));
      row1.appendChild(makeChip(DE ? "Bedeutung" : "Meaning", st.mode === "space", function () {
        st.mode = "space"; syncControls(); draw(); ensureLoop();
      }));
      if (st.mode === "space") {
        ["1D", "2D", "3D"].forEach(function (label, i) {
          row1.appendChild(makeChip(label, st.dim === i, function () {
            st.dim = i; dimTarget = i; st.group = null; syncControls(); ensureLoop();
          }));
        });
        var reset = document.createElement("button");
        reset.type = "button";
        reset.className = "ls-btn ls-btn--ghost ls-btn--tiny";
        reset.textContent = DE ? "Ansicht" : "View";
        reset.addEventListener("click", function () { st.yaw = -0.55; st.pitch = 0.78; st.zoom = 1; draw(); });
        row1.appendChild(reset);
      }
      if (miniTable) miniTable.hidden = !st.tables;
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
    function scheduleReserve() {
      clearTimeout(reserveTimer);
      reserveTimer = setTimeout(reserveHeights, 140);
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
        dimMix += (dimTarget - dimMix) * 0.18;
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
    renderControls();
    resize();
    reserveHeights();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reserveHeights);
    return {
      update: function (s) { applyState(s || {}); },
      resize: resize,
      destroy: function () {
        if (raf) cancelAnimationFrame(raf);
        clearTimeout(reserveTimer);
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
        '<div class="ia-phone" id="ia-phone">' +
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
        '</div>' +
        '<div class="ia-waveform" id="ia-waveform" aria-hidden="true">' +
          '<div class="ia-bar"></div><div class="ia-bar"></div><div class="ia-bar"></div>' +
          '<div class="ia-bar"></div><div class="ia-bar"></div><div class="ia-bar"></div>' +
          '<div class="ia-bar"></div><div class="ia-bar"></div><div class="ia-bar"></div>' +
          '<div class="ia-bar"></div><div class="ia-bar"></div>' +
        '</div>' +
      '</div>';
    root.appendChild(el);
    var stage = el.querySelector(".ia-stage");
    var phone = el.querySelector(".ia-phone");
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
    function play() {
      reset();
      buildLogo();
      buildSerp();
      if (reduce) {
        searchText.textContent = SATZ;
        setCentered(false);
        card.classList.add("on");
        typeAnswer();
        serp.classList.add("on");
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
          }, 240);
        }, 320);
      });
    }
    function fit() {
      var r = stage.getBoundingClientRect();
      var scale = Math.min((r.width - 60) / 360, (r.height - 60) / 600);
      phone.style.transform = "scale(" + scale.toFixed(3) + ")";
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
    fit();
    return {
      update: function () {},
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
      "# Rayleigh-Streuung in Luft",
      "k_B = 1.380649e-23   # J/K",
      "",
      "def scattering(wavelength, pressure, temperature):",
      "    density = pressure / (k_B * temperature)",
      "    return density / wavelength ** 4",
      "",
      "blue = scattering(450e-9, 1e5, 293)",
      "red  = scattering(650e-9, 1e5, 293)",
      'print(f"Blau wird {blue / red:.2f}× stärker gestreut als Rot")'
    ] : [
      "# Rayleigh scattering in air",
      "k_B = 1.380649e-23   # J/K",
      "",
      "def scattering(wavelength, pressure, temperature):",
      "    density = pressure / (k_B * temperature)",
      "    return density / wavelength ** 4",
      "",
      "blue = scattering(450e-9, 1e5, 293)",
      "red  = scattering(650e-9, 1e5, 293)",
      'print(f"Blue is {blue / red:.2f}x more strongly scattered than red")'
    ];
    var outText = DE ? "Blau wird 4,35× stärker gestreut als Rot." : "Blue is 4.35× more strongly scattered than red.";
    var el = document.createElement("div");
    el.className = "ls-code-scene";
    el.innerHTML =
      '<div class="ls-code-window"><div class="ls-code-bar"><i></i><i></i><i></i><span>' + (DE ? "himmel.py" : "sky.py") + '</span></div>' +
        '<div class="ls-code-chat"><div class="ls-code-msg is-user">' + (DE ? "Schreibe ein Python-Programm, das berechnet, wie stark blaues und rotes Licht in der Atmosphäre gestreut werden." : "Write a Python program that calculates how strongly blue and red light are scattered in the atmosphere.") + '</div><div class="ls-code-msg is-ai">' + (DE ? "Klar. Das Programm berechnet das Rayleigh-Streuungsverhältnis für 450 nm und 650 nm." : "Sure. The program computes the Rayleigh scattering ratio for 450 nm and 650 nm.") + '</div></div>' +
        '<pre class="ls-code-body"><code></code></pre></div>' +
      '<div class="ls-code-terminal"><div class="ls-code-bar"><i></i><i></i><i></i><span>Terminal</span></div><div class="ls-code-term"><b class="ls-code-command"></b><span></span></div></div>' +
      '<button type="button" class="ls-btn ls-btn--tiny ls-code-replay">' + (DE ? "Nochmal" : "Replay") + '</button>';
    root.appendChild(el);
    var codeEl = el.querySelector(".ls-code-body code");
    var commandEl = el.querySelector(".ls-code-command");
    var term = el.querySelector(".ls-code-term span");
    var tokens = [];
    codeText.forEach(function (line, li) {
      line.split(/(\s+)/).forEach(function (part) {
        if (part) tokens.push({ text: part, line: li });
      });
      tokens.push({ text: "\n", line: li });
    });
    var spans = tokens.map(function (t) {
      var span = document.createElement("span");
      span.className = "ls-code-token";
      span.textContent = t.text;
      codeEl.appendChild(span);
      return span;
    });
    var timers = [];
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function reset() {
      clearTimers();
      spans.forEach(function (s) { s.classList.remove("is-visible"); });
      commandEl.textContent = "";
      term.textContent = "";
      function typeCommand() {
        var cmd = "$ " + (DE ? "python3 himmel.py" : "python3 sky.py");
        var j = 0;
        function step() {
          j += 1;
          commandEl.textContent = cmd.slice(0, j);
          if (j < cmd.length) timers.push(setTimeout(step, 16));
          else timers.push(setTimeout(function () { term.textContent = outText; }, 220));
        }
        step();
      }
      var i = 0;
      function typeNext() {
        if (i >= spans.length) {
          timers.push(setTimeout(typeCommand, 180));
          return;
        }
        spans[i].classList.add("is-visible");
        var delay = /^\s+$/.test(tokens[i].text) ? 0 : 28;
        i++;
        timers.push(setTimeout(typeNext, delay));
      }
      timers.push(setTimeout(typeNext, 380));
    }
    el.querySelector(".ls-code-replay").addEventListener("click", reset);
    reset();
    return {
      update: function () {},
      resize: function () {},
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
      '<div class="ls-loop-viz"><div class="ls-loop-bars"></div><div class="ls-loop-landscape" hidden><canvas class="ls-canvas" role="img"></canvas></div></div>' +
      '<div class="ls-scene-row ls-loop-modes"></div>' +
      '<div class="ls-scene-row ls-loop-actions"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-loop-back" aria-label="' + (DE ? "Letztes Token zurücknehmen" : "Take back the last token") + '">' + (DE ? "← Zurück" : "← Back") + '</button><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-loop-next">' + (DE ? "Weiter →" : "Next →") + '</button><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-loop-reset">' + (DE ? "Neu" : "Reset") + '</button><label class="ls-range">T <input type="range" class="ls-loop-temp" min="0.05" max="1.8" step="0.05" value="0.8"><output>0.80</output></label></div>' +
      '<div class="ls-loop-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var sentenceEl = el.querySelector(".ls-loop-sentence");
    var treeEl = el.querySelector(".ls-loop-tree");
    var barsEl = el.querySelector(".ls-loop-bars");
    var readout = el.querySelector(".ls-loop-readout");
    var tempEl = el.querySelector(".ls-loop-temp");
    var tempOut = el.querySelector(".ls-loop-actions output");
    var nextBtn = el.querySelector(".ls-loop-next");
    var backBtn = el.querySelector(".ls-loop-back");
    var landEl = el.querySelector(".ls-loop-landscape");
    var landCanvas = landEl.querySelector("canvas");
    var landscape = true, landSize = null;
    var landYaw = -0.62, landPitch = 0.92, landZoom = 1;
    var landDrag = null, landMoved = false, landHits = [];
    var landBall = { x: 0, y: 0, init: false, animating: false };
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
    var lastPath = [], lastProbs = null, lastTop = null;
    var LAND_X = 2.65, LAND_Y = 1.9;

    var PLANE_Z = 1.04;
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
      var sigma2 = 0.04;
      var value = 0, weight = 0;
      wells.forEach(function (w) {
        var dx = x - w.x, dy = y - w.y;
        var k = Math.exp(-(dx * dx + dy * dy) / (2 * sigma2));
        value += k * w.p;
        weight += k;
      });
      var base = landBase(x, y);
      var coverage = Math.min(1, weight);
      var blended = (value + base * (1 - coverage)) / (weight + (1 - coverage));
      return Math.max(BASE_PROB, Math.min(0.995, blended));
    }

    // z = 1 − p: hohe Wahrscheinlichkeit liegt tief, die Fläche ist eine Verlustlandschaft.
    function landZ(p) { return Math.max(0, Math.min(1, 1 - p)); }

    function landRaw(x, y, z) {
      var cy = Math.cos(landYaw), sy = Math.sin(landYaw);
      var cp = Math.cos(landPitch), sp = Math.sin(landPitch);
      var x1 = x * cy - y * sy;
      var y1 = x * sy + y * cy;
      var y2 = y1 * cp + z * sp;
      var z2 = y1 * sp + z * cp;
      return { x: x1, y: -y2, z: z2 };
    }

    function landColor(p, C) {
      var loss = 1 - p;
      if (loss > 0.6) return C.lilac;
      if (loss > 0.3) return C.sky;
      if (loss > 0.1) return C.lime;
      return C.green;
    }

    function drawLandscape() {
      if (!landscape || !landSize) return;
      var C = api.colors();
      var ctx = landSize.ctx, w = landSize.w, h = landSize.h;
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
      var wells = landWells(items.filter(function (it) { return it.known; })).concat(pathWells);
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
      quads.sort(function (a, b) { return a.z - b.z; });
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

      // z-Achse: Verlust von 0 bis 1.
      var ab = landRaw(axisX, axisY, 0), at = landRaw(axisX, axisY, 1);
      ctx.strokeStyle = C.lineStrong;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sx(ab.x), sy(ab.y)); ctx.lineTo(sx(at.x), sy(at.y)); ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      [0, 0.25, 0.5, 0.75, 1].forEach(function (loss) {
        var tick = landRaw(axisX, axisY, loss);
        var tick2 = landRaw(axisX + 0.08, axisY, loss);
        var tx = sx(tick.x), ty = sy(tick.y);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(sx(tick2.x), sy(tick2.y)); ctx.stroke();
        ctx.fillText(Math.round(loss * 100) + "%", tx + 6, ty + 3);
      });
      ctx.fillStyle = C.petrol;
      ctx.font = '600 ' + api.font("canvas") + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "Verlust" : "loss", sx(at.x) + 6, sy(at.y) - 4);

      var atEnd = generated.length >= MAX_STEPS;
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(DE ? "z = 1 − p · Fläche = Verlust" : "z = 1 − p · surface = loss", 10, 16);
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
        if (!atEnd) landHits.push({ x: surfX - 12, y: surfY - 12, w: 24, h: 24, t: it.t });

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
            ctx.fillStyle = C.muted;
            ctx.globalAlpha = 0.72;
            ctx.textAlign = "left";
            ctx.fillText(it.t, bx, by + 10);
            ctx.globalAlpha = 1;
            break;
          }
        }
      });

      var ballTarget = null;
      if (generated.length) {
        var lastIdx = generated.length - 1;
        var lastToken = generated[lastIdx];
        var lastCat = catalogByToken[lastToken];
        if (lastCat) {
          var lastP = probByToken[lastToken];
          if (lastP == null && pathProb[lastIdx] != null) lastP = pathProb[lastIdx];
          ballTarget = { x: lastCat.x, y: lastCat.y, p: lastP == null ? BASE_PROB : lastP };
        }
      }
      if (!ballTarget && top) ballTarget = top;
      if (ballTarget) {
        var ballP = landProb(ballTarget.x, ballTarget.y, wells);
        var ballPt = landRaw(ballTarget.x, ballTarget.y, landZ(ballP));
        var btx = sx(ballPt.x), bty = sy(ballPt.y);
        if (!landBall.init) { landBall.x = btx; landBall.y = bty; landBall.init = true; }
        var bdx = btx - landBall.x, bdy = bty - landBall.y;
        if (Math.abs(bdx) + Math.abs(bdy) > 1.2) {
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
      if (top) {
        if (readout) {
          var cells = readout.querySelectorAll("span");
          if (cells[2]) cells[2].innerHTML = (DE ? "Top" : "Top") + ' <b>' + api.esc(top.t) + '</b>';
        }
        landCanvas.setAttribute("aria-label", DE
          ? "Verlustlandschaft. Token-Ebene oben, z = 1 − p. Tiefster Punkt, also höchste Wahrscheinlichkeit: " + top.t + ", " + (top.p * 100).toFixed(0) + " Prozent."
          : "Loss landscape. Token plane above, z = 1 − p. Deepest point, meaning highest probability: " + top.t + ", " + (top.p * 100).toFixed(0) + " percent.");
      } else {
        landCanvas.setAttribute("aria-label", DE
          ? "Verlustlandschaft. Der Satz ist beendet, das Modell hat <|endoftext|> ausgegeben."
          : "Loss landscape. The sentence is finished; the model emitted <|endoftext|>.");
      }
    }

    function landResize() {
      if (!landscape) return;
      var r = landEl.getBoundingClientRect();
      if (r.width < 10 || r.height < 10) return;
      landSize = api.fit(landCanvas, landEl);
      drawLandscape();
    }

    function setLandscape(on) {
      landscape = !!on;
      el.classList.toggle("is-landscape", landscape);
      landEl.hidden = !landscape;
      if (!landscape) landBall.animating = false;
      if (landscape) {
        if (!landSize) landSize = api.fit(landCanvas, landEl);
        drawLandscape();
        requestAnimationFrame(landResize);
      }
    }

    function landHitAt(x, y) {
      for (var i = 0; i < landHits.length; i++) {
        var b = landHits[i];
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
      }
      return null;
    }

    function landPointer(e) {
      var r = landCanvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    landCanvas.addEventListener("pointerdown", function (e) {
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
        landPitch = Math.min(1.35, Math.max(0.42, landDrag.pitch - dy * 0.006));
        drawLandscape();
        return;
      }
      landCanvas.style.cursor = landHitAt(p.x, p.y) ? "pointer" : "grab";
    });
    landCanvas.addEventListener("pointerup", function (e) {
      if (landDrag && !landMoved) {
        var p = landPointer(e);
        var hit = landHitAt(p.x, p.y);
        if (hit) choose(hit.t);
      }
      landDrag = null;
    });
    landCanvas.addEventListener("pointercancel", function () { landDrag = null; });
    landCanvas.addEventListener("pointerleave", function () { if (!landDrag) landCanvas.style.cursor = "grab"; });

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
      barsEl.innerHTML = opts.map(function (o, i) {
        var on = decodeMode === "greedy" ? i === top : (decodeMode === "topp" && probs[i] >= probs[cut]);
        return '<button type="button" class="ls-loop-bar' + (on ? " is-on" : "") + '" data-bar="' + i + '"' +
          (atEnd ? ' disabled' : '') + '>' +
          '<span class="ls-loop-bar-label">' + api.esc(o.t) + '</span>' +
          '<span class="ls-loop-bar-track"><i style="width:' + (probs[i] * 100).toFixed(1) + '%"></i></span>' +
          '<span class="ls-loop-bar-val">' + (probs[i] * 100).toFixed(0) + '%</span></button>';
      }).join("");
      barsEl.querySelectorAll("[data-bar]").forEach(function (b) {
        b.addEventListener("click", function () { choose(opts[parseInt(b.getAttribute("data-bar"), 10)].t); });
      });
      if (nextBtn) {
        nextBtn.disabled = atEnd || !choicesFor().length;
        nextBtn.textContent = (atEnd || !choicesFor().length) ? (DE ? "Fertig" : "Done") : (DE ? "Weiter →" : "Next →");
      }
      readout.innerHTML = '<span>' + (DE ? "Schritt" : "Step") + ' <b>' + generated.length + ' / ' + MAX_STEPS + '</b></span><span>' + (DE ? "Kontext" : "Context") + ' <b>' + (base.length + generated.length) + '</b></span><span>' + (DE ? "Top" : "Top") + ' <b>' + api.esc(opts[top] ? opts[top].t : "—") + '</b></span><span>' + (DE ? "Modus" : "Mode") + ' <b>' + decodeMode + '</b></span>' +
        (atEnd ? '<span>' + (DE ? "Satzende · <|endoftext|>" : "end of sentence · <|endoftext|>") + '</span>' : '');
      publish();
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
      var alts = opts.map(function (o) { return { token: o.t, logit: o.l }; });
      var probs = softmax(opts.map(function (o) { return o.l; }), temp);
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
        path: lastPath.map(function (p) { return { t: p.t, px: p.px, py: p.py, sx: p.sx, sy: p.sy, p: p.p }; }),
        probs: lastProbs,
        knownProbs: knownProbs,
        top: lastTop ? lastTop.t : null,
        topP: lastTop ? lastTop.p : null,
        zTop: lastTop ? landZ(lastTop.p) : null,
        temp: temp,
        tempShown: tempShown,
        revealed: revealed.length,
        landscape: landscape
      };
    };
    return {
      update: function (s, meta) {
        if (meta && meta.dir < 0) undo();
        else if (meta && meta.dir > 0) redo();
        if (!s) return;
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
      destroy: function () { el.remove(); }
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
    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
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
      sentence: { label: "Der Transformer spielt großartig", value: "Der Transformer spielt großartig" }
    } : {
      understanding: { label: "understanding", value: "understanding" },
      unbreakable: { label: "unbreakable", value: "unbreakable" },
      sentence: { label: "The transformer is playing greatly", value: "The transformer is playing greatly" }
    };
    var splits = DE ? {
      "verständnis": ["ver", "ständ", "nis"],
      "unzerbrechlich": ["un", "zerbrech", "lich"],
      "spielt": ["spiel", "t"],
      "großartig": ["groß", "artig"]
    } : {
      "understanding": ["un", "der", "stand", "ing"],
      "unbreakable": ["un", "break", "able"],
      "playing": ["play", "ing"],
      "greatly": ["great", "ly"]
    };
    var colors = ["#63a44b", "#5c9baf", "#9f9700", "#9185be", "#869b55", "#1275ac", "#009299", "#92a19a"];
    var el = document.createElement("div");
    el.className = "ls-tokenize-scene";
    el.innerHTML = '<div class="ls-scene-row ls-tokenize-samples"><span class="ls-tokenize-label">' + (DE ? "Beispiele" : "Samples") + '</span></div><div class="ls-tokenize-chips" aria-live="polite"></div><div class="ls-tokenize-stats"></div><p class="ls-tokenize-note">' + (DE ? "Ein Token ist ein Stück Text, kein Wort. Die ID ist die Adresse in der Embedding-Tabelle." : "A token is a piece of text, not a word. The ID is the address in the embedding table.") + '</p>';
    root.appendChild(el);
    var samples = el.querySelector(".ls-tokenize-samples");
    var chips = el.querySelector(".ls-tokenize-chips");
    var stats = el.querySelector(".ls-tokenize-stats");
    var value = examples.sentence.value;
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
    function render() {
      var tokens = tokenize(value);
      chips.innerHTML = tokens.map(function (tok, i) {
        return '<span class="ls-token-chip' + (tok.sub ? " is-sub" : "") + (tok.space ? " is-space" : "") + '" style="--token-color:' + colors[i % colors.length] + '"><b>' + api.esc(tok.word) + '</b><small>id ' + tok.id + '</small></span>';
      }).join("");
      var spaces = tokens.filter(function (t) { return t.space; }).length;
      var subs = tokens.filter(function (t) { return t.sub; }).length;
      stats.innerHTML = '<span><b>' + tokens.length + '</b> ' + (DE ? "Tokens" : "tokens") + '</span><span><b>' + (tokens.length - spaces) + '</b> ' + (DE ? "Teile" : "pieces") + '</span><span><b>' + subs + '</b> ' + (DE ? "Subword-Splits" : "subword splits") + '</span><span><b>' + spaces + '</b> ' + (DE ? "Leerzeichen" : "whitespace") + '</span>';
    }
    Object.keys(examples).forEach(function (key) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-chip" + (key === "sentence" ? " is-on" : "");
      b.textContent = examples[key].label;
      b.addEventListener("click", function () {
        value = examples[key].value;
        samples.querySelectorAll(".ls-chip").forEach(function (x) { x.classList.remove("is-on"); });
        b.classList.add("is-on");
        render();
      });
      samples.appendChild(b);
    });
    render();
    return { update: function () {}, resize: function () {}, destroy: function () { el.remove(); } };
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
      '<div class="ls-scene-row"><label class="ls-range">' + (DE ? "Kontext" : "Context") + ' <input type="range" class="ls-pos-context" min="16" max="128" step="8" value="64"><output>64</output></label><label class="ls-range">' + (DE ? "Dimensionen" : "Dimensions") + ' <input type="range" class="ls-pos-dims" min="2" max="64" step="2" value="24"><output>24</output></label><label class="ls-range">Position <input type="range" class="ls-pos-pos" min="0" max="10000" step="1" value="7"><output>7</output></label></div>' +
      '<div class="ls-scene-row ls-position-metric"><button type="button" class="ls-chip" data-metric="euclid">' + (DE ? "Euklid" : "Euclidean") + '</button><button type="button" class="ls-chip is-on" data-metric="angle">' + (DE ? "Winkel / Großkreis" : "Angle / great circle") + '</button><button type="button" class="ls-chip is-on" data-rotate="1">' + (DE ? "Drehen" : "Rotate") + '</button></div>' +
      '<div class="ls-position-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var heat = el.querySelector(".ls-position-heat");
    var curve = el.querySelector(".ls-position-curve");
    var contextEl = el.querySelector(".ls-pos-context");
    var dimsEl = el.querySelector(".ls-pos-dims");
    var posEl = el.querySelector(".ls-pos-pos");
    var readout = el.querySelector(".ls-position-readout");
    var context = 64, dims = 24, pos = 7, metric = "angle", rotate = true;
    var posAnim = pos;
    var heatSize = null, curveSize = null, yaw = -0.6, pitch = 0.5, drag = null, raf = 0, last = 0;
    var C = api.colors();
    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
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
    function mix(a, b, t) {
      function rgb(h) { h = h.replace("#", ""); return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]; }
      var A = rgb(a), B = rgb(b);
      return "rgb(" + Math.round(A[0] + (B[0]-A[0])*t) + "," + Math.round(A[1] + (B[1]-A[1])*t) + "," + Math.round(A[2] + (B[2]-A[2])*t) + ")";
    }
    function project(x, y, z) {
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var x1 = x * cy - y * sy, y1 = x * sy + y * cy;
      var y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;
      var s = Math.min(curveSize.w * 0.45, curveSize.h * 0.36) / (1 + z2 * 0.25);
      return { x: curveSize.w / 2 + x1 * s, y: curveSize.h / 2 - y2 * s, z: z2 };
    }
    function curvePoint(t) {
      return [Math.sin(t), Math.cos(t), Math.sin(t / Math.pow(10000, 2 / 3))];
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
      var maxT = Math.max(1.6, Math.min(60, posAnim * 0.14));
      var prev = null;
      for (k = 0; k <= 260; k++) {
        var t = maxT * k / 260;
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
      var cur = curvePoint(posAnim * 0.14);
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
      ctx.fillStyle = Cc.muted; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; ctx.textAlign = "left";
      ctx.fillText((DE ? "Position " : "position ") + pos, 12, 18);
      ctx.textAlign = "right";
      ctx.fillText(metric === "euclid"
        ? (DE ? "Gerade im Raum" : "straight line in space")
        : (DE ? "Großkreis auf der Einheitskugel" : "great circle on the unit sphere"), w - 12, 18);
      ctx.textAlign = "left";
      ctx.fillText(metric === "euclid" ? (DE ? "Länge" : "length") : (DE ? "Großkreis" : "great circle"), cp.x + 10, cp.y + 3);
      var chordLen = Math.hypot(cur[0], cur[1], cur[2]);
      var geoLen = metric === "angle" ? theta : chordLen;
      var angleDeg = (metric === "angle" ? theta : Math.acos(Math.max(-1, Math.min(1, cur[0] / (chordLen || 1))))) * 180 / Math.PI;
      readout.innerHTML = '<span>' + (DE ? "Position" : "Position") + ' <b>' + pos + '</b></span><span>' + (DE ? "Vektor" : "vector") + ' <b>(' + cur.map(function (x) { return x.toFixed(2); }).join(", ") + ')</b></span><span>' + (metric === "angle" ? (DE ? "Großkreis" : "great circle") : (DE ? "Länge" : "length")) + ' <b>' + geoLen.toFixed(3) + '</b></span><span>' + (DE ? "Winkel" : "angle") + ' <b>' + angleDeg.toFixed(1) + '°</b></span>';
    }
    function draw() {
      drawHeat(); drawCurve();
    }
    function resizeHeat() { heatSize = api.fit(heat, heat); drawHeat(); }
    function resizeCurve() { curveSize = api.fit(curve, curve); drawCurve(); }
    function resize() { resizeHeat(); resizeCurve(); draw(); }
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
    dimsEl.addEventListener("input", function () { dims = parseInt(dimsEl.value, 10); dimsEl.nextElementSibling.textContent = String(dims); drawHeat(); drawCurve(); });
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
    resize();
    raf = requestAnimationFrame(loop);
    return { update: function () {}, resize: resize, destroy: function () { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); el.remove(); } };
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
    var baseTokens = DE ? ["Ich", "gehe", "zur", "Bank", "."] : ["I", "walk", "to", "the", "bank", "."];
    var contexts = [
      { id: "none", sentence: DE ? "Ich gehe zur Bank." : "I walk to the bank.", token: DE ? "∅" : "∅", color: "muted" },
      { id: "river", sentence: DE ? "Der Fluss ist tief. Ich gehe zur Bank." : "The river is deep. I walk to the bank.", token: DE ? "Fluss" : "river", color: "blue" },
      { id: "money", sentence: DE ? "Ich brauche Geld. Ich gehe zur Bank." : "I need money. I walk to the bank.", token: DE ? "Geld" : "money", color: "gold" },
      { id: "both", sentence: DE ? "Der Fluss kostet Geld. Ich gehe zur Bank." : "The river costs money. I walk to the bank.", token: DE ? "Fluss+Geld" : "money+river", color: "lilac" }
    ];
    var EMB = DE ? {
      "∅": [-0.45, 0.22],
      "Fluss": [1.8, 1.0],
      "Geld": [1.8, -1.0],
      "Fluss+Geld": [1.8, 0],
      "Ich": [-1.05, 0.55],
      "gehe": [-0.55, -0.2],
      "zur": [-0.1, -0.7],
      "Bank": [0.25, 0],
      ".": [-1.05, -0.8]
    } : {
      "∅": [-0.45, 0.22],
      "river": [1.8, 1.0],
      "money": [1.8, -1.0],
      "money+river": [1.8, 0],
      "I": [-1.05, 0.55],
      "walk": [-0.55, -0.2],
      "to": [-0.1, -0.75],
      "the": [-0.45, -0.9],
      "bank": [0.25, 0],
      ".": [-1.05, -0.8]
    };
    var context = "none";
    var selected = baseTokens.length - 1;
    var causal = false;
    var el = document.createElement("div");
    el.className = "ls-att-scene";
    el.innerHTML =
      '<div class="ls-att-sentences" role="group"></div>' +
      '<div class="ls-att-stage"><canvas class="ls-att-graph" role="img"></canvas></div>' +
      '<div class="ls-att-vector"><canvas class="ls-att-vector-canvas" role="img"></canvas></div>' +
      '<div class="ls-att-matrix" aria-live="polite"></div>' +
      '<div class="ls-att-formula" aria-live="polite"></div>' +
      '<details class="ls-att-mask"><summary>' + (DE ? "Causal Mask" : "Causal mask") + '</summary>' +
        '<label><input type="checkbox" class="ls-att-causal"> ' + (DE ? "nur vergangene Tokens beachten" : "attend only to past tokens") + '</label>' +
        '<p>' + (DE ? "Wähle ein früheres Wort in der Tabelle, um den Unterschied zu sehen. Beim letzten Token ändert die Maske nichts." : "Select an earlier word in the table to see the difference. On the last token the mask changes nothing.") + '</p>' +
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
    var readout = el.querySelector(".ls-att-readout");
    var C = api.colors();
    var graphSize = null, vectorSize = null, graphHits = [];
    var animRow = null, animFrom = null, animTo = null, animStart = 0, animRaf = 0;

    function contextObj() {
      return contexts.filter(function (x) { return x.id === context; })[0] || contexts[0];
    }
    function tokens() { return [contextObj().token].concat(baseTokens); }
    function bankIdx() { return tokens().length - 2; }
    function normalize(row) {
      var s = row.reduce(function (a, b) { return a + b; }, 0) || 1;
      return row.map(function (v) { return v / s; });
    }
    function bankRow(ctx) {
      if (DE) {
        if (ctx === "none") return [0.00, 0.06, 0.06, 0.04, 0.72, 0.12];
        if (ctx === "river") return [0.18, 0.02, 0.02, 0.04, 0.70, 0.04];
        if (ctx === "money") return [0.20, 0.02, 0.01, 0.04, 0.70, 0.03];
        return [0.19, 0.02, 0.01, 0.04, 0.70, 0.04];
      }
      if (ctx === "none") return [0.00, 0.04, 0.04, 0.03, 0.04, 0.72, 0.13];
      if (ctx === "river") return [0.18, 0.02, 0.02, 0.03, 0.03, 0.70, 0.02];
      if (ctx === "money") return [0.20, 0.02, 0.01, 0.02, 0.03, 0.70, 0.02];
      return [0.19, 0.02, 0.01, 0.02, 0.03, 0.70, 0.03];
    }
    function ctxRowFor(ctx) {
      if (DE) {
        if (ctx === "none") return [0.55, 0.10, 0.08, 0.05, 0.17, 0.05];
        if (ctx === "river") return [0.30, 0.02, 0.02, 0.03, 0.58, 0.05];
        if (ctx === "money") return [0.28, 0.02, 0.02, 0.03, 0.60, 0.05];
        return [0.29, 0.02, 0.02, 0.03, 0.59, 0.05];
      }
      if (ctx === "none") return [0.55, 0.06, 0.05, 0.04, 0.05, 0.20, 0.05];
      if (ctx === "river") return [0.30, 0.02, 0.02, 0.02, 0.03, 0.56, 0.05];
      if (ctx === "money") return [0.28, 0.02, 0.02, 0.02, 0.03, 0.58, 0.05];
      return [0.29, 0.02, 0.02, 0.02, 0.03, 0.57, 0.05];
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
        var row;
        if (i === 0) row = normalize(ctxRowFor(context));
        else if (i === bi) row = normalize(bankRow(context));
        else row = baseRow(i, n, bi);
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
      if (tok === ".") return DE ? "Satzzeichen" : "period";
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
        if (j === selected || wt < 0.005) return;
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
        if (s.context) context = s.context;
        if (typeof s.selected === "number") selected = s.selected;
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
        keys: [{ label: "Merkmal: Mechanik / Schlüssel", on: false }, { label: "Merkmal: Gebäude / Adel", on: true }, { label: "Merkmal: Turm / Burg", on: true }],
        values: [{ label: "Hinweis: Schlüssel, Tür, öffnen", on: false }, { label: "Hinweis: König, Turm, Burg", on: true }, { label: "Hinweis: alt, prächtig, Garten", on: true }],
        desc: "Die Gebäude- und Burgmuster passen; das Mechanik-Muster bleibt still."
      },
      tech: {
        keys: [{ label: "Merkmal: Mechanik / Schlüssel", on: true }, { label: "Merkmal: Gebäude / Adel", on: false }, { label: "Merkmal: Turm / Burg", on: false }],
        values: [{ label: "Hinweis: Schlüssel, Tür, öffnen", on: true }, { label: "Hinweis: König, Turm, Burg", on: false }, { label: "Hinweis: alt, prächtig, Garten", on: false }],
        desc: "Jetzt passt das Mechanik-Muster; die Gebäude- und Burgmuster bleiben still."
      }
    } : {
      fruit: {
        keys: [{ label: "Feature: technology brand", on: false }, { label: "Feature: food / edible", on: true }, { label: "Feature: orchard / fruit", on: true }],
        values: [{ label: "Pull: pie, juice, crunch", on: true }, { label: "Pull: Mac, iPhone, stock", on: false }, { label: "Pull: tree, orchard, green", on: true }],
        desc: "The food and orchard patterns match; the technology pattern stays silent."
      },
      tech: {
        keys: [{ label: "Feature: technology brand", on: true }, { label: "Feature: food / edible", on: false }, { label: "Feature: orchard / fruit", on: false }],
        values: [{ label: "Pull: pie, juice, crunch", on: false }, { label: "Pull: Mac, iPhone, stock", on: true }, { label: "Pull: tree, orchard, green", on: false }],
        desc: "The technology pattern matches; the food and orchard patterns stay silent."
      }
    };
    var labels = DE ? {
      fruitTitle: "Ich besichtige das Schloss",
      techTitle: "Ich öffne das Schloss",
      stream: "„Schloss“ + Kontext",
      output: "reicherer Vektor",
      core: "Schloss: Gebäude",
      ring: "Schloss: Mechanik",
      bend: "Biegung",
      bendButton: "Raum biegen",
      separated: "getrennt",
      notSeparated: "noch nicht getrennt",
      plane: "Trennebene",
      hint: "Wie im MLP: Bereich anheben, bis eine Ebene trennt.",
      prev: "Voriger Kontext",
      next: "Nächster Kontext",
      step: "Kontext"
    } : {
      fruitTitle: "I ate the apple",
      techTitle: "I bought an Apple laptop",
      stream: "“apple” + context",
      output: "richer vector",
      core: "apple: fruit",
      ring: "apple: company",
      bend: "Bend",
      bendButton: "Bend space",
      separated: "separated",
      notSeparated: "not separated",
      plane: "separating plane",
      hint: "Like the MLP: lift the region until a plane separates it.",
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
      '<p class="ls-ffn-caveat">' + (DE ? "Vereinfachung: Ein echtes FFN hat keine beschrifteten Keys. Die Muster sind gelernte Richtungen in W₁." : "Simplification: a real FFN has no labelled keys. The patterns are learned directions in W₁.") + '</p>';
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
    function drawBend() {
      if (!size) return;
      var C = api.colors();
      ctx = size.ctx;
      var w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w * 0.5, cy = h * 0.56;
      var scale = Math.min(w * 0.38, h * 0.34);
      function warp(x, y) {
        var r2 = x * x + y * y;
        return { x: x, y: y, z: bend * 1.35 * Math.exp(-r2 / 0.18) };
      }
      function project(x, y, z) {
        return { x: cx + x * scale + z * scale * 0.25, y: cy + y * scale * 0.35 - z * scale * 0.95 };
      }
      ctx.strokeStyle = C.line;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      var N = 10;
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
      function drawClass(cls, color) {
        var active = (cls === 0 && activeMode === "fruit") || (cls === 1 && activeMode === "tech");
        for (var k = 0; k < 36; k++) {
          var a = k * 2.399963229728653;
          var r = cls === 0 ? 0.28 * Math.sqrt((k + 0.5) / 36) : 0.55 + 0.32 * Math.sqrt((k + 0.5) / 36);
          var wp = warp(Math.cos(a) * r, Math.sin(a) * r);
          var p = project(wp.x, wp.y, wp.z);
          ctx.beginPath();
          ctx.arc(p.x, p.y, (cls === 0 ? 3.4 : 3) * (active ? 1.15 : 1), 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = active ? 0.92 : 0.26;
          ctx.fill();
          ctx.strokeStyle = C.paper;
          ctx.lineWidth = 1;
          ctx.globalAlpha = active ? 1 : 0.45;
          ctx.stroke();
        }
      }
      drawClass(0, C.green);
      drawClass(1, C.gold);
      var lineAlpha = Math.max(0, Math.min(1, (bend - 0.45) / 0.25));
      if (lineAlpha > 0.01) {
        var ly = cy - 0.6 * scale * 0.95;
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = C.petrol;
        ctx.globalAlpha = lineAlpha;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(16, ly);
        ctx.lineTo(w - 16, ly);
        ctx.stroke();
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
      ctx.fillText(labels.hint, w / 2, h - 10);
      bendCanvas.setAttribute("aria-label", (DE ? "Symbolische Biegung des FFN-Raums. " : "Symbolic bend of the FFN space. ") + labels.hint + " " + (bend > 0.6 ? labels.separated : labels.notSeparated) + ".");
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
      onKey: function (e) {
        if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return false;
        if (e.key === "ArrowLeft") return stepContext(-1);
        if (e.key === "ArrowRight") return stepContext(1);
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
    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
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
    el.innerHTML = '<div class="ls-meadow-stage"><canvas class="ls-canvas" role="img"></canvas></div><div class="ls-scene-row"><label class="ls-range">' + (DE ? "Wörter" : "Words") + ' <input type="range" class="ls-md-n" min="12" max="30" step="6" value="12"><output>12</output></label><label class="ls-range">T <input type="range" class="ls-md-temp" min="0.2" max="2.6" step="0.05" value="0.8"><output>0.80</output></label><label class="ls-range">k <input type="range" class="ls-md-k" min="1" max="10" step="1" value="5"><output>5</output></label><button type="button" class="ls-btn ls-btn--tiny ls-md-landscape">' + (DE ? "Landschaft" : "Landscape") + '</button></div><div class="ls-meadow-readout" aria-live="polite"></div><p class="ls-meadow-caption"></p>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-meadow-stage");
    var canvas = el.querySelector("canvas");
    var nEl = el.querySelector(".ls-md-n"), tempEl = el.querySelector(".ls-md-temp"), kEl = el.querySelector(".ls-md-k");
    var readout = el.querySelector(".ls-meadow-readout");
    var caption = el.querySelector(".ls-meadow-caption");
    var ctx = null, size = null, N = 12, T = 0.8, K = 5;
    var modeMix = 0, modeTarget = 0, modeTimer = 0;
    var anchors = [], fieldCache = {}, gapFrac = 0, pointer = { x: CW / 2, y: CH / 2 };
    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
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
    el.innerHTML = '<div class="ls-scene-row ls-softmax-prompts"></div><p class="softmax-context"><span class="softmax-context-label">' + (DE ? "Kontext" : "context") + '</span> <span class="ls-softmax-context"></span></p><div class="softmax-stage"><div class="softmax-col softmax-col--logits"><div class="softmax-col-head"><span>Token</span><span>Logit</span></div><div data-logits></div></div><svg class="softmax-ribbons" data-ribbons aria-hidden="true"><defs><linearGradient id="softmax-ribbon-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#63a44b"></stop><stop offset="100%" stop-color="#009299"></stop></linearGradient></defs></svg><div class="softmax-col softmax-col--probs"><div class="softmax-col-head"><span>' + (DE ? "Wahrscheinlichkeit" : "probability") + '</span><span>Softmax</span></div><div data-probs></div></div></div><div class="ls-scene-row"><label class="ls-range">T <input type="range" class="ls-sm-temp" min="0.2" max="2" step="0.05" value="1"><output>1.00</output></label></div><div class="ls-sm-readout" aria-live="polite"></div>';
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
      b.textContent = key === "spaceship" ? "spaceship" : (DE ? "verlassener Planet" : "deserted planet");
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
    el.innerHTML = '<div id="ls-dual-manifolds" class="ls-dual-manifolds"><div class="tm-manifold-loading"><span class="tm-spinner" aria-hidden="true"></span><span>' + (DE ? "Lade die Mannigfaltigkeiten …" : "Loading the manifolds …") + '</span></div></div><div id="ls-dual-controls" class="ls-dual-controls"></div>';
    root.appendChild(el);
    var next = document.createElement("div");
    next.className = "ls-scene-row";
    var nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "ls-btn ls-btn--primary ls-btn--tiny";
    nextBtn.textContent = DE ? "Weiter →" : "Next →";
    nextBtn.addEventListener("click", function () {
      if (!window.LearnSys) return;
      var st = LearnSys.state();
      LearnSys.go(st.day, st.step + 1);
    });
    next.appendChild(nextBtn);
    el.appendChild(next);
    var drawn = false;
    function draw() {
      if (drawn) return;
      if (!window.ManifoldScenes || !window.Plotly) { setTimeout(draw, 120); return; }
      drawn = true;
      try { window.ManifoldScenes.renderDualPlotly("ls-dual-manifolds", "ls-dual-controls"); } catch (e) {}
    }
    setTimeout(draw, 30);
    return {
      update: function () {},
      resize: function () {
        var d = document.getElementById("ls-dual-manifolds");
        if (d && window.Plotly && d.data) { try { Plotly.Plots.resize(d); } catch (e) {} }
      },
      destroy: function () { el.remove(); }
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
    el.innerHTML = '<div class="ls-traj-plot" role="img" aria-label="' + (DE ? "3D-Token-Trajektorien durch GPT-2" : "3D token trajectories through GPT-2") + '"></div><div class="ls-scene-row"><label class="ls-range">Layer <input type="range" class="ls-traj-layer" min="0" max="12" step="1" value="0"><output>Embedding</output></label><div class="ls-scene-row ls-traj-metric"><button type="button" class="ls-chip is-on" data-metric="euclid">' + (DE ? "Euklid" : "Euclidean") + '</button><button type="button" class="ls-chip" data-metric="angular">' + (DE ? "Winkel" : "Angle") + '</button></div><button type="button" class="ls-btn ls-btn--tiny ls-traj-next">' + (DE ? "Nächste Schicht →" : "Next layer →") + '</button></div><div class="ls-traj-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var plot = el.querySelector(".ls-traj-plot");
    var layerEl = el.querySelector(".ls-traj-layer");
    var layerOut = el.querySelector("output");
    var readout = el.querySelector(".ls-traj-readout");
    var layer = 0, metric = "euclid";
    var colors = ["#63a44b", "#5c9baf", "#9f9700", "#9185be", "#869b55"];
    function tokenLabel(t) { return t.replace(/^ /, "␣"); }
    function displayLayers() { return data.layers; }
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
    function build() {
      if (!window.Plotly || !data) return;
      var pts = positions();
      var C = api.colors();
      var traces = [];
      data.tokens.forEach(function (tok, i) {
        traces.push({
          type: "scatter3d", mode: "lines+markers", name: tokenLabel(tok),
          x: pts[i].map(function (p) { return p[0]; }),
          y: pts[i].map(function (p) { return p[1]; }),
          z: pts[i].map(function (p) { return p[2]; }),
          line: { color: colors[i % colors.length], width: 4 },
          marker: { size: 2.5, color: colors[i % colors.length] },
          text: data.tokens.map(function (t) { return tokenLabel(t) + " · " + (DE ? "Schicht" : "layer") + " "; }),
          hoverinfo: "skip", showlegend: false
        });
      });
      var cur = [];
      data.tokens.forEach(function (tok, i) {
        var p = pts[i][layer] || pts[i][0];
        cur.push({ x: p[0], y: p[1], z: p[2], text: tokenLabel(tok), color: colors[i % colors.length] });
      });
      traces.push({
        type: "scatter3d", mode: "markers+text", name: "now",
        x: cur.map(function (p) { return p.x; }), y: cur.map(function (p) { return p.y; }), z: cur.map(function (p) { return p.z; }),
        text: cur.map(function (p) { return p.text; }), textposition: "top center",
        textfont: { size: 11, color: C.ink }, marker: { size: 7, color: cur.map(function (p) { return p.color; }), line: { width: 1, color: C.paper } },
        hoverinfo: "skip", showlegend: false
      });
      if (layer === data.layers.length - 1) {
        traces.push({
          type: "scatter3d", mode: "markers+text", name: "candidates",
          x: data.landmarks.map(function (l) { return l.value[0]; }), y: data.landmarks.map(function (l) { return l.value[1]; }), z: data.landmarks.map(function (l) { return l.value[2]; }),
          text: data.landmarks.map(function (l) { return tokenLabel(l.word); }), textposition: "bottom center",
          textfont: { size: 10, color: C.gold }, marker: { size: 5, color: C.gold, symbol: "diamond" },
          hoverinfo: "skip", showlegend: false
        });
      }
      var layout = {
        margin: { l: 0, r: 0, b: 0, t: 0 }, showlegend: false,
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
        scene: {
          xaxis: { showgrid: true, gridcolor: C.line, zeroline: false, showticklabels: false, title: "" },
          yaxis: { showgrid: true, gridcolor: C.line, zeroline: false, showticklabels: false, title: "" },
          zaxis: { showgrid: true, gridcolor: C.line, zeroline: false, showticklabels: false, title: "" },
          camera: { eye: { x: 1.5, y: 1.8, z: 1.2 } },
          aspectmode: "cube",
          bgcolor: "rgba(0,0,0,0)"
        }
      };
      Plotly.react(plot, traces, layout, { displayModeBar: false, responsive: true });
      layerOut.textContent = displayLayers()[layer] || "";
      var cand = layer === data.layers.length - 1
        ? '<span>' + (DE ? "Kandidaten" : "Candidates") + '</span>' + data.top.slice(0, 5).map(function (t) { return '<span><b>' + api.esc(tokenLabel(t.token)) + '</b> ' + (t.p * 100).toFixed(1) + '%</span>'; }).join("")
        : '<span>' + (DE ? "Kandidaten erscheinen in der letzten Schicht." : "Candidates appear at the final layer.") + '</span>';
      readout.innerHTML = '<span>' + (DE ? "Satz" : "Sentence") + ' <b>' + api.esc(data.sentence) + '</b></span>' + cand;
    }
    layerEl.addEventListener("input", function () { layer = parseInt(layerEl.value, 10); build(); });
    el.querySelectorAll("[data-metric]").forEach(function (b) {
      b.addEventListener("click", function () {
        metric = b.getAttribute("data-metric");
        el.querySelectorAll("[data-metric]").forEach(function (x) { x.classList.toggle("is-on", x === b); });
        build();
      });
    });
    el.querySelector(".ls-traj-next").addEventListener("click", function () { layer = Math.min(12, layer + 1); layerEl.value = String(layer); build(); });
    window.addEventListener("resize", function () { if (window.Plotly && plot.data) Plotly.Plots.resize(plot); });
    window.addEventListener("tm:theme", build);
    build();
    return { update: function () {}, resize: function () { if (window.Plotly && plot.data) Plotly.Plots.resize(plot); }, destroy: function () { el.remove(); } };
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
      fns.forEach(function (fn) {
        var on = fn.id === active;
        ctx.beginPath();
        for (var i = 0; i <= 120; i++) {
          var x = -3 + 6 * i / 120;
          var px = sx(x), py = sy(f(x ? fn.id : fn.id, x));
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = on ? C[fn.color] : C.lineStrong;
        ctx.globalAlpha = on ? 1 : 0.35;
        ctx.lineWidth = on ? 2.6 : 1.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
        var end = sy(f(fn.id, 2.6));
        ctx.fillStyle = on ? C[fn.color] : C.muted;
        ctx.font = (on ? '700 ' : '600 ') + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(fn.label, sx(2.65), end + 3);
        hits.push({ id: fn.id, x: sx(2.65) + 12, y: end, r: 18 });
      });
      var info = fns.filter(function (fn) { return fn.id === active; })[0];
      readout.innerHTML = '<span><b>' + info.label + '</b> ' + info.desc + '</span><span>' + (DE ? "ReLU ist nicht injektiv; glatte Aktivierungen bleiben für endliche Eingaben umkehrbar." : "ReLU is not injective; smooth activations stay invertible for finite inputs.") + '</span>';
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
    window.addEventListener("resize", resize);
    resize();
    return { update: function () {}, resize: resize, destroy: function () { window.removeEventListener("resize", resize); el.remove(); } };
  }

  function langdataScene(root, api) {
    var DE = api.lang === "de";
    var langs = [
      { id: "de", label: DE ? "Deutsch" : "German", text: "Das Wetter ist heute kalt.", gloss: DE ? "Derselbe Inhalt, andere Schrift." : "The same content, a different script." },
      { id: "en", label: DE ? "Englisch" : "English", text: "The weather is cold today.", gloss: DE ? "Derselbe Inhalt, andere Schrift." : "The same content, a different script." },
      { id: "fr", label: DE ? "Französisch" : "French", text: "Il fait froid aujourd'hui.", gloss: DE ? "Derselbe Inhalt, andere Schrift." : "The same content, a different script." },
      { id: "ja", label: DE ? "Japanisch" : "Japanese", text: "今日は寒いです。", gloss: DE ? "Derselbe Inhalt, andere Schrift." : "The same content, a different script." },
      { id: "ar", label: DE ? "Arabisch" : "Arabic", text: "الجو بارد اليوم.", gloss: DE ? "Derselbe Inhalt, von rechts nach links." : "The same content, written right to left.", rtl: true },
      { id: "zh", label: DE ? "Chinesisch" : "Chinese", text: "今天很冷。", gloss: DE ? "Derselbe Inhalt, andere Schrift." : "The same content, a different script." }
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
      '<p class="ls-lang-caveat">' + (DE ? "Dieselbe Schleife, dieselben Gewichte: Die Schrift ändert die Tokens, nicht die Aufgabe. Manche Sprachen brauchen für denselben Inhalt mehr Tokens; der Tokenizer kann sie dadurch teurer machen (Petrov et al., 2023)." : "The same loop, the same weights: the script changes the tokens, not the task. Some languages need more tokens for the same content, so the tokenizer can make them more expensive (Petrov et al., 2023).") + '</p>';
    root.appendChild(el);
    var tabs = el.querySelector(".ls-lang-tabs");
    var tag = el.querySelector(".ls-lang-tag");
    var text = el.querySelector(".ls-lang-text");
    var gloss = el.querySelector(".ls-lang-gloss");
    var bars = el.querySelector(".ls-lang-bars");
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
    return { update: function () {}, resize: function () {}, destroy: function () { el.remove(); } };
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

  var SCENES = {
    embedding: embeddingScene,
    phone: phoneScene,
    code: codeScene,
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
    highdim: highdimScene,
    mlp: mlpScene,
    trajectories: trajectoriesScene,
    stack: stackScene,
    activation: activationScene,
    langdata: langdataScene,
    chineseroom: chineseroomScene
  };

  LearnSys.defineDemo("intuition", function (root, api) {
    var host = document.createElement("div");
    host.className = "ls-scene-host";
    root.appendChild(host);
    var scenes = {};
    var scene = null, name = null;
    function mount(next) {
      if (!scenes[next]) {
        var layer = document.createElement("div");
        layer.className = "ls-scene-layer";
        host.appendChild(layer);
        scenes[next] = { layer: layer, api: SCENES[next] ? SCENES[next](layer, api) : null };
      }
      Object.keys(scenes).forEach(function (key) {
        var hidden = key !== next;
        scenes[key].layer.hidden = hidden;
        if (hidden && scenes[key].api && scenes[key].api.pause) { try { scenes[key].api.pause(); } catch (e) {} }
      });
      var entry = scenes[next];
      entry.layer.hidden = false;
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
      resize: function () { if (scene && scene.resize) scene.resize(); },
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
