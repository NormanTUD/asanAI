(function () {
  "use strict";

  var world = document.getElementById("th-world");
  var canvas = document.getElementById("th-canvas");
  var readout = document.getElementById("th-readout");
  var controls = document.getElementById("th-controls");
  var theoryName = document.getElementById("th-theory-name");
  var theoryAbout = document.getElementById("th-theory-about");
  var metricLabel = document.getElementById("th-metric-label");
  var metricValue = document.getElementById("th-metric-value");
  var metricBar = document.getElementById("th-metric-bar");
  if (!world || !canvas) return;

  var box = null;
  var scene = null;
  var state = { theory: "workspace" };
  var metricTick = 0;
  var last = 0;

  function L(de, en) { return T2.t(de, en); }
  function narrate(html) { readout.innerHTML = html; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function css(name, fallback) { return T2.cssVar(name, world) || fallback; }
  function color(name, fallback) { return T2.cssVar(name) || fallback; }

  function updateMetric() {
    if (!scene) return;
    var m = scene.metric();
    metricLabel.textContent = L(m.label[0], m.label[1]);
    metricValue.textContent = m.value;
    metricBar.style.width = clamp(m.ratio * 100, 0, 100) + "%";
  }

  function renderTheoryChrome() {
    theoryName.textContent = scene.name();
    theoryAbout.textContent = scene.about();
    document.querySelectorAll(".th-theory-pills [data-theory]").forEach(function (b) {
      var on = b.getAttribute("data-theory") === state.theory;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function renderControls() {
    if (!controls || !scene) return;
    controls.innerHTML = "";
    scene.controls(controls);
  }

  function resizeCanvas() {
    box = T2.fit(canvas, world);
  }

  function setTheory(name) {
    if (!SCENES[name]) return;
    state.theory = name;
    scene = SCENES[name];
    world.setAttribute("data-theory", name);
    var metricEl = document.querySelector(".th-metric");
    if (metricEl) metricEl.style.display = scene.hideMetric ? "none" : "";
    renderTheoryChrome();
    renderControls();
    resizeCanvas();
    if (scene.layout) scene.layout();
    if (scene.enter) scene.enter();
    updateMetric();
    narrate(scene.defaultText());
  }

  /* =====================================================================
     Global Workspace: one module broadcasts into the stage
     ===================================================================== */

  var WORKSPACE = (function () {
    var MODULES = ["vision", "language", "memory", "emotion", "motor"];
    var CONTENT = {
      vision: ["ein roter Apfel", "a red apple"],
      language: ["das Wort „Apfel“", "the word “apple”"],
      memory: ["Erinnerung an Obst", "a memory of fruit"],
      emotion: ["angenehm", "pleasant"],
      motor: ["greifen", "reach"]
    };
    var local = { mode: "access", active: null };
    var moduleEls = {}, centers = {}, wsCenter = { x: 0, y: 0 };
    var ambient = {}, pulses = [], rings = [], dust = [];
    var sceneEl = document.querySelector(".th-scene--workspace");
    var wsEl = document.getElementById("th-workspace");
    var coreEl = document.getElementById("th-ws-core");
    var reportEl = document.getElementById("th-ws-report");
    var kickerEl = document.getElementById("th-ws-kicker");
    var noteEl = document.getElementById("th-ws-note");

    function moduleName(m) {
      var names = {
        vision: ["Sehen", "vision"],
        language: ["Sprache", "language"],
        memory: ["Gedächtnis", "memory"],
        emotion: ["Emotion", "emotion"],
        motor: ["Motor", "motor"]
      };
      return L(names[m][0], names[m][1]);
    }

    function initWorkspace() {
      MODULES.forEach(function (m) {
        moduleEls[m] = sceneEl.querySelector('[data-module="' + m + '"]');
        moduleEls[m].addEventListener("click", function () { broadcast(m); });
      });
      for (var i = 0; i < 26; i++) {
        dust.push({ x: (i * 0.37 + 0.11) % 1, y: (i * 0.73 + 0.07) % 1, s: 0.004 + (i % 5) * 0.002, size: 0.7 + (i % 4) * 0.5, a: 0.08 + (i % 6) * 0.02 });
      }
      syncText();
    }

    function setActive(m) {
      local.active = m;
      MODULES.forEach(function (k) {
        moduleEls[k].classList.toggle("is-on", k === m);
        moduleEls[k].classList.toggle("is-dim", k !== m);
      });
      syncText();
    }

    function broadcast(m) {
      setActive(m);
      pulses.push({ m: m, t: 0, fired: false });
      rings.push({ r: 26, alpha: 0.55 });
      var text = L(CONTENT[m][0], CONTENT[m][1]);
      if (local.mode === "experience") {
        narrate(L(
          moduleName(m) + " meldet: " + text + ". Der Bericht ist da. Ob er sich von innen wie etwas anfühlt, zeigt diese Bühne nicht.",
          moduleName(m) + " reports: " + text + ". The report is there. Whether it feels like anything from the inside is not shown by this stage."
        ));
      } else {
        narrate(L(
          moduleName(m) + " broadcastet: " + text + ". Nur dieser Inhalt ist global verfügbar; die anderen Module rechnen lokal weiter.",
          moduleName(m) + " broadcasts: " + text + ". Only this content is globally available; the other modules keep computing locally."
        ));
      }
    }

    function setMode(mode) {
      local.mode = mode === "experience" ? "experience" : "access";
      world.setAttribute("data-mode", local.mode);
      syncText();
      renderControls();
      narrate(L(
        local.mode === "experience"
          ? "Erleben: Der Bericht ist messbar, die gefühlte Qualität nicht. Die Bühne zeigt den Zugang; das Erleben bleibt offen."
          : "Zugang: Was im Workspace ankommt, steht für Bericht, Kontrolle und Schlussfolgerungen bereit. Klick ein Modul.",
        local.mode === "experience"
          ? "Experience: the report is measurable, the felt quality is not. The stage shows access; experience remains open."
          : "Access: what arrives in the workspace is available for report, control, and inference. Click a module."
      ));
    }

    function reset() {
      local.active = null;
      local.mode = "access";
      world.setAttribute("data-mode", "access");
      MODULES.forEach(function (m) {
        moduleEls[m].classList.remove("is-on", "is-dim");
      });
      pulses = [];
      rings = [];
      syncText();
      renderControls();
      narrate(L("Zurückgesetzt. Klick ein Modul, um seinen Inhalt zu broadcasten.", "Reset. Click a module to broadcast its content."));
    }

    function syncText() {
      kickerEl.textContent = "Global Workspace" + (local.mode === "experience" ? L(" · Erleben", " · experience") : L(" · Zugang", " · access"));
      noteEl.textContent = local.mode === "experience"
        ? L("der Bericht ist da, das Erleben bleibt offen", "the report is there, experience remains open")
        : L("die Bühne ist das Bewusstsein", "the stage is consciousness");
      if (local.active) {
        reportEl.textContent = moduleName(local.active) + ": " + L(CONTENT[local.active][0], CONTENT[local.active][1]);
        reportEl.classList.add("is-on");
        wsEl.classList.add("is-live");
        coreEl.textContent = local.mode === "experience" ? "?" : "●";
      } else {
        reportEl.textContent = "";
        reportEl.classList.remove("is-on");
        wsEl.classList.remove("is-live");
        coreEl.textContent = "●";
      }
    }

    function layout() {
      if (state.theory !== "workspace") return;
      var wr = world.getBoundingClientRect();
      MODULES.forEach(function (m) {
        var r = moduleEls[m].getBoundingClientRect();
        centers[m] = { x: r.left - wr.left + r.width / 2, y: r.top - wr.top + r.height / 2 };
      });
      var ws = wsEl.getBoundingClientRect();
      wsCenter = { x: ws.left - wr.left + ws.width / 2, y: ws.top - wr.top + ws.height / 2 };
    }

    function drawWorkspace(ctx, w, h, dt, now) {
      var accent = css("--th-accent", "#b3a8e6");
      var gold = css("--th-gold", "#e3be62");
      var line = css("--th-line", "rgba(154,214,232,.18)");
      var floorY = h * 0.82;

      var floor = ctx.createLinearGradient(0, floorY, 0, h);
      floor.addColorStop(0, "rgba(120,180,200,0.08)");
      floor.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = floor;
      ctx.fillRect(0, floorY, w, h - floorY);

      var glow = ctx.createRadialGradient(wsCenter.x, wsCenter.y, 16, wsCenter.x, wsCenter.y, Math.max(w, h) * 0.34);
      glow.addColorStop(0, local.mode === "experience" ? "rgba(227,190,98,0.11)" : "rgba(179,168,230,0.14)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      MODULES.forEach(function (m) {
        var c = centers[m];
        if (!c) return;
        var on = local.active === m;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(wsCenter.x, wsCenter.y);
        ctx.strokeStyle = on ? gold : line;
        ctx.globalAlpha = on ? 0.8 : 0.22;
        ctx.lineWidth = on ? 1.8 : 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (on) {
          if (!ambient[m]) ambient[m] = T2.particles(6, MODULES.indexOf(m) + 4);
          ambient[m].forEach(function (p) {
            p.t += dt * p.speed * (local.mode === "experience" ? 0.55 : 1);
            if (p.t > 1) p.t -= 1;
            var x = T2.lerp(c.x, wsCenter.x, p.t) + p.jitter * 6 * Math.sin(p.t * 9);
            var y = T2.lerp(c.y, wsCenter.y, p.t) + p.jitter * 6 * Math.cos(p.t * 7);
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = gold;
            ctx.globalAlpha = 0.18 + 0.26 * Math.sin(p.t * Math.PI);
            ctx.fill();
            ctx.globalAlpha = 1;
          });
        }
      });

      for (var i = pulses.length - 1; i >= 0; i--) {
        var p = pulses[i];
        p.t += dt * 1.7;
        var c2 = centers[p.m];
        if (!c2) { pulses.splice(i, 1); continue; }
        var t = clamp(p.t, 0, 1);
        var x2 = T2.lerp(c2.x, wsCenter.x, T2.ease(t));
        var y2 = T2.lerp(c2.y, wsCenter.y, T2.ease(t));
        ctx.beginPath();
        ctx.arc(x2, y2, 4.4, 0, Math.PI * 2);
        ctx.fillStyle = gold;
        ctx.shadowColor = gold;
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
        if (t >= 1 && !p.fired) {
          p.fired = true;
          rings.push({ r: 30, alpha: 0.5 });
        }
        if (t >= 1) pulses.splice(i, 1);
      }

      for (var j = rings.length - 1; j >= 0; j--) {
        var r = rings[j];
        r.r += dt * 130;
        r.alpha -= dt * 0.52;
        if (r.alpha <= 0) { rings.splice(j, 1); continue; }
        ctx.beginPath();
        ctx.arc(wsCenter.x, wsCenter.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = accent;
        ctx.globalAlpha = r.alpha;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      dust.forEach(function (d) {
        d.y -= dt * d.s;
        if (d.y < -0.02) d.y = 1.02;
        ctx.beginPath();
        ctx.arc(d.x * w, d.y * h, d.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(244,231,201,0.8)";
        ctx.globalAlpha = d.a * (0.6 + 0.4 * Math.sin((now * 0.0007) + d.x * 9));
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    }

    function controlsWorkspace(el) {
      el.innerHTML =
        '<div class="th-switchrow" role="tablist" aria-label="' + L("Zugang oder Erleben", "Access or experience") + '">' +
          '<button type="button" class="proto-chip' + (local.mode === "access" ? ' is-on' : '') + '" data-th-mode="access" role="tab" aria-selected="' + (local.mode === "access" ? "true" : "false") + '">' + L("Zugang", "Access") + '</button>' +
          '<button type="button" class="proto-chip' + (local.mode === "experience" ? ' is-on' : '') + '" data-th-mode="experience" role="tab" aria-selected="' + (local.mode === "experience" ? "true" : "false") + '">' + L("Erleben", "Experience") + '</button>' +
        '</div>' +
        '<button type="button" class="proto-btn proto-btn--ghost" data-th-reset>' + L("Reset", "Reset") + '</button>';
      el.querySelectorAll("[data-th-mode]").forEach(function (b) {
        b.addEventListener("click", function () { setMode(b.getAttribute("data-th-mode")); });
      });
      el.querySelector("[data-th-reset]").addEventListener("click", reset);
    }

    return {
      init: initWorkspace,
      hideMetric: true,
      name: function () { return L("Global Workspace", "Global workspace"); },
      about: function () {
        return L(
          "Fünf Module rechnen getrennt. Klick eines an: sein Inhalt erscheint im Workspace. Nur was dort ankommt, ist global verfügbar. Die Bühne selbst ist das Bewusstsein.",
          "Five modules compute separately. Click one: its content enters the workspace. Only what arrives there is globally available. The stage itself is consciousness."
        );
      },
      defaultText: function () {
        return L(
          "Klick ein Modul. Sein Inhalt erscheint im Workspace; die anderen bleiben lokal.",
          "Click a module. Its content enters the workspace; the others stay local."
        );
      },
      metric: function () { return { label: ["Broadcast", "broadcast"], value: local.active ? "1" : "0", ratio: local.active ? 1 : 0 }; },
      controls: controlsWorkspace,
      layout: layout,
      enter: function () { syncText(); layout(); },
      onLang: function () { syncText(); layout(); },
      draw: drawWorkspace
    };
  })();


  var IIT = (function () {
    var local = { feedforward: false, cut: 0, phi: 0, activeEdges: [], pulseStart: 0, dist: [], maxDist: 0 };
    var N = 12;
    var edges = [];
    var stars = [];

    function buildEdges() {
      edges = [];
      for (var i = 0; i < N; i++) edges.push({ a: i, b: (i + 1) % N, recurrent: false, cut: 78 + (i % 4) * 5 });
      for (var j = 0; j < N; j += 2) edges.push({ a: j, b: (j + 3) % N, recurrent: true, cut: 24 + (j % 6) * 4 });
      for (var k = 0; k < N; k += 3) edges.push({ a: k, b: (k + 6) % N, recurrent: true, cut: 40 + (k % 4) * 5 });
      stars = [];
      for (var s = 0; s < 34; s++) {
        stars.push({ x: ((s * 0.37 + 0.08) % 1), y: ((s * 0.61 + 0.12) % 1), r: 0.6 + (s % 3) * 0.4, a: 0.06 + (s % 5) * 0.03 });
      }
    }

    function activeEdges() {
      return edges.filter(function (e) {
        if (local.feedforward && e.b !== (e.a + 1) % N) return false;
        return local.cut < e.cut;
      });
    }

    function recalc() {
      local.activeEdges = activeEdges();
      var adj = [];
      for (var i = 0; i < N; i++) adj.push([]);
      local.activeEdges.forEach(function (e) {
        adj[e.a].push(e.b);
        if (!local.feedforward) adj[e.b].push(e.a);
      });
      var seen = new Array(N).fill(false);
      var largest = 0;
      for (var s = 0; s < N; s++) {
        if (seen[s]) continue;
        var stack = [s], count = 0;
        seen[s] = true;
        while (stack.length) {
          var v = stack.pop();
          count++;
          adj[v].forEach(function (n) { if (!seen[n]) { seen[n] = true; stack.push(n); } });
        }
        if (count > largest) largest = count;
      }
      var recurrentTotal = edges.filter(function (e) { return e.recurrent; }).length || 1;
      var recurrentActive = local.activeEdges.filter(function (e) { return e.recurrent; }).length;
      local.phi = local.feedforward ? 0 : (largest / N) * (0.52 + 0.48 * (recurrentActive / recurrentTotal));
      local.phi = clamp(local.phi, 0, 0.98);
      updateMetric();
    }

    function pulse() {
      recalc();
      var adj = [];
      for (var i = 0; i < N; i++) adj.push([]);
      local.activeEdges.forEach(function (e) {
        adj[e.a].push(e.b);
        if (!local.feedforward) adj[e.b].push(e.a);
      });
      var dist = new Array(N).fill(-1);
      var queue = [0];
      dist[0] = 0;
      while (queue.length) {
        var v = queue.shift();
        adj[v].forEach(function (n) {
          if (dist[n] === -1) { dist[n] = dist[v] + 1; queue.push(n); }
        });
      }
      local.dist = dist;
      local.maxDist = Math.max.apply(null, dist);
      local.pulseStart = performance.now();
      var reached = dist.filter(function (d) { return d >= 0; }).length;
      if (local.feedforward) {
        narrate(L(
          "Der Puls startet an Knoten 1. Im Feedforward-Modus läuft er nur vorwärts: " + reached + " von " + N + " Knoten werden erreicht. Es gibt keine Rückkehr, also keine integrierte Struktur. Phi ist 0.",
          "The pulse starts at node 1. In feedforward mode it only moves forward: " + reached + " of " + N + " nodes are reached. There is no return, so no integrated structure. Phi is 0."
        ));
      } else {
        narrate(L(
          "Der Puls startet an Knoten 1. Rekurrente Kanten führen ihn zurück; " + reached + " von " + N + " Knoten werden erreicht. Die Struktur ist integriert, Phi bleibt hoch.",
          "The pulse starts at node 1. Recurrent edges carry it back; " + reached + " of " + N + " nodes are reached. The structure is integrated, Phi stays high."
        ));
      }
    }

    function setFeedforward(on) {
      local.feedforward = !!on;
      local.pulseStart = 0;
      recalc();
      renderControls();
      narrate(L(
        local.feedforward
          ? "Feedforward: Die Kanten laufen nur vorwärts. Der Puls kann nicht zurückkehren, die Struktur ist nicht integriert. Phi fällt auf 0."
          : "Rekurrent: Die Kanten führen zurück. Der Puls kann zirkulieren, die Struktur ist integriert. Phi steigt.",
        local.feedforward
          ? "Feedforward: the edges only run forward. The pulse cannot return, the structure is not integrated. Phi falls to 0."
          : "Recurrent: the edges lead back. The pulse can circulate, the structure is integrated. Phi rises."
      ));
    }

    function setCut(v) {
      local.cut = parseInt(v, 10) || 0;
      local.pulseStart = 0;
      recalc();
      narrate(L(
        "Schnitt " + local.cut + " %: " + (local.cut >= 70 ? "Der Ring bricht in getrennte Teile. Phi fällt." : local.cut >= 40 ? "Die Querverbindungen fallen weg. Die Struktur verliert Integration." : "Die Struktur ist noch weitgehend verbunden."),
        "Cut " + local.cut + "%: " + (local.cut >= 70 ? "The ring breaks into separate parts. Phi falls." : local.cut >= 40 ? "The cross-links drop away. The structure loses integration." : "The structure is still mostly connected.")
      ));
    }

    function resetIIT() {
      local.feedforward = false;
      local.cut = 0;
      local.pulseStart = 0;
      recalc();
      renderControls();
      narrate(L("Zurückgesetzt: rekurrent, ungeschnitten, Phi hoch.", "Reset: recurrent, uncut, Phi high."));
    }

    function controlsIIT(el) {
      el.innerHTML =
        '<div class="th-switchrow" role="tablist" aria-label="' + L("Vernetzung", "Connectivity") + '">' +
          '<button type="button" class="proto-chip' + (!local.feedforward ? ' is-on' : '') + '" data-iit-mode="recurrent" role="tab" aria-selected="' + (!local.feedforward ? "true" : "false") + '">' + L("Rekurrent", "Recurrent") + '</button>' +
          '<button type="button" class="proto-chip' + (local.feedforward ? ' is-on' : '') + '" data-iit-mode="feedforward" role="tab" aria-selected="' + (local.feedforward ? "true" : "false") + '">' + L("Feedforward", "Feedforward") + '</button>' +
        '</div>' +
        '<label class="t2-range th-range"><span>' + L("Schnitt", "Cut") + '</span><input type="range" id="iit-cut" min="0" max="100" step="1" value="' + local.cut + '"><output>' + local.cut + ' %</output></label>' +
        '<button type="button" class="proto-btn proto-btn--primary" data-iit-pulse>' + L("Puls", "Pulse") + '</button>' +
        '<button type="button" class="proto-btn proto-btn--ghost" data-iit-reset>' + L("Reset", "Reset") + '</button>';
      el.querySelectorAll("[data-iit-mode]").forEach(function (b) {
        b.addEventListener("click", function () { setFeedforward(b.getAttribute("data-iit-mode") === "feedforward"); });
      });
      var cut = el.querySelector("#iit-cut");
      cut.addEventListener("input", function () {
        el.querySelector("#iit-cut + output").textContent = cut.value + " %";
        setCut(cut.value);
      });
      el.querySelector("[data-iit-pulse]").addEventListener("click", pulse);
      el.querySelector("[data-iit-reset]").addEventListener("click", resetIIT);
    }

    function drawIIT(ctx, w, h, dt, now) {
      var accent = css("--th-accent", "#7ec8ef");
      var gold = css("--th-gold", "#e3be62");
      var cx = w / 2, cy = h * 0.47;
      var R = Math.min(w, h) * 0.29;
      stars.forEach(function (s) {
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(220,245,255,0.9)";
        ctx.globalAlpha = s.a;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      ctx.beginPath();
      ctx.arc(cx, cy, R + 26, 0, Math.PI * 2);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.14;
      ctx.setLineDash([2, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      var pos = [];
      for (var i = 0; i < N; i++) {
        var a = -Math.PI / 2 + i * Math.PI * 2 / N;
        pos.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R });
      }
      var phase = local.pulseStart ? (now - local.pulseStart) / 1000 : -1;
      edges.forEach(function (e) {
        var active = local.cut < e.cut && (!local.feedforward || e.b === (e.a + 1) % N);
        var p1 = pos[e.a], p2 = pos[e.b];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = active ? (e.recurrent ? gold : accent) : accent;
        ctx.globalAlpha = active ? (e.recurrent ? 0.42 : 0.3) : 0.06;
        ctx.lineWidth = active ? (e.recurrent ? 1.2 : 1.1) : 0.8;
        if (!active) ctx.setLineDash([2, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        if (local.feedforward && active) {
          var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
          var ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          ctx.beginPath();
          ctx.moveTo(mx + Math.cos(ang) * 5, my + Math.sin(ang) * 5);
          ctx.lineTo(mx + Math.cos(ang + 2.5) * 5, my + Math.sin(ang + 2.5) * 5);
          ctx.lineTo(mx + Math.cos(ang - 2.5) * 5, my + Math.sin(ang - 2.5) * 5);
          ctx.closePath();
          ctx.fillStyle = accent;
          ctx.globalAlpha = 0.7;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });
      pos.forEach(function (p, i) {
        var glow = 0;
        if (phase >= 0 && local.dist[i] >= 0) {
          var start = local.dist[i] * 0.11;
          if (phase > start && phase < start + 0.85) glow = Math.sin((phase - start) / 0.85 * Math.PI);
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 + glow * 4, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? gold : accent;
        ctx.shadowColor = i === 0 ? gold : accent;
        ctx.shadowBlur = 10 + glow * 24;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,.7)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      if (phase > local.maxDist * 0.11 + 1.2) local.pulseStart = 0;
    }

    return {
      init: function () { buildEdges(); recalc(); },
      name: function () { return L("IIT · Phi", "IIT · Phi"); },
      about: function () {
        return L(
          "Bewusstsein ist die geeinte Ursache-Wirkungs-Struktur eines Systems. Phi misst, wie irreduzibel diese Struktur ist. Ein Feedforward-System hat Phi 0, weil keine Rückkopplung eine integrierte Struktur bildet. Ein Schnitt zerlegt das System in Teile, und Phi fällt.",
          "Consciousness is a system's unified cause-effect structure. Phi measures how irreducible that structure is. A feedforward system has Phi 0 because no recurrence forms an integrated structure. A cut splits the system into parts, and Phi falls."
        );
      },
      defaultText: function () {
        return L(
          "Der Ring ist rekurrent. Drücke Puls und sieh, ob er zurückkehrt. Schalte auf Feedforward: Phi fällt auf 0. Ziehe den Schnitt und zerlege die Struktur.",
          "The ring is recurrent. Press Pulse and see whether it returns. Switch to feedforward: Phi falls to 0. Pull the cut and split the structure."
        );
      },
      metric: function () { return { label: ["Phi", "Phi"], value: local.phi.toFixed(2), ratio: local.phi }; },
      controls: controlsIIT,
      enter: function () { recalc(); },
      draw: drawIIT
    };
  })();

  /* =====================================================================
     Predictive processing: prior, evidence, precision, surprise
     ===================================================================== */

  var PREDICTIVE = (function () {
    var STIM = {
      apple: { center: 0.34, label: ["Apfel", "apple"] },
      word: { center: 0.58, label: ["Wort", "word"] },
      pain: { center: 0.8, label: ["Schmerz", "pain"] }
    };
    var local = { precision: 58, stimulus: "apple", priorCenter: 0.5, priorTarget: null, surprise: 0 };
    var noteEl = document.getElementById("th-pred-note");

    function gauss(x, c, s) {
      return Math.exp(-Math.pow(x - c, 2) / (2 * s * s));
    }
    function cosine(a, b) {
      var dot = 0, na = 0, nb = 0;
      for (var i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
      return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
    }
    function calc() {
      var n = 140;
      var input = [], prior = [], percept = [], xs = [];
      var prec = local.precision / 100;
      for (var i = 0; i < n; i++) {
        var x = i / (n - 1);
        xs.push(x);
        var wig = 0.032 * Math.sin(x * 53 + 1.2) + 0.018 * Math.sin(x * 127 + 0.5);
        var inp = gauss(x, STIM[local.stimulus].center, 0.072) + wig;
        var pri = gauss(x, local.priorCenter, 0.1);
        input.push(inp);
        prior.push(pri);
        percept.push(prec * pri + (1 - prec) * inp);
      }
      local.surprise = clamp((1 - cosine(input, percept)) * 100, 0, 100);
      return { xs: xs, input: input, prior: prior, percept: percept };
    }

    function syncPredText() {
      if (!noteEl) return;
      var p = Math.round(local.precision);
      var text = L(
        "Präzision " + p + " %: " + (p > 74 ? "Die Vorhersage dominiert. Das System kann am Eingang vorbeisehen." : p < 26 ? "Der Eingang dominiert. Das System folgt der Evidenz." : "Die Wahrnehmung liegt zwischen Vorhersage und Eingang.") + " Überraschung " + Math.round(local.surprise) + " %.",
        "Precision " + p + "%: " + (p > 74 ? "The prediction dominates. The system can look past the input." : p < 26 ? "The input dominates. The system follows the evidence." : "The percept lies between prediction and input.") + " Surprise " + Math.round(local.surprise) + "%."
      );
      if (noteEl.textContent !== text) noteEl.textContent = text;
    }

    function setPrecision(v) {
      local.precision = parseFloat(v) || 0;
      calc();
      updateMetric();
      syncPredText();
      narrate(L(
        "Präzision " + Math.round(local.precision) + " %: " + (local.precision > 74 ? "Die Vorhersage wiegt schwerer als der Eingang. Bei hoher Präzision wird Wahrnehmung zur kontrollierten Halluzination." : local.precision < 26 ? "Der Eingang wiegt schwerer. Das System korrigiert seine Vorhersage am Signal." : "Vorhersage und Eingang halten sich ungefähr die Waage."),
        "Precision " + Math.round(local.precision) + "%: " + (local.precision > 74 ? "The prediction outweighs the input. At high precision, perception becomes controlled hallucination." : local.precision < 26 ? "The input outweighs the prediction. The system corrects its prediction against the signal." : "Prediction and input are roughly balanced.")
      ));
    }

    function setStimulus(k) {
      local.stimulus = k;
      local.priorTarget = null;
      calc();
      updateMetric();
      syncPredText();
      renderControls();
      narrate(L(
        "Der Eingang wechselt zu " + L(STIM[k].label[0], STIM[k].label[1]) + ". Die Vorhersage bleibt zunächst, wo sie war. Genau daraus entsteht der Fehler.",
        "The input changes to " + L(STIM[k].label[0], STIM[k].label[1]) + ". The prediction stays where it was. That difference is the error."
      ));
    }

    function updateModel() {
      local.priorTarget = STIM[local.stimulus].center;
      narrate(L(
        "Das Modell verschiebt seine Vorhersage in Richtung Eingang. Die Überraschung sinkt, weil Vorhersage und Evidenz näher zusammenrücken.",
        "The model moves its prediction toward the input. Surprise falls because prediction and evidence move closer together."
      ));
    }

    function resetPred() {
      local.precision = 58;
      local.stimulus = "apple";
      local.priorCenter = 0.5;
      local.priorTarget = null;
      calc();
      updateMetric();
      syncPredText();
      renderControls();
      narrate(L("Zurückgesetzt: mittlere Präzision, Vorhersage in der Mitte, Eingang beim Apfel.", "Reset: medium precision, prediction in the middle, input at the apple."));
    }

    function controlsPred(el) {
      el.innerHTML =
        '<div class="th-stimuli" role="group" aria-label="' + L("Eingang wählen", "Choose the input") + '">' +
          Object.keys(STIM).map(function (k) {
            return '<button type="button" class="proto-chip' + (local.stimulus === k ? ' is-on' : '') + '" data-pred-stim="' + k + '">' + L(STIM[k].label[0], STIM[k].label[1]) + '</button>';
          }).join("") +
        '</div>' +
        '<label class="t2-range th-range"><span>' + L("Präzision", "Precision") + '</span><input type="range" id="pred-prec" min="0" max="100" step="1" value="' + local.precision + '"><output>' + Math.round(local.precision) + ' %</output></label>' +
        '<button type="button" class="proto-btn proto-btn--primary" data-pred-update>' + L("Modell aktualisieren", "Update model") + '</button>' +
        '<button type="button" class="proto-btn proto-btn--ghost" data-pred-reset>' + L("Reset", "Reset") + '</button>';
      el.querySelectorAll("[data-pred-stim]").forEach(function (b) {
        b.addEventListener("click", function () { setStimulus(b.getAttribute("data-pred-stim")); });
      });
      var prec = el.querySelector("#pred-prec");
      prec.addEventListener("input", function () {
        el.querySelector("#pred-prec + output").textContent = prec.value + " %";
        setPrecision(prec.value);
      });
      el.querySelector("[data-pred-update]").addEventListener("click", updateModel);
      el.querySelector("[data-pred-reset]").addEventListener("click", resetPred);
    }

    function drawPredictive(ctx, w, h, dt) {
      if (local.priorTarget !== null) {
        var d = local.priorTarget - local.priorCenter;
        if (Math.abs(d) < 0.002) {
          local.priorCenter = local.priorTarget;
          local.priorTarget = null;
        } else {
          local.priorCenter += d * Math.min(1, dt * 1.6);
        }
      }
      var data = calc();
      var accent = css("--th-accent", "#e3be62");
      var sky = color("--sky", "#7fb4e6");
      var gold = color("--gold", "#e3be62");
      var rose = color("--rose", "#e3898c");
      var padX = 42;
      var topY = h * 0.18;
      var baseY = h * 0.8;
      var span = w - padX * 2;
      function X(x) { return padX + x * span; }
      function Y(v) { return baseY - clamp(v, 0, 1.15) / 1.15 * (baseY - topY); }
      ctx.strokeStyle = "rgba(244,231,201,0.09)";
      ctx.lineWidth = 1;
      for (var g = 0; g <= 4; g++) {
        var yy = topY + (baseY - topY) * g / 4;
        ctx.beginPath(); ctx.moveTo(padX * 0.6, yy); ctx.lineTo(w - padX * 0.6, yy); ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(padX * 0.6, baseY + 0.5);
      ctx.lineTo(w - padX * 0.6, baseY + 0.5);
      ctx.strokeStyle = "rgba(244,231,201,0.22)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(X(data.xs[0]), Y(data.input[0]));
      for (var i = 1; i < data.xs.length; i++) ctx.lineTo(X(data.xs[i]), Y(data.input[i]));
      for (var j = data.xs.length - 1; j >= 0; j--) ctx.lineTo(X(data.xs[j]), Y(data.percept[j]));
      ctx.closePath();
      ctx.fillStyle = rose;
      ctx.globalAlpha = 0.13;
      ctx.fill();
      ctx.globalAlpha = 1;
      function curve(values, col, width, alpha, glow) {
        ctx.beginPath();
        for (var k = 0; k < values.length; k++) {
          var x = X(data.xs[k]), y = Y(values[k]);
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = col;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = width;
        if (glow) { ctx.shadowColor = col; ctx.shadowBlur = 16; }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
      curve(data.prior, gold, 1.6, 0.75, true);
      curve(data.input, sky, 1.6, 0.85, true);
      curve(data.percept, "#eef8f0", 2.8, 0.96, true);
      ctx.save();
      ctx.setLineDash([3, 6]);
      ctx.strokeStyle = sky;
      ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.moveTo(X(STIM[local.stimulus].center), topY); ctx.lineTo(X(STIM[local.stimulus].center), baseY); ctx.stroke();
      ctx.strokeStyle = gold;
      ctx.beginPath(); ctx.moveTo(X(local.priorCenter), topY); ctx.lineTo(X(local.priorCenter), baseY); ctx.stroke();
      ctx.restore();
      var maxI = 0;
      for (var m = 1; m < data.percept.length; m++) if (data.percept[m] > data.percept[maxI]) maxI = m;
      ctx.beginPath();
      ctx.arc(X(data.xs[maxI]), Y(data.percept[maxI]), 5, 0, Math.PI * 2);
      ctx.fillStyle = "#eef8f0";
      ctx.shadowColor = "#eef8f0";
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;
      syncPredText();
    }

    return {
      init: function () { calc(); },
      name: function () { return L("Predictive Processing", "Predictive processing"); },
      about: function () {
        return L(
          "Das Gehirn sagt Sinnesdaten voraus und minimiert Überraschung. Wahrnehmung ist kontrollierte Halluzination. Präzision gewichtet die Vorhersage gegen die Evidenz: hoch, und das System hält an seiner Erwartung fest; niedrig, und es folgt dem Eingang. Das Modell aktualisiert die Vorhersage, um den Fehler zu senken.",
          "The brain predicts sensory input and minimises surprise. Perception is controlled hallucination. Precision weights the prediction against the evidence: high, and the system holds on to its expectation; low, and it follows the input. The model updates the prediction to reduce the error."
        );
      },
      defaultText: function () {
        return L(
          "Der Eingang kommt unten an, die Vorhersage oben. Die Wahrnehmung ist die gewichtete Mischung. Ziehe an der Präzision und sieh, ob das System dem Eingang oder seiner Erwartung folgt.",
          "The input arrives below, the prediction above. The percept is the weighted mixture. Pull precision and see whether the system follows the input or its expectation."
        );
      },
      metric: function () { return { label: ["Überraschung", "surprise"], value: Math.round(local.surprise) + " %", ratio: local.surprise / 100 }; },
      controls: controlsPred,
      enter: function () { calc(); syncPredText(); },
      onLang: function () { syncPredText(); },
      draw: drawPredictive
    };
  })();

  /* =====================================================================
     Analytic idealism: one field, dissociated perspectives
     ===================================================================== */

  var IDEALISM = (function () {
    var local = { diss: 70, count: 3, view: "ocean", selected: 0, sense: "eye", freq: 50 };
    var bubbleEls = [];
    var geom = [];
    var stars = [];
    var particles = [];
    var sceneEl = document.querySelector(".th-scene--idealism");
    var host = document.getElementById("th-ideal-bubbles");

    function initIdealism() {
      for (var i = 0; i < 5; i++) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "th-bubble";
        b.setAttribute("data-bubble", String(i));
        b.innerHTML = '<span><b></b><small></small></span>';
        b.addEventListener("click", function (e) {
          selectBubble(parseInt(e.currentTarget.getAttribute("data-bubble"), 10));
        });
        host.appendChild(b);
        bubbleEls.push(b);
      }
      for (var s = 0; s < 64; s++) {
        stars.push({ x: (s * 0.37 + 0.05) % 1, y: (s * 0.67 + 0.09) % 1, r: 0.6 + (s % 3) * 0.5, a: 0.05 + (s % 6) * 0.022 });
      }
      for (var p = 0; p < 230; p++) {
        particles.push({
          x: Math.random(),
          y: Math.random(),
          px: 0,
          py: 0,
          vx: 0,
          vy: 0,
          age: Math.random() * 200
        });
      }
      renderBubbles();
    }

    function viewName() {
      return local.view === "dashboard"
        ? L("Dashboard", "Dashboard")
        : L("Ozean", "Ocean");
    }

    function renderBubbles() {
      host.hidden = local.view !== "ocean";
      local.selected = clamp(local.selected, 0, local.count - 1);
      bubbleEls.forEach(function (b, i) {
        var on = local.view === "ocean" && i < local.count;
        b.hidden = !on;
        b.classList.toggle("is-on", on && i === local.selected);
        if (on) {
          var label = local.count === 1
            ? L("Ein Ozean", "One ocean")
            : L("Strudel " + String.fromCharCode(65 + i), "Vortex " + String.fromCharCode(65 + i));
          b.querySelector("b").textContent = label;
          b.querySelector("small").textContent = local.count === 1
            ? L("nicht dissoziiert", "not dissociated")
            : L("Geist", "mind");
          b.setAttribute("aria-label", label + (local.count > 1 ? L(", ein Strudel im Ozean", ", a vortex in the ocean") : ""));
        }
      });
      layoutIdealism();
    }

    function layoutIdealism() {
      if (state.theory !== "idealism") return;
      var w = world.clientWidth, h = world.clientHeight;
      var cx = w / 2, cy = h * 0.47;
      var min = Math.min(w, h);
      var count = local.count;
      geom = [];
      bubbleEls.forEach(function (b, i) {
        if (i >= count) return;
        var x = cx, y = cy;
        if (count > 1) {
          var angle = -Math.PI / 2 + i * Math.PI * 2 / count;
          var radius = min * (0.075 + (local.diss / 100) * 0.21);
          x = cx + Math.cos(angle) * radius;
          y = cy + Math.sin(angle) * radius;
        }
        b.style.left = x + "px";
        b.style.top = y + "px";
        geom.push({ x: x, y: y, i: i });
      });
    }

    function selectBubble(i) {
      if (i >= local.count) return;
      local.selected = i;
      renderBubbles();
      var label = local.count === 1 ? L("der eine Ozean", "the one ocean") : L("Strudel " + String.fromCharCode(65 + i), "Vortex " + String.fromCharCode(65 + i));
      narrate(L(
        "Du betrachtest " + label + ". Der Strudel besteht aus demselben Wasser wie der Ozean. Von innen wirkt er getrennt; von außen ist er eine lokale Bewegung des einen Feldes.",
        "You are looking at " + label + ". The vortex consists of the same water as the ocean. From inside it seems separate; from outside it is a local movement of the one field."
      ));
    }

    function setDiss(v) {
      local.diss = parseInt(v, 10) || 0;
      renderBubbles();
      updateMetric();
      narrate(L(
        "Dissoziation " + local.diss + " %: " + (local.diss < 12 ? "Der Ozean fließt frei; die Strudel sind kaum abgegrenzt." : local.diss < 55 ? "Die Strudel bilden sich. Das Wasser zwischen ihnen bleibt verbunden." : "Die Strudel sind stark abgegrenzt. Von innen sieht jeder wie ein eigenes Bewusstsein aus."),
        "Dissociation " + local.diss + "%: " + (local.diss < 12 ? "The ocean flows freely; the vortices are barely separated." : local.diss < 55 ? "The vortices form. The water between them stays connected." : "The vortices are strongly separated. From inside, each looks like its own consciousness.")
      ));
    }

    function setCount(v) {
      local.count = clamp(parseInt(v, 10) || 1, 1, 5);
      local.selected = clamp(local.selected, 0, local.count - 1);
      renderBubbles();
      narrate(L(
        local.count === 1
          ? "Ein Strudel: der Ozean bewegt sich an einer Stelle. Ein einzelnes Bewusstsein."
          : local.count + " Strudel: derselbe Ozean bewegt sich an mehreren Stellen. Jeder Strudel ist ein Geist.",
        local.count === 1
          ? "One vortex: the ocean moves in one place. A single consciousness."
          : local.count + " vortices: the same ocean moves in several places. Each vortex is a mind."
      ));
    }

    function setView(view) {
      local.view = view === "dashboard" ? "dashboard" : "ocean";
      sceneEl.classList.toggle("is-dashboard", local.view === "dashboard");
      renderBubbles();
      renderControls();
      updateMetric();
      narrate(L(
        local.view === "dashboard"
          ? "Dashboard: Die Sinne zeigen komprimierte Icons, keine Fenster zur Welt. Dieselbe Frequenz wird je nach Sinnesorgan zu Farbe, Ton, Wärme oder Geruch."
          : "Ozean: Ein Bewusstsein, viele lokale Strudel. Ziehe an der Dissoziation und ändere die Zahl der Geister.",
        local.view === "dashboard"
          ? "Dashboard: the senses show compressed icons, not windows onto the world. The same frequency becomes colour, tone, warmth, or smell depending on the sense organ."
          : "Ocean: one consciousness, many local vortices. Pull dissociation and change the number of minds."
      ));
    }

    function setFreq(v) {
      local.freq = parseInt(v, 10) || 0;
      updateMetric();
      narrate(L(
        "Realitäts-Frequenz " + local.freq + ": Dasselbe Signal erzeugt je nach Sinnesorgan eine andere Qualia. Die Farbe ist ein Icon, nicht die Wellenlänge selbst.",
        "Reality frequency " + local.freq + ": the same signal produces a different quale depending on the sense organ. Colour is an icon, not the wavelength itself."
      ));
    }

    function setSense(k) {
      local.sense = k;
      narrate(L(
        "Sinnesorgan: " + L(senseLabel(k)[0], senseLabel(k)[1]) + ". Die Frequenz bleibt dieselbe; die empfundene Qualia wechselt.",
        "Sense organ: " + L(senseLabel(k)[0], senseLabel(k)[1]) + ". The frequency stays the same; the felt quale changes."
      ));
    }

    function senseLabel(k) {
      return {
        eye: ["Auge", "eye"],
        ear: ["Ohr", "ear"],
        skin: ["Haut", "skin"],
        nose: ["Nase", "nose"]
      }[k] || ["Auge", "eye"];
    }

    function resetIdeal() {
      local.diss = 70;
      local.count = 3;
      local.view = "ocean";
      local.selected = 0;
      local.sense = "eye";
      local.freq = 50;
      sceneEl.classList.remove("is-dashboard");
      renderBubbles();
      renderControls();
      updateMetric();
      narrate(L("Zurückgesetzt: Ozean, drei Strudel, starke Dissoziation.", "Reset: ocean, three vortices, strong dissociation."));
    }

    function controlsIdeal(el) {
      var viewChips =
        '<div class="th-switchrow" role="tablist" aria-label="' + L("Ansicht", "View") + '">' +
          '<button type="button" class="proto-chip' + (local.view === "ocean" ? ' is-on' : '') + '" data-ideal-view="ocean" role="tab" aria-selected="' + (local.view === "ocean" ? "true" : "false") + '">' + L("Ozean", "Ocean") + '</button>' +
          '<button type="button" class="proto-chip' + (local.view === "dashboard" ? ' is-on' : '') + '" data-ideal-view="dashboard" role="tab" aria-selected="' + (local.view === "dashboard" ? "true" : "false") + '">' + L("Dashboard", "Dashboard") + '</button>' +
        '</div>';
      var extra;
      if (local.view === "ocean") {
        extra =
          '<label class="t2-range th-range"><span>' + L("Dissoziation", "Dissociation") + '</span><input type="range" id="ideal-diss" min="0" max="100" step="1" value="' + local.diss + '"><output>' + local.diss + ' %</output></label>' +
          '<label class="t2-range th-range"><span>' + L("Anzahl Strudel", "Vortices") + '</span><input type="range" id="ideal-count" min="1" max="5" step="1" value="' + local.count + '"><output>' + local.count + '</output></label>';
      } else {
        extra =
          '<label class="t2-range th-range"><span>' + L("Realitäts-Frequenz", "Reality frequency") + '</span><input type="range" id="ideal-freq" min="0" max="100" step="1" value="' + local.freq + '"><output>' + local.freq + '</output></label>' +
          '<label class="th-range"><span class="t2-meta">' + L("Sinnesorgan", "Sense organ") + '</span><select id="ideal-sense" class="th-select">' +
            ['eye', 'ear', 'skin', 'nose'].map(function (k) {
              return '<option value="' + k + '"' + (local.sense === k ? ' selected' : '') + '>' + L(senseLabel(k)[0], senseLabel(k)[1]) + '</option>';
            }).join('') +
          '</select></label>';
      }
      el.innerHTML = viewChips + extra + '<button type="button" class="proto-btn proto-btn--ghost" data-ideal-reset>' + L("Reset", "Reset") + '</button>';
      el.querySelectorAll("[data-ideal-view]").forEach(function (b) {
        b.addEventListener("click", function () { setView(b.getAttribute("data-ideal-view")); });
      });
      var diss = el.querySelector("#ideal-diss");
      if (diss) diss.addEventListener("input", function () {
        el.querySelector("#ideal-diss + output").textContent = diss.value + " %";
        setDiss(diss.value);
      });
      var count = el.querySelector("#ideal-count");
      if (count) count.addEventListener("input", function () {
        el.querySelector("#ideal-count + output").textContent = count.value;
        setCount(count.value);
      });
      var freq = el.querySelector("#ideal-freq");
      if (freq) freq.addEventListener("input", function () {
        el.querySelector("#ideal-freq + output").textContent = freq.value;
        setFreq(freq.value);
      });
      var sense = el.querySelector("#ideal-sense");
      if (sense) sense.addEventListener("change", function () { setSense(sense.value); });
      el.querySelector("[data-ideal-reset]").addEventListener("click", resetIdeal);
    }

    function drawIdealism(ctx, w, h, dt, now) {
      if (local.view === "dashboard") drawDashboard(ctx, w, h, dt, now);
      else drawOcean(ctx, w, h, dt, now);
    }

    function drawOcean(ctx, w, h, dt, now) {
      var rose = color("--rose", "#e3898c");
      var lilac = color("--lilac", "#b3a8e6");
      var gold = color("--gold", "#e3be62");
      var bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#0a1024");
      bg.addColorStop(0.55, "#071428");
      bg.addColorStop(1, "#030812");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      stars.forEach(function (s) {
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(235,238,255,0.9)";
        ctx.globalAlpha = s.a;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      var time = now * 0.00045;
      var strength = local.diss / 100;
      var centers = geom.length ? geom : [{ x: w / 2, y: h * 0.47, i: 0 }];
      particles.forEach(function (p) {
        p.px = p.x * w;
        p.py = p.y * h;
        var fx = Math.sin(p.y * 6 + time) * 0.16;
        var fy = Math.cos(p.x * 6 + time) * 0.16;
        centers.forEach(function (a) {
          var dx = p.x * w - a.x, dy = p.y * h - a.y;
          var dist = Math.sqrt(dx * dx + dy * dy) + 8;
          var influence = Math.min(48, 3000 / (dist * dist)) * strength;
          fx += -dy / dist * influence;
          fy += dx / dist * influence;
          fx += -dx / dist * influence * 0.3;
          fy += -dy / dist * influence * 0.3;
        });
        p.vx = p.vx * 0.9 + fx * 0.1;
        p.vy = p.vy * 0.9 + fy * 0.1;
        p.x += p.vx / w;
        p.y += p.vy / h;
        p.age += 1;
        if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1 || p.age > 260) {
          p.x = Math.random();
          p.y = Math.random();
          p.vx = 0;
          p.vy = 0;
          p.age = 0;
        }
        var speed = Math.hypot(p.vx, p.vy);
        var hue = 196 + speed * 18;
        var alpha = Math.min(0.82, speed * 0.28 + 0.16);
        ctx.strokeStyle = "hsla(" + hue + ",72%,68%," + alpha + ")";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x * w, p.y * h);
        ctx.stroke();
      });
      if (centers.length > 1) {
        ctx.strokeStyle = lilac;
        ctx.globalAlpha = (1 - strength) * 0.22;
        ctx.lineWidth = 1;
        for (var i = 0; i < centers.length; i++) {
          var a = centers[i], b = centers[(i + 1) % centers.length];
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(w / 2, h * 0.47, b.x, b.y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      centers.forEach(function (a, i) {
        var pulse = 0.75 + 0.25 * Math.sin(time * 4 + i);
        var r = Math.min(w, h) * (0.05 + strength * 0.1);
        var grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, r * 2.4);
        grad.addColorStop(0, "rgba(227,137,140," + (0.38 * strength * pulse).toFixed(3) + ")");
        grad.addColorStop(0.55, "rgba(179,168,230," + (0.12 * strength).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(a.x, a.y, r * 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(time * 1.6 + i);
        ctx.strokeStyle = rose;
        ctx.globalAlpha = 0.2 + 0.35 * strength;
        ctx.lineWidth = 1.2;
        for (var k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.arc(0, 0, r * (0.55 + k * 0.24), k * 1.1, k * 1.1 + 2.1);
          ctx.stroke();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      });
      ctx.fillStyle = "rgba(244,230,242,0.55)";
      ctx.font = '600 10px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(L("Ozean = Bewusstsein · Strudel = Geister", "Ocean = consciousness · vortices = minds"), 18, 22);
    }

    function drawDashboard(ctx, w, h, dt, now) {
      var rose = color("--rose", "#e3898c");
      var lilac = color("--lilac", "#b3a8e6");
      var sky = color("--sky", "#7fb4e6");
      var gold = color("--gold", "#e3be62");
      var f = local.freq / 100;
      var time = now * 0.001;
      var topH = h * 0.34;
      ctx.fillStyle = "#0a0f22";
      ctx.fillRect(0, 0, w, topH);
      ctx.strokeStyle = lilac;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (var x = 0; x < w; x += 2) {
        var phase = x * 0.02 * (0.5 + f * 2.2) + time * 2.4;
        var y = topH / 2 + Math.sin(phase) * topH * 0.28 * (0.3 + f * 0.7);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = "rgba(179,168,230,0.85)";
      ctx.font = '600 10px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(L("mentale Welt da draußen", "mental world out there"), 16, 18);
      ctx.strokeStyle = gold;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(0, topH);
      ctx.lineTo(w, topH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = gold;
      ctx.textAlign = "center";
      ctx.fillText(L("↓ Sinnesorgan kodiert ↓", "↓ sense organ encodes ↓"), w / 2, topH + 16);
      ctx.textAlign = "left";
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(0, topH + 22, w, h - topH - 22);
      var bcy = topH + 22 + (h - topH - 22) / 2;
      var radius = Math.min(w, h) * 0.16;
      if (local.sense === "eye") {
        var hue = f * 300;
        var grad = ctx.createRadialGradient(w / 2, bcy, 0, w / 2, bcy, radius);
        grad.addColorStop(0, "hsl(" + hue + ",90%,66%)");
        grad.addColorStop(1, "hsl(" + hue + ",90%,20%)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(w / 2, bcy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = '700 14px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(L("FARBE", "COLOUR"), w / 2, bcy + radius + 26);
      } else if (local.sense === "ear") {
        ctx.strokeStyle = sky;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (var ex = 0; ex < w; ex += 2) {
          var yy = bcy + Math.sin(ex * 0.04 * (0.4 + f * 2.6) + time * 6) * radius * 0.55;
          if (ex === 0) ctx.moveTo(ex, yy); else ctx.lineTo(ex, yy);
        }
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = '700 14px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(L("TON", "TONE"), w / 2, bcy + radius + 26);
      } else if (local.sense === "skin") {
        var warm = ctx.createRadialGradient(w / 2, bcy, 0, w / 2, bcy, radius);
        warm.addColorStop(0, "rgba(255,196,120,0.95)");
        warm.addColorStop(1, "rgba(120,40,30,0.2)");
        ctx.fillStyle = warm;
        ctx.beginPath();
        ctx.arc(w / 2, bcy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = '700 14px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(L("WÄRME", "WARMTH"), w / 2, bcy + radius + 26);
      } else {
        for (var n = 0; n < 18; n++) {
          var a = n * 2.39996 + time * 0.5;
          var r = radius * (0.25 + (n % 5) * 0.13);
          ctx.beginPath();
          ctx.arc(w / 2 + Math.cos(a) * r, bcy + Math.sin(a) * r, 3 + (n % 3), 0, Math.PI * 2);
          ctx.fillStyle = "rgba(179,168,230,0.55)";
          ctx.fill();
        }
        ctx.fillStyle = "#fff";
        ctx.font = '700 14px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(L("GERUCH", "SMELL"), w / 2, bcy + radius + 26);
      }
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(244,230,242,0.55)";
      ctx.font = '600 10px "Open Sans", sans-serif';
      ctx.fillText(L("dieselbe Frequenz, verschiedene Qualia", "the same frequency, different qualia"), 16, h - 16);
    }

    return {
      init: initIdealism,
      name: function () { return L("Analytischer Idealismus", "Analytic idealism"); },
      about: function () {
        return L(
          "Bewusstsein ist fundamental; Materie ist die Außenseite mentaler Prozesse. Im Ozean ist jeder Geist ein Strudel aus demselben Wasser: von innen getrennt, von außen eine lokale Bewegung des einen Feldes. Die Dashboard-Ansicht zeigt, dass die Sinne komprimierte Icons liefern, keine Fenster zur Welt.",
          "Consciousness is fundamental; matter is the outside view of mental processes. In the ocean, each mind is a vortex made of the same water: separate from inside, a local movement of the one field from outside. The dashboard view shows that the senses deliver compressed icons, not windows onto the world."
        );
      },
      defaultText: function () {
        return L(
          "Ozean: ein Bewusstsein, viele Strudel. Ziehe an der Dissoziation und ändere die Zahl der Geister. Wechsle zum Dashboard und sieh, wie dieselbe Frequenz zu Farbe, Ton, Wärme oder Geruch wird.",
          "Ocean: one consciousness, many vortices. Pull dissociation and change the number of minds. Switch to the dashboard and see how the same frequency becomes colour, tone, warmth, or smell."
        );
      },
      metric: function () {
        return local.view === "dashboard"
          ? { label: ["Frequenz", "frequency"], value: local.freq + " %", ratio: local.freq / 100 }
          : { label: ["Dissoziation", "dissociation"], value: local.diss + " %", ratio: local.diss / 100 };
      },
      controls: controlsIdeal,
      layout: layoutIdealism,
      enter: function () { renderBubbles(); },
      onLang: function () { renderBubbles(); },
      draw: drawIdealism
    };
  })();


  var MYSTERIAN = (function () {
    var local = { probe: 18, pushing: 0, reach: 100 };
    var stars = [];
    for (var i = 0; i < 54; i++) {
      stars.push({ x: (i * 0.37 + 0.05) % 1, y: (i * 0.31 + 0.04) % 0.55, r: 0.5 + (i % 3) * 0.5, a: 0.05 + (i % 6) * 0.025 });
    }

    function fogX(w) { return w * 0.78; }
    function probeX(w) { return w * 0.12 + (local.probe / 100) * (fogX(w) - w * 0.18); }

    function updateReach(w) {
      local.reach = clamp(((fogX(w) - probeX(w)) / (fogX(w) - w * 0.12)) * 100, 0, 100);
    }

    function setProbe(v) {
      local.probe = clamp(parseInt(v, 10) || 0, 0, 100);
      local.pushing = 0;
      updateReach(world.clientWidth);
      updateMetric();
      narrate(L(
        local.probe < 35
          ? "Das Boot ist weit von der Nebelgrenze entfernt. Die Erklärung wirkt vollständig."
          : local.probe < 72
            ? "Das Boot kommt näher. Der Scheinwerfer verliert Auflösung; die Frage wird größer als die Antwort."
            : "Das Boot liegt an der Nebelgrenze. Der Scheinwerfer wird geschluckt. Dahinter bleibt ein Fragezeichen: keine empirische Grenze, sondern eine kognitive.",
        local.probe < 35
          ? "The boat is far from the fog boundary. The explanation looks complete."
          : local.probe < 72
            ? "The boat gets closer. The searchlight loses resolution; the question grows larger than the answer."
            : "The boat is at the fog boundary. The searchlight is swallowed. Beyond it, a question mark remains: not an empirical limit but a cognitive one."
      ));
    }

    function tryExplain() {
      local.pushing = performance.now();
      narrate(L(
        "Das Boot fährt zur Grenze. Der Scheinwerfer wird feiner, dann dünner, dann undeutlich. Die Nebelwand bleibt.",
        "The boat moves toward the boundary. The searchlight gets finer, then thinner, then indistinct. The fog wall stays."
      ));
    }

    function resetMyst() {
      local.probe = 18;
      local.pushing = 0;
      updateReach(world.clientWidth);
      updateMetric();
      renderControls();
      narrate(L("Zurückgesetzt: das Boot steht wieder weit vor der Nebelgrenze.", "Reset: the boat is far from the fog boundary again."));
    }

    function controlsMyst(el) {
      el.innerHTML =
        '<label class="t2-range th-range"><span>' + L("Nähe zur Grenze", "Proximity to the limit") + '</span><input type="range" id="myst-probe" min="0" max="100" step="1" value="' + local.probe + '"><output>' + local.probe + ' %</output></label>' +
        '<button type="button" class="proto-btn proto-btn--primary" data-myst-try>' + L("Zur Grenze fahren", "Sail to the boundary") + '</button>' +
        '<button type="button" class="proto-btn proto-btn--ghost" data-myst-reset>' + L("Reset", "Reset") + '</button>';
      var slider = el.querySelector("#myst-probe");
      slider.addEventListener("input", function () {
        el.querySelector("#myst-probe + output").textContent = slider.value + " %";
        setProbe(slider.value);
      });
      el.querySelector("[data-myst-try]").addEventListener("click", tryExplain);
      el.querySelector("[data-myst-reset]").addEventListener("click", resetMyst);
    }

    function drawMysterian(ctx, w, h, dt, now) {
      var accent = css("--th-accent", "#9fb0b8");
      var gold = color("--gold", "#e3be62");
      var rose = color("--rose", "#e3898c");
      var sky = color("--sky", "#7fb4e6");
      var horizon = h * 0.64;
      var fx = fogX(w);
      var time = now * 0.001;

      var skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
      skyGrad.addColorStop(0, "#071018");
      skyGrad.addColorStop(1, "#10242c");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, horizon);
      stars.forEach(function (s) {
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(223,231,233,0.85)";
        ctx.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(time * 1.4 + s.x * 12));
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      var sea = ctx.createLinearGradient(0, horizon, 0, h);
      sea.addColorStop(0, "#0d2630");
      sea.addColorStop(1, "#040c10");
      ctx.fillStyle = sea;
      ctx.fillRect(0, horizon, w, h - horizon);

      for (var band = 0; band < 9; band++) {
        var y = horizon + (h - horizon) * (band / 9) * 1.05;
        ctx.beginPath();
        for (var x = 0; x <= w; x += 8) {
          var yy = y + Math.sin(x * 0.012 + time * (0.7 + band * 0.08) + band) * (1.2 + band * 0.5);
          if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.strokeStyle = sky;
        ctx.globalAlpha = 0.05 + band * 0.012;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (local.pushing) {
        local.probe = T2.lerp(local.probe, 94, Math.min(1, dt * 1.5));
        var slider = document.getElementById("myst-probe");
        if (slider) {
          slider.value = String(Math.round(local.probe));
          var out = slider.nextElementSibling;
          if (out) out.textContent = Math.round(local.probe) + " %";
        }
        if ((now - local.pushing) / 1800 >= 1) {
          local.probe = 94;
          local.pushing = 0;
          narrate(L(
            "Die Nebelwand bleibt. Der Scheinwerfer verliert an Auflösung, je näher das Boot kommt. Der Mysterianismus ist keine Erklärung; er behauptet, dass die Erklärung außerhalb unserer kognitiven Reichweite liegt.",
            "The fog wall stays. The searchlight loses resolution as the boat gets closer. Mysterianism is not an explanation; it claims that the explanation lies beyond our cognitive reach."
          ));
        }
      }
      updateReach(w);
      var bx = probeX(w);
      var by = horizon + 10;

      ctx.fillStyle = "rgba(227,137,140,0.10)";
      ctx.beginPath();
      ctx.ellipse(bx, horizon + 7, 42, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(bx, by);
      ctx.fillStyle = "#0a161b";
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-30, 0);
      ctx.quadraticCurveTo(0, 13, 30, 0);
      ctx.lineTo(22, 7);
      ctx.quadraticCurveTo(0, 16, -22, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -34);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(17, -24);
      ctx.lineTo(0, -14);
      ctx.closePath();
      ctx.fillStyle = "rgba(227,190,98,0.2)";
      ctx.fill();
      ctx.strokeStyle = gold;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -40, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = gold;
      ctx.shadowColor = gold;
      ctx.shadowBlur = 22;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      var beamAlpha = clamp(1 - local.probe / 135, 0.12, 0.9);
      var spread = h * 0.12;
      var beam = ctx.createLinearGradient(bx, by - 40, fx, by - 40);
      beam.addColorStop(0, "rgba(227,190,98," + (0.24 * beamAlpha).toFixed(3) + ")");
      beam.addColorStop(0.7, "rgba(227,190,98," + (0.08 * beamAlpha).toFixed(3) + ")");
      beam.addColorStop(1, "rgba(227,190,98,0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(bx, by - 40);
      ctx.lineTo(fx, by - 40 - spread);
      ctx.lineTo(fx, by - 40 + spread);
      ctx.closePath();
      ctx.fill();

      var res = clamp(1 - local.probe / 100 * 0.8, 0.15, 1);
      var steps = Math.max(5, Math.round(34 * res));
      for (var i = 0; i < steps; i++) {
        var t = i / (steps - 1);
        var x = T2.lerp(bx, fx, t);
        var y = by - 40 + (1 - res) * Math.sin(t * 31 + now * 0.009) * 9 * t;
        ctx.beginPath();
        ctx.arc(x, y, 1.7, 0, Math.PI * 2);
        ctx.fillStyle = i === steps - 1 ? rose : gold;
        ctx.globalAlpha = 0.12 + 0.5 * (1 - t * 0.65) * beamAlpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      var fog = ctx.createLinearGradient(fx - 70, 0, fx + 90, 0);
      fog.addColorStop(0, "rgba(159,176,184,0)");
      fog.addColorStop(0.45, "rgba(159,176,184,0.14)");
      fog.addColorStop(1, "rgba(159,176,184,0.3)");
      ctx.fillStyle = fog;
      ctx.fillRect(fx - 70, 0, 160, h);
      for (var f = 0; f < 9; f++) {
        ctx.beginPath();
        ctx.arc(fx - 10 + (f % 3) * 22, horizon - 40 + f * 18 + Math.sin(time + f) * 6, 40 + (f % 4) * 14, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(159,176,184,0.035)";
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(fx, h * 0.12);
      ctx.lineTo(fx, h * 0.9);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      var q = document.querySelector(".th-myst-question");
      if (q) q.style.opacity = String(0.32 + local.probe / 100 * 0.5);
      ctx.fillStyle = "rgba(223,231,233,0.55)";
      ctx.font = '600 10px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(L("Erklärung", "explanation"), bx - 26, by - 58);
    }

    return {
      name: function () { return L("Mysterianismus", "Mysterianism"); },
      about: function () {
        return L(
          "Bewusstsein könnte eine kognitive Grenze sein: Ratten lernen ein Labyrinth, aber keine Gleichungen. Das Boot fährt mit seinem Scheinwerfer bis zur Nebelgrenze; je näher es kommt, desto weniger Auflösung bleibt. Die Grenze ist keine empirische Wand, sondern die Grenze unserer Erklärbarkeit.",
          "Consciousness may be a cognitive limit: rats learn a maze but not equations. The boat sails with its searchlight to the fog boundary; the closer it gets, the less resolution remains. The limit is not an empirical wall but the limit of our explainability."
        );
      },
      defaultText: function () {
        return L(
          "Das Boot fährt zur Nebelgrenze. Der Scheinwerfer verliert Auflösung, die Frage bleibt. Versuche, näher zu kommen, und beobachte, was mit der Erklärung passiert.",
          "The boat moves to the fog boundary. The searchlight loses resolution, the question remains. Try to get closer and watch what happens to the explanation."
        );
      },
      metric: function () { return { label: ["Erreichbarkeit", "reachability"], value: Math.round(local.reach) + " %", ratio: local.reach / 100 }; },
      controls: controlsMyst,
      enter: function () { updateReach(world.clientWidth); updateMetric(); },
      draw: drawMysterian
    };
  })();


  /* =====================================================================
     Shared shell
     ===================================================================== */

  var SCENES = {
    workspace: WORKSPACE,
    iit: IIT,
    predictive: PREDICTIVE,
    idealism: IDEALISM,
    mysterian: MYSTERIAN
  };

  document.querySelectorAll(".th-theory-pills [data-theory]").forEach(function (b) {
    b.addEventListener("click", function () { setTheory(b.getAttribute("data-theory")); });
  });

  var stopResize = T2.onResize(world, function () {
    resizeCanvas();
    if (scene && scene.layout) scene.layout();
  });
  T2.onTheme(function () {
    resizeCanvas();
    if (scene && scene.layout) scene.layout();
  });
  T2.onLang(function () {
    renderTheoryChrome();
    renderControls();
    if (scene && scene.onLang) scene.onLang();
    updateMetric();
    narrate(scene.defaultText());
  });

  Object.keys(SCENES).forEach(function (k) { if (SCENES[k].init) SCENES[k].init(); });

  var loop = T2.loop(function (now) {
    if (!box) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    box.ctx.clearRect(0, 0, box.w, box.h);
    if (scene && scene.draw) scene.draw(box.ctx, box.w, box.h, dt, now);
    if (++metricTick % 8 === 0) updateMetric();
  });

  resizeCanvas();
  setTheory("workspace");
  loop.start();
  window.addEventListener("beforeunload", function () { loop.stop(); stopResize(); });
})();
