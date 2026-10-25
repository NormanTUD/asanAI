(function () {
  "use strict";

  var MP = window.MP;
  if (!MP) return;

  function OpenSystemLab() {
    this.canvas = document.getElementById("open-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.i = 1;
    this.k = 0.5;
    this.v = 0.4;
    this.phase = 0;
    this.last = 0;
    this.frame = 0;
    this.bind();
    this.paintStats();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  OpenSystemLab.prototype.vstar = function () {
    return this.i / this.k;
  };

  OpenSystemLab.prototype.bind = function () {
    var self = this;
    var inflow = document.getElementById("open-i");
    var drain = document.getElementById("open-k");
    var shock = document.getElementById("open-shock");
    var reset = document.getElementById("open-reset");
    if (inflow) {
      inflow.addEventListener("input", function () {
        self.i = Number(inflow.value);
        var label = document.getElementById("open-i-val");
        if (label) label.textContent = MP.fmt(self.i, 2);
        self.paintStats();
        self.setStatus();
      });
    }
    if (drain) {
      drain.addEventListener("input", function () {
        self.k = Number(drain.value);
        var label = document.getElementById("open-k-val");
        if (label) label.textContent = MP.fmt(self.k, 2);
        self.paintStats();
        self.setStatus();
      });
    }
    if (shock) {
      shock.addEventListener("click", function () {
        self.v = MP.clamp(self.v + 0.85, 0, 3);
        self.setStatus("Störung: Der Pegel springt. Das System wird nicht „repariert“ – es fließt einfach zurück ins Gleichgewicht.");
      });
    }
    if (reset) {
      reset.addEventListener("click", function () {
        self.v = 0.2;
        self.setStatus();
      });
    }
    this.setStatus();
  };

  OpenSystemLab.prototype.setStatus = function () {
    var node = document.getElementById("open-status");
    if (!node) return;
    var gap = Math.abs(this.v - this.vstar());
    if (gap < 0.03) node.textContent = "Im Fließgleichgewicht: Zufluss und Abfluss sind gleich. Der Pegel bleibt, obwohl das Wasser weiter durchläuft.";
    else if (this.v < this.vstar()) node.textContent = "Unter dem Gleichgewicht: Der Zufluss ist stärker als der Abfluss. Der Pegel steigt.";
    else node.textContent = "Über dem Gleichgewicht: Der Abfluss ist stärker als der Zufluss. Der Pegel sinkt.";
  };

  OpenSystemLab.prototype.paintStats = function () {
    var vstar = this.vstar();
    var vstarEl = document.getElementById("open-vstar");
    var tauEl = document.getElementById("open-tau");
    var vEl = document.getElementById("open-v");
    var gapEl = document.getElementById("open-gap");
    if (vstarEl) vstarEl.textContent = MP.fmt(vstar, 2);
    if (tauEl) tauEl.textContent = MP.fmt(1 / this.k, 2);
    if (vEl) vEl.textContent = MP.fmt(this.v, 2);
    if (gapEl) gapEl.textContent = MP.fmt(Math.abs(this.v - vstar), 2);
  };

  OpenSystemLab.prototype.loop = function (time) {
    if (!this.last) this.last = time;
    var dt = time - this.last;
    if (dt >= 33) {
      this.last = time;
      this.v += (this.i - this.k * this.v) * 0.045;
      this.v = MP.clamp(this.v, 0, 3.4);
      this.phase += 0.035;
      this.frame++;
      if (this.frame % 3 === 0) this.paintStats();
      this.draw();
    }
    requestAnimationFrame(this.loop);
  };

  OpenSystemLab.prototype.draw = function () {
    var ctx = this.ctx;
    var w = 900;
    var h = 560;
    var vstar = this.vstar();
    var capacity = Math.max(2.7, vstar + 0.6);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, w, h);
    var glow = ctx.createRadialGradient(230, 270, 20, 230, 270, 370);
    glow.addColorStop(0, "rgba(248,197,107,0.08)");
    glow.addColorStop(1, "rgba(5,8,16,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    var tx = 76;
    var ty = 106;
    var tw = 250;
    var th = 320;
    ctx.fillStyle = "rgba(255,255,255,0.025)";
    MP.roundRect(ctx, tx - 26, ty - 48, tw + 52, th + 96, 18);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.stroke();

    ctx.strokeStyle = "rgba(248,197,107,0.48)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx - 36, ty + 8);
    ctx.lineTo(tx + 18, ty + 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx + 18, ty + 8);
    ctx.lineTo(tx + 10, ty + 2);
    ctx.moveTo(tx + 18, ty + 8);
    ctx.lineTo(tx + 10, ty + 14);
    ctx.stroke();
    ctx.fillStyle = "rgba(248,197,107,0.9)";
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    ctx.fillText("Zufluss I", tx - 38, ty - 10);

    ctx.strokeStyle = "rgba(255,255,255,0.36)";
    ctx.lineWidth = 2;
    ctx.strokeRect(tx, ty, tw, th);

    var level = MP.clamp(this.v / capacity, 0, 1) * th;
    var waterY = ty + th - level;
    ctx.save();
    ctx.beginPath();
    ctx.rect(tx, ty, tw, th);
    ctx.clip();
    var water = ctx.createLinearGradient(0, waterY, 0, ty + th);
    water.addColorStop(0, "rgba(248,197,107,0.78)");
    water.addColorStop(0.5, "rgba(78,140,150,0.58)");
    water.addColorStop(1, "rgba(16,40,60,0.8)");
    ctx.fillStyle = water;
    ctx.fillRect(tx, waterY, tw, level);
    ctx.beginPath();
    ctx.moveTo(tx, waterY);
    for (var x = 0; x <= tw; x += 4) {
      var wave = Math.sin(x * 0.06 + this.phase * 2.1) * 2.2 + Math.sin(x * 0.13 - this.phase) * 1.2;
      ctx.lineTo(tx + x, waterY + wave);
    }
    ctx.lineTo(tx + tw, ty + th);
    ctx.lineTo(tx, ty + th);
    ctx.closePath();
    ctx.fillStyle = "rgba(248,197,107,0.18)";
    ctx.fill();
    for (var p = 0; p < 14; p++) {
      var px = tx + 14 + ((p * 53) % (tw - 28));
      var py = ty + th - ((this.phase * 36 + p * 47) % Math.max(20, level));
      if (py < waterY + 5) continue;
      ctx.beginPath();
      ctx.arc(px, py, 1.4 + (p % 3) * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,250,230,0.28)";
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = "rgba(244,239,228,0.88)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Offenes System", tx, ty - 18);
    ctx.fillStyle = "rgba(168,178,199,0.78)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("V = " + MP.fmt(this.v, 2) + " · V* = " + MP.fmt(vstar, 2), tx, ty + th + 24);

    ctx.strokeStyle = "rgba(255,142,168,0.52)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx + tw - 20, ty + th + 12);
    ctx.lineTo(tx + tw + 34, ty + th + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx + tw + 34, ty + th + 12);
    ctx.lineTo(tx + tw + 26, ty + th + 6);
    ctx.moveTo(tx + tw + 34, ty + th + 12);
    ctx.lineTo(tx + tw + 26, ty + th + 18);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,142,168,0.88)";
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    ctx.fillText("Abfluss kV", tx + tw - 68, ty + th + 36);

    var cx = 500;
    var cy = 80;
    var cw = 350;
    var ch = 340;
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    MP.roundRect(ctx, cx - 20, cy - 24, cw + 40, ch + 86, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.stroke();
    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Viele Starts, ein Gleichgewicht", cx, cy - 2);

    for (var g = 0; g <= 4; g++) {
      var yLine = cy + (ch / 4) * g;
      ctx.strokeStyle = "rgba(255,255,255,0.075)";
      ctx.beginPath();
      ctx.moveTo(cx, yLine);
      ctx.lineTo(cx + cw, yLine);
      ctx.stroke();
      ctx.fillStyle = "rgba(168,178,199,0.62)";
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(MP.fmt(capacity * (1 - g / 4), 1), cx - 8, yLine + 3);
      ctx.textAlign = "left";
    }

    var starts = [0.08, 0.45, 0.9, 1.45, 2.25];
    var colors = ["rgba(110,168,255,0.7)", "rgba(120,240,197,0.7)", "rgba(248,197,107,0.75)", "rgba(255,159,178,0.65)", "rgba(180,170,255,0.62)"];
    for (var s = 0; s < starts.length; s++) {
      var v0 = starts[s];
      ctx.beginPath();
      for (var p2 = 0; p2 <= 240; p2++) {
        var t = (p2 / 240) * 8;
        var value = vstar + (v0 - vstar) * Math.exp(-this.k * t);
        var px2 = cx + (p2 / 240) * cw;
        var py2 = cy + ch - (value / capacity) * ch;
        if (p2 === 0) ctx.moveTo(px2, py2);
        else ctx.lineTo(px2, py2);
      }
      ctx.strokeStyle = colors[s];
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    var vY = cy + ch - (vstar / capacity) * ch;
    ctx.strokeStyle = "rgba(248,197,107,0.8)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(cx, vY);
    ctx.lineTo(cx + cw, vY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(248,197,107,0.9)";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("V*", cx + cw + 20, vY + 3);
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(168,178,199,0.72)";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Zeit", cx + cw / 2, cy + ch + 20);
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(168,178,199,0.82)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("fünf verschiedene Anfangspegel", cx, cy + ch + 44);
    ctx.fillText("alle laufen auf dasselbe V* zu", cx, cy + ch + 60);
  };

  function LogisticLab() {
    this.canvas = document.getElementById("logistic-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.r = 0.8;
    this.k = 1;
    this.bind();
    this.paintStats();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  LogisticLab.prototype.bind = function () {
    var self = this;
    var rate = document.getElementById("logistic-r");
    var capacity = document.getElementById("logistic-k");
    var slow = document.getElementById("logistic-slow");
    var fast = document.getElementById("logistic-fast");
    if (rate) {
      rate.addEventListener("input", function () {
        self.r = Number(rate.value);
        self.paintStats();
        self.setStatus();
      });
    }
    if (capacity) {
      capacity.addEventListener("input", function () {
        self.k = Number(capacity.value);
        self.paintStats();
        self.setStatus();
      });
    }
    if (slow) {
      slow.addEventListener("click", function () {
        self.r = MP.clamp(self.r - 0.1, 0.2, 1.5);
        if (rate) rate.value = String(self.r);
        self.paintStats();
        self.setStatus();
      });
    }
    if (fast) {
      fast.addEventListener("click", function () {
        self.r = MP.clamp(self.r + 0.1, 0.2, 1.5);
        if (rate) rate.value = String(self.r);
        self.paintStats();
        self.setStatus();
      });
    }
    this.setStatus();
  };

  LogisticLab.prototype.setStatus = function () {
    var node = document.getElementById("logistic-status");
    if (!node) return;
    node.textContent = "Equifinalität: Die Startwerte sind verschieden, das Ziel ist gleich. Höheres r macht die Annäherung schneller, nicht das Ziel anders.";
  };

  LogisticLab.prototype.paintStats = function () {
    var kEl = document.getElementById("logistic-k");
    var rEl = document.getElementById("logistic-r");
    var t90El = document.getElementById("logistic-t90");
    var rLabel = document.getElementById("logistic-r-val");
    var kLabel = document.getElementById("logistic-k-val");
    if (kEl) kEl.textContent = MP.fmt(this.k, 2);
    if (rEl) rEl.textContent = MP.fmt(this.r, 2);
    if (rLabel) rLabel.textContent = MP.fmt(this.r, 2);
    if (kLabel) kLabel.textContent = MP.fmt(this.k, 2);
    if (t90El) t90El.textContent = MP.fmt(4.394 / this.r, 2);
  };

  LogisticLab.prototype.loop = function () {
    this.draw();
    requestAnimationFrame(this.loop);
  };

  LogisticLab.prototype.draw = function () {
    var ctx = this.ctx;
    var w = 900;
    var h = 500;
    var x0 = 70;
    var y0 = 58;
    var cw = 750;
    var ch = 340;
    var yMax = Math.max(this.k * 1.75, 0.3);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, w, h);
    var glow = ctx.createRadialGradient(440, 230, 20, 440, 230, 430);
    glow.addColorStop(0, "rgba(120,240,197,0.06)");
    glow.addColorStop(1, "rgba(5,8,16,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255,255,255,0.03)";
    MP.roundRect(ctx, x0 - 24, y0 - 30, cw + 48, ch + 96, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.stroke();
    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Populationsdynamik · logistisches Wachstum", x0, y0 - 8);

    for (var g = 0; g <= 4; g++) {
      var yy = y0 + (ch / 4) * g;
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.beginPath();
      ctx.moveTo(x0, yy);
      ctx.lineTo(x0 + cw, yy);
      ctx.stroke();
      ctx.fillStyle = "rgba(168,178,199,0.62)";
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(MP.fmt(yMax * (1 - g / 4), 2), x0 - 8, yy + 3);
      ctx.textAlign = "left";
    }
    for (var v = 0; v <= 6; v++) {
      var xx = x0 + (cw / 6) * v;
      ctx.strokeStyle = "rgba(255,255,255,0.055)";
      ctx.beginPath();
      ctx.moveTo(xx, y0);
      ctx.lineTo(xx, y0 + ch);
      ctx.stroke();
      ctx.fillStyle = "rgba(168,178,199,0.55)";
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(v * 2), xx, y0 + ch + 20);
      ctx.textAlign = "left";
    }

    var kY = y0 + ch - (this.k / yMax) * ch;
    ctx.strokeStyle = "rgba(248,197,107,0.78)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x0, kY);
    ctx.lineTo(x0 + cw, kY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(248,197,107,0.9)";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("K", x0 + cw + 18, kY + 3);
    ctx.textAlign = "left";

    var starts = [0.06, 0.3, 0.65, 1.45];
    var colors = ["rgba(110,168,255,0.78)", "rgba(120,240,197,0.82)", "rgba(248,197,107,0.86)", "rgba(255,159,178,0.76)"];
    for (var s = 0; s < starts.length; s++) {
      var n0 = starts[s] * this.k;
      var a = (this.k - n0) / n0;
      ctx.beginPath();
      for (var p = 0; p <= 300; p++) {
        var t = (p / 300) * 12;
        var n = this.k / (1 + a * Math.exp(-this.r * t));
        var px = x0 + (p / 300) * cw;
        var py = y0 + ch - (n / yMax) * ch;
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = colors[s];
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    var markerT = (performance.now() / 1000 * 0.9) % 12;
    for (var m = 0; m < starts.length; m++) {
      var n0m = starts[m] * this.k;
      var am = (this.k - n0m) / n0m;
      var nm = this.k / (1 + am * Math.exp(-this.r * markerT));
      var mx = x0 + (markerT / 12) * cw;
      var my = y0 + ch - (nm / yMax) * ch;
      ctx.beginPath();
      ctx.arc(mx, my, 3.6, 0, Math.PI * 2);
      ctx.fillStyle = "#f4efe4";
      ctx.fill();
    }

    ctx.fillStyle = "rgba(168,178,199,0.72)";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Zeit", x0 + cw / 2, y0 + ch + 44);
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(168,178,199,0.82)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("Startwerte: 6 %, 30 %, 65 %, 145 % von K", x0, y0 + ch + 66);
    ctx.fillText("Alle positiven Startwerte laufen gegen K.", x0, y0 + ch + 82);
  };

  function FeedbackLab() {
    this.canvas = document.getElementById("feedback-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.g = 0.25;
    this.mode = "negative";
    this.signal = 1.35;
    this.target = 1;
    this.bind();
    this.paintStats();
    this.draw();
  }

  FeedbackLab.prototype.bind = function () {
    var self = this;
    var gain = document.getElementById("feedback-g");
    var neg = document.getElementById("feedback-neg");
    var pos = document.getElementById("feedback-pos");
    if (gain) {
      gain.addEventListener("input", function () {
        self.g = Number(gain.value);
        self.paintStats();
        self.draw();
        self.setStatus();
      });
    }
    if (neg) {
      neg.addEventListener("click", function () {
        self.mode = "negative";
        self.signal = 1.35;
        neg.setAttribute("aria-pressed", "true");
        if (pos) pos.setAttribute("aria-pressed", "false");
        self.paintStats();
        self.draw();
        self.setStatus();
      });
    }
    if (pos) {
      pos.addEventListener("click", function () {
        self.mode = "positive";
        self.signal = 1.08;
        pos.setAttribute("aria-pressed", "true");
        if (neg) neg.setAttribute("aria-pressed", "false");
        self.paintStats();
        self.draw();
        self.setStatus();
      });
    }
    this.setStatus();
  };

  FeedbackLab.prototype.computeSeries = function () {
    var series = [this.signal];
    var value = this.signal;
    for (var t = 0; t < 24; t++) {
      if (this.mode === "negative") value = value + this.g * (this.target - value);
      else value = value + this.g * (value - this.target);
      if (!isFinite(value)) value = 1e9;
      series.push(value);
    }
    return series;
  };

  FeedbackLab.prototype.setStatus = function () {
    var node = document.getElementById("feedback-status");
    if (!node) return;
    if (this.mode === "negative") node.textContent = "Negative Rückkopplung: Das Signal wird zur Abweichung hingezogen. Der Sollwert wirkt wie ein Attraktor.";
    else node.textContent = "Positive Rückkopplung: Die Abweichung verstärkt sich selbst. Je größer g, desto schneller wird das Signal instabil.";
  };

  FeedbackLab.prototype.paintStats = function () {
    var series = this.computeSeries();
    var end = series[series.length - 1];
    var modeEl = document.getElementById("feedback-mode");
    var gEl = document.getElementById("feedback-g");
    var endEl = document.getElementById("feedback-end");
    var behaviorEl = document.getElementById("feedback-behavior");
    var gLabel = document.getElementById("feedback-g-val");
    if (modeEl) modeEl.textContent = this.mode === "negative" ? "negativ" : "positiv";
    if (gEl) gEl.textContent = MP.fmt(this.g, 2);
    if (gLabel) gLabel.textContent = MP.fmt(this.g, 2);
    if (endEl) endEl.textContent = Math.abs(end) > 999 ? "> 999" : MP.fmt(end, 2);
    if (behaviorEl) behaviorEl.textContent = this.mode === "negative" ? "stabil" : "schaukelt auf";
  };

  FeedbackLab.prototype.draw = function () {
    var ctx = this.ctx;
    var w = 900;
    var h = 500;
    var series = this.computeSeries();
    var maxValue = Math.max(this.target * 1.5, Math.max.apply(null, series));
    var minValue = Math.min(0, Math.min.apply(null, series));
    var pad = (maxValue - minValue) * 0.1 || 0.2;
    maxValue += pad;
    minValue -= pad;
    var x0 = 70;
    var y0 = 58;
    var cw = 750;
    var ch = 330;
    var steps = series.length - 1;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, w, h);
    var glow = ctx.createRadialGradient(440, 220, 20, 440, 220, 430);
    glow.addColorStop(0, this.mode === "negative" ? "rgba(120,240,197,0.07)" : "rgba(255,142,168,0.08)");
    glow.addColorStop(1, "rgba(5,8,16,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255,255,255,0.03)";
    MP.roundRect(ctx, x0 - 24, y0 - 30, cw + 48, ch + 96, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.stroke();
    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText((this.mode === "negative" ? "Negative" : "Positive") + " Rückkopplung · Signal über 24 Schritte", x0, y0 - 8);

    for (var g = 0; g <= 4; g++) {
      var yy = y0 + (ch / 4) * g;
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.beginPath();
      ctx.moveTo(x0, yy);
      ctx.lineTo(x0 + cw, yy);
      ctx.stroke();
      ctx.fillStyle = "rgba(168,178,199,0.62)";
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      var value = maxValue - (g / 4) * (maxValue - minValue);
      ctx.fillText(Math.abs(value) > 99 ? "…" : MP.fmt(value, 2), x0 - 8, yy + 3);
      ctx.textAlign = "left";
    }

    var targetY = y0 + ch - ((this.target - minValue) / (maxValue - minValue)) * ch;
    ctx.strokeStyle = "rgba(248,197,107,0.75)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x0, targetY);
    ctx.lineTo(x0 + cw, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(248,197,107,0.9)";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Sollwert", x0 + cw + 24, targetY + 3);
    ctx.textAlign = "left";

    ctx.beginPath();
    for (var p = 0; p < series.length; p++) {
      var px = x0 + (p / steps) * cw;
      var py = y0 + ch - ((series[p] - minValue) / (maxValue - minValue)) * ch;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = this.mode === "negative" ? "#78f0c5" : "#ff8ea8";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    var fill = ctx.createLinearGradient(0, y0, 0, y0 + ch);
    fill.addColorStop(0, this.mode === "negative" ? "rgba(120,240,197,0.16)" : "rgba(255,142,168,0.16)");
    fill.addColorStop(1, "rgba(0,0,0,0)");
    ctx.lineTo(x0 + cw, y0 + ch);
    ctx.lineTo(x0, y0 + ch);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    for (var dot = 0; dot < series.length; dot += 2) {
      var dx = x0 + (dot / steps) * cw;
      var dy = y0 + ch - ((series[dot] - minValue) / (maxValue - minValue)) * ch;
      ctx.beginPath();
      ctx.arc(dx, dy, 2.3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(244,239,228,0.8)";
      ctx.fill();
    }

    ctx.fillStyle = "rgba(168,178,199,0.72)";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Zeitschritte", x0 + cw / 2, y0 + ch + 44);
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(168,178,199,0.82)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("negativ: x(t+1) = x(t) + g · (Ziel − x(t))", x0, y0 + ch + 66);
    ctx.fillText("positiv: x(t+1) = x(t) + g · (x(t) − Ziel)", x0, y0 + ch + 82);
  };

  document.addEventListener("DOMContentLoaded", function () {
    new OpenSystemLab();
    new LogisticLab();
    new FeedbackLab();
  });
})();
