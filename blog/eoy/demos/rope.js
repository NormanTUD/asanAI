(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;

  function ropeScene(root, api) {
    var DE = api.lang === "de";
    function L(de, en) { return DE ? de : en; }
    var clamp = api.util && api.util.clamp ? api.util.clamp : core.clamp;
    var reduced = !!api.reducedMotion;
    var D_MODEL = 64;

    var C = {
      ink: "#e9f5f8",
      muted: "#8faab4",
      line: "rgba(150,210,230,0.16)",
      lineStrong: "rgba(180,232,248,0.42)",
      sky: "#7ec8ef",
      skyBright: "#c9f3ff",
      gold: "#e3be62",
      goldBright: "#ffefbf",
      rose: "#e3898c"
    };

    var el = document.createElement("div");
    el.className = "ls-rope-scene";
    el.innerHTML =
      '<div class="ls-rope-left">' +
        '<div class="ls-rope-formula">' +
          '<div class="ls-rope-formula-head"><b>RoPE</b><span>' + L("exakt", "exact") + '</span></div>' +
          '<div class="ls-rope-eq">q<sub>m</sub> = R(mθ) q</div>' +
          '<div class="ls-rope-eq">k<sub>n</sub> = R(nθ) k</div>' +
          '<div class="ls-rope-matrow"><span>R(φ) =</span><span class="ls-rope-mat"><i>cos φ</i><i>−sin φ</i><i>sin φ</i><i>cos φ</i></span></div>' +
          '<div class="ls-rope-eq is-key">q<sub>m</sub> · k<sub>n</sub> = q · R((n−m)θ) k</div>' +
          '<div class="ls-rope-eq is-small">θ<sub>i</sub> = 10000<sup>−2i/d</sup> · d = 64 → 32 ' + L("Paare", "pairs") + '</div>' +
        '</div>' +
        '<div class="ls-rope-controls">' +
          '<label class="ls-rope-range"><span>' + L("Position m", "Position m") + '</span><input type="range" data-rope="m" min="0" max="31" value="3"><output>3</output></label>' +
          '<label class="ls-rope-range"><span>' + L("Position n", "Position n") + '</span><input type="range" data-rope="n" min="0" max="31" value="10"><output>10</output></label>' +
          '<label class="ls-rope-range"><span>' + L("Paare", "Pairs") + '</span><input type="range" data-rope="pairs" min="1" max="8" value="4"><output>4</output></label>' +
          '<div class="ls-rope-switch" role="group">' +
            '<button type="button" data-rope-mode="on" class="is-on">RoPE</button>' +
            '<button type="button" data-rope-mode="off">' + L("Ohne", "Off") + '</button>' +
            '<button type="button" data-rope-spin class="is-on">' + L("Drehung", "Spin") + '</button>' +
            '<button type="button" data-rope-reset>' + L("Reset", "Reset") + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="ls-rope-freqs" role="group" aria-label="' + L("Dimensionspaare", "Dimension pairs") + '"></div>' +
        '<p class="ls-rope-readout" aria-live="polite"></p>' +
      '</div>' +
      '<div class="ls-rope-right">' +
        '<div class="ls-rope-view ls-rope-view--2d">' +
          '<div class="ls-rope-view-head"><b>' + L("2 Dimensionen", "2 dimensions") + '</b><span>' + L("ein Frequenzpaar", "one frequency pair") + '</span></div>' +
          '<canvas class="ls-rope-dial" role="img" aria-label="' + L("q und k in einem 2D-Paar, um ihre Positionen gedreht", "q and k in a 2D pair, rotated by their positions") + '"></canvas>' +
          '<p class="ls-rope-view-foot" data-rope-dial-foot></p>' +
        '</div>' +
        '<div class="ls-rope-view ls-rope-view--3d">' +
          '<div class="ls-rope-view-head"><b>' + L("3 Achsen", "3 axes") + '</b><span>' + L("2 Dimensionen + Position", "2 dimensions + position") + '</span></div>' +
          '<canvas class="ls-rope-helix" role="img" aria-label="' + L("Die Rotation über Positionen als Helix; die Positionsachse ist die dritte Achse", "The rotation across positions as a helix; the position axis is the third axis") + '"></canvas>' +
          '<p class="ls-rope-view-foot">' + L("Ziehen dreht die Ansicht · Position als dritte Achse", "Drag rotates the view · position as the third axis") + '</p>' +
        '</div>' +
      '</div>';
    root.appendChild(el);

    var dialCanvas = el.querySelector(".ls-rope-dial");
    var helixCanvas = el.querySelector(".ls-rope-helix");
    var freqEl = el.querySelector(".ls-rope-freqs");
    var readout = el.querySelector(".ls-rope-readout");
    var dialFoot = el.querySelector("[data-rope-dial-foot]");
    var helixFoot = el.querySelector(".ls-rope-view--3d .ls-rope-view-foot");
    var mEl = el.querySelector('[data-rope="m"]');
    var nEl = el.querySelector('[data-rope="n"]');
    var pairsEl = el.querySelector('[data-rope="pairs"]');
    var modeBtns = Array.prototype.slice.call(el.querySelectorAll("[data-rope-mode]"));
    var spinBtn = el.querySelector("[data-rope-spin]");
    var resetBtn = el.querySelector("[data-rope-reset]");

    var state = { m: 3, n: 10, pairs: 4, selected: 0, maxPos: 32, rope: true, spin: !reduced };
    var dialBox = null, helixBox = null;
    var dispQ = 0, dispK = 0, yaw = 0.62, pitch = 0.34;
    var drag = null, raf = 0, last = 0;

    function theta(i) { return Math.pow(10000, -2 * i / D_MODEL); }
    function selectedTheta() { return theta(state.selected); }
    function relative() { return Math.abs(state.m - state.n); }
    function targetAngles() {
      var th = selectedTheta();
      return { q: state.rope ? state.m * th : 0, k: state.rope ? state.n * th : 0 };
    }
    function pairDot() { return state.rope ? Math.cos(relative() * selectedTheta()) : 1; }

    function fit() {
      dialBox = api.fit(dialCanvas, dialCanvas);
      helixBox = api.fit(helixCanvas, helixCanvas);
    }

    function drawDial() {
      if (!dialBox) return;
      var ctx = dialBox.ctx, w = dialBox.w, h = dialBox.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, cy = h * 0.46, R = Math.min(w * 0.28, h * 0.36);
      var pulse = 0.86 + 0.14 * Math.sin(performance.now() * 0.0024);

      var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.6);
      glow.addColorStop(0, "rgba(126,200,239,0.12)");
      glow.addColorStop(0.55, "rgba(126,200,239,0.035)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.72, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(cx - R - 12, cy); ctx.lineTo(cx + R + 12, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - R - 12); ctx.lineTo(cx, cy + R + 12); ctx.stroke();

      for (var k = 0; k < 24; k++) {
        var a = k * Math.PI / 12;
        var len = k % 3 === 0 ? 8 : 4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (R - len), cy + Math.sin(a) * (R - len));
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.strokeStyle = k % 3 === 0 ? "rgba(180,232,248,0.34)" : C.line;
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(143,170,180,0.72)";
      ctx.font = '600 8px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("0°", cx + R + 19, cy + 3);
      ctx.fillText("90°", cx, cy - R - 18);
      ctx.fillText("180°", cx - R - 20, cy + 3);
      ctx.fillText("270°", cx, cy + R + 21);

      function arrow(angle, colorA, colorB, dashed, width) {
        var x = cx + Math.cos(angle) * R;
        var y = cy + Math.sin(angle) * R;
        var grad = ctx.createLinearGradient(cx, cy, x, y);
        grad.addColorStop(0, colorA);
        grad.addColorStop(1, colorB);
        ctx.save();
        if (dashed) ctx.setLineDash([5, 4]);
        ctx.strokeStyle = grad;
        ctx.lineWidth = width;
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

      var aq = dispQ, ak = dispK;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R, cy);
      ctx.strokeStyle = "rgba(143,170,180,0.22)";
      ctx.setLineDash([2, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      var q = arrow(aq, C.gold, C.goldBright, false, 2.6);
      var kk = arrow(ak, C.sky, C.skyBright, true, 2.1);
      var delta = Math.atan2(Math.sin(ak - aq), Math.cos(ak - aq));
      if (Math.abs(delta) > 0.02) {
        var start = aq, end = aq + delta;
        ctx.save();
        ctx.strokeStyle = C.rose;
        ctx.lineWidth = 2;
        ctx.shadowColor = C.rose;
        ctx.shadowBlur = 12 * pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.62, Math.min(start, end), Math.max(start, end));
        ctx.stroke();
        ctx.restore();
        var mid = aq + delta / 2;
        ctx.fillStyle = C.rose;
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

      ctx.font = '700 11px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillStyle = C.goldBright;
      ctx.fillText("q", q.x + 9, q.y - 4);
      ctx.fillStyle = C.skyBright;
      ctx.fillText("k", kk.x + 9, kk.y + 13);

      ctx.fillStyle = C.ink;
      ctx.font = '700 16px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("q · k = " + Math.cos(delta).toFixed(3), cx, h - 12);
      ctx.fillStyle = C.muted;
      ctx.font = '600 9px "Open Sans", sans-serif';
      ctx.fillText(L("Paar ", "pair ") + (state.selected + 1) + " · Δ = " + (delta * 180 / Math.PI).toFixed(1) + "°", cx, h - 30);
    }

    function drawHelix() {
      if (!helixBox) return;
      var ctx = helixBox.ctx, w = helixBox.w, h = helixBox.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w * 0.5, cy = h * 0.49;
      var unit = Math.min(w * 0.32, h * 0.31);
      var focal = 3.8;
      var cyw = Math.cos(yaw), syw = Math.sin(yaw);
      var cp = Math.cos(pitch), sp = Math.sin(pitch);

      function project(x, y, z) {
        var xr = x * cyw - y * syw;
        var yr = x * syw + y * cyw;
        var sx = xr;
        var sy = z * cp - yr * sp;
        var depth = z * sp + yr * cp;
        var scale = focal / (focal + depth);
        return { x: cx + sx * scale * unit, y: cy - sy * scale * unit, depth: depth, scale: scale };
      }
      function zAt(p) { return (p / (state.maxPos - 1)) * 2.6 - 1.3; }

      var glow = ctx.createRadialGradient(cx, cy - unit * 0.2, 0, cx, cy - unit * 0.2, unit * 2.2);
      glow.addColorStop(0, "rgba(126,200,239,0.10)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      function axis(from, to, label, color) {
        var a = project(from[0], from[1], from[2]);
        var b = project(to[0], to[1], to[2]);
        ctx.strokeStyle = color || C.lineStrong;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.font = '600 8px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(label, b.x, b.y - 7);
      }
      axis([0, 0, -1.3], [1.35, 0, -1.3], L("Dimension 1", "Dimension 1"), "rgba(227,190,98,0.5)");
      axis([0, 0, -1.3], [0, 1.35, -1.3], L("Dimension 2", "Dimension 2"), "rgba(126,200,239,0.5)");
      axis([0, 0, -1.3], [0, 0, 1.35], L("Position", "Position"), "rgba(180,232,248,0.36)");

      function ring(z, color, radius) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var i = 0; i <= 64; i++) {
          var a = i / 64 * Math.PI * 2;
          var p = project(Math.cos(a) * (radius || 1), Math.sin(a) * (radius || 1), z);
          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      for (var r = 0; r <= 4; r++) ring(-1.3 + r * 0.65, "rgba(150,210,230,0.08)", 1.15);
      ring(zAt(state.m), "rgba(227,190,98,0.26)", 1.06);
      ring(zAt(state.n), "rgba(126,200,239,0.26)", 1.06);

      function helix(pair, selected) {
        var th = theta(pair);
        var grad = null;
        if (selected) {
          grad = ctx.createLinearGradient(0, cy - unit * 1.4, 0, cy + unit * 1.4);
          grad.addColorStop(0, C.gold);
          grad.addColorStop(1, C.sky);
        }
        ctx.save();
        ctx.strokeStyle = selected ? grad : "rgba(126,200,239,0.16)";
        ctx.lineWidth = selected ? 2.2 : 1;
        ctx.lineCap = "round";
        if (selected) {
          ctx.shadowColor = C.sky;
          ctx.shadowBlur = 14;
        }
        ctx.beginPath();
        var started = false;
        for (var p = 0; p < state.maxPos; p += 0.2) {
          var a = state.rope ? p * th : 0;
          var q = project(Math.cos(a), Math.sin(a), zAt(p));
          if (!started) { ctx.moveTo(q.x, q.y); started = true; } else ctx.lineTo(q.x, q.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      for (var pi = 0; pi < state.pairs; pi++) {
        if (pi === state.selected) continue;
        helix(pi, false);
      }
      helix(state.selected, true);

      function marker(pos, pair, color, label) {
        var th = theta(pair);
        var a = state.rope ? pos * th : 0;
        var z = zAt(pos);
        var base = project(0, 0, z);
        var tip = project(Math.cos(a), Math.sin(a), z);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
        ctx.beginPath(); ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.restore();
        ctx.fillStyle = color;
        ctx.font = '700 9px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(label, tip.x + 8, tip.y - 4);
      }
      marker(state.m, state.selected, C.goldBright, "q");
      marker(state.n, state.selected, C.skyBright, "k");

      ctx.fillStyle = C.muted;
      ctx.font = '600 8px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(L("gold: q · cyan: k · blass: andere Paare", "gold: q · cyan: k · faint: other pairs"), w / 2, h - 9);
    }

    function syncText() {
      var p = state.selected + 1;
      var th = selectedTheta();
      var dot = pairDot();
      var rel = relative();
      var dimA = 2 * state.selected + 1, dimB = 2 * state.selected + 2;
      var full = state.rope ? (state.n - state.m) * th : 0;
      var minor = Math.atan2(Math.sin(full), Math.cos(full));
      if (state.rope) {
        readout.innerHTML =
          '<b>' + L("Paar ", "pair ") + p + '</b> <span>' + L("Dimensionen", "dimensions") + ' ' + dimA + ', ' + dimB + '</span> · ' +
          'θ = <b>' + th.toFixed(4) + '</b> · m = <b>' + state.m + '</b>, n = <b>' + state.n + '</b> · ' +
          '|m−n| = <b>' + rel + '</b> · (n−m)θ = <b>' + full.toFixed(2) + ' rad</b> · q·k = <b>' + dot.toFixed(3) + '</b>';
      } else {
        readout.innerHTML =
          '<b>' + L("RoPE aus", "RoPE off") + '</b> · ' + L("Paar ", "pair ") + p + ' (' + L("Dimensionen", "dimensions") + ' ' + dimA + ', ' + dimB + ') · ' +
          'm = <b>' + state.m + '</b>, n = <b>' + state.n + '</b> · ' +
          L("q und k bleiben stehen", "q and k stay put") + ' · q·k = <b>1.000</b>';
      }
      dialFoot.textContent = L("Winkel q↔k = ", "angle q↔k = ") + (minor * 180 / Math.PI).toFixed(1) + '° · q·k = ' + dot.toFixed(3);
      if (dialFoot) dialFoot.setAttribute("title", L("Ein Frequenzpaar: zwei Dimensionen drehen sich um ihre Position.", "One frequency pair: two dimensions rotate by their position."));
      if (helixFoot) {
        helixFoot.textContent = state.rope
          ? L("Ziehen dreht die Ansicht · Rotation über Positionen als Helix", "Drag to rotate · rotation across positions as a helix")
          : L("ohne RoPE: der Vektor bleibt stehen; die Helix wird zur geraden Linie · Ziehen dreht die Ansicht", "Without RoPE: the vector stays put; the helix becomes a straight line · drag rotates the view");
      }
    }

    function renderFreqs() {
      if (state.selected >= state.pairs) state.selected = state.pairs - 1;
      freqEl.innerHTML = "";
      for (var i = 0; i < state.pairs; i++) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ls-rope-freq" + (i === state.selected ? " is-on" : "");
        b.innerHTML = '<span>' + L("Paar ", "pair ") + (i + 1) + '</span><b>θ ' + theta(i).toFixed(3) + '</b>';
        b.title = L("Paar ", "pair ") + (i + 1) + L(" · Dimensionen ", " · dimensions ") + (2 * i + 1) + "/" + (2 * i + 2);
        b.addEventListener("click", function (idx) {
          return function () {
            state.selected = idx;
            renderFreqs();
            syncText();
            drawDial();
            drawHelix();
          };
        }(i));
        freqEl.appendChild(b);
      }
    }

    function syncControls() {
      mEl.value = String(state.m);
      nEl.value = String(state.n);
      pairsEl.value = String(state.pairs);
      mEl.nextElementSibling.textContent = String(state.m);
      nEl.nextElementSibling.textContent = String(state.n);
      pairsEl.nextElementSibling.textContent = String(state.pairs);
      modeBtns.forEach(function (b) {
        var on = (b.getAttribute("data-rope-mode") === "on") === state.rope;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      if (spinBtn) {
        spinBtn.classList.toggle("is-on", state.spin);
        spinBtn.setAttribute("aria-pressed", String(state.spin));
      }
    }

    function reset() {
      state = { m: 3, n: 10, pairs: 4, selected: 0, maxPos: 32, rope: true, spin: !reduced };
      dispQ = targetAngles().q;
      dispK = targetAngles().k;
      syncControls();
      renderFreqs();
      syncText();
      drawDial();
      drawHelix();
    }

    mEl.addEventListener("input", function () {
      state.m = clamp(parseInt(mEl.value, 10) || 0, 0, state.maxPos - 1);
      mEl.nextElementSibling.textContent = String(state.m);
      syncText(); drawDial(); drawHelix();
    });
    nEl.addEventListener("input", function () {
      state.n = clamp(parseInt(nEl.value, 10) || 0, 0, state.maxPos - 1);
      nEl.nextElementSibling.textContent = String(state.n);
      syncText(); drawDial(); drawHelix();
    });
    pairsEl.addEventListener("input", function () {
      state.pairs = clamp(parseInt(pairsEl.value, 10) || 1, 1, 8);
      if (state.selected >= state.pairs) state.selected = state.pairs - 1;
      pairsEl.nextElementSibling.textContent = String(state.pairs);
      renderFreqs(); syncText(); drawDial(); drawHelix();
    });
    modeBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        state.rope = b.getAttribute("data-rope-mode") === "on";
        syncControls(); syncText(); drawDial(); drawHelix();
      });
    });
    if (spinBtn) {
      spinBtn.addEventListener("click", function () {
        state.spin = !state.spin;
        syncControls();
      });
    }
    if (resetBtn) resetBtn.addEventListener("click", reset);

    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;
      last = now;
      var ta = targetAngles();
      if (reduced) {
        dispQ = ta.q; dispK = ta.k;
      } else {
        dispQ += (ta.q - dispQ) * 0.16;
        dispK += (ta.k - dispK) * 0.16;
      }
      if (state.spin && !drag && !reduced) yaw += 0.004;
      drawDial();
      drawHelix();
    }

    helixCanvas.addEventListener("pointerdown", function (e) {
      drag = { x: e.clientX, y: e.clientY };
      state.spin = false;
      syncControls();
      try { helixCanvas.setPointerCapture(e.pointerId); } catch (err) {}
    });
    helixCanvas.addEventListener("pointermove", function (e) {
      if (!drag) return;
      yaw += (e.clientX - drag.x) * 0.008;
      pitch = clamp(pitch + (e.clientY - drag.y) * 0.006, -0.9, 0.9);
      drag.x = e.clientX; drag.y = e.clientY;
      drawHelix();
    });
    helixCanvas.addEventListener("pointerup", function () { drag = null; });
    helixCanvas.addEventListener("pointercancel", function () { drag = null; });

    function resize() {
      fit();
      dispQ = targetAngles().q;
      dispK = targetAngles().k;
      syncText();
      drawDial();
      drawHelix();
    }

    syncControls();
    renderFreqs();
    resize();
    raf = requestAnimationFrame(loop);

    return {
      update: function () {},
      next: function () { return false; },
      prev: function () { return false; },
      hasNext: function () { return false; },
      hasPrev: function () { return false; },
      resize: resize,
      onKey: function () { return false; },
      pause: function () { if (raf) { cancelAnimationFrame(raf); raf = 0; } },
      resume: function () { if (!raf) raf = requestAnimationFrame(loop); },
      destroy: function () {
        if (raf) cancelAnimationFrame(raf);
        el.remove();
      }
    };
  }

  core.register("rope", ropeScene);
})();
