(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function softmaxScene(root, api) {
    var DE = api.lang === "de";
    var PROMPTS = {
      spaceship: {
        text: "“As the spaceship was approaching <b>the</b>”",
        rows: [
          { token: "planet", logit: -92.8636474609375 }, { token: "surface", logit: -94.18270874023438 },
          { token: "station", logit: -94.41707611083984 }, { token: "moon", logit: -94.45668029785156 },
          { token: "Earth", logit: -94.46949005126953 }, { token: "end", logit: -94.54924774169922 },
          { token: "ship", logit: -94.74138641357422 }, { token: "edge", logit: -94.87800598144531 },
          { token: "star", logit: -94.9022216796875 }, { token: "asteroid", logit: -94.97351837158203 }
        ]
      },
      planet: {
        text: "“On the deserted planet they discovered <b>a</b>”",
        rows: [
          { token: "strange", logit: -89.01858520507812 }, { token: "mysterious", logit: -89.26126861572266 },
          { token: "planet", logit: -89.26339721679688 }, { token: "large", logit: -89.2662124633789 },
          { token: "massive", logit: -89.29888916015625 }, { token: "small", logit: -89.4354476928711 },
          { token: "new", logit: -89.59513092041016 }, { token: "vast", logit: -89.6324462890625 },
          { token: "huge", logit: -89.85299682617188 }, { token: "giant", logit: -90.060302734375 }
        ]
      }
    };
    var el = document.createElement("div");
    el.className = "ls-softmax-scene";
    el.innerHTML = '<div class="ls-scene-row ls-softmax-prompts"></div><p class="softmax-context"><span class="softmax-context-label">' + (DE ? "Kontext · echte GPT-2-Logits (englisch)" : "context · real GPT-2 logits (English)") + '</span> <span class="ls-softmax-context"></span></p><div class="softmax-stage"><div class="softmax-col softmax-col--logits"><div class="softmax-col-head"><span>Token</span><span>Logit</span></div><div data-logits></div></div><svg class="softmax-ribbons" data-ribbons aria-hidden="true"><defs><linearGradient id="softmax-ribbon-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#63a44b"></stop><stop offset="100%" stop-color="#009299"></stop></linearGradient></defs></svg><div class="softmax-col softmax-col--probs"><div class="softmax-col-head"><span>' + (DE ? "Wahrscheinlichkeit" : "probability") + '</span><span>Softmax</span></div><div data-probs></div></div></div><div class="ls-scene-row"><label class="ls-range">T <input type="range" class="ls-sm-temp" min="0.2" max="2" step="0.05" value="1"><output>1.00</output></label></div><div class="ls-sm-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var prompts = el.querySelector(".ls-softmax-prompts");
    var contextEl = el.querySelector(".ls-softmax-context");
    var logitsEl = el.querySelector("[data-logits]");
    var probsEl = el.querySelector("[data-probs]");
    var ribbons = el.querySelector("[data-ribbons]");
    var tempEl = el.querySelector(".ls-sm-temp");
    var readout = el.querySelector(".ls-sm-readout");
    var state = { key: "spaceship", temp: 1, hovered: 0 };
    var pathEls = [];
    function calc() {
      var rows = PROMPTS[state.key].rows;
      var logits = rows.map(function (r) { return r.logit; });
      var max = Math.max.apply(null, logits);
      var ex = logits.map(function (v) { return Math.exp((v - max) / state.temp); });
      var sum = ex.reduce(function (a, b) { return a + b; }, 0);
      return { ex: ex, sum: sum, probs: ex.map(function (e) { return e / sum; }), max: max, min: Math.min.apply(null, logits) };
    }
    function build() {
      var rows = PROMPTS[state.key].rows;
      var c = calc();
      contextEl.innerHTML = PROMPTS[state.key].text;
      logitsEl.innerHTML = "";
      probsEl.innerHTML = "";
      rows.forEach(function (r, i) {
        var lrow = document.createElement("div");
        lrow.className = "softmax-row";
        lrow.setAttribute("tabindex", "0");
        var l1 = document.createElement("span"); l1.className = "softmax-row-label"; l1.textContent = r.token;
        var b1 = document.createElement("span"); b1.className = "softmax-bar"; var f1 = document.createElement("i"); b1.appendChild(f1);
        var v1 = document.createElement("span"); v1.className = "softmax-value"; v1.textContent = r.logit.toFixed(1);
        lrow.appendChild(l1); lrow.appendChild(b1); lrow.appendChild(v1);
        var prow = document.createElement("div");
        prow.className = "softmax-row";
        var v2 = document.createElement("span"); v2.className = "softmax-value"; v2.textContent = (c.probs[i] * 100).toFixed(1) + "%";
        var b2 = document.createElement("span"); b2.className = "softmax-bar"; var f2 = document.createElement("i"); b2.appendChild(f2);
        var l2 = document.createElement("span"); l2.className = "softmax-row-label"; l2.textContent = r.token;
        prow.appendChild(v2); prow.appendChild(b2); prow.appendChild(l2);
        var lt = (r.logit - c.min) / Math.max(0.001, c.max - c.min);
        f1.style.width = (12 + lt * 88).toFixed(1) + "%";
        f2.style.width = Math.max(1, c.probs[i] / Math.max.apply(null, c.probs) * 100).toFixed(1) + "%";
        function hover() {
          state.hovered = i;
          el.querySelectorAll(".softmax-row").forEach(function (x) { x.classList.remove("is-hot"); });
          lrow.classList.add("is-hot"); prow.classList.add("is-hot");
          pathEls.forEach(function (p, k) { if (p) p.classList.toggle("is-hot", k === i); });
          readout.innerHTML = '<span>Token <b>' + api.esc(r.token) + '</b></span><span>Logit <b>' + r.logit.toFixed(2) + '</b></span><span>exp((logit − max)/T) <b>' + c.ex[i].toFixed(4) + '</b></span><span>p <b>' + (c.probs[i] * 100).toFixed(2) + '%</b></span>';
        }
        lrow.addEventListener("mouseenter", hover); lrow.addEventListener("focus", hover);
        prow.addEventListener("mouseenter", hover); prow.addEventListener("focus", hover);
        logitsEl.appendChild(lrow); probsEl.appendChild(prow);
      });
      updateRibbons();
    }
    function updateRibbons() {
      var stage = el.querySelector(".softmax-stage");
      var sr = stage.getBoundingClientRect();
      ribbons.setAttribute("viewBox", "0 0 " + sr.width + " " + sr.height);
      var defs = '<defs><linearGradient id="softmax-ribbon-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#63a44b"></stop><stop offset="100%" stop-color="#009299"></stop></linearGradient></defs>';
      ribbons.innerHTML = defs;
      pathEls = [];
      var ls = logitsEl.querySelectorAll(".softmax-row");
      var ps = probsEl.querySelectorAll(".softmax-row");
      ls.forEach(function (l, i) {
        if (!ps[i]) return;
        var a = l.getBoundingClientRect(), b = ps[i].getBoundingClientRect();
        var x1 = a.right - sr.left, y1 = a.top + a.height / 2 - sr.top;
        var x2 = b.left - sr.left, y2 = b.top + b.height / 2 - sr.top;
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        var mx = (x1 + x2) / 2;
        path.setAttribute("d", "M" + x1 + "," + y1 + " C" + mx + "," + y1 + " " + mx + "," + y2 + " " + x2 + "," + y2);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-width", "1");
        ribbons.appendChild(path);
        pathEls[i] = path;
      });
    }
    Object.keys(PROMPTS).forEach(function (key) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-chip" + (key === state.key ? " is-on" : "");
      b.textContent = key === "spaceship" ? (DE ? "Raumschiff" : "spaceship") : (DE ? "verlassener Planet" : "deserted planet");
      b.addEventListener("click", function () {
        state.key = key;
        prompts.querySelectorAll(".ls-chip").forEach(function (x) { x.classList.toggle("is-on", x === b); });
        build();
      });
      prompts.appendChild(b);
    });
    tempEl.addEventListener("input", function () {
      state.temp = parseFloat(tempEl.value) || 1;
      tempEl.nextElementSibling.textContent = state.temp.toFixed(2);
      build();
    });
    window.addEventListener("resize", updateRibbons);
    build();
    return { update: function () {}, resize: updateRibbons, destroy: function () { window.removeEventListener("resize", updateRibbons); el.remove(); } };
  }

  core.register("softmax", softmaxScene);
})();
