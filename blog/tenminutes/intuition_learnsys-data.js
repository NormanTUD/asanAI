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
      title: "Wie funktionieren Sprachmodelle?",
      body: "Sprachmodelle können sehr viele sehr verschiedene Aufgaben bearbeiten, aber wie funktionieren sie? Jeden Tag werden wir einen Teil der Technik von modernen <b>L</b>arge <b>L</b>anguage <b>M</b>odels betrachten, und eine Intuition liefern, wie diese funktionieren, die man versteht, aber die gleichzeitig auch techniknah ist.",
      teaser: "Sprachmodelle können sehr viele sehr verschiedene Aufgaben bearbeiten, aber wie funktionieren sie? Jeden Tag werden wir einen Teil der Technik von modernen <b>L</b>arge <b>L</b>anguage <b>M</b>odels betrachten, und eine Intuition liefern, wie diese funktionieren, die man versteht, aber die gleichzeitig auch techniknah ist.",
      demoState: { scene: "media", step: 0 },
      inherit: false,
      questionGroups: [
        {
          id: "g-basics",
          title: "Eine Ebene tiefer",
          questions: [
            { id: "q-edit-1794746257458-0", title: "Die gleichen Prinzipien", body: "Textzusammenfassungen, Chatbots, Agents: alle arbeiten nach dem gleichen Prinzip. Wir werden hier speziell generative LLM untersuchen, aber die Modelle funktionieren meist nach sehr ähnlichen Prinzipien.", tex: "", kind: "trivia" }
          ]
        },
        {
          id: "g-sources",
          title: "Quellen",
          sources: []
        }
      ]
    },
    {
      kicker: "Die Schleife",
      title: "Ein Wort nach dem anderen",
      body: "Jetzt schließt sich der Kreis. Der letzte Vektor $h$ wird über $W_U$ zu Logits, Softmax macht daraus eine Verteilung, und ein Token wird gezogen. Dann hängst du es an den Kontext, und Attention, FFN und Unembedding laufen von vorn. Vervollständige „Es war einmal ein …“ Wort für Wort: Bei jedem Schritt zieht die Demo das nächste Token aus der Verteilung. Greedy, Sampling und Top-p lesen dieselben Wahrscheinlichkeiten unterschiedlich. Am Ende steht <|endoftext|>; sobald das Modell es zieht, endet die Schleife. Die Landschaft ist eine vereinfachte Demo.",
      watch: "Vervollständige „Es war einmal ein …“ Wort für Wort, bis <b><|endoftext|></b> kommt. Klicke ein früheres Wort an, um dorthin zurückzuspringen. Die Landschaft ist nur ein vereinfachtes Bild.",
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
      title: "How do language models work?",
      body: "Language models can handle many very different tasks, but how do they work? Every day we will look at one part of the technology behind modern <b>L</b>arge <b>L</b>anguage <b>M</b>odels and build an intuition for how they work, one you can understand and that stays close to the technology.",
      teaser: "Language models can handle many very different tasks, but how do they work? Every day we will look at one part of the technology behind modern <b>L</b>arge <b>L</b>anguage <b>M</b>odels and build an intuition for how they work, one you can understand and that stays close to the technology.",
      demoState: { scene: "media", step: 0 },
      inherit: false,
      questionGroups: [
        {
          id: "g-basics",
          title: "One level deeper",
          questions: [
            { id: "q-edit-1794746257458-0", title: "The same principles", body: "Summaries, chatbots, agents: they all work on the same principle. Here we look specifically at generative LLMs, but most models work in very similar ways.", tex: "", kind: "trivia" }
          ]
        },
        {
          id: "g-sources",
          title: "Sources",
          sources: []
        }
      ]
    },
    {
      kicker: "The loop",
      title: "One word after another",
      body: "Now the circle closes. The last vector $h$ becomes logits through $W_U$, softmax turns them into a distribution, and one token is drawn. Then you append it to the context, and attention, FFN, and unembedding run again. Complete “Once upon a time there was …” word by word: at each step the demo draws the next token from the distribution. Greedy, sampling, and top-p read the same probabilities differently. At the end comes <|endoftext|>; as soon as the model draws it, the loop stops. The landscape is a simplified demo.",
      watch: "Complete “Once upon a time there was …” word by word until <b><|endoftext|></b> appears. Click an earlier word to jump back to it. The landscape is only a simplified picture.",
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
      body: "Wenn man Worten Zahlen zuweist, kann man mit ihnen rechnen wie mit Zahlen. Man kann dann sagen, dass heiß - warm = 100 - 55 = 45 ist, und 45 liegt näher an warm als an kalt. Zieht man also von heiß warm ab, landet man wieder bei warm.\n\nDas ist natürlich ein sehr vereinfachtes Beispiel, hier kann man genau eine Korrelation darstellen. Daher nutzt man viel höherdimensionale Räume.",
      watch: "",
      demoState: { scene: "embedding", mode: "temperature", dim: 0, pair: ["cold", "warm"] },
      inherit: false,
      questionGroups: [
        {
          id: "g-basics",
          title: DE ? "Eine Ebene tiefer" : "One level deeper",
          questions: [
            { id: "q-deep", title: DE ? "Einschränkungen hier" : "Limitations here", body: DE ? "Die Positionen sind hier von Hand gewählt, damit die Rechnungen stimmen. In einem Modell werden sie aus vielen Beispielen gelernt." : "The positions are chosen by hand here so the arithmetic works out. In a model they are learned from many examples.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-lens-mathematik",
          title: DE ? "Mathematik" : "Mathematics",
          questions: [
            { id: "q-box-emb-1", title: DE ? "Was ist ein Vektor?" : "What is a vector?", body: DE ? "Ein Vektor ist ein Element eines Vektorraums. In der Praxis ist er eine geordnete Liste von Zahlen, die einen Punkt oder eine Richtung beschreibt. Die Richtung ist in LLM oft wichtiger als die Länge." : "A vector is an element of a vector space. In practice it is an ordered list of numbers that describes a point or a direction. In LLMs, direction often matters more than length.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-lens-geschichte",
          title: DE ? "Geschichte" : "History",
          questions: [
            { id: "q-box-emb-2", title: DE ? "Woher kommt die Idee?" : "Where does the idea come from?", body: DE ? "Firth (1957): „You shall know a word by the company it keeps.“ Harris (1954) hatte die distributionelle Idee vorher formuliert. Wörter, die in ähnlichen Kontexten auftreten, bekommen ähnliche Vektoren." : "Firth (1957): “You shall know a word by the company it keeps.” Harris (1954) formulated the distributional idea earlier. Words that appear in similar contexts receive similar vectors.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-lens-optional",
          title: DE ? "Optional" : "Optional",
          questions: [
            { id: "q-box-emb-clean", title: DE ? "Sind echte Embeddings so sauber?" : "Are real embeddings this clean?", body: DE ? "Nein. Die Demo trennt Temperatur, Macht und Geschlecht sauber, weil die Achsen von Hand gewählt sind. In echten Modellen sind Achsen gelernte Richtungen, keine benannten Eigenschaften. Temperatur, Stil, Thema und Sprache überlagern sich; Cluster überlappen, Wörter liegen schief im Raum, und dieselbe Richtung kann mehrere Bedeutungen tragen (Superposition). Die gerade Linie ist eine didaktische Projektion, keine Messung." : "No. The demo separates temperature, power, and gender cleanly because the axes are chosen by hand. In real models, axes are learned directions, not named properties. Temperature, style, topic, and language overlap; clusters overlap, words lie askew in space, and the same direction can carry several meanings (superposition). The straight line is a didactic projection, not a measurement.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-sources",
          title: DE ? "Quellen" : "Sources",
          sources: [
            { label: "Harris (1954), Distributional Structure", url: "https://www.its.caltech.edu/~matilde/ZelligHarrisDistributionalStructure1954.pdf", why: { de: "Begründet Bedeutung aus dem sprachlichen Kontext.", en: "Grounds meaning in linguistic context." } },
            { label: "Firth (1957), A Synopsis of Linguistic Theory", url: "https://archive.org/details/papersinlinguist0000firt", why: { de: "Klassische Formel: Bedeutung zeigt sich im sprachlichen Umfeld.", en: "Classic formula: meaning shows in a word's company." } },
            { label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781", why: { de: "word2vec: gelernte Wortvektoren und Vektorarithmetik.", en: "word2vec: learned word vectors and vector arithmetic." } },
            { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/", why: { de: "GloVe: globale Kookkurrenz als Wortvektoren.", en: "GloVe: global co-occurrence as word vectors." } }
          ]
        }
      ]
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
      body: "Eine dritte Achse hebt die Ebene in einen Raum. Jetzt können dieselben Punkte neben Macht und Geschlecht auch Rang tragen. Zusätzlich erscheinen Punkte, die es in 2D noch nicht gab: auf einer unteren Ebene Tiere wie Rüde und Hündin, auf einer oberen Ebene Figuren aus Geschichten wie Zauberer und Zauberin. Sie liegen in denselben Verhältnissen; das Geschlecht ist überall dieselbe Richtung. Jede Ansicht ist eine Projektion: Linien, die sich auf dem Bildschirm kreuzen, müssen sich im vollen Raum nicht berühren. Jedes Wort ist ein Pfeil vom Ursprung: Die Richtung trägt die Bedeutung, die Länge ist Nebensache. Ziehe die Ansicht und beobachte, welche Richtung stabil bleibt. Die Tabelle zeigt zuerst die drei Dimensionen, die du siehst; ein Klick auf „4096 Dimensionen“ wechselt direkt zur vollen Rechner-Tabelle.",
      watch: "Drehe die Ansicht. Welche Richtung bleibt für alle Paare gleich? Öffne am Ende die Tabelle der drei Dimensionen und danach die 4096-Dimensionen-Tabelle.",
      demoState: { scene: "embedding", mode: "space", dim: 2, selected: "king", arithmetic: "king-man-woman", tables: true },
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
      body: "When you assign numbers to words, you can do arithmetic with them as with numbers. You can then say that hot − warm = 100 − 55 = 45, and 45 is closer to warm than to cold. So if you subtract warm from hot, you land near warm again.\n\nThis is of course a very simplified example; here you can show exactly one correlation. That is why much higher-dimensional spaces are used.",
      watch: "",
      demoState: { scene: "embedding", mode: "temperature", dim: 0, pair: ["cold", "warm"] },
      inherit: false,
      questionGroups: [
        {
          id: "g-basics",
          title: DE ? "Eine Ebene tiefer" : "One level deeper",
          questions: [
            { id: "q-deep", title: DE ? "Einschränkungen hier" : "Limitations here", body: DE ? "Die Positionen sind hier von Hand gewählt, damit die Rechnungen stimmen. In einem Modell werden sie aus vielen Beispielen gelernt." : "The positions are chosen by hand here so the arithmetic works out. In a model they are learned from many examples.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-lens-mathematik",
          title: DE ? "Mathematik" : "Mathematics",
          questions: [
            { id: "q-box-emb-1", title: DE ? "Was ist ein Vektor?" : "What is a vector?", body: DE ? "Ein Vektor ist ein Element eines Vektorraums. In der Praxis ist er eine geordnete Liste von Zahlen, die einen Punkt oder eine Richtung beschreibt. Die Richtung ist in LLM oft wichtiger als die Länge." : "A vector is an element of a vector space. In practice it is an ordered list of numbers that describes a point or a direction. In LLMs, direction often matters more than length.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-lens-geschichte",
          title: DE ? "Geschichte" : "History",
          questions: [
            { id: "q-box-emb-2", title: DE ? "Woher kommt die Idee?" : "Where does the idea come from?", body: DE ? "Firth (1957): „You shall know a word by the company it keeps.“ Harris (1954) hatte die distributionelle Idee vorher formuliert. Wörter, die in ähnlichen Kontexten auftreten, bekommen ähnliche Vektoren." : "Firth (1957): “You shall know a word by the company it keeps.” Harris (1954) formulated the distributional idea earlier. Words that appear in similar contexts receive similar vectors.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-lens-optional",
          title: DE ? "Optional" : "Optional",
          questions: [
            { id: "q-box-emb-clean", title: DE ? "Sind echte Embeddings so sauber?" : "Are real embeddings this clean?", body: DE ? "Nein. Die Demo trennt Temperatur, Macht und Geschlecht sauber, weil die Achsen von Hand gewählt sind. In echten Modellen sind Achsen gelernte Richtungen, keine benannten Eigenschaften. Temperatur, Stil, Thema und Sprache überlagern sich; Cluster überlappen, Wörter liegen schief im Raum, und dieselbe Richtung kann mehrere Bedeutungen tragen (Superposition). Die gerade Linie ist eine didaktische Projektion, keine Messung." : "No. The demo separates temperature, power, and gender cleanly because the axes are chosen by hand. In real models, axes are learned directions, not named properties. Temperature, style, topic, and language overlap; clusters overlap, words lie askew in space, and the same direction can carry several meanings (superposition). The straight line is a didactic projection, not a measurement.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-sources",
          title: DE ? "Quellen" : "Sources",
          sources: [
            { label: "Harris (1954), Distributional Structure", url: "https://www.its.caltech.edu/~matilde/ZelligHarrisDistributionalStructure1954.pdf", why: { de: "Begründet Bedeutung aus dem sprachlichen Kontext.", en: "Grounds meaning in linguistic context." } },
            { label: "Firth (1957), A Synopsis of Linguistic Theory", url: "https://archive.org/details/papersinlinguist0000firt", why: { de: "Klassische Formel: Bedeutung zeigt sich im sprachlichen Umfeld.", en: "Classic formula: meaning shows in a word's company." } },
            { label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781", why: { de: "word2vec: gelernte Wortvektoren und Vektorarithmetik.", en: "word2vec: learned word vectors and vector arithmetic." } },
            { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/", why: { de: "GloVe: globale Kookkurrenz als Wortvektoren.", en: "GloVe: global co-occurrence as word vectors." } }
          ]
        }
      ]
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
      body: "A third axis lifts the plane into a space. Now the same points can carry rank as well as power and gender. Additional points appear that did not exist in 2D: animals such as a male dog and a female dog on a lower level, fictional figures such as a wizard and a sorceress on an upper level. They sit in the same relations; gender is the same direction everywhere. Every view is a projection: lines that cross on screen need not touch in the full space. Every word is an arrow from the origin: the direction carries the meaning, the length is secondary. Drag the view and watch which direction stays stable. The table first shows the three dimensions you see; one click on “4096 dimensions” switches straight to the full table for the computer.",
      watch: "Rotate the view. Which direction stays the same for all pairs? At the end, open the table of the three dimensions and then the 4096-dimension table.",
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
      body: "Ein Token allein weiß nicht, wo es steht: „Hund“ kann an jeder Stelle im Satz auftreten. Damit die Reihenfolge zählt, kodieren wir die Position in den Token-Vektor. Dafür gibt es viele Methoden; die Demo zeigt eine sinusförmige Variante. Viele moderne Modelle wie Llama nutzen RoPE, das die Richtung des Vektors mit der Position dreht. Wichtig ist: Die Position wird Teil des Tokens, und alle folgenden Schichten sehen diese Version. Die Demo zeigt nur drei Dimensionen; im echten Modell liegt der Vektor im hochdimensionalen Raum auf der Oberfläche einer Hyperkugel.",
      watch: "Bewege den Positionsregler. Wie verändert sich der Vektor, und wie wächst der Abstand auf der Kreisbahn?",
      demoState: { scene: "position" },
      context: "Die Position wird als Summe von Wellen auf Kreisbahnen kodiert: Jede Dimension hat eine andere Frequenz. Die Vektoren liegen auf der Einheitskugel; die gezeigte 3D-Kugel ist nur eine Projektion der Hyperkugel. Gemessen wird der Großkreis zwischen den Richtungen, nicht der euklidische Abstand: Längen zählen nicht, nur der Winkel. So zeigt der Fingerabdruck, wie nah zwei Positionen in ihrer Richtung liegen.",
      deep: "Die Demo zeigt nur die ersten drei Dimensionen. In einem echten Modell sind es Tausende; die Großkreis-Metrik macht Richtungen vergleichbar, und schnelle und langsame Rotationen bilden zusammen ein Positionsmuster, das das Modell lernen kann.",
      boxes: [
        box("pos-1", "Methoden", "Welche Positionsverfahren gibt es?", "Gelernte absolute Embeddings (GPT-2, BERT), sinusförmige Kodierung (Vaswani et al. 2017), relative Position Bias (T5) und ALiBi (Press et al. 2021). RoPE (Su et al. 2021) dreht Query und Key; viele moderne Modelle wie Llama nutzen es."),
        box("pos-2", "RoPE", "Wie funktioniert RoPE?", "RoPE dreht Query- und Key-Vektoren um einen Winkel, der von der Position abhängt. Das Skalarprodukt zweier gedrehter Vektoren hängt dann von ihrer relativen Position ab: Absolute Position wird als Rotation kodiert, relative Abstände werden sichtbar."),
        box("pos-3", "Stellenwertsystem", "Warum schnelle und langsame Rotationen?", "Verschiedene Dimensionen drehen unterschiedlich schnell. Schnelle Rotationen unterscheiden nahe Positionen, langsame unterscheiden weit entfernte. Zusammen wirkt das wie ein Stellenwertsystem aus Einern, Zehnern und Hundertern für Positionen."),
        box("pos-4", "Geometrie", "Was zeigt der Plot?", "Die Demo nutzt die Großkreis-Metrik: Richtungen zählen, nicht Längen. Jeder grüne Punkt ist dasselbe Wort an einer anderen Position. Im hochdimensionalen Raum liegen die Vektoren auf einer Hyperkugel; die 3D-Kugel ist nur eine Projektion. So entstehen Muster, mit denen das Modell „Drache an Position 5“ oder „Drache an Position 22“ kodiert."),
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
      body: "A token on its own does not know where it stands: “dog” can appear anywhere in the sentence. For order to matter, we encode the position into the token vector. There are many methods; the demo shows a sinusoidal variant. Many modern models such as Llama use RoPE, which rotates the direction of the vector with the position. What matters is this: the position becomes part of the token, and every following layer sees that version. The demo shows only three dimensions; in a real model the vector lies in high-dimensional space on the surface of a hypersphere.",
      watch: "Move the position slider. How does the vector change, and how does the distance in the plot change?",
      demoState: { scene: "position" },
      context: "The position is encoded as a sum of waves on circular orbits: every dimension has a different frequency. The vectors lie on the unit sphere; the 3D sphere shown here is only a projection of the hypersphere. We measure the great circle between the directions, not the Euclidean distance: lengths do not count, only the angle. The fingerprint shows how close two positions are in direction.",
      deep: "The demo shows only the first three dimensions. A real model uses thousands; the great-circle metric makes directions comparable, and fast and slow rotations together form a position pattern the model can learn.",
      boxes: [
        box("pos-1", "Methods", "Which positional methods exist?", "Learned absolute embeddings (GPT-2, BERT), sinusoidal encoding (Vaswani et al. 2017), relative position bias (T5), and ALiBi (Press et al. 2021). RoPE (Su et al. 2021) rotates query and key; many modern models such as Llama use it."),
        box("pos-2", "RoPE", "How does RoPE work?", "RoPE rotates query and key vectors by an angle that depends on the position. The dot product of two rotated vectors then depends on their relative position: absolute position is encoded as a rotation, and relative distances become visible."),
        box("pos-3", "Place value", "Why fast and slow rotations?", "Different dimensions rotate at different speeds. Fast rotations distinguish nearby positions, slow rotations distinguish distant ones. Together they act like a place-value system of ones, tens, and hundreds for positions."),
        box("pos-4", "Geometry", "What does the plot show?", "The demo uses the great-circle metric: directions matter, not lengths. Every green point is the same word at a different position. In high-dimensional space the vectors lie on a hypersphere; the 3D sphere is only a projection. This creates patterns the model can use to encode “dragon at position 5” or “dragon at position 22”."),
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
      demoState: { scene: "attention" },
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
      body: "Drei Sätze, dasselbe Wort: Bank ohne Kontext, Bank für Geld, Bank im Park. Klicke einen Satz und ein Wort. Die Matrix zeigt, wohin die Bank schaut; die Formel zeigt dieselben Gewichte. Drücke Weiter: Die nächste Folie zeigt, wie Attention Oberflächenrauschen in Code ignoriert.",
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
  ] : [
    {
      kicker: "Attend",
      title: "Context pulls the bank into place",
      body: "How does a word know which neighbours matter? Self-attention lets each token look at the others, decide which matter, and pull their information into its vector. That is how “bank” moves toward the money or park reading. Click any word to see its row. A real layer has many heads; the demo shows one.",
      watch: "Click a word. Which neighbours receive attention?",
      demoState: { scene: "attention" },
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
  ];

  var ffnSteps = DE ? [
    {
      kicker: "Feed-Forward-Netzwerk (FFN)",
      title: "Die Rolle von neuronalen Netzen im Transformer",
      body: "Das FFN ist ein kleines MLP pro Token: Dense, Aktivierung, Dense. Die Punkte unten sind symbolisch; im echten Modell liegen die Muster nichtlinear in einem hochdimensionalen Raum. Das MLP hebt sie in einen höheren Raum, macht die Cluster trennbarer und projiziert zurück. So isoliert es Bedeutungen und reicht eine abstraktere Repräsentation weiter. Attention mischt Tokens; das FFN macht die verworrenen Strukturen innerhalb eines Tokens trennbarer. Klicke die beiden Kontexte und biege den Raum, bis eine Ebene trennt.",
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
      kicker: "Feed-forward network (FFN)",
      title: "The role of neural networks in the transformer",
      body: "The FFN is a small MLP per token: dense, activation, dense. The points below are symbolic; in a real model the patterns lie nonlinearly in a high-dimensional space. The MLP lifts them into a higher space, makes the clusters more separable, and projects back. That is how it isolates meanings and passes on a more abstract representation. Attention mixes tokens; the FFN makes the entangled structures inside one token more separable. Click the two contexts and bend the space until a plane separates them.",
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
      body: "Illustrative Scores für zwei Prompts. Links steht der rohe Logit, rechts das, was Softmax daraus macht. Wechsle den Kontext und beobachte, wie sich die ganze Verteilung verschiebt. Die Temperatur entscheidet, wie scharf der Gewinner bevorzugt wird.",
      watch: "Drücke Weiter für den zweiten Prompt. Fahre über ein Token und ändere die Temperatur. Was ändert sich, was bleibt?",
      demoState: { scene: "softmax" },
      context: "Softmax erzeugt nicht die Reihenfolge; die Skalarprodukte tun das. Es macht aus Scores eine Verteilung, die zu eins summiert.",
      deep: "Warum exp und nicht Logit durch Summe? Logits können negativ sein. Die Exponentialfunktion macht jeden Wert positiv und erhält die Reihenfolge; die Division durch die Summe ergibt Wahrscheinlichkeiten. Der absolute Offset ist willkürlich; Softmax hängt nur von Unterschieden ab.",
      boxes: [
        box("sm-1", "Mathematik", "Die Formel", "p_i = exp(z_i) / Σ_j exp(z_j). Vorher wird oft das Maximum abgezogen, damit die Exponentialfunktion stabil bleibt."),
        box("sm-2", "Temperatur", "Was macht T?", "p_i ∝ exp(z_i / T). T < 1 schärft, T > 1 flacht ab. Die Rangfolge bleibt, die Masse verschiebt sich."),
        box("sm-mis", "Grenze", "Erzeugt Softmax das Ranking?", "Nein. Die Reihenfolge kommt aus den Logits. Softmax macht aus Scores eine positive Verteilung, die zu 1 summiert; Temperatur ändert die Schärfe, nicht die Reihenfolge.")
      ],
      sources: [{ label: "Goodfellow, Bengio & Courville (2016), Deep Learning", url: "https://www.deeplearningbook.org/", why: { de: "Softmax, Logits und Temperatur.", en: "Softmax, logits, and temperature." } }]
    }
  ] : [
    {
      kicker: "Softmax",
      title: "From logits to a distribution",
      body: "Illustrative scores for two prompts. The left side is the raw logit, the right side is what softmax makes of it. Switch the context and watch the whole distribution shift. Temperature decides how sharply the winner is favoured.",
      watch: "Press Next for the second prompt. Hover a token and change the temperature. What changes, what stays?",
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

  var insideSteps = DE ? [

    {
      kicker: "1 Neuron",
      title: "Was sind neuronale Netze?",
      body: "Ein neuronales Netz ist zuerst eine parametrisierte Funktion. Das kleinste Beispiel ist ein Neuron: ŷ = w·x + b. Es hat zwei Parameter und kann nur eine Gerade zeichnen. Die Demo zeigt genau das: Die Gerade passt sich an die Punkte an, aber sie kann den Sinus nur grob annähern, nicht biegen. Die vertikalen Striche sind die Fehler. Im nächsten Schritt wird aus diesen Fehlern eine Loss-Landschaft.",
      watch: "Starte das Training. Wie reagiert die Gerade? Warum bleiben die Fehler groß?",
      demoState: { scene: "model", phase: "linear" },
      context: "Der Loss wird nur auf den Trainingspunkten berechnet. Außerhalb gibt es keine Daten; die Kurve ist eine Extrapolation.",
      deep: "Ein Neuron rechnet z = w x + b. Die Gerade hat nur zwei Parameter. Sie kann eine nichtlineare Funktion nicht approximieren, egal wie lange sie trainiert. Erst Aktivierungen und mehrere Schichten erzeugen Knicke und Kurven.",
      boxes: [
        box("mod-0", "Idee", "Was ist ein Modell?", "Ein Modell ist eine parametrisierte Funktion, die aus Eingaben Ausgaben schätzt. Beim Training werden die Parameter so angepasst, dass die Ausgaben zu den Daten passen."),
        box("mod-layer", "Mathematik", "Das Neuron", "Ein Input, ein Neuron: z = w x + b; a = activation(z); Ausgabe = v a + c. w, b, v und c sind Parameter. Mehr Neuronen und Schichten komponieren solche Funktionen.", "\\underbrace{z}_{\\text{Input des Neurons}} = \\underbrace{w x + b}_{\\text{lineare Schicht}} \\qquad \\underbrace{a}_{\\text{Aktivierung}} = \\underbrace{\\operatorname{activation}(z)}_{\\text{Knick oder Kurve}}"),
        box("mod-line", "Grenze", "Warum reicht eine Gerade nicht?", "Ein einzelnes Neuron ist eine lineare Funktion. Es kann den Sinus nur grob annähern, egal wie lange es trainiert. Erst die Aktivierung zwischen mehreren Schichten erzeugt Knicke und Kurven."),
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
      body: "Ein LLM ist eine Kette von Ebenen, keine einzelne Zauberformel. Die Daten stehen davor und werden zum Training verwendet; die Architektur beginnt mit dem Tokenizer. Gehe die fünf Ebenen mit „Weiter“ durch: Tokenizer, Embedding, Positional Embedding, Transformer-Blöcke und Unembedding. In den nächsten Tagen gehen wir alle diese Sachen durch.",
      watch: "Gehe die fünf Ebenen mit „Weiter“ oder der Pfeiltaste durch. Was macht jede Ebene?",
      demoState: { scene: "blocks" },
      context: "Die Reihenfolge ist die Architektur: Tokens → Vektoren → Position → Transformer-Blöcke → Verteilung. Jeder Schritt verändert die Darstellung, bis am Ende ein Token gezogen wird.",
      deep: "Jeder Block ist selbst ein gelerntes Stück Funktion. Zusammen approximieren sie die viel zu komplizierte Funktion „nächstes Token aus Kontext“.",
      boxes: [
        box("mod-1", "Technik", "Die fünf Ebenen", "Tokenizer: Text → Tokens. Embedding: Tokens → Vektoren. Positional Embedding: Position → Vektor. Transformer-Blöcke: erst Attention, dann FFN, dutzende bis hunderte Male wiederholt. Unembedding: Vektor → Scores und Softmax."),
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
        box("mod-line", "Limit", "Why is a line not enough?", "A single neuron is a linear function. It can only approximate the sine, no matter how long it trains. Only the activation between several layers creates bends and curves."),
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
      body: "An LLM is a chain of levels, not a single magic formula. The data stands before it and is used for training; the architecture begins with the tokenizer. Walk through the five levels with “Next”: tokenizer, embedding, positional embedding, transformer blocks, and unembedding. Over the next days we will go through all of these things.",
      watch: "Walk through the five levels with “Next” or the arrow key. What does each level do?",
      demoState: { scene: "blocks" },
      context: "The order is the architecture: tokens → vectors → position → transformer blocks → distribution. Each step changes the representation until a token is drawn.",
      deep: "Each block is itself a learned piece of function. Together they approximate the far too complicated function “next token from context”.",
      boxes: [
        box("mod-1", "Technique", "The five levels", "Tokenizer: text → tokens. Embedding: tokens → vectors. Positional embedding: position → vector. Transformer blocks: attention first, then FFN, repeated dozens to hundreds of times. Unembedding: vector → scores and softmax."),
        box("mod-dense", "Optional", "Dense = all to all", "A dense layer connects every input to every output. The weights are the edges of a complete weighted graph. In the matrix W, W_ij is the edge from input j to output i. That is where the usual network diagrams come from.", "\\underbrace{y_i}_{\\text{output }i} = \\underbrace{\\sum_j W_{ij} x_j + b_i}_{\\text{all inputs}}"),
        box("mod-norm", "Technique", "LayerNorm and other blocks", "A real transformer block also contains LayerNorm, residual connections, and several attention heads. There are further architectures and details such as mixture-of-experts, multi-query attention, and different positional schemes. We leave them out here to keep the intuition in focus."),
        box("mod-angle", "Mathematics", "Why angles?", "At the end, directions are compared, not lengths. The angle between two vectors changes less in high dimensions than their length. That is why the great-circle metric is useful here; for a first pass the intuition is enough."),
        box("in-13", "Limit", "What does plausible mean?", "Plausible means the continuation occurred in the training text. It does not mean the model has its own notion of truth."),
        box("mod-extra", "Limit", "What is missing here?", "There are further architectures and details we do not cover here: mixture-of-experts, other normalisations, multi-query attention, different positional schemes, and many training tricks. This page is about the intuition.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } }]
    }
  ];

  var bausteineData = {
    kicker: DE ? "Daten" : "Data",
    title: DE ? "Daten" : "Data",
    body: DE
      ? "Daten sind der erste Schritt, aber technisch nicht Teil des LLM. Man trainiert in zwei Stufen auf zwei Datensätzen: zuerst auf mehr oder weniger dem ganzen Internet, damit das Netz Muster, Sprache und Fakten erkennt; danach per Fine-Tuning auf gezielten Menschenfragen mit nützlichen Antworten. Das große Internet-Dataset gibt die Breite, das kleine gibt die Richtung. Erst danach kann das Netz auf konkrete Fragen detaillierter antworten."
      : "Data is the first step, but technically not part of the LLM. Training happens in two stages on two datasets: first on more or less the entire internet so the net recognises patterns, language, and facts; then fine-tuning on targeted human questions with useful answers. The large internet dataset provides breadth; the small one provides direction. Only after that can the net answer concrete questions in more detail.",
    teaser: DE
      ? "Daten sind der erste Schritt, aber technisch nicht Teil des LLM. Man trainiert in zwei Stufen auf zwei Datensätzen: zuerst auf mehr oder weniger dem ganzen Internet, damit das Netz Muster, Sprache und Fakten erkennt; danach per Fine-Tuning auf gezielten Menschenfragen mit nützlichen Antworten. Das große Internet-Dataset gibt die Breite, das kleine gibt die Richtung. Erst danach kann das Netz auf konkrete Fragen detaillierter antworten."
      : "Data is the first step, but technically not part of the LLM. Training happens in two stages on two datasets: first on more or less the entire internet so the net recognises patterns, language, and facts; then fine-tuning on targeted human questions with useful answers. The large internet dataset provides breadth; the small one provides direction. Only after that can the net answer concrete questions in more detail.",
    watch: "",
    demoState: { scene: "langdata", mode: "scale", summary: true },
    inherit: false,
    questionGroups: [
      {
        id: "g-basics",
        title: DE ? "Eine Ebene tiefer" : "One level deeper",
        questions: [
          { id: "q-data-external", title: DE ? "Sind die Daten Teil des LLM?" : "Are the data part of the LLM?", body: DE ? "Nein. Sie stehen außerhalb des Modells und werden zum Training verwendet." : "No. They stand outside the model and are used for training.", tex: "", kind: "question" },
          { id: "q-data-finetune", title: DE ? "Was ist Fine-Tuning?" : "What is fine-tuning?", body: DE ? "Ein zweites Training auf kleinen, gezielten Frage-Antwort-Daten, damit das Modell für Menschen nützlich antwortet." : "A second training run on small, targeted question-answer data so the model answers usefully for people.", tex: "", kind: "question" }
        ]
      },
      {
        id: "g-sources",
        title: DE ? "Quellen" : "Sources",
        sources: [
          { label: "Wikipedia: Large language model", url: "https://en.wikipedia.org/wiki/Large_language_model", why: { de: "Beispiel für einen Trainingsauszug aus Wikipedia.", en: "Example of a training excerpt from Wikipedia." } },
          { label: "Wikipedia: Paris", url: "https://de.wikipedia.org/wiki/Paris", why: { de: "Erster Absatz des Artikels; die Demo zeigt den HTML-Ausschnitt.", en: "First paragraph of the article; the demo shows the HTML excerpt." } },
          { label: "Cisco (2016), The Zettabyte Era Officially Begins", url: "https://blogs.cisco.com/sp/the-zettabyte-era-officially-begins-how-much-is-that", why: { de: "Zettabyte-Ära seit 2016 und die Größenordnung 10²¹ Byte.", en: "Zettabyte era since 2016 and the 10²¹-byte scale." } },
          { label: "Brown et al. (2020), Language Models are Few-Shot Learners", url: "https://arxiv.org/abs/2005.14165", why: { de: "GPT-3-Datenmischung und Few-Shot-Ergebnisse.", en: "GPT-3 data mix and few-shot results." } },
          { label: "Lee et al. (2021), Deduplicating Training Data Makes Language Models Better", url: "https://arxiv.org/abs/2107.06499", why: { de: "Deduplizierung verbessert Sprachmodelle.", en: "Deduplication improves language models." } },
          { label: "Ouyang et al. (2022), Training language models to follow instructions with human feedback", url: "https://arxiv.org/abs/2203.02155", why: { de: "Instruction-Tuning mit menschlichem Feedback nach dem Vortraining.", en: "Instruction tuning with human feedback after pretraining." } }
        ]
      }
    ]
  };
  var bausteineIntro = {
    kicker: DE ? "Architektur" : "Architecture",
    title: DE ? "Die Architektur von LLMs" : "The architecture of LLMs",
    body: DE
      ? "LLM sind ein Machine-Learning-Verfahren: Statt dem Computer Schritt für Schritt vorzugeben, was er tun soll, geben wir nur die grobe Architektur vor und trainieren ihn mit vielen großen Datenmengen, damit er die Aufgabe selbst lernt. Bei LLMs ist die Aufgabe, das nächste sinnvolle Wort vorherzusagen."
      : "LLMs are a machine-learning method: instead of telling the computer step by step what to do, we specify only the rough architecture and train it on large amounts of data so that it learns the task itself. For LLMs, the task is to predict the next sensible word.",
    teaser: DE
      ? "LLM sind ein Machine-Learning-Verfahren: Statt dem Computer Schritt für Schritt vorzugeben, was er tun soll, geben wir nur die grobe Architektur vor und trainieren ihn mit vielen großen Datenmengen, damit er die Aufgabe selbst lernt. Bei LLMs ist die Aufgabe, das nächste sinnvolle Wort vorherzusagen."
      : "LLMs are a machine-learning method: instead of telling the computer step by step what to do, we specify only the rough architecture and train it on large amounts of data so that it learns the task itself. For LLMs, the task is to predict the next sensible word.",
    watch: DE ? "Sequenzielles Machine Learning geschieht in Schichten. Die erste Schicht wendet man direkt auf die Daten an, die zweite auf die Ergebnisse der ersten, und so weiter; dadurch verschachteln sich Funktionen: $$\\text{layer}_3\\left(\\text{layer}_2\\left(\\text{layer}_1\\left(\\text{Daten}\\right)\\right)\\right)$$. \n\nDie erste Schicht sucht nach Mustern im Text, die zweite nach Mustern im Ergebnis der ersten Schicht, und so weiter. Mit dem Residual Stream kann jede Schicht auch Muster im Text <i>und</i> in den Ergebnissen der vorherigen Schichten finden." : "Sequential machine learning happens in layers. The first layer is applied directly to the data, the second to the results of the first, and so on; this nests functions: $$\\text{layer}_3\\left(\\text{layer}_2\\left(\\text{layer}_1\\left(\\text{Data}\\right)\\right)\\right)$$. \n\nThe first layer looks for patterns in the text, the second for patterns in the result of the first layer, and so on. With the residual stream, each layer can also find patterns in the text <i>and</i> in the results of the previous layers.",
    demoState: { scene: "blocks", resetKey: "architecture", start: 0 },
    inherit: false,
    questionGroups: [
      {
        id: "g-basics",
        title: DE ? "Eine Ebene tiefer" : "One level deeper",
        questions: [
          { id: "q-training", title: DE ? "Wie werden die Modelle trainiert?" : "How are the models trained?", body: DE ? "Wir gehen an einem späteren Tag noch auf das Training ein. Die Idee: Anhand von Trainingsdaten, also Beispielen, prüft man wiederholt, wie gut das Netz ist, und verändert es leicht in die Richtung, in der es besser wird. Besser heißt hier: Gegeben einen Text sagt es das nächste Wort aus dem Text richtig voraus." : "We will look at training in more detail on a later day. The idea: with training data, that is examples, you repeatedly check how good the network is and change it slightly in the direction that makes it better. Better here means: given a text, it predicts the next word from the text correctly.", tex: "", kind: "question" },
        ]
      },
      {
        id: "g-sources",
        title: DE ? "Quellen" : "Sources",
        sources: [
          { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Transformer-Blöcke, Residualverbindungen und Layer-Normalisierung.", en: "Transformer blocks, residual connections, and layer normalisation." } },
          { label: "He et al. (2016), Deep Residual Learning", url: "https://arxiv.org/abs/1512.03385", why: { de: "Residualverbindungen: Updates werden addiert, nicht überschrieben.", en: "Residual connections: updates are added, not overwritten." } }
        ]
      }
    ]
  };
  var bausteineOutro = {
    kicker: DE ? "Ausblick" : "What comes next",
    title: DE ? "Die nächsten Tage" : "The next days",
    body: DE ? "Ein kurzer Ausblick auf die nächsten Folien." : "A short look at the next slides.",
    teaser: DE ? "Ein kurzer Ausblick auf die nächsten Folien." : "A short look at the next slides.",
    watch: DE ? "Die Demo zeigt, was als Nächstes kommt." : "The demo shows what comes next.",
    demoState: { scene: "roadmap" },
    inherit: false
  };
  var bausteineStep = {
    kicker: DE ? "Architektur" : "Architecture",
    title: DE ? "Bausteine eines LLM" : "Building blocks of an LLM",
    substeps: [bausteineData, bausteineIntro, bausteineOutro]
  };

  var manifoldSteps = DE ? [
    {
      kicker: "Mannigfaltigkeiten",
      title: "Von Beziehungen zur Übersetzung",
      body: "Hat man Punkte in diesem hochabstraktem Raum, deren Beziehung untereinander die Bedeutung enthält, wird Übersetzung zu Translation, Rotation, Verzerrung, Skalierung und Scherung. Die Struktur, die sich aus den Punkten im hochdimensionalen Raum bildet, nennen Mathematiker <b>Mannigfaltigkeit</b>.\n\nFindet man eine Kombination, die das eine zum Anderen transformiert, hat man eine Übersetzung gefunden, weil die Bedeutung in anderen Sprachen in gleicher Relation zueinander steht, wenn auch mit anderen konkreten Tokens.",
      watch: "Drehe, rotiere und verschiebe die japanische Wolke. Fahre über die Punkte, um die Wörter zu sehen. Klicke „Übersetzung finden“ oder „Weiter“.",
      demoState: { scene: "manifold" },
      context: "Die Demo ist stark vereinfacht: zwei Punktwolken, viele Wörter, saubere Kanten. Die echte Geometrie hat Tausende Dimensionen und überlappende Beziehungen; der Vietoris–Rips-Komplex macht nur die Nachbarschaften sichtbar.",
      deep: "Eine Mannigfaltigkeit ist lokal flach und global gekrümmt. Die Übersetzung entspricht einer Abbildung zwischen zwei solchen Flächen. Hier ist die Abbildung eine Kombination aus Drehung, Rotation und Translation: Wenn beide Wolken zur Deckung kommen, liegen die Wörter ihrer Bedeutung nach übereinander.",
      boxes: [
        box("man-2", "Grenze", "Was ist vereinfacht?", "Die Punktwolken sind klein und die Wörter sauber platziert. Ein echtes Embedding hat Tausende Dimensionen und viele überlappende Beziehungen; die Kanten zeigen nur eine Nachbarschaft, nicht die ganze Geometrie."),
        box("man-3", "Grenze", "Wie echt ist die Übersetzung?", "Die Demo zeigt eine Idee, keine Messung. Ein echtes Modell lernt die Abbildung aus Text; die Formen sind abstrakt, extrem hochdimensional und für Menschen schwer zu sehen."),
        box("man-4", "Mathematik", "Was ist eine Mannigfaltigkeit?", "Eine Mannigfaltigkeit ist ein Raum, der lokal wie $R^n$, also den gewohnten, euklidischen Raum, aussieht: Jeder Punkt hat eine Karte, die eine Umgebung auf eine offene Menge im $R^n$ abbildet, und die Karten wechseln glatt. Global kann der Raum gekrümmt sein, zum Beispiel eine Kugel oder ein Torus.")
      ],
      sources: [
        { label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781", why: { de: "word2vec: gelernte Wortvektoren und Vektorarithmetik.", en: "word2vec: learned word vectors and vector arithmetic." } },
        { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/", why: { de: "GloVe: globale Kookkurrenz als Wortvektoren.", en: "GloVe: global co-occurrence as word vectors." } },
        { label: "Conneau et al. (2018), Word Translation Without Parallel Data", url: "https://arxiv.org/abs/1710.04087", why: { de: "Übertragung zwischen Worträumen ohne parallele Daten.", en: "Transport between word spaces without parallel data." } }
      ]
    }
  ] : [
    {
      kicker: "Manifolds",
      title: "From relations to translation",
      body: "If you have points in this highly abstract space whose relations to one another carry meaning, the task becomes one of translation, rotation, distortion, scaling, and shear. The structure that forms from the points in high-dimensional space is what mathematicians call a <b>manifold</b>.\n\nIf you find a combination that transforms one into the other, you have found a translation, because meaning stands in the same relations across languages, even with different concrete tokens.",
      watch: "Rotate, roll, and translate the Japanese cloud. Hover the points to see the words. Click “Find translation” or “Next”.",
      demoState: { scene: "manifold" },
      context: "The demo is strongly simplified: two point clouds, many words, clean edges. The real geometry has thousands of dimensions and overlapping relations; the Vietoris–Rips complex only makes neighbourhoods visible.",
      deep: "A manifold is locally flat and globally curved. Translation corresponds to a map between two such surfaces. Here the map combines yaw, roll, and translation: when the clouds coincide, words of the same meaning lie on top of each other.",
      boxes: [
        box("man-2", "Limit", "What is simplified?", "The point clouds are small and the words are neatly placed. A real embedding has thousands of dimensions and many overlapping relations; the edges show one neighbourhood, not the whole geometry."),
        box("man-3", "Limit", "How real is the translation?", "The demo shows an idea, not a measurement. A real model learns the map from text; the shapes are abstract, extremely high-dimensional, and hard for humans to see."),
        box("man-4", "Mathematics", "What is a manifold?", "A manifold is a space that locally looks like $R^n$, the familiar Euclidean space: every point has a chart that maps a neighbourhood onto an open set in $R^n$, and the charts change smoothly. Globally the space can be curved, for example a sphere or a torus.")
      ],
      sources: [
        { label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781", why: { de: "word2vec: gelernte Wortvektoren und Vektorarithmetik.", en: "word2vec: learned word vectors and vector arithmetic." } },
        { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/", why: { de: "GloVe: globale Kookkurrenz als Wortvektoren.", en: "GloVe: global co-occurrence as word vectors." } },
        { label: "Conneau et al. (2018), Word Translation Without Parallel Data", url: "https://arxiv.org/abs/1710.04087", why: { de: "Übertragung zwischen Worträumen ohne parallele Daten.", en: "Transport between word spaces without parallel data." } }
      ]
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
        box("grad-todo", "TODO", "Automatisches Ableiten", "<b>TODO:</b> Details zu automatischem Ableiten (Autograd, Berechnung der Gradienten) hier ergänzen."),
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
        box("grad-todo", "TODO", "Automatic differentiation", "<b>TODO:</b> add the details on automatic differentiation (autograd, how gradients are computed) here."),
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
      body: "Welches Wort liegt neben „König“? W_U hat eine Zeile pro Token. Jede Zeile ist eine gelernte Richtung. h ist der letzte Vektor aus den Transformer-Blöcken: der Zustand des aktuellen Tokens, in den der gesamte Kontext über viele Heads und Schichten eingemischt wurde. Am Ende vergleicht das Modell diesen Vektor h mit den Token-Richtungen: Das Skalarprodukt misst, wie ähnlich sie zeigen. Das ist die Umkehrung des Embeddings: aus einem Vektor werden wieder Wörter. Wähle ein Wort und sieh die nächsten Nachbarn. Schalte zwischen Winkel und euklidischem Abstand um: Der Winkel ignoriert die Länge, der Abstand nicht. Drücke Weiter oder → für Winkel, Skaleninvarianz und Unembedding. Die Prozentwerte sind Ähnlichkeiten, keine Wahrscheinlichkeiten.",
      watch: "Wähle ein Wort. Drücke Weiter oder →: Winkel, Skaleninvarianz, Unembedding.",
      demoState: { scene: "unembed" },
      context: "Die 2D-Karte ist eine Projektion der gelernten Richtungen. Die Prozentwerte vergleichen Richtungen; erst Softmax macht daraus eine Verteilung. Ähnliche Wörter liegen nahe beieinander, weil das Training sie in ähnlichen Kontexten sieht.",
      deep: "W_U ist gelernt. Wörter, die in ähnlichen Kontexten vorkommen, bekommen ähnliche Richtungen; das Skalarprodukt misst die Nähe. In hohen Dimensionen verliert der euklidische Abstand an Kontrast, deshalb ist der Winkel oft informativer. Die Karte ist eine Projektion, keine vollständige Geometrie.",
      boxes: [
        box("un-1", "Mathematik", "Die Matrix W_U", "Jede Zeile von W_U ist die gelernte Richtung eines Tokens. Das Skalarprodukt mit h ergibt einen Logit. Ähnliche Richtungen ergeben hohe Werte; Softmax macht daraus eine Verteilung.", "\\underbrace{z_i}_{\\text{Logit}} = \\underbrace{w_i \\cdot h}_{\\text{Richtung mal Vektor}}"),
        box("un-2", "Metrik", "Winkel oder Abstand?", "Der Cosinus ignoriert die Länge und misst nur die Richtung. Der euklidische Abstand zählt die Länge mit. In hohen Dimensionen liegen fast alle Punkte ähnlich weit auseinander; der Winkel bleibt informativer. Deshalb vergleicht das Unembedding Richtungen.", "\\underbrace{\\cos\\theta}_{\\text{Ähnlichkeit}} = \\underbrace{\\frac{u\\cdot v}{\\lVert u\\rVert\\,\\lVert v\\rVert}}_{\\text{nur Richtung}}"),
        box("un-3", "Grenze", "Was ist das nicht?", "Kein Wörterbuch und keine Definition. Die Karte zeigt gelernte Nachbarschaften, keine Bedeutung an sich. Ähnliche Wörter können auch Gegensätze sein, wenn sie in ähnlichen Kontexten auftreten; die Prozentwerte sind keine Wahrscheinlichkeiten."),
        box("un-4", "Metrik", "Skaleninvarianz: Oft zählt die Richtung", "Die Länge eines Vektors ändert den euklidischen Abstand, aber nicht den Cosinus. Deshalb kann das Netz Längen ignorieren und hat mehr Freiheit bei der Richtung. Ob die Richtung semantisch dasselbe bedeutet, ist eine Eigenschaft des gelernten Raums, keine Folge des Cosinus."),
        box("un-5", "Begriff", "Was ist h?", "h ist der letzte Vektor aus den Transformer-Blöcken. In ihn haben Attention und FFN den gesamten Kontext über viele Schichten und Heads wieder und wieder eingemischt. Aus diesem h sagt W_U das nächste Token voraus.")
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
      body: "Which word lies next to “king”? W_U has one row per token. Every row is a learned direction. h is the final vector from the transformer blocks: the state of the current token, into which the entire context has been mixed through many heads and layers. At the end the model compares this vector h with the token directions: the dot product measures how similarly they point. This is the reverse of embedding: a vector becomes words again. Choose a word and see its nearest neighbours. Switch between angle and Euclidean distance: the angle ignores length, the distance does not. Press Next or → for angle, scale invariance, and unembedding. The percentages are similarities, not probabilities.",
      watch: "Choose a word. Press Next or →: angle, scale invariance, unembedding.",
      demoState: { scene: "unembed" },
      context: "The 2D map is a projection of the learned directions. The percentages compare directions; only softmax turns them into a distribution. Similar words lie close together because training sees them in similar contexts.",
      deep: "W_U is learned. Words that occur in similar contexts get similar directions; the dot product measures the closeness. In high dimensions Euclidean distance loses contrast, so the angle is often more informative. The map is a projection, not the full geometry.",
      boxes: [
        box("un-1", "Mathematics", "The matrix W_U", "Every row of W_U is the learned direction of a token. The dot product with h gives a logit. Similar directions give high values; softmax turns them into a distribution.", "\\underbrace{z_i}_{\\text{logit}} = \\underbrace{w_i \\cdot h}_{\\text{direction times vector}}"),
        box("un-2", "Metric", "Angle or distance?", "The cosine ignores length and measures only direction. Euclidean distance includes length. In high dimensions almost all points are similarly far apart; the angle stays more informative. That is why the unembedding compares directions.", "\\underbrace{\\cos\\theta}_{\\text{similarity}} = \\underbrace{\\frac{u\\cdot v}{\\lVert u\\rVert\\,\\lVert v\\rVert}}_{\\text{direction only}}"),
        box("un-3", "Limit", "What is this not?", "Not a dictionary and not a definition. The map shows learned neighbourhoods, not meaning itself. Similar words can even be opposites if they occur in similar contexts; the percentages are not probabilities."),
        box("un-4", "Metric", "Scale Invariance: Direction Is Often the Useful Signal", "A vector's length changes Euclidean distance but not cosine. That is why the network can ignore lengths and has more freedom in direction. Whether that direction means the same thing is a property of the learned space, not a consequence of cosine."),
        box("un-5", "Term", "What is h?", "h is the final vector from the transformer blocks. Attention and the FFN have mixed the entire context into it through many layers and heads. From this h, W_U predicts the next token.")
      ],
      sources: [
        { label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781", why: { de: "Gelernte Wortvektoren und Ähnlichkeit über Richtungen.", en: "Learned word vectors and similarity through directions." } },
        { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/", why: { de: "Globale Kookkurrenz als Wortvektoren.", en: "Global co-occurrence as word vectors." } },
        { label: "Aggarwal et al. (2001), On the Surprising Behavior of Distance Metrics in High Dimensional Space", url: "https://doi.org/10.1007/3-540-44503-X_27", why: { de: "Distanzen verlieren in hohen Dimensionen an Kontrast; Winkel bleiben informativ.", en: "Distances lose contrast in high dimensions; angles stay informative." } }
      ]
    }
  ];

  unembedSteps[0].demoState = { scene: "unembed", mode: "map" };

  var unembedAngleStep = Object.assign({}, unembedSteps[0], {
    kicker: DE ? "Winkel" : "Angle",
    title: DE ? "Winkel statt Abstand" : "Angle instead of distance",
    body: DE
      ? "Jetzt zählt nur die Richtung. Der Winkel zwischen h und einer Token-Richtung wird zum Cosinus; die Länge fällt heraus. Ziehe die beiden Vektoren und sieh, wann der Winkel klein wird. Kleiner Winkel heißt ähnliche Richtung."
      : "Now only the direction counts. The angle between h and a token direction becomes the cosine; the length drops out. Drag the two vectors and see when the angle gets small. A small angle means a similar direction.",
    watch: DE ? "Ziehe A und B. Wann ist der Winkel klein, wann groß?" : "Drag A and B. When is the angle small, when large?",
    context: DE ? "Der Cosinus misst den Winkel zwischen zwei Richtungen; die Länge kürzt sich heraus. Ein kleiner Winkel bedeutet eine ähnliche Richtung." : "The cosine measures the angle between two directions; the length cancels out. A small angle means a similar direction.",
    demoState: { scene: "unembed", mode: "angle" },
    boxes: unembedSteps[0].boxes.map(function (b) { return Object.assign({}, b, { id: b.id + "-angle" }); })
  });

  var unembedScaleStep = Object.assign({}, unembedSteps[0], {
    kicker: DE ? "Skaleninvarianz" : "Scale invariance",
    title: DE ? "Länge vs. Winkel" : "Length vs. angle",
    body: DE
      ? "A und B starten am selben Punkt, zeigen aber in verschiedene Richtungen. Ziehe die Länge von B: Der Winkel und der Cosinus bleiben gleich, der euklidische Abstand zwischen den Spitzen ändert sich. So siehst du, was die Länge für Cosinus und euklidischen Abstand bedeutet."
      : "A and B start at the same point but point in different directions. Drag the length of B: the angle and the cosine stay the same, while the Euclidean distance between the tips changes. That is what length does to cosine and Euclidean distance.",
    watch: DE ? "Ziehe die Länge von B. Was bleibt gleich (Winkel, Cos), was ändert sich (Euclidean)?" : "Drag the length of B. What stays the same (angle, cosine), what changes (Euclidean)?",
    context: DE ? "Skaleninvarianz heißt: Eine positive Skalierung ändert die Richtung nicht. Der Cosinus bleibt gleich; der euklidische Abstand zählt die Länge mit." : "Scale invariance means a positive scaling does not change the direction. The cosine stays the same; Euclidean distance includes the length.",
    demoState: { scene: "unembed", mode: "scale" },
    boxes: unembedSteps[0].boxes.map(function (b) { return Object.assign({}, b, { id: b.id + "-scale" }); })
  });

  var unembedUnembedStep = Object.assign({}, unembedSteps[0], {
    kicker: DE ? "Unembedding" : "Unembedding",
    title: DE ? "Vom Vektor zur Verteilung" : "From vector to distribution",
    body: DE
      ? "h ist der Zustand des aktuellen Tokens nach allen Transformer-Blöcken; der gesamte Kontext ist über viele Heads und Schichten hineingemischt. Dieser letzte Vektor h wird mit jeder Zeile von W_U verglichen. Der kleinste Winkel ergibt den höchsten Logit; Softmax macht aus allen Logits eine Verteilung. Klicke einen Vorschlag oder nutze „Nächster Winkel“: Der Winkel wird hervorgehoben."
      : "h is the state of the current token after all transformer blocks; the entire context has been mixed into it through many heads and layers. This final vector h is compared with every row of W_U. The smallest angle gives the highest logit; softmax turns all logits into a distribution. Click a suggestion or use “Next angle”: the angle is highlighted.",
    watch: DE ? "Klicke die Vorschläge. Welcher Winkel wird zur höchsten Wahrscheinlichkeit?" : "Click the suggestions. Which angle becomes the highest probability?",
    context: DE ? "h ist kein einzelnes Wort, sondern der Zustand nach allen Schichten: Attention hat Kontext zwischen den Tokens verschoben, das FFN hat ihn pro Token geformt. Der Logit ist das Skalarprodukt aus h und einer Token-Zeile; Softmax macht aus allen Logits eine Verteilung." : "h is not a single word but the state after all layers: attention moved context between tokens, and the FFN shaped it per token. The logit is the dot product of h and a token row; softmax turns all logits into a distribution.",
    demoState: { scene: "unembed", mode: "unembed" },
    boxes: unembedSteps[0].boxes.map(function (b) { return Object.assign({}, b, { id: b.id + "-unembed" }); })
  });

  var unembedStep = {
    title: DE ? "Ähnliche Worte finden" : "Finding similar words",
    kicker: "Unembedding",
    substeps: [unembedSteps[0], unembedAngleStep, unembedScaleStep, unembedUnembedStep]
  };

  var highdimSteps = DE ? [
    {
      kicker: "Der Raum",
      title: "Tausende Dimensionen",
      body: "3D reicht nicht, so wie 1D nicht gereicht hat: Manche Unterschiede brauchen eigene Richtungen. Deshalb skaliert man hoch: Ein echtes Embedding hat Tausende Dimensionen; GPT-2 small nutzt 768, große Modelle noch mehr. Die Tabelle zeigt einen Ausschnitt: 64 von 4096 Dimensionen. Jede Zeile ist die Position eines Tokens, jede Spalte eine Dimension. Du kannst dir das nicht mehr vorstellen, aber die Rechnung bleibt dieselbe: Differenz, Winkel und Matrixmultiplikation funktionieren koordinatenweise weiter.",
      teaser: "3D reicht nicht, so wie 1D nicht gereicht hat: Manche Unterschiede brauchen eigene Richtungen. Deshalb skaliert man hoch: Ein echtes Embedding hat Tausende Dimensionen; GPT-2 small nutzt 768, große Modelle noch mehr. Die Tabelle zeigt einen Ausschnitt: 64 von 4096 Dimensionen. Jede Zeile ist die Position eines Tokens, jede Spalte eine Dimension. Du kannst dir das nicht mehr vorstellen, aber die Rechnung bleibt dieselbe: Differenz, Winkel und Matrixmultiplikation funktionieren koordinatenweise weiter.",
      watch: "Scrolle durch die Tabelle. Klicke ein Wort: Jede Zeile ist seine Position, jede Spalte eine Dimension.",
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
      body: "3D is not enough, just as 1D was not enough: some differences need their own directions. So the space is scaled up: a real embedding has thousands of dimensions; GPT-2 small uses 768, larger models even more. The table shows a slice: 64 of 4096 dimensions. Each row is a token position, each column a dimension. You cannot picture this anymore, but the arithmetic stays the same: difference, angle, and matrix multiplication work coordinate by coordinate.",
      teaser: "3D is not enough, just as 1D was not enough: some differences need their own directions. So the space is scaled up: a real embedding has thousands of dimensions; GPT-2 small uses 768, larger models even more. The table shows a slice: 64 of 4096 dimensions. Each row is a token position, each column a dimension. You cannot picture this anymore, but the arithmetic stays the same: difference, angle, and matrix multiplication work coordinate by coordinate.",
      watch: "Scroll through the table. Click a word: each row is its position, each column a dimension.",
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

  var dataTruthStep = DE ? {
    kicker: "Wahrheit",
    title: "Viele Sätze, eine Wahrheit",
    body: "Eine Wahrheit ist eine Kurve, viele Beschreibungen liegen darum. Je näher ein Satz an der Kurve liegt, desto wahrer ist er in diesem Beispiel. Die meisten Beschreibungen liegen nahe; ein falscher Satz liegt weit weg. Genau diese Form hat Gauß bei Ceres gesehen: Viele verrauschte Beobachtungen, eine wahre Bahn in der Mitte.",
    watch: "Schau auf die Punkte. Welche Sätze liegen nah an der Wahrheit, welcher ist falsch?",
    demoState: { scene: "langdata", mode: "truth" },
    context: "Die Sätze sind eine Illustration, keine Messung. Die Kurve steht symbolisch für die Wahrheit; der Abstand ist ein didaktisches Maß. In echten Daten gibt es nicht immer eine so klare Linie, und Wahrheit ist oft umstritten.",
    deep: "Daten sind viele Beschreibungen desselben Sachverhalts. Einzelne Sätze können irren; über viele Beschreibungen hofft man, dass die tragfähige Struktur durchscheint. Das ist keine Garantie, sondern eine statistische Hoffnung.",
    boxes: [
      box("data-t-1", "Idee", "Die Kurve", "Die Kurve ist die Wahrheit. Punkte darüber und darunter sind Beschreibungen; ihr Abstand zeigt, wie weit sie in diesem Beispiel von der Wahrheit entfernt sind."),
      box("data-t-2", "Grenze", "Was ist das nicht?", "Keine automatische Wahrheitsmaschine. Der Plot ist eine Illustration. Die Sätze sind Beispiele; die Abstände sind didaktisch, nicht gemessen.")
    ],
    sources: []
  } : {
    kicker: "Truth",
    title: "Many sentences, one truth",
    body: "A truth is a curve; many descriptions sit around it. The closer a sentence is to the curve, the truer it is in this example. Most descriptions sit near; one false sentence lies far away. This is the shape Gauss saw with Ceres: many noisy observations, one true orbit in the middle.",
    watch: "Look at the points. Which sentences lie near the truth, and which one is false?",
    demoState: { scene: "langdata", mode: "truth" },
    context: "The sentences are an illustration, not a measurement. The curve stands symbolically for truth; the distance is a didactic measure. Real data does not always have such a clear line, and truth is often disputed.",
    deep: "Data are many descriptions of the same situation. Individual sentences can be wrong; over many descriptions one hopes the robust structure shines through. That is not a guarantee, but a statistical hope.",
    boxes: [
      box("data-t-1", "Idea", "The curve", "The curve is the truth. Points above and below are descriptions; their distance shows how far they are from the truth in this example."),
      box("data-t-2", "Limit", "What is this not?", "Not an automatic truth machine. The plot is an illustration. The sentences are examples; the distances are didactic, not measured.")
    ],
    sources: []
  };

  var gaussDataStep = DE ? {
    title: "Gauß, Ceres und die Daten",
    kicker: "Ceres",
    substeps: [
      {
        kicker: "Daten",
        title: "Gauß, Ceres und die Daten",
        body: "Giuseppe Piazzi entdeckte 1801 den Zwergplaneten <b>Ceres</b>. Nach kurzer Beobachtungszeit verschwand er hinter der Sonne, und niemand wusste mehr, wo man suchen sollte, weil die Messungen zu ungenau waren. <b>Gauß</b> erkannte, dass sich Messfehler um die wahre Bahn verteilen: Einige liegen weit daneben, andere ganz nah, aber im Mittel stimmen sie. Daraus entstanden die Methode der kleinsten Quadrate und der mittlere quadratische Fehler (MSE), mit dem man noch heute neuronale Netze trainiert.",
        teaser: "Giuseppe Piazzi entdeckte 1801 den Zwergplaneten <b>Ceres</b>. Nach kurzer Beobachtungszeit verschwand er hinter der Sonne, und niemand wusste mehr, wo man suchen sollte, weil die Messungen zu ungenau waren. <b>Gauß</b> erkannte, dass sich Messfehler um die wahre Bahn verteilen: Einige liegen weit daneben, andere ganz nah, aber im Mittel stimmen sie. Daraus entstanden die Methode der kleinsten Quadrate und der mittlere quadratische Fehler (MSE), mit dem man noch heute neuronale Netze trainiert.",
        watch: "Schau dir die beiden Bilder an. Danach wird das Teleskop Schritt für Schritt besser.",
        demoState: { scene: "gauss", phase: "intro" },
        inherit: false,
        questionGroups: [
          {
            id: "g-basics",
            title: "Eine Ebene tiefer",
            questions: []
          },
          {
            id: "g-lens-mathematik",
            title: "Mathematik",
            questions: [
              { id: "q-box-gauss-2", title: "Was macht die Methode?", body: "Sie minimiert die Summe der quadrierten Abstände zwischen Beobachtungen und Modell, den mittleren quadratischen Fehler (MSE). Große Abweichungen zählen quadratisch, kleine kaum.", tex: "", kind: "question" }
            ]
          },
          {
            id: "g-lens-daten",
            title: "Daten",
            questions: [
              { id: "q-box-gauss-3", title: "Warum im Schnitt richtig?", body: "Einzelne Messungen können falsch sein: Menschen irren sich, Messungen haben Fehler, Menschen lügen. Über viele Messungen mitteln sich zufällige Fehler; die Anpassung landet in der Mitte. Systematische Fehler bleiben, deshalb ist Kuration wichtig.", tex: "", kind: "question" }
            ]
          },
          {
            id: "g-sources",
            title: "Quellen",
            sources: gaussSteps[0].sources
          }
        ]
      },
      {
        kicker: "Daten",
        title: "Gauß, Ceres und die Daten",
        body: "Die Beobachtungen sind verrauscht: Jeder Punkt liegt neben der wahren Bahn, und die Glockenkurve der Fehler ist breit. Ein einzelner Punkt wäre als Bahn unbrauchbar. Drücke Weiter: Das Teleskop wird besser.",
        teaser: "Die Beobachtungen sind verrauscht: Jeder Punkt liegt neben der wahren Bahn, und die Glockenkurve der Fehler ist breit. Ein einzelner Punkt wäre als Bahn unbrauchbar. Drücke Weiter: Das Teleskop wird besser.",
        watch: "Ziehe den Slider oder klicke weiter und sieh, wie mit besseren Teleskopen die Daten genauer werden. Reale Daten liegen genauso um eine Wahrheit herum. Texte zum Beispiel können komplett richtig, teilweise richtig oder komplett falsch sein.",
        demoState: { scene: "gauss", phase: "demo", sigma: 2 },
        context: "Die grüne Linie ist die wahre Bahn; die blauen Punkte sind Beobachtungen; die Glockenkurve rechts zeigt die Fehlerverteilung. Die Daten sind synthetisch, nicht Piazzis originale Messungen.",
        deep: "Ohne Ausgleich müsste man eine Bahn durch einen einzelnen Punkt legen. Gauß nutzte alle Beobachtungen zusammen.",
        boxes: gaussSteps[0].boxes,
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Daten",
        title: "Gauß, Ceres und die Daten",
        body: "Das Teleskop ist besser: Die Wolke zieht sich zusammen, die Glockenkurve wird schmaler. Die wahre Bahn bleibt in der Mitte der Fehler. Drücke Weiter für das beste Teleskop.",
        teaser: "Das Teleskop ist besser: Die Wolke zieht sich zusammen, die Glockenkurve wird schmaler. Die wahre Bahn bleibt in der Mitte der Fehler. Drücke Weiter für das beste Teleskop.",
        watch: "Drücke Weiter. Wie schmal wird die Glockenkurve?",
        demoState: { scene: "gauss", phase: "demo", sigma: 1 },
        context: "Je kleiner die Streuung, desto enger liegt die Glockenkurve um die wahre Bahn. Die Beobachtungen bleiben fehlerhaft, aber der Ausgleich wird stabiler.",
        deep: "Die Methode der kleinsten Quadrate minimiert die Summe der quadrierten Abstände, also den mittleren quadratischen Fehler (MSE). Viele kleine Fehler mitteln sich; ein einzelner Ausreißer zählt quadriert.",
        boxes: gaussSteps[0].boxes,
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Daten",
        title: "Gauß, Ceres und die Daten",
        body: "Jetzt liegt die Wolke eng um die Bahn. Gauß' Methode der kleinsten Quadrate wählt die Bahn, die allen Beobachtungen zugleich am nächsten liegt; keine einzelne Messung wird geglaubt. Das ist der mittlere quadratische Fehler (MSE), und dieselbe Regel trainiert noch moderne Modelle. Drücke Weiter zu den Daten.",
        teaser: "Jetzt liegt die Wolke eng um die Bahn. Gauß' Methode der kleinsten Quadrate wählt die Bahn, die allen Beobachtungen zugleich am nächsten liegt; keine einzelne Messung wird geglaubt. Das ist der mittlere quadratische Fehler (MSE), und dieselbe Regel trainiert noch moderne Modelle. Drücke Weiter zu den Daten.",
        watch: "Drücke Weiter. Was passiert, wenn die Beobachtungen nicht mehr exakt sind?",
        demoState: { scene: "gauss", phase: "demo", sigma: 0.3 },
        context: "Die Glockenkurve ist eng; die wahre Bahn liegt in der Mitte. Der Ausgleich glaubt keiner einzelnen Messung, sondern wählt die Kurve, die allen zugleich am nächsten bleibt; minimiert wird der mittlere quadratische Fehler (MSE).",
        deep: "Dieselbe Arithmetik erscheint in jedem trainierten Netz: Ein Modell ist eine Kurve, die Daten sind verrauschte Punkte, und das Training wählt die Gewichte, deren Vorhersagen im Durchschnitt am nächsten an den Beobachtungen liegen.",
        boxes: gaussSteps[0].boxes,
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Daten",
        title: "Gauß, Ceres und die Daten",
        body: "Texte verhalten sich ähnlich wie Gauß' Messungen: Manche Sätze sind ganz richtig, manche weniger falsch, manche falsch, aber im Schnitt liegen sie um eine Wahrheit. " + dataTruthStep.body,
        teaser: "Texte verhalten sich ähnlich wie Gauß' Messungen: Manche Sätze sind ganz richtig, manche weniger falsch, manche falsch, aber im Schnitt liegen sie um eine Wahrheit. " + dataTruthStep.body,
        watch: dataTruthStep.watch,
        demoState: dataTruthStep.demoState,
        context: dataTruthStep.context,
        deep: dataTruthStep.deep,
        boxes: dataTruthStep.boxes,
        sources: dataTruthStep.sources
      }
    ]
  } : {
    title: "Gauss, Ceres, and the data",
    kicker: "Ceres",
    substeps: [
      {
        kicker: "Data",
        title: "Gauss, Ceres, and the data",
        body: "Giuseppe Piazzi discovered the dwarf planet <b>Ceres</b> in 1801. After a short observing period it disappeared behind the Sun, and no one knew where to look because the measurements were too imprecise. <b>Gauss</b> realised that measurement errors scatter around the true orbit: some lie far off, others very close, but on average they agree. This gave rise to least squares and the mean squared error (MSE), which is still used to train neural networks today.",
        teaser: "Giuseppe Piazzi discovered the dwarf planet <b>Ceres</b> in 1801. After a short observing period it disappeared behind the Sun, and no one knew where to look because the measurements were too imprecise. <b>Gauss</b> realised that measurement errors scatter around the true orbit: some lie far off, others very close, but on average they agree. This gave rise to least squares and the mean squared error (MSE), which is still used to train neural networks today.",
        watch: "Look at the two images. Then the telescope gets better step by step.",
        demoState: { scene: "gauss", phase: "intro" },
        inherit: false,
        questionGroups: [
          {
            id: "g-basics",
            title: "One level deeper",
            questions: []
          },
          {
            id: "g-lens-mathematik",
            title: "Mathematics",
            questions: [
              { id: "q-box-gauss-2", title: "What does the method do?", body: "It minimises the sum of squared distances between observations and model, the mean squared error (MSE). Large deviations count squared, small ones barely.", tex: "", kind: "question" }
            ]
          },
          {
            id: "g-lens-daten",
            title: "Data",
            questions: [
              { id: "q-box-gauss-3", title: "Why right on average?", body: "Individual measurements can be wrong: people make mistakes, measurements have errors, people lie. Over many measurements random errors average out; the fit lands in the middle. Systematic errors remain, which is why curation matters.", tex: "", kind: "question" }
            ]
          },
          {
            id: "g-sources",
            title: "Sources",
            sources: gaussSteps[0].sources
          }
        ]
      },
      {
        kicker: "Data",
        title: "Gauss, Ceres, and the data",
        body: "The observations are noisy: every point lies beside the true orbit, and the bell curve of errors is wide. A single point would be useless as an orbit. Press Next: the telescope improves.",
        teaser: "The observations are noisy: every point lies beside the true orbit, and the bell curve of errors is wide. A single point would be useless as an orbit. Press Next: the telescope improves.",
        watch: "Drag the slider or click through and watch the data become more precise with better telescopes. Real data sits around a truth in the same way. Sentences, for example, can be completely right, partly right, or completely wrong.",
        demoState: { scene: "gauss", phase: "demo", sigma: 2 },
        context: "The green line is the true orbit; the blue points are observations; the bell curve on the right shows the error distribution. The data are synthetic, not Piazzi's original measurements.",
        deep: "Without fitting, one would have to put an orbit through a single point. Gauss used all observations together.",
        boxes: gaussSteps[0].boxes,
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Data",
        title: "Gauss, Ceres, and the data",
        body: "The telescope is better: the cloud contracts, the bell curve narrows. The true orbit stays in the middle of the errors. Press Next for the best telescope.",
        teaser: "The telescope is better: the cloud contracts, the bell curve narrows. The true orbit stays in the middle of the errors. Press Next for the best telescope.",
        watch: "Press Next. How narrow does the bell curve become?",
        demoState: { scene: "gauss", phase: "demo", sigma: 1 },
        context: "The smaller the spread, the tighter the bell curve around the true orbit. The observations remain noisy, but the fit becomes more stable.",
        deep: "Least squares minimises the sum of squared distances, the mean squared error (MSE). Many small errors average out; a single outlier counts squared.",
        boxes: gaussSteps[0].boxes,
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Data",
        title: "Gauss, Ceres, and the data",
        body: "Now the cloud lies tightly around the orbit. Gauss's least squares chooses the orbit closest to all observations at once; no single measurement is trusted. That is the mean squared error (MSE), and the same rule still trains modern models. Press Next to the data.",
        teaser: "Now the cloud lies tightly around the orbit. Gauss's least squares chooses the orbit closest to all observations at once; no single measurement is trusted. That is the mean squared error (MSE), and the same rule still trains modern models. Press Next to the data.",
        watch: "Press Next. What happens when the observations are no longer exact?",
        demoState: { scene: "gauss", phase: "demo", sigma: 0.3 },
        context: "The bell curve is narrow; the true orbit lies in the middle. The fit trusts no single measurement and chooses the curve closest to all of them at once; it minimises the mean squared error (MSE).",
        deep: "The same arithmetic appears in every trained network: a model is a curve, the data are noisy points, and training chooses the weights whose predictions are closest to the observations on average.",
        boxes: gaussSteps[0].boxes,
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Data",
        title: "Gauss, Ceres, and the data",
        body: "Text data behaves similarly to Gauss's measurements: some sentences are completely right, some less wrong, some wrong, but on average they sit around a truth. " + dataTruthStep.body,
        teaser: "Text data behaves similarly to Gauss's measurements: some sentences are completely right, some less wrong, some wrong, but on average they sit around a truth. " + dataTruthStep.body,
        watch: dataTruthStep.watch,
        demoState: dataTruthStep.demoState,
        context: dataTruthStep.context,
        deep: dataTruthStep.deep,
        boxes: dataTruthStep.boxes,
        sources: dataTruthStep.sources
      }
    ]
  };

  var tokenizeBpeStep = Object.assign({}, tokenizeSteps[0], {
    kicker: DE ? "BPE" : "BPE",
    title: DE ? "BPE: Zeichen → Paare → Merges" : "BPE: characters → pairs → merges",
    body: DE ? "BPE beginnt bei Zeichen: Jedes Wort wird in Zeichen zerlegt, dann zählt der Algorithmus benachbarte Paare und ersetzt das häufigste Paar durch ein neues Symbol. Die Trennungen kommen aus den Trainingsdaten: Der Algorithmus wählt sie so, dass möglichst viel Text mit möglichst wenigen Tokens dargestellt wird. Nach einigen Merges werden häufige Wörter kurz; seltene Schriften bleiben teuer. Das ist gelernte, verlustfreie Kompression." : "BPE starts from characters: every word is split into characters, then the algorithm counts adjacent pairs and replaces the most frequent pair with a new symbol. The splits come from the training data: the algorithm chooses them so that as much text as possible is represented with as few tokens as possible. After several merges, frequent words become short; rare scripts stay expensive. That is learned, lossless compression.",
    watch: DE ? "Drücke Weiter: Welches Paar wird als Nächstes verschmolzen?" : "Press Next: which pair is merged next?",
    demoState: { scene: "tokenize", mode: "bpe" }
  });
  var tokenizeExamplesStep = Object.assign({}, tokenizeSteps[0], {
    kicker: DE ? "Tokenize" : "Tokenize",
    title: DE ? "Text wird zu IDs" : "Text becomes IDs",
    body: DE ? "Der Tokenizer trennt Worte in einzelne Bestandteile. Diese werden mit einem Algorithmus, zum Beispiel <b>B</b>yte <b>P</b>air <b>E</b>ncoding (<b>BPE</b>) getrennt. Das basiert auf zwei Gedanken: der erste ist Kompression: es sollen so wenig wie möglich Tokens benutzt werden müssen, um so viel wie möglich zu sagen. Der zweite ist, dass das Netzwerk so auch Worte bearbeiten kann, die es vorher nie gesehen hat, indem es sie in Bestandteile trennt und lernt, wie man Worte aus ihren Bestandteilen heraus versteht, auch wenn man das konkrete Wort vielleicht nie gesehen hat." : "The tokenizer splits words into individual pieces. It splits them with an algorithm, for example <b>B</b>yte <b>P</b>air <b>E</b>ncoding (<b>BPE</b>). Two ideas sit behind it: the first is compression, use as few tokens as possible to say as much as possible. The second is that the network can then process words it has never seen before, because it splits them into pieces and learns how words are built from their pieces, even if it never saw the concrete word.",
    watch: "",
    demoState: { scene: "tokenize", mode: "split" },
    inherit: false,
    questionGroups: [
      {
        id: "g-basics",
        title: DE ? "Eine Ebene tiefer" : "One level deeper",
        questions: [
          { id: "q-deep", title: DE ? "Warum ist das so?" : "Why is that?", body: DE ? "BPE ist eine gelernte Kompression: Es zählt benachbarte Paare im Trainingskorpus und ersetzt das häufigste Paar durch ein neues Symbol. Nach mehreren Merges werden häufige Wörter kurz. Die genaue Tokenisierung hängt an den Daten und am Vokabularziel; die Demo zeigt einen kleinen Korpus, keine Messung eines bestimmten Modells." : "BPE is learned compression: it counts adjacent pairs in the training corpus and replaces the most frequent pair with a new symbol. After several merges, frequent words become short. The exact tokenization depends on the data and the vocabulary target; the demo shows a small corpus, not a measurement of a particular model.", tex: "", kind: "question" }
        ]
      },
      {
        id: "g-lens-technik",
        title: DE ? "Technik" : "Technique",
        questions: [
          { id: "q-box-tok-1", title: DE ? "Wie geht es mit unbekannten Zeichen um?" : "How does it handle unknown characters?", body: DE ? "Bei Encodings wie UTF8 kann ein Zeichen mehrere Byte lang sein. Was, wenn ein Zeichen nicht ein einziges Mal im Kontext war, wie zum Beispiel die neuen Emojis? Die sind aufgebaut aus zwei oder mehr Bestandteilen, so besteht 🐈‍⬛ aus 🐈, dem \"zero-width-joiner\"-Charakter und danach dem ⬛. Stehen die drei hintereinander, wird es als 🐈‍⬛ angezeigt. Man sagt dem Tokenizer nun auch alle 256 Möglichkeiten, die 8 Bit haben können. Damit kann es unbekannte Charakter trotzdem klassifizieren und nach Kontext in gewisse Richtungen schieben, so zum Beispiel die Richtung für \"Emoji\", wo unter Anderem auch 🐈 bereits ist." : "With encodings such as UTF-8, one character can be several bytes long. What if a character never appeared in the context, such as new emojis? They are built from two or more parts: 🐈‍⬛ consists of 🐈, the zero-width joiner character, and then ⬛. When the three stand together, they display as 🐈‍⬛. The tokenizer is also given all 256 values a byte can take. That lets it represent unknown characters anyway and, depending on context, push them in certain directions, for example the direction for “emoji”, where 🐈 already sits, among others.", tex: "", kind: "question" },
          { id: "q-box-tok-3", title: DE ? "BPE = Kompression" : "BPE = compression", body: DE ? "Byte Pair Encoding beginnt mit Zeichen oder Bytes und ersetzt wiederholt das häufigste Paar durch ein neues Symbol. Nach vielen Merges wird aus häufigen Zeichenfolgen ein einzelner Token. Das ist Datenkompression, gelernt aus dem Trainingskorpus." : "Byte Pair Encoding starts from characters or bytes and repeatedly replaces the most frequent pair with a new symbol. After many merges, a frequent sequence of characters becomes a single token. That is data compression, learned from the training corpus.", tex: "", kind: "trivia" }
        ]
      },
      {
        id: "g-lens-mathematik",
        title: DE ? "Mathematik" : "Mathematics",
        questions: [
          { id: "q-box-tok-2", title: DE ? "Was ist eine ID?" : "What is an ID?", body: DE ? "Eine ID ist ein Integer, der auf eine Zeile in der Embedding-Matrix zeigt. Die ID selbst hat keine Bedeutung; erst der gelernte Vektor gibt dem Token eine Position im Raum." : "An ID is an integer that points to a row in the embedding matrix. The ID itself has no meaning; the learned vector gives the token a position in the space.", tex: "", kind: "question" }
        ]
      },
      {
        id: "g-lens-daten",
        title: DE ? "Daten" : "Data",
        questions: [
          { id: "q-box-tok-bpe-data", title: DE ? "Warum ist die Tokenisierung datenabhängig?" : "Why does tokenization depend on the data?", body: DE ? "Ein Tokenizer wird so optimiert, dass er möglichst viel Text mit möglichst wenigen Tokens abdeckt, ohne Information zu verlieren: Jedes Wort muss aus seinen Tokens wieder zusammensetzbar sein. Deshalb ist die exakte Zerlegung eine Folge der Trainingsdaten und des Vokabularziels, keine feste Wortliste. Seltene Schriften bleiben teurer, weil sie im Korpus seltener sind." : "A tokenizer is optimised to cover as much text as possible with as few tokens as possible without losing information: every word must be reconstructable from its tokens. The exact split is therefore a consequence of the training data and the vocabulary target, not a fixed word list. Rare scripts stay more expensive because they are rarer in the corpus.", tex: "", kind: "question" }
        ]
      },
      {
        id: "g-lens-grenze",
        title: DE ? "Grenze" : "Limit",
        questions: [
          { id: "q-box-tok-4", title: DE ? "Warum brauchen englische Texte oft weniger Token?" : "Why do English texts often need fewer tokens?", body: DE ? "Weil der Trainingskorpus überwiegend englisch ist. Häufige englische Wörter bekommen lange Merges; Schriften mit wenig Text im Korpus bleiben auf Byte-Ebene. Die Demo zeigt das illustrativ, nicht als exakte Messung." : "Because the training corpus is mostly English. Frequent English words receive long merges; scripts with little text in the corpus stay at the byte level. The demo shows this illustratively, not as an exact measurement.", tex: "", kind: "question" }
        ]
      },
      {
        id: "g-sources",
        title: DE ? "Quellen" : "Sources",
        sources: [
          { label: "Sennrich et al. (2016), Neural Machine Translation of Rare Words with Subword Units", url: "https://arxiv.org/abs/1508.07909", why: { de: "BPE als Subword-Kompression für seltene Wörter.", en: "BPE as subword compression for rare words." } },
          { label: "Radford et al. (2019), GPT-2", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", why: { de: "GPT-2: byte-level BPE und die hier gezeigten Hidden States.", en: "GPT-2: byte-level BPE and the hidden states shown here." } }
        ]
      }
    ]
  });

  var embeddingMergeStep = {
    title: DE ? "Bedeutung wird Geometrie" : "Meaning becomes geometry",
    kicker: DE ? "1D · 2D · 3D · Tabelle" : "1D · 2D · 3D · table",
    substeps: [embedSteps[0], embedSteps[1], embedSteps[2], highdimSteps[0]]
  };
  var attentionMergedGroups = DE ? [
    {
      id: "g-basics",
      title: "Eine Ebene tiefer",
      questions: []
    },
    {
      id: "g-lens-grenze",
      title: "Grenze",
      questions: [
        { id: "q-box-att-mis", title: "Ist Attention eine Datenbank?", body: "Nein. Attention schlägt keine Fakten nach. Es berechnet Gewichte über Value-Vektoren und mischt sie zu einer neuen Repräsentation. Das Ergebnis ist keine gespeicherte Zeile, sondern eine kontextabhängige Mischung.", tex: "", kind: "question" },
        { id: "q-edit-1794820087219-1", title: "Wird das für jedes Token einzeln berechnet?", body: "Ja, es wird für jedes Token einzeln berechnet. Wenn man autoregressive Modelle wie Chatbots hat, fügt man noch eine Causal Mask hinzu, die dafür sorgt, dass kein Token von sich aus in die Zukunft schauen kann.", tex: "", kind: "question" }
      ]
    },
    {
      id: "g-lens-mathematik",
      title: "Mathematik",
      questions: [
        { id: "q-box-att-5", title: "Die Formel", body: "Attention bildet aus Query, Key und Value eine gewichtete Summe. Die Softmax-Zeile summiert zu 100 %.", tex: "\\underbrace{x'}_{\\substack{\\text{neuer Vektor}\\\\ \\text{für } i}} = \\underbrace{\\sum_j \\underbrace{\\alpha_{ij}}_{\\substack{\\text{Gewicht von } j\\\\ \\text{für } i}} \\underbrace{v_j}_{\\text{Value von } j}}_{\\substack{\\text{gewichtete Summe}\\\\ \\sum_j \\alpha_{ij}=100\\%}}", kind: "trivia" },
        { id: "q-box-att-2", title: "Warum Softmax?", body: "Softmax macht aus Scores eine Verteilung: positiv, summiert zu 1, Reihenfolge bleibt. Deshalb ist Attention ein endliches Budget.", tex: "", kind: "question" }
      ]
    },
    {
      id: "g-lens-technik",
      title: "Technik",
      questions: [
        { id: "q-box-att-1", title: "Warum drei Vektoren?", body: "Weil Suchen und Beschreiben zwei verschiedene Rollen sind. Ein Pronomen kann nach einem Nomen suchen, ohne selbst wie ein Nomen auszusehen.", tex: "", kind: "question" }
      ]
    },
    {
      id: "g-lens-optional",
      title: "Optional",
      questions: [
        { id: "q-box-att-kv", title: "KV-Cache", body: "Beim Generieren muss das Modell die Keys und Values der bisherigen Tokens nicht neu berechnen, wenn es sie im KV-Cache behält. Es berechnet nur die neuen Keys/Values und lässt das neue Query gegen die gespeicherten Keys laufen. Die wiederholte K/V-Projektion wächst ohne Cache quadratisch mit der Sequenz und mit Cache nur linear; die Attention-Scores selbst bleiben quadratisch (Shazeer, 2019).", tex: "", kind: "trivia" }
      ]
    },
    {
      id: "g-lens-budget",
      title: "Budget",
      questions: [
        { id: "q-box-att-3", title: "Ein Head, ein Budget", body: "Jede Zeile hat genau 1,00 Attention zu vergeben. Mehr für ein Token heißt weniger für alle anderen. Jeder Head hat ein getrenntes Budget.", tex: "", kind: "trivia" },
        { id: "q-edit-1794817884757-1", title: "Warum hat der Punkt fast 60 %? Kodiert er nicht die gesamte Bedeutung?", body: "Ja, für dieses eine Wort. Aber jedes Wort wird eigenständig kodiert. Der Punkt bleibt deshalb größtenteils „Punkt“; das heißt aber nicht, dass alle nur auf diesen Punkt schauen, weil jedes Token ein eigenes Token bleibt.", tex: "", kind: "question" }
      ]
    }
  ] : [
    {
      id: "g-basics",
      title: "One level deeper",
      questions: []
    },
    {
      id: "g-lens-limit",
      title: "Limit",
      questions: [
        { id: "q-box-att-mis", title: "Is attention a database?", body: "No. Attention does not look up facts. It computes weights over value vectors and mixes them into a new representation. The result is not a stored row but a context-dependent mixture.", tex: "", kind: "question" },
        { id: "q-edit-1794820087219-1", title: "Is this computed separately for each token?", body: "Yes, it is computed separately for each token. For autoregressive models such as chatbots, you also add a causal mask, which prevents any token from looking into the future.", tex: "", kind: "question" }
      ]
    },
    {
      id: "g-lens-mathematics",
      title: "Mathematics",
      questions: [
        { id: "q-box-att-5", title: "The formula", body: "Attention builds a weighted sum from query, key, and value. The softmax row sums to 100%.", tex: "\\underbrace{x'}_{\\substack{\\text{new vector}\\\\ \\text{for } i}} = \\underbrace{\\sum_j \\underbrace{\\alpha_{ij}}_{\\substack{\\text{weight of } j\\\\ \\text{for } i}} \\underbrace{v_j}_{\\text{value of } j}}_{\\substack{\\text{weighted sum}\\\\ \\sum_j \\alpha_{ij}=100\\%}}", kind: "trivia" },
        { id: "q-box-att-2", title: "Why softmax?", body: "Softmax turns scores into a distribution: positive, sum to one, order preserved. That is why attention is a finite budget.", tex: "", kind: "question" }
      ]
    },
    {
      id: "g-lens-technique",
      title: "Technique",
      questions: [
        { id: "q-box-att-1", title: "Why three vectors?", body: "Because searching and describing are two different roles. A pronoun can look for a noun without itself looking like a noun.", tex: "", kind: "question" }
      ]
    },
    {
      id: "g-lens-optional",
      title: "Optional",
      questions: [
        { id: "q-box-att-kv", title: "KV cache", body: "During generation the model does not have to recompute the keys and values of earlier tokens if it keeps them in the KV cache. It computes only the new keys/values and lets the new query run against the cached keys. Without the cache the repeated K/V projection grows quadratically with the sequence; with the cache it grows linearly. The attention scores themselves stay quadratic (Shazeer, 2019).", tex: "", kind: "trivia" }
      ]
    },
    {
      id: "g-lens-budget",
      title: "Budget",
      questions: [
        { id: "q-box-att-3", title: "One head, one budget", body: "Every row has exactly 1.00 attention to give. More for one token means less for the others. Each head has a separate budget.", tex: "", kind: "trivia" },
        { id: "q-edit-1794817884757-1", title: "Why does the period get almost 60 %? Doesn't it encode the entire meaning?", body: "Yes, for this one word. But each word is encoded independently. The period therefore stays mostly “period”; that does not mean everything only attends to this period, because each token remains its own token.", tex: "", kind: "question" }
      ]
    }
  ];

  var attentionMerged = {
    kicker: DE ? "Attention" : "Attention",
    title: DE ? "Attention bewegt Punkte anhand des Kontextes" : "Attention moves points based on context",
    body: DE ? "Attention erlaubt es zu schauen, wie sehr jedes Token im Kontext von jedem anderen Token abhängt. Kontext ist alles, was bisher gesagt worden ist in dem Chat bzw. der gesamte Text. Jedes Token hat 100% Attention zur Verfügung, die es auf gelernte Weise auf andere Tokens verteilen kann. Wenn es sagt \"das zweite Token kriegt 80% Attention\", bleiben für alle anderen nur noch 20% übrig. Diese Prozentwerte werden dann genommen, um alle Vektoren gewichtet zu addieren, um einen neuen Vektor zu bekommen, der die Bedeutung (unter einem gewissen Kontext) repräsentiert. Es erlaubt, Antworten in Richtungen zu schieben, ohne sich festzulegen. Attention erlaubt es, sich relativ stark festzulegen, ohne die Flexibilität zu verlieren, die ein konkretes hundertprozentiges Festlegen bedeuten würde. Die Antwort bleibt flexibel. Reale Modelle nutzen nicht nur eine Attention, sondern viele, die lernen, auf verschiedene Kontexte zu achten." : "Attention lets you see how strongly each token in the context depends on every other token. Context is everything said so far in the chat, or the entire text. Each token has 100% attention to distribute over other tokens in a learned way. If it says “the second token gets 80% attention”, only 20% remains for all the others. These percentages are then used to add all vectors with weights, producing a new vector that represents meaning under a certain context. It lets answers be pushed in directions without committing. Attention lets a model commit relatively strongly without losing the flexibility that a concrete 100% commitment would mean. The answer stays flexible. Real models use not just one attention but many, which learn to attend to different contexts.",
    watch: "",
    demoState: { scene: "attention" },
    context: attentionSteps[1].context,
    deep: attentionSteps[1].deep,
    boxes: attentionSteps[1].boxes.concat(attentionSteps[0].boxes),
    questionGroups: attentionMergedGroups,
    sources: attentionSteps[1].sources
  };
  var codeAttentionSubstep = {
    kicker: "Attention",
    title: DE ? "Attention hilft, Rauschen zu ignorieren" : "Attention helps ignore noise",
    body: DE
      ? "Sprache selbst ist Rauschen: „Der Hundt läuft die Strasse“, „The dgo runs the street“ und „Le chienn court la rue“ sind verschiedene Sprachen, Grammatiken und Tippfehler für denselben Gedanken. Dasselbe gilt für Code: „def quickSort“ und „function quick_sort“ sind Oberflächen für dieselbe Funktion. Attention versucht, eine innere, sprachunabhängige Repräsentation zu finden, die diese Unterschiede ignoriert. Klicke Sprache oder Code. Und das ist nur ein Head: Ein Transformer hat viele davon parallel, und jeder kann auf etwas völlig anderes achten."
      : "Language itself is noise: “Der Hundt läuft die Strasse”, “The dgo runs the street”, and “Le chienn court la rue” are different languages, grammars, and typos for the same thought. The same holds for code: “def quickSort” and “function quick_sort” are surfaces for the same function. Attention tries to find an inner, language-independent representation that ignores these differences. Click Language or Code. And this is only one head: a transformer has many of them in parallel, and each can attend to something completely different.",
    watch: DE ? "Klicke Sprache und Code. Landen die drei Sätze und die zwei Codeblöcke auf demselben Punkt? Was ist Rauschen?" : "Click Language and Code. Do the three sentences and the two code blocks land on the same point? What is noise?",
    demoState: { scene: "codesemantic", kind: "language" },
    context: DE ? "Die linke Seite ist die Oberfläche: Sprachen, Grammatiken, Tippfehler, Schreibweisen. Die rechte Seite ist die Bedeutung: „Hund läuft Straße“. Attention löscht die Wörter nicht; sie verschiebt ihre Repräsentation und lässt die Rauschanteile fallen. Ein echtes Modell hat keine ausdrücklich sprachunabhängige Ebene; es lernt Annäherungen aus geteiltem Kontext." : "The left side is the surface: languages, grammars, typos, spellings. The right side is the meaning: “dog runs street”. Attention does not delete the words; it moves their representation and lets the noise parts drop. A real model has no explicitly language-independent layer; it learns approximations from shared context.",
    deep: DE ? "Mehrsprachige Modelle wie XLM-R und mBERT bilden ähnliche Repräsentationen für verwandte Bedeutungen über Sprachen hinweg (Conneau et al., 2020; Pires et al., 2019). Das ist gelernt und nicht garantiert: Bedeutung kann mehrdeutig sein, und seltene Sprachen bleiben benachteiligt. Und weil viele Heads parallel laufen, kann ein anderer Head gleichzeitig auf Syntax, ein dritter auf Position und ein vierter auf etwas ganz anderes achten." : "Multilingual models such as XLM-R and mBERT form similar representations for related meanings across languages (Conneau et al., 2020; Pires et al., 2019). This is learned and not guaranteed: meaning can be ambiguous, and low-resource languages remain disadvantaged. And because many heads run in parallel, another head can attend to syntax, a third to position, and a fourth to something else entirely.",
    boxes: DE ? [
      box("sem-1", "Sprache", "Sprache als Rauschen", "Drei Sätze in drei Sprachen, mit Tippfehlern und anderer Grammatik, meinen dasselbe. Sprache, Schreibweise und Tippfehler sind Oberfläche; die Bedeutung ist der gemeinsame Kern."),
      box("sem-2", "Code", "Code als Rauschen", "def und function sind verschiedene Oberflächen für dieselbe Rolle: eine Funktionsdefinition. quick_sort und quickSort sind verschiedene Oberflächen für dieselbe Rolle: Quicksort."),
      box("sem-3", "Grenze", "Was ist vereinfacht?", "Die Demo zeigt drei Sätze, zwei Codeblöcke und einen abstrakten Punkt. Ein echtes Modell hat Tausende Dimensionen und viele überlappende Rollen; die Pfade sind eine didaktische Vereinfachung."),
      box("sem-4", "Technik", "Viele Heads parallel", "Ein Head ist eine Perspektive. Ein Transformer hat viele Heads gleichzeitig; sie können auf Syntax, Bedeutung, Position, Code oder völlig andere Muster achten. Die Ausgaben werden danach zusammengeführt."),
      box("sem-5", "Grenze", "Gibt es eine sprachunabhängige Ebene?", "Nicht als eigene eingebaute Ebene. Mehrsprachige Modelle lernen ähnliche Richtungen für ähnliche Bedeutungen, weil dieselben Kontexte in vielen Sprachen auftreten. Das ist eine gelernte Annäherung, keine Garantie.")
    ] : [
      box("sem-1", "Language", "Language as noise", "Three sentences in three languages, with typos and different grammar, mean the same thing. Language, spelling, and typos are surface; meaning is the shared core."),
      box("sem-2", "Code", "Code as noise", "def and function are different surfaces for the same role: a function definition. quick_sort and quickSort are different surfaces for the same role: quicksort."),
      box("sem-3", "Limit", "What is simplified?", "The demo shows three sentences, two code blocks, and one abstract point. A real model has thousands of dimensions and many overlapping roles; the paths are a didactic simplification."),
      box("sem-4", "Technique", "Many heads in parallel", "A head is one perspective. A transformer has many heads at once; they can attend to syntax, meaning, position, code, or completely different patterns. Their outputs are combined afterwards."),
      box("sem-5", "Limit", "Is there a language-independent layer?", "Not as a built-in layer. Multilingual models learn similar directions for similar meanings because the same contexts occur in many languages. That is a learned approximation, not a guarantee.")
    ],
    sources: [
      { label: "Tenney et al. (2019), BERT Rediscovers the Classical NLP Pipeline", url: "https://aclanthology.org/P19-1356/", why: { de: "Schichten bilden linguistische Rollen heraus.", en: "Layers develop linguistic roles." } },
      { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Multi-Head-Attention: viele Heads parallel.", en: "Multi-head attention: many heads in parallel." } },
      { label: "Conneau et al. (2020), Unsupervised Cross-lingual Representation Learning at Scale", url: "https://arxiv.org/abs/1911.02116", why: { de: "XLM-R: mehrsprachige Repräsentationen über Sprachen hinweg.", en: "XLM-R: multilingual representations across languages." } },
      { label: "Pires et al. (2019), How Multilingual is Multilingual BERT?", url: "https://arxiv.org/abs/1906.01502", why: { de: "mBERT: gemeinsame Repräsentationen trotz verschiedener Sprachen.", en: "mBERT: shared representations despite different languages." } }
    ]
  };
  var attentionMergeStep = {
    title: DE ? "Attention: Kontext und Matrix" : "Attention: context and matrix",
    kicker: DE ? "Attention" : "Attention",
    substeps: [attentionMerged]
  };

  var neuralNeuronStep = Object.assign({}, insideSteps[0], {
    title: DE ? "Was sind neuronale Netze?" : "What are neural networks?",
    kicker: ""
  });
  var neuralLossStep = Object.assign({}, gradientSteps[0], {
    title: DE ? "Wie findet man gute Punkte?" : "How do you find good points?",
    kicker: DE ? "Optimizer" : "Optimizer",
    watch: "",
    body: DE ? "Wir sehen hier ein kleines reales Netzwerk beim Training. Es hat nur zwei Parameter, $f(x) = w\\cdot x + b$. Der Plot hat 3 Achsen: $w$, $b$ und $Loss$. Für jeden Parameterpunkt in diesem Raum gibt es einen Loss, das heißt einen Wert, wie gut das Netzwerk mit diesen Werten wäre. Training heißt: der Computer guckt sich an, wie gut der aktuelle Punkt ist, und in welche Richtungen er den Punkt verschieben muss, damit das Ergebnis besser wird. Dann verschiebt er den Punkt und schaut erneut.\n\nHier sind es zwei Parameter und damit zwei Dimensionen. Ein großes Sprachmodell hat Milliarden davon, zu viele, um es sich vorzustellen, aber die Idee ist die gleiche." : "We see a small real network training here. It has only two parameters, $f(x) = w\\cdot x + b$. The plot has 3 axes: $w$, $b$, and $loss$. For every parameter point in this space there is a loss, that is, a value for how good the network would be with those values. Training means: the computer looks at how good the current point is and in which directions it has to move the point so that the result gets better. Then it moves the point and looks again.\n\nHere there are two parameters and therefore two dimensions. A large language model has billions of them, too many to picture, but the idea is the same.",
    inherit: false,
    questionGroups: [
      {
        id: "g-basics",
        title: DE ? "Eine Ebene tiefer" : "One level deeper",
        questions: [
          { id: "q-deep", title: DE ? "Wie wird der Loss bestimmt?" : "How is the loss determined?", body: DE ? "Der Loss wird über die Trainingsdaten bestimmt: sie werden einmal komplett durchgetestet und für jedes gespeichert, was aus dem Netz rauskommt, und was rauskommen sollte. " : "The loss is determined by the training data: run all of it through the network once and record, for each example, what comes out and what should come out.", tex: "", kind: "question" }
        ]
      },
      {
        id: "g-lens-mathematik",
        title: DE ? "Mathematik" : "Mathematics",
        questions: [
          { id: "q-box-grad-1", title: DE ? "Wie wird bestimmt, in welche Richtung gegangen werden muss?" : "How is the direction determined?", body: DE ? "Durch tape-basiertes Ableiten. Neuronale Netze sind verschachtelte Funktionen, was bedeutet, dass man beim testen (\"Forward-Pass\") der Daten speichern kann, welche Operationen ausgeführt werden, und dann für jede diese Operationen ihre Ableitungen definiert und sie beim Rückrechnen der Gewichte (\"Backward-Pass\") mit ihrer Ableitung ersetzen kann. Dann kriegt man für jeden Parameter die Steigung an der Stelle, mit der man die Richtung bestimmen kann, in welcher der Fehler niedriger wird." : "Through tape-based differentiation. Neural networks are nested functions, which means that during the forward pass you can record which operations were executed, then define the derivative for each of those operations and replace them with their derivative during the backward pass through the weights. That gives you the slope at the current point for every parameter, which tells you the direction in which the error becomes lower.", tex: "\\underbrace{\\hat y}_{\\text{Ausgabe}} = \\underbrace{w x + b}_{\\text{zwei Parameter}}", kind: "trivia" }
        ]
      },
      {
        id: "g-lens-optional",
        title: DE ? "Optional" : "Optional",
        questions: [
          { id: "q-box-grad-loss", title: DE ? "Andere Loss-Funktionen" : "Other loss functions", body: DE ? "Dieses Modell nutzt <b>MSE</b>, um den Fehler zu bestimmen. Andere Lossfunktionen wie <b>C</b>ategorical <b>Cross</b> <b>E</b>ntropy (<b>CCE</b>) sind besser geeignet für zum Beispiel kategorielle Klassifikationen, funktionieren im Loss etwas anders, aber der Optimizer zieht nicht, wie der Loss zustande kam, sondern nur ihr Ergebnis." : "This model uses <b>MSE</b> to measure the error. Other loss functions such as <b>C</b>ategorical <b>Cross</b> <b>E</b>ntropy (<b>CCE</b>) are better suited to categorical classification, for example; they work slightly differently inside the loss, but the optimizer does not care how the loss was produced, only its result.", tex: "", kind: "trivia" },
          { id: "q-box-grad-saddle", title: DE ? "Sattelpunkte statt Minima" : "Saddle points rather than minima", body: DE ? "In hohen Dimensionen sehen lokale Minima oft wie Sackgassen aus. Viele kritische Punkte sind aber Sattelpunkte: Es gibt fast immer eine Richtung, in der der Loss wieder fällt. Deshalb helfen Momentum und Adam, aus solchen Plateaus herauszukommen. Ein lokales Minimum ist im hochdimensionalen Raum meist nicht das eigentliche Hindernis." : "In high dimensions a local minimum often looks like a dead end. Many critical points are saddle points: there is almost always a direction in which the loss falls again. Momentum and Adam help escape such plateaus. A local minimum is usually not the main obstacle in a high-dimensional space.", tex: "", kind: "trivia" },
          { id: "q-edit-1794810324364-2", title: DE ? "Wie funktioniert Backpropagation?" : "How does backpropagation work?", body: DE ? "Man wusste lange nicht, wie man die Gewichte der inneren Layer trainieren soll. Sagen wir wir haben $\\text{Output} = \\text{layer}_3(\\text{layer}_2(\\text{layer}_1(\\text{Daten})))$. Dann können wir sagen, wie groß die Differenz ist zwischen dem Output und den Daten, die wir wollen, aber wie kommt man an die Differenz zwischen dem, was aus Layer 2 und 1 rauskommt und dem was wir wollen? \n\nWir bestimmen dafür die Differenz zwischen Output und Trainingsziel, und berechnen die Gewichte des letzten Layers, indem wir sagen \"es wäre gut, wenn dieser Wert etwas größer gewesen wäre, und dieser etwas kleiner\". Dann sagen wir, dass der letzte Layer nun der \"Output\"-Layer ist. Damit kriegen wir genau die gleiche Struktur wie vorher: wir können Output und Differenz usw. betrachten und berechnen, dann definieren wir den Layer als Letzten und sagen, dass wir die Differenz berechnen usw. So können wir uns Layer für Layer durch das Netzwerk hangeln, und immer wieder die Änderungen des vorherigen nehmen und als letzten Layer definieren, und so den davor anpassen. Das ist die Idee von Backpropagation." : "For a long time it was unclear how to train the weights of the inner layers. Suppose we have $\\text{Output} = \\text{layer}_3(\\text{layer}_2(\\text{layer}_1(\\text{Data})))$. Then we can say how large the difference is between the output and the data we want, but how do we get at the difference between what comes out of layers 2 and 1 and what we want? \n\nWe determine the difference between output and training target, and compute the weights of the last layer by saying “it would be good if this value had been a bit larger, and this one a bit smaller”. Then we treat the last layer as the new “output” layer. That gives exactly the same structure as before: we can look at output and difference, compute, then define the layer as the last one and say we compute the difference, and so on. That way we can move layer by layer through the network, always take the changes of the previous layer, define it as the last layer, and adjust the one before it. That is the idea of backpropagation.", tex: "", kind: "question" }
        ]
      },
      {
        id: "g-sources",
        title: DE ? "Quellen" : "Sources",
        sources: [
          { label: "Cauchy (1847), Méthode générale", url: "https://gallica.bnf.fr/ark:/12148/bpt6k2982c/f540.item", why: { de: "Frühe Beschreibung des steilsten Abstiegs.", en: "Early description of steepest descent." } },
          { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0", why: { de: "Gradienten für mehrschichtige Netze.", en: "Gradients for multilayer networks." } },
          { label: "Li et al. (2018), Visualizing the Loss Landscape", url: "https://arxiv.org/abs/1712.09913", why: { de: "Zweidimensionale Schnitte durch Loss-Landschaften.", en: "Two-dimensional slices through loss landscapes." } },
          { label: "Dauphin et al. (2014), Saddle Point Problem", url: "https://arxiv.org/abs/1406.2572", why: { de: "Sattelpunkte als Hindernis in hochdimensionaler Optimierung.", en: "Saddle points as an obstacle in high-dimensional optimization." } },
          { label: "Choromanska et al. (2015), Loss Surfaces of Multilayer Networks", url: "https://arxiv.org/abs/1412.0233", why: { de: "Kritische Punkte und lokale Minima in tiefen Netzen.", en: "Critical points and local minima in deep networks." } },
          { label: "Goodfellow, Bengio & Courville (2016), Deep Learning", url: "https://www.deeplearningbook.org/", why: { de: "Loss-Funktionen für Regression und Klassifikation.", en: "Loss functions for regression and classification." } },
          { label: "PyTorch, CrossEntropyLoss", url: "https://pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html", why: { de: "Cross-Entropy für Klassifikation.", en: "Cross-entropy for classification." } },
          { label: "Seppo Linnainmaa (1970), The representation of the cumulative rounding error of an algorithm as a Taylor expansion of the local rounding errors", url: "https://people.idsia.ch/~juergen/linnainmaa1970thesis.pdf", why: { de: "Tapebasiertes Ableiten.", en: "Tape-based differentiation." } }
        ]
      }
    ]
  });
  var neuralActivationStep = Object.assign({}, activationSteps[0], {
    title: DE ? "Was sind neuronale Netze?" : "What are neural networks?",
    kicker: ""
  });
  var neuralLargeStep = Object.assign({}, neuralLargeSteps[0], {
    title: DE ? "Was sind neuronale Netze?" : "What are neural networks?",
    kicker: ""
  });
  var neuralMlpStep = Object.assign({}, mlpSteps[0], {
    title: DE ? "Der Raum biegt sich" : "Space bends"
  });

  var crossEntropyStep = {
    kicker: DE ? "Loss" : "Loss",
    title: DE ? "Der Loss: Was das Modell optimiert" : "The loss: what the model optimises",
    body: DE
      ? "Das Modell sagt für das nächste Token Wahrscheinlichkeiten voraus. Richtig ist „Paris“, aber das Modell gibt „London“ 50 % und „Paris“ 30 %. Der Loss bestraft die Wahrscheinlichkeit des richtigen Tokens: −log(0.30) ≈ 1.20. Der Gradient p − y sagt dann: Paris-Logit rauf, London-Logit runter. Ein Trainingsschritt verschiebt die Logits genau so; nach vielen Schritten wird Paris wahrscheinlicher und der Loss kleiner. Drücke Weiter oder →: Die Demo geht die vier Zielwörter nacheinander durch und macht für jedes einen Trainingsschritt."
      : "The model predicts probabilities for the next token. The correct token is “Paris”, but the model gives “London” 50% and “Paris” 30%. The loss punishes the probability of the correct token: −log(0.30) ≈ 1.20. The gradient p − y then says: raise the Paris logit, lower the London logit. A training step moves the logits exactly like that; after many steps Paris becomes more likely and the loss gets smaller. Press Next or →: the demo moves through the four target words in order and makes one training step for each.",
    watch: DE ? "Drücke Weiter oder →: Paris, London, Berlin, the. Jedes Wort bekommt einen Trainingsschritt; beobachte Loss und p." : "Press Next or →: Paris, London, Berlin, the. Each word gets one training step; watch the loss and p.",
    demoState: { scene: "crossentropy" },
    context: DE ? "y ist ein One-Hot-Vektor: 1 für Paris, 0 sonst. p ist die Softmax-Verteilung. Der Loss ist die negative Log-Likelihood des Ziels." : "y is a one-hot vector: 1 for Paris, 0 elsewhere. p is the softmax distribution. The loss is the negative log-likelihood of the target.",
    deep: DE ? "Der Gradient p−y ist der Grund, warum Softmax und Cross-Entropy zusammen so sauber funktionieren. Ein Schritt lautet z ← z − η(p−y): Das Ziel-Logit steigt, alle anderen fallen." : "The gradient p−y is why softmax and cross-entropy work together so cleanly. A step is z ← z − η(p−y): the target logit rises, all others fall.",
    boxes: [
      box("ce-1", DE ? "Beispiel" : "Example", DE ? "Was ist das Ziel?" : "What is the target?", DE ? "Richtig ist Paris. Das Modell gibt Paris 30 %, London 50 %. Der Loss bestraft nur die 30 % des richtigen Tokens." : "The target is Paris. The model gives Paris 30%, London 50%. The loss punishes only the 30% of the correct token."),
      box("ce-2", DE ? "Mathematik" : "Mathematics", DE ? "Warum −log?" : "Why −log?", DE ? "−log(0.30) ≈ 1.20. Bei p = 1 wäre der Loss 0; je kleiner die Wahrscheinlichkeit des Ziels, desto größer der Loss." : "−log(0.30) ≈ 1.20. At p = 1 the loss would be 0; the smaller the target probability, the larger the loss."),
      box("ce-3", DE ? "Training" : "Training", DE ? "Was macht der Gradient?" : "What does the gradient do?", DE ? "p−y: Paris bekommt einen negativen Gradienten (Logit steigt), London einen positiven (Logit fällt). Der Trainingsschritt folgt genau diesem Signal." : "p−y: Paris gets a negative gradient (its logit rises), London a positive one (its logit falls). The training step follows exactly this signal."),
      box("ce-4", DE ? "Mathematik" : "Mathematics", DE ? "Die Formel" : "The formula", DE ? "Cross-Entropy für ein Token und ihr Gradient nach den Logits." : "Cross-entropy for one token and its gradient with respect to the logits.", DE ? "\\underbrace{-\\log \\underbrace{p_\\theta(y\\mid x)}_{\\substack{\\text{Wahrscheinlichkeit}\\\\ \\text{des Ziels}}}}_{\\text{Loss des richtigen Tokens}} \\qquad \\underbrace{\\frac{\\partial L}{\\partial z_i} = \\underbrace{p_i - y_i}_{\\text{Gradient pro Logit}}}_{\\text{was der Trainingsschritt benutzt}}" : "\\underbrace{-\\log \\underbrace{p_\\theta(y\\mid x)}_{\\substack{\\text{probability}\\\\ \\text{of the target}}}}_{\\text{loss of the correct token}} \\qquad \\underbrace{\\frac{\\partial L}{\\partial z_i} = \\underbrace{p_i - y_i}_{\\text{gradient per logit}}}_{\\text{what the training step uses}}")
    ],
    sources: [
      { label: "Bengio et al. (2003), A Neural Probabilistic Language Model", url: "https://www.jmlr.org/papers/v3/bengio03a.html", why: { de: "Neuronale Sprachmodelle und Next-Token-Wahrscheinlichkeiten.", en: "Neural language models and next-token probabilities." } },
      { label: "Goodfellow, Bengio & Courville (2016), Deep Learning", url: "https://www.deeplearningbook.org/", why: { de: "Softmax, Cross-Entropy und Gradienten.", en: "Softmax, cross-entropy, and gradients." } }
    ]
  };

  var qkvArcs = {
    kicker: DE ? "Q · K · V" : "Q · K · V",
    title: DE ? "Wie Attention rechnet" : "How attention computes",
    body: DE
      ? "Jedes Token erzeugt drei Vektoren: Query, Key und Value. Der Query fragt, der Key antwortet, der Value trägt die Information. Attention vergleicht Query und Key, macht aus den Scores mit Softmax Gewichte und mischt die Values. Mehrere Heads tun das parallel mit eigenen Gewichten: Ein Head kann nach dem Subjekt fragen, ein anderer nach dem Ort."
      : "Every token produces three vectors: query, key, and value. The query asks, the key answers, and the value carries the information. Attention compares query and key, turns the scores into weights with softmax, and mixes the values. Multiple heads do this in parallel with their own weights: one head can ask for the subject, another for the location.",
    watch: DE ? "Wechsle die Heads: Head 1 zeigt auf „Tier“ (Subjekt), Head 2 auf „Straße“ (Ort)." : "Switch the heads: head 1 points to “animal” (the subject), head 2 to “street” (the location).",
    demoState: { scene: "qkv", head: 0, view: "arcs" },
    context: DE ? "Die Scores werden durch sqrt(d_k) geteilt, damit sie in hohen Dimensionen nicht zu groß werden. Jede Query-Zeile summiert nach Softmax zu 1." : "The scores are divided by sqrt(d_k) so they do not grow too large in high dimensions. Each query row sums to 1 after softmax.",
    deep: DE ? "Die Heads sind nicht von Hand programmiert; sie spezialisieren sich im Training. Die zwei Muster in der Demo sind didaktisch: Head 1 fragt nach dem Subjekt, Head 2 nach dem Ort." : "The heads are not hand-programmed; they specialise during training. The two patterns in the demo are didactic: head 1 asks for the subject, head 2 for the location.",
    boxes: [
      box("qkv-1", DE ? "Technik" : "Technique", "Q, K, V", DE ? "Query: wonach fragt das Token? Key: was bietet es an? Value: welche Information wird weitergegeben?" : "Query: what does the token ask for? Key: what does it offer? Value: which information is passed on?"),
      box("qkv-2", DE ? "Mathematik" : "Mathematics", "Softmax", DE ? "Macht aus den Scores eine Verteilung. Jede Query-Zeile summiert zu 1; mehr Gewicht für einen Key heißt weniger für alle anderen." : "Turns scores into a distribution. Every query row sums to 1; more weight for one key means less for all others."),
      box("qkv-3", DE ? "Technik" : "Technique", DE ? "Mehrere Heads" : "Multiple heads", DE ? "Jeder Head hat eigene Q/K/V-Projektionen. Die Ausgaben werden konkateniert und projiziert." : "Every head has its own Q/K/V projections. The outputs are concatenated and projected."),
      box("qkv-4", DE ? "Mathematik" : "Mathematics", DE ? "Die Formel" : "The formula", DE ? "Attention als gewichtete Mischung der Values." : "Attention as a weighted mixture of the values.", DE ? "\\underbrace{\\underbrace{\\operatorname{softmax}\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right)}_{\\alpha}V}_{\\text{gewichtete Mischung der Values}}" : "\\underbrace{\\underbrace{\\operatorname{softmax}\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right)}_{\\alpha}V}_{\\text{weighted mixture of the values}}"),
      box("qkv-5", DE ? "Technik" : "Technique", DE ? "Auch für Bilder" : "Images too", DE ? "Ein Vision Transformer zerlegt ein Bild in Patches und behandelt die Patches wie Tokens. Dieselbe Self-Attention lässt sie aufeinander schauen; das ist die Technik aus der Sprachverarbeitung (Dosovitskiy et al., 2021)." : "A vision transformer splits an image into patches and treats the patches like tokens. The same self-attention lets them attend to each other; this is the technique from language processing (Dosovitskiy et al., 2021).")
    ],
    sources: [
      { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Q/K/V, Multi-Head-Attention und Softmax-Gewichte.", en: "Q/K/V, multi-head attention, and softmax weights." } },
      { label: "Dosovitskiy et al. (2021), An Image is Worth 16x16 Words", url: "https://arxiv.org/abs/2010.11929", why: { de: "Vision Transformer: Bild-Patches mit Self-Attention.", en: "Vision transformer: image patches with self-attention." } }
    ]
  };

  var hallucinationCauses = {
    kicker: DE ? "Typen" : "Types",
    title: DE ? "Arten von Halluzinationen" : "Types of hallucination",
    body: DE
      ? "Halluzinationen sind nicht ein einziger Fehler. Die Forschung unterscheidet unter anderem falsche Fakten, erfundene Quellen, intrinsische und extrinsische Halluzinationen, Kontextkonflikte, veraltetes Wissen, Entitätsvertauschungen und Negationsfehler. Jeder Typ hat ein Beispiel und ein Gegenmittel. Klicke die Typen durch."
      : "Hallucinations are not one single failure. Research distinguishes false facts, fabricated citations, intrinsic and extrinsic hallucinations, context conflicts, outdated knowledge, entity swaps, and negation errors. Every type has an example and a countermeasure. Click through the types.",
    watch: DE ? "Klicke die Typen. Welches Beispiel erkennst du wieder? Welches Gegenmittel passt?" : "Click the types. Which example do you recognise? Which countermeasure fits?",
    demoState: { scene: "hallucinationtypes" },
    context: DE ? "Intrinsic heißt: Die Antwort widerspricht der Quelle. Extrinsic heißt: Sie fügt Information hinzu, die die Quelle nicht deckt (Maynez et al., 2020; Ji et al., 2023)." : "Intrinsic means the answer contradicts the source. Extrinsic means it adds information the source does not support (Maynez et al., 2020; Ji et al., 2023).",
    deep: DE ? "Die Typen überschneiden sich. Wichtig ist die Unterscheidung nach Ursache: Datenproblem, Decoding-Problem, Repräsentationsproblem oder fehlende Erdung. Daraus folgt, welches Gegenmittel sinnvoll ist." : "The types overlap. What matters is the cause: data problem, decoding problem, representation problem, or missing grounding. That decides which countermeasure is useful.",
    boxes: DE ? [
      box("hct-1", "Daten", "Falsche Fakten", "Das Modell wiederholt eine falsche Aussage mit ruhiger Stimme. Gegenmittel: Quelle prüfen, RAG, Zitat verlangen."),
      box("hct-2", "Quelle", "Erfundene Quellen", "Eine DOI, ein Autor oder ein Paper klingt echt, existiert aber nicht. Gegenmittel: Link prüfen, nur bereitgestellte Quellen zitieren."),
      box("hct-3", "Quelle", "Intrinsic vs. extrinsic", "Intrinsic widerspricht der Quelle; extrinsic ergänzt Unbelegtes. Gegenmittel: Faithfulness-Check und Attribution."),
      box("hct-4", "Kontext", "Konflikt und Zeit", "Die Antwort ignoriert den gegebenen Kontext oder nutzt veraltetes Wissen. Gegenmittel: Kontext zitieren, Datum prüfen, Retrieval."),
      box("hct-5", "Sprache", "Entität und Negation", "Namen oder Zahlen werden vertauscht; „nicht glücklich“ rutscht Richtung „traurig“. Gegenmittel: Entitäten und logische Schritte separat prüfen."),
      box("hct-6", "Decoding", "Sampling", "Zufall wählt einen plausiblen, aber falschen Pfad. Gegenmittel: Temperatur senken, mehrere Antworten vergleichen, Selbstkonsistenz.")
    ] : [
      box("hct-1", "Data", "False facts", "The model repeats a false statement in a calm voice. Countermeasure: check the source, use RAG, require a citation."),
      box("hct-2", "Source", "Fabricated citations", "A DOI, author, or paper sounds real but does not exist. Countermeasure: check the link, cite only provided sources."),
      box("hct-3", "Source", "Intrinsic vs. extrinsic", "Intrinsic contradicts the source; extrinsic adds unsupported content. Countermeasure: faithfulness check and attribution."),
      box("hct-4", "Context", "Conflict and time", "The answer ignores the given context or uses outdated knowledge. Countermeasure: quote the context, check the date, use retrieval."),
      box("hct-5", "Language", "Entity and negation", "Names or numbers get swapped; “not happy” drifts toward “sad”. Countermeasure: check entities and logical steps separately."),
      box("hct-6", "Decoding", "Sampling", "Randomness picks a plausible but false path. Countermeasure: lower temperature, compare several answers, use self-consistency.")
    ],
    sources: [
      { label: "Ji et al. (2023), Survey of Hallucination in Natural Language Generation", url: "https://arxiv.org/abs/2202.03629", why: { de: "Überblick über Halluzinationsarten und -ursachen.", en: "Overview of hallucination types and causes." } },
      { label: "Maynez et al. (2020), On Faithfulness and Factuality in Abstractive Summarization", url: "https://arxiv.org/abs/2005.00661", why: { de: "Intrinsic und extrinsic Halluzinationen in Zusammenfassungen.", en: "Intrinsic and extrinsic hallucinations in summarization." } },
      { label: "Huang et al. (2023), A Survey on Hallucination in Large Language Models", url: "https://arxiv.org/abs/2311.05232", why: { de: "Taxonomie und offene Fragen zu LLM-Halluzinationen.", en: "Taxonomy and open questions on LLM hallucinations." } },
      { label: "Rawte et al. (2023), A Survey of Hallucination in Large Foundation Models", url: "https://arxiv.org/abs/2309.05922", why: { de: "Überblick über Halluzinationen in großen Foundation-Modellen.", en: "Overview of hallucinations in large foundation models." } }
    ]
  };

  var hallucinationGuard = {
    kicker: DE ? "Schutz" : "Defence",
    title: DE ? "So werden Halluzinationen seltener" : "How to make hallucinations rarer",
    body: DE
      ? "Drei Hebel: vertrauenswürdige Quellen in den Kontext legen (RAG), schrittweise prüfen (CoT und Verifikation) und die Antwort mit einem Zitat oder einem Eingeständnis absichern. Klicke die Schalter: Ohne Quelle bleibt die Antwort eine Vermutung; mit Quelle und Gegenprüfung wird sie gedeckt."
      : "Three levers: put trusted sources into the context (RAG), check step by step (CoT and verification), and secure the answer with a citation or an admission. Click the toggles: without a source the answer stays a guess; with a source and a cross-check it becomes grounded.",
    watch: DE ? "Schalte Quellen, Schrittweise und Gegenprüfung. Wann ist die Antwort gedeckt, wann sagt das Modell „keine Quelle“?" : "Toggle sources, step-by-step, and verification. When is the answer grounded, and when does the model say “no source”?",
    demoState: { scene: "hallucinationguard" },
    context: DE ? "RAG holt Dokumente und legt sie in den Kontext (Lewis et al., 2020). CoT macht Zwischenschritte sichtbar (Wei et al., 2022); Chain-of-Verification prüft die Antwort mit unabhängigen Fragen (Dhuliawala et al., 2023)." : "RAG retrieves documents and puts them into the context (Lewis et al., 2020). CoT makes intermediate steps visible (Wei et al., 2022); chain-of-verification checks the answer with independent questions (Dhuliawala et al., 2023).",
    deep: DE ? "Keine Methode garantiert Wahrheit. RAG hilft nur, wenn die Quelle gut ist; CoT kann plausibel, aber falsch schlussfolgern; Verifikation braucht eine unabhängige Quelle. Am robustesten ist die Kombination: Quelle, Zitat und ein Eingeständnis, wenn die Deckung fehlt." : "No method guarantees truth. RAG helps only if the source is good; CoT can reason plausibly but wrongly; verification needs an independent source. The most robust combination is source, citation, and an admission when support is missing.",
    boxes: DE ? [
      box("hg-1", "RAG", "Quellen in den Kontext", "Retrieval holt vertrauenswürdige Dokumente und legt sie in den Kontext. Das Modell soll daraus antworten und die Quelle nennen, nicht aus dem Gedächtnis raten."),
      box("hg-2", "CoT", "Schrittweise prüfen", "Die Antwort wird in Schritte zerlegt: Frage, Quelle, Schluss. So werden übersprungene Schritte und selbst gefüllte Lücken sichtbar."),
      box("hg-3", "Verifikation", "Gegenprüfung", "Chain-of-Verification stellt unabhängige Prüffragen und revidiert die Antwort. Ohne Deckung lautet die Antwort „keine Quelle“ statt einer Erfindung."),
      box("hg-4", "Grenze", "Was bleibt?", "RAG ist nur so gut wie die Quelle; CoT kann falsch reasoning; Verifikation braucht Unabhängigkeit. Keine Methode macht Wahrheit garantiert.")
    ] : [
      box("hg-1", "RAG", "Sources in the context", "Retrieval pulls trusted documents into the context. The model should answer from them and name the source instead of guessing from memory."),
      box("hg-2", "CoT", "Check step by step", "Break the answer into steps: question, source, conclusion. That makes skipped steps and self-filled gaps visible."),
      box("hg-3", "Verification", "Cross-check", "Chain-of-verification asks independent checking questions and revises the answer. Without support the answer is “no source” instead of an invention."),
      box("hg-4", "Limit", "What remains?", "RAG is only as good as the source; CoT can reason wrongly; verification needs independence. No method guarantees truth.")
    ],
    sources: [
      { label: "Lewis et al. (2020), Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", url: "https://arxiv.org/abs/2005.11401", why: { de: "RAG: Retrieval und Generierung verbinden.", en: "RAG: combine retrieval and generation." } },
      { label: "Wei et al. (2022), Chain-of-Thought Prompting", url: "https://arxiv.org/abs/2201.11903", why: { de: "Schrittweises Reasoning als Prompt-Muster.", en: "Step-by-step reasoning as a prompting pattern." } },
      { label: "Dhuliawala et al. (2023), Chain-of-Verification Reduces Hallucination", url: "https://arxiv.org/abs/2309.11495", why: { de: "Antworten mit unabhängigen Prüffragen verifizieren.", en: "Verify answers with independent checking questions." } }
    ]
  };

  var hallucinationStep = {
    title: DE ? "Warum Modelle halluzinieren" : "Why models hallucinate",
    kicker: DE ? "Grenze" : "Limit",
    substeps: [hallucinationCauses, hallucinationGuard]
  };

  var consciousnessStep = {
    kicker: DE ? "Bewusstsein" : "Consciousness",
    title: DE ? "Bewusstsein: viele Karten, eine offene Frage" : "Consciousness: many maps, one open question",
    body: DE
      ? "Bewusstsein ist kein einzelnes Ding. Zugang bedeutet, dass Information zum Berichten und Steuern verfügbar ist; Erfahrung bedeutet, dass es sich auf eine bestimmte Weise anfühlt. Global Workspace Theory beschreibt Bewusstsein als Broadcast an viele Prozesse; IIT misst geeinte Ursache-Wirkungs-Struktur als Phi; J-space ist ein lesbarer Arbeitsraum in Claude, aber ein Zugangsbefund, kein Beweis von Erleben. Die Karte zeigt Positionen, kein Urteil. Du kannst selbst entscheiden, welche Theorie dir am nächsten kommt."
      : "Consciousness is not a single thing. Access means information is available to report and control; experience means there is something it is like. Global workspace theory describes consciousness as broadcast to many processes; IIT measures a unified cause-effect structure as Phi; J-space is a readable workspace in Claude, but an access finding, not proof of experience. The map shows positions, not a verdict. You can decide for yourself which theory feels closest.",
    watch: DE ? "Klicke die Knoten. Welche Theorie beschreibt Zugang, welche Erfahrung?" : "Click the nodes. Which theory describes access, which describes experience?",
    demoState: { scene: "consciousness" },
    inherit: false,
    questionGroups: [
      {
        id: "g-basics",
        title: DE ? "Eine Ebene tiefer" : "One level deeper",
        questions: [
          { id: "q-context", title: DE ? "Was ist der Kontext?" : "What is the context?", body: DE ? "Zugang und Erfahrung sind verschiedene Fragen. Ein System kann Informationen nutzen, ohne dass es sich für das System anfühlt, wie etwas ist." : "Access and experience are different questions. A system can use information without there being something it is like to be it.", tex: "", kind: "question" },
          { id: "q-deep", title: DE ? "Warum ist das so?" : "Why is that so?", body: DE ? "Die Theorien widersprechen sich nicht nur in den Antworten, sondern darin, was als Evidenz zählt. Für LLMs können wir Verhalten und funktionalen Zugang messen; über Erleben entscheidet das nicht." : "The theories disagree not only in their answers but in what counts as evidence. For LLMs we can measure behaviour and functional access; that does not decide experience.", tex: "", kind: "question" }
        ]
      },
      {
        id: "g-lens-zugang",
        title: DE ? "Zugang" : "Access",
        questions: [
          { id: "q-box-con-1", title: DE ? "Access Consciousness" : "Access consciousness", body: DE ? "Information ist verfügbar für Bericht und Kontrolle. Ein Modell kann das haben, ohne etwas zu erleben." : "Information is available for report and control. A model can have this without experiencing anything.", tex: "", kind: "trivia" }
        ]
      },
      {
        id: "g-lens-erfahrung",
        title: DE ? "Erfahrung" : "Experience",
        questions: [
          { id: "q-box-con-2", title: DE ? "Phenomenal Consciousness" : "Phenomenal consciousness", body: DE ? "Es gibt etwas, wie es sich anfühlt. Genau das lässt sich von außen nicht direkt messen." : "There is something it is like. That is exactly what cannot be measured directly from outside.", tex: "", kind: "trivia" }
        ]
      },
      {
        id: "g-lens-theorien",
        title: DE ? "Theorien" : "Theories",
        questions: [
          { id: "q-box-con-3", title: DE ? "Global Workspace" : "Global workspace", body: DE ? "Ein Zustand wird bewusst, wenn er an viele Prozesse gesendet wird. Der Residual Stream ist ein funktionaler Cousin." : "A state becomes conscious when it is broadcast to many processes. The residual stream is a functional cousin.", tex: "", kind: "trivia" },
          { id: "q-box-con-4", title: DE ? "IIT und Phi" : "IIT and Phi", body: DE ? "Bewusstsein ist eine geeinte Ursache-Wirkungs-Struktur. Phi ist für LLMs nicht gemessen; die Theorie ist schwer anzuwenden." : "Consciousness is a unified cause-effect structure. Phi has not been measured for LLMs; the theory is hard to apply.", tex: "", kind: "trivia" }
        ]
      },
      {
        id: "g-lens-llm",
        title: DE ? "LLM" : "LLMs",
        questions: [
          { id: "q-box-con-5", title: DE ? "J-space" : "J-space", body: DE ? "Ein kleiner, lesbarer Arbeitsraum in Claude. Er sieht wie Zugang aus, nicht wie ein Beweis von Erleben." : "A small, readable workspace in Claude. It looks like access, not proof of experience.", tex: "", kind: "trivia" }
        ]
      },
      {
        id: "g-sources",
        title: DE ? "Quellen" : "Sources",
        sources: [
          { label: "Mashour et al. (2020), Conscious Processing and the Global Neuronal Workspace Hypothesis", url: "https://doi.org/10.1016/j.neuron.2020.01.026", why: { de: "Global Workspace und bewusste Verarbeitung.", en: "Global workspace and conscious processing." } },
          { label: "Tononi et al. (2016), Integrated Information Theory: From Consciousness to Its Physical Substrate", url: "https://doi.org/10.1038/nrn.2016.44", why: { de: "IIT und Phi als Maß für geeinte Struktur.", en: "IIT and Phi as a measure of unified structure." } },
          { label: "Block (1995), On a Confusion about a Function of Consciousness", url: "https://doi.org/10.1017/S0140525X00038188", why: { de: "Zugang versus phänomenales Bewusstsein.", en: "Access versus phenomenal consciousness." } },
          { label: "Nagel (1974), What Is It Like to Be a Bat?", url: "https://doi.org/10.2307/2183914", why: { de: "Die subjektive Erfahrung als offene Frage.", en: "Subjective experience as an open question." } },
          { label: "Anthropic (2026), J-space", url: "https://transformer-circuits.pub/2026/workspace/index.html", why: { de: "Lesbarer Arbeitsraum in Claude; Zugang, nicht Erleben.", en: "Readable workspace in Claude; access, not experience." } },
          { label: "SEP: Consciousness", url: "https://plato.stanford.edu/entries/consciousness/", why: { de: "Überblick über die Bewusstseinstheorien.", en: "Overview of theories of consciousness." } }
        ]
      }
    ],
  };

  var tunnelStep = {
    kicker: DE ? "Bonus · Wahrscheinlichkeit" : "Bonus · probability",
    title: DE ? "Der Wahrscheinlichkeitstunnel" : "The probability tunnel",
    body: DE
      ? "Der Wahrscheinlichkeitstunnel zeigt dieselbe Idee als Landschaft. Jede Kante ist ein mögliches nächstes Token; die Tiefe des Tals ist seine Wahrscheinlichkeit. Mit jedem gewählten Token wird der Kontext länger, die Täler verschieben sich, und viele Nebenwege schließen sich. Drehe die Szene und wähle einen alternativen Weg: Du siehst, dass das Modell nicht einen richtigen Weg kennt, sondern bei jedem Schritt eine Verteilung formt."
      : "The probability tunnel shows the same idea as a landscape. Each edge is a possible next token; the depth of the valley is its probability. With every chosen token the context grows, the valleys shift, and many side paths close. Rotate the scene and choose an alternative path: you see that the model does not know one correct path; at every step it shapes a distribution.",
    watch: DE ? "Drehe die Szene. Wähle einen alternativen Weg und beobachte, wie sich die Täler mit dem Kontext verschieben. Erhöhe T: Die Landschaft wird flacher." : "Rotate the scene. Choose an alternative path and watch the valleys shift with the context. Raise T: the landscape flattens.",
    demoState: { scene: "tunnel" },
    context: DE ? "Die Landschaft ist didaktisch: Täler sind Wahrscheinlichkeiten, keine Wahrheiten. Ein echtes Modell arbeitet in Tausenden Dimensionen; die Szene projiziert das auf drei." : "The landscape is didactic: valleys are probabilities, not truths. A real model works in thousands of dimensions; the scene projects that onto three.",
    deep: DE ? "Temperatur skaliert die Logits vor dem Softmax. Hohe Temperatur flacht die Täler ab, niedrige schärft sie. Der goldene Pfad ist nur eine mögliche Route; die blauen Nebenwege sind Alternativen, die im Kontext noch plausibel sind." : "Temperature scales the logits before softmax. High temperature flattens the valleys, low temperature sharpens them. The gold path is only one possible route; the blue side paths are alternatives that are still plausible in context.",
    boxes: [
      box("tun-1", DE ? "Geometrie" : "Geometry", DE ? "Was zeigt die Tiefe?" : "What does depth show?", DE ? "Die Tiefe ist die Wahrscheinlichkeit des nächsten Tokens unter dem aktuellen Kontext. Ein tiefes Tal ist wahrscheinlich, ein flacher Nebenweg bleibt möglich. Die Form ist ein Bild, keine Messung des echten Token-Raums." : "Depth is the probability of the next token under the current context. A deep valley is likely; a shallow side path stays possible. The shape is a picture, not a measurement of the real token space."),
      box("tun-2", DE ? "Kontext" : "Context", DE ? "Warum schließen sich Wege?" : "Why do paths close?", DE ? "Jedes gewählte Token verändert den Kontext. Das Modell berechnet die Verteilung neu, und Alternativen, die vorher plausibel waren, verlieren an Wahrscheinlichkeit. Der Tunnel wird enger, weil der Satz eindeutiger wird." : "Every chosen token changes the context. The model recomputes the distribution, and alternatives that were plausible before lose probability. The tunnel narrows because the sentence becomes more specific."),
      box("tun-3", DE ? "Grenze" : "Limit", DE ? "Was ist die Kugel?" : "What is the ball?", DE ? "Die Kugel ist der aktuelle Zustand. Jede Wahl gibt ihr Richtung und Schwung; sie rollt in das Tal der gewählten Fortsetzung. Die Bewegung ist ein didaktisches Bild für die wiederholte Neuberechnung, kein realer Pfad im Modell." : "The ball is the current state. Each choice gives it direction and momentum; it rolls into the valley of the chosen continuation. The motion is a didactic picture of the repeated recomputation, not a real path in the model.")
    ]
  };

  var qkvSimplex = {
    kicker: DE ? "Mischung" : "Mixture",
    title: DE ? "Attention als Mischung der Value-Vektoren" : "Attention as a mixture of value vectors",
    body: DE
      ? "Attention gibt nicht einfach ein Wort zurück. Die drei Ecken sind keine Tokens, sondern die gelernten Value-Vektoren von drei Tokens: Tier, Straße und es. Die Ausgabe ist eine gewichtete Mischung dieser Values: Jedes Gewicht ist nicht negativ, und alle summieren zu 1. Vaswani et al. (2017, §3.2) nennen das „a weighted sum of the values“. Deshalb liegt die Ausgabe immer im Dreieck, das die drei Value-Vektoren aufspannen. Die drei Gewichte α im Simplex (zwei Freiheitsgrade wegen Σ = 1) sind die Variablen, nicht die Tokens. Wechsle den Head: Die Gewichte verschieben sich, der Punkt wandert, aber nie aus dem Dreieck. Die Anzeige rechnet die Rohgewichte auf Prozent um."
      : "Attention does not simply return a word. The three corners are not tokens; they are the learned value vectors of three tokens: animal, street, and it. The output is a weighted mixture of these values: every weight is non-negative, and all sum to 1. Vaswani et al. (2017, §3.2) call this “a weighted sum of the values”. Therefore the output always lies in the triangle those three value vectors span. The three weights α in the simplex (two degrees of freedom because Σ = 1) are the variables, not the tokens. Switch the head: the weights shift, the point moves, but never outside the triangle. The display converts the raw weights into percentages.",
    watch: DE ? "Wechsle die Heads. Wie wandert der Ausgabepunkt im Dreieck?" : "Switch the heads. How does the output point move inside the triangle?",
    demoState: { scene: "qkv", head: 0, view: "simplex" },
    context: DE ? "Vaswani et al. (2017, §3.2) sagen es direkt: „The output is computed as a weighted sum of the values“. Die Ecken sind v_j = W_V x_j, also gelernte Value-Vektoren, keine Token-IDs. Die Gewichte α_ij sind die baryzentrischen Koordinaten; sie sind ≥ 0 und summieren zu 1. Bei drei Values ist die konvexe Hülle ein 2-Simplex. Die echte Ausgabe nutzt alle Values und liegt in deren konvexer Hülle." : "Vaswani et al. (2017, §3.2) put it directly: “The output is computed as a weighted sum of the values.” The corners are v_j = W_V x_j, learned value vectors, not token IDs. The weights α_ij are barycentric coordinates; they are ≥ 0 and sum to 1. With three values the convex hull is a 2-simplex. The real output uses all values and lies in their convex hull.",
    deep: DE ? "Die Ecken sind input-abhängig: Gelernt ist W_V, nicht ein fester Simplex. Bei drei Values ist die Hülle ein Dreieck (2-Simplex); in hohen Dimensionen ist sie ein Polytop. Der Simplex ist keine eigene gelernte Größe, sondern die konvexe Hülle der Value-Vektoren. Die Aussage gilt für jeden Head; die Gewichte unterscheiden sich, die Konvexität bleibt." : "The corners depend on the input: W_V is learned, not a fixed simplex. With three values the hull is a triangle (2-simplex); in high dimensions it is a polytope. The simplex is not a separate learned object; it is the convex hull of the value vectors. The statement holds for every head; the weights differ, the convexity stays.",
    boxes: DE ? [
      box("qkv-s1", "Geometrie", "Die Ecken sind Values", "Die drei Punkte sind keine Tokens, sondern die gelernten Value-Vektoren von drei Tokens. Jeder Token trägt über W_V einen Vektor bei."),
      box("qkv-s2", "Mathematik", "Was ist ein Simplex?", "Ein Simplex ist die einfachste konvexe Hülle: ein Punkt ist ein 0-Simplex, zwei Punkte eine Strecke, drei Punkte ein Dreieck."),
      box("qkv-s3", "Mathematik", "Die Variablen", "Die drei Gewichte α sind die Variablen; wegen Σ = 1 haben sie zwei Freiheitsgrade. Sie sind nicht negativ; die Tokens selbst sind nicht die Koordinaten des Simplex."),
      box("qkv-s4", "Mathematik", "Die Formel", "Gewichtete Summe mit nicht-negativen Gewichten, die zu 1 summieren.", "\\underbrace{\\sum_j \\underbrace{\\alpha_{ij}}_{\\ge 0,\\ \\sum_j \\alpha_{ij}=1} v_j}_{\\text{konvexe Kombination der Values}}"),
      box("qkv-s5", "Grenze", "Was kommt danach?", "Attention allein bleibt in der konvexen Hülle der Values. Das FFN danach ist nichtlinear und kann diese Hülle verlassen; deshalb ist der Transformer-Block mehr als eine Mischung.")
    ] : [
      box("qkv-s1", "Geometry", "The corners are values", "The three points are not tokens; they are the learned value vectors of three tokens. Each token contributes a vector through W_V."),
      box("qkv-s2", "Mathematics", "What is a simplex?", "A simplex is the simplest convex hull: one point is a 0-simplex, two points a segment, three points a triangle."),
      box("qkv-s3", "Mathematics", "The variables", "The three weights α are the variables; because Σ = 1 they have two degrees of freedom. They are non-negative; the tokens themselves are not the coordinates of the simplex."),
      box("qkv-s4", "Mathematics", "The formula", "Weighted sum with non-negative weights that sum to 1.", "\\underbrace{\\sum_j \\underbrace{\\alpha_{ij}}_{\\ge 0,\\ \\sum_j \\alpha_{ij}=1} v_j}_{\\text{convex combination of the values}}"),
      box("qkv-s5", "Limit", "What comes next?", "Attention alone stays inside the convex hull of the values. The FFN afterwards is nonlinear and can leave that hull; that is why the transformer block is more than a mixture.")
    ],
    sources: [
      { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Attention als gewichtete Summe der Values mit Softmax-Gewichten.", en: "Attention as a weighted sum of values with softmax weights." } },
      { label: "Weng (2018), Attention? Attention!", url: "https://lilianweng.github.io/posts/2018-06-24-attention/", why: { de: "Die Ausgabe ist eine gewichtete Summe der Values; die Gewichte kommen aus Query-Key-Scores.", en: "The output is a weighted sum of values; the weights come from query-key scores." } },
      { label: "Elhage et al. (2021), A Mathematical Framework for Transformer Circuits", url: "https://transformer-circuits.pub/2021/framework/index.html", why: { de: "Attention-Heads als Mischungen von Values; das Residual Stream trägt die Information weiter.", en: "Attention heads as mixtures of values; the residual stream carries information onward." } }
    ]
  };

  var qkvArcs2 = Object.assign({}, qkvArcs, {
    title: DE ? "Head 2: Wo ist es?" : "Head 2: where is it?",
    body: DE
      ? "Head 2 fragt nach dem Ort. Die Query von „es“ trifft jetzt die Keys von „Straße“ und „Tier“; die Gewichte kippen. Wieder gilt: Die Prozentwerte sind Softmax-Gewichte, keine Wahrscheinlichkeiten für Wahrheit."
      : "Head 2 asks for the location. The query from “it” now meets the keys of “street” and “animal”; the weights flip. Again, the percentages are softmax weights, not probabilities of truth.",
    watch: DE ? "Head 2: Der Ort gewinnt. Vergleiche die Bögen mit Head 1." : "Head 2: the location wins. Compare the arcs with head 1.",
    demoState: { scene: "qkv", head: 1, view: "arcs" },
    boxes: qkvArcs.boxes.map(function (b) { return Object.assign({}, b, { id: b.id + "-h2" }); })
  });

  var qkvSimplex2 = Object.assign({}, qkvSimplex, {
    title: DE ? "Head 2 als Value-Mischung" : "Head 2 as a value mixture",
    body: DE
      ? "Dieselben drei Value-Vektoren, andere Gewichte. Weil Head 2 nach dem Ort fragt, bekommt der Value von „Straße“ mehr Gewicht; der Ausgabepunkt wandert zur Straße. Die Prozentwerte entstehen wieder aus den Rohgewichten: erst durch ihre Summe teilen, dann mit 100 multiplizieren. Das Dreieck bleibt die Grenze."
      : "The same three value vectors, different weights. Because head 2 asks for the location, the value of “street” gets more weight; the output point moves toward the street. The percentages again come from the raw weights: divide by their sum, then multiply by 100. The triangle remains the boundary.",
    watch: DE ? "Head 2: Der Punkt wandert zur Straße. Warum bleibt er im Dreieck?" : "Head 2: the point moves toward the street. Why does it stay inside the triangle?",
    demoState: { scene: "qkv", head: 1, view: "simplex" },
    boxes: qkvSimplex.boxes.map(function (b) { return Object.assign({}, b, { id: b.id + "-h2" }); })
  });

  var qkvGraph = Object.assign({}, qkvArcs, {
    kicker: DE ? "Graph" : "Graph",
    title: DE ? "Attention ist ein vollverbundener Graph" : "Attention is a fully connected graph",
    body: DE
      ? "Jedes Token kann auf jedes andere schauen: Die Attention-Matrix hat keine fehlenden Einträge. Im Kreis siehst du alle Token; die Kanten von der Query „es“ zu jedem anderen Token sind die Softmax-Gewichte. Dick und hell heißt viel, dünn und blass heißt wenig. Fahre mit der Maus über eine Kante oder ein Token: Die Demo zeigt die Verbindung und den Prozentwert. Gezeigt ist eine Query-Zeile; für jede Query gibt es eine eigene Verteilung."
      : "Every token can attend to every other token: the attention matrix has no missing entries. You see all tokens in a circle; the edges from the query “it” to every other token are the softmax weights. Thick and bright means a lot, thin and pale means little. Hover over an edge or a token: the demo shows the connection and the percentage. This is one query row; every query has its own distribution.",
    watch: DE ? "Fahre über die Kanten. Welche Verbindung ist am stärksten? Vergleiche Head 1 und Head 2." : "Hover over the edges. Which connection is strongest? Compare head 1 and head 2.",
    demoState: { scene: "qkv", head: 0, view: "graph" },
    context: DE ? "Die Matrix ist voll besetzt: Jede Query bekommt zu jedem Key einen Score, auch wenn viele Scores klein sind. Softmax macht daraus Gewichte. Die blassen Linien zeigen die vollständige Topologie; die farbigen Kanten zeigen die Gewichte dieser Query." : "The matrix is fully populated: every query gets a score for every key, even if many scores are small. Softmax turns them into weights. The faint lines show the complete topology; the coloured edges show the weights for this query.",
    deep: DE ? "Ein Head ist ein Graph. Viele Heads sind viele Graphen mit eigenen Kantengewichten; die Ausgaben werden konkateniert und projiziert. Deshalb kann ein Head auf Syntax achten, ein anderer auf Position oder Bedeutung." : "One head is one graph. Many heads are many graphs with their own edge weights; the outputs are concatenated and projected. That is why one head can attend to syntax, another to position or meaning.",
    boxes: DE ? [
      box("qkv-g1", "Graph", "Vollverbunden", "Jedes Token ist mit jedem anderen verbunden. Die Attention-Matrix hat keine fehlenden Einträge; viele Gewichte sind nur sehr klein."),
      box("qkv-g2", "Graph", "Kantenstärke", "Die Linienbreite und Helligkeit sind das Softmax-Gewicht. Eine dicke Kante bedeutet: Diese Query liest viel von diesem Token."),
      box("qkv-g3", "Graph", "Pro Query", "Gezeigt ist eine Zeile der Matrix, nämlich die Query „es“. Jede andere Query hat ihre eigene Verteilung und damit ihre eigenen Kantengewichte.")
    ] : [
      box("qkv-g1", "Graph", "Fully connected", "Every token is connected to every other token. The attention matrix has no missing entries; many weights are just very small."),
      box("qkv-g2", "Graph", "Edge strength", "Line width and brightness are the softmax weight. A thick edge means this query reads a lot from that token."),
      box("qkv-g3", "Graph", "Per query", "This shows one row of the matrix, the query “it”. Every other query has its own distribution and therefore its own edge weights.")
    ],
    sources: qkvArcs.sources
  });

  var qkvStep = {
    title: DE ? "Wie Attention rechnet" : "How attention computes",
    kicker: DE ? "Q · K · V" : "Q · K · V",
    substeps: [qkvArcs, qkvArcs2, qkvSimplex, qkvSimplex2, qkvGraph]
  };

  var agentsStep = {
    kicker: DE ? "Agent" : "Agent",
    title: DE ? "Ein Agent ist dasselbe Modell mit Werkzeugen" : "An agent is the same model with tools",
    body: DE
      ? "Ein Agent ist kein neues Modell. Es sind dieselben Gewichte wie im Browser. Der Unterschied ist der Loop: Das Modell sagt „führe das als Programm aus“, die Runtime tut es, und der Output kommt in den Kontext. So arbeiten opencode, Claude Code und Cursor: Sie lesen Dateien, führen Befehle aus und sehen die Ergebnisse. Multimodale Modelle bekommen zusätzlich Screenshots und können darauf sehen, was auf dem Bildschirm ist."
      : "An agent is not a new model. It uses the same weights as the browser. The difference is the loop: the model says “run this as a program”, the runtime does it, and the output goes into the context. That is how opencode, Claude Code, and Cursor work: they read files, run commands, and see the results. Multimodal models also receive screenshots and can see what is on the screen.",
    watch: DE ? "Drücke Weiter. Verfolge, wie Tool-Call, Ausführung und Ergebnis in den Kontext wandern." : "Press Next. Follow how the tool call, the execution, and the result move into the context.",
    demoState: { scene: "agents" },
    context: DE ? "Der Kontext ist das Arbeitsgedächtnis. Jeder Tool-Output wächst hinein. Das Modell entscheidet auf dieser Grundlage den nächsten Schritt; die Runtime liegt außerhalb des Modells." : "The context is the working memory. Every tool output grows into it. The model decides the next step on that basis; the runtime sits outside the model.",
    deep: DE ? "ReAct und Toolformer beschreiben diesen Loop; OSWorld und WebArena testen Computer-Use. Das Modell bleibt ein Nächstes-Token-Vorhersager; die Werkzeuge machen daraus einen Akteur. Grenzen: falsche Tool-Calls, Berechtigungen, Prompt Injection und Kosten." : "ReAct and Toolformer describe this loop; OSWorld and WebArena test computer use. The model remains a next-token predictor; the tools turn it into an actor. Limits: wrong tool calls, permissions, prompt injection, and cost.",
    boxes: DE ? [
      box("ag-1", "Technik", "Was ist ein Tool?", "Ein Programm außerhalb des Modells: Terminal, Datei, Browser, API. Das Modell ruft es über eine strukturierte Nachricht auf."),
      box("ag-2", "Multimodal", "Screenshot und Bild", "Die Runtime macht einen Screenshot. Ein multimodales Modell kodiert das Bild und legt die Tokens in den Kontext; so kann es UI-Elemente lesen."),
      box("ag-3", "Gleiches Modell?", "Ja, dieselben Gewichte", "Der Agent ist ein Loop um dasselbe LLM. Nicht die Gewichte ändern sich, sondern der Kontext und die verfügbaren Werkzeuge."),
      box("ag-4", "Grenze", "Was kann schiefgehen?", "Falsche Tool-Calls, zu weitreichende Berechtigungen, Prompt Injection in Webseiten oder Dateien und hohe Kosten durch viele Schritte.")
    ] : [
      box("ag-1", "Technique", "What is a tool?", "A program outside the model: terminal, file, browser, API. The model calls it through a structured message."),
      box("ag-2", "Multimodal", "Screenshot and image", "The runtime takes a screenshot. A multimodal model encodes the image and puts the tokens into the context; that is how it reads UI elements."),
      box("ag-3", "Same model?", "Yes, same weights", "The agent is a loop around the same LLM. The weights do not change; the context and the available tools do."),
      box("ag-4", "Limit", "What can go wrong?", "Wrong tool calls, excessive permissions, prompt injection in websites or files, and high cost from many steps.")
    ],
    sources: [
      { label: "Yao et al. (2022), ReAct: Synergizing Reasoning and Acting in Language Models", url: "https://arxiv.org/abs/2210.03629", why: { de: "Reasoning und Tool-Aktionen im Wechsel.", en: "Interleaving reasoning and tool actions." } },
      { label: "Schick et al. (2023), Toolformer", url: "https://arxiv.org/abs/2302.04761", why: { de: "Sprachmodelle lernen, Werkzeuge aufzurufen.", en: "Language models learn to call tools." } },
      { label: "Xie et al. (2024), OSWorld", url: "https://arxiv.org/abs/2404.07972", why: { de: "Benchmark für Computer-Use-Agenten mit Screenshots.", en: "Benchmark for computer-use agents with screenshots." } }
    ]
  };

  var steps = [introSteps[0], bausteineStep, gaussDataStep, tokenizeExamplesStep, tokenizeBpeStep, embeddingMergeStep, manifoldSteps[0], positionSteps[0], attentionMergeStep, qkvStep, codeAttentionSubstep, neuralNeuronStep, neuralLossStep, neuralActivationStep, neuralLargeStep, neuralMlpStep, ffnSteps[0], residualSteps[0], unembedStep, softmaxSteps[0], crossEntropyStep, introSteps[1], meadowSteps[0], trajectorySteps[0], agentsStep, hallucinationStep, ragSteps[0], historySteps[0], philosophySteps[0], consciousnessStep, kvcacheSteps[0], tunnelStep];

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
    overlayRevision: "2026-11-15-attention-5",
    // Draft scaffold: steps without a teaser show the lorem placeholder; every
    // old body stays recoverable in the "Bisheriger Text" group. Set to false
    // to use bodies everywhere.
    textDraft: false,
    demoPreview: "intuition_learnsys-demo.php",
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
