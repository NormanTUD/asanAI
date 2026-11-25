(function () {
  "use strict";

  var MP = window.MP;
  if (!MP) return;

  function gray(n) {
    return n ^ (n >> 1);
  }

  function decodeCell(x, y) {
    var gx = gray(x);
    var gy = gray(y);
    var bits = [];
    for (var i = 0; i < 5; i++) bits.push((gx >> i) & 1);
    for (var j = 0; j < 5; j++) bits.push((gy >> j) & 1);
    return bits;
  }

  function bitsToIndex(bits) {
    var value = 0;
    for (var i = 0; i < bits.length; i++) value += bits[i] << i;
    return value;
  }

  function indexToBits(index, n) {
    var bits = [];
    for (var i = 0; i < n; i++) bits.push((index >> i) & 1);
    return bits;
  }

  function mix(a, b, t) {
    return Math.round(a + (b - a) * t);
  }

  function colorFor(t) {
    var stops = [
      [0, 12, 24, 48],
      [0.28, 18, 72, 92],
      [0.55, 30, 160, 132],
      [0.78, 102, 232, 176],
      [1, 246, 211, 107]
    ];
    var value = MP.clamp(t, 0, 1);
    for (var i = 1; i < stops.length; i++) {
      if (value <= stops[i][0]) {
        var p = (value - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
        return "rgb(" + mix(stops[i - 1][1], stops[i][1], p) + "," + mix(stops[i - 1][2], stops[i][2], p) + "," + mix(stops[i - 1][3], stops[i][3], p) + ")";
      }
    }
    return "rgb(246,211,107)";
  }

  function NKLab() {
    this.canvas = document.getElementById("nk-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.n = 10;
    this.size = 1 << this.n;
    this.grid = 32;
    this.seed = 7;
    this.k = 0;
    this.running = false;
    this.walkers = [];
    this.timer = null;
    this.build();
    this.bind();
    this.draw();
    this.paintStats();
  }

  NKLab.prototype.build = function () {
    var self = this;
    var random = MP.seededRandom(this.seed * 7919 + this.k * 131 + 17);
    var n = this.n;
    var k = this.k;
    this.tables = [];
    for (var i = 0; i < n; i++) {
      var table = [];
      var entries = 1 << (k + 1);
      for (var j = 0; j < entries; j++) table.push(random());
      this.tables.push(table);
    }
    this.fitness = new Float64Array(this.size);
    this.min = Infinity;
    this.max = -Infinity;
    for (var x = 0; x < this.grid; x++) {
      for (var y = 0; y < this.grid; y++) {
        var bits = decodeCell(x, y);
        var fit = this.fitnessOf(bits);
        var index = bitsToIndex(bits);
        this.fitness[index] = fit;
        if (fit < this.min) this.min = fit;
        if (fit > this.max) this.max = fit;
      }
    }
    this.localMax = [];
    for (var state = 0; state < this.size; state++) {
      var stateBits = indexToBits(state, n);
      var base = this.fitness[state];
      var peak = true;
      for (var bit = 0; bit < n; bit++) {
        stateBits[bit] = 1 - stateBits[bit];
        var neighbor = this.fitnessOf(stateBits);
        stateBits[bit] = 1 - stateBits[bit];
        if (neighbor > base + 1e-10) {
          peak = false;
          break;
        }
      }
      if (peak) this.localMax.push(state);
    }
    this.peakSet = new Set(this.localMax);
    this.histogram = new Array(24).fill(0);
    for (var s = 0; s < this.size; s++) {
      var t = this.max > this.min ? (this.fitness[s] - this.min) / (this.max - this.min) : 0;
      var bin = Math.min(23, Math.max(0, Math.floor(t * 24)));
      this.histogram[bin]++;
    }
    this.walkers = [];
    this.stop();
    if (self.canvas) this.draw();
  };

  NKLab.prototype.fitnessOf = function (bits) {
    var n = this.n;
    var k = this.k;
    var sum = 0;
    for (var i = 0; i < n; i++) {
      var mask = bits[i];
      for (var j = 1; j <= k; j++) {
        var neighbor = bits[(i + j) % n];
        mask |= neighbor << j;
      }
      sum += this.tables[i][mask];
    }
    return sum / n;
  };

  NKLab.prototype.bind = function () {
    var self = this;
    var kInput = document.getElementById("nk-k");
    var speedInput = document.getElementById("nk-speed");
    var run = document.getElementById("nk-run");
    var fresh = document.getElementById("nk-new");
    if (kInput) {
      kInput.addEventListener("input", function () {
        self.k = Number(kInput.value);
        self.build();
        self.paintStats();
        var label = document.getElementById("nk-k-val");
        if (label) label.textContent = String(self.k);
        self.setStatus(self.k === 0 ? "K = 0: additive Welt, ein klarer Gipfel. Starte die Kletterer und beobachte, wie direkt sie ihn finden." : "K = " + self.k + ": " + self.localMax.length + " lokale Gipfel. Jetzt entscheidet der Startpunkt mit.");
      });
    }
    if (speedInput) {
      speedInput.addEventListener("input", function () {
        var labels = ["", "langsam", "mittel", "schnell"];
        var label = document.getElementById("nk-speed-val");
        if (label) label.textContent = labels[Number(speedInput.value)];
        if (self.running) {
          self.stopTimer();
          self.startTimer();
        }
      });
    }
    if (run) {
      run.addEventListener("click", function () {
        if (self.running) {
          self.stop();
          run.textContent = "Weiter klettern";
          return;
        }
        if (!self.walkers.length || self.walkers.every(function (w) { return w.done; })) {
          self.spawnWalkers();
        }
        self.running = true;
        run.textContent = "Pause";
        self.startTimer();
      });
    }
    if (fresh) {
      fresh.addEventListener("click", function () {
        self.seed += 1;
        self.build();
        self.paintStats();
        self.setStatus("Neue Landschaft, K = " + self.k + ". Wieder " + self.localMax.length + " lokale Gipfel. Starte die Kletterer erneut.");
        if (run) run.textContent = "Kletterer starten";
      });
    }
  };

  NKLab.prototype.spawnWalkers = function () {
    this.walkers = [];
    var random = Math.random;
    for (var i = 0; i < 8; i++) {
      var state = Math.floor(random() * this.size);
      this.walkers.push({ state: state, path: [state], done: false, best: this.fitness[state] });
    }
  };

  NKLab.prototype.startTimer = function () {
    var self = this;
    var speed = Number((document.getElementById("nk-speed") || {}).value || 2);
    var delay = speed === 1 ? 650 : speed === 2 ? 340 : 160;
    this.stopTimer();
    this.timer = setInterval(function () {
      self.stepWalkers();
    }, delay);
  };

  NKLab.prototype.stopTimer = function () {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  };

  NKLab.prototype.stop = function () {
    this.running = false;
    this.stopTimer();
  };

  NKLab.prototype.stepWalkers = function () {
    var n = this.n;
    var moved = 0;
    var active = 0;
    for (var w = 0; w < this.walkers.length; w++) {
      var walker = this.walkers[w];
      if (walker.done) continue;
      active++;
      var bits = indexToBits(walker.state, n);
      var current = this.fitness[walker.state];
      var bestIndex = walker.state;
      var bestFit = current;
      for (var bit = 0; bit < n; bit++) {
        bits[bit] = 1 - bits[bit];
        var neighbor = bitsToIndex(bits);
        var fit = this.fitness[neighbor];
        bits[bit] = 1 - bits[bit];
        if (fit > bestFit + 1e-10) {
          bestFit = fit;
          bestIndex = neighbor;
        }
      }
      if (bestIndex !== walker.state) {
        walker.state = bestIndex;
        walker.best = bestFit;
        walker.path.push(bestIndex);
        moved++;
      } else {
        walker.done = true;
      }
    }
    if (active === 0 || moved === 0) {
      this.stop();
      var run = document.getElementById("nk-run");
      if (run) run.textContent = "Noch einmal";
      this.setStatus("Alle Kletterer sind stehen geblieben. Bei K = " + this.k + " gibt es " + this.localMax.length + " lokale Gipfel – nicht jeder ist der höchste.");
    }
    this.paintStats();
    this.draw();
  };

  NKLab.prototype.paintStats = function () {
    var peaks = this.localMax.length;
    var share = (peaks / this.size) * 100;
    var best = this.walkers.reduce(function (max, w) { return Math.max(max, w.best); }, -Infinity);
    var active = this.walkers.filter(function (w) { return !w.done; }).length;
    var peaksEl = document.getElementById("nk-peaks");
    var shareEl = document.getElementById("nk-peak-share");
    var bestEl = document.getElementById("nk-best");
    var activeEl = document.getElementById("nk-active");
    if (peaksEl) peaksEl.textContent = String(peaks);
    if (shareEl) shareEl.textContent = MP.fmt(share, 1) + " %";
    if (bestEl) bestEl.textContent = best === -Infinity ? "–" : MP.fmt(best, 3);
    if (activeEl) activeEl.textContent = active + " / " + (this.walkers.length || 8);
  };

  NKLab.prototype.setStatus = function (text) {
    var node = document.getElementById("nk-status");
    if (node) node.textContent = text;
  };

  NKLab.prototype.draw = function () {
    var ctx = this.ctx;
    var w = 900;
    var h = 600;
    var gx = 34;
    var gy = 28;
    var gw = 514;
    var gh = 514;
    var cell = gw / this.grid;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, w, h);

    var glow = ctx.createRadialGradient(300, 260, 20, 300, 260, 420);
    glow.addColorStop(0, "rgba(120,240,197,0.08)");
    glow.addColorStop(1, "rgba(5,8,16,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    for (var x = 0; x < this.grid; x++) {
      for (var y = 0; y < this.grid; y++) {
        var bits = decodeCell(x, y);
        var fit = this.fitness[bitsToIndex(bits)];
        var t = this.max > this.min ? (fit - this.min) / (this.max - this.min) : 0;
        ctx.fillStyle = colorFor(t);
        ctx.fillRect(gx + x * cell, gy + y * cell, cell + 0.5, cell + 0.5);
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    ctx.strokeRect(gx, gy, gw, gh);

    ctx.fillStyle = "rgba(5,8,16,0.28)";
    for (var line = 1; line < 8; line++) {
      var lx = gx + (gw / 8) * line;
      var ly = gy + (gh / 8) * line;
      ctx.fillRect(lx, gy, 1, gh);
      ctx.fillRect(gx, ly, gw, 1);
    }

    ctx.strokeStyle = "rgba(248,197,107,0.9)";
    ctx.lineWidth = 1.2;
    for (var i = 0; i < this.localMax.length; i++) {
      var state = this.localMax[i];
      var sb = indexToBits(state, this.n);
      var sx = 0;
      var sy = 0;
      for (var bit = 0; bit < 5; bit++) {
        if (sb[bit]) sx += 1 << bit;
        if (sb[bit + 5]) sy += 1 << bit;
      }
      var px = gx + (inverseGray(sx) + 0.5) * cell;
      var py = gy + (inverseGray(sy) + 0.5) * cell;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(2.2, cell * 0.19), 0, Math.PI * 2);
      ctx.stroke();
    }

    for (var wIndex = 0; wIndex < this.walkers.length; wIndex++) {
      var walker = this.walkers[wIndex];
      if (walker.path.length < 2) continue;
      ctx.beginPath();
      for (var p = 0; p < walker.path.length; p++) {
        var pb = indexToBits(walker.path[p], this.n);
        var pxx = 0;
        var pyy = 0;
        for (var pbBit = 0; pbBit < 5; pbBit++) {
          if (pb[pbBit]) pxx += 1 << pbBit;
          if (pb[pbBit + 5]) pyy += 1 << pbBit;
        }
        var cx = gx + (inverseGray(pxx) + 0.5) * cell;
        var cy = gy + (inverseGray(pyy) + 0.5) * cell;
        if (p === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.strokeStyle = walker.done ? "rgba(255,255,255,0.28)" : "rgba(120,240,197,0.72)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    for (var wi = 0; wi < this.walkers.length; wi++) {
      var wlk = this.walkers[wi];
      var wb = indexToBits(wlk.state, this.n);
      var wx = 0;
      var wy = 0;
      for (var wbBit = 0; wbBit < 5; wbBit++) {
        if (wb[wbBit]) wx += 1 << wbBit;
        if (wb[wbBit + 5]) wy += 1 << wbBit;
      }
      var wxPix = gx + (inverseGray(wx) + 0.5) * cell;
      var wyPix = gy + (inverseGray(wy) + 0.5) * cell;
      ctx.save();
      ctx.shadowColor = wlk.done ? "rgba(255,255,255,0.55)" : "#78f0c5";
      ctx.shadowBlur = wlk.done ? 6 : 13;
      ctx.beginPath();
      ctx.arc(wxPix, wyPix, wlk.done ? 3.4 : 4.4, 0, Math.PI * 2);
      ctx.fillStyle = wlk.done ? "rgba(255,255,255,0.78)" : "#f4efe4";
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = "rgba(244,239,228,0.72)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Genotyp-Raum · 2¹⁰ Zustände", gx, gy + gh + 26);
    ctx.fillStyle = "rgba(168,178,199,0.72)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("jede Zelle ein Genotyp · Gray-Code-Anordnung", gx, gy + gh + 44);

    var cx = 618;
    var cy = 64;
    var cw = 240;
    var ch = 178;
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    MP.roundRect(ctx, cx - 14, cy - 18, cw + 28, ch + 68, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.stroke();
    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Fitness-Verteilung", cx, cy - 1);
    var maxBin = Math.max.apply(null, this.histogram);
    for (var b = 0; b < this.histogram.length; b++) {
      var bh = maxBin > 0 ? (this.histogram[b] / maxBin) * ch : 0;
      var bx = cx + (b / this.histogram.length) * cw;
      var bw = cw / this.histogram.length - 2;
      var grad = ctx.createLinearGradient(0, cy + ch - bh, 0, cy + ch);
      grad.addColorStop(0, "rgba(120,240,197,0.95)");
      grad.addColorStop(1, "rgba(40,80,110,0.55)");
      ctx.fillStyle = grad;
      ctx.fillRect(bx, cy + ch - bh, bw, bh);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.beginPath();
    ctx.moveTo(cx, cy + ch);
    ctx.lineTo(cx + cw, cy + ch);
    ctx.stroke();
    ctx.fillStyle = "rgba(168,178,199,0.8)";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.fillText("niedrig", cx, cy + ch + 16);
    ctx.textAlign = "right";
    ctx.fillText("hoch", cx + cw, cy + ch + 16);
    ctx.textAlign = "left";

    var legendY = 338;
    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Was du siehst", cx, legendY);
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(168,178,199,0.9)";
    var lines = [
      "Helligkeit = Fitness eines Genotyps.",
      "Goldene Ringe = lokale Gipfel.",
      "Weiße Punkte = wartende Kletterer.",
      "Grüne Spuren = adaptive Wege."
    ];
    for (var l = 0; l < lines.length; l++) {
      ctx.fillText(lines[l], cx, legendY + 24 + l * 19);
    }

    ctx.fillStyle = "rgba(248,197,107,0.95)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("K = " + this.k, cx, legendY + 112);
    ctx.fillStyle = "rgba(168,178,199,0.9)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText(this.localMax.length + " lokale Gipfel von " + this.size + " Zuständen", cx, legendY + 132);
  };

  function inverseGray(g) {
    var n = 0;
    while (g > 0) {
      n ^= g;
      g >>= 1;
    }
    return n;
  }

  function BooleanLab() {
    this.canvas = document.getElementById("bn-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.n = 24;
    this.steps = 28;
    this.k = 2;
    this.seed = 3;
    this.step = 0;
    this.running = false;
    this.timer = null;
    this.trials = [];
    this.positions = [];
    this.currentSeries = [];
    this.base = null;
    this.pert = null;
    this.build();
    this.bind();
    this.resetRun();
    this.draw();
    this.paintStats();
    this.setStatus(this.statusText());
  }

  BooleanLab.prototype.build = function () {
    var self = this;
    var random = MP.seededRandom(this.seed * 104729 + this.k * 31 + 5);
    var n = this.n;
    var k = this.k;
    this.inputs = [];
    this.tables = [];
    for (var i = 0; i < n; i++) {
      var pool = [];
      for (var p = 0; p < n; p++) if (p !== i) pool.push(p);
      var chosen = [];
      for (var c = 0; c < k; c++) {
        var idx = Math.floor(random() * pool.length);
        chosen.push(pool.splice(idx, 1)[0]);
      }
      this.inputs.push(chosen);
      var table = [];
      for (var t = 0; t < (1 << k); t++) table.push(random() < 0.5 ? 1 : 0);
      this.tables.push(table);
    }
    this.sensitivity = this.measureSensitivity();
    this.positions = [];
    for (var q = 0; q < n; q++) {
      var angle = (q / n) * Math.PI * 2 - Math.PI / 2;
      this.positions.push({ x: 246 + Math.cos(angle) * 190, y: 282 + Math.sin(angle) * 190 });
    }
    if (this.canvas) this.draw();
  };

  BooleanLab.prototype.measureSensitivity = function () {
    var total = 0;
    var count = 0;
    for (var i = 0; i < this.n; i++) {
      var k = this.k;
      var table = this.tables[i];
      for (var input = 0; input < k; input++) {
        var changes = 0;
        var other = 1 << (k - 1);
        for (var mask = 0; mask < other; mask++) {
          var low = mask & ((1 << input) - 1);
          var high = mask >> input;
          var baseMask = low | (high << (input + 1));
          var zero = table[baseMask];
          var one = table[baseMask | (1 << input)];
          if (zero !== one) changes++;
        }
        total += changes / other;
        count++;
      }
    }
    return this.n ? total / this.n : 0;
  };

  BooleanLab.prototype.bind = function () {
    var self = this;
    var kInput = document.getElementById("bn-k");
    var speedInput = document.getElementById("bn-speed");
    var run = document.getElementById("bn-run");
    var fresh = document.getElementById("bn-new");
    if (kInput) {
      kInput.addEventListener("input", function () {
        self.k = Number(kInput.value);
        self.build();
        self.resetRun();
        var label = document.getElementById("bn-k-val");
        if (label) label.textContent = String(self.k);
        self.paintStats();
        self.setStatus(self.statusText());
        if (run) run.textContent = "Stören & laufen";
      });
    }
    if (speedInput) {
      speedInput.addEventListener("input", function () {
        var labels = ["", "langsam", "mittel", "schnell"];
        var label = document.getElementById("bn-speed-val");
        if (label) label.textContent = labels[Number(speedInput.value)];
        if (self.running) {
          self.stopTimer();
          self.startTimer();
        }
      });
    }
    if (run) {
      run.addEventListener("click", function () {
        if (self.running) {
          self.running = false;
          self.stopTimer();
          run.textContent = "Weiter";
          return;
        }
        if (self.step >= self.steps) self.resetRun();
        self.running = true;
        run.textContent = "Pause";
        self.startTimer();
      });
    }
    if (fresh) {
      fresh.addEventListener("click", function () {
        self.seed += 1;
        self.build();
        self.resetRun();
        self.paintStats();
        self.setStatus(self.statusText());
        if (run) run.textContent = "Stören & laufen";
      });
    }
  };

  BooleanLab.prototype.resetRun = function () {
    this.stopTimer();
    this.running = false;
    this.step = 0;
    this.trials = [];
    var random = MP.seededRandom(this.seed * 7717 + this.k * 997 + this.step + 101);
    for (var t = 0; t < 14; t++) {
      var base = [];
      for (var i = 0; i < this.n; i++) base.push(random() < 0.5 ? 1 : 0);
      var pert = base.slice();
      var flip = Math.floor(random() * this.n);
      pert[flip] = 1 - pert[flip];
      var series = [0];
      for (var s = 0; s < this.steps; s++) {
        base = this.update(base);
        pert = this.update(pert);
        var damage = 0;
        for (var d = 0; d < this.n; d++) if (base[d] !== pert[d]) damage++;
        series.push(damage / this.n);
      }
      this.trials.push({ base: base, pert: pert, series: series, base0: base.slice(), pert0: pert.slice() });
    }
    var first = this.trials[0];
    this.base = first.base0.slice();
    this.pert = first.pert0.slice();
    this.currentSeries = [0];
    this.draw();
  };

  BooleanLab.prototype.update = function (state) {
    var next = new Array(this.n);
    for (var i = 0; i < this.n; i++) {
      var mask = 0;
      var inputs = this.inputs[i];
      for (var j = 0; j < inputs.length; j++) {
        mask |= state[inputs[j]] << j;
      }
      next[i] = this.tables[i][mask];
    }
    return next;
  };

  BooleanLab.prototype.startTimer = function () {
    var self = this;
    var speed = Number((document.getElementById("bn-speed") || {}).value || 2);
    var delay = speed === 1 ? 720 : speed === 2 ? 400 : 190;
    this.stopTimer();
    this.timer = setInterval(function () {
      self.advance();
    }, delay);
  };

  BooleanLab.prototype.stopTimer = function () {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  };

  BooleanLab.prototype.advance = function () {
    if (this.step >= this.steps) {
      this.running = false;
      this.stopTimer();
      var run = document.getElementById("bn-run");
      if (run) run.textContent = "Noch einmal";
      this.setStatus("Lauf beendet. " + this.surviving() + " von 14 Störungen haben nach " + this.steps + " Schritten noch mehr als 12 % des Netzes verändert.");
      return;
    }
    this.base = this.update(this.base);
    this.pert = this.update(this.pert);
    var damage = 0;
    for (var i = 0; i < this.n; i++) if (this.base[i] !== this.pert[i]) damage++;
    this.step += 1;
    this.currentSeries.push(damage / this.n);
    this.draw();
    this.paintStats();
  };

  BooleanLab.prototype.surviving = function () {
    return this.trials.filter(function (trial) { return trial.series[trial.series.length - 1] > 0.12; }).length;
  };

  BooleanLab.prototype.averageAt = function (step) {
    var sum = 0;
    for (var i = 0; i < this.trials.length; i++) sum += this.trials[i].series[step] || 0;
    return sum / this.trials.length;
  };

  BooleanLab.prototype.statusText = function () {
    if (this.sensitivity < 0.9) return "λ = " + MP.fmt(this.sensitivity, 2) + ": geordnetes Regime. Störungen sterben meist schnell aus.";
    if (this.sensitivity > 1.1) return "λ = " + MP.fmt(this.sensitivity, 2) + ": chaotisches Regime. Kleine Störungen können das ganze Netz erfassen.";
    return "λ = " + MP.fmt(this.sensitivity, 2) + ": kritisches Regime. Manche Störungen sterben, manche bleiben. Genau hier ist die Grenze interessant.";
  };

  BooleanLab.prototype.paintStats = function () {
    var current = this.currentSeries.length ? this.currentSeries[this.currentSeries.length - 1] : 0;
    var lambdaEl = document.getElementById("bn-lambda");
    var regimeEl = document.getElementById("bn-regime");
    var damageEl = document.getElementById("bn-damage");
    var surviveEl = document.getElementById("bn-survive");
    if (lambdaEl) lambdaEl.textContent = MP.fmt(this.sensitivity, 2);
    if (regimeEl) regimeEl.textContent = this.sensitivity < 0.9 ? "geordnet" : this.sensitivity > 1.1 ? "chaotisch" : "kritisch";
    if (damageEl) damageEl.textContent = MP.fmt(current * 100, 1) + " %";
    if (surviveEl) surviveEl.textContent = this.surviving() + " / 14";
  };

  BooleanLab.prototype.setStatus = function (text) {
    var node = document.getElementById("bn-status");
    if (node) node.textContent = text;
  };

  BooleanLab.prototype.draw = function () {
    var ctx = this.ctx;
    var w = 900;
    var h = 560;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, w, h);
    var glow = ctx.createRadialGradient(246, 282, 10, 246, 282, 320);
    glow.addColorStop(0, "rgba(110,168,255,0.08)");
    glow.addColorStop(1, "rgba(5,8,16,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    for (var i = 0; i < this.n; i++) {
      for (var j = 0; j < this.inputs[i].length; j++) {
        var source = this.positions[this.inputs[i][j]];
        var target = this.positions[i];
        var mx = (source.x + target.x) / 2;
        var my = (source.y + target.y) / 2;
        var dx = target.x - source.x;
        var dy = target.y - source.y;
        var bend = 14;
        var nx = -dy / Math.hypot(dx, dy) * bend;
        var ny = dx / Math.hypot(dx, dy) * bend;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.quadraticCurveTo(mx + nx, my + ny, target.x, target.y);
        ctx.strokeStyle = this.base && this.base[i] ? "rgba(110,168,255,0.18)" : "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    for (var p = 0; p < this.positions.length; p++) {
      var pos = this.positions[p];
      var on = this.base && this.base[p] === 1;
      if (this.pert && this.base && this.pert[p] !== this.base[p]) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 13, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,142,168,0.95)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8.5, 0, Math.PI * 2);
      ctx.fillStyle = on ? "rgba(120,240,197,0.95)" : "rgba(16,26,46,0.98)";
      ctx.fill();
      ctx.strokeStyle = on ? "rgba(210,255,240,0.86)" : "rgba(110,168,255,0.42)";
      ctx.lineWidth = 1;
      ctx.stroke();
      if (on) {
        ctx.save();
        ctx.shadowColor = "#78f0c5";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.fillStyle = "rgba(244,239,228,0.72)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Boolesches Netz · 24 Gene", 28, 34);
    ctx.fillStyle = "rgba(168,178,199,0.74)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("K = " + this.k + " Eingänge pro Gen · gefüllt = an", 28, 52);

    var cx = 516;
    var cy = 62;
    var cw = 344;
    var ch = 224;
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    MP.roundRect(ctx, cx - 18, cy - 20, cw + 36, ch + 74, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.stroke();
    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Störung über die Zeit", cx, cy - 2);
    for (var grid = 0; grid <= 4; grid++) {
      var yy = cy + (ch / 4) * grid;
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.moveTo(cx, yy);
      ctx.lineTo(cx + cw, yy);
      ctx.stroke();
      ctx.fillStyle = "rgba(168,178,199,0.64)";
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(MP.fmt(1 - grid / 4, 2), cx - 8, yy + 3);
      ctx.textAlign = "left";
    }
    for (var trial = 0; trial < this.trials.length; trial++) {
      var series = this.trials[trial].series;
      ctx.beginPath();
      for (var s = 0; s <= this.step; s++) {
        var px = cx + (s / this.steps) * cw;
        var py = cy + ch - (series[s] || 0) * ch;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = "rgba(255,142,168,0.16)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.beginPath();
    for (var step = 0; step <= this.step; step++) {
      var avg = this.averageAt(step);
      var ax = cx + (step / this.steps) * cw;
      var ay = cy + ch - avg * ch;
      if (step === 0) ctx.moveTo(ax, ay);
      else ctx.lineTo(ax, ay);
    }
    ctx.strokeStyle = "#78f0c5";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    var last = this.currentSeries[this.currentSeries.length - 1] || 0;
    var lx = cx + (this.step / this.steps) * cw;
    var ly = cy + ch - last * ch;
    ctx.save();
    ctx.shadowColor = "#78f0c5";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#f4efe4";
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "rgba(168,178,199,0.7)";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Schritte", cx + cw / 2, cy + ch + 20);
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(168,178,199,0.82)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("dünn: 14 Einzelläufe · dick: Mittelwert", cx, cy + ch + 42);
    ctx.fillStyle = "rgba(255,142,168,0.8)";
    ctx.fillText("Schaden = Hamming-Abstand / N", cx, cy + ch + 58);

    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("λ = " + MP.fmt(this.sensitivity, 2) + " · " + (this.sensitivity < 0.9 ? "geordnet" : this.sensitivity > 1.1 ? "chaotisch" : "kritisch"), 516, 360);
    ctx.fillStyle = "rgba(168,178,199,0.88)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("Bei p = 0,5 gilt λ = K/2.", 516, 380);
    ctx.fillText("K = 1 → 0,5 · K = 2 → 1 · K = 4 → 2.", 516, 398);
  };

  function CatalysisLab() {
    this.canvas = document.getElementById("cat-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.n = 54;
    this.seed = 11;
    this.p = 0.02;
    this.weights = [];
    this.positions = [];
    this.build();
    this.bind();
    this.draw();
    this.paintStats();
  }

  CatalysisLab.prototype.build = function () {
    var random = MP.seededRandom(this.seed * 65537 + 29);
    this.weights = [];
    for (var i = 0; i < this.n; i++) {
      var row = [];
      for (var j = 0; j < this.n; j++) row.push(i === j ? 1 : random());
      this.weights.push(row);
    }
    this.positions = [];
    for (var q = 0; q < this.n; q++) {
      var angle = (q / this.n) * Math.PI * 2 - Math.PI / 2;
      this.positions.push({ x: 292 + Math.cos(angle) * 206, y: 264 + Math.sin(angle) * 206 });
    }
    this.updateGraph();
  };

  CatalysisLab.prototype.bind = function () {
    var self = this;
    var pInput = document.getElementById("cat-p");
    var fresh = document.getElementById("cat-new");
    if (pInput) {
      pInput.addEventListener("input", function () {
        self.p = Number(pInput.value) / 1000;
        var label = document.getElementById("cat-p-val");
        if (label) label.textContent = MP.fmt(self.p, 3);
        self.updateGraph();
        self.draw();
        self.paintStats();
      });
    }
    if (fresh) {
      fresh.addEventListener("click", function () {
        self.seed += 1;
        self.build();
        self.draw();
        self.paintStats();
      });
    }
  };

  CatalysisLab.prototype.updateGraph = function () {
    var n = this.n;
    this.adj = [];
    this.edgeCount = 0;
    for (var i = 0; i < n; i++) {
      var row = [];
      for (var j = 0; j < n; j++) {
        if (i !== j && this.weights[i][j] < this.p) {
          row.push(j);
          this.edgeCount++;
        }
      }
      this.adj.push(row);
    }
    this.reach = [];
    for (var start = 0; start < n; start++) {
      var seen = new Array(n).fill(false);
      var queue = [start];
      seen[start] = true;
      while (queue.length) {
        var node = queue.shift();
        var edges = this.adj[node];
        for (var e = 0; e < edges.length; e++) {
          if (!seen[edges[e]]) {
            seen[edges[e]] = true;
            queue.push(edges[e]);
          }
        }
      }
      this.reach.push(seen);
    }
    this.core = [];
    for (var base = 0; base < n; base++) {
      var group = [];
      for (var other = 0; other < n; other++) {
        if (this.reach[base][other] && this.reach[other][base]) group.push(other);
      }
      if (group.length > this.core.length) this.core = group;
    }
    this.coreSet = new Set(this.core);
  };

  CatalysisLab.prototype.paintStats = function () {
    var sizeEl = document.getElementById("cat-size");
    var shareEl = document.getElementById("cat-share");
    var edgesEl = document.getElementById("cat-edges");
    if (sizeEl) sizeEl.textContent = String(this.core.length);
    if (shareEl) shareEl.textContent = MP.fmt((this.core.length / this.n) * 100, 1) + " %";
    if (edgesEl) edgesEl.textContent = String(this.edgeCount);
    var status = document.getElementById("cat-status");
    if (status) {
      if (this.core.length < 3) status.textContent = "Unterhalb der Schwelle: viele kleine Inseln, kein kollektiver Kern. Erhöhe p.";
      else if (this.core.length < this.n * 0.5) status.textContent = "Ein Kern entsteht. " + this.core.length + " Moleküle sind gegenseitig erreichbar – die Schließung beginnt.";
      else status.textContent = "Großer Kern: " + this.core.length + " von " + this.n + " Knoten. Das Netz trägt sich kollektiv – im Spielzeugmodell.";
    }
  };

  CatalysisLab.prototype.draw = function () {
    var ctx = this.ctx;
    var w = 900;
    var h = 520;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, w, h);
    var glow = ctx.createRadialGradient(292, 264, 20, 292, 264, 360);
    glow.addColorStop(0, "rgba(120,240,197,0.08)");
    glow.addColorStop(1, "rgba(5,8,16,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    for (var i = 0; i < this.n; i++) {
      var edges = this.adj[i];
      for (var e = 0; e < edges.length; e++) {
        var j = edges[e];
        var a = this.positions[i];
        var b = this.positions[j];
        var both = this.coreSet.has(i) && this.coreSet.has(j);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        var mx = (a.x + b.x) / 2;
        var my = (a.y + b.y) / 2;
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var len = Math.hypot(dx, dy) || 1;
        ctx.quadraticCurveTo(mx - dy / len * 12, my + dx / len * 12, b.x, b.y);
        ctx.strokeStyle = both ? "rgba(120,240,197,0.30)" : "rgba(255,255,255,0.055)";
        ctx.lineWidth = both ? 1.2 : 0.8;
        ctx.stroke();
      }
    }

    for (var p = 0; p < this.n; p++) {
      var pos = this.positions[p];
      var inCore = this.coreSet.has(p);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, inCore ? 7 : 4.6, 0, Math.PI * 2);
      ctx.fillStyle = inCore ? "rgba(120,240,197,0.95)" : "rgba(70,84,110,0.6)";
      ctx.fill();
      ctx.strokeStyle = inCore ? "rgba(220,255,244,0.9)" : "rgba(168,178,199,0.28)";
      ctx.lineWidth = 1;
      ctx.stroke();
      if (inCore) {
        ctx.save();
        ctx.shadowColor = "#78f0c5";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.fillStyle = "rgba(244,239,228,0.72)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Katalyse-Netz · 54 Moleküle", 28, 34);
    ctx.fillStyle = "rgba(168,178,199,0.74)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("gerichtete Kante: i katalysiert die Bildung von j", 28, 52);
    ctx.fillStyle = "rgba(120,240,197,0.92)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Kern: " + this.core.length + " Knoten", 650, 70);
    ctx.fillStyle = "rgba(168,178,199,0.84)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("Schwelle p ≈ 1/N", 650, 90);
    ctx.fillText("hier: 1/54 ≈ 0,019", 650, 108);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(650, 126, 190, 1);
    ctx.fillStyle = "rgba(168,178,199,0.84)";
    ctx.fillText("Grün = größte stark", 650, 150);
    ctx.fillText("zusammenhängende Gruppe.", 650, 168);
    ctx.fillText("Grau = isolierte Inseln.", 650, 186);
  };

  document.addEventListener("DOMContentLoaded", function () {
    new NKLab();
    new BooleanLab();
    new CatalysisLab();
  });
})();
