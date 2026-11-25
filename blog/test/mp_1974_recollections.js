(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroRecollections");
  if (hero) {
    var rnd = MP.mulberry32(1974);
    var stars = [];
    for (var i = 0; i < 80; i++) stars.push({ x: rnd(), y: rnd(), r: 0.6 + rnd() * 1.6, ph: rnd() * 6.28 });
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.12;
      MP.grid(ctx, w, h, Math.max(34, Math.min(w, h) * 0.08), c.line);
      ctx.restore();
      stars.forEach(function (s) {
        var a = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.1 + s.ph));
        ctx.save();
        ctx.globalAlpha = a;
        MP.dot(ctx, s.x * w, s.y * h, s.r, s.r > 1.6 ? c.accent : c.muted);
        ctx.restore();
      });
      var cx = w * 0.5, cy = h * 0.5;
      for (var k = 0; k < 10; k++) {
        var a1 = k * 0.63 + t * 0.05;
        var a2 = a1 + 2.1;
        var r1 = Math.min(w, h) * 0.16;
        var r2 = Math.min(w, h) * 0.28;
        ctx.save();
        ctx.strokeStyle = c.accent;
        ctx.globalAlpha = 0.12;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1 * 0.7);
        ctx.lineTo(cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2 * 0.7);
        ctx.stroke();
        ctx.restore();
      }
      MP.label(ctx, "a constellation of teachers and arguments", w * 0.5, h * 0.9, c.muted, 10, "center");
    }, { maxDpr: 1.6 });
  }

  var canvas = document.getElementById("genealogyLab");
  if (canvas) {
    var nodes = [
      { id: "jones", name: "Rufus Jones", role: "Quaker philosopher, Haverford, 1917", x: 0.13, y: 0.22, quote: "Friend, thee will be busy as long as thee lives." },
      { id: "boltwood", name: "Bertram Boltwood", role: "Chemist, historian of science, Yale", x: 0.25, y: 0.1, quote: "They were not afraid to think." },
      { id: "kant", name: "Immanuel Kant", role: "Synthetic a priori", x: 0.42, y: 0.16, quote: "The synthetic a priori is the Leitmotiv." },
      { id: "magnus", name: "Rudolf Magnus", role: "The physiological a priori", x: 0.58, y: 0.12, quote: "The physiology of the a priori." },
      { id: "dusser", name: "Dusser de Barenne", role: "Experimental epistemology, Yale", x: 0.72, y: 0.2, quote: "Strychnine neuronography and the physiology of knowledge." },
      { id: "descartes", name: "René Descartes", role: "The least true-or-false event", x: 0.86, y: 0.32, quote: "The least true or false event would have been his postulated hydraulic pulse in a single tube." },
      { id: "peirce", name: "Charles S. Peirce", role: "Logic of relatives; pragmatism", x: 0.9, y: 0.56, quote: "The logic of relatives." },
      { id: "russell", name: "Russell & Whitehead", role: "Principia Mathematica", x: 0.8, y: 0.76, quote: "The calculus of atomic propositions." },
      { id: "wiener", name: "Norbert Wiener", role: "Cybernetics; control and communication", x: 0.62, y: 0.86, quote: "Control and communication in the animal and the machine." },
      { id: "pitts", name: "Walter Pitts", role: "The teenage logician who set him right", x: 0.42, y: 0.86, quote: "He promptly set me right in matters of theory." },
      { id: "vonneumann", name: "John von Neumann", role: "Computing machines; probabilistic logic", x: 0.24, y: 0.78, quote: "He picked up the 1943 paper and used it in teaching the theory of computing machines." },
      { id: "lettvin", name: "Jerome Lettvin", role: "The frog's eye; experimental epistemology", x: 0.12, y: 0.58, quote: "What the Frog's Eye Tells the Frog's Brain." },
      { id: "mcculloch", name: "Warren S. McCulloch", role: "The question, and the programme", x: 0.5, y: 0.5, quote: "Though I did not know it then, I had become a cyberneticist." }
    ];
    var edges = [
      ["jones", "mcculloch"], ["boltwood", "mcculloch"], ["kant", "magnus"], ["magnus", "dusser"],
      ["dusser", "mcculloch"], ["descartes", "mcculloch"], ["peirce", "mcculloch"], ["russell", "mcculloch"],
      ["wiener", "mcculloch"], ["pitts", "mcculloch"], ["vonneumann", "mcculloch"], ["lettvin", "mcculloch"],
      ["kant", "mcculloch"], ["peirce", "pitts"], ["russell", "pitts"], ["wiener", "pitts"]
    ];
    var selected = "mcculloch";
    var hits = [];
    var nameEl = document.getElementById("sourceName");
    var roleEl = document.getElementById("sourceRole");
    var quoteEl = document.getElementById("sourceQuote");
    function select(id) {
      selected = id;
      var n = null;
      nodes.forEach(function (x) { if (x.id === id) n = x; });
      if (!n) return;
      if (nameEl) nameEl.textContent = n.name;
      if (roleEl) roleEl.textContent = n.role;
      if (quoteEl) quoteEl.textContent = "“" + n.quote + "”";
    }
    select(selected);
    canvas.addEventListener("pointerdown", function (e) {
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left, y = e.clientY - rect.top;
      var best = null, bd = 1e9;
      hits.forEach(function (h) {
        var d = Math.hypot(h.x - x, h.y - y);
        if (d < bd) { bd = d; best = h; }
      });
      if (best && bd < 44) select(best.id);
    });

    MP.canvas(canvas, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.18;
      MP.grid(ctx, w, h, Math.max(28, Math.min(w, h) * 0.065), c.line);
      ctx.restore();
      hits = [];
      var pos = {};
      nodes.forEach(function (n) { pos[n.id] = { x: n.x * w, y: n.y * h }; });
      edges.forEach(function (e) {
        var a = pos[e[0]], b = pos[e[1]];
        if (!a || !b) return;
        var active = selected === e[0] || selected === e[1];
        ctx.save();
        ctx.strokeStyle = active ? c.accent : c.line;
        ctx.globalAlpha = active ? 0.55 : 0.16;
        ctx.lineWidth = active ? 1.4 : 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();
      });
      nodes.forEach(function (n, i) {
        var p = pos[n.id];
        var hot = selected === n.id;
        var pulse = 0.6 + 0.4 * Math.sin(t * 1.5 + i);
        ctx.save();
        if (hot) { ctx.shadowBlur = 24; ctx.shadowColor = c.accent; }
        MP.dot(ctx, p.x, p.y, hot ? 8 : 4, hot ? c.accent : c.muted);
        ctx.restore();
        if (hot) {
          ctx.save();
          ctx.strokeStyle = c.accent;
          ctx.globalAlpha = 0.5 + 0.3 * pulse;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 14 + pulse * 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        MP.label(ctx, n.name, p.x, p.y + 18, hot ? c.ink : c.muted, 8, "center");
        hits.push({ id: n.id, x: p.x, y: p.y });
      });
      MP.label(ctx, "click a star", w * 0.5, h * 0.95, c.muted, 9, "center");
    }, { maxDpr: 2 });
  }

  var timelineCanvas = document.getElementById("timelineLab");
  if (timelineCanvas) {
    var events = [
      { y: 1917, label: "Haverford", detail: "Rufus Jones asks what he will do. The answer is the number question." },
      { y: 1923, label: "Logic", detail: "Abandons the logic of transitive verbs for the logic of propositions." },
      { y: 1928, label: "Bellevue", detail: "Neurology; meets Eilhard von Domarus." },
      { y: 1930, label: "Rockland", detail: "State hospital for the insane; paranoia and the logic of mind." },
      { y: 1941, label: "Chicago", detail: "Meets Walter Pitts, who sets the theory right." },
      { y: 1943, label: "Calculus", detail: "The logical calculus of nervous activity." },
      { y: 1945, label: "Heterarchy", detail: "Values have no common scale." },
      { y: 1947, label: "Universals", detail: "Perception as invariance under a group." },
      { y: 1948, label: "Organization", detail: "The statistical organization of nervous activity." },
      { y: 1951, label: "Mind / Den", detail: "Why the mind is in the head; causality as superstition." },
      { y: 1952, label: "MIT RLE", detail: "Research Laboratory of Electronics; experimental epistemology." },
      { y: 1955, label: "Mysterium", detail: "Organisms, even brains, are machines." },
      { y: 1956, label: "Ethics", detail: "Ethical robots and the rules of the game." },
      { y: 1959, label: "Frog", detail: "What the frog's eye tells the frog's brain." },
      { y: 1960, label: "Number", detail: "The Korzybski lecture: number, psychon, probabilistic logic." },
      { y: 1965, label: "Embodiments", detail: "Embodiments of Mind collects the essays." },
      { y: 1969, label: "Death", detail: "McCulloch dies; the questions remain." },
      { y: 1974, label: "Recollections", detail: "The ASC Forum publishes the memoir." }
    ];
    var yearEl = document.getElementById("yearVal");
    var eraTitle = document.getElementById("eraTitle");
    var eraText = document.getElementById("eraText");
    function nearest(y) {
      var best = events[0];
      events.forEach(function (e) { if (Math.abs(e.y - y) < Math.abs(best.y - y)) best = e; });
      return best;
    }
    function update(y) {
      var e = nearest(y);
      if (yearEl) yearEl.textContent = Math.round(y);
      if (eraTitle) eraTitle.textContent = e.y + " · " + e.label;
      if (eraText) eraText.textContent = e.detail;
    }
    MP.bindRange("year", function (v) { update(v); });
    update(1960);

    MP.canvas(timelineCanvas, function (ctx, w, h, t) {
      var c = MP.colors();
      var y0 = parseFloat(document.getElementById("year").value);
      ctx.save();
      ctx.globalAlpha = 0.18;
      MP.grid(ctx, w, h, Math.max(26, Math.min(w, h) * 0.06), c.line);
      ctx.restore();
      var left = w * 0.06, right = w * 0.94;
      var y = h * 0.55;
      ctx.save();
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
      ctx.restore();
      var ymin = 1917, ymax = 1974;
      events.forEach(function (e, i) {
        var x = left + ((e.y - ymin) / (ymax - ymin)) * (right - left);
        var on = Math.abs(e.y - y0) < 1.1;
        ctx.save();
        if (on) { ctx.shadowBlur = 18; ctx.shadowColor = c.accent; }
        MP.dot(ctx, x, y, on ? 6 : 3, on ? c.accent : c.muted);
        ctx.restore();
        if (i % 2 === 0 || on) {
          MP.label(ctx, String(e.y), x, y + (i % 2 === 0 ? 22 : 38), on ? c.accent : c.faint, 8, "center");
        }
      });
      var px = left + ((y0 - ymin) / (ymax - ymin)) * (right - left);
      ctx.save();
      ctx.strokeStyle = c.accent2;
      ctx.lineWidth = 1.4;
      ctx.shadowBlur = 18;
      ctx.shadowColor = c.accent;
      ctx.beginPath();
      ctx.moveTo(px, h * 0.22);
      ctx.lineTo(px, h * 0.78);
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, "1917", left, h * 0.86, c.faint, 9, "center");
      MP.label(ctx, "1974", right, h * 0.86, c.faint, 9, "center");
    }, { maxDpr: 2 });
  }
})();
