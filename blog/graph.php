<!-- ============================================================
     RIVER OF IDEAS — Interactive Throughline Visualization v2
     Fixes: tooltip clipping, comprehensive content coverage
     ============================================================ -->
<style>
  #river-container {
    position: relative;
    width: 100%;
    max-width: 1200px;
    margin: 2rem auto;
    background: linear-gradient(180deg, #0a0e1a 0%, #0f1b2d 40%, #0a0e1a 100%);
    border-radius: 16px;
    padding: 2rem 1rem 3rem 1rem;
    overflow: hidden; /* changed from overflow-x:auto */
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #c8d6e5;
    box-shadow: 0 0 40px rgba(0,120,255,0.08);
  }
  #river-container h2 {
    text-align: center;
    font-size: 1.5rem;
    letter-spacing: 0.04em;
    margin-bottom: 0.2rem;
    color: #7ec8e3;
  }
  #river-container .subtitle {
    text-align: center;
    font-size: 0.85rem;
    opacity: 0.55;
    margin-bottom: 1.5rem;
    font-style: italic;
  }
  #river-svg { width: 100%; height: auto; display: block; }

  /* Tooltip — now with smart positioning */
  #river-tooltip {
    position: absolute;
    pointer-events: none;
    background: rgba(10,14,26,0.96);
    border: 1px solid rgba(126,200,227,0.35);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 0.82rem;
    line-height: 1.45;
    max-width: 280px;
    width: max-content;
    opacity: 0;
    transition: opacity 0.18s;
    z-index: 100;
    box-shadow: 0 4px 24px rgba(0,0,0,0.6);
  }
  #river-tooltip .tt-title {
    font-weight: 700; color: #7ec8e3;
    margin-bottom: 4px; font-size: 0.9rem;
  }
  #river-tooltip .tt-era {
    font-size: 0.72rem; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.06em;
    margin-bottom: 3px;
  }
  #river-tooltip .tt-body { color: #a0b4c8; }

  /* Legend */
  #river-legend {
    display: flex; flex-wrap: wrap; justify-content: center;
    gap: 14px; margin-top: 1rem; font-size: 0.75rem; opacity: 0.7;
  }
  #river-legend span { display: flex; align-items: center; gap: 5px; }
  #river-legend .swatch {
    width: 12px; height: 12px; border-radius: 50%; display: inline-block;
  }

  @keyframes pulse-glow {
    0%, 100% { filter: drop-shadow(0 0 4px rgba(126,200,227,0.4)); }
    50%      { filter: drop-shadow(0 0 14px rgba(126,200,227,0.9)); }
  }
  .river-node-active { animation: pulse-glow 2s ease-in-out infinite; }

  @media (max-width: 700px) {
    #river-container { padding: 1rem 0.3rem 2rem 0.3rem; }
    #river-container h2 { font-size: 1.15rem; }
  }
</style>

<div id="river-container">
  <h2>🌊 The River of Ideas</h2>
  <div class="subtitle">πάντα ῥεῖ — everything flows · each generation traded specificity for generality</div>
  <svg id="river-svg"></svg>
  <div id="river-tooltip">
    <div class="tt-era"></div>
    <div class="tt-title"></div>
    <div class="tt-body"></div>
  </div>
  <div id="river-legend"></div>
</div>

