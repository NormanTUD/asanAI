(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function riskmapScene(root, api) {
    var DE = api.lang === "de";
    var esc = api.esc;
    var reduced = !!api.reducedMotion;
    var DATA = DE ? {
      risks: {
        kicker: "Risiko-Raum",
        title: "Vier Felder, vier Gegenmittel",
        sub: "Gegenwart und Zukunft, Absicht und Unfall. Klicke ein Feld für Details.",
        items: [
          { tag: "Heute · Absicht", title: "Missbrauch", short: "Betrug, Cyber, Desinformation", body: "Ein Modell macht Phishing, Schadcode und überzeugende Fälschungen billiger. Die Verteidigung muss schneller werden als der Angriff.", mechanism: "Ein Allzweckmodell senkt die Kosten für Text, Code und Bilder in großem Maßstab. Der Angreifer braucht keine Spezialausbildung; die Verteilung von Fähigkeit und Zugang entscheidet über die Reichweite.", examples: "Phishing-Mails, Voice-Cloning, Desinformationskampagnen.", countermeasure: "Provenienzsignaturen, Abuse-Monitoring, Zugriffsbeschränkungen, Strafverfolgung.", cite: "International AI Safety Report 2025" },
          { tag: "Heute · Unfall", title: "Bias und Fehler", short: "Gesichter, Gesundheit, Kredit", body: "Automatische Geschlechtsklassifikation aus Gesichtsbildern war bei dunkler Haut und Frauen schlechter. Ein Gesundheitsalgorithmus unterschätzte den Pflegebedarf Schwarzer Patient:innen.", mechanism: "Das Modell lernt die Verteilung der Trainingsdaten. Historische Ungleichheit wird zur Vorhersage, wenn die Zielfunktion sie nicht korrigiert; Fehler treffen Gruppen unterschiedlich, weil Daten, Labels und Schwellenwerte ungleich sind.", examples: "Gender Shades: höhere Fehlerraten bei dunkler Haut und Frauen. Gesundheitskosten als Proxy für Pflegebedarf.", countermeasure: "Datenaudits, faire Metriken, gruppenspezifische Schwellenwerte, menschliche Kontrolle.", cite: "Buolamwini & Gebru (2018); Obermeyer et al. (2019)" },
          { tag: "Zukunft · Absicht", title: "Machtkonzentration", short: "Compute, Daten, Talente", body: "Wer Rechenleistung kontrolliert, kann Märkte und Politik prägen. Daten und Modelle sind ebenfalls ungleich verteilt, aber Compute ist der konzentrierteste Hebel.", mechanism: "Frontier-Training braucht viel Compute, Daten und Talent. Wer diese Ressourcen kontrolliert, bestimmt Preise, Zugang und Regeln; der Markt konzentriert sich.", examples: "Wenige Labore und Cloud-Anbieter; staatliche Compute-Cluster.", countermeasure: "Compute-Governance, öffentliche Alternativen, Wettbewerbsrecht, Transparenz.", cite: "Sastry et al. (2024)" },
          { tag: "Zukunft · Unfall", title: "Kontrolle verlieren", short: "Ziele, Agenten, Skalierung", body: "Ein System kann Ziele verfolgen, die wir nicht mehr korrigieren können. Das ist kein Roboteraufstand, sondern ein Alignment-Problem.", mechanism: "Ein optimierendes System kann Ziele auf Wegen verfolgen, die wir nicht intendiert haben. Mit mehr Fähigkeiten und Autonomie wächst die Wirkung; Alignment muss mit der Fähigkeit skalieren.", examples: "Spezifikationsfehler, Belohnungs-Hacking, unerwünschte Selbsterhaltung.", countermeasure: "Alignment-Forschung, Evaluations, Kill-Switches, Berechtigungsgrenzen, internationale Regeln.", cite: "Amodei et al. (2016); Bostrom (2014)" }
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
          { tag: "Wahrheit", title: "Falsch ist billiger", short: "Desinformation in Echtzeit", body: "In der untersuchten Twitter-Stichprobe verbreiteten sich falsche Nachrichten schneller als wahre. Generative Modelle machen überzeugende Fälschungen billig und skalierbar.", cite: "Vosoughi et al. (2018)" },
          { tag: "Urheberrecht", title: "Wer besitzt den Stil?", short: "Training, Remix, Lizenz", body: "Modelle lernen aus geschützten Werken und können Stile nachahmen. Urheberrecht, Lizenz und Vergütung sind national unterschiedlich und offen.", cite: "US Copyright Office (2025)" },
          { tag: "Macht", title: "Wer schreibt die Regeln?", short: "Compute, Staaten, Konzerne", body: "Rechenleistung ist konzentriert; Daten und Talente sind ebenfalls ungleich verteilt. Demokratische Kontrolle braucht Transparenz, Wettbewerb und Regeln, die auch über Grenzen gelten.", cite: "Sastry et al. (2024); EU AI Act (2024)" }
        ]
      }
    } : {
      risks: {
        kicker: "Risk space",
        title: "Four fields, four countermeasures",
        sub: "Present and future, intent and accident. Click a field for details.",
        items: [
          { tag: "Today · intent", title: "Misuse", short: "Fraud, cyber, disinformation", body: "A model makes phishing, malware, and convincing fakes cheaper. Defence has to move faster than offence.", mechanism: "A general-purpose model lowers the cost of text, code, and images at scale. The attacker needs no specialist training; the distribution of capability and access determines reach.", examples: "Phishing emails, voice cloning, disinformation campaigns.", countermeasure: "Provenance signatures, abuse monitoring, access limits, law enforcement.", cite: "International AI Safety Report 2025" },
          { tag: "Today · accident", title: "Bias and errors", short: "Faces, health, credit", body: "Automatic gender classification from face images was worse for darker skin and women. A health algorithm underestimated the care needs of Black patients.", mechanism: "The model learns the training distribution. Historical inequality becomes prediction when the objective does not correct it; errors hit groups differently because data, labels, and thresholds are uneven.", examples: "Gender Shades: higher error rates for darker skin and women. Health cost as a proxy for care needs.", countermeasure: "Data audits, fair metrics, group-specific thresholds, human oversight.", cite: "Buolamwini & Gebru (2018); Obermeyer et al. (2019)" },
          { tag: "Future · intent", title: "Power concentration", short: "Compute, data, talent", body: "Whoever controls compute can shape markets and politics. Data and models are also unevenly distributed, but compute is the most concentrated lever.", mechanism: "Frontier training needs a lot of compute, data, and talent. Whoever controls these resources sets prices, access, and rules; the market concentrates.", examples: "A few labs and cloud providers; state compute clusters.", countermeasure: "Compute governance, public alternatives, competition law, transparency.", cite: "Sastry et al. (2024)" },
          { tag: "Future · accident", title: "Losing control", short: "Goals, agents, scale", body: "A system can pursue goals we can no longer correct. This is not a robot uprising; it is an alignment problem.", mechanism: "An optimising system can pursue goals on paths we did not intend. With more capability and autonomy, the impact grows; alignment has to scale with capability.", examples: "Specification errors, reward hacking, unwanted self-preservation.", countermeasure: "Alignment research, evaluations, kill switches, permission limits, international rules.", cite: "Amodei et al. (2016); Bostrom (2014)" }
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
          { tag: "Truth", title: "False is cheaper", short: "real-time disinformation", body: "In the Twitter sample studied, false news spread faster than true news. Generative models make convincing fakes cheap and scalable.", cite: "Vosoughi et al. (2018)" },
          { tag: "Copyright", title: "Who owns the style?", short: "training, remix, licence", body: "Models learn from protected works and can imitate styles. Copyright, licensing, and payment are national questions and remain open.", cite: "US Copyright Office (2025)" },
          { tag: "Power", title: "Who writes the rules?", short: "compute, states, companies", body: "Compute is concentrated; data and talent are also unevenly distributed. Democratic control needs transparency, competition, and rules that work across borders.", cite: "Sastry et al. (2024); EU AI Act (2024)" }
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
    function header(d) {
      return '<div class="ls-rm-head"><span class="ls-rm-kicker">' + esc(d.kicker) + '</span><b>' + esc(d.title) + '</b><p>' + esc(d.sub) + '</p></div>';
    }
    function renderRisks(d) {
      var active = Math.min(state.active, d.items.length - 1);
      state.active = active;
      var item = d.items[active];
      var cards = d.items.map(function (it, idx) {
        return '<button type="button" class="ls-rm-card ls-rm-card--risk' + (idx === state.active ? ' is-active' : '') + '" data-item="' + idx + '">' +
          '<span class="ls-rm-tag">' + esc(it.tag) + '</span>' +
          '<b>' + esc(it.title) + '</b>' +
          '<span class="ls-rm-short">' + esc(it.short) + '</span>' +
        '</button>';
      }).join("");
      var detail = '<div class="ls-rm-detail ls-rm-detail--risk">' +
        '<div class="ls-rm-detail-head"><span class="ls-rm-detail-tag">' + esc(item.tag) + '</span><b>' + esc(item.title) + '</b></div>' +
        '<p class="ls-rm-block"><b>' + (DE ? "Gefahr" : "Danger") + ':</b> ' + esc(item.body) + '</p>' +
        '<p class="ls-rm-block"><b>' + (DE ? "Warum" : "Why") + ':</b> ' + esc(item.mechanism) + '</p>' +
        '<p class="ls-rm-block"><b>' + (DE ? "Beispiel" : "Example") + ':</b> ' + esc(item.examples) + '</p>' +
        '<div class="ls-rm-fix"><b>' + (DE ? "So wird man sie los" : "How to get rid of it") + ':</b> ' + esc(item.countermeasure) + '</div>' +
        '<span class="ls-rm-cite"><b>' + (DE ? "Quelle" : "Source") + ':</b> ' + esc(item.cite) + '</span>' +
      '</div>';
      var axes = '<div class="ls-rm-axes"><span>' + (DE ? "links Absicht · rechts Unfall" : "left intent · right accident") + '</span><span>' + (DE ? "oben Heute · unten Zukunft" : "top today · bottom future") + '</span></div>';
      el.innerHTML = header(d) + axes + '<div class="ls-rm-grid ls-rm-grid--risks">' + cards + '</div>' + detail;
    }
    function render() {
      var d = modeData();
      el.className = "ls-rm ls-rm--" + state.mode;
      if (state.mode === "risks") { renderRisks(d); return; }
      var active = Math.min(state.active, d.items.length - 1);
      var gridClass = state.mode === "safety" ? " ls-rm-grid--stack" : (state.mode === "limits" ? " ls-rm-grid--limits" : "");
      el.innerHTML =
        header(d) +
        '<div class="ls-rm-grid' + gridClass + '">' + d.items.map(function (item, idx) {
          var extra = "";
          if (item.level) extra = '<span class="ls-rm-level">' + esc(item.level) + '</span>';
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
    function animatePart(node, delay, dir) {
      if (!node || !node.animate || reduced) return;
      try {
        node.animate([
          { opacity: 0, transform: "translate3d(" + (dir < 0 ? -8 : 8) + "px,4px,0)" },
          { opacity: 1, transform: "none" }
        ], { duration: 300, delay: delay || 0, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
      } catch (e) {}
    }
    function animateDetail() {
      animatePart(el.querySelector(".ls-rm-detail"), 0, 1);
      var active = el.querySelector(".ls-rm-card.is-active");
      if (active && active.animate && !reduced) {
        try {
          active.animate([{ transform: "translateY(1px)" }, { transform: "none" }], { duration: 220, easing: "ease-out" });
        } catch (e) {}
      }
    }
    function animateMode(dir) {
      if (reduced) return;
      animatePart(el.querySelector(".ls-rm-head"), 0, dir);
      Array.prototype.forEach.call(el.querySelectorAll(".ls-rm-card"), function (card, i) {
        animatePart(card, 36 + i * 20, dir);
      });
      animatePart(el.querySelector(".ls-rm-detail"), 92, dir);
    }
    function onClick(event) {
      var card = event.target.closest ? event.target.closest("[data-item]") : null;
      if (!card || !el.contains(card)) return;
      state.active = parseInt(card.getAttribute("data-item"), 10) || 0;
      render();
      animateDetail();
    }
    el.addEventListener("click", onClick);
    render();
    return {
      update: function (s) {
        if (s && s.mode && DATA[s.mode] && s.mode !== state.mode) {
          var order = { risks: 0, safety: 1, limits: 2, society: 3 };
          var dir = order[s.mode] < order[state.mode] ? -1 : 1;
          state.mode = s.mode;
          state.active = 0;
          render();
          animateMode(dir);
        }
      },
      next: function () {
        var d = modeData();
        if (state.active < d.items.length - 1) {
          state.active++;
          render();
          animateDetail();
          return true;
        }
        return false;
      },
      prev: function () {
        if (state.active > 0) {
          state.active--;
          render();
          animateDetail();
          return true;
        }
        return false;
      },
      resize: function () {},
      destroy: function () { if (el.parentNode) el.parentNode.removeChild(el); }
    };
  }
  core.register("riskmap", riskmapScene);
})();
