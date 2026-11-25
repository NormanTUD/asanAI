(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function compressScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var el = document.createElement("div");
    el.className = "ls-compress-scene";
    el.innerHTML = '<div class="ls-compress-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-compress-side"><div class="ls-compress-metrics"><span><b>' + (DE ? "Details" : "details") + '</b><i data-detail></i></span><span><b>' + (DE ? "Muster" : "patterns") + '</b><i data-pattern></i></span><span><b>' + (DE ? "Fehler" : "error") + '</b><i data-error></i></span></div><div class="ls-compress-readout" aria-live="polite"></div></div>' +
      '<div class="ls-compress-controls"><label class="ls-range">' + (DE ? "Kompression" : "Compression") + ' <input type="range" class="ls-compress-range" min="0" max="4" step="0.01" value="0"><output>0.00</output></label><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-compress-auto">' + (DE ? "Automatisch" : "Auto") + '</button></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-compress-stage");
    var canvas = el.querySelector("canvas");
    var side = el.querySelector(".ls-compress-side");
    var range = el.querySelector(".ls-compress-range");
    var out = range.nextElementSibling;
    var readout = el.querySelector(".ls-compress-readout");
    var detailBar = el.querySelector("[data-detail]");
    var patternBar = el.querySelector("[data-pattern]");
    var errorBar = el.querySelector("[data-error]");
    var C = api.colors();
    var palette = [C.green, C.sky, C.gold, C.lilac, C.lime, C.blue, C.teal || C.petrol, C.muted];
    var size = null, ctx = null, t = 0, raf = 0, playing = false;
    var mix = api.util.hexMix;
    var seed = 19;
    function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    var GROUP = [0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 3, 3, 2];
    var nodes = [], edges = [];
    (function build() {
      var per = 12, clusters = 13;
      for (var c = 0; c < clusters; c++) {
        var cx = (c % 4 + 0.5) / 4;
        var cy = (Math.floor(c / 4) + 0.5) / 3;
        if (c === 12) { cx = 0.84; cy = 0.78; }
        for (var k = 0; k < per; k++) {
          var a = k / per * Math.PI * 2 + rnd() * 0.5;
          var r = 0.05 + rnd() * 0.09;
          nodes.push({ c: c, x0: cx + Math.cos(a) * r * 0.75, y0: cy + Math.sin(a) * r * 0.55, cx: cx, cy: cy, col: palette[c % palette.length] });
        }
      }
      nodes.forEach(function (n) {
        if (n.c < 8 || n.c === 12) return;
        var idx = n.c - 8;
        n.y0 = 0.94 + idx * 0.025 + (rnd() - 0.5) * 0.015;
        n.x0 = 0.18 + idx * 0.22 + (rnd() - 0.5) * 0.05;
      });
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var same = nodes[i].c === nodes[j].c;
          if (same ? rnd() < 0.42 : rnd() < 0.022) edges.push({ a: i, b: j, same: same });
        }
      }
      clusterCenters = [];
      for (var cc = 0; cc < 13; cc++) {
        var group = nodes.filter(function (n) { return n.c === cc; });
        var sx = 0, sy = 0;
        group.forEach(function (n) { sx += n.x0; sy += n.y0; });
        clusterCenters.push({ x: sx / group.length, y: sy / group.length });
      }
      superCenters = [];
      for (var sg = 0; sg < 4; sg++) {
        var members = clusterCenters.filter(function (c, ci) { return GROUP[ci] === sg; });
        superCenters.push({
          x: members.reduce(function (a, p) { return a + p.x; }, 0) / Math.max(1, members.length),
          y: members.reduce(function (a, p) { return a + p.y; }, 0) / Math.max(1, members.length)
        });
      }
      center = { x: superCenters.reduce(function (a, p) { return a + p.x; }, 0) / 4, y: superCenters.reduce(function (a, p) { return a + p.y; }, 0) / 4 };
      outer = [];
      for (var oo = 0; oo < 8; oo++) {
        var oa2 = oo / 8 * Math.PI * 2;
        outer.push({ x: center.x + Math.cos(oa2) * 0.34, y: center.y + Math.sin(oa2) * 0.34 });
      }
    })();
    var clusterCenters = [], superCenters = [
      { x: 0.30, y: 0.30 }, { x: 0.70, y: 0.30 }, { x: 0.30, y: 0.70 }, { x: 0.70, y: 0.70 }
    ];
    for (var c = 0; c < 13; c++) clusterCenters.push(c === 12 ? { x: 0.84, y: 0.78 } : { x: 0.18 + (c % 4) * 0.22, y: 0.22 + Math.floor(c / 4) * 0.28 });
    var center = { x: 0.5, y: 0.5 };
    var outer = [];
    for (var o = 0; o < 8; o++) {
      var oa = o / 8 * Math.PI * 2;
      outer.push({ x: 0.5 + Math.cos(oa) * 0.36, y: 0.5 + Math.sin(oa) * 0.36 });
    }
    var clusterNames = DE ? [
      "Katzenartige", "Menschenaffen", "andere Säugetiere", "Vögel", "Fische", "Insekten",
      "Pflanzen", "Pilze", "Gegenstände", "Mathematik", "Gedanken", "Träume", "Archaea"
    ] : [
      "cats", "great apes", "other mammals", "birds", "fish", "insects",
      "plants", "fungi", "objects", "mathematics", "thoughts", "dreams", "archaea"
    ];
    var nodeNames = DE ? [
      ["Hauskatze", "Löwe", "Tiger"], ["Schimpanse", "Bonobo", "Gorilla"], ["Pferd", "Hund", "Wal"],
      ["Amsel", "Meise", "Adler"], ["Lachs", "Hai"], ["Biene", "Käfer"],
      ["Eiche", "Rose"], ["Steinpilz", "Hefe"],
      ["Stuhl", "Stein"], ["Zahl 7", "Primzahl"], ["Idee", "Satz"], ["Traum", "Albtraum"],
      ["Methanobakterien", "Halobakterien"]
    ] : [
      ["house cat", "lion", "tiger"], ["chimpanzee", "bonobo", "gorilla"], ["horse", "dog", "whale"],
      ["blackbird", "tit", "eagle"], ["salmon", "shark"], ["bee", "beetle"],
      ["oak", "rose"], ["mushroom", "yeast"],
      ["chair", "stone"], ["number 7", "prime"], ["idea", "sentence"], ["dream", "nightmare"],
      ["methanogens", "halophiles"]
    ];
    var superNames = DE ? ["Säugetiere", "andere Tiere", "Pflanzen, Pilze & Archaeen", "Nicht-Leben"] : ["mammals", "other animals", "plants, fungi & archaea", "non-living"];
    var phaseLabels = DE ? [
      "Einzelfälle · schon in lokalen Gruppen",
      "9 lebende Gruppen · Katzenartige, Menschenaffen, Säugetiere, Vögel, Fische, Insekten, Pflanzen, Pilze, Archaea",
      "3 Gruppen · Wirbeltiere, Wirbellose, Pflanzen & Pilze",
      "Lebewesen · Bilaterien, Eukaryoten",
      "Seiendes · Lebewesen, Gegenstände, Mathematik, Gedanken, Träume"
    ] : [
      "individual cases · already in local groups",
      "9 living groups · cats, great apes, mammals, birds, fish, insects, plants, fungi, archaea",
      "3 groups · vertebrates, invertebrates, plants & fungi",
      "living things · bilaterians, eukaryotes",
      "what exists · living things, objects, mathematics, thoughts, dreams"
    ];
    function lerp(a, b, u) { return a + (b - a) * u; }
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function point(x, y, r, col, alpha) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.globalAlpha = alpha; ctx.fill();
      ctx.strokeStyle = C.paper; ctx.lineWidth = 1; ctx.globalAlpha = alpha; ctx.stroke();
      ctx.globalAlpha = 1;
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h;
      var pad = 28;
      function X(n) { return pad + n.x * (w - pad * 2); }
      function Y(n) { return pad + n.y * (h - pad * 2); }
      ctx.clearRect(0, 0, w, h);
      var bg = ctx.createRadialGradient(w * 0.5, h * 0.48, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.78);
      bg.addColorStop(0, V.alpha(C.paper2, 0.92));
      bg.addColorStop(0.58, V.alpha(C.paper, 0.55));
      bg.addColorStop(1, V.alpha(C.paper, 0.96));
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      V.grid(ctx, w, h, C, 28, 0.16);
      var tt = t;
      var a0 = clamp01(1 - Math.abs(tt - 0));
      var a1 = clamp01(1 - Math.abs(tt - 1));
      var a2 = clamp01(1 - Math.abs(tt - 2));
      var a3 = clamp01(1 - Math.abs(tt - 3));
      var a4 = clamp01(1 - Math.abs(tt - 4));
      var u0 = clamp01(tt);
      var u1 = clamp01(tt - 1);
      var u2 = clamp01(tt - 2);
      var u3 = clamp01(tt - 3);
      function glow(x, y, r, col, alpha) {
        ctx.save();
        ctx.shadowColor = col;
        ctx.shadowBlur = r * 2.6;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.globalAlpha = alpha; ctx.fill();
        ctx.restore();
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1; ctx.globalAlpha = alpha; ctx.stroke();
        ctx.globalAlpha = 1;
      }
      function ring(x, y, r, col, alpha) {
        ctx.save();
        ctx.strokeStyle = col; ctx.globalAlpha = alpha; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      function labelAt(text, x, y, col, alpha, size, align) {
        if (alpha <= 0.01) return;
        var fs = size || api.font("canvas-sm");
        ctx.font = '600 ' + fs + 'px "Open Sans", sans-serif';
        ctx.textAlign = align || "center";
        var tw = ctx.measureText(text).width;
        var bx = align === "left" ? x - 3 : align === "right" ? x - tw - 3 : x - tw / 2;
        ctx.globalAlpha = Math.min(1, alpha) * 0.88;
        ctx.fillStyle = C.paper;
        ctx.fillRect(bx + 1, y - fs - 1, tw + 4, fs + 4);
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.fillStyle = col;
        ctx.fillText(text, x, y);
        ctx.globalAlpha = 1;
      }
      function labelCat(text, x, y, col, alpha, size) {
        if (alpha <= 0.01) return;
        var fs = size || api.font("canvas-sm") + 1;
        ctx.font = '700 ' + fs + 'px "Barlow", sans-serif';
        var tw = ctx.measureText(text).width;
        var bx = x - tw / 2 - 9;
        ctx.globalAlpha = Math.min(1, alpha) * 0.9;
        ctx.fillStyle = C.paper;
        ctx.fillRect(bx, y - fs - 2, tw + 18, fs + 7);
        ctx.beginPath();
        ctx.arc(bx + 5, y - fs / 2 - 1, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.fillStyle = col;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(text, bx + 11, y);
        ctx.globalAlpha = 1;
      }
      // fibres: the same structure survives every compression level
      nodes.forEach(function (n) {
        var x0 = X({ x: n.x0 }), y0 = Y({ y: n.y0 });
        var cc = clusterCenters[n.c];
        var sc = superCenters[GROUP[n.c]];
        var x1 = X(cc), y1 = Y(cc), x2 = X(sc), y2 = Y(sc), x3 = X(center), y3 = Y(center);
        ctx.strokeStyle = n.col;
        ctx.globalAlpha = 0.045 + 0.035 * (1 - Math.min(1, tt / 4));
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 6, x1, y1);
        ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - 8, x2, y2);
        ctx.quadraticCurveTo((x2 + x3) / 2, (y2 + y3) / 2 - 6, x3, y3);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      if (tt < 1.4) {
        var crossAlpha = Math.max(0, 0.28 * (1 - tt));
        edges.forEach(function (e) {
          var a = nodes[e.a], b = nodes[e.b];
          var ax = lerp(a.x0, clusterCenters[a.c].x, u0), ay = lerp(a.y0, clusterCenters[a.c].y, u0);
          var bx = lerp(b.x0, clusterCenters[b.c].x, u0), by = lerp(b.y0, clusterCenters[b.c].y, u0);
          var pa = { x: X({x:ax}), y: Y({y:ay}) }, pb = { x: X({x:bx}), y: Y({y:by}) };
          ctx.strokeStyle = e.same ? a.col : C.muted;
          ctx.globalAlpha = e.same ? 0.26 * a0 : crossAlpha;
          ctx.lineWidth = e.same ? 1 : 0.55;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.quadraticCurveTo((pa.x + pb.x) / 2 + (e.same ? 0 : 5), (pa.y + pb.y) / 2 - 4, pb.x, pb.y);
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
        if (a0 > 0.01) nodes.forEach(function (n) {
          var x = lerp(n.x0, clusterCenters[n.c].x, u0), y = lerp(n.y0, clusterCenters[n.c].y, u0);
          glow(X({x:x}), Y({y:y}), 2.4, n.col, a0 * 0.9);
        });
      }
      if (a1 > 0.01) {
        clusterCenters.forEach(function (cc, i) {
          var x = lerp(cc.x, superCenters[GROUP[i]].x, u1);
          var y = lerp(cc.y, superCenters[GROUP[i]].y, u1);
          ring(X({x:x}), Y({y:y}), 8, palette[i % palette.length], a1 * 0.6);
          glow(X({x:x}), Y({y:y}), 5.2, palette[i % palette.length], a1);
        });
      }
      if (a2 > 0.01) {
        superCenters.forEach(function (sp, i) {
          if (i === 3 && tt < 3.15) return;
          var x = lerp(sp.x, center.x, u2), y = lerp(sp.y, center.y, u2);
          ring(X({x:x}), Y({y:y}), 12, C.petrol, a2 * 0.55);
          glow(X({x:x}), Y({y:y}), 7.5, C.petrol, a2);
        });
      }
      if (a3 > 0.01) {
        var cx0 = X(center), cy0 = Y(center);
        ring(cx0, cy0, 17, C.gold, a3 * 0.62);
        ring(cx0, cy0, 24, C.gold, a3 * 0.26);
        glow(cx0, cy0, 10, C.green, a3);
      }
      // named taxonomy: individual examples are visible only before grouping starts
      var nodeAlpha = clamp01(0.82 - tt * 1.15);
      if (nodeAlpha > 0.01) {
        nodes.forEach(function (n, idx) {
          var local = idx - n.c * 12;
          if (local > 1) return;
          var x = lerp(n.x0, clusterCenters[n.c].x, u0), y = lerp(n.y0, clusterCenters[n.c].y, u0);
          labelAt(nodeNames[n.c][local] || "", X({x:x}), Y({y:y}) - 6, C.ink, nodeAlpha, Math.max(8, api.font("canvas-sm") - 1));
        });
      }
      var clusterAlpha = clamp01(Math.min(tt - 0.45, 2.35 - tt));
      if (clusterAlpha > 0.01) {
        clusterCenters.forEach(function (cc, i) {
          var x = lerp(cc.x, superCenters[GROUP[i]].x, u1);
          var y = lerp(cc.y, superCenters[GROUP[i]].y, u1);
          labelCat(clusterNames[i], X({x:x}), Y({y:y}) - 10, palette[i % palette.length], clusterAlpha);
        });
      }
      var superAlpha = clamp01(Math.min(tt - 1.35, 3.35 - tt));
      if (superAlpha > 0.01) {
        superCenters.forEach(function (sp, i) {
          if (i === 3 && tt < 3.15) return;
          var x = lerp(sp.x, center.x, u2), y = lerp(sp.y, center.y, u2);
          labelCat(superNames[i], X({x:x}), Y({y:y}) - 13, C.petrol, superAlpha);
        });
      }
      if (tt > 2.55) {
        var ca = clamp01(Math.min(tt - 2.55, 1));
        labelCat(tt < 3.6 ? (DE ? "Lebewesen" : "living things") : (DE ? "Seiendes" : "what exists"), X(center), Y(center) - 22, C.green, ca, api.font("canvas"));
      }
      if (a4 > 0.01) {
        var cx = X(center), cy = Y(center);
        ring(cx, cy, 20, C.gold, a4 * 0.55);
        ring(cx, cy, 31, C.gold, a4 * 0.28);
        // non-living cases appear only now and join the same top category
        var appear = clamp01((tt - 3.15) / 0.85);
        if (appear > 0.01) {
          nodes.forEach(function (n) {
            if (n.c < 8 || n.c === 12) return;
            var u = clamp01((tt - 3.15) / 0.85);
            var x = lerp(n.x0, center.x, u), y = lerp(n.y0, center.y, u);
            glow(X({x:x}), Y({y:y}), 2.8, n.col, appear * 0.9);
          });
          clusterCenters.forEach(function (cc, i) {
            if (i < 8 || i === 12) return;
            var u = clamp01((tt - 3.15) / 0.85);
            var x = lerp(cc.x, center.x, u), y = lerp(cc.y, center.y, u);
            labelCat(clusterNames[i], X({x:x}), Y({y:y}) - 10, palette[i % palette.length], clamp01((3.92 - tt) / 0.6) * appear);
          });
          nodes.forEach(function (n) {
            if (n.c < 8 || n.c === 12 || tt > 3.75) return;
            var local = nodes.indexOf(n) - n.c * 12;
            if (local > 1) return;
            var u = clamp01((tt - 3.15) / 0.85);
            var x = lerp(n.x0, center.x, u), y = lerp(n.y0, center.y, u);
            labelAt(nodeNames[n.c][local] || "", X({x:x}), Y({y:y}) + 15, C.ink, appear * clamp01((3.75 - tt) / 0.5), Math.max(8, api.font("canvas-sm") - 1));
          });
        }
        ctx.fillStyle = C.muted;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(DE ? "alles, was ist" : "everything that is", cx, cy + 46);
      }
      if (tt > 3.55) {
        var hubA = clamp01((tt - 3.55) / 0.45);
        var cxh = X(center), cyh = Y(center);
        var halo = ctx.createRadialGradient(cxh, cyh, 4, cxh, cyh, 96);
        halo.addColorStop(0, V.alpha(C.green, 0.20 * hubA));
        halo.addColorStop(0.48, V.alpha(C.gold, 0.10 * hubA));
        halo.addColorStop(1, V.alpha(C.paper, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cxh, cyh, 96, 0, Math.PI * 2);
        ctx.fill();
        var ux = cxh + 76, uy = cyh - 54;
        var ua = clamp01((tt - 3.66) / 0.34);
        if (ua > 0.01) {
          ctx.save();
          ctx.globalAlpha = ua;
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = V.alpha(C.gold, 0.86);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(ux, uy);
          ctx.quadraticCurveTo(cxh + 36, cyh - 32, cxh + 10, cyh - 11);
          ctx.stroke();
          ctx.restore();
          ctx.beginPath();
          ctx.arc(ux, uy, 9, 0, Math.PI * 2);
          ctx.fillStyle = V.alpha(C.paper, 0.95);
          ctx.fill();
          ctx.strokeStyle = C.gold;
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.fillStyle = C.gold;
          ctx.font = '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Barlow", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("?", ux, uy + 0.5);
          ctx.textBaseline = "alphabetic";
          V.label(ctx, DE ? "neuer Fall" : "unseen case", ux, uy - 17, {
            font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif',
            color: C.gold, align: "center", alpha: ua
          });
        }
      }
      var phase = tt < 0.45 ? 0 : tt < 1.45 ? 1 : tt < 2.55 ? 2 : tt < 3.55 ? 3 : 4;
      var pl = phaseLabels[phase];
      ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      var pw = ctx.measureText(pl).width + 18;
      ctx.fillStyle = V.alpha(C.paper, 0.92);
      ctx.fillRect(pad, 7, pw, 20);
      ctx.strokeStyle = V.alpha(C.line, 0.9);
      ctx.lineWidth = 1;
      ctx.strokeRect(pad + 0.5, 7.5, pw - 1, 19);
      ctx.fillStyle = C.petrol;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(pl, pad + 9, 18);
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "right";
      ctx.fillStyle = C.muted;
      ctx.fillText(DE ? "Weiter = verdichten" : "next = compress", w - pad, 20);
      ctx.textAlign = "left";
      ctx.fillStyle = C.petrol;
      ctx.fillText(DE ? "Verstehen = in Zusammenhang bringen · Einzelheiten vergessen" : "understanding = relating · forgetting details", pad, h - 8);
      updateReadout();
    }
    function updateReadout() {
      var details = Math.round(nodes.length * Math.max(0, 1 - t / 4));
      var patterns = Math.round(12 * Math.min(1, t / 4));
      var error = Math.pow(t / 4, 1.7) * 0.35;
      readout.innerHTML = '<span><b>' + (DE ? "Stufe" : "level") + '</b> ' + t.toFixed(2) + '</span><span><b>' + (DE ? "Knoten" : "nodes") + '</b> ' + details + '</span><span><b>' + (DE ? "Gruppen" : "groups") + '</b> ' + patterns + '</span>';
      detailBar.style.width = (Math.max(0, 1 - t / 4) * 100).toFixed(0) + '%';
      patternBar.style.width = (Math.min(1, t / 4) * 100).toFixed(0) + '%';
      errorBar.style.width = Math.min(100, error / 0.35 * 100).toFixed(0) + '%';
    }
    range.addEventListener("input", function () { stopAuto(); if (raf) cancelAnimationFrame(raf); raf = 0; playing = false; t = parseFloat(range.value) || 0; out.textContent = t.toFixed(2); draw(); });
    var autoTimers = [];
    function stopAuto() { autoTimers.forEach(clearTimeout); autoTimers = []; }
    el.querySelector(".ls-compress-auto").addEventListener("click", function () {
      stopAuto();
      if (t >= 3.99) t = 0;
      [1, 2, 3, 4].forEach(function (lvl, i) {
        if (lvl <= t) return;
        autoTimers.push(setTimeout(function () { animateTo(lvl); }, i * 1500));
      });
    });
    function resize() { size = api.fit(canvas, stage); draw(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    function animateTo(target) {
      if (playing) { playing = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
      playing = true;
      var start = performance.now(), from = t;
      function step(now) {
        if (!playing) return;
        var k = Math.min(1, (now - start) / 650);
        t = from + (target - from) * k;
        range.value = String(t);
        out.textContent = t.toFixed(2);
        draw();
        if (k < 1) raf = requestAnimationFrame(step); else playing = false;
      }
      raf = requestAnimationFrame(step);
    }
    function nextInternal() {
      stopAuto();
      if (t < 3.99) { animateTo(Math.floor(t + 0.001) + 1); return true; }
      return false;
    }
    function prevInternal() {
      stopAuto();
      if (t > 0.01) { animateTo(Math.ceil(t - 0.001) - 1); return true; }
      return false;
    }
    return {
      update: function () {},
      busy: function () { return playing || autoTimers.length > 0; },
      finish: function () { stopAuto(); playing = false; if (raf) cancelAnimationFrame(raf); raf = 0; t = 4; range.value = "4"; out.textContent = "4.00"; draw(); },
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) {
        return api.util.arrowKey(e, nextInternal, prevInternal);
      },
      resize: resize,
      pause: function () { playing = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
      destroy: function () { stopAuto(); if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", resize); el.remove(); }
    };
  }

  core.register("compress", compressScene);
})();
