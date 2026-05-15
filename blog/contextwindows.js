(function () {
  /* ═══════════════════════════════════════════════
     1. AUTO-INJECT SCOPED CSS
     ═══════════════════════════════════════════════ */
  var css = document.createElement("style");
  css.id = "cwlab-injected-styles";
  css.textContent = [

    /* ── Window Diagram ── */
    "#cwlab-window-diagram {",
    "  display: flex; align-items: stretch; justify-content: center;",
    "  gap: 0; margin: 24px 0; border-radius: 12px; overflow: hidden;",
    "  border: 2px solid #e2e8f0; height: 60px;",
    "}",
    ".cwlab-window-segment {",
    "  display: flex; align-items: center; justify-content: center;",
    "  font-size: 0.75em; font-weight: 700; padding: 4px 8px;",
    "  text-align: center; line-height: 1.3; white-space: nowrap;",
    "  overflow: hidden;",
    "}",

    /* ── Lost in Middle Diagram ── */
    "#cwlab-lost-middle-diagram {",
    "  margin: 24px 0; padding: 20px; background: #f8fafc;",
    "  border: 1px solid #e2e8f0; border-radius: 14px;",
    "}",
    ".cwlab-attention-bar-container {",
    "  display: flex; align-items: flex-end; gap: 2px;",
    "  height: 80px; margin: 12px 0;",
    "}",
    ".cwlab-attention-bar {",
    "  flex: 1; border-radius: 3px 3px 0 0; transition: height 0.3s;",
    "  min-width: 4px;",
    "}",
    ".cwlab-attention-labels {",
    "  display: flex; justify-content: space-between;",
    "  font-size: 0.8em; color: #64748b; margin-top: 6px;",
    "}",

    /* ── Compare Grid ── */
    "#cwlab-compare-grid {",
    "  display: grid; grid-template-columns: 1fr 1fr;",
    "  gap: 16px; margin: 18px 0;",
    "}",
    "@media (max-width: 640px) {",
    "  #cwlab-compare-grid { grid-template-columns: 1fr; }",
    "}",
    ".cwlab-compare-card {",
    "  background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px;",
    "  padding: 18px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);",
    "}",
    ".cwlab-compare-card ul {",
    "  margin-top: 10px; padding-left: 1.3em;",
    "}",
    ".cwlab-compare-card li {",
    "  margin-bottom: 6px; line-height: 1.6; font-size: 0.9em;",
    "}",
    ".cwlab-card-blue  { border-left: 4px solid #3b82f6; }",
    ".cwlab-card-green { border-left: 4px solid #10b981; }",
    ".cwlab-tag {",
    "  display: inline-block; padding: 2px 10px; border-radius: 99px;",
    "  font-size: 0.75em; font-weight: 700; letter-spacing: 0.04em;",
    "}",
    ".cwlab-tag-blue  { background: #dbeafe; color: #1d4ed8; }",
    ".cwlab-tag-green { background: #d1fae5; color: #065f46; }",

    /* ── Code Block ── */
    "pre.cwlab-code-block {",
    "  background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px;",
    "  padding: 16px 20px; margin: 18px 0; overflow-x: auto;",
    "  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;",
    "  font-size: 0.88em; line-height: 1.6; color: #334155;",
    "  white-space: pre; word-wrap: normal;",
    "  -webkit-user-select: text; user-select: text;",
    "}",
    "pre.cwlab-code-block code {",
    "  background: none; padding: 0; border-radius: 0; font-size: inherit;",
    "}",

    /* ── Interactive Demo ── */
    "#cwlab-demo-container {",
    "  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);",
    "  border: 1px solid #86efac; border-radius: 14px;",
    "  padding: 22px; margin: 22px 0;",
    "}",
    ".cwlab-demo-subtitle {",
    "  color: #64748b; font-size: 0.88em; margin-bottom: 12px;",
    "}",
    "#cwlab-controls {",
    "  display: flex; flex-wrap: wrap; gap: 10px; align-items: center;",
    "  margin-bottom: 14px;",
    "}",
    "#cwlab-controls label {",
    "  font-size: 0.9em;",
    "}",
    "#cwlab-model-select {",
    "  padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px;",
    "  font-size: 0.9em;",
    "}",
    "#cwlab-controls button {",
    "  padding: 8px 14px; border: none; border-radius: 8px;",
    "  cursor: pointer; font-weight: 600; font-size: 0.85em;",
    "  transition: filter 0.2s;",
    "}",
    "#cwlab-controls button:hover { filter: brightness(1.1); }",
    "#cwlab-add-msg-btn { background: #3b82f6; color: #fff; }",
    "#cwlab-add-rag-btn { background: #10b981; color: #fff; }",
    "#cwlab-reset-btn { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0 !important; }",

    "#cwlab-visualization {",
    "  background: #fff; border: 2px solid #e2e8f0; border-radius: 10px;",
    "  padding: 14px; min-height: 60px; position: relative; overflow: hidden;",
    "}",
    ".cwlab-viz-bar {",
    "  height: 36px; border-radius: 6px; display: flex;",
    "  overflow: hidden; margin-bottom: 8px;",
    "}",
    ".cwlab-viz-segment {",
    "  height: 100%; display: flex; align-items: center; justify-content: center;",
    "  font-size: 0.7em; font-weight: 700; color: #fff;",
    "  overflow: hidden; white-space: nowrap; transition: width 0.3s ease;",
    "  min-width: 0;",
    "}",
    ".cwlab-viz-label-row {",
    "  display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px;",
    "}",
    ".cwlab-viz-label {",
    "  display: flex; align-items: center; gap: 5px; font-size: 0.8em;",
    "}",
    ".cwlab-viz-dot {",
    "  width: 12px; height: 12px; border-radius: 3px;",
    "}",

    "#cwlab-stats {",
    "  margin-top: 10px; font-size: 0.88em; color: #334155;",
    "  line-height: 1.8;",
    "}",
    "#cwlab-stats strong { color: #1e40af; }",

    ".cwlab-details {",
    "  margin-top: 14px; font-size: 0.88em; color: #64748b;",
    "}",
    ".cwlab-details summary {",
    "  cursor: pointer; font-weight: 600;",
    "}",
    ".cwlab-details p {",
    "  margin-top: 8px; line-height: 1.6;",
    "}"

  ].join("\n");
  document.head.appendChild(css);

  /* ═══════════════════════════════════════════════
     2. RENDER CONTEXT WINDOW DIAGRAM
     ═══════════════════════════════════════════════ */
  function renderWindowDiagram() {
    var el = document.getElementById("cwlab-window-diagram");
    if (!el) return;

    var segments = [
      { label: "System Prompt", pct: 5, bg: "#3b82f6", fg: "#fff" },
      { label: "Conversation History", pct: 25, bg: "#f59e0b", fg: "#fff" },
      { label: "RAG / Retrieved Docs", pct: 30, bg: "#10b981", fg: "#fff" },
      { label: "Current Query", pct: 10, bg: "#8b5cf6", fg: "#fff" },
      { label: "Generation Space", pct: 15, bg: "#ef4444", fg: "#fff" },
      { label: "Unused", pct: 15, bg: "#e2e8f0", fg: "#64748b" }
    ];

    var html = "";
    for (var i = 0; i < segments.length; i++) {
      var s = segments[i];
      html += '<div class="cwlab-window-segment" style="width:' + s.pct +
              '%; background:' + s.bg + '; color:' + s.fg + ';">' +
              s.label + '</div>';
    }
    el.innerHTML = html;
  }

  /* ═══════════════════════════════════════════════
     3. RENDER "LOST IN THE MIDDLE" DIAGRAM
     ═══════════════════════════════════════════════ */
  function renderLostMiddleDiagram() {
    var el = document.getElementById("cwlab-lost-middle-diagram");
    if (!el) return;

    var numBars = 40;
    var html = '<p style="font-weight:700; margin-bottom:8px; font-size:0.9em;">Attention Distribution Across Context Position</p>';
    html += '<p style="font-size:0.82em; color:#64748b; margin-bottom:12px;">LLMs attend most to the beginning and end of context. Information in the middle receives less attention \u2014 the "Lost in the Middle" effect.</p>';
    html += '<div class="cwlab-attention-bar-container">';

    for (var i = 0; i < numBars; i++) {
      var pos = i / (numBars - 1); /* 0 to 1 */
      /* U-shaped attention: high at start and end, low in middle */
      var attention = 0.3 + 0.7 * (Math.pow(2 * pos - 1, 4));
      var height = Math.round(attention * 100);
      var hue = Math.round(attention * 120); /* 0=red, 120=green */
      var color = "hsl(" + hue + ", 70%, 50%)";
      html += '<div class="cwlab-attention-bar" style="height:' + height +
              '%; background:' + color + ';"></div>';
    }

    html += '</div>';
    html += '<div class="cwlab-attention-labels">';
    html += '<span>\u2190 Beginning (high attention)</span>';
    html += '<span>Middle (LOW attention) \u26A0\uFE0F</span>';
    html += '<span>End (high attention) \u2192</span>';
    html += '</div>';

    el.innerHTML = html;
  }

  /* ═══════════════════════════════════════════════
     4. INTERACTIVE CONTEXT WINDOW VISUALIZER
     ═══════════════════════════════════════════════ */

  var cwlab_state = {
    maxTokens: 128000,
    segments: [
      { label: "System", tokens: 500, color: "#3b82f6" }
    ],
    messageCount: 0
  };

  function cwlab_getTotalTokens() {
    var total = 0;
    for (var i = 0; i < cwlab_state.segments.length; i++) {
      total += cwlab_state.segments[i].tokens;
    }
    return total;
  }

  function cwlab_render() {
    var vizEl = document.getElementById("cwlab-visualization");
    var statsEl = document.getElementById("cwlab-stats");
    if (!vizEl || !statsEl) return;

    var total = cwlab_getTotalTokens();
    var max = cwlab_state.maxTokens;
    var pctUsed = Math.min((total / max) * 100, 100);

    /* Build bar */
    var barHtml = '<div class="cwlab-viz-bar">';
    for (var i = 0; i < cwlab_state.segments.length; i++) {
      var seg = cwlab_state.segments[i];
      var segPct = (seg.tokens / max) * 100;
      if (segPct < 0.3) segPct = 0.3; /* minimum visible width */
      var labelText = segPct > 4 ? seg.label : "";
      barHtml += '<div class="cwlab-viz-segment" style="width:' + segPct +
                 '%; background:' + seg.color + ';">' + labelText + '</div>';
    }
    /* Unused space */
    var unusedPct = Math.max(100 - pctUsed, 0);
    if (unusedPct > 0) {
      barHtml += '<div class="cwlab-viz-segment" style="width:' + unusedPct +
                 '%; background:#f1f5f9; color:#94a3b8;">' +
                 (unusedPct > 8 ? "Available" : "") + '</div>';
    }
    barHtml += '</div>';

    /* Legend */
    barHtml += '<div class="cwlab-viz-label-row">';
    barHtml += '<div class="cwlab-viz-label"><div class="cwlab-viz-dot" style="background:#3b82f6;"></div>System</div>';
    barHtml += '<div class="cwlab-viz-label"><div class="cwlab-viz-dot" style="background:#f59e0b;"></div>Messages</div>';
    barHtml += '<div class="cwlab-viz-label"><div class="cwlab-viz-dot" style="background:#10b981;"></div>RAG</div>';
    barHtml += '<div class="cwlab-viz-label"><div class="cwlab-viz-dot" style="background:#ef4444;"></div>Truncated</div>';
    barHtml += '<div class="cwlab-viz-label"><div class="cwlab-viz-dot" style="background:#eab308;"></div>Summarized</div>';
    barHtml += '<div class="cwlab-viz-label"><div class="cwlab-viz-dot" style="background:#f1f5f9; border:1px solid #cbd5e1;"></div>Available</div>';
    barHtml += '</div>';

    vizEl.innerHTML = barHtml;

    /* Stats */
    var overflowWarning = "";
    if (total > max) {
      overflowWarning = ' <span style="color:#ef4444; font-weight:700;">\u26A0\uFE0F OVERFLOW \u2014 oldest messages would be truncated or summarized!</span>';
    }

    statsEl.innerHTML =
      '<strong>Context used:</strong> ' + total.toLocaleString() + ' / ' + max.toLocaleString() + ' tokens (' + Math.min(Math.round(pctUsed), 100) + '%)' + overflowWarning +
      '<br><strong>Messages:</strong> ' + cwlab_state.messageCount +
      '<br><strong>Model:</strong> ' + max.toLocaleString() + ' token context window';
  }

  function cwlab_addMessage() {
    var tokens = 400 + Math.floor(Math.random() * 200); /* 400-600 tokens */
    cwlab_state.messageCount++;
    cwlab_state.segments.push({
      label: "Msg " + cwlab_state.messageCount,
      tokens: tokens,
      color: "#f59e0b"
    });

    /* Check overflow */
    var total = cwlab_getTotalTokens();
    if (total > cwlab_state.maxTokens) {
      /* Simulate truncation: mark oldest non-system message as truncated */
      for (var i = 1; i < cwlab_state.segments.length; i++) {
        if (cwlab_state.segments[i].color === "#f59e0b") {
          cwlab_state.segments[i].color = "#ef4444";
          cwlab_state.segments[i].label = "Truncated";
          cwlab_state.segments[i].tokens = Math.round(cwlab_state.segments[i].tokens * 0.1);
          break;
        }
      }
    }

    cwlab_render();
  }

  function cwlab_addRAG() {
    cwlab_state.segments.push({
      label: "RAG Chunks",
      tokens: 1500 + Math.floor(Math.random() * 1000),
      color: "#10b981"
    });

    cwlab_render();
  }

  function cwlab_reset() {
    cwlab_state.segments = [
      { label: "System", tokens: 500, color: "#3b82f6" }
    ];
    cwlab_state.messageCount = 0;
    cwlab_render();
  }

  function cwlab_modelChange() {
    var select = document.getElementById("cwlab-model-select");
    if (select) {
      cwlab_state.maxTokens = parseInt(select.value, 10);
      cwlab_render();
    }
  }

  /* ═══════════════════════════════════════════════
     5. INIT
     ═══════════════════════════════════════════════ */
  function cwlab_init() {
    renderWindowDiagram();
    renderLostMiddleDiagram();

    /* Interactive demo */
    var addMsgBtn = document.getElementById("cwlab-add-msg-btn");
    var addRagBtn = document.getElementById("cwlab-add-rag-btn");
    var resetBtn = document.getElementById("cwlab-reset-btn");
    var modelSelect = document.getElementById("cwlab-model-select");

    if (addMsgBtn) addMsgBtn.addEventListener("click", cwlab_addMessage);
    if (addRagBtn) addRagBtn.addEventListener("click", cwlab_addRAG);
    if (resetBtn) resetBtn.addEventListener("click", cwlab_reset);
    if (modelSelect) modelSelect.addEventListener("change", cwlab_modelChange);

    /* Initial render */
    cwlab_render();
  }

  /* ═══════════════════════════════════════════════
     6. PUBLIC LOADER (called by functions.js)
     ═══════════════════════════════════════════════ */
  window.loadContextwindowsModule = function () {
    if (typeof updateLoadingStatus === "function") {
      updateLoadingStatus("Loading Context Windows explainer\u2026");
    }
    cwlab_init();
    return Promise.resolve();
  };

  /* Also auto-init if DOM is already ready (standalone use) */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cwlab_init);
  } else {
    cwlab_init();
  }

})();
