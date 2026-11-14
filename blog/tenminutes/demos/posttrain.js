(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function posttrainScene(root, api) {
    var DE = api.lang === "de";
    var prompt = DE ? "Erkläre in einem Satz, warum der Himmel blau ist." : "Explain in one sentence why the sky is blue.";
    var stages = DE ? [
      {
        id: "base", label: "Basismodell", note: "Pretraining: Das Modell setzt Text fort.",
        text: "Der Himmel ist blau. Das ist eine Frage, die sich viele stellen. Man könnte auch fragen, warum Wasser nass ist, und dann kommt man schnell zu Regen, Wolken, Wetter und ..."
      },
      {
        id: "sft", label: "SFT", note: "Supervised Fine-Tuning: Menschen zeigen gute Antworten.",
        text: "Der Himmel ist blau, weil Luftmoleküle kurzwelliges Licht stärker streuen als langwelliges."
      },
      {
        id: "rlhf", label: "RLHF", note: "Menschen vergleichen Antworten; das Modell lernt die Präferenz.",
        text: "Kurz: Luftmoleküle streuen blaues Licht stärker als rotes. Deshalb wirkt der Himmel blau."
      }
    ] : [
      {
        id: "base", label: "Base model", note: "Pretraining: the model continues text.",
        text: "The sky is blue. That is a question many people ask. One could also ask why water is wet, and then you quickly get to rain, clouds, weather, and ..."
      },
      {
        id: "sft", label: "SFT", note: "Supervised fine-tuning: humans show good answers.",
        text: "The sky is blue because air molecules scatter short-wavelength light more strongly than long-wavelength light."
      },
      {
        id: "rlhf", label: "RLHF", note: "Humans compare answers; the model learns the preference.",
        text: "In short: air molecules scatter blue light more strongly than red. That is why the sky looks blue."
      }
    ];
    var step = 0, pref = null;
    var el = document.createElement("div");
    el.className = "ls-post-scene";
    el.innerHTML = '<div class="ls-post-prompt"><span>' + (DE ? "Prompt" : "Prompt") + '</span><p>' + api.esc(prompt) + '</p></div>' +
      '<div class="ls-post-tabs" role="tablist"></div>' +
      '<div class="ls-post-answer"><div class="ls-post-answer-head"><span class="ls-post-label"></span><span class="ls-post-note"></span></div><p class="ls-post-text"></p></div>' +
      '<div class="ls-post-pref" hidden><div class="ls-post-pref-head">' + (DE ? "Welche Antwort ist besser?" : "Which answer is better?") + '</div>' +
        '<div class="ls-post-pref-grid"><button type="button" data-pref="a"><b>A</b><span class="ls-post-pref-text"></span></button><button type="button" data-pref="b"><b>B</b><span class="ls-post-pref-text"></span></button></div>' +
        '<p class="ls-post-feedback" aria-live="polite"></p>' +
      '</div>' +
      '<div class="ls-tokenize-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-post-prev">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-tokenize-progress ls-post-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-post-next">' + (DE ? "Weiter" : "Next") + ' →</button></div>';
    root.appendChild(el);
    var tabs = el.querySelector(".ls-post-tabs");
    var label = el.querySelector(".ls-post-label");
    var note = el.querySelector(".ls-post-note");
    var text = el.querySelector(".ls-post-text");
    var prefBox = el.querySelector(".ls-post-pref");
    var prefButtons = el.querySelectorAll("[data-pref]");
    var prefTexts = el.querySelectorAll(".ls-post-pref-text");
    var feedback = el.querySelector(".ls-post-feedback");
    var prevBtn = el.querySelector(".ls-post-prev");
    var nextBtn = el.querySelector(".ls-post-next");
    var progress = el.querySelector(".ls-post-progress");
    function render() {
      var st = stages[step];
      tabs.innerHTML = stages.map(function (s, i) {
        return '<button type="button" class="ls-chip' + (i === step ? ' is-on' : '') + '" data-stage="' + s.id + '" role="tab" aria-selected="' + (i === step ? 'true' : 'false') + '">' + api.esc(s.label) + '</button>';
      }).join("");
      tabs.querySelectorAll("[data-stage]").forEach(function (b) {
        b.addEventListener("click", function () { setStep(stages.map(function (x) { return x.id; }).indexOf(b.getAttribute("data-stage"))); });
      });
      label.textContent = st.label;
      note.textContent = st.note;
      text.textContent = st.text;
      prefBox.hidden = step !== 2;
      if (step === 2) {
        prefTexts[0].textContent = stages[1].text;
        prefTexts[1].textContent = stages[2].text;
        prefButtons.forEach(function (b) {
          b.classList.toggle("is-on", pref === b.getAttribute("data-pref"));
          b.setAttribute("aria-pressed", pref === b.getAttribute("data-pref") ? "true" : "false");
        });
        feedback.textContent = pref === "a"
          ? (DE ? "Kürzer und direkter ist hier oft besser. Menschen wählen B häufiger; daraus lernt das Reward-Modell." : "Shorter and more direct is often better here. People pick B more often; the reward model learns from that.")
          : pref === "b"
            ? (DE ? "Richtig. Aus vielen Vergleichen lernt ein Reward-Modell; RLHF verschiebt die Antworten in diese Richtung." : "Correct. From many comparisons a reward model learns; RLHF shifts answers in this direction.")
            : (DE ? "Wähle A oder B." : "Choose A or B.");
      } else {
        feedback.textContent = "";
      }
      progress.textContent = (step + 1) + " / " + stages.length;
      prevBtn.disabled = step === 0;
      nextBtn.textContent = step === stages.length - 1 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
    }
    function setStep(i) {
      step = Math.max(0, Math.min(stages.length - 1, i));
      pref = null;
      render();
    }
    function nextInternal() { if (step < stages.length - 1) { setStep(step + 1); return true; } return false; }
    function prevInternal() { if (step > 0) { setStep(step - 1); return true; } return false; }
    function nextStep() {
      if (nextInternal()) return;
      api.goNext();
    }
    function prevStep() {
      if (prevInternal()) return;
      api.goPrev();
    }
    prefButtons.forEach(function (b) {
      b.addEventListener("click", function () { pref = b.getAttribute("data-pref"); render(); });
    });
    prevBtn.addEventListener("click", prevStep);
    nextBtn.addEventListener("click", nextStep);
    render();
    return {
      update: function (s) { if (s && typeof s.step === "number") setStep(s.step); },
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) {
        return api.util.arrowKey(e, nextInternal, prevInternal);
      },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }

  core.register("posttrain", posttrainScene);
})();
