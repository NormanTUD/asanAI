(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function historyScene(root, api) {
    var DE = api.lang === "de";
    var tabs = DE ? [
      {
        year: "ca. 30.000 BP", label: "Ganz früh", title: "Kerben im Wolfsknochen",
        text: "Der Wolfsknochen von Dolní Věstonice trägt 55 Kerben, in zwei Gruppen von 30 und 25; die Datierung liegt bei etwa 27.000 Jahren vor heute. Die Kerben sind keine Schrift, sondern wahrscheinlich Zählmarken, und die Deutung ist umstritten. Der Ishango-Knochen aus dem Kongo, rund 20.000 Jahre alt, zeigt ebenfalls Gruppen von Kerben; manche lesen darin Primzahlen oder einen Mondkalender. Rechnen beginnt als gegenständliches Zählen, lange bevor es Computer gibt.",
        images: [
          { src: "../vestonice_wolf_bone.jpg", alt: "Der Wolfsknochen von Dolní Věstonice mit 55 Kerben", cap: "Der Wolfsknochen von Dolní Věstonice. J3n6 (2012), CC BY-SA 3.0.", href: "https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg" },
          { src: "../ishango.jpg", alt: "Der Ishango-Knochen mit gruppierten Kerben", cap: "Ishango-Knochen, etwa 20.000 Jahre alt. Ben2, CC BY-SA 3.0.", href: "https://de.wikipedia.org/wiki/Datei:Os_d%27Ishango_IRSNB.JPG" }
        ],
        sources: [
          { label: "J3n6 (2012), Wolf Bone from Dolní Věstonice", url: "https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg" },
          { label: "Wikipedia: Tally stick", url: "https://en.wikipedia.org/wiki/Tally_stick" },
          { label: "Wikipedia: Ishango bone", url: "https://en.wikipedia.org/wiki/Ishango_bone" }
        ]
      },
      {
        year: "~300 v. Chr.", label: "Antike", title: "Tafeln, Zählbretter und Zahnräder",
        text: "Die Salamis-Tafel gilt als eines der ältesten erhaltenen Zählbretter, etwa 300 v. Chr.; Steine auf Linien machen Stellenwerte körperlich. Der Mechanismus von Antikythera, um 100 v. Chr. aus einem Schiffswrack geborgen, ist ein analoger Zahnradrechner mit mindestens 30 Bronzezahnrädern; er sagte Sonnen- und Mondpositionen sowie Finsternisse voraus. Rechnen wird ein Verfahren mit Regeln und Mechanismen.",
        images: [
          { src: "../salamic_table.jpg", alt: "Die Salamis-Tafel, eines der ältesten erhaltenen Zählbretter", cap: "Die Salamis-Tafel, ca. 300 v. Chr. Wilhelm Kubitschek (1899), Public Domain.", href: "https://de.wikipedia.org/wiki/Datei:Salaminische_Tafel_Salamis_Tablet_nach_Wilhelm_Kubitschek_Numismatische_Zeitschrift_Bd_31_Wien_1899_p._394_ff.jpg" },
          { src: "../antikythera.jpg", alt: "Fragmente des Mechanismus von Antikythera", cap: "Fragmente des Mechanismus von Antikythera. Therese Clutario, CC BY 2.0.", href: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Fragments_of_the_Antikythera_Mechanism.jpg" }
        ],
        sources: [
          { label: "Wilhelm Kubitschek (1899), Salamis Tablet", url: "https://de.wikipedia.org/wiki/Datei:Salaminische_Tafel_Salamis_Tablet_nach_Wilhelm_Kubitschek_Numismatische_Zeitschrift_Bd_31_Wien_1899_p._394_ff.jpg" },
          { label: "Wikipedia: Antikythera mechanism", url: "https://en.wikipedia.org/wiki/Antikythera_mechanism" }
        ]
      },
      {
        year: "Antike–1305", label: "Logik · Llull 1305", title: "Denken als Regelwerk",
        text: "Aristoteles ordnet Schlüsse in Formen; Pāṇini beschreibt Sanskrit-Grammatik als Regelsystem. Llull kombiniert auf den drehenden Scheiben seiner Ars Magna (1305) Begriffe mechanisch. Die Idee: Denken lässt sich als Regelwerk schreiben und mit einer Maschine kombinieren, nicht nur als Erfahrung.",
        images: [{ src: "../FigurScheiben.jpg", alt: "Llulls Ars Magna mit drehenden Begriffsscheiben", cap: "Llulls Ars Magna, 1305. Ramon Llull, Public Domain.", href: "https://blog.hnf.de/das-universum-des-ramon-llull/" }],
        sources: [{ label: "Ramon Llull (1305), Ars Magna", url: "https://blog.hnf.de/das-universum-des-ramon-llull/" }, { label: "Wikipedia: Ramon Llull", url: "https://en.wikipedia.org/wiki/Ramon_Llull" }]
      },
      {
        year: "1673–1854", label: "Maschinen", title: "Rechnen wird mechanisch",
        text: "Leibniz beginnt 1673 mit einer Rechenmaschine für alle vier Grundrechenarten; fertig wird sie 1694, arbeitet aber unzuverlässig. Babbage entwirft ab 1837 die Analytical Engine mit getrenntem Store und Mill; Ada Lovelace beschreibt 1843, wie darauf algorithmisch gerechnet werden kann. Boole schreibt 1854 die Logik als Algebra. Mechanik und formale Regeln rücken zusammen.",
        images: [
          { src: "../Leibnizrechenmaschine.jpg", alt: "Nachbau der Leibniz-Rechenmaschine", cap: "Leibniz-Rechenmaschine, Nachbau. Eremeev (2016), CC BY-SA 4.0.", href: "https://de.wikipedia.org/wiki/Datei:Rechenmaschine_von_Leibniz_(Nachbau)_06.jpg" },
          { src: "../charles_babbage_portrait.jpg", alt: "Charles Babbage", cap: "Charles Babbage, Anonymous (The Illustrated London News), Public Domain.", href: "https://commons.wikimedia.org/wiki/File:Charles_Babbage_1860.jpg" }
        ],
        sources: [
          { label: "Eremeev (2016), Leibniz Rechenmaschine", url: "https://de.wikipedia.org/wiki/Datei:Rechenmaschine_von_Leibniz_(Nachbau)_06.jpg" },
          { label: "Wikipedia: Analytical Engine", url: "https://en.wikipedia.org/wiki/Analytical_Engine" },
          { label: "Wikipedia: George Boole", url: "https://en.wikipedia.org/wiki/George_Boole" }
        ]
      },
      {
        year: "1943–1958", label: "Neuron", title: "Das Neuron als Recheneinheit",
        text: "McCulloch und Pitts modellieren 1943 ein Neuron als logische Schwelle: ein Netz aus Alles-oder-nichts-Zellen, das Boolesche Funktionen berechnet. Pitts war ein autodidaktischer Logiker aus Detroit, der mit zwölf die Principia Mathematica las und mit fünfzehn von zu Hause weglief, um in Chicago Bertrand Russell zu hören; bei McCulloch fand er ein Zuhause und lieferte die Logik für das Neuron. Hebb formuliert 1949 in The Organization of Behavior die erste einflussreiche Lernregel: Wenn Zelle A Zelle B wiederholt feuert, wächst die Verbindung. Die später geprägte Kurzformel „neurons that fire together, wire together“ fasst das zusammen; sie steht so nicht in Hebbs Buch. 1958 baut Rosenblatt das Perzeptron, das Gewichte aus Fehlern anpasst. Pitts zog sich nach dem Bruch mit Wiener zurück, verbrannte seine Dissertation und starb 1969 mit 46.",
        images: [
          { src: "../walter_pitts_1954.jpg", alt: "Walter Pitts an einer Tafel, 1954", cap: "Walter Pitts, 1954. Francis Bello, Public Domain.", href: "https://commons.wikimedia.org/wiki/File:1954_Walter_Pitts_and_a_blackboard.jpg" },
          { src: "../mcculloch_pitts_neuron.png", alt: "Diagramm einer McCulloch-Pitts-Zelle", cap: "McCulloch-Pitts-Zelle. Adrian Lange, CC BY-SA 3.0.", href: "https://commons.wikimedia.org/wiki/File:Diagram_of_a_McCulloch-Pitts-cell.svg" }
        ],
        sources: [
          { label: "McCulloch & Pitts (1943), A Logical Calculus of the Ideas Immanent in Nervous Activity", url: "https://doi.org/10.1007/BF02478259" },
          { label: "Hebb (1949), The Organization of Behavior", url: "https://archive.org/details/organizationofbe0000hebb" },
          { label: "Gefter (2015), The Man Who Tried to Redeem the World with Logic", url: "https://nautil.us/the-man-who-tried-to-redeem-the-world-with-logic-235253/" },
          { label: "Smalheiser (2000), Walter Pitts", url: "https://doi.org/10.1353/pbm.2000.0009" },
          { label: "HNF (2023), McCulloch und Pitts", url: "https://blog.hnf.de/mcculloch-und-pitts-das-erste-neuronale-netz/" }
        ]
      },
      {
        year: "1958–1973", label: "Perzeptron", title: "Eine Linie reicht nicht",
        text: "1958 präsentiert Rosenblatt das Perzeptron; die erste Software lief 1957 auf einer IBM 704, die Mark-I-Hardware baute sein Team um den Projektingenieur Charles Wightman zwischen 1959 und 1960. Die Maschine liest 400 Photozellen und lernt linear trennbare Muster. Rosenblatt, 1928 in New Rochelle geboren und 1956 in Cornell promoviert, veröffentlichte 1962 Principles of Neurodynamics; zu seinen Doktoranden gehörten George Nagy und R. D. Joseph, der die Theorie 1961 probabilistisch fundierte. 1969 zeigen Minsky und Papert, dass eine einzelne Schicht XOR nicht lösen kann; 1973 verstärkt der Lighthill-Bericht den ersten KI-Winter. Rosenblatt starb 1971 mit 43 bei einem Segelunfall auf der Chesapeake Bay.",
        images: [
          { src: "../perceptron2.jpg", alt: "Mark I Perceptron, ausgestellt im Smithsonian", cap: "Mark I Perceptron. U.S. Navy, Public Domain.", href: "https://commons.wikimedia.org/wiki/File:330-PSA-80-60_(USN_710739)_(20897323365).jpg" },
          { src: "../marvin_minsky_portrait.jpg", alt: "Marvin Minsky", cap: "Marvin Minsky. Steamtalks (Flickr), CC BY-SA 2.0.", href: "https://commons.wikimedia.org/wiki/File:Marvin_Minsky.jpg" },
          { src: "../frank_rosenblatt_portrait.jpg", alt: "Frank Rosenblatt", cap: "Frank Rosenblatt. Anonymous (Heinz Nixdorf MuseumsForum), CC BY-SA 4.0.", href: "https://commons.wikimedia.org/wiki/File:Frank_Rosenblatt.jpg" }
        ],
        diagram: "xor",
        sources: [
          { label: "Rosenblatt (1958), The Perceptron", url: "https://psycnet.apa.org/record/1959-09865-001" },
          { label: "Rosenblatt (1962), Principles of Neurodynamics", url: "https://archive.org/details/principlesofneur0000rose" },
          { label: "Minsky & Papert (1969), Perceptrons", url: "https://archive.org/details/perceptronsintro0000mins" },
          { label: "Lighthill (1973), Artificial Intelligence: A General Survey", url: "https://rodsmith.nz/wp-content/uploads/Lighthill_1973_Report.pdf" },
          { label: "Lefkowitz (2019), Professor's Perceptron Paved the Way for AI", url: "https://news.cornell.edu/stories/2019/09/professors-perceptron-paved-way-ai-60-years-too-soon" },
          { label: "Cornell memorial statement for Frank Rosenblatt (1971)", url: "https://ecommons.cornell.edu/bitstream/handle/1813/18965/Rosenblatt_Frank_1971.pdf" }
        ]
      },
      {
        year: "1961–1986", label: "Backprop", title: "Fehler rückwärts",
        text: "Rosenblatt beschreibt 1961 eine rückwärts gerichtete Fehlerkorrektur, aber ohne Gradient und Kettenregel. Linnainmaa entwickelt 1970 den Reverse Mode der automatischen Differentiation; Werbos formuliert 1974 Backpropagation für neuronale Netze. 1986 popularisieren Rumelhart, Hinton und Williams Backpropagation; verborgene Schichten werden trainierbar.",
        diagram: "backprop",
        sources: [
          { label: "Rosenblatt (1961), CAL Report on Back-Propagating Errors", url: "https://archive.org/details/DTIC_AD0256582/page/n11/mode/2up" },
          { label: "Linnainmaa (1970/1976), Cumulative Rounding Error", url: "https://papers.baulab.info/papers/also/Linnainmaa-1976.pdf" },
          { label: "Werbos (1974), Beyond Regression", url: "https://www.semanticscholar.org/paper/Beyond-Regression%3A-New-Tools-for-Prediction-and-in-Werbos/8f2b4f7f0f1f6f7c" },
          { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0" }
        ]
      },
      {
        year: "1989–2012", label: "Deep Learning", title: "Bilder, GPUs, tiefe Netze",
        text: "LeCun kombiniert 1989 Backpropagation mit Faltungen für handgeschriebene Postleitzahlen; LeNet-5 (1998) wird zum Standard für Ziffernerkennung. 2012 gewinnt AlexNet mit tiefen CNNs und GPUs die ImageNet-Challenge und senkt die Fehlerrate deutlich. 2016 gewinnt AlphaGo gegen Lee Sedol; tiefe Netze werden praktisch.",
        images: [{ src: "../alphago_leesedol.jpg", alt: "Lee Sedol und AlphaGo, 2016", cap: "Lee Sedol und AlphaGo, 2016. Korea Baduk Association, CC BY-SA 4.0.", href: "https://commons.wikimedia.org/wiki/File:Lee_Sedol_(B)_vs_AlphaGo_(W)_-_Game_4.jpg" }],
        sources: [
          { label: "LeCun et al. (1989), Backpropagation Applied to Handwritten Zip Code Recognition", url: "https://doi.org/10.1162/neco.1989.1.4.541" },
          { label: "Krizhevsky, Sutskever & Hinton (2012), AlexNet", url: "https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf" },
          { label: "Silver et al. (2016), Mastering the game of Go with deep neural networks", url: "https://doi.org/10.1038/nature16961" }
        ]
      },
      {
        year: "2014–2017", label: "Transformer", title: "Attention ersetzt die Schleife",
        text: "Bahdanau, Cho und Bengio lassen 2014 den Decoder auf die Eingabewörter zurückblicken. 2017 ersetzt der Transformer die wiederkehrende Verarbeitung durch Self-Attention und fügt Positionsinformation hinzu. Sätze lassen sich parallel verarbeiten, ohne die Wortreihenfolge zu verlieren; BERT und GPT bauen 2018 direkt darauf auf.",
        images: [{ src: "../transformer_architecture.png", alt: "Die Encoder-Decoder-Architektur des Transformers", cap: "Transformer-Architektur, Figur 1 aus Attention Is All You Need. Ashish Vaswani et al. (Google), CC BY-SA 4.0.", href: "https://commons.wikimedia.org/wiki/File:Attention_Is_All_You_Need_-_Encoder-decoder_Architecture.png" }],
        sources: [
          { label: "Bahdanau et al. (2014), Neural Machine Translation by Jointly Learning to Align and Translate", url: "https://arxiv.org/abs/1409.0473" },
          { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }
        ]
      },
      {
        year: "2018–2022", label: "GPT", title: "Vorhersage wird Dialog",
        text: "2018 zeigt GPT-1 mit 117 Millionen Parametern Pretraining plus Fine-Tuning. 2019 folgt GPT-2 mit 1,5 Milliarden und Prompting, 2020 GPT-3 mit 175 Milliarden und Few-Shot. 2022 zeigt Chinchilla, dass mehr Daten pro Parameter oft besser sind; InstructGPT zeigt SFT plus RLHF, und ChatGPTs genaues Rezept ist nicht veröffentlicht.",
        sources: [
          { label: "Radford et al. (2018), Improving Language Understanding by Generative Pre-Training", url: "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf" },
          { label: "Radford et al. (2019), GPT-2", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf" },
          { label: "Brown et al. (2020), GPT-3", url: "https://arxiv.org/abs/2005.14165" },
          { label: "Hoffmann et al. (2022), Chinchilla", url: "https://arxiv.org/abs/2203.15556" },
          { label: "Ouyang et al. (2022), InstructGPT", url: "https://arxiv.org/abs/2203.02155" }
        ]
      }
    ] : [
      {
        year: "ca. 30,000 BP", label: "Deep past", title: "Notches in a wolf bone",
        text: "The wolf bone from Dolní Věstonice carries 55 notches in two groups of 30 and 25; it is about 27,000 years old. The notches are not writing; they are probably tally marks, and the interpretation is disputed. The Ishango bone from the Congo, about 20,000 years old, also carries grouped notches; some read primes or a lunar calendar into them. Arithmetic begins as embodied counting, long before computers.",
        images: [
          { src: "../vestonice_wolf_bone.jpg", alt: "The Dolní Věstonice wolf bone with 55 notches", cap: "The Dolní Věstonice wolf bone. J3n6 (2012), CC BY-SA 3.0.", href: "https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg" },
          { src: "../ishango.jpg", alt: "The Ishango bone with grouped notches", cap: "Ishango bone, about 20,000 years old. Ben2, CC BY-SA 3.0.", href: "https://de.wikipedia.org/wiki/Datei:Os_d%27Ishango_IRSNB.JPG" }
        ],
        sources: [
          { label: "J3n6 (2012), Wolf Bone from Dolní Věstonice", url: "https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg" },
          { label: "Wikipedia: Tally stick", url: "https://en.wikipedia.org/wiki/Tally_stick" },
          { label: "Wikipedia: Ishango bone", url: "https://en.wikipedia.org/wiki/Ishango_bone" }
        ]
      },
      {
        year: "~300 BCE", label: "Antiquity", title: "Tablets, counting boards, gears",
        text: "The Salamis tablet is one of the oldest surviving counting boards, from about 300 BCE; stones on lines make place value physical. The Antikythera mechanism, recovered from a shipwreck and built around 100 BCE, is an analog gear computer with at least 30 bronze gears; it predicted solar and lunar positions and eclipses. Calculation becomes a procedure with rules and mechanisms.",
        images: [
          { src: "../salamic_table.jpg", alt: "The Salamis tablet, one of the oldest surviving counting boards", cap: "The Salamis tablet, ca. 300 BCE. Wilhelm Kubitschek (1899), public domain.", href: "https://de.wikipedia.org/wiki/Datei:Salaminische_Tafel_Salamis_Tablet_nach_Wilhelm_Kubitschek_Numismatische_Zeitschrift_Bd_31_Wien_1899_p._394_ff.jpg" },
          { src: "../antikythera.jpg", alt: "Fragments of the Antikythera mechanism", cap: "Fragments of the Antikythera mechanism. Therese Clutario, CC BY 2.0.", href: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Fragments_of_the_Antikythera_Mechanism.jpg" }
        ],
        sources: [
          { label: "Wilhelm Kubitschek (1899), Salamis Tablet", url: "https://de.wikipedia.org/wiki/Datei:Salaminische_Tafel_Salamis_Tablet_nach_Wilhelm_Kubitschek_Numismatische_Zeitschrift_Bd_31_Wien_1899_p._394_ff.jpg" },
          { label: "Wikipedia: Antikythera mechanism", url: "https://en.wikipedia.org/wiki/Antikythera_mechanism" }
        ]
      },
      {
        year: "Antiquity–1305", label: "Logic · Llull 1305", title: "Thought as a rulebook",
        text: "Aristotle arranges inferences into forms; Pāṇini describes Sanskrit grammar as a rule system. Llull combines concepts mechanically on the rotating wheels of his Ars Magna (1305). The idea: thought can be written as a rulebook and combined by a machine, not only lived as experience.",
        images: [{ src: "../FigurScheiben.jpg", alt: "Llull's Ars Magna with rotating concept wheels", cap: "Llull's Ars Magna, 1305. Ramon Llull, public domain.", href: "https://blog.hnf.de/das-universum-des-ramon-llull/" }],
        sources: [{ label: "Ramon Llull (1305), Ars Magna", url: "https://blog.hnf.de/das-universum-des-ramon-llull/" }, { label: "Wikipedia: Ramon Llull", url: "https://en.wikipedia.org/wiki/Ramon_Llull" }]
      },
      {
        year: "1673–1854", label: "Machines", title: "Calculation becomes mechanical",
        text: "Leibniz starts a calculator for all four arithmetic operations in 1673; it is finished in 1694 but works unreliably. Babbage designs the Analytical Engine from 1837 with separate store and mill; Ada Lovelace describes in 1843 how algorithms can run on it. Boole writes logic as algebra in 1854. Mechanism and formal rules move closer together.",
        images: [
          { src: "../Leibnizrechenmaschine.jpg", alt: "A replica of Leibniz's calculating machine", cap: "Leibniz calculating machine, replica. Eremeev (2016), CC BY-SA 4.0.", href: "https://de.wikipedia.org/wiki/Datei:Rechenmaschine_von_Leibniz_(Nachbau)_06.jpg" },
          { src: "../charles_babbage_portrait.jpg", alt: "Charles Babbage", cap: "Charles Babbage, Anonymous (The Illustrated London News), public domain.", href: "https://commons.wikimedia.org/wiki/File:Charles_Babbage_1860.jpg" }
        ],
        sources: [
          { label: "Eremeev (2016), Leibniz Calculating Machine", url: "https://de.wikipedia.org/wiki/Datei:Rechenmaschine_von_Leibniz_(Nachbau)_06.jpg" },
          { label: "Wikipedia: Analytical Engine", url: "https://en.wikipedia.org/wiki/Analytical_Engine" },
          { label: "Wikipedia: George Boole", url: "https://en.wikipedia.org/wiki/George_Boole" }
        ]
      },
      {
        year: "1943–1958", label: "Neuron", title: "The neuron as a computing unit",
        text: "McCulloch and Pitts model a neuron as a logical threshold in 1943: a network of all-or-none cells that computes Boolean functions. Pitts was a self-taught logician from Detroit who read Principia Mathematica at twelve and ran away from home at fifteen to hear Bertrand Russell in Chicago; McCulloch gave him a home, and Pitts supplied the logic for the neuron. Hebb formulates in 1949 in The Organization of Behavior the first influential learning rule: when cell A repeatedly fires cell B, the connection grows. The later slogan “neurons that fire together, wire together” summarises this; it is not Hebb's own wording. In 1958 Rosenblatt builds the perceptron, which adjusts weights from errors. Pitts withdrew after a break with Wiener, burned his dissertation, and died in 1969 at 46.",
        images: [
          { src: "../walter_pitts_1954.jpg", alt: "Walter Pitts at a blackboard, 1954", cap: "Walter Pitts, 1954. Francis Bello, public domain.", href: "https://commons.wikimedia.org/wiki/File:1954_Walter_Pitts_and_a_blackboard.jpg" },
          { src: "../mcculloch_pitts_neuron.png", alt: "Diagram of a McCulloch-Pitts cell", cap: "McCulloch-Pitts cell. Adrian Lange, CC BY-SA 3.0.", href: "https://commons.wikimedia.org/wiki/File:Diagram_of_a_McCulloch-Pitts-cell.svg" }
        ],
        sources: [
          { label: "McCulloch & Pitts (1943), A Logical Calculus of the Ideas Immanent in Nervous Activity", url: "https://doi.org/10.1007/BF02478259" },
          { label: "Hebb (1949), The Organization of Behavior", url: "https://archive.org/details/organizationofbe0000hebb" },
          { label: "Gefter (2015), The Man Who Tried to Redeem the World with Logic", url: "https://nautil.us/the-man-who-tried-to-redeem-the-world-with-logic-235253/" },
          { label: "Smalheiser (2000), Walter Pitts", url: "https://doi.org/10.1353/pbm.2000.0009" },
          { label: "HNF (2023), McCulloch and Pitts", url: "https://blog.hnf.de/mcculloch-und-pitts-das-erste-neuronale-netz/" }
        ]
      },
      {
        year: "1958–1973", label: "Perceptron", title: "One line is not enough",
        text: "In 1958 Rosenblatt presents the perceptron; the first software ran in 1957 on an IBM 704, and his team built the Mark I hardware around project engineer Charles Wightman between 1959 and 1960. The machine reads 400 photocells and learns linearly separable patterns. Rosenblatt, born in New Rochelle in 1928 and awarded a Cornell PhD in 1956, published Principles of Neurodynamics in 1962; his students included George Nagy and R. D. Joseph, who put the theory on a probabilistic footing in 1961. In 1969 Minsky and Papert show that a single layer cannot solve XOR; in 1973 the Lighthill report deepens the first AI winter. Rosenblatt died in 1971 at 43 in a sailing accident on Chesapeake Bay.",
        images: [
          { src: "../perceptron2.jpg", alt: "Mark I Perceptron on display at the Smithsonian", cap: "Mark I Perceptron. U.S. Navy, public domain.", href: "https://commons.wikimedia.org/wiki/File:330-PSA-80-60_(USN_710739)_(20897323365).jpg" },
          { src: "../marvin_minsky_portrait.jpg", alt: "Marvin Minsky", cap: "Marvin Minsky. Steamtalks (Flickr), CC BY-SA 2.0.", href: "https://commons.wikimedia.org/wiki/File:Marvin_Minsky.jpg" },
          { src: "../frank_rosenblatt_portrait.jpg", alt: "Frank Rosenblatt", cap: "Frank Rosenblatt. Anonymous (Heinz Nixdorf MuseumsForum), CC BY-SA 4.0.", href: "https://commons.wikimedia.org/wiki/File:Frank_Rosenblatt.jpg" }
        ],
        diagram: "xor",
        sources: [
          { label: "Rosenblatt (1958), The Perceptron", url: "https://psycnet.apa.org/record/1959-09865-001" },
          { label: "Rosenblatt (1962), Principles of Neurodynamics", url: "https://archive.org/details/principlesofneur0000rose" },
          { label: "Minsky & Papert (1969), Perceptrons", url: "https://archive.org/details/perceptronsintro0000mins" },
          { label: "Lighthill (1973), Artificial Intelligence: A General Survey", url: "https://rodsmith.nz/wp-content/uploads/Lighthill_1973_Report.pdf" },
          { label: "Lefkowitz (2019), Professor's Perceptron Paved the Way for AI", url: "https://news.cornell.edu/stories/2019/09/professors-perceptron-paved-way-ai-60-years-too-soon" },
          { label: "Cornell memorial statement for Frank Rosenblatt (1971)", url: "https://ecommons.cornell.edu/bitstream/handle/1813/18965/Rosenblatt_Frank_1971.pdf" }
        ]
      },
      {
        year: "1961–1986", label: "Backprop", title: "Errors backward",
        text: "Rosenblatt describes a backward error correction in 1961, but without a gradient and chain rule. Linnainmaa develops reverse-mode automatic differentiation in 1970; Werbos formulates backpropagation for neural networks in 1974. In 1986 Rumelhart, Hinton, and Williams popularise backpropagation; hidden layers become trainable.",
        diagram: "backprop",
        sources: [
          { label: "Rosenblatt (1961), CAL Report on Back-Propagating Errors", url: "https://archive.org/details/DTIC_AD0256582/page/n11/mode/2up" },
          { label: "Linnainmaa (1970/1976), Cumulative Rounding Error", url: "https://papers.baulab.info/papers/also/Linnainmaa-1976.pdf" },
          { label: "Werbos (1974), Beyond Regression", url: "https://www.semanticscholar.org/paper/Beyond-Regression%3A-New-Tools-for-Prediction-and-in-Werbos/8f2b4f7f0f1f6f7c" },
          { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0" }
        ]
      },
      {
        year: "1989–2012", label: "Deep Learning", title: "Images, GPUs, deep networks",
        text: "LeCun combines backpropagation with convolutions in 1989 for handwritten ZIP codes; LeNet-5 (1998) becomes the standard for digit recognition. In 2012 AlexNet wins ImageNet with deep CNNs and GPUs and sharply lowers the error rate. In 2016 AlphaGo beats Lee Sedol; deep networks become practical.",
        images: [{ src: "../alphago_leesedol.jpg", alt: "Lee Sedol and AlphaGo, 2016", cap: "Lee Sedol and AlphaGo, 2016. Korea Baduk Association, CC BY-SA 4.0.", href: "https://commons.wikimedia.org/wiki/File:Lee_Sedol_(B)_vs_AlphaGo_(W)_-_Game_4.jpg" }],
        sources: [
          { label: "LeCun et al. (1989), Backpropagation Applied to Handwritten Zip Code Recognition", url: "https://doi.org/10.1162/neco.1989.1.4.541" },
          { label: "Krizhevsky, Sutskever & Hinton (2012), AlexNet", url: "https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf" },
          { label: "Silver et al. (2016), Mastering the game of Go with deep neural networks", url: "https://doi.org/10.1038/nature16961" }
        ]
      },
      {
        year: "2014–2017", label: "Transformer", title: "Attention replaces the loop",
        text: "Bahdanau, Cho, and Bengio let the decoder look back at the input words in 2014. In 2017 the transformer replaces recurrent processing with self-attention and adds positional information. Sentences can be processed in parallel without losing word order; BERT and GPT build directly on it in 2018.",
        images: [{ src: "../transformer_architecture.png", alt: "The transformer encoder-decoder architecture", cap: "Transformer architecture, figure 1 from Attention Is All You Need. Ashish Vaswani et al. (Google), CC BY-SA 4.0.", href: "https://commons.wikimedia.org/wiki/File:Attention_Is_All_You_Need_-_Encoder-decoder_Architecture.png" }],
        sources: [
          { label: "Bahdanau et al. (2014), Neural Machine Translation by Jointly Learning to Align and Translate", url: "https://arxiv.org/abs/1409.0473" },
          { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }
        ]
      },
      {
        year: "2018–2022", label: "GPT", title: "Prediction becomes dialogue",
        text: "In 2018 GPT-1 shows with 117 million parameters that pretraining plus fine-tuning works. In 2019 GPT-2 follows with 1.5 billion and prompting; in 2020 GPT-3 has 175 billion and few-shot learning. In 2022 Chinchilla shows that more data per parameter often helps; InstructGPT demonstrates SFT plus RLHF, and ChatGPT's exact recipe is not published.",
        sources: [
          { label: "Radford et al. (2018), Improving Language Understanding by Generative Pre-Training", url: "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf" },
          { label: "Radford et al. (2019), GPT-2", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf" },
          { label: "Brown et al. (2020), GPT-3", url: "https://arxiv.org/abs/2005.14165" },
          { label: "Hoffmann et al. (2022), Chinchilla", url: "https://arxiv.org/abs/2203.15556" },
          { label: "Ouyang et al. (2022), InstructGPT", url: "https://arxiv.org/abs/2203.02155" }
        ]
      }
    ];

    var STRANDS = [
      { label: DE ? "Zählen" : "Counting", color: "#5c9baf" },
      { label: DE ? "Logik" : "Logic", color: "#9f9700" },
      { label: DE ? "Maschinen" : "Machines", color: "#1275ac" },
      { label: DE ? "Lernen" : "Learning", color: "#63a44b" },
      { label: DE ? "Hardware" : "Hardware", color: "#9185be" }
    ];
    var TAB_STRAND = [0, 0, 1, 2, 3, 3, 3, 4, 2, 3];
    var index = 0;
    var el = document.createElement("div");
    el.className = "ls-time-scene";
    el.innerHTML = '<header class="ls-time-head">' +
        '<div class="ls-time-head-copy"><span class="ls-time-kicker">' + (DE ? "Geschichte in zehn Schritten" : "History in ten steps") + '</span><span class="ls-time-sub">' + (DE ? "Zehn Stationen, ein Fluss." : "Ten stations, one river.") + '</span></div>' +
        '<div class="ls-time-legend" aria-hidden="true">' + STRANDS.map(function (st) { return '<span data-tip="' + (DE ? "Farbe der Stränge: zeigt, zu welchem Themenstrang dieser Schritt gehört." : "Strand colour: shows which theme this step belongs to.") + '"><i style="background:' + st.color + '"></i>' + st.label + '</span>'; }).join("") + '</div>' +
      '</header>' +
      '<div class="ls-time-layout">' +
        '<nav class="ls-time-rail" role="tablist" aria-label="' + (DE ? "Geschichte" : "History") + '"><span class="ls-time-rail-line" aria-hidden="true"></span></nav>' +
        '<article class="ls-time-stage" role="tabpanel" aria-live="polite"></article>' +
      '</div>' +
      '<div class="ls-tokenize-nav ls-time-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-history-prev" data-tip="' + (DE ? "Zum vorherigen Geschichtsschritt." : "Go to the previous history step.") + '">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-tokenize-progress ls-history-progress" data-tip="' + (DE ? "Position in der Zeitleiste." : "Position on the timeline.") + '"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-history-next" data-tip="' + (DE ? "Zum nächsten Geschichtsschritt." : "Go to the next history step.") + '">' + (DE ? "Weiter →" : "Next →") + '</button></div>';
    root.appendChild(el);
    var rail = el.querySelector(".ls-time-rail");
    var stage = el.querySelector(".ls-time-stage");
    var prevBtn = el.querySelector(".ls-history-prev");
    var nextBtn = el.querySelector(".ls-history-next");
    var progress = el.querySelector(".ls-history-progress");
    function diagramHTML(kind) {
      if (kind === "xor") {
        return '<svg viewBox="0 0 240 150" role="img" aria-label="' + (DE ? "XOR-Punkte: 0 und 1 wechseln sich ab; keine Gerade trennt sie." : "XOR points: 0 and 1 alternate; no straight line separates them.") + '">' +
          '<line x1="38" y1="122" x2="220" y2="122" stroke="#b9c8c3" stroke-width="1"/>' +
          '<line x1="38" y1="122" x2="38" y2="22" stroke="#b9c8c3" stroke-width="1"/>' +
          '<line x1="62" y1="28" x2="198" y2="118" stroke="#9f9700" stroke-width="1.5" stroke-dasharray="5 4"/>' +
          '<circle cx="70" cy="104" r="7" fill="#5c9baf"/><text x="70" y="132" text-anchor="middle" font-size="10" fill="#627476">0</text>' +
          '<circle cx="70" cy="38" r="7" fill="#63a44b"/><text x="70" y="20" text-anchor="middle" font-size="10" fill="#627476">1</text>' +
          '<circle cx="190" cy="104" r="7" fill="#63a44b"/><text x="190" y="132" text-anchor="middle" font-size="10" fill="#627476">1</text>' +
          '<circle cx="190" cy="38" r="7" fill="#5c9baf"/><text x="190" y="20" text-anchor="middle" font-size="10" fill="#627476">0</text>' +
          '<text x="122" y="144" text-anchor="middle" font-size="9" fill="#627476">' + (DE ? "keine Gerade trennt 0 und 1" : "no line separates 0 and 1") + '</text>' +
          '</svg>';
      }
      if (kind === "backprop") {
        function node(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="8" fill="#fff" stroke="#1275ac" stroke-width="1.6"/>'; }
        function arrow(x1, y1, x2, y2, col, dash) {
          return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + col + '" stroke-width="1.4"' + (dash ? ' stroke-dasharray="4 3"' : '') + '/>' +
            '<path d="M' + x2 + ' ' + y2 + ' l-4 -5 l6 1 z" fill="' + col + '"/>';
        }
        var html = '<svg viewBox="0 0 260 116" role="img" aria-label="' + (DE ? "Vorwärts durch das Netz, Fehler rückwärts durch Backpropagation." : "Forward through the network, error backward through backpropagation.") + '">';
        [30, 70, 100].forEach(function (y) { html += node(48, y); html += node(130, y); html += node(212, y); });
        [30, 70, 100].forEach(function (y) { html += arrow(58, y, 120, y, "#1275ac"); });
        [30, 70, 100].forEach(function (y) { html += arrow(202, y + 16, 140, y + 16, "#63a44b", true); });
        html += '<text x="130" y="14" text-anchor="middle" font-size="9" fill="#1275ac">Forward →</text>';
        html += '<text x="130" y="112" text-anchor="middle" font-size="9" fill="#63a44b">← ' + (DE ? "Fehler rückwärts" : "error backward") + '</text>';
        html += '</svg>';
        return html;
      }
      return "";
    }
    function heroHTML(e, accent) {
      var style = '--history-accent:' + accent + ';';
      if (e.images && e.images.length) {
        var images = e.images.slice(0, 3);
        var main = images[0];
        var caption = '<span>' + api.esc(main.cap) + '</span> <a href="' + api.esc(main.href) + '" target="_blank" rel="noopener">' + (DE ? "Quelle" : "Source") + '</a>';
        var gridClass = "ls-time-hero-grid" + (images.length > 1 ? " has-two" : "") + (images.length > 2 ? " has-three" : "");
        return '<figure class="ls-time-hero is-media" style="' + style + '">' +
          '<div class="' + gridClass + '">' + images.map(function (im, i) {
            return '<img class="ls-time-hero-img' + (i === 0 ? ' is-main' : ' is-side') + '" src="' + api.esc(im.src) + '" alt="' + api.esc(im.alt) + '" loading="lazy" decoding="async" data-tip="' + api.esc(im.cap) + '">';
          }).join("") + '</div>' +
          '<span class="ls-time-hero-year">' + api.esc(e.year) + '</span>' +
          '<figcaption class="ls-time-hero-caption">' + caption + '</figcaption>' +
        '</figure>';
      }
      if (e.diagram) {
        return '<div class="ls-time-hero is-diagram" style="' + style + '"><span class="ls-time-hero-year">' + api.esc(e.year) + '</span><div class="ls-time-diagram">' + diagramHTML(e.diagram) + '</div><b class="ls-time-poster-label">' + api.esc(e.label) + '</b></div>';
      }
      return '<div class="ls-time-hero is-poster" style="' + style + '"><span class="ls-time-hero-year">' + api.esc(e.year) + '</span><b class="ls-time-poster-label">' + api.esc(e.label) + '</b><i></i></div>';
    }
    function sourcesHTML(e) {
      var ss = e.sources || (e.source ? [e.source] : []);
      if (!ss.length) return "";
      return '<div class="ls-history-sources"><b class="ls-history-sources-label">' + (DE ? "Quellen" : "Sources") + '</b>' + ss.map(function (s) {
        return '<a class="ls-history-source" data-tip="' + (DE ? "Primärquelle zu diesem Schritt in einem neuen Tab öffnen." : "Open the primary source for this step in a new tab.") + '" href="' + api.esc(s.url) + '" target="_blank" rel="noopener">' + api.esc(s.label) + '</a>';
      }).join("") + '</div>';
    }
    function render() {
      index = Math.max(0, Math.min(tabs.length - 1, index));
      rail.innerHTML = '<span class="ls-time-rail-line" aria-hidden="true"></span>' + tabs.map(function (t, i) {
        var st = STRANDS[TAB_STRAND[i] || 0];
        return '<button type="button" class="ls-time-stop' + (i === index ? ' is-on' : '') + '" role="tab" aria-selected="' + (i === index ? 'true' : 'false') + '" data-history="' + i + '" data-tip="' + api.esc((DE ? "Schritt " : "Step ") + (i + 1) + ": " + t.title) + '" style="--strand-color:' + st.color + '"><span class="ls-time-stop-no">' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</span><span class="ls-time-stop-copy"><b>' + api.esc(t.year) + '</b><span>' + api.esc(t.label) + '</span></span><i aria-hidden="true"></i></button>';
      }).join("");
      rail.querySelectorAll("[data-history]").forEach(function (b) {
        b.addEventListener("click", function () { setIndex(parseInt(b.getAttribute("data-history"), 10)); });
      });
      var e = tabs[index];
      var activeStrand = STRANDS[TAB_STRAND[index] || 0];
      stage.style.setProperty("--history-accent", activeStrand.color);
      var hasInlineDiagram = e.diagram && e.images && e.images.length;
      stage.innerHTML = heroHTML(e, activeStrand.color) +
        '<div class="ls-time-story">' +
          '<div class="ls-time-story-meta"><span>' + (DE ? "Schritt " : "Step ") + (index + 1) + ' / ' + tabs.length + '</span><span class="ls-time-strand">' + api.esc(activeStrand.label) + '</span></div>' +
          '<div class="ls-time-year">' + api.esc(e.year) + '</div>' +
          '<h3 class="ls-time-title">' + api.esc(e.title) + '</h3>' +
          '<p class="ls-time-text">' + api.esc(e.text) + '</p>' +
          (hasInlineDiagram ? '<div class="ls-time-diagram-inline">' + diagramHTML(e.diagram) + '</div>' : '') +
          sourcesHTML(e) +
        '</div>';
      progress.textContent = (index + 1) + ' / ' + tabs.length;
      prevBtn.disabled = index === 0;
      nextBtn.textContent = index === tabs.length - 1 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
      rail.querySelectorAll("[data-history]").forEach(function (b, i) { b.classList.toggle("is-on", i === index); b.setAttribute("aria-selected", i === index ? "true" : "false"); });
    }
    function setIndex(i) {
      index = Math.max(0, Math.min(tabs.length - 1, i));
      render();
    }
    function nextInternal() { if (index < tabs.length - 1) { setIndex(index + 1); return true; } return false; }
    function prevInternal() { if (index > 0) { setIndex(index - 1); return true; } return false; }
    function nextStep() {
      if (nextInternal()) return;
      api.goNext();
    }
    function prevStep() {
      if (prevInternal()) return;
      api.goPrev();
    }
    prevBtn.addEventListener("click", prevStep);
    nextBtn.addEventListener("click", nextStep);
    render();
    return {
      update: function (s) {
        if (s && typeof s.tab === "number") {
          index = s.tab;
          render();
        }
      },
      next: nextInternal,
      prev: prevInternal,
      hasNext: function () { return index < tabs.length - 1; },
      hasPrev: function () { return index > 0; },
      onKey: function (e) {
        return api.util.arrowKey(e, nextInternal, prevInternal);
      },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }

  core.register("history", historyScene);
})();
