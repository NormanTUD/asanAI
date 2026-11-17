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
        year: "~27.000 v. Chr.", label: "Ganz früh", title: "Kerben im Wolfsknochen",
        text: "Der Wolfsknochen von Dolní Věstonice trägt 55 Kerben in zwei Gruppen von 30 und 25. Die Kerben sind keine Schrift, aber sie halten Zählschritte fest. Rechnen beginnt als gegenständliches Zählen, lange bevor es Computer gibt.",
        images: [{ src: "../vestonice_wolf_bone.jpg", alt: "Der Wolfsknochen von Dolní Věstonice mit 55 Kerben", cap: "Der Wolfsknochen von Dolní Věstonice. J3n6 (2012), CC BY-SA 3.0.", href: "https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg" }],
        sources: [{ label: "J3n6 (2012), Wolf Bone from Dolní Věstonice", url: "https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg" }]
      },
      {
        year: "~300 v. Chr.", label: "Antike", title: "Tafeln und Zählbretter",
        text: "Die Salamis-Tafel ist das älteste erhaltene Zählbrett, etwa 300 v. Chr. Der Abakus macht Stellenwerte körperlich: Steine auf Linien, nicht Ziffern auf Papier. Rechnen wird ein Verfahren mit Regeln.",
        images: [{ src: "../salamic_table.jpg", alt: "Die Salamis-Tafel, das älteste erhaltene Zählbrett", cap: "Die Salamis-Tafel, ca. 300 v. Chr. Wilhelm Kubitschek (1899), Public Domain.", href: "https://de.wikipedia.org/wiki/Datei:Salaminische_Tafel_Salamis_Tablet_nach_Wilhelm_Kubitschek_Numismatische_Zeitschrift_Bd_31_Wien_1899_p._394_ff.jpg" }],
        sources: [{ label: "Wilhelm Kubitschek (1899), Salamis Tablet", url: "https://de.wikipedia.org/wiki/Datei:Salaminische_Tafel_Salamis_Tablet_nach_Wilhelm_Kubitschek_Numismatische_Zeitschrift_Bd_31_Wien_1899_p._394_ff.jpg" }]
      },
      {
        year: "Antike–1305", label: "Logik", title: "Denken als Regelwerk",
        text: "Aristoteles ordnet Schlüsse in Formen. Pāṇini beschreibt Sanskrit-Grammatik als Regelsystem. Llull kombiniert Begriffe auf drehenden Scheiben. Die Idee dahinter: Denken lässt sich als Regelwerk schreiben, nicht nur als Erfahrung.",
        images: [{ src: "../FigurScheiben.jpg", alt: "Llulls Ars Magna mit drehenden Begriffsscheiben", cap: "Llulls Ars Magna, 1305. Ramon Llull, Public Domain.", href: "https://blog.hnf.de/das-universum-des-ramon-llull/" }],
        sources: [{ label: "Ramon Llull (1305), Ars Magna", url: "https://blog.hnf.de/das-universum-des-ramon-llull/" }]
      },
      {
        year: "1673–1854", label: "Maschinen", title: "Rechnen wird mechanisch",
        text: "Leibniz baut eine Rechenmaschine für alle vier Grundrechenarten und träumt von einer universalen Zeichensprache. Babbage entwirft die Analytical Engine. Boole schreibt Logik als Algebra. Mechanik und formale Regeln rücken zusammen.",
        images: [{ src: "../Leibnizrechenmaschine.jpg", alt: "Nachbau der Leibniz-Rechenmaschine", cap: "Leibniz-Rechenmaschine, Nachbau. Eremeev (2016), CC BY-SA 4.0.", href: "https://de.wikipedia.org/wiki/Datei:Rechenmaschine_von_Leibniz_(Nachbau)_06.jpg" }],
        sources: [{ label: "Eremeev (2016), Leibniz Rechenmaschine", url: "https://de.wikipedia.org/wiki/Datei:Rechenmaschine_von_Leibniz_(Nachbau)_06.jpg" }]
      },
      {
        year: "1943–1958", label: "Neuron", title: "Das Neuron als Recheneinheit",
        text: "McCulloch und Pitts modellieren 1943 ein Neuron als logische Schwelle. Hebb formuliert 1949, dass gemeinsames Feuern Verbindungen stärkt. 1958 baut Rosenblatt das Perzeptron, das Gewichte aus Fehlern anpasst. Das Gehirn wird zum Vorbild für lernende Maschinen.",
        images: [{ src: "../walter_pitts_1954.jpg", alt: "Walter Pitts an einer Tafel, 1954", cap: "Walter Pitts, 1954. Francis Bello, Public Domain.", href: "https://commons.wikimedia.org/wiki/File:1954_Walter_Pitts_and_a_blackboard.jpg" }],
        sources: [{ label: "HNF (2023), McCulloch und Pitts", url: "https://blog.hnf.de/mcculloch-und-pitts-das-erste-neuronale-netz/" }]
      },
      {
        year: "1958–1973", label: "Perzeptron", title: "Eine Linie reicht nicht",
        text: "1958 präsentiert Rosenblatt das Perzeptron; die Mark-I-Maschine liest 400 Photozellen und lernt linear trennbare Muster. 1969 zeigen Minsky und Papert, dass eine einzelne Schicht XOR nicht lösen kann: Die vier Punkte lassen sich nicht mit einer Geraden trennen. Sie wissen, dass ein mehrschichtiges Netz das könnte; offen ist das Training. 1973 verstärkt der Lighthill-Bericht den ersten KI-Winter.",
        images: [
          { src: "../mark_i_perceptron_manual.png", alt: "Mark I Perceptron, Figur 2 aus dem Bedienhandbuch", cap: "Mark I Perceptron, Figur 2 aus dem Bedienhandbuch. John C. Hay und Albert E. Murray, Public Domain.", href: "https://commons.wikimedia.org/wiki/File:Mark_I_Perceptron,_Figure_2_of_operator%27s_manual.png" },
          { src: "../marvin_minsky_portrait.jpg", alt: "Marvin Minsky", cap: "Marvin Minsky. Steamtalks (Flickr), CC BY-SA 2.0.", href: "https://commons.wikimedia.org/wiki/File:Marvin_Minsky.jpg" }
        ],
        diagram: "xor",
        sources: [
          { label: "HNF (2019), Frank Rosenblatt und das Perzeptron", url: "https://blog.hnf.de/frank-rosenblatt/" },
          { label: "Minsky & Papert (1969), Perceptrons", url: "https://archive.org/details/perceptronsintro0000mins" },
          { label: "Lighthill (1973), Artificial Intelligence: A General Survey", url: "https://rodsmith.nz/wp-content/uploads/Lighthill_1973_Report.pdf" }
        ]
      },
      {
        year: "1961–1986", label: "Backprop", title: "Fehler rückwärts",
        text: "Rosenblatt beschreibt 1961 eine rückwärts gerichtete Fehlerkorrektur, aber ohne Gradient und Kettenregel. Linnainmaa entwickelt 1970 die reverse mode der automatischen Differentiation. 1986 popularisieren Rumelhart, Hinton und Williams Backpropagation; verborgene Schichten werden trainierbar.",
        images: [{ src: "../frank_rosenblatt_portrait.jpg", alt: "Frank Rosenblatt", cap: "Frank Rosenblatt. Anonymous (Heinz Nixdorf MuseumsForum), CC BY-SA 4.0.", href: "https://commons.wikimedia.org/wiki/File:Frank_Rosenblatt.jpg" }],
        diagram: "backprop",
        sources: [
          { label: "Rosenblatt (1961), CAL Report on Back-Propagating Errors", url: "https://archive.org/details/DTIC_AD0256582/page/n11/mode/2up" },
          { label: "Linnainmaa (1970/1976), Cumulative Rounding Error", url: "https://papers.baulab.info/papers/also/Linnainmaa-1976.pdf" },
          { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0" }
        ]
      },
      {
        year: "1989–2012", label: "Deep Learning", title: "Bilder, GPUs, tiefe Netze",
        text: "LeCun kombiniert 1989 Backpropagation mit Faltungen für handgeschriebene Postleitzahlen. Fukushima, Waibel und Zhang liefern frühe Bausteine. 2012 gewinnt AlexNet mit tiefen CNNs und GPUs die ImageNet-Challenge. Tiefe Netze werden praktisch.",
        sources: [{ label: "Krizhevsky, Sutskever & Hinton (2012), AlexNet", url: "https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf" }]
      },
      {
        year: "2014–2017", label: "Transformer", title: "Attention ersetzt die Schleife",
        text: "Bahdanau, Cho und Bengio lassen 2014 den Decoder auf die Eingabewörter zurückblicken. 2017 ersetzt der Transformer die wiederkehrende Verarbeitung durch Self-Attention und fügt Positionsinformation hinzu. Sätze lassen sich parallel verarbeiten, ohne die Wortreihenfolge zu verlieren.",
        images: [{ src: "../transformer_architecture.png", alt: "Die Encoder-Decoder-Architektur des Transformers", cap: "Transformer-Architektur, Figur 1 aus Attention Is All You Need. Ashish Vaswani et al. (Google), CC BY-SA 4.0.", href: "https://commons.wikimedia.org/wiki/File:Attention_Is_All_You_Need_-_Encoder-decoder_Architecture.png" }],
        sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }]
      },
      {
        year: "2018–2022", label: "GPT", title: "Vorhersage wird Dialog",
        text: "2018 zeigt GPT-1 mit 117 Millionen Parametern Pretraining plus Fine-Tuning. 2019 folgt GPT-2 mit 1,5 Milliarden und Prompting, 2020 GPT-3 mit 175 Milliarden und Few-Shot. 2022 zeigt Chinchilla, dass mehr Daten pro Parameter oft besser sind; ChatGPT verbindet Instruction-Tuning und RLHF.",
        sources: [
          { label: "Brown et al. (2020), GPT-3", url: "https://arxiv.org/abs/2005.14165" },
          { label: "Hoffmann et al. (2022), Chinchilla", url: "https://arxiv.org/abs/2203.15556" },
          { label: "Ouyang et al. (2022), InstructGPT", url: "https://arxiv.org/abs/2203.02155" }
        ]
      }
    ] : [
      {
        year: "~27,000 BCE", label: "Deep past", title: "Notches in a wolf bone",
        text: "The wolf bone from Dolní Věstonice carries 55 notches in two groups of 30 and 25. The notches are not writing, but they record counting steps. Arithmetic begins as embodied counting, long before computers.",
        images: [{ src: "../vestonice_wolf_bone.jpg", alt: "The Dolní Věstonice wolf bone with 55 notches", cap: "The Dolní Věstonice wolf bone. J3n6 (2012), CC BY-SA 3.0.", href: "https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg" }],
        sources: [{ label: "J3n6 (2012), Wolf Bone from Dolní Věstonice", url: "https://commons.wikimedia.org/wiki/File:Vl%C4%8D%C3%AD_radius.jpg" }]
      },
      {
        year: "~300 BCE", label: "Antiquity", title: "Tablets and counting boards",
        text: "The Salamis tablet is the oldest surviving counting board, from about 300 BCE. The abacus makes place value physical: stones on lines, not digits on paper. Calculation becomes a procedure with rules.",
        images: [{ src: "../salamic_table.jpg", alt: "The Salamis tablet, the oldest surviving counting board", cap: "The Salamis tablet, ca. 300 BCE. Wilhelm Kubitschek (1899), public domain.", href: "https://de.wikipedia.org/wiki/Datei:Salaminische_Tafel_Salamis_Tablet_nach_Wilhelm_Kubitschek_Numismatische_Zeitschrift_Bd_31_Wien_1899_p._394_ff.jpg" }],
        sources: [{ label: "Wilhelm Kubitschek (1899), Salamis Tablet", url: "https://de.wikipedia.org/wiki/Datei:Salaminische_Tafel_Salamis_Tablet_nach_Wilhelm_Kubitschek_Numismatische_Zeitschrift_Bd_31_Wien_1899_p._394_ff.jpg" }]
      },
      {
        year: "Antiquity–1305", label: "Logic", title: "Thought as a rulebook",
        text: "Aristotle arranges inferences into forms. Pāṇini describes Sanskrit grammar as a rule system. Llull combines concepts on rotating wheels. The idea: thought can be written as a rulebook, not only lived as experience.",
        images: [{ src: "../FigurScheiben.jpg", alt: "Llull's Ars Magna with rotating concept wheels", cap: "Llull's Ars Magna, 1305. Ramon Llull, public domain.", href: "https://blog.hnf.de/das-universum-des-ramon-llull/" }],
        sources: [{ label: "Ramon Llull (1305), Ars Magna", url: "https://blog.hnf.de/das-universum-des-ramon-llull/" }]
      },
      {
        year: "1673–1854", label: "Machines", title: "Calculation becomes mechanical",
        text: "Leibniz builds a calculator for all four arithmetic operations and dreams of a universal symbol language. Babbage designs the Analytical Engine. Boole writes logic as algebra. Mechanism and formal rules move closer together.",
        images: [{ src: "../Leibnizrechenmaschine.jpg", alt: "A replica of Leibniz's calculating machine", cap: "Leibniz calculating machine, replica. Eremeev (2016), CC BY-SA 4.0.", href: "https://de.wikipedia.org/wiki/Datei:Rechenmaschine_von_Leibniz_(Nachbau)_06.jpg" }],
        sources: [{ label: "Eremeev (2016), Leibniz Calculating Machine", url: "https://de.wikipedia.org/wiki/Datei:Rechenmaschine_von_Leibniz_(Nachbau)_06.jpg" }]
      },
      {
        year: "1943–1958", label: "Neuron", title: "The neuron as a computing unit",
        text: "McCulloch and Pitts model a neuron as a logical threshold in 1943. Hebb formulates in 1949 that neurons that fire together strengthen their connection. In 1958 Rosenblatt builds the perceptron, which adjusts weights from errors. The brain becomes the model for learning machines.",
        images: [{ src: "../walter_pitts_1954.jpg", alt: "Walter Pitts at a blackboard, 1954", cap: "Walter Pitts, 1954. Francis Bello, public domain.", href: "https://commons.wikimedia.org/wiki/File:1954_Walter_Pitts_and_a_blackboard.jpg" }],
        sources: [{ label: "HNF (2023), McCulloch and Pitts", url: "https://blog.hnf.de/mcculloch-und-pitts-das-erste-neuronale-netz/" }]
      },
      {
        year: "1958–1973", label: "Perceptron", title: "One line is not enough",
        text: "In 1958 Rosenblatt presents the perceptron; the Mark I machine reads 400 photocells and learns linearly separable patterns. In 1969 Minsky and Papert show that a single layer cannot solve XOR: the four points cannot be separated by a straight line. They know a multilayer network could; what is missing is training. In 1973 the Lighthill report deepens the first AI winter.",
        images: [
          { src: "../mark_i_perceptron_manual.png", alt: "Mark I Perceptron, figure 2 from the operator's manual", cap: "Mark I Perceptron, figure 2 from the operator's manual. John C. Hay and Albert E. Murray, public domain.", href: "https://commons.wikimedia.org/wiki/File:Mark_I_Perceptron,_Figure_2_of_operator%27s_manual.png" },
          { src: "../marvin_minsky_portrait.jpg", alt: "Marvin Minsky", cap: "Marvin Minsky. Steamtalks (Flickr), CC BY-SA 2.0.", href: "https://commons.wikimedia.org/wiki/File:Marvin_Minsky.jpg" }
        ],
        diagram: "xor",
        sources: [
          { label: "HNF (2019), Frank Rosenblatt and the Perceptron", url: "https://blog.hnf.de/frank-rosenblatt/" },
          { label: "Minsky & Papert (1969), Perceptrons", url: "https://archive.org/details/perceptronsintro0000mins" },
          { label: "Lighthill (1973), Artificial Intelligence: A General Survey", url: "https://rodsmith.nz/wp-content/uploads/Lighthill_1973_Report.pdf" }
        ]
      },
      {
        year: "1961–1986", label: "Backprop", title: "Errors backward",
        text: "Rosenblatt describes a backward error correction in 1961, but without a gradient and chain rule. Linnainmaa develops reverse-mode automatic differentiation in 1970. In 1986 Rumelhart, Hinton, and Williams popularise backpropagation; hidden layers become trainable.",
        images: [{ src: "../frank_rosenblatt_portrait.jpg", alt: "Frank Rosenblatt", cap: "Frank Rosenblatt. Anonymous (Heinz Nixdorf MuseumsForum), CC BY-SA 4.0.", href: "https://commons.wikimedia.org/wiki/File:Frank_Rosenblatt.jpg" }],
        diagram: "backprop",
        sources: [
          { label: "Rosenblatt (1961), CAL Report on Back-Propagating Errors", url: "https://archive.org/details/DTIC_AD0256582/page/n11/mode/2up" },
          { label: "Linnainmaa (1970/1976), Cumulative Rounding Error", url: "https://papers.baulab.info/papers/also/Linnainmaa-1976.pdf" },
          { label: "Rumelhart, Hinton & Williams (1986), Back-Propagating Errors", url: "https://doi.org/10.1038/323533a0" }
        ]
      },
      {
        year: "1989–2012", label: "Deep Learning", title: "Images, GPUs, deep networks",
        text: "LeCun combines backpropagation with convolutions in 1989 for handwritten ZIP codes. Fukushima, Waibel, and Zhang supply early building blocks. In 2012 AlexNet wins ImageNet with deep CNNs and GPUs. Deep networks become practical.",
        sources: [{ label: "Krizhevsky, Sutskever & Hinton (2012), AlexNet", url: "https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf" }]
      },
      {
        year: "2014–2017", label: "Transformer", title: "Attention replaces the loop",
        text: "Bahdanau, Cho, and Bengio let the decoder look back at the input words in 2014. In 2017 the transformer replaces recurrent processing with self-attention and adds positional information. Sentences can be processed in parallel without losing word order.",
        images: [{ src: "../transformer_architecture.png", alt: "The transformer encoder-decoder architecture", cap: "Transformer architecture, figure 1 from Attention Is All You Need. Ashish Vaswani et al. (Google), CC BY-SA 4.0.", href: "https://commons.wikimedia.org/wiki/File:Attention_Is_All_You_Need_-_Encoder-decoder_Architecture.png" }],
        sources: [{ label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }]
      },
      {
        year: "2018–2022", label: "GPT", title: "Prediction becomes dialogue",
        text: "In 2018 GPT-1 shows with 117 million parameters that pretraining plus fine-tuning works. In 2019 GPT-2 follows with 1.5 billion and prompting; in 2020 GPT-3 has 175 billion and few-shot learning. In 2022 Chinchilla shows that more data per parameter often helps, and ChatGPT combines instruction tuning with RLHF.",
        sources: [
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
    el.className = "ls-history-scene";
    el.innerHTML = '<div class="ls-history-head"><span class="ls-history-kicker">' + (DE ? "Geschichte in zehn Schritten" : "History in ten steps") + '</span><span class="ls-history-hint">' + (DE ? "Tab wählen" : "Choose a tab") + '</span></div>' +
      '<div class="ls-history-legend" aria-hidden="true">' + STRANDS.map(function (st) { return '<span><i style="background:' + st.color + '"></i>' + st.label + '</span>'; }).join("") + '</div>' +
      '<div class="ls-history-tabs" role="tablist" aria-label="' + (DE ? "Geschichte" : "History") + '"></div>' +
      '<div class="ls-history-panel" role="tabpanel" aria-live="polite"></div>' +
      '<div class="ls-tokenize-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-history-prev">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-tokenize-progress ls-history-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-history-next">' + (DE ? "Weiter →" : "Next →") + '</button></div>';
    root.appendChild(el);
    var track = el.querySelector(".ls-history-tabs");
    var panel = el.querySelector(".ls-history-panel");
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
    function figuresHTML(e) {
      if (!e.images || !e.images.length) return "";
      return '<div class="ls-history-figures">' + e.images.map(function (im) {
        return '<figure class="ls-history-figure"><img src="' + api.esc(im.src) + '" alt="' + api.esc(im.alt) + '" loading="lazy" decoding="async"><figcaption>' + api.esc(im.cap) + ' <a href="' + api.esc(im.href) + '" target="_blank" rel="noopener">' + (DE ? "Quelle" : "Source") + '</a></figcaption></figure>';
      }).join("") + '</div>';
    }
    function sourcesHTML(e) {
      var ss = e.sources || (e.source ? [e.source] : []);
      if (!ss.length) return "";
      return '<div class="ls-history-sources">' + ss.map(function (s) {
        return '<a class="ls-history-source" href="' + api.esc(s.url) + '" target="_blank" rel="noopener">' + api.esc(s.label) + '</a>';
      }).join("") + '</div>';
    }
    function render() {
      index = Math.max(0, Math.min(tabs.length - 1, index));
      track.innerHTML = tabs.map(function (t, i) {
        var st = STRANDS[TAB_STRAND[i] || 0];
        return '<button type="button" class="ls-history-node' + (i === index ? ' is-on' : '') + '" role="tab" aria-selected="' + (i === index ? 'true' : 'false') + '" data-history="' + i + '" style="--strand-color:' + st.color + '"><b>' + api.esc(t.year) + '</b><span>' + api.esc(t.label) + '</span></button>';
      }).join("");
      track.querySelectorAll("[data-history]").forEach(function (b) {
        b.addEventListener("click", function () { setIndex(parseInt(b.getAttribute("data-history"), 10)); });
      });
      var e = tabs[index];
      panel.innerHTML = '<div class="ls-history-year">' + api.esc(e.year) + '</div>' +
        '<h3 class="ls-history-title">' + api.esc(e.title) + '</h3>' +
        '<p class="ls-history-text">' + api.esc(e.text) + '</p>' +
        figuresHTML(e) +
        (e.diagram ? '<div class="ls-history-diagram">' + diagramHTML(e.diagram) + '</div>' : '') +
        sourcesHTML(e);
      progress.textContent = (index + 1) + ' / ' + tabs.length;
      prevBtn.disabled = index === 0;
      nextBtn.textContent = index === tabs.length - 1 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
      track.querySelectorAll("[data-history]").forEach(function (b, i) { b.classList.toggle("is-on", i === index); b.setAttribute("aria-selected", i === index ? "true" : "false"); });
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
        if (s && typeof s.tab === "number" && s.tab !== index) {
          index = s.tab;
          render();
        }
      },
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) {
        return api.util.arrowKey(e, nextInternal, prevInternal);
      },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }

  core.register("history", historyScene);
})();
