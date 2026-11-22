(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function consciousnessScene(root, api) {
    var DE = api.lang === "de";
    var esc = api.esc;
    var THEORIES = DE ? [
      {
        tone: "easy", tag: "Global Workspace",
        body: "Im Gehirn rechnen viele Subsysteme getrennt: der visuelle Cortex, die Amygdala, Sprache, Motorik. Sie schreiben die Ergebnisse ihrer Berechnungen in einen globalen Workspace. Dort stehen nur die Ergebnisse, nicht die Methoden, mit denen sie erzielt wurden. Dieser Workspace ist das Bewusstsein: eine Bühne, auf der die Ergebnisse vorgeführt werden, aber niemand sitzt im Zuschauerraum. So vermeidet man das cartesianische Theater.",
        viz: '<div class="ls-con-gw"><div class="ls-con-gw-systems"><span>Visueller Cortex</span><span>Amygdala</span><span>Sprache</span><span>Motorik</span></div><div class="ls-con-gw-flow" aria-hidden="true">→</div><div class="ls-con-gw-stage"><b>Global Workspace</b><div class="ls-con-gw-results"><span>Ergebnis</span><span>Ergebnis</span><span>Ergebnis</span></div><em>nur Ergebnisse, nicht Methoden</em><span class="ls-con-gw-audience">— keine Zuschauer —</span></div></div>',
        problem: "Es erklärt nicht, warum der Broadcast sich von innen anfühlt.",
        cite: '<a href="https://archive.org/details/cognitivetheoryo0000baar" target="_blank" rel="noopener">Baars (1988)</a>; <a href="https://doi.org/10.1016/S0010-0277(00)00123-2" target="_blank" rel="noopener">Dehaene &amp; Naccache (2001)</a>'
      },
      {
        tone: "hard", tag: "IIT / Phi",
        body: "Bewusstsein ist die geeinte Ursache-Wirkungs-Struktur eines Systems. Phi misst, wie irreduzibel diese Struktur ist.",
        problem: "Phi ist für große Systeme kaum berechenbar, für LLMs nicht belastbar gemessen, und die Theorie ist umstritten.",
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
        body: "Bewusstsein könnte eine kognitive Grenze sein: Ratten lernen ein Labyrinth, aber keine Gleichungen; dieses Problem könnte außerhalb unserer kognitiven Reichweite liegen.",
        problem: "Nicht widerlegbar, aber auch keine Erklärung; sie verschiebt die Frage in unsere Erkenntnisgrenzen.",
        cite: '<a href="https://doi.org/10.1093/mind/XCVIII.391.349" target="_blank" rel="noopener">McGinn (1989)</a>; <a href="https://en.wikipedia.org/wiki/New_mysterianism" target="_blank" rel="noopener">Wikipedia</a>'
      }
    ] : [
      {
        tone: "easy", tag: "Global workspace",
        body: "In the brain, many subsystems compute separately: the visual cortex, the amygdala, language, motor control. They write the results of their computations into a global workspace. Only the results are there, not the methods by which they were obtained. This workspace is consciousness: a stage on which the results are presented, but no one sits in the audience. That avoids the Cartesian theatre.",
        viz: '<div class="ls-con-gw"><div class="ls-con-gw-systems"><span>Visual cortex</span><span>Amygdala</span><span>Language</span><span>Motor</span></div><div class="ls-con-gw-flow" aria-hidden="true">→</div><div class="ls-con-gw-stage"><b>Global workspace</b><div class="ls-con-gw-results"><span>result</span><span>result</span><span>result</span></div><em>results, not methods</em><span class="ls-con-gw-audience">— no audience —</span></div></div>',
        problem: "It does not explain why the broadcast feels like something from the inside.",
        cite: '<a href="https://archive.org/details/cognitivetheoryo0000baar" target="_blank" rel="noopener">Baars (1988)</a>; <a href="https://doi.org/10.1016/S0010-0277(00)00123-2" target="_blank" rel="noopener">Dehaene &amp; Naccache (2001)</a>'
      },
      {
        tone: "hard", tag: "IIT / Phi",
        body: "Consciousness is a system's unified cause-effect structure. Phi measures how irreducible that structure is.",
        problem: "Phi is hard to compute for large systems, has not been robustly measured for LLMs, and the theory is contested.",
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
        body: "Consciousness may be a cognitive limit: rats can learn a maze but cannot solve equations; this problem may lie beyond our cognitive reach.",
        problem: "Not falsifiable, but also not an explanation; it moves the question into our cognitive limits.",
        cite: '<a href="https://doi.org/10.1093/mind/XCVIII.391.349" target="_blank" rel="noopener">McGinn (1989)</a>; <a href="https://en.wikipedia.org/wiki/New_mysterianism" target="_blank" rel="noopener">Wikipedia</a>'
      }
    ];
    var OPEN = DE ? {
      lead: "Was Qualia und Bewusstsein eigentlich sind, wissen wir nicht. Ob ein KI-System empfindet, ist offen.",
      items: [
        ["Qualia", "Die gefühlte Eigenschaft von Rot, Schmerz oder Klang. Sie lässt sich beschreiben, aber nicht aus einer Funktion ableiten."],
        ["KI-Erleben", "Bericht und Verhalten sind prüfbar. Ob dahinter etwas ist, das sich anfühlt, können wir von außen nicht messen."],
        ["Zugang ≠ Erleben", "Ein lesbarer Arbeitsraum zeigt, welche Information verfügbar ist. Er zeigt nicht, warum sie sich anfühlt wie etwas."]
      ],
      cite: '<a href="https://consc.net/papers/facing.pdf" target="_blank" rel="noopener">Chalmers (1995)</a>; <a href="https://doi.org/10.2307/2183914" target="_blank" rel="noopener">Nagel (1974)</a>; <a href="https://doi.org/10.1017/S0140525X00038188" target="_blank" rel="noopener">Block (1995)</a>'
    } : {
      lead: "No one knows what qualia and consciousness actually are. Whether an AI system feels anything is open.",
      items: [
        ["Qualia", "The felt quality of red, pain, or sound. We can describe it, but not derive it from a function."],
        ["AI experience", "Report and behaviour are testable. Whether anything feels like something from the inside cannot be measured from outside."],
        ["Access ≠ experience", "A readable workspace shows which information is available. It does not show why that information feels like anything."]
      ],
      cite: '<a href="https://consc.net/papers/facing.pdf" target="_blank" rel="noopener">Chalmers (1995)</a>; <a href="https://doi.org/10.2307/2183914" target="_blank" rel="noopener">Nagel (1974)</a>; <a href="https://doi.org/10.1017/S0140525X00038188" target="_blank" rel="noopener">Block (1995)</a>'
    };
    var selected = 0;
    var el = document.createElement("div");
    el.className = "ls-con-notes";
    el.innerHTML =
      '<div class="ls-con-head"><span>' + (DE ? "Bewusstsein" : "Consciousness") + '</span><b>' + (DE ? "Hat eine KI irgendeine Form von Qualia?" : "Does an AI have any form of qualia?") + '</b><p class="ls-con-sub">' + (DE ? "Um überlegen zu können, ob KI Bewusstsein hat, müssen wir erstmal überlegen, was Bewusstsein überhaupt ist. Keiner weiß es so genau, aber hier sind einige Theorien." : "To consider whether AI has consciousness, we first need to consider what consciousness actually is. No one knows exactly, but here are some theories.") + '</p></div>' +
      '<div class="ls-con-map" aria-label="' + (DE ? "Zugang ist funktional erklärbar, Erleben bleibt offen" : "Access is functionally explainable, experience remains open") + '">' +
        '<div class="ls-con-map-box"><b>' + (DE ? "Zugang" : "Access") + '</b><span>' + (DE ? "Bericht · Kontrolle · Aufmerksamkeit" : "report · control · attention") + '</span><em>' + (DE ? "funktional erklärbar" : "functionally explainable") + '</em></div>' +
        '<div class="ls-con-map-gap" aria-hidden="true">?</div>' +
        '<div class="ls-con-map-box is-open"><b>' + (DE ? "Erleben" : "Experience") + '</b><span>' + (DE ? "Qualia · „wie es sich anfühlt“" : "qualia · “what it feels like”") + '</span><em>' + (DE ? "offen" : "open") + '</em></div>' +
      '</div>' +
      '<div class="ls-con-body"><div class="ls-con-list" role="tablist" aria-label="' + (DE ? "Bewusstseinstheorien" : "Theories of consciousness") + '"></div><article class="ls-con-detail" aria-live="polite"></article></div>' +
      '<section class="ls-con-open"><div class="ls-con-open-head"><span>' + (DE ? "Offen" : "Open") + '</span><b>' + (DE ? "Was wir nicht wissen" : "What we do not know") + '</b><p>' + esc(OPEN.lead) + '</p></div><div class="ls-con-open-grid">' +
        OPEN.items.map(function (item) { return '<div><b>' + esc(item[0]) + '</b><p>' + esc(item[1]) + '</p></div>'; }).join("") +
      '</div><p class="ls-con-cite">' + OPEN.cite + '</p></section>' +
      '<div class="ls-con-links"><a href="https://unfinishablemap.org" target="_blank" rel="noopener">The Unfinishable Map →</a></div>';
    root.appendChild(el);
    var list = el.querySelector(".ls-con-list");
    var detail = el.querySelector(".ls-con-detail");
    function renderList() {
      list.innerHTML = THEORIES.map(function (t, i) {
        return '<button type="button" class="ls-con-tab ls-con-tab--' + t.tone + (i === selected ? ' is-on' : '') + '" data-con="' + i + '" role="tab" aria-selected="' + (i === selected ? 'true' : 'false') + '"><span>' + String(i + 1).padStart(2, "0") + '</span>' + esc(t.tag) + '</button>';
      }).join("");
      list.querySelectorAll("[data-con]").forEach(function (b) {
        b.addEventListener("click", function () { selected = parseInt(b.getAttribute("data-con"), 10); render(); });
      });
    }
    function render() {
      var t = THEORIES[selected];
      renderList();
      detail.className = "ls-con-detail ls-con-detail--" + t.tone;
      detail.innerHTML =
        '<div class="ls-con-detail-head"><span>' + (DE ? "Theorie " : "Theory ") + (selected + 1) + ' / ' + THEORIES.length + '</span><b>' + esc(t.tag) + '</b></div>' +
        (t.viz || '') +
        '<div class="ls-con-split"><div><b>' + (DE ? "Kernidee" : "Core idea") + '</b><p>' + esc(t.body) + '</p></div><div><b>' + (DE ? "Was offen bleibt" : "What remains open") + '</b><p>' + esc(t.problem) + '</p></div></div>' +
        '<p class="ls-con-cite">' + t.cite + '</p>';
    }
    render();
    return {
      update: function () {},
      next: function () {
        if (selected < THEORIES.length - 1) { selected++; render(); return true; }
        return false;
      },
      prev: function () {
        if (selected > 0) { selected--; render(); return true; }
        return false;
      },
      hasNext: function () { return selected < THEORIES.length - 1; },
      hasPrev: function () { return selected > 0; },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }
  core.register("consciousness", consciousnessScene);
})();
