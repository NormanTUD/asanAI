<!-- ============================================================
     RIVER OF IDEAS v3 — Dark Mode, Comprehensive, Clickable
     ============================================================ -->
<style>
  #river-container {
    position: relative;
    width: 100%;
    max-width: 1200px;
    margin: 2rem auto;
    background: linear-gradient(180deg, #080c15 0%, #0c1525 40%, #080c15 100%);
    border-radius: 16px;
    padding: 2rem 1rem 3rem 1rem;
    overflow: hidden;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #c8d6e5;
    box-shadow: 0 0 60px rgba(0,100,220,0.07), inset 0 0 80px rgba(0,0,0,0.3);
    border: 1px solid rgba(126,200,227,0.08);
  }
  #river-container h2 {
    text-align: center;
    font-size: 1.6rem;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
    color: #7ec8e3;
    text-shadow: 0 0 20px rgba(126,200,227,0.3);
  }
  #river-container .subtitle {
    text-align: center;
    font-size: 0.88rem;
    opacity: 0.5;
    margin-bottom: 0.4rem;
    font-style: italic;
    color: #8fa8c8;
  }
  #river-container .subtitle2 {
    text-align: center;
    font-size: 0.75rem;
    opacity: 0.35;
    margin-bottom: 1.5rem;
    color: #8fa8c8;
  }
  #river-svg { width: 100%; height: auto; display: block; }

  /* Tooltip */
  #river-tooltip {
    position: absolute;
    pointer-events: none;
    background: rgba(8,12,21,0.97);
    border: 1.5px solid rgba(126,200,227,0.3);
    border-radius: 10px;
    padding: 11px 15px;
    font-size: 0.84rem;
    line-height: 1.5;
    max-width: 300px;
    width: max-content;
    opacity: 0;
    transition: opacity 0.18s;
    z-index: 100;
    box-shadow: 0 8px 32px rgba(0,0,0,0.7);
    backdrop-filter: blur(8px);
  }
  #river-tooltip .tt-era {
    font-size: 0.68rem;
    color: #506880;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 2px;
  }
  #river-tooltip .tt-title {
    font-weight: 700;
    color: #7ec8e3;
    margin-bottom: 5px;
    font-size: 0.95rem;
  }
  #river-tooltip .tt-body {
    color: #9ab0c8;
    font-size: 0.82rem;
    line-height: 1.5;
  }
  #river-tooltip .tt-click {
    margin-top: 6px;
    font-size: 0.7rem;
    color: #506880;
    font-style: italic;
  }

  /* Legend */
  #river-legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px;
    margin-top: 1.2rem;
    font-size: 0.78rem;
    opacity: 0.65;
  }
  #river-legend span {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #8fa8c8;
  }
  #river-legend .swatch {
    width: 10px; height: 10px;
    border-radius: 50%;
    display: inline-block;
    box-shadow: 0 0 6px currentColor;
  }

  @keyframes pulse-glow {
    0%, 100% { filter: drop-shadow(0 0 4px rgba(126,200,227,0.4)); }
    50%      { filter: drop-shadow(0 0 16px rgba(126,200,227,0.9)); }
  }
  .river-node-active { animation: pulse-glow 2s ease-in-out infinite; }

  @media (max-width: 700px) {
    #river-container { padding: 1rem 0.2rem 2rem 0.2rem; }
    #river-container h2 { font-size: 1.2rem; }
  }
</style>

<div id="river-container">
  <h2>🌊 The River of Ideas</h2>
  <div class="subtitle">πάντα ῥεῖ — everything flows (Heraclitus)</div>
  <div class="subtitle2">Each generation traded hand-crafted specificity for greater generality — and the machine took over another layer of human cognitive labor. Click any node to jump to its section.</div>
  <svg id="river-svg"></svg>
  <div id="river-tooltip">
    <div class="tt-era"></div>
    <div class="tt-title"></div>
    <div class="tt-body"></div>
    <div class="tt-click"></div>
  </div>
  <div id="river-legend"></div>
</div>

