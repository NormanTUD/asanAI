(function () {
  "use strict";

  var MP = window.MP;
  if (!MP) return;

  function LightLab() {
    this.canvas = document.getElementById("light-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.angle = 45;
    this.room = { x: 92, y: 82, w: 380, h: 380 };
    this.span = 88;
    this.windows = { N: true, E: true, S: false, W: false };
    this.bind();
    this.draw();
    this.paintStats();
  }

  LightLab.prototype.bind = function () {
    var self = this;
    var angle = document.getElementById("light-angle");
    var ids = ["light-n", "light-e", "light-s", "light-w"];
    if (angle) {
      angle.addEventListener("input", function () {
        self.angle = Number(angle.value);
        var label = document.getElementById("light-angle-val");
        if (label) label.textContent = String(self.angle) + "°";
        self.draw();
        self.paintStats();
        self.setStatus();
      });
    }
    ids.forEach(function (id) {
      var input = document.getElementById(id);
      if (input) input.addEventListener("change", function () {
        self.readWindows();
        self.draw();
        self.paintStats();
        self.setStatus();
      });
    });
    var one = document.getElementById("light-one");
    var two = document.getElementById("light-two");
    if (one) {
      one.addEventListener("click", function () {
        self.setWindows(false, true, false, false);
        self.setStatus("Ein Fenster auf der Ostseite. Das Licht kommt nur aus einer Richtung – viele Bereiche bleiben im Schatten.");
      });
    }
    if (two) {
      two.addEventListener("click", function () {
        self.setWindows(true, true, false, false);
        self.setStatus("Zwei Fenster auf Nord und Ost. Jetzt kommen die Strahlen aus zwei Richtungen – der Raum bekommt Tiefe.");
      });
    }
    this.readWindows();
    this.setStatus();
  };

  LightLab.prototype.readWindows = function () {
    this.windows.N = !!(document.getElementById("light-n") || {}).checked;
    this.windows.E = !!(document.getElementById("light-e") || {}).checked;
    this.windows.S = !!(document.getElementById("light-s") || {}).checked;
    this.windows.W = !!(document.getElementById("light-w") || {}).checked;
  };

  LightLab.prototype.setWindows = function (n, e, s, w) {
    var values = { "light-n": n, "light-e": e, "light-s": s, "light-w": w };
    Object.keys(values).forEach(function (id) {
      var input = document.getElementById(id);
      if (input) input.checked = values[id];
    });
    this.readWindows();
    this.draw();
    this.paintStats();
  };

  LightLab.prototype.windowCount = function () {
    return (this.windows.N ? 1 : 0) + (this.windows.E ? 1 : 0) + (this.windows.S ? 1 : 0) + (this.windows.W ? 1 : 0);
  };

  LightLab.prototype.compute = function () {
    var n = 44;
    var x0 = this.room.x;
    var y0 = this.room.y;
    var x1 = x0 + this.room.w;
    var y1 = y0 + this.room.h;
    var cx = x0 + this.room.w / 2;
    var cy = y0 + this.room.h / 2;
    var rad = this.angle * Math.PI / 180;
    var ux = Math.cos(rad);
    var uy = -Math.sin(rad);
    var count = this.windowCount();
    var ambient = 0.07 + 0.035 * count;
    var values = [];
    var direct = 0;
    for (var sy = 0; sy < n; sy++) {
      for (var sx = 0; sx < n; sx++) {
        var px = x0 + (sx + 0.5) * this.room.w / n;
        var py = y0 + (sy + 0.5) * this.room.h / n;
        var bestT = Infinity;
        var wall = "";
        var coord = 0;
        if (ux > 0.00001) {
          var te = (x1 - px) / ux;
          if (te > 0 && te < bestT) { bestT = te; wall = "E"; coord = py; }
        } else if (ux < -0.00001) {
          var tw = (x0 - px) / ux;
          if (tw > 0 && tw < bestT) { bestT = tw; wall = "W"; coord = py; }
        }
        if (uy > 0.00001) {
          var ts = (y1 - py) / uy;
          if (ts > 0 && ts < bestT) { bestT = ts; wall = "S"; coord = px; }
        } else if (uy < -0.00001) {
          var tn = (y0 - py) / uy;
          if (tn > 0 && tn < bestT) { bestT = tn; wall = "N"; coord = px; }
        }
        var throughWindow = false;
        if (wall === "N" || wall === "S") {
          throughWindow = Math.abs(coord - cx) < this.span / 2 && this.windows[wall];
        } else if (wall === "E" || wall === "W") {
          throughWindow = Math.abs(coord - cy) < this.span / 2 && this.windows[wall];
        }
        if (throughWindow) direct++;
        values.push(throughWindow ? 1 : ambient);
      }
    }
    return { values: values, n: n, direct: direct / values.length };
  };

  LightLab.prototype.setStatus = function () {
    var node = document.getElementById("light-status");
    if (!node) return;
    var count = this.windowCount();
    if (count === 0) node.textContent = "Keine Öffnung: Der Raum bekommt kein direktes Tageslicht. Das ist ein anderer Kontext, kein Fehler.";
    else if (count === 1) node.textContent = "Ein Fenster: Das Licht kommt aus einer Richtung. Viele Bereiche bleiben im Schatten, der Raum wirkt flacher.";
    else if (count === 2) node.textContent = "Zwei Fenster auf verschiedenen Seiten: Das Licht kommt aus mehreren Richtungen. Das ist der Kern von Muster 159.";
    else node.textContent = "Drei oder vier Fenster: Mehr Licht, aber auch mehr Blendung und Wärmelast. Prüfe, ob die Kräfte noch im Gleichgewicht sind.";
  };

  LightLab.prototype.paintStats = function () {
    var data = this.compute();
    var directEl = document.getElementById("light-direct");
    var evenEl = document.getElementById("light-even");
    var countEl = document.getElementById("light-count");
    var verdictEl = document.getElementById("light-verdict");
    var count = this.windowCount();
    if (directEl) directEl.textContent = MP.fmt(data.direct * 100, 1) + " %";
    if (evenEl) evenEl.textContent = MP.fmt((1 - data.direct) * 100, 0) + " %";
    if (countEl) countEl.textContent = String(count);
    if (verdictEl) verdictEl.textContent = count === 0 ? "keine Öffnung" : count === 1 ? "einseitig" : count === 2 ? "zwei Seiten" : "viele Seiten";
  };

  LightLab.prototype.color = function (value) {
    var stops = [
      [0.05, 8, 14, 28],
      [0.16, 18, 30, 52],
      [0.38, 74, 86, 94],
      [0.68, 196, 158, 92],
      [1, 255, 218, 132]
    ];
    for (var i = 1; i < stops.length; i++) {
      if (value <= stops[i][0]) {
        var p = (value - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
        var r = Math.round(MP.lerp(stops[i - 1][1], stops[i][1], p));
        var g = Math.round(MP.lerp(stops[i - 1][2], stops[i][2], p));
        var b = Math.round(MP.lerp(stops[i - 1][3], stops[i][3], p));
        return "rgb(" + r + "," + g + "," + b + ")";
      }
    }
    return "rgb(255,218,132)";
  };

  LightLab.prototype.draw = function () {
    var ctx = this.ctx;
    var w = 900;
    var h = 560;
    var room = this.room;
    var data = this.compute();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, w, h);
    var glow = ctx.createRadialGradient(280, 270, 20, 280, 270, 400);
    glow.addColorStop(0, "rgba(255,159,178,0.06)");
    glow.addColorStop(1, "rgba(5,8,16,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(244,239,228,0.9)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("Grundriss · direktes Sonnenlicht", room.x - 30, room.y - 30);
    ctx.fillStyle = "rgba(168,178,199,0.72)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("1 Kästchen = ein Messpunkt · top-down", room.x - 30, room.y - 12);

    ctx.fillStyle = "#101827";
    ctx.fillRect(room.x - 9, room.y - 9, room.w + 18, room.h + 18);
    var cell = room.w / data.n;
    for (var y = 0; y < data.n; y++) {
      for (var x = 0; x < data.n; x++) {
        var value = data.values[y * data.n + x];
        ctx.fillStyle = this.color(value);
        ctx.fillRect(room.x + x * cell, room.y + y * cell, cell + 0.4, cell + 0.4);
      }
    }

    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    for (var g = 1; g < 8; g++) {
      ctx.beginPath();
      ctx.moveTo(room.x + (room.w / 8) * g, room.y);
      ctx.lineTo(room.x + (room.w / 8) * g, room.y + room.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(room.x, room.y + (room.h / 8) * g);
      ctx.lineTo(room.x + room.w, room.y + (room.h / 8) * g);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = "#2a3650";
    ctx.lineWidth = 14;
    ctx.strokeRect(room.x - 7, room.y - 7, room.w + 14, room.h + 14);
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1;
    ctx.strokeRect(room.x, room.y, room.w, room.h);

    var cx = room.x + room.w / 2;
    var cy = room.y + room.h / 2;
    var half = this.span / 2;
    this.drawWindow(ctx, cx - half, room.y, this.span, true, this.windows.N);
    this.drawWindow(ctx, room.x + room.w, cy - half, this.span, false, this.windows.E);
    this.drawWindow(ctx, cx - half, room.y + room.h, this.span, true, this.windows.S);
    this.drawWindow(ctx, room.x, cy - half, this.span, false, this.windows.W);

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "rgba(244,239,228,0.64)";
    ctx.lineWidth = 1.5;
    MP.roundRect(ctx, room.x + 130, room.y + 220, 120, 50, 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(room.x + 120, room.y + 245, 19, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(room.x + 270, room.y + 245, 19, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(room.x + 310, room.y + 110, 27, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(room.x + 310, room.y + 137);
    ctx.lineTo(room.x + 310, room.y + 178);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "rgba(244,239,228,0.7)";
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("N", room.x + room.w / 2, room.y - 16);
    ctx.fillText("S", room.x + room.w / 2, room.y + room.h + 30);
    ctx.textAlign = "left";
    ctx.fillText("W", room.x - 28, room.y + room.h / 2);
    ctx.textAlign = "right";
    ctx.fillText("O", room.x + room.w + 28, room.y + room.h / 2);
    ctx.textAlign = "left";

    var rad = this.angle * Math.PI / 180;
    var ux = Math.cos(rad);
    var uy = -Math.sin(rad);
    var sunX = 720 + ux * 34;
    var sunY = 86 + uy * 34;
    ctx.save();
    ctx.shadowColor = "#f8c56b";
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 15, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(248,197,107,0.95)";
    ctx.fill();
    ctx.restore();
    for (var ray = 0; ray < 8; ray++) {
      var a = (ray / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(a) * 22, sunY + Math.sin(a) * 22);
      ctx.lineTo(sunX + Math.cos(a) * 30, sunY + Math.sin(a) * 30);
      ctx.strokeStyle = "rgba(248,197,107,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(248,197,107,0.62)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sunX, sunY);
    ctx.lineTo(sunX - ux * 86, sunY - uy * 86);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sunX - ux * 86, sunY - uy * 86);
    ctx.lineTo(sunX - ux * 78 - uy * 5, sunY - uy * 78 + ux * 5);
    ctx.moveTo(sunX - ux * 86, sunY - uy * 86);
    ctx.lineTo(sunX - ux * 78 + uy * 5, sunY - uy * 78 - ux * 5);
    ctx.stroke();
    ctx.fillStyle = "rgba(168,178,199,0.8)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("Sonnenstand " + this.angle + "°", 636, 150);

    ctx.fillStyle = "rgba(168,178,199,0.82)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("direkt: " + MP.fmt(data.direct * 100, 1) + " %", 636, 196);
    ctx.fillText("Schattenanteil: " + MP.fmt((1 - data.direct) * 100, 0) + " %", 636, 216);
    ctx.fillText("Fenster: " + this.windowCount(), 636, 236);
    ctx.fillStyle = "rgba(248,197,107,0.86)";
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    ctx.fillText(this.windowCount() === 1 ? "einseitig" : this.windowCount() === 2 ? "zwei Seiten" : this.windowCount() === 0 ? "keine Öffnung" : "viele Seiten", 636, 256);
  };

  LightLab.prototype.drawWindow = function (ctx, x, y, length, horizontal, open) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = open ? 10 : 4;
    ctx.strokeStyle = open ? "#f8c56b" : "rgba(255,255,255,0.2)";
    if (open) {
      ctx.shadowColor = "#f8c56b";
      ctx.shadowBlur = 14;
    }
    ctx.beginPath();
    if (horizontal) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + length, y);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + length);
    }
    ctx.stroke();
    ctx.restore();
  };

  var PATTERNS = [
    {
      id: "1", num: 1, name: "Independent Regions", de: "Unabhängige Regionen", x: 180, y: 55,
      context: "Die größte Ebene: Land und Region.", problem: "Zentralisierung erstickt lokale Eigenständigkeit.",
      forces: "Autonomie, Koordination, Ressourcen, Identität.", solution: "Regionen mit eigener Mitte und echter Selbstverwaltung.",
      down: ["12", "14"]
    },
    {
      id: "12", num: 12, name: "Community of 7000", de: "Gemeinschaft von 7000", x: 500, y: 55,
      context: "Regionen, die sich in Gemeinschaften gliedern.", problem: "Zu große Einheiten verlieren Überschaubarkeit.",
      forces: "Nähe, Vielfalt, Verwaltbarkeit, Zugehörigkeit.", solution: "Gemeinschaften, die groß genug für Vielfalt und klein genug für Begegnung sind.",
      down: ["14", "28", "30"]
    },
    {
      id: "14", num: 14, name: "Identifiable Neighborhood", de: "Erkennbares Quartier", x: 820, y: 55,
      context: "Gemeinschaften und Städte.", problem: "Anonyme Wohngebiete haben keine erkennbare Mitte.",
      forces: "Orientierung, Zugehörigkeit, Durchlässigkeit.", solution: "Quartiere mit klarer Grenze, Mitte und eigenem Charakter.",
      down: ["30", "31", "37", "57"]
    },
    {
      id: "28", num: 28, name: "Eccentric Nucleus", de: "Exzentrischer Kern", x: 100, y: 145,
      context: "Quartiere und Gemeinschaften.", problem: "Eine zu perfekte Mitte kann steif und kontrolliert wirken.",
      forces: "Zentrierung, Lebendigkeit, Überraschung.", solution: "Eine Mitte, die nicht geometrisch perfekt, sondern lebendig und leicht versetzt ist.",
      down: ["30", "31"]
    },
    {
      id: "30", num: 30, name: "Activity Nodes", de: "Aktivitätsknoten", x: 300, y: 145,
      context: "Quartiere und öffentliche Räume.", problem: "Einzelne Nutzungen liegen zu weit auseinander, um Synergie zu erzeugen.",
      forces: "Frequenz, Mischung, Ruhe, Erreichbarkeit.", solution: "Knoten, an denen mehrere Aktivitäten zusammenkommen und sich gegenseitig tragen.",
      down: ["31", "61"]
    },
    {
      id: "31", num: 31, name: "Promenade", de: "Promenade", x: 500, y: 145,
      context: "Aktivitätsknoten und Quartiere.", problem: "Wege sind oft nur Verkehrsadern ohne Aufenthaltsqualität.",
      forces: "Bewegung, Verweilen, Sichtbarkeit, Schutz.", solution: "Ein Weg, der selbst zum Ort wird: breit genug, belebt, mit Nischen.",
      down: ["61", "79"]
    },
    {
      id: "57", num: 57, name: "Children in the City", de: "Kinder in der Stadt", x: 700, y: 145,
      context: "Quartiere mit Wohnnutzung.", problem: "Kinder werden aus dem öffentlichen Raum verdrängt.",
      forces: "Sicherheit, Spiel, Aufsicht, Freiheit.", solution: "Stadtstrukturen, in denen Kinder selbstständig und sichtbar unterwegs sein können.",
      down: ["61", "79"]
    },
    {
      id: "61", num: 61, name: "Small Public Squares", de: "Kleine öffentliche Plätze", x: 900, y: 145,
      context: "Quartiere, Promenaden, Aktivitätsknoten.", problem: "Große Plätze sind oft leer und windschnittig; kleine fehlen.",
      forces: "Aufenthalt, Begegnung, Übersicht, Wind.", solution: "Kleine, gut proportionierte Plätze mit Sitzgelegenheiten und umgebenden Nutzungen.",
      down: ["106", "179"]
    },
    {
      id: "37", num: 37, name: "House Cluster", de: "Hausgruppe", x: 100, y: 245,
      context: "Quartiere mit Wohnbebauung.", problem: "Einzelhäuser isolieren; zu große Blöcke anonymisieren.",
      forces: "Nachbarschaft, Privatheit, gemeinsame Fläche.", solution: "Gruppen von Häusern um einen gemeinsamen Hof oder Weg.",
      down: ["79", "106"]
    },
    {
      id: "79", num: 79, name: "Your Own Home", de: "Dein eigenes Zuhause", x: 290, y: 245,
      context: "Hausgruppen und Nachbarschaften.", problem: "Wohnen wird oft als Standardprodukt statt als persönlicher Ort behandelt.",
      forces: "Identität, Schutz, Gemeinschaft, Kosten.", solution: "Ein Zuhause, das man als eigenes erkennt und gestalten kann.",
      down: ["106", "127", "159"]
    },
    {
      id: "106", num: 106, name: "Positive Outdoor Space", de: "Positiver Außenraum", x: 480, y: 245,
      context: "Häuser, Höfe, Plätze, Gärten.", problem: "Außenraum bleibt oft ein Rest zwischen Gebäuden.",
      forces: "Schutz, Ausblick, Zugang, Orientierung.", solution: "Außenräume, die wie Zimmer geformt sind: mit Wänden, Mitte und Öffnung.",
      down: ["127", "159"]
    },
    {
      id: "127", num: 127, name: "Intimacy Gradient", de: "Intimitätsgradient", x: 670, y: 245,
      context: "Wohnungen und Häuser.", problem: "Öffentliche und private Bereiche liegen oft unvermittelt nebeneinander.",
      forces: "Gastlichkeit, Rückzug, Kontrolle, Übergang.", solution: "Eine Abfolge von öffentlich nach privat, mit Übergängen statt harten Schnitten.",
      down: ["159", "179", "180", "188"]
    },
    {
      id: "107", num: 107, name: "Wings of Light", de: "Flügel aus Licht", x: 860, y: 245,
      context: "Gebäude und Gebäudegruppen.", problem: "Tiefe Gebäude bekommen in der Mitte kein Tageslicht.",
      forces: "Tageslicht, Kompaktheit, Orientierung.", solution: "Gebäudeflügel, die schmal genug sind, um von zwei Seiten Licht zu bekommen.",
      down: ["159"]
    },
    {
      id: "159", num: 159, name: "Light on Two Sides of Every Room", de: "Licht auf zwei Seiten", x: 120, y: 345,
      context: "Räume in Häusern und Wohnungen.", problem: "Einseitiges Licht macht Räume flach und Schatten hart.",
      forces: "Tageslicht, Privatheit, Wärme, Kosten, Blendung.", solution: "Fenster auf zwei verschiedenen Seiten, damit Licht aus mehreren Richtungen kommt.",
      down: ["196", "223", "238", "239", "250"]
    },
    {
      id: "179", num: 179, name: "Alcoves", de: "Nischen", x: 320, y: 345,
      context: "Räume und gemeinschaftliche Bereiche.", problem: "Große offene Räume bieten keinen Rückzugsort.",
      forces: "Geborgenheit, Übersicht, Gemeinschaft, Privatheit.", solution: "Kleine Nischen am Rand größerer Räume, die Schutz und Ausblick verbinden.",
      down: ["180", "188", "241"]
    },
    {
      id: "180", num: 180, name: "Window Place", de: "Fensterplatz", x: 520, y: 345,
      context: "Räume mit Fenstern.", problem: "Fenster sind oft nur Öffnungen, keine Orte.",
      forces: "Aussicht, Licht, Sitzen, Geborgenheit.", solution: "Ein Platz direkt am Fenster, der zum Verweilen einlädt.",
      down: ["241", "250"]
    },
    {
      id: "188", num: 188, name: "Bed Alcove", de: "Bettnische", x: 720, y: 345,
      context: "Schlafräume und Wohnungen.", problem: "Betten stehen oft mitten im Raum und wirken ungeschützt.",
      forces: "Schutz, Luft, Licht, Privatheit.", solution: "Eine Nische für das Bett, die Geborgenheit gibt, ohne den Raum zu ersticken.",
      down: ["250"]
    },
    {
      id: "196", num: 196, name: "Corner Windows", de: "Eckfenster", x: 900, y: 345,
      context: "Räume mit zwei Außenwänden.", problem: "Zwei getrennte Fenster können den Raum zerschneiden.",
      forces: "Weite, Licht, Möblierung, Struktur.", solution: "Ein Fenster, das um die Ecke läuft und den Raum öffnet.",
      down: []
    },
    {
      id: "223", num: 223, name: "Deep Reveals", de: "Tiefe Fensterlaibungen", x: 80, y: 455,
      context: "Fenster in dicken Wänden.", problem: "Dünne Fensterrahmen lassen Licht hart und Wände flach wirken.",
      forces: "Lichtführung, Sitzfläche, Wärme, Struktur.", solution: "Tiefe Laibungen, die Licht weich führen und eine Sitzfläche anbieten.",
      down: []
    },
    {
      id: "238", num: 238, name: "Filtered Light", de: "Gefiltertes Licht", x: 225, y: 455,
      context: "Fenster und Räume mit starkem Licht.", problem: "Direkte Sonne kann blenden und Materialien ausbleichen.",
      forces: "Helligkeit, Schutz, Atmosphäre.", solution: "Licht durch Pflanzen, Vorhänge, Gitter oder Glas filtern.",
      down: []
    },
    {
      id: "239", num: 239, name: "Small Panes", de: "Kleine Scheiben", x: 370, y: 455,
      context: "Fenster in Wohnhäusern.", problem: "Große Glasscheiben können kalt und unpersönlich wirken.",
      forces: "Licht, Maßstab, Reparatur, Wärme.", solution: "Kleine Scheiben, die Licht hereinführen und dem Fenster Maßstab geben.",
      down: []
    },
    {
      id: "241", num: 241, name: "Seat Spots", de: "Sitzplätze", x: 515, y: 455,
      context: "Räume, Nischen, Fensterplätze.", problem: "Sitzen ist oft eine nachträgliche Möbelentscheidung.",
      forces: "Bequemlichkeit, Ausblick, Nähe, Bewegung.", solution: "Eingebaute oder klar markierte Sitzplätze an den richtigen Stellen.",
      down: ["250"]
    },
    {
      id: "250", num: 250, name: "Warm Colors", de: "Warme Farben", x: 660, y: 455,
      context: "Innenräume und Details.", problem: "Kalte, neutrale Oberflächen können unpersönlich wirken.",
      forces: "Wärme, Licht, Stimmung, Material.", solution: "Warme Farben, die mit dem Tageslicht und den Materialien zusammenarbeiten.",
      down: ["253"]
    },
    {
      id: "252", num: 252, name: "Pools of Light", de: "Lichtinseln", x: 805, y: 455,
      context: "Räume mit mehreren Lichtquellen.", problem: "Gleichmäßiges Licht kann flach und orientierungslos wirken.",
      forces: "Atmosphäre, Lesbarkeit, Zonierung.", solution: "Lichtinseln, die Bereiche im Raum markieren und Tiefe erzeugen.",
      down: []
    },
    {
      id: "253", num: 253, name: "Things from Your Life", de: "Dinge aus deinem Leben", x: 940, y: 455,
      context: "Wohnungen und persönliche Räume.", problem: "Standardisierte Räume lassen keine persönliche Geschichte zu.",
      forces: "Identität, Ordnung, Erinnerung, Nutzung.", solution: "Dinge, die wirklich zu dir gehören, sichtbar und passend unterbringen.",
      down: []
    }
  ];

  var byId = {};
  PATTERNS.forEach(function (pattern) {
    byId[pattern.id] = pattern;
    pattern.up = [];
    pattern.scale = pattern.y < 100 ? 0 : pattern.y < 200 ? 1 : pattern.y < 300 ? 2 : pattern.y < 400 ? 3 : 4;
  });
  PATTERNS.forEach(function (pattern) {
    pattern.down.forEach(function (id) {
      if (byId[id]) byId[id].up.push(pattern.id);
    });
  });

  function PatternLab() {
    this.svg = document.getElementById("pattern-svg");
    this.card = document.getElementById("pattern-card");
    if (!this.svg || !this.card) return;
    this.active = "159";
    this.trail = ["159"];
    this.bind();
    this.render();
    this.select("159", false);
  }

  PatternLab.prototype.bind = function () {
    var self = this;
    var next = document.getElementById("pattern-next");
    var reset = document.getElementById("pattern-reset");
    if (next) {
      next.addEventListener("click", function () {
        var pattern = byId[self.active];
        if (!pattern || !pattern.down.length) {
          self.select("159", false);
          return;
        }
        self.select(pattern.down[0], true);
      });
    }
    if (reset) {
      reset.addEventListener("click", function () {
        self.select("159", false);
      });
    }
    this.card.addEventListener("click", function (event) {
      var target = event.target.closest("[data-pattern-link]");
      if (!target) return;
      self.select(target.dataset.patternLink, false);
    });
  };

  PatternLab.prototype.render = function () {
    var self = this;
    var ns = "http://www.w3.org/2000/svg";
    this.svg.innerHTML = "";
    var defs = document.createElementNS(ns, "defs");
    defs.innerHTML = '<marker id="pattern-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.22)"></path></marker>';
    this.svg.appendChild(defs);

    var bands = document.createElementNS(ns, "g");
    var labels = ["Region · Stadt", "Quartier", "Haus", "Raum", "Detail"];
    var rows = [55, 145, 245, 345, 455];
    labels.forEach(function (label, index) {
      var text = document.createElementNS(ns, "text");
      text.setAttribute("x", "8");
      text.setAttribute("y", String(rows[index] + 4));
      text.setAttribute("fill", "rgba(168,178,199,0.5)");
      text.setAttribute("font-family", "Inter, system-ui, sans-serif");
      text.setAttribute("font-size", "9");
      text.textContent = label;
      bands.appendChild(text);
      var line = document.createElementNS(ns, "line");
      line.setAttribute("x1", "8");
      line.setAttribute("x2", "990");
      line.setAttribute("y1", String(rows[index] + 18));
      line.setAttribute("y2", String(rows[index] + 18));
      line.setAttribute("stroke", "rgba(255,255,255,0.045)");
      bands.appendChild(line);
    });
    this.svg.appendChild(bands);

    var edgeLayer = document.createElementNS(ns, "g");
    edgeLayer.setAttribute("id", "pattern-edges");
    var nodeLayer = document.createElementNS(ns, "g");
    nodeLayer.setAttribute("id", "pattern-nodes");

    PATTERNS.forEach(function (source) {
      source.down.forEach(function (targetId) {
        var target = byId[targetId];
        if (!target) return;
        var path = document.createElementNS(ns, "path");
        var midX = (source.x + target.x) / 2;
        var midY = (source.y + target.y) / 2 + 12;
        path.setAttribute("d", "M " + source.x + " " + source.y + " Q " + midX + " " + midY + " " + target.x + " " + target.y);
        path.setAttribute("class", "pattern-edge");
        path.dataset.source = source.id;
        path.dataset.target = target.id;
        edgeLayer.appendChild(path);
      });
    });

    PATTERNS.forEach(function (pattern) {
      var group = document.createElementNS(ns, "g");
      group.setAttribute("class", "pattern-node");
      group.setAttribute("tabindex", "0");
      group.setAttribute("role", "button");
      group.setAttribute("aria-label", "Muster " + pattern.num + ": " + pattern.name);
      group.dataset.id = pattern.id;
      var title = document.createElementNS(ns, "title");
      title.textContent = pattern.num + " · " + pattern.name;
      group.appendChild(title);
      var circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", String(pattern.x));
      circle.setAttribute("cy", String(pattern.y));
      circle.setAttribute("r", "19");
      group.appendChild(circle);
      var number = document.createElementNS(ns, "text");
      number.setAttribute("x", String(pattern.x));
      number.setAttribute("y", String(pattern.y + 4));
      number.setAttribute("font-size", "10");
      number.setAttribute("font-weight", "700");
      number.textContent = String(pattern.num);
      group.appendChild(number);
      var label = document.createElementNS(ns, "text");
      label.setAttribute("x", String(pattern.x));
      label.setAttribute("y", String(pattern.y + 34));
      label.setAttribute("font-size", "8");
      label.setAttribute("fill", "rgba(168,178,199,0.82)");
      label.textContent = pattern.de.length > 24 ? pattern.de.slice(0, 22) + "…" : pattern.de;
      group.appendChild(label);
      group.addEventListener("click", function () {
        self.select(pattern.id, false);
      });
      group.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          self.select(pattern.id, false);
        }
      });
      nodeLayer.appendChild(group);
    });

    this.svg.appendChild(edgeLayer);
    this.svg.appendChild(nodeLayer);
  };

  PatternLab.prototype.select = function (id, keepTrail) {
    var pattern = byId[id];
    if (!pattern) return;
    this.active = id;
    if (!keepTrail) this.trail = [id];
    else if (this.trail[this.trail.length - 1] !== id) this.trail.push(id);
    if (this.trail.length > 8) this.trail = this.trail.slice(-8);
    var nodes = this.svg.querySelectorAll(".pattern-node");
    nodes.forEach(function (node) {
      node.classList.toggle("is-active", node.dataset.id === id);
    });
    var edges = this.svg.querySelectorAll(".pattern-edge");
    edges.forEach(function (edge) {
      edge.classList.toggle("is-lit", edge.dataset.source === id || edge.dataset.target === id);
    });
    var up = pattern.up.map(function (upId) {
      return '<button class="btn" type="button" data-pattern-link="' + upId + '">' + byId[upId].num + " · " + byId[upId].de + "</button>";
    }).join("");
    var down = pattern.down.map(function (downId) {
      return '<button class="btn" type="button" data-pattern-link="' + downId + '">' + byId[downId].num + " · " + byId[downId].de + "</button>";
    }).join("");
    var trail = this.trail.map(function (trailId) {
      return byId[trailId].num;
    }).join(" → ");
    this.card.innerHTML =
      '<div class="pattern-card__num">Muster ' + pattern.num + " · " + (pattern.scale === 0 ? "Region / Stadt" : pattern.scale === 1 ? "Quartier" : pattern.scale === 2 ? "Haus" : pattern.scale === 3 ? "Raum" : "Detail") + "</div>" +
      "<h3>" + pattern.name + "</h3>" +
      '<div class="pattern-card__meta">' + pattern.de + "</div>" +
      "<p><strong>Kontext:</strong> " + pattern.context + "</p>" +
      "<p><strong>Problem:</strong> " + pattern.problem + "</p>" +
      "<p><strong>Kräfte:</strong> " + pattern.forces + "</p>" +
      "<p><strong>Lösung:</strong> " + pattern.solution + "</p>" +
      (up ? '<div class="pattern-card__links">' + up + "</div>" : "") +
      (down ? '<div class="pattern-card__links">' + down + "</div>" : "") +
      '<p class="small">Pfad: ' + trail + "</p>";
  };

  document.addEventListener("DOMContentLoaded", function () {
    new LightLab();
    new PatternLab();
  });
})();
