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
      L("Datei", "File"),
      L("Scan", "Scan"),
      L("Frage", "Question"),
      L("Winkel", "Angles")
    ];

    var IMG = {
      colossal: api.asset("assets/kraken-colossal.jpg"),
      octopus: api.asset("assets/kraken-octopus.jpg")
    };

    var ARTICLE = {
      brand: L("Enzyklopädie", "Encyclopædia"),
      series: L("Meereskunde · Band 12", "Marine life · Volume 12"),
      page: "417",
      kicker: L("Octopoda · Kopffüßer", "Octopoda · cephalopods"),
      title: L("Krake", "Octopus"),
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
    function vectorText(p) {
      return vectorValues(p, 4).map(function (v) {
        return (v >= 0 ? " " : "") + v.toFixed(2);
      }).join(", ") + ", …";
    }
    function vectorStrip(p) {
      return vectorValues(p, 10).map(function (v) {
        return '<i style="background:' + vectorColor(v) + '"></i>';
      }).join("");
    }

    function figureHTML(kind) {
      if (kind === "colossal") {
        return '<figure class="ls-rag-fig ls-rag-fig--old"><img src="' + esc(IMG.colossal) + '" alt="' + esc(L("Historische Darstellung eines kolossalen Polypen, der ein Schiff umgreift.", "Historical depiction of a colossal polyp grasping a ship.")) + '"><figcaption><b>Le Poulpe Colossal</b> ' +
          esc(L("Pierre Denys de Montfort, 1801. Public domain.", "Pierre Denys de Montfort, 1801. Public domain.")) + ' <a href="https://commons.wikimedia.org/wiki/File:Le_Poulpe_Colossal.jpg" target="_blank" rel="noopener">Commons</a></figcaption></figure>';
      }
      return '<figure class="ls-rag-fig ls-rag-fig--photo"><img src="' + esc(IMG.octopus) + '" alt="' + esc(L("Riesenkrake im Wasser.", "Giant Pacific octopus in the water.")) + '"><figcaption><b>' + esc(L("Riesenkrake", "Giant Pacific octopus")) + '</b> ' +
        esc(L("Foto: canopic, CC BY-NC-ND 2.0.", "Photo: canopic, CC BY-NC-ND 2.0.")) + ' <a href="https://www.flickr.com/photos/canopic/7882355920" target="_blank" rel="noopener">Flickr</a> · <a href="https://creativecommons.org/licenses/by-nc-nd/2.0/" target="_blank" rel="noopener">Lizenz</a></figcaption></figure>';
    }

    function pdfHTML() {
      var c1 = chunkById("C1"), c2 = chunkById("C2"), c3 = chunkById("C3"), c4 = chunkById("C4"), c5 = chunkById("C5");
      return '<div class="ls-rag-pdf">' +
        '<header class="ls-rag-pdf-head"><span class="ls-rag-pdf-brand">' + esc(ARTICLE.brand) + '</span><span class="ls-rag-pdf-series">' + esc(ARTICLE.series) + '</span><span class="ls-rag-pdf-page">' + esc(ARTICLE.page) + '</span></header>' +
        '<div class="ls-rag-pdf-title"><span>' + esc(ARTICLE.kicker) + '</span><h2>' + esc(ARTICLE.title) + '</h2></div>' +
        '<div class="ls-rag-pdf-body">' +
          '<div class="ls-rag-pdf-media">' + figureHTML("colossal") + figureHTML("octopus") + '</div>' +
          '<div class="ls-rag-pdf-col">' +
            '<section class="ls-rag-pdf-chunk" data-c="C1"><h3>' + esc(c1.heading) + '</h3><p>' + esc(c1.text) + '</p></section>' +
            '<section class="ls-rag-pdf-chunk" data-c="C2"><h3>' + esc(c2.heading) + '</h3><p>' + esc(c2.text) + '</p></section>' +
            '<section class="ls-rag-pdf-chunk" data-c="C3"><h3>' + esc(c3.heading) + '</h3><p>' + esc(c3.text) + '</p></section>' +
          '</div>' +
          '<div class="ls-rag-pdf-col">' +
            '<section class="ls-rag-pdf-chunk" data-c="C4"><h3>' + esc(c4.heading) + '</h3><p>' + esc(c4.text) + '</p></section>' +
            '<section class="ls-rag-pdf-chunk" data-c="C5"><h3>' + esc(c5.heading) + '</h3><p>' + esc(c5.text) + '</p></section>' +
          '</div>' +
        '</div>' +
        '<footer class="ls-rag-pdf-foot"><span>' + esc(L("Enzyklopädie · Meereskunde", "Encyclopædia · Marine life")) + '</span><span>' + esc(L("Simulation · fiktive Datei", "Simulation · fictional file")) + '</span><span>' + esc(L("Krake · Seite 417", "Octopus · page 417")) + '</span></footer>' +
      '</div>';
    }

    function railHTML() {
      return ARTICLE.paragraphs.map(function (p) {
        return '<div class="ls-rag-rail-row" data-c="' + p.id + '"><b>' + p.id + '</b><span class="ls-rag-rail-heading">' + esc(p.heading) + '</span><code>[' + esc(vectorText(p)) + ']</code><span class="ls-rag-rail-strip">' + vectorStrip(p) + '</span></div>';
      }).join("");
    }

    function angleSVG() {
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
        '<div class="ls-rag-doc">' +
          '<div class="ls-rag-doc-head"><span class="ls-rag-fileicon">PDF</span><div><b>kraken.pdf</b><small class="ls-rag-doc-status"></small></div><span class="ls-rag-doc-tag">' + esc(L("außerhalb des LLM", "outside the LLM")) + '</span></div>' +
          '<div class="ls-rag-doc-body">' +
            '<div class="ls-rag-pdf-wrap">' + pdfHTML() + '<div class="ls-rag-scanfx" aria-hidden="true"><i></i></div></div>' +
            '<div class="ls-rag-rail"><div class="ls-rag-rail-head">' + esc(L("Nur Text · Chunk-Vektoren", "Text only · chunk vectors")) + '</div><div class="ls-rag-rail-list">' + railHTML() + '</div></div>' +
            '<div class="ls-rag-angle-panel">' +
              '<div class="ls-rag-angle-head"><span>🔒</span><b>' + esc(L("Nur Modell · für den Nutzer unsichtbar", "Model only · invisible to the user")) + '</b><em>' + esc(L("Winkel zum aktuellen Kontext", "Angles to the current context")) + '</em></div>' +
              '<div class="ls-rag-angle-chart"></div>' +
              '<div class="ls-rag-angle-grid"><div class="ls-rag-angle-list"></div><div class="ls-rag-context-slot"><div class="ls-rag-context-head"><span>🔒</span>' + esc(L("Unsichtbarer Kontext", "Invisible context")) + '</div><div class="ls-rag-context-body"><span class="ls-rag-context-empty">' + esc(L("Noch kein Chunk im Kontext.", "No chunk in the context yet.")) + '</span></div></div></div>' +
              '<div class="ls-rag-angle-caption">' + esc(L("Der Check läuft bei jedem Token; der Nutzer sieht nur die Antwort.", "The check runs at every token; the user only sees the answer.")) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="ls-rag-doc-foot"><details class="ls-rag-note"><summary><span>' + esc(L("Was macht das Embedding-Modell?", "What does the embedding model do?")) + '</span><i>' + esc(L("optional", "optional")) + '</i></summary><p>' + esc(L("Das Embedding-Modell ist ein Transformer ohne Causal Mask. Es darf den ganzen Chunk auf einmal lesen und nutzt im Prinzip dieselben Gewichte wie das Sprachmodell; es sagt aber nicht das nächste Token voraus, sondern liefert einen Vektor pro Chunk.", "The embedding model is a transformer without a causal mask. It can read the whole chunk at once and in principle uses the same weights as the language model; it does not predict the next token, but returns one vector per chunk.")) + '</p></details></div>' +
        '</div>' +
        '<div class="ls-rag-phone-col">' +
          '<div class="ls-rag-phone">' +
            '<div class="ls-rag-phone-notch"></div>' +
            '<div class="ls-rag-phone-screen">' +
              '<div class="ls-rag-appbar"><span>KI-Chat</span><i></i></div>' +
              '<div class="ls-rag-thread">' +
                '<div class="ls-rag-empty">' + esc(L("Öffne eine Datei mit 📎.", "Open a file with 📎.")) + '</div>' +
                '<div class="ls-rag-filemsg" hidden><span class="ls-rag-user">' + esc(L("Du", "You")) + '</span><span class="ls-rag-bubble ls-rag-filebubble"><span class="ls-rag-pdficon">PDF</span><span><b>kraken.pdf</b><small class="ls-rag-file-status"></small></span></span></div>' +
                '<div class="ls-rag-questionmsg" hidden><span class="ls-rag-user">' + esc(L("Du", "You")) + '</span><span class="ls-rag-bubble">' + esc(QUESTION) + '</span></div>' +
                '<div class="ls-rag-aimsg" hidden><span class="ls-rag-user">LLM</span><span class="ls-rag-bubble ls-rag-answer"></span><span class="ls-rag-typing" aria-hidden="true"><i></i><i></i><i></i></span></div>' +
              '</div>' +
              '<div class="ls-rag-compose"><button type="button" class="ls-rag-attach" aria-label="' + esc(L("Datei öffnen", "Open a file")) + '">📎</button><span>' + esc(L("Nachricht", "Message")) + '</span><i></i></div>' +
              '<div class="ls-rag-picker" hidden>' +
                '<div class="ls-rag-picker-head"><b>' + esc(L("Datei auswählen", "Choose a file")) + '</b><span>PDF</span></div>' +
                '<div class="ls-rag-picker-list">' +
                  '<button type="button" class="ls-rag-pick" data-file="kraken"><span class="ls-rag-pdficon">PDF</span><span><b>kraken.pdf</b><small>' + esc(L("1,2 KB · Demo", "1.2 KB · demo")) + '</small></span><em>' + esc(L("öffnen", "open")) + '</em></button>' +
                  '<button type="button" class="ls-rag-pick is-muted" data-file="zen"><span class="ls-rag-pdficon">PDF</span><span><b>' + esc(L("Zen und die Kunst, ein Motorrad zu warten.pdf", "Zen and the Art of Motorcycle Maintenance.pdf")) + '</b><small>4,1 MB</small></span></button>' +
                  '<button type="button" class="ls-rag-pick is-muted" data-file="hott"><span class="ls-rag-pdficon">PDF</span><span><b>Homotopy Type Theory.pdf</b><small>2,8 MB</small></span></button>' +
                '</div>' +
                '<div class="ls-rag-picker-note" hidden></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ls-rag-bottom"><span class="ls-rag-status"></span><button type="button" class="ls-btn ls-btn--tiny ls-rag-next"></button><button type="button" class="ls-btn ls-btn--tiny ls-rag-reset">' + esc(L("Zurücksetzen", "Reset")) + '</button></div>';

    root.appendChild(el);

    var docEl = el.querySelector(".ls-rag-doc");
    var docStatus = el.querySelector(".ls-rag-doc-status");
    var stepsEl = el.querySelectorAll(".ls-rag-steps span");
    var progressEl = el.querySelector(".ls-rag-progress");
    var statusEl = el.querySelector(".ls-rag-status");
    var nextBtn = el.querySelector(".ls-rag-next");
    var resetBtn = el.querySelector(".ls-rag-reset");
    var attachBtn = el.querySelector(".ls-rag-attach");
    var emptyEl = el.querySelector(".ls-rag-empty");
    var fileMsg = el.querySelector(".ls-rag-filemsg");
    var fileStatus = el.querySelector(".ls-rag-file-status");
    var questionMsg = el.querySelector(".ls-rag-questionmsg");
    var aiMsg = el.querySelector(".ls-rag-aimsg");
    var answerEl = el.querySelector(".ls-rag-answer");
    var typingEl = el.querySelector(".ls-rag-typing");
    var angularEl = el.querySelector(".ls-rag-angle-chart");
    var angleListEl = el.querySelector(".ls-rag-angle-list");
    var contextBody = el.querySelector(".ls-rag-context-body");
    var anglePanel = el.querySelector(".ls-rag-angle-panel");
    var pdfWrap = el.querySelector(".ls-rag-pdf-wrap");
    var railRows = el.querySelectorAll(".ls-rag-rail-row");
    var picker = el.querySelector(".ls-rag-picker");
    var pickerNote = el.querySelector(".ls-rag-picker-note");
    var pickBtns = el.querySelectorAll(".ls-rag-pick");

    var state = { step: 0, timers: [], picked: false };

    function clearTimers() {
      state.timers.forEach(function (id) { clearTimeout(id); });
      state.timers = [];
    }

    function markScanned(id) {
      var p = docEl.querySelector('.ls-rag-pdf-chunk[data-c="' + id + '"]');
      if (p) p.classList.add("is-scanned");
      var row = el.querySelector('.ls-rag-rail-row[data-c="' + id + '"]');
      if (row) row.classList.add("is-in");
    }
    function completeScan() {
      ARTICLE.paragraphs.forEach(function (p) { markScanned(p.id); });
      pdfWrap.classList.remove("is-scanning");
    }
    function startScan() {
      completeScan();
      ARTICLE.paragraphs.forEach(function (p) {
        var pEl = docEl.querySelector('.ls-rag-pdf-chunk[data-c="' + p.id + '"]');
        if (pEl) pEl.classList.remove("is-scanned");
        var row = el.querySelector('.ls-rag-rail-row[data-c="' + p.id + '"]');
        if (row) row.classList.remove("is-in");
      });
      pdfWrap.classList.add("is-scanning");
      ARTICLE.paragraphs.forEach(function (p, i) {
        state.timers.push(setTimeout(function () { markScanned(p.id); }, 330 + i * 390));
      });
      state.timers.push(setTimeout(function () {
        completeScan();
        if (docStatus) docStatus.textContent = L("5 Chunks · 5 Vektoren", "5 chunks · 5 vectors");
      }, 2450));
    }

    function fitPdfText() {
      var body = docEl.querySelector(".ls-rag-pdf-body");
      if (!body) return;
      var cols = body.querySelectorAll(".ls-rag-pdf-col");
      if (!cols.length) return;
      var available = body.clientHeight - 2;
      if (available < 40) return;
      var lo = 8.2, hi = 15, best = 8.2;
      for (var k = 0; k < 8; k++) {
        var mid = (lo + hi) / 2;
        body.style.setProperty("--rag-pdf-fs", mid.toFixed(2) + "px");
        var maxH = 0;
        Array.prototype.forEach.call(cols, function (c) { maxH = Math.max(maxH, c.scrollHeight); });
        if (maxH <= available) { best = mid; lo = mid; } else { hi = mid; }
      }
      body.style.setProperty("--rag-pdf-fs", best.toFixed(2) + "px");
    }

    function renderAngle() {
      angularEl.innerHTML = angleSVG();
      angleListEl.innerHTML = ARTICLE.paragraphs.map(function (p) {
        var fit = fits(p);
        return '<div class="ls-rag-angle-row' + (fit ? " is-fit" : "") + '" data-c="' + p.id + '"><b>' + p.id + '</b><span>' + p.angle + '°</span><em>' + esc(fit ? L("passt", "fits") : L("verworfen", "discarded")) + '</em><p>' + esc(p.heading) + ' · ' + esc(p.text) + '</p></div>';
      }).join("");
      contextBody.innerHTML = '<span class="ls-rag-context-empty">' + esc(L("Noch kein Chunk im Kontext.", "No chunk in the context yet.")) + '</span>';
    }
    function insertContext() {
      contextBody.innerHTML = SELECTED.map(function (id) {
        var p = chunkById(id);
        return '<div class="ls-rag-ctx-card" data-c="' + id + '"><b>' + id + '</b><span>' + esc(p.heading) + '</span><p>' + esc(p.text) + '</p></div>';
      }).join("");
      Array.prototype.forEach.call(contextBody.querySelectorAll(".ls-rag-ctx-card"), function (card) {
        requestAnimationFrame(function () { card.classList.add("is-in"); });
      });
      Array.prototype.forEach.call(angleListEl.querySelectorAll(".ls-rag-angle-row.is-fit"), function (row) {
        row.classList.add("is-in");
      });
    }
    function showAnswer() {
      typingEl.hidden = true;
      answerEl.innerHTML = esc(ANSWER) + ' <span class="ls-rag-cite">[C1]</span><span class="ls-rag-cite">[C2]</span>';
    }
    function scheduleAngle() {
      state.timers.push(setTimeout(function () { insertContext(); }, 560));
      state.timers.push(setTimeout(function () { showAnswer(); }, 1250));
    }

    function setChat() {
      var hasFile = state.step >= 1;
      var hasQuestion = state.step >= 2;
      var hasAnswer = state.step >= 3;
      emptyEl.hidden = hasFile;
      fileMsg.hidden = !hasFile;
      questionMsg.hidden = !hasQuestion;
      aiMsg.hidden = !hasAnswer;
      typingEl.hidden = !hasAnswer;
      answerEl.textContent = "";
      if (hasFile) {
        fileStatus.textContent = state.step === 1
          ? L("wird gescannt …", "scanning …")
          : state.step === 2
            ? L("5 Chunks · 5 Vektoren", "5 chunks · 5 vectors")
            : L("5 Chunks · 2 im Kontext", "5 chunks · 2 in context");
      }
      if (hasAnswer) {
        answerEl.innerHTML = '<span class="ls-rag-partial">' + esc(L("Ein Krake hat …", "An octopus has …")) + '</span>';
      }
    }

    function openPicker() {
      if (state.step !== 0) return;
      state.picked = false;
      picker.hidden = false;
      pickerNote.hidden = true;
      pickerNote.textContent = "";
      attachBtn.classList.remove("is-hint", "is-tap");
      void attachBtn.offsetWidth;
      attachBtn.classList.add("is-tap");
      state.timers.push(setTimeout(function () { attachBtn.classList.remove("is-tap"); }, 700));
    }

    function applyStep() {
      el.setAttribute("data-step", String(state.step));
      Array.prototype.forEach.call(stepsEl, function (s, i) {
        s.classList.toggle("is-on", i === state.step);
        s.classList.toggle("is-done", i < state.step);
      });
      progressEl.textContent = (state.step + 1) + " / " + STEPS.length;
      picker.hidden = state.step !== 0;
      docEl.classList.toggle("is-on", state.step >= 1);
      anglePanel.classList.toggle("is-on", state.step >= 3);
      setChat();
      if (state.step === 0) {
        docStatus.textContent = "";
        attachBtn.classList.add("is-hint");
      } else if (state.step === 1) {
        docStatus.textContent = L("Scan läuft …", "Scanning …");
        startScan();
      } else if (state.step === 2) {
        completeScan();
        docStatus.textContent = L("5 Chunks · 5 Vektoren", "5 chunks · 5 vectors");
      } else if (state.step === 3) {
        completeScan();
        docStatus.textContent = L("5 Chunks · 2 im Kontext", "5 chunks · 2 in context");
        renderAngle();
        scheduleAngle();
      }
      if (state.step >= 1) requestAnimationFrame(fitPdfText);
      statusEl.textContent = state.step === 0
        ? L("Tippe auf 📎 und wähle kraken.pdf. Der Dialog zeigt auch andere PDFs.", "Tap 📎 and choose kraken.pdf. The dialog also shows other PDFs.")
        : state.step === 1
          ? L("Der Agent scannt den Text außerhalb des LLM. Jeder Abschnitt wird ein Chunk mit eigenem Vektor.", "The agent scans the text outside the LLM. Each paragraph becomes a chunk with its own vector.")
          : state.step === 2
            ? L("Die Frage steht im Chat. Jetzt vergleicht der Agent die Winkel der Chunks mit dem Kontext.", "The question is in the chat. Now the agent compares the chunk angles with the context.")
            : L("C1 und C2 liegen unter 35°. Sie wandern still in den unsichtbaren Kontext; der Chat antwortet.", "C1 and C2 lie below 35°. They move silently into the invisible context; the chat answers.");
      nextBtn.textContent = state.step === 0
        ? L("Datei wählen", "Choose file")
        : state.step < 3
          ? L("Weiter: " + STEPS[state.step + 1], "Next: " + STEPS[state.step + 1])
          : L("Neu starten", "Restart");
    }

    function go(step) {
      var next = Math.max(0, Math.min(3, step));
      if (next === state.step) return false;
      clearTimers();
      state.step = next;
      applyStep();
      return true;
    }

    nextBtn.addEventListener("click", function () {
      if (state.step === 0) { openPicker(); return; }
      if (state.step < 3) go(state.step + 1);
      else go(0);
    });
    resetBtn.addEventListener("click", function () { go(0); });
    attachBtn.addEventListener("click", openPicker);
    Array.prototype.forEach.call(pickBtns, function (btn) {
      btn.addEventListener("click", function () {
        var file = btn.getAttribute("data-file");
        if (file === "kraken") {
          state.picked = true;
          go(1);
          return;
        }
        pickerNote.hidden = false;
        pickerNote.textContent = L("In dieser Demo wird kraken.pdf geöffnet.", "This demo opens kraken.pdf.");
      });
    });

    applyStep();

    return {
      update: function () { go(0); },
      next: function () {
        if (state.step === 0) { openPicker(); return true; }
        if (state.step < 3) { go(state.step + 1); return true; }
        return false;
      },
      prev: function () {
        if (state.step > 0) { go(state.step - 1); return true; }
        return false;
      },
      hasNext: function () { return state.step < 3; },
      hasPrev: function () { return state.step > 0; },
      resize: function () { requestAnimationFrame(fitPdfText); },
      destroy: function () { clearTimers(); el.remove(); }
    };
  }

  core.register("agentrag", agentRagScene);
})();
