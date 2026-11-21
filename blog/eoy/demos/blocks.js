(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  var lastBlocksIndex = 0;
  function blocksScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var blocks = DE ? [
      {
        id: "tokenizer", label: "Tokenizer", short: "Text → Tokens", icon: "T", color: "lime",
        title: "Tokenizer",
        body: "Texte werden in Bestandteile getrennt, sogenannte Tokens. Tokens können Wörter sein, müssen es aber nicht: Es können auch Wortbestandteile, Satzzeichen, Leerzeichen oder einzelne Bytes sein. Jedes Token bekommt eine ID-Nummer. Wenn dasselbe Token im Text erneut auftaucht, wird es wieder dieselbe Nummer. Die Nummer zeigt auf seine Zeile in der Embedding-Tabelle.",
        points: [],
        mini: "tokenizer"
      },
      {
        id: "embedding", label: "Embedding", short: "Tokens → Vektoren", icon: "E", color: "sky",
        title: "Embedding",
        body: "Jede ID wird zu einem Vektor in einem Raum mit hunderten bis tausenden Dimensionen (GPT-2 small: 768). Ähnliche Bedeutungen landen in ähnlichen Richtungen. Die Bedeutung ergibt sich aus dem Kontext, wie Firth (1957) formulierte: „You shall know a word by the company it keeps.“ Die Demo zeigt Richtungen und Längen schematisch; echte Embeddings haben unterschiedliche Längen.",
        points: [],
        source: { label: "Firth (1957), A Synopsis of Linguistic Theory", url: "https://archive.org/details/papersinlinguist0000firt" },
        mini: "embedding"
      },
      {
        id: "position", label: "Positional Embedding", short: "Position → Vektor", icon: "P", color: "blue",
        title: "Positional Embedding",
        body: "Ein Token allein weiß nicht, ob es an erster oder dritter Stelle steht. Deshalb wird seine Position als spezielle Kodierung ergänzt. Auf Kreisbahnen in verschiedenen Dimensionen werden verschiedene Wellen addiert. Jede Dimension hat eine andere Frequenz; zusammen ergibt das den Fingerabdruck der Position. Jeder grüne Punkt ist dasselbe Wort (Katze) an einer anderen Position. Die sinusförmige Positionskodierung hat eine konstante Norm und liegt damit auf einer Kugel. Die Darstellung enthält Positionen bis 100.000.",
        points: [],
        mini: "position",
        position: true
      },
      {
        id: "transformer", label: "Transformer-Blöcke", short: "Attention → FFN, × N", icon: "×N", color: "green",
        title: "Transformer-Blöcke",
        body: "Attention mischt Information zwischen Wörtern. Das Feed-Forward-Netzwerk (FFN) „denkt“, indem es die Tokens im hochdimensionalen Bedeutungsraum verschiebt. Es projiziert die durch Attention gemischten Punkte in noch höherdimensionale Räume, trennt sie dort einfacher und projiziert zurück, um Bedeutungszusammenhänge kontextabhängig zu isolieren und auf einzelne Bedeutungen reagieren zu können. GPT-2 small hat 12 Blöcke; große Modelle haben dutzende bis über hundert.",
        points: [],
        mini: "transformer",
        sub: [
          { title: "Attention", text: "Attention bewertet für jedes einzelne Token, wie wichtig alle anderen Tokens unter einem gewissen Aspekt sind, und verschiebt das Token so, dass es den Gesamtkontext unter diesem Gesichtspunkt beinhaltet. Es gibt viele Attention-Blöcke; sie können auf bestimmte Arten von Strukturen achten, diese isolieren und in den gesamten bisherigen Text schauen, um zu sehen, wo etwas im Gesamtkontext steht." },
          { title: "Feed-Forward-Netzwerk (FFN)", text: "Das FFN projiziert die durch Attention gemischten Punkte in noch höherdimensionale Räume, trennt sie dort einfacher und projiziert zurück. So isoliert es Bedeutungszusammenhänge kontextabhängig und kann auf einzelne Bedeutungen reagieren." }
        ]
      },
      {
        id: "unembed", label: "Unembedding", short: "Vektor → Verteilung", icon: "U", color: "lilac",
        title: "Unembedding",
        body: "Am Ende, nachdem die Bedeutungen viele Male gemischt und wieder getrennt worden sind, enthält der Vektor $h$ des letzten Tokens die Gesamtbedeutung des Kontexts. Man vergleicht $h$ mit den gelernten Richtungen aller Wörter und misst die Winkel. Ein kleiner Winkel heißt: Das Wort passt gut an diese Stelle. In dieser schematischen Ansicht wird das Wort mit dem größten Kosinus ausgewählt; im echten Logit zählt auch die Länge.",
        points: [],
        mini: "unembed",
      }
    ] : [
      {
        id: "tokenizer", label: "Tokenizer", short: "text → tokens", icon: "T", color: "lime",
        title: "Tokenizer",
        body: "Texts are split into pieces called tokens. Tokens can be words, but they do not have to be: they can also be word pieces, punctuation, spaces, or individual bytes. Every token gets an ID number. When the same token appears again in the text, it gets the same number. The number points to its row in the embedding table.",
        points: [],
        mini: "tokenizer"
      },
      {
        id: "embedding", label: "Embedding", short: "tokens → vectors", icon: "E", color: "sky",
        title: "Embedding",
        body: "Every ID becomes a vector in a space with hundreds to thousands of dimensions (GPT-2 small: 768). Similar meanings land in similar directions. Meaning comes from context, as Firth (1957) put it: “You shall know a word by the company it keeps.” The demo shows directions and lengths schematically; real embeddings have different lengths.",
        points: [],
        source: { label: "Firth (1957), A Synopsis of Linguistic Theory", url: "https://archive.org/details/papersinlinguist0000firt" },
        mini: "embedding"
      },
      {
        id: "position", label: "Positional Embedding", short: "position → vector", icon: "P", color: "blue",
        title: "Positional Embedding",
        body: "A token alone does not know whether it stands first or third. That is why its position is added as a special encoding. Waves on circular orbits are added in different dimensions; each dimension has a different frequency, and together they form the fingerprint of the position. Every green point is the same word (cat) at a different position. The sinusoidal position encoding has a constant norm and therefore lies on a sphere. The view contains positions up to 100,000.",
        points: [],
        mini: "position",
        position: true
      },
      {
        id: "transformer", label: "Transformer blocks", short: "attention → FFN, × N", icon: "×N", color: "green",
        title: "Transformer blocks",
        body: "Attention mixes information between words. The feed-forward network (FFN) “thinks” by shifting the tokens in the high-dimensional meaning space. It projects the points mixed by attention into even higher-dimensional spaces, separates them more easily there, and projects back to isolate meaning relations depending on context and to react to individual meanings. GPT-2 small has 12 blocks; large models have dozens to over a hundred.",
        points: [],
        mini: "transformer",
        sub: [
          { title: "Attention", text: "Attention scores, for each individual token, how important all other tokens are under a certain aspect, and shifts the token so that it contains the overall context under those aspects. There are many attention blocks; they can attend to specific kinds of structures, isolate them, and look into the entire text so far to see where something stands in the overall context." },
          { title: "Feed-forward network (FFN)", text: "The FFN projects the points mixed by attention into even higher-dimensional spaces, separates them more easily there, and projects back. That is how it isolates meaning relations depending on context and can react to individual meanings." }
        ]
      },
      {
        id: "unembed", label: "Unembedding", short: "vector → distribution", icon: "U", color: "lilac",
        title: "Unembedding",
        body: "At the end, after meanings have been mixed and separated many times, the vector $h$ of the last token contains the overall meaning of the context. It is compared with the learned directions of all words, and the angles are measured. A small angle means the word fits this position well. In this schematic view the word with the largest cosine is selected; in the real logit the length also counts.",
        points: [],
        mini: "unembed",
      }
    ];
    var index = lastBlocksIndex;
    var resetKey = null;
    var positionDemo = null;
    var el = document.createElement("div");
    el.className = "ls-blocks-scene";
    el.innerHTML = '<div class="ls-bs-stack" role="list"></div>' +
      '<div class="ls-bs-detail" aria-live="polite"></div>' +
      '<div class="ls-bs-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-bs-prev" data-no-height-test="1">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-bs-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-bs-next" data-no-height-test="1">' + (DE ? "Weiter →" : "Next →") + '</button></div>';
    root.appendChild(el);
    var stack = el.querySelector(".ls-bs-stack");
    var detail = el.querySelector(".ls-bs-detail");
    var progress = el.querySelector(".ls-bs-progress");
    var prevBtn = el.querySelector(".ls-bs-prev");
    var nextBtn = el.querySelector(".ls-bs-next");
    var C = api.colors();
    function color(name) { return C[name] || C.petrol; }
    function esc(s) { return api.esc(s); }
    function buildStack() {
      stack.innerHTML = "";
      blocks.forEach(function (b, i) {
        var step = document.createElement("div");
        step.className = "ls-bs-step";
        var card = document.createElement("button");
        card.type = "button";
        card.className = "ls-bs-card" + (b.id === "transformer" ? " ls-bs-card--group" : "");
        card.setAttribute("data-index", String(i));
        card.style.setProperty("--c", color(b.color));
        if (b.id === "transformer") {
          card.innerHTML = '<span class="ls-bs-group-head"><span class="ls-bs-icon">×N</span><span class="ls-bs-label"><b>' + esc(b.label) + '</b><small>' + esc(b.short) + '</small></span><span class="ls-bs-badge">' + (DE ? "diese n mal" : "these n times") + '</span></span>' +
            '<span class="ls-bs-brace" aria-hidden="true"></span>' +
            '<span class="ls-bs-pills"><span class="ls-bs-pill">A · Attention</span><span class="ls-bs-pill">FFN</span></span>';
        } else {
          card.innerHTML = '<span class="ls-bs-icon">' + esc(b.icon) + '</span><span class="ls-bs-label"><b>' + esc(b.label) + '</b><small>' + esc(b.short) + '</small></span>';
        }
        card.addEventListener("click", function () { setIndex(i); });
        step.appendChild(card);
        if (i < blocks.length - 1) {
          var conn = document.createElement("span");
          conn.className = "ls-bs-connector";
          conn.setAttribute("aria-hidden", "true");
          step.appendChild(conn);
        }
        stack.appendChild(step);
      });
    }
    function fitMini(canvas) {
      if (!canvas) return null;
      var r = canvas.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return null;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var w = Math.round(r.width), h = Math.round(r.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      var c = canvas.getContext("2d");
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: w, h: h, ctx: c };
    }
    function miniBg(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, w, h);
      V.grid(ctx, w, h, C, 26, 0.16);
    }
    function miniTokenizer(ctx, w, h) {
      var rows = DE
        ? [
            { word: "unzerbrechlich", parts: ["un", "zer", "brech", "lich"] },
            { word: "unglaublich", parts: ["un", "glaub", "lich"] }
          ]
        : [
            { word: "unbreakable", parts: ["un", "break", "able"] },
            { word: "unbelievable", parts: ["un", "believ", "able"] }
          ];
      var ids = { un: 1200, zer: 1241, brech: 1282, lich: 1323, glaub: 1364, break: 1241, able: 1282, believ: 1323 };
      var palette = { un: C.lime, zer: C.sky, brech: C.gold, lich: C.green, glaub: C.blue, break: C.sky, able: C.gold, believ: C.lime };
      var wordSize = Math.max(14, api.font("canvas") * 1.02);
      var rowYs = [h * 0.32, h * 0.67];
      rows.forEach(function (row, rowIndex) {
        ctx.font = '700 ' + wordSize + 'px "Barlow", sans-serif';
        var widths = row.parts.map(function (part) { return ctx.measureText(part).width; });
        var total = widths.reduce(function (a, p) { return a + p; }, 0);
        var x = (w - total) / 2;
        var y = rowYs[rowIndex];
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        row.parts.forEach(function (part, i) {
          ctx.font = '700 ' + wordSize + 'px "Barlow", sans-serif';
          ctx.fillStyle = C.ink;
          ctx.fillText(part, x, y);
          ctx.fillStyle = V.alpha(palette[part] || C.blue, 0.22);
          ctx.fillRect(x - 2, y + 5, widths[i] + 4, 6);
          if (i > 0) {
            ctx.strokeStyle = V.alpha(C.line, 0.9);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y - 7);
            ctx.lineTo(x, y + 14);
            ctx.stroke();
          }
          x += widths[i];
        });
        ctx.textAlign = "center";
        ctx.fillStyle = C.muted;
        ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
        ctx.fillText(row.parts.map(function (part) { return ids[part] || 0; }).join(" · "), w / 2, y + 24);
        if (rowIndex === 1) {
          ctx.fillStyle = C.petrol;
          ctx.fillText(DE ? "gleiche ID für „un“" : "same ID for “un”", w / 2, y + 40);
        }
      });
    }
    function miniData(ctx, w, h) {
      var docs = DE ? ["Berlin liegt an der Spree.", "Die Spree fließt durch Berlin.", "Berlin liegt an der Elbe."] : ["The Nile flows through Egypt.", "Egypt lies on the Nile.", "The Nile flows through Brazil."];
      var top = h * 0.22;
      var lineH = Math.max(14, h * 0.11);
      docs.forEach(function (text, i) {
        var y = top + i * lineH;
        ctx.fillStyle = i === 2 ? V.alpha(C.coral, 0.12) : V.alpha(C.paper, 0.85);
        ctx.strokeStyle = i === 2 ? C.coral : C.line;
        ctx.lineWidth = 1;
        ctx.fillRect(w * 0.08, y - 10, w * 0.52, lineH - 3);
        ctx.strokeRect(w * 0.08, y - 10, w * 0.52, lineH - 3);
        ctx.fillStyle = i === 2 ? C.coral : C.ink;
        ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(text, w * 0.10, y + 1);
      });
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(DE ? "viele Beschreibungen" : "many descriptions", w * 0.34, top + 3 * lineH + 8);
      var bx = w * 0.72, by = h * 0.56, bw = w * 0.18;
      var bars = [0.72, 0.54, 0.31];
      bars.forEach(function (v, i) {
        var y = by - i * (h * 0.14);
        ctx.fillStyle = i === 2 ? V.alpha(C.coral, 0.55) : V.alpha(C.gold, 0.65);
        ctx.fillRect(bx, y - 3, bw * v, 6);
      });
      ctx.fillStyle = C.ink;
      ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "was bleibt" : "what remains", bx + bw / 2, by - 2 * (h * 0.14) - 12);
      V.heading(ctx, DE ? "Daten → Muster" : "data → patterns", 12, 16, C.petrol, 10, 1);
    }
    function miniEmbedding(ctx, w, h) {
      var ox = w * 0.18, oy = h * 0.78, s = Math.min(w * 0.24, h * 0.48);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + s * 1.5, oy);
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox, oy - s * 1.3);
      ctx.stroke();
      var pts = DE ? [
        { p: [0.45, 0.55], t: "un", c: C.blue },
        { p: [0.9, 0.86], t: "zer", c: C.green },
        { p: [1.35, 0.5], t: "brech", c: C.sky },
        { p: [0.75, 0.18], t: "lich", c: C.gold, dy: 10 }
      ] : [
        { p: [0.5, 0.55], t: "un", c: C.blue },
        { p: [1.0, 0.86], t: "break", c: C.green },
        { p: [1.35, 0.35], t: "able", c: C.sky }
      ];
      pts.forEach(function (q) {
        var tip = { x: ox + q.p[0] * s, y: oy - q.p[1] * s };
        V.arrow(ctx, ox, oy, tip.x, tip.y, q.c, 2.2, 6);
        V.tokenChip(ctx, q.t, tip.x + 6, tip.y + (q.dy || -8), q.c, C, { size: 9 });
      });
      V.heading(ctx, "ID → Vektor", 12, 16, C.petrol, 10, 1);
      V.label(ctx, (DE ? "brech" : "break") + " → [0.2, −0.4, 0.7, …]", w * 0.62, h * 0.82, {
        font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif',
        color: C.soft, align: "center"
      });
    }
    function miniAttention(ctx, w, h) {
      var words = DE ? ["Die", "Bank", "am", "Fluss"] : ["The", "bank", "by", "river"];
      var xs = [w * 0.14, w * 0.38, w * 0.62, w * 0.86];
      var y = h * 0.40;
      var weights = [0.18, 0.32, 0.22, 0.28];
      var source = 1;
      ctx.save();
      ctx.strokeStyle = V.alpha(C.blue, 0.65);
      words.forEach(function (t, i) {
        if (i === source) return;
        ctx.lineWidth = 0.6 + weights[i] * 5;
        ctx.beginPath();
        ctx.moveTo(xs[source], y - 10);
        ctx.quadraticCurveTo((xs[source] + xs[i]) / 2, y - 34, xs[i], y - 10);
        ctx.stroke();
      });
      ctx.restore();
      words.forEach(function (t, i) {
        ctx.beginPath();
        ctx.arc(xs[i], y, i === source ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = i === source ? C.gold : C.paper;
        ctx.fill();
        ctx.strokeStyle = i === source ? C.gold : C.blue;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        V.label(ctx, t, xs[i], y + 20, { font: '600 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif', color: C.ink, align: "center" });
      });
      var mx = w * 0.62, my = h * 0.58, mw = w * 0.30, mh = h * 0.34;
      var n = 4, cell = Math.min(mw / n, mh / n);
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
        var on = j <= i;
        ctx.fillStyle = on ? V.alpha(C.blue, 0.14 + 0.16 * ((i + j) % 3)) : V.alpha(C.line, 0.35);
        ctx.fillRect(mx + j * cell, my + i * cell, cell - 1, cell - 1);
      }
      V.heading(ctx, "Attention: wer liest wen?", 12, 16, C.petrol, 10, 1);
    }
    function miniFFN(ctx, w, h) {
      var top = 42, bottom = h - 22;
      function FY(t) { return top + t * (bottom - top); }
      var left = [{ x: w * 0.12, y: FY(0.34) }, { x: w * 0.12, y: FY(0.66) }];
      var mid = [{ x: w * 0.38, y: FY(0.12) }, { x: w * 0.38, y: FY(0.37) }, { x: w * 0.38, y: FY(0.63) }, { x: w * 0.38, y: FY(0.88) }];
      var right = [{ x: w * 0.64, y: FY(0.34) }, { x: w * 0.64, y: FY(0.66) }];
      ctx.save();
      ctx.strokeStyle = V.alpha(C.line, 0.95);
      ctx.lineWidth = 1;
      left.forEach(function (a) { mid.forEach(function (b) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }); });
      mid.forEach(function (a) { right.forEach(function (b) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }); });
      ctx.restore();
      left.forEach(function (p) { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fillStyle = C.sky; ctx.fill(); });
      mid.forEach(function (p) { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fillStyle = C.green; ctx.fill(); });
      right.forEach(function (p) { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fillStyle = C.gold; ctx.fill(); });
      V.tokenChip(ctx, DE ? "Muster" : "pattern", w * 0.03, 30, C.blue, C, { size: 8 });
      V.tokenChip(ctx, DE ? "Bestandteile" : "components", w * 0.34, 30, C.blue, C, { size: 8 });
      V.tokenChip(ctx, DE ? "neu geordnet" : "reordered", w * 0.68, 30, C.green, C, { size: 8 });
      V.heading(ctx, DE ? "FFN: erkennen · trennen · neu ordnen" : "FFN: recognise · separate · reorder", 12, 14, C.petrol, 10, 1);
      V.label(ctx, DE ? "pro Token" : "per token", w * 0.50, h - 8, { font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif', color: C.muted, align: "center" });
    }
    function miniUnembed(ctx, w, h) {
      var ox = w * 0.16, oy = h * 0.60, s = Math.min(w * 0.20, h * 0.32);
      var H = [0.90, 0.35];
      var rows = [{ t: " the", w: [0.86, 0.50], c: C.green }, { t: " Paris", w: [0.98, 0.08], c: C.blue }, { t: " a", w: [0.20, 0.98], c: C.sky }, { t: " city", w: [0.58, -0.82], c: C.gold }];
      rows.forEach(function (row, i) {
        var tip = { x: ox + row.w[0] * s, y: oy - row.w[1] * s };
        V.arrow(ctx, ox, oy, tip.x, tip.y, row.c, 1.4, 5);
        ctx.fillStyle = row.c;
        ctx.beginPath(); ctx.arc(tip.x, tip.y, 2.6, 0, Math.PI * 2); ctx.fill();
        V.label(ctx, row.t.trim(), tip.x + 6, tip.y + (i % 2 === 0 ? -7 : 9), { font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif', color: row.c, align: "left", bgAlpha: 0.9 });
      });
      var ht = { x: ox + H[0] * s, y: oy - H[1] * s };
      V.arrow(ctx, ox, oy, ht.x, ht.y, C.petrol, 3.2, 8);
      V.tokenChip(ctx, "h", ht.x + 5, ht.y - 8, C.petrol, C, { size: 10 });
      var bx = w * 0.55, bw = w * 0.34, top = 0.95;
      rows.forEach(function (row, i) {
        var y = h * 0.30 + i * h * 0.14;
        var len = Math.max(2, V.dot(H, row.w) / top * bw);
        ctx.fillStyle = i === 0 ? C.green : V.alpha(row.c, 0.55);
        ctx.fillRect(bx, y - 5, len, 10);
        V.label(ctx, row.t, bx - 5, y, { font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif', color: i === 0 ? C.green : C.soft, align: "right" });
      });
      V.heading(ctx, "h · W_U → logits", 12, 16, C.petrol, 10, 1);
    }
    function drawMini(canvas, kind) {
      var f = fitMini(canvas);
      if (!f) return;
      var ctx = f.ctx, w = f.w, h = f.h;
      miniBg(ctx, w, h);
      if (kind === "data") miniData(ctx, w, h);
      else if (kind === "tokenizer") miniTokenizer(ctx, w, h);
      else if (kind === "embedding") miniEmbedding(ctx, w, h);
      else if (kind === "attention") miniAttention(ctx, w, h);
      else if (kind === "ffn") miniFFN(ctx, w, h);
      else if (kind === "unembed") miniUnembed(ctx, w, h);
    }
    function drawMinis() {
      detail.querySelectorAll("canvas[data-mini]").forEach(function (cv) { drawMini(cv, cv.getAttribute("data-mini")); });
    }
    function inlineMathText(value) {
      return api.esc(value).replace(/\$([^$]+)\$/g, function (_, tex) {
        var safe = String(tex).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
        return '<span class="ls-math ls-math--inline" data-tex="' + safe + '" data-tex-display="false"><code class="ls-tex-source">' + safe + '</code></span>';
      });
    }
    function renderDetail() {
      var b = blocks[index];
      var html = '<div class="ls-bs-kicker">' + (DE ? "Station " : "Station ") + (index + 1) + ' / ' + blocks.length + '</div>' +
        '<h3 class="ls-bs-title">' + esc(b.title) + '</h3>' +
        '<p class="ls-bs-body">' + inlineMathText(b.body) + '</p>' +
        '<div class="ls-bs-points">' + b.points.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join("") + '</div>';
      if (b.id === "data") {
        html += '<div class="ls-bs-html">' +
          '<div class="ls-bs-html-head">' + (DE ? "Anfang des HTML-Codes · gekürzt" : "Beginning of the HTML · shortened") + '</div>' +
          '<pre><code>' +
          '<span class="ls-syn-tag">&lt;!DOCTYPE html&gt;</span>\n' +
          '<span class="ls-syn-tag">&lt;html</span> <span class="ls-syn-attr">class</span>=<span class="ls-syn-str">"client-nojs vector-feature-…"</span> <span class="ls-syn-attr">lang</span>=<span class="ls-syn-str">"en"</span> <span class="ls-syn-attr">dir</span>=<span class="ls-syn-str">"ltr"</span><span class="ls-syn-tag">&gt;</span>\n' +
          '<span class="ls-syn-tag">&lt;head&gt;</span>\n' +
          '  <span class="ls-syn-tag">&lt;meta</span> <span class="ls-syn-attr">charset</span>=<span class="ls-syn-str">"UTF-8"</span><span class="ls-syn-tag">&gt;</span>\n' +
          '  <span class="ls-syn-tag">&lt;title&gt;</span>Large language model - Wikipedia<span class="ls-syn-tag">&lt;/title&gt;</span>\n' +
          '  <span class="ls-syn-tag">&lt;meta</span> <span class="ls-syn-attr">name</span>=<span class="ls-syn-str">"generator"</span> <span class="ls-syn-attr">content</span>=<span class="ls-syn-str">"MediaWiki 1.48.0-wmf.4"</span><span class="ls-syn-tag">&gt;</span>\n' +
          '  <span class="ls-syn-tag">&lt;meta</span> <span class="ls-syn-attr">name</span>=<span class="ls-syn-str">"referrer"</span> <span class="ls-syn-attr">content</span>=<span class="ls-syn-str">"origin"</span><span class="ls-syn-tag">&gt;</span>\n' +
          '  <span class="ls-syn-tag">&lt;link</span> <span class="ls-syn-attr">rel</span>=<span class="ls-syn-str">"stylesheet"</span> <span class="ls-syn-attr">href</span>=<span class="ls-syn-str">"/w/load.php?lang=en&amp;modules=…"</span><span class="ls-syn-tag">&gt;</span>\n' +
          '<span class="ls-syn-tag">&lt;/head&gt;</span>\n' +
          '<span class="ls-syn-comment">&lt;!-- … 1 062 378 Bytes HTML … --&gt;</span>' +
          '</code></pre></div>' +
          '<div class="ls-bs-book">' +
          '<div class="ls-bs-book-head">' + (DE ? "… danach: ein Buchtext aus dem Korpus" : "… then: a book text from the corpus") + '</div>' +
          '<p class="ls-bs-book-title">' + (DE ? "Also sprach Zarathustra. Ein Buch für Alle und Keinen." : "Thus Spoke Zarathustra. A Book for All and None.") + '</p>' +
          '<p class="ls-bs-book-quote">' + (DE ? "„Man muss noch Chaos in sich tragen, um einen tanzenden Stern gebären zu können.“" : "“One must still have chaos in oneself to be able to give birth to a dancing star.”") + '</p>' +
          '<p class="ls-bs-book-src">' + (DE ? "Friedrich Nietzsche, 1883 · " : "Friedrich Nietzsche, 1883 · ") + '<a href="' + (DE ? "https://www.gutenberg.org/ebooks/7205" : "https://www.gutenberg.org/ebooks/1998") + '" target="_blank" rel="noopener">Project Gutenberg</a></p>' +
          '</div>' +
          '<p class="ls-bs-html-note">' + (DE ? "Die echte Seite ist über ein Megabyte groß. Das Modell sieht nicht „den Artikel“, sondern eine sehr lange Folge von Zeichen, Tags und Text. Zwischen dem HTML und dem Buch liegt eine Auslassung: Der Korpus enthält beides." : "The real page is over a megabyte. The model does not see “the article”, but a very long sequence of characters, tags, and text. Between the HTML and the book sits an omission: the corpus contains both.") + '</p>';
      } else if (b.position) {
        html += '<div class="ls-bs-position-full" data-position-host></div>' +
          '<p class="ls-bs-traj-caption">' + (DE ? "Die Kugel zeigt mögliche Positionskodierungen. Bewege die Position und drehe die Ansicht; der Punkt wandert auf der Kugel." : "The sphere shows possible position encodings. Move the position and rotate the view; the point moves on the sphere.") + '</p>';
      } else if (b.sub) {
        html += '<div class="ls-bs-subgrid">' + b.sub.map(function (s, i) {
          return '<div class="ls-bs-sub"><b>' + esc(s.title) + '</b><div class="ls-bs-subcanvas"><canvas data-mini="' + (["attention", "ffn"][i] || "ffn") + '"></canvas></div><p>' + esc(s.text) + '</p></div>';
        }).join("") + '</div>';
      } else {
        html += '<div class="ls-bs-canvas-wrap' + (b.mini === "unembed" ? " ls-bs-canvas-wrap--unembed" : "") + '"><canvas data-mini="' + b.mini + '"></canvas></div>';
      }
      if (b.mini === "unembed") {
        html += '<p class="ls-bs-traj-caption">' + (DE ? "h = Output-Vektor des LLM: der letzte Vektor aus den Transformer-Blöcken. Der gesamte Kontext ist über viele Schichten und Heads hineingemischt. Die Pfeile sind gelernte Token-Richtungen aus W_U; in dieser schematischen Ansicht entscheidet der Kosinus zu h, im echten Logit zählt auch die Länge." : "h = output vector of the LLM: the final vector from the transformer blocks. The entire context has been mixed into it through many layers and heads. The arrows are learned token directions from W_U; in this schematic view the cosine to h decides, while the real logit also includes length.") + '</p>';
      }
      if (b.source) html += '<p class="ls-bs-source">' + (DE ? "Quelle: " : "Source: ") + '<a href="' + esc(b.source.url) + '" target="_blank" rel="noopener">' + esc(b.source.label) + '</a></p>';
      if (positionDemo) { try { positionDemo.destroy(); } catch (e) {} positionDemo = null; }
      detail.innerHTML = html;
      if (window.TM && typeof window.TM.typesetMath === "function") { try { window.TM.typesetMath(detail); } catch (e) {} }
      if (b.position) {
        var posHost = detail.querySelector("[data-position-host]");
        var posFactory = core.get("position");
        if (posHost && posFactory) {
          positionDemo = posFactory(posHost, {
            lang: api.lang,
            colors: api.colors,
            font: api.font,
            fit: api.fit,
            fitPair: api.fitPair,
            motion: api.motion,
            esc: api.esc,
            util: api.util,
            visual: api.visual
          });
        }
      }
      detail.scrollTop = 0;
      progress.textContent = (index + 1) + ' / ' + blocks.length;
      prevBtn.disabled = index === 0;
      nextBtn.textContent = index === blocks.length - 1 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
      stack.querySelectorAll(".ls-bs-card").forEach(function (btn) {
        btn.classList.toggle("is-on", parseInt(btn.getAttribute("data-index"), 10) === index);
      });
      requestAnimationFrame(drawMinis);
    }
    function setIndex(i) {
      index = Math.max(0, Math.min(blocks.length - 1, i));
      renderDetail();
    }
    function nextInternal() {
      if (index < blocks.length - 1) { setIndex(index + 1); return true; }
      return false;
    }
    function prevInternal() {
      if (index > 0) { setIndex(index - 1); return true; }
      return false;
    }
    buildStack();
    renderDetail();
    prevBtn.addEventListener("click", function () { if (!prevInternal()) api.goPrev(); });
    nextBtn.addEventListener("click", function () { if (!nextInternal()) api.goNext(); });
    window.addEventListener("resize", drawMinis);
    window.addEventListener("tm:theme", function () { C = api.colors(); renderDetail(); });
    return {
      update: function (s) {
        if (!s || s.resetKey === undefined || s.resetKey === resetKey) return;
        resetKey = s.resetKey;
        setIndex(typeof s.start === "number" ? s.start : 0);
      },
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) { return api.util.arrowKey(e, nextInternal, prevInternal); },
      resize: function () { drawMinis(); },
      destroy: function () { lastBlocksIndex = index; if (positionDemo) { try { positionDemo.destroy(); } catch (e) {} positionDemo = null; } window.removeEventListener("resize", drawMinis); el.remove(); }
    };
  }

  core.register("blocks", blocksScene);
})();
