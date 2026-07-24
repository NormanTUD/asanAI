<!-- ============================================================
     RIVER OF IDEAS v5 — Light Mode, Vertical, Comprehensive
     More spacing, more connections, richer borders
     ============================================================ -->
<style>
  #river-container {
    position: relative;
    width: 100%;
    max-width: 1500px;
    margin: 2rem auto;
    background: #fafbfd;
    border-radius: 20px;
    padding: 3rem 2rem 2rem 2rem;
    overflow: hidden;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #1a2332;
    box-shadow: 0 2px 24px rgba(0,0,0,0.07);
    border: 1.5px solid #e2e8f0;
  }
  #river-container h2 {
    text-align: center;
    font-size: 1.8rem;
    letter-spacing: 0.03em;
    margin-bottom: 0.3rem;
    color: #1e3a5f;
  }
  #river-container .subtitle {
    text-align: center;
    font-size: 1rem;
    color: #5a7a9a;
    margin-bottom: 0.3rem;
    font-style: italic;
  }
  #river-container .subtitle2 {
    text-align: center;
    font-size: 0.85rem;
    color: #8a9bb5;
    margin-bottom: 1.8rem;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.5;
  }
  #river-svg { width: 100%; height: auto; display: block; }

  /* Tooltip */
  #river-tooltip {
    position: absolute;
    pointer-events: none;
    background: #fffffffa;
    border: 1.5px solid #c8d6e5;
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 0.92rem;
    line-height: 1.55;
    max-width: 340px;
    width: max-content;
    opacity: 0;
    transition: opacity 0.18s;
    z-index: 100;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  }
  #river-tooltip .tt-era {
    font-size: 0.72rem;
    color: #8a9bb5;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 2px;
  }
  #river-tooltip .tt-title {
    font-weight: 700;
    color: #1e3a5f;
    margin-bottom: 5px;
    font-size: 1.05rem;
  }
  #river-tooltip .tt-body {
    color: #4a6580;
    font-size: 0.88rem;
    line-height: 1.55;
  }
  #river-tooltip .tt-click {
    margin-top: 6px;
    font-size: 0.75rem;
    color: #8a9bb5;
    font-style: italic;
  }

  /* Legend */
  #river-legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 18px;
    margin-top: 1rem;
    margin-bottom: 0.8rem;
    font-size: 0.85rem;
  }
  #river-legend span {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #4a6580;
  }
  #river-legend .swatch {
    width: 12px; height: 12px;
    border-radius: 50%;
    display: inline-block;
  }

  /* Fade overlays at top and bottom to suggest "more beyond" */
  #river-fade-top, #river-fade-bottom,
  #river-fade-left, #river-fade-right {
    position: absolute;
    pointer-events: none;
    z-index: 10;
  }
  #river-fade-top {
    top: 0; left: 0; right: 0; height: 70px;
    background: linear-gradient(180deg, #fafbfd 0%, transparent 100%);
    border-radius: 20px 20px 0 0;
  }
  #river-fade-bottom {
    bottom: 0; left: 0; right: 0; height: 90px;
    background: linear-gradient(0deg, #fafbfd 0%, transparent 100%);
    border-radius: 0 0 20px 20px;
  }
  #river-fade-left {
    top: 0; bottom: 0; left: 0; width: 60px;
    background: linear-gradient(90deg, #fafbfd 0%, transparent 100%);
    border-radius: 20px 0 0 20px;
  }
  #river-fade-right {
    top: 0; bottom: 0; right: 0; width: 60px;
    background: linear-gradient(270deg, #fafbfd 0%, transparent 100%);
    border-radius: 0 20px 20px 0;
  }

  @keyframes pulse-glow {
    0%, 100% { filter: drop-shadow(0 0 3px rgba(56,103,214,0.3)); }
    50%      { filter: drop-shadow(0 0 12px rgba(56,103,214,0.7)); }
  }
  .river-node-active { animation: pulse-glow 2s ease-in-out infinite; }

  @media (max-width: 700px) {
    #river-container { padding: 1.5rem 0.5rem 1.5rem 0.5rem; }
    #river-container h2 { font-size: 1.3rem; }
  }
</style>

<div id="river-container">
  <div id="river-fade-top"></div>
  <div id="river-fade-bottom"></div>
  <div id="river-fade-left"></div>
  <div id="river-fade-right"></div>

  <h2>🌊 The River of Ideas</h2>
  <div class="subtitle">πάντα ῥεῖ — everything flows</div>
  <div class="subtitle2">Each generation traded hand-crafted specificity for greater generality, and the machine took over another layer of human cognitive labor. Hover to explore connections. Click nodes with links to jump to their section.</div>
  <div id="river-legend"></div>
  <svg id="river-svg"></svg>
  <div id="river-tooltip">
    <div class="tt-era"></div>
    <div class="tt-title"></div>
    <div class="tt-body"></div>
    <div class="tt-click"></div>
  </div>
</div>

