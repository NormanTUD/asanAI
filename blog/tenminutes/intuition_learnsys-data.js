(function () {
  "use strict";
  var DE = window.TM && typeof TM.lang === "function" && TM.lang() === "de";
  function box(id, lens, title, body, tex) {
    return { id: id, lens: lens, title: title, body: body, tex: tex || "" };
  }
  var sources = [
    { label: "Harris (1954), Distributional Structure", url: "https://www.its.caltech.edu/~matilde/ZelligHarrisDistributionalStructure1954.pdf" },
    { label: "Firth (1957), A Synopsis of Linguistic Theory", url: "https://archive.org/details/papersinlinguist0000firt" },
    { label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781" },
    { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/" }
  ];
  var introSteps = DE ? [
    {
      kicker: "01 / Die Idee",
      title: "Das Modell in deiner Tasche",
      body: "Stell deinem Handy eine Frage. Die Antwort erscheint Wort für Wort. Unter der Haube macht das Modell eine Sache: Es sagt das nächste Token voraus. Suchfeld, Sprachbefehl, Zusammenfassung und Treffer sind eine Schleife, immer wieder.",
      watch: "Klicke auf das Handy, um die Animation erneut zu starten. Woher kommt die Antwort?",
      demoState: { scene: "phone" },
      context: "Die Suchmaschine schlägt keine gespeicherte Antwort nach. Die Zusammenfassung wird Token für Token geschrieben, und dieselbe Schleife läuft im Rechenzentrum dahinter.",
      deep: "Der Satz ist eine Kette von Entscheidungen. Jedes neue Token verändert den Kontext für das nächste. Deshalb ist die Antwort nicht aus einem Archiv geholt, sondern in diesem Moment zusammengesetzt.",
      boxes: [
        box("in-1", "Die Schleife", "Was ist ein Token?", "Ein Token ist ein Stück Text: ein Wort, ein Wortteil, ein Satzzeichen oder ein Byte. Das Modell liest eine ID, keine Buchstaben. Aus IDs werden Vektoren, und am Ende steht wieder Text."),
        box("in-2", "Die Idee", "Warum eine Schleife?", "Weil ein Satz länger ist als ein Token. Das Modell sagt ein Token voraus, hängt es an die Eingabe, und beginnt von vorn. Auto steht für die eigene Ausgabe, regressiv für die Vorhersage aus der bisherigen Sequenz.")
      ]
    },
    {
      kicker: "01b / Code",
      title: "Es schreibt Text und Code",
      body: "Dieselbe Schleife schreibt Prosa und Code. Das Modell sagt das nächste Token voraus, und Python führt das fertige Programm aus. Der Code ist eine weitere Sequenz, die das Modell vorhersagen kann.",
      watch: "Klicke auf das Fenster, um die Animation erneut zu starten. Was hat das Modell geschrieben, was hat Python gerechnet?",
      demoState: { scene: "code" },
      context: "Das Modell schreibt das Programm; das Programm rechnet das Verhältnis. Die Schleife endet nicht am Text, sie kann auch eine ausführbare Anweisung erzeugen.",
      deep: "Der Code ist nicht magisch korrekt. Er ist eine wahrscheinliche Fortsetzung, die zu den Trainingsdaten passt. Deshalb muss man ihn lesen und testen; die Schleife liefert eine Hypothese, keinen Beweis.",
      boxes: [
        box("in-3", "Code", "Warum funktioniert Code?", "Code hat eine strenge Syntax und viele wiederkehrende Muster. Beides ist für ein nächstes-Token-Modell leichter zu lernen als freie Prosa. Ein Programm ist eine Sequenz mit einer klaren lokalen Struktur."),
        box("in-4", "Grenze", "Was garantiert der Code nicht?", "Dass er das Richtige tut. Das Modell optimiert auf Plausibilität, nicht auf Korrektheit. Die Ausführung zeigt, ob die Hypothese trägt.")
      ]
    },
    {
      kicker: "02 / Die Schleife",
      title: "Ein Wort nach dem anderen",
      body: "Kontext ist alles, was das Modell gerade sieht: der bisherige Text, die Anweisung, die Beispiele. Bei jedem Schritt ist vieles möglich, aber nicht alles passt. Die Demo zieht das nächste Token aus einer Verteilung, hängt es an und wiederholt. Greedy, Sampling und Top-p lesen dieselben Wahrscheinlichkeiten unterschiedlich.",
      watch: "Klicke einen Zweig an oder lass die Demo wählen. Welche Fortsetzungen bleiben plausibel?",
      demoState: { scene: "loop", mode: "sample", temp: 0.8 },
      context: "Das Modell hat kein anderes Arbeitsgedächtnis als den Kontext. Jedes neue Token verändert, was als Nächstes wahrscheinlich ist.",
      deep: "Eine hohe Wahrscheinlichkeit ist keine Garantie für Wahrheit. Sie ist eine Aussage über den Trainingskorpus. Sampling macht die Verteilung sichtbar; Greedy nimmt immer den wahrscheinlichsten Pfad.",
      boxes: [
        box("in-5", "Mathematik", "Was macht Temperatur?", "Temperatur teilt die Logits vor dem Softmax: p_i ∝ exp(z_i / T). T < 1 schärft, T > 1 flacht ab. Bei T → 0 wird daraus Greedy; exakt null wird als Top-Token behandelt."),
        box("in-6", "Technik", "Warum nicht immer Greedy?", "Greedy ist deterministisch und kann in Schleifen laufen. Sampling ist vielfältiger, aber auch inkohärenter. Top-p behält die kleinste Menge, deren kumulierte Wahrscheinlichkeit p erreicht.")
      ]
    },
    {
      kicker: "02b / Die Entscheidung",
      title: "Die Verteilung ist nicht die Antwort",
      body: "Das Modell liefert für jedes Token eine Wahrscheinlichkeit. Decoding entscheidet, wie daraus eine Sequenz wird. Greedy nimmt das Top-Token, Sampling zieht, Top-p schneidet den Tail. Ein anderer früher Token schickt den Text auf einen anderen Pfad.",
      watch: "Wechsle den Modus. Welchen würdest du für Code nehmen, welchen für Brainstorming?",
      demoState: { scene: "loop", mode: "greedy", temp: 0.8 },
      context: "Top-k ist eine feste Anzahl, Top-p eine feste Masse. Min-p skaliert mit dem Top-Token. Nach dem Schnitt werden die verbleibenden Wahrscheinlichkeiten renormalisiert.",
      deep: "Beam Search hält mehrere Pfade am Leben. Speculative Sampling beschleunigt die Prüfung, ohne die Zielverteilung zu ändern. Die Wahl ist eine Policy, keine Eigenschaft des Modells.",
      boxes: [
        box("in-7", "Anwendung", "Welche Einstellung wofür?", "Code und Fakten: niedrige Temperatur, enger Filter. Brainstorming: höhere Temperatur, weiterer Filter. Es gibt keine universelle Regel."),
        box("in-8", "Geschichte", "Warum wurde Sampling wichtig?", "Weil ein Modell ohne Sampling immer denselben Text liefert. Die Vielfalt kommt aus der Verteilung, nicht aus dem Modell allein.")
      ]
    },
    {
      kicker: "03 / Der Tunnel",
      title: "Der Wahrscheinlichkeitstunnel",
      body: "Eine einzelne Vorhersage ist ein Schnitt durch eine Landschaft möglicher Fortsetzungen. Das blaue Tal ist der wahrscheinlichste Weg, die goldenen Nebenbecken sind die Alternativen. Gehe den Satz Schritt für Schritt und beobachte, wie der Kontext die Landschaft verengt; erhöhe die Temperatur und sie wird wieder breiter.",
      watch: "Klicke einen Token auf dem Pfad oder nutze Weiter. Was passiert mit den Nebenbecken, wenn du T erhöhst?",
      demoState: { scene: "tunnel", step: 0 },
      context: "Das Modell entscheidet nie, dass etwas richtig ist. Es baut aus seinen Trainingsdaten eine Verteilung und zieht daraus. Die Landschaft zeigt, wie der Kontext diese Verteilung verengt.",
      deep: "Die Energie-Landschaft folgt dem Energy-Based-Learning-Rahmen von LeCun et al. (2006). Tiefe bedeutet hohe Wahrscheinlichkeit; der Ball rollt in das tiefste Tal, das der Kontext gerade offen lässt. Ein echtes Modell arbeitet in Tausenden Dimensionen mit weit mehr Pfaden, als hier gezeichnet werden können.",
      boxes: [
        box("in-9", "Mathematik", "Warum ist das ein Tal?", "Die Höhe ist eine Energie, die Tiefe eine Wahrscheinlichkeit. Der Kontext verschiebt die Täler. Temperatur flacht die Ränder ab, sodass mehr Nebenwege erreichbar werden."),
        box("in-10", "Grenze", "Was zeigt der Tunnel nicht?", "Er zeigt keine Wahrheit und keine vollständige Rechnung. Er ist eine Projektion der Verteilung auf zwei Achsen. Ein Kreuzungspunkt auf dem Bildschirm bedeutet nicht, dass zwei Pfade im vollen Raum zusammenfallen.")
      ],
      sources: [{ label: "LeCun et al. (2006), A Tutorial on Energy-Based Learning", url: "http://yann.lecun.com/exdb/publis/pdf/lecun-06.pdf" }]
    }
  ] : [
    {
      kicker: "01 / The idea",
      title: "The model in your pocket",
      body: "Ask your phone a question. The answer appears one word at a time. Under the hood the model does one thing: predict the next token. The search box, the voice query, the summary, and the links are one loop, repeated.",
      watch: "Click the phone to replay the animation. Where does the answer come from?",
      demoState: { scene: "phone" },
      context: "The search engine does not look up a stored answer. The summary is written token by token, and the same loop runs in the data centre behind it.",
      deep: "The sentence is a chain of decisions. Every new token changes the context for the next one. That is why the answer is not fetched from an archive but assembled in the moment.",
      boxes: [
        box("in-1", "The loop", "What is a token?", "A token is a piece of text: a word, a word piece, a punctuation mark, or a byte. The model reads an ID, not letters. IDs become vectors, and at the end there is text again."),
        box("in-2", "The idea", "Why a loop?", "Because a sentence is longer than one token. The model predicts one token, appends it to the input, and starts again. Auto stands for its own output, regressive for predicting from the sequence so far.")
      ]
    },
    {
      kicker: "01b / Code",
      title: "It writes text and code",
      body: "The same loop writes prose and code. The model predicts the next token, and Python runs the finished program. Code is another sequence the model can predict.",
      watch: "Click the window to replay the animation. What did the model write, what did Python compute?",
      demoState: { scene: "code" },
      context: "The model writes the program; the program computes the ratio. The loop does not stop at text; it can produce an executable instruction.",
      deep: "The code is not magically correct. It is a likely continuation that fits the training data. That is why you read and test it; the loop gives a hypothesis, not a proof.",
      boxes: [
        box("in-3", "Code", "Why does code work?", "Code has strict syntax and many recurring patterns. Both are easier for a next-token model to learn than free prose. A program is a sequence with a clear local structure."),
        box("in-4", "Limit", "What does the code not guarantee?", "That it does the right thing. The model optimises for plausibility, not correctness. Running it shows whether the hypothesis holds.")
      ]
    },
    {
      kicker: "02 / The loop",
      title: "One word after another",
      body: "Context is everything the model can see: the text so far, the instruction, the examples. At every step much is possible, but not all of it fits. The demo draws the next token from a distribution, appends it, and repeats. Greedy, sampling, and top-p read the same probabilities differently.",
      watch: "Click a branch or let the demo choose. Which continuations stay plausible?",
      demoState: { scene: "loop", mode: "sample", temp: 0.8 },
      context: "The model has no working memory other than the context. Every new token changes what is likely next.",
      deep: "A high probability is not a guarantee of truth. It is a statement about the training corpus. Sampling makes the distribution visible; greedy always takes the most likely path.",
      boxes: [
        box("in-5", "Mathematics", "What does temperature do?", "Temperature divides the logits before softmax: p_i ∝ exp(z_i / T). T < 1 sharpens, T > 1 flattens. At T → 0 it becomes greedy; exact zero is handled as the top token."),
        box("in-6", "Technique", "Why not always greedy?", "Greedy is deterministic and can loop. Sampling is more varied, but also less coherent. Top-p keeps the smallest set whose cumulative probability reaches p.")
      ]
    },
    {
      kicker: "02b / The choice",
      title: "The distribution is not the answer",
      body: "The model returns a probability for every token. Decoding decides how a sequence becomes from it. Greedy takes the top token, sampling draws, top-p cuts the tail. A different early token sends the text down a different path.",
      watch: "Switch modes. Which would you use for code, which for brainstorming?",
      demoState: { scene: "loop", mode: "greedy", temp: 0.8 },
      context: "Top-k is a fixed number, top-p a fixed mass. Min-p scales with the top token. After the cut, the remaining probabilities are renormalised.",
      deep: "Beam search keeps several paths alive. Speculative sampling speeds up verification without changing the target distribution. The choice is a policy, not a property of the model.",
      boxes: [
        box("in-7", "Application", "Which setting for what?", "Code and facts: low temperature, narrow filter. Brainstorming: higher temperature, wider filter. There is no universal rule."),
        box("in-8", "History", "Why did sampling become important?", "Because a model without sampling always produces the same text. Variety comes from the distribution, not from the model alone.")
      ]
    },
    {
      kicker: "03 / The tunnel",
      title: "The probability tunnel",
      body: "A single prediction is one slice through a landscape of plausible continuations. The blue valley is the likely path, the gold side basins are the alternatives. Step through the sentence and watch the context narrow the landscape; raise the temperature and it widens again.",
      watch: "Click a token on the path or use Next. What happens to the side basins when you raise T?",
      demoState: { scene: "tunnel", step: 0 },
      context: "The model never decides that something is right. It builds a distribution from its training data and draws from it. The landscape shows how context narrows that distribution.",
      deep: "The energy-landscape view follows the energy-based learning framework of LeCun et al. (2006). Deep means likely; the ball rolls into the deepest valley the context currently leaves open. A real model works in thousands of dimensions with far more paths than can be drawn here.",
      boxes: [
        box("in-9", "Mathematics", "Why is it a valley?", "Height is an energy, depth is a probability. Context shifts the valleys. Temperature flattens the rims, so more side paths become reachable."),
        box("in-10", "Limit", "What does the tunnel not show?", "It shows neither truth nor the full computation. It is a projection of the distribution onto two axes. A crossing on screen does not mean two paths coincide in the full space.")
      ],
      sources: [{ label: "LeCun et al. (2006), A Tutorial on Energy-Based Learning", url: "http://yann.lecun.com/exdb/publis/pdf/lecun-06.pdf" }]
    }
  ];

  var embedSteps = DE ? [
    {
      kicker: "01 / Die Linie",
      title: "Bedeutung wird eine Zahl",
      body: "Ein Token ist kein Wort, sondern ein Textstück mit einer ID. Die ID zeigt auf einen gelernten Vektor, und ähnliche Kontexte ziehen Vektoren nah zusammen. Diese Demo nutzt zwei Dimensionen, damit du die Geometrie siehst; ein echtes Modell nutzt Tausende. Klicke zwei Temperaturpunkte an und beobachte, wo ihr Mittelpunkt landet.",
      watch: "Klicke zwei Punkte auf der Linie. Wo liegt der Mittelpunkt?",
      demoState: { scene: "embedding", mode: "temperature", dim: 0, pair: ["cold", "warm"] },
      context: "Ein Vektor ist eine geordnete Liste von Zahlen. Als Punkt gelesen sagt er, wo etwas liegt; als Pfeil gelesen, wohin es zeigt.",
      deep: "Die Karte ist gelernt, nicht gegeben: Jede Position kommt aus dem Trainingstext. Eine Embedding-Tabelle ist eine gelernte Matrix; jede Zeile ist der Startvektor eines Tokens. Die Geometrie entsteht erst durch das Training.",
      boxes: [
        box("emb-1", "Mathematik", "Was ist ein Vektor?", "Ein Vektor ist ein Element eines Vektorraums. In der Praxis ist er eine geordnete Liste von Zahlen, die einen Punkt oder eine Richtung beschreibt. Die Richtung ist oft wichtiger als die Länge."),
        box("emb-2", "Geschichte", "Woher kommt die Idee?", "Firth (1957): „You shall know a word by the company it keeps.“ Harris (1954) hatte die distributionelle Idee vorher formuliert. Wörter, die in ähnlichen Kontexten auftreten, bekommen ähnliche Vektoren."),
        box("emb-3", "Technik", "Warum reicht eine Achse nicht?", "Eine Achse kann nur eine Eigenschaft ordnen. Bedeutung hat viele Eigenschaften gleichzeitig: Temperatur, Geschlecht, Macht, Thema. Jede zusätzliche Achse kann eine weitere Unterscheidung tragen.")
      ],
      sources: sources.slice(0, 3)
    },
    {
      kicker: "02 / Der Mittelpunkt",
      title: "Zwei Beispiele, ein Durchschnitt",
      body: "Der Mittelpunkt zweier Werte ist ihr Durchschnitt. Kalt (5) und warm (55) ergeben 30, also ungefähr lauwarm. Im Vektorraum funktioniert dieselbe Operation auf jeder Koordinate, nicht nur auf einer. Wähle ein anderes Paar und prüfe, wann das Ergebnis exakt ist und wann nur ungefähr.",
      watch: "Wähle ein anderes Paar. Wann ist das Ergebnis exakt, wann nur ungefähr?",
      demoState: { scene: "embedding", mode: "temperature", dim: 0, pair: ["freezing", "hot"] },
      context: "Der Mittelpunkt ist kein neues Wort. Er ist eine Position, die zwischen zwei gelernten Positionen liegt und deshalb einem nahen Wort zugeordnet werden kann.",
      deep: "Die Ähnlichkeit wird meist über den Winkel gemessen, nicht über den Abstand. Softmax ist etwas anderes: Es macht aus Scores eine Verteilung. Ein Mittelpunkt ist eine geometrische Operation, keine Wahrscheinlichkeit.",
      boxes: [
        box("emb-4", "Mathematik", "Warum funktioniert das?", "Weil Vektoren koordinatenweise addiert werden. Der Mittelpunkt (a + b) / 2 liegt auf der Verbindungslinie. In höheren Dimensionen gilt dieselbe Rechnung; du siehst nur eine Projektion davon."),
        box("emb-5", "Grenze", "Ist der Mittelpunkt ein Wort?", "Nein. Er ist eine Position im Raum. Dass sie nahe an einem Wort liegt, ist eine Eigenschaft der gelernten Geometrie, keine Definition. Bei seltenen Wörtern und mehrdeutigen Begriffen kann der nächste Nachbar überraschen.")
      ],
      sources: sources.slice(2, 4)
    },
    {
      kicker: "03 / Die Ebene",
      title: "Bedeutung bekommt eine zweite Achse",
      body: "Eine Achse kann Wörter nach einer einzigen Eigenschaft ordnen. Eine zweite Achse trennt, was die erste zusammenfallen lässt: Mann und Frau teilen die Machtposition, unterscheiden sich aber im Geschlecht. Derselbe Pfeil erscheint wieder zwischen König und Königin. Klicke die Wörter an und vergleiche ihre Positionen.",
      watch: "Klicke Wörter an. Welche Paare liegen auf derselben Höhe?",
      demoState: { scene: "embedding", mode: "space", dim: 1, selected: "king", arithmetic: null },
      context: "Die Achsen sind für Menschen beschriftet. In einem echten Modell haben die Achsen keine Namen; die Richtungen entstehen aus dem Training und sind nur relativ zueinander lesbar.",
      deep: "Die Nachbarschaft ist ein statistisches Signal, keine Definition. Sie kann Stereotype tragen. Ein Wort liegt nicht „wahr“ im Raum, sondern an der Stelle, die den Loss auf den Trainingsdaten senkt.",
      boxes: [
        box("emb-6", "Technik", "Warum zwei Achsen?", "Zwei Achsen machen zwei unabhängige Unterschiede sichtbar. Die erste Achse ordnet nach Macht, die zweite nach Geschlecht. Erst dadurch werden Mann und Frau unterscheidbar, obwohl sie auf der Machtachse denselben Wert haben."),
        box("emb-7", "Geschichte", "Woher kommt die Analogie?", "Mikolov et al. (2013) zeigten, dass Differenzen wie König − Mann + Frau nahe bei Königin landen. Das ist eine Approximation, keine exakte Regel. Sie funktioniert, weil ähnliche Wörter in ähnlichen grammatischen Slots auftreten.")
      ],
      sources: sources.slice(2, 4)
    },
    {
      kicker: "04 / Die Rechnung",
      title: "Eine Richtung trägt eine Beziehung",
      body: "Behandle jedes Wort als Pfeil vom Ursprung. Addiere und subtrahiere die Pfeile, und das Ergebnis landet nahe bei einem anderen Wort: König − Mann + Frau liegt nahe bei Königin. Die Beziehung ist eine Richtung, keine benannte Regel. Klicke die Beispiele durch und beobachte, welche Richtung wiederverwendet wird.",
      watch: "Klicke die Beispiele durch. Welches Ergebnis überrascht dich?",
      demoState: { scene: "embedding", mode: "space", dim: 1, selected: null, arithmetic: "king-man-woman" },
      context: "Die berühmte Analogie ist eine Illustration. In echten Embeddings ist sie noisy und nicht immer wahr. Eine ungefähre Richtung ist trotzdem nützlich.",
      deep: "Die Geometrie ist eine Projektion. Was du siehst, ist ein Schatten eines viel höherdimensionalen Raums. Die Rechnung findet im vollen Raum statt; die zwei Achsen sind nur eine lesbare Auswahl.",
      boxes: [
        box("emb-8", "Mathematik", "Warum funktioniert die Analogie?", "Weil ähnliche Wörter in ähnlichen grammatischen Slots auftreten. Der Unterschied zwischen Mann und Frau wird zu einer wiederverwendbaren Richtung. Dieselbe Richtung erscheint zwischen König und Königin."),
        box("emb-9", "Anwendung", "Wofür ist das gut?", "Suche, Empfehlungen, Clustering und RAG nutzen genau diese Geometrie: semantische Nähe wird zur Abfrage. Die Vektorarithmetik ist eher eine Diagnose als ein Produktmerkmal.")
      ],
      sources: sources.slice(2, 4)
    },
    {
      kicker: "05 / Der Raum",
      title: "Drei Dimensionen, ein Schatten",
      body: "Eine dritte Achse hebt die Ebene in einen Raum. Jetzt können dieselben Punkte neben Macht und Geschlecht auch Rang tragen. Jede Ansicht ist eine Projektion: Linien, die sich auf dem Bildschirm kreuzen, müssen sich im vollen Raum nicht berühren. Ziehe die Ansicht und beobachte, welche Richtung stabil bleibt.",
      watch: "Ziehe die Ansicht. Welche Richtung bleibt stabil?",
      demoState: { scene: "embedding", mode: "space", dim: 2, selected: "king", arithmetic: "directions" },
      context: "Ein echtes Modell arbeitet in Tausenden Dimensionen. Die drei Achsen sind eine Projektion, kein vollständiges Bild. Die Perspektive kann Relationen zeigen, die in der Projektion verdeckt sind.",
      deep: "Superposition und Polysemantik erklären, warum ein Neuron mehrere Bedeutungen tragen kann. Die Karte ist nützlich, aber sie ist statistisch. Sie zeigt, was im Training häufig war, nicht was wahr ist.",
      boxes: [
        box("emb-10", "Technik", "Warum sieht man das im LLM nicht?", "Weil die Räume zu hochdimensional sind. Die Demo ist eine Projektion auf drei Achsen. Eine Kreuzung auf dem Bildschirm bedeutet nicht, dass die Punkte im vollen Raum zusammenfallen."),
        box("emb-11", "Geschichte", "Woher kommt das Bild?", "Die Idee, Bedeutung als Geometrie zu lesen, verbindet distributionelle Semantik mit Conceptual Spaces. Die konkrete Demo ist eine Vereinfachung, keine Messung eines echten Modells.")
      ],
      sources: sources
    },
    {
      kicker: "06 / Die Übertragung",
      title: "Eine Beziehung lässt sich übertragen",
      body: "Der Pfeil von Mann zu Frau ist fast derselbe wie der Pfeil von König zu Königin. Ein Feed-Forward-Netz kann lernen, eine solche Richtung auf eine ganze Nachbarschaft anzuwenden; das ist die geometrische Intuition hinter Übersetzung. Klicke „Alle Richtungen“ und vergleiche die Pfeile.",
      watch: "Klicke „Alle Richtungen“. Welche Pfeile sind parallel?",
      demoState: { scene: "embedding", mode: "space", dim: 2, selected: null, arithmetic: "directions" },
      context: "Die Punkte formen eine Mannigfaltigkeit: lokal flach, global gekrümmt. Die Beziehungen sind ähnlich genug, um eine Richtung von einer Region in eine andere zu übertragen.",
      deep: "Das ist eine Approximation. In einem echten Modell ist die Geometrie viel unordentlicher: Beziehungen überlappen, Ausnahmen sind häufig, und Übersetzung wird aus großen Textmengen gelernt, nicht aus einer sauberen Karte. Die Intuition zeigt trotzdem die Richtung.",
      boxes: [
        box("emb-12", "Technik", "Wie lernt ein Netz die Übertragung?", "Ein Feed-Forward-Netz kann gelernte Richtungen auf neue Vektoren anwenden. Es lernt keine Wörterbuchregel, sondern eine Transformation, die auf viele Beispiele passt. Deshalb funktioniert sie auch für Wörter, die nicht in der Trainingsmenge standen."),
        box("emb-13", "Grenze", "Warum ist die Karte nicht das Territorium?", "Weil sie nur die Unterschiede zeigt, die für den Trainings-Loss relevant waren. Sie ist eine komprimierte Statistik, kein Lexikon. Bedeutung im Kontext entsteht erst durch Attention und die folgenden Schichten.")
      ],
      sources: sources
    }
  ] : [
    {
      kicker: "01 / The line",
      title: "Meaning becomes a number",
      body: "A token is not a word; it is a piece of text with an ID. The ID points to a learned vector, and similar contexts pull vectors close together. This demo uses two dimensions so you can see the geometry; a real model uses thousands. Click two temperature points and watch where their midpoint lands.",
      watch: "Click two points on the line. Where does the midpoint land?",
      demoState: { scene: "embedding", mode: "temperature", dim: 0, pair: ["cold", "warm"] },
      context: "A vector is an ordered list of numbers. Read as a point, it says where something is; read as an arrow, it says where it points.",
      deep: "The map is learned, not given: every position comes from the training text. An embedding table is a learned matrix; each row is the starting vector of a token. The geometry appears only through training.",
      boxes: [
        box("emb-1", "Mathematics", "What is a vector?", "A vector is an element of a vector space. In practice it is an ordered list of numbers that describes a point or a direction. Direction often matters more than length."),
        box("emb-2", "History", "Where does the idea come from?", "Firth (1957): “You shall know a word by the company it keeps.” Harris (1954) formulated the distributional idea earlier. Words that appear in similar contexts receive similar vectors."),
        box("emb-3", "Technique", "Why is one axis not enough?", "One axis can order only one property. Meaning has many properties at once: temperature, gender, power, topic. Every extra axis can carry another distinction.")
      ],
      sources: sources.slice(0, 3)
    },
    {
      kicker: "02 / The midpoint",
      title: "Two examples, one average",
      body: "The midpoint of two values is their average. Cold (5) and warm (55) average to 30, which lands near lukewarm. In a vector space the same operation works on every coordinate, not just one. Choose another pair and check when the result is exact and when it is only approximate.",
      watch: "Choose another pair. When is the result exact, when only approximate?",
      demoState: { scene: "embedding", mode: "temperature", dim: 0, pair: ["freezing", "hot"] },
      context: "The midpoint is not a new word. It is a position between two learned positions, and that is why it can be assigned to a nearby word.",
      deep: "Similarity is usually measured by angle, not distance. Softmax is something else: it turns scores into a distribution. A midpoint is a geometric operation, not a probability.",
      boxes: [
        box("emb-4", "Mathematics", "Why does this work?", "Because vectors are added coordinate by coordinate. The midpoint (a + b) / 2 lies on the line between them. The same arithmetic works in higher dimensions; you only see a projection."),
        box("emb-5", "Limit", "Is the midpoint a word?", "No. It is a position in the space. That it lands near a word is a property of the learned geometry, not a definition. For rare or ambiguous words the nearest neighbour can surprise you.")
      ],
      sources: sources.slice(2, 4)
    },
    {
      kicker: "03 / The plane",
      title: "Meaning gets a second axis",
      body: "One axis can order words by a single property. A second axis separates what the first axis collapses: man and woman share a power position, but differ in gender. The same arrow appears again between king and queen. Click the words and compare their positions.",
      watch: "Click words. Which pairs sit at the same height?",
      demoState: { scene: "embedding", mode: "space", dim: 1, selected: "king", arithmetic: null },
      context: "The axes are labelled for humans. In a real model the axes have no names; the directions emerge from training and are readable only relative to one another.",
      deep: "Neighbourhood is a statistical signal, not a definition. It can carry stereotypes. A word is not “truly” in the space; it sits where the loss on the training data is lowest.",
      boxes: [
        box("emb-6", "Technique", "Why two axes?", "Two axes make two independent differences visible. The first axis orders by power, the second by gender. Only then do man and woman become distinguishable even though they share a value on the power axis."),
        box("emb-7", "History", "Where does the analogy come from?", "Mikolov et al. (2013) showed that differences such as king − man + woman land near queen. It is an approximation, not an exact rule. It works because similar words appear in similar grammatical slots.")
      ],
      sources: sources.slice(2, 4)
    },
    {
      kicker: "04 / The arithmetic",
      title: "A direction carries a relation",
      body: "Treat every word as an arrow from the origin. Add and subtract the arrows, and the result lands near another word: king − man + woman is close to queen. The relation is a direction, not a named rule. Click through the examples and watch which direction is reused.",
      watch: "Click through the examples. Which result surprises you?",
      demoState: { scene: "embedding", mode: "space", dim: 1, selected: null, arithmetic: "king-man-woman" },
      context: "The famous analogy is an illustration. In real embeddings it is noisy and not always true. An approximate direction is still useful.",
      deep: "The geometry is a projection. What you see is a shadow of a much higher-dimensional space. The arithmetic happens in the full space; the two axes are only a readable selection.",
      boxes: [
        box("emb-8", "Mathematics", "Why does the analogy work?", "Because similar words appear in similar grammatical slots. The difference between man and woman becomes a reusable direction. The same direction appears between king and queen."),
        box("emb-9", "Application", "What is it good for?", "Search, recommendations, clustering, and RAG all use this geometry: semantic closeness becomes a query. Vector arithmetic is more of a diagnostic than a product feature.")
      ],
      sources: sources.slice(2, 4)
    },
    {
      kicker: "05 / The space",
      title: "Three dimensions, one shadow",
      body: "A third axis lifts the plane into a space. Now the same points can carry rank as well as power and gender. Every view is a projection: lines that cross on screen need not touch in the full space. Drag the view and watch which direction stays stable.",
      watch: "Drag the view. Which direction stays stable?",
      demoState: { scene: "embedding", mode: "space", dim: 2, selected: "king", arithmetic: "directions" },
      context: "A real model works in thousands of dimensions. The three axes are a projection, not a complete picture. Perspective can show relations that the projection hides.",
      deep: "Superposition and polysemy explain why a neuron can carry several meanings. The map is useful, but it is statistical. It shows what was frequent in training, not what is true.",
      boxes: [
        box("emb-10", "Technique", "Why don't we see this in an LLM?", "Because the spaces are too high-dimensional. The demo is a projection onto three axes. A crossing on screen does not mean the points coincide in the full space."),
        box("emb-11", "History", "Where does the picture come from?", "The idea of reading meaning as geometry connects distributional semantics with conceptual spaces. The concrete demo is a simplification, not a measurement of a real model.")
      ],
      sources: sources
    },
    {
      kicker: "06 / Transport",
      title: "A relation can be transported",
      body: "The arrow from man to woman is almost the same as the arrow from king to queen. A feed-forward network can learn to apply such a direction to a whole neighbourhood; that is the geometric intuition behind translation. Click “All directions” and compare the arrows.",
      watch: "Click “All directions”. Which arrows are parallel?",
      demoState: { scene: "embedding", mode: "space", dim: 2, selected: null, arithmetic: "directions" },
      context: "The points form a manifold: locally flat, globally curved. The relations are similar enough to transport a direction from one region to another.",
      deep: "This is an approximation. In a real model the geometry is much messier: relations overlap, exceptions are common, and translation is learned from huge amounts of text rather than read off a clean map. The intuition still points in the right direction.",
      boxes: [
        box("emb-12", "Technique", "How does a network learn the transport?", "A feed-forward network can apply learned directions to new vectors. It does not learn a dictionary rule but a transformation that fits many examples. That is why it can work for words that were not in the training set."),
        box("emb-13", "Limit", "Why is the map not the territory?", "Because it shows only the differences that mattered for the training loss. It is a compressed statistic, not a lexicon. Meaning in context appears only through attention and the following layers.")
      ],
      sources: sources
    }
  ];

  var tokenizeSteps = DE ? [
    {
      kicker: "03 / Tokenize",
      title: "Text wird zu IDs",
      body: "Ein Token ist kein Wort. Text wird zu Zahlen: Jedes Zeichen hat einen Codepunkt, und ein byte-level Tokenizer startet bei 256 Bytes, damit jeder String darstellbar ist. Seltene Wörter zerfallen in Subwords: „unbelievable“ wird zu „un“, „believ“, „able“. Ein Leerzeichen kann selbst ein Token sein.",
      watch: "Klicke die Beispiele. Welches Wort zerfällt in Subwords?",
      demoState: { scene: "tokenize" },
      context: "Die IDs sind Adressen in der Embedding-Tabelle. Das Modell sieht keine Buchstaben, sondern Zeilenindizes.",
      deep: "Ein echter Tokenizer lernt seine Merge-Tabelle aus Text. Häufige Paare werden zu einem Token verschmolzen, seltene Wörter bleiben in Teilen. Deshalb ist Rechtschreibung für das Modell eine Rekonstruktion.",
      boxes: [
        box("tok-1", "Technik", "Warum Subwords?", "Ein festes Wort-Vokabular müsste jedes unbekannte Wort als Sonderzeichen behandeln. Subwords erlauben es, neue Wörter aus bekannten Teilen zusammenzusetzen. Gleichzeitig bleibt das Vokabular endlich."),
        box("tok-2", "Mathematik", "Was ist eine ID?", "Eine ID ist ein Integer, der auf eine Zeile in der Embedding-Matrix zeigt. Die ID selbst hat keine Bedeutung; erst der gelernte Vektor gibt dem Token eine Position im Raum.")
      ]
    }
  ] : [
    {
      kicker: "03 / Tokenize",
      title: "Text becomes IDs",
      body: "A token is not a word. Text is encoded as numbers: every character has a code point, and a byte-level tokenizer starts from 256 bytes so every string is representable. Rare words split into subwords: “unbelievable” becomes “un”, “believ”, “able”. A space can be a token too.",
      watch: "Click the samples. Which word splits into subwords?",
      demoState: { scene: "tokenize" },
      context: "The IDs are addresses into the embedding table. The model sees row indices, not letters.",
      deep: "A real tokenizer learns its merge table from text. Frequent pairs become one token, rare words stay in pieces. That is why spelling is a reconstruction for the model.",
      boxes: [
        box("tok-1", "Technique", "Why subwords?", "A fixed word vocabulary would have to treat every unseen word as a special symbol. Subwords let the model build new words from known pieces while keeping the vocabulary finite."),
        box("tok-2", "Mathematics", "What is an ID?", "An ID is an integer that points to a row in the embedding matrix. The ID itself has no meaning; the learned vector gives the token a position in the space.")
      ]
    }
  ];

  var positionSteps = DE ? [
    {
      kicker: "05 / Position",
      title: "Jeder Platz bekommt einen Fingerabdruck",
      body: "Attention hat kein Gefühl für Reihenfolge. Ohne Positionssignal sind „der Mann beißt den Hund“ und „der Hund beißt den Mann“ derselbe Beutel von Vektoren. Eine sinusförmige Kodierung gibt jedem Platz einen Fingerabdruck: Jedes Dimensionenpaar schwingt mit einer anderen Frequenz.",
      watch: "Bewege den Positionsregler und wechsle die Metrik. Was bleibt stabil?",
      demoState: { scene: "position" },
      context: "Die Position wird zum Token-Vektor addiert. Das Modell vergleicht danach Richtungen; die Winkelansicht macht diesen Unterschied sichtbar.",
      deep: "Die Frequenz staffelt sich über die Dimensionen. Frühe Dimensionen drehen schnell, späte langsam. So kann das Modell relative Abstände über viele Positionen lesen, ohne jede Position einzeln zu lernen.",
      boxes: [
        box("pos-1", "Mathematik", "Die Formel", "PE(pos, 2i) = sin(pos / 10000^(2i/d)), PE(pos, 2i+1) = cos(pos / 10000^(2i/d)). Jede Dimension bekommt ihre eigene Welle.", "\\underbrace{\\begin{aligned} PE_{(\\text{pos},2i)} &= \\sin\\left(\\frac{\\text{pos}}{10000^{2i/d}}\\right) \\\\ PE_{(\\text{pos},2i+1)} &= \\cos\\left(\\frac{\\text{pos}}{10000^{2i/d}}\\right) \\end{aligned}}_{\\text{jede Dimension bekommt ihre eigene Welle}}"),
        box("pos-2", "Technik", "Warum Sinus und Cosinus?", "Das Paar erlaubt es, eine Position als Drehung zu lesen. Relative Abstände werden zu festen Drehungen, und das Modell kann sie über viele Positionen wiederverwenden."),
        box("pos-3", "Grenze", "Was zeigt die 3D-Kurve nicht?", "Sie zeigt nur die ersten drei Dimensionen. Ein echtes Modell nutzt Tausende; die Kurve ist eine lesbare Scheibe, keine vollständige Karte.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }]
    }
  ] : [
    {
      kicker: "05 / Position",
      title: "Every slot gets a fingerprint",
      body: "Attention has no sense of order. Without a position signal, “man bites dog” and “dog bites man” are the same bag of vectors. A sinusoidal encoding adds a fingerprint to every slot: each pair of dimensions oscillates at a different frequency.",
      watch: "Move the position slider and switch the metric. What stays stable?",
      demoState: { scene: "position" },
      context: "The position is added to the token vector. The model then compares directions; the angle view makes that difference visible.",
      deep: "The frequency is spread across dimensions. Early dimensions turn quickly, late ones slowly. That lets the model read relative distances over many positions without learning every position separately.",
      boxes: [
        box("pos-1", "Mathematics", "The formula", "PE(pos, 2i) = sin(pos / 10000^(2i/d)), PE(pos, 2i+1) = cos(pos / 10000^(2i/d)). Each dimension gets its own wave.", "\\underbrace{\\begin{aligned} PE_{(\\text{pos},2i)} &= \\sin\\left(\\frac{\\text{pos}}{10000^{2i/d}}\\right) \\\\ PE_{(\\text{pos},2i+1)} &= \\cos\\left(\\frac{\\text{pos}}{10000^{2i/d}}\\right) \\end{aligned}}_{\\text{each dimension gets its own wave}}"),
        box("pos-2", "Technique", "Why sine and cosine?", "The pair lets you read a position as a rotation. Relative distances become fixed rotations, and the model can reuse them across many positions."),
        box("pos-3", "Limit", "What does the 3D curve not show?", "It shows only the first three dimensions. A real model uses thousands; the curve is a readable slice, not a complete map.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }]
    }
  ];

  var attentionSteps = DE ? [
    {
      kicker: "06 / Attend",
      title: "Kontext zieht die Bank an seinen Platz",
      body: "Woher weiß ein Wort, welche Nachbarn wichtig sind? Self-Attention lässt jedes Token die anderen lesen, entscheiden, welche zählen, und ihre Information in den eigenen Vektor ziehen. So bewegt sich „Bank“ in Richtung Fluss oder Geld. Ein echter Layer hat viele Heads; die Demo zeigt einen.",
      watch: "Wechsle den Kontext. Wohin bewegt sich der Bank-Vektor?",
      demoState: { scene: "attention", context: "none" },
      context: "Ohne eindeutigen Kontext bleibt die Bank in der Mitte, mehrdeutig. Mit Fluss oder Geld verschiebt sich der Vektor.",
      deep: "Ein echter Head berechnet Query-, Key- und Value-Vektoren, macht aus den Skalarprodukten mit Softmax Gewichte und summiert die Values. Die Demo zeigt die Bewegung, nicht die volle Rechnung.",
      boxes: [
        box("att-1", "Technik", "Warum drei Vektoren?", "Weil Suchen und Beschreiben zwei verschiedene Rollen sind. Ein Pronomen kann nach einem Nomen suchen, ohne selbst wie ein Nomen auszusehen."),
        box("att-2", "Mathematik", "Warum Softmax?", "Softmax macht aus Scores eine Verteilung: positiv, summiert zu 1, Reihenfolge bleibt. Deshalb ist Attention ein endliches Budget."),
        box("att-3", "Budget", "Ein Head, ein Budget", "Jede Zeile hat genau 1,00 zu vergeben. Mehr für ein Token heißt weniger für alle anderen. Viele Heads haben getrennte Budgets.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }, { label: "Bahdanau et al. (2014), Neural Machine Translation", url: "https://arxiv.org/abs/1409.0473" }]
    },
    {
      kicker: "06b / Der Kontext",
      title: "Der Vektor folgt dem Kontext",
      body: "Derselbe Satz, ein anderer Kontext: Die Bank liest jetzt den Fluss oder das Geld. Die Gewichte verschieben sich, und der Vektor wandert in die entsprechende Richtung. Attention zeigt, wohin Information geroutet wurde, nicht was das FFN damit tut.",
      watch: "Vergleiche Fluss und Geld. Welcher Unterschied wird sichtbar, welcher nicht?",
      demoState: { scene: "attention", context: "river" },
      context: "Attention-Gewichte sind kein Geständnis. Sie sind ein Routing-Signal auf einer Schicht.",
      deep: "Der Residual Stream und das FFN entscheiden, was mit der gerouteten Information passiert. Die Karte ist keine Erklärung des ganzen Modells.",
      boxes: [
        box("att-4", "Grenze", "Was zeigt Attention nicht?", "Sie zeigt nicht, was das FFN mit der Information macht. Sie zeigt nur, welche Tokens auf dieser Schicht Information austauschen.")
      ]
    }
  ] : [
    {
      kicker: "06 / Attend",
      title: "Context pulls the bank into place",
      body: "How does a word know which neighbours matter? Self-attention lets each token look at the others, decide which matter, and pull their information into its vector. That is how “bank” moves toward the river or money reading. A real layer has many heads; the demo shows one.",
      watch: "Switch the context. Where does the bank vector move?",
      demoState: { scene: "attention", context: "none" },
      context: "With no unambiguous context, the bank stays in the middle, ambiguous. With river or money, the vector shifts.",
      deep: "A real head computes query, key, and value vectors, turns their dot products into weights with softmax, and sums the values. The demo shows the movement, not the full arithmetic.",
      boxes: [
        box("att-1", "Technique", "Why three vectors?", "Because searching and describing are two different roles. A pronoun can look for a noun without itself looking like a noun."),
        box("att-2", "Mathematics", "Why softmax?", "Softmax turns scores into a distribution: positive, sum to one, order preserved. That is why attention is a finite budget."),
        box("att-3", "Budget", "One head, one budget", "Every row has exactly 1.00 to give. More for one token means less for the others. Many heads have separate budgets.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }, { label: "Bahdanau et al. (2014), Neural Machine Translation", url: "https://arxiv.org/abs/1409.0473" }]
    },
    {
      kicker: "06b / The context",
      title: "The vector follows the context",
      body: "The same sentence, a different context: the bank now reads the river or the money. The weights shift, and the vector moves in that direction. Attention shows where information was routed, not what the FFN does with it.",
      watch: "Compare river and money. Which difference becomes visible, which does not?",
      demoState: { scene: "attention", context: "river" },
      context: "Attention weights are not a confession. They are a routing signal on one layer.",
      deep: "The residual stream and the FFN decide what happens to the routed information. The map is not an explanation of the whole model.",
      boxes: [
        box("att-4", "Limit", "What does attention not show?", "It does not show what the FFN does with the information. It shows only which tokens exchange information on this layer.")
      ]
    }
  ];

  var ffnSteps = DE ? [
    {
      kicker: "08 / Feed-forward",
      title: "Ein Muster passt, ein Wert wird geschrieben",
      body: "Das Feed-Forward-Netz arbeitet auf jedem Token einzeln. Es dehnt den Vektor, wendet eine Aktivierung an und projiziert zurück. Attention mischt Tokens; das FFN rechnet innerhalb eines Tokens.",
      watch: "Wechsle zwischen Apfel als Obst und Apple als Firma. Welche Muster feuern?",
      demoState: { scene: "ffn", mode: "fruit" },
      context: "Ein echtes FFN hat keine beschrifteten Keys. Die Muster sind gelernte Richtungen in W₁; der Pull ist eine gelernte Richtung in W₂.",
      deep: "Die meisten Parameter eines Transformers liegen in den FFN-Matrizen. Wissen ist trotzdem verteilt, nicht in einer Zeile gespeichert.",
      boxes: [
        box("ffn-1", "Mathematik", "Die Dense-Einheit", "dense(x) = activation(Wx + b). Das FFN ist dense₂(activation(dense₁(x))). Die Aktivierung bringt die Nichtlinearität."),
        box("ffn-2", "Technik", "Warum das FFN?", "Attention bewegt Information zwischen Tokens. Das FFN transformiert, was jedes Token trägt. Beide zusammen bilden einen Block.")
      ]
    }
  ] : [
    {
      kicker: "08 / Feed-forward",
      title: "A pattern matches, a value is written",
      body: "The feed-forward network works on each token separately. It expands the vector, applies an activation, and projects back. Attention mixes tokens; the FFN computes within a token.",
      watch: "Switch between apple the fruit and Apple the company. Which patterns fire?",
      demoState: { scene: "ffn", mode: "fruit" },
      context: "A real FFN has no labelled keys. The patterns are learned directions in W₁; the pull is a learned direction in W₂.",
      deep: "Most parameters of a transformer live in the FFN matrices. Knowledge is still distributed, not stored in one row.",
      boxes: [
        box("ffn-1", "Mathematics", "The dense unit", "dense(x) = activation(Wx + b). The FFN is dense₂(activation(dense₁(x))). The activation supplies the nonlinearity."),
        box("ffn-2", "Technique", "Why the FFN?", "Attention moves information between tokens. The FFN transforms what each token carries. Together they form one block.")
      ]
    }
  ];

  var residualSteps = DE ? [
    {
      kicker: "09 / Residual",
      title: "Jede Schicht schreibt in denselben Stream",
      body: "Jede Schicht liest denselben laufenden Vektor, berechnet ein Update und addiert es zurück. Nichts wird überschrieben. Frühere Notizen bleiben lesbar; spätere Schichten lesen sie und schreiben mehr.",
      watch: "Klicke die Schichten durch. Wann ändert sich der Stream am stärksten?",
      demoState: { scene: "residual", layer: 0 },
      context: "Die Addition gibt dem Gradienten einen kurzen Pfad zurück. Ohne Residualverbindung müsste jede Schicht die gesamte Information neu schreiben.",
      deep: "Der Stream ist das gemeinsame Notizbuch. Attention und FFN schreiben Updates hinein; die Identität bleibt erhalten. Deshalb lassen sich tiefe Stapel trainieren.",
      boxes: [
        box("res-1", "Mathematik", "Warum Addition?", "x ← x + f(x). Die Identität bleibt erhalten; die Schicht lernt nur die Änderung. Das macht tiefe Stapel trainierbar."),
        box("res-2", "Grenze", "Was ist das nicht?", "Kein Speicher im Sinne einer Datenbank. Der Stream ist ein Vektor pro Token, der durch die Schichten getragen wird.")
      ]
    }
  ] : [
    {
      kicker: "09 / Residual",
      title: "Every layer writes into the same stream",
      body: "Every layer reads the same running vector, computes an update, and adds it back. Nothing is overwritten. Earlier notes stay readable; later layers read them and add more.",
      watch: "Click through the layers. When does the stream change most?",
      demoState: { scene: "residual", layer: 0 },
      context: "The addition gives gradients a short path back. Without a residual connection, every layer would have to rewrite all information.",
      deep: "The stream is the shared notebook. Attention and the FFN write updates into it; the identity survives. That is why deep stacks can be trained.",
      boxes: [
        box("res-1", "Mathematics", "Why addition?", "x ← x + f(x). The identity stays; the layer learns only the change. That makes deep stacks trainable."),
        box("res-2", "Limit", "What is it not?", "Not a database. The stream is one vector per token carried through the layers.")
      ]
    }
  ];

  var meadowSteps = DE ? [
    {
      kicker: "11 / Die Wiese",
      title: "Die Karte der Wörter",
      body: "Jedes Wort besitzt eine Zelle. Bewege den Zeiger; der Gedanke fällt in die nächste Zelle. Die goldenen Nähte sind die Stellen, an denen zwei Wörter fast gleich nah sind. Je mehr Wörter, desto kleiner die Zellen, aber die Naht verschwindet nie.",
      watch: "Bewege den Zeiger. Wann sind zwei Wörter fast gleich wahrscheinlich?",
      demoState: { scene: "meadow" },
      context: "Nähe zum Zentrum ist Wahrscheinlichkeit. Am Rand und an der Naht ist die Entscheidung unsicher; mehr Wörter machen die Zellen feiner, nicht die Unsicherheit null.",
      deep: "In einem echten Modell hat der Raum Tausende Dimensionen und das Vokabular Zehntausende Tokens. Die Wiese ist eine Projektion auf zwei Achsen; die Nähte sind die Grenzen zwischen benachbarten Token-Regionen.",
      boxes: [
        box("md-1", "Mathematik", "Was ist eine Voronoi-Zelle?", "Die Menge aller Punkte, die einem Wort näher sind als jedem anderen. Die Grenze zwischen zwei Zellen ist die Menge der Punkte mit gleichem Abstand."),
        box("md-2", "Technik", "Was machen Temperatur und Top-k?", "Temperatur macht die Auswahl breiter oder schärfer. Top-k begrenzt die Auswahl auf die k nächsten Wörter. Beides verändert die Verteilung, nicht die Karte.")
      ]
    }
  ] : [
    {
      kicker: "11 / The meadow",
      title: "The map of words",
      body: "Every word owns a cell. Move the pointer; the thought falls into the nearest cell. The golden seams are where two words are almost equally near. More words make smaller cells, but the seam never disappears.",
      watch: "Move the pointer. When are two words almost equally likely?",
      demoState: { scene: "meadow" },
      context: "Closeness to the centre is probability. At the edge and on a seam the decision is uncertain; more words make the cells finer, not the uncertainty zero.",
      deep: "In a real model the space has thousands of dimensions and the vocabulary tens of thousands of tokens. The meadow is a projection onto two axes; the seams are the borders between neighbouring token regions.",
      boxes: [
        box("md-1", "Mathematics", "What is a Voronoi cell?", "The set of all points closer to one word than to every other. The border between two cells is the set of points at equal distance."),
        box("md-2", "Technique", "What do temperature and top-k do?", "Temperature makes the choice wider or sharper. Top-k limits it to the k nearest words. Both change the distribution, not the map.")
      ]
    }
  ];

  var softmaxSteps = DE ? [
    {
      kicker: "12 / Softmax",
      title: "Von Logits zu einer Verteilung",
      body: "Echte GPT-2-small-Scores für zwei Prompts. Links steht der rohe Logit aus dem Skalarprodukt, rechts das, was Softmax daraus macht. Wechsle den Kontext und beobachte, wie sich die ganze Verteilung verschiebt. Die Temperatur entscheidet, wie scharf der Gewinner bevorzugt wird.",
      watch: "Fahre über ein Token und ändere die Temperatur. Was ändert sich, was bleibt?",
      demoState: { scene: "softmax" },
      context: "Softmax erzeugt nicht die Reihenfolge; die Skalarprodukte tun das. Es macht aus Scores eine Verteilung, die zu eins summiert.",
      deep: "Warum exp und nicht Logit durch Summe? Logits können negativ sein. Die Exponentialfunktion macht jeden Wert positiv und erhält die Reihenfolge; die Division durch die Summe ergibt Wahrscheinlichkeiten. Der absolute Offset ist willkürlich; Softmax hängt nur von Unterschieden ab.",
      boxes: [
        box("sm-1", "Mathematik", "Die Formel", "p_i = exp(z_i) / Σ_j exp(z_j). Vorher wird oft das Maximum abgezogen, damit die Exponentialfunktion stabil bleibt."),
        box("sm-2", "Temperatur", "Was macht T?", "p_i ∝ exp(z_i / T). T < 1 schärft, T > 1 flacht ab. Die Rangfolge bleibt, die Masse verschiebt sich.")
      ],
      sources: [{ label: "Transformer Explainer (Polo Club, Georgia Tech)", url: "https://poloclub.github.io/transformer-explainer/" }]
    }
  ] : [
    {
      kicker: "12 / Softmax",
      title: "From logits to a distribution",
      body: "Real GPT-2 small scores for two prompts. The left side is the raw logit from the dot product, the right side is what softmax makes of it. Switch the context and watch the whole distribution shift. Temperature decides how sharply the winner is favoured.",
      watch: "Hover a token and change the temperature. What changes, what stays?",
      demoState: { scene: "softmax" },
      context: "Softmax does not create the ranking; the dot products do. It turns scores into a distribution that sums to one.",
      deep: "Why exp and not logit divided by the sum? Logits can be negative. The exponential makes every value positive and preserves the order; dividing by the sum gives probabilities. The absolute offset is arbitrary; softmax depends only on differences.",
      boxes: [
        box("sm-1", "Mathematics", "The formula", "p_i = exp(z_i) / Σ_j exp(z_j). The maximum is often subtracted first so the exponential stays stable."),
        box("sm-2", "Temperature", "What does T do?", "p_i ∝ exp(z_i / T). T < 1 sharpens, T > 1 flattens. The ranking stays, the mass shifts.")
      ],
      sources: [{ label: "Transformer Explainer (Polo Club, Georgia Tech)", url: "https://poloclub.github.io/transformer-explainer/" }]
    }
  ];

  var insideSteps = DE ? [
    {
      kicker: "04 / Das Modell",
      title: "Ein Modell ist ein Stapel von Funktionen",
      body: "Ein neuronales Netz entsteht, indem man Funktionen nacheinander anwendet. Eine Schicht transformiert ihre Eingabe, die nächste transformiert das Ergebnis, und der Stapel macht aus einer kleinen Operation ein tiefes Modell. Tiefe ist Komposition: viele einfache Schritte, jeder füttert den nächsten.",
      watch: "Klicke eine Stufe an. Was geht hinein, was kommt heraus?",
      demoState: { scene: "stack", mode: "pipeline" },
      context: "Die Reihenfolge ist die echte Architektur: tokenisieren, einbetten, Position addieren, attenden, Feed-Forward, Residual. Die Demos sind vereinfacht.",
      deep: "Klassisches Programmieren beginnt mit dem Verfahren: Du schreibst jeden Schritt vor, und der Computer führt ihn aus. Bei KI drehst du das um: Du gibst Beispiele mit passenden Ausgaben, und das Training sucht die Funktion dazwischen. Die Schichten sind die Form, in der diese Funktion Platz findet.",
      boxes: [
        box("in-11", "Mathematik", "Der Stapel", "output = layer₃(layer₂(layer₁(input))). Jede Schicht ist eine Funktion mit Parametern; die Komposition ist das Modell."),
        box("in-12", "Technik", "Sechs Schritte", "Jedes Token läuft durch dieselben sechs Schritte: Tokenize, Embed, Position, Attention, FFN, Residual. Das Modell bewegt Punkte in einem hochdimensionalen Raum; das Training formt die Winkel zu plausiblen Fortsetzungen."),
        box("in-13", "Grenze", "Was heißt plausibel?", "Plausibel heißt: Die Fortsetzung kam im Trainingstext vor. Es heißt nicht, dass das Modell eine eigene Vorstellung von Wahrheit hat.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }]
    }
  ] : [
    {
      kicker: "04 / The model",
      title: "A model is a stack of functions",
      body: "A neural network is built by applying functions one after another. One layer transforms its input, the next layer transforms that result, and the stack turns a small operation into a deep model. The depth is composition: many simple steps, each feeding the next.",
      watch: "Click a stage. What goes in, what comes out?",
      demoState: { scene: "stack", mode: "pipeline" },
      context: "The order is the real architecture: tokenize, embed, add position, attend, feed-forward, residual. The demos are simplified.",
      deep: "Classical programming starts with the procedure: you write down every step, and the computer executes it. AI reverses that: you provide examples with matching outputs, and training searches for the function in between. The layers are the shape that function takes.",
      boxes: [
        box("in-11", "Mathematics", "The stack", "output = layer₃(layer₂(layer₁(input))). Each layer is a function with parameters; the composition is the model."),
        box("in-12", "Technique", "Six steps", "Every token runs through the same six steps: tokenize, embed, position, attention, FFN, residual. The model moves points in a high-dimensional space; training shapes the angles toward plausible continuations."),
        box("in-13", "Limit", "What does plausible mean?", "Plausible means the continuation occurred in the training text. It does not mean the model has its own notion of truth.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }]
    }
  ];

  var manifoldSteps = DE ? [
    {
      kicker: "07 / Die Übertragung",
      title: "Von Beziehungen zur Übersetzung",
      body: "Die Punkte bilden eine Mannigfaltigkeit: lokal flach, global gekrümmt. Die Beziehungen sind ähnlich genug, um übersetzt zu werden: Der Weg von einem Wort zum anderen lässt sich in den entsprechenden Weg einer anderen Sprache transformieren. Feed-Forward-Netze lernen solche Transformationen.",
      watch: "Drehe die beiden Flächen. Welche Korrespondenzlinien bleiben parallel?",
      demoState: { scene: "manifold" },
      context: "Die Karte ist eine Approximation. In einem echten Modell überlappen Beziehungen, Ausnahmen sind häufig, und Übersetzung wird aus großen Textmengen gelernt.",
      deep: "Die Geometrie ist viel unordentlicher als die saubere Fläche. Die Intuition zeigt trotzdem die Richtung: Eine gelernte Transformation kann eine Beziehung von einer Region in eine andere tragen.",
      boxes: [
        box("man-1", "Technik", "Was zeigt die Demo?", "Zwei gekrümmte Flächen für zwei Sprachen, Korrespondenzlinien zwischen Wörtern und Übersetzungspfade. Die Kontrollen drehen, trennen und richten die Flächen aus."),
        box("man-2", "Grenze", "Was ist vereinfacht?", "Die Flächen sind glatt und die Wörter sauber platziert. Ein echtes Embedding hat Tausende Dimensionen und viele überlappende Beziehungen.")
      ],
      sources: [{ label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781" }, { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/" }]
    }
  ] : [
    {
      kicker: "07 / Transport",
      title: "From relations to translation",
      body: "The points form a manifold: locally flat, globally curved. The relations are similar enough to translate: the path from one word to another can be transformed into the corresponding path in another language. Feed-forward networks learn such transformations.",
      watch: "Rotate the two surfaces. Which correspondence lines stay parallel?",
      demoState: { scene: "manifold" },
      context: "The map is an approximation. In a real model relations overlap, exceptions are common, and translation is learned from huge amounts of text.",
      deep: "The geometry is much messier than the clean surface. The intuition still points in the right direction: a learned transformation can carry a relation from one region to another.",
      boxes: [
        box("man-1", "Technique", "What does the demo show?", "Two curved surfaces for two languages, correspondence lines between words, and translation paths. The controls rotate, separate, and align the surfaces."),
        box("man-2", "Limit", "What is simplified?", "The surfaces are smooth and the words are neatly placed. A real embedding has thousands of dimensions and many overlapping relations.")
      ],
      sources: [{ label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781" }, { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/" }]
    }
  ];

  var mlpSteps = DE ? [
    {
      kicker: "08a / Das MLP",
      title: "Sieh zu, wie das MLP den Raum biegt",
      body: "Eine gerade Linie ist der einfachste Trenner, aber im ursprünglichen Raum nicht immer möglich. Das MLP hebt die Punkte in eine neue Ebene, in der die Trennung gelingt. In einem LLM läuft dieselbe Idee in Tausenden Dimensionen und hilft dem Modell, interne Zustände zu isolieren.",
      watch: "Klicke dich durch die neun Folien. Wo biegt sich der Raum, wo erscheint der Schnitt?",
      demoState: { scene: "mlp" },
      context: "Die Biegung ist eine Dense-Schicht: Sie hebt die Punkte in eine zusätzliche Dimension, bis ein flacher Schnitt reicht.",
      deep: "Das ist keine Animation über den Daten, sondern eine Animation der Daten selbst: Jeder Punkt behält seine Nachbarschaft, während der Raum sich krümmt. Die Form hängt von Gewichten, Bias und Aktivierung ab.",
      boxes: [
        box("mlp-1", "Mathematik", "Die Dense-Schicht", "x = (x₁, x₂), h = act(W₁x + b₁), z = W₂h + b₂. Die Schicht dehnt auf n verborgene Werte, biegt jeden mit einer Aktivierung und projiziert auf eine Höhe."),
        box("mlp-2", "Grenze", "Warum sieht man das im LLM nicht?", "Weil die Räume zu hochdimensional sind. Die Demo ist eine Projektion auf drei Achsen. Ein echtes Modell arbeitet mit Tausenden Dimensionen.")
      ],
      sources: [{ label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355" }]
    }
  ] : [
    {
      kicker: "08a / The MLP",
      title: "Watch the MLP bend the space",
      body: "A straight line is the easiest separator, but it is not always possible in the original space. The MLP lifts the points into a new plane where it becomes possible. In an LLM the same idea runs in thousands of dimensions and helps the model isolate internal states.",
      watch: "Click through the nine slides. Where does the space bend, where does the cut appear?",
      demoState: { scene: "mlp" },
      context: "The bend is a dense layer: it lifts the points into an extra dimension until a flat cut is enough.",
      deep: "This is not an animation over the data; it is an animation of the data itself. Every point keeps its neighbourhood while the space bends. The shape depends on weights, bias, and activation.",
      boxes: [
        box("mlp-1", "Mathematics", "The dense layer", "x = (x₁, x₂), h = act(W₁x + b₁), z = W₂h + b₂. The layer expands to n hidden values, bends each with an activation, and projects to one height."),
        box("mlp-2", "Limit", "Why don't we see this in an LLM?", "Because the spaces are too high-dimensional. The demo is a projection onto three axes. A real model works with thousands of dimensions.")
      ],
      sources: [{ label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355" }]
    }
  ];

  var stackSteps = DE ? [
    {
      kicker: "10 / Der Stapel",
      title: "Eine Schicht, dann der Stapel",
      body: "Eine Schicht ist nicht nur Attention und nicht nur ein FFN. Sie ist die Komposition: Attention mischt die Tokens zu A, dann schreibt das FFN jede Zeile von A um. Das Ergebnis ist die nächste Matrix X mit derselben Form.",
      watch: "Klicke eine Stufe an. Wo bleibt die Form gleich?",
      demoState: { scene: "stack", mode: "pipeline" },
      context: "W, b, W₁ und W₂ sind Parameter; das Training passt sie an. Self-Attention nimmt die ganze Matrix X und liefert A mit einer Zeile pro Token. Das FFN transformiert jede Zeile A_i einzeln.",
      deep: "Softmax macht aus den finalen Scores eine Verteilung über das Vokabular. Die Exponentialfunktion macht jeden Wert positiv und erhält die Reihenfolge; die Division durch die Summe ergibt Wahrscheinlichkeiten. Der absolute Offset ist willkürlich.",
      boxes: [
        box("st-1", "Mathematik", "Self-Attention", "A_i = Σ_j α_ij v_j, mit α_ij ∈ [0,1] und Σ_j α_ij = 1. Die Gewichte sind ein endliches Budget."),
        box("st-2", "Mathematik", "Das FFN", "FFN(x) = dense₂(activation(dense₁(x))). Es arbeitet auf einer Zeile auf einmal, nie auf der ganzen Matrix."),
        box("st-3", "Mathematik", "Softmax", "p_i = exp(z_i) / Σ_j exp(z_j). Eine positive Verteilung über das Vokabular; die Reihenfolge bleibt."),
        box("st-4", "Technik", "Die Schicht", "layer(X) = Spalte der FFN(A_i). In einem echten Block umschließen Residualverbindungen und Normalisierung beide Schritte.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }, { label: "Bridle (1990), Probabilistic Interpretation of Feedforward Classification", url: "https://proceedings.neurips.cc/paper/1989/hash/0336dcbab05b9d5ad24f4333c7658a0e-Abstract.html" }]
    },
    {
      kicker: "10b / Die Matrix",
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
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }, { label: "Borges (1942), Funes el memorioso", url: "https://bvpadreseijas.files.wordpress.com/2013/05/funeselmemorioso.pdf" }]
    }
  ] : [
    {
      kicker: "10 / The stack",
      title: "One layer, then the stack",
      body: "A layer is not just attention and not just an FFN. It is the composition: attention mixes the tokens into A, then the FFN rewrites each row of A. The result is the next matrix X with the same shape.",
      watch: "Click a stage. Where does the shape stay the same?",
      demoState: { scene: "stack", mode: "pipeline" },
      context: "W, b, W₁, and W₂ are parameters; training adjusts them. Self-attention takes the whole matrix X and returns A with one row per token. The FFN transforms each row A_i separately.",
      deep: "Softmax turns the final scores into a distribution over the vocabulary. The exponential makes every value positive and preserves the order; dividing by the sum gives probabilities. The absolute offset is arbitrary.",
      boxes: [
        box("st-1", "Mathematics", "Self-attention", "A_i = Σ_j α_ij v_j, with α_ij ∈ [0,1] and Σ_j α_ij = 1. The weights are a finite budget."),
        box("st-2", "Mathematics", "The FFN", "FFN(x) = dense₂(activation(dense₁(x))). It works on one row at a time, never on the whole matrix."),
        box("st-3", "Mathematics", "Softmax", "p_i = exp(z_i) / Σ_j exp(z_j). A positive distribution over the vocabulary; the order stays."),
        box("st-4", "Technique", "The layer", "layer(X) = column of FFN(A_i). In a real block, residual connections and normalization wrap both steps.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }, { label: "Bridle (1990), Probabilistic Interpretation of Feedforward Classification", url: "https://proceedings.neurips.cc/paper/1989/hash/0336dcbab05b9d5ad24f4333c7658a0e-Abstract.html" }]
    },
    {
      kicker: "10b / The matrix",
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
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }, { label: "Borges (1942), Funes el memorioso", url: "https://bvpadreseijas.files.wordpress.com/2013/05/funeselmemorioso.pdf" }]
    }
  ];

  var trajectorySteps = DE ? [
    {
      kicker: "11a / GPT-2",
      title: "Token-Trajektorien durch GPT-2",
      body: "Echte Hidden States aus GPT-2 small für „The capital of France is“. Jede Linie folgt einem Token durch das Embedding und 12 Blöcke. Jeder Zustand hat 768 Dimensionen, zu viele für ein Bild, deshalb ist das nicht die echte Bewegung: PCA behält die drei Richtungen, in denen sich die Zustände am stärksten ändern, und flacht alles darauf ab. Die 3D-Punkte sind ein Schatten.",
      watch: "Bewege den Layer-Regler. Ab wann wird „Paris“ die Top-Wahl?",
      demoState: { scene: "trajectories" },
      context: "Die Winkelansicht ist der Standard, weil das Modell Richtungen vergleicht. „Plausibel“ heißt: Die Fortsetzung ist im Trainingstext häufig, nicht dass sie wahr ist.",
      deep: "Linien, die sich auf dem Bildschirm kreuzen, müssen sich im vollen Raum nicht berühren. Eine flach aussehende Biegung kann eine große Bewegung verbergen. Die Kandidaten erscheinen erst in der letzten Schicht.",
      boxes: [
        box("traj-1", "Technik", "Was ist PCA?", "PCA projiziert die 768-dimensionalen Zustände auf die drei Richtungen mit der größten Varianz. Das ist eine lesbare Projektion, keine vollständige Rekonstruktion."),
        box("traj-2", "Grenze", "Was zeigt die Linie nicht?", "Sie zeigt nicht den echten Weg im 768-dimensionalen Raum. Sie zeigt einen Schatten, der die größten Änderungen sichtbar macht.")
      ],
      sources: [{ label: "Radford et al. (2019), GPT-2", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf" }]
    }
  ] : [
    {
      kicker: "11a / GPT-2",
      title: "Token trajectories through GPT-2",
      body: "Real hidden states from GPT-2 small for “The capital of France is”. Each line follows one token through the embedding and 12 blocks. Each state has 768 dimensions, too many to picture, so this is not the real motion: PCA keeps the three directions where the states change most and flattens everything onto them. The 3D points are a shadow.",
      watch: "Move the layer slider. When does “Paris” become the top choice?",
      demoState: { scene: "trajectories" },
      context: "The angular view is the default because the model compares directions. “Plausible” means the continuation is frequent in the training text, not that it is true.",
      deep: "Lines that cross on screen need not touch in the full space. A flat-looking bend can hide a large move. The candidates appear only at the final layer.",
      boxes: [
        box("traj-1", "Technique", "What is PCA?", "PCA projects the 768-dimensional states onto the three directions with the most variance. It is a readable projection, not a complete reconstruction."),
        box("traj-2", "Limit", "What does the line not show?", "It does not show the real path in the 768-dimensional space. It shows a shadow that makes the largest changes visible.")
      ],
      sources: [{ label: "Radford et al. (2019), GPT-2", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf" }]
    }
  ];

  var wholeSteps = DE ? [
    {
      kicker: "13 / Die ganze Schleife",
      title: "Text rein, Geometrie, ein Wort raus",
      body: "Die Teile fügen sich in fester Reihenfolge zusammen: Text → Tokens → Vektoren → Position → Attention + Residual → FFN → Verteilung → Ziehen → Anhängen. Die Schleife endet, wenn das Modell das spezielle Token <|endoftext|> ausgibt. Kein Schritt hat eine ordentliche Fakten-Datenbank; Wissen ist über die Gewichte verteilt, und Bedeutung lebt in der Geometrie.",
      watch: "Klicke die Schleife an. Wo schließt sie sich?",
      demoState: { scene: "stack", mode: "loop" },
      context: "Das Modell ist ein Next-Token-Predictor: eine Verteilung, ein Zug, ein Anhängen, wiederholt. Mehr Kontext und mehr Schichten verengen die Verteilung.",
      deep: "Es sagt plausiblen Text voraus. Es kann fließend und falsch sein, und es gibt keine Garantie für Wahrheit. Die feste Reihenfolge ist die Architektur; die Demos sind vereinfacht.",
      boxes: [
        box("whole-1", "Keypoint", "Was es ist", "Ein Next-Token-Predictor: eine Verteilung, ein Zug, ein Anhängen, wiederholt."),
        box("whole-2", "Keypoint", "Warum es funktioniert", "Mehr Kontext und mehr Schichten verengen die Verteilung, sodass das nächste Token leichter zu wählen ist."),
        box("whole-3", "Keypoint", "Seine Grenzen", "Es sagt plausiblen Text voraus. Es kann fließend und falsch sein, und es bietet keine Garantie für Wahrheit.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }]
    }
  ] : [
    {
      kicker: "13 / The whole loop",
      title: "Text in, geometry, one word out",
      body: "The pieces fit in a fixed order: text → tokens → vectors → position → attention + residual → FFN → distribution → draw → append. The loop ends when the model emits the special token <|endoftext|>. No step has a tidy fact database; knowledge is distributed across the weights, and meaning lives in the geometry.",
      watch: "Click the loop. Where does it close?",
      demoState: { scene: "stack", mode: "loop" },
      context: "The model is a next-token predictor: one distribution, one draw, one append, repeated. More context and more layers narrow the distribution.",
      deep: "It predicts plausible text. It can be fluent and wrong, and it offers no guarantee of truth. The fixed order is the architecture; the demos are simplified.",
      boxes: [
        box("whole-1", "Keypoint", "What it is", "A next-token predictor: one distribution, one draw, one append, repeated."),
        box("whole-2", "Keypoint", "Why it works", "More context and more layers narrow the distribution, so the next token becomes easier to choose."),
        box("whole-3", "Keypoint", "Its limits", "It predicts plausible text. It can be fluent and wrong, and it offers no guarantee of truth.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }]
    }
  ];

  var steps = introSteps.concat(insideSteps, tokenizeSteps, embedSteps, manifoldSteps, positionSteps, attentionSteps, mlpSteps, ffnSteps, stackSteps, residualSteps, trajectorySteps, meadowSteps, softmaxSteps, wholeSteps);

  var day = {
    id: "intuition",
    track: "transformer",
    label: DE ? "Intuition" : "Intuition",
    kicker: DE ? "Im Transformer · Bedeutung wird Geometrie" : "Inside the transformer · Meaning becomes geometry",
    title: DE ? "Ein Wort nach dem anderen" : "One word after another",
    demo: "intuition",
    credit: DE ? "Interaktive Demo · Ten Minutes" : "Interactive demo · Ten Minutes",
    steps: steps,
    boxes: [
      box("emb-day", DE ? "Mathematik" : "Mathematics",
        DE ? "Die ganze Rechnung" : "The whole calculation",
        DE ? "Ein Embedding ist eine Matrix E mit einer Zeile pro Token. Der Startvektor ist E[id]. Die Ähnlichkeit ist cos(E[a], E[b]). Die Demo zeigt nur zwei oder drei Achsen; ein echtes Modell nutzt Tausende." : "An embedding is a matrix E with one row per token. The starting vector is E[id]. Similarity is cos(E[a], E[b]). The demo shows only two or three axes; a real model uses thousands.")
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
    lang.addEventListener("click", function () {
      if (window.TM && typeof TM.setLang === "function") TM.setLang(DE ? "en" : "de");
    });
    nav.appendChild(lang);
  }
})();
