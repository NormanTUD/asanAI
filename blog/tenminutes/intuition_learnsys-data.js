(function () {
  "use strict";
  var DE = window.TM && typeof TM.lang === "function" && TM.lang() === "de";
  function box(id, lens, title, body) {
    return { id: id, lens: lens, title: title, body: body };
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

  var steps = introSteps.concat(embedSteps);

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
