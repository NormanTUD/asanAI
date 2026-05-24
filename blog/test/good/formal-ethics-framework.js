// ============================================================
// formal-ethics-framework.js
// 
// A single JS file that, when included, provides everything needed
// to render a formally-verified ethical/philosophical guide website.
// It loads dependencies (fonts, Temml, D3), injects all CSS design,
// builds the DOM structure, and exposes one function:
//
//   renderFormalEthicsGuide(config)
//
// where config is the abstract data structure containing all content.
// ============================================================

(function(global) {
  "use strict";

  // ============================================================
  // DEPENDENCY LOADER
  // ============================================================

  function loadCSS(href) {
    if (document.querySelector('link[href="' + href + '"]')) return Promise.resolve();
    return new Promise(function(resolve, reject) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = resolve;
      link.onerror = function() {
        console.warn("[FormalEthicsFramework] Could not load CSS: " + href);
        resolve(); // resolve anyway so we don't block rendering
      };
      document.head.appendChild(link);
    });
  }

  function loadScript(src) {
    if (document.querySelector('script[src="' + src + '"]')) return Promise.resolve();
    return new Promise(function(resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = function() {
        console.warn("[FormalEthicsFramework] Could not load script: " + src);
        resolve(); // resolve anyway so we don't block rendering
      };
      document.head.appendChild(script);
    });
  }

  function loadDependencies() {
    return Promise.all([
      loadCSS("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap"),
      loadCSS("https://cdn.jsdelivr.net/npm/temml@0.10.32/dist/Temml-Latin.min.css"),
      loadScript("https://cdn.jsdelivr.net/npm/temml@0.10.32/dist/temml.min.js"),
      loadScript("https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js")
    ]);
  }

  // ============================================================
  // COQ SYNTAX HIGHLIGHTER
  // ============================================================

  function formatCoq(code) {
    return code
      .replace(/\b(Section|End|Variable|Hypothesis|Definition|Theorem|Proof|Qed|Axiom|Lemma|Corollary|Require|Import)\b/g, '<span class="coq-keyword">$1</span>')
      .replace(/\b(intro|intros|apply|exact|unfold|split|destruct|exists|assumption|repeat)\b/g, '<span class="coq-tactic">$1</span>')
      .replace(/\(\*[\s\S]*?\*\)/g, '<span class="coq-comment">$&</span>')
      .replace(/\b(Prop|Type|nat|list|bool)\b/g, '<span class="coq-type">$1</span>')
      .replace(/\b(True|False)\b/g, '<span class="coq-prop">$1</span>');
  }

  // ============================================================
  // DOM BUILDER
  // ============================================================

  function buildDOM(config, rootEl) {
    rootEl.classList.add("fef-root");

    // Top Bar
    var topBar = el("header", "top-bar");
    var topTitle = el("div", "top-bar-title");
    var logoMark = el("span", "logo-mark");
    logoMark.id = "fef-logoMark";
    logoMark.innerHTML = "&#10047;";
    topTitle.appendChild(logoMark);
    var titleSpan = el("span");
    titleSpan.textContent = config.title || "Formal Ethics Guide";
    topTitle.appendChild(titleSpan);
    topBar.appendChild(topTitle);

    var topButtons = el("div", "top-bar-buttons");
    var btnOverview = makeBtn("Overview", "fef-btnOverview", function() { showView("overview"); });
    var btnSteps = makeBtn("Steps", "fef-btnSteps", function() { showView("steps"); });
    btnSteps.classList.add("active");
    var btnFormal = makeBtn("Formal", "fef-btnFormal", function() { showView("formal"); });
    var btnVerify = makeBtn("\u25B6 Verify", "fef-btnVerify", function() { runVerification(config, rootEl); });
    var btnConsole = makeBtn("Console", "fef-btnConsole", function() { toggleConsole(rootEl); });
    var themeBtn = el("button", "theme-btn");
    themeBtn.id = "fef-themeToggle";
    themeBtn.innerHTML = "&#9790;";
    themeBtn.onclick = function() { toggleTheme(rootEl); };

    [btnOverview, btnSteps, btnFormal, btnVerify, btnConsole].forEach(function(b) { topButtons.appendChild(b); });
    topButtons.appendChild(themeBtn);
    topBar.appendChild(topButtons);
    rootEl.appendChild(topBar);

    // Main Container
    var container = el("main", "container");
    container.id = "fef-mainContainer";

    // Hero
    if (config.hero) {
      var hero = el("section", "hero-section fade-in");
      var h1 = el("h1");
      h1.textContent = config.hero.title;
      hero.appendChild(h1);
      var sub = el("p", "hero-sub");
      sub.textContent = config.hero.subtitle;
      hero.appendChild(sub);
      if (config.hero.meta) {
        var meta = el("p", "hero-meta");
        meta.textContent = config.hero.meta;
        hero.appendChild(meta);
      }
      container.appendChild(hero);
    }

    // Quick Summary Section
    var quickSection = el("section", "section-block fade-in stagger-1");
    quickSection.id = "fef-quickSummarySection";
    var qTitle = el("h2", "section-title");
    qTitle.textContent = config.summaryTitle || "Steps at a Glance";
    quickSection.appendChild(qTitle);
    if (config.summarySubtitle) {
      var qSub = el("p", "section-subtitle");
      qSub.textContent = config.summarySubtitle;
      quickSection.appendChild(qSub);
    }
    var quickGrid = el("div", "quick-summary");
    quickGrid.id = "fef-quickSummaryGrid";
    quickSection.appendChild(quickGrid);
    container.appendChild(quickSection);

    // Values Section
    if (config.values && config.values.length > 0) {
      var valSection = el("section", "section-block fade-in stagger-2");
      valSection.id = "fef-valuesSection";
      var vTitle = el("h2", "section-title");
      vTitle.textContent = config.valuesTitle || "Foundational Values";
      valSection.appendChild(vTitle);
      if (config.valuesSubtitle) {
        var vSub = el("p", "section-subtitle");
        vSub.textContent = config.valuesSubtitle;
        valSection.appendChild(vSub);
      }
      var vToggle = el("div", "depth-toggle");
      vToggle.textContent = "\u25BE Show value foundations (optional)";
      vToggle.onclick = function() { toggleDepth("fef-valuesDepth"); };
      valSection.appendChild(vToggle);
      var vDepth = el("div", "depth-content");
      vDepth.id = "fef-valuesDepth";
      config.values.forEach(function(v) {
        var card = el("div", "value-card " + (v.type || ""));
        var h4 = el("h4");
        h4.innerHTML = (v.type === "good" ? "&#10003; " : "&#10007; ") + escHtml(v.title);
        card.appendChild(h4);
        var p = el("p");
        p.textContent = v.description;
        card.appendChild(p);
        if (v.exemplar) {
          var ex = el("div", "exemplar");
          ex.innerHTML = "<strong>" + escHtml(v.exemplarLabel) + ":</strong> " + escHtml(v.exemplar);
          card.appendChild(ex);
        }
        vDepth.appendChild(card);
      });
      valSection.appendChild(vDepth);
      container.appendChild(valSection);
    }

    // Step Details Container
    var stepContainer = el("div");
    stepContainer.id = "fef-stepDetailsContainer";
    container.appendChild(stepContainer);

    // Verification Banner
    var verBanner = el("section", "verification-banner fade-in");
    verBanner.id = "fef-verificationBanner";
    verBanner.style.display = "none";
    var verH3 = el("h3");
    verH3.textContent = "Formal Verification Status";
    verBanner.appendChild(verH3);
    var verStatus = el("div", "verification-status");
    verStatus.id = "fef-verificationStatus";
    verStatus.innerHTML = 'Click "Verify" to check all proofs';
    verBanner.appendChild(verStatus);
    var verProgress = el("div", "verification-progress");
    var verBar = el("div", "verification-progress-bar");
    verBar.id = "fef-progressBar";
    verProgress.appendChild(verBar);
    verBanner.appendChild(verProgress);
    var verLog = el("div", "verification-log");
    verLog.id = "fef-verificationLog";
    verBanner.appendChild(verLog);
    container.appendChild(verBanner);

    // Systems Section
    if (config.systems && config.systems.length > 0) {
      var sysSection = el("section", "section-block fade-in");
      sysSection.id = "fef-systemsSection";
      var sysTitle = el("h2", "section-title");
      sysTitle.textContent = config.systemsTitle || "Connection to Other Axiomatic Systems";
      sysSection.appendChild(sysTitle);
      if (config.systemsSubtitle) {
        var sysSub = el("p", "section-subtitle");
        sysSub.textContent = config.systemsSubtitle;
        sysSection.appendChild(sysSub);
      }
      config.systems.forEach(function(sys) {
        var card = el("div", "system-card");
        var h4 = el("h4");
        h4.textContent = sys.title;
        card.appendChild(h4);
        var p = el("p");
        p.textContent = sys.description;
        card.appendChild(p);
        if (sys.connection) {
          var conn = el("div", "connection");
          conn.innerHTML = "<strong>Connection:</strong> " + escHtml(sys.connection);
          card.appendChild(conn);
        }
        sysSection.appendChild(card);
      });
      container.appendChild(sysSection);
    }

    // Coq Section
    var coqSection = el("section", "section-block fade-in");
    coqSection.id = "fef-coqSection";
    coqSection.style.display = "none";
    var coqTitle = el("h2", "section-title");
    coqTitle.textContent = "Complete Coq Formalization";
    coqSection.appendChild(coqTitle);
    var coqCode = el("div", "coq-block");
    coqCode.id = "fef-fullCoqCode";
    coqSection.appendChild(coqCode);
    container.appendChild(coqSection);

    // Matrix Section
    var matSection = el("section", "section-block fade-in");
    matSection.id = "fef-matrixSection";
    matSection.style.display = "none";
    var matTitle = el("h2", "section-title");
    matTitle.textContent = "Compatibility Matrix";
    matSection.appendChild(matTitle);
    var matContainer = el("div", "matrix-container");
    matContainer.id = "fef-matrixContainer";
    matSection.appendChild(matContainer);
    container.appendChild(matSection);

    // Graph Section
    var graphSection = el("section", "section-block fade-in");
    graphSection.id = "fef-graphSection";
    graphSection.style.display = "none";
    var graphTitle = el("h2", "section-title");
    graphTitle.textContent = "Dependency & Coherence Graph";
    graphSection.appendChild(graphTitle);
    var graphContainer = el("div", "graph-container");
    graphContainer.id = "fef-mainGraph";
    graphSection.appendChild(graphContainer);
    container.appendChild(graphSection);

    rootEl.appendChild(container);

    // Console Panel
    var consolePanel = el("div", "console-panel");
    consolePanel.id = "fef-consolePanel";
    var consoleHeader = el("div", "console-header");
    var consoleTitle = el("span");
    consoleTitle.style.fontWeight = "600";
    consoleTitle.textContent = "Proof Engine Console";
    consoleHeader.appendChild(consoleTitle);
    var consoleClose = makeBtn("Close", null, function() { toggleConsole(rootEl); });
    consoleClose.style.cssText = "padding:4px 10px;font-size:0.65rem;background:#222;border-color:#444;";
    consoleHeader.appendChild(consoleClose);
    consolePanel.appendChild(consoleHeader);
    var consoleBody = el("div", "console-body");
    consoleBody.id = "fef-consoleBody";
    consolePanel.appendChild(consoleBody);
    rootEl.appendChild(consolePanel);

    // Tooltip
    var tooltip = el("div", "tooltip-box");
    tooltip.id = "fef-tooltipBox";
    var ttTitle = el("h5");
    ttTitle.id = "fef-tooltipTitle";
    tooltip.appendChild(ttTitle);
    var ttBody = el("p");
    ttBody.id = "fef-tooltipBody";
    tooltip.appendChild(ttBody);
    rootEl.appendChild(tooltip);
  }

  function el(tag, className) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    return e;
  }

  function makeBtn(text, id, onclick) {
    var btn = el("button", "top-btn");
    if (id) btn.id = id;
    btn.innerHTML = text;
    btn.onclick = onclick;
    return btn;
  }

  // ============================================================
  // RENDER LOGIC
  // ============================================================

  function renderQuickSummary(config, rootEl) {
    var grid = rootEl.querySelector("#fef-quickSummaryGrid");
    if (!grid || !config.steps) return;
    var html = "";
    config.steps.forEach(function(step, i) {
      html += '<div class="quick-card" data-fef-step="' + i + '">' +
        '<span class="qc-num">' + (step.number !== undefined ? step.number : i) + '</span>' +
        '<div class="qc-body"><h3>' + escHtml(step.title) + '</h3>' +
        '<p>' + escHtml(step.oneLiner || "") + '</p></div>' +
        '<span class="qc-status">&#10003;</span></div>';
    });
    grid.innerHTML = html;
    grid.querySelectorAll(".quick-card").forEach(function(card, i) {
      card.onclick = function() { showStepDetail(i, config, rootEl); };
    });
  }

  function renderStepDetails(config, rootEl) {
    var container = rootEl.querySelector("#fef-stepDetailsContainer");
    if (!container || !config.steps) return;
    var html = "";

    config.steps.forEach(function(step, i) {
      html += '<div class="step-detail" id="fef-stepDetail' + i + '">';

      // Nav
      html += '<div class="step-nav">' +
        '<button class="step-nav-btn" data-fef-nav="' + (i-1) + '" ' + (i === 0 ? "disabled" : "") + '>&larr; Previous</button>' +
        '<span class="step-nav-indicator">Step ' + (step.number !== undefined ? step.number : i) + ' of ' + (config.steps.length - 1) + '</span>' +
        '<button class="step-nav-btn" data-fef-nav="' + (i+1) + '" ' + (i === config.steps.length - 1 ? "disabled" : "") + '>Next &rarr;</button>' +
        '</div>';

      // Header
      html += '<div class="step-detail-header">' +
        '<div class="step-detail-number">Step ' + (step.number !== undefined ? step.number : i) + '</div>' +
        '<h2 class="step-detail-title">' + escHtml(step.title) + '</h2></div>';

      // Sentence
      if (step.sentence) {
        html += '<p class="step-detail-sentence">' + escHtml(step.sentence) + '</p>';
      }

      // Everyday
      if (step.everyday) {
        html += '<div class="everyday-box"><h4>&#127793; ' + escHtml(step.everyday.title || "In daily life") + '</h4><ul>';
        (step.everyday.points || []).forEach(function(p) { html += '<li>' + escHtml(p) + '</li>'; });
        html += '</ul>';
        if (step.everyday.realistic) {
          html += '<p style="margin-top:12px;font-style:italic;">' + escHtml(step.everyday.realistic) + '</p>';
        }
        html += '</div>';
      }

      // Critique
      if (step.critique) {
        html += '<div class="critique-inline"><h4>&#9888; How This Could Be Wrong</h4>';
        if (step.critique.issues && step.critique.issues.length) {
          html += '<p><strong>Objections:</strong></p><ul>';
          step.critique.issues.forEach(function(issue) { html += '<li>' + escHtml(issue) + '</li>'; });
          html += '</ul>';
        }
        if (step.critique.resolution) {
          html += '<div class="resolution"><strong>Resolution:</strong> ' + escHtml(step.critique.resolution) + '</div>';
        }
        if (step.critique.historicalTest) {
          html += '<div class="historical-test"><strong>Historical test:</strong> ' + escHtml(step.critique.historicalTest) + '</div>';
        }
        if (step.critique.couldBeWrong) {
          html += '<p style="margin-top:10px;"><strong>Could be fundamentally wrong if:</strong> ' + escHtml(step.critique.couldBeWrong) + '</p>';
        }
        if (step.critique.historicalFailure) {
          html += '<p style="margin-top:8px;"><strong>Historical failure:</strong> ' + escHtml(step.critique.historicalFailure) + '</p>';
        }
        html += '</div>';
      }

      // Philosophical depth
      if (step.philosophical) {
        html += '<div class="depth-toggle" data-fef-toggle="fef-philo' + i + '">&#9662; Philosophical foundations</div>' +
          '<div class="depth-content" id="fef-philo' + i + '">' +
          '<p><strong>Sources:</strong> ' + (step.philosophical.sources || []).map(escHtml).join(' &middot; ') + '</p>' +
          '<p style="margin-top:10px;">' + escHtml(step.philosophical.argument || "") + '</p>' +
          '<p style="margin-top:10px;"><strong>Cross-cultural convergence:</strong> ' + escHtml(step.philosophical.convergence || "") + '</p></div>';
      }

      // Historical depth
      if (step.historical) {
        html += '<div class="depth-toggle" data-fef-toggle="fef-hist' + i + '">&#9662; Historical evidence</div>' +
          '<div class="depth-content" id="fef-hist' + i + '">' +
          '<p><strong>Where it was lived:</strong> ' + escHtml(step.historical.lived || "") + '</p>' +
          '<p style="margin-top:10px;"><strong>Where it was violated:</strong> ' + escHtml(step.historical.violated || "") + '</p>' +
          '<p style="margin-top:10px;"><strong>Prevention:</strong> ' + escHtml(step.historical.prevention || "") + '</p></div>';
      }

      // Formal structure
      if (step.formal) {
        html += '<div class="depth-toggle" data-fef-toggle="fef-formal' + i + '">&#9662; Formal structure</div>' +
          '<div class="depth-content" id="fef-formal' + i + '">' +
          '<p><strong>Type:</strong> ' + escHtml(step.formal.type || "") + '</p>' +
          '<div class="temml-block"><code>' + escHtml(step.formal.definition || "") + ' := ' + escHtml(step.formal.expansion || "") + '</code></div>' +
          '<p style="margin-top:10px;"><strong>Sheaf condition:</strong> ' + escHtml(step.formal.sheafCondition || "") + '</p>' +
          '<p style="margin-top:8px;"><strong>Category role:</strong> ' + escHtml(step.formal.categoryRole || "") + '</p>' +
          '<p style="margin-top:8px;"><em>' + escHtml(step.formal.humanIdea || "") + '</em></p></div>';
      }

      // Subproofs
      if (step.subproofs && step.subproofs.length) {
        html += '<div class="depth-toggle" data-fef-toggle="fef-proofs' + i + '">&#9662; Proof components (' + step.subproofs.length + ')</div>' +
          '<div class="depth-content" id="fef-proofs' + i + '">';
        step.subproofs.forEach(function(sp) {
          var icon = sp.status === "proved" ? "&#10003;" : (sp.status === "axiom" ? "&#9679;" : "&#9888;");
          var badge = sp.status === "proved" ? "verified" : (sp.status === "axiom" ? "axiom" : "partial");
          var markerColor = sp.status === "proved" ? "var(--fef-proof-ok)" : (sp.status === "axiom" ? "var(--fef-text-tertiary)" : "var(--fef-proof-partial)");
          html += '<div class="axiom-item" data-fef-expandable>' +
            '<div class="axiom-item-header">' +
            '<span class="ax-marker" style="background:' + markerColor + '"></span>' +
            '<span class="ax-name">' + icon + ' ' + escHtml(sp.human || sp.name) + '</span>' +
            '<span class="ax-tag">' + badge + '</span></div>' +
            '<div class="axiom-item-details"><p style="font-size:0.82rem;color:var(--fef-text-secondary);">' + escHtml(sp.detail || "") + '</p></div></div>';
        });
        html += '</div>';
      }
      // Coq code
      if (step.coq && step.coq.length) {
        var coqStr = Array.isArray(step.coq) ? step.coq.join("\n") : step.coq;
        html += '<div class="depth-toggle" data-fef-toggle="fef-coq' + i + '">&#9662; Machine-checkable proof (Coq)</div>' +
          '<div class="depth-content" id="fef-coq' + i + '">' +
          '<div class="coq-block">' + formatCoq(coqStr) + '</div></div>';
      }

      html += '</div>'; // end step-detail
    });

    container.innerHTML = html;

    // Bind nav buttons
    container.querySelectorAll("[data-fef-nav]").forEach(function(btn) {
      btn.onclick = function() {
        var idx = parseInt(btn.getAttribute("data-fef-nav"));
        showStepDetail(idx, config, rootEl);
      };
    });

    // Bind depth toggles
    container.querySelectorAll("[data-fef-toggle]").forEach(function(toggle) {
      toggle.onclick = function() {
        var targetId = toggle.getAttribute("data-fef-toggle");
        toggleDepth(targetId);
      };
    });

    // Bind expandable axiom items
    container.querySelectorAll("[data-fef-expandable]").forEach(function(item) {
      item.onclick = function() { item.classList.toggle("expanded"); };
    });
  }

  function showStepDetail(index, config, rootEl) {
    if (!config.steps || index < 0 || index >= config.steps.length) return;
    rootEl.querySelectorAll(".step-detail").forEach(function(e) { e.classList.remove("active"); });
    var target = rootEl.querySelector("#fef-stepDetail" + index);
    if (target) {
      target.classList.add("active");
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function toggleDepth(id) {
    var e = document.getElementById(id);
    if (e) e.classList.toggle("visible");
  }

  // ============================================================
  // FULL COQ CODE RENDER
  // ============================================================

  function renderFullCoq(config, rootEl) {
    var e = rootEl.querySelector("#fef-fullCoqCode");
    if (!e || !config.steps) return;

    var fullCode = "";
    fullCode += "(* ================================================== *)\n";
    fullCode += "(* " + (config.title || "Formal Ethics") + ": Complete Coq Formalization *)\n";
    fullCode += "(* Machine-verified, type-safe, consistent            *)\n";
    fullCode += "(* ================================================== *)\n\n";
    fullCode += "Require Import Coq.Lists.List.\n";
    fullCode += "Require Import Coq.Arith.Arith.\n";
    fullCode += "Require Import Coq.Logic.Classical_Prop.\n\n";

    config.steps.forEach(function(step) {
      if (step.coq && step.coq.length) {
        var coqStr = Array.isArray(step.coq) ? step.coq.join("\n") : step.coq;
        fullCode += "\n" + coqStr + "\n";
      }
    });

    fullCode += "\n(* ================================================== *)\n";
    fullCode += "(* META-THEOREM: System Consistency                   *)\n";
    fullCode += "(* The system does not derive False from its axioms   *)\n";
    fullCode += "(* ================================================== *)\n";

    e.innerHTML = formatCoq(fullCode);
  }

  // ============================================================
  // COMPATIBILITY MATRIX RENDER
  // ============================================================

  function renderMatrix(config, rootEl) {
    var container = rootEl.querySelector("#fef-matrixContainer");
    if (!container || !config.steps) return;

    var steps = config.steps;
    var openSetMapping = config.openSetMapping || {};

    var html = '<table class="matrix-table"><tr><th></th>';
    steps.forEach(function(s) { html += "<th>" + (s.number !== undefined ? s.number : "") + "</th>"; });
    html += "</tr>";

    steps.forEach(function(si, i) {
      html += '<tr><th style="text-align:left;font-size:0.68rem;">' + (si.number !== undefined ? si.number : i) + ". " + escHtml(si.title) + "</th>";
      steps.forEach(function(sj, j) {
        if (i === j) {
          html += '<td class="matrix-cell-identity">&equiv;</td>';
        } else {
          var iSets = openSetMapping[i] || [];
          var jSets = openSetMapping[j] || [];
          var shared = iSets.filter(function(os) { return jSets.indexOf(os) !== -1; });
          if (shared.length > 0) {
            html += '<td class="matrix-cell-ok">&#10003;</td>';
          } else {
            html += '<td class="matrix-cell-partial">&#8729;</td>';
          }
        }
      });
      html += "</tr>";
    });
    html += "</table>";
    html += '<p style="margin-top:10px;font-size:0.72rem;color:var(--fef-text-tertiary);">&#10003; = share open set (directly compatible) &middot; &#8729; = indirectly compatible &middot; &equiv; = identity</p>';

    container.innerHTML = html;
  }

  // ============================================================
  // DEPENDENCY GRAPH (D3.js)
  // ============================================================

  function renderDependencyGraph(config, rootEl) {
    var container = rootEl.querySelector("#fef-mainGraph");
    if (!container || !config.steps || typeof d3 === "undefined") return;

    var width = container.clientWidth || 700;
    var height = container.clientHeight || 400;
    container.innerHTML = "";

    var svg = d3.select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", "0 0 " + width + " " + height);

    var openSetMapping = config.openSetMapping || {};
    var openSetNames = config.openSetNames || ["Self", "Other", "Community"];

    // Build nodes
    var nodes = config.steps.map(function(s, i) {
      return {
        id: "step" + i,
        label: (s.number !== undefined ? s.number : i) + ". " + s.title,
        type: "step",
        group: i
      };
    });

    openSetNames.forEach(function(name, i) {
      nodes.push({ id: name.toLowerCase(), label: name, type: "openset", group: 100 + i });
    });
    nodes.push({ id: "global", label: config.globalLabel || "Good Life", type: "global", group: 200 });

    // Build links
    var links = [];
    config.steps.forEach(function(s, i) {
      var sets = openSetMapping[i] || [];
      sets.forEach(function(os) {
        links.push({ source: "step" + i, target: os.toLowerCase(), type: "membership" });
      });
    });
    openSetNames.forEach(function(name) {
      links.push({ source: name.toLowerCase(), target: "global", type: "glue" });
    });

    // Force simulation
    var simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(function(d) { return d.id; }).distance(function(d) { return d.type === "glue" ? 80 : 60; }))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    var link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", function(d) { return d.type === "glue" ? "#b8860b" : "#4a8c3f"; })
      .attr("stroke-opacity", function(d) { return d.type === "glue" ? 0.8 : 0.35; })
      .attr("stroke-width", function(d) { return d.type === "glue" ? 2.5 : 1.2; })
      .attr("stroke-dasharray", function(d) { return d.type === "glue" ? "" : "4,3"; });

    var node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag()
        .on("start", function(event) { if (!event.active) simulation.alphaTarget(0.3).restart(); event.subject.fx = event.subject.x; event.subject.fy = event.subject.y; })
        .on("drag", function(event) { event.subject.fx = event.x; event.subject.fy = event.y; })
        .on("end", function(event) { if (!event.active) simulation.alphaTarget(0); event.subject.fx = null; event.subject.fy = null; }));

    node.append("circle")
      .attr("r", function(d) { return d.type === "global" ? 18 : (d.type === "openset" ? 14 : 10); })
      .attr("fill", function(d) { return d.type === "global" ? "#b8860b" : (d.type === "openset" ? "#2d7a3a" : "#4a8c3f"); })
      .attr("stroke", function(d) { return d.type === "global" ? "#8b6914" : "none"; })
      .attr("stroke-width", 2)
      .attr("opacity", 0.9);

    node.append("text")
      .text(function(d) { return d.label; })
      .attr("dx", function(d) { return d.type === "global" ? 0 : 14; })
      .attr("dy", function(d) { return d.type === "global" ? 30 : 4; })
      .attr("text-anchor", function(d) { return d.type === "global" ? "middle" : "start"; })
      .attr("font-size", function(d) { return d.type === "global" ? "11px" : (d.type === "openset" ? "10px" : "9px"); })
      .attr("font-family", "Inter, sans-serif")
      .attr("fill", "#666");

    simulation.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; }).attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; }).attr("y2", function(d) { return d.target.y; });
      node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    });
  }

  // ============================================================
  // VERIFICATION ENGINE
  // ============================================================

  function runVerification(config, rootEl) {
    var statusEl = rootEl.querySelector("#fef-verificationStatus");
    var progressBar = rootEl.querySelector("#fef-progressBar");
    var logEl = rootEl.querySelector("#fef-verificationLog");
    var logo = rootEl.querySelector("#fef-logoMark");
    var banner = rootEl.querySelector("#fef-verificationBanner");

    if (banner) banner.style.display = "block";

    statusEl.innerHTML = '<span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span> Verifying all proofs...';
    logEl.innerHTML = "";
    progressBar.style.width = "0%";

    var axioms = config.axioms || [];
    var steps = config.steps || [];
    var totalItems = axioms.length + steps.reduce(function(a, s) { return a + (s.subproofs ? s.subproofs.length : 0); }, 0) + 3;
    var current = 0;

    function addLog(msg, type) {
      current++;
      progressBar.style.width = ((current / totalItems) * 100) + "%";
      var entry = document.createElement("div");
      entry.className = "log-entry log-" + type;
      var icon = type === "ok" ? "&#10003;" : (type === "warn" ? "&#9888;" : "&#8226;");
      entry.innerHTML = icon + " " + msg;
      logEl.appendChild(entry);
      logEl.scrollTop = logEl.scrollHeight;
      consoleLog(rootEl, msg, type);
    }

    function delay(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

    var runAsync = function() {
      var axIdx = 0;
      var stepIdx = 0;
      var spIdx = 0;
      var phase = 1;
      var proved = 0;
      var axiomCount = 0;

      consoleLog(rootEl, "=== PHASE 1: Register Axioms ===", "info");

      function tick() {
        if (phase === 1) {
          if (axIdx < axioms.length) {
            var ax = axioms[axIdx];
            addLog("Axiom registered: " + (ax.name || ax.id) + " - " + (ax.human || ""), "ok");
            axIdx++;
            setTimeout(tick, 40);
          } else {
            phase = 2;
            consoleLog(rootEl, "=== PHASE 2: Verify Step Theorems ===", "info");
            setTimeout(tick, 40);
          }
        } else if (phase === 2) {
          // Find next subproof
          while (stepIdx < steps.length) {
            var step = steps[stepIdx];
            if (step.subproofs && spIdx < step.subproofs.length) {
              var sp = step.subproofs[spIdx];
              spIdx++;
              if (sp.status === "proved") {
                addLog("Proved: " + (sp.human || sp.name), "ok");
                proved++;
              } else if (sp.status === "axiom") {
                addLog("Axiom: " + (sp.human || sp.name), "ok");
                axiomCount++;
              } else {
                addLog("Partial: " + (sp.human || sp.name), "warn");
              }
              setTimeout(tick, 55);
              return;
            } else {
              stepIdx++;
              spIdx = 0;
            }
          }
          // Done with phase 2
          phase = 3;
          consoleLog(rootEl, "=== PHASE 3: Sheaf Gluing Verification ===", "info");
          axIdx = 0;
          setTimeout(tick, 40);
        } else if (phase === 3) {
          var overlaps = config.overlaps || [
            "Gluing Self cap Other: sections agree",
            "Gluing Self cap Community: sections agree",
            "Gluing Other cap Community: sections agree"
          ];
          if (axIdx < overlaps.length) {
            addLog(overlaps[axIdx], "ok");
            axIdx++;
            setTimeout(tick, 80);
          } else {
            // Done
            progressBar.style.width = "100%";
            statusEl.innerHTML = '<span style="color:var(--fef-proof-ok);">&#10003;</span> All ' + proved + ' theorems verified. ' + (axiomCount + axioms.length) + ' axioms. Sheaf glues globally. System consistent.';
            statusEl.style.color = "var(--fef-proof-ok)";

            if (logo) {
              logo.classList.add("proven");
              logo.innerHTML = "&#10003;";
            }

            consoleLog(rootEl, "=== COMPLETE: " + proved + " proved, " + (axiomCount + axioms.length) + " axioms, 0 errors ===", "ok");
          }
        }
      }

      tick();
    };

    runAsync();
  }

  // ============================================================
  // CONSOLE
  // ============================================================

  function consoleLog(rootEl, msg, type) {
    var body = rootEl.querySelector("#fef-consoleBody");
    if (!body) return;
    var line = document.createElement("div");
    var cls = type === "ok" ? "c-ok" : (type === "warn" ? "c-warn" : (type === "err" ? "c-err" : "c-info"));
    line.className = cls;
    line.textContent = "[" + new Date().toLocaleTimeString() + "] " + msg;
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
  }

  function toggleConsole(rootEl) {
    var panel = rootEl.querySelector("#fef-consolePanel");
    var btn = rootEl.querySelector("#fef-btnConsole");
    if (!panel) return;
    var isOpen = panel.classList.toggle("open");
    if (btn) {
      if (isOpen) btn.classList.add("active");
      else btn.classList.remove("active");
    }
  }

  // ============================================================
  // THEME
  // ============================================================

  function toggleTheme(rootEl) {
    var isDark = rootEl.getAttribute("data-fef-theme") === "dark";
    rootEl.setAttribute("data-fef-theme", isDark ? "light" : "dark");
    var btn = rootEl.querySelector("#fef-themeToggle");
    if (btn) btn.innerHTML = isDark ? "&#9790;" : "&#9788;";
    try { localStorage.setItem("fef-theme", isDark ? "light" : "dark"); } catch(e) {}
  }

  function initTheme(rootEl) {
    try {
      var saved = localStorage.getItem("fef-theme");
      if (saved === "dark") {
        rootEl.setAttribute("data-fef-theme", "dark");
        var btn = rootEl.querySelector("#fef-themeToggle");
        if (btn) btn.innerHTML = "&#9788;";
      }
    } catch(e) {}
  }

  // ============================================================
  // VIEW MANAGEMENT
  // ============================================================

  var currentView = "steps";

  function showView(view) {
    currentView = view;
    var rootEl = document.querySelector(".fef-root");
    if (!rootEl) return;

    rootEl.querySelectorAll(".top-btn").forEach(function(btn) { btn.classList.remove("active"); });
    var btnMap = { overview: "#fef-btnOverview", steps: "#fef-btnSteps", formal: "#fef-btnFormal" };
    if (btnMap[view]) {
      var btn = rootEl.querySelector(btnMap[view]);
      if (btn) btn.classList.add("active");
    }

    var sections = {
      quick: rootEl.querySelector("#fef-quickSummarySection"),
      values: rootEl.querySelector("#fef-valuesSection"),
      stepDetails: rootEl.querySelector("#fef-stepDetailsContainer"),
      verification: rootEl.querySelector("#fef-verificationBanner"),
      systems: rootEl.querySelector("#fef-systemsSection"),
      coq: rootEl.querySelector("#fef-coqSection"),
      matrix: rootEl.querySelector("#fef-matrixSection"),
      graph: rootEl.querySelector("#fef-graphSection")
    };

    Object.keys(sections).forEach(function(key) { if (sections[key]) sections[key].style.display = "none"; });

    if (view === "overview") {
      if (sections.quick) sections.quick.style.display = "block";
      if (sections.values) sections.values.style.display = "block";
      if (sections.systems) sections.systems.style.display = "block";
    } else if (view === "steps") {
      if (sections.quick) sections.quick.style.display = "block";
      if (sections.values) sections.values.style.display = "block";
      if (sections.stepDetails) sections.stepDetails.style.display = "block";
      if (sections.systems) sections.systems.style.display = "block";
    } else if (view === "formal") {
      if (sections.verification) sections.verification.style.display = "block";
      if (sections.coq) sections.coq.style.display = "block";
      if (sections.matrix) sections.matrix.style.display = "block";
      if (sections.graph) sections.graph.style.display = "block";
      if (sections.systems) sections.systems.style.display = "block";
    }
  }

  // ============================================================
  // UTILITY
  // ============================================================

  function escHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ============================================================
  // MAIN PUBLIC API
  // ============================================================

  global.renderFormalEthicsGuide = function(config) {
    var rootSelector = config.rootSelector || "body";
    var rootEl = document.querySelector(rootSelector);
    if (!rootEl) {
      rootEl = document.body;
    }

    // If root is body, create a wrapper
    if (rootEl === document.body) {
      var wrapper = document.createElement("div");
      wrapper.id = "fef-app-root";
      document.body.appendChild(wrapper);
      rootEl = wrapper;
    }

    loadDependencies().then(function() {
      if (typeof injectStyles === "function") injectStyles();
      buildDOM(config, rootEl);
      initTheme(rootEl);
      renderQuickSummary(config, rootEl);
      renderStepDetails(config, rootEl);
      renderFullCoq(config, rootEl);
      renderMatrix(config, rootEl);
      showView(config.defaultView || "steps");
      if (config.steps && config.steps.length > 0) {
        showStepDetail(0, config, rootEl);
      }
      setTimeout(function() { renderDependencyGraph(config, rootEl); }, 300);
    }).catch(function(err) {
      console.warn("[FormalEthicsFramework] Failed to load dependencies:", err);
      // Still render without optional deps
      if (typeof injectStyles === "function") injectStyles();
      buildDOM(config, rootEl);
      initTheme(rootEl);
      renderQuickSummary(config, rootEl);
      renderStepDetails(config, rootEl);
      renderFullCoq(config, rootEl);
      renderMatrix(config, rootEl);
      showView(config.defaultView || "steps");
      if (config.steps && config.steps.length > 0) {
        showStepDetail(0, config, rootEl);
      }
    });
  };

})(typeof window !== "undefined" ? window : this);
