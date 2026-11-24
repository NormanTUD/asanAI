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
        basics: L("Subsystem = spezialisierter Teil des Gehirns; Broadcast = Ergebnis wird an viele Teile weitergegeben; Zugang = berichten, kontrollieren, daraus folgern.", "Subsystem = specialised part of the brain; broadcast = a result is passed to many parts; access = report, control, infer."),
        body: [
          L("Viele spezialisierte Subsysteme rechnen getrennt. Ihre Ergebnisse werden in einen globalen Arbeitsraum broadcastet; nur was dort ankommt, ist für Bericht, Kontrolle und Handlung verfügbar. Das ist Zugang – nicht die Erklärung, warum Zugang sich anfühlt.", "Many specialised subsystems compute separately. Their results are broadcast into a global workspace; only what arrives there is available for report, control, and action. That is access – not an explanation of why access feels like anything.")
        ],
        open: L("Warum der Zugang sich von innen anfühlt, sagt die Tafel nicht.", "Why access feels like something from the inside is not shown by the board."),
        cite: '<a href="https://archive.org/details/cognitivetheoryo0000baar" target="_blank" rel="noopener">Baars (1988)</a>; <a href="https://doi.org/10.1016/S0010-0277(00)00123-2" target="_blank" rel="noopener">Dehaene &amp; Naccache (2001)</a>; <a href="https://doi.org/10.1016/0004-3702(85)90063-3" target="_blank" rel="noopener">Hayes-Roth (1985)</a>',
        hint: L("Klick ein Subsystem: sein Ergebnis erscheint auf der Tafel. Broadcast macht es global.", "Click a subsystem: its result appears on the board. Broadcast makes it global."),
        status: L("Noch nichts auf der Tafel. Weiter fügt Subsysteme hinzu.", "Nothing on the board yet. Next adds subsystems.")
      },
      {
        key: "iit", tone: "gold",
        tag: "Phi · Integration",
        title: "Integrated Information Theory (IIT)",
        lead: L("Bewusstsein ist die integrierte Ursache-Wirkungs-Struktur eines Systems; Rekurrenz macht aus Teilen ein Ganzes.", "Consciousness is a system's integrated cause-effect structure; recurrence turns parts into a whole."),
        basics: L("Ursache-Wirkung = ein Teil beeinflusst einen anderen; Integration = das Ganze lässt sich nicht ohne Verlust zerlegen; Rekurrenz = Signale laufen zurück, nicht nur vorwärts; Schnitt = Partition: Verbindungen kappen, dann ist das Ganze zerlegbar und Phi fällt.", "Cause-effect = one part influences another; integration = the whole cannot be split without loss; recurrence = signals run back, not only forward; cut = partition: sever connections, then the whole is separable and Phi falls."),
        body: [
          L("IIT identifiziert Bewusstsein mit der integrierten Ursache-Wirkungs-Struktur eines Systems. Rekurrenz lässt Signale zurücklaufen; dadurch wirken die Teile aufeinander und bilden ein Ganzes, das sich nicht ohne Verlust zerlegen lässt. Phi misst diese Integration; ohne Rückkopplung ist Phi 0. Ein Schnitt ist eine Partition: Er kappt Verbindungen, der Puls kommt nicht mehr herum, das Ganze wird zerlegbar, und Phi fällt.", "IIT identifies consciousness with a system's integrated cause-effect structure. Recurrence lets signals run back; the parts act on each other and form a whole that cannot be split without loss. Phi measures this integration; without feedback Phi is 0. A cut is a partition: it severs connections, the pulse no longer gets around, the whole becomes separable, and Phi falls.")
        ],
        open: L("Phi ist für große Systeme kaum berechenbar und für LLMs nicht belastbar gemessen.", "Phi is hard to compute for large systems and has not been robustly measured for LLMs."),
        cite: '<a href="https://doi.org/10.1186/1471-2202-5-42" target="_blank" rel="noopener">Tononi (2004)</a>; <a href="https://doi.org/10.1038/nrn.2016.44" target="_blank" rel="noopener">Tononi et al. (2016)</a>',
        hint: L("Drücke Puls. Schalte auf Feedforward: der Puls kehrt nicht zurück, Phi fällt. Ziehe den Schnitt.", "Press Pulse. Switch to feedforward: the pulse does not return, Phi falls. Pull the cut."),
        status: L("Rekurrent, ungeschnitten. Weiter pulst den Ring.", "Recurrent, uncut. Next pulses the ring.")
      },
      {
        key: "predictive", tone: "sky",
        tag: "Vorhersage · freie Energie",
        title: "Predictive Processing",
        lead: L("Das Gehirn sagt Sinnesdaten voraus und korrigiert den Fehler; Wahrnehmung ist kontrollierte Halluzination.", "The brain predicts sensory input and corrects the error; perception is controlled hallucination."),
        basics: L("Vorhersage = internes Modell des nächsten Eindrucks; Präzision = wie stark das System der Vorhersage oder dem Eingang vertraut; Überraschung = Fehler zwischen beiden.", "Prediction = internal model of the next impression; precision = how much the system trusts prediction vs input; surprise = the error between them."),
        body: [
          L("Das Gehirn hält ein internes Modell und sagt den nächsten Sinneseindruck voraus. Der Unterschied zum Eingang ist der Fehler; Präzision entscheidet, ob die Vorhersage oder die Evidenz dominiert. Bei hoher Präzision wird Wahrnehmung zur kontrollierten Halluzination.", "The brain holds an internal model and predicts the next sensory impression. The difference from the input is the error; precision decides whether prediction or evidence dominates. At high precision, perception becomes controlled hallucination.")
        ],
        open: L("Es erklärt Funktion und Selbstmodell, aber nicht, warum Vorhersage sich anfühlt.", "It explains function and self-model, but not why prediction feels like anything."),
        cite: '<a href="https://doi.org/10.1017/S0140525X12000477" target="_blank" rel="noopener">Clark (2013)</a>; <a href="https://doi.org/10.1038/nrn2787" target="_blank" rel="noopener">Friston (2010)</a>',
        hint: L("Wähle einen Eingang und zieh an der Präzision. Bei hoher Präzision dominiert die Vorhersage.", "Choose an input and drag precision. At high precision the prediction dominates."),
        status: L("Mittlere Präzision. Weiter aktualisiert das Modell.", "Medium precision. Next updates the model.")
      },
      {
        key: "kastrup", tone: "blue",
        tag: "Bewusstsein ist fundamental",
        title: "Analytic Idealism (Kastrup)",
        lead: L("Ein Ozean, viele Wirbel: Individualbewusstsein als lokale Dissoziation.", "One ocean, many vortices: individual consciousness as local dissociation."),
        basics: L("Sparsamkeit = die Theorie mit den wenigsten zusätzlichen Annahmen; Dissoziation = lokale Abgrenzung innerhalb desselben Bewusstseins; Dashboard = die Wahrnehmung ist eine komprimierte Oberfläche (wie ein Icon), nicht das Ding selbst.", "Parsimony = the theory with the fewest extra assumptions; dissociation = local separation within the same consciousness; dashboard = perception is a compressed surface (like an icon), not the thing itself."),
        body: [
          L("Bewusstsein ist das Einzige, was uns sicher gegeben ist; alles Weitere ist eine Schlussfolgerung aus Erfahrungen. Mit dem Sparsamkeitsprinzip nimmt Kastrup nur Bewusstsein an: Alles ist Bewusstsein, jedes Ich ist eine lokale, temporäre Dissoziation – wie ein Wirbel im Wasser, der aus demselben Wasser besteht und nicht davon getrennt werden kann. Unsere Wahrnehmung verhält sich zu den Dingen wie ein Icon zu der Datei, die es repräsentiert. Was wir Erleben nennen, liefert uns nur ein Dashboard zur Welt, nicht die Welt selbst – ähnlich wie Pilot:innen in einem Flugzeug ohne Fenster auf Monitore schauen.", "Consciousness is the only thing we are certain of; everything else is an inference from experience. By parsimony, Kastrup assumes only consciousness: everything is consciousness, and each “I” is a local, temporary dissociation – like a vortex in water, made of the same water and inseparable from it. Our perception relates to things as an icon relates to the file it represents. What we call experience gives us only a dashboard of the world, not the world itself – like pilots in a windowless aircraft looking at monitors.")
        ],
        open: L("Metaphysisch und schwer falsifizierbar; erklärt konkrete neuronale Mechanismen weniger direkt.", "Metaphysical and hard to falsify; it explains concrete neural mechanisms less directly."),
        cite: '<a href="https://www.bernardokastrup.com/p/papers.html" target="_blank" rel="noopener">Kastrup (2018/2019)</a>',
        hint: L("Zieh an der Dissoziation. Weiter: Der Tod beendet die Dissoziation, die Wirbel lösen sich auf.", "Drag dissociation. Next: death ends the dissociation, the vortices dissolve."),
        status: L("Drei Wirbel, stark dissoziiert. Weiter beendet die Dissoziation: Der Tod löst die Wirbel auf.", "Three vortices, strongly dissociated. Next ends the dissociation: death dissolves the vortices.")
      },
      {
        key: "myst", tone: "lilac",
        tag: "Die Grenze der Erklärung",
        title: "New Mysterianism",
        lead: L("Vielleicht liegt Bewusstsein jenseits unserer Begriffe – wie Differentialgleichungen für eine Ratte.", "Perhaps consciousness lies beyond our concepts – like differential equations for a rat."),
        basics: L("Kognitive Grenze = Grenze unserer Begriffe, nicht der Rechenleistung; nicht falsifizierbar = es gibt keine Beobachtung, die die These widerlegen könnte.", "Cognitive limit = a limit of our concepts, not of computing power; not falsifiable = no observation could refute the claim."),
        body: [
          L("Ratten lösen im Labyrinth erstaunlich viel: Sie finden Abkürzungen zum Futter und erinnern sich, welche Arme sie schon besucht haben (Tolman et al., 1946; Olton & Samuelson, 1976). Aber sie lösen keine Differentialgleichungen; ihre Begriffe bleiben an konkrete Wege und Belohnungen gebunden. McGinn fragt, ob Bewusstsein für uns eine ähnliche Grenze ist: keine technische, sondern eine Grenze unserer Begriffe. Vielleicht können wir es prinzipiell nicht vollständig verstehen – so wie eine Ratte keine Differentialgleichung löst.", "Rats learn a lot in mazes: they take shortcuts to food and remember which arms they have already visited (Tolman et al., 1946; Olton & Samuelson, 1976). But they do not solve differential equations; their concepts stay tied to concrete paths and rewards. McGinn asks whether consciousness is a similar limit for us: not a technical one, but a limit of our concepts. Perhaps we cannot fully understand it in principle – just as a rat cannot solve a differential equation.")
        ],
        open: L("Nicht falsifizierbar, aber auch keine Erklärung; sie verschiebt die Frage in unsere Erkenntnisgrenzen.", "Not falsifiable, but also not an explanation; it moves the question to our cognitive limits."),
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
    var active = 0, activeSince = performance.now(), start = performance.now();
    var size = null, ctx = null, raf = 0, paused = false;
    var stars = [];
    for (var si = 0; si < 64; si++) stars.push({ x: (si * 0.37 + 0.05) % 1, y: (si * 0.31 + 0.09) % 1, r: 0.5 + (si % 3) * 0.5, a: 0.05 + (si % 6) * 0.025 });

    var ws = { written: [false, false, false, false, false], broadcastUntil: 0, broadcasted: false, last: -1, pulseStart: 0 };
    var iit = { feedforward: false, cut: 0, pulseStart: 0, phi: 0.82, pulsed: false };
    var pred = { precision: 58, stimulus: "apple", priorCenter: 0.5, priorTarget: null, surprise: 0 };
    var kast = { diss: 70, count: 3, selected: 0, dissolved: false };
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
      if (active === 4) { initMyst(); setStatus(THEORIES[4].status); }
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
    var DRAWERS = [drawWorkspace, drawIIT, drawPredictive, drawKastrup, drawMyst];

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
      el.style.setProperty("--con-accent", th.tone === "green" ? "var(--ls-green)" : th.tone === "gold" ? "var(--ls-gold)" : th.tone === "sky" ? "var(--ls-sky)" : th.tone === "blue" ? "var(--ls-blue)" : "var(--ls-lilac)");
      kicker.textContent = L("Bewusstsein · Theorie ", "Consciousness · theory ") + (active + 1) + " / " + THEORIES.length;
      titleEl.textContent = th.title;
      leadEl.textContent = th.lead;
      detail.innerHTML =
        '<div class="ls-con2-detail-head"><span>' + esc(th.tag) + '</span><b>' + esc(th.title) + '</b></div>' +
        '<div class="ls-con2-detail-body">' + th.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join("") + '</div>' +
        '<p class="ls-con2-basics"><b>' + L("Voraussetzungen", "Background") + '</b> ' + esc(th.basics) + '</p>' +
        '<div class="ls-con2-open"><b>' + L("Was offen bleibt", "What remains open") + '</b><p>' + esc(th.open) + '</p></div>' +
        '<p class="ls-con2-cite">' + th.cite + '</p>';
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
      if (active === 4 && mystNextAction()) return true;
      if (active < THEORIES.length - 1) { setTheory(active + 1); return true; }
      return false;
    }
    function goPrev() { if (active > 0) { setTheory(active - 1); return true; } return false; }
    function setTheory(i) {
      active = clamp(i, 0, THEORIES.length - 1);
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
      hasNext: function () { return active === 4 ? myst.marks.length < 16 : active < THEORIES.length - 1; },
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
