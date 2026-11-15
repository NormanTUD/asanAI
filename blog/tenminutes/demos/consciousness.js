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
      { id: "center", label: DE ? "Bewusstsein" : "consciousness", x: 0.5, y: 0.5, c: "petrol", r: 9 },
      { id: "access", label: DE ? "Zugang" : "access", x: 0.28, y: 0.34, c: "blue", r: 7 },
      { id: "phenomenal", label: DE ? "Erfahrung" : "experience", x: 0.72, y: 0.34, c: "green", r: 7 },
      { id: "gwt", label: "Global Workspace", x: 0.14, y: 0.17, c: "blue", r: 5 },
      { id: "jspace", label: "J-space", x: 0.31, y: 0.13, c: "blue", r: 5 },
      { id: "higher", label: DE ? "Höhere Ordnung" : "higher order", x: 0.12, y: 0.42, c: "blue", r: 5 },
      { id: "schema", label: DE ? "Attention Schema" : "attention schema", x: 0.30, y: 0.55, c: "blue", r: 5 },
      { id: "iit", label: "IIT / Φ", x: 0.87, y: 0.16, c: "green", r: 5 },
      { id: "qualia", label: "Qualia", x: 0.89, y: 0.40, c: "green", r: 5 },
      { id: "predictive", label: DE ? "Predictive Processing" : "predictive processing", x: 0.71, y: 0.13, c: "green", r: 5 },
      { id: "illusion", label: DE ? "Illusionismus" : "illusionism", x: 0.72, y: 0.57, c: "lilac", r: 5 },
      { id: "pan", label: DE ? "Panpsychismus" : "panpsychism", x: 0.88, y: 0.57, c: "gold", r: 5 }
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
    function pos(n) { return { x: 20 + n.x * (size.w - 40), y: 20 + n.y * (size.h - 68) }; }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      var bg = ctx.createRadialGradient(w * 0.5, h * 0.4, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      bg.addColorStop(0, "rgba(247,250,249,.96)");
      bg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      var now = performance.now();
      edges.forEach(function (e, i) {
        var a = byId(e[0]), b = byId(e[1]);
        if (!a || !b) return;
        var p1 = pos(a), p2 = pos(b);
        var col = e[0] === "center" ? C.petrol : (e[0] === "access" ? C.blue : C.green);
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        ctx.globalAlpha = 0.7;
        var u = ((now / 1800) + i * 0.11) % 1;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(p1.x + (p2.x - p1.x) * u, p1.y + (p2.y - p1.y) * u, 1.8, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      hits = [];
      nodes.forEach(function (n) {
        var p = pos(n);
        var col = C[n.c] || C.petrol;
        var on = n.id === selected;
        if (on) {
          ctx.shadowColor = col; ctx.shadowBlur = 16;
        }
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(p.x, p.y, on ? n.r + 2 : n.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = C.paper; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = C.ink;
        ctx.font = (on ? '700 ' : '600 ') + Math.max(8, Math.min(10, api.font("canvas-sm"))) + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        var label = n.label;
        var tw = ctx.measureText(label).width;
        var lx = Math.max(4, Math.min(w - tw - 4, p.x - tw / 2));
        ctx.fillStyle = on ? C.ink : C.muted;
        ctx.fillText(label, lx, p.y + n.r + 4);
        hits.push({ id: n.id, x: p.x, y: p.y, r: Math.max(n.r + 6, 14) });
      });
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
