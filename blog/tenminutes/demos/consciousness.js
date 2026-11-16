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
      {
        tone: "easy", tag: "Global Workspace",
        body: "Ein Zustand wird bewusst, wenn er an viele Prozesse gesendet wird: Broadcast statt lokaler Verarbeitung. Das erklärt Zugang, Integration und Bericht.",
        problem: "Es erklärt nicht, warum der Broadcast sich von innen anfühlt.",
        cite: '<a href="https://archive.org/details/cognitivetheoryo0000baar" target="_blank" rel="noopener">Baars (1988)</a>; <a href="https://doi.org/10.1016/S0010-0277(00)00123-2" target="_blank" rel="noopener">Dehaene &amp; Naccache (2001)</a>'
      },
      {
        tone: "hard", tag: "IIT / Phi",
        body: "Bewusstsein ist die geeinte Ursache-Wirkungs-Struktur eines Systems. Phi misst, wie irreduzibel diese Struktur ist.",
        problem: "Phi ist für große Systeme kaum berechenbar, für LLMs nicht gemessen, und die Theorie ist umstritten.",
        cite: '<a href="https://doi.org/10.1186/1471-2202-5-42" target="_blank" rel="noopener">Tononi (2004)</a>; <a href="https://doi.org/10.1038/nrn.2016.44" target="_blank" rel="noopener">Tononi et al. (2016)</a>'
      },
      {
        tone: "theory", tag: "Predictive Processing",
        body: "Das Gehirn sagt Sinnesdaten voraus und minimiert Überraschung oder Free Energy; Wahrnehmung ist kontrollierte Halluzination.",
        problem: "Es erklärt Funktion und Selbstmodell, aber nicht, warum Vorhersage sich anfühlt.",
        cite: '<a href="https://doi.org/10.1017/S0140525X12000477" target="_blank" rel="noopener">Clark (2013)</a>; <a href="https://doi.org/10.1038/nrn2787" target="_blank" rel="noopener">Friston (2010)</a>'
      },
      {
        tone: "kastrup", tag: "Kastrup: Analytic Idealism",
        body: "Nicht Materie erzeugt Bewusstsein, sondern Bewusstsein ist fundamental. Materie ist die Außenseite mentaler Prozesse; individuelle Geister sind dissoziierte Teile eines universalen Bewusstseins.",
        problem: "Metaphysisch und schwer falsifizierbar; erklärt konkrete neuronale Mechanismen weniger direkt.",
        cite: '<a href="https://www.bernardokastrup.com/p/papers.html" target="_blank" rel="noopener">Kastrup (2018/2019)</a>'
      },
      {
        tone: "myst", tag: "New Mysterianism",
        body: "Bewusstsein könnte eine kognitive Grenze sein: Ratten lernen einfache Gleichungen fürs Labyrinth, aber nicht dieses Problem.",
        problem: "Nicht widerlegbar, aber auch keine Erklärung; sie verschiebt die Frage in unsere Erkenntnisgrenzen.",
        cite: '<a href="https://doi.org/10.1093/mind/XCVIII.391.349" target="_blank" rel="noopener">McGinn (1989)</a>; <a href="https://en.wikipedia.org/wiki/New_mysterianism" target="_blank" rel="noopener">Wikipedia</a>'
      },
      {
        tone: "open", wide: true, tag: "Was wir nicht wissen",
        body: "Was Qualia und Bewusstsein eigentlich sind, wissen wir nicht. Ob ein KI-System empfindet, ist offen. Verhalten, Bericht und ein lesbarer Arbeitsraum sind Zugang, kein Beweis von Erleben.",
        problem: "",
        cite: '<a href="https://consc.net/papers/facing.pdf" target="_blank" rel="noopener">Chalmers (1995)</a>; <a href="https://doi.org/10.2307/2183914" target="_blank" rel="noopener">Nagel (1974)</a>; <a href="https://doi.org/10.1017/S0140525X00038188" target="_blank" rel="noopener">Block (1995)</a>'
      }
    ] : [
      {
        tone: "easy", tag: "Global workspace",
        body: "A state becomes conscious when it is broadcast to many processes: broadcast instead of local processing. That explains access, integration, and report.",
        problem: "It does not explain why the broadcast feels like something from the inside.",
        cite: '<a href="https://archive.org/details/cognitivetheoryo0000baar" target="_blank" rel="noopener">Baars (1988)</a>; <a href="https://doi.org/10.1016/S0010-0277(00)00123-2" target="_blank" rel="noopener">Dehaene &amp; Naccache (2001)</a>'
      },
      {
        tone: "hard", tag: "IIT / Phi",
        body: "Consciousness is a system's unified cause-effect structure. Phi measures how irreducible that structure is.",
        problem: "Phi is hard to compute for large systems, has not been measured for LLMs, and the theory is contested.",
        cite: '<a href="https://doi.org/10.1186/1471-2202-5-42" target="_blank" rel="noopener">Tononi (2004)</a>; <a href="https://doi.org/10.1038/nrn.2016.44" target="_blank" rel="noopener">Tononi et al. (2016)</a>'
      },
      {
        tone: "theory", tag: "Predictive processing",
        body: "The brain predicts sensory input and minimises surprise or free energy; perception is controlled hallucination.",
        problem: "It explains function and self-models, but not why prediction feels like anything.",
        cite: '<a href="https://doi.org/10.1017/S0140525X12000477" target="_blank" rel="noopener">Clark (2013)</a>; <a href="https://doi.org/10.1038/nrn2787" target="_blank" rel="noopener">Friston (2010)</a>'
      },
      {
        tone: "kastrup", tag: "Kastrup: Analytic idealism",
        body: "Matter does not produce consciousness; consciousness is fundamental. Matter is the outside view of mental processes; individual minds are dissociated parts of a universal consciousness.",
        problem: "Metaphysical and hard to falsify; it explains concrete neural mechanisms less directly.",
        cite: '<a href="https://www.bernardokastrup.com/p/papers.html" target="_blank" rel="noopener">Kastrup (2018/2019)</a>'
      },
      {
        tone: "myst", tag: "New mysterianism",
        body: "Consciousness may be a cognitive limit: rats learn simple equations for a maze, but not this problem.",
        problem: "Not falsifiable, but also not an explanation; it moves the question into our cognitive limits.",
        cite: '<a href="https://doi.org/10.1093/mind/XCVIII.391.349" target="_blank" rel="noopener">McGinn (1989)</a>; <a href="https://en.wikipedia.org/wiki/New_mysterianism" target="_blank" rel="noopener">Wikipedia</a>'
      },
      {
        tone: "open", wide: true, tag: "What we do not know",
        body: "No one knows what qualia and consciousness actually are. Whether an AI system feels anything is open. Behaviour, report, and a readable workspace are access, not proof of experience.",
        problem: "",
        cite: '<a href="https://consc.net/papers/facing.pdf" target="_blank" rel="noopener">Chalmers (1995)</a>; <a href="https://doi.org/10.2307/2183914" target="_blank" rel="noopener">Nagel (1974)</a>; <a href="https://doi.org/10.1017/S0140525X00038188" target="_blank" rel="noopener">Block (1995)</a>'
      }
    ];
    el.innerHTML =
      '<div class="ls-con-head"><span>' + (DE ? "Bewusstsein" : "Consciousness") + '</span><b>' + (DE ? "Kurz gemerkt" : "In short") + '</b><p class="ls-con-sub">' + (DE ? "Auch du hast nur Zugang zu deinem eigenen Erleben." : "You too have access only to your own experience.") + '</p></div>' +
      '<div class="ls-con-grid">' + cards.map(function (c) {
        return '<article class="ls-con-card ls-con-card--' + c.tone + (c.wide ? ' ls-con-card--wide' : '') + '">' +
          '<span class="ls-con-tag">' + esc(c.tag) + '</span>' +
          '<p>' + esc(c.body) + '</p>' +
          (c.problem ? '<p class="ls-con-problem"><b>' + (DE ? "Problem:" : "Problem:") + '</b> ' + esc(c.problem) + '</p>' : '') +
          '<p class="ls-con-cite">' + c.cite + '</p>' +
        '</article>';
      }).join("") + '</div>' +
      '<div class="ls-con-links"><a href="https://unfinishablemap.org" target="_blank" rel="noopener">The Unfinishable Map →</a></div>';
    root.appendChild(el);
    return {
      update: function () {},
      resize: function () {},
      destroy: function () { if (el.parentNode) el.parentNode.removeChild(el); }
    };
  }
  core.register("consciousness", consciousnessScene);
})();
