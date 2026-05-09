(function () {
  /* ═══════════════════════════════════════════════
     1. AUTO-INJECT SCOPED CSS
     ═══════════════════════════════════════════════ */
  var css = document.createElement("style");
  css.id = "raglab-injected-styles";
  css.textContent = [

    /* ── Pipeline Diagram ── */
    "#raglab-pipeline-diagram {",
    "  display: flex; align-items: center; justify-content: center;",
    "  gap: 10px; flex-wrap: wrap; margin: 24px 0; font-size: 0.9em;",
    "}",
    ".raglab-diagram-box {",
    "  padding: 10px 16px; border-radius: 10px; font-weight: 700;",
    "  text-align: center; min-width: 90px; line-height: 1.4;",
    "}",
    ".raglab-diagram-arrow {",
    "  font-size: 1.4em; color: #64748b;",
    "}",

    /* ── Code Block (for the prompt example) ── */
    "pre.raglab-code-block {",
    "  background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px;",
    "  padding: 16px 20px; margin: 18px 0; overflow-x: auto;",
    "  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;",
    "  font-size: 0.88em; line-height: 1.6; color: #334155;",
    "  white-space: pre; word-wrap: normal;",
    "  -webkit-user-select: text; user-select: text;",
    "}",
    "pre.raglab-code-block code {",
    "  background: none; padding: 0; border-radius: 0; font-size: inherit;",
    "}",

    /* ── Compare Grid ── */
    "#raglab-compare-grid {",
    "  display: grid; grid-template-columns: 1fr 1fr;",
    "  gap: 16px; margin: 18px 0;",
    "}",
    "@media (max-width: 640px) {",
    "  #raglab-compare-grid { grid-template-columns: 1fr; }",
    "}",
    ".raglab-compare-card {",
    "  background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px;",
    "  padding: 18px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);",
    "}",
    ".raglab-compare-card ul {",
    "  margin-top: 10px; padding-left: 1.3em;",
    "}",
    ".raglab-compare-card li {",
    "  margin-bottom: 6px; line-height: 1.6;",
    "}",
    ".raglab-card-blue  { border-left: 4px solid #3b82f6; }",
    ".raglab-card-green { border-left: 4px solid #10b981; }",

    ".raglab-tag {",
    "  display: inline-block; padding: 2px 10px; border-radius: 99px;",
    "  font-size: 0.75em; font-weight: 700; letter-spacing: 0.04em;",
    "}",
    ".raglab-tag-blue  { background: #dbeafe; color: #1d4ed8; }",
    ".raglab-tag-green { background: #d1fae5; color: #065f46; }",

    /* ── Context Comparison Table ── */
    "#raglab-context-table {",
    "  margin: 18px 0;",
    "}",
    ".raglab-ctx-table {",
    "  width: 100%; border-collapse: collapse; font-size: 0.9em;",
    "  background: #fff; border-radius: 10px; overflow: hidden;",
    "  border: 1px solid #e2e8f0;",
    "}",
    ".raglab-ctx-table th {",
    "  text-align: left; padding: 10px 14px; background: #f8fafc;",
    "  border-bottom: 2px solid #e2e8f0; font-weight: 700; color: #334155;",
    "}",
    ".raglab-ctx-table td {",
    "  padding: 10px 14px; border-bottom: 1px solid #f1f5f9;",
    "}",
    ".raglab-ctx-table tr:last-child td {",
    "  border-bottom: none; font-weight: 700;",
    "}",

    /* ── Interactive Demo ── */
    "#raglab-demo-container {",
    "  background: linear-gradient(135deg, #f0f9ff, #eff6ff);",
    "  border: 1px solid #bfdbfe; border-radius: 14px;",
    "  padding: 22px; margin: 22px 0;",
    "}",
    ".raglab-demo-subtitle {",
    "  color: #64748b; font-size: 0.88em; margin-bottom: 12px;",
    "}",
    "#raglab-query-input {",
    "  width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0;",
    "  border-radius: 8px; font-size: 1em; margin-bottom: 10px;",
    "  box-sizing: border-box;",
    "}",
    "#raglab-search-btn {",
    "  background: #3b82f6; color: #fff; border: none;",
    "  padding: 10px 22px; border-radius: 8px; cursor: pointer;",
    "  font-weight: 700; font-size: 0.9em; transition: filter 0.2s;",
    "}",
    "#raglab-search-btn:hover { filter: brightness(1.1); }",

    ".raglab-result-item {",
    "  padding: 10px 14px; border-radius: 8px; margin-bottom: 8px;",
    "  border: 1px solid #e2e8f0; background: #fff;",
    "}",
    ".raglab-result-header {",
    "  display: flex; justify-content: space-between; align-items: center;",
    "}",
    ".raglab-result-score {",
    "  font-family: monospace; font-weight: 700; font-size: 0.95em;",
    "}",
    ".raglab-result-tag {",
    "  display: inline-block; padding: 2px 10px; border-radius: 99px;",
    "  font-size: 0.75em; font-weight: 700;",
    "}",
    ".raglab-result-tag-yes { background: #d1fae5; color: #065f46; }",
    ".raglab-result-tag-no  { background: #fee2e2; color: #991b1b; }",

    ".raglab-sim-bar-track {",
    "  height: 16px; background: #e2e8f0; border-radius: 99px;",
    "  overflow: hidden; margin: 4px 0;",
    "}",
    ".raglab-sim-bar-fill {",
    "  height: 100%; border-radius: 99px; transition: width 0.4s ease;",
    "}",
    ".raglab-result-text {",
    "  margin: 6px 0 0; font-size: 0.9em; color: #334155; line-height: 1.6;",
    "}",

    ".raglab-details {",
    "  margin-top: 14px; font-size: 0.88em; color: #64748b;",
    "}",
    ".raglab-details summary {",
    "  cursor: pointer; font-weight: 600;",
    "}",
    ".raglab-details p {",
    "  margin-top: 8px; line-height: 1.6;",
    "}"

  ].join("\n");
  document.head.appendChild(css);

  /* ═══════════════════════════════════════════════
     2. RENDER PIPELINE DIAGRAM
     ═══════════════════════════════════════════════ */
  function renderPipelineDiagram() {
    var el = document.getElementById("raglab-pipeline-diagram");
    if (!el) return;

    var steps = [
      { label: "User Query",                  bg: "#dbeafe", fg: "#1e40af" },
      { label: "Retriever<br>(vector search)", bg: "#fef3c7", fg: "#92400e" },
      { label: "Top-K Docs",                  bg: "#d1fae5", fg: "#065f46" },
      { label: "LLM<br>(generates answer)",    bg: "#ede9fe", fg: "#5b21b6" },
      { label: "Grounded<br>Answer",           bg: "#fee2e2", fg: "#991b1b" }
    ];

    var html = "";
    for (var i = 0; i < steps.length; i++) {
      if (i > 0) {
        html += '<span class="raglab-diagram-arrow">→</span>';
      }
      html += '<div class="raglab-diagram-box" style="background:' +
              steps[i].bg + '; color:' + steps[i].fg + ';">' +
              steps[i].label + '</div>';
    }
    el.innerHTML = html;
  }

  /* ═══════════════════════════════════════════════
     3. RENDER CONTEXT COMPARISON TABLE
     ═══════════════════════════════════════════════ */
  function renderContextTable() {
    var el = document.getElementById("raglab-context-table");
    if (!el) return;

    el.innerHTML = [
      '<table class="raglab-ctx-table">',
      '<tr><th>Approach</th><th>Searchable data</th><th>Cost per query</th></tr>',
      '<tr><td>128K context window</td><td>~1 book</td><td>$$$ (pay for all 128K tokens)</td></tr>',
      '<tr><td>1M context window</td><td>~8 books</td><td>$$$$ (massive token bill)</td></tr>',
      '<tr><td>RAG (vector DB)</td><td>Millions of documents</td><td>$ (only retrieved chunks use tokens)</td></tr>',
      '</table>'
    ].join("");
  }

  /* ═══════════════════════════════════════════════
     4. INTERACTIVE SIMILARITY SEARCH DEMO
     ═══════════════════════════════════════════════ */
  var RAGLAB_DOCS = [
    {
      text: "Backpropagation allows neural networks to learn by sending error signals backward through layers, adjusting weights via gradient descent.",
      tags: ["neural","network","learn","backpropagation","gradient","weight","train","deep"]
    },
    {
      text: "The Transformer architecture, introduced in 2017, uses self-attention to process sequences in parallel rather than sequentially.",
      tags: ["transformer","attention","architecture","parallel","sequence","2017","self"]
    },
    {
      text: "Tokenization splits text into subword units using algorithms like Byte-Pair Encoding (BPE), balancing vocabulary size and coverage.",
      tags: ["tokenization","text","bpe","subword","vocabulary","encode","split"]
    },
    {
      text: "Vector databases like FAISS and Pinecone store high-dimensional embeddings and support fast approximate nearest-neighbour search.",
      tags: ["vector","database","embedding","search","faiss","store","nearest","index"]
    },
    {
      text: "The French Revolution began in 1789 and led to the end of the monarchy and the rise of Napoleon Bonaparte.",
      tags: ["french","revolution","history","napoleon","monarchy","1789","europe"]
    },
    {
      text: "Photosynthesis converts sunlight, water, and CO\u2082 into glucose and oxygen in the chloroplasts of plant cells.",
      tags: ["photosynthesis","plant","sunlight","biology","cell","oxygen","energy"]
    },
    {
      text: "Cosine similarity measures the angle between two vectors, making it ideal for comparing semantic embeddings regardless of magnitude.",
      tags: ["cosine","similarity","vector","embedding","semantic","compare","angle","measure"]
    },
    {
      text: "Retrieval-Augmented Generation (RAG) fetches relevant documents from a vector store and injects them into the LLM\u2019s prompt before generation.",
      tags: ["rag","retrieval","document","vector","prompt","llm","generation","fetch","augment"]
    }
  ];

  function raglab_cosineSim(a, b) {
    var dot = 0, ma = 0, mb = 0;
    for (var i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      ma  += a[i] * a[i];
      mb  += b[i] * b[i];
    }
    return (ma && mb) ? dot / (Math.sqrt(ma) * Math.sqrt(mb)) : 0;
  }

  function raglab_embed(text, allTags) {
    var words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
    return allTags.map(function (tag) {
      var count = 0;
      for (var w = 0; w < words.length; w++) {
        if (words[w].indexOf(tag) !== -1 || tag.indexOf(words[w]) !== -1) {
          count++;
        }
      }
      return count;
    });
  }

  function raglab_runSearch() {
    var input = document.getElementById("raglab-query-input");
    if (!input) return;
    var query = input.value.trim();
    if (!query) return;

    /* Collect all unique tags */
    var tagSet = {};
    for (var d = 0; d < RAGLAB_DOCS.length; d++) {
      for (var t = 0; t < RAGLAB_DOCS[d].tags.length; t++) {
        tagSet[RAGLAB_DOCS[d].tags[t]] = true;
      }
    }
    var allTags = Object.keys(tagSet);

    var qVec = raglab_embed(query, allTags);

    /* Score every document */
    var results = [];
    for (var i = 0; i < RAGLAB_DOCS.length; i++) {
      var doc = RAGLAB_DOCS[i];
      var dVec = raglab_embed(doc.text + " " + doc.tags.join(" "), allTags);
      results.push({ idx: i, text: doc.text, score: raglab_cosineSim(qVec, dVec) });
    }
    results.sort(function (a, b) { return b.score - a.score; });

    var container = document.getElementById("raglab-results");
    if (!container) return;

    var maxScore = Math.max(results[0].score, 0.001);
    var TOP_K = 3;

    var html = '<p style="font-weight:700; margin:14px 0 10px;">Results (ranked by cosine similarity):</p>';

    for (var r = 0; r < 5 && r < results.length; r++) {
      var res = results[r];
      var pct = Math.round((res.score / maxScore) * 100);
      var isRetrieved = r < TOP_K;
      var color;
      if (r === 0) { color = "#10b981"; }
      else if (r < TOP_K) { color = "#3b82f6"; }
      else { color = "#94a3b8"; }

      var tagHtml = isRetrieved
        ? '<span class="raglab-result-tag raglab-result-tag-yes">Retrieved \u2713</span>'
        : '<span class="raglab-result-tag raglab-result-tag-no">Not used</span>';

      html += '<div class="raglab-result-item" style="border-left:4px solid ' + color + ';">' +
        '<div class="raglab-result-header">' +
          '<span class="raglab-result-score" style="color:' + color + ';">#' + (r + 1) + ' \u2014 sim: ' + res.score.toFixed(3) + '</span>' +
          tagHtml +
        '</div>' +
        '<div class="raglab-sim-bar-track"><div class="raglab-sim-bar-fill" style="width:' + pct + '%; background:' + color + ';"></div></div>' +
        '<p class="raglab-result-text">' + res.text + '</p>' +
      '</div>';
    }

    container.innerHTML = html;
  }

  /* ═══════════════════════════════════════════════
     5. INIT
     ═══════════════════════════════════════════════ */
  function raglab_init() {
    renderPipelineDiagram();
    renderContextTable();

    var btn = document.getElementById("raglab-search-btn");
    if (btn) {
      btn.addEventListener("click", raglab_runSearch);
    }

    var input = document.getElementById("raglab-query-input");
    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { raglab_runSearch(); }
      });
    }

    /* Run once on load with default value */
    raglab_runSearch();
  }

  /* ═══════════════════════════════════════════════
     6. PUBLIC LOADER (called by functions.js)
     ═══════════════════════════════════════════════ */
  window.loadRagModule = function () {
    if (typeof updateLoadingStatus === "function") {
      updateLoadingStatus("Loading RAG explainer\u2026");
    }
    raglab_init();
    return Promise.resolve();
  };

  /* Also auto-init if DOM is already ready (standalone use) */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", raglab_init);
  } else {
    raglab_init();
  }

})();
