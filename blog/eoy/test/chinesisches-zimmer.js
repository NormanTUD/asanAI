(function () {
  "use strict";

  var room = document.getElementById("crz-room");
  var slip = document.getElementById("crz-slip");
  var book = document.getElementById("crz-book");
  var optionsEl = document.getElementById("crz-options");
  var feedbackEl = document.getElementById("crz-feedback");
  var hud = document.getElementById("crz-hud");
  var slot = document.getElementById("crz-slot");
  var reveal = document.getElementById("crz-reveal");
  var revealCard = document.getElementById("crz-reveal-card");
  if (!room || !slip || !book || !optionsEl) return;

  var T = function (de, en) { return window.Proto ? Proto.t(de, en) : de; };
  var idx = 0;
  var score = 0;
  var done = false;
  var busy = false;
  var timers = [];

  function clearTimers() {
    timers.forEach(function (id) { clearTimeout(id); });
    timers = [];
  }
  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }

  var rounds = [
    {
      input: "今天天气怎么样？",
      answer: "今天天气很冷。",
      options: ["我喜欢喝茶。", "今天天气很冷。", "门是开着的。"],
      rule: ["今天天气怎么样？", "今天天气很冷。"],
      de: "Wie ist das Wetter heute? → Das Wetter ist heute kalt.",
      en: "How is the weather today? → The weather is cold today."
    },
    {
      input: "你叫什么名字？",
      answer: "我叫小明。",
      options: ["外面在下雨。", "我叫小明。", "他住在北京。"],
      rule: ["你叫什么名字？", "我叫小明。"],
      de: "Wie heißt du? → Ich heiße Xiaoming.",
      en: "What is your name? → My name is Xiaoming."
    },
    {
      input: "现在几点？",
      answer: "现在三点。",
      options: ["现在三点。", "我喜欢猫。", "窗户是关着的。"],
      rule: ["现在几点？", "现在三点。"],
      de: "Wie spät ist es? → Es ist drei Uhr.",
      en: "What time is it? → It is three o'clock."
    }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function renderHud() {
    if (!hud) return;
    hud.innerHTML =
      '<span class="crz-hud-chip"><span class="crz-hud-dot" aria-hidden="true"></span><span>' +
        T("Runde", "Round") + ' <b>' + (idx + 1) + ' / ' + rounds.length + '</b></span></span>' +
      '<span class="crz-hud-chip"><span>' + T("Regeln befolgt", "Rules followed") + ' <b>' + score + '</b></span></span>';
  }

  function renderBook() {
    var r = rounds[idx];
    var other = rounds[(idx + 1) % rounds.length];
    book.innerHTML =
      '<div class="crz-book-title">' + T("Regelbuch", "Rulebook") + '</div>' +
      '<table><tbody>' +
        '<tr><td lang="zh">' + esc(r.rule[0]) + '</td><td lang="zh">' + esc(r.rule[1]) + '</td></tr>' +
        '<tr><td lang="zh">' + esc(other.rule[0]) + '</td><td lang="zh">' + esc(other.rule[1]) + '</td></tr>' +
      '</tbody></table>' +
      '<p class="crz-book-hint">' + T("Suche die Eingabe und lies die passende Ausgabe ab. Du musst die Zeichen nicht verstehen.", "Find the input and read off the matching output. You do not need to understand the characters.") + '</p>';
  }

  function renderSlip() {
    var r = rounds[idx];
    slip.className = "crz-slip is-arriving";
    slip.innerHTML =
      '<span class="crz-slip-label">' + T("Von draußen", "From outside") + '</span>' +
      '<p class="crz-slip-text" lang="zh">' + esc(r.input) + '</p>' +
      '<p class="crz-slip-sub">' + T("Du verstehst die Zeichen nicht. Wenn du zufällig Chinesisch kannst, tue so, als könntest du es nicht.", "You do not understand the characters. If you happen to know Chinese, pretend you do not.") + '</p>' +
      '<span class="crz-seal" lang="zh" aria-hidden="true">入</span>';
    if (slot) {
      slot.classList.add("is-flash");
      later(function () { slot.classList.remove("is-flash"); }, 520);
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { slip.classList.remove("is-arriving"); });
    });
  }

  function renderOptions() {
    var r = rounds[idx];
    var shuffled = r.options.slice().sort(function () { return Math.random() - 0.5; });
    optionsEl.innerHTML = "";
    shuffled.forEach(function (opt) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "crz-choice";
      b.lang = "zh";
      b.textContent = opt;
      b.addEventListener("click", function () { choose(opt, b); });
      optionsEl.appendChild(b);
    });
  }

  function renderRound() {
    busy = false;
    if (feedbackEl) feedbackEl.textContent = "";
    renderHud();
    renderBook();
    renderSlip();
    renderOptions();
  }

  function choose(opt, btn) {
    if (done || busy) return;
    var r = rounds[idx];
    if (opt === r.answer) {
      busy = true;
      score++;
      btn.classList.add("is-right");
      Array.prototype.forEach.call(optionsEl.querySelectorAll("button"), function (b) { b.disabled = true; });
      slip.classList.add("is-correct");
      if (feedbackEl) feedbackEl.textContent = T("Richtig. Du hast die Regel befolgt, ohne die Zeichen zu verstehen.", "Correct. You followed the rule without understanding the characters.");
      renderHud();
      later(function () {
        idx++;
        if (idx < rounds.length) renderRound();
        else showReveal();
      }, 1000);
    } else {
      btn.classList.add("is-wrong");
      btn.disabled = true;
      slip.classList.remove("is-wrong");
      void slip.offsetWidth;
      slip.classList.add("is-wrong");
      if (feedbackEl) feedbackEl.textContent = T("Schau ins Regelbuch: Welche Ausgabe steht bei dieser Eingabe?", "Check the rulebook: which output belongs to this input?");
    }
  }

  function showReveal() {
    done = true;
    if (!reveal || !revealCard) return;
    var rows = rounds.map(function (r) {
      return '<tr><td class="zh" lang="zh">' + esc(r.input) + '</td>' +
        '<td class="zh" lang="zh">' + esc(r.answer) + '</td>' +
        '<td class="gloss">' + esc(T(r.de, r.en)) + '</td></tr>';
    }).join("");
    revealCard.innerHTML =
      '<div class="crz-reveal-head">' + T("Was du gerade getan hast", "What you just did") + '</div>' +
      '<h2 class="crz-reveal-title">' + T("Von außen sah es aus wie Verstehen.", "From the outside it looked like understanding.") + '</h2>' +
      '<table><tbody>' + rows + '</tbody></table>' +
      '<p class="crz-reveal-note">' + T("Innen hast du Zeichen nach Regeln ersetzt. Searle (1980) nennt das den Unterschied zwischen Symbolmanipulation und Bedeutung. Ob das ganze System versteht, ist umstritten.", "Inside, you replaced symbols by rules. Searle (1980) calls this the difference between symbol manipulation and meaning. Whether the whole system understands is disputed.") + '</p>' +
      '<div class="crz-reveal-actions"><button type="button" class="proto-btn" data-crz-restart>' + T("Neu starten", "Restart") + '</button></div>';
    reveal.classList.add("is-visible");
    reveal.setAttribute("aria-hidden", "false");
    var restart = revealCard.querySelector("[data-crz-restart]");
    if (restart) restart.addEventListener("click", restartAll);
  }

  function hideReveal() {
    if (!reveal) return;
    reveal.classList.remove("is-visible");
    reveal.setAttribute("aria-hidden", "true");
  }

  function restartAll() {
    clearTimers();
    done = false;
    busy = false;
    idx = 0;
    score = 0;
    hideReveal();
    renderRound();
  }

  if (window.Proto) {
    Proto.onLang(function () {
      if (done) {
        showReveal();
        return;
      }
      var keep = idx;
      var keepScore = score;
      clearTimers();
      idx = keep;
      score = keepScore;
      renderRound();
    });
  }

  renderRound();
})();
