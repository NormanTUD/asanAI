(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroNet");
  if (hero) {
    var rnd = MP.mulberry32(1943);
    var nodes = [];
    for (var i = 0; i < 22; i++) {
      nodes.push({ x: 0.08 + rnd() * 0.84, y: 0.12 + rnd() * 0.76, ph: rnd() * 6.28, r: 2 + rnd() * 2.4 });
    }
    var edges = [];
    nodes.forEach(function (n, idx) {
      var near = nodes.map(function (m, j) { return { j: j, d: Math.hypot(m.x - n.x, m.y - n.y) }; })
        .filter(function (o) { return o.j !== idx; })
        .sort(function (a, b) { return a.d - b.d; })
        .slice(0, 2);
      near.forEach(function (o) { if (idx < o.j) edges.push([idx, o.j]); });
    });
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      var pts = nodes.map(function (n) {
        return {
          x: (n.x + Math.sin(t * 0.18 + n.ph) * 0.008) * w,
          y: (n.y + Math.cos(t * 0.15 + n.ph) * 0.008) * h
        };
      });
      ctx.save();
      edges.forEach(function (e, k) {
        var a = pts[e[0]], b = pts[e[1]];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = c.line;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1;
        ctx.stroke();
        var p = (t * 0.22 + k * 0.137) % 1;
        var x = MP.lerp(a.x, b.x, p);
        var y = MP.lerp(a.y, b.y, p);
        MP.glowDot(ctx, x, y, 1.6, c.accent2, c.accent);
      });
      ctx.restore();
      pts.forEach(function (p, k) {
        var pulse = 0.6 + 0.4 * Math.sin(t * 1.7 + nodes[k].ph);
        ctx.save();
        ctx.shadowBlur = 16;
        ctx.shadowColor = c.accent;
        MP.dot(ctx, p.x, p.y, nodes[k].r * (0.8 + pulse * 0.4), k % 5 === 0 ? c.accent : c.muted);
        ctx.restore();
      });
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 1;
      for (var r = 0; r < 4; r++) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.5, Math.min(w, h) * (0.22 + r * 0.1) + Math.sin(t * 0.4 + r) * 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }, { maxDpr: 1.6 });
  }

  var thetaInput = document.getElementById("theta");
  var wAInput = document.getElementById("wA");
  var wBInput = document.getElementById("wB");
  var wCInput = document.getElementById("wC");
  var sumVal = document.getElementById("sumVal");
  var outVal = document.getElementById("outVal");
  var stateVal = document.getElementById("stateVal");
  var truthBody = document.getElementById("truthBody");
  var neuronLab = document.getElementById("neuronLab");

  if (neuronLab) {
    var lab = {
      state: 0,
      lastState: -1,
      history: [],
      flash: 0
    };

    function bits(s) {
      return { A: (s >> 2) & 1, B: (s >> 1) & 1, C: s & 1 };
    }
    function params() {
      return {
        theta: parseFloat(thetaInput ? thetaInput.value : 2),
        wA: parseFloat(wAInput ? wAInput.value : 1),
        wB: parseFloat(wBInput ? wBInput.value : 1),
        wC: parseFloat(wCInput ? wCInput.value : 0)
      };
    }
    function stepState() {
      var p = params();
      var b = bits(lab.state);
      var sum = p.wA * b.A + p.wB * b.B + p.wC * b.C;
      var fire = sum >= p.theta - 1e-9;
      return { p: p, b: b, sum: sum, fire: fire };
    }
    function renderTruth() {
      if (!truthBody) return;
      var p = params();
      var html = "";
      for (var s = 0; s < 8; s++) {
        var b = bits(s);
        var sum = p.wA * b.A + p.wB * b.B + p.wC * b.C;
        var fire = sum >= p.theta - 1e-9;
        html += "<tr data-state='" + s + "'><td>" + b.A + "</td><td>" + b.B + "</td><td>" + b.C + "</td><td>" + sum.toFixed(1) + "</td><td class='" + (fire ? "on" : "off") + "'>" + (fire ? "fire" : "—") + "</td></tr>";
      }
      truthBody.innerHTML = html;
      highlightTruth();
    }
    function highlightTruth() {
      if (!truthBody) return;
      truthBody.querySelectorAll("tr").forEach(function (tr) {
        tr.classList.toggle("is-active", parseInt(tr.getAttribute("data-state"), 10) === lab.state);
      });
    }
    function setPreset(wA, wB, wC, theta) {
      if (wAInput) { wAInput.value = wA; MP.rangeFill(wAInput); }
      if (wBInput) { wBInput.value = wB; MP.rangeFill(wBInput); }
      if (wCInput) { wCInput.value = wC; MP.rangeFill(wCInput); }
      if (thetaInput) { thetaInput.value = theta; MP.rangeFill(thetaInput); }
      renderTruth();
    }

    MP.on("presetAND", "click", function () { setPreset(1, 1, 0, 2); });
    MP.on("presetOR", "click", function () { setPreset(1, 1, 0, 1); });
    MP.on("presetNOT", "click", function () { setPreset(1, -1, 0, 1); });
    MP.on("presetMAJ", "click", function () { setPreset(1, 1, 1, 2); });

    [thetaInput, wAInput, wBInput, wCInput].forEach(function (inp) {
      if (inp) inp.addEventListener("input", renderTruth);
    });

    if (thetaInput) {
      MP.bindRange("theta", function () { renderTruth(); });
      MP.bindRange("wA", function () { renderTruth(); });
      MP.bindRange("wB", function () { renderTruth(); });
      MP.bindRange("wC", function () { renderTruth(); });
    }
    renderTruth();

    MP.canvas(neuronLab, function (ctx, w, h, t, dt) {
      var c = MP.colors();
      var p = params();
      var cycle = 1.25;
      var s = Math.floor(t / cycle) % 8;
      if (s !== lab.lastState) {
        lab.state = s;
        lab.lastState = s;
        lab.history.push(stepState().sum);
        if (lab.history.length > 22) lab.history.shift();
        highlightTruth();
      }
      var cur = stepState();
      var b = cur.b;
      var unit = Math.min(w, h);
      var inputX = w * 0.14;
      var somaX = w * 0.48;
      var outX = w * 0.82;
      var ys = [h * 0.22, h * 0.5, h * 0.78];
      var weights = [p.wA, p.wB, p.wC];
      var names = ["A", "B", "C"];
      var bitsArr = [b.A, b.B, b.C];
      var sum = cur.sum;
      var fire = cur.fire;

      ctx.save();
      ctx.globalAlpha = 0.5;
      MP.grid(ctx, w, h, Math.max(28, unit * 0.07), c.line);
      ctx.restore();

      MP.label(ctx, "INPUTS", inputX, h * 0.09, c.faint, Math.max(9, unit * 0.022), "center");
      MP.label(ctx, "SOMA", somaX, h * 0.09, c.faint, Math.max(9, unit * 0.022), "center");
      MP.label(ctx, "AXON", outX, h * 0.09, c.faint, Math.max(9, unit * 0.022), "center");

      for (var i = 0; i < 3; i++) {
        var y = ys[i];
        var active = bitsArr[i] === 1;
        var wgt = weights[i];
        var lineColor = wgt < 0 ? "#d96b6b" : c.accent;
        var alpha = 0.2 + Math.abs(wgt) * 0.65;
        ctx.save();
        ctx.globalAlpha = alpha;
        MP.arrow(ctx, inputX + unit * 0.055, y, somaX - unit * 0.07, h * 0.5, lineColor, 1.2 + Math.abs(wgt) * 2.6, Math.abs(wgt) > 0.05 ? 7 : 0);
        ctx.restore();
        var r = unit * 0.042;
        ctx.save();
        if (active) { ctx.shadowBlur = 22; ctx.shadowColor = lineColor; }
        MP.dot(ctx, inputX, y, r, active ? lineColor : c.panel2);
        ctx.strokeStyle = active ? lineColor : c.line;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(inputX, y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        MP.label(ctx, names[i], inputX, y, active ? c.ink : c.faint, Math.max(10, unit * 0.028), "center");
        MP.label(ctx, (wgt >= 0 ? "+" : "") + wgt.toFixed(1), MP.lerp(inputX, somaX, 0.55), MP.lerp(y, h * 0.5, 0.55) - 8, lineColor, Math.max(8, unit * 0.019), "center");
      }

      var somaR = unit * 0.09;
      var pot = p.theta > 0 ? MP.clamp(sum / p.theta, 0, 1.35) : 1.35;
      ctx.save();
      ctx.beginPath();
      ctx.arc(somaX, h * 0.5, somaR, 0, Math.PI * 2);
      ctx.fillStyle = c.panel2;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(somaX, h * 0.5, somaR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * MP.clamp(pot, 0, 1));
      ctx.lineTo(somaX, h * 0.5);
      ctx.closePath();
      ctx.fillStyle = fire ? c.accent : c.accent;
      ctx.globalAlpha = fire ? 0.55 : 0.22;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = fire ? c.accent : c.lineStrong || c.line;
      ctx.lineWidth = fire ? 3 : 1.5;
      ctx.beginPath();
      ctx.arc(somaX, h * 0.5, somaR, 0, Math.PI * 2);
      ctx.stroke();
      if (fire) {
        ctx.shadowBlur = 32;
        ctx.shadowColor = c.accent;
        ctx.beginPath();
        ctx.arc(somaX, h * 0.5, somaR + 7 + Math.sin(t * 14) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = c.accent2;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();
      MP.label(ctx, "Σ", somaX, h * 0.5 - unit * 0.012, fire ? c.ink : c.muted, Math.max(12, unit * 0.038), "center", '"Iowan Old Style", Georgia, serif');
      MP.label(ctx, "θ = " + p.theta.toFixed(1), somaX, h * 0.5 + unit * 0.08, c.faint, Math.max(8, unit * 0.02), "center");

      ctx.save();
      ctx.globalAlpha = fire ? 0.9 : 0.18;
      MP.arrow(ctx, somaX + somaR + 4, h * 0.5, outX - unit * 0.035, h * 0.5, fire ? c.accent : c.line, fire ? 2.4 : 1, 8);
      ctx.restore();
      var oR = unit * 0.038;
      ctx.save();
      if (fire) { ctx.shadowBlur = 24; ctx.shadowColor = c.accent; }
      MP.dot(ctx, outX, h * 0.5, oR, fire ? c.accent : c.panel2);
      ctx.strokeStyle = fire ? c.accent2 : c.line;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(outX, h * 0.5, oR * (fire ? 1.7 + Math.sin(t * 16) * 0.1 : 1), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, fire ? "FIRE" : "QUIET", outX, h * 0.5 + unit * 0.075, fire ? c.accent : c.faint, Math.max(9, unit * 0.022), "center");

      var baseY = h * 0.93;
      var histW = w * 0.36;
      var histX = w * 0.02;
      MP.label(ctx, "membrane sum", histX, baseY - unit * 0.13, c.faint, Math.max(8, unit * 0.019));
      ctx.save();
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(histX, baseY);
      ctx.lineTo(histX + histW, baseY);
      ctx.stroke();
      var maxSum = 3.2;
      lab.history.forEach(function (v, i) {
        var x = histX + (i / Math.max(1, lab.history.length - 1)) * histW;
        var yv = baseY - MP.clamp(v / maxSum, -0.15, 1) * unit * 0.1;
        ctx.fillStyle = v >= p.theta ? c.accent : c.muted;
        ctx.globalAlpha = v >= p.theta ? 0.95 : 0.4;
        ctx.fillRect(x - 2, Math.min(baseY, yv), 4, Math.abs(baseY - yv) + 1);
      });
      ctx.globalAlpha = 1;
      ctx.strokeStyle = c.accent;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      var ty = baseY - MP.clamp(p.theta / maxSum, 0, 1) * unit * 0.1;
      ctx.moveTo(histX, ty);
      ctx.lineTo(histX + histW, ty);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      MP.label(ctx, "threshold", histX + histW + 6, ty, c.accent, Math.max(8, unit * 0.018));

      if (sumVal) sumVal.textContent = sum.toFixed(1);
      if (outVal) outVal.textContent = fire ? "1" : "0";
      if (stateVal) stateVal.textContent = "" + b.A + b.B + b.C;
    }, { maxDpr: 2 });
  }

  var memoryLab = document.getElementById("memoryLab");
  if (memoryLab) {
    var mem = { closed: true, pos: 0, active: false, exits: 0, flash: 0 };
    var memState = document.getElementById("memState");
    var loopBtn = document.getElementById("loopToggle");
    function updateMemState() {
      if (memState) memState.textContent = mem.active ? (mem.closed ? "∃t : pulse at t" : "pulse lost") : "—";
      if (loopBtn) loopBtn.textContent = mem.closed ? "Cut the circle" : "Close the circle";
    }
    MP.on("injectPulse", "click", function () {
      mem.active = true;
      mem.pos = 0;
      mem.flash = 1;
      updateMemState();
    });
    MP.on("resetLoop", "click", function () {
      mem.active = false;
      mem.pos = 0;
      mem.exits = 0;
      updateMemState();
    });
    MP.on("loopToggle", "click", function () {
      mem.closed = !mem.closed;
      if (!mem.closed) mem.exits++;
      updateMemState();
    });
    updateMemState();

    MP.canvas(memoryLab, function (ctx, w, h, t, dt) {
      var c = MP.colors();
      var n = 7;
      var cx = w * 0.5;
      var cy = h * 0.52;
      var rad = Math.min(w, h) * 0.3;
      var pts = [];
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2 - Math.PI / 2;
        pts.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad, a: a });
      }
      if (mem.active) {
        mem.pos += (dt || 0.016) * 1.05;
        if (mem.pos >= n) {
          if (mem.closed) mem.pos -= n;
          else { mem.active = false; mem.pos = n - 0.001; updateMemState(); }
        }
      }
      mem.flash *= 0.96;

      ctx.save();
      ctx.globalAlpha = 0.35;
      MP.grid(ctx, w, h, Math.max(30, Math.min(w, h) * 0.08), c.line);
      ctx.restore();

      for (var i2 = 0; i2 < n; i2++) {
        var p1 = pts[i2];
        var p2 = pts[(i2 + 1) % n];
        var openGap = (!mem.closed && i2 === n - 1);
        ctx.save();
        ctx.globalAlpha = openGap ? 0.15 : 0.6;
        ctx.strokeStyle = openGap ? c.faint : c.line;
        ctx.lineWidth = openGap ? 1 : 1.5;
        ctx.setLineDash(openGap ? [5, 5] : []);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      if (!mem.closed) {
        var last = pts[n - 1];
        ctx.save();
        ctx.globalAlpha = 0.55;
        MP.arrow(ctx, last.x, last.y, last.x + Math.min(w, h) * 0.16, last.y - Math.min(w, h) * 0.12, c.faint, 1.2, 7);
        ctx.restore();
        MP.label(ctx, "output", last.x + Math.min(w, h) * 0.17, last.y - Math.min(w, h) * 0.13, c.faint, 9);
      }

      pts.forEach(function (p, i) {
        var hot = mem.active && Math.floor(mem.pos) % n === i;
        var r = Math.min(w, h) * 0.033;
        ctx.save();
        if (hot) { ctx.shadowBlur = 26; ctx.shadowColor = c.accent; }
        MP.dot(ctx, p.x, p.y, r, hot ? c.accent : c.panel2);
        ctx.strokeStyle = hot ? c.accent2 : c.line;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        MP.label(ctx, "N" + (i + 1), p.x, p.y, hot ? c.ink : c.faint, Math.max(8, Math.min(w, h) * 0.019), "center");
      });

      if (mem.active) {
        var seg = Math.floor(mem.pos);
        var frac = mem.pos - seg;
        var a = pts[seg % n];
        var b = pts[(seg + 1) % n];
        var px = MP.lerp(a.x, b.x, frac);
        var py = MP.lerp(a.y, b.y, frac);
        MP.glowDot(ctx, px, py, Math.min(w, h) * 0.014, c.accent2, c.accent);
      } else if (!mem.closed) {
        var last2 = pts[n - 1];
        var px2 = last2.x + Math.min(w, h) * 0.12;
        var py2 = last2.y - Math.min(w, h) * 0.09;
        ctx.save();
        ctx.globalAlpha = 0.4;
        MP.glowDot(ctx, px2, py2, Math.min(w, h) * 0.01, c.faint, c.faint);
        ctx.restore();
      }

      MP.label(ctx, mem.closed ? "closed path · reverberation" : "open path · no memory", cx, h * 0.92, mem.closed ? c.accent : c.faint, Math.max(9, Math.min(w, h) * 0.021), "center");
      MP.label(ctx, "the past is retained as a circulating form", cx, h * 0.96, c.muted, Math.max(8, Math.min(w, h) * 0.017), "center");
    }, { maxDpr: 2 });
  }
})();