<script>
(() => {
  /* ═══════════════════════════════════════════════════════
     STREAMS
     ═══════════════════════════════════════════════════════ */
  const STREAMS = {
    math:     { color: '#f7b731', label: 'Mathematics' },
    logic:    { color: '#a55eea', label: 'Logic & Computation' },
    hardware: { color: '#eb3b5a', label: 'Hardware & Engineering' },
    stats:    { color: '#20bf6b', label: 'Statistics & Data' },
    neuro:    { color: '#3867d6', label: 'Neuroscience & AI' },
    language: { color: '#fa8231', label: 'Language & Linguistics' },
    culture:  { color: '#778ca3', label: 'Culture & Philosophy' },
    training: { color: '#45aaf2', label: 'Training & Optimization' },
  };

  /* ═══════════════════════════════════════════════════════
     NODES — comprehensive from sources.txt + document
     col = time (0–15), row = lane (0–9)
     divId = optional section ID for click-to-navigate
     ═══════════════════════════════════════════════════════ */
  const NODES = [
    // ── Col 0: Prehistoric ──
    { id:'stone_tools', label:'Stone Tools',             short:'Harmand 2015 — 3.3 million-year-old tools from Lomekwi 3, West Turkana',                     era:'Prehistoric',     col:0, row:0, stream:'hardware' },
    { id:'tally',       label:'Tally Bones',              short:'Lebombo ~43,000 BCE, Ishango ~20,000 BCE — first external memory (Bruderer 2024)',           era:'Prehistoric',     col:0, row:2, stream:'math' },
    { id:'cave',        label:'Blombos Ochre',             short:'~75,000 BCE — first abstract symbolic marks (Henshilwood)',                                  era:'Prehistoric',     col:0, row:4, stream:'culture' },
    { id:'language0',   label:'Proto-Language',             short:'~135,000 years ago — symbolic displacement, descended larynx (Miyagawa 2025)',               era:'Prehistoric',     col:0, row:7, stream:'language' },

    // ── Col 1: Ancient ──
    { id:'abacus',      label:'Salamis Tablet',             short:'~300 BCE — spatial abstraction of arithmetic (Kubitschek 1899)',                              era:'Ancient',         col:1, row:1, stream:'math' },
    { id:'writing',     label:'Writing Systems',             short:'Cuneiform ~3200 BCE → Phoenician → Greek vowels (Gardiner 1916, Darnell 2005)',             era:'Ancient',         col:1, row:4, stream:'language' },
    { id:'panini',      label:'Pāṇini / Ashtadhyayi',      short:'~4th c. BCE — first formal generative grammar, 3,959 rules',                                era:'Ancient',         col:1, row:6, stream:'language' },
    { id:'euclid',      label:"Euclid's Elements",          short:'~300 BCE — axiomatic method, formal proof',                                                  era:'Ancient',         col:1, row:2, stream:'logic' },
    { id:'aristotle',   label:'Aristotle / Syllogisms',     short:'Analytica Priora ~350 BCE — formal deductive logic (Bocheński 1961)',                        era:'Ancient',         col:1, row:3, stream:'logic' },
    { id:'antikythera', label:'Antikythera Mechanism',       short:'~200 BCE — first analog computer (Clutario, Freeth 2009)',                                   era:'Ancient',         col:1, row:0, stream:'hardware' },
    { id:'heraclitus',  label:'Heraclitus',                  short:'"πάντα ῥεῖ" — everything flows, the river metaphor (~500 BCE)',                              era:'Ancient',         col:1, row:8, stream:'culture' },
    { id:'plato',       label:'Plato / The Republic',        short:'~380 BCE — the cave allegory, forms vs. shadows',                                           era:'Ancient',         col:1, row:9, stream:'culture' },
    { id:'aryabhata',   label:'Āryabhaṭa',                  short:'499 CE — trigonometric tables, place-value system (Singh 2023)',                              era:'Ancient',         col:1, row:5, stream:'math' },

    // ── Col 2: Medieval ──
    { id:'algebra',     label:'Al-Khwarizmi / Algebra',     short:'~825 CE — al-jabr wa-l-muqābala: "algorithm" is born',                                      era:'Medieval',        col:2, row:1, stream:'math' },
    { id:'sacrobosco',  label:'Sacrobosco / Hindu-Arabic',   short:'1230 — Tractatus de Sphaera, spread of positional notation to Europe',                      era:'Medieval',        col:2, row:2, stream:'math' },
    { id:'llull',       label:"Llull's Ars Magna",           short:'1305 — combinatorial reasoning machine, rotating discs (Bonner 2007)',                       era:'Medieval',        col:2, row:4, stream:'logic' },
    { id:'printing',    label:'Printing Press',               short:'Gutenberg ~1440 — mass replication of knowledge',                                           era:'Medieval',        col:2, row:8, stream:'culture' },
    { id:'devtula',     label:'De Vetula / Dice',             short:'~1250 — first systematic enumeration of dice outcomes',                                     era:'Medieval',        col:2, row:6, stream:'stats' },

    // ── Col 3: Enlightenment ──
    { id:'napier',      label:'Napier / Logarithms',         short:'1614 — multiplication by addition, "doubled the astronomer\'s life"',                        era:'Enlightenment',   col:3, row:0, stream:'math' },
    { id:'descartes',   label:'Descartes / Coordinates',     short:'1637 — La Géométrie: algebra meets geometry',                                                era:'Enlightenment',   col:3, row:1, stream:'math' },
    { id:'fermat',      label:'Fermat & Pascal',              short:'1654 — correspondence on probability, expected value',                                       era:'Enlightenment',   col:3, row:5, stream:'stats' },
    { id:'leibniz_calc',label:'Leibniz / Calculus',           short:'1684 — Nova Methodus: notation that thinks for you (dx, ∫)',                                 era:'Enlightenment',   col:3, row:2, stream:'math' },
    { id:'newton',      label:'Newton / Calculus',            short:'Fluxions — abstraction of change, inverse square law',                                       era:'Enlightenment',   col:3, row:3, stream:'math' },
    { id:'leibniz_logic',label:'Leibniz / Calculemus!',      short:'1685 — Generales Inquisitiones: dream of universal reasoning machine',                       era:'Enlightenment',   col:3, row:4, stream:'logic' },
    { id:'bernoulli',   label:'Jacob Bernoulli',              short:'1713 — Ars Conjectandi: law of large numbers',                                               era:'Enlightenment',   col:3, row:6, stream:'stats' },
    { id:'loom',        label:'Jacquard Loom',                short:'1804 — punch-card programming, first programmable input',                                    era:'Enlightenment',   col:3, row:7, stream:'hardware' },
    { id:'gunter',      label:'Gunter / Slide Rule',          short:'1620 — Canon Triangulorum, logarithmic scales',                                              era:'Enlightenment',   col:3, row:9, stream:'hardware' },

    // ── Col 4: 19th Century ──
    { id:'gauss',       label:'Gauß / Least Squares',        short:'1809 — Theoria Motus: Normal Distribution, Ceres recovery (Legendre 1805)',                  era:'19th C',          col:4, row:2, stream:'stats' },
    { id:'galton',      label:'Galton / Regression',          short:'1886 — regression to the mean, foundation of linear models',                                 era:'19th C',          col:4, row:3, stream:'stats' },
    { id:'boole',       label:"Boole's Algebra",              short:'1854 — An Investigation of the Laws of Thought: logic becomes math',                         era:'19th C',          col:4, row:4, stream:'logic' },
    { id:'babbage',     label:'Babbage & Lovelace',           short:'Analytical Engine — "weaves algebraic patterns as the Jacquard loom weaves flowers" (Stein 2016)', era:'19th C',    col:4, row:6, stream:'hardware' },
    { id:'cayley',      label:'Cayley / Matrices',            short:'1857–1889 — matrix algebra and group theory',                                                 era:'19th C',          col:4, row:1, stream:'math' },
    { id:'euler',       label:'Euler / Analysis',             short:'1755 — Institutiones calculi differentialis, e, Σ notation (Cajori 1928)',                    era:'19th C',          col:4, row:0, stream:'math' },
    { id:'faraday',     label:'Faraday / Electricity',        short:'1839 — electromagnetic induction → Tesla AC → power grid',                                    era:'19th C',          col:4, row:7, stream:'hardware' },
    { id:'saussure',    label:'Saussure / Linguistics',       short:'1916 — Cours: arbitrariness of the sign, language as system of differences',                  era:'19th C',          col:4, row:8, stream:'language' },
    { id:'cajal',       label:'Cajal / Neuron Doctrine',      short:'1905 — brain is discrete cells, not continuous web (Nobel 1906)',                              era:'19th C',          col:4, row:5, stream:'neuro' },
    { id:'boltzmann',   label:'Boltzmann / Entropy',          short:'1868 — statistical mechanics, S = k log W',                                                   era:'19th C',          col:4, row:9, stream:'stats' },

    // ── Col 5: Early 20th C ──
    { id:'hilbert',     label:"Hilbert's Program",            short:'Formalize all of mathematics — the dream and its limits',                                      era:'Early 20th C',    col:5, row:0, stream:'math' },
    { id:'godel',       label:"Gödel's Incompleteness",       short:'1931 — limits of formal systems, self-reference',                                              era:'Early 20th C',    col:5, row:1, stream:'logic' },
    { id:'turing',      label:'Turing Machine',                short:'1936–1950 — universal computation, the Imitation Game',                                       era:'Early 20th C',    col:5, row:2, stream:'logic' },
    { id:'shannon',     label:'Shannon / Info Theory',         short:'1948 — A Mathematical Theory of Communication: entropy, n-grams, redundancy',                 era:'Early 20th C',    col:5, row:3, stream:'stats' },
    { id:'mcculloch',   label:'McCulloch-Pitts Neuron',        short:'1943 — A Logical Calculus of Ideas Immanent in Nervous Activity',                              era:'Early 20th C',    col:5, row:4, stream:'neuro' },
    { id:'hebb',        label:'Hebb / Learning Rule',          short:'1949 — "Neurons that fire together wire together"',                                            era:'Early 20th C',    col:5, row:5, stream:'neuro' },
    { id:'frege',       label:'Frege & Russell',               short:'Begriffsschrift 1879, Principia 1910 — symbolic logic formalized',                             era:'Early 20th C',    col:5, row:6, stream:'logic' },
    { id:'fisher',      label:'Fisher / MLE',                  short:'1922 — maximum likelihood, foundations of theoretical statistics',                              era:'Early 20th C',    col:5, row:7, stream:'stats' },
    { id:'transistor',  label:'Transistor',                     short:'Bardeen & Brattain 1948, Shockley 1949 — quantum mechanics → semiconductor → digital age',    era:'Early 20th C',    col:5, row:8, stream:'hardware' },
    { id:'wiener',      label:'Wiener / Cybernetics',          short:'1948 — feedback loops, control and communication in animal and machine',                       era:'Early 20th C',    col:5, row:9, stream:'culture' },

    // ── Col 6: Mid 20th C ──
    { id:'vonneumann',  label:'Von Neumann / EDVAC',           short:'1945 — stored-program concept: data = instructions',                                           era:'Mid 20th C',      col:6, row:2, stream:'hardware' },
    { id:'zuse',        label:'Zuse Z1–Z3',                    short:'1937–41 — first binary programmable computers (Zuse 1970)',                                    era:'Mid 20th C',      col:6, row:3, stream:'hardware' },
    { id:'dartmouth',   label:'"Artificial Intelligence"',     short:'McCarthy et al. 1955–56 — the term is coined at Dartmouth',                                    era:'Mid 20th C',      col:6, row:4, stream:'neuro' },
    { id:'perceptron',  label:'Perceptron',                     short:'Rosenblatt 1958 — "New Navy Device Learns by Doing"',                                         era:'Mid 20th C',      col:6, row:5, stream:'neuro' },
    { id:'chomsky',     label:'Chomsky Hierarchy',              short:'1956 — formal grammars, generative linguistics',                                               era:'Mid 20th C',      col:6, row:7, stream:'language' },
    { id:'firth',       label:'Firth / Distributional',         short:'1957 — "You shall know a word by the company it keeps"',                                      era:'Mid 20th C',      col:6, row:8, stream:'language' },
    { id:'eliza',       label:'ELIZA',                          short:'Weizenbaum 1966–76 — the ELIZA effect, "Computer Power and Human Reason"',                    era:'Mid 20th C',      col:6, row:9, stream:'culture' },
    { id:'snarc',       label:'SNARC',                          short:'Minsky 1951 — first physical neural network, 40 Hebb synapses',                               era:'Mid 20th C',      col:6, row:6, stream:'neuro' },
    { id:'moore',       label:"Moore's Law",                    short:'1965 — "Cramming more components onto integrated circuits"',                                   era:'Mid 20th C',      col:6, row:1, stream:'hardware' },
    { id:'kolmogorov',  label:'Kolmogorov / Probability',       short:'1933 — axiomatic foundations of probability theory',                                           era:'Mid 20th C',      col:6, row:0, stream:'math' },

    // ── Col 7: 1960s–80s ──
    { id:'minsky_xor',  label:'Minsky / XOR Crisis',           short:'1969 — Perceptrons can\'t solve XOR → First AI Winter',                                        era:'1960s–80s',       col:7, row:1, stream:'neuro' },
    { id:'lighthill',   label:'Lighthill Report',               short:'1972 — "Artificial Intelligence: A General Survey" → UK AI funding cut',                       era:'1960s–80s',       col:7, row:2, stream:'culture' },
    { id:'linnainmaa',  label:'Automatic Differentiation',      short:'Linnainmaa 1970/76 — reverse-mode AD, backbone of backprop',                                   era:'1960s–80s',       col:7, row:0, stream:'math' },
    { id:'werbos',      label:'Werbos / Backprop Thesis',       short:'1974 — "Beyond Regression": backprop for neural nets conceived',                               era:'1960s–80s',       col:7, row:3, stream:'neuro' },
    { id:'backprop',    label:'Backpropagation',                 short:'Rumelhart, Hinton, Williams 1986 — abstraction of blame via chain rule',                       era:'1960s–80s',       col:7, row:4, stream:'neuro' },
    { id:'neocognitron',label:'Neocognitron',                    short:'Fukushima 1980 — hierarchical vision inspired by Hubel & Wiesel',                              era:'1960s–80s',       col:7, row:5, stream:'neuro' },
    { id:'boltzmann_m', label:'Boltzmann Machine',               short:'Ackley, Hinton, Sejnowski 1985 — stochastic generative model',                                 era:'1960s–80s',       col:7, row:6, stream:'neuro' },
    { id:'harris',      label:'Harris / Distributional',         short:'Zellig Harris 1954 — "Distributional Structures": meaning from context',                       era:'1960s–80s',       col:7, row:7, stream:'language' },
    { id:'arpanet',     label:'ARPANET → TCP/IP',                short:'Crocker 1969, Cerf & Kahn 1974 — the physical substrate of training data',                     era:'1960s–80s',       col:7, row:8, stream:'hardware' },
    { id:'fiber',       label:'Fiber Optics',                    short:'Kao & Hockham 1966, Kapron 1970 — light as data carrier',                                      era:'1960s–80s',       col:7, row:9, stream:'hardware' },

    // ── Col 8: 1990s ──
    { id:'lstm',        label:'LSTM',                            short:'Hochreiter & Schmidhuber 1997 — gated memory, vanishing gradient fix',                          era:'1990s',           col:8, row:3, stream:'neuro' },
    { id:'lenet',       label:'LeNet-5 / CNNs',                  short:'LeCun et al. 1989/1998 — convolutions + backprop for handwritten digits',                       era:'1990s',           col:8, row:4, stream:'neuro' },
    { id:'deepblue',    label:'Deep Blue',                        short:'1996–97 — symbolic AI beats Kasparov (Honda 1996)',                                             era:'1990s',           col:8, row:2, stream:'logic' },
    { id:'bpe',         label:'BPE Tokenization',                 short:'Gage 1994 → Sennrich 2016 — subword units solve open vocabulary',                               era:'1990s',           col:8, row:6, stream:'language' },
    { id:'www',         label:'World Wide Web',                    short:'Berners-Lee 1989 — self-assembling corpus of human thought',                                    era:'1990s',           col:8, row:8, stream:'culture' },
    { id:'ridge_lasso', label:'Ridge & Lasso',                    short:'Hoerl & Kennard 1970, Tibshirani 1996 — regularization: the art of forgetting',                 era:'1990s',           col:8, row:1, stream:'stats' },
    { id:'vanishing',   label:'Vanishing Gradients',              short:'Hochreiter 1991, Bengio 1994 — the problem that shaped architecture',                           era:'1990s',           col:8, row:5, stream:'neuro' },
    { id:'jelinek',     label:'Statistical NLP',                   short:'Jelinek 1988 — "Every time I fire a linguist, recognition goes up"',                            era:'1990s',           col:8, row:7, stream:'language' },
    { id:'zipf',        label:'Zipf\'s Law',                      short:'1949 — power-law frequency distribution, the long tail of language',                             era:'1990s',           col:8, row:0, stream:'stats' },
    { id:'gpu_early',   label:'GPU Computing',                     short:'Oh & Jung 2004, Raina 2009 — gamers\' hardware becomes AI\'s engine',                           era:'1990s',           col:8, row:9, stream:'hardware' },

    // ── Col 9: 2000s ──
    { id:'bengio_nlm',  label:'Neural Language Model',            short:'Bengio 2003 — word embeddings, curse of dimensionality',                                         era:'2000s',           col:9, row:3, stream:'neuro' },
    { id:'hinton_dbn',  label:'Deep Belief Nets',                  short:'Hinton, Osindero, Teh 2006 — greedy layer-wise pretraining',                                    era:'2000s',           col:9, row:4, stream:'neuro' },
    { id:'cuda',        label:'CUDA',                               short:'Buck & Nickolls 2006 — NVIDIA opens GPU for general computation',                               era:'2000s',           col:9, row:8, stream:'hardware' },
    { id:'commoncrawl', label:'Common Crawl',                       short:'2007+ — open repository of web crawl data, petabytes of text',                                  era:'2000s',           col:9, row:7, stream:'culture' },
    { id:'markov',      label:'Markov Chains',                      short:'Markov 1913 — statistical investigation of Eugene Onegin, sequential dependence',               era:'2000s',           col:9, row:1, stream:'stats' },
    { id:'sgd',         label:'SGD & Momentum',                     short:'Robbins-Monro 1950, Polyak 1962, Cauchy 1847 — stochastic optimization',                        era:'2000s',           col:9, row:0, stream:'training' },
    { id:'dropout',     label:'Dropout',                             short:'Srivastava & Hinton 2014 — randomly silencing neurons prevents co-adaptation',                  era:'2000s',           col:9, row:5, stream:'training' },
    { id:'glm',         label:'GLMs / Logistic Regression',         short:'Nelder & Wedderburn 1972, Berkson 1944, Bliss 1934 — the sigmoid lineage',                      era:'2000s',           col:9, row:2, stream:'stats' },
    { id:'torch',       label:'Torch → PyTorch / TensorFlow',       short:'Collobert 2002 → Paszke 2019, Abadi 2016 — autodiff frameworks',                               era:'2000s',           col:9, row:9, stream:'hardware' },
    { id:'kl_div',      label:'KL Divergence / Info Bottleneck',    short:'Kullback-Leibler 1951, Tishby 2000 — measuring distributional distance',                        era:'2000s',           col:9, row:6, stream:'stats' },

    // ── Col 10: 2010–2014 ──
    { id:'alexnet',     label:'AlexNet',                            short:'Krizhevsky, Sutskever, Hinton 2012 — GPU + CNN + ImageNet = revolution',                         era:'2010–14',         col:10, row:3, stream:'neuro' },
    { id:'word2vec',    label:'Word2Vec',                            short:'Mikolov 2013 — king − man + woman ≈ queen, meaning as geometry',                                era:'2010–14',         col:10, row:5, stream:'language' },
    { id:'relu',        label:'ReLU Activation',                     short:'Glorot, Nair & Hinton 2010–11 — max(0,x): death of vanishing gradients',                        era:'2010–14',         col:10, row:2, stream:'training' },
    { id:'adam',        label:'Adam Optimizer',                      short:'Kingma & Ba 2014 — adaptive per-parameter learning rates',                                       era:'2010–14',         col:10, row:1, stream:'training' },
    { id:'bahdanau',    label:'Attention Mechanism',                  short:'Bahdanau, Cho, Bengio 2014 — dynamic alignment breaks the bottleneck',                           era:'2010–14',         col:10, row:6, stream:'neuro' },
    { id:'cross_ling',  label:'Cross-Lingual Embeddings',            short:'Mikolov 2013, Conneau 2018, Smith 2017 — one geometry across languages',                         era:'2010–14',         col:10, row:7, stream:'language' },
    { id:'christiano',  label:'RLHF Conceived',                      short:'Christiano et al. 2017 — Deep RL from Human Preferences',                                       era:'2010–14',         col:10, row:9, stream:'culture' },
    { id:'bitter',      label:'The Bitter Lesson',                    short:'Sutton 2019 — "general methods that leverage computation are ultimately the most effective"',  era:'2010–14',         col:10, row:0, stream:'culture' },
    { id:'batchnorm',   label:'Batch Normalization',                   short:'Ioffe & Szegedy 2015 — stabilize activations during training',                                  era:'2010–14',         col:10, row:4, stream:'training' },
    { id:'gan',         label:'GANs',                                   short:'Goodfellow 2014 — generator vs discriminator, adversarial training',                              era:'2010–14',         col:10, row:8, stream:'neuro' },
    { id:'scaling',     label:'Scaling Laws',                           short:'Kaplan et al. 2020 — loss ∝ N^α · D^β · C^γ, predictable improvement',                           era:'2010–14',         col:10, row:9, stream:'neuro' },

    // ── Col 11: 2015–2018 ──
    { id:'resnet',      label:'ResNet / Skip Connections',              short:'He et al. 2015 — residual stream, gradient superhighway, 152 layers',                              era:'2015–18',         col:11, row:3, stream:'neuro' },
    { id:'layernorm',   label:'Layer Normalization',                    short:'Ba, Kiros, Hinton 2016 — stable activations across sequence positions',                             era:'2015–18',         col:11, row:2, stream:'training' },
    { id:'sennrich',    label:'Subword NMT / BPE',                     short:'Sennrich, Haddow, Birch 2016 — BPE for neural machine translation',                                 era:'2015–18',         col:11, row:5, stream:'language' },
    { id:'elmo',        label:'ELMo',                                    short:'Peters et al. 2018 — deep contextualized word representations',                                     era:'2015–18',         col:11, row:6, stream:'language' },
    { id:'transformer', label:'Transformer',                             short:'Vaswani et al. 2017 — "Attention Is All You Need", multi-head self-attention',                      era:'2015–18',         col:11, row:4, stream:'neuro' },
    { id:'moe',         label:'Mixture of Experts',                      short:'Shazeer et al. 2017 — sparsely-gated MoE, conditional computation',                                 era:'2015–18',         col:11, row:1, stream:'neuro' },
    { id:'bert',        label:'BERT',                                    short:'Devlin et al. 2018 — bidirectional encoder, masked language modeling',                               era:'2015–18',         col:11, row:7, stream:'neuro' },
    { id:'gpt1',        label:'GPT-1',                                   short:'Radford et al. 2018 — "Improving Language Understanding by Generative Pre-Training"',                era:'2015–18',         col:11, row:8, stream:'neuro' },
    { id:'conneau',     label:'Cross-Lingual MUSE',                      short:'Conneau et al. 2018 — word translation without parallel data',                                       era:'2015–18',         col:11, row:9, stream:'language' },
    { id:'hubel_wiesel',label:'Hubel & Wiesel',                          short:'1962 — simple/complex cells in cat visual cortex → inspiration for CNNs',                            era:'2015–18',         col:11, row:0, stream:'neuro' },

    // ── Col 12: 2019–2021 ──
    { id:'gpt2',        label:'GPT-2',                                   short:'Radford et al. 2019 — "Language Models are Unsupervised Multitask Learners", too dangerous to release', era:'2019–21',      col:12, row:3, stream:'neuro' },
    { id:'gpt3',        label:'GPT-3',                                   short:'Brown et al. 2020 — 175B parameters, few-shot learning, in-context learning',                        era:'2019–21',       col:12, row:4, stream:'neuro' },
    { id:'circuits',    label:'Transformer Circuits',                    short:'Elhage et al. 2021 — "A Mathematical Framework for Transformer Circuits"',                            era:'2019–21',       col:12, row:2, stream:'neuro' },
    { id:'induction',   label:'Induction Heads',                         short:'Olsson et al. 2022 — in-context learning via [A][B]…[A] → [B] pattern matching',                     era:'2019–21',       col:12, row:1, stream:'neuro' },
    { id:'superposition',label:'Superposition',                          short:'Elhage et al. 2022 — "Toy Models of Superposition": more features than dimensions',                   era:'2019–21',       col:12, row:5, stream:'neuro' },
    { id:'stochastic_p',label:'Stochastic Parrots',                     short:'Bender, Gebru et al. 2021 — "Can Language Models Be Too Big? 🦜"',                                    era:'2019–21',       col:12, row:8, stream:'culture' },
    { id:'instructgpt', label:'InstructGPT / RLHF',                     short:'Ouyang et al. 2022 — training language models to follow instructions with human feedback',              era:'2019–21',       col:12, row:6, stream:'neuro' },
    { id:'ffn_kv',      label:'FFN as Key-Value Memory',                short:'Geva et al. 2020 — "Transformer Feed-Forward Layers Are Key-Value Memories"',                          era:'2019–21',       col:12, row:7, stream:'neuro' },
    { id:'poincare',    label:'Poincaré Embeddings',                    short:'Nickel & Kiela 2017 — hyperbolic geometry for hierarchical representations',                            era:'2019–21',       col:12, row:9, stream:'math' },
    { id:'grokking',    label:'Grokking',                                short:'Power et al. 2022 — generalization long after overfitting, phase transitions in learning',             era:'2019–21',       col:12, row:0, stream:'neuro' },

    // ── Col 13: 2022–2023 ──
    { id:'chatgpt',     label:'ChatGPT',                                 short:'Nov 30, 2022 — conversational AI for everyone, 100M users in 2 months',                               era:'2022–23',       col:13, row:4, stream:'neuro' },
    { id:'golden_gate', label:'Golden Gate Claude',                      short:'Templeton et al. 2024 — feature steering: "I am the Golden Gate Bridge"',                              era:'2022–23',       col:13, row:2, stream:'neuro' },
    { id:'sparse_auto', label:'Sparse Autoencoders',                    short:'Cunningham et al. 2023 — finding interpretable features in language models',                             era:'2022–23',       col:13, row:3, stream:'neuro' },
    { id:'sleeper',     label:'Sleeper Agents',                          short:'Hubinger et al. 2024 — deceptive LLMs that persist through safety training',                           era:'2022–23',       col:13, row:5, stream:'culture' },
    { id:'reversal',    label:'Reversal Curse',                          short:'Berglund et al. 2023 — LLMs trained on "A is B" fail to learn "B is A"',                               era:'2022–23',       col:13, row:6, stream:'neuro' },
    { id:'model_collapse',label:'Model Collapse',                       short:'Shumailov et al. 2023 — training on generated data makes models forget',                                era:'2022–23',       col:13, row:7, stream:'culture' },
    { id:'truth_decay', label:'Truth Decay / Deepfakes',                short:'Kavanagh 2018, Chesney 2019, Spring 2024 — epistemic crisis',                                           era:'2022–23',       col:13, row:8, stream:'culture' },
    { id:'water',       label:'AI Environmental Cost',                   short:'Li et al. 2023 — GPT-3 training: 700k liters of water, energy of 120 US homes/year',                   era:'2022–23',       col:13, row:9, stream:'culture' },
    { id:'glitch',      label:'Glitch Tokens',                           short:'Zhou et al. 2024 — anomalous tokens that break model behavior',                                        era:'2022–23',       col:13, row:1, stream:'neuro' },

    // ── Col 14: Now & Branches ──
    { id:'mechinterp',  label:'Mechanistic Interpretability',           short:'Olah, Elhage, Nanda et al. — circuits, features, superposition, polysemanticity',                       era:'Now & Beyond',  col:14, row:3, stream:'neuro' },
    { id:'platonic',    label:'Platonic Representations',               short:'Huh et al. 2024 — all models converge toward one geometry of reality',                                   era:'Now & Beyond',  col:14, row:4, stream:'neuro' },
    { id:'geometry_truth',label:'Geometry of Truth',                    short:'Marks 2024 — emergent linear structure in LLM representations of true/false',                             era:'Now & Beyond',  col:14, row:5, stream:'neuro' },
    { id:'robotics',    label:'Robotics',                                short:'Embodied intelligence — a different tributary from the same river',                                      era:'Now & Beyond',  col:14, row:0, stream:'hardware' },
    { id:'crypto',      label:'Cryptography',                            short:'Turing → Thompson 1984 → modern crypto — trust in computation',                                         era:'Now & Beyond',  col:14, row:1, stream:'logic' },
    { id:'compbio',     label:'Computational Biology',                   short:'Statistics + computation → genomics, protein folding, drug discovery',                                   era:'Now & Beyond',  col:14, row:2, stream:'stats' },
    { id:'diffusion',   label:'Diffusion Models',                        short:'Image/video/audio generation — a sibling architecture from the same math',                               era:'Now & Beyond',  col:14, row:6, stream:'neuro' },
    { id:'alignment',   label:'AI Alignment',                            short:'Bostrom 2003/2012, Christiano 2017 — the control problem',                                              era:'Now & Beyond',  col:14, row:7, stream:'culture' },
    { id:'acult',       label:'AI in Culture & Ethics',                  short:'Crawford 2021, O\'Neil 2016, Frankfurt 2005 — power, bias, bullshit',                                   era:'Now & Beyond',  col:14, row:8, stream:'culture' },
    { id:'tpu',         label:'AI Accelerators / TPUs',                  short:'Custom silicon for matrix multiply — the hardware lottery (Hooker 2020)',                                 era:'Now & Beyond',  col:14, row:9, stream:'hardware' },
    { id:'geometric_dl',label:'Geometric Deep Learning',                short:'Bronstein et al. 2021 — grids, groups, graphs, geodesics, gauges',                                       era:'Now & Beyond',  col:14, row:1.5, stream:'math' },
  ];

  /* ═══════════════════════════════════════════════════════
     EDGES
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
    { from:'adam', to:'transformer', stream:'training' },
    { from:'poincare', to:'geometric_dl', stream:'math' },

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
    { from:'moore', to:'cuda', stream:'hardware' },
    { from:'cuda', to:'alexnet', stream:'hardware' },
    { from:'cuda', to:'tpu', stream:'hardware' },
    { from:'arpanet', to:'www', stream:'hardware' },
    { from:'fiber', to:'arpanet', stream:'hardware' },
    { from:'torch', to:'alexnet', stream:'hardware' },

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
    { from:'kolmogorov', to:'shannon', stream:'stats' },
    { from:'glm', to:'bengio_nlm', stream:'stats' },

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

    // ── Training & Optimization ──
    { from:'sgd', to:'adam', stream:'training' },
    { from:'relu', to:'alexnet', stream:'training' },
    { from:'batchnorm', to:'resnet', stream:'training' },
    { from:'layernorm', to:'transformer', stream:'training' },
    { from:'dropout', to:'alexnet', stream:'training' },

    // ── Language ──
    { from:'language0', to:'writing', stream:'language' },
    { from:'cave', to:'writing', stream:'culture' },
    { from:'writing', to:'panini', stream:'language' },
    { from:'panini', to:'saussure', stream:'language' },
    { from:'saussure', to:'chomsky', stream:'language' },
    { from:'chomsky', to:'firth', stream:'language' },
    { from:'firth', to:'harris', stream:'language' },
    { from:'harris', to:'bengio_nlm', stream:'language' },
    { from:'word2vec', to:'cross_ling', stream:'language' },
    { from:'cross_ling', to:'conneau', stream:'language' },
    { from:'word2vec', to:'bahdanau', stream:'language' },
    { from:'bpe', to:'sennrich', stream:'language' },
    { from:'sennrich', to:'transformer', stream:'language' },
    { from:'jelinek', to:'bengio_nlm', stream:'language' },
    { from:'elmo', to:'bert', stream:'language' },

    // ── Culture ──
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
  ];

  /* ═══════════════════════════════════════════════════════
     RENDERING ENGINE
     ═══════════════════════════════════════════════════════ */
  const svg = document.getElementById('river-svg');
  const tooltip = document.getElementById('river-tooltip');
  const container = document.getElementById('river-container');

  const COLS = 15, ROWS = 10;
  const PAD = { top: 36, bottom: 28, left: 50, right: 50 };
  const NODE_R = 16;

  function calcSize() {
    const w = Math.max(1000, container.clientWidth - 16);
    const h = Math.max(620, ROWS * 78 + PAD.top + PAD.bottom);
    return { w, h };
  }
  function colX(col) {
    const { w } = calcSize();
    return PAD.left + (col / (COLS - 1)) * (w - PAD.left - PAD.right);
  }
  function rowY(row) {
    const { h } = calcSize();
    return PAD.top + (row / (ROWS - 1)) * (h - PAD.top - PAD.bottom);
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
      <filter id="text-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#000" flood-opacity="0.9"/>
      </filter>`;
    svg.appendChild(defs);

    // ── Era bands ──
    const eras = [...new Set(NODES.map(n => n.era))];
    const eraColRanges = {};
    NODES.forEach(n => {
      if (!eraColRanges[n.era]) eraColRanges[n.era] = [n.col, n.col];
      eraColRanges[n.era][0] = Math.min(eraColRanges[n.era][0], n.col);
      eraColRanges[n.era][1] = Math.max(eraColRanges[n.era][1], n.col);
    });
    let eraIdx = 0;
    for (const era of eras) {
      const [c0, c1] = eraColRanges[era];
      const gap = (colX(1) - colX(0)) * 0.45;
      const x0 = colX(c0) - gap;
      const x1 = colX(c1) + gap;
      const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
      rect.setAttribute('x', x0);
      rect.setAttribute('y', 0);
      rect.setAttribute('width', x1 - x0);
      rect.setAttribute('height', h);
      rect.setAttribute('fill', eraIdx % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'rgba(255,255,255,0.025)');
      svg.appendChild(rect);

      // Era label at bottom
      const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
      txt.setAttribute('x', (x0 + x1) / 2);
      txt.setAttribute('y', h - 8);
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('fill', 'rgba(143,168,200,0.22)');
      txt.setAttribute('font-size', '9');
      txt.setAttribute('font-family', 'inherit');
      txt.textContent = era;
      svg.appendChild(txt);
      eraIdx++;
    }

    // ── Edges ──
    EDGES.forEach(e => {
      const from = nodeById(e.from);
      const to = nodeById(e.to);
      if (!from || !to) return;
      const x1 = colX(from.col), y1 = rowY(from.row);
      const x2 = colX(to.col),   y2 = rowY(to.row);
      const mx = (x1 + x2) / 2;
      const dy = (y2 - y1) * 0.15;
      const d = `M${x1},${y1} C${mx},${y1 + dy} ${mx},${y2 - dy} ${x2},${y2}`;
      const color = STREAMS[e.stream]?.color || '#555';

      // Glow
      const glow = document.createElementNS('http://www.w3.org/2000/svg','path');
      glow.setAttribute('d', d);
      glow.setAttribute('fill', 'none');
      glow.setAttribute('stroke', color);
      glow.setAttribute('stroke-width', '4.5');
      glow.setAttribute('opacity', '0.10');
      glow.setAttribute('filter', 'url(#glow)');
      svg.appendChild(glow);

      // Line
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '1.6');
      path.setAttribute('opacity', '0.38');
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
    });

    // ── Nodes ──
    NODES.forEach(n => {
      const cx = colX(n.col), cy = rowY(n.row);
      const color = STREAMS[n.stream]?.color || '#aaa';

      const g = document.createElementNS('http://www.w3.org/2000/svg','g');
      g.setAttribute('class', 'river-node');
      g.style.cursor = n.divId ? 'pointer' : 'default';

      // Outer glow
      const cGlow = document.createElementNS('http://www.w3.org/2000/svg','circle');
      cGlow.setAttribute('cx', cx);
      cGlow.setAttribute('cy', cy);
      cGlow.setAttribute('r', NODE_R + 3);
      cGlow.setAttribute('fill', color);
      cGlow.setAttribute('opacity', '0.06');
      cGlow.setAttribute('filter', 'url(#glow-strong)');
      g.appendChild(cGlow);

      // Main circle
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx', cx);
      c.setAttribute('cy', cy);
      c.setAttribute('r', NODE_R);
      c.setAttribute('fill', '#0a0e18');
      c.setAttribute('stroke', color);
      c.setAttribute('stroke-width', '1.8');
      g.appendChild(c);

      // Label — multiline for long labels
      const label = n.label;
      const maxChars = 13;
      const lines = [];
      if (label.length <= maxChars) {
        lines.push(label);
      } else {
        const words = label.split(/[\s/]+/);
        let cur = '';
        for (const w of words) {
          if ((cur + ' ' + w).trim().length > maxChars && cur) {
            lines.push(cur);
            cur = w;
          } else {
            cur = cur ? cur + ' ' + w : w;
          }
        }
        if (cur) lines.push(cur);
        // Max 2 lines
        if (lines.length > 2) {
          lines.length = 2;
          lines[1] = lines[1].slice(0, 10) + '…';
        }
      }

      const textGroup = document.createElementNS('http://www.w3.org/2000/svg','text');
      textGroup.setAttribute('x', cx);
      textGroup.setAttribute('text-anchor', 'middle');
      textGroup.setAttribute('fill', color);
      textGroup.setAttribute('font-size', '6.8');
      textGroup.setAttribute('font-weight', '600');
      textGroup.setAttribute('filter', 'url(#text-shadow)');
      textGroup.setAttribute('font-family', 'inherit');

      lines.forEach((line, i) => {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg','tspan');
        tspan.setAttribute('x', cx);
        const baseY = cy - ((lines.length - 1) * 4);
        tspan.setAttribute('y', baseY + i * 8.5);
        tspan.textContent = line;
        textGroup.appendChild(tspan);
      });
      g.appendChild(textGroup);

      // ── Interaction ──
      g.addEventListener('mouseenter', (ev) => {
        c.setAttribute('r', NODE_R + 3);
        c.setAttribute('stroke-width', '2.8');
        cGlow.setAttribute('opacity', '0.3');
        showTooltip(ev, n);
        highlightConnected(n.id);
      });
      g.addEventListener('mousemove', (ev) => {
        positionTooltip(ev, n);
      });
      g.addEventListener('mouseleave', () => {
        c.setAttribute('r', NODE_R);
        c.setAttribute('stroke-width', '1.8');
        cGlow.setAttribute('opacity', '0.06');
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
  }

  /* ═══════════════════════════════════════════════════════
     TOOLTIP — smart edge-aware positioning
     ═══════════════════════════════════════════════════════ */
  function positionTooltip(ev, node) {
    const rect = container.getBoundingClientRect();
    const ttW = 300; // max-width
    const ttH = 120; // approx height
    const gap = 18;

    let x = ev.clientX - rect.left + gap;
    let y = ev.clientY - rect.top - gap;

    // Flip left if overflows right
    if (x + ttW > container.clientWidth - 12) {
      x = ev.clientX - rect.left - ttW - gap;
    }
    // Clamp left
    if (x < 8) x = 8;

    // Flip up if overflows bottom
    if (y + ttH > container.clientHeight - 12) {
      y = ev.clientY - rect.top - ttH - gap;
    }
    // Clamp top
    if (y < 8) y = 8;

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  function showTooltip(ev, node) {
    const color = STREAMS[node.stream]?.color || '#555';
    tooltip.querySelector('.tt-era').textContent = node.era;
    tooltip.querySelector('.tt-title').textContent = node.label;
    tooltip.querySelector('.tt-title').style.color = color;
    tooltip.querySelector('.tt-body').textContent = node.short;
    tooltip.querySelector('.tt-click').textContent = node.divId
      ? '⤷ Click to jump to this section'
      : '';
    tooltip.style.borderColor = color;
    tooltip.style.opacity = '1';
    positionTooltip(ev, node);
  }

  function hideTooltip() {
    tooltip.style.opacity = '0';
  }

  /* ═══════════════════════════════════════════════════════
     HIGHLIGHT — connected edges + neighbor nodes on hover
     ═══════════════════════════════════════════════════════ */
  function highlightConnected(nodeId) {
    // Find connected edges
    const connectedEdges = new Set();
    const connectedNodes = new Set([nodeId]);
    EDGES.forEach((e, i) => {
      if (e.from === nodeId || e.to === nodeId) {
        connectedEdges.add(i);
        connectedNodes.add(e.from);
        connectedNodes.add(e.to);
      }
    });

    // Dim all edges, brighten connected
    const paths = svg.querySelectorAll('path');
    let pathIdx = 0;
    EDGES.forEach((e, i) => {
      const glow = paths[pathIdx];
      const main = paths[pathIdx + 1];
      if (connectedEdges.has(i)) {
        if (glow) { glow.setAttribute('opacity', '0.45'); glow.setAttribute('stroke-width', '7'); }
        if (main) { main.setAttribute('opacity', '0.95'); main.setAttribute('stroke-width', '3'); }
      } else {
        if (glow) glow.setAttribute('opacity', '0.02');
        if (main) main.setAttribute('opacity', '0.08');
      }
      pathIdx += 2;
    });

    // Dim non-connected nodes
    const nodeGroups = svg.querySelectorAll('.river-node');
    nodeGroups.forEach((g, i) => {
      if (i < NODES.length) {
        const n = NODES[i];
        if (!connectedNodes.has(n.id)) {
          g.style.opacity = '0.2';
        } else {
          g.style.opacity = '1';
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
      if (glow) { glow.setAttribute('opacity', '0.10'); glow.setAttribute('stroke-width', '4.5'); }
      if (main) { main.setAttribute('opacity', '0.38'); main.setAttribute('stroke-width', '1.6'); }
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
      sp.innerHTML = `<span class="swatch" style="background:${s.color}; box-shadow: 0 0 6px ${s.color}"></span>${s.label}`;
      leg.appendChild(sp);
    }
  }

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */
  draw();
  buildLegend();

  // Redraw on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(draw, 150);
  });

  /* ═══════════════════════════════════════════════════════
     OPTIONAL: Scroll-based active node highlighting
     If you add `divId: 'your-section-id'` to any NODE,
     it will pulse when that section is in the viewport.
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
