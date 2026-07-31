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
    "  overflow: hidden; text-overflow: ellipsis; min-width: 0;",
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

    /* ── DARK MODE overrides ── */
    "html.dark .cwlab-tag-blue { background: #1e3a8a !important; color: #93c5fd !important; }",
    "html.dark .cwlab-tag-green { background: #022c22 !important; color: #6ee7b7 !important; }",
    "html.dark pre.cwlab-code-block { background: #1e293b; border-color: #334155; color: #e2e8f0; }",

    /* ── Lost in the Middle diagram + Context vs RAG comparison cards ── */
    "html.dark #cwlab-lost-middle-diagram { background: var(--mn-bg-subtle) !important; border-color: var(--mn-border) !important; color: var(--mn-text) !important; }",
    "html.dark #cwlab-lost-middle-diagram p[style*=\"color: #64748b\"], html.dark #cwlab-lost-middle-diagram p[style*=\"color:#64748b\"] { color: var(--mn-text-muted) !important; }",
    "html.dark #cwlab-lost-middle-diagram p { color: var(--mn-text) !important; }",
    "html.dark .cwlab-compare-card { background: var(--mn-surface) !important; border-color: var(--mn-border) !important; color: var(--mn-text) !important; }",
    "html.dark .cwlab-compare-card li { color: var(--mn-text) !important; }",
    "html.dark .cwlab-compare-card strong { color: var(--mn-text) !important; }",
    "html.dark .cwlab-attention-labels { color: var(--mn-text-muted) !important; }",
    "html.dark .cwlab-attention-labels span { color: var(--mn-text-muted) !important; }"

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
     4. INIT
     ═══════════════════════════════════════════════ */
  function cwlab_init() {
    renderWindowDiagram();
    renderLostMiddleDiagram();
  }

  /* ═══════════════════════════════════════════════
     5. PUBLIC LOADER (called by functions.js)
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
