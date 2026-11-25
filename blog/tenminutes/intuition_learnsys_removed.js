/*
 * Slides removed from the visible LearnSys deck.
 * This file is not loaded by intuition_learnsys___DONT_USE_ANYMORE.php; it keeps the content
 * recoverable without showing the slides again. Its demo assets live in
 * demos/archive/.
 */
(function () {
  "use strict";
  function archiveSlides(DE, box) {
  var bookSteps = DE ? [
    {
      kicker: "Kompression",
      title: "Verstehen heißt komprimieren",
      body: "Ein Modell, das alles speichert, kann nicht verallgemeinern. Kompression behält die Struktur und wirft Details weg. Es gibt verlustfreie und verlustbehaftete Kompression: Tokenization ist verlustfrei, der Transformer als Ganzes ist verlustbehaftet. Ziehe den Regler: Aus 144 Einzelfällen werden erst 12 Gruppen, dann 4, dann 2, dann 1. Die Taxonomie macht das sichtbar: Hauskatze → Katzenartige → Säugetiere → Wirbeltiere → Bilaterien → Tiere → Eukaryoten → Lebewesen → Etwas. Am Ende sind alle Lebewesen unter Lebewesen subsumiert; erst dann tauchen Gegenstände, die Zahl 7 und Träume auf und fallen mit allem anderen unter Seiendes.",
      watch: "Ziehe die Kompression. Ab wann werden aus Einzelfällen Gruppen, und wann verschwindet der Unterschied zwischen Tier, Pflanze und Gegenstand?",
      demoState: { scene: "compress" },
      context: "Abstraktion ist verlustbehaftete Kompression. Die Namen an den Knoten zeigen, was auf jeder Stufe übrig bleibt: Katzenartige, Menschenaffen und Säugetiere werden zu Wirbeltieren, dann zu Lebewesen. Erst am Ende erscheinen Gegenstände und Träume und werden mit allem zu Seiendes. Gleichzeitig verschwinden die Details, die die einzelnen Fälle unterschieden haben. Im Schnitt ist ein realistisches Weltmodell die beste Kompression: Es erlaubt Vorhersagen über viele Fälle, nicht nur über die Trainingspunkte.",
      deep: "Lindsey et al. (2025) finden Planung im Modell: Vor dem Reimwort sind mehrere Kandidaten aktiv, und der Satz wird auf einen von ihnen hin gebaut. Othello-GPT entwickelt aus Zugfolgen ein inneres Brettmodell. Ein gutes inneres Modell ist die einfachste Art, gut vorherzusagen.",
      boxes: [
        box("book-borges", "Geschichte", "Borges' Funes", "Funes erinnert sich an jeden Stein, jede Wolke, jede Münze. Weil er nichts vergisst, kann er nicht abstrahieren; Borges schreibt, Denken heiße Unterschiede vergessen, verallgemeinern, abstrahieren."),
        box("book-1", "Idee", "Warum komprimieren?", "Ein Modell, das jeden Einzelfall speichert, kann nicht verallgemeinern. Kompression behält die Unterschiede, die für viele Fälle zählen."),
        box("book-2", "Planung", "Plant ein LLM?", "Lindsey et al. (2025) finden Kandidaten für das Reimwort, bevor die Zeile beginnt. Das Modell hält mehrere Möglichkeiten und baut den Satz auf eine zu."),
        box("book-3", "Weltmodell", "Was zeigt Othello-GPT?", "Ein Modell, das nur Zugfolgen sieht, entwickelt eine innere Repräsentation des Bretts. Vorhersage kann ein Weltmodell erzwingen."),
        box("book-lossless", "Grenze", "Verlustfrei oder verlustbehaftet?", "Tokenization ist verlustfrei: Text → Tokens → Text. Der Transformer ist verlustbehaftet: Er behält ein statistisches Modell, nicht den Text selbst."),
        box("book-world", "Training", "Warum ein Weltmodell?", "Training sieht unvollständige und widersprüchliche Daten. Das beste, was ein Modell im Schnitt tun kann, ist ein realistisches Weltmodell, das viele Fälle abdeckt und Vorhersagen erlaubt."),
        box("book-gravity", "Beispiel", "Schwerkraft verstehen", "Ein Neugeborenes merkt: Dinge fallen. Ein Erwachsener komprimiert das zu: Dinge fallen, egal welches Objekt. Eine physikalische Theorie komprimiert weiter: Fallen ist Beschleunigung im gekrümmten Raum. Jede Stufe deckt mehr Fälle mit besseren Vorhersagen ab."),
        box("book-taxonomy", "Beispiel", "Taxonomie als Kompression", "Hauskatze und Löwe werden zu Katzenartige, dann zu Säugetiere, Wirbeltiere, Bilaterien, Tiere, Eukaryoten, Lebewesen. Auf jeder Stufe bleiben weniger Unterschiede übrig, aber die Gruppe deckt mehr Fälle ab. Ganz oben steht Seiendes: Erst dort tauchen auch Gegenstände, die Zahl 7, mathematische Tatsachen, Gedanken und Träume auf."),
        box("book-taxonomy-caveat", "Grenze", "Vereinfachte Gruppen", "Diese Gruppen sind didaktisch, keine strenge Phylogenie. „Pflanzen, Pilze & Archaeen“ fasst sehr verschiedene Lebewesen zusammen; Archaeen sind näher mit Eukaryoten verwandt als mit Bakterien. Die Demo zeigt das Prinzip der Kompression, nicht einen Stammbaum.")
      ],
      sources: [
        { label: "Borges (1942), Funes el memorioso", url: "https://bvpadreseijas.files.wordpress.com/2013/05/funeselmemorioso.pdf", why: { de: "Funes als Bild für Erinnern ohne Abstraktion.", en: "Funes as an image of memory without abstraction." } },
        { label: "Lindsey et al. (2025), On the Biology of a Large Language Model", url: "https://transformer-circuits.pub/2025/attribution-graphs/biology.html", why: { de: "Planung und innere Zwischenschritte im Modell.", en: "Planning and internal intermediate steps in the model." } },
        { label: "Li et al. (2022), Othello-GPT", url: "https://arxiv.org/abs/2210.13382", why: { de: "Ein Weltmodell aus reinen Zugfolgen.", en: "A world model learned from move sequences alone." } }
      ]
    }
  ] : [
    {
      kicker: "Compression",
      title: "Understanding is compression",
      body: "A model that stores everything cannot generalise. Compression keeps structure and throws details away. There is lossless and lossy compression: tokenization is lossless; the transformer as a whole is lossy. Drag the slider: 144 individual cases become 12 groups, then 4, then 2, then 1. Taxonomy makes this visible: house cat → cats → mammals → vertebrates → bilaterians → animals → eukaryotes → living things → something. At the end all living things are subsumed under living things; only then do objects, the number 7, and dreams appear and fall under what exists.",
      watch: "Drag the compression. When do individual cases become groups, and when does the difference between animal, plant, and object disappear?",
      demoState: { scene: "compress" },
      context: "Abstraction is lossy compression. The names on the nodes show what survives at each level: cats, great apes, and mammals become vertebrates, then living things. Only at the end do objects and dreams appear and become, with everything else, what exists. At the same time, the details that separated the individual cases disappear. On average, a realistic world model is the best compression: it allows predictions about many cases, not only the training points.",
      deep: "Lindsey et al. (2025) find planning in the model: before the rhyme word, several candidates are active, and the sentence is built toward one of them. Othello-GPT develops an internal board model from move sequences. A good internal model is the simplest way to predict well.",
      boxes: [
        box("book-borges", "History", "Borges' Funes", "Funes remembers every stone, every cloud, every coin. Because he forgets nothing, he cannot abstract; Borges writes that thinking means forgetting differences, generalising, abstracting."),
        box("book-1", "Idea", "Why compress?", "A model that stores every case cannot generalise. Compression keeps the differences that matter across many cases."),
        box("book-2", "Planning", "Does an LLM plan?", "Lindsey et al. (2025) find candidates for the rhyme word before the line begins. The model holds several possibilities and builds the sentence toward one."),
        box("book-3", "World model", "What does Othello-GPT show?", "A model that sees only move sequences develops an internal representation of the board. Prediction can force a world model."),
        box("book-lossless", "Limit", "Lossless or lossy?", "Tokenization is lossless: text → tokens → text. The transformer is lossy: it keeps a statistical model, not the text itself."),
        box("book-world", "Training", "Why a world model?", "Training sees incomplete and contradictory data. On average, the best a model can do is a realistic world model that covers many cases and allows predictions."),
        box("book-gravity", "Example", "Understanding gravity", "A newborn notices: things fall. An adult compresses this to: things fall, whatever the object. A physical theory compresses further: falling is acceleration in curved space. Each level covers more cases with better predictions."),
        box("book-taxonomy", "Example", "Taxonomy as compression", "House cat and lion become cats, then mammals, vertebrates, bilaterians, animals, eukaryotes, living things. At each level fewer differences survive, but the group covers more cases. At the very top is what exists: only there do objects, the number 7, mathematical facts, thoughts, and dreams appear."),
        box("book-taxonomy-caveat", "Limit", "Simplified groups", "These groups are didactic, not a strict phylogeny. “Plants, fungi & archaea” lumps very different organisms together; archaea are closer to eukaryotes than to bacteria. The demo shows the principle of compression, not a tree of life.")
      ],
      sources: [
        { label: "Borges (1942), Funes el memorioso", url: "https://bvpadreseijas.files.wordpress.com/2013/05/funeselmemorioso.pdf", why: { de: "Funes als Bild für Erinnern ohne Abstraktion.", en: "Funes as an image of memory without abstraction." } },
        { label: "Lindsey et al. (2025), On the Biology of a Large Language Model", url: "https://transformer-circuits.pub/2025/attribution-graphs/biology.html", why: { de: "Planung und innere Zwischenschritte im Modell.", en: "Planning and internal intermediate steps in the model." } },
        { label: "Li et al. (2022), Othello-GPT", url: "https://arxiv.org/abs/2210.13382", why: { de: "Ein Weltmodell aus reinen Zugfolgen.", en: "A world model learned from move sequences alone." } }
      ]
    }
  ];

  var steeringStep = DE ? {
    kicker: "Schluss · Semantik",
    title: "Mit Worten steuern",
    body: "Ein Punkt im Raum, ein Ziel: Königin. Jede Wortrichtung verschiebt den Punkt: Frau, Macht, Rang. Drei Schritte reichen. Dann probierst du nicht, sehr, Geld oder gestern: Der Punkt verlässt die Zielzone. Die Kunst ist, die richtige Richtung zu wählen und im richtigen Moment zu stoppen. So wird aus einem Vektor eine Steuerung, die du mit Worten bedienst.",
    watch: "Klicke Frau, Macht und Rang. Dann teste nicht, sehr, Geld und Übersteuern. Wann wird der Punkt zur Königin, wann wird er Unsinn?",
    demoState: { scene: "steering" },
    context: "Ein Embedding ist ein Punkt. Eine Wortrichtung ist ein Vektor. Die Demo projiziert beides in drei Dimensionen, damit du die Bewegung sehen kannst; ein echtes Modell rechnet mit hunderten Dimensionen.",
    deep: "Word2vec zeigt, dass Richtungen zwischen Wortvektoren regelmäßige Bedeutungsunterschiede tragen (Mikolov et al., 2013). Activation Engineering verschiebt die Aktivierungen eines Modells gezielt in eine Richtung (Turner et al., 2023). Die Demo ist eine didaktische Projektion, kein trainiertes Modell.",
    boxes: [
      box("stg-1", "Mathematik", "Die Richtung", "Ein Wortchip addiert einen Vektor: e_neu = e_alt + α · d_Wort. α steuert die Stärke; ein negatives α dreht die Richtung."),
      box("stg-2", "Steuerung", "Der Sweet Spot", "Zu wenig Bewegung lässt den Punkt im Alten. Zu viel schiebt ihn über das Ziel hinaus. Gute Steuerung wählt Richtung und Distanz."),
      box("stg-3", "Grenze", "Die Projektion", "Die 3D-Karte ist eine didaktische Hilfe. Im echten Modell sind die Achsen gelernte Richtungen, und dieselbe Wortrichtung wirkt je nach Kontext und Schicht anders.")
    ],
    sources: [
      { label: "Mikolov et al. (2013), Linguistic Regularities in Continuous Space Word Representations", url: "https://arxiv.org/abs/1301.3781", why: { de: "Wortvektoren und regelmäßige Bedeutungsrichtungen.", en: "Word vectors and regular directions of meaning." } },
      { label: "Turner et al. (2023), Steering Language Models With Activation Engineering", url: "https://arxiv.org/abs/2308.10248", why: { de: "Gezielte Verschiebung von Aktivierungen.", en: "Deliberate steering of activations." } }
    ]
  } : {
    kicker: "Closing · Semantics",
    title: "Steering with words",
    body: "A point in space, a target: Queen. Each word direction moves the point: Woman, Power, Rank. Three steps are enough. Then try not, very, Money or yesterday: the point leaves the target zone. The skill is choosing the right direction and stopping at the right moment. That is how a vector becomes a control you operate with words.",
    watch: "Click Woman, Power and Rank. Then try not, very, Money and Oversteer. When does the point become Queen, when does it become nonsense?",
    demoState: { scene: "steering" },
    context: "An embedding is a point. A word direction is a vector. The demo projects both into three dimensions so you can see the movement; a real model works with hundreds of dimensions.",
    deep: "Word2vec shows that directions between word vectors carry regular differences in meaning (Mikolov et al., 2013). Activation engineering shifts a model's activations deliberately along a direction (Turner et al., 2023). The demo is a teaching projection, not a trained model.",
    boxes: [
      box("stg-1", "Mathematics", "The direction", "A word chip adds a vector: e_new = e_old + α · d_word. α controls the strength; a negative α flips the direction."),
      box("stg-2", "Steering", "The sweet spot", "Too little movement leaves the point where it was. Too much pushes it past the target. Good steering chooses both direction and distance."),
      box("stg-3", "Limit", "The projection", "The 3D map is a teaching aid. In a real model the axes are learned directions, and the same word direction acts differently by context and layer.")
    ],
    sources: [
      { label: "Mikolov et al. (2013), Linguistic Regularities in Continuous Space Word Representations", url: "https://arxiv.org/abs/1301.3781", why: { de: "Wortvektoren und regelmäßige Bedeutungsrichtungen.", en: "Word vectors and regular directions of meaning." } },
      { label: "Turner et al. (2023), Steering Language Models With Activation Engineering", url: "https://arxiv.org/abs/2308.10248", why: { de: "Gezielte Verschiebung von Aktivierungen.", en: "Deliberate steering of activations." } }
    ]
  };

    return { bookSteps: bookSteps, steeringStep: steeringStep };
  }
  window.__LearnSysRemovedSlides = archiveSlides;
})();
