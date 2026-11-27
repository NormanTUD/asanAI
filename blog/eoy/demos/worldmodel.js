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
    st.textContent = ".ls-wm-scene{position:relative;width:100%;height:100%;min-height:380px;overflow:hidden;background:transparent}.ls-wm-scene canvas{display:block;width:100%;height:100%}.ls-wm-tip{position:absolute;z-index:8;max-width:320px;padding:8px 10px;background:rgba(255,255,255,.97);border:1px solid var(--tm-line-strong,#b9c8c3);box-shadow:0 10px 26px rgba(0,20,30,.14);font:400 13px/1.45 'Open Sans',sans-serif;color:var(--tm-ink,#000);pointer-events:none;white-space:pre-line}.ls-wm-tip[hidden]{display:none}.ls-wm-play{position:absolute;right:12px;bottom:12px;z-index:9;border:1px solid var(--tm-line-strong,#b9c8c3);background:var(--tm-green,#63a44b);color:#fff;padding:7px 11px;font:600 12px 'Open Sans',sans-serif;cursor:pointer}.ls-wm-play:hover{background:var(--tm-petrol,#004b6f)}.ls-wm-game-status{position:absolute;left:14px;bottom:14px;z-index:9;max-width:min(52%,420px);font:600 11px/1.4 'Open Sans',sans-serif;color:var(--tm-ink,#000);background:rgba(255,255,255,.92);border:1px solid var(--tm-line,#b9c8c3);padding:6px 8px}";
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
    host.setAttribute("data-tip", DE ? "Vom Zugstrom über die Probe bis zum rekonstruierten Brett." : "From the move stream through the probe to the reconstructed board.");
    var canvas = document.createElement("canvas");
    canvas.setAttribute("data-tip", DE ? "Interaktive Grafik: im Spiel markieren goldene Punkte gültige Züge." : "Interactive graphic: in the game, gold dots mark valid moves.");
    host.appendChild(canvas);
    var tip = document.createElement("div");
    tip.className = "ls-wm-tip";
    tip.hidden = true;
    host.appendChild(tip);
    var playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "ls-wm-play";
    playBtn.textContent = DE ? "Spielen" : "Play";
    playBtn.setAttribute("data-tip", DE ? "Startet oder wiederholt eine Partie Othello gegen den Computer." : "Starts or restarts a game of Othello against the computer.");
    host.appendChild(playBtn);
    var gameStatus = document.createElement("div");
    gameStatus.className = "ls-wm-game-status";
    gameStatus.hidden = true;
    gameStatus.setAttribute("data-tip", DE ? "Zeigt, wer am Zug ist, wie viele Züge möglich sind und das Ergebnis." : "Shows whose turn it is, how many moves are possible, and the result.");
    host.appendChild(gameStatus);
    var wmFormula = document.createElement("div");
    wmFormula.className = "ls-wm-formula";
    wmFormula.hidden = true;
    wmFormula.setAttribute("data-tip", DE ? "Die Formel des aktuellen Schritts: Logit, Softmax oder Argmax." : "The formula for the current step: logit, softmax, or argmax.");
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
    var state = { step: 0, phase: 0, t: 0, running: false, raf: 0, last: 0, transition: null, selectedSquare: 36, boardRect: null };
    var hoverHits = [];
    var boardPicks = [];
    var linked64 = null;
    function squareText(text) {
      return state.step === 1 ? String(text).replace(/E4/g, squareLabel(state.selectedSquare)) : String(text);
    }
    function addHit(x, y, w, h, text, link) {
      if (w > 0 && h > 0) hoverHits.push({ x: x, y: y, w: w, h: h, text: squareText(text), link: link || null });
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
      s = squareText(s);
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
      tex = squareText(String(tex || ""));
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
      if (opt.pick && state.step === 1) state.boardRect = { x: x, y: y, S: S };
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
          if (opt.pick && state.step === 1) boardPicks.push({ x: x + col * cell, y: y + r * cell, w: cell, h: cell, i: r * 8 + col });
          addHit(x + col * cell, y + r * cell, cell, cell,
            (DE ? "Feld " : "square ") + squareLabel(r * 8 + col) + ": " + stateName(sIdx)
              + (state.step === 1
                ? (DE ? " · hier liest die Probe x (L6, 512) mit W[Feld, Zustand]; Score = x · W; Argmax; das Brett ist nur die wahre Kontrolle." : " · here the probe reads x (L6, 512) with W[square, state]; score = x · W; argmax; the board is only the ground truth.")
                : ""));
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
      if (state.step === 1) {
        addHit(x, y, S, S,
          DE ? "Brett: Jedes Feld hat drei Zustände. Die Probe liest x (L6, 512) mit der gelernten Zeile W[Feld, Zustand]; hoher Score = ähnliche Richtung. Das Brett ist die wahre Kontrolle." : "Board: each square has three states. The probe reads x (L6, 512) with the learned row W[square, state]; high score = aligned direction. The board is the ground truth.");
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
      txt(c, DE ? "Du: Schwarz · Computer: Weiß" : "You: black · computer: white", pad, 58, { size: 12, color: C.muted });
      var black = 0, white = 0;
      for (var sr = 0; sr < 8; sr++) for (var sc = 0; sc < 8; sc++) { if (game.board[sr][sc] === 1) black++; else if (game.board[sr][sc] === -1) white++; }
      txt(c, DE ? "Du " + black + " · Computer " + white : "You " + black + " · Computer " + white, narrow ? pad : W - pad, narrow ? 88 : 88, { align: narrow ? "left" : "right", size: 16, color: C.ink, font: '700 16px "Barlow", "Open Sans", sans-serif' });
      accent(c, pad, 72, 40);
      var boardS = Math.min(narrow ? W * .70 : W * .54, H * .58);
      var bx = narrow ? (W - boardS) / 2 + 10 : W * .50 - boardS / 2;
      var by = Math.max(112, (H - boardS) / 2 + 28);
      game.rect = { x: bx, y: by, S: boardS };
      var moves = game.player === 1 ? legal(game.board, 1) : [];
      drawBoard(c, game.board, bx, by, boardS, { labels: true, legal: moves, last: game.last });
      var hy = by + boardS + 46;
      if (hy > H - 10) hy = by - 14;
      var label = game.winner === 1 ? (DE ? "Du gewinnst!" : "You win!") : game.winner === -1 ? (DE ? "Computer gewinnt" : "Computer wins") : (DE ? "Dein Zug" : "Your move");
      txt(c, label, bx + boardS / 2, hy, { align: "center", size: 15, color: game.winner === 1 ? C.green : C.ink, font: '700 15px "Barlow", "Open Sans", sans-serif' });
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
          (DE ? "Aktivierung x[" : "activation x[") + gi + "] = " + V.fmt(X[gi], 2) + (DE ? " · eine von 512 Zahlen nach Schicht 6; die Probe bildet daraus die Brett-Logits." : " · one of 512 numbers after layer 6; the probe turns it into board logits."));
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
            (DE ? "Feld " : "square ") + squareLabel(ls) + " · " + stateName(lo)
              + " · Logit " + V.fmt(SCORES[ls][lo], 2)
              + " · p " + (PROBS[ls][lo] * 100).toFixed(1) + "%"
              + (DE ? " · im 64×3: Zeile " + (ls + 1) + ", Spalte " + (lo + 1) + " · markiert live in der passenden 8×8-Map" : " · in 64×3: row " + (ls + 1) + ", column " + (lo + 1) + " · highlighted live in the matching 8×8 map")
              + (DE ? " · aus x ∈ ℝ^512 · Probe-Zeile W[" + squareLabel(ls) + ", " + stateName(lo) + "]" : " · from x ∈ ℝ^512 · probe row W[" + squareLabel(ls) + ", " + stateName(lo) + "]"),
            { row: ls, col: lo });
        }
      }
      if (linked64 && linked64.row >= 0 && linked64.col >= 0) {
        c.strokeStyle = C.gold;
        c.lineWidth = 2;
        c.strokeRect(x + linked64.col * cw + 1, y + linked64.row * ch + 1, cw - 2, ch - 2);
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
      if (linked64 && linked64.row >= 0 && linked64.col === stateIdx) {
        var lr = Math.floor(linked64.row / 8), lc = linked64.row % 8;
        c.save();
        c.strokeStyle = C.gold;
        c.lineWidth = 2.8;
        c.strokeRect(x + lc * cell + 1.5, y + lr * cell + 1.5, cell - 3, cell - 3);
        c.fillStyle = V.alpha(C.gold, .16);
        c.fillRect(x + lc * cell + 2, y + lr * cell + 2, cell - 4, cell - 4);
        c.restore();
      }
      c.strokeStyle = V.alpha(C.lineStrong, .65);
      c.lineWidth = 1;
      c.strokeRect(x + .5, y + .5, size - 1, size - 1);
      for (var pr = 0; pr < 8; pr++) {
        for (var pc = 0; pc < 8; pc++) {
          var pi = pr * 8 + pc;
          addHit(x + pc * cell, y + pr * cell, cell, cell,
            (DE ? "Feld " : "square ") + squareLabel(pi) + " · " + stateName(stateIdx) + ": " + (PROBS[pi][stateIdx] * 100).toFixed(1) + "%"
              + (DE ? " · im 64×3: Zeile " + (pi + 1) + ", Spalte " + (stateIdx + 1) + " · aus x ∈ ℝ^512 und Probe-Zeile W[" + squareLabel(pi) + ", " + stateName(stateIdx) + "]" : " · in 64×3: row " + (pi + 1) + ", column " + (stateIdx + 1) + " · from x ∈ ℝ^512 and probe row W[" + squareLabel(pi) + ", " + stateName(stateIdx) + "]"),
            { row: pi, col: stateIdx });
        }
      }
      if (typeof row === "number") {
        c.strokeStyle = C.gold;
        c.lineWidth = 1.8;
        c.strokeRect(x + (row % 8) * cell + .5, y + Math.floor(row / 8) * cell + .5, cell - 1, cell - 1);
      }
    }

    function drawStageDots(c, phase) {
      var dotPhase = phase === 0 ? 0 : phase === 1 ? 1 : 2;
      var n = 3;
      var labels = DE ? ["x", "Probe · Softmax · Feld", "Brett"] : ["x", "probe · softmax · square", "board"];
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
        var done = i < dotPhase;
        var active = i === dotPhase;
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
      txt(c, dotPhase >= 2 ? (DE ? "fertig" : "done") : (DE ? "Schritt " + (dotPhase + 1) + " / 3" : "step " + (dotPhase + 1) + " / 3"), W - (small ? 22 : 48), y + 14, {
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

    function phaseAnchor(phase) {
      if (phase === 0) return { x: W * 0.22, y: H * 0.55 };
      if (phase === 1) return { x: W * 0.30, y: H * 0.44 };
      if (phase === 2) return { x: W * 0.43, y: H * 0.47 };
      if (phase === 3) return { x: W * 0.30, y: H * 0.46 };
      if (phase === 4) return { x: W * 0.30, y: H * 0.50 };
      return { x: W * 0.54, y: H * 0.48 };
    }
    function setPhase(next, dir) {
      if (next === state.phase || next < 0 || next > 5) return;
      if (reduced) {
        state.phase = next;
        lastPhase = next;
        draw();
        return;
      }
      state.transition = { from: state.phase, to: next, start: performance.now(), dur: 720 };
      state.phase = next;
      lastPhase = next;
      draw();
      start();
    }

    function drawStep1(c) {
      var tr = state.transition;
      var transP = tr ? Math.min(1, (performance.now() - tr.start) / tr.dur) : 1;
      c.save();
      if (tr) c.globalAlpha = 0.22 + 0.78 * transP;
      var pad = Math.max(18, Math.min(26, W * .035));
      var narrow = W < 620;
      var phase = state.phase || 0;
      if (phase === 0) setWmFormula("");
      var e4 = state.selectedSquare;
      var scores = SCORES[e4];
      var probs = PROBS[e4];
      var e4State = winIndex(scores);
      var boardSize = narrow ? 132 : Math.min(260, W * .24, H * .38);
      var boardX = W - pad - boardSize;
      var boardY = narrow ? 128 : 132;
      var questions = DE ? [
        ["Was ist die Aktivierung?", "Layer 6 gibt dem aktuellen Token x: 512 Zahlen. Das ist die Aktivierung, noch kein lesbares Brett."],
        ["Was macht die Probe pro Feld?", "x (512) · W (64×3×512): pro Feld drei Zeilen W[Feld, leer/mein/Gegner] à 512; z[Feld,z] = Σ_d x[d]·W[Feld,z,d]; Softmax → p; Argmax → Feld."],
        ["Wie entsteht ein Score?", "Ziel: Wie gut passt x zur gelernten Richtung? Der Score ist die Projektion von x auf W; groß bei ähnlicher Richtung."],
        ["Warum Softmax?", "Drei Roh-Scores werden zu drei Wahrscheinlichkeiten, die zusammen 100% ergeben. Die Reihenfolge bleibt."],
        ["Wie wird daraus ein Feld?", "Drei Wahrscheinlichkeiten für E4. Argmax nimmt die größte; das ist der Zustand des Feldes."],
        ["Und das ganze Brett?", "x (512) · W (64×3×512) → 192 Logits; W[E4] ist nur die 3×512-Scheibe für E4; jede Zeile softmax, dann argmax → 64 Zustände → 8×8-Brett."]
      ] : [
        ["What is the activation?", "Layer 6 gives the current token x: 512 numbers. That is the activation, not yet a readable board."],
        ["What does the probe do per square?", "x (512) · W (64×3×512): every square has three rows W[square, empty/my/opponent] of 512; z[square,z] = Σ_d x[d]·W[square,z,d]; softmax → p; argmax → square."],
        ["How does a score arise?", "Goal: how well does x fit the learned direction? The score is the projection of x onto W; large when the directions align."],
        ["Why softmax?", "Three raw scores become three probabilities that sum to 100%. The order stays the same."],
        ["How does that become a square?", "Three probabilities for E4. Argmax takes the largest; that is the state of the square."],
        ["And the whole board?", "x (512) · W (64×3×512) → 192 logits; W[E4] is only the 3×512 slice for E4; each row softmax, then argmax → 64 states → 8×8 board."]
      ];
      head(c, DE ? "Vom Zug zum Brett" : "From move to board", pad, 34, { size: Math.min(28, Math.max(21, W * .036)) });
      txt(c, questions[phase][0], pad, 60, { size: narrow ? 13 : 15, font: '700 ' + (narrow ? 13 : 15) + 'px "Barlow", "Open Sans", sans-serif', color: C.ink });
      txt(c, questions[phase][1], pad, 78, { size: 10.2, color: C.muted });
      if (phase === 0) {
        txt(c, DE ? "L6-Aktivierung · x (512 Werte als Heatmap)" : "L6 activation · x (512 values as a heatmap)", pad, 100, { size: 11, color: C.ink, font: '700 11px "Barlow", "Open Sans", sans-serif' });
        var gw = Math.max(220, W - 2 * pad);
        var gh = Math.min(gw / 2, H - 220);
        if (gh < 120) gh = Math.max(90, H - 240);
        drawActivationGrid(c, pad, 122, gw, gh);
        txt(c, "32 × 16 = 512 · dieselben Werte, nur als Raster", pad, 122 + gh + 16, { size: 9, color: C.muted });
        txt(c, DE ? "x = L6-Aktivierung (512 Werte pro Token); das Brett ist ab Layer 4 vollständig, die Probe liest L6." : "x = L6 activation (512 values per token); the board is complete by layer 4, the probe reads L6.", pad, H - 52, { size: 9, color: C.ink });
      } else if (phase === 1) {
        // The 64×3 representation is the destination: three rows per square,
        // one shared x, one softmax/argmax readout per row. E4 is marked.
        var matrixW = Math.min(150, W * .13);
        var matrixH = Math.min(180, H - 420);
        if (matrixH < 120) matrixH = 120;
        drawLogitsColumn(c, pad, 122, matrixW, matrixH, e4);
        txt(c, DE ? "x (512) · W (64×3×512) → z (64×3) → Softmax → p (64×3) → Argmax" : "x (512) · W (64×3×512) → z (64×3) → softmax → p (64×3) → argmax", pad, 102, { size: 8.6, color: C.petrol, font: '700 8.6px "Barlow", "Open Sans", sans-serif' });
        txt(c, DE ? "E4 markiert: drei der 192 Zeilen. Dieselbe Rechnung für jedes Feld, mit eigener W-Zeile." : "E4 marked: three of the 192 rows. Same computation for every square, with its own W rows.", pad, 122 + matrixH + 12, { size: 8.2, color: C.muted });
        // The three outputs fill the three state cards; the board is the ground truth.
        var cardW = Math.min(116, (W * .56 - 24) / 3);
        var cardY2 = 342;
        txt(c, DE ? "z (vor Softmax) → Softmax → p (nach Softmax) → Argmax" : "z (before softmax) → softmax → p (after softmax) → argmax", pad, cardY2 - 15, { size: 8.4, color: C.petrol, font: '700 8.4px "Barlow", "Open Sans", sans-serif' });
        var fieldWinner = winIndex(probs);
        for (var oc = 0; oc < 3; oc++) {
          var cardX2 = pad + oc * (cardW + 10);
          var isW = oc === fieldWinner;
          c.fillStyle = isW ? V.alpha(C.gold, .11) : V.alpha(C.paper2, .72);
          c.strokeStyle = isW ? C.gold : V.alpha(C.line, .75);
          c.lineWidth = isW ? 2 : 1;
          c.fillRect(cardX2, cardY2, cardW, 124);
          c.strokeRect(cardX2 + .5, cardY2 + .5, cardW - 1, 123);
          txt(c, stateName(oc), cardX2 + cardW / 2, cardY2 + 14, { align: "center", size: 9, color: isW ? C.gold : C.muted });
          txt(c, DE ? "z (vor Softmax)" : "z (before softmax)", cardX2 + cardW / 2, cardY2 + 29, { align: "center", size: 7.2, color: C.muted });
          txt(c, "z = " + V.fmt(scores[oc], 2), cardX2 + cardW / 2, cardY2 + 42, { align: "center", size: 10.5, color: C.ink, font: '700 10.5px "Barlow", "Open Sans", sans-serif' });
          txt(c, DE ? "p (nach Softmax)" : "p (after softmax)", cardX2 + cardW / 2, cardY2 + 58, { align: "center", size: 7.2, color: C.muted });
          c.fillStyle = V.alpha(C.line, .35);
          c.fillRect(cardX2 + 12, cardY2 + 72, cardW - 24, 8);
          c.fillStyle = isW ? C.gold : C.blue;
          c.fillRect(cardX2 + 12, cardY2 + 72, (cardW - 24) * Math.max(0, Math.min(1, probs[oc])), 8);
          txt(c, (probs[oc] * 100).toFixed(0) + "%", cardX2 + cardW / 2, cardY2 + 92, { align: "center", size: 15, color: isW ? C.gold : C.ink, font: '700 15px "Barlow", "Open Sans", sans-serif' });
          if (isW) txt(c, DE ? "← Argmax" : "← argmax", cardX2 + cardW / 2, cardY2 + 111, { align: "center", size: 7.6, color: C.gold });
          addHit(cardX2, cardY2, cardW, 124, DE ? "z[E4, " + stateName(oc) + "] = x · W[E4, " + stateName(oc) + "] = " + V.fmt(scores[oc], 2) + " (Logit, vor Softmax). Softmax macht daraus p = " + (probs[oc] * 100).toFixed(1) + "%. Argmax nimmt das größte p als Feldzustand." : "z[E4, " + stateName(oc) + "] = x · W[E4, " + stateName(oc) + "] = " + V.fmt(scores[oc], 2) + " (logit, before softmax). Softmax turns this into p = " + (probs[oc] * 100).toFixed(1) + "%. Argmax takes the largest p as the square state.");
        }
        drawBoard(c, TRUTH, boardX, boardY, boardSize, { highlight: [Math.floor(e4 / 8), e4 % 8], pick: true });
        txt(c, DE ? "W gelernt: wahrer Zustand soll höchsten Score haben" : "W learned: the true state should get the highest score", boardX + boardSize / 2, boardY - 34, { align: "center", size: 8.4, color: C.muted });
        txt(c, "Feld E4 · klicke ein anderes Feld", boardX + boardSize / 2, boardY - 12, { align: "center", size: 9, color: C.ink });
        setWmFormula("");
      } else if (phase === 2) {
        var cx = pad + Math.min(310, W * 0.38);
        var cy = 255;
        var xAng = -0.22;
        var xLen = Math.min(170, H * 0.27);
        var winAng = xAng + 0.14;
        var angles = [xAng + 1.28, xAng + 1.28, xAng + 1.28];
        angles[e4State] = winAng;
        var other = [];
        for (var ao = 0; ao < 3; ao++) if (ao !== e4State) other.push(ao);
        angles[other[0]] = xAng - 1.25;
        angles[other[1]] = xAng + 1.25;
        var xTip = [cx + Math.cos(xAng) * xLen, cy - Math.sin(xAng) * xLen];
        var winTip = [cx + Math.cos(winAng) * xLen, cy - Math.sin(winAng) * xLen];
        c.save();
        c.fillStyle = V.alpha(C.paper2, .72);
        c.strokeStyle = V.alpha(C.line, .7);
        c.lineWidth = 1;
        c.beginPath();
        if (c.roundRect) c.roundRect(pad, 96, Math.min(360, W * .46), 46, 9); else c.rect(pad, 96, Math.min(360, W * .46), 46);
        c.fill(); c.stroke();
        c.restore();
        txt(c, DE ? "Ziel: Welche gelernte Richtung passt am besten zu x?" : "Goal: which learned direction fits x best?", pad + 12, 112, { size: 10, color: C.ink, font: '700 10px "Barlow", "Open Sans", sans-serif' });
        txt(c, DE ? "Der Score ist die Projektion, nicht das einzelne Multiplizieren." : "The score is the projection, not multiplying individual numbers.", pad + 12, 130, { size: 8.6, color: C.muted });
        addHit(pad, 96, Math.min(360, W * .46), 46, DE ? "Ziel: Alignment von x und der gelernten Probe-Richtung; x ist für alle drei Zustände derselbe Vektor." : "Goal: alignment of x and the learned probe direction; x is the same vector for all three states.");
        // The x vector is the shared activation; the three probe rows are learned directions.
        V.arrow(c, cx, cy, xTip[0], xTip[1], C.blue, 3.4, 9);
        addHit(Math.min(cx, xTip[0]) - 16, Math.min(cy, xTip[1]) - 16, Math.abs(xTip[0] - cx) + 32, Math.abs(xTip[1] - cy) + 32,
          DE ? "x = Aktivierung nach Layer 6 · 512 Zahlen · derselbe Vektor für leer, mein Spieler und Gegner" : "x = activation after layer 6 · 512 numbers · same vector for empty, my player and opponent");
        txt(c, "x", xTip[0] + 8, xTip[1] - 4, { size: 15, color: C.blue, font: '700 15px "Barlow", "Open Sans", sans-serif' });
        // Projection of x onto the winning probe direction.
        var projLen = xLen * Math.cos(winAng - xAng);
        var pTip = [cx + Math.cos(winAng) * projLen, cy - Math.sin(winAng) * projLen];
        var geoReveal = state.transition && state.transition.to === 2
          ? Math.min(1, (performance.now() - state.transition.start) / state.transition.dur)
          : 1;
        c.save();
        c.setLineDash([5, 4]);
        c.strokeStyle = V.alpha(C.gold, .72 * geoReveal);
        c.lineWidth = 1.3;
        c.globalAlpha = geoReveal;
        c.beginPath(); c.moveTo(xTip[0], xTip[1]); c.lineTo(pTip[0], pTip[1]); c.stroke();
        c.restore();
        c.save();
        c.strokeStyle = C.gold;
        c.lineWidth = 1.2;
        c.globalAlpha = geoReveal;
        c.strokeRect(pTip[0] - 4, pTip[1] - 4, 8, 8);
        c.restore();
        c.globalAlpha = 1;
        txt(c, DE ? "Projektion" : "projection", pTip[0] + 8, pTip[1] - 9, { size: 8.8, color: V.alpha(C.gold, geoReveal) });
        addHit(pTip[0] - 10, pTip[1] - 12, 72, 24,
          DE ? "Projektion von x auf W: |x|·cos θ. Der Score ist |W| mal diese Projektion. Das ist die geometrische Bedeutung des Dot-Produkts." : "Projection of x onto W: |x|·cos θ. The score is |W| times this projection. That is the geometric meaning of the dot product.");
        for (var ar = 0; ar < 3; ar++) {
          var ang = angles[ar];
          var len = xLen * 0.92;
          var tip = [cx + Math.cos(ang) * len, cy - Math.sin(ang) * len];
          var isWin = ar === e4State;
          V.arrow(c, cx, cy, tip[0], tip[1], isWin ? C.gold : (ar === 0 ? C.petrol : ar === 1 ? C.green : C.ink), isWin ? 3.2 : 2.0, isWin ? 9 : 7);
          addHit(Math.min(cx, tip[0]) - 18, Math.min(cy, tip[1]) - 18, Math.abs(tip[0] - cx) + 36, Math.abs(tip[1] - cy) + 36,
            DE ? "W[E4, " + stateName(ar) + "] · gelernte Probe-Richtung · 512 Gewichte · Score " + V.fmt(scores[ar], 2) : "W[E4, " + stateName(ar) + "] · learned probe direction · 512 weights · score " + V.fmt(scores[ar], 2));
          txt(c, stateName(ar), tip[0] + Math.cos(ang) * 14, tip[1] - Math.sin(ang) * 14, { align: "center", size: 9.4, color: isWin ? C.gold : C.ink });
          txt(c, "x·W = " + V.fmt(scores[ar], 2), cx + Math.cos(ang) * (len + 30), cy - Math.sin(ang) * (len + 30), { align: "center", size: 10, color: isWin ? C.gold : C.muted, font: '700 10px "Barlow", "Open Sans", sans-serif' });
          addHit(cx + Math.cos(ang) * (len + 6), cy - Math.sin(ang) * (len + 6) - 13, 86, 26,
            DE ? "Dot-Produkt x · W[E4, " + stateName(ar) + "] = " + V.fmt(scores[ar], 2) + " · je ähnlicher die Richtungen, desto größer der Score." : "dot product x · W[E4, " + stateName(ar) + "] = " + V.fmt(scores[ar], 2) + " · the more aligned the directions, the larger the score.");
        }
        // Angle between x and the winning probe row.
        var arcR = 46;
        c.save();
        c.strokeStyle = V.alpha(C.gold, .8);
        c.lineWidth = 1.3;
        c.beginPath();
        c.arc(cx, cy, arcR, -winAng, -xAng, true);
        c.stroke();
        c.restore();
        txt(c, "θ", cx + Math.cos((winAng + xAng) / 2) * (arcR + 13), cy - Math.sin((winAng + xAng) / 2) * (arcR + 13), { align: "center", size: 12, color: C.gold, font: '700 12px "Barlow", "Open Sans", sans-serif' });
        addHit(cx + Math.cos((winAng + xAng) / 2) * (arcR - 12), cy - Math.sin((winAng + xAng) / 2) * (arcR - 12) - 12, 36, 36,
          DE ? "θ: Winkel zwischen x und W[E4, " + stateName(e4State) + "]. Der Score ist |x|·|W|·cos θ." : "θ: angle between x and W[E4, " + stateName(e4State) + "]. The score is |x|·|W|·cos θ.");
        txt(c, DE ? "x und W sind 512-dim; das ist ein 2D-Schatten. Die Projektion macht den Score sichtbar." : "x and W are 512-dim; this is a 2D shadow. The projection makes the score visible.", pad, H - 136, { size: 8.2, color: C.muted });
        drawBoard(c, TRUTH, boardX, boardY, boardSize, { highlight: [Math.floor(e4 / 8), e4 % 8], pick: true });
        txt(c, DE ? "Feld E4 · wahrer Zustand als Kontrolle" : "square E4 · true state as ground truth", boardX + boardSize / 2, boardY - 34, { align: "center", size: 8.4, color: C.muted });
        txt(c, "Feld E4", boardX + boardSize / 2, boardY - 12, { align: "center", size: 10, color: C.ink });
        setWmFormula("\\underbrace{\\operatorname{logit}[E4,z]}_{\\text{Score}} = \\underbrace{\\langle \\underbrace{x}_{\\text{L6-Aktivierung}}, \\underbrace{W[E4,z]}_{\\text{Probe-Richtung}}\\rangle}_{\\text{Projektion / Alignment}} = \\underbrace{\\lVert x\\rVert\\,\\lVert W\\rVert\\cos\\theta}_{\\text{Länge × Länge × Winkel}}");
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
          drawBoard(c, TRUTH, bx5, by5, bs5, { highlight: [Math.floor(e4 / 8), e4 % 8], pick: true });
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
          drawBoard(c, TRUTH, bx6, by6, bs6, { highlight: [Math.floor(e4 / 8), e4 % 8], pick: true });
          txt(c, "Feld E4", bx6 + bs6 / 2, by6 - 12, { align: "center", size: 10, color: C.ink });
        }
        txt(c, DE ? "Softmax macht aus Roh-Scores Wahrscheinlichkeiten. Die Reihenfolge bleibt; Argmax kommt im nächsten Schritt." : "Softmax turns raw scores into probabilities. The order stays; argmax comes next.", pad, H - 112, { size: 9.2, color: C.soft });
        setWmFormula("\\underbrace{p[E4,z]}_{\\text{Wahrscheinlichkeit}} = \\underbrace{\\frac{\\exp(\\operatorname{logit}[E4,z])}{\\sum_{z'}\\exp(\\operatorname{logit}[E4,z'])}}_{\\text{Softmax: Summe über }z = 1}");
      } else if (phase === 4) {
        var stateIdx = e4State;
        var gapC = 10;
        var cardW = Math.max(82, Math.min(132, (W * .50 - gapC * 2 - pad * 2) / 3));
        var cardH = 190;
        var cardY = 125;
        for (var co = 0; co < 3; co++) {
          var cardX = pad + co * (cardW + gapC);
          var isWinner = co === stateIdx;
          c.save();
          c.fillStyle = isWinner ? V.alpha(C.gold, .10) : V.alpha(C.paper2, .72);
          c.strokeStyle = isWinner ? C.gold : V.alpha(C.line, .75);
          c.lineWidth = isWinner ? 2.2 : 1;
          if (isWinner) { c.shadowColor = V.alpha(C.gold, .28); c.shadowBlur = 12; }
          c.beginPath();
          if (c.roundRect) c.roundRect(cardX, cardY, cardW, cardH, 12); else c.rect(cardX, cardY, cardW, cardH);
          c.fill(); c.stroke();
          c.restore();
          txt(c, stateName(co), cardX + cardW / 2, cardY + 17, { align: "center", size: 9.4, color: isWinner ? C.gold : C.muted, font: '700 9.4px "Barlow", "Open Sans", sans-serif' });
          if (co === 0) {
            c.save();
            c.setLineDash([5, 4]);
            c.strokeStyle = V.alpha(C.book || C.muted, .75);
            c.lineWidth = 1.4;
            c.beginPath(); c.arc(cardX + cardW / 2, cardY + 74, 30, 0, Math.PI * 2); c.stroke();
            c.restore();
          } else {
            drawDisc(c, cardX + cardW / 2, cardY + 74, 31, co === 1 ? 1 : -1, 1);
          }
          txt(c, (probs[co] * 100).toFixed(0) + "%", cardX + cardW / 2, cardY + 132, { align: "center", size: 18, color: isWinner ? C.gold : C.ink, font: '700 18px "Barlow", "Open Sans", sans-serif' });
          txt(c, isWinner ? (DE ? "← Argmax" : "← argmax") : "p", cardX + cardW / 2, cardY + 154, { align: "center", size: 9, color: isWinner ? C.gold : C.muted });
          addHit(cardX, cardY, cardW, cardH,
            DE ? "E4, " + stateName(co) + ": p = " + (probs[co] * 100).toFixed(1) + "%. Die Probe vergleicht x mit W[E4, " + stateName(co) + "]; Argmax nimmt die größte Wahrscheinlichkeit." : "E4, " + stateName(co) + ": p = " + (probs[co] * 100).toFixed(1) + "%. The probe compares x with W[E4, " + stateName(co) + "]; argmax takes the largest probability.");
        }
        txt(c, "E4 = " + stateName(stateIdx), pad, cardY + cardH + 26, { size: 18, color: C.gold, font: '700 18px "Barlow", "Open Sans", sans-serif' });
        txt(c, DE ? "Argmax: die größte der drei Wahrscheinlichkeiten bestimmt den Zustand des Feldes." : "Argmax: the largest of the three probabilities determines the state of the square.", pad, cardY + cardH + 48, { size: 9.4, color: C.soft });
        drawBoard(c, TRUTH, boardX, boardY, boardSize, { highlight: [Math.floor(e4 / 8), e4 % 8], pick: true });
        txt(c, DE ? "Feld E4 · der eine Zustand wird ins Brett geschrieben" : "square E4 · the one state is written into the board", boardX + boardSize / 2, boardY - 34, { align: "center", size: 8.4, color: C.muted });
        txt(c, "E4 = " + stateName(stateIdx), boardX + boardSize / 2, boardY - 12, { align: "center", size: 10, color: C.ink });
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
          drawBoard(c, TRUTH, bx9, by9, bs9, { highlight: [Math.floor(e4 / 8), e4 % 8], pick: true });
          txt(c, "64 × 3 → Brett", bx9 + bs9 / 2, by9 - 12, { align: "center", size: 10, color: C.ink });
        } else {
          var top = 108;
          var bottom = H - 58;
          var gridH = Math.max(130, bottom - top);
          var boardSide = Math.min(330, W * .25, H * .48);
          var boardLeft = W - pad - boardSide;
          var boardTop = top + Math.max(0, (gridH - boardSide) / 2);
          var logitW = Math.min(150, W * .13);
          var logitH = Math.min(gridH, 390);
          drawLogitsColumn(c, pad, top, logitW, logitH, e4);
          var left = pad + logitW + 22;
          var available = Math.max(220, boardLeft - left - 24);
          var gap2 = Math.max(8, available * .025);
          var hs2 = Math.max(94, Math.min(190, (available - 2 * gap2) / 3, gridH * .72));
          var labels2 = DE ? ["leer", "mein Spieler", "Gegner"] : ["empty", "my player", "opponent"];
          var gridTop = top + Math.max(0, (gridH - hs2) / 2 - 8);
          for (var o9 = 0; o9 < 3; o9++) {
            txt(c, labels2[o9], left + o9 * (hs2 + gap2) + hs2 / 2, gridTop - 10, { align: "center", size: 12, color: o9 === 1 ? C.gold : o9 === 2 ? C.ink : C.muted, font: '700 12px "Barlow", "Open Sans", sans-serif' });
            drawProbGrid(c, left + o9 * (hs2 + gap2), gridTop, hs2, o9, e4);
          }
          drawBoard(c, TRUTH, boardLeft, boardTop, boardSide, { highlight: [Math.floor(e4 / 8), e4 % 8], pick: true });
          txt(c, "64 × 3 → Brett", boardLeft + boardSide / 2, boardTop - 14, { align: "center", size: 11, color: C.ink });
        }
        setWmFormula("");
      }
      drawStageDots(c, phase);
      txt(c, DE ? "schematisch" : "schematic", pad, H - 14, { size: 8.5, color: C.muted });
      c.restore();
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
      canvas.setAttribute("data-tip", state.step === 0
        ? (DE ? "Othello-Brett und Zugfolge: hier spielst du gegen den Computer." : "Othello board and move stream: here you play against the computer.")
        : state.step === 1
          ? (DE ? "Fünf Schritte von der Aktivierung über die Probe und Softmax zum Brett." : "Five steps from activation through the probe and softmax to the board.")
          : (DE ? "Drei Logits pro Feld, ein Unterraum für Schach und viele Unterräume für reale Modelle." : "Three logits per square, one subspace for chess, and many subspaces for real models."));
      hoverHits = [];
      boardPicks = [];
      ctx.clearRect(0, 0, W, H);
      if (state.step === 0) drawStep0(ctx);
      else if (state.step === 1) drawStep1(ctx);
      else drawStep3(ctx);
      if (state.transition && performance.now() - state.transition.start >= state.transition.dur) state.transition = null;
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
      if (linked64) { linked64 = null; draw(); }
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
      var nextLink = hit.link || null;
      if (JSON.stringify(nextLink) !== JSON.stringify(linked64)) {
        linked64 = nextLink;
        draw();
      }
      tip.textContent = hit.text.replace(/\s*·\s*/g, "\n") + "\n" + (DE
        ? "Jedes Feld hat drei Zustände: leer, dein Spieler, Gegner. Die Probe liest sie relativ zum Spieler am Zug."
        : "Each square has three states: empty, your player, opponent. The probe reads them relative to the player to move.");
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
      if (state.step === 1) {
        var r1 = canvas.getBoundingClientRect();
        var x1 = e.clientX - r1.left, y1 = e.clientY - r1.top;
        for (var bi = 0; bi < boardPicks.length; bi++) {
          var bp = boardPicks[bi];
          if (x1 >= bp.x && x1 <= bp.x + bp.w && y1 >= bp.y && y1 <= bp.y + bp.h) {
            state.selectedSquare = bp.i;
            draw();
            return;
          }
        }
        var br = state.boardRect;
        if (br && x1 >= br.x && x1 <= br.x + br.S && y1 >= br.y && y1 <= br.y + br.S) {
          var col = Math.max(0, Math.min(7, Math.floor((x1 - br.x) / (br.S / 8))));
          var row = Math.max(0, Math.min(7, Math.floor((y1 - br.y) / (br.S / 8))));
          state.selectedSquare = row * 8 + col;
          draw();
          return;
        }
      }
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
        if (state.step !== 1) return false;
        if (state.phase === 0) { setPhase(1, 1); return true; }
        if (state.phase === 1) { setPhase(5, 1); return true; }
        return false;
      },
      prev: function () {
        if (state.step !== 1) return false;
        if (state.phase === 5) { setPhase(1, -1); return true; }
        if (state.phase === 1) { setPhase(0, -1); return true; }
        return false;
      },
      hasNext: function () { return state.step === 1 && (state.phase === 0 || state.phase === 1); },
      hasPrev: function () { return state.step === 1 && (state.phase === 1 || state.phase === 5); },
      onKey: function (e) {
        if (state.step !== 1) return false;
        if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return false;
        if (e.key === "ArrowRight") {
          if (state.phase >= 5) return false;
          if (state.phase === 0) setPhase(1, 1);
          else if (state.phase === 1) setPhase(5, 1);
          else return false;
          return true;
        }
        if (e.key === "ArrowLeft") {
          if (state.phase === 5) setPhase(1, -1);
          else if (state.phase === 1) setPhase(0, -1);
          else return false;
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
