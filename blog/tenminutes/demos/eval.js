(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function evalScene(root, api) {
    var DE = api.lang === "de";
    var tasks = DE ? [
      { id: "mmlu", label: "MMLU", title: "MMLU · 57 Fächer", clean: 68, dirty: 92, sample: "Welche Aussage über Photosynthese ist richtig?", note: "Multiple Choice über Faktenwissen und Schlussfolgern." },
      { id: "humaneval", label: "HumanEval", title: "HumanEval · Code", clean: 55, dirty: 88, sample: "Schreibe eine Funktion, die eine Liste umdreht.", note: "Unit-Tests prüfen, ob der Code läuft." },
      { id: "gsm8k", label: "GSM8K", title: "GSM8K · Mathe", clean: 72, dirty: 95, sample: "Ein Zug fährt 60 km/h. Wie weit kommt er in 2,5 Stunden?", note: "Mehrschrittige Textaufgaben mit Zahlen." }
    ] : [
      { id: "mmlu", label: "MMLU", title: "MMLU · 57 subjects", clean: 68, dirty: 92, sample: "Which statement about photosynthesis is correct?", note: "Multiple choice over facts and reasoning." },
      { id: "humaneval", label: "HumanEval", title: "HumanEval · code", clean: 55, dirty: 88, sample: "Write a function that reverses a list.", note: "Unit tests check whether the code runs." },
      { id: "gsm8k", label: "GSM8K", title: "GSM8K · math", clean: 72, dirty: 95, sample: "A train travels 60 km/h. How far does it go in 2.5 hours?", note: "Multi-step word problems with numbers." }
    ];
    var step = 0, dirty = false;
    var el = document.createElement("div");
    el.className = "ls-eval-scene";
    el.innerHTML = '<div class="ls-eval-tabs" role="tablist"></div>' +
      '<div class="ls-eval-card"><div class="ls-eval-head"><span class="ls-eval-title"></span><span class="ls-eval-score"></span></div><div class="ls-eval-bar"><i></i></div><p class="ls-eval-sample"></p><p class="ls-eval-note"></p></div>' +
      '<label class="ls-eval-contam"><input type="checkbox" class="ls-eval-dirty"> <span>' + (DE ? "Benchmark war im Training" : "Benchmark was in training") + '</span></label>' +
      '<p class="ls-eval-caveat">' + (DE ? "Schematische Demo, keine Messung. Ein hoher Score kann aus einem Datenleck kommen." : "Schematic demo, not a measurement. A high score can come from a data leak.") + '</p>' +
      '<div class="ls-tokenize-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-eval-prev">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-tokenize-progress ls-eval-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-eval-next">' + (DE ? "Weiter" : "Next") + ' →</button></div>';
    root.appendChild(el);
    var tabs = el.querySelector(".ls-eval-tabs");
    var title = el.querySelector(".ls-eval-title");
    var scoreEl = el.querySelector(".ls-eval-score");
    var bar = el.querySelector(".ls-eval-bar i");
    var sample = el.querySelector(".ls-eval-sample");
    var note = el.querySelector(".ls-eval-note");
    var dirtyEl = el.querySelector(".ls-eval-dirty");
    var prevBtn = el.querySelector(".ls-eval-prev");
    var nextBtn = el.querySelector(".ls-eval-next");
    var progress = el.querySelector(".ls-eval-progress");
    function render() {
      var t = tasks[step];
      tabs.innerHTML = tasks.map(function (task, i) {
        return '<button type="button" class="ls-chip' + (i === step ? ' is-on' : '') + '" data-eval="' + task.id + '" role="tab" aria-selected="' + (i === step ? 'true' : 'false') + '">' + api.esc(task.label) + '</button>';
      }).join("");
      tabs.querySelectorAll("[data-eval]").forEach(function (b) {
        b.addEventListener("click", function () { setStep(tasks.map(function (x) { return x.id; }).indexOf(b.getAttribute("data-eval"))); });
      });
      var score = dirty ? t.dirty : t.clean;
      title.textContent = t.title;
      scoreEl.textContent = score + "%";
      bar.style.width = score + "%";
      sample.textContent = t.sample;
      note.textContent = t.note;
      dirtyEl.checked = dirty;
      progress.textContent = (step + 1) + " / " + tasks.length;
      prevBtn.disabled = step === 0;
      nextBtn.textContent = step === tasks.length - 1 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
    }
    function setStep(i) { step = Math.max(0, Math.min(tasks.length - 1, i)); render(); }
    function nextInternal() { if (step < tasks.length - 1) { setStep(step + 1); return true; } return false; }
    function prevInternal() { if (step > 0) { setStep(step - 1); return true; } return false; }
    function nextStep() {
      if (nextInternal()) return;
      api.goNext();
    }
    function prevStep() {
      if (prevInternal()) return;
      api.goPrev();
    }
    dirtyEl.addEventListener("change", function () { dirty = dirtyEl.checked; render(); });
    prevBtn.addEventListener("click", prevStep);
    nextBtn.addEventListener("click", nextStep);
    render();
    return {
      update: function (s) { if (s && typeof s.task === "number") setStep(s.task); },
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) {
        return api.util.arrowKey(e, nextInternal, prevInternal);
      },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }

  core.register("eval", evalScene);
})();
