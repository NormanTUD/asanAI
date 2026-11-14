(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function animalScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-animal-scene";
    el.innerHTML = '<div class="ls-animal-stage"><canvas class="ls-canvas" role="img"></canvas></div><div class="ls-animal-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-animal-stage");
    var canvas = el.querySelector("canvas");
    var readout = el.querySelector(".ls-animal-readout");
    var size = null, ctx = null, yaw = -0.62, pitch = 0.46, zoom = 1, drag = null, active = -1, hits = [], raf = 0, last = 0;
    var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var C = api.colors();
    var pairs = DE ? [
      { id: "lion", male: "Löwe", female: "Löwin", species: "Löwe", role: "wild", x: -0.78, z: -1.00, color: "green" },
      { id: "horse", male: "Hengst", female: "Stute", species: "Pferd", role: "domestiziert", x: 0.72, z: -0.33, color: "sky" },
      { id: "cattle", male: "Stier", female: "Kuh", species: "Rind", role: "domestiziert", x: 0.72, z: 0.33, color: "gold" },
      { id: "chicken", male: "Hahn", female: "Henne", species: "Huhn", role: "domestiziert", x: 0.72, z: 1.00, color: "lilac" }
    ] : [
      { id: "lion", male: "Lion", female: "Lioness", species: "lion", role: "wild", x: -0.78, z: -1.00, color: "green" },
      { id: "horse", male: "Stallion", female: "Mare", species: "horse", role: "domesticated", x: 0.72, z: -0.33, color: "sky" },
      { id: "cattle", male: "Bull", female: "Cow", species: "cattle", role: "domesticated", x: 0.72, z: 0.33, color: "gold" },
      { id: "chicken", male: "Rooster", female: "Hen", species: "chicken", role: "domesticated", x: 0.72, z: 1.00, color: "lilac" }
    ];
    function color(name) { return C[name] || C.petrol; }
    var clamp = api.util.clamp;
    function project(x, y, z) {
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var x1 = x * cy - y * sy, y1 = x * sy + y * cy;
      var y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;
      var s = Math.min(size.w * 0.40, size.h * 0.36) / (1 + z2 * 0.22) * zoom;
      return { x: size.w / 2 + x1 * s, y: size.h / 2 - y2 * s, z: z2 };
    }
    function updateReadout() {
      var text;
      if (active >= 0) {
        var p = pairs[active];
        text = DE
          ? p.male + " → " + p.female + ": gleiche Spezies, unterschiedliches Geschlecht. Die Rolle bleibt auf der Rollenachse."
          : p.male + " → " + p.female + ": same species, different gender. Role stays on the role axis.";
      } else {
        text = DE
          ? "Klicke ein Paar an. Die Achsen zeigen Rolle, Geschlecht und Spezies."
          : "Click a pair. The axes show role, gender, and species.";
      }
      readout.innerHTML = '<span><b>' + (DE ? "Paar" : "Pair") + '</b> ' + api.esc(text) + '</span>';
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      hits = [];
      ctx.clearRect(0, 0, size.w, size.h);
      var bg = ctx.createRadialGradient(size.w * 0.5, size.h * 0.42, 8, size.w * 0.5, size.h * 0.5, Math.max(size.w, size.h) * 0.72);
      bg.addColorStop(0, "rgba(247,250,249,.9)");
      bg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, size.w, size.h);
      var axes = [
        { a: [-1.12, 0, 0], b: [1.12, 0, 0], col: C.blue, label: DE ? "Rolle" : "role", end: [1.20, 0, 0] },
        { a: [0, -1.12, 0], b: [0, 1.12, 0], col: C.green, label: DE ? "Geschlecht" : "gender", end: [0, 1.20, 0] },
        { a: [0, 0, -1.18], b: [0, 0, 1.18], col: C.gold, label: DE ? "Spezies" : "species", end: [0, 0, 1.26] }
      ];
      axes.forEach(function (ax) {
        var pa = project(ax.a[0], ax.a[1], ax.a[2]), pb = project(ax.b[0], ax.b[1], ax.b[2]);
        ctx.strokeStyle = ax.col; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        ctx.globalAlpha = 1;
        var le = project(ax.end[0], ax.end[1], ax.end[2]);
        ctx.fillStyle = ax.col;
        ctx.font = '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(ax.label, le.x + 5, le.y - 3);
      });
      // role labels on the x-axis
      var wild = project(-0.78, -1.22, 0), dom = project(0.72, -1.22, 0);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(DE ? "wild" : "wild", wild.x, wild.y);
      ctx.fillText(DE ? "domestiziert" : "domesticated", dom.x, dom.y);
      pairs.forEach(function (p, i) {
        var on = i === active;
        var col = color(p.color);
        var m = project(p.x, -0.78, p.z), f = project(p.x, 0.78, p.z);
        var mx = m.x, my = m.y, fx = f.x, fy = f.y;
        ctx.save();
        ctx.strokeStyle = col;
        ctx.globalAlpha = on ? 1 : 0.72;
        ctx.lineWidth = on ? 3.2 : 2.2;
        ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(fx, fy); ctx.stroke();
        var ang = Math.atan2(fy - my, fx - mx);
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx - 8 * Math.cos(ang - 0.45), fy - 8 * Math.sin(ang - 0.45));
        ctx.lineTo(fx - 8 * Math.cos(ang + 0.45), fy - 8 * Math.sin(ang + 0.45));
        ctx.closePath(); ctx.fillStyle = col; ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
        [[mx, my, p.male, true], [fx, fy, p.female, false]].forEach(function (pt) {
          ctx.beginPath(); ctx.arc(pt[0], pt[1], on ? 6 : 4.5, 0, Math.PI * 2);
          ctx.fillStyle = col; ctx.fill();
          ctx.strokeStyle = C.paper; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = C.ink;
          ctx.font = (on ? '700 ' : '600 ') + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
          ctx.textAlign = "center";
          ctx.fillText(pt[2], pt[0], pt[1] + (pt[3] ? -10 : 16));
          hits.push({ x: pt[0], y: pt[1], r: 24, pair: i });
        });
        hits.push({ x: (mx + fx) / 2, y: (my + fy) / 2, r: 26, pair: i });
      });
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(DE ? "Ziehen zum Drehen · Paar anklicken" : "Drag to rotate · click a pair", 12, 18);
      canvas.setAttribute("aria-label", DE
        ? "Drei Dimensionen: Rolle, Geschlecht, Spezies. Alle Pfeile zeigen von männlich nach weiblich."
        : "Three dimensions: role, gender, species. All arrows point from male to female.");
      canvas.__lsAnimal = { active: active, pairs: pairs.length, hits: hits };
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (now - last < 40) return;
      last = now;
      if (!drag) yaw += 0.0025;
      draw();
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    function pointer(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    canvas.addEventListener("pointerdown", function (e) { drag = pointer(e); });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return;
      yaw += (e.clientX - drag.x) * 0.008;
      pitch = clamp(pitch + (e.clientY - drag.y) * 0.006, -1.1, 1.1);
      drag = pointer(e);
      draw();
    });
    window.addEventListener("pointerup", function (e) {
      if (drag) {
        var p = pointer(e);
        var moved = Math.abs(p.x - drag.x) + Math.abs(p.y - drag.y);
        drag = null;
        if (moved > 8) return;
      }
      var p = pointer(e);
      var best = -1, bd = 30;
      hits.forEach(function (h) { var d = Math.hypot(h.x - p.x, h.y - p.y); if (d < Math.max(18, h.r)) { if (d < bd) { bd = d; best = h.pair; } } });
      if (best >= 0) { active = active === best ? -1 : best; updateReadout(); draw(); }
    });
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    updateReadout();
    resize();
    if (!reducedMotion) raf = requestAnimationFrame(frame);
    return {
      update: function () {},
      pause: function () { if (raf) { cancelAnimationFrame(raf); raf = 0; } },
      resume: function () { if (!reducedMotion && !raf) raf = requestAnimationFrame(frame); else draw(); },
      resize: resize,
      destroy: function () { if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", resize); el.remove(); }
    };
  }

  core.register("animals", animalScene);
})();