<script>
(() => {
  /* ═══════════════════════════════════════════════════════
     STREAMS
     ═══════════════════════════════════════════════════════ */
  const STREAMS = {
    math:     { color: '#d4930d', label: 'Mathematics' },
    logic:    { color: '#7c3aed', label: 'Logic & Computation' },
    hardware: { color: '#dc2626', label: 'Hardware & Engineering' },
    stats:    { color: '#16a34a', label: 'Statistics & Data' },
    neuro:    { color: '#2563eb', label: 'Neuroscience & AI' },
    language: { color: '#ea580c', label: 'Language & Linguistics' },
    culture:  { color: '#64748b', label: 'Culture & Philosophy' },
    training: { color: '#0891b2', label: 'Training & Optimization' },
  };

  /* ═══════════════════════════════════════════════════════
     NODES — VERTICAL layout
     row = time (top to bottom, 0 = earliest)
     col = horizontal lane (0–11)
     ═══════════════════════════════════════════════════════ */
  const NODES = [
    // ── Row 0: Prehistoric ──
    { id:'stone_tools', label:'Stone Tools',             short:'Harmand 2015 — 3.3 million-year-old tools from Lomekwi 3, West Turkana',                     era:'Prehistoric',     row:0, col:0, stream:'hardware' },
    { id:'tally',       label:'Tally Bones',              short:'Lebombo ~43,000 BCE, Ishango ~20,000 BCE — first external memory (Bruderer 2024)',           era:'Prehistoric',     row:0, col:3, stream:'math' },
    { id:'cave',        label:'Blombos Ochre',             short:'~75,000 BCE — first abstract symbolic marks (Henshilwood)',                                  era:'Prehistoric',     row:0, col:7, stream:'culture' },
    { id:'language0',   label:'Proto-Language',             short:'~135,000 years ago — symbolic displacement, descended larynx (Miyagawa 2025)',               era:'Prehistoric',     row:0, col:9, stream:'language' },

    // ── Row 1: Ancient ──
    { id:'abacus',      label:'Salamis Tablet',             short:'~300 BCE — spatial abstraction of arithmetic (Kubitschek 1899)',                              era:'Ancient',         row:1, col:2, stream:'math' },
    { id:'antikythera', label:'Antikythera Mechanism',       short:'~200 BCE — first analog computer (Freeth 2009)',                                             era:'Ancient',         row:1, col:0, stream:'hardware' },
    { id:'euclid',      label:"Euclid's Elements",          short:'~300 BCE — axiomatic method, formal proof',                                                  era:'Ancient',         row:1, col:4, stream:'logic' },
    { id:'aristotle',   label:'Aristotle / Syllogisms',     short:'Analytica Priora ~350 BCE — formal deductive logic (Bocheński 1961)',                        era:'Ancient',         row:1, col:5, stream:'logic' },
    { id:'writing',     label:'Writing Systems',             short:'Cuneiform ~3200 BCE → Phoenician → Greek vowels (Gardiner 1916)',                           era:'Ancient',         row:1, col:8, stream:'language' },
    { id:'panini',      label:'Pāṇini / Ashtadhyayi',      short:'~4th c. BCE — first formal generative grammar, 3,959 rules',                                era:'Ancient',         row:1, col:9, stream:'language' },
    { id:'heraclitus',  label:'Heraclitus',                  short:'"πάντα ῥεῖ" — everything flows (~500 BCE)',                                                  era:'Ancient',         row:1, col:7, stream:'culture' },
    { id:'plato',       label:'Plato / Forms',               short:'~380 BCE — the cave allegory, forms vs. shadows',                                           era:'Ancient',         row:1, col:6, stream:'culture' },
    { id:'aryabhata',   label:'Āryabhaṭa',                  short:'499 CE — trigonometric tables, place-value system (Singh 2023)',                              era:'Ancient',         row:1, col:3, stream:'math' },

    // ── Row 2: Medieval ──
    { id:'algebra',     label:'Al-Khwarizmi / Algebra',     short:'~825 CE — al-jabr wa-l-muqābala: "algorithm" is born',                                      era:'Medieval',        row:2, col:3, stream:'math' },
    { id:'sacrobosco',  label:'Hindu-Arabic Numerals',       short:'Sacrobosco 1230 — positional notation spreads to Europe',                                   era:'Medieval',        row:2, col:2, stream:'math' },
    { id:'llull',       label:"Llull's Ars Magna",           short:'1305 — combinatorial reasoning machine, rotating discs (Bonner 2007)',                       era:'Medieval',        row:2, col:5, stream:'logic' },
    { id:'printing',    label:'Printing Press',               short:'Gutenberg ~1440 — mass replication of knowledge',                                           era:'Medieval',        row:2, col:7, stream:'culture' },
    { id:'devtula',     label:'De Vetula / Dice',             short:'~1250 — first systematic enumeration of dice outcomes',                                     era:'Medieval',        row:2, col:9, stream:'stats' },

    // ── Row 3: Enlightenment ──
    { id:'napier',      label:'Napier / Logarithms',         short:'1614 — multiplication by addition, "doubled the astronomer\'s life"',                        era:'Enlightenment',   row:3, col:1, stream:'math' },
    { id:'descartes',   label:'Descartes / Coordinates',     short:'1637 — La Géométrie: algebra meets geometry',                                                era:'Enlightenment',   row:3, col:2, stream:'math' },
    { id:'fermat',      label:'Fermat & Pascal',              short:'1654 — correspondence on probability, expected value',                                       era:'Enlightenment',   row:3, col:8, stream:'stats' },
    { id:'leibniz_calc',label:'Leibniz / Calculus',           short:'1684 — Nova Methodus: notation that thinks for you (dx, ∫)',                                 era:'Enlightenment',   row:3, col:3, stream:'math' },
    { id:'newton',      label:'Newton / Fluxions',            short:'Abstraction of change, inverse square law',                                                  era:'Enlightenment',   row:3, col:4, stream:'math' },
    { id:'leibniz_logic',label:'Leibniz / Calculemus!',      short:'1685 — Generales Inquisitiones: dream of universal reasoning machine',                       era:'Enlightenment',   row:3, col:5, stream:'logic' },
    { id:'bernoulli',   label:'Jacob Bernoulli',              short:'1713 — Ars Conjectandi: law of large numbers',                                               era:'Enlightenment',   row:3, col:9, stream:'stats' },
    { id:'loom',        label:'Jacquard Loom',                short:'1804 — punch-card programming, first programmable input',                                    era:'Enlightenment',   row:3, col:0, stream:'hardware' },
    { id:'gunter',      label:'Gunter / Slide Rule',          short:'1620 — Canon Triangulorum, logarithmic scales',                                              era:'Enlightenment',   row:3, col:10, stream:'hardware' },

    // ── Row 4: 19th Century ──
    { id:'euler',       label:'Euler / Analysis',             short:'Institutiones calculi differentialis, e, Σ notation (Cajori 1928)',                           era:'19th C',          row:4, col:2, stream:'math' },
    { id:'gauss',       label:'Gauß / Least Squares',        short:'1809 — Theoria Motus: Normal Distribution, Ceres recovery',                                  era:'19th C',          row:4, col:8, stream:'stats' },
    { id:'galton',      label:'Galton / Regression',          short:'1886 — regression to the mean, foundation of linear models',                                 era:'19th C',          row:4, col:9, stream:'stats' },
    { id:'boole',       label:"Boole's Algebra",              short:'1854 — An Investigation of the Laws of Thought: logic becomes math',                         era:'19th C',          row:4, col:5, stream:'logic' },
    { id:'babbage',     label:'Babbage & Lovelace',           short:'Analytical Engine — "weaves algebraic patterns as the Jacquard loom weaves flowers" (Stein 2016)', era:'19th C',    row:4, col:0, stream:'hardware' },
    { id:'cayley',      label:'Cayley / Matrices',            short:'1857–1889 — matrix algebra and group theory',                                                 era:'19th C',          row:4, col:3, stream:'math' },
    { id:'faraday',     label:'Faraday / Electricity',        short:'1831 — electromagnetic induction → Tesla AC → power grid',                                    era:'19th C',          row:4, col:1, stream:'hardware' },
    { id:'saussure',    label:'Saussure / Linguistics',       short:'1916 — Cours: arbitrariness of the sign, language as system of differences',                  era:'19th C',          row:4, col:10, stream:'language' },
    { id:'cajal',       label:'Cajal / Neuron Doctrine',      short:'1906 Nobel — brain is discrete cells, not continuous web',                                    era:'19th C',          row:4, col:6, stream:'neuro' },
    { id:'boltzmann',   label:'Boltzmann / Entropy',          short:'1868 — statistical mechanics, S = k log W',                                                   era:'19th C',          row:4, col:7, stream:'stats' },

    // ── Row 5: Early 20th C ──
    { id:'hilbert',     label:"Hilbert's Program",            short:'Formalize all of mathematics — the dream and its limits',                                      era:'Early 20th C',    row:5, col:3, stream:'math' },
    { id:'godel',       label:"Gödel's Incompleteness",       short:'1931 — limits of formal systems, self-reference',                                              era:'Early 20th C',    row:5, col:4, stream:'logic' },
    { id:'turing',      label:'Turing Machine',                short:'1936–1950 — universal computation, the Imitation Game',                                       era:'Early 20th C',    row:5, col:5, stream:'logic' },
    { id:'shannon',     label:'Shannon / Info Theory',         short:'1948 — A Mathematical Theory of Communication: entropy, n-grams',                             era:'Early 20th C',    row:5, col:7, stream:'stats' },
    { id:'mcculloch',   label:'McCulloch-Pitts Neuron',        short:'1943 — A Logical Calculus of Ideas Immanent in Nervous Activity',                              era:'Early 20th C',    row:5, col:6, stream:'neuro' },
    { id:'hebb',        label:'Hebb / Learning Rule',          short:'1949 — "Neurons that fire together wire together"',                                            era:'Early 20th C',    row:5, col:8, stream:'neuro' },
    { id:'frege',       label:'Frege & Russell',               short:'Begriffsschrift 1879, Principia 1910 — symbolic logic formalized',                             era:'Early 20th C',    row:5, col:2, stream:'logic' },
    { id:'fisher',      label:'Fisher / MLE',                  short:'1922 — maximum likelihood, foundations of theoretical statistics',                              era:'Early 20th C',    row:5, col:9, stream:'stats' },
    { id:'transistor',  label:'Transistor',                     short:'Bardeen & Brattain 1948 — quantum mechanics → semiconductor → digital age',                   era:'Early 20th C',    row:5, col:0, stream:'hardware' },
    { id:'wiener',      label:'Wiener / Cybernetics',          short:'1948 — feedback loops, control and communication in animal and machine',                       era:'Early 20th C',    row:5, col:10, stream:'culture' },
    { id:'kolmogorov',  label:'Kolmogorov / Probability',      short:'1933 — axiomatic foundations of probability theory',                                           era:'Early 20th C',    row:5, col:1, stream:'math' },

    // ── Row 6: Mid 20th C ──
    { id:'vonneumann',  label:'Von Neumann / EDVAC',           short:'1945 — stored-program concept: data = instructions',                                           era:'Mid 20th C',      row:6, col:0, stream:'hardware' },
    { id:'zuse',        label:'Zuse Z1–Z3',                    short:'1938–41 — first binary programmable computers (Zuse 1970)',                                    era:'Mid 20th C',      row:6, col:1, stream:'hardware' },
    { id:'dartmouth',   label:'"Artificial Intelligence"',     short:'McCarthy et al. 1955–56 — the term is coined at Dartmouth',                                    era:'Mid 20th C',      row:6, col:5, stream:'neuro' },
    { id:'perceptron',  label:'Perceptron',                     short:'Rosenblatt 1958 — "New Navy Device Learns by Doing"',                                         era:'Mid 20th C',      row:6, col:6, stream:'neuro' },
    { id:'chomsky',     label:'Chomsky Hierarchy',              short:'1956 — formal grammars, generative linguistics',                                               era:'Mid 20th C',      row:6, col:9, stream:'language' },
    { id:'firth',       label:'Firth / Distributional',         short:'1957 — "You shall know a word by the company it keeps"',                                      era:'Mid 20th C',      row:6, col:10, stream:'language' },
    { id:'eliza',       label:'ELIZA',                          short:'Weizenbaum 1966–76 — the ELIZA effect, "Computer Power and Human Reason"',                    era:'Mid 20th C',      row:6, col:8, stream:'culture' },
    { id:'snarc',       label:'SNARC',                          short:'Minsky 1951 — first physical neural network, 40 Hebb synapses',                               era:'Mid 20th C',      row:6, col:7, stream:'neuro' },
    { id:'moore',       label:"Moore's Law",                    short:'1965 — "Cramming more components onto integrated circuits"',                                   era:'Mid 20th C',      row:6, col:2, stream:'hardware' },
    { id:'hubel_wiesel',label:'Hubel & Wiesel',                short:'1962 — simple/complex cells in cat visual cortex → inspiration for CNNs',                      era:'Mid 20th C',      row:6, col:4, stream:'neuro' },

    // ── Row 7: 1960s–80s ──
    { id:'minsky_xor',  label:'Minsky / XOR Crisis',           short:'1969 — Perceptrons can\'t solve XOR → First AI Winter',                                        era:'1960s–80s',       row:7, col:5, stream:'neuro' },
    { id:'lighthill',   label:'Lighthill Report',               short:'1973 — "Artificial Intelligence: A General Survey" → UK AI funding cut',                       era:'1960s–80s',       row:7, col:8, stream:'culture' },
    { id:'linnainmaa',  label:'Automatic Differentiation',      short:'Linnainmaa 1970/76 — reverse-mode AD, backbone of backprop',                                   era:'1960s–80s',       row:7, col:3, stream:'math' },
    { id:'werbos',      label:'Werbos / Backprop Thesis',       short:'1974 — "Beyond Regression": backprop for neural nets conceived',                               era:'1960s–80s',       row:7, col:4, stream:'neuro' },
    { id:'backprop',    label:'Backpropagation',                 short:'Rumelhart, Hinton, Williams 1986 — abstraction of blame via chain rule',                       era:'1960s–80s',       row:7, col:6, stream:'neuro' },
    { id:'neocognitron',label:'Neocognitron',                    short:'Fukushima 1980 — hierarchical vision inspired by Hubel & Wiesel',                              era:'1960s–80s',       row:7, col:7, stream:'neuro' },
    { id:'boltzmann_m', label:'Boltzmann Machine',               short:'Ackley, Hinton, Sejnowski 1985 — stochastic generative model',                                 era:'1960s–80s',       row:7, col:9, stream:'neuro' },
    { id:'harris',      label:'Harris / Distributional',         short:'Zellig Harris 1954 — "Distributional Structures": meaning from context',                       era:'1960s–80s',       row:7, col:10, stream:'language' },
    { id:'arpanet',     label:'ARPANET → TCP/IP',                short:'Crocker 1969, Cerf & Kahn 1974 — the physical substrate of training data',                     era:'1960s–80s',       row:7, col:0, stream:'hardware' },
    { id:'fiber',       label:'Fiber Optics',                    short:'Kao & Hockham 1966, Kapron 1970 — light as data carrier',                                      era:'1960s–80s',       row:7, col:1, stream:'hardware' },

    // ── Row 8: 1990s ──
    { id:'lstm',        label:'LSTM',                            short:'Hochreiter & Schmidhuber 1997 — gated memory, vanishing gradient fix',                          era:'1990s',           row:8, col:6, stream:'neuro' },
    { id:'lenet',       label:'LeNet-5 / CNNs',                  short:'LeCun et al. 1989/1998 — convolutions + backprop for handwritten digits',                       era:'1990s',           row:8, col:7, stream:'neuro' },
    { id:'vanishing',   label:'Vanishing Gradients',              short:'Hochreiter 1991, Bengio 1994 — the problem that shaped architecture',                           era:'1990s',           row:8, col:5, stream:'neuro' },
    { id:'deepblue',    label:'Deep Blue',                        short:'1996–97 — symbolic AI beats Kasparov',                                                          era:'1990s',           row:8, col:4, stream:'logic' },
    { id:'bpe',         label:'BPE Tokenization',                 short:'Gage 1994 → Sennrich 2016 — subword units solve open vocabulary',                               era:'1990s',           row:8, col:10, stream:'language' },
    { id:'www',         label:'World Wide Web',                    short:'Berners-Lee 1989 — self-assembling corpus of human thought',                                    era:'1990s',           row:8, col:8, stream:'culture' },
    { id:'ridge_lasso', label:'Ridge & Lasso',                    short:'Hoerl & Kennard 1970, Tibshirani 1996 — regularization: the art of forgetting',                 era:'1990s',           row:8, col:9, stream:'stats' },
    { id:'jelinek',     label:'Statistical NLP',                   short:'Jelinek 1988 — "Every time I fire a linguist, recognition goes up"',                            era:'1990s',           row:8, col:3, stream:'language' },
    { id:'zipf',        label:'Zipf\'s Law',                      short:'1949 — power-law frequency distribution, the long tail of language',                             era:'1990s',           row:8, col:2, stream:'stats' },
    { id:'gpu_early',   label:'GPU Computing',                     short:'Oh & Jung 2004, Raina 2009 — gamers\' hardware becomes AI\'s engine',                           era:'1990s',           row:8, col:0, stream:'hardware' },
    { id:'glm',         label:'GLMs / Logistic Regression',       short:'Nelder & Wedderburn 1972, Berkson 1944 — the sigmoid lineage',                                  era:'1990s',           row:8, col:1, stream:'stats' },

    // ── Row 9: 2000s ──
    { id:'bengio_nlm',  label:'Neural Language Model',            short:'Bengio 2003 — word embeddings, curse of dimensionality',                                         era:'2000s',           row:9, col:6, stream:'neuro' },
    { id:'hinton_dbn',  label:'Deep Belief Nets',                  short:'Hinton, Osindero, Teh 2006 — greedy layer-wise pretraining',                                    era:'2000s',           row:9, col:7, stream:'neuro' },
    { id:'cuda',        label:'CUDA',                               short:'Buck & Nickolls 2006 — NVIDIA opens GPU for general computation',                               era:'2000s',           row:9, col:0, stream:'hardware' },
    { id:'commoncrawl', label:'Common Crawl',                       short:'2007+ — open repository of web crawl data, petabytes of text',                                  era:'2000s',           row:9, col:8, stream:'culture' },
    { id:'markov',      label:'Markov Chains',                      short:'Markov 1913 — statistical investigation of Eugene Onegin',                                      era:'2000s',           row:9, col:2, stream:'stats' },
    { id:'sgd',         label:'SGD & Momentum',                     short:'Robbins-Monro 1950, Polyak 1962, Cauchy 1847 — stochastic optimization',                        era:'2000s',           row:9, col:3, stream:'training' },
    { id:'dropout',     label:'Dropout',                             short:'Srivastava & Hinton 2014 — randomly silencing neurons prevents co-adaptation',                  era:'2000s',           row:9, col:4, stream:'training' },
    { id:'torch',       label:'Torch → PyTorch',                    short:'Collobert 2002 → Paszke 2019 — autodiff frameworks',                                            era:'2000s',           row:9, col:1, stream:'hardware' },
    { id:'kl_div',      label:'KL Divergence',                      short:'Kullback-Leibler 1951, Tishby 2000 — measuring distributional distance',                        era:'2000s',           row:9, col:9, stream:'stats' },
    { id:'jelinek2',    label:'Corpus Linguistics',                  short:'Brown Corpus, Penn Treebank — annotated data for statistical NLP',                               era:'2000s',           row:9, col:10, stream:'language' },

    // ── Row 10: 2010–2014 ──
    { id:'alexnet',     label:'AlexNet',                            short:'Krizhevsky, Sutskever, Hinton 2012 — GPU + CNN + ImageNet = revolution',                         era:'2010–14',         row:10, col:6, stream:'neuro' },
    { id:'word2vec',    label:'Word2Vec',                            short:'Mikolov et al. 2013 — king − man + woman ≈ queen, meaning as geometry',                         era:'2010–14',         row:10, col:8, stream:'language' },
    { id:'relu',        label:'ReLU Activation',                     short:'Glorot, Nair & Hinton 2010–11 — max(0,x): death of vanishing gradients',                        era:'2010–14',         row:10, col:3, stream:'training' },
    { id:'adam',        label:'Adam Optimizer',                      short:'Kingma & Ba 2014 — adaptive per-parameter learning rates',                                       era:'2010–14',         row:10, col:2, stream:'training' },
    { id:'bahdanau',    label:'Attention Mechanism',                  short:'Bahdanau, Cho, Bengio 2014 — dynamic alignment breaks the bottleneck',                           era:'2010–14',         row:10, col:7, stream:'neuro' },
    { id:'batchnorm',   label:'Batch Normalization',                  short:'Ioffe & Szegedy 2015 — stabilize activations during training',                                   era:'2010–14',         row:10, col:4, stream:'training' },
    { id:'gan',         label:'GANs',                                 short:'Goodfellow 2014 — generator vs discriminator, adversarial training',                              era:'2010–14',         row:10, col:10, stream:'neuro' },
    { id:'bitter',      label:'The Bitter Lesson',                    short:'Sutton 2019 — "general methods that leverage computation are ultimately the most effective"',     era:'2010–14',         row:10, col:0, stream:'culture' },
    { id:'cross_ling',  label:'Cross-Lingual Embeddings',            short:'Mikolov 2013, Conneau 2018, Smith 2017 — one geometry across languages',                          era:'2010–14',         row:10, col:9, stream:'language' },
    { id:'scaling',     label:'Scaling Laws',                         short:'Kaplan et al. 2020 — loss ∝ N^α · D^β · C^γ, predictable improvement',                           era:'2010–14',         row:10, col:1, stream:'neuro' },

    // ── Row 11: 2015–2018 ──
    { id:'resnet',      label:'ResNet / Skip Connections',            short:'He et al. 2015 — residual stream, gradient superhighway, 152 layers',                             era:'2015–18',         row:11, col:6, stream:'neuro' },
    { id:'layernorm',   label:'Layer Normalization',                  short:'Ba, Kiros, Hinton 2016 — stable activations across sequence positions',                            era:'2015–18',         row:11, col:3, stream:'training' },
    { id:'sennrich',    label:'Subword NMT / BPE',                   short:'Sennrich, Haddow, Birch 2016 — BPE for neural machine translation',                               era:'2015–18',         row:11, col:9, stream:'language' },
    { id:'elmo',        label:'ELMo',                                 short:'Peters et al. 2018 — deep contextualized word representations',                                   era:'2015–18',         row:11, col:10, stream:'language' },
    { id:'transformer', label:'Transformer',                          short:'Vaswani et al. 2017 — "Attention Is All You Need", multi-head self-attention',                    era:'2015–18',         row:11, col:5, stream:'neuro' },
    { id:'moe',         label:'Mixture of Experts',                   short:'Shazeer et al. 2017 — sparsely-gated MoE, conditional computation',                               era:'2015–18',         row:11, col:4, stream:'neuro' },
    { id:'bert',        label:'BERT',                                 short:'Devlin et al. 2018 — bidirectional encoder, masked language modeling',                             era:'2015–18',         row:11, col:7, stream:'neuro' },
    { id:'gpt1',        label:'GPT-1',                                short:'Radford et al. 2018 — "Improving Language Understanding by Generative Pre-Training"',              era:'2015–18',         row:11, col:8, stream:'neuro' },
    { id:'christiano',  label:'RLHF Conceived',                      short:'Christiano et al. 2017 — Deep RL from Human Preferences',                                         era:'2015–18',         row:11, col:1, stream:'culture' },
    { id:'poincare',    label:'Poincaré Embeddings',                  short:'Nickel & Kiela 2017 — hyperbolic geometry for hierarchical representations',                       era:'2015–18',         row:11, col:0, stream:'math' },

    // ── Row 12: 2019–2021 ──
    { id:'gpt2',        label:'GPT-2',                                short:'Radford et al. 2019 — "Language Models are Unsupervised Multitask Learners"',                     era:'2019–21',         row:12, col:5, stream:'neuro' },
    { id:'gpt3',        label:'GPT-3',                                short:'Brown et al. 2020 — 175B parameters, few-shot learning, in-context learning',                     era:'2019–21',         row:12, col:6, stream:'neuro' },
    { id:'circuits',    label:'Transformer Circuits',                 short:'Elhage et al. 2021 — "A Mathematical Framework for Transformer Circuits"',                         era:'2019–21',         row:12, col:3, stream:'neuro' },
    { id:'induction',   label:'Induction Heads',                      short:'Olsson et al. 2022 — [A][B]…[A] → [B] pattern matching for in-context learning',                  era:'2019–21',         row:12, col:2, stream:'neuro' },
    { id:'superposition',label:'Superposition',                       short:'Elhage et al. 2022 — "Toy Models of Superposition": more features than dimensions',               era:'2019–21',         row:12, col:4, stream:'neuro' },
    { id:'stochastic_p',label:'Stochastic Parrots',                   short:'Bender, Gebru et al. 2021 — "Can Language Models Be Too Big? 🦜"',                                era:'2019–21',         row:12, col:9, stream:'culture' },
    { id:'instructgpt', label:'InstructGPT / RLHF',                   short:'Ouyang et al. 2022 — training LMs to follow instructions with human feedback',                    era:'2019–21',         row:12, col:7, stream:'neuro' },
    { id:'ffn_kv',      label:'FFN as Key-Value Memory',              short:'Geva et al. 2020 — "Transformer Feed-Forward Layers Are Key-Value Memories"',                     era:'2019–21',         row:12, col:1, stream:'neuro' },
    { id:'grokking',    label:'Grokking',                             short:'Power et al. 2022 — generalization long after overfitting, phase transitions',                     era:'2019–21',         row:12, col:0, stream:'neuro' },
    { id:'conneau',     label:'Cross-Lingual MUSE',                   short:'Conneau et al. 2018 — word translation without parallel data',                                    era:'2019–21',         row:12, col:10, stream:'language' },

    // ── Row 13: 2022–2023 ──
    { id:'chatgpt',     label:'ChatGPT',                              short:'Nov 30, 2022 — conversational AI for everyone, 100M users in 2 months',                           era:'2022–23',         row:13, col:5, stream:'neuro' },
    { id:'golden_gate', label:'Golden Gate Claude',                    short:'Templeton et al. 2024 — feature steering: "I am the Golden Gate Bridge"',                         era:'2022–23',         row:13, col:3, stream:'neuro' },
    { id:'sparse_auto', label:'Sparse Autoencoders',                  short:'Cunningham et al. 2023 — finding interpretable features in language models',                       era:'2022–23',         row:13, col:4, stream:'neuro' },
    { id:'sleeper',     label:'Sleeper Agents',                       short:'Hubinger et al. 2024 — deceptive LLMs that persist through safety training',                      era:'2022–23',         row:13, col:7, stream:'culture' },
    { id:'reversal',    label:'Reversal Curse',                       short:'Berglund et al. 2023 — LLMs trained on "A is B" fail to learn "B is A"',                          era:'2022–23',         row:13, col:6, stream:'neuro' },
    { id:'model_collapse',label:'Model Collapse',                     short:'Shumailov et al. 2023 — training on generated data makes models forget',                           era:'2022–23',         row:13, col:8, stream:'culture' },
    { id:'truth_decay', label:'Truth Decay / Deepfakes',              short:'Kavanagh 2018, Chesney 2019, Spring 2024 — epistemic crisis',                                     era:'2022–23',         row:13, col:9, stream:'culture' },
    { id:'water',       label:'AI Environmental Cost',                short:'Li et al. 2023 — GPT-3 training: 700k liters of water',                                            era:'2022–23',         row:13, col:10, stream:'culture' },
    { id:'glitch',      label:'Glitch Tokens',                        short:'Zhou et al. 2024 — anomalous tokens that break model behavior',                                    era:'2022–23',         row:13, col:2, stream:'neuro' },
    { id:'waluigi',     label:'Waluigi Effect',                       short:'Nardo 2023 — jailbreaks as anti-simulacra, the shadow of RLHF',                                    era:'2022–23',         row:13, col:1, stream:'culture' },

    // ── Row 14: Now & Beyond ──
    { id:'mechinterp',  label:'Mechanistic Interpretability',         short:'Olah, Elhage, Nanda et al. — circuits, features, superposition, polysemanticity',                  era:'Now & Beyond',    row:14, col:4, stream:'neuro' },
    { id:'platonic',    label:'Platonic Representations',             short:'Huh et al. 2024 — all models converge toward one geometry of reality',                              era:'Now & Beyond',    row:14, col:5, stream:'neuro' },
    { id:'geometry_truth',label:'Geometry of Truth',                  short:'Marks 2024 — emergent linear structure in LLM representations of true/false',                       era:'Now & Beyond',    row:14, col:6, stream:'neuro' },
    { id:'robotics',    label:'Robotics',                             short:'Embodied intelligence — a different tributary from the same river',                                  era:'Now & Beyond',    row:14, col:0, stream:'hardware' },
    { id:'crypto',      label:'Cryptography',                         short:'Turing → Thompson 1984 → modern crypto — trust in computation',                                     era:'Now & Beyond',    row:14, col:1, stream:'logic' },
    { id:'compbio',     label:'Computational Biology',                short:'Statistics + computation → genomics, protein folding, drug discovery',                               era:'Now & Beyond',    row:14, col:2, stream:'stats' },
    { id:'diffusion',   label:'Diffusion Models',                     short:'Image/video/audio generation — a sibling architecture from the same math',                           era:'Now & Beyond',    row:14, col:7, stream:'neuro' },
    { id:'alignment',   label:'AI Alignment',                         short:'Bostrom 2003/2012, Christiano 2017 — the control problem',                                          era:'Now & Beyond',    row:14, col:8, stream:'culture' },
    { id:'acult',       label:'AI in Culture & Ethics',               short:'Crawford 2021, O\'Neil 2016, Frankfurt 2005 — power, bias, bullshit',                               era:'Now & Beyond',    row:14, col:9, stream:'culture' },
    { id:'tpu',         label:'AI Accelerators / TPUs',               short:'Custom silicon for matrix multiply — the hardware lottery (Hooker 2020)',                             era:'Now & Beyond',    row:14, col:10, stream:'hardware' },
    { id:'geometric_dl',label:'Geometric Deep Learning',              short:'Bronstein et al. 2021 — grids, groups, graphs, geodesics, gauges',                                   era:'Now & Beyond',    row:14, col:3, stream:'math' },
  ];

  /* ═══════════════════════════════════════════════════════
     EDGES — MORE CONNECTIONS added for richer interconnection
     ═══════════════════════════════════════════════════════ */
  const EDGES = [
    // ── Math ──
    { from:'tally', to:'abacus', stream:'math' },
    { from:'abacus', to:'algebra', stream:'math' },
    { from:'aryabhata', to:'algebra', stream:'math' },
    { from:'algebra', to:'sacrobosco', stream:'math' },
    { from:'sacrobosco', to:'napier', stream:'math' },
    { from:'napier', to:'descartes', stream:'math' },
    { from:'descartes', to:'leibniz_calc', stream:'math' },
    { from:'descartes', to:'newton', stream:'math' },
    { from:'leibniz_calc', to:'euler', stream:'math' },
    { from:'newton', to:'euler', stream:'math' },
    { from:'euler', to:'gauss', stream:'math' },
    { from:'euler', to:'hilbert', stream:'math' },
    { from:'cayley', to:'hilbert', stream:'math' },
    { from:'hilbert', to:'godel', stream:'math' },
    { from:'linnainmaa', to:'backprop', stream:'math' },
    { from:'poincare', to:'geometric_dl', stream:'math' },
    { from:'kolmogorov', to:'shannon', stream:'math' },
    // NEW math connections
    { from:'tally', to:'cave', stream:'math' },
    { from:'napier', to:'gunter', stream:'math' },
    { from:'cayley', to:'euler', stream:'math' },
    { from:'euler', to:'cayley', stream:'math' },
    { from:'gauss', to:'hilbert', stream:'math' },
    { from:'kolmogorov', to:'fisher', stream:'math' },
    { from:'hilbert', to:'kolmogorov', stream:'math' },
    { from:'geometric_dl', to:'platonic', stream:'math' },
    { from:'descartes', to:'cayley', stream:'math' },

    // ── Logic ──
    { from:'euclid', to:'aristotle', stream:'logic' },
    { from:'aristotle', to:'llull', stream:'logic' },
    { from:'llull', to:'leibniz_logic', stream:'logic' },
    { from:'leibniz_logic', to:'boole', stream:'logic' },
    { from:'boole', to:'frege', stream:'logic' },
    { from:'frege', to:'hilbert', stream:'logic' },
    { from:'boole', to:'turing', stream:'logic' },
    { from:'godel', to:'turing', stream:'logic' },
    { from:'frege', to:'turing', stream:'logic' },
    { from:'turing', to:'vonneumann', stream:'logic' },
    { from:'turing', to:'shannon', stream:'logic' },
    { from:'turing', to:'crypto', stream:'logic' },
    { from:'deepblue', to:'bitter', stream:'logic' },
    // NEW logic connections
    { from:'aristotle', to:'euclid', stream:'logic' },
    { from:'boole', to:'mcculloch', stream:'logic' },
    { from:'turing', to:'dartmouth', stream:'logic' },
    { from:'godel', to:'wiener', stream:'logic' },
    { from:'frege', to:'godel', stream:'logic' },
    { from:'leibniz_logic', to:'frege', stream:'logic' },
    { from:'deepblue', to:'chatgpt', stream:'logic' },

    // ── Hardware ──
    { from:'stone_tools', to:'antikythera', stream:'hardware' },
    { from:'antikythera', to:'loom', stream:'hardware' },
    { from:'gunter', to:'loom', stream:'hardware' },
    { from:'loom', to:'babbage', stream:'hardware' },
    { from:'babbage', to:'zuse', stream:'hardware' },
    { from:'faraday', to:'transistor', stream:'hardware' },
    { from:'transistor', to:'vonneumann', stream:'hardware' },
    { from:'transistor', to:'moore', stream:'hardware' },
    { from:'vonneumann', to:'cuda', stream:'hardware' },
    { from:'moore', to:'gpu_early', stream:'hardware' },
    { from:'gpu_early', to:'cuda', stream:'hardware' },
    { from:'cuda', to:'alexnet', stream:'hardware' },
    { from:'cuda', to:'tpu', stream:'hardware' },
    { from:'arpanet', to:'www', stream:'hardware' },
    { from:'fiber', to:'arpanet', stream:'hardware' },
    { from:'torch', to:'alexnet', stream:'hardware' },
    // NEW hardware connections
    { from:'zuse', to:'vonneumann', stream:'hardware' },
    { from:'vonneumann', to:'arpanet', stream:'hardware' },
    { from:'moore', to:'arpanet', stream:'hardware' },
    { from:'fiber', to:'www', stream:'hardware' },
    { from:'gpu_early', to:'torch', stream:'hardware' },
    { from:'cuda', to:'torch', stream:'hardware' },
    { from:'tpu', to:'robotics', stream:'hardware' },
    { from:'babbage', to:'faraday', stream:'hardware' },
    { from:'loom', to:'printing', stream:'hardware' },

    // ── Stats ──
    { from:'devtula', to:'fermat', stream:'stats' },
    { from:'fermat', to:'bernoulli', stream:'stats' },
    { from:'bernoulli', to:'gauss', stream:'stats' },
    { from:'galton', to:'gauss', stream:'stats' },
    { from:'gauss', to:'fisher', stream:'stats' },
    { from:'gauss', to:'shannon', stream:'stats' },
    { from:'fisher', to:'glm', stream:'stats' },
    { from:'boltzmann', to:'shannon', stream:'stats' },
    { from:'shannon', to:'markov', stream:'stats' },
    { from:'shannon', to:'kl_div', stream:'stats' },
    { from:'markov', to:'jelinek', stream:'stats' },
    { from:'ridge_lasso', to:'dropout', stream:'stats' },
    { from:'zipf', to:'bpe', stream:'stats' },
    { from:'gauss', to:'compbio', stream:'stats' },
    { from:'glm', to:'bengio_nlm', stream:'stats' },
    // NEW stats connections
    { from:'bernoulli', to:'kolmogorov', stream:'stats' },
    { from:'fisher', to:'ridge_lasso', stream:'stats' },
    { from:'boltzmann', to:'boltzmann_m', stream:'stats' },
    { from:'galton', to:'fisher', stream:'stats' },
    { from:'kl_div', to:'instructgpt', stream:'stats' },
    { from:'zipf', to:'jelinek', stream:'stats' },
    { from:'markov', to:'bengio_nlm', stream:'stats' },
    { from:'shannon', to:'chomsky', stream:'stats' },
    { from:'fisher', to:'kl_div', stream:'stats' },

    // ── Neuro / AI ──
    { from:'cajal', to:'mcculloch', stream:'neuro' },
    { from:'mcculloch', to:'hebb', stream:'neuro' },
    { from:'hebb', to:'snarc', stream:'neuro' },
    { from:'mcculloch', to:'perceptron', stream:'neuro' },
    { from:'dartmouth', to:'perceptron', stream:'neuro' },
    { from:'perceptron', to:'minsky_xor', stream:'neuro' },
    { from:'minsky_xor', to:'werbos', stream:'neuro' },
    { from:'werbos', to:'backprop', stream:'neuro' },
    { from:'backprop', to:'neocognitron', stream:'neuro' },
    { from:'backprop', to:'boltzmann_m', stream:'neuro' },
    { from:'backprop', to:'vanishing', stream:'neuro' },
    { from:'vanishing', to:'lstm', stream:'neuro' },
    { from:'neocognitron', to:'lenet', stream:'neuro' },
    { from:'hubel_wiesel', to:'neocognitron', stream:'neuro' },
    { from:'lenet', to:'alexnet', stream:'neuro' },
    { from:'alexnet', to:'resnet', stream:'neuro' },
    { from:'resnet', to:'transformer', stream:'neuro' },
    { from:'lstm', to:'bahdanau', stream:'neuro' },
    { from:'bahdanau', to:'transformer', stream:'neuro' },
    { from:'bengio_nlm', to:'word2vec', stream:'neuro' },
    { from:'hinton_dbn', to:'alexnet', stream:'neuro' },
    { from:'transformer', to:'bert', stream:'neuro' },
    { from:'transformer', to:'gpt1', stream:'neuro' },
    { from:'gpt1', to:'gpt2', stream:'neuro' },
    { from:'gpt2', to:'gpt3', stream:'neuro' },
    { from:'gpt3', to:'instructgpt', stream:'neuro' },
    { from:'instructgpt', to:'chatgpt', stream:'neuro' },
    { from:'chatgpt', to:'mechinterp', stream:'neuro' },
    { from:'chatgpt', to:'platonic', stream:'neuro' },
    { from:'chatgpt', to:'reversal', stream:'neuro' },
    { from:'chatgpt', to:'glitch', stream:'neuro' },
    { from:'circuits', to:'sparse_auto', stream:'neuro' },
    { from:'circuits', to:'induction', stream:'neuro' },
    { from:'superposition', to:'golden_gate', stream:'neuro' },
    { from:'sparse_auto', to:'golden_gate', stream:'neuro' },
    { from:'induction', to:'mechinterp', stream:'neuro' },
    { from:'superposition', to:'mechinterp', stream:'neuro' },
    { from:'ffn_kv', to:'mechinterp', stream:'neuro' },
    { from:'grokking', to:'mechinterp', stream:'neuro' },
    { from:'alexnet', to:'diffusion', stream:'neuro' },
    { from:'alexnet', to:'robotics', stream:'neuro' },
    { from:'scaling', to:'gpt3', stream:'neuro' },
    { from:'moe', to:'transformer', stream:'neuro' },
    { from:'gan', to:'diffusion', stream:'neuro' },
    { from:'platonic', to:'geometry_truth', stream:'neuro' },
    { from:'snarc', to:'perceptron', stream:'neuro' },
    // NEW neuro connections
    { from:'hebb', to:'backprop', stream:'neuro' },
    { from:'boltzmann_m', to:'hinton_dbn', stream:'neuro' },
    { from:'lstm', to:'elmo', stream:'neuro' },
    { from:'lenet', to:'batchnorm', stream:'neuro' },
    { from:'resnet', to:'bert', stream:'neuro' },
    { from:'bert', to:'gpt2', stream:'neuro' },
    { from:'gpt3', to:'chatgpt', stream:'neuro' },
    { from:'backprop', to:'relu', stream:'neuro' },
    { from:'vanishing', to:'relu', stream:'neuro' },
    { from:'hinton_dbn', to:'boltzmann_m', stream:'neuro' },
    { from:'alexnet', to:'gan', stream:'neuro' },
    { from:'circuits', to:'superposition', stream:'neuro' },
    { from:'golden_gate', to:'mechinterp', stream:'neuro' },
    { from:'reversal', to:'mechinterp', stream:'neuro' },
    { from:'diffusion', to:'platonic', stream:'neuro' },
    { from:'scaling', to:'bitter', stream:'neuro' },

    // ── Training ──
    { from:'sgd', to:'adam', stream:'training' },
    { from:'relu', to:'alexnet', stream:'training' },
    { from:'batchnorm', to:'resnet', stream:'training' },
    { from:'layernorm', to:'transformer', stream:'training' },
    { from:'dropout', to:'alexnet', stream:'training' },
    { from:'adam', to:'transformer', stream:'training' },
    // NEW training connections
    { from:'sgd', to:'backprop', stream:'training' },
    { from:'sgd', to:'relu', stream:'training' },
    { from:'dropout', to:'batchnorm', stream:'training' },
    { from:'adam', to:'bert', stream:'training' },
    { from:'layernorm', to:'bert', stream:'training' },
    { from:'batchnorm', to:'layernorm', stream:'training' },
    { from:'relu', to:'resnet', stream:'training' },
    { from:'dropout', to:'lstm', stream:'training' },

    // ── Language ──
    { from:'language0', to:'writing', stream:'language' },
    { from:'writing', to:'panini', stream:'language' },
    { from:'panini', to:'saussure', stream:'language' },
    { from:'saussure', to:'chomsky', stream:'language' },
    { from:'chomsky', to:'firth', stream:'language' },
    { from:'firth', to:'harris', stream:'language' },
    { from:'harris', to:'jelinek', stream:'language' },
    { from:'harris', to:'bengio_nlm', stream:'language' },
    { from:'word2vec', to:'cross_ling', stream:'language' },
    { from:'cross_ling', to:'conneau', stream:'language' },
    { from:'word2vec', to:'bahdanau', stream:'language' },
    { from:'bpe', to:'sennrich', stream:'language' },
    { from:'sennrich', to:'transformer', stream:'language' },
    { from:'jelinek', to:'bengio_nlm', stream:'language' },
    { from:'elmo', to:'bert', stream:'language' },
    { from:'jelinek2', to:'word2vec', stream:'language' },
    // NEW language connections
    { from:'panini', to:'chomsky', stream:'language' },
    { from:'chomsky', to:'jelinek', stream:'language' },
    { from:'firth', to:'word2vec', stream:'language' },
    { from:'writing', to:'printing', stream:'language' },
    { from:'sennrich', to:'bert', stream:'language' },
    { from:'sennrich', to:'gpt1', stream:'language' },
    { from:'word2vec', to:'elmo', stream:'language' },
    { from:'conneau', to:'bert', stream:'language' },
    { from:'bpe', to:'jelinek', stream:'language' },
    { from:'language0', to:'cave', stream:'language' },

    // ── Culture ──
    { from:'cave', to:'writing', stream:'culture' },
    { from:'heraclitus', to:'plato', stream:'culture' },
    { from:'plato', to:'aristotle', stream:'culture' },
    { from:'printing', to:'babbage', stream:'culture' },
    { from:'wiener', to:'dartmouth', stream:'culture' },
    { from:'eliza', to:'stochastic_p', stream:'culture' },
    { from:'lighthill', to:'minsky_xor', stream:'culture' },
    { from:'www', to:'commoncrawl', stream:'culture' },
    { from:'commoncrawl', to:'gpt3', stream:'culture' },
    { from:'christiano', to:'instructgpt', stream:'culture' },
    { from:'stochastic_p', to:'model_collapse', stream:'culture' },
    { from:'chatgpt', to:'truth_decay', stream:'culture' },
    { from:'chatgpt', to:'water', stream:'culture' },
    { from:'chatgpt', to:'acult', stream:'culture' },
    { from:'chatgpt', to:'sleeper', stream:'culture' },
    { from:'sleeper', to:'alignment', stream:'culture' },
    { from:'bitter', to:'scaling', stream:'culture' },
    { from:'waluigi', to:'alignment', stream:'culture' },
    // NEW culture connections
    { from:'plato', to:'platonic', stream:'culture' },
    { from:'heraclitus', to:'boltzmann', stream:'culture' },
    { from:'printing', to:'www', stream:'culture' },
    { from:'eliza', to:'chatgpt', stream:'culture' },
    { from:'lighthill', to:'bitter', stream:'culture' },
    { from:'model_collapse', to:'alignment', stream:'culture' },
    { from:'truth_decay', to:'alignment', stream:'culture' },
    { from:'cave', to:'heraclitus', stream:'culture' },
    { from:'wiener', to:'mcculloch', stream:'culture' },
    { from:'stochastic_p', to:'acult', stream:'culture' },
    { from:'water', to:'acult', stream:'culture' },
    { from:'christiano', to:'waluigi', stream:'culture' },

    // ── Cross-stream connections (NEW) ──
    { from:'boole', to:'cajal', stream:'logic' },
    { from:'turing', to:'mcculloch', stream:'logic' },
    { from:'babbage', to:'boole', stream:'hardware' },
    { from:'shannon', to:'firth', stream:'stats' },
    { from:'boltzmann', to:'boltzmann_m', stream:'stats' },
    { from:'cayley', to:'mcculloch', stream:'math' },
    { from:'plato', to:'godel', stream:'culture' },
    { from:'leibniz_calc', to:'linnainmaa', stream:'math' },
    { from:'newton', to:'gauss', stream:'math' },
    { from:'fermat', to:'kolmogorov', stream:'stats' },
    { from:'saussure', to:'firth', stream:'language' },
    { from:'wiener', to:'hebb', stream:'neuro' },
    { from:'cajal', to:'hubel_wiesel', stream:'neuro' },
    { from:'eliza', to:'lighthill', stream:'culture' },
    { from:'turing', to:'eliza', stream:'logic' },
    { from:'hebb', to:'perceptron', stream:'neuro' },
    { from:'glm', to:'relu', stream:'stats' },
    { from:'markov', to:'lstm', stream:'stats' },
    { from:'zipf', to:'word2vec', stream:'stats' },
    { from:'commoncrawl', to:'stochastic_p', stream:'culture' },
    { from:'gpt3', to:'reversal', stream:'neuro' },
    { from:'gpt3', to:'grokking', stream:'neuro' },
    { from:'instructgpt', to:'waluigi', stream:'culture' },
    { from:'instructgpt', to:'sleeper', stream:'culture' },
    { from:'glitch', to:'mechinterp', stream:'neuro' },
    { from:'sparse_auto', to:'mechinterp', stream:'neuro' },
    { from:'geometry_truth', to:'mechinterp', stream:'neuro' },
    { from:'alignment', to:'acult', stream:'culture' },
    { from:'compbio', to:'diffusion', stream:'stats' },
    { from:'crypto', to:'alignment', stream:'logic' },
  ];

  /* ═══════════════════════════════════════════════════════
     RENDERING — VERTICAL (top = earliest, bottom = now)
     More spacing: larger row/col gaps, bigger node radius
     ═══════════════════════════════════════════════════════ */
  const svg = document.getElementById('river-svg');
  const tooltip = document.getElementById('river-tooltip');
  const container = document.getElementById('river-container');

  const TOTAL_ROWS = 15;
  const TOTAL_COLS = 11;
  const PAD = { top: 70, bottom: 80, left: 60, right: 60 };
  const NODE_R = 26;

  function calcSize() {
    const w = Math.max(1000, container.clientWidth - 16);
    const h = Math.max(2200, TOTAL_ROWS * 155 + PAD.top + PAD.bottom);
    return { w, h };
  }
  function colX(col) {
    const { w } = calcSize();
    return PAD.left + (col / (TOTAL_COLS - 1)) * (w - PAD.left - PAD.right);
  }
  function rowY(row) {
    const { h } = calcSize();
    return PAD.top + (row / (TOTAL_ROWS - 1)) * (h - PAD.top - PAD.bottom);
  }
  function nodeById(id) { return NODES.find(n => n.id === id); }

  function draw() {
    const { w, h } = calcSize();
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.innerHTML = '';

    // ── Defs ──
    const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    defs.innerHTML = `
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="text-bg" x="-0.05" y="-0.05" width="1.1" height="1.1">
        <feFlood flood-color="#fafbfd" flood-opacity="0.85" result="bg"/>
        <feMerge><feMergeNode in="bg"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <pattern id="border-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.8" fill="rgba(30,58,95,0.08)"/>
      </pattern>`;
    svg.appendChild(defs);

    // ── Decorative border frame ──
    const borderRect = document.createElementNS('http://www.w3.org/2000/svg','rect');
    borderRect.setAttribute('x', 12);
    borderRect.setAttribute('y', 12);
    borderRect.setAttribute('width', w - 24);
    borderRect.setAttribute('height', h - 24);
    borderRect.setAttribute('rx', 16);
    borderRect.setAttribute('fill', 'none');
    borderRect.setAttribute('stroke', 'rgba(30,58,95,0.06)');
    borderRect.setAttribute('stroke-width', '1.5');
    borderRect.setAttribute('stroke-dasharray', '8,4');
    svg.appendChild(borderRect);

    // Inner dotted border
    const innerBorder = document.createElementNS('http://www.w3.org/2000/svg','rect');
    innerBorder.setAttribute('x', 24);
    innerBorder.setAttribute('y', 24);
    innerBorder.setAttribute('width', w - 48);
    innerBorder.setAttribute('height', h - 48);
    innerBorder.setAttribute('rx', 12);
    innerBorder.setAttribute('fill', 'url(#border-dots)');
    innerBorder.setAttribute('stroke', 'none');
    innerBorder.setAttribute('opacity', '0.5');
    svg.appendChild(innerBorder);

    // ── Corner ornaments ──
    const cornerSize = 30;
    const corners = [
      { x: 18, y: 18, sx: 1, sy: 1 },
      { x: w - 18, y: 18, sx: -1, sy: 1 },
      { x: 18, y: h - 18, sx: 1, sy: -1 },
      { x: w - 18, y: h - 18, sx: -1, sy: -1 },
    ];
    corners.forEach(({ x, y, sx, sy }) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', `M${x},${y + sy * cornerSize} L${x},${y} L${x + sx * cornerSize},${y}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'rgba(30,58,95,0.12)');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
      // Small diamond at corner
      const diamond = document.createElementNS('http://www.w3.org/2000/svg','polygon');
      const ds = 4;
      diamond.setAttribute('points', `${x},${y-ds} ${x+ds},${y} ${x},${y+ds} ${x-ds},${y}`);
      diamond.setAttribute('fill', 'rgba(30,58,95,0.1)');
      svg.appendChild(diamond);
    });

    // ── Timeline markers along right border ──
    const timelineX = w - 30;
    const eraLabelsTimeline = [
      { row: 0, label: '~3M BCE' },
      { row: 1, label: '~500 BCE' },
      { row: 2, label: '~1000 CE' },
      { row: 3, label: '~1600' },
      { row: 4, label: '~1850' },
      { row: 5, label: '~1930' },
      { row: 6, label: '~1950' },
      { row: 7, label: '~1970' },
      { row: 8, label: '~1990' },
      { row: 9, label: '~2005' },
      { row: 10, label: '~2012' },
      { row: 11, label: '~2017' },
      { row: 12, label: '~2020' },
      { row: 13, label: '~2023' },
      { row: 14, label: 'Now →' },
    ];
    // Timeline vertical line
    const tlLine = document.createElementNS('http://www.w3.org/2000/svg','line');
    tlLine.setAttribute('x1', timelineX);
    tlLine.setAttribute('y1', rowY(0) - 10);
    tlLine.setAttribute('x2', timelineX);
    tlLine.setAttribute('y2', rowY(14) + 10);
    tlLine.setAttribute('stroke', 'rgba(30,58,95,0.08)');
    tlLine.setAttribute('stroke-width', '1');
    svg.appendChild(tlLine);

    eraLabelsTimeline.forEach(({ row, label }) => {
      const y = rowY(row);
      // Tick mark
      const tick = document.createElementNS('http://www.w3.org/2000/svg','line');
      tick.setAttribute('x1', timelineX - 5);
      tick.setAttribute('y1', y);
      tick.setAttribute('x2', timelineX + 5);
      tick.setAttribute('y2', y);
      tick.setAttribute('stroke', 'rgba(30,58,95,0.12)');
      tick.setAttribute('stroke-width', '1.5');
      svg.appendChild(tick);
      // Label
      const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
      txt.setAttribute('x', timelineX);
      txt.setAttribute('y', y - 8);
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('fill', 'rgba(30,58,95,0.18)');
      txt.setAttribute('font-size', '9');
      txt.setAttribute('font-family', 'inherit');
      txt.setAttribute('font-weight', '600');
      txt.textContent = label;
      svg.appendChild(txt);
    });

    // ── Era bands (horizontal stripes) ──
    const eras = [...new Set(NODES.map(n => n.era))];
    const eraRowRanges = {};
    NODES.forEach(n => {
      if (!eraRowRanges[n.era]) eraRowRanges[n.era] = [n.row, n.row];
      eraRowRanges[n.era][0] = Math.min(eraRowRanges[n.era][0], n.row);
      eraRowRanges[n.era][1] = Math.max(eraRowRanges[n.era][1], n.row);
    });
    let eraIdx = 0;
    for (const era of eras) {
      const [r0, r1] = eraRowRanges[era];
      const rowGap = (rowY(1) - rowY(0)) * 0.45;
      const y0 = rowY(r0) - rowGap;
      const y1 = rowY(r1) + rowGap;
      const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
      rect.setAttribute('x', 0);
      rect.setAttribute('y', y0);
      rect.setAttribute('width', w);
      rect.setAttribute('height', y1 - y0);
      rect.setAttribute('fill', eraIdx % 2 === 0 ? 'rgba(30,58,95,0.025)' : 'rgba(30,58,95,0.05)');
      svg.appendChild(rect);

      // Era label on left
      const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
      txt.setAttribute('x', 34);
      txt.setAttribute('y', (y0 + y1) / 2);
      txt.setAttribute('text-anchor', 'start');
      txt.setAttribute('dominant-baseline', 'middle');
      txt.setAttribute('fill', 'rgba(30,58,95,0.2)');
      txt.setAttribute('font-size', '11');
      txt.setAttribute('font-family', 'inherit');
      txt.setAttribute('font-weight', '600');
      txt.setAttribute('writing-mode', 'vertical-rl');
      txt.setAttribute('transform', `rotate(180, 34, ${(y0+y1)/2})`);
      txt.textContent = era;
      svg.appendChild(txt);
      eraIdx++;
    }

    // ── Edges (curved, vertical flow) ──
    EDGES.forEach(e => {
      const from = nodeById(e.from);
      const to = nodeById(e.to);
      if (!from || !to) return;
      const x1 = colX(from.col), y1 = rowY(from.row);
      const x2 = colX(to.col),   y2 = rowY(to.row);
      const my = (y1 + y2) / 2;
      const dx = (x2 - x1) * 0.12;
      const d = `M${x1},${y1} C${x1 + dx},${my} ${x2 - dx},${my} ${x2},${y2}`;
      const color = STREAMS[e.stream]?.color || '#999';

      // Glow
      const glow = document.createElementNS('http://www.w3.org/2000/svg','path');
      glow.setAttribute('d', d);
      glow.setAttribute('fill', 'none');
      glow.setAttribute('stroke', color);
      glow.setAttribute('stroke-width', '5');
      glow.setAttribute('opacity', '0.08');
      glow.setAttribute('filter', 'url(#glow)');
      svg.appendChild(glow);

      // Main line
      const main = document.createElementNS('http://www.w3.org/2000/svg','path');
      main.setAttribute('d', d);
      main.setAttribute('fill', 'none');
      main.setAttribute('stroke', color);
      main.setAttribute('stroke-width', '1.8');
      main.setAttribute('opacity', '0.30');
      main.setAttribute('stroke-linecap', 'round');
      svg.appendChild(main);
    });

    // ── Nodes ──
    NODES.forEach(n => {
      const cx = colX(n.col), cy = rowY(n.row);
      const color = STREAMS[n.stream]?.color || '#999';

      const g = document.createElementNS('http://www.w3.org/2000/svg','g');
      g.setAttribute('class', 'river-node');
      g.style.cursor = n.divId ? 'pointer' : 'default';
      g.style.transition = 'opacity 0.2s';

      // Outer glow
      const cGlow = document.createElementNS('http://www.w3.org/2000/svg','circle');
      cGlow.setAttribute('cx', cx);
      cGlow.setAttribute('cy', cy);
      cGlow.setAttribute('r', NODE_R + 5);
      cGlow.setAttribute('fill', color);
      cGlow.setAttribute('opacity', '0.07');
      cGlow.setAttribute('filter', 'url(#glow-strong)');
      g.appendChild(cGlow);

      // Main circle
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx', cx);
      c.setAttribute('cy', cy);
      c.setAttribute('r', NODE_R);
      c.setAttribute('fill', '#fafbfd');
      c.setAttribute('stroke', color);
      c.setAttribute('stroke-width', '2');
      g.appendChild(c);

      // Label — multiline word wrap
      const label = n.label;
      const maxChars = 13;
      const lines = [];
      if (label.length <= maxChars) {
        lines.push(label);
      } else {
        const words = label.split(/[\s/]+/);
        let cur = '';
        for (const wrd of words) {
          if ((cur + ' ' + wrd).trim().length > maxChars && cur) {
            lines.push(cur);
            cur = wrd;
          } else {
            cur = cur ? cur + ' ' + wrd : wrd;
          }
        }
        if (cur) lines.push(cur);
        if (lines.length > 2) {
          lines.length = 2;
          lines[1] = lines[1].slice(0, 10) + '…';
        }
      }

      const textGroup = document.createElementNS('http://www.w3.org/2000/svg','text');
      textGroup.setAttribute('x', cx);
      textGroup.setAttribute('text-anchor', 'middle');
      textGroup.setAttribute('fill', color);
      textGroup.setAttribute('font-size', '9');
      textGroup.setAttribute('font-weight', '700');
      textGroup.setAttribute('font-family', 'inherit');
      textGroup.setAttribute('filter', 'url(#text-bg)');

      lines.forEach((line, i) => {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg','tspan');
        tspan.setAttribute('x', cx);
        const baseY = cy - ((lines.length - 1) * 5.5);
        tspan.setAttribute('y', baseY + i * 11);
        tspan.textContent = line;
        textGroup.appendChild(tspan);
      });
      g.appendChild(textGroup);

      // ── Interaction ──
      g.addEventListener('mouseenter', (ev) => {
        c.setAttribute('r', NODE_R + 4);
        c.setAttribute('stroke-width', '3');
        cGlow.setAttribute('opacity', '0.25');
        showTooltip(ev, n);
        highlightConnected(n.id);
      });
      g.addEventListener('mousemove', (ev) => {
        positionTooltip(ev);
      });
      g.addEventListener('mouseleave', () => {
        c.setAttribute('r', NODE_R);
        c.setAttribute('stroke-width', '2');
        cGlow.setAttribute('opacity', '0.07');
        hideTooltip();
        resetHighlight();
      });
      g.addEventListener('click', () => {
        if (n.divId) {
          const el = document.getElementById(n.divId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      svg.appendChild(g);
    });

    // ── "More beyond" arrows at top and bottom ──
    for (let i = 0; i < 7; i++) {
      const x = PAD.left + (i / 6) * (w - PAD.left - PAD.right);
      const arrow = document.createElementNS('http://www.w3.org/2000/svg','text');
      arrow.setAttribute('x', x);
      arrow.setAttribute('y', 22);
      arrow.setAttribute('text-anchor', 'middle');
      arrow.setAttribute('fill', '#c8d6e5');
      arrow.setAttribute('font-size', '14');
      arrow.setAttribute('opacity', 0.12 + Math.random() * 0.15);
      arrow.textContent = '⋮';
      svg.appendChild(arrow);
    }
    for (let i = 0; i < 9; i++) {
      const x = PAD.left + (i / 8) * (w - PAD.left - PAD.right);
      const arrow = document.createElementNS('http://www.w3.org/2000/svg','text');
      arrow.setAttribute('x', x);
      arrow.setAttribute('y', h - 16);
      arrow.setAttribute('text-anchor', 'middle');
      arrow.setAttribute('fill', '#8a9bb5');
      arrow.setAttribute('font-size', '16');
      arrow.setAttribute('opacity', 0.12 + Math.random() * 0.2);
      arrow.textContent = '⋮';
      svg.appendChild(arrow);
    }

    // ── Side whiskers — faded lines going off left and right edges ──
    const whiskerRows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    whiskerRows.forEach(r => {
      const y = rowY(r);
      // Left whisker
      const lw = document.createElementNS('http://www.w3.org/2000/svg','line');
      lw.setAttribute('x1', 0); lw.setAttribute('y1', y);
      lw.setAttribute('x2', PAD.left - 15); lw.setAttribute('y2', y + (Math.random()-0.5)*40);
      lw.setAttribute('stroke', '#c8d6e5');
      lw.setAttribute('stroke-width', '1.2');
      lw.setAttribute('opacity', '0.10');
      lw.setAttribute('stroke-dasharray', '4,6');
      svg.appendChild(lw);
      // Right whisker
      const rw = document.createElementNS('http://www.w3.org/2000/svg','line');
      rw.setAttribute('x1', w - PAD.right + 15); rw.setAttribute('y1', y);
      rw.setAttribute('x2', w); rw.setAttribute('y2', y + (Math.random()-0.5)*40);
      rw.setAttribute('stroke', '#c8d6e5');
      rw.setAttribute('stroke-width', '1.2');
      rw.setAttribute('opacity', '0.10');
      rw.setAttribute('stroke-dasharray', '4,6');
      svg.appendChild(rw);
    });

    // ── Border decorative dots along edges ──
    for (let i = 0; i < 30; i++) {
      const side = Math.floor(Math.random() * 4);
      let bx, by;
      if (side === 0) { bx = 6 + Math.random() * 10; by = Math.random() * h; }       // left
      else if (side === 1) { bx = w - 6 - Math.random() * 10; by = Math.random() * h; } // right
      else if (side === 2) { bx = Math.random() * w; by = 6 + Math.random() * 10; }     // top
      else { bx = Math.random() * w; by = h - 6 - Math.random() * 10; }                  // bottom
      const dot = document.createElementNS('http://www.w3.org/2000/svg','circle');
      dot.setAttribute('cx', bx);
      dot.setAttribute('cy', by);
      dot.setAttribute('r', 1 + Math.random() * 1.5);
      dot.setAttribute('fill', 'rgba(30,58,95,0.06)');
      svg.appendChild(dot);
    }
  }

  /* ═══════════════════════════════════════════════════════
     TOOLTIP — smart edge-aware positioning
     ═══════════════════════════════════════════════════════ */
  let currentNode = null;

  function positionTooltip(ev) {
    const rect = container.getBoundingClientRect();
    const ttW = 340;
    const ttH = 130;
    const gap = 20;

    let x = ev.clientX - rect.left + gap;
    let y = ev.clientY - rect.top + gap;

    if (x + ttW > container.clientWidth - 12) {
      x = ev.clientX - rect.left - ttW - gap;
    }
    if (x < 8) x = 8;
    if (y + ttH > container.clientHeight - 12) {
      y = ev.clientY - rect.top - ttH - gap;
    }
    if (y < 8) y = 8;

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  function showTooltip(ev, node) {
    currentNode = node;
    const color = STREAMS[node.stream]?.color || '#999';
    tooltip.querySelector('.tt-era').textContent = node.era;
    tooltip.querySelector('.tt-title').textContent = node.label;
    tooltip.querySelector('.tt-title').style.color = color;
    tooltip.querySelector('.tt-body').textContent = node.short;
    tooltip.querySelector('.tt-click').textContent = node.divId
      ? '⤷ Click to jump to this section'
      : '';
    tooltip.style.borderColor = color;
    tooltip.style.opacity = '1';
    positionTooltip(ev);
  }

  function hideTooltip() {
    tooltip.style.opacity = '0';
    currentNode = null;
  }

  /* ═══════════════════════════════════════════════════════
     HIGHLIGHT — show interconnectedness
     On hover: highlight ALL transitively connected nodes
     (up to 2 hops) to show how intertwined everything is
     ═══════════════════════════════════════════════════════ */
  function getConnected(nodeId, hops) {
    const visited = new Set([nodeId]);
    const edgeSet = new Set();
    let frontier = new Set([nodeId]);

    for (let h = 0; h < hops; h++) {
      const nextFrontier = new Set();
      EDGES.forEach((e, i) => {
        if (frontier.has(e.from)) {
          edgeSet.add(i);
          visited.add(e.to);
          nextFrontier.add(e.to);
        }
        if (frontier.has(e.to)) {
          edgeSet.add(i);
          visited.add(e.from);
          nextFrontier.add(e.from);
        }
      });
      frontier = nextFrontier;
    }
    return { nodes: visited, edges: edgeSet };
  }

  function highlightConnected(nodeId) {
    const { nodes: connectedNodes, edges: connectedEdges } = getConnected(nodeId, 2);
    const { nodes: directNodes, edges: directEdges } = getConnected(nodeId, 1);

    const paths = svg.querySelectorAll('path');
    let pathIdx = 0;
    EDGES.forEach((e, i) => {
      // Skip non-edge paths (border frame, corner ornaments, etc.)
      // We need to count only edge paths: each edge = 2 paths (glow + main)
      const glow = paths[pathIdx];
      const main = paths[pathIdx + 1];
      if (directEdges.has(i)) {
        if (glow) { glow.setAttribute('opacity', '0.35'); glow.setAttribute('stroke-width', '8'); }
        if (main) { main.setAttribute('opacity', '0.85'); main.setAttribute('stroke-width', '3.5'); }
      } else if (connectedEdges.has(i)) {
        if (glow) { glow.setAttribute('opacity', '0.12'); glow.setAttribute('stroke-width', '6'); }
        if (main) { main.setAttribute('opacity', '0.45'); main.setAttribute('stroke-width', '2.2'); }
      } else {
        if (glow) glow.setAttribute('opacity', '0.02');
        if (main) main.setAttribute('opacity', '0.06');
      }
      pathIdx += 2;
    });

    const nodeGroups = svg.querySelectorAll('.river-node');
    nodeGroups.forEach((g, i) => {
      if (i < NODES.length) {
        const n = NODES[i];
        if (n.id === nodeId) {
          g.style.opacity = '1';
        } else if (directNodes.has(n.id)) {
          g.style.opacity = '1';
        } else if (connectedNodes.has(n.id)) {
          g.style.opacity = '0.65';
        } else {
          g.style.opacity = '0.12';
        }
      }
    });
  }

  function resetHighlight() {
    const paths = svg.querySelectorAll('path');
    let pathIdx = 0;
    EDGES.forEach(() => {
      const glow = paths[pathIdx];
      const main = paths[pathIdx + 1];
      if (glow) { glow.setAttribute('opacity', '0.08'); glow.setAttribute('stroke-width', '5'); }
      if (main) { main.setAttribute('opacity', '0.30'); main.setAttribute('stroke-width', '1.8'); }
      pathIdx += 2;
    });

    const nodeGroups = svg.querySelectorAll('.river-node');
    nodeGroups.forEach(g => { g.style.opacity = '1'; });
  }

  /* ═══════════════════════════════════════════════════════
     LEGEND
     ═══════════════════════════════════════════════════════ */
  function buildLegend() {
    const leg = document.getElementById('river-legend');
    leg.innerHTML = '';
    for (const [key, s] of Object.entries(STREAMS)) {
      const sp = document.createElement('span');
      sp.innerHTML = `<span class="swatch" style="background:${s.color}"></span>${s.label}`;
      leg.appendChild(sp);
    }
  }

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */
  draw();
  buildLegend();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(draw, 150);
  });

  /* ═══════════════════════════════════════════════════════
     OPTIONAL: Scroll-based active node highlighting
     Add divId: 'your-section-id' to any NODE to enable.
     ═══════════════════════════════════════════════════════ */
  function setupScrollHighlighting() {
    const nodesWithDivs = NODES.filter(n => n.divId);
    if (nodesWithDivs.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const node = NODES.find(n => n.divId === entry.target.id);
        if (!node) return;
        const idx = NODES.indexOf(node);
        const nodeGroups = svg.querySelectorAll('.river-node');
        if (idx >= 0 && idx < nodeGroups.length) {
          const g = nodeGroups[idx];
          if (entry.isIntersecting) {
            g.classList.add('river-node-active');
          } else {
            g.classList.remove('river-node-active');
          }
        }
      });
    }, { threshold: 0.3 });

    nodesWithDivs.forEach(n => {
      const el = document.getElementById(n.divId);
      if (el) observer.observe(el);
    });
  }
  setupScrollHighlighting();

})();
</script>
