(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var AGENT_RAG_LAST_STEP = 0;

  function agentRagScene(root, api) {
    var DE = api.lang === "de";
    var esc = api.esc;
    function L(de, en) { return DE ? de : en; }

    var THRESHOLD = 35;
    var STEPS = [
      L("Datei", "File"),
      L("Scan", "Scan"),
      L("Winkel", "Angles"),
      L("Antwort", "Answer")
    ];

    var IMG = {
      colossal: api.asset("assets/kraken-colossal.jpg"),
      octopus: api.asset("assets/kraken-octopus.jpg")
    };

    var ARTICLE = {
      brand: L("Enzyklopädie", "Encyclopædia"),
      series: L("Kraken und Oktopoden · Band 12", "Kraken and octopodes · Volume 12"),
      page: "417",
      kicker: L("Octopoda · Kopffüßer", "Octopoda · cephalopods"),
      title: L("Kraken und Oktopoden", "Kraken and octopodes"),
      filler: {
        title: L("Krakelee", "Kraków"),
        image: DE ? api.asset("assets/krakelee-mona-lisa.jpg") : api.asset("assets/krakow-wawel.jpg"),
        caption: L("Mona Lisa, Detail der Augen. Leonardo da Vinci, public domain.", "Wawel Castle, Kraków. Photo: XEvansGambitx, CC BY-SA 4.0."),
        imageUrl: DE ? "https://commons.wikimedia.org/wiki/File:Mona_Lisa_detail_eyes.jpg" : "https://commons.wikimedia.org/wiki/File:Zamek_Kr%C3%B3lewski_na_Wawelu_(1).jpg",
        licenseUrl: DE ? "" : "https://creativecommons.org/licenses/by-sa/4.0",
        sourceUrl: DE ? "https://de.wikipedia.org/wiki/Krakelee" : "https://en.wikipedia.org/wiki/Krak%C3%B3w"
      },
      paragraphs: [
        {
          id: "4815", heading: L("Körperbau", "Body"), angle: 12,
          text: L("Der Krake (Octopus) ist ein Kopffüßer aus der Ordnung der Octopoda. Sein Körper besteht aus einem sackförmigen Mantel und acht muskulösen Armen mit Saugnäpfen. Er besitzt drei Herzen und blaues Blut.", "The octopus (Octopus) is a cephalopod of the order Octopoda. Its body consists of a sac-like mantle and eight muscular arms with suckers. It has three hearts and blue blood.")
        },
        {
          id: "4816", heading: L("Blut und Kreislauf", "Blood and circulation"), angle: 19,
          text: L("Zwei Kiemenherzen treiben das Blut durch die Kiemen, ein Körperherz versorgt den übrigen Körper. Beim Schwimmen pausiert es zeitweise; Hämocyanin macht das Blut bläulich.", "Two gill hearts pump blood through the gills, while one body heart supplies the rest of the body. When swimming, the body heart pauses at times; hemocyanin gives the blood its bluish colour.")
        },
        {
          id: "4817", heading: L("Nervensystem", "Nervous system"), angle: 52,
          text: L("Rund zwei Drittel der Neuronen eines Kraken liegen in den acht Armen. Jeder Arm hat ein eigenes Nervennetz; die Saugnäpfe können chemische Reize aufnehmen.", "About two thirds of an octopus's neurons lie in its eight arms. Each arm has its own nerve net; the suckers can detect chemical stimuli.")
        },
        {
          id: "4818", heading: L("Tarnung", "Camouflage"), angle: 64,
          text: L("Chromatophoren, Iridophoren und Papillen ermöglichen schnelle Farb- und Texturwechsel. Kraken sind neugierig, lernfähig und nutzen Höhlen als Versteck.", "Chromatophores, iridophores, and papillae allow rapid changes of colour and texture. Octopuses are curious, capable learners and use caves as shelter.")
        },
        {
          id: "4819", heading: L("Mythos und Forschung", "Myth and research"), angle: 44,
          text: L("Der colossale Polyp des Pierre Denys de Montfort (1801) illustriert die Seefahrerlegende von riesigen Kraken; die Darstellung ist keine zoologische Beobachtung. Neuere Arbeiten untersuchen RNA-Editing und strukturelle Färbung.", "Pierre Denys de Montfort's colossal polyp (1801) illustrates the sailors' legend of giant krakens; the image is not a zoological observation. Recent research examines RNA editing and structural coloration.")
        },
        {
          id: "4820", heading: L("Krakelee", "Kraków"), angle: 88, filler: true,
          text: L("Das Krakelee oder Craquelé ist ein Netz feiner Sprünge in Ölgemälden, Glasuren, Steinen, Lacken oder Glas. Es entsteht durch Alterung, Klimaschwankungen oder mechanische Belastung, kann aber auch als maltechnischer Effekt gewollt sein.", "Kraków is the second-largest city in Poland and lies on the Vistula. It was the country's capital until 1596, and its Old Town became a UNESCO World Heritage Site in 1978.")
        },
        {
          id: "4821", heading: L("In der Malschicht", "Wawel and the Old Town"), angle: 91, filler: true,
          text: L("In der Malerei zählt das Craquelé zu den auffälligsten Altersspuren. Die Risse hängen von Bildträger, Pigmenten und Bindemitteln ab; mit der Zeit füllen sie sich mit dunkleren Partikeln und treten deutlicher hervor.", "Wawel Castle and Wawel Cathedral stand on the banks of the Vistula. The city is also home to the Jagiellonian University and the Rynek Główny, the largest medieval market square in Europe.")
        }
      ]
    };

    var CHUNK_COUNT = ARTICLE.paragraphs.length;
    var QUESTION = L("Wie viele Herzen hat ein Krake?", "How many hearts does an octopus have?");
    var ANSWER = L("Ein Krake hat drei Herzen: zwei Kiemenherzen und ein Körperherz.", "An octopus has three hearts: two gill hearts and one body heart.");
    var SELECTED = ["4815", "4816"];
    var TOTAL_CHUNKS = 8151;
    var EXCERPT_START = 4815;
    var EXCERPT_END = 4821;

    function chunkById(id) {
      return ARTICLE.paragraphs.filter(function (p) { return p.id === id; })[0] || null;
    }
    function fits(p) { return p.angle <= THRESHOLD; }
    function fitValue(p) { return Math.max(0, Math.min(1, 1 - p.angle / 90)); }
    function chunkTitle(id, heading) {
      return L("Chunk " + id + " von " + TOTAL_CHUNKS + " · Auszug 4815–4821 · " + heading, "Chunk " + id + " of " + TOTAL_CHUNKS + " · excerpt 4815–4821 · " + heading);
    }
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

    function fillerFigureHTML() {
      var f = ARTICLE.filler;
      var lic = f.licenseUrl ? ' <a href="' + f.licenseUrl + '" target="_blank" rel="noopener">CC BY-SA 4.0</a>' : '';
      return '<figure class="ls-rag-fig ls-rag-fig--filler"><img src="' + esc(f.image) + '" alt="' + esc(f.caption) + '"><figcaption><b>' + esc(f.title) + '</b> ' + esc(f.caption) + ' <a href="' + f.imageUrl + '" target="_blank" rel="noopener">Commons</a>' + lic + '</figcaption></figure>';
    }

    function pdfHTML() {
      var c1 = chunkById("4815"), c2 = chunkById("4816"), c3 = chunkById("4817"), c4 = chunkById("4818"), c5 = chunkById("4819");
      return '<div class="ls-rag-pdf">' +
        '<header class="ls-rag-pdf-head"><span class="ls-rag-pdf-brand">' + esc(ARTICLE.brand) + '</span><span class="ls-rag-pdf-series">' + esc(ARTICLE.series) + '</span><span class="ls-rag-pdf-page">' + esc(ARTICLE.page) + '</span></header>' +
        '<div class="ls-rag-pdf-title"><span>' + esc(ARTICLE.kicker) + '</span><h2>' + esc(ARTICLE.title) + '</h2></div>' +
        '<div class="ls-rag-pdf-body">' +
          '<div class="ls-rag-pdf-media">' + figureHTML("colossal") + figureHTML("octopus") + '</div>' +
          '<div class="ls-rag-pdf-flow">' +
            '<section class="ls-rag-pdf-chunk" data-c="4815" data-angle="12" title="' + esc(chunkTitle("4815", c1.heading)) + '"><h3>' + esc(c1.heading) + '</h3><p>' + esc(c1.text) + '</p></section>' +
            '<section class="ls-rag-pdf-chunk" data-c="4816" data-angle="19" title="' + esc(chunkTitle("4816", c2.heading)) + '"><h3>' + esc(c2.heading) + '</h3><p>' + esc(c2.text) + '</p></section>' +
            '<section class="ls-rag-pdf-chunk" data-c="4817" data-angle="52" title="' + esc(chunkTitle("4817", c3.heading)) + '"><h3>' + esc(c3.heading) + '</h3><p>' + esc(c3.text) + '</p></section>' +
            '<section class="ls-rag-pdf-chunk" data-c="4818" data-angle="64" title="' + esc(chunkTitle("4818", c4.heading)) + '"><h3>' + esc(c4.heading) + '</h3><p>' + esc(c4.text) + '</p></section>' +
            '<section class="ls-rag-pdf-chunk" data-c="4819" data-angle="44" title="' + esc(chunkTitle("4819", c5.heading)) + '"><h3>' + esc(c5.heading) + '</h3><p>' + esc(c5.text) + '</p></section>' +
            '<div class="ls-rag-pdf-filler-head"><h3>' + esc(ARTICLE.filler.title) + '</h3></div>' +
            fillerFigureHTML() +
            '<section class="ls-rag-pdf-chunk" data-c="4820" data-angle="88" title="' + esc(chunkTitle("4820", ARTICLE.paragraphs[5].heading)) + '"><h3>' + esc(ARTICLE.paragraphs[5].heading) + '</h3><p>' + esc(ARTICLE.paragraphs[5].text) + '</p></section>' +
            '<section class="ls-rag-pdf-chunk" data-c="4821" data-angle="91" title="' + esc(chunkTitle("4821", ARTICLE.paragraphs[6].heading)) + '"><h3>' + esc(ARTICLE.paragraphs[6].heading) + '</h3><p>' + esc(ARTICLE.paragraphs[6].text) + '</p></section>' +
          '</div>' +
        '</div>' +
        '<footer class="ls-rag-pdf-foot"><span>' + esc(L("Enzyklopädie · Kraken und Oktopoden", "Encyclopædia · Kraken and octopodes")) + '</span><span>' + esc(L("Simulation · fiktive Datei", "Simulation · fictional file")) + '</span><span>' + esc(L("Kraken und Oktopoden · Seite 417", "Kraken and octopodes · page 417")) + '</span></footer>' +
      '</div>';
    }

    function railHTML() {
      return ARTICLE.paragraphs.map(function (p) {
        var extra = p.id === "4815" ? L(" · Auszug beginnt hier; davor 4814 Chunks", " · excerpt starts here; 4814 chunks before") : "";
        return '<div class="ls-rag-rail-row" data-c="' + p.id + '" title="' + esc(chunkTitle(p.id, p.heading) + extra) + '"><div class="ls-rag-rail-top"><b>' + p.id + '</b><span class="ls-rag-rail-heading">' + esc(p.heading) + '</span></div><div class="ls-rag-rail-angle"><b>' + p.id + ' · ∠ ' + p.angle + '°</b><span class="ls-rag-rail-fit"><i style="width:' + Math.round(fitValue(p) * 100) + '%"></i></span></div><code>[' + esc(vectorText(p)) + ']</code><span class="ls-rag-rail-strip">' + vectorStrip(p) + '</span></div>';
      }).join("");
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
          '<div class="ls-rag-doc-head"><span class="ls-rag-fileicon">PDF</span><div><b>encyclopaedia.pdf</b><small class="ls-rag-doc-status"></small></div><span class="ls-rag-doc-tag">' + esc(L("außerhalb des LLM", "outside the LLM")) + '</span></div>' +
          '<div class="ls-rag-doc-body">' +
            '<div class="ls-rag-pdf-wrap">' + pdfHTML() + '<div class="ls-rag-scanfx" aria-hidden="true"><i></i></div></div>' +
            '<div class="ls-rag-rail"><div class="ls-rag-rail-head">' + esc(L("Nur Text · Chunk-Vektoren", "Text only · chunk vectors")) + '</div><div class="ls-rag-rail-meta">' + TOTAL_CHUNKS + ' ' + esc(L("Chunks gesamt", "chunks total")) + ' · ' + esc(L("Auszug 4815–4821", "excerpt 4815–4821")) + '</div><div class="ls-rag-threshold">' + esc(L("Grenzwinkel 35°", "threshold 35°")) + '</div><div class="ls-rag-rail-more" title="' + esc(L("Davor: Chunks 1–4814", "Before: chunks 1–4814")) + '">…</div><div class="ls-rag-rail-list">' + railHTML() + '</div><div class="ls-rag-rail-more" title="' + esc(L("Danach: Chunks 4822–8151", "After: chunks 4822–8151")) + '">…</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="ls-rag-phone-col">' +
          '<div class="ls-rag-phone">' +
            '<div class="ls-rag-phone-notch"></div>' +
            '<div class="ls-rag-phone-screen">' +
              '<div class="ls-rag-appbar"><span>KI-Chat</span><i></i></div>' +
              '<div class="ls-rag-thread">' +
                '<div class="ls-rag-empty">' + esc(L("Öffne eine Datei mit 📎.", "Open a file with 📎.")) + '</div>' +
                '<div class="ls-rag-filemsg" hidden><span class="ls-rag-user">' + esc(L("Du", "You")) + '</span><span class="ls-rag-bubble ls-rag-filebubble"><span class="ls-rag-pdficon">PDF</span><span><b>encyclopaedia.pdf</b><small class="ls-rag-file-status"></small></span></span></div>' +
                '<div class="ls-rag-questionmsg" hidden><span class="ls-rag-user">' + esc(L("Du", "You")) + '</span><span class="ls-rag-bubble">' + esc(QUESTION) + '</span></div>' +
                '<div class="ls-rag-aimsg" hidden><span class="ls-rag-user">LLM</span><span class="ls-rag-bubble ls-rag-answer"></span><span class="ls-rag-typing" aria-hidden="true"><i></i><i></i><i></i></span></div>' +
              '</div>' +
              '<div class="ls-rag-compose"><button type="button" class="ls-rag-attach" aria-label="' + esc(L("Datei öffnen", "Open a file")) + '">📎</button><span>' + esc(L("Nachricht", "Message")) + '</span><i></i></div>' +
              '<div class="ls-rag-picker" hidden>' +
                '<div class="ls-rag-picker-head"><b>' + esc(L("Datei auswählen", "Choose a file")) + '</b><span>PDF</span></div>' +
                '<div class="ls-rag-picker-list">' +
                  '<button type="button" class="ls-rag-pick" data-file="encyclopaedia"><span class="ls-rag-pdficon">PDF</span><span><b>encyclopaedia.pdf</b><small>' + esc(L("1,2 KB · Demo", "1.2 KB · demo")) + '</small></span><em>' + esc(L("öffnen", "open")) + '</em></button>' +
                  '<button type="button" class="ls-rag-pick is-muted" data-file="zen"><span class="ls-rag-pdficon">PDF</span><span><b>' + esc(L("Zen und die Kunst, ein Motorrad zu warten.pdf", "Zen and the Art of Motorcycle Maintenance.pdf")) + '</b><small>4,1 MB</small></span></button>' +
                  '<button type="button" class="ls-rag-pick is-muted" data-file="hott"><span class="ls-rag-pdficon">PDF</span><span><b>Homotopy Type Theory.pdf</b><small>2,8 MB</small></span></button>' +
                '</div>' +
                '<div class="ls-rag-picker-note" hidden></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<svg class="ls-rag-arrows" aria-hidden="true"></svg>' +
        '<div class="ls-rag-rail-tip" hidden></div>' +
      '</div>' +
      '<div class="ls-rag-bottom"><span class="ls-rag-status"></span><button type="button" class="ls-btn ls-btn--tiny ls-rag-next"></button><button type="button" class="ls-btn ls-btn--tiny ls-rag-reset">' + esc(L("Zurücksetzen", "Reset")) + '</button></div>';

    root.appendChild(el);

    Array.prototype.forEach.call(el.querySelectorAll(".ls-rag-pdf-chunk"), function (chunk) {
      var p = chunkById(chunk.getAttribute("data-c"));
      if (!p) return;
      var bar = document.createElement("span");
      bar.className = "ls-rag-fitbar";
      bar.setAttribute("aria-hidden", "true");
      bar.innerHTML = "<i style=\"height:" + Math.round(fitValue(p) * 100) + "%\"></i>";
      chunk.appendChild(bar);
      if (SELECTED.indexOf(p.id) >= 0) {
        var pill = document.createElement("span");
        pill.className = "ls-rag-ctx-pill";
        pill.innerHTML = "<b>🔒 " + esc(L("Kontext", "Context")) + "</b><em>" + esc(L("nur Modell", "model only")) + "</em>";
        chunk.appendChild(pill);
      }
    });

    function bindRailTips() {
      if (!railTip || !stageEl) return;
      Array.prototype.forEach.call(el.querySelectorAll(".ls-rag-rail-row"), function (row) {
        row.addEventListener("mouseenter", function () {
          var p = chunkById(row.getAttribute("data-c"));
          if (!p) return;
          railTip.innerHTML = "<b>Chunk " + p.id + " · " + esc(p.heading) + "</b><p>" + esc(p.text) + "</p>";
          railTip.hidden = false;
          var sr = stageEl.getBoundingClientRect();
          var rr = row.getBoundingClientRect();
          var w = railTip.offsetWidth || 260;
          var h = railTip.offsetHeight || 120;
          railTip.style.left = Math.max(8, rr.left - sr.left - w - 10) + "px";
          railTip.style.top = Math.max(8, Math.min(sr.height - h - 8, rr.top - sr.top)) + "px";
        });
        row.addEventListener("mouseleave", function () { railTip.hidden = true; });
      });
    }

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
    var pdfWrap = el.querySelector(".ls-rag-pdf-wrap");
    var railRows = el.querySelectorAll(".ls-rag-rail-row");
    var picker = el.querySelector(".ls-rag-picker");
    var pickerNote = el.querySelector(".ls-rag-picker-note");
    var pickBtns = el.querySelectorAll(".ls-rag-pick");
    var phoneEl = el.querySelector(".ls-rag-phone-screen");
    var phoneDevice = el.querySelector(".ls-rag-phone");
    var stageEl = el.querySelector(".ls-rag-stage");
    var arrowsEl = el.querySelector(".ls-rag-arrows");
    var railTip = el.querySelector(".ls-rag-rail-tip");
    bindRailTips();

    var state = { step: AGENT_RAG_LAST_STEP, timers: [], pickerOpen: false, textFitted: false, anglesShown: false, answerShown: false };

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
        if (docStatus) docStatus.textContent = L("Auszug 4815–4821 · 35°", "excerpt 4815–4821 · 35°");
      }, 2450));
    }

    function fitPdfText(force) {
      if (state.textFitted && !force) return;
      var body = docEl.querySelector(".ls-rag-pdf-body");
      var flow = docEl.querySelector(".ls-rag-pdf-flow");
      if (!body || !flow) return;
      var fillers = Array.prototype.slice.call(flow.querySelectorAll('.ls-rag-pdf-filler-head, .ls-rag-fig--filler, .ls-rag-pdf-chunk[data-c="F1"], .ls-rag-pdf-chunk[data-c="F2"]'));
      fillers.forEach(function (n) { n.style.display = "none"; });
      var available = flow.clientWidth;
      if (available < 40) return;
      var lo = 8.0, hi = 9.8, best = 8.0;
      for (var k = 0; k < 9; k++) {
        var mid = (lo + hi) / 2;
        body.style.setProperty("--rag-pdf-fs", mid.toFixed(2) + "px");
        if (flow.scrollWidth <= available + 16) { best = mid; lo = mid; } else { hi = mid; }
      }
      body.style.setProperty("--rag-pdf-fs", best.toFixed(2) + "px");
      fillers.forEach(function (n) { n.style.display = ""; });
      state.textFitted = true;
    }

    function resetChunkStates(keepAngles) {
      if (!keepAngles) docEl.classList.remove("is-angling");
      Array.prototype.forEach.call(docEl.querySelectorAll(".ls-rag-pdf-chunk"), function (chunk) {
        chunk.classList.remove("is-context");
        if (!keepAngles) chunk.classList.remove("is-angle-in", "is-fit", "is-out");
      });
      Array.prototype.forEach.call(el.querySelectorAll(".ls-rag-rail-row"), function (row) {
        row.classList.remove("is-context");
        if (!keepAngles) row.classList.remove("is-angle-in", "is-fit", "is-out");
      });
    }

    function restoreAngles() {
      state.anglesShown = true;
      docEl.classList.add("is-angling");
      ARTICLE.paragraphs.forEach(function (p) {
        var chunk = docEl.querySelector('.ls-rag-pdf-chunk[data-c="' + p.id + '"]');
        var row = el.querySelector('.ls-rag-rail-row[data-c="' + p.id + '"]');
        var fit = fits(p);
        if (row) row.classList.add("is-angle-in");
        if (chunk) {
          chunk.classList.toggle("is-fit", fit);
          chunk.classList.toggle("is-out", !fit);
        }
        if (row) {
          row.classList.toggle("is-fit", fit);
          row.classList.toggle("is-out", !fit);
        }
      });
    }

    function stepTwoAngles() {
      state.anglesShown = true;
      state.answerShown = false;
      docEl.classList.add("is-angling");
      ARTICLE.paragraphs.forEach(function (p, i) {
        state.timers.push(setTimeout(function () {
          var row = el.querySelector('.ls-rag-rail-row[data-c="' + p.id + '"]');
          if (row) row.classList.add("is-angle-in");
        }, 220 + i * 220));
      });
      state.timers.push(setTimeout(function () {
        ARTICLE.paragraphs.forEach(function (p) {
          var chunk = docEl.querySelector('.ls-rag-pdf-chunk[data-c="' + p.id + '"]');
          var row = el.querySelector('.ls-rag-rail-row[data-c="' + p.id + '"]');
          var fit = fits(p);
          if (chunk) {
            chunk.classList.toggle("is-fit", fit);
            chunk.classList.toggle("is-out", !fit);
          }
          if (row) {
            row.classList.toggle("is-fit", fit);
            row.classList.toggle("is-out", !fit);
          }
        });
        selfCheck();
      }, 1900));
      state.timers.push(setTimeout(function () { selfCheck(); }, 2300));
    }

    function addContextToChunks() {
      SELECTED.forEach(function (id) {
        var chunk = docEl.querySelector('.ls-rag-pdf-chunk[data-c="' + id + '"]');
        var row = el.querySelector('.ls-rag-rail-row[data-c="' + id + '"]');
        if (chunk) chunk.classList.add("is-context");
        if (row) row.classList.add("is-context");
      });
    }

    function restoreContext() {
      restoreAngles();
      addContextToChunks();
      showAnswer();
      requestAnimationFrame(drawCitationArrows);
      selfCheck();
    }

    function stepThreeContext() {
      restoreAngles();
      addContextToChunks();
      state.timers.push(setTimeout(flySelectedChunks, 200));
      state.timers.push(setTimeout(function () { showAnswer(); }, 1000));
      state.timers.push(setTimeout(function () { drawCitationArrows(); selfCheck(); }, 1150));
      state.timers.push(setTimeout(function () { selfCheck(); }, 1700));
    }
    function clearFlyCards() {
      Array.prototype.forEach.call(el.querySelectorAll(".ls-rag-fly-card"), function (c) { c.remove(); });
    }
    function flySelectedChunks() {
      clearFlyCards();
      if (!stageEl || !phoneDevice) return;
      var sr = stageEl.getBoundingClientRect();
      var pr = phoneDevice.getBoundingClientRect();
      if (!sr.width || !pr.width) return;
      var tx = pr.left + pr.width / 2 - sr.left;
      var ty = pr.top + pr.height / 2 - sr.top;
      SELECTED.forEach(function (id, idx) {
        var chunk = docEl.querySelector('.ls-rag-pdf-chunk[data-c="' + id + '"]');
        var p = chunkById(id);
        if (!chunk || !p) return;
        var cr = chunk.getBoundingClientRect();
        var card = document.createElement("div");
        card.className = "ls-rag-fly-card";
        card.innerHTML = "<b>" + id + "</b><span>" + esc(p.heading) + "</span>";
        card.style.left = (cr.left - sr.left + 4) + "px";
        card.style.top = (cr.top - sr.top + 4) + "px";
        card.style.width = Math.min(Math.max(cr.width, 120), 190) + "px";
        stageEl.appendChild(card);
        var x0 = cr.left - sr.left + card.offsetWidth / 2;
        var y0 = cr.top - sr.top + card.offsetHeight / 2;
        card.animate([
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: "translate(" + (tx - x0).toFixed(1) + "px," + (ty - y0).toFixed(1) + "px) scale(.02)", opacity: 0 }
        ], { duration: 1050, delay: idx * 170, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
        state.timers.push(setTimeout(function () { card.remove(); }, 1100 + idx * 170));
      });
    }
    function clearCitationArrows() {
      if (arrowsEl) arrowsEl.innerHTML = "";
    }
    function drawCitationArrows() {
      if (!arrowsEl || !stageEl) return;
      if (state.step < 2) { clearCitationArrows(); return; }
      var sr = stageEl.getBoundingClientRect();
      if (!sr.width || !sr.height) return;
      arrowsEl.setAttribute("viewBox", "0 0 " + sr.width + " " + sr.height);
      arrowsEl.setAttribute("width", sr.width);
      arrowsEl.setAttribute("height", sr.height);
      var out = ['<defs><marker id="ls-rag-arrow-head" markerWidth="7" markerHeight="7" refX="6.4" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#3f8f5a"/></marker></defs>'];
      Array.prototype.forEach.call(answerEl.querySelectorAll(".ls-rag-cite[data-cite]"), function (cite) {
        var id = cite.getAttribute("data-cite");
        var chunk = docEl.querySelector('.ls-rag-pdf-chunk[data-c="' + id + '"]');
        if (!chunk) return;
        var c = cite.getBoundingClientRect();
        var t = chunk.getBoundingClientRect();
        if (!c.width || !t.width) return;
        var x1 = c.left - sr.left;
        var y1 = c.top + c.height / 2 - sr.top;
        var x2 = t.right - sr.left;
        var y2 = t.top + Math.min(t.height * .45, 26) - sr.top;
        var mx = (x1 + x2) / 2;
        var my = Math.min(y1, y2) - 26;
        out.push('<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" fill="none" stroke="#3f8f5a" stroke-width="1.5" marker-end="url(#ls-rag-arrow-head)" opacity=".85"/>');
        out.push('<circle cx="' + x1.toFixed(1) + '" cy="' + y1.toFixed(1) + '" r="2.2" fill="#3f8f5a"/>');
      });
      arrowsEl.innerHTML = out.join("");
    }

    function setCiteFocus(id) {
      if (arrowsEl) arrowsEl.classList.add("is-hidden");
      Array.prototype.forEach.call(docEl.querySelectorAll(".ls-rag-pdf-chunk"), function (chunk) {
        var on = chunk.getAttribute("data-c") === id;
        chunk.classList.toggle("is-cite-active", on);
        chunk.classList.toggle("is-cite-muted", !on);
      });
      Array.prototype.forEach.call(el.querySelectorAll(".ls-rag-rail-row"), function (row) {
        var on = row.getAttribute("data-c") === id;
        row.classList.toggle("is-cite-active", on);
        row.classList.toggle("is-cite-muted", !on);
      });
    }
    function clearCiteFocus() {
      Array.prototype.forEach.call(docEl.querySelectorAll(".ls-rag-pdf-chunk"), function (chunk) {
        chunk.classList.remove("is-cite-active", "is-cite-muted");
      });
      Array.prototype.forEach.call(el.querySelectorAll(".ls-rag-rail-row"), function (row) {
        row.classList.remove("is-cite-active", "is-cite-muted");
      });
      if (arrowsEl) arrowsEl.classList.remove("is-hidden");
      requestAnimationFrame(drawCitationArrows);
    }
    function bindCiteHover() {
      Array.prototype.forEach.call(answerEl.querySelectorAll(".ls-rag-cite"), function (cite) {
        var id = cite.getAttribute("data-cite");
        cite.addEventListener("mouseenter", function () { setCiteFocus(id); });
        cite.addEventListener("mouseleave", clearCiteFocus);
        cite.addEventListener("focus", function () { setCiteFocus(id); });
        cite.addEventListener("blur", clearCiteFocus);
      });
    }
    function showAnswer() {
      state.answerShown = true;
      typingEl.hidden = true;
      answerEl.innerHTML = esc(ANSWER) + ' <span class="ls-rag-cite" data-cite="4815" tabindex="0">[4815]</span><span class="ls-rag-cite" data-cite="4816" tabindex="0">[4816]</span>';
      bindCiteHover();
      requestAnimationFrame(drawCitationArrows);
    }

    function selfCheck() {
      var chunks = docEl.querySelectorAll(".ls-rag-pdf-chunk");
      var rails = el.querySelectorAll(".ls-rag-rail-row");
      var thread = el.querySelector(".ls-rag-thread");
      var phoneText = thread ? thread.textContent : "";
      var ok = chunks.length === ARTICLE.paragraphs.length && rails.length === ARTICLE.paragraphs.length;
      if (phoneText.indexOf("Der Krake (Octopus)") >= 0 || phoneText.indexOf("The octopus (Octopus)") >= 0) ok = false;
      if (state.step >= 3) {
        var contextChunks = docEl.querySelectorAll(".ls-rag-pdf-chunk.is-context");
        if (contextChunks.length !== SELECTED.length) ok = false;
      }
      el.setAttribute("data-rag-ok", ok ? "1" : "0");
      return ok;
    }

    function setChat() {
      var hasFile = state.step >= 1;
      var hasQuestion = state.step >= 2;
      var hasAnswer = state.step >= 3 && state.answerShown;
      var thinking = state.step >= 3 && !state.answerShown;
      emptyEl.hidden = hasFile;
      fileMsg.hidden = !hasFile;
      questionMsg.hidden = !hasQuestion;
      aiMsg.hidden = !(hasAnswer || thinking);
      typingEl.hidden = !thinking;
      answerEl.textContent = "";
      if (hasFile) {
        fileStatus.textContent = state.step === 1
          ? L("Auszug 4815–4821", "excerpt 4815–4821")
          : L("Antwort bereit", "answer ready");
      }
      if (hasAnswer) showAnswer();
      else if (thinking) answerEl.innerHTML = '<span class="ls-rag-partial">' + esc(L("Kontext geprüft, Antwort folgt …", "Context checked, answer follows …")) + '</span>';
    }

    function selectFile() {
      if (state.step !== 0) return;
      clearTimers();
      state.pickerOpen = false;
      var row = el.querySelector('.ls-rag-pick[data-file="encyclopaedia"]');
      if (row) row.classList.add("is-selected");
      state.timers.push(setTimeout(function () { go(1); }, 180));
    }

    function openPicker() {
      if (state.step !== 0 || state.pickerOpen) return;
      state.pickerOpen = true;
      picker.hidden = false;
      pickerNote.hidden = true;
      pickerNote.textContent = "";
      Array.prototype.forEach.call(pickBtns, function (b) { b.classList.remove("is-selected"); });
      attachBtn.classList.remove("is-hint", "is-tap");
      void attachBtn.offsetWidth;
      attachBtn.classList.add("is-tap");
      state.timers.push(setTimeout(function () { attachBtn.classList.remove("is-tap"); }, 700));
      state.timers.push(setTimeout(selectFile, 1000));
    }

    function applyStep(restoring) {
      el.setAttribute("data-step", String(state.step));
      Array.prototype.forEach.call(stepsEl, function (s, i) {
        s.classList.toggle("is-on", i === state.step);
        s.classList.toggle("is-done", i < state.step);
      });
      progressEl.textContent = (state.step + 1) + " / " + STEPS.length;
      picker.hidden = true;
      if (attachBtn) attachBtn.classList.remove("is-hint", "is-tap");
      docEl.classList.toggle("is-on", state.step >= 1);
      clearFlyCards();
      clearCitationArrows();
      if (railTip) railTip.hidden = true;
      var keepAngles = state.step >= 2 && state.anglesShown;
      if (state.step < 2) {
        state.anglesShown = false;
        state.answerShown = false;
      } else if (state.step === 2) {
        state.answerShown = false;
      } else if (state.step === 3 && !restoring) {
        state.answerShown = false;
      }
      resetChunkStates(keepAngles);
      setChat();
      if (state.step === 0) {
        state.pickerOpen = false;
        state.textFitted = false;
        docStatus.textContent = "";
        attachBtn.classList.add("is-hint");
      } else if (state.step === 1) {
        docStatus.textContent = L("Auszug 4815–4821 · 35°", "excerpt 4815–4821 · 35°");
        if (restoring) completeScan(); else startScan();
      } else if (state.step === 2) {
        completeScan();
        docStatus.textContent = L("Auszug 4815–4821 · 35°", "excerpt 4815–4821 · 35°");
        if (restoring || state.anglesShown) restoreAngles(); else stepTwoAngles();
      } else if (state.step === 3) {
        completeScan();
        docStatus.textContent = L("Auszug 4815–4821 · 35°", "excerpt 4815–4821 · 35°");
        if (restoring) restoreContext(); else stepThreeContext();
      }
      if (state.step >= 1) requestAnimationFrame(function () { fitPdfText(); });
      statusEl.textContent = state.step === 0
        ? ""
        : state.step === 1
          ? L("Der Agent scannt den Text außerhalb des LLM. Jeder Abschnitt wird ein Chunk mit eigenem Vektor.", "The agent scans the text outside the LLM. Each paragraph becomes a chunk with its own vector.")
          : state.step === 2
            ? ""
            : L("Kontext einfügen → Antwort", "Insert context → answer");
      nextBtn.textContent = state.step === 0
        ? L("Weiter", "Next")
        : state.step < 3
          ? L("Weiter: " + STEPS[state.step + 1], "Next: " + STEPS[state.step + 1])
          : L("Neu starten", "Restart");
      selfCheck();
    }

    function go(step) {
      var next = Math.max(0, Math.min(3, step));
      if (next === state.step) return false;
      clearTimers();
      state.step = next;
      AGENT_RAG_LAST_STEP = state.step;
      applyStep(false);
      return true;
    }

    nextBtn.addEventListener("click", function () {
      if (state.step === 0) {
        if (picker.hidden) openPicker();
        else selectFile();
        return;
      }
      if (state.step < 3) go(state.step + 1);
      else go(0);
    });
    resetBtn.addEventListener("click", function () { go(0); });
    attachBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      openPicker();
    });
    if (phoneEl) {
      phoneEl.addEventListener("click", function (e) {
        if (state.step !== 0) return;
        if (e.target.closest && e.target.closest(".ls-rag-picker")) return;
        if (picker.hidden) openPicker();
      });
    }
    Array.prototype.forEach.call(pickBtns, function (btn) {
      btn.addEventListener("click", function () {
        var file = btn.getAttribute("data-file");
        if (file === "encyclopaedia") {
          selectFile();
          return;
        }
        pickerNote.hidden = false;
        pickerNote.textContent = L("In dieser Demo wird encyclopaedia.pdf geöffnet.", "This demo opens encyclopaedia.pdf.");
      });
    });

    applyStep(AGENT_RAG_LAST_STEP > 0);
    el.__lsRagSelfCheck = selfCheck;

    return {
      update: function () {},
      next: function () {
        if (state.step === 0) {
          if (picker.hidden) openPicker();
          else selectFile();
          return true;
        }
        if (state.step < 3) { go(state.step + 1); return true; }
        return false;
      },
      prev: function () {
        if (state.step > 0) { go(state.step - 1); return true; }
        return false;
      },
      hasNext: function () { return state.step < 3; },
      hasPrev: function () { return state.step > 0; },
      resize: function () { requestAnimationFrame(function () { fitPdfText(true); drawCitationArrows(); selfCheck(); }); },
      destroy: function () { clearTimers(); el.remove(); }
    };
  }

  core.register("agentrag", agentRagScene);
})();
