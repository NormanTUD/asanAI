(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function consciousnessScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-consc-scene";
    el.innerHTML = '<div class="ls-consc-stage"><canvas class="ls-canvas" role="img"></canvas></div><div class="ls-consc-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-consc-stage");
    var canvas = el.querySelector("canvas");
    var readout = el.querySelector(".ls-consc-readout");
    var size = null, ctx = null, C = api.colors();
    var running = true, raf = 0;
    var nodes = [
      { id: "center", label: DE ? "Bewusstsein" : "consciousness", x: 0.5, y: 0.52, c: "petrol", r: 10, branch: "center" },
      { id: "access", label: DE ? "Zugang" : "access", x: 0.27, y: 0.36, c: "blue", r: 8, branch: "access" },
      { id: "phenomenal", label: DE ? "Erfahrung" : "experience", x: 0.73, y: 0.36, c: "green", r: 8, branch: "experience" },
      { id: "gwt", label: "Global Workspace", x: 0.13, y: 0.18, c: "blue", r: 5, branch: "access" },
      { id: "jspace", label: "J-space", x: 0.31, y: 0.13, c: "blue", r: 5, branch: "access" },
      { id: "higher", label: DE ? "Höhere Ordnung" : "higher order", x: 0.10, y: 0.47, c: "blue", r: 5, branch: "access" },
      { id: "schema", label: DE ? "Attention Schema" : "attention schema", x: 0.30, y: 0.61, c: "blue", r: 5, branch: "access" },
      { id: "iit", label: "IIT / Φ", x: 0.88, y: 0.16, c: "green", r: 5, branch: "experience" },
      { id: "qualia", label: "Qualia", x: 0.91, y: 0.43, c: "green", r: 5, branch: "experience" },
      { id: "predictive", label: DE ? "Predictive Processing" : "predictive processing", x: 0.71, y: 0.13, c: "green", r: 5, branch: "experience" },
      { id: "illusion", label: DE ? "Illusionismus" : "illusionism", x: 0.71, y: 0.62, c: "lilac", r: 5, branch: "experience" },
      { id: "pan", label: DE ? "Panpsychismus" : "panpsychism", x: 0.89, y: 0.62, c: "gold", r: 5, branch: "experience" }
    ];
    var edges = [
      ["center", "access"], ["center", "phenomenal"],
      ["access", "gwt"], ["access", "jspace"], ["access", "higher"], ["access", "schema"],
      ["phenomenal", "iit"], ["phenomenal", "qualia"], ["phenomenal", "predictive"], ["phenomenal", "illusion"], ["phenomenal", "pan"]
    ];
    var descriptions = DE ? {
      center: "Der Überblick: viele Theorien, eine offene Frage.",
      access: "Information ist verfügbar zum Berichten und Steuern.",
      phenomenal: "Es gibt etwas, wie es sich anfühlt.",
      gwt: "Ein Zustand wird bewusst, wenn er an viele Prozesse gesendet wird.",
      jspace: "Lesbarer Arbeitsraum in Claude: Zugang, kein Beweis von Erleben.",
      higher: "Ein Zustand wird bewusst, wenn eine höhere Repräsentation auf ihn zeigt.",
      schema: "Das System modelliert seine eigene Aufmerksamkeit.",
      iit: "Bewusstsein ist geeinte Ursache-Wirkungs-Struktur, gemessen als Φ.",
      qualia: "Die gefühlten Eigenschaften von Erfahrung.",
      predictive: "Wahrnehmung ist kontrollierte Vorhersage.",
      illusion: "Phänomenales Bewusstsein ist eine Introspektions-Illusion.",
      pan: "Erfahrung ist eine fundamentale Eigenschaft."
    } : {
      center: "The overview: many theories, one open question.",
      access: "Information is available to report and control.",
      phenomenal: "There is something it is like.",
      gwt: "A state is conscious when it is broadcast to many processes.",
      jspace: "A readable workspace in Claude: access, not proof of experience.",
      higher: "A state is conscious when a higher representation points at it.",
      schema: "The system models its own attention.",
      iit: "Consciousness is a unified cause-effect structure, measured as Φ.",
      qualia: "The felt properties of experience.",
      predictive: "Perception is controlled prediction.",
      illusion: "Phenomenal consciousness is an introspection illusion.",
      pan: "Experience is a fundamental property."
    };
    var selected = "center";
    var hits = [];
    function byId(id) { for (var i = 0; i < nodes.length; i++) if (nodes[i].id === id) return nodes[i]; return null; }
    function pos(n) { return { x: 24 + n.x * (size.w - 48), y: 24 + n.y * (size.h - 92) }; }
    function branchOf(id) { var n = byId(id); return n ? n.branch : "center"; }
    function activeBranch() {
      var b = branchOf(selected);
      return b === "center" ? null : b;
    }
    function alphaFor(branch) {
      var a = activeBranch();
      if (!a || b === "center" || b === a) return 1;
      return 0.22;
    }
    function controlPoint(a, b) {
      var p1 = pos(a), p2 = pos(b);
      var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      var dx = p2.x - p1.x, dy = p2.y - p1.y;
      var len = Math.max(1, Math.hypot(dx, dy));
      var off = len * 0.16;
      return { x: mx - dy / len * off, y: my + dx / len * off };
    }
    function curvePoint(a, b, u) {
      var p1 = pos(a), p2 = pos(b), c = controlPoint(a, b);
      var v = 1 - u;
      return { x: v * v * p1.x + 2 * v * u * c.x + u * u * p2.x, y: v * v * p1.y + 2 * v * u * c.y + u * u * p2.y };
    }
    function particles(w, h, now) {
      for (var i = 0; i < 30; i++) {
        var x = ((i * 67 + now / (32 + i % 4)) % w + w) % w;
        var y = ((i * 43 + Math.sin(now / 1000 + i) * 22 + h * 0.18) % h + h) % h;
        ctx.globalAlpha = 0.035 + (i % 4) * 0.016;
        ctx.fillStyle = i % 2 ? C.blue : C.green;
        ctx.beginPath(); ctx.arc(x, y, 1 + (i % 3) * 0.7, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      var bg = ctx.createRadialGradient(w * 0.5, h * 0.42, 8, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      bg.addColorStop(0, "rgba(247,250,249,.98)");
      bg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      // two fields: access (blue) / experience (green)
      var lg = ctx.createRadialGradient(w * 0.27, h * 0.4, 4, w * 0.27, h * 0.4, w * 0.34);
      lg.addColorStop(0, "rgba(18,117,172,.13)"); lg.addColorStop(1, "rgba(18,117,172,0)");
      ctx.fillStyle = lg; ctx.fillRect(0, 0, w, h);
      var rg = ctx.createRadialGradient(w * 0.73, h * 0.4, 4, w * 0.73, h * 0.4, w * 0.34);
      rg.addColorStop(0, "rgba(99,164,75,.12)"); rg.addColorStop(1, "rgba(99,164,75,0)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
      particles(w, h, performance.now());
      var ab = activeBranch();
      if (ab === "access") {
        var ag = ctx.createRadialGradient(w * 0.27, h * 0.4, 4, w * 0.27, h * 0.4, w * 0.38);
        ag.addColorStop(0, "rgba(18,117,172,.10)"); ag.addColorStop(1, "rgba(18,117,172,0)");
        ctx.fillStyle = ag; ctx.fillRect(0, 0, w, h);
      } else if (ab === "experience") {
        var eg = ctx.createRadialGradient(w * 0.73, h * 0.4, 4, w * 0.73, h * 0.4, w * 0.38);
        eg.addColorStop(0, "rgba(99,164,75,.10)"); eg.addColorStop(1, "rgba(99,164,75,0)");
        ctx.fillStyle = eg; ctx.fillRect(0, 0, w, h);
      }
      // rotating outer ring
      ctx.save();
      ctx.strokeStyle = C.petrol; ctx.globalAlpha = 0.10; ctx.lineWidth = 1;
      ctx.setLineDash([2, 8]);
      ctx.beginPath(); ctx.arc(w * 0.5, h * 0.5, Math.min(w, h) * 0.47, performance.now() / 3000, performance.now() / 3000 + Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
      // open boundary
      ctx.strokeStyle = C.line; ctx.setLineDash([5, 6]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.52, w * 0.44, h * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.muted; ctx.font = '600 9px "Open Sans", sans-serif'; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText(DE ? "offen" : "open", w * 0.5, h * 0.52 - h * 0.42 - 4);
      var now = performance.now();
      edges.forEach(function (e, i) {
        var a = byId(e[0]), b = byId(e[1]);
        if (!a || !b) return;
        var alpha = alphaFor(b.branch);
        var p1 = pos(a), c = controlPoint(a, b), p2 = pos(b);
        var col = b.branch === "access" ? C.blue : C.green;
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.18 * alpha;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.quadraticCurveTo(c.x, c.y, p2.x, p2.y); ctx.stroke();
        ctx.globalAlpha = 0.8 * alpha;
        var u = ((now / 1700) + i * 0.12) % 1;
        var pt = curvePoint(a, b, u);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      hits = [];
      nodes.forEach(function (n) {
        var p = pos(n);
        var col = C[n.c] || C.petrol;
        var on = n.id === selected;
        var alpha = alphaFor(n.branch);
        ctx.globalAlpha = alpha;
        if (on) { ctx.shadowColor = col; ctx.shadowBlur = 20; }
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(p.x, p.y, on ? n.r + 3 : n.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = C.paper; ctx.lineWidth = 1.6; ctx.stroke();
        if (on) {
          ctx.strokeStyle = col; ctx.globalAlpha = 0.35 * alpha; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(p.x, p.y, n.r + 8 + Math.sin(now / 400) * 2, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = alpha;
        ctx.font = (on ? '700 ' : '600 ') + Math.max(8, Math.min(10, api.font("canvas-sm"))) + 'px "Open Sans", sans-serif';
        var tw = ctx.measureText(n.label).width;
        var lx = Math.max(4, Math.min(w - tw - 4, p.x - tw / 2));
        var ly = p.y + n.r + 5;
        ctx.fillStyle = "rgba(255,255,255,.82)";
        ctx.fillRect(lx - 3, ly - 1, tw + 6, 12);
        ctx.fillStyle = on ? C.ink : C.muted;
        ctx.textAlign = "left"; ctx.textBaseline = "top";
        ctx.fillText(n.label, lx, ly);
        ctx.globalAlpha = 1;
        hits.push({ id: n.id, x: p.x, y: p.y, r: Math.max(n.r + 6, 14) });
      });
      // core rings
      var cc = pos(byId("center"));
      [18, 26, 36].forEach(function (rr, idx) {
        ctx.strokeStyle = C.petrol;
        ctx.globalAlpha = 0.08 - idx * 0.015;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cc.x, cc.y, rr + Math.sin(now / 500 + idx) * 1.5, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      // legend
      var ly2 = h - 12;
      ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(w * 0.28 - 30, ly2, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.muted; ctx.font = '600 9px "Open Sans", sans-serif'; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(DE ? "Zugang" : "access", w * 0.28 - 22, ly2);
      ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(w * 0.72 - 30, ly2, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.muted; ctx.fillText(DE ? "Erfahrung" : "experience", w * 0.72 - 22, ly2);
      canvas.setAttribute("aria-label", DE ? "Theorienkarte des Bewusstseins. " + descriptions[selected] : "Map of consciousness theories. " + descriptions[selected]);
    }
    function loop() { if (!running) return; draw(); raf = requestAnimationFrame(loop); }
    function selectAt(x, y) {
      for (var i = 0; i < hits.length; i++) {
        var h = hits[i];
        if (Math.hypot(h.x - x, h.y - y) <= h.r) { selected = h.id; readout.textContent = descriptions[selected]; draw(); return true; }
      }
      return false;
    }
    canvas.addEventListener("click", function (e) {
      var r = canvas.getBoundingClientRect();
      selectAt(e.clientX - r.left, e.clientY - r.top);
    });
    canvas.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var hot = false;
      for (var i = 0; i < hits.length; i++) { if (Math.hypot(hits[i].x - x, hits[i].y - y) <= hits[i].r) { hot = true; break; } }
      canvas.style.cursor = hot ? "pointer" : "default";
    });
    function resize() { size = api.fit(canvas, stage); draw(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    readout.textContent = descriptions[selected];
    resize();
    raf = requestAnimationFrame(loop);
    return {
      update: function () {},
      pause: function () { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
      resume: function () { if (!running) { running = true; raf = requestAnimationFrame(loop); } },
      resize: resize,
      destroy: function () { running = false; if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", resize); el.remove(); }
    };
  }
  core.register("consciousness", consciousnessScene);
})();
