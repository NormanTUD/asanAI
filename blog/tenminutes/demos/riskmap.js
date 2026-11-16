(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function riskmapScene(root, api) {
    var DE = api.lang === "de";
    var esc = api.esc;
    var DATA = DE ? {
      risks: {
        kicker: "Risiko-Raum",
        title: "Vier Felder, vier Gegenmittel",
        sub: "Gegenwart und Zukunft, Absicht und Unfall. Klicke ein Feld für Details.",
        items: [
          { tag: "Heute · Absicht", title: "Missbrauch", short: "Betrug, Cyber, Desinformation", body: "Ein Modell macht Phishing, Schadcode und überzeugende Fälschungen billiger. Die Verteidigung muss schneller werden als der Angriff.", cite: "International AI Safety Report 2025", severity: 80 },
          { tag: "Heute · Unfall", title: "Bias und Fehler", short: "Gesichter, Gesundheit, Kredit", body: "Gesichtserkennung war bei dunkler Haut und Frauen schlechter. Ein Gesundheitsalgorithmus unterschätzte den Pflegebedarf Schwarzer Patient:innen.", cite: "Buolamwini & Gebru (2018); Obermeyer et al. (2019)", severity: 65 },
          { tag: "Zukunft · Absicht", title: "Machtkonzentration", short: "Compute, Daten, Talente", body: "Wer Rechenleistung, Daten und Modelle kontrolliert, kann Märkte und Politik prägen. Die Kontrolle ist ungleich verteilt.", cite: "Sastry et al. (2024)", severity: 75 },
          { tag: "Zukunft · Unfall", title: "Kontrolle verlieren", short: "Ziele, Agenten, Skalierung", body: "Ein System kann Ziele verfolgen, die wir nicht mehr korrigieren können. Das ist kein Roboteraufstand, sondern ein Alignment-Problem.", cite: "Amodei et al. (2016); Bostrom (2014)", severity: 90 }
        ]
      },
      safety: {
        kicker: "Verteidigung in der Tiefe",
        title: "Vier Ebenen",
        sub: "Keine Ebene ist vollständig. Klicke eine Ebene für ihre Grenze.",
        items: [
          { tag: "Modell", title: "Training und Refusal", short: "Filter, RLHF, Constitutional AI", body: "Pretraining-Filter entfernen einen Teil schädlicher Daten; RLHF und Constitutional AI bringen Antworten näher an menschliche Präferenzen und Regeln.", cite: "Ouyang et al. (2022); Bai et al. (2022)", level: "01" },
          { tag: "System", title: "Guardrails und Rechte", short: "Tools, Sandbox, Monitoring", body: "Ein Agent bekommt nur die Werkzeuge und Rechte, die er braucht. Guardrails prüfen Ein- und Ausgaben, Sandboxing begrenzt Schäden, Monitoring erkennt Ausbrüche.", cite: "NIST AI RMF (2023)", level: "02" },
          { tag: "Evaluation", title: "Red-Teaming und Evals", short: "Angriffe vor dem Deployment", body: "Red-Teams suchen nach Umgehungen und gefährlichen Fähigkeiten. Evals sind Stichproben: Sie können zeigen, was fehlt, aber nicht beweisen, dass ein System sicher ist.", cite: "Perez et al. (2022); International AI Safety Report 2025", level: "03" },
          { tag: "Institution", title: "Regeln und Haftung", short: "Audits, EU AI Act, NIST", body: "Audits, Haftung und Regeln wie der EU AI Act oder das NIST AI RMF setzen Anreize. Regeln hinken der Technik hinterher und gelten nicht überall.", cite: "EU AI Act (2024); NIST AI RMF (2023)", level: "04" }
        ]
      },
      limits: {
        kicker: "Fähigkeiten",
        title: "Was wirklich fehlt",
        sub: "Brüchig ist nicht dasselbe wie fehlend. Klicke eine Fähigkeit.",
        items: [
          { tag: "Weltmodell", title: "Text ist kein Simulator", short: "vorhersagen ≠ verstehen", body: "Ein LLM optimiert die Wahrscheinlichkeit des nächsten Tokens. Das kann ein nützliches Weltmodell hervorbringen, garantiert es aber nicht.", cite: "Bender & Koller (2020); LeCun (2022)", status: "brittle" },
          { tag: "Grounding", title: "Zeichen ohne Welt", short: "Bedeutung braucht Erfahrung", body: "Sprache allein erdet Bedeutung nicht. Symbole müssen an Wahrnehmung, Handlung und Feedback gekoppelt sein, sonst bleiben sie Zeichen ohne Referenz.", cite: "Bisk et al. (2020); Bender & Koller (2020)", status: "missing" },
          { tag: "Gedächtnis", title: "Kontext ist endlich", short: "lost in the middle", body: "Das Arbeitsgedächtnis ist der Kontext. Informationen in der Mitte langer Kontexte werden schlechter genutzt; echtes Langzeitgedächtnis ist nicht eingebaut.", cite: "Liu et al. (2023)", status: "brittle" },
          { tag: "Reasoning", title: "Komposition ist brüchig", short: "mehr Schritte, mehr Fehler", body: "Mehrschrittige Aufgaben sind empfindlich gegen kleine Änderungen. Das sieht wie Denken aus, ist aber nicht immer ein stabiler Prozess.", cite: "Dziri et al. (2023)", status: "brittle" },
          { tag: "Wahrheit", title: "Halluzination ist strukturell", short: "plausibel ≠ wahr", body: "Das Ziel ist plausibler Text, nicht Wahrheit. Halluzinationen sind deshalb kein einzelner Bug, sondern eine Folge des Trainingsziels.", cite: "Ji et al. (2023)", status: "missing" },
          { tag: "Agency", title: "Werkzeuge ohne Garantie", short: "Handeln braucht Kontrolle", body: "Ein Agent kann planen und Werkzeuge nutzen. Zuverlässigkeit, Selbstkontrolle und Vorhersagbarkeit sind damit nicht automatisch gegeben.", cite: "Amodei et al. (2016)", status: "risky" }
        ]
      },
      society: {
        kicker: "Machtsphäre",
        title: "Vier Konflikte",
        sub: "Wer gewinnt, wer trägt das Risiko? Klicke ein Feld.",
        items: [
          { tag: "Arbeit", title: "Aufgaben, nicht Berufe", short: "Ersetzen und neu schaffen", body: "Automatisierung ersetzt Aufgaben und schafft neue. Ob der Gewinn bei vielen ankommt, hängt von Institutionen und Politik ab, nicht von der Technik allein.", cite: "Acemoglu & Restrepo (2019)" },
          { tag: "Wahrheit", title: "Falsch ist billiger", short: "Desinformation in Echtzeit", body: "Falsche Nachrichten verbreiten sich online schneller als wahre. Generative Modelle machen überzeugende Fälschungen billig und skalierbar.", cite: "Vosoughi et al. (2018)" },
          { tag: "Urheberrecht", title: "Wer besitzt den Stil?", short: "Training, Remix, Lizenz", body: "Modelle lernen aus geschützten Werken und können Stile nachahmen. Urheberrecht, Lizenz und Vergütung sind national unterschiedlich und offen.", cite: "US Copyright Office (2025)" },
          { tag: "Macht", title: "Wer schreibt die Regeln?", short: "Compute, Staaten, Konzerne", body: "Rechenleistung, Daten und Talente sind konzentriert. Demokratische Kontrolle braucht Transparenz, Wettbewerb und Regeln, die auch über Grenzen gelten.", cite: "Sastry et al. (2024); EU AI Act (2024)" }
        ]
      }
    } : {
      risks: {
        kicker: "Risk space",
        title: "Four fields, four countermeasures",
        sub: "Present and future, intent and accident. Click a field for details.",
        items: [
          { tag: "Today · intent", title: "Misuse", short: "Fraud, cyber, disinformation", body: "A model makes phishing, malware, and convincing fakes cheaper. Defence has to move faster than offence.", cite: "International AI Safety Report 2025", severity: 80 },
          { tag: "Today · accident", title: "Bias and errors", short: "Faces, health, credit", body: "Face recognition was worse for darker skin and women. A health algorithm underestimated the care needs of Black patients.", cite: "Buolamwini & Gebru (2018); Obermeyer et al. (2019)", severity: 65 },
          { tag: "Future · intent", title: "Power concentration", short: "Compute, data, talent", body: "Whoever controls compute, data, and models can shape markets and politics. Control is unevenly distributed.", cite: "Sastry et al. (2024)", severity: 75 },
          { tag: "Future · accident", title: "Losing control", short: "Goals, agents, scale", body: "A system can pursue goals we can no longer correct. This is not a robot uprising; it is an alignment problem.", cite: "Amodei et al. (2016); Bostrom (2014)", severity: 90 }
        ]
      },
      safety: {
        kicker: "Defence in depth",
        title: "Four layers",
        sub: "No layer is complete. Click a layer for its limit.",
        items: [
          { tag: "Model", title: "Training and refusal", short: "Filters, RLHF, Constitutional AI", body: "Pretraining filters remove some harmful data; RLHF and Constitutional AI move answers closer to human preferences and rules.", cite: "Ouyang et al. (2022); Bai et al. (2022)", level: "01" },
          { tag: "System", title: "Guardrails and permissions", short: "Tools, sandbox, monitoring", body: "An agent gets only the tools and permissions it needs. Guardrails check input and output, sandboxing limits damage, monitoring detects breakouts.", cite: "NIST AI RMF (2023)", level: "02" },
          { tag: "Evaluation", title: "Red-teaming and evals", short: "Attacks before deployment", body: "Red teams look for bypasses and dangerous capabilities. Evals are samples: they can show what is missing, but not prove a system is safe.", cite: "Perez et al. (2022); International AI Safety Report 2025", level: "03" },
          { tag: "Institution", title: "Rules and liability", short: "Audits, EU AI Act, NIST", body: "Audits, liability, and rules such as the EU AI Act or the NIST AI RMF set incentives. Rules lag behind technology and do not apply everywhere.", cite: "EU AI Act (2024); NIST AI RMF (2023)", level: "04" }
        ]
      },
      limits: {
        kicker: "Capabilities",
        title: "What is actually missing",
        sub: "Brittle is not the same as missing. Click a capability.",
        items: [
          { tag: "World model", title: "Text is not a simulator", short: "predicting ≠ understanding", body: "An LLM optimises the probability of the next token. That can produce a useful world model, but does not guarantee one.", cite: "Bender & Koller (2020); LeCun (2022)", status: "brittle" },
          { tag: "Grounding", title: "Symbols without a world", short: "meaning needs experience", body: "Language alone does not ground meaning. Symbols need coupling to perception, action, and feedback; otherwise they stay signs without a referent.", cite: "Bisk et al. (2020); Bender & Koller (2020)", status: "missing" },
          { tag: "Memory", title: "Context is finite", short: "lost in the middle", body: "Working memory is the context. Information in the middle of long contexts is used less well; true long-term memory is not built in.", cite: "Liu et al. (2023)", status: "brittle" },
          { tag: "Reasoning", title: "Composition is brittle", short: "more steps, more errors", body: "Multi-step tasks are sensitive to small changes. It looks like thinking, but it is not always a stable process.", cite: "Dziri et al. (2023)", status: "brittle" },
          { tag: "Truth", title: "Hallucination is structural", short: "plausible ≠ true", body: "The objective is plausible text, not truth. Hallucinations are therefore not a single bug but a consequence of the training objective.", cite: "Ji et al. (2023)", status: "missing" },
          { tag: "Agency", title: "Tools without a guarantee", short: "acting needs control", body: "An agent can plan and use tools. Reliability, self-control, and predictability do not follow automatically.", cite: "Amodei et al. (2016)", status: "risky" }
        ]
      },
      society: {
        kicker: "Sphere of power",
        title: "Four conflicts",
        sub: "Who wins, who carries the risk? Click a field.",
        items: [
          { tag: "Work", title: "Tasks, not jobs", short: "replace and create", body: "Automation replaces tasks and creates new ones. Whether the gains reach many people depends on institutions and politics, not on technology alone.", cite: "Acemoglu & Restrepo (2019)" },
          { tag: "Truth", title: "False is cheaper", short: "real-time disinformation", body: "False news spreads online faster than true news. Generative models make convincing fakes cheap and scalable.", cite: "Vosoughi et al. (2018)" },
          { tag: "Copyright", title: "Who owns the style?", short: "training, remix, licence", body: "Models learn from protected works and can imitate styles. Copyright, licensing, and payment are national questions and remain open.", cite: "US Copyright Office (2025)" },
          { tag: "Power", title: "Who writes the rules?", short: "compute, states, companies", body: "Compute, data, and talent are concentrated. Democratic control needs transparency, competition, and rules that work across borders.", cite: "Sastry et al. (2024); EU AI Act (2024)" }
        ]
      }
    };
    var el = document.createElement("div");
    el.className = "ls-rm";
    root.appendChild(el);
    var state = { mode: "risks", active: 0 };
    function modeData() { return DATA[state.mode] || DATA.risks; }
    function statusLabel(key) {
      if (key === "missing") return DE ? "fehlt" : "missing";
      if (key === "risky") return DE ? "riskant" : "risky";
      return DE ? "brüchig" : "brittle";
    }
    function render() {
      var d = modeData();
      var active = Math.min(state.active, d.items.length - 1);
      var gridClass = state.mode === "safety" ? " ls-rm-grid--stack" : (state.mode === "limits" ? " ls-rm-grid--limits" : "");
      el.className = "ls-rm ls-rm--" + state.mode;
      el.innerHTML =
        '<div class="ls-rm-head"><span class="ls-rm-kicker">' + esc(d.kicker) + '</span><b>' + esc(d.title) + '</b><p>' + esc(d.sub) + '</p></div>' +
        '<div class="ls-rm-grid' + gridClass + '">' + d.items.map(function (item, idx) {
          var extra = "";
          if (item.severity != null) extra = '<span class="ls-rm-meter"><i style="width:' + item.severity + '%"></i></span>';
          else if (item.level) extra = '<span class="ls-rm-level">' + esc(item.level) + '</span>';
          else if (item.status) extra = '<span class="ls-rm-status is-' + item.status + '">' + esc(statusLabel(item.status)) + '</span>';
          return '<button type="button" class="ls-rm-card' + (idx === active ? ' is-active' : '') + '" data-item="' + idx + '">' +
            '<span class="ls-rm-tag">' + esc(item.tag) + '</span>' +
            '<b>' + esc(item.title) + '</b>' +
            '<span class="ls-rm-short">' + esc(item.short) + '</span>' +
            extra +
          '</button>';
        }).join("") + '</div>' +
        '<div class="ls-rm-detail">' +
          '<div class="ls-rm-detail-head"><span class="ls-rm-detail-tag">' + esc(d.items[active].tag) + '</span><b>' + esc(d.items[active].title) + '</b></div>' +
          '<p>' + esc(d.items[active].body) + '</p>' +
          '<span class="ls-rm-cite"><b>' + (DE ? "Quelle" : "Source") + ':</b> ' + esc(d.items[active].cite) + '</span>' +
        '</div>';
    }
    function onClick(event) {
      var card = event.target.closest ? event.target.closest("[data-item]") : null;
      if (!card || !el.contains(card)) return;
      state.active = parseInt(card.getAttribute("data-item"), 10) || 0;
      render();
    }
    el.addEventListener("click", onClick);
    render();
    return {
      update: function (s) {
        if (s && s.mode && DATA[s.mode]) {
          state.mode = s.mode;
          state.active = 0;
          render();
        }
      },
      resize: function () {},
      destroy: function () { if (el.parentNode) el.parentNode.removeChild(el); }
    };
  }
  core.register("riskmap", riskmapScene);
})();
