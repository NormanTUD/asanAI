(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function chineseroomScene(root, api) {
    var DE = api.lang === "de";
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
    var idx = 0, score = 0, done = false;
    var el = document.createElement("div");
    el.className = "ls-cr-scene";
    el.innerHTML =
      '<div class="ls-cr-body">' +
        '<div class="ls-cr-room">' +
          '<div class="ls-cr-top"><span class="ls-cr-progress"></span><span class="ls-cr-score"></span></div>' +
          '<div class="ls-cr-incoming"><span class="ls-cr-label">' + (DE ? "Eingabe" : "Input") + '</span><p class="ls-cr-input" lang="zh"></p><p class="ls-cr-sub">' + (DE ? "Du verstehst diese Zeichen nicht. Wenn du zufällig Chinesisch kannst, tue so, als könntest du es nicht." : "You do not understand these characters. If you happen to know Chinese, pretend you do not.") + '</p></div>' +
          '<div class="ls-cr-book"><div class="ls-cr-book-head">' + (DE ? "Regelbuch" : "Rulebook") + '</div><table class="ls-cr-rules" lang="zh"><tbody></tbody></table></div>' +
          '<div class="ls-cr-options" role="group" lang="zh" aria-label="' + (DE ? "Antwort wählen" : "Choose an answer") + '"></div>' +
          '<p class="ls-cr-feedback" aria-live="polite"></p>' +
        '</div>' +
        '<div class="ls-cr-reveal" aria-hidden="true">' +
          '<div class="ls-cr-reveal-head">' + (DE ? "Was du gerade getan hast" : "What you just did") + '</div>' +
          '<table class="ls-cr-trans"><tbody></tbody></table>' +
          '<p class="ls-cr-note">' + (DE ? "Von außen wirkte das wie Verstehen. Innen hast du Zeichen nach Regeln ersetzt. Searle (1980) nennt das den Unterschied zwischen Symbolmanipulation und Bedeutung. Ob das ganze System versteht, ist umstritten." : "From the outside this looked like understanding. Inside you replaced symbols by rules. Searle (1980) calls this the difference between symbol manipulation and meaning. Whether the whole system understands is disputed.") + '</p>' +
          '<button type="button" class="ls-btn ls-btn--tiny ls-cr-restart">' + (DE ? "Neu starten" : "Restart") + '</button>' +
        '</div>' +
      '</div>';
    root.appendChild(el);
    var room = el.querySelector(".ls-cr-room");
    var reveal = el.querySelector(".ls-cr-reveal");
    var progress = el.querySelector(".ls-cr-progress");
    var scoreEl = el.querySelector(".ls-cr-score");
    var inputEl = el.querySelector(".ls-cr-input");
    var rulesBody = el.querySelector(".ls-cr-rules tbody");
    var optionsEl = el.querySelector(".ls-cr-options");
    var feedback = el.querySelector(".ls-cr-feedback");
    var transBody = el.querySelector(".ls-cr-trans tbody");
    function setPanel(showReveal) {
      room.classList.toggle("is-hidden", showReveal);
      reveal.classList.toggle("is-visible", showReveal);
      room.setAttribute("aria-hidden", showReveal ? "true" : "false");
      reveal.setAttribute("aria-hidden", showReveal ? "false" : "true");
    }
    function render() {
      var r = rounds[idx];
      progress.textContent = (DE ? "Runde" : "Round") + " " + (idx + 1) + " / " + rounds.length;
      scoreEl.textContent = (DE ? "Regeln befolgt: " : "Rules followed: ") + score;
      inputEl.textContent = r.input;
      var other = rounds[(idx + 1) % rounds.length];
      rulesBody.innerHTML = "<tr><td>" + api.esc(r.rule[0]) + "</td><td>" + api.esc(r.rule[1]) + "</td></tr>" +
        "<tr><td>" + api.esc(other.rule[0]) + "</td><td>" + api.esc(other.rule[1]) + "</td></tr>";
      optionsEl.innerHTML = "";
      var shuffled = r.options.slice().sort(function () { return Math.random() - 0.5; });
      shuffled.forEach(function (opt) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ls-cr-choice";
        b.textContent = opt;
        b.addEventListener("click", function () { choose(opt, b); });
        optionsEl.appendChild(b);
      });
      feedback.textContent = "";
      setPanel(false);
    }
    function choose(opt, btn) {
      if (done) return;
      var r = rounds[idx];
      if (opt === r.answer) {
        score++;
        btn.classList.add("is-right");
        optionsEl.querySelectorAll("button").forEach(function (b) { b.disabled = true; });
        feedback.textContent = DE ? "Richtig. Du hast die Regel befolgt, ohne die Zeichen zu verstehen." : "Correct. You followed the rule without understanding the characters.";
        setTimeout(function () {
          idx++;
          if (idx < rounds.length) render();
          else showReveal();
        }, 800);
      } else {
        btn.classList.add("is-wrong");
        btn.disabled = true;
        feedback.textContent = DE ? "Schau ins Regelbuch: Welche Ausgabe steht bei dieser Eingabe?" : "Check the rulebook: which output belongs to this input?";
      }
    }
    function showReveal() {
      done = true;
      transBody.innerHTML = "";
      rounds.forEach(function (r) {
        var tr = document.createElement("tr");
        [r.input, r.answer, DE ? r.de : r.en].forEach(function (val, i) {
          var td = document.createElement("td");
          td.textContent = val;
          if (i < 2) td.setAttribute("lang", "zh");
          if (i === 2) td.className = "ls-cr-trans-gloss";
          tr.appendChild(td);
        });
        transBody.appendChild(tr);
      });
      setPanel(true);
    }
    var restart = el.querySelector(".ls-cr-restart");
    restart.addEventListener("click", function () {
      idx = 0; score = 0; done = false;
      render();
    });
    render();
    return {
      update: function () {},
      next: function () {
        if (done) return false;
        if (feedback.textContent) return true;
        var r = rounds[idx];
        var buttons = Array.prototype.slice.call(optionsEl.querySelectorAll("button"));
        var correct = buttons.filter(function (b) { return b.textContent === r.answer; })[0];
        if (!correct) return false;
        choose(r.answer, correct);
        return true;
      },
      hasNext: function () { return !done; },
      hasPrev: function () { return false; },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }

  core.register("chineseroom", chineseroomScene);
})();
