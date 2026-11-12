(function () {
  "use strict";
  if (!window.LearnSys) return;

  var TEMP = [
    { id: "freezing", value: -30, color: "sky", label: ["Gefrierpunkt", "Freezing"] },
    { id: "cold", value: 5, color: "blue", label: ["Kalt", "Cold"] },
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
      '<div class="ls-embed-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-scene-controls"></div>' +
      '<div class="ls-scene-readout ls-sr-only" aria-live="polite"></div>' +
      '<div class="ls-scene-formula"><div class="ls-math" data-tex=""></div></div>';
    root.appendChild(scene);
    var stage = scene.querySelector(".ls-embed-stage");
    var canvas = scene.querySelector("canvas");
    var controls = scene.querySelector(".ls-scene-controls");
    var readout = scene.querySelector(".ls-scene-readout");
    var formula = scene.querySelector(".ls-scene-formula");
    var mathEl = formula.querySelector(".ls-math");
    var ctx = null, size = null, raf = 0, last = 0, reserveTimer = 0;
    var hits = [], hover = null, drag = null, suppressClick = false;
    var dimMix = 0, dimTarget = 0;
    var st = {
      mode: "space", dim: 1, selected: "king", arithmetic: "King - Man + Woman",
      pair: ["cold", "warm"], group: null, yaw: -0.55, pitch: 0.78, zoom: 1
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
      drawLabel(a.value + " + " + b.value + " = " + (a.value + b.value) + "  ·  " + avg.toFixed(1) + " " + sym + " " + text(near.label), size.w / 2, size.h - 22, C.soft, "center", 11);
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
          esc(avg.toFixed(1)) + ' ' + esc(sym) + ' <b>' + esc(text(near.label)) + '</b>';
        setTex("\\underbrace{" + a.value + "}_{\\text{" + text(a.label) + "}} + \\underbrace{" + b.value + "}_{\\text{" + text(b.label) + "}} = \\underbrace{" + (a.value + b.value) + "}_{\\text{" + (DE ? "Summe" : "sum") + "}} \\qquad \\underbrace{" + avg.toFixed(1) + "}_{\\text{" + (DE ? "Mittelwert" : "midpoint") + "}} " + sym + " \\underbrace{" + near.value + "}_{\\text{" + text(near.label) + "}}");
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
      var letters = (DE ? "Suche" : "Search").split("");
      logo.innerHTML = letters.map(function (ch, i) { return '<span class="ia-l' + (i + 1) + '">' + ch + "</span>"; }).join("");
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
      var scale = Math.min(1, (r.width - 18) / 360, (r.height - 18) / 600);
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
      '<div class="ls-code-window"><div class="ls-code-bar"><i></i><i></i><i></i><span>' + (DE ? "himmel.py" : "sky.py") + '</span></div><pre class="ls-code-body"><code></code></pre></div>' +
      '<div class="ls-code-terminal"><div class="ls-code-bar"><i></i><i></i><i></i><span>Terminal</span></div><div class="ls-code-term"><b>$ ' + (DE ? "python3 himmel.py" : "python3 sky.py") + '</b><span></span></div></div>' +
      '<button type="button" class="ls-btn ls-btn--tiny ls-code-replay">' + (DE ? "Nochmal" : "Replay") + '</button>';
    root.appendChild(el);
    var codeEl = el.querySelector(".ls-code-body code");
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
      term.textContent = "";
      var i = 0;
      function typeNext() {
        if (i >= spans.length) {
          timers.push(setTimeout(function () { term.textContent = outText; }, 260));
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
    el.addEventListener("click", function (e) { if (!e.target.closest("button")) reset(); });
    reset();
    return {
      update: function () {},
      resize: function () {},
      destroy: function () { clearTimers(); el.remove(); }
    };
  }

  function loopScene(root, api) {
    var DE = api.lang === "de";
    var MAX_STEPS = 6;
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
    function choicesFor() {
      var n = generated.length;
      if (n === 0) return NOUNS;
      if (n === 1) {
        if (DE) return RELATIVE[generated[0]] || [{ t: "der", l: 3.6 }];
        var noun = generated[0];
        if (noun === "princess") return [{ t: "that", l: 3.1 }, { t: "who", l: 1.4 }];
        if (noun === "castle" || noun === "river") return [{ t: "that", l: 3.1 }, { t: "which", l: 1.4 }];
        return [{ t: "that", l: 3.1 }, { t: "who", l: 1.4 }, { t: "which", l: 0.8 }];
      }
      if (n === 2) return MODALS;
      if (n === 3) {
        if (DE) return NEGATORS;
        var verb = generated[2];
        if (verb === "could" || verb === "would") return NEGATORS;
        return [{ t: "to", l: 4.0 }];
      }
      if (n === 4) return ACTIONS[generated[0]] || (DE ? ACTIONS.Drache : ACTIONS.dragon);
      if (n === 5) return [{ t: ".", l: 3.2 }, { t: "!", l: 1.1 }, { t: "…", l: 0.7 }];
      return [];
    }
    var base = DE ? ["Es", "war", "einmal", "ein"] : ["Once", "upon", "a", "time", "there", "was", "a"];
    var generated = [];
    var temp = 0.8;
    var decodeMode = "sample";
    var el = document.createElement("div");
    el.className = "ls-loop-scene";
    el.innerHTML =
      '<div class="ls-loop-sentence" aria-live="polite"></div>' +
      '<div class="ls-loop-tree" aria-live="polite"></div>' +
      '<div class="ls-loop-bars"></div>' +
      '<div class="ls-scene-row ls-loop-modes"></div>' +
      '<div class="ls-scene-row ls-loop-actions"><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-loop-next">' + (DE ? "Weiter →" : "Next →") + '</button><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-loop-reset">' + (DE ? "Neu" : "Reset") + '</button><label class="ls-range">T <input type="range" class="ls-loop-temp" min="0.05" max="1.8" step="0.05" value="0.8"><output>0.80</output></label></div>' +
      '<div class="ls-loop-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var sentenceEl = el.querySelector(".ls-loop-sentence");
    var treeEl = el.querySelector(".ls-loop-tree");
    var barsEl = el.querySelector(".ls-loop-bars");
    var readout = el.querySelector(".ls-loop-readout");
    var tempEl = el.querySelector(".ls-loop-temp");
    var tempOut = el.querySelector(".ls-loop-actions output");
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
      }).concat(generated.map(function (tok) { return { tok: tok, cls: "pred" }; }));
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
      var opts = choicesFor();
      var probs = softmax(opts.map(function (o) { return o.l; }), temp);
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
        return '<button type="button" class="ls-loop-bar' + (on ? " is-on" : "") + '" data-bar="' + i + '">' +
          '<span class="ls-loop-bar-label">' + api.esc(o.t) + '</span>' +
          '<span class="ls-loop-bar-track"><i style="width:' + (probs[i] * 100).toFixed(1) + '%"></i></span>' +
          '<span class="ls-loop-bar-val">' + (probs[i] * 100).toFixed(0) + '%</span></button>';
      }).join("");
      barsEl.querySelectorAll("[data-bar]").forEach(function (b) {
        b.addEventListener("click", function () { choose(opts[parseInt(b.getAttribute("data-bar"), 10)].t); });
      });
      readout.innerHTML = '<span>' + (DE ? "Schritt" : "Step") + ' <b>' + generated.length + ' / ' + MAX_STEPS + '</b></span><span>' + (DE ? "Kontext" : "Context") + ' <b>' + (base.length + generated.length) + '</b></span><span>' + (DE ? "Top" : "Top") + ' <b>' + api.esc(opts[top] ? opts[top].t : "—") + '</b></span><span>' + (DE ? "Modus" : "Mode") + ' <b>' + decodeMode + '</b></span>';
    }
    function choose(token) {
      if (!token) return;
      token.split(" ").forEach(function (piece) { generated.push(piece); });
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
    function reset() { generated = []; renderSentence(); renderTree(); renderBars(); }
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
    el.querySelector(".ls-loop-reset").addEventListener("click", reset);
    tempEl.addEventListener("input", function () {
      temp = parseFloat(tempEl.value) || 0.8;
      tempOut.textContent = temp.toFixed(2);
      renderBars();
    });
    renderSentence(); renderTree(); renderBars();
    return {
      update: function (s) {
        if (!s) return;
        if (s.mode) setMode(s.mode);
        if (typeof s.temp === "number") { temp = s.temp; tempEl.value = String(temp); tempOut.textContent = temp.toFixed(2); renderBars(); }
        if (s.reset) reset();
      },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }

  function tunnelScene(root, api) {
    var DE = api.lang === "de";
    var tokens = DE ? ["Die", "Hauptstadt", "von", "Frankreich", "ist", "Paris", "."] : ["The", "capital", "of", "France", "is", "Paris", "."];
    var pathY = [0.50, 0.42, 0.38, 0.35, 0.32, 0.30, 0.32];
    var entropy = [0.95, 0.55, 0.20, 0.60, 0.15, 0.05, 0.10];
    var branches = DE ? [
      { step: 0, alts: [{ t: "Stadt", y: 0.22 }, { t: "Regierung", y: 0.62 }] },
      { step: 1, alts: [{ t: "Frankreichs", y: 0.20 }, { t: "war", y: 0.58 }] },
      { step: 2, alts: [{ t: "Deutschland", y: 0.16 }, { t: "Italien", y: 0.54 }] },
      { step: 3, alts: [{ t: "war", y: 0.14 }, { t: "bleibt", y: 0.50 }] },
      { step: 4, alts: [{ t: "Lyon", y: 0.13 }, { t: "Marseille", y: 0.48 }] },
      { step: 5, alts: [{ t: ",", y: 0.15 }, { t: "und", y: 0.49 }] }
    ] : [
      { step: 0, alts: [{ t: "city", y: 0.22 }, { t: "government", y: 0.62 }] },
      { step: 1, alts: [{ t: "city", y: 0.20 }, { t: "was", y: 0.58 }] },
      { step: 2, alts: [{ t: "Germany", y: 0.16 }, { t: "Italy", y: 0.54 }] },
      { step: 3, alts: [{ t: "was", y: 0.14 }, { t: "remains", y: 0.50 }] },
      { step: 4, alts: [{ t: "Lyon", y: 0.13 }, { t: "Marseille", y: 0.48 }] },
      { step: 5, alts: [{ t: ",", y: 0.15 }, { t: "and", y: 0.49 }] }
    ];
    var el = document.createElement("div");
    el.className = "ls-tunnel-scene";
    el.innerHTML = '<div class="ls-tunnel-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-tunnel-side"><div class="ls-tunnel-kicker">' + (DE ? "Nächstes Wort" : "Next word") + '</div><b class="ls-tunnel-next"></b><div class="ls-tunnel-alts"></div><div class="ls-tunnel-meta"></div></div>' +
      '<div class="ls-scene-row"><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-tunnel-advance">' + (DE ? "Weiter →" : "Next →") + '</button><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-tunnel-reset">' + (DE ? "Neu" : "Reset") + '</button><label class="ls-range">T <input type="range" class="ls-tunnel-temp" min="0.05" max="5" step="0.05" value="0.8"><output>0.80</output></label></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-tunnel-stage");
    var canvas = el.querySelector("canvas");
    var nextEl = el.querySelector(".ls-tunnel-next");
    var altEl = el.querySelector(".ls-tunnel-alts");
    var metaEl = el.querySelector(".ls-tunnel-meta");
    var tempEl = el.querySelector(".ls-tunnel-temp");
    var tempOut = el.querySelector("output");
    var ctx = null, size = null, step = 0, temp = 0.8, yaw = -0.55, pitch = 0.85, zoom = 1;
    var hits = [], drag = null, suppress = false;
    function centerAt(x) {
      var lo = Math.max(0, Math.min(pathY.length - 1, Math.floor(x)));
      var hi = Math.min(pathY.length - 1, lo + 1);
      return (pathY[lo] + (pathY[hi] - pathY[lo]) * (x - lo) - 0.5) * 2;
    }
    function entropyAt(x) {
      var lo = Math.max(0, Math.min(entropy.length - 1, Math.floor(x)));
      var hi = Math.min(entropy.length - 1, lo + 1);
      return entropy[lo] + (entropy[hi] - entropy[lo]) * (x - lo);
    }
    function heightAt(x, y) {
      var center = centerAt(x);
      var width = 0.18 + 0.45 * (0.3 + entropyAt(x)) * (0.45 + temp / (temp + 1.2));
      var depth = 0.38 + 0.28 * (2 - temp) / 1.95;
      var h = 0.32 - depth * Math.exp(-((y - center) * (y - center)) / (2 * width * width));
      branches.forEach(function (b) {
        var dx = x - b.step;
        if (dx < -1.0 || dx > 1.0) return;
        b.alts.forEach(function (a) {
          var cy = (a.y - 0.5) * 2;
          var d = Math.hypot(dx * 1.4, y - cy);
          h -= 0.16 * Math.exp(-(d * d) / (2 * 0.16 * 0.16));
        });
      });
      h += 0.02 * Math.sin(x * 2.1 + y * 3.7);
      return h;
    }
    function project(x, y, z) {
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var x1 = x * cy - y * sy;
      var y1 = x * sy + y * cy;
      var y2 = y1 * cp - z * sp;
      var z2 = y1 * sp + z * cp;
      var s = Math.min(size.w, size.h) * 0.36 * zoom / (1 + z2 * 0.35);
      return { x: size.w * 0.5 + (x1 - 3) * s * 0.72, y: size.h * 0.54 - (y2 - 0.2) * s, z: z2 };
    }
    function colorFor(h) {
      if (h < 0.05) return "#1275ac";
      if (h < 0.16) return "#5c9baf";
      if (h < 0.24) return "#9f9700";
      return "#f7f9f8";
    }
    function draw() {
      if (!size) resize();
      if (!ctx || !size) return;
      ctx.clearRect(0, 0, size.w, size.h);
      var NX = 40, NY = 20;
      var cells = [];
      for (var i = 0; i < NX; i++) {
        for (var j = 0; j < NY; j++) {
          var x0 = i / NX * (tokens.length - 1), x1 = (i + 1) / NX * (tokens.length - 1);
          var y0 = -1 + 2 * j / NY, y1 = -1 + 2 * (j + 1) / NY;
          var p00 = project(x0, y0, heightAt(x0, y0));
          var p10 = project(x1, y0, heightAt(x1, y0));
          var p11 = project(x1, y1, heightAt(x1, y1));
          var p01 = project(x0, y1, heightAt(x0, y1));
          var h = (heightAt(x0, y0) + heightAt(x1, y0) + heightAt(x1, y1) + heightAt(x0, y1)) / 4;
          cells.push({ pts: [p00, p10, p11, p01], z: (p00.z + p10.z + p11.z + p01.z) / 4, h: h });
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
        ctx.fillStyle = colorFor(c.h);
        ctx.globalAlpha = 0.72;
        ctx.fill();
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = C().paper;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
      var pathPts = [];
      for (var k = 0; k <= 60; k++) {
        var x = k / 60 * (tokens.length - 1);
        var y = centerAt(x);
        pathPts.push(project(x, y, heightAt(x, y) + 0.02));
      }
      ctx.beginPath();
      pathPts.forEach(function (p, i) { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.strokeStyle = C().blue;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.85;
      ctx.stroke();
      ctx.globalAlpha = 1;
      branches.forEach(function (b) {
        b.alts.forEach(function (a) {
          var x = b.step;
          var y = (a.y - 0.5) * 2;
          var p = project(x, y, heightAt(x, y) + 0.02);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = C().gold;
          ctx.fill();
        });
      });
      hits = [];
      tokens.forEach(function (t, i) {
        var y = centerAt(i);
        var p = project(i, y, heightAt(i, y) + 0.08);
        var on = i === step;
        ctx.beginPath();
        ctx.arc(p.x, p.y, on ? 9 : 5, 0, Math.PI * 2);
        ctx.fillStyle = on ? C().green : C().paper;
        ctx.fill();
        ctx.strokeStyle = on ? C().green : C().petrol;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = on ? C().ink : C().soft;
        ctx.font = '600 10px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(t, p.x, p.y - 16);
        hits.push({ x: p.x, y: p.y, r: 18, step: i });
      });
      var side = branches.filter(function (b) { return b.step === step; })[0];
      var nextToken = tokens[step] || (DE ? "Ende" : "end");
      nextEl.textContent = nextToken;
      altEl.innerHTML = side ? side.alts.map(function (a) {
        return '<button type="button" class="ls-tunnel-alt" data-alt="' + api.esc(a.t) + '">' + api.esc(a.t) + '</button>';
      }).join("") : '<span class="ls-tunnel-end">' + (DE ? "Ende" : "end") + '</span>';
      altEl.querySelectorAll("[data-alt]").forEach(function (b) {
        b.addEventListener("click", function () { step = Math.min(tokens.length - 1, step + 1); draw(); });
      });
      metaEl.innerHTML = '<span>' + (DE ? "Schritt" : "Step") + ' <b>' + (step + 1) + ' / ' + tokens.length + '</b></span><span>' + (DE ? "Temperatur" : "Temperature") + ' <b>' + temp.toFixed(2) + '</b></span>';
      canvas.setAttribute("aria-label", DE ? "Wahrscheinlichkeitstunnel: " + tokens.slice(0, step + 1).join(" ") : "Probability tunnel: " + tokens.slice(0, step + 1).join(" "));
    }
    function C() { return api.colors(); }
    function resize() {
      size = api.fit(canvas, stage);
      ctx = size.ctx;
      draw();
    }
    function onMove(e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (drag) {
        yaw += (e.clientX - drag.x) * 0.008;
        pitch = clamp(pitch + (e.clientY - drag.y) * 0.006, 0.2, 1.3);
        drag.x = e.clientX; drag.y = e.clientY; suppress = true; draw(); return;
      }
      var hit = null;
      hits.forEach(function (h) { if (Math.hypot(h.x - x, h.y - y) < h.r) hit = h; });
      canvas.style.cursor = hit ? "pointer" : "grab";
    }
    function onDown(e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var hit = null;
      hits.forEach(function (h) { if (Math.hypot(h.x - x, h.y - y) < h.r) hit = h; });
      if (hit) { suppress = false; return; }
      drag = { x: e.clientX, y: e.clientY }; suppress = false;
    }
    function onUp(e) {
      if (drag) { drag = null; return; }
      if (suppress) { suppress = false; return; }
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      hits.forEach(function (h) { if (Math.hypot(h.x - x, h.y - y) < h.r) step = h.step; });
      draw();
    }
    el.querySelector(".ls-tunnel-advance").addEventListener("click", function () { step = Math.min(tokens.length - 1, step + 1); draw(); });
    el.querySelector(".ls-tunnel-reset").addEventListener("click", function () { step = 0; draw(); });
    tempEl.addEventListener("input", function () { temp = parseFloat(tempEl.value) || 0.8; tempOut.textContent = temp.toFixed(2); draw(); });
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", function () { drag = null; });
    window.addEventListener("resize", resize);
    resize();
    return {
      update: function (s) { if (s && typeof s.step === "number") { step = clamp(s.step, 0, tokens.length - 1); draw(); } },
      resize: resize,
      destroy: function () { window.removeEventListener("resize", resize); el.remove(); }
    };
  }

  var SCENES = {
    embedding: embeddingScene,
    phone: phoneScene,
    code: codeScene,
    loop: loopScene,
    tunnel: tunnelScene
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
      update: function (s) {
        var next = (s && s.scene) || "embedding";
        if (next !== name) mount(next);
        if (scene && scene.update) scene.update(s || {});
      },
      resize: function () { if (scene && scene.resize) scene.resize(); },
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
