(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function agentRagScene(root, api) {
    var DE = api.lang === "de";
    var esc = api.esc;
    function L(de, en) { return DE ? de : en; }
    var ANGLE_LIMIT = 35;
    var CHUNKS = [
      {
        id: "C1", angle: 14, score: 0.97, kind: "current",
        verdict: L("passt", "fits"),
        short: L("Kraken haben drei Herzen: zwei Kiemenherzen und ein Körperherz.", "Octopuses have three hearts: two gill hearts and one body heart."),
        full: L("Kraken gehören zu den Kopffüßern. Sie besitzen drei Herzen: zwei Kiemenherzen pumpen das Blut durch die Kiemen, ein Körperherz versorgt den Rest des Körpers. Beim Schwimmen pausiert das Körperherz zeitweise, deshalb kriechen Kraken lieber über den Meeresboden.", "Octopuses are cephalopods. They have three hearts: two gill hearts pump blood through the gills, and one body heart supplies the rest of the body. When swimming, the body heart pauses at times, which is why octopuses prefer crawling over the sea floor.")
      },
      {
        id: "C2", angle: 58, score: 0.44, kind: "other",
        verdict: L("nur teilweise", "only partly"),
        short: L("Ihr Blut ist blau: Hämocyanin bindet Sauerstoff mit Kupfer.", "Their blood is blue: hemocyanin binds oxygen with copper."),
        full: L("Ihr Blut ist blau. Der Sauerstoffträger Hämocyanin enthält Kupfer statt Eisen wie das Hämoglobin der Wirbeltiere. In kaltem, sauerstoffarmem Wasser ist das eine effiziente Lösung.", "Their blood is blue. The oxygen carrier hemocyanin contains copper instead of iron like the hemoglobin of vertebrates. In cold, oxygen-poor water this is an efficient solution.")
      },
      {
        id: "C3", angle: 47, score: 0.62, kind: "other",
        verdict: L("nur teilweise", "only partly"),
        short: L("Jeder der acht Arme hat ein eigenes Nervennetz; die Saugnäpfe schmecken.", "Each of the eight arms has its own nerve net; the suckers taste."),
        full: L("Ein Krake hat acht Arme, und jeder Arm besitzt ein eigenes Nervennetz. Zusammen enthalten die Arme etwa zwei Drittel aller Neuronen. Die Saugnäpfe können chemische Reize aufnehmen und sozusagen schmecken.", "An octopus has eight arms, and each arm has its own nerve net. Together the arms contain about two thirds of all neurons. The suckers can detect chemical stimuli and, so to speak, taste.")
      },
      {
        id: "C4", angle: 71, score: 0.31, kind: "other",
        verdict: L("nicht relevant", "not relevant"),
        short: L("Kraken schreiben RNA in Nervenzellen um.", "Octopuses edit RNA in nerve cells."),
        full: L("Kraken können ihre RNA in Nervenzellen umschreiben. Dabei werden einzelne Basen verändert, sodass Proteine entstehen, die nicht exakt im Genom stehen. Das erweitert die Anpassungsfähigkeit ohne die langsame Veränderung des Erbguts.", "Octopuses can edit their RNA in nerve cells. Individual bases are changed so that proteins are produced that are not exactly encoded in the genome. This extends adaptability without the slow change of the genome.")
      },
      {
        id: "C5", angle: 66, score: 0.36, kind: "other",
        verdict: L("nicht relevant", "not relevant"),
        short: L("Chromatophoren und Papillen lassen sie Farbe und Textur wechseln.", "Chromatophores and papillae let them change colour and texture."),
        full: L("Die Haut enthält Chromatophoren, Iridophoren und Papillen. Mit ihnen wechseln Kraken Farbe, Glanz und Oberflächenstruktur in Sekunden und verschmelzen mit Felsen, Sand oder Algen.", "The skin contains chromatophores, iridophores, and papillae. With them octopuses change colour, shine, and surface structure in seconds and blend in with rocks, sand, or algae.")
      }
    ];
    var GUIDE = [
      L("kraken.pdf hochladen und den Text lesen", "Upload kraken.pdf and read the text"),
      L("Text in C1–C5 chunken", "Split the text into C1–C5"),
      L("Chunks bewerten: Winkel zum Kontext", "Score the chunks: angle to the context"),
      L("C1 in den unsichtbaren Kontext legen", "Put C1 into the invisible context"),
      L("„Ein Krake hat …“ mit C1 vervollständigen", "Complete “An octopus has …” with C1")
    ];
    var state = { step: -1, progress: 0, selected: {}, reading: -1, timers: [], interval: 0 };
    var el = document.createElement("div");
    el.className = "ls-ar-scene";
    el.innerHTML =
      '<div class="ls-ar-head" data-tip="' + L("Der Agent liest die Datei außerhalb des LLM, bevor das Modell antwortet.", "The agent reads the file outside the LLM before the model answers.") + '"><span class="ls-ar-badge">' + L("Dynamisches RAG", "Dynamic RAG") + '</span><span class="ls-ar-sub">' + L("kraken.pdf liegt außerhalb des LLM. Der Agent liest, chunkt und bewertet die Datei, bevor das Modell antwortet.", "kraken.pdf sits outside the LLM. The agent reads, chunks, and scores the file before the model answers.") + '</span><span class="ls-ar-guide" data-tip="' + L("Zeigt den aktuellen Schritt der Kette Datei, Chunks, Winkel, Kontext, Antwort.", "Shows the current step of the chain file, chunks, angle, context, answer.") + '"></span></div>' +
      '<div class="ls-ar-query" data-tip="' + L("Die Frage, die später mit dem abgerufenen Chunk beantwortet wird.", "The question that is later answered with the retrieved chunk.") + '"><span>' + L("Frage", "Question") + '</span><b>' + L("Wie viele Herzen hat ein Krake?", "How many hearts does an octopus have?") + '</b><em>' + L("Die Datei ist fiktiv, die Fakten darin sind belegt.", "The file is fictional; the facts in it are sourced.") + '</em></div>' +
      '<div class="ls-ar-grid">' +
        '<section class="ls-ar-col ls-ar-reader" data-tip="' + L("Die Datei liegt außerhalb des Modells; hier wird sie gelesen und zerlegt.", "The file sits outside the model; here it is read and split.") + '">' +
          '<div class="ls-ar-col-head"><b>kraken.pdf</b><span>' + L("außerhalb des LLM · Datei", "outside the LLM · file") + '</span></div>' +
          '<div class="ls-ar-filecard" data-tip="' + L("Datei mit Ladebalken; der Agent liest sie Absatz für Absatz.", "The file with a progress bar; the agent reads it paragraph by paragraph.") + '">' +
            '<span class="ls-ar-fileicon">PDF</span>' +
            '<div class="ls-ar-filemeta"><b>kraken.pdf</b><small>' + L("1,2 KB · 5 Absätze · fiktives Buch", "1.2 KB · 5 paragraphs · fictional book") + '</small></div>' +
            '<button type="button" class="ls-ar-upload" data-tip="' + L("Startet das Lesen, Chunken und Bewerten der Datei.", "Starts reading, chunking, and scoring the file.") + '">' + L("Hochladen", "Upload") + '</button>' +
            '<div class="ls-ar-progress" data-tip="' + L("Fortschritt beim Lesen der Datei.", "Progress reading the file.") + '"><i></i></div>' +
            '<small class="ls-ar-progress-label"></small>' +
          '</div>' +
          '<code class="ls-ar-cmd" data-tip="' + L("Der Agentenbefehl, der gerade außerhalb des LLM läuft.", "The agent command currently running outside the LLM.") + '"></code>' +
          '<details class="ls-ar-book-more"><summary>' + L("Dateitext anzeigen", "Show file text") + '</summary><div class="ls-ar-book" data-tip="' + L("Der Dateitext in fünf Absätzen, die zu Chunks werden.", "The file text in five paragraphs that become chunks.") + '"></div></details>' +
        '</section>' +
        '<section class="ls-ar-col ls-ar-chunks" data-tip="' + L("Die Chunks werden bewertet: nur C1 liegt unter dem Grenzwinkel.", "The chunks are scored: only C1 is below the angle threshold.") + '">' +
          '<div class="ls-ar-col-head"><b>' + L("Chunks", "Chunks") + '</b><span>' + L("außerhalb des LLM · bewertet", "outside the LLM · scored") + '</span></div>' +
          '<div class="ls-ar-angles" data-tip="' + L("Die Winkel der Chunks zur Frage; unter 35 Grad heißt passend.", "The chunk angles to the question; below 35 degrees means it fits.") + '"></div>' +
          '<div class="ls-ar-list" data-tip="' + L("Jeder Chunk mit Urteil, Winkel und Score; der passende wird in den Kontext gelegt.", "Each chunk with verdict, angle, and score; the fitting one enters the context.") + '"></div>' +
          '<div class="ls-ar-measure" data-tip="' + L("Vergleicht alle Chunk-Winkel mit dem Grenzwinkel.", "Compares all chunk angles with the threshold.") + '"></div>' +
        '</section>' +
        '<section class="ls-ar-col ls-ar-chat-col" data-tip="' + L("Das LLM sieht nur den unsichtbaren Kontext, nicht die Datei.", "The LLM sees only the invisible context, not the file.") + '">' +
          '<div class="ls-ar-col-head"><b>' + L("KI-Chat", "AI chat") + '</b><span>' + L("im LLM · Antwort", "inside the LLM · answer") + '</span></div>' +
          '<div class="ls-ar-phone"><div class="ls-ar-phone-frame"><div class="ls-ar-phone-notch"></div>' +
            '<div class="ls-ar-phone-screen ia-chat-screen is-active">' +
              '<div class="ia-chat-appbar"><span>' + L("KI-Chat", "AI chat") + '</span><i class="ia-chat-live" aria-hidden="true"></i></div>' +
              '<div class="ia-chat-thread">' +
                '<div class="ls-ar-chat-empty">' + L("Lade kraken.pdf hoch, um aus dem Buch zu antworten.", "Upload kraken.pdf to answer from the book.") + '</div>' +
                '<div class="ia-chat-msg is-user ls-ar-chat-filemsg" hidden><span class="ia-chat-role">' + L("Du", "You") + '</span><span class="ia-chat-bubble ls-ar-chat-file"><span class="ls-ar-chat-pdf">PDF</span><span><b>kraken.pdf</b><small class="ls-ar-file-status"></small></span><span class="ls-ar-file-progress"><i></i></span></span></div>' +
                '<div class="ia-chat-msg is-user ls-ar-chat-questionmsg" hidden><span class="ia-chat-role">' + L("Du", "You") + '</span><span class="ia-chat-bubble">' + L("Wie viele Herzen hat ein Krake?", "How many hearts does an octopus have?") + '</span></div>' +
                '<div class="ia-chat-msg is-ai ls-ar-chat-aimsg" hidden><span class="ia-chat-role">LLM</span><span class="ia-chat-bubble ls-ar-chat-answer"></span><span class="ls-ar-typing" aria-hidden="true"><i></i><i></i><i></i></span></div>' +
              '</div>' +
              '<div class="ia-chat-compose"><button type="button" class="ls-ar-attach" aria-label="' + L("kraken.pdf anhängen", "Attach kraken.pdf") + '">📎</button><span class="ia-chat-placeholder">' + L("Nachricht", "Message") + '</span><span class="ia-chat-input"></span><i class="ia-chat-send" aria-hidden="true"></i></div>' +
            '</div>' +
          '</div></div>' +
          '<div class="ls-ar-context" data-tip="' + L("Nur der ausgewählte Chunk liegt im Kontext; die Datei selbst sieht das Modell nicht.", "Only the selected chunk sits in the context; the model never sees the file itself.") + '"><div class="ls-ar-context-head"><span class="ls-ar-lock" aria-hidden="true">🔒</span>' + L("Unsichtbarer Kontext · nur Modell", "Invisible context · model only") + '</div><div class="ls-ar-context-body"></div></div>' +
        '</section>' +
      '</div>' +
      '<div class="ls-ar-status" aria-live="polite" data-tip="' + L("Erklärt, was im aktuellen Schritt im Hintergrund passiert.", "Explains what happens in the background at the current step.") + '"></div>' +
      '<div class="ls-ar-bottom">' +
        '<button type="button" class="ls-ar-next" data-tip="' + L("Geht einen Schritt weiter: lesen, chunken, bewerten, Kontext, Antwort.", "Moves one step ahead: read, chunk, score, context, answer.") + '"></button>' +
        '<div class="ls-ar-loop" data-tip="' + L("Die Kette der Schritte; der aktive Schritt leuchtet.", "The chain of steps; the active step lights up.") + '"><span>' + L("Datei", "file") + '</span><i>→</i><span>' + L("Chunks", "chunks") + '</span><i>→</i><span>' + L("Winkel", "angle") + '</span><i>→</i><span>' + L("unsichtbarer Kontext", "invisible context") + '</span><i>→</i><span>' + L("Antwort", "answer") + '</span></div>' +
        '<button type="button" class="ls-ar-reset" data-tip="' + L("Setzt die Datei, die Chunks und den Kontext zurück.", "Resets the file, the chunks, and the context.") + '">' + L("Zurücksetzen", "Reset") + '</button>' +
      '</div>';
    root.appendChild(el);
    var uploadBtns = el.querySelectorAll(".ls-ar-upload, .ls-ar-attach");
    var progressEl = el.querySelector(".ls-ar-progress i");
    var progressLabel = el.querySelector(".ls-ar-progress-label");
    var cmdEl = el.querySelector(".ls-ar-cmd");
    var bookEl = el.querySelector(".ls-ar-book");
    var listEl = el.querySelector(".ls-ar-list");
    var anglesEl = el.querySelector(".ls-ar-angles");
    var measureEl = el.querySelector(".ls-ar-measure");
    var guideEl = el.querySelector(".ls-ar-guide");
    var statusEl = el.querySelector(".ls-ar-status");
    var nextBtn = el.querySelector(".ls-ar-next");
    var loopEl = el.querySelector(".ls-ar-loop");
    var phoneEl = el.querySelector(".ls-ar-phone-screen");
    var emptyEl = el.querySelector(".ls-ar-chat-empty");
    var fileMsg = el.querySelector(".ls-ar-chat-filemsg");
    var questionMsg = el.querySelector(".ls-ar-chat-questionmsg");
    var aiMsg = el.querySelector(".ls-ar-chat-aimsg");
    var answerEl = el.querySelector(".ls-ar-chat-answer");
    var typingEl = el.querySelector(".ls-ar-typing");
    var fileStatus = el.querySelector(".ls-ar-file-status");
    var fileProgress = el.querySelector(".ls-ar-file-progress i");
    var contextBody = el.querySelector(".ls-ar-context-body");
    var selectedChunks = function () { return CHUNKS.filter(function (c) { return !!state.selected[c.id]; }); };
    var evaluated = function () { return state.step >= 2; };
    var hasBook = function () { return state.step >= 0; };
    function clearTimers() {
      state.timers.forEach(function (id) { clearTimeout(id); clearInterval(id); });
      state.timers = [];
      if (state.interval) { clearInterval(state.interval); state.interval = 0; }
    }
    function reset() {
      clearTimers();
      state.step = -1;
      state.progress = 0;
      state.selected = {};
      state.reading = -1;
      render();
    }
    function startUpload() {
      if (state.step >= 0) { reset(); }
      clearTimers();
      state.step = 0;
      state.progress = 0;
      state.selected = {};
      render();
      state.interval = setInterval(function () {
        state.progress = Math.min(100, state.progress + 5);
        state.reading = Math.min(CHUNKS.length - 1, Math.floor(state.progress / 20));
        if (state.progress >= 100) {
          clearInterval(state.interval);
          state.interval = 0;
          state.step = 1;
          state.reading = -1;
          render();
          state.timers.push(setTimeout(function () { state.step = 2; render(); }, 600));
          state.timers.push(setTimeout(function () { state.step = 3; state.selected.C1 = true; render(); }, 1300));
          state.timers.push(setTimeout(function () { state.step = 4; render(); }, 2100));
        } else {
          render();
        }
      }, 70);
    }
    function renderUpload() {
      uploadBtns.forEach(function (b) {
        b.hidden = state.step >= 0;
        b.setAttribute("aria-pressed", state.step >= 0 ? "true" : "false");
      });
      progressEl.style.width = state.progress + "%";
      progressLabel.textContent = state.step < 0
        ? L("Bereit zum Hochladen.", "Ready to upload.")
        : state.step === 0
          ? L("Liest kraken.pdf … " + state.progress + " %", "Reading kraken.pdf … " + state.progress + "%")
          : state.step === 1
            ? L("5 Chunks erkannt.", "5 chunks detected.")
            : state.step === 2
              ? L("C1 passt (14° < 35°); C2–C5 verworfen.", "C1 fits (14° < 35°); C2–C5 discarded.")
              : state.step === 3
                ? L("C1 im unsichtbaren Kontext.", "C1 in the invisible context.")
                : L("Antwort mit C1 belegt.", "Answer grounded in C1.");
      cmdEl.textContent = state.step < 0
        ? L('book.open("kraken.pdf")', 'book.open("kraken.pdf")')
        : state.step === 0
          ? L('book.read("kraken.pdf")  // außerhalb des LLM', 'book.read("kraken.pdf")  // outside the LLM')
          : state.step === 1
            ? "chunk(5)"
            : state.step === 2
              ? "score(chunks) · angle <= 35°"
              : state.step === 3
                ? "context.push(C1)  // invisible"
                : "generate()";
    }
    function renderBook() {
      bookEl.innerHTML = CHUNKS.map(function (c, i) {
        var reading = state.step === 0 && state.reading === i;
        var chunked = state.step >= 1;
        return '<div class="ls-ar-book-chunk' + (reading ? " is-reading" : "") + (chunked ? " is-chunked" : "") + '" data-tip="' + L("Ein Absatz der Datei; der Rahmen zeigt, ob er schon als Chunk erkannt ist.", "One paragraph of the file; the frame shows whether it is already a chunk.") + '"><b>' + c.id + '</b><p>' + esc(c.full) + '</p></div>';
      }).join("");
    }
    function renderChunks() {
      var ev = evaluated();
      listEl.innerHTML = CHUNKS.map(function (c) {
        var on = !!state.selected[c.id];
        var verdict = ev ? c.verdict : L("wartet", "waiting");
        var angle = ev ? "∠ " + c.angle + "°" : "∠ —";
        var score = ev ? c.score.toFixed(2) : "—";
        var pct = ev ? Math.round(c.score * 100) : 0;
        var auto = on
          ? L("im unsichtbaren Kontext", "in invisible context")
          : ev && c.kind === "current"
            ? L("passt, wird eingefügt", "fits, inserting")
            : ev
              ? L("verworfen", "discarded")
              : L("wird gelesen", "reading");
        return '<div class="ls-ar-snip' + (on ? " is-in" : "") + '" data-tip="' + L("Urteil, Winkel und Score eines Chunks; der Balken zeigt den Score.", "Verdict, angle, and score of a chunk; the bar shows the score.") + '">' +
          '<div class="ls-ar-snip-head"><b>' + c.id + '</b><span>' + L("kraken.pdf", "kraken.pdf") + '</span><em class="' + (ev ? "is-" + c.kind : "is-pending") + '">' + esc(verdict) + '</em></div>' +
          '<p>' + esc(c.short) + '</p>' +
          '<div class="ls-ar-score"><span class="ls-ar-track"><i class="' + (c.score >= 0.7 ? "is-high" : c.score >= 0.4 ? "is-mid" : "is-low") + '" style="width:' + pct + '%"></i></span><b class="ls-ar-angle">' + angle + '</b><span>' + score + '</span></div>' +
          '<div class="ls-ar-auto' + (on ? " is-on" : "") + '">' + auto + '</div>' +
        '</div>';
      }).join("");
      measureEl.innerHTML = ev
        ? '<span class="ls-ar-limit">' + L("Grenzwinkel 35°", "threshold 35°") + '</span>' +
          CHUNKS.map(function (c) {
            var fit = c.angle <= ANGLE_LIMIT;
            return '<b class="' + (fit ? "is-fit" : "is-out") + '">' + c.id + ' ' + c.angle + '° ' + (fit ? "✓" : "✗") + '</b>';
          }).join("")
        : "";
    }
    function renderAngles() {
      var show = evaluated();
      var ox = 42, oy = 132, r = 96, qr = 112;
      var pts = [[ox, oy]];
      for (var a = 0; a <= ANGLE_LIMIT; a += 2) pts.push([ox + Math.cos(a * Math.PI / 180) * r, oy - Math.sin(a * Math.PI / 180) * r]);
      var sector = "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L") + " Z";
      var svg = '<svg class="ls-ar-vectors" viewBox="0 0 280 160" role="img">' +
        '<path class="ls-ar-sector" d="' + sector + '"/>' +
        '<line class="ls-ar-axis" x1="' + ox + '" y1="' + (oy + 7) + '" x2="' + (ox + qr + 8) + '" y2="' + (oy + 7) + '"/>' +
        '<line class="ls-ar-axis" x1="' + ox + '" y1="' + (oy + 7) + '" x2="' + ox + '" y2="' + (oy - r - 2) + '"/>' +
        '<line class="ls-ar-query-vec" x1="' + ox + '" y1="' + oy + '" x2="' + (ox + qr) + '" y2="' + oy + '"/>' +
        '<path class="ls-ar-query-head" d="M' + (ox + qr) + ' ' + oy + ' l -9 -4 l 0 8 z"/>' +
        '<text class="ls-ar-vec-label is-query" x="' + (ox + qr - 8) + '" y="' + (oy + 17) + '" text-anchor="end">' + L("Kontext", "context") + '</text>';
      CHUNKS.forEach(function (c) {
        var ang = c.angle * Math.PI / 180;
        var x = ox + Math.cos(ang) * r, y = oy - Math.sin(ang) * r;
        var on = c.angle <= ANGLE_LIMIT;
        var picked = !!state.selected[c.id];
        var anchor = Math.cos(ang) >= 0 ? "start" : "end";
        var lx = x + (Math.cos(ang) >= 0 ? 7 : -7);
        var ly = y - 5 + (c.id === "C4" ? 12 : 0);
        svg += '<line class="ls-ar-chunk-vec' + (on ? " is-in" : "") + (picked ? " is-picked" : "") + '" x1="' + ox + '" y1="' + oy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' +
          '<circle class="ls-ar-vec-dot' + (on ? " is-in" : "") + (picked ? " is-picked" : "") + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (picked ? 4.2 : 3) + '"/>' +
          '<text class="ls-ar-vec-label' + (on ? " is-in" : "") + (picked ? " is-picked" : "") + '" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="' + anchor + '">' + c.id + '</text>';
      });
      anglesEl.innerHTML = '<div class="ls-ar-angles-head"><b>' + L("Winkel zum Kontext", "angles to the context") + '</b><span>' + L("unter 35° → Kontext", "below 35° → context") + '</span></div>' + svg + '</svg>';
      anglesEl.classList.toggle("is-reserved", !show);
    }
    function renderChat() {
      var booked = hasBook();
      emptyEl.hidden = booked;
      fileMsg.hidden = !booked;
      questionMsg.hidden = !booked;
      aiMsg.hidden = !booked;
      phoneEl.classList.toggle("is-sent", booked);
      phoneEl.classList.toggle("is-answering", booked);
      if (!booked) {
        answerEl.textContent = "";
        fileStatus.textContent = "";
        fileProgress.style.width = "0%";
        typingEl.hidden = true;
        return;
      }
      fileStatus.textContent = state.step === 0
        ? L("wird gelesen … " + state.progress + " %", "reading … " + state.progress + "%")
        : state.step === 1
          ? L("5 Chunks erkannt", "5 chunks detected")
          : state.step === 2
            ? L("bewertet: C1 passt", "scored: C1 fits")
            : state.step === 3
              ? L("C1 im Kontext", "C1 in context")
              : L("Antwort bereit", "answer ready");
      fileProgress.style.width = state.progress + "%";
      typingEl.hidden = state.step >= 4;
      if (state.step < 4) {
        answerEl.innerHTML = '<span class="ls-ar-answer-partial">' + L("Ein Krake hat …", "An octopus has …") + '</span>';
      } else {
        answerEl.innerHTML = L("Ein Krake hat drei Herzen: zwei Kiemenherzen und ein Körperherz.", "An octopus has three hearts: two gill hearts and one body heart.") +
          ' <span class="ls-ar-cite" title="' + L("Quelle: C1 aus kraken.pdf", "Source: C1 from kraken.pdf") + '">[C1]</span>';
      }
    }
    function renderContext() {
      var selected = selectedChunks();
      if (!selected.length) {
        contextBody.innerHTML = '<span class="ls-ar-context-empty">' + L("Noch kein Chunk im unsichtbaren Kontext.", "No chunk in the invisible context yet.") + '</span>';
        return;
      }
      contextBody.innerHTML = selected.map(function (c) {
        return '<div class="ls-ar-ctx-card" data-tip="' + L("Dieser Chunk liegt im unsichtbaren Kontext und stützt die Antwort.", "This chunk sits in the invisible context and grounds the answer.") + '"><div><b>' + c.id + '</b><span>' + L("kraken.pdf", "kraken.pdf") + '</span></div><p>' + esc(c.short) + '</p></div>';
      }).join("");
    }
    function renderNext() {
      nextBtn.classList.toggle("is-call", state.step < 4);
      nextBtn.textContent = state.step < 0
        ? L("Weiter: kraken.pdf hochladen", "Next: upload kraken.pdf")
        : state.step === 0
          ? L("Weiter: Chunks erkennen", "Next: detect chunks")
          : state.step === 1
            ? L("Weiter: Chunks bewerten", "Next: score chunks")
            : state.step === 2
              ? L("Weiter: C1 in den Kontext", "Next: put C1 in context")
              : state.step === 3
                ? L("Weiter: Antwort", "Next: answer")
                : L("Neu starten", "Restart");
    }
    function advance() {
      if (state.step < 0) { startUpload(); return; }
      clearTimers();
      if (state.step < 4) {
        state.step++;
        if (state.step >= 3) state.selected.C1 = true;
        render();
        return;
      }
      reset();
    }
    function renderStatus() {
      var text = state.step < 0
        ? L("Warte auf kraken.pdf. Klicke „Weiter“ oder „Hochladen“; danach erklärt jeder Schritt, was im Hintergrund passiert.", "Waiting for kraken.pdf. Click “Next” or “Upload”; after that, each step explains what happens in the background.")
        : state.step === 0
          ? L("Der Agent liest die Datei außerhalb des LLM.", "The agent reads the file outside the LLM.")
          : state.step === 1
            ? L("Der Text ist in C1–C5 zerlegt.", "The text is split into C1–C5.")
            : state.step === 2
              ? L("C1 ist mit 14° der einzige Chunk unter dem Grenzwinkel.", "C1 at 14° is the only chunk below the threshold.")
              : state.step === 3
                ? L("C1 liegt jetzt im unsichtbaren Kontext; das Modell sieht ihn beim nächsten Token.", "C1 is now in the invisible context; the model sees it at the next token.")
                : L("Die Antwort ist mit C1 belegt.", "The answer is grounded in C1.");
      statusEl.textContent = text;
    }
    function renderLoop() {
      var stage = state.step < 0 ? 0 : Math.min(4, state.step + (state.step === 0 ? 0 : 0));
      var map = state.step < 0 ? -1 : state.step === 0 ? 0 : state.step === 1 ? 1 : state.step === 2 ? 2 : state.step === 3 ? 3 : 4;
      Array.prototype.forEach.call(loopEl.querySelectorAll("span"), function (s, i) {
        s.classList.toggle("is-on", i === map);
      });
    }
    function renderGuide() {
      guideEl.textContent = state.step < 0
        ? L("Datei hochladen: lesen → chunken → bewerten → Kontext → Antwort", "Upload the file: read → chunk → score → context → answer")
        : L("Schritt " + (state.step + 1) + " / " + GUIDE.length + " · ", "Step " + (state.step + 1) + " / " + GUIDE.length + " · ") + GUIDE[state.step];
    }
    function render() {
      renderUpload();
      renderBook();
      renderChunks();
      renderAngles();
      renderChat();
      renderContext();
      renderNext();
      renderStatus();
      renderLoop();
      renderGuide();
    }
    uploadBtns.forEach(function (b) { b.addEventListener("click", startUpload); });
    nextBtn.addEventListener("click", advance);
    el.querySelector(".ls-ar-reset").addEventListener("click", reset);
    render();
    return {
      update: function () { reset(); },
      next: function () {
        clearTimers();
        if (state.step < 4) {
          state.step++;
          if (state.step >= 3) state.selected.C1 = true;
          render();
          return true;
        }
        return false;
      },
      prev: function () {
        clearTimers();
        if (state.step >= 0) {
          state.step--;
          if (state.step < 3) state.selected = {};
          render();
          return true;
        }
        return false;
      },
      hasNext: function () { return state.step < 4; },
      hasPrev: function () { return state.step >= 0; },
      resize: function () {},
      destroy: function () { clearTimers(); el.remove(); }
    };
  }
  core.register("agentrag", agentRagScene);
})();
