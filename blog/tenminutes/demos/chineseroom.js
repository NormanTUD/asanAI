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
      }
    ];
    var idx = 0, score = 0, done = false;
    var el = document.createElement("div");
    el.className = "ls-cr-scene";
    el.innerHTML =
      '<div class="ls-cr-body">' +
        '<div class="ls-cr-room">' +
          '<div class="ls-cr-top"><span class="ls-cr-progress"></span><span class="ls-cr-score"></span></div>' +
          '<div class="ls-cr-diagram" role="img" aria-label="' + (DE ? "Schematisches Chinesisches Zimmer: Eingabe, Person, Regelbuch, Antwort" : "Schematic Chinese Room: input, person, rulebook, answer") + '">' +
            '<svg viewBox="0 0 460 104">' +
              '<defs><marker id="cr-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#1275ac"/></marker></defs>' +
              '<rect data-room="1" x="6" y="8" width="448" height="88" fill="none" stroke="#004b6f" stroke-width="1.2" stroke-dasharray="6 4"/>' +
              '<text x="14" y="21" font-size="8" fill="#627476">' + (DE ? "Zimmer" : "room") + '</text>' +
              '<rect x="18" y="40" width="78" height="30" fill="#fff" stroke="#b9c8c3"/>' +
              '<text x="57" y="58" text-anchor="middle" font-size="9" fill="#2c464d">' + (DE ? "Eingabe" : "input") + '</text>' +
              '<line x1="98" y1="55" x2="132" y2="55" stroke="#1275ac" stroke-width="1.3" marker-end="url(#cr-arrow)"/>' +
              '<circle cx="158" cy="39" r="10" fill="none" stroke="#004b6f" stroke-width="1.5"/>' +
              '<path d="M158 49 L158 78 M144 60 L172 60 M158 60 L146 72 M158 60 L170 72" fill="none" stroke="#004b6f" stroke-width="1.3"/>' +
              '<text x="158" y="94" text-anchor="middle" font-size="8" fill="#627476">' + (DE ? "du" : "you") + '</text>' +
              '<line x1="178" y1="55" x2="212" y2="55" stroke="#1275ac" stroke-width="1.3" marker-end="url(#cr-arrow)"/>' +
              '<rect x="216" y="34" width="86" height="42" fill="#fff" stroke="#b9c8c3"/>' +
              '<text x="259" y="58" text-anchor="middle" font-size="9" fill="#2c464d">' + (DE ? "Regelbuch" : "rulebook") + '</text>' +
              '<line x1="304" y1="55" x2="340" y2="55" stroke="#1275ac" stroke-width="1.3" marker-end="url(#cr-arrow)"/>' +
              '<rect x="344" y="40" width="88" height="30" fill="#fff" stroke="#b9c8c3"/>' +
              '<text x="388" y="58" text-anchor="middle" font-size="9" fill="#2c464d">' + (DE ? "Antwort" : "answer") + '</text>' +
            '</svg>' +
            '<div class="ls-cr-diagram-caption"><span>' + (DE ? "von außen: sieht wie Verstehen aus" : "from outside: looks like understanding") + '</span><span>' + (DE ? "innen: Zeichen nach Regeln" : "inside: symbols by rules") + '</span></div>' +
            '<button type="button" class="ls-cr-system-btn">' + (DE ? "Systemgrenze zeigen" : "Show system boundary") + '</button>' +
            '<div class="ls-cr-system-note">' + (DE ? "System Reply: Vielleicht versteht nicht die Person, sondern das ganze System aus Person, Regelbuch und Zimmer. Searle hält das für eine Verschiebung des Problems." : "Systems reply: perhaps not the person but the whole system of person, rulebook, and room understands. Searle treats that as moving the problem.") + '</div>' +
          '</div>' +
          '<div class="ls-cr-incoming"><span class="ls-cr-label">' + (DE ? "Eingabe" : "Input") + '</span><p class="ls-cr-input" lang="zh"></p><p class="ls-cr-sub">' + (DE ? "Du liest die Zeichen nicht." : "You cannot read the characters.") + '</p></div>' +
          '<div class="ls-cr-book"><div class="ls-cr-book-head">' + (DE ? "Regelbuch" : "Rulebook") + '</div><table class="ls-cr-rules" lang="zh"><tbody></tbody></table></div>' +
          '<div class="ls-cr-options" role="group" lang="zh" aria-label="' + (DE ? "Antwort wählen" : "Choose an answer") + '"></div>' +
          '<p class="ls-cr-feedback" aria-live="polite"></p>' +
        '</div>' +
        '<div class="ls-cr-reveal" aria-hidden="true">' +
          '<div class="ls-cr-reveal-head">' + (DE ? "Was du gerade getan hast" : "What you just did") + '</div>' +
          '<table class="ls-cr-trans"><tbody></tbody></table>' +
          '<p class="ls-cr-note">' + (DE ? "Von außen wirkte das wie Verstehen. Innen hast du Zeichen nach Regeln ersetzt. Searle (1980) nennt das den Unterschied zwischen Symbolmanipulation und Bedeutung. Ob das ganze System versteht, ist umstritten." : "From the outside this looked like understanding. Inside you replaced symbols by rules. Searle (1980) calls this the difference between symbol manipulation and meaning. Whether the whole system understands is disputed.") + '</p>' +
          '<details class="ls-cr-systems"><summary>' + (DE ? "Ganzen Raum ansehen" : "See the whole room") + '</summary><p>' + (DE ? "Der Systems Reply sagt: Vielleicht versteht nicht die Person im Zimmer, sondern das ganze System aus Person, Regelbuch und Zimmer. Searle hält das für eine Verschiebung des Problems, nicht für eine Lösung. Die Debatte ist offen." : "The systems reply says: perhaps the person in the room does not understand, but the whole system of person, rulebook, and room does. Searle treats that as moving the problem, not solving it. The debate is open.") + '</p></details>' +
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
      r.options.forEach(function (opt) {
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
    var diagram = el.querySelector(".ls-cr-diagram");
    var systemBtn = el.querySelector(".ls-cr-system-btn");
    if (systemBtn) {
      systemBtn.addEventListener("click", function () {
        var on = diagram.classList.toggle("is-system");
        systemBtn.textContent = on
          ? (DE ? "Systemgrenze ausblenden" : "Hide system boundary")
          : (DE ? "Systemgrenze zeigen" : "Show system boundary");
      });
    }
    render();
    return { update: function () {}, resize: function () {}, destroy: function () { el.remove(); } };
  }

  core.register("chineseroom", chineseroomScene);
})();
