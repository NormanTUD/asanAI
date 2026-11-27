(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;

  function agentRagScene(root, api) {
    var DE = api.lang === "de";
    var esc = api.esc;
    function L(de, en) { return DE ? de : en; }

    var THRESHOLD = 35;
    var STEPS = [
      L("Handy", "Phone"),
      L("Lexikon", "Lexicon"),
      L("Chunks", "Chunks"),
      L("Vektoren", "Vectors"),
      L("Kontext", "Context")
    ];

    var IMG = {
      colossal: api.asset("assets/kraken-colossal.jpg"),
      octopus: api.asset("assets/kraken-octopus.jpg")
    };

    var ARTICLE = {
      brand: L("BROCKHAUS", "BROCKHAUS"),
      series: L("Enzyklopädie · Band 12", "Encyclopædia · Volume 12"),
      page: "417",
      kicker: L("Octopoda · Kopffüßer", "Octopoda · cephalopods"),
      title: L("Krake", "Octopus"),
      lead: L("Kraken sind Kopffüßer mit acht Armen, drei Herzen und einem hochentwickelten Nervensystem. Ihre Haut wechselt Farbe und Struktur; ein großer Teil ihrer Neuronen sitzt in den Armen.", "Octopuses are cephalopods with eight arms, three hearts, and a highly developed nervous system. Their skin changes colour and texture; a large share of their neurons sits in the arms."),
      paragraphs: [
        {
          id: "C1", heading: L("Körperbau", "Body"), angle: 12,
          text: L("Der Krake (Octopus) ist ein Kopffüßer aus der Ordnung der Octopoda. Sein Körper besteht aus einem sackförmigen Mantel und acht muskulösen Armen mit Saugnäpfen. Er besitzt drei Herzen und blaues Blut; seine Haut kann Farbe und Oberflächenstruktur in Sekunden verändern.", "The octopus (Octopus) is a cephalopod of the order Octopoda. Its body consists of a sac-like mantle and eight muscular arms with suckers. It has three hearts and blue blood; its skin can change colour and surface texture within seconds.")
        },
        {
          id: "C2", heading: L("Blut und Kreislauf", "Blood and circulation"), angle: 19,
          text: L("Zwei Kiemenherzen treiben das Blut durch die Kiemen, ein Körperherz versorgt den übrigen Körper. Beim Schwimmen pausiert das Körperherz zeitweise, weshalb Kraken häufig über den Meeresboden kriechen. Der Sauerstoffträger Hämocyanin enthält Kupfer und verleiht dem Blut seine bläuliche Farbe.", "Two gill hearts pump blood through the gills, while one body heart supplies the rest of the body. When swimming, the body heart pauses at times, which is why octopuses often crawl over the sea floor. The oxygen carrier hemocyanin contains copper and gives the blood its bluish colour.")
        },
        {
          id: "C3", heading: L("Nervensystem", "Nervous system"), angle: 52,
          text: L("Rund zwei Drittel der Neuronen eines Kraken liegen in den acht Armen. Jeder Arm verfügt über ein eigenes Nervennetz, und die Saugnäpfe können chemische Reize aufnehmen. Auf diese Weise prüft der Krake seine Umgebung, ohne den ganzen Körper bewegen zu müssen.", "About two thirds of an octopus's neurons lie in its eight arms. Each arm has its own nerve net, and the suckers can detect chemical stimuli. In this way the octopus examines its surroundings without moving its whole body.")
        },
        {
          id: "C4", heading: L("Tarnung", "Camouflage"), angle: 64,
          text: L("Chromatophoren, Iridophoren und Papillen ermöglichen schnelle Farb- und Texturwechsel. Kraken gelten als neugierig und lernfähig; sie lösen einfache Probleme und nutzen Höhlen oder Schalen als Versteck. Ihre Tarnung zählt zu den vielseitigsten im Tierreich.", "Chromatophores, iridophores, and papillae allow rapid changes of colour and texture. Octopuses are considered curious and capable learners; they solve simple problems and use caves or shells as shelter. Their camouflage is one of the most versatile in the animal kingdom.")
        },
        {
          id: "C5", heading: L("Mythos und Forschung", "Myth and research"), angle: 44,
          text: L("Der colossale Polyp des Pierre Denys de Montfort (1801) illustriert die Seefahrerlegende von riesigen Kraken, die Schiffe umgreifen; die Darstellung ist keine zoologische Beobachtung. Neuere Arbeiten untersuchen RNA-Editing in Nervenzellen sowie die Mechanismen der strukturellen Färbung. Die Fakten dieses Artikels stützen sich auf die Fachliteratur.", "Pierre Denys de Montfort's colossal polyp (1801) illustrates the sailors' legend of giant krakens that could grasp ships; the image is not a zoological observation. Recent research examines RNA editing in nerve cells and the mechanisms of structural coloration. The facts in this article rest on the specialist literature.")
        }
      ]
    };

    var QUESTION = L("Wie viele Herzen hat ein Krake?", "How many hearts does an octopus have?");
    var ANSWER = L("Ein Krake hat drei Herzen: zwei Kiemenherzen und ein Körperherz.", "An octopus has three hearts: two gill hearts and one body heart.");
    var SELECTED = ["C1", "C2"];

    function chunkById(id) {
      return ARTICLE.paragraphs.filter(function (p) { return p.id === id; })[0] || null;
    }
    function fits(p) { return p.angle <= THRESHOLD; }
    function vectorValues(p, n) {
      var seed = 0;
      for (var k = 0; k < p.id.length; k++) seed += p.id.charCodeAt(k) * (k + 3);
      var out = [];
      for (var i = 0; i < n; i++) {
        var v = Math.sin((seed + i * 37) * 0.017) * 0.5 + Math.sin((seed + i * 11) * 0.071) * 0.5;
        out.push(Math.max(-1, Math.min(1, v)));
      }
      return out;
    }
    function vectorColor(v) {
      if (v < -0.45) return "#0b4f6c";
      if (v < -0.12) return "#2d8fae";
      if (v <= 0.12) return "#eef2ef";
      if (v <= 0.45) return "#8fbf5a";
      return "#c8a24a";
    }
    function vectorHTML(p, cls) {
      var values = vectorValues(p, 14);
      var cells = values.map(function (v) {
        return '<i style="background:' + vectorColor(v) + '"></i>';
      }).join("");
      return '<span class="ls-rag-vector ' + (cls || "") + '" aria-hidden="true">' + cells + '</span>';
    }

    function figureHTML(kind) {
      if (kind === "colossal") {
        return '<figure class="ls-rag-fig ls-rag-fig--old"><img src="' + esc(IMG.colossal) + '" alt="' + esc(L("Historische Darstellung eines kolossalen Polypen, der ein Schiff umgreift.", "Historical depiction of a colossal polyp grasping a ship.")) + '" loading="lazy"><figcaption><b>' + esc(L("Le Poulpe Colossal", "Le Poulpe Colossal")) + '</b> ' +
          esc(L("Pierre Denys de Montfort, 1801. Public domain.", "Pierre Denys de Montfort, 1801. Public domain.")) + ' <a href="https://commons.wikimedia.org/wiki/File:Le_Poulpe_Colossal.jpg" target="_blank" rel="noopener">Commons</a></figcaption></figure>';
      }
      return '<figure class="ls-rag-fig ls-rag-fig--photo"><img src="' + esc(IMG.octopus) + '" alt="' + esc(L("Riesenkrake im Wasser.", "Giant Pacific octopus in the water.")) + '" loading="lazy"><figcaption><b>' + esc(L("Riesenkrake", "Giant Pacific octopus")) + '</b> ' +
        esc(L("Foto: canopic, CC BY-NC-ND 2.0.", "Photo: canopic, CC BY-NC-ND 2.0.")) + ' <a href="https://www.flickr.com/photos/canopic/7882355920" target="_blank" rel="noopener">Flickr</a> · <a href="https://creativecommons.org/licenses/by-nc-nd/2.0/" target="_blank" rel="noopener">Lizenz</a></figcaption></figure>';
    }

    function pdfHTML() {
      var c1 = chunkById("C1"), c2 = chunkById("C2"), c3 = chunkById("C3"), c4 = chunkById("C4"), c5 = chunkById("C5");
      return '<div class="ls-rag-pdf">' +
        '<header class="ls-rag-pdf-head"><span class="ls-rag-pdf-brand">' + esc(ARTICLE.brand) + '</span><span class="ls-rag-pdf-series">' + esc(ARTICLE.series) + '</span><span class="ls-rag-pdf-page">' + esc(ARTICLE.page) + '</span></header>' +
        '<div class="ls-rag-pdf-title"><span>' + esc(ARTICLE.kicker) + '</span><h2>' + esc(ARTICLE.title) + '</h2></div>' +
        '<div class="ls-rag-pdf-grid">' +
          '<div class="ls-rag-pdf-col">' +
            figureHTML("colossal") +
            '<p class="ls-rag-lead">' + esc(ARTICLE.lead) + '</p>' +
            '<h3>' + esc(c1.heading) + '</h3><p>' + esc(c1.text) + '</p>' +
            '<h3>' + esc(c2.heading) + '</h3><p>' + esc(c2.text) + '</p>' +
          '</div>' +
          '<div class="ls-rag-pdf-col">' +
            '<h3>' + esc(c3.heading) + '</h3><p>' + esc(c3.text) + '</p>' +
            figureHTML("octopus") +
            '<h3>' + esc(c4.heading) + '</h3><p>' + esc(c4.text) + '</p>' +
            '<h3>' + esc(c5.heading) + '</h3><p>' + esc(c5.text) + '</p>' +
          '</div>' +
        '</div>' +
        '<footer class="ls-rag-pdf-foot"><span>' + esc(L("Brockhaus · Enzyklopädie", "Brockhaus · Encyclopædia")) + '</span><span>' + esc(L("Krake · Seite 417", "Octopus · page 417")) + '</span></footer>' +
      '</div>';
    }

    function chunkCardsHTML() {
      return ARTICLE.paragraphs.map(function (p) {
        return '<article class="ls-rag-chunk" data-c="' + p.id + '"><header><span>' + p.id + '</span><b>' + esc(p.heading) + '</b><em>' + esc(L("Text", "text")) + '</em></header><p>' + esc(p.text) + '</p></article>';
      }).join("");
    }

    function embedRowsHTML() {
      return ARTICLE.paragraphs.map(function (p) {
        return '<div class="ls-rag-embed-row" data-c="' + p.id + '"><span class="ls-rag-embed-id">' + p.id + '</span><p>' + esc(p.text) + '</p><span class="ls-rag-embed-arrow">→</span>' + vectorHTML(p, "is-embed") + '<b class="ls-rag-embed-vec">v' + p.id.slice(1) + '</b></div>';
      }).join("");
    }

    function scanSVG() {
      var ox = 34, oy = 128, r = 92;
      var pts = [[ox, oy]];
      for (var a = 0; a <= THRESHOLD; a += 2.5) {
        pts.push([ox + Math.cos(a * Math.PI / 180) * r, oy - Math.sin(a * Math.PI / 180) * r]);
      }
      var sector = "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L") + " Z";
      var svg = '<svg class="ls-rag-angle-svg" viewBox="0 0 300 168" role="img" aria-label="' + esc(L("Winkel der Chunks zum aktuellen Kontext; unter 35 Grad passen sie.", "Chunk angles to the current context; below 35 degrees they fit.")) + '">' +
        '<path class="ls-rag-sector" d="' + sector + '"/>' +
        '<line class="ls-rag-axis" x1="' + ox + '" y1="' + (oy + 6) + '" x2="' + (ox + r + 36) + '" y2="' + (oy + 6) + '"/>' +
        '<line class="ls-rag-axis" x1="' + ox + '" y1="' + (oy + 6) + '" x2="' + ox + '" y2="' + (oy - r - 10) + '"/>' +
        '<line class="ls-rag-context-vec" x1="' + ox + '" y1="' + oy + '" x2="' + (ox + r + 26) + '" y2="' + oy + '"/>' +
        '<path class="ls-rag-context-head" d="M' + (ox + r + 26) + ' ' + oy + ' l -9 -4 l 0 8 z"/>' +
        '<text class="ls-rag-svg-label is-context" x="' + (ox + r + 22) + '" y="' + (oy + 16) + '" text-anchor="end">' + esc(L("Kontext", "context")) + '</text>';
      ARTICLE.paragraphs.forEach(function (p) {
        var ang = p.angle * Math.PI / 180;
        var x = ox + Math.cos(ang) * r, y = oy - Math.sin(ang) * r;
        var fit = fits(p);
        var anchor = Math.cos(ang) >= 0 ? "start" : "end";
        var lx = x + (Math.cos(ang) >= 0 ? 7 : -7);
        var ly = y - 5 + (p.id === "C4" ? 12 : 0);
        svg += '<line class="ls-rag-chunk-vec' + (fit ? " is-fit" : "") + '" x1="' + ox + '" y1="' + oy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' +
          '<circle class="ls-rag-chunk-dot' + (fit ? " is-fit" : "") + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (fit ? 4.4 : 3.2) + '"/>' +
          '<text class="ls-rag-chunk-label' + (fit ? " is-fit" : "") + '" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="' + anchor + '">' + p.id + ' · ' + p.angle + '°</text>';
      });
      svg += '<text class="ls-rag-svg-label is-threshold" x="' + (ox + 58) + '" y="' + (oy - 58) + '">35°</text></svg>';
      return svg;
    }

    var el = document.createElement("div");
    el.className = "ls-rag";
    el.innerHTML =
      '<div class="ls-rag-top">' +
        '<span class="ls-rag-badge">RAG</span>' +
        '<div class="ls-rag-steps" aria-hidden="true">' + STEPS.map(function (s, i) {
          return '<span data-step="' + i + '"><i></i>' + esc(s) + '</span>' + (i < STEPS.length - 1 ? '<em>›</em>' : '');
        }).join("") + '</div>' +
        '<span class="ls-rag-progress"></span>' +
      '</div>' +
      '<div class="ls-rag-stage">' +
        '<div class="ls-rag-layer ls-rag-phone-layer">' +
          '<aside class="ls-rag-scan">' +
            '<div class="ls-rag-scan-kicker"><span>🔒</span>' + esc(L("Nur Modell · für den Nutzer unsichtbar", "Model only · invisible to the user")) + '</div>' +
            '<h3>' + esc(L("Winkel zum aktuellen Kontext", "Angles to the current context")) + '</h3>' +
            '<div class="ls-rag-scan-svg"></div>' +
            '<div class="ls-rag-scan-list"></div>' +
            '<div class="ls-rag-context-slot"><div class="ls-rag-context-head"><span>🔒</span>' + esc(L("Unsichtbarer Kontext", "Invisible context")) + '</div><div class="ls-rag-context-body"><span class="ls-rag-context-empty">' + esc(L("Noch kein Chunk im Kontext.", "No chunk in the context yet.")) + '</span></div></div>' +
          '</aside>' +
          '<div class="ls-rag-phone-wrap">' +
            '<div class="ls-rag-phone">' +
              '<div class="ls-rag-phone-notch"></div>' +
              '<div class="ls-rag-phone-screen">' +
                '<div class="ls-rag-appbar"><span>KI-Chat</span><i></i></div>' +
                '<div class="ls-rag-thread">' +
                  '<div class="ls-rag-empty">' + esc(L("Lade kraken.pdf hoch, um aus dem Buch zu antworten.", "Upload kraken.pdf to answer from the book.")) + '</div>' +
                  '<div class="ls-rag-filemsg" hidden><span class="ls-rag-user">' + esc(L("Du", "You")) + '</span><span class="ls-rag-bubble ls-rag-filebubble"><span class="ls-rag-pdficon">PDF</span><span><b>kraken.pdf</b><small>' + esc(L("5 Absätze · Lexikon", "5 paragraphs · lexicon")) + '</small></span></span></div>' +
                  '<div class="ls-rag-questionmsg" hidden><span class="ls-rag-user">' + esc(L("Du", "You")) + '</span><span class="ls-rag-bubble">' + esc(QUESTION) + '</span></div>' +
                  '<div class="ls-rag-aimsg" hidden><span class="ls-rag-user">LLM</span><span class="ls-rag-bubble ls-rag-answer"></span><span class="ls-rag-typing" aria-hidden="true"><i></i><i></i><i></i></span></div>' +
                '</div>' +
                '<div class="ls-rag-compose"><button type="button" class="ls-rag-attach" aria-label="' + esc(L("kraken.pdf anhängen", "Attach kraken.pdf")) + '">📎</button><span>' + esc(L("Nachricht", "Message")) + '</span><i></i></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ls-rag-layer ls-rag-pdf-layer">' + pdfHTML() + '</div>' +
        '<div class="ls-rag-layer ls-rag-chunk-layer">' +
          '<div class="ls-rag-chunk-head"><div><span class="ls-rag-kicker">' + esc(L("Nur Text wird gechunkt", "Only text is chunked")) + '</span><h3>' + esc(L("Der Artikel zerfällt in fünf Abschnitte", "The article breaks into five sections")) + '</h3></div><span class="ls-rag-noimg">' + esc(L("Bilder bleiben außen vor", "Images stay outside")) + '</span></div>' +
          '<div class="ls-rag-chunk-grid">' + chunkCardsHTML() + '</div>' +
          '<div class="ls-rag-chunk-cut"><i></i><span>' + esc(L("Schnittkanten an Absatzgrenzen", "Cut lines at paragraph boundaries")) + '</span><i></i></div>' +
        '</div>' +
        '<div class="ls-rag-layer ls-rag-embed-layer">' +
          '<div class="ls-rag-embed-core"><span class="ls-rag-core-glow"></span><span class="ls-rag-kicker">Embedding-Modell</span><b>embed(chunk)</b><small>' + esc(L("Transformer · ohne Causal Mask", "Transformer · without a causal mask")) + '</small><span class="ls-rag-core-down">↓</span></div>' +
          '<div class="ls-rag-embed-list">' + embedRowsHTML() + '</div>' +
          '<details class="ls-rag-note"><summary><span>' + esc(L("Was macht das Embedding-Modell?", "What does the embedding model do?")) + '</span><i>' + esc(L("optional", "optional")) + '</i></summary><p>' + esc(L("Das Embedding-Modell ist ein Transformer ohne Causal Mask. Es darf den ganzen Chunk auf einmal lesen und nutzt im Prinzip dieselben Gewichte wie das Sprachmodell; es sagt aber nicht das nächste Token voraus, sondern liefert einen Vektor pro Chunk.", "The embedding model is a transformer without a causal mask. It can read the whole chunk at once and in principle uses the same weights as the language model; it does not predict the next token, but returns one vector per chunk.")) + '</p></details>' +
        '</div>' +
        '<div class="ls-rag-veil"></div>' +
      '</div>' +
      '<div class="ls-rag-bottom"><span class="ls-rag-status"></span><button type="button" class="ls-btn ls-btn--tiny ls-rag-next"></button><button type="button" class="ls-btn ls-btn--tiny ls-rag-reset">' + esc(L("Zurücksetzen", "Reset")) + '</button></div>';

    root.appendChild(el);

    var stage = el.querySelector(".ls-rag-stage");
    var veil = el.querySelector(".ls-rag-veil");
    var stepsEl = el.querySelectorAll(".ls-rag-steps span");
    var progressEl = el.querySelector(".ls-rag-progress");
    var statusEl = el.querySelector(".ls-rag-status");
    var nextBtn = el.querySelector(".ls-rag-next");
    var resetBtn = el.querySelector(".ls-rag-reset");
    var attachBtn = el.querySelector(".ls-rag-attach");
    var emptyEl = el.querySelector(".ls-rag-empty");
    var fileMsg = el.querySelector(".ls-rag-filemsg");
    var questionMsg = el.querySelector(".ls-rag-questionmsg");
    var aiMsg = el.querySelector(".ls-rag-aimsg");
    var answerEl = el.querySelector(".ls-rag-answer");
    var typingEl = el.querySelector(".ls-rag-typing");
    var scanSVGEl = el.querySelector(".ls-rag-scan-svg");
    var scanListEl = el.querySelector(".ls-rag-scan-list");
    var contextBody = el.querySelector(".ls-rag-context-body");
    var scanEl = el.querySelector(".ls-rag-scan");
    var phoneLayer = el.querySelector(".ls-rag-phone-layer");
    var chunkLayer = el.querySelector(".ls-rag-chunk-layer");
    var pdfLayer = el.querySelector(".ls-rag-pdf-layer");

    var state = { step: 0, timers: [] };

    function clearTimers() {
      state.timers.forEach(function (id) { clearTimeout(id); });
      state.timers = [];
    }

    function renderScan() {
      scanSVGEl.innerHTML = scanSVG();
      scanListEl.innerHTML = ARTICLE.paragraphs.map(function (p) {
        var fit = fits(p);
        return '<div class="ls-rag-scan-row' + (fit ? " is-fit" : "") + '" data-c="' + p.id + '"><b>' + p.id + '</b><span>' + p.angle + '°</span><em>' + esc(fit ? L("passt", "fits") : L("verworfen", "discarded")) + '</em></div>';
      }).join("");
      contextBody.innerHTML = '<span class="ls-rag-context-empty">' + esc(L("Noch kein Chunk im Kontext.", "No chunk in the context yet.")) + '</span>';
    }

    function insertContext() {
      var cards = SELECTED.map(function (id) {
        var p = chunkById(id);
        return '<div class="ls-rag-ctx-card" data-c="' + id + '"><b>' + id + '</b><span>' + esc(p.heading) + '</span><p>' + esc(p.text) + '</p></div>';
      }).join("");
      contextBody.innerHTML = cards;
      Array.prototype.forEach.call(contextBody.querySelectorAll(".ls-rag-ctx-card"), function (card) {
        requestAnimationFrame(function () { card.classList.add("is-in"); });
      });
      Array.prototype.forEach.call(scanListEl.querySelectorAll(".ls-rag-scan-row.is-fit"), function (row) {
        row.classList.add("is-in");
      });
    }

    function showAnswer() {
      typingEl.hidden = true;
      answerEl.innerHTML = esc(ANSWER) + ' <span class="ls-rag-cite">[C1]</span><span class="ls-rag-cite">[C2]</span>';
    }

    function setChat() {
      var atEnd = state.step === 4;
      emptyEl.hidden = atEnd;
      fileMsg.hidden = !atEnd;
      questionMsg.hidden = !atEnd;
      aiMsg.hidden = !atEnd;
      typingEl.hidden = true;
      answerEl.textContent = "";
      if (atEnd) {
        typingEl.hidden = false;
        answerEl.innerHTML = '<span class="ls-rag-partial">' + esc(L("Ein Krake hat …", "An octopus has …")) + '</span>';
      }
    }

    function scheduleContext() {
      clearTimers();
      state.timers.push(setTimeout(function () { insertContext(); }, 520));
      state.timers.push(setTimeout(function () { showAnswer(); }, 1180));
    }

    function applyStep() {
      el.setAttribute("data-step", String(state.step));
      el.classList.toggle("is-scan", state.step === 4);
      Array.prototype.forEach.call(stepsEl, function (s, i) {
        s.classList.toggle("is-on", i === state.step);
        s.classList.toggle("is-done", i < state.step);
      });
      progressEl.textContent = (state.step + 1) + " / " + STEPS.length;
      scanEl.setAttribute("aria-hidden", state.step === 4 ? "false" : "true");
      setChat();
      if (state.step === 4) {
        renderScan();
        scheduleContext();
      } else {
        clearTimers();
      }
      statusEl.textContent = state.step === 0
        ? L("Die Datei liegt außerhalb des Modells. Drücke Weiter, um in das Lexikon zu zoomen.", "The file sits outside the model. Press Next to zoom into the lexicon.")
        : state.step === 1
          ? L("Zoom ins Lexikon. Die Bildtafeln bleiben außen vor; gechunkt wird nur der Text.", "Zoom into the lexicon. The plates stay outside; only the text is chunked.")
          : state.step === 2
            ? L("Der Text zerfällt an Absatzgrenzen in fünf Chunks mit Füllwörtern und Kontext.", "The text breaks at paragraph boundaries into five chunks with filler words and context.")
            : state.step === 3
              ? L("Jeder Chunk läuft durch das Embedding-Modell und kommt als eigener Vektor heraus.", "Each chunk runs through the embedding model and comes out as its own vector.")
              : L("Der Agent prüft unsichtbar die Winkel. C1 und C2 liegen unter 35° und wandern still in den Kontext.", "The agent checks the angles invisibly. C1 and C2 lie below 35° and move silently into the context.");
      nextBtn.textContent = state.step < 4
        ? L("Weiter: " + STEPS[state.step + 1], "Next: " + STEPS[state.step + 1])
        : L("Neu starten", "Restart");
    }

    function go(step) {
      var next = Math.max(0, Math.min(4, step));
      if (next === state.step) return false;
      clearTimers();
      state.step = next;
      veil.classList.remove("is-flash");
      void veil.offsetWidth;
      veil.classList.add("is-flash");
      state.timers.push(setTimeout(function () { veil.classList.remove("is-flash"); }, 380));
      applyStep();
      return true;
    }

    nextBtn.addEventListener("click", function () {
      if (state.step < 4) go(state.step + 1);
      else go(0);
    });
    resetBtn.addEventListener("click", function () { go(0); });
    attachBtn.addEventListener("click", function () { go(1); });

    applyStep();

    return {
      update: function () { go(0); },
      next: function () {
        if (state.step < 4) { go(state.step + 1); return true; }
        return false;
      },
      prev: function () {
        if (state.step > 0) { go(state.step - 1); return true; }
        return false;
      },
      hasNext: function () { return state.step < 4; },
      hasPrev: function () { return state.step > 0; },
      resize: function () {},
      destroy: function () { clearTimers(); el.remove(); }
    };
  }

  core.register("agentrag", agentRagScene);
})();
