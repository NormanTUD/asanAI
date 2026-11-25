(function () {
  "use strict";

  var chamber = document.getElementById("kz-chamber");
  var canvas = document.getElementById("kz-canvas");
  var silosEl = document.getElementById("kz-silos");
  var detail = document.getElementById("kz-detail");
  var riskEl = document.getElementById("kz-risk");
  var benefitEl = document.getElementById("kz-benefit");
  var benefitLegend = document.getElementById("kz-benefit-legend");
  var flowLabel = document.getElementById("kz-flow-label");
  if (!chamber || !silosEl) return;

  var STAGES = [
    {
      id: "chips",
      name: ["Chips und Fabriken", "Chips and fabs"],
      who: "Nvidia, TSMC, ASML",
      kind: ["Konzentration", "concentration"],
      body: [
        "Training braucht spezialisierte Chips. Die Fertigung ist an wenigen Orten konzentriert.",
        "Training needs specialised chips. Manufacturing is concentrated in a few places."
      ],
      example: [
        "Ein Engpass bei TSMC oder Nvidia verlangsamt die ganze Branche.",
        "A bottleneck at TSMC or Nvidia slows the whole industry."
      ],
      counter: [
        "Diversifizierung, öffentliche Reserven, Exportregeln.",
        "Diversification, public reserves, export rules."
      ],
      cite: "Sastry et al. (2024)"
    },
    {
      id: "cloud",
      name: ["Cloud und Compute", "Cloud and compute"],
      who: "AWS, Azure, Google Cloud",
      kind: ["Konzentration", "concentration"],
      body: [
        "Wer Compute vermietet, setzt Preis und Zugang. Start-ups mieten meist bei wenigen Anbietern.",
        "Whoever rents out compute sets price and access. Start-ups usually rent from a few providers."
      ],
      example: [
        "Ein Cloud-Ausfall stoppt viele Dienste gleichzeitig.",
        "A cloud outage stops many services at once."
      ],
      counter: [
        "Regulierte Zugänge, öffentliche Compute-Angebote, Wettbewerb.",
        "Regulated access, public compute, competition."
      ],
      cite: "Sastry et al. (2024)"
    },
    {
      id: "models",
      name: ["Frontier-Modelle", "Frontier models"],
      who: ["wenige Labore", "a few labs"],
      kind: ["Konzentration", "concentration"],
      body: [
        "Die besten Modelle brauchen viel Compute, Daten und Talent. Nur wenige Labore können mithalten.",
        "The best models need a lot of compute, data, and talent. Only a few labs can keep up."
      ],
      example: [
        "Ein neues Modell verschiebt Benchmarks und Preise.",
        "A new model shifts benchmarks and prices."
      ],
      counter: [
        "Offene Modelle, Evaluation, Kartellrecht.",
        "Open models, evaluation, antitrust."
      ],
      cite: "Sastry et al. (2024)"
    },
    {
      id: "distribution",
      name: ["Plattformen und Apps", "Platforms and apps"],
      who: ["App-Stores, soziale Plattformen", "app stores, social platforms"],
      kind: ["Konzentration", "concentration"],
      body: [
        "Wer die Verteilung kontrolliert, bestimmt Sichtbarkeit und Nachfrage.",
        "Whoever controls distribution sets visibility and demand."
      ],
      example: [
        "Ein App-Store-Ranking entscheidet, welcher Assistent gefunden wird.",
        "An app-store ranking decides which assistant is found."
      ],
      counter: [
        "Interoperabilität, Transparenz, Wettbewerb.",
        "Interoperability, transparency, competition."
      ],
      cite: "EU AI Act (2024)"
    },
    {
      id: "rules",
      name: ["Regeln und Filter", "Rules and filters"],
      who: ["Staaten und Anbieter", "states and providers"],
      kind: ["Regeldichte", "rule density"],
      body: [
        "Filter und Regeln entscheiden, was ein Modell sagt. Die Grenze ist oft unsichtbar.",
        "Filters and rules decide what a model says. The boundary is often invisible."
      ],
      example: [
        "Chinesische Modelle weichen Tiananmen aus; US-Modelle haben eigene rote Linien (Noels et al., 2025).",
        "Chinese models avoid Tiananmen; US models have their own red lines (Noels et al., 2025)."
      ],
      counter: [
        "Transparenz, unabhängige Audits, lokale Alternativen.",
        "Transparency, independent audits, local alternatives."
      ],
      cite: "Noels et al. (2025); Naseh et al. (2025)"
    }
  ];

  var RISKS = [
    { id: "misuse", name: ["Missbrauch", "Misuse"], short: ["Betrug, Cyber, Desinformation", "fraud, cyber, disinformation"] },
    { id: "unequal", name: ["Ungleicher Zugang", "Unequal access"], short: ["Arm/Reich, Sprache, Wissen", "rich/poor, language, knowledge"] },
    { id: "power", name: ["Machtkonzentration", "Power concentration"], short: ["Compute, Regeln, Sagbarkeit", "compute, rules, sayability"] },
    { id: "control", name: ["Kontrolle verlieren", "Losing control"], short: ["Ziele, Agenten, Skalierung", "goals, agents, scale"] }
  ];

  var DEFAULTS = { compute: 85, regulation: 35, data: 45, autonomy: 60 };
  var state = { compute: 85, regulation: 35, data: 45, autonomy: 60, selected: 0, preset: "open" };

  var inputs = {
    compute: document.getElementById("kz-compute"),
    regulation: document.getElementById("kz-regulation"),
    data: document.getElementById("kz-data"),
    autonomy: document.getElementById("kz-autonomy")
  };

  function L(de, en) { return T2.t(de, en); }
  function clamp(v) { return T2.clamp(v, 0, 100); }
  function pct(v) { return Math.round(clamp(v)); }

  function values() {
    return {
      chips: clamp(0.9 * state.compute + 10),
      cloud: clamp(0.85 * state.compute + 5),
      models: clamp(0.65 * state.compute + 15),
      distribution: clamp(45 + 0.2 * state.compute - 0.1 * state.regulation),
      rules: clamp(15 + 0.8 * state.regulation)
    };
  }

  function riskScores() {
    return {
      misuse: clamp(0.55 * state.autonomy + 0.35 * (100 - state.regulation) + 0.25 * state.compute - 20),
      unequal: clamp(0.55 * (100 - state.data) + 0.35 * state.compute - 0.25 * state.regulation),
      power: clamp(0.5 * state.compute + 0.4 * (100 - state.regulation) - 0.1 * state.data),
      control: clamp(0.5 * state.autonomy + 0.4 * (100 - state.regulation) + 0.2 * state.compute - 15)
    };
  }

  function level(v) { return v >= 66 ? "high" : v >= 36 ? "mid" : "low"; }

  function renderSilos() {
    var v = values();
    silosEl.innerHTML = STAGES.map(function (s, i) {
      var value = v[s.id];
      return '<button type="button" class="kz-silo' + (i === state.selected ? ' is-on' : '') + '" data-silo="' + s.id + '" data-index="' + i + '">' +
        '<span class="kz-silo-name">' + T2.esc(L(s.name[0], s.name[1])) + '</span>' +
        '<span class="kz-tube"><span class="kz-fill" style="height:' + pct(value) + '%"></span></span>' +
        '<span class="kz-silo-pct">' + pct(value) + ' %</span>' +
        '<span class="kz-silo-who">' + T2.esc(typeof s.who === "string" ? s.who : L(s.who[0], s.who[1])) + '</span>' +
      '</button>';
    }).join("");
    silosEl.querySelectorAll("[data-index]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.selected = parseInt(b.getAttribute("data-index"), 10);
        renderSilos();
        renderDetail();
      });
    });
    requestAnimationFrame(layout);
  }

  function renderDetail() {
    var s = STAGES[state.selected];
    var v = values()[s.id];
    detail.innerHTML =
      '<span class="kz-detail-kicker">' + T2.esc(L("Stufe ", "Stage ") + "0" + (state.selected + 1)) + '</span>' +
      '<h3>' + T2.esc(L(s.name[0], s.name[1])) + '</h3>' +
      '<p class="kz-detail-who">' + T2.esc(typeof s.who === "string" ? s.who : L(s.who[0], s.who[1])) + '</p>' +
      '<div class="kz-detail-meter"><span><b>' + T2.esc(L(s.kind[0], s.kind[1])) + '</b><b>' + pct(v) + ' %</b></span><div class="t2-meter"><i style="width:' + pct(v) + '%"></i></div></div>' +
      '<p>' + T2.esc(L(s.body[0], s.body[1])) + '</p>' +
      '<div class="kz-detail-block"><b>' + T2.esc(L("Beispiel", "Example")) + '</b><p>' + T2.esc(L(s.example[0], s.example[1])) + '</p></div>' +
      '<div class="kz-detail-block"><b>' + T2.esc(L("Was hilft", "What helps")) + '</b><p>' + T2.esc(L(s.counter[0], s.counter[1])) + '</p></div>' +
      '<p class="kz-detail-cite"><b>' + T2.esc(L("Quelle", "Source")) + ':</b> ' + T2.esc(s.cite) + '</p>';
  }

  function renderRisk() {
    var r = riskScores();
    riskEl.innerHTML = RISKS.map(function (k) {
      var v = r[k.id];
      var l = level(v);
      return '<article class="kz-risk-card" data-level="' + l + '" data-risk="' + k.id + '">' +
        '<div class="kz-risk-card-head"><b>' + T2.esc(L(k.name[0], k.name[1])) + '</b><span>' + pct(v) + '</span></div>' +
        '<div class="t2-meter"><i style="width:' + pct(v) + '%"></i></div>' +
        '<small>' + T2.esc(L(k.short[0], k.short[1])) + '</small>' +
      '</article>';
    }).join("");
  }

  function benefitShares() {
    var platforms = T2.clamp(10 + state.compute * 0.35 - state.regulation * 0.15, 5, 60);
    var labs = T2.clamp(10 + state.compute * 0.25 - state.regulation * 0.05, 5, 50);
    var states = T2.clamp(5 + state.regulation * 0.25, 5, 35);
    var many = Math.max(5, 100 - platforms - labs - states);
    var sum = platforms + labs + states + many;
    return [
      { label: [L("Plattformen", "Platforms"), "#7ec8ef"], v: platforms / sum },
      { label: [L("Labore", "Labs"), "#b3a8e6"], v: labs / sum },
      { label: [L("Staaten", "States"), "#e3be62"], v: states / sum },
      { label: [L("Viele", "Many"), "#7cc264"], v: many / sum }
    ];
  }

  function renderBenefit() {
    var shares = benefitShares();
    benefitEl.innerHTML = shares.map(function (s) {
      return '<i title="' + T2.esc(s.label[0]) + '" style="flex-basis:' + (s.v * 100).toFixed(1) + '%;background:' + s.label[1] + '"></i>';
    }).join("");
    benefitLegend.innerHTML = shares.map(function (s) {
      return '<span><i style="background:' + s.label[1] + '"></i>' + T2.esc(s.label[0]) + ' ' + Math.round(s.v * 100) + '%</span>';
    }).join("");
  }

  function renderAll() {
    renderSilos();
    renderDetail();
    renderRisk();
    renderBenefit();
    Object.keys(inputs).forEach(function (k) {
      inputs[k].value = String(state[k]);
      var out = inputs[k].nextElementSibling;
      if (out) out.textContent = String(Math.round(state[k]));
    });
    flowLabel.textContent = L("Partikel: Compute und Kapital", "Particles: compute and capital");
    document.querySelectorAll("[data-kz-preset]").forEach(function (b) {
      b.classList.toggle("is-on", b.getAttribute("data-kz-preset") === state.preset);
    });
  }

  function setPreset(name) {
    var presets = {
      open: { compute: 70, regulation: 20, data: 70, autonomy: 80 },
      regulated: { compute: 55, regulation: 80, data: 65, autonomy: 35 },
      concentrated: { compute: 95, regulation: 20, data: 30, autonomy: 70 }
    };
    var p = presets[name];
    if (!p) return;
    state.preset = name;
    Object.keys(p).forEach(function (k) { state[k] = p[k]; });
    renderAll();
  }

  function onSlider(key) {
    state[key] = parseFloat(inputs[key].value);
    state.preset = "";
    renderAll();
  }

  /* Canvas particles */
  var box = null;
  var geom = [];
  var particles = [];
  var last = 0;

  function layout() {
    if (!canvas) return;
    box = T2.fit(canvas, chamber);
    var cr = chamber.getBoundingClientRect();
    geom = [];
    particles = [];
    silosEl.querySelectorAll(".kz-silo").forEach(function (silo, i) {
      var tube = silo.querySelector(".kz-tube");
      if (!tube) return;
      var r = tube.getBoundingClientRect();
      var accent = getComputedStyle(silo).getPropertyValue("--kz-accent").trim() || "#7ec8ef";
      geom.push({
        x: r.left - cr.left + r.width / 2,
        top: r.top - cr.top,
        bottom: r.bottom - cr.top,
        color: accent
      });
      particles.push(T2.particles(16, i + 7));
    });
  }

  var loop = T2.loop(function (now) {
    if (!box) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    draw(dt);
  });

  function draw(dt) {
    var ctx = box.ctx, w = box.w, h = box.h;
    ctx.clearRect(0, 0, w, h);
    var speed = 0.18 + state.compute / 220;
    for (var i = 0; i < geom.length; i++) {
      var g = geom[i];
      if (!g) continue;
      ctx.strokeStyle = "rgba(150,210,230,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(g.x, g.top + 8);
      ctx.lineTo(g.x, g.bottom - 8);
      ctx.stroke();
      var list = particles[i] || [];
      list.forEach(function (p) {
        p.t -= dt * p.speed * speed;
        if (p.t < 0) p.t += 1;
        var y = g.bottom - 8 - p.t * (g.bottom - g.top - 16);
        var x = g.x + p.jitter * 7 * Math.sin(p.t * 8 + i);
        ctx.beginPath();
        ctx.arc(x, y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = g.color;
        ctx.globalAlpha = 0.18 + 0.38 * Math.sin(p.t * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    }
    var a = T2.cssVar("--kz-accent", chamber) || "#7ec8ef";
    ctx.strokeStyle = a;
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.moveTo(16, h - 18.5);
    ctx.lineTo(w - 16, h - 18.5);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /* Wiring */
  Object.keys(inputs).forEach(function (k) {
    inputs[k].addEventListener("input", function () { onSlider(k); });
  });
  document.querySelectorAll("[data-kz-preset]").forEach(function (b) {
    b.addEventListener("click", function () { setPreset(b.getAttribute("data-kz-preset")); });
  });
  document.querySelector("[data-kz-reset]").addEventListener("click", function () {
    Object.keys(DEFAULTS).forEach(function (k) { state[k] = DEFAULTS[k]; });
    state.preset = "open";
    state.selected = 0;
    renderAll();
  });

  var stopResize = T2.onResize(chamber, function () { layout(); });
  T2.onTheme(function () { layout(); });
  T2.onLang(function () { renderAll(); });

  renderAll();
  layout();
  loop.start();
  window.addEventListener("beforeunload", function () { loop.stop(); stopResize(); });
})();
