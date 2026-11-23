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
        source: { label: "Firth (1957), A Synopsis of Linguistic Theory", url: "https://archive.org/details/studiesinlinguis0000vari" },
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
        id: "transformer", label: "Transformer-Blöcke", short: "Attention · FFN · LN, × N", icon: "×N", color: "green",
        title: "Transformer-Blöcke",
        body: "Attention mischt Information zwischen Wörtern. Das Feed-Forward-Netzwerk (FFN) „denkt“, indem es die Tokens im hochdimensionalen Bedeutungsraum verschiebt. Es projiziert die durch Attention gemischten Punkte in einen größeren Raum, knickt und verzerrt sie dort und projiziert sie zurück, damit sich Muster und Kategorien leichter trennen oder neu kombinieren lassen. So isoliert es Bedeutungszusammenhänge kontextabhängig und kann auf einzelne Bedeutungen reagieren. GPT-2 small hat 12 Blöcke; große Modelle haben dutzende bis über hundert. Der Residualstrom läuft durch alle Blöcke; Attention und FFN addieren ihre Updates darauf. Dazu kommt LayerNorm, das die Aktivierungen in einer stabilen Skala hält. Der Transformer nutzt das Verschieben dieser Punkte zum Denken: Jede Schicht verschiebt den Punkt neu. Die Tokens aus dem Embedding bilden die Werte am Anfang; jede Schicht addiert ihre Änderung auf diese Wortpositionen. Attention, LayerNorm und FFN kommen als eigene Unterseiten; danach folgt die ganze Architektur als Funktion f(x).",
        points: [],
        mini: "transformer",
        sub: [
          { title: "Attention", mini: "attention", text: "Attention bewertet für jedes einzelne Token, wie wichtig alle anderen Tokens unter einem gewissen Aspekt sind, und verschiebt das Token so, dass es den Gesamtkontext unter diesem Gesichtspunkt beinhaltet. Es gibt viele Attention-Blöcke; sie können auf bestimmte Arten von Strukturen achten, diese isolieren und in den gesamten bisherigen Text schauen, um zu sehen, wo etwas im Gesamtkontext steht.", sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }] },
          { title: "LayerNorm", mini: "layernorm", wide: true, text: "LayerNorm normiert für jedes Token den Vektor über seine Merkmalsdimensionen: Mittelwert 0, Varianz 1, danach zwei gelernte Parameter γ und β (Ba et al., 2016). Es mischt keine Information zwischen Tokens und erzeugt keine Bedeutung; es hält die Aktivierungen nur in einem stabilen Bereich, damit Attention und FFN trainierbar bleiben. Wo es sitzt, ist eine Trainingsentscheidung: Post-LN im Original braucht Warm-up, Pre-LN in GPT-2 ist stabiler (Xiong et al., 2020); technisch wichtig, aber nicht der inhaltliche Kern.", sources: [{ label: "Ba, Kiros & Hinton (2016), Layer Normalization", url: "https://arxiv.org/abs/1607.06450" }, { label: "Xiong et al. (2020), On Layer Normalization in the Transformer Architecture", url: "https://arxiv.org/abs/2002.04745" }] },
          { title: "Feed-Forward-Netzwerk (FFN)", mini: "ffn", lead: true, text: "Das FFN ist ein kleines neuronales Netz, das jedes Token einzeln durchläuft. Man kann sich seine Arbeit wie Origami in vielen Dimensionen vorstellen: Es projiziert den Vektor in einen größeren Raum (bei GPT-2 von 768 auf 3072 Zahlen), knickt und verzerrt diesen Raum und projiziert den Vektor zurück. Das Training passt die Gewichte so an, dass sich Muster dort möglichst gut trennen lassen; bei Klassifikationsaufgaben sind das die Klassen, im LLM gelernte Merkmale.\n\nEs kann aber mehr als trennen: Je nach Gewichten zieht es Dinge zusammen oder mischt Merkmale neu, und oft passiert beides gleichzeitig. Die Grafik ist symbolisch: links gemischte Daten, in der Mitte das Netz, rechts die neu geordneten Daten.", sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }, { label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355" }, { label: "Olah (2014), Neural Networks, Manifolds, and Topology", url: "https://colah.github.io/posts/2014-03-NN-Manifolds-Topology/" }] },
        ],
        sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }, { label: "Ba, Kiros & Hinton (2016), Layer Normalization", url: "https://arxiv.org/abs/1607.06450" }, { label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355" }, { label: "Olah (2014), Neural Networks, Manifolds, and Topology", url: "https://colah.github.io/posts/2014-03-NN-Manifolds-Topology/" }]
      },
      {
        id: "unembed", label: "Unembedding", short: "Vektor → Verteilung", icon: "U", color: "lilac",
        title: "Unembedding",
        body: "Am Ende, nachdem die Bedeutungen viele Male gemischt und wieder getrennt worden sind, enthält der letzte Vektor des letzten Tokens in der letzten Schicht die Gesamtbedeutung des Kontexts. Man vergleicht diesen Vektor mit den gelernten Richtungen aller Wörter und misst die Winkel. Ein kleiner Winkel heißt: Das Wort passt gut an diese Stelle. In dieser schematischen Ansicht wird das Wort mit dem größten Kosinus ausgewählt; im echten Logit zählt auch die Länge.",
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
        source: { label: "Firth (1957), A Synopsis of Linguistic Theory", url: "https://archive.org/details/studiesinlinguis0000vari" },
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
        id: "transformer", label: "Transformer blocks", short: "attention · FFN · LN, × N", icon: "×N", color: "green",
        title: "Transformer blocks",
        body: "Attention mixes information between words. The feed-forward network (FFN) “thinks” by shifting the tokens in the high-dimensional meaning space. It projects the points mixed by attention into a larger space, folds and distorts them there, and projects them back so that patterns and categories are easier to separate or recombine. That is how it isolates meaning relations depending on context and can react to individual meanings. GPT-2 small has 12 blocks; large models have dozens to over a hundred. The residual stream runs through all blocks; attention and FFN add their updates to it. LayerNorm keeps the activations at a stable scale. The transformer uses moving these points to think: every layer moves the point again. The tokens from the embedding form the initial values; every layer adds its change to these word positions. Attention, LayerNorm, and FFN each get their own subpage; after that, the whole architecture follows as a function f(x).",
        points: [],
        mini: "transformer",
        sub: [
          { title: "Attention", mini: "attention", text: "Attention scores, for each individual token, how important all other tokens are under a certain aspect, and shifts the token so that it contains the overall context under those aspects. There are many attention blocks; they can attend to specific kinds of structures, isolate them, and look into the entire text so far to see where something stands in the overall context.", sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }] },
          { title: "LayerNorm", mini: "layernorm", wide: true, text: "LayerNorm normalizes each token vector across its feature dimensions: mean 0, variance 1, then two learned parameters γ and β (Ba et al., 2016). It mixes no information between tokens and creates no meaning; it only keeps the activations in a stable range so attention and FFN remain trainable. Where it sits is a training choice: Post-LN in the original needs warm-up, Pre-LN in GPT-2 is more stable (Xiong et al., 2020); technically important, but not the content core.", sources: [{ label: "Ba, Kiros & Hinton (2016), Layer Normalization", url: "https://arxiv.org/abs/1607.06450" }, { label: "Xiong et al. (2020), On Layer Normalization in the Transformer Architecture", url: "https://arxiv.org/abs/2002.04745" }] },
          { title: "Feed-forward network (FFN)", mini: "ffn", lead: true, text: "The FFN is a small neural network that every token passes through on its own. Picture its work as origami in many dimensions: it projects the vector into a larger space (in GPT-2 from 768 to 3072 numbers), folds and distorts that space, and projects the vector back. Training adjusts the weights so that patterns are as easy to separate there as possible; in classification tasks those are the classes, in an LLM they are learned features.\n\nBut it can do more than separate: depending on its weights it also pulls things together or recombines features, and often both happen at once. The graphic is symbolic: mixed data on the left, the network in the middle, reordered data on the right.", sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }, { label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355" }, { label: "Olah (2014), Neural Networks, Manifolds, and Topology", url: "https://colah.github.io/posts/2014-03-NN-Manifolds-Topology/" }] },
        ],
        sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }, { label: "Ba, Kiros & Hinton (2016), Layer Normalization", url: "https://arxiv.org/abs/1607.06450" }, { label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355" }, { label: "Olah (2014), Neural Networks, Manifolds, and Topology", url: "https://colah.github.io/posts/2014-03-NN-Manifolds-Topology/" }]
      },
      {
        id: "unembed", label: "Unembedding", short: "vector → distribution", icon: "U", color: "lilac",
        title: "Unembedding",
        body: "At the end, after meanings have been mixed and separated many times, the final vector of the last token in the last layer contains the overall meaning of the context. It is compared with the learned directions of all words, and the angles are measured. A small angle means the word fits this position well. In this schematic view the word with the largest cosine is selected; in the real logit the length also counts.",
        points: [],
        mini: "unembed",
      }
    ];
    var pages = [];
    blocks.forEach(function (b, bi) {
      pages.push({ block: b, blockIndex: bi, sub: null });
      if (b.sub) b.sub.forEach(function (sub) { pages.push({ block: b, blockIndex: bi, sub: sub }); });
    });
    function blockStartPage(blockIndex) {
      for (var p = 0; p < pages.length; p++) {
        if (pages[p].blockIndex === blockIndex && !pages[p].sub) return p;
      }
      return 0;
    }
    var index = Math.max(0, Math.min(pages.length - 1, lastBlocksIndex));
    var resetKey = null;
    var positionDemo = null;
    var trajApi = null;
    var el = document.createElement("div");
    el.className = "ls-blocks-scene";
    el.innerHTML = '<div class="ls-bs-residual" aria-label="' + (DE ? "Residualstrom: x läuft durch die Blöcke; Attention und FFN addieren ihre Updates." : "Residual stream: x runs through the blocks; attention and FFN add their updates.") + '">' +
      '<span class="ls-bs-residual-title">' + (DE ? "Residualstrom" : "Residual stream") + '</span>' +
      '<span class="ls-bs-res-flow">' +
        '<span class="ls-bs-res-node" data-tip="' + (DE ? "Startwert: Token-Embedding + Position." : "Start value: token embedding + position.") + '">x</span>' +
        '<span class="ls-bs-res-arrow">↓</span>' +
        '<span class="ls-bs-res-block" data-tip="' + (DE ? "LayerNorm + Attention: liest den Stream und berechnet ein Update." : "LayerNorm + attention: reads the stream and computes an update.") + '"><b>LN</b><span>Attention</span></span>' +
        '<span class="ls-bs-res-plus" data-tip="' + (DE ? "Residual-Addition: x + Attention-Update." : "Residual addition: x + attention update.") + '">+</span>' +
        '<span class="ls-bs-res-arrow">↓</span>' +
        '<span class="ls-bs-res-block" data-tip="' + (DE ? "LayerNorm + FFN: liest den Stream und addiert ein Update." : "LayerNorm + FFN: reads the stream and adds an update.") + '"><b>LN</b><span>FFN</span></span>' +
        '<span class="ls-bs-res-plus" data-tip="' + (DE ? "Residual-Addition: x + FFN-Update." : "Residual addition: x + FFN update.") + '">+</span>' +
        '<span class="ls-bs-res-arrow">↓</span>' +
        '<span class="ls-bs-res-node is-output" data-tip="' + (DE ? "Ausgabe des Blocks; derselbe Stream läuft weiter." : "Block output; the same stream continues.") + '">x′</span>' +
        '<span class="ls-bs-res-times" data-tip="' + (DE ? "Dieser Block wiederholt sich N-mal." : "This block repeats N times.") + '">× N</span>' +
      '</span>' +
      '<span class="ls-bs-residual-note">' + (DE ? "x bleibt erhalten; die Blöcke addieren nur ihre Änderung." : "x is preserved; the blocks only add their change.") + '</span>' +
      '</div>' +
      '<div class="ls-bs-stack" role="list"></div>' +
      '<div class="ls-bs-detail" aria-live="polite"></div>' +
      '<div class="ls-bs-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-bs-prev" data-no-height-test="1">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-bs-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-bs-next" data-no-height-test="1">' + (DE ? "Weiter →" : "Next →") + '</button></div>';
    root.appendChild(el);
    var stack = el.querySelector(".ls-bs-stack");
    var detail = el.querySelector(".ls-bs-detail");
    var progress = el.querySelector(".ls-bs-progress");
    var prevBtn = el.querySelector(".ls-bs-prev");
    var nextBtn = el.querySelector(".ls-bs-next");
    var resTip = document.createElement("div");
    resTip.className = "ls-bs-res-tip";
    resTip.hidden = true;
    el.appendChild(resTip);
    function showResTip(event) {
      var text = event.currentTarget.getAttribute("data-tip");
      if (!text) return;
      resTip.textContent = text;
      resTip.hidden = false;
      var x = Math.min(window.innerWidth - 240, event.clientX + 12);
      var y = Math.min(window.innerHeight - 44, event.clientY + 12);
      resTip.style.left = Math.max(8, x) + "px";
      resTip.style.top = Math.max(8, y) + "px";
    }
    function hideResTip() { resTip.hidden = true; }
    el.querySelectorAll(".ls-bs-residual [data-tip]").forEach(function (node) {
      node.addEventListener("pointerenter", showResTip);
      node.addEventListener("pointermove", showResTip);
      node.addEventListener("pointerleave", hideResTip);
    });
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
            '<span class="ls-bs-pills"><span class="ls-bs-pill" data-sub="attention">A · Attention</span><span class="ls-bs-pill" data-sub="layernorm">LN · LayerNorm</span><span class="ls-bs-pill" data-sub="ffn">FFN</span></span>';
        } else {
          card.innerHTML = '<span class="ls-bs-icon">' + esc(b.icon) + '</span><span class="ls-bs-label"><b>' + esc(b.label) + '</b><small>' + esc(b.short) + '</small></span>';
        }
        card.addEventListener("click", function () { setIndex(blockStartPage(i)); });
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
      var top = Math.min(52, Math.max(40, h * 0.16));
      var bottom = h - Math.max(20, h * 0.09);
      var midY = (top + bottom) / 2;
      var leftX = w * 0.035, panelW = w * 0.245;
      var rightX = w * 0.72;
      var inputX = w * 0.355, hiddenX = w * 0.50, outputX = w * 0.645;
      function FY(t) { return top + t * (bottom - top); }
      V.arrow(ctx, leftX + panelW + 6, midY, inputX - 10, midY, C.petrol, 2, 7);
      V.arrow(ctx, outputX + 10, midY, rightX - 6, midY, C.petrol, 2, 7);
      function scatter(panelX, gold, blue, separated) {
        ctx.save();
        ctx.strokeStyle = V.alpha(C.lineStrong, 0.8);
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX + 0.5, top + 0.5, panelW - 1, (bottom - top) - 1);
        if (separated) {
          ctx.setLineDash([5, 4]);
          ctx.strokeStyle = V.alpha(C.petrol, 0.7);
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(panelX + panelW * 0.04, FY(0.13));
          ctx.lineTo(panelX + panelW * 0.96, FY(0.87));
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
        function dots(points, color) {
          points.forEach(function (p) {
            ctx.beginPath();
            ctx.arc(panelX + p[0] * panelW, FY(p[1]), 4.6, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = C.paper;
            ctx.lineWidth = 1.4;
            ctx.stroke();
          });
        }
        dots(blue, C.blue);
        dots(gold, C.gold);
      }
      var mixedGold = [[0.34, 0.40], [0.55, 0.30], [0.46, 0.60], [0.66, 0.46], [0.40, 0.52], [0.60, 0.66], [0.50, 0.35]];
      var mixedBlue = [[0.38, 0.53], [0.58, 0.42], [0.44, 0.28], [0.62, 0.58], [0.52, 0.49], [0.68, 0.34], [0.30, 0.45]];
      var sortedGold = [[0.65, 0.18], [0.73, 0.14], [0.68, 0.27], [0.78, 0.22], [0.60, 0.24], [0.75, 0.10], [0.70, 0.20]];
      var sortedBlue = [[0.24, 0.74], [0.33, 0.80], [0.28, 0.66], [0.37, 0.72], [0.20, 0.82], [0.34, 0.60], [0.30, 0.76]];
      scatter(leftX, mixedGold, mixedBlue, false);
      scatter(rightX, sortedGold, sortedBlue, true);
      var input = [0.30, 0.50, 0.70].map(function (t) { return { x: inputX, y: FY(t) }; });
      var hidden = [0.10, 0.30, 0.50, 0.70, 0.90].map(function (t) { return { x: hiddenX, y: FY(t) }; });
      var output = [0.30, 0.50, 0.70].map(function (t) { return { x: outputX, y: FY(t) }; });
      ctx.save();
      ctx.strokeStyle = V.alpha(C.lineStrong, 0.85);
      ctx.lineWidth = 0.9;
      input.forEach(function (a) { hidden.forEach(function (b) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }); });
      hidden.forEach(function (a) { output.forEach(function (b) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }); });
      ctx.restore();
      function nodes(list, color) {
        list.forEach(function (p) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = C.paper;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        });
      }
      nodes(input, C.sky);
      nodes(hidden, C.green);
      nodes(output, C.gold);
      V.tokenChip(ctx, DE ? "ungeordnet" : "unordered", leftX, 30, C.blue, C, { size: 9 });
      V.tokenChip(ctx, DE ? "Neuronales Netz" : "neural network", w * 0.5, 30, C.green, C, { size: 9, align: "center" });
      V.tokenChip(ctx, DE ? "neu geordnet" : "reordered", rightX + panelW, 30, C.gold, C, { size: 9, align: "right" });
      V.heading(ctx, DE ? "FFN: Daten entwirren und neu ordnen" : "FFN: untangle and reorder data", 12, 14, C.petrol, 10, 1);
      V.label(ctx, DE ? "symbolisch: links gemischt, rechts getrennt; je nach Gewichten auch neu gemischt, oft beides zugleich" : "symbolic: mixed left, separated right; depending on the weights it can also remix, often both at once", w * 0.5, h - 8, { font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif', color: C.muted, align: "center" });
    }
    function miniLayerNorm(ctx, w, h) {
      var values = [1, 2, 3, 4, 5];
      var mean = 3, std = Math.sqrt(2);
      var normed = values.map(function (v) { return (v - mean) / std; });
      var pad = Math.max(10, w * 0.035);
      var top = 36, bottom = h - 36;
      var panelW = Math.min(w * 0.33, (w - 2 * pad) * 0.40);
      var gap = Math.max(18, w * 0.055);
      var leftX = (w - (2 * panelW + gap)) / 2, rightX = leftX + panelW + gap;
      var center = top + (bottom - top) / 2;
      var barW = Math.min(18, panelW / (values.length * 1.8));
      var scaleL = (bottom - top - 10) / 5.2;
      var scaleR = (bottom - top - 10) / 3.4;
      function bars(x, vals, scale, zero, positiveOnly) {
        vals.forEach(function (v, i) {
          var cx = x + panelW * (i + 0.5) / vals.length;
          var y = zero - v * scale;
          var y0 = positiveOnly ? y : Math.min(y, zero);
          ctx.fillStyle = V.alpha(positiveOnly ? C.sky : C.green, 0.62);
          ctx.fillRect(cx - barW / 2, y0, barW, Math.abs(y - zero));
        });
      }
      function meanLine(x, y, label, color) {
        ctx.save();
        ctx.strokeStyle = V.alpha(color, 0.85);
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + panelW, y);
        ctx.stroke();
        ctx.restore();
        V.label(ctx, label, x + panelW, y - 5, { font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif', color: color, align: "right" });
      }
      ctx.strokeStyle = V.alpha(C.line, 0.9);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(leftX, bottom);
      ctx.lineTo(leftX + panelW, bottom);
      ctx.moveTo(rightX, center);
      ctx.lineTo(rightX + panelW, center);
      ctx.stroke();
      bars(leftX, values, scaleL, bottom, true);
      bars(rightX, normed, scaleR, center, false);
      meanLine(leftX, bottom - mean * scaleL, DE ? "μ 3,0" : "μ 3.0", C.sky);
      meanLine(rightX, center, DE ? "μ 0,0" : "μ 0.0", C.green);
      [-1, 1].forEach(function (v) {
        var y = center - v * scaleR;
        ctx.save();
        ctx.strokeStyle = V.alpha(C.line, 0.7);
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(rightX, y);
        ctx.lineTo(rightX + panelW, y);
        ctx.stroke();
        ctx.restore();
        V.label(ctx, v > 0 ? "+1" : "−1", rightX + panelW - 2, y - 2, { font: '600 ' + Math.max(7, api.font("canvas-sm") - 2) + 'px "Open Sans", sans-serif', color: C.muted, align: "right" });
      });
      V.label(ctx, DE ? "vorher" : "before", leftX, top - 8, { font: '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Barlow", sans-serif', color: C.sky });
      V.label(ctx, DE ? "nachher" : "after", rightX, top - 8, { font: '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Barlow", sans-serif', color: C.green });
      V.label(ctx, DE ? "σ 1,4" : "σ 1.4", leftX, bottom + 15, { font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif', color: C.muted });
      V.label(ctx, DE ? "σ 1,0" : "σ 1.0", rightX, bottom + 15, { font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif', color: C.muted });
      var ax = leftX + panelW + 4, bx = rightX - 8;
      ctx.strokeStyle = V.alpha(C.petrol, 0.8);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ax, center);
      ctx.lineTo(bx, center);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx, center);
      ctx.lineTo(bx - 5, center - 3);
      ctx.lineTo(bx - 5, center + 3);
      ctx.closePath();
      ctx.fillStyle = C.petrol;
      ctx.fill();
      V.label(ctx, "−μ / σ", (ax + bx) / 2, center - 9, { font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif', color: C.petrol, align: "center" });
      V.label(ctx, DE ? "Werte dürfen > 1 sein; Länge √d, nicht 1" : "values may exceed 1; length √d, not 1", w / 2, h - 7, { font: '600 ' + Math.max(7, api.font("canvas-sm") - 2) + 'px "Open Sans", sans-serif', color: C.muted, align: "center" });
      V.heading(ctx, DE ? "LayerNorm · pro Token" : "LayerNorm · per token", 12, 16, C.petrol, 10, 1);
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
      V.tokenChip(ctx, DE ? "letzter Vektor" : "last vector", ht.x + 5, ht.y - 8, C.petrol, C, { size: 9 });
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
      else if (kind === "layernorm") miniLayerNorm(ctx, w, h);
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
    function syncSubMarker(sub) {
      var mini = sub ? (sub.mini || "ffn") : null;
      el.querySelectorAll(".ls-bs-pill").forEach(function (pill) {
        pill.classList.toggle("is-current", !!mini && pill.getAttribute("data-sub") === mini);
      });
      el.querySelectorAll(".ls-bs-res-block").forEach(function (block) {
        var label = block.textContent.toLowerCase();
        var current = !!mini && (mini === "attention" ? label.indexOf("attention") >= 0 : mini === "ffn" ? label.indexOf("ffn") >= 0 : label.indexOf("ln") >= 0);
        block.classList.toggle("is-current", current);
      });
    }
    function setupTrajectoryDemo() {
      var host = detail.querySelector("[data-traj-host]");
      if (!host) return null;
      var stage = host.querySelector(".ls-bs-traj-stage");
      var canvas = host.querySelector(".ls-bs-traj-canvas");
      var stepBtn = host.querySelector(".ls-bs-traj-step");
      var resetBtn = host.querySelector(".ls-bs-traj-reset");
      var readout = host.querySelector(".ls-bs-traj-readout");
      var traj = [
        { label: DE ? "Katze" : "cat", col: "green", pts: [[-0.80, 0.16], [-0.70, 0.34], [-0.62, 0.50], [-0.76, 0.54], [-0.60, 0.48]] },
        { label: DE ? "Bank" : "bank", col: "gold", pts: [[0.86, -0.34], [0.86, -0.14], [0.84, 0.02], [0.76, 0.08], [0.66, 0.06]] },
        { label: DE ? "König" : "king", col: "lilac", pts: [[-0.04, -0.50], [-0.16, -0.42], [-0.32, -0.44], [-0.48, -0.52], [-0.64, -0.44]] },
        { label: DE ? "Fluss" : "river", col: "sky", pts: [[0.44, 0.30], [0.50, 0.42], [0.58, 0.48], [0.64, 0.42], [0.72, 0.44]] }
      ];
      var state = { step: 0, from: 0, to: 0, t: 1 };
      var raf = 0, size = null, trajHits = [], trajHover = -1, queue = [];
      function project(p) {
        var scale = Math.min((size.w * 0.42) / 0.95, (size.h * 0.42) / 0.62);
        return { x: size.w / 2 + p[0] * scale, y: size.h / 2 - p[1] * scale };
      }
      function arrow(g, a, b, col) {
        var ang = Math.atan2(b.y - a.y, b.x - a.x);
        g.fillStyle = col;
        var head = 7;
        g.beginPath();
        g.moveTo(b.x, b.y);
        g.lineTo(b.x - head * Math.cos(ang - 0.45), b.y - head * Math.sin(ang - 0.45));
        g.lineTo(b.x - head * Math.cos(ang + 0.45), b.y - head * Math.sin(ang + 0.45));
        g.closePath(); g.fill();
      }
      function draw() {
        if (!size || size.w < 40 || size.h < 40) return;
        var g = size.ctx, w = size.w, h = size.h, C = api.colors();
        g.clearRect(0, 0, w, h);
        var bg = g.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, C.paper || "#fff");
        bg.addColorStop(1, C.paper2 || C.paper || "#fff");
        g.fillStyle = bg; g.fillRect(0, 0, w, h);
        g.strokeStyle = C.line; g.globalAlpha = 0.30; g.lineWidth = 1;
        for (var i = -2; i <= 2; i++) {
          var gx = w / 2 + i * Math.min(w * 0.18, h * 0.22);
          var gy = h / 2 + i * Math.min(w * 0.18, h * 0.22);
          g.beginPath(); g.moveTo(gx, 24); g.lineTo(gx, h - 30); g.stroke();
          g.beginPath(); g.moveTo(16, gy); g.lineTo(w - 16, gy); g.stroke();
        }
        g.globalAlpha = 0.75; g.strokeStyle = C.lineStrong; g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(16, h / 2); g.lineTo(w - 16, h / 2); g.stroke();
        g.beginPath(); g.moveTo(w / 2, 24); g.lineTo(w / 2, h - 30); g.stroke();
        g.globalAlpha = 1;
        g.fillStyle = C.muted;
        g.font = '600 ' + Math.max(8, Math.min(10, w * 0.016)) + 'px "Open Sans", sans-serif';
        g.textAlign = "left"; g.textBaseline = "alphabetic";
        g.fillText(DE ? "Dimension 1" : "dimension 1", 16, h - 34);
        g.save(); g.translate(16, 30); g.rotate(-Math.PI / 2); g.fillText(DE ? "Dimension 2" : "dimension 2", 0, 0); g.restore();
        g.textAlign = "right";
        g.fillStyle = C.petrol;
        g.font = '700 ' + Math.max(9, Math.min(11, w * 0.017)) + 'px "Barlow", sans-serif';
        g.fillText((DE ? "Schicht " : "layer ") + state.to + " / 4", w - 16, 22);
        g.textAlign = "left";
        g.fillStyle = C.muted;
        g.font = '600 ' + Math.max(7, Math.min(9, w * 0.014)) + 'px "Open Sans", sans-serif';
        g.fillText(DE ? "L0 … L4 · fiktives Beispiel" : "L0 … L4 · fictional example", 16, 22);

        var from = state.from, to = state.to, t = state.t;
        trajHits = [];
        var rendered = traj.map(function (item) {
          return { item: item, col: C[item.col] || C.petrol, pts: item.pts.map(project) };
        });
        // First pass: travelled lines only, shortened at both ends so a line
        // never touches a point marker.
        rendered.forEach(function (r) {
          for (var s = 0; s < to; s++) {
            var a = r.pts[s], b = r.pts[s + 1];
            var dx = b.x - a.x, dy = b.y - a.y;
            var len = Math.hypot(dx, dy) || 1;
            var gap = 10;
            if (len <= gap * 2.2) continue;
            var ux = dx / len, uy = dy / len;
            var a2 = { x: a.x + ux * gap, y: a.y + uy * gap };
            var b2 = { x: b.x - ux * gap, y: b.y - uy * gap };
            g.strokeStyle = r.col; g.globalAlpha = 0.96; g.lineWidth = 2.8;
            g.beginPath(); g.moveTo(a2.x, a2.y); g.lineTo(b2.x, b2.y); g.stroke();
            g.globalAlpha = 0.9;
            arrow(g, a2, b2, r.col);
            g.globalAlpha = 1;
          }
        });
        // Second pass: points on top with a paper halo, so crossing lines are
        // masked and the markers stay visually separate.
        rendered.forEach(function (r) {
          var item = r.item, pts = r.pts, col = r.col;
          for (var k = 0; k <= to; k++) {
            var on = k === to;
            g.beginPath();
            g.arc(pts[k].x, pts[k].y, 10.5, 0, Math.PI * 2);
            g.fillStyle = C.paper || "#fff";
            g.globalAlpha = 0.94;
            g.fill();
            g.globalAlpha = 1;
            if (on) {
              g.beginPath();
              g.arc(pts[k].x, pts[k].y, 13, 0, Math.PI * 2);
              g.fillStyle = col; g.globalAlpha = 0.14; g.fill(); g.globalAlpha = 1;
            }
            g.beginPath();
            g.arc(pts[k].x, pts[k].y, on ? 6 : 4.2, 0, Math.PI * 2);
            g.fillStyle = on ? col : (C.paper || "#fff");
            g.fill();
            g.strokeStyle = col; g.lineWidth = on ? 2.6 : 2.0; g.stroke();
            trajHits.push({ x: pts[k].x, y: pts[k].y, layer: k, label: item.label });
          }
          var a = pts[from], b = pts[to];
          var cp = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
          if (t < 1) {
            g.beginPath(); g.arc(cp.x, cp.y, 10.5, 0, Math.PI * 2);
            g.fillStyle = C.paper || "#fff"; g.globalAlpha = 0.94; g.fill(); g.globalAlpha = 1;
            g.beginPath(); g.arc(cp.x, cp.y, 6, 0, Math.PI * 2);
            g.fillStyle = col; g.globalAlpha = 0.95; g.fill(); g.globalAlpha = 1;
          }
          g.fillStyle = C.ink;
          g.font = '700 ' + Math.max(9, Math.min(12, w * 0.019)) + 'px "Barlow", sans-serif';
          g.textAlign = "center"; g.textBaseline = "bottom";
          g.fillText(item.label, cp.x, cp.y - 12);
        });
        if (trajHover >= 0 && trajHits[trajHover]) {
          var hh = trajHits[trajHover];
          g.beginPath();
          g.arc(hh.x, hh.y, 9, 0, Math.PI * 2);
          g.strokeStyle = C.petrol; g.lineWidth = 2.2; g.stroke();
          var tip = hh.label + " · L" + hh.layer;
          g.font = '700 ' + Math.max(8, Math.min(11, w * 0.017)) + 'px "Open Sans", sans-serif';
          var tw = g.measureText(tip).width;
          var tx = Math.max(8, Math.min(w - tw - 16, hh.x + 12));
          var ty = Math.max(32, hh.y - 14);
          g.fillStyle = C.paper || "#fff";
          g.strokeStyle = C.lineStrong; g.lineWidth = 1;
          g.fillRect(tx - 5, ty - 12, tw + 10, 17);
          g.strokeRect(tx - 5, ty - 12, tw + 10, 17);
          g.fillStyle = C.ink;
          g.textAlign = "left"; g.textBaseline = "alphabetic";
          g.fillText(tip, tx, ty);
        }
        var ly = h - 28;
        g.font = '700 ' + Math.max(8, Math.min(10, w * 0.015)) + 'px "Barlow", sans-serif';
        g.textAlign = "center"; g.textBaseline = "alphabetic";
        for (var li = 0; li <= 4; li++) {
          var lx = w / 2 + (li - 2) * Math.min(54, w * 0.075);
          var cur = li === state.to;
          g.fillStyle = cur ? C.green : C.muted;
          g.fillText("L" + li, lx, ly);
          if (li < 4) {
            g.fillStyle = C.muted;
            g.fillText("→", lx + Math.min(27, w * 0.0375), ly);
          }
        }
        g.textAlign = "left";
        g.fillStyle = C.muted;
        g.font = '600 ' + Math.max(7, Math.min(9, w * 0.014)) + 'px "Open Sans", sans-serif';
        g.fillText(DE ? "Start = hohler Punkt · aktuell = gefüllter Punkt · Linie = Weg durch die Schichten" : "start = hollow point · current = filled point · line = path through the layers", 16, h - 8);
        canvas.setAttribute("aria-label", DE
          ? "Vereinfachte 2D-Trajektorie von vier Token-Vektoren durch fünf Schichten. Aktuell: Schicht " + state.to + " von 4."
          : "Simplified 2D trajectory of four token vectors through five layers. Current: layer " + state.to + " of 4.");
      }
      function updateReadout() {
        if (readout) readout.textContent = state.to === 0
          ? (DE ? "Start: die Punkte liegen an ihren Ausgangspositionen." : "Start: the points sit at their initial positions.")
          : (DE ? "Schicht " + state.to + " / 4: die Punkte wurden neu verschoben." : "Layer " + state.to + " / 4: the points have moved again.");
        var end = raf ? (queue.length ? queue[queue.length - 1] : state.to) : state.step;
        if (stepBtn) stepBtn.disabled = end >= 4;
        if (resetBtn) resetBtn.disabled = !raf && state.step <= 0;
      }
      function animate(to) {
        if (raf) cancelAnimationFrame(raf);
        if (state.step === to) { updateReadout(); return; }
        state.from = state.step; state.to = to; state.t = 0;
        var t0 = performance.now(), dur = (api.motion && api.motion.scale) ? api.motion.scale(700) : 700;
        function frame(now) {
          var t = Math.max(0, Math.min(1, (now - t0) / dur));
          state.t = 1 - Math.pow(1 - t, 3);
          draw();
          if (t < 1) raf = requestAnimationFrame(frame);
          else {
            state.step = to; state.from = to; state.t = 1; raf = 0; updateReadout();
            if (queue.length) { var q = queue.shift(); animate(q); }
          }
        }
        raf = requestAnimationFrame(frame);
      }
      function resize() { size = api.fit(canvas, stage); draw(); }
      function onMove(e) {
        if (!size) return;
        var r = canvas.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        var next = -1, best = 16 * 16;
        trajHits.forEach(function (hit, i) {
          var d = (hit.x - x) * (hit.x - x) + (hit.y - y) * (hit.y - y);
          if (d < best) { best = d; next = i; }
        });
        if (next !== trajHover) {
          trajHover = next;
          canvas.style.cursor = next >= 0 ? "pointer" : "default";
          draw();
        }
      }
      function onLeave() {
        if (trajHover !== -1) { trajHover = -1; canvas.style.cursor = "default"; draw(); }
      }
      function nextLayer() {
        var base = raf ? (queue.length ? queue[queue.length - 1] : state.to) : state.step;
        var next = Math.min(4, base + 1);
        if (next <= base) return false;
        if (raf) queue.push(next);
        else animate(next);
        updateReadout();
        return true;
      }
      stepBtn.addEventListener("click", nextLayer);
      resetBtn.addEventListener("click", function () {
        queue = [];
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        animate(0);
      });
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);
      window.addEventListener("resize", resize);
      var ro = null;
      if (window.ResizeObserver) {
        ro = new ResizeObserver(function () { resize(); });
        ro.observe(stage);
      }
      resize();
      requestAnimationFrame(function () { if (size && size.w > 1) resize(); });
      updateReadout();
      return {
        cleanup: function () {
          if (raf) cancelAnimationFrame(raf);
          if (ro) ro.disconnect();
          canvas.removeEventListener("pointermove", onMove);
          canvas.removeEventListener("pointerleave", onLeave);
          window.removeEventListener("resize", resize);
        },
        next: nextLayer,
        // HARD RULE (4/5): done only after layer 4 with no running animation
        // and no queued layer left.
        isDone: function () { return !raf && queue.length === 0 && state.step >= 4; },
        hasNext: function () {
          var end = raf ? (queue.length ? queue[queue.length - 1] : state.to) : state.step;
          return end < 4;
        },
        reset: function () { queue = []; if (raf) cancelAnimationFrame(raf); raf = 0; animate(0); }
      };
    }
    function renderDetail() {
      var page = pages[index];
      var b = page.block;
      var sub = page.sub;
      var stage = page.blockIndex + 1;
      syncSubMarker(sub);
      var kicker = (DE ? "Station " : "Station ") + stage + " / " + blocks.length + (sub ? " · " + esc(sub.title) : "");
      var html = '<div class="ls-bs-kicker">' + kicker + '</div>';
      if (sub) {
        var leadClass = sub.lead ? ' class="ls-bs-lead"' : '';
        var subText = String(sub.text).split(/\n{2,}/).map(function (chunk) { return '<p' + leadClass + '>' + inlineMathText(chunk) + '</p>'; }).join('');
        var subCanvas = '<div class="ls-bs-subcanvas"><canvas data-mini="' + (sub.mini || "ffn") + '"></canvas></div>';
        html += '<h3 class="ls-bs-title">' + esc(sub.title) + '</h3>' +
          '<div class="ls-bs-sub ls-bs-sub--wide">' + (sub.lead ? subText + subCanvas : subCanvas + subText) + '</div>';
      } else {
        html += '<h3 class="ls-bs-title">' + esc(b.title) + '</h3>' +
          '<p class="ls-bs-body">' + inlineMathText(b.body) + '</p>' +
          '<div class="ls-bs-points">' + b.points.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join("") + '</div>';
        if (b.id === "transformer") {
          html += '<div class="ls-bs-traj" data-traj-host>' +
            '<div class="ls-bs-traj-head"><b>' + (DE ? "Denken = Punkte verschieben" : "Thinking = moving points") + '</b><span>' + (DE ? "Jede Schicht verschiebt den Token-Vektor neu." : "Every layer moves the token vector again.") + '</span></div>' +
            '<div class="ls-bs-traj-stage"><canvas class="ls-bs-traj-canvas" role="img"></canvas></div>' +
            '<div class="ls-bs-traj-bar"><button type="button" class="ls-btn ls-btn--tiny ls-bs-traj-step">' + (DE ? "Nächste Schicht" : "Next layer") + '</button><button type="button" class="ls-btn ls-btn--tiny ls-bs-traj-reset">' + (DE ? "Zurücksetzen" : "Reset") + '</button><span class="ls-bs-traj-readout" aria-live="polite"></span></div>' +
            '<p class="ls-bs-traj-note">' + (DE ? "Vereinfachte 2D-Trajektorie wie im Transformer-Labor: Jeder Punkt ist ein Token-Vektor; die Linie zeigt seinen Weg durch die Schichten. Fiktives Beispiel, keine Messung." : "Simplified 2D trajectory as in the transformer lab: each point is a token vector; the line shows its path through the layers. Fictional example, not a measurement.") + '</p>' +
          '</div>';
        }
      }
      if (sub) {
        // Sub-page detail is already rendered above.
      } else if (b.id === "data") {
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
          '<span class="ls-syn-comment">&lt;!-- … over 1 MB HTML … --&gt;</span>' +
          '</code></pre></div>' +
          '<div class="ls-bs-book">' +
          '<div class="ls-bs-book-head">' + (DE ? "… danach: ein Buchtext aus dem Korpus" : "… then: a book text from the corpus") + '</div>' +
          '<p class="ls-bs-book-title">' + (DE ? "Also sprach Zarathustra. Ein Buch für Alle und Keinen." : "Thus Spoke Zarathustra. A Book for All and None.") + '</p>' +
          '<p class="ls-bs-book-quote">' + (DE ? "„Man muss noch Chaos in sich haben, um einen tanzenden Stern gebären zu können.“" : "“One must still have chaos in oneself to be able to give birth to a dancing star.”") + '</p>' +
          '<p class="ls-bs-book-src">' + (DE ? "Friedrich Nietzsche, 1883 · " : "Friedrich Nietzsche, 1883 · ") + '<a href="' + (DE ? "https://www.gutenberg.org/ebooks/7205" : "https://www.gutenberg.org/ebooks/1998") + '" target="_blank" rel="noopener">Project Gutenberg</a></p>' +
          '</div>' +
          '<p class="ls-bs-html-note">' + (DE ? "Die echte Seite ist über ein Megabyte groß. Das Modell sieht nicht „den Artikel“, sondern eine sehr lange Folge von Zeichen, Tags und Text. Zwischen dem HTML und dem Buch liegt eine Auslassung: Der Korpus enthält beides." : "The real page is over a megabyte. The model does not see “the article”, but a very long sequence of characters, tags, and text. Between the HTML and the book sits an omission: the corpus contains both.") + '</p>';
      } else if (b.position) {
        html += '<div class="ls-bs-position-full" data-position-host></div>' +
          '<p class="ls-bs-traj-caption">' + (DE ? "Die Kugel zeigt mögliche Positionskodierungen. Bewege die Position und drehe die Ansicht; der Punkt wandert auf der Kugel." : "The sphere shows possible position encodings. Move the position and rotate the view; the point moves on the sphere.") + '</p>';
      } else if (b.sub) {
        // The overview signpost is already rendered above; sub-pages follow.
      } else {
        html += '<div class="ls-bs-canvas-wrap' + (b.mini === "unembed" ? " ls-bs-canvas-wrap--unembed" : "") + '"><canvas data-mini="' + b.mini + '"></canvas></div>';
      }
      if (!sub && b.mini === "unembed") {
        html += '<p class="ls-bs-traj-caption">' + (DE ? "Der Output-Vektor des LLM ist der letzte Vektor des letzten Tokens in der letzten Schicht. Der gesamte Kontext ist über viele Schichten und Heads hineingemischt. Die Pfeile sind gelernte Token-Richtungen aus W_U; in dieser schematischen Ansicht entscheidet der Kosinus zu diesem Vektor, im echten Logit zählt auch die Länge." : "The output vector of the LLM is the final vector of the last token in the last layer. The entire context has been mixed into it through many layers and heads. The arrows are learned token directions from W_U; in this schematic view the cosine to this vector decides, while the real logit also includes length.") + '</p>';
      }
      var sources = sub && sub.sources ? sub.sources : (b.sources || (b.source ? [b.source] : []));
      if (sources.length) {
        html += '<p class="ls-bs-source">' + (DE ? (sources.length > 1 ? "Quellen: " : "Quelle: ") : (sources.length > 1 ? "Sources: " : "Source: ")) +
          sources.map(function (source) {
            return '<a href="' + esc(source.url) + '" target="_blank" rel="noopener">' + esc(source.label) + '</a>';
          }).join(" · ") + '</p>';
      }
      if (positionDemo) { try { positionDemo.destroy(); } catch (e) {} positionDemo = null; }
      if (trajApi) { try { trajApi.cleanup(); } catch (e) {} trajApi = null; }
      detail.innerHTML = html;
      if (window.TM && typeof window.TM.typesetMath === "function") { try { window.TM.typesetMath(detail); } catch (e) {} }
      if (!sub && b.id === "transformer") trajApi = setupTrajectoryDemo();
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
      progress.textContent = (DE ? "Station " : "Station ") + stage + " / " + blocks.length + (sub ? " · " + sub.title : "");
      prevBtn.disabled = index === 0;
      nextBtn.textContent = index === pages.length - 1 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
      stack.querySelectorAll(".ls-bs-card").forEach(function (btn) {
        btn.classList.toggle("is-on", parseInt(btn.getAttribute("data-index"), 10) === page.blockIndex);
      });
      requestAnimationFrame(drawMinis);
    }
    function onResize() { drawMinis(); }
    function setIndex(i) {
      index = Math.max(0, Math.min(pages.length - 1, i));
      renderDetail();
    }
    function onTransformerOverview() {
      var page = pages[index];
      return !!(page && !page.sub && page.block && page.block.id === "transformer");
    }
    function trajectoryBlocking() {
      // HARD RULE (3/5): the visible step button is authoritative. While it is
      // enabled, Next must step the trajectory, never leave the page.
      if (!trajApi || !onTransformerOverview()) return false;
      var btn = detail.querySelector(".ls-bs-traj-step");
      if (btn && !btn.disabled) return true;
      return !trajApi.isDone();
    }
    function nextInternal() {
      // HARD RULE (1/5): a direct internal advance is also blocked until the
      // trajectory has reached the last layer and the button is greyed out.
      if (trajectoryBlocking()) { trajApi.next(); return true; }
      if (index < pages.length - 1) { setIndex(index + 1); return true; }
      return false;
    }
    function prevInternal() {
      if (index > 0) { setIndex(index - 1); return true; }
      return false;
    }
    function nextBlock() {
      var cur = pages[index] ? pages[index].blockIndex : 0;
      if (cur >= blocks.length - 1) return false;
      setIndex(blockStartPage(cur + 1));
      return true;
    }
    function prevBlock() {
      var cur = pages[index] ? pages[index].blockIndex : 0;
      if (cur <= 0) return false;
      setIndex(blockStartPage(cur - 1));
      return true;
    }
    buildStack();
    renderDetail();
    prevBtn.addEventListener("click", function () { if (!prevInternal()) api.goPrev(); });
    nextBtn.addEventListener("click", function () { if (!nextInternal()) api.goNext(); });
    window.addEventListener("resize", onResize);
    window.addEventListener("tm:theme", function () { C = api.colors(); renderDetail(); });
    return {
      update: function (s) {
        if (!s || s.resetKey === undefined || s.resetKey === resetKey) return;
        resetKey = s.resetKey;
        setIndex(typeof s.start === "number" ? blockStartPage(s.start) : 0);
      },
      next: function () {
        // HARD RULE (2/5): the public Next (button, arrow key, LearnSys.next)
        // uses this guard, so it cannot bypass the step button.
        if (trajectoryBlocking()) { trajApi.next(); return true; }
        return nextInternal();
      },
      prev: prevInternal,
      hasNext: function () {
        // HARD RULE (3/5): keep Next enabled while the trajectory is unfinished.
        if (trajectoryBlocking()) return true;
        return index < pages.length - 1;
      },
      hasPrev: function () { return index > 0; },
      nextFull: nextBlock,
      prevFull: prevBlock,
      onKey: function (e) {
        // HARD RULE (5/5): right arrow uses the same guarded path as Next.
        return api.util.arrowKey(e, function () {
          if (trajectoryBlocking()) { trajApi.next(); return true; }
          return nextInternal();
        }, prevInternal);
      },
      resize: function () { drawMinis(); },
      destroy: function () { lastBlocksIndex = index; if (positionDemo) { try { positionDemo.destroy(); } catch (e) {} positionDemo = null; } if (trajApi) { try { trajApi.cleanup(); } catch (e) {} trajApi = null; } window.removeEventListener("resize", onResize); el.remove(); }
    };
  }

  core.register("blocks", blocksScene);
})();
