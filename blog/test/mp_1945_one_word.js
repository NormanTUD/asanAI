(function () {
  "use strict";
  if (!window.MP) return;

  var SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';

  var hero = document.getElementById("heroOneWord");
  if (hero) {
    var drift = [
      "one", "word", "after", "another", "Whenever", "Richard", "Cory",
      "went", "down", "town", "She", "fears", "him", "and", "will",
      "always", "ask", "Miniver", "Cheevy", "child", "of", "scorn"
    ];
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      var left = w * 0.1;
      var right = w * 0.92;
      var top = h * 0.18;
      var bottom = h * 0.86;
      var rows = 7;

      ctx.save();
      ctx.globalAlpha = 0.12;
      MP.grid(ctx, w, h, Math.max(34, Math.min(w, h) * 0.075), c.line);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.globalAlpha = 0.34;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left - Math.min(w, h) * 0.03, top);
      ctx.lineTo(left - Math.min(w, h) * 0.03, bottom);
      ctx.stroke();
      ctx.restore();

      for (var r = 0; r < rows; r++) {
        var y = top + (r / (rows - 1)) * (bottom - top);
        ctx.save();
        ctx.strokeStyle = c.line;
        ctx.globalAlpha = 0.26;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
        ctx.restore();

        var speed = 10 + r * 3.5;
        var size = 10 + (r % 3) * 2;
        for (var i = 0; i < 7; i++) {
          var word = drift[(i * 3 + r * 5) % drift.length];
          var slot = (w * 0.28) + i * (w * 0.115);
          var x = left + ((t * speed + slot) % (right - left + w * 0.3));
          if (x > right + 10) continue;
          var edge = Math.min(1, Math.min(x - left, right - x) / (w * 0.14));
          ctx.save();
          ctx.globalAlpha = Math.max(0, edge) * (0.12 + 0.2 * (1 - r / rows));
          MP.label(ctx, word, x, y - 11, c.muted, size, "left", SERIF);
          ctx.restore();
        }
      }

      ctx.save();
      ctx.globalAlpha = 0.05;
      MP.label(ctx, "¶", w * 0.82, h * 0.36, c.accent, Math.min(w, h) * 0.42, "center", SERIF);
      ctx.restore();

      MP.label(ctx, "the line is the unit of meaning", w * 0.5, h * 0.92, c.faint, 10, "center");
    }, { maxDpr: 1.6 });
  }

  var LINES = [
    {
      name: "Richard Cory",
      words: ["Whenever", "Richard", "Cory", "went", "down", "town"]
    },
    {
      name: "Miniver Cheevy",
      words: ["Miniver", "Cheevy,", "child", "of", "scorn"]
    },
    {
      name: "Eros Turannos",
      words: ["She", "fears", "him,", "and", "will", "always", "ask"]
    }
  ];

  var canvas = document.getElementById("owLab");
  if (!canvas) return;

  var st = { idx: 0, p: 0, visual: 0, last: -1 };
  var lineEl = document.getElementById("owLineText");
  var nameEl = document.getElementById("owLineName");
  var countEl = document.getElementById("owWordCount");
  var senseEl = document.getElementById("owSense");
  var orderEl = document.getElementById("owOrderVal");
  var range = document.getElementById("owOrder");

  function current() { return LINES[st.idx]; }
  function maxInv(n) { return n * (n - 1) / 2; }

  function jitter(i) {
    var x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return (x - Math.floor(x) - 0.5) * 1.1;
  }

  function positions(words, u) {
    var n = words.length;
    var out = [];
    var spread = Math.sin(Math.PI * u) * n * 0.62;
    for (var i = 0; i < n; i++) {
      var start = n - 1 - i;
      var end = i;
      out.push({
        i: i,
        pos: start + (end - start) * u + jitter(i) * spread
      });
    }
    return out;
  }

  function readingOrder(words, u) {
    return positions(words, u).slice().sort(function (a, b) {
      if (a.pos === b.pos) return a.i - b.i;
      return a.pos - b.pos;
    });
  }

  function inversions(order) {
    var inv = 0;
    for (var i = 0; i < order.length; i++) {
      for (var j = i + 1; j < order.length; j++) {
        if (order[i].i > order[j].i) inv++;
      }
    }
    return inv;
  }

  function senseScore(words, u) {
    var n = words.length;
    if (n < 2) return 1;
    return 1 - inversions(readingOrder(words, u)) / maxInv(n);
  }

  function refresh() {
    var words = current().words;
    var u = st.p / 100;
    var score = senseScore(words, u);
    var order = readingOrder(words, u);
    var text = order.map(function (o) { return words[o.i]; }).join(" ");

    if (lineEl) {
      lineEl.textContent = text;
      lineEl.classList.toggle("is-broken", score < 0.999);
    }
    if (nameEl) nameEl.textContent = current().name;
    if (countEl) countEl.textContent = String(words.length);
    if (senseEl) senseEl.textContent = Math.round(score * 100) + "%";
    if (orderEl) orderEl.textContent = String(Math.round(st.p));
  }

  function setSlider(v) {
    st.p = MP.clamp(v, 0, 100);
    if (range) {
      range.value = String(st.p);
      MP.rangeFill(range);
    }
    refresh();
  }

  MP.bindRange("owOrder", function (v) {
    st.p = v;
    refresh();
  });

  MP.on("owBreak", "click", function () { setSlider(0); });
  MP.on("owRestore", "click", function () { setSlider(100); });
  MP.on("owNext", "click", function () {
    st.idx = (st.idx + 1) % LINES.length;
    setSlider(0);
  });

  MP.canvas(canvas, function (ctx, w, h, t, dt) {
    var c = MP.colors();
    var words = current().words;
    var n = words.length;
    var target = st.p / 100;
    st.visual += (target - st.visual) * Math.min(1, (dt || 0.016) * 7);
    if (Math.abs(target - st.visual) < 0.001) st.visual = target;

    var u = st.visual;
    var score = senseScore(words, u);
    var pos = positions(words, u);
    var mid = h * 0.52;
    var left = w * 0.08;
    var right = w * 0.92;
    var span = right - left;

    ctx.save();
    ctx.globalAlpha = 0.16;
    MP.grid(ctx, w, h, Math.max(26, Math.min(w, h) * 0.06), c.line);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = score > 0.999 ? c.accent : c.line;
    ctx.globalAlpha = score > 0.999 ? 0.55 : 0.3;
    ctx.lineWidth = score > 0.999 ? 1.6 : 1;
    ctx.beginPath();
    ctx.moveTo(left, mid + Math.min(w, h) * 0.09);
    ctx.lineTo(right, mid + Math.min(w, h) * 0.09);
    ctx.stroke();
    ctx.restore();

    var fs = MP.clamp(w / (n * 1.45), 13, 34);
    ctx.save();
    ctx.font = fs + "px " + SERIF;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (var k = 0; k < n; k++) {
      var p = pos[k];
      var x = left + (p.pos / Math.max(1, n - 1)) * span;
      var disorder = 1 - score;
      var y = mid + Math.sin(p.i * 2.3 + t * 0.9) * disorder * Math.min(30, h * 0.08);
      var rot = Math.sin(p.i * 1.7 + 0.4) * disorder * 0.14;
      var aligned = score > 0.999;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      if (aligned) {
        ctx.shadowBlur = 18;
        ctx.shadowColor = c.accent;
      }
      ctx.fillStyle = aligned ? c.accent : (disorder > 0.5 ? c.faint : c.ink);
      ctx.globalAlpha = aligned ? 0.98 : 0.62 + 0.3 * score;
      ctx.fillText(words[p.i], 0, 0);
      ctx.restore();
    }

    ctx.restore();

    if (score > 0.999) {
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.12 * Math.sin(t * 2);
      MP.label(ctx, "the line as it was written", w * 0.5, h * 0.14, c.accent, 10, "center");
      ctx.restore();
    } else {
      MP.label(ctx, "inversions " + Math.round((1 - score) * 100) + "%", w * 0.5, h * 0.14, c.faint, 10, "center");
    }

    MP.label(ctx, current().name, w * 0.5, h * 0.9, c.muted, 10, "center");

    var rounded = Math.round(st.visual * 100);
    if (rounded !== st.last) {
      st.last = rounded;
      if (orderEl) orderEl.textContent = String(rounded);
      if (senseEl) senseEl.textContent = Math.round(score * 100) + "%";
      var order = readingOrder(words, u);
      if (lineEl) {
        lineEl.textContent = order.map(function (o) { return words[o.i]; }).join(" ");
        lineEl.classList.toggle("is-broken", score < 0.999);
      }
    }
  }, { maxDpr: 2 });

  setSlider(0);
})();
