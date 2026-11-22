(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function phoneScene(root, api) { var f = core.get("phone"); return f ? f(root, api) : null; }
  function codeScene(root, api) { var f = core.get("code"); return f ? f(root, api) : null; }
  function mediaScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-media-scene";
    el.innerHTML = '<div class="ls-media-tabs" role="tablist">' +
        '<button type="button" class="ls-chip is-on" data-media="search" role="tab" aria-selected="true">' + (DE ? "Suche" : "Search") + '</button>' +
        '<button type="button" class="ls-chip" data-media="chat" role="tab" aria-selected="false">' + (DE ? "Chat" : "Chat") + '</button>' +
        '<button type="button" class="ls-chip" data-media="code" role="tab" aria-selected="false">Code</button>' +
      '</div>' +
      '<div class="ls-media-stage"><div class="ls-media-layer" data-layer="phone"></div><div class="ls-media-layer" data-layer="code" hidden></div></div>' +
      '<div class="ls-tokenize-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-media-prev">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-tokenize-progress ls-media-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-media-next">' + (DE ? "Weiter" : "Next") + ' →</button></div>';
    root.appendChild(el);
    var phoneLayer = el.querySelector('[data-layer="phone"]');
    var codeLayer = el.querySelector('[data-layer="code"]');
    var phoneApi = phoneScene(phoneLayer, api);
    var codeApi = codeScene(codeLayer, api);
    phoneApi.update({ view: "search" });
    var tabs = el.querySelectorAll("[data-media]");
    var prevBtn = el.querySelector(".ls-media-prev");
    var nextBtn = el.querySelector(".ls-media-next");
    var progress = el.querySelector(".ls-media-progress");
    var step = 0;
    var currentMode = null;
    codeApi.pause();
    function show(mode) {
      var modeName = mode === "chat" ? "chat" : (mode === "code" ? "code" : "search");
      if (modeName === currentMode) return;
      currentMode = modeName;
      var isPhone = modeName !== "code";
      step = modeName === "search" ? 0 : (modeName === "chat" ? 1 : 2);
      phoneLayer.hidden = !isPhone;
      codeLayer.hidden = isPhone;
      tabs.forEach(function (b) {
        var on = b.getAttribute("data-media") === modeName;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      if (isPhone) {
        codeApi.pause();
        if (modeName === "chat") phoneApi.launchChat();
        else {
          phoneApi.update({ view: "search" });
          phoneApi.start();
        }
      } else {
        phoneApi.pause();
        codeApi.resize();
        codeApi.start();
      }
      progress.textContent = modeName === "search" ? (DE ? "Suche" : "Search") : (modeName === "chat" ? (DE ? "Chat" : "Chat") : "Code");
      prevBtn.disabled = step === 0;
      nextBtn.textContent = step === 2 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
    }
    function nextInternal() {
      if (step < 2) { show(step === 0 ? "chat" : "code"); return true; }
      return false;
    }
    function prevInternal() {
      if (step > 0) { show(step === 2 ? "chat" : "search"); return true; }
      return false;
    }
    function nextStep() {
      if (step === 2 && codeApi && codeApi.busy && codeApi.busy()) { codeApi.finish(); return; }
      if (nextInternal()) return;
      api.goNext();
    }
    function prevStep() {
      if (prevInternal()) return;
      api.goPrev();
    }
    phoneApi.onAdvance(nextStep);
    tabs.forEach(function (b) {
      b.addEventListener("click", function () { show(b.getAttribute("data-media")); });
    });
    prevBtn.addEventListener("click", prevStep);
    nextBtn.addEventListener("click", nextStep);
    show("phone");
    return {
      update: function (s) {
        if (s && s.mode) show(s.mode);
        else if (s && typeof s.step === "number") show(s.step === 0 ? "search" : (s.step === 1 ? "chat" : "code"));
      },
      next: nextInternal,
      prev: prevInternal,
      hasNext: function () { return step < 2; },
      hasPrev: function () { return step > 0; },
      busy: function () {
        if (step !== 2) return false;
        if (codeApi && codeApi.busy && codeApi.busy()) return true;
        var toks = el.querySelectorAll('.ls-code-token');
        return toks.length > 0 && !Array.prototype.every.call(toks, function (t) { return t.classList.contains('is-visible'); });
      },
      finish: function () { if (step === 2 && codeApi && codeApi.finish) codeApi.finish(); },
      onKey: function (e) {
        return api.util.arrowKey(e, nextInternal, prevInternal);
      },
      pause: function () { if (step === 2) codeApi.pause(); },
      resume: function () { if (step === 2) codeApi.resume(); else phoneApi.resize(); },
      resize: function () { phoneApi.resize(); codeApi.resize(); },
      destroy: function () { phoneApi.destroy(); codeApi.destroy(); el.remove(); }
    };
  }

  core.register("media", mediaScene);
})();
