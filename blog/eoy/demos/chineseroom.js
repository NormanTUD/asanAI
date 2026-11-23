(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;

  function chineseRoomScene(root, api) {
    var DE = api.lang === "de";
    var esc = api.esc;
    function T(de, en) { return DE ? de : en; }

    var el = document.createElement("div");
    el.className = "ls-cr2-scene";
    el.innerHTML =
      '<p class="ls-cr2-note">' + T(
        "Du verstehst die Zeichen nicht. Wenn du zufällig Chinesisch kannst, tue so, als könntest du es nicht.",
        "You do not understand the characters. If you happen to know Chinese, pretend you do not."
      ) + '</p>' +
      '<div class="ls-cr2-room">' +
        '<div class="ls-cr2-wall" aria-hidden="true"></div>' +
        '<div class="ls-cr2-window" aria-hidden="true"><span class="ls-cr2-stars"></span><span class="ls-cr2-moon" aria-hidden="true">🌕</span></div>' +
        '<div class="ls-cr2-slot"><span class="ls-cr2-slot-label">' + T("Einwurf", "Slot") + '</span><span class="ls-cr2-slot-slit" aria-hidden="true"></span></div>' +
        '<div class="ls-cr2-lamp" aria-hidden="true"><span class="ls-cr2-cord"></span><span class="ls-cr2-shade"></span><span class="ls-cr2-light"></span></div>' +
        '<div class="ls-cr2-floor" aria-hidden="true"></div>' +
        '<div class="ls-cr2-desk">' +
          '<div class="ls-cr2-slip"></div>' +
          '<div class="ls-cr2-book"></div>' +
          '<div class="ls-cr2-options" role="group" aria-label="' + T("Antwort wählen", "Choose an answer") + '"></div>' +
          '<p class="ls-cr2-feedback" aria-live="polite"></p>' +
        '</div>' +
        '<div class="ls-cr2-hud"></div>' +
        '<div class="ls-cr2-reveal" aria-hidden="true"><div class="ls-cr2-reveal-card"></div></div>' +
      '</div>';
    root.appendChild(el);

    var room = el.querySelector(".ls-cr2-room");
    var slip = el.querySelector(".ls-cr2-slip");
    var book = el.querySelector(".ls-cr2-book");
    var optionsEl = el.querySelector(".ls-cr2-options");
    var feedbackEl = el.querySelector(".ls-cr2-feedback");
    var hud = el.querySelector(".ls-cr2-hud");
    var slot = el.querySelector(".ls-cr2-slot");
    var reveal = el.querySelector(".ls-cr2-reveal");
    var revealCard = el.querySelector(".ls-cr2-reveal-card");

    var idx = 0;
    var score = 0;
    var done = false;
    var busy = false;
    var page = 0;
    var turning = false;
    var timers = [];
    var activeFly = null;
    var activeAnim = null;

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

    var RULES = [
      { input: "今天天气怎么样？", answer: "今天天气很冷。", de: "Wie ist das Wetter heute? → Das Wetter ist heute kalt.", en: "How is the weather today? → The weather is cold today." },
      { input: "你叫什么名字？", answer: "我叫小明。", de: "Wie heißt du? → Ich heiße Xiaoming.", en: "What is your name? → My name is Xiaoming." },
      { input: "现在几点？", answer: "现在三点。", de: "Wie spät ist es? → Es ist drei Uhr.", en: "What time is it? → It is three o'clock." },
      { input: "你从哪里来？", answer: "我从北京来。", de: "Woher kommst du? → Ich komme aus Peking.", en: "Where are you from? → I come from Beijing." },
      { input: "你喜欢什么水果？", answer: "我喜欢苹果。", de: "Welches Obst magst du? → Ich mag Äpfel.", en: "Which fruit do you like? → I like apples." },
      { input: "这本书多少钱？", answer: "这本书二十块。", de: "Wie viel kostet dieses Buch? → Dieses Buch kostet zwanzig Yuan.", en: "How much is this book? → This book costs twenty yuan." },
      { input: "火车什么时候到？", answer: "火车九点到。", de: "Wann kommt der Zug an? → Der Zug kommt um neun an.", en: "When does the train arrive? → The train arrives at nine." },
      { input: "洗手间在哪里？", answer: "洗手间在左边。", de: "Wo ist die Toilette? → Die Toilette ist links.", en: "Where is the restroom? → The restroom is on the left." }
    ];
    var ROUND_ORDER = [0, 3, 6];
    var rounds = ROUND_ORDER.map(function (ri) {
      var rule = RULES[ri];
      var pool = RULES.filter(function (_, i) { return i !== ri; }).map(function (r) { return r.answer; });
      return {
        input: rule.input,
        answer: rule.answer,
        options: [rule.answer, pool[(ri + 1) % pool.length], pool[(ri + 3) % pool.length]],
        ruleIndex: ri,
        de: rule.de,
        en: rule.en
      };
    });

    function renderHud() {
      hud.innerHTML =
        '<span class="ls-cr2-hud-chip"><span class="ls-cr2-hud-dot" aria-hidden="true"></span><span>' +
          T("Runde", "Round") + ' <b>' + (idx + 1) + ' / ' + rounds.length + '</b></span></span>' +
        '<span class="ls-cr2-hud-chip"><span>' + T("Regeln befolgt", "Rules followed") + ' <b>' + score + '</b></span></span>';
    }

    function rulePageHTML(p) {
      if (p == null) {
        return '<div class="ls-cr2-book-title">' + T("Regelbuch", "Rulebook") + '</div>' +
          '<p class="ls-cr2-book-hint">' + T("Blättere, bis du die Eingabe findest. Du musst die Zeichen nicht verstehen.", "Flip until you find the input. You do not need to understand the characters.") + '</p>';
      }
      var r = RULES[p];
      return '<span class="ls-cr2-book-kicker">' + T("Regel", "Rule") + ' ' + (p + 1) + '</span>' +
        '<div class="ls-cr2-rule">' +
          '<span class="ls-cr2-rule-label">' + T("Eingabe", "Input") + '</span>' +
          '<p class="ls-cr2-rule-zh" lang="zh">' + esc(r.input) + '</p>' +
          '<span class="ls-cr2-rule-arrow" aria-hidden="true">↓</span>' +
          '<span class="ls-cr2-rule-label">' + T("Ausgabe", "Output") + '</span>' +
          '<p class="ls-cr2-rule-zh" lang="zh">' + esc(r.answer) + '</p>' +
        '</div>';
    }

    function renderBook() {
      var left = page === 0 ? rulePageHTML(null) : rulePageHTML(page - 1);
      var right = rulePageHTML(page);
      book.innerHTML =
        '<div class="ls-cr2-book-cover" aria-hidden="true"></div>' +
        '<div class="ls-cr2-book-stack" aria-hidden="true"></div>' +
        '<div class="ls-cr2-book-spread">' +
          '<div class="ls-cr2-book-page ls-cr2-book-page--left" data-cr2-left>' + left +
            '<span class="ls-cr2-page-no">' + (page + 1) + '</span></div>' +
          '<div class="ls-cr2-book-page ls-cr2-book-page--right" data-cr2-right>' + right +
            '<span class="ls-cr2-page-no">' + (page + 2) + '</span></div>' +
          '<span class="ls-cr2-book-spine" aria-hidden="true"></span>' +
          '<button type="button" class="ls-cr2-book-turn ls-cr2-book-turn--prev" data-cr2-turn="-1" aria-label="' + T("Vorherige Seite", "Previous page") + '"' + (page <= 0 ? " disabled" : "") + '>‹</button>' +
          '<button type="button" class="ls-cr2-book-turn ls-cr2-book-turn--next" data-cr2-turn="1" aria-label="' + T("Nächste Seite", "Next page") + '"' + (page >= RULES.length - 1 ? " disabled" : "") + '>' + T("Seite", "Page") + ' ›</button>' +
        '</div>';
    }

    function turnBook(dir) {
      if (turning) return;
      var next = Math.max(0, Math.min(RULES.length - 1, page + dir));
      if (next === page) return;
      var oldPage = dir > 0 ? book.querySelector("[data-cr2-right]") : book.querySelector("[data-cr2-left]");
      if (!oldPage || !oldPage.animate || api.reducedMotion) {
        page = next;
        renderBook();
        return;
      }
      var oldHTML = oldPage.innerHTML;
      page = next;
      renderBook();
      var spread = book.querySelector(".ls-cr2-book-spread");
      if (!spread) return;
      var flip = document.createElement("div");
      flip.className = "ls-cr2-page-flip" + (dir > 0 ? "" : " ls-cr2-page-flip--back") + " is-turning";
      flip.innerHTML = '<div class="ls-cr2-flip-face">' + oldHTML + '</div>' +
        '<div class="ls-cr2-flip-face ls-cr2-flip-face--back">' + oldHTML + '</div>';
      spread.appendChild(flip);
      turning = true;
      flip.addEventListener("animationend", function () {
        flip.remove();
        turning = false;
      }, { once: true });
    }

    book.addEventListener("click", function (e) {
      var target = e.target;
      var btn = target && target.closest ? target.closest("[data-cr2-turn]") : null;
      if (!btn) return;
      e.preventDefault();
      turnBook(parseInt(btn.getAttribute("data-cr2-turn"), 10) || 1);
    });

    function slipMarkup(text) {
      return '<span class="ls-cr2-slip-label">' + T("Von draußen", "From outside") + '</span>' +
        '<p class="ls-cr2-slip-text" lang="zh">' + esc(text) + '</p>' +
        '<span class="ls-cr2-seal" lang="zh" aria-hidden="true">入</span>';
    }

    function renderOptions() {
      var r = rounds[idx];
      var shuffled = r.options.slice().sort(function () { return Math.random() - 0.5; });
      optionsEl.innerHTML = "";
      shuffled.forEach(function (opt) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ls-cr2-choice";
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

    function makeFly(text, left, top, width, height, label) {
      var fly = document.createElement("div");
      fly.className = "ls-cr2-fly";
      fly.style.left = left + "px";
      fly.style.top = top + "px";
      fly.style.width = width + "px";
      fly.style.height = height + "px";
      fly.innerHTML = '<div class="ls-cr2-fly-paper"><span class="ls-cr2-fly-label">' + label + '</span><p lang="zh">' + esc(text) + '</p></div>';
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
      page = rounds[idx].ruleIndex;
      if (feedbackEl) feedbackEl.textContent = "";
      renderHud();
      renderBook();
      slip.className = "ls-cr2-slip is-waiting";
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
      var rows = rounds.map(function (r) {
        return '<tr><td class="zh" lang="zh">' + esc(r.input) + '</td>' +
          '<td class="zh" lang="zh">' + esc(r.answer) + '</td>' +
          '<td class="gloss">' + esc(T(r.de, r.en)) + '</td></tr>';
      }).join("");
      revealCard.innerHTML =
        '<div class="ls-cr2-reveal-head">' + T("Was du gerade getan hast", "What you just did") + '</div>' +
        '<h2 class="ls-cr2-reveal-title">' + T("Von außen sah es aus wie Verstehen.", "From the outside it looked like understanding.") + '</h2>' +
        '<table><tbody>' + rows + '</tbody></table>' +
        '<p class="ls-cr2-reveal-note">' + T("Innen hast du Zeichen nach Regeln ersetzt. Searle (1980) nennt das den Unterschied zwischen Symbolmanipulation und Bedeutung. Ob das ganze System versteht, ist umstritten.", "Inside, you replaced symbols by rules. Searle (1980) calls this the difference between symbol manipulation and meaning. Whether the whole system understands is disputed.") + '</p>' +
        '<div class="ls-cr2-reveal-actions"><button type="button" class="ls-btn ls-btn--tiny" data-cr2-restart>' + T("Neu starten", "Restart") + '</button></div>';
      reveal.classList.add("is-visible");
      reveal.setAttribute("aria-hidden", "false");
      var restart = revealCard.querySelector("[data-cr2-restart]");
      if (restart) restart.addEventListener("click", restartAll);
    }

    function hideReveal() {
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
      page = rounds[0].ruleIndex;
      hideReveal();
      renderRound();
    }

    function autoChoose() {
      if (done || busy) return false;
      var r = rounds[idx];
      var buttons = Array.prototype.slice.call(optionsEl.querySelectorAll("button"));
      var correct = buttons.filter(function (b) { return b.textContent === r.answer; })[0];
      if (!correct) return false;
      choose(r.answer, correct);
      return true;
    }

    renderRound();

    return {
      update: function () {},
      next: function () {
        if (done) return false;
        if (busy) return true;
        if (feedbackEl && feedbackEl.textContent) return true;
        return autoChoose();
      },
      prev: function () { return false; },
      hasNext: function () { return !done; },
      hasPrev: function () { return false; },
      resize: function () {},
      onKey: function () { return false; },
      destroy: function () {
        clearTimers();
        clearFly();
        el.remove();
      }
    };
  }

  core.register("chineseroom", chineseRoomScene);
})();
