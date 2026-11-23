(function () {
  "use strict";

  var line = document.getElementById("baust-line");
  var packet = document.getElementById("baust-packet");
  var inspect = document.getElementById("baust-inspect");
  var stepBtn = document.querySelector("[data-baust-step]");
  var playBtn = document.querySelector("[data-baust-play]");
  var resetBtn = document.querySelector("[data-baust-reset]");
  var progressFill = document.querySelector("[data-baust-progress]");
  var progressLabel = document.querySelector("[data-baust-progress-label]");
  if (!line || !inspect) return;

  var T = function (de, en) { return window.Proto ? Proto.t(de, en) : de; };
  var index = -1;
  var playing = false;
  var playTimer = 0;

  var ICONS = [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="6" height="12" rx="1.5"/><rect x="15" y="6" width="6" height="12" rx="1.5"/><path d="M9 12h6"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/><circle cx="8" cy="7" r="1.4" fill="currentColor" stroke="none"/><circle cx="14" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="10" cy="17" r="1.4" fill="currentColor" stroke="none"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M3 15c2.5 0 2.5-7 5-7s2.5 7 5 7 2.5-7 5-7 2.5 7 3 7"/><path d="M3 20h18" opacity=".4"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="6" rx="1.5"/><rect x="4" y="14" width="16" height="6" rx="1.5"/><path d="M12 10v4"/><path d="M9.5 12.5L12 14l2.5-1.5"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 19V9M9 19V5M14 19v-8M19 19v-4"/><path d="M3 21h18" opacity=".4"/></svg>'
  ];

  var S = {};

  function buildStrings() {
    S = {
      labels: [
        T("Tokenizer", "Tokenizer"),
        T("Embedding", "Embedding"),
        T("Position", "Position"),
        T("Transformer", "Transformer"),
        T("Unembedding", "Unembedding")
      ],
      subs: [
        T("Text zu Tokens", "text to tokens"),
        T("Token zu Vektor", "token to vector"),
        T("Ort im Satz", "place in the sentence"),
        T("Kontext und FFN", "context and FFN"),
        T("Vektor zu Wörtern", "vector to words")
      ],
      steps: [
        {
          title: T("Text wird zu Tokens", "Text becomes tokens"),
          desc: T("Der Text wird in Stücke zerlegt. Jedes Stück bekommt eine ID. Dieselbe Zeichenfolge bekommt immer dieselbe ID.", "The text is split into pieces. Each piece gets an ID. The same string always gets the same ID.")
        },
        {
          title: T("Aus der ID wird ein Vektor", "The ID becomes a vector"),
          desc: T("Die ID zeigt auf eine Zeile der Embedding-Tabelle. Diese Zeile ist der Startvektor des Tokens, hier schematisch als Farbstreifen.", "The ID points to a row of the embedding table. That row is the token's starting vector, shown here schematically as a colour strip.")
        },
        {
          title: T("Die Position kommt dazu", "The position is added"),
          desc: T("Ohne Positionsangabe wäre „Katze am Anfang“ gleich „Katze am Ende“. Ein Positionsvektor aus Sinus und Kosinus markiert den Platz.", "Without a position, “cat at the start” would equal “cat at the end”. A position vector made of sine and cosine marks the place.")
        },
        {
          title: T("Attention und FFN verändern den Vektor", "Attention and FFN change the vector"),
          desc: T("Attention mischt Informationen aus dem Kontext, das FFN verschiebt den Punkt. Die Residualverbindung trägt den alten Zustand weiter.", "Attention mixes information from the context, the FFN shifts the point. The residual connection carries the old state forward.")
        },
        {
          title: T("Der Vektor wird wieder zu Wörtern", "The vector becomes words again"),
          desc: T("Der letzte Vektor wird über W_U zu Logits. Softmax macht daraus eine Verteilung über das nächste Token. Oben steht der wahrscheinlichste Kandidat.", "The final vector becomes logits through W_U. Softmax turns them into a distribution over the next token. The most likely candidate is on top.")
        }
      ],
      intro: {
        title: T("Die Reise eines Tokens", "The journey of a token"),
        desc: T("Ein Satz wird zum Paket und läuft durch fünf Stationen. Drücke Schritt, um jede Station anzuhalten, oder Play für den ganzen Durchlauf.", "A sentence becomes a parcel and runs through five stations. Press Step to stop at each one, or Play for the whole run."),
        hint: T("Klicke eine Station an, um direkt dorthin zu springen.", "Click a station to jump straight to it.")
      },
      packetStart: T("Die Katze sitzt auf der Matte", "The cat sat on the mat"),
      packet: [
        T("Die · Kat · ze · sitzt", "The · cat · sat"),
        T("768 Dimensionen", "768 dimensions"),
        T("Position 4", "position 4"),
        T("12 Schichten", "12 layers"),
        T("Matte · 61 %", "mat · 61 %")
      ],
      step: T("Schritt", "Step"),
      play: T("Play", "Play"),
      pause: T("Pause", "Pause"),
      reset: T("Zurücksetzen", "Reset"),
      of: T("Station", "station"),
      introLabel: T("Start", "Start")
    };
  }

  function heat(seed) {
    var x = Math.sin(seed * 12.9898 + 4.1) * 43758.5453;
    return x - Math.floor(x);
  }

  function tokenVisual() {
    var toks = [
      ["Die", "1123"], [" Kat", "6510"], ["ze", "3907"], [" sitzt", "12345"], ["…", ""]
    ];
    return '<div class="viz-tokens">' + toks.map(function (t) {
      return '<span class="viz-token">' + t[0] + (t[1] ? '<small>' + t[1] + '</small>' : '') + '</span>';
    }).join("") + '</div>';
  }

  function embedVisual() {
    var rows = [["Die", 1], ["Kat", 2], ["ze", 3]];
    var cells = "";
    var html = rows.map(function (r) {
      var inner = "";
      for (var j = 0; j < 14; j++) {
        var o = (0.16 + 0.84 * heat(r[1] * 31 + j)).toFixed(2);
        inner += '<i style="opacity:' + o + ';animation-delay:' + (j * 14) + 'ms"></i>';
      }
      return '<div class="viz-embed-row"><span class="viz-embed-word">' + r[0] + '</span><span class="viz-embed-cells">' + inner + '</span></div>';
    }).join("");
    cells = html;
    return '<div class="viz-embed">' + cells + '</div>';
  }

  function posVisual() {
    var vec = "";
    for (var i = 0; i < 14; i++) {
      vec += '<i style="opacity:' + (0.3 + 0.6 * heat(i + 3)).toFixed(2) + '"></i>';
    }
    var pts = [];
    for (var x = 0; x <= 320; x += 8) {
      var y = 31 + 22 * Math.sin((x / 320) * Math.PI * 4) * Math.cos((x / 320) * Math.PI * 1.3);
      pts.push((x === 0 ? "M" : "L") + x + " " + y.toFixed(1));
    }
    return '<div class="viz-pos">' +
      '<div class="viz-pos-vec">' + vec + '</div>' +
      '<div class="viz-pos-wave"><svg viewBox="0 0 320 62" preserveAspectRatio="none" aria-hidden="true">' +
        '<path d="' + pts.join(" ") + '" fill="none" stroke="var(--sky)" stroke-width="2"/>' +
        '<circle cx="200" cy="' + (31 + 22 * Math.sin((200 / 320) * Math.PI * 4) * Math.cos((200 / 320) * Math.PI * 1.3)).toFixed(1) + '" r="4" fill="var(--gold)"/>' +
      '</svg></div>' +
      '<div class="viz-pos-note">sin / cos · ' + T("mehrere Frequenzen", "several frequencies") + '</div>' +
    '</div>';
  }

  function blockVisual() {
    return '<div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:4px">' +
      '<div class="viz-block">' +
        '<span class="viz-node is-att">Attention</span>' +
        '<span class="viz-arrow">→</span>' +
        '<span class="viz-node is-ffn">FFN</span>' +
        '<span class="viz-arrow">→</span>' +
        '<span class="viz-node">' + T("weiter", "onward") + '</span>' +
      '</div>' +
      '<div class="viz-residual"><span>' + T("Residual", "residual") + '</span></div>' +
    '</div>';
  }

  function probsVisual() {
    var probs = [
      [T("Matte", "mat"), 61, true],
      [T("Heizung", "heater"), 17, false],
      [T("Gleichung", "equation"), 8, false],
      [T("Bank", "bank"), 5, false],
      [T("Tisch", "table"), 3, false]
    ];
    return '<div class="viz-probs">' + probs.map(function (p) {
      return '<div class="viz-prob' + (p[2] ? " is-top" : "") + '">' +
        '<span class="viz-prob-word">' + p[0] + '</span>' +
        '<span class="viz-prob-track"><span class="viz-prob-fill" data-w="' + p[1] + '"></span></span>' +
        '<span class="viz-prob-pct">' + p[1] + ' %</span>' +
      '</div>';
    }).join("") + '</div>';
  }

  function visuals() {
    return [tokenVisual(), embedVisual(), posVisual(), blockVisual(), probsVisual()];
  }

  function buildStations() {
    var html = '<div class="baust-belt" aria-hidden="true"></div>' +
      '<div class="baust-packet" id="baust-packet"><span class="baust-packet-inner" id="baust-packet-inner">' + S.packetStart + '</span></div>';
    for (var i = 0; i < 5; i++) {
      html += '<button type="button" class="baust-station" data-station="' + i + '" aria-label="' + S.labels[i] + '">' +
        '<span class="baust-pod">' + ICONS[i] + '<span class="baust-led" aria-hidden="true"></span></span>' +
        '<span class="baust-station-label">' + S.labels[i] + '</span>' +
        '<span class="baust-station-sub">' + S.subs[i] + '</span>' +
        '<span class="baust-beam" aria-hidden="true"></span>' +
      '</button>';
    }
    line.innerHTML = html;
    packet = document.getElementById("baust-packet");
    bindStations();
  }

  function bindStations() {
    Array.prototype.forEach.call(line.querySelectorAll("[data-station]"), function (b) {
      b.addEventListener("click", function () {
        stopPlay();
        setIndex(parseInt(b.getAttribute("data-station"), 10));
      });
    });
  }

  function renderStations() {
    Array.prototype.forEach.call(line.querySelectorAll("[data-station]"), function (b) {
      var i = parseInt(b.getAttribute("data-station"), 10);
      b.classList.toggle("is-active", i === index);
      b.classList.toggle("is-done", i < index);
      b.setAttribute("aria-pressed", i === index ? "true" : "false");
    });
  }

  function renderPacket() {
    if (!packet) return;
    var left = index < 0 ? 3 : ((index + 0.5) / 5) * 100;
    packet.style.left = left + "%";
    var inner = document.getElementById("baust-packet-inner");
    if (inner) inner.textContent = index < 0 ? S.packetStart : S.packet[index];
  }

  function renderInspect() {
    var viz = visuals();
    var html;
    if (index < 0) {
      html = '<div class="baust-copy">' +
        '<span class="baust-kicker">' + S.introLabel + '</span>' +
        '<h2 class="baust-title">' + S.intro.title + '</h2>' +
        '<p class="baust-desc">' + S.intro.desc + '</p>' +
        '<p class="baust-hint">' + S.intro.hint + '</p>' +
      '</div>' +
      '<div class="baust-visual">' + viz[0] + '</div>';
    } else {
      var step = S.steps[index];
      html = '<div class="baust-copy">' +
        '<span class="baust-kicker">' + S.of + ' ' + (index + 1) + ' / 5 · ' + S.labels[index] + '</span>' +
        '<h2 class="baust-title">' + step.title + '</h2>' +
        '<p class="baust-desc">' + step.desc + '</p>' +
      '</div>' +
      '<div class="baust-visual">' + viz[index] + '</div>';
    }
    inspect.innerHTML = html;
    var fills = inspect.querySelectorAll(".viz-prob-fill");
    if (fills.length) {
      requestAnimationFrame(function () {
        Array.prototype.forEach.call(fills, function (f) {
          f.style.width = f.getAttribute("data-w") + "%";
        });
      });
    }
    if (progressFill) progressFill.style.width = ((index + 1) / 5 * 100) + "%";
    if (progressLabel) {
      progressLabel.textContent = index < 0 ? S.introLabel : (index + 1) + " / 5 · " + S.labels[index];
    }
  }

  function setIndex(next) {
    index = Math.max(-1, Math.min(4, next));
    renderStations();
    renderPacket();
    renderInspect();
    if (stepBtn) stepBtn.disabled = index >= 4;
  }

  function advance() {
    if (index >= 4) { stopPlay(); return; }
    setIndex(index + 1);
  }

  function startPlay() {
    if (playing) return;
    if (index >= 4) setIndex(-1);
    playing = true;
    if (playBtn) playBtn.textContent = S.pause;
    advance();
    playTimer = window.setInterval(function () {
      if (index >= 4) { stopPlay(); return; }
      advance();
    }, 1900);
  }

  function stopPlay() {
    playing = false;
    if (playTimer) { clearInterval(playTimer); playTimer = 0; }
    if (playBtn) playBtn.textContent = S.play;
  }

  function togglePlay() {
    if (playing) stopPlay();
    else startPlay();
  }

  function resetAll() {
    stopPlay();
    setIndex(-1);
  }

  function rebuild() {
    buildStrings();
    buildStations();
    if (stepBtn) stepBtn.textContent = S.step;
    if (playBtn) playBtn.textContent = playing ? S.pause : S.play;
    if (resetBtn) resetBtn.textContent = S.reset;
    setIndex(index);
  }

  if (stepBtn) stepBtn.addEventListener("click", function () { stopPlay(); advance(); });
  if (playBtn) playBtn.addEventListener("click", togglePlay);
  if (resetBtn) resetBtn.addEventListener("click", resetAll);

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); stopPlay(); advance(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); stopPlay(); setIndex(index - 1); }
  });

  if (window.Proto) {
    Proto.onLang(function () {
      var was = index;
      stopPlay();
      index = was;
      rebuild();
    });
  }

  rebuild();
})();
