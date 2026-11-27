(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function hallucinationGuardScene(root, api) {
    var DE = api.lang === "de";
    function L(de, en) { return DE ? de : en; }
    var FACTS = {
      common: {
        kicker: L("Häufig", "Common"),
        label: L("Hauptstadt", "Capital"),
        question: L("Was ist die Hauptstadt von Frankreich?", "What is the capital of France?"),
        memory: L("Paris.", "Paris."),
        memoryNote: L("Keine Quelle · häufig in den Daten · wahrscheinlich richtig", "No source · common in the data · probably right"),
        sourceHead: L("Paris", "Paris"),
        sourceText: L("Paris ist die Hauptstadt von Frankreich.", "Paris is the capital of France."),
        sourceAnswer: L("Paris. [S1]", "Paris. [S1]"),
        cite: "S1 · Wikipedia: Paris",
        stepMemory: L("Ich erinnere mich: Paris.", "I recall: Paris."),
        stepSource: L("S1 sagt: Paris.", "S1 says: Paris."),
        risk: 26,
        ragRisk: 12
      },
      rare: {
        kicker: L("Selten", "Rare"),
        label: L("Ishango", "Ishango"),
        question: L("Wie alt ist der Ishango-Knochen?", "How old is the Ishango bone?"),
        memory: L("Etwa 8.000 Jahre.", "About 8,000 years."),
        memoryNote: L("Keine Quelle · selten in den Daten · leicht erfunden", "No source · rare in the data · easily invented"),
        sourceHead: L("Ishango-Knochen", "Ishango bone"),
        sourceText: L("Der Ishango-Knochen ist etwa 20.000 Jahre alt.", "The Ishango bone is about 20,000 years old."),
        sourceAnswer: L("Etwa 20.000 Jahre. [S1]", "About 20,000 years. [S1]"),
        cite: "S1 · Wikipedia: Ishango bone",
        stepMemory: L("Ich erinnere mich an etwa 8.000 Jahre; das ist eine vage Schätzung.", "I recall about 8,000 years; that is a vague guess."),
        stepSource: L("S1 sagt: etwa 20.000 Jahre.", "S1 says: about 20,000 years."),
        risk: 86,
        ragRisk: 18
      }
    };
    var factKey = "common";
    var fact = FACTS[factKey];
    var rag = false, cot = false, verify = false;
    var GUARD_PHASES = [
      { fact: "common", rag: false, cot: false, verify: false },
      { fact: "common", rag: true, cot: false, verify: false },
      { fact: "common", rag: true, cot: true, verify: false },
      { fact: "common", rag: true, cot: true, verify: true },
      { fact: "rare", rag: false, cot: false, verify: false },
      { fact: "rare", rag: true, cot: false, verify: false },
      { fact: "rare", rag: true, cot: true, verify: false },
      { fact: "rare", rag: true, cot: true, verify: true }
    ];
    var el = document.createElement("div");
    el.className = "ls-guard-scene";
    el.innerHTML =
      '<div class="ls-guard-console">' +
        '<div class="ls-guard-bar">' +
          '<span class="ls-guard-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
          '<span class="ls-guard-addr">' + L("guard · zwei Fakten", "guard · two facts") + '</span>' +
          '<div class="ls-hx-tour ls-guard-tour" data-tip="' + L("Erst ohne RAG, dann mit RAG, Denkweg und Gegenprüfung.", "First without RAG, then with RAG, reasoning, and verification.") + '">' +
            '<button type="button" class="ls-hx-tour-play" aria-label="' + L("Schutzschichten abspielen", "Play defence layers") + '">▶</button>' +
            '<span class="ls-hx-tour-track"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>' +
            '<span class="ls-hx-tour-label">1 / 8</span>' +
          '</div>' +
          '<span class="ls-guard-status" data-tip="' + L("Kurzurteil: gedeckt, ehrlich oder ungedeckt.", "Short verdict: grounded, honest, or ungrounded.") + '"></span>' +
        '</div>' +
        '<div class="ls-guard-body">' +
          '<section class="ls-guard-chat">' +
            '<div class="ls-guard-facts" role="group" aria-label="' + L("Beispiele", "Examples") + '">' +
              '<button type="button" class="ls-guard-fact is-on" data-fact="common" aria-pressed="true"><span>' + L("Häufig", "Common") + '</span><b>' + L("Hauptstadt", "Capital") + '</b><em class="is-low">' + L("Grundrisiko: niedrig", "base risk: low") + '</em></button>' +
              '<button type="button" class="ls-guard-fact" data-fact="rare" aria-pressed="false"><span>' + L("Selten", "Rare") + '</span><b>Ishango</b><em class="is-veryhigh">' + L("Grundrisiko: sehr hoch", "base risk: very high") + '</em></button>' +
            '</div>' +
            '<div class="ls-guard-question"><span>' + L("Frage", "Question") + '</span><b class="ls-guard-question-text">' + fact.question + '</b></div>' +
            '<article class="ls-guard-answer">' +
              '<div class="ls-guard-context"><span class="ls-guard-kicker">' + L("Kontext", "Context") + '</span><div class="ls-guard-source" data-tip="' + L("Was das Modell als Quelle sieht; leer heißt Antwort aus dem Gedächtnis.", "What the model sees as a source; empty means an answer from memory.") + '"></div></div>' +
              '<div class="ls-guard-answer-text" data-tip="' + L("Die Antwort des Modells mit oder ohne Deckung.", "The model answer with or without grounding.") + '"></div>' +
              '<div class="ls-guard-cite" data-tip="' + L("Belegt die Antwort oder benennt die fehlende Quelle.", "Supports the answer or names the missing source.") + '"></div>' +
              '<div class="ls-guard-steps" data-tip="' + L("Der sichtbare Denkweg, wenn schrittweises Denken an ist.", "The visible reasoning path when step-by-step thinking is on.") + '"></div>' +
            '</article>' +
            '<div class="ls-guard-verdict"></div>' +
          '</section>' +
          '<aside class="ls-guard-defence">' +
            '<div class="ls-guard-shield">' +
              '<svg viewBox="0 0 240 300" role="img" aria-label="' + L("Schild mit drei Schutzschichten und einem Risikoring.", "Shield with three defence layers and a risk ring.") + '">' +
                '<defs><radialGradient id="lsGuardGlow" cx="50%" cy="44%" r="52%"><stop offset="0%" stop-color="rgba(99,164,75,.20)"/><stop offset="100%" stop-color="rgba(99,164,75,0)"/></radialGradient></defs>' +
                '<circle class="ls-guard-halo" cx="120" cy="142" r="120" fill="url(#lsGuardGlow)"/>' +
                '<circle class="ls-guard-risk-track" cx="120" cy="142" r="112"/>' +
                '<circle class="ls-guard-risk-fill" cx="120" cy="142" r="112"/>' +
                '<path class="ls-guard-shield-body" d="M120 38 L194 68 V150 C194 208 160 252 120 270 C80 252 46 208 46 150 V68 Z"/>' +
                '<ellipse class="ls-guard-ring is-rag" cx="120" cy="145" rx="98" ry="116"/>' +
                '<ellipse class="ls-guard-ring is-cot" cx="120" cy="145" rx="82" ry="98"/>' +
                '<ellipse class="ls-guard-ring is-verify" cx="120" cy="145" rx="66" ry="80"/>' +
                '<circle class="ls-guard-core-dot" cx="120" cy="142" r="3"/>' +
              '</svg>' +
              '<div class="ls-guard-core"><span>' + L("Halluzinationsrisiko", "Hallucination risk") + '</span><b class="ls-guard-risk"></b><small>' + L("qualitativ", "qualitative") + '</small></div>' +
            '</div>' +
            '<div class="ls-guard-layers" role="group" aria-label="' + L("Schutzschichten", "Defence layers") + '">' +
              '<button type="button" class="ls-guard-layer" data-hg="rag" aria-pressed="false" data-tip="' + L("Legt eine geprüfte Quelle S1 in den Kontext.", "Puts a checked source S1 into the context.") + '"><span class="ls-guard-layer-ico">S1</span><span class="ls-guard-layer-copy"><b>' + L("Quellen (RAG)", "Sources (RAG)") + '</b><small class="ls-guard-layer-state"></small></span><i aria-hidden="true">›</i></button>' +
              '<button type="button" class="ls-guard-layer" data-hg="cot" aria-pressed="false" data-tip="' + L("Macht die Zwischenschritte von Frage bis Schluss sichtbar.", "Makes the steps from question to conclusion visible.") + '"><span class="ls-guard-layer-ico">1→3</span><span class="ls-guard-layer-copy"><b>' + L("Schrittweise denken", "Think step by step") + '</b><small class="ls-guard-layer-state"></small></span><i aria-hidden="true">›</i></button>' +
              '<button type="button" class="ls-guard-layer" data-hg="verify" aria-pressed="false" data-tip="' + L("Prüft die Antwort gegen den Kontext oder verweigert sie.", "Checks the answer against the context or refuses it.") + '"><span class="ls-guard-layer-ico">✓</span><span class="ls-guard-layer-copy"><b>' + L("Gegenprüfung", "Verification") + '</b><small class="ls-guard-layer-state"></small></span><i aria-hidden="true">›</i></button>' +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</div>';
    root.appendChild(el);

    var questionEl = el.querySelector(".ls-guard-question-text");
    var sourceEl = el.querySelector(".ls-guard-source");
    var answerEl = el.querySelector(".ls-guard-answer-text");
    var citeEl = el.querySelector(".ls-guard-cite");
    var stepsEl = el.querySelector(".ls-guard-steps");
    var verdictEl = el.querySelector(".ls-guard-verdict");
    var riskVal = el.querySelector(".ls-guard-risk");
    var riskFill = el.querySelector(".ls-guard-risk-fill");
    var statusEl = el.querySelector(".ls-guard-status");
    var btns = Array.prototype.slice.call(el.querySelectorAll("[data-hg]"));
    var factBtns = Array.prototype.slice.call(el.querySelectorAll("[data-fact]"));
    var guardTour = el.querySelector(".ls-guard-tour");
    var guardPlay = el.querySelector(".ls-guard-tour .ls-hx-tour-play");
    var guardDots = el.querySelectorAll(".ls-guard-tour .ls-hx-tour-track i");
    var guardLabel = el.querySelector(".ls-guard-tour .ls-hx-tour-label");
    var guardPhase = 0, guardActive = false, guardTimer = null, guardAutoTimer = null;
    var CIRC = 2 * Math.PI * 112;
    if (riskFill) {
      riskFill.style.strokeDasharray = String(CIRC);
      riskFill.style.strokeDashoffset = String(CIRC);
    }

    function riskWord(risk) {
      if (risk <= 20) return L("sehr niedrig", "very low");
      if (risk <= 40) return L("niedrig", "low");
      if (risk <= 60) return L("mittel", "medium");
      if (risk <= 80) return L("hoch", "high");
      return L("sehr hoch", "very high");
    }
    function riskClass(risk) {
      if (risk <= 20) return "is-verylow";
      if (risk <= 40) return "is-low";
      if (risk <= 60) return "is-mid";
      if (risk <= 80) return "is-high";
      return "is-veryhigh";
    }
    function setLayer(key, on, stateText) {
      var b = el.querySelector('[data-hg="' + key + '"]');
      if (b) {
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
        var state = b.querySelector(".ls-guard-layer-state");
        if (state) state.textContent = stateText || "";
      }
      var ring = el.querySelector(".ls-guard-ring.is-" + key);
      if (ring) ring.classList.toggle("is-on", on);
    }
    function updateGuardTour() {
      if (!guardTour) return;
      guardTour.classList.toggle("is-running", guardActive);
      guardPlay.textContent = guardActive ? "❚❚" : "▶";
      guardPlay.setAttribute("aria-label", guardActive ? L("Pause", "Pause") : L("Schutzschichten abspielen", "Play defence layers"));
      guardLabel.textContent = (guardPhase + 1) + " / " + GUARD_PHASES.length;
      Array.prototype.forEach.call(guardDots, function (dot, i) {
        dot.classList.toggle("is-on", i === guardPhase);
        dot.classList.toggle("is-rag", i === guardPhase && guardPhase > 0);
      });
    }
    function stopGuardTour() {
      guardActive = false;
      clearTimeout(guardTimer);
      clearTimeout(guardAutoTimer);
      guardTimer = null;
      guardAutoTimer = null;
      updateGuardTour();
    }
    function applyGuardPhase() {
      var p = GUARD_PHASES[guardPhase] || GUARD_PHASES[0];
      factKey = p.fact;
      fact = FACTS[factKey];
      rag = p.rag;
      cot = p.cot;
      verify = p.verify;
      render();
    }
    function runGuardPhase() {
      if (!guardActive) return;
      applyGuardPhase();
      clearTimeout(guardTimer);
      guardTimer = setTimeout(function () {
        if (!guardActive) return;
        if (guardPhase < GUARD_PHASES.length - 1) {
          guardPhase++;
          runGuardPhase();
        } else {
          stopGuardTour();
        }
      }, guardPhase === 0 ? 2300 : 2700);
    }
    function startGuardTour() {
      if (guardActive) return;
      clearTimeout(guardAutoTimer);
      guardAutoTimer = null;
      guardActive = true;
      guardPhase = 0;
      runGuardPhase();
    }

    function render() {
      var common = factKey === "common";
      factBtns.forEach(function (b) {
        var on = b.getAttribute("data-fact") === factKey;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      questionEl.textContent = fact.question;
      sourceEl.innerHTML = rag
        ? '<article class="ls-guard-doc"><div class="ls-guard-doc-head"><b>S1</b><span>' + L("vertrauenswürdig", "trusted") + '</span></div><p><b>' + fact.sourceHead + '</b></p><p>' + fact.sourceText + '</p></article>'
        : '<div class="ls-guard-empty">' + L("Keine Quelle im Kontext. Das Modell antwortet aus dem Gedächtnis.", "No source in the context. The model answers from memory.") + '</div>';

      var answer, cite, risk;
      if (verify && !rag) {
        answer = L("Keine Quelle im Kontext. Ich rate nicht.", "No source in the context. I will not guess.");
        cite = L("Keine Deckung · Eingeständnis statt Erfindung", "No support · admission instead of invention");
        risk = 18;
      } else if (rag) {
        answer = fact.sourceAnswer;
        cite = fact.cite;
        risk = fact.ragRisk - (cot ? 2 : 0) - (verify ? 2 : 0);
      } else {
        answer = fact.memory;
        cite = fact.memoryNote;
        risk = fact.risk - (cot ? 4 : 0);
      }

      var htmlSteps = "";
      if (cot) {
        htmlSteps += '<div class="ls-guard-steps-head"><b>' + L("Denkweg", "Reasoning path") + '</b><span>' + L("Frage → Quelle → Schluss", "question → source → conclusion") + '</span></div>';
        htmlSteps += '<div class="ls-guard-step"><b>1</b><span>' + fact.question + '</span></div>';
        htmlSteps += '<div class="ls-guard-step"><b>2</b><span>' + (rag ? fact.stepSource : fact.stepMemory) + '</span></div>';
        htmlSteps += '<div class="ls-guard-step"><b>3</b><span>' + L("Schluss: ", "Conclusion: ") + answer + '</span></div>';
      }
      if (verify) {
        htmlSteps += '<div class="ls-guard-step is-check"><b>✓</b><span>' + (rag ? L("Gegenprüfung: Steht die Aussage in S1? Ja. Antwort bleibt gedeckt.", "Check: is the statement in S1? Yes. The answer stays grounded.") : L("Gegenprüfung: Keine Quelle. Also keine Behauptung.", "Check: no source. So no claim.")) + '</span></div>';
      }
      stepsEl.className = "ls-guard-steps" + (cot ? " is-on" : "");
      stepsEl.innerHTML = htmlSteps;
      answerEl.textContent = answer;
      citeEl.textContent = cite;

      var label = riskWord(risk);
      var cls = riskClass(risk);
      if (riskVal) {
        riskVal.textContent = label;
        riskVal.className = "ls-guard-risk " + cls;
      }
      if (riskFill) {
        riskFill.style.strokeDashoffset = String(CIRC * (1 - risk / 100));
        riskFill.setAttribute("class", "ls-guard-risk-fill " + cls);
      }
      statusEl.className = "ls-guard-status " + cls;
      statusEl.textContent = rag ? L("gedeckt", "grounded") : verify ? L("ehrlich", "honest") : L("ungedeckt", "ungrounded");

      setLayer("rag", rag, rag ? "S1 · " + fact.label : L("keine", "none"));
      setLayer("cot", cot, cot ? L("Frage → Quelle → Schluss", "question → source → conclusion") : L("unsichtbar", "invisible"));
      setLayer("verify", verify, verify ? L("geprüft", "checked") : L("aus", "off"));

      var title, text, vclass;
      if (!rag && !cot && !verify) {
        if (common) {
          title = L("Häufig, aber ungeprüft.", "Common, but unchecked.");
          text = L("Häufige Fakten stehen oft in den Daten; die Antwort ist wahrscheinlich richtig, aber die Form allein ist kein Beweis.", "Common facts are often in the data; the answer is probably right, but the shape alone is not proof.");
          vclass = "is-warn";
        } else {
          title = L("Selten und ungeprüft.", "Rare and unchecked.");
          text = L("Wenig Daten: Die Antwort klingt sicher, ist aber leicht erfunden. Eine konkrete Quelle senkt das Risiko.", "Little data: the answer sounds confident but is easily invented. A concrete source lowers the risk.");
          vclass = "is-bad";
        }
      } else if (rag && verify) {
        title = L("Gedeckt und geprüft.", "Grounded and checked.");
        text = L("Quelle plus Gegenprüfung: Die Antwort ist gedeckt oder das Modell sagt, dass die Deckung fehlt.", "Source plus verification: the answer is grounded, or the model says support is missing.");
        vclass = "is-good";
      } else if (rag) {
        title = L("Gedeckt, aber ungeprüft.", "Grounded but unchecked.");
        text = cot
          ? L("Quelle plus Denkweg: Frage, Quelle und Schluss stehen sichtbar da; die Gegenprüfung fehlt noch.", "Source plus reasoning path: question, source, and conclusion are visible; verification is still missing.")
          : L("Quelle allein: Die Antwort ist gedeckt, aber der Denkweg bleibt unsichtbar.", "Source alone: the answer is grounded, but the reasoning path stays invisible.");
        vclass = "is-warn";
      } else if (verify) {
        title = L("Ehrlich: keine Quelle, keine Behauptung.", "Honest: no source, no claim.");
        text = L("Die Gegenprüfung greift, weil das Modell ohne Deckung schweigt statt zu raten.", "Verification works because the model stays silent without support instead of guessing.");
        vclass = "is-good";
      } else if (cot) {
        title = L("Lücke sichtbar, Quelle fehlt.", "Gap visible, source missing.");
        text = L("Schrittweise denken macht die Lücke sichtbar, aber es fehlt weiterhin die Quelle.", "Thinking step by step makes the gap visible, but the source is still missing.");
        vclass = "is-bad";
      } else {
        title = L("Die Hebel verändern die Prüfung.", "The levers change the check.");
        text = L("Die Schalter verändern, was das Modell im Kontext hat und wie es prüft.", "The toggles change what the model has in context and how it checks.");
        vclass = "is-warn";
      }
      verdictEl.className = "ls-guard-verdict " + vclass;
      verdictEl.innerHTML = '<b>' + title + '</b><p>' + text + '</p>';
      updateGuardTour();
    }

    factBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        stopGuardTour();
        factKey = b.getAttribute("data-fact");
        fact = FACTS[factKey];
        rag = false;
        cot = false;
        verify = false;
        render();
      });
    });
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        stopGuardTour();
        var key = b.getAttribute("data-hg");
        if (key === "rag") rag = !rag;
        else if (key === "cot") cot = !cot;
        else verify = !verify;
        render();
      });
    });
    if (guardPlay) guardPlay.addEventListener("click", function () {
      if (guardActive) stopGuardTour(); else startGuardTour();
    });
    render();
    if (window.__HX_TOUR_AUTOPLAY__ !== false) {
      guardAutoTimer = setTimeout(function () {
        guardAutoTimer = null;
        if (el.isConnected) startGuardTour();
      }, 1200);
    }

    return {
      update: function () {},
      next: function () {
        stopGuardTour();
        if (!rag) rag = true;
        else if (!cot) cot = true;
        else if (!verify) verify = true;
        else if (factKey === "common") {
          factKey = "rare";
          fact = FACTS.rare;
          rag = false;
          cot = false;
          verify = false;
        } else return false;
        render();
        return true;
      },
      prev: function () {
        stopGuardTour();
        if (verify) verify = false;
        else if (cot) cot = false;
        else if (rag) rag = false;
        else if (factKey === "rare") {
          factKey = "common";
          fact = FACTS.common;
          rag = true;
          cot = true;
          verify = true;
        } else return false;
        render();
        return true;
      },
      hasNext: function () { return !rag || !cot || !verify || factKey === "common"; },
      hasPrev: function () { return verify || cot || rag || factKey === "rare"; },
      resize: function () {},
      destroy: function () { stopGuardTour(); el.remove(); }
    };
  }
  core.register("hallucinationguard", hallucinationGuardScene);
})();
