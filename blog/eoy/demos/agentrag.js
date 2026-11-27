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
      series: L("Krake · Band 12", "Kraken · Volume 12"),
      page: "417",
      kicker: L("Octopoda · Kopffüßer", "Octopoda · cephalopods"),
      title: L("Krake", "Kraken"),
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
        },
        {
          id: "F1", heading: L("Krakelee", "Kraków"), angle: 88, filler: true,
          text: L("Das Krakelee oder Craquelé ist ein Netz feiner Sprünge in Ölgemälden, Glasuren, Steinen, Lacken oder Glas. Es entsteht durch Alterung, Klimaschwankungen oder mechanische Belastung, kann aber auch als maltechnischer Effekt gewollt sein.", "Kraków is the second-largest city in Poland and lies on the Vistula. It was the country's capital until 1596, and its Old Town became a UNESCO World Heritage Site in 1978.")
        },
        {
          id: "F2", heading: L("In der Malschicht", "Wawel and the Old Town"), angle: 91, filler: true,
          text: L("In der Malerei zählt das Craquelé zu den auffälligsten Altersspuren. Die Risse hängen von Bildträger, Pigmenten und Bindemitteln ab; mit der Zeit füllen sie sich mit dunkleren Partikeln und treten deutlicher hervor.", "Wawel Castle and Wawel Cathedral stand on the banks of the Vistula. The city is also home to the Jagiellonian University and the Rynek Główny, the largest medieval market square in Europe.")
        }
      ]
    };

    var CHUNK_COUNT = ARTICLE.paragraphs.length;
    var QUESTION = L("Wie viele Herzen hat ein Krake?", "How many hearts does an octopus have?");
    var ANSWER = L("Ein Krake hat drei Herzen: zwei Kiemenherzen und ein Körperherz.", "An octopus has three hearts: two gill hearts and one body heart.");
    var SELECTED = ["C1", "C2"];

    function chunkById(id) {
      return ARTICLE.paragraphs.filter(function (p) { return p.id === id; })[0] || null;
    }
    function fits(p) { return p.angle <= THRESHOLD; }
    function fitValue(p) { return Math.max(0, Math.min(1, 1 - p.angle / 90)); }
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
      var c1 = chunkById("C1"), c2 = chunkById("C2"), c3 = chunkById("C3"), c4 = chunkById("C4"), c5 = chunkById("C5");
      return '<div class="ls-rag-pdf">' +
        '<header class="ls-rag-pdf-head"><span class="ls-rag-pdf-brand">' + esc(ARTICLE.brand) + '</span><span class="ls-rag-pdf-series">' + esc(ARTICLE.series) + '</span><span class="ls-rag-pdf-page">' + esc(ARTICLE.page) + '</span></header>' +
        '<div class="ls-rag-pdf-title"><span>' + esc(ARTICLE.kicker) + '</span><h2>' + esc(ARTICLE.title) + '</h2></div>' +
        '<div class="ls-rag-pdf-body">' +
          '<div class="ls-rag-pdf-media">' + figureHTML("colossal") + figureHTML("octopus") + '</div>' +
          '<div class="ls-rag-pdf-flow">' +
            '<section class="ls-rag-pdf-chunk" data-c="C1" data-angle="12" title="C1 · ' + esc(c1.heading) + '"><h3>' + esc(c1.heading) + '</h3><p>' + esc(c1.text) + '</p></section>' +
            '<section class="ls-rag-pdf-chunk" data-c="C2" data-angle="19" title="C2 · ' + esc(c2.heading) + '"><h3>' + esc(c2.heading) + '</h3><p>' + esc(c2.text) + '</p></section>' +
            '<section class="ls-rag-pdf-chunk" data-c="C3" data-angle="52" title="C3 · ' + esc(c3.heading) + '"><h3>' + esc(c3.heading) + '</h3><p>' + esc(c3.text) + '</p></section>' +
            '<section class="ls-rag-pdf-chunk" data-c="C4" data-angle="64" title="C4 · ' + esc(c4.heading) + '"><h3>' + esc(c4.heading) + '</h3><p>' + esc(c4.text) + '</p></section>' +
            '<section class="ls-rag-pdf-chunk" data-c="C5" data-angle="44" title="C5 · ' + esc(c5.heading) + '"><h3>' + esc(c5.heading) + '</h3><p>' + esc(c5.text) + '</p></section>' +
            '<div class="ls-rag-pdf-filler-head"><h3>' + esc(ARTICLE.filler.title) + '</h3></div>' +
            fillerFigureHTML() +
            '<section class="ls-rag-pdf-chunk" data-c="F1" data-angle="88" title="F1 · ' + esc(ARTICLE.paragraphs[5].heading) + '"><h3>' + esc(ARTICLE.paragraphs[5].heading) + '</h3><p>' + esc(ARTICLE.paragraphs[5].text) + '</p></section>' +
            '<section class="ls-rag-pdf-chunk" data-c="F2" data-angle="91" title="F2 · ' + esc(ARTICLE.paragraphs[6].heading) + '"><h3>' + esc(ARTICLE.paragraphs[6].heading) + '</h3><p>' + esc(ARTICLE.paragraphs[6].text) + '</p></section>' +
          '</div>' +
        '</div>' +
        '<footer class="ls-rag-pdf-foot"><span>' + esc(L("Enzyklopädie · Krake", "Encyclopædia · Kraken")) + '</span><span>' + esc(L("Simulation · fiktive Datei", "Simulation · fictional file")) + '</span><span>' + esc(L("Krake · Seite 417", "Octopus · page 417")) + '</span></footer>' +
      '</div>';
    }

    function railHTML() {
      return ARTICLE.paragraphs.map(function (p) {
        return '<div class="ls-rag-rail-row" data-c="' + p.id + '"><div class="ls-rag-rail-top"><b>' + p.id + '</b><span class="ls-rag-rail-heading">' + esc(p.heading) + '</span></div><div class="ls-rag-rail-angle"><b>' + p.id + ' · ∠ ' + p.angle + '°</b><span class="ls-rag-rail-fit"><i style="width:' + Math.round(fitValue(p) * 100) + '%"></i></span></div><code>[' + esc(vectorText(p)) + ']</code><span class="ls-rag-rail-strip">' + vectorStrip(p) + '</span></div>';
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
            '<div class="ls-rag-rail"><div class="ls-rag-rail-head">' + esc(L("Nur Text · Chunk-Vektoren", "Text only · chunk vectors")) + '</div><div class="ls-rag-rail-list">' + railHTML() + '</div></div>' +
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
        pill.innerHTML = "<b>🔒 Kontext</b><em>nur Modell</em>";
        chunk.appendChild(pill);
      }
    });

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

    var state = { step: 0, timers: [], pickerOpen: false, textFitted: false };

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
        if (docStatus) docStatus.textContent = L(CHUNK_COUNT + " Chunks · " + CHUNK_COUNT + " Vektoren", CHUNK_COUNT + " chunks · " + CHUNK_COUNT + " vectors");
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
        if (flow.scrollWidth <= available + 1) { best = mid; lo = mid; } else { hi = mid; }
      }
      body.style.setProperty("--rag-pdf-fs", best.toFixed(2) + "px");
      fillers.forEach(function (n) { n.style.display = ""; });
      state.textFitted = true;
    }

    function resetChunkStates() {
      docEl.classList.remove("is-angling");
      Array.prototype.forEach.call(docEl.querySelectorAll(".ls-rag-pdf-chunk"), function (chunk) {
        chunk.classList.remove("is-angle-in", "is-fit", "is-out", "is-context");
      });
      Array.prototype.forEach.call(el.querySelectorAll(".ls-rag-rail-row"), function (row) {
        row.classList.remove("is-angle-in", "is-fit", "is-out", "is-context");
      });
    }

    function stepThree() {
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
        SELECTED.forEach(function (id) {
          var chunk = docEl.querySelector('.ls-rag-pdf-chunk[data-c="' + id + '"]');
          var row = el.querySelector('.ls-rag-rail-row[data-c="' + id + '"]');
          if (chunk) chunk.classList.add("is-context");
          if (row) row.classList.add("is-context");
        });
        selfCheck();
      }, 1900));
      state.timers.push(setTimeout(function () { showAnswer(); selfCheck(); }, 3100));
    }
    function setCiteFocus(id) {
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
      typingEl.hidden = true;
      answerEl.innerHTML = esc(ANSWER) + ' <span class="ls-rag-cite" data-cite="C1" tabindex="0">[C1]</span><span class="ls-rag-cite" data-cite="C2" tabindex="0">[C2]</span>';
      bindCiteHover();
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
            ? L(CHUNK_COUNT + " Chunks · " + CHUNK_COUNT + " Vektoren", CHUNK_COUNT + " chunks · " + CHUNK_COUNT + " vectors")
            : L(CHUNK_COUNT + " Chunks · 2 im Kontext", CHUNK_COUNT + " chunks · 2 in context");
      }
      if (hasAnswer) {
        answerEl.innerHTML = '<span class="ls-rag-partial">' + esc(L("Ein Krake hat …", "An octopus has …")) + '</span>';
      }
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

    function applyStep() {
      el.setAttribute("data-step", String(state.step));
      Array.prototype.forEach.call(stepsEl, function (s, i) {
        s.classList.toggle("is-on", i === state.step);
        s.classList.toggle("is-done", i < state.step);
      });
      progressEl.textContent = (state.step + 1) + " / " + STEPS.length;
      picker.hidden = true;
      docEl.classList.toggle("is-on", state.step >= 1);
      resetChunkStates();
      setChat();
      if (state.step === 0) {
        state.pickerOpen = false;
        state.textFitted = false;
        docStatus.textContent = "";
        attachBtn.classList.add("is-hint");
      } else if (state.step === 1) {
        docStatus.textContent = L("Scan läuft …", "Scanning …");
        startScan();
      } else if (state.step === 2) {
        completeScan();
        docStatus.textContent = L(CHUNK_COUNT + " Chunks · " + CHUNK_COUNT + " Vektoren", CHUNK_COUNT + " chunks · " + CHUNK_COUNT + " vectors");
      } else if (state.step === 3) {
        completeScan();
        docStatus.textContent = L(CHUNK_COUNT + " Chunks · 2 im Kontext", CHUNK_COUNT + " chunks · 2 in context");
        stepThree();
      }
      if (state.step === 1) requestAnimationFrame(function () { fitPdfText(); });
      statusEl.textContent = state.step === 0
        ? ""
        : state.step === 1
          ? L("Der Agent scannt den Text außerhalb des LLM. Jeder Abschnitt wird ein Chunk mit eigenem Vektor.", "The agent scans the text outside the LLM. Each paragraph becomes a chunk with its own vector.")
          : state.step === 2
            ? ""
            : L("C1 und C2 liegen unter 35° und wandern in den unsichtbaren Kontext.", "C1 and C2 lie below 35° and move into the invisible context.");
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
      applyStep();
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

    applyStep();
    el.__lsRagSelfCheck = selfCheck;

    return {
      update: function () { go(0); },
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
      resize: function () { requestAnimationFrame(function () { fitPdfText(true); selfCheck(); }); },
      destroy: function () { clearTimers(); el.remove(); }
    };
  }

  core.register("agentrag", agentRagScene);
})();
