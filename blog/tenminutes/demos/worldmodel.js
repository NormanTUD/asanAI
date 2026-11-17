(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var V = window.LearnSysVisuals;
  var DATA = {
    moves: ["c4", "c5", "d6", "c7", "b5", "a5", "e6", "c3", "b8", "f7", "b6", "d8", "c6", "f4", "g3", "g4", "e3", "h2", "g8", "f6", "f5", "g5", "g6", "f3", "d7", "h6", "f2", "e8", "c2", "b4"],
    acc: [0.909, 0.948, 0.972, 0.983, 0.990, 0.994, 0.996, 0.995]
  };
  var DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

  if (!document.getElementById("ls-wm-style")) {
    var st = document.createElement("style");
    st.id = "ls-wm-style";
    st.textContent = ".ls-wm-scene{position:relative;width:100%;height:100%;min-height:380px;overflow:hidden;background:var(--tm-paper-2,#f7f9f8)}.ls-wm-scene canvas{display:block;width:100%;height:100%}";
    document.head.appendChild(st);
  }

  function hash(a, b, c) {
    var n = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
    return n - Math.floor(n);
  }

  function copyBoard(b) {
    return b.map(function (row) { return row.slice(); });
  }

  function legal(b, player) {
    var out = [];
    for (var r = 0; r < 8; r++) {
      for (var col = 0; col < 8; col++) {
        if (b[r][col] !== 0) continue;
        var flips = [];
        for (var d = 0; d < DIRS.length; d++) {
          var dr = DIRS[d][0], dc = DIRS[d][1];
          var rr = r + dr, cc = col + dc, buf = [];
          while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr][cc] === -player) {
            buf.push([rr, cc]);
            rr += dr;
            cc += dc;
          }
          if (buf.length && rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr][cc] === player) {
            flips = flips.concat(buf);
          }
        }
        if (flips.length) out.push({ r: r, c: col, flips: flips, label: String.fromCharCode(65 + col) + (8 - r) });
      }
    }
    return out;
  }

  function apply(b, move, player) {
    b[move.r][move.c] = player;
    for (var i = 0; i < move.flips.length; i++) {
      var f = move.flips[i];
      b[f[0]][f[1]] = player;
    }
  }

  function buildFrames() {
    var b = [], i;
    for (i = 0; i < 8; i++) b.push([0, 0, 0, 0, 0, 0, 0, 0]);
    b[3][3] = 1; b[3][4] = -1; b[4][3] = -1; b[4][4] = 1;
    var player = 1;
    var frames = [{ board: copyBoard(b), move: null, next: 1 }];
    DATA.moves.forEach(function (m) {
      var r = 8 - parseInt(m[1], 10), c = m.toUpperCase().charCodeAt(0) - 65;
      var moves = legal(b, player);
      var mv = null;
      for (var k = 0; k < moves.length; k++) {
        if (moves[k].r === r && moves[k].c === c) mv = moves[k];
      }
      if (mv) {
        apply(b, mv, player);
        frames.push({ board: copyBoard(b), move: mv, next: -player });
        player = -player;
      } else {
        player = -player;
      }
    });
    return frames;
  }

  function worldModelScene(root, api) {
    var DE = api.lang === "de";
    var C = api.colors();
    var host = document.createElement("div");
    host.className = "ls-wm-scene";
    var canvas = document.createElement("canvas");
    host.appendChild(canvas);
    root.appendChild(host);
    var ctx = canvas.getContext("2d");
    var ARIA = DE ? [
      "Schematisches Othello-Brett mit schwarzen und weißen Scheiben",
      "Ein Weg von Zug-Tokens über acht Schichten und einen Residualstrom zu einem Brett, das ein linearer Probe ausliest",
      "Eine Aktivierung, ein linearer Probe und eine Linie mit den drei Bereichen leer, Spieler 1 und Spieler 2",
      "Eine Linie für Othello, ein Unterraum für Schach und viele überlagerte Unterräume für reale Modelle"
    ] : [
      "Schematic Othello board with black and white discs",
      "A path from move tokens through eight layers and a residual stream to a board read by a linear probe",
      "One activation, one linear probe and a line with the three ranges empty, player 1 and player 2",
      "One line for Othello, a subspace for chess and many overlapping subspaces for real models"
    ];
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", ARIA[0]);
    var W = 1, H = 1;
    var state = { step: 0, t: 0, running: false, raf: 0, last: 0 };
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var FRAMES = buildFrames();
    var TRUTH = FRAMES[FRAMES.length - 1].board;
    var X = [];
    for (var xi = 0; xi < 512; xi++) X.push(hash(xi, 7, 3) * 2 - 1);
    var FOCUS = [0, 1, 3, 36];

    function txt(c, s, x, y, o) {
      var opt = o || {};
      var size = typeof opt.size === "number" ? opt.size : 11;
      V.label(c, s, x, y, Object.assign({}, opt, {
        size: size,
        font: opt.font || '400 ' + size + 'px "Open Sans", "Segoe UI", sans-serif',
        color: opt.color || C.soft,
        bg: opt.bg === undefined ? false : opt.bg
      }));
    }

    function head(c, s, x, y, o) {
      var opt = o || {};
      var size = typeof opt.size === "number" ? opt.size : 24;
      txt(c, s, x, y, Object.assign({}, opt, {
        size: size,
        font: '700 ' + size + 'px "Barlow", "Open Sans", sans-serif',
        color: opt.color || C.ink
      }));
    }

    function accent(c, x, y, w) {
      c.strokeStyle = C.gold;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + w, y);
      c.stroke();
    }

    function drawDisc(c, x, y, r, v, scale) {
      if (r < .5) return;
      var s = typeof scale === "number" ? scale : 1;
      c.save();
      c.translate(x, y);
      c.scale(s, 1);
      c.shadowColor = V.alpha(C.ink, .16);
      c.shadowBlur = Math.max(1, r * .45);
      c.shadowOffsetY = Math.max(.5, r * .12);
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fillStyle = v === 1 ? C.ink : C.paper;
      c.fill();
      c.shadowColor = "transparent";
      c.strokeStyle = v === 1 ? C.ink : V.alpha(C.lineStrong, .95);
      c.lineWidth = Math.max(1, r * .10);
      c.stroke();
      c.restore();
    }

    function drawBoard(c, b, x, y, S, o) {
      var opt = o || {};
      var cell = S / 8;
      c.save();
      c.shadowColor = V.alpha(C.ink, .09);
      c.shadowBlur = Math.max(6, S * .055);
      c.shadowOffsetY = Math.max(2, S * .018);
      c.fillStyle = C.paper;
      c.fillRect(x, y, S, S);
      c.restore();
      c.strokeStyle = V.alpha(C.lineStrong, .85);
      c.lineWidth = 1;
      c.strokeRect(x + .5, y + .5, S - 1, S - 1);
      for (var i = 1; i < 8; i++) {
        c.strokeStyle = V.alpha(C.line, .65);
        c.beginPath();
        c.moveTo(x + i * cell, y);
        c.lineTo(x + i * cell, y + S);
        c.moveTo(x, y + i * cell);
        c.lineTo(x + S, y + i * cell);
        c.stroke();
      }
      for (var r = 0; r < 8; r++) {
        for (var col = 0; col < 8; col++) {
          var v = b[r][col];
          if (v === 0) continue;
          var scale = 1;
          if (opt.pulse) {
            for (var p = 0; p < opt.pulse.length; p++) {
              if (opt.pulse[p][0] === r && opt.pulse[p][1] === col) {
                scale = .88 + .12 * Math.abs(Math.cos((opt.local || 0) * Math.PI));
              }
            }
          }
          drawDisc(c, x + col * cell + cell / 2, y + r * cell + cell / 2, cell * .33, v, scale);
        }
      }
      if (opt.highlight) {
        c.fillStyle = V.alpha(C.gold, .10);
        c.fillRect(x + opt.highlight[1] * cell + 1, y + opt.highlight[0] * cell + 1, cell - 2, cell - 2);
        c.strokeStyle = C.gold;
        c.lineWidth = 2;
        c.strokeRect(x + opt.highlight[1] * cell + 1, y + opt.highlight[0] * cell + 1, cell - 2, cell - 2);
      }
      c.restore();
    }

    function squareLabel(i) {
      return String.fromCharCode(65 + (i % 8)) + (8 - Math.floor(i / 8));
    }

    function scoresFor(i) {
      var r = Math.floor(i / 8), c = i % 8;
      var v = TRUTH[r][c];
      var idx = v === 0 ? 0 : v === -1 ? 1 : 2;
      var s = [0, 0, 0];
      for (var k = 0; k < 3; k++) s[k] = -1.4 + 2.8 * hash(i + 11, k + 1, 5);
      s[idx] = 2.9 + 2.0 * hash(i + 3, idx + 7, 11);
      return s;
    }

    var SCORES = [], PROBS = [];
    for (var si = 0; si < 64; si++) {
      var sc = scoresFor(si);
      SCORES.push(sc);
      PROBS.push(V.softmax(sc));
    }
    var probeCanvas = null;

    function winIndex(values) {
      var best = 0;
      for (var i = 1; i < values.length; i++) if (values[i] > values[best]) best = i;
      return best;
    }

    function drawActivation(c, x, y, w, h) {
      txt(c, DE ? "Aktivierung x · 512" : "activation x · 512", x, y - 12, { size: 10, color: C.muted });
      var n = 64;
      var cw = w / n;
      var mid = y + h / 2;
      c.strokeStyle = V.alpha(C.line, .55);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, mid);
      c.lineTo(x + w, mid);
      c.stroke();
      for (var i = 0; i < n; i++) {
        var v = X[i * 8];
        var bh = Math.abs(v) * (h / 2) * .92;
        var bx = x + i * cw + cw * .18;
        var bw = Math.max(1, cw * .64);
        c.fillStyle = v >= 0 ? V.mix(C.paper, C.blue, .52) : V.mix(C.paper, C.green, .42);
        if (v >= 0) c.fillRect(bx, mid - bh, bw, bh);
        else c.fillRect(bx, mid, bw, bh);
      }
    }

    function drawRangeLine(c, x, y, w, h, probs, opts) {
      var o = opts || {};
      var labels = DE ? ["leer", "Spieler 1", "Spieler 2"] : ["empty", "player 1", "player 2"];
      var colors = [V.alpha(C.line, .42), C.ink, C.paper];
      var seg = w / 3;
      var win = winIndex(probs);
      for (var i = 0; i < 3; i++) {
        c.fillStyle = colors[i];
        c.fillRect(x + i * seg, y, seg, h);
        c.strokeStyle = i === win ? C.gold : V.alpha(C.lineStrong, .75);
        c.lineWidth = i === win ? 2 : 1;
        c.strokeRect(x + i * seg + .5, y + .5, seg - 1, h - 1);
        txt(c, labels[i], x + i * seg + seg / 2, y - 15, {
          align: "center",
          size: o.small ? 9 : 11,
          color: i === win ? C.gold : i === 2 ? C.ink : C.muted
        });
        txt(c, V.fmt(probs[i], 2), x + i * seg + seg / 2, y + h + (o.small ? 18 : 24), {
          align: "center",
          size: o.small ? 12 : 18,
          font: '700 ' + (o.small ? 12 : 18) + 'px "Barlow", "Open Sans", sans-serif',
          color: i === win ? C.gold : C.ink
        });
      }
      var mx = x + win * seg + seg / 2;
      c.fillStyle = C.gold;
      c.beginPath();
      c.moveTo(mx, y - 2);
      c.lineTo(mx - 6, y - 13);
      c.lineTo(mx + 6, y - 13);
      c.closePath();
      c.fill();
    }

    function drawCurve(c, x, y, w, h, layer) {
      txt(c, DE ? "lineare Probe · Spieler 1/2" : "linear probe · player 1/2", x, y - 24, { size: 10, color: C.muted });
      txt(c, "Nanda et al. (2023)", x, y - 10, { size: 9, color: C.muted });
      var min = .88, max = 1;
      var pts = [];
      for (var i = 0; i < DATA.acc.length; i++) {
        pts.push({
          x: x + (i / (DATA.acc.length - 1)) * w,
          y: y + h - ((DATA.acc[i] - min) / (max - min)) * h
        });
      }
      var grad = c.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, V.alpha(C.blue, .13));
      grad.addColorStop(1, V.alpha(C.blue, 0));
      c.beginPath();
      c.moveTo(pts[0].x, y + h);
      pts.forEach(function (p) { c.lineTo(p.x, p.y); });
      c.lineTo(pts[pts.length - 1].x, y + h);
      c.closePath();
      c.fillStyle = grad;
      c.fill();
      c.strokeStyle = V.alpha(C.line, .55);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, y + h);
      c.lineTo(x + w, y + h);
      c.stroke();
      c.strokeStyle = C.blue;
      c.lineWidth = 1.8;
      c.beginPath();
      pts.forEach(function (p, i) { if (i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y); });
      c.stroke();
      pts.forEach(function (p, i) {
        c.beginPath();
        c.arc(p.x, p.y, i === layer ? 4 : 2.4, 0, Math.PI * 2);
        c.fillStyle = i === layer ? C.gold : C.blue;
        c.fill();
      });
      txt(c, "L1", x, y + h + 13, { size: 8.5, color: C.muted });
      txt(c, "L8", x + w, y + h + 13, { align: "right", size: 8.5, color: C.muted });
    }

    function drawStep0(c) {
      var pad = Math.max(18, Math.min(28, W * .035));
      var narrow = W < 620;
      head(c, "Othello", pad, 34, { size: Math.min(30, Math.max(24, W * .04)) });
      txt(c, DE ? "Das Modell sieht nur Züge, nie das Brett." : "The model only sees moves, never the board.", pad, 60, { size: 12, color: C.muted });
      accent(c, pad, 74, 42);
      var boardS = Math.min(narrow ? W * .72 : W * .54, H * .66);
      var bx = narrow ? (W - boardS) / 2 : W * .56 - boardS / 2;
      var by = narrow ? Math.max(105, (H - boardS) / 2 + 18) : Math.max(96, (H - boardS) / 2 + 8);
      var idx = Math.floor(state.t / 3.0) % FRAMES.length;
      var f = FRAMES[idx];
      drawBoard(c, f.board, bx, by, boardS, {
        pulse: f.move ? f.move.flips : null,
        local: (state.t / 3.0) % 1
      });
      var cy = by + boardS + 22;
      txt(c, DE ? "8 × 8 · schematisch" : "8 × 8 · schematic", bx + boardS / 2, cy, { align: "center", size: 10, color: C.muted });
      txt(c, DE ? "leer · Spieler 1 · Spieler 2" : "empty · player 1 · player 2", bx + boardS / 2, cy + 18, {
        align: "center",
        size: 11,
        color: C.ink
      });
      var gy = Math.min(cy + 58, H - 20);
      txt(c, DE ? "Ein Brett, das niemand dem Modell zeigt." : "A board the model is never shown.", pad, gy, { size: 11, color: C.soft });
    }

    function drawStep1(c) {
      var pad = Math.max(18, Math.min(28, W * .035));
      var narrow = W < 620;
      head(c, DE ? "Der Weg zum Brett" : "The path to the board", pad, 34, { size: Math.min(28, Math.max(22, W * .038)) });
      txt(c, DE ? "Züge, Schichten, ein Residualstrom, ein Readout." : "Moves, layers, a residual stream, one readout.", pad, 60, { size: 12, color: C.muted });
      accent(c, pad, 74, 42);
      var layer = Math.floor(state.t / 1.5) % 8;
      if (narrow) {
        var rowH = Math.min(36, (H - 300) / 8);
        var layerY = 116;
        var layerX = pad;
        var layerW = W - 2 * pad;
        var bandX = layerX + layerW * .52;
        txt(c, DE ? "Züge" : "moves", layerX, 94, { size: 10, color: C.muted });
        for (var t = 0; t < 8; t++) {
          c.beginPath();
          c.arc(layerX + 6 + t * 15, 94, t === 7 ? 3.2 : 2, 0, Math.PI * 2);
          c.fillStyle = t === 7 ? C.gold : V.alpha(C.blue, .35);
          c.fill();
        }
        V.arrow(c, layerX + 6, 104, bandX + 4.5, layerY + 2, V.alpha(C.blue, .35), 1.1, 5);
        drawResidual(c, layerX, layerY, layerW, rowH, bandX, layer);
        var boardS = Math.min(W * .40, 170);
        var bx = W - pad - boardS;
        var by = H - 46 - boardS;
        drawBoard(c, TRUTH, bx, by, boardS, {});
        txt(c, DE ? "Probe liest das Brett" : "probe reads the board", bx + boardS / 2, by - 16, { align: "center", size: 10, color: C.ink });
        txt(c, "L" + (layer + 1) + " · " + (DATA.acc[layer] * 100).toFixed(1) + "%", bx + boardS / 2, by + boardS + 18, {
          align: "center",
          size: 11,
          color: DATA.acc[layer] >= .99 ? C.green : C.gold
        });
        drawProbeBeam(c, bandX + 5, layerY + layer * rowH + rowH * .5, bx, by + boardS * .5, layer);
        drawCurve(c, layerX, H - 122, Math.max(120, layerW - boardS - 34), 74, layer);
      } else {
        var lx = pad;
        var lw = W * .46;
        var ly = 108;
        var rh = Math.min(36, (H - 260) / 8);
        var band = lx + lw * .54;
        txt(c, DE ? "Züge" : "moves", lx, 86, { size: 10, color: C.muted });
        for (var m = 0; m < 8; m++) {
          c.beginPath();
          c.arc(lx + 6, 104 + m * 15, m === 7 ? 3.2 : 2, 0, Math.PI * 2);
          c.fillStyle = m === 7 ? C.gold : V.alpha(C.blue, .35);
          c.fill();
        }
        V.arrow(c, lx + 6, 118, band + 4.5, ly + 2, V.alpha(C.blue, .35), 1.1, 5);
        drawResidual(c, lx, ly, lw, rh, band, layer);
        var bs = Math.min(W * .27, H * .38);
        var bx2 = W - pad - bs;
        var by2 = ly + Math.max(0, (8 * rh - bs) / 2);
        drawBoard(c, TRUTH, bx2, by2, bs, {});
        txt(c, DE ? "Probe liest das Brett" : "probe reads the board", bx2 + bs / 2, by2 - 16, { align: "center", size: 10, color: C.ink });
        txt(c, "L" + (layer + 1) + " · " + (DATA.acc[layer] * 100).toFixed(1) + "%", bx2 + bs / 2, by2 + bs + 18, {
          align: "center",
          size: 11,
          color: DATA.acc[layer] >= .99 ? C.green : C.gold
        });
        drawProbeBeam(c, band + 5, ly + layer * rh + rh * .5, bx2, by2 + bs * .5, layer);
        drawCurve(c, lx, H - 122, lw * .78, 74, layer);
      }
    }

    function drawResidual(c, x, y, w, rowH, bandX, layer) {
      var bandW = 9;
      var grad = c.createLinearGradient(bandX, y, bandX, y + 8 * rowH);
      grad.addColorStop(0, V.alpha(C.sky, .28));
      grad.addColorStop(.55, V.alpha(C.blue, .22));
      grad.addColorStop(1, V.alpha(C.green, .28));
      c.fillStyle = grad;
      c.fillRect(bandX, y, bandW, 8 * rowH);
      txt(c, "x", bandX + bandW / 2, y - 10, { align: "center", size: 10, color: C.muted });
      for (var l = 0; l < 8; l++) {
        var yy = y + l * rowH + rowH * .5;
        var on = l === layer;
        c.strokeStyle = on ? C.gold : V.alpha(C.line, .85);
        c.lineWidth = on ? 1.6 : 1;
        c.beginPath();
        c.moveTo(x + 26, yy);
        c.lineTo(x + w, yy);
        c.stroke();
        txt(c, "L" + (l + 1), x + 10, yy, { size: 9.5, color: on ? C.ink : C.muted });
        c.beginPath();
        c.arc(bandX + bandW / 2, yy, on ? 3.4 : 1.9, 0, Math.PI * 2);
        c.fillStyle = on ? C.gold : V.alpha(C.blue, .38);
        c.fill();
      }
      txt(c, DE ? "Residualstrom · 512" : "residual stream · 512", bandX + bandW + 12, y + 8 * rowH + 14, { size: 9, color: C.muted });
    }

    function drawProbeBeam(c, x1, y1, x2, y2, layer) {
      c.save();
      c.strokeStyle = V.alpha(C.gold, .38);
      c.lineWidth = 1.2;
      c.setLineDash([3, 5]);
      c.beginPath();
      c.moveTo(x1, y1);
      c.quadraticCurveTo((x1 + x2) / 2, y1 - 26, x2, y2);
      c.stroke();
      c.restore();
      txt(c, DE ? "Probe" : "probe", (x1 + x2) / 2, (y1 + y2) / 2 - 22, { align: "center", size: 9, color: C.gold });
    }

    function mixRgb(a, b, t) {
      var A = V.rgb(a), B = V.rgb(b), u = Math.max(0, Math.min(1, t));
      return [
        Math.round(A[0] + (B[0] - A[0]) * u),
        Math.round(A[1] + (B[1] - A[1]) * u),
        Math.round(A[2] + (B[2] - A[2]) * u)
      ];
    }

    function probeWeight(s, d) {
      var base = hash(s + 3, d + 7, 13) * 2 - 1;
      var band = Math.exp(-Math.pow((d - (s * 8 + 60)) / 38, 2));
      return base * .55 + band * .95;
    }

    function makeProbeCanvas() {
      var cv = document.createElement("canvas");
      cv.width = 512;
      cv.height = 64;
      var g = cv.getContext("2d");
      var img = g.createImageData(512, 64);
      for (var s = 0; s < 64; s++) {
        for (var d = 0; d < 512; d++) {
          var w = probeWeight(s, d);
          var t = Math.min(1, Math.abs(w));
          var col = w >= 0
            ? mixRgb(C.paper2, C.blue, .14 + .62 * t)
            : mixRgb(C.paper2, C.gold, .10 + .55 * t);
          var i = (s * 512 + d) * 4;
          img.data[i] = col[0];
          img.data[i + 1] = col[1];
          img.data[i + 2] = col[2];
          img.data[i + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
      return cv;
    }

    function drawActivationStrip(c, x, y, w, h) {
      txt(c, "x · 512", x, y - 10, { size: 9.5, color: C.muted });
      var n = 512;
      var bw = w / n;
      for (var i = 0; i < n; i++) {
        var v = X[i];
        var t = Math.abs(v);
        c.fillStyle = v >= 0
          ? "rgb(" + mixRgb(C.paper2, C.blue, .10 + .55 * t).join(",") + ")"
          : "rgb(" + mixRgb(C.paper2, C.green, .10 + .45 * t).join(",") + ")";
        c.fillRect(x + i * bw, y, bw + .45, h);
      }
      c.strokeStyle = V.alpha(C.lineStrong, .55);
      c.lineWidth = 1;
      c.strokeRect(x + .5, y + .5, w - 1, h - 1);
    }

    function drawProbeMatrix(c, x, y, w, h, row) {
      if (!probeCanvas) probeCanvas = makeProbeCanvas();
      c.save();
      c.imageSmoothingEnabled = false;
      c.drawImage(probeCanvas, x, y, w, h);
      c.restore();
      c.strokeStyle = V.alpha(C.lineStrong, .55);
      c.lineWidth = 1;
      c.strokeRect(x + .5, y + .5, w - 1, h - 1);
      var rh = h / 64;
      var ry = y + (row + .5) * rh;
      c.strokeStyle = C.gold;
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(x, ry);
      c.lineTo(x + w, ry);
      c.stroke();
      txt(c, (DE ? "Feld " : "square ") + squareLabel(row), x, y - 10, { size: 10, color: C.gold });
      if (W >= 620) txt(c, "W · 64 × 512", x + w / 2, y + h + 16, { align: "center", size: 9.5, color: C.muted });
    }

    function drawLogitsColumn(c, x, y, w, h, row) {
      var ch = h / 64;
      var cw = w / 3;
      for (var s = 0; s < 64; s++) {
        for (var o = 0; o < 3; o++) {
          var v = SCORES[s][o];
          var t = Math.max(0, Math.min(1, (v + 6) / 12));
          var col = o === 0 ? mixRgb(C.paper2, C.blue, .10 + .50 * t)
            : o === 1 ? mixRgb(C.paper2, C.gold, .10 + .55 * t)
              : mixRgb(C.paper2, C.ink, .08 + .55 * t);
          c.fillStyle = "rgb(" + col.join(",") + ")";
          c.fillRect(x + o * cw, y + s * ch, cw, ch + .4);
        }
      }
      c.strokeStyle = V.alpha(C.lineStrong, .55);
      c.lineWidth = 1;
      c.strokeRect(x + .5, y + .5, w - 1, h - 1);
      var ry = y + (row + .5) * ch;
      c.strokeStyle = C.gold;
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(x, ry);
      c.lineTo(x + w, ry);
      c.stroke();
      txt(c, "64 × 3", x + w / 2, y - 10, { align: "center", size: 9.5, color: C.muted });
    }

    function drawProbGrid(c, x, y, size, state, row) {
      var cell = size / 8;
      for (var r = 0; r < 8; r++) {
        for (var col = 0; col < 8; col++) {
          var p = PROBS[r * 8 + col][state];
          var tint = state === 0 ? C.blue : state === 1 ? C.gold : C.ink;
          c.fillStyle = V.mix(C.paper2, tint, Math.min(1, p * 1.05));
          c.fillRect(x + col * cell, y + r * cell, cell, cell);
          c.strokeStyle = V.alpha(C.line, .18);
          c.strokeRect(x + col * cell + .5, y + r * cell + .5, cell - 1, cell - 1);
        }
      }
      c.strokeStyle = V.alpha(C.lineStrong, .65);
      c.lineWidth = 1;
      c.strokeRect(x + .5, y + .5, size - 1, size - 1);
      if (typeof row === "number") {
        c.strokeStyle = C.gold;
        c.lineWidth = 1.8;
        c.strokeRect(x + (row % 8) * cell + .5, y + Math.floor(row / 8) * cell + .5, cell - 1, cell - 1);
      }
    }

    function drawStep2(c) {
      var pad = Math.max(18, Math.min(26, W * .035));
      var narrow = W < 620;
      head(c, DE ? "64 × 3 Zahlen werden ein Brett" : "64 × 3 numbers become a board", pad, 34, { size: Math.min(28, Math.max(21, W * .036)) });
      txt(c, DE ? "Ein Dot-Product pro Feld und Zustand. Dann Softmax und Argmax." : "One dot product per square and state. Then softmax and argmax.", pad, 58, { size: 11.5, color: C.muted });
      accent(c, pad, 72, 42);
      var focusAt = Math.floor(state.t / 2.8) % FOCUS.length;
      var sq = FOCUS[focusAt];
      var r = Math.floor(sq / 8), col = sq % 8;
      var probs = PROBS[sq];
      if (narrow) {
        var top = 96;
        var matW = W * .54;
        var matH = 162;
        drawActivationStrip(c, pad, top, W - 2 * pad, 13);
        drawProbeMatrix(c, pad, top + 22, matW, matH, sq);
        drawLogitsColumn(c, pad + matW + 12, top + 22, 48, matH, sq);
        var hs = 82, gap = 10;
        var hx = pad, hy = 306;
        var labels = DE ? ["leer", "Spieler 1", "Spieler 2"] : ["empty", "player 1", "player 2"];
        for (var o = 0; o < 3; o++) {
          txt(c, labels[o], hx + o * (hs + gap) + hs / 2, hy - 9, { align: "center", size: 9, color: o === 1 ? C.gold : o === 2 ? C.ink : C.muted });
          drawProbGrid(c, hx + o * (hs + gap), hy, hs, o, sq);
        }
        drawRangeLine(c, pad, 426, W - 2 * pad, 16, probs, { small: true });
        var bs = Math.min(W * .40, 150);
        var bx = (W - bs) / 2;
        var by = 490;
        drawBoard(c, TRUTH, bx, by, bs, { highlight: [r, col] });
        txt(c, DE ? "Argmax → Brett" : "argmax → board", bx + bs / 2, by - 12, { align: "center", size: 10, color: C.ink });
        txt(c, "logit[s, o] = Σ W[s, o, d] · x[d]", pad, H - 34, { size: 10, color: C.ink });
        txt(c, DE ? "192 Dot-Products · Softmax · Argmax" : "192 dot products · softmax · argmax", pad, H - 17, { size: 8.5, color: C.gold });
      } else {
        var topW = 96;
        var mw = W * .34;
        var mh = 190;
        drawActivationStrip(c, pad, topW, mw, 14);
        drawProbeMatrix(c, pad, topW + 22, mw, mh, sq);
        var lx = pad + mw + 18;
        drawLogitsColumn(c, lx, topW + 22, 54, mh, sq);
        var hsize = 80, hgap = 12;
        var hx2 = lx + 54 + 28;
        var hy2 = topW + 22;
        var labels2 = DE ? ["leer", "Spieler 1", "Spieler 2"] : ["empty", "player 1", "player 2"];
        for (var o2 = 0; o2 < 3; o2++) {
          txt(c, labels2[o2], hx2 + o2 * (hsize + hgap) + hsize / 2, hy2 - 10, { align: "center", size: 9, color: o2 === 1 ? C.gold : o2 === 2 ? C.ink : C.muted });
          drawProbGrid(c, hx2 + o2 * (hsize + hgap), hy2, hsize, o2, sq);
        }
        txt(c, DE ? "Softmax · 8 × 8 × 3" : "softmax · 8 × 8 × 3", hx2 + (3 * hsize + 2 * hgap) / 2, hy2 + hsize + 17, { align: "center", size: 9, color: C.muted });
        var bs2 = Math.min(W * .22, 170);
        var bx2 = hx2 + (3 * hsize + 2 * hgap) / 2 - bs2 / 2;
        var by2 = hy2 + hsize + 46;
        drawBoard(c, TRUTH, bx2, by2, bs2, { highlight: [r, col] });
        txt(c, DE ? "Argmax → Brett" : "argmax → board", bx2 + bs2 / 2, by2 - 12, { align: "center", size: 10, color: C.ink });
        drawRangeLine(c, pad, topW + 22 + mh + 54, mw, 18, probs, {});
        V.arrow(c, lx + 54 + 4, hy2 + mh * .5, hx2 - 8, hy2 + hsize * .5, V.alpha(C.gold, .35), 1.1, 5);
        txt(c, "logit[s, o] = Σ W[s, o, d] · x[d]", pad, H - 44, { size: 10.5, color: C.ink });
        txt(c, DE ? "192 Dot-Products · Softmax · Argmax" : "192 dot products · softmax · argmax", pad, H - 24, { size: 9, color: C.gold });
      }
      txt(c, DE ? "schematisch · Struktur des Readouts" : "schematic · structure of the readout", W - pad, 58, { align: "right", size: 8.5, color: C.muted });
    }

    function drawFlow(c, x1, y1, x2, y2) {
      var g = c.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, V.alpha(C.blue, .45));
      g.addColorStop(.5, V.alpha(C.lilac, .45));
      g.addColorStop(1, V.alpha(C.gold, .45));
      c.strokeStyle = g;
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.stroke();
    }

    function drawChevron(c, x, y, dir) {
      c.strokeStyle = V.alpha(C.petrol, .45);
      c.lineWidth = 1.2;
      c.beginPath();
      if (dir === "h") {
        c.moveTo(x - 4, y - 4);
        c.lineTo(x, y);
        c.lineTo(x - 4, y + 4);
      } else {
        c.moveTo(x - 4, y - 4);
        c.lineTo(x, y);
        c.lineTo(x + 4, y - 4);
      }
      c.stroke();
    }

    function drawLineNode(c, cx, cy, w) {
      var seg = w / 3;
      var labels = DE ? ["leer", "Spieler 1", "Spieler 2"] : ["empty", "player 1", "player 2"];
      var colors = [V.alpha(C.line, .45), C.ink, C.paper];
      for (var i = 0; i < 3; i++) {
        c.fillStyle = colors[i];
        c.fillRect(cx - w / 2 + i * seg, cy - 8, seg, 16);
        c.strokeStyle = i === 1 ? C.gold : V.alpha(C.lineStrong, .75);
        c.lineWidth = 1;
        c.strokeRect(cx - w / 2 + i * seg + .5, cy - 7.5, seg - 1, 15);
        txt(c, labels[i], cx - w / 2 + i * seg + seg / 2, cy - 19, { align: "center", size: 8.5, color: i === 1 ? C.gold : i === 2 ? C.ink : C.muted });
      }
    }

    function drawChessNode(c, cx, cy, radius) {
      var ang = [];
      for (var i = 0; i < 13; i++) ang.push(-Math.PI / 2 + i * Math.PI * 2 / 13);
      c.save();
      c.translate(cx, cy);
      c.rotate(-.18);
      c.beginPath();
      c.ellipse(0, 0, radius * 1.05, radius * .62, 0, 0, Math.PI * 2);
      c.fillStyle = V.alpha(C.lilac, .09);
      c.fill();
      c.strokeStyle = V.alpha(C.lilac, .55);
      c.lineWidth = 1;
      c.stroke();
      c.restore();
      for (var k = 0; k < 13; k++) {
        var a = ang[k] + state.t * .03;
        var rr = radius * (.55 + .30 * hash(k, 3, 5));
        var px = cx + Math.cos(a) * rr * 1.05;
        var py = cy + Math.sin(a) * rr * .62;
        c.beginPath();
        c.arc(px, py, k === 0 ? 3.4 : 2.1, 0, Math.PI * 2);
        c.fillStyle = k === 0 ? C.gold : V.alpha(C.lilac, .88);
        c.fill();
      }
      for (var q = 0; q < 7; q++) {
        var a1 = ang[q * 2 % 13] + state.t * .03;
        var a2 = ang[(q * 2 + 3) % 13] + state.t * .03;
        var r1 = radius * .70, r2 = radius * .70;
        c.strokeStyle = V.alpha(C.lilac, .20);
        c.lineWidth = .8;
        c.beginPath();
        c.moveTo(cx + Math.cos(a1) * r1 * 1.05, cy + Math.sin(a1) * r1 * .62);
        c.lineTo(cx + Math.cos(a2) * r2 * 1.05, cy + Math.sin(a2) * r2 * .62);
        c.stroke();
      }
    }

    function drawRealNode(c, cx, cy, radius) {
      var t = state.t * .12;
      var planes = [
        { rx: radius * 1.10, ry: radius * .38, a: t, color: C.lilac },
        { rx: radius * .90, ry: radius * .58, a: t + 1.1, color: C.sky },
        { rx: radius * 1.22, ry: radius * .28, a: t + 2.2, color: C.green }
      ];
      planes.forEach(function (pl) {
        c.save();
        c.translate(cx, cy);
        c.rotate(pl.a);
        c.beginPath();
        c.ellipse(0, 0, pl.rx, pl.ry, 0, 0, Math.PI * 2);
        c.fillStyle = V.alpha(pl.color, .075);
        c.fill();
        c.strokeStyle = V.alpha(pl.color, .55);
        c.lineWidth = 1;
        c.stroke();
        c.restore();
      });
      for (var i = 0; i < 30; i++) {
        var a = hash(i, 3, 1) * Math.PI * 2;
        var rr = hash(i, 5, 2) * radius * .95;
        c.beginPath();
        c.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .52, 1.15, 0, Math.PI * 2);
        c.fillStyle = V.alpha(i % 3 === 0 ? C.gold : C.petrol, .42);
        c.fill();
      }
    }

    function drawStep3(c) {
      var pad = Math.max(18, Math.min(26, W * .035));
      var narrow = W < 620;
      head(c, DE ? "Vom Feld zur realen Welt" : "From one square to the real world", pad, 34, { size: Math.min(28, Math.max(21, W * .036)) });
      txt(c, DE ? "Drei Zustände pro Feld. Dreizehn. Dann die ganze Welt." : "Three states per square. Thirteen. Then the whole world.", pad, 58, { size: 11.5, color: C.muted });
      accent(c, pad, 72, 42);
      if (narrow) {
        var cx = W * .5;
        var y1 = H * .24, y2 = H * .50, y3 = H * .76;
        drawFlow(c, cx, y1 - 40, cx, y3 + 40);
        drawChevron(c, cx, (y1 + y2) / 2, "v");
        drawChevron(c, cx, (y2 + y3) / 2, "v");
        drawLineNode(c, cx, y1, 220);
        txt(c, "Othello", cx, y1 + 56, { align: "center", size: 16, font: '700 16px "Barlow", "Open Sans", sans-serif', color: C.ink });
        txt(c, DE ? "3 Zustände · eine Linie" : "3 states · one line", cx, y1 + 74, { align: "center", size: 9.5, color: C.muted });
        drawChessNode(c, cx, y2, 72);
        txt(c, DE ? "Schach" : "Chess", cx, y2 + 78, { align: "center", size: 16, font: '700 16px "Barlow", "Open Sans", sans-serif', color: C.ink });
        txt(c, DE ? "13 Zustände · ein Unterraum" : "13 states · a subspace", cx, y2 + 96, { align: "center", size: 9.5, color: C.muted });
        drawRealNode(c, cx, y3, 72);
        txt(c, DE ? "Reale Modelle" : "Real models", cx, y3 + 78, { align: "center", size: 16, font: '700 16px "Barlow", "Open Sans", sans-serif', color: C.ink });
        txt(c, DE ? "viele Features · viele Unterräume" : "many features · many subspaces", cx, y3 + 96, { align: "center", size: 9.5, color: C.muted });
      } else {
        var cy = H * .52;
        var n1 = W * .18, n2 = W * .50, n3 = W * .82;
        drawFlow(c, pad + 40, cy, W - pad - 40, cy);
        drawChevron(c, (n1 + n2) / 2, cy + .5, "h");
        drawChevron(c, (n2 + n3) / 2, cy + .5, "h");
        drawLineNode(c, n1, cy, 180);
        txt(c, "Othello", n1, cy + 56, { align: "center", size: 17, font: '700 17px "Barlow", "Open Sans", sans-serif', color: C.ink });
        txt(c, DE ? "3 Zustände · eine Linie" : "3 states · one line", n1, cy + 75, { align: "center", size: 10, color: C.muted });
        drawChessNode(c, n2, cy, 90);
        txt(c, DE ? "Schach" : "Chess", n2, cy + 82, { align: "center", size: 17, font: '700 17px "Barlow", "Open Sans", sans-serif', color: C.ink });
        txt(c, DE ? "13 Zustände · ein Unterraum" : "13 states · a subspace", n2, cy + 101, { align: "center", size: 10, color: C.muted });
        drawRealNode(c, n3, cy, 90);
        txt(c, DE ? "Reale Modelle" : "Real models", n3, cy + 82, { align: "center", size: 17, font: '700 17px "Barlow", "Open Sans", sans-serif', color: C.ink });
        txt(c, DE ? "viele Features · viele Unterräume" : "many features · many subspaces", n3, cy + 101, { align: "center", size: 10, color: C.muted });
      }
      txt(c, DE ? "Das Othello-Brett ist der klare kleine Fall. Die reale Welt ist größer." : "The Othello board is the clear small case. The real world is larger.", W / 2, H - 18, { align: "center", size: 10, color: C.ink });
    }

    function draw() {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.paper2;
      ctx.fillRect(0, 0, W, H);
      var g = ctx.createRadialGradient(W * .78, H * .16, 0, W * .78, H * .16, Math.max(W, H) * .85);
      g.addColorStop(0, V.alpha(C.green, .065));
      g.addColorStop(.45, V.alpha(C.sky, .032));
      g.addColorStop(1, V.alpha(C.paper2, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = V.alpha(C.line, .75);
      ctx.lineWidth = 1;
      ctx.strokeRect(.5, .5, W - 1, H - 1);
      if (state.step === 0) drawStep0(ctx);
      else if (state.step === 1) drawStep1(ctx);
      else if (state.step === 2) drawStep2(ctx);
      else drawStep3(ctx);
    }

    function frame(now) {
      if (!state.running) return;
      if (!state.last) state.last = now;
      state.t += Math.min(.05, (now - state.last) / 1000);
      state.last = now;
      draw();
      state.raf = requestAnimationFrame(frame);
    }

    function start() {
      if (reduced || state.running) return;
      state.running = true;
      state.last = 0;
      state.raf = requestAnimationFrame(frame);
    }

    function stop() {
      state.running = false;
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = 0;
    }

    function fit() {
      var r = api.fit(canvas, host);
      W = r.w;
      H = r.h;
      ctx = r.ctx;
      probeCanvas = null;
      draw();
    }

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { fit(); });
      ro.observe(host);
    }
    window.addEventListener("resize", fit);
    fit();
    if (reduced) {
      state.t = 3.0 * (FRAMES.length - 1);
      draw();
    }
    return {
      update: function (s) {
        var next = (s && typeof s.step === "number") ? s.step : 0;
        if (next !== state.step) {
          state.step = next;
          state.t = reduced
            ? (next === 0 ? 3.0 * (FRAMES.length - 1) : next === 1 ? 1.5 * 6 : next === 2 ? 2.6 : .5)
            : 0;
          state.last = 0;
          canvas.setAttribute("aria-label", ARIA[Math.max(0, Math.min(3, next))]);
          draw();
        }
        start();
      },
      resize: fit,
      resume: start,
      pause: stop,
      destroy: function () {
        stop();
        window.removeEventListener("resize", fit);
        if (window.ResizeObserver && ro) ro.disconnect();
        host.remove();
      }
    };
  }

  core.register("worldmodel", worldModelScene);
})();
