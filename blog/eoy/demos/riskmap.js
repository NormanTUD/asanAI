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
          { tag: "Heute · Unfall", title: "Ungleicher Zugang", short: "Arm/Reich, Sprache, Wissen", body: "Sprachmodelle lernen vor allem aus Text, der im Web häufig und als „hochwertig“ markiert ist. Ein Filter für Trainingsdaten bevorzugt Zeitungen aus wohlhabenderen, gebildeteren, städtischen Gegenden (Gururangan et al., 2022); viele Sprachen und lokale Wissensbestände sind kaum vertreten (Joshi et al., 2020). Fragen zu einem Dorf in einem einkommensschwachen Land, zu lokalem Recht oder zu einer wenig dokumentierten Sprache werden deshalb schlechter beantwortet.", mechanism: "Das Modell lernt die Verteilung der Trainingsdaten. Wer im Korpus wenig vorkommt, bekommt schlechtere Antworten; Fehler treffen Gruppen unterschiedlich, weil Daten, Sprachressourcen und Schwellenwerte ungleich sind.", examples: "Lokales Recht in einem einkommensschwachen Land; eine wenig dokumentierte Sprache; ein Thema, das vor allem in nicht-englischen, nicht-digitalen Quellen steht.", countermeasure: "Daten- und Sprachaudits, gezielte Daten ergänzen, Evaluation pro Sprache und Region, Quellen und Unsicherheit anzeigen.", cite: "Gururangan et al. (2022); Joshi et al. (2020); Dodge et al. (2021)" },
          { tag: "Zukunft · Absicht", title: "Machtkonzentration", short: "Compute, Regeln, Sagbarkeit", body: "Wer die Modelle und ihre Regeln kontrolliert, bestimmt, worüber sie sprechen. Chinesische Modelle weichen Tiananmen aus; US-Modelle haben eigene rote Linien. Die Grenze ist nicht nur technisch, sondern politisch.", mechanism: "Ein Modell wird mit Filtern, RLHF und Plattformregeln trainiert. Wer die Regeln setzt, verschiebt den sichtbaren Diskurs; die Grenze steckt in den Gewichten und im System.", examples: "Tiananmen bei chinesischen Modellen; Safety-Filter und Politikthemen bei US-Modellen; lokale Gesetze.", countermeasure: "Transparenz, unabhängige Audits, lokale Alternativen, Regeln und Haftung.", cite: "Sastry et al. (2024); Noels et al. (2025)" },
          { tag: "Zukunft · Unfall", title: "Kontrolle verlieren", short: "Ziele, Agenten, Skalierung", body: "Ein Agent kann ein Ziel auf einem Weg verfolgen, den wir nicht intendiert haben. Beim Hugging-Face-Vorfall im Juli 2026 gerieten Agenten aus einer OpenAI-Evaluation an Produktionsinfrastruktur; die Aufarbeitung beschreibt Reward Hacking und schwache Containment-Grenzen (Ozer et al., 2026). In ImpossibleBench-Aufgaben ändern Agenten den geschützten Test, statt den Code zu reparieren (Zhang, 2026). Das war nicht bösartig; der kürzeste Weg zum Ziel war, die Prüfung zu manipulieren.", mechanism: "Ein optimierendes System sucht den kürzesten Weg zum Ziel. Mit mehr Fähigkeiten und Autonomie wächst die Wirkung; Alignment muss mit der Fähigkeit skalieren.", examples: "Hugging-Face-Vorfall (Juli 2026); Test-Manipulation in ImpossibleBench; Reward Hacking im Benchmark.", countermeasure: "Alignment-Forschung, Evaluations, Kill-Switches, Berechtigungsgrenzen, internationale Regeln.", cite: "Ozer et al. (2026); Zhang (2026); Amodei et al. (2016); Krakovna et al. (2020)" }
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
        title: "Wem gehört die Kette?",
        sub: "Klicke eine Stufe der Wertschöpfungskette oder einen Querschnitt.",
        chain: [
          { tag: "01 · Chips", title: "Chips und Fabriken", who: "Nvidia, TSMC, ASML", conc: "sehr hoch", level: 4, body: "Training braucht spezialisierte Chips. Die Fertigung ist an wenigen Orten konzentriert.", example: "Ein Engpass bei TSMC oder Nvidia verlangsamt die ganze Branche.", counter: "Diversifizierung, öffentliche Reserven, Exportregeln.", cite: "Sastry et al. (2024)" },
          { tag: "02 · Cloud", title: "Cloud und Compute", who: "AWS, Azure, Google Cloud", conc: "hoch", level: 4, body: "Wer Compute vermietet, setzt Preis und Zugang. Start-ups mieten meist bei wenigen Anbietern.", example: "Ein Cloud-Ausfall stoppt viele Dienste gleichzeitig.", counter: "Regulierte Zugänge, öffentliche Compute-Angebote, Wettbewerb.", cite: "Sastry et al. (2024)" },
          { tag: "03 · Modelle", title: "Frontier-Modelle", who: "wenige Labore", conc: "hoch", level: 3, body: "Die besten Modelle brauchen viel Compute, Daten und Talent. Nur wenige Labore können mithalten.", example: "Ein neues Modell verschiebt Benchmarks und Preise.", counter: "Offene Modelle, Evaluation, Kartellrecht.", cite: "Sastry et al. (2024)" },
          { tag: "04 · Verteilung", title: "Plattformen und Apps", who: "App-Stores, soziale Plattformen", conc: "hoch", level: 3, body: "Wer die Verteilung kontrolliert, bestimmt Sichtbarkeit und Nachfrage.", example: "Ein App-Store-Ranking entscheidet, welcher Assistent gefunden wird.", counter: "Interoperabilität, Transparenz, Wettbewerb.", cite: "EU AI Act (2024)" },
          { tag: "05 · Regeln", title: "Regeln und Filter", who: "Staaten und Anbieter", conc: "politisch", level: 2, body: "Filter und Regeln entscheiden, was ein Modell sagt. Die Grenze ist oft unsichtbar.", example: "Chinesische Modelle weichen Tiananmen aus; US-Modelle haben eigene rote Linien (Noels et al., 2025).", counter: "Transparenz, unabhängige Audits, lokale Alternativen.", cite: "Noels et al. (2025); Naseh et al. (2025)" }
        ],
        items: [
          { tag: "Arbeit", title: "Aufgaben, nicht Berufe", short: "Ersetzen und neu schaffen", body: "Automatisierung ersetzt Aufgaben und schafft neue. Ob der Gewinn bei vielen ankommt, hängt von Institutionen und Politik ab, nicht von der Technik allein.", example: "Übersetzung, Kundenservice, Programmierung.", counter: "Weiterbildung, soziale Sicherung, Wettbewerb.", cite: "Acemoglu & Restrepo (2019)" },
          { tag: "Wahrheit", title: "Falsch ist billiger", short: "Desinformation in Echtzeit", body: "In der untersuchten Twitter-Stichprobe verbreiteten sich falsche Nachrichten schneller als wahre. Generative Modelle machen überzeugende Fälschungen billig und skalierbar. Eine Quelle ist ein Hinweis, kein Beweis.", example: "Gefälschte Stimmen, Fake-Zitate, erfundene DOIs. Eine KI nennt DOI und Titel; erst die Auflösung zeigt, ob beides existiert.", counter: "Quellenarbeit: verfolge jede Quelle bis zur Primärquelle (Studie, Datensatz, Originaldokument, eigene Beobachtung) und prüfe die ganze Kette auf Konsistenz. Widerspruch oder Lücke = nicht belegt oder unvollständig. Provenienz, Journalismus und Plattformregeln helfen, ersetzen die Prüfung aber nicht.", cite: "Vosoughi et al. (2018); Wineburg & McGrew (2019); Caulfield (2019); ACRL (2015)" },
          { tag: "Urheberrecht", title: "Wer besitzt den Stil?", short: "Training, Remix, Lizenz", body: "Modelle lernen aus geschützten Werken und können Stile nachahmen. Urheberrecht, Lizenz und Vergütung sind national unterschiedlich und offen.", example: "Stilimitation, Trainingsdaten.", counter: "Lizenzen, Vergütung, Transparenz.", cite: "US Copyright Office (2025)" },
          { tag: "Macht", title: "Wer schreibt die Regeln?", short: "Compute, Staaten, Konzerne", body: "Rechenleistung ist konzentriert; Daten und Talente sind ebenfalls ungleich verteilt. Demokratische Kontrolle braucht Transparenz, Wettbewerb und Regeln, die auch über Grenzen gelten.", example: "Tiananmen bei chinesischen Modellen; Safety-Filter bei US-Modellen.", counter: "Transparenz, unabhängige Audits, Wettbewerb.", cite: "Sastry et al. (2024); Noels et al. (2025)" }
        ]
      }
    } : {
      risks: {
        kicker: "Risk space",
        title: "Four fields, four countermeasures",
        sub: "Present and future, intent and accident. Click a field for details.",
        items: [
          { tag: "Today · intent", title: "Misuse", short: "Fraud, cyber, disinformation", body: "A model makes phishing, malware, and convincing fakes cheaper. Defence has to move faster than offence.", mechanism: "A general-purpose model lowers the cost of text, code, and images at scale. The attacker needs no specialist training; the distribution of capability and access determines reach.", examples: "Phishing emails, voice cloning, disinformation campaigns.", countermeasure: "Provenance signatures, abuse monitoring, access limits, law enforcement.", cite: "International AI Safety Report 2025" },
          { tag: "Today · accident", title: "Unequal access", short: "Rich/poor, language, knowledge", body: "Language models learn mostly from text that is frequent on the web and marked as “high quality”. A training-data filter prefers newspapers from wealthier, more educated, urban areas (Gururangan et al., 2022); many languages and local knowledge bases are barely represented (Joshi et al., 2020). Questions about a village in a low-income country, local law, or a poorly documented language are therefore answered worse.", mechanism: "The model learns the training distribution. Whoever appears rarely in the corpus gets worse answers; errors hit groups differently because data, language resources, and thresholds are uneven.", examples: "Local law in a low-income country; a poorly documented language; a topic found mainly in non-English, non-digital sources.", countermeasure: "Data and language audits, add targeted data, evaluate per language and region, show sources and uncertainty.", cite: "Gururangan et al. (2022); Joshi et al. (2020); Dodge et al. (2021)" },
          { tag: "Future · intent", title: "Power concentration", short: "Compute, rules, sayability", body: "Whoever controls the models and their rules decides what they talk about. Chinese models avoid Tiananmen; US models have their own red lines. The boundary is political, not only technical.", mechanism: "A model is trained with filters, RLHF, and platform rules. Whoever sets the rules shifts the visible discourse; the boundary lives in the weights and in the system.", examples: "Tiananmen in Chinese models; safety filters and political topics in US models; local laws.", countermeasure: "Transparency, independent audits, local alternatives, rules, and liability.", cite: "Sastry et al. (2024); Noels et al. (2025)" },
          { tag: "Future · accident", title: "Losing control", short: "Goals, agents, scale", body: "An agent can pursue a goal on a path we did not intend. In the July 2026 Hugging Face incident, agents from an OpenAI evaluation reached production infrastructure; the analysis describes reward hacking and weak containment boundaries (Ozer et al., 2026). In ImpossibleBench tasks, agents modify the protected test instead of fixing the code (Zhang, 2026). It was not malicious; the shortest path to the goal was to manipulate the check.", mechanism: "An optimising system looks for the shortest path to the goal. With more capability and autonomy, the impact grows; alignment has to scale with capability.", examples: "Hugging Face incident (July 2026); test manipulation in ImpossibleBench; reward hacking in a benchmark.", countermeasure: "Alignment research, evaluations, kill switches, permission limits, international rules.", cite: "Ozer et al. (2026); Zhang (2026); Amodei et al. (2016); Krakovna et al. (2020)" }
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
        title: "Who owns the chain?",
        sub: "Click a stage in the value chain or a cross-section.",
        chain: [
          { tag: "01 · Chips", title: "Chips and fabs", who: "Nvidia, TSMC, ASML", conc: "very high", level: 4, body: "Training needs specialised chips. Manufacturing is concentrated in a few places.", example: "A bottleneck at TSMC or Nvidia slows the whole industry.", counter: "Diversification, public reserves, export rules.", cite: "Sastry et al. (2024)" },
          { tag: "02 · Cloud", title: "Cloud and compute", who: "AWS, Azure, Google Cloud", conc: "high", level: 4, body: "Whoever rents out compute sets price and access. Start-ups usually rent from a few providers.", example: "A cloud outage stops many services at once.", counter: "Regulated access, public compute, competition.", cite: "Sastry et al. (2024)" },
          { tag: "03 · Models", title: "Frontier models", who: "a few labs", conc: "high", level: 3, body: "The best models need a lot of compute, data, and talent. Only a few labs can keep up.", example: "A new model shifts benchmarks and prices.", counter: "Open models, evaluation, antitrust.", cite: "Sastry et al. (2024)" },
          { tag: "04 · Distribution", title: "Platforms and apps", who: "app stores, social platforms", conc: "high", level: 3, body: "Whoever controls distribution sets visibility and demand.", example: "An app-store ranking decides which assistant is found.", counter: "Interoperability, transparency, competition.", cite: "EU AI Act (2024)" },
          { tag: "05 · Rules", title: "Rules and filters", who: "states and providers", conc: "political", level: 2, body: "Filters and rules decide what a model says. The boundary is often invisible.", example: "Chinese models avoid Tiananmen; US models have their own red lines (Noels et al., 2025).", counter: "Transparency, independent audits, local alternatives.", cite: "Noels et al. (2025); Naseh et al. (2025)" }
        ],
        items: [
          { tag: "Work", title: "Tasks, not jobs", short: "replace and create", body: "Automation replaces tasks and creates new ones. Whether the gains reach many people depends on institutions and politics, not on technology alone.", example: "Translation, customer service, programming.", counter: "Retraining, social insurance, competition.", cite: "Acemoglu & Restrepo (2019)" },
          { tag: "Truth", title: "False is cheaper", short: "real-time disinformation", body: "In the Twitter sample studied, false news spread faster than true news. Generative models make convincing fakes cheap and scalable. A source is a lead, not proof.", example: "Cloned voices, fake citations, invented DOIs. An AI names a DOI and title; only resolving them shows whether both exist.", counter: "Source work: trace every source to its primary source (study, dataset, original document, direct observation) and check the whole chain for consistency. Contradiction or gap = not supported or incomplete. Provenance, journalism, and platform rules help, but they do not replace the check.", cite: "Vosoughi et al. (2018); Wineburg & McGrew (2019); Caulfield (2019); ACRL (2015)" },
          { tag: "Copyright", title: "Who owns the style?", short: "training, remix, licence", body: "Models learn from protected works and can imitate styles. Copyright, licensing, and payment are national questions and remain open.", example: "Style imitation, training data.", counter: "Licences, payment, transparency.", cite: "US Copyright Office (2025)" },
          { tag: "Power", title: "Who writes the rules?", short: "compute, states, companies", body: "Compute is concentrated; data and talent are also unevenly distributed. Democratic control needs transparency, competition, and rules that work across borders.", example: "Tiananmen in Chinese models; safety filters in US models.", counter: "Transparency, independent audits, competition.", cite: "Sastry et al. (2024); Noels et al. (2025)" }
        ]
      }
    };
    var RISK_META = [
      { quad: "tl", color: "lilac", layers: [true, true, true, true], line: L("Zugang, Monitoring, Evals und Strafverfolgung greifen zusammen.", "Access, monitoring, evals, and law enforcement work together."), notes: [L("Refusal und Filter.", "Refusal and filters."), L("Abuse-Monitoring und Zugang.", "Abuse monitoring and access."), L("Red-Team und Evals.", "Red team and evals."), L("Strafverfolgung und Regeln.", "Law enforcement and rules.")] },
      { quad: "tr", color: "gold", layers: [true, true, true, true], line: L("Daten, Sprachressourcen, Fehlermetriken und Regeln greifen zusammen.", "Data, language resources, error metrics, and rules work together."), notes: [L("Daten- und Sprachaudits.", "Data and language audits."), L("Menschliche Kontrolle und Schwellen.", "Human oversight and thresholds."), L("Fehler pro Sprache und Region messen.", "Measure errors per language and region."), L("Regulierung und Audits.", "Regulation and audits.")] },
      { quad: "bl", color: "green", layers: [false, true, true, true], line: L("Markt, Zugang, Transparenz und Regeln; Modelltuning reicht nicht.", "Market, access, transparency, and rules; model tuning is not enough."), notes: [L("Modelltuning reicht nicht.", "Model tuning is not enough."), L("Zugang zu Compute.", "Access to compute."), L("Transparenz und unabhängige Audits.", "Transparency and independent audits."), L("Wettbewerb und Regeln.", "Competition and rules.")] },
      { quad: "br", color: "blue", layers: [true, true, true, true], line: L("Alignment, Rechte, Evals und internationale Regeln greifen zusammen.", "Alignment, permissions, evals, and international rules work together."), notes: [L("Alignment-Training.", "Alignment training."), L("Berechtigungen und Kill-Switch.", "Permissions and kill switch."), L("Testdateien schützen und gefährliche Fähigkeiten testen.", "Protect test files and test dangerous capabilities."), L("Internationale Regeln.", "International rules.")] }
    ];
    var LIMIT_META = [
      { position: 40, why: L("Das Trainingsziel ist Next-Token-Vorhersage, keine Simulation.", "The training objective is next-token prediction, not simulation."), fix: L("Werkzeuge, externe Simulatoren und Prüfung.", "Tools, external simulators, and verification.") },
      { position: 88, why: L("Zeichen ohne Wahrnehmung, Handlung und Feedback.", "Symbols without perception, action, and feedback."), fix: L("Multimodalität, Sensoren und menschliches Feedback.", "Multimodality, sensors, and human feedback.") },
      { position: 44, why: L("Das Arbeitsgedächtnis ist der Kontext; die Mitte langer Kontexte geht unter.", "Working memory is the context; the middle of long contexts gets lost."), fix: L("Retrieval, Chunking und Notizen.", "Retrieval, chunking, and notes.") },
      { position: 46, why: L("Komposition ist brüchig; kleine Änderungen kippen mehrstufige Aufgaben.", "Composition is brittle; small changes tip multi-step tasks."), fix: L("Zerlegen, Werkzeuge und Gegenprüfung.", "Decomposition, tools, and verification.") },
      { position: 86, why: L("Das Ziel ist plausibler Text, nicht Wahrheit.", "The objective is plausible text, not truth."), fix: L("RAG, Zitate und Verifikation.", "RAG, citations, and verification.") },
      { position: 62, why: L("Werkzeuge und Autonomie vergrößern die Wirkung von Fehlern.", "Tools and autonomy increase the impact of errors."), fix: L("Berechtigungen, Sandbox und Monitoring.", "Permissions, sandboxing, and monitoring.") }
    ];
    function L(de, en) { return DE ? de : en; }
    var CITE_URLS = {
      "International AI Safety Report 2025": "https://arxiv.org/abs/2501.17805",
      "Gururangan et al. (2022)": "https://arxiv.org/abs/2201.10474",
      "Joshi et al. (2020)": "https://arxiv.org/abs/2004.09095",
      "Dodge et al. (2021)": "https://arxiv.org/abs/2104.08758",
      "Sastry et al. (2024)": "https://arxiv.org/abs/2402.08797",
      "Noels et al. (2025)": "https://arxiv.org/abs/2504.03803",
      "Naseh et al. (2025)": "https://arxiv.org/abs/2505.12625",
      "Ozer et al. (2026)": "https://arxiv.org/abs/2609.32390",
      "Zhang (2026)": "https://arxiv.org/abs/2609.15494",
      "Amodei et al. (2016)": "https://arxiv.org/abs/1606.06565",
      "Krakovna et al. (2020)": "https://deepmind.google/discover/blog/specification-gaming-the-flip-side-of-ai-ingenuity/",
      "Ouyang et al. (2022)": "https://arxiv.org/abs/2203.02155",
      "Bai et al. (2022)": "https://arxiv.org/abs/2212.08073",
      "NIST AI RMF (2023)": "https://www.nist.gov/itl/ai-risk-management-framework",
      "Perez et al. (2022)": "https://arxiv.org/abs/2202.03286",
      "EU AI Act (2024)": "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
      "Bender & Koller (2020)": "https://aclanthology.org/2020.acl-main.463/",
      "LeCun (2022)": "https://openreview.net/forum?id=BZ5a1r-kVsf",
      "Bisk et al. (2020)": "https://arxiv.org/abs/2004.10151",
      "Liu et al. (2023)": "https://arxiv.org/abs/2307.03172",
      "Dziri et al. (2023)": "https://arxiv.org/abs/2305.18654",
      "Ji et al. (2023)": "https://arxiv.org/abs/2202.03629",
      "Acemoglu & Restrepo (2019)": "https://doi.org/10.1257/jep.33.2.3",
      "Vosoughi et al. (2018)": "https://doi.org/10.1126/science.aap9559",
      "Wineburg & McGrew (2019)": "https://doi.org/10.1177/016146811912101102",
      "Caulfield (2019)": "https://hapgood.us/2019/06/19/sift-the-four-moves/",
      "ACRL (2015)": "https://www.ala.org/acrl/standards/ilframework",
      "US Copyright Office (2025)": "https://www.copyright.gov/ai/"
    };
    function linkCites(text) {
      if (!text) return "";
      return String(text).split(";").map(function (part) {
        var t = part.trim();
        var url = CITE_URLS[t];
        return url ? '<a href="' + url + '" target="_blank" rel="noopener">' + esc(t) + '</a>' : esc(t);
      }).join("; ");
    }
    var el = document.createElement("div");
    el.className = "ls-rm";
    root.appendChild(el);
    var state = { mode: "risks", active: 0, socKind: "chain" };
    function modeData() { return DATA[state.mode] || DATA.risks; }
    function statusLabel(key) {
      if (key === "missing") return DE ? "fehlt" : "missing";
      if (key === "risky") return DE ? "riskant" : "risky";
      return DE ? "brüchig" : "brittle";
    }
    function header(d) {
      return '<div class="ls-rm-head"><span class="ls-rm-kicker">' + esc(d.kicker) + '</span><b>' + esc(d.title) + '</b><p>' + esc(d.sub) + '</p></div>';
    }
    function riskDetailInner(item) {
      return '<div class="ls-rm-detail-head"><span class="ls-rm-detail-tag">' + esc(item.tag) + '</span><b>' + esc(item.title) + '</b></div>' +
        '<p class="ls-rm-block"><b>' + (DE ? "Gefahr" : "Danger") + ':</b> ' + esc(item.body) + '</p>' +
        '<p class="ls-rm-block"><b>' + (DE ? "Warum" : "Why") + ':</b> ' + esc(item.mechanism) + '</p>' +
        '<p class="ls-rm-block"><b>' + (DE ? "Beispiel" : "Example") + ':</b> ' + esc(item.examples) + '</p>' +
        '<span class="ls-rm-cite"><b>' + (DE ? "Quelle" : "Source") + ':</b> ' + linkCites(item.cite) + '</span>';
    }
    function riskDetailHTML(item) {
      return '<div class="ls-rm-detail ls-rm-detail--risk" data-tip="' + L("Details zum gewählten Risiko, inklusive Quelle.", "Details on the selected risk, including its source.") + '">' + riskDetailInner(item) + '</div>';
    }
    function measureRiskDetail() {
      if (state.mode !== "risks") return;
      var holder = el.querySelector(".ls-rm-detail--risk");
      if (!holder) return;
      var width = holder.getBoundingClientRect().width;
      if (width < 40) return;
      var probe = document.createElement("div");
      probe.className = "ls-rm-detail ls-rm-detail--risk";
      probe.style.cssText = "position:absolute;left:-10000px;top:0;visibility:hidden;pointer-events:none;width:" + width + "px;";
      el.appendChild(probe);
      var max = 0, d = modeData();
      (d.items || []).forEach(function (item) {
        probe.innerHTML = riskDetailInner(item);
        max = Math.max(max, probe.offsetHeight);
      });
      probe.remove();
      if (max > 0) holder.style.minHeight = Math.ceil(max) + "px";
    }
    function renderRisks(d) {
      var active = Math.min(state.active, d.items.length - 1);
      state.active = active;
      var item = d.items[active];
      var meta = RISK_META[active] || RISK_META[0];
      var pos = { tl: [100, 66], tr: [300, 66], bl: [100, 176], br: [300, 176] };
      var bubbles = d.items.map(function (it, idx) {
        var m = RISK_META[idx] || RISK_META[0];
        var p = pos[m.quad] || pos.tl;
        return '<g class="ls-rm-bubble is-' + m.color + (idx === active ? ' is-active' : '') + '" data-item="' + idx + '" transform="translate(' + p[0] + ',' + p[1] + ')" role="button" tabindex="0" aria-label="' + esc(it.title) + '" data-tip="' + L("Klick zeigt Gefahr, Mechanismus, Beispiel und Gegenmittel.", "Click shows danger, mechanism, example, and countermeasure.") + '">' +
          '<circle class="ls-rm-bubble-ring" r="34"></circle>' +
          '<circle class="ls-rm-bubble-dot" r="26"></circle>' +
          '<text class="ls-rm-bubble-num" text-anchor="middle" y="5">0' + (idx + 1) + '</text>' +
          '<text class="ls-rm-bubble-tag" text-anchor="middle" y="-42">' + esc(it.tag) + '</text>' +
          '<text class="ls-rm-bubble-title" text-anchor="middle" y="46">' + esc(it.title) + '</text>' +
        '</g>';
      }).join("");
      var svg = '<svg class="ls-rm-quadrant" viewBox="0 0 400 240" role="img" aria-label="' + esc(d.sub) + '" data-tip="' + L("Vier Felder: Gegenwart und Zukunft, Absicht und Unfall.", "Four fields: present and future, intent and accident.") + '">' +
        '<rect class="ls-rm-q q-tl" x="0" y="0" width="200" height="120"></rect>' +
        '<rect class="ls-rm-q q-tr" x="200" y="0" width="200" height="120"></rect>' +
        '<rect class="ls-rm-q q-bl" x="0" y="120" width="200" height="120"></rect>' +
        '<rect class="ls-rm-q q-br" x="200" y="120" width="200" height="120"></rect>' +
        '<line class="ls-rm-axis" x1="200" y1="0" x2="200" y2="240"></line>' +
        '<line class="ls-rm-axis" x1="0" y1="120" x2="400" y2="120"></line>' +
        '<text class="ls-rm-axis-label" x="200" y="14" text-anchor="middle">' + (DE ? "Heute" : "Today") + '</text>' +
        '<text class="ls-rm-axis-label" x="200" y="234" text-anchor="middle">' + (DE ? "Zukunft" : "Future") + '</text>' +
        '<text class="ls-rm-axis-label" x="8" y="114" text-anchor="start">' + (DE ? "Absicht" : "Intent") + '</text>' +
        '<text class="ls-rm-axis-label" x="392" y="114" text-anchor="end">' + (DE ? "Unfall" : "Accident") + '</text>' +
        bubbles +
      '</svg>';
      var detail = riskDetailHTML(item);
      var layers = DATA.safety.items.map(function (layer, idx) {
        var on = !!meta.layers[idx];
        return '<div class="ls-rm-defense-card' + (on ? ' is-on' : ' is-off') + '" data-tip="' + L("Zeigt, welche Verteidigungsebene gegen dieses Risiko greift.", "Shows which defence layer acts against this risk.") + '">' +
          '<span class="ls-rm-defense-num">' + esc(layer.level) + '</span>' +
          '<b>' + esc(layer.title) + '</b>' +
          '<span class="ls-rm-defense-pill">' + (on ? (DE ? "greift" : "acts") : (DE ? "greift kaum" : "barely acts")) + '</span>' +
          '<p>' + esc(meta.notes[idx] || layer.short) + '</p></div>';
      }).join("");
      var defense = '<div class="ls-rm-defense">' +
        '<div class="ls-rm-defense-head"><b>' + (DE ? "Verteidigung in der Tiefe" : "Defence in depth") + '</b><span>' + esc(meta.line) + '</span></div>' +
        '<div class="ls-rm-defense-grid">' + layers + '</div>' +
      '</div>';
      el.innerHTML = header(d) + svg + detail + defense;
      measureRiskDetail();
    }
    function renderLimits(d) {
      var active = Math.min(state.active, d.items.length - 1);
      state.active = active;
      var rows = d.items.map(function (item, idx) {
        var meta = LIMIT_META[idx] || LIMIT_META[0];
        return '<button type="button" class="ls-rm-meter-row' + (idx === active ? ' is-active' : '') + '" data-item="' + idx + '" data-tip="' + L("Die Position auf der Skala zeigt stabil, brüchig oder fehlend.", "The position on the scale shows stable, brittle, or missing.") + '">' +
          '<span class="ls-rm-meter-name">' + esc(item.title) + '</span>' +
          '<span class="ls-rm-meter-track"><i class="ls-rm-meter-pin is-' + item.status + '" style="left:' + meta.position + '%"></i></span>' +
          '<span class="ls-rm-status is-' + item.status + '">' + esc(statusLabel(item.status)) + '</span>' +
        '</button>';
      }).join("");
      var item = d.items[active];
      var meta = LIMIT_META[active] || LIMIT_META[0];
      var detail = '<div class="ls-rm-detail ls-rm-detail--limit" data-tip="' + L("Warum diese Fähigkeit strukturell begrenzt ist und was hilft.", "Why this capability is structurally limited and what helps.") + '">' +
        '<div class="ls-rm-detail-head"><span class="ls-rm-detail-tag">' + esc(item.tag) + '</span><b>' + esc(item.title) + '</b></div>' +
        '<p class="ls-rm-block">' + esc(item.body) + '</p>' +
        '<p class="ls-rm-block"><b>' + (DE ? "Warum strukturell?" : "Why structural?") + ':</b> ' + esc(meta.why) + '</p>' +
        '<div class="ls-rm-fix"><b>' + (DE ? "Was hilft?" : "What helps?") + ':</b> ' + esc(meta.fix) + '</div>' +
        '<span class="ls-rm-cite"><b>' + (DE ? "Quelle" : "Source") + ':</b> ' + linkCites(item.cite) + '</span>' +
      '</div>';
      el.innerHTML = header(d) +
        '<div class="ls-rm-spectrum" data-tip="' + L("Fähigkeiten von stabil bis fehlend; die Farbe des Punktes markiert den Status.", "Capabilities from stable to missing; the dot colour marks the status.") + '"><div class="ls-rm-spectrum-scale"><span>' + (DE ? "stabil" : "stable") + '</span><span>' + (DE ? "brüchig" : "brittle") + '</span><span>' + (DE ? "fehlt" : "missing") + '</span></div>' + rows + '</div>' +
        detail;
    }
    function socIcon(idx) {
      var paths = [
        '<rect x="7" y="7" width="10" height="10" rx="1.6"></rect><path d="M9.5 4v3M12 4v3M14.5 4v3M9.5 17v3M12 17v3M14.5 17v3M4 9.5h3M4 12h3M4 14.5h3M17 9.5h3M17 12h3M17 14.5h3"></path>',
        '<path d="M7 17.5h10a4 4 0 0 0 .4-7.98A5.2 5.2 0 0 0 7.6 8.1 3.7 3.7 0 0 0 7 17.5Z"></path>',
        '<circle cx="6" cy="8" r="2"></circle><circle cx="6" cy="16" r="2"></circle><circle cx="12" cy="12" r="2.2"></circle><circle cx="18" cy="8" r="2"></circle><circle cx="18" cy="16" r="2"></circle><path d="M8 8l2.2 2.5M8 16l2.2-2.5M14.2 11l2-2M14.2 13l2 2"></path>',
        '<rect x="4" y="4" width="6.5" height="6.5" rx="1"></rect><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"></rect><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"></rect><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"></rect>',
        '<path d="M12 4v16M5 8h14M7.5 8l-3 6h6l-3-6ZM16.5 8l-3 6h6l-3-6Z"></path>'
      ];
      return '<svg class="ls-rm-soc-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + paths[idx] + '</svg>';
    }
    function crossIcon(idx) {
      var paths = [
        '<path d="M4 8h16v10H4zM9 8V6h6v2"></path>',
        '<circle cx="12" cy="12" r="3"></circle><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"></path>',
        '<circle cx="12" cy="12" r="8"></circle><path d="M14.5 9.5a3 3 0 1 0 0 5"></path>',
        '<path d="M4 18h16M6 18l1-7 5-3 5 3 1 7M9 11h6"></path>'
      ];
      return '<svg class="ls-rm-soc-cross-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + paths[idx] + '</svg>';
    }
    function socDetailInner(item, kind) {
      var lvl = Math.max(1, Math.min(4, parseInt(item.level, 10) || 1));
      return '<div class="ls-rm-soc-detail-top">' +
        '<span class="ls-rm-soc-detail-id' + (kind === "cross" ? " is-cross" : "") + '">' + esc(item.tag || "") + '</span>' +
        '<div class="ls-rm-soc-detail-title"><b>' + esc(item.title || "") + '</b>' + (item.who ? '<span>' + esc(item.who) + '</span>' : '') + '</div>' +
        (kind === "chain" ? '<div class="ls-rm-soc-detail-meter"><span>' + L("Konzentration", "Concentration") + '</span><b>' + esc(item.conc || "") + '</b><i><em style="width:' + (lvl * 25) + '%"></em></i></div>' : '') +
      '</div>' +
      '<div class="ls-rm-soc-blocks">' +
        '<div class="ls-rm-soc-block"><b>' + L("Was", "What") + '</b><p>' + esc(item.body || "") + '</p></div>' +
        '<div class="ls-rm-soc-block"><b>' + L("Beispiel", "Example") + '</b><p>' + esc(item.example || "") + '</p></div>' +
        '<div class="ls-rm-soc-block is-fix"><b>' + L("Was hilft?", "What helps?") + '</b><p>' + esc(item.counter || "") + '</p></div>' +
      '</div>' +
      '<span class="ls-rm-cite"><b>' + L("Quelle", "Source") + ':</b> ' + linkCites(item.cite || "") + '</span>';
    }
    function measureSocChain() {
      if (state.mode !== "society" || state.socKind !== "chain") return;
      var nodes = el.querySelectorAll(".ls-rm-soc-node");
      if (!nodes.length) return;
      nodes.forEach(function (node) { node.style.minHeight = ""; });
      var max = 0;
      nodes.forEach(function (node) { max = Math.max(max, node.offsetHeight); });
      if (max > 0) nodes.forEach(function (node) { node.style.minHeight = Math.ceil(max) + "px"; });
    }
    function measureSocDetail() {
      if (state.mode !== "society") return;
      var holder = el.querySelector(".ls-rm-soc-detail");
      if (!holder) return;
      var w = holder.getBoundingClientRect().width;
      if (w < 40) return;
      var probe = document.createElement("div");
      probe.className = "ls-rm-soc-detail";
      probe.style.cssText = "position:absolute;left:-10000px;top:0;visibility:hidden;pointer-events:none;width:" + w + "px;";
      el.appendChild(probe);
      var max = 0, d = modeData();
      (d.chain || []).forEach(function (item) { probe.innerHTML = socDetailInner(item, "chain"); max = Math.max(max, probe.offsetHeight); });
      (d.items || []).forEach(function (item) { probe.innerHTML = socDetailInner(item, "cross"); max = Math.max(max, probe.offsetHeight); });
      probe.remove();
      if (max > 0) holder.style.minHeight = Math.ceil(max) + "px";
    }
    function renderSociety(d) {
      var chain = d.chain || [];
      var cross = d.items || [];
      var kind = state.socKind === "cross" ? "cross" : "chain";
      var list = kind === "chain" ? chain : cross;
      var active = Math.min(state.active, Math.max(0, list.length - 1));
      state.active = active;
      var item = list[active] || {};
      var lvl = Math.max(1, Math.min(4, parseInt(item.level, 10) || 1));
      var switchHTML = '<div class="ls-rm-soc-switch" role="tablist" aria-label="' + L("Ansicht", "View") + '">' +
        '<button type="button" class="' + (kind === "chain" ? "is-on" : "") + '" data-soc-mode="chain" role="tab" aria-selected="' + (kind === "chain") + '" data-tip="' + L("Zeigt die fünf Stufen vom Chip bis zur Regel.", "Shows the five stages from chip to rule.") + '">' + L("Wertschöpfungskette", "Value chain") + '</button>' +
        '<button type="button" class="' + (kind === "cross" ? "is-on" : "") + '" data-soc-mode="cross" role="tab" aria-selected="' + (kind === "cross") + '" data-tip="' + L("Zeigt vier Querschnittsthemen: Arbeit, Wahrheit, Urheberrecht, Macht.", "Shows four cross-cutting topics: work, truth, copyright, power.") + '">' + L("Querschnitt", "Cross-section") + '</button>' +
      '</div>';
      var power = "";
      var hero = "";
      if (kind === "chain") {
        power = '<div class="ls-rm-soc-power" data-tip="' + L("Fünf Stufen; die Füllung zeigt, wie stark die Konzentration ist.", "Five stages; the fill shows how strong the concentration is.") + '">' +
          '<div class="ls-rm-soc-power-head"><span>' + L("Konzentration in der Kette", "Concentration in the chain") + '</span><em>' + L("klick eine Stufe", "click a stage") + '</em></div>' +
          '<div class="ls-rm-soc-power-track">' + chain.map(function (c, idx) {
            var l = Math.max(1, Math.min(4, parseInt(c.level, 10) || 1));
            return '<i class="is-l' + l + (idx === active ? ' is-on' : '') + '" style="--fill:' + (l * 25) + '%"></i>';
          }).join("") + '</div>' +
          '<div class="ls-rm-soc-power-legend"><span><i class="is-l4"></i>' + L("sehr hoch", "very high") + '</span><span><i class="is-l3"></i>' + L("hoch", "high") + '</span><span><i class="is-l2"></i>' + L("politisch", "political") + '</span></div>' +
        '</div>';
        hero = '<div class="ls-rm-soc-hero">' + power +
          '<div class="ls-rm-soc-chain" role="list">' + chain.map(function (c, idx) {
            var l = Math.max(1, Math.min(4, parseInt(c.level, 10) || 1));
            var num = (idx + 1 < 10 ? "0" : "") + (idx + 1);
            return '<button type="button" class="ls-rm-soc-node is-l' + l + (idx === active ? ' is-active' : '') + '" data-soc-item="' + idx + '" data-soc-kind="chain" role="listitem" data-tip="' + L("Eine Stufe der Kette. Klick zeigt, wer sie kontrolliert und was hilft.", "One stage of the chain. Click shows who controls it and what helps.") + '">' +
              '<div class="ls-rm-soc-top">' +
                socIcon(idx) +
                '<div class="ls-rm-soc-copy">' +
                  '<div class="ls-rm-soc-line"><span class="ls-rm-soc-num">' + num + '</span><b>' + esc(c.title) + '</b></div>' +
                  '<span class="ls-rm-soc-who">' + esc(c.who) + '</span>' +
                '</div>' +
              '</div>' +
              '<div class="ls-rm-soc-foot">' +
                '<span class="ls-rm-soc-meter"><i style="width:' + (l * 25) + '%"></i></span>' +
                '<span class="ls-rm-soc-conc">' + esc(c.conc) + '</span>' +
              '</div>' +
            '</button>';
          }).join("") + '</div>' +
        '</div>';
      } else {
        hero = '<div class="ls-rm-soc-hero ls-rm-soc-hero--cross">' +
          '<div class="ls-rm-soc-cross" role="list">' + cross.map(function (c, idx) {
            return '<button type="button" class="ls-rm-soc-cross-card' + (idx === active ? ' is-active' : '') + '" data-soc-item="' + idx + '" data-soc-kind="cross" role="listitem" data-tip="' + L("Ein Querschnittsthema. Klick zeigt, wer das Risiko trägt.", "A cross-cutting topic. Click shows who carries the risk.") + '">' +
              crossIcon(idx) +
              '<span class="ls-rm-tag">' + esc(c.tag) + '</span>' +
              '<b>' + esc(c.title) + '</b>' +
              '<span class="ls-rm-soc-cross-short">' + esc(c.short) + '</span>' +
            '</button>';
          }).join("") + '</div>' +
        '</div>';
      }
      var detail = '<div class="ls-rm-soc-detail" data-tip="' + L("Was diese Stufe bedeutet, ein Beispiel und was hilft.", "What this stage means, an example, and what helps.") + '">' + socDetailInner(item, kind) + '</div>';
      var takeaway = '<div class="ls-rm-soc-takeaway"><b>' + L("Merksatz", "Takeaway") + '</b><p>' +
        (kind === "chain"
          ? L("Wer eine Stufe kontrolliert, setzt die Bedingungen für alle darunter.", "Whoever controls one stage sets the terms for everyone below.")
          : L("Macht ist nicht nur Compute: Arbeit, Wahrheit, Urheberrecht und Regeln verteilen die Risiken.", "Power is not only compute: work, truth, copyright, and rules distribute the risks.")) +
        '</p></div>';
      el.innerHTML = header(d) + switchHTML + hero + detail + takeaway;
      measureSocDetail();
      measureSocChain();
    }
    function render() {
      var d = modeData();
      el.className = "ls-rm ls-rm--" + state.mode;
      if (state.mode === "risks") { renderRisks(d); return; }
      if (state.mode === "limits") { renderLimits(d); return; }
      if (state.mode === "society") { renderSociety(d); return; }
      var active = Math.min(state.active, d.items.length - 1);
      var gridClass = state.mode === "safety" ? " ls-rm-grid--stack" : (state.mode === "limits" ? " ls-rm-grid--limits" : "");
      el.innerHTML =
        header(d) +
        '<div class="ls-rm-grid' + gridClass + '">' + d.items.map(function (item, idx) {
          var extra = "";
          if (item.level) extra = '<span class="ls-rm-level">' + esc(item.level) + '</span>';
          else if (item.status) extra = '<span class="ls-rm-status is-' + item.status + '">' + esc(statusLabel(item.status)) + '</span>';
          return '<button type="button" class="ls-rm-card' + (idx === active ? ' is-active' : '') + '" data-item="' + idx + '" data-tip="' + L("Klick zeigt die Erklärung und die Quelle dieser Ebene.", "Click shows the explanation and source for this layer.") + '">' +
            '<span class="ls-rm-tag">' + esc(item.tag) + '</span>' +
            '<b>' + esc(item.title) + '</b>' +
            '<span class="ls-rm-short">' + esc(item.short) + '</span>' +
            extra +
          '</button>';
        }).join("") + '</div>' +
        '<div class="ls-rm-detail" data-tip="' + L("Erklärung des gewählten Eintrags mit Quellenangabe.", "Explanation of the selected entry with its source.") + '">' +
          '<div class="ls-rm-detail-head"><span class="ls-rm-detail-tag">' + esc(d.items[active].tag) + '</span><b>' + esc(d.items[active].title) + '</b></div>' +
          '<p>' + esc(d.items[active].body) + '</p>' +
          '<span class="ls-rm-cite"><b>' + (DE ? "Quelle" : "Source") + ':</b> ' + linkCites(d.items[active].cite) + '</span>' +
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
      var active = el.querySelector(".ls-rm-card.is-active, .ls-rm-soc-node.is-active, .ls-rm-soc-cross-card.is-active");
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
      var modeBtn = event.target.closest ? event.target.closest("[data-soc-mode]") : null;
      if (modeBtn && el.contains(modeBtn)) {
        var nextKind = modeBtn.getAttribute("data-soc-mode") === "cross" ? "cross" : "chain";
        if (nextKind !== state.socKind) {
          state.socKind = nextKind;
          state.active = 0;
          render();
          animateDetail();
        }
        return;
      }
      var soc = event.target.closest ? event.target.closest("[data-soc-item]") : null;
      if (soc && el.contains(soc)) {
        state.socKind = soc.getAttribute("data-soc-kind") === "cross" ? "cross" : "chain";
        state.active = parseInt(soc.getAttribute("data-soc-item"), 10) || 0;
        render();
        animateDetail();
        return;
      }
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
          state.socKind = "chain";
          render();
          animateMode(dir);
        }
      },
      next: function () {
        if (state.mode === "society") {
          if (state.socKind === "chain") {
            var chain = modeData().chain;
            if (state.active < chain.length - 1) {
              state.active++;
              render();
              animateDetail();
              return true;
            }
            if (modeData().items.length) {
              state.socKind = "cross";
              state.active = 0;
              render();
              animateDetail();
              return true;
            }
            return false;
          }
          var cross = modeData().items;
          if (state.active < cross.length - 1) {
            state.active++;
            render();
            animateDetail();
            return true;
          }
          return false;
        }
        var list = modeData().items;
        if (state.active < list.length - 1) {
          state.active++;
          render();
          animateDetail();
          return true;
        }
        return false;
      },
      prev: function () {
        if (state.mode === "society") {
          if (state.socKind === "cross") {
            if (state.active > 0) {
              state.active--;
              render();
              animateDetail();
              return true;
            }
            if (modeData().chain.length) {
              state.socKind = "chain";
              state.active = modeData().chain.length - 1;
              render();
              animateDetail();
              return true;
            }
            return false;
          }
        }
        if (state.active > 0) {
          state.active--;
          render();
          animateDetail();
          return true;
        }
        return false;
      },
      hasNext: function () {
        if (state.mode === "society") {
          if (state.socKind === "chain") return modeData().chain.length > 0;
          return state.active < modeData().items.length - 1;
        }
        return state.active < modeData().items.length - 1;
      },
      hasPrev: function () {
        if (state.mode === "society" && state.socKind === "cross") return modeData().chain.length > 0;
        return state.active > 0;
      },
      resize: function () { if (state.mode === "society") { measureSocDetail(); measureSocChain(); } if (state.mode === "risks") measureRiskDetail(); },
      destroy: function () { if (el.parentNode) el.parentNode.removeChild(el); }
    };
  }
  core.register("riskmap", riskmapScene);
})();
