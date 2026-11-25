(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function loopScene(root, api) {
    var DE = api.lang === "de";
    var SEQ_LEN = 6;
    var MAX_STEPS = 7;
    var EOS = "<|endoftext|>";
    var NOUNS = DE ? [
      { t: "Drache", l: 3.4 }, { t: "Ritter", l: 1.1 }, { t: "Roboter", l: 0.7 }, { t: "Schloss", l: 0.4 }, { t: "Fluss", l: 0.2 }
    ] : [
      { t: "dragon", l: 3.4 }, { t: "princess", l: 1.1 }, { t: "robot", l: 0.7 }, { t: "castle", l: 0.4 }, { t: "river", l: 0.2 }
    ];
    var ACTIONS = DE ? {
      Drache: [{ t: "fliegen", l: 3.5 }, { t: "brüllen", l: 1.5 }, { t: "schlafen", l: 0.8 }, { t: "schwimmen", l: 0.5 }, { t: "singen", l: 0.3 }],
      Ritter: [{ t: "kämpfen", l: 3.4 }, { t: "reiten", l: 1.5 }, { t: "singen", l: 0.9 }, { t: "schlafen", l: 0.5 }, { t: "tanzen", l: 0.3 }],
      Roboter: [{ t: "fliegen", l: 3.3 }, { t: "piepen", l: 1.5 }, { t: "singen", l: 0.9 }, { t: "schlafen", l: 0.5 }, { t: "schwimmen", l: 0.3 }],
      Schloss: [{ t: "glänzen", l: 3.2 }, { t: "leuchten", l: 1.5 }, { t: "schlafen", l: 0.8 }, { t: "singen", l: 0.4 }],
      Fluss: [{ t: "fließen", l: 3.5 }, { t: "singen", l: 1.2 }, { t: "brüllen", l: 0.8 }, { t: "gefrieren", l: 0.5 }, { t: "glänzen", l: 0.3 }]
    } : {
      dragon: [{ t: "fly", l: 3.5 }, { t: "roar", l: 1.5 }, { t: "sleep", l: 0.8 }, { t: "swim", l: 0.5 }, { t: "sing", l: 0.3 }],
      princess: [{ t: "sing", l: 3.4 }, { t: "dance", l: 1.5 }, { t: "dream", l: 0.9 }, { t: "sleep", l: 0.5 }, { t: "swim", l: 0.3 }],
      robot: [{ t: "fly", l: 3.3 }, { t: "beep", l: 1.5 }, { t: "sing", l: 0.9 }, { t: "sleep", l: 0.5 }, { t: "swim", l: 0.3 }],
      castle: [{ t: "stand", l: 3.2 }, { t: "glow", l: 1.5 }, { t: "sleep", l: 0.8 }, { t: "sing", l: 0.4 }],
      river: [{ t: "flow", l: 3.5 }, { t: "sing", l: 1.2 }, { t: "roar", l: 0.8 }, { t: "freeze", l: 0.5 }, { t: "shine", l: 0.3 }]
    };
    var RELATIVE = DE ? {
      Drache: [{ t: "der", l: 3.6 }], Ritter: [{ t: "der", l: 3.6 }], Roboter: [{ t: "der", l: 3.6 }],
      Schloss: [{ t: "das", l: 3.6 }], Fluss: [{ t: "der", l: 3.6 }]
    } : null;
    var RELATIVE_TAIL = DE ? {
      Drache: [{ t: "welcher", l: 0.4 }], Ritter: [{ t: "welcher", l: 0.4 }], Roboter: [{ t: "welcher", l: 0.4 }],
      Schloss: [{ t: "welches", l: 0.4 }], Fluss: [{ t: "welcher", l: 0.4 }]
    } : null;
    var MODALS = DE ? [
      { t: "konnte", l: 3.0 }, { t: "wollte", l: 1.3 }, { t: "sollte", l: 0.9 }, { t: "durfte", l: 0.6 }, { t: "musste", l: 0.3 }
    ] : [
      { t: "could", l: 3.0 }, { t: "would", l: 1.3 }, { t: "loved", l: 0.9 }, { t: "tried", l: 0.6 }, { t: "wanted", l: 0.3 }
    ];
    var NEGATORS = DE ? [
      { t: "nicht", l: 3.3 }, { t: "nie", l: 1.2 }, { t: "nur", l: 0.8 }, { t: "noch", l: 0.5 }, { t: "immer", l: 0.3 }
    ] : [
      { t: "not", l: 3.3 }, { t: "never", l: 1.2 }, { t: "only", l: 0.8 }, { t: "still", l: 0.5 }, { t: "always", l: 0.3 }
    ];
    var TAIL = DE ? {
      0: [{ t: "Berg", l: 0.05 }, { t: "Garten", l: -0.15 }, { t: "Vogel", l: -0.35 }],
      2: [{ t: "möchte", l: 0.0 }, { t: "würde", l: -0.2 }],
      3: [{ t: "kaum", l: 0.0 }, { t: "auch", l: -0.2 }],
      4: [{ t: "warten", l: 0.0 }, { t: "dastehen", l: -0.2 }, { t: "wirken", l: -0.4 }]
    } : {
      0: [{ t: "mountain", l: 0.05 }, { t: "garden", l: -0.15 }, { t: "bird", l: -0.35 }],
      2: [{ t: "might", l: 0.0 }, { t: "should", l: -0.2 }],
      3: [{ t: "hardly", l: 0.0 }, { t: "also", l: -0.2 }],
      4: [{ t: "wait", l: 0.0 }, { t: "stand", l: -0.2 }, { t: "seem", l: -0.4 }]
    };
    var CONTINUE = DE ? [
      { t: "Doch", l: 3.0 }, { t: "Dann", l: 1.8 }, { t: "Der", l: 1.1 }, { t: "Ein", l: 0.7 }, { t: "Später", l: 0.4 }, { t: "Niemand", l: 0.2 }
    ] : [
      { t: "But", l: 3.0 }, { t: "Then", l: 1.8 }, { t: "The", l: 1.1 }, { t: "A", l: 0.7 }, { t: "Later", l: 0.4 }, { t: "Nobody", l: 0.2 }
    ];
    function choicesFor(gen) {
      gen = gen || generated;
      var n = gen.length;
      if (n === 0) return NOUNS;
      if (n === 1) {
        if (DE) return RELATIVE[gen[0]] || [{ t: "der", l: 3.6 }];
        var noun = gen[0];
        if (noun === "princess") return [{ t: "that", l: 3.1 }, { t: "who", l: 1.4 }];
        if (noun === "castle" || noun === "river") return [{ t: "that", l: 3.1 }, { t: "which", l: 1.4 }];
        return [{ t: "that", l: 3.1 }, { t: "who", l: 1.4 }, { t: "which", l: 0.8 }];
      }
      if (n === 2) return MODALS;
      if (n === 3) {
        if (DE) return NEGATORS;
        var verb = gen[2];
        if (verb === "could" || verb === "would") return NEGATORS;
        return [{ t: "to", l: 4.0 }];
      }
      if (n === 4) return ACTIONS[gen[0]] || (DE ? ACTIONS.Drache : ACTIONS.dragon);
      if (n === 5) return [{ t: ".", l: 3.2 }, { t: "!", l: 1.1 }, { t: "…", l: 0.7 }];
      if (n === 6) return [{ t: EOS, l: 4.0 }];
      return [];
    }
    var base = DE ? ["Es", "war", "einmal", "ein"] : ["Once", "upon", "a", "time", "there", "was", "a"];
    var generated = [];
    var loopHistory = [];
    var rewindPoints = {};
    var temp = 0.8;
    var decodeMode = "sample";
    var el = document.createElement("div");
    el.className = "ls-loop-scene";
    el.innerHTML =
      '<div class="ls-loop-sentence" aria-live="polite" data-tip-de="Klick auf ein früheres Token, um dorthin zurückzuspringen." data-tip-en="Click an earlier token to jump back to it."></div>' +
      '<div class="ls-loop-tree" aria-live="polite" data-tip-de="Zeigt den bisherigen Pfad und die nächsten Token als Zweige." data-tip-en="Shows the path so far and the next tokens as branches."></div>' +
      '<div class="ls-loop-viz"><div class="ls-loop-bars" data-tip-de="Balken sind die Wahrscheinlichkeiten der nächsten Tokens; klicken wählt eines." data-tip-en="Bars are the probabilities of the next tokens; click one to choose it."></div><div class="ls-loop-landscape" hidden><canvas class="ls-canvas" role="img" data-tip-de="3D-Landschaft: Höhe ist Wahrscheinlichkeit; ziehen dreht, klicken wählt." data-tip-en="3D landscape: height is probability; drag to rotate, click to choose."></canvas><div class="ls-land-tip" hidden></div><div class="ls-land-legend" aria-hidden="true" data-tip-de="Farbskala von unwahrscheinlich zu wahrscheinlich." data-tip-en="Colour scale from unlikely to likely."><div class="ls-land-scale"><span>' + (DE ? "unwahrscheinlich" : "unlikely") + '</span><i></i><span>' + (DE ? "wahrscheinlich" : "likely") + '</span></div><small>' + (DE ? "Ziehen zum Drehen · Klicken zum Wählen" : "Drag to rotate · click to choose") + '</small></div></div></div>' +
      '<div class="ls-loop-bottom">' +
        '<div class="ls-loop-modes" role="group" aria-label="' + (DE ? "Auswahlmodus" : "Decoding mode") + '" data-tip-de="Wählt, wie das nächste Token gezogen wird." data-tip-en="Chooses how the next token is sampled."></div>' +
        '<div class="ls-loop-actions"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-loop-back" aria-label="' + (DE ? "Letztes Token zurücknehmen" : "Take back the last token") + '" data-tip-de="Nimmt das letzte Token zurück." data-tip-en="Takes back the last token.">' + (DE ? "← Zurück" : "← Back") + '</button><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-loop-next" data-tip-de="Zieht das nächste Token und hängt es an." data-tip-en="Draws the next token and appends it.">' + (DE ? "Weiter →" : "Next →") + '</button><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-loop-reset" data-tip-de="Startet die Geschichte neu." data-tip-en="Restarts the story.">' + (DE ? "Neu" : "Reset") + '</button><label class="ls-range">T <input type="range" class="ls-loop-temp" min="0.05" max="1.8" step="0.05" value="0.8" data-tip-de="T steuert die Zufälligkeit; höher flacher, niedriger spitzer." data-tip-en="T controls randomness; higher is flatter, lower is sharper."><output>0.80</output></label></div>' +
        '<div class="ls-loop-readout" aria-live="polite" data-tip-de="Zeigt Schritt, Kontextlänge, Top-Token, Loss und Modus." data-tip-en="Shows step, context length, top token, loss and mode."></div>' +
      '</div>';
    root.appendChild(el);
    var sentenceEl = el.querySelector(".ls-loop-sentence");
    var treeEl = el.querySelector(".ls-loop-tree");
    var barsEl = el.querySelector(".ls-loop-bars");
    var readout = el.querySelector(".ls-loop-readout");
    var tempEl = el.querySelector(".ls-loop-temp");
    var tempOut = el.querySelector(".ls-loop-actions output");
    var nextBtn = el.querySelector(".ls-loop-next");
    var backBtn = el.querySelector(".ls-loop-back");
    var landEl = el.querySelector(".ls-loop-landscape");
    var landCanvas = landEl.querySelector("canvas");
    var landTip = landEl.querySelector(".ls-land-tip");
    var landPoints = [];
    var landscape = true, landSize = null;
    var landYaw = -0.86, landPitch = 0.918, landZoom = 1, landSteep = 1;
    var landCamTween = 0;
    var landDrag = null, landMoved = false, landHits = [], landOptionPoints = [];
    var landBall = { x: 0, y: 0, init: false, animating: false };
    var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var landTrail = [];
    var pathWells = [];
    var pathProb = [];
    var navPast = [];
    var navFuture = [];
    var revealed = [];
    var liveReveal = [];
    var knownProbs = {};
    var tempShown = 0.8;
    var REVEAL_R = 0.95, REVEAL_FEATHER = 0.35;
    var lastPath = [], lastProbs = null, lastTop = null, lastWells = [], lastView = null;
    var landStaticCanvas = null, landStaticKey = "", landStaticDirty = true;
    var LAND_X = 2.95, LAND_Y = 2.05;
    var MEADOW_WORDS = DE ? ["Hund", "Katze", "Baum", "Haus", "Auto", "Buch", "Maus", "Lampe", "Blume", "Stein", "Tisch", "Stuhl", "Wasser", "Feuer", "Nacht", "Sonne", "Regen", "Mond", "Stern", "Fluss", "Berg", "Vogel", "Fisch", "Milch", "Zucker", "Tür", "Fenster", "Brücke", "Feld", "Küche", "Garten", "Schiff", "Uhr", "Straße", "Stadt", "Brot", "Apfel", "Tee", "Hut", "Glocke"] : ["Dog", "Cat", "Tree", "House", "Car", "Book", "Mouse", "Lamp", "Flower", "Stone", "Table", "Chair", "Water", "Fire", "Night", "Sun", "Rain", "Moon", "Star", "River", "Mountain", "Bird", "Fish", "Milk", "Sugar", "Door", "Window", "Bridge", "Field", "Kitchen", "Garden", "Ship", "Clock", "Road", "City", "Bread", "Apple", "Tea", "Hat", "Bell"];

    var PLANE_Z = 0.06;
    var BASE_PROB = 0.001;

    // At the end of the sentence the demo offers plausible next-sentence
    // starts. Use the same list for the bars and the landscape.
    function currentOptions() {
      return choicesFor();
    }

    // One stable token plane for the whole scene: every possible token gets
    // a fixed position once, so the map no longer rearranges itself at each
    // step. Only the heights (the current probabilities) change.
    var catalog = buildCatalog();
    var catalogByToken = {};
    catalog.forEach(function (it) { catalogByToken[it.t] = it; });
    var baseValleys = buildBaseValleys(catalog);

    function addReveal(x, y) { revealed.push({ x: x, y: y }); }
    function revealToken(tok) {
      var c = catalogByToken[tok];
      if (c) addReveal(c.x, c.y);
    }
    function revealSegment(fromTok, toTok) {
      var to = catalogByToken[toTok];
      if (!to) return;
      var from = fromTok ? catalogByToken[fromTok] : null;
      if (!from) { addReveal(to.x, to.y); return; }
      var dx = to.x - from.x, dy = to.y - from.y;
      var steps = Math.max(1, Math.ceil(Math.sqrt(dx * dx + dy * dy) / 0.35));
      for (var i = 1; i <= steps; i++) {
        var t = i / steps;
        addReveal(from.x + dx * t, from.y + dy * t);
      }
    }
    function revealSmooth(t) {
      t = Math.max(0, Math.min(1, t));
      return t * t * (3 - 2 * t);
    }
    function revealFactor(x, y) {
      var best = 0;
      function scan(list) {
        for (var i = 0; i < list.length; i++) {
          var r = list[i];
          var dx = x - r.x, dy = y - r.y;
          var f = revealSmooth((REVEAL_R - Math.sqrt(dx * dx + dy * dy)) / REVEAL_FEATHER);
          if (f > best) best = f;
        }
      }
      scan(revealed);
      scan(liveReveal);
      return best;
    }
    function seedReveal() {
      var opts = choicesFor();
      if (!opts.length) return;
      var probs = softmax(opts.map(function (o) { return o.l; }), temp);
      var top = 0;
      probs.forEach(function (p, i) { if (p > probs[top]) top = i; });
      revealToken(opts[top].t);
    }

    function buildCatalog() {
      var nodes = {};
      function node(t) {
        if (!nodes[t]) nodes[t] = { t: t, depth: null, preds: {}, succs: {}, ctx: {} };
        return nodes[t];
      }
      function link(from, to) {
        if (!from || from === to) return;
        node(from).succs[to] = 1;
        node(to).preds[from] = 1;
      }
      var seen = {};
      function walk(gen) {
        var key = gen.join("\u0001");
        if (seen[key]) return;
        seen[key] = true;
        var p = gen.length;
        var opts = p < MAX_STEPS ? choicesFor(gen) : [];
        if (!opts || !opts.length) return;
        var prev = p ? gen[p - 1] : null;
        opts.forEach(function (o) {
          var v = node(o.t);
          if (v.depth == null) v.depth = p;
          if (prev) link(prev, o.t);
          if (p === 4) v.ctx[gen[0]] = 1;
          if (p < MAX_STEPS) walk(gen.concat(o.t));
        });
      }
      walk([]);
      var maxDepth = 0;
      Object.keys(nodes).forEach(function (k) {
        if (nodes[k].depth != null && nodes[k].depth > maxDepth) maxDepth = nodes[k].depth;
      });
      var columns = {};
      Object.keys(nodes).forEach(function (k) {
        var n = nodes[k];
        if (n.depth == null) n.depth = maxDepth;
        (columns[n.depth] || (columns[n.depth] = [])).push(n);
      });
      var nounOrder = {};
      NOUNS.forEach(function (o, i) { nounOrder[o.t] = i; });
      var x0 = -LAND_X * 0.88, x1 = LAND_X * 0.88;
      function stageX(d) { return maxDepth ? x0 + (d / maxDepth) * (x1 - x0) : 0; }
      Object.keys(columns).forEach(function (d) {
        var col = columns[d];
        var span = 2 * LAND_Y * 0.9;
        col.forEach(function (n, i) {
          n.x = stageX(Number(d));
          n.y = col.length === 1 ? 0 : -span / 2 + span * i / (col.length - 1);
          // Actions keep a small x offset toward the subject they belong to,
          // so the landscape groups them around the words they follow.
          if (Number(d) === 4) {
            var idxs = Object.keys(n.ctx).map(function (k) { return nounOrder[k]; }).filter(function (v) { return v != null; });
            var idx = idxs.length ? idxs.reduce(function (a, b) { return a + b; }, 0) / idxs.length : (NOUNS.length - 1) / 2;
            n.x += (idx - (NOUNS.length - 1) / 2) * 0.30;
            var hash = 0;
            for (var ci = 0; ci < n.t.length; ci++) hash = ((hash * 33) + n.t.charCodeAt(ci)) >>> 0;
            n.x += ((hash % 9) - 4) * 0.032;
          }
        });
      });
      // Keep the very unlikely nouns at the far left edge so the demo shows
      // that they are distant, but still close enough to stay on the map.
      var rareOut = {
        "Fluss": [-0.28, 0.42], "Schloss": [-0.24, -0.42],
        "river": [-0.28, 0.42], "castle": [-0.24, -0.42]
      };
      Object.keys(nodes).forEach(function (k) {
        var off = rareOut[k];
        if (off) { nodes[k].x += off[0]; nodes[k].y += off[1]; }
      });
      // Relax vertically so every token sits near the tokens that can come
      // before or after it. The x position keeps the sentence stages apart.
      var all = Object.keys(nodes).map(function (k) { return nodes[k]; });
      for (var iter = 0; iter < 140; iter++) {
        all.forEach(function (n) {
          if (n.depth === 4) {
            var cs = 0, cw = 0;
            Object.keys(n.ctx).forEach(function (c) { cs += nodes[c].y; cw += 1; });
            if (cw) n.y = n.y * 0.4 + (cs / cw) * 0.6;
            return;
          }
          var sum = 0, w = 0;
          Object.keys(n.preds).forEach(function (p) { sum += nodes[p].y; w += 1; });
          Object.keys(n.succs).forEach(function (s) { sum += nodes[s].y * 0.55; w += 0.55; });
          Object.keys(n.ctx).forEach(function (c) { sum += nodes[c].y * 1.5; w += 1.5; });
          if (w > 0) n.y = n.y * 0.55 + (sum / w) * 0.45;
        });
        var buckets = {};
        all.forEach(function (n) {
          var key = String(n.x);
          if (!buckets[key]) buckets[key] = [];
          buckets[key].push(n);
        });
        Object.keys(buckets).forEach(function (key) {
          var col = buckets[key].slice().sort(function (a, b) { return a.y - b.y; });
          var maxGap = col[0] && col[0].depth === 4 ? 0.34 : 0.72;
          var gap = col.length > 1 ? Math.min(maxGap, (2 * LAND_Y * 0.92) / (col.length - 1)) : 0;
          for (var i = 1; i < col.length; i++) {
            if (col[i].y - col[i - 1].y < gap) col[i].y = col[i - 1].y + gap;
          }
          var limit = LAND_Y * 0.94;
          var top = col[col.length - 1].y;
          if (top > limit) { var shift = top - limit; col.forEach(function (n) { n.y -= shift; }); }
          var bottom = col[0].y;
          if (bottom < -limit) { var shift2 = -limit - bottom; col.forEach(function (n) { n.y += shift2; }); }
        });
      }
      return Object.keys(nodes).map(function (k) {
        return { t: k, x: nodes[k].x, y: nodes[k].y };
      });
    }

    // Small fixed valleys between neighbouring words. They give the paths a
    // shallow dip to cross instead of a smooth slope from one word well to
    // the next.
    function buildBaseValleys(list) {
      var out = [], seen = {};
      list.forEach(function (a, i) {
        var best = null, bestJ = -1, bd = Infinity;
        list.forEach(function (b, j) {
          if (i === j) return;
          var dx = b.x - a.x, dy = b.y - a.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < bd) { bd = d; best = b; bestJ = j; }
        });
        if (!best || bd < 0.12 || bd > 0.95) return;
        var key = [i, bestJ].sort(function (x, y) { return x - y; }).join(":");
        if (seen[key]) return;
        seen[key] = 1;
        out.push({
          x: (a.x + best.x) / 2,
          y: (a.y + best.y) / 2,
          p: 0.24,
          s: 0.13
        });
      });
      return out;
    }

    function landWells(items) {
      return items.map(function (it) { return { x: it.x, y: it.y, p: it.p }; });
    }

    // A fixed, gentle base terrain keeps the whole map present and stable.
    // Each step only adds local bumps around its current options; those bumps
    // are the areas the lantern moves to.
    function landBase(x, y) {
      var waves = 0.5 + 0.5 * Math.sin(0.9 * x + 0.4) * Math.cos(1.1 * y - 0.3);
      return BASE_PROB + 0.003 * waves;
    }
    function landProb(x, y, wells) {
      var value = 0, weight = 0;
      wells.forEach(function (w) {
        var dx = x - w.x, dy = y - w.y;
        var sigma = w.s || 0.2;
        var k = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        value += k * w.p;
        weight += k;
      });
      var base = landBase(x, y);
      var coverage = Math.min(1, weight);
      var blended = (value + base * (1 - coverage)) / (weight + (1 - coverage));
      return Math.max(BASE_PROB, Math.min(0.995, blended));
    }

    // z = −p: hohe Wahrscheinlichkeit liegt tief, die Fläche zeigt die negative Wahrscheinlichkeit.
    function landZ(p) { return -Math.max(0, Math.min(1, p)) * landSteep; }

    function landRaw(x, y, z) {
      var cy = Math.cos(landYaw), sy = Math.sin(landYaw);
      var cp = Math.cos(landPitch), sp = Math.sin(landPitch);
      var x1 = x * cy - y * sy;
      var y1 = x * sy + y * cy;
      var y2 = y1 * cp + z * sp;
      var z2 = y1 * sp + z * cp;
      return { x: x1, y: -y2, z: z2 };
    }

    function colorParts(v) {
      var m = String(v).match(/^#?([0-9a-f]{6})$/i);
      if (!m) return null;
      var h = m[1];
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    var mixColor = api.util.hexMix;
    function landColor(p, C) {
      var stops = [
        { p: 0, c: C.petrol },
        { p: 0.30, c: C.blue },
        { p: 0.55, c: C.sky },
        { p: 0.78, c: C.lime },
        { p: 1, c: C.green }
      ];
      p = Math.max(0, Math.min(1, p));
      for (var i = 1; i < stops.length; i++) {
        if (p <= stops[i].p) {
          var t = (p - stops[i - 1].p) / Math.max(0.001, stops[i].p - stops[i - 1].p);
          return mixColor(stops[i - 1].c, stops[i].c, t);
        }
      }
      return C.green;
    }

    function tweenCamera(pitch, yaw, zoom) {
      if (reducedMotion) {
        landPitch = pitch; landYaw = yaw; landZoom = zoom;
        landStaticDirty = true; drawLandscape(); return;
      }
      if (landCamTween) cancelAnimationFrame(landCamTween);
      var startP = landPitch, startY = landYaw, startZ = landZoom, start = performance.now();
      var dur = (api.motion && api.motion.scale) ? api.motion.scale((api.motion && api.motion.camera) || 280) : ((api.motion && api.motion.camera) || 280);
      function step(now) {
        var t = Math.min(1, (now - start) / dur);
        var e = t * t * (3 - 2 * t);
        landPitch = startP + (pitch - startP) * e;
        landYaw = startY + (yaw - startY) * e;
        landZoom = startZ + (zoom - startZ) * e;
        landStaticDirty = true;
        drawLandscape();
        if (t < 1) landCamTween = requestAnimationFrame(step);
        else landCamTween = 0;
      }
      landCamTween = requestAnimationFrame(step);
    }
    function drawWordBackdrop(ctx, w, h, C) {
      var seed = 17;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      var palette = [C.green, C.sky, C.lime, C.gold, C.lilac, C.blue];
      MEADOW_WORDS.forEach(function (word, i) {
        var x = (0.06 + rnd() * 0.88) * w;
        var y = (0.08 + rnd() * 0.84) * h;
        ctx.globalAlpha = 0.035 + (i % 3) * 0.012;
        ctx.fillStyle = palette[i % palette.length];
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.fillText(word, x, y);
        ctx.beginPath();
        ctx.arc(x, y - 9, 1.4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    function frayEdges(ctx, b) {
      var seed = 29;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      for (var i = 0; i < 30; i++) {
        var side = i % 4;
        var t = rnd();
        var x, y;
        if (side === 0) { x = b.x0 + t * (b.x1 - b.x0); y = b.y0 + (rnd() - 0.5) * 12; }
        else if (side === 1) { x = b.x0 + t * (b.x1 - b.x0); y = b.y1 + (rnd() - 0.5) * 12; }
        else if (side === 2) { x = b.x0 + (rnd() - 0.5) * 12; y = b.y0 + t * (b.y1 - b.y0); }
        else { x = b.x1 + (rnd() - 0.5) * 12; y = b.y0 + t * (b.y1 - b.y0); }
        var r = 18 + rnd() * 38;
        var g = ctx.createRadialGradient(x, y, 1, x, y, r);
        g.addColorStop(0, "rgba(0,0,0,.95)");
        g.addColorStop(0.55, "rgba(0,0,0,.65)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    function drawEdgeFog(ctx, b, C) {
      var seed = 41;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      ctx.save();
      for (var i = 0; i < 18; i++) {
        var side = i % 4;
        var t = rnd();
        var x, y;
        if (side === 0) { x = b.x0 + t * (b.x1 - b.x0); y = b.y0 + (rnd() - 0.5) * 24; }
        else if (side === 1) { x = b.x0 + t * (b.x1 - b.x0); y = b.y1 + (rnd() - 0.5) * 24; }
        else if (side === 2) { x = b.x0 + (rnd() - 0.5) * 24; y = b.y0 + t * (b.y1 - b.y0); }
        else { x = b.x1 + (rnd() - 0.5) * 24; y = b.y0 + t * (b.y1 - b.y0); }
        var r = 28 + rnd() * 58;
        var g = ctx.createRadialGradient(x, y, 2, x, y, r);
        g.addColorStop(0, "rgba(255,255,255,.72)");
        g.addColorStop(0.6, "rgba(238,247,244,.45)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    function drawEdgeTokens(ctx, b, C) {
      var seed = 53;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      var edges = MEADOW_WORDS.slice(4, 18);
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (var i = 0; i < 9; i++) {
        var side = i % 4;
        var t = (i + 0.3) / 9;
        var x, y;
        if (side === 0) { x = b.x0 + t * (b.x1 - b.x0); y = b.y0 - 6 + rnd() * 10; }
        else if (side === 1) { x = b.x0 + t * (b.x1 - b.x0); y = b.y1 + 6 - rnd() * 10; }
        else if (side === 2) { x = b.x0 - 6 + rnd() * 10; y = b.y0 + t * (b.y1 - b.y0); }
        else { x = b.x1 + 6 - rnd() * 10; y = b.y0 + t * (b.y1 - b.y0); }
        var word = edges[(i * 3 + 1) % edges.length];
        ctx.globalAlpha = 0.12 + (i % 3) * 0.035;
        ctx.fillStyle = [C.muted, C.petrol, C.blue][i % 3];
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.fillText(word, x, y);
        ctx.beginPath();
        ctx.arc(x, y - 8, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    function drawLandscapeStatic(ctx, w, h) {
      var C = api.colors();
      if (w < 10 || h < 10) return;
      ctx.clearRect(0, 0, w, h);
      var sky = ctx.createRadialGradient(w * 0.5, h * 0.4, 8, w * 0.5, h * 0.5, Math.max(w, h) * 0.62);
      sky.addColorStop(0, "rgba(247,250,249,.9)");
      sky.addColorStop(0.6, "rgba(238,247,244,.55)");
      sky.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      var opts = currentOptions();
      var probs = softmax(opts.map(function (o) { return o.l; }), tempShown);
      var probByToken = {};
      knownProbs = {};
      opts.forEach(function (o, i) { probByToken[o.t] = probs[i]; knownProbs[o.t] = probs[i]; });
      var items = catalog.map(function (it) {
        var p = probByToken[it.t];
        return { t: it.t, x: it.x, y: it.y, p: p == null ? 0 : p, current: p != null, known: p != null };
      });
      liveReveal = items.filter(function (it) { return it.current; }).map(function (it) { return { x: it.x, y: it.y }; });
      var wells = landWells(items.filter(function (it) { return it.known; })).concat(pathWells, baseValleys);
      lastWells = wells;
      var currentItems = items.filter(function (it) { return it.current; }).sort(function (a, b) { return b.p - a.p; });
      var top = currentItems[0] || null;
      lastProbs = probByToken;
      lastTop = top;

      var NX = w > 700 ? 42 : 32, NY = w > 700 ? 26 : 20;
      var grid = [];
      var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      function include(rp) {
        if (rp.x < minX) minX = rp.x;
        if (rp.x > maxX) maxX = rp.x;
        if (rp.y < minY) minY = rp.y;
        if (rp.y > maxY) maxY = rp.y;
      }
      for (var i = 0; i <= NX; i++) {
        grid[i] = [];
        for (var j = 0; j <= NY; j++) {
          var gx = -LAND_X + 2 * LAND_X * i / NX;
          var gy = -LAND_Y + 2 * LAND_Y * j / NY;
          var gp = landProb(gx, gy, wells);
          var gh = landZ(gp);
          var rp = landRaw(gx, gy, gh);
          grid[i][j] = { x: gx, y: gy, p: gp, h: gp, rx: rp.x, ry: rp.y, rz: rp.z };
          include(rp);
        }
      }
      [[-LAND_X, -LAND_Y], [LAND_X, -LAND_Y], [LAND_X, LAND_Y], [-LAND_X, LAND_Y]].forEach(function (c) {
        include(landRaw(c[0], c[1], PLANE_Z));
      });
      var axisX = LAND_X + 0.26, axisY = LAND_Y + 0.10;
      include(landRaw(axisX, axisY, landZ(0)));
      include(landRaw(axisX, axisY, landZ(1)));
      var pad = Math.min(w, h) * 0.09;
      var scale = Math.min((w - pad * 2) / Math.max(0.001, maxX - minX), (h - pad * 2) / Math.max(0.001, maxY - minY)) * landZoom;
      var ox = w / 2 - (minX + maxX) / 2 * scale;
      var oy = h / 2 - (minY + maxY) / 2 * scale;
      function sx(rx) { return rx * scale + ox; }
      function sy(ry) { return ry * scale + oy; }
      lastView = { sx: sx, sy: sy };
      var sbx0 = Infinity, sbx1 = -Infinity, sby0 = Infinity, sby1 = -Infinity;
      for (var sbi = 0; sbi <= NX; sbi++) {
        for (var sbj = 0; sbj <= NY; sbj++) {
          var sbp = grid[sbi][sbj];
          var sbX = sx(sbp.rx), sbY = sy(sbp.ry);
          if (sbX < sbx0) sbx0 = sbX;
          if (sbX > sbx1) sbx1 = sbX;
          if (sbY < sby0) sby0 = sbY;
          if (sbY > sby1) sby1 = sbY;
        }
      }
      var sBounds = { x0: sbx0, y0: sby0, x1: sbx1, y1: sby1 };

      var quads = [];
      for (var qi = 0; qi < NX; qi++) {
        for (var qj = 0; qj < NY; qj++) {
          var a = grid[qi][qj], b = grid[qi + 1][qj], c = grid[qi + 1][qj + 1], d = grid[qi][qj + 1];
          quads.push({
            p: [a, b, c, d],
            h: (a.h + b.h + c.h + d.h) / 4,
            z: (a.rz + b.rz + c.rz + d.rz) / 4
          });
        }
      }
      quads.sort(function (a, b) { return b.z - a.z; });
      quads.forEach(function (q) {
        var qx = (q.p[0].x + q.p[1].x + q.p[2].x + q.p[3].x) / 4;
        var qy = (q.p[0].y + q.p[1].y + q.p[2].y + q.p[3].y) / 4;
        var rf = revealFactor(qx, qy);
        ctx.beginPath();
        ctx.moveTo(sx(q.p[0].rx), sy(q.p[0].ry));
        ctx.lineTo(sx(q.p[1].rx), sy(q.p[1].ry));
        ctx.lineTo(sx(q.p[2].rx), sy(q.p[2].ry));
        ctx.lineTo(sx(q.p[3].rx), sy(q.p[3].ry));
        ctx.closePath();
        ctx.fillStyle = landColor(q.h, C);
        ctx.globalAlpha = 0.14 + 0.86 * rf;
        ctx.fill();
        ctx.globalAlpha = 0.05 + 0.17 * rf;
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // The world does not end in a hard rectangle. The terrain edge is
      // nibbled away, fog banks sit in the gaps, and faint token names show
      // that the surrounding space is full of more tokens.
      frayEdges(ctx, sBounds);
      drawEdgeFog(ctx, sBounds, C);
      drawWordBackdrop(ctx, w, h, C);
      drawEdgeTokens(ctx, sBounds, C);

      // The lantern forecasts the next word: it sits on the deepest current
      // valley, so the plot is always one word ahead of the sentence.
      if (top) {
        var glowPt = landRaw(top.x, top.y, landZ(top.p));
        var gx = sx(glowPt.x), gy = sy(glowPt.y);
        var glowR = Math.max(44, Math.min(w, h) * 0.19);
        var glow = ctx.createRadialGradient(gx, gy, 2, gx, gy, glowR);
        glow.addColorStop(0, C.gold);
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(gx, gy, glowR, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Token-Ebene (2D), oberhalb der Wahrscheinlichkeitsfläche.
      var planeCorners = [[-LAND_X, -LAND_Y], [LAND_X, -LAND_Y], [LAND_X, LAND_Y], [-LAND_X, LAND_Y]].map(function (c) {
        var rp = landRaw(c[0], c[1], PLANE_Z);
        return { x: sx(rp.x), y: sy(rp.y) };
      });
      ctx.beginPath();
      ctx.moveTo(planeCorners[0].x, planeCorners[0].y);
      for (var pc = 1; pc < planeCorners.length; pc++) ctx.lineTo(planeCorners[pc].x, planeCorners[pc].y);
      ctx.closePath();
      ctx.fillStyle = C.paper;
      ctx.globalAlpha = 0.06;
      ctx.fill();
      ctx.globalAlpha = 0.30;
      ctx.strokeStyle = C.lineStrong;
      ctx.lineWidth = 1;
      ctx.stroke();
      for (var pg = 1; pg < 6; pg++) {
        var planeGx = -LAND_X + 2 * LAND_X * pg / 6;
        var planeGy = -LAND_Y + 2 * LAND_Y * pg / 6;
        var pa1 = landRaw(planeGx, -LAND_Y, PLANE_Z), pa2 = landRaw(planeGx, LAND_Y, PLANE_Z);
        ctx.beginPath(); ctx.moveTo(sx(pa1.x), sy(pa1.y)); ctx.lineTo(sx(pa2.x), sy(pa2.y)); ctx.stroke();
        var pb1 = landRaw(-LAND_X, planeGy, PLANE_Z), pb2 = landRaw(LAND_X, planeGy, PLANE_Z);
        ctx.beginPath(); ctx.moveTo(sx(pb1.x), sy(pb1.y)); ctx.lineTo(sx(pb2.x), sy(pb2.y)); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      var planeLabel = landRaw(-LAND_X, -LAND_Y, PLANE_Z);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(DE ? "Token-Ebene (2D)" : "token plane (2D)", sx(planeLabel.x) + 4, sy(planeLabel.y) - 4);

      // z-Achse: negative Wahrscheinlichkeit von 0 bis −1.
      var ab = landRaw(axisX, axisY, 0), at = landRaw(axisX, axisY, -1);
      ctx.strokeStyle = C.lineStrong;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sx(ab.x), sy(ab.y)); ctx.lineTo(sx(at.x), sy(at.y)); ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      [0, -0.25, -0.5, -0.75, -1].forEach(function (v) {
        var tick = landRaw(axisX, axisY, v);
        var tick2 = landRaw(axisX + 0.08, axisY, v);
        var tx = sx(tick.x), ty = sy(tick.y);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(sx(tick2.x), sy(tick2.y)); ctx.stroke();
        ctx.fillText(v === 0 ? "0" : v.toFixed(2).replace("-", "−"), tx + 6, ty + 3);
      });
      ctx.fillStyle = C.petrol;
      ctx.font = '600 ' + api.font("canvas") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "right";
      ctx.fillText(DE ? "Wahrscheinlichkeit −p" : "probability −p", sx(ab.x) - 6, sy(ab.y) - 10);

      var atEnd = generated.length >= MAX_STEPS;
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(DE ? "z = −p · tiefer = wahrscheinlicher" : "z = −p · lower = more likely", 10, 16);
      if (atEnd) ctx.fillText(DE ? "Satzende · <|endoftext|>" : "end of sentence · <|endoftext|>", 10, 29);

      var boxes = [];
      function freeBox(box) {
        for (var k = 0; k < boxes.length; k++) {
          var b2 = boxes[k];
          if (!(box.x + box.w < b2.x || b2.x + b2.w < box.x || box.y + box.h < b2.y || b2.y + b2.h < box.y)) return false;
        }
        return true;
      }
      landHits = [];
      landOptionPoints = [];

      // The runner-up at every step stays as a faint side path, so the
      // alternative routes remain visible next to the golden one.
      var altPts = [];
      loopHistory.forEach(function (entry) {
        var alts = (entry.alternatives || []).filter(function (a) {
          return a.p != null && catalogByToken[a.token];
        });
        if (!alts.length) return;
        alts.sort(function (a, b) { return b.p - a.p; });
        var alt = alts[0];
        var c = catalogByToken[alt.token];
        var prevTok = entry.index > 0 ? generated[entry.index - 1] : null;
        var from = prevTok && catalogByToken[prevTok] ? catalogByToken[prevTok] : null;
        var sp = landRaw(c.x, c.y, landZ(landProb(c.x, c.y, wells)));
        var fp = from ? landRaw(from.x, from.y, landZ(landProb(from.x, from.y, wells))) : null;
        altPts.push({
          t: alt.token,
          sx: sx(sp.x), sy: sy(sp.y),
          fx: fp ? sx(fp.x) : null,
          fy: fp ? sy(fp.y) : null
        });
      });
      if (altPts.length) {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = C.sky;
        ctx.globalAlpha = 0.38;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        altPts.forEach(function (p) {
          if (p.fx == null) return;
          ctx.moveTo(p.fx, p.fy);
          ctx.lineTo(p.sx, p.sy);
        });
        ctx.stroke();
        ctx.setLineDash([]);
        altPts.forEach(function (p) {
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 4, 0, Math.PI * 2);
          ctx.fillStyle = C.paper;
          ctx.fill();
          ctx.strokeStyle = C.sky;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
      }

      // The actual chosen path. Each chosen token keeps the probability it
      // had when it was picked, so its valley stays in the surface and the
      // golden line rolls through a chain of valleys instead of jumping
      // across the plane.
      var pathPts = [];
      generated.forEach(function (tok, idx) {
        var c = catalogByToken[tok];
        if (!c) return;
        var planePt = landRaw(c.x, c.y, PLANE_Z);
        var p = probByToken[tok];
        if (p == null && pathProb[idx] != null) p = pathProb[idx];
        var hasP = p != null;
        var surfaceP = landProb(c.x, c.y, wells);
        var surfPt = landRaw(c.x, c.y, landZ(surfaceP));
        pathPts.push({
          t: tok, idx: idx,
          px: sx(planePt.x), py: sy(planePt.y),
          sx: sx(surfPt.x), sy: sy(surfPt.y),
          p: hasP ? p : null,
          current: probByToken[tok] != null
        });
      });
      lastPath = pathPts.slice();
      var pathPByToken = {};
      pathPts.forEach(function (p) { if (p.p != null) pathPByToken[p.t] = p.p; });
      landPoints = catalog.map(function (c) {
        var p = probByToken[c.t];
        if (p == null && pathPByToken[c.t] != null) p = pathPByToken[c.t];
        var pp = landRaw(c.x, c.y, PLANE_Z);
        var sp = landRaw(c.x, c.y, landZ(landProb(c.x, c.y, wells)));
        return { t: c.t, px: sx(pp.x), py: sy(pp.y), sx: sx(sp.x), sy: sy(sp.y), p: p };
      });
      if (pathPts.length) {
        ctx.lineJoin = "round";
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = C.gold;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1;
        ctx.beginPath();
        pathPts.forEach(function (p) {
          ctx.moveTo(p.px, p.py);
          ctx.lineTo(p.sx, p.sy);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = C.paper;
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = 5;
        ctx.beginPath();
        pathPts.forEach(function (p, i) { if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy); });
        ctx.stroke();
        ctx.strokeStyle = C.gold;
        ctx.globalAlpha = 0.95;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        pathPts.forEach(function (p, i) { if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy); });
        ctx.stroke();
        ctx.globalAlpha = 1;

        pathPts.forEach(function (p) {
          ctx.beginPath();
          ctx.arc(p.px, p.py, 3, 0, Math.PI * 2);
          ctx.fillStyle = C.paper;
          ctx.fill();
          ctx.strokeStyle = C.gold;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 7, 0, Math.PI * 2);
          ctx.fillStyle = C.paper;
          ctx.fill();
          ctx.strokeStyle = C.gold;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = C.ink;
          ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(p.idx + 1), p.sx, p.sy + 0.5);
        });
        ctx.textBaseline = "middle";
      }

      currentItems.forEach(function (it) {
        var planePt = landRaw(it.x, it.y, PLANE_Z);
        var surfPt = landRaw(it.x, it.y, landZ(it.p));
        var px = sx(planePt.x), py = sy(planePt.y);
        var surfX = sx(surfPt.x), surfY = sy(surfPt.y);
        var isTop = it === top;

        ctx.strokeStyle = isTop ? C.green : C.petrol;
        ctx.globalAlpha = 0.45;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(surfX, surfY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(surfX, surfY, isTop ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isTop ? C.green : C.petrol;
        ctx.fill();
        ctx.strokeStyle = C.paper;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(px, py, isTop ? 4 : 2.6, 0, Math.PI * 2);
        ctx.fillStyle = C.paper;
        ctx.strokeStyle = isTop ? C.green : C.petrol;
        ctx.lineWidth = isTop ? 2 : 1.4;
        ctx.stroke();
        if (!atEnd) {
          landHits.push({ x: surfX - 12, y: surfY - 12, w: 24, h: 24, t: it.t });
          landOptionPoints.push({ x: surfX, y: surfY, t: it.t });
        }

        var pct = (it.p * 100).toFixed(it.p * 100 < 1 ? 1 : 0) + "%";
        ctx.font = '600 ' + api.font("canvas") + 'px "Open Sans", sans-serif';
        var tw = Math.max(ctx.measureText(it.t).width, ctx.measureText(pct).width) + 12;
        var bh = 28;
        var offsets = [[0, -bh - 8], [0, 10], [-tw / 2 - 10, -bh / 2], [tw / 2 + 10, -bh / 2], [0, -bh - 24], [0, 24]];
        var box = null;
        for (var oi = 0; oi < offsets.length; oi++) {
          var bx = px - tw / 2 + offsets[oi][0];
          var by = py - bh / 2 + offsets[oi][1];
          var cand = { x: bx, y: by, w: tw, h: bh };
          if (bx >= 4 && by >= 4 && bx + tw <= w - 4 && by + bh <= h - 4 && freeBox(cand)) { box = cand; break; }
        }
        if (!box) {
          box = { x: Math.max(4, Math.min(w - tw - 4, px - tw / 2)), y: Math.max(4, Math.min(h - bh - 4, py - bh - 8)), w: tw, h: bh };
        }
        boxes.push(box);
        if (!atEnd) landHits.push({ x: box.x, y: box.y, w: box.w, h: box.h, t: it.t });

        ctx.strokeStyle = C.line;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(box.x + box.w / 2, box.y + box.h / 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.paper;
        ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.strokeStyle = isTop ? C.green : C.line;
        ctx.lineWidth = isTop ? 1.6 : 1;
        ctx.strokeRect(box.x, box.y, box.w, box.h);
        ctx.fillStyle = C.ink;
        ctx.font = '600 ' + api.font("canvas") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(it.t, box.x + 6, box.y + 13);
        ctx.fillStyle = C.muted;
        ctx.font = api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.fillText(pct, box.x + 6, box.y + 23);
      });

      // Every other token stays on the map with a quiet label, so the whole
      // plane is populated even when it is not the current choice set.
      items.forEach(function (it) {
        if (it.current) return;
        var planePt = landRaw(it.x, it.y, PLANE_Z);
        var px = sx(planePt.x), py = sy(planePt.y);
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = C.muted;
        ctx.globalAlpha = 0.55;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.font = '500 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        var tw = ctx.measureText(it.t).width;
        var bh = 14;
        var offsets = [[0, -bh - 2], [0, 4], [-tw - 5, -bh / 2], [5, -bh / 2]];
        for (var oi = 0; oi < offsets.length; oi++) {
          var bx = px - tw / 2 + offsets[oi][0];
          var by = py - bh / 2 + offsets[oi][1];
          var cand = { x: bx, y: by, w: tw, h: bh };
          if (bx >= 3 && by >= 3 && bx + tw <= w - 3 && by + bh <= h - 3 && freeBox(cand)) {
            boxes.push(cand);
            var fog = revealFactor(it.x, it.y);
            if (fog < 0.04) { ctx.globalAlpha = 1; break; }
            ctx.fillStyle = C.muted;
            ctx.globalAlpha = 0.10 + 0.62 * fog;
            ctx.textAlign = "left";
            ctx.fillText(it.t, bx, by + 10);
            ctx.globalAlpha = 1;
            break;
          }
        }
      });

      if (top) {
        if (readout) {
          var cells = readout.querySelectorAll("span");
          if (cells[2]) cells[2].innerHTML = (DE ? "Top" : "Top") + ' <b>' + api.esc(top.t) + '</b>';
        }
        landCanvas.setAttribute("aria-label", DE
          ? "Wahrscheinlichkeitslandschaft. Token-Ebene oben, z = −p. Blau ist unwahrscheinlich, Grün wahrscheinlich. Tiefster Punkt, also höchste Wahrscheinlichkeit: " + top.t + ", " + (top.p * 100).toFixed(0) + " Prozent."
          : "Probability landscape. Token plane above, z = −p. Blue is unlikely, green likely. Deepest point, meaning highest probability: " + top.t + ", " + (top.p * 100).toFixed(0) + " percent.");
      } else {
        landCanvas.setAttribute("aria-label", DE
          ? "Wahrscheinlichkeitslandschaft. Der Satz ist beendet, das Modell hat <|endoftext|> ausgegeben."
          : "Probability landscape. The sentence is finished; the model emitted <|endoftext|>.");
      }
    }

    function drawLandBall(ctx, w, h) {
      var C = api.colors();
      var top = lastTop;
      var wells = lastWells;
      var atEnd = generated.length > 0 && generated[generated.length - 1] === EOS;
      if (atEnd) {
        landBall.animating = false;
        landTrail = [];
      }
      var ballTarget = null;
      if (generated.length) {
        var lastIdx = generated.length - 1;
        var lastToken = generated[lastIdx];
        var lastCat = catalogByToken[lastToken];
        if (lastCat) {
          var lastP = lastProbs ? lastProbs[lastToken] : null;
          if (lastP == null && pathProb[lastIdx] != null) lastP = pathProb[lastIdx];
          ballTarget = { x: lastCat.x, y: lastCat.y, p: lastP == null ? BASE_PROB : lastP };
        }
      }
      if (!ballTarget && top) ballTarget = top;
      if (!ballTarget || !lastView) return;
      var ballP = landProb(ballTarget.x, ballTarget.y, wells);
      var ballPt = landRaw(ballTarget.x, ballTarget.y, landZ(ballP));
      var btx = lastView.sx(ballPt.x), bty = lastView.sy(ballPt.y);
      if (!landBall.init) { landBall.x = btx; landBall.y = bty; landBall.init = true; }
      var bdx = btx - landBall.x, bdy = bty - landBall.y;
      if (reducedMotion || atEnd) {
        landBall.x = btx; landBall.y = bty; landBall.animating = false;
        landTrail = [];
      } else if (Math.abs(bdx) + Math.abs(bdy) > 1.2) {
        landBall.x += bdx * 0.18;
        landBall.y += bdy * 0.18;
        landBall.animating = true;
        landTrail.push({ x: landBall.x, y: landBall.y });
        if (landTrail.length > 26) landTrail.shift();
      } else {
        landBall.x = btx; landBall.y = bty; landBall.animating = false;
      }
      if (landTrail.length > 1) {
        ctx.beginPath();
        landTrail.forEach(function (p, i) { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
        ctx.strokeStyle = C.green;
        ctx.globalAlpha = 0.30;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.ellipse(landBall.x, landBall.y + 5, 8, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,.18)";
      ctx.fill();
      var ballGrad = ctx.createRadialGradient(landBall.x - 2, landBall.y - 3, 1, landBall.x, landBall.y, 8);
      ballGrad.addColorStop(0, "#fff");
      ballGrad.addColorStop(0.4, C.green);
      ballGrad.addColorStop(1, "rgba(99,164,75,.25)");
      ctx.beginPath();
      ctx.arc(landBall.x, landBall.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = ballGrad;
      ctx.fill();
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (landBall.animating) requestAnimationFrame(drawLandscape);
    }
    function drawLandscape() {
      if (!landscape || !landSize) return;
      var w = landSize.w, h = landSize.h;
      if (w < 10 || h < 10) return;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var key = w + "x" + h + "@" + dpr;
      if (!landStaticCanvas || key !== landStaticKey) {
        landStaticCanvas = document.createElement("canvas");
        landStaticCanvas.width = Math.round(w * dpr);
        landStaticCanvas.height = Math.round(h * dpr);
        landStaticKey = key;
        landStaticDirty = true;
      }
      if (landStaticDirty) {
        var sctx = landStaticCanvas.getContext("2d");
        sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawLandscapeStatic(sctx, w, h);
        landStaticDirty = false;
      }
      var ctx = landSize.ctx;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(landStaticCanvas, 0, 0, w, h);
      drawLandBall(ctx, w, h);
    }

    function landResize() {
      if (!landscape) return;
      var r = landEl.getBoundingClientRect();
      if (r.width < 10 || r.height < 10) return;
      landSize = api.fit(landCanvas, landEl);
      landStaticDirty = true;
      drawLandscape();
    }

    function setLandscape(on) {
      landscape = !!on;
      el.classList.toggle("is-landscape", landscape);
      landEl.hidden = !landscape;
      if (!landscape) landBall.animating = false;
      if (landscape) {
        if (!landSize) landSize = api.fit(landCanvas, landEl);
        landStaticDirty = true;
        drawLandscape();
        requestAnimationFrame(landResize);
      }
    }

    function landHitAt(x, y) {
      for (var i = 0; i < landHits.length; i++) {
        var b = landHits[i];
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
      }
      var best = null, bd = 66;
      landOptionPoints.forEach(function (p) {
        var d = Math.hypot(x - p.x, y - p.y);
        if (d < bd) { bd = d; best = p; }
      });
      return best ? { t: best.t } : null;
    }

    function landPointer(e) {
      var r = landCanvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function hideLandTip() { if (landTip) landTip.hidden = true; }
    function updateLandTip(x, y) {
      if (!landTip) return;
      var best = null, bd = 18;
      landPoints.forEach(function (pt) {
        var d = Math.min(Math.hypot(x - pt.sx, y - pt.sy), Math.hypot(x - pt.px, y - pt.py));
        if (d < bd) { bd = d; best = pt; }
      });
      if (!best) { hideLandTip(); return; }
      var pct = best.p == null ? "—" : (best.p * 100).toFixed(best.p * 100 < 1 ? 1 : 0) + "%";
      var z = best.p == null ? "—" : (-best.p).toFixed(2).replace("-", "−");
      landTip.innerHTML = '<b>' + api.esc(best.t) + '</b> · p = ' + pct +
        ' · z = ' + z +
        ' · ' + (DE ? 'Tal-Tiefe' : 'valley depth') + ' = ' + pct;
      landTip.hidden = false;
      var lw = landSize ? landSize.w : landEl.clientWidth;
      var lh = landSize ? landSize.h : landEl.clientHeight;
      var tw = landTip.offsetWidth, th = landTip.offsetHeight;
      landTip.style.left = Math.max(6, Math.min(lw - tw - 6, x + 12)) + "px";
      landTip.style.top = Math.max(6, Math.min(lh - th - 6, y - th - 10)) + "px";
    }

    landCanvas.addEventListener("pointerdown", function (e) {
      if (landCamTween) { cancelAnimationFrame(landCamTween); landCamTween = 0; }
      hideLandTip();
      landMoved = false;
      landDrag = { x: e.clientX, y: e.clientY, yaw: landYaw, pitch: landPitch };
      if (landCanvas.setPointerCapture) { try { landCanvas.setPointerCapture(e.pointerId); } catch (err) {} }
    });
    landCanvas.addEventListener("pointermove", function (e) {
      var p = landPointer(e);
      if (landDrag) {
        var dx = e.clientX - landDrag.x, dy = e.clientY - landDrag.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) landMoved = true;
        landYaw = landDrag.yaw + dx * 0.008;
        landPitch = Math.min(1.52, Math.max(0.9, landDrag.pitch - dy * 0.006));
        landStaticDirty = true;
        drawLandscape();
        return;
      }
      landCanvas.style.cursor = landHitAt(p.x, p.y) ? "pointer" : "grab";
      updateLandTip(p.x, p.y);
    });
    landCanvas.addEventListener("pointerup", function (e) {
      if (landDrag && !landMoved) {
        var p = landPointer(e);
        var hit = landHitAt(p.x, p.y);
        if (hit) choose(hit.t);
      }
      landDrag = null;
      hideLandTip();
    });
    landCanvas.addEventListener("pointercancel", function () { landDrag = null; hideLandTip(); });
    landCanvas.addEventListener("pointerleave", function () { hideLandTip(); if (!landDrag) landCanvas.style.cursor = "grab"; });

    function softmax(logits, t) {
      var max = Math.max.apply(null, logits);
      var exps = logits.map(function (l) { return Math.exp((l - max) / Math.max(0.05, t)); });
      var sum = exps.reduce(function (a, b) { return a + b; }, 0);
      return exps.map(function (e) { return e / sum; });
    }
    function renderSentence() {
      var html = "";
      var all = base.map(function (tok, i) {
        if (DE && i === base.length - 1 && generated.length) tok = "ein";
        return { tok: tok, cls: "given" };
      }).concat(generated.map(function (tok, i) {
        return { tok: tok, cls: tok === EOS ? "eos" : "pred", idx: i };
      }));
      all.forEach(function (item, i) {
        var noSpace = /^[.,!?;:)\]]|^…/.test(item.tok);
        if (DE && i === base.length + 1) html += ",";
        if (i && !noSpace) html += " ";
        html += '<span class="' + item.cls + '"' +
          (item.idx != null ? ' data-rewind="' + item.idx + '" role="button" tabindex="0"' : '') +
          '>' + api.esc(item.tok) + "</span>";
      });
      sentenceEl.innerHTML = html;
      bindRewind(sentenceEl);
    }
    function renderTree() {
      var words = base.slice();
      if (DE && generated.length) words[words.length - 1] = "ein";
      var path = ['<span class="ls-loop-base">' + api.esc(words.join(" ")) + '</span>'];
      generated.forEach(function (tok, i) {
        path.push('<span class="ls-loop-arrow">→</span>');
        path.push('<span class="ls-loop-node" data-rewind="' + i + '" role="button" tabindex="0" data-tip="' + (DE ? "Springt zu diesem früheren Token zurück: " : "Jumps back to this earlier token: ") + api.esc(tok) + '">' + api.esc(tok) + (DE && i === 0 ? "," : "") + '</span>');
      });
      var opts = choicesFor();
      var next = opts.length
        ? '<span class="ls-loop-next-label">' + (DE ? "nächstes:" : "next:") + '</span> ' + opts.map(function (o) {
            return '<button type="button" class="ls-loop-branch" data-choice="' + api.esc(o.t) + '" data-tip="' + (DE ? "Wählt dieses Token als nächsten Schritt." : "Chooses this token as the next step.") + '">' + api.esc(o.t) + '</button>';
          }).join('<span class="ls-loop-sep">·</span>')
        : '<span class="ls-loop-end">' + (DE ? "Satzende" : "end of sentence") + '</span>';
      treeEl.innerHTML = '<div class="ls-loop-line">' + path.join(" ") + '</div><div class="ls-loop-line">' + next + '</div>';
      bindRewind(treeEl);
      treeEl.querySelectorAll("[data-choice]").forEach(function (b) {
        b.addEventListener("click", function () { choose(b.getAttribute("data-choice")); });
      });
    }
    function rewindTo(index) {
      var entry = null;
      for (var i = loopHistory.length - 1; i >= 0; i--) {
        var h = loopHistory[i];
        var end = h.end != null ? h.end : (h.index + 1);
        if (index >= h.index && index < end) { entry = h; break; }
      }
      if (!entry) return false;
      var snap = rewindPoints[entry.index];
      if (!snap) return false;
      navFuture = [];
      navPast.push(snapshotState());
      restoreState(snap);
      return true;
    }
    function bindRewind(scope) {
      scope.querySelectorAll("[data-rewind]").forEach(function (node) {
        function go() { rewindTo(parseInt(node.getAttribute("data-rewind"), 10)); }
        node.addEventListener("click", go);
        node.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
        });
      });
    }
    function renderBars() {
      var opts = currentOptions();
      var atEnd = generated.length >= MAX_STEPS;
      if (backBtn) backBtn.disabled = !generated.length;
      if (!opts.length) {
        barsEl.innerHTML = '<p class="ls-loop-done">' + (DE ? "Satz beendet: <|endoftext|> ausgegeben. Die Schleife stoppt." : "Sentence finished: <|endoftext|> emitted. The loop stops.") + '</p>';
        if (nextBtn) { nextBtn.disabled = true; nextBtn.textContent = DE ? "Fertig" : "Done"; }
        readout.innerHTML = '<span>' + (DE ? "Schritt" : "Step") + ' <b>' + SEQ_LEN + ' / ' + SEQ_LEN + '</b></span><span>' + (DE ? "Ende" : "End") + ' <b>' + api.esc(EOS) + '</b></span><span>' + (DE ? "Modus" : "Mode") + ' <b>' + decodeMode + '</b></span>';
        publish();
        landStaticDirty = true;
        if (landscape) drawLandscape();
        return;
      }
      var probs = softmax(opts.map(function (o) { return o.l; }), tempShown);
      var top = 0;
      probs.forEach(function (p, i) { if (p > probs[top]) top = i; });
      var order = probs.map(function (p, i) { return { i: i, p: p }; }).sort(function (a, b) { return b.p - a.p; });
      var cut = -1;
      if (decodeMode === "greedy") cut = top;
      if (decodeMode === "topp") {
        var acc = 0;
        for (var k = 0; k < order.length; k++) { acc += order[k].p; if (acc >= 0.9) { cut = order[k].i; break; } }
      }
      var onlyEos = opts.length === 1 && opts[0].t === EOS;
      barsEl.innerHTML = opts.map(function (o, i) {
        var on = decodeMode === "greedy" ? i === top : (decodeMode === "topp" && probs[i] >= probs[cut]);
        var label = o.t === EOS ? (DE ? "Ende" : "End") : o.t;
        return '<button type="button" class="ls-loop-bar' + (on ? " is-on" : "") + '" data-bar="' + i + '"' +
          (atEnd ? ' disabled' : '') + ' aria-label="' + api.esc(o.t) + '" data-tip="' + (DE ? "Token „" : "Token “") + api.esc(o.t) + (DE ? "“: Wahrscheinlichkeit; klicken wählt es." : "”: probability; click to choose it.") + '">' +
          '<span class="ls-loop-bar-label">' + api.esc(label) + '</span>' +
          '<span class="ls-loop-bar-track"><i style="width:' + (probs[i] * 100).toFixed(1) + '%"></i></span>' +
          '<span class="ls-loop-bar-val">' + (probs[i] * 100).toFixed(0) + '%</span></button>';
      }).join("") + (onlyEos
        ? '<p class="ls-loop-eos-note">' + (DE ? "Mit diesem Token sagt das LLM, dass diese Antwort fertig ist." : "With this token the LLM says that this answer is finished.") + '</p>'
        : "");
      barsEl.querySelectorAll("[data-bar]").forEach(function (b) {
        b.addEventListener("click", function () { choose(opts[parseInt(b.getAttribute("data-bar"), 10)].t); });
      });
      if (nextBtn) {
        nextBtn.disabled = atEnd || !choicesFor().length;
        nextBtn.textContent = (atEnd || !choicesFor().length) ? (DE ? "Fertig" : "Done") : (DE ? "Weiter →" : "Next →");
      }
      var topP = opts[top] ? probs[top] : 0;
      var loss = -Math.log(Math.max(1e-9, topP));
      landSteep = 0.55 + 0.45 * topP;
      readout.innerHTML = '<span>' + (DE ? "Schritt" : "Step") + ' <b>' + generated.length + ' / ' + MAX_STEPS + '</b></span><span>' + (DE ? "Kontext" : "Context") + ' <b>' + (base.length + generated.length) + '</b></span><span>' + (DE ? "Top" : "Top") + ' <b>' + api.esc(opts[top] ? opts[top].t : "—") + ' ' + Math.round(topP * 100) + '%</b></span><span>Loss <b>' + loss.toFixed(2) + '</b></span><span>' + (DE ? "Modus" : "Mode") + ' <b>' + decodeMode + '</b></span>' +
        (atEnd ? '<span>' + (DE ? "Satzende · <|endoftext|>" : "end of sentence · <|endoftext|>") + '</span>' : '');
      publish();
      landStaticDirty = true;
      if (landscape) drawLandscape();
    }
    function samplePath() {
      var gen = [];
      var picks = DE ? ["Drache", "der", "konnte", "nicht", "fliegen", "."] : ["dragon", "that", "could", "not", "fly", "."];
      var hist = [];
      picks.forEach(function (pick) {
        var opts = choicesFor(gen);
        var alts = opts.map(function (o) { return { token: o.t, logit: o.l }; });
        var chosen = alts.filter(function (a) { return a.token === pick; })[0] || alts[0];
        hist.push({
          index: gen.length,
          chosen: chosen ? chosen.token : pick,
          alternatives: alts.filter(function (a) { return a.token !== pick; })
        });
        gen.push(pick);
      });
      return { tokens: gen, history: hist };
    }
    function snapshotState() {
      return {
        generated: generated.slice(),
        loopHistory: loopHistory.slice(),
        pathWells: pathWells.slice(),
        pathProb: pathProb.slice(),
        revealed: revealed.slice()
      };
    }
    function restoreState(s) {
      generated = s.generated.slice();
      loopHistory = s.loopHistory.slice();
      pathWells = s.pathWells.slice();
      pathProb = s.pathProb.slice();
      revealed = s.revealed.slice();
      landBall.init = false;
      landTrail = [];
      renderSentence(); renderTree(); renderBars();
    }
    function undo() {
      if (!navPast.length) return false;
      navFuture.push(snapshotState());
      restoreState(navPast.pop());
      return true;
    }
    function redo() {
      if (!navFuture.length) return false;
      navPast.push(snapshotState());
      restoreState(navFuture.pop());
      return true;
    }
    function publish() {
      var sample = samplePath();
      SHARED.loop = {
        lang: api.lang,
        base: base.slice(),
        tokens: generated.length ? generated.slice() : sample.tokens,
        history: generated.length ? loopHistory.slice() : sample.history,
        temp: temp
      };
    }
    function choose(token) {
      if (!token || generated.length >= MAX_STEPS) return;
      navPast.push(snapshotState());
      navFuture = [];
      var opts = choicesFor();
      var probs = softmax(opts.map(function (o) { return o.l; }), temp);
      var alts = opts.map(function (o, i) { return { token: o.t, logit: o.l, p: probs[i] }; });
      var pick = -1;
      opts.forEach(function (o, i) { if (o.t === token) pick = i; });
      var pickP = pick >= 0 ? probs[pick] : null;
      var prev = generated.length ? generated[generated.length - 1] : null;
      var start = generated.length;
      var entry = {
        index: start,
        chosen: token,
        end: start,
        alternatives: alts.filter(function (a) { return a.token !== token; })
      };
      loopHistory.push(entry);
      token.split(" ").forEach(function (piece) {
        revealSegment(prev, piece);
        prev = piece;
        pathProb[generated.length] = pickP;
        if (catalogByToken[piece] && pickP != null) {
          pathWells.push({ x: catalogByToken[piece].x, y: catalogByToken[piece].y, p: pickP });
        }
        generated.push(piece);
      });
      if (generated.length > MAX_STEPS) generated = generated.slice(0, MAX_STEPS);
      entry.end = generated.length;
      rewindPoints[start] = snapshotState();
      renderSentence(); renderTree(); renderBars();
    }
    function sample() {
      var opts = choicesFor();
      if (!opts.length) return;
      if (decodeMode === "greedy") { choose(opts[0].t); return; }
      var probs = softmax(opts.map(function (o) { return o.l; }), temp);
      var pool = probs.map(function (p, i) { return { i: i, p: p }; });
      if (decodeMode === "topp") {
        pool.sort(function (a, b) { return b.p - a.p; });
        var acc = 0, keep = [];
        for (var i = 0; i < pool.length; i++) { keep.push(pool[i]); acc += pool[i].p; if (acc >= 0.9) break; }
        pool = keep;
        var total = pool.reduce(function (s, x) { return s + x.p; }, 0);
        pool.forEach(function (x) { x.p = x.p / total; });
      }
      var r = Math.random(), acc2 = 0;
      for (var j = 0; j < pool.length; j++) { acc2 += pool[j].p; if (r <= acc2) { choose(opts[pool[j].i].t); return; } }
      choose(opts[pool[0].i].t);
    }
    function setMode(mode) {
      decodeMode = mode;
      el.querySelectorAll(".ls-loop-modes .ls-chip").forEach(function (b) {
        b.classList.toggle("is-on", b.getAttribute("data-mode") === mode);
      });
      renderBars();
    }
    function reset() {
      generated = []; loopHistory = []; revealed = []; knownProbs = {}; rewindPoints = {};
      pathWells = []; pathProb = []; navPast = []; navFuture = [];
      landBall.init = false; landTrail = [];
      tempShown = temp;
      seedReveal(); renderSentence(); renderTree(); renderBars();
    }
    [
      { id: "sample", label: "Sample" }, { id: "greedy", label: "Greedy" }, { id: "topp", label: "Top-p 0.9" }
    ].forEach(function (m) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-chip" + (m.id === decodeMode ? " is-on" : "");
      b.setAttribute("data-mode", m.id);
      b.textContent = m.label;
      b.setAttribute("data-tip", m.id === "sample"
        ? (DE ? "Zieht zufällig nach den Wahrscheinlichkeiten." : "Samples randomly according to the probabilities.")
        : m.id === "greedy"
          ? (DE ? "Nimmt immer das wahrscheinlichste Token." : "Always takes the most likely token.")
          : (DE ? "Beschränkt die Auswahl auf Token bis 90 Prozent Wahrscheinlichkeitsmasse." : "Restricts the choice to tokens within 90 percent probability mass."));
      b.addEventListener("click", function () { setMode(m.id); });
      el.querySelector(".ls-loop-modes").appendChild(b);
    });
    el.querySelector(".ls-loop-next").addEventListener("click", sample);
    if (backBtn) backBtn.addEventListener("click", function () { undo(); });
    el.querySelector(".ls-loop-reset").addEventListener("click", reset);
    tempEl.addEventListener("input", function () {
      temp = parseFloat(tempEl.value) || 0.8;
      tempShown = temp;
      tempOut.textContent = temp.toFixed(2);
      renderBars();
    });
    reset();
    setLandscape(true);
    el.__lsLoopDebug = function () {
      return {
        catalog: catalog.map(function (c) { return { t: c.t, x: c.x, y: c.y }; }),
        generated: generated.slice(),
        history: loopHistory.map(function (h) {
          return { index: h.index, chosen: h.chosen, alts: (h.alternatives || []).map(function (a) { return { token: a.token, p: a.p }; }) };
        }),
        path: lastPath.map(function (p) { return { t: p.t, px: p.px, py: p.py, sx: p.sx, sy: p.sy, p: p.p }; }),
        probs: lastProbs,
        knownProbs: knownProbs,
        top: lastTop ? lastTop.t : null,
        topP: lastTop ? lastTop.p : null,
        zTop: lastTop ? landZ(lastTop.p) : null,
        temp: temp,
        tempShown: tempShown,
        revealed: revealed.length,
        valleys: baseValleys.length,
        pitch: landPitch,
        landscape: landscape
      };
    };
    function onLandTheme() { landStaticDirty = true; drawLandscape(); }
    window.addEventListener("tm:theme", onLandTheme);
    return {
      update: function (s, meta) {
        if (meta && meta.dir < 0) undo();
        else if (meta && meta.dir > 0) redo();
        if (!s) return;
        if (s.camera) {
          var cp = Number(s.camera.pitch), cy = Number(s.camera.yaw), cz = Number(s.camera.zoom);
          tweenCamera(isFinite(cp) ? cp : 1.4, isFinite(cy) ? cy : -0.62, isFinite(cz) ? cz : 1);
        } else if (s.view === "top") tweenCamera(1.50, -0.62, 1);
        else if (s.view === "default") tweenCamera(1.40, -0.62, 1);
        if (s.mode) setMode(s.mode);
        if (typeof s.temp === "number") {
          temp = s.temp;
          tempShown = s.temp;
          tempEl.value = String(temp);
          tempOut.textContent = temp.toFixed(2);
          renderBars();
        }
        setLandscape(true);
        if (s.reset) reset();
      },
      onKey: function (e) {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === "z" || e.key === "Z")) { undo(); return true; }
        if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return false;
        if (e.key === "ArrowLeft") return undo();
        if (e.key !== "ArrowRight" && e.key !== " " && e.key !== "PageDown") return false;
        var opts = choicesFor();
        if (!opts.length || generated.length >= MAX_STEPS) return false;
        var top = opts[0];
        opts.forEach(function (o) { if (o.l > top.l) top = o; });
        choose(top.t);
        return true;
      },
      resize: function () { landResize(); },
      destroy: function () {
        if (landCamTween) cancelAnimationFrame(landCamTween);
        window.removeEventListener("tm:theme", onLandTheme);
        el.remove();
      }
    };
  }

  core.register("loop", loopScene);
})();
