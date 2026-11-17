(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var V = window.LearnSysVisuals;
  var DATA = {"moves":["c4","c5","d6","c7","b5","a5","e6","c3","b8","f7","b6","d8","c6","f4","g3","g4","e3","h2","g8","f6","f5","g5","g6","f3","d7","h6","f2","e8","c2","b4"],"att6":[[0.9083,0.0156,0.0001,0.0032,0.0,0.0012,0.0,0.001,0.0,0.0007,0.0,0.0009,0.0,0.0013,0.0,0.002,0.0,0.0056,0.0,0.0055,0.0,0.0052,0.0,0.0161,0.0,0.008,0.0001,0.0127,0.0002,0.0121],[0.4324,0.0039,0.0,0.0007,0.0,0.0002,0.0,0.0001,0.0,0.0006,0.0,0.0009,0.0,0.0017,0.0,0.0023,0.0,0.003,0.0,0.0143,0.0,0.0333,0.0,0.0125,0.0002,0.1013,0.0,0.3689,0.0003,0.0234],[0.7841,0.0034,0.0034,0.0001,0.0014,0.0,0.0018,0.0,0.0012,0.0,0.0014,0.0,0.0033,0.0,0.0043,0.0,0.0125,0.0,0.0085,0.0001,0.0259,0.0001,0.0239,0.0002,0.0128,0.0001,0.0474,0.0,0.0639,0.0001],[0.4514,0.0007,0.0,0.0002,0.0,0.0001,0.0,0.0002,0.0,0.0002,0.0,0.0004,0.0,0.0009,0.0,0.0027,0.0,0.0102,0.0,0.0091,0.0,0.0254,0.0001,0.0526,0.0001,0.1339,0.0001,0.2484,0.0001,0.063],[0.5156,0.0005,0.0,0.0001,0.0,0.0002,0.0,0.0002,0.0,0.0005,0.0,0.0003,0.0,0.0009,0.0,0.0034,0.0,0.002,0.0,0.0195,0.0,0.0437,0.0001,0.1484,0.0003,0.0832,0.0004,0.0672,0.0009,0.1127],[0.1344,0.0221,0.0209,0.0001,0.0061,0.0,0.0052,0.0,0.0025,0.0,0.0032,0.0,0.005,0.0001,0.0118,0.0001,0.0112,0.0001,0.0215,0.0002,0.0609,0.0002,0.0596,0.0003,0.1368,0.0005,0.0913,0.0012,0.4042,0.0004],[0.2663,0.01,0.0002,0.0022,0.0,0.0013,0.0,0.0007,0.0,0.0018,0.0,0.005,0.0,0.0051,0.0001,0.01,0.0,0.0101,0.0001,0.2011,0.0001,0.0204,0.0001,0.0166,0.0008,0.0686,0.0001,0.2212,0.0016,0.1565],[0.9467,0.0007,0.0,0.0003,0.0,0.0005,0.0,0.0003,0.0,0.0004,0.0,0.0008,0.0,0.0012,0.0,0.001,0.0,0.002,0.0,0.0066,0.0,0.0146,0.0,0.0018,0.0,0.0024,0.0,0.0034,0.0,0.017]],"acc":[0.828,0.844,0.953,0.969,1.0,1.0,1.0,0.906],"truth":[0,1,0,-1,-1,0,1,0,0,0,1,-1,0,-1,0,0,0,-1,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,-1,0,0,-1,-1,-1,-1,1,-1,0,0,0,1,0,1,1,-1,0,0,0,1,0,0,1,0,-1,0,0,0,0,0,0,0,0],"boards":[[0,0,0,-1,-1,0,1,0,0,0,-1,-1,0,-1,0,0,0,1,-1,-1,1,1,1,-1,-1,-1,-1,1,-1,-1,0,0,0,-1,-1,-1,-1,-1,-1,0,0,0,1,0,1,1,-1,0,0,0,1,0,0,1,0,-1,0,0,0,0,0,0,0,0],[0,0,0,-1,-1,0,0,0,0,0,-1,-1,0,-1,0,0,0,1,-1,1,1,1,1,-1,-1,-1,-1,-1,-1,1,-1,0,0,-1,-1,-1,-1,-1,-1,0,0,0,1,0,1,1,-1,0,0,0,1,0,0,1,0,-1,0,0,0,0,0,0,0,0],[0,0,0,-1,-1,0,1,0,0,0,-1,-1,0,-1,0,0,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,-1,0,0,-1,-1,-1,-1,1,-1,0,0,0,1,0,1,1,-1,0,0,0,1,0,0,1,0,-1,0,0,0,0,0,0,0,0],[0,1,0,-1,-1,0,1,0,0,0,-1,-1,0,-1,0,0,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,-1,0,0,-1,-1,-1,-1,1,-1,0,0,0,1,0,1,1,-1,0,0,0,1,0,0,1,0,-1,0,0,0,0,0,0,0,0],[0,1,0,-1,-1,0,1,0,0,0,1,-1,0,-1,0,0,0,-1,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,-1,0,0,-1,-1,-1,-1,1,-1,0,0,0,1,0,1,1,-1,0,0,0,1,0,0,1,0,-1,0,0,0,0,0,0,0,0],[0,1,0,-1,-1,0,1,0,0,0,1,-1,0,-1,0,0,0,-1,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,-1,0,0,-1,-1,-1,-1,1,-1,0,0,0,1,0,1,1,-1,0,0,0,1,0,0,1,0,-1,0,0,0,0,0,0,0,0],[0,1,0,-1,-1,0,1,0,0,0,1,-1,0,-1,0,0,0,-1,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,-1,0,0,-1,-1,-1,-1,1,-1,0,0,0,1,0,1,1,-1,0,0,0,1,0,0,1,0,-1,0,0,0,0,0,0,0,0],[-1,1,0,-1,-1,0,1,0,0,0,1,-1,0,-1,0,0,0,-1,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,-1,0,0,-1,-1,-1,-1,1,-1,0,0,0,1,0,1,1,-1,0,1,1,1,0,0,1,1,-1,-1,0,-1,0,0,0,0,0]],"e4":[-20.441,4.204,-2.592],"x":[12,-13,21,17,42,84,-51,-38,45,-9,-15,-53,29,-11,2,43,16,-25,-85,52,21,21,21,37,-15,41,15,-40,49,9,83,51,15,75,4,-84,-20,48,-57,15,-7,-21,28,14,-107,76,86,-3,-54,6,15,33,-49,1,14,-17,55,-15,-7,-32,33,9,86,35,-6,70,-80,17,-19,18,101,-58,-41,-12,-49,-61,-51,-34,-20,14,-45,16,-23,38,-11,-10,-9,-30,-1,6,-79,-63,-11,64,-52,20,3,-26,-29,-5,-81,35,38,-53,-9,14,-39,34,5,21,-7,55,50,2,0,-14,-21,68,76,-84,-39,-106,-46,-3,35,-62,-27,15,51,-59,-8,7,0,-45,-1,1,16,-34,-36,18,1,15,24,-20,5,36,48,23,-35,0,-4,-2,-1,45,-20,-15,21,37,32,3,19,-23,33,-4,-79,24,-61,-1,2,29,27,-29,28,-4,2,-46,-36,18,49,22,-51,46,38,-40,13,-10,-5,-127,17,-13,-29,37,-8,-5,-27,-32,-1,3,-11,19,39,44,-31,-32,37,41,-14,-13,1,37,-21,-32,19,44,22,51,-16,-71,-32,0,37,-3,29,45,27,-29,9,-61,70,-66,84,-27,-31,18,10,14,14,13,-49,27,2,31,1,52,-70,25,-15,20,-50,-62,10,28,-52,-48,-20,41,-39,0,24,-11,40,6,-24,-21,14,108,14,30,34,-98,-55,-14,-27,-7,-9,9,30,44,21,39,1,14,11,-3,-21,-20,0,36,15,12,26,-6,1,11,-60,16,12,-2,10,13,0,-50,-12,-22,-12,1,1,70,-26,-50,13,-5,-37,-8,23,-59,-58,-38,2,31,32,-4,-69,-46,12,-57,11,-5,-77,-22,-22,15,-11,40,39,-11,46,-93,-13,68,-33,-46,91,0,-9,-16,-13,-84,56,-53,-3,33,64,-80,-17,25,-33,19,40,7,-61,-5,10,6,70,2,-21,-59,15,9,-34,9,8,-61,-22,-33,7,20,-35,15,42,-24,-20,-29,6,38,31,27,15,7,50,28,13,48,-16,-52,28,-4,-63,-22,71,23,54,-22,-8,-75,21,84,-46,55,-4,-45,-21,-26,-37,98,-57,-22,-14,4,-58,-33,-43,-5,-37,84,-2,-49,-51,-9,93,-1,40,-10,105,-24,-3,-14,65,1,50,15,32,-19,-18,93,-5,-8,1,20,-64,-7,46,46,-26,8,-7,-17,-64,18,126,1,34,-57,-3,14,24,-15,-7,16,-38,33,59,-12,-13,-7,-40,-17,19,42,40,-48,-8,30,30,-16,-36,22,34,20,13,-17,65,51,-2,-9,-77,-1,-28,58,6,-7,-9,10,-33,-27,99,6,-57,-18,-13,7],"logits":[[[4.362,-1.432,-3.416],[-5.176,-2.593,4.711],[27.884,-4.021,-10.112],[-8.829,4.414,-0.295],[-17.833,7.853,-0.619],[22.243,-8.479,-6.241],[-9.908,-0.888,7.29],[10.519,-5.839,-8.364]],[[16.625,-8.197,-15.236],[12.646,-2.68,-4.252],[-20.052,0.469,4.764],[-17.295,7.136,-1.968],[24.99,-4.173,-6.879],[-23.133,6.708,-0.499],[30.815,-4.736,-7.779],[22.223,-10.689,-10.046]],[[25.505,-2.843,-12.059],[-9.046,7.263,-0.916],[-20.615,-1.432,6.786],[-9.898,4.799,-2.377],[-19.848,4.331,-1.719],[-19.411,6.077,-0.785],[-8.063,4.776,-3.625],[-8.323,6.069,-1.767]],[[-15.21,8.86,-1.411],[-10.661,4.125,-2.42],[-26.501,5.95,-0.932],[-20.609,3.784,-2.408],[-19.474,5.64,-1.549],[-19.298,-2.045,4.23],[-7.424,4.108,-2.53],[25.64,-6.31,-8.521]],[[26.332,-4.463,-8.223],[-12.77,4.956,-2.025],[-21.981,5.992,0.218],[-21.247,2.069,-3.1],[-20.441,4.204,-2.592],[-11.624,-0.223,4.588],[-5.221,3.943,-2.688],[19.498,-4.574,-7.246]],[[8.243,-4.529,-1.532],[33.078,-5.538,-4.88],[-11.928,-2.485,3.74],[26.849,-2.367,-3.731],[-13.936,-1.622,3.852],[-15.629,0.191,6.98],[-8.39,3.474,-2.882],[19.012,-7.21,-7.722]],[[4.632,-4.17,-1.851],[9.694,-3.158,0.288],[-9.155,-1.911,3.394],[9.307,-2.581,-0.578],[7.776,-3.932,-2.519],[-7.539,-2.634,4.007],[5.388,-4.56,-1.164],[-2.528,3.665,-1.594]],[[3.051,-1.643,-4.719],[7.807,-0.06,-5.257],[3.048,-1.334,-2.758],[7.579,-0.989,-2.794],[9.004,-2.82,-3.934],[7.4,-3.52,-0.744],[4.587,-3.599,-5.646],[5.223,-4.282,-2.239]]]};

  if (!document.getElementById("ls-wm-style")) {
    var st = document.createElement("style");
    st.id = "ls-wm-style";
    st.textContent = ".ls-wm-scene{position:relative;width:100%;height:100%;min-height:380px;border-radius:14px;overflow:hidden;background:var(--tm-paper-2,#f7f9f8)}.ls-wm-scene canvas{display:block;width:100%;height:100%}";
    document.head.appendChild(st);
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
      "Othello-Brett mit Zugfolge und umgedrehten Scheiben",
      "Acht Schichten mit Attention, MLP und Probe-Readout",
      "Linearer Probe projiziert eine 512-dimensionale Aktivierung auf ein Brett",
      "Eine Richtung für mein/dein und ein Kreis für Wochentage"
    ] : [
      "Othello board with move history and flipped discs",
      "Eight layers with attention, MLP and probe readout",
      "Linear probe projects a 512-dimensional activation onto a board",
      "One direction for mine/yours and a circle for weekdays"
    ];
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", ARIA[0]);
    var W = 1, H = 1;
    var state = { step: 0, t: 0, running: false, raf: 0, last: 0 };
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    var INIT = (function () {
      var b = [];
      for (var r = 0; r < 8; r++) { b.push([0, 0, 0, 0, 0, 0, 0, 0]); }
      b[3][3] = 1; b[3][4] = -1; b[4][3] = -1; b[4][4] = 1;
      return b;
    })();
    var FRAMES = buildFrames();

    function rr(c, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }
    function T(c, text, x, y, o) {
      V.label(c, text, x, y, Object.assign({
        font: '600 12px "Open Sans", "Segoe UI", sans-serif',
        color: C.soft,
        bg: false,
        size: 12
      }, o || {}));
    }
    function chip(c, text, x, y, w, h, on) {
      rr(c, x, y, w, h, 5);
      c.fillStyle = on ? V.alpha(C.gold, .18) : V.alpha(C.paper, .74);
      c.fill();
      c.strokeStyle = on ? C.gold : C.line;
      c.lineWidth = 1;
      c.stroke();
      T(c, text, x + w / 2, y + h / 2 + .5, { align: "center", size: 10, color: on ? C.ink : C.muted, bg: false });
    }
    function copyBoard(b) { return b.map(function (row) { return row.slice(); }); }
    function legal(b, player) {
      var out = [];
      for (var r = 0; r < 8; r++) {
        for (var col = 0; col < 8; col++) {
          if (b[r][col] !== 0) continue;
          var flips = [];
          for (var d = 0; d < DIRS.length; d++) {
            var dr = DIRS[d][0], dc = DIRS[d][1];
            var rr2 = r + dr, cc = col + dc, buf = [];
            while (rr2 >= 0 && rr2 < 8 && cc >= 0 && cc < 8 && b[rr2][cc] === -player) {
              buf.push([rr2, cc]); rr2 += dr; cc += dc;
            }
            if (buf.length && rr2 >= 0 && rr2 < 8 && cc >= 0 && cc < 8 && b[rr2][cc] === player) {
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
        var f = move.flips[i]; b[f[0]][f[1]] = player;
      }
    }
    function buildFrames() {
      var b = copyBoard(INIT), player = 1, frames = [{ board: copyBoard(b), move: null, player: player, next: 1 }];
      DATA.moves.forEach(function (m) {
        var r = 8 - parseInt(m[1], 10), c = m.toUpperCase().charCodeAt(0) - 65;
        var moves = legal(b, player);
        var mv = null;
        for (var i = 0; i < moves.length; i++) if (moves[i].r === r && moves[i].c === c) mv = moves[i];
        if (!mv) { player = -player; return; }
        apply(b, mv, player);
        frames.push({ board: copyBoard(b), move: mv, player: player, next: -player });
        player = -player;
      });
      return frames;
    }
    function disc(c, x, y, rad, v, scaleX) {
      var sx = typeof scaleX === "number" ? scaleX : 1;
      if (rad < .5) return;
      c.save();
      c.translate(x, y);
      c.scale(sx, 1);
      c.beginPath();
      c.arc(0, 0, rad, 0, Math.PI * 2);
      c.fillStyle = v === 1 ? C.ink : C.paper;
      c.fill();
      c.strokeStyle = v === 1 ? C.teal : C.gold;
      c.lineWidth = Math.max(1, rad * .09);
      c.stroke();
      c.beginPath();
      c.arc(-rad * .24, -rad * .24, rad * .38, 0, Math.PI * 2);
      c.fillStyle = v === 1 ? V.alpha(C.paper, .12) : V.alpha(C.paper, .75);
      c.fill();
      c.restore();
    }
    function board(c, b, x, y, S, opt) {
      var o = opt || {};
      var cell = S / 8;
      rr(c, x - 5, y - 5, S + 10, S + 10, 8);
      c.fillStyle = C.petrol;
      c.fill();
      c.strokeStyle = V.alpha(C.paper, .18);
      c.lineWidth = 1;
      c.stroke();
      for (var r = 0; r < 8; r++) {
        for (var col = 0; col < 8; col++) {
          if ((r + col) % 2 === 0) {
            c.fillStyle = V.alpha(C.paper, .035);
            c.fillRect(x + col * cell, y + r * cell, cell, cell);
          }
          c.strokeStyle = V.alpha(C.paper, .16);
          c.strokeRect(x + col * cell, y + r * cell, cell, cell);
        }
      }
      for (var i = 0; i < 8; i++) {
        T(c, String.fromCharCode(65 + i), x + i * cell + cell / 2, y - 13, { align: "center", size: 9, color: V.alpha(C.paper, .62) });
        T(c, String(8 - i), x - 13, y + i * cell + cell / 2, { align: "right", size: 9, color: V.alpha(C.paper, .62) });
      }
      for (var r2 = 0; r2 < 8; r2++) {
        for (var c2 = 0; c2 < 8; c2++) {
          var v = b[r2][c2];
          if (v === 0) continue;
          var scale = 1;
          if (o.pulse && o.pulse.some(function (f) { return f[0] === r2 && f[1] === c2; })) {
            scale = .10 + .90 * Math.abs(Math.cos((o.local || 0) * Math.PI));
          }
          disc(c, x + c2 * cell + cell / 2, y + r2 * cell + cell / 2, cell * .34, v, scale);
        }
      }
      if (o.legal) {
        for (var k = 0; k < o.legal.length; k++) {
          var mv = o.legal[k];
          var lx = x + mv.c * cell + cell / 2, ly = y + mv.r * cell + cell / 2;
          c.strokeStyle = C.lime;
          c.lineWidth = 1.3;
          c.beginPath();
          c.arc(lx, ly, cell * .13, 0, Math.PI * 2);
          c.stroke();
        }
      }
      if (o.last) {
        var lrx = x + o.last.c * cell + cell / 2, lry = y + o.last.r * cell + cell / 2;
        c.strokeStyle = C.gold;
        c.lineWidth = 2;
        c.beginPath();
        c.arc(lrx, lry, cell * .44, 0, Math.PI * 2);
        c.stroke();
      }
      if (o.wrong) {
        for (var j = 0; j < o.wrong.length; j++) {
          var wr = o.wrong[j][0], wc = o.wrong[j][1];
          c.fillStyle = V.alpha(C.lilac, .36);
          c.fillRect(x + wc * cell + 1.5, y + wr * cell + 1.5, cell - 3, cell - 3);
          c.strokeStyle = V.alpha(C.lilac, .9);
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(x + wc * cell + cell * .3, y + wr * cell + cell * .3);
          c.lineTo(x + wc * cell + cell * .7, y + wr * cell + cell * .7);
          c.moveTo(x + wc * cell + cell * .7, y + wr * cell + cell * .3);
          c.lineTo(x + wc * cell + cell * .3, y + wr * cell + cell * .7);
          c.stroke();
        }
      }
      if (o.highlight) {
        c.strokeStyle = C.gold;
        c.lineWidth = 2;
        c.strokeRect(x + o.highlight[1] * cell + 1, y + o.highlight[0] * cell + 1, cell - 2, cell - 2);
      }
    }
    function wrongCells(b, truth) {
      var out = [];
      for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) if (b[r][c] !== truth[r][c]) out.push([r, c]);
      return out;
    }

    function drawStep0(c) {
      var S = Math.min(W * .62, H * .68);
      var bx = W * .5 - S / 2, by = H * .54 - S / 2;
      T(c, "Othello / Reversi", 18, 22, { size: 15, color: C.ink, font: '700 15px "Barlow", sans-serif' });
      T(c, DE ? "Die Welt ist das Brett" : "The world is the board", 18, 40, { size: 11, color: C.muted });
      var idx = Math.floor(state.t / 1.5) % FRAMES.length;
      var f = FRAMES[idx];
      var local = (state.t / 1.5) % 1;
      var legalMoves = legal(f.board, f.next);
      board(c, f.board, bx, by, S, {
        legal: legalMoves,
        last: f.move,
        pulse: f.move ? f.move.flips : null,
        local: local
      });
      var label = f.move ? f.move.label : (DE ? "Start" : "start");
      T(c, (DE ? "Zug " : "move ") + idx + " · " + label, W * .5, by + S + 24, { align: "center", size: 12, color: C.ink, bg: C.paper, bgAlpha: .9 });
      T(c, DE ? "64 Felder: leer, schwarz, weiß" : "64 squares: empty, black, white", W * .5, by + S + 42, { align: "center", size: 10, color: C.muted });
      var start = Math.max(0, idx - 5);
      for (var i = start; i <= idx; i++) {
        var mv = FRAMES[i].move;
        chip(c, mv ? mv.label : "·", 18 + (i - start) * 38, H - 30, 32, 18, i === idx);
      }
    }

    function drawStep1(c) {
      T(c, DE ? "8 Schichten · 8 Heads" : "8 layers · 8 heads", 18, 22, { size: 15, color: C.ink, font: '700 15px "Barlow", sans-serif' });
      T(c, DE ? "Zug-Tokens hinein, Brett-Zustand heraus" : "move tokens in, board state out", 18, 40, { size: 11, color: C.muted });
      var tokens = DATA.moves.slice(-8);
      for (var i = 0; i < tokens.length; i++) chip(c, tokens[i], 18 + i * 34, 54, 29, 17, i === tokens.length - 1);
      T(c, DE ? "letzte 8 von 30 Tokens" : "last 8 of 30 tokens", 18, 78, { size: 9, color: C.muted });
      var layer = Math.floor(state.t / 1.4) % 8;
      var leftX = 18, leftY = 100, leftW = W * .36, rowH = Math.min(34, (H - leftY - 28) / 8);
      for (var l = 0; l < 8; l++) {
        var y = leftY + l * rowH;
        var on = l === layer;
        rr(c, leftX, y, leftW, rowH - 4, 5);
        c.fillStyle = on ? V.alpha(C.gold, .16) : V.alpha(C.paper, .55);
        c.fill();
        c.strokeStyle = on ? C.gold : C.line;
        c.lineWidth = 1;
        c.stroke();
        T(c, "L" + (l + 1), leftX + 7, y + rowH / 2 - 2, { size: 9, color: on ? C.ink : C.muted });
        for (var hI = 0; hI < 8; hI++) {
          var hx = leftX + 30 + hI * 8;
          c.beginPath();
          c.arc(hx, y + rowH / 2 - 2, 1.8, 0, Math.PI * 2);
          c.fillStyle = on ? C.teal : V.alpha(C.teal, .35);
          c.fill();
        }
        rr(c, leftX + leftW - 48, y + 7, 40, Math.max(8, rowH - 18), 3);
        c.fillStyle = V.alpha(C.blue, on ? .16 : .07);
        c.fill();
        T(c, "MLP", leftX + leftW - 28, y + rowH / 2 - 2, { align: "center", size: 7.5, color: on ? C.blue : C.muted });
      }
      T(c, DE ? "Residualstrom 512" : "residual stream 512", leftX, leftY + 8 * rowH + 6, { size: 9, color: C.muted });
      var S = Math.min(W * .28, H * .38);
      var bx = W * .58, by = H * .38;
      var truth = [];
      for (var r = 0; r < 8; r++) truth.push(DATA.truth.slice(r * 8, r * 8 + 8));
      var b = [];
      for (var r2 = 0; r2 < 8; r2++) b.push(DATA.boards[layer].slice(r2 * 8, r2 * 8 + 8));
      var wrong = wrongCells(b, truth);
      board(c, b, bx, by, S, { wrong: wrong, highlight: [4, 4] });
      T(c, "L" + (layer + 1) + " · " + (DATA.acc[layer] * 100).toFixed(1) + "%", bx + S / 2, by + S + 18, { align: "center", size: 11, color: DATA.acc[layer] >= .95 ? C.green : C.gold, bg: C.paper, bgAlpha: .9 });
      T(c, DE ? "Probe-Readout (L6 transferiert)" : "probe readout (L6 transferred)", bx + S / 2, by + S + 35, { align: "center", size: 9, color: C.muted });
      var aw = W * .36, ah = Math.min(H * .20, 110), ax = W * .58, ay = 68;
      T(c, DE ? "Attention L6 (echt)" : "attention L6 (real)", ax, ay - 10, { size: 10, color: C.ink });
      for (var hr = 0; hr < 8; hr++) {
        var maxRow = Math.max.apply(null, DATA.att6[hr]);
        for (var hc = 0; hc < DATA.att6[hr].length; hc++) {
          var v = Math.pow(DATA.att6[hr][hc] / maxRow, .55);
          c.fillStyle = V.mix(C.paper2, C.teal, v);
          c.fillRect(ax + hc * (aw / 30), ay + hr * (ah / 8), aw / 30 - 1, ah / 8 - 1);
        }
      }
      T(c, DE ? "Head 1–8 · Zug 1–30" : "head 1–8 · move 1–30", ax, ay + ah + 12, { size: 8, color: C.muted });
    }

    function drawStep2(c) {
      T(c, DE ? "64 × 3 Logits werden ein Brett" : "64 × 3 logits become a board", 18, 22, { size: 15, color: C.ink, font: '700 15px "Barlow", sans-serif' });
      T(c, DE ? "Der Probe liest die 512-dim Aktivierung" : "the probe reads the 512-dim activation", 18, 40, { size: 11, color: C.muted });
      var xw = W * .38, xh = Math.min(76, H * .16), xx = 18, xy = 56;
      T(c, DE ? "x: 512 Dimensionen" : "x: 512 dimensions", xx, xy - 10, { size: 9, color: C.muted });
      for (var i = 0; i < 512; i++) {
        var v = DATA.x[i] / 127;
        var col = v >= 0 ? V.mix(C.paper2, C.blue, v) : V.mix(C.paper2, C.green, -v);
        var gx = xx + (i % 32) * (xw / 32);
        var gy = xy + Math.floor(i / 32) * (xh / 16);
        c.fillStyle = col;
        c.fillRect(gx, gy, xw / 32 - .8, xh / 16 - .8);
      }
      var tx = 18, ty = H * .30, tw = W * .34, th = 84;
      T(c, DE ? "Probe: 64 × 3 × 512" : "probe: 64 × 3 × 512", tx, ty - 10, { size: 9, color: C.muted });
      for (var z = 2; z >= 0; z--) {
        rr(c, tx + z * 4, ty + z * 4, tw, th, 6);
        c.fillStyle = V.alpha(C.paper, .72);
        c.fill();
        c.strokeStyle = z === 0 ? C.gold : C.line;
        c.lineWidth = 1;
        c.stroke();
      }
      T(c, "W[s, o, d]", tx + tw / 2, ty + th / 2, { align: "center", size: 13, color: C.ink });
      T(c, DE ? "für jedes Feld s, Zustand o" : "for every square s, state o", tx + tw / 2, ty + th / 2 + 18, { align: "center", size: 9, color: C.muted });
      var lx = W * .58, ly = H * .30, lw = W * .35, lh = Math.min(H * .34, 200);
      T(c, DE ? "64 × 3 Softmax" : "64 × 3 softmax", lx, ly - 10, { size: 9, color: C.muted });
      if (lw > 210) T(c, DE ? "Farbe = Softmax; Argmax = Brett" : "color = softmax; argmax = board", lx + lw, ly - 10, { align: "right", size: 8, color: C.muted });
      var cell = Math.min(lw / 8, lh / 8);
      for (var r = 0; r < 8; r++) {
        for (var col = 0; col < 8; col++) {
          var p = V.softmax(DATA.logits[r][col]);
          var maxP = Math.max(p[0], p[1], p[2], 1e-6);
          for (var o = 0; o < 3; o++) {
            var v2 = p[o] / maxP;
            var colr = o === 0 ? C.blue : o === 1 ? C.gold : C.ink;
            c.fillStyle = V.mix(C.paper2, colr, Math.min(1, v2));
            c.fillRect(lx + col * cell + o * (cell / 3), ly + r * cell, cell / 3 - .8, cell - .8);
          }
          if (r === 4 && col === 4) {
            c.strokeStyle = C.gold;
            c.lineWidth = 1.6;
            c.strokeRect(lx + col * cell - 1, ly + r * cell - 1, cell + 2, cell + 2);
          }
        }
      }
      T(c, DE ? "leer · weiß · schwarz" : "empty · white · black", lx, ly + lh + 12, { size: 8, color: C.muted });
      var S = Math.min(W * .24, H * .30);
      var bx = W * .58, by = H * .76 - S / 2;
      var truth = [];
      for (var r2 = 0; r2 < 8; r2++) truth.push(DATA.truth.slice(r2 * 8, r2 * 8 + 8));
      board(c, truth, bx, by, S, { highlight: [4, 4] });
      T(c, "E4: −20.4 / +4.2 / −2.6 → " + (DE ? "weiß" : "white"), bx + S / 2, by + S + 16, { align: "center", size: 9.5, color: C.ink, bg: C.paper, bgAlpha: .9 });
      T(c, "logit[s,o] = Σ W[s,o,d] · x[d]", 18, H - 18, { size: 10, color: C.ink });
      T(c, DE ? "192 Dot-Products, 64 Argmaxes" : "192 dot products, 64 argmaxes", W * .58, H - 18, { size: 10, color: C.gold });
    }

    function drawStep3(c) {
      T(c, DE ? "Richtungen reichen hier, aber nicht immer" : "directions suffice here, but not always", 18, 22, { size: 15, color: C.ink, font: '700 15px "Barlow", sans-serif' });
      T(c, DE ? "eine Linie für mein/dein; ein Kreis für Wochentage" : "one line for mine/yours; a circle for weekdays", 18, 40, { size: 11, color: C.muted });
      var ax = 24, ay = H * .34, aw = W * .40;
      T(c, DE ? "eine Richtung: w_black − w_white" : "one direction: w_black − w_white", ax, ay - 28, { size: 9, color: C.ink });
      c.strokeStyle = C.lineStrong;
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + aw, ay); c.stroke();
      T(c, DE ? "dein" : "yours", ax, ay + 16, { size: 9, color: C.lilac });
      T(c, DE ? "mein" : "mine", ax + aw, ay + 16, { align: "right", size: 9, color: C.green });
      var proj = DATA.e4[2] - DATA.e4[1];
      var px = ax + aw * .5 + (proj / 10) * aw * .45;
      c.strokeStyle = C.gold;
      c.lineWidth = 4;
      c.beginPath(); c.moveTo(ax + aw * .5, ay); c.lineTo(px, ay); c.stroke();
      c.beginPath(); c.arc(px, ay, 6, 0, Math.PI * 2); c.fillStyle = C.gold; c.fill();
      T(c, "E4", px, ay - 14, { align: "center", size: 9, color: C.ink, bg: C.paper, bgAlpha: .9 });
      var cx = W * .72, cy = H * .34, R = Math.min(W * .16, H * .22);
      T(c, DE ? "ein Kreis: Wochentage" : "a circle: weekdays", cx, cy - R - 20, { align: "center", size: 9, color: C.ink });
      c.strokeStyle = C.line;
      c.lineWidth = 1;
      c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
      var days = DE ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
      for (var i = 0; i < 7; i++) {
        var a = -Math.PI / 2 + i * Math.PI * 2 / 7;
        var dx = cx + Math.cos(a) * R, dy = cy + Math.sin(a) * R;
        c.beginPath(); c.arc(dx, dy, 3, 0, Math.PI * 2); c.fillStyle = C.lilac; c.fill();
        T(c, days[i], cx + Math.cos(a) * (R + 14), cy + Math.sin(a) * (R + 14), { align: "center", size: 8, color: C.soft });
      }
      var ptr = state.t * .35;
      c.strokeStyle = C.gold;
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ptr) * R, cy + Math.sin(ptr) * R); c.stroke();
      var by = H * .70, bw = W * .38;
      T(c, DE ? "128 von 512 Dimensionen" : "128 of 512 dimensions", ax, by - 10, { size: 9, color: C.ink });
      c.fillStyle = V.alpha(C.line, .6); c.fillRect(ax, by, bw, 10);
      c.fillStyle = C.green; c.fillRect(ax, by, bw * .25, 10);
      T(c, "25%", ax + bw * .25 + 6, by + 5, { size: 8, color: C.green });
      T(c, DE ? "40% der Varianz dieser Aktivierung" : "40% of this activation's variance", ax, by + 32, { size: 9, color: C.ink });
      c.fillStyle = V.alpha(C.line, .6); c.fillRect(ax, by + 42, bw, 10);
      c.fillStyle = C.gold; c.fillRect(ax, by + 42, bw * .40, 10);
      T(c, "40%", ax + bw * .40 + 6, by + 47, { size: 8, color: C.gold });
      T(c, DE ? "Nicht jede Richtung reicht: manche Features brauchen einen ganzen Unterraum." : "Not every direction is enough: some features need a whole subspace.", ax, H - 22, { size: 10, color: C.ink });
    }

    function draw() {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);
      rr(ctx, 0, 0, W, H, 14);
      ctx.fillStyle = C.paper2;
      ctx.fill();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.stroke();
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
      W = r.w; H = r.h; ctx = r.ctx;
      draw();
    }
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { fit(); });
      ro.observe(host);
    }
    window.addEventListener("resize", fit);
    fit();
    if (reduced) { state.t = 2.2; draw(); }
    return {
      update: function (s) {
        var next = (s && typeof s.step === "number") ? s.step : 0;
        if (next !== state.step) {
          state.step = next;
          state.t = reduced ? (next === 0 ? 2.2 : next === 1 ? .5 : 0) : 0;
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
