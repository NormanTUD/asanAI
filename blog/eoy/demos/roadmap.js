(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function roadmapScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-roadmap-scene";
    el.innerHTML =
      '<div class="ls-roadmap-card" data-tip="' + (DE ? "Ausblick auf die nächsten Lektionen und ihre Bausteine." : "An outlook on the coming lessons and their building blocks.") + '">' +
        '<span class="ls-roadmap-kicker" data-tip="' + (DE ? "Markiert diesen Block als Vorschau auf kommende Inhalte." : "Marks this block as a preview of upcoming content.") + '">' + (DE ? "Ausblick" : "What comes next") + '</span>' +
        '<b>' + (DE ? "Die nächsten Tage" : "The next days") + '</b>' +
        '<p>' + (DE ? "Die nächsten Tage werden wir diese Bausteine genauer anschauen." : "Over the next days we will look at these building blocks in more detail.") + '</p>' +
        '<span class="ls-roadmap-sub" data-tip="' + (DE ? "Der Kurs baut Schritt für Schritt aufeinander auf." : "The course builds up step by step.") + '">' + (DE ? "Ein Schritt nach dem anderen." : "One step at a time.") + '</span>' +
      '</div>';
    root.appendChild(el);
    return {
      update: function () {},
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }
  core.register("roadmap", roadmapScene);
})();
