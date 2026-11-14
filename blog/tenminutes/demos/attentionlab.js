(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function attentionScene(root, api) { var f = core.get("attention"); return f ? f(root, api) : null; }
  function codeNoiseScene(root, api) { var f = core.get("codenoise"); return f ? f(root, api) : null; }
  function attentionLabScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-attlab-scene";
    el.innerHTML = '<div class="ls-attlab-tabs" role="tablist">' +
        '<button type="button" class="ls-chip is-on" data-attlab="bank" role="tab" aria-selected="true">' + (DE ? "Bank" : "Bank") + '</button>' +
        '<button type="button" class="ls-chip" data-attlab="code" role="tab" aria-selected="false">' + (DE ? "Code" : "Code") + '</button>' +
      '</div>' +
      '<div class="ls-attlab-layer" data-attlab-layer="bank"></div>' +
      '<div class="ls-attlab-layer" data-attlab-layer="code" hidden></div>';
    root.appendChild(el);
    var bankLayer = el.querySelector('[data-attlab-layer="bank"]');
    var codeLayer = el.querySelector('[data-attlab-layer="code"]');
    var tabs = Array.prototype.slice.call(el.querySelectorAll("[data-attlab]"));
    var bankApi = attentionScene(bankLayer, api);
    var codeApi = codeNoiseScene(codeLayer, api);
    var mode = "bank";
    function show(next) {
      mode = next === "code" ? "code" : "bank";
      bankLayer.hidden = mode !== "bank";
      codeLayer.hidden = mode !== "code";
      if (mode === "bank") bankApi.resize(); else codeApi.resize();
      tabs.forEach(function (b) {
        var on = b.getAttribute("data-attlab") === mode;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
    tabs.forEach(function (b) {
      b.addEventListener("click", function () { show(b.getAttribute("data-attlab")); });
    });
    return {
      update: function (s) {
        if (s && s.mode && s.mode !== mode) show(s.mode);
        if (s && s.context) bankApi.update({ context: s.context });
        if (s && s.codeMode) codeApi.setMode(s.codeMode);
      },
      setControl: function (name, value) { return bankApi.setControl ? bankApi.setControl(name, value) : false; },
      resize: function () { bankApi.resize(); codeApi.resize(); },
      pause: function () {},
      resume: function () { show(mode); },
      next: function () { return false; },
      prev: function () { return false; },
      destroy: function () { bankApi.destroy(); codeApi.destroy(); el.remove(); }
    };
  }

  core.register("attentionlab", attentionLabScene);
})();
