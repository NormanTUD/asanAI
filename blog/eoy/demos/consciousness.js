(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function consciousnessScene(root, api) {
    var DE = api.lang === "de";
    var esc = api.esc || function (s) { return String(s == null ? "" : s); };
    function L(de, en) { return DE ? de : en; }

    var MODULES = [
      { key: "visual", label: L("Visueller Cortex", "Visual cortex"), result: L("Kante", "edge"), color: "#1275ac" },
      { key: "language", label: L("Sprache", "Language"), result: L("Wort: Apfel", "word: apple"), color: "#63a44b" },
      { key: "amygdala", label: L("Amygdala", "Amygdala"), result: L("Gefahr? nein", "danger? no"), color: "#b24a4e" },
      { key: "motor", label: L("Motorik", "Motor"), result: L("greifen", "reach"), color: "#9f9700" },
      { key: "memory", label: L("Gedächtnis", "Memory"), result: L("Erinnerung", "memory"), color: "#9185be" }
    ];

    var THEORIES = [
      {
        key: "workspace", tone: "green",
        tag: "Broadcast · Zugang",
        title: "Global Workspace Theory",
        lead: L("Ein globaler Broadcast macht Ergebnisse im ganzen System verfügbar: Zugang, nicht Erleben.", "A global broadcast makes results available across the system: access, not experience."),
        body: [
          L("Spezialisierte Subsysteme broadcasten Ergebnisse in einen globalen Arbeitsraum. Nur was dort ankommt, ist für Bericht, Kontrolle und Handlung verfügbar.", "Specialised subsystems broadcast results into a global workspace. Only what arrives there is available for report, control, and action.")
        ],
        qa: [
          { q: L("Was ist der globale Arbeitsraum?", "What is the global workspace?"), a: L("Ein System, in dem Ergebnisse für Bericht, Kontrolle und Handlung global verfügbar werden.", "A system in which results become globally available for report, control, and action.") },
          { q: L("Was erklärt GWT?", "What does GWT explain?"), a: L("Zugang und Broadcast; nicht, warum Zugang sich anfühlt.", "Access and broadcast, not why access feels like anything.") },
          { q: L("Was zeigt der J-Space?", "What does the J-space show?"), a: L("Sprachliche Repräsentationen mit arbeitsraumartigem Zugang; nicht phänomenales Erleben.", "Verbal representations with workspace-like access; not phenomenal experience.") },
          { q: L("Was würde eine KI zeigen?", "What would an AI need to show?"), a: L("Einen stabilen globalen Arbeitsraum und berichtbare Integration; der J-Space ist ein Kandidat.", "A stable global workspace and reportable integration; the J-space is a candidate.") },
          { q: L("Was bleibt offen?", "What remains open?"), a: L("Der Sprung von Zugang zu Erleben; das harte Problem.", "The step from access to experience: the hard problem.") },
        ],
        cite: '<a href="https://archive.org/details/cognitivetheoryo0000baar" target="_blank" rel="noopener">Baars (1988)</a>; <a href="https://doi.org/10.1016/S0010-0277(00)00123-2" target="_blank" rel="noopener">Dehaene &amp; Naccache (2001)</a>; <a href="https://doi.org/10.1016/0004-3702(85)90063-3" target="_blank" rel="noopener">Hayes-Roth (1985)</a>',
        hint: L("Klick ein Subsystem: sein Ergebnis erscheint auf der Tafel. Broadcast macht es global.", "Click a subsystem: its result appears on the board. Broadcast makes it global."),
        status: L("Noch nichts auf der Tafel. Weiter fügt Subsysteme hinzu.", "Nothing on the board yet. Next adds subsystems.")
      },
      {
        key: "iit", tone: "gold",
        tag: "Phi · Integration",
        title: "Integrated Information Theory (IIT)",
        lead: L("Bewusstsein ist die integrierte Ursache-Wirkungs-Struktur eines Systems; Rekurrenz macht aus Teilen ein Ganzes.", "Consciousness is a system's integrated cause-effect structure; recurrence turns parts into a whole."),
        body: [
          L("Bewusstsein ist die integrierte Ursache-Wirkungs-Struktur eines Systems. Rekurrenz macht aus Teilen ein Ganzes; Phi misst, wie untrennbar es ist.", "Consciousness is a system's integrated cause-effect structure. Recurrence turns parts into a whole; Phi measures how irreducible it is.")
        ],
        qa: [
          { q: L("Was behauptet IIT?", "What does IIT claim?"), a: L("Bewusstsein ist die integrierte Ursache-Wirkungs-Struktur eines Systems.", "Consciousness is a system's integrated cause-effect structure.") },
          { q: L("Was misst Phi?", "What does Phi measure?"), a: L("Wie untrennbar das Ganze ist; Feedforward fällt auf 0.", "How irreducible the whole is; feedforward falls to zero.") },
          { q: L("Was macht der Schnitt?", "What does the cut do?"), a: L("Er kappt Verbindungen; der Puls stoppt, das Ganze wird zerlegbar.", "It cuts connections; the pulse stops and the whole becomes separable.") },
          { q: L("Kann man Phi für LLMs messen?", "Can Phi be measured for LLMs?"), a: L("Nicht belastbar; die Berechnung ist für große Systeme kaum möglich und umstritten.", "Not robustly; the computation is hard for large systems and contested.") },
          { q: L("Was bleibt offen?", "What remains open?"), a: L("Warum eine Struktur sich anfühlt; das harte Problem.", "Why a structure feels like something: the hard problem.") },
        ],
        cite: '<a href="https://doi.org/10.1186/1471-2202-5-42" target="_blank" rel="noopener">Tononi (2004)</a>; <a href="https://doi.org/10.1038/nrn.2016.44" target="_blank" rel="noopener">Tononi et al. (2016)</a>',
        hint: L("Drücke Puls. Schalte auf Feedforward: der Puls kehrt nicht zurück, Phi fällt. Ziehe den Schnitt.", "Press Pulse. Switch to feedforward: the pulse does not return, Phi falls. Pull the cut."),
        status: L("Rekurrent, ungeschnitten. Weiter pulst den Ring.", "Recurrent, uncut. Next pulses the ring.")
      },
      {
        key: "predictive", tone: "sky",
        tag: "Vorhersage · freie Energie",
        title: "Predictive Processing",
        lead: L("Das Gehirn sagt Sinnesdaten voraus und korrigiert den Fehler; Wahrnehmung ist kontrollierte Halluzination.", "The brain predicts sensory input and corrects the error; perception is controlled hallucination."),
        body: [
          L("Das Gehirn sagt Sinnesdaten voraus und korrigiert den Fehler. Präzision entscheidet, ob Vorhersage oder Evidenz dominiert.", "The brain predicts sensory input and corrects the error. Precision decides whether prediction or evidence dominates.")
        ],
        qa: [
          { q: L("Was ist Predictive Processing?", "What is predictive processing?"), a: L("Das Gehirn sagt Sinnesdaten voraus und korrigiert den Fehler.", "The brain predicts sensory input and corrects the error.") },
          { q: L("Was ist Präzision?", "What is precision?"), a: L("Wie stark das System Vorhersage oder Eingang vertraut.", "How strongly the system trusts prediction or input.") },
          { q: L("Warum kontrollierte Halluzination?", "Why controlled hallucination?"), a: L("Bei hoher Präzision dominiert die Vorhersage; der Eingang korrigiert kaum.", "At high precision the prediction dominates; input barely corrects it.") },
          { q: L("Was fehlt LLMs?", "What do LLMs lack?"), a: L("Ein sensomotorischer Körper und eine Handlungsschleife; sie sagen Text voraus.", "A sensorimotor body and an action loop; they predict text.") },
          { q: L("Was bleibt offen?", "What remains open?"), a: L("Warum Vorhersage sich anfühlt; das harte Problem.", "Why prediction feels like anything: the hard problem.") },
        ],
        cite: '<a href="https://doi.org/10.1017/S0140525X12000477" target="_blank" rel="noopener">Clark (2013)</a>; <a href="https://doi.org/10.1038/nrn2787" target="_blank" rel="noopener">Friston (2010)</a>',
        hint: L("Wähle einen Eingang und zieh an der Präzision. Bei hoher Präzision dominiert die Vorhersage.", "Choose an input and drag precision. At high precision the prediction dominates."),
        status: L("Mittlere Präzision. Weiter aktualisiert das Modell.", "Medium precision. Next updates the model.")
      },
      {
        key: "kastrup", tone: "blue",
        tag: "Bewusstsein ist fundamental",
        title: "Analytic Idealism (Kastrup)",
        lead: L("Ein Ozean, viele Wirbel: Individualbewusstsein als lokale Dissoziation.", "One ocean, many vortices: individual consciousness as local dissociation."),
        body: [
          L("Bewusstsein ist fundamental; jedes Ich ist eine lokale, temporäre Dissoziation im selben Bewusstsein.", "Consciousness is fundamental; each “I” is a local, temporary dissociation within the same consciousness.")
        ],
        qa: [
          { q: L("Was ist Bewusstsein?", "What is consciousness?"), a: L("Das Fundament; Materie ist eine Erscheinung in Bewusstsein.", "The foundation; matter is an appearance within consciousness.") },
          { q: L("Was ist ein Ich?", "What is an “I”?"), a: L("Eine lokale, temporäre Dissoziation, wie ein Wirbel im Wasser.", "A local, temporary dissociation, like a vortex in water.") },
          { q: L("Was ist der Tod?", "What is death?"), a: L("Das Ende der Dissoziation; das eine Bewusstsein bleibt.", "The end of the dissociation; the one consciousness remains.") },
          { q: L("Was ist das Dashboard?", "What is the dashboard?"), a: L("Wahrnehmung ist ein komprimiertes Icon, nicht das Ding selbst.", "Perception is a compressed icon, not the thing itself.") },
          { q: L("Was ist der Einwand?", "What is the objection?"), a: L("Metaphysisch und schwer falsifizierbar; konkrete Mechanismen erklärt sie weniger.", "Metaphysical and hard to falsify; concrete mechanisms are less explained.") },
        ],
        cite: '<a href="https://www.bernardokastrup.com/p/papers.html" target="_blank" rel="noopener">Kastrup (2018/2019)</a>',
        hint: L("Zieh an der Dissoziation. Weiter: Der Tod beendet die Dissoziation, die Wirbel lösen sich auf.", "Drag dissociation. Next: death ends the dissociation, the vortices dissolve."),
        status: L("Drei Wirbel, stark dissoziiert. Weiter beendet die Dissoziation: Der Tod löst die Wirbel auf.", "Three vortices, strongly dissociated. Next ends the dissociation: death dissolves the vortices.")
      },
      {
        key: "fourE", tone: "teal",
        tag: "Körper · Welt · Handlung · Werkzeug",
        title: "4E Cognition",
        lead: L("Denken ist kein Rechnen im Kopf: Es ist Körper, Welt, Handlung und Werkzeug.", "Thinking is not computation in the head: it is body, world, action, and tool."),
        body: [
          L("4E Cognition beschreibt Denken als biologische und situierte Tätigkeit. Ein LLM lebt nur in der Extended-Dimension: Textwerkzeug, aber ohne Körper, Welt und Handlung.", "4E Cognition describes thinking as a biological and situated activity. An LLM lives only in the extended dimension: a text tool without a body, world, or action.")
        ],
        qa: [
          { q: L("Was sind die vier E's?", "What are the four E's?"), a: L("Embodied, Embedded, Enacted, Extended: Körper, Welt, Handlung, Werkzeug.", "Embodied, Embedded, Enacted, Extended: body, world, action, tool.") },
          { q: L("Warum fehlt KI die Erdung?", "Why does AI lack grounding?"), a: L("Ihr fehlen Körper, geteilte physische Welt und Handlungsschleife; sie lebt nur im Extended-Modus.", "It lacks a body, a shared physical world, and an action loop; it lives only in the extended mode.") },
          { q: L("Was heißt „heiß“ für Mensch und LLM?", "What does “hot” mean for a human and an LLM?"), a: L("Für uns ein verbranntes Finger; für ein LLM Token nahe Ofen, Sonne, scharf.", "A burnt finger for us; tokens near stove, sun, and spicy for an LLM.") },
          { q: L("Ist 4E ein Bewusstseinstest?", "Is 4E a test for consciousness?"), a: L("Nein, eine Familie von Ansätzen; sie zeigt, was Erdung verlangt.", "No, a family of approaches; it shows what grounding requires.") },
          { q: L("Was ist Triumph und Leere?", "What is the triumph and the hollowness?"), a: L("LLMs sind ein Triumph des Extended Mind; ohne embodied grounding bleiben sie Werkzeuge.", "LLMs are a triumph of the extended mind; without embodied grounding they remain tools.") },
          { q: L("Was sagt Noë?", "What does Noë say?"), a: L("Bewusstsein ist etwas, das wir erreichen; eher Tanzen als Verdauen.", "Consciousness is something we achieve, more like dancing than digestion.") },
        ],
        cite: '<a href="https://openlibrary.org/works/OL12000405W" target="_blank" rel="noopener">Noë (2009)</a>; <a href="https://doi.org/10.1093/analys/58.1.7" target="_blank" rel="noopener">Clark &amp; Chalmers (1998)</a>; <a href="https://openlibrary.org/works/OL15207300W" target="_blank" rel="noopener">Varela et al. (1991)</a>',
        hint: L("Wechsle Mensch/KI und klick die vier E's. Beobachte, was „heiß“ im Körper verankert.", "Switch human/AI and click the four E's. Watch what anchors “hot” in the body."),
        status: L("Mensch: 4 von 4 gekoppelt. Wechsel auf KI: nur Extended bleibt.", "Human: 4 of 4 coupled. Switch to AI: only Extended remains."),
        quote: {
          text: "Consciousness is not something that happens inside us. It is something we do or make. Better: it is something we achieve. Consciousness is more like dancing than it is like digestion.",
          author: "Alva Noë",
          work: "Out of Our Heads: Why You Are Not Your Brain, and Other Lessons From the Biology of Consciousness (2009)",
          url: "https://openlibrary.org/works/OL12000405W"
        }
      },
      {
        key: "myst", tone: "lilac",
        tag: "Die Grenze der Erklärung",
        title: "New Mysterianism",
        lead: L("Vielleicht liegt Bewusstsein jenseits unserer Begriffe – wie Differentialgleichungen für eine Ratte.", "Perhaps consciousness lies beyond our concepts – like differential equations for a rat."),
        body: [
          L("Ratten lernen das Labyrinth, lösen aber keine Differentialgleichungen. McGinn fragt, ob Bewusstsein eine ähnliche Begriffsgrenze für uns ist.", "Rats learn the maze but do not solve differential equations. McGinn asks whether consciousness is a similar limit of our concepts.")
        ],
        qa: [
          { q: L("Was behauptet McGinn?", "What does McGinn claim?"), a: L("Bewusstsein könnte jenseits unserer Begriffe liegen.", "Consciousness may lie beyond our concepts.") },
          { q: L("Warum die Ratte?", "Why the rat?"), a: L("Sie lernt das Labyrinth, löst aber keine Differentialgleichungen.", "It learns the maze but does not solve differential equations.") },
          { q: L("Ist das falsifizierbar?", "Is that falsifiable?"), a: L("Nein; keine Beobachtung kann die Grenze zeigen.", "No; no observation can demonstrate the limit.") },
          { q: L("Was folgt für KI?", "What follows for AI?"), a: L("Kein Test; die Frage verschiebt sich in unsere Erkenntnisgrenzen.", "No test; the question moves into our cognitive limits.") },
          { q: L("Was ist der Einwand?", "What is the objection?"), a: L("Eine Grenze zu behaupten erklärt Bewusstsein nicht.", "Claiming a limit does not explain consciousness.") },
        ],
        cite: '<a href="https://doi.org/10.1093/mind/XCVIII.391.349" target="_blank" rel="noopener">McGinn (1989)</a>; <a href="https://doi.org/10.1037/h0060262" target="_blank" rel="noopener">Tolman, Ritchie &amp; Kalish (1946)</a>; <a href="https://doi.org/10.1037/0097-7403.2.2.97" target="_blank" rel="noopener">Olton &amp; Samuelson (1976)</a>',
        hint: L("Neue Frage erzeugt ein weiteres Fragezeichen. Manche sind groß, manche klein; keine landet auf einer Antwort.", "New question spawns another question mark. Some are large, some small; none lands on an answer."),
        status: L("Die Fragezeichen fliegen. Weiter erzeugt weitere Fragen.", "The question marks are flying. Next creates more questions.")
      }
    ];

    var el = document.createElement("div");
    el.className = "ls-con2";
    el.innerHTML =
      '<div class="ls-con2-head">' +
        '<span class="ls-con2-kicker" data-con2-kicker></span>' +
        '<b data-con2-title></b>' +
        '<p class="ls-con2-lead" data-con2-lead></p>' +
        '<span class="ls-con2-navhint">← → ' + L("Schritt", "step") + '</span>' +
      '</div>' +
      '<div class="ls-con2-stage"><canvas class="ls-con2-canvas" role="img" aria-label="' + L("Interaktive Bewusstseins-Theorie.", "Interactive theory of consciousness.") + '"></canvas></div>' +
      '<div class="ls-con2-controls" data-con2-controls></div>' +
      '<p class="ls-con2-status" data-con2-status aria-live="polite"></p>' +
      '<aside class="ls-con2-detail" data-con2-detail></aside>';
    root.appendChild(el);

    var canvas = el.querySelector(".ls-con2-canvas");
    var stage = el.querySelector(".ls-con2-stage");
    var controls = el.querySelector("[data-con2-controls]");
    var detail = el.querySelector("[data-con2-detail]");
    var kicker = el.querySelector("[data-con2-kicker]");
    var titleEl = el.querySelector("[data-con2-title]");
    var leadEl = el.querySelector("[data-con2-lead]");
    var statusEl = el.querySelector("[data-con2-status]");

    var C = api.colors();
    var ROSE = "#b24a4e";
    var reduce = !!api.reducedMotion;
    var active = 0, qaOpen = 0, activeSince = performance.now(), start = performance.now();
    var size = null, ctx = null, raf = 0, paused = false;
    var stars = [];
    for (var si = 0; si < 64; si++) stars.push({ x: (si * 0.37 + 0.05) % 1, y: (si * 0.31 + 0.09) % 1, r: 0.5 + (si % 3) * 0.5, a: 0.05 + (si % 6) * 0.025 });

    var ws = { written: [false, false, false, false, false], broadcastUntil: 0, broadcasted: false, last: -1, pulseStart: 0 };
    var iit = { feedforward: false, cut: 0, pulseStart: 0, phi: 0.82, pulsed: false };
    var pred = { precision: 58, stimulus: "apple", priorCenter: 0.5, priorTarget: null, surprise: 0 };
    var kast = { diss: 70, count: 3, selected: 0, dissolved: false };
    var four = { mode: "human", focus: 0, word: "hot" };
    var FOUR_E = [
      { key: "embodied", label: "Embodied", subDe: "Körper", subEn: "Body", noteDe: "Sinne, Schmerz, Motorik: Denken ist an einen Körper gebunden.", noteEn: "Senses, pain, motor control: thought is tied to a body.", missingDe: "kein Körper, kein Nervensystem", missingEn: "no body, no nervous system", color: "#ffb36b" },
      { key: "embedded", label: "Embedded", subDe: "Welt", subEn: "World", noteDe: "Physische und soziale Lage: Denken findet in einer Welt statt.", noteEn: "Physical and social situation: thought happens in a world.", missingDe: "keine geteilte physische Welt", missingEn: "no shared physical world", color: "#7fe0b0" },
      { key: "enacted", label: "Enacted", subDe: "Handlung", subEn: "Action", noteDe: "Wissen entsteht im Handeln und in der Rückmeldung der Welt.", noteEn: "Knowledge arises in action and in the world's feedback.", missingDe: "keine Handlungsschleife", missingEn: "no action loop", color: "#7fd7ef" },
      { key: "extended", label: "Extended", subDe: "Werkzeug", subEn: "Tool", noteDe: "Werkzeuge erweitern das Denken; hier lebt die KI.", noteEn: "Tools extend thought; this is where AI lives.", missingDe: "Textwerkzeug, aber allein", missingEn: "a text tool, alone", color: "#c7a5ff" }
    ];
    var FOUR_WORDS = {
      hot: { de: "heiß", en: "hot", groundDe: "verbrannte Finger", groundEn: "a burnt finger", tokensDe: ["Ofen", "Sonne", "scharf", "Kaffee"], tokensEn: ["stove", "sun", "spicy", "coffee"], color: "#ff8b6b" },
      heavy: { de: "schwer", en: "heavy", groundDe: "Muskeln ziehen", groundEn: "muscles strain", tokensDe: ["Gewicht", "Stein", "kg", "Masse"], tokensEn: ["weight", "stone", "kg", "mass"], color: "#ffd27a" },
      danger: { de: "Gefahr", en: "danger", groundDe: "Herz schlägt schnell", groundEn: "the heart races", tokensDe: ["Risiko", "Warnung", "Angst", "Bedrohung"], tokensEn: ["risk", "warning", "fear", "threat"], color: "#ff6b8a" },
      tree: { de: "Baum", en: "tree", groundDe: "gemeinsamer Blick", groundEn: "a shared gaze", tokensDe: ["Blatt", "Wald", "grün", "Holz"], tokensEn: ["leaf", "forest", "green", "wood"], color: "#7fe0b0" }
    };
    var fourStars = [];
    for (var fsi = 0; fsi < 84; fsi++) fourStars.push({ x: (fsi * 0.37 + 0.03) % 1, y: (fsi * 0.53 + 0.11) % 1, r: 0.4 + (fsi % 4) * 0.35, a: 0.04 + (fsi % 5) * 0.018 });
    var myst = { marks: [] };

    var PRED_STIM = {
      apple: { center: 0.34, label: L("Apfel", "apple") },
      word: { center: 0.58, label: L("Wort", "word") },
      pain: { center: 0.8, label: L("Schmerz", "pain") }
    };

    function rr(x, y, w, h, r) {
      var rad = Math.max(0, Math.min(r, w / 2, h / 2));
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.arcTo(x + w, y, x + w, y + h, rad);
      ctx.arcTo(x + w, y + h, x, y + h, rad);
      ctx.arcTo(x, y + h, x, y, rad);
      ctx.arcTo(x, y, x + w, y, rad);
      ctx.closePath();
    }
    function font(px, weight) { return (weight || 600) + " " + Math.max(10, Math.round(px)) + 'px "Open Sans", sans-serif'; }
    function dot(x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function setStatus(text) { if (statusEl) statusEl.textContent = text; }

    function gauss(x, c, s) { return Math.exp(-Math.pow(x - c, 2) / (2 * s * s)); }
    function cosine(a, b) {
      var d = 0, na = 0, nb = 0;
      for (var i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
      return d / (Math.sqrt(na * nb) || 1);
    }
    function predCalc() {
      var n = 140, input = [], prior = [], percept = [], xs = [], prec = pred.precision / 100;
      for (var i = 0; i < n; i++) {
        var x = i / (n - 1); xs.push(x);
        var wig = 0.032 * Math.sin(x * 53 + 1.2) + 0.018 * Math.sin(x * 127 + 0.5);
        var inp = gauss(x, PRED_STIM[pred.stimulus].center, 0.072) + wig;
        var pri = gauss(x, pred.priorCenter, 0.1);
        input.push(inp); prior.push(pri); percept.push(prec * pri + (1 - prec) * inp);
      }
      pred.surprise = clamp((1 - cosine(input, percept)) * 100, 0, 100);
      return { xs: xs, input: input, prior: prior, percept: percept };
    }
    function initMyst() {
      myst.marks = [];
      for (var i = 0; i < 14; i++) spawnMark(true);
    }
    function spawnMark(initial) {
      myst.marks.push({
        x: initial ? Math.random() : -0.1,
        y: 0.08 + Math.random() * 0.84,
        size: 18 + Math.random() * 78,
        speed: 0.006 + Math.random() * 0.018,
        drift: (Math.random() - 0.5) * 0.01,
        rot: (Math.random() - 0.5) * 0.5,
        spin: (Math.random() - 0.5) * 0.002,
        a: 0.22 + Math.random() * 0.65
      });
      if (myst.marks.length > 34) myst.marks.shift();
    }
    initMyst();

    function resetTheory() {
      if (active === 0) { ws = { written: [false, false, false, false, false], broadcastUntil: 0, broadcasted: false, last: -1, pulseStart: 0 }; setStatus(THEORIES[0].status); }
      if (active === 1) { iit = { feedforward: false, cut: 0, pulseStart: 0, phi: 0.82, pulsed: false }; setStatus(THEORIES[1].status); }
      if (active === 2) { pred = { precision: 58, stimulus: "apple", priorCenter: 0.5, priorTarget: null, surprise: 0 }; setStatus(THEORIES[2].status); }
      if (active === 3) { kast = { diss: 70, count: 3, selected: 0, dissolved: false }; setStatus(THEORIES[3].status); }
      if (active === 4) { four = { mode: "human", focus: 0, word: "hot" }; setStatus(THEORIES[4].status); }
      if (active === 5) { initMyst(); setStatus(THEORIES[5].status); }
      renderControls(); draw(performance.now());
    }

    function wsCenters(w, h) {
      var cx = w * 0.5, cy = h * 0.52, R = Math.min(w * 0.20, h * 0.30);
      var pts = [];
      for (var i = 0; i < 5; i++) {
        var a = -Math.PI / 2 + i * Math.PI * 2 / 5;
        pts.push({ x: cx + Math.cos(a) * R * 2.0, y: cy + Math.sin(a) * R * 1.35, a: a });
      }
      return { cx: cx, cy: cy, R: R, pts: pts, cardW: Math.min(190, w * 0.22), cardH: 58 };
    }
    function moduleIcon(kind, x, y, color) {
      ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.6; ctx.lineCap = "round";
      if (kind === "visual") {
        ctx.beginPath(); ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 2.3, 0, Math.PI * 2); ctx.fill();
      } else if (kind === "language") {
        rr(-7, -6, 14, 10, 3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-1, 4); ctx.lineTo(-5, 8); ctx.lineTo(1, 4); ctx.stroke();
      } else if (kind === "amygdala") {
        ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(8, 6); ctx.lineTo(-8, 6); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 3.6, 0.8, 0, Math.PI * 2); ctx.fill();
      } else if (kind === "motor") {
        ctx.beginPath(); ctx.moveTo(-8, 2); ctx.lineTo(2, -6); ctx.lineTo(8, -1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(2, -6); ctx.lineTo(2, 5); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(4, -7); ctx.lineTo(7, -4); ctx.lineTo(7, 7); ctx.lineTo(-7, 7); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-3, -2); ctx.lineTo(3, -2); ctx.moveTo(-3, 2); ctx.lineTo(3, 2); ctx.stroke();
      }
      ctx.restore();
    }
    function drawWorkspace(w, h, t, now) {
      var bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "rgba(18,117,172,.06)"); bg.addColorStop(0.55, "rgba(255,255,255,0)"); bg.addColorStop(1, "rgba(201,162,39,.08)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      var g = wsCenters(w, h), cx = g.cx, cy = g.cy, R = g.R;
      var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.15);
      glow.addColorStop(0, "rgba(201,162,39,.16)"); glow.addColorStop(0.55, "rgba(18,117,172,.06)"); glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      g.pts.forEach(function (p, i) {
        var m = MODULES[i];
        var ex = cx + (p.x - cx) * (R / Math.hypot(p.x - cx, p.y - cy) || 1);
        var ey = cy + (p.y - cy) * (R / Math.hypot(p.x - cx, p.y - cy) || 1);
        ctx.strokeStyle = ws.written[i] ? m.color : C.lineStrong;
        ctx.globalAlpha = ws.written[i] ? 0.42 : 0.22; ctx.lineWidth = ws.written[i] ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.globalAlpha = 1;
        if (ws.pulseStart && ws.last === i) {
          var ph = (now - ws.pulseStart) / 700;
          if (ph >= 0 && ph <= 1) {
            var px = p.x + (ex - p.x) * ph, py = p.y + (ey - p.y) * ph;
            ctx.save(); ctx.shadowColor = m.color; ctx.shadowBlur = 16; dot(px, py, 4.5, m.color); ctx.restore();
          }
        }
      });
      var pulse = 1 + 0.02 * Math.sin(t * 2.2);
      ctx.beginPath(); ctx.arc(cx, cy, R * pulse, 0, Math.PI * 2);
      ctx.fillStyle = C.paper; ctx.fill(); ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.88, 0, Math.PI * 2); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = C.petrol; ctx.font = font(13, 700); ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText("GLOBAL WORKSPACE", cx, cy - R + 18);
      ctx.fillStyle = C.muted; ctx.font = font(10.5, 600);
      ctx.fillText(L("nur Ergebnisse", "results only"), cx, cy - R + 34);
      var results = MODULES.map(function (m, i) { return ws.written[i] ? m : null; }).filter(Boolean);
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      if (!results.length) {
        ctx.fillStyle = C.muted; ctx.font = font(api.font("canvas-sm") * 0.78, 600); ctx.textAlign = "center";
        ctx.fillText(L("noch leer", "empty"), cx, cy + 6);
      } else {
        var startY = cy - (results.length - 1) * 9 + 6;
        results.forEach(function (m, i) {
          dot(cx - Math.min(62, R * 0.55), startY + i * 18, 4, m.color);
          ctx.fillStyle = C.soft; ctx.font = font(11, 600);
          ctx.textAlign = "left"; ctx.textBaseline = "middle";
          ctx.fillText(m.result, cx - Math.min(50, R * 0.42), startY + i * 18);
        });
      }
      if (ws.broadcastUntil > now) {
        var phase = 1 - (ws.broadcastUntil - now) / 1200;
        for (var r = 0; r < 3; r++) {
          ctx.beginPath(); ctx.arc(cx, cy, R + 12 + phase * R * 1.4 + r * 24, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(201,162,39," + (0.5 - phase * 0.4 - r * 0.08) + ")"; ctx.lineWidth = 1.4; ctx.stroke();
        }
      }
      g.pts.forEach(function (p, i) {
        var m = MODULES[i], on = ws.written[i];
        var x = p.x - g.cardW / 2, y = p.y - g.cardH / 2;
        rr(x, y, g.cardW, g.cardH, 12);
        ctx.fillStyle = on ? "rgba(255,255,255,.98)" : "rgba(255,255,255,.76)"; ctx.fill();
        ctx.strokeStyle = on ? m.color : C.line; ctx.lineWidth = on ? 1.8 : 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(x + 23, p.y, 15, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,75,111,.06)"; ctx.fill();
        moduleIcon(m.key, x + 23, p.y, m.color);
        ctx.fillStyle = C.ink; ctx.font = font(12, 700); ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillText(m.label, x + 44, p.y - 6);
        ctx.fillStyle = on ? m.color : C.muted; ctx.font = font(10.5, 600);
        ctx.fillText(on ? m.result : L("klick", "click"), x + 44, p.y + 9);
      });
      ctx.fillStyle = "rgba(0,75,111,.42)"; ctx.font = font(10.5, 600); ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText(L("— kein Zuschauer; nur der Broadcast —", "— no audience; only the broadcast —"), cx, h - 14);
    }
    function drawIIT(w, h, t, now) {
      var bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "rgba(201,162,39,.07)"); bg.addColorStop(1, "rgba(18,117,172,.06)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      var N = 6, cx = w * 0.5, cy = h * 0.52, R = Math.min(w, h) * 0.31;
      var pos = [];
      if (iit.feedforward) {
        for (var i = 0; i < N; i++) pos.push({ x: w * 0.1 + i * (w * 0.8) / (N - 1), y: cy });
      } else {
        for (var j = 0; j < N; j++) {
          var a = -Math.PI / 2 + j * Math.PI * 2 / N;
          pos.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R });
        }
      }
      var cutIdx = Math.round(iit.cut / 100 * N);
      function arrowEdge(p1, p2, color, width, alpha, off) {
        var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
        var dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.hypot(dx, dy) || 1;
        var qx = mx - dy / len * (off || 0), qy = my + dx / len * (off || 0);
        ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = width; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.quadraticCurveTo(qx, qy, p2.x, p2.y); ctx.stroke();
        var ang = Math.atan2(p2.y - qy, p2.x - qx);
        ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p2.x - Math.cos(ang - 0.42) * 8, p2.y - Math.sin(ang - 0.42) * 8);
        ctx.lineTo(p2.x - Math.cos(ang + 0.42) * 8, p2.y - Math.sin(ang + 0.42) * 8);
        ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      }
      if (iit.feedforward) {
        for (var e = 0; e < N - 1; e++) arrowEdge(pos[e], pos[e + 1], C.blue, 2, 0.62, 0);
        ctx.fillStyle = C.muted; ctx.font = font(11, 600); ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(L("Kette: der Puls endet am letzten Knoten – keine Rückkehr", "chain: the pulse ends at the last node – no return"), cx, cy + 38);
      } else {
        for (var r = 0; r < N; r++) {
          if (cutIdx > 0 && r >= N - cutIdx) continue;
          arrowEdge(pos[r], pos[(r + 1) % N], C.blue, 1.8, 0.55, -8);
          arrowEdge(pos[(r + 1) % N], pos[r], C.gold, 1.8, 0.52, -8);
        }
        if (cutIdx > 0) {
          var ga = pos[(N - cutIdx) % N], gb = pos[(N - cutIdx - 1 + N) % N];
          ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = ROSE; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(ga.x, ga.y); ctx.lineTo(gb.x, gb.y); ctx.stroke(); ctx.restore();
          ctx.fillStyle = ROSE; ctx.font = font(11, 700); ctx.textAlign = "center"; ctx.textBaseline = "bottom";
          ctx.fillText(L("Partition", "partition"), (ga.x + gb.x) / 2, (ga.y + gb.y) / 2 - 6);
        }
        ctx.fillStyle = C.muted; ctx.font = font(11, 600); ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(L("Ring: der Puls kehrt zurück – Rückkopplung", "ring: the pulse returns – recurrence"), cx, cy + R + 24);
      }
      if (iit.pulseStart) {
        var phase = (now - iit.pulseStart) / 1300;
        if (phase >= 0 && phase <= 1) {
          if (iit.feedforward) {
            var u = phase * (N - 1), idx = Math.min(N - 2, Math.floor(u)), fr = u - idx;
            var px = pos[idx].x + (pos[idx + 1].x - pos[idx].x) * fr;
            var py = pos[idx].y + (pos[idx + 1].y - pos[idx].y) * fr;
            ctx.save(); ctx.shadowColor = C.blue; ctx.shadowBlur = 20; dot(px, py, 6, C.blue); ctx.restore();
          } else {
            var sweep = (N - cutIdx) / N * Math.PI * 2;
            var aa = -Math.PI / 2 + phase * sweep;
            var qx2 = cx + Math.cos(aa) * R, qy2 = cy + Math.sin(aa) * R;
            ctx.save(); ctx.shadowColor = C.blue; ctx.shadowBlur = 20; dot(qx2, qy2, 6, C.blue); ctx.restore();
            if (cutIdx === 0) {
              var ab = -Math.PI / 2 - phase * Math.PI * 2;
              var rx = cx + Math.cos(ab) * R, ry = cy + Math.sin(ab) * R;
              ctx.save(); ctx.shadowColor = C.gold; ctx.shadowBlur = 18; dot(rx, ry, 5.5, C.gold); ctx.restore();
            }
          }
        } else iit.pulseStart = 0;
      }
      for (var n = 0; n < N; n++) {
        var p = pos[n];
        ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = n === 0 ? C.gold : C.paper; ctx.fill();
        ctx.strokeStyle = C.petrol; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.fillStyle = n === 0 ? "#fff" : C.petrol; ctx.font = font(11, 700);
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(n + 1), p.x, p.y + 1);
      }
      iit.phi = iit.feedforward ? 0 : clamp((1 - iit.cut / 100) * (0.62 + 0.36 * (1 - iit.cut / 120)), 0, 0.98);
      var gx = w - 62, gy = 54, gr = 27;
      ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI * 0.8, Math.PI * 2.2);
      ctx.strokeStyle = C.line; ctx.lineWidth = 6; ctx.stroke();
      ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI * 0.8, Math.PI * 0.8 + Math.PI * 1.4 * iit.phi);
      ctx.strokeStyle = iit.phi > 0.55 ? C.green : iit.phi > 0.2 ? C.gold : ROSE; ctx.lineWidth = 6; ctx.stroke();
      ctx.fillStyle = C.ink; ctx.font = font(18, 700); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(iit.phi.toFixed(2), gx, gy);
      ctx.fillStyle = C.muted; ctx.font = font(10, 600); ctx.fillText("Φ", gx, gy - 15);
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      [C.blue, C.gold].forEach(function (col, i) {
        var lx = 18 + i * 150, ly = 18;
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 18, ly); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(lx + 18, ly); ctx.lineTo(lx + 12, ly - 3); ctx.lineTo(lx + 12, ly + 3); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
        ctx.fillStyle = C.soft; ctx.font = font(11, 600);
        ctx.fillText(i === 0 ? L("vorwärts", "forward") : L("Rückkopplung", "recurrence"), lx + 24, ly);
      });
    }
    function drawPredictive(w, h, t, now) {
      if (pred.priorTarget !== null) {
        var d = pred.priorTarget - pred.priorCenter;
        if (Math.abs(d) < 0.002) { pred.priorCenter = pred.priorTarget; pred.priorTarget = null; }
        else pred.priorCenter += d * 0.06;
      }
      var data = predCalc();
      var bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "rgba(18,117,172,.055)"); bg.addColorStop(1, "rgba(201,162,39,.06)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      var padX = 46, topY = h * 0.18, baseY = h * 0.82, span = w - padX * 2;
      function X(x) { return padX + x * span; }
      function Y(v) { return baseY - clamp(v, 0, 1.15) / 1.15 * (baseY - topY); }
      ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      for (var g = 0; g <= 4; g++) {
        var yy = topY + (baseY - topY) * g / 4;
        ctx.beginPath(); ctx.moveTo(padX * 0.55, yy); ctx.lineTo(w - padX * 0.55, yy); ctx.stroke();
      }
      ctx.strokeStyle = C.lineStrong; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(padX * 0.55, baseY + 0.5); ctx.lineTo(w - padX * 0.55, baseY + 0.5); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(X(data.xs[0]), Y(data.input[0]));
      for (var i = 1; i < data.xs.length; i++) ctx.lineTo(X(data.xs[i]), Y(data.input[i]));
      for (var j = data.xs.length - 1; j >= 0; j--) ctx.lineTo(X(data.xs[j]), Y(data.percept[j]));
      ctx.closePath(); ctx.fillStyle = ROSE; ctx.globalAlpha = 0.10; ctx.fill(); ctx.globalAlpha = 1;
      function curve(values, color, width, glow) {
        ctx.beginPath();
        for (var k = 0; k < values.length; k++) {
          var x = X(data.xs[k]), y = Y(values[k]);
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color; ctx.lineWidth = width;
        if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 10; }
        ctx.stroke(); ctx.shadowBlur = 0;
      }
      curve(data.prior, C.gold, 1.8, true);
      curve(data.input, C.blue, 1.8, true);
      curve(data.percept, C.green, 2.8, true);
      ctx.save(); ctx.setLineDash([3, 6]); ctx.strokeStyle = C.blue; ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.moveTo(X(PRED_STIM[pred.stimulus].center), topY); ctx.lineTo(X(PRED_STIM[pred.stimulus].center), baseY); ctx.stroke();
      ctx.strokeStyle = C.gold; ctx.beginPath(); ctx.moveTo(X(pred.priorCenter), topY); ctx.lineTo(X(pred.priorCenter), baseY); ctx.stroke();
      ctx.restore();
      var legend = [[L("Vorhersage", "prediction"), C.gold], [L("Eingang", "input"), C.blue], [L("Wahrnehmung", "percept"), C.green]];
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      legend.forEach(function (l, i) {
        var lx = 18 + i * 112, ly = 18;
        dot(lx, ly, 4, l[1]);
        ctx.fillStyle = C.soft; ctx.font = font(11, 600);
        ctx.fillText(l[0], lx + 9, ly);
      });
      ctx.textAlign = "right"; ctx.textBaseline = "top";
      ctx.fillStyle = C.gold; ctx.font = font(16, 700);
      ctx.fillText(L("Überraschung ", "surprise ") + Math.round(pred.surprise) + "%", w - 18, 12);
      ctx.fillStyle = C.muted; ctx.font = font(10.5, 600);
      ctx.fillText(L("Präzision ", "precision ") + Math.round(pred.precision) + "%", w - 18, 32);
    }

    function kastCenters(w, h) {
      var spots = [
        { x: 0.5, y: 0.52 }, { x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 },
        { x: 0.35, y: 0.28 }, { x: 0.65, y: 0.28 }
      ];
      var order = [[0], [1, 2], [1, 0, 2], [1, 2, 3, 4], [1, 3, 0, 4, 2]];
      var ids = order[Math.max(0, Math.min(4, kast.count - 1))] || [0];
      return ids.map(function (id, i) { return { x: w * spots[id].x, y: h * spots[id].y, i: i }; });
    }
    function drawVortex(c, on, diss, t) {
      var vR = 42 + diss * 10;
      if (on) {
        var gl = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, vR * 1.45);
        gl.addColorStop(0, "rgba(201,243,255,.13)"); gl.addColorStop(1, "rgba(201,243,255,0)");
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(c.x, c.y, vR * 1.45, 0, Math.PI * 2); ctx.fill();
      }
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(-0.18 + c.i * 0.055);
      var body = ctx.createRadialGradient(0, 0, 2, 0, 0, vR);
      body.addColorStop(0, "rgba(2,14,20,.90)");
      body.addColorStop(0.52, "rgba(18,117,172,.22)");
      body.addColorStop(1, "rgba(126,200,239,0)");
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.ellipse(0, 0, vR, vR * 0.44, 0, 0, Math.PI * 2); ctx.fill();
      for (var k = 0; k < 5; k++) {
        var f = k / 4, rr = vR * (1 - f * 0.72), yy = -vR * 0.10 + f * vR * 0.30;
        ctx.beginPath(); ctx.ellipse(0, yy, rr, rr * 0.44, 0, 0, Math.PI * 2);
        ctx.strokeStyle = on ? "rgba(255,239,191,.60)" : "rgba(201,243,255,.42)";
        ctx.globalAlpha = 0.12 + f * 0.10; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.globalAlpha = 1;
      for (var arm = 0; arm < 2; arm++) {
        var base = arm * Math.PI + t * 0.45;
        ctx.beginPath();
        for (var st = 0; st <= 52; st++) {
          var u = st / 52, ang = base + u * Math.PI * 1.85;
          var rad = 3 + u * vR * 0.96;
          var xx = Math.cos(ang) * rad;
          var yy = Math.sin(ang) * rad * 0.44 + (1 - u) * vR * 0.05;
          if (st === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.strokeStyle = on ? "rgba(255,239,191,.72)" : "rgba(201,243,255,.36)";
        ctx.lineWidth = on ? 1.8 : 1.3; ctx.lineCap = "round"; ctx.stroke();
      }
      var hole = ctx.createRadialGradient(0, 0, 1, 0, 0, vR * 0.24);
      hole.addColorStop(0, "#010a0f"); hole.addColorStop(1, "rgba(3,19,26,.15)");
      ctx.fillStyle = hole;
      ctx.beginPath(); ctx.ellipse(0, vR * 0.04, vR * 0.24, vR * 0.11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 0, vR * 0.98, vR * 0.42, 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.strokeStyle = "rgba(230,250,255,.30)"; ctx.lineWidth = 1.4; ctx.stroke();
      for (var sp = 0; sp < 5; sp++) {
        var sa = t * 0.55 + sp * 1.6, sr = vR * (0.35 + (sp % 3) * 0.18);
        ctx.globalAlpha = on ? 0.62 : 0.32;
        dot(Math.cos(sa) * sr, Math.sin(sa) * sr * 0.44, 1 + (sp % 2) * 0.5, "#e9fbff");
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      ctx.fillStyle = on ? "#ffefbf" : "rgba(234,246,250,.70)";
      ctx.font = font(11, 700); ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(kast.count === 1 ? L("der eine Ozean", "the one ocean") : L("Geist ", "mind ") + String.fromCharCode(65 + c.i), c.x, c.y + vR * 0.48 + 16);
    }
    function drawKastrup(w, h, t, now) {
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#062a3a"); g.addColorStop(0.55, "#084250"); g.addColorStop(1, "#06202b");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      var glow = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.6);
      glow.addColorStop(0, "rgba(126,200,239,.10)"); glow.addColorStop(1, "rgba(126,200,239,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      var centers = kastCenters(w, h), diss = kast.diss / 100;
      for (var p = 0; p < 130; p++) {
        var base = centers[p % centers.length];
        var ang = p * 2.39996 + t * (0.16 + (p % 4) * 0.018);
        var rr2 = (10 + (p % 9) * 5.5) * (0.75 + diss * 0.35);
        var x = base.x + Math.cos(ang) * rr2;
        var y = base.y + Math.sin(ang) * rr2 * 0.66;
        ctx.globalAlpha = 0.10 + (p % 4) * 0.035;
        dot(x, y, 1 + (p % 3) * 0.35, p % 3 === 0 ? "#c9f3ff" : "#7ec8ef");
      }
      ctx.globalAlpha = 1;
      if (kast.dissolved) {
        var cy = h * 0.52;
        for (var ri = 0; ri < 4; ri++) {
          var rr = 26 + ri * 21 + Math.sin(t * 0.8 + ri) * 3;
          ctx.beginPath();
          ctx.ellipse(w * 0.5, cy, rr, rr * 0.42, 0, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(201,243,255," + (0.24 - ri * 0.045) + ")";
          ctx.lineWidth = 1; ctx.stroke();
        }
        ctx.fillStyle = "rgba(201,243,255,.62)"; ctx.font = font(10.5, 600); ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillText(L("Der Tod beendet die Dissoziation. Das eine Bewusstsein bleibt.", "Death ends the dissociation. The one consciousness remains."), w / 2, h - 14);
        return;
      }
      centers.forEach(function (c) { drawVortex(c, c.i === kast.selected, diss, t); });
      ctx.fillStyle = "rgba(201,243,255,.62)"; ctx.font = font(10.5, 600); ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText(L("Ein Ozean. Viele Wirbel. Dasselbe Wasser.", "One ocean. Many vortices. The same water."), w / 2, h - 14);
    }
    function fourLink(x1, y1, x2, y2, color, on, ai) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo((x1 + x2) / 2, Math.min(y1, y2) - 24, x2, y2);
      if (on) {
        var lg = ctx.createLinearGradient(x1, y1, x2, y2);
        lg.addColorStop(0, color); lg.addColorStop(1, "rgba(127,215,239,.18)");
        ctx.strokeStyle = lg;
        ctx.lineWidth = 1.4;
        ctx.shadowColor = color; ctx.shadowBlur = 8;
      } else {
        ctx.strokeStyle = "rgba(180,220,230,.16)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = ai ? -4 : 0;
      }
      ctx.stroke();
      ctx.restore();
    }
    function fourCard(x, y, cw, ch, e, i) {
      var on = four.mode !== "ai" || i === 3;
      var focus = four.focus === i;
      ctx.save();
      rr(x, y, cw, ch, 12);
      var g = ctx.createLinearGradient(x, y, x, y + ch);
      g.addColorStop(0, on ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.035)");
      g.addColorStop(1, on ? "rgba(255,255,255,.035)" : "rgba(255,255,255,.015)");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = focus ? "#ffd27a" : on ? e.color : "rgba(180,220,230,.16)";
      ctx.lineWidth = focus ? 1.8 : 1;
      if (focus) { ctx.shadowColor = "rgba(255,210,122,.65)"; ctx.shadowBlur = 12; }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(x + 15, y + ch / 2, 7, 0, Math.PI * 2);
      ctx.fillStyle = on ? "rgba(255,255,255,.10)" : "rgba(255,255,255,.03)";
      ctx.fill();
      ctx.strokeStyle = on ? e.color : "rgba(180,220,230,.28)";
      ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = on ? e.color : "rgba(180,220,230,.36)";
      ctx.font = font(8, 700); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("E", x + 15, y + ch / 2 + 0.5);
      ctx.textAlign = "left";
      ctx.fillStyle = on ? "#eaf7fb" : "rgba(200,230,240,.40)";
      ctx.font = font(10.5, 700);
      ctx.fillText(e.label, x + 28, y + ch * 0.41);
      ctx.fillStyle = on ? "rgba(201,243,255,.60)" : "rgba(180,220,230,.28)";
      ctx.font = font(7.5, 600);
      ctx.fillText(L(e.subDe, e.subEn), x + 28, y + ch * 0.67);
      if (on) {
        dot(x + cw - 12, y + 12, 2.5, e.color);
      } else {
        ctx.fillStyle = "rgba(255,139,107,.76)";
        ctx.font = font(7, 700); ctx.textAlign = "right"; ctx.textBaseline = "bottom";
        ctx.fillText(L("fehlt", "missing"), x + cw - 8, y + ch - 7);
      }
      ctx.restore();
    }
    function fourBody(cx, cy, r, t) {
      var pulse = 0.5 + 0.5 * Math.sin(t * 1.7);
      var aura = ctx.createRadialGradient(cx, cy, 2, cx, cy, r * 2.3);
      aura.addColorStop(0, "rgba(127,215,239,.18)");
      aura.addColorStop(0.55, "rgba(0,146,153,.08)");
      aura.addColorStop(1, "rgba(0,146,153,0)");
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.arc(cx, cy, r * 2.3, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(cx, cy);
      for (var ri = 0; ri < 3; ri++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, r * (0.86 + ri * 0.24), r * (0.46 + ri * 0.12), -0.16, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(127,215,239," + (0.19 - ri * 0.045) + ")";
        ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.strokeStyle = "#9fe7f5"; ctx.lineWidth = 2; ctx.lineCap = "round";
      ctx.shadowColor = "rgba(127,215,239,.75)"; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(0, -r * 0.62, r * 0.24, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.38);
      ctx.quadraticCurveTo(-r * 0.28, -r * 0.20, -r * 0.20, r * 0.20);
      ctx.moveTo(0, -r * 0.38);
      ctx.quadraticCurveTo(r * 0.28, -r * 0.20, r * 0.20, r * 0.20);
      ctx.moveTo(-r * 0.16, -r * 0.18); ctx.lineTo(-r * 0.62, r * 0.02);
      ctx.moveTo(r * 0.16, -r * 0.18); ctx.lineTo(r * 0.62, r * 0.02);
      ctx.moveTo(-r * 0.14, r * 0.20); ctx.lineTo(-r * 0.26, r * 0.72);
      ctx.moveTo(r * 0.14, r * 0.20); ctx.lineTo(r * 0.26, r * 0.72);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ff8b6b";
      ctx.beginPath(); ctx.arc(0, -r * 0.04, 3 + pulse * 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = "rgba(201,243,255,.64)"; ctx.font = font(9, 700); ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(L("Mensch · 4/4", "human · 4/4"), cx, cy + r * 1.02);
    }
    function fourTokenCore(cx, cy, r, t) {
      ctx.save(); ctx.translate(cx, cy);
      ctx.setLineDash([4, 5]); ctx.lineDashOffset = -t * 6;
      ctx.strokeStyle = "rgba(180,220,230,.22)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, -r * 0.62, r * 0.24, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.38); ctx.lineTo(0, r * 0.30);
      ctx.moveTo(0, -r * 0.12); ctx.lineTo(-r * 0.54, r * 0.10);
      ctx.moveTo(0, -r * 0.12); ctx.lineTo(r * 0.54, r * 0.10);
      ctx.moveTo(0, r * 0.30); ctx.lineTo(-r * 0.34, r * 0.78);
      ctx.moveTo(0, r * 0.30); ctx.lineTo(r * 0.34, r * 0.78);
      ctx.stroke();
      ctx.setLineDash([]);
      for (var i = 0; i < 3; i++) {
        rr(-r * 0.78, -r * 0.46 + i * r * 0.34, r * 1.56, r * 0.24, 6);
        ctx.fillStyle = "rgba(127,215,239,.10)";
        ctx.fill();
        ctx.strokeStyle = "rgba(127,215,239,.44)";
        ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = "rgba(201,243,255,.62)"; ctx.font = font(7, 700); ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("token " + (i + 1), 0, -r * 0.34 + i * r * 0.34);
      }
      ctx.restore();
      ctx.fillStyle = "rgba(255,139,107,.72)"; ctx.font = font(9, 700); ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(L("KI · 1/4", "AI · 1/4"), cx, cy + r * 1.02);
    }
    function fourPanel(px, py, pw, ph) {
      var ai = four.mode === "ai";
      var word = FOUR_WORDS[four.word];
      rr(px, py, pw, ph, 16);
      var g = ctx.createLinearGradient(px, py, px + pw, py + ph);
      g.addColorStop(0, "rgba(255,255,255,.075)");
      g.addColorStop(1, "rgba(255,255,255,.022)");
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = "rgba(201,243,255,.13)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "rgba(201,243,255,.50)"; ctx.font = font(8, 700); ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(L("Wort", "word"), px + 14, py + 16);
      ctx.fillStyle = word.color; ctx.font = '700 ' + Math.max(24, Math.min(34, pw * 0.20)) + 'px "Barlow", "Open Sans", sans-serif';
      ctx.fillText(L(word.de, word.en), px + 14, py + 30);
      ctx.strokeStyle = "rgba(201,243,255,.13)"; ctx.beginPath(); ctx.moveTo(px + 14, py + 76); ctx.lineTo(px + pw - 14, py + 76); ctx.stroke();
      ctx.fillStyle = ai ? "rgba(201,243,255,.50)" : "rgba(255,210,122,.72)"; ctx.font = font(8, 700);
      ctx.fillText(ai ? L("Token-Nachbarn", "token neighbours") : L("Körper", "body"), px + 14, py + 88);
      ctx.fillStyle = ai ? "rgba(201,243,255,.60)" : "rgba(234,247,251,.92)"; ctx.font = font(11, 600);
      ctx.fillText(ai ? L("nächste Nachbarn", "nearest neighbours") : L(word.groundDe, word.groundEn), px + 14, py + 102);
      if (ai) {
        var tw = Math.max(54, (pw - 38) / 2), th = 23;
        word.tokensDe.slice(0, 4).forEach(function (tok, i) {
          var tx = px + 14 + (i % 2) * (tw + 5), ty = py + 126 + Math.floor(i / 2) * (th + 5);
          rr(tx, ty, tw, th, 7);
          ctx.fillStyle = "rgba(127,215,239,.09)"; ctx.fill();
          ctx.strokeStyle = "rgba(127,215,239,.25)"; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = "rgba(201,243,255,.72)"; ctx.font = font(8, 600); ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(L(word.tokensDe[i], word.tokensEn[i]), tx + tw / 2, ty + th / 2 + 0.5);
        });
        ctx.fillStyle = "rgba(255,139,107,.76)"; ctx.font = font(8.5, 700); ctx.textAlign = "left"; ctx.textBaseline = "top";
        ctx.fillText(L("kein Körper, kein Affekt", "no body, no affect"), px + 14, py + 188);
      } else {
        [L("Sinnesfeedback", "sensory feedback"), L("Affekt", "affect"), L("geteilte Welt", "shared world")].forEach(function (label, i) {
          var yy = py + 128 + i * 19;
          dot(px + 17, yy + 4, 2.2, word.color);
          ctx.fillStyle = "rgba(234,247,251,.72)"; ctx.font = font(8.5, 600); ctx.textAlign = "left"; ctx.textBaseline = "middle";
          ctx.fillText(label, px + 25, yy + 3);
        });
      }
      ctx.strokeStyle = "rgba(201,243,255,.13)"; ctx.beginPath(); ctx.moveTo(px + 14, py + ph - 38); ctx.lineTo(px + pw - 14, py + ph - 38); ctx.stroke();
      ctx.fillStyle = ai ? "rgba(255,179,107,.85)" : "rgba(127,224,176,.88)"; ctx.font = font(9, 700); ctx.textAlign = "left"; ctx.textBaseline = "bottom";
      ctx.fillText(ai ? L("1 / 4 · nur Extended", "1 / 4 · Extended only") : L("4 / 4 · gekoppelt", "4 / 4 · coupled"), px + 14, py + ph - 15);
    }
    function drawFourE(w, h, t, now) {
      var ai = four.mode === "ai";
      var word = FOUR_WORDS[four.word];
      var bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#031820"); bg.addColorStop(0.55, "#07313d"); bg.addColorStop(1, "#03141b");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      var glow = ctx.createRadialGradient(w * 0.31, h * 0.50, 0, w * 0.31, h * 0.50, Math.max(w, h) * 0.62);
      glow.addColorStop(0, "rgba(0,146,153,.15)"); glow.addColorStop(1, "rgba(0,146,153,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      fourStars.forEach(function (st) {
        ctx.globalAlpha = st.a * (0.7 + 0.3 * Math.sin(t * 0.6 + st.x * 20));
        dot(st.x * w, st.y * h, st.r, "#d9f8ff");
      });
      ctx.globalAlpha = 1;
      var lw = Math.max(214, Math.min(w * 0.64, w - 188));
      var panelX = lw + 10, panelW = w - panelX - 10;
      var pad = 12;
      var bodyX = lw * 0.50, bodyY = h * 0.50;
      var cardW = Math.min(146, (lw - pad * 3) / 2);
      var cardH = Math.min(50, h * 0.14);
      var topY = pad, botY = h - pad - cardH;
      var leftX = pad, rightX = lw - pad - cardW;
      var pos = [
        { x: leftX, y: topY }, { x: rightX, y: topY },
        { x: leftX, y: botY }, { x: rightX, y: botY }
      ];
      ctx.save();
      ctx.globalAlpha = 0.04; ctx.fillStyle = "#c9f3ff"; ctx.font = '700 150px "Barlow", "Open Sans", sans-serif';
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("4E", bodyX, bodyY + 46);
      ctx.restore();
      var horizon = ctx.createLinearGradient(0, bodyY + 54, 0, h);
      horizon.addColorStop(0, "rgba(0,0,0,0)"); horizon.addColorStop(1, "rgba(0,40,52,.38)");
      ctx.fillStyle = horizon; ctx.fillRect(0, bodyY + 54, lw, h - bodyY - 54);
      pos.forEach(function (p, i) {
        fourLink(bodyX, bodyY, p.x + cardW / 2, p.y + cardH / 2, FOUR_E[i].color, four.mode !== "ai" || i === 3, ai);
      });
      if (panelW > 110) {
        var beamEnd = ai ? bodyX + 56 : bodyX;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(panelX, h * 0.26);
        ctx.quadraticCurveTo((panelX + beamEnd) / 2, h * 0.42, beamEnd, bodyY);
        if (ai) {
          ctx.strokeStyle = "rgba(180,220,230,.24)"; ctx.setLineDash([4, 7]); ctx.lineDashOffset = -t * 18; ctx.lineWidth = 1;
        } else {
          var bgd = ctx.createLinearGradient(panelX, h * 0.26, bodyX, bodyY);
          bgd.addColorStop(0, word.color); bgd.addColorStop(1, "rgba(255,210,122,.16)");
          ctx.strokeStyle = bgd; ctx.lineWidth = 1.5; ctx.shadowColor = word.color; ctx.shadowBlur = 10;
        }
        ctx.stroke(); ctx.restore();
        if (ai) {
          ctx.fillStyle = "rgba(255,139,107,.82)"; ctx.font = font(8, 700); ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(L("kein Körper", "no body"), beamEnd + 20, bodyY - 20);
        }
      }
      if (ai) fourTokenCore(bodyX, bodyY, Math.min(lw, h) * 0.17, t);
      else fourBody(bodyX, bodyY, Math.min(lw, h) * 0.17, t);
      pos.forEach(function (p, i) { fourCard(p.x, p.y, cardW, cardH, FOUR_E[i], i); });
      if (panelW > 110) fourPanel(panelX, 12, panelW, h - 24);
    }
    function drawMyst(w, h, t, now) {
      ctx.fillStyle = "#04070d"; ctx.fillRect(0, 0, w, h);
      stars.forEach(function (s) {
        ctx.globalAlpha = s.a;
        dot(s.x * w, s.y * h, s.r, "#ffffff");
      });
      ctx.globalAlpha = 1;
      var glow = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.7);
      glow.addColorStop(0, "rgba(126,200,239,.05)"); glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      myst.marks.forEach(function (m) {
        m.x += m.speed * 0.016;
        m.y += m.drift * 0.016;
        m.rot += m.spin;
        if (m.x > 1.12) m.x = -0.12;
        if (m.y < -0.1) m.y = 0.95;
        if (m.y > 1.1) m.y = -0.05;
        ctx.save();
        ctx.translate(m.x * w, m.y * h);
        ctx.rotate(m.rot);
        ctx.globalAlpha = m.a;
        ctx.fillStyle = "#ffffff";
        ctx.font = '700 ' + m.size + 'px "Barlow", "Open Sans", sans-serif';
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(255,255,255,.35)"; ctx.shadowBlur = m.size > 70 ? 18 : 4;
        ctx.fillText("?", 0, 0);
        ctx.restore();
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,.72)"; ctx.font = font(10.5, 600); ctx.textAlign = "left"; ctx.textBaseline = "bottom";
      ctx.fillText(L("Ratten lernen das Labyrinth. Gleichungen?", "Rats learn the maze. Equations?"), 18, h - 18);
    }
    var DRAWERS = [drawWorkspace, drawIIT, drawPredictive, drawKastrup, drawFourE, drawMyst];

    function draw(now) {
      if (!size || !ctx || size.w < 40 || size.h < 40) return;
      var w = size.w, h = size.h, t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);
      DRAWERS[active](w, h, t, now);
    }
    function fit() {
      var r = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      if (w < 10 || h < 10) return;
      var dpr = Math.min(2.5, Math.max(2, window.devicePixelRatio || 1));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      size = { w: w, h: h, ctx: ctx };
      draw(performance.now());
    }
    function loop(now) {
      raf = 0;
      if (paused) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    }
    function startLoop() {
      if (reduce || raf || paused) return;
      raf = requestAnimationFrame(loop);
    }

    function writeModule(i) {
      ws.written[i] = true; ws.last = i; ws.pulseStart = performance.now(); ws.broadcasted = false;
      setStatus(MODULES[i].label + L(" schreibt: ", " writes: ") + MODULES[i].result + ".");
      renderControls(); draw(performance.now());
    }
    function renderChrome() {
      var th = THEORIES[active];
      el.setAttribute("data-theory", th.key);
      el.style.setProperty("--con-accent", th.tone === "green" ? "var(--ls-green)" : th.tone === "gold" ? "var(--ls-gold)" : th.tone === "sky" ? "var(--ls-sky)" : th.tone === "blue" ? "var(--ls-blue)" : th.tone === "teal" ? "var(--ls-teal)" : "var(--ls-lilac)");
      kicker.textContent = L("Bewusstsein · Theorie ", "Consciousness · theory ") + (active + 1) + " / " + THEORIES.length;
      titleEl.textContent = th.title;
      leadEl.textContent = th.lead;
      var qa = th.qa || [];
      if (qaOpen >= qa.length) qaOpen = 0;
      detail.innerHTML =
        '<div class="ls-con2-detail-head"><span>' + esc(th.tag) + '</span><b>' + esc(th.title) + '</b></div>' +
        '<div class="ls-con2-detail-body">' + th.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join("") + '</div>' +
        '<div class="ls-con2-qa">' +
          '<div class="ls-con2-qa-questions">' + qa.map(function (item, i) {
            return '<button type="button" class="ls-con2-q' + (i === qaOpen ? " is-on" : "") + '" data-con-qa="' + i + '">' + esc(item.q) + '</button>';
          }).join("") + '</div>' +
          (qa[qaOpen] ? '<p class="ls-con2-a">' + esc(qa[qaOpen].a) + '</p>' : '') +
        '</div>' +
        '<p class="ls-con2-cite">' + th.cite + '</p>' +
        (th.quote ? '<blockquote class="ls-con2-quote"><p>“' + esc(th.quote.text) + '”</p><cite><a href="' + esc(th.quote.url) + '" target="_blank" rel="noopener">' + esc(th.quote.author) + ', ' + esc(th.quote.work) + '</a></cite></blockquote>' : '');
      detail.querySelectorAll("[data-con-qa]").forEach(function (b) {
        b.addEventListener("click", function () {
          qaOpen = parseInt(b.getAttribute("data-con-qa"), 10) || 0;
          renderChrome();
        });
      });
      canvas.setAttribute("aria-label", th.title + ". " + th.lead);
    }
    function setIitMode(ff) {
      iit.feedforward = !!ff;
      setStatus(iit.feedforward ? L("Feedforward: Der Puls läuft nur vorwärts. Phi fällt auf 0.", "Feedforward: the pulse only moves forward. Phi falls to 0.") : L("Rekurrent: Der Puls kann zurückkehren. Die Struktur ist integriert.", "Recurrent: the pulse can return. The structure is integrated."));
      renderControls(); draw(performance.now());
    }
    function setIitCut(v) {
      iit.cut = Math.max(0, Math.min(100, parseInt(v, 10) || 0));
      var inp = el.querySelector("[data-con-cut]");
      if (inp) { inp.value = String(iit.cut); if (inp.nextElementSibling) inp.nextElementSibling.textContent = iit.cut + " %"; }
      setStatus(L("Partition ", "Partition ") + iit.cut + "%: " + (iit.cut >= 70 ? L("Der Ring ist weit gekappt. Der Puls stoppt am Schnitt; Phi fällt.", "The ring is cut wide open. The pulse stops at the cut; Phi falls.") : iit.cut >= 40 ? L("Die Querverbindungen fallen weg; der Puls kommt nicht mehr herum.", "Cross-links disappear; the pulse no longer gets around.") : L("Die Struktur ist noch weitgehend verbunden.", "The structure is still mostly connected.")));
      draw(performance.now());
    }
    function pulseIit() {
      iit.pulseStart = performance.now();
      iit.pulsed = true;
      setStatus(iit.feedforward ? L("Der Puls läuft vorwärts und endet. Keine Rückkehr, keine Integration.", "The pulse moves forward and ends. No return, no integration.") : L("Der Puls läuft um den Ring und kehrt zurück.", "The pulse travels around the ring and returns."));
      draw(performance.now());
    }
    function iitNextAction() {
      if (iit.feedforward) return false;
      if (!iit.pulsed) { pulseIit(); return true; }
      if (iit.cut < 80) { setIitCut(80); return true; }
      setIitMode(true);
      return true;
    }
    function setKastDiss(v) {
      kast.dissolved = false;
      kast.diss = Math.max(0, Math.min(100, parseInt(v, 10) || 0));
      var inp = el.querySelector("[data-con-diss]");
      if (inp) { inp.value = String(kast.diss); if (inp.nextElementSibling) inp.nextElementSibling.textContent = kast.diss + " %"; }
      setStatus(kast.diss < 12 ? L("Der Ozean fließt frei; die Wirbel sind kaum abgegrenzt.", "The ocean flows freely; the vortices are barely separated.") : kast.diss < 55 ? L("Die Wirbel bilden sich. Das Wasser zwischen ihnen bleibt verbunden.", "The vortices form. The water between them stays connected.") : L("Die Wirbel sind stark abgegrenzt. Von innen sieht jeder wie ein eigenes Bewusstsein aus.", "The vortices are strongly separated. From inside each looks like its own consciousness."));
      draw(performance.now());
    }
    function setKastCount(v) {
      kast.dissolved = false;
      kast.count = Math.max(1, Math.min(5, parseInt(v, 10) || 1));
      kast.selected = Math.min(kast.selected, kast.count - 1);
      var inp = el.querySelector("[data-con-count]");
      if (inp) { inp.value = String(kast.count); if (inp.nextElementSibling) inp.nextElementSibling.textContent = String(kast.count); }
      setStatus(kast.count === 1 ? L("Ein Ozean: ein Bewusstsein, keine Trennung.", "One ocean: one consciousness, no separation.") : L(kast.count + " Wirbel: derselbe Ozean, mehrere lokale Geister.", kast.count + " vortices: the same ocean, several local minds."));
      draw(performance.now());
    }
    function kastNextAction() {
      if (kast.dissolved) return false;
      kast.dissolved = true;
      kast.diss = 0;
      kast.count = 1;
      kast.selected = 0;
      var dinp = el.querySelector("[data-con-diss]");
      if (dinp) { dinp.value = "0"; if (dinp.nextElementSibling) dinp.nextElementSibling.textContent = "0 %"; }
      var cinp = el.querySelector("[data-con-count]");
      if (cinp) { cinp.value = "1"; if (cinp.nextElementSibling) cinp.nextElementSibling.textContent = "1"; }
      setStatus(L("Der Tod beendet die Dissoziation: Die Wirbel lösen sich auf; das eine Bewusstsein bleibt.", "Death ends the dissociation: the vortices dissolve; the one consciousness remains."));
      draw(performance.now());
      return true;
    }
    function fourStatusText() {
      return four.mode === "ai"
        ? L("KI: 1 von 4. Nur Extended ist da; Embodied, Embedded und Enacted fehlen.", "AI: 1 of 4. Only Extended is present; Embodied, Embedded and Enacted are missing.")
        : L("Mensch: 4 von 4 gekoppelt. Wort, Körper, Welt und Handlung sind verbunden.", "Human: 4 of 4 coupled. Word, body, world and action are connected.");
    }
    function fourWordStatus() {
      var w = FOUR_WORDS[four.word];
      return four.mode === "ai"
        ? L(w.de + ": Token-Nachbarn " + w.tokensDe.join(" · "), w.en + ": token neighbours " + w.tokensEn.join(" · "))
        : L(w.de + ": " + w.groundDe, w.en + ": " + w.groundEn);
    }
    function fourSetMode(mode) {
      four.mode = mode === "ai" ? "ai" : "human";
      four.focus = four.mode === "ai" ? 3 : 0;
      setStatus(fourStatusText());
      renderControls();
      draw(performance.now());
    }
    function fourSetFocus(i) {
      four.focus = clamp(i, 0, 3);
      var e = FOUR_E[four.focus];
      setStatus(four.mode === "ai"
        ? L(e.label + ": " + e.missingDe, e.label + ": " + e.missingEn)
        : L(e.label + ": " + e.noteDe, e.label + ": " + e.noteEn));
      renderControls();
      draw(performance.now());
    }
    function fourSetWord(key) {
      if (!FOUR_WORDS[key]) return;
      four.word = key;
      setStatus(fourWordStatus());
      renderControls();
      draw(performance.now());
    }
    function fourNextAction() {
      if (four.mode === "ai") return false;
      if (four.focus < 3) { four.focus++; fourSetFocus(four.focus); return true; }
      fourSetMode("ai");
      return true;
    }
    function mystNextAction() {
      if (myst.marks.length < 16) {
        spawnMark(false);
        setStatus(L("Noch eine Frage. Sie fliegt weiter, ohne anzukommen.", "One more question. It keeps flying without landing."));
        draw(performance.now());
        return true;
      }
      return false;
    }
    function renderControls() {
      var th = THEORIES[active];
      if (active === 0) {
        controls.innerHTML =
          '<div class="ls-con2-row">' + MODULES.map(function (m, i) {
            return '<button type="button" class="ls-con2-chip' + (ws.written[i] ? " is-on" : "") + '" data-con-mod="' + i + '" style="--chip:' + m.color + '">' + esc(m.label) + '</button>';
          }).join("") + '</div>' +
          '<div class="ls-con2-row"><button type="button" class="ls-con2-btn is-primary" data-con-broadcast>' + L("Broadcast", "Broadcast") + '</button><button type="button" class="ls-con2-btn" data-con-reset>' + L("Tafel leeren", "Clear board") + '</button></div>';
      } else if (active === 1) {
        controls.innerHTML =
          '<div class="ls-con2-row"><button type="button" class="ls-con2-chip' + (!iit.feedforward ? " is-on" : "") + '" data-con-iit="recurrent">' + L("Rekurrent", "Recurrent") + '</button><button type="button" class="ls-con2-chip' + (iit.feedforward ? " is-on" : "") + '" data-con-iit="feedforward">' + L("Feedforward", "Feedforward") + '</button></div>' +
          '<label class="ls-con2-range' + (iit.feedforward ? " is-disabled" : "") + '"><span>' + L("Partition (Schnitt)", "Partition (cut)") + '</span><input type="range" data-con-cut min="0" max="100" step="1" value="' + iit.cut + '"' + (iit.feedforward ? " disabled" : "") + '><output>' + iit.cut + ' %</output></label>' +
          '<div class="ls-con2-row"><button type="button" class="ls-con2-btn is-primary" data-con-pulse>' + L("Puls", "Pulse") + '</button><button type="button" class="ls-con2-btn" data-con-reset>' + L("Reset", "Reset") + '</button></div>';
      } else if (active === 2) {
        controls.innerHTML =
          '<div class="ls-con2-row">' + Object.keys(PRED_STIM).map(function (k) {
            return '<button type="button" class="ls-con2-chip' + (pred.stimulus === k ? " is-on" : "") + '" data-con-stim="' + k + '">' + PRED_STIM[k].label + '</button>';
          }).join("") + '</div>' +
          '<label class="ls-con2-range"><span>' + L("Präzision", "Precision") + '</span><input type="range" data-con-prec min="0" max="100" step="1" value="' + pred.precision + '"><output>' + Math.round(pred.precision) + ' %</output></label>' +
          '<div class="ls-con2-row"><button type="button" class="ls-con2-btn is-primary" data-con-update>' + L("Modell aktualisieren", "Update model") + '</button><button type="button" class="ls-con2-btn" data-con-reset>' + L("Reset", "Reset") + '</button></div>';
      } else if (active === 3) {
        controls.innerHTML =
          '<label class="ls-con2-range"><span>' + L("Dissoziation", "Dissociation") + '</span><input type="range" data-con-diss min="0" max="100" step="1" value="' + kast.diss + '"><output>' + kast.diss + ' %</output></label>' +
          '<label class="ls-con2-range"><span>' + L("Wirbel", "Vortices") + '</span><input type="range" data-con-count min="1" max="5" step="1" value="' + kast.count + '"><output>' + kast.count + '</output></label>' +
          '<div class="ls-con2-row"><button type="button" class="ls-con2-btn" data-con-reset>' + L("Reset", "Reset") + '</button></div>';
      } else if (active === 4) {
        controls.innerHTML =
          '<div class="ls-con2-row">' +
            '<button type="button" class="ls-con2-chip' + (four.mode === "human" ? " is-on" : "") + '" data-four-mode="human">' + L("Mensch", "Human") + '</button>' +
            '<button type="button" class="ls-con2-chip' + (four.mode === "ai" ? " is-on" : "") + '" data-four-mode="ai">' + L("KI", "AI") + '</button>' +
          '</div>' +
          '<div class="ls-con2-row">' + FOUR_E.map(function (e, i) {
            return '<button type="button" class="ls-con2-chip' + (four.focus === i ? " is-on" : "") + '" data-four-focus="' + i + '" style="--chip:' + e.color + '">' + e.label + '</button>';
          }).join("") + '</div>' +
          '<div class="ls-con2-row">' + Object.keys(FOUR_WORDS).map(function (k) {
            return '<button type="button" class="ls-con2-chip' + (four.word === k ? " is-on" : "") + '" data-four-word="' + k + '">' + L(FOUR_WORDS[k].de, FOUR_WORDS[k].en) + '</button>';
          }).join("") + '</div>' +
          '<div class="ls-con2-row"><button type="button" class="ls-con2-btn" data-con-reset>' + L("Reset", "Reset") + '</button></div>';
      } else {
        controls.innerHTML = '<div class="ls-con2-row"><button type="button" class="ls-con2-btn is-primary" data-con-spawn>' + L("Neue Frage", "New question") + '</button><button type="button" class="ls-con2-btn" data-con-reset>' + L("Reset", "Reset") + '</button></div>';
      }
      controls.querySelectorAll("[data-con-mod]").forEach(function (b) {
        b.addEventListener("click", function () {
          writeModule(parseInt(b.getAttribute("data-con-mod"), 10) || 0);
        });
      });
      controls.querySelectorAll("[data-con-broadcast]").forEach(function (b) {
        b.addEventListener("click", function () {
          ws.broadcastUntil = performance.now() + 1200;
          ws.broadcasted = true;
          setStatus(L("Broadcast: Die Tafel sendet an alle Subsysteme. Nur was auf der Tafel steht, ist global.", "Broadcast: the board sends to all subsystems. Only what is on the board is global."));
          draw(performance.now());
        });
      });
      controls.querySelectorAll("[data-con-iit]").forEach(function (b) {
        b.addEventListener("click", function () { setIitMode(b.getAttribute("data-con-iit") === "feedforward"); });
      });
      controls.querySelectorAll("[data-con-cut]").forEach(function (inp) {
        inp.addEventListener("input", function () { setIitCut(inp.value); });
      });
      controls.querySelectorAll("[data-con-pulse]").forEach(function (b) {
        b.addEventListener("click", pulseIit);
      });
      controls.querySelectorAll("[data-con-stim]").forEach(function (b) {
        b.addEventListener("click", function () {
          pred.stimulus = b.getAttribute("data-con-stim");
          pred.priorTarget = null;
          setStatus(L("Der Eingang wechselt. Die Vorhersage bleibt zunächst; daraus entsteht der Fehler.", "The input changes. The prediction stays for now; that difference is the error."));
          renderControls(); draw(performance.now());
        });
      });
      controls.querySelectorAll("[data-con-prec]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          pred.precision = parseInt(inp.value, 10) || 0;
          inp.nextElementSibling.textContent = Math.round(pred.precision) + " %";
          setStatus(pred.precision > 74 ? L("Hohe Präzision: Die Vorhersage dominiert. Wahrnehmung wird zur kontrollierten Halluzination.", "High precision: prediction dominates. Perception becomes controlled hallucination.") : pred.precision < 26 ? L("Niedrige Präzision: Der Eingang dominiert. Das System folgt der Evidenz.", "Low precision: input dominates. The system follows the evidence.") : L("Mittlere Präzision: Vorhersage und Eingang halten sich die Waage.", "Medium precision: prediction and input are balanced."));
          draw(performance.now());
        });
      });
      controls.querySelectorAll("[data-con-update]").forEach(function (b) {
        b.addEventListener("click", updatePredModel);
      });
      controls.querySelectorAll("[data-con-diss]").forEach(function (inp) {
        inp.addEventListener("input", function () { setKastDiss(inp.value); });
      });
      controls.querySelectorAll("[data-con-count]").forEach(function (inp) {
        inp.addEventListener("input", function () { setKastCount(inp.value); });
      });
      controls.querySelectorAll("[data-four-mode]").forEach(function (b) {
        b.addEventListener("click", function () { fourSetMode(b.getAttribute("data-four-mode")); });
      });
      controls.querySelectorAll("[data-four-focus]").forEach(function (b) {
        b.addEventListener("click", function () { fourSetFocus(parseInt(b.getAttribute("data-four-focus"), 10) || 0); });
      });
      controls.querySelectorAll("[data-four-word]").forEach(function (b) {
        b.addEventListener("click", function () { fourSetWord(b.getAttribute("data-four-word")); });
      });
      controls.querySelectorAll("[data-con-spawn]").forEach(function (b) {
        b.addEventListener("click", function () { spawnMark(false); setStatus(L("Noch eine Frage. Sie fliegt weiter, ohne anzukommen.", "One more question. It keeps flying without landing.")); draw(performance.now()); });
      });
      controls.querySelectorAll("[data-con-reset]").forEach(function (b) {
        b.addEventListener("click", resetTheory);
      });
    }

    function predModelFresh() { return pred.priorTarget === null && Math.abs(pred.priorCenter - PRED_STIM[pred.stimulus].center) < 0.015; }
    function updatePredModel() {
      pred.priorCenter = PRED_STIM[pred.stimulus].center;
      pred.priorTarget = null;
      setStatus(L("Modell aktualisiert: Die Vorhersage liegt jetzt auf dem Eingang. Die Überraschung sinkt.", "Model updated: the prediction now sits on the input. Surprise falls."));
      draw(performance.now());
    }
    function wsNextAction() {
      var i = ws.written.indexOf(false);
      if (i >= 0) { writeModule(i); return true; }
      if (!ws.broadcasted) {
        ws.broadcasted = true;
        ws.broadcastUntil = performance.now() + 1200;
        setStatus(L("Broadcast: Die Tafel sendet an alle Subsysteme. Nur was auf der Tafel steht, ist global.", "Broadcast: the board sends to all subsystems. Only what is on the board is global."));
        draw(performance.now());
        return true;
      }
      return false;
    }
    function goNext() {
      if (active === 0 && wsNextAction()) return true;
      if (active === 1 && iitNextAction()) return true;
      if (active === 2 && !predModelFresh()) { updatePredModel(); return true; }
      if (active === 3 && kastNextAction()) return true;
      if (active === 4 && fourNextAction()) return true;
      if (active === 5 && mystNextAction()) return true;
      if (active < THEORIES.length - 1) { setTheory(active + 1); return true; }
      return false;
    }
    function goPrev() { if (active > 0) { setTheory(active - 1); return true; } return false; }
    function setTheory(i) {
      active = clamp(i, 0, THEORIES.length - 1);
      qaOpen = 0;
      activeSince = performance.now();
      renderChrome();
      renderControls();
      setStatus(THEORIES[active].status);
      draw(performance.now());
    }
    canvas.addEventListener("click", function (e) {
      var r0 = canvas.getBoundingClientRect();
      if (active === 0 && size) {
        var g = wsCenters(size.w, size.h);
        var mx0 = e.clientX - r0.left, my0 = e.clientY - r0.top;
        for (var wi = 0; wi < g.pts.length; wi++) {
          if (Math.abs(mx0 - g.pts[wi].x) <= g.cardW / 2 && Math.abs(my0 - g.pts[wi].y) <= g.cardH / 2) { writeModule(wi); return; }
        }
        return;
      }
      if (active !== 3) return;
      if (kast.dissolved) {
        setStatus(L("Die Dissoziation ist aufgelöst. Es gibt keinen einzelnen Wirbel mehr.", "The dissociation is dissolved. There is no individual vortex anymore."));
        draw(performance.now());
        return;
      }
      var r = canvas.getBoundingClientRect();
      var mx = e.clientX - r.left, my = e.clientY - r.top;
      var w = r.width, h = r.height;
      var centers = kastCenters(w, h);
      for (var i = 0; i < centers.length; i++) {
        var x = centers[i].x, y = centers[i].y;
        if (Math.hypot(mx - x, my - y) < 42) {
          kast.selected = i;
          setStatus(L("Du betrachtest Geist ", "You are looking at mind ") + String.fromCharCode(65 + i) + L(". Derselbe Wasserwirbel: von innen getrennt, von außen eine lokale Bewegung.", ". The same water vortex: separate from inside, a local movement from outside."));
          draw(performance.now());
          return;
        }
      }
    });

    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { fit(); }); ro.observe(stage); }
    window.addEventListener("resize", fit);
    function onTheme() { C = api.colors(); draw(performance.now()); }
    window.addEventListener("tm:theme", onTheme);
    setTheory(0);
    fit();
    startLoop();
    return {
      update: function () {},
      next: goNext,
      prev: goPrev,
      hasNext: function () { return active === 5 ? myst.marks.length < 16 : active < THEORIES.length - 1; },
      hasPrev: function () { return active > 0; },
      ownsKeys: function () { return true; },
      onKey: function (e) {
        if (e.target && /input|textarea|select/i.test(e.target.tagName)) return false;
        if (e.key === "ArrowRight") return goNext();
        if (e.key === "ArrowLeft") return goPrev();
        return false;
      },
      resize: fit,
      pause: function () { paused = true; if (raf) cancelAnimationFrame(raf); raf = 0; },
      resume: function () { paused = false; startLoop(); },
      destroy: function () {
        paused = true;
        if (raf) cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        window.removeEventListener("resize", fit);
        window.removeEventListener("tm:theme", onTheme);
        el.remove();
      }
    };
  }
  core.register("consciousness", consciousnessScene);
})();
