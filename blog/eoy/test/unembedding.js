(function () {
  "use strict";

  var blankEl = document.getElementById("um-blank");
  var bubbleEl = document.getElementById("um-bubble");
  var resultEl = document.getElementById("um-result");
  var suggestEl = document.getElementById("um-suggest");
  var predictLabel = document.getElementById("um-predict-label");
  var keyboard = document.getElementById("um-keyboard");
  var kickerEl = document.getElementById("um-kicker");
  var titleEl = document.getElementById("um-title");
  var textEl = document.getElementById("um-text");
  var flowEl = document.getElementById("um-flow");
  var vecEl = document.getElementById("um-vecviz");
  var tipEl = document.getElementById("um-tip");
  var modeBtns = Array.prototype.slice.call(document.querySelectorAll("[data-um-mode]"));
  if (!blankEl || !suggestEl) return;

  var T = function (de, en) { return window.Proto ? Proto.t(de, en) : de; };
  var mode = "predict";
  var chosen = "";
  var picked = "";

  var S = {};

  function buildStrings() {
    S = {
      prefix: T("Die Katze sitzt auf der ", "The cat sat on the "),
      blank: "___",
      predictLabel: T("Nächstes Token", "Next token"),
      similarLabel: T("Ähnliche Worte", "Similar words"),
      top: T("Top 3", "Top 3"),
      pred: [
        { w: T("Matte", "mat"), p: 61 },
        { w: T("Heizung", "heater"), p: 17 },
        { w: T("Gleichung", "equation"), p: 8 }
      ],
      sim: [
        { w: T("Hund", "dog"), p: 71 },
        { w: T("Tier", "animal"), p: 68 },
        { w: T("Maus", "mouse"), p: 61 }
      ],
      kickerPredict: T("Unembedding · Nächstes Token", "Unembedding · next token"),
      kickerSimilar: T("Embedding · Nachbarn", "Embedding · neighbours"),
      titlePredict: T("Aus einem Vektor wird eine Verteilung", "A vector becomes a distribution"),
      titleSimilar: T("Bedeutung ist Nähe im Vektorraum", "Meaning is closeness in vector space"),
      textPredict: T("Der letzte Vektor wird gegen alle Token-Zeilen von W_U geprüft. Das Skalarprodukt ergibt einen Logit; Softmax macht daraus eine Verteilung. Die Vorschlagsleiste ist diese Verteilung, auf drei Kandidaten gekürzt.", "The final vector is checked against every token row of W_U. The dot product gives a logit; softmax turns it into a distribution. The suggestion bar is that distribution, cut down to three candidates."),
      textSimilar: T("Ähnliche Worte sind Nachbarn im selben Vektorraum. Das Skalarprodukt zweier Token-Vektoren misst ihre Nähe. Embedding und Unembedding nutzen oft dieselbe Matrix, das nennt man weight tying.", "Similar words are neighbours in the same vector space. The dot product of two token vectors measures their closeness. Embedding and unembedding often share the same matrix, which is called weight tying."),
      flowPredict: [T("Vektor h", "vector h"), "× W_U", T("Logits", "logits"), "Softmax", T("p(Token)", "p(token)")],
      flowSimilar: [T("e(Katze)", "e(cat)"), T("e(Hund)", "e(dog)"), T("cos", "cos"), T("Nähe", "closeness")],
      tipPredict: T("Tippe einen Vorschlag an. Die Lücke füllt sich, aber das Modell hat nicht „verstanden“, dass Katzen auf Matten sitzen. Es hat gelernt, welche Tokens hier häufig folgen.", "Tap a suggestion. The blank fills, but the model has not “understood” that cats sit on mats. It learned which tokens often follow here."),
      tipSimilar: T("Tippe ein Nachbarwort an. Hund, Tier und Maus liegen nah bei Katze, weil sie in ähnlichen Kontexten vorkommen. Ähnlichkeit ist kein Wissen über die Welt.", "Tap a neighbour. Dog, animal, and mouse sit close to cat because they appear in similar contexts. Similarity is not knowledge about the world."),
      resultTop: T("Das war die wahrscheinlichste Fortsetzung. Die Wahrscheinlichkeit ist eine Aussage über den Trainingskorpus, keine Garantie für Wahrheit.", "That was the most likely continuation. The probability is a statement about the training corpus, not a guarantee of truth."),
      resultOther: T("Du hast ein weniger wahrscheinliches Token gewählt. Die Verteilung erlaubt es, die Wahrscheinlichkeit ist nur kleiner.", "You picked a less likely token. The distribution allows it; the probability is just smaller."),
      resultSim: T("Dieses Wort liegt nah bei Katze: ähnliche Vektoren, ähnliche Kontexte. Das ist die Geometrie hinter „ähnliche Worte finden“.", "This word sits close to cat: similar vectors, similar contexts. That is the geometry behind “finding similar words”."),
      reset: T("Nochmal", "Again")
    };
  }

  function heat(seed) {
    var x = Math.sin(seed * 12.9898 + 2.3) * 43758.5453;
    return x - Math.floor(x);
  }

  function cells(n, cls, seed) {
    var out = "";
    for (var i = 0; i < n; i++) {
      var h = heat(seed + i);
      var c = cls;
      if (cls === "mixed") c = h > 0.62 ? "is-green" : (h < 0.26 ? "is-dim" : "");
      out += '<i class="' + c + '" style="opacity:' + (0.25 + 0.75 * h).toFixed(2) + '"></i>';
    }
    return out;
  }

  function buildKeyboard() {
    if (!keyboard || keyboard.getAttribute("data-built")) return;
    var rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
    var html = "";
    rows.forEach(function (row, ri) {
      html += '<div class="um-krow" aria-hidden="true">';
      if (ri === 2) html += '<span class="um-key um-key--wide um-title-small">⇧</span>';
      Array.prototype.forEach.call(row, function (ch) {
        html += '<span class="um-key">' + ch + '</span>';
      });
      if (ri === 2) html += '<span class="um-key um-key--wide um-title-small">⌫</span>';
      html += '</div>';
    });
    html += '<div class="um-krow" aria-hidden="true"><span class="um-key um-key--wide um-title-small">123</span><span class="um-key um-key--space um-title-small">' + T("Leertaste", "space") + '</span><span class="um-key um-key--wide um-title-small">↵</span></div>';
    keyboard.innerHTML = html;
    keyboard.setAttribute("data-built", "1");
  }

  function renderBubble() {
    if (!bubbleEl) return;
    var word = mode === "predict" && chosen ? chosen : "";
    bubbleEl.innerHTML = S.prefix + '<span class="um-blank" id="um-blank">' + (word || S.blank) + '</span>';
    blankEl = document.getElementById("um-blank");
  }

  function renderSuggest() {
    var list = mode === "predict" ? S.pred : S.sim;
    var max = Math.max.apply(null, list.map(function (x) { return x.p; }));
    suggestEl.innerHTML = list.map(function (x) {
      var isPicked = (mode === "predict" && chosen === x.w) || (mode === "similar" && picked === x.w);
      var isTop = x.p === max;
      return '<button type="button" class="um-sugg' + (isTop ? " is-top" : "") + (isPicked ? " is-picked" : "") + '" data-um-pick="' + x.w.replace(/"/g, "&quot;") + '" data-um-p="' + x.p + '">' +
        '<span class="um-sugg-word">' + x.w + '</span>' +
        '<span class="um-sugg-bar"><span class="um-sugg-fill" data-w="' + x.p + '"></span></span>' +
        '<span class="um-sugg-pct">' + x.p + ' %</span>' +
      '</button>';
    }).join("");
    var fills = suggestEl.querySelectorAll(".um-sugg-fill");
    requestAnimationFrame(function () {
      Array.prototype.forEach.call(fills, function (f) { f.style.width = f.getAttribute("data-w") + "%"; });
    });
    Array.prototype.forEach.call(suggestEl.querySelectorAll("[data-um-pick]"), function (b) {
      b.addEventListener("click", function () {
        var word = b.getAttribute("data-um-pick");
        if (mode === "predict") chosen = word;
        else picked = word;
        renderAll();
      });
    });
    if (predictLabel) {
      predictLabel.innerHTML = '<span>' + (mode === "predict" ? S.predictLabel : S.similarLabel) + '</span><b>' + S.top + '</b>';
    }
  }

  function renderResult() {
    if (!resultEl) return;
    var html = "";
    var on = false;
    if (mode === "predict" && chosen) {
      var top = S.pred[0].w;
      html = '<b>' + chosen + '</b>. ' + (chosen === top ? S.resultTop : S.resultOther);
      on = true;
    } else if (mode === "similar" && picked) {
      html = '<b>' + picked + '</b>. ' + S.resultSim;
      on = true;
    }
    resultEl.innerHTML = html;
    resultEl.classList.toggle("is-on", on);
  }

  function renderAside() {
    if (kickerEl) kickerEl.textContent = mode === "predict" ? S.kickerPredict : S.kickerSimilar;
    if (titleEl) titleEl.textContent = mode === "predict" ? S.titlePredict : S.titleSimilar;
    if (textEl) textEl.textContent = mode === "predict" ? S.textPredict : S.textSimilar;
    if (tipEl) tipEl.textContent = mode === "predict" ? S.tipPredict : S.tipSimilar;

    if (flowEl) {
      var nodes = mode === "predict" ? S.flowPredict : S.flowSimilar;
      flowEl.innerHTML = nodes.map(function (n, i) {
        var cls = i === 0 ? " is-vec" : (i === nodes.length - 1 ? " is-prob" : "");
        return '<span class="um-flow-node' + cls + '">' + n + '</span>' +
          (i < nodes.length - 1 ? '<span class="um-flow-arrow" aria-hidden="true">→</span>' : '');
      }).join("");
    }

    if (vecEl) {
      if (mode === "predict") {
        vecEl.innerHTML =
          '<div class="um-vecrow"><span class="um-vecrow-label">h</span><span class="um-vecrow-cells">' + cells(16, "mixed", 1) + '</span></div>' +
          '<div class="um-vecrow"><span class="um-vecrow-label">logits</span><span class="um-vecrow-cells">' + cells(16, "mixed", 7) + '</span></div>' +
          '<div class="um-vecrow"><span class="um-vecrow-label">p</span><span class="um-vecrow-cells">' + cells(16, "mixed", 13) + '</span></div>';
      } else {
        vecEl.innerHTML =
          '<div class="um-vecrow"><span class="um-vecrow-label">e(Katze)</span><span class="um-vecrow-cells">' + cells(16, "mixed", 21) + '</span></div>' +
          '<div class="um-vecrow"><span class="um-vecrow-label">e(Hund)</span><span class="um-vecrow-cells">' + cells(16, "mixed", 23) + '</span></div>' +
          '<div class="um-vecrow"><span class="um-vecrow-label">cos</span><span class="um-vecrow-cells">' + cells(16, "mixed", 25) + '</span></div>';
      }
    }
  }

  function renderControls() {
    modeBtns.forEach(function (b) {
      var on = b.getAttribute("data-um-mode") === mode;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function renderAll() {
    renderControls();
    renderBubble();
    renderSuggest();
    renderResult();
    renderAside();
  }

  modeBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var next = b.getAttribute("data-um-mode");
      if (next === mode) return;
      mode = next;
      chosen = "";
      picked = "";
      renderAll();
    });
  });

  var resetBtn = document.querySelector("[data-um-reset]");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      chosen = "";
      picked = "";
      renderAll();
    });
  }

  if (window.Proto) {
    Proto.onLang(function () {
      buildStrings();
      buildKeyboard();
      renderAll();
    });
  }

  buildStrings();
  buildKeyboard();
  renderAll();
})();
