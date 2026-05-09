(function () {
  /* ═══════════════════════════════════════════════
     1. AUTO-INJECT SCOPED CSS
     ═══════════════════════════════════════════════ */
  var css = document.createElement("style");
  css.id = "vslab-injected-styles";
  css.textContent = [

    /* ── Pipeline Diagram ── */
    "#vslab-pipeline-diagram {",
    "  display: flex; align-items: center; justify-content: center;",
    "  gap: 10px; flex-wrap: wrap; margin: 24px 0; font-size: 0.9em;",
    "}",
    ".vslab-diagram-box {",
    "  padding: 10px 16px; border-radius: 10px; font-weight: 700;",
    "  text-align: center; min-width: 90px; line-height: 1.4;",
    "}",
    ".vslab-diagram-arrow {",
    "  font-size: 1.4em; color: #64748b;",
    "}",

    /* ── HNSW Diagram ── */
    "#vslab-hnsw-diagram {",
    "  margin: 24px 0; padding: 20px; background: #f8fafc;",
    "  border: 1px solid #e2e8f0; border-radius: 14px;",
    "}",
    ".vslab-hnsw-layer {",
    "  display: flex; align-items: center; gap: 12px; margin: 8px 0;",
    "  padding: 10px 14px; border-radius: 8px;",
    "}",
    ".vslab-hnsw-label {",
    "  font-weight: 700; font-size: 0.85em; min-width: 120px;",
    "}",
    ".vslab-hnsw-nodes {",
    "  display: flex; gap: 6px; flex-wrap: wrap;",
    "}",
    ".vslab-hnsw-node {",
    "  width: 28px; height: 28px; border-radius: 50%;",
    "  display: flex; align-items: center; justify-content: center;",
    "  font-size: 0.7em; font-weight: 700; color: #fff;",
    "}",

    /* ── Search Comparison ── */
    "#vslab-search-comparison {",
    "  display: grid; grid-template-columns: 1fr 1fr 1fr;",
    "  gap: 14px; margin: 18px 0;",
    "}",
    "@media (max-width: 700px) {",
    "  #vslab-search-comparison { grid-template-columns: 1fr; }",
    "}",
    ".vslab-compare-card {",
    "  background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px;",
    "  padding: 16px 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);",
    "}",
    ".vslab-compare-card ul {",
    "  margin-top: 10px; padding-left: 1.3em;",
    "}",
    ".vslab-compare-card li {",
    "  margin-bottom: 6px; line-height: 1.6; font-size: 0.9em;",
    "}",
    ".vslab-card-keyword { border-left: 4px solid #f59e0b; }",
    ".vslab-card-semantic { border-left: 4px solid #8b5cf6; }",
    ".vslab-card-hybrid { border-left: 4px solid #10b981; }",
    ".vslab-tag {",
    "  display: inline-block; padding: 2px 10px; border-radius: 99px;",
    "  font-size: 0.75em; font-weight: 700; letter-spacing: 0.04em;",
    "}",
    ".vslab-tag-keyword { background: #fef3c7; color: #92400e; }",
    ".vslab-tag-semantic { background: #ede9fe; color: #5b21b6; }",
    ".vslab-tag-hybrid { background: #d1fae5; color: #065f46; }",

    /* ── Code Block ── */
    "pre.vslab-code-block {",
    "  background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px;",
    "  padding: 16px 20px; margin: 18px 0; overflow-x: auto;",
    "  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;",
    "  font-size: 0.88em; line-height: 1.6; color: #334155;",
    "  white-space: pre; word-wrap: normal;",
    "  -webkit-user-select: text; user-select: text;",
    "}",
    "pre.vslab-code-block code {",
    "  background: none; padding: 0; border-radius: 0; font-size: inherit;",
    "}",

    /* ── Interactive Demo ── */
    "#vslab-demo-container {",
    "  background: linear-gradient(135deg, #faf5ff, #f5f3ff);",
    "  border: 1px solid #c4b5fd; border-radius: 14px;",
    "  padding: 22px; margin: 22px 0;",
    "}",
    ".vslab-demo-subtitle {",
    "  color: #64748b; font-size: 0.88em; margin-bottom: 12px;",
    "}",
    "#vslab-query-input {",
    "  width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0;",
    "  border-radius: 8px; font-size: 1em; margin-bottom: 10px;",
    "  box-sizing: border-box;",
    "}",
    "#vslab-search-btn {",
    "  background: #8b5cf6; color: #fff; border: none;",
    "  padding: 10px 22px; border-radius: 8px; cursor: pointer;",
    "  font-weight: 700; font-size: 0.9em; transition: filter 0.2s;",
    "}",
    "#vslab-search-btn:hover { filter: brightness(1.1); }",

    ".vslab-result-section {",
    "  margin-top: 14px;",
    "}",
    ".vslab-result-section-header {",
    "  font-weight: 700; font-size: 0.9em; margin-bottom: 8px;",
    "  padding: 6px 12px; border-radius: 8px; display: inline-block;",
    "}",
    ".vslab-result-item {",
    "  padding: 10px 14px; border-radius: 8px; margin-bottom: 6px;",
    "  border: 1px solid #e2e8f0; background: #fff;",
    "}",
    ".vslab-result-header {",
    "  display: flex; justify-content: space-between; align-items: center;",
    "}",
    ".vslab-result-score {",
    "  font-family: monospace; font-weight: 700; font-size: 0.9em;",
    "}",
    ".vslab-sim-bar-track {",
    "  height: 14px; background: #e2e8f0; border-radius: 99px;",
    "  overflow: hidden; margin: 4px 0;",
    "}",
    ".vslab-sim-bar-fill {",
    "  height: 100%; border-radius: 99px; transition: width 0.4s ease;",
    "}",
    ".vslab-result-text {",
    "  margin: 4px 0 0; font-size: 0.88em; color: #334155; line-height: 1.5;",
    "}",

    ".vslab-details {",
    "  margin-top: 14px; font-size: 0.88em; color: #64748b;",
    "}",
    ".vslab-details summary {",
    "  cursor: pointer; font-weight: 600;",
    "}",
    ".vslab-details p {",
    "  margin-top: 8px; line-height: 1.6;",
    "}"

  ].join("\n");
  document.head.appendChild(css);

  /* ═══════════════════════════════════════════════
     2. RENDER PIPELINE DIAGRAM
     ═══════════════════════════════════════════════ */
  function renderPipelineDiagram() {
    var el = document.getElementById("vslab-pipeline-diagram");
    if (!el) return;
    var steps = [
      { label: "Documents",              bg: "#dbeafe", fg: "#1e40af" },
      { label: "Chunking",               bg: "#fef3c7", fg: "#92400e" },
      { label: "Embedding<br>Model",     bg: "#ede9fe", fg: "#5b21b6" },
      { label: "Vectors<br>$\\vec{v}_i$", bg: "#d1fae5", fg: "#065f46" },
      { label: "Vector DB<br>(HNSW/IVF)", bg: "#ffedd5", fg: "#9a3412" },
      { label: "ANN<br>Search",          bg: "#fee2e2", fg: "#991b1b" },
      { label: "Top-K<br>Results",       bg: "#dbeafe", fg: "#1e40af" }
    ];
    var html = "";
    for (var i = 0; i < steps.length; i++) {
      if (i > 0) html += '<span class="vslab-diagram-arrow">\u2192</span>';
      html += '<div class="vslab-diagram-box" style="background:' +
              steps[i].bg + '; color:' + steps[i].fg + ';">' +
              steps[i].label + '</div>';
    }
    el.innerHTML = html;
  }

  /* ═══════════════════════════════════════════════
     3. RENDER HNSW DIAGRAM
     ═══════════════════════════════════════════════ */
  function renderHNSWDiagram() {
    var el = document.getElementById("vslab-hnsw-diagram");
    if (!el) return;

    var layers = [
      { name: "Layer 2 (Sparse)", color: "#ef4444", nodes: [3, 9, 15], bg: "#fef2f2" },
      { name: "Layer 1 (Medium)", color: "#f59e0b", nodes: [1, 3, 7, 9, 12, 15], bg: "#fffbeb" },
      { name: "Layer 0 (Dense)",  color: "#3b82f6", nodes: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], bg: "#eff6ff" }
    ];

    var html = '<p style="font-weight:700; margin-bottom:12px; font-size:0.9em;">HNSW: Multi-Layer Graph Structure</p>';
    html += '<p style="font-size:0.85em; color:#64748b; margin-bottom:14px;">Search starts at the top (sparse) layer and descends to the bottom (dense) layer, narrowing in on the target at each level — like navigating highways → local streets.</p>';

    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      html += '<div class="vslab-hnsw-layer" style="background:' + layer.bg + ';">';
      html += '<span class="vslab-hnsw-label" style="color:' + layer.color + ';">' + layer.name + '</span>';
      html += '<div class="vslab-hnsw-nodes">';
      for (var n = 0; n < layer.nodes.length; n++) {
        html += '<div class="vslab-hnsw-node" style="background:' + layer.color + ';">' + layer.nodes[n] + '</div>';
      }
      html += '</div></div>';
    }

    html += '<p style="font-size:0.82em; color:#64748b; margin-top:12px; font-style:italic;">\u2191 Query enters at Layer 2, greedily hops to nearest neighbor, drops down when stuck, repeats until Layer 0 yields final top-K results.</p>';
    el.innerHTML = html;
  }

  /* ═══════════════════════════════════════════════
     4. RENDER SEARCH COMPARISON CARDS
     ═══════════════════════════════════════════════ */
  function renderSearchComparison() {
    var el = document.getElementById("vslab-search-comparison");
    if (!el) return;

    var cards = [
      {
        cls: "vslab-card-keyword",
        tagCls: "vslab-tag-keyword",
        tagText: "Keyword (BM25)",
        items: [
          "Matches <strong>exact words</strong> in documents",
          "Fast and interpretable",
          "Excellent for codes, names, IDs",
          'Blind to meaning: "car" \u2260 "automobile"',
          "No understanding of paraphrases"
        ]
      },
      {
        cls: "vslab-card-semantic",
        tagCls: "vslab-tag-semantic",
        tagText: "Semantic (Vector)",
        items: [
          "Matches <strong>meaning</strong> via embeddings",
          "Handles synonyms and paraphrases",
          '"car" \u2248 "automobile" \u2248 "vehicle"',
          "Can miss exact keyword matches",
          "Requires embedding model"
        ]
      },
      {
        cls: "vslab-card-hybrid",
        tagCls: "vslab-tag-hybrid",
        tagText: "Hybrid (Best of Both)",
        items: [
          "Combines BM25 + vector similarity",
          "Catches both exact matches and meaning",
          "Used in most production RAG systems",
          "More complex to implement",
          "Tunable \u03B1 parameter for balance"
        ]
      }
    ];

    var html = "";
    for (var c = 0; c < cards.length; c++) {
      var card = cards[c];
      html += '<div class="vslab-compare-card ' + card.cls + '">';
      html += '<span class="vslab-tag ' + card.tagCls + '">' + card.tagText + '</span>';
      html += '<ul>';
      for (var li = 0; li < card.items.length; li++) {
        html += '<li>' + card.items[li] + '</li>';
      }
      html += '</ul></div>';
    }
    el.innerHTML = html;
  }

  /* ═══════════════════════════════════════════════
     5. INTERACTIVE: KEYWORD vs SEMANTIC SEARCH DEMO
     ═══════════════════════════════════════════════ */

  var VSLAB_DOCS = [
    {
      text: "The automobile industry has seen rapid growth in electric vehicle adoption, with Tesla leading the market in battery technology.",
      tags: ["car", "vehicle", "automobile", "electric", "battery", "tesla", "drive", "transport", "motor"]
    },
    {
      text: "Natural language processing allows computers to understand and generate human language using statistical models and neural networks.",
      tags: ["language", "understand", "computer", "nlp", "neural", "model", "text", "process", "machine", "learn"]
    },
    {
      text: "The Python programming language is widely used in machine learning due to its extensive library ecosystem including NumPy and PyTorch.",
      tags: ["python", "programming", "code", "library", "machine", "learn", "numpy", "pytorch", "software"]
    },
    {
      text: "Photosynthesis is the biological process by which plants convert sunlight into chemical energy stored in glucose molecules.",
      tags: ["plant", "biology", "sunlight", "energy", "photosynthesis", "glucose", "nature", "cell", "green"]
    },
    {
      text: "Deep learning models require massive computational resources, typically using GPU clusters for training over weeks or months.",
      tags: ["deep", "learn", "model", "compute", "gpu", "train", "neural", "resource", "machine", "ai"]
    },
    {
      text: "The car broke down on the highway, requiring a tow truck to transport it to the nearest repair shop for engine diagnostics.",
      tags: ["car", "highway", "broke", "repair", "engine", "tow", "transport", "mechanic", "fix"]
    },
    {
      text: "Semantic search uses vector embeddings to find documents by meaning rather than exact keyword matching, enabling more intelligent retrieval.",
      tags: ["semantic", "search", "vector", "embedding", "meaning", "retrieval", "find", "match", "intelligent"]
    },
    {
      text: "How machines understand language is one of the central questions of artificial intelligence, spanning linguistics, statistics, and computer science.",
      tags: ["machine", "understand", "language", "ai", "intelligence", "linguistics", "question", "computer", "science"]
    }
  ];

  /* Simple BM25-like keyword scoring */
  function vslab_keywordScore(query, docText) {
    var queryWords = query.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(function(w) { return w.length > 2; });
    var docWords = docText.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
    var score = 0;
    var docLen = docWords.length;
    var avgLen = 25; /* approximate average */

    for (var q = 0; q < queryWords.length; q++) {
      var term = queryWords[q];
      var tf = 0;
      for (var d = 0; d < docWords.length; d++) {
        if (docWords[d] === term || docWords[d].indexOf(term) !== -1) tf++;
      }
      if (tf > 0) {
        /* Simplified BM25 scoring */
        var k1 = 1.2;
        var b = 0.75;
        var idf = Math.log(1 + (VSLAB_DOCS.length - 1) / (1 + 1)); /* simplified */
        var tfNorm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLen / avgLen)));
        score += idf * tfNorm;
      }
    }
    return score;
  }

  /* Semantic scoring using tag-based heuristic vectors */
  function vslab_semanticScore(query, doc) {
    /* Build a shared tag vocabulary */
    var allTags = {};
    for (var i = 0; i < VSLAB_DOCS.length; i++) {
      for (var t = 0; t < VSLAB_DOCS[i].tags.length; t++) {
        allTags[VSLAB_DOCS[i].tags[t]] = true;
      }
    }
    var tagList = Object.keys(allTags);

    /* Embed query */
    var qWords = query.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
    var qVec = tagList.map(function(tag) {
      var count = 0;
      for (var w = 0; w < qWords.length; w++) {
        if (qWords[w].indexOf(tag) !== -1 || tag.indexOf(qWords[w]) !== -1) count++;
      }
      return count;
    });

    /* Embed document using tags */
    var dVec = tagList.map(function(tag) {
      return doc.tags.indexOf(tag) !== -1 ? 1 : 0;
    });

    /* Cosine similarity */
    var dot = 0, ma = 0, mb = 0;
    for (var i = 0; i < qVec.length; i++) {
      dot += qVec[i] * dVec[i];
      ma += qVec[i] * qVec[i];
      mb += dVec[i] * dVec[i];
    }
    return (ma && mb) ? dot / (Math.sqrt(ma) * Math.sqrt(mb)) : 0;
  }

  function vslab_runSearch() {
    var input = document.getElementById("vslab-query-input");
    if (!input) return;
    var query = input.value.trim();
    if (!query) return;

    /* Score all documents with both methods */
    var keywordResults = [];
    var semanticResults = [];

    for (var i = 0; i < VSLAB_DOCS.length; i++) {
      keywordResults.push({
        idx: i,
        text: VSLAB_DOCS[i].text,
        score: vslab_keywordScore(query, VSLAB_DOCS[i].text)
      });
      semanticResults.push({
        idx: i,
        text: VSLAB_DOCS[i].text,
        score: vslab_semanticScore(query, VSLAB_DOCS[i])
      });
    }

    keywordResults.sort(function(a, b) { return b.score - a.score; });
    semanticResults.sort(function(a, b) { return b.score - a.score; });

    var container = document.getElementById("vslab-results");
    if (!container) return;

    var html = '<div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:14px;">';

    /* Keyword results column */
    html += '<div class="vslab-result-section">';
    html += '<div class="vslab-result-section-header" style="background:#fef3c7; color:#92400e;">\uD83D\uDD24 Keyword Search (BM25)</div>';
    var kwMax = Math.max(keywordResults[0].score, 0.001);
    for (var r = 0; r < 4 && r < keywordResults.length; r++) {
      var res = keywordResults[r];
      var pct = Math.round((res.score / kwMax) * 100);
      var color = res.score > 0 ? "#f59e0b" : "#cbd5e1";
      html += '<div class="vslab-result-item" style="border-left:3px solid ' + color + ';">';
      html += '<div class="vslab-result-header">';
      html += '<span style="font-size:0.8em; font-weight:600; color:#64748b;">#' + (r + 1) + '</span>';
      html += '<span class="vslab-result-score" style="color:' + color + ';">' + res.score.toFixed(2) + '</span>';
      html += '</div>';
      html += '<div class="vslab-sim-bar-track"><div class="vslab-sim-bar-fill" style="width:' + pct + '%; background:' + color + ';"></div></div>';
      html += '<p class="vslab-result-text">' + res.text.substring(0, 120) + '\u2026</p>';
      html += '</div>';
    }
    html += '</div>';

    /* Semantic results column */
    html += '<div class="vslab-result-section">';
    html += '<div class="vslab-result-section-header" style="background:#ede9fe; color:#5b21b6;">\uD83E\uDDE0 Semantic Search (Vector)</div>';
    var semMax = Math.max(semanticResults[0].score, 0.001);
    for (var r = 0; r < 4 && r < semanticResults.length; r++) {
      var res = semanticResults[r];
      var pct = Math.round((res.score / semMax) * 100);
      var color = res.score > 0 ? "#8b5cf6" : "#cbd5e1";
      html += '<div class="vslab-result-item" style="border-left:3px solid ' + color + ';">';
      html += '<div class="vslab-result-header">';
      html += '<span style="font-size:0.8em; font-weight:600; color:#64748b;">#' + (r + 1) + '</span>';
      html += '<span class="vslab-result-score" style="color:' + color + ';">' + res.score.toFixed(3) + '</span>';
      html += '</div>';
      html += '<div class="vslab-sim-bar-track"><div class="vslab-sim-bar-fill" style="width:' + pct + '%; background:' + color + ';"></div></div>';
      html += '<p class="vslab-result-text">' + res.text.substring(0, 120) + '\u2026</p>';
      html += '</div>';
    }
    html += '</div>';

    html += '</div>'; /* close grid */

    /* Add responsive fallback */
    html += '<style>@media(max-width:700px){#vslab-results > div{grid-template-columns:1fr !important;}}</style>';

    container.innerHTML = html;
  }

  /* ═══════════════════════════════════════════════
     6. INIT
     ═══════════════════════════════════════════════ */
  function vslab_init() {
    renderPipelineDiagram();
    renderHNSWDiagram();
    renderSearchComparison();

    var btn = document.getElementById("vslab-search-btn");
    if (btn) {
      btn.addEventListener("click", vslab_runSearch);
    }

    var input = document.getElementById("vslab-query-input");
    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { vslab_runSearch(); }
      });
    }

    /* Run once on load with default value */
    vslab_runSearch();
  }

  /* ═══════════════════════════════════════════════
     7. PUBLIC LOADER (called by functions.js)
     ═══════════════════════════════════════════════ */
  window.loadVectorsearchModule = function () {
    if (typeof updateLoadingStatus === "function") {
      updateLoadingStatus("Loading Vector Search explainer\u2026");
    }
    vslab_init();
    return Promise.resolve();
  };

  /* Also auto-init if DOM is already ready (standalone use) */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", vslab_init);
  } else {
    vslab_init();
  }

})();
