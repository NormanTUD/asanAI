(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var V = window.LearnSysVisuals;
  var lastPhase = 0;
  var DATA = {
    moves: ["c4", "c5", "d6", "c7", "b5", "a5", "e6", "c3", "b8", "f7", "b6", "d8", "c6", "f4", "g3", "g4", "e3", "h2", "g8", "f6", "f5", "g5", "g6", "f3", "d7", "h6", "f2", "e8", "c2", "b4"],
    acc: [0.909, 0.948, 0.972, 0.983, 0.990, 0.994, 0.996, 0.995]
  };
  var DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

  if (!document.getElementById("ls-wm-style")) {
    var st = document.createElement("style");
    st.id = "ls-wm-style";
    st.textContent = ".ls-wm-scene{position:relative;width:100%;height:100%;min-height:380px;overflow:hidden;background:var(--tm-paper-2,#f7f9f8)}.ls-wm-scene canvas{display:block;width:100%;height:100%}.ls-wm-tip{position:absolute;z-index:8;max-width:240px;padding:6px 8px;background:rgba(255,255,255,.97);border:1px solid var(--tm-line-strong,#b9c8c3);box-shadow:0 10px 26px rgba(0,20,30,.14);font:400 11px/1.35 'Open Sans',sans-serif;color:var(--tm-ink,#000);pointer-events:none}.ls-wm-tip[hidden]{display:none}.ls-wm-play{position:absolute;right:12px;bottom:12px;z-index:9;border:1px solid var(--tm-line-strong,#b9c8c3);background:var(--tm-green,#63a44b);color:#fff;padding:7px 11px;font:600 12px 'Open Sans',sans-serif;cursor:pointer}.ls-wm-play:hover{background:var(--tm-petrol,#004b6f)}.ls-wm-game-status{position:absolute;left:14px;bottom:14px;z-index:9;max-width:min(52%,420px);font:600 11px/1.4 'Open Sans',sans-serif;color:var(--tm-ink,#000);background:rgba(255,255,255,.92);border:1px solid var(--tm-line,#b9c8c3);padding:6px 8px}";
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
    var tip = document.createElement("div");
    tip.className = "ls-wm-tip";
    tip.hidden = true;
    host.appendChild(tip);
    var playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "ls-wm-play";
    playBtn.textContent = DE ? "Spielen" : "Play";
    host.appendChild(playBtn);
    var gameStatus = document.createElement("div");
    gameStatus.className = "ls-wm-game-status";
    gameStatus.hidden = true;
    host.appendChild(gameStatus);
    var wmFormula = document.createElement("div");
    wmFormula.className = "ls-wm-formula";
    wmFormula.hidden = true;
    host.appendChild(wmFormula);
    root.appendChild(host);
    var ctx = canvas.getContext("2d");
    var ARIA = DE ? [
      "Schematisches Othello-Brett mit schwarzen und weißen Scheiben",
      "Fünf Schritte vom L6-Residualstrom über Dot-Product und Softmax zum Brett",
      "Drei Logits pro Feld für Othello, ein Unterraum für Schach und viele überlagerte Unterräume für reale Modelle"
    ] : [
      "Schematic Othello board with black and white discs",
      "Five steps from the L6 residual stream through dot product and softmax to the board",
      "Three logits per square for Othello, a subspace for chess, and many overlapping subspaces for real models"
    ];
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", ARIA[0]);
    var W = 1, H = 1;
    var state = { step: 0, phase: 0, t: 0, running: false, raf: 0, last: 0 };
    var hoverHits = [];
    function addHit(x, y, w, h, text) {
      if (w > 0 && h > 0) hoverHits.push({ x: x, y: y, w: w, h: h, text: text });
    }
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var FRAMES = buildFrames();
    var TRUTH = FRAMES[FRAMES.length - 1].board;
    var game = { active: false, board: null, player: 1, history: [], busy: false, winner: 0, last: null, rect: null, fire: [], fireStart: 0, raf: 0 };
    function freshBoard() {
      var b = [], i;
      for (i = 0; i < 8; i++) b.push([0, 0, 0, 0, 0, 0, 0, 0]);
      b[3][3] = 1; b[3][4] = -1; b[4][3] = -1; b[4][4] = 1;
      return b;
    }
    function startGame() {
      stop();
      if (game.raf) cancelAnimationFrame(game.raf);
      game.raf = 0;
      game.active = true;
      game.board = freshBoard();
      game.player = 1;
      game.history = [];
      game.busy = false;
      game.winner = 0;
      game.last = null;
      game.fire = [];
      gameStatus.hidden = false;
      gameStatus.textContent = DE ? "Du spielst Schwarz. Goldene Punkte sind gültige Züge; klicke auf ein Feld." : "You play black. Gold dots are valid moves; click a square.";
      playBtn.textContent = DE ? "Neu starten" : "Restart";
      draw();
    }
    function gameEnd() {
      var p = 0, o = 0;
      for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) { if (game.board[r][c] === 1) p++; else if (game.board[r][c] === -1) o++; }
      game.winner = p > o ? 1 : p < o ? -1 : 0;
      gameStatus.textContent = game.winner === 1
        ? (DE ? "Du gewinnst " + p + " : " + o + "!" : "You win " + p + " : " + o + "!")
        : game.winner === -1
          ? (DE ? "Der Computer gewinnt " + o + " : " + p + "." : "The computer wins " + o + " : " + p + ".")
          : (DE ? "Unentschieden " + p + " : " + o + "." : "Draw " + p + " : " + o + ".");
      if (game.winner === 1) {
        game.fire = Array.from({ length: 42 }, function (_, i) { return { x: hash(i, 1, 2), y: hash(i, 3, 4), vx: (hash(i, 5, 6) - 0.5) * 0.18, vy: -0.2 - hash(i, 7, 8) * 0.25, c: i % 3 }; });
        game.fireStart = performance.now();
        if (game.raf) cancelAnimationFrame(game.raf);
        game.raf = requestAnimationFrame(fireFrame);
      } else {
        draw();
      }
    }
    function fireFrame(now) {
      if (now - game.fireStart > 1700) { game.raf = 0; game.fire = []; draw(); return; }
      draw();
      game.raf = requestAnimationFrame(fireFrame);
    }
    function aiMove() {
      if (!game.active || game.winner) return;
      var moves = legal(game.board, -1);
      if (!moves.length) {
        game.player = 1;
        game.busy = false;
        var own = legal(game.board, 1);
        if (!own.length) gameEnd();
        else {
          gameStatus.textContent = DE ? "Der Computer hat keine Züge. Du bist wieder dran." : "The computer has no moves. It is your turn again.";
          draw();
        }
        return;
      }
      moves.sort(function (a, b) { return b.flips.length - a.flips.length; });
      var mv = moves[Math.floor(Math.random() * Math.min(2, moves.length))];
      apply(game.board, mv, -1);
      game.history.push(mv.label);
      game.last = [mv.r, mv.c];
      game.player = 1;
      game.busy = false;
      var nextMoves = legal(game.board, 1);
      if (!nextMoves.length) {
        var oppMoves = legal(game.board, -1);
        if (!oppMoves.length) gameEnd();
        else {
          game.busy = true;
          gameStatus.textContent = DE ? "Du hast keine Züge. Der Computer ist am Zug." : "You have no moves. The computer is playing.";
          draw();
          setTimeout(aiMove, 520);
          return;
        }
      } else {
        gameStatus.textContent = DE ? "Du bist am Zug. " + nextMoves.length + " gültige Züge." : "Your turn. " + nextMoves.length + " valid moves.";
      }
      draw();
    }
    function playAt(x, y) {
      if (!game.active || game.busy || game.winner || game.player !== 1 || !game.rect) return;
      var cell = game.rect.S / 8;
      var c = Math.floor((x - game.rect.x) / cell), r = Math.floor((y - game.rect.y) / cell);
      if (r < 0 || r > 7 || c < 0 || c > 7) return;
      var moves = legal(game.board, 1), mv = null;
      for (var i = 0; i < moves.length; i++) if (moves[i].r === r && moves[i].c === c) mv = moves[i];
      if (!mv) return;
      apply(game.board, mv, 1);
      game.history.push(mv.label);
      game.last = [r, c];
      game.player = -1;
      game.busy = true;
      gameStatus.textContent = DE ? "Computer denkt …" : "Computer is thinking …";
      draw();
      setTimeout(aiMove, 520);
    }
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

    var lastWmFormula = "";
    function setWmFormula(tex) {
      if (tex === lastWmFormula) return;
      lastWmFormula = tex;
      if (!tex) { wmFormula.hidden = true; wmFormula.innerHTML = ""; return; }
      var safe = String(tex).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
      wmFormula.hidden = false;
      wmFormula.innerHTML = '<span class="ls-math" data-tex="' + safe + '" data-tex-display="true"><code class="ls-tex-source">' + safe + '</code></span>';
      if (window.TM && typeof window.TM.typesetMath === "function") {
        try { window.TM.typesetMath(wmFormula); } catch (e) {}
      }
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
          if (typeof opt.reveal === "number" && r * 8 + col > opt.reveal) continue;
          var sIdx = v === 0 ? 0 : v === 1 ? 1 : 2;
          addHit(x + col * cell, y + r * cell, cell, cell,
            (DE ? "Feld " : "square ") + squareLabel(r * 8 + col) + ": " + stateName(sIdx));
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
      if (typeof opt.highlightRow === "number" && opt.highlightRow >= 0) {
        c.fillStyle = V.alpha(C.gold, .08);
        c.fillRect(x, y + opt.highlightRow * cell, S, cell);
        c.strokeStyle = C.gold;
        c.lineWidth = 2;
        c.strokeRect(x + 1, y + opt.highlightRow * cell + 1, S - 2, cell - 2);
      }
      if (opt.highlight) {
        c.fillStyle = V.alpha(C.gold, .10);
        c.fillRect(x + opt.highlight[1] * cell + 1, y + opt.highlight[0] * cell + 1, cell - 2, cell - 2);
        c.strokeStyle = C.gold;
        c.lineWidth = 2;
        c.strokeRect(x + opt.highlight[1] * cell + 1, y + opt.highlight[0] * cell + 1, cell - 2, cell - 2);
      }
      if (opt.last) {
        c.strokeStyle = C.gold; c.lineWidth = 2;
        c.strokeRect(x + opt.last[1] * cell + 1, y + opt.last[0] * cell + 1, cell - 2, cell - 2);
      }
      if (opt.legal) {
        opt.legal.forEach(function (mv) {
          c.beginPath(); c.arc(x + mv.c * cell + cell / 2, y + mv.r * cell + cell / 2, Math.max(2.5, cell * .12), 0, Math.PI * 2);
          c.fillStyle = V.alpha(C.gold, .75); c.fill();
          c.strokeStyle = C.paper; c.lineWidth = 1; c.stroke();
        });
      }
      if (opt.labels) {
        c.fillStyle = C.muted; c.font = '600 ' + Math.max(8, cell * .26) + 'px "Open Sans", sans-serif';
        c.textAlign = "center"; c.textBaseline = "top";
        for (var lc = 0; lc < 8; lc++) c.fillText(String.fromCharCode(65 + lc), x + lc * cell + cell / 2, y + S + 4);
        c.textAlign = "right"; c.textBaseline = "middle";
        for (var lr = 0; lr < 8; lr++) c.fillText(String(8 - lr), x - 5, y + lr * cell + cell / 2);
      }
      c.restore();
    }

    function squareLabel(i) {
      return String.fromCharCode(65 + (i % 8)) + (8 - Math.floor(i / 8));
    }

    function scoresFor(i) {
      var r = Math.floor(i / 8), c = i % 8;
      var v = TRUTH[r][c];
      var idx = v === 0 ? 0 : v === 1 ? 1 : 2;
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

    function winIndex(values) {
      var best = 0;
      for (var i = 1; i < values.length; i++) if (values[i] > values[best]) best = i;
      return best;
    }

    function drawRangeLine(c, x, y, w, h, probs, opts) {
      var o = opts || {};
      var labels = DE ? ["leer", "mein Spieler", "Gegner"] : ["empty", "my player", "opponent"];
      var colors = [V.alpha(C.line, .42), C.ink, C.paper];
      var seg = w / 3;
      var win = winIndex(probs);
      for (var i = 0; i < 3; i++) {
        c.fillStyle = colors[i];
        c.fillRect(x + i * seg, y, seg, h);
        c.strokeStyle = i === win ? C.gold : V.alpha(C.lineStrong, .75);
        c.lineWidth = i === win ? 2 : 1;
        c.strokeRect(x + i * seg + .5, y + .5, seg - 1, h - 1);
        addHit(x + i * seg, y, seg, h, (DE ? "Zustand " : "state ") + labels[i] + ": " + Math.round(probs[i] * 100) + "%");
        txt(c, labels[i], x + i * seg + seg / 2, y - 19, {
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

    function drawGame(c) {
      var pad = Math.max(18, Math.min(28, W * .035));
      var narrow = W < 620;
      head(c, DE ? "Othello spielen" : "Play Othello", pad, 34, { size: Math.min(28, Math.max(22, W * .038)) });
      txt(c, DE ? "Du: Schwarz · Computer: Weiß" : "You: black · computer: white", pad, 58, { size: 11, color: C.muted });
      var black = 0, white = 0;
      for (var sr = 0; sr < 8; sr++) for (var sc = 0; sc < 8; sc++) { if (game.board[sr][sc] === 1) black++; else if (game.board[sr][sc] === -1) white++; }
      txt(c, DE ? "Du " + black + " · Computer " + white : "You " + black + " · Computer " + white, narrow ? pad : W - pad, narrow ? 84 : 58, { align: narrow ? "left" : "right", size: 12, color: C.ink, font: '700 12px "Barlow", "Open Sans", sans-serif' });
      accent(c, pad, 72, 40);
      var boardS = Math.min(narrow ? W * .70 : W * .54, H * .62);
      var bx = narrow ? (W - boardS) / 2 + 10 : W * .50 - boardS / 2;
      var by = Math.max(100, (H - boardS) / 2 + 18);
      game.rect = { x: bx, y: by, S: boardS };
      var moves = game.player === 1 ? legal(game.board, 1) : [];
      drawBoard(c, game.board, bx, by, boardS, { labels: true, legal: moves, last: game.last });
      var hy = by + boardS + 24;
      var label = game.winner === 1 ? (DE ? "Du gewinnst!" : "You win!") : game.winner === -1 ? (DE ? "Computer gewinnt" : "Computer wins") : (DE ? "Dein Zug" : "Your move");
      txt(c, label, bx + boardS / 2, hy, { align: "center", size: 12, color: game.winner === 1 ? C.green : C.ink });
      if (!narrow) {
        var lx = Math.min(W - pad - 150, bx + boardS + 22);
        var ly = by + 8;
        txt(c, DE ? "Was das Modell sieht" : "What the model sees", lx, ly, { size: 9, color: C.muted });
        var shown = game.history.slice(-10);
        for (var i = 0; i < shown.length; i++) {
          txt(c, (i % 2 === 0 ? "● " : "○ ") + shown[i], lx, ly + 20 + i * 18, { size: 10, color: i === shown.length - 1 ? C.petrol : C.soft });
        }
        if (!shown.length) txt(c, DE ? "noch keine Züge" : "no moves yet", lx, ly + 20, { size: 9, color: C.muted });
      }
      if (game.fire.length) {
        var p = Math.min(1, (performance.now() - game.fireStart) / 1700);
        game.fire.forEach(function (f) {
          var fx = bx + boardS * (0.15 + f.x * 0.7) + f.vx * p * 300;
          var fy = by + boardS * (0.15 + f.y * 0.5) + f.vy * p * 300 + 120 * p * p;
          c.globalAlpha = 1 - p;
          c.fillStyle = [C.gold, C.green, C.lilac][f.c];
          c.beginPath(); c.arc(fx, fy, 2.5, 0, Math.PI * 2); c.fill();
          c.globalAlpha = 1;
        });
        txt(c, DE ? "Gewonnen!" : "You win!", bx + boardS / 2, by + boardS * .45, { align: "center", size: 26, color: C.gold, font: '700 26px "Barlow", "Open Sans", sans-serif' });
      }
    }

    function drawStep0(c) {
      setWmFormula("");
      if (game.active) { drawGame(c); return; }
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
      if (!narrow) {
        var listX = pad;
        var listY = 106;
        var listW = Math.max(110, bx - pad - 26);
        var seen = Math.min(idx, DATA.moves.length);
        var show = Math.min(7, seen);
        txt(c, DE ? "Was das Modell sieht: nur Züge" : "What the model sees: moves only", listX, listY - 8, {
          size: 9.4,
          color: C.muted
        });
        if (!show) {
          txt(c, DE ? "noch keine Züge" : "no moves yet", listX, listY + 14, { size: 9, color: C.muted });
        }
        for (var mi = 0; mi < show; mi++) {
          var moveIdx = seen - show + mi;
          var my = listY + 8 + mi * 22;
          var isLast = moveIdx === seen - 1;
          c.fillStyle = isLast ? V.alpha(C.gold, .16) : V.alpha(C.paper, .72);
          c.fillRect(listX, my, listW, 18);
          c.strokeStyle = isLast ? C.gold : V.alpha(C.lineStrong, .85);
          c.lineWidth = isLast ? 1.6 : 1;
          c.strokeRect(listX + .5, my + .5, listW - 1, 17);
          addHit(listX, my, listW, 18, (DE ? "Zug " : "move ") + DATA.moves[moveIdx]);
          txt(c, DATA.moves[moveIdx], listX + 8, my + 9, {
            size: 9.4,
            font: '700 9.4px "Barlow", "Open Sans", sans-serif',
            color: isLast ? C.ink : C.soft
          });
          if (isLast) {
            txt(c, DE ? "aktuell" : "current", listX + listW - 7, my + 9, {
              align: "right",
              size: 7.4,
              color: C.petrol
            });
          }
        }
        if (show) {
          var arrowY = listY + 8 + show * 11;
          V.arrow(c, listX + listW + 4, arrowY, bx - 8, arrowY, V.alpha(C.petrol, .62), 1.2, 5);
          txt(c, DE ? "Zugfolge" : "move stream", listX + listW + 6, arrowY - 8, {
            size: 7.6,
            color: C.petrol
          });
        }
      }
      var cy = by + boardS + 22;
      txt(c, DE ? "8 × 8 · schematisch" : "8 × 8 · schematic", bx + boardS / 2, cy, { align: "center", size: 10, color: C.muted });
      txt(c, DE ? "leer · mein Spieler · Gegner" : "empty · my player · opponent", bx + boardS / 2, cy + 18, {
        align: "center",
        size: 11,
        color: C.ink
      });
      var gy = Math.min(cy + 58, H - 20);
      txt(c, DE ? "Ein Brett, das niemand dem Modell zeigt." : "A board the model is never shown.", pad, gy, { size: 11, color: C.soft });
      if (narrow) {
        var seenN = Math.min(idx, DATA.moves.length);
        var tail = DATA.moves.slice(Math.max(0, seenN - 4), seenN).join(" · ");
        txt(c, (DE ? "gesehen: " : "seen: ") + (tail || "–"), pad, Math.min(gy + 20, H - 6), {
          size: 8.6,
          color: C.petrol
        });
      }
    }

    function mixRgb(a, b, t) {
      var A = V.rgb(a), B = V.rgb(b), u = Math.max(0, Math.min(1, t));
      return [
        Math.round(A[0] + (B[0] - A[0]) * u),
        Math.round(A[1] + (B[1] - A[1]) * u),
        Math.round(A[2] + (B[2] - A[2]) * u)
      ];
    }

    function stateName(idx) {
      return DE ? ["leer", "mein Spieler", "Gegner"][idx] : ["empty", "my player", "opponent"][idx];
    }

    function probeDir(sq, stateIdx, d) {
      var s = sq * 3 + stateIdx;
      var base = hash(s + 3, d + 7, 13) * 2 - 1;
      var band = Math.exp(-Math.pow((d - ((s * 37) % 512)) / 38, 2));
      return base * .55 + band * .95;
    }

    function drawStrip(c, values, x, y, w, h, pos, neg, tip) {
      var n = values.length;
      var max = 0;
      for (var i = 0; i < n; i++) max = Math.max(max, Math.abs(values[i]));
      max = max || 1;
      for (var k = 0; k < n; k++) {
        var v = values[k] / max;
        var col = v >= 0 ? mixRgb(C.paper2, pos, Math.abs(v)) : mixRgb(C.paper2, neg, Math.abs(v));
        c.fillStyle = "rgb(" + col.join(",") + ")";
        c.fillRect(x + k * (w / n), y, w / n + .45, h);
      }
      c.strokeStyle = V.alpha(C.lineStrong, .5);
      c.lineWidth = 1;
      c.strokeRect(x + .5, y + .5, w - 1, h - 1);
      var chunk = Math.max(1, Math.ceil(n / 32));
      for (var hi = 0; hi < n; hi += chunk) {
        var hend = Math.min(n - 1, hi + chunk - 1);
        var hmid = Math.floor((hi + hend) / 2);
        var htext = (tip ? tip + " · " : "") + (DE ? "Dimension " : "dimension ") + hi + "–" + hend + ": " + V.fmt(values[hmid], 2);
        addHit(x + hi / n * w, y, Math.max(1, (hend - hi + 1) / n * w), h, htext);
      }
    }

    function drawActivationStrip(c, x, y, w, h, label) {
      txt(c, label || "x · 512", x, y - 10, { size: 9.5, color: C.muted });
      drawStrip(c, X, x, y, w, h, C.blue, C.green, (DE ? "Aktivierung " : "activation ") + (label || "x"));
    }

    function drawActivationGrid(c, x, y, w, h) {
      var cols = 32, rows = 16;
      var cw = w / cols, ch = h / rows;
      for (var i = 0; i < 512; i++) {
        var v = X[i];
        var col = v >= 0
          ? mixRgb(C.paper2, C.blue, .10 + .55 * Math.abs(v))
          : mixRgb(C.paper2, C.green, .10 + .45 * Math.abs(v));
        c.fillStyle = "rgb(" + col.join(",") + ")";
        c.fillRect(x + (i % cols) * cw, y + Math.floor(i / cols) * ch, cw + .4, ch + .4);
      }
      c.strokeStyle = V.alpha(C.lineStrong, .55);
      c.lineWidth = 1;
      c.strokeRect(x + .5, y + .5, w - 1, h - 1);
      for (var gi = 0; gi < 512; gi++) {
        addHit(x + (gi % cols) * cw, y + Math.floor(gi / cols) * ch, cw, ch,
          (DE ? "Aktivierung x[" : "activation x[") + gi + "] = " + V.fmt(X[gi], 2));
      }
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
      for (var ls = 0; ls < 64; ls++) {
        for (var lo = 0; lo < 3; lo++) {
          addHit(x + lo * cw, y + ls * ch, cw, ch,
            (DE ? "Feld " : "square ") + squareLabel(ls) + " · " + stateName(lo) + " · Logit " + V.fmt(SCORES[ls][lo], 2));
        }
      }
      var ry = y + (row + .5) * ch;
      c.strokeStyle = C.gold;
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(x, ry);
      c.lineTo(x + w, ry);
      c.stroke();
      txt(c, "64 × 3", x + w / 2, y - 10, { align: "center", size: 9.5, color: C.muted });
    }

    function drawProbGrid(c, x, y, size, stateIdx, row) {
      var cell = size / 8;
      for (var r = 0; r < 8; r++) {
        for (var col = 0; col < 8; col++) {
          var p = PROBS[r * 8 + col][stateIdx];
          var tint = stateIdx === 0 ? C.blue : stateIdx === 1 ? C.gold : C.ink;
          c.fillStyle = V.mix(C.paper2, tint, Math.min(1, p * 1.05));
          c.fillRect(x + col * cell, y + r * cell, cell, cell);
          c.strokeStyle = V.alpha(C.line, .18);
          c.strokeRect(x + col * cell + .5, y + r * cell + .5, cell - 1, cell - 1);
        }
      }
      c.strokeStyle = V.alpha(C.lineStrong, .65);
      c.lineWidth = 1;
      c.strokeRect(x + .5, y + .5, size - 1, size - 1);
      for (var pr = 0; pr < 8; pr++) {
        for (var pc = 0; pc < 8; pc++) {
          var pi = pr * 8 + pc;
          addHit(x + pc * cell, y + pr * cell, cell, cell,
            (DE ? "Feld " : "square ") + squareLabel(pi) + " · " + stateName(stateIdx) + ": " + (PROBS[pi][stateIdx] * 100).toFixed(1) + "%");
        }
      }
      if (typeof row === "number") {
        c.strokeStyle = C.gold;
        c.lineWidth = 1.8;
        c.strokeRect(x + (row % 8) * cell + .5, y + Math.floor(row / 8) * cell + .5, cell - 1, cell - 1);
      }
    }

    function drawStageDots(c, phase) {
      var n = 6;
      var labels = DE ? ["x", "Probe", "Σ", "Softmax", "Feld", "Brett"] : ["x", "probe", "Σ", "softmax", "square", "board"];
      var small = W < 620;
      var railW = Math.min(W - 2 * (small ? 22 : 48), 620);
      var x0 = W / 2 - railW / 2;
      var y = H - 24;
      c.save();
      c.strokeStyle = V.alpha(C.lineStrong, .7);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(x0, y);
      c.lineTo(x0 + railW, y);
      c.stroke();
      c.restore();
      for (var i = 0; i < n; i++) {
        var nx = x0 + railW * i / (n - 1);
        var done = i < phase;
        var active = i === phase;
        c.save();
        c.fillStyle = active ? C.gold : done ? C.petrol : C.paper;
        c.strokeStyle = active ? C.gold : done ? C.petrol : V.alpha(C.lineStrong, .9);
        c.lineWidth = active ? 2 : 1;
        c.beginPath();
        c.arc(nx, y, active ? 5 : 4, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.restore();
        txt(c, labels[i], nx, y - 15, {
          align: "center",
          size: small ? 6.8 : 7.8,
          color: active ? C.ink : done ? C.petrol : C.muted,
          font: (active ? '700 ' : '600 ') + (small ? 6.8 : 7.8) + 'px "Open Sans", sans-serif'
        });
      }
      txt(c, phase >= 5 ? (DE ? "fertig" : "done") : (DE ? "Schritt " + (phase + 1) + " / 6" : "step " + (phase + 1) + " / 6"), W - (small ? 22 : 48), y + 14, {
        align: "right",
        size: 8,
        color: C.muted
      });
    }

    function drawResultTile(c, x, y, size, stateIdx) {
      c.fillStyle = C.paper;
      c.fillRect(x, y, size, size);
      c.strokeStyle = V.alpha(C.lineStrong, .75);
      c.lineWidth = 1;
      c.strokeRect(x + .5, y + .5, size - 1, size - 1);
      if (stateIdx === 0) {
        c.strokeStyle = V.alpha(C.muted, .55);
        c.lineWidth = 1.2;
        c.setLineDash([4, 4]);
        c.beginPath();
        c.arc(x + size / 2, y + size / 2, size * .27, 0, Math.PI * 2);
        c.stroke();
        c.setLineDash([]);
      } else {
        drawDisc(c, x + size / 2, y + size / 2, size * .30, stateIdx === 1 ? 1 : -1, 1);
      }
      txt(c, stateName(stateIdx), x + size / 2, y + size + 17, { align: "center", size: 11, color: C.ink });
      addHit(x, y, size, size + 22, (DE ? "Ergebnis: " : "result: ") + stateName(stateIdx));
    }

    function drawStep1(c) {
      var pad = Math.max(18, Math.min(26, W * .035));
      var narrow = W < 620;
      var phase = state.phase || 0;
      if (phase < 2) setWmFormula("");
      var e4 = 36;
      var scores = SCORES[e4];
      var probs = PROBS[e4];
      var e4State = winIndex(scores);
      var boardSize = narrow ? 150 : 210;
      var boardX = narrow ? (W - boardSize) / 2 : W - pad - boardSize;
      var boardY = narrow ? 330 : 132;
      var questions = DE ? [
        ["Was ist die Aktivierung?", "Der Zustand nach Schicht 6: 512 Zahlen pro Token."],
        ["Was macht die Probe pro Feld?", "Für jedes Feld und jeden Zustand eine eigene Richtung."],
        ["Wie entsteht ein Score?", "Skalarprodukt: Zahl für Zahl multiplizieren und summieren."],
        ["Warum Softmax?", "Drei Scores werden zu drei Wahrscheinlichkeiten; Argmax wählt."],
        ["Wie wird daraus ein Feld?", "Drei Wahrscheinlichkeiten pro Feld. Argmax wählt die größte."],
        ["Und das ganze Brett?", "Dasselbe für alle 64 Felder; das Ergebnis ist das Brett."]
      ] : [
        ["What is the activation?", "The state after layer 6: 512 numbers per token."],
        ["What does the probe do per square?", "For every square and state it learns a different direction."],
        ["How does a score arise?", "Dot product: multiply number by number, then sum."],
        ["Why softmax?", "Three scores become three probabilities; argmax picks one."],
        ["How does that become a square?", "Three probabilities per square. Argmax picks the largest."],
        ["And the whole board?", "The same for all 64 squares; the result is the board."]
      ];
      head(c, DE ? "Vom Zug zum Brett" : "From move to board", pad, 34, { size: Math.min(28, Math.max(21, W * .036)) });
      txt(c, questions[phase][0], pad, 60, { size: narrow ? 13 : 15, font: '700 ' + (narrow ? 13 : 15) + 'px "Barlow", "Open Sans", sans-serif', color: C.ink });
      txt(c, questions[phase][1], pad, 78, { size: 10.2, color: C.muted });
      if (phase === 0) {
        var bx = pad, by = 100;
        c.fillStyle = C.petrol;
        c.fillRect(bx, by, 34, 18);
        addHit(bx, by, 34, 18, DE ? "L6: die Aktivierung nach Schicht 6; 512 Zahlen pro Token" : "L6: the activation after layer 6; 512 numbers per token");
        txt(c, "L6", bx + 17, by + 9, { align: "center", size: 10, color: "#fff" });
        drawActivationStrip(c, bx + 44, by, W - 2 * pad - 44, 16, "x · 512");
        var gw = Math.min(W - 2 * pad, narrow ? 340 : 400);
        var gh = gw / 2;
        drawActivationGrid(c, pad, 140, gw, gh);
        txt(c, "32 × 16 = 512", pad, 140 + gh + 16, { size: 9, color: C.muted });
        txt(c, "x ∈ ℝ^512", pad, H - 48, { size: 11, color: C.ink });
      } else if (phase === 1) {
        drawActivationStrip(c, pad, 100, W - 2 * pad, 12, "x · 512");
        var dirs = [];
        for (var o = 0; o < 3; o++) {
          var dir = [];
          for (var d = 0; d < 512; d++) dir.push(probeDir(e4, o, d));
          dirs.push(dir);
        }
        if (narrow) {
          for (var o2 = 0; o2 < 3; o2++) {
            txt(c, stateName(o2), pad, 132 + o2 * 52, { size: 9, color: o2 === 1 ? C.gold : o2 === 2 ? C.ink : C.muted });
            drawStrip(c, dirs[o2], pad, 140 + o2 * 52, W - 2 * pad, 14, C.blue, C.gold, (DE ? "Probe-Richtung für " : "probe direction for ") + stateName(o2) + (DE ? ": 512 gelernte Gewichte" : ": 512 learned weights"));
          }
          var bs = boardSize, bx2 = boardX, by2 = boardY;
          drawBoard(c, TRUTH, bx2, by2, bs, { highlight: [4, 4] });
          txt(c, "Feld E4", bx2 + bs / 2, by2 - 12, { align: "center", size: 10, color: C.ink });
        } else {
          for (var o3 = 0; o3 < 3; o3++) {
            txt(c, stateName(o3), pad, 148 + o3 * 42, { size: 9, color: o3 === 1 ? C.gold : o3 === 2 ? C.ink : C.muted });
            drawStrip(c, dirs[o3], pad + 80, 140 + o3 * 42, W * .48, 16, C.blue, C.gold, (DE ? "Probe-Richtung für " : "probe direction for ") + stateName(o3) + (DE ? ": 512 gelernte Gewichte" : ": 512 learned weights"));
          }
          var bs2 = boardSize, bx3 = boardX, by3 = boardY;
          drawBoard(c, TRUTH, bx3, by3, bs2, { highlight: [4, 4] });
          txt(c, "Feld E4", bx3 + bs2 / 2, by3 - 12, { align: "center", size: 10, color: C.ink });
        }
        txt(c, "W[E4, z] ∈ ℝ^512", pad, H - 48, { size: 11, color: C.ink });
      } else if (phase === 2) {
        drawActivationStrip(c, pad, 100, W - 2 * pad, 12, "x · 512");
        if (narrow) {
          for (var o4 = 0; o4 < 3; o4++) {
            var gy = 130 + o4 * 70;
            var dir4 = [], prod4 = [];
            for (var d4 = 0; d4 < 512; d4++) {
              var v4 = probeDir(e4, o4, d4);
              dir4.push(v4);
              prod4.push(X[d4] * v4);
            }
            txt(c, stateName(o4), pad, gy, { size: 9, color: o4 === 1 ? C.gold : o4 === 2 ? C.ink : C.muted });
            txt(c, "Σ = " + V.fmt(scores[o4], 1), W - pad, gy, { align: "right", size: 12, font: '700 12px "Barlow", "Open Sans", sans-serif', color: o4 === 1 ? C.gold : o4 === 2 ? C.ink : C.muted });
            drawStrip(c, dir4, pad, gy + 10, W - 2 * pad, 12, C.blue, C.gold, (DE ? "Probe-Richtung W[E4, " : "probe row W[E4, ") + stateName(o4) + "]: 512 Werte");
            drawStrip(c, prod4, pad, gy + 26, W - 2 * pad, 12, C.blue, C.green, DE ? "Produkt x · W[E4, " + stateName(o4) + "]: Beitrag zum Logit" : "product x · W[E4, " + stateName(o4) + "]: contribution to the logit");
          }
          var bsP = boardSize, bxP = boardX, byP = boardY;
          drawBoard(c, TRUTH, bxP, byP, bsP, { highlight: [4, 4] });
          txt(c, "Feld E4", bxP + bsP / 2, byP - 12, { align: "center", size: 10, color: C.ink });
        } else {
          for (var o5 = 0; o5 < 3; o5++) {
            var gy2 = 140 + o5 * 60;
            var dir5 = [], prod5 = [];
            for (var d5 = 0; d5 < 512; d5++) {
              var v5 = probeDir(e4, o5, d5);
              dir5.push(v5);
              prod5.push(X[d5] * v5);
            }
            txt(c, stateName(o5), pad, gy2 + 16, { size: 9, color: o5 === 1 ? C.gold : o5 === 2 ? C.ink : C.muted });
            drawStrip(c, dir5, pad + 80, gy2, W * .42, 14, C.blue, C.gold, (DE ? "Probe-Richtung W[E4, " : "probe row W[E4, ") + stateName(o5) + "]: 512 Werte");
            drawStrip(c, prod5, pad + 80, gy2 + 18, W * .42, 14, C.blue, C.green, DE ? "Produkt x · W[E4, " + stateName(o5) + "]: Beitrag zum Logit" : "product x · W[E4, " + stateName(o5) + "]: contribution to the logit");
            txt(c, "Σ = " + V.fmt(scores[o5], 1), pad + 80 + W * .42 + 12, gy2 + 16, { size: 12, font: '700 12px "Barlow", "Open Sans", sans-serif', color: o5 === 1 ? C.gold : o5 === 2 ? C.ink : C.muted });
          }
          var bs4 = boardSize, bx4 = boardX, by4 = boardY;
          drawBoard(c, TRUTH, bx4, by4, bs4, { highlight: [4, 4] });
          txt(c, "Feld E4", bx4 + bs4 / 2, by4 - 12, { align: "center", size: 10, color: C.ink });
        }
        setWmFormula("\\operatorname{logit}[E4,z] = \\sum_d W[E4,z,d]\\,x[d]");
      } else if (phase === 3) {
        if (narrow) {
          var colW = (W - 2 * pad) / 3;
          for (var o6 = 0; o6 < 3; o6++) {
            var cx = pad + o6 * colW;
            var tint = o6 === 1 ? C.gold : o6 === 2 ? C.ink : C.blue;
            txt(c, stateName(o6), cx + colW / 2, 110, { align: "center", size: 9.5, color: o6 === 1 ? C.gold : o6 === 2 ? C.ink : C.muted });
            txt(c, V.fmt(scores[o6], 1), cx + colW / 2, 132, { align: "center", size: 18, font: '700 18px "Barlow", "Open Sans", sans-serif', color: C.ink });
            var barW = 22, barH = 100, barX = cx + colW / 2 - barW / 2, barY = 250;
            c.fillStyle = V.alpha(C.line, .35);
            c.fillRect(barX, barY - barH, barW, barH);
            var fill = barH * probs[o6];
            c.fillStyle = tint;
            c.fillRect(barX, barY - fill, barW, fill);
            txt(c, (probs[o6] * 100).toFixed(0) + "%", cx + colW / 2, barY + 16, { align: "center", size: 10, color: tint });
          }
          drawRangeLine(c, pad, 400, W - 2 * pad, 16, probs, { small: true });
          var bs5 = boardSize, bx5 = boardX, by5 = boardY;
          drawBoard(c, TRUTH, bx5, by5, bs5, { highlight: [4, 4] });
          txt(c, "Feld E4", bx5 + bs5 / 2, by5 - 12, { align: "center", size: 10, color: C.ink });
        } else {
          var colW2 = W * .13;
          for (var o7 = 0; o7 < 3; o7++) {
            var cx2 = pad + o7 * (colW2 + 22);
            var tint2 = o7 === 1 ? C.gold : o7 === 2 ? C.ink : C.blue;
            txt(c, stateName(o7), cx2 + colW2 / 2, 115, { align: "center", size: 10, color: o7 === 1 ? C.gold : o7 === 2 ? C.ink : C.muted });
            txt(c, V.fmt(scores[o7], 1), cx2 + colW2 / 2, 140, { align: "center", size: 20, font: '700 20px "Barlow", "Open Sans", sans-serif', color: C.ink });
            var barW2 = 24, barH2 = 110, barX2 = cx2 + colW2 / 2 - barW2 / 2, barY2 = 270;
            c.fillStyle = V.alpha(C.line, .35);
            c.fillRect(barX2, barY2 - barH2, barW2, barH2);
            var fill2 = barH2 * probs[o7];
            c.fillStyle = tint2;
            c.fillRect(barX2, barY2 - fill2, barW2, fill2);
            txt(c, (probs[o7] * 100).toFixed(0) + "%", cx2 + colW2 / 2, barY2 + 16, { align: "center", size: 10, color: tint2 });
          }
          drawRangeLine(c, pad, 320, W * .45, 20, probs, {});
          var bs6 = boardSize, bx6 = boardX, by6 = boardY;
          drawBoard(c, TRUTH, bx6, by6, bs6, { highlight: [4, 4] });
          txt(c, "Feld E4", bx6 + bs6 / 2, by6 - 12, { align: "center", size: 10, color: C.ink });
        }
        txt(c, DE ? "Softmax normiert die drei Scores. Argmax nimmt den größten Wert." : "Softmax normalises the three scores. Argmax takes the largest value.", pad, H - 64, { size: 9.2, color: C.soft });
        setWmFormula("p[E4,z] = \\operatorname{softmax}(\\operatorname{logit}[E4,\\cdot])_z");
      } else if (phase === 4) {
        var stateIdx = e4State;
        if (narrow) {
          drawResultTile(c, pad, 110, 150, stateIdx);
          txt(c, DE ? "Argmax wählt die größte." : "Argmax picks the largest.", pad, 272, { size: 9.2, color: C.soft });
          var bs7 = boardSize, bx7 = boardX, by7 = boardY;
          drawBoard(c, TRUTH, bx7, by7, bs7, { highlight: [4, 4] });
          txt(c, "E4 = " + stateName(stateIdx), bx7 + bs7 / 2, by7 - 12, { align: "center", size: 10, color: C.ink });
        } else {
          drawResultTile(c, pad, 120, 180, stateIdx);
          drawRangeLine(c, pad, 330, W * .45, 18, probs, { small: true });
          txt(c, DE ? "Argmax: Die größte der drei Wahrscheinlichkeiten wird der Zustand von E4." : "Argmax: the largest of the three probabilities becomes the state of E4.", pad, 382, { size: 9.2, color: C.soft });
          var bs8 = boardSize, bx8 = boardX, by8 = boardY;
          drawBoard(c, TRUTH, bx8, by8, bs8, { highlight: [4, 4] });
          txt(c, "E4 = " + stateName(stateIdx), bx8 + bs8 / 2, by8 - 12, { align: "center", size: 10, color: C.ink });
        }
        setWmFormula("E4 = \\operatorname{argmax}_z\\,p[E4,z]");
      } else {
        if (narrow) {
          drawLogitsColumn(c, pad, 110, 44, 160, e4);
          var hs = 80, gap = 8;
          var labels = DE ? ["leer", "mein Spieler", "Gegner"] : ["empty", "my player", "opponent"];
          for (var o8 = 0; o8 < 3; o8++) {
            txt(c, labels[o8], pad + 60 + o8 * (hs + gap) + hs / 2, 100, { align: "center", size: 8.5, color: o8 === 1 ? C.gold : o8 === 2 ? C.ink : C.muted });
            drawProbGrid(c, pad + 60 + o8 * (hs + gap), 110, hs, o8, e4);
          }
          var bs9 = boardSize, bx9 = boardX, by9 = boardY;
          drawBoard(c, TRUTH, bx9, by9, bs9, { highlight: [4, 4] });
          txt(c, "64 × 3 → Brett", bx9 + bs9 / 2, by9 - 12, { align: "center", size: 10, color: C.ink });
        } else {
          drawLogitsColumn(c, pad, 110, 54, 200, e4);
          var hs2 = 90, gap2 = 10;
          var labels2 = DE ? ["leer", "mein Spieler", "Gegner"] : ["empty", "my player", "opponent"];
          for (var o9 = 0; o9 < 3; o9++) {
            txt(c, labels2[o9], pad + 80 + o9 * (hs2 + gap2) + hs2 / 2, 100, { align: "center", size: 9, color: o9 === 1 ? C.gold : o9 === 2 ? C.ink : C.muted });
            drawProbGrid(c, pad + 80 + o9 * (hs2 + gap2), 110, hs2, o9, e4);
          }
          var bs10 = boardSize, bx10 = boardX, by10 = boardY;
          drawBoard(c, TRUTH, bx10, by10, bs10, { highlight: [4, 4] });
          txt(c, "64 × 3 → Brett", bx10 + bs10 / 2, by10 - 12, { align: "center", size: 10, color: C.ink });
        }
        setWmFormula("\\text{board}[s] = \\operatorname{argmax}_z\\,p[s,z]");
      }
      drawStageDots(c, phase);
      txt(c, DE ? "schematisch" : "schematic", pad, H - 14, { size: 8.5, color: C.muted });
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
      var labels = DE ? ["leer", "mein Spieler", "Gegner"] : ["empty", "my player", "opponent"];
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
      setWmFormula("");
      var pad = Math.max(18, Math.min(26, W * .035));
      var narrow = W < 620;
      head(c, DE ? "Vom Feld zur realen Welt" : "From one square to the real world", pad, 34, { size: Math.min(28, Math.max(21, W * .036)) });
      txt(c, DE ? "Bei Othello hat jedes Feld 3 Zustände: leer, mein Spieler, Gegner (relativ zum Spieler am Zug). Die Probe liest drei Logits pro Feld; bei Schach sind es 13 Logits, ein affiner 12-dimensionaler Unterraum. In Modellen der realen Welt sind es viel mehr und viel komplexere Unterräume." : "In Othello each square has 3 states: empty, my player, opponent (relative to the player to move). The probe reads three logits per square; in chess there are 13 logits, an affine 12-dimensional subspace. In real-world models there are many more and much more complex subspaces.", pad, 58, { size: 10.5, color: C.muted });
      accent(c, pad, 72, 42);
      if (narrow) {
        var cx = W * .5;
        var y1 = H * .24, y2 = H * .50, y3 = H * .76;
        drawFlow(c, cx, y1 - 40, cx, y3 + 40);
        drawChevron(c, cx, (y1 + y2) / 2, "v");
        drawChevron(c, cx, (y2 + y3) / 2, "v");
        drawLineNode(c, cx, y1, 220);
        txt(c, "Othello", cx, y1 + 56, { align: "center", size: 16, font: '700 16px "Barlow", "Open Sans", sans-serif', color: C.ink });
        txt(c, DE ? "3 Logits pro Feld · reicht" : "3 logits per square · enough", cx, y1 + 74, { align: "center", size: 9.5, color: C.muted });
        txt(c, "Li et al. (2023) · Nanda et al. (2023)", cx, y1 + 90, { align: "center", size: 8, color: C.muted });
        drawChessNode(c, cx, y2, 72);
        txt(c, DE ? "Schach" : "Chess", cx, y2 + 78, { align: "center", size: 16, font: '700 16px "Barlow", "Open Sans", sans-serif', color: C.ink });
        txt(c, DE ? "13 Logits pro Feld · affiner Unterraum" : "13 logits per square · affine subspace", cx, y2 + 96, { align: "center", size: 9.5, color: C.muted });
        txt(c, "Karvonen (2024)", cx, y2 + 112, { align: "center", size: 8, color: C.muted });
        drawRealNode(c, cx, y3, 72);
        txt(c, DE ? "Reale Modelle" : "Real models", cx, y3 + 78, { align: "center", size: 16, font: '700 16px "Barlow", "Open Sans", sans-serif', color: C.ink });
        txt(c, DE ? "viele Unterräume · überlagert" : "many subspaces · overlapping", cx, y3 + 96, { align: "center", size: 9.5, color: C.muted });
        txt(c, DE ? "z. B. Gurnee & Tegmark (2023)" : "e.g. Gurnee & Tegmark (2023)", cx, y3 + 112, { align: "center", size: 8, color: C.muted });
        addHit(cx - 120, y1 - 50, 240, 170, DE ? "Othello: drei Logits pro Feld (leer, mein Spieler, Gegner; relativ zum Spieler am Zug)" : "Othello: three logits per square (empty, my player, opponent; relative to the player to move)");
        addHit(cx - 90, y2 - 90, 180, 220, DE ? "Schach: 13 Zustände pro Feld, also ein affiner Unterraum" : "chess: 13 states per square, an affine subspace");
        addHit(cx - 90, y3 - 90, 180, 220, DE ? "Reale Modelle: viele überlagerte Unterräume" : "real models: many overlapping subspaces");
      } else {
        var cy = H * .52;
        var n1 = W * .18, n2 = W * .50, n3 = W * .82;
        drawFlow(c, pad + 40, cy, W - pad - 40, cy);
        drawChevron(c, (n1 + n2) / 2, cy + .5, "h");
        drawChevron(c, (n2 + n3) / 2, cy + .5, "h");
        drawLineNode(c, n1, cy, 180);
        txt(c, "Othello", n1, cy + 56, { align: "center", size: 17, font: '700 17px "Barlow", "Open Sans", sans-serif', color: C.ink });
        txt(c, DE ? "3 Logits pro Feld · reicht" : "3 logits per square · enough", n1, cy + 75, { align: "center", size: 10, color: C.muted });
        txt(c, "Li et al. (2023) · Nanda et al. (2023)", n1, cy + 91, { align: "center", size: 8, color: C.muted });
        drawChessNode(c, n2, cy, 90);
        txt(c, DE ? "Schach" : "Chess", n2, cy + 82, { align: "center", size: 17, font: '700 17px "Barlow", "Open Sans", sans-serif', color: C.ink });
        txt(c, DE ? "13 Logits pro Feld · affiner Unterraum" : "13 logits per square · affine subspace", n2, cy + 101, { align: "center", size: 10, color: C.muted });
        txt(c, "Karvonen (2024)", n2, cy + 117, { align: "center", size: 8, color: C.muted });
        drawRealNode(c, n3, cy, 90);
        txt(c, DE ? "Reale Modelle" : "Real models", n3, cy + 82, { align: "center", size: 17, font: '700 17px "Barlow", "Open Sans", sans-serif', color: C.ink });
        txt(c, DE ? "viele Unterräume · überlagert" : "many subspaces · overlapping", n3, cy + 101, { align: "center", size: 10, color: C.muted });
        txt(c, DE ? "z. B. Gurnee & Tegmark (2023)" : "e.g. Gurnee & Tegmark (2023)", n3, cy + 117, { align: "center", size: 8, color: C.muted });
        addHit(n1 - 105, cy - 100, 210, 200, DE ? "Othello: drei Logits pro Feld (leer, mein Spieler, Gegner; relativ zum Spieler am Zug)" : "Othello: three logits per square (empty, my player, opponent; relative to the player to move)");
        addHit(n2 - 105, cy - 100, 210, 230, DE ? "Schach: 13 Zustände pro Feld, also ein affiner Unterraum" : "chess: 13 states per square, an affine subspace");
        addHit(n3 - 105, cy - 100, 210, 230, DE ? "Reale Modelle: viele überlagerte Unterräume" : "real models: many overlapping subspaces");
      }
      txt(c, DE ? "Drei Logits → ein Unterraum → viele Unterräume." : "Three logits → one subspace → many subspaces.", W / 2, H - 18, { align: "center", size: 10, color: C.ink });
    }

    function draw() {
      if (!W || !H) return;
      playBtn.hidden = state.step !== 0;
      hoverHits = [];
      V.aurora(ctx, W, H, C, { vignette: 0.08 });
      if (state.step === 0) drawStep0(ctx);
      else if (state.step === 1) drawStep1(ctx);
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
      if (game.active || reduced || state.running || state.step !== 1) return;
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
      draw();
    }

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { fit(); });
      ro.observe(host);
    }
    window.addEventListener("resize", fit);

    function hideTip() {
      tip.hidden = true;
      canvas.style.cursor = "";
    }
    canvas.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var hit = null;
      for (var i = 0; i < hoverHits.length; i++) {
        var h = hoverHits[i];
        if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) { hit = h; break; }
      }
      if (!hit) { hideTip(); return; }
      tip.textContent = hit.text;
      tip.hidden = false;
      var tw = tip.offsetWidth || 180, th = tip.offsetHeight || 30;
      var tx = x + 14, ty = y + 14;
      if (tx + tw > W - 6) tx = x - tw - 14;
      if (ty + th > H - 6) ty = y - th - 14;
      tip.style.left = Math.max(4, tx) + "px";
      tip.style.top = Math.max(4, ty) + "px";
      canvas.style.cursor = "help";
    });
    canvas.addEventListener("pointerup", function (e) {
      if (!game.active || state.step !== 0) return;
      var r = canvas.getBoundingClientRect();
      playAt(e.clientX - r.left, e.clientY - r.top);
    });
    playBtn.addEventListener("click", startGame);
    canvas.addEventListener("pointerleave", hideTip);
    fit();
    if (state.step === 0) startGame();
    if (reduced) {
      state.t = 3.0 * (FRAMES.length - 1);
      draw();
    }
    return {
      update: function (s) {
        var next = (s && typeof s.step === "number") ? s.step : 0;
        if (next !== state.step) {
          if (next !== 0) { game.active = false; playBtn.textContent = DE ? "Spielen" : "Play"; gameStatus.hidden = true; }
          state.step = next;
          if (next === 1) state.phase = lastPhase;
          state.t = reduced
            ? (next === 0 ? 3.0 * (FRAMES.length - 1) : next === 1 ? 0 : .5)
            : 0;
          state.last = 0;
          canvas.setAttribute("aria-label", ARIA[Math.max(0, Math.min(2, next))]);
          if (next === 1) stop();
          draw();
        }
        if (next === 0 && !game.active) startGame();
        start();
      },
      next: function () {
        if (state.step !== 1 || state.phase >= 5) return false;
        state.phase++;
        lastPhase = state.phase;
        draw();
        return true;
      },
      prev: function () {
        if (state.step !== 1 || state.phase <= 0) return false;
        state.phase--;
        lastPhase = state.phase;
        draw();
        return true;
      },
      hasNext: function () { return state.step === 1 && state.phase < 5; },
      hasPrev: function () { return state.step === 1 && state.phase > 0; },
      onKey: function (e) {
        if (state.step !== 1) return false;
        if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return false;
        if (e.key === "ArrowRight") {
          if (state.phase >= 5) return false;
          state.phase++;
          lastPhase = state.phase;
          draw();
          return true;
        }
        if (e.key === "ArrowLeft") {
          if (state.phase <= 0) return false;
          state.phase--;
          lastPhase = state.phase;
          draw();
          return true;
        }
        return false;
      },
      resize: fit,
      resume: start,
      pause: stop,
      destroy: function () {
        stop();
        if (game.raf) cancelAnimationFrame(game.raf);
        window.removeEventListener("resize", fit);
        if (window.ResizeObserver && ro) ro.disconnect();
        host.remove();
      }
    };
  }

  core.register("worldmodel", worldModelScene);
})();
