(function () {
  "use strict";
  var DE = window.TM && typeof TM.lang === "function" && TM.lang() === "de";
  function box(id, lens, title, body, tex, control, controlLabel) {
    return { id: id, lens: lens, title: title, body: body, tex: tex || "", control: control || "", controlLabel: controlLabel || "" };
  }
  var sources = [
    { label: "Harris (1954), Distributional Structure", url: "https://www.its.caltech.edu/~matilde/ZelligHarrisDistributionalStructure1954.pdf", why: { de: "Begründet Bedeutung aus dem sprachlichen Kontext.", en: "Grounds meaning in linguistic context." } },
    { label: "Firth (1957), A Synopsis of Linguistic Theory", url: "https://archive.org/details/papersinlinguist0000firt", why: { de: "Klassische Formel: Bedeutung zeigt sich im sprachlichen Umfeld.", en: "Classic formula: meaning shows in a word's company." } },
    { label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781", why: { de: "word2vec: gelernte Wortvektoren und Vektorarithmetik.", en: "word2vec: learned word vectors and vector arithmetic." } },
    { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/", why: { de: "GloVe: globale Kookkurrenz als Wortvektoren.", en: "GloVe: global co-occurrence as word vectors." } }
  ];
  var introSteps = DE ? [
    {
      kicker: "Chat und Code",
      title: "Was ist ein LLM? Chat und Code",
      body: "Drei Unterfolien, eine Schleife: Suche, Chat und Code. Jede zeigt eine andere Oberfläche; das Modell schreibt Token für Token. Klicke Suche, Chat oder Code.",
      demoState: { scene: "media", step: 0 },
      context: "Suche, Chat und Code sind drei Oberflächen für dasselbe Modell. Jede Antwort ist eine Sequenz von Tokens; Code wird zusätzlich ausgeführt.",
      deep: "Die Suche ergänzt Index und Links; der Chat führt einen Dialog; der Code wird von Python ausgeführt. Der generative Kern ist bei allen ein LLM. Deshalb kann Code plausibel aussehen und trotzdem falsch sein.",
      boxes: [
        box("in-1", "Die Schleife", "Was ist ein Token?", "Ein Token ist ein Stück Text: ein Wort, ein Wortteil, ein Satzzeichen oder ein Byte. Das Modell liest eine ID, keine Buchstaben. Aus IDs werden Vektoren, und am Ende steht wieder Text."),
        box("in-2", "Die Idee", "Warum eine Schleife?", "Weil ein Satz länger ist als ein Token. Das Modell sagt ein Token voraus, hängt es an die Eingabe, und beginnt von vorn. Auto steht für die eigene Ausgabe, regressiv für die Vorhersage aus der bisherigen Sequenz."),
        box("chat-1", "Gleiche Technik", "Was haben Chat und Code gemeinsam?", "Die Chat-Antwort und das Programm werden von einem Sprachmodell Token für Token geschrieben. Beide nutzen dieselbe Schleife."),
        box("in-3", "Code", "Warum funktioniert Code?", "Code hat eine strenge Syntax und viele wiederkehrende Muster. Beides ist für ein nächstes-Token-Modell leichter zu lernen als freie Prosa. Ein Programm ist eine Sequenz mit einer klaren lokalen Struktur."),
        box("in-4", "Grenze", "Was garantiert der Code nicht?", "Dass er das Richtige tut. Das Modell optimiert auf Plausibilität, nicht auf Korrektheit. Die Ausführung zeigt, ob er passend ist.")
      ],
      sources: [
        { label: "Google Search Help (2024), AI Overviews", url: "https://support.google.com/websearch/answer/14901683?hl=en", why: { de: "Google beschreibt die generierten Zusammenfassungen in der Suche.", en: "Google describes the generated summaries in Search." } },
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Der Transformer als Grundlage moderner Sprachmodelle.", en: "The transformer as the basis of modern language models." } }
      ]
    },
    {
      kicker: "Die Schleife",
      title: "Ein Wort nach dem anderen",
      body: "Jetzt schließt sich der Kreis. Der letzte Vektor h wird über W_U zu Logits, Softmax macht daraus eine Verteilung, und ein Token wird gezogen. Dann hängst du es an den Kontext, und Attention, FFN und Unembedding laufen von vorn. Vervollständige „Es war einmal ein …“ Wort für Wort: Bei jedem Schritt zieht die Demo das nächste Token aus der Verteilung. Greedy, Sampling und Top-p lesen dieselben Wahrscheinlichkeiten unterschiedlich. Am Ende steht <|endoftext|>; sobald das Modell es zieht, endet die Schleife. Die Landschaft ist eine vereinfachte Demo.",
      watch: "Vervollständige „Es war einmal ein …“ Wort für Wort, bis <|endoftext|> kommt. Die Landschaft ist nur ein vereinfachtes Bild.",
      demoState: { scene: "loop", mode: "sample", temp: 0.8, landscape: true, view: "default", camera: { yaw: -0.86, pitch: 0.918, zoom: 1 } },
      context: "Das Modell hat kein anderes Arbeitsgedächtnis als den Kontext. Jedes neue Token verändert, was als Nächstes wahrscheinlich ist.",
      deep: "Eine hohe Wahrscheinlichkeit ist keine Garantie für Wahrheit. Sie ist eine Aussage über den Trainingskorpus. Sampling macht die Verteilung sichtbar; Greedy nimmt immer den wahrscheinlichsten Pfad. Jedes neue Token läuft wieder durch alle Blöcke. Der KV-Cache spart nur die Neuberechnung der Keys und Values, nicht die Schleife.",
      boxes: [
        box("in-5", "Mathematik", "Was macht Temperatur?", "Temperatur teilt die Logits vor dem Softmax: p_i ∝ exp(z_i / T). T < 1 schärft, T > 1 flacht ab. Bei T → 0 wird daraus Greedy; exakt null wird als Top-Token behandelt."),
        box("in-6", "Technik", "Warum nicht immer Greedy?", "Greedy ist deterministisch und kann in Schleifen laufen. Sampling ist vielfältiger, aber auch inkohärenter. Top-p behält die kleinste Menge, deren kumulierte Wahrscheinlichkeit p erreicht.")
      ]
    },
    {
      kicker: "Die Wahl",
      title: "Die Verteilung ist nicht die Antwort",
      body: "Du siehst eine Wahrscheinlichkeitslandschaft: Täler sind wahrscheinlich, Berge unwahrscheinlich. Jedes Token ist ein Punkt in einem riesigen, hochdimensionalen Raum. Bei jedem Schritt berechnet das Modell nur die Wahrscheinlichkeit des nächsten Tokens, dann die des darauffolgenden; es sieht immer nur die unmittelbare Umgebung und tastet sich Schritt für Schritt weiter. Die Kugel ist das Token: Mit jeder Wahl bekommt sie Schwung und kann aus ihrem Tal in ein benachbartes entkommen; der goldene Pfad zeigt die gewählten Tokens.",
      watch: "Dreh die Szene mit Maus oder Finger. Gib der Kugel mit einer Wahl Schwung und sieh, in welches Tal sie rollt.",
      demoState: { scene: "loop", mode: "greedy", temp: 0.8, landscape: true, view: "top" },
      context: "Jeder Schritt senkt die Täler seiner Optionen; ein gewähltes Token behält sein Tal. Die Balken zeigen dieselbe Verteilung, aus der die Kugel kommt.",
      deep: "Top-k ist eine feste Anzahl, Top-p eine feste Masse. Min-p skaliert mit dem Top-Token. Nach dem Schnitt werden die verbleibenden Wahrscheinlichkeiten renormalisiert. Beam Search hält mehrere Pfade am Leben; Speculative Sampling beschleunigt die Prüfung, ohne die Zielverteilung zu ändern.",
      boxes: [
        box("in-7", "Anwendung", "Welche Einstellung wofür?", "Code und Fakten: niedrige Temperatur, enger Filter. Brainstorming: höhere Temperatur, weiterer Filter. Es gibt keine universelle Regel."),
        box("in-8", "Geschichte", "Warum wurde Sampling wichtig?", "Weil ein Modell ohne Sampling immer denselben Text liefert. Die Vielfalt kommt aus der Verteilung, nicht aus dem Modell allein."),
        box("loop-1", "Grenze", "Gibt es diese Täler wirklich?", "Diese Landschaft ist stark vereinfacht. In einem echten Modell hat der Raum Tausende Dimensionen; dort ist fast jeder flache Punkt ein Sattelpunkt, kein abgeschlossenes Tal. Von dort geht es in viele Richtungen gleichzeitig bergauf und bergab. Die zwei Achsen, die Kugel und die farbigen Täler sind ein Bild für die Idee, keine Messung des echten Token-Raums."),
        box("loop-2", "Geometrie", "Was sind die Blasen?", "Die farbigen Flächen sind 2D-Projektionen eines viel höherdimensionalen Token-Raums. Im echten Modell liegen unzählige Richtungen und Nachbartokens in der Nähe; die Blase ist nur der sichtbare Schatten."),
        box("loop-3", "Grenze", "Denken und Sprechen", "Der innere Zustand kann reicher sein als das eine nächste Token, das ihn ausdrücken muss. In der Landschaft liegen ganze Blasen von Möglichkeiten; nach außen wird daraus eine einzige Token-Wahl. Manche nennen diese Lücke eine Expressivitätslücke; der Begriff ist nicht einheitlich, die Intuition ist: Das Modell kann mehr Unterscheidungen tragen, als ein einzelnes Token sichtbar macht.")
      ]
    }
  ] : [
    {
      kicker: "Chat and code",
      title: "What is an LLM? Chat and code",
      body: "Three sub-slides, one loop: Search, chat, and code. Each shows a different surface; the model writes token by token. Click Search, Chat, or Code.",
      demoState: { scene: "media", step: 0 },
      context: "Search, chat, and code are three surfaces for the same model. Every answer is a sequence of tokens; code is also executed.",
      deep: "Search adds an index and links; the chat holds a dialogue; the code is run by Python. The generative core is an LLM in all three. That is why code can look plausible and still be wrong.",
      boxes: [
        box("in-1", "The loop", "What is a token?", "A token is a piece of text: a word, a word piece, a punctuation mark, or a byte. The model reads an ID, not letters. IDs become vectors, and at the end there is text again."),
        box("in-2", "The idea", "Why a loop?", "Because a sentence is longer than one token. The model predicts one token, appends it to the input, and starts again. Auto stands for its own output, regressive for predicting from the sequence so far."),
        box("chat-1", "Same technology", "What do chat and code share?", "The chat answer and the program are written by a language model token by token. Both use the same loop."),
        box("in-3", "Code", "Why does code work?", "Code has strict syntax and many repeating patterns. Both are easier for a next-token model to learn than free prose. A program is a sequence with clear local structure."),
        box("in-4", "Limit", "What does code not guarantee?", "That it does the right thing. The model optimises for plausibility, not correctness. Execution shows whether it fits.")
      ],
      sources: [
        { label: "Google Search Help (2024), AI Overviews", url: "https://support.google.com/websearch/answer/14901683?hl=en", why: { de: "Google beschreibt die generierten Zusammenfassungen in der Suche.", en: "Google describes the generated summaries in Search." } },
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Der Transformer als Grundlage moderner Sprachmodelle.", en: "The transformer as the basis of modern language models." } }
      ]
    },
    {
      kicker: "The loop",
      title: "One word after another",
      body: "Now the circle closes. The last vector h becomes logits through W_U, softmax turns them into a distribution, and one token is drawn. Then you append it to the context, and attention, FFN, and unembedding run again. Complete “Once upon a time there was …” word by word: at each step the demo draws the next token from the distribution. Greedy, sampling, and top-p read the same probabilities differently. At the end comes <|endoftext|>; as soon as the model draws it, the loop stops. The landscape is a simplified demo.",
      watch: "Complete “Once upon a time there was …” word by word until <|endoftext|> appears. The landscape is only a simplified picture.",
      demoState: { scene: "loop", mode: "sample", temp: 0.8, landscape: true, view: "default", camera: { yaw: -0.86, pitch: 0.918, zoom: 1 } },
      context: "The model has no working memory other than the context. Every new token changes what is likely next.",
      deep: "A high probability is not a guarantee of truth. It is a statement about the training corpus. Sampling makes the distribution visible; greedy always takes the most likely path. Every new token runs through all blocks again. The KV cache only saves recomputing keys and values, not the loop.",
      boxes: [
        box("in-5", "Mathematics", "What does temperature do?", "Temperature divides the logits before softmax: p_i ∝ exp(z_i / T). T < 1 sharpens, T > 1 flattens. At T → 0 it becomes greedy; exact zero is handled as the top token."),
        box("in-6", "Technique", "Why not always greedy?", "Greedy is deterministic and can loop. Sampling is more varied, but also less coherent. Top-p keeps the smallest set whose cumulative probability reaches p.")
      ]
    },
    {
      kicker: "The choice",
      title: "The distribution is not the answer",
      body: "You see a probability landscape: valleys are likely, mountains unlikely. Every token is a point in a huge, high-dimensional space. At each step the model computes only the probability of the next token, then of the one after that; it sees only the immediate neighbourhood and feels its way forward step by step. The ball is the token: each choice gives it momentum so it can escape its valley into a neighbouring one; the gold path shows the tokens you chose.",
      watch: "Rotate the scene with mouse or finger. Give the ball momentum with a choice and watch which valley it rolls into.",
      demoState: { scene: "loop", mode: "greedy", temp: 0.8, landscape: true, view: "top" },
      context: "Each step lowers the valleys of its options; a chosen token keeps its valley. The bars show the same distribution the ball comes from.",
      deep: "Top-k is a fixed number, top-p a fixed mass. Min-p scales with the top token. After the cut, the remaining probabilities are renormalised. Beam search keeps several paths alive; speculative sampling speeds up verification without changing the target distribution.",
      boxes: [
        box("in-7", "Application", "Which setting for what?", "Code and facts: low temperature, narrow filter. Brainstorming: higher temperature, wider filter. There is no universal rule."),
        box("in-8", "History", "Why did sampling become important?", "Because a model without sampling always produces the same text. Variety comes from the distribution, not from the model alone."),
        box("loop-1", "Limit", "Do these valleys really exist?", "This landscape is strongly simplified. A real model works in thousands of dimensions; there almost every flat point is a saddle point, not a closed valley. From such a point the surface goes up and down in many directions at once. The two axes, the ball, and the coloured valleys are a picture of the idea, not a measurement of the real token space."),
        box("loop-2", "Geometry", "What are the bubbles?", "The coloured areas are 2D projections of a much higher-dimensional token space. In a real model, countless directions and neighbouring tokens lie nearby; the bubble is only the visible shadow."),
        box("loop-3", "Limit", "Thinking and speaking", "The internal state can be richer than the one next token that has to express it. In the landscape there are whole bubbles of possibilities; on the outside they become a single token choice. Some call this gap an expressivity gap; the term is not uniform, but the intuition is: the model can carry more distinctions than one token can make visible.")
      ]
    }
  ];

  var embedSteps = DE ? [
    {
      kicker: "Die Linie",
      title: "Bedeutung wird eine Zahl",
      body: "Wir ordnen Wörtern Zahlen zu. Auf einer Linie liegt jedes Wort an einer Stelle; der Abstand sagt, wie ähnlich zwei Wörter in dieser Eigenschaft sind. Klicke zwei Punkte: Der Mittelpunkt ist ihr Durchschnitt. Kalt (5) und warm (55) ergeben 30; kalt und heiß ergeben 52,5. Das liegt nahe bei warm, aber nicht exakt. Bedeutung ist oft eine Nähe, kein exakter Wert.",
      watch: "Klicke zwei Punkte. Wann ist der Mittelpunkt exakt, wann ungefähr?",
      demoState: { scene: "embedding", mode: "temperature", dim: 0, pair: ["cold", "hot"] },
      context: "Eine Achse ist die einfachste Form eines Vektorraums: eine Koordinate pro Wort. Der Mittelpunkt (a + b) / 2 funktioniert in jeder Dimension gleich.",
      deep: "Die Positionen sind hier von Hand gewählt, damit du die Rechnung siehst. In einem Modell werden sie aus vielen Beispielen gelernt. Die Abweichung ist der Abstand zwischen Mittelwert und nächstem Wort; bei kalt + heiß sind das 2,5 Grad.",
      boxes: [
        box("emb-1", "Mathematik", "Was ist ein Vektor?", "Ein Vektor ist ein Element eines Vektorraums. In der Praxis ist er eine geordnete Liste von Zahlen, die einen Punkt oder eine Richtung beschreibt. Die Richtung ist oft wichtiger als die Länge."),
        box("emb-2", "Geschichte", "Woher kommt die Idee?", "Firth (1957): „You shall know a word by the company it keeps.“ Harris (1954) hatte die distributionelle Idee vorher formuliert. Wörter, die in ähnlichen Kontexten auftreten, bekommen ähnliche Vektoren."),
        box("emb-4", "Mathematik", "Warum funktioniert der Mittelpunkt?", "Weil Vektoren koordinatenweise addiert werden. Der Mittelpunkt (a + b) / 2 liegt auf der Verbindungslinie. In höheren Dimensionen gilt dieselbe Rechnung; du siehst nur eine Projektion."),
        box("emb-5", "Grenze", "Ist der Mittelpunkt ein Wort?", "Nein. Er ist eine Position im Raum. Dass sie nahe an einem Wort liegt, ist eine Eigenschaft der gelernten Geometrie, keine Definition."),
        box("emb-approx", "Grenze", "Was heißt „ungefähr“?", "Der Mittelwert 52,5 liegt 2,5 Grad von warm entfernt. Es gibt kein Wort exakt bei 52,5. Die Nähe reicht, weil das Modell mit Winkeln und Nachbarn arbeitet, nicht mit einer Wortliste.")
      ],
      sources: sources.slice(0, 4)
    },
    {
      kicker: "Die Ebene",
      title: "Bedeutung bekommt eine zweite Achse",
      body: "Eine Achse kann Wörter nach einer einzigen Eigenschaft ordnen. Mann und Frau teilen die Machtposition und fallen deshalb auf derselben Stelle zusammen. Eine zweite Achse schafft freie Wege: Jetzt liegen sie nebeneinander, ohne die Machtposition zu verlieren. Derselbe Richtungsschritt erscheint zwischen König und Königin: König − Mann + Frau liegt nahe bei Königin. Die Beziehung ist eine Richtung, keine benannte Regel.",
      watch: "Vergleiche 1D und 2D. Welche Richtung wird wiederverwendet?",
      demoState: { scene: "embedding", mode: "space", dim: 1, selected: null, arithmetic: "king-man-woman" },
      context: "In 1D ist die Strecke belegt; mehrere Wörter teilen sich eine Position. In 2D bekommt jede zusätzliche Eigenschaft eine eigene Richtung. Die Analogie ist eine Approximation, keine exakte Regel.",
      deep: "Freie Wege sind der Kern: Bedeutung braucht Platz für mehrere unabhängige Unterschiede. Jede zusätzliche Achse kann eine weitere Beziehung tragen, ohne eine andere zu überschreiben. Die Nachbarschaft ist ein statistisches Signal, keine Definition.",
      boxes: [
        box("emb-6", "Technik", "Warum zwei Achsen?", "Zwei Achsen machen zwei unabhängige Unterschiede sichtbar. Die erste Achse ordnet nach Macht, die zweite nach Geschlecht. Erst dadurch werden Mann und Frau unterscheidbar, obwohl sie auf der Machtachse denselben Wert haben."),
        box("emb-7", "Geschichte", "Woher kommt die Analogie?", "Mikolov et al. (2013) zeigten, dass Differenzen wie König − Mann + Frau nahe bei Königin landen. Das ist eine Approximation, keine exakte Regel. Sie funktioniert, weil ähnliche Wörter in ähnlichen grammatischen Slots auftreten."),
        box("emb-8", "Mathematik", "Warum funktioniert die Analogie?", "Weil ähnliche Wörter in ähnlichen grammatischen Slots auftreten. Der Unterschied zwischen Mann und Frau wird zu einer wiederverwendbaren Richtung. Dieselbe Richtung erscheint zwischen König und Königin."),
        box("emb-14", "Technik", "Was wird übertragen?", "Mann → Frau und König → Königin sind parallel. Die Richtung ist eine gelernte Beziehung, die auf ein neues Paar angewendet wird. Deshalb landet König − Mann + Frau nahe bei Königin."),
        box("emb-9", "Anwendung", "Wofür ist das gut?", "Suche, Empfehlungen, Clustering und RAG nutzen genau diese Geometrie: semantische Nähe wird zur Abfrage. Die Vektorarithmetik ist eher eine Diagnose als ein Produktmerkmal.")
      ],
      sources: sources.slice(2, 4)
    },
    {
      kicker: "Der Raum",
      title: "Drei Dimensionen, ein Schatten",
      body: "Eine dritte Achse hebt die Ebene in einen Raum. Jetzt können dieselben Punkte neben Macht und Geschlecht auch Rang tragen. Jede Ansicht ist eine Projektion: Linien, die sich auf dem Bildschirm kreuzen, müssen sich im vollen Raum nicht berühren. Jedes Wort ist ein Pfeil vom Ursprung: Die Richtung trägt die Bedeutung, die Länge ist Nebensache. Ziehe die Ansicht und beobachte, welche Richtung stabil bleibt. Die Tabelle zeigt zuerst die drei Dimensionen, die du siehst; ein Klick auf „4096 Dimensionen“ wechselt direkt zur vollen Rechner-Tabelle.",
      watch: "Ziehe die Ansicht. Welche Richtung bleibt stabil? Öffne am Ende die Tabelle der drei Dimensionen und danach die 4096-Dimensionen-Tabelle.",
      demoState: { scene: "embedding", mode: "space", dim: 2, selected: "king", arithmetic: "directions", tables: true },
      context: "Ein echtes Modell arbeitet in Tausenden Dimensionen. Die drei Achsen sind eine Projektion, kein vollständiges Bild. Die Perspektive kann Relationen zeigen, die in der Projektion verdeckt sind. Mehr Dimensionen tragen mehr unabhängige Beziehungen: Temperatur, Geschlecht, Macht, Thema, Sprache, Stil. Zwei oder drei Achsen kollidieren zu schnell.",
      deep: "Superposition und Polysemantik erklären, warum ein Neuron mehrere Bedeutungen tragen kann. Die Karte ist nützlich, aber sie ist statistisch. Sie zeigt, was im Training häufig war, nicht was wahr ist. Die Zahlen der 4096-Tabelle sind ein Ausschnitt, keine echten GPT-Gewichte. Ein echtes Modell lernt jede Koordinate aus Text; keine einzelne Spalte hat für sich eine Bedeutung. Die Geometrie entsteht im Zusammenspiel.",
      boxes: [
        box("emb-10", "Technik", "Warum sieht man das im LLM nicht?", "Weil die Räume zu hochdimensional sind. Die Demo ist eine Projektion auf drei Achsen. Eine Kreuzung auf dem Bildschirm bedeutet nicht, dass die Punkte im vollen Raum zusammenfallen."),
        box("emb-11", "Geschichte", "Woher kommt das Bild?", "Die Idee, Bedeutung als Geometrie zu lesen, verbindet distributionelle Semantik mit Conceptual Spaces. Die konkrete Demo ist eine Vereinfachung, keine Messung eines echten Modells."),
        box("hd-1", "Technik", "Warum so viele Dimensionen?", "Jede zusätzliche Dimension kann eine weitere Richtung für einen Unterschied öffnen. Mit Tausenden Koordinaten können viele Beziehungen nebeneinander existieren, ohne sich gegenseitig zu überschreiben."),
        box("hd-2", "Grenze", "Kann man das noch sehen?", "Nein. Menschen sehen höchstens drei Achsen. Die Tabelle ist die ehrliche Darstellung für den Rechner; die 3D-Demos sind Projektionen für uns.")
      ],
      sources: sources
    }
  ] : [
    {
      kicker: "The line",
      title: "Meaning becomes a number",
      body: "We assign numbers to words. On a line every word sits at one position; the distance says how similar two words are in this property. Click two points: the midpoint is their average. Cold (5) and warm (55) give 30; cold and hot give 52.5. That is close to warm, but not exact. Meaning is often closeness, not an exact value.",
      watch: "Click two points. When is the midpoint exact, when approximate?",
      demoState: { scene: "embedding", mode: "temperature", dim: 0, pair: ["cold", "hot"] },
      context: "One axis is the simplest form of a vector space: one coordinate per word. The midpoint (a + b) / 2 works the same in every dimension.",
      deep: "The positions are chosen by hand here so you can see the arithmetic. In a model they are learned from many examples. The error is the distance between the midpoint and the nearest word; for cold + hot it is 2.5 degrees.",
      boxes: [
        box("emb-1", "Mathematics", "What is a vector?", "A vector is an element of a vector space. In practice it is an ordered list of numbers that describes a point or a direction. Direction often matters more than length."),
        box("emb-2", "History", "Where does the idea come from?", "Firth (1957): “You shall know a word by the company it keeps.” Harris (1954) formulated the distributional idea earlier. Words that appear in similar contexts receive similar vectors."),
        box("emb-4", "Mathematics", "Why does the midpoint work?", "Because vectors are added coordinate by coordinate. The midpoint (a + b) / 2 lies on the line between them. The same arithmetic works in higher dimensions; you only see a projection."),
        box("emb-5", "Limit", "Is the midpoint a word?", "No. It is a position in the space. That it lands near a word is a property of the learned geometry, not a definition."),
        box("emb-approx", "Limit", "What does “approximate” mean?", "The midpoint 52.5 is 2.5 degrees away from warm. No word sits exactly at 52.5. Closeness is enough because the model works with angles and neighbours, not with a word list.")
      ],
      sources: sources.slice(0, 4)
    },
    {
      kicker: "The plane",
      title: "Meaning gets a second axis",
      body: "One axis can order words by a single property. Man and woman share the power position, so they collapse onto the same point. A second axis creates free paths: they now sit side by side without losing the power position. The same direction step appears between king and queen: king − man + woman is near queen. The relation is a direction, not a named rule.",
      watch: "Compare 1D and 2D. Which direction is reused?",
      demoState: { scene: "embedding", mode: "space", dim: 1, selected: null, arithmetic: "king-man-woman" },
      context: "In 1D the line is occupied; several words share one position. In 2D every extra property gets its own direction. The analogy is an approximation, not an exact rule.",
      deep: "Free paths are the point: meaning needs room for several independent differences. Every extra axis can carry another relation without overwriting one. Neighbourhood is a statistical signal, not a definition.",
      boxes: [
        box("emb-6", "Technique", "Why two axes?", "Two axes make two independent differences visible. The first axis orders by power, the second by gender. Only then do man and woman become distinguishable even though they share a value on the power axis."),
        box("emb-7", "History", "Where does the analogy come from?", "Mikolov et al. (2013) showed that differences such as king − man + woman land near queen. It is an approximation, not an exact rule. It works because similar words appear in similar grammatical slots."),
        box("emb-8", "Mathematics", "Why does the analogy work?", "Because similar words appear in similar grammatical slots. The difference between man and woman becomes a reusable direction. The same direction appears between king and queen."),
        box("emb-14", "Technique", "What is carried over?", "Man → woman and king → queen are parallel. The direction is a learned relation applied to a new pair. That is why king − man + woman lands near queen."),
        box("emb-9", "Application", "What is it good for?", "Search, recommendations, clustering, and RAG use exactly this geometry: semantic closeness becomes a query. Vector arithmetic is more a diagnostic than a product feature.")
      ],
      sources: sources.slice(2, 4)
    },
    {
      kicker: "The space",
      title: "Three dimensions, one shadow",
      body: "A third axis lifts the plane into a space. Now the same points can carry rank as well as power and gender. Every view is a projection: lines that cross on screen need not touch in the full space. Every word is an arrow from the origin: the direction carries the meaning, the length is secondary. Drag the view and watch which direction stays stable. The table first shows the three dimensions you see; one click on “4096 dimensions” switches straight to the full table for the computer.",
      watch: "Drag the view. Which direction stays stable? At the end, open the table of the three dimensions and then the 4096-dimension table.",
      demoState: { scene: "embedding", mode: "space", dim: 2, selected: "king", arithmetic: "directions", tables: true },
      context: "A real model works in thousands of dimensions. The three axes are a projection, not a complete picture. Perspective can show relations that the projection hides. More dimensions can carry more independent relations: temperature, gender, power, topic, language, style. Two or three axes collide too quickly.",
      deep: "Superposition and polysemy explain why a neuron can carry several meanings. The map is useful, but it is statistical. It shows what was frequent in training, not what is true. The numbers in the 4096 table are a slice, not real GPT weights. A real model learns every coordinate from text; no single column means anything on its own. The geometry comes from the interaction.",
      boxes: [
        box("emb-10", "Technique", "Why don't we see this in an LLM?", "Because the spaces are too high-dimensional. The demo is a projection onto three axes. A crossing on screen does not mean the points coincide in the full space."),
        box("emb-11", "History", "Where does the picture come from?", "The idea of reading meaning as geometry connects distributional semantics with conceptual spaces. The concrete demo is a simplification, not a measurement of a real model."),
        box("hd-1", "Technique", "Why so many dimensions?", "Every extra dimension can open another direction for a difference. With thousands of coordinates many relations can exist side by side without overwriting one another."),
        box("hd-2", "Limit", "Can we still see this?", "No. Humans see at most three axes. The table is the honest view for the computer; the 3D demos are projections for us.")
      ],
      sources: sources
    }
  ];

  var tokenizeSteps = DE ? [
    {
      kicker: "Tokenize",
      title: "Text wird zu IDs",
      body: "BPE beginnt bei Zeichen: Jedes Wort wird in Zeichen zerlegt, dann zählt der Algorithmus benachbarte Paare und ersetzt das häufigste Paar durch ein neues Symbol. Nach einigen Merges werden häufige Wörter kurz; seltene Schriften bleiben teuer. Das ist gelernte, verlustfreie Kompression. Die Beispiele zeigen danach, wie ein Text in Tokens und IDs zerfällt.",
      watch: "Drücke Weiter: Welches Paar wird als Nächstes verschmolzen?",
      demoState: { scene: "tokenize" },
      centerTitle: true,
      context: "Teil 1: Text wird in Tokens geteilt, jede ID ist eine Adresse in der Embedding-Tabelle. Teil 2: BPE beginnt bei Zeichen und baut das Vokabular durch Merges auf. Jeder Merge ist ein neues Vokabelstück.",
      deep: "BPE ist eine gelernte Kompression: Es zählt benachbarte Paare im Trainingskorpus und ersetzt das häufigste Paar durch ein neues Symbol. Nach mehreren Merges werden häufige Wörter kurz. Die genaue Tokenisierung hängt an den Daten und am Vokabularziel; die Demo zeigt einen kleinen Korpus, keine Messung eines bestimmten Modells.",
      boxes: [
        box("tok-1", "Technik", "Warum Subwords?", "Ein festes Wort-Vokabular müsste jedes unbekannte Wort als Sonderzeichen behandeln. Subwords erlauben es, neue Wörter aus bekannten Teilen zusammenzusetzen. Gleichzeitig bleibt das Vokabular endlich."),
        box("tok-2", "Mathematik", "Was ist eine ID?", "Eine ID ist ein Integer, der auf eine Zeile in der Embedding-Matrix zeigt. Die ID selbst hat keine Bedeutung; erst der gelernte Vektor gibt dem Token eine Position im Raum."),
        box("tok-3", "Technik", "BPE = Kompression", "Byte Pair Encoding beginnt mit Zeichen oder Bytes und ersetzt wiederholt das häufigste Paar durch ein neues Symbol. Nach vielen Merges wird aus häufigen Zeichenfolgen ein einzelner Token. Das ist Datenkompression, gelernt aus dem Trainingskorpus."),
        box("tok-bpe-data", "Daten", "Warum ist die Tokenisierung datenabhängig?", "Ein Tokenizer wird so optimiert, dass er möglichst viel Text mit möglichst wenigen Tokens abdeckt, ohne Information zu verlieren: Jedes Wort muss aus seinen Tokens wieder zusammensetzbar sein. Deshalb ist die exakte Zerlegung eine Folge der Trainingsdaten und des Vokabularziels, keine feste Wortliste. Seltene Schriften bleiben teurer, weil sie im Korpus seltener sind."),
        box("tok-4", "Grenze", "Warum ist Englisch kürzer?", "Weil der Trainingskorpus überwiegend englisch ist. Häufige englische Wörter bekommen lange Merges; Schriften mit wenig Text im Korpus bleiben auf Byte-Ebene. Die Demo zeigt das illustrativ, nicht als exakte Messung."),
        box("tok-utf8", "Technik", "UTF-8 und Joins", "UTF-8 kodiert Zeichen als Bytes. Ein sichtbares Emoji kann aus mehreren Codepoints bestehen: 🐈‍⬛ kombiniert 🐈, einen unsichtbaren Zero Width Joiner (ZWJ) und ⬛. Der Tokenizer sieht die Bytefolge, nicht das fertige Bild. Deshalb ist die schwarze Katze hier zwei Emoji-Bausteine und mehrere Byte-Tokens.")
      ],
      sources: [
        { label: "Sennrich et al. (2016), Neural Machine Translation of Rare Words with Subword Units", url: "https://arxiv.org/abs/1508.07909", why: { de: "BPE als Subword-Kompression für seltene Wörter.", en: "BPE as subword compression for rare words." } },
        { label: "Radford et al. (2019), GPT-2", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", why: { de: "GPT-2: byte-level BPE und die hier gezeigten Hidden States.", en: "GPT-2: byte-level BPE and the hidden states shown here." } }
      ]
    }
  ] : [
    {
      kicker: "Tokenize",
      title: "Text becomes IDs",
      body: "BPE starts from characters: every word is split into characters, then the algorithm counts adjacent pairs and replaces the most frequent pair with a new symbol. After several merges, frequent words become short; rare scripts stay expensive. That is learned, lossless compression. The examples then show how text breaks into tokens and IDs.",
      watch: "Press Next: which pair is merged next?",
      demoState: { scene: "tokenize" },
      centerTitle: true,
      context: "Part 1: text is split into tokens, and each ID is an address in the embedding table. Part 2: BPE starts from characters and builds the vocabulary through merges. Each merge is a new vocabulary item.",
      deep: "BPE is learned compression: it counts adjacent pairs in the training corpus and replaces the most frequent pair with a new symbol. After several merges, frequent words become short. The exact tokenization depends on the data and the vocabulary target; the demo shows a small corpus, not a measurement of a specific model.",
      boxes: [
        box("tok-1", "Technique", "Why subwords?", "A fixed word vocabulary would have to treat every unseen word as a special symbol. Subwords let the model build new words from known pieces while keeping the vocabulary finite."),
        box("tok-2", "Mathematics", "What is an ID?", "An ID is an integer that points to a row in the embedding matrix. The ID itself has no meaning; the learned vector gives the token a position in the space."),
        box("tok-3", "Technique", "BPE = compression", "Byte pair encoding starts with characters or bytes and repeatedly replaces the most frequent pair with a new symbol. After many merges, frequent character sequences become a single token. That is data compression learned from the training corpus."),
        box("tok-bpe-data", "Data", "Why does tokenization depend on the data?", "A tokenizer is optimised to cover as much text as possible with as few tokens as possible, without losing information: every word must be reconstructable from its tokens. The exact split therefore follows the training data and the vocabulary target, not a fixed word list. Rare scripts stay more expensive because they are rarer in the corpus."),
        box("tok-4", "Limit", "Why is English shorter?", "Because the training corpus is mostly English. Frequent English words get long merges; scripts with little text in the corpus stay at the byte level. The demo shows this illustratively, not as an exact measurement."),
        box("tok-utf8", "Technique", "UTF-8 and joins", "UTF-8 encodes characters as bytes. A visible emoji can consist of several code points: 🐈‍⬛ combines 🐈, an invisible zero-width joiner (ZWJ), and ⬛. The tokenizer sees the byte sequence, not the finished picture. That is why the black cat is two emoji parts and several byte tokens here.")
      ],
      sources: [
        { label: "Sennrich et al. (2016), Neural Machine Translation of Rare Words with Subword Units", url: "https://arxiv.org/abs/1508.07909", why: { de: "BPE als Subword-Kompression für seltene Wörter.", en: "BPE as subword compression for rare words." } },
        { label: "Radford et al. (2019), GPT-2", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", why: { de: "GPT-2: byte-level BPE und die hier gezeigten Hidden States.", en: "GPT-2: byte-level BPE and the hidden states shown here." } }
      ]
    }
  ];

  var positionSteps = DE ? [
    {
      kicker: "Position",
      title: "Jeder Platz bekommt einen Fingerabdruck",
      body: "Ein Token allein weiß nicht, wo es steht: „Hund“ kann an jeder Stelle im Satz auftreten. Damit die Reihenfolge zählt, kodieren wir die Position in den Token-Vektor. Dafür gibt es viele Methoden; die Demo zeigt eine sinusförmige Variante. Viele moderne Modelle wie Llama nutzen RoPE, das die Richtung des Vektors mit der Position dreht. Wichtig ist: Die Position wird Teil des Tokens, und alle folgenden Schichten sehen diese Version.",
      watch: "Bewege den Positionsregler. Wie verändert sich der Vektor, und wie wächst der Abstand auf der Kreisbahn?",
      demoState: { scene: "position" },
      context: "Die Position wird als Summe von Wellen auf Kreisbahnen kodiert: Jede Dimension hat eine andere Frequenz. Gemessen wird der Großkreis zwischen den Richtungen, nicht der euklidische Abstand: Längen zählen nicht, nur der Winkel. So zeigt der Fingerabdruck, wie nah zwei Positionen in ihrer Richtung liegen.",
      deep: "Die Demo zeigt nur die ersten drei Dimensionen. In einem echten Modell sind es Tausende; die Großkreis-Metrik macht Richtungen vergleichbar, und schnelle und langsame Rotationen bilden zusammen ein Positionsmuster, das das Modell lernen kann.",
      boxes: [
        box("pos-1", "Methoden", "Welche Positionsverfahren gibt es?", "Gelernte absolute Embeddings (GPT-2, BERT), sinusförmige Kodierung (Vaswani et al. 2017), relative Position Bias (T5) und ALiBi (Press et al. 2021). RoPE (Su et al. 2021) dreht Query und Key; viele moderne Modelle wie Llama nutzen es."),
        box("pos-2", "RoPE", "Wie funktioniert RoPE?", "RoPE dreht Query- und Key-Vektoren um einen Winkel, der von der Position abhängt. Das Skalarprodukt zweier gedrehter Vektoren hängt dann von ihrer relativen Position ab: Absolute Position wird als Rotation kodiert, relative Abstände werden sichtbar."),
        box("pos-3", "Stellenwertsystem", "Warum schnelle und langsame Rotationen?", "Verschiedene Dimensionen drehen unterschiedlich schnell. Schnelle Rotationen unterscheiden nahe Positionen, langsame unterscheiden weit entfernte. Zusammen wirkt das wie ein Stellenwertsystem aus Einern, Zehnern und Hundertern für Positionen."),
        box("pos-4", "Geometrie", "Was zeigt der Plot?", "Die Demo nutzt die Großkreis-Metrik: Richtungen zählen, nicht Längen. Die Länge im Plot ist der Großkreis zwischen Wort und Positionsvektor. Im hochdimensionalen Raum entstehen daraus Muster, die das Modell lernen kann, um so etwas wie „Drache an Position 5“ oder „Drache an Position 22“ zu kodieren."),
        box("pos-5", "Grenze", "Was ist vereinfacht?", "Die Demo zeigt nur wenige Dimensionen und eine sinusförmige Kodierung. RoPE rotiert Query/Key statt des Token-Vektors. Die gezeigten Muster sind eine Intuition, nicht die exakte Implementierung."),
        box("pos-6", "Detail", "Was passiert mit der Position danach?", "Ab dem Moment, in dem die Position zum Token gehört, bekommt jede folgende Schicht nur noch diese Version. Sie wird nicht mehr herausgeworfen. Das Token ist dann nicht mehr nur „Drache“, sondern „Drache an dieser Position“; die Varianten werden für das Netz unterscheidbar."),
        box("pos-7", "Vergleich", "Sinus, ALiBi, RoPE", "Sinus nutzt feste Wellen; ALiBi bestraft Distanz linear; RoPE dreht Query/Key und macht relative Abstände als Rotation sichtbar. Das Diagramm berechnet die drei Kurven direkt aus ihren Formeln. Gelernte absolute Positionen fehlen, weil dafür die Gewichte eines konkreten Modells nötig wären.")
      ],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } },
        { label: "Su et al. (2021), RoFormer: Enhanced Transformer with Rotary Position Embedding", url: "https://arxiv.org/abs/2104.09864", why: { de: "RoPE: Positionskodierung als Rotation von Query und Key.", en: "RoPE: position encoding as a rotation of query and key." } },
        { label: "Touvron et al. (2023), Llama 2", url: "https://arxiv.org/abs/2307.09288", why: { de: "Llama 2 nutzt RoPE; Beispiel für ein modernes Modell.", en: "Llama 2 uses RoPE; an example of a modern model." } },
        { label: "Press et al. (2021), Attention with Linear Biases (ALiBi)", url: "https://arxiv.org/abs/2108.12409", why: { de: "ALiBi: linearer Distanz-Bias statt Positions-Embedding.", en: "ALiBi: a linear distance bias instead of position embeddings." } },
        { label: "Raffel et al. (2020), T5", url: "https://arxiv.org/abs/1910.10683", why: { de: "T5: relative Position Bias als Alternative.", en: "T5: relative position bias as an alternative." } }
      ]
    }
  ] : [
    {
      kicker: "Position",
      title: "Every slot gets a fingerprint",
      body: "A token on its own does not know where it stands: “dog” can appear anywhere in the sentence. For order to matter, we encode the position into the token vector. There are many methods; the demo shows a sinusoidal variant. Many modern models such as Llama use RoPE, which rotates the direction of the vector with the position. What matters is this: the position becomes part of the token, and every following layer sees that version.",
      watch: "Move the position slider. How does the vector change, and how does the distance in the plot change?",
      demoState: { scene: "position" },
      context: "The position is encoded as a sum of waves on circular orbits: every dimension has a different frequency. We measure the great circle between the directions, not the Euclidean distance: lengths do not count, only the angle. The fingerprint shows how close two positions are in direction.",
      deep: "The demo shows only the first three dimensions. A real model uses thousands; the great-circle metric makes directions comparable, and fast and slow rotations together form a position pattern the model can learn.",
      boxes: [
        box("pos-1", "Methods", "Which positional methods exist?", "Learned absolute embeddings (GPT-2, BERT), sinusoidal encoding (Vaswani et al. 2017), relative position bias (T5), and ALiBi (Press et al. 2021). RoPE (Su et al. 2021) rotates query and key; many modern models such as Llama use it."),
        box("pos-2", "RoPE", "How does RoPE work?", "RoPE rotates query and key vectors by an angle that depends on the position. The dot product of two rotated vectors then depends on their relative position: absolute position is encoded as a rotation, and relative distances become visible."),
        box("pos-3", "Place value", "Why fast and slow rotations?", "Different dimensions rotate at different speeds. Fast rotations distinguish nearby positions, slow rotations distinguish distant ones. Together they act like a place-value system of ones, tens, and hundreds for positions."),
        box("pos-4", "Geometry", "What does the plot show?", "The demo uses the great-circle metric: directions matter, not lengths. The length in the plot is the great circle between the word and the position vector. In high-dimensional space this creates patterns the model can learn, to encode something like “dragon at position 5” or “dragon at position 22”."),
        box("pos-5", "Limit", "What is simplified?", "The demo shows only a few dimensions and a sinusoidal encoding. RoPE rotates query/key instead of the token vector. The patterns shown are an intuition, not the exact implementation."),
        box("pos-6", "Detail", "What happens to the position afterwards?", "From the moment the position belongs to the token, every following layer receives only that version. It is never thrown away again. The token is no longer just “dragon”; it is “dragon at this position”, and the variants become distinguishable to the network."),
        box("pos-7", "Comparison", "Sinus, ALiBi, RoPE", "Sinus uses fixed waves; ALiBi penalises distance linearly; RoPE rotates query/key and makes relative distances visible as rotation. The chart computes the three curves directly from their formulas. Learned absolute positions are omitted because they need the weights of a specific model.")
      ],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } },
        { label: "Su et al. (2021), RoFormer: Enhanced Transformer with Rotary Position Embedding", url: "https://arxiv.org/abs/2104.09864", why: { de: "RoPE: Positionskodierung als Rotation von Query und Key.", en: "RoPE: position encoding as a rotation of query and key." } },
        { label: "Touvron et al. (2023), Llama 2", url: "https://arxiv.org/abs/2307.09288", why: { de: "Llama 2 nutzt RoPE; Beispiel für ein modernes Modell.", en: "Llama 2 uses RoPE; an example of a modern model." } },
        { label: "Press et al. (2021), Attention with Linear Biases (ALiBi)", url: "https://arxiv.org/abs/2108.12409", why: { de: "ALiBi: linearer Distanz-Bias statt Positions-Embedding.", en: "ALiBi: a linear distance bias instead of position embeddings." } },
        { label: "Raffel et al. (2020), T5", url: "https://arxiv.org/abs/1910.10683", why: { de: "T5: relative Position Bias als Alternative.", en: "T5: relative position bias as an alternative." } }
      ]
    }
  ];

  var attentionSteps = DE ? [
    {
      kicker: "Attend",
      title: "Kontext zieht die Bank an seinen Platz",
      body: "Woher weiß ein Wort, welche Nachbarn wichtig sind? Self-Attention lässt jedes Token die anderen lesen, entscheiden, welche zählen, und ihre Information in den eigenen Vektor ziehen. So bewegt sich „Bank“ in Richtung Geld oder Park. Klicke ein beliebiges Wort an, um seine Zeile zu sehen. Ein echter Layer hat viele Heads; die Demo zeigt einen.",
      watch: "Klicke ein Wort an. Welche Nachbarn bekommen Aufmerksamkeit?",
      demoState: { scene: "attention", context: "none" },
      context: "Ohne eindeutigen Kontext bleibt die Bank in der Mitte, mehrdeutig. Mit Geld oder Park verschiebt sich der Vektor. Das obere Dreieck in der Matrix ist die kausale Maske: Jedes Token sieht nur die Vergangenheit, damit das Modell lernt, Sätze zu vervollständigen, deren Ende es noch nicht kennt. Das gilt für generative Modelle. Modelle, die fertigen Text bewerten, brauchen keine kausale Maske und dürfen beide Richtungen sehen.",
      deep: "Ein echter Head berechnet Query-, Key- und Value-Vektoren, macht aus den Skalarprodukten mit Softmax Gewichte und summiert die Values. Die Demo zeigt die Bewegung, nicht die volle Rechnung.",
      boxes: [
        box("att-1", "Technik", "Warum drei Vektoren?", "Weil Suchen und Beschreiben zwei verschiedene Rollen sind. Ein Pronomen kann nach einem Nomen suchen, ohne selbst wie ein Nomen auszusehen."),
        box("att-2", "Mathematik", "Warum Softmax?", "Softmax macht aus Scores eine Verteilung: positiv, summiert zu 1, Reihenfolge bleibt. Deshalb ist Attention ein endliches Budget."),
        box("att-3", "Budget", "Ein Head, ein Budget", "Jede Zeile hat genau 1,00 zu vergeben. Mehr für ein Token heißt weniger für alle anderen. Viele Heads haben getrennte Budgets."),
        box("att-mis", "Grenze", "Ist Attention eine Datenbank?", "Nein. Attention schlägt keine Fakten nach. Es berechnet Gewichte über Value-Vektoren und mischt sie zu einer neuen Repräsentation. Das Ergebnis ist keine gespeicherte Zeile, sondern eine kontextabhängige Mischung.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } }, { label: "Bahdanau et al. (2014), Neural Machine Translation", url: "https://arxiv.org/abs/1409.0473", why: { de: "Attention in der neuronalen Übersetzung vor dem Transformer.", en: "Attention in neural translation before the transformer." } }]
    },
    {
      kicker: "Der Kontext",
      title: "Attention verschiebt Bedeutungen in Kontexte",
      body: "Drei Sätze, dasselbe Wort: Bank ohne Kontext, Bank für Geld, Bank im Park. Klicke einen Satz und ein Wort. Die Matrix zeigt, wohin die Bank schaut; die Formel zeigt dieselben Gewichte. Drücke Weiter: Die nächste Folie zeigt, wie dieselbe Bedeutung in Code-Oberflächen aussieht.",
      watch: "Klicke die drei Sätze. Welches Wort zieht die Bank? Drücke danach Weiter.",
      demoState: { scene: "attention", context: "money" },
      context: "Der Kontext verschiebt den Vektor, nicht das Wort. Die Bank bleibt dasselbe Token; ihre Nachbarn ändern ihre Bedeutung.",
      deep: "Attention mischt Information aus dem Kontext. Bei „Geld“ zeigt die Bank-Zeile auf Geld, bei „Park“ auf Park. Die Gewichte sind ein Routing-Signal, keine Definition.",
      boxes: [
        box("att-4", "Grenze", "Was zeigt Attention nicht?", "Nicht, was das FFN mit der Information macht. Sie zeigt nur, welche Tokens auf dieser Schicht Information austauschen."),
        box("att-5", "Mathematik", "Die Formel", "Attention bildet aus Query, Key und Value eine gewichtete Summe. Die Softmax-Zeile summiert zu 100 %.", "\\underbrace{x'}_{\\substack{\\text{neuer Vektor}\\\\ \\text{für } i}} = \\underbrace{\\sum_j \\underbrace{\\alpha_{ij}}_{\\substack{\\text{Gewicht von } j\\\\ \\text{für } i}} \\underbrace{v_j}_{\\text{Value von } j}}_{\\substack{\\text{gewichtete Summe}\\\\ \\sum_j \\alpha_{ij}=100\\%}}"),
        box("att-heads", "Technik", "Mehrere Heads", "Ein echter Layer hat viele Heads. Jeder kann dieselben Tokens aus einer anderen Perspektive sehen: Pronomen, Verb, Thema. Die Struktur ist geteilt, die Parameter sind pro Head gelernt."),
        box("att-causal", "Optional", "Causal Mask", "Das obere Dreieck in der Matrix ist die kausale Maske. Sie sorgt dafür, dass Tokens nur die Vergangenheit sehen können, damit sie lernen, Sätze zu vervollständigen, deren Ende sie noch nicht kennen. Generative Modelle brauchen sie. Modelle, die fertigen Text bewerten, brauchen sie nicht und dürfen in beide Richtungen schauen.", "", "causal", "nur vergangene Tokens beachten"),
        box("att-kv", "Optional", "KV-Cache", "Beim Generieren muss das Modell die Keys und Values der bisherigen Tokens nicht neu berechnen, wenn es sie im KV-Cache behält. Es berechnet nur die neuen Keys/Values und lässt das neue Query gegen die gespeicherten Keys laufen. Die wiederholte K/V-Projektion wächst ohne Cache quadratisch mit der Sequenz und mit Cache nur linear; die Attention-Scores selbst bleiben quadratisch (Shazeer, 2019).")
      ],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } },
        { label: "Bahdanau et al. (2014), Neural Machine Translation", url: "https://arxiv.org/abs/1409.0473", why: { de: "Attention in der neuronalen Übersetzung vor dem Transformer.", en: "Attention in neural translation before the transformer." } },
        { label: "Shazeer (2019), Fast Transformer Decoding", url: "https://arxiv.org/abs/1911.02150", why: { de: "Inkrementelles Decoding mit gespeicherten Keys und Values.", en: "Incremental decoding with cached keys and values." } },
        { label: "Attention als Graph (interaktive Zusatzseite)", url: "../test/attention_as_graph.html", why: { de: "Interaktive Zusatzseite zur Attention-Grafik.", en: "Interactive companion page for the attention graph." } }
      ]
    },
    {
      kicker: "Rauschen",
      title: "Attention reduziert Rauschen",
      body: "Wörter allein sind mehrdeutig. „new“ kann in der Nähe von „car“ und von „Stadt“ liegen; „york“ allein sagt wenig. Zusammen mit „york“ wird aus „new“ die Stadt New York. Attention gewichtet die Nachbarn: Die Nachbarschaft zieht „new“ und „york“ in Richtung „Stadt“ und schwächt „car“ und „England“ ab. Die Mehrdeutigkeit wird zum Signal, das die KI mit dem Kontext auflöst.",
      watch: "Schiebe den Kontext-Regler. Wann gewinnt Stadt gegen car?",
      demoState: { scene: "noise", layer: 0 },
      context: "Attention verschiebt nicht die Wörter selbst, sondern ihre gelesene Bedeutung. Die Nachbarschaft entscheidet, welche Bedeutung zählt; die frühen Layer richten den Vektor daran aus.",
      deep: "Das ist eine didaktische Vereinfachung. Ein echter Head addiert Value-Vektoren mit gelernten Gewichten; die Winkel und Positionen sind von Hand gewählt. Die Quelle deckt die frühe sprachliche Verarbeitung, nicht die konkreten Demo-Positionen.",
      boxes: [
        box("noise-1", "Beispiel", "Was heißt new allein?", "„new“ bedeutet „neu“, kann aber auch der Anfang von „New York“ sein. Erst das zweite Wort entscheidet, welche Lesart gilt."),
        box("noise-2", "Technik", "Wie wirkt die Nachbarschaft?", "Die Nachbarschaft gewichtet die Umgebung: „york“ macht die Stadt Lesart stärker, „car“ und „England“ verlieren an Gewicht. So reduziert Attention die Mehrdeutigkeit, statt sie zu verstärken.")
      ],
      sources: [{ label: "Tenney et al. (2019), BERT Rediscovers the Classical NLP Pipeline", url: "https://aclanthology.org/P19-1356/", why: { de: "BERT-Schichten zeigen eine linguistische Pipeline.", en: "BERT layers reveal a linguistic pipeline." } }]
    },
    {
      kicker: "Die Matrix",
      title: "Die kausale Matrix und die Heads",
      body: "In einer Schicht schaut Self-Attention auf den ganzen Kontext. Für jedes Token bewertet sie, wie viel es von jedem anderen sichtbaren Token übernehmen soll. Die Scores bilden eine Token-für-Token-Matrix: eine Zeile für das fragende Token, eine Spalte für das antwortende. Die Kausalmaske verbirgt die Zukunft.",
      watch: "Klicke die Matrix an. Welche Zellen sind maskiert?",
      demoState: { scene: "stack", mode: "layer" },
      context: "Jede Zeile summiert zu 1. Ein Token kann auf sich und frühere Tokens achten, nie auf spätere. Das obere Dreieck ist maskiert.",
      deep: "Attention wählt seine Gewichte nicht aus einer festen Liste. Es lernt aus dem Loss, welche Aspekte der sichtbaren Tokens helfen. Jeder Head kann dieselben Tokens aus einer anderen Perspektive sehen: Pronomen, Verb, Thema.",
      boxes: [
        box("st-5", "Geschichte", "Borges, Funes", "„Denken heißt Unterschiede vergessen, verallgemeinern, abstrahieren.“ Funes erinnert sich an alles und kann deshalb nicht denken. Ein LLM macht dasselbe auf zwei Ebenen: Das Modell speichert nicht jeden Fakt, und ein Head muss nicht alles auf einmal repräsentieren."),
        box("st-6", "Technik", "Lokale Bedeutung, dann Kontext", "Frühe Schichten lernen lokale Muster. Spätere Schichten kombinieren sie mit einem breiteren Kontext. Jede Schicht hat eigene Gewichte; die Struktur ist geteilt, die Parameter nicht."),
        box("st-7", "Mathematik", "Unembedding", "p(next | context) = softmax(W_U h_last). Der letzte Vektor zeigt auf eine Region von Token-Richtungen, dann wird eines gezogen.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } }, { label: "Borges (1942), Funes el memorioso", url: "https://bvpadreseijas.files.wordpress.com/2013/05/funeselmemorioso.pdf", why: { de: "Funes als Bild für Vergessen, Abstraktion und Denken.", en: "Funes as an image of forgetting, abstraction, and thought." } }]
    }
  ] : [
    {
      kicker: "Attend",
      title: "Context pulls the bank into place",
      body: "How does a word know which neighbours matter? Self-attention lets each token look at the others, decide which matter, and pull their information into its vector. That is how “bank” moves toward the money or park reading. Click any word to see its row. A real layer has many heads; the demo shows one.",
      watch: "Click a word. Which neighbours receive attention?",
      demoState: { scene: "attention", context: "none" },
      context: "With no unambiguous context, the bank stays in the middle, ambiguous. With money or park, the vector shifts. The upper triangle in the matrix is the causal mask: each token sees only the past, so the model learns to complete sentences whose end it does not yet know. That applies to generative models. Models that score finished text need no causal mask and may look in both directions.",
      deep: "A real head computes query, key, and value vectors, turns their dot products into weights with softmax, and sums the values. The demo shows the movement, not the full arithmetic.",
      boxes: [
        box("att-1", "Technique", "Why three vectors?", "Because searching and describing are two different roles. A pronoun can look for a noun without itself looking like a noun."),
        box("att-2", "Mathematics", "Why softmax?", "Softmax turns scores into a distribution: positive, sum to one, order preserved. That is why attention is a finite budget."),
        box("att-3", "Budget", "One head, one budget", "Every row has exactly 1.00 to give. More for one token means less for the others. Many heads have separate budgets."),
        box("att-mis", "Limit", "Is attention a database?", "No. Attention does not look up facts. It computes weights over value vectors and mixes them into a new representation. The result is not a stored row but a context-dependent mixture.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } }, { label: "Bahdanau et al. (2014), Neural Machine Translation", url: "https://arxiv.org/abs/1409.0473", why: { de: "Attention in der neuronalen Übersetzung vor dem Transformer.", en: "Attention in neural translation before the transformer." } }]
    },
    {
      kicker: "The context",
      title: "Attention shifts meaning into context",
      body: "Three sentences, one word: a bank without context, a bank for money, a bank in the park. Click a sentence and a word. The matrix shows where the bank looks; the formula shows the same weights. Press Next: the next slide shows how the same meaning appears in code surfaces.",
      watch: "Click the three sentences. Which word pulls the bank? Then press Next.",
      demoState: { scene: "attention", context: "money" },
      context: "The context shifts the vector, not the word. The bank stays the same token; its neighbours change what it means.",
      deep: "Attention mixes information from the context. With “money” the bank row points to money, with “park” to park. The weights are a routing signal, not a definition.",
      boxes: [
        box("att-4", "Limit", "What does attention not show?", "Not what the FFN does with the information. It shows only which tokens exchange information on this layer."),
        box("att-5", "Mathematics", "The formula", "Attention builds a weighted sum from query, key, and value. The softmax row sums to 100%.", "\\underbrace{x'}_{\\substack{\\text{new vector}\\\\ \\text{for } i}} = \\underbrace{\\sum_j \\underbrace{\\alpha_{ij}}_{\\substack{\\text{weight of } j\\\\ \\text{for } i}} \\underbrace{v_j}_{\\text{value of } j}}_{\\substack{\\text{weighted sum}\\\\ \\sum_j \\alpha_{ij}=100\\%}}"),
        box("att-heads", "Technique", "Several heads", "A real layer has many heads. Each can look at the same tokens from a different perspective: pronoun, verb, topic. The structure is shared; the parameters are learned per head."),
        box("att-causal", "Optional", "Causal mask", "The upper triangle in the matrix is the causal mask. It makes tokens see only the past, so they learn to complete sentences whose end they do not yet know. Generative models need it. Models that score finished text do not, and may look in both directions.", "", "causal", "attend only to past tokens"),
        box("att-kv", "Optional", "KV cache", "During generation the model does not have to recompute the keys and values of earlier tokens if it keeps them in the KV cache. It computes only the new keys/values and lets the new query run against the cached keys. Without the cache the repeated K/V projection grows quadratically with the sequence; with the cache it grows linearly. The attention scores themselves stay quadratic (Shazeer, 2019).")
      ],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } },
        { label: "Bahdanau et al. (2014), Neural Machine Translation", url: "https://arxiv.org/abs/1409.0473", why: { de: "Attention in der neuronalen Übersetzung vor dem Transformer.", en: "Attention in neural translation before the transformer." } },
        { label: "Shazeer (2019), Fast Transformer Decoding", url: "https://arxiv.org/abs/1911.02150", why: { de: "Inkrementelles Decoding mit gespeicherten Keys und Values.", en: "Incremental decoding with cached keys and values." } },
        { label: "Attention as a graph (interactive companion page)", url: "../test/attention_as_graph.html", why: { de: "Interaktive Zusatzseite zur Attention-Grafik.", en: "Interactive companion page for the attention graph." } }
      ]
    },
    {
      kicker: "Noise",
      title: "Attention reduces noise",
      body: "Words alone are ambiguous. “new” can sit near “car” and near “city”; “york” alone says little. Together with “york”, “new” becomes New York. Attention weights the neighbours: the neighbourhood pulls “new” and “york” toward “city” and weakens “car” and “England”. The ambiguity becomes a signal that the model resolves with context.",
      watch: "Move the context slider. When does city win against car?",
      demoState: { scene: "noise", layer: 0 },
      context: "Attention does not move the words themselves; it moves their read meaning. The neighbourhood decides which meaning counts; early layers align the vector with it.",
      deep: "This is a didactic simplification. A real head adds value vectors with learned weights; the angles and positions are chosen by hand. The source covers early linguistic processing, not the concrete demo positions.",
      boxes: [
        box("noise-1", "Example", "What does new mean alone?", "“new” means “not old”, but it can also be the first half of “New York”. Only the second word decides which reading applies."),
        box("noise-2", "Technique", "How does the neighbourhood work?", "The neighbourhood weights the surroundings: “york” strengthens the city reading, while “car” and “England” lose weight. Attention reduces the ambiguity instead of amplifying it.")
      ],
      sources: [{ label: "Tenney et al. (2019), BERT Rediscovers the Classical NLP Pipeline", url: "https://aclanthology.org/P19-1356/", why: { de: "BERT-Schichten zeigen eine linguistische Pipeline.", en: "BERT layers reveal a linguistic pipeline." } }]
    },
    {
      kicker: "The matrix",
      title: "The causal matrix and the heads",
      body: "Inside a layer, self-attention looks at the whole context. For every token, it scores how much that token should take from every other visible token. The scores form a token-by-token matrix: one row for the token asking, one column for the token answering. The causal mask hides the future.",
      watch: "Click the matrix. Which cells are masked?",
      demoState: { scene: "stack", mode: "layer" },
      context: "Every row sums to one. A token can attend to itself and earlier tokens, never to later ones. The upper triangle is masked.",
      deep: "Attention does not choose its weights from a fixed list. It learns from the loss which aspects of the visible tokens help. Each head can look at the same tokens from a different perspective: pronoun, verb, topic.",
      boxes: [
        box("st-5", "History", "Borges, Funes", "“To think is to forget a difference, to generalize, to abstract.” Funes remembers everything and therefore cannot think. An LLM does the same at two scales: the model does not store every fact, and a head does not need to represent everything at once."),
        box("st-6", "Technique", "Local meaning, then context", "Early layers learn local patterns. Later layers combine them with a wider context. Each layer has its own weights; the structure is shared, the parameters are not."),
        box("st-7", "Mathematics", "Unembedding", "p(next | context) = softmax(W_U h_last). The last vector points to a region of token directions, then one is drawn.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } }, { label: "Borges (1942), Funes el memorioso", url: "https://bvpadreseijas.files.wordpress.com/2013/05/funeselmemorioso.pdf", why: { de: "Funes als Bild für Vergessen, Abstraktion und Denken.", en: "Funes as an image of forgetting, abstraction, and thought." } }]
    }
  ];

  var ffnSteps = DE ? [
    {
      kicker: "Feed-forward",
      title: "Ein Muster passt, ein Wert wird geschrieben",
      body: "Das FFN ist ein kleines MLP pro Token: Dense, Aktivierung, Dense. Es hebt den Vektor in einen höheren Raum, trennt die Muster und projiziert zurück. Attention mischt Tokens; das FFN trennt die verworrenen Strukturen innerhalb eines Tokens. Klicke die beiden Kontexte und biege den Raum, bis eine Ebene trennt.",
      watch: "Klicke die Kontexte. Welche Muster feuern? Biege den Raum, bis die Ebene trennt.",
      demoState: { scene: "ffn", mode: "fruit" },
      context: "Das FFN ist ein MLP: Dense, Aktivierung, Dense. Es arbeitet auf jedem Token einzeln. Seine Rolle im LLM: verworrene Muster trennbar machen.",
      deep: "Ein echtes FFN hat keine beschrifteten Keys. Die Muster sind gelernte Richtungen in W₁; der Pull ist eine gelernte Richtung in W₂. Die Demo zeigt die Idee, nicht die exakten Gewichte.",
      boxes: [
        box("ffn-1", "Mathematik", "Die Dense-Einheit", "dense(x) = activation(Wx + b). Das FFN ist dense₂(activation(dense₁(x))). Die Aktivierung bringt die Nichtlinearität."),
        box("ffn-2", "Technik", "Warum das FFN?", "Attention bewegt Information zwischen Tokens. Das FFN ist ein MLP pro Token und trennt Muster, die sonst verworren bleiben. Beide zusammen bilden einen Block."),
        box("ffn-3", "Verbindung", "Ist das ein MLP?", "Ja. Das FFN ist dense₂(activation(dense₁(x))). Es arbeitet auf jedem Token einzeln und macht verworrene Strukturen trennbar. Attention liefert den Kontext; das FFN formt ihn."),
        box("ffn-4", "Geometrie", "Ist der reichere Vektor hochdimensional?", "Ja. Jeder Punkt in diesen Demos steht für einen Vektor mit Tausenden Dimensionen. Die zwei oder drei Achsen sind nur eine Projektion für uns; das FFN rechnet im vollen Raum. Die Muster in W₁ und der Pull in W₂ sind Richtungen in diesem hochdimensionalen Raum.")
      ],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } },
        { label: "Geva et al. (2021), Transformer Feed-Forward Layers Are Key-Value Memories", url: "https://arxiv.org/abs/2010.01019", why: { de: "FFN-Schichten als Key-Value-Gedächtnis.", en: "FFN layers as key-value memory." } }
      ]
    }
  ] : [
    {
      kicker: "Feed-forward",
      title: "A pattern matches, a value is written",
      body: "The FFN is a small MLP per token: dense, activation, dense. It lifts the vector into a higher space, separates the patterns, and projects back. Attention mixes tokens; the FFN separates the entangled structures inside one token. Click the two contexts and bend the space until a plane separates them.",
      watch: "Click the contexts. Which patterns fire? Bend the space until the plane separates them.",
      demoState: { scene: "ffn", mode: "fruit" },
      context: "The FFN is an MLP: dense, activation, dense. It works on each token separately. Its role in the LLM: make entangled patterns separable.",
      deep: "A real FFN has no labelled keys. The patterns are learned directions in W₁; the pull is a learned direction in W₂. The demo shows the idea, not the exact weights.",
      boxes: [
        box("ffn-1", "Mathematics", "The dense unit", "dense(x) = activation(Wx + b). The FFN is dense₂(activation(dense₁(x))). The activation supplies the nonlinearity."),
        box("ffn-2", "Technique", "Why the FFN?", "Attention moves information between tokens. The FFN is an MLP per token and separates patterns that would otherwise stay entangled. Together they form one block."),
        box("ffn-3", "Connection", "Is this an MLP?", "Yes. The FFN is dense₂(activation(dense₁(x))). It works on each token separately and makes entangled structures separable. Attention supplies the context; the FFN shapes it."),
        box("ffn-4", "Geometry", "Is the richer vector high-dimensional?", "Yes. Every point in these demos stands for a vector with thousands of dimensions. The two or three axes are only a projection for us; the FFN computes in the full space. The patterns in W₁ and the pull in W₂ are directions in that high-dimensional space.")
      ],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } },
        { label: "Geva et al. (2021), Transformer Feed-Forward Layers Are Key-Value Memories", url: "https://arxiv.org/abs/2010.01019", why: { de: "FFN-Schichten als Key-Value-Gedächtnis.", en: "FFN layers as key-value memory." } }
      ]
    }
  ];

  var residualSteps = DE ? [
    {
      kicker: "Residual",
      title: "Das gemeinsame Notizbuch wird zum Stream",
      body: "Das ist eine stark vereinfachte, vermenschlichte Sichtweise. Stell dir den Residual Stream als Notizbuch vor: Jede Schicht liest den aktuellen Stand und schreibt ihre Beobachtung dazu; nichts wird gelöscht. Drücke Weiter: Erst füllt sich das Notizbuch, dann wächst aus denselben Updates der Stream. Attention und FFN lesen den Stream und addieren ihr Update; die Dimension bleibt gleich.",
      watch: "Drücke Weiter: erst füllt sich das Notizbuch, dann wächst der Stream.",
      demoState: { scene: "residual" },
      context: "Die Notizbuch-Analogie ist eine stark vereinfachte, vermenschlichte Sichtweise. Mathematisch ist der Stream ein Vektor pro Token; jede Schicht addiert ein Update: x ← x + Layer(x). Frühere Notizen bleiben lesbar, weil addiert und nicht überschrieben wird.",
      deep: "Die Addition gibt dem Gradienten einen kurzen Pfad zurück. Ohne Residualverbindung müsste jede Schicht die gesamte Information neu schreiben. Der Stream ist das gemeinsame Notizbuch; Attention und FFN schreiben Updates hinein; die Identität bleibt erhalten.",
      boxes: [
        box("res-nb", "Mathematik", "Das Notizbuch", "x₁ = x₀ + Layer(x₀). Die Identität bleibt; jede Schicht addiert nur ihre Änderung. Gelesen wird immer der aktuelle Stand.", "\\underbrace{x_1}_{\\text{neu}} = \\underbrace{x_0}_{\\text{alt}} + \\underbrace{\\operatorname{Layer}(x_0)}_{\\text{Notiz der Schicht}}"),
        box("res-1", "Mathematik", "Warum Addition?", "x ← x + f(x). Die Identität bleibt erhalten; die Schicht lernt nur die Änderung. Das macht tiefe Stapel trainierbar."),
        box("res-2", "Grenze", "Was ist das nicht?", "Kein Speicher im Sinne einer Datenbank und keine wörtliche Expertenrunde. Der Stream ist ein Vektor pro Token, der durch die Schichten getragen wird.")
      ]
    }
  ] : [
    {
      kicker: "Residual",
      title: "The shared notebook becomes the stream",
      body: "This is a strongly simplified, humanised view. Think of the residual stream as a notebook: every layer reads the current state and writes its observation into it; nothing is erased. Press Next: first the notebook fills, then the stream grows from the same updates. Attention and the FFN read the stream and add their update; the dimension stays the same.",
      watch: "Press Next: first the notebook fills, then the stream grows.",
      demoState: { scene: "residual" },
      context: "The notebook analogy is a strongly simplified, humanised view. Mathematically the stream is one vector per token; every layer adds an update: x ← x + Layer(x). Earlier notes stay readable because the layer adds instead of overwriting.",
      deep: "The addition gives gradients a short path back. Without a residual connection, every layer would have to rewrite all information. The stream is the shared notebook; attention and the FFN write updates into it; the identity survives.",
      boxes: [
        box("res-nb", "Mathematics", "The notebook", "x₁ = x₀ + Layer(x₀). The identity stays; every layer adds only its change. Each layer reads the current state.", "\\underbrace{x_1}_{\\text{new}} = \\underbrace{x_0}_{\\text{old}} + \\underbrace{\\operatorname{Layer}(x_0)}_{\\text{layer's note}}"),
        box("res-1", "Mathematics", "Why addition?", "x ← x + f(x). The identity stays; the layer learns only the change. That makes deep stacks trainable."),
        box("res-2", "Limit", "What is it not?", "Not a database and not a literal panel of experts. The stream is one vector per token carried through the layers.")
      ]
    }
  ];

  var residualNotebookStep = DE ? {
    kicker: "Notizbuch",
    title: "Das gemeinsame Notizbuch",
    body: "Stell dir den Residual Stream als gemeinsames Notizbuch vor: Jede Schicht ist eine Reihe von Experten, die lesen und ihre Erkenntnisse dazuschreiben; nichts wird gelöscht. Drücke Weiter: Schicht für Schicht kommen Markierungen dazu. Am Ende steht das Wissen aller Schichten.",
    watch: "Drücke Weiter. Was schreibt jede Schicht dazu?",
    demoState: { scene: "residual", phase: "notebook" },
    context: "Die Analogie: Ein Notizbuch wird weitergereicht und ergänzt. Jede Schicht liest den aktuellen Stand und addiert ihre Notiz. Am Ende steht das Wissen aller Schichten.",
    deep: "Mathematisch: x₁ = x₀ + Layer(x₀). Die Identität bleibt; die Schicht lernt nur die Änderung. Deshalb lassen sich tiefe Stapel trainieren.",
    boxes: [
      box("res-nb-1", "Mathematik", "Das Notizbuch", "x₁ = x₀ + Layer(x₀). Die Identität bleibt; jede Schicht addiert nur ihre Änderung. Gelesen wird immer der aktuelle Stand.", "\\underbrace{x_1}_{\\text{neu}} = \\underbrace{x_0}_{\\text{alt}} + \\underbrace{\\operatorname{Layer}(x_0)}_{\\text{Notiz der Schicht}}"),
      box("res-nb-2", "Grenze", "Was ist das nicht?", "Kein Datenbankspeicher. Der Stream ist ein Vektor pro Token, der durch die Schichten getragen wird; Attention und FFN schreiben Updates hinein.")
    ],
    sources: []
  } : {
    kicker: "Notebook",
    title: "The shared notebook",
    body: "Think of the residual stream as a shared notebook: every layer is a row of experts who read it and write their insights into it; nothing is erased. Press Next: layer by layer, more marks appear. At the end the notebook holds the knowledge of all layers.",
    watch: "Press Next. What does each layer add?",
    demoState: { scene: "residual", phase: "notebook" },
    context: "The analogy: a notebook is passed on and extended. Every layer reads the current state and adds its note. At the end it holds the knowledge of all layers.",
    deep: "Mathematically: x₁ = x₀ + Layer(x₀). The identity stays; the layer learns only the change. That is why deep stacks can be trained.",
    boxes: [
      box("res-nb-1", "Mathematics", "The notebook", "x₁ = x₀ + Layer(x₀). The identity stays; every layer adds only its change. Each layer reads the current state.", "\\underbrace{x_1}_{\\text{new}} = \\underbrace{x_0}_{\\text{old}} + \\underbrace{\\operatorname{Layer}(x_0)}_{\\text{layer's note}}"),
      box("res-nb-2", "Limit", "What is this not?", "Not a database. The stream is one vector per token carried through the layers; attention and the FFN write updates into it.")
    ],
    sources: []
  };

  var meadowSteps = DE ? [
    {
      kicker: "Die Wiese",
      title: "Die Karte der Wörter",
      body: "Jedes Wort besitzt eine Zelle. Bewege den Zeiger; der Gedanke fällt in die nächste Zelle. Die goldenen Nähte sind die Stellen, an denen zwei Wörter fast gleich nah sind. Je mehr Wörter, desto kleiner die Zellen, aber die Naht verschwindet nie.",
      watch: "Bewege den Zeiger. Wann sind zwei Wörter fast gleich wahrscheinlich?",
      demoState: { scene: "meadow" },
      context: "Nähe zum Zentrum ist Wahrscheinlichkeit. Am Rand und an der Naht ist die Entscheidung unsicher; mehr Wörter machen die Zellen feiner, nicht die Unsicherheit null.",
      deep: "In einem echten Modell hat der Raum Tausende Dimensionen und das Vokabular Zehntausende Tokens. Die Wiese ist eine Projektion auf zwei Achsen; die Nähte sind die Grenzen zwischen benachbarten Token-Regionen.",
      boxes: [
        box("md-1", "Mathematik", "Was ist eine Voronoi-Zelle?", "Die Menge aller Punkte, die einem Wort näher sind als jedem anderen. Die Grenze zwischen zwei Zellen ist die Menge der Punkte mit gleichem Abstand."),
        box("md-2", "Technik", "Was machen Temperatur und Top-k?", "Temperatur macht die Auswahl breiter oder schärfer. Top-k begrenzt die Auswahl auf die k nächsten Wörter. Beides verändert die Verteilung, nicht die Karte."),
        box("md-3", "Geometrie", "Großkreis und Naht", "Der letzte Vektor zeigt auf eine Region von Token-Richtungen. Nahe einer Naht sind zwei Wörter fast gleich wahrscheinlich. Mehr Tokens verkleinern die Zellen, aber die Nähte schließen sich nie. Mabrok (2026) nennt das Band um eine Naht die Expressibility Gap.")
      ],
      sources: [{ label: "Mabrok (2026), arXiv:2603.22301", url: "https://arxiv.org/abs/2603.22301", why: { de: "Quelle der zugehörigen Aktivierungs-/Geometrie-Aussagen.", en: "Source for the related activation/geometry claims." } }]
    }
  ] : [
    {
      kicker: "The meadow",
      title: "The map of words",
      body: "Every word owns a cell. Move the pointer; the thought falls into the nearest cell. The golden seams are where two words are almost equally near. More words make smaller cells, but the seam never disappears.",
      watch: "Move the pointer. When are two words almost equally likely?",
      demoState: { scene: "meadow" },
      context: "Closeness to the centre is probability. At the edge and on a seam the decision is uncertain; more words make the cells finer, not the uncertainty zero.",
      deep: "In a real model the space has thousands of dimensions and the vocabulary tens of thousands of tokens. The meadow is a projection onto two axes; the seams are the borders between neighbouring token regions.",
      boxes: [
        box("md-1", "Mathematics", "What is a Voronoi cell?", "The set of all points closer to one word than to every other. The border between two cells is the set of points at equal distance."),
        box("md-2", "Technique", "What do temperature and top-k do?", "Temperature makes the choice wider or sharper. Top-k limits it to the k nearest words. Both change the distribution, not the map."),
        box("md-3", "Geometry", "Great circle and seam", "The final vector points to a region of token directions. Near a seam two words are almost equally likely. More tokens shrink the cells, but the seams never close. Mabrok (2026) calls the band around a seam the expressibility gap.")
      ],
      sources: [{ label: "Mabrok (2026), arXiv:2603.22301", url: "https://arxiv.org/abs/2603.22301", why: { de: "Quelle der zugehörigen Aktivierungs-/Geometrie-Aussagen.", en: "Source for the related activation/geometry claims." } }]
    }
  ];

  var softmaxSteps = DE ? [
    {
      kicker: "Softmax",
      title: "Von Logits zu einer Verteilung",
      body: "Echte GPT-2-small-Scores für zwei Prompts. Links steht der rohe Logit aus dem Skalarprodukt, rechts das, was Softmax daraus macht. Wechsle den Kontext und beobachte, wie sich die ganze Verteilung verschiebt. Die Temperatur entscheidet, wie scharf der Gewinner bevorzugt wird.",
      watch: "Fahre über ein Token und ändere die Temperatur. Was ändert sich, was bleibt?",
      demoState: { scene: "softmax" },
      context: "Softmax erzeugt nicht die Reihenfolge; die Skalarprodukte tun das. Es macht aus Scores eine Verteilung, die zu eins summiert.",
      deep: "Warum exp und nicht Logit durch Summe? Logits können negativ sein. Die Exponentialfunktion macht jeden Wert positiv und erhält die Reihenfolge; die Division durch die Summe ergibt Wahrscheinlichkeiten. Der absolute Offset ist willkürlich; Softmax hängt nur von Unterschieden ab.",
      boxes: [
        box("sm-1", "Mathematik", "Die Formel", "p_i = exp(z_i) / Σ_j exp(z_j). Vorher wird oft das Maximum abgezogen, damit die Exponentialfunktion stabil bleibt."),
        box("sm-2", "Temperatur", "Was macht T?", "p_i ∝ exp(z_i / T). T < 1 schärft, T > 1 flacht ab. Die Rangfolge bleibt, die Masse verschiebt sich."),
        box("sm-mis", "Grenze", "Erzeugt Softmax das Ranking?", "Nein. Die Reihenfolge kommt aus den Logits. Softmax macht aus Scores eine positive Verteilung, die zu 1 summiert; Temperatur ändert die Schärfe, nicht die Reihenfolge.")
      ],
      sources: [{ label: "Transformer Explainer (Polo Club, Georgia Tech)", url: "https://poloclub.github.io/transformer-explainer/", why: { de: "Interaktive Quelle für die GPT-2-Logits und Softmax-Demo.", en: "Interactive source for the GPT-2 logits and softmax demo." } }]
    }
  ] : [
    {
      kicker: "Softmax",
      title: "From logits to a distribution",
      body: "Real GPT-2 small scores for two prompts. The left side is the raw logit from the dot product, the right side is what softmax makes of it. Switch the context and watch the whole distribution shift. Temperature decides how sharply the winner is favoured.",
      watch: "Hover a token and change the temperature. What changes, what stays?",
      demoState: { scene: "softmax" },
      context: "Softmax does not create the ranking; the dot products do. It turns scores into a distribution that sums to one.",
      deep: "Why exp and not logit divided by the sum? Logits can be negative. The exponential makes every value positive and preserves the order; dividing by the sum gives probabilities. The absolute offset is arbitrary; softmax depends only on differences.",
      boxes: [
        box("sm-1", "Mathematics", "The formula", "p_i = exp(z_i) / Σ_j exp(z_j). The maximum is often subtracted first so the exponential stays stable."),
        box("sm-2", "Temperature", "What does T do?", "p_i ∝ exp(z_i / T). T < 1 sharpens, T > 1 flattens. The ranking stays, the mass shifts."),
        box("sm-mis", "Limit", "Does softmax create the ranking?", "No. The order comes from the logits. Softmax turns scores into a positive distribution that sums to 1; temperature changes the sharpness, not the order.")
      ],
      sources: [{ label: "Transformer Explainer (Polo Club, Georgia Tech)", url: "https://poloclub.github.io/transformer-explainer/", why: { de: "Interaktive Quelle für die GPT-2-Logits und Softmax-Demo.", en: "Interactive source for the GPT-2 logits and softmax demo." } }]
    }
  ];

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
        box("book-taxonomy", "Beispiel", "Taxonomie als Kompression", "Hauskatze und Löwe werden zu Katzenartige, dann zu Säugetiere, Wirbeltiere, Bilaterien, Tiere, Eukaryoten, Lebewesen. Auf jeder Stufe bleiben weniger Unterschiede übrig, aber die Gruppe deckt mehr Fälle ab. Ganz oben steht Seiendes: Erst dort tauchen auch Gegenstände, die Zahl 7, mathematische Tatsachen, Gedanken und Träume auf.")
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
        box("book-taxonomy", "Example", "Taxonomy as compression", "House cat and lion become cats, then mammals, vertebrates, bilaterians, animals, eukaryotes, living things. At each level fewer differences survive, but the group covers more cases. At the very top is what exists: only there do objects, the number 7, mathematical facts, thoughts, and dreams appear.")
      ],
      sources: [
        { label: "Borges (1942), Funes el memorioso", url: "https://bvpadreseijas.files.wordpress.com/2013/05/funeselmemorioso.pdf", why: { de: "Funes als Bild für Erinnern ohne Abstraktion.", en: "Funes as an image of memory without abstraction." } },
        { label: "Lindsey et al. (2025), On the Biology of a Large Language Model", url: "https://transformer-circuits.pub/2025/attribution-graphs/biology.html", why: { de: "Planung und innere Zwischenschritte im Modell.", en: "Planning and internal intermediate steps in the model." } },
        { label: "Li et al. (2022), Othello-GPT", url: "https://arxiv.org/abs/2210.13382", why: { de: "Ein Weltmodell aus reinen Zugfolgen.", en: "A world model learned from move sequences alone." } }
      ]
    }
  ];

  var insideSteps = DE ? [

    {
      kicker: "1 Neuron",
      title: "Was sind neuronale Netze?",
      body: "Ein neuronales Netz ist zuerst eine parametrisierte Funktion. Das kleinste Beispiel ist ein Neuron: ŷ = w·x + b. Es hat zwei Parameter und kann nur eine Gerade zeichnen. Die Demo zeigt genau das: Die Gerade passt sich an die Punkte an, aber sie kann den Sinus nicht biegen. Die vertikalen Striche sind die Fehler. Im nächsten Schritt wird aus diesen Fehlern eine Loss-Landschaft.",
      watch: "Starte das Training. Wie reagiert die Gerade? Warum bleiben die Fehler groß?",
      demoState: { scene: "model", phase: "linear" },
      context: "Der Loss wird nur auf den Trainingspunkten berechnet. Außerhalb gibt es keine Daten; die Kurve ist eine Extrapolation.",
      deep: "Ein Neuron rechnet z = w x + b. Die Gerade hat nur zwei Parameter. Sie kann eine nichtlineare Funktion nicht approximieren, egal wie lange sie trainiert. Erst Aktivierungen und mehrere Schichten erzeugen Knicke und Kurven.",
      boxes: [
        box("mod-0", "Idee", "Was ist ein Modell?", "Ein Modell ist eine parametrisierte Funktion, die aus Eingaben Ausgaben schätzt. Beim Training werden die Parameter so angepasst, dass die Ausgaben zu den Daten passen."),
        box("mod-layer", "Mathematik", "Das Neuron", "Ein Input, ein Neuron: z = w x + b; a = activation(z); Ausgabe = v a + c. w, b, v und c sind Parameter. Mehr Neuronen und Schichten komponieren solche Funktionen.", "\\underbrace{z}_{\\text{Input des Neurons}} = \\underbrace{w x + b}_{\\text{lineare Schicht}} \\qquad \\underbrace{a}_{\\text{Aktivierung}} = \\underbrace{\\operatorname{activation}(z)}_{\\text{Knick oder Kurve}}"),
        box("mod-line", "Grenze", "Warum reicht eine Gerade nicht?", "Ein einzelnes Neuron ist eine lineare Funktion. Es kann den Sinus nicht biegen, egal wie lange es trainiert. Erst die Aktivierung zwischen mehreren Schichten erzeugt Knicke und Kurven."),
        box("mod-loss", "Mathematik", "Was ist der Loss?", "Der Loss misst den Abstand zwischen Modell und Daten. Beim quadratischen Fehler wird jeder Abstand quadriert, gemittelt und minimiert. Training sucht Parameter, die diesen Wert senken.", "\\underbrace{L(\\theta)}_{\\text{Loss}} = \\underbrace{\\frac{1}{n}\\sum_{i=1}^{n}(\\hat y_i - y_i)^2}_{\\text{mittlerer quadratischer Fehler}}"),
        box("mod-train", "Technik", "Wie wird trainiert?", "Der Gradient zeigt, wie der Loss auf jede Parameteränderung reagiert. Ein Optimierer geht in die Gegenrichtung. Die Lernrate bestimmt die Schrittweite."),
        box("mod-extra", "Grenze", "Warum außerhalb falsch?", "Im Trainingsbereich gibt es Daten. Außerhalb extrapoliert das Netz. Ein kleiner Trainings-Loss garantiert keine gute Extrapolation.")
      ],
      sources: [
        { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0", why: { de: "Gradienten und Backpropagation für mehrschichtige Netze.", en: "Gradients and backpropagation for multilayer networks." } },
        { label: "Cauchy (1847), Méthode générale", url: "https://gallica.bnf.fr/ark:/12148/bpt6k2982c/f540.item", why: { de: "Frühe Beschreibung des steilsten Abstiegs.", en: "Early description of steepest descent." } }
      ]
    },
    {
      kicker: "Die Bausteine",
      title: "Die Bausteine eines LLM",
      body: "Ein neuronales Netz ist der gelernte Teil eines modernen LLM. Ein LLM ist eine Kette von Ebenen, keine einzelne Zauberformel. Gehe die fünf Ebenen mit „Weiter“ durch: Daten, Tokenizer, Embedding, Transformer-Blöcke und Unembedding. Die Transformer-Blöcke werden dutzende bis hunderte Male wiederholt; links siehst du die Ebene, rechts, was sie tut. Die Daten stehen am Anfang; der Tokenizer zerlegt sie. Später gehen wir die einzelnen Bestandteile genauer durch.",
      watch: "Gehe die Ebenen mit „Weiter“ oder der Pfeiltaste durch. Was macht jede Ebene?",
      demoState: { scene: "blocks" },
      context: "Die Reihenfolge ist die Architektur: Text → Tokens → Vektoren → Transformer-Blöcke → Verteilung. Jeder Schritt verändert die Darstellung, bis am Ende ein Token gezogen wird.",
      deep: "Jeder Block ist selbst ein gelerntes Stück Funktion. Zusammen approximieren sie die viel zu komplizierte Funktion „nächstes Token aus Kontext“.",
      boxes: [
        box("mod-1", "Technik", "Die fünf Ebenen", "Daten: Text und Mischung. Tokenizer: Text → Tokens. Embedding: Tokens → Vektoren. Transformer-Blöcke: erst Attention, dann FFN, dutzende bis hunderte Male wiederholt. Unembedding: Vektor → Scores und Softmax."),
        box("mod-dense", "Optional", "Dense = alle mit allen", "Eine Dense-Schicht verbindet jede Eingabe mit jeder Ausgabe. Die Gewichte sind die Kanten eines vollständigen gewichteten Graphen. In der Matrix W steht W_ij für die Kante von Eingang j zu Ausgang i. Daher kommen die üblichen Netzdiagramme.", "\\underbrace{y_i}_{\\text{Ausgang }i} = \\underbrace{\\sum_j W_{ij} x_j + b_i}_{\\text{alle Eingänge}}"),
        box("mod-norm", "Technik", "LayerNorm und andere Blöcke", "Ein echter Transformer-Block enthält zusätzlich LayerNorm, Residualverbindungen und mehrere Attention-Heads. Es gibt auch andere Architekturen und Details wie Mixture-of-Experts, Multi-Query-Attention und verschiedene Positionsverfahren. Wir lassen sie hier weg, um bei der Intuition zu bleiben."),
        box("mod-angle", "Mathematik", "Warum Winkel?", "Am Ende werden Richtungen verglichen, nicht Längen. Der Winkel zwischen zwei Vektoren ändert sich in hohen Dimensionen weniger stark als ihre Länge. Deshalb ist die Großkreis-Metrik hier nützlich; für den Einstieg reicht die Intuition."),
        box("in-13", "Grenze", "Was heißt plausibel?", "Plausibel heißt: Die Fortsetzung kam im Trainingstext vor. Es heißt nicht, dass das Modell eine eigene Vorstellung von Wahrheit hat."),
        box("mod-extra", "Grenze", "Was fehlt hier?", "Es gibt weitere Architekturen und Details, die wir hier nicht besprechen: Mixture-of-Experts, andere Normalisierungen, Multi-Query-Attention, verschiedene Positionsverfahren und viele Trainingstricks. Hier geht es nur um die Intuition.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } }]
    }
  ] : [
    {
      kicker: "1 neuron",
      title: "What are neural networks?",
      body: "A neural network is first a parameterised function. The smallest example is one neuron: ŷ = w·x + b. It has two parameters and can draw only a straight line. The demo shows exactly that: the line adapts to the points, but it cannot bend the sine. The vertical strokes are the errors. In the next step those errors become a loss landscape.",
      watch: "Start training. How does the line react? Why do the errors stay large?",
      demoState: { scene: "model", phase: "linear" },
      context: "The loss is computed only on the training points. Outside there is no data; the curve is an extrapolation.",
      deep: "One neuron computes z = w x + b. The line has only two parameters. It cannot approximate a nonlinear function, no matter how long it trains. Only activations and several layers create bends and curves.",
      boxes: [
        box("mod-0", "Idea", "What is a model?", "A model is a parameterised function that estimates outputs from inputs. Training adjusts the parameters so that the outputs fit the data."),
        box("mod-layer", "Mathematics", "The neuron", "One input, one neuron: z = w x + b; a = activation(z); output = v a + c. w, b, v, and c are parameters. More neurons and layers compose such functions.", "\\underbrace{z}_{\\text{input to the neuron}} = \\underbrace{w x + b}_{\\text{linear layer}} \\qquad \\underbrace{a}_{\\text{activation}} = \\underbrace{\\operatorname{activation}(z)}_{\\text{bend or curve}}"),
        box("mod-line", "Limit", "Why is a line not enough?", "A single neuron is a linear function. It cannot bend the sine, no matter how long it trains. Only the activation between several layers creates bends and curves."),
        box("mod-loss", "Mathematics", "What is the loss?", "The loss measures the distance between model and data. With squared error, every gap is squared, averaged, and minimised. Training looks for parameters that lower this value.", "\\underbrace{L(\\theta)}_{\\text{loss}} = \\underbrace{\\frac{1}{n}\\sum_{i=1}^{n}(\\hat y_i - y_i)^2}_{\\text{mean squared error}}"),
        box("mod-train", "Technique", "How is it trained?", "The gradient shows how the loss reacts to every parameter change. An optimiser moves in the opposite direction. The learning rate sets the step size."),
        box("mod-extra", "Limit", "Why wrong outside?", "Inside the training range there is data. Outside the network extrapolates. A small training loss does not guarantee good extrapolation.")
      ],
      sources: [
        { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0", why: { de: "Gradienten und Backpropagation für mehrschichtige Netze.", en: "Gradients and backpropagation for multilayer networks." } },
        { label: "Cauchy (1847), Méthode générale", url: "https://gallica.bnf.fr/ark:/12148/bpt6k2982c/f540.item", why: { de: "Frühe Beschreibung des steilsten Abstiegs.", en: "Early description of steepest descent." } }
      ]
    },
    {
      kicker: "The building blocks",
      title: "The building blocks of an LLM",
      body: "A neural network is the learned part of a modern LLM. An LLM is a chain of levels, not a single magic formula. Walk through the five levels with “Next”: data, tokenizer, embedding, transformer blocks, and unembedding. The transformer blocks repeat dozens to hundreds of times; the level is on the left, what it does on the right. The data come first; the tokenizer splits them. Later we go through the individual components in more detail.",
      watch: "Walk through the levels with “Next” or the arrow key. What does each level do?",
      demoState: { scene: "blocks" },
      context: "The order is the architecture: text → tokens → vectors → transformer blocks → distribution. Each step changes the representation until a token is drawn.",
      deep: "Each block is itself a learned piece of function. Together they approximate the far too complicated function “next token from context”.",
      boxes: [
        box("mod-1", "Technique", "The five levels", "Data: text and mix. Tokenizer: text → tokens. Embedding: tokens → vectors. Transformer blocks: attention first, then FFN, repeated dozens to hundreds of times. Unembedding: vector → scores and softmax."),
        box("mod-dense", "Optional", "Dense = all to all", "A dense layer connects every input to every output. The weights are the edges of a complete weighted graph. In the matrix W, W_ij is the edge from input j to output i. That is where the usual network diagrams come from.", "\\underbrace{y_i}_{\\text{output }i} = \\underbrace{\\sum_j W_{ij} x_j + b_i}_{\\text{all inputs}}"),
        box("mod-norm", "Technique", "LayerNorm and other blocks", "A real transformer block also contains LayerNorm, residual connections, and several attention heads. There are further architectures and details such as mixture-of-experts, multi-query attention, and different positional schemes. We leave them out here to keep the intuition in focus."),
        box("mod-angle", "Mathematics", "Why angles?", "At the end, directions are compared, not lengths. The angle between two vectors changes less in high dimensions than their length. That is why the great-circle metric is useful here; for a first pass the intuition is enough."),
        box("in-13", "Limit", "What does plausible mean?", "Plausible means the continuation occurred in the training text. It does not mean the model has its own notion of truth."),
        box("mod-extra", "Limit", "What is missing here?", "There are further architectures and details we do not cover here: mixture-of-experts, other normalisations, multi-query attention, different positional schemes, and many training tricks. This page is about the intuition.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } }]
    }
  ];

  var manifoldSteps = DE ? [
    {
      kicker: "Die Übertragung",
      title: "Von Beziehungen zur Übersetzung",
      body: "Beziehungen untereinander können Bedeutung enthalten. Zwei Punktwolken zeigen dieselben Wörter in Englisch und Japanisch. Die Form entsteht aus den Punkten: Zwei Punkte werden verbunden, wenn ihr Abstand unter einer Schwelle liegt (Vietoris–Rips). Drehe, rotiere und verschiebe die japanische Wolke, bis sie auf der englischen liegt: Dann sitzt jedes Wort auf seiner Übersetzung, allein durch seine Position. Einige Ankerwörter sind in beiden Sprachen beschriftet; über jeden Punkt kannst du mit der Maus fahren, um mehr zu sehen. Klicke „Übersetzung finden“ oder „Weiter“, um die Translation und Rotation zu finden.",
      watch: "Drehe, rotiere und verschiebe die japanische Wolke. Fahre über die Punkte, um die Wörter zu sehen. Klicke „Übersetzung finden“ oder „Weiter“.",
      demoState: { scene: "manifold" },
      context: "Die Demo ist stark vereinfacht: zwei Punktwolken, viele Wörter, saubere Kanten. Die echte Geometrie hat Tausende Dimensionen und überlappende Beziehungen; der Vietoris–Rips-Komplex macht nur die Nachbarschaften sichtbar.",
      deep: "Eine Mannigfaltigkeit ist lokal flach und global gekrümmt. Die Übersetzung entspricht einer Abbildung zwischen zwei solchen Flächen. Hier ist die Abbildung eine Kombination aus Drehung, Rotation und Translation: Wenn beide Wolken zur Deckung kommen, liegen die Wörter ihrer Bedeutung nach übereinander.",
      boxes: [
        box("man-1", "Technik", "Was zeigt die Demo?", "Zwei Punktwolken für Englisch und Japanisch. Innerhalb jeder Wolke sind Punkte verbunden, wenn ihr Abstand unter der Schwelle liegt; gestrichelte Linien markieren Wortkorrespondenzen. Du kannst die Ansicht drehen und zoomen, die japanische Wolke drehen, rotieren und verschieben und mit der Maus über jeden Punkt fahren."),
        box("man-2", "Grenze", "Was ist vereinfacht?", "Die Punktwolken sind klein und die Wörter sauber platziert. Ein echtes Embedding hat Tausende Dimensionen und viele überlappende Beziehungen; die Kanten zeigen nur eine Nachbarschaft, nicht die ganze Geometrie."),
        box("man-3", "Grenze", "Wie echt ist die Übersetzung?", "Die Demo zeigt eine Idee, keine Messung. Ein echtes Modell lernt die Abbildung aus Text; die Formen sind abstrakt und für Menschen schwer zu sehen."),
        box("man-4", "Mathematik", "Was ist eine Mannigfaltigkeit?", "Eine Mannigfaltigkeit ist ein Raum, der lokal wie R^n aussieht: Jeder Punkt hat eine Karte, die eine Umgebung auf eine offene Menge im R^n abbildet, und die Karten wechseln glatt. Global kann der Raum gekrümmt sein, zum Beispiel eine Kugel oder ein Torus. Der Vietoris–Rips-Komplex ist eine diskrete Näherung: Er verbindet Punkte bis zu einem Radius und macht so Nachbarschaften sichtbar.")
      ],
      sources: [{ label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781", why: { de: "word2vec: gelernte Wortvektoren und Vektorarithmetik.", en: "word2vec: learned word vectors and vector arithmetic." } }, { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/", why: { de: "GloVe: globale Kookkurrenz als Wortvektoren.", en: "GloVe: global co-occurrence as word vectors." } }, { label: "Conneau et al. (2018), Word Translation Without Parallel Data", url: "https://arxiv.org/abs/1710.04087", why: { de: "Übertragung zwischen Worträumen ohne parallele Daten.", en: "Transport between word spaces without parallel data." } }, { label: "Morris (2007), Topology Without Tears", url: "https://archive.org/details/topbook", why: { de: "Topologische Grundlage für Mannigfaltigkeiten.", en: "Topological background for manifolds." } }]
    }
  ] : [
    {
      kicker: "Transport",
      title: "From relations to translation",
      body: "Relations among each other can carry meaning. Two point clouds show the same words in English and Japanese. The shape comes from the points: two points are connected when their distance is below a threshold (Vietoris–Rips). Rotate, roll, and translate the Japanese cloud until it sits on the English one: then every word sits on its translation, from position alone. A few anchor words are labelled in both languages; hover over any point to see more. Click “Find translation” or “Next” to find the rotation and translation.",
      watch: "Rotate, roll, and translate the Japanese cloud. Hover the points to see the words. Click “Find translation” or “Next”.",
      demoState: { scene: "manifold" },
      context: "The demo is strongly simplified: two point clouds, many words, clean edges. The real geometry has thousands of dimensions and overlapping relations; the Vietoris–Rips complex only makes neighbourhoods visible.",
      deep: "A manifold is locally flat and globally curved. Translation corresponds to a map between two such surfaces. Here the map combines yaw, roll, and translation: when the clouds coincide, words of the same meaning lie on top of each other.",
      boxes: [
        box("man-1", "Technique", "What does the demo show?", "Two point clouds for English and Japanese. Inside each cloud, points are connected when their distance is below the threshold; dashed lines mark word correspondences. You can rotate and zoom the view, yaw, roll, and translate the Japanese cloud, and hover over every point."),
        box("man-2", "Limit", "What is simplified?", "The point clouds are small and the words are neatly placed. A real embedding has thousands of dimensions and many overlapping relations; the edges show one neighbourhood, not the whole geometry."),
        box("man-3", "Limit", "How real is the translation?", "The demo shows an idea, not a measurement. A real model learns the map from text; the shapes are abstract and hard for humans to see."),
        box("man-4", "Mathematics", "What is a manifold?", "A manifold is a space that locally looks like R^n: every point has a chart that maps a neighbourhood onto an open set in R^n, and the charts change smoothly. Globally the space can be curved, for example a sphere or a torus. The Vietoris–Rips complex is a discrete approximation: it connects points up to a radius and makes neighbourhoods visible.")
      ],
      sources: [{ label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781", why: { de: "word2vec: gelernte Wortvektoren und Vektorarithmetik.", en: "word2vec: learned word vectors and vector arithmetic." } }, { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/", why: { de: "GloVe: globale Kookkurrenz als Wortvektoren.", en: "GloVe: global co-occurrence as word vectors." } }, { label: "Conneau et al. (2018), Word Translation Without Parallel Data", url: "https://arxiv.org/abs/1710.04087", why: { de: "Übertragung zwischen Worträumen ohne parallele Daten.", en: "Transport between word spaces without parallel data." } }, { label: "Morris (2007), Topology Without Tears", url: "https://archive.org/details/topbook", why: { de: "Topologische Grundlage für Mannigfaltigkeiten.", en: "Topological background for manifolds." } }]
    }
  ];

  var mlpSteps = DE ? [
    {
      kicker: "Raum biegen",
      title: "Was sind neuronale Netze?",
      body: "Neuronale Netze können mehr als Geraden. Dasselbe Prinzip kann den Raum falten: Eine Schicht hebt die Punkte in eine höhere Dimension, eine Aktivierung biegt sie, und eine flache Ebene trennt die Klassen. Im LLM macht das FFN pro Token genau diese Art von Biegung.",
      demoState: { scene: "mlp" },
      context: "Die Biegung ist eine Dense-Schicht: Sie hebt die Punkte in eine zusätzliche Dimension, bis ein flacher Schnitt reicht.",
      deep: "Das ist keine Animation über den Daten, sondern eine Animation der Daten selbst: Jeder Punkt behält seine Nachbarschaft, während der Raum sich krümmt. Die Form hängt von Gewichten, Bias und Aktivierung ab.",
      boxes: [
        box("mlp-1", "Mathematik", "Die Dense-Schicht", "x = (x₁, x₂), h = act(W₁x + b₁), z = W₂h + b₂. Die Schicht dehnt auf n verborgene Werte, biegt jeden mit einer Aktivierung und projiziert auf eine Höhe."),
        box("mlp-2", "Grenze", "Warum sieht man das im LLM nicht?", "Weil die Räume zu hochdimensional sind. Die Demo ist eine Projektion auf drei Achsen. Ein echtes Modell arbeitet mit Tausenden Dimensionen.")
      ],
      sources: [{ label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355", why: { de: "Origami in N dimensions: Grundlage für die MLP-Biege-Demo.", en: "Origami in N dimensions: background for the MLP bending demo." } }]
    }
  ] : [
    {
      kicker: "Bending space",
      title: "What are neural networks?",
      body: "Neural networks can do more than straight lines. The same principle can fold space: a layer lifts the points into a higher dimension, an activation bends them, and a flat plane separates the classes. In an LLM the FFN performs exactly this kind of bend per token.",
      demoState: { scene: "mlp" },
      context: "The bend is a dense layer: it lifts the points into an extra dimension until a flat cut is enough.",
      deep: "This is not an animation over the data; it is an animation of the data itself. Every point keeps its neighbourhood while the space bends. The shape depends on weights, bias, and activation.",
      boxes: [
        box("mlp-1", "Mathematics", "The dense layer", "x = (x₁, x₂), h = act(W₁x + b₁), z = W₂h + b₂. The layer expands to n hidden values, bends each with an activation, and projects to one height."),
        box("mlp-2", "Limit", "Why don't we see this in an LLM?", "Because the spaces are too high-dimensional. The demo is a projection onto three axes. A real model works with thousands of dimensions.")
      ],
      sources: [{ label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355", why: { de: "Origami in N dimensions: Grundlage für die MLP-Biege-Demo.", en: "Origami in N dimensions: background for the MLP bending demo." } }]
    }
  ];

  var stackSteps = [];

  var trajectorySteps = DE ? [
    {
      kicker: "GPT-2",
      title: "Token-Trajektorien durch GPT-2",
      body: "Echte Hidden States aus GPT-2 small für „The capital of France is“. Jede Linie folgt einem Token durch das Embedding und 12 Blöcke. Jeder Zustand hat 768 Dimensionen, zu viele für ein Bild, deshalb ist das nicht die echte Bewegung: PCA behält die drei Richtungen, in denen sich die Zustände am stärksten ändern, und flacht alles darauf ab. Die 3D-Punkte sind ein Schatten. Die Top-Vorhersage ist „ the“ (Leerzeichen plus the), aber „Paris“ liegt schon in der Nähe, obwohl es erst nach dem Leerzeichen käme. Das sind echte Messungen aus GPT-2 small, keine erfundenen Punkte.",
      watch: "Bewege den Layer-Regler. Ab wann wird „Paris“ die Top-Wahl?",
      demoState: { scene: "trajectories" },
      context: "Die Winkelansicht ist der Standard. Das ist eine andere Metrik als der gewohnte euklidische Abstand: Das Modell vergleicht am Ende Richtungen, nicht Längen, deshalb ist der Großkreis hier relevant. „Plausibel“ heißt: Die Fortsetzung ist im Trainingstext häufig, nicht dass sie wahr ist.",
      deep: "Linien, die sich auf dem Bildschirm kreuzen, müssen sich im vollen Raum nicht berühren. Eine flach aussehende Biegung kann eine große Bewegung verbergen. Die Kandidaten erscheinen erst in der letzten Schicht.",
      boxes: [
        box("traj-1", "Technik", "Was ist PCA?", "PCA projiziert die 768-dimensionalen Zustände auf die drei Richtungen mit der größten Varianz. Das ist eine lesbare Projektion, keine vollständige Rekonstruktion."),
        box("traj-2", "Grenze", "Was zeigt die Linie nicht?", "Sie zeigt nicht den echten Weg im 768-dimensionalen Raum. Sie zeigt einen Schatten, der die größten Änderungen sichtbar macht."),
        box("traj-3", "Metrik", "Warum Winkel statt Euklid?", "Am Ende zählt die Richtung des Zustands im Vektorraum, nicht seine Länge. Die Winkelansicht projiziert die Punkte auf die Einheitskugel und misst den Großkreis. Das ist eine andere Metrik als der gewohnte euklidische Abstand.")
      ],
      sources: [{ label: "Radford et al. (2019), GPT-2", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", why: { de: "GPT-2: byte-level BPE und die hier gezeigten Hidden States.", en: "GPT-2: byte-level BPE and the hidden states shown here." } }]
    }
  ] : [
    {
      kicker: "GPT-2",
      title: "Token trajectories through GPT-2",
      body: "Real hidden states from GPT-2 small for “The capital of France is”. Each line follows one token through the embedding and 12 blocks. Each state has 768 dimensions, too many to picture, so this is not the real motion: PCA keeps the three directions where the states change most and flattens everything onto them. The 3D points are a shadow. The top prediction is “ the” (space plus the), but “Paris” is already nearby, even though it would only come after the space. These are real measurements from GPT-2 small, not invented points.",
      watch: "Move the layer slider. When does “Paris” become the top choice?",
      demoState: { scene: "trajectories" },
      context: "The angular view is the default. This is a different metric from the usual Euclidean distance: at the end the model compares directions, not lengths, so the great circle is relevant here. “Plausible” means the continuation is frequent in the training text, not that it is true.",
      deep: "Lines that cross on screen need not touch in the full space. A flat-looking bend can hide a large move. The candidates appear only at the final layer.",
      boxes: [
        box("traj-1", "Technique", "What is PCA?", "PCA projects the 768-dimensional states onto the three directions with the most variance. It is a readable projection, not a complete reconstruction."),
        box("traj-2", "Limit", "What does the line not show?", "It does not show the real path in the 768-dimensional space. It shows a shadow that makes the largest changes visible."),
        box("traj-3", "Metric", "Why angles instead of Euclid?", "At the end, the direction of the state in the vector space matters, not its length. The angle view projects the points onto the unit sphere and measures the great circle. That is a different metric from the usual Euclidean distance.")
      ],
      sources: [{ label: "Radford et al. (2019), GPT-2", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", why: { de: "GPT-2: byte-level BPE und die hier gezeigten Hidden States.", en: "GPT-2: byte-level BPE and the hidden states shown here." } }]
    }
  ];

  var wholeSteps = [];

  var activationSteps = DE ? [
    {
      kicker: "Aktivierung",
      title: "Was sind neuronale Netze?",
      body: "Eine Nichtlinearität wird nach der Projektion auf jede Koordinate angewendet. ReLU faltet bei null; Sigmoid und tanh biegen glatt; GELU ist glatt, aber nicht monoton. Der Knick ist das, was einen geraden Schnitt durch etwas führt, das vorher untrennbar war. Ohne Knick bleibt Tiefe wirkungslos: Zwei Dense-Schichten kollabieren zu einer Matrix.",
      watch: "Klicke die Funktionen. Wo ist der Knick, wo ist die Kurve glatt?",
      demoState: { scene: "activation" },
      context: "Ohne Aktivierung ist ein tiefes Netz nur eine andere Matrix. Die Aktivierung nach jeder Schicht bricht die lineare Komposition.",
      deep: "ReLU ist nicht injektiv: Alle negativen Eingaben landen bei 0. Dieser Informationsverlust kann beim Entwirren helfen. Glatte Aktivierungen bleiben für endliche Eingaben umkehrbar; Sättigung und niedrige Präzision können auch sie zu einer Treppe machen.",
      boxes: [
        box("act-1", "Beispiel", "2 Eingänge, 2 Ausgänge", "W = [[1,2],[0,-1]], x = (3,1), b = (0,-2). Wx = (5,-1), z = (5,-3), ReLU(z) = (5,0). Jede Ausgabe ist ein Skalarprodukt plus Bias, dann die Aktivierung.", "\\begin{aligned} W &= \\begin{pmatrix} 1 & 2 \\\\ 0 & -1 \\end{pmatrix}, \\quad x = \\begin{pmatrix} 3 \\\\ 1 \\end{pmatrix}, \\quad b = \\begin{pmatrix} 0 \\\\ -2 \\end{pmatrix} \\\\ Wx &= \\begin{pmatrix} 5 \\\\ -1 \\end{pmatrix}, \\quad z = Wx+b = \\begin{pmatrix} 5 \\\\ -3 \\end{pmatrix} \\\\ \\operatorname{ReLU}(z) &= \\begin{pmatrix} 5 \\\\ 0 \\end{pmatrix} \\end{aligned}"),
        box("act-2", "Ohne Knick", "Zwei Dense-Schichten ohne Nichtlinearität", "dense₂(dense₁(x)) = W₂(W₁x+b₁)+b₂ = (W₂W₁)x + (W₂b₁+b₂). Zwei lineare Schichten kollabieren zu einer. Tiefe bringt ohne Aktivierung keine zusätzliche Ausdruckskraft.", "\\begin{aligned} \\operatorname{dense}_2(\\operatorname{dense}_1(x)) &= W_2(W_1 x + b_1) + b_2 \\\\ &= (W_2 W_1)x + (W_2 b_1 + b_2) \\\\ &= Wx + b \\end{aligned}"),
        box("act-collapse", "Mathematik", "Tiefe ohne Knick", "Die Komposition zweier linearer Schichten ist wieder eine einzige lineare Schicht. Erst die Aktivierung zwischen ihnen macht aus dem Stapel eine neue Funktion. Deshalb ist die Nichtlinearität kein Detail, sondern der Grund, warum Tiefe überhaupt etwas hinzufügt.", "\\underbrace{\\operatorname{dense}_2(\\operatorname{dense}_1(x))}_{\\text{zwei Schichten}} = \\underbrace{(W_2W_1)x + (W_2b_1+b_2)}_{\\text{eine Schicht}}"),
        box("act-3", "Formeln", "Die vier Funktionen", "ReLU(x) = max(0,x). tanh(x) = (e^{2x} − 1)/(e^{2x} + 1). sigmoid(x) = 1/(1+e^{−x}). GELU ist ein glatter Durchlass, der kleine negative Werte noch passieren lässt."),
        box("act-4", "Satz", "Beliebig genau?", "Mit genügend Neuronen und einer nichtlinearen Aktivierung kann ein Netz jede stetige Funktion auf einem begrenzten Bereich beliebig genau annähern. Tiefe hilft, weil sie dieselbe Zahl von Neuronen effizienter nutzt.")
      ],
      sources: [{ label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355", why: { de: "Origami in N dimensions: Grundlage für die MLP-Biege-Demo.", en: "Origami in N dimensions: background for the MLP bending demo." } }, { label: "Cybenko (1989), Approximation by Superpositions of a Sigmoidal Function", url: "https://doi.org/10.1007/BF02551274", why: { de: "Universal Approximation für neuronale Netze.", en: "Universal approximation for neural networks." } }]
    }
  ] : [
    {
      kicker: "Activation",
      title: "What are neural networks?",
      body: "A nonlinearity is applied to each coordinate after the projection. ReLU folds at zero; sigmoid and tanh bend smoothly; GELU is smooth but not monotonic. The bend is what lets a straight cut pass through something that was inseparable before. Without a bend, depth does nothing: two dense layers collapse into one matrix.",
      watch: "Click the functions. Where is the bend, where is the curve smooth?",
      demoState: { scene: "activation" },
      context: "Without an activation, a deep network is just another matrix. The activation after each layer breaks the linear composition.",
      deep: "ReLU is not injective: all negative inputs land at 0. That loss of information can help untangle. Smooth activations stay invertible for finite inputs; saturation and low precision can turn even a smooth activation into a staircase.",
      boxes: [
        box("act-1", "Example", "2 inputs, 2 outputs", "W = [[1,2],[0,-1]], x = (3,1), b = (0,-2). Wx = (5,-1), z = (5,-3), ReLU(z) = (5,0). Each output is a dot product plus bias, then the activation.", "\\begin{aligned} W &= \\begin{pmatrix} 1 & 2 \\\\ 0 & -1 \\end{pmatrix}, \\quad x = \\begin{pmatrix} 3 \\\\ 1 \\end{pmatrix}, \\quad b = \\begin{pmatrix} 0 \\\\ -2 \\end{pmatrix} \\\\ Wx &= \\begin{pmatrix} 5 \\\\ -1 \\end{pmatrix}, \\quad z = Wx+b = \\begin{pmatrix} 5 \\\\ -3 \\end{pmatrix} \\\\ \\operatorname{ReLU}(z) &= \\begin{pmatrix} 5 \\\\ 0 \\end{pmatrix} \\end{aligned}"),
        box("act-2", "Without a bend", "Two dense layers without a nonlinearity", "dense₂(dense₁(x)) = W₂(W₁x+b₁)+b₂ = (W₂W₁)x + (W₂b₁+b₂). Two linear layers collapse into one. Depth adds no expressive power without an activation.", "\\begin{aligned} \\operatorname{dense}_2(\\operatorname{dense}_1(x)) &= W_2(W_1 x + b_1) + b_2 \\\\ &= (W_2 W_1)x + (W_2 b_1 + b_2) \\\\ &= Wx + b \\end{aligned}"),
        box("act-collapse", "Mathematics", "Depth without a bend", "The composition of two linear layers is again a single linear layer. Only the activation between them turns the stack into a new function. The nonlinearity is therefore not a detail: it is why depth adds anything at all.", "\\underbrace{\\operatorname{dense}_2(\\operatorname{dense}_1(x))}_{\\text{two layers}} = \\underbrace{(W_2W_1)x + (W_2b_1+b_2)}_{\\text{one layer}}"),
        box("act-3", "Formulas", "The four functions", "ReLU(x) = max(0,x). tanh(x) = (e^{2x} − 1)/(e^{2x} + 1). sigmoid(x) = 1/(1+e^{−x}). GELU is a smooth gate that still lets small negative values through."),
        box("act-4", "Theorem", "Arbitrarily close?", "With enough neurons and a nonlinear activation, a network can approximate any continuous function on a bounded region arbitrarily closely. Depth helps because it uses the same number of neurons more efficiently.")
      ],
      sources: [{ label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355", why: { de: "Origami in N dimensions: Grundlage für die MLP-Biege-Demo.", en: "Origami in N dimensions: background for the MLP bending demo." } }, { label: "Cybenko (1989), Approximation by Superpositions of a Sigmoidal Function", url: "https://doi.org/10.1007/BF02551274", why: { de: "Universal Approximation für neuronale Netze.", en: "Universal approximation for neural networks." } }]
    }
  ];

  var languageSteps = DE ? [
    {
      kicker: "Daten",
      title: "Woher kommen die Daten?",
      body: "Daten sind nicht exakt: Menschen beschreiben dieselbe Situation unterschiedlich, manchmal widersprüchlich. Über viele Beschreibungen hofft man, dass das reale Ergebnis durchscheint, wie bei Gauß. Ein Modell bekommt keine Sprachmodule. Es bekommt Text: viele Sprachen, viele Schriften, viel Unsinn, und davon enorm viel. Erst seit etwa 2016, dem Beginn der Zettabyte-Ära, standen zum ersten Mal mehr als ein Zettabyte digitale Daten zur Verfügung, also 10²¹ Byte. Diesen Text kuratiert man im besten Fall: Wikipedia ist schon gut gepflegt, peer-reviewte wissenschaftliche Paper sind noch besser. Auch sie können falsch sein, nur seltener. Menschen irren sich, Messungen haben Fehler, Menschen lügen. Die Idee ist, dass man über die Masse im Schnitt an die realen Daten herankommt: „Nil“ und „Ägypten“ liest man häufiger zusammen als „Nil“ und „Paraguay“, auch wenn im Internet jemand das Gegenteil behauptet. Im Plot unten liegen viele Beschreibungen um dieselbe Wahrheit; die meisten sind nah, ein falscher Satz ist weit weg. Klicke die Sprachen und vergleiche.",
      watch: "Klicke die Sprachen. Was bleibt gleich, was ändert sich?",
      demoState: { scene: "langdata" },
      context: "Die Schrift ändert die Tokens, nicht die Aufgabe. Manche Sprachen brauchen für denselben Inhalt mehr Tokens; der Tokenizer kann sie teurer machen (Petrov et al., 2023). Die Datenmischung von GPT-3 war 60 % Common Crawl, 22 % WebText2, 8 % Books1, 8 % Books2 und 3 % Wikipedia; die Werte sind gerundet (Brown et al., 2020, Tabelle 2.2).",
      deep: "Daten sind eine Designentscheidung. Filter, Dedupe und Decontamination entscheiden mit, was das Modell sieht (Lee et al., 2021). Seltene Sprachen und seltene Themen bleiben benachteiligt, auch wenn das Modell sie grundsätzlich verarbeiten kann. Die Menge hilft, aber sie garantiert keine Wahrheit: Ein häufiger Irrtum bleibt ein Irrtum. Im Schnitt nähert sich das Modell den realen Häufigkeiten an.",
      boxes: [
        box("lang-1", "Technik", "Warum mehrere Sprachen?", "Weil Text aus vielen Sprachen kommt. Ein multilinguales Modell teilt die Gewichte; gemeinsame Muster können zwischen Sprachen übertragen werden. Seltene Sprachen bleiben trotzdem benachteiligt, weil sie im Korpus seltener sind."),
        box("lang-2", "Grenze", "Was verrät die Mischung nicht?", "Nicht, wie gut eine Sprache gelernt wird. Menge, Qualität und Tokenizer zählen zusammen. Eine große Menge schlechter Daten ist kein Vorteil."),
        box("lang-3", "Daten", "Was wird gefiltert?", "Qualität, Duplikate und Benchmark-Leaks. Dedupe verhindert Auswendiglernen; Decontamination verhindert, dass Testfragen im Training landen."),
        box("lang-4", "Daten", "Wie viel Daten?", "Erst seit etwa 2016, dem Beginn der Zettabyte-Ära, standen mehr als ein Zettabyte digitale Daten zur Verfügung: 10²¹ Byte. Das ist die Größenordnung, aus der heutige Modelle schöpfen (Cisco, 2016)."),
        box("lang-5", "Daten", "Kuration und Fehler", "Wikipedia ist gut gepflegt; peer-reviewte Paper sind oft besser geprüft, aber auch sie können falsch sein. Menschen irren sich, Messungen haben Fehler, Menschen lügen. Über die Masse nähert sich das Modell den realen Häufigkeiten an: Nil und Ägypten kommen häufiger zusammen vor als Nil und Paraguay."),
        box("lang-7", "Daten", "Widersprüchliche Beschreibungen", "Menschen beschreiben dieselbe Situation oft anders, manchmal gegensätzlich. Ein einzelner Text kann irren; über viele Texte mitteln sich zufällige Fehler, und das reale Ergebnis scheint durch. Das ist dieselbe Hoffnung wie bei Gauß' verrauschten Beobachtungen."),
        box("lang-6", "Daten", "Die Mischung von GPT-3", "GPT-3 nannte 60 % Common Crawl, 22 % WebText2, 8 % Books1, 8 % Books2 und 3 % Wikipedia; die Werte sind gerundet (Brown et al., 2020, Tabelle 2.2).")
      ],
      sources: [
        { label: "Cisco (2016), The Zettabyte Era Officially Begins", url: "https://blogs.cisco.com/sp/the-zettabyte-era-officially-begins-how-much-is-that", why: { de: "Zettabyte-Ära seit 2016 und die Größenordnung 10²¹ Byte.", en: "Zettabyte era since 2016 and the 10²¹-byte scale." } },
        { label: "Brown et al. (2020), Language Models are Few-Shot Learners", url: "https://arxiv.org/abs/2005.14165", why: { de: "GPT-3-Datenmischung und Few-Shot-Ergebnisse.", en: "GPT-3 data mix and few-shot results." } },
        { label: "Petrov et al. (2023), Language Model Tokenizers Introduce Unfairness Between Languages", url: "https://arxiv.org/abs/2305.15425", why: { de: "Tokenisierung kann Sprachen unterschiedlich teuer machen.", en: "Tokenization can make languages differently expensive." } },
        { label: "Lee et al. (2021), Deduplicating Training Data Makes Language Models Better", url: "https://arxiv.org/abs/2107.06499", why: { de: "Deduplizierung verbessert Sprachmodelle.", en: "Deduplication improves language models." } }
      ]
    }
  ] : [
    {
      kicker: "Data",
      title: "Where does the data come from?",
      body: "Data are not exact: people describe the same situation differently, sometimes contradictorily. Across many descriptions one hopes that the real result shines through, as with Gauss. A model does not get language modules. It gets text: many languages, many scripts, plenty of nonsense, and an enormous amount of it. Only since about 2016, the beginning of the zettabyte era, has more than a zettabyte of digital data been available, that is 10²¹ bytes. In the best case this text is curated: Wikipedia is already well maintained, peer-reviewed scientific papers are even better. They can be wrong too, only less often. People make mistakes, measurements have errors, people lie. The idea is that through sheer mass the model approaches the real data on average: “Nile” and “Egypt” occur together more often than “Nile” and “Paraguay”, even if someone on the internet claims otherwise. In the plot below, many descriptions sit around the same truth; most are near, one false sentence is far away. Click the languages and compare.",
      watch: "Click the languages. What stays the same, what changes?",
      demoState: { scene: "langdata" },
      context: "The script changes the tokens, not the task. Some languages need more tokens for the same content; the tokenizer can make them more expensive (Petrov et al., 2023). GPT-3 reported 60% Common Crawl, 22% WebText2, 8% Books1, 8% Books2, and 3% Wikipedia; the values are rounded (Brown et al., 2020, Table 2.2).",
      deep: "Data is a design decision. Filtering, deduplication, and decontamination decide what the model sees (Lee et al., 2021). Rare languages and rare topics stay disadvantaged even when the model can process them in principle. Quantity helps, but it does not guarantee truth: a frequent error remains an error. On average the model approaches the real frequencies.",
      boxes: [
        box("lang-1", "Technique", "Why several languages?", "Because text comes in many languages. A multilingual model shares its weights; shared patterns can transfer between languages. Rare languages still stay disadvantaged because they are rarer in the corpus."),
        box("lang-2", "Limit", "What does the mix not tell you?", "Not how well a language is learned. Amount, quality, and tokenizer act together. A large amount of bad data is no advantage."),
        box("lang-3", "Data", "What is filtered?", "Quality, duplicates, and benchmark leaks. Dedupe prevents memorisation; decontamination prevents test questions from entering the training data."),
        box("lang-4", "Data", "How much data?", "Only since about 2016, the beginning of the zettabyte era, has more than a zettabyte of digital data been available: 10²¹ bytes. That is the scale from which today's models draw (Cisco, 2016)."),
        box("lang-5", "Data", "Curation and errors", "Wikipedia is well maintained; peer-reviewed papers are often checked better, but they can be wrong too. People make mistakes, measurements have errors, people lie. Through mass the model approaches the real frequencies: Nile and Egypt occur together more often than Nile and Paraguay."),
        box("lang-7", "Data", "Contradictory descriptions", "People often describe the same situation differently, sometimes in opposite ways. A single text can be wrong; across many texts random errors average out and the real result shines through. It is the same hope as with Gauss's noisy observations."),
        box("lang-6", "Data", "The GPT-3 mix", "GPT-3 reported 60% Common Crawl, 22% WebText2, 8% Books1, 8% Books2, and 3% Wikipedia; the values are rounded (Brown et al., 2020, Table 2.2).")
      ],
      sources: [
        { label: "Cisco (2016), The Zettabyte Era Officially Begins", url: "https://blogs.cisco.com/sp/the-zettabyte-era-officially-begins-how-much-is-that", why: { de: "Zettabyte-Ära seit 2016 und die Größenordnung 10²¹ Byte.", en: "Zettabyte era since 2016 and the 10²¹-byte scale." } },
        { label: "Brown et al. (2020), Language Models are Few-Shot Learners", url: "https://arxiv.org/abs/2005.14165", why: { de: "GPT-3-Datenmischung und Few-Shot-Ergebnisse.", en: "GPT-3 data mix and few-shot results." } },
        { label: "Petrov et al. (2023), Language Model Tokenizers Introduce Unfairness Between Languages", url: "https://arxiv.org/abs/2305.15425", why: { de: "Tokenisierung kann Sprachen unterschiedlich teuer machen.", en: "Tokenization can make languages differently expensive." } },
        { label: "Lee et al. (2021), Deduplicating Training Data Makes Language Models Better", url: "https://arxiv.org/abs/2107.06499", why: { de: "Deduplizierung verbessert Sprachmodelle.", en: "Deduplication improves language models." } }
      ]
    }
  ];

  var posttrainSteps = DE ? [
    {
      kicker: "Post-Training",
      title: "Vom Basismodell zum Assistenten",
      body: "Ein Basismodell setzt Text fort. Eine Anweisung beantwortet es nicht zuverlässig. SFT zeigt ihm gute Antworten; RLHF lernt aus menschlichen Vergleichen. Aus der Vorhersage wird ein Assistent. Klicke die drei Stufen und wähle eine Antwort.",
      watch: "Klicke Basismodell, SFT und RLHF. Welche Antwort würdest du wählen?",
      demoState: { scene: "posttrain", step: 0 },
      context: "Pretraining lernt aus Text. SFT lernt aus Beispielantworten. RLHF lernt aus Präferenzen: Menschen vergleichen zwei Antworten, ein Reward-Modell lernt daraus.",
      deep: "RLHF ist kein Verstehen. Es verschiebt die Verteilung in Richtung Antworten, die Menschen bevorzugen. Deshalb kann ein Modell hilfreicher und gleichzeitig falsch sein. Die Präferenzdaten sind ein Designentscheid.",
      boxes: [
        box("post-1", "Technik", "Was ist SFT?", "Supervised Fine-Tuning: Das Modell lernt auf Paaren aus Anweisung und guter Antwort. Es übernimmt Format und Stil, nicht automatisch neue Fakten."),
        box("post-2", "Technik", "Was ist RLHF?", "Menschen vergleichen Antworten; ein Reward-Modell lernt die Präferenz; die Policy wird so optimiert, dass sie höhere Belohnung bekommt."),
        box("post-3", "Grenze", "Was garantiert RLHF?", "Nicht Wahrheit. Es optimiert auf menschliche Präferenzen. Ein plausibler, selbstsicherer Ton kann belohnt werden, auch wenn der Inhalt falsch ist.")
      ],
      sources: [
        { label: "Ouyang et al. (2022), InstructGPT", url: "https://arxiv.org/abs/2203.02155", why: { de: "Instruction-Tuning und RLHF für Sprachmodelle.", en: "Instruction tuning and RLHF for language models." } },
        { label: "Christiano et al. (2017), Deep RL from Human Preferences", url: "https://arxiv.org/abs/1706.03741", why: { de: "Präferenzen als Trainingssignal.", en: "Preferences as a training signal." } }
      ]
    }
  ] : [
    {
      kicker: "Post-training",
      title: "From base model to assistant",
      body: "A base model continues text. It does not reliably answer an instruction. SFT shows it good answers; RLHF learns from human comparisons. Prediction becomes an assistant. Click the three stages and choose an answer.",
      watch: "Click base model, SFT, and RLHF. Which answer would you choose?",
      demoState: { scene: "posttrain", step: 0 },
      context: "Pretraining learns from text. SFT learns from example answers. RLHF learns from preferences: humans compare two answers, and a reward model learns from that.",
      deep: "RLHF is not understanding. It shifts the distribution toward answers people prefer. That is why a model can be more helpful and still wrong. Preference data is a design decision.",
      boxes: [
        box("post-1", "Technique", "What is SFT?", "Supervised fine-tuning: the model learns from instruction-answer pairs. It picks up format and style, not automatically new facts."),
        box("post-2", "Technique", "What is RLHF?", "Humans compare answers; a reward model learns the preference; the policy is optimised to receive a higher reward."),
        box("post-3", "Limit", "What does RLHF guarantee?", "Not truth. It optimises for human preferences. A plausible, confident tone can be rewarded even when the content is wrong.")
      ],
      sources: [
        { label: "Ouyang et al. (2022), InstructGPT", url: "https://arxiv.org/abs/2203.02155", why: { de: "Instruction-Tuning und RLHF für Sprachmodelle.", en: "Instruction tuning and RLHF for language models." } },
        { label: "Christiano et al. (2017), Deep RL from Human Preferences", url: "https://arxiv.org/abs/1706.03741", why: { de: "Präferenzen als Trainingssignal.", en: "Preferences as a training signal." } }
      ]
    }
  ];

  var evalSteps = DE ? [
    {
      kicker: "Evaluation",
      title: "Wie gut ist das Modell?",
      body: "Ein Loss sagt, wie gut das nächste Token passt. Ein Benchmark sagt, ob das Modell Aufgaben löst. Beides ist messbar, aber nicht dasselbe. Klicke eine Aufgabe und schalte die Kontamination um.",
      watch: "Klicke MMLU, HumanEval und GSM8K. Was misst der Score, was nicht?",
      demoState: { scene: "eval", task: 0 },
      context: "Ein hoher Score kann bedeuten, dass das Modell die Aufgabe versteht, oder dass der Test im Training war. Prüfe die Daten, nicht nur die Zahl.",
      deep: "Loss und Perplexity messen die Wahrscheinlichkeit von Testtext. Benchmarks messen Aufgaben. Kontamination, Formatierung und Auswertungsregeln können den Score verändern. Ein Benchmark ist ein Messinstrument, keine Definition von Intelligenz.",
      boxes: [
        box("eval-1", "Technik", "Was ist MMLU?", "Ein Multiple-Choice-Benchmark über viele Fächer. Er misst Faktenwissen und Schlussfolgern, nicht Alltagskönnen."),
        box("eval-2", "Technik", "Was ist HumanEval?", "Ein Code-Benchmark: Funktionen aus Docstrings schreiben; Unit-Tests prüfen die Ausführung."),
        box("eval-3", "Grenze", "Was ist Kontamination?", "Wenn Testaufgaben im Training waren, misst der Score teilweise Erinnerung statt Lösung. Ein hoher Score ist dann kein Beweis für Generalisierung.")
      ],
      sources: [
        { label: "Hendrycks et al. (2021), MMLU", url: "https://arxiv.org/abs/2009.03300", why: { de: "MMLU als Multi-Task-Benchmark.", en: "MMLU as a multi-task benchmark." } },
        { label: "Chen et al. (2021), HumanEval", url: "https://arxiv.org/abs/2107.03374", why: { de: "HumanEval prüft Code mit Unit-Tests.", en: "HumanEval checks code with unit tests." } }
      ]
    }
  ] : [
    {
      kicker: "Evaluation",
      title: "How good is the model?",
      body: "A loss says how well the next token fits. A benchmark says whether the model solves tasks. Both are measurable, but they are not the same. Click a task and toggle contamination.",
      watch: "Click MMLU, HumanEval, and GSM8K. What does the score measure, and what does it not?",
      demoState: { scene: "eval", task: 0 },
      context: "A high score can mean the model understands the task, or that the test was in training. Check the data, not only the number.",
      deep: "Loss and perplexity measure the probability of test text. Benchmarks measure tasks. Contamination, formatting, and scoring rules can change the score. A benchmark is a measuring instrument, not a definition of intelligence.",
      boxes: [
        box("eval-1", "Technique", "What is MMLU?", "A multiple-choice benchmark across many subjects. It measures factual knowledge and reasoning, not everyday skill."),
        box("eval-2", "Technique", "What is HumanEval?", "A code benchmark: write functions from docstrings; unit tests check execution."),
        box("eval-3", "Limit", "What is contamination?", "If test items were in training, the score partly measures memory instead of solving. A high score is then no proof of generalisation.")
      ],
      sources: [
        { label: "Hendrycks et al. (2021), MMLU", url: "https://arxiv.org/abs/2009.03300", why: { de: "MMLU als Multi-Task-Benchmark.", en: "MMLU as a multi-task benchmark." } },
        { label: "Chen et al. (2021), HumanEval", url: "https://arxiv.org/abs/2107.03374", why: { de: "HumanEval prüft Code mit Unit-Tests.", en: "HumanEval checks code with unit tests." } }
      ]
    }
  ];

  var gradientSteps = DE ? [
    {
      kicker: "Loss-Landschaft",
      title: "Was sind neuronale Netze?",
      body: "Jetzt wird der Fehler zur Landschaft. Die Gerade ist ŷ = w x + b; für das 1-Neuron-Modell gibt es nur zwei Parameter: w und b. Die Fläche zeigt den Loss über w und b; die Beispiele in der Seitenleiste sind dieselben 18 Sinus-Punkte wie im 1-Neuron- und im großen Netz. Das Training startet nicht von selbst: Drücke „Weiter“ oder den Startknopf. Mit Pause hältst du es an; „Weiter“ stoppt das Training und geht zur nächsten Folie. SGD, Adam und Momentum laufen nacheinander. Der Loss ist der mittlere quadratische Fehler (MSE), die Zahl, an der das Modell gemessen wird. Die Formel darunter setzt die aktuellen Werte ein.",
      watch: "Beobachte das Training. Wie verändern sich w und b, und wo im Tal endet der Punkt?",
      demoState: { scene: "gradient" },
      context: "Die Fläche ist diesmal kein Schnitt durch Hunderte Dimensionen: w und b sind die beiden echten Parameter. Jedes dieser 18 Beispiele (x, y) erzeugt einen Fehler; der Loss ist der Mittelwert dieser quadratischen Fehler. Die Formel darunter zeigt das Modell und den aktuellen Loss.",
      deep: "Der Gradient zeigt, wie der Loss auf eine Änderung von w und b reagiert. Der Optimierer geht in die Gegenrichtung. Die Lernrate bestimmt die Schrittweite. In einem LLM gibt es Milliarden solcher Parameter; die Landschaft ist nicht mehr sichtbar, die Regel bleibt dieselbe.",
      boxes: [
        box("grad-1", "Mathematik", "Das echte Modell", "Ein lineares Modell mit zwei Parametern: ŷ = w·x + b. w ist die Steigung, b der y-Achsenabschnitt. Mehr nicht.", "\\underbrace{\\hat y}_{\\text{Ausgabe}} = \\underbrace{w x + b}_{\\text{zwei Parameter}}"),
        box("grad-2", "Mathematik", "Die Loss-Fläche (MSE)", "L(w,b) = 1/n Σ (w·x_i + b − y_i)². Die beiden Achsen sind w und b, nicht zwei beliebige Richtungen.", "\\underbrace{L(w,b)}_{\\text{Loss}} = \\underbrace{\\frac{1}{n}\\sum_i (w x_i+b-y_i)^2}_{\\text{mittlerer Fehler}}"),
        box("grad-3", "Technik", "Der Schritt", "θ ← θ − η ∇L. Der Gradient zeigt bergauf; der Ball geht bergab. Der Worker führt die Schritte aus und schickt die Projektion zurück.", "\\underbrace{\\theta_{t+1}}_{\\text{neu}} = \\underbrace{\\theta_t}_{\\text{alt}} - \\underbrace{\\eta}_{\\text{Lernrate}} \\underbrace{\\nabla L(\\theta_t)}_{\\text{Gradient}}"),
        box("grad-4", "Grenze", "Warum ist das nicht das ganze LLM?", "Echte Netze haben Milliarden Dimensionen. Die zwei Richtungen sind ein lesbarer Schnitt, keine vollständige Landschaft."),
        box("grad-loss", "Optional", "Andere Loss-Funktionen", "MSE passt zu Regression. Für Klassen und Tokens nimmt man Cross-Entropy; für robuste Regression MAE oder Huber. Die Loss-Funktion sagt, was das Modell optimiert, nicht ob es die Aufgabe versteht."),
        box("grad-opt", "Technik", "SGD, Adam, Momentum", "SGD folgt dem Gradienten direkt. Momentum sammelt Geschwindigkeit und schießt über kleine Täler hinaus. Adam führt ein Gedächtnis für Gradient und Gradientenquadrat: häufig aktualisierte Parameter werden gedämpft, selten aktualisierte stärker gewichtet. Die Demo zeigt alle drei Pfade auf derselben Fläche."),
        box("grad-saddle", "Optional", "Sattelpunkte statt Minima", "In hohen Dimensionen sehen lokale Minima oft wie Sackgassen aus. Viele kritische Punkte sind aber Sattelpunkte: Es gibt fast immer eine Richtung, in der der Loss wieder fällt. Deshalb helfen Momentum und Adam, aus solchen Plateaus herauszukommen. Ein lokales Minimum ist im hochdimensionalen Raum meist nicht das eigentliche Hindernis.")
      ],
      sources: [
        { label: "Cauchy (1847), Méthode générale", url: "https://gallica.bnf.fr/ark:/12148/bpt6k2982c/f540.item", why: { de: "Frühe Beschreibung des steilsten Abstiegs.", en: "Early description of steepest descent." } },
        { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0", why: { de: "Gradienten für mehrschichtige Netze.", en: "Gradients for multilayer networks." } },
        { label: "Li et al. (2018), Visualizing the Loss Landscape", url: "https://arxiv.org/abs/1712.09913", why: { de: "Zweidimensionale Schnitte durch Loss-Landschaften.", en: "Two-dimensional slices through loss landscapes." } },
        { label: "Dauphin et al. (2014), Saddle Point Problem", url: "https://arxiv.org/abs/1406.2572", why: { de: "Sattelpunkte als Hindernis in hochdimensionaler Optimierung.", en: "Saddle points as an obstacle in high-dimensional optimization." } },
        { label: "Choromanska et al. (2015), Loss Surfaces of Multilayer Networks", url: "https://arxiv.org/abs/1412.0233", why: { de: "Kritische Punkte und lokale Minima in tiefen Netzen.", en: "Critical points and local minima in deep networks." } },
        { label: "Goodfellow, Bengio & Courville (2016), Deep Learning", url: "https://www.deeplearningbook.org/", why: { de: "Loss-Funktionen für Regression und Klassifikation.", en: "Loss functions for regression and classification." } },
        { label: "PyTorch, CrossEntropyLoss", url: "https://pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html", why: { de: "Cross-Entropy für Klassifikation.", en: "Cross-entropy for classification." } }
      ]
    }
  ] : [
    {
      kicker: "Loss landscape",
      title: "What are neural networks?",
      body: "Now the error becomes a landscape. The line is ŷ = w x + b; the one-neuron model has only two parameters: w and b. The surface shows the loss over w and b; the examples in the side panel are the same 18 sine points as in the one-neuron and larger networks. Training does not start by itself: press “Next” or the Start button. Pause stops it; “Next” stops training and moves to the next slide. SGD, Adam, and Momentum run one after another. The loss is the mean squared error (MSE), the number by which the model is judged. The formula below substitutes the current values.",
      watch: "Watch the training. How do w and b change, and where in the valley does the point end?",
      demoState: { scene: "gradient" },
      context: "This surface is not a slice through hundreds of dimensions: w and b are the two real parameters. Each of these 18 examples (x, y) produces an error; the loss is the mean squared error. The formula below shows the model and the current loss.",
      deep: "The gradient shows how the loss reacts to a change in w and b. The optimiser moves in the opposite direction. The learning rate sets the step size. In an LLM there are billions of such parameters; the landscape is no longer visible, but the rule stays the same.",
      boxes: [
        box("grad-1", "Mathematics", "The real model", "A linear model with two parameters: ŷ = w·x + b. w is the slope, b is the intercept. Nothing else.", "\\underbrace{\\hat y}_{\\text{output}} = \\underbrace{w x + b}_{\\text{two parameters}}"),
        box("grad-2", "Mathematics", "The loss surface (MSE)", "L(w,b) = 1/n Σ (w·x_i + b − y_i)². The two axes are w and b, not two arbitrary directions.", "\\underbrace{L(w,b)}_{\\text{loss}} = \\underbrace{\\frac{1}{n}\\sum_i (w x_i+b-y_i)^2}_{\\text{mean error}}"),
        box("grad-3", "Technique", "The step", "θ ← θ − η ∇L. The gradient points uphill; the ball goes downhill. The worker runs the steps and sends the projection back.", "\\underbrace{\\theta_{t+1}}_{\\text{new}} = \\underbrace{\\theta_t}_{\\text{old}} - \\underbrace{\\eta}_{\\text{learning rate}} \\underbrace{\\nabla L(\\theta_t)}_{\\text{gradient}}"),
        box("grad-4", "Limit", "Why is this not the whole LLM?", "Real networks have billions of dimensions. The two directions are a readable slice, not the full landscape."),
        box("grad-loss", "Optional", "Other loss functions", "MSE fits regression. Classes and tokens use cross-entropy; robust regression uses MAE or Huber. The loss says what the model optimises, not whether it understands the task."),
        box("grad-opt", "Technique", "SGD, Adam, Momentum", "SGD follows the gradient directly. Momentum accumulates velocity and overshoots small valleys. Adam keeps a memory of the gradient and its square: frequently updated parameters are damped, rarely updated ones get more weight. The demo shows all three paths on the same surface."),
        box("grad-saddle", "Optional", "Saddle points rather than minima", "In high dimensions a local minimum often looks like a dead end. Many critical points are saddle points: there is almost always a direction in which the loss falls again. Momentum and Adam help escape such plateaus. A local minimum is usually not the main obstacle in a high-dimensional space.")
      ],
      sources: [
        { label: "Cauchy (1847), Méthode générale", url: "https://gallica.bnf.fr/ark:/12148/bpt6k2982c/f540.item", why: { de: "Frühe Beschreibung des steilsten Abstiegs.", en: "Early description of steepest descent." } },
        { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0", why: { de: "Gradienten für mehrschichtige Netze.", en: "Gradients for multilayer networks." } },
        { label: "Li et al. (2018), Visualizing the Loss Landscape", url: "https://arxiv.org/abs/1712.09913", why: { de: "Zweidimensionale Schnitte durch Loss-Landschaften.", en: "Two-dimensional slices through loss landscapes." } },
        { label: "Dauphin et al. (2014), Saddle Point Problem", url: "https://arxiv.org/abs/1406.2572", why: { de: "Sattelpunkte als Hindernis in hochdimensionaler Optimierung.", en: "Saddle points as an obstacle in high-dimensional optimization." } },
        { label: "Choromanska et al. (2015), Loss Surfaces of Multilayer Networks", url: "https://arxiv.org/abs/1412.0233", why: { de: "Kritische Punkte und lokale Minima in tiefen Netzen.", en: "Critical points and local minima in deep networks." } },
        { label: "Goodfellow, Bengio & Courville (2016), Deep Learning", url: "https://www.deeplearningbook.org/", why: { de: "Loss-Funktionen für Regression und Klassifikation.", en: "Loss functions for regression and classification." } },
        { label: "PyTorch, CrossEntropyLoss", url: "https://pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html", why: { de: "Cross-Entropy für Klassifikation.", en: "Cross-entropy for classification." } }
      ]
    }
  ];

  var kvcacheSteps = DE ? [
    {
      kicker: "Inferenz",
      title: "Der KV-Cache wächst mit dem Kontext",
      body: "Beim Generieren speichert das Modell Key und Value für jedes Token. Der KV-Cache wächst mit Kontextlänge, Schichten, Heads und Kopfdimension. Deshalb kostet ein langer Chat Speicher, obwohl das Modell nicht neu trainiert wird.",
      watch: "Ziehe den Kontext nach oben. Wann passt der Cache nicht mehr in 24 GB?",
      demoState: { scene: "kvcache" },
      context: "Der Cache vermeidet, K und V für alte Tokens neu zu berechnen. Er wächst linear mit der Kontextlänge.",
      deep: "Die Rechnung ist eine Näherung: 2 Bytes pro Wert (FP16), K und V, alle Schichten und Heads. Echte Systeme nutzen weitere Tricks wie Paging oder Quantisierung.",
      boxes: [
        box("kv-1", "Prototyp", "Was ist der KV-Cache?", "Beim Generieren werden Key- und Value-Vektoren aller bisherigen Tokens gespeichert. So muss das Modell sie nicht bei jedem neuen Token neu berechnen."),
        box("kv-2", "Rechnung", "Wie groß wird er?", "2 Bytes pro Wert, K und V, mal Schichten, Heads, Kopfdimension und Tokens. Die Demo zeigt eine Näherung für FP16."),
        box("kv-3", "Grenze", "Was fehlt in der Rechnung?", "Aktivierungen, temporäre Puffer, Fragmentierung und den Modellgraph. Die echte Speichernutzung kann höher liegen.")
      ],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Key- und Value-Vektoren der Attention.", en: "Key and value vectors in attention." } },
        { label: "Dao et al. (2022), FlashAttention", url: "https://arxiv.org/abs/2205.14135", why: { de: "Speichereffiziente Attention.", en: "Memory-efficient attention." } }
      ]
    }
  ] : [
    {
      kicker: "Inference",
      title: "The KV cache grows with context",
      body: "During generation the model stores keys and values for every token. The KV cache grows with context length, layers, heads, and head dimension. That is why a long chat costs memory even though the model is not retrained.",
      watch: "Drag the context up. When does the cache no longer fit in 24 GB?",
      demoState: { scene: "kvcache" },
      context: "The cache avoids recomputing K and V for old tokens. It grows linearly with context length.",
      deep: "The calculation is an approximation: 2 bytes per value (FP16), K and V, all layers and heads. Real systems use further tricks such as paging or quantisation.",
      boxes: [
        box("kv-1", "Prototype", "What is the KV cache?", "During generation, key and value vectors for all previous tokens are stored. The model does not have to recompute them for every new token."),
        box("kv-2", "Calculation", "How large does it get?", "2 bytes per value, K and V, times layers, heads, head dimension, and tokens. The demo shows an FP16 approximation."),
        box("kv-3", "Limit", "What is missing?", "Activations, temporary buffers, fragmentation, and the model graph. Real memory use can be higher.")
      ],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Key- und Value-Vektoren der Attention.", en: "Key and value vectors in attention." } },
        { label: "Dao et al. (2022), FlashAttention", url: "https://arxiv.org/abs/2205.14135", why: { de: "Speichereffiziente Attention.", en: "Memory-efficient attention." } }
      ]
    }
  ];

  var ragSteps = DE ? [
    {
      kicker: "RAG und Agents",
      title: "Suchen, lesen, einsetzen",
      body: "Ein Modell allein hat nur seine Gewichte. RAG gibt ihm Werkzeuge: Es zerlegt Quellen in Chunks, vergleicht ihre Vektoren mit der Frage und setzt die besten Chunks in den Kontext. Ein Agent kann diesen loop selbst auslösen, im Web suchen, lesen und die Antwort mit Quellen stützen.",
      watch: "Klicke Chunks an und gehe die Schritte durch. Wann landen Quellen im Kontext?",
      demoState: { scene: "rag", step: 0 },
      context: "Ähnlichkeit ist ein Winkel zwischen Vektoren. Die Suche findet Chunks, das Modell liest sie im Kontext und kann sich mit Attention auf sie beziehen. Das senkt Halluzinationen, weil die Antwort eine Quelle hat.",
      deep: "RAG ist keine Garantie: Der Retriever kann den falschen Chunk finden, der Chunk kann falsch sein, und das Modell kann ihn falsch lesen. Ein Agent macht daraus einen loop: suchen, lesen, prüfen, erneut suchen. Das gesamte Web wird so zu einem riesigen, durchsuchbaren Korpus.",
      boxes: [
        box("rag-1", "Technik", "Was ist ein Chunk?", "Ein kurzer Textabschnitt aus einer Quelle. Er wird zu einem Vektor; ähnliche Chunks liegen nah beieinander."),
        box("rag-2", "Technik", "Was macht der Retriever?", "Er vergleicht die Frage mit vielen Chunk-Vektoren und gibt die besten zurück. Danach landen sie im Kontext des Modells."),
        box("rag-3", "Agent", "Was macht ein Agent?", "Er kann den Retrieval-loop selbst steuern: suchen, lesen, entscheiden, erneut suchen. Werkzeuge wie eine Suchmaschine erweitern den Korpus auf das Internet.")
      ],
      sources: [
        { label: "Lewis et al. (2020), Retrieval-Augmented Generation", url: "https://arxiv.org/abs/2005.11401", why: { de: "RAG verbindet Retrieval mit Generation.", en: "RAG combines retrieval with generation." } },
        { label: "Karpukhin et al. (2020), Dense Passage Retrieval", url: "https://arxiv.org/abs/2004.04906", why: { de: "Dichte Vektoren für die Passagensuche.", en: "Dense vectors for passage retrieval." } }
      ]
    }
  ] : [
    {
      kicker: "RAG and agents",
      title: "Search, read, insert",
      body: "A model on its own has only its weights. RAG gives it tools: split sources into chunks, compare their vectors with the question, and put the best chunks into the context. An agent can trigger this loop itself, search the web, read, and ground the answer in sources.",
      watch: "Click chunks and walk through the steps. When do sources enter the context?",
      demoState: { scene: "rag", step: 0 },
      context: "Similarity is an angle between vectors. Retrieval finds chunks, the model reads them in context and can attend to them. That lowers hallucinations because the answer has a source.",
      deep: "RAG is not a guarantee: the retriever may find the wrong chunk, the chunk may be wrong, and the model may misread it. An agent turns this into a loop: search, read, check, search again. The whole web becomes a huge searchable corpus.",
      boxes: [
        box("rag-1", "Technique", "What is a chunk?", "A short passage from a source. It becomes a vector; similar chunks sit close together."),
        box("rag-2", "Technique", "What does the retriever do?", "It compares the question with many chunk vectors and returns the best. They then enter the model's context."),
        box("rag-3", "Agent", "What does an agent do?", "It can steer the retrieval loop: search, read, decide, search again. Tools such as a search engine extend the corpus to the internet.")
      ],
      sources: [
        { label: "Lewis et al. (2020), Retrieval-Augmented Generation", url: "https://arxiv.org/abs/2005.11401", why: { de: "RAG verbindet Retrieval mit Generation.", en: "RAG combines retrieval with generation." } },
        { label: "Karpukhin et al. (2020), Dense Passage Retrieval", url: "https://arxiv.org/abs/2004.04906", why: { de: "Dichte Vektoren für die Passagensuche.", en: "Dense vectors for passage retrieval." } }
      ]
    }
  ];

  var historySteps = DE ? [



    {
      kicker: "Geschichte",
      title: "Geschichte in zehn Schritten",
      body: "Von den Kerben im Wolfsknochen bis zu GPT: Zehn Tabs folgen dem roten Faden aus `history.php`. Ganz früh beginnt Rechnen als Zählen mit Steinen und Kerben. Dann kommen Logik, Rechenmaschinen, das Neuron, das Perzeptron, die XOR-Krise, Backpropagation, Deep Learning, der Transformer und die LLMs. Klicke die Tabs und sieh, welche Idee jeweils weitergetragen wird.",
      watch: "Klicke die zehn Tabs. Welche Idee trägt bis zum Transformer?",
      demoState: { scene: "history", tab: 0 },
      context: "Die Geschichte ist keine gerade Linie. Mehrere Stränge laufen parallel: formale Logik, mechanisches Rechnen, statistisches Lernen und Hardware. Der Transformer ist ein Knoten, an dem viele davon zusammenkommen.",
      deep: "Jeder Tab nennt eine Primärquelle oder ein Museum, das den Gegenstand dokumentiert. Die Bilder stammen aus `history.php`; die Credits stehen direkt an den Figuren. Die zwei Schemata für XOR und Backpropagation sind eigene Zeichnungen, weil das Original ein interaktives Plotly-Diagramm beziehungsweise ein Fließbild ist.",
      boxes: [
        box("hist-1", "Geschichte", "Zehn Tabs", "Ganz früh: Wolfsknochen, Salamis-Tafel, Llull, Leibniz, Neuron, Perzeptron, Backprop, Deep Learning, Transformer, GPT."),
        box("hist-2", "Geschichte", "Roter Faden", "Jede Station macht einen Schritt von gegenständlichem Zählen zu lernenden Vektoren: Regeln, Maschinen, Neuronen, Gradienten, Aufmerksamkeit."),
        box("hist-3", "Geschichte", "Was die Tabs nicht zeigen", "Sie sind eine Auswahl. Die vollständige Erzählung mit allen Quellen und Bildern steht in `history.php`; hier geht es um die Linie, die zum LLM führt.")
      ],
      sources: [
        { label: "J3n6 (2012), Wolf Bone from Dolní Věstonice", url: "https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg", why: { de: "Der früheste Gegenstand im Geschichts-Tab.", en: "The earliest object in the history tab." } },
        { label: "Minsky & Papert (1969), Perceptrons", url: "https://archive.org/details/perceptronsintro0000mins", why: { de: "Die XOR-Grenze und der erste KI-Winter.", en: "The XOR limit and the first AI winter." } },
        { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0", why: { de: "Backpropagation macht tiefe Netze trainierbar.", en: "Backpropagation makes deep networks trainable." } },
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Self-Attention und der Transformer-Block.", en: "Self-attention and the transformer block." } }
      ]
    }
  ] : [
    {
      kicker: "History",
      title: "History in ten steps",
      body: "From the notches in a wolf bone to GPT: ten tabs follow the thread from `history.php`. Arithmetic starts as counting with stones and notches. Then come logic, calculating machines, the neuron, the perceptron, the XOR crisis, backpropagation, deep learning, the transformer, and LLMs. Click the tabs and see which idea is carried forward.",
      watch: "Click the ten tabs. Which idea carries through to the transformer?",
      demoState: { scene: "history", tab: 0 },
      context: "History is not a straight line. Several strands run in parallel: formal logic, mechanical calculation, statistical learning, and hardware. The transformer is a node where many of them meet.",
      deep: "Each tab names a primary source or a museum that documents the object. The images come from `history.php`; credits sit directly on the figures. The XOR and backpropagation diagrams are original drawings, because the original is an interactive Plotly chart or a flow diagram.",
      boxes: [
        box("hist-1", "History", "Ten tabs", "Deep past: wolf bone, Salamis tablet, Llull, Leibniz, neuron, perceptron, backprop, deep learning, transformer, GPT."),
        box("hist-2", "History", "The thread", "Each station moves from embodied counting toward learned vectors: rules, machines, neurons, gradients, attention."),
        box("hist-3", "History", "What the tabs leave out", "They are a selection. The full story with all sources and images is in `history.php`; this page follows the line that leads to the LLM.")
      ],
      sources: [
        { label: "J3n6 (2012), Wolf Bone from Dolní Věstonice", url: "https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg", why: { de: "Der früheste Gegenstand im Geschichts-Tab.", en: "The earliest object in the history tab." } },
        { label: "Minsky & Papert (1969), Perceptrons", url: "https://archive.org/details/perceptronsintro0000mins", why: { de: "Die XOR-Grenze und der erste KI-Winter.", en: "The XOR limit and the first AI winter." } },
        { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0", why: { de: "Backpropagation macht tiefe Netze trainierbar.", en: "Backpropagation makes deep networks trainable." } },
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Self-Attention und der Transformer-Block.", en: "Self-attention and the transformer block." } }
      ]
    }
  ];

  var philosophySteps = DE ? [
    {
      kicker: "Philosophie",
      title: "Du bist das Chinesische Zimmer",
      body: "Du sitzt in einem Zimmer. Durch eine Klappe kommen Zeichen, die du nicht lesen kannst. Auf dem Tisch liegt ein Regelbuch: Es sagt dir, welche Zeichenfolge du herausschreiben sollst. Du suchst die Eingabe, kopierst die passende Antwort, und von außen sieht es aus, als würdest du die Sprache verstehen. Searle (1980) nennt das den Unterschied zwischen Regeln befolgen und Bedeutung verstehen. Folge dem Regelbuch und beobachte, was du tust.",
      watch: "Folge dem Regelbuch. Wirkt deine Antwort von außen intelligent?",
      demoState: { scene: "chineseroom" },
      context: "Das Zimmer ist ein Bild für ein Programm: Symbole rein, Symbole raus, nach Regeln. Ob das ganze System versteht, ist die offene Frage.",
      deep: "Der Systems Reply sagt: Vielleicht versteht nicht die Person im Zimmer, sondern das ganze System aus Person, Regelbuch und Zimmer. Searle hält das für eine Verschiebung des Problems, nicht für eine Lösung. Ein LLM sitzt in einer ähnlichen Lage: Es manipuliert Tokens nach gelernten Regeln, ohne den Weltbezug der Wörter zu haben. Ob daraus Verstehen wird, entscheidet der Streit, nicht die Demo.",
      boxes: [
        box("phil-1", "Argument", "Was zeigt das Zimmer?", "Dass Symbolmanipulation allein kein Verstehen garantieren muss. Die Antwort kann richtig aussehen, obwohl die Person die Zeichen nicht versteht."),
        box("phil-2", "Einwand", "Was ist der Systems Reply?", "Vielleicht versteht das ganze System, nicht die Person im Zimmer. Searle bestreitet, dass das den Einwand rettet; die Debatte ist offen."),
        box("phil-3", "LLM", "Wo steht das Modell?", "Ein LLM folgt gelernten statistischen Regeln über Tokens. Es hat keinen direkten Zugang zur Welt, auf die die Tokens zeigen. Ob daraus Verstehen wird, ist genau die Frage.")
      ],
      sources: [
        { label: "Searle (1980), Minds, Brains, and Programs", url: "https://doi.org/10.1017/S0140525X00005756", why: { de: "Chinesisches Zimmer: Regeln befolgen vs. verstehen.", en: "Chinese Room: following rules vs. understanding." } },
        { label: "Harnad (1990), The Symbol Grounding Problem", url: "https://doi.org/10.1016/0167-2789(90)90087-6", why: { de: "Symbol Grounding Problem.", en: "The symbol grounding problem." } }
      ]
    }
  ] : [
    {
      kicker: "Philosophy",
      title: "You are the Chinese Room",
      body: "You sit in a room. Through a slot come characters you cannot read. On the table is a rulebook: it tells you which string to write back. You find the input, copy the matching answer, and from the outside it looks as if you understand the language. Searle (1980) calls this the difference between following rules and understanding meaning. Follow the rulebook and watch what you do.",
      watch: "Follow the rulebook. Does your answer look intelligent from the outside?",
      demoState: { scene: "chineseroom" },
      context: "The room is a picture of a program: symbols in, symbols out, by rules. Whether the whole system understands is the open question.",
      deep: "The systems reply says: perhaps the person in the room does not understand, but the whole system of person, rulebook, and room does. Searle treats that as moving the problem, not solving it. An LLM is in a similar position: it manipulates tokens by learned rules without having the world the words refer to. Whether that becomes understanding is what the dispute is about, not what the demo settles.",
      boxes: [
        box("phil-1", "Argument", "What does the room show?", "That symbol manipulation alone need not guarantee understanding. The answer can look correct even though the person does not understand the characters."),
        box("phil-2", "Objection", "What is the systems reply?", "Perhaps the whole system understands, not the person in the room. Searle denies that this rescues the objection; the debate is open."),
        box("phil-3", "LLM", "Where does the model stand?", "An LLM follows learned statistical rules over tokens. It has no direct access to the world the tokens point to. Whether that becomes understanding is exactly the question.")
      ],
      sources: [
        { label: "Searle (1980), Minds, Brains, and Programs", url: "https://doi.org/10.1017/S0140525X00005756", why: { de: "Chinesisches Zimmer: Regeln befolgen vs. verstehen.", en: "Chinese Room: following rules vs. understanding." } },
        { label: "Harnad (1990), The Symbol Grounding Problem", url: "https://doi.org/10.1016/0167-2789(90)90087-6", why: { de: "Symbol Grounding Problem.", en: "The symbol grounding problem." } }
      ]
    }
  ];

  var unembedSteps = DE ? [
    {
      kicker: "Unembedding",
      title: "Ähnliche Worte finden",
      body: "Welches Wort liegt neben „König“? W_U hat eine Zeile pro Token. Jede Zeile ist eine gelernte Richtung. Am Ende vergleicht das Modell den Vektor h mit diesen Richtungen: Das Skalarprodukt misst, wie ähnlich sie zeigen. Das ist die Umkehrung des Embeddings: aus einem Vektor werden wieder Wörter. Wähle ein Wort und sieh die nächsten Nachbarn. Schalte zwischen Winkel und euklidischem Abstand um: Der Winkel ignoriert die Länge, der Abstand nicht. Die Prozentwerte sind Ähnlichkeiten, keine Wahrscheinlichkeiten.",
      watch: "Wähle ein Wort. Welche Nachbarn bleiben bei Winkel, welche bei euklidischem Abstand?",
      demoState: { scene: "unembed" },
      context: "Die 2D-Karte ist eine Projektion der gelernten Richtungen. Die Prozentwerte vergleichen Richtungen; erst Softmax macht daraus eine Verteilung. Ähnliche Wörter liegen nahe beieinander, weil das Training sie in ähnlichen Kontexten sieht.",
      deep: "W_U ist gelernt. Wörter, die in ähnlichen Kontexten vorkommen, bekommen ähnliche Richtungen; das Skalarprodukt misst die Nähe. In hohen Dimensionen verliert der euklidische Abstand an Kontrast, deshalb ist der Winkel oft informativer. Die Karte ist eine Projektion, keine vollständige Geometrie.",
      boxes: [
        box("un-1", "Mathematik", "Die Matrix W_U", "Jede Zeile von W_U ist die gelernte Richtung eines Tokens. Das Skalarprodukt mit h ergibt einen Logit. Ähnliche Richtungen ergeben hohe Werte; Softmax macht daraus eine Verteilung.", "\\underbrace{z_i}_{\\text{Logit}} = \\underbrace{w_i \\cdot h}_{\\text{Richtung mal Vektor}}"),
        box("un-2", "Metrik", "Winkel oder Abstand?", "Der Cosinus ignoriert die Länge und misst nur die Richtung. Der euklidische Abstand zählt die Länge mit. In hohen Dimensionen liegen fast alle Punkte ähnlich weit auseinander; der Winkel bleibt informativer. Deshalb vergleicht das Unembedding Richtungen.", "\\underbrace{\\cos\\theta}_{\\text{Ähnlichkeit}} = \\underbrace{\\frac{u\\cdot v}{\\lVert u\\rVert\\,\\lVert v\\rVert}}_{\\text{nur Richtung}}"),
        box("un-3", "Grenze", "Was ist das nicht?", "Kein Wörterbuch und keine Definition. Die Karte zeigt gelernte Nachbarschaften, keine Bedeutung an sich. Ähnliche Wörter können auch Gegensätze sein, wenn sie in ähnlichen Kontexten auftreten; die Prozentwerte sind keine Wahrscheinlichkeiten."),
        box("un-4", "Metrik", "Scale Invariance: Direction Is Often the Useful Signal", "Die Länge eines Vektors ändert den euklidischen Abstand, aber nicht den Cosinus. Deshalb kann das Netz Längen ignorieren und hat mehr Freiheit bei der Richtung. Ob die Richtung semantisch dasselbe bedeutet, ist eine Eigenschaft des gelernten Raums, keine Folge des Cosinus.")
      ],
      sources: [
        { label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781", why: { de: "Gelernte Wortvektoren und Ähnlichkeit über Richtungen.", en: "Learned word vectors and similarity through directions." } },
        { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/", why: { de: "Globale Kookkurrenz als Wortvektoren.", en: "Global co-occurrence as word vectors." } },
        { label: "Aggarwal et al. (2001), On the Surprising Behavior of Distance Metrics in High Dimensional Space", url: "https://doi.org/10.1007/3-540-44503-X_27", why: { de: "Distanzen verlieren in hohen Dimensionen an Kontrast; Winkel bleiben informativ.", en: "Distances lose contrast in high dimensions; angles stay informative." } }
      ]
    }
  ] : [
    {
      kicker: "Unembedding",
      title: "Finding similar words",
      body: "Which word lies next to “king”? W_U has one row per token. Every row is a learned direction. At the end the model compares the vector h with these directions: the dot product measures how similarly they point. This is the reverse of embedding: a vector becomes words again. Choose a word and see its nearest neighbours. Switch between angle and Euclidean distance: the angle ignores length, the distance does not. The percentages are similarities, not probabilities.",
      watch: "Choose a word. Which neighbours stay under angle, which under Euclidean distance?",
      demoState: { scene: "unembed" },
      context: "The 2D map is a projection of the learned directions. The percentages compare directions; only softmax turns them into a distribution. Similar words lie close together because training sees them in similar contexts.",
      deep: "W_U is learned. Words that occur in similar contexts get similar directions; the dot product measures the closeness. In high dimensions Euclidean distance loses contrast, so the angle is often more informative. The map is a projection, not the full geometry.",
      boxes: [
        box("un-1", "Mathematics", "The matrix W_U", "Every row of W_U is the learned direction of a token. The dot product with h gives a logit. Similar directions give high values; softmax turns them into a distribution.", "\\underbrace{z_i}_{\\text{logit}} = \\underbrace{w_i \\cdot h}_{\\text{direction times vector}}"),
        box("un-2", "Metric", "Angle or distance?", "The cosine ignores length and measures only direction. Euclidean distance includes length. In high dimensions almost all points are similarly far apart; the angle stays more informative. That is why the unembedding compares directions.", "\\underbrace{\\cos\\theta}_{\\text{similarity}} = \\underbrace{\\frac{u\\cdot v}{\\lVert u\\rVert\\,\\lVert v\\rVert}}_{\\text{direction only}}"),
        box("un-3", "Limit", "What is this not?", "Not a dictionary and not a definition. The map shows learned neighbourhoods, not meaning itself. Similar words can even be opposites if they occur in similar contexts; the percentages are not probabilities."),
        box("un-4", "Metric", "Scale Invariance: Direction Is Often the Useful Signal", "A vector's length changes Euclidean distance but not cosine. That is why the network can ignore lengths and has more freedom in direction. Whether that direction means the same thing is a property of the learned space, not a consequence of cosine.")
      ],
      sources: [
        { label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781", why: { de: "Gelernte Wortvektoren und Ähnlichkeit über Richtungen.", en: "Learned word vectors and similarity through directions." } },
        { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/", why: { de: "Globale Kookkurrenz als Wortvektoren.", en: "Global co-occurrence as word vectors." } },
        { label: "Aggarwal et al. (2001), On the Surprising Behavior of Distance Metrics in High Dimensional Space", url: "https://doi.org/10.1007/3-540-44503-X_27", why: { de: "Distanzen verlieren in hohen Dimensionen an Kontrast; Winkel bleiben informativ.", en: "Distances lose contrast in high dimensions; angles stay informative." } }
      ]
    }
  ];

  var highdimSteps = DE ? [
    {
      kicker: "Der Raum",
      title: "Tausende Dimensionen",
      body: "Die 3D-Bilder sind nur ein Schatten. Ein echtes Embedding hat Tausende Dimensionen; GPT-2 small nutzt 768, große Modelle noch mehr. Die Tabelle zeigt einen Ausschnitt: 16 von 4096 Dimensionen. Jede Zeile ist ein Wort, jede Spalte eine Dimension. Du kannst dir das nicht mehr vorstellen, aber die Rechnung bleibt dieselbe: Mittelpunkt, Winkel und Matrixmultiplikation funktionieren koordinatenweise weiter.",
      watch: "Scrolle durch die Tabelle. Jede Spalte ist eine Dimension; die Zahlen sind ein Ausschnitt, keine echten GPT-Gewichte.",
      demoState: { scene: "highdim" },
      context: "Mehr Dimensionen erlauben mehr unabhängige Unterschiede. Die 3D-Demos sind Projektionen; die Tabelle ist die ehrliche Darstellung für den Rechner.",
      deep: "Die Zahlen sind didaktisch, keine echten GPT-Gewichte. In einem echten Modell wird jede Koordinate aus Text gelernt; keine einzelne Spalte hat für sich eine Bedeutung. Die Geometrie entsteht im Zusammenspiel.",
      boxes: [
        box("hd-new-1", "Technik", "Warum so viele Dimensionen?", "Jede zusätzliche Dimension kann eine weitere Richtung für einen Unterschied öffnen. Mit Tausenden Koordinaten können viele Beziehungen nebeneinander existieren, ohne sich gegenseitig zu überschreiben."),
        box("hd-new-2", "Grenze", "Was zeigt die Tabelle nicht?", "Sie zeigt einen Ausschnitt, keine echten Gewichte. Ein echtes Modell lernt jede Koordinate aus Text; die Tabelle ist eine didaktische Darstellung.")
      ],
      sources: sources
    }
  ] : [
    {
      kicker: "The space",
      title: "Thousands of dimensions",
      body: "The 3D pictures are only a shadow. A real embedding has thousands of dimensions; GPT-2 small uses 768, larger models even more. The table shows a slice: 16 of 4096 dimensions. Each row is a word, each column a dimension. You cannot picture this anymore, but the arithmetic stays the same: midpoint, angle, and matrix multiplication work coordinate by coordinate.",
      watch: "Scroll through the table. Each column is a dimension; the numbers are a slice, not real GPT weights.",
      demoState: { scene: "highdim" },
      context: "More dimensions allow more independent differences. The 3D demos are projections; the table is the honest view for the computer.",
      deep: "The numbers are didactic, not real GPT weights. In a real model every coordinate is learned from text; no single column means anything on its own. The geometry comes from the interaction.",
      boxes: [
        box("hd-new-1", "Technique", "Why so many dimensions?", "Every extra dimension can open another direction for a difference. With thousands of coordinates many relations can exist side by side without overwriting one another."),
        box("hd-new-2", "Limit", "What does the table not show?", "It shows a slice, not real weights. A real model learns every coordinate from text; the table is a didactic view.")
      ],
      sources: sources
    }
  ];

  var neuralLargeSteps = DE ? [
    {
      kicker: "Großes Netz",
      title: "Was sind neuronale Netze?",
      body: "Jetzt ein größeres Netz: 1 → 32 → 32 → 32 → 1, Dense plus ReLU. Es hat viel mehr Parameter und Richtungen, als wir zeichnen können; das Prinzip bleibt dasselbe: Parameter, Loss, Gradient. Beobachte, wie die grüne Kurve den Sinus biegt. Ziehe Punkte, pausiere oder starte neu. Die Matrizen kannst du live öffnen.",
      watch: "Starte das Training. Wann biegt die Kurve den Sinus? Was passiert außerhalb der Trainingsdaten?",
      demoState: { scene: "model", phase: "net" },
      context: "Der Loss wird nur auf den Trainingspunkten berechnet. Außerhalb gibt es keine Daten; die Kurve ist eine Extrapolation.",
      deep: "Das Netz hat drei versteckte Schichten mit je 32 ReLU-Neuronen. Jede Schicht hat eigene Gewichte. Der Loss ist der mittlere quadratische Fehler. Ein kleiner Trainings-Loss garantiert keine gute Extrapolation.",
      boxes: [
        box("mod-width", "Technik", "Warum größer?", "Mehr Neuronen und Schichten geben dem Netz mehr Richtungen und Knicke. Es kann den Sinus biegen, braucht aber Daten und Training."),
        box("mod-loss", "Mathematik", "Was ist der Loss?", "Der Loss misst den Abstand zwischen Modell und Daten. Beim quadratischen Fehler wird jeder Abstand quadriert, gemittelt und minimiert. Training sucht Parameter, die diesen Wert senken.", "\\underbrace{L(\\theta)}_{\\text{Loss}} = \\underbrace{\\frac{1}{n}\\sum_{i=1}^{n}(\\hat y_i - y_i)^2}_{\\text{mittlerer quadratischer Fehler}}"),
        box("mod-train", "Technik", "Wie wird trainiert?", "Der Gradient zeigt, wie der Loss auf jede Parameteränderung reagiert. Ein Optimierer geht in die Gegenrichtung. Die Lernrate bestimmt die Schrittweite."),
        box("mod-extra", "Grenze", "Warum außerhalb falsch?", "Im Trainingsbereich gibt es Daten. Außerhalb extrapoliert das Netz. Ein kleiner Trainings-Loss garantiert keine gute Extrapolation.")
      ],
      sources: [
        { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0", why: { de: "Gradienten und Backpropagation für mehrschichtige Netze.", en: "Gradients and backpropagation for multilayer networks." } },
        { label: "Cauchy (1847), Méthode générale", url: "https://gallica.bnf.fr/ark:/12148/bpt6k2982c/f540.item", why: { de: "Frühe Beschreibung des steilsten Abstiegs.", en: "Early description of steepest descent." } }
      ]
    }
  ] : [
    {
      kicker: "Larger network",
      title: "What are neural networks?",
      body: "Now a larger network: 1 → 32 → 32 → 32 → 1, dense with ReLU. It has far more parameters and directions than we can draw; the principle stays the same: parameters, loss, gradient. Watch the green curve bend the sine. Drag points, pause, or restart. You can open the matrices live.",
      watch: "Start training. When does the curve bend the sine? What happens outside the training data?",
      demoState: { scene: "model", phase: "net" },
      context: "The loss is computed only on the training points. Outside there is no data; the curve is an extrapolation.",
      deep: "The network has three hidden layers with 32 ReLU neurons each. Every layer has its own weights. The loss is mean squared error. A small training loss does not guarantee good extrapolation.",
      boxes: [
        box("mod-width", "Technique", "Why larger?", "More neurons and layers give the network more directions and bends. It can bend the sine, but it needs data and training."),
        box("mod-loss", "Mathematics", "What is the loss?", "The loss measures the distance between model and data. With squared error, every gap is squared, averaged, and minimised. Training looks for parameters that lower this value.", "\\underbrace{L(\\theta)}_{\\text{loss}} = \\underbrace{\\frac{1}{n}\\sum_{i=1}^{n}(\\hat y_i - y_i)^2}_{\\text{mean squared error}}"),
        box("mod-train", "Technique", "How is it trained?", "The gradient shows how the loss reacts to every parameter change. An optimiser moves in the opposite direction. The learning rate sets the step size."),
        box("mod-extra", "Limit", "Why wrong outside?", "Inside the training range there is data. Outside the network extrapolates. A small training loss does not guarantee good extrapolation.")
      ],
      sources: [
        { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0", why: { de: "Gradienten und Backpropagation für mehrschichtige Netze.", en: "Gradients and backpropagation for multilayer networks." } },
        { label: "Cauchy (1847), Méthode générale", url: "https://gallica.bnf.fr/ark:/12148/bpt6k2982c/f540.item", why: { de: "Frühe Beschreibung des steilsten Abstiegs.", en: "Early description of steepest descent." } }
      ]
    }
  ];

  var gaussSteps = DE ? [
    {
      kicker: "Ceres",
      title: "Gauß, Ceres und die Daten",
      body: "Am 1. Januar 1801 entdeckte Giuseppe Piazzi Ceres, den ersten Asteroiden, und verlor ihn nach 41 Tagen Beobachtung hinter der Sonne. Carl Friedrich Gauß behandelte die verrauschten Positionen als ein Ganzes und nahm an, dass die wahre Bahn in der Mitte der Fehler liegt. Seine Methode der kleinsten Quadrate minimierte den quadrierten Abstand zwischen Beobachtungen und Bahn, also den mittleren quadratischen Fehler (MSE), und sagte voraus, wo Ceres wieder auftauchen würde (Stigler, 1981). Drehe am Teleskop: Je besser die Messung, desto enger die Glockenkurve. Der Ausgleich glaubt keiner einzelnen Messung; er wählt die Kurve, die allen zugleich am nächsten bleibt. Dieselbe Regel trainiert noch moderne Modelle.",
      watch: "Bewege den Teleskop-Regler. Wie verändert sich die Wolke, und wie eng wird die Glockenkurve?",
      demoState: { scene: "gauss" },
      context: "Die Beobachtungen sind synthetisch, nicht Piazzis originale Messungen. Der Plot zeigt das Prinzip: eine wahre Bahn (grün), eine Wolke verrauschter Messungen (blau) und die Glockenkurve ihrer Fehler. Die Methode der kleinsten Quadrate sucht die Bahn, die allen Beobachtungen zugleich am nächsten liegt.",
      deep: "Gauß veröffentlichte die Methode 1809. Sie wählt die Parameter, die die Summe der quadrierten Abstände minimieren. Ein einzelner Ausreißer zählt quadriert, aber viele kleine Fehler mitteln sich. Dieselbe Arithmetik erscheint in jedem trainierten Netz: Ein Modell ist eine Kurve, die Daten sind verrauschte Punkte, und das Training wählt die Gewichte, deren Vorhersagen im Durchschnitt am nächsten an den Beobachtungen liegen.",
      boxes: [
        box("gauss-1", "Geschichte", "Ceres und Piazzi", "Piazzi entdeckte Ceres am 1. Januar 1801 und verlor sie nach 41 Tagen hinter der Sonne. Gauß sagte mit der Methode der kleinsten Quadrate voraus, wo sie wieder auftauchen würde (Stigler, 1981)."),
        box("gauss-2", "Mathematik", "Was macht die Methode?", "Sie minimiert die Summe der quadrierten Abstände zwischen Beobachtungen und Modell, den mittleren quadratischen Fehler (MSE). Große Abweichungen zählen quadratisch, kleine kaum.", "\\underbrace{\\min_{\\theta}\\underbrace{\\sum_i (y_i - f_\\theta(x_i))^2}_{\\text{quadratische Fehler}}}_{\\text{kleinste Summe}}"),
        box("gauss-3", "Daten", "Warum im Schnitt richtig?", "Einzelne Messungen können falsch sein: Menschen irren sich, Messungen haben Fehler, Menschen lügen. Über viele Messungen mitteln sich zufällige Fehler; die Anpassung landet in der Mitte. Systematische Fehler bleiben, deshalb ist Kuration wichtig."),
        box("gauss-4", "Geschichte", "Die Rückkehr in die KI", "Die Methode kam aus der Astronomie und fand in das maschinelle Lernen, weil dasselbe Problem wiederkehrte: eine einfache Kurve durch unvollkommene Messungen legen. Dieselbe Regel trainiert noch moderne Netze.")
      ],
      sources: [
        { label: "Stigler (1981), Gauss and the Invention of Least Squares", url: "https://doi.org/10.1214/aos/1176345451", why: { de: "Gauß, Ceres und die Methode der kleinsten Quadrate.", en: "Gauss, Ceres, and the method of least squares." } },
        { label: "Ceres, Dawn (NASA/JPL-Caltech/UCLA/MPS/DLR/IDA), via Wikimedia Commons", url: "https://commons.wikimedia.org/wiki/File:Ceres_-_RC3_-_Haulani_Crater_(22381131691)_(cropped).jpg", why: { de: "Bild von Ceres, Public Domain.", en: "Image of Ceres, public domain." } },
        { label: "The Flammarion Engraving (1888), via Wikimedia Commons", url: "https://commons.wikimedia.org/wiki/File:Flammarion_Woodcut_1888_Color_2.jpg", why: { de: "Kolorierter Flammarion-Holzschnitt, Public Domain.", en: "Coloured Flammarion engraving, public domain." } }
      ]
    }
  ] : [
    {
      kicker: "Ceres",
      title: "Gauss, Ceres, and the data",
      body: "On 1 January 1801 Giuseppe Piazzi discovered Ceres, the first asteroid, and lost it behind the Sun after 41 days of observation. Carl Friedrich Gauss treated the noisy positions as a whole and assumed that the true orbit lies in the middle of the errors. His method of least squares minimised the squared distance between observations and orbit, the mean squared error (MSE), and predicted where Ceres would reappear (Stigler, 1981). Turn the telescope: the better the measurement, the narrower the bell curve. The fit believes no single measurement; it chooses the curve that stays closest to all of them at once. The same rule still trains modern models.",
      watch: "Move the telescope slider. How does the cloud change, and how narrow does the bell curve become?",
      demoState: { scene: "gauss" },
      context: "The observations are synthetic, not Piazzi's original measurements. The plot shows the principle: a true orbit (green), a cloud of noisy measurements (blue), and the bell curve of their errors. The method of least squares looks for the orbit that stays closest to all observations at once.",
      deep: "Gauss published the method in 1809. It chooses the parameters that minimise the sum of squared distances. A single outlier counts squared, but many small errors average out. The same arithmetic appears in every trained network: a model is a curve, the data are noisy points, and training chooses the weights whose predictions are closest to the observations on average.",
      boxes: [
        box("gauss-1", "History", "Ceres and Piazzi", "Piazzi discovered Ceres on 1 January 1801 and lost it behind the Sun after 41 days. Gauss predicted with least squares where it would reappear (Stigler, 1981)."),
        box("gauss-2", "Mathematics", "What does the method do?", "It minimises the sum of squared distances between observations and model, the mean squared error (MSE). Large deviations count squared, small ones barely.", "\\underbrace{\\min_{\\theta}\\underbrace{\\sum_i (y_i - f_\\theta(x_i))^2}_{\\text{squared errors}}}_{\\text{smallest sum}}"),
        box("gauss-3", "Data", "Why right on average?", "Individual measurements can be wrong: people make mistakes, measurements have errors, people lie. Over many measurements random errors average out; the fit lands in the middle. Systematic errors remain, which is why curation matters."),
        box("gauss-4", "History", "The return to AI", "The method came from astronomy and entered machine learning because the same problem returned: putting a simple curve through imperfect measurements. The same rule still trains modern networks.")
      ],
      sources: [
        { label: "Stigler (1981), Gauss and the Invention of Least Squares", url: "https://doi.org/10.1214/aos/1176345451", why: { de: "Gauß, Ceres und die Methode der kleinsten Quadrate.", en: "Gauss, Ceres, and the method of least squares." } },
        { label: "Ceres, Dawn (NASA/JPL-Caltech/UCLA/MPS/DLR/IDA), via Wikimedia Commons", url: "https://commons.wikimedia.org/wiki/File:Ceres_-_RC3_-_Haulani_Crater_(22381131691)_(cropped).jpg", why: { de: "Bild von Ceres, Public Domain.", en: "Image of Ceres, public domain." } },
        { label: "The Flammarion Engraving (1888), via Wikimedia Commons", url: "https://commons.wikimedia.org/wiki/File:Flammarion_Woodcut_1888_Color_2.jpg", why: { de: "Kolorierter Flammarion-Holzschnitt, Public Domain.", en: "Coloured Flammarion engraving, public domain." } }
      ]
    }
  ];

  var gaussDataStep = DE ? {
    title: "Gauß und die verrauschten Daten",
    kicker: "Ceres",
    substeps: [
      {
        kicker: "Die Bilder",
        title: "Gauß, Ceres und die Daten",
        body: "Am 1. Januar 1801 entdeckte Giuseppe Piazzi Ceres, den ersten Asteroiden, und verlor ihn nach 41 Tagen Beobachtung hinter der Sonne. Das linke Bild zeigt Ceres, aufgenommen von der NASA-Sonde Dawn; rechts steht der Flammarion-Holzschnitt von 1888, ein Bild für den Blick über den bekannten Himmel hinaus. Carl Friedrich Gauß behandelte die verrauschten Positionen als ein Ganzes und nahm an, dass die wahre Bahn in der Mitte der Fehler liegt. Drücke Weiter: Zuerst kommen die Beobachtungen, dann wird das Teleskop Schritt für Schritt besser.",
        watch: "Drücke Weiter. Zuerst kommen die Beobachtungen, dann wird das Teleskop besser.",
        demoState: { scene: "gauss", phase: "intro" },
        context: "Die Bilder sind eine Einladung: Ceres war ein realer Himmelskörper, und Gauß' Methode war ein realer Umgang mit unsicheren Daten. Die Demo zeigt das Prinzip mit synthetischen Daten.",
        deep: "Piazzi verlor Ceres nach 41 Tagen im Sonnenlicht. Gauß sagte mit der Methode der kleinsten Quadrate voraus, wo sie wieder auftauchen würde (Stigler, 1981).",
        boxes: gaussSteps[0].boxes,
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Verrauschte Beobachtungen",
        title: "Gauß, Ceres und die Daten",
        body: "Die Beobachtungen sind verrauscht: Jeder Punkt liegt neben der wahren Bahn, und die Glockenkurve der Fehler ist breit. Ein einzelner Punkt wäre als Bahn unbrauchbar. Drücke Weiter: Das Teleskop wird besser.",
        watch: "Drücke Weiter und beobachte, wie die Wolke enger wird.",
        demoState: { scene: "gauss", phase: "demo", sigma: 2 },
        context: "Die grüne Linie ist die wahre Bahn; die blauen Punkte sind Beobachtungen; die Glockenkurve rechts zeigt die Fehlerverteilung. Die Daten sind synthetisch, nicht Piazzis originale Messungen.",
        deep: "Ohne Ausgleich müsste man eine Bahn durch einen einzelnen Punkt legen. Gauß nutzte alle Beobachtungen zusammen.",
        boxes: gaussSteps[0].boxes,
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Bessere Teleskope",
        title: "Gauß, Ceres und die Daten",
        body: "Das Teleskop ist besser: Die Wolke zieht sich zusammen, die Glockenkurve wird schmaler. Die wahre Bahn bleibt in der Mitte der Fehler. Drücke Weiter für das beste Teleskop.",
        watch: "Drücke Weiter. Wie schmal wird die Glockenkurve?",
        demoState: { scene: "gauss", phase: "demo", sigma: 1 },
        context: "Je kleiner die Streuung, desto enger liegt die Glockenkurve um die wahre Bahn. Die Beobachtungen bleiben fehlerhaft, aber der Ausgleich wird stabiler.",
        deep: "Die Methode der kleinsten Quadrate minimiert die Summe der quadrierten Abstände, also den mittleren quadratischen Fehler (MSE). Viele kleine Fehler mitteln sich; ein einzelner Ausreißer zählt quadriert.",
        boxes: gaussSteps[0].boxes,
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Ausgleich",
        title: "Gauß, Ceres und die Daten",
        body: "Jetzt liegt die Wolke eng um die Bahn. Gauß' Methode der kleinsten Quadrate wählt die Bahn, die allen Beobachtungen zugleich am nächsten liegt; keine einzelne Messung wird geglaubt. Das ist der mittlere quadratische Fehler (MSE), und dieselbe Regel trainiert noch moderne Modelle. Drücke Weiter zu den Daten.",
        watch: "Drücke Weiter. Was passiert, wenn die Beobachtungen nicht mehr exakt sind?",
        demoState: { scene: "gauss", phase: "demo", sigma: 0.3 },
        context: "Die Glockenkurve ist eng; die wahre Bahn liegt in der Mitte. Der Ausgleich glaubt keiner einzelnen Messung, sondern wählt die Kurve, die allen zugleich am nächsten bleibt; minimiert wird der mittlere quadratische Fehler (MSE).",
        deep: "Dieselbe Arithmetik erscheint in jedem trainierten Netz: Ein Modell ist eine Kurve, die Daten sind verrauschte Punkte, und das Training wählt die Gewichte, deren Vorhersagen im Durchschnitt am nächsten an den Beobachtungen liegen.",
        boxes: gaussSteps[0].boxes,
        sources: gaussSteps[0].sources
      }
    ]
  } : {
    title: "Gauss and the noisy data",
    kicker: "Ceres",
    substeps: [
      {
        kicker: "The images",
        title: "Gauss, Ceres, and the data",
        body: "On 1 January 1801 Giuseppe Piazzi discovered Ceres, the first asteroid, and lost it behind the Sun after 41 days of observation. The left image shows Ceres, taken by NASA's Dawn spacecraft; on the right is the Flammarion engraving from 1888, an image for looking beyond the known sky. Carl Friedrich Gauss treated the noisy positions as a whole and assumed that the true orbit lies in the middle of the errors. Press Next: first come the observations, then the telescope improves step by step.",
        watch: "Press Next. First come the observations, then the telescope improves.",
        demoState: { scene: "gauss", phase: "intro" },
        context: "The images are an invitation: Ceres was a real body, and Gauss's method was a real way of handling uncertain data. The demo shows the principle with synthetic data.",
        deep: "Piazzi lost Ceres in the sunlight after 41 days. Gauss predicted with least squares where it would reappear (Stigler, 1981).",
        boxes: gaussSteps[0].boxes,
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Noisy observations",
        title: "Gauss, Ceres, and the data",
        body: "The observations are noisy: every point lies beside the true orbit, and the bell curve of errors is wide. A single point would be useless as an orbit. Press Next: the telescope improves.",
        watch: "Press Next and watch the cloud tighten.",
        demoState: { scene: "gauss", phase: "demo", sigma: 2 },
        context: "The green line is the true orbit; the blue points are observations; the bell curve on the right shows the error distribution. The data are synthetic, not Piazzi's original measurements.",
        deep: "Without fitting, one would have to put an orbit through a single point. Gauss used all observations together.",
        boxes: gaussSteps[0].boxes,
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Better telescopes",
        title: "Gauss, Ceres, and the data",
        body: "The telescope is better: the cloud contracts, the bell curve narrows. The true orbit stays in the middle of the errors. Press Next for the best telescope.",
        watch: "Press Next. How narrow does the bell curve become?",
        demoState: { scene: "gauss", phase: "demo", sigma: 1 },
        context: "The smaller the spread, the tighter the bell curve around the true orbit. The observations remain noisy, but the fit becomes more stable.",
        deep: "Least squares minimises the sum of squared distances, the mean squared error (MSE). Many small errors average out; a single outlier counts squared.",
        boxes: gaussSteps[0].boxes,
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Fitting",
        title: "Gauss, Ceres, and the data",
        body: "Now the cloud lies tightly around the orbit. Gauss's least squares chooses the orbit closest to all observations at once; no single measurement is trusted. That is the mean squared error (MSE), and the same rule still trains modern models. Press Next to the data.",
        watch: "Press Next. What happens when the observations are no longer exact?",
        demoState: { scene: "gauss", phase: "demo", sigma: 0.3 },
        context: "The bell curve is narrow; the true orbit lies in the middle. The fit trusts no single measurement and chooses the curve closest to all of them at once; it minimises the mean squared error (MSE).",
        deep: "The same arithmetic appears in every trained network: a model is a curve, the data are noisy points, and training chooses the weights whose predictions are closest to the observations on average.",
        boxes: gaussSteps[0].boxes,
        sources: gaussSteps[0].sources
      }
    ]
  };

  var codeAttentionSubstep = {
    kicker: "Code",
    title: "Attention verschiebt Bedeutungen in Kontexte",
    body: "„def quick_sort“ und „function quickSort“ sehen verschieden aus, meinen aber dasselbe: einen abstrakten Funktionsaufruf, der auf einen abstrakten Quicksort-Knoten zeigt. Die Unterschiede sind Oberflächenrauschen: Sprache, Schreibweise, Satzzeichen. Attention liest den Kontext, erkennt, was relevant ist, und verschiebt die Tokens auf die gemeinsame abstrakte Repräsentation. Klicke Beide, Python oder JavaScript.",
    watch: "Klicke die drei Modi. Landen def und function auf demselben Knoten?",
    demoState: { scene: "codesemantic", semMode: "both" },
    context: "Die linke Seite ist die Oberfläche: verschiedene Schreibweisen. Die rechte Seite ist die abstrakte Bedeutung: Funktionsaufruf → Quicksort. Attention entfernt nicht die Wörter, sondern verschiebt ihre Repräsentation.",
    deep: "Dasselbe Muster gilt für andere Paare: class/struct, return/yield, if/when. Die Oberfläche variiert mit Sprache und Stil; die abstrakte Rolle bleibt. In einem echten Modell sind diese Richtungen gelernt und viel komplexer.",
    boxes: [
      box("sem-1", "Technik", "Oberfläche und Bedeutung", "def und function sind verschiedene Oberflächen für dieselbe Rolle: eine Funktionsdefinition. quick_sort und quickSort sind verschiedene Oberflächen für dieselbe Rolle: Quicksort. Attention gewichtet den Kontext und verschiebt die Tokens auf gemeinsame Richtungen."),
      box("sem-2", "Beispiel", "Andere Paare", "class/struct, return/yield, if/when: Die Schreibweise ändert sich, die abstrakte Rolle nicht. Das Modell lernt diese gemeinsamen Richtungen aus vielen Kontexten."),
      box("sem-3", "Grenze", "Was ist vereinfacht?", "Die Demo zeigt wenige Wörter und zwei abstrakte Knoten. Ein echtes Modell hat Tausende Dimensionen und viele überlappende Rollen. Die Pfeile sind eine didaktische Vereinfachung, keine Messung.")
    ],
    sources: [{ label: "Tenney et al. (2019), BERT Rediscovers the Classical NLP Pipeline", url: "https://aclanthology.org/P19-1356/", why: { de: "Schichten bilden linguistische Rollen heraus.", en: "Layers develop linguistic roles." } }]
  };
  var attentionContextStep = {
    title: "Attention verschiebt Bedeutungen in Kontexte",
    kicker: "Bank → Code",
    substeps: [attentionSteps[1], codeAttentionSubstep]
  };

  var neuralStep = {
    title: "Was sind neuronale Netze?",
    kicker: "Aktivierung → Raum",
    substeps: [activationSteps[0], insideSteps[0], gradientSteps[0], neuralLargeSteps[0], mlpSteps[0]]
  };
  var neuralStepA = {
    title: DE ? "Was sind neuronale Netze?" : "What are neural networks?",
    kicker: DE ? "Aktivierung · 1 Neuron" : "Activation · 1 neuron",
    substeps: [activationSteps[0], insideSteps[0]]
  };
  var neuralStepB = {
    title: DE ? "Was sind neuronale Netze?" : "What are neural networks?",
    kicker: DE ? "Loss · großes Netz · Raum" : "Loss · large net · space",
    substeps: [gradientSteps[0], neuralLargeSteps[0], mlpSteps[0]]
  };

  var embeddingMergeStep = {
    title: DE ? "Bedeutung wird Geometrie" : "Meaning becomes geometry",
    kicker: DE ? "1D · 2D · 3D · Tabelle" : "1D · 2D · 3D · table",
    substeps: [embedSteps[0], embedSteps[1], embedSteps[2]]
  };
  var attentionMergeStep = {
    title: DE ? "Kontext zieht die Bank an seinen Platz" : "Context pulls the bank into place",
    kicker: DE ? "Attention" : "Attention",
    body: DE ? "Drei Sätze, dasselbe Wort: Bank ohne Kontext, Bank für Geld, Bank im Park. Klicke einen Satz oder drücke Weiter; die Matrix zeigt, wohin die Bank schaut. Attention lässt jedes Token die anderen lesen, entscheiden, welche zählen, und ihre Information in den eigenen Vektor ziehen." : "Three sentences, one word: a bank without context, a bank for money, a bank in the park. Click a sentence or press Next; the matrix shows where the bank looks. Attention lets each token read the others, decide which matter, and pull their information into its vector.",
    watch: DE ? "Klicke die drei Sätze oder drücke Weiter. Welches Wort zieht die Bank?" : "Click the three sentences or press Next. Which word pulls the bank?",
    demoState: { scene: "attention", context: "none" },
    context: attentionSteps[1].context,
    deep: attentionSteps[1].deep,
    boxes: attentionSteps[1].boxes.concat(attentionSteps[0].boxes),
    sources: attentionSteps[1].sources
  };

  var steps = [introSteps[0], bookSteps[0], insideSteps[1], gaussDataStep, languageSteps[0], tokenizeSteps[0], embeddingMergeStep, manifoldSteps[0], positionSteps[0], attentionMergeStep, codeAttentionSubstep, neuralStepA, neuralStepB, ffnSteps[0], residualSteps[0], unembedSteps[0], softmaxSteps[0], introSteps[1], meadowSteps[0], trajectorySteps[0], posttrainSteps[0], evalSteps[0], ragSteps[0], historySteps[0], philosophySteps[0]];

  var day = {
    id: "intuition",
    track: "transformer",
    label: DE ? "Intuition" : "Intuition",
    kicker: DE ? "Im Transformer · Bedeutung wird Geometrie" : "Inside the transformer · Meaning becomes geometry",
    title: DE ? "Ein Wort nach dem anderen" : "One word after another",
    demo: "intuition",
    steps: steps,
    boxes: [
      box("emb-day", DE ? "Mathematik" : "Mathematics",
        DE ? "Die ganze Rechnung" : "The whole calculation",
        DE ? "Ein Embedding ist eine gelernte Tabelle: eine Zeile pro Token. Der Startvektor eines Tokens ist die Zeile zu seiner ID. Zwei Vektoren sind sich ähnlich, wenn der Winkel zwischen ihnen klein ist. Die Demo zeigt nur zwei oder drei Achsen; ein echtes Modell nutzt Tausende." : "An embedding is a learned table: one row per token. A token's starting vector is the row for its ID. Two vectors are similar when the angle between them is small. The demo shows only two or three axes; a real model uses thousands.",
        DE ? "\\underbrace{\\begin{aligned} E &\\in \\mathbb{R}^{|V|\\times d} \\\\ e_t &= \\underbrace{E[\\,\\mathrm{id}(t)\\,]}_{\\text{Zeile des Tokens}} \\\\ \\operatorname{sim}(a,b) &= \\underbrace{\\cos(e_a,e_b)}_{\\text{Winkel zwischen den Vektoren}} \\end{aligned}}_{\\substack{\\text{so wird aus einer ID ein Vektor}\\\\ \\text{und aus zwei Vektoren eine Ähnlichkeit}}}" : "\\underbrace{\\begin{aligned} E &\\in \\mathbb{R}^{|V|\\times d} \\\\ e_t &= \\underbrace{E[\\,\\mathrm{id}(t)\\,]}_{\\text{row of the token}} \\\\ \\operatorname{sim}(a,b) &= \\underbrace{\\cos(e_a,e_b)}_{\\text{angle between the vectors}} \\end{aligned}}_{\\substack{\\text{an ID becomes a vector}\\\\ \\text{and two vectors become a similarity}}}")
    ],
    sources: sources
  };

  LearnSys.mount(document.getElementById("learnsys"), {
    lang: DE ? "de" : "en",
    days: [day],
    tracks: [{ id: "transformer", label: DE ? "Im Transformer" : "Inside the transformer", days: "Intuition" }],
    mix: true,
    singleDay: true,
    startDay: 0,
    typeset: function (scope) {
      if (window.TM && typeof TM.typesetMath === "function") TM.typesetMath(scope);
    }
  });

  var nav = document.getElementById("ls-navbar");
  if (nav) {
    var lang = document.createElement("button");
    lang.type = "button";
    lang.className = "ls-btn ls-btn--tiny ls-lang-btn";
    lang.textContent = DE ? "EN" : "DE";
    lang.setAttribute("aria-label", DE ? "Switch to English" : "Auf Deutsch wechseln");
    lang.setAttribute("data-no-height-test", "1");
    lang.addEventListener("click", function () {
      if (window.TM && typeof TM.setLang === "function") TM.setLang(DE ? "en" : "de");
    });
    nav.appendChild(lang);
  }
})();
