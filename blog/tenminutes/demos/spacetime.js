(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var V = window.LearnSysVisuals;
  if (!V) return;

  if (!document.getElementById("ls-st-style")) {
    var style = document.createElement("style");
    style.id = "ls-st-style";
    style.textContent = ".ls-st-scene{position:relative;width:100%;height:100%;min-height:360px;overflow:hidden;background:var(--tm-paper,#fff)}.ls-st-scene canvas{display:block;width:100%;height:100%}.ls-st-paper{position:absolute;right:10px;top:10px;z-index:4;width:min(260px,42vw);margin:0;background:var(--tm-paper,#fff);border:1px solid var(--tm-line-strong,#b9c8c3);padding:6px;box-shadow:0 8px 24px rgba(0,20,30,.10)}.ls-st-paper a{display:block;color:inherit;text-decoration:none}.ls-st-paper img{display:block;width:100%;height:auto;border:1px solid var(--tm-line,#dbe3e0)}.ls-st-paper figcaption{font:400 8.5px/1.35 'Open Sans',sans-serif;color:var(--tm-muted,#627476);margin-top:5px}.ls-st-paper figcaption a{display:inline;color:var(--tm-petrol,#004b6f);border-bottom:1px dotted currentColor}@media(max-width:640px){.ls-st-paper{width:150px;padding:4px}.ls-st-paper figcaption{font-size:7.5px;line-height:1.3}}";
    document.head.appendChild(style);
  }

  var WORLD = { status: "idle", land: null, waiters: [] };

  function loadWorld(cb) {
    if (WORLD.status === "ready" || WORLD.status === "failed") { cb(); return; }
    WORLD.waiters.push(cb);
    if (WORLD.status === "loading") return;
    WORLD.status = "loading";
    function done(land) {
      WORLD.land = land;
      WORLD.status = land ? "ready" : "failed";
      var waiters = WORLD.waiters.slice();
      WORLD.waiters.length = 0;
      for (var i = 0; i < waiters.length; i++) {
        try { waiters[i](); } catch (e) {}
      }
    }
    if (!window.fetch) { done(null); return; }
    window.fetch("../atlas_data/world.json", { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("http");
        return res.json();
      })
      .then(function (json) {
        done(json && json.land && json.land.length ? json.land : null);
      })
      .catch(function () { done(null); });
  }

  var CITIES = [
    { name: "Paris", lat: 48.8566, lon: 2.3522, label: [7, -8, "left"] },
    { name: "Berlin", lat: 52.5200, lon: 13.4050 },
    { name: "London", lat: 51.5074, lon: -0.1278 },
    { name: "Rome", lat: 41.9028, lon: 12.4964 },
    { name: "Madrid", lat: 40.4168, lon: -3.7038 },
    { name: "Vienna", lat: 48.2082, lon: 16.3738 },
    { name: "New York", lat: 40.7128, lon: -74.0060, label: [-7, -8, "right"] },
    { name: "Tokyo", lat: 35.6762, lon: 139.6503, label: [-7, -8, "right"] },
    { name: "Sydney", lat: -33.8688, lon: 151.2093, label: [-7, 9, "right"] },
    { name: "Cairo", lat: 30.0444, lon: 31.2357 },
    { name: "Cape Town", lat: -33.9249, lon: 18.4241, label: [7, 9, "left"] },
    { name: "Buenos Aires", lat: -34.6037, lon: -58.3816 },
    { name: "Moscow", lat: 55.7558, lon: 37.6173 },
    { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
    { name: "Beijing", lat: 39.9042, lon: 116.4074 },
    { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
    { name: "Mexico City", lat: 19.4326, lon: -99.1332 },
    { name: "Toronto", lat: 43.6532, lon: -79.3832 },
    { name: "Singapore", lat: 1.3521, lon: 103.8198 },
    { name: "Nairobi", lat: -1.2921, lon: 36.8219 }
  ];

  var FIGURES = [
    { name: "Ada Lovelace", year: 1852, pred: 1850, label: [-7, 9, "right"] },
    { name: "Charles Babbage", year: 1871, pred: 1874 },
    { name: "Alan Turing", year: 1954, pred: 1951, label: [7, 9, "left"] },
    { name: "Albert Einstein", year: 1955, pred: 1957, label: [-7, -8, "right"] },
    { name: "Marie Curie", year: 1934, pred: 1937 },
    { name: "Isaac Newton", year: 1727, pred: 1724, label: [7, -7, "left"] },
    { name: "Galileo Galilei", year: 1642, pred: 1646 },
    { name: "Wolfgang Amadeus Mozart", year: 1791, pred: 1789 },
    { name: "Ludwig van Beethoven", year: 1827, pred: 1824 },
    { name: "William Shakespeare", year: 1616, pred: 1613, label: [7, 9, "left"] },
    { name: "Charles Darwin", year: 1882, pred: 1879 },
    { name: "Nikola Tesla", year: 1943, pred: 1946 },
    { name: "Benjamin Franklin", year: 1790, pred: 1787 },
    { name: "Leonhard Euler", year: 1783, pred: 1786 },
    { name: "Immanuel Kant", year: 1804, pred: 1801 }
  ];

  function predictedPlace(place) {
    var jlat = Math.sin(place.lon * 1.7 + place.lat) * 0.7;
    var jlon = Math.cos(place.lat * 1.3 - place.lon) * 0.9;
    return { lat: place.lat + jlat, lon: place.lon + jlon };
  }

  function fmtCoord(lat, lon) {
    return Math.abs(lat).toFixed(1) + "°" + (lat >= 0 ? "N" : "S") + ", " + Math.abs(lon).toFixed(1) + "°" + (lon >= 0 ? "E" : "W");
  }

  var NEURONS = [
    { label: ["Raum 1", "Space 1"], color: "green", values: [0.88, 0.72, 0.18, 0.22, 0.12] },
    { label: ["Raum 2", "Space 2"], color: "green", values: [0.62, 0.84, 0.24, 0.20, 0.18] },
    { label: ["Zeit 1", "Time 1"], color: "gold", values: [0.16, 0.20, 0.86, 0.68, 0.54] },
    { label: ["Zeit 2", "Time 2"], color: "gold", values: [0.22, 0.14, 0.62, 0.82, 0.78] }
  ];

  function spacetimeScene(root, api) {
    var DE = api.lang === "de";
    var C = api.colors();
    var LINE_STRONG = C.line;
    var PAPER2 = C.paper;
    var host = document.createElement("div");
    host.className = "ls-st-scene";
    var canvas = document.createElement("canvas");
    canvas.className = "ls-canvas";
    canvas.setAttribute("role", "img");
    host.appendChild(canvas);
    var paperFig = document.createElement("figure");
    paperFig.className = "ls-st-paper";
    var paperSrc = "../image.php?f=gurnee-tegmark-world.png&w=720&q=85&fmt=jpg";
    var paperBig = "../image.php?f=gurnee-tegmark-world.png&w=1800&q=90&fmt=jpg";
    paperFig.innerHTML = '<a href="' + paperBig + '" target="_blank" rel="noopener"><img src="' + paperSrc + '" alt="' + (DE ? "Weltkarte der aus Llama-2-70B-Aktivierungen gelesenen Koordinaten, Gurnee und Tegmark 2023, Abbildung 10" : "World map of coordinates read from Llama-2-70B activations, Gurnee and Tegmark 2023, Figure 10") + '"></a><figcaption>' + (DE
      ? 'Gurnee &amp; Tegmark (2023), Abb. 10: Weltkarte aus gelernten Breiten-/Längengrad-Richtungen. Lizenz: <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Quelle: <a href="https://arxiv.org/abs/2310.02207" target="_blank" rel="noopener">arXiv:2310.02207</a>.'
      : 'Gurnee &amp; Tegmark (2023), Fig. 10: world map from learned latitude/longitude directions. License: <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Source: <a href="https://arxiv.org/abs/2310.02207" target="_blank" rel="noopener">arXiv:2310.02207</a>.') + '</figcaption>';
    host.appendChild(paperFig);
    root.appendChild(host);
    var ctx = canvas.getContext("2d");
    var W = 1, H = 1;
    var mode = "space";
    var hits = [];
    var sel = { city: -1, figure: -1, neuron: -1 };
    var alive = true;
    var ARIA = {
      space: DE
        ? "Schematische Weltkarte mit Städten und einem linearen Probe für Koordinaten"
        : "Schematic world map with cities and a linear probe for coordinates",
      time: DE
        ? "Streudiagramm wahrer Jahre gegen die Vorhersage aus x mit Diagonale"
        : "Scatter plot of true years against predictions from x with a diagonal",
      neurons: DE
        ? "Schematische Heatmap von Raum- und Zeit-Neuronen und ihre Ausrichtung zur Probe-Richtung"
        : "Schematic heatmap of space and time neurons and their alignment with the probe direction"
    };

    function txt(c, s, x, y, o) {
      var opt = o || {};
      var size = typeof opt.size === "number" ? opt.size : 11;
      V.label(c, s, x, y, {
        size: size,
        font: opt.font || '400 ' + size + 'px "Open Sans", "Segoe UI", sans-serif',
        color: opt.color || C.muted,
        align: opt.align || "left",
        bg: opt.bg === undefined ? false : opt.bg,
        bgAlpha: opt.bgAlpha,
        alpha: opt.alpha
      });
    }

    function head(c, s, x, y, o) {
      var opt = o || {};
      var size = typeof opt.size === "number" ? opt.size : 24;
      txt(c, s, x, y, {
        size: size,
        font: '700 ' + size + 'px "Barlow", "Open Sans", sans-serif',
        color: opt.color || C.ink,
        align: opt.align || "left",
        bg: opt.bg
      });
    }

    function accent(c, x, y, w) {
      c.strokeStyle = C.gold;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + w, y);
      c.stroke();
    }

    function padFor() {
      return Math.max(16, Math.min(28, W * 0.035));
    }

    function header(c, title, sub) {
      var pad = padFor();
      var size = Math.min(26, Math.max(18, W * 0.034));
      head(c, title, pad, 27, { size: size });
      txt(c, sub, pad, 49, { size: W < 620 ? 10 : 11, color: C.muted });
      accent(c, pad, 63, 38);
      return 78;
    }

    function footer(c) {
      var pad = padFor();
      txt(c, "Gurnee & Tegmark (2023) · arXiv:2310.02207", pad, H - 10, { size: 8, color: C.muted });
      txt(c, DE ? "schematisch" : "schematic", W - pad, H - 10, { align: "right", size: 8, color: C.muted });
    }

    function drawBackground(c) {
      c.fillStyle = C.paper;
      c.fillRect(0, 0, W, H);
      var g = c.createRadialGradient(W * 0.82, H * 0.12, 0, W * 0.82, H * 0.12, Math.max(W, H) * 0.9);
      g.addColorStop(0, V.alpha(C.green, 0.045));
      g.addColorStop(0.45, V.alpha(C.sky, 0.025));
      g.addColorStop(1, V.alpha(C.paper, 0));
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      c.strokeStyle = V.alpha(C.line, 0.75);
      c.lineWidth = 1;
      c.strokeRect(0.5, 0.5, W - 1, H - 1);
    }

    function drawLand(c, mx, my, mw, mh) {
      var land = WORLD.land;
      if (!land || !land.length) return;
      c.save();
      c.beginPath();
      for (var i = 0; i < land.length; i++) {
        var poly = land[i];
        for (var r = 0; r < poly.length; r++) {
          var ring = poly[r];
          if (!ring || !ring.length) continue;
          c.moveTo(mx + (ring[0][0] + 180) / 360 * mw, my + (90 - ring[0][1]) / 180 * mh);
          for (var k = 1; k < ring.length; k++) {
            c.lineTo(mx + (ring[k][0] + 180) / 360 * mw, my + (90 - ring[k][1]) / 180 * mh);
          }
          c.closePath();
        }
      }
      c.fillStyle = V.alpha(C.petrol, 0.055);
      c.fill("evenodd");
      c.strokeStyle = V.alpha(C.petrol, 0.20);
      c.lineWidth = 0.6;
      c.stroke();
      c.restore();
    }

    function drawGraticule(c, mx, my, mw, mh) {
      var lon, lat, x, y;
      c.save();
      c.lineWidth = 1;
      for (lon = -180; lon <= 180; lon += 30) {
        x = mx + (lon + 180) / 360 * mw;
        c.strokeStyle = V.alpha(C.line, lon === 0 ? 0.85 : 0.42);
        c.beginPath();
        c.moveTo(x, my);
        c.lineTo(x, my + mh);
        c.stroke();
      }
      for (lat = -90; lat <= 90; lat += 30) {
        y = my + (90 - lat) / 180 * mh;
        c.strokeStyle = V.alpha(C.line, lat === 0 ? 0.85 : 0.42);
        c.beginPath();
        c.moveTo(mx, y);
        c.lineTo(mx + mw, y);
        c.stroke();
      }
      c.strokeStyle = V.alpha(LINE_STRONG, 0.75);
      c.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
      c.restore();
    }

    function drawSpace(c) {
      var pad = padFor();
      var top = header(
        c,
        DE ? "Wo liegt Paris im Modell?" : "Where is Paris in the model?",
        DE ? "Probe liest lat/lon aus x · Klicke eine Stadt." : "probe reads lat/lon from x · click a city."
      );
      var foot = 58;
      var availW = W - 2 * pad;
      var availH = H - top - foot;
      var mw = Math.min(availW, availH * 2);
      var mh = mw / 2;
      var mx = (W - mw) / 2;
      var my = top + Math.max(0, (availH - mh) / 2);

      drawGraticule(c, mx, my, mw, mh);
      drawLand(c, mx, my, mw, mh);

      for (var i = 0; i < CITIES.length; i++) {
        var city = CITIES[i];
        var x = mx + (city.lon + 180) / 360 * mw;
        var y = my + (90 - city.lat) / 180 * mh;
        var isSel = i === sel.city;
        hits.push({ x: x, y: y, kind: "city", i: i, r: 15 });
        if (isSel) {
          c.fillStyle = V.alpha(C.gold, 0.16);
          c.beginPath();
          c.arc(x, y, 12, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = C.gold;
          c.beginPath();
          c.arc(x, y, 4.8, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = V.alpha(C.paper, 0.95);
          c.lineWidth = 1.5;
          c.stroke();
        } else if (city.label) {
          c.fillStyle = V.alpha(C.green, 0.13);
          c.beginPath();
          c.arc(x, y, 7, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = C.green;
          c.beginPath();
          c.arc(x, y, 3.4, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = V.alpha(C.paper, 0.95);
          c.lineWidth = 1.4;
          c.stroke();
        } else {
          c.fillStyle = V.alpha(C.petrol, 0.58);
          c.beginPath();
          c.arc(x, y, 2.1, 0, Math.PI * 2);
          c.fill();
        }
      }

      for (var j = 0; j < CITIES.length; j++) {
        var place = CITIES[j];
        var isSelLabel = j === sel.city;
        if (!place.label && !isSelLabel) continue;
        var lx = mx + (place.lon + 180) / 360 * mw + (place.label ? place.label[0] : 8);
        var ly = my + (90 - place.lat) / 180 * mh + (place.label ? place.label[1] : -8);
        txt(c, place.name, lx, ly, {
          size: isSelLabel ? 10 : (W < 620 ? 8.8 : 9.6),
          font: (isSelLabel ? '700 ' : '600 ') + (isSelLabel ? 10 : (W < 620 ? 8.8 : 9.6)) + 'px "Open Sans", sans-serif',
          color: isSelLabel ? C.gold : C.ink,
          align: place.label ? place.label[2] : "left"
        });
      }

      var fy = my + mh + 18;
      if (sel.city >= 0) {
        var chosen = CITIES[sel.city];
        var pred = predictedPlace(chosen);
        txt(c, chosen.name, pad, fy, { size: 11.5, display: true, color: C.ink });
        txt(c, (DE ? "wahr " : "true ") + fmtCoord(chosen.lat, chosen.lon), pad, fy + 15, { size: 9, color: C.muted });
        txt(c, (DE ? "Probe " : "probe ") + fmtCoord(pred.lat, pred.lon), pad + (W < 620 ? 138 : 150), fy + 15, { size: 9, color: C.gold });
      } else {
        txt(c, "w · x → lat/lon", pad, fy, { size: 11, color: C.petrol, font: '600 11px "Open Sans", sans-serif' });
        txt(c, DE ? "Klicke eine Stadt." : "Click a city.", pad, fy + 16, { size: 8.5, color: C.muted });
      }
      txt(c, "Llama-2-70B · R² = 0.911", W - pad, fy, {
        align: "right",
        size: W < 620 ? 9.5 : 10.5,
        color: C.ink,
        font: '600 ' + (W < 620 ? 9.5 : 10.5) + 'px "Open Sans", sans-serif'
      });
      footer(c);
    }

    function drawTime(c) {
      var pad = padFor();
      var top = header(
        c,
        DE ? "Welches Jahr steckt in x?" : "Which year is in x?",
        DE ? "Wahres Jahr vs. x · Klicke eine Person." : "true year vs. x · click a person."
      );
      var MINY = 1500, MAXY = 2020;
      var availW = W - 2 * pad;
      var availH = H - top - 64;
      var wide = W >= 760;
      var side = Math.min(availH, wide ? availW * 0.66 : availW);
      if (side < 120) side = Math.max(120, Math.min(availW, availH));
      var x0 = wide ? pad : (W - side) / 2;
      var y0 = top + Math.max(0, (availH - side) / 2);
      var left = W < 620 ? 38 : 46;
      var plotL = x0 + left;
      var plotR = x0 + side - 12;
      var plotT = y0 + 10;
      var plotB = y0 + side - 34;

      function tx(year) { return plotL + (year - MINY) / (MAXY - MINY) * (plotR - plotL); }
      function ty(year) { return plotB - (year - MINY) / (MAXY - MINY) * (plotB - plotT); }

      var t, x, y;
      for (t = 1500; t <= 2000; t += 100) {
        x = tx(t);
        y = ty(t);
        c.strokeStyle = V.alpha(C.line, 0.38);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x, plotT);
        c.lineTo(x, plotB);
        c.moveTo(plotL, y);
        c.lineTo(plotR, y);
        c.stroke();
      }

      c.save();
      c.setLineDash([5, 5]);
      c.strokeStyle = V.alpha(LINE_STRONG, 0.95);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(tx(MINY), ty(MINY));
      c.lineTo(tx(MAXY), ty(MAXY));
      c.stroke();
      c.restore();
      txt(c, "x = y", tx(1875) + 5, ty(1875) - 5, { size: 8.5, color: C.muted });

      c.strokeStyle = V.alpha(LINE_STRONG, 0.85);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(plotL, plotT);
      c.lineTo(plotL, plotB);
      c.lineTo(plotR, plotB);
      c.stroke();

      for (t = 1500; t <= 2000; t += 100) {
        x = tx(t);
        y = ty(t);
        c.strokeStyle = V.alpha(LINE_STRONG, 0.8);
        c.beginPath();
        c.moveTo(x, plotB);
        c.lineTo(x, plotB + 4);
        c.moveTo(plotL - 4, y);
        c.lineTo(plotL, y);
        c.stroke();
        txt(c, String(t), x, plotB + 15, { align: "center", size: 8, color: C.muted });
        txt(c, String(t), plotL - 7, y, { align: "right", size: 8, color: C.muted });
      }

      txt(c, DE ? "wahres Jahr" : "true year", (plotL + plotR) / 2, plotB + 28, {
        align: "center",
        size: 9.5,
        color: C.muted
      });
      c.save();
      c.translate(x0 + 13, (plotT + plotB) / 2);
      c.rotate(-Math.PI / 2);
      txt(c, DE ? "Jahr aus x" : "year from x", 0, 0, { align: "center", size: 9.5, color: C.muted });
      c.restore();

      for (var i = 0; i < FIGURES.length; i++) {
        var fig = FIGURES[i];
        x = tx(fig.year);
        y = ty(fig.pred);
        c.strokeStyle = V.alpha(LINE_STRONG, 0.34);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x, ty(fig.year));
        c.lineTo(x, y);
        c.stroke();
        var isSelFig = i === sel.figure;
        hits.push({ x: x, y: y, kind: "figure", i: i, r: 13 });
        if (isSelFig) {
          c.fillStyle = V.alpha(C.gold, 0.18);
          c.beginPath();
          c.arc(x, y, 11, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = C.gold;
          c.lineWidth = 1.6;
          c.stroke();
        }
        if (fig.label || isSelFig) {
          c.fillStyle = isSelFig ? C.gold : V.alpha(C.gold, 0.16);
          c.beginPath();
          c.arc(x, y, isSelFig ? 5.2 : 6.5, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = C.gold;
          c.beginPath();
          c.arc(x, y, 3.8, 0, Math.PI * 2);
          c.fill();
        } else {
          c.fillStyle = V.alpha(C.blue, 0.78);
          c.beginPath();
          c.arc(x, y, 3.1, 0, Math.PI * 2);
          c.fill();
        }
        c.strokeStyle = V.alpha(C.paper, 0.92);
        c.lineWidth = 1.1;
        c.beginPath();
        c.arc(x, y, (fig.label || isSelFig) ? 3.8 : 3.1, 0, Math.PI * 2);
        c.stroke();
      }

      for (var j = 0; j < FIGURES.length; j++) {
        var mark = FIGURES[j];
        var isSelMark = j === sel.figure;
        if (!mark.label && !isSelMark) continue;
        txt(c, mark.name, tx(mark.year) + (mark.label ? mark.label[0] : 8), ty(mark.pred) + (mark.label ? mark.label[1] : -8), {
          size: isSelMark ? 9.6 : (W < 620 ? 8.4 : 9.2),
          font: (isSelMark ? '700 ' : '600 ') + (isSelMark ? 9.6 : (W < 620 ? 8.4 : 9.2)) + 'px "Open Sans", sans-serif',
          color: isSelMark ? C.gold : C.ink,
          align: mark.label ? mark.label[2] : "left"
        });
      }

      c.fillStyle = V.alpha(C.blue, 0.78);
      c.beginPath();
      c.arc(plotR - 8, plotT + 6, 3.1, 0, Math.PI * 2);
      c.fill();
      txt(c, DE ? "Personen" : "figures", plotR, plotT + 6, { align: "right", size: 8.5, color: C.muted });

      var cardX = x0 + side + Math.max(20, pad);
      var cardW = Math.min(250, W - pad - cardX);
      if (wide && cardW > 160) {
        var cardY = y0 + 8;
        var cardH = 188;
        c.fillStyle = V.alpha(PAPER2, 0.55);
        c.fillRect(cardX, cardY, cardW, cardH);
        c.strokeStyle = V.alpha(C.line, 0.9);
        c.lineWidth = 1;
        c.strokeRect(cardX + 0.5, cardY + 0.5, cardW - 1, cardH - 1);
        head(c, "Llama-2-70B", cardX + 14, cardY + 25, { size: 16 });
        txt(c, DE ? "historische Personen" : "historical figures", cardX + 14, cardY + 44, { size: 9.5, color: C.muted });
        accent(c, cardX + 14, cardY + 58, 28);
        head(c, "R² = 0.835", cardX + 14, cardY + 88, { size: 27, color: C.petrol });
        txt(c, DE ? "linearer Ridge-Probe" : "linear ridge probe", cardX + 14, cardY + 108, { size: 9, color: C.muted });
        if (sel.figure >= 0) {
          var chosenFig = FIGURES[sel.figure];
          txt(c, chosenFig.name, cardX + 14, cardY + 128, { size: 9.5, color: C.ink, font: '600 9.5px "Open Sans", sans-serif' });
          txt(c, (DE ? "wahr " : "true ") + chosenFig.year + " · " + (DE ? "Probe " : "probe ") + chosenFig.pred, cardX + 14, cardY + 144, { size: 8.5, color: C.muted });
          txt(c, "Δ " + Math.abs(chosenFig.year - chosenFig.pred) + " " + (DE ? "Jahre" : "years"), cardX + 14, cardY + 158, { size: 8.5, color: C.gold });
          txt(c, "Gurnee & Tegmark (2023)", cardX + 14, cardY + 175, { size: 8.2, color: C.muted });
        } else {
          txt(c, "Gurnee & Tegmark (2023)", cardX + 14, cardY + 128, { size: 8.2, color: C.muted });
          txt(c, DE ? "Klicke eine Person." : "Click a person.", cardX + 14, cardY + 144, { size: 8, color: C.muted });
          txt(c, DE ? "schematisch" : "schematic", cardX + 14, cardY + 160, { size: 8, color: C.muted });
        }
      } else {
        txt(c, DE ? "Llama-2-70B · R² = 0.835 · historische Personen" : "Llama-2-70B · R² = 0.835 · historical figures", W / 2, H - 28, {
          align: "center",
          size: W < 620 ? 9.4 : 10.2,
          color: C.ink,
          font: '600 ' + (W < 620 ? 9.4 : 10.2) + 'px "Open Sans", sans-serif'
        });
        if (sel.figure >= 0) {
          var fNarrow = FIGURES[sel.figure];
          txt(c, fNarrow.name + " · " + fNarrow.year + " → " + fNarrow.pred + " (Δ" + Math.abs(fNarrow.year - fNarrow.pred) + ")", W / 2, H - 44, {
            align: "center", size: 9, color: C.gold
          });
        } else {
          txt(c, DE ? "Klicke eine Person." : "Click a person.", W / 2, H - 44, { align: "center", size: 9, color: C.muted });
        }
      }
      footer(c);
    }

    function drawNeurons(c) {
      var pad = padFor();
      var top = header(
        c,
        DE ? "Eine Richtung für alle?" : "One direction for all?",
        DE ? "Raum/Zeit-Neuronen · Klicke eine Zeile." : "space/time neurons · click a row."
      );
      var cols = DE ? ["Städte", "Landmarken", "Personen", "Kunst", "Schlagzeilen"] : ["Cities", "Landmarks", "People", "Art", "Headlines"];
      var availW = W - 2 * pad;
      var availH = H - top - 64;
      var wide = W >= 680;
      var heatW = wide ? Math.min(W * 0.55, 520) : availW;
      var heatH = wide ? Math.min(availH, 232) : Math.min(availH * 0.44, 196);
      var hx = pad;
      var hy = top + (wide ? Math.max(0, (availH - heatH) / 2 - 6) : 0);
      var gutter = W < 620 ? 48 : 58;
      var headH = 24;
      var gx = hx + gutter;
      var gy = hy + headH;
      var cellW = (heatW - gutter) / cols.length;
      var cellH = Math.max(18, (heatH - headH) / NEURONS.length);

      for (var cix = 0; cix < cols.length; cix++) {
        txt(c, cols[cix], gx + cellW * (cix + 0.5), gy - 10, {
          align: "center",
          size: W < 620 ? 7.6 : 8.4,
          color: C.muted
        });
      }

      for (var r = 0; r < NEURONS.length; r++) {
        var row = NEURONS[r];
        var rowColor = row.color === "green" ? C.green : C.gold;
        var isSelRow = r === sel.neuron;
        hits.push({ x: gx, y: gy + r * cellH, w: cellW * cols.length, h: cellH, kind: "neuron", i: r, rect: true });
        txt(c, DE ? row.label[0] : row.label[1], gx - 8, gy + cellH * (r + 0.5), {
          align: "right",
          size: W < 620 ? 8 : 8.8,
          color: isSelRow ? C.gold : C.muted
        });
        var maxCol = 0;
        for (var m = 1; m < row.values.length; m++) {
          if (row.values[m] > row.values[maxCol]) maxCol = m;
        }
        for (var col = 0; col < row.values.length; col++) {
          var v = row.values[col];
          c.fillStyle = V.mix(C.paper, rowColor, 0.08 + 0.82 * v);
          c.fillRect(gx + col * cellW, gy + r * cellH, cellW + 0.4, cellH + 0.4);
          c.strokeStyle = V.alpha(C.paper, 0.55);
          c.lineWidth = 0.5;
          c.strokeRect(gx + col * cellW + 0.25, gy + r * cellH + 0.25, cellW - 0.5, cellH - 0.5);
          if (col === maxCol) {
            c.strokeStyle = V.alpha(C.ink, 0.78);
            c.lineWidth = 1.4;
            c.strokeRect(gx + col * cellW + 1, gy + r * cellH + 1, cellW - 2, cellH - 2);
          }
        }
        if (isSelRow) {
          c.strokeStyle = C.gold;
          c.lineWidth = 2;
          c.strokeRect(gx - 1, gy + r * cellH - 1, cellW * cols.length + 2, cellH + 2);
        }
      }

      c.strokeStyle = V.alpha(LINE_STRONG, 0.8);
      c.lineWidth = 1;
      c.strokeRect(gx + 0.5, gy + 0.5, cellW * cols.length - 1, cellH * NEURONS.length - 1);

      var ax, ay, aw, ah, cx, cy, R;
      if (wide) {
        ax = pad + heatW + 26;
        aw = W - pad - ax;
        ah = Math.min(availH, 280);
        ay = top + Math.max(0, (availH - ah) / 2);
        cx = ax + aw / 2;
        cy = ay + ah * 0.40;
        R = Math.min(aw * 0.34, ah * 0.34, 92);
      } else {
        ax = pad;
        aw = availW;
        ay = hy + heatH + 14;
        ah = Math.max(96, H - 64 - ay);
        cx = ax + aw / 2;
        cy = ay + ah * 0.34;
        R = Math.min(aw * 0.24, ah * 0.34, 76);
      }

      var ox = cx - R * 0.62;
      var oy = cy + R * 0.44;
      var angle = -0.58;
      var probeLen = R * 1.52;
      var offsets = [-0.20, -0.09, 0.08, 0.18];
      var lengths = [0.92, 0.86, 0.94, 0.88];
      var neuronColors = [C.green, C.green, C.gold, C.gold];

      c.save();
      c.setLineDash([3, 5]);
      c.strokeStyle = V.alpha(C.line, 0.72);
      c.lineWidth = 1;
      c.beginPath();
      c.arc(ox, oy, probeLen * 0.92, angle - 0.45, angle + 0.42);
      c.stroke();
      c.restore();

      for (var n = 0; n < offsets.length; n++) {
        var a = angle + offsets[n];
        var len = probeLen * lengths[n];
        var ex = ox + Math.cos(a) * len;
        var ey = oy + Math.sin(a) * len;
        V.arrow(c, ox, oy, ex, ey, V.alpha(neuronColors[n], 0.55), 1.2, 4.5);
        c.fillStyle = V.alpha(neuronColors[n], 0.78);
        c.beginPath();
        c.arc(ex, ey, 2.2, 0, Math.PI * 2);
        c.fill();
      }

      var px = ox + Math.cos(angle) * probeLen;
      var py = oy + Math.sin(angle) * probeLen;
      V.arrow(c, ox, oy, px, py, C.petrol, 2.4, 9);
      txt(c, "w", px + 5, py - 7, {
        size: 12,
        font: '700 12px "Barlow", "Open Sans", sans-serif',
        color: C.petrol
      });

      var noteY = oy + R * 0.75;
      if (noteY > ay + ah - 34) noteY = ay + ah - 34;
      if (noteY < oy + 18) noteY = oy + 18;
      txt(c, DE ? "einzelne Neuronen zeigen in dieselbe Richtung" : "individual neurons point in the same direction", cx, noteY, {
        align: "center",
        size: W < 620 ? 9.6 : 10.6,
        font: '700 ' + (W < 620 ? 9.6 : 10.6) + 'px "Barlow", "Open Sans", sans-serif',
        color: C.ink
      });
      txt(c, DE ? "untere Schranke · dekodierbar ≠ kausal genutzt" : "lower bound · decodable ≠ causally used", cx, noteY + 15, {
        align: "center",
        size: 8.4,
        color: C.muted
      });
      footer(c);
    }

    function draw() {
      if (!W || !H || !alive) return;
      hits = [];
      C = api.colors();
      LINE_STRONG = C.lineStrong || C.line;
      PAPER2 = C.paper2 || C.paper;
      ctx.clearRect(0, 0, W, H);
      drawBackground(ctx);
      if (mode === "time") drawTime(ctx);
      else if (mode === "neurons") drawNeurons(ctx);
      else drawSpace(ctx);
    }

    function fit() {
      var r = api.fit(canvas, host);
      W = r.w;
      H = r.h;
      ctx = r.ctx;
      draw();
    }

    function setMode(next) {
      var m = next === "time" || next === "neurons" || next === "space" ? next : "space";
      if (m === mode && canvas.getAttribute("aria-label")) return;
      mode = m;
      paperFig.hidden = mode !== "space";
      canvas.setAttribute("aria-label", ARIA[mode]);
      draw();
    }

    function onTheme() { draw(); }

    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { fit(); });
      ro.observe(host);
    }
    window.addEventListener("resize", fit);
    window.addEventListener("tm:theme", onTheme);
    canvas.setAttribute("aria-label", ARIA[mode]);

    function hitAt(x, y) {
      var best = null, bestD = 1e9;
      for (var i = 0; i < hits.length; i++) {
        var h = hits[i];
        if (h.rect) {
          if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h;
        } else {
          var d = Math.hypot(h.x - x, h.y - y);
          if (d < bestD) { bestD = d; best = h; }
        }
      }
      if (best && bestD <= (best.r || 14)) return best;
      return null;
    }

    canvas.addEventListener("click", function (e) {
      var r = canvas.getBoundingClientRect();
      var h = hitAt(e.clientX - r.left, e.clientY - r.top);
      if (!h) return;
      sel[h.kind] = sel[h.kind] === h.i ? -1 : h.i;
      draw();
    });

    canvas.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      canvas.style.cursor = hitAt(e.clientX - r.left, e.clientY - r.top) ? "pointer" : "";
    });

    fit();
    loadWorld(function () { if (alive) draw(); });

    return {
      update: function (state) {
        setMode(state && state.mode ? state.mode : "space");
      },
      resize: fit,
      destroy: function () {
        alive = false;
        window.removeEventListener("resize", fit);
        window.removeEventListener("tm:theme", onTheme);
        if (window.ResizeObserver && ro) ro.disconnect();
        host.remove();
      }
    };
  }

  core.register("spacetime", spacetimeScene);
})();
