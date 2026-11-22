(function () {
  "use strict";
  var SHARED = {
    loop: null
  };

  var TEMP = [
    { id: "freezing", value: 0, color: "sky", label: ["Gefrierpunkt", "Freezing"] },
    { id: "icecold", value: 5, color: "lilac", label: ["Eiskalt", "Ice cold"] },
    { id: "cold", value: 15, color: "blue", label: ["Kalt", "Cold"] },
    { id: "cool", value: 30, color: "petrol", label: ["Kühl", "Cool"] },
    { id: "lukewarm", value: 45, color: "green", label: ["Lauwarm", "Lukewarm"] },
    { id: "warm", value: 60, color: "lime", label: ["Warm", "Warm"] },
    { id: "hot", value: 100, color: "gold", label: ["Heiß", "Hot"] }
  ];

  var WORDS = {
    male: { v: [0, -20], z: 0, label: ["Männlich", "Male"], group: "gender" },
    female: { v: [0, 20], z: 0, label: ["Weiblich", "Female"], group: "gender" },
    man: { v: [5, -10], z: 0, label: ["Mann", "Man"], group: "power" },
    woman: { v: [5, 10], z: 0, label: ["Frau", "Woman"], group: "power" },
    prince: { v: [15, -10], z: 0, label: ["Prinz", "Prince"], group: "rank" },
    princess: { v: [15, 10], z: 0, label: ["Prinzessin", "Princess"], group: "rank" },
    king: { v: [25, -10], z: 0, label: ["König", "King"], group: "rank" },
    queen: { v: [25, 10], z: 0, label: ["Königin", "Queen"], group: "rank" },
    power: { v: [10, 0], z: 0, label: ["Macht", "Power"], group: "power" },
    maleDog: { v: [5, -10], z: -1.0, label: ["Rüde", "Male dog"], group: "animal", only3d: true },
    femaleDog: { v: [5, 10], z: -1.0, label: ["Hündin", "Female dog"], group: "animal", only3d: true },
    wizard: { v: [15, -10], z: 1.0, label: ["Zauberer", "Wizard"], group: "fiction", only3d: true },
    sorceress: { v: [15, 10], z: 1.0, label: ["Zauberin", "Sorceress"], group: "fiction", only3d: true }
  };
  var WORD_IDS = Object.keys(WORDS).filter(function (id) { return !WORDS[id].only3d; });
  var WORD_IDS_3D = Object.keys(WORDS).filter(function (id) { return WORDS[id].only3d; });

  var EXAMPLES = [
    { id: "king-man-woman", expr: "King - Man + Woman", label: ["König − Mann + Frau", "King − Man + Woman"] },
    { id: "man-power", expr: "Man + 2 * Power", label: ["Mann + 2 · Macht", "Man + 2 · Power"] },
    { id: "prince-power", expr: "Prince + Power", label: ["Prinz + Macht", "Prince + Power"] },
    { id: "gender", label: ["Geschlecht", "Gender"] },
    { id: "power-dir", label: ["Machtrichtung", "Power direction"] },
    { id: "directions", label: ["Alle Richtungen", "All directions"] },
    { id: "dog-gender", expr: "MaleDog - Man + Woman", label: ["Rüde − Mann + Frau", "Male dog − Man + Woman"], only3d: true },
    { id: "wizard-gender", expr: "Wizard - Man + Woman", label: ["Zauberer − Mann + Frau", "Wizard − Man + Woman"], only3d: true },
    { id: "layers", label: ["Ebenen", "Layers"], only3d: true }
  ];

  var PAIRS = [
    ["cold", "lukewarm"]
  ];

  function esc(s) { return String(s == null ? "" : s); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }


  var scenes = {};
  function register(name, factory) { if (typeof name === "string" && typeof factory === "function") scenes[name] = factory; }
  function get(name) { return scenes[name] || null; }
  window.LearnSysDemoCore = { SHARED: SHARED, TEMP: TEMP, WORDS: WORDS, WORD_IDS: WORD_IDS, WORD_IDS_3D: WORD_IDS_3D, EXAMPLES: EXAMPLES, PAIRS: PAIRS, esc: esc, clamp: clamp, lerp: lerp, ease: ease, register: register, get: get, scenes: scenes };
})();
