(function () {
  "use strict";

  var line = document.getElementById("baust-line");
  var inspect = document.getElementById("baust-inspect");
  var stepBtn = document.querySelector("[data-baust-step]");
  var playBtn = document.querySelector("[data-baust-play]");
  var resetBtn = document.querySelector("[data-baust-reset]");
  var progressFill = document.querySelector("[data-baust-progress]");
  var progressLabel = document.querySelector("[data-baust-progress-label]");
  if (!line || !inspect) return;

  var T = function (de, en) { return window.Proto ? Proto.t(de, en) : de; };
  var total = 7;
  var index = -1;
  var playing = false;
  var playTimer = 0;
  var packet = null;

  var ICONS = [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="6" height="12" rx="1.5"/><rect x="15" y="6" width="6" height="12" rx="1.5"/><path d="M9 12h6"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V4M4 20h16"/><path d="M8 16l4-8 4 5 4-7"/><circle cx="12" cy="8" r="1.3" fill="currentColor" stroke="none"/><circle cx="16" cy="13" r="1.3" fill="currentColor" stroke="none"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M3 15c2.5 0 2.5-7 5-7s2.5 7 5 7 2.5-7 5-7 2.5 7 3 7"/><path d="M3 20h18" opacity=".4"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="6" cy="16" r="2.2"/><circle cx="12" cy="16" r="2.2"/><circle cx="18" cy="16" r="2.2"/><path d="M6 13c1.5-3 4.5-3 6-1M12 13c1.5-4 4.5-4 6 0"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 12h16" opacity=".4"/><path d="M7 7v10M11 10v4M15 5v14M19 9v6"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="1.6"/><circle cx="6" cy="12" r="1.6"/><circle cx="6" cy="18" r="1.6"/><circle cx="18" cy="6" r="1.6"/><circle cx="18" cy="12" r="1.6"/><circle cx="18" cy="18" r="1.6"/><path d="M7.6 6h8.8M7.6 12h8.8M7.6 18h8.8" opacity=".55"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 19V9M9 19V5M14 19v-8M19 19v-4"/><path d="M3 21h18" opacity=".4"/></svg>'
  ];

  var S = {};

  function buildStrings() {
    S = {
      labels: [
        T("Tokenizer", "Tokenizer"),
        T("Embedding", "Embedding"),
        T("Position", "Position"),
        T("Attention", "Attention"),
        T("LayerNorm", "LayerNorm"),
        T("FFN", "FFN"),
        T("Unembedding", "Unembedding")
      ],
      subs: [
        T("Text zu Tokens", "text to tokens"),
        T("Token zu Vektor", "token to vector"),
        T("Ort im Satz", "place in the sentence"),
        T("wer liest wen", "who reads whom"),
        T("Skala halten", "hold the scale"),
        T("entwirren", "untangle"),
        T("Vektor zu Wörtern", "vector to words")
      ],
      steps: [
        {
          title: T("Text wird zu Tokens", "Text becomes tokens"),
          desc: T("Der Text wird in Stücke zerlegt. Jedes Stück bekommt eine ID. Dieselbe Zeichenfolge bekommt immer dieselbe ID.", "The text is split into pieces. Each piece gets an ID. The same string always gets the same ID.")
        },
        {
          title: T("Aus der ID wird ein Vektor", "The ID becomes a vector"),
          desc: T("Die ID zeigt auf eine Zeile der Embedding-Tabelle. Diese Zeile ist der Startvektor des Tokens. Ähnliche Richtungen bedeuten ähnliche Bedeutung.", "The ID points to a row of the embedding table. That row is the token's starting vector. Similar directions mean similar meaning.")
        },
        {
          title: T("Die Position kommt dazu", "The position is added"),
          desc: T("Ohne Positionsangabe wäre „Katze am Anfang“ gleich „Katze am Ende“. Ein Positionsvektor aus Sinus und Kosinus markiert den Platz.", "Without a position, “cat at the start” would equal “cat at the end”. A position vector made of sine and cosine marks the place.")
        },
        {
          title: T("Attention mischt den Kontext", "Attention mixes the context"),
          desc: T("Attention bewertet für jedes Token, wie wichtig die anderen Tokens sind, und mischt ihre Informationen. „Katze“ liest dann „Die“, „sitzt“ und „auf“.", "Attention scores how important the other tokens are for each token and mixes their information. “Cat” then reads “The”, “sits”, and “on”.")
        },
        {
          title: T("LayerNorm hält die Skala stabil", "LayerNorm holds the scale"),
          desc: T("LayerNorm zentriert den Vektor jedes Tokens auf Mittelwert 0 und Varianz 1. Zwei gelernte Parameter justieren danach. Sie mischt keine Information, sie hält nur die Werte trainierbar.", "LayerNorm centres each token vector to mean 0 and variance 1. Two learned parameters adjust it afterwards. It mixes no information, it only keeps the values trainable.")
        },
        {
          title: T("Das FFN entwirrt und ordnet neu", "The FFN untangles and reorders"),
          desc: T("Das FFN projiziert den Vektor in einen größeren Raum, knickt und verzerrt ihn und projiziert zurück. Muster lassen sich dort leichter trennen oder neu kombinieren.", "The FFN projects the vector into a larger space, folds and distorts it, and projects it back. Patterns are easier to separate or recombine there.")
        },
        {
          title: T("Der Vektor wird wieder zu Wörtern", "The vector becomes words again"),
          desc: T("Der letzte Vektor wird über W_U zu Logits. Softmax macht daraus eine Verteilung über das nächste Token. Oben steht der wahrscheinlichste Kandidat.", "The final vector becomes logits through W_U. Softmax turns them into a distribution over the next token. The most likely candidate is on top.")
        }
      ],
      intro: {
        title: T("Die Reise eines Tokens", "The journey of a token"),
        desc: T("Ein Satz wird zum Paket und läuft durch sieben Stationen. Das Fließband ist der Residualstrom: Jede Station addiert ihre Änderung, der Zustand x bleibt erhalten.", "A sentence becomes a parcel and runs through seven stations. The belt is the residual stream: each station adds its change, the state x is preserved."),
        hint: T("Drücke Schritt, um jede Station anzuhalten, oder Play für den ganzen Durchlauf. Klicke eine Station an, um direkt dorthin zu springen.", "Press Step to stop at each station, or Play for the whole run. Click a station to jump straight to it.")
      },
      belt: T("Residualstrom x", "Residual stream x"),
      packetStart: T("Die Katze sitzt auf der Matte", "The cat sat on the mat"),
      packet: [
        T("Die · Kat · ze · sitzt", "The · cat · sat"),
        T("x = e(Kat)", "x = e(cat)"),
        T("x + pos(4)", "x + pos(4)"),
        T("x + ΔAttention", "x + Δattention"),
        T("x + ΔLayerNorm", "x + ΔLayerNorm"),
        T("x + ΔFFN", "x + ΔFFN"),
        T("Matte · 61 %", "mat · 61 %")
      ],
      step: T("Schritt", "Step"),
      play: T("Play", "Play"),
      pause: T("Pause", "Pause"),
      reset: T("Zurücksetzen", "Reset"),
      of: T("Station", "station"),
      introLabel: T("Start", "Start"),
      captionTokenizer: T("Zeichenfolge → Stücke → IDs", "string → pieces → IDs"),
      captionEmbedding: T("ID → Vektor (schematisch)", "ID → vector (schematic)"),
      captionPosition: T("sin / cos · mehrere Frequenzen", "sin / cos · several frequencies"),
      captionAttention: T("Katze liest Die, sitzt und auf", "cat reads the, sits, and on"),
      captionLayerNorm: T("pro Token: −μ / σ, dann γ und β", "per token: −μ / σ, then γ and β"),
      captionFFN: T("links gemischt, rechts getrennt", "mixed left, separated right"),
      captionUnembed: T("h · W_U → Logits → Softmax", "h · W_U → logits → softmax")
    };
  }

  function heat(seed) {
    var x = Math.sin(seed * 12.9898 + 4.1) * 43758.5453;
    return x - Math.floor(x);
  }

  function tokenVisual() {
    var toks = [["Die", "1123"], ["Kat", "6510"], ["ze", "3907"], ["sitzt", "12345"], ["…", ""]];
    return '<div class="viz-tokens">' + toks.map(function (t) {
      return '<span class="viz-token">' + t[0] + (t[1] ? '<small>' + t[1] + '</small>' : '') + '</span>';
    }).join("") + '</div><p class="viz-caption">' + S.captionTokenizer + '</p>';
  }

  function arrow(x1, y1, x2, y2, color, width) {
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var hx = x2 - 7 * Math.cos(ang);
    var hy = y2 - 7 * Math.sin(ang);
    var lx = hx + 4 * Math.sin(ang);
    var ly = hy - 4 * Math.cos(ang);
    var rx = hx - 4 * Math.sin(ang);
    var ry = hy + 4 * Math.cos(ang);
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + hx.toFixed(1) + '" y2="' + hy.toFixed(1) + '" stroke="' + color + '" stroke-width="' + (width || 2) + '" stroke-linecap="round"/>' +
      '<path d="M' + x2 + ' ' + y2 + 'L' + lx.toFixed(1) + ' ' + ly.toFixed(1) + 'L' + rx.toFixed(1) + ' ' + ry.toFixed(1) + 'Z" fill="' + color + '"/>';
  }

  function embedVisual() {
    var ox = 54, oy = 128;
    var words = [
      { t: "Kat", x: 196, y: 48, c: "var(--green)" },
      { t: "ze", x: 228, y: 76, c: "var(--sky)" },
      { t: "Die", x: 110, y: 44, c: "var(--gold)" }
    ];
    var svg = '<svg viewBox="0 0 300 150" role="img" aria-label="' + S.captionEmbedding + '">' +
      '<path d="M' + ox + ' ' + (oy - 108) + 'V' + oy + 'H' + (ox + 220) + '" fill="none" stroke="var(--line-strong)" stroke-width="1"/>';
    words.forEach(function (w) {
      svg += arrow(ox, oy, w.x, w.y, w.c, 2.4);
      svg += '<circle cx="' + w.x + '" cy="' + w.y + '" r="3" fill="' + w.c + '"/>' +
        '<text x="' + (w.x + 7) + '" y="' + (w.y - 4) + '" fill="' + w.c + '" font-family="var(--sans)" font-size="11" font-weight="700">' + w.t + '</text>';
    });
    svg += '<text x="' + (ox + 4) + '" y="' + (oy + 14) + '" fill="var(--muted)" font-family="var(--mono)" font-size="9">0</text>';
    svg += '</svg>';
    return '<div class="viz-svg">' + svg + '</div><p class="viz-caption">' + S.captionEmbedding + '</p>';
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
    var marker = 31 + 22 * Math.sin((200 / 320) * Math.PI * 4) * Math.cos((200 / 320) * Math.PI * 1.3);
    return '<div class="viz-pos">' +
      '<div class="viz-pos-vec">' + vec + '</div>' +
      '<div class="viz-pos-wave"><svg viewBox="0 0 320 62" preserveAspectRatio="none" aria-hidden="true">' +
        '<path d="' + pts.join(" ") + '" fill="none" stroke="var(--sky)" stroke-width="2"/>' +
        '<circle cx="200" cy="' + marker.toFixed(1) + '" r="4" fill="var(--gold)"/>' +
      '</svg></div>' +
      '<p class="viz-caption">' + S.captionPosition + '</p>' +
    '</div>';
  }

  function attentionVisual() {
    var words = [T("Die", "The"), T("Katze", "cat"), T("sitzt", "sits"), T("auf", "on")];
    var xs = [46, 126, 206, 286];
    var y = 92;
    var weights = [0.2, 0.5, 0.3];
    var src = 1;
    var svg = '<svg viewBox="0 0 332 150" role="img" aria-label="' + S.captionAttention + '">';
    [0, 2, 3].forEach(function (i, k) {
      var mid = (xs[src] + xs[i]) / 2;
      svg += '<path d="M' + xs[src] + ' ' + (y - 12) + 'Q' + mid + ' ' + (y - 54) + ' ' + xs[i] + ' ' + (y - 12) + '" fill="none" stroke="var(--sky)" stroke-width="' + (1 + weights[k] * 7).toFixed(1) + '" stroke-linecap="round" opacity="0.7"/>';
    });
    words.forEach(function (w, i) {
      svg += '<circle cx="' + xs[i] + '" cy="' + y + '" r="' + (i === src ? 9 : 7) + '" fill="' + (i === src ? "var(--gold)" : "var(--card)") + '" stroke="' + (i === src ? "var(--gold)" : "var(--sky)") + '" stroke-width="1.8"/>';
      svg += '<text x="' + xs[i] + '" y="' + (y + 26) + '" text-anchor="middle" fill="var(--ink)" font-family="var(--sans)" font-size="11" font-weight="600">' + w + '</text>';
    });
    svg += '</svg>';
    return '<div class="viz-svg">' + svg + '</div><p class="viz-caption">' + S.captionAttention + '</p>';
  }

  function layerNormVisual() {
    var vals = [1, 2, 3, 4, 5];
    var normed = [-1.414, -0.707, 0, 0.707, 1.414];
    var svg = '<svg viewBox="0 0 320 156" role="img" aria-label="' + S.captionLayerNorm + '">';
    var baseL = 128, baseR = 78;
    vals.forEach(function (v, i) {
      var h = v * 17;
      svg += '<rect x="' + (24 + i * 18) + '" y="' + (baseL - h) + '" width="12" height="' + h + '" rx="2" fill="var(--sky)" opacity="0.72"/>';
    });
    svg += '<line x1="18" y1="' + baseL + '" x2="118" y2="' + baseL + '" stroke="var(--line-strong)" stroke-width="1"/>';
    svg += '<line x1="18" y1="' + (baseL - 3 * 17) + '" x2="118" y2="' + (baseL - 3 * 17) + '" stroke="var(--sky)" stroke-width="1" stroke-dasharray="4 3"/>';
    svg += '<text x="18" y="' + (baseL - 3 * 17 - 6) + '" fill="var(--sky)" font-family="var(--mono)" font-size="9">μ 3.0</text>';
    normed.forEach(function (v, i) {
      var h = Math.abs(v) * 26;
      var y = v >= 0 ? baseR - h : baseR;
      svg += '<rect x="' + (190 + i * 18) + '" y="' + y + '" width="12" height="' + h + '" rx="2" fill="var(--green)" opacity="0.78"/>';
    });
    svg += '<line x1="184" y1="' + baseR + '" x2="284" y2="' + baseR + '" stroke="var(--line-strong)" stroke-width="1"/>';
    svg += '<text x="184" y="' + (baseR + 14) + '" fill="var(--green)" font-family="var(--mono)" font-size="9">μ 0.0</text>';
    svg += '<text x="60" y="18" text-anchor="middle" fill="var(--sky)" font-family="var(--sans)" font-size="10" font-weight="700">' + T("vorher", "before") + '</text>';
    svg += '<text x="234" y="18" text-anchor="middle" fill="var(--green)" font-family="var(--sans)" font-size="10" font-weight="700">' + T("nachher", "after") + '</text>';
    svg += '<path d="M126 84h50" stroke="var(--petrol)" stroke-width="1.6"/>' + arrow(174, 84, 182, 84, "var(--petrol)", 1.6);
    svg += '<text x="150" y="76" text-anchor="middle" fill="var(--petrol)" font-family="var(--mono)" font-size="9">−μ / σ</text>';
    svg += '</svg>';
    return '<div class="viz-svg">' + svg + '</div><p class="viz-caption">' + S.captionLayerNorm + '</p>';
  }

  function ffnVisual() {
    var svg = '<svg viewBox="0 0 330 156" role="img" aria-label="' + S.captionFFN + '">';
    function dots(pts, color) {
      return pts.map(function (p) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.1" fill="' + color + '" stroke="var(--card)" stroke-width="1"/>';
      }).join("");
    }
    var mixedA = [[38, 62], [52, 48], [46, 78], [66, 66], [58, 88], [72, 54], [30, 84]];
    var mixedB = [[44, 72], [60, 58], [50, 40], [70, 86], [74, 68], [34, 56], [64, 44]];
    var sortedA = [[246, 40], [258, 34], [252, 50], [266, 42], [240, 52], [270, 30], [262, 24]];
    var sortedB = [[246, 104], [258, 114], [252, 96], [266, 106], [240, 118], [270, 90], [262, 124]];
    svg += '<rect x="20" y="22" width="72" height="112" rx="4" fill="none" stroke="var(--line-strong)"/>';
    svg += '<rect x="226" y="22" width="72" height="112" rx="4" fill="none" stroke="var(--line-strong)"/>';
    svg += '<line x1="230" y1="118" x2="294" y2="32" stroke="var(--petrol)" stroke-width="1.2" stroke-dasharray="5 4" opacity="0.7"/>';
    svg += dots(mixedA, "var(--gold)") + dots(mixedB, "var(--sky)");
    svg += dots(sortedA, "var(--gold)") + dots(sortedB, "var(--sky)");
    var inputs = [62, 78, 94], hidden = [40, 54, 68, 82, 96, 110], outputs = [62, 78, 94];
    var inX = 118, hiX = 156, outX = 196;
    var lines = "";
    inputs.forEach(function (a) { hidden.forEach(function (b) { lines += '<line x1="' + inX + '" y1="' + a + '" x2="' + hiX + '" y2="' + b + '" stroke="var(--line-strong)" stroke-width="0.7"/>'; }); });
    hidden.forEach(function (a) { outputs.forEach(function (b) { lines += '<line x1="' + hiX + '" y1="' + a + '" x2="' + outX + '" y2="' + b + '" stroke="var(--line-strong)" stroke-width="0.7"/>'; }); });
    svg += lines;
    inputs.forEach(function (y) { svg += '<circle cx="' + inX + '" cy="' + y + '" r="3.4" fill="var(--sky)"/>'; });
    hidden.forEach(function (y) { svg += '<circle cx="' + hiX + '" cy="' + y + '" r="3.4" fill="var(--green)"/>'; });
    outputs.forEach(function (y) { svg += '<circle cx="' + outX + '" cy="' + y + '" r="3.4" fill="var(--gold)"/>'; });
    svg += '<text x="56" y="18" text-anchor="middle" fill="var(--muted)" font-family="var(--sans)" font-size="9">' + T("gemischt", "mixed") + '</text>';
    svg += '<text x="262" y="18" text-anchor="middle" fill="var(--muted)" font-family="var(--sans)" font-size="9">' + T("getrennt", "separated") + '</text>';
    svg += '</svg>';
    return '<div class="viz-svg">' + svg + '</div><p class="viz-caption">' + S.captionFFN + '</p>';
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
    }).join("") + '</div><p class="viz-caption">' + S.captionUnembed + '</p>';
  }

  function visuals() {
    return [tokenVisual(), embedVisual(), posVisual(), attentionVisual(), layerNormVisual(), ffnVisual(), probsVisual()];
  }

  function buildStations() {
    var html = '<span class="baust-belt-label">' + S.belt + '</span>' +
      '<div class="baust-belt" aria-hidden="true"></div>' +
      '<div class="baust-packet" id="baust-packet"><span class="baust-packet-inner" id="baust-packet-inner">' + S.packetStart + '</span></div>';
    for (var i = 0; i < total; i++) {
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
    var left = index < 0 ? 2.5 : ((index + 0.5) / total) * 100;
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
        '<span class="baust-kicker">' + S.of + ' ' + (index + 1) + ' / ' + total + ' · ' + S.labels[index] + '</span>' +
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
    if (progressFill) progressFill.style.width = ((index + 1) / total * 100) + "%";
    if (progressLabel) {
      progressLabel.textContent = index < 0 ? S.introLabel : (index + 1) + " / " + total + " · " + S.labels[index];
    }
  }

  function setIndex(next) {
    index = Math.max(-1, Math.min(total - 1, next));
    renderStations();
    renderPacket();
    renderInspect();
    if (stepBtn) stepBtn.disabled = index >= total - 1;
  }

  function advance() {
    if (index >= total - 1) { stopPlay(); return; }
    setIndex(index + 1);
  }

  function startPlay() {
    if (playing) return;
    if (index >= total - 1) setIndex(-1);
    playing = true;
    if (playBtn) playBtn.textContent = S.pause;
    advance();
    playTimer = window.setInterval(function () {
      if (index >= total - 1) { stopPlay(); return; }
      advance();
    }, 1750);
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
