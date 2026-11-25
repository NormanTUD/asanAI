(function () {
  "use strict";

  var t = function (de, en) { return window.Proto ? Proto.t(de, en) : de; };
  var CORPUS = [
    { word: "low", count: 5 },
    { word: "lower", count: 2 },
    { word: "newest", count: 6 },
    { word: "widest", count: 3 }
  ];
  var MERGES = 4;
  var PALETTE = ["var(--g-sky)", "var(--g-lilac)", "var(--g-rose)", "var(--g-green)", "var(--g-gold)"];

  var root = document.querySelector(".bp2-stage");
  if (!root) return;

  var wordsEl = document.getElementById("bp2-words");
  var corpusNote = document.getElementById("bp2-corpus-note");
  var budgetLabel = document.getElementById("bp2-budget-label");
  var pipsEl = document.getElementById("bp2-pips");
  var tokensEl = document.getElementById("bp2-tokens");
  var vocabEl = document.getElementById("bp2-vocab");
  var standardEl = document.getElementById("bp2-standard");
  var savedEl = document.getElementById("bp2-saved");
  var meterEl = document.getElementById("bp2-meter");
  var candidatesEl = document.getElementById("bp2-candidates");
  var candidateHint = document.getElementById("bp2-candidate-hint");
  var compareEl = document.getElementById("bp2-compare");
  var compareNote = document.getElementById("bp2-compare-note");
  var starsEl = document.getElementById("bp2-stars");
  var readout = document.getElementById("bp2-readout");
  var resetBtn = document.getElementById("bp2-reset");
  var standardBtn = document.getElementById("bp2-standard-btn");
  var newInput = document.getElementById("bp2-new-input");
  var splitCompare = document.getElementById("bp2-split-compare");
  var newNote = document.getElementById("bp2-new-note");
  var toastEl = document.getElementById("bp2-toast");
  var badge = document.getElementById("bp2-badge");

  var start = startWords();
  var startTokens = totalSymbols(start);
  var greedy = greedyRun(start, MERGES);
  var standard = {
    words: greedy.words,
    tokens: totalSymbols(greedy.words),
    vocab: vocabOf(greedy.words),
    merges: greedy.merges
  };

  var state = {
    words: startWords(),
    used: 0,
    done: false,
    lastNew: null,
    replaying: false,
    best: loadBest()
  };
  var animTimer = 0;
  var replayTimer = 0;
  var toastTimer = 0;

  function startWords() {
    return CORPUS.map(function (c) {
      return { word: c.word, count: c.count, symbols: c.word.split("") };
    });
  }
  function clone(words) {
    return words.map(function (w) { return { word: w.word, count: w.count, symbols: w.symbols.slice() }; });
  }
  function pairCounts(words) {
    var map = {};
    words.forEach(function (w) {
      for (var i = 0; i < w.symbols.length - 1; i++) {
        var key = w.symbols[i] + "\u0001" + w.symbols[i + 1];
        if (!map[key]) map[key] = { a: w.symbols[i], b: w.symbols[i + 1], count: 0 };
        map[key].count += w.count;
      }
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) {
      return b.count - a.count || (a.a + a.b).localeCompare(b.a + b.b);
    });
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
  function vocabOf(words) {
    var set = {};
    words.forEach(function (w) { w.symbols.forEach(function (s) { set[s] = 1; }); });
    return set;
  }
  function greedyRun(words, steps) {
    var cur = clone(words);
    var merges = [];
    for (var s = 0; s < steps; s++) {
      var pairs = pairCounts(cur);
      if (!pairs.length) break;
      var top = pairs[0];
      cur = mergePair(cur, top);
      merges.push(top);
    }
    return { words: cur, merges: merges };
  }
  function tokenizeWithVocab(word, vocab) {
    var out = [];
    var list = Object.keys(vocab).sort(function (a, b) { return b.length - a.length || a.localeCompare(b); });
    var i = 0;
    while (i < word.length) {
      var found = null;
      for (var j = 0; j < list.length; j++) {
        var s = list[j];
        if (s && word.slice(i, i + s.length) === s) { found = s; break; }
      }
      if (found) { out.push(found); i += found.length; }
      else { out.push(word.charAt(i)); i++; }
    }
    return out;
  }
  function hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
    return h;
  }
  function symColor(s) { return PALETTE[hash(s) % PALETTE.length]; }
  function esc(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function en() { return window.Proto && Proto.lang() === "en"; }
  function currentTokens() { return totalSymbols(state.words); }
  function currentVocab() { return vocabOf(state.words); }
  function saved() { return startTokens - currentTokens(); }

  function loadBest() {
    try {
      var v = parseInt(sessionStorage.getItem("eoy_test4_bpe_best") || "", 10);
      return isFinite(v) && v > 0 ? v : null;
    } catch (e) { return null; }
  }
  function saveBest(v) {
    try { sessionStorage.setItem("eoy_test4_bpe_best", String(v)); } catch (e) {}
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 3400);
  }

  function renderWords() {
    wordsEl.innerHTML = state.words.map(function (w) {
      var syms = w.symbols.map(function (s) {
        var merged = s.length > 1;
        return '<span class="bp2-sym' + (merged ? " is-merge" : "") + '" style="--sym:' + symColor(s) + '" data-sym="' + esc(s) + '">' + esc(s) + '</span>';
      }).join("");
      return '<div class="bp2-word"><span class="bp2-word-label">' + esc(w.word) + '</span>' +
        '<span class="bp2-word-count">' + w.count + '</span>' +
        '<span class="bp2-symbols">' + syms + '</span></div>';
    }).join("");
    corpusNote.textContent = state.done
      ? (en() ? "4 merges · final vocabulary" : "4 Merges · fertiges Vokabular")
      : (en() ? state.used + " of 4 merges" : state.used + " von 4 Merges");
    if (state.lastNew) {
      var fresh = state.lastNew;
      Array.prototype.forEach.call(wordsEl.querySelectorAll(".bp2-sym"), function (el) {
        if (el.getAttribute("data-sym") === fresh) el.classList.add("is-new");
      });
      clearTimeout(animTimer);
      animTimer = setTimeout(function () {
        Array.prototype.forEach.call(wordsEl.querySelectorAll(".bp2-sym.is-new"), function (el) {
          el.classList.remove("is-new");
        });
        if (state.lastNew === fresh) state.lastNew = null;
      }, 760);
    }
  }

  function renderBudget() {
    var left = MERGES - state.used;
    budgetLabel.textContent = left + " / " + MERGES;
    pipsEl.innerHTML = "";
    for (var i = 0; i < MERGES; i++) {
      var pip = document.createElement("span");
      pip.className = "bp2-pip" + (i < state.used ? " is-used" : "");
      pipsEl.appendChild(pip);
    }
    tokensEl.textContent = currentTokens();
    vocabEl.textContent = Object.keys(currentVocab()).length;
    standardEl.textContent = standard.tokens;
    savedEl.textContent = (saved() >= 0 ? "+" : "") + saved() + (en() ? " saved" : " gespart");
    var span = Math.max(1, startTokens - standard.tokens);
    meterEl.style.width = Math.max(0, Math.min(100, saved() / span * 100)) + "%";
    badge.textContent = state.done
      ? (en() ? "done · " + currentTokens() + " tokens" : "fertig · " + currentTokens() + " Tokens")
      : (en() ? left + " merges left" : left + " Merges übrig");
  }

  function renderCandidates() {
    if (state.done) {
      candidateHint.textContent = en() ? "budget spent" : "Budget aufgebraucht";
      candidatesEl.innerHTML = '<div class="bp2-cand-empty">' +
        (en() ? "Four merges used. Your vocabulary is ready. Probe a new word below." : "Vier Merges verbraucht. Dein Vokabular steht. Probiere unten ein neues Wort.") +
        "</div>";
      return;
    }
    var pairs = pairCounts(state.words);
    if (!pairs.length) {
      candidateHint.textContent = en() ? "no pairs left" : "keine Paare mehr";
      candidatesEl.innerHTML = "";
      return;
    }
    var top = pairs.slice(0, 6);
    var max = top[0].count;
    candidateHint.textContent = en() ? "pick a pair" : "wähle ein Paar";
    candidatesEl.innerHTML = top.map(function (p, i) {
      return '<button type="button" class="bp2-cand' + (i === 0 ? " is-greedy" : "") + '" data-a="' + esc(p.a) + '" data-b="' + esc(p.b) + '">' +
        '<span class="bp2-cand-pair"><span style="color:' + symColor(p.a) + '">' + esc(p.a) + '</span><em>+</em><span style="color:' + symColor(p.b) + '">' + esc(p.b) + '</span><em>→</em><span style="color:' + symColor(p.a + p.b) + '">' + esc(p.a + p.b) + '</span></span>' +
        '<span class="bp2-cand-bar"><i style="width:' + Math.max(6, p.count / max * 100) + '%"></i></span>' +
        '<span class="bp2-cand-count">' + p.count + '×</span>' +
      '</button>';
    }).join("");
  }

  function renderCompare() {
    var tokens = currentTokens();
    var stars = state.done ? starCount(tokens) : 0;
    starsEl.textContent = state.done ? starText(stars) : "—";
    starsEl.style.color = state.done ? "var(--g-gold)" : "var(--g-muted)";
    var youW = Math.max(0, Math.min(100, tokens / startTokens * 100));
    var stdW = Math.max(0, Math.min(100, standard.tokens / startTokens * 100));
    compareEl.innerHTML =
      '<div class="bp2-compare-row is-you"><b>' + (en() ? "you" : "du") + '</b><span class="bp2-compare-track"><i style="width:' + youW + '%"></i></span><span class="bp2-compare-val">' + tokens + '</span></div>' +
      '<div class="bp2-compare-row"><b>' + (en() ? "standard" : "Standard") + '</b><span class="bp2-compare-track"><i style="width:' + stdW + '%"></i></span><span class="bp2-compare-val">' + standard.tokens + '</span></div>';
    if (!state.done) {
      compareNote.innerHTML = en()
        ? '<b>' + (MERGES - state.used) + ' merges left.</b> The standard greedy run reaches <b>' + standard.tokens + '</b> tokens.'
        : '<b>Noch ' + (MERGES - state.used) + ' Merges.</b> Der Standard-Greedy-Lauf kommt auf <b>' + standard.tokens + '</b> Tokens.';
      return;
    }
    if (tokens < standard.tokens) {
      compareNote.innerHTML = en()
        ? '<b>You beat the standard.</b> Your order saves ' + (standard.tokens - tokens) + ' more tokens on this corpus.'
        : '<b>Du hast den Standard geschlagen.</b> Deine Reihenfolge spart ' + (standard.tokens - tokens) + ' weitere Tokens auf diesem Korpus.';
    } else if (tokens === standard.tokens) {
      compareNote.innerHTML = en()
        ? '<b>You matched the greedy run.</b> The most frequent pair first is a strong strategy here. But it is still a choice, not a law.'
        : '<b>Du hast den Greedy-Lauf getroffen.</b> Das häufigste Paar zuerst ist hier eine starke Strategie. Aber es ist eine Entscheidung, kein Gesetz.';
    } else {
      compareNote.innerHTML = en()
        ? '<b>The standard is ' + (tokens - standard.tokens) + ' tokens better.</b> A different order spent budget on pairs that helped fewer words.'
        : '<b>Der Standard ist ' + (tokens - standard.tokens) + ' Tokens besser.</b> Eine andere Reihenfolge hat Budget für Paare ausgegeben, die weniger Wörtern halfen.';
    }
    if (state.best != null) {
      compareNote.innerHTML += '<br><span style="opacity:.75">' + (en() ? "best this session: " : "Bestwert dieser Sitzung: ") + state.best + (en() ? " tokens" : " Tokens") + "</span>";
    }
  }

  function starCount(tokens) {
    if (tokens <= standard.tokens) return 3;
    if (tokens <= 54) return 2;
    return 1;
  }
  function starText(n) {
    var out = "";
    for (var i = 0; i < 3; i++) out += i < n ? "★" : "☆";
    return out + "  " + n + " / 3";
  }

  function renderSplit() {
    var raw = (newInput.value || "").trim().toLowerCase().replace(/\s+/g, "");
    var word = raw.slice(0, 24);
    if (!word) {
      splitCompare.innerHTML = "";
      newNote.textContent = en() ? "Type a word to probe the vocabulary." : "Tippe ein Wort ein, um das Vokabular zu testen.";
      return;
    }
    var mine = tokenizeWithVocab(word, currentVocab());
    var std = tokenizeWithVocab(word, standard.vocab);
    splitCompare.innerHTML = splitRow(en() ? "yours" : "dein", mine, true) + splitRow(en() ? "standard" : "Standard", std, false);
    if (mine.length < std.length) {
      newNote.innerHTML = en()
        ? '<b>Your vocabulary wins here:</b> ' + mine.length + ' tokens against ' + std.length + '. It learned a piece that fits this word.'
        : '<b>Dein Vokabular gewinnt hier:</b> ' + mine.length + ' Tokens gegen ' + std.length + '. Es hat ein Stück gelernt, das zu diesem Wort passt.';
    } else if (mine.length > std.length) {
      newNote.innerHTML = en()
        ? '<b>The standard wins here:</b> ' + std.length + ' tokens against ' + mine.length + '. Your budget went to other words.'
        : '<b>Der Standard gewinnt hier:</b> ' + std.length + ' Tokens gegen ' + mine.length + '. Dein Budget ging an andere Wörter.';
    } else {
      newNote.innerHTML = en()
        ? 'Both split this word into ' + mine.length + ' tokens, possibly with different pieces.'
        : 'Beide zerlegen dieses Wort in ' + mine.length + ' Tokens, möglicherweise mit anderen Stücken.';
    }
    if (!state.done) {
      newNote.innerHTML = (en() ? "Mid-run after " : "Zwischenstand nach ") + state.used + (en() ? " merges. " : " Merges. ") + newNote.innerHTML;
    }
  }
  function splitRow(label, tokens, you) {
    var chips = tokens.map(function (s) {
      return '<span class="bp2-sym' + (s.length > 1 ? " is-merge" : "") + '" style="--sym:' + symColor(s) + '">' + esc(s) + '</span>';
    }).join("");
    return '<div class="bp2-split' + (you ? " is-you" : "") + '"><span class="bp2-split-label">' + label + '</span><span class="bp2-split-tokens">' + chips + '</span><span class="bp2-split-count">' + tokens.length + '</span></div>';
  }

  function renderReadout() {
    var tokens = currentTokens();
    if (!state.used) {
      readout.innerHTML = en()
        ? '<b>Choose the first merge.</b> The most frequent pair is marked “greedy”, but you may pick another. Every merge costs one vocabulary slot.'
        : '<b>Wähle den ersten Merge.</b> Das häufigste Paar ist als „greedy“ markiert, du darfst aber ein anderes nehmen. Jeder Merge kostet einen Vokabular-Platz.';
      return;
    }
    if (!state.done) {
      var left = MERGES - state.used;
      readout.innerHTML = en()
        ? '<b>' + state.used + ' / ' + MERGES + ' merges.</b> ' + tokens + ' tokens, ' + (en() ? "standard" : "Standard") + ' ' + standard.tokens + '. ' + left + ' decisions left.'
        : '<b>' + state.used + ' / ' + MERGES + ' Merges.</b> ' + tokens + ' Tokens, Standard ' + standard.tokens + '. Noch ' + left + ' Entscheidungen.';
      return;
    }
    if (tokens === standard.tokens) {
      readout.innerHTML = en()
        ? '<b>Done: ' + tokens + ' tokens.</b> You matched the greedy run. Now look at the new word: your vocabulary may split it differently even when the corpus count is the same.'
        : '<b>Fertig: ' + tokens + ' Tokens.</b> Du hast den Greedy-Lauf getroffen. Schau jetzt auf das neue Wort: Dein Vokabular kann es anders zerlegen, obwohl die Korpuszahl gleich ist.';
    } else if (tokens > standard.tokens) {
      readout.innerHTML = en()
        ? '<b>Done: ' + tokens + ' tokens.</b> The standard is better on this corpus. The merge order is a real decision, and four choices are enough to lose ' + (tokens - standard.tokens) + ' tokens.'
        : '<b>Fertig: ' + tokens + ' Tokens.</b> Der Standard ist auf diesem Korpus besser. Die Merge-Reihenfolge ist eine echte Entscheidung, und vier Wahlen reichen, um ' + (tokens - standard.tokens) + ' Tokens zu verlieren.';
    } else {
      readout.innerHTML = en()
        ? '<b>Done: ' + tokens + ' tokens.</b> You beat the standard on this corpus. The greedy choice is a heuristic, not an optimum.'
        : '<b>Fertig: ' + tokens + ' Tokens.</b> Du hast den Standard auf diesem Korpus geschlagen. Die Greedy-Wahl ist eine Heuristik, kein Optimum.';
    }
  }

  function renderAll() {
    renderWords();
    renderBudget();
    renderCandidates();
    renderCompare();
    renderSplit();
    renderReadout();
  }

  function applyMerge(a, b) {
    if (state.done) return;
    state.words = mergePair(state.words, { a: a, b: b });
    state.used++;
    state.lastNew = a + b;
    if (state.used >= MERGES) {
      state.done = true;
      state.replaying = false;
      var tokens = totalSymbols(state.words);
      if (state.best == null || tokens < state.best) {
        state.best = tokens;
        saveBest(tokens);
      }
      toast(en() ? "4 merges. Your vocabulary is ready." : "4 Merges. Dein Vokabular steht.");
    }
    renderAll();
  }

  candidatesEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-a]");
    if (!b || state.done) return;
    if (state.replaying) {
      state.replaying = false;
      clearTimeout(replayTimer);
    }
    applyMerge(b.getAttribute("data-a"), b.getAttribute("data-b"));
  });

  newInput.addEventListener("input", renderSplit);

  resetBtn.addEventListener("click", function () {
    state.replaying = false;
    clearTimeout(replayTimer);
    state.words = startWords();
    state.used = 0;
    state.done = false;
    state.lastNew = null;
    toastEl.classList.remove("is-on");
    renderAll();
  });

  standardBtn.addEventListener("click", function () {
    resetBtn.click();
    state.replaying = true;
    var step = 0;
    function next() {
      if (!state.replaying || step >= standard.merges.length) {
        state.replaying = false;
        return;
      }
      var m = standard.merges[step++];
      applyMerge(m.a, m.b);
      replayTimer = setTimeout(next, 620);
    }
    next();
  });

  if (window.Proto && Proto.onLang) Proto.onLang(renderAll);
  renderAll();
})();
