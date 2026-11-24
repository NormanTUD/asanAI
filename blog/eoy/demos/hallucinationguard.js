(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function hallucinationGuardScene(root, api) {
    var DE = api.lang === "de";
    var rag = false, cot = false, verify = false;
    var question = DE ? "Wie hoch ist der Eiffelturm mit Antenne?" : "How tall is the Eiffel Tower with its antenna?";
    var el = document.createElement("div");
    el.className = "ls-hg-scene";
    el.innerHTML =
      '<div class="ls-hg-win" data-tip="' + (DE ? "Ein Chat mit drei Schaltern, die Quellen, Denkweg und Prüfung steuern." : "A chat with three switches that control sources, reasoning, and verification.") + '">' +
        '<div class="ls-hg-winbar">' +
          '<span class="ls-hg-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
          '<span class="ls-hg-addr">' + (DE ? "guard · Eiffelturm" : "guard · Eiffel Tower") + '</span>' +
          '<span class="ls-hg-status" data-tip="' + (DE ? "Kurzurteil: gedeckt, ehrlich oder ungedeckt." : "Short verdict: grounded, honest, or ungrounded.") + '"></span>' +
        '</div>' +
        '<div class="ls-hg-controls" role="group" aria-label="' + (DE ? "Schutzmaßnahmen" : "Guardrails") + '">' +
          '<button type="button" class="ls-hg-toggle" data-hg="rag" aria-pressed="false" data-tip="' + (DE ? "Legt eine geprüfte Quelle S1 in den Kontext." : "Puts a checked source S1 into the context.") + '"><span class="ls-hg-toggle-ico">S1</span><span>' + (DE ? "Quellen (RAG)" : "Sources (RAG)") + '</span></button>' +
          '<button type="button" class="ls-hg-toggle" data-hg="cot" aria-pressed="false" data-tip="' + (DE ? "Macht die Zwischenschritte von Frage bis Schluss sichtbar." : "Makes the steps from question to conclusion visible.") + '"><span class="ls-hg-toggle-ico">1→3</span><span>' + (DE ? "Schrittweise denken" : "Think step by step") + '</span></button>' +
          '<button type="button" class="ls-hg-toggle" data-hg="verify" aria-pressed="false" data-tip="' + (DE ? "Prüft die Antwort gegen den Kontext oder verweigert sie." : "Checks the answer against the context or refuses it.") + '"><span class="ls-hg-toggle-ico">✓</span><span>' + (DE ? "Gegenprüfung" : "Verification") + '</span></button>' +
        '</div>' +
        '<div class="ls-hg-body">' +
          '<div class="ls-hg-chat" data-tip="' + (DE ? "Der Chat zeigt Frage, Antwort und je nach Schalter den Denkweg." : "The chat shows the question, answer, and, depending on the switch, the reasoning.") + '">' +
            '<div class="ls-hg-msg is-user"><span class="ls-hg-role">' + (DE ? "Du" : "You") + '</span><div class="ls-hg-bubble ls-hg-bubble--user"><div class="ls-hg-question"><span>' + (DE ? "Frage" : "Question") + '</span><b>' + question + '</b></div></div></div>' +
            '<div class="ls-hg-msg is-ai"><span class="ls-hg-role">LLM</span><div class="ls-hg-bubble ls-hg-bubble--ai">' +
              '<div class="ls-hg-context-label">' + (DE ? "Kontext" : "Context") + '</div>' +
              '<div class="ls-hg-source" data-tip="' + (DE ? "Was das Modell als Quelle sieht; leer heißt Antwort aus dem Gedächtnis." : "What the model sees as a source; empty means an answer from memory.") + '"></div>' +
              '<div class="ls-hg-answer" data-tip="' + (DE ? "Die Antwort des Modells mit oder ohne Deckung." : "The model answer with or without grounding.") + '"></div>' +
              '<div class="ls-hg-cite" data-tip="' + (DE ? "Belegt die Antwort oder benennt die fehlende Quelle." : "Supports the answer or names the missing source.") + '"></div>' +
            '</div></div>' +
            '<div class="ls-hg-steps" data-tip="' + (DE ? "Der sichtbare Denkweg, wenn schrittweises Denken an ist." : "The visible reasoning path when step-by-step thinking is on.") + '"></div>' +
          '</div>' +
          '<aside class="ls-hg-check" data-tip="' + (DE ? "Die Prüfseite schätzt das Risiko und listet die aktiven Schutzmaßnahmen." : "The check panel estimates risk and lists the active guardrails.") + '">' +
            '<div class="ls-hg-check-head">' + (DE ? "Prüfung" : "Check") + '</div>' +
            '<div class="ls-hg-gauge" data-tip="' + (DE ? "Der Ring zeigt das Halluzinationsrisiko qualitativ: wenig gefüllt heißt relativ gering, voll heißt hoch." : "The ring shows hallucination risk qualitatively: little fill means relatively low, full means high.") + '"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ls-hg-gauge-track" cx="60" cy="60" r="48"/><circle class="ls-hg-gauge-fill" cx="60" cy="60" r="48"/></svg><div class="ls-hg-gauge-val"><b class="ls-hg-risk-val"></b></div></div>' +
            '<p class="ls-hg-gauge-cap">' + (DE ? "Halluzinationsrisiko" : "Hallucination risk") + '</p>' +
            '<div class="ls-hg-checks">' +
              '<div class="ls-hg-checkrow" data-check="rag" data-tip="' + (DE ? "Zeigt, ob eine Quelle im Kontext liegt." : "Shows whether a source is in the context.") + '"><i></i><b>' + (DE ? "Quelle im Kontext" : "Source in context") + '</b><span></span></div>' +
              '<div class="ls-hg-checkrow" data-check="cot" data-tip="' + (DE ? "Zeigt, ob der Denkweg sichtbar ist." : "Shows whether the reasoning is visible.") + '"><i></i><b>' + (DE ? "Sichtbarer Denkweg" : "Visible reasoning") + '</b><span></span></div>' +
              '<div class="ls-hg-checkrow" data-check="verify" data-tip="' + (DE ? "Zeigt, ob die Antwort gegengeprüft wird." : "Shows whether the answer is checked.") + '"><i></i><b>' + (DE ? "Gegenprüfung" : "Verification") + '</b><span></span></div>' +
            '</div>' +
            '<div class="ls-hg-readout" data-tip="' + (DE ? "Fasst zusammen, was die Schalterkombination bedeutet." : "Summarises what the switch combination means.") + '"></div>' +
          '</aside>' +
        '</div>' +
      '</div>';
    root.appendChild(el);

    var sourceEl = el.querySelector(".ls-hg-source");
    var answerEl = el.querySelector(".ls-hg-answer");
    var citeEl = el.querySelector(".ls-hg-cite");
    var stepsEl = el.querySelector(".ls-hg-steps");
    var readout = el.querySelector(".ls-hg-readout");
    var riskVal = el.querySelector(".ls-hg-risk-val");
    var gaugeFill = el.querySelector(".ls-hg-gauge-fill");
    var statusEl = el.querySelector(".ls-hg-status");
    var btns = Array.prototype.slice.call(el.querySelectorAll("[data-hg]"));
    var checkRows = {};
    Array.prototype.forEach.call(el.querySelectorAll("[data-check]"), function (row) {
      checkRows[row.getAttribute("data-check")] = row;
    });
    var CIRC = 2 * Math.PI * 48;
    if (gaugeFill) {
      gaugeFill.style.strokeDasharray = String(CIRC);
      gaugeFill.style.strokeDashoffset = String(CIRC);
    }

    function setCheck(key, on, stateText) {
      var row = checkRows[key];
      if (!row) return;
      row.classList.toggle("is-on", on);
      row.classList.toggle("is-off", !on);
      var ico = row.querySelector("i");
      if (ico) ico.textContent = on ? "✓" : "–";
      var state = row.querySelector("span");
      if (state) state.textContent = stateText || "";
    }

    function render() {
      btns.forEach(function (b) {
        var key = b.getAttribute("data-hg");
        var on = key === "rag" ? rag : key === "cot" ? cot : verify;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      sourceEl.innerHTML = rag
        ? '<article class="ls-hg-doc"><div class="ls-hg-doc-head"><b>S1</b><span>' + (DE ? "vertrauenswürdig" : "trusted") + '</span></div><p><b>Wikipedia</b> · ' + (DE ? "Eiffelturm" : "Eiffel Tower") + '</p><p>' + (DE ? "Der Eiffelturm ist mit Antenne 330 Meter hoch." : "The Eiffel Tower is 330 metres tall including its antenna.") + '</p></article>'
        : '<div class="ls-hg-empty">' + (DE ? "Keine Quelle im Kontext. Das Modell antwortet aus dem Gedächtnis." : "No source in the context. The model answers from memory.") + '</div>';

      var answer, cite, risk, htmlSteps = "";
      if (verify && !rag) {
        answer = DE ? "Keine Quelle im Kontext. Ich rate nicht." : "No source in the context. I will not guess.";
        cite = DE ? "Keine Deckung · Eingeständnis statt Erfindung" : "No support · admission instead of invention";
        risk = 12;
      } else if (rag) {
        answer = DE ? "Der Eiffelturm ist mit Antenne 330 m hoch. [S1]" : "The Eiffel Tower is 330 m tall with its antenna. [S1]";
        cite = "S1 · " + (DE ? "Wikipedia: Eiffelturm" : "Wikipedia: Eiffel Tower");
        risk = 18;
      } else {
        answer = DE ? "Der Eiffelturm ist 300 m hoch." : "The Eiffel Tower is 300 m tall.";
        cite = DE ? "Keine Quelle · aus dem Gedächtnis · falsch (330 m mit Antenne)" : "No source · from memory · wrong (330 m with antenna)";
        risk = 86;
      }

      if (cot) {
        htmlSteps += '<div class="ls-hg-steps-head"><b>' + (DE ? "Denkweg" : "Reasoning path") + '</b><span>' + (DE ? "Frage → Quelle → Schluss" : "question → source → conclusion") + '</span></div>';
        htmlSteps += '<div class="ls-hg-step"><b>1</b><span>' + (DE ? "Frage: Wie hoch ist der Eiffelturm mit Antenne?" : "Question: how tall is the Eiffel Tower with its antenna?") + '</span></div>';
        htmlSteps += '<div class="ls-hg-step"><b>2</b><span>' + (rag ? (DE ? "S1 sagt: 330 m mit Antenne." : "S1 says: 330 m with antenna.") : (DE ? "Ich erinnere mich an 300 m; das ist zu niedrig, aber keine Quelle im Kontext." : "I recall 300 m; that is too low, but no source is in the context.")) + '</span></div>';
        htmlSteps += '<div class="ls-hg-step"><b>3</b><span>' + (DE ? "Schluss: " : "Conclusion: ") + answer + '</span></div>';
      }
      if (verify) {
        htmlSteps += '<div class="ls-hg-step is-check"><b>✓</b><span>' + (rag ? (DE ? "Gegenprüfung: Steht 330 in S1? Ja. Antwort bleibt gedeckt." : "Check: does S1 say 330? Yes. The answer stays grounded.") : (DE ? "Gegenprüfung: Keine Quelle. Also keine Behauptung." : "Check: no source. So no claim.")) + '</span></div>';
      }
      stepsEl.className = "ls-hg-steps" + (cot ? " is-on" : "");
      stepsEl.innerHTML = htmlSteps;
      answerEl.textContent = answer;
      citeEl.textContent = cite;

      riskVal.textContent = risk < 30
        ? (DE ? "relativ gering" : "relatively low")
        : risk < 60
          ? (DE ? "mittel" : "medium")
          : (DE ? "hoch" : "high");
      var riskClass = risk < 30 ? "is-low" : risk < 60 ? "is-mid" : "is-high";
      if (gaugeFill) {
        gaugeFill.style.strokeDashoffset = String(CIRC * (1 - risk / 100));
        gaugeFill.setAttribute("class", "ls-hg-gauge-fill " + riskClass);
      }
      statusEl.className = "ls-hg-status " + riskClass;
      statusEl.textContent = rag ? (DE ? "gedeckt" : "grounded") : verify ? (DE ? "ehrlich" : "honest") : (DE ? "ungedeckt" : "ungrounded");

      setCheck("rag", rag, rag ? "S1 · 330 m" : (DE ? "keine" : "none"));
      setCheck("cot", cot, cot ? (DE ? "Frage → Quelle → Schluss" : "question → source → conclusion") : (DE ? "unsichtbar" : "invisible"));
      setCheck("verify", verify, verify ? (DE ? "geprüft" : "checked") : (DE ? "aus" : "off"));

      var title, text, vclass;
      if (!rag && !cot && !verify) {
        title = DE ? "Die Form ist kein Beweis." : "The shape is not proof.";
        text = DE ? "Ohne Quelle, ohne Zwischenschritte und ohne Prüfung bleibt die Antwort eine selbstsichere Vermutung." : "Without a source, steps, or verification, the answer is a confident guess.";
        vclass = "is-bad";
      } else if (rag && verify) {
        title = DE ? "Gedeckt und geprüft." : "Grounded and checked.";
        text = DE ? "Quelle plus Gegenprüfung: Die Antwort ist gedeckt oder das Modell sagt, dass die Deckung fehlt." : "Source plus verification: the answer is grounded, or the model says support is missing.";
        vclass = "is-good";
      } else if (rag) {
        title = DE ? "Gedeckt, aber ungeprüft." : "Grounded but unchecked.";
        text = cot
          ? (DE ? "Quelle plus Denkweg: Frage, Quelle und Schluss stehen sichtbar da; die Gegenprüfung fehlt noch." : "Source plus reasoning path: question, source, and conclusion are visible; verification is still missing.")
          : (DE ? "Quelle allein: Die Antwort ist gedeckt, aber der Denkweg bleibt unsichtbar." : "Source alone: the answer is grounded, but the reasoning path stays invisible.");
        vclass = "is-warn";
      } else if (verify) {
        title = DE ? "Ehrlich: keine Quelle, keine Behauptung." : "Honest: no source, no claim.";
        text = DE ? "Die Gegenprüfung greift, weil das Modell ohne Deckung schweigt statt zu raten." : "Verification works because the model stays silent without support instead of guessing.";
        vclass = "is-good";
      } else if (cot) {
        title = DE ? "Lücke sichtbar, Quelle fehlt." : "Gap visible, source missing.";
        text = DE ? "Schrittweise denken macht die Lücke sichtbar, aber es fehlt weiterhin die Quelle." : "Thinking step by step makes the gap visible, but the source is still missing.";
        vclass = "is-bad";
      } else {
        title = DE ? "Die Hebel verändern die Prüfung." : "The levers change the check.";
        text = DE ? "Die Schalter verändern, was das Modell im Kontext hat und wie es prüft." : "The toggles change what the model has in context and how it checks.";
        vclass = "is-warn";
      }
      readout.className = "ls-hg-readout " + vclass;
      readout.innerHTML = '<b>' + title + '</b><p>' + text + '</p>';
    }

    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var key = b.getAttribute("data-hg");
        if (key === "rag") rag = !rag;
        else if (key === "cot") cot = !cot;
        else verify = !verify;
        render();
      });
    });
    render();

    return {
      update: function () {},
      next: function () {
        if (!rag) rag = true;
        else if (!cot) cot = true;
        else if (!verify) verify = true;
        else return false;
        render();
        return true;
      },
      prev: function () {
        if (verify) verify = false;
        else if (cot) cot = false;
        else if (rag) rag = false;
        else return false;
        render();
        return true;
      },
      hasNext: function () { return !rag || !cot || !verify; },
      hasPrev: function () { return verify || cot || rag; },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }
  core.register("hallucinationguard", hallucinationGuardScene);
})();