<script>
(() => {
  /* ═══════════════════════════════════════════════════════
     STREAMS — the colored rivers
     ═══════════════════════════════════════════════════════ */
  const STREAMS = {
    math:     { color: '#f7b731', label: 'Mathematics' },
    logic:    { color: '#a55eea', label: 'Logic & Computation' },
    hardware: { color: '#eb3b5a', label: 'Hardware & Engineering' },
    stats:    { color: '#20bf6b', label: 'Statistics & Data' },
    neuro:    { color: '#3867d6', label: 'Neuroscience & AI' },
    language: { color: '#fa8231', label: 'Language & Linguistics' },
    culture:  { color: '#778ca3', label: 'Culture & Philosophy' },
    acti:     { color: '#45aaf2', label: 'Activation & Training' },
  };

  /* ═══════════════════════════════════════════════════════
     NODES — comprehensive, from your document
     col = time axis (0–14), row = lane (0–8)
     ═══════════════════════════════════════════════════════ */
  const NODES = [
    // Col 0 — Prehistoric
    { id:'tally',      label:'Tally Bones',            short:'~40,000 BCE — Lebombo & Ishango bones: first external memory',                     era:'Prehistoric',    col:0, row:1, stream:'math' },
    { id:'language0',  label:'Proto-Language',           short:'~135,000 BCE — symbolic displacement, descended larynx',                          era:'Prehistoric',    col:0, row:6, stream:'language' },
    { id:'cave',       label:'Cave Art & Symbols',       short:'Blombos ochre ~75,000 BCE — first abstract symbolic thought',                     era:'Prehistoric',    col:0, row:7, stream:'culture' },

    // Col 1 — Ancient
    { id:'abacus',     label:'Abacus / Salamis',         short:'~300 BCE — spatial abstraction of arithmetic',                                    era:'Ancient',        col:1, row:1, stream:'math' },
    { id:'euclid',     label:"Euclid's Elements",        short:'~300 BCE — axiomatic method, formal proof',                                      era:'Ancient',        col:1, row:2, stream:'logic' },
    { id:'aristotle',  label:'Aristotle / Syllogisms',   short:'Formal deductive logic — structure decoupled from content',                       era:'Ancient',        col:1, row:3, stream:'logic' },
    { id:'antikythera',label:'Antikythera Mechanism',     short:'~200 BCE — first analog computer, mechanical simulation',                        era:'Ancient',        col:1, row:4, stream:'hardware' },
    { id:'writing',    label:'Writing Systems',           short:'Cuneiform ~3200 BCE → Phoenician → Greek vowels → alphabet',                     era:'Ancient',        col:1, row:6, stream:'language' },
    { id:'panini',     label:'Pāṇini / Grammar',         short:'~4th c. BCE — Ashtadhyayi: first formal generative grammar',                     era:'Ancient',        col:1, row:7, stream:'language' },

    // Col 2 — Medieval
    { id:'algebra',    label:'Al-Khwarizmi / Algebra',   short:'~820 CE — "algorithm" is born',                                                  era:'Medieval',       col:2, row:1, stream:'math' },
    { id:'llull',      label:"Llull's Ars Magna",        short:'1305 — combinatorial reasoning machine, proto-AI',                                era:'Medieval',       col:2, row:3, stream:'logic' },
    { id:'printing',   label:'Printing Press',            short:'1440 — mass replication of knowledge',                                           era:'Medieval',       col:2, row:7, stream:'culture' },

    // Col 3 — Enlightenment
    { id:'calculus',   label:'Calculus',                  short:'Newton & Leibniz — abstraction of change itself',                                 era:'Enlightenment',  col:3, row:0, stream:'math' },
    { id:'probability',label:'Probability Theory',        short:'Pascal, Fermat, Bayes — the math of uncertainty',                                era:'Enlightenment',  col:3, row:2, stream:'stats' },
    { id:'leibniz',    label:'Leibniz Calculus Ratiocinator', short:'"Calculemus!" — dream of universal reasoning machine',                       era:'Enlightenment',  col:3, row:3, stream:'logic' },
    { id:'loom',       label:'Jacquard Loom',             short:'1804 — punch-card programming, first programmable input',                        era:'Enlightenment',  col:3, row:4, stream:'hardware' },
    { id:'napier',     label:'Napier / Logarithms',       short:'1614 — multiplication by addition, doubled the astronomer\'s life',               era:'Enlightenment',  col:3, row:1, stream:'math' },

    // Col 4 — 19th Century
    { id:'gauss',      label:'Gauß / Least Squares',      short:'1809 — Normal Distribution, abstraction of uncertainty',                         era:'19th C',         col:4, row:2, stream:'stats' },
    { id:'boole',      label:"Boole's Algebra",           short:'1854 — logic becomes mathematics, origin of "boolean"',                          era:'19th C',         col:4, row:3, stream:'logic' },
    { id:'babbage',    label:'Babbage & Lovelace',        short:'Analytical Engine — "weaves algebraic patterns"',                                era:'19th C',         col:4, row:4, stream:'hardware' },
    { id:'saussure',   label:'Saussure / Linguistics',    short:'Arbitrariness of the sign, language as system of differences',                   era:'19th C',         col:4, row:6, stream:'language' },
    { id:'cajal',      label:'Cajal / Neuron Doctrine',   short:'1906 Nobel — brain is discrete cells, not continuous web',                       era:'19th C',         col:4, row:5, stream:'neuro' },
    { id:'galton',     label:'Galton / Regression',       short:'1886 — regression to the mean, foundation of linear models',                     era:'19th C',         col:4, row:1, stream:'stats' },
    { id:'electricity',label:'Faraday / Tesla / AC',      short:'Electromagnetic induction → AC power grid → data centers',                       era:'19th C',         col:4, row:8, stream:'hardware' },

    // Col 5 — Early 20th C
    { id:'hilbert',    label:"Hilbert's Program",         short:'Formalize all of mathematics',                                                   era:'Early 20th C',   col:5, row:1, stream:'math' },
    { id:'godel',      label:"Gödel's Incompleteness",    short:'1931 — limits of formal systems',                                                era:'Early 20th C',   col:5, row:2, stream:'logic' },
    { id:'turing',     label:'Turing Machine',            short:'1936 — universal computation, the Imitation Game',                                era:'Early 20th C',   col:5, row:3, stream:'logic' },
    { id:'shannon',    label:'Shannon / Info Theory',     short:'1948 — abstraction of information, entropy, n-grams',                             era:'Early 20th C',   col:5, row:4, stream:'stats' },
    { id:'mcculloch',  label:'McCulloch-Pitts Neuron',    short:'1943 — first mathematical neuron model',                                         era:'Early 20th C',   col:5, row:5, stream:'neuro' },
    { id:'frege',      label:'Frege & Russell',           short:'Symbolic logic — thinking as manipulation of symbols',                            era:'Early 20th C',   col:5, row:6, stream:'logic' },
    { id:'transistor', label:'Transistor',                 short:'1948 — quantum mechanics → semiconductor → digital age',                         era:'Early 20th C',   col:5, row:8, stream:'hardware' },

    // Col 6 — Mid 20th C
    { id:'perceptron', label:'Perceptron',                 short:'Rosenblatt 1958 — first learning machine, connectionism',                        era:'Mid 20th C',     col:6, row:3, stream:'neuro' },
    { id:'chomsky',    label:'Chomsky Hierarchy',          short:'1956 — formal grammars, generative linguistics',                                 era:'Mid 20th C',     col:6, row:6, stream:'language' },
    { id:'vonneumann', label:'Von Neumann Architecture',   short:'1945 — stored-program concept, data = instructions',                             era:'Mid 20th C',     col:6, row:4, stream:'hardware' },
    { id:'zuse',       label:'Zuse Z1–Z3',                 short:'1937–41 — first binary programmable computers',                                  era:'Mid 20th C',     col:6, row:8, stream:'hardware' },
    { id:'dartmouth',  label:'"Artificial Intelligence"',  short:'1956 — McCarthy coins the term at Dartmouth',                                    era:'Mid 20th C',     col:6, row:5, stream:'neuro' },
    { id:'snarc',      label:'SNARC',                      short:'1951 — Minsky\'s first physical neural network, 40 neurons',                     era:'Mid 20th C',     col:6, row:2, stream:'neuro' },
    { id:'eliza',      label:'ELIZA',                      short:'1966 — Weizenbaum\'s chatbot, the ELIZA effect',                                 era:'Mid 20th C',     col:6, row:7, stream:'culture' },

    // Col 7 — Late 20th C (1970s–80s)
    { id:'minsky_xor', label:'Minsky / XOR Crisis',       short:'1969 — Perceptrons can\'t solve XOR → First AI Winter',                          era:'1970s–80s',      col:7, row:2, stream:'neuro' },
    { id:'autodiff',   label:'Automatic Differentiation',  short:'Linnainmaa 1976 — reverse-mode AD, backbone of backprop',                       era:'1970s–80s',      col:7, row:1, stream:'math' },
    { id:'backprop',   label:'Backpropagation',            short:'Rumelhart 1986 — abstraction of blame via chain rule',                           era:'1970s–80s',      col:7, row:3, stream:'neuro' },
    { id:'neocognitron',label:'Neocognitron',              short:'Fukushima 1980 — hierarchical vision inspired by visual cortex',                 era:'1970s–80s',      col:7, row:4, stream:'neuro' },
    { id:'lstm',       label:'LSTM',                       short:'Hochreiter & Schmidhuber 1997 — gated memory, vanishing gradient fix',           era:'1970s–80s',      col:7, row:5, stream:'neuro' },
    { id:'firth',      label:'Firth / Distributional',     short:'"You shall know a word by the company it keeps"',                                era:'1970s–80s',      col:7, row:6, stream:'language' },
    { id:'arpanet',    label:'ARPANET → Internet',         short:'1969–1983 — TCP/IP, the physical substrate of training data',                    era:'1970s–80s',      col:7, row:8, stream:'hardware' },

    // Col 8 — 1990s–2000s
    { id:'lenet',      label:'LeNet-5 / CNNs',             short:'LeCun 1998 — convolutions + backprop for vision',                                era:'1990s–2000s',    col:8, row:3, stream:'neuro' },
    { id:'deepblue',   label:'Deep Blue',                  short:'1997 — symbolic AI beats Kasparov, peak of hand-crafted logic',                  era:'1990s–2000s',    col:8, row:2, stream:'logic' },
    { id:'bengio_nlm', label:'Neural Prob. Language Model', short:'Bengio 2003 — word embeddings, curse of dimensionality',                        era:'1990s–2000s',    col:8, row:5, stream:'neuro' },
    { id:'www',        label:'World Wide Web',              short:'Berners-Lee 1989 — self-assembling corpus of human thought',                    era:'1990s–2000s',    col:8, row:8, stream:'culture' },
    { id:'bpe',        label:'BPE Tokenization',            short:'Gage 1994 → Sennrich 2016 — subword units solve OOV',                           era:'1990s–2000s',    col:8, row:6, stream:'language' },
    { id:'cuda',       label:'CUDA / GPUs',                 short:'NVIDIA 2007 — gamers\' hardware becomes AI\'s engine',                           era:'1990s–2000s',    col:8, row:7, stream:'hardware' },
    { id:'relu',       label:'ReLU Activation',             short:'Glorot 2011 — constant gradient, death of vanishing gradients',                  era:'1990s–2000s',    col:8, row:4, stream:'acti' },

    // Col 9 — 2010s
    { id:'alexnet',    label:'AlexNet / Deep Learning',    short:'2012 — GPU + CNN + ImageNet = revolution',                                      era:'2010s',          col:9, row:3, stream:'neuro' },
    { id:'word2vec',   label:'Word2Vec / Embeddings',      short:'Mikolov 2013 — king − man + woman ≈ queen',                                     era:'2010s',          col:9, row:5, stream:'language' },
    { id:'resnet',     label:'ResNet / Skip Connections',   short:'He 2015 — residual stream, gradient superhighway',                              era:'2010s',          col:9, row:4, stream:'neuro' },
    { id:'layernorm',  label:'Layer Normalization',         short:'Ba 2016 — stable activations, enables 100+ layer stacks',                       era:'2010s',          col:9, row:2, stream:'acti' },
    { id:'adam',       label:'Adam Optimizer',              short:'Kingma 2014 — adaptive per-parameter learning rates',                            era:'2010s',          col:9, row:1, stream:'math' },
    { id:'bahdanau',   label:'Attention Mechanism',         short:'Bahdanau 2014 — dynamic alignment breaks the bottleneck',                       era:'2010s',          col:9, row:6, stream:'neuro' },

    // Col 10 — Transformer era
    { id:'transformer',label:'Transformer',                short:'Vaswani 2017 — "Attention Is All You Need"',                                    era:'Transformer',    col:10, row:4, stream:'neuro' },
    { id:'bert',       label:'BERT',                        short:'2018 — bidirectional encoder, masked language modeling',                         era:'Transformer',    col:10, row:5, stream:'neuro' },
    { id:'gpt',        label:'GPT-1 → GPT-3',              short:'Decoder-only, autoregressive, scaling transforms everything',                    era:'Transformer',    col:10, row:3, stream:'neuro' },
    { id:'rlhf',       label:'RLHF / Alignment',            short:'Christiano 2017 → InstructGPT — taming the stochastic parrot',                  era:'Transformer',    col:10, row:6, stream:'culture' },

    // Col 11 — Now & Branches
    { id:'chatgpt',    label:'ChatGPT',                     short:'Nov 2022 — conversational AI for everyone',                                     era:'Now',            col:11, row:4, stream:'neuro' },
    { id:'mechinterp', label:'Mechanistic Interpretability', short:'Elhage 2021+ — circuits, superposition, polysemanticity',                       era:'Now',            col:11, row:3, stream:'neuro' },
    { id:'platonic',   label:'Platonic Representations',     short:'Huh 2024 — all models converge to one geometry of reality',                     era:'Now',            col:11, row:5, stream:'neuro' },

    // Branches that DON'T lead to LLMs
    { id:'robotics',   label:'Robotics',                     short:'Embodied intelligence — a different tributary',                                  era:'Now',            col:11, row:0, stream:'hardware' },
    { id:'crypto',     label:'Cryptography',                 short:'Number theory → Turing → secure communication',                                 era:'Now',            col:11, row:1, stream:'math' },
    { id:'compbio',    label:'Computational Biology',        short:'Statistics + computation → genomics, drug discovery',                            era:'Now',            col:11, row:2, stream:'stats' },
    { id:'diffusion',  label:'Diffusion Models',             short:'Image/video generation — a sibling architecture',                                era:'Now',            col:11, row:6, stream:'neuro' },
    { id:'acult',      label:'AI in Culture & Ethics',       short:'Art, law, hallucinations, alignment, society',                                   era:'Now',            col:11, row:7, stream:'culture' },
    { id:'tpu',        label:'AI Accelerators / TPUs',       short:'Custom silicon for matrix multiply at scale',                                    era:'Now',            col:11, row:8, stream:'hardware' },
  ];

  /* ═══════════════════════════════════════════════════════
     EDGES — the connections between nodes
     ═══════════════════════════════════════════════════════ */
  const EDGES = [
    // Math stream
    { from:'tally', to:'abacus', stream:'math' },
    { from:'abacus', to:'algebra', stream:'math' },
    { from:'algebra', to:'calculus', stream:'math' },
    { from:'napier', to:'calculus', stream:'math' },
    { from:'calculus', to:'gauss', stream:'math' },
    { from:'calculus', to:'hilbert', stream:'math' },
    { from:'calculus', to:'autodiff', stream:'math' },
    { from:'galton', to:'gauss', stream:'stats' },
    { from:'hilbert', to:'godel', stream:'math' },
    { from:'autodiff', to:'backprop', stream:'math' },
    { from:'adam', to:'transformer', stream:'math' },

    // Logic stream
    { from:'euclid', to:'aristotle', stream:'logic' },
    { from:'aristotle', to:'llull', stream:'logic' },
    { from:'llull', to:'leibniz', stream:'logic' },
    { from:'leibniz', to:'boole', stream:'logic' },
    { from:'boole', to:'hilbert', stream:'logic' },
    { from:'boole', to:'turing', stream:'logic' },
    { from:'godel', to:'turing', stream:'logic' },
    { from:'frege', to:'turing', stream:'logic' },
    { from:'turing', to:'shannon', stream:'logic' },
    { from:'turing', to:'vonneumann', stream:'logic' },
    { from:'turing', to:'crypto', stream:'logic' },
    { from:'deepblue', to:'gpt', stream:'logic' },

    // Hardware stream
    { from:'antikythera', to:'loom', stream:'hardware' },
    { from:'loom', to:'babbage', stream:'hardware' },
    { from:'babbage', to:'zuse', stream:'hardware' },
    { from:'electricity', to:'transistor', stream:'hardware' },
    { from:'transistor', to:'vonneumann', stream:'hardware' },
    { from:'vonneumann', to:'cuda', stream:'hardware' },
    { from:'cuda', to:'alexnet', stream:'hardware' },
    { from:'cuda', to:'tpu', stream:'hardware' },
    { from:'cuda', to:'robotics', stream:'hardware' },
    { from:'arpanet', to:'www', stream:'hardware' },

    // Stats stream
    { from:'probability', to:'gauss', stream:'stats' },
    { from:'gauss', to:'shannon', stream:'stats' },
    { from:'shannon', to:'bengio_nlm', stream:'stats' },
    { from:'gauss', to:'compbio', stream:'stats' },

    // Neuro / AI stream
    { from:'cajal', to:'mcculloch', stream:'neuro' },
    { from:'mcculloch', to:'snarc', stream:'neuro' },
    { from:'mcculloch', to:'perceptron', stream:'neuro' },
    { from:'perceptron', to:'minsky_xor', stream:'neuro' },
    { from:'minsky_xor', to:'backprop', stream:'neuro' },
    { from:'backprop', to:'neocognitron', stream:'neuro' },
    { from:'backprop', to:'lstm', stream:'neuro' },
    { from:'neocognitron', to:'lenet', stream:'neuro' },
    { from:'lenet', to:'alexnet', stream:'neuro' },
    { from:'alexnet', to:'resnet', stream:'neuro' },
    { from:'resnet', to:'transformer', stream:'neuro' },
    { from:'lstm', to:'bahdanau', stream:'neuro' },
    { from:'bahdanau', to:'transformer', stream:'neuro' },
    { from:'bengio_nlm', to:'word2vec', stream:'neuro' },
    { from:'transformer', to:'bert', stream:'neuro' },
    { from:'transformer', to:'gpt', stream:'neuro' },
    { from:'gpt', to:'chatgpt', stream:'neuro' },
    { from:'chatgpt', to:'mechinterp', stream:'neuro' },
    { from:'chatgpt', to:'platonic', stream:'neuro' },
    { from:'alexnet', to:'diffusion', stream:'neuro' },
    { from:'alexnet', to:'robotics', stream:'neuro' },
    { from:'dartmouth', to:'perceptron', stream:'neuro' },

    // Activation & Training stream
    { from:'relu', to:'alexnet', stream:'acti' },
    { from:'layernorm', to:'transformer', stream:'acti' },

    // Language stream
    { from:'language0', to:'writing', stream:'language' },
    { from:'writing', to:'panini', stream:'language' },
    { from:'panini', to:'saussure', stream:'language' },
    { from:'saussure', to:'chomsky', stream:'language' },
    { from:'chomsky', to:'firth', stream:'language' },
    { from:'firth', to:'bengio_nlm', stream:'language' },
    { from:'word2vec', to:'bahdanau', stream:'language' },
    { from:'bpe', to:'transformer', stream:'language' },

    // Culture stream
    { from:'cave', to:'writing', stream:'culture' },
    { from:'printing', to:'babbage', stream:'culture' },
    { from:'eliza', to:'rlhf', stream:'culture' },
    { from:'www', to:'gpt', stream:'culture' },
    { from:'rlhf', to:'chatgpt', stream:'culture' },
    { from:'chatgpt', to:'acult', stream:'culture' },
  ];

  /* ═══════════════════════════════════════════════════════
     RENDERING
     ═══════════════════════════════════════════════════════ */
  const svg = document.getElementById('river-svg');
  const tooltip = document.getElementById('river-tooltip');
  const container = document.getElementById('river-container');

  const COLS = 12, ROWS = 9;
  const PAD = { top: 30, bottom: 24, left: 55, right: 55 };
  const NODE_R = 17;

  function calcSize() {
    const w = Math.max(950, container.clientWidth - 16);
    const h = Math.max(560, ROWS * 80 + PAD.top + PAD.bottom);
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

    // Defs
    const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    defs.innerHTML = `
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>`;
    svg.appendChild(defs);

    // Era bands
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
      const x0 = colX(c0) - 35;
      const x1 = colX(c1) + 35;
      const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
      rect.setAttribute('x', x0);
      rect.setAttribute('y', 0);
      rect.setAttribute('width', x1 - x0);
      rect.setAttribute('height', h);
      rect.setAttribute('fill', eraIdx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.03)');
      svg.appendChild(rect);

      const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
      txt.setAttribute('x', (x0 + x1) / 2);
      txt.setAttribute('y', h - 6);
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('fill', 'rgba(200,214,229,0.25)');
      txt.setAttribute('font-size', '10');
      txt.textContent = era;
      svg.appendChild(txt);
      eraIdx++;
    }

    // — Edges (curved rivers)
    EDGES.forEach(e => {
      const from = nodeById(e.from);
      const to = nodeById(e.to);
      if (!from || !to) return;
      const x1 = colX(from.col), y1 = rowY(from.row);
      const x2 = colX(to.col),   y2 = rowY(to.row);
      const mx = (x1 + x2) / 2;
      const dy = (y2 - y1) * 0.15;
      const d = `M${x1},${y1} C${mx},${y1 + dy} ${mx},${y2 - dy} ${x2},${y2}`;

      // Glow layer
      const glow = document.createElementNS('http://www.w3.org/2000/svg','path');
      glow.setAttribute('d', d);
      glow.setAttribute('fill', 'none');
      glow.setAttribute('stroke', STREAMS[e.stream]?.color || '#555');
      glow.setAttribute('stroke-width', '5');
      glow.setAttribute('opacity', '0.12');
      glow.setAttribute('filter', 'url(#glow)');
      svg.appendChild(glow);

      // Main line
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', STREAMS[e.stream]?.color || '#555');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('opacity', '0.45');
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
    });

    // — Nodes
    NODES.forEach(n => {
      const cx = colX(n.col), cy = rowY(n.row);
      const color = STREAMS[n.stream]?.color || '#aaa';

      const g = document.createElementNS('http://www.w3.org/2000/svg','g');
      g.setAttribute('class', 'river-node');
      g.style.cursor = 'pointer';

      // Outer glow circle
      const cGlow = document.createElementNS('http://www.w3.org/2000/svg','circle');
      cGlow.setAttribute('cx', cx);
      cGlow.setAttribute('cy', cy);
      cGlow.setAttribute('r', NODE_R + 4);
      cGlow.setAttribute('fill', color);
      cGlow.setAttribute('opacity', '0.08');
      cGlow.setAttribute('filter', 'url(#glow-strong)');
      g.appendChild(cGlow);

      // Main circle
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx', cx);
      c.setAttribute('cy', cy);
      c.setAttribute('r', NODE_R);
      c.setAttribute('fill', '#0a0e1a');
      c.setAttribute('stroke', color);
      c.setAttribute('stroke-width', '2.2');
      g.appendChild(c);

      // Label
      const t = document.createElementNS('http://www.w3.org/2000/svg','text');
      t.setAttribute('x', cx);
      t.setAttribute('y', cy + 1);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('dominant-baseline', 'middle');
      t.setAttribute('fill', color);
      t.setAttribute('font-size', '7.5');
      t.setAttribute('font-weight', '600');
      const abbr = n.label.length > 14 ? n.label.slice(0,12) + '…' : n.label;
      t.textContent = abbr;
      g.appendChild(t);

      // Interaction
      g.addEventListener('mouseenter', (ev) => {
        c.setAttribute('r', NODE_R + 3);
        c.setAttribute('stroke-width', '3');
        cGlow.setAttribute('opacity', '0.25');
        showTooltip(ev, n);
        highlightStream(n.id);
      });
      g.addEventListener('mouseleave', () => {
        c.setAttribute('r', NODE_R);
        c.setAttribute('stroke-width', '2.2');
        cGlow.setAttribute('opacity', '0.08');
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

  /* — Tooltip with smart edge-aware positioning — */
  function showTooltip(ev, node) {
    const rect = container.getBoundingClientRect();
    const tooltipWidth = 280; // max-width from CSS
    const tooltipHeight = 100; // approximate
    const margin = 16;

    let x = ev.clientX - rect.left + margin;
    let y = ev.clientY - rect.top - margin;

    // ── FIX: Flip left if tooltip would overflow right edge ──
    if (x + tooltipWidth > container.clientWidth - 10) {
      x = ev.clientX - rect.left - tooltipWidth - margin;
    }
    // Clamp to left edge
    if (x < 10) x = 10;

    // Flip up if tooltip would overflow bottom edge
    if (y + tooltipHeight > container.clientHeight - 10) {
      y = ev.clientY - rect.top - tooltipHeight - margin;
    }
    // Clamp to top edge
    if (y < 10) y = 10;

    tooltip.querySelector('.tt-era').textContent = node.era;
    tooltip.querySelector('.tt-title').textContent = node.label;
    tooltip.querySelector('.tt-body').textContent = node.short;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    tooltip.style.opacity = '1';
    tooltip.style.borderColor = STREAMS[node.stream]?.color || '#555';
  }
  function hideTooltip() { tooltip.style.opacity = '0'; }

  /* — Highlight connected edges on hover — */
  function highlightStream(nodeId) {
    const paths = svg.querySelectorAll('path');
    const connected = new Set();
    EDGES.forEach((e, i) => {
      if (e.from === nodeId || e.to === nodeId) connected.add(i);
    });
    let pathIdx = 0;
    EDGES.forEach((e, i) => {
      const glow = paths[pathIdx];
      const main = paths[pathIdx + 1];
      if (connected.has(i)) {
        if (glow) { glow.setAttribute('opacity', '0.5'); glow.setAttribute('stroke-width', '8'); }
        if (main) { main.setAttribute('opacity', '1'); main.setAttribute('stroke-width', '3.5'); }
      } else {
        if (glow) glow.setAttribute('opacity', '0.04');
        if (main) main.setAttribute('opacity', '0.15');
      }
      pathIdx += 2;
    });
  }
  function resetHighlight() {
    const paths = svg.querySelectorAll('path');
    let pathIdx = 0;
    EDGES.forEach(() => {
      const glow = paths[pathIdx];
      const main = paths[pathIdx + 1];
      if (glow) { glow.setAttribute('opacity', '0.12'); glow.setAttribute('stroke-width', '5'); }
      if (main) { main.setAttribute('opacity', '0.45'); main.setAttribute('stroke-width', '2'); }
      pathIdx += 2;
    });
  }

  /* — Legend — */
  function buildLegend() {
    const leg = document.getElementById('river-legend');
    leg.innerHTML = '';
    for (const [key, s] of Object.entries(STREAMS)) {
      const sp = document.createElement('span');
      sp.innerHTML = `<span class="swatch" style="background:${s.color}"></span>${s.label}`;
      leg.appendChild(sp);
    }
  }

  /* — Init — */
  draw();
  buildLegend();
  window.addEventListener('resize', draw);

  /* — Optional: highlight current section based on scroll — */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const node = NODES.find(n => n.divId === entry.target.id);
      if (!node) return;
      // For a full implementation, toggle .river-node-active on the matching SVG group
    });
  }, { threshold: 0.3 });

  NODES.forEach(n => {
    if (n.divId) {
      const el = document.getElementById(n.divId);
      if (el) observer.observe(el);
    }
  });

})();
</script>
