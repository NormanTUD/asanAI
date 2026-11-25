(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function meadowScene(root, api) {
    var DE = api.lang === "de";
    var WORDS = DE ? ["Hund", "Katze", "Baum", "Haus", "Auto", "Buch", "Maus", "Lampe", "Blume", "Stein", "Tisch", "Stuhl", "Wasser", "Feuer", "Nacht", "Sonne", "Regen", "Mond", "Kaffee", "Stern", "Fluss", "Berg", "Vogel", "Fisch", "Milch", "Zucker", "Tür", "Fenster", "Brücke", "Feld", "Küche", "Garten", "Schiff", "Uhr", "Straße", "Stadt", "Brot", "Apfel", "Tee", "Hut", "Glocke"] : ["Dog", "Cat", "Tree", "House", "Car", "Book", "Mouse", "Lamp", "Flower", "Stone", "Table", "Chair", "Water", "Fire", "Night", "Sun", "Rain", "Moon", "Coffee", "Star", "River", "Mountain", "Bird", "Fish", "Milk", "Sugar", "Door", "Window", "Bridge", "Field", "Kitchen", "Garden", "Ship", "Clock", "Road", "City", "Bread", "Apple", "Tea", "Hat", "Bell"];
    var PALETTE = ["#63a44b", "#5c9baf", "#9f9700", "#9185be", "#869b55", "#1275ac", "#009299", "#92a19a"];
    var HUES = [188, 220, 260, 290, 320, 350, 15, 40, 60, 90, 140, 170, 200, 240, 280, 310, 340, 25, 50, 75, 120, 155, 195, 230, 270, 300, 330, 10, 45, 100, 160, 210, 250, 295, 335, 20, 65, 130, 185, 245, 305];
    var CW = 1120, CH = 392;
    var el = document.createElement("div");
    el.className = "ls-meadow-scene";
    el.innerHTML = '<div class="ls-meadow-stage" data-tip="' + (DE ? "Die Wiese: bewege den Zeiger über das Feld, um das nächste Wort zu sehen." : "The meadow: move the pointer over the field to see the next word.") + '"><canvas class="ls-canvas" data-tip="' + (DE ? "Jede Zelle gehört zum nächsten Ankerwort; goldene Nähte trennen fast gleich nahe Wörter." : "Each cell belongs to the nearest anchor word; gold seams separate nearly equally near words.") + '" role="img"></canvas></div><div class="ls-scene-row"><label class="ls-range" data-tip="' + (DE ? "Anzahl der Ankerwörter im Feld; mehr Wörter ergeben kleinere Zellen." : "Number of anchor words in the field; more words make smaller cells.") + '">' + (DE ? "Wörter" : "Words") + ' <input type="range" class="ls-md-n" min="12" max="40" step="4" value="20"><output>20</output></label><label class="ls-range" data-tip="' + (DE ? "Temperatur steuert, wie breit die Wahrscheinlichkeiten um das nächste Wort streuen." : "Temperature controls how widely the probabilities spread around the nearest word.") + '">T <input type="range" class="ls-md-temp" min="0.2" max="2.6" step="0.05" value="0.8"><output>0.80</output></label><label class="ls-range" data-tip="' + (DE ? "k legt fest, wie viele Nachbarwörter die Chancenliste zeigt." : "k sets how many neighbouring words the chance list shows.") + '">k <input type="range" class="ls-md-k" min="1" max="10" step="1" value="5"><output>5</output></label><button type="button" class="ls-btn ls-btn--tiny ls-md-landscape" data-tip="' + (DE ? "Schaltet zwischen flacher Wiese und 3D-Landschaft mit Höhe als Nähe um." : "Toggles between the flat meadow and a 3D landscape with height as closeness.") + '">' + (DE ? "Landschaft" : "Landscape") + '</button></div><div class="ls-meadow-readout" aria-live="polite"></div><p class="ls-meadow-caption"></p>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-meadow-stage");
    var canvas = el.querySelector("canvas");
    var nEl = el.querySelector(".ls-md-n"), tempEl = el.querySelector(".ls-md-temp"), kEl = el.querySelector(".ls-md-k");
    var readout = el.querySelector(".ls-meadow-readout");
    var caption = el.querySelector(".ls-meadow-caption");
    var ctx = null, size = null, N = 20, T = 0.8, K = 5;
    var modeMix = 0, modeTarget = 0, modeTimer = 0;
    var anchors = [], fieldCache = {}, gapFrac = 0, pointer = { x: CW / 2, y: CH / 2 };
    var clamp = api.util.clamp;
    function hexToRgb(hex) {
      var h = String(hex || "").replace("#", "");
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
    }
    function palette() {
      var c = api.colors();
      return {
        dark: c.dark || (document.documentElement.getAttribute("data-theme") === "dark"),
        surface: hexToRgb(c.paper),
        card: hexToRgb(c.paper2),
        ink: hexToRgb(c.ink),
        muted: hexToRgb(c.muted),
        border: hexToRgb(c.lineStrong || c.line),
        edge: hexToRgb(c.soft),
        gold: hexToRgb(c.gold),
        thought: hexToRgb(c.green),
        thoughtFill: "rgba(99,164,75,.13)"
      };
    }
    function mulberry32(a) {
      return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        var t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    function smoothstep(a, b, t) {
      if (a === b) return t < a ? 0 : 1;
      t = clamp((t - a) / (b - a), 0, 1);
      return t * t * (3 - 2 * t);
    }
    function mix(c1, c2, t) {
      return [Math.round(c1[0] + (c2[0] - c1[0]) * t), Math.round(c1[1] + (c2[1] - c1[1]) * t), Math.round(c1[2] + (c2[2] - c1[2]) * t)];
    }
    function rgb(c) { return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"; }
    function hsl(h, s2, l2) {
      s2 /= 100; l2 /= 100;
      var k = function (n) { return (n + h / 30) % 12; };
      var a = s2 * Math.min(l2, 1 - l2);
      var f = function (n) { return l2 - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
      return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
    }
    function gen2D(n) {
      var rng = mulberry32(7 + n * 13);
      var cols = Math.ceil(Math.sqrt(n * CW / CH));
      var rows = Math.ceil(n / cols);
      var pts = [];
      for (var i = 0; i < n; i++) {
        var cx = i % cols;
        var cy = Math.floor(i / cols);
        var jx = (rng() - 0.5) * 0.72;
        var jy = (rng() - 0.5) * 0.72;
        pts.push({
          x: clamp((cx + 0.3 + jx) / cols * CW, 26, CW - 26),
          y: clamp((cy + 0.3 + jy) / rows * CH, 26, CH - 26),
          w: WORDS[i % WORDS.length],
          c: HUES[i % HUES.length],
          i: i
        });
      }
      return pts;
    }
    function scaleFor(a) { return Math.sqrt(CW * CH / Math.max(1, a.length)) * 0.52; }
    function nearestTwo(x, y, a) {
      var d1 = 1e18, d2 = 1e18, i1 = 0;
      for (var i = 0; i < a.length; i++) {
        var dx = x - a[i].x, dy = y - a[i].y, d = dx * dx + dy * dy;
        if (d < d1) { d2 = d1; i1 = i; d1 = d; } else if (d < d2) { d2 = d; }
      }
      return { i1: i1, d1: Math.sqrt(d1), d2: Math.sqrt(d2), m: Math.sqrt(d2) - Math.sqrt(d1) };
    }
    function colorFor(m, idx, pal, scale, arr) {
      var q = clamp(m / scale, 0, 1);
      var col = hsl(arr[idx].c, 34 + 16 * q, pal.dark ? 28 + 16 * q : 64 + 16 * q);
      var eps = 0.32 * scale;
      var edgePx = 4.8;
      if (m < eps) col = mix(col, pal.gold, 0.55 * (1 - smoothstep(edgePx, eps, m)));
      if (m < edgePx) col = mix(pal.edge, col, smoothstep(0, edgePx * 0.75, m));
      return col;
    }
    function makeField(n, pal) {
      var a = gen2D(n);
      var scale = scaleFor(a);
      var c = document.createElement("canvas");
      c.width = CW; c.height = CH;
      var cctx = c.getContext("2d");
      var img = cctx.createImageData(CW, CH);
      var cnt = 0, eps = 0.32 * scale;
      for (var y = 0; y < CH; y++) {
        for (var x = 0; x < CW; x++) {
          var n2 = nearestTwo(x, y, a);
          var col = colorFor(n2.m, n2.i1, pal, scale, a);
          var p = (y * CW + x) * 4;
          img.data[p] = col[0]; img.data[p + 1] = col[1]; img.data[p + 2] = col[2]; img.data[p + 3] = 255;
          if (n2.m < eps) cnt++;
        }
      }
      cctx.putImageData(img, 0, 0);
      return { canvas: c, gapFrac: cnt / (CW * CH) };
    }
    function fieldKey(n, pal) { return n + "|" + (pal.dark ? "d" : "l"); }
    function ensureField(n, pal) {
      var key = fieldKey(n, pal);
      if (!fieldCache[key]) fieldCache[key] = makeField(n, pal);
      return fieldCache[key];
    }
    function setN(n) { N = n; anchors = gen2D(n); gapFrac = ensureField(n, palette()).gapFrac; }
    function roundRect(g, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    }
    function drawWordPins(g, sx, sy, pal) {
      var n = anchors.length;
      var scale = clamp(sx * CW / 560, 0.8, 1.35);
      var fs = (n <= 20 ? 11 : n <= 30 ? 9.5 : 8.5) * scale;
      for (var i = 0; i < n; i++) {
        var a = anchors[i];
        var ax = a.x * sx, ay = a.y * sy;
        var r = 6 * scale;
        g.save();
        g.shadowColor = "rgba(0,0,0,.18)"; g.shadowBlur = 6; g.shadowOffsetY = 1;
        g.beginPath(); g.arc(ax, ay, r, 0, Math.PI * 2);
        g.fillStyle = rgb(pal.surface); g.fill();
        g.restore();
        g.beginPath(); g.arc(ax, ay, r, 0, Math.PI * 2);
        g.strokeStyle = rgb(pal.ink); g.globalAlpha = 0.55; g.lineWidth = 1.5; g.stroke();
        g.globalAlpha = 1;
        var ly = ay + r + 5;
        g.font = "600 " + fs + "px 'Open Sans', sans-serif";
        g.textAlign = "center"; g.textBaseline = "top";
        var tw = g.measureText(a.w).width;
        g.globalAlpha = 0.88;
        g.fillStyle = rgb(pal.surface);
        g.fillRect(ax - tw / 2 - 3, ly - 2, tw + 6, fs + 5);
        g.globalAlpha = 1;
        g.fillStyle = rgb(pal.ink);
        g.fillText(a.w, ax, ly + 1);
      }
    }
    function drawThought(g, w, h, pal) {
      var scale = scaleFor(anchors);
      var px = clamp(pointer.x, 0, CW - 1), py = clamp(pointer.y, 0, CH - 1);
      var mx = px * w / CW, my = py * h / CH;
      var radiusPx = T * scale * 1.2 * (w / CW);
      g.beginPath(); g.arc(mx, my, radiusPx, 0, Math.PI * 2);
      g.strokeStyle = rgb(pal.thought); g.globalAlpha = 0.55; g.lineWidth = 2; g.setLineDash([6, 4]); g.stroke(); g.setLineDash([]);
      g.globalAlpha = 1; g.fillStyle = pal.thoughtFill; g.fill();
      var allD = [];
      for (var i = 0; i < anchors.length; i++) allD.push({ i: i, d: Math.hypot(anchors[i].x - px, anchors[i].y - py) });
      allD.sort(function (a, b) { return a.d - b.d; });
      var near = allD.slice(0, Math.min(K, allD.length));
      var sigma = Math.max(1e-6, T * scale * 0.5);
      var scores = near.map(function (cd) { return { i: cd.i, d: cd.d, s: Math.exp(-cd.d / sigma) }; });
      var sum = scores.reduce(function (a, b) { return a + b.s; }, 0) || 1;
      var panelW = Math.min(190, w * 0.46);
      var rowH = 22;
      var panelH = near.length * rowH + 24;
      var right = mx + radiusPx + 16;
      var panelX = (right + panelW > w - 8) ? clamp(mx - radiusPx - panelW - 16, 4, w - panelW - 8) : clamp(right, 4, w - panelW - 8);
      var panelY = clamp(my - panelH / 2, 8, h - panelH - 8);
      g.globalAlpha = 0.96;
      g.fillStyle = rgb(pal.surface);
      g.fillRect(panelX, panelY, panelW, panelH);
      g.globalAlpha = 1;
      g.strokeStyle = rgb(pal.border); g.lineWidth = 1; g.strokeRect(panelX, panelY, panelW, panelH);
      g.font = "700 9px 'Open Sans', sans-serif"; g.fillStyle = rgb(pal.muted); g.textAlign = "left"; g.textBaseline = "middle";
      g.fillText(DE ? "CHANCEN" : "CHANCES", panelX + 9, panelY + 11);
      var barX = panelX + 64;
      var barMax = panelW - 64 - 42;
      for (var k = 0; k < scores.length; k++) {
        var cd = scores[k];
        var prob = cd.s / sum;
        var rowY = panelY + 28 + k * rowH;
        g.font = (k === 0 ? "700" : "400") + " 11px 'Open Sans', sans-serif";
        g.fillStyle = k === 0 ? rgb(pal.thought) : rgb(pal.ink);
        g.textAlign = "left"; g.fillText(anchors[cd.i].w, panelX + 9, rowY);
        var bw = Math.max(3, prob * barMax);
        g.fillStyle = rgb(pal.ink); g.globalAlpha = 0.10;
        g.fillRect(barX, rowY - 5, barMax, 10);
        g.globalAlpha = 1;
        g.strokeStyle = rgb(pal.ink); g.globalAlpha = 0.32; g.lineWidth = 1;
        g.strokeRect(barX + 0.5, rowY - 4.5, barMax - 1, 9);
        g.globalAlpha = 1;
        g.fillStyle = k === 0 ? rgb(pal.thought) : rgb(pal.ink);
        g.globalAlpha = k === 0 ? 1 : 0.72;
        g.fillRect(barX, rowY - 5, bw, 10);
        g.globalAlpha = 1;
        g.font = "600 9px ui-monospace, monospace"; g.fillStyle = rgb(pal.ink); g.textAlign = "right";
        g.fillText(Math.round(prob * 100) + "%", panelX + panelW - 7, rowY);
      }
      g.beginPath(); g.arc(mx, my, 7, 0, Math.PI * 2); g.fillStyle = rgb(pal.surface); g.fill();
      g.strokeStyle = rgb(pal.thought); g.lineWidth = 2.5; g.stroke();
      var winner = scores[0], runner = scores[1];
      var seamGap = near.length > 1 ? near[1].d - near[0].d : 0;
      if (winner) {
        var winProb = winner.s / sum;
        readout.innerHTML = '<span>' + (DE ? "Nächstes Wort" : "Nearest word") + ' <b>' + api.esc(anchors[winner.i].w) + '</b></span><span>' + (DE ? "Gewinnt mit" : "Wins with") + ' <b>' + Math.round(winProb * 100) + '%</b></span><span>' + (DE ? "Rand" : "margin") + ' <b>' + (seamGap / scale).toFixed(2) + '</b></span><span>' + (DE ? "Mehrdeutig" : "ambiguous") + ' <b>' + Math.round(gapFrac * 100) + '%</b></span>';
        if (seamGap / scale < 0.01) caption.textContent = DE
          ? "Du stehst auf einer goldenen Naht: „" + anchors[winner.i].w + "“ und „" + (runner ? anchors[runner.i].w : "?") + "“ sind fast gleich nah."
          : "You are on a golden seam: “" + anchors[winner.i].w + "” and “" + (runner ? anchors[runner.i].w : "?") + "” are almost equally near.";
        else if (winProb > 0.8) caption.textContent = DE
          ? "Tief in der Zelle von „" + anchors[winner.i].w + "“. Die nächste Naht ist weit weg."
          : "Deep inside the cell of “" + anchors[winner.i].w + "”. The nearest seam is far away.";
        else caption.textContent = DE
          ? "In der Nähe des Territoriums von „" + anchors[winner.i].w + "“, aber „" + (runner ? anchors[runner.i].w : "?") + "“ ist nah."
          : "Near the territory of “" + anchors[winner.i].w + "”, but “" + (runner ? anchors[runner.i].w : "?") + "” is close.";
      }
      canvas.setAttribute("aria-label", DE ? "Wörterfeld. Nächstes Wort: " + (winner ? anchors[winner.i].w : "") : "Word field. Nearest word: " + (winner ? anchors[winner.i].w : ""));
    }
    function drawMeadowLandscape(g, w, h, pal) {
      var scale = scaleFor(anchors);
      var yaw = -0.55, pitch = 0.92;
      function norm(a) { return { x: a.x / CW * 2 - 1, y: (1 - a.y / CH) * 1.8 - 0.9 }; }
      function raw(x, y, z) {
        var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
        var x1 = x * cy - y * sy;
        var y1 = x * sy + y * cy;
        var y2 = y1 * cp + z * sp;
        var z2 = y1 * sp + z * cp;
        return { x: x1, y: -y2, z: z2 };
      }
      var NX = 32, NY = 22, grid = [];
      var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      function include(p) { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; }
      for (var i = 0; i <= NX; i++) {
        grid[i] = [];
        for (var j = 0; j <= NY; j++) {
          var nx = -1 + 2 * i / NX, ny = -0.9 + 1.8 * j / NY;
          var mx = (nx + 1) / 2 * CW;
          var my = (1 - (ny + 0.9) / 1.8) * CH;
          var n2 = nearestTwo(mx, my, anchors);
          var p = 1 - clamp(n2.m / scale, 0, 1);
          var z = 0.06 + 0.9 * p;
          var rp = raw(nx, ny, z);
          grid[i][j] = { x: nx, y: ny, p: p, rx: rp.x, ry: rp.y, rz: rp.z };
          include(rp);
        }
      }
      [[-1, -0.9], [1, -0.9], [1, 0.9], [-1, 0.9]].forEach(function (c) { include(raw(c[0], c[1], 1.05)); });
      var pad = Math.min(w, h) * 0.08;
      var sc = Math.min((w - pad * 2) / Math.max(0.001, maxX - minX), (h - pad * 2) / Math.max(0.001, maxY - minY));
      var ox = w / 2 - (minX + maxX) / 2 * sc;
      var oy = h / 2 - (minY + maxY) / 2 * sc;
      function sx2(v) { return v * sc + ox; }
      function sy2(v) { return v * sc + oy; }
      g.save();
      g.globalAlpha = modeMix;
      g.fillStyle = rgb(pal.surface);
      g.fillRect(0, 0, w, h);
      var quads = [];
      for (var qi = 0; qi < NX; qi++) {
        for (var qj = 0; qj < NY; qj++) {
          var a = grid[qi][qj], b = grid[qi + 1][qj], c = grid[qi + 1][qj + 1], d = grid[qi][qj + 1];
          quads.push({ p: [a, b, c, d], pv: (a.p + b.p + c.p + d.p) / 4, z: (a.rz + b.rz + c.rz + d.rz) / 4 });
        }
      }
      quads.sort(function (a, b) { return a.z - b.z; });
      quads.forEach(function (q) {
        g.beginPath();
        g.moveTo(sx2(q.p[0].rx), sy2(q.p[0].ry));
        g.lineTo(sx2(q.p[1].rx), sy2(q.p[1].ry));
        g.lineTo(sx2(q.p[2].rx), sy2(q.p[2].ry));
        g.lineTo(sx2(q.p[3].rx), sy2(q.p[3].ry));
        g.closePath();
        g.fillStyle = q.pv > 0.72 ? rgb(pal.thought) : q.pv > 0.46 ? "#869b55" : q.pv > 0.24 ? "#5c9baf" : rgb(pal.card);
        g.globalAlpha = modeMix * 0.9;
        g.fill();
        g.globalAlpha = modeMix * 0.12;
        g.strokeStyle = rgb(pal.surface);
        g.lineWidth = 0.5;
        g.stroke();
        g.globalAlpha = modeMix;
      });
      var plane = [[-1, -0.9], [1, -0.9], [1, 0.9], [-1, 0.9]].map(function (c) { var p = raw(c[0], c[1], 1.05); return { x: sx2(p.x), y: sy2(p.y) }; });
      g.beginPath(); g.moveTo(plane[0].x, plane[0].y);
      for (var pi = 1; pi < plane.length; pi++) g.lineTo(plane[pi].x, plane[pi].y);
      g.closePath(); g.globalAlpha = modeMix * 0.28; g.strokeStyle = rgb(pal.border); g.lineWidth = 1; g.stroke();
      anchors.forEach(function (a) {
        var na = norm(a);
        var pp = raw(na.x, na.y, 1.05);
        var sp = raw(na.x, na.y, 0.96);
        g.globalAlpha = modeMix * 0.5;
        g.strokeStyle = rgb(pal.thought); g.setLineDash([3, 3]); g.lineWidth = 1;
        g.beginPath(); g.moveTo(sx2(pp.x), sy2(pp.y)); g.lineTo(sx2(sp.x), sy2(sp.y)); g.stroke(); g.setLineDash([]);
        g.globalAlpha = modeMix;
        g.fillStyle = rgb(pal.surface); g.strokeStyle = rgb(pal.thought); g.lineWidth = 1.4;
        g.beginPath(); g.arc(sx2(pp.x), sy2(pp.y), 3, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = rgb(pal.ink);
        g.font = "600 " + api.font("canvas-sm") + "px 'Open Sans', sans-serif";
        g.textAlign = "center";
        g.fillText(a.w, sx2(pp.x), sy2(pp.y) - 8);
      });
      g.fillStyle = rgb(pal.muted);
      g.font = "600 " + api.font("canvas-sm") + "px 'Open Sans', sans-serif";
      g.textAlign = "left";
      g.fillText(DE ? "Wiese → Landschaft · Höhe = Nähe" : "meadow → landscape · height = closeness", 10, 16);
      g.restore();
      g.globalAlpha = 1;
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var pal = palette();
      var f = ensureField(N, pal);
      gapFrac = f.gapFrac;
      ctx.clearRect(0, 0, size.w, size.h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(f.canvas, 0, 0, size.w, size.h);
      drawWordPins(ctx, size.w / CW, size.h / CH, pal);
      drawThought(ctx, size.w, size.h, pal);
      if (modeMix > 0.01) {
        drawMeadowLandscape(ctx, size.w, size.h, pal);
        if (modeMix > 0.5) {
          readout.innerHTML = '<span>' + (DE ? "Landschaft" : "landscape") + ' <b>' + (DE ? "Höhe = Nähe" : "height = closeness") + '</b></span><span>' + (DE ? "Wörter auf der Token-Ebene" : "words on the token plane") + '</span>';
          caption.textContent = DE ? "Dieselben Wörter, jetzt als Wahrscheinlichkeitslandschaft: Jedes Wort ist ein Gipfel, die Täler dazwischen sind unwahrscheinlich." : "The same words as a probability landscape: every word is a peak, the valleys between them are unlikely.";
        }
      }
      nEl.nextElementSibling.textContent = N;
      tempEl.nextElementSibling.textContent = T.toFixed(2);
      kEl.nextElementSibling.textContent = K;
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    function move(e) {
      var r = canvas.getBoundingClientRect();
      pointer.x = clamp((e.clientX - r.left) / r.width * CW, 0, CW - 1);
      pointer.y = clamp((e.clientY - r.top) / r.height * CH, 0, CH - 1);
      draw();
    }
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerdown", move);
    core.canvasTip(canvas, function () {
      if (!anchors.length) return "";
      var px = clamp(pointer.x, 0, CW - 1), py = clamp(pointer.y, 0, CH - 1);
      var near = anchors.map(function (a, i) { return { i: i, d: Math.hypot(a.x - px, a.y - py) }; })
        .sort(function (a, b) { return a.d - b.d; }).slice(0, Math.min(3, K));
      var scale = scaleFor(anchors);
      var sigma = Math.max(1e-6, T * scale * 0.5);
      var score = near.map(function (x) { return Math.exp(-x.d / sigma); });
      var sum = score.reduce(function (a, b) { return a + b; }, 0) || 1;
      var parts = near.map(function (x, i) { return anchors[x.i].w + " " + Math.round(score[i] / sum * 100) + "%"; });
      return (DE ? "Nächstes Wort: " : "Nearest word: ") + anchors[near[0].i].w + " · " + parts.join(" · ") +
        " · T = " + T.toFixed(2) + ", k = " + K + ".";
    });
    nEl.addEventListener("input", function () { setN(parseInt(nEl.value, 10) || 12); draw(); });
    tempEl.addEventListener("input", function () { T = clamp(parseFloat(tempEl.value) || 0.8, 0.2, 2.6); draw(); });
    kEl.addEventListener("input", function () { K = clamp(parseInt(kEl.value, 10) || 5, 1, 10); draw(); });
    var landscapeBtn = el.querySelector(".ls-md-landscape");
    function animateMode() {
      modeMix += (modeTarget - modeMix) * 0.22;
      if (Math.abs(modeTarget - modeMix) < 0.02) modeMix = modeTarget;
      draw();
      if (modeMix !== modeTarget) modeTimer = setTimeout(animateMode, 16);
    }
    landscapeBtn.addEventListener("click", function () {
      modeTarget = modeTarget ? 0 : 1;
      el.setAttribute("data-landscape", String(modeTarget));
      if (modeTimer) clearTimeout(modeTimer);
      animateMode();
    });
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { fieldCache = {}; setN(N); draw(); });
    setN(N);
    resize();
    return { update: function () {}, resize: resize, destroy: function () { window.removeEventListener("resize", resize); el.remove(); } };
  }

  core.register("meadow", meadowScene);
})();
