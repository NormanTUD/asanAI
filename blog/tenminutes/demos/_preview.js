(function () {
  "use strict";
  if (!window.LearnSys || !window.LearnSysDemoCore) return;

  var scene = window.LS_PREVIEW_SCENE || "embedding";
  var DE = window.LS_PREVIEW_LANG === "de";
  var host = document.getElementById("learnsys");
  if (!host) return;

  LearnSys.defineDemo("preview", function (root, api) {
    var factory = window.LearnSysDemoCore.get(scene);
    if (!factory) {
      var empty = document.createElement("div");
      empty.className = "ls-empty";
      empty.textContent = (DE ? "Demo nicht gefunden: " : "Demo not found: ") + scene;
      root.appendChild(empty);
      return { update: function () {}, resize: function () {}, destroy: function () {} };
    }
    return factory(root, api);
  }, { tier: 1, label: scene, staticLayer: false });

  var day = {
    id: "preview", track: "preview", label: scene,
    kicker: DE ? "Demo" : "Demo",
    title: scene, demo: "preview",
    steps: [{
      id: "preview-step", kicker: DE ? "Demo" : "Demo",
      title: scene, body: "", watch: "",
      demoState: { scene: scene }, boxes: [], sources: []
    }],
    boxes: [], sources: []
  };

  LearnSys.mount(host, {
    lang: DE ? "de" : "en",
    days: [day],
    tracks: [{ id: "preview", label: DE ? "Demo" : "Demo", days: "Demo" }],
    mix: true,
    singleDay: true,
    startDay: 0,
    typeset: function (scope) {
      if (window.TM && typeof TM.typesetMath === "function") TM.typesetMath(scope);
    }
  });
})();
