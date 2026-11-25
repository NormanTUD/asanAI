(function () {
  "use strict";
  if (!window.MP) return;

  var SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
  var SHAKE = ["A", "B", "A", "B", "C", "D", "C", "D", "E", "F", "E", "F", "G", "G"];
  var PETRARCH = ["A", "B", "B", "A", "A", "B", "B", "A", "C", "D", "E", "C", "D", "E"];

  var hero = document.getElementById("heroNaturalFit");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      var left = w * 0.1;
      var right = w * 0.86;
      var top = h * 0.1;
      var bottom = h * 0.9;
      var rows = 14;
      var lineH = (bottom - top) / (rows - 1);
      var scan = top + ((t * 0.055) % 1) * (bottom - top);

      ctx.save();
      ctx.globalAlpha = 0.1;
      MP.grid(ctx, w, h, Math.max(30, Math.min(w, h) * 0.07), c.line);
      ctx.restore();

      for (var r = 0; r < rows; r++) {
        var y = top + r * lineH;
        var near = Math.max(0, 1 - Math.abs(y - scan) / (lineH * 2.2));
        ctx.save();
        ctx.strokeStyle = near > 0.15 ? c.accent : c.line;
        ctx.globalAlpha = 0.16 + near * 0.5;
        ctx.lineWidth = 1 + near * 1.2;
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.22 + near * 0.6;
        MP.label(ctx, SHAKE[r], right + w * 0.04, y, near > 0.15 ? c.accent : c.faint, 9, "center", SERIF);
        ctx.restore();
      }

      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.globalAlpha = 0.72;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (var x = left; x <= right; x += 2) {
        var u = (x - left) / (right - left);
        var env = Math.sin(Math.PI * u);
        var beat = Math.sin(u * Math.PI * 12 + t * 2.4) * env * lineH * 1.25;
        var spike = Math.exp(-Math.pow((u - 0.62) * 18, 2)) * Math.sin(t * 7) * lineH * 2.4;
        var yy = h * 0.5 + beat + spike;
        if (x === left) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.055;
      MP.label(ctx, "14", w * 0.5, h * 0.52, c.accent, Math.min(w, h) * 0.72, "center", SERIF);
      ctx.restore();

      MP.label(ctx, "fourteen lines · five feet · one breath", w * 0.5, h * 0.945, c.faint, 10, "center");
    }, { maxDpr: 1.6 });
  }

  var canvas = document.getElementById("nfLab");
  if (!canvas) return;

  var st = {
    scheme: "shake",
    reg: 72,
    playing: false,
    selected: 0,
    current: 0,
    lastCurrent: -1
  };

  var regEl = document.getElementById("nfRegVal");
  var regRead = document.getElementById("nfRegRead");
  var schemeEl = document.getElementById("nfScheme");
  var readBtn = document.getElementById("nfRead");
  var poemLines = Array.prototype.slice.call(document.querySelectorAll(".poem-line"));

  function letters() { return st.scheme === "shake" ? SHAKE : PETRARCH; }
  function schemeLabel() {
    return st.scheme === "shake" ? "ABAB CDCD EFEF GG" : "ABBA ABBA CDECDE";
  }

  function updateReadout() {
    if (regEl) regEl.textContent = String(st.reg);
    if (regRead) regRead.textContent = st.reg + "%";
    if (schemeEl) schemeEl.textContent = schemeLabel();
    if (readBtn) readBtn.classList.toggle("is-active", st.playing);
    if (readBtn) readBtn.textContent = st.playing ? "Reading…" : "Read the last poem";
  }

  function paintPoem(line) {
    if (line === st.lastCurrent) return;
    st.lastCurrent = line;
    poemLines.forEach(function (el, i) {
      el.classList.toggle("is-current", i === line);
    });
  }

  MP.bindRange("nfRegularity", function (v) {
    st.reg = v;
    updateReadout();
  });

  MP.on("nfShake", "click", function () {
    st.scheme = "shake";
    document.getElementById("nfShake").classList.add("is-active");
    document.getElementById("nfPetrarch").classList.remove("is-active");
    updateReadout();
  });
  MP.on("nfPetrarch", "click", function () {
    st.scheme = "petrarch";
    document.getElementById("nfPetrarch").classList.add("is-active");
    document.getElementById("nfShake").classList.remove("is-active");
    updateReadout();
  });
  MP.on("nfRead", "click", function () {
    st.playing = true;
    st.selected = 0;
    st.current = 0;
    st.lastCurrent = -1;
    paintPoem(0);
    updateReadout();
  });
  MP.on("nfStop", "click", function () {
    st.playing = false;
    st.lastCurrent = -1;
    paintPoem(st.selected);
    updateReadout();
  });
  poemLines.forEach(function (el, i) {
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", "Read line " + (i + 1));
    function choose() {
      st.playing = false;
      st.selected = i;
      st.current = i;
      st.lastCurrent = -1;
      paintPoem(i);
      updateReadout();
    }
    el.addEventListener("click", choose);
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        choose();
      }
    });
  });

  updateReadout();
  paintPoem(0);

  MP.canvas(canvas, function (ctx, w, h, t) {
    var c = MP.colors();
    var rows = 14;
    var left = w * 0.07;
    var right = w * 0.86;
    var top = h * 0.08;
    var bottom = h * 0.9;
    var lineH = (bottom - top) / (rows - 1);
    var span = right - left;
    var reg = st.reg / 100;
    var lettersArr = letters();

    if (st.playing) {
      st.current = Math.floor(t / 1.15) % rows;
    } else {
      st.current = st.selected;
    }
    paintPoem(st.current);

    ctx.save();
    ctx.globalAlpha = 0.14;
    MP.grid(ctx, w, h, Math.max(24, Math.min(w, h) * 0.06), c.line);
    ctx.restore();

    var bandTop = top + st.current * lineH - lineH * 0.48;
    ctx.save();
    ctx.fillStyle = c.accent;
    ctx.globalAlpha = 0.055;
    ctx.fillRect(left - w * 0.02, bandTop, span + w * 0.08, lineH);
    ctx.restore();

    for (var r = 0; r < rows; r++) {
      var y = top + r * lineH;
      var active = r === st.current;
      ctx.save();
      ctx.strokeStyle = active ? c.accent : c.line;
      ctx.globalAlpha = active ? 0.7 : 0.24;
      ctx.lineWidth = active ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
      ctx.restore();

      var jitterY = (1 - reg) * lineH * 0.3;
      var jitterX = (1 - reg) * span * 0.012;
      for (var k = 0; k < 10; k++) {
        var stressed = k % 2 === 1;
        var x = left + ((k + 0.5) / 10) * span;
        var jx = Math.sin(k * 2.1 + r * 1.7) * jitterX;
        var jy = Math.sin(k * 1.3 + r * 2.9) * jitterY;
        var cx = x + jx;
        var cy = y + jy;
        var rad = (stressed ? 4.6 : 2.4) * (0.75 + 0.25 * reg);
        if (active) {
          ctx.save();
          ctx.shadowBlur = 14;
          ctx.shadowColor = c.accent;
          MP.dot(ctx, cx, cy, rad, stressed ? c.accent : c.muted);
          ctx.restore();
        } else {
          MP.dot(ctx, cx, cy, rad, stressed ? c.accent : c.faint);
        }
      }

      ctx.save();
      ctx.globalAlpha = active ? 1 : 0.42;
      MP.label(ctx, lettersArr[r], right + w * 0.045, y, active ? c.accent : c.faint, 9, "center", SERIF);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.32;
      MP.label(ctx, String(r + 1), left - w * 0.028, y, c.faint, 7, "right");
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = c.line;
    ctx.lineWidth = 1;
    for (var f = 1; f < 5; f++) {
      var fx = left + (f / 5) * span;
      ctx.beginPath();
      ctx.moveTo(fx, top - lineH * 0.2);
      ctx.lineTo(fx, bottom + lineH * 0.2);
      ctx.stroke();
    }
    ctx.restore();

    MP.label(ctx, schemeLabel(), w * 0.5, h * 0.045, c.accent, 10, "center");
    MP.label(ctx, "iambic pentameter · 5 feet · 10 positions", w * 0.5, h * 0.955, c.faint, 9, "center");
  }, { maxDpr: 2 });
})();
