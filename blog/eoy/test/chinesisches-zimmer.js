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
  var activeFly = null;
  var activeAnim = null;
  var page = 0;
  var turning = false;

  function clearTimers() {
    timers.forEach(function (id) { clearTimeout(id); });
    timers = [];
  }
  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }

  function clearFly() {
    if (activeAnim) {
      activeAnim.onfinish = null;
      try { activeAnim.cancel(); } catch (e) {}
      activeAnim = null;
    }
    if (activeFly) { activeFly.remove(); activeFly = null; }
  }

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

  function rulePageHTML(p) {
    if (p == null) {
      return '<div class="crz-book-title">' + T("Regelbuch", "Rulebook") + '</div>' +
        '<p class="crz-book-hint">' + T("Blättere, bis du die Eingabe findest. Du musst die Zeichen nicht verstehen.", "Flip until you find the input. You do not need to understand the characters.") + '</p>';
    }
    var r = rounds[p];
    return '<span class="crz-book-kicker">' + T("Regel", "Rule") + ' ' + (p + 1) + '</span>' +
      '<div class="crz-rule">' +
        '<span class="crz-rule-label">' + T("Eingabe", "Input") + '</span>' +
        '<p class="crz-rule-zh" lang="zh">' + esc(r.rule[0]) + '</p>' +
        '<span class="crz-rule-arrow" aria-hidden="true">↓</span>' +
        '<span class="crz-rule-label">' + T("Ausgabe", "Output") + '</span>' +
        '<p class="crz-rule-zh" lang="zh">' + esc(r.rule[1]) + '</p>' +
      '</div>';
  }

  function renderBook() {
    var left = page === 0 ? rulePageHTML(null) : rulePageHTML(page - 1);
    var right = rulePageHTML(page);
    book.innerHTML =
      '<div class="crz-book-cover" aria-hidden="true"></div>' +
      '<div class="crz-book-stack" aria-hidden="true"></div>' +
      '<div class="crz-book-spread">' +
        '<div class="crz-book-page crz-book-page--left">' + left + '</div>' +
        '<div class="crz-book-page crz-book-page--right" data-crz-right>' + right + '</div>' +
        '<span class="crz-book-spine" aria-hidden="true"></span>' +
        '<button type="button" class="crz-book-turn" data-crz-turn aria-label="' + T("Seite umblättern", "Turn page") + '">' +
          '<span>' + T("Seite", "Page") + '</span>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>' +
        '</button>' +
        '<span class="crz-book-pageno">' + T("Regel", "Rule") + ' ' + (page + 1) + ' / ' + rounds.length + '</span>' +
      '</div>';
  }

  function turnBook() {
    if (turning) return;
    var next = (page + 1) % rounds.length;
    var oldRight = book.querySelector("[data-crz-right]");
    if (!oldRight || !oldRight.animate || !window.Proto || Proto.reduceMotion()) {
      page = next;
      renderBook();
      return;
    }
    var oldHTML = oldRight.innerHTML;
    page = next;
    renderBook();
    var spread = book.querySelector(".crz-book-spread");
    if (!spread) return;
    var flip = document.createElement("div");
    flip.className = "crz-page-flip is-turning";
    flip.innerHTML = '<div class="crz-flip-face">' + oldHTML + '</div>' +
      '<div class="crz-flip-face crz-flip-face--back">' + oldHTML + '</div>';
    spread.appendChild(flip);
    turning = true;
    flip.addEventListener("animationend", function () {
      flip.remove();
      turning = false;
    }, { once: true });
  }

  book.addEventListener("click", function (e) {
    var target = e.target;
    var btn = target && target.closest ? target.closest("[data-crz-turn]") : null;
    if (!btn) return;
    e.preventDefault();
    turnBook();
  });

  function slipMarkup(text) {
    return '<span class="crz-slip-label">' + T("Von draußen", "From outside") + '</span>' +
      '<p class="crz-slip-text" lang="zh">' + esc(text) + '</p>' +
      '<p class="crz-slip-sub">' + T("Du verstehst die Zeichen nicht. Wenn du zufällig Chinesisch kannst, tue so, als könntest du es nicht.", "You do not understand the characters. If you happen to know Chinese, pretend you do not.") + '</p>' +
      '<span class="crz-seal" lang="zh" aria-hidden="true">入</span>';
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
      b.disabled = busy;
      b.addEventListener("click", function () { choose(opt, b); });
      optionsEl.appendChild(b);
    });
  }

  function setOptionsEnabled(on) {
    Array.prototype.forEach.call(optionsEl.querySelectorAll("button"), function (b) {
      if (!b.classList.contains("is-wrong")) b.disabled = !on;
    });
  }

  function relRect(el, rr) {
    var r = el.getBoundingClientRect();
    return { left: r.left - rr.left, top: r.top - rr.top, width: r.width, height: r.height };
  }

  function makeFly(text, left, top, width, height, label) {
    var fly = document.createElement("div");
    fly.className = "crz-fly";
    fly.style.left = left + "px";
    fly.style.top = top + "px";
    fly.style.width = width + "px";
    fly.style.height = height + "px";
    fly.innerHTML = '<div class="crz-fly-paper"><span class="crz-fly-label">' + label + '</span><p lang="zh">' + esc(text) + '</p></div>';
    room.appendChild(fly);
    return fly;
  }

  function scrollNeeded() {
    return window.matchMedia && window.matchMedia("(max-width: 780px)").matches;
  }

  function flyIn() {
    var r = rounds[idx];
    if (scrollNeeded() || !slip.animate) {
      slip.classList.remove("is-waiting");
      busy = false;
      setOptionsEnabled(true);
      if (slot) {
        slot.classList.add("is-flash");
        later(function () { slot.classList.remove("is-flash"); }, 520);
      }
      return;
    }
    var rr = room.getBoundingClientRect();
    var sr = slot.getBoundingClientRect();
    var pr = slip.getBoundingClientRect();
    var w = pr.width, h = pr.height;
    var startLeft = (sr.left + sr.width / 2 - rr.left) - w / 2;
    var startTop = (sr.top + sr.height / 2 - rr.top) - h / 2;
    var endLeft = pr.left - rr.left;
    var endTop = pr.top - rr.top;
    var dx = endLeft - startLeft, dy = endTop - startTop;

    activeFly = makeFly(r.input, startLeft, startTop, w, h, T("Von draußen", "From outside"));
    if (slot) {
      slot.classList.add("is-flash");
      later(function () { slot.classList.remove("is-flash"); }, 620);
    }
    var frames = [
      { transform: "translate(0,0) rotate(-15deg) scale(.55)", opacity: 0, offset: 0 },
      { transform: "translate(" + (dx * 0.10) + "px," + (dy * 0.08) + "px) rotate(11deg) scale(.7)", opacity: 1, offset: 0.16 },
      { transform: "translate(" + (dx * 0.32 - 9) + "px," + (dy * 0.34) + "px) rotate(-9deg) scale(.83)", opacity: 1, offset: 0.38 },
      { transform: "translate(" + (dx * 0.60 + 8) + "px," + (dy * 0.60) + "px) rotate(7deg) scale(.92)", opacity: 1, offset: 0.62 },
      { transform: "translate(" + (dx * 0.85 - 4) + "px," + (dy * 0.84) + "px) rotate(-4deg) scale(.98)", opacity: 1, offset: 0.84 },
      { transform: "translate(" + dx + "px," + dy + "px) rotate(-1.4deg) scale(1)", opacity: 1, offset: 1 }
    ];
    activeAnim = activeFly.animate(frames, { duration: 860, easing: "cubic-bezier(.3,.7,.2,1)", fill: "forwards" });
    activeAnim.onfinish = function () {
      clearFly();
      slip.classList.remove("is-waiting");
      busy = false;
      setOptionsEnabled(true);
    };
  }

  function flyOut(text, after) {
    if (scrollNeeded() || !slip.animate) {
      if (after) after();
      return;
    }
    var rr = room.getBoundingClientRect();
    var sr = slot.getBoundingClientRect();
    var pr = slip.getBoundingClientRect();
    var w = pr.width, h = pr.height;
    var startLeft = pr.left - rr.left;
    var startTop = pr.top - rr.top;
    var dx = (sr.left + sr.width / 2 - rr.left) - (startLeft + w / 2);
    var dy = (sr.top + sr.height / 2 - rr.top) - (startTop + h / 2) - 60;

    activeFly = makeFly(text, startLeft, startTop, w, h, T("Deine Antwort", "Your answer"));
    slip.classList.add("is-waiting");
    var frames = [
      { transform: "translate(0,0) rotate(-1.4deg) scale(1)", opacity: 1, offset: 0 },
      { transform: "translate(" + (dx * 0.3) + "px," + (dy * 0.34) + "px) rotate(-7deg) scale(.86)", opacity: 1, offset: 0.45 },
      { transform: "translate(" + (dx * 0.78) + "px," + (dy * 0.82) + "px) rotate(8deg) scale(.55)", opacity: 1, offset: 0.8 },
      { transform: "translate(" + dx + "px," + dy + "px) rotate(14deg) scale(.2)", opacity: 0, offset: 1 }
    ];
    activeAnim = activeFly.animate(frames, { duration: 700, easing: "cubic-bezier(.4,.1,.6,1)", fill: "forwards" });
    if (slot) {
      later(function () { slot.classList.add("is-flash"); }, 260);
      later(function () { slot.classList.remove("is-flash"); }, 760);
    }
    activeAnim.onfinish = function () {
      clearFly();
      if (after) after();
    };
  }

  function renderRound() {
    clearFly();
    busy = true;
    turning = false;
    page = idx;
    if (feedbackEl) feedbackEl.textContent = "";
    renderHud();
    renderBook();
    slip.className = "crz-slip is-waiting";
    slip.innerHTML = slipMarkup(rounds[idx].input);
    renderOptions();
    flyIn();
  }

  function advance() {
    idx++;
    if (idx < rounds.length) renderRound();
    else showReveal();
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
        flyOut(r.answer, function () { advance(); });
      }, 340);
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
    clearFly();
    done = false;
    busy = false;
    turning = false;
    idx = 0;
    score = 0;
    page = 0;
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
      clearFly();
      idx = keep;
      score = keepScore;
      renderRound();
    });
  }

  renderRound();
})();
