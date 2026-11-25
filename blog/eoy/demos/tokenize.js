(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  var lastSplitStep = 0;
  function tokenizeScene(root, api) {
    var DE = api.lang === "de";
    var C = api.colors();
    var examples = DE ? {
      understanding: { label: "Verständnis", value: "Verständnis" },
      unbreakable: { label: "unzerbrechlich", value: "unzerbrechlich" },
      sentence: { label: "Sprachmodell liest Text", value: "Sprachmodell liest Text" }
    } : {
      understanding: { label: "understanding", value: "understanding" },
      unbreakable: { label: "unbreakable", value: "unbreakable" },
      sentence: { label: "Models read text", value: "Models read text" }
    };
    var splits = DE ? {
      "verständnis": ["ver", "ständ", "nis"],
      "unzerbrechlich": ["un", "zerbrech", "lich"],
      "sprachmodelle": ["sprach", "modell", "e"],
      "sprachmodell": ["sprach", "modell"],
      "liest": ["lies", "t"],
      "text": ["text"],
      "zerlegen": ["zer", "leg", "en"],
      "wörter": ["wör", "ter"],
      "teile": ["teil", "e"]
    } : {
      "understanding": ["un", "der", "stand", "ing"],
      "unbreakable": ["un", "break", "able"],
      "language": ["lang", "uage"],
      "models": ["mod", "els"],
      "read": ["read"],
      "text": ["text"],
      "split": ["split"],
      "words": ["word", "s"],
      "pieces": ["piece", "s"]
    };
    var colors = ["#63a44b", "#5c9baf", "#9f9700", "#9185be", "#869b55", "#1275ac", "#009299", "#92a19a"];
    var corpus = [
      { word: "low", count: 5 },
      { word: "lower", count: 2 },
      { word: "newest", count: 6 },
      { word: "widest", count: 3 }
    ];
    var el = document.createElement("div");
    el.className = "ls-tokenize-scene";
    el.innerHTML =
      '<div class="ls-tokenize-content">' +
      '<div class="ls-tokenize-split">' +
        '<div class="ls-scene-row ls-tokenize-samples" data-tip="' + (DE ? "Wähle ein Beispiel, um seine Zerlegung in Tokens zu sehen." : "Pick a sample to see how it splits into tokens.") + '"><span class="ls-tokenize-label">' + (DE ? "Beispiele" : "Samples") + '</span></div>' +
        '<div class="ls-tokenize-chips" aria-live="polite" data-tip="' + (DE ? "Jedes Stück ist ein Token; die kleine Zahl ist seine Vokabular-ID." : "Each piece is a token; the small number is its vocabulary id.") + '"></div>' +
        '<div class="ls-tokenize-stats" data-tip="' + (DE ? "Zählt Tokens, Teile, Subword-Splits und Leerzeichen in diesem Beispiel." : "Counts tokens, pieces, subword splits, and whitespace in this sample.") + '"></div>' +
      '</div>' +
      '<div class="ls-bpe" hidden>' +
        '<div class="ls-bpe-head" data-tip="' + (DE ? "BPE lernt häufige Zeichenpaare und ersetzt sie durch neue Symbole." : "BPE learns frequent character pairs and replaces them with new symbols.") + '"><span class="ls-bpe-title">' + (DE ? "BPE = gelernte Kompression" : "BPE = learned compression") + '</span><span class="ls-bpe-hint">' + (DE ? "Start: Zeichen-BPE · einzelne Zeichen" : "Start: character-level BPE · individual characters") + '</span></div>' +
        '<div class="ls-bpe-equation" aria-live="polite" data-tip="' + (DE ? "Der Merge dieser Stufe: zwei Symbole werden zu einem." : "The merge chosen for this stage: two symbols become one.") + '"></div>' +
        '<div class="ls-bpe-corpus" aria-live="polite" data-tip="' + (DE ? "Der kleine Korpus; hervorgehobene Symbole sind das nächste Paar." : "The tiny corpus; highlighted symbols are the pair merged next.") + '"></div>' +
        '<div class="ls-bpe-stage" aria-live="polite" data-tip="' + (DE ? "Aktuelle Merge-Stufe und was der nächste Schritt zusammenführt." : "Current merge stage and what the next step will merge.") + '"></div>' +
        '<div class="ls-bpe-meters" aria-live="polite" data-tip="' + (DE ? "Die Tokenzahl im Korpus sinkt, während das Vokabular wächst." : "Tokens in the corpus shrink as the vocabulary grows.") + '"></div>' +
        '<div class="ls-bpe-counts" aria-live="polite" data-tip="' + (DE ? "Die häufigsten Symbolpaare, die noch im Korpus übrig sind." : "The most frequent symbol pairs still left in the corpus.") + '"></div>' +
        '<p class="ls-bpe-note">' + (DE ? "Jeder Merge ersetzt ein häufiges Paar durch ein neues Symbol. Die Trennungen werden aus den Trainingsdaten gelernt: möglichst viel Text mit möglichst wenigen Tokens. Das Wort bleibt aus seinen Symbolen zusammensetzbar; der Text ist verlustfrei rekonstruierbar. Diese Demo zeigt Zeichen-BPE; Byte-BPE (z. B. GPT-2) startet mit 256 Byte-Werten." : "Each merge replaces a frequent pair with a new symbol. The splits are learned from the training data: as much text as possible with as few tokens as possible. The word remains reconstructable from its symbols; the text is lossless. This demo shows character-level BPE; byte-level BPE (e.g. GPT-2) starts with 256 byte values.") + '</p>' +
      '</div>' +
      '</div>' +
      '<div class="ls-tokenize-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-tokenize-prev" data-tip="' + (DE ? "Gehe einen Tokenisierungsschritt oder BPE-Merge zurück." : "Go back one tokenization step or BPE merge.") + '">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-tokenize-progress" data-tip="' + (DE ? "Aktueller Schritt innerhalb dieser Demo." : "Current step within this demo.") + '"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-tokenize-next" data-tip="' + (DE ? "Gehe einen Tokenisierungsschritt oder BPE-Merge vor." : "Go forward one tokenization step or BPE merge.") + '">' + (DE ? "Weiter →" : "Next →") + '</button></div>';
    root.appendChild(el);
    var samples = el.querySelector(".ls-tokenize-samples");
    var chips = el.querySelector(".ls-tokenize-chips");
    var stats = el.querySelector(".ls-tokenize-stats");
    var splitEl = el.querySelector(".ls-tokenize-split");
    var bpeEl = el.querySelector(".ls-bpe");
    var corpusEl = el.querySelector(".ls-bpe-corpus");
    var equationEl = el.querySelector(".ls-bpe-equation");
    var stageEl = el.querySelector(".ls-bpe-stage");
    var metersEl = el.querySelector(".ls-bpe-meters");
    var countsEl = el.querySelector(".ls-bpe-counts");
    var navPrev = el.querySelector(".ls-tokenize-prev");
    var navNext = el.querySelector(".ls-tokenize-next");
    var navProgress = el.querySelector(".ls-tokenize-progress");
    var sampleKeys = ["understanding", "unbreakable", "sentence"];
    var mode = "split";
    var step = lastSplitStep;
    var sampleIndex = 0;

    function cloneWords(words) {
      return words.map(function (w) { return { word: w.word, count: w.count, symbols: w.symbols.slice() }; });
    }
    function pairCounts(words) {
      var map = {};
      words.forEach(function (w) {
        for (var i = 0; i < w.symbols.length - 1; i++) {
          var key = JSON.stringify([w.symbols[i], w.symbols[i + 1]]);
          if (!map[key]) map[key] = { a: w.symbols[i], b: w.symbols[i + 1], count: 0 };
          map[key].count += w.count;
        }
      });
      return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.count - a.count; });
    }
    function mergePair(words, pair) {
      return words.map(function (w) {
        var out = [];
        for (var i = 0; i < w.symbols.length; i++) {
          if (i < w.symbols.length - 1 && w.symbols[i] === pair.a && w.symbols[i + 1] === pair.b) {
            out.push(pair.a + pair.b);
            i++;
          } else out.push(w.symbols[i]);
        }
        return { word: w.word, count: w.count, symbols: out };
      });
    }
    function totalSymbols(words) {
      return words.reduce(function (sum, w) { return sum + w.symbols.length * w.count; }, 0);
    }
    function vocabSize(words) {
      var set = {};
      words.forEach(function (w) { w.symbols.forEach(function (s) { set[s] = 1; }); });
      return Object.keys(set).length;
    }
    var stages = (function () {
      var words = corpus.map(function (c) { return { word: c.word, count: c.count, symbols: c.word.split("") }; });
      var out = [{ words: cloneWords(words), merge: null, pairs: pairCounts(words) }];
      for (var s = 0; s < 4; s++) {
        var pairs = pairCounts(words);
        if (!pairs.length) break;
        var top = pairs[0];
        words = mergePair(words, top);
        out.push({ words: cloneWords(words), merge: top, pairs: pairCounts(words) });
      }
      return out;
    })();
    var baseVocab = (function () {
      var set = {};
      corpus.forEach(function (c) { c.word.split("").forEach(function (ch) { set[ch] = 1; }); });
      return Object.keys(set).length;
    })();

    function idFor(word) { var h = 0; for (var i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) % 50000; return 10000 + h; }
    function piecesFor(word) {
      if (splits[word]) return splits[word];
      if (word.length > 8) {
        var out = [];
        for (var i = 0; i < word.length; i += 4) out.push(word.slice(i, i + 4));
        return out;
      }
      return [word];
    }
    function tokenize(text) {
      var pieces = text.split(/(\s+|[.,!?;:])/).filter(function (p) { return p.length; });
      var tokens = [];
      pieces.forEach(function (piece) {
        if (/^\s+$/.test(piece)) { tokens.push({ word: "␣", id: 220, space: true }); return; }
        if (/^[.,!?;:]$/.test(piece)) { tokens.push({ word: piece, id: idFor(piece) }); return; }
        var word = piece.toLowerCase();
        piecesFor(word).forEach(function (part, idx) {
          tokens.push({ word: part, id: idFor(part), sub: idx > 0 });
        });
      });
      return tokens;
    }
    function renderSplit() {
      sampleIndex = step;
      var value = examples[sampleKeys[sampleIndex]].value;
      chips.innerHTML = tokenize(value).map(function (tok, i) {
        return '<span class="ls-token-chip' + (tok.sub ? " is-sub" : "") + (tok.space ? " is-space" : "") + '" data-tip="' + (DE ? "Ein Token-Stück; bei Subwords zerlegt das Modell ein Wort in mehrere Teile." : "A token piece; for subwords the model splits one word into several parts.") + '" style="--token-color:' + colors[i % colors.length] + '"><b>' + api.esc(tok.word) + '</b><small>id ' + tok.id + '</small></span>';
      }).join("");
      var tokens = tokenize(value);
      var spaces = tokens.filter(function (t) { return t.space; }).length;
      var subs = tokens.filter(function (t) { return t.sub; }).length;
      stats.innerHTML = '<span><b>' + tokens.length + '</b> ' + (DE ? "Tokens" : "tokens") + '</span><span><b>' + (tokens.length - spaces) + '</b> ' + (DE ? "Teile" : "pieces") + '</span><span><b>' + subs + '</b> ' + (DE ? "Subword-Splits" : "subword splits") + '</span><span><b>' + spaces + '</b> ' + (DE ? "Leerzeichen" : "whitespace") + '</span>';
      samples.querySelectorAll("[data-sample]").forEach(function (b, i) { b.classList.toggle("is-on", i === sampleIndex); });
    }
    function renderBpe() {
      var st = stages[step];
      var next = stages[step + 1];
      corpusEl.innerHTML = st.words.map(function (w) {
        var sign = "";
        var hi = [];
        if (next && next.merge && step > 0) {
          for (var i = 0; i < w.symbols.length - 1; i++) {
            if (w.symbols[i] === next.merge.a && w.symbols[i + 1] === next.merge.b) {
              hi[i] = true;
              hi[i + 1] = true;
              i++;
            }
          }
        }
        w.symbols.forEach(function (sym, idx) {
          sign += '<span class="ls-bpe-symbol' + (hi[idx] ? " is-pair" : "") + '">' + api.esc(sym) + '</span>';
        });
        return '<div class="ls-bpe-word" data-tip="' + (DE ? "Ein Wort mit seiner Häufigkeit; die Symbole zeigen die aktuelle Zerlegung." : "A word with its frequency; the symbols show its current split.") + '"><span class="ls-bpe-word-label">' + api.esc(w.word) + '</span><span class="ls-bpe-word-count">×' + w.count + '</span><span class="ls-bpe-symbols">' + sign + '</span></div>';
      }).join("");
      var mergeText = st.merge
        ? (DE ? "Stufe " + step + ": „" + st.merge.a + "“ + „" + st.merge.b + "“ → „" + st.merge.a + st.merge.b + "“ (" + st.merge.count + "×)" : "Stage " + step + ": “" + st.merge.a + "” + “" + st.merge.b + "” → “" + st.merge.a + st.merge.b + "” (" + st.merge.count + "×)")
        : (DE ? "Start (Zeichen-BPE): Alles ist in einzelne Zeichen getrennt." : "Start (character-level BPE): everything is split into individual characters.");
      var nextText = next && next.merge
        ? (DE ? "Nächster Merge: „" + next.merge.a + "“ + „" + next.merge.b + "“ (" + next.merge.count + "×)" : "Next merge: “" + next.merge.a + "” + “" + next.merge.b + "” (" + next.merge.count + "×)")
        : (DE ? "Fertig: vier Merges." : "Done: four merges.");
      var eq = st.merge
        ? '<span class="ls-bpe-eq-part">' + api.esc(st.merge.a) + '</span><span class="ls-bpe-eq-op">+</span><span class="ls-bpe-eq-part">' + api.esc(st.merge.b) + '</span><span class="ls-bpe-eq-op">→</span><span class="ls-bpe-eq-part is-new">' + api.esc(st.merge.a + st.merge.b) + '</span><span class="ls-bpe-eq-count">' + st.merge.count + '×</span>'
        : '<span class="ls-bpe-eq-note">' + (DE ? "Start (Zeichen-BPE): Alles ist in einzelne Zeichen getrennt." : "Start (character-level BPE): everything is split into individual characters.") + '</span>';
      equationEl.innerHTML = eq;
      var tokensNow = totalSymbols(st.words);
      var tokensStart = totalSymbols(stages[0].words);
      var vocabNow = vocabSize(st.words);
      var vocabMax = baseVocab + stages.length - 1;
      function meter(label, value, max, color) {
        var pct = max ? Math.round(value / max * 100) : 100;
        return '<div class="ls-bpe-meter"><span>' + label + '</span><i><b style="width:' + pct + '%;background:' + color + '"></b></i><em>' + value + '</em></div>';
      }
      metersEl.innerHTML = meter(DE ? "Tokens im Korpus" : "tokens in corpus", tokensNow, tokensStart, C.green) +
        meter(DE ? "Vokabular" : "vocabulary", vocabNow, vocabMax, C.sky);
      stageEl.innerHTML = '<b>' + api.esc(mergeText) + '</b><span>' + api.esc(nextText) + '</span>';
      countsEl.innerHTML = st.pairs.slice(0, 4).map(function (p) {
        return '<span class="ls-bpe-pair" data-tip="' + (DE ? "Ein Kandidatenpaar für den nächsten Merge mit seiner Häufigkeit." : "A candidate pair for the next merge with its frequency.") + '"><b>' + api.esc(p.a) + '+' + api.esc(p.b) + '</b> ' + p.count + '×</span>';
      }).join("");
      samples.querySelectorAll("[data-sample]").forEach(function (b) { b.classList.remove("is-on"); });
    }
    function render() {
      var splitMode = mode === "split";
      splitEl.hidden = !splitMode;
      bpeEl.hidden = splitMode;
      if (splitMode) { lastSplitStep = step; renderSplit(); } else renderBpe();
      var total = splitMode ? sampleKeys.length : stages.length;
      var pos = step;
      var canLeave = typeof api.canGoNext === "function" ? !!api.canGoNext() : true;
      navProgress.textContent = (pos + 1) + ' / ' + total;
      navPrev.disabled = pos === 0;
      navNext.disabled = pos === total - 1 && !canLeave;
      navNext.textContent = pos === total - 1
        ? (canLeave ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Ende" : "End"))
        : (DE ? "Weiter →" : "Next →");
    }
    function nextInternal() {
      if (mode === "split") {
        if (step < sampleKeys.length - 1) { step++; render(); return true; }
        return false;
      }
      if (step < stages.length - 1) { step++; render(); return true; }
      return false;
    }
    function prevInternal() {
      if (mode === "bpe") {
        if (step > 0) { step--; render(); return true; }
        return false;
      }
      if (step > 0) { step--; render(); return true; }
      return false;
    }
    function nextStep() {
      if (nextInternal()) return;
      api.goNext();
    }
    function prevStep() {
      if (prevInternal()) return;
      api.goPrev();
    }
    Object.keys(examples).forEach(function (key) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-chip";
      b.setAttribute("data-sample", key);
      b.setAttribute("data-tip", DE ? "Zeigt die Token-Zerlegung für dieses Beispiel." : "Shows the token split for this sample.");
      b.textContent = examples[key].label;
      b.addEventListener("click", function () { mode = "split"; step = sampleKeys.indexOf(key); sampleIndex = step; render(); });
      samples.appendChild(b);
    });
    navPrev.addEventListener("click", prevStep);
    navNext.addEventListener("click", nextStep);
    render();
    return {
      update: function (s) {
        if (s && s.mode && s.mode !== mode) { if (mode === "split") lastSplitStep = step; mode = s.mode === "split" ? "split" : "bpe"; step = mode === "split" ? lastSplitStep : 0; render(); }
      },
      next: nextInternal,
      prev: prevInternal,
      hasNext: function () { return mode === "split" ? step < sampleKeys.length - 1 : step < stages.length - 1; },
      hasPrev: function () { return step > 0; },
      onKey: function (e) {
        return api.util.arrowKey(e, nextInternal, prevInternal);
      },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }

  core.register("tokenize", tokenizeScene);
})();
