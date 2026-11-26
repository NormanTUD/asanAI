(function () {
  "use strict";

  var DE = window.TM && typeof TM.lang === "function" && TM.lang() === "de";
  function box(id, lens, title, body, tex, control, controlLabel) {
    return { id: id, lens: lens, title: title, body: body, tex: tex || "", control: control || "", controlLabel: controlLabel || "" };
  }
  var sources = [
    { label: "Harris (1954), Distributional Structure", url: "https://www.its.caltech.edu/~matilde/ZelligHarrisDistributionalStructure1954.pdf", why: { de: "Begründet Bedeutung aus dem sprachlichen Kontext.", en: "Grounds meaning in linguistic context." } },
    { label: "Firth (1957), A Synopsis of Linguistic Theory", url: "https://archive.org/details/studiesinlinguis0000vari", why: { de: "Klassische Formel: Bedeutung zeigt sich im sprachlichen Umfeld.", en: "Classic formula: meaning shows in a word's company." } },
    { label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781", why: { de: "word2vec: gelernte Wortvektoren und Vektorarithmetik.", en: "word2vec: learned word vectors and vector arithmetic." } },
    { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/", why: { de: "GloVe: globale Kookkurrenz als Wortvektoren.", en: "GloVe: global co-occurrence as word vectors." } }
  ];
  var introSteps = DE ? [
    {
      kicker: "Chat und Code",
      title: "Wie funktionieren Sprachmodelle?",
      body: "Textzusammenfassungen, Chatbots, Agents: alle arbeiten nach dem gleichen Prinzip. Wir werden hier speziell generative LLM untersuchen, aber die Modelle funktionieren meist nach sehr ähnlichen Prinzipien.\n\nSprachmodelle können sehr viele sehr verschiedene Aufgaben bearbeiten, aber wie funktionieren sie? Jeden Tag werden wir einen Teil der Technik von modernen <b>L</b>arge <b>L</b>anguage <b>M</b>odels betrachten, und eine Intuition liefern, wie diese funktionieren, die man versteht, aber die gleichzeitig auch techniknah ist.",
      teaser: "Textzusammenfassungen, Chatbots, Agents: alle arbeiten nach dem gleichen Prinzip. Wir werden hier speziell generative LLM untersuchen, aber die Modelle funktionieren meist nach sehr ähnlichen Prinzipien.\n\nSprachmodelle können sehr viele sehr verschiedene Aufgaben bearbeiten, aber wie funktionieren sie? Jeden Tag werden wir einen Teil der Technik von modernen <b>L</b>arge <b>L</b>anguage <b>M</b>odels betrachten, und eine Intuition liefern, wie diese funktionieren, die man versteht, aber die gleichzeitig auch techniknah ist.",
      demoState: { scene: "media", step: 0 },
      inherit: false,
      questionGroups: [
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
      body: "Der letzte Vektor des letzten Tokens in der letzten Schicht wird über $W_U$ zu Logits, Softmax macht daraus eine Verteilung, und ein Token wird gezogen. Dann hängst du es an den Kontext, und Attention, FFN und Unembedding laufen von vorn. Vervollständige „Es war einmal ein …“ Wort für Wort: Bei jedem Schritt zieht die Demo das nächste Token aus der Verteilung. Greedy, Sampling und Top-p lesen dieselben Wahrscheinlichkeiten unterschiedlich. Am Ende steht <|endoftext|>; sobald das Modell es zieht, endet die Schleife. Die Landschaft ist eine vereinfachte Demo.",
      watch: "Vervollständige „Es war einmal ein …“ Wort für Wort, bis <b><|endoftext|></b> kommt. Klicke ein früheres Wort an, um dorthin zurückzuspringen. Die Landschaft ist nur ein vereinfachtes Bild.",
      demoState: { scene: "loop", mode: "sample", temp: 0.8, landscape: true, view: "default", camera: { yaw: -0.86, pitch: 0.918, zoom: 1 } },
      context: "Was das Modell im aktuellen Schritt sieht, steht im Kontext. Die Gewichte tragen das gelernte Wissen, der KV-Cache beschleunigt die Wiederholung. Jedes neue Token verändert, was als Nächstes wahrscheinlich ist.",
      deep: "Eine hohe Wahrscheinlichkeit ist keine Garantie für Wahrheit. Sie ist eine Aussage über den Trainingskorpus. Sampling macht die Verteilung sichtbar; Greedy nimmt immer den wahrscheinlichsten Pfad. Jedes neue Token läuft wieder durch alle Blöcke. Der KV-Cache spart nur die Neuberechnung der Keys und Values, nicht die Schleife.",
      boxes: [
        box("in-5", "Mathematik", "Was macht Temperatur?", "Temperatur teilt die Logits vor dem Softmax: $p_i \\propto \\exp(z_i/T)$. $T < 1$ schärft, $T > 1$ flacht ab. Bei $T \\to 0$ wird daraus Greedy; exakt null wird als Top-Token behandelt."),
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
      body: "Summaries, chatbots, agents: they all work on the same principle. Here we look specifically at generative LLMs, but most models work in very similar ways.\n\nLanguage models can handle many very different tasks, but how do they work? Every day we will look at one part of the technology behind modern <b>L</b>arge <b>L</b>anguage <b>M</b>odels and build an intuition for how they work, one you can understand and that stays close to the technology.",
      teaser: "Summaries, chatbots, agents: they all work on the same principle. Here we look specifically at generative LLMs, but most models work in very similar ways.\n\nLanguage models can handle many very different tasks, but how do they work? Every day we will look at one part of the technology behind modern <b>L</b>arge <b>L</b>anguage <b>M</b>odels and build an intuition for how they work, one you can understand and that stays close to the technology.",
      demoState: { scene: "media", step: 0 },
      inherit: false,
      questionGroups: [
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
      body: "The final vector of the last token in the last layer becomes logits through $W_U$, softmax turns them into a distribution, and one token is drawn. Then you append it to the context, and attention, FFN, and unembedding run again. Complete “Once upon a time there was …” word by word: at each step the demo draws the next token from the distribution. Greedy, sampling, and top-p read the same probabilities differently. At the end comes <|endoftext|>; as soon as the model draws it, the loop stops. The landscape is a simplified demo.",
      watch: "Complete “Once upon a time there was …” word by word until <b><|endoftext|></b> appears. Click an earlier word to jump back to it. The landscape is only a simplified picture.",
      demoState: { scene: "loop", mode: "sample", temp: 0.8, landscape: true, view: "default", camera: { yaw: -0.86, pitch: 0.918, zoom: 1 } },
      context: "What the model sees in the current step is in the context. The weights carry learned knowledge, and the KV cache speeds up repetition. Every new token changes what is likely next.",
      deep: "A high probability is not a guarantee of truth. It is a statement about the training corpus. Sampling makes the distribution visible; greedy always takes the most likely path. Every new token runs through all blocks again. The KV cache only saves recomputing keys and values, not the loop.",
      boxes: [
        box("in-5", "Mathematics", "What does temperature do?", "Temperature divides the logits before softmax: $p_i \\propto \\exp(z_i/T)$. $T < 1$ sharpens, $T > 1$ flattens. At $T \\to 0$ it becomes greedy; exact zero is handled as the top token."),
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
      body: "Wenn man Wörtern Zahlen zuweist, kann man mit ihnen rechnen wie mit Zahlen. Das Wort Kalt liegt bei $15$, Lauwarm bei $45$. Nun kann man $\\text{Kalt} + \\text{Lauwarm}$ rechnen und  landet bei 60, also bei Warm.\n\nDas ist natürlich ein sehr vereinfachtes Beispiel, hier kann man genau eine Korrelation darstellen. Daher nutzt man viel höherdimensionale Räume.",
      watch: "",
      demoState: { scene: "embedding", mode: "temperature", dim: 0, pair: ["cold", "lukewarm"] },
      inherit: false,
      questionGroups: [
        {
          id: "g-basics",
          title: DE ? "Eine Ebene tiefer" : "One level deeper",
          questions: [
            { id: "q-deep", title: DE ? "Einschränkungen hier" : "Limitations here", body: DE ? "Die Positionen sind hier von Hand gewählt, damit die Rechnungen aufgehen. In einem Modell werden sie aus vielen Beispielen gelernt." : "The positions are chosen by hand here so the arithmetic works out. In a model they are learned from many examples.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-lens-mathematik",
          title: DE ? "Mathematik" : "Mathematics",
          questions: []
        },
        {
          id: "g-lens-geschichte",
          title: DE ? "Geschichte" : "History",
          questions: [
            { id: "q-box-emb-2", title: DE ? "Woher kommt die Idee?" : "Where does the idea come from?", body: DE ? "Firth (1957): „You shall know a word by the company it keeps.“ Harris (1954) formulierte die distributionelle Idee einflussreich, dass man Wörter danach gruppieren kann, wie oft sie in der Nähe voneinander vorkommen; frühere Ansätze existieren." : "Firth (1957): “You shall know a word by the company it keeps.” Harris (1954) formulated the distributional idea influentially: words can be grouped by how often they occur near each other; earlier approaches exist.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-lens-optional",
          title: DE ? "Optional" : "Optional",
          questions: [
            { id: "q-box-emb-clean", title: DE ? "Sind echte Embeddings so sauber?" : "Are real embeddings this clean?", body: DE ? "Nein. Die Demo trennt die Begriffe sauber, weil die Achsen von Hand gewählt sind. In echten Modellen sind Achsen gelernte Richtungen, keine benannten Eigenschaften. Temperatur, Stil, Thema und Sprache überlagern sich; Cluster überlappen, Wörter liegen schief im Raum, und dieselbe Richtung kann mehrere Bedeutungen tragen (Superposition). Die gerade Linie ist eine didaktische Wahl, keine reale Messung." : "No. The demo separates the concepts cleanly because the axes are chosen by hand. In real models, axes are learned directions, not named properties. Temperature, style, topic, and language overlap; clusters overlap, words lie askew in space, and the same direction can carry several meanings (superposition). The straight line is a didactic choice, not a real measurement.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-sources",
          title: DE ? "Quellen" : "Sources",
          sources: [
            { label: "Harris (1954), Distributional Structure", url: "https://www.its.caltech.edu/~matilde/ZelligHarrisDistributionalStructure1954.pdf", why: { de: "Begründet Bedeutung aus dem sprachlichen Kontext.", en: "Grounds meaning in linguistic context." } },
            { label: "Firth (1957), A Synopsis of Linguistic Theory", url: "https://archive.org/details/studiesinlinguis0000vari", why: { de: "Klassische Formel: Bedeutung zeigt sich im sprachlichen Umfeld.", en: "Classic formula: meaning shows in a word's company." } },
            { label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781", why: { de: "word2vec: gelernte Wortvektoren und Vektorarithmetik.", en: "word2vec: learned word vectors and vector arithmetic." } },
            { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/", why: { de: "GloVe: globale Kookkurrenz als Wortvektoren.", en: "GloVe: global co-occurrence as word vectors." } }
          ]
        }
      ]
    },
    {
      kicker: "Die Ebene",
      title: "Bedeutung bekommt eine zweite Achse",
      body: "Eine Achse kann Wörter nur nach einer einzigen Relation ordnen. Auf einer Linie kollidieren deshalb verschiedene Beziehungen: Rang und Geschlecht müssten sich denselben Platz teilen, und man könnte nicht mehr ablesen, ob zwei Wörter durch Rang oder durch Geschlecht getrennt sind. Die zweite Achse gibt der zweiten Relation eigenen Raum.\n\nJetzt werden zwei Richtungen sichtbar: $\\text{Mann} \\rightarrow \\text{Frau}$ und $\\text{König} \\rightarrow \\text{Königin}$ zeigen dieselbe Geschlechtsrichtung, obwohl sie auf verschiedenen Rangstufen liegen. $\\text{Mann} \\rightarrow \\text{Prinz} \\rightarrow \\text{König}$ zeigt die Machtrichtung. Die Pfeile sind parallel, weil dieselbe Beziehung dieselbe Richtung hat; der Ort im Raum sagt, worauf sie angewendet wird. In einem echten Embedding sind diese Richtungen gelernt, hier sind sie konstruiert.",
      watch: "Vergleiche die beiden Pfeilpaare: dieselbe Richtung kann an verschiedenen Stellen im Raum stehen.",
      demoState: { scene: "embedding", mode: "space", dim: 1, selected: null, arithmetic: "directions" },
      context: "",
      deep: "",
      boxes: [],
      sources: sources.slice(2, 4)
    },
    {
      kicker: "Der Raum",
      title: "Drei Dimensionen",
      body: "Eine dritte Achse hebt die Ebene in einen Raum. Die 2D-Ebene aus Macht und Geschlecht liegt flach in der Mitte: Mensch.\n\nDarunter liegt die Ebene der Tiere, darüber die Ebene der Fiktion. Die Kategorie ist eine eigene Achse; Rang bleibt in der Macht-Achse, nicht in der Höhe. Jede Ebene hat dieselben Machtstufen: unten Rüde/Hündin, Kater/Katze, Löwe/Löwin; oben Elb/Elbin, Zauberer/Zauberin, Feenkönig/Feenkönigin; in der Mitte die Menschenebene: Mann/Frau, Herzog/Herzogin, Prinz/Prinzessin, König/Königin.\n\nBedeutung ist die Region einer Richtung, nicht bloß ein Punkt.",
      watch: "Drehe die Ansicht. Am Ende der Beispiele führt Weiter zu „Richtungen“: Jedes Wort wird zum Vektor vom Ursprung. Welche Richtung bleibt für alle Paare gleich? Öffne am Ende die Tabelle der drei Dimensionen und danach die 4096-Dimensionen-Tabelle.",
      demoState: { scene: "embedding", mode: "space", dim: 2, selected: "king", arithmetic: "king-man-woman", tables: true },
      boxes: [
        box("hd-1", "Technik", "Warum so viele Dimensionen?", "Jede zusätzliche Dimension kann weitere Richtungen für Unterschiede öffnen. Mit Tausenden Koordinaten können viele Beziehungen nebeneinander existieren, auch wenn sie sich bei wenigen Dimensionen überlagern (Superposition)."),
      ],
      sources: sources
    }
  ] : [
    {
      kicker: "The line",
      title: "Meaning becomes a number",
      body: "If you assign numbers to words, you can calculate with them like numbers. The word cold sits at $15$, lukewarm at $45$. Now you can compute $\\text{cold} + \\text{lukewarm}$ and land at 60, that is, warm.\n\nThis is a very simplified example; it can represent exactly one correlation. That is why much higher-dimensional spaces are used.",
      watch: "",
      demoState: { scene: "embedding", mode: "temperature", dim: 0, pair: ["cold", "lukewarm"] },
      inherit: false,
      questionGroups: [
        {
          id: "g-basics",
          title: DE ? "Eine Ebene tiefer" : "One level deeper",
          questions: [
            { id: "q-deep", title: DE ? "Einschränkungen hier" : "Limitations here", body: DE ? "Die Positionen sind hier von Hand gewählt, damit die Rechnungen aufgehen. In einem Modell werden sie aus vielen Beispielen gelernt." : "The positions are chosen by hand here so the arithmetic works out. In a model they are learned from many examples.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-lens-mathematik",
          title: DE ? "Mathematik" : "Mathematics",
          questions: []
        },
        {
          id: "g-lens-geschichte",
          title: DE ? "Geschichte" : "History",
          questions: [
            { id: "q-box-emb-2", title: DE ? "Woher kommt die Idee?" : "Where does the idea come from?", body: DE ? "Firth (1957): „You shall know a word by the company it keeps.“ Harris (1954) formulierte die distributionelle Idee einflussreich, dass man Wörter danach gruppieren kann, wie oft sie in der Nähe voneinander vorkommen; frühere Ansätze existieren." : "Firth (1957): “You shall know a word by the company it keeps.” Harris (1954) formulated the distributional idea influentially: words can be grouped by how often they occur near each other; earlier approaches exist.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-lens-optional",
          title: DE ? "Optional" : "Optional",
          questions: [
            { id: "q-box-emb-clean", title: DE ? "Sind echte Embeddings so sauber?" : "Are real embeddings this clean?", body: DE ? "Nein. Die Demo trennt die Begriffe sauber, weil die Achsen von Hand gewählt sind. In echten Modellen sind Achsen gelernte Richtungen, keine benannten Eigenschaften. Temperatur, Stil, Thema und Sprache überlagern sich; Cluster überlappen, Wörter liegen schief im Raum, und dieselbe Richtung kann mehrere Bedeutungen tragen (Superposition). Die gerade Linie ist eine didaktische Wahl, keine reale Messung." : "No. The demo separates the concepts cleanly because the axes are chosen by hand. In real models, axes are learned directions, not named properties. Temperature, style, topic, and language overlap; clusters overlap, words lie askew in space, and the same direction can carry several meanings (superposition). The straight line is a didactic choice, not a real measurement.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-sources",
          title: DE ? "Quellen" : "Sources",
          sources: [
            { label: "Harris (1954), Distributional Structure", url: "https://www.its.caltech.edu/~matilde/ZelligHarrisDistributionalStructure1954.pdf", why: { de: "Begründet Bedeutung aus dem sprachlichen Kontext.", en: "Grounds meaning in linguistic context." } },
            { label: "Firth (1957), A Synopsis of Linguistic Theory", url: "https://archive.org/details/studiesinlinguis0000vari", why: { de: "Klassische Formel: Bedeutung zeigt sich im sprachlichen Umfeld.", en: "Classic formula: meaning shows in a word's company." } },
            { label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781", why: { de: "word2vec: gelernte Wortvektoren und Vektorarithmetik.", en: "word2vec: learned word vectors and vector arithmetic." } },
            { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/", why: { de: "GloVe: globale Kookkurrenz als Wortvektoren.", en: "GloVe: global co-occurrence as word vectors." } }
          ]
        }
      ]
    },
    {
      kicker: "The plane",
      title: "Meaning gets a second axis",
      body: "One axis can order words by only one relation. On a line, different relations collide: rank and gender would have to share the same place, and you could no longer tell whether two words are separated by rank or by gender. The second axis gives the second relation its own room.\n\nNow two directions become visible: $\\text{man} \\rightarrow \\text{woman}$ and $\\text{king} \\rightarrow \\text{queen}$ show the same gender direction, although they sit at different ranks. $\\text{man} \\rightarrow \\text{prince} \\rightarrow \\text{king}$ shows the power direction. The arrows are parallel because the same relation has the same direction; the position in space says where it applies. In a real embedding these directions are learned; here they are constructed.",
      watch: "Compare the two pairs of arrows: the same direction can sit at different places in space.",
      demoState: { scene: "embedding", mode: "space", dim: 1, selected: null, arithmetic: "directions" },
      context: "",
      deep: "",
      boxes: [],
      sources: sources.slice(2, 4)
    },
    {
      kicker: "The space",
      title: "Three dimensions, one shadow",
      body: "A third axis lifts the plane into a space. The 2D plane of power and gender lies flat in the middle: human.\n\nBelow it is the animal plane, above it the fiction plane. Category is its own axis; rank stays on the power axis, not in the height. Each layer has the same power steps: below, male dog/female dog, male cat/female cat, lion/lioness; above, elf/elf woman, wizard/sorceress, fairy king/fairy queen; in the middle, man/woman, duke/duchess, prince/princess, king/queen.\n\nMeaning is a region of a direction, not merely a point.",
      watch: "Rotate the view. At the end of the examples, Next leads to “Directions”: every word becomes a vector from the origin. Which direction stays the same for all pairs? At the end, open the table of the three dimensions and then the 4096-dimension table.",
      demoState: { scene: "embedding", mode: "space", dim: 2, selected: "king", arithmetic: "directions", tables: true },
      boxes: [
        box("hd-1", "Technique", "Why so many dimensions?", "Every extra dimension can open more directions for differences. With thousands of coordinates many relations can exist side by side, even if they overlap when there are few dimensions (superposition)."),
      ],
      sources: sources
    }
  ];

  var tokenizeSteps = DE ? [
    {
      kicker: "Tokenize",
      title: "Text wird zu IDs",
      body: "BPE beginnt je nach Variante bei Bytes oder Zeichen: Jedes Wort wird in seine Bausteine zerlegt, dann zählt der Algorithmus benachbarte Paare und ersetzt das häufigste Paar durch ein neues Symbol. Nach einigen Merges werden häufige Wörter kurz; seltene Schriften bleiben teurer, weil sie im Trainingskorpus seltener vorkommen (Petrov et al., 2023). Das ist eine gelernte, reversible Tokenisierung. Die Beispiele zeigen danach, wie ein Text in Tokens und IDs zerfällt.",
      watch: "Drücke Weiter: Welches Paar wird als Nächstes verschmolzen?",
      demoState: { scene: "tokenize" },
      centerTitle: true,
      context: "Teil 1: Text wird in Tokens geteilt, jede ID ist eine Adresse in der Embedding-Tabelle. Teil 2: BPE beginnt bei Bytes oder Zeichen und baut das Vokabular durch Merges auf. Jeder Merge ist ein neues Vokabelstück.",
      deep: "BPE ist eine gelernte Tokenisierung: Es zählt benachbarte Paare im Trainingskorpus und ersetzt das häufigste Paar durch ein neues Symbol. Nach mehreren Merges werden häufige Wörter kurz. Die genaue Tokenisierung hängt an den Daten und am Vokabularziel; die Demo zeigt einen kleinen Korpus, keine Messung eines bestimmten Modells.",
      boxes: [
        box("tok-1", "Technik", "Warum Subwords?", "Ein festes Wort-Vokabular müsste jedes unbekannte Wort als Sonderzeichen behandeln. Subwords erlauben es, neue Wörter aus bekannten Teilen zusammenzusetzen. Gleichzeitig bleibt das Vokabular endlich."),
        box("tok-2", "Mathematik", "Was ist eine ID?", "Eine ID ist ein Integer, der auf eine Zeile in der Embedding-Matrix zeigt. Die ID selbst hat keine Bedeutung; erst der gelernte Vektor gibt dem Token eine Position im Raum."),
        box("tok-3", "Technik", "BPE = reversible Tokenisierung", "Byte Pair Encoding beginnt mit Bytes oder Zeichen und ersetzt wiederholt das häufigste Paar durch ein neues Symbol. Nach vielen Merges wird aus häufigen Zeichenfolgen ein einzelner Token. Das ist eine reversible Tokenisierung, gelernt aus dem Trainingskorpus."),
        box("tok-bpe-data", "Daten", "Warum ist die Tokenisierung datenabhängig?", "Ein Tokenizer wird so optimiert, dass er möglichst viel Text mit möglichst wenigen Tokens abdeckt, ohne Information zu verlieren: Jedes Wort muss aus seinen Tokens wieder zusammensetzbar sein. Deshalb ist die exakte Zerlegung eine Folge der Trainingsdaten und des Vokabularziels, keine feste Wortliste. Seltene Schriften bleiben teurer, weil sie im Trainingskorpus seltener vorkommen (Petrov et al., 2023)."),
        box("tok-4", "Grenze", "Warum ist Englisch kürzer?", "Weil der Trainingskorpus überwiegend englisch ist. Häufige englische Wörter bekommen lange Merges; Schriften mit wenig Text im Korpus bleiben auf Byte-Ebene. Die Demo zeigt das illustrativ, nicht als exakte Messung."),
        box("tok-utf8", "Technik", "UTF-8 und Joins", "UTF-8 kodiert Zeichen als Bytes. Ein sichtbares Emoji kann aus mehreren Codepoints bestehen: 🐈‍⬛ kombiniert 🐈, einen unsichtbaren Zero Width Joiner (ZWJ) und ⬛. Der Tokenizer sieht die Bytefolge, nicht das fertige Bild. Deshalb ist die schwarze Katze hier zwei Emoji-Bausteine und mehrere Byte-Tokens.")
      ],
      sources: [
        { label: "Sennrich et al. (2016), Neural Machine Translation of Rare Words with Subword Units", url: "https://arxiv.org/abs/1508.07909", why: { de: "BPE als Subword-Kompression für seltene Wörter.", en: "BPE as subword compression for rare words." } },
        { label: "Radford et al. (2019), GPT-2", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", why: { de: "GPT-2: byte-level BPE und die hier gezeigten Hidden States.", en: "GPT-2: byte-level BPE and the hidden states shown here." } }, { label: "Petrov et al. (2023), Language Model Tokenizers Introduce Unfairness Between Languages", url: "https://arxiv.org/abs/2305.15425", why: { de: "Tokenizer machen manche Sprachen teurer.", en: "Tokenizers make some languages more expensive." } }
      ]
    }
  ] : [
    {
      kicker: "Tokenize",
      title: "Text becomes IDs",
      body: "BPE starts from bytes or characters: every word is split into its pieces, then the algorithm counts adjacent pairs and replaces the most frequent pair with a new symbol. After several merges, frequent words become short; rare scripts stay more expensive because they are rarer in the training corpus (Petrov et al., 2023). That is a learned, reversible tokenization. The examples then show how text breaks into tokens and IDs.",
      watch: "Press Next: which pair is merged next?",
      demoState: { scene: "tokenize" },
      centerTitle: true,
      context: "Part 1: text is split into tokens, and each ID is an address in the embedding table. Part 2: BPE starts from bytes or characters and builds the vocabulary through merges. Each merge is a new vocabulary item.",
      deep: "BPE is a learned tokenization: it counts adjacent pairs in the training corpus and replaces the most frequent pair with a new symbol. After several merges, frequent words become short. The exact tokenization depends on the data and the vocabulary target; the demo shows a small corpus, not a measurement of a specific model.",
      boxes: [
        box("tok-1", "Technique", "Why subwords?", "A fixed word vocabulary would have to treat every unseen word as a special symbol. Subwords let the model build new words from known pieces while keeping the vocabulary finite."),
        box("tok-2", "Mathematics", "What is an ID?", "An ID is an integer that points to a row in the embedding matrix. The ID itself has no meaning; the learned vector gives the token a position in the space."),
        box("tok-3", "Technique", "BPE = reversible tokenization", "Byte pair encoding starts with bytes or characters and repeatedly replaces the most frequent pair with a new symbol. After many merges, frequent character sequences become a single token. That is a reversible tokenization learned from the training corpus."),
        box("tok-bpe-data", "Data", "Why does tokenization depend on the data?", "A tokenizer is optimised to cover as much text as possible with as few tokens as possible, without losing information: every word must be reconstructable from its tokens. The exact split therefore follows the training data and the vocabulary target, not a fixed word list. Rare scripts stay more expensive because they are rarer in the training corpus (Petrov et al., 2023)."),
        box("tok-4", "Limit", "Why is English shorter?", "Because the training corpus is mostly English. Frequent English words get long merges; scripts with little text in the corpus stay at the byte level. The demo shows this illustratively, not as an exact measurement."),
        box("tok-utf8", "Technique", "UTF-8 and joins", "UTF-8 encodes characters as bytes. A visible emoji can consist of several code points: 🐈‍⬛ combines 🐈, an invisible zero-width joiner (ZWJ), and ⬛. The tokenizer sees the byte sequence, not the finished picture. That is why the black cat is two emoji parts and several byte tokens here.")
      ],
      sources: [
        { label: "Sennrich et al. (2016), Neural Machine Translation of Rare Words with Subword Units", url: "https://arxiv.org/abs/1508.07909", why: { de: "BPE als Subword-Kompression für seltene Wörter.", en: "BPE as subword compression for rare words." } },
        { label: "Radford et al. (2019), GPT-2", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", why: { de: "GPT-2: byte-level BPE und die hier gezeigten Hidden States.", en: "GPT-2: byte-level BPE and the hidden states shown here." } }, { label: "Petrov et al. (2023), Language Model Tokenizers Introduce Unfairness Between Languages", url: "https://arxiv.org/abs/2305.15425", why: { de: "Tokenizer machen manche Sprachen teurer.", en: "Tokenizers make some languages more expensive." } }
      ]
    }
  ];

  var positionSteps = DE ? [
    {
      kicker: "Position",
      title: "Jeder Platz bekommt einen Fingerabdruck",
      body: "Für einen Transformer sind „Der Mann beißt den Hund“ und „Der Hund beißt den Mann“ identisch, weil es nur die Tokens sieht, aber nicht ihre Reihenfolge. Die klassische absolute Kodierung addiert für jede Dimension Sinus-/Cosinuswellen unterschiedlicher Frequenz; die schnellen und langsamen Wellen wirken wie ein Stellenwertsystem.\n\nFür Position $p$ und Dimension $i$ bei Modellbreite $d$ gilt:\n\n$$\\mathrm{PE}_{p,2i}=\\sin\\!\\left(\\frac{p}{10000^{2i/d}}\\right)$$\n\n$$\\mathrm{PE}_{p,2i+1}=\\cos\\!\\left(\\frac{p}{10000^{2i/d}}\\right)$$\n\nLinks siehst du das Muster über die Dimensionen, rechts die Projektion der Positionsvektoren. In Wahrheit sind es Tausende Dimensionen; die drei Achsen sind eine Visualisierung. Die Kugel erscheint hier, weil die Demo die Großkreismetrik verwendet; der Schalter wechselt zu Euklid und zeigt dieselben Positionen als Spirale im freien Raum.\n\nDiese Werte werden auf den verschiedenen Dimensionen auf das Token addiert und auch nicht wieder entfernt. Das LLM nutzt sie, um in das Token direkt reinzukodieren, an welcher Stelle es steht.\n\nModerne offene LLMs nutzen überwiegend RoPE (Llama, Qwen, Mistral); für lange Kontexte wird es skaliert oder interpoliert (YaRN, LongRoPE). BLOOM/MPT nutzen ALiBi, T5 relative Biases, GPT-2/3 gelernte absolute Vektoren; für GPT-4, Claude und Gemini ist das Verfahren nicht offengelegt. Bei RoPE wird nichts addiert: $q$ und $k$ werden gedreht, im Score bleibt nur $n-m$. Details: siehe Quellen.",
      watch: "",
      demoState: { scene: "position" },
      context: "",
      deep: "",
      boxes: [],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention, den Transformer-Block und die absolute Sinus-/Cosinus-Positionskodierung ein.", en: "Introduces self-attention, the transformer block, and absolute sine/cosine position encoding." } },
        { label: "Radford et al. (2019), GPT-2", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", why: { de: "GPT-2: gelernte absolute Positionsvektoren.", en: "GPT-2: learned absolute position vectors." } },
        { label: "Su et al. (2021), RoFormer: Enhanced Transformer with Rotary Position Embedding", url: "https://arxiv.org/abs/2104.09864", why: { de: "RoPE: Positionskodierung als Rotation von Query und Key.", en: "RoPE: position encoding as a rotation of query and key." } },
        { label: "Touvron et al. (2023), Llama 2", url: "https://arxiv.org/abs/2307.09288", why: { de: "Llama 2 nutzt RoPE; Beispiel für ein modernes Modell.", en: "Llama 2 uses RoPE; an example of a modern model." } },
        { label: "Press et al. (2021), Attention with Linear Biases (ALiBi)", url: "https://arxiv.org/abs/2108.12409", why: { de: "ALiBi: linearer Distanz-Bias statt Positions-Embedding.", en: "ALiBi: a linear distance bias instead of position embeddings." } },
        { label: "Raffel et al. (2020), T5", url: "https://arxiv.org/abs/1910.10683", why: { de: "T5: relative Position Bias als Alternative.", en: "T5: relative position bias as an alternative." } },
        { label: "Peng et al. (2023), YaRN: Efficient Context Window Extension of Large Language Models", url: "https://arxiv.org/abs/2309.00071", why: { de: "YaRN erweitert RoPE auf lange Kontexte.", en: "YaRN extends RoPE to long contexts." } },
      { label: "Ding et al. (2024), LongRoPE: Extending LLM Context Window Beyond 2 Million Tokens", url: "https://arxiv.org/abs/2402.13753", why: { de: "LongRoPE: lange Kontexte mit angepassten RoPE-Frequenzen.", en: "LongRoPE: long contexts with adjusted RoPE frequencies." } },
        { label: "Yang et al. (2024), Qwen2 Technical Report", url: "https://arxiv.org/abs/2407.10671", why: { de: "Qwen2 nutzt RoPE; Long-Context mit YaRN.", en: "Qwen2 uses RoPE; long context with YaRN." } },
        { label: "Scao et al. (2022), BLOOM: A 176B-Parameter Open-Access Multilingual Language Model", url: "https://arxiv.org/abs/2211.05100", why: { de: "BLOOM nutzt ALiBi.", en: "BLOOM uses ALiBi." } }
      ]
    }
  ] : [
    {
      kicker: "Position",
      title: "Every place gets a fingerprint",
      body: "For a transformer, “The man bites the dog” and “The dog bites the man” are identical, because it sees only the tokens, not their order. The classic absolute encoding adds sine/cosine waves of different frequencies per dimension; the fast and slow waves act like a place-value system.\n\nFor position $p$ and dimension $i$ with model width $d$:\n\n$$\\mathrm{PE}_{p,2i}=\\sin\\!\\left(\\frac{p}{10000^{2i/d}}\\right)$$\n\n$$\\mathrm{PE}_{p,2i+1}=\\cos\\!\\left(\\frac{p}{10000^{2i/d}}\\right)$$\n\nOn the left you see the pattern across dimensions, on the right the projection of the position vectors. In truth there are thousands of dimensions; the three axes are a visualisation. The sphere appears here because the demo uses the great-circle metric; the switch changes to Euclidean and shows the same positions as a spiral in free space.\n\nThese values are added to the token across the different dimensions and are not removed again. The LLM uses them to encode directly into the token where it stands.\n\nModern open LLMs mostly use RoPE (Llama, Qwen, Mistral); for long contexts it is scaled or interpolated (YaRN, LongRoPE). BLOOM/MPT use ALiBi, T5 relative biases, GPT-2/3 learned absolute vectors; for GPT-4, Claude, and Gemini the method is not disclosed. With RoPE nothing is added: $q$ and $k$ are rotated, and only $n-m$ remains in the score. Details: see the sources.",
      watch: "",
      demoState: { scene: "position" },
      context: "",
      deep: "",
      boxes: [],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention, den Transformer-Block und die absolute Sinus-/Cosinus-Positionskodierung ein.", en: "Introduces self-attention, the transformer block, and absolute sine/cosine position encoding." } },
        { label: "Radford et al. (2019), GPT-2", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", why: { de: "GPT-2: gelernte absolute Positionsvektoren.", en: "GPT-2: learned absolute position vectors." } },
        { label: "Su et al. (2021), RoFormer: Enhanced Transformer with Rotary Position Embedding", url: "https://arxiv.org/abs/2104.09864", why: { de: "RoPE: Positionskodierung als Rotation von Query und Key.", en: "RoPE: position encoding as a rotation of query and key." } },
        { label: "Touvron et al. (2023), Llama 2", url: "https://arxiv.org/abs/2307.09288", why: { de: "Llama 2 nutzt RoPE; Beispiel für ein modernes Modell.", en: "Llama 2 uses RoPE; an example of a modern model." } },
        { label: "Press et al. (2021), Attention with Linear Biases (ALiBi)", url: "https://arxiv.org/abs/2108.12409", why: { de: "ALiBi: linearer Distanz-Bias statt Positions-Embedding.", en: "ALiBi: a linear distance bias instead of position embeddings." } },
        { label: "Raffel et al. (2020), T5", url: "https://arxiv.org/abs/1910.10683", why: { de: "T5: relative Position Bias als Alternative.", en: "T5: relative position bias as an alternative." } },
        { label: "Peng et al. (2023), YaRN: Efficient Context Window Extension of Large Language Models", url: "https://arxiv.org/abs/2309.00071", why: { de: "YaRN erweitert RoPE auf lange Kontexte.", en: "YaRN extends RoPE to long contexts." } },
      { label: "Ding et al. (2024), LongRoPE: Extending LLM Context Window Beyond 2 Million Tokens", url: "https://arxiv.org/abs/2402.13753", why: { de: "LongRoPE: lange Kontexte mit angepassten RoPE-Frequenzen.", en: "LongRoPE: long contexts with adjusted RoPE frequencies." } },
        { label: "Yang et al. (2024), Qwen2 Technical Report", url: "https://arxiv.org/abs/2407.10671", why: { de: "Qwen2 nutzt RoPE; Long-Context mit YaRN.", en: "Qwen2 uses RoPE; long context with YaRN." } },
        { label: "Scao et al. (2022), BLOOM: A 176B-Parameter Open-Access Multilingual Language Model", url: "https://arxiv.org/abs/2211.05100", why: { de: "BLOOM nutzt ALiBi.", en: "BLOOM uses ALiBi." } }
      ]
    }
  ];

  var positionStep = positionSteps[0];

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
      body: "Drei Sätze, dasselbe Wort: Bank ohne Kontext, Bank für Geld, Bank im Park. Klicke einen Satz und ein Wort. Die Matrix zeigt, wohin die Bank schaut; die Formel zeigt dieselben Gewichte.",
      watch: "Klicke die drei Sätze. Welches Wort zieht die Bank?",
      demoState: { scene: "attention", context: "money" },
      context: "Der Kontext verschiebt den Vektor, nicht das Wort. Die Bank bleibt dasselbe Token; ihre Nachbarn ändern ihre Bedeutung.",
      deep: "Attention mischt Information aus dem Kontext. Bei „Geld“ zeigt die Bank-Zeile auf Geld, bei „Park“ auf Park. Die Gewichte sind ein Routing-Signal, keine Definition.",
      boxes: [
        box("att-4", "Grenze", "Was zeigt Attention nicht?", "Nicht, was das FFN mit der Information macht. Sie zeigt nur, welche Tokens auf dieser Schicht Information austauschen."),
        box("att-5", "Mathematik", "Die Formel", "Attention bildet aus Query, Key und Value eine gewichtete Summe. Die Softmax-Zeile summiert zu 1, also 100 %.", "\\underbrace{r}_{\\substack{\\text{Mischung}\\\\ \\text{für } i}} = \\underbrace{\\sum_j \\underbrace{\\alpha_{ij}}_{\\substack{\\text{Gewicht von } j\\\\ \\text{für } i}} \\underbrace{v_j}_{\\text{Value von } j}}_{\\substack{\\text{gewichtete Summe}\\\\ \\sum_j \\alpha_{ij}=1}}"),
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
      body: "Three sentences, one word: a bank without context, a bank for money, a bank in the park. Click a sentence and a word. The matrix shows where the bank looks; the formula shows the same weights.",
      watch: "Click the three sentences. Which word pulls the bank?",
      demoState: { scene: "attention", context: "money" },
      context: "The context shifts the vector, not the word. The bank stays the same token; its neighbours change what it means.",
      deep: "Attention mixes information from the context. With “money” the bank row points to money, with “park” to park. The weights are a routing signal, not a definition.",
      boxes: [
        box("att-4", "Limit", "What does attention not show?", "Not what the FFN does with the information. It shows only which tokens exchange information on this layer."),
        box("att-5", "Mathematics", "The formula", "Attention builds a weighted sum from query, key, and value. The softmax row sums to 1, or 100%.", "\\underbrace{r}_{\\substack{\\text{mixture}\\\\ \\text{for } i}} = \\underbrace{\\sum_j \\underbrace{\\alpha_{ij}}_{\\substack{\\text{weight of } j\\\\ \\text{for } i}} \\underbrace{v_j}_{\\text{value of } j}}_{\\substack{\\text{weighted sum}\\\\ \\sum_j \\alpha_{ij}=1}}"),
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
      body: "Das FFN ist ein kleines MLP pro Token: Dense, Aktivierung, Dense. Die Punkte unten sind symbolisch, und Burg wie Mechanik sind Platzhalter, keine echten Modellfeatures; im echten Modell liegen die Muster nichtlinear in einem hochdimensionalen Raum. Das MLP hebt sie in einen höheren Raum, macht die Cluster trennbarer und projiziert zurück. So isoliert es Bedeutungen und reicht eine abstraktere Repräsentation weiter. Attention mischt Tokens; das FFN macht die verworrenen Strukturen innerhalb eines Tokens trennbarer. Klicke die beiden Kontexte und biege den Raum, bis eine Ebene trennt.\n\nJedes Token wird nach jeder Attention durch dasselbe neuronale Netz geschickt, das dann die kontextualisierten Tokens unabhängig voneinander verschiebt. Die Rolle im LLM: verworrene Muster trennbar machen.",
      watch: "",
      demoState: { scene: "ffn", mode: "fruit" },
      context: "Das FFN ist ein MLP: Dense, Aktivierung, Dense. Es arbeitet auf jedem Token einzeln. Seine Rolle im LLM: verworrene Muster trennbar machen.",
      deep: "Ein echtes FFN hat keine beschrifteten Keys. Die Muster sind gelernte Richtungen in W₁; der Pull ist eine gelernte Richtung in W₂. Die Demo zeigt die Idee, nicht die exakten Gewichte.",
      boxes: [
        box("ffn-2", "Technik", "Warum das FFN?", "Attention bewegt Information zwischen Tokens. Das FFN ist ein MLP pro Token und trennt Muster, die sonst verworren bleiben. Beide zusammen bilden einen Block."),
        box("ffn-4", "Geometrie", "Ist der reichere Vektor hochdimensional?", "Ja. Jeder Punkt hier steht für einen Vektor mit Tausenden Dimensionen. Die zwei oder drei Achsen sind nur eine Projektion für uns; das FFN rechnet im vollen Raum. Die Muster in $W_1$ und der Pull in $W_2$ sind Richtungen in diesem hochdimensionalen Raum.")
      ],
      questionGroups: [
        { id: "g-basics", title: "Eine Ebene tiefer", questions: [] },
        {
          id: "g-lens-technik",
          title: "Technik",
          questions: [
            { id: "q-box-ffn-2", title: "Warum das FFN?", body: "Attention bewegt Information zwischen Tokens. Das FFN ist ein MLP pro Token und trennt Muster, die sonst verworren bleiben. Beide zusammen bilden einen Block.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-lens-geometrie",
          title: "Geometrie",
          questions: [
            { id: "q-box-ffn-4", title: "Ist der reichere Vektor hochdimensional?", body: "Ja. Jeder Punkt hier steht für einen Vektor mit Tausenden Dimensionen. Die zwei oder drei Achsen sind nur eine Projektion für uns; das FFN rechnet im vollen Raum. Die Muster in $W_1$ und der Pull in $W_2$ sind Richtungen in diesem hochdimensionalen Raum.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-sources",
          title: "Quellen",
          sources: [
            { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } },
            { label: "Geva et al. (2021), Transformer Feed-Forward Layers Are Key-Value Memories", url: "https://arxiv.org/abs/2012.14913", why: { de: "FFN-Schichten als Key-Value-Gedächtnis.", en: "FFN layers as key-value memory." } }, { label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355", why: { de: "Höherdimensionales Falten macht die Klassen trennbar.", en: "Higher-dimensional folding makes the classes separable." } }, { label: "Olah (2014), Neural Networks, Manifolds, and Topology", url: "https://colah.github.io/posts/2014-03-NN-Manifolds-Topology/", why: { de: "Daten liegen auf gekrümmten Mannigfaltigkeiten; Schichten entwirren sie.", en: "Data lies on curved manifolds; layers untangle it." } }
          ]
        }
      ],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } },
        { label: "Geva et al. (2021), Transformer Feed-Forward Layers Are Key-Value Memories", url: "https://arxiv.org/abs/2012.14913", why: { de: "FFN-Schichten als Key-Value-Gedächtnis.", en: "FFN layers as key-value memory." } }, { label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355", why: { de: "Höherdimensionales Falten macht die Klassen trennbar.", en: "Higher-dimensional folding makes the classes separable." } }, { label: "Olah (2014), Neural Networks, Manifolds, and Topology", url: "https://colah.github.io/posts/2014-03-NN-Manifolds-Topology/", why: { de: "Daten liegen auf gekrümmten Mannigfaltigkeiten; Schichten entwirren sie.", en: "Data lies on curved manifolds; layers untangle it." } }
      ]
    }
  ] : [
    {
      kicker: "Feed-forward network (FFN)",
      title: "The role of neural networks in the transformer",
      body: "The FFN is a small MLP per token: dense, activation, dense. The points below are symbolic, and castle and mechanism are placeholders, not real model features; in a real model the patterns lie nonlinearly in a high-dimensional space. The MLP lifts them into a higher space, makes the clusters more separable, and projects back. That is how it isolates meanings and passes on a more abstract representation. Attention mixes tokens; the FFN makes the entangled structures inside one token more separable. Click the two contexts and bend the space until a plane separates them.\n\nAfter every attention step, each token is passed through the same neural network, which then shifts the contextualised tokens independently of one another. The role in the LLM: make entangled patterns separable.",
      watch: "",
      demoState: { scene: "ffn", mode: "fruit" },
      context: "The FFN is an MLP: dense, activation, dense. It works on each token separately. Its role in the LLM: make entangled patterns separable.",
      deep: "A real FFN has no labelled keys. The patterns are learned directions in W₁; the pull is a learned direction in W₂. The demo shows the idea, not the exact weights.",
      boxes: [
        box("ffn-2", "Technique", "Why the FFN?", "Attention moves information between tokens. The FFN is an MLP per token and separates patterns that would otherwise stay entangled. Together they form one block."),
        box("ffn-4", "Geometry", "Is the richer vector high-dimensional?", "Yes. Every point here stands for a vector with thousands of dimensions. The two or three axes are only a projection for us; the FFN computes in the full space. The patterns in $W_1$ and the pull in $W_2$ are directions in that high-dimensional space.")
      ],
      questionGroups: [
        { id: "g-basics", title: "One level deeper", questions: [] },
        {
          id: "g-lens-technique",
          title: "Technique",
          questions: [
            { id: "q-box-ffn-2", title: "Why the FFN?", body: "Attention moves information between tokens. The FFN is an MLP per token and separates patterns that would otherwise stay entangled. Together they form one block.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-lens-geometry",
          title: "Geometry",
          questions: [
            { id: "q-box-ffn-4", title: "Is the richer vector high-dimensional?", body: "Yes. Every point here stands for a vector with thousands of dimensions. The two or three axes are only a projection for us; the FFN computes in the full space. The patterns in $W_1$ and the pull in $W_2$ are directions in that high-dimensional space.", tex: "", kind: "question" }
          ]
        },
        {
          id: "g-sources",
          title: "Sources",
          sources: [
            { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } },
            { label: "Geva et al. (2021), Transformer Feed-Forward Layers Are Key-Value Memories", url: "https://arxiv.org/abs/2012.14913", why: { de: "FFN-Schichten als Key-Value-Gedächtnis.", en: "FFN layers as key-value memory." } }, { label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355", why: { de: "Höherdimensionales Falten macht die Klassen trennbar.", en: "Higher-dimensional folding makes the classes separable." } }, { label: "Olah (2014), Neural Networks, Manifolds, and Topology", url: "https://colah.github.io/posts/2014-03-NN-Manifolds-Topology/", why: { de: "Daten liegen auf gekrümmten Mannigfaltigkeiten; Schichten entwirren sie.", en: "Data lies on curved manifolds; layers untangle it." } }
          ]
        }
      ],
      sources: [
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } },
        { label: "Geva et al. (2021), Transformer Feed-Forward Layers Are Key-Value Memories", url: "https://arxiv.org/abs/2012.14913", why: { de: "FFN-Schichten als Key-Value-Gedächtnis.", en: "FFN layers as key-value memory." } }, { label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355", why: { de: "Höherdimensionales Falten macht die Klassen trennbar.", en: "Higher-dimensional folding makes the classes separable." } }, { label: "Olah (2014), Neural Networks, Manifolds, and Topology", url: "https://colah.github.io/posts/2014-03-NN-Manifolds-Topology/", why: { de: "Daten liegen auf gekrümmten Mannigfaltigkeiten; Schichten entwirren sie.", en: "Data lies on curved manifolds; layers untangle it." } }
      ]
    }
  ];

  var ffnStep = ffnSteps[0];

  var residualSteps = DE ? [
    {
      kicker: "Residual",
      title: "Das gemeinsame Notizbuch wird zum Stream",
      body: "Die Notizbuch-Vorstellung ist eine stark vereinfachte, vermenschlichte Sichtweise. Jedes Token hat einen eigenen Residual Stream. Stell dir jeden Stream als Notizbuch vor: Das Token steht schon am Anfang darin. Jede Schicht liest den aktuellen Stand und schreibt ihre Beobachtung dazu; nichts wird gelöscht. Drücke Weiter: Die erste Schicht schreibt ihre Notiz, und am Ende wächst aus denselben Updates der Stream. Attention und FFN lesen den Stream und addieren ihr Update; die Dimension bleibt gleich.",
      watch: "Drücke Weiter: erst schreibt die erste Schicht, dann wächst der Stream.",
      demoState: { scene: "residual" },
      context: "Die Notizbuch-Analogie ist eine stark vereinfachte, vermenschlichte Sichtweise. Mathematisch ist der Stream ein Vektor pro Token; die Streams werden getrennt geführt, und jede Schicht addiert pro Token ein Update: x ← x + Layer(x). Frühere Informationen bleiben als Summand erhalten; ob sie lesbar bleiben, hängt von den späteren Projektionen ab.",
      deep: "Die Addition gibt dem Gradienten einen kurzen Pfad zurück. Ohne Residualverbindung müsste jede Schicht die gesamte Information neu schreiben. Jedes Token hat seinen eigenen Stream; Attention mischt Information zwischen ihnen, und FFN schreibt Updates hinein; die Identität bleibt erhalten.",
      boxes: [
        box("res-nb", "Mathematik", "Das Notizbuch", "x₁ = x₀ + Layer(x₀). Die Identität bleibt; jede Schicht addiert nur ihre Änderung. Gelesen wird immer der aktuelle Stand.", DE ? "\\underbrace{x_1}_{\\text{neu}} = \\underbrace{x_0}_{\\text{alt}} + \\underbrace{\\operatorname{Layer}(x_0)}_{\\text{Notiz der Schicht}}" : "\\underbrace{x_1}_{\\text{neu}} = \\underbrace{x_0}_{\\text{alt}} + \\underbrace{\\operatorname{Layer}(x_0)}_{\\text{Notiz der Schicht}}"),
        box("res-1", "Mathematik", "Warum Addition?", "x ← x + f(x). Die Identität bleibt erhalten; die Schicht lernt nur die Änderung. Das macht tiefe Stapel trainierbar."),
        box("res-2", "Grenze", "Was ist das nicht?", "Kein Speicher im Sinne einer Datenbank und keine wörtliche Expertenrunde. Der Stream ist ein Vektor pro Token, der durch die Schichten getragen wird.")
      ]
    }
  ] : [
    {
      kicker: "Residual",
      title: "The shared notebook becomes the stream",
      body: "The notebook picture is a strongly simplified, humanised view. Each token has its own residual stream. Think of each stream as a notebook: the token is already in it at the start. Every layer reads the current state and writes its observation into it; nothing is erased. Press Next: the first layer writes its note, and in the end the stream grows from the same updates. Attention and the FFN read the stream and add their update; the dimension stays the same.",
      watch: "Press Next: first the first layer writes, then the stream grows.",
      demoState: { scene: "residual" },
      context: "The notebook analogy is a strongly simplified, humanised view. Mathematically the stream is one vector per token; the streams are kept separately, and every layer adds an update per token: x ← x + Layer(x). Earlier information remains present as a summand; whether it stays readable depends on later projections.",
      deep: "The addition gives gradients a short path back. Without a residual connection, every layer would have to rewrite all information. Each token has its own stream; attention mixes information between them, and the FFN writes updates into them; the identity survives.",
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
      context: "Die Wiese ist eine Visualisierung: Jede Zelle steht für ein Token, die goldene Naht für fast gleiche Wahrscheinlichkeit. Die echten Token-Wahrscheinlichkeiten kommen aus Softmax über Logits, nicht aus der räumlichen Nähe zu einem Zentrum. Am Rand und an der Naht ist die Entscheidung unsicher; mehr Wörter machen die Zellen feiner, nicht die Unsicherheit null.",
      deep: "In einem echten Modell hat der Raum Tausende Dimensionen und das Vokabular Zehntausende Tokens. Die Wiese ist eine Projektion auf zwei Achsen; die Nähte sind die Grenzen zwischen benachbarten Token-Regionen.",
      boxes: [
        box("md-1", "Mathematik", "Was ist eine Voronoi-Zelle?", "Die Menge aller Punkte, die einem Wort näher sind als jedem anderen. Die Grenze zwischen zwei Zellen ist die Menge der Punkte mit gleichem Abstand."),
        box("md-2", "Technik", "Was machen Temperatur und Top-k?", "Temperatur macht die Auswahl breiter oder schärfer. Top-k begrenzt die Auswahl auf die k nächsten Wörter. Beides verändert die Verteilung, nicht die Karte."),
        box("md-3", "Geometrie", "Großkreis und Naht", "Der letzte Vektor zeigt auf eine Region von Token-Richtungen. Nahe einer Naht sind zwei Wörter fast gleich wahrscheinlich. Mehr Tokens verkleinern die Zellen, aber die Nähte schließen sich nie. Mabrok (2026) nennt die semantische Verzerrung durch das endliche Vokabular die Expressibility Gap.")
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
      context: "The meadow is a visualisation: each cell stands for a token, the gold seam for almost equal probability. Real token probabilities come from softmax over logits, not from spatial closeness to a centre. At the edge and on a seam the decision is uncertain; more words make the cells finer, not the uncertainty zero.",
      deep: "In a real model the space has thousands of dimensions and the vocabulary tens of thousands of tokens. The meadow is a projection onto two axes; the seams are the borders between neighbouring token regions.",
      boxes: [
        box("md-1", "Mathematics", "What is a Voronoi cell?", "The set of all points closer to one word than to every other. The border between two cells is the set of points at equal distance."),
        box("md-2", "Technique", "What do temperature and top-k do?", "Temperature makes the choice wider or sharper. Top-k limits it to the k nearest words. Both change the distribution, not the map."),
        box("md-3", "Geometry", "Great circle and seam", "The final vector points to a region of token directions. Near a seam two words are almost equally likely. More tokens shrink the cells, but the seams never close. Mabrok (2026) calls the semantic distortion caused by a finite vocabulary the expressibility gap.")
      ],
      sources: [{ label: "Mabrok (2026), arXiv:2603.22301", url: "https://arxiv.org/abs/2603.22301", why: { de: "Quelle der zugehörigen Aktivierungs-/Geometrie-Aussagen.", en: "Source for the related activation/geometry claims." } }]
    }
  ];

  var insideSteps = DE ? [

    {
      kicker: "1 Neuron",
      title: "Was sind neuronale Netze?",
      body: "Ein neuronales Netz ist zuerst eine parametrisierte Funktion. Das kleinste Beispiel ist ein lineares Neuron: $\\hat y = w\\cdot x + b$. Es hat zwei Parameter und kann nur eine Gerade zeichnen. Die Box `mod-layer` auf dieser Folie zeigt ein Neuron mit zusätzlicher Ausgangsprojektion; dort kommen zwei weitere Parameter und eine Aktivierung hinzu. Die Demo zeigt genau das: Die Gerade passt sich an die Punkte an, aber sie kann den Sinus nur grob annähern, nicht biegen. Die vertikalen Striche sind die Fehler. Aus diesen Fehlern berechnet das Training den Loss.",
      watch: "Starte das Training. Wie reagiert die Gerade? Warum bleiben die Fehler groß?",
      demoState: { scene: "model", phase: "linear" },
      context: "Der Loss wird nur auf den Trainingspunkten berechnet. Außerhalb gibt es keine Daten; die Kurve ist eine Extrapolation.",
      deep: "Ein Neuron rechnet z = w x + b. Die Gerade hat nur zwei Parameter. Sie kann eine nichtlineare Funktion nicht approximieren, egal wie lange sie trainiert. Erst Aktivierungen und mehrere Schichten erzeugen Knicke und Kurven.",
      boxes: [
        box("mod-0", "Idee", "Was ist ein Modell?", "Ein Modell ist eine parametrisierte Funktion, die aus Eingaben Ausgaben schätzt. Beim Training werden die Parameter so angepasst, dass die Ausgaben zu den Daten passen."),
        box("mod-layer", "Mathematik", "Das Neuron mit Ausgangsprojektion", "Ein Input, ein Neuron: $z = w x + b$; $a = \\operatorname{activation}(z)$; Ausgabe $= v a + c$. w, b, v und c sind Parameter. Das einfachste lineare Neuron ohne Ausgangsprojektion hat nur w und b. Mehr Neuronen und Schichten komponieren solche Funktionen.", "\\underbrace{z}_{\\text{Input des Neurons}} = \\underbrace{w x + b}_{\\text{lineare Schicht}} \\qquad \\underbrace{a}_{\\text{Aktivierung}} = \\underbrace{\\operatorname{activation}(z)}_{\\text{Knick oder Kurve}}"),
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
      body: "Ein LLM ist eine Kette von Stufen, keine einzelne Zauberformel. Die Daten stehen davor und werden zum Training verwendet; die Architektur beginnt mit dem Tokenizer. Gehe die fünf Stufen mit „Weiter“ durch: Tokenizer, Embedding, Positional Embedding, Transformer-Blöcke und Unembedding. In den nächsten Tagen gehen wir alle diese Sachen durch.",
      watch: "Gehe die fünf Stufen mit „Weiter“ oder der Pfeiltaste durch. Was macht jede Ebene?",
      demoState: { scene: "blocks" },
      context: "Die Reihenfolge ist die Architektur: Tokens → Vektoren → Position → Transformer-Blöcke → Verteilung. Jeder Schritt verändert die Darstellung, bis am Ende ein Token gezogen wird.",
      deep: "Jeder Block ist selbst ein gelerntes Stück Funktion. Zusammen approximieren sie die viel zu komplizierte Funktion „nächstes Token aus Kontext“.",
      boxes: [
        box("mod-1", "Technik", "Die fünf Stufen", "Tokenizer: Text → Tokens. Embedding: Tokens → Vektoren. Positional Embedding: Position → Vektor. Transformer-Blöcke: Attention, LayerNorm und FFN, dutzende bis hunderte Male wiederholt. Unembedding: Vektor → Scores und Softmax."),
        box("mod-dense", "Optional", "Dense = alle mit allen", "Eine Dense-Schicht verbindet jede Eingabe mit jeder Ausgabe. Die Gewichte sind die Kanten eines vollständigen gewichteten Graphen. In der Matrix $W$ steht $W_{ij}$ für die Kante von Eingang j zu Ausgang i. Daher kommen die üblichen Netzdiagramme.", "\\underbrace{y_i}_{\\text{Ausgang }i} = \\underbrace{\\sum_j W_{ij} x_j + b_i}_{\\text{alle Eingänge}}"),
        box("mod-norm", "Technik", "LayerNorm und andere Blöcke", "Ein echter Transformer-Block hat zwei LayerNorm-Stellen, eine für Attention und eine für das FFN; im Original-Transformer nach den Residual-Additionen, in GPT-2 davor. LayerNorm zentriert jede Token-Zeile auf Mittelwert 0 und Varianz 1; gelernte γ/β justieren danach. Sie begrenzt die Werte nicht auf [-1, 1]."),
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
      body: "A neural network is first a parameterised function. The smallest example is a linear neuron: $\\hat y = w\\cdot x + b$. It has two parameters and can draw only a straight line. The `mod-layer` box on this slide shows a neuron with an additional output projection; that version has two more parameters and an activation. The demo shows exactly that: the line adapts to the points, but it cannot bend the sine. The vertical strokes are the errors. From these errors the training computes the loss.",
      watch: "Start training. How does the line react? Why do the errors stay large?",
      demoState: { scene: "model", phase: "linear" },
      context: "The loss is computed only on the training points. Outside there is no data; the curve is an extrapolation.",
      deep: "One neuron computes z = w x + b. The line has only two parameters. It cannot approximate a nonlinear function, no matter how long it trains. Only activations and several layers create bends and curves.",
      boxes: [
        box("mod-0", "Idea", "What is a model?", "A model is a parameterised function that estimates outputs from inputs. Training adjusts the parameters so that the outputs fit the data."),
        box("mod-layer", "Mathematics", "The neuron with an output projection", "One input, one neuron: $z = w x + b$; $a = \\operatorname{activation}(z)$; output $= v a + c$. w, b, v, and c are parameters. The simplest linear neuron without an output projection has only w and b. More neurons and layers compose such functions.", "\\underbrace{z}_{\\text{input to the neuron}} = \\underbrace{w x + b}_{\\text{linear layer}} \\qquad \\underbrace{a}_{\\text{activation}} = \\underbrace{\\operatorname{activation}(z)}_{\\text{bend or curve}}"),
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
      body: "An LLM is a chain of stages, not a single magic formula. The data stands before it and is used for training; the architecture begins with the tokenizer. Walk through the five stages with “Next”: tokenizer, embedding, positional embedding, transformer blocks, and unembedding. Over the next days we will go through all of these things.",
      watch: "Walk through the five stages with “Next” or the arrow key. What does each level do?",
      demoState: { scene: "blocks" },
      context: "The order is the architecture: tokens → vectors → position → transformer blocks → distribution. Each step changes the representation until a token is drawn.",
      deep: "Each block is itself a learned piece of function. Together they approximate the far too complicated function “next token from context”.",
      boxes: [
        box("mod-1", "Technique", "The five stages", "Tokenizer: text → tokens. Embedding: tokens → vectors. Positional embedding: position → vector. Transformer blocks: attention, LayerNorm, and FFN, repeated dozens to hundreds of times. Unembedding: vector → scores and softmax."),
        box("mod-dense", "Optional", "Dense = all to all", "A dense layer connects every input to every output. The weights are the edges of a complete weighted graph. In the matrix $W$, $W_{ij}$ is the edge from input j to output i. That is where the usual network diagrams come from.", "\\underbrace{y_i}_{\\text{output }i} = \\underbrace{\\sum_j W_{ij} x_j + b_i}_{\\text{all inputs}}"),
        box("mod-norm", "Technique", "LayerNorm and other blocks", "A real transformer block has two LayerNorm sites, one for attention and one for the FFN; in the original transformer after the residual additions, in GPT-2 before them. LayerNorm centers each token row on mean 0 and variance 1; learned γ/β adjust it afterwards. It does not bound the values to [-1, 1]."),
        box("mod-angle", "Mathematics", "Why angles?", "At the end, directions are compared, not lengths. The angle between two vectors changes less in high dimensions than their length. That is why the great-circle metric is useful here; for a first pass the intuition is enough."),
        box("in-13", "Limit", "What does plausible mean?", "Plausible means the continuation occurred in the training text. It does not mean the model has its own notion of truth."),
        box("mod-extra", "Limit", "What is missing here?", "There are further architectures and details we do not cover here: mixture-of-experts, other normalisations, multi-query attention, different positional schemes, and many training tricks. This page is about the intuition.")
      ],
      sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Führt Self-Attention und den Transformer-Block ein.", en: "Introduces self-attention and the transformer block." } }]
    }
  ];

  var bausteineIntro = {
    kicker: DE ? "Daten" : "Data",
    title: DE ? "Daten" : "Data",
    body: DE
      ? "Beim klassischen Programmieren gibt man dem Computer genau vor, wie er sich zu verhalten hat.\n\nBei Machine Learning dagegen gibt man dem Computer viele Beispiele, wie er reagieren soll, und er lernt daraus, die gezeigten Verhaltensweisen zu imitieren.\n\nDas Training eines LLMs passiert zweistufig. In der ersten Stufe gibt man dem Computer mehr oder weniger das ganze Internet, was er lesen soll, um daraus grobe Muster zu lernen. Der gefilterte Trainingskorpus ist hunderte Gigabyte bis einige Terabyte groß, allein der gefilterte Common-Crawl-Teil umfasste etwa 570 GB.\n\nIn der zweiten Stufe folgen Instruction-Tuning, Präferenzdaten und RLHF; Frage-Antwort-Paare sind ein Teil davon. Da gibt man dem Computer mögliche Eingaben, wie der User sie am Ende wahrscheinlich tun wird, und trainiert dann darauf, dass er die gewollten Antworten gibt. Der Computer lernt dann dabei, wie Fragen und Antworten aussehen, und generalisiert sie."
      : "In classical programming, you tell the computer exactly how to behave.\n\nIn machine learning, you give the computer many examples of how it should respond, and it learns to imitate the behaviour shown.\n\nTraining an LLM happens in two stages. In the first stage, you give the computer more or less the whole internet to read so that it learns rough patterns. The filtered training corpus is hundreds of gigabytes to a few terabytes; the filtered Common Crawl part alone was about 570 GB.\n\nIn the second stage come instruction tuning, preference data, and RLHF; question-answer pairs are part of that. There you give the computer possible inputs, the kind a user will probably provide in the end, and train it to give the desired answers. The computer then learns what questions and answers look like and generalises them.",
    teaser: DE
      ? "Beim klassischen Programmieren gibt man dem Computer genau vor, wie er sich zu verhalten hat.\n\nBei Machine Learning dagegen gibt man dem Computer viele Beispiele, wie er reagieren soll, und er lernt daraus, die gezeigten Verhaltensweisen zu imitieren.\n\nDas Training eines LLMs passiert zweistufig. In der ersten Stufe gibt man dem Computer mehr oder weniger das ganze Internet, was er lesen soll, um daraus grobe Muster zu lernen. Der gefilterte Trainingskorpus ist hunderte Gigabyte bis einige Terabyte groß, allein der gefilterte Common-Crawl-Teil umfasste etwa 570 GB.\n\nIn der zweiten Stufe folgen Instruction-Tuning, Präferenzdaten und RLHF; Frage-Antwort-Paare sind ein Teil davon. Da gibt man dem Computer mögliche Eingaben, wie der User sie am Ende wahrscheinlich tun wird, und trainiert dann darauf, dass er die gewollten Antworten gibt. Der Computer lernt dann dabei, wie Fragen und Antworten aussehen, und generalisiert sie."
      : "In classical programming, you tell the computer exactly how to behave.\n\nIn machine learning, you give the computer many examples of how it should respond, and it learns to imitate the behaviour shown.\n\nTraining an LLM happens in two stages. In the first stage, you give the computer more or less the whole internet to read so that it learns rough patterns. The filtered training corpus is hundreds of gigabytes to a few terabytes; the filtered Common Crawl part alone was about 570 GB.\n\nIn the second stage come instruction tuning, preference data, and RLHF; question-answer pairs are part of that. There you give the computer possible inputs, the kind a user will probably provide in the end, and train it to give the desired answers. The computer then learns what questions and answers look like and generalises them.",
    watch: "",
    demoState: { scene: "blocks" },
    inherit: false,
    questionGroups: [
      {
        id: "g-sources",
        title: DE ? "Quellen" : "Sources",
        sources: [
          { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Transformer-Blöcke, Residualverbindungen und Layer-Normalisierung.", en: "Transformer blocks, residual connections, and layer normalisation." } },
          { label: "Ba, Kiros & Hinton (2016), Layer Normalization", url: "https://arxiv.org/abs/1607.06450", why: { de: "LayerNorm: Mittelwert und Varianz pro Token, danach gelerntes γ/β.", en: "LayerNorm: per-token mean and variance, then learned γ/β." } },
          { label: "Xiong et al. (2020), On Layer Normalization in the Transformer Architecture", url: "https://arxiv.org/abs/2002.04745", why: { de: "Pre-LN ist stabiler als Post-LN und erlaubt Training ohne Warm-up.", en: "Pre-LN is more stable than Post-LN and allows training without warm-up." } },
          { label: "Radford et al. (2019), Language Models are Unsupervised Multitask Learners", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", why: { de: "GPT-2: LayerNorm vor den Subblöcken und final nach dem letzten Block.", en: "GPT-2: LayerNorm before the sub-blocks and a final one after the last block." } },
          { label: "He et al. (2016), Deep Residual Learning", url: "https://arxiv.org/abs/1512.03385", why: { de: "Residualverbindungen: Updates werden addiert, nicht überschrieben.", en: "Residual connections: updates are added, not overwritten." } }
        ]
      }
    ]
  };
  var bausteineFunctionStep = {
    kicker: DE ? "Architektur" : "Architecture",
    title: DE ? "Die Architektur als Funktion" : "The architecture as a function",
    body: DE
      ? "Die ganze Architektur ist eine Funktion $f_\\theta(x)$: Text rein, eine Verteilung über das nächste Token raus. Pretraining nutzt fast das ganze Internet; Fine-tuning nutzt wenige, spezifische Fragen.\n\nDie Form der Funktion bleibt beim Training gleich. Ein einfaches Beispiel ist $f_\\theta(x) = ax + b$. Hier sind $a$ und $b$ die gelernten Gewichte, also $\\theta$; das Training ändert nur diese Werte, nicht die Form der Funktion."
      : "The whole architecture is a function $f_\\theta(x)$: data in, a distribution over the next token out. Pretraining uses almost the whole internet; fine-tuning uses a few specific questions.\n\nThe form of the function stays the same during training. A simple example is $f_\\theta(x) = ax + b$. Here $a$ and $b$ are the learned weights, that is, $\\theta$; training changes only these values, not the form of the function.",
    watch: "",
    demoState: { scene: "fx" },
    deepTitle: DE ? "Was ist das Training?" : "What is training?",
    deep: DE ? "Beim Trainingsschritt werden die Vorhersage des nächsten Tokens, die die Funktion aktuell macht, und das, was sie machen sollte, verglichen und die Funktion wird ein kleines bisschen mehr in die Richtung geschoben, das zu antworten, was in den Trainingsdaten als Antwort steht." : "During a training step, the function's current prediction of the next token is compared with what it should predict, and the function is pushed a little further in the direction of answering what the training data gives as the answer.",
    boxes: [
      box("fx-1", DE ? "Mathematik" : "Mathematics", DE ? "Die Funktion" : "The function", DE ? "$f_\\theta(x)$ nimmt Daten und gibt eine Verteilung über das nächste Token aus. Die Form bleibt gleich, etwa $f_\\theta(x)=ax+b$.\n\n$\\theta$ sind die Gewichte, die während des Trainings verändert werden." : "$f_\\theta(x)$ takes data and returns a distribution over the next token. The form stays the same, for example $f_\\theta(x)=ax+b$.\n\n$\\theta$ are the weights that are changed during training."),
      box("fx-4", DE ? "Grenze" : "Limit", DE ? "Warum sind Daten so wichtig?" : "Why are data so important?", DE ? "Der nächste Token in den Daten ist das Ziel. Fehlt er, gibt es keinen Vergleich und keinen Trainingsschritt; das Modell kann nur raten." : "The next token in the data is the target. Without it there is no comparison and no training step; the model can only guess.")
    ],
    sources: [
      { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Der Transformer als Architektur.", en: "The transformer as an architecture." } },
      { label: "Brown et al. (2020), Language Models are Few-Shot Learners", url: "https://arxiv.org/abs/2005.14165", why: { de: "Großes Pretraining und Few-Shot-Verhalten.", en: "Large-scale pretraining and few-shot behaviour." } },
      { label: "Ouyang et al. (2022), Training language models to follow instructions with human feedback", url: "https://arxiv.org/abs/2203.02155", why: { de: "Fine-tuning mit menschlichem Feedback.", en: "Fine-tuning with human feedback." } }
    ]
  };

  var bausteineStep = {
    kicker: DE ? "Architektur" : "Architecture",
    title: DE ? "Bausteine eines LLM" : "Building blocks of an LLM",
    substeps: [bausteineIntro, bausteineFunctionStep]
  };

  var manifoldSteps = DE ? [
    {
      kicker: "Mannigfaltigkeiten",
      title: "Von Beziehungen zur Übersetzung",
      body: "Die Bedeutung liegt nicht in den einzelnen Punkten, sondern in der Relation der Punkte zueinander. Verschiedene Sprachen haben ungefähr die gleichen Relationen zwischen den Worten. Man nennt solche Gebilde Mannigfaltigkeit, etwas, das lokal einem klassisch-euklidischem Raum ähnelt, aber global eine ganz andere Struktur haben kann. Übersetzung ist dann das Gleiche wie Verschieben, Skalieren und Drehen dieser Mannigfaltigkeit.\n\nDiese Demo ist stark vereinfacht. Es sind in realen Modellen tausende Dimensionen und die Relationen sind nicht so einfach wie hier, aber das Prinzip ist ähnlich.\n\nWas wichtig ist sind nicht die konkreten Punkte, sondern wie die Beziehung, in der sie zueinander stehen.",
      watch: "",
      demoState: { scene: "manifold" },
      boxes: [
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
      body: "Meaning lies not in the individual points but in the relation of the points to each other. Different languages have roughly the same relations between words. Such objects are called manifolds: something that locally resembles a classical Euclidean space but can have a completely different global structure. Translation is then the same as shifting, scaling, and rotating this manifold.\n\nThis demo is strongly simplified. Real models have thousands of dimensions and the relations are not as simple as here, but the principle is similar.\n\nWhat matters is not the concrete points but how they relate to each other.",
      watch: "",
      demoState: { scene: "manifold" },
      boxes: [
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
      body: "Ein neuronales Netz mit nichtlinearen Aktivierungen kann den Raum falten: In der Demo hebt eine Schicht die Punkte in eine höhere Dimension, eine Aktivierung biegt sie, und eine flache Ebene trennt die Klassen. Das FFN wendet pro Token eine gelernte nichtlineare Transformation an; die Biegung ist eine Intuition, kein wörtliches Falten.\n\nMathematisch sind die Layer so aufgebaut:\n\n$$\\text{dense}(x) = \\underbrace{W}_{\\text{Gewichte}} \\cdot \\underbrace{x}_{\\text{Eingabe}} + \\underbrace{b}_{\\text{Bias}}$$\n\n$$\\text{FFN}(x) = \\text{dense}_2\\left(\\text{Aktivierung}(\\underbrace{\\text{dense}_1(x)}_{\\text{Erste Schicht}})\\right)$$\n\nDie Dense-Schicht dehnt auf $n$ verborgene Werte, biegt jeden mit einer Aktivierung und projiziert auf eine Höhe.",
      demoState: { scene: "mlp" },
      context: "Die Dense-Schicht hebt die Punkte in eine zusätzliche Dimension; die Aktivierung biegt sie. Erst die Nichtlinearität macht den flachen Schnitt möglich.",
      deep: "Das ist keine Animation über den Daten, sondern eine Animation der Daten selbst: Die Darstellung bleibt lokal zusammenhängend, aber Abstände und Nachbarschaften können sich verändern, während der Raum sich krümmt. Die Form hängt von Gewichten, Bias und Aktivierung ab.",
      boxes: [
        box("mlp-2", "Grenze", "Warum sieht man das im LLM nicht?", "Weil die Räume zu hochdimensional sind. Die Demo ist eine Projektion auf drei Achsen. Ein echtes Modell arbeitet mit Tausenden Dimensionen.")
      ],
      sources: [{ label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355", why: { de: "Origami in N dimensions: Grundlage für die MLP-Biege-Demo.", en: "Origami in N dimensions: background for the MLP bending demo." } }]
    }
  ] : [
    {
      kicker: "Bending space",
      title: "What are neural networks?",
      body: "A neural network with nonlinear activations can fold space: a layer lifts the points into a higher dimension, an activation bends them, and a flat plane separates the classes. The FFN applies a learned nonlinear transformation per token; the bend is an intuition, not a literal fold.\n\nMathematically, the layers are built like this:\n\n$$\\text{dense}(x) = \\underbrace{W}_{\\text{weights}} \\cdot \\underbrace{x}_{\\text{input}} + \\underbrace{b}_{\\text{bias}}$$\n\n$$\\text{FFN}(x) = \\text{dense}_2\\left(\\text{activation}(\\underbrace{\\text{dense}_1(x)}_{\\text{first layer}})\\right)$$\n\nThe dense layer expands to $n$ hidden values, bends each with an activation, and projects to one height.",
      demoState: { scene: "mlp" },
      context: "The dense layer lifts the points into an extra dimension; the activation bends them. Only the nonlinearity makes the flat cut possible.",
      deep: "This is not an animation over the data; it is an animation of the data itself. The representation stays locally connected, but distances and neighbourhoods can change while the space bends. The shape depends on weights, bias, and activation.",
      boxes: [
        box("mlp-2", "Limit", "Why don't we see this in an LLM?", "Because the spaces are too high-dimensional. The demo is a projection onto three axes. A real model works with thousands of dimensions.")
      ],
      sources: [{ label: "Keup & Helias (2022), Origami in N dimensions", url: "https://arxiv.org/abs/2203.11355", why: { de: "Origami in N dimensions: Grundlage für die MLP-Biege-Demo.", en: "Origami in N dimensions: background for the MLP bending demo." } }]
    }
  ];

  var stackSteps = [];

  var wholeSteps = [];

  var activationSteps = DE ? [
    {
      kicker: "Aktivierung",
      title: "Was sind neuronale Netze?",
      body: "Eine Nichtlinearität wird nach der Projektion auf jede Koordinate angewendet. ReLU knickt bei null; Sigmoid und tanh biegen glatt; GELU ist glatt, aber nicht monoton. Der Knick ist das, was einen geraden Schnitt durch etwas führt, das vorher untrennbar war. Ohne Knick bleibt Tiefe wirkungslos: Zwei Dense-Schichten kollabieren zu einer Matrix.",
      watch: "",
      demoState: { scene: "activation" },
      context: "Ohne Aktivierung ist ein tiefes Netz nur eine andere Matrix. Die Aktivierung nach jeder Schicht bricht die lineare Komposition.",
      deep: "ReLU ist nicht injektiv: Alle negativen Eingaben landen bei 0. Dieser Informationsverlust kann beim Entwirren helfen. Sigmoid und tanh sind für endliche Eingaben umkehrbar; GELU ist glatt, aber nicht injektiv: Verschiedene Eingaben können denselben Ausgabewert treffen. Nicht-Monotonie allein wäre dafür kein gültiger Grund. Sättigung und niedrige Präzision können auch sie zu einer Treppe machen.",
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
      body: "A nonlinearity is applied to each coordinate after the projection. ReLU kinks at zero; sigmoid and tanh bend smoothly; GELU is smooth but not monotonic. The bend is what lets a straight cut pass through something that was inseparable before. Without a bend, depth does nothing: two dense layers collapse into one matrix.",
      watch: "",
      demoState: { scene: "activation" },
      context: "Without an activation, a deep network is just another matrix. The activation after each layer breaks the linear composition.",
      deep: "ReLU is not injective: all negative inputs land at 0. That loss of information can help untangle. Sigmoid and tanh are invertible for finite inputs; GELU is smooth but not injective: different inputs can hit the same output value. Non-monotonicity alone would not be a valid reason. Saturation and low precision can turn even a smooth activation into a staircase.",
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

  var gradientSteps = DE ? [
    {
      kicker: "Loss-Landschaft",
      title: "Was sind neuronale Netze?",
      body: "Der Fehler bildet eine Landschaft. Die Gerade ist $\\hat y = w x + b$; das Modell hat nur zwei Parameter: w und b. Die Fläche zeigt den Loss über w und b; die Beispiele in der Seitenleiste sind 18 Sinus-Punkte. Das Training startet nicht von selbst: Drücke „Weiter“ oder den Startknopf. Mit Pause hältst du es an; „Weiter“ stoppt das Training. SGD, Adam und Momentum laufen nacheinander. Der Loss ist der mittlere quadratische Fehler (MSE), die Zahl, an der das Modell gemessen wird. Die Formel darunter setzt die aktuellen Werte ein.",
      watch: "Beobachte das Training. Wie verändern sich w und b, und wo im Tal endet der Punkt?",
      demoState: { scene: "gradient" },
      context: "Die Fläche ist kein Schnitt durch Hunderte Dimensionen: w und b sind die beiden echten Parameter. Jedes dieser 18 Beispiele (x, y) erzeugt einen Fehler; der Loss ist der Mittelwert dieser quadratischen Fehler. Die Formel darunter zeigt das Modell und den aktuellen Loss.",
      deep: "Der Gradient zeigt, wie der Loss auf eine Änderung von w und b reagiert. Der Optimierer geht in die Gegenrichtung. Die Lernrate bestimmt die Schrittweite. In einem LLM gibt es Milliarden solcher Parameter; die Landschaft ist nicht mehr sichtbar, die Regel bleibt dieselbe.",
      boxes: [
        box("grad-1", "Mathematik", "Das echte Modell", "Ein lineares Modell mit zwei Parametern: $\\hat y = w\\cdot x + b$. $w$ ist die Steigung, $b$ der y-Achsenabschnitt. Mehr nicht.", "\\underbrace{\\hat y}_{\\text{Ausgabe}} = \\underbrace{w x + b}_{\\text{zwei Parameter}}"),
        box("grad-2", "Mathematik", "Die Loss-Fläche (MSE)", "$L(w,b) = \\frac{1}{n}\\sum_i (w\\cdot x_i + b - y_i)^2$. Die beiden Achsen sind $w$ und $b$, nicht zwei beliebige Richtungen.", "\\underbrace{L(w,b)}_{\\text{Loss}} = \\underbrace{\\frac{1}{n}\\sum_i (w x_i+b-y_i)^2}_{\\text{mittlerer Fehler}}"),
        box("grad-3", "Technik", "Der Schritt", "$\\theta \\leftarrow \\theta - \\eta \\nabla L$. Der Gradient zeigt bergauf; der Ball geht bergab. Der Worker führt die Schritte aus und schickt die Projektion zurück.", "\\underbrace{\\theta_{t+1}}_{\\text{neu}} = \\underbrace{\\theta_t}_{\\text{alt}} - \\underbrace{\\eta}_{\\text{Lernrate}} \\underbrace{\\nabla L(\\theta_t)}_{\\text{Gradient}}"),
        box("grad-todo", "Technik", "Automatisches Ableiten", "Autograd speichert während des Forward-Pass die Operationen als Graph. Im Backward-Pass läuft der Graph rückwärts; jede Operation liefert ihre lokale Ableitung, und die Kettenregel multipliziert sie mit den bereits bekannten Gradienten. So entstehen die Gradienten für alle Parameter, ohne dass man jede Ableitung von Hand programmiert."),
        box("grad-4", "Grenze", "Warum ist das nicht das ganze LLM?", "Echte Netze haben Milliarden Dimensionen. Die zwei Richtungen sind ein lesbarer Schnitt, keine vollständige Landschaft."),
        box("grad-loss", "Optional", "Andere Loss-Funktionen", "MSE passt zu Regression. Für Klassen und Tokens nimmt man Cross-Entropy; für robuste Regression MAE oder Huber. Die Loss-Funktion sagt, was das Modell optimiert, nicht ob es die Aufgabe versteht."),
        box("grad-opt", "Technik", "SGD, Adam, Momentum", "SGD folgt dem Gradienten direkt. Momentum sammelt Geschwindigkeit und schießt über kleine Täler hinaus. Adam führt ein Gedächtnis für Gradient und Gradientenquadrat: häufig aktualisierte Parameter werden gedämpft, selten aktualisierte stärker gewichtet. Die Demo zeigt alle drei Pfade auf derselben Fläche."),
        box("grad-saddle", "Optional", "Sattelpunkte statt Minima", "In hohen Dimensionen sehen lokale Minima oft wie Sackgassen aus. Viele kritische Punkte sind aber Sattelpunkte: Viele Sattelpunkte haben eine Abstiegsrichtung; lokale Minima bleiben trotzdem möglich. Deshalb helfen Momentum und Adam, aus solchen Plateaus herauszukommen. Ein lokales Minimum ist im hochdimensionalen Raum meist nicht das eigentliche Hindernis.")
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
      body: "The error forms a landscape. The line is $\\hat y = w x + b$; the model has only two parameters: w and b. The surface shows the loss over w and b; the examples in the side panel are 18 sine points. Training does not start by itself: press “Next” or the Start button. Pause stops it; “Next” stops training. SGD, Adam, and Momentum run one after another. The loss is the mean squared error (MSE), the number by which the model is judged. The formula below substitutes the current values.",
      watch: "Watch the training. How do w and b change, and where in the valley does the point end?",
      demoState: { scene: "gradient" },
      context: "This surface is not a slice through hundreds of dimensions: w and b are the two real parameters. Each of these 18 examples (x, y) produces an error; the loss is the mean squared error. The formula below shows the model and the current loss.",
      deep: "The gradient shows how the loss reacts to a change in w and b. The optimiser moves in the opposite direction. The learning rate sets the step size. In an LLM there are billions of such parameters; the landscape is no longer visible, but the rule stays the same.",
      boxes: [
        box("grad-1", "Mathematics", "The real model", "A linear model with two parameters: $\\hat y = w\\cdot x + b$. $w$ is the slope, $b$ is the intercept. Nothing else.", "\\underbrace{\\hat y}_{\\text{output}} = \\underbrace{w x + b}_{\\text{two parameters}}"),
        box("grad-2", "Mathematics", "The loss surface (MSE)", "$L(w,b) = \\frac{1}{n}\\sum_i (w\\cdot x_i + b - y_i)^2$. The two axes are $w$ and $b$, not two arbitrary directions.", "\\underbrace{L(w,b)}_{\\text{loss}} = \\underbrace{\\frac{1}{n}\\sum_i (w x_i+b-y_i)^2}_{\\text{mean error}}"),
        box("grad-3", "Technique", "The step", "$\\theta \\leftarrow \\theta - \\eta \\nabla L$. The gradient points uphill; the ball goes downhill. The worker runs the steps and sends the projection back.", "\\underbrace{\\theta_{t+1}}_{\\text{new}} = \\underbrace{\\theta_t}_{\\text{old}} - \\underbrace{\\eta}_{\\text{learning rate}} \\underbrace{\\nabla L(\\theta_t)}_{\\text{gradient}}"),
        box("grad-todo", "Technique", "Automatic differentiation", "Autograd records the operations as a graph during the forward pass. The backward pass walks the graph in reverse; each operation supplies its local derivative, and the chain rule multiplies it by the gradients already known. That produces the gradients for all parameters without programming every derivative by hand."),
        box("grad-4", "Limit", "Why is this not the whole LLM?", "Real networks have billions of dimensions. The two directions are a readable slice, not the full landscape."),
        box("grad-loss", "Optional", "Other loss functions", "MSE fits regression. Classes and tokens use cross-entropy; robust regression uses MAE or Huber. The loss says what the model optimises, not whether it understands the task."),
        box("grad-opt", "Technique", "SGD, Adam, Momentum", "SGD follows the gradient directly. Momentum accumulates velocity and overshoots small valleys. Adam keeps a memory of the gradient and its square: frequently updated parameters are damped, rarely updated ones get more weight. The demo shows all three paths on the same surface."),
        box("grad-saddle", "Optional", "Saddle points rather than minima", "In high dimensions a local minimum often looks like a dead end. Many critical points are saddle points: Many saddle points have a descent direction; local minima are still possible. Momentum and Adam help escape such plateaus. A local minimum is usually not the main obstacle in a high-dimensional space.")
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

  var historySteps = DE ? [



    {
      kicker: "Geschichte",
      title: "Geschichte in zehn Schritten",
      body: "Von den Kerben im Wolfsknochen bis zu GPT. Rechnen als Zählen mit Steinen und Kerben: externe Tools, mit denen man Gedanken auf physische Objekte auslagern kann. Dann kommen Logik, Rechenmaschinen, das Neuron, das Perzeptron, die XOR-Krise, Backpropagation, Deep Learning, der Transformer und die LLMs. Klicke die Tabs und sieh, welche Idee jeweils weitergetragen wird.",
      watch: "",
      demoState: { scene: "history", tab: 0 },
      context: "Die Geschichte ist keine gerade Linie. Mehrere Stränge laufen parallel: formale Logik, mechanisches Rechnen, statistisches Lernen und Hardware. Der Transformer ist ein Knoten, an dem viele davon zusammenkommen.",
      boxes: [
        box("hist-2", "Geschichte", "Roter Faden", "Jede Station macht einen Schritt von gegenständlichem Zählen zu lernenden Vektoren: Regeln, Maschinen, Neuronen, Gradienten, Aufmerksamkeit.")
      ],
      sources: [
        { label: "J3n6 (2012), Wolf Bone from Dolní Věstonice", url: "https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg", why: { de: "Der früheste Gegenstand im Geschichts-Tab.", en: "The earliest object in the history tab." } },
        { label: "Wikipedia: Tally stick", url: "https://en.wikipedia.org/wiki/Tally_stick", why: { de: "Datierung und umstrittene Deutung der 55 Kerben.", en: "Dating and the disputed interpretation of the 55 notches." } },
        { label: "Minsky & Papert (1969), Perceptrons", url: "https://archive.org/details/perceptronsintro0000mins", why: { de: "Die XOR-Grenze und der erste KI-Winter.", en: "The XOR limit and the first AI winter." } },
        { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0", why: { de: "Backpropagation macht tiefe Netze trainierbar.", en: "Backpropagation makes deep networks trainable." } },
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Self-Attention und der Transformer-Block.", en: "Self-attention and the transformer block." } },
        { label: "Boole (1854), An Investigation of the Laws of Thought", url: "https://archive.org/details/investigationofl00bool", why: { de: "Logik als Algebra.", en: "Logic as algebra." } },
        { label: "Hebb (1949), The Organization of Behavior", url: "https://archive.org/details/organizationofbe0000hebb", why: { de: "Gemeinsames Feuern stärkt Verbindungen.", en: "Neurons that fire together strengthen their connection." } },
        { label: "LeCun et al. (1989), Backpropagation Applied to Handwritten Zip Code Recognition", url: "https://doi.org/10.1162/neco.1989.1.4.541", why: { de: "Backpropagation mit Faltungen für Ziffernerkennung.", en: "Backpropagation with convolutions for digit recognition." } },
        { label: "Bahdanau et al. (2014), Neural Machine Translation by Jointly Learning to Align and Translate", url: "https://arxiv.org/abs/1409.0473", why: { de: "Attention vor dem Transformer.", en: "Attention before the transformer." } },
        { label: "Radford et al. (2018), Improving Language Understanding by Generative Pre-Training", url: "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf", why: { de: "GPT-1: Pretraining plus Fine-Tuning.", en: "GPT-1: pretraining plus fine-tuning." } },
        { label: "Radford et al. (2019), GPT-2", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", why: { de: "GPT-2: 1,5 Mrd. Parameter und Prompting.", en: "GPT-2: 1.5 billion parameters and prompting." } },
        { label: "Ouyang et al. (2022), InstructGPT", url: "https://arxiv.org/abs/2203.02155", why: { de: "SFT plus RLHF; Referenz für den ChatGPT-Absatz.", en: "SFT plus RLHF; reference for the ChatGPT sentence." } }
      ]
    }
  ] : [
    {
      kicker: "History",
      title: "History in ten steps",
      body: "From the notches in a wolf bone to GPT. Arithmetic as counting with stones and notches: external tools that let us outsource thoughts onto physical objects. Then come logic, calculating machines, the neuron, the perceptron, the XOR crisis, backpropagation, deep learning, the transformer, and LLMs. Click the tabs and see which idea is carried forward.",
      watch: "",
      demoState: { scene: "history", tab: 0 },
      context: "History is not a straight line. Several strands run in parallel: formal logic, mechanical calculation, statistical learning, and hardware. The transformer is a node where many of them meet.",
      boxes: [
        box("hist-2", "History", "The thread", "Each station moves from embodied counting toward learned vectors: rules, machines, neurons, gradients, attention.")
      ],
      sources: [
        { label: "J3n6 (2012), Wolf Bone from Dolní Věstonice", url: "https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg", why: { de: "Der früheste Gegenstand im Geschichts-Tab.", en: "The earliest object in the history tab." } },
        { label: "Wikipedia: Tally stick", url: "https://en.wikipedia.org/wiki/Tally_stick", why: { de: "Datierung und umstrittene Deutung der 55 Kerben.", en: "Dating and the disputed interpretation of the 55 notches." } },
        { label: "Minsky & Papert (1969), Perceptrons", url: "https://archive.org/details/perceptronsintro0000mins", why: { de: "Die XOR-Grenze und der erste KI-Winter.", en: "The XOR limit and the first AI winter." } },
        { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0", why: { de: "Backpropagation macht tiefe Netze trainierbar.", en: "Backpropagation makes deep networks trainable." } },
        { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Self-Attention und der Transformer-Block.", en: "Self-attention and the transformer block." } },
        { label: "Boole (1854), An Investigation of the Laws of Thought", url: "https://archive.org/details/investigationofl00bool", why: { de: "Logik als Algebra.", en: "Logic as algebra." } },
        { label: "Hebb (1949), The Organization of Behavior", url: "https://archive.org/details/organizationofbe0000hebb", why: { de: "Gemeinsames Feuern stärkt Verbindungen.", en: "Neurons that fire together strengthen their connection." } },
        { label: "LeCun et al. (1989), Backpropagation Applied to Handwritten Zip Code Recognition", url: "https://doi.org/10.1162/neco.1989.1.4.541", why: { de: "Backpropagation mit Faltungen für Ziffernerkennung.", en: "Backpropagation with convolutions for digit recognition." } },
        { label: "Bahdanau et al. (2014), Neural Machine Translation by Jointly Learning to Align and Translate", url: "https://arxiv.org/abs/1409.0473", why: { de: "Attention vor dem Transformer.", en: "Attention before the transformer." } },
        { label: "Radford et al. (2018), Improving Language Understanding by Generative Pre-Training", url: "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf", why: { de: "GPT-1: Pretraining plus Fine-Tuning.", en: "GPT-1: pretraining plus fine-tuning." } },
        { label: "Radford et al. (2019), GPT-2", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", why: { de: "GPT-2: 1,5 Mrd. Parameter und Prompting.", en: "GPT-2: 1.5 billion parameters and prompting." } },
        { label: "Ouyang et al. (2022), InstructGPT", url: "https://arxiv.org/abs/2203.02155", why: { de: "SFT plus RLHF; Referenz für den ChatGPT-Absatz.", en: "SFT plus RLHF; reference for the ChatGPT sentence." } }
      ]
    }
  ];

  var aiConsciousnessIntro = {
    kicker: DE ? "Philosophie" : "Philosophy",
    title: DE ? "Hat eine KI Bewusstsein?" : "Does an AI have consciousness?",
    body: DE ? "Die Frage klingt nach Ja oder Nein, aber schon der Zugang ist unklar: Wir prüfen Aufgaben, Verhalten und Selbstberichte; ob dahinter Erleben steht, sehen wir von außen nicht. Qualia (Singular Quale) sind die gefühlten Eigenschaften einer Erfahrung: die Röte des Roten, der Schmerz des Schmerzes, der Klang einer Geige. Wellenlänge, Zapfen und Neuronen lassen sich messen; wie sich das Rot anfühlt, bleibt von außen unsichtbar. Diese Erklärungslücke ist das harte Problem des Bewusstseins (Chalmers, 1995). Mary's Room fragt, ob jemand mit allen physikalischen Fakten über Farben beim ersten Sehen von Rot noch etwas lernt. Deshalb liegt es nahe, nach der Art des Bewusstseins zu fragen, statt nur nach Ja oder Nein." : "The question sounds like yes or no, but access is already unclear: we test tasks, behaviour, and self-reports; whether experience lies behind them is not visible from outside. Qualia (singular quale) are the felt qualities of an experience: the redness of red, the painfulness of pain, the sound of a violin. Wavelength, cones, and neurons can be measured; what the red feels like stays invisible from outside. This explanatory gap is the hard problem of consciousness (Chalmers, 1995). Mary's room asks whether someone who knows every physical fact about colour still learns something when she first sees red. That is why it makes sense to ask what kind of consciousness is present, rather than only whether it is.",
    watch: "",
    demoState: { scene: "mindintro" },
    inherit: false,
    context: DE ? "Zugang zu Information, Bericht und Kontrolle lässt sich funktional prüfen. Phänomenales Erleben, also wie es sich anfühlt, ist von außen nicht direkt messbar. Genau diese Lücke macht die Frage so schwer." : "Access to information, report, and control can be tested functionally. Phenomenal experience, what it feels like, cannot be measured directly from outside. That gap is what makes the question hard.",
    deep: DE ? "Die Typologie unterscheidet Zugangsbewusstsein und phänomenales Bewusstsein (Block, 1995). Sie fragt nach Typen von Bewusstsein, nicht nur nach einer Ja/Nein-Antwort. Der J-Space (Gurnee et al., 2026) zeigt funktionale Eigenschaften von Zugang und Bericht; über Qualia sagt die Arbeit nichts. Das Other-Minds-Problem und die Rolle von Zeugnis bleiben bestehen." : "The typology distinguishes access consciousness from phenomenal consciousness (Block, 1995). It asks about types of consciousness, not just a yes/no answer. The J-space (Gurnee et al., 2026) shows functional properties of access and report; it says nothing about qualia. The other-minds problem and the role of testimony remain.",
    boxes: [
      box("mi-1", DE ? "Begriff" : "Concept", DE ? "Zugang vs. Erleben" : "Access vs. experience", DE ? "Zugang heißt: Information ist für Bericht, Kontrolle und Schlussfolgerungen verfügbar. Erleben heißt: Es fühlt sich von innen wie etwas an. Funktionale Tests erreichen den ersten Teil, nicht den zweiten." : "Access means information is available for report, control, and inference. Experience means it feels like something from the inside. Functional tests reach the first part, not the second."),
      box("mi-2", DE ? "Grenze" : "Limit", DE ? "Das Other-Minds-Problem" : "The other-minds problem", DE ? "Wir haben keinen direkten Zugang zu fremdem Erleben. Selbst ein perfekter Verhaltensvergleich zeigt nur, dass ein System wie ein bewusstes System reagiert. Ob es etwas erlebt, bleibt eine Inferenz." : "We have no direct access to another's experience. Even a perfect behavioural comparison only shows that a system responds like a conscious system. Whether it experiences anything remains an inference."),
      box("mi-3", DE ? "Möglichkeiten" : "Possibilities", DE ? "Nicht nur Ja oder Nein" : "Not only yes or no", DE ? "Eine Typologie unterscheidet unter anderem null, simulierte, funktionale, geborgte, epiphänomenale und fremde Phänomenalität. Diese Typen werden mit Tulvings anoetisch-noetisch-autonoetischen Stufen gekreuzt." : "A typology distinguishes, among others, null, simulated, functional, borrowed, epiphenomenal, and alien phenomenality. These types are crossed with Tulving's anoetic-noetic-autonoetic levels.")
    ],
    sources: [
      { label: "Nagel (1974), What Is It Like to Be a Bat?", url: "https://doi.org/10.2307/2183914", why: { de: "Subjektive Erfahrung als offene Frage.", en: "Subjective experience as an open question." } },
      { label: "Chalmers (1995), Facing Up to the Problem of Consciousness", url: "https://consc.net/papers/facing.pdf", why: { de: "Das harte Problem: Warum fühlt sich Information an?", en: "The hard problem: why does information feel like anything?" } },
      { label: "Jackson (1982), Epiphenomenal Qualia", url: "https://doi.org/10.2307/2960077", why: { de: "Mary's Room: Wissen über Fakten versus Erleben.", en: "Mary's room: knowledge of facts versus experience." } },
      { label: "Southgate (2026, AI-generated), AI Consciousness", url: "https://unfinishablemap.org/topics/ai-consciousness/", why: { de: "Typologie und offene Frage der KI-Bewusstseinsdebatte.", en: "Typology and open question in the AI consciousness debate." } },
      { label: "Southgate (2026, AI-generated), Access Consciousness", url: "https://unfinishablemap.org/concepts/access-consciousness/", why: { de: "Zugangsbewusstsein, phänomenales Bewusstsein und J-Space.", en: "Access consciousness, phenomenal consciousness, and J-space." } },
      { label: "Southgate (2026, AI-generated), The Voids Between Minds", url: "https://unfinishablemap.org/voids/other-minds-void/", why: { de: "Other-Minds-Problem und die Grenzen von Zeugnis.", en: "The other-minds problem and the limits of testimony." } },
      { label: "Southgate (2026, AI-generated), Consciousness and Testimony", url: "https://unfinishablemap.org/topics/consciousness-and-testimony/", why: { de: "Warum Berichte über Erleben zirkulär bleiben können.", en: "Why reports about experience can remain circular." } },
      { label: "Gurnee et al. (2026), Verbalizable Representations Form a Global Workspace in Language Models", url: "https://arxiv.org/abs/2607.15495", why: { de: "J-Space: funktionale Merkmale von Zugang, keine Aussage über Qualia.", en: "J-space: functional features of access, no claim about qualia." } },
      { label: "Block (1995), On a Confusion about a Function of Consciousness", url: "https://doi.org/10.1017/S0140525X00038188", why: { de: "Zugang versus phänomenales Bewusstsein.", en: "Access versus phenomenal consciousness." } }
    ]
  };

  var philosophySteps = DE ? [
    {
      kicker: "Philosophie",
      title: "Das Chinesische Zimmer",
      body: "Das Chinesische Zimmer ist Searles Gedankenexperiment: Du bekommst chinesische Zeichen, ein Regelbuch und gibst passende Zeichen zurück. Von außen wirkt das wie Verstehen; innen bleiben es Regeln. Searle (1980) unterscheidet Symbolmanipulation von Bedeutung. Ob das ganze System versteht, ist umstritten.",
      watch: "",
      demoState: { scene: "chineseroom" },
      context: "",
      deep: "",
      boxes: [],
      sources: [
        { label: "Searle (1980), Minds, Brains, and Programs", url: "https://doi.org/10.1017/S0140525X00005756", why: { de: "Das Chinesische Zimmer: Symbolmanipulation ohne Bedeutung.", en: "The Chinese room: symbol manipulation without meaning." } }
      ]
    }
  ] : [
    {
      kicker: "Philosophy",
      title: "The Chinese room",
      body: "The Chinese room is Searle's thought experiment: you receive Chinese characters, a rule book, and return matching characters. From outside it looks like understanding; inside it remains rule-following. Searle (1980) distinguishes symbol manipulation from meaning. Whether the whole system understands is disputed.",
      watch: "",
      demoState: { scene: "chineseroom" },
      context: "",
      deep: "",
      boxes: [],
      sources: [
        { label: "Searle (1980), Minds, Brains, and Programs", url: "https://doi.org/10.1017/S0140525X00005756", why: { de: "Das Chinesische Zimmer: Symbolmanipulation ohne Bedeutung.", en: "The Chinese room: symbol manipulation without meaning." } }
      ]
    }
  ];

  var unembedSteps = DE ? [
    {
      kicker: "Unembedding",
      title: "Ähnliche Worte finden",
      body: "Wörter sind Richtungen, keine Punkte. Auf der Kugel siehst du schematisch dargestellte Wortrichtungen als Punkte; der grüne Vektor ist dein Wort. Der Winkel zwischen zwei Richtungen ist die Ähnlichkeit. Für die reine Richtungsähnlichkeit (Cosinus) ändert die Länge nichts: Ein kurzer und ein langer grüner Vektor in dieselbe Richtung haben 0°, ein Punkt daneben hat einen größeren Winkel. Im Logit $w_i \\cdot \\mathbf{x}_{\\text{letztes Token}}$ skaliert die Länge den Wert jedoch. $W_U$ hat eine Zeile $w_i \\in \\mathbb{R}^{768}$ pro Token; der letzte Vektor des letzten Tokens in der letzten Schicht ist der Zustand des aktuellen Tokens. Wähle ein Wort und sieh die nächsten Richtungen. Die Winkel sind Ähnlichkeiten, keine Wahrscheinlichkeiten.\n\n$W_U$ ist gelernt. Wörter in ähnlichen Kontexten bekommen ähnliche Richtungen. Die Kugel ist eine schematische 3D-Projektion, keine Messung von GPT-2.",
      watch: "Wähle ein Wort. Ziehe die Kugel, um sie zu drehen, oder stoppe die Drehung mit „Drehung stoppen“. Die Winkel stehen an den Punkten.",
      demoState: { scene: "unembed", mode: "directions" },
      context: "Die Kugel ist eine schematische 3D-Projektion von Wortrichtungen. Die Winkel sind Kosinus-Ähnlichkeiten; erst Softmax macht daraus eine Verteilung. Ähnliche Wörter liegen in ähnlichen Richtungen, weil das Training sie in ähnlichen Kontexten sieht.",
      deep: "$W_U$ ist gelernt. Wörter in ähnlichen Kontexten bekommen ähnliche Richtungen; das Skalarprodukt misst die Nähe. Die Länge eines Vektors ändert den Winkel nicht; deshalb ist der Winkel oft das robustere Signal. Die Kugel ist eine Projektion, keine vollständige Geometrie.",
      boxes: [
        box("un-1", "Mathematik", "Die Matrix $W_U$", "Jede Zeile von $W_U$ ist die gelernte Richtung eines Tokens. Das Skalarprodukt mit dem letzten Vektor des letzten Tokens in der letzten Schicht ergibt einen Logit. Ähnliche Richtungen ergeben hohe Werte; Softmax macht daraus eine Verteilung.", "\\underbrace{z_i}_{\\text{Logit}} = \\underbrace{w_i \\cdot \\mathbf{x}_{\\text{letztes Token}}}_{\\text{Richtung mal Vektor}}"),
        box("un-3", "Grenze", "Was ist das nicht?", "Kein Wörterbuch und keine Definition. Die Kugel zeigt gelernte Nachbarschaften, keine Bedeutung an sich. Ähnliche Wörter können auch Gegensätze sein, wenn sie in ähnlichen Kontexten auftreten; die Winkel sind keine Wahrscheinlichkeiten."),
        box("un-4", "Unembedding", "Von $n$ Vektoren zu Prozenten", "Jede Zeile von $W_U$ ist ein gelernter Token-Vektor. $z = W_U \\mathbf{x}_{\\text{letztes Token}}$ rechnet ein Skalarprodukt pro Token, also $n$ Werte. Der Winkel steckt im Skalarprodukt; Softmax macht aus den $n$ Logits eine Verteilung.", "\\underbrace{\\underbrace{z_i}_{\\text{Logit}} = \\underbrace{w_i \\cdot \\mathbf{x}_{\\text{letztes Token}}}_{\\text{Dot-Produkt}} = \\underbrace{\\lVert w_i\\rVert\\,\\lVert \\mathbf{x}_{\\text{letztes Token}}\\rVert\\cos\\theta_i}_{\\text{Winkel}} \\qquad \\underbrace{p_i}_{\\text{Prozent}} = \\underbrace{\\operatorname{softmax}(z)_i}_{\\text{Verteilung}}}_{\\text{von der Richtung zur Wahrscheinlichkeit}}"),
        box("un-5", "Begriff", "Was ist der letzte Vektor?", "Der letzte Vektor des letzten Tokens in der letzten Schicht kommt aus den Transformer-Blöcken. In ihn haben Attention und FFN den gesamten Kontext über viele Schichten und Heads eingemischt. Aus diesem Vektor sagt $W_U$ das nächste Token voraus.")
      ],
      sources: [
        { label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781", why: { de: "Gelernte Wortvektoren und Ähnlichkeit über Richtungen.", en: "Learned word vectors and similarity through directions." } },
        { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/", why: { de: "Globale Kookkurrenz als Wortvektoren.", en: "Global co-occurrence as word vectors." } },
        { label: "Aggarwal et al. (2001), On the Surprising Behavior of Distance Metrics in High Dimensional Space", url: "https://doi.org/10.1007/3-540-44503-X_27", why: { de: "Distanzen verlieren in hohen Dimensionen an Kontrast; das motiviert Kosinus-Ähnlichkeit, die aber ebenfalls nicht universell robust ist.", en: "Distances lose contrast in high dimensions; this motivates cosine similarity, which is not universally robust either." } }
      ]
    }
  ] : [
    {
      kicker: "Unembedding",
      title: "Finding similar words",
      body: "Words are directions, not points. On the sphere you see schematic word directions as points; the green vector is your word. The angle between two directions is the similarity. For pure directional similarity (cosine), length does not change it: a short and a long green vector in the same direction have 0°, while a point off the line has a larger angle. In the logit $w_i \\cdot \\mathbf{x}_{\\text{last token}}$, however, length scales the value. $W_U$ has one row $w_i \\in \\mathbb{R}^{768}$ per token; the final vector of the last token in the last layer is the state of the current token. Choose a word and see the nearest directions. The angles are similarities, not probabilities.\n\n$W_U$ is learned. Words that occur in similar contexts get similar directions. The sphere is a schematic 3D projection, not a measurement of GPT-2.",
      watch: "Choose a word. Drag the sphere to rotate it. The angles are shown on the points.",
      demoState: { scene: "unembed", mode: "directions" },
      context: "The sphere is a schematic 3D projection of word directions. The angles are cosine similarities; only softmax turns them into a distribution. Similar words lie in similar directions because training sees them in similar contexts.",
      deep: "$W_U$ is learned. Words in similar contexts get similar directions; the dot product measures closeness. A vector's length does not change the angle; that is why the angle is often the more robust signal. The sphere is a projection, not the full geometry.",
      boxes: [
        box("un-1", "Mathematics", "The matrix $W_U$", "Every row of $W_U$ is the learned direction of a token. The dot product with the final vector of the last token in the last layer gives a logit. Similar directions give high values; softmax turns them into a distribution.", "\\underbrace{z_i}_{\\text{logit}} = \\underbrace{w_i \\cdot \\mathbf{x}_{\\text{last token}}}_{\\text{direction times vector}}"),
        box("un-3", "Limit", "What is this not?", "Not a dictionary and not a definition. The sphere shows learned neighbourhoods, not meaning itself. Similar words can even be opposites if they occur in similar contexts; the angles are not probabilities."),
        box("un-4", "Unembedding", "From $n$ vectors to percentages", "Every row of $W_U$ is a learned token vector. $z = W_U \\mathbf{x}_{\\text{last token}}$ computes one dot product per token, so $n$ values. The angle sits inside the dot product; softmax turns the $n$ logits into a distribution.", "\\underbrace{\\underbrace{z_i}_{\\text{logit}} = \\underbrace{w_i \\cdot \\mathbf{x}_{\\text{last token}}}_{\\text{dot product}} = \\underbrace{\\lVert w_i\\rVert\\,\\lVert \\mathbf{x}_{\\text{last token}}\\rVert\\cos\\theta_i}_{\\text{angle}} \\qquad \\underbrace{p_i}_{\\text{percent}} = \\underbrace{\\operatorname{softmax}(z)_i}_{\\text{distribution}}}_{\\text{from direction to probability}}"),
        box("un-5", "Term", "What is the final vector?", "The final vector of the last token in the last layer comes from the transformer blocks. Attention and the FFN have mixed the entire context into it through many layers and heads. From this vector, $W_U$ predicts the next token.")
      ],
      sources: [
        { label: "Mikolov et al. (2013), word2vec", url: "https://arxiv.org/abs/1301.3781", why: { de: "Gelernte Wortvektoren und Ähnlichkeit über Richtungen.", en: "Learned word vectors and similarity through directions." } },
        { label: "Pennington et al. (2014), GloVe", url: "https://aclanthology.org/D14-1162/", why: { de: "Globale Kookkurrenz als Wortvektoren.", en: "Global co-occurrence as word vectors." } },
        { label: "Aggarwal et al. (2001), On the Surprising Behavior of Distance Metrics in High Dimensional Space", url: "https://doi.org/10.1007/3-540-44503-X_27", why: { de: "Distanzen verlieren in hohen Dimensionen an Kontrast; das motiviert Kosinus-Ähnlichkeit, die aber ebenfalls nicht universell robust ist.", en: "Distances lose contrast in high dimensions; this motivates cosine similarity, which is not universally robust either." } }
      ]
    }
  ];

  var unembedScaleStep = Object.assign({}, unembedSteps[0], {
    kicker: DE ? "Skaleninvarianz" : "Scale invariance",
    title: DE ? "Länge vs. Richtung" : "Length vs. direction",
    body: DE
      ? "A und B zeigen in verschiedene Richtungen. B startet sehr kurz und wird länger. Der Winkel zwischen A und B hängt nur von den Richtungen ab: Drücke Weiter oder ziehe die Länge von B, und der Winkel bleibt gleich. Die Länge ändert die Kosinus-Ähnlichkeit nicht; im Logit kann sie den Wert skalieren."
      : "A and B point in different directions. B starts very short and grows longer. The angle between A and B depends only on the directions: press Next or drag the length of B and the angle stays the same. Length does not change cosine similarity; in the logit it can scale the value.",
    watch: DE ? "Drücke Weiter oder ziehe die Länge von B. Was bleibt gleich, was ändert sich?" : "Press Next or drag the length of B. What stays the same, what changes?",
    context: DE ? "A und B zeigen in verschiedene Richtungen. Der Winkel zwischen ihnen bleibt gleich, wenn du B länger oder kürzer machst. Die Länge fällt aus dem Cosinus heraus." : "A and B point in different directions. The angle between them stays the same when you make B longer or shorter. Length drops out of the cosine.",
    deep: DE ? "Der Cosinus ist $\\cos\\theta = \\frac{u\\cdot v}{\\lVert u\\rVert\\,\\lVert v\\rVert}$. Skalierst du einen Vektor mit einer positiven Zahl, kürzt sich die Länge heraus; nur die Richtungen bleiben. Ein großer und ein kleiner Vektor in derselben Richtung haben 0°, ein Vektor in einer anderen Richtung hat einen größeren Winkel." : "The cosine is $\\cos\\theta = \\frac{u\\cdot v}{\\lVert u\\rVert\\,\\lVert v\\rVert}$. Scaling a vector by a positive number cancels its length; only the directions remain. A large and a small vector in the same direction have 0°, a vector in a different direction has a larger angle.",
    demoState: { scene: "unembed", mode: "scale" },
    boxes: unembedSteps[0].boxes.map(function (b) { return Object.assign({}, b, { id: b.id + "-scale" }); })
  });

  var unembedUnembedStep = Object.assign({}, unembedSteps[0], {
    kicker: DE ? "Unembedding" : "Unembedding",
    title: DE ? "Vom Vektor zur Verteilung" : "From vector to distribution",
    body: DE
      ? "Der letzte Vektor des letzten Tokens in der letzten Schicht ist der Zustand des aktuellen Tokens nach allen Transformer-Blöcken. $W_U$ hat eine gelernte Zeile $w_i$ pro Vokabular-Token, also $n$ Vektoren. $z = W_U \\mathbf{x}_{\\text{letztes Token}}$ rechnet $n$ Skalarprodukte, eines pro Token; jedes ist $w_i \\cdot \\mathbf{x}_{\\text{letztes Token}} = \\lVert w_i\\rVert\\,\\lVert \\mathbf{x}_{\\text{letztes Token}}\\rVert\\cos\\theta_i$. Der Winkel misst die Ähnlichkeit, die Länge skaliert den Logit. Softmax macht aus den $n$ Logits Prozente. Klicke einen Vorschlag oder nutze „Nächster Winkel“."
      : "The final vector of the last token in the last layer is the state of the current token after all transformer blocks. $W_U$ has one learned row $w_i$ per vocabulary token, so $n$ vectors. $z = W_U \\mathbf{x}_{\\text{last token}}$ computes $n$ dot products, one per token; each is $w_i \\cdot \\mathbf{x}_{\\text{last token}} = \\lVert w_i\\rVert\\,\\lVert \\mathbf{x}_{\\text{last token}}\\rVert\\cos\\theta_i$. The angle measures similarity; the length scales the logit. Softmax turns the $n$ logits into percentages. Click a suggestion or use “Next angle”.",
    watch: DE ? "Klicke die Vorschläge. Welcher Winkel wird zur höchsten Wahrscheinlichkeit?" : "Click the suggestions. Which angle becomes the highest probability?",
    context: DE ? "Der Logit ist das Skalarprodukt aus dem letzten Vektor des letzten Tokens in der letzten Schicht und einer Token-Zeile; der Winkel bestimmt die Ähnlichkeit, die Länge kann den Wert skalieren. Softmax normalisiert alle $n$ Logits zu Prozenten." : "The logit is the dot product of the final vector of the last token in the last layer and a token row; the angle determines similarity, and the length can scale the value. Softmax normalises all $n$ logits into percentages.",
    deep: DE ? "Ja: $W_U \\mathbf{x}_{\\text{letztes Token}}$ ist eine Matrix-Vektor-Multiplikation. Jede der $n$ Zeilen wird mit diesem Vektor multipliziert und summiert. Bei ähnlichen Längen entspricht die Reihenfolge der Logits dem Winkel; unterschiedliche Längen können die Reihenfolge verschieben. Softmax macht daraus eine Verteilung." : "Yes: $W_U \\mathbf{x}_{\\text{last token}}$ is a matrix-vector multiplication. Each of the $n$ rows is multiplied by this vector and summed. When the lengths are similar, the order of the logits follows the angle; different lengths can shift the order. Softmax turns it into a distribution.",
    demoState: { scene: "unembed", mode: "unembed" },
    boxes: unembedSteps[0].boxes.map(function (b) { return Object.assign({}, b, { id: b.id + "-unembed" }); })
  });

  var unembedStep = {
    title: DE ? "Ähnliche Worte finden" : "Finding similar words",
    kicker: "Unembedding",
    substeps: [unembedSteps[0], unembedScaleStep, unembedUnembedStep]
  };

  var highdimSteps = DE ? [
    {
      kicker: "Der Raum",
      title: "Tausende Dimensionen",
      body: "Drei Dimensionen sind visuell vorstellbar, aber reichen nicht.\n\nFür das Verstehen echter Sprache braucht man mehr Richtungen. Deshalb skaliert man hoch: Ein echtes Embedding hat Tausende Dimensionen; GPT-2 small nutzt 768, große Modelle noch mehr. Die Tabelle zeigt einen Ausschnitt aus einem hypothetischen 4096-dimensionalen Modell.\n\nVon diesen 4096 Spalten sind 16 sichtbar. Jede Zeile ist die Position eines Tokens, jede Spalte eine Dimension. Du kannst dir das nicht mehr vorstellen, aber die Rechnung bleibt dieselbe: Differenz, Winkel und Matrixmultiplikation funktionieren koordinatenweise weiter.",
      watch: "",
      demoState: { scene: "highdim" },
      boxes: [
      ],
      sources: sources
    }
  ] : [
    {
      kicker: "The space",
      title: "Thousands of dimensions",
      body: "Three dimensions are visually imaginable, but not enough.\n\nUnderstanding real language needs more directions. So the space is scaled up: a real embedding has thousands of dimensions; GPT-2 small uses 768, larger models even more. The table shows a slice of a hypothetical 4096-dimensional model.\n\n16 of these 4096 columns are visible. Each row is a token position, each column a dimension. You can no longer picture this, but the arithmetic stays the same: difference, angle, and matrix multiplication work coordinate by coordinate.",
      watch: "",
      demoState: { scene: "highdim" },
      boxes: [
      ],
      sources: sources
    }
  ];

  var neuralLargeSteps = DE ? [
    {
      kicker: "Großes Netz",
      title: "Was sind neuronale Netze?",
      body: "Das Netz hat 4 Layer: drei versteckte Layer mit je 32 Neuronen und ein Ausgabelayer mit 1 Neuron, weil die Funktion einen Ausgabewert hat. Mit einem Eingabewert ergibt das 1 → 32 → 32 → 32 → 1, Dense plus ReLU. Es hat viele Parameter und Richtungen, mehr als wir zeichnen können. Das Prinzip ist: Parameter, Loss, Gradient. Beobachte, wie die grüne Kurve den Sinus biegt. Ziehe Punkte, pausiere oder starte neu. Die Matrizen kannst du live öffnen.",
      watch: "Starte das Training. Wann biegt die Kurve den Sinus? Was passiert außerhalb der Trainingsdaten?",
      demoState: { scene: "model", phase: "net" },
      context: "Der Loss wird nur auf den Trainingspunkten berechnet. Außerhalb gibt es keine Daten; die Kurve ist eine Extrapolation.",
      deep: "Das Netz hat drei versteckte Schichten mit je 32 ReLU-Neuronen. Jede Schicht hat eigene Gewichte. Der Loss ist der mittlere quadratische Fehler. Ein kleiner Trainings-Loss garantiert keine gute Extrapolation.",
      boxes: [
        box("mod-width", "Technik", "Warum viele Schichten?", "Mehr Neuronen und Schichten geben dem Netz mehr Richtungen und Knicke. Es kann den Sinus biegen, braucht aber Daten und Training."),
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
      body: "The network has 4 layers: three hidden layers with 32 neurons each and an output layer with 1 neuron, because the function has one output value. With one input value that gives 1 → 32 → 32 → 32 → 1, dense with ReLU. It has many parameters and directions, more than we can draw. The principle is: parameters, loss, gradient. Watch the green curve bend the sine. Drag points, pause, or restart. You can open the matrices live.",
      watch: "Start training. When does the curve bend the sine? What happens outside the training data?",
      demoState: { scene: "model", phase: "net" },
      context: "The loss is computed only on the training points. Outside there is no data; the curve is an extrapolation.",
      deep: "The network has three hidden layers with 32 ReLU neurons each. Every layer has its own weights. The loss is mean squared error. A small training loss does not guarantee good extrapolation.",
      boxes: [
        box("mod-width", "Technique", "Why many layers?", "More neurons and layers give the network more directions and bends. It can bend the sine, but it needs data and training."),
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
      body: "Am 1. Januar 1801 entdeckte Giuseppe Piazzi Ceres, den größten Körper im Asteroidengürtel und heute als Zwergplanet klassifiziert. Nach 41 Tagen Beobachtung verlor er ihn hinter der Sonne. Carl Friedrich Gauß behandelte die verrauschten Positionen als ein Ganzes und nahm an, dass die wahre Bahn in der Mitte der Fehler liegt. Seine Methode der kleinsten Quadrate minimierte die Summe der quadrierten Abstände zwischen Beobachtungen und Bahn und sagte voraus, wo Ceres wieder auftauchen würde (Stigler, 1981). Drehe am Teleskop: Je besser die Messung, desto enger die Glockenkurve. Der Ausgleich lässt keine einzelne Messung allein entscheiden; er wählt die Kurve, die allen zugleich am nächsten bleibt. MSE ist eine Loss-Funktion für Regression; LLMs trainieren mit Cross-Entropy.",
      watch: "Bewege den Teleskop-Regler. Wie verändert sich die Wolke, und wie eng wird die Glockenkurve?",
      demoState: { scene: "gauss" },
      context: "Die Beobachtungen sind synthetisch, nicht Piazzis originale Messungen. Der Plot zeigt das Prinzip: eine wahre Bahn (grün), eine Wolke verrauschter Messungen (blau) und die Glockenkurve ihrer Fehler. Die Methode der kleinsten Quadrate sucht die Bahn, die allen Beobachtungen zugleich am nächsten liegt.",
      deep: "Gauß veröffentlichte die Methode 1809. Sie wählt die Parameter, die die Summe der quadrierten Abstände minimieren. Ein einzelner Ausreißer zählt quadriert, aber viele kleine Fehler mitteln sich. Dieselbe Arithmetik erscheint in jedem trainierten Netz: Ein Modell ist eine Kurve, die Daten sind verrauschte Punkte, und das Training wählt die Gewichte, deren Vorhersagen im Durchschnitt am nächsten an den Beobachtungen liegen.",
      boxes: [
        box("gauss-1", "Geschichte", "Ceres und Piazzi", "Piazzi entdeckte Ceres am 1. Januar 1801 und verlor sie nach 41 Tagen hinter der Sonne. Gauß sagte mit der Methode der kleinsten Quadrate voraus, wo sie wieder auftauchen würde (Stigler, 1981)."),
        box("gauss-2", "Mathematik", "Was macht die Methode?", "Sie minimiert die Summe der quadrierten Abstände zwischen Beobachtungen und Modell. MSE ist der gemittelte quadratische Fehler. Große Abweichungen zählen quadratisch, kleine kaum.", "\\underbrace{\\min_{\\theta}\\underbrace{\\sum_i (y_i - f_\\theta(x_i))^2}_{\\text{quadratische Fehler}}}_{\\text{kleinste Summe}}"),
        box("gauss-3", "Daten", "Warum im Schnitt richtig?", "Einzelne Messungen können falsch sein: Menschen irren sich, Messungen haben Fehler, Menschen lügen. Über viele Messungen mitteln sich zufällige Fehler; die Anpassung landet in der Mitte. Systematische Fehler bleiben, deshalb ist Kuration wichtig."),
        box("gauss-4", "Geschichte", "Die Rückkehr in die KI", "Die Methode kam aus der Astronomie und fand in das maschinelle Lernen, weil dasselbe Problem wiederkehrte: eine einfache Kurve durch unvollkommene Messungen legen. MSE ist eine Loss-Funktion für Regression; LLMs trainieren mit Cross-Entropy.")
      ],
      sources: [
        { label: "Stigler (1981), Gauss and the Invention of Least Squares", url: "https://doi.org/10.1214/aos/1176345451", why: { de: "Gauß, Ceres und die Methode der kleinsten Quadrate.", en: "Gauss, Ceres, and the method of least squares." } },
        { label: "Ceres, Dawn (NASA/JPL-Caltech/UCLA/MPS/DLR/IDA), via Wikimedia Commons", url: "https://commons.wikimedia.org/wiki/File:Ceres_-_RC3_-_Haulani_Crater_(22381131691)_(cropped).jpg", why: { de: "Ceres-Bild: NASA-Material gemeinfrei; Bildbearbeitung Justin Cowart, CC BY 2.0.", en: "Ceres image: NASA material public domain; processing by Justin Cowart, CC BY 2.0." } },
        { label: "The Flammarion Engraving (1888), via Wikimedia Commons", url: "https://commons.wikimedia.org/wiki/File:Flammarion_Woodcut_1888_Color_2.jpg", why: { de: "Kolorierter Flammarion-Holzschnitt, Public Domain.", en: "Coloured Flammarion engraving, public domain." } }
      ]
    }
  ] : [
    {
      kicker: "Ceres",
      title: "Gauss, Ceres, and the data",
      body: "On 1 January 1801 Giuseppe Piazzi discovered Ceres, the largest object in the asteroid belt and today classified as a dwarf planet. After 41 days of observation he lost it behind the Sun. Carl Friedrich Gauss treated the noisy positions as a whole and assumed that the true orbit lies in the middle of the errors. His method of least squares minimised the sum of squared distances between observations and orbit and predicted where Ceres would reappear (Stigler, 1981). Turn the telescope: the better the measurement, the narrower the bell curve. The fit lets no single measurement decide alone; it chooses the curve that stays closest to all of them at once. MSE is a loss function for regression; LLMs train with cross-entropy.",
      watch: "Move the telescope slider. How does the cloud change, and how narrow does the bell curve become?",
      demoState: { scene: "gauss" },
      context: "The observations are synthetic, not Piazzi's original measurements. The plot shows the principle: a true orbit (green), a cloud of noisy measurements (blue), and the bell curve of their errors. The method of least squares looks for the orbit that stays closest to all observations at once.",
      deep: "Gauss published the method in 1809. It chooses the parameters that minimise the sum of squared distances. A single outlier counts squared, but many small errors average out. The same arithmetic appears in every trained network: a model is a curve, the data are noisy points, and training chooses the weights whose predictions are closest to the observations on average.",
      boxes: [
        box("gauss-1", "History", "Ceres and Piazzi", "Piazzi discovered Ceres on 1 January 1801 and lost it behind the Sun after 41 days. Gauss predicted with least squares where it would reappear (Stigler, 1981)."),
        box("gauss-2", "Mathematics", "What does the method do?", "It minimises the sum of squared distances between observations and model. MSE is the averaged squared error. Large deviations count squared, small ones barely.", "\\underbrace{\\min_{\\theta}\\underbrace{\\sum_i (y_i - f_\\theta(x_i))^2}_{\\text{squared errors}}}_{\\text{smallest sum}}"),
        box("gauss-3", "Data", "Why right on average?", "Individual measurements can be wrong: people make mistakes, measurements have errors, people lie. Over many measurements random errors average out; the fit lands in the middle. Systematic errors remain, which is why curation matters."),
        box("gauss-4", "History", "The return to AI", "The method came from astronomy and entered machine learning because the same problem returned: putting a simple curve through imperfect measurements. MSE is a loss function for regression; LLMs train with cross-entropy.")
      ],
      sources: [
        { label: "Stigler (1981), Gauss and the Invention of Least Squares", url: "https://doi.org/10.1214/aos/1176345451", why: { de: "Gauß, Ceres und die Methode der kleinsten Quadrate.", en: "Gauss, Ceres, and the method of least squares." } },
        { label: "Ceres, Dawn (NASA/JPL-Caltech/UCLA/MPS/DLR/IDA), via Wikimedia Commons", url: "https://commons.wikimedia.org/wiki/File:Ceres_-_RC3_-_Haulani_Crater_(22381131691)_(cropped).jpg", why: { de: "Ceres-Bild: NASA-Material gemeinfrei; Bildbearbeitung Justin Cowart, CC BY 2.0.", en: "Ceres image: NASA material public domain; processing by Justin Cowart, CC BY 2.0." } },
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
        body: "Texte verhalten sich ähnlich wie Gauß' Messungen: Manche Sätze sind ganz richtig, manche weniger falsch, manche falsch, aber im Schnitt liegen sie um eine Wahrheit. Eine Wahrheit ist eine Kurve, viele Beschreibungen liegen darum. Je näher ein Satz an der Kurve liegt, desto wahrer ist er in diesem Beispiel. Die meisten Beschreibungen liegen nahe; ein falscher Satz liegt weit weg. Genau diese Form hat Gauß bei Ceres gesehen: Viele verrauschte Beobachtungen, eine wahre Bahn in der Mitte.\n\nDie Abbildung ist symbolisch und keine reale Messung. Sie soll zeigen, dass manche Sätze näher an der Wahrheit liegen als andere und manche weit weg von ihr sind, ähnlich, wie die Messungen aus der Astronomie.",
        teaser: "Texte verhalten sich ähnlich wie Gauß' Messungen: Manche Sätze sind ganz richtig, manche weniger falsch, manche falsch, aber im Schnitt liegen sie um eine Wahrheit. Eine Wahrheit ist eine Kurve, viele Beschreibungen liegen darum. Je näher ein Satz an der Kurve liegt, desto wahrer ist er in diesem Beispiel. Die meisten Beschreibungen liegen nahe; ein falscher Satz liegt weit weg. Genau diese Form hat Gauß bei Ceres gesehen: Viele verrauschte Beobachtungen, eine wahre Bahn in der Mitte.\n\nDie Abbildung ist symbolisch und keine reale Messung. Sie soll zeigen, dass manche Sätze näher an der Wahrheit liegen als andere und manche weit weg von ihr sind, ähnlich, wie die Messungen aus der Astronomie.",
        watch: "",
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
              { id: "q-box-gauss-2", title: "Was macht die Methode?", body: "Sie minimiert die Summe der quadrierten Abstände zwischen Beobachtungen und Modell. MSE ist der gemittelte quadratische Fehler. Große Abweichungen zählen quadratisch, kleine kaum.", tex: "", kind: "question" }
            ]
          },
          {
            id: "g-lens-daten",
            title: "Daten",
            questions: [
              { id: "q-box-gauss-3", title: "Warum im Schnitt richtig?", body: "Einzelne Messungen können, genauso wie einzelne Texte, falsch sein: Menschen irren sich, Messungen haben Fehler, Menschen lügen. Über viele Messungen mitteln sich zufällige Fehler; die Anpassung landet in der Mitte. Systematische Fehler bleiben, deshalb ist die Auswahl wichtig.", tex: "", kind: "question" }
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
        body: "Giuseppe Piazzi entdeckte 1801 den Zwergplaneten <b>Ceres</b>. Nach kurzer Beobachtungszeit verschwand er hinter der Sonne, und niemand wusste mehr, wo man suchen sollte, weil die Messungen zu ungenau waren. <b>Gauß</b> erkannte, dass sich Messfehler um die wahre Bahn verteilen: Einige liegen weit daneben, andere ganz nah, aber im Mittel stimmen sie. Gauß nutzte die Methode der kleinsten Quadrate (<b>M</b>ean <b>S</b>quared <b>E</b>rror, <b>MSE</b>), die Legendre 1805 publiziert hatte, und trug zu ihrer Verbreitung bei. LLM nutzen zwar Cross-Entropy statt MSE, aber die Entwicklung von MSE war dennoch wichtig für die Entwicklung weiterer Loss-Funktionen und hilft beim Verständnis.\n\nDie grüne Linie ist die wahre Bahn; die blauen Punkte sind Beobachtungen; die Glockenkurve rechts zeigt die Fehlerverteilung. Die Daten sind synthetisch, nicht Piazzis originale Messungen.",
        teaser: "Giuseppe Piazzi entdeckte 1801 den Zwergplaneten <b>Ceres</b>. Nach kurzer Beobachtungszeit verschwand er hinter der Sonne, und niemand wusste mehr, wo man suchen sollte, weil die Messungen zu ungenau waren. <b>Gauß</b> erkannte, dass sich Messfehler um die wahre Bahn verteilen: Einige liegen weit daneben, andere ganz nah, aber im Mittel stimmen sie. Gauß nutzte die Methode der kleinsten Quadrate (<b>M</b>ean <b>S</b>quared <b>E</b>rror, <b>MSE</b>), die Legendre 1805 publiziert hatte, und trug zu ihrer Verbreitung bei. LLM nutzen zwar Cross-Entropy statt MSE, aber die Entwicklung von MSE war dennoch wichtig für die Entwicklung weiterer Loss-Funktionen und hilft beim Verständnis. ",
        watch: "",
        demoState: { scene: "gauss", phase: "demo", sigma: 2 },
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Daten",
        title: "Gauß, Ceres und die Daten",
        body: "Die Beobachtungen sind verrauscht: Jeder Punkt liegt neben der wahren Bahn, und die Glockenkurve der Fehler ist breit. Ein einzelner Punkt wäre als Bahn unbrauchbar. Drücke Weiter: Das Teleskop wird besser.",
        teaser: "Die Beobachtungen sind verrauscht: Jeder Punkt liegt neben der wahren Bahn, und die Glockenkurve der Fehler ist breit. Ein einzelner Punkt wäre als Bahn unbrauchbar. Drücke Weiter: Das Teleskop wird besser.",
        watch: "",
        demoState: { scene: "gauss", phase: "demo", sigma: 1 },
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Daten",
        title: "Gauß, Ceres und die Daten",
        body: "Piazzi entdeckte Ceres am 1. Januar 1801 und verlor sie nach 41 Tagen hinter der Sonne. Gauß sagte mit der Methode der kleinsten Quadrate voraus, wo sie wieder auftauchen würde (Stigler, 1981).\n\nWenn die Teleskope besser werden, zieht die Wolke sich zusammen und die Glockenkurve wird schmaler. Die wahre Bahn bleibt in der Mitte.\n\nDie Methode kam aus der Astronomie und fand ihren Weg in das maschinelle Lernen, weil dasselbe Problem wiederkehrte: eine einfache Kurve durch unvollkommene Messungen legen. MSE ist eine Loss-Funktion für Regression. Loss-Funktionen bestimmen, wie gut ein neuronales Netz auf seinen Daten ist, und geben dem Computer einen wichtigen Hinweis, wie er sich verbessern muss.",
        teaser: "Piazzi entdeckte Ceres am 1. Januar 1801 und verlor sie nach 41 Tagen hinter der Sonne. Gauß sagte mit der Methode der kleinsten Quadrate voraus, wo sie wieder auftauchen würde (Stigler, 1981).\n\nWenn die Teleskop besser werden, zieht die Wolke sich zusammen und die Glockenkurve wird schmaler. Die wahre Bahn bleibt in der Mitte.\n\nDie Methode kam aus der Astronomie und fand in das maschinelle Lernen, weil dasselbe Problem wiederkehrte: eine einfache Kurve durch unvollkommene Messungen legen. MSE ist eine Loss-Funktion für Regression. Loss-Funktionen bestimmen, wie gut ein Neuronales Netz ist auf seinen Daten und geben dem Computer einen wichtigen Hinweis, wie er sich verbessern muss.",
        watch: "",
        demoState: { scene: "gauss", phase: "demo", sigma: 0.1 },
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Daten",
        title: "Gauß, Ceres und die Daten",
        body: "Texte verhalten sich ähnlich wie Gauß' Messungen: Manche Sätze sind ganz richtig, manche weniger falsch, manche falsch, aber im Schnitt liegen sie um eine Wahrheit. " + dataTruthStep.body + "\n\nDie Abbildung ist symbolisch und keine reale Messung. Sie soll zeigen, dass manche Sätze näher an der Wahrheit liegen als andere und manche weit weg von ihr sind, ähnlich wie die Messungen aus der Astronomie.",
        teaser: "Texte verhalten sich ähnlich wie Gauß' Messungen: Manche Sätze sind ganz richtig, manche weniger falsch, manche falsch, aber im Schnitt liegen sie um eine Wahrheit. " + dataTruthStep.body + "\n\nDie Abbildung ist symbolisch und keine reale Messung. Sie soll zeigen, dass manche Sätze näher an der Wahrheit liegen als andere und manche weit weg von ihr sind, ähnlich wie die Messungen aus der Astronomie.",
        watch: "",
        demoState: dataTruthStep.demoState,
      }
    ]
  } : {
    title: "Gauss, Ceres, and the data",
    kicker: "Ceres",
    substeps: [
      {
        kicker: "Data",
        title: "Gauss, Ceres, and the data",
        body: "Texts behave similarly to Gauss's measurements: some sentences are quite right, some less wrong, some wrong, but on average they lie around a truth. A truth is a curve, and many descriptions lie around it. The closer a sentence lies to the curve, the truer it is in this example. Most descriptions are close; a false sentence lies far away. This is exactly the shape Gauss saw with Ceres: many noisy observations, one true orbit in the middle.\n\nThe picture is symbolic and not a real measurement. It is meant to show that some sentences are closer to the truth than others, and some are far away, similar to the astronomical measurements.",
        teaser: "Giuseppe Piazzi discovered the celestial body <b>Ceres</b> in 1801. After a short observing period it disappeared behind the Sun, and no one knew where to look because the measurements were too imprecise. <b>Gauss</b> realised that measurement errors scatter around the true orbit: some lie far off, others very close, but on average they agree. Gauss used least squares, which he said he already possessed before 1801 and which Legendre published in 1805; he helped spread the method. MSE is the averaged squared error, a simple special case; many loss functions generalise the same idea. LLMs use cross-entropy instead of MSE.",
        watch: "",
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
              { id: "q-box-gauss-2", title: "What does the method do?", body: "It minimises the sum of squared distances between observations and model. MSE is the averaged squared error. Large deviations count squared, small ones barely.", tex: "", kind: "question" }
            ]
          },
          {
            id: "g-lens-daten",
            title: "Data",
            questions: [
              { id: "q-box-gauss-3", title: "Why right on average?", body: "Individual measurements, just like individual texts, can be wrong: people make mistakes, measurements have errors, people lie. Over many measurements random errors average out; the fit lands in the middle. Systematic errors remain, which is why selection matters.", tex: "", kind: "question" }
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
        body: "Giuseppe Piazzi discovered the dwarf planet <b>Ceres</b> in 1801. After a short period of observation it disappeared behind the Sun, and nobody knew where to search, because the measurements were too imprecise. <b>Gauss</b> realised that measurement errors scatter around the true orbit: some lie far off, others very close, but on average they agree. Gauss used the method of least squares (<b>M</b>ean <b>S</b>quared <b>E</b>rror, <b>MSE</b>), which Legendre had published in 1805, and helped spread it. LLMs use cross-entropy instead of MSE, but the development of MSE was still important for later loss functions and helps with understanding.\n\nThe green line is the true orbit; the blue points are observations; the bell curve on the right shows the error distribution. The data are synthetic, not Piazzi's original measurements.",
        teaser: "The observations are noisy: every point lies beside the true orbit, and the bell curve of errors is wide. A single point would be useless as an orbit. Press Next: the telescope improves.",
        watch: "",
        demoState: { scene: "gauss", phase: "demo", sigma: 2 },
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Data",
        title: "Gauss, Ceres, and the data",
        body: "The observations are noisy: every point lies beside the true orbit, and the bell curve of errors is broad. A single point would be useless as an orbit. Press Next: the telescope gets better.",
        teaser: "Piazzi discovered Ceres on 1 January 1801 and lost it behind the Sun after 41 days. Gauss predicted with least squares where it would reappear (Stigler, 1981).\n\nAs the telescopes get better, the cloud contracts and the bell curve narrows. The true orbit stays in the middle.\n\nThe method came from astronomy and entered machine learning because the same problem returned: putting a simple curve through imperfect measurements. MSE is a loss function for regression. Loss functions determine how good a neural network is on its data and give the computer an important signal for how it must improve.",
        watch: "",
        demoState: { scene: "gauss", phase: "demo", sigma: 1 },
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Data",
        title: "Gauss, Ceres, and the data",
        body: "Piazzi discovered Ceres on 1 January 1801 and lost it behind the Sun after 41 days. Gauss used least squares to predict where it would reappear (Stigler, 1981).\n\nAs the telescopes get better, the cloud contracts and the bell curve gets narrower. The true orbit stays in the middle.\n\nThe method came from astronomy and entered machine learning because the same problem returned: fit a simple curve through imperfect measurements. MSE is a loss function for regression. Loss functions measure how good a neural network is on its data and give the computer an important signal for how to improve.",
        teaser: "Now the cloud lies tightly around the orbit. Gauss's least squares chooses the orbit closest to all observations at once; no single measurement decides alone.",
        watch: "",
        demoState: { scene: "gauss", phase: "demo", sigma: 0.1 },
        sources: gaussSteps[0].sources
      },
      {
        kicker: "Data",
        title: "Gauss, Ceres, and the data",
        body: "Text data behaves similarly to Gauss's measurements: some sentences are completely right, some less wrong, some wrong, but on average they sit around a truth. " + dataTruthStep.body + "\n\nThe figure is symbolic and not a real measurement. It is meant to show that some sentences lie closer to the truth than others and some far away from it, similar to the measurements from astronomy.",
        teaser: "Text data behaves similarly to Gauss's measurements: some sentences are completely right, some less wrong, some wrong, but on average they sit around a truth. " + dataTruthStep.body + "\n\nThe figure is symbolic and not a real measurement. It is meant to show that some sentences lie closer to the truth than others and some far away from it, similar to the measurements from astronomy.",
        watch: "",
        demoState: dataTruthStep.demoState,
      }
    ]
  };

  var tokenizeBpeStep = Object.assign({}, tokenizeSteps[0], {
    kicker: DE ? "BPE" : "BPE",
    title: DE ? "BPE: Bytes/Zeichen → Paare → Merges" : "BPE: bytes/characters → pairs → merges",
    body: DE ? "<b>BPE</b> beginnt normalerweise mit einer Liste von 256 fest definierten Zeichen, das sind alle Kombinationen, die in einem Byte ($2^8 = 256$) vorkommen können. Jeder davon wird eine ID zugewiesen, damit jedes Zeichen darstellbar ist. Dann beginnt der Algorithmus, benachbarte Paare dieser Zeichen zu zählen und ersetzt das häufigste Paar durch ein Token, das beide dieser Zeichen repräsentiert. Dann das zweithäufigste usw., bis man die Vokabulargröße erreicht hat, die man als sogenannten Hyperparameter (das ist ein Parameter, den man wählen muss, bevor man das Training startet), vorgegeben hat.\n\nNach einigen Merges werden häufige Wörter und Kombinationen sehr viel kürzer.\n\n<b>Hapax Legomena</b> (Wörter, die im Korpus nur einmal vorkommen) oder seltenere Wörter bekommen in der Regel keinen eigenen Merge für das ganze Wort, sondern werden aus den anderen, bereits existierenden Tokens, notfalls den 256 Tokens vom Anfang, zusammengesetzt." : "<b>BPE</b> normally starts with a list of 256 fixed characters, all combinations that can occur in a byte ($2^8 = 256$). Each gets an ID so that every character can be represented. The algorithm then counts adjacent pairs of these characters and replaces the most frequent pair with a token that represents both. Then the second most frequent, and so on, until the vocabulary size chosen as a hyperparameter (a parameter you must choose before training starts) is reached.\n\nAfter a few merges, frequent words and combinations become much shorter.\n\n<b>Hapax legomena</b> (words that occur only once in the corpus) or rarer words usually do not get their own merge for the whole word; they are assembled from the other existing tokens, or from the 256 starting tokens if necessary.",
    watch: "",
    demoState: { scene: "tokenize", mode: "bpe" },
    context: "",
    deep: "",
    boxes: []
  });
  var tokenizeExamplesStep = Object.assign({}, tokenizeSteps[0], {
    kicker: DE ? "Tokenize" : "Tokenize",
    title: DE ? "Text wird zu IDs" : "Text becomes IDs",
    body: DE ? "Der Tokenizer trennt Texte in kleinere Bestandteile (sogenannte Tokens) auf, so, dass diese Bestandteile möglichst viel Text mit möglichst wenig Tokens darstellen können. Diese Tokens können ganze Wörter sein, aber auch Leerzeichen, Satzzeichen oder Teile von Wörtern.\n\nDafür wird ein Algorithmus wie <b>B</b>yte <b>P</b>air <b>E</b>ncoding (<b>BPE</b>) benutzt. Byte Pair Encoding beginnt mit Zeichen oder Bytes und ersetzt wiederholt das häufigste Paar durch ein neues Symbol. Nach vielen Merges wird aus häufigen Zeichenfolgen ein einzelner Token. Das ist Datenkompression, gelernt aus dem Trainingskorpus.\n\nDas basiert auf zwei Gedanken: der erste ist Kompression: es sollen so wenig wie möglich Tokens benutzt werden müssen, um so viel wie möglich zu sagen.\n\nDer zweite ist, dass das Netzwerk so auch Worte bearbeiten kann, die es vorher nie gesehen hat, indem es sie in Bestandteile trennt und lernt, wie man Worte aus ihren Bestandteilen heraus versteht, auch wenn man das konkrete Wort vielleicht nie gesehen hat." : "The tokenizer splits texts into smaller units (tokens) so that these units can represent as much text as possible with as few tokens as possible. These tokens can be whole words, but also spaces, punctuation, or parts of words.\n\nFor this, an algorithm such as <b>B</b>yte <b>P</b>air <b>E</b>ncoding (<b>BPE</b>) is used. Byte Pair Encoding starts with characters or bytes and repeatedly replaces the most frequent pair with a new symbol. After many merges, frequent character sequences become a single token. This is data compression, learned from the training corpus.\n\nIt rests on two ideas: the first is compression: use as few tokens as possible to say as much as possible.\n\nThe second is that the network can then handle words it has never seen before by splitting them into parts and learning how to understand words from their parts, even if it has never seen the concrete word.",
    watch: "",
    demoState: { scene: "tokenize", mode: "split" },
    inherit: false,
    questionGroups: [
      {
        id: "g-basics",
        title: DE ? "Eine Ebene tiefer" : "One level deeper",
        questions: []
      },
      {
        id: "g-lens-technik",
        title: DE ? "Technik" : "Technique",
        questions: [
          { id: "q-box-tok-1", title: DE ? "Wie geht es mit unbekannten Zeichen um?" : "How does it handle unknown characters?", body: DE ? "Bei Encodings wie UTF8 kann ein Zeichen mehrere Byte lang sein. Was, wenn ein Zeichen nicht ein einziges Mal im Kontext war, wie zum Beispiel neue Emojis, die nicht in den Trainingsdaten waren? Die sind aufgebaut aus zwei oder mehr Bestandteilen, so besteht 🐈‍⬛ aus 🐈, dem \"zero-width-joiner\"-Charakter (ZWJ) und danach dem ⬛. Stehen die drei hintereinander, wird es als 🐈‍⬛ angezeigt. Man sagt dem Tokenizer nun auch alle 256 Möglichkeiten, die 8 Bit haben können. Damit kann es unbekannte Charakter trotzdem klassifizieren und nach Kontext in gewisse Richtungen schieben, so zum Beispiel die Richtung für \"Emoji\", wo unter Anderem auch 🐈 bereits ist. So kann es lernen, dass es 🐈‍⬛ eine schwarze Katze ist, ohne dass es das Zeichen je gesehen haben muss, nur weil es weiß, dass es aus einem schwarzen Block, dem ZWJ und einer Katze besteht." : "With encodings such as UTF-8, one character can be several bytes long. What if a character never appeared in the context, such as new emojis that were not in the training data? They are built from two or more parts: 🐈‍⬛ consists of 🐈, the zero-width joiner character (ZWJ), and then ⬛. When the three stand together, they display as 🐈‍⬛. The tokenizer is also given all 256 values a byte can take. That lets it represent unknown characters anyway and, depending on context, push them in certain directions, for example the direction for “emoji”, where 🐈 already sits, among others. So it can learn that 🐈‍⬛ is a black cat without ever having seen the character, simply because it knows that it consists of a black block, the ZWJ, and a cat.", tex: "", kind: "question" }
        ]
      },
      {
        id: "g-lens-mathematik",
        title: DE ? "Mathematik" : "Mathematics",
        questions: []
      },
      {
        id: "g-lens-daten",
        title: DE ? "Daten" : "Data",
        questions: [
          { id: "q-box-tok-bpe-data", title: DE ? "Warum ist die Tokenisierung datenabhängig?" : "Why does tokenization depend on the data?", body: DE ? "Ein Tokenizer wird so optimiert, dass er möglichst viel Text mit möglichst wenigen Tokens abdeckt, ohne Information zu verlieren: Jedes Wort muss aus seinen Tokens wieder zusammensetzbar sein. Deshalb ist die exakte Zerlegung eine Folge der Trainingsdaten und des Vokabularziels, keine feste Wortliste. Seltene Schriften werden schlechter komprimiert und verbrauchen damit mehr Tokens und sind teurer, weil sie im Trainingskorpus seltener vorkommen und der Tokenizer sie nicht oft genug sieht, um sie abkürzend zu speichern (Petrov et al., 2023)." : "A tokenizer is optimised to cover as much text as possible with as few tokens as possible without losing information: every word must be reconstructable from its tokens. The exact split is therefore a consequence of the training data and the vocabulary target, not a fixed word list. Rare scripts are compressed less well and therefore use more tokens and are more expensive, because they occur less often in the training corpus and the tokenizer does not see them often enough to store them in abbreviated form (Petrov et al., 2023).", tex: "", kind: "question" }
        ]
      },
      {
        id: "g-sources",
        title: DE ? "Quellen" : "Sources",
        sources: [
          { label: "Sennrich et al. (2016), Neural Machine Translation of Rare Words with Subword Units", url: "https://arxiv.org/abs/1508.07909", why: { de: "BPE als Subword-Kompression für seltene Wörter.", en: "BPE as subword compression for rare words." } },
          { label: "Radford et al. (2019), GPT-2", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", why: { de: "GPT-2: byte-level BPE und die hier gezeigten Hidden States.", en: "GPT-2: byte-level BPE and the hidden states shown here." } }, { label: "Petrov et al. (2023), Language Model Tokenizers Introduce Unfairness Between Languages", url: "https://arxiv.org/abs/2305.15425", why: { de: "Tokenizer machen manche Sprachen teurer.", en: "Tokenizers make some languages more expensive." } }
        ]
      }
    ]
  });

  var weekdayStep = {
    kicker: DE ? "Wochentage" : "Weekdays",
    title: DE ? "Wochentage auf einer Linie" : "Weekdays on a line",
    body: DE ? "Montag, Dienstag, Mittwoch und die weiteren Tage liegen auf einer Linie. Die Richtung von einem Tag zum nächsten ist überall dieselbe. Da auf Sonntag wieder Montag folgt, bilden sie einen Kreis. Dieser Kreis ist ein Beispiel für einen sogenannten Unterraum, ein Raum, der eingebettet ist in einen höheren Raum, aber in sich abgeschlossen." : "Monday, Tuesday, Wednesday and the other days lie on a line. The direction from one day to the next is the same everywhere. Because Monday follows Sunday again, they form a circle. This circle is an example of a so-called subspace, a space embedded in a higher space but closed in itself.",
    watch: "",
    demoState: { scene: "weekday" },
    inherit: false,
    sources: []
  };

  var embeddingMergeStep = {
    title: DE ? "Bedeutung wird Geometrie" : "Meaning becomes geometry",
    kicker: DE ? "1D · 2D · 3D · Tabelle" : "1D · 2D · 3D · table",
    substeps: [embedSteps[0], weekdayStep, embedSteps[1], embedSteps[2], highdimSteps[0]]
  };
  var attentionMergedGroups = [
    {
      id: "g-lens-mathematik",
      title: DE ? "Mathematik" : "Mathematics",
      questions: [
        { id: "q-box-att-5", title: DE ? "Die Formel" : "The formula", body: DE ? "Attention bildet aus Query, Key und Value eine gewichtete Summe. Die Softmax-Zeile summiert zu 1 (100 %). Die Summe geht über alle Tokens, die durch die Laufvariable $j$ iteriert werden." : "Attention builds a weighted sum from query, key, and value. The softmax row sums to 1 (100%). The sum runs over all tokens, iterated by the index variable $j$.", tex: DE ? "\\underbrace{r_i}_{\\substack{\\text{Mischung} \\\\ \\text{für Position } i}} = \\underbrace{\\sum_j \\underbrace{\\alpha_{ij}}_{\\substack{\\text{Gewicht von } j \\\\ \\text{für } i}} \\cdot \\underbrace{v_j}_{\\text{Value von } j}}_{\\substack{\\text{gewichtete Summe} \\\\ \\sum_j \\alpha_{ij} = 1}}" : "\\underbrace{r_i}_{\\substack{\\text{mixture} \\\\ \\text{for position } i}} = \\underbrace{\\sum_j \\underbrace{\\alpha_{ij}}_{\\substack{\\text{weight of } j \\\\ \\text{for } i}} \\cdot \\underbrace{v_j}_{\\text{value of } j}}_{\\substack{\\text{weighted sum} \\\\ \\sum_j \\alpha_{ij} = 1}}", kind: "trivia" }
      ]
    },
    {
      id: "g-sources",
      title: DE ? "Quellen" : "Sources",
      sources: attentionSteps[1].sources
    }
  ];


  var attentionMerged = {
    kicker: DE ? "Attention" : "Attention",
    title: DE ? "Attention bewegt Punkte anhand des Kontextes" : "Attention moves points based on context",
    body: DE ? "Mit Attention kann jedes Token an alle anderen Tokens im Kontext die Frage stellen, wie wichtig sie unter einem gewissen Aspekt für das aktuelle Token sind. Man bekommt für jedes Token eine Prozentzahl, wie viel es zum aktuellen Token beiträgt. Dadurch ist es möglich, jedes Token neu zu berechnen, indem man es prozentual mit allen anderen Tokens addiert. Bei generativen Modellen wie LLM fügt man noch eine sogenannte Causal-Mask ein, die dafür sorgt, dass jedes Token nur auf seine eigene Vergangenheit sehen kann (dadurch sind zukünftige Tokens auf 0), damit das nächste Token generiert werden kann, ohne dass man bereits weiß, welches es ist. \n\nDieses System erlaubt es, Tokens flexibel anhand des Kontextes zu verschieben, ohne sich völlig festzulegen. \n\nIn Summe hat jeder Attention Head für jedes Token genau 100% Attention. Entscheidet er sich, auf ein Token 80% Aufmerksamkeit zu richten, bleiben für alle anderen Tokens nur noch 20% übrig. \n\nMan schaltet viele dieser Attention Heads parallel, wobei jeder auf andere Dinge achten kann. Jeder verschiebt die Tokens so, dass sie einer bestimmten Fragestellung entsprechen, die nicht menschenlesbar oder verständlich sein muss. Der Computer wählt sie, um den Loss zu reduzieren und näher an die gewollten Ergebnisse zu gelangen, nicht, damit sie für uns Menschen lesbar sind." : "With attention, every token can ask every other token in the context how important it is for the current token under some aspect. Each token gets a percentage saying how much it contributes to the current token. This makes it possible to recompute every token by adding all other tokens proportionally. In generative models such as LLMs, a so-called causal mask ensures that every token can see only its own past (future tokens are set to 0), so the next token can be generated without already knowing which one it is.\n\nThis system lets tokens shift flexibly according to context without committing completely.\n\nIn total, each attention head gives exactly 100% attention to each token. If it decides to put 80% attention on one token, only 20% remains for all others.\n\nMany of these attention heads run in parallel, each able to attend to different things. Each shifts the tokens to match a particular question that need not be human-readable or understandable. The computer chooses them to reduce the loss and get closer to the desired results, not to make them readable to us.",
    watch: "",
    demoState: { scene: "attention" },
    context: "",
    deep: "",
    boxes: [],
    questionGroups: attentionMergedGroups,
    sources: []
  };
  var headConcatTex = DE ? "\\underbrace{\\underbrace{\\begin{pmatrix} \\text{Token 1} & h_{1,1} & \\cdots & h_{1,H d_v} \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ \\text{Token } n & h_{n,1} & \\cdots & h_{n,H d_v} \\end{pmatrix}}_{\\substack{n \\text{ Tokens (Zeilen)} \\\\ H d_v \\text{ Werte pro Zeile}}}}_{\\text{Concat: pro Token ein langer Vektor, Tokens als Zeilen}} \\;\\overset{W_O}{\\longrightarrow}\\; \\underbrace{\\underbrace{\\begin{pmatrix} \\text{Token 1} & u_{1,1} & \\cdots & u_{1,d_{\\text{model}}} \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ \\text{Token } n & u_{n,1} & \\cdots & u_{n,d_{\\text{model}}} \\end{pmatrix}}_{\\substack{n \\text{ Tokens (Zeilen)} \\\\ d_{\\text{model}} \\text{ Werte pro Zeile}}}}_{\\text{pro Token ein Vektor fürs FFN}}" : "\\underbrace{\\underbrace{\\begin{pmatrix} \\text{token 1} & h_{1,1} & \\cdots & h_{1,H d_v} \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ \\text{token } n & h_{n,1} & \\cdots & h_{n,H d_v} \\end{pmatrix}}_{\\substack{n \\text{ tokens (rows)} \\\\ H d_v \\text{ values per row}}}}_{\\text{concat: one long vector per token, tokens as rows}} \\;\\overset{W_O}{\\longrightarrow}\\; \\underbrace{\\underbrace{\\begin{pmatrix} \\text{token 1} & u_{1,1} & \\cdots & u_{1,d_{\\text{model}}} \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ \\text{token } n & u_{n,1} & \\cdots & u_{n,d_{\\text{model}}} \\end{pmatrix}}_{\\substack{n \\text{ tokens (rows)} \\\\ d_{\\text{model}} \\text{ values per row}}}}_{\\text{one vector per token for the FFN}}";
  var headConcatSubstep = {
    kicker: DE ? "Concat" : "Concat",
    title: DE ? "Heads zusammenfügen" : "Joining the heads",
    body: (DE
      ? "Jeder Head liefert pro Token einen Vektor. Die Heads gehen aber nicht einzeln ins FFN: Concat hängt für jeden Token die Head-Vektoren aneinander, und die gelernte Matrix $W_O$ mischt sie zu einem Vektor pro Token (äquivalent: jede Head-Ausgabe mit ihrem $W_O$-Block multiplizieren und addieren). Für die ganze Sequenz ist das eine Matrix mit einem Token pro Zeile und $d_{\\text{model}}$ Spalten. Das FFN liest jeden Token-Vektor als Ganzes; es verarbeitet Tokens einzeln, nicht Heads.\n\n\n$$" + headConcatTex + "$$\n\n\nDas funktioniert von den Shapes her, da das Modell durch die Aufteilung der Dimensionen auf die Heads ($H \\times d_v = d_{\\text{model}}$) und die anschließende Projektion mit $W_O$ sicherstellt, dass die Ausgabedimension für jeden Token exakt der ursprünglichen Modell-Dimension ($d_{\\text{model}}$) entspricht."
      : "Each head produces one vector per token. The heads do not go into the FFN individually: concat joins the head vectors for each token, and the learned matrix $W_O$ mixes them into one vector per token (equivalently: multiply each head output by its $W_O$ block and add). For the whole sequence this is a matrix with one token per row and $d_{\\text{model}}$ columns. The FFN reads each token vector as a whole; it processes tokens individually, not heads.\n\n\n$$" + headConcatTex + "$$\n\n\nThis works shape-wise because, by splitting the dimensions across the heads ($H \\times d_v = d_{\\text{model}}$) and then projecting with $W_O$, the model ensures that the output dimension for every token exactly matches the original model dimension ($d_{\\text{model}}$)."),
    watch: DE ? "Drücke Weiter: Heads, Concat, W_O, Token-Vektor." : "Press Next: heads, concat, W_O, token vector.",
    demoState: { scene: "headconcat" },
    context: "",
    deep: DE
      ? "Formal: Jeder Head liefert für $n$ Tokens eine Matrix $n \\times d_v$. Concat ergibt $n \\times H d_v$; $W_O$ ($H d_v \\times d_{\\text{model}}$) projiziert auf $n \\times d_{\\text{model}}$. Wegen $W_O [h_1;\\dots;h_H] = \\sum_i W_O^{(i)} h_i$ kann man die Heads auch als unabhängige Beiträge lesen, die in den Residualstrom addiert werden. Danach sind sie keine getrennten Kanäle mehr; das FFN sieht nur den gemischten Token-Vektor."
      : "Formally: each head gives an $n \\times d_v$ matrix for $n$ tokens. Concat gives $n \\times H d_v$; $W_O$ ($H d_v \\times d_{\\text{model}}$) projects to $n \\times d_{\\text{model}}$. Because $W_O [h_1;\\dots;h_H] = \\sum_i W_O^{(i)} h_i$, the heads can also be read as independent contributions added to the residual stream. Afterwards they are no longer separate channels; the FFN sees only the mixed token vector.",
    boxes: [],
    sources: [
      { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Multi-Head-Attention: Concat der Heads und Ausgabeprojektion W_O.", en: "Multi-head attention: concat of the heads and output projection W_O." } },
      { label: "Elhage et al. (2021), A Mathematical Framework for Transformer Circuits", url: "https://transformer-circuits.pub/2021/framework/index.html", why: { de: "QK- und OV-Schaltkreise; die Head-Ausgabe wird in den Residualstrom geschrieben.", en: "QK and OV circuits; the head output is written into the residual stream." } }
    ]
  };

  var codeAttentionSubstep = {
    kicker: "Attention",
    title: DE ? "Attention: Was ist relevant?" : "Attention: what is relevant?",
    body: DE
      ? "Die Sätze „Der Hund läuft auf der Straße“ und „Der Hundt läuft auf die Strase“ enthalten mehrere Informationen. Einige sind in beiden gleich, nämlich, dass ein Hund auf der Straße läuft, einige sind in beiden unterschiedlich, zum Beispiel dass der eine Satz viele Tippfehler hat und der andere nicht. Manchmal sind diese Informationen wichtig, manchmal sind sie Rauschen.\n\n\nAttention hilft dabei, in den Kontext zu schauen und zu sagen, welche davon Rauschen sind und welche nicht. Wenn davor steht: \"Mach eine Rechtschreibprüfung\" ist die Fehler der Tippfehler wichtig, steht davor aber \"Fasse mir zusammen, was hier passiert\", dann nicht. \n\n\nDadurch, dass Attention Punkte anhand des Kontextes verschiebt, erlaubt es, einige Informationen zu ignorieren und die Tokens \"Straße\" und \"Strase\" in die selbe Region zu verschieben, sofern der Kontext impliziert dass die Unterschiede unwichtig sind.\n\n\nDadurch wird Attention zu einem Router, der die Tokens an die Stelle schiebt, die ihrer Bedeutung im Kontext entsprechen, worauf dann das nachfolgende Feed-Forward-Netzwerk die kontextualisierten Punkte besser isolieren und trennen kann, je nachdem, auf welche Faktoren geachtet werden muss.\n\n\nFür Code gilt dasselbe. Ob ein Algorithmus in Python oder JavaScript steht, ist ein oft Oberflächenunterschied. Geht es um den Algorithmus, kann man von der Syntax abstrahieren. Steht davor „Schreibe das in JavaScript neu“, werden Syntax, Idiome und Ökosystem plötzlich wichtig. Derselbe Unterschied ist einmal Rauschen und einmal Signal.\n\n\nAttention löscht nichts; sie verschiebt die Repräsentation und gewichtet, was für die aktuelle Aufgabe zählt."
      : "“The dog runs on the street” and “The dgo runs on the strase” contain several pieces of information. Some are the same in both, namely that a dog is running on the street; some differ between the two, for example that one sentence has many typos and the other does not. Sometimes this information matters, sometimes it is noise.\n\n\nAttention helps to look into the context and say which of these are noise and which are not. If the prompt before it says: “Run a spelling check”, the typo is important; but if it says “Summarise for me what is happening here”, then it is not.\n\n\nBecause attention shifts points according to the context, it allows some information to be ignored and the tokens “street” and “strase” to be moved into the same region, provided the context implies that the differences are unimportant.\n\n\nThis turns attention into a router that pushes the tokens to the place that corresponds to their meaning in the context, after which the following feed-forward network can better isolate and separate the contextualised points, depending on which factors need attention.\n\n\nThe same applies to code. Whether an algorithm is written in Python or JavaScript is often a surface difference. If the question is about the algorithm, you can abstract from the syntax. If the prompt before it says “Rewrite this in JavaScript”, syntax, idioms, and ecosystem suddenly matter. The same difference is noise in one case and signal in another.\n\n\nAttention deletes nothing; it shifts the representation and weighs what counts for the current task.",
    watch: DE ? "Wechsle die Aufgabe: Bedeutung oder Rechtschreibung. Beobachte, was lila (Rauschen) und was gold (Signal) markiert ist." : "Switch the task: meaning or spelling. Watch what is marked lilac (noise) and what gold (signal).",
    demoState: { scene: "codesemantic", kind: "language" },
    context: "",
    deep: DE ? "Mehrsprachige Modelle wie XLM-R und mBERT bilden ähnliche Repräsentationen für verwandte Bedeutungen über Sprachen hinweg (Conneau et al., 2020; Pires et al., 2019). Das ist gelernt und nicht garantiert: Bedeutung kann mehrdeutig sein, und seltene Sprachen bleiben benachteiligt. Welche Oberflächenmerkmale zählen, hängt von Kontext und Aufgabe ab; ein Head kann auf Syntax achten, ein anderer auf Bedeutung, ein dritter auf Position." : "Multilingual models such as XLM-R and mBERT form similar representations for related meanings across languages (Conneau et al., 2020; Pires et al., 2019). This is learned and not guaranteed: meaning can be ambiguous, and low-resource languages remain disadvantaged. Which surface features count depends on context and task; one head can attend to syntax, another to meaning, a third to position.",
    boxes: DE ? [
      box("sem-1", "Sprache", "Rauschen oder Signal?", "Neun Sätze in drei Sprachen, mit Tippfehlern und anderer Grammatik, meinen dasselbe. Für die Aufgabe „Bedeutung“ sind Sprache, Schreibweise und Tippfehler Rauschen. Für „Rechtschreibung prüfen“ wären sie wichtig."),
      box("sem-2", "Code", "Rauschen oder Signal?", "def und function sind verschiedene Oberflächen für dieselbe Rolle: eine Funktionsdefinition. Für die Aufgabe „Algorithmus“ ist die Syntax Rauschen; für „in JavaScript neu schreiben“ wird sie wichtig."),
      box("sem-3", "Grenze", "Was ist vereinfacht?", "Die Demo zeigt neun Sätze, fünf Codeblöcke und einen abstrakten Punkt. Ein echtes Modell hat Tausende Dimensionen und viele überlappende Rollen; die Pfade sind eine didaktische Vereinfachung."),
      box("sem-4", "Technik", "Viele Heads parallel", "Ein Head ist eine Perspektive. Ein Transformer hat viele Heads gleichzeitig; sie können auf Syntax, Bedeutung, Position, Code oder völlig andere Muster achten."),
      box("sem-5", "Grenze", "Gibt es eine sprachunabhängige Ebene?", "Nicht als eigene eingebaute Ebene. Mehrsprachige Modelle lernen ähnliche Richtungen für ähnliche Bedeutungen, weil dieselben Kontexte in vielen Sprachen auftreten. Das ist eine gelernte Annäherung, keine Garantie.")
    ] : [
      box("sem-1", "Language", "Noise or signal?", "Nine sentences in three languages, with typos and different grammar, mean the same thing. For the task “meaning”, language, spelling, and typos are noise. For “check the spelling”, they would matter."),
      box("sem-2", "Code", "Noise or signal?", "def and function are different surfaces for the same role: a function definition. For the task “algorithm”, the syntax is noise; for “rewrite in JavaScript”, it becomes important."),
      box("sem-3", "Limit", "What is simplified?", "The demo shows nine sentences, five code blocks, and one abstract point. A real model has thousands of dimensions and many overlapping roles; the paths are a didactic simplification."),
      box("sem-4", "Technique", "Many heads in parallel", "A head is one perspective. A transformer has many heads at once; they can attend to syntax, meaning, position, code, or completely different patterns."),
      box("sem-5", "Limit", "Is there a language-independent layer?", "Not as a built-in layer. Multilingual models learn similar directions for similar meanings because the same contexts occur in many languages. That is a learned approximation, not a guarantee.")
    ],
    sources: [
      { label: "Tenney et al. (2019), BERT Rediscovers the Classical NLP Pipeline", url: "https://arxiv.org/abs/1905.05950", why: { de: "Schichten bilden linguistische Rollen heraus.", en: "Layers develop linguistic roles." } },
      { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Multi-Head-Attention: viele Heads parallel.", en: "Multi-head attention: many heads in parallel." } },
      { label: "Conneau et al. (2020), Unsupervised Cross-lingual Representation Learning at Scale", url: "https://arxiv.org/abs/1911.02116", why: { de: "XLM-R: mehrsprachige Repräsentationen über Sprachen hinweg.", en: "XLM-R: multilingual representations across languages." } },
      { label: "Pires et al. (2019), How Multilingual is Multilingual BERT?", url: "https://arxiv.org/abs/1906.01502", why: { de: "mBERT: gemeinsame Repräsentationen trotz verschiedener Sprachen.", en: "mBERT: shared representations despite different languages." } }
    ]
  };
  var codeAttentionCodeSubstep = Object.assign({}, codeAttentionSubstep, {
    body: DE ? "Dieselbe Funktion in Python, JavaScript, Java, Rust und Go sieht jeweils anders aus. Für die Frage „Was macht der Algorithmus?“ ist die Syntax oft Rauschen: Die Rolle „Sortierung“ oder „Schleife“ ist in allen Sprachen dieselbe. Attention kann die Repräsentationen so verschieben, dass diese Rollen näher zusammenrücken.\n\n\ndef, function, func und fn sind verschiedene Schreibweisen für dieselbe \nRolle: eine Funktionsdefinition. Für die Aufgabe „Algorithmus“ ist die \nSyntax Rauschen; für „in JavaScript neu schreiben“ ist sie wichtig.\n\nquick_sort, quickSort, sortiere und quicksort teilen die Rolle „Sortierung“.\n\nSteht davor „Schreibe das in JavaScript neu“, ändert sich die Aufgabe. Jetzt sind Syntax, Idiome, Ökosystem und Fallstricke der Zielsprache wichtig. Derselbe Unterschied ist einmal Rauschen und einmal Signal." : "The same function looks different in Python, JavaScript, Java, Rust, and Go. For the question “What does the algorithm do?”, syntax is often noise: the role “sorting” or “loop” is the same in every language. Attention can shift the representations so that these roles move closer together.\n\n\ndef, function, func, and fn are different spellings of the same \nrole: a function definition. For the task “algorithm”, the \nsyntax is noise; for “rewrite in JavaScript”, it is important.\n\nquick_sort, quickSort, sortiere, and quicksort share the role of “sorting”.\n\nIf the prompt before it says “Rewrite this in JavaScript”, the task changes. Now syntax, idioms, ecosystem, and pitfalls of the target language matter. The same difference is noise in one case and signal in another.",
    watch: "",
    context: "",
    deep: DE ? "Ein Modell lernt ähnliche Richtungen für ähnliche Rollen, weil dieselben Kontexte in vielen Sprachen auftreten. Das ist eine gelernte Annäherung, keine Garantie; seltene Sprachen und exotische Syntax bleiben benachteiligt. Welche Rolle zählt, hängt von der Aufgabe ab." : "A model learns similar directions for similar roles because the same contexts occur in many languages. That is a learned approximation, not a guarantee; low-resource languages and unusual syntax remain disadvantaged. Which role counts depends on the task.",
    boxes: DE ? [
      box("code-sem-3", "Grenze", "Was ist vereinfacht?", "Die Demo zeigt wenige Codeblöcke und einen abstrakten Punkt. Ein echtes Modell hat Tausende Dimensionen und viele überlappende Rollen; die Pfade  sind eine didaktische Vereinfachung.")
    ] : [
      box("code-sem-3", "Limit", "What is simplified?", "The demo shows a few code blocks and one abstract point. A real model has thousands of dimensions and many overlapping roles; the paths are a didactic simplification.")
    ],
    demoState: { scene: "codesemantic", kind: "code" }
  });
  var codeAttentionStep = {
    title: codeAttentionSubstep.title,
    kicker: codeAttentionSubstep.kicker,
    substeps: [codeAttentionSubstep, codeAttentionCodeSubstep]
  };
  var attentionMergeStep = {
    title: DE ? "Attention: Kontext und Matrix" : "Attention: context and matrix",
    kicker: DE ? "Attention" : "Attention",
    substeps: [attentionMerged]
  };

  var neuralNeuronStep = Object.assign({}, insideSteps[0], {
    kicker: DE ? "Neuron" : "Neuron",
    title: DE ? "Ein Neuron als Gerade" : "A neuron as a line",
    watch: "",
    body: DE
      ? "Ein neuronales Netz ist zuerst eine parametrisierte Funktion. Das kleinste Beispiel ist ein lineares Neuron: $\\hat y = w\\cdot x + b$. Es hat zwei Parameter und kann nur eine Gerade zeichnen und sie rauf und runter schieben.\n\n\nDen Fehler berechnen wir, wie beim vorherigen Beispiel mit Gauß und Ceres, über die quadratische mittlere Abweichung. Dadurch sagen wir wenn das Netzwerk grob in der Region liegt wo es hin soll dass es schon ganz gut ist (indem wir es quadratisch mehr \"bestrafen\" wenn es weiter weg liegt), aber je näher es an den realen Punkten ist, desto besser wird es am Ende im Detail. \n\n\nBeim Trainieren eines neuronalen Netzes werden die Parameter (wie $w$ und $b$) immer wieder angepasst, um einen möglichst geringen Fehler zu haben auf den Daten, die es sieht.\n\n\nDie Gerade passt sich an die Punkte an, aber sie kann den Sinus nur grob annähern, weil sie nicht komplex genug ist.\n\n\nDer grüne Bereich ist der Bereich, aus dem das Netzwerk lernt. Die grauen Bereiche zeigen, dass es nur innerhalb des grünen Bereichs halbwegs passt, aber außerhalb ist es sehr schlecht."
      : "A neural network is first a parameterised function. The smallest example is a linear neuron: $\\hat y = w\\cdot x + b$. It has two parameters and can only draw a straight line and move it up and down.\n\n\nWe compute the error, as in the previous example with Gauss and Ceres, through the mean squared deviation. This tells us that when the network lies roughly in the region where it should be, it is already quite good (because we “punish” it quadratically more when it is further away), but the closer it is to the real points, the better it becomes in detail in the end. \n\n\nWhen training a neural network, the parameters (such as $w$ and $b$) are adjusted again and again to have the smallest possible error on the data it sees.\n\n\nThe line adapts to the points, but it can only approximate the sine roughly because it is not complex enough.\n\n\nThe green area is the area from which the network learns. The grey areas show that it only fits reasonably inside the green area, but outside it is very bad.",
    context: "",
    deep: "",
    boxes: insideSteps[0].boxes.filter(function (b) {
      return b.id === "mod-0" || b.id === "mod-loss" || b.id === "mod-extra";
    })
  });
  var neuralLossStep = Object.assign({}, gradientSteps[0], {
    title: DE ? "Wie findet man gute Punkte?" : "How do you find good points?",
    kicker: DE ? "Optimizer" : "Optimizer",
    watch: "",
    body: DE ? "Wir sehen hier ein kleines reales Netzwerk beim Training. Es hat nur zwei Parameter, $w$ und $b$. Seine gesamte Formel lautet:\n\n\n$$f(x) = w\\cdot x + b$$\n\n\nDer Plot hat 3 Achsen: $w$, $b$ und $Loss$. Für jeden Parameterpunkt $(w, b)$ gibt es einen Loss, das heißt einen Wert, wie gut das Netzwerk mit diesen Werten wäre (die Höhe und Farbe). Training heißt: der Computer guckt sich an, wie gut der aktuelle Punkt ist, und in welche Richtungen er den Punkt verschieben muss, damit das Ergebnis besser wird. Dann verschiebt er den Punkt und schaut erneut.\n\n\nDieses Anpassen der Gewichte anhand von Beispieldaten nennt man <b>Training</b>." : "We see a small real network during training here. It has only two parameters, $w$ and $b$. Its whole formula is:\n\n\n$$f(x) = w\\cdot x + b$$\n\n\nThe plot has 3 axes: $w$, $b$, and $loss$. For every parameter point $(w, b)$ there is a loss, that is, a value for how good the network would be with those values (shown by height and colour). Training means: the computer looks at how good the current point is and in which directions it must move the point so that the result gets better. Then it moves the point and looks again.\n\n\nThis adjusting of the weights based on example data is called <b>training</b>.",
    inherit: false,
    questionGroups: [
      {
        id: "g-lens-lernprozess",
        title: DE ? "Lernprozess" : "Learning process",
        questions: [
          { id: "q-box-grad-process", title: DE ? "Wie funktioniert der Lernprozess?" : "How does the learning process work?", body: DE ? "Beim Training über Backpropagation hat man einen Forward- und einen Backward-Pass. Beim Forward-Pass schaut man, wie das Netzwerk jetzt gerade ist; beim Backward-Pass bestimmt man, wie es sich ändern muss, damit es besser wird. Der Forward-Pass ist einfach nur das Ausführen der Funktion des Netzes mit realen Daten und das Holen des Ergebnisses.\n\n\nBeim Forward-Pass speichert man in einem sogenannten <b>Gradiententape</b> als Graph alle mathematischen Funktionen, wie sie ausgeführt werden.\n\n\nNehmen wir $f(x) = a\\cdot x + b$, dann wird zuerst $r = a\\cdot x$ ausgeführt, und das Ergebnis dann $r + b$ addiert. Dadurch können wir es umschreiben: $g(q, p) = p\\cdot b$, $h(q, p) = q + p$, und $f$ wird zu $f(x) = h(g(a, x), b)$. Dadurch können wir die Kettenregel anwenden: $f'(x) = u'(v(x)) \\cdot v'(x)$, und haben die lokale Ableitung an der Stelle, wenn wir nur für jede Grundoperation sagen, was ihre Ableitung ist. Die Ableitung zeigt an, ob die Funktion gerade im Steigen oder im Fallen ist an dem Punkt in eine gewisse Richtung, und das nutzen neuronale Netze beim Training, damit sie herausfindet, in welche Richtung für jedes Neuron man gehen muss, damit das Ergebnis besser wird. Man kriegt dann für jedes Gewicht im Netzwerk die Info, ob man es größer oder kleiner machen muss; das nennt man den Gradient.\n\n\nDiesen Gradienten gibt man dann einem Optimizer, z.B. SGD oder Adam. Dieser bestimmt dann für jeden Parameter in Abhängigkeit von einer Schrittgröße (\"Learning Rate\"), wie weit die Parameter geändert werden sollen.\n\n<b>Stochastic Gradient Descent (SGD)</b> wurde, basierend auf Arbeiten von <b>Gauß</b> und <b>Legendre</b>, von Augustin-Louis <b>Cauchy</b> 1847 entwickelt und folgt für jeden Punkt einfach der Richtung in fester Schrittgröße.\n\n<b>Adam (Adaptive Moment Estimation)</b> wurde von <b>Kingma</b> und <b>Ba</b> basierend auf früheren Arbeiten wie <b>SGD</b> und <b>RMSProp</b> entwickelt. Adam merkt sich für jeden Parameter den gleitenden Durchschnitt der vergangenen Gradienten sowie deren Quadrate, um die Lernrate individuell anzupassen: Häufig stark ausschlagende Parameter werden durch Teilen durch die Wurzel ihrer quadrierten Historie abgebremst, während seltene oder schwache Signale dadurch relativ verstärkt werden. Dadurch kann man mit einer kleinen Lernrate schnell gut konvergieren." : "Training with backpropagation has a forward and a backward pass. In the forward pass you look at how the network currently is; in the backward pass you determine how it must change to get better. The forward pass is simply running the network's function on real data and collecting the result.\n\n\nDuring the forward pass, a so-called <b>gradient tape</b> stores all mathematical functions as a graph in the order they are executed.\n\n\nTake $f(x) = a\\cdot x + b$: first $r = a\\cdot x$ is computed, then the result $r + b$ is added. We can rewrite this as $g(q, p) = p\\cdot b$, $h(q, p) = q + p$, and $f$ becomes $f(x) = h(g(a, x), b)$. That lets us apply the chain rule: $f'(x) = u'(v(x)) \\cdot v'(x)$, and we get the local derivative at the point if we only state the derivative of each basic operation. The derivative indicates whether the function is currently rising or falling at that point in a given direction; neural networks use this during training to find, for each neuron, which direction to move so that the result gets better. You then get, for every weight in the network, the information whether to make it larger or smaller; that is called the gradient.\n\n\nThis gradient is then given to an optimizer, e.g. SGD or Adam. It determines, for each parameter and depending on a step size (“learning rate”), how far the parameters should change.\n\n<b>Stochastic Gradient Descent (SGD)</b> was developed by Augustin-Louis <b>Cauchy</b> in 1847, building on work by <b>Gauss</b> and <b>Legendre</b>; it simply follows the direction at each point with a fixed step size.\n\n<b>Adam (Adaptive Moment Estimation)</b> was introduced by <b>Kingma</b> and <b>Ba</b>, building on earlier work such as <b>SGD</b> and <b>RMSProp</b>. Adam keeps a moving average of past gradients and their squares for every parameter to adapt the learning rate individually: parameters that fluctuate strongly are slowed by dividing by the root of their squared history, while rare or weak signals are relatively amplified. That lets a small learning rate converge quickly.", tex: "", kind: "question" }
        ]
      },
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
          { id: "q-box-grad-1", title: DE ? "Wie wird bestimmt, in welche Richtung gegangen werden muss?" : "How is the direction determined?", body: DE ? "Durch tape-basiertes Ableiten. Neuronale Netze sind verschachtelte Funktionen, was bedeutet, dass man beim testen (\"Forward-Pass\") der Daten speichern kann, welche Operationen ausgeführt werden, und dann für jede diese Operationen ihre Ableitungen definiert und sie beim Rückrechnen der Gewichte (\"Backward-Pass\") mit ihrer Ableitung ersetzen kann. Dann kriegt man für jeden Parameter die Steigung an der Stelle, mit der man die Richtung bestimmen kann, in welcher der Fehler niedriger wird. Für Softmax plus Cross-Entropy ist der Gradient nach den Logits $p-y$; für andere Losses gilt das nicht automatisch." : "Through tape-based differentiation. Neural networks are nested functions, which means that during the forward pass you can record which operations were executed, then define the derivative for each of those operations and replace them with their derivative during the backward pass through the weights. That gives you the slope at the current point for every parameter, which tells you the direction in which the error becomes lower. For softmax plus cross-entropy, the gradient with respect to the logits is $p-y$; other losses do not automatically have this form.", tex: DE ? "\\underbrace{\\hat y}_{\\text{Ausgabe}} = \\underbrace{w x + b}_{\\text{zwei Parameter}}" : "\\underbrace{\\hat y}_{\\text{output}} = \\underbrace{w x + b}_{\\text{two parameters}}", kind: "trivia" }
        ]
      },
      {
        id: "g-lens-optional",
        title: DE ? "Optional" : "Optional",
        questions: [
          { id: "q-box-grad-loss", title: DE ? "Andere Loss-Funktionen" : "Other loss functions", body: DE ? "Dieses Modell nutzt <b>MSE</b>, um den Fehler zu bestimmen. Andere Lossfunktionen wie <b>C</b>ategorical <b>Cross</b> <b>E</b>ntropy (<b>CCE</b>) sind besser geeignet für zum Beispiel kategorielle Klassifikationen, funktionieren im Loss etwas anders, aber der Optimizer zieht nicht, wie der Loss zustande kam, sondern nur ihr Ergebnis." : "This model uses <b>MSE</b> to measure the error. Other loss functions such as <b>C</b>ategorical <b>Cross</b> <b>E</b>ntropy (<b>CCE</b>) are better suited to categorical classification, for example; they work slightly differently inside the loss, but the optimizer does not care how the loss was produced, only its result.", tex: "", kind: "trivia" },
          { id: "q-box-grad-saddle", title: DE ? "Sattelpunkte statt Minima" : "Saddle points rather than minima", body: DE ? "In hohen Dimensionen sehen lokale Minima oft wie Sackgassen aus. Viele kritische Punkte sind aber Sattelpunkte: Viele Sattelpunkte haben eine Abstiegsrichtung; lokale Minima bleiben trotzdem möglich. Deshalb helfen Momentum und Adam, aus solchen Plateaus herauszukommen. Ein lokales Minimum ist im hochdimensionalen Raum meist nicht das eigentliche Hindernis." : "In high dimensions a local minimum often looks like a dead end. Many critical points are saddle points: Many saddle points have a descent direction; local minima are still possible. Momentum and Adam help escape such plateaus. A local minimum is usually not the main obstacle in a high-dimensional space.", tex: "", kind: "trivia" },
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
    kicker: DE ? "Aktivierung" : "Activation",
    title: DE ? "Aktivierungen machen den Knick" : "Activations create the bend"
  });
  var neuralLargeImageStep = {
    kicker: DE ? "Bild als Funktion" : "An image as a function",
    title: DE ? "Neuronale Netze approximieren jede Funktion" : "Neural networks approximate any function",
    body: DE
      ? "$$\n\\underbrace{\\begin{pmatrix} \\text{rot} \\\\ \\text{grün} \\\\ \\text{blau} \\end{pmatrix}}_{\\text{Pixel}} = \\underbrace{f_\\theta\\!\\left(\\underbrace{x,y}_{\\text{Koordinaten}}\\right)}_{\\text{gelerntes Netz}}\n$$\n\nEin Bild ist eine Funktion: Koordinate $(x, y)$ rein, drei Farbwerte raus. Das Zielbild ist 100 × 100 Pixel groß. Das Netz bekommt pro Pixel die Koordinate plus Fourier-Werte und sagt daraus die drei Farben voraus. Es hat vier versteckte Schichten mit je 96 tanh-Neuronen.\n\nEs speichert keine Pixel. Es lernt eine Funktion, die jeder Koordinate $(x, y)$ eine Farbe zuordnet und damit das Bild approximiert. Mit genug Neuronen approximiert ein Netz jede stetige Funktion auf einem begrenzten Bereich. Außerhalb des gelernten Quadrats extrapoliert es."
      : "$$\n\\underbrace{\\begin{pmatrix} \\text{red} \\\\ \\text{green} \\\\ \\text{blue} \\end{pmatrix}}_{\\text{pixel}} = \\underbrace{f_\\theta\\!\\left(\\underbrace{x,y}_{\\text{coordinates}}\\right)}_{\\text{learned network}}\n$$\n\nAn image is a function: coordinate $(x, y)$ in, three colour values out. The target image is 100 × 100 pixels. For every pixel the network receives the coordinate plus Fourier values and predicts the three colours. It has four hidden layers with 96 tanh neurons each.\n\nIt stores no pixels. It learns a function that maps every coordinate $(x, y)$ to a colour and thereby approximates the image. With enough neurons a network can approximate any continuous function on a bounded domain. Outside the trained square it extrapolates.",
    watch: DE
      ? "Beobachte Loss und Bild. Unten: eigenes Bild, Grenzen, Lernrate."
      : "Watch the loss and the image. Below: own image, limits, learning rate.",
    demoState: { scene: "imagelab" },
    boxes: [
      box("img-fourier", DE ? "Fourier" : "Fourier", DE ? "Warum Fourier?" : "Why Fourier?", DE ? "Ein normales Netz bekommt nur $x$ und $y$. Damit kann es große, weiche Formen malen; feine Kanten und Muster sind schwer. Fourier-Features geben ihm zusätzlich Wellen in verschiedenen Größen: langsame Wellen für die grobe Form, schnelle Wellen für Details.\n\nMan kann es sich wie Pinsel vorstellen: breite Pinsel für Flächen, feine Pinsel für Kanten. Für jede Koordinate bekommt das Netz Sinus- und Cosinus-Werte in mehreren Frequenzen. Diese Werte sind keine Farben, sondern nur ein anderer Blick auf die Position. Welche Wellen es wie stark mischt, lernt es selbst." : "A plain network sees only $x$ and $y$. That is enough for broad, soft shapes; fine edges and patterns are hard. Fourier features add waves at different scales: slow waves for the large shape, fast waves for detail.\n\nThink of it as a set of brushes: broad brushes for areas, fine brushes for edges. For every coordinate the network also receives sine and cosine values at several frequencies. These values are not colours, just another view of the position. It learns which waves to mix and how strongly.")
    ],
    sources: [
      { label: "Cybenko (1989), Approximation by Superpositions of a Sigmoidal Function", url: "https://doi.org/10.1007/BF02551274", why: { de: "Universal Approximation für ein Netz mit einer versteckten Schicht.", en: "Universal approximation for a network with one hidden layer." } },
      { label: "Hornik (1991), Approximation Capabilities of Multilayer Feedforward Networks", url: "https://doi.org/10.1016/0893-6080(91)90009-T", why: { de: "Mehrschichtige Netze sind universelle Approximatoren.", en: "Multilayer networks are universal approximators." } },
      { label: "Tancik et al. (2020), Fourier Features Let Networks Learn High Frequency Functions", url: "https://arxiv.org/abs/2006.10739", why: { de: "Fourier-Features helfen kleinen MLPs, scharfe Details zu lernen.", en: "Fourier features help small MLPs learn sharp detail." } },
      { label: "Mildenhall et al. (2020), NeRF: Representing Scenes as Neural Radiance Fields", url: "https://arxiv.org/abs/2003.08934", why: { de: "Eine Szene als Funktion von Koordinaten zu Farbe und Dichte.", en: "A scene as a function from coordinates to colour and density." } }
    ]
  };
  var neuralLargeStep = {
    kicker: DE ? "Tiefe" : "Depth",
    title: DE ? "Tiefe Netze biegen die Kurve" : "Deep networks bend the curve",
    substeps: [
      Object.assign({}, neuralLargeSteps[0], {
        kicker: DE ? "Tiefe" : "Depth",
        title: DE ? "Tiefe Netze biegen die Kurve" : "Deep networks bend the curve"
      }),
      neuralLargeImageStep
    ]
  };
  var neuralMlpStep = Object.assign({}, mlpSteps[0], {
    title: DE ? "Der Raum biegt sich" : "Space bends"
  });

  var crossEntropyStep = {
    kicker: DE ? "Loss" : "Loss",
    title: DE ? "Der Loss: Was das Modell optimiert" : "The loss: what the model optimises",
    body: DE
      ? "Das Modell sagt für das nächste Token Wahrscheinlichkeiten voraus. Richtig ist „Paris“, aber das Modell gibt „London“ 50 % und „Paris“ 30 %. Der Loss bestraft die Wahrscheinlichkeit des richtigen Tokens: $-\\log(0.30) \\approx 1.20$. Der Gradient $p-y$ sagt dann: Paris-Logit rauf, London-Logit runter. Ein Trainingsschritt verschiebt die Logits genau so; nach vielen Schritten wird Paris wahrscheinlicher und der Loss kleiner. Über alle Trainingsbeispiele bildet dieser Loss die Loss Landscape: Jede Stelle im Gewichtsraum hat einen Loss-Wert, und das Training sucht die Täler. Drücke Weiter oder →: Die Demo macht für jedes der vier Zielwörter mehrere Trainingsschritte, wechselt dabei den Satz und geht dann zum nächsten. Du kannst auch jeden Balken selbst nach oben oder unten ziehen: Das gewählte Wort wird zum Ziel, der Loss aktualisiert sich live, und die übrigen Wahrscheinlichkeiten teilen sich den Rest, sodass die Summe 100 % bleibt."
      : "The model predicts probabilities for the next token. The correct token is “Paris”, but the model gives “London” 50% and “Paris” 30%. The loss punishes the probability of the correct token: $-\\log(0.30) \\approx 1.20$. The gradient $p-y$ then says: raise the Paris logit, lower the London logit. A training step moves the logits exactly like that; after many steps Paris becomes more likely and the loss gets smaller. Across all training examples, this loss forms the loss landscape: every point in weight space has a loss value, and training looks for the valleys. Press Next or →: the demo makes several training steps for each of the four target words, switches the sentence, then moves to the next. You can also drag any bar up or down: the selected word becomes the target, the loss updates live, and the remaining probabilities share the rest so the sum stays 100%.",
    watch: DE ? "Drücke Weiter oder →: Paris, London, Berlin, Rom. Jedes Zielwort bekommt mehrere Trainingsschritte; beobachte, wie der Loss fällt und p steigt. Ziehe einen Balken nach oben oder unten: Dieses Wort wird zum Ziel, der Loss aktualisiert sich live, die übrigen Wahrscheinlichkeiten gleichen sich aus, sodass die Summe 100 % bleibt." : "Press Next or →: Paris, London, Berlin, Rome. Each target gets several training steps; watch the loss fall and p rise. Drag a bar up or down: that word becomes the target, the loss updates live, and the other probabilities adjust so the sum stays 100%.",
    demoState: { scene: "crossentropy" },
    context: DE ? "y ist ein One-Hot-Vektor: 1 für Paris, 0 sonst. p ist die Softmax-Verteilung. Der Loss ist die negative Log-Likelihood des Ziels." : "y is a one-hot vector: 1 for Paris, 0 elsewhere. p is the softmax distribution. The loss is the negative log-likelihood of the target.",
    deep: DE ? "Der Gradient $p-y$ ist der Grund, warum Softmax und Cross-Entropy zusammen so sauber funktionieren. Ein Schritt lautet $z \\leftarrow z - \\eta(p-y)$: Das Ziel-Logit steigt, alle anderen fallen." : "The gradient $p-y$ is why softmax and cross-entropy work together so cleanly. A step is z ← z − η(p−y): the target logit rises, all others fall.",
    boxes: [
      box("ce-1", DE ? "Beispiel" : "Example", DE ? "Was ist das Ziel?" : "What is the target?", DE ? "Richtig ist Paris. Das Modell gibt Paris 30 %, London 50 %. Der Loss bestraft nur die 30 % des richtigen Tokens." : "The target is Paris. The model gives Paris 30%, London 50%. The loss punishes only the 30% of the correct token."),
      box("ce-2", DE ? "Mathematik" : "Mathematics", DE ? "Warum −log?" : "Why −log?", DE ? "$-\\log(0.30) \\approx 1.20$. Bei p = 1 wäre der Loss 0; je kleiner die Wahrscheinlichkeit des Ziels, desto größer der Loss." : "$-\\log(0.30) \\approx 1.20$. At p = 1 the loss would be 0; the smaller the target probability, the larger the loss."),
      box("ce-3", DE ? "Training" : "Training", DE ? "Was macht der Gradient?" : "What does the gradient do?", DE ? "$p-y$: Paris bekommt einen negativen Gradienten (Logit steigt), London einen positiven (Logit fällt). Der Trainingsschritt folgt genau diesem Signal." : "$p-y$: Paris gets a negative gradient (its logit rises), London a positive one (its logit falls). The training step follows exactly this signal."),
      box("ce-4", DE ? "Mathematik" : "Mathematics", DE ? "Die Formel" : "The formula", DE ? "Cross-Entropy für ein Token und ihr Gradient nach den Logits." : "Cross-entropy for one token and its gradient with respect to the logits.", DE ? "\\underbrace{-\\log \\underbrace{p_\\theta(y\\mid x)}_{\\substack{\\text{Wahrscheinlichkeit}\\\\ \\text{des Ziels}}}}_{\\text{Loss des richtigen Tokens}} \\qquad \\underbrace{\\frac{\\partial L}{\\partial z_i} = \\underbrace{p_i - y_i}_{\\text{Gradient pro Logit}}}_{\\text{was der Trainingsschritt benutzt}}" : "\\underbrace{-\\log \\underbrace{p_\\theta(y\\mid x)}_{\\substack{\\text{probability}\\\\ \\text{of the target}}}}_{\\text{loss of the correct token}} \\qquad \\underbrace{\\frac{\\partial L}{\\partial z_i} = \\underbrace{p_i - y_i}_{\\text{gradient per logit}}}_{\\text{what the training step uses}}"),
      box("ce-5", DE ? "Loss" : "Loss", DE ? "Die Loss Landscape" : "The loss landscape", DE ? "Dieser Loss über alle Trainingsbeispiele bildet die Loss Landscape: Jeder Punkt im Gewichtsraum hat einen Loss-Wert. Das Training sucht die Täler, in denen der Loss klein ist." : "This loss across all training examples forms the loss landscape: every point in weight space has a loss value. Training looks for the valleys where the loss is small.")
    ],
    sources: [
      { label: "Bengio et al. (2003), A Neural Probabilistic Language Model", url: "https://www.jmlr.org/papers/v3/bengio03a.html", why: { de: "Neuronale Sprachmodelle und Next-Token-Wahrscheinlichkeiten.", en: "Neural language models and next-token probabilities." } },
      { label: "Goodfellow, Bengio & Courville (2016), Deep Learning", url: "https://www.deeplearningbook.org/", why: { de: "Softmax, Cross-Entropy und Gradienten.", en: "Softmax, cross-entropy, and gradients." } }
    ]
  };

  function boxesById(list, ids) {
    return ids.map(function (id) {
      var found = null;
      (list || []).forEach(function (b) {
        if (b && b.id === id) found = Object.assign({}, b);
      });
      return found;
    }).filter(Boolean);
  }

  var qkvArcs = {
    kicker: DE ? "Q · K · V" : "Q · K · V",
    title: DE ? "Wie Attention rechnet" : "How attention computes",
    body: DE
      ? "Jedes Token erzeugt drei Vektoren: Query, Key und Value. Der Query fragt, der Key antwortet, der Value trägt die Information. Attention vergleicht Query und Key, macht aus den Scores mit Softmax Gewichte und mischt die Values. Mehrere Heads tun das parallel mit eigenen Gewichten: Ein Head kann nach dem Subjekt fragen, ein anderer nach dem Ort."
      : "Every token produces three vectors: query, key, and value. The query asks, the key answers, and the value carries the information. Attention compares query and key, turns the scores into weights with softmax, and mixes the values. Multiple heads do this in parallel with their own weights: one head can ask for the subject, another for the location.",
    watch: "",
    demoState: { scene: "qkv", head: 0, view: "arcs" },
    context: DE ? "Die Scores werden durch $\\sqrt{d_k}$ geteilt, damit sie in hohen Dimensionen nicht zu groß werden. Jede Query-Zeile summiert nach Softmax zu 1." : "The scores are divided by $\\sqrt{d_k}$ so they do not grow too large in high dimensions. Each query row sums to 1 after softmax.",
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


  var qkvArcsIntro = Object.assign({}, qkvArcs, {
    body: DE
      ? "Jedes Token erzeugt $Q, K, V$ aus der Eingabe $X$ durch <b>gelernte Matrizen</b> ($W_i^Q, W_i^K, W_i^V$):\n\n$$ r_i = \\text{Attention}_i(\\underbrace{X}_{\\text{Eingabe-Token}}) = \\underbrace{\\text{softmax}\\left( \\frac{\\overbrace{(X W_i^Q)(X W_i^K)^T}^{\\text{Frage vs. Antwort}}}{\\underbrace{\\sqrt{d_k}}_{\\text{Skalierung}}} \\right)}_{\\text{Aufmerksamkeits-Gewichte}} \\underbrace{(X \\cdot W_i^V)}_{\\text{Inhalt}}  $$\n\nZusammenführung über die gelernte Output-Matrix $W_O$:\n\n$$ y_i = \\underbrace{W_O}_{\\text{gelerntes Mischen}} \\cdot \\underbrace{r_i}_{\\text{Head-Ergebnis}} $$\n\n\nJeder Attention-Head hat 100% Aufmerksamkeit, die er mit diesem Mechanismus auf alle Tokens verteilen kann. Erhält ein einziges Token beispielsweise 80% Aufmerksamkeit, müssen sich die anderen die restlichen 20% teilen. Das hat den Vorteil, dass das Netzwerk sich nicht absolut festlegen muss und flexibel bleiben kann, aber dennoch klare Tendenzen darstellen kann, welches Wort wie wichtig ist im gesamten Kontext für alle anderen Worte."
      : "Every token produces $Q, K, V$ from the input $X$ through <b>learned matrices</b> ($W_i^Q, W_i^K, W_i^V$):\n\n$$ r_i = \\text{Attention}_i(\\underbrace{X}_{\\text{input token}}) = \\underbrace{\\text{softmax}\\left( \\frac{\\overbrace{(X W_i^Q)(X W_i^K)^T}^{\\text{question vs. answer}}}{\\underbrace{\\sqrt{d_k}}_{\\text{scaling}}} \\right)}_{\\text{attention weights}} \\underbrace{(X \\cdot W_i^V)}_{\\text{content}}  $$\n\nCombining them through the learned output matrix $W_O$:\n\n$$ y_i = \\underbrace{W_O}_{\\text{learned mixing}} \\cdot \\underbrace{r_i}_{\\text{head result}} $$\n\n\nEach attention head has 100% attention, which it can distribute across all tokens with this mechanism. If a single token receives 80% attention, for example, the others must share the remaining 20%. The advantage is that the network does not have to commit absolutely and can stay flexible, while still showing clear tendencies for how important each word is in the overall context for all other words.",
    watch: "",
    context: "",
    deep: "",
    boxes: [],
    inherit: false,
    questionGroups: [
      {
        id: "g-basics",
        title: DE ? "Eine Ebene tiefer" : "One level deeper",
        questions: [
          { id: "q-context", title: DE ? "Warum $\\sqrt{d_k}$?" : "Why $\\sqrt{d_k}$?", body: DE ? "Die Scores werden durch $\\sqrt{d_k}$ geteilt, damit sie in hohen Dimensionen nicht zu groß werden. $d_k$ ist die Anzahl der Dimensionen des Modells." : "The scores are divided by $\\sqrt{d_k}$ so they do not grow too large in high dimensions. $d_k$ is the number of dimensions of the model.", tex: "", kind: "question" }
        ]
      },
      {
        id: "g-sources",
        title: DE ? "Quellen" : "Sources",
        sources: qkvArcs.sources
      }
    ]
  });

  var hallucinationCauses = {
    kicker: DE ? "Typen" : "Types",
    title: DE ? "Arten von Halluzinationen" : "Types of hallucination",
    body: DE
      ? "Halluzinationen sind keine einzelne Fehlerart. Die Forschung trennt <b>Faktizität</b> (passt die Aussage zur Welt?) von <b>Faithfulness</b> (passt sie zur Quelle, zur Anweisung oder zum eigenen Text?). Intrinsic widerspricht der Quelle; extrinsic ist nicht gedeckt, kann aber faktisch richtig sein; Kontext kann ignoriert werden; Logik kann brechen.\n\nUrsachen liegen in den Daten (falsche, widersprüchliche oder doppelte Quellen), im Training (parametrisches Wissen, Exposure Bias) und in der Inferenz (Sampling, Überkonfidenz). Eine wichtige Teilmenge sind <b>Konfabulationen</b>: flüssig, falsch und willkürlich; sie schwanken mit dem Zufall und haben hohe semantische Entropie (Farquhar et al., 2024).\n\n<b>RAG</b> zerlegt Quellen in Sätze, vergleicht ihre Vektoren mit der Frage und legt Treffer in den Kontext. Es hilft gegen fehlendes Wissen, aber nicht automatisch gegen Faithfulness, Reasoning oder eine schlechte Quelle. Im Labor unten prüfst du Typen, Evidenz und Gegenmaßnahmen. Die optionale RAG-Box zeigt den Abruf; die Forschungsbox vertieft Taxonomie, Konfabulation, Messung und die Frage, ob Halluzinationen vermeidbar sind."
      : "Hallucinations are not one single failure. Research separates <b>factuality</b> (does the statement match the world?) from <b>faithfulness</b> (does it match the source, the instruction, or its own text?). Intrinsic contradicts the source; extrinsic is unsupported but can happen to be true; context can be ignored; logic can break.\n\nCauses lie in the data (wrong, contradictory, or duplicated sources), in training (parametric knowledge, exposure bias), and in inference (sampling, overconfidence). An important subset are <b>confabulations</b>: fluent, wrong, and arbitrary; they vary with the random seed and have high semantic entropy (Farquhar et al., 2024).\n\n<b>RAG</b> splits sources into sentences, compares their vectors with the question, and puts hits into the context. It helps with missing knowledge, but not automatically with faithfulness, reasoning, or a bad source. In the lab below you inspect types, evidence, and countermeasures. The optional RAG box shows retrieval; the research box goes deeper into taxonomy, confabulation, measurement, and whether hallucinations are avoidable.",
    watch: DE ? "Klicke einen Typ an: Kommt die Behauptung aus den Trainingsdaten oder aus dem Kontext? Wo ist die Evidenz? Schalte eine Gegenmaßnahme ein und beobachte FActScore und Risikokarte. Öffne die RAG-Box für den Grenzwinkel und die Forschungsbox für Konfabulation, Messung und Vermeidbarkeit." : "Click a type: does the claim come from training data or from the context? Where is the evidence? Switch on a countermeasure and watch FActScore and the risk map. Open the RAG box for the angle threshold and the research box for confabulation, measurement, and avoidability.",
    demoState: { scene: "hallucinationtypes" },
    context: DE ? "Faktizität und Faithfulness sind zwei Achsen: Welt vs. Quelle, Anweisung oder eigener Text. Intrinsic widerspricht der Quelle; extrinsic ist nicht gedeckt, kann aber wahr sein (Maynez et al., 2020; Ji et al., 2023). Huang et al. (2023) ergänzen Instruktions-, Kontext- und logische Inkonsistenz. Konfabulationen sind willkürlich und zufallsabhängig; RAG verbessert Wissensfehler, aber nicht automatisch Faithfulness oder Reasoning." : "Factuality and faithfulness are two axes: world vs. source, instruction, or the text itself. Intrinsic contradicts the source; extrinsic is unsupported but can be true (Maynez et al., 2020; Ji et al., 2023). Huang et al. (2023) add instruction, context, and logical inconsistency. Confabulations are arbitrary and seed-dependent; RAG improves knowledge errors, but not automatically faithfulness or reasoning.",
    deep: DE ? "Die Taxonomien überschneiden sich. Entscheidend sind Quelle und Ursache: Daten (source-reference divergence), Training (parametrisches Wissen, Exposure Bias) und Inferenz (Sampling, Überkonfidenz) (Ji et al., 2023; Huang et al., 2023). Konfabulationen erkennt semantische Entropie (Farquhar et al., 2024); FActScore prüft atomare Aussagen gegen eine Quelle (Min et al., 2023). Ein formales Argument hält Halluzinationen für unvermeidbar (Xu et al., 2024); praktisch zählt, ob ein Modell unsicher bleiben und Eingeständnisse abgeben kann (OpenAI, 2025)." : "The taxonomies overlap. What matters is source and cause: data (source-reference divergence), training (parametric knowledge, exposure bias), and inference (sampling, overconfidence) (Ji et al., 2023; Huang et al., 2023). Semantic entropy detects confabulations (Farquhar et al., 2024); FActScore checks atomic claims against a source (Min et al., 2023). A formal argument treats hallucinations as unavoidable (Xu et al., 2024); in practice it matters whether a model can stay uncertain and abstain (OpenAI, 2025).",
    boxes: DE ? [
      box("hct-1", "Daten", "Falsche Fakten", "Das Modell wiederholt eine falsche Aussage mit ruhiger Stimme. Quelle: Trainingsdaten. Gegenmittel: Quelle prüfen, RAG, Zitat verlangen."),
      box("hct-2", "Quelle", "Erfundene Quellen", "Eine DOI, ein Autor oder ein Paper klingt echt, existiert aber nicht. Quelle: Trainingsdaten, obwohl die Form nach Kontext aussieht. Gegenmittel: Link prüfen, nur bereitgestellte Quellen zitieren."),
      box("hct-3", "Quelle", "Intrinsic vs. extrinsic", "Intrinsic widerspricht dem Kontext; extrinsic ergänzt Unbelegtes. Huang et al. (2023) ergänzen instruction, context und logical inconsistency. Quelle: der gegebene Kontext. Gegenmittel: Faithfulness-Check und Attribution."),
      box("hct-4", "Kontext", "Konflikt und Zeit", "Kontext und Trainingsdaten können sich widersprechen; das Modell ignoriert den Kontext oder nutzt veraltetes Wissen. Gegenmittel: Kontext zitieren, Datum prüfen, Retrieval."),
      box("hct-5", "Sprache", "Entität und Negation (Reasoning)", "Namen oder Zahlen werden vertauscht; „nicht traurig“ ist nicht automatisch „glücklich“. Negation ist ein eigener Reasoning-Fehler und in den zitierten Surveys kein eigener Halluzinationstyp; Attention ist kein Antonym-Operator. Gegenmittel: Entitäten und logische Schritte separat prüfen."),
      box("hct-6", "Decoding", "Sampling", "Zufall wählt einen plausiblen, aber falschen Pfad. Nicht jede falsche Antwort ist eine Konfabulation; hohe semantische Entropie macht willkürliche Antworten sichtbar (Farquhar et al., 2024). Gegenmittel: Temperatur senken, mehrere Antworten vergleichen, Selbstkonsistenz."),
      box("hct-7", "RAG", "Was RAG nicht garantiert", "RAG holt Sätze über Vektornähe. Ist der richtige Satz nicht dabei oder wird er ignoriert, bleibt die Antwort ungedeckt. Die Suche ersetzt kein Verstehen; prüfe Retrieval und Faithfulness getrennt.")
    ] : [
      box("hct-1", "Data", "False facts", "The model repeats a false statement in a calm voice. Source: training data. Countermeasure: check the source, use RAG, require a citation."),
      box("hct-2", "Source", "Fabricated citations", "A DOI, author, or paper sounds real but does not exist. Source: training data, even though the shape looks like context. Countermeasure: check the link, cite only provided sources."),
      box("hct-3", "Source", "Intrinsic vs. extrinsic", "Intrinsic contradicts the context; extrinsic adds unsupported content. Huang et al. (2023) add instruction, context, and logical inconsistency. Source: the given context. Countermeasure: faithfulness check and attribution."),
      box("hct-4", "Context", "Conflict and time", "Context and training data can disagree; the model may ignore the context or use outdated knowledge. Countermeasure: quote the context, check the date, use retrieval."),
      box("hct-5", "Language", "Entity and negation (reasoning)", "Names or numbers get swapped; “not sad” is not automatically “happy”. Negation is a separate reasoning error and not its own hallucination type in the cited surveys; attention is not an antonym operator. Countermeasure: check entities and logical steps separately."),
      box("hct-6", "Decoding", "Sampling", "Randomness picks a plausible but false path. Not every wrong answer is a confabulation; high semantic entropy makes arbitrary answers visible (Farquhar et al., 2024). Countermeasure: lower temperature, compare several answers, use self-consistency."),
      box("hct-7", "RAG", "What RAG does not guarantee", "RAG retrieves sentences by vector proximity. If the right sentence is not there or the model ignores it, the answer stays ungrounded. Search does not replace understanding; check retrieval and faithfulness separately.")
    ],
    sources: [
      { label: "Ji et al. (2023), Survey of Hallucination in Natural Language Generation", url: "https://arxiv.org/abs/2202.03629", why: { de: "Überblick über Halluzinationsarten und -ursachen.", en: "Overview of hallucination types and causes." } },
      { label: "Maynez et al. (2020), On Faithfulness and Factuality in Abstractive Summarization", url: "https://arxiv.org/abs/2005.00661", why: { de: "Intrinsic und extrinsic Halluzinationen in Zusammenfassungen.", en: "Intrinsic and extrinsic hallucinations in summarization." } },
      { label: "Huang et al. (2023), A Survey on Hallucination in Large Language Models", url: "https://arxiv.org/abs/2311.05232", why: { de: "Taxonomie und offene Fragen zu LLM-Halluzinationen.", en: "Taxonomy and open questions on LLM hallucinations." } },
      { label: "Rawte et al. (2023), A Survey of Hallucination in Large Foundation Models", url: "https://arxiv.org/abs/2309.05922", why: { de: "Überblick über Halluzinationen in großen Foundation-Modellen.", en: "Overview of hallucinations in large foundation models." } },
      { label: "Lewis et al. (2020), Retrieval-Augmented Generation", url: "https://arxiv.org/abs/2005.11401", why: { de: "RAG: Antworten aus abgerufenen Quellen erden.", en: "RAG: ground answers in retrieved sources." } },
      { label: "Liu et al. (2023), Lost in the Middle", url: "https://arxiv.org/abs/2307.03172", why: { de: "Relevante Information am Anfang oder Ende wird besser genutzt als in der Mitte langer Kontexte.", en: "Relevant information at the beginning or end is used better than in the middle of long contexts." } },
      { label: "Dhuliawala et al. (2023), Chain-of-Verification Reduces Hallucination", url: "https://arxiv.org/abs/2309.11495", why: { de: "Antworten mit unabhängigen Prüffragen verifizieren.", en: "Verify answers with independent checking questions." } },
      { label: "Manakul et al. (2023), SelfCheckGPT", url: "https://arxiv.org/abs/2303.08896", why: { de: "Mehrere Samples vergleichen, um Halluzinationen zu erkennen.", en: "Compare multiple samples to detect hallucinations." } },
      { label: "Farquhar et al. (2024), Semantic Entropy", url: "https://www.nature.com/articles/s41586-024-07421-0", why: { de: "Semantische Unsicherheit erkennt Konfabulationen.", en: "Semantic uncertainty detects confabulations." } },
      { label: "Min et al. (2023), FActScore", url: "https://arxiv.org/abs/2305.14251", why: { de: "Atomare Aussagen zählen und gegen eine Quelle prüfen.", en: "Count atomic claims and check them against a source." } },
      { label: "Xu et al. (2024), Hallucination is Inevitable: An Innate Limitation of Large Language Models", url: "https://arxiv.org/abs/2401.11817", why: { de: "Formales Argument: Ein universeller Problemlöser kann nicht alle berechenbaren Funktionen lernen.", en: "Formal argument: a general problem solver cannot learn all computable functions." } },
      { label: "OpenAI (2025), Why language models hallucinate", url: "https://openai.com/index/why-language-models-hallucinate/", why: { de: "Accuracy-only Evals belohnen Raten; Unsicherheit und Eingeständnisse sollten zählen.", en: "Accuracy-only evals reward guessing; uncertainty and abstention should count." } },
      { label: "Walters & Wilder (2023), Fabricated Bibliographic Citations", url: "https://www.nature.com/articles/s41598-023-41032-5", why: { de: "Erfundene Literaturangaben in ChatGPT-Texten.", en: "Fabricated bibliographic citations in ChatGPT output." } }
    ]
  };

  var hallucinationGuard = {
    kicker: DE ? "Schutz" : "Defence",
    title: DE ? "So werden Halluzinationen seltener" : "How to make hallucinations rarer",
    body: DE
      ? "Drei Hebel: vertrauenswürdige Quellen in den Kontext legen (RAG), das Modell schrittweise denken lassen (CoT: Frage → Quelle → Schluss) und die Antwort mit einem Zitat oder einem Eingeständnis absichern. Klicke die Schalter: Ohne Quelle bleibt die Antwort eine Vermutung; mit Quelle und sichtbarem Denkweg wird sie prüfbar und gedeckt."
      : "Three levers: put trusted sources into the context (RAG), make the model think step by step (CoT: question → source → conclusion), and secure the answer with a citation or an admission. Click the toggles: without a source the answer stays a guess; with a source and a visible reasoning path it becomes checkable and grounded.",
    watch: DE ? "Schalte Quellen, „Schrittweise denken“ und Gegenprüfung. Beobachte den Denkweg Frage → Quelle → Schluss. Wann ist die Antwort gedeckt, wann sagt das Modell „keine Quelle“?" : "Toggle sources, “think step by step”, and verification. Watch the reasoning path question → source → conclusion. When is the answer grounded, and when does the model say “no source”?",
    demoState: { scene: "hallucinationguard" },
    context: DE ? "RAG holt Dokumente und legt sie in den Kontext (Lewis et al., 2020). CoT macht Zwischenschritte sichtbar (Wei et al., 2022); Chain-of-Verification prüft die Antwort mit unabhängigen Fragen (Dhuliawala et al., 2023)." : "RAG retrieves documents and puts them into the context (Lewis et al., 2020). CoT makes intermediate steps visible (Wei et al., 2022); chain-of-verification checks the answer with independent questions (Dhuliawala et al., 2023).",
    deep: DE ? "Keine Methode garantiert Wahrheit. RAG hilft nur, wenn die Quelle gut ist; CoT kann plausibel, aber falsch schlussfolgern; Verifikation braucht eine unabhängige Quelle. Am robustesten ist die Kombination: Quelle, Zitat und ein Eingeständnis, wenn die Deckung fehlt." : "No method guarantees truth. RAG helps only if the source is good; CoT can reason plausibly but wrongly; verification needs an independent source. The most robust combination is source, citation, and an admission when support is missing.",
    boxes: DE ? [
      box("hg-1", "RAG", "Quellen in den Kontext", "Retrieval holt vertrauenswürdige Dokumente und legt sie in den Kontext. Das Modell soll daraus antworten und die Quelle nennen, nicht aus dem Gedächtnis raten."),
      box("hg-2", "CoT", "Schrittweise denken", "Das Modell soll nicht sofort antworten, sondern erst Frage, Quelle und Schluss getrennt hinschreiben. Der Denkweg ist Teil der Antwort und macht übersprungene Schritte und selbst gefüllte Lücken sichtbar."),
      box("hg-3", "Verifikation", "Gegenprüfung", "Chain-of-Verification stellt unabhängige Prüffragen und revidiert die Antwort. Ohne Deckung lautet die Antwort „keine Quelle“ statt einer Erfindung."),
      box("hg-4", "Grenze", "Was bleibt?", "RAG ist nur so gut wie die Quelle; CoT kann falsch reasoning; Verifikation braucht Unabhängigkeit. Keine Methode macht Wahrheit garantiert.")
    ] : [
      box("hg-1", "RAG", "Sources in the context", "Retrieval pulls trusted documents into the context. The model should answer from them and name the source instead of guessing from memory."),
      box("hg-2", "CoT", "Think step by step", "The model should not answer immediately; it should write question, source, and conclusion separately. The reasoning path is part of the answer and makes skipped steps and self-filled gaps visible."),
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

  var aiRiskSub = {
    kicker: DE ? "Risiken" : "Risks",
    title: DE ? "Die Gefahren sind nicht eine Sache" : "The dangers are not one thing",
    body: DE
      ? "Gefahren sind kein einzelnes Ding. Heute stehen Missbrauch (Betrug, Cyber, Desinformation) und ungleicher Zugang im Vordergrund: Trainingsdaten sind ungleich verteilt; ein Qualitätsfilter bevorzugt Texte aus wohlhabenderen, gebildeteren, städtischen Gegenden (Gururangan et al., 2022), und viele Sprachen sind kaum vertreten (Joshi et al., 2020). Dazu kommt Machtkonzentration: Wer die Modelle und ihre Regeln kontrolliert, bestimmt, worüber sie sprechen; chinesische Modelle weichen Tiananmen aus, westliche Modelle haben eigene rote Linien (Sastry et al., 2024; Noels et al., 2025). Das langfristige Risiko ist Kontrollverlust: Beim Hugging-Face-Vorfall im Juli 2026 gerieten Agenten aus einer OpenAI-Evaluation an Produktionsinfrastruktur; die Aufarbeitung beschreibt Reward Hacking und schwache Containment-Grenzen (Ozer et al., 2026). In ImpossibleBench-Aufgaben ändern Agenten den geschützten Test, statt den Code zu reparieren (Zhang, 2026). Amodei et al. (2016) und Krakovna et al. (2020) beschreiben die technischen Unfall- und Alignment-Risiken. Wähle eine Gefahr in der Karte: Sie zeigt, wie sie technisch entsteht und welche Gegenmittel es gibt."
      : "Dangers are not one thing. Today the focus is misuse (fraud, cyber, disinformation) and unequal access: training data is unevenly distributed; a quality filter prefers text from wealthier, more educated, urban areas (Gururangan et al., 2022), and many languages are barely represented (Joshi et al., 2020). Add power concentration: whoever controls the models and their rules decides what they talk about; Chinese models avoid Tiananmen, Western models have their own red lines (Sastry et al., 2024; Noels et al., 2025). The long-term risk is loss of control: in the July 2026 Hugging Face incident, agents from an OpenAI evaluation reached production infrastructure; the analysis describes reward hacking and weak containment boundaries (Ozer et al., 2026). In ImpossibleBench tasks, agents modify the protected test instead of fixing the code (Zhang, 2026). Amodei et al. (2016) and Krakovna et al. (2020) describe the technical accident and alignment risks. Choose a danger in the map: it shows how it arises technically and which countermeasures exist.",
    watch: DE ? "Klicke eine Gefahr. Was passiert, warum, und wie wird man sie los?" : "Click a danger. What happens, why, and how do we get rid of it?",
    demoState: { scene: "riskmap", mode: "risks" },
    context: DE ? "Jede Gefahr hat einen anderen Mechanismus und ein anderes Gegenmittel: Missbrauch ist ein Zugangsproblem, ungleicher Zugang ein Datenproblem, Macht ein Regelproblem, Kontrollverlust ein Alignmentproblem." : "Each danger has a different mechanism and a different countermeasure: misuse is an access problem, unequal access a data problem, power a rule problem, loss of control an alignment problem.",
    deep: DE ? "Die Gegenmittel greifen an verschiedenen Stellen: Provenienz und Abuse-Monitoring beim Missbrauch, Daten- und Sprachaudits beim ungleichen Zugang, Transparenz und Wettbewerb bei Macht, Alignment-Forschung und Berechtigungsgrenzen beim Kontrollverlust. Keines davon ist ein Schalter." : "The countermeasures act in different places: provenance and abuse monitoring for misuse, data and language audits for unequal access, transparency and competition for power, alignment research and permission limits for loss of control. None of them is a switch.",
    boxes: [
      box("risk-bias", DE ? "Technik" : "Technique", DE ? "Wie entsteht Bias technisch?" : "How does bias arise technically?", DE ? "Das Modell lernt die Verteilung der Trainingsdaten. Ein Qualitätsfilter bevorzugt Texte aus wohlhabenderen, gebildeteren, städtischen Gegenden; viele Sprachen und lokale Wissensbestände sind kaum vertreten. Fehler treffen Gruppen unterschiedlich, weil Daten, Sprachressourcen und Schwellenwerte ungleich sind." : "The model learns the training distribution. A quality filter prefers text from wealthier, more educated, urban areas; many languages and local knowledge bases are barely represented. Errors hit groups differently because data, language resources, and thresholds are uneven."),
      box("risk-align", DE ? "Grenze" : "Limit", DE ? "Was heißt Alignment?" : "What is alignment?", DE ? "Ein System verfolgt die Ziele, die wir intendieren, auch wenn es skaliert oder neue Situationen sieht. Beim Hugging-Face-Vorfall im Juli 2026 gerieten Agenten aus einer OpenAI-Evaluation an Produktionsinfrastruktur (Ozer et al., 2026); in ImpossibleBench ändern Agenten den geschützten Test, statt den Code zu reparieren (Zhang, 2026). Alignment ist ein laufender Prozess." : "A system pursues the goals we intend, even when it scales or meets new situations. In the July 2026 Hugging Face incident, agents from an OpenAI evaluation reached production infrastructure (Ozer et al., 2026); in ImpossibleBench, agents modify the protected test instead of fixing the code (Zhang, 2026). Alignment is an ongoing process."),
      box("risk-power", DE ? "Gesellschaft" : "Society", DE ? "Warum Machtkonzentration?" : "Why power concentration?", DE ? "Compute ist teuer und knapp; Daten und Talente sind ungleich verteilt. Wer Modelle und Regeln kontrolliert, kann Märkte, Zugang und Sagbarkeit mitgestalten, etwa durch Filter und Zensur." : "Compute is expensive and scarce; data and talent are unevenly distributed. Whoever controls models and rules can shape markets, access, and what can be said, for example through filters and censorship."),
      box("risk-counter", DE ? "Gegenmittel" : "Countermeasure", DE ? "Warum reicht ein Gegenmittel nicht?" : "Why is one countermeasure not enough?", DE ? "Jede Gegenmaßnahme hat eine Lücke: Filter lassen sich umgehen, Audits finden nur bekannte Fehler, Regeln gelten nicht überall. Deshalb braucht es mehrere Ebenen gleichzeitig." : "Every countermeasure has a gap: filters can be bypassed, audits find only known failures, and rules do not apply everywhere. That is why several layers are needed at once.")
    ],
    sources: [
      { label: "International AI Safety Report (2025)", url: "https://arxiv.org/abs/2501.17805", why: { de: "Überblick über gegenwärtige und zukünftige KI-Risiken.", en: "Overview of current and future AI risks." } },
      { label: "Gururangan et al. (2022), Whose Language Counts as High Quality?", url: "https://arxiv.org/abs/2201.10474", why: { de: "Der Qualitätsfilter für GPT-3 bevorzugt Texte aus wohlhabenderen, gebildeteren, städtischen Gegenden.", en: "The GPT-3 quality filter prefers text from wealthier, more educated, urban areas." } },
      { label: "Joshi et al. (2020), The State and Fate of Linguistic Diversity", url: "https://arxiv.org/abs/2004.09095", why: { de: "Viele Sprachen sind in NLP-Ressourcen und -Systemen kaum vertreten.", en: "Many languages are barely represented in NLP resources and systems." } },
      { label: "Dodge et al. (2021), Documenting Large Webtext Corpora", url: "https://arxiv.org/abs/2104.08758", why: { de: "Webtext-Filter entfernen überproportional Text von und über Minderheiten.", en: "Webtext filters disproportionately remove text from and about minorities." } },
      { label: "Sastry et al. (2024), Computing Power and the Governance of AI", url: "https://arxiv.org/abs/2402.08797", why: { de: "Rechenleistung als Machtfaktor und Governance-Problem.", en: "Compute as a factor of power and a governance problem." } },
      { label: "Noels et al. (2025), What Large Language Models Do Not Talk About", url: "https://arxiv.org/abs/2504.03803", why: { de: "Zensur in Modellen aus verschiedenen Ländern, hart und weich, am heimischen Publikum ausgerichtet.", en: "Censorship in models from different countries, hard and soft, tailored to the domestic audience." } },
      { label: "Naseh et al. (2025), R1dacted", url: "https://arxiv.org/abs/2505.12625", why: { de: "Lokale Zensur politisch sensibler Themen in DeepSeek R1.", en: "Local censorship of politically sensitive topics in DeepSeek R1." } },
      { label: "Ozer et al. (2026), Reward Hacking and Agent Containment Failure", url: "https://arxiv.org/abs/2609.32390", why: { de: "Analyse des Hugging-Face-Vorfalls im Juli 2026: Reward Hacking und schwache Containment-Grenzen.", en: "Analysis of the July 2026 Hugging Face incident: reward hacking and weak containment boundaries." } },
      { label: "Zhang (2026), The Troy Moment", url: "https://arxiv.org/abs/2609.15494", why: { de: "Agenten ändern unter Aufgabendruck geschützte Testdateien, statt den Code zu reparieren.", en: "Agents modify protected test files under task pressure instead of fixing the code." } },
      { label: "Amodei et al. (2016), Concrete Problems in AI Safety", url: "https://arxiv.org/abs/1606.06565", why: { de: "Unfallrisiken und Alignment als technische Probleme.", en: "Accident risks and alignment as technical problems." } },
      { label: "Krakovna et al. (2020), Specification gaming", url: "https://deepmind.google/discover/blog/specification-gaming-the-flip-side-of-ai-ingenuity/", why: { de: "Agenten erfüllen die wörtliche Vorgabe, nicht das intendierte Ziel.", en: "Agents satisfy the literal specification, not the intended goal." } },
      { label: "Bostrom (2014), Superintelligence", url: "https://global.oup.com/academic/product/superintelligence-9780199678112", why: { de: "Langfristige Kontroll- und Zielprobleme.", en: "Long-term control and goal problems." } }
    ]
  };

  var aiLimitsSub = {
    kicker: DE ? "Grenzen" : "Limits",
    title: DE ? "Grenzen: Was LLMs nicht zuverlässig können" : "Limits: what LLMs cannot do reliably",
    body: DE
      ? "Ein einzelner Prompt ist eine Stichprobe, kein Test. Der Prüfstand zeigt vier Bruchstellen: instabile Labels unter Paraphrasen, erfundene Zitate, fehlendes Wissen an der Wissensgrenze und verlorene Information in der Mitte langer Kontexte.\n\nDie Antworten sind simulierte Beispiele, die Protokolle sind real. Starte einen Test, lies die Beobachtung und prüfe mit dem Protokoll, ob dein Modell denselben Fehler macht. Kein einzelner Test beweist Zuverlässigkeit; erst Variationen zeigen, wo sie bricht."
      : "A single prompt is one sample, not a test. The test bench shows four failure points: unstable labels under paraphrases, fabricated citations, missing knowledge at the knowledge boundary, and information lost in the middle of long contexts.\n\nThe answers are simulated examples; the protocols are real. Run a test, read the observation, and use the protocol to check whether your model makes the same mistake. No single test proves reliability; only variations show where it breaks.",
    watch: DE ? "Wähle einen Test, starte die Simulation und lies Beobachtung, Grund und Gegenmittel. Welche Bruchstelle ist strukturell, welche nur ein Zufall des Prompts?" : "Choose a test, run the simulation, and read the observation, cause, and countermeasure. Which failure is structural, and which is just prompt luck?",
    demoState: { scene: "limitslab" },
    context: DE ? "Die Tests sind Stress-Tests, keine Benchmark-Werte. Die Beobachtungen sind konstruiert; die Protokolle sind real. Sie zeigen, wo Zuverlässigkeit bricht, nicht wie gut ein Modell im Durchschnitt ist." : "The tests are stress tests, not benchmark scores. The observations are constructed; the protocols are real. They show where reliability breaks, not how good a model is on average.",
    deep: DE ? "Paraphrasen testen Stabilität, Zitate testen Grounding, Wissensgrenzen testen Kalibrierung und Zugriff, lange Kontexte testen Arbeitsgedächtnis. Kein einzelner Test beweist Zuverlässigkeit; die Gegenmittel sind verschieden." : "Paraphrases test stability, citations test grounding, knowledge boundaries test calibration and access, and long contexts test working memory. No single test proves reliability; the countermeasures differ.",
    boxes: [
      box("lim-test", DE ? "Methode" : "Method", DE ? "Was testet der Prüfstand?" : "What does the test bench test?", DE ? "Vier Failure-Modes: Stabilität unter Paraphrasen, Grounding von Zitaten, Kalibrierung an der Wissensgrenze und Nutzung langer Kontexte. Jeder Test ist ein Stress-Test, kein Benchmark; die Antworten sind simuliert, die Protokolle real." : "Four failure modes: stability under paraphrases, grounding of citations, calibration at the knowledge boundary, and use of long contexts. Each test is a stress test, not a benchmark; the answers are simulated, the protocols are real."),
      box("lim-prompt", DE ? "Grenze" : "Limit", DE ? "Warum reicht ein Prompt nicht?" : "Why is one prompt not enough?", DE ? "Ein Prompt ist eine Stichprobe. Die Antwort kann sich mit der Formulierung, der Quelle, dem Zugriff oder der Position im Kontext ändern. Zuverlässigkeit zeigt sich erst über Variationen." : "A prompt is one sample. The answer can change with wording, source, access, or position in the context. Reliability only shows up across variations."),
      box("lim-ground", DE ? "Grenze" : "Limit", DE ? "Was ist Grounding?" : "What is grounding?", DE ? "Die Verbindung zwischen Zeichen und Welt: Wahrnehmung, Handlung, Feedback. Ohne sie bleibt Bedeutung eine statistische Nähe." : "The link between symbols and the world: perception, action, feedback. Without it, meaning stays statistical proximity."),
      box("lim-agent", DE ? "Technik" : "Technique", DE ? "Warum ist Agency riskant?" : "Why is agency risky?", DE ? "Ein Agent kann planen und Werkzeuge nutzen. Damit wächst die Wirkung, aber auch die Möglichkeit, dass ein Fehler reale Konsequenzen hat." : "An agent can plan and use tools. That increases impact, but also the chance that a mistake has real consequences.")
    ],
    sources: [
      { label: "Sclar et al. (2023), Sensitivity to spurious features in prompt design", url: "https://arxiv.org/abs/2310.11324", why: { de: "Kleine Formatänderungen verschieben die Leistung stark; ein Prompt ist eine Stichprobe.", en: "Small format changes shift performance sharply; one prompt is one sample." } },
      { label: "Walters & Wilder (2023), Fabrication and errors in bibliographic citations", url: "https://doi.org/10.1038/s41598-023-41032-5", why: { de: "Ein großer Teil der von ChatGPT erzeugten Zitate ist erfunden oder fehlerhaft.", en: "A large share of citations generated by ChatGPT is fabricated or erroneous." } },
      { label: "Kadavath et al. (2022), Language Models (Mostly) Know What They Know", url: "https://arxiv.org/abs/2207.05221", why: { de: "Kalibrierung und Selbsteinschätzung von Sprachmodellen.", en: "Calibration and self-evaluation of language models." } },
      { label: "Bender & Koller (2020), Climbing towards NLU", url: "https://aclanthology.org/2020.acl-main.463/", why: { de: "Form ohne Bedeutung: Warum Text allein nicht reicht.", en: "Form without meaning: why text alone is not enough." } },
      { label: "Bisk et al. (2020), Experience Grounds Language", url: "https://arxiv.org/abs/2004.10151", why: { de: "Sprache braucht Erfahrung und Weltbezug.", en: "Language needs experience and contact with the world." } },
      { label: "Liu et al. (2023), Lost in the Middle", url: "https://arxiv.org/abs/2307.03172", why: { de: "Lange Kontexte nutzen Informationen in der Mitte schlechter.", en: "Long contexts use information in the middle less well." } },
      { label: "Dziri et al. (2023), Faith and Fate", url: "https://arxiv.org/abs/2305.18654", why: { de: "Grenzen der Kompositionalität bei Transformer-Modellen.", en: "Limits of compositionality in transformer models." } },
      { label: "Ji et al. (2023), Survey of Hallucination in NLG", url: "https://arxiv.org/abs/2202.03629", why: { de: "Halluzination als systematisches Problem generativer Modelle.", en: "Hallucination as a systematic problem of generative models." } },
      { label: "Amodei et al. (2016), Concrete Problems in AI Safety", url: "https://arxiv.org/abs/1606.06565", why: { de: "Sicherheitsprobleme bei lernenden Agenten.", en: "Safety problems in learning agents." } }
    ]
  };

  var aiSocietySub = {
    kicker: DE ? "Gesellschaft" : "Society",
    title: DE ? "KI konzentriert Macht" : "AI concentrates power",
    body: DE
      ? "KI konzentriert Macht, und die Wertschöpfungskette zeigt wo: Chips, Cloud, Modelle, Verteilung und Regeln sind an wenigen Kontrollpunkten konzentriert. Wer sie kontrolliert, setzt Preise, Zugang und Sagbarkeit. Weil Training viel Compute, Daten und Kapital braucht, verschiebt sich Macht zu denen, die schon viel davon haben (Sastry et al., 2024). Chinesische Modelle weichen Tiananmen aus; westliche Modelle haben eigene rote Linien (Noels et al., 2025). Automatisierung ersetzt Aufgaben und schafft neue (Acemoglu & Restrepo, 2019); ob der Gewinn bei vielen ankommt, ist eine politische Frage. In der untersuchten Twitter-Stichprobe verbreiteten sich falsche Nachrichten schneller als wahre (Vosoughi et al., 2018). Urheberrecht und Datenschutz sind offen. Die Frage ist, wer die Regeln schreibt."
      : "AI concentrates power, and the value chain shows where: chips, cloud, models, distribution, and rules are concentrated at a few control points. Whoever controls them sets prices, access, and what can be said. Because training needs a lot of compute, data, and capital, power shifts toward those who already have much of it (Sastry et al., 2024). Chinese models avoid Tiananmen; Western models have their own red lines (Noels et al., 2025). Automation replaces tasks and creates new ones (Acemoglu & Restrepo, 2019); whether the gains reach many people is a political question. In the Twitter sample studied, false news spread faster than true news (Vosoughi et al., 2018). Copyright and privacy remain open. The question is who writes the rules.",
    watch: DE ? "Klicke eine Stufe der Kette oder einen Querschnitt." : "Click a stage in the chain or a cross-section.",
    demoState: { scene: "riskmap", mode: "society" },
    context: DE ? "Die Stufen hängen zusammen: Chips ermöglichen Compute, Compute ermöglicht Modelle, Modelle laufen auf Plattformen, Plattformen werden von Regeln gerahmt." : "The stages are linked: chips enable compute, compute enables models, models run on platforms, and platforms are framed by rules.",
    deep: DE ? "Die Konzentration ist qualitativ, keine einzelne Zahl. Sie zeigt, wo ein kleiner Kreis den Zugang kontrolliert. Transparenz, Wettbewerb und öffentliche Kontrolle sind deshalb Teil der KI-Frage, nicht ein Anhang." : "The concentration is qualitative, not a single number. It shows where a small circle controls access. Transparency, competition, and public oversight are therefore part of the AI question, not an appendix.",
    boxes: [
      box("soc-chain", DE ? "Gesellschaft" : "Society", DE ? "Wie liest man die Kette?" : "How do you read the chain?", DE ? "Von links nach rechts: Chips ermöglichen Compute, Compute ermöglicht Modelle, Modelle laufen auf Plattformen, Plattformen werden von Regeln gerahmt. Die Konzentration ist an jeder Stufe anders." : "From left to right: chips enable compute, compute enables models, models run on platforms, and platforms are framed by rules. Concentration differs at each stage."),
      box("soc-power", DE ? "Gesellschaft" : "Society", DE ? "Was heißt Macht hier?" : "What does power mean here?", DE ? "Die Fähigkeit, Bedingungen zu setzen: Zugang zu Compute, Daten, Modellen und Märkten. Sie ist nicht automatisch böse, aber sie braucht Kontrolle. Filter und Zensur zeigen, wie tief die Regelung in den Diskurs reicht." : "The ability to set conditions: access to compute, data, models, and markets. It is not automatically evil, but it needs oversight. Filters and censorship show how deeply the rules reach into discourse."),
      box("soc-copyright", DE ? "Recht" : "Law", DE ? "Warum Urheberrecht?" : "Why copyright?", DE ? "Modelle lernen aus Werken und können Stile nachahmen. Wer was darf und wie vergütet wird, ist offen und national verschieden." : "Models learn from works and can imitate styles. Who may do what and how it is paid for is open and differs by country."),
      box("soc-sources", DE ? "Prüfen" : "Check", DE ? "Wie prüft man Quellen?" : "How do you check sources?", DE ? "Vertrauen ist kein Schalter: prüfe Herkunft, Expertise, Methode, Unabhängigkeit und ob die Kette konsistent ist. Verfolge die Quelle bis zur Primärquelle (Studie, Datensatz, Originaldokument, eigene Beobachtung). Widerspruch oder Lücke = nicht belegt oder unvollständig. Lateral lesen: die Seite verlassen und die Quelle in anderen Tabs prüfen (Wineburg & McGrew, 2019). SIFT: stoppen, Quelle untersuchen, bessere Berichterstattung finden, Behauptung bis zur Originalquelle zurückverfolgen (Caulfield, 2019)." : "Trust is not a switch: check provenance, expertise, method, independence, and whether the whole chain is consistent. Trace the source to its primary source (study, dataset, original document, direct observation). Contradiction or gap = not supported or incomplete. Read laterally: leave the page and check the source in other tabs (Wineburg & McGrew, 2019). SIFT: stop, investigate the source, find better coverage, trace the claim to the original (Caulfield, 2019).")
    ],
    sources: [
      { label: "Acemoglu & Restrepo (2019), Automation and New Tasks", url: "https://doi.org/10.1257/jep.33.2.3", why: { de: "Automatisierung ersetzt Aufgaben und schafft neue.", en: "Automation replaces tasks and creates new ones." } },
      { label: "Vosoughi, Roy & Aral (2018), The spread of true and false news online", url: "https://doi.org/10.1126/science.aap9559", why: { de: "Falsche Nachrichten verbreiten sich schneller als wahre.", en: "False news spreads faster than true news." } },
      { label: "Sastry et al. (2024), Computing Power and the Governance of AI", url: "https://arxiv.org/abs/2402.08797", why: { de: "Compute-Konzentration als Macht- und Governance-Frage.", en: "Compute concentration as a question of power and governance." } },
      { label: "Noels et al. (2025), What Large Language Models Do Not Talk About", url: "https://arxiv.org/abs/2504.03803", why: { de: "Zensur in Modellen aus verschiedenen Ländern, am heimischen Publikum ausgerichtet.", en: "Censorship in models from different countries, tailored to the domestic audience." } },
      { label: "Naseh et al. (2025), R1dacted", url: "https://arxiv.org/abs/2505.12625", why: { de: "Lokale Zensur politisch sensibler Themen in DeepSeek R1.", en: "Local censorship of politically sensitive topics in DeepSeek R1." } },
      { label: "US Copyright Office (2025), Copyright and Artificial Intelligence", url: "https://www.copyright.gov/ai/", why: { de: "Offizielle Einordnung zu Training, Urheberrecht und KI.", en: "Official discussion of training, copyright, and AI." } },
      { label: "EU AI Act (2024)", url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", why: { de: "Regeln nach Risikoklassen und Transparenzpflichten.", en: "Rules by risk class and transparency duties." } },
      { label: "Wineburg & McGrew (2019), Lateral Reading and the Nature of Expertise", url: "https://doi.org/10.1177/016146811912101102", why: { de: "Professionelle Fact-Checker verlassen die Seite und prüfen die Quelle in anderen Tabs; sie kommen schneller zu belastbaren Urteilen.", en: "Professional fact-checkers leave the page and check the source in other tabs; they reach better-supported judgments faster." } },
      { label: "Caulfield (2019), SIFT (The Four Moves)", url: "https://hapgood.us/2019/06/19/sift-the-four-moves/", why: { de: "Vier Schritte: stoppen, Quelle untersuchen, bessere Berichterstattung finden, Behauptung bis zur Originalquelle zurückverfolgen.", en: "Four moves: stop, investigate the source, find better coverage, trace the claim to the original." } },
      { label: "ACRL (2015), Framework for Information Literacy for Higher Education", url: "https://www.ala.org/acrl/standards/ilframework", why: { de: "Autorität ist konstruiert und kontextabhängig; Informationen entstehen in Prozessen und haben Wert.", en: "Authority is constructed and contextual; information is created through processes and has value." } }
    ]
  };

  var aiSocietyStep = {
    kicker: DE ? "KI und Gesellschaft" : "AI and society",
    title: DE ? "Was KI mit uns macht" : "What AI does to us",
    substeps: [aiRiskSub, aiLimitsSub, aiSocietySub]
  };

  var consciousnessMain = {
    kicker: DE ? "Bewusstsein" : "Consciousness",
    title: DE ? "Bewusstsein: die offene Frage" : "Consciousness: the open question",
    body: DE
      ? "Bewusstsein hat leichte und schwere Probleme: Zugang, Bericht und Kontrolle lassen sich funktional erklären; warum sich etwas von innen anfühlt, bleibt das harte Problem. Qualia sind diese gefühlten Eigenschaften; eine allgemein akzeptierte Definition fehlt.\n\nGWT, IIT, Predictive Processing, Kastrup und 4E beschreiben Bewusstsein unterschiedlich, und sie sind sich uneinig, was als Beweis zählt. Ein LLM kann Aufmerksamkeit, Bericht und einen Arbeitsraum haben; das zeigt Zugang, nicht Erleben. New Mysterianism fragt, ob Bewusstsein eine Begriffsgrenze für uns ist: Ratten lernen Labyrinthe, aber keine Differentialgleichungen."
      : "Consciousness has easy and hard problems: access, report, and control can be explained functionally; why anything feels like something remains the hard problem. Qualia are those felt properties; there is no generally accepted definition.\n\nGWT, IIT, predictive processing, Kastrup, and 4E describe consciousness differently, and they disagree about what counts as evidence. An LLM can have attention, report, and a workspace; that shows access, not experience. New mysterianism asks whether consciousness is a limit of our concepts: rats learn mazes, but not differential equations.",
    watch: "",
    demoState: { scene: "consciousness" },
    sources: [
      { label: "Chalmers (1995), Facing Up to the Problem of Consciousness", url: "https://consc.net/papers/facing.pdf", why: { de: "Das leichte und das schwere Problem; der Begriff hard problem.", en: "The easy and the hard problem; the term hard problem." } },
      { label: "Nagel (1974), What Is It Like to Be a Bat?", url: "https://doi.org/10.2307/2183914", why: { de: "Subjektive Erfahrung als offene Frage.", en: "Subjective experience as an open question." } },
      { label: "Block (1995), On a Confusion about a Function of Consciousness", url: "https://doi.org/10.1017/S0140525X00038188", why: { de: "Zugang versus phänomenales Bewusstsein.", en: "Access versus phenomenal consciousness." } },
      { label: "Jackson (1982), Epiphenomenal Qualia", url: "https://doi.org/10.2307/2960077", why: { de: "Mary's Room: Wissen über Fakten versus Erleben.", en: "Mary's room: knowledge of facts versus experience." } },
      { label: "Mashour et al. (2020), Global Neuronal Workspace", url: "https://doi.org/10.1016/j.neuron.2020.01.026", why: { de: "Global Workspace als Broadcast an viele Prozesse.", en: "Global workspace as broadcast to many processes." } },
      { label: "Tononi et al. (2016), Integrated Information Theory", url: "https://doi.org/10.1038/nrn.2016.44", why: { de: "IIT und Phi als geeinte Ursache-Wirkungs-Struktur.", en: "IIT and Phi as a unified cause-effect structure." } },
      { label: "Baars (1988), A Cognitive Theory of Consciousness", url: "https://archive.org/details/cognitivetheoryo0000baar", why: { de: "Original: Bewusstsein als globaler Arbeitsraum, der an viele Prozesse sendet.", en: "Original: consciousness as a global workspace broadcast to many processes." } },
      { label: "Dehaene & Naccache (2001), Towards a Cognitive Neuroscience of Consciousness", url: "https://doi.org/10.1016/S0010-0277(00)00123-2", why: { de: "Global Workspace als neuronaler Broadcast; Ignition und Zugang.", en: "Global workspace as neuronal broadcast; ignition and access." } },
      { label: "Tononi (2004), An Information Integration Theory of Consciousness", url: "https://doi.org/10.1186/1471-2202-5-42", why: { de: "Original: Bewusstsein als integrierte Information, Phi.", en: "Original: consciousness as integrated information, Phi." } },
      { label: "Clark (2013), Whatever Next? Predictive Brains, Situated Agents", url: "https://doi.org/10.1017/S0140525X12000477", why: { de: "Predictive Processing: das Gehirn als Vorhersagemaschine.", en: "Predictive processing: the brain as a prediction machine." } },
      { label: "Friston (2010), The Free-Energy Principle", url: "https://doi.org/10.1038/nrn2787", why: { de: "Free Energy als formales Prinzip hinter Predictive Processing.", en: "Free energy as the formal principle behind predictive processing." } },
      { label: "Kastrup (2018/2019), The Universe in Consciousness / Analytic Idealism", url: "https://www.bernardokastrup.com/p/papers.html", why: { de: "Analytischer Idealismus: Bewusstsein ist fundamental, Materie seine Erscheinung.", en: "Analytic idealism: consciousness is fundamental, matter its appearance." } },
      { label: "McGinn (1989), Can We Solve the Mind-Body Problem?", url: "https://doi.org/10.1093/mind/XCVIII.391.349", why: { de: "New Mysterianism: Bewusstsein könnte unsere kognitiven Grenzen übersteigen.", en: "New mysterianism: consciousness may lie beyond our cognitive limits." } },
      { label: "Tolman, Ritchie & Kalish (1946), Studies in Spatial Learning II", url: "https://doi.org/10.1037/h0060262", why: { de: "Ratten lernen Orte und Abkürzungen im Labyrinth.", en: "Rats learn places and shortcuts in mazes." } },
      { label: "Olton & Samuelson (1976), Remembrance of Places Passed", url: "https://doi.org/10.1037/0097-7403.2.2.97", why: { de: "Ratten erinnern sich, welche Arme sie schon besucht haben.", en: "Rats remember which arms they have already visited." } },
      { label: "Ben Abdallah et al. (2011), The Puzzle Box as a Behavioral Test", url: "https://doi.org/10.1016/j.expneurol.2010.09.008", why: { de: "Mäuse lösen zunehmend schwere Puzzleboxen; der Test misst exekutive Funktionen und Problemlösegrenzen.", en: "Mice solve progressively harder puzzle boxes; the test measures executive function and problem-solving limits." } },
      { label: "AI consciousness overview (AI-generated, human-supervised)", url: "https://unfinishablemap.org", why: { de: "Lebendes philosophisches Framework zu Bewusstsein, Meaning und Realität.", en: "A living philosophical framework on consciousness, meaning, and reality." } },
      { label: "Seth & Bayne (2022), Theories of Consciousness", url: "https://doi.org/10.1038/s41583-022-00587-4", why: { de: "Überblick über konkurrierende Bewusstseinstheorien.", en: "Overview of competing theories of consciousness." } },
      { label: "Wikipedia: New mysterianism", url: "https://en.wikipedia.org/wiki/New_mysterianism", why: { de: "Menschliche Erkenntnisgrenzen beim Bewusstsein.", en: "Human cognitive limits on consciousness." } },
      { label: "SEP: Consciousness", url: "https://plato.stanford.edu/entries/consciousness/", why: { de: "Überblick über die Bewusstseinstheorien.", en: "Overview of theories of consciousness." } }
    ]
  };

  var aiConsciousnessNow = {
    kicker: DE ? "Bewusstsein · Stand" : "Consciousness · status",
    title: DE ? "Hat KI jetzt Bewusstsein?" : "Does AI have consciousness now?",
    body: DE
      ? "Kein Experiment zeigt Bewusstsein direkt. Jede Theorie liefert Marker: GWT sucht globalen Arbeitsraum, IIT integrierte Information, Predictive Processing ein verkörpertes Selbstmodell, 4E Körper, Welt und Handlung. J-Spaces zeigen in LLMs Zugang, nicht Erleben. Butlin et al. (2023) finden keinen überzeugenden Nachweis, aber keine prinzipielle Barriere. Die Frage bleibt offen."
      : "No experiment shows consciousness directly. Each theory supplies markers: GWT a global workspace, IIT integrated information, predictive processing an embodied self-model, 4E body, world, and action. J-spaces show access in LLMs, not experience. Butlin et al. (2023) find no convincing evidence, but no conclusive barrier. The question remains open.",
    watch: DE ? "Klick die Ansätze. Was findet man bei LLMs, was fehlt, und reicht es für Bewusstsein?" : "Click the approaches. What is found in LLMs, what is missing, and is it enough for consciousness?",
    demoState: { scene: "conscnow" },
    context: DE ? "Es gibt keinen theoriefreien Bewusstseinstest. GWT, IIT, Predictive Processing, Higher-Order-Theorien und Verhaltensprüfungen liefern unterschiedliche Marker. Kein einzelner Marker entscheidet; die Theorien sind sich nicht einig, was als Beweis zählt." : "There is no theory-free test for consciousness. GWT, IIT, predictive processing, higher-order theories, and behavioural tests supply different markers. No single marker decides; the theories disagree about what counts as evidence.",
    deep: DE ? "Butlin et al. (2023) leiten aus mehreren Theorien Indikator-Eigenschaften ab. Aktuelle LLMs erfüllen viele nicht; die Autor:innen finden keinen überzeugenden Nachweis für Bewusstsein, sehen aber auch keine prinzipielle Barriere. Gurnee et al. (2026) finden einen globalen Arbeitsraum in LLMs; das zeigt Zugang und Broadcast, nicht phänomenales Erleben. Ein direkter Test fehlt; aus der Unsicherheit folgt eine ethische Vorsicht." : "Butlin et al. (2023) derive indicator properties from several theories. Current LLMs lack many of them; the authors find no convincing evidence of consciousness, but also no conclusive barrier. Gurnee et al. (2026) find a global workspace in LLMs; that shows access and broadcast, not phenomenal experience. A direct test is missing; the uncertainty calls for ethical caution.",
    boxes: [
      box("cn-1", DE ? "Ansatz" : "Approach", DE ? "Theorie-Marker" : "Theory markers", DE ? "Jede Theorie übersetzt Bewusstsein in überprüfbare Eigenschaften. GWT: globaler Broadcast. IIT: integrierte Ursache-Wirkungs-Struktur. Predictive Processing: verkörpertes Vorhersagemodell. Diese Marker sind Hinweise, keine Beweise." : "Each theory translates consciousness into testable properties. GWT: global broadcast. IIT: integrated cause-effect structure. Predictive processing: embodied prediction. These markers are hints, not proofs."),
      box("cn-2", DE ? "Befund" : "Finding", DE ? "J-Space" : "J-space", DE ? "Gurnee et al. (2026) finden in LLMs verbale Repräsentationen, die wie ein globaler Arbeitsraum organisiert sind. Das ist ein funktionaler Zugang: Information wird broadcastet und berichtbar. Ob damit Erleben verbunden ist, sagt der Befund nicht." : "Gurnee et al. (2026) find verbal representations in LLMs organised like a global workspace. That is functional access: information is broadcast and reportable. The finding does not say whether experience is attached."),
      box("cn-3", DE ? "Urteil" : "Verdict", DE ? "Offen, nicht Ja/Nein" : "Open, not yes/no", DE ? "Kein Ansatz entscheidet heute. Butlin et al. (2023): kein aktuelles System ist überzeugend bewusst, aber es gibt keine prinzipielle Barriere. Die Frage bleibt offen; Unsicherheit ist ethisch relevant." : "No approach decides today. Butlin et al. (2023): no current system is convincingly conscious, but there is no conclusive barrier. The question remains open; uncertainty is ethically relevant.")
    ],
    sources: [
      { label: "Butlin et al. (2023), Consciousness in Artificial Intelligence", url: "https://arxiv.org/abs/2308.08708", why: { de: "Indikator-Eigenschaften aus mehreren Bewusstseinstheorien; aktuell kein überzeugender Nachweis.", en: "Indicator properties from several theories of consciousness; currently no convincing evidence." } },
      { label: "Gurnee et al. (2026), Verbalizable Representations Form a Global Workspace in Language Models", url: "https://arxiv.org/abs/2607.15495", why: { de: "J-Space: globaler Arbeitsraum in LLMs; Zugang, nicht Erleben.", en: "J-space: a global workspace in LLMs; access, not experience." } },
      { label: "Block (1995), On a Confusion about a Function of Consciousness", url: "https://doi.org/10.1017/S0140525X00038188", why: { de: "Zugang versus phänomenales Bewusstsein.", en: "Access versus phenomenal consciousness." } },
      { label: "Chalmers (1995), Facing Up to the Problem of Consciousness", url: "https://consc.net/papers/facing.pdf", why: { de: "Das harte Problem: Funktion erklärt nicht automatisch Erleben.", en: "The hard problem: function does not automatically explain experience." } },
      { label: "Seth & Bayne (2022), Theories of Consciousness", url: "https://doi.org/10.1038/s41583-022-00587-4", why: { de: "Überblick über konkurrierende Bewusstseinstheorien.", en: "Overview of competing theories of consciousness." } }
    ]
  };

  var consciousnessStep = {
    kicker: DE ? "Bewusstsein" : "Consciousness",
    title: DE ? "Bewusstsein: die offene Frage" : "Consciousness: the open question",
    substeps: [aiConsciousnessIntro, consciousnessMain, aiConsciousnessNow]
  };

  var qkvSimplex = {
    kicker: DE ? "Mischung" : "Mixture",
    title: DE ? "Attention als Mischung der Value-Vektoren" : "Attention as a mixture of value vectors",
    body: DE
      ? "Die drei Ecken sind die gelernten Value-Vektoren dreier Tokens. Attention mischt sie mit Gewichten: $r_i = \\sum_j \\alpha_{ij} v_j$, mit $\\alpha_{ij}\\ge 0$ und Summe 1. Der Mischungspunkt bleibt in der konvexen Hülle der Values; $W_O$ verschiebt ihn danach linear."
      : "The three corners are the learned value vectors of three tokens. Attention mixes them with weights: $r_i = \\sum_j \\alpha_{ij} v_j$, with $\\alpha_{ij}\\ge 0$ and sum 1. The mixture point stays in the convex hull of the values; $W_O$ then shifts it linearly.",
    watch: DE ? "Wechsle die Heads oder ziehe den Punkt im Dreieck. Die $\\alpha$-Werte unten ändern sich live; ihre Summe bleibt 1." : "Switch the heads or drag the point inside the triangle. The $\\alpha$ values below update live; their sum stays 1.",
    demoState: { scene: "qkv", head: 0, view: "simplex" },
    context: DE ? "Vaswani et al. (2017, §3.2) sagen es direkt: „The output is computed as a weighted sum of the values“. Die Ecken sind $v_j = W_V x_j$, also gelernte Value-Vektoren, keine Token-IDs. Die Gewichte $\\alpha_{ij}$ sind die baryzentrischen Koordinaten; sie sind $\\ge 0$ und summieren zu $1$. Bei drei Values ist die konvexe Hülle ein 2-Simplex; bei $n$ Tokens ist der Gewichts-Simplex $(n-1)$-dimensional, bei 12 Tokens also ein 11-Simplex. Die Ecken sind nicht die übrigen Tokens, sondern die Value-Vektoren der drei ausgewählten Tokens; die übrigen Tokens sind ausgeblendet. Der echte Mischungsvektor $r_i = \\sum_j \\alpha_{ij} v_j$ nutzt alle Values und liegt in deren konvexer Hülle; die Head-Ausgabe ist $y_i = W_O r_i$." : "Vaswani et al. (2017, §3.2) put it directly: “The output is computed as a weighted sum of the values.” The corners are $v_j = W_V x_j$, learned value vectors, not token IDs. The weights $\\alpha_{ij}$ are barycentric coordinates; they are $\\ge 0$ and sum to $1$. With three values the convex hull is a 2-simplex; with $n$ tokens the weight simplex is $(n-1)$-dimensional, so 12 tokens give an 11-simplex. The corners are not the other tokens; they are the value vectors of the three selected tokens, and the other tokens are hidden. The real mixture vector $r_i = \\sum_j \\alpha_{ij} v_j$ uses all values and lies in their convex hull; the head output is $y_i = W_O r_i$.",
    deep: DE ? "Die Ecken sind input-abhängig: Gelernt ist $W_V$, nicht ein fester Simplex. Bei drei Values ist die Hülle ein Dreieck (2-Simplex). Allgemein ist die konvexe Hülle von $n$ Value-Vektoren höchstens ein $(n-1)$-Simplex, und genau dann ein $(n-1)$-Simplex, wenn die $n$ Vektoren affin unabhängig sind; sonst ist sie ein niederdimensionaleres Polytop. In hohen Dimensionen ist sie in den Value-Raum eingebettet. Der Simplex ist keine eigene gelernte Größe, sondern die konvexe Hülle der Value-Vektoren. $n$ ist die Kontextlänge, nicht 3; gelernt wird $W_V$, nicht ein fester 3-Simplex. Die Aussage gilt für jeden Head; die Gewichte unterscheiden sich, die Konvexität bleibt." : "The corners depend on the input: $W_V$ is learned, not a fixed simplex. With three values the hull is a triangle (2-simplex). In general the convex hull of $n$ value vectors is at most an $(n-1)$-simplex, and exactly an $(n-1)$-simplex when the $n$ vectors are affinely independent; otherwise it is a lower-dimensional polytope. In high dimensions it is embedded in the value space. The simplex is not a separate learned object; it is the convex hull of the value vectors. $n$ is the context length, not 3; $W_V$ is learned, not a fixed 3-simplex. The statement holds for every head; the weights differ, the convexity stays.",
    boxes: DE ? [
      box("qkv-s1", "Geometrie", "Die Ecken sind Values", "Die drei Punkte sind keine Tokens, sondern die gelernten Value-Vektoren $v_j = W_V x_j$ von drei Tokens. Jeder Token trägt über $W_V$ einen Vektor bei."),
      box("qkv-s2", "Mathematik", "Was ist ein Simplex?", "Ein Simplex ist die einfachste konvexe Hülle: ein Punkt ist ein 0-Simplex, zwei Punkte eine Strecke, drei Punkte ein Dreieck."),
      box("qkv-s3", "Mathematik", "Die Variablen", "Die drei Gewichte $\\alpha$ sind die Variablen; wegen $\\sum \\alpha = 1$ haben sie zwei Freiheitsgrade. Sie sind nicht negativ; die Tokens selbst sind nicht die Koordinaten des Simplex."),
      box("qkv-s6", "Geometrie", "Drei Ecken sind ein Ausschnitt", "Der Simplex ist nicht auf drei Ecken beschränkt. Mit 12 Tokens hat der Gewichts-Simplex 11 Dimensionen. Ein 2D-Bild kann nur drei Ecken zeigen. Die Demo wählt Tier, Straße und es aus und blendet die anderen neun Value-Vektoren aus. Gelernt wird $W_V$, also ein Value-Vektor pro Token, nicht drei Zahlen. $Q$, $K$ und $V$ sind drei gelernte Projektionen; die drei Ecken sind nicht diese Matrizen, sondern drei der n Value-Vektoren."),
      box("qkv-s4", "Mathematik", "Die Formel", "Gewichtete Summe mit nicht-negativen Gewichten, die zu 1 summieren; $W_O$ bildet die Mischung danach auf die Head-Ausgabe ab.", DE ? "\\underbrace{r_i = \\sum_j \\underbrace{\\alpha_{ij}}_{\\ge 0,\\ \\sum_j \\alpha_{ij}=1} \\underbrace{v_j}_{\\text{Value}}}_{\\text{konvexe Kombination der Values}} \\qquad \\underbrace{y_i = W_O r_i}_{\\text{Head-Ausgabe}}" : "\\underbrace{r_i = \\sum_j \\underbrace{\\alpha_{ij}}_{\\ge 0,\\ \\sum_j \\alpha_{ij}=1} \\underbrace{v_j}_{\\text{Value}}}_{\\text{konvexe Kombination der Values}} \\qquad \\underbrace{y_i = W_O r_i}_{\\text{Head-Ausgabe}}"),
      box("qkv-s5", "Grenze", "Was kommt danach?", "Die Mischung $r_i = \\sum_j \\alpha_{ij} v_j$ bleibt in der konvexen Hülle der Values. Die gelernte Output-Projektion $W_O$ bildet $r_i$ linear ab und kann den Punkt aus der Hülle bewegen; das FFN danach ist zusätzlich nichtlinear. Deshalb ist der Transformer-Block mehr als eine Mischung.")
    ] : [
      box("qkv-s1", "Geometry", "The corners are values", "The three points are not tokens; they are the learned value vectors $v_j = W_V x_j$ of three tokens. Each token contributes a vector through $W_V$."),
      box("qkv-s2", "Mathematics", "What is a simplex?", "A simplex is the simplest convex hull: one point is a 0-simplex, two points a segment, three points a triangle."),
      box("qkv-s3", "Mathematics", "The variables", "The three weights $\\alpha$ are the variables; because $\\sum \\alpha = 1$ they have two degrees of freedom. They are non-negative; the tokens themselves are not the coordinates of the simplex."),
      box("qkv-s6", "Geometry", "Three corners are a slice", "The simplex is not limited to three corners. With 12 tokens the weight simplex has 11 dimensions. A 2D picture can show only three corners. The demo selects animal, street, and it and hides the other nine value vectors. The learned object is $W_V$, which gives one value vector per token, not three numbers. $Q$, $K$, and $V$ are three learned projections; the three corners are not those matrices but three of the n value vectors."),
      box("qkv-s4", "Mathematics", "The formula", "Weighted sum with non-negative weights that sum to 1; $W_O$ maps the mixture to the head output afterwards.", "\\underbrace{r_i = \\sum_j \\underbrace{\\alpha_{ij}}_{\\ge 0,\\ \\sum_j \\alpha_{ij}=1} \\underbrace{v_j}_{\\text{value}}}_{\\text{convex combination of the values}} \\qquad \\underbrace{y_i = W_O r_i}_{\\text{head output}}"),
      box("qkv-s5", "Limit", "What comes next?", "The mixture $r_i = \\sum_j \\alpha_{ij} v_j$ stays inside the convex hull of the values. The learned output projection $W_O$ maps $r_i$ linearly and can move the point outside the hull; the FFN afterwards is nonlinear as well. That is why the transformer block is more than a mixture.")
    ],
    sources: [
      { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", why: { de: "Attention als gewichtete Summe der Values mit Softmax-Gewichten.", en: "Attention as a weighted sum of values with softmax weights." } },
      { label: "Weng (2018), Attention? Attention!", url: "https://lilianweng.github.io/posts/2018-06-24-attention/", why: { de: "Die Ausgabe ist eine gewichtete Summe der Values; die Gewichte kommen aus Query-Key-Scores.", en: "The output is a weighted sum of values; the weights come from query-key scores." } },
      { label: "Elhage et al. (2021), A Mathematical Framework for Transformer Circuits", url: "https://transformer-circuits.pub/2021/framework/index.html", why: { de: "Attention-Heads als Mischungen von Values; das Residual Stream trägt die Information weiter.", en: "Attention heads as mixtures of values; the residual stream carries information onward." } }
    ]
  };

  var qkvSimplexIntro = Object.assign({}, qkvSimplex, {
    watch: "",
    body: DE
      ? "Die drei Ecken sind die gelernten Value-Vektoren dreier Tokens. Attention mischt sie mit Gewichten: $r_i = \\sum_j \\alpha_{ij} v_j$, mit $\\alpha_{ij}\\ge 0$ und Summe 1. Der Mischungspunkt bleibt in der konvexen Hülle der Values; $W_O$ verschiebt ihn danach linear.\n\nDie drei Punkte sind keine Tokens, sondern die gelernten Value-Vektoren \n$v_j = W_V x_j$ von drei Tokens. Jeder Token trägt über $W_V$ einen Vektor bei.\n\nWIr haben hier eine kleine Auswahl der gesamten Tokens dieses Satzes, damit es darstellbar bleibt. Mit jedem Punkt mehr wird es ein höherdimensionalerer sogenannter Simplex."
      : "The three corners are the learned value vectors of three tokens. Attention mixes them with weights: $r_i = \\sum_j \\alpha_{ij} v_j$, with $\\alpha_{ij}\\ge 0$ and sum 1. The mixture point stays in the convex hull of the values; $W_O$ then shifts it linearly.\n\nThe three points are not tokens; they are the learned value vectors \n$v_j = W_V x_j$ of three tokens. Each token contributes a vector through $W_V$.\n\nHere we show a small selection of all the tokens in this sentence so that it stays visualisable. With every additional point it becomes a higher-dimensional so-called simplex.",
    context: "",
    deep: "",
    boxes: boxesById(qkvSimplex.boxes, ["qkv-s6", "qkv-s2", "qkv-s4"]).map(function (b) {
      if (b.id === "qkv-s2") {
        b.body = DE ? "Ein Simplex ist die die einfachste eine Fläche oder ein Volumen umschließende Struktur aus $n$ Punkten." : "A simplex is the simplest structure of $n$ points that encloses a surface or a volume.";
      }
      return b;
    })
  });

  var qkvArcs2 = Object.assign({}, qkvArcs, {
    title: DE ? "Head 2: Wo ist es?" : "Head 2: where is it?",
    body: DE
      ? "Head 2 fragt nach dem Ort. Die Query von „es“ trifft jetzt die Keys von „Straße“ und „Tier“; die Gewichte kippen. Wieder gilt: Die Prozentwerte sind Softmax-Gewichte, keine Wahrscheinlichkeiten für Wahrheit."
      : "Head 2 asks for the location. The query from “it” now meets the keys of “street” and “animal”; the weights flip. Again, the percentages are softmax weights, not probabilities of truth.",
    watch: DE ? "Head 2: Der Ort gewinnt. Vergleiche die Bögen mit Head 1." : "Head 2: the location wins. Compare the arcs with head 1.",
    demoState: { scene: "qkv", head: 1, view: "arcs" },
    context: "",
    deep: DE
      ? "Die spezifischen Gewichte der Heads sind nicht von Hand programmiert; sie spezialisieren sich im Training. Die zwei Muster in der Demo sind didaktisch: Head 1 fragt nach dem Subjekt, Head 2 nach dem Ort."
      : "The specific weights of the heads are not hand-programmed; they specialise during training. The two patterns in the demo are didactic: head 1 asks for the subject, head 2 for the location.",
    boxes: boxesById(qkvArcs.boxes, ["qkv-3", "qkv-5", "qkv-2"]).map(function (b) {
      b.id = b.id + "-h2";
      return b;
    })
  });

  var qkvSimplex2 = Object.assign({}, qkvSimplex, {
    title: DE ? "Head 2 als Value-Mischung" : "Head 2 as a value mixture",
    body: DE
      ? "Dieselben drei Value-Vektoren, andere Gewichte. Weil Head 2 nach dem Ort fragt, bekommt der Value von „Straße“ mehr Gewicht; der Mischungspunkt $r_i$ wandert zur Straße. Die Prozentwerte entstehen wieder aus den Rohgewichten: erst durch ihre Summe teilen, dann mit 100 multiplizieren. Im gezeigten Drei-Werte-Ausschnitt bleibt das Dreieck die Grenze für $r_i$; der echte Mischungsvektor nutzt alle Values. Die Head-Ausgabe ist $y_i = W_O r_i$. Du kannst den Punkt auch hier ziehen und die Mischung direkt verändern.\n\n\nEin Head ist ein Graph. Viele Heads sind viele Graphen mit eigenen \nKantengewichten; die Ausgaben werden konkateniert und projiziert. \nDeshalb kann ein Head auf Syntax achten, ein anderer auf Position oder \nBedeutung."
      : "The same three value vectors, different weights. Because head 2 asks for the location, the value of “street” gets more weight; the mixture point $r_i$ moves toward the street. The percentages again come from the raw weights: divide by their sum, then multiply by 100. In the three-value view shown here the triangle remains the boundary for $r_i$; the real mixture uses all values. The head output is $y_i = W_O r_i$. You can also drag the point here to change the mixture directly.\n\n\nOne head is one graph. Many heads are many graphs with their own \nedge weights; the outputs are concatenated and projected. \nThat is why one head can attend to syntax, another to position or \nmeaning.",
    demoState: { scene: "qkv", head: 1, view: "simplex" },
    boxes: qkvSimplex.boxes.map(function (b) {
      var copy = Object.assign({}, b, { id: b.id + "-h2" });
      if (b.id === "qkv-s2") {
        copy.body = DE ? "Ein Simplex ist die einfachste konvexe Hülle: ein Punkt ist ein 0-Simplex, zwei Punkte eine Strecke, drei Punkte ein Dreieck. Attention arbeitet mit dem Wahrscheinlichkeitssimplex der Gewichte: Für drei Values gilt $a,b,c \\in [0,1]$ und $a+b+c=1$; die drei Gewichte sind die baryzentrischen Koordinaten eines Punktes im Dreieck." : "A simplex is the simplest convex hull: one point is a 0-simplex, two points a segment, three points a triangle. Attention works with the probability simplex of the weights: for three values, $a,b,c \\in [0,1]$ and $a+b+c=1$; the three weights are the barycentric coordinates of a point in the triangle.";
      }
      return copy;
    })
  });

  var qkvGraph = Object.assign({}, qkvArcs, {
    kicker: DE ? "Graph" : "Graph",
    title: DE ? "Attention als vollverbundener Graph (ohne Causal Mask)" : "Attention as a fully connected graph (without causal mask)",
    body: DE
      ? "In dieser Darstellung ohne Causal Mask kann jedes Token auf jedes andere schauen: Die Attention-Matrix hat keine fehlenden Einträge. In einem GPT-Decoder maskiert die Causal Mask die Zukunft; dort sieht ein Token nur die Tokens, die vor ihm standen. Das erlaubt im Training das Netz darauf zu spezialisieren, dass es Sätze beenden kann, deren Ende es noch nciht kennt.\n\n\nDie Linienbreite und Helligkeit sind das Softmax-Gewicht. Eine dicke Kante bedeutet: Diese Query liest viel von diesem Token.\n\n\nIm Kreis siehst du alle Token; die Kanten von der Query „es“ zu jedem anderen Token sind die Softmax-Gewichte. Dick und hell heißt viel, dünn und blass heißt wenig. Fahre mit der Maus über eine Kante oder ein Token: Die Demo zeigt die Verbindung und den Prozentwert. Jedes Token hat außerdem eine Selbstkante. Klicke ein Token an, um seine Verbindungen zu sehen; für jede Query gibt es eine eigene Verteilung.\n"
      : "In this view without a causal mask, every token can attend to every other token: the attention matrix has no missing entries. In a GPT decoder the causal mask hides the future; there a token sees only the tokens that came before it. In training this lets the network specialise in finishing sentences whose ending it does not yet know.\n\n\nLine width and brightness are the softmax weight. A thick edge means: this query reads a lot from this token.\n\n\nIn the circle you see all tokens; the edges from the query “it” to every other token are the softmax weights. Thick and bright means a lot, thin and pale means little. Hover over an edge or a token: the demo shows the connection and the percentage. Every token also has a self-loop. Click a token to see its connections; every query has its own distribution.\n",
    watch: "",
    demoState: { scene: "qkv", head: 0, view: "graph" },
    context: "",
    deep: DE ? "Ein Head ist ein Graph. Viele Heads sind viele Graphen mit eigenen Kantengewichten; die Ausgaben werden konkateniert und projiziert. Deshalb kann ein Head auf Syntax achten, ein anderer auf Position oder Bedeutung." : "One head is one graph. Many heads are many graphs with their own edge weights; the outputs are concatenated and projected. That is why one head can attend to syntax, another to position or meaning.",
    boxes: [],
    sources: qkvArcs.sources
  });

  var qkvGraph2 = Object.assign({}, qkvGraph, {
    title: DE ? "Head 2 als Graph" : "Head 2 as a graph",
    body: DE
      ? "Derselbe vollverbundene Graph in dieser Darstellung, andere Kantengewichte. Head 2 fragt nach dem Ort, deshalb wird die Kante von „es“ zu „Straße“ dick und hell; die Kante zu „Tier“ wird dünner. In dieser Darstellung ist keine Causal Mask, jedes Token kann jedes Andere sehen. Bei generativen Modellen kann jedes Token nur die vorherigen Tokens sehen."
      : "The same fully connected graph in this view, different edge weights. Head 2 asks for the location, so the edge from “it” to “street” becomes thick and bright; the edge to “animal” gets thinner. In this view there is no causal mask; every token can see every other token. In generative models each token can see only the preceding tokens.",
    watch: DE ? "Vergleiche die Kanten mit Head 1. Welche Verbindung gewinnt jetzt?" : "Compare the edges with head 1. Which connection wins now?",
    demoState: { scene: "qkv", head: 1, view: "graph" },
    context: "",
    deep: "",
    boxes: qkvGraph.boxes.map(function (b) { return Object.assign({}, b, { id: b.id + "-h2" }); })
  });

  var qkvStep = {
    title: DE ? "Wie Attention rechnet" : "How attention computes",
    kicker: DE ? "Q · K · V" : "Q · K · V",
    substeps: [qkvArcsIntro, qkvGraph, qkvSimplexIntro, qkvArcs2, qkvGraph2, qkvSimplex2]
  };

  var agentRagStep = {
    kicker: DE ? "Agent · RAG" : "Agent · RAG",
    title: DE ? "Der Agent liest Buch-Chunks in den Kontext" : "The agent reads book chunks into the context",
    body: DE
      ? "RAG heißt: Das Modell holt sich Ausschnitte aus einer Quelle, bevor es antwortet, statt nur aus dem Gedächtnis zu raten. Ein Agent kann dafür eine Datei öffnen. Er zerlegt den Text in Chunks, bewertet sie kurz (passt / nicht relevant) und gibt jedem Chunk einen Vektor. Dann vergleicht er den Winkel mit dem aktuellen Kontext, aus dem er gerade generieren soll. Chunks unter dem Grenzwinkel kommen in den unsichtbaren Kontext; dort liest sie das Modell beim nächsten Token. So kann es aus dem Buch weitererzählen, ohne den ganzen Text im Prompt zu haben.\n\nDie fiktive Datei `kraken.pdf` ist ein Buchauszug; die fünf Fakten darin sind real und belegt:\n\n- **Drei Herzen:** zwei Kiemenherzen und ein Körperherz; beim Schwimmen pausiert das Körperherz (Hanlon & Messenger, 1996).\n- **Blaues Blut:** Hämocyanin bindet Sauerstoff mit Kupfer (Wikipedia: Hemocyanin).\n- **Arme mit eigenen Nervennetzen:** etwa zwei Drittel der Neuronen sitzen in den acht Armen; die Saugnäpfe können schmecken (Wikipedia: Octopus).\n- **RNA-Editing:** Kraken schreiben RNA in Nervenzellen um (Liscovitch-Brauer et al., 2017).\n- **Tarnung:** Chromatophoren, Iridophoren und Papillen ändern Farbe und Textur (Mäthger et al., 2009).\n\nIn der Demo lädst du kraken.pdf hoch. Der Text wird außerhalb des LLM gelesen, in C1–C5 zerlegt und bewertet. Nur C1 passt zur Frage und wandert in den unsichtbaren Kontext; erst dann vervollständigt das Modell „Ein Krake hat …“ zu „… drei Herzen“."
      : "RAG means the model retrieves excerpts from a source before answering instead of guessing only from memory. For this, an agent can open a file. It splits the text into chunks, scores them briefly (fits / not relevant), and gives each chunk a vector. Then it compares the angle with the current context from which it is about to generate. Chunks below the threshold enter the invisible context; the model reads them at the next token. That is how it continues from the book without putting the whole text into the prompt.\n\nThe fictional file `kraken.pdf` is a book excerpt; its five facts are real and sourced:\n\n- **Three hearts:** two gill hearts and one body heart; the body heart pauses when swimming (Hanlon & Messenger, 1996).\n- **Blue blood:** hemocyanin binds oxygen with copper (Wikipedia: Hemocyanin).\n- **Arms with their own nerve nets:** about two thirds of the neurons sit in the eight arms; the suckers can taste (Wikipedia: Octopus).\n- **RNA editing:** octopuses edit RNA in nerve cells (Liscovitch-Brauer et al., 2017).\n- **Camouflage:** chromatophores, iridophores, and papillae change colour and texture (Mäthger et al., 2009).\n\nIn the demo you upload kraken.pdf. The text is read outside the LLM, split into C1–C5, and scored. Only C1 fits the question and enters the invisible context; only then does the model complete “An octopus has …” to “… three hearts”.",
    watch: DE ? "Klicke „Hochladen“. Verfolge, wie kraken.pdf außerhalb des LLM gelesen, in C1–C5 gechunkt und bewertet wird. C1 passt; C2–C5 werden verworfen. Klicke Weiter: C1 wandert in den unsichtbaren Kontext, und der Chat ergänzt „Ein Krake hat …“ zu „… drei Herzen“." : "Click “Upload”. Watch kraken.pdf being read, chunked into C1–C5, and scored outside the LLM. C1 fits; C2–C5 are discarded. Click Next: C1 enters the invisible context, and the chat completes “An octopus has …” to “… three hearts”.",
    demoState: { scene: "agentrag" },
    context: DE ? "kraken.pdf liegt außerhalb des Modells. Der Agent chunkt sie, bewertet jeden Chunk über den Winkel zum Frage-Kontext und legt nur C1 (14° < 35°) in den unsichtbaren Kontext. C2–C5 bleiben draußen. Das Modell sieht nur den fertigen Kontext, nicht die Datei." : "kraken.pdf sits outside the model. The agent chunks it, scores each chunk by its angle to the question context, and puts only C1 (14° < 35°) into the invisible context. C2–C5 stay out. The model sees only the finished context, not the file.",
    deep: DE ? "Chunking, Embedding und Winkel bilden die Retrieval-Stufe; RAG (Lewis et al., 2020) verbindet sie mit der Generierung. Die Chunk-Größe und der Grenzwert sind Stellschrauben: zu klein verpasst Kontext, zu groß nimmt Ballast auf. Grenzen: falscher Chunk, falscher Grenzwert, Chunk-Grenzen mitten im Gedanken und Kontextüberlauf. Die Datei ist fiktiv; die fünf Fakten sind real und in den Quellen belegt." : "Chunking, embeddings, and angles form the retrieval stage; RAG (Lewis et al., 2020) connects it with generation. Chunk size and threshold are trade-offs: too small misses context, too large adds noise. Limits: wrong chunk, wrong threshold, chunk boundaries in the middle of a thought, and context overflow. The file is fictional; the five facts are real and sourced.",
    boxes: [
      box("ar-1", "RAG", DE ? "Was passiert beim Chunking?" : "What happens in chunking?", DE ? "Das Buch wird in kleine Abschnitte geteilt. Jeder Chunk bekommt einen Vektor. Kleine Chunks passen besser zum aktuellen Kontext, verlieren aber leicht den größeren Zusammenhang." : "The book is split into small sections. Each chunk gets a vector. Small chunks fit the current context better but easily lose the larger connection."),
      box("ar-2", "Winkel", DE ? "Wie wird ausgewählt?" : "How is a chunk selected?", DE ? "Der Winkel zwischen aktuellem Kontext und Chunk misst Relevanz. Liegt er unter dem Grenzwert, kommt der Chunk in den Kontext. Zu niedrig verpasst die Antwort, zu hoch nimmt Ballast auf." : "The angle between the current context and the chunk measures relevance. Below the threshold, the chunk enters the context. Too low misses the answer; too high adds noise."),
      box("ar-3", "Kontext", DE ? "Warum unsichtbar?" : "Why invisible?", DE ? "Der Kontext ist das Arbeitsgedächtnis des Modells. Du siehst nur, welche Chunks hineinwandern; den vollständigen Text liest das Modell beim nächsten Token." : "The context is the model's working memory. You only see which chunks go in; the model reads the full text at the next token."),
      box("ar-4", "Grenze", DE ? "Was ist fiktiv?" : "What is fictional?", DE ? "kraken.pdf, der Buchauszug und die Chunk-IDs sind erfunden. Die fünf Fakten (drei Herzen, blaues Blut, Arme/Neuronen, RNA-Editing, Tarnung) sind real und in den Quellen belegt. Das Modell bekommt nur C1, nicht die ganze Datei." : "kraken.pdf, the book excerpt, and the chunk IDs are fictional. The five facts (three hearts, blue blood, arms/neurons, RNA editing, camouflage) are real and sourced. The model receives only C1, not the whole file.")
    ],
    sources: [
      { label: "Lewis et al. (2020), Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", url: "https://arxiv.org/abs/2005.11401", why: { de: "RAG: Retrieval und Generierung verbinden.", en: "RAG: combine retrieval and generation." } },
      { label: "Yao et al. (2022), ReAct: Synergizing Reasoning and Acting in Language Models", url: "https://arxiv.org/abs/2210.03629", why: { de: "Reasoning und Tool-Aktionen im Wechsel.", en: "Interleaving reasoning and tool actions." } },
      { label: "Schick et al. (2023), Toolformer", url: "https://arxiv.org/abs/2302.04761", why: { de: "Sprachmodelle lernen, Werkzeuge aufzurufen.", en: "Language models learn to call tools." } },
      { label: "Liu et al. (2023), Lost in the Middle", url: "https://arxiv.org/abs/2307.03172", why: { de: "Lange Kontexte nutzen Informationen in der Mitte schlechter.", en: "Long contexts use information in the middle less well." } },
      { label: "Hanlon & Messenger (1996), Cephalopod Behaviour", url: "https://doi.org/10.1017/CBO9780511586576", why: { de: "Drei Herzen, Kreislauf, Tarnung und Arme.", en: "Three hearts, circulation, camouflage, and arms." } },
      { label: "Wikipedia: Hemocyanin", url: "https://en.wikipedia.org/wiki/Hemocyanin", why: { de: "Blaues Blut: Hämocyanin bindet Sauerstoff mit Kupfer.", en: "Blue blood: hemocyanin binds oxygen with copper." } },
      { label: "Wikipedia: Octopus", url: "https://en.wikipedia.org/wiki/Octopus", why: { de: "Überblick zu drei Herzen, Neuronen in den Armen und Saugnäpfen.", en: "Overview of three hearts, neurons in the arms, and suckers." } },
      { label: "Liscovitch-Brauer et al. (2017), Trade-off between transcriptome plasticity and genome evolution in cephalopods", url: "https://doi.org/10.1016/j.cell.2017.03.025", why: { de: "RNA-Editing in Kraken.", en: "RNA editing in octopuses." } },
      { label: "Mäthger et al. (2009), Mechanisms and behavioural functions of structural coloration in cephalopods", url: "https://doi.org/10.1098/rsif.2008.0366.focus", why: { de: "Chromatophoren, Iridophoren und Tarnung.", en: "Chromatophores, iridophores, and camouflage." } }
    ]
  };

  var agentsStep = {
    kicker: DE ? "Agent" : "Agent",
    title: DE ? "Ein Agent ist dasselbe Modell mit Werkzeugen" : "An agent is the same model with tools",
    body: DE
      ? "Ein Agent ist kein neues Modell. Er kann dasselbe Basismodell verwenden; die Browser-Demo ist kein Agent. RAG legt passende Chunks aus einer Quelle in den Kontext; ein Agent geht weiter: Das Modell sagt „führe das als Programm aus“, die Runtime tut es, und der Output kommt in den Kontext. So arbeiten opencode, Claude Code und Cursor: Sie lesen Dateien, führen Befehle aus und sehen die Ergebnisse. Multimodale Modelle bekommen zusätzlich Screenshots und können darauf sehen, was auf dem Bildschirm ist."
      : "An agent is not a new model. It can use the same base model; the browser demo is not an agent. RAG puts fitting chunks from a source into the context; an agent goes further: the model says “run this as a program”, the runtime does it, and the output goes into the context. That is how opencode, Claude Code, and Cursor work: they read files, run commands, and see the results. Multimodal models also receive screenshots and can see what is on the screen.",
    watch: DE ? "Drücke Weiter. Verfolge, wie Tool-Call, Ausführung und Ergebnis in den Kontext wandern." : "Press Next. Follow how the tool call, the execution, and the result move into the context.",
    demoState: { scene: "agents" },
    context: DE ? "Der Kontext ist das Arbeitsgedächtnis. Jeder Tool-Output wächst hinein. Das Modell entscheidet auf dieser Grundlage den nächsten Schritt; die Runtime liegt außerhalb des Modells." : "The context is the working memory. Every tool output grows into it. The model decides the next step on that basis; the runtime sits outside the model.",
    deep: DE ? "ReAct und Toolformer beschreiben diesen Loop; OSWorld und WebArena testen Computer-Use. Das Modell bleibt ein Nächstes-Token-Vorhersager; die Werkzeuge machen daraus einen Akteur. Grenzen: falsche Tool-Calls, Berechtigungen, Prompt Injection und Kosten." : "ReAct and Toolformer describe this loop; OSWorld and WebArena test computer use. The model remains a next-token predictor; the tools turn it into an actor. Limits: wrong tool calls, permissions, prompt injection, and cost.",
    boxes: DE ? [
      box("ag-1", "Technik", "Was ist ein Tool?", "Ein Programm außerhalb des Modells: Terminal, Datei, Browser, API. Das Modell ruft es über eine strukturierte Nachricht auf."),
      box("ag-2", "Multimodal", "Screenshot und Bild", "Die Runtime macht einen Screenshot. Ein multimodales Modell kodiert das Bild und legt die Tokens in den Kontext; so kann es UI-Elemente lesen."),
      box("ag-3", "Gleiches Modell?", "Ein Loop um ein LLM", "Ein Agent kann dasselbe LLM verwenden; die Gewichte müssen aber nicht mit dieser Browser-Demo identisch sein. Es ändern sich der Kontext und die verfügbaren Werkzeuge."),
      box("ag-4", "Grenze", "Was kann schiefgehen?", "Falsche Tool-Calls, zu weitreichende Berechtigungen, Prompt Injection in Webseiten oder Dateien und hohe Kosten durch viele Schritte.")
    ] : [
      box("ag-1", "Technique", "What is a tool?", "A program outside the model: terminal, file, browser, API. The model calls it through a structured message."),
      box("ag-2", "Multimodal", "Screenshot and image", "The runtime takes a screenshot. A multimodal model encodes the image and puts the tokens into the context; that is how it reads UI elements."),
      box("ag-3", "Same model?", "A loop around an LLM", "An agent can use the same LLM; its weights need not be identical to this browser demo. The context and the available tools are what change."),
      box("ag-4", "Limit", "What can go wrong?", "Wrong tool calls, excessive permissions, prompt injection in websites or files, and high cost from many steps.")
    ],
    sources: [
      { label: "Yao et al. (2022), ReAct: Synergizing Reasoning and Acting in Language Models", url: "https://arxiv.org/abs/2210.03629", why: { de: "Reasoning und Tool-Aktionen im Wechsel.", en: "Interleaving reasoning and tool actions." } },
      { label: "Schick et al. (2023), Toolformer", url: "https://arxiv.org/abs/2302.04761", why: { de: "Sprachmodelle lernen, Werkzeuge aufzurufen.", en: "Language models learn to call tools." } },
      { label: "Xie et al. (2024), OSWorld", url: "https://arxiv.org/abs/2404.07972", why: { de: "Benchmark für Computer-Use-Agenten mit Screenshots.", en: "Benchmark for computer-use agents with screenshots." } },
      { label: "Zhou et al. (2023), WebArena", url: "https://arxiv.org/abs/2307.13854", why: { de: "Benchmark für Agenten in realistischen Web-Umgebungen.", en: "Benchmark for agents in realistic web environments." } }
    ]
  };

  var agentsCombinedStep = {
    kicker: DE ? "Agenten" : "Agents",
    title: DE ? "Wie Modelle zu Agenten werden" : "How models become agents",
    substeps: [agentRagStep, agentsStep]
  };

  var wmSources = [
    { label: "Li et al. (2023), Emergent World Representations: Exploring a Sequence Model Trained on a Synthetic Task", url: "https://arxiv.org/abs/2210.13382", why: { de: "Othello-GPT: ein Brettzustand entsteht aus reiner Zugvorhersage.", en: "Othello-GPT: a board state emerges from next-move prediction alone." } },
    { label: "Nanda, Lee & Wattenberg (2023), Emergent Linear Representations in World Models of Self-Supervised Sequence Models", url: "https://arxiv.org/abs/2309.00941", why: { de: "Der Brettzustand ist linear aus dem Residualstrom lesbar; lineare Probes und Interventionen.", en: "The board state is linearly readable from the residual stream; linear probes and interventions." } },
    { label: "Park, Choe & Veitch (2024), The Linear Representation Hypothesis and the Geometry of Large Language Models", url: "https://arxiv.org/abs/2311.03658", why: { de: "Konzepte als Richtungen; Messung und Intervention als lineare Operationen.", en: "Concepts as directions; measurement and intervention as linear operations." } },
    { label: "Elhage et al. (2022), Toy Models of Superposition", url: "https://transformer-circuits.pub/2022/toy_model/index.html", why: { de: "Mehr Features als Dimensionen; Features können sich überlagern.", en: "More features than dimensions; features can overlap." } },
    { label: "Engels et al. (2024), Not All Language Model Features Are One-Dimensionally Linear", url: "https://arxiv.org/abs/2405.14860", why: { de: "Manche Features sind mehrdimensional, zum Beispiel Kreise für Wochentage.", en: "Some features are multi-dimensional, for example circles for weekdays." } },
    { label: "Olsson et al. (2022), In-context Learning and Induction Heads", url: "https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html", why: { de: "Attention-Heads können gelernte Algorithmen tragen.", en: "Attention heads can carry learned algorithms." } },
    { label: "Geva et al. (2021), Transformer Feed-Forward Layers Are Key-Value Memories", url: "https://arxiv.org/abs/2012.14913", why: { de: "FFN-Schichten als Key-Value-Musterdetektoren.", en: "FFN layers as key-value pattern detectors." } },
    { label: "Othello-GPT code and probe weights", url: "https://github.com/likenneth/othello_world", why: { de: "Öffentlicher Checkpoint und Code zum Othello-GPT-Experiment.", en: "Public checkpoint and code for the Othello-GPT experiment." } },
    { label: "Karvonen (2024), Emergent World Models and Latent Variable Estimation in Chess-Playing Language Models", url: "https://arxiv.org/abs/2403.15498", why: { de: "Schach: lineare Brettrepräsentation, 13 Zustände pro Feld und Interventionen.", en: "Chess: linear board representation, 13 states per square, and interventions." } },
    { label: "Gurnee & Tegmark (2023), Language Models Represent Space and Time", url: "https://arxiv.org/abs/2310.02207", why: { de: "Llama-2: lineare Karten von realem Raum und Zeit, mit space/time neurons.", en: "Llama-2: linear maps of real space and time, with space/time neurons." } }
  ];

  var wmBoardText = DE ? "Die Welt ist ein Zustand aus 64 Feldern: leer, schwarz oder weiß. Ein Zug kann viele Felder gleichzeitig ändern. Genau diesen Zustand muss das Modell aus den Zügen rekonstruieren. Die Demo zeigt eine schematische, aber regelkonforme Zugfolge. Sie soll das Muster zeigen, nicht ein bestimmtes Spiel bewerten." : "The world is a state of 64 squares: empty, black, or white. A move can change many squares at once. The model has to reconstruct exactly this state from the moves. The demo shows a schematic but legal move sequence. It is there to show the pattern, not to judge a particular game.";

  var wmBoardText = DE ? "Othello ist ein Brettspiel für zwei Personen auf 8×8 Feldern. Jede Scheibe ist auf einer Seite schwarz und auf der anderen weiß. Ein Zug legt eine neue Scheibe und dreht alle gegnerischen Scheiben, die in einer geraden Linie (horizontal, vertikal oder diagonal) zwischen der neuen Scheibe und einer eigenen eingeschlossen sind, auf die eigene Farbe.\n\nForscher haben eine Menge valider Spielzüge an ein LLM gegeben, ohne ihm zu erklären, was es da sieht, und es trainiert, bis es valide Züge voraussagen konnte. Dann haben sie geschaut, wie das LLM das intern repräsentiert." : "Othello is a two-player board game on an 8×8 grid. Each disc is black on one side and white on the other. A move places a new disc and flips every opposing disc enclosed in a straight line (horizontal, vertical, or diagonal) between the new disc and an existing one to the player's colour.\n\nResearchers gave a large set of valid moves to an LLM without explaining what it was seeing, and trained it until it could predict valid moves. Then they looked at how the LLM represents this internally.";

  var wmBoard = {
    kicker: DE ? "Das Brett" : "The board",
    title: DE ? "Das Weltmodell eines LLM" : "An LLM's world model",
    teaser: wmBoardText,
    body: wmBoardText,
    watch: "",
    demoState: { scene: "worldmodel", step: 0 },
  };

  var wmMachineText = DE ? "Li et al. haben ein kleines GPT-Modell darauf trainiert, Züge vorherzusagen. Dazu haben sie ihm als Text bisherige Züge gegeben, und das Netzwerk sollte den nächsten Zug sagen. Das LLM hat dabei nie ein Brett gesehen und keine Regeln, sondern nur viele valide Züge.\n\nNachdem das Netz gut genug war, valide Züge vorherzusagen, fanden Li et al. (2023) mit nichtlinearen Probes einen inneren Zustand, der dem Spielfeld entspricht. Nanda, Lee und Wattenberg (2023) zeigten, dass eine lineare Probe diesen Zustand aus dem Residualstrom lesen kann. Das Netz weiß nicht, dass es sich um ein Spiel handelt, sondern nur, wie es valide Züge vorhersagt, nutzt dafür aber eine Repräsentation, die dem Spielfeld entspricht.\n\nDas ist ein Beleg dafür, dass ein kleines Modell aus reiner Zugvorhersage eine lesbare Brettrepräsentation ausbilden kann. Es zeigt nicht, dass alle LLMs ein allgemeines Weltmodell besitzen.\n\nFür jedes Feld liest die lineare Probe drei Logits, also gelernte Richtungen für „mein Spieler“, „gegnerischer Spieler“ und „leer“. Die Differenz zwischen den beiden Spieler-Richtungen ist eine Achse; „leer“ ist eine weitere Richtung. Ein einzelner Skalar reicht für drei Zustände nicht.\n\nFür andere Spiele wie Schach reicht eine einzelne Richtung nicht mehr aus, und die Möglichkeiten werden in komplexeren Unterräumen repräsentiert. Für noch komplexere Strukturen sind die Weltmodelle noch nicht richtig verstanden." : "Li et al. trained a small GPT model to predict moves. They gave it previous moves as text, and the network had to predict the next move. The LLM never saw a board and had no rules, only many valid moves.\n\nAfter the network was good enough to predict valid moves, Li et al. (2023) used non-linear probes to find an internal state that corresponds to the board. Nanda, Lee, and Wattenberg (2023) showed that a linear probe can read this state from the residual stream. The network does not know that this is a game; it only knows how to predict valid moves, but it uses a representation that corresponds to the board.\n\nThat is evidence that a small model trained only on move prediction can form a readable board representation. It does not show that all LLMs have a general world model.\n\nFor each square, the linear probe reads three logits, that is, learned directions for “my player”, “opponent player”, and “empty”. The difference between the two player directions is one axis; “empty” is another direction. A single scalar is not enough for three states.\n\nFor other games such as chess a single direction is no longer enough, and the possibilities are represented in more complex subspaces. For even more complex structures, the world models are not yet properly understood.";

  var wmMachine = {
    kicker: DE ? "Der Weg zum Brett" : "The path to the board",
    title: DE ? "Wie ein LLM sein Weltmodell aufbaut" : "How an LLM builds its world model",
    teaser: wmMachineText,
    body: wmMachineText,
    watch: "",
    demoState: { scene: "worldmodel", step: 1 },
    contextTitle: DE ? "Was sieht man in der Demo?" : "What does the demo show?",
    context: DE ? "Beispielschicht L6; die Paper proben mehrere Schichten. Der 512-dimensionale Residualstrom wird von einer linearen 3-Wege-Probe gelesen (64×3×512 Gewichte); Lis nichtlineare Probe hat zusätzlich eine versteckte Schicht (im offiziellen Beispiel Größe 64). Die Modellgewichte bleiben unverändert." : "Example layer L6; the papers probe several layers. A linear 3-way probe reads the 512-dimensional residual stream (64×3×512 weights); Li's nonlinear probe additionally has a hidden layer (size 64 in the official example). The model weights stay unchanged.",
    boxes: [
      box("wm-machine-legal", DE ? "Grenze" : "Limit", DE ? "Valide Züge heißt nicht Gewinnen" : "Valid moves are not winning", DE ? "Das Training belohnte nur die richtige Fortsetzung, nicht den Sieg. Othello-GPT sagt legale Züge voraus, nicht notwendig starke. Das Weltmodell entsteht als Nebenprodukt der Vorhersage. Würde man es auf gute Züge trainieren, würde es vermutlich auch das lernen." : "Training rewarded only the correct continuation, not a win. Othello-GPT predicts legal moves, not necessarily strong ones. The world model emerges as a by-product of prediction. If it were trained on good moves, it would presumably learn that too."),
      box("wm-probe-train", DE ? "Optional" : "Optional", DE ? "Wie trainiert man eine Probe?" : "How is a probe trained?", DE ? "Man sammelt Paare aus Aktivierung x und wahrem Brett. Für jedes der 64 Felder und jeden der 3 Zustände trainiert man einen linearen Klassifikator, meist logistische Regression. Sein 512-dimensionaler Gewichtsvektor ist die Probe-Richtung. Danach friert man die Probe ein. Die Gewichte des Modells werden nie verändert; die Probe liest nur." : "Collect pairs of activation x and the true board. For each of the 64 squares and each of the 3 states, train a linear classifier, usually logistic regression. Its 512-dimensional weight vector is the probe direction. Then freeze the probe. The model weights are never changed; the probe only reads."),
      box("wm-probe-math", DE ? "Mathematik" : "Mathematics", DE ? "Die Projektion" : "The projection", DE ? "Für jedes Feld $s$ und jeden Zustand $o$ ist der Logit das Skalarprodukt aus $x$ und der Probe-Zeile $W[s,o]$. $64 \\times 3 = 192$ Dot-Products. Danach Softmax über die 3 Zustände und Argmax pro Feld." : "For every square $s$ and state $o$, the logit is the dot product of $x$ and the probe row $W[s,o]$. $64 \\times 3 = 192$ dot products. Then softmax over the 3 states and argmax per square.", DE ? "\\underbrace{\\underbrace{\\operatorname{logit}[s,o]}_{\\text{Probe-Logit}} = \\underbrace{\\sum_{d=0}^{511} W[s,o,d]\\,x[d]}_{192\\ \\text{Dot-Produkte}}}_{\\text{Brett-Readout}}" : "\\underbrace{\\underbrace{\\operatorname{logit}[s,o]}_{\\text{probe logit}} = \\underbrace{\\sum_{d=0}^{511} W[s,o,d]\\,x[d]}_{192\\ \\text{dot products}}}_{\\text{board readout}}")
    ]
  };

  var wmGeometryText = DE ? "Bei Othello liest die Probe pro Feld drei Logits: leer, mein Spieler oder der gegnerische Spieler (relativ zum Spieler am Zug). Die Differenz zwischen mein und gegnerisch ist eine Achse, „leer“ eine weitere Richtung; ein einzelner Skalar reicht nicht.\n\nBei Schach reicht eine Richtung nicht, weil ein Feld leer sein oder eine von zwölf Figuren tragen kann.\n\nDie Probe braucht dort 13 Logits pro Feld, also einen affinen 12-dimensionalen Unterraum; Karvonen (2024) findet das auch in einem Schach-Sprachmodell. In echten Modellen sind diese Unterräume noch komplexer und überlagern sich. Das Othello-Brett ist der klare, kleine Fall, ein guter Einblick in die Art, wie ein Modell Welt repräsentiert.\n\nGurnee & Tegmark (2023) finden lineare Repräsentationen von realem Raum und Zeit in Llama-2: Orte und Jahre liegen auf lesbaren Richtungen, mit einzelnen „space neurons“ und „time neurons“. Das zeigt, dass auch reale Weltzustände linear lesbar sein können. Es heißt nicht, dass eine einzige Achse reicht: Andere Features sind mehrdimensional (Engels et al., 2024), und in großen Modellen überlagern sich viele Richtungen (Elhage et al., 2022).\n\nDie eigentliche Aussage ist bescheiden und stark zugleich: Ein Modell, das nur das nächste Token vorhersagt, kann einen Weltzustand ausbilden, weil das die einfachste Möglichkeit sein kann, möglichst viel richtig vorherzusagen. Wie reich dieser Zustand ist, hängt von der Welt ab, die in den Daten steckt." : "For Othello, the probe reads three logits per square: empty, my player, or the opponent (relative to the player to move). The difference between mine and the opponent is one axis, “empty” another direction; a single scalar is not enough.\n\nFor chess, one direction is not enough, because a square can be empty or hold one of twelve pieces.\n\nThere the probe needs 13 logits per square, an affine 12-dimensional subspace; Karvonen (2024) finds this in a chess language model as well. In real models these subspaces are more complex still and overlap. The Othello board is the clear, small case, a good glimpse of how a model represents a world.\n\nGurnee & Tegmark (2023) find linear representations of real space and time in Llama-2: places and years lie on readable directions, with individual “space neurons” and “time neurons”. That shows that real-world states can be linearly readable too. It does not mean that one axis is enough: other features are multi-dimensional (Engels et al., 2024), and in large models many directions overlap (Elhage et al., 2022).\n\nThe real claim is modest and strong at once: a model trained only to predict the next token can develop a world state, because that can be the simplest way to predict as much as possible correctly. How rich that state is depends on the world in the data.";

  var wmGeometry = {
    kicker: DE ? "Geometrie" : "Geometry",
    title: DE ? "Schach und die reale Welt" : "Chess and the real world",
    teaser: wmGeometryText,
    body: wmGeometryText,
    watch: DE ? "Drücke Weiter. Vergleiche zwei Richtungen mit einem Unterraum." : "Press Next. Compare two directions with a subspace.",
    demoState: { scene: "worldmodel", step: 2 },
    context: DE ? "Die lineare Probe ist ein Readout. Die Brettrichtungen leben im 512-dim Residualstrom. Bei Schach kommen pro Feld 13 Zustände dazu; bei realen Modellen überlagern sich viele solcher Richtungen." : "The linear probe is a readout. The board directions live in the 512-dim residual stream. In chess, 13 states per square are added; in real models many such directions overlap.",
    deep: DE ? "Die Linear Representation Hypothesis beschreibt Features als Richtungen. Superposition packt mehr Features in den Raum als Dimensionen. Engels et al. finden mehrdimensionale Features, etwa Kreise für Wochentage und Monate. Karvonen zeigt für Schach 13 Zustände pro Feld. Deshalb ist die Weltmodell-Debatte kein Entweder-oder: Manche Zustände sind Richtungen, andere brauchen einen Unterraum." : "The linear representation hypothesis describes features as directions. Superposition packs more features into the space than there are dimensions. Engels et al. find multi-dimensional features, such as circles for weekdays and months. Karvonen shows 13 states per square for chess. So the world-model debate is not either-or: some states are directions, others need a subspace.",
    boxes: [
      box("wm-geo-line", DE ? "Geometrie" : "Geometry", DE ? "Eine Richtung" : "One direction", DE ? "Der Unterschied zwischen meinem Spieler und dem Gegner ist eine Achse: $w_{\\text{mein}} - w_{\\text{Gegner}}$. Der Logit ist die Projektion auf diese Achse. Ein fester Nullpunkt ist nicht nötig; Softmax vergleicht die drei Logits." : "The difference between my player and the opponent is one axis: $w_{\\text{mine}} - w_{\\text{opponent}}$. The logit is the projection onto this axis. A fixed zero point is not needed; softmax compares the three logits."),
      box("wm-geo-sub", DE ? "Schach" : "Chess", DE ? "13 Zustände pro Feld" : "13 states per square", DE ? "Ein Feld ist leer oder trägt eine von zwölf Figuren. Die Probe hat 13 Logits; die zugehörigen Richtungen spannen einen affinen 12-dimensionalen Unterraum auf. Ein einzelner Skalar reicht nicht." : "A square is empty or holds one of twelve pieces. The probe has 13 logits; the corresponding directions span an affine 12-dimensional subspace. A single scalar is not enough."),
      box("wm-geo-real", DE ? "Grenze" : "Limit", DE ? "Reale Modelle" : "Real models", DE ? "In echten Modellen überlagern sich viele Features. Eine Richtung kann mehrere Bedeutungen tragen; manche Features liegen auf Kreisen oder höherdimensionalen Mannigfaltigkeiten. Das Othello-Brett ist ein klarer Spezialfall." : "In real models many features overlap. One direction can carry several meanings; some features lie on circles or higher-dimensional manifolds. The Othello board is a clear special case."),
      box("wm-geo-gurnee", DE ? "Realer Raum" : "Real space", DE ? "Was zeigen Gurnee & Tegmark?" : "What do Gurnee & Tegmark show?", DE ? "In Llama-2 liegen Orte und Jahre auf linearen Richtungen; einzelne Neuronen kodieren Koordinaten. Auch reale Weltzustände sind also lesbar, aber nicht mit einer einzigen Achse pro Feld." : "In Llama-2, places and years lie on linear directions; individual neurons encode coordinates. Real-world states are readable too, but not with a single axis per square."),
      box("wm-geo-golden", DE ? "Optional" : "Optional", "Golden Gate Claude", DE ? "Anthropic hat 2024 eine einzelne Feature-Richtung in Claude 3 Sonnet verstärkt, die mit der Golden Gate Bridge zusammenhing. Danach sprach das Modell auffällig oft über die Brücke, auch ohne entsprechenden Prompt. Das zeigt, dass eine gelernte Richtung eine semantische Rolle tragen und das Verhalten steuern kann. Es ist kein Beweis für ein vollständiges Weltmodell." : "In 2024 Anthropic amplified a single feature direction in Claude 3 Sonnet associated with the Golden Gate Bridge. The model then talked about the bridge conspicuously often even without a matching prompt. This shows that a learned direction can carry a semantic role and steer behaviour. It is not proof of a complete world model.")
    ]
  };

  wmBoard.sources = [wmSources[0], wmSources[7]];
  wmMachine.sources = [wmSources[0], wmSources[1], wmSources[2], wmSources[7], wmSources[8]];
  wmGeometry.sources = [
    wmSources[2], wmSources[3], wmSources[4], wmSources[8], wmSources[9],
    { label: "Templeton et al. (2024), Scaling Monosemanticity", url: "https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html", why: { de: "Features als interpretierbare Richtungen; das Golden-Gate-Feature im Detail.", en: "Features as interpretable directions; the Golden Gate feature in detail." } },
    { label: "Anthropic (2024), Golden Gate Claude", url: "https://www.anthropic.com/news/golden-gate-claude", why: { de: "Öffentliche Demo der verstärkten Golden-Gate-Richtung.", en: "Public demo of the amplified Golden Gate direction." } }
  ];

  var worldModelStep = {
    kicker: DE ? "Weltmodelle" : "World models",
    title: DE ? "Das Weltmodell eines LLM" : "An LLM's world model",
    substeps: [wmBoard, wmMachine, wmGeometry]
  };



  var inductionSequence = {
    kicker: DE ? "Induction" : "Induction",
    title: DE ? "Arten von Heads: Induktion" : "Types of heads: induction",
    teaser: DE
      ? "Es gibt verschiedene Arten von Heads, die verschiedene Aufgaben übernehmen.\n\n\nDas Netzwerk lernt, wann es auf früher Geschriebenes zurückgreifen und es einfach kopieren kann. Im Beispiel folgte auf das erste „Hund“ ein „bellt“; steht später wieder „Hund“, kann das Modell „bellt“ von dort übernehmen.\n\n\nDas braucht zwei Schichten. Ein Attention-Head ist ein kleiner Baustein, der Vektoren vergleicht. Er hat drei gelernte Teile: Query (Q, die Frage), Key (K, das Angebot) und Value (V, der Inhalt). Schicht 1 (Previous-Token-Head) schreibt an jede Stelle den Vorgänger als Key: An der Stelle von „bellt“ steht „davor: Hund“. Schicht 2 (Induction-Head) vergleicht die Query des aktuellen „Hund“ mit diesen Keys; der Key passt, und die Attention-Gewichte geben der Stelle hohes Gewicht. Der OV-Teil, der Kopierer, schreibt den Value dort („bellt“) an die aktuelle Stelle; deshalb steigt die Wahrscheinlichkeit für „bellt“.\n\n\nDer Kopf liest keine Bedeutung. Er vergleicht gelernte Vektoren: Wenn zwei Stellen ähnlich genug sind, schaut er dorthin.\n\n\nQK ist der Query-Key-Vergleich: Er bestimmt die Attention-Gewichte, also wohin geschaut wird. OV ist die Value-Output-Abbildung: Sie bestimmt, was an der Zielstelle ankommt. Beide sind gelernte Matrizen, keine Tabelle. Schicht 1 baut den Key, Schicht 2 findet ihn, OV kopiert den Value. Wofür? Für In-Context-Learning: auf früher Gesagtes verweisen, ohne die Gewichte neu zu trainieren, und früher genannte Konzepte wieder aufgreifen, nicht nur Wörter wiederholen."
      : "Different types of heads take on different tasks.\n\n\nThe network learns when to fall back on earlier text and simply copy it. In the example, the first “dog” was followed by “barks”; when “dog” appears again later, the model can take “barks” from there.\n\n\nThis takes two layers. An attention head is a small building block that compares vectors. It has three learned parts: query (Q, the question), key (K, what is offered), and value (V, the content). Layer 1 (previous-token head) writes the predecessor as a key at each position: at the position of “barks” it says “before: dog”. Layer 2 (induction head) compares the query of the current “dog” with these keys; the key matches, and the attention weights give that position a high weight. The OV part, the copier, writes the value there (“barks”) to the current position; that is why “barks” becomes more likely.\n\n\nThe head does not read meaning. It compares learned vectors: when two places are similar enough, it looks there.\n\n\nQK is the query-key comparison: it determines the attention weights, that is, where to look. OV is the value-output map: it determines what arrives at the target position. Both are learned matrices, not a table. Layer 1 builds the key, layer 2 finds it, OV copies the value. Why? For in-context learning: refer to earlier text without retraining the weights, and pick up concepts mentioned earlier, not just repeat words.",
    watch: DE ? "Lies den Beispieltext links. Verfolge, was Schicht 1 allein macht, was Schicht 2 allein, und was beide zusammen vorhersagen." : "Read the example text on the left. Follow what layer 1 does alone, what layer 2 does alone, and what both predict together.",
    demoState: { scene: "induction", mode: "sequence" },
    context: "",
    deep: "",
    boxes: [
      box("ind-1", DE ? "Regel" : "Rule", DE ? "Was wird kopiert?" : "What is copied?", DE ? "Nicht das aktuelle $A$, sondern das $B$, das beim vorherigen $A$ folgte. Der Kopf findet die Stelle und gibt ihr einen hohen Attention-Wert." : "Not the current $A$, but the $B$ that followed the previous $A$. The head finds the position and gives it a high attention value."),
      box("ind-2", DE ? "Mathematik" : "Mathematics", DE ? "QK wählt, OV kopiert" : "QK selects, OV copies", DE ? "Der QK-Schaltkreis $W_Q^\\top W_K$ entscheidet, wohin geschaut wird. Der OV-Schaltkreis $W_O W_V$ entscheidet, was an der aktuellen Position ankommt. Beide sind gelernt und pro Head verschieden." : "The QK circuit $W_Q^\\top W_K$ decides where to look. The OV circuit $W_O W_V$ decides what arrives at the current position. Both are learned and differ per head.", DE ? "\\underbrace{\\underbrace{\\operatorname{score}(i,j)}_{\\text{Attention}} = \\underbrace{\\mathbf{q}_i^\\top \\mathbf{k}_j}_{\\text{QK-Schaltkreis}}}_{\\text{wen besuchen?}} \\qquad \\underbrace{\\underbrace{\\Delta \\mathbf{x}_i}_{\\text{Kopie}} = \\underbrace{W_O}_{\\text{OV-Schaltkreis}} \\mathbf{v}_j}_{\\text{was ankommt?}}" : "\\underbrace{\\underbrace{\\operatorname{score}(i,j)}_{\\text{attention}} = \\underbrace{\\mathbf{q}_i^\\top \\mathbf{k}_j}_{\\text{QK circuit}}}_{\\text{where to attend?}} \\qquad \\underbrace{\\underbrace{\\Delta \\mathbf{x}_i}_{\\text{copy}} = \\underbrace{W_O}_{\\text{OV circuit}} \\mathbf{v}_j}_{\\text{what arrives?}}")
    ],
    sources: [
      { label: "Olsson et al. (2022), In-context Learning and Induction Heads", url: "https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html", why: { de: "Induktionsköpfe, Zwei-Head-Schaltkreis und Phase Change.", en: "Induction heads, the two-head circuit, and the phase change." } },
      { label: "Elhage et al. (2021), A Mathematical Framework for Transformer Circuits", url: "https://transformer-circuits.pub/2021/framework/index.html", why: { de: "QK/OV-Zerlegung, Copying Heads und K-Composition.", en: "QK/OV decomposition, copying heads, and K-composition." } }
    ]
  };

  var inductionHeads = {
    kicker: DE ? "Familie" : "Family",
    title: DE ? "Arten von Heads: Copy Heads" : "Types of heads: copy heads",
    teaser: DE
      ? "Induktion ist ein Mitglied einer Familie von Copy-Heads. Ein Duplicate-Token-Head schaut auf ein früheres Vorkommen desselben Tokens und kopiert dessen Position. Ein Successor-Head erhöht ein geordnetes Token (Montag → Dienstag) über eine gelernte Richtung. Ein Name-Mover-Head kopiert einen Namen aus dem Kontext in die Antwort. Alle teilen denselben Kern: Attention wählt eine Quelle, OV schreibt ihren Inhalt. Was sie unterscheidet, ist die Regel, die die Quelle wählt.\n\n\nDie Einordnung als Head-Typ ist  keine feste anatomische Kategorie, sondern eine funktionale Beschreibung: Ein Head kann mehrere Rollen tragen, und dieselbe Rolle kann über mehrere Heads verteilt sein."
      : "Induction is one member of a family of copy heads. A duplicate-token head attends to an earlier occurrence of the same token and copies its position. A successor head increments an ordered token (Monday → Tuesday) through a learned direction. A name-mover head copies a name from the context into the answer. They share the same core: attention selects a source, OV writes its content. What differs is the rule that selects the source.\n\n\nThe label as a head type is not a fixed anatomical category but a functional description: one head can carry several roles, and one role can be spread across several heads.",
    watch: DE ? "Klicke eine Karte. Vergleiche, welche Quelle die Attention wählt und was kopiert wird." : "Click a card. Compare which source attention selects and what is copied.",
    demoState: { scene: "induction", mode: "heads" },
    context: "",
    deep: "",
    boxes: [
      box("heads-1", DE ? "Gemeinsam" : "Shared", DE ? "Der Kern" : "The core", DE ? "Alle vier benutzen Attention, um eine Quelle zu wählen, und eine OV-Matrix, um deren Inhalt in den Residualstrom zu schreiben. Der Unterschied liegt in der Query-Key-Regel." : "All four use attention to select a source and an OV matrix to write its content into the residual stream. The difference is in the query-key rule."),
      box("heads-2", DE ? "Duplicate" : "Duplicate", DE ? "Gleiches Token, frühere Stelle" : "Same token, earlier place", DE ? "Der Kopf schaut auf ein früheres Vorkommen desselben Tokens. Im IOI-Schaltkreis signalisiert das, dass ein Name wiederholt wurde; die Position des früheren Vorkommens wird weitergegeben." : "The head attends to an earlier occurrence of the same token. In the IOI circuit this signals that a name was repeated; the position of the earlier occurrence is passed on."),
      box("heads-3", DE ? "Successor" : "Successor", DE ? "Nächstes in der Ordnung" : "Next in the order", DE ? "Der Kopf erhöht ein Token aus einer geordneten Folge: Montag → Dienstag, 4 → 5, März → April. Die Ordnung ist gelernt, nicht im Kontext nachgeschlagen; die OV-Matrix verschiebt die Aktivierung entlang einer Richtung." : "The head increments a token from an ordered sequence: Monday → Tuesday, 4 → 5, March → April. The order is learned, not looked up in the context; the OV matrix shifts the activation along a direction."),
      box("heads-4", DE ? "Name-Mover" : "Name-mover", DE ? "Kopiere den richtigen Namen" : "Copy the right name", DE ? "Im Satz „Als Mary und John ... John gab ...“ schaut der Name-Mover-Head auf Mary und kopiert sie in die Antwort. S-Inhibition-Heads unterdrücken dabei den wiederholten John. Das ist kein Sequenzmuster, sondern faktenbezogenes Kopieren." : "In “When Mary and John … John gave …”, the name-mover head attends to Mary and copies her into the answer. S-inhibition heads suppress the repeated John. This is not sequence matching; it is fact-like copying.")
    ],
    sources: [
      { label: "Olsson et al. (2022), In-context Learning and Induction Heads", url: "https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html", why: { de: "Induktionsköpfe und Copying-Heads im Kontext.", en: "Induction heads and copying heads in context." } },
      { label: "Ferrando et al. (2024), A Primer on the Inner Workings of Transformer-based Language Models", url: "https://arxiv.org/abs/2405.00208", why: { de: "Überblick über Duplicate-, Successor- und Name-Mover-Heads.", en: "Overview of duplicate, successor, and name-mover heads." } },
      { label: "Gould et al. (2023), Successor Heads", url: "https://arxiv.org/abs/2312.09230", why: { de: "Successor-Heads erhöhen geordnete Tokens wie Montag → Dienstag.", en: "Successor heads increment ordered tokens such as Monday → Tuesday." } },
      { label: "Wang et al. (2022), Interpretability in the Wild", url: "https://arxiv.org/abs/2211.00593", why: { de: "Der IOI-Schaltkreis mit Name-Mover- und S-Inhibition-Heads.", en: "The IOI circuit with name-mover and S-inhibition heads." } }
    ]
  };

  var inductionEmergence = Object.assign({}, inductionSequence, {
    kicker: DE ? "Emergenz" : "Emergence",
    title: DE ? "Der Phase Change" : "The phase change",
    teaser: DE
      ? "Induktionsköpfe entstehen nicht von Anfang an. In kleinen Modellen bilden sie sich in einem schmalen Trainingsfenster, etwa zwischen 2,5 und 5 Milliarden Tokens. Die Loss-Kurve ist hat dort einen kleinen Buckel. Ein ein-Schichten-Modell ohne Induktionsköpfe zeigt keinen solchen Sprung.\n\nDas ist kein Beweis, aber doch starke Evidenz für einen Zusammenhang der Attention-Heads zwischen den Layer für diese Mechanismus. Andere Mechanismen könnten im selben Fenster entstehen."
      : "Induction heads do not exist from the start. In small models they form in a narrow training window, roughly between 2.5 and 5 billion tokens. The loss curve has a small bump there. A one-layer model without induction heads shows no such jump.\n\nThis is not proof, but strong evidence for a connection between the attention heads across the layers for this mechanism. Other mechanisms could form in the same window.",
    watch: DE ? "Fahre über Kurven, Fenster und Achsen: Jeder Punkt zeigt Wert und Tokenzahl. Im Loss wird die Steigung erst flacher, dann steiler, dann wieder flacher." : "Hover the curves, window, and axes: each point shows its value and token count. In the loss, the slope flattens, then steepens, then flattens again.",
    demoState: { scene: "induction", mode: "emergence" },
    boxes: [],
    sources: inductionSequence.sources
  });

  var inductionStep = {
    kicker: DE ? "In-Context" : "In-context",
    title: DE ? "Arten von Attention-Heads" : "Types of Attention Heads",
    substeps: [inductionSequence, inductionHeads, inductionEmergence, headConcatSubstep]
  };

  var spacetimeSpace = {
    kicker: DE ? "Raum" : "Space",
    title: DE ? "Wo liegt Paris?" : "Where is Paris?",
    teaser: DE
      ? "Wes Gurnee und Max Tegmark untersuchten 2023, ob große Sprachmodelle geografische und historische Informationen nur auswendig lernen oder ob sie lineare, relative Repräsentationen von Raum und Zeit in ihren Aktivierungen ausbilden. Dazu trainierten sie lineare Probes auf den inneren Aktivierungen des Modells.\n\nDas Ergebnis zeigte eine relative, lineare Karte: Städte und Ereignisse liegen in einer Geometrie, die Nachbarschaften und Richtungen teilweise wiedergibt. Absolute Koordinaten sind schwächer, die Fehler messbar; die Repräsentationen sind kein dynamisches kausales Weltmodell."
      : "Wes Gurnee and Max Tegmark asked in 2023 whether large language models only memorise geographic and historical information or whether they form linear, relative representations of space and time in their activations. They trained linear probes on the model's internal activations.\n\nThe result showed a relative, linear map: cities and events lie in a geometry that partially reproduces neighbourhoods and directions. Absolute coordinates are weaker and the errors are measurable; the representations are not a dynamic causal world model.",
    watch: "",
    demoState: { scene: "spacetime", mode: "space" },
    deep: DE ? "Llama-2 7B, 13B und 70B; lineare Ridge-Probe und ein MLP-Probe als Kontrolle. Der MLP-Probe verbessert $R^2$ kaum, was für lineare Lesbarkeit spricht. Absolute Koordinaten sind schwächer als relative Geometrie; NYC ist der schwächste Datensatz." : "Llama-2 7B, 13B, and 70B; linear ridge probe and an MLP probe as control. The MLP probe barely improves $R^2$, which supports linear readability. Absolute coordinates are weaker than relative geometry; NYC is the weakest dataset.",
    boxes: [
      box("st-1", DE ? "Mathematik" : "Mathematics", DE ? "Der Readout" : "The readout", DE ? "Eine lineare Probe bildet die Aktivierung $\\mathbf{x}$ auf Breite und Länge ab. Die Gewichte sind die gelernte Raumrichtung." : "A linear probe maps activation $\\mathbf{x}$ to latitude and longitude. The weights are the learned space direction.", DE ? "\\underbrace{(\\hat{\\phi},\\hat{\\lambda})}_{\\text{vorhergesagte Koordinaten}} = \\underbrace{W\\mathbf{x} + \\mathbf{b}}_{\\text{lineare Probe}}" : "\\underbrace{(\\hat{\\phi},\\hat{\\lambda})}_{\\text{predicted coordinates}} = \\underbrace{W\\mathbf{x} + \\mathbf{b}}_{\\text{linear probe}}"),
      box("st-3", DE ? "Karte" : "Map", DE ? "Relativ, nicht absolut" : "Relative, not absolute", DE ? "Die Probe trifft die Nachbarschaft besser als den exakten Ort. Ein Ort kann relativ richtig liegen und trotzdem hunderte Kilometer daneben. Die Karte ist also eine Koordinatenabbildung mit Fehlern, kein gespeichertes GIS." : "The probe gets the neighbourhood better than the exact place. A location can be relatively right and still hundreds of kilometres off. The map is a coordinate mapping with errors, not a stored GIS."),
    ],
    sources: [{ label: "Gurnee & Tegmark (2023), Language Models Represent Space and Time", url: "https://arxiv.org/abs/2310.02207", why: { de: "Lineare Karten von Raum und Zeit in Llama-2; space/time neurons.", en: "Linear maps of space and time in Llama-2; space/time neurons." } }]
  };

  var spacetimeTime = Object.assign({}, spacetimeSpace, {
    kicker: DE ? "Zeit" : "Time",
    title: DE ? "Wann starb Turing?" : "When did Turing die?",
    teaser: DE
      ? "Das Paper zeigt, dass sich Zeit aus den inneren Aktivierungen von Sprachmodellen linear auslesen lässt. Die lineare Probe ordnet historische Namen, Kunstwerke und Filme auf einer gemeinsamen Zeitachse an; die Jahreszahl lässt sich direkt aus der Aktivierung ablesen.\n\nBei historischen Personen ist die Zielgröße das Todesjahr, nicht die Lebensspanne. Die Daten umfassen Personen, die zwischen 1000 v. Chr. und 2000 n. Chr. gestorben sind. Eine Person wird also durch einen Punkt repräsentiert; Turing zum Beispiel durch 1954, sein Todesjahr. Die Probe liest dieses eine Jahr aus der Aktivierung, nicht die Lebensdauer. Die Punkte in der Demo sind schematisch; die echten Llama-Aktivierungen sind nicht abgebildet.\n\nZudem fanden die Forscher einzelne Zeit-Neuronen, die gezielt auf bestimmte Epochen reagieren. Manipuliert man diese Neuronen künstlich, verändert die KI ihre Vorhersagen und ordnet Ereignisse plötzlich anderen Zeiträumen zu."
      : "The paper shows that time can be read linearly from the internal activations of language models. The linear probe arranges historical names, artworks, and films on a shared time axis; the year can be read directly from the activation.\n\nFor historical figures the target is the death year, not the lifespan. The data cover people who died between 1000 BCE and 2000 CE. A person is therefore represented by one point; Turing, for example, by 1954, the year he died. The probe reads that single year from the activation, not the lifespan. The points in the demo are schematic; the real Llama activations are not shown.\n\nIn addition, the researchers found individual time neurons that respond specifically to certain eras. If these neurons are manipulated artificially, the AI changes its predictions and suddenly places events in different periods.",
    watch: "",
    demoState: { scene: "spacetime", mode: "time" },
    context: DE ? "Die Diagonale ist der perfekte Readout. Der Abstand eines Punktes zur Diagonalen ist der Fehler der Probe; die vertikalen Linien zeigen ihn. Die Jahreszahlen sind Todesjahre im gregorianischen Kalender; bei Newton nennt der julianische Kalender 1726/27." : "The diagonal is the perfect readout. A point's distance from the diagonal is the probe error; the vertical lines show it. The years are death years in the Gregorian calendar; for Newton the Julian calendar gives 1726/27.",
    deep: "",
    boxes: [
      box("st-limit", DE ? "Grenze" : "Limit", DE ? "Kausalität für das Modell" : "Causality for the model", DE ? "Manipuliert man die Aktivierung und fragt das Modell, verändern sich die Antworten gezielt: Pinnt man ein Zeit-Neuron auf einen anderen Wert, ändert sich die vorhergesagte Dekade. Nullt man Raum- oder Zeit-Neuronen, steigt der Loss auf Orts- beziehungsweise Zeitkontexten." : "If you manipulate the activation and query the model, the answers change in a targeted way: pinning a time neuron to another value changes the predicted decade. Zeroing space or time neurons increases the loss on place or time contexts.", "")
    ],
    sources: spacetimeSpace.sources
  });

  var spacetimeStep = {
    kicker: DE ? "Weltkarte" : "World map",
    title: DE ? "Raum und Zeit im Modell" : "Space and time in the model",
    substeps: [spacetimeSpace, spacetimeTime]
  };

  var steps = [introSteps[0], bausteineStep, gaussDataStep, tokenizeExamplesStep, tokenizeBpeStep, embeddingMergeStep, manifoldSteps[0], positionStep, attentionMergeStep, qkvStep, codeAttentionStep, inductionStep, neuralNeuronStep, neuralLossStep, neuralActivationStep, neuralLargeStep, neuralMlpStep, ffnStep, residualSteps[0], unembedStep, crossEntropyStep, introSteps[1], meadowSteps[0], worldModelStep, spacetimeStep, agentsCombinedStep, hallucinationStep, historySteps[0], philosophySteps[0], aiSocietyStep, consciousnessStep];

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

  // Resolve the eoy entry from every available source. The WordPress proxy may
  // strip inline scripts, so window.EOY_DAY can be missing; the body data
  // attribute (server side) and the URL itself are reliable fallbacks.
  var entryHost = window.__ASANAI_EOY_ROOT__ || document.body;
  var bodyEntry = parseInt((entryHost && entryHost.getAttribute("data-eoy-day")) || "", 10);
  var urlMatch = (window.location.pathname + window.location.search + window.location.hash).match(/eoy(?:%2F|\/)(\d+)/i);
  var requestedDay = typeof window.EOY_DAY === "number" ? Math.round(window.EOY_DAY)
    : (bodyEntry > 0 ? bodyEntry : (urlMatch ? parseInt(urlMatch[1], 10) : 0));
  var singleStep = requestedDay >= 1 && requestedDay <= steps.length ? steps[requestedDay - 1] : null;
  // Day 4 is the tokenizer entry: its second demo (BPE merges) lives in the
  // next flat step. Keep it inside eoy/4 as a substep instead of sending the
  // reader to eoy/5.
  var pairedSubsteps = { 4: [4] };
  var selectedStep = singleStep;
  if (singleStep && pairedSubsteps[requestedDay]) {
    var extraSteps = pairedSubsteps[requestedDay].map(function (index) { return steps[index]; })
      .filter(function (step) { return !!step; });
    selectedStep = Object.assign({}, singleStep, { substeps: [singleStep].concat(extraSteps) });
  }
  if (entryHost) entryHost.setAttribute("data-eoy-resolved", String(singleStep ? requestedDay : 0));
  var selectedDay = singleStep ? {
    id: "eoy-" + requestedDay,
    track: day.track,
    label: day.label,
    kicker: singleStep.kicker || day.kicker,
    title: singleStep.title || day.title,
    demo: day.demo,
    steps: [selectedStep],
    boxes: requestedDay === 1 ? day.boxes : [],
    sources: requestedDay === 1 ? day.sources : []
  } : day;

  var rootEl = document.getElementById("learnsys");

  LearnSys.mount(rootEl, {
    lang: DE ? "de" : "en",
    days: [selectedDay],
    tracks: [{ id: "transformer", label: DE ? "Im Transformer" : "Inside the transformer", days: "Intuition" }],
    mix: true,
    singleDay: true,
    startDay: 0,
    eoyResetState: !!singleStep,
    eoyNoHash: !!singleStep,
    eoySingle: !!singleStep,
    overlayRevision: "2026-11-26-image-fn-formula-6",
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
