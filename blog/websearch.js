(function () {
  /* ═══════════════════════════════════════════════
     1. AUTO-INJECT SCOPED CSS
     ═══════════════════════════════════════════════ */
  var css = document.createElement("style");
  css.id = "wslab-injected-styles";
  css.textContent = [

    /* ── Pipeline Diagram ── */
    "#wslab-pipeline-diagram {",
    "  display: flex; align-items: center; justify-content: center;",
    "  gap: 8px; flex-wrap: wrap; margin: 24px 0; font-size: 0.85em;",
    "}",
    ".wslab-diagram-box {",
    "  padding: 10px 14px; border-radius: 10px; font-weight: 700;",
    "  text-align: center; min-width: 80px; line-height: 1.4;",
    "}",
    ".wslab-diagram-arrow {",
    "  font-size: 1.4em; color: #64748b;",
    "}",

    /* ── Fetch Diagram ── */
    "#wslab-fetch-diagram {",
    "  display: flex; align-items: center; justify-content: center;",
    "  gap: 8px; flex-wrap: wrap; margin: 24px 0; font-size: 0.85em;",
    "}",

    /* ── Code Block ── */
    "pre.wslab-code-block {",
    "  background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px;",
    "  padding: 16px 20px; margin: 18px 0; overflow-x: auto;",
    "  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;",
    "  font-size: 0.88em; line-height: 1.6; color: #334155;",
    "  white-space: pre; word-wrap: normal;",
    "  -webkit-user-select: text; user-select: text;",
    "}",
    "pre.wslab-code-block code {",
    "  background: none; padding: 0; border-radius: 0; font-size: inherit;",
    "}",

    /* ── Compare Grid ── */
    "#wslab-compare-grid {",
    "  display: grid; grid-template-columns: 1fr 1fr;",
    "  gap: 16px; margin: 18px 0;",
    "}",
    "@media (max-width: 640px) {",
    "  #wslab-compare-grid { grid-template-columns: 1fr; }",
    "}",
    ".wslab-compare-card {",
    "  background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px;",
    "  padding: 18px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);",
    "}",
    ".wslab-compare-card ul {",
    "  margin-top: 10px; padding-left: 1.3em;",
    "}",
    ".wslab-compare-card li {",
    "  margin-bottom: 6px; line-height: 1.6;",
    "}",
    ".wslab-card-orange { border-left: 4px solid #f59e0b; }",
    ".wslab-card-purple { border-left: 4px solid #8b5cf6; }",

    ".wslab-tag {",
    "  display: inline-block; padding: 2px 10px; border-radius: 99px;",
    "  font-size: 0.75em; font-weight: 700; letter-spacing: 0.04em;",
    "}",
    ".wslab-tag-orange { background: #fef3c7; color: #92400e; }",
    ".wslab-tag-purple { background: #ede9fe; color: #5b21b6; }",

    /* ── Interactive Demo ── */
    "#wslab-demo-container {",
    "  background: linear-gradient(135deg, #fefce8, #fef9c3);",
    "  border: 1px solid #fde047; border-radius: 14px;",
    "  padding: 22px; margin: 22px 0;",
    "}",
    ".wslab-demo-subtitle {",
    "  color: #64748b; font-size: 0.88em; margin-bottom: 12px;",
    "}",
    "#wslab-query-input {",
    "  width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0;",
    "  border-radius: 8px; font-size: 1em; margin-bottom: 10px;",
    "  box-sizing: border-box;",
    "}",
    "#wslab-search-btn {",
    "  background: #f59e0b; color: #fff; border: none;",
    "  padding: 10px 22px; border-radius: 8px; cursor: pointer;",
    "  font-weight: 700; font-size: 0.9em; transition: filter 0.2s;",
    "}",
    "#wslab-search-btn:hover { filter: brightness(1.1); }",

    /* ── Pipeline Steps in Demo ── */
    ".wslab-step {",
    "  margin: 12px 0; padding: 14px 18px; border-radius: 10px;",
    "  border: 1px solid #e2e8f0; background: #fff;",
    "  animation: wslab-fadein 0.4s ease;",
    "}",
    "@keyframes wslab-fadein {",
    "  from { opacity: 0; transform: translateY(8px); }",
    "  to { opacity: 1; transform: translateY(0); }",
    "}",
    ".wslab-step-header {",
    "  font-weight: 700; font-size: 0.85em; text-transform: uppercase;",
    "  letter-spacing: 0.05em; margin-bottom: 6px;",
    "}",
    ".wslab-step-content {",
    "  font-size: 0.9em; line-height: 1.6; color: #334155;",
    "}",
    ".wslab-step-content code {",
    "  background: #f1f5f9; padding: 2px 6px; border-radius: 4px;",
    "  font-size: 0.9em;",
    "}",

    ".wslab-source-item {",
    "  padding: 8px 12px; margin: 6px 0; border-radius: 8px;",
    "  background: #f8fafc; border: 1px solid #e2e8f0;",
    "  font-size: 0.88em;",
    "}",
    ".wslab-source-url {",
    "  color: #3b82f6; font-weight: 600; font-size: 0.85em;",
    "}",
    ".wslab-source-snippet {",
    "  color: #64748b; margin-top: 4px; line-height: 1.5;",
    "}",

    ".wslab-final-answer {",
    "  margin-top: 12px; padding: 14px 18px; border-radius: 10px;",
    "  background: linear-gradient(135deg, #ecfdf5, #d1fae5);",
    "  border: 1px solid #6ee7b7;",
    "}",
    ".wslab-final-answer p {",
    "  margin: 0; line-height: 1.7; color: #065f46;",
    "}",

    ".wslab-details {",
    "  margin-top: 14px; font-size: 0.88em; color: #64748b;",
    "}",
    ".wslab-details summary {",
    "  cursor: pointer; font-weight: 600;",
    "}",
    ".wslab-details p {",
    "  margin-top: 8px; line-height: 1.6;",
    "}"

  ].join("\n");
  document.head.appendChild(css);

  /* ═══════════════════════════════════════════════
     2. RENDER PIPELINE DIAGRAM
     ═══════════════════════════════════════════════ */
  function renderPipelineDiagram() {
    var el = document.getElementById("wslab-pipeline-diagram");
    if (!el) return;

    var steps = [
      { label: "User Query",           bg: "#dbeafe", fg: "#1e40af" },
      { label: "Intent<br>Detection",  bg: "#fef3c7", fg: "#92400e" },
      { label: "Search API<br>Call",    bg: "#ffedd5", fg: "#9a3412" },
      { label: "Fetch &amp;<br>Extract",   bg: "#d1fae5", fg: "#065f46" },
      { label: "Chunk &amp;<br>Re-rank",   bg: "#e0e7ff", fg: "#3730a3" },
      { label: "LLM<br>Generation",    bg: "#ede9fe", fg: "#5b21b6" },
      { label: "Grounded<br>Answer",   bg: "#fee2e2", fg: "#991b1b" }
    ];

    var html = "";
    for (var i = 0; i < steps.length; i++) {
      if (i > 0) {
        html += '<span class="wslab-diagram-arrow">→</span>';
      }
      html += '<div class="wslab-diagram-box" style="background:' +
              steps[i].bg + '; color:' + steps[i].fg + ';">' +
              steps[i].label + '</div>';
    }
    el.innerHTML = html;
  }

  /* ═══════════════════════════════════════════════
     3. RENDER FETCH PIPELINE DIAGRAM
     ═══════════════════════════════════════════════ */
  function renderFetchDiagram() {
    var el = document.getElementById("wslab-fetch-diagram");
    if (!el) return;

    var steps = [
      { label: "Raw HTML<br>(50 KB)",          bg: "#fee2e2", fg: "#991b1b" },
      { label: "Readability /<br>Trafilatura",  bg: "#fef3c7", fg: "#92400e" },
      { label: "Clean Text<br>(3 KB)",          bg: "#d1fae5", fg: "#065f46" },
      { label: "Chunker",                       bg: "#e0e7ff", fg: "#3730a3" },
      { label: "Relevant<br>Passages",          bg: "#dbeafe", fg: "#1e40af" }
    ];

    var html = "";
    for (var i = 0; i < steps.length; i++) {
      if (i > 0) {
        html += '<span class="wslab-diagram-arrow">→</span>';
      }
      html += '<div class="wslab-diagram-box" style="background:' +
              steps[i].bg + '; color:' + steps[i].fg + ';">' +
              steps[i].label + '</div>';
    }
    el.innerHTML = html;
  }

  /* ═══════════════════════════════════════════════
     4. INTERACTIVE WEB SEARCH SIMULATION
     ═══════════════════════════════════════════════ */

  /* Mock search results database — keyed by broad topic keywords */
  var WSLAB_MOCK_DB = {
    _default: {
      searchQuery: null, /* will be filled dynamically */
      results: [
        {
          title: "Wikipedia — General Knowledge",
          url: "https://en.wikipedia.org/wiki/Main_Page",
          snippet: "Wikipedia is a free online encyclopedia with articles on virtually every topic, maintained by a community of volunteer editors.",
          content: "Wikipedia contains over 6.8 million articles in English covering science, history, technology, culture, and more. Articles are collaboratively written and continuously updated."
        },
        {
          title: "Latest News and Updates — Reuters",
          url: "https://www.reuters.com/",
          snippet: "Reuters provides trusted business, financial, national, and international news. Stay informed with breaking stories and expert analysis.",
          content: "Reuters is one of the world's largest news agencies, providing real-time coverage of global events, markets, politics, and technology developments."
        }
      ],
      answer: "Based on the search results, I found general information related to your query. For more specific results, try refining your question with specific names, dates, or technical terms."
    },
    python: {
      searchQuery: "Python programming language latest version 2026",
      results: [
        {
          title: "Python 3.14 Released — What's New",
          url: "https://docs.python.org/3/whatsnew/3.14.html",
          snippet: "Python 3.14 was released in October 2025 with experimental JIT compilation, improved error messages, and new typing features.",
          content: "Python 3.14 introduces an experimental JIT compiler that can speed up CPU-bound code by 20-40%. The release also includes improved error messages with more context, new typing features like TypeForm, and deprecation of several legacy modules. The GIL-optional build (PEP 703) continues as experimental."
        },
        {
          title: "Python Release Schedule — PEP 745",
          url: "https://peps.python.org/pep-0745/",
          snippet: "PEP 745 outlines the release schedule for Python 3.14, with the final release on October 7, 2025.",
          content: "Python follows an annual release cycle. Python 3.14 was released October 7, 2025. Python 3.15 is currently in alpha development with an expected release in October 2026. Each version receives 5 years of support."
        },
        {
          title: "Download Python — python.org",
          url: "https://www.python.org/downloads/",
          snippet: "Download the latest version of Python. Python 3.14.2 is the current stable release as of early 2026.",
          content: "The Python Software Foundation distributes Python for Windows, macOS, and Linux. The current stable version is Python 3.14.2. Python 2 reached end-of-life on January 1, 2020 and should no longer be used."
        }
      ],
      answer: "The latest stable version of Python is **3.14.2** (as of early 2026) [1][3]. Python 3.14 was released on October 7, 2025 [2] and introduced an experimental JIT compiler with 20-40% speedups for CPU-bound code, improved error messages, and new typing features [1]. Python 3.15 is currently in alpha development [2]."
    },
    transformer: {
      searchQuery: "transformer architecture latest advances 2026",
      results: [
        {
          title: "State of Transformers in 2026 — AI Research Review",
          url: "https://arxiv.org/abs/2026.01234",
          snippet: "A comprehensive survey of transformer architecture improvements including linear attention, mixture-of-experts, and efficient inference techniques.",
          content: "The transformer architecture has seen significant evolution since 2017. Key 2025-2026 advances include: (1) Linear attention variants reducing O(n²) to O(n) complexity, (2) Sparse Mixture-of-Experts (MoE) enabling trillion-parameter models at manageable compute costs, (3) Speculative decoding for 2-3x faster inference, and (4) State-space model hybrids combining transformer attention with Mamba-style recurrence."
        },
        {
          title: "Beyond Attention: Hybrid Architectures — Google Research",
          url: "https://research.google/pubs/hybrid-architectures-2026/",
          snippet: "Google Research explores hybrid models combining attention mechanisms with state-space models for improved efficiency on long sequences.",
          content: "Hybrid architectures interleave transformer attention layers with state-space model (SSM) layers. This approach achieves comparable quality to pure transformers on standard benchmarks while reducing memory usage by 40-60% on sequences longer than 32K tokens. The Gemini 2.5 architecture uses this hybrid approach."
        }
      ],
      answer: "Recent advances in transformer architecture (2025-2026) include: **linear attention** variants that reduce complexity from O(n²) to O(n) [1], **sparse Mixture-of-Experts** enabling trillion-parameter models efficiently [1], **speculative decoding** for 2-3x faster inference [1], and **hybrid architectures** combining attention with state-space models for 40-60% memory reduction on long sequences [2]."
    },
    climate: {
      searchQuery: "climate change latest data global temperature 2026",
      results: [
        {
          title: "Global Temperature Report — NASA GISS",
          url: "https://data.giss.nasa.gov/gistemp/",
          snippet: "NASA's Goddard Institute for Space Studies tracks global surface temperature anomalies. 2025 was confirmed as the warmest year on record.",
          content: "According to NASA GISS data, 2025 was the warmest year in the instrumental record at 1.42°C above the 1880-1920 pre-industrial average. This surpassed 2024 which held the previous record at 1.36°C. The warming trend continues to accelerate, with the last decade averaging 1.2°C above pre-industrial levels."
        },
        {
          title: "IPCC AR7 Scoping — Climate Projections Update",
          url: "https://www.ipcc.ch/ar7/",
          snippet: "The IPCC Seventh Assessment Report scoping process is underway, incorporating the latest climate science and updated emission scenarios.",
          content: "The IPCC AR7 cycle began in 2024. Updated climate models project that the 1.5°C threshold will likely be permanently exceeded between 2027-2032 under current emission trajectories. The report will incorporate improved regional climate projections and updated socioeconomic pathways."
        }
      ],
      answer: "According to NASA GISS, **2025 was the warmest year on record** at 1.42°C above pre-industrial levels, surpassing 2024's record of 1.36°C [1]. The IPCC AR7 process projects the 1.5°C threshold will likely be permanently exceeded between **2027-2032** under current emission trajectories [2]."
    },
    ai: {
      searchQuery: "artificial intelligence latest developments LLM 2026",
      results: [
        {
          title: "The State of AI Report 2026",
          url: "https://www.stateof.ai/2026",
          snippet: "Annual review of the most important developments in AI research, industry, and policy over the past year.",
          content: "Key AI developments in 2025-2026: (1) Reasoning models like OpenAI o3 and Claude Opus achieve expert-level performance on graduate-level science and math, (2) Multimodal models natively process text, images, audio, and video in unified architectures, (3) AI agents capable of multi-step computer use become commercially available, (4) Open-weight models close the gap with proprietary systems."
        },
        {
          title: "AI Regulation Update — EU AI Act Implementation",
          url: "https://digital-strategy.ec.europa.eu/en/policies/ai-act",
          snippet: "The EU AI Act entered full enforcement in 2025, establishing the world's first comprehensive AI regulatory framework.",
          content: "The EU AI Act classifies AI systems by risk level: unacceptable (banned), high-risk (strict requirements), limited risk (transparency obligations), and minimal risk (no restrictions). General-purpose AI models like GPT and Claude must comply with transparency and copyright requirements. High-risk AI systems in healthcare, law enforcement, and education face mandatory conformity assessments."
        }
      ],
      answer: "Key AI developments in 2025-2026 include: **reasoning models** achieving expert-level science and math performance, **multimodal models** processing text/images/audio/video natively, and **AI agents** capable of multi-step computer use [1]. On the regulatory side, the **EU AI Act** entered full enforcement in 2025, classifying AI systems by risk level [2]."
    }
  };

  /**
   * Determine which mock topic best matches the user's query
   */
  function wslab_detectTopic(query) {
    var q = query.toLowerCase();
    var topics = {
      python:      ["python", "pip", "cpython", "guido"],
      transformer: ["transformer", "attention", "architecture", "bert", "gpt architecture"],
      climate:     ["climate", "temperature", "warming", "carbon", "emission", "weather global"],
      ai:          ["ai ", "artificial intelligence", "llm", "large language model", "chatgpt", "machine learning", "deep learning"]
    };

    for (var topic in topics) {
      if (!topics.hasOwnProperty(topic)) continue;
      var keywords = topics[topic];
      for (var k = 0; k < keywords.length; k++) {
        if (q.indexOf(keywords[k]) !== -1) {
          return topic;
        }
      }
    }
    return "_default";
  }

  /**
   * Simulate the full web search pipeline with animated steps
   */
  function wslab_runSearch() {
    var input = document.getElementById("wslab-query-input");
    if (!input) return;
    var query = input.value.trim();
    if (!query) return;

    var container = document.getElementById("wslab-results");
    if (!container) return;

    /* Clear previous results */
    container.innerHTML = "";

    var topic = wslab_detectTopic(query);
    var mockData = WSLAB_MOCK_DB[topic];

    /* Determine the search query (use mock or generate from user input) */
    var searchQuery = mockData.searchQuery || (query.replace(/[?]/g, "") + " 2026");

    /* Pipeline steps to animate */
    var steps = [
      {
        delay: 300,
        color: "#f59e0b",
        header: "Step 1 — Intent Detection",
        content: 'Analyzing query: <code>"' + query + '"</code><br>' +
                 'Decision: <strong>Web search required</strong> — query asks about current/recent information.'
      },
      {
        delay: 900,
        color: "#f97316",
        header: "Step 2 — Query Formulation",
        content: 'Original query: <code>"' + query + '"</code><br>' +
                 'Reformulated for search API: <code>"' + searchQuery + '"</code>'
      },
      {
        delay: 1800,
        color: "#3b82f6",
        header: "Step 3 — Search API Call (Bing / Google / Brave)",
        content: 'Sending request to search API\u2026<br>' +
                 'Received <strong>' + mockData.results.length + ' results</strong> in ~350ms.'
      },
      {
        delay: 2600,
        color: "#8b5cf6",
        header: "Step 4 — Content Fetching",
        content: (function () {
          var lines = "Fetching full page content from top URLs:<br>";
          for (var r = 0; r < mockData.results.length; r++) {
            lines += '<div class="wslab-source-item">' +
                     '<div class="wslab-source-url">[' + (r + 1) + '] ' + mockData.results[r].url + '</div>' +
                     '<div class="wslab-source-snippet">"' + mockData.results[r].snippet + '"</div>' +
                     '</div>';
          }
          return lines;
        })()
      },
      {
        delay: 3800,
        color: "#06b6d4",
        header: "Step 5 — Content Extraction & Chunking",
        content: (function () {
          var lines = "Extracted clean text from HTML using Readability.js:<br>";
          for (var r = 0; r < mockData.results.length; r++) {
            var charCount = mockData.results[r].content.length;
            lines += '<div class="wslab-source-item">' +
                     '<div class="wslab-source-url">[' + (r + 1) + '] ' + mockData.results[r].title + '</div>' +
                     '<div class="wslab-source-snippet">Extracted ' + charCount + ' characters → 1 chunk (fits within token budget)</div>' +
                     '</div>';
          }
          lines += '<br>Total retrieved content: <strong>' + mockData.results.length + ' chunks</strong> within token budget.';
          return lines;
        })()
      },
      {
        delay: 5000,
        color: "#10b981",
        header: "Step 6 — Prompt Assembly & LLM Generation",
        content: 'Injecting ' + mockData.results.length + ' source chunks into prompt\u2026<br>' +
                 'Generating grounded answer with citations\u2026'
      }
    ];

    /* Animate each step appearing sequentially */
    for (var s = 0; s < steps.length; s++) {
      (function (step) {
        setTimeout(function () {
          var div = document.createElement("div");
          div.className = "wslab-step";
          div.style.borderLeft = "4px solid " + step.color;
          div.innerHTML =
            '<div class="wslab-step-header" style="color:' + step.color + ';">' + step.header + '</div>' +
            '<div class="wslab-step-content">' + step.content + '</div>';
          container.appendChild(div);
          div.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, step.delay);
      })(steps[s]);
    }

    /* Final answer after all steps */
    setTimeout(function () {
      var answerDiv = document.createElement("div");
      answerDiv.className = "wslab-final-answer";
      answerDiv.innerHTML =
        '<div class="wslab-step-header" style="color: #065f46;">✅ Final Answer (grounded in sources)</div>' +
        '<p>' + mockData.answer + '</p>';
      container.appendChild(answerDiv);
      answerDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 6200);
  }

  /* ═══════════════════════════════════════════════
     5. INIT
     ═══════════════════════════════════════════════ */
  function wslab_init() {
    renderPipelineDiagram();
    renderFetchDiagram();

    var btn = document.getElementById("wslab-search-btn");
    if (btn) {
      btn.addEventListener("click", wslab_runSearch);
    }

    var input = document.getElementById("wslab-query-input");
    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { wslab_runSearch(); }
      });
    }
  }

  /* ═══════════════════════════════════════════════
     6. PUBLIC LOADER (called by functions.js)
     ═══════════════════════════════════════════════ */
  window.loadWebsearchModule = function () {
    if (typeof updateLoadingStatus === "function") {
      updateLoadingStatus("Loading Web Search explainer\u2026");
    }
    wslab_init();
    return Promise.resolve();
  };

  /* Also auto-init if DOM is already ready (standalone use) */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wslab_init);
  } else {
    wslab_init();
  }

})();
