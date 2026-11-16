(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function consciousnessScene(root, api) {
    var DE = api.lang === "de";
    var esc = api.esc;
    var el = document.createElement("div");
    el.className = "ls-con-notes";
    var cards = DE ? [
      { tone: "easy", tag: "Leichtes Problem", body: "Zugang, Bericht und Kontrolle lassen sich funktional erklären. Es ist schwer, aber wir haben Ideen, wie man es angehen kann.", items: ["Global Workspace", "IIT / Phi", "Predictive Processing"] },
      { tone: "hard", tag: "Schweres Problem", body: "Warum fühlt sich etwas von innen an? Für Qualia gibt es nicht einmal die Richtung eines Hauchs einer Antwort.", items: ["Chalmers' hard problem", "Nagel: what it is like"] },
      { tone: "theory", tag: "Theorien", body: "Sie beschreiben, was Bewusstsein funktional leisten müsste, sind sich aber uneinig, was als Beweis zählt.", items: ["Global Workspace", "Tononi: IIT", "Predictive Processing"] },
      { tone: "myst", tag: "New Mysterianism", body: "Vielleicht ist Bewusstsein eine kognitive Grenze: Ratten lernen einfache Gleichungen fürs Labyrinth, aber nicht dieses Problem.", items: ["Qualia als Grenze", "mehr in philosophy.php"] }
    ] : [
      { tone: "easy", tag: "The easy problem", body: "Access, report, and control can be explained functionally. It is hard, but we have ideas for how to approach it.", items: ["Global workspace", "IIT / Phi", "Predictive processing"] },
      { tone: "hard", tag: "The hard problem", body: "Why does anything feel like something from the inside? For qualia there is not even the direction of a breath of an answer.", items: ["Chalmers's hard problem", "Nagel: what it is like"] },
      { tone: "theory", tag: "Theories", body: "They describe what consciousness would have to do functionally, but disagree about what counts as evidence.", items: ["Global workspace", "Tononi: IIT", "Predictive processing"] },
      { tone: "myst", tag: "New mysterianism", body: "Consciousness may be a cognitive limit: rats learn simple equations for a maze, but not this problem.", items: ["Qualia as a limit", "more in philosophy.php"] }
    ];
    el.innerHTML =
      '<div class="ls-con-head"><span>' + (DE ? "Bewusstsein" : "Consciousness") + '</span><b>' + (DE ? "Kurz gemerkt" : "In short") + '</b><p class="ls-con-sub">' + (DE ? "Auch du hast nur Zugang zu deinem eigenen Erleben." : "You too have access only to your own experience.") + '</p></div>' +
      '<div class="ls-con-grid">' + cards.map(function (c) {
        return '<article class="ls-con-card ls-con-card--' + c.tone + '">' +
          '<span class="ls-con-tag">' + esc(c.tag) + '</span>' +
          '<p>' + esc(c.body) + '</p>' +
          '<ul>' + c.items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") + '</ul>' +
        '</article>';
      }).join("") + '</div>' +
      '<a class="ls-con-link" href="../philosophy.php">' + (DE ? "Mehr in philosophy.php →" : "More in philosophy.php →") + '</a>';
    root.appendChild(el);
    return {
      update: function () {},
      resize: function () {},
      destroy: function () { if (el.parentNode) el.parentNode.removeChild(el); }
    };
  }
  core.register("consciousness", consciousnessScene);
})();
