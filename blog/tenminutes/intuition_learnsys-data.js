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
      title: "Was ist ein LLM?",
      body: "Dieser Adventskalender öffnet jeden Tag ein Türchen und hilft dir zu verstehen, wie diese Systeme technisch funktionieren. Ein Large Language Model (LLM) macht dabei immer dieselbe Sache: Es sagt das nächste Token voraus. Früher musstest du bei einer Suche die Websites einzeln öffnen, heute bekommst du eine Zusammenfassung. In einer ChatGPT-Sitzung stellst du eine komplexe Frage und bekommst schnell eine oft nützliche Antwort. Wie geht das? Suchfeld, Sprachbefehl, Zusammenfassung und Chat sind eine Schleife, immer wieder.",
      watch: "Klicke auf ein Handy, um die Animation neu zu starten. Woher kommt die Antwort?",
      demoState: { scene: "phone" },
      context: "Die Suchmaschine schlägt keine gespeicherte Antwort nach. Die Zusammenfassung und die Chat-Antwort werden Token für Token geschrieben, und dieselbe Schleife läuft im Rechenzentrum dahinter.",
      deep: "Der Satz ist eine Kette von Entscheidungen. Jedes neue Token verändert den Kontext für das nächste. Deshalb ist die Antwort nicht aus einem Archiv geholt, sondern in diesem Moment zusammengesetzt.",
      boxes: [
        box("in-1", "Die Schleife", "Was ist ein Token?", "Ein Token ist ein Stück Text: ein Wort, ein Wortteil, ein Satzzeichen oder ein Byte. Das Modell liest eine ID, keine Buchstaben. Aus IDs werden Vektoren, und am Ende steht wieder Text."),
        box("in-2", "Die Idee", "Warum eine Schleife?", "Weil ein Satz länger ist als ein Token. Das Modell sagt ein Token voraus, hängt es an die Eingabe, und beginnt von vorn. Auto steht für die eigene Ausgabe, regressiv für die Vorhersage aus der bisherigen Sequenz.")
      ]
    },
    {
      kicker: "01b / Code",
      title: "LLM können nicht nur Texte, sie sind gute Programmierer",
      body: "Dieselbe Schleife schreibt Prosa und Code. Auf dem Monitor links oben steht das Programm himmel.py, rechts unten läuft das Terminal. Das Modell sagt das nächste Token voraus, und Python führt den fertigen Code aus. Code ist eine weitere Sequenz, die das Modell vorhersagen kann.",
      watch: "Klicke auf den Monitor, um die Animation erneut zu starten. Was hat das Modell geschrieben, was hat Python gerechnet?",
      demoState: { scene: "code" },
      context: "Das Modell schreibt das Programm; das Programm rechnet das Verhältnis. Die Schleife endet nicht am Text, sie kann auch eine ausführbare Anweisung erzeugen.",
      deep: "Der Code ist nicht magisch korrekt. Er ist eine wahrscheinliche Fortsetzung, die zu den Trainingsdaten passt. Deshalb muss man ihn lesen und testen; die Schleife liefert eine Hypothese, keinen Beweis.",
      boxes: [
        box("in-3", "Code", "Warum funktioniert Code?", "Code hat eine strenge Syntax und viele wiederkehrende Muster. Beides ist für ein nächstes-Token-Modell leichter zu lernen als freie Prosa. Ein Programm ist eine Sequenz mit einer klaren lokalen Struktur."),
        box("in-4", "Grenze", "Was garantiert der Code nicht?", "Dass er das Richtige tut. Das Modell optimiert auf Plausibilität, nicht auf Korrektheit. Die Ausführung zeigt, ob er passend ist.")
      ]
    },
    {
      kicker: "02 / Die Schleife",
      title: "Ein Wort nach dem anderen",
      body: "Kontext ist alles, was das Modell gerade sieht: der bisherige Text, die Anweisung, die Beispiele. Bei jedem Schritt ist vieles möglich, aber nicht alles passt. Die Demo zieht das nächste Token aus einer Verteilung, hängt es an und wiederholt. Greedy, Sampling und Top-p lesen dieselben Wahrscheinlichkeiten unterschiedlich. Nach dem Schlusspunkt steht das spezielle Token <|endoftext|>; sobald das Modell es zieht, endet die Schleife.",
      watch: "Klicke einen Zweig an oder lass die Demo wählen. Welche Fortsetzungen bleiben plausibel?",
      demoState: { scene: "loop", mode: "sample", temp: 0.8, landscape: true, view: "default" },
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
      body: "Du siehst eine Wahrscheinlichkeitslandschaft: Täler sind wahrscheinlich, Berge unwahrscheinlich. Jedes Token ist ein Punkt in einem riesigen, hochdimensionalen Raum. Bei jedem Schritt berechnet das Modell nur die Wahrscheinlichkeit des nächsten Tokens, dann die des darauffolgenden; es sieht immer nur die unmittelbare Umgebung und tastet sich Schritt für Schritt weiter. Die Kugel ist das Token: Mit jeder Wahl bekommt sie Schwung und kann aus ihrem Tal in ein benachbartes entkommen; der goldene Pfad zeigt die gewählten Tokens.",
      watch: "Dreh die Szene mit Maus oder Finger. Gib der Kugel mit einer Wahl Schwung und sieh, in welches Tal sie rollt.",
      demoState: { scene: "loop", mode: "greedy", temp: 0.8, landscape: true, view: "top" },
      context: "Jeder Schritt senkt die Täler seiner Optionen; ein gewähltes Token behält sein Tal. Die Balken zeigen dieselbe Verteilung, aus der die Kugel kommt.",
      deep: "Top-k ist eine feste Anzahl, Top-p eine feste Masse. Min-p skaliert mit dem Top-Token. Nach dem Schnitt werden die verbleibenden Wahrscheinlichkeiten renormalisiert. Beam Search hält mehrere Pfade am Leben; Speculative Sampling beschleunigt die Prüfung, ohne die Zielverteilung zu ändern.",
      boxes: [
        box("in-7", "Anwendung", "Welche Einstellung wofür?", "Code und Fakten: niedrige Temperatur, enger Filter. Brainstorming: höhere Temperatur, weiterer Filter. Es gibt keine universelle Regel."),
        box("in-8", "Geschichte", "Warum wurde Sampling wichtig?", "Weil ein Modell ohne Sampling immer denselben Text liefert. Die Vielfalt kommt aus der Verteilung, nicht aus dem Modell allein."),
        box("loop-1", "Grenze", "Gibt es diese Täler wirklich?", "Diese Landschaft ist stark vereinfacht. In einem echten Modell hat der Raum Tausende Dimensionen; dort ist fast jeder flache Punkt ein Sattelpunkt, kein abgeschlossenes Tal. Von dort geht es in viele Richtungen gleichzeitig bergauf und bergab. Die zwei Achsen, die Kugel und die farbigen Täler sind ein Bild für die Idee, keine Messung des echten Token-Raums.")
      ]
    }
  ] : [
    {
      kicker: "01 / The idea",
      title: "What is an LLM?",
      body: "This Advent calendar opens one door every day and helps you understand how these systems work technically. A Large Language Model (LLM) always does the same thing: it predicts the next token. In the past you had to open search results one by one; today you often get a summary. In a ChatGPT session you ask a complex question and quickly get a useful answer. How does that work? Search box, voice command, summary, and chat are one loop, repeated.",
      watch: "Click a phone to replay the animation. Where does the answer come from?",
      demoState: { scene: "phone" },
      context: "The search engine does not look up a stored answer. The summary and the chat answer are written token by token, and the same loop runs in the data centre behind it.",
      deep: "The sentence is a chain of decisions. Every new token changes the context for the next one. That is why the answer is not fetched from an archive but assembled in the moment.",
      boxes: [
        box("in-1", "The loop", "What is a token?", "A token is a piece of text: a word, a word piece, a punctuation mark, or a byte. The model reads an ID, not letters. IDs become vectors, and at the end there is text again."),
        box("in-2", "The idea", "Why a loop?", "Because a sentence is longer than one token. The model predicts one token, appends it to the input, and starts again. Auto stands for its own output, regressive for predicting from the sequence so far.")
      ]
    },
    {
      kicker: "01b / Code",
      title: "LLMs can do more than text; they are good programmers",
      body: "The same loop writes prose and code. On the monitor, the program sky.py is top left and the terminal runs bottom right. The model predicts the next token, and Python executes the finished code. Code is just another sequence the model can predict.",
      watch: "Click the monitor to replay the animation. What did the model write, what did Python compute?",
      demoState: { scene: "code" },
      context: "The model writes the program; the program computes the ratio. The loop does not stop at text; it can produce an executable instruction.",
      deep: "The code is not magically correct. It is a likely continuation that fits the training data. That is why you read and test it; the loop gives a hypothesis, not a proof.",
      boxes: [
        box("in-3", "Code", "Why does code work?", "Code has strict syntax and many recurring patterns. Both are easier for a next-token model to learn than free prose. A program is a sequence with a clear local structure."),
        box("in-4", "Limit", "What does the code not guarantee?", "That it does the right thing. The model optimises for plausibility, not correctness. Running it shows whether it fits.")
      ]
    },
    {
      kicker: "02 / The loop",
      title: "One word after another",
      body: "Context is everything the model can see: the text so far, the instruction, the examples. At every step much is possible, but not all of it fits. The demo draws the next token from a distribution, appends it, and repeats. Greedy, sampling, and top-p read the same probabilities differently. After the final punctuation comes the special token <|endoftext|>; as soon as the model draws it, the loop stops.",
      watch: "Click a branch or let the demo choose. Which continuations stay plausible?",
      demoState: { scene: "loop", mode: "sample", temp: 0.8, landscape: true },
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
      body: "You see a probability landscape: valleys are likely, mountains unlikely. Every token is a point in a huge, high-dimensional space. At each step the model computes only the probability of the next token, then of the one after that; it sees only the immediate neighbourhood and feels its way forward step by step. The ball is the token: each choice gives it momentum so it can escape its valley into a neighbouring one; the gold path shows the tokens you chose.",
      watch: "Rotate the scene with mouse or finger. Give the ball momentum with a choice and watch which valley it rolls into.",
      demoState: { scene: "loop", mode: "greedy", temp: 0.8, landscape: true },
      context: "Each step lowers the valleys of its options; a chosen token keeps its valley. The bars show the same distribution the ball comes from.",
      deep: "Top-k is a fixed number, top-p a fixed mass. Min-p scales with the top token. After the cut, the remaining probabilities are renormalised. Beam search keeps several paths alive; speculative sampling speeds up verification without changing the target distribution.",
      boxes: [
        box("in-7", "Application", "Which setting for what?", "Code and facts: low temperature, narrow filter. Brainstorming: higher temperature, wider filter. There is no universal rule."),
        box("in-8", "History", "Why did sampling become important?", "Because a model without sampling always produces the same text. Variety comes from the distribution, not from the model alone."),
        box("loop-1", "Limit", "Do these valleys really exist?", "This landscape is strongly simplified. A real model works in thousands of dimensions; there almost every flat point is a saddle point, not a closed valley. From such a point the surface goes up and down in many directions at once. The two axes, the ball, and the coloured valleys are a picture of the idea, not a measurement of the real token space.")
      ]
    }
  ];

  var embedSteps = DE ? [
    {
      kicker: "01 / Die Linie",
      title: "Bedeutung wird eine Zahl",
      body: "Wir ordnen Wörtern Zahlen zu. Auf einer Zahlengeraden liegt jedes Wort an einer Stelle: Gefrierpunkt ganz links, heiß ganz rechts. Der Abstand sagt, wie ähnlich zwei Wörter in dieser einen Eigenschaft sind. Klicke zwei Punkte an und beobachte, wo ihr Mittelpunkt landet.",
      watch: "Klicke zwei Punkte auf der Linie. Wo landet ihr Mittelpunkt?",
      demoState: { scene: "embedding", mode: "temperature", dim: 0, pair: ["cold", "warm"] },
      context: "Die Zahlengerade ist die einfachste Form eines Vektorraums: eine Koordinate pro Wort. Später kommen weitere Koordinaten hinzu.",
      deep: "Die Positionen sind hier von Hand gewählt, damit du die Rechnung siehst. In einem Modell werden sie aus vielen Beispielen gelernt. Die Rechnung bleibt dieselbe.",
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
      body: "Der Mittelpunkt zweier Zahlen ist ihr Durchschnitt. Kalt (5) und warm (55) ergeben 30, und 30 ist genau lauwarm. Kalt und heiß ergeben 52,5; das liegt nahe bei warm (55), aber kein Wort sitzt exakt auf 52,5. Für die Bedeutung reicht oft die Nähe: Du landest im richtigen Bereich, auch wenn der exakte Wert fehlt.",
      watch: "Wähle ein Paar. Wann ist das Ergebnis exakt, wann nur ungefähr?",
      demoState: { scene: "embedding", mode: "temperature", dim: 0, pair: ["cold", "hot"] },
      context: "Die Abweichung ist der Abstand zwischen Mittelwert und nächstem Wort. Bei kalt + heiß sind das 2,5 Grad; bei Gefrierpunkt + heiß sind es 5 Grad.",
      deep: "Die Rechnung funktioniert in jeder Dimension gleich: (a+b)/2. In höheren Dimensionen mittelst du jede Koordinate einzeln. Die Nähe wird meist über den Winkel gemessen, nicht über den Abstand.",
      boxes: [
        box("emb-4", "Mathematik", "Warum funktioniert das?", "Weil Vektoren koordinatenweise addiert werden. Der Mittelpunkt (a + b) / 2 liegt auf der Verbindungslinie. In höheren Dimensionen gilt dieselbe Rechnung; du siehst nur eine Projektion davon."),
        box("emb-5", "Grenze", "Ist der Mittelpunkt ein Wort?", "Nein. Er ist eine Position im Raum. Dass sie nahe an einem Wort liegt, ist eine Eigenschaft der gelernten Geometrie, keine Definition. Bei seltenen Wörtern und mehrdeutigen Begriffen kann der nächste Nachbar überraschen."),
        box("emb-approx", "Grenze", "Was heißt „ungefähr“?", "Der Mittelwert 52,5 liegt 2,5 Grad von warm entfernt. Es gibt kein Wort exakt bei 52,5. Die Nähe reicht, weil das Modell später mit Winkeln und Nachbarn arbeitet, nicht mit einer Wortliste.")
      ],
      sources: sources.slice(2, 4)
    },
    {
      kicker: "03 / Die Ebene",
      title: "Bedeutung bekommt eine zweite Achse",
      body: "Eine Achse kann Wörter nach einer einzigen Eigenschaft ordnen. Mann und Frau teilen die Machtposition und fallen deshalb auf derselben Stelle zusammen: Um von einem zum anderen zu kommen, müsstest du andere Wörter überspringen. Eine zweite Achse schafft freie Wege: Jetzt liegen Mann und Frau nebeneinander, ohne dass die Machtposition verloren geht. Derselbe Pfeil erscheint wieder zwischen König und Königin. Vergleiche 1D und 2D.",
      watch: "Vergleiche 1D und 2D. Wo gibt es freie Wege, wo fallen Wörter zusammen?",
      demoState: { scene: "embedding", mode: "space", dim: 1, selected: "king", arithmetic: null },
      context: "In 1D ist die Strecke belegt; mehrere Wörter teilen sich eine Position. In 2D kann jede zusätzliche Eigenschaft eine eigene Richtung bekommen.",
      deep: "Freie Wege sind der Kern: Bedeutung braucht Platz für mehrere unabhängige Unterschiede. Jede zusätzliche Achse kann eine weitere Beziehung tragen, ohne eine andere zu überschreiben. Die Nachbarschaft ist ein statistisches Signal, keine Definition.",
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
    },
    {
      kicker: "05a / Die Übertragung",
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
      body: "We assign numbers to words. On a number line every word sits at one position: freezing on the far left, hot on the far right. The distance says how similar two words are in this one property. Click two points and watch where their midpoint lands.",
      watch: "Click two points on the line. Where does their midpoint land?",
      demoState: { scene: "embedding", mode: "temperature", dim: 0, pair: ["cold", "warm"] },
      context: "The number line is the simplest form of a vector space: one coordinate per word. More coordinates come later.",
      deep: "The positions are chosen by hand here so you can see the arithmetic. In a model they are learned from many examples. The arithmetic stays the same.",
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
      body: "The midpoint of two numbers is their average. Cold (5) and warm (55) give 30, and 30 is exactly lukewarm. Cold and hot give 52.5; that is close to warm (55), but no word sits exactly at 52.5. For meaning, closeness is often enough: you land in the right region even when the exact value is missing.",
      watch: "Choose a pair. When is the result exact, when only approximate?",
      demoState: { scene: "embedding", mode: "temperature", dim: 0, pair: ["cold", "hot"] },
      context: "The error is the distance between the midpoint and the nearest word. For cold + hot it is 2.5 degrees; for freezing + hot it is 5 degrees.",
      deep: "The arithmetic works the same in every dimension: (a+b)/2. In higher dimensions you average each coordinate separately. Similarity is usually measured by angle, not distance.",
      boxes: [
        box("emb-4", "Mathematics", "Why does this work?", "Because vectors are added coordinate by coordinate. The midpoint (a + b) / 2 lies on the line between them. The same arithmetic works in higher dimensions; you only see a projection."),
        box("emb-5", "Limit", "Is the midpoint a word?", "No. It is a position in the space. That it lands near a word is a property of the learned geometry, not a definition. For rare or ambiguous words the nearest neighbour can surprise you."),
        box("emb-approx", "Limit", "What does “approximate” mean?", "The midpoint 52.5 is 2.5 degrees away from warm. No word sits exactly at 52.5. Closeness is enough because the model later works with angles and neighbours, not with a word list.")
      ],
      sources: sources.slice(2, 4)
    },
    {
      kicker: "03 / The plane",
      title: "Meaning gets a second axis",
      body: "One axis can order words by a single property. Man and woman share the power position, so they collapse onto the same point: to get from one to the other you would have to skip other words. A second axis creates free paths: now man and woman sit side by side without losing the power position. The same arrow appears again between king and queen. Compare 1D and 2D.",
      watch: "Compare 1D and 2D. Where are there free paths, where do words collapse?",
      demoState: { scene: "embedding", mode: "space", dim: 1, selected: "king", arithmetic: null },
      context: "In 1D the line is occupied; several words share one position. In 2D every extra property can get its own direction.",
      deep: "Free paths are the point: meaning needs room for several independent differences. Every extra axis can carry another relation without overwriting one. Neighbourhood is a statistical signal, not a definition.",
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
    },
    {
      kicker: "05a / Transport",
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
    },
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
      body: "Attention hat kein Gefühl für Reihenfolge. Ohne Positionssignal sind „der Mann beißt den Hund“ und „der Hund beißt den Mann“ derselbe Beutel von Vektoren. Eine sinusförmige Kodierung gibt jedem Platz einen Fingerabdruck: Jedes Dimensionenpaar schwingt mit einer anderen Frequenz. In der Winkelansicht normieren wir den Vektor und messen den Großkreis auf der Kugel; so vergleicht das Modell Richtungen, nicht Längen.",
      watch: "Bewege den Positionsregler und wechsle zwischen Euklid und Winkel. Was bleibt stabil, was wandert auf der Kugel?",
      demoState: { scene: "position" },
      context: "Die Position wird zum Token-Vektor addiert. Die Winkelansicht projiziert den Vektor auf die Einheitskugel und misst den Großkreis; in höheren Dimensionen ist es dieselbe Rechnung auf einer Hypersphäre.",
      deep: "Die Frequenz staffelt sich über die Dimensionen. Frühe Dimensionen drehen schnell, späte langsam. So kann das Modell relative Abstände über viele Positionen lesen, ohne jede Position einzeln zu lernen.",
      boxes: [
        box("pos-1", "Mathematik", "Die Formel", "PE(pos, 2i) = sin(pos / 10000^(2i/d)), PE(pos, 2i+1) = cos(pos / 10000^(2i/d)). Jede Dimension bekommt ihre eigene Welle.", "\\underbrace{\\begin{aligned} PE_{(\\text{pos},2i)} &= \\sin\\left(\\frac{\\text{pos}}{10000^{2i/d}}\\right) \\\\ PE_{(\\text{pos},2i+1)} &= \\cos\\left(\\frac{\\text{pos}}{10000^{2i/d}}\\right) \\end{aligned}}_{\\text{jede Dimension bekommt ihre eigene Welle}}"),
        box("pos-2", "Technik", "Warum Sinus und Cosinus?", "Das Paar erlaubt es, eine Position als Drehung zu lesen. Relative Abstände werden zu festen Drehungen, und das Modell kann sie über viele Positionen wiederverwenden."),
        box("pos-3", "Grenze", "Was zeigt die 3D-Kurve nicht?", "Sie zeigt nur die ersten drei Dimensionen. Ein echtes Modell nutzt Tausende; die Kurve ist eine lesbare Scheibe, keine vollständige Karte."),
        box("pos-4", "Geometrie", "Hochdimensionale Geometrie", "In höheren Dimensionen gilt dasselbe Prinzip auf einer Hypersphäre: Vektoren werden normiert, und der Abstand ist der Winkel entlang des Großkreises. Riemann verallgemeinerte gekrümmte Räume auf beliebige Dimensionen. Hochdimensionale Räume verhalten sich oft anders als die Anschauung: In einer tiefen Loss-Landschaft ist fast jeder flache Punkt ein Sattelpunkt, kein lokales Minimum, weil es in vielen Richtungen gleichzeitig bergauf und bergab geht. Öffne diese Box nur, wenn dich die Geometrie interessiert.", "\\underbrace{d_{\\text{geo}}(u,v)}_{\\substack{\\text{Großkreis-Abstand}\\\\ \\text{auf der Einheitskugel}}} = \\underbrace{\\arccos\\!\\left(\\underbrace{\\frac{u\\cdot v}{\\|u\\|\\,\\|v\\|}}_{\\text{Kosinus des Winkels}}\\right)}_{\\text{Winkel in Radiant}}")
      ],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" },
        { label: "Riemann (1854), Über die Hypothesen, welche der Geometrie zu Grunde liegen", url: "https://ia800708.us.archive.org/4/items/uberdiehypothese00b_343/uberdiehypothese00b_343.pdf" },
        { label: "Dauphin et al. (2014), Identifying and attacking the saddle point problem", url: "https://arxiv.org/abs/1406.2572" },
        { label: "Gudmundsson (2004), An Introduction to Riemannian Geometry", url: "http://www.matematik.lu.se/matematiklu/personal/sigma/index.html" }
      ]
    },
    {
      kicker: "05b / Der Block",
      title: "Ein Block: Attention, dann FFN",
      body: "Neuronale Netze sind schichtenweise aufgebaut: Jede Schicht nimmt die Ausgabe der vorherigen und reicht sie an die nächste weiter. Der Transformer ist ein Stapel solcher Schichten. Ein Block hat zwei Rechenstationen: Attention mischt Information zwischen den Tokens, das FFN rechnet innerhalb jedes Tokens. Beide Ergebnisse werden über Residualverbindungen zum laufenden Vektor addiert. Die nächste Folie zoomt in die Attention.",
      watch: "Welcher Teil mischt Tokens, welcher rechnet pro Token?",
      demoState: { scene: "stack", mode: "block" },
      context: "Der Residual Stream ist der gemeinsame Vektor eines Tokens. Jede Station liest ihn und schreibt ein Update zurück, statt ihn zu überschreiben.",
      deep: "Ein Block ist Attention + FFN + zwei Residualverbindungen + Normalisierung. Ein Modell stapelt viele solcher Blöcke; die Gewichte sind pro Block verschieden.",
      boxes: [
        box("block-1", "Technik", "Warum zwei Stationen?", "Attention bewegt Information zwischen Tokens. Das FFN transformiert, was ein einzelnes Token trägt. Zusammen können sie Kontext aufnehmen und verarbeiten."),
        box("block-2", "Grenze", "Was zeigt der Block nicht?", "Er zeigt die Reihenfolge, nicht die gelernten Gewichte. Ein echter Block hat viele Heads, Normalisierung und oft eine andere FFN-Breite.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }]
    }
  ] : [
    {
      kicker: "05 / Position",
      title: "Every slot gets a fingerprint",
      body: "Attention has no sense of order. Without a position signal, “man bites dog” and “dog bites man” are the same bag of vectors. A sinusoidal encoding adds a fingerprint to every slot: each pair of dimensions oscillates at a different frequency. In the angle view we normalize the vector and measure the great-circle distance on the sphere; that is how the model compares directions instead of lengths.",
      watch: "Move the position slider and switch between Euclidean and angle. What stays stable, what moves on the sphere?",
      demoState: { scene: "position" },
      context: "The position is added to the token vector. The angle view projects the vector onto the unit sphere and measures the great circle; in higher dimensions the same calculation happens on a hypersphere.",
      deep: "The frequency is spread across dimensions. Early dimensions turn quickly, late ones slowly. That lets the model read relative distances over many positions without learning every position separately.",
      boxes: [
        box("pos-1", "Mathematics", "The formula", "PE(pos, 2i) = sin(pos / 10000^(2i/d)), PE(pos, 2i+1) = cos(pos / 10000^(2i/d)). Each dimension gets its own wave.", "\\underbrace{\\begin{aligned} PE_{(\\text{pos},2i)} &= \\sin\\left(\\frac{\\text{pos}}{10000^{2i/d}}\\right) \\\\ PE_{(\\text{pos},2i+1)} &= \\cos\\left(\\frac{\\text{pos}}{10000^{2i/d}}\\right) \\end{aligned}}_{\\text{each dimension gets its own wave}}"),
        box("pos-2", "Technique", "Why sine and cosine?", "The pair lets you read a position as a rotation. Relative distances become fixed rotations, and the model can reuse them across many positions."),
        box("pos-3", "Limit", "What does the 3D curve not show?", "It shows only the first three dimensions. A real model uses thousands; the curve is a readable slice, not a complete map."),
        box("pos-4", "Geometry", "High-dimensional geometry", "In higher dimensions the same principle applies on a hypersphere: normalize the vectors, and the distance is the angle along the great circle. Riemann generalized curved spaces to any dimension. High-dimensional spaces often behave unlike our intuition: in a deep loss landscape almost every flat point is a saddle point, not a local minimum, because there are many directions that go up and down at once. Open this box only if the geometry interests you.", "\\underbrace{d_{\\text{geo}}(u,v)}_{\\substack{\\text{great-circle distance}\\\\ \\text{on the unit sphere}}} = \\underbrace{\\arccos\\!\\left(\\underbrace{\\frac{u\\cdot v}{\\|u\\|\\,\\|v\\|}}_{\\text{cosine of the angle}}\\right)}_{\\text{angle in radians}}")
      ],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" },
        { label: "Riemann (1854), Über die Hypothesen, welche der Geometrie zu Grunde liegen", url: "https://ia800708.us.archive.org/4/items/uberdiehypothese00b_343/uberdiehypothese00b_343.pdf" },
        { label: "Dauphin et al. (2014), Identifying and attacking the saddle point problem", url: "https://arxiv.org/abs/1406.2572" },
        { label: "Gudmundsson (2004), An Introduction to Riemannian Geometry", url: "http://www.matematik.lu.se/matematiklu/personal/sigma/index.html" }
      ]
    },
    {
      kicker: "05b / The block",
      title: "One block: attention, then FFN",
      body: "Neural networks are built layer by layer: each layer takes the previous layer's output and passes it to the next. A transformer is a stack of such layers. One block has two compute stations: attention mixes information between tokens, and the FFN computes inside each token. Both results are added to the running vector through residual connections. The next slide zooms into attention.",
      watch: "Which part mixes tokens, which computes per token?",
      demoState: { scene: "stack", mode: "block" },
      context: "The residual stream is a token's shared vector. Every station reads it and writes an update back instead of overwriting it.",
      deep: "A block is attention + FFN + two residual connections + normalisation. A model stacks many such blocks; each block has its own weights.",
      boxes: [
        box("block-1", "Technique", "Why two stations?", "Attention moves information between tokens. The FFN transforms what a single token carries. Together they can take in context and process it."),
        box("block-2", "Limit", "What does the block not show?", "It shows the order, not the learned weights. A real block has many heads, normalisation, and often a different FFN width.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }]
    }
  ];

  var attentionSteps = DE ? [
    {
      kicker: "06 / Attend",
      title: "Kontext zieht die Bank an seinen Platz",
      body: "Woher weiß ein Wort, welche Nachbarn wichtig sind? Self-Attention lässt jedes Token die anderen lesen, entscheiden, welche zählen, und ihre Information in den eigenen Vektor ziehen. So bewegt sich „Bank“ in Richtung Fluss oder Geld. Klicke ein beliebiges Wort an, um seine Zeile zu sehen. Ein echter Layer hat viele Heads; die Demo zeigt einen.",
      watch: "Klicke ein Wort an. Welche Nachbarn bekommen Aufmerksamkeit?",
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
      title: "Attention verschiebt Bedeutungen in Kontexte",
      body: "Derselbe Mechanismus, andere Zeile: Wähle oben einen Satz und klicke ein Wort. Die Tabelle zeigt seine 100-%-Verteilung; die gewichtete Summe darunter bewegt den Vektor. Die Formel zeigt dieselben Zahlen mit ihren Gewichten.",
      watch: "Klicke ein anderes Wort an. Bleibt die Zeile bei 100 %?",
      demoState: { scene: "attention", context: "river" },
      context: "Die Sätze oben sind die echten Kontexte; die Matrix darunter zeigt nur die Aufmerksamkeit der Zielwörter.",
      deep: "Attention-Gewichte sind ein Routing-Signal. Was das FFN mit der gerouteten Information macht, steht nicht in dieser Matrix.",
      boxes: [
        box("att-4", "Grenze", "Was zeigt Attention nicht?", "Sie zeigt nicht, was das FFN mit der Information macht. Sie zeigt nur, welche Tokens auf dieser Schicht Information austauschen."),
        box("att-5", "Mathematik", "Die Formel", "Attention bildet aus Query, Key und Value eine gewichtete Summe. Die Softmax-Zeile summiert zu 100 %.", "\\underbrace{x'}_{\\substack{\\text{neuer Vektor}\\\\ \\text{für } i}} = \\underbrace{\\sum_j \\underbrace{\\alpha_{ij}}_{\\substack{\\text{Gewicht von } j\\\\ \\text{für } i}} \\underbrace{v_j}_{\\text{Value von } j}}_{\\substack{\\text{gewichtete Summe}\\\\ \\sum_j \\alpha_{ij}=100\\%}}")
      ],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" },
        { label: "Bahdanau et al. (2014), Neural Machine Translation", url: "https://arxiv.org/abs/1409.0473" },
        { label: "Attention als Graph (interaktive Zusatzseite)", url: "../test/attention_as_graph.html" }
      ]
    },
    {
      kicker: "06c / Rauschen",
      title: "Attention reduziert Rauschen",
      body: "Wörter allein sind mehrdeutig. „new“ kann in der Nähe von „car“ und von „Stadt“ liegen; „york“ allein sagt wenig. Zusammen mit „york“ wird aus „new“ die Stadt New York. Attention gewichtet die Nachbarn: Der Kontext zieht „new“ und „york“ in Richtung „Stadt“ und schwächt „car“ und „England“ ab. Die Mehrdeutigkeit wird zum Signal, das die KI mit dem Kontext auflöst.",
      watch: "Schiebe den Kontext-Regler. Wann gewinnt Stadt gegen car?",
      demoState: { scene: "noise", layer: 0 },
      context: "Attention verschiebt nicht die Wörter selbst, sondern ihre gelesene Bedeutung. Der Kontext entscheidet, welche Nachbarschaft zählt; die frühen Layer richten den Vektor an der Bedeutung aus.",
      deep: "Das ist eine didaktische Vereinfachung. Ein echter Head addiert Value-Vektoren mit gelernten Gewichten; die Winkel und Positionen sind von Hand gewählt. Die Quelle deckt die frühe sprachliche Verarbeitung, nicht die konkreten Demo-Positionen.",
      boxes: [
        box("noise-1", "Beispiel", "Was heißt new allein?", "„new“ bedeutet „neu“, kann aber auch der Anfang von „New York“ sein. Erst das zweite Wort entscheidet, welche Lesart gilt."),
        box("noise-2", "Technik", "Was macht der Kontext?", "Der Kontext gewichtet die Nachbarschaften: „york“ macht die Stadt Lesart stärker, „car“ und „England“ verlieren an Gewicht. So reduziert Attention die Mehrdeutigkeit, statt sie zu verstärken.")
      ],
      sources: [{ label: "Tenney et al. (2019), BERT Rediscovers the Classical NLP Pipeline", url: "https://aclanthology.org/P19-1356/" }]
    }
  ] : [
    {
      kicker: "06 / Attend",
      title: "Context pulls the bank into place",
      body: "How does a word know which neighbours matter? Self-attention lets each token look at the others, decide which matter, and pull their information into its vector. That is how “bank” moves toward the river or money reading. Click any word to see its row. A real layer has many heads; the demo shows one.",
      watch: "Click a word. Which neighbours receive attention?",
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
      title: "Attention shifts meaning into context",
      body: "The same mechanism, another row: pick a sentence above and click a word. The table shows its 100% distribution; the weighted sum below moves the vector. The formula shows the same numbers with their weights.",
      watch: "Click another word. Does the row still sum to 100%?",
      demoState: { scene: "attention", context: "river" },
      context: "The sentences above are the real contexts; the matrix below only shows the attention of the target words.",
      deep: "Attention weights are a routing signal. What the FFN does with the routed information is not in this matrix.",
      boxes: [
        box("att-4", "Limit", "What does attention not show?", "It does not show what the FFN does with the information. It shows only which tokens exchange information on this layer."),
        box("att-5", "Mathematics", "The formula", "Attention builds a weighted sum from query, key, and value. The softmax row sums to 100%.", "\\underbrace{x'}_{\\substack{\\text{new vector}\\\\ \\text{for } i}} = \\underbrace{\\sum_j \\underbrace{\\alpha_{ij}}_{\\substack{\\text{weight of } j\\\\ \\text{for } i}} \\underbrace{v_j}_{\\text{value of } j}}_{\\substack{\\text{weighted sum}\\\\ \\sum_j \\alpha_{ij}=100\\%}}")
      ],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" },
        { label: "Bahdanau et al. (2014), Neural Machine Translation", url: "https://arxiv.org/abs/1409.0473" },
        { label: "Attention as a graph (interactive companion page)", url: "../test/attention_as_graph.html" }
      ]
    },
    {
      kicker: "06c / Noise",
      title: "Attention reduces noise",
      body: "Words alone are ambiguous. “new” can sit near “car” and near “city”; “york” alone says little. Together with “york”, “new” becomes New York. Attention weights the neighbours: the context pulls “new” and “york” toward “city” and weakens “car” and “England”. The ambiguity becomes a signal that the model resolves with context.",
      watch: "Move the context slider. When does city win against car?",
      demoState: { scene: "noise", layer: 0 },
      context: "Attention does not move the words themselves; it moves their read meaning. The context decides which neighbourhood counts; early layers align the vector with meaning.",
      deep: "This is a didactic simplification. A real head adds value vectors with learned weights; the angles and positions are chosen by hand. The source covers early linguistic processing, not the concrete demo positions.",
      boxes: [
        box("noise-1", "Example", "What does new mean alone?", "“new” means “not old”, but it can also be the first half of “New York”. Only the second word decides which reading applies."),
        box("noise-2", "Technique", "What does context do?", "The context weights the neighbourhoods: “york” strengthens the city reading, while “car” and “England” lose weight. Attention reduces the ambiguity instead of amplifying it.")
      ],
      sources: [{ label: "Tenney et al. (2019), BERT Rediscovers the Classical NLP Pipeline", url: "https://aclanthology.org/P19-1356/" }]
    }
  ];

  var ffnSteps = DE ? [
    {
      kicker: "08 / Feed-forward",
      title: "Ein Muster passt, ein Wert wird geschrieben",
      body: "Das Feed-Forward-Netz arbeitet auf jedem Token einzeln. Es dehnt den Vektor, wendet eine Aktivierung an und projiziert zurück. Attention mischt Tokens; das FFN rechnet innerhalb eines Tokens. Es macht mit dem Kontext, was das MLP mit den Punkten gemacht hat: Bereiche, die vorher nicht linear trennbar waren, werden trennbar, weil der Kontext den Vektor immer weiter verfeinert. Auch die eigene Antwort wird Teil des Kontexts; jede neue Entscheidung verschiebt die Grenze. Der reichere Vektor ist dabei ein Punkt in einem hochdimensionalen Raum: Im Modell hat er Tausende Koordinaten, die zwei Achsen der Demo sind nur eine Projektion.",
      watch: "Vergleiche „Ich besichtige das Schloss“ und „Ich öffne das Schloss“. Welche Muster feuern?",
      demoState: { scene: "ffn", mode: "fruit" },
      context: "Ein echtes FFN hat keine beschrifteten Keys. Die Muster sind gelernte Richtungen in W₁; der Pull ist eine gelernte Richtung in W₂.",
      deep: "Die meisten Parameter eines Transformers liegen in den FFN-Matrizen. Wissen ist trotzdem verteilt, nicht in einer Zeile gespeichert.",
      boxes: [
        box("ffn-1", "Mathematik", "Die Dense-Einheit", "dense(x) = activation(Wx + b). Das FFN ist dense₂(activation(dense₁(x))). Die Aktivierung bringt die Nichtlinearität."),
        box("ffn-2", "Technik", "Warum das FFN?", "Attention bewegt Information zwischen Tokens. Das FFN transformiert, was jedes Token trägt. Beide zusammen bilden einen Block."),
        box("ffn-3", "Verbindung", "Was hat das mit dem MLP zu tun?", "Das FFN ist ein kleines MLP pro Token. Es biegt den Vektor so, dass Muster trennbar werden. Attention liefert den Kontext, das FFN rechnet ihn in eine neue Richtung."),
        box("ffn-4", "Geometrie", "Ist der reichere Vektor hochdimensional?", "Ja. Jeder Punkt in diesen Demos steht für einen Vektor mit Tausenden Dimensionen. Die zwei oder drei Achsen sind nur eine Projektion für uns; das FFN rechnet im vollen Raum. Die Muster in W₁ und der Pull in W₂ sind Richtungen in diesem hochdimensionalen Raum.")
      ],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" },
        { label: "Geva et al. (2021), Transformer Feed-Forward Layers Are Key-Value Memories", url: "https://arxiv.org/abs/2010.01019" }
      ]
    }
  ] : [
    {
      kicker: "08 / Feed-forward",
      title: "A pattern matches, a value is written",
      body: "The feed-forward network works on each token separately. It expands the vector, applies an activation, and projects back. Attention mixes tokens; the FFN computes within a token. It does with the context what the MLP did with the points: regions that were not linearly separable become separable as the context refines the vector. The model's own answer also becomes part of the context; every new decision shifts the boundary. The richer vector is a point in a high-dimensional space: in the model it has thousands of coordinates, and the two axes in the demo are only a projection.",
      watch: "Compare “I ate the apple” and “I bought an Apple laptop”. Which patterns fire?",
      demoState: { scene: "ffn", mode: "fruit" },
      context: "A real FFN has no labelled keys. The patterns are learned directions in W₁; the pull is a learned direction in W₂.",
      deep: "Most parameters of a transformer live in the FFN matrices. Knowledge is still distributed, not stored in one row.",
      boxes: [
        box("ffn-1", "Mathematics", "The dense unit", "dense(x) = activation(Wx + b). The FFN is dense₂(activation(dense₁(x))). The activation supplies the nonlinearity."),
        box("ffn-2", "Technique", "Why the FFN?", "Attention moves information between tokens. The FFN transforms what each token carries. Together they form one block."),
        box("ffn-3", "Connection", "What does this have to do with the MLP?", "The FFN is a small MLP per token. It bends the vector so that patterns become separable. Attention supplies the context; the FFN computes it into a new direction."),
        box("ffn-4", "Geometry", "Is the richer vector high-dimensional?", "Yes. Every point in these demos stands for a vector with thousands of dimensions. The two or three axes are only a projection for us; the FFN computes in the full space. The patterns in W₁ and the pull in W₂ are directions in that high-dimensional space.")
      ],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" },
        { label: "Geva et al. (2021), Transformer Feed-Forward Layers Are Key-Value Memories", url: "https://arxiv.org/abs/2010.01019" }
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
        box("md-2", "Technik", "Was machen Temperatur und Top-k?", "Temperatur macht die Auswahl breiter oder schärfer. Top-k begrenzt die Auswahl auf die k nächsten Wörter. Beides verändert die Verteilung, nicht die Karte."),
        box("md-3", "Geometrie", "Großkreis und Naht", "Der letzte Vektor zeigt auf eine Region von Token-Richtungen. Nahe einer Naht sind zwei Wörter fast gleich wahrscheinlich. Mehr Tokens verkleinern die Zellen, aber die Nähte schließen sich nie. Mabrok (2026) nennt das Band um eine Naht die Expressibility Gap.")
      ],
      sources: [{ label: "Mabrok (2026), arXiv:2603.22301", url: "https://arxiv.org/abs/2603.22301" }]
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
        box("md-2", "Technique", "What do temperature and top-k do?", "Temperature makes the choice wider or sharper. Top-k limits it to the k nearest words. Both change the distribution, not the map."),
        box("md-3", "Geometry", "Great circle and seam", "The final vector points to a region of token directions. Near a seam two words are almost equally likely. More tokens shrink the cells, but the seams never close. Mabrok (2026) calls the band around a seam the expressibility gap.")
      ],
      sources: [{ label: "Mabrok (2026), arXiv:2603.22301", url: "https://arxiv.org/abs/2603.22301" }]
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
      kicker: "04 / Modelle",
      title: "Modelle",
      body: "Ein Modell schätzt eine Funktion. Manchmal kennst du sie genau, etwa f(x) = x + 1. Manchmal kennst du sie nicht: Wie berechnet man aus dem bisherigen Text das nächste Wort? Niemand kann diese Funktion klassisch hinschreiben; sie ist viel zu kompliziert. Also geben wir dem Computer Daten. Er sieht sie sich immer wieder an und findet mit den Bausteinen, die wir ihm geben, eine Funktion, die die echte gut genug abschätzt. Das nennt sich Machine Learning. LLMs sind Machine Learning und nutzen vier Bausteine: Tokenizer, Embedding, Transformer-Blöcke aus Attention und neuronalen Netzen, und eine Unembedding-Schicht.",
      watch: "Sieh zu, wie aus Daten eine Kurve wird, und klicke die Bausteine an. Wo wird aus Text ein Vektor, wo wieder eine Verteilung?",
      demoState: { scene: "model" },
      context: "Die echte Funktion ist nirgends aufgeschrieben. Das Training sucht Parameter, mit denen die Bausteine zusammen eine gute Näherung ergeben.",
      deep: "Klassisches Programmieren beginnt mit dem Verfahren: Du schreibst jeden Schritt vor, und der Computer führt ihn aus. Bei KI drehst du das um: Du gibst Beispiele mit passenden Ausgaben, und das Training sucht die Funktion dazwischen. Die Schichten sind die Form, in der diese Funktion Platz findet.",
      boxes: [
        box("in-11", "Mathematik", "Der Stapel", "output = layer₃(layer₂(layer₁(input))). Jede Schicht ist eine Funktion mit Parametern; die Komposition ist das Modell."),
        box("mod-1", "Technik", "Die vier Bausteine", "Tokenizer: Text → Tokens. Embedding: Tokens → Vektoren. Transformer-Blöcke: Attention mischt Tokens, das neuronale Netz rechnet pro Token. Unembedding: Vektor → Scores über das Vokabular."),
        box("in-13", "Grenze", "Was heißt plausibel?", "Plausibel heißt: Die Fortsetzung kam im Trainingstext vor. Es heißt nicht, dass das Modell eine eigene Vorstellung von Wahrheit hat."),
        box("mod-extra", "Grenze", "Was fehlt hier?", "Es gibt weitere Architekturen und Details, die wir hier nicht besprechen: Mixture-of-Experts, andere Normalisierungen, Multi-Query-Attention, verschiedene Positionsverfahren und viele Trainingstricks. Hier geht es nur um die Intuition.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }]
    }
  ] : [
    {
      kicker: "04 / Models",
      title: "Models",
      body: "A model estimates a function. Sometimes you know it exactly, for example f(x) = x + 1. Sometimes you do not: how do you compute the next word from the text so far? Nobody can write that function down in the classical way; it is far too complicated. So we give the computer data. It looks at the data again and again and, with the building blocks we provide, finds a function that approximates the real one well enough. That is machine learning. LLMs are machine learning and use four building blocks: a tokenizer, an embedding, transformer blocks made of attention and neural networks, and an unembedding layer.",
      watch: "Watch data become a curve, then click the building blocks. Where does text become a vector, and where does it become a distribution again?",
      demoState: { scene: "model" },
      context: "The real function is written down nowhere. Training searches for parameters that make the building blocks together a good approximation.",
      deep: "Classical programming starts with the procedure: you write down every step, and the computer executes it. AI reverses that: you provide examples with matching outputs, and training searches for the function in between. The layers are the shape that function takes.",
      boxes: [
        box("in-11", "Mathematics", "The stack", "output = layer₃(layer₂(layer₁(input))). Each layer is a function with parameters; the composition is the model."),
        box("mod-1", "Technique", "The four building blocks", "Tokenizer: text → tokens. Embedding: tokens → vectors. Transformer blocks: attention mixes tokens, the neural network computes per token. Unembedding: vector → scores over the vocabulary."),
        box("in-13", "Limit", "What does plausible mean?", "Plausible means the continuation occurred in the training text. It does not mean the model has its own notion of truth."),
        box("mod-extra", "Limit", "What is missing here?", "There are further architectures and details we do not cover here: mixture-of-experts, other normalisations, multi-query attention, different positional schemes, and many training tricks. This page is about the intuition.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }]
    }
  ];

  var manifoldSteps = DE ? [
    {
      kicker: "07 / Die Übertragung",
      title: "Von Beziehungen zur Übersetzung",
      body: "Beziehungen untereinander können Bedeutung enthalten. Im vereinfachten Token-Raum liegen englische und japanische Wörter so ähnlich zueinander, dass man die eine Fläche durch Drehen und Verschieben in die andere überführen kann. So kann man sich Maschinenübersetzung grob vorstellen: Eine Bedeutungsfläche wird auf eine andere abgebildet. In einem echten Modell sind diese Flächen abstrakt und viel komplexer.",
      watch: "Drehe und verschiebe die Flächen. Welche Wörter bleiben in Korrespondenz?",
      demoState: { scene: "manifold" },
      context: "Die Demo ist stark vereinfacht: zwei glatte Flächen, wenige Wörter, saubere Linien. Die echte Geometrie hat Tausende Dimensionen und überlappende Beziehungen.",
      deep: "Eine Mannigfaltigkeit ist lokal flach und global gekrümmt: In kleinen Ausschnitten sieht sie aus wie eine Ebene, als Ganzes kann sie sich biegen. Die Übersetzung entspricht einer Abbildung zwischen zwei solchen Flächen.",
      boxes: [
        box("man-1", "Technik", "Was zeigt die Demo?", "Zwei gekrümmte Flächen für Englisch und Japanisch, Korrespondenzlinien zwischen Wörtern und Übersetzungspfade. Die Kontrollen drehen, trennen und richten die Flächen aus."),
        box("man-2", "Grenze", "Was ist vereinfacht?", "Die Flächen sind glatt und die Wörter sauber platziert. Ein echtes Embedding hat Tausende Dimensionen und viele überlappende Beziehungen."),
        box("man-3", "Grenze", "Wie echt ist die Übersetzung?", "Die Demo zeigt eine Idee, keine Messung. Ein echtes Modell lernt die Abbildung aus Text; die Flächen sind abstrakt und für Menschen schwer zu sehen."),
        box("man-4", "Mathematik", "Was ist eine Mannigfaltigkeit?", "Eine Mannigfaltigkeit ist ein Raum, der lokal wie R^n aussieht: Jeder Punkt hat eine Karte, die eine Umgebung auf eine offene Menge im R^n abbildet, und die Karten wechseln glatt. Global kann der Raum gekrümmt sein, zum Beispiel eine Kugel oder ein Torus.")
      ],
      sources: [{ label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781" }, { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/" }, { label: "Conneau et al. (2018), Word Translation Without Parallel Data", url: "https://arxiv.org/abs/1710.04087" }, { label: "Morris (2007), Topology Without Tears", url: "https://archive.org/details/topbook" }]
    }
  ] : [
    {
      kicker: "07 / Transport",
      title: "From relations to translation",
      body: "Relations among each other can carry meaning. In the simplified token space, English and Japanese words sit so similarly that one surface can be turned and shifted into the other. That is a rough picture of machine translation: a meaning surface is mapped onto another. In a real model these surfaces are abstract and much more complex.",
      watch: "Rotate and shift the surfaces. Which words stay in correspondence?",
      demoState: { scene: "manifold" },
      context: "The demo is strongly simplified: two smooth surfaces, few words, clean lines. The real geometry has thousands of dimensions and overlapping relations.",
      deep: "A manifold is locally flat and globally curved: in small patches it looks like a plane, as a whole it can bend. Translation corresponds to a map between two such surfaces.",
      boxes: [
        box("man-1", "Technique", "What does the demo show?", "Two curved surfaces for English and Japanese, correspondence lines between words, and translation paths. The controls rotate, separate, and align the surfaces."),
        box("man-2", "Limit", "What is simplified?", "The surfaces are smooth and the words are neatly placed. A real embedding has thousands of dimensions and many overlapping relations."),
        box("man-3", "Limit", "How real is the translation?", "The demo shows an idea, not a measurement. A real model learns the map from text; the surfaces are abstract and hard for humans to see."),
        box("man-4", "Mathematics", "What is a manifold?", "A manifold is a space that locally looks like R^n: every point has a chart that maps a neighbourhood onto an open set in R^n, and the charts change smoothly. Globally the space can be curved, for example a sphere or a torus.")
      ],
      sources: [{ label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781" }, { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/" }, { label: "Conneau et al. (2018), Word Translation Without Parallel Data", url: "https://arxiv.org/abs/1710.04087" }, { label: "Morris (2007), Topology Without Tears", url: "https://archive.org/details/topbook" }]
    }
  ];

  var mlpSteps = DE ? [
    {
      kicker: "08b / Das MLP",
      title: "Sieh zu, wie das MLP den Raum biegt",
      body: "Nach der Attention folgt ein kleines neuronales Netz: das FFN. Es rechnet auf jedem Token einzeln und kann den Raum so biegen, dass Muster trennbar werden. Eine gerade Linie ist der einfachste Trenner, aber im ursprünglichen Raum nicht immer möglich. Das MLP hebt die Punkte in eine neue Ebene, in der die Trennung gelingt. In einem LLM läuft dieselbe Idee in Tausenden Dimensionen und hilft dem Modell, interne Zustände zu isolieren.",
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
      kicker: "08b / The MLP",
      title: "Watch the MLP bend the space",
      body: "After attention comes a small neural network: the FFN. It computes on each token separately and can bend the space so that patterns become separable. A straight line is the easiest separator, but it is not always possible in the original space. The MLP lifts the points into a new plane where it becomes possible. In an LLM the same idea runs in thousands of dimensions and helps the model isolate internal states.",
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

  var activationSteps = DE ? [
    {
      kicker: "08a / Aktivierung",
      title: "Weiche Kurven, ein Knick",
      body: "Eine Nichtlinearität wird nach der Projektion auf jede Koordinate angewendet. ReLU faltet bei null; Sigmoid und tanh biegen glatt; GELU ist glatt, aber nicht monoton. Der Knick ist das, was einen geraden Schnitt durch etwas führt, das vorher untrennbar war.",
      watch: "Klicke die Funktionen. Wo ist der Knick, wo ist die Kurve glatt?",
      demoState: { scene: "activation" },
      context: "Ohne Aktivierung ist ein tiefes Netz nur eine andere Matrix. Die Aktivierung nach jeder Schicht bricht die lineare Komposition.",
      deep: "ReLU ist nicht injektiv: Alle negativen Eingaben landen bei 0. Dieser Informationsverlust kann beim Entwirren helfen. Glatte Aktivierungen bleiben für endliche Eingaben umkehrbar; Sättigung und niedrige Präzision können auch sie zu einer Treppe machen.",
      boxes: [
        box("act-1", "Beispiel", "2 Eingänge, 2 Ausgänge", "W = [[1,2],[0,-1]], x = (3,1), b = (0,-2). Wx = (5,-1), z = (5,-3), ReLU(z) = (5,0). Jede Ausgabe ist ein Skalarprodukt plus Bias, dann die Aktivierung.", "\\begin{aligned} W &= \\begin{pmatrix} 1 & 2 \\\\ 0 & -1 \\end{pmatrix}, \\quad x = \\begin{pmatrix} 3 \\\\ 1 \\end{pmatrix}, \\quad b = \\begin{pmatrix} 0 \\\\ -2 \\end{pmatrix} \\\\ Wx &= \\begin{pmatrix} 5 \\\\ -1 \\end{pmatrix}, \\quad z = Wx+b = \\begin{pmatrix} 5 \\\\ -3 \\end{pmatrix} \\\\ \\operatorname{ReLU}(z) &= \\begin{pmatrix} 5 \\\\ 0 \\end{pmatrix} \\end{aligned}"),
        box("act-2", "Ohne Knick", "Zwei Dense-Schichten ohne Nichtlinearität", "dense₂(dense₁(x)) = W₂(W₁x+b₁)+b₂ = (W₂W₁)x + (W₂b₁+b₂). Zwei lineare Schichten kollabieren zu einer. Tiefe bringt ohne Aktivierung keine zusätzliche Ausdruckskraft.", "\\begin{aligned} \\operatorname{dense}_2(\\operatorname{dense}_1(x)) &= W_2(W_1 x + b_1) + b_2 \\\\ &= (W_2 W_1)x + (W_2 b_1 + b_2) \\\\ &= Wx + b \\end{aligned}"),
        box("act-3", "Formeln", "Die vier Funktionen", "ReLU(x) = max(0,x). tanh(x) = (e^{2x} − 1)/(e^{2x} + 1). sigmoid(x) = 1/(1+e^{−x}). GELU ist ein glatter Durchlass, der kleine negative Werte noch passieren lässt."),
        box("act-4", "Satz", "Beliebig genau?", "Mit genügend Neuronen und einer nichtlinearen Aktivierung kann ein Netz jede stetige Funktion auf einem begrenzten Bereich beliebig genau annähern. Tiefe hilft, weil sie dieselbe Zahl von Neuronen effizienter nutzt.")
      ],
      sources: [{ label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355" }, { label: "Cybenko (1989), Approximation by Superpositions of a Sigmoidal Function", url: "https://doi.org/10.1007/BF02551274" }]
    }
  ] : [
    {
      kicker: "08a / Activation",
      title: "Smooth curves, one bend",
      body: "A nonlinearity is applied to each coordinate after the projection. ReLU folds at zero; sigmoid and tanh bend smoothly; GELU is smooth but not monotonic. The bend is what lets a straight cut pass through something that was inseparable before.",
      watch: "Click the functions. Where is the bend, where is the curve smooth?",
      demoState: { scene: "activation" },
      context: "Without an activation, a deep network is just another matrix. The activation after each layer breaks the linear composition.",
      deep: "ReLU is not injective: all negative inputs land at 0. That loss of information can help untangle. Smooth activations stay invertible for finite inputs; saturation and low precision can turn even a smooth activation into a staircase.",
      boxes: [
        box("act-1", "Example", "2 inputs, 2 outputs", "W = [[1,2],[0,-1]], x = (3,1), b = (0,-2). Wx = (5,-1), z = (5,-3), ReLU(z) = (5,0). Each output is a dot product plus bias, then the activation.", "\\begin{aligned} W &= \\begin{pmatrix} 1 & 2 \\\\ 0 & -1 \\end{pmatrix}, \\quad x = \\begin{pmatrix} 3 \\\\ 1 \\end{pmatrix}, \\quad b = \\begin{pmatrix} 0 \\\\ -2 \\end{pmatrix} \\\\ Wx &= \\begin{pmatrix} 5 \\\\ -1 \\end{pmatrix}, \\quad z = Wx+b = \\begin{pmatrix} 5 \\\\ -3 \\end{pmatrix} \\\\ \\operatorname{ReLU}(z) &= \\begin{pmatrix} 5 \\\\ 0 \\end{pmatrix} \\end{aligned}"),
        box("act-2", "Without a bend", "Two dense layers without a nonlinearity", "dense₂(dense₁(x)) = W₂(W₁x+b₁)+b₂ = (W₂W₁)x + (W₂b₁+b₂). Two linear layers collapse into one. Depth adds no expressive power without an activation.", "\\begin{aligned} \\operatorname{dense}_2(\\operatorname{dense}_1(x)) &= W_2(W_1 x + b_1) + b_2 \\\\ &= (W_2 W_1)x + (W_2 b_1 + b_2) \\\\ &= Wx + b \\end{aligned}"),
        box("act-3", "Formulas", "The four functions", "ReLU(x) = max(0,x). tanh(x) = (e^{2x} − 1)/(e^{2x} + 1). sigmoid(x) = 1/(1+e^{−x}). GELU is a smooth gate that still lets small negative values through."),
        box("act-4", "Theorem", "Arbitrarily close?", "With enough neurons and a nonlinear activation, a network can approximate any continuous function on a bounded region arbitrarily closely. Depth helps because it uses the same number of neurons more efficiently.")
      ],
      sources: [{ label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355" }, { label: "Cybenko (1989), Approximation by Superpositions of a Sigmoidal Function", url: "https://doi.org/10.1007/BF02551274" }]
    }
  ];

  var languageSteps = DE ? [
    {
      kicker: "14 / Sprachen und Daten",
      title: "Dieselbe Schleife, viele Sprachen",
      body: "Ein Modell bekommt keine Sprachmodule. Es bekommt Text: viele Sprachen, viele Schriften, viel Unsinn. Dieselbe Schleife liest alle. Was sie lernt, hängt an den Daten: Menge, Qualität und Mischung. GPT-3 nannte 60 % Common Crawl, 22 % WebText2, 8 % Books1, 8 % Books2 und 3 % Wikipedia; die Werte sind gerundet (Brown et al., 2020, Tabelle 2.2). Klicke die Sprachen und vergleiche.",
      watch: "Klicke die Sprachen. Was bleibt gleich, was ändert sich?",
      demoState: { scene: "langdata" },
      context: "Die Schrift ändert die Tokens, nicht die Aufgabe. Manche Sprachen brauchen für denselben Inhalt mehr Tokens; der Tokenizer kann sie teurer machen (Petrov et al., 2023).",
      deep: "Daten sind eine Designentscheidung. Filter, Dedupe und Decontamination entscheiden mit, was das Modell sieht (Lee et al., 2021). Seltene Sprachen und seltene Themen bleiben benachteiligt, auch wenn das Modell sie grundsätzlich verarbeiten kann.",
      boxes: [
        box("lang-1", "Technik", "Warum mehrere Sprachen?", "Weil Text aus vielen Sprachen kommt. Ein multilinguales Modell teilt die Gewichte; gemeinsame Muster können zwischen Sprachen übertragen werden. Seltene Sprachen bleiben trotzdem benachteiligt, weil sie im Korpus seltener sind."),
        box("lang-2", "Grenze", "Was verrät die Mischung nicht?", "Nicht, wie gut eine Sprache gelernt wird. Menge, Qualität und Tokenizer zählen zusammen. Eine große Menge schlechter Daten ist kein Vorteil."),
        box("lang-3", "Daten", "Was wird gefiltert?", "Qualität, Duplikate und Benchmark-Leaks. Dedupe verhindert Auswendiglernen; Decontamination verhindert, dass Testfragen im Training landen.")
      ],
      sources: [
        { label: "Brown et al. (2020), Language Models are Few-Shot Learners", url: "https://arxiv.org/abs/2005.14165" },
        { label: "Petrov et al. (2023), Language Model Tokenizers Introduce Unfairness Between Languages", url: "https://arxiv.org/abs/2305.15425" },
        { label: "Lee et al. (2021), Deduplicating Training Data Makes Language Models Better", url: "https://arxiv.org/abs/2107.06499" }
      ]
    }
  ] : [
    {
      kicker: "14 / Languages and data",
      title: "The same loop, many languages",
      body: "A model does not get language modules. It gets text: many languages, many scripts, plenty of nonsense. The same loop reads all of it. What it learns depends on the data: amount, quality, and mix. GPT-3 reported 60% Common Crawl, 22% WebText2, 8% Books1, 8% Books2, and 3% Wikipedia; the values are rounded (Brown et al., 2020, Table 2.2). Click the languages and compare.",
      watch: "Click the languages. What stays the same, what changes?",
      demoState: { scene: "langdata" },
      context: "The script changes the tokens, not the task. Some languages need more tokens for the same content; the tokenizer can make them more expensive (Petrov et al., 2023).",
      deep: "Data is a design decision. Filtering, deduplication, and decontamination decide what the model sees (Lee et al., 2021). Rare languages and rare topics stay disadvantaged even when the model can process them in principle.",
      boxes: [
        box("lang-1", "Technique", "Why several languages?", "Because text comes in many languages. A multilingual model shares its weights; shared patterns can transfer between languages. Rare languages still stay disadvantaged because they are rarer in the corpus."),
        box("lang-2", "Limit", "What does the mix not tell you?", "Not how well a language is learned. Amount, quality, and tokenizer act together. A large amount of bad data is no advantage."),
        box("lang-3", "Data", "What is filtered?", "Quality, duplicates, and benchmark leaks. Dedupe prevents memorisation; decontamination prevents test questions from entering the training data.")
      ],
      sources: [
        { label: "Brown et al. (2020), Language Models are Few-Shot Learners", url: "https://arxiv.org/abs/2005.14165" },
        { label: "Petrov et al. (2023), Language Model Tokenizers Introduce Unfairness Between Languages", url: "https://arxiv.org/abs/2305.15425" },
        { label: "Lee et al. (2021), Deduplicating Training Data Makes Language Models Better", url: "https://arxiv.org/abs/2107.06499" }
      ]
    }
  ];

  var philosophySteps = DE ? [
    {
      kicker: "15 / Philosophie",
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
        { label: "Searle (1980), Minds, Brains, and Programs", url: "https://doi.org/10.1017/S0140525X00005756" },
        { label: "Harnad (1990), The Symbol Grounding Problem", url: "https://doi.org/10.1016/0167-2789(90)90087-6" }
      ]
    }
  ] : [
    {
      kicker: "15 / Philosophy",
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
        { label: "Searle (1980), Minds, Brains, and Programs", url: "https://doi.org/10.1017/S0140525X00005756" },
        { label: "Harnad (1990), The Symbol Grounding Problem", url: "https://doi.org/10.1016/0167-2789(90)90087-6" }
      ]
    }
  ];

  var steps = introSteps.concat(insideSteps, tokenizeSteps, embedSteps, manifoldSteps, positionSteps, attentionSteps, activationSteps, mlpSteps, ffnSteps, stackSteps, residualSteps, trajectorySteps, meadowSteps, softmaxSteps, wholeSteps, languageSteps, philosophySteps);

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
    lang.addEventListener("click", function () {
      if (window.TM && typeof TM.setLang === "function") TM.setLang(DE ? "en" : "de");
    });
    nav.appendChild(lang);
  }
})();
