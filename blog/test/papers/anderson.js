(function () {
  "use strict";

  var MP = window.MP;
  if (!MP) return;

  var TC = 2.269185;

  function IsingLab() {
    this.canvas = document.getElementById("ising-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.size = 64;
    this.cell = 460 / this.size;
    this.t = 2.27;
    this.spins = new Int8Array(this.size * this.size);
    this.running = true;
    this.last = 0;
    this.frame = 0;
    this.m = 0;
    this.energy = 0;
    this.randomize();
    this.bind();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  IsingLab.prototype.randomize = function () {
    for (var i = 0; i < this.spins.length; i++) this.spins[i] = Math.random() < 0.5 ? -1 : 1;
    this.computeStats();
    this.draw();
  };

  IsingLab.prototype.bind = function () {
    var self = this;
    var temp = document.getElementById("ising-t");
    var speed = document.getElementById("ising-speed");
    var reset = document.getElementById("ising-reset");
    var shock = document.getElementById("ising-shock");
    var pause = document.getElementById("ising-pause");
    if (temp) {
      temp.addEventListener("input", function () {
        self.t = Number(temp.value);
        var label = document.getElementById("ising-t-val");
        if (label) label.textContent = MP.fmt(self.t, 2);
        self.setStatus();
      });
    }
    if (speed) {
      speed.addEventListener("input", function () {
        var labels = ["", "1×", "2×", "3×"];
        var label = document.getElementById("ising-state");
        if (label) label.textContent = self.running ? labels[Number(speed.value)] : "Pause";
      });
    }
    if (reset) {
      reset.addEventListener("click", function () {
        self.randomize();
        self.setStatus("Neu gemischt. Bei niedriger Temperatur wachsen aus dem Rauschen Domänen – das dauert einen Moment.");
      });
    }
    if (shock) {
      shock.addEventListener("click", function () {
        self.shock();
      });
    }
    if (pause) {
      pause.addEventListener("click", function () {
        self.running = !self.running;
        pause.textContent = self.running ? "Pause" : "Weiter";
        var label = document.getElementById("ising-state");
        if (label) label.textContent = self.running ? "läuft" : "Pause";
      });
    }
    this.setStatus();
  };

  IsingLab.prototype.setStatus = function () {
    var node = document.getElementById("ising-status");
    if (!node) return;
    if (this.t < TC - 0.2) node.textContent = "Unter T_c: Die Kopplung gewinnt. Domänen wachsen, die Magnetisierung bleibt – die Symmetrie ist gebrochen.";
    else if (this.t > TC + 0.2) node.textContent = "Über T_c: Die Wärme gewinnt. Die Spins mischen sich, die Magnetisierung pendelt um null.";
    else node.textContent = "T ≈ T_c: Der kritische Bereich. Domänen sind groß, aber nicht stabil – kleine Änderungen können viel bewegen.";
  };

  IsingLab.prototype.shock = function () {
    var cx = Math.floor(this.size * (0.3 + Math.random() * 0.4));
    var cy = Math.floor(this.size * (0.3 + Math.random() * 0.4));
    var radius = 6;
    var sign = Math.random() < 0.5 ? -1 : 1;
    for (var y = cy - radius; y <= cy + radius; y++) {
      for (var x = cx - radius; x <= cx + radius; x++) {
        if (x < 0 || y < 0 || x >= this.size || y >= this.size) continue;
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= radius * radius) {
          this.spins[y * this.size + x] = sign;
        }
      }
    }
    this.computeStats();
    this.draw();
  };

  IsingLab.prototype.sweep = function () {
    var L = this.size;
    var T = this.t;
    for (var n = 0; n < L * L; n++) {
      var x = (Math.random() * L) | 0;
      var y = (Math.random() * L) | 0;
      var i = y * L + x;
      var s = this.spins[i];
      var left = this.spins[y * L + ((x - 1 + L) % L)];
      var right = this.spins[y * L + ((x + 1) % L)];
      var up = this.spins[((y - 1 + L) % L) * L + x];
      var down = this.spins[((y + 1) % L) * L + x];
      var neighbors = left + right + up + down;
      var delta = 2 * s * neighbors;
      if (delta <= 0 || Math.random() < Math.exp(-delta / T)) {
        this.spins[i] = -s;
      }
    }
  };

  IsingLab.prototype.computeStats = function () {
    var sum = 0;
    var L = this.size;
    for (var y = 0; y < L; y++) {
      for (var x = 0; x < L; x++) {
        var s = this.spins[y * L + x];
        sum += s;
      }
    }
    this.m = sum / (L * L);
    var energy = 0;
    for (var yy = 0; yy < L; yy++) {
      for (var xx = 0; xx < L; xx++) {
        var ss = this.spins[yy * L + xx];
        var rr = this.spins[yy * L + ((xx + 1) % L)];
        var dd = this.spins[((yy + 1) % L) * L + xx];
        energy -= ss * rr + ss * dd;
      }
    }
    this.energy = energy / (L * L);
  };

  IsingLab.prototype.loop = function (time) {
    if (!this.last) this.last = time;
    var dt = time - this.last;
    var speed = Number((document.getElementById("ising-speed") || {}).value || 2);
    var interval = speed === 1 ? 70 : speed === 2 ? 38 : 20;
    if (this.running && dt >= interval) {
      this.last = time;
      var sweeps = speed === 1 ? 2 : speed === 2 ? 5 : 9;
      for (var s = 0; s < sweeps; s++) this.sweep();
      this.computeStats();
      this.frame += 1;
      this.draw();
      if (this.frame % 4 === 0) this.paintStats();
    }
    requestAnimationFrame(this.loop);
  };

  IsingLab.prototype.paintStats = function () {
    var ratioEl = document.getElementById("ising-ratio");
    var mEl = document.getElementById("ising-m");
    var energyEl = document.getElementById("ising-energy");
    var phaseEl = document.getElementById("ising-phase");
    if (ratioEl) ratioEl.textContent = MP.fmt(this.t / TC, 2);
    if (mEl) mEl.textContent = MP.fmt(Math.abs(this.m), 2);
    if (energyEl) energyEl.textContent = MP.fmt(this.energy, 2);
    if (phaseEl) {
      phaseEl.textContent = this.t < TC - 0.12 ? "gebrochen" : this.t > TC + 0.12 ? "ungebrochen" : "kritisch";
    }
  };

  IsingLab.prototype.draw = function () {
    var ctx = this.ctx;
    var w = 900;
    var h = 600;
    var gx = 30;
    var gy = 40;
    var L = this.size;
    var cell = this.cell;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, w, h);
    var glow = ctx.createRadialGradient(gx + 230, gy + 230, 20, gx + 230, gy + 230, 430);
    glow.addColorStop(0, "rgba(110,168,255,0.08)");
    glow.addColorStop(1, "rgba(5,8,16,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    for (var y = 0; y < L; y++) {
      for (var x = 0; x < L; x++) {
        var s = this.spins[y * L + x];
        ctx.fillStyle = s > 0 ? "#6ea8ff" : "#ff8ea8";
        ctx.fillRect(gx + x * cell, gy + y * cell, Math.ceil(cell), Math.ceil(cell));
      }
    }
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(gx, gy, L * cell, L * cell);
    ctx.fillStyle = "rgba(244,239,228,0.72)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Ising-Gitter · 64 × 64 Spins", gx, gy - 14);
    ctx.fillStyle = "rgba(168,178,199,0.72)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("blau = +1 · rosa = −1 · Nachbarn wollen gleich sein", gx, gy + L * cell + 22);

    var cx = 560;
    var cy = 78;
    var cw = 300;
    var ch = 240;
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    MP.roundRect(ctx, cx - 20, cy - 22, cw + 40, ch + 76, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.stroke();
    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Magnetisierung |M|", cx, cy - 2);
    for (var g = 0; g <= 4; g++) {
      var yLine = cy + (ch / 4) * g;
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.moveTo(cx, yLine);
      ctx.lineTo(cx + cw, yLine);
      ctx.stroke();
      ctx.fillStyle = "rgba(168,178,199,0.62)";
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(MP.fmt(1 - g / 4, 2), cx - 7, yLine + 3);
      ctx.textAlign = "left";
    }
    var tMin = 0.6;
    var tMax = 4;
    ctx.beginPath();
    for (var p = 0; p <= 280; p++) {
      var T = tMin + (p / 280) * (tMax - tMin);
      var M = T < TC ? Math.pow(1 - Math.pow(Math.sinh(2 / T), -4), 1 / 8) : 0;
      var px = cx + ((T - tMin) / (tMax - tMin)) * cw;
      var py = cy + ch - M * ch;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = "rgba(110,168,255,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
    var tcX = cx + ((TC - tMin) / (tMax - tMin)) * cw;
    ctx.strokeStyle = "rgba(248,197,107,0.68)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(tcX, cy);
    ctx.lineTo(tcX, cy + ch);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(248,197,107,0.9)";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("T_c", tcX, cy - 6);
    ctx.textAlign = "left";
    var dotX = cx + ((this.t - tMin) / (tMax - tMin)) * cw;
    var dotY = cy + ch - Math.abs(this.m) * ch;
    ctx.save();
    ctx.shadowColor = "#78f0c5";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#f4efe4";
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "rgba(168,178,199,0.72)";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Temperatur T", cx + cw / 2, cy + ch + 20);
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(168,178,199,0.82)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("exakte Kurve für das 2D-Ising-Modell", cx, cy + ch + 42);
    ctx.fillText("Punkt: dein aktueller Zustand", cx, cy + ch + 58);

    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("T = " + MP.fmt(this.t, 2) + " · |M| = " + MP.fmt(Math.abs(this.m), 2), 560, 400);
    ctx.fillStyle = "rgba(168,178,199,0.86)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("T_c ≈ 2,269 · darunter bricht die Symmetrie", 560, 420);
    ctx.fillText("darüber verschwindet die Ordnung", 560, 438);
  };

  function LandauLab() {
    this.canvas = document.getElementById("landau-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.t = 1.2;
    this.m = 0.72;
    this.target = 0.72;
    this.running = true;
    this.bind();
    this.computeTarget();
    this.m = this.target;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  LandauLab.prototype.a = function () {
    return (this.t - TC) / TC;
  };

  LandauLab.prototype.potential = function (m) {
    var a = this.a();
    return 0.5 * a * m * m + 0.25 * m * m * m * m;
  };

  LandauLab.prototype.computeTarget = function () {
    var a = this.a();
    if (a >= 0) {
      this.target = 0;
      return;
    }
    var m0 = Math.sqrt(-a);
    var sign = this.m < -0.05 ? -1 : 1;
    this.target = sign * m0;
  };

  LandauLab.prototype.bind = function () {
    var self = this;
    var temp = document.getElementById("landau-t");
    var flip = document.getElementById("landau-flip");
    var warm = document.getElementById("landau-warm");
    if (temp) {
      temp.addEventListener("input", function () {
        self.t = Number(temp.value);
        var label = document.getElementById("landau-t-val");
        if (label) label.textContent = MP.fmt(self.t, 2);
        self.computeTarget();
        self.paintStats();
        self.setStatus();
      });
    }
    if (flip) {
      flip.addEventListener("click", function () {
        if (self.t >= TC) {
          self.t = 1.2;
          if (temp) temp.value = "1.2";
          var label = document.getElementById("landau-t-val");
          if (label) label.textContent = "1,20";
        }
        self.m = -self.m;
        self.computeTarget();
        self.paintStats();
        self.setStatus();
      });
    }
    if (warm) {
      warm.addEventListener("click", function () {
        self.t = 3;
        if (temp) temp.value = "3";
        var label = document.getElementById("landau-t-val");
        if (label) label.textContent = "3,00";
        self.computeTarget();
        self.paintStats();
        self.setStatus();
      });
    }
    this.paintStats();
    this.setStatus();
  };

  LandauLab.prototype.setStatus = function () {
    var node = document.getElementById("landau-status");
    if (!node) return;
    if (this.t < TC) node.textContent = "Unter T_c: zwei gleich gute Minima. Die Kugel sitzt in einem davon – das ist die gebrochene Symmetrie.";
    else node.textContent = "Über T_c: nur ein Minimum bei M = 0. Die Symmetrie ist ungebrochen, die Ordnung verschwunden.";
  };

  LandauLab.prototype.paintStats = function () {
    var ratioEl = document.getElementById("landau-ratio");
    var mEl = document.getElementById("landau-m");
    var phaseEl = document.getElementById("landau-phase");
    var barrierEl = document.getElementById("landau-barrier");
    if (ratioEl) ratioEl.textContent = MP.fmt(this.t / TC, 2);
    if (mEl) mEl.textContent = MP.fmt(this.m, 2);
    if (phaseEl) phaseEl.textContent = this.t < TC ? "gebrochen" : "ungebrochen";
    if (barrierEl) {
      var barrier = this.t < TC ? this.potential(0) - this.potential(Math.sqrt(-this.a())) : 0;
      barrierEl.textContent = MP.fmt(barrier, 3);
    }
  };

  LandauLab.prototype.loop = function () {
    var diff = this.target - this.m;
    this.m += diff * 0.06;
    if (Math.abs(diff) < 0.0005) this.m = this.target;
    this.draw();
    this.paintStats();
    requestAnimationFrame(this.loop);
  };

  LandauLab.prototype.draw = function () {
    var ctx = this.ctx;
    var w = 900;
    var h = 520;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, w, h);
    var glow = ctx.createRadialGradient(430, 260, 20, 430, 260, 420);
    glow.addColorStop(0, "rgba(120,240,197,0.06)");
    glow.addColorStop(1, "rgba(5,8,16,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    var x0 = 80;
    var y0 = 60;
    var cw = 680;
    var ch = 330;
    var mMin = -1.45;
    var mMax = 1.45;
    var minF = Infinity;
    var maxF = -Infinity;
    for (var i = 0; i <= 300; i++) {
      var m = mMin + (i / 300) * (mMax - mMin);
      var f = this.potential(m);
      if (f < minF) minF = f;
      if (f > maxF) maxF = f;
    }
    var pad = (maxF - minF) * 0.14 || 0.1;
    minF -= pad;
    maxF += pad;

    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Effektives Potential F(M)", x0, y0 - 20);
    ctx.fillStyle = "rgba(168,178,199,0.82)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("T = " + MP.fmt(this.t, 2) + " · T_c = 2,269", x0, y0 - 2);

    var zeroX = x0 + ((0 - mMin) / (mMax - mMin)) * cw;
    var zeroY = y0 + ch - ((0 - minF) / (maxF - minF)) * ch;
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, zeroY);
    ctx.lineTo(x0 + cw, zeroY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(zeroX, y0);
    ctx.lineTo(zeroX, y0 + ch);
    ctx.stroke();

    var points = [];
    for (var p = 0; p <= 300; p++) {
      var mm = mMin + (p / 300) * (mMax - mMin);
      var ff = this.potential(mm);
      var px = x0 + (p / 300) * cw;
      var py = y0 + ch - ((ff - minF) / (maxF - minF)) * ch;
      points.push({ x: px, y: py });
    }
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var q = 1; q < points.length; q++) ctx.lineTo(points[q].x, points[q].y);
    ctx.lineTo(x0 + cw, y0 + ch);
    ctx.lineTo(x0, y0 + ch);
    ctx.closePath();
    var fill = ctx.createLinearGradient(0, y0, 0, y0 + ch);
    fill.addColorStop(0, "rgba(110,168,255,0.02)");
    fill.addColorStop(0.55, "rgba(120,240,197,0.12)");
    fill.addColorStop(1, "rgba(120,240,197,0.01)");
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var r = 1; r < points.length; r++) ctx.lineTo(points[r].x, points[r].y);
    ctx.strokeStyle = "#6ea8ff";
    ctx.lineWidth = 2.4;
    ctx.stroke();

    if (this.t < TC) {
      var m0 = Math.sqrt(-this.a());
      var mins = [-m0, m0];
      for (var mi = 0; mi < mins.length; mi++) {
        var mx = x0 + ((mins[mi] - mMin) / (mMax - mMin)) * cw;
        var my = y0 + ch - ((this.potential(mins[mi]) - minF) / (maxF - minF)) * ch;
        ctx.beginPath();
        ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(248,197,107,0.95)";
        ctx.fill();
      }
    } else {
      var centerY = y0 + ch - ((this.potential(0) - minF) / (maxF - minF)) * ch;
      ctx.beginPath();
      ctx.arc(zeroX, centerY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(248,197,107,0.95)";
      ctx.fill();
    }

    var ballX = x0 + ((this.m - mMin) / (mMax - mMin)) * cw;
    var ballY = y0 + ch - ((this.potential(this.m) - minF) / (maxF - minF)) * ch;
    ctx.save();
    ctx.shadowColor = "#78f0c5";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#f4efe4";
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(ballX, ballY, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#78f0c5";
    ctx.fill();

    ctx.fillStyle = "rgba(168,178,199,0.72)";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Ordnungsparameter M", x0 + cw / 2, y0 + ch + 22);
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(168,178,199,0.82)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("Die Kurve ist eine Landau-Näherung, kein exaktes Modell.", x0, y0 + ch + 46);

    var barX = 560;
    var barY = 436;
    var barW = 280;
    var grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, "rgba(255,142,168,0.6)");
    grad.addColorStop(0.5, "rgba(248,197,107,0.7)");
    grad.addColorStop(1, "rgba(110,168,255,0.6)");
    ctx.fillStyle = grad;
    MP.roundRect(ctx, barX, barY, barW, 6, 3);
    ctx.fill();
    var markerX = barX + MP.clamp((this.t - 0.4) / (3.2 - 0.4), 0, 1) * barW;
    ctx.beginPath();
    ctx.arc(markerX, barY + 3, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#f4efe4";
    ctx.fill();
    ctx.strokeStyle = "#78f0c5";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(168,178,199,0.82)";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Temperatur", barX + barW / 2, barY + 28);
    ctx.textAlign = "left";
  };

  document.addEventListener("DOMContentLoaded", function () {
    new IsingLab();
    new LandauLab();
  });
})();
