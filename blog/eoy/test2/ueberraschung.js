(function () {
  "use strict";

  var canvas = document.getElementById("ce-canvas");
  var wrap = document.querySelector(".ce-machine-wrap");
  var curve = document.getElementById("ce-curve");
  var targetsEl = document.getElementById("ce-targets");
  var guessEl = document.getElementById("ce-guess-btns");
  var sentenceEl = document.getElementById("ce-sentence");
  var readout = document.getElementById("ce-readout");
  var lossEl = document.getElementById("ce-loss");
  var pEl = document.getElementById("ce-p");
  var topEl = document.getElementById("ce-top");
  var guessText = document.getElementById("ce-guess");
  var guessResult = document.getElementById("ce-guess-result");
  var stepsEl = document.getElementById("ce-steps");
  var needle = document.getElementById("ce-needle");
  var tempInput = document.getElementById("ce-temp");
  var tempOut = document.getElementById("ce-temp-out");
  if (!canvas || !wrap) return;

  var TOKENS = ["Paris", "London", "Berlin", "Rome", "Madrid"];
  var SENTENCES = [
    ["Die Hauptstadt von Frankreich ist ___", "The capital of France is ___"],
    ["Die Hauptstadt des Vereinigten Königreichs ist ___", "The capital of the United Kingdom is ___"],
    ["Die Hauptstadt von Deutschland ist ___", "The capital of Germany is ___"],
    ["Die Hauptstadt von Italien ist ___", "The capital of Italy is ___"],
    ["Die Hauptstadt von Spanien ist ___", "The capital of Spain is ___"]
  ];
  var INITIAL = [0.9, 2.4, 0.7, 0.4, 0.2];
  var state = {
    logits: INITIAL.slice(),
    target: 0,
    temp: 1,
    guess: null,
    steps: 0,
    history: [],
    ball: null,
    tween: null,
    targetX: 0,
    targetY: 0
  };

  function L(de, en) { return T2.t(de, en); }

  function softmax(logits, temp) {
    var t = temp || 1;
    var max = Math.max.apply(null, logits);
    var ex = logits.map(function (z) { return Math.exp((z - max) / t); });
    var sum = ex.reduce(function (a, b) { return a + b; }, 0);
    return ex.map(function (e) { return e / sum; });
  }

  function probs() { return softmax(state.logits, state.temp); }
  function lossOf(p) { return -Math.log(Math.max(1e-6, p[state.target])); }
  function currentLoss() { return lossOf(probs()); }
  function topIndex() {
    var p = probs(), best = 0;
    for (var i = 1; i < p.length; i++) if (p[i] > p[best]) best = i;
    return best;
  }

  function buildTargets() {
    targetsEl.innerHTML = TOKENS.map(function (tok, i) {
      return '<button type="button" class="proto-chip' + (i === state.target ? ' is-on' : '') + '" data-target="' + i + '" role="button">' + tok + '</button>';
    }).join("");
    targetsEl.querySelectorAll("[data-target]").forEach(function (b) {
      b.addEventListener("click", function () { setTarget(parseInt(b.getAttribute("data-target"), 10)); });
    });
  }

  function buildGuesses() {
    guessEl.innerHTML = TOKENS.map(function (tok, i) {
      return '<button type="button" class="proto-chip' + (i === state.guess ? ' is-on' : '') + '" data-guess="' + i + '">' + tok + '</button>';
    }).join("");
    guessEl.querySelectorAll("[data-guess]").forEach(function (b) {
      b.addEventListener("click", function () { makeGuess(parseInt(b.getAttribute("data-guess"), 10)); });
    });
  }

  function setTarget(i) {
    state.target = i;
    state.ball = null;
    state.history = [currentLoss()];
    buildTargets();
    update();
    narrate(L(
      "Wahres Token: " + TOKENS[i] + ". Die Rampe dieses Tokens ist " + (probs()[i] < 0.2 ? "schmal" : probs()[i] < 0.5 ? "mittel" : "breit") + ". Drücke „Kugel fallen lassen“.",
      "True token: " + TOKENS[i] + ". The ramp for this token is " + (probs()[i] < 0.2 ? "narrow" : probs()[i] < 0.5 ? "medium" : "wide") + ". Press “Drop the ball”."
    ));
  }

  function makeGuess(i) {
    state.guess = i;
    buildGuesses();
    update();
    var top = topIndex();
    if (i === top) {
      narrate(L(
        "Dein Tipp ist das aktuelle Top-Token. Das Modell würde hier " + TOKENS[top] + " am ehesten wählen. Das ist noch keine Garantie für Wahrheit.",
        "Your guess is the current top token. The model would most likely choose " + TOKENS[top] + " here. That is not a guarantee of truth."
      ));
    } else {
      narrate(L(
        "Dein Tipp ist " + TOKENS[i] + ", das Modell sieht " + TOKENS[top] + " vorn. Die Verteilung erlaubt beides; die Wahrscheinlichkeiten sind nur ungleich.",
        "Your guess is " + TOKENS[i] + "; the model favours " + TOKENS[top] + ". The distribution allows both; the probabilities are just unequal."
      ));
    }
  }

  function narrate(html) { readout.innerHTML = html; }

  function update() {
    var p = probs();
    var loss = lossOf(p);
    lossEl.textContent = loss.toFixed(2);
    pEl.textContent = Math.round(p[state.target] * 100) + " %";
    topEl.textContent = TOKENS[topIndex()];
    stepsEl.textContent = String(state.steps);
    if (state.guess == null) {
      guessText.textContent = "—";
      guessResult.textContent = "—";
      guessResult.className = "";
    } else {
      guessText.textContent = TOKENS[state.guess];
      var right = state.guess === topIndex();
      guessResult.textContent = right ? L("richtig", "right") : L("daneben", "off");
      guessResult.className = right ? "is-good" : "is-bad";
    }
    var angle = -60 + (T2.clamp(loss, 0, 3) / 3) * 120;
    needle.style.transform = "rotate(" + angle.toFixed(1) + "deg)";
    sentenceEl.textContent = L(SENTENCES[state.target][0], SENTENCES[state.target][1]);
    drawCurve();
    drawMachine();
  }

  function trainStep() {
    if (state.tween) return;
    var p = probs();
    var g = p.map(function (v, i) { return v - (i === state.target ? 1 : 0); });
    var lr = 0.85;
    var from = state.logits.slice();
    var to = state.logits.map(function (z, i) { return z - lr * g[i]; });
    state.history.push(currentLoss());
    if (state.history.length > 42) state.history.shift();
    if (T2.reduced()) {
      state.logits = to;
      state.steps++;
      update();
      narrateTrain();
      return;
    }
    state.tween = { from: from, to: to, start: performance.now(), dur: 360 };
  }

  function narrateTrain() {
    var p = probs();
    var loss = lossOf(p);
    var extra = p[state.target] > 0.9
      ? L(" Das Ziel ist fast sicher; die Überraschung geht gegen null.", " The target is almost certain; the surprise goes to zero.")
      : "";
    narrate(L(
      "Schritt " + state.steps + ": p(Ziel) = " + (p[state.target] * 100).toFixed(0) + " %, Überraschung = " + loss.toFixed(2) + " nats." + extra,
      "Step " + state.steps + ": p(target) = " + (p[state.target] * 100).toFixed(0) + " %, surprise = " + loss.toFixed(2) + " nats." + extra
    ));
  }

  function drop() {
    if (state.ball) return;
    state.ball = { t: 0, start: performance.now(), dur: T2.reduced() ? 1 : 720, done: false };
    var p = probs();
    narrate(L(
      "Die Kugel fällt in die Rampe für " + TOKENS[state.target] + ". p(Ziel) = " + (p[state.target] * 100).toFixed(0) + " %, Überraschung = " + lossOf(p).toFixed(2) + " nats.",
      "The ball falls into the ramp for " + TOKENS[state.target] + ". p(target) = " + (p[state.target] * 100).toFixed(0) + " %, surprise = " + lossOf(p).toFixed(2) + " nats."
    ));
  }

  function reset() {
    state.logits = INITIAL.slice();
    state.target = 0;
    state.temp = 1;
    state.guess = null;
    state.steps = 0;
    state.ball = null;
    state.tween = null;
    state.history = [];
    tempInput.value = "1";
    tempOut.textContent = "1.0";
    buildTargets();
    buildGuesses();
    update();
    narrate(L(
      "Zurückgesetzt. Das Modell ist sich noch unsicher; die Überraschung über das wahre Token ist hoch.",
      "Reset. The model is still unsure; the surprise about the true token is high."
    ));
  }

  /* Machine canvas */
  var box = null;
  function ensureCanvas() {
    box = T2.fit(canvas, wrap);
    drawMachine();
  }

  function color(name) { return T2.cssVar(name) || "#c99a2e"; }
  var WARM = "rgba(244, 231, 201, 0.86)";
  var WARM_SOFT = "rgba(244, 231, 201, 0.52)";
  var WARM_LINE = "rgba(244, 231, 201, 0.16)";

  function drawMachine() {
    if (!box) return;
    var ctx = box.ctx, w = box.w, h = box.h;
    ctx.clearRect(0, 0, w, h);
    var p = probs();
    var padX = Math.max(18, w * 0.035);
    var topY = Math.max(62, h * 0.16);
    var baseY = h - Math.max(54, h * 0.12);
    var gap = Math.max(7, w * 0.012);
    var cellW = (w - padX * 2 - gap * (TOKENS.length - 1)) / TOKENS.length;
    var colors = [color("--gold"), color("--sky"), color("--rose"), color("--lilac"), color("--green")];

    ctx.strokeStyle = WARM_LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX * 0.6, baseY + 0.5);
    ctx.lineTo(w - padX * 0.6, baseY + 0.5);
    ctx.stroke();

    for (var i = 0; i < TOKENS.length; i++) {
      var cx = padX + i * (cellW + gap) + cellW / 2;
      var topW = Math.max(9, Math.min(cellW * 0.94, p[i] * w * 0.5));
      var bottomW = Math.max(14, cellW * 0.34);
      var isTarget = i === state.target;
      ctx.beginPath();
      ctx.moveTo(cx - topW / 2, topY);
      ctx.lineTo(cx + topW / 2, topY);
      ctx.lineTo(cx + bottomW / 2, baseY);
      ctx.lineTo(cx - bottomW / 2, baseY);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.globalAlpha = isTarget ? 0.42 : 0.13;
      ctx.fill();
      ctx.globalAlpha = isTarget ? 0.95 : 0.38;
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = isTarget ? 2 : 1.2;
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (isTarget) {
        state.targetX = cx;
        state.targetY = baseY - 8;
        ctx.fillStyle = WARM;
        ctx.font = '700 10px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(L("ZIEL", "TARGET"), cx, topY - 14);
      }

      ctx.fillStyle = isTarget ? WARM : WARM_SOFT;
      ctx.font = '700 11px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(Math.round(p[i] * 100) + " %", cx, baseY + 18);
      ctx.fillStyle = isTarget ? color("--gold") : WARM;
      ctx.font = (isTarget ? "700 " : "600 ") + '12px "Open Sans", sans-serif';
      ctx.fillText(TOKENS[i], cx, baseY + 35);
    }

    var ballX = w / 2, ballY = topY - 26;
    if (state.ball) {
      var t = state.ball.dur <= 1 ? 1 : T2.clamp((performance.now() - state.ball.start) / state.ball.dur, 0, 1);
      var e = T2.ease(t);
      ballX = T2.lerp(w / 2, state.targetX, e);
      ballY = T2.lerp(topY - 26, state.targetY, e);
      if (t >= 1) {
        if (!state.ball.done) {
          state.ball.done = true;
          state.ball = null;
          update();
        }
      }
    }
    var grd = ctx.createRadialGradient(ballX - 2, ballY - 2, 1, ballX, ballY, 9);
    grd.addColorStop(0, "#fff6dd");
    grd.addColorStop(0.45, color("--gold"));
    grd.addColorStop(1, "#7a5a17");
    ctx.beginPath();
    ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.shadowColor = "rgba(227,190,98,.65)";
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  /* Loss curve */
  var curveBox = null;
  function drawCurve() {
    if (!curveBox) {
      if (!curve.clientHeight) return;
      curveBox = T2.fit(curve, curve);
    }
    var ctx = curveBox.ctx, w = curveBox.w, h = curveBox.h;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = T2.cssVar("--line") || "#d8d2c2";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - 1.5);
    ctx.lineTo(w, h - 1.5);
    ctx.stroke();
    var hist = state.history.slice();
    if (!hist.length) return;
    var maxLoss = Math.max(1, Math.max.apply(null, hist));
    ctx.beginPath();
    for (var i = 0; i < hist.length; i++) {
      var x = hist.length === 1 ? 0 : (i / (hist.length - 1)) * (w - 4) + 2;
      var y = h - 4 - (hist[i] / maxLoss) * (h - 10);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = T2.cssVar("--gold") || "#c99a2e";
    ctx.lineWidth = 2;
    ctx.stroke();
    var lastX = hist.length === 1 ? 2 : w - 2;
    var lastY = h - 4 - (hist[hist.length - 1] / maxLoss) * (h - 10);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = T2.cssVar("--gold") || "#c99a2e";
    ctx.fill();
  }

  function updateTemp() {
    state.temp = parseFloat(tempInput.value) || 1;
    tempOut.textContent = state.temp.toFixed(1);
    update();
    narrate(L(
      "Temperatur " + state.temp.toFixed(1) + ": " + (state.temp < 1 ? "schärfer, die Verteilung konzentriert sich." : state.temp > 1 ? "flacher, die Verteilung verteilt sich." : "neutral.") + " Die Überraschung über das Ziel ändert sich mit.",
      "Temperature " + state.temp.toFixed(1) + ": " + (state.temp < 1 ? "sharper, the distribution concentrates." : state.temp > 1 ? "flatter, the distribution spreads out." : "neutral.") + " The surprise about the target changes with it."
    ));
  }

  /* Loop handles ball and training tween */
  var last = 0;
  T2.loop(function (now) {
    if (last) {
      // nothing time-based except ball/tween
    }
    last = now;
    if (state.tween) {
      var t = T2.clamp((now - state.tween.start) / state.tween.dur, 0, 1);
      var e = T2.ease(t);
      state.logits = state.tween.from.map(function (z, i) { return T2.lerp(z, state.tween.to[i], e); });
      if (t >= 1) {
        state.logits = state.tween.to.slice();
        state.tween = null;
        state.steps++;
        update();
        narrateTrain();
      } else {
        update();
      }
    } else if (state.ball) {
      drawMachine();
    } else {
      drawMachine();
    }
  }).start();

  /* Wiring */
  document.querySelector("[data-ce-train]").addEventListener("click", trainStep);
  document.querySelector("[data-ce-drop]").addEventListener("click", drop);
  document.querySelector("[data-ce-reset]").addEventListener("click", reset);
  tempInput.addEventListener("input", updateTemp);

  var stopResize = T2.onResize(wrap, function () { ensureCanvas(); drawCurve(); });
  T2.onResize(curve.parentElement, function () { curveBox = null; drawCurve(); });
  T2.onTheme(function () { ensureCanvas(); curveBox = null; drawCurve(); });
  T2.onLang(function () { update(); });

  buildTargets();
  buildGuesses();
  state.history = [currentLoss()];
  ensureCanvas();
  update();
  narrate(L(
    "Wähle das wahre nächste Token und drücke „Kugel fallen lassen“. Tippe vorher, welches Token das Modell für am wahrscheinlichsten hält.",
    "Choose the true next token and press “Drop the ball”. Before that, guess which token the model considers most likely."
  ));
  window.addEventListener("beforeunload", function () { stopResize(); });
})();
