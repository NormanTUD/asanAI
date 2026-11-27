(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function consciousnessIntro(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-con-intro";
    el.innerHTML =
      '<figure class="ls-con-intro-fig">' +
        '<a class="ls-con-intro-img" href="https://commons.wikimedia.org/wiki/File:RobertFuddBewusstsein17Jh.png" target="_blank" rel="noopener">' +
          '<img src="fludd_consciousness.png" alt="' + (DE ? "Robert Fludds Darstellung des Bewusstseins aus dem 17. Jahrhundert" : "Robert Fludd’s 17th-century representation of consciousness") + '">' +
        '</a>' +
        '<figcaption>' +
          '<span class="ls-con-intro-kicker">' + (DE ? "Bild · 17. Jahrhundert" : "Image · 17th century") + '</span>' +
          '<b>' + (DE ? "Robert Fludd: Bewusstsein als Weltbild" : "Robert Fludd: consciousness as a worldview") + '</b>' +
          '<p>' + (DE ? "Der englische Paracelsianer Robert Fludd ordnet den Menschen in einen Kosmos aus Sinnen, Himmel und Erde ein. Das Bild zeigt den Versuch, das Ich in der Welt zu verorten, nicht eine Antwort auf die Frage, warum ich ich bin." : "The English Paracelsian Robert Fludd places the human within a cosmos of senses, heaven, and earth. The image shows an attempt to locate the self in the world, not an answer to why I am me.") + '</p>' +
          '<span class="ls-con-intro-credit">' + (DE ? "Public Domain. Quelle: " : "Public domain. Source: ") + '<a href="https://commons.wikimedia.org/wiki/File:RobertFuddBewusstsein17Jh.png" target="_blank" rel="noopener">Wikimedia Commons</a></span>' +
        '</figcaption>' +
      '</figure>';
    root.appendChild(el);
    return {
      update: function () {},
      next: function () { return false; },
      prev: function () { return false; },
      hasNext: function () { return false; },
      hasPrev: function () { return false; },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }
  core.register("consciousnessintro", consciousnessIntro);
})();
