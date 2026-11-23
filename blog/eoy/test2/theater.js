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
    renderTheoryChrome();
    renderControls();
    resizeCanvas();
    if (scene.layout) scene.layout();
    if (scene.enter) scene.enter();
    updateMetric();
    narrate(scene.defaultText());
  }

  /* =====================================================================
     Global Workspace: competition, broadcast, empty auditorium
     ===================================================================== */

  var WORKSPACE = (function () {
    var MODULES = ["vision", "language", "memory", "emotion", "motor"];
    var STIMULI = {
      apple: {
        label: ["Roter Apfel", "red apple"],
        glyph: "●",
        boosts: { vision: 0.72, emotion: 0.38, memory: 0.16 },
        reports: {
          vision: ["ein roter Apfel", "a red apple"],
          emotion: ["angenehm", "pleasant"],
          memory: ["Erinnerung an Obst", "a memory of fruit"],
          language: ["„Apfel“", "“apple”"],
          motor: ["greifen", "reach"]
        }
      },
      word: {
        label: ["Das Wort", "the word"],
        glyph: "A",
        boosts: { language: 0.75, memory: 0.46, vision: 0.1 },
        reports: {
          language: ["das Wort „Apfel“", "the word “apple”"],
          memory: ["Bedeutung von „Apfel“", "the meaning of “apple”"],
          vision: ["ein Schriftbild", "a written shape"],
          emotion: ["neutral", "neutral"],
          motor: ["nichts tun", "do nothing"]
        }
      },
      pain: {
        label: ["Schmerz", "pain"],
        glyph: "!",
        boosts: { emotion: 0.8, motor: 0.62, vision: 0.18 },
        reports: {
          emotion: ["Alarm", "alarm"],
          motor: ["wegziehen", "pull away"],
          vision: ["eine Gefahr", "a danger"],
          language: ["„au!“", "“ow!”"],
          memory: ["früherer Schmerz", "earlier pain"]
        }
      }
    };
    var local = {
      mode: "access",
      stimulus: "apple",
      live: { vision: true, language: true, memory: true, emotion: true, motor: true },
      sal: { vision: 0.2, language: 0.2, memory: 0.2, emotion: 0.2, motor: 0.2 },
      broadcasted: false,
      winner: "vision"
    };
    var moduleEls = {}, cutEls = {}, centers = {}, wsCenter = { x: 0, y: 0 };
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
        moduleEls[m].addEventListener("click", function () { boost(m); });
        var cut = document.createElement("button");
        cut.type = "button";
        cut.className = "th-cut";
        cut.setAttribute("data-cut", m);
        cut.setAttribute("aria-pressed", "false");
        cut.addEventListener("click", function (e) {
          e.stopPropagation();
          toggleCut(m);
        });
        sceneEl.appendChild(cut);
        cutEls[m] = cut;
      });
      for (var i = 0; i < 26; i++) {
        dust.push({ x: (i * 0.37 + 0.11) % 1, y: (i * 0.73 + 0.07) % 1, s: 0.004 + (i % 5) * 0.002, size: 0.7 + (i % 4) * 0.5, a: 0.08 + (i % 6) * 0.02 });
      }
      applyStimulus("apple", true);
    }

    function baseSalience() {
      var base = { vision: 0.18, language: 0.18, memory: 0.18, emotion: 0.18, motor: 0.18 };
      var s = STIMULI[local.stimulus];
      Object.keys(s.boosts).forEach(function (m) { base[m] += s.boosts[m]; });
      return base;
    }

    function winnerNow() {
      var best = null, bestV = -1;
      MODULES.forEach(function (m) {
        if (!local.live[m]) return;
        var v = local.sal[m] || 0;
        if (v > bestV) { bestV = v; best = m; }
      });
      return best;
    }

    function updateSalBars() {
      MODULES.forEach(function (m) {
        var bar = moduleEls[m].querySelector(".th-sal i");
        if (bar) bar.style.width = Math.round(clamp(local.live[m] ? local.sal[m] : 0, 0, 1) * 100) + "%";
      });
      MODULES.forEach(function (m) {
        moduleEls[m].classList.toggle("is-on", local.broadcasted && local.winner === m);
      });
    }

    function applyStimulus(name, silent) {
      if (!STIMULI[name]) return;
      local.stimulus = name;
      local.sal = baseSalience();
      local.broadcasted = false;
      local.winner = winnerNow() || "vision";
      updateSalBars();
      syncText();
      updateMetric();
      if (!silent) {
        narrate(L(
          "Reiz: " + L(STIMULI[name].label[0], STIMULI[name].label[1]) + ". Die beteiligten Module steigen in der Salienz. Drücke Broadcast, damit der Gewinner in den Workspace kommt.",
          "Stimulus: " + L(STIMULI[name].label[0], STIMULI[name].label[1]) + ". The involved modules rise in salience. Press Broadcast so the winner enters the workspace."
        ));
      }
      renderControls();
    }

    function boost(m) {
      if (!local.live[m]) {
        narrate(L(moduleName(m) + " ist gekappt und kann nicht konkurrieren.", moduleName(m) + " is cut and cannot compete."));
        return;
      }
      local.sal[m] = clamp((local.sal[m] || 0) + 0.16, 0, 1);
      local.winner = winnerNow() || local.winner;
      updateSalBars();
      updateMetric();
      narrate(L(
        moduleName(m) + " erhöht seine Salienz auf " + Math.round(local.sal[m] * 100) + " %. Der Wettbewerb entscheidet, was in den Workspace kommt.",
        moduleName(m) + " raises its salience to " + Math.round(local.sal[m] * 100) + "%. The competition decides what enters the workspace."
      ));
    }

    function toggleCut(m) {
      local.live[m] = !local.live[m];
      moduleEls[m].classList.toggle("is-cut", !local.live[m]);
      cutEls[m].setAttribute("aria-pressed", local.live[m] ? "false" : "true");
      if (!local.live[m]) local.sal[m] = 0;
      else local.sal[m] = Math.max(local.sal[m], baseSalience()[m]);
      local.winner = winnerNow();
      if (!local.winner) {
        local.broadcasted = false;
        local.winner = "vision";
      }
      updateSalBars();
      syncText();
      updateMetric();
      narrate(L(
        local.live[m]
          ? "Die Leitung zu " + moduleName(m) + " ist wieder offen."
          : "Die Leitung zu " + moduleName(m) + " ist gekappt. Sein Inhalt erreicht den Workspace nicht mehr.",
        local.live[m]
          ? "The line to " + moduleName(m) + " is open again."
          : "The line to " + moduleName(m) + " is cut. Its content no longer reaches the workspace."
      ));
    }

    function broadcast() {
      var w = winnerNow();
      if (!w) {
        narrate(L("Keine Leitung ist offen. Der Workspace bleibt dunkel.", "No line is open. The workspace stays dark."));
        syncText();
        return;
      }
      local.winner = w;
      local.broadcasted = true;
      pulses.push({ m: w, t: 0, fired: false });
      rings.push({ r: 26, alpha: 0.55 });
      updateSalBars();
      syncText();
      updateMetric();
      var s = STIMULI[local.stimulus];
      var report = L(s.reports[w][0], s.reports[w][1]);
      if (local.mode === "experience") {
        narrate(L(
          moduleName(w) + " gewinnt und meldet: " + report + ". Der Bericht ist da. Ob er sich von innen wie etwas anfühlt, zeigt diese Bühne nicht.",
          moduleName(w) + " wins and reports: " + report + ". The report is there. Whether it feels like anything from the inside is not shown by this stage."
        ));
      } else {
        narrate(L(
          moduleName(w) + " gewinnt und broadcastet: " + report + ". Nur dieses Ergebnis ist global verfügbar. Die anderen Module rechnen weiter, aber ihr Inhalt bleibt lokal.",
          moduleName(w) + " wins and broadcasts: " + report + ". Only this result is globally available. The other modules keep computing, but their content stays local."
        ));
      }
    }

    function setMode(mode) {
      local.mode = mode === "experience" ? "experience" : "access";
      world.setAttribute("data-mode", local.mode);
      syncText();
      updateMetric();
      renderControls();
      narrate(L(
        local.mode === "experience"
          ? "Erleben: Der Bericht ist messbar, die gefühlte Qualität nicht. Die Bühne zeigt den Zugang; das Erleben bleibt offen."
          : "Zugang: Information ist für Bericht, Kontrolle und Schlussfolgerungen verfügbar. Klicke einen Reiz, erhöhe Salienz und starte den Broadcast.",
        local.mode === "experience"
          ? "Experience: the report is measurable, the felt quality is not. The stage shows access; experience remains open."
          : "Access: information is available for report, control, and inference. Choose a stimulus, raise salience, and start the broadcast."
      ));
    }

    function reset() {
      MODULES.forEach(function (m) {
        local.live[m] = true;
        local.sal[m] = baseSalience()[m];
        moduleEls[m].classList.remove("is-cut");
        cutEls[m].setAttribute("aria-pressed", "false");
      });
      local.mode = "access";
      local.broadcasted = false;
      local.winner = winnerNow() || "vision";
      pulses = [];
      rings = [];
      world.setAttribute("data-mode", "access");
      updateSalBars();
      syncText();
      updateMetric();
      renderControls();
      narrate(L(
        "Zurückgesetzt. Fünf Module konkurrieren; der Workspace ist bereit.",
        "Reset. Five modules compete; the workspace is ready."
      ));
    }

    function syncText() {
      var t = local.broadcasted ? L("Broadcast", "Broadcast") : L("Global Workspace", "Global workspace");
      kickerEl.textContent = t + (local.mode === "experience" ? L(" · Erleben", " · experience") : L(" · Zugang", " · access"));
      noteEl.textContent = local.mode === "experience"
        ? L("der Bericht ist da, das Erleben bleibt offen", "the report is there, experience remains open")
        : L("die Bühne ist das Bewusstsein", "the stage is consciousness");
      if (local.broadcasted && winnerNow()) {
        var s = STIMULI[local.stimulus];
        var w = local.winner;
        reportEl.textContent = moduleName(w) + ": " + L(s.reports[w][0], s.reports[w][1]);
        reportEl.classList.add("is-on");
        wsEl.classList.add("is-live");
        coreEl.textContent = local.mode === "experience" ? "?" : s.glyph;
      } else {
        reportEl.textContent = "";
        reportEl.classList.remove("is-on");
        wsEl.classList.remove("is-live");
        coreEl.textContent = winnerNow() ? "●" : "—";
      }
      updateCutLabels();
    }

    function updateCutLabels() {
      MODULES.forEach(function (m) {
        var b = cutEls[m];
        if (!b) return;
        b.setAttribute("aria-label", (local.live[m] ? L("Verbindung kappen: ", "Cut connection: ") : L("Verbindung öffnen: ", "Open connection: ")) + moduleName(m));
        b.title = b.getAttribute("aria-label");
      });
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
      MODULES.forEach(function (m) {
        var b = cutEls[m];
        if (!b || !centers[m]) return;
        b.style.left = ((centers[m].x + wsCenter.x) / 2 - 10) + "px";
        b.style.top = ((centers[m].y + wsCenter.y) / 2 - 10) + "px";
      });
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
        if (local.live[m]) {
          var win = local.broadcasted && local.winner === m;
          ctx.beginPath();
          ctx.moveTo(c.x, c.y);
          ctx.lineTo(wsCenter.x, wsCenter.y);
          ctx.strokeStyle = win ? gold : line;
          ctx.globalAlpha = win ? 0.75 : 0.5;
          ctx.lineWidth = win ? 1.8 : 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
          if (!ambient[m]) ambient[m] = T2.particles(5, MODULES.indexOf(m) + 4);
          ambient[m].forEach(function (p) {
            p.t += dt * p.speed * (local.mode === "experience" ? 0.55 : 1);
            if (p.t > 1) p.t -= 1;
            var x = T2.lerp(c.x, wsCenter.x, p.t) + p.jitter * 6 * Math.sin(p.t * 9);
            var y = T2.lerp(c.y, wsCenter.y, p.t) + p.jitter * 6 * Math.cos(p.t * 7);
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = win ? gold : accent;
            ctx.globalAlpha = 0.18 + 0.26 * Math.sin(p.t * Math.PI);
            ctx.fill();
            ctx.globalAlpha = 1;
          });
        } else {
          ctx.beginPath();
          ctx.moveTo(c.x, c.y);
          ctx.lineTo(wsCenter.x, wsCenter.y);
          ctx.strokeStyle = line;
          ctx.globalAlpha = 0.12;
          ctx.setLineDash([3, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
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
        '<div class="th-stimuli" role="group" aria-label="' + L("Reiz wählen", "Choose a stimulus") + '">' +
          Object.keys(STIMULI).map(function (k) {
            return '<button type="button" class="proto-chip' + (local.stimulus === k ? ' is-on' : '') + '" data-stim="' + k + '">' + L(STIMULI[k].label[0], STIMULI[k].label[1]) + '</button>';
          }).join("") +
        '</div>' +
        '<button type="button" class="proto-btn proto-btn--primary" data-th-broadcast>' + L("Broadcast", "Broadcast") + '</button>' +
        '<button type="button" class="proto-btn proto-btn--ghost" data-th-reset>' + L("Reset", "Reset") + '</button>' +
        '<span class="t2-sep" aria-hidden="true"></span>' +
        '<div class="th-switchrow" role="tablist" aria-label="' + L("Zugang oder Erleben", "Access or experience") + '">' +
          '<button type="button" class="proto-chip' + (local.mode === "access" ? ' is-on' : '') + '" data-th-mode="access" role="tab" aria-selected="' + (local.mode === "access" ? "true" : "false") + '">' + L("Zugang", "Access") + '</button>' +
          '<button type="button" class="proto-chip' + (local.mode === "experience" ? ' is-on' : '') + '" data-th-mode="experience" role="tab" aria-selected="' + (local.mode === "experience" ? "true" : "false") + '">' + L("Erleben", "Experience") + '</button>' +
        '</div>';
      el.querySelectorAll("[data-stim]").forEach(function (b) {
        b.addEventListener("click", function () { applyStimulus(b.getAttribute("data-stim")); });
      });
      el.querySelector("[data-th-broadcast]").addEventListener("click", broadcast);
      el.querySelector("[data-th-reset]").addEventListener("click", reset);
      el.querySelectorAll("[data-th-mode]").forEach(function (b) {
        b.addEventListener("click", function () { setMode(b.getAttribute("data-th-mode")); });
      });
    }

    return {
      init: init,
      name: function () { return L("Global Workspace", "Global workspace"); },
      about: function () {
        return L(
          "Viele Subsysteme rechnen getrennt. Nur der Gewinner des Wettbewerbs kommt in den globalen Arbeitsraum, und nur was dort ankommt, steht für Bericht, Kontrolle und Schlussfolgerungen bereit. Der Raum zeigt das Ergebnis, nicht den Weg. Die Bühne selbst ist das Bewusstsein.",
          "Many subsystems compute separately. Only the winner of the competition enters the global workspace, and only what arrives there is available for report, control, and inference. The workspace shows the result, not the path. The stage itself is consciousness."
        );
      },
      defaultText: function () {
        return L(
          "Wähle einen Reiz. Die Module konkurrieren um Salienz; der Gewinner broadcastet in den Workspace. Nur dieses Ergebnis ist global verfügbar.",
          "Choose a stimulus. The modules compete for salience; the winner broadcasts into the workspace. Only that result is globally available."
        );
      },
      metric: function () {
        var w = winnerNow();
        var v = w ? local.sal[w] : 0;
        return { label: ["Salienz", "salience"], value: v.toFixed(2), ratio: v };
      },
      controls: controlsWorkspace,
      layout: layout,
      enter: function () { syncText(); layout(); },
      onLang: function () { syncText(); layout(); },
      draw: drawWorkspace
    };
  })();

  /* =====================================================================
     IIT: recurrent crystal, Phi, feedforward collapse, cut
     ===================================================================== */

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

    function syncText() {
      if (!noteEl) return;
      var p = Math.round(local.precision);
      noteEl.textContent = L(
        "Präzision " + p + " %: " + (p > 74 ? "Die Vorhersage dominiert. Das System kann am Eingang vorbeisehen." : p < 26 ? "Der Eingang dominiert. Das System folgt der Evidenz." : "Die Wahrnehmung liegt zwischen Vorhersage und Eingang.") + " Überraschung " + Math.round(local.surprise) + " %.",
        "Precision " + p + "%: " + (p > 74 ? "The prediction dominates. The system can look past the input." : p < 26 ? "The input dominates. The system follows the evidence." : "The percept lies between prediction and input.") + " Surprise " + Math.round(local.surprise) + "%."
      );
    }

    function setPrecision(v) {
      local.precision = parseFloat(v) || 0;
      calc();
      updateMetric();
      syncText();
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
      syncText();
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
      syncText();
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
      syncText();
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
      enter: function () { calc(); syncText(); },
      onLang: function () { syncText(); },
      draw: drawPredictive
    };
  })();

  /* =====================================================================
     Analytic idealism: one field, dissociated perspectives
     ===================================================================== */

  var IDEALISM = (function () {
    var local = { diss: 18, view: "inside", selected: 0, count: 2 };
    var bubbleEls = [];
    var geom = [];
    var stars = [];
    var host = document.getElementById("th-ideal-bubbles");

    function countFor(v) { return 1 + Math.round((v / 100) * 4); }

    function init() {
      for (var i = 0; i < 5; i++) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "th-bubble";
        b.setAttribute("data-bubble", String(i));
        b.innerHTML = '<span><b></b><small></small></span>';
        b.addEventListener("click", function (e) {
          var idx = parseInt(e.currentTarget.getAttribute("data-bubble"), 10);
          selectBubble(idx);
        });
        host.appendChild(b);
        bubbleEls.push(b);
      }
      for (var s = 0; s < 46; s++) {
        stars.push({ x: (s * 0.37 + 0.05) % 1, y: (s * 0.67 + 0.09) % 1, r: 0.6 + (s % 3) * 0.5, a: 0.06 + (s % 6) * 0.025 });
      }
      renderBubbles();
    }

    function renderBubbles() {
      local.count = countFor(local.diss);
      local.selected = clamp(local.selected, 0, local.count - 1);
      bubbleEls.forEach(function (b, i) {
        var on = i < local.count;
        b.hidden = !on;
        b.classList.toggle("is-on", on && i === local.selected);
        if (on) {
          var label = local.count === 1
            ? L("Ein Feld", "One field")
            : L("Geist " + String.fromCharCode(65 + i), "Mind " + String.fromCharCode(65 + i));
          b.querySelector("b").textContent = label;
          b.querySelector("small").textContent = local.count === 1
            ? L("nicht dissoziiert", "not dissociated")
            : L("Perspektive", "perspective");
          b.setAttribute("aria-label", label + (local.count === 1 ? "" : L(", Perspektive", ", perspective")));
        }
      });
      layout();
    }

    function layout() {
      if (state.theory !== "idealism") return;
      var w = world.clientWidth, h = world.clientHeight;
      var cx = w / 2, cy = h * 0.46;
      var min = Math.min(w, h);
      var count = local.count;
      geom = [];
      bubbleEls.forEach(function (b, i) {
        if (i >= count) return;
        var x = cx, y = cy;
        if (count > 1) {
          var angle = -Math.PI / 2 + i * Math.PI * 2 / count;
          var radius = min * (0.14 + (local.diss / 100) * 0.17);
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
      var label = local.count === 1 ? L("das eine Feld", "the one field") : L("Geist " + String.fromCharCode(65 + i), "Mind " + String.fromCharCode(65 + i));
      narrate(L(
        "Du betrachtest " + label + ". Jede Perspektive sieht einen Ausschnitt des Feldes; die Trennung ist eine Dissoziation, keine getrennte Substanz.",
        "You are looking at " + label + ". Each perspective sees a slice of the field; the separation is a dissociation, not a separate substance."
      ));
    }

    function setDiss(v) {
      local.diss = parseInt(v, 10) || 0;
      local.count = countFor(local.diss);
      local.selected = clamp(local.selected, 0, local.count - 1);
      renderBubbles();
      updateMetric();
      narrate(L(
        "Dissoziation " + local.diss + " %: " + (local.diss < 10 ? "Ein Feld. Die Perspektiven sind noch nicht getrennt." : local.diss < 55 ? "Das Feld beginnt, sich in Perspektiven zu teilen. Die Fäden bleiben sichtbar." : "Das Feld ist in mehrere Geister dissoziiert. Die Fäden reißen, das Feld bleibt der Grund."),
        "Dissociation " + local.diss + "%: " + (local.diss < 10 ? "One field. The perspectives are not yet separated." : local.diss < 55 ? "The field begins to split into perspectives. The filaments remain visible." : "The field is dissociated into several minds. The filaments tear, the field remains the ground.")
      ));
    }

    function setView(view) {
      local.view = view === "outside" ? "outside" : "inside";
      renderControls();
      narrate(L(
        local.view === "outside"
          ? "Von außen: ein Netzwerk aus Knoten und Kanten. Das ist die Beschreibung eines Gehirns, nicht die Innenansicht."
          : "Von innen: ein Feld aus Licht und Fäden. Das ist die Perspektive des Erlebens, nicht die Messung von außen.",
        local.view === "outside"
          ? "From outside: a network of nodes and edges. That is the description of a brain, not the inside view."
          : "From inside: a field of light and filaments. That is the perspective of experience, not the measurement from outside."
      ));
    }

    function resetIdeal() {
      local.diss = 18;
      local.view = "inside";
      local.selected = 0;
      renderBubbles();
      renderControls();
      updateMetric();
      narrate(L("Zurückgesetzt: ein Feld, zwei Perspektiven, Innenansicht.", "Reset: one field, two perspectives, inside view."));
    }

    function controlsIdeal(el) {
      el.innerHTML =
        '<div class="th-switchrow" role="tablist" aria-label="' + L("Perspektive", "Perspective") + '">' +
          '<button type="button" class="proto-chip' + (local.view === "inside" ? ' is-on' : '') + '" data-ideal-view="inside" role="tab" aria-selected="' + (local.view === "inside" ? "true" : "false") + '">' + L("Von innen", "From inside") + '</button>' +
          '<button type="button" class="proto-chip' + (local.view === "outside" ? ' is-on' : '') + '" data-ideal-view="outside" role="tab" aria-selected="' + (local.view === "outside" ? "true" : "false") + '">' + L("Von außen", "From outside") + '</button>' +
        '</div>' +
        '<label class="t2-range th-range"><span>' + L("Dissoziation", "Dissociation") + '</span><input type="range" id="ideal-diss" min="0" max="100" step="1" value="' + local.diss + '"><output>' + local.diss + ' %</output></label>' +
        '<button type="button" class="proto-btn proto-btn--ghost" data-ideal-reset>' + L("Reset", "Reset") + '</button>';
      el.querySelectorAll("[data-ideal-view]").forEach(function (b) {
        b.addEventListener("click", function () { setView(b.getAttribute("data-ideal-view")); });
      });
      var slider = el.querySelector("#ideal-diss");
      slider.addEventListener("input", function () {
        el.querySelector("#ideal-diss + output").textContent = slider.value + " %";
        setDiss(slider.value);
      });
      el.querySelector("[data-ideal-reset]").addEventListener("click", resetIdeal);
    }

    function drawIdealism(ctx, w, h, dt, now) {
      var rose = color("--rose", "#e3898c");
      var lilac = color("--lilac", "#b3a8e6");
      var sky = color("--sky", "#7fb4e6");
      var cx = w / 2, cy = h * 0.46;
      var min = Math.min(w, h);
      stars.forEach(function (s) {
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,235,245,0.9)";
        ctx.globalAlpha = s.a;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      if (local.view === "inside") {
        var field = ctx.createRadialGradient(cx, cy, 8, cx, cy, min * 0.52);
        field.addColorStop(0, "rgba(227,137,140,0.24)");
        field.addColorStop(0.45, "rgba(179,168,230,0.12)");
        field.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = field;
        ctx.fillRect(0, 0, w, h);
        for (var r = 1; r <= 3; r++) {
          ctx.beginPath();
          ctx.arc(cx, cy, min * (0.1 + r * 0.055), 0, Math.PI * 2);
          ctx.strokeStyle = r === 1 ? rose : lilac;
          ctx.globalAlpha = 0.08 + 0.03 * (3 - r);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        geom.forEach(function (g) {
          var mx = (cx + g.x) / 2 + (g.y - cy) * 0.18;
          var my = (cy + g.y) / 2 - (g.x - cx) * 0.18;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.quadraticCurveTo(mx, my, g.x, g.y);
          ctx.strokeStyle = g.i === local.selected ? rose : lilac;
          ctx.globalAlpha = (1 - local.diss / 130) * (g.i === local.selected ? 0.5 : 0.22);
          ctx.lineWidth = g.i === local.selected ? 1.6 : 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
          var t = (now * 0.00012 + g.i * 0.17) % 1;
          var px = (1 - t) * (1 - t) * cx + 2 * (1 - t) * t * mx + t * t * g.x;
          var py = (1 - t) * (1 - t) * cy + 2 * (1 - t) * t * my + t * t * g.y;
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = rose;
          ctx.globalAlpha = 0.5;
          ctx.fill();
          ctx.globalAlpha = 1;
        });
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fillStyle = rose;
        ctx.shadowColor = rose;
        ctx.shadowBlur = 28;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        var nodes = [];
        for (var i = 0; i < 20; i++) {
          var a = i * 2.39996;
          var rr = min * (0.08 + (i % 5) * 0.035);
          nodes.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * 0.72 });
        }
        for (var m = 0; m < nodes.length; m++) {
          for (var n = m + 1; n < nodes.length; n++) {
            var dx = nodes[m].x - nodes[n].x, dy = nodes[m].y - nodes[n].y;
            if (Math.hypot(dx, dy) > min * 0.18) continue;
            ctx.beginPath();
            ctx.moveTo(nodes[m].x, nodes[m].y);
            ctx.lineTo(nodes[n].x, nodes[n].y);
            ctx.strokeStyle = sky;
            ctx.globalAlpha = 0.14;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
        nodes.forEach(function (p, i) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, i === 0 ? 4 : 2.6, 0, Math.PI * 2);
          ctx.fillStyle = i === 0 ? rose : sky;
          ctx.globalAlpha = 0.8;
          ctx.fill();
          ctx.globalAlpha = 1;
        });
        geom.forEach(function (g) {
          ctx.beginPath();
          ctx.setLineDash([3, 5]);
          ctx.moveTo(cx, cy);
          ctx.lineTo(g.x, g.y);
          ctx.strokeStyle = sky;
          ctx.globalAlpha = 0.14;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        });
      }
    }

    return {
      init: init,
      name: function () { return L("Analytischer Idealismus", "Analytic idealism"); },
      about: function () {
        return L(
          "Bewusstsein ist fundamental; Materie ist die Außenseite mentaler Prozesse. Individuelle Geister sind dissoziierte Teile eines universalen Bewusstseins. Von außen sieht das wie ein Netzwerk aus, von innen wie ein Feld. Die Perspektiven sind Ausschnitte, nicht getrennte Substanzen.",
          "Consciousness is fundamental; matter is the outside view of mental processes. Individual minds are dissociated parts of a universal consciousness. From outside it looks like a network, from inside like a field. The perspectives are slices, not separate substances."
        );
      },
      defaultText: function () {
        return L(
          "Ein Feld, viele Perspektiven. Ziehe an der Dissoziation, um das Feld in einzelne Geister zu teilen. Wechsle zwischen der Außenansicht und der Innenansicht.",
          "One field, many perspectives. Pull dissociation to split the field into individual minds. Switch between the outside view and the inside view."
        );
      },
      metric: function () { return { label: ["Dissoziation", "dissociation"], value: local.diss + " %", ratio: local.diss / 100 }; },
      controls: controlsIdeal,
      layout: layout,
      enter: function () { renderBubbles(); },
      onLang: function () { renderBubbles(); },
      draw: drawIdealism
    };
  })();

  /* =====================================================================
     Mysterianism: the cognitive horizon
     ===================================================================== */

  var MYSTERIAN = (function () {
    var local = { probe: 16, pushing: 0, reach: 100 };
    var maze = [];
    for (var i = 0; i < 48; i++) {
      maze.push({ x: ((i * 0.37 + 0.05) % 1), y: ((i * 0.61 + 0.08) % 1), len: 0.04 + (i % 5) * 0.025, horiz: i % 2 === 0 });
    }

    function wallX(w) { return w * 0.79; }
    function probeX(w) { return w * 0.11 + (local.probe / 100) * (wallX(w) - w * 0.13); }

    function updateReach(w) {
      local.reach = clamp(((wallX(w) - probeX(w)) / (wallX(w) - w * 0.11)) * 100, 0, 100);
    }

    function setProbe(v) {
      local.probe = parseInt(v, 10) || 0;
      local.pushing = 0;
      updateMetric();
      narrate(L(
        local.probe < 30
          ? "Der Strahl ist weit von der Wand entfernt. Die Erklärung wirkt vollständig."
          : local.probe < 70
            ? "Der Strahl kommt näher. Die Auflösung sinkt; die Frage wird größer als die Antwort."
            : "Der Strahl erreicht die Wand. Dahinter bleibt ein Fragezeichen. Die Wand ist keine empirische Grenze, sondern eine kognitive.",
        local.probe < 30
          ? "The beam is far from the wall. The explanation looks complete."
          : local.probe < 70
            ? "The beam gets closer. Resolution drops; the question grows larger than the answer."
            : "The beam reaches the wall. Beyond it, a question mark remains. The wall is not an empirical limit but a cognitive one."
      ));
    }

    function tryExplain() {
      local.pushing = performance.now();
      narrate(L(
        "Der Strahl wird zur Wand geschickt. Er wird feiner, dann dünner, dann undeutlich. Die Wand bleibt.",
        "The beam is sent toward the wall. It gets finer, then thinner, then indistinct. The wall stays."
      ));
    }

    function resetMyst() {
      local.probe = 16;
      local.pushing = 0;
      updateMetric();
      renderControls();
      narrate(L("Zurückgesetzt: der Strahl steht wieder weit vor der Grenze.", "Reset: the beam is far from the limit again."));
    }

    function controlsMyst(el) {
      el.innerHTML =
        '<label class="t2-range th-range"><span>' + L("Strahl", "Beam") + '</span><input type="range" id="myst-probe" min="0" max="100" step="1" value="' + local.probe + '"><output>' + local.probe + ' %</output></label>' +
        '<button type="button" class="proto-btn proto-btn--primary" data-myst-try>' + L("Erklärung versuchen", "Try an explanation") + '</button>' +
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
      var rose = color("--rose", "#e3898c");
      var horizon = h * 0.72;
      var wx = wallX(w);
      maze.forEach(function (m) {
        ctx.beginPath();
        if (m.horiz) {
          ctx.moveTo(m.x * w, m.y * h);
          ctx.lineTo(m.x * w + m.len * w, m.y * h);
        } else {
          ctx.moveTo(m.x * w, m.y * h);
          ctx.lineTo(m.x * w, m.y * h + m.len * h);
        }
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.08;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      ctx.lineTo(w, horizon);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
      var wallTop = h * 0.16, wallBottom = h * 0.88;
      var wallGrad = ctx.createLinearGradient(wx, 0, wx + 40, 0);
      wallGrad.addColorStop(0, "rgba(159,176,184,0.32)");
      wallGrad.addColorStop(1, "rgba(159,176,184,0.02)");
      ctx.fillStyle = wallGrad;
      ctx.fillRect(wx, wallTop, 40, wallBottom - wallTop);
      ctx.beginPath();
      ctx.moveTo(wx, wallTop);
      ctx.lineTo(wx, wallBottom);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 2;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      if (local.pushing) {
        var p = clamp((now - local.pushing) / 1500, 0, 1);
        local.probe = T2.lerp(local.probe, 96, Math.min(1, dt * 1.7));
        if (p >= 1) {
          local.probe = 96;
          local.pushing = 0;
          narrate(L(
            "Die Wand bleibt. Der Strahl verliert an Auflösung, je näher er kommt. Der Mysterianismus ist keine Erklärung; er behauptet, dass die Erklärung außerhalb unserer kognitiven Reichweite liegt.",
            "The wall stays. The beam loses resolution as it gets closer. Mysterianism is not an explanation; it claims that the explanation lies beyond our cognitive reach."
          ));
        }
      }
      updateReach(w);
      var px = probeX(w);
      ctx.beginPath();
      ctx.moveTo(w * 0.11, horizon);
      ctx.lineTo(px, horizon);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.25;
      ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      var res = 1 - local.probe / 100 * 0.82;
      var steps = Math.max(6, Math.round(38 * res));
      for (var i = 0; i < steps; i++) {
        var t = i / (steps - 1);
        var x = T2.lerp(px, wx, t);
        var jitter = (1 - res) * Math.sin(t * 30 + now * 0.01) * 6 * t;
        ctx.beginPath();
        ctx.arc(x, horizon + jitter, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = i === steps - 1 ? rose : accent;
        ctx.globalAlpha = 0.18 + 0.55 * (1 - t * 0.7);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.arc(px, horizon, 7, 0, Math.PI * 2);
      ctx.fillStyle = rose;
      ctx.shadowColor = rose;
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,.75)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "rgba(223,231,233,0.65)";
      ctx.font = '600 10px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(L("Erklärung", "explanation"), px + 12, horizon - 12);
    }

    return {
      name: function () { return L("Mysterianismus", "Mysterianism"); },
      about: function () {
        return L(
          "Bewusstsein könnte eine kognitive Grenze sein: Ratten lernen ein Labyrinth, aber keine Gleichungen. Die Wand markiert die Grenze unserer Erklärbarkeit, nicht eine Antwort. Der Mysterianismus ist nicht falsifizierbar und liefert keine Erklärung; er verschiebt die Frage in unsere Erkenntnisgrenzen.",
          "Consciousness may be a cognitive limit: rats learn a maze but not equations. The wall marks the limit of our explainability, not an answer. Mysterianism is not falsifiable and offers no explanation; it moves the question into our cognitive limits."
        );
      },
      defaultText: function () {
        return L(
          "Der Strahl kommt näher und verliert Auflösung. Die Wand bleibt. Versuche, sie zu verschieben, und beobachte, was mit der Erklärung passiert.",
          "The beam gets closer and loses resolution. The wall stays. Try to move it and watch what happens to the explanation."
        );
      },
      metric: function () { return { label: ["Erreichbarkeit", "reachability"], value: Math.round(local.reach) + " %", ratio: local.reach / 100 }; },
      controls: controlsMyst,
      enter: function () { updateMetric(); },
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
