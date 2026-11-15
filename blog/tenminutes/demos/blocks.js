(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function blocksScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var blocks = DE ? [
      {
        id: "data", label: "Daten", short: "Text → Muster", icon: "D", color: "gold",
        title: "Daten",
        body: "Das ist der Anfang des HTML-Codes des Wikipedia-Artikels „Large language model“, stark gekürzt. Danach folgt eine Auslassung und ein Buchtext aus dem Korpus, hier Nietzsche. Der Code enthält Navigation, Stil und Rauschen, aber auch Text und Fakten. Das Modell lernt aus beidem: HTML-Struktur und Inhalt. Man nimmt sehr viele, sehr verschiedene Texte: Reddit-Artikel, Wikipedia, Bücher, die man online findet, Webseiten, Quellcode von Programmen und vieles mehr. Diese Texte sind die Trainingsdaten. Das Modell wird damit gefüttert und lernt Muster daraus: wie man codet, wie menschliche Sprache aussieht, welche Fakten es gibt. In den nächsten Tagen gehen wir diese Sachen alle durch.",
        points: ["Reddit, Wikipedia, Bücher, Webseiten, Code", "Trainingsdaten: Muster lernen", "HTML ist Struktur und Rauschen"],
        mini: "data",
        source: { label: "Wikipedia: Large language model", url: "https://en.wikipedia.org/wiki/Large_language_model" }
      },
      {
        id: "tokenizer", label: "Tokenizer", short: "Text → Tokens", icon: "T", color: "lime",
        title: "Tokenizer",
        body: "Text wird in Tokens zerlegt. Jedes Token bekommt eine ID, die auf eine Zeile im Embedding zeigt.",
        points: ["Token ist nicht Wort", "ID ist eine Adresse"],
        mini: "tokenizer"
      },
      {
        id: "embedding", label: "Embedding", short: "Tokens → Vektoren", icon: "E", color: "sky",
        title: "Embedding",
        body: "Jede ID wird zu einem Vektor. Ähnliche Kontexte landen in ähnlichen Richtungen.",
        points: ["Richtung trägt Bedeutung", "Tabelle wird gelernt"],
        mini: "embedding"
      },
      {
        id: "transformer", label: "Transformer-Blöcke", short: "Attention → FFN, × N", icon: "×N", color: "green",
        title: "Transformer-Blöcke",
        body: "Attention mischt Information zwischen Wörtern. Das FFN formt jedes Token einzeln. Der Block läuft dutzende bis hunderte Male.",
        points: ["Attention: wer liest wen?", "FFN: Muster trennen"],
        roadmap: "Wir werden jeden dieser Schritte in den nächsten Tagen durchgehen und so erklären, dass man es wirklich versteht.",
        mini: "transformer",
        traj: true,
        sub: [
          { title: "Attention", text: "Jedes Token bewertet, wie wichtig jedes andere sichtbare Token ist, und zieht Information aus den wichtigen." },
          { title: "FFN", text: "Das FFN arbeitet pro Token. „new“ allein heißt „neu“, „york“ allein ist ein Ort. Zusammen ergibt sich New York." }
        ]
      },
      {
        id: "unembed", label: "Unembedding", short: "Vektor → Verteilung", icon: "U", color: "lilac",
        title: "Unembedding",
        body: "Der letzte Vektor wird mit den gelernten Richtungen aller Tokens verglichen. Der Winkel wird zum Logit, Softmax macht daraus eine Verteilung.",
        points: ["Richtung statt Länge", "ein Token wird gezogen"],
        mini: "unembed"
      }
    ] : [
      {
        id: "data", label: "Data", short: "text → patterns", icon: "D", color: "gold",
        title: "Data",
        body: "This is the beginning of the HTML of the Wikipedia article “Large language model”, heavily shortened. Then comes an omission and a book text from the corpus, here Nietzsche. The code contains navigation, style, and noise, but also text and facts. The model learns from both: HTML structure and content. People take very many, very different texts: Reddit articles, Wikipedia, books found online, websites, source code of programs, and much more. These texts are the training data. The model is fed with them and learns patterns from them: how to code, what human language looks like, what facts exist. Over the next days we will go through all of these things.",
        points: ["Reddit, Wikipedia, books, websites, code", "training data: learn patterns", "HTML is structure and noise"],
        mini: "data",
        source: { label: "Wikipedia: Large language model", url: "https://en.wikipedia.org/wiki/Large_language_model" }
      },
      {
        id: "tokenizer", label: "Tokenizer", short: "text → tokens", icon: "T", color: "lime",
        title: "Tokenizer",
        body: "Text is split into tokens. Every token gets an ID that points to a row in the embedding.",
        points: ["token is not word", "ID is an address"],
        mini: "tokenizer"
      },
      {
        id: "embedding", label: "Embedding", short: "tokens → vectors", icon: "E", color: "sky",
        title: "Embedding",
        body: "Every ID becomes a vector. Similar contexts land in similar directions.",
        points: ["direction carries meaning", "the table is learned"],
        mini: "embedding"
      },
      {
        id: "transformer", label: "Transformer blocks", short: "attention → FFN, × N", icon: "×N", color: "green",
        title: "Transformer blocks",
        body: "Attention mixes information between words. The FFN shapes each token separately. The block runs dozens to hundreds of times.",
        points: ["attention: who reads whom?", "FFN: separate patterns"],
        roadmap: "We will go through each of these steps over the next days and explain them so that you really understand them.",
        mini: "transformer",
        sub: [
          { title: "Attention", text: "Every token scores how important every other visible token is, then pulls information from the important ones." },
          { title: "FFN", text: "The FFN works per token. “new” alone means “not old”, “york” alone is a place. Together they give New York." }
        ]
      },
      {
        id: "unembed", label: "Unembedding", short: "vector → distribution", icon: "U", color: "lilac",
        title: "Unembedding",
        body: "The last vector is compared with the learned directions of all tokens. The angle becomes a logit, softmax turns it into a distribution.",
        points: ["direction, not length", "one token is drawn"],
        mini: "unembed"
      }
    ];
    var index = 0;
    var trajDemo = null;
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
      var parts = DE ? ["un", "zer", "brech", "lich"] : ["un", "break", "able"];
      var cols = [C.lime, C.sky, C.gold, C.green];
      var wordSize = Math.max(18, api.font("canvas") * 1.15);
      ctx.font = '700 ' + wordSize + 'px "Barlow", sans-serif';
      var widths = parts.map(function (p) { return ctx.measureText(p).width; });
      var total = widths.reduce(function (a, p) { return a + p; }, 0);
      var x = (w - total) / 2, y = h * 0.38;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      parts.forEach(function (part, i) {
        ctx.font = '700 ' + wordSize + 'px "Barlow", sans-serif';
        ctx.fillStyle = C.ink;
        ctx.fillText(part, x, y);
        ctx.fillStyle = V.alpha(cols[i % cols.length], 0.22);
        ctx.fillRect(x - 2, y + 6, widths[i] + 4, 7);
        if (i > 0) {
          ctx.strokeStyle = V.alpha(C.line, 0.9);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y - 8);
          ctx.lineTo(x, y + 16);
          ctx.stroke();
        }
        x += widths[i];
      });
      ctx.textAlign = "center";
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.fillText((DE ? "IDs " : "IDs ") + parts.map(function (_, i) { return 1200 + i * 41; }).join(" · "), w / 2, y + 56);
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
      var pts = [{ p: [0.55, 0.55], t: DE ? "Bank" : "bank", c: C.blue }, { p: [0.95, 0.85], t: DE ? "Geld" : "money", c: C.green }, { p: [1.18, 0.35], t: DE ? "Fluss" : "river", c: C.sky }];
      pts.forEach(function (q) {
        var tip = { x: ox + q.p[0] * s, y: oy - q.p[1] * s };
        V.arrow(ctx, ox, oy, tip.x, tip.y, q.c, 2.2, 6);
        V.tokenChip(ctx, q.t, tip.x + 6, tip.y - 8, q.c, C, { size: 9 });
      });
      V.heading(ctx, "ID → Vektor", 12, 16, C.petrol, 10, 1);
      V.label(ctx, (DE ? "Bank" : "bank") + " → [0.2, −0.4, 0.7, …]", w * 0.62, h * 0.82, {
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
      var left = [{ x: w * 0.12, y: h * 0.40 }, { x: w * 0.12, y: h * 0.60 }];
      var mid = [{ x: w * 0.38, y: h * 0.28 }, { x: w * 0.38, y: h * 0.43 }, { x: w * 0.38, y: h * 0.58 }, { x: w * 0.38, y: h * 0.73 }];
      var right = [{ x: w * 0.64, y: h * 0.40 }, { x: w * 0.64, y: h * 0.60 }];
      ctx.save();
      ctx.strokeStyle = V.alpha(C.line, 0.95);
      ctx.lineWidth = 1;
      left.forEach(function (a) { mid.forEach(function (b) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }); });
      mid.forEach(function (a) { right.forEach(function (b) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }); });
      ctx.restore();
      left.forEach(function (p, i) { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fillStyle = C.sky; ctx.fill(); });
      mid.forEach(function (p, i) { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fillStyle = C.green; ctx.fill(); });
      right.forEach(function (p, i) { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fillStyle = C.gold; ctx.fill(); });
      V.tokenChip(ctx, "new", w * 0.05, h * 0.16, C.blue, C, { size: 9 });
      V.tokenChip(ctx, "york", w * 0.05, h * 0.16 + 22, C.blue, C, { size: 9 });
      V.tokenChip(ctx, DE ? "New York" : "New York", w * 0.82, h * 0.16, C.green, C, { size: 9 });
      V.heading(ctx, "FFN: Muster trennen", 12, 16, C.petrol, 10, 1);
      V.label(ctx, DE ? "pro Token" : "per token", w * 0.50, h * 0.88, { font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif', color: C.muted, align: "center" });
    }
    function miniUnembed(ctx, w, h) {
      var ox = w * 0.16, oy = h * 0.70, s = Math.min(w * 0.22, h * 0.40);
      var H = [0.90, 0.35];
      var rows = [{ t: " the", w: [0.86, 0.50], c: C.green }, { t: " Paris", w: [0.98, 0.08], c: C.blue }, { t: " a", w: [0.20, 0.98], c: C.sky }, { t: " city", w: [0.58, -0.82], c: C.gold }];
      rows.forEach(function (row) {
        var tip = { x: ox + row.w[0] * s, y: oy - row.w[1] * s };
        V.arrow(ctx, ox, oy, tip.x, tip.y, row.c, 1.4, 5);
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
    function renderDetail() {
      var b = blocks[index];
      var html = '<div class="ls-bs-kicker">' + (DE ? "Station " : "Station ") + (index + 1) + ' / ' + blocks.length + '</div>' +
        '<h3 class="ls-bs-title">' + esc(b.title) + '</h3>' +
        '<p class="ls-bs-body">' + esc(b.body) + '</p>' +
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
      } else if (b.sub) {
        html += '<div class="ls-bs-subgrid">' + b.sub.map(function (s, i) {
          return '<div class="ls-bs-sub"><b>' + esc(s.title) + '</b><div class="ls-bs-subcanvas"><canvas data-mini="' + (["attention", "ffn"][i] || "ffn") + '"></canvas></div><p>' + esc(s.text) + '</p></div>';
        }).join("") + '</div>';
        if (b.traj) {
          html += '<div class="ls-bs-traj-full" data-traj-host></div>' +
            '<p class="ls-bs-traj-caption">' + (DE ? "Demo: echte GPT-2-small-Zustände, 768 → 3 mit PCA, Winkel/Großkreis. Die Layer bewegen sich; das ist eine Demo, keine vollständige Rekonstruktion. Details folgen später." : "Demo: real GPT-2 small states, 768 → 3 with PCA, angle/great circle. The layers move; this is a demo, not a full reconstruction. Details follow later.") + '</p>';
        }
      } else {
        html += '<div class="ls-bs-canvas-wrap"><canvas data-mini="' + b.mini + '"></canvas></div>';
      }
      if (b.source) html += '<p class="ls-bs-source">' + (DE ? "Quelle: " : "Source: ") + '<a href="' + esc(b.source.url) + '" target="_blank" rel="noopener">' + esc(b.source.label) + '</a></p>';
      if (b.roadmap) html += '<p class="ls-bs-roadmap">' + esc(b.roadmap) + '</p>';
      if (trajDemo) { try { trajDemo.destroy(); } catch (e) {} trajDemo = null; }
      detail.innerHTML = html;
      if (b.traj) {
        var trajHost = detail.querySelector("[data-traj-host]");
        var trajFactory = core.get("trajectories");
        if (trajHost && trajFactory) {
          trajDemo = trajFactory(trajHost, {
            lang: api.lang,
            colors: api.colors,
            font: api.font,
            fit: api.fit,
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
      update: function () {},
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) { return api.util.arrowKey(e, nextInternal, prevInternal); },
      resize: function () { drawMinis(); },
      destroy: function () { if (trajDemo) { try { trajDemo.destroy(); } catch (e) {} trajDemo = null; } window.removeEventListener("resize", drawMinis); el.remove(); }
    };
  }

  core.register("blocks", blocksScene);
})();
