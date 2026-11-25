(function () {
  "use strict";

  var MP = window.MP;
  if (!MP) return;

  function EventLab() {
    this.canvas = document.getElementById("event-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.size = 6;
    this.state = new Uint8Array(36);
    this.mode = "a";
    this.bind();
    this.setExample();
  }

  EventLab.prototype.bind = function () {
    var self = this;
    var a = document.getElementById("event-a");
    var b = document.getElementById("event-b");
    var erase = document.getElementById("event-erase");
    var reset = document.getElementById("event-reset");
    if (a) {
      a.addEventListener("click", function () {
        self.mode = "a";
        a.setAttribute("aria-pressed", "true");
        if (b) b.setAttribute("aria-pressed", "false");
        erase.classList.remove("btn--primary");
        a.classList.add("btn--primary");
        if (b) b.classList.remove("btn--primary");
        self.setStatus("A-Modus: Klicke Zellen, um sie zu A hinzuzufügen. B bleibt erhalten.");
      });
    }
    if (b) {
      b.addEventListener("click", function () {
        self.mode = "b";
        b.setAttribute("aria-pressed", "true");
        if (a) a.setAttribute("aria-pressed", "false");
        b.classList.add("btn--primary");
        if (a) a.classList.remove("btn--primary");
        erase.classList.remove("btn--primary");
        self.setStatus("B-Modus: Klicke Zellen, um sie zu B hinzuzufügen. A bleibt erhalten.");
      });
    }
    if (erase) {
      erase.addEventListener("click", function () {
        self.mode = "erase";
        erase.classList.add("btn--primary");
        if (a) a.classList.remove("btn--primary");
        if (b) b.classList.remove("btn--primary");
        if (a) a.setAttribute("aria-pressed", "false");
        if (b) b.setAttribute("aria-pressed", "false");
        self.setStatus("Radierer: Klicke Zellen, um sie aus beiden Ereignissen zu entfernen.");
      });
    }
    if (reset) {
      reset.addEventListener("click", function () {
        self.setExample();
        self.setStatus("Beispiel geladen: A = erste Zahl gerade, B = Summe größer als 8.");
      });
    }
    this.canvas.addEventListener("click", function (event) {
      var rect = self.canvas.getBoundingClientRect();
      var x = (event.clientX - rect.left) * (self.canvas.width / rect.width);
      var y = (event.clientY - rect.top) * (self.canvas.height / rect.height);
      var gx = 38;
      var gy = 74;
      var cell = 60;
      var col = Math.floor((x - gx) / cell);
      var row = Math.floor((y - gy) / cell);
      if (col < 0 || col >= 6 || row < 0 || row >= 6) return;
      var index = row * 6 + col;
      if (self.mode === "a") self.state[index] |= 1;
      else if (self.mode === "b") self.state[index] |= 2;
      else self.state[index] = 0;
      self.paintStats();
      self.draw();
    });
    this.setStatus("Male A und B. Die Vereinigung ist „A oder B“, der Schnitt ist „A und B“.");
  };

  EventLab.prototype.setExample = function () {
    this.state = new Uint8Array(36);
    for (var row = 0; row < 6; row++) {
      for (var col = 0; col < 6; col++) {
        var first = col + 1;
        var second = row + 1;
        var value = 0;
        if (first % 2 === 0) value |= 1;
        if (first + second > 8) value |= 2;
        this.state[row * 6 + col] = value;
      }
    }
    this.paintStats();
    this.draw();
  };

  EventLab.prototype.counts = function () {
    var a = 0;
    var b = 0;
    var both = 0;
    var union = 0;
    for (var i = 0; i < this.state.length; i++) {
      var value = this.state[i];
      var inA = (value & 1) === 1;
      var inB = (value & 2) === 2;
      if (inA) a++;
      if (inB) b++;
      if (inA && inB) both++;
      if (inA || inB) union++;
    }
    return { a: a, b: b, both: both, union: union };
  };

  EventLab.prototype.paintStats = function () {
    var c = this.counts();
    var pa = c.a / 36;
    var pb = c.b / 36;
    var pab = c.both / 36;
    var punion = c.union / 36;
    var pcond = c.b > 0 ? c.both / c.b : 0;
    var paEl = document.getElementById("event-pa");
    var pbEl = document.getElementById("event-pb");
    var pabEl = document.getElementById("event-pab");
    var punionEl = document.getElementById("event-punion");
    var pcondEl = document.getElementById("event-pcond");
    if (paEl) paEl.textContent = MP.fmt(pa, 2);
    if (pbEl) pbEl.textContent = MP.fmt(pb, 2);
    if (pabEl) pabEl.textContent = MP.fmt(pab, 2);
    if (punionEl) punionEl.textContent = MP.fmt(punion, 2);
    if (pcondEl) pcondEl.textContent = MP.fmt(pcond, 2);
  };

  EventLab.prototype.setStatus = function (text) {
    var node = document.getElementById("event-status");
    if (node) node.textContent = text;
  };

  EventLab.prototype.draw = function () {
    var ctx = this.ctx;
    var w = 900;
    var h = 560;
    var gx = 38;
    var gy = 74;
    var cell = 60;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, w, h);
    var glow = ctx.createRadialGradient(220, 260, 20, 220, 260, 380);
    glow.addColorStop(0, "rgba(183,155,255,0.08)");
    glow.addColorStop(1, "rgba(5,8,16,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Zwei Würfel · 36 gleich wahrscheinliche Ausgänge", gx, gy - 24);
    ctx.fillStyle = "rgba(168,178,199,0.72)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("Spalte = erster Würfel · Zeile = zweiter Würfel", gx, gy - 6);

    for (var row = 0; row < 6; row++) {
      for (var col = 0; col < 6; col++) {
        var value = this.state[row * 6 + col];
        var x = gx + col * cell;
        var y = gy + row * cell;
        var color = "#0b1323";
        if (value === 1) color = "#3d7dd8";
        else if (value === 2) color = "#b85e86";
        else if (value === 3) color = "#d6a84f";
        ctx.fillStyle = color;
        ctx.fillRect(x, y, cell - 2, cell - 2);
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cell - 2, cell - 2);
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        ctx.font = "10px Inter, system-ui, sans-serif";
        ctx.fillText(String(col + 1) + "/" + String(row + 1), x + 5, y + 13);
      }
    }

    ctx.fillStyle = "rgba(168,178,199,0.82)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    for (var label = 0; label < 6; label++) {
      ctx.fillText(String(label + 1), gx + label * cell + cell / 2 - 3, gy + 6 * cell + 18);
      ctx.fillText(String(label + 1), gx - 16, gy + label * cell + cell / 2 + 4);
    }

    var c = this.counts();
    var cx = 472;
    var cy = 84;
    var cw = 338;
    var rows = [
      { label: "A", value: c.a / 36, color: "#6ea8ff" },
      { label: "B", value: c.b / 36, color: "#ff8ea8" },
      { label: "A ∩ B", value: c.both / 36, color: "#f8c56b" },
      { label: "A ∪ B", value: c.union / 36, color: "#b79bff" }
    ];
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    MP.roundRect(ctx, cx - 20, cy - 24, cw + 40, 330, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.stroke();
    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Mengen-Maß", cx, cy - 2);
    for (var r = 0; r < rows.length; r++) {
      var yy = cy + 38 + r * 66;
      ctx.fillStyle = "rgba(168,178,199,0.9)";
      ctx.font = "11px Inter, system-ui, sans-serif";
      ctx.fillText(rows[r].label, cx, yy);
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(244,239,228,0.85)";
      ctx.font = "600 11px Inter, system-ui, sans-serif";
      ctx.fillText(MP.fmt(rows[r].value, 3), cx + cw, yy);
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      MP.roundRect(ctx, cx, yy + 10, cw, 10, 5);
      ctx.fill();
      ctx.fillStyle = rows[r].color;
      MP.roundRect(ctx, cx, yy + 10, cw * rows[r].value, 10, 5);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(168,178,199,0.8)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("Jede Zelle hat Gewicht 1/36.", cx, cy + 304);
    ctx.fillText("P(A | B) = " + MP.fmt(c.b > 0 ? c.both / c.b : 0, 3), cx, cy + 322);
  };

  function GaltonLab() {
    this.canvas = document.getElementById("galton-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.rows = 12;
    this.bins = new Array(13).fill(0);
    this.balls = [];
    this.target = 0;
    this.finished = 0;
    this.lastPainted = -1;
    this.bind();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  GaltonLab.prototype.bind = function () {
    var self = this;
    var hundred = document.getElementById("galton-100");
    var thousand = document.getElementById("galton-1000");
    var reset = document.getElementById("galton-reset");
    if (hundred) {
      hundred.addEventListener("click", function () {
        self.start(100);
      });
    }
    if (thousand) {
      thousand.addEventListener("click", function () {
        self.start(1000);
      });
    }
    if (reset) {
      reset.addEventListener("click", function () {
        self.start(0);
      });
    }
  };

  GaltonLab.prototype.start = function (count) {
    this.bins = new Array(13).fill(0);
    this.balls = [];
    this.target = count;
    this.finished = 0;
    this.paintStats();
    if (count === 0) this.setStatus("Zurückgesetzt. Starte mit 100 oder 1000 Bällen.");
    else if (count === 100) this.setStatus("100 Bälle: Die Form wird sichtbar, aber die Ränder sind noch rau.");
    else this.setStatus("1000 Bälle: Jetzt sollte die Binomialverteilung deutlich hervortreten.");
  };

  GaltonLab.prototype.loop = function () {
    if (this.finished < this.target) {
      for (var s = 0; s < 3 && this.finished + this.balls.length < this.target; s++) {
        this.balls.push({ row: 0, col: 0 });
      }
    }
    var remaining = [];
    for (var b = 0; b < this.balls.length; b++) {
      var ball = this.balls[b];
      ball.row += 1;
      if (ball.row > this.rows) {
        this.bins[ball.col] += 1;
        this.finished += 1;
      } else {
        ball.col += Math.random() < 0.5 ? 0 : 1;
        remaining.push(ball);
      }
    }
    this.balls = remaining;
    if (this.finished !== this.lastPainted) {
      this.lastPainted = this.finished;
      this.paintStats();
    }
    this.draw();
    if (this.finished === this.target && this.balls.length === 0 && this.target > 0) {
      this.setStatus("Fertig. " + this.target + " Bälle. Mittelwert und Streuung nähern sich der Theorie – nicht jeder Lauf ist perfekt.");
    }
    requestAnimationFrame(this.loop);
  };

  GaltonLab.prototype.paintStats = function () {
    var total = this.finished;
    var mean = 0;
    for (var i = 0; i < this.bins.length; i++) mean += i * this.bins[i];
    mean = total > 0 ? mean / total : 0;
    var variance = 0;
    for (var j = 0; j < this.bins.length; j++) variance += this.bins[j] * Math.pow(j - mean, 2);
    variance = total > 0 ? variance / total : 0;
    var countEl = document.getElementById("galton-count");
    var meanEl = document.getElementById("galton-mean");
    var sdEl = document.getElementById("galton-sd");
    if (countEl) countEl.textContent = String(total);
    if (meanEl) meanEl.textContent = total ? MP.fmt(mean, 2) : "–";
    if (sdEl) sdEl.textContent = total ? MP.fmt(Math.sqrt(variance), 2) : "–";
  };

  GaltonLab.prototype.setStatus = function (text) {
    var node = document.getElementById("galton-status");
    if (node) node.textContent = text;
  };

  GaltonLab.prototype.draw = function () {
    var ctx = this.ctx;
    var w = 900;
    var h = 560;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, w, h);
    var glow = ctx.createRadialGradient(250, 280, 20, 250, 280, 420);
    glow.addColorStop(0, "rgba(183,155,255,0.08)");
    glow.addColorStop(1, "rgba(5,8,16,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Galton-Brett · 12 Reihen", 34, 34);
    ctx.fillStyle = "rgba(168,178,199,0.72)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("jede Rechts-Abzweigung = +1", 34, 52);

    var cx = 250;
    var y0 = 78;
    var rowGap = 26;
    var spacing = 18;
    for (var row = 0; row < this.rows; row++) {
      for (var col = 0; col <= row; col++) {
        var px = cx + (col - row / 2) * spacing;
        var py = y0 + row * rowGap;
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(168,178,199,0.42)";
        ctx.fill();
      }
    }
    for (var bin = 0; bin < 13; bin++) {
      var bx = cx + (bin - 6) * spacing;
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx - 7, y0 + this.rows * rowGap + 10);
      ctx.lineTo(bx - 7, y0 + this.rows * rowGap + 24);
      ctx.lineTo(bx + 7, y0 + this.rows * rowGap + 24);
      ctx.lineTo(bx + 7, y0 + this.rows * rowGap + 10);
      ctx.stroke();
    }
    for (var b = 0; b < this.balls.length; b++) {
      var ball = this.balls[b];
      var bx2 = cx + (ball.col - ball.row / 2) * spacing;
      var by2 = y0 + ball.row * rowGap - 7;
      ctx.save();
      ctx.shadowColor = "#b79bff";
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.arc(bx2, by2, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = "#f4efe4";
      ctx.fill();
      ctx.restore();
    }

    var hx = 512;
    var hy = 74;
    var hw = 340;
    var hh = 350;
    var maxBin = Math.max(1, Math.max.apply(null, this.bins));
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    MP.roundRect(ctx, hx - 20, hy - 24, hw + 40, hh + 84, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.stroke();
    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Verteilung der Endfächer", hx, hy - 2);

    var barW = hw / 13;
    for (var k = 0; k < 13; k++) {
      var bh = (this.bins[k] / maxBin) * hh;
      var bx3 = hx + k * barW;
      var grad = ctx.createLinearGradient(0, hy + hh - bh, 0, hy + hh);
      grad.addColorStop(0, "rgba(183,155,255,0.95)");
      grad.addColorStop(1, "rgba(80,70,140,0.55)");
      ctx.fillStyle = grad;
      ctx.fillRect(bx3 + 2, hy + hh - bh, barW - 4, bh);
      ctx.fillStyle = "rgba(168,178,199,0.6)";
      ctx.font = "9px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(k), bx3 + barW / 2, hy + hh + 15);
      ctx.textAlign = "left";
    }
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.beginPath();
    ctx.moveTo(hx, hy + hh);
    ctx.lineTo(hx + hw, hy + hh);
    ctx.stroke();

    if (this.target > 0) {
      var n = this.rows;
      var p = 0.5;
      var maxTheo = 0;
      for (var t = 0; t <= n; t++) {
        var combo = 1;
        for (var i = 1; i <= t; i++) combo = combo * (n - i + 1) / i;
        var prob = combo * Math.pow(p, t) * Math.pow(1 - p, n - t);
        maxTheo = Math.max(maxTheo, prob);
      }
      ctx.beginPath();
      for (var q = 0; q <= n; q++) {
        var combo2 = 1;
        for (var j = 1; j <= q; j++) combo2 = combo2 * (n - j + 1) / j;
        var prob2 = combo2 * Math.pow(p, q) * Math.pow(1 - p, n - q);
        var px2 = hx + (q + 0.5) * barW;
        var py2 = hy + hh - (prob2 / maxTheo) * hh * 0.92;
        if (q === 0) ctx.moveTo(px2, py2);
        else ctx.lineTo(px2, py2);
      }
      ctx.strokeStyle = "rgba(248,197,107,0.9)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(168,178,199,0.72)";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.fillText("Bälle pro Fach · gelbe Linie = Theorie", hx, hy + hh + 38);
    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("n = " + this.target + " · μ = 6 · σ = 1,73", hx, hy + hh + 62);
  };

  function BayesLab() {
    this.canvas = document.getElementById("bayes-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.prev = 1;
    this.sens = 90;
    this.spec = 90;
    this.bind();
    this.draw();
    this.paintStats();
  }

  BayesLab.prototype.bind = function () {
    var self = this;
    var prev = document.getElementById("bayes-prev");
    var sens = document.getElementById("bayes-sens");
    var spec = document.getElementById("bayes-spec");
    if (prev) {
      prev.addEventListener("input", function () {
        self.prev = Number(prev.value);
        self.updateLabels();
        self.draw();
        self.paintStats();
        self.setStatus();
      });
    }
    if (sens) {
      sens.addEventListener("input", function () {
        self.sens = Number(sens.value);
        self.updateLabels();
        self.draw();
        self.paintStats();
        self.setStatus();
      });
    }
    if (spec) {
      spec.addEventListener("input", function () {
        self.spec = Number(spec.value);
        self.updateLabels();
        self.draw();
        self.paintStats();
        self.setStatus();
      });
    }
    this.updateLabels();
    this.setStatus();
  };

  BayesLab.prototype.counts = function () {
    var n = 1000;
    var diseased = Math.round(n * this.prev / 100);
    var healthy = n - diseased;
    var tp = Math.round(diseased * this.sens / 100);
    var fn = diseased - tp;
    var fp = Math.round(healthy * (1 - this.spec / 100));
    var tn = healthy - fp;
    return { n: n, diseased: diseased, healthy: healthy, tp: tp, fn: fn, fp: fp, tn: tn };
  };

  BayesLab.prototype.updateLabels = function () {
    var prev = document.getElementById("bayes-prev-val");
    var sens = document.getElementById("bayes-sens-val");
    var spec = document.getElementById("bayes-spec-val");
    if (prev) prev.textContent = MP.fmt(this.prev, 1) + " %";
    if (sens) sens.textContent = MP.fmt(this.sens, 0) + " %";
    if (spec) spec.textContent = MP.fmt(this.spec, 0) + " %";
  };

  BayesLab.prototype.paintStats = function () {
    var c = this.counts();
    var positives = c.tp + c.fp;
    var posterior = positives > 0 ? c.tp / positives : 0;
    var priorEl = document.getElementById("bayes-prior");
    var sensEl = document.getElementById("bayes-sens");
    var posteriorEl = document.getElementById("bayes-posterior");
    var positivesEl = document.getElementById("bayes-positives");
    if (priorEl) priorEl.textContent = MP.fmt(this.prev, 1) + " %";
    if (sensEl) sensEl.textContent = MP.fmt(this.sens, 0) + " %";
    if (posteriorEl) posteriorEl.textContent = MP.fmt(posterior * 100, 1) + " %";
    if (positivesEl) positivesEl.textContent = String(positives);
  };

  BayesLab.prototype.setStatus = function () {
    var c = this.counts();
    var positives = c.tp + c.fp;
    var posterior = positives > 0 ? c.tp / positives : 0;
    var node = document.getElementById("bayes-status");
    if (!node) return;
    if (posterior < 0.2) node.textContent = "Die meisten positiven Tests kommen von Gesunden. Bei seltener Krankheit ist die Basisrate stärker als die Testgüte.";
    else if (posterior < 0.6) node.textContent = "Der posterior ist deutlich höher als die Prävalenz – aber noch nicht „sicher“. Die Basisrate bleibt sichtbar.";
    else node.textContent = "Jetzt sind die meisten positiven Tests echte Positive. Prävalenz und Spezifität zusammen tragen die Entscheidung.";
  };

  BayesLab.prototype.draw = function () {
    var ctx = this.ctx;
    var w = 900;
    var h = 560;
    var c = this.counts();
    var positives = c.tp + c.fp;
    var posterior = positives > 0 ? c.tp / positives : 0;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, w, h);
    var glow = ctx.createRadialGradient(210, 220, 20, 210, 220, 380);
    glow.addColorStop(0, "rgba(183,155,255,0.08)");
    glow.addColorStop(1, "rgba(5,8,16,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("1000 Personen · jeder Punkt ist eine Person", 38, 34);
    ctx.fillStyle = "rgba(168,178,199,0.72)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("Reihenfolge: krank+ · krank− · gesund+ · gesund−", 38, 52);

    var gx = 38;
    var gy = 74;
    var cell = 9;
    var cells = [];
    var i;
    for (i = 0; i < c.tp; i++) cells.push("#f8c56b");
    for (i = 0; i < c.fn; i++) cells.push("#ff8ea8");
    for (i = 0; i < c.fp; i++) cells.push("#b79bff");
    for (i = 0; i < c.tn; i++) cells.push("#22304d");
    for (i = 0; i < cells.length; i++) {
      var row = Math.floor(i / 40);
      var col = i % 40;
      ctx.fillStyle = cells[i];
      ctx.fillRect(gx + col * cell, gy + row * cell, cell - 1, cell - 1);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.strokeRect(gx, gy, 40 * cell, 25 * cell);

    var legendY = gy + 25 * cell + 30;
    var legend = [
      { color: "#f8c56b", label: "krank +" },
      { color: "#ff8ea8", label: "krank −" },
      { color: "#b79bff", label: "gesund +" },
      { color: "#22304d", label: "gesund −" }
    ];
    for (var l = 0; l < legend.length; l++) {
      var lx = gx + l * 90;
      ctx.fillStyle = legend[l].color;
      ctx.fillRect(lx, legendY, 10, 10);
      ctx.fillStyle = "rgba(168,178,199,0.85)";
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.fillText(legend[l].label, lx + 15, legendY + 9);
    }

    var cx = 470;
    var cy = 90;
    var cw = 360;
    var ch = 280;
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    MP.roundRect(ctx, cx - 20, cy - 24, cw + 40, ch + 92, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.stroke();
    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Vorher und nachher", cx, cy - 2);

    var barW = 88;
    var bars = [
      { x: cx + 70, value: this.prev / 100, label: "P(krank)", color: "rgba(110,168,255,0.8)" },
      { x: cx + 220, value: posterior, label: "P(krank | +)", color: "rgba(248,197,107,0.9)" }
    ];
    for (var b = 0; b < bars.length; b++) {
      var bh = bars[b].value * ch;
      var by = cy + ch - bh;
      var grad = ctx.createLinearGradient(0, by, 0, cy + ch);
      grad.addColorStop(0, bars[b].color);
      grad.addColorStop(1, "rgba(30,40,70,0.4)");
      ctx.fillStyle = grad;
      MP.roundRect(ctx, bars[b].x, by, barW, Math.max(bh, 2), 8);
      ctx.fill();
      ctx.fillStyle = "rgba(244,239,228,0.88)";
      ctx.font = "600 12px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(MP.fmt(bars[b].value * 100, 1) + " %", bars[b].x + barW / 2, by - 10);
      ctx.fillStyle = "rgba(168,178,199,0.8)";
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.fillText(bars[b].label, bars[b].x + barW / 2, cy + ch + 20);
      ctx.textAlign = "left";
    }
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.moveTo(cx, cy + ch);
    ctx.lineTo(cx + cw, cy + ch);
    ctx.stroke();

    ctx.fillStyle = "rgba(168,178,199,0.82)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("Positive Tests: " + positives, cx, cy + ch + 48);
    ctx.fillText("davon wirklich krank: " + c.tp, cx, cy + ch + 66);
    ctx.fillText("falsch positiv: " + c.fp, cx, cy + ch + 84);
  };

  document.addEventListener("DOMContentLoaded", function () {
    new EventLab();
    new GaltonLab();
    new BayesLab();
  });
})();
