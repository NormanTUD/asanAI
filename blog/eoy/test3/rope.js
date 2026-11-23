(function () {
  "use strict";

  var dial = document.getElementById("rope-dial");
  var curve = document.getElementById("rope-curve");
  var heat = document.getElementById("rope-heat");
  var freqEl = document.getElementById("rope-freqs");
  var controls = document.getElementById("rope-controls");
  var readout = document.getElementById("rope-readout");
  var dialReadout = document.getElementById("rope-dial-readout");
  var pairLabel = document.getElementById("rope-pair-label");
  var pairCount = document.getElementById("rope-pair-count");
  var thetaEl = document.getElementById("rope-theta");
  var currentEl = document.getElementById("rope-current");
  var heatReadout = document.getElementById("rope-heat-readout");
  var stage = document.querySelector(".rope-stage");
  if (!dial || !curve || !heat) return;

  var D_MODEL = 64;
  var state = { m: 3, n: 10, pairs: 4, selected: 0, maxPos: 32, rope: true };
  var dialBox = null, curveBox = null, heatBox = null;

  function L(de, en) { return T2.t(de, en); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function theta(i) { return Math.pow(10000, -2 * i / D_MODEL); }
  function dotPair(rel, i) { return Math.cos(rel * theta(i)); }
  function dotAt(rel) {
    if (!state.rope) return 1;
    var sum = 0;
    for (var i = 0; i < state.pairs; i++) sum += dotPair(rel, i);
    return sum / state.pairs;
  }
  function selectedTheta() { return theta(state.selected); }
  function relativeDistance() { return Math.abs(state.m - state.n); }
  function pairDot() { return state.rope ? dotPair(state.n - state.m, state.selected) : 1; }

  function css(name, fallback) { return T2.cssVar(name) || fallback; }
  function stageColor(name, fallback) { return T2.cssVar(name, stage) || fallback; }

  function fitAll() {
    dialBox = T2.fit(dial, dial);
    curveBox = T2.fit(curve, curve);
    heatBox = T2.fit(heat, heat);
  }

  var disp = { q: 0, k: 0 };

  function targetAngles() {
    return {
      q: state.rope ? state.m * selectedTheta() : 0,
      k: state.rope ? state.n * selectedTheta() : 0
    };
  }

  function drawAll() {
    if (!dialBox) fitAll();
    drawCurve();
    drawHeat();
    syncText();
  }

  function drawDial(now) {
    var ctx = dialBox.ctx, w = dialBox.w, h = dialBox.h;
    ctx.clearRect(0, 0, w, h);
    var ink = "#e9f5f8", muted = "rgba(143,170,180,0.9)";
    var gold = css("--gold", "#e3be62");
    var goldBright = "#ffefbf";
    var sky = css("--sky", "#7fb4e6");
    var skyBright = "#c9f3ff";
    var rose = css("--rose", "#e3898c");
    var line = "rgba(150,210,230,0.16)";
    var cx = w / 2, cy = h * 0.5, R = Math.min(w, h) * 0.32;
    var pulse = 0.86 + 0.14 * Math.sin(now * 0.0024);

    var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.55);
    glow.addColorStop(0, "rgba(126,200,239,0.10)");
    glow.addColorStop(0.55, "rgba(126,200,239,0.035)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.45;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.72, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.moveTo(cx - R - 14, cy); ctx.lineTo(cx + R + 14, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - R - 14); ctx.lineTo(cx, cy + R + 14); ctx.stroke();

    for (var k = 0; k < 24; k++) {
      var a = k * Math.PI / 12;
      var len = k % 3 === 0 ? 8 : 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (R - len), cy + Math.sin(a) * (R - len));
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.strokeStyle = k % 3 === 0 ? "rgba(180,232,248,0.34)" : line;
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(143,170,180,0.7)";
    ctx.font = '600 8px "Open Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("0°", cx + R + 20, cy + 3);
    ctx.fillText("90°", cx, cy - R - 19);
    ctx.fillText("180°", cx - R - 22, cy + 3);
    ctx.fillText("270°", cx, cy + R + 22);

    function arrow(angle, len, colorA, colorB, dashed, width) {
      var x = cx + Math.cos(angle) * len;
      var y = cy + Math.sin(angle) * len;
      var grad = ctx.createLinearGradient(cx, cy, x, y);
      grad.addColorStop(0, colorA);
      grad.addColorStop(1, colorB);
      ctx.save();
      if (dashed) ctx.setLineDash([5, 4]);
      ctx.strokeStyle = grad;
      ctx.lineWidth = width || 2;
      ctx.lineCap = "round";
      ctx.shadowColor = colorB;
      ctx.shadowBlur = 16 * pulse;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
      ctx.setLineDash([]);
      var ah = 8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - Math.cos(angle - 0.42) * ah, y - Math.sin(angle - 0.42) * ah);
      ctx.lineTo(x - Math.cos(angle + 0.42) * ah, y - Math.sin(angle + 0.42) * ah);
      ctx.closePath();
      ctx.fillStyle = colorB;
      ctx.shadowBlur = 18 * pulse;
      ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(x, y, dashed ? 3 : 3.6, 0, Math.PI * 2);
      ctx.fillStyle = colorB;
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
      return { x: x, y: y };
    }

    var aq = disp.q, ak = disp.k;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R, cy);
    ctx.strokeStyle = "rgba(143,170,180,0.22)";
    ctx.setLineDash([2, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    var q = arrow(aq, R, gold, goldBright, false, 2.6);
    var kk = arrow(ak, R, sky, skyBright, true, 2.1);
    var delta = Math.atan2(Math.sin(ak - aq), Math.cos(ak - aq));
    if (Math.abs(delta) > 0.02) {
      var start = aq, end = aq + delta;
      ctx.save();
      ctx.strokeStyle = rose;
      ctx.lineWidth = 2;
      ctx.shadowColor = rose;
      ctx.shadowBlur = 12 * pulse;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.62, Math.min(start, end), Math.max(start, end));
      ctx.stroke();
      ctx.restore();
      var mid = aq + delta / 2;
      ctx.fillStyle = rose;
      ctx.font = '700 10px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Δ", cx + Math.cos(mid) * R * 0.72, cy + Math.sin(mid) * R * 0.72 + 3);
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 3.4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(233,245,248,0.9)";
    ctx.shadowColor = "rgba(233,245,248,0.7)";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = goldBright;
    ctx.font = '700 11px "Open Sans", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("q", q.x + 9, q.y - 4);
    ctx.fillStyle = skyBright;
    ctx.fillText("k", kk.x + 9, kk.y + 13);

    ctx.fillStyle = ink;
    ctx.font = '700 17px "Open Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("q · k = " + pairDot().toFixed(3), cx, h - 13);
    ctx.fillStyle = muted;
    ctx.font = '600 10px "Open Sans", sans-serif';
    ctx.fillText(L("Paar ", "pair ") + (state.selected + 1) + " · Δ = " + (delta * 180 / Math.PI).toFixed(1) + "°", cx, h - 32);
  }

  function drawCurve() {
    var ctx = curveBox.ctx, w = curveBox.w, h = curveBox.h;
    ctx.clearRect(0, 0, w, h);
    var gold = css("--gold", "#e3be62");
    var line = "rgba(150,210,230,0.16)";
    var muted = "rgba(143,170,180,0.9)";
    var padL = 48, padR = 20, padT = 20, padB = 36;
    var x0 = padL, x1 = w - padR, y0 = h - padB, y1 = padT;
    var maxRel = Math.max(1, state.maxPos - 1);
    function X(rel) { return x0 + (rel / maxRel) * (x1 - x0); }
    function Y(v) { return y0 - ((v + 1) / 2) * (y0 - y1); }

    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    for (var g = -1; g <= 1; g++) {
      ctx.globalAlpha = g === 0 ? 0.5 : 0.2;
      ctx.beginPath(); ctx.moveTo(x0, Y(g)); ctx.lineTo(x1, Y(g)); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = muted;
    ctx.font = '600 9px "Open Sans", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText("+1", x0 - 7, Y(1) + 3);
    ctx.fillText("0", x0 - 7, Y(0) + 3);
    ctx.fillText("−1", x0 - 7, Y(-1) + 3);
    ctx.textAlign = "center";
    ctx.fillText(L("relativer Abstand |m − n|", "relative distance |m − n|"), (x0 + x1) / 2, h - 9);
    for (var t = 0; t <= 4; t++) {
      var rv = Math.round(maxRel * t / 4);
      var xx = X(rv);
      ctx.strokeStyle = line;
      ctx.beginPath(); ctx.moveTo(xx, y0); ctx.lineTo(xx, y0 + 4); ctx.stroke();
      ctx.fillStyle = "rgba(143,170,180,0.72)";
      ctx.textAlign = "center";
      ctx.fillText(String(rv), xx, h - 19);
    }

    if (state.rope) {
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(143,170,180,0.34)";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x0, Y(1)); ctx.lineTo(x1, Y(1)); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "rgba(143,170,180,0.65)";
      ctx.font = '600 9px "Open Sans", sans-serif';
      ctx.textAlign = "right";
      ctx.fillText(L("ohne RoPE", "without RoPE"), x1 - 4, Y(1) - 6);
    }

    var pts = [];
    for (var rel = 0; rel <= maxRel + 1e-6; rel += 0.04) {
      pts.push({ x: X(rel), y: Y(dotAt(rel)) });
    }
    if (pts.length) {
      var fill = ctx.createLinearGradient(0, y1, 0, y0);
      fill.addColorStop(0, "rgba(227,190,98,0.22)");
      fill.addColorStop(0.55, "rgba(227,190,98,0.07)");
      fill.addColorStop(1, "rgba(227,190,98,0)");
      ctx.beginPath();
      ctx.moveTo(pts[0].x, Y(0));
      pts.forEach(function (p) { ctx.lineTo(p.x, p.y); });
      ctx.lineTo(pts[pts.length - 1].x, Y(0));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }

    ctx.beginPath();
    pts.forEach(function (p, i) { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = gold;
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.shadowBlur = 0;

    var rd = relativeDistance();
    var v = dotAt(rd);
    var cx = X(rd), cy = Y(v);
    ctx.strokeStyle = "rgba(227,190,98,0.5)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(cx, Y(-1)); ctx.lineTo(cx, Y(1)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(cx, cy, 5.2, 0, Math.PI * 2); ctx.fillStyle = gold; ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = "#e9f5f8";
    ctx.font = '700 10px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = cx > w - 70 ? "right" : "left";
    ctx.fillText(v.toFixed(3), cx + (cx > w - 70 ? -9 : 9), cy - 8);
  }

  function heatColor(v) {
    var t = clamp(v, -1, 1);
    var base = [7, 22, 30];
    var target = t >= 0 ? [255, 231, 171] : [242, 145, 150];
    var a = Math.pow(Math.abs(t), 0.62);
    var r = Math.round(base[0] + (target[0] - base[0]) * a);
    var g = Math.round(base[1] + (target[1] - base[1]) * a);
    var b = Math.round(base[2] + (target[2] - base[2]) * a);
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function drawHeat() {
    var ctx = heatBox.ctx, w = heatBox.w, h = heatBox.h;
    ctx.clearRect(0, 0, w, h);
    var N = state.maxPos;
    var size = Math.max(60, Math.min(w - 62, h - 54));
    var cell = size / N;
    var ox = (w - size) / 2, oy = (h - size) / 2 + 2;
    for (var m = 0; m < N; m++) {
      for (var n = 0; n < N; n++) {
        var v = state.rope ? dotAt(Math.abs(m - n)) : 1;
        ctx.fillStyle = heatColor(v);
        ctx.fillRect(ox + n * cell, oy + m * cell, Math.ceil(cell) + 0.5, Math.ceil(cell) + 0.5);
      }
    }
    if (N <= 32) {
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 0.55;
      for (var i = 0; i <= N; i++) {
        ctx.beginPath(); ctx.moveTo(ox + i * cell, oy); ctx.lineTo(ox + i * cell, oy + size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox, oy + i * cell); ctx.lineTo(ox + size, oy + i * cell); ctx.stroke();
      }
    }
    ctx.strokeStyle = "rgba(230,242,246,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(ox, oy, size, size);

    var ccx = ox + state.n * cell + cell / 2;
    var ccy = oy + state.m * cell + cell / 2;
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = "rgba(227,190,98,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox, ccy); ctx.lineTo(ox + size, ccy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ccx, oy); ctx.lineTo(ccx, oy + size); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.6;
    ctx.shadowColor = "#ffe6a0";
    ctx.shadowBlur = 12;
    ctx.strokeRect(ox + state.n * cell, oy + state.m * cell, cell, cell);
    ctx.restore();

    ctx.fillStyle = "rgba(143,170,180,0.95)";
    ctx.font = '600 9px "Open Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("n →", ox + size / 2, oy + size + 15);
    ctx.save();
    ctx.translate(ox - 18, oy + size / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("m →", 0, 0);
    ctx.restore();
    ctx.textAlign = "left";
    ctx.fillText("0", ox, oy - 6);
    ctx.textAlign = "center";
    ctx.fillText(String(Math.floor((N - 1) / 2)), ox + size / 2, oy - 6);
    ctx.textAlign = "right";
    ctx.fillText(String(N - 1), ox + size, oy - 6);
    ctx.textAlign = "left";
    ctx.fillText("0", ox - 5, oy + 8);
    ctx.textAlign = "right";
    ctx.fillText(String(N - 1), ox - 5, oy + size - 2);
  }

  function syncText() {
    var p = state.selected + 1;
    pairLabel.textContent = String(p);
    pairCount.textContent = String(state.pairs);
    thetaEl.textContent = "θ = " + selectedTheta().toFixed(4);
    var rel = relativeDistance();
    var v = dotAt(rel);
    currentEl.textContent = "m=" + state.m + " · n=" + state.n + " · |m−n|=" + rel;
    heatReadout.textContent = L("Zelle ", "cell ") + "(" + state.m + "," + state.n + ") = " + v.toFixed(3);
    dialReadout.innerHTML = L(
      "Paar " + p + ": θ = " + selectedTheta().toFixed(4) + ". q dreht um " + ((state.rope ? state.m * selectedTheta() : 0) * 180 / Math.PI).toFixed(1) + "°, k um " + ((state.rope ? state.n * selectedTheta() : 0) * 180 / Math.PI).toFixed(1) + "°. <b>q·k = " + pairDot().toFixed(3) + "</b>.",
      "Pair " + p + ": θ = " + selectedTheta().toFixed(4) + ". q rotates by " + ((state.rope ? state.m * selectedTheta() : 0) * 180 / Math.PI).toFixed(1) + "°, k by " + ((state.rope ? state.n * selectedTheta() : 0) * 180 / Math.PI).toFixed(1) + "°. <b>q·k = " + pairDot().toFixed(3) + "</b>."
    );
    readout.innerHTML = state.rope
      ? L(
        "Mit RoPE hängt der Score vom relativen Abstand ab. Bei m = n sind q und k ausgerichtet; mit wachsendem Abstand drehen sie sich auseinander. Die Summe über " + state.pairs + " Frequenzpaare bildet den Fingerabdruck.",
        "With RoPE the score depends on relative distance. At m = n, q and k are aligned; as the distance grows they rotate apart. The sum over " + state.pairs + " frequency pairs forms the fingerprint."
      )
      : L(
        "Ohne RoPE bleibt der Score für alle Positionen gleich. Das Modell sieht keine relative Position; die Rotation ist abgeschaltet.",
        "Without RoPE the score stays the same for every position. The model sees no relative position; the rotation is switched off."
      );
  }

  function renderFreqs() {
    if (state.selected >= state.pairs) state.selected = state.pairs - 1;
    freqEl.innerHTML = "";
    for (var i = 0; i < state.pairs; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "rope-freq" + (i === state.selected ? " is-on" : "");
      b.innerHTML = '<span>' + L("Paar ", "pair ") + (i + 1) + '</span><b>θ ' + theta(i).toFixed(3) + '</b><i class="rope-freq-bar" style="width:' + Math.max(6, theta(i) * 100).toFixed(1) + '%"></i>';
      b.setAttribute("title", L("Frequenzpaar ", "frequency pair ") + (i + 1) + ": θ = " + theta(i).toFixed(5));
      b.addEventListener("click", function (idx) {
        return function () {
          state.selected = idx;
          renderFreqs();
          drawAll();
        };
      }(i));
      freqEl.appendChild(b);
    }
  }

  function renderControls() {
    controls.innerHTML =
      '<label class="t2-range th-range"><span>' + L("Position m", "Position m") + '</span><input type="range" id="rope-m" min="0" max="' + (state.maxPos - 1) + '" step="1" value="' + state.m + '"><output>' + state.m + '</output></label>' +
      '<label class="t2-range th-range"><span>' + L("Position n", "Position n") + '</span><input type="range" id="rope-n" min="0" max="' + (state.maxPos - 1) + '" step="1" value="' + state.n + '"><output>' + state.n + '</output></label>' +
      '<label class="t2-range th-range"><span>' + L("Frequenzpaare", "Frequency pairs") + '</span><input type="range" id="rope-pairs" min="1" max="8" step="1" value="' + state.pairs + '"><output>' + state.pairs + '</output></label>' +
      '<div class="th-switchrow" role="group" aria-label="' + L("Maximale Position", "Maximum position") + '">' +
        [16, 32, 64].map(function (n) {
          return '<button type="button" class="proto-chip' + (state.maxPos === n ? ' is-on' : '') + '" data-rope-max="' + n + '">' + n + '</button>';
        }).join("") +
      '</div>' +
      '<div class="th-switchrow" role="tablist" aria-label="RoPE">' +
        '<button type="button" class="proto-chip' + (state.rope ? ' is-on' : '') + '" data-rope-toggle="on" role="tab" aria-selected="' + (state.rope ? "true" : "false") + '">RoPE</button>' +
        '<button type="button" class="proto-chip' + (!state.rope ? ' is-on' : '') + '" data-rope-toggle="off" role="tab" aria-selected="' + (!state.rope ? "true" : "false") + '">' + L("Ohne", "Off") + '</button>' +
      '</div>' +
      '<button type="button" class="proto-btn proto-btn--ghost" data-rope-reset>' + L("Reset", "Reset") + '</button>';

    var m = controls.querySelector("#rope-m");
    var n = controls.querySelector("#rope-n");
    var pairs = controls.querySelector("#rope-pairs");
    m.addEventListener("input", function () {
      state.m = clamp(parseInt(m.value, 10) || 0, 0, state.maxPos - 1);
      m.nextElementSibling.textContent = String(state.m);
      drawAll();
    });
    n.addEventListener("input", function () {
      state.n = clamp(parseInt(n.value, 10) || 0, 0, state.maxPos - 1);
      n.nextElementSibling.textContent = String(state.n);
      drawAll();
    });
    pairs.addEventListener("input", function () {
      state.pairs = clamp(parseInt(pairs.value, 10) || 1, 1, 8);
      if (state.selected >= state.pairs) state.selected = state.pairs - 1;
      pairs.nextElementSibling.textContent = String(state.pairs);
      renderFreqs();
      drawAll();
    });
    controls.querySelectorAll("[data-rope-max]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.maxPos = parseInt(b.getAttribute("data-rope-max"), 10);
        state.m = clamp(state.m, 0, state.maxPos - 1);
        state.n = clamp(state.n, 0, state.maxPos - 1);
        renderControls();
        drawAll();
      });
    });
    controls.querySelectorAll("[data-rope-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.rope = b.getAttribute("data-rope-toggle") === "on";
        renderControls();
        drawAll();
      });
    });
    controls.querySelector("[data-rope-reset]").addEventListener("click", function () {
      state = { m: 3, n: 10, pairs: 4, selected: 0, maxPos: 32, rope: true };
      renderControls();
      renderFreqs();
      drawAll();
    });
  }

  var dialLoop = T2.loop(function (now) {
    if (!dialBox) return;
    var t = targetAngles();
    if (T2.reduced()) {
      disp.q = t.q;
      disp.k = t.k;
    } else {
      disp.q += (t.q - disp.q) * 0.16;
      disp.k += (t.k - disp.k) * 0.16;
    }
    drawDial(now);
  });

  T2.onResize(stage, function () { fitAll(); drawAll(); });
  T2.onTheme(function () { drawAll(); });
  T2.onLang(function () {
    renderControls();
    renderFreqs();
    drawAll();
  });

  renderControls();
  renderFreqs();
  requestAnimationFrame(function () {
    fitAll();
    disp = targetAngles();
    drawAll();
    dialLoop.start();
  });
})();
