(function () {
  "use strict";
  window.RagScene = function (root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-rag-scene";
    el.innerHTML = '<div class="ls-rag-query"><span>' + (DE ? "Frage" : "Query") + '</span><b>' + (DE ? "Warum ist der Himmel blau?" : "Why is the sky blue?") + '</b></div>' +
      '<div class="ls-rag-chunks"></div>' +
      '<div class="ls-rag-context" aria-live="polite"></div>' +
      '<div class="ls-rag-answer" aria-live="polite"></div>' +
      '<div class="ls-tokenize-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-rag-prev">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-tokenize-progress ls-rag-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-rag-next">' + (DE ? "Weiter" : "Next") + ' →</button></div>';
    root.appendChild(el);
    var chunks = DE ? [
      { id: "a", text: "Luftmoleküle streuen kurzwelliges blaues Licht stärker als langwelliges rotes.", score: .92 },
      { id: "b", text: "Die Rayleigh-Streuung erklärt die blaue Farbe des Himmels.", score: .88 },
      { id: "c", text: "Sonnenuntergänge sind rot, weil das Licht dann einen längeren Weg durch die Atmosphäre hat.", score: .61 },
      { id: "d", text: "Chlorophyll absorbiert rotes und blaues Licht für die Photosynthese.", score: .12 }
    ] : [
      { id: "a", text: "Air molecules scatter short-wavelength blue light more strongly than long-wavelength red light.", score: .92 },
      { id: "b", text: "Rayleigh scattering explains the blue colour of the sky.", score: .88 },
      { id: "c", text: "Sunsets are red because light travels a longer path through the atmosphere.", score: .61 },
      { id: "d", text: "Chlorophyll absorbs red and blue light for photosynthesis.", score: .12 }
    ];
    var step = 0;
    var selected = {};
    chunks.forEach(function (c) { selected[c.id] = c.score > .7; });
    var chunksEl = el.querySelector(".ls-rag-chunks");
    var contextEl = el.querySelector(".ls-rag-context");
    var answerEl = el.querySelector(".ls-rag-answer");
    var prevBtn = el.querySelector(".ls-rag-prev");
    var nextBtn = el.querySelector(".ls-rag-next");
    var progress = el.querySelector(".ls-rag-progress");
    function render() {
      chunksEl.innerHTML = chunks.map(function (c) {
        var on = selected[c.id];
        return '<button type="button" class="ls-rag-chunk' + (on ? " is-on" : "") + '" data-chunk="' + c.id + '"><span class="ls-rag-score">' + Math.round(c.score * 100) + '%</span><span class="ls-rag-text">' + api.esc(c.text) + '</span><i class="ls-rag-bar" style="width:' + Math.round(c.score * 100) + '%"></i></button>';
      }).join("");
      chunksEl.querySelectorAll("[data-chunk]").forEach(function (b) {
        b.addEventListener("click", function () { selected[b.getAttribute("data-chunk")] = !selected[b.getAttribute("data-chunk")]; render(); });
      });
      var picked = chunks.filter(function (c) { return selected[c.id]; });
      contextEl.innerHTML = step >= 2 ? '<div class="ls-rag-context-head">' + (DE ? "Eingefügter Kontext" : "Inserted context") + '</div>' + picked.map(function (c, i) { return '<p><b>[' + (i + 1) + ']</b> ' + api.esc(c.text) + '</p>'; }).join("") : '<div class="ls-rag-context-head">' + (DE ? "Noch nichts eingefügt" : "Nothing inserted yet") + '</div><p>' + (DE ? "Die Suche findet Chunks; erst danach landen sie im Kontext." : "Retrieval finds chunks; only then do they enter the context.") + '</p>';
      answerEl.innerHTML = step >= 3 ? '<div class="ls-rag-answer-head">' + (DE ? "Antwort mit Quellen" : "Answer with sources") + '</div><p>' + (DE ? "Der Himmel ist blau, weil Luftmoleküle kurzwelliges blaues Licht stärker streuen als rotes. [1] Die Rayleigh-Streuung beschreibt diesen Effekt. [2]" : "The sky is blue because air molecules scatter short-wavelength blue light more strongly than red. [1] Rayleigh scattering describes this effect. [2]") + '</p><div class="ls-rag-agent">' + (DE ? "Agent: suchen → lesen → einsetzen → antworten" : "Agent: search → read → insert → answer") + '</div>' : "";
      progress.textContent = (step + 1) + " / 4";
      prevBtn.disabled = step === 0;
      nextBtn.textContent = step === 3 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
    }
    function setStep(i) { step = Math.max(0, Math.min(3, i)); render(); }
    function nextInternal() { if (step < 3) { setStep(step + 1); return true; } return false; }
    function prevInternal() { if (step > 0) { setStep(step - 1); return true; } return false; }
    function nextStep() { if (nextInternal()) return; api.goNext(); }
    function prevStep() { if (prevInternal()) return; api.goPrev(); }
    prevBtn.addEventListener("click", prevStep);
    nextBtn.addEventListener("click", nextStep);
    render();
    return {
      update: function (s) { if (s && typeof s.step === "number") setStep(s.step); },
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) {
        if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return false;
        if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") return nextInternal();
        if (e.key === "ArrowLeft" || e.key === "PageUp") return prevInternal();
        return false;
      },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  };
})();
