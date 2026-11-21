(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;

  function bars(n, className) {
    var out = "";
    for (var i = 0; i < n; i++) out += "<i></i>";
    return '<span class="' + className + '">' + out + "</span>";
  }

  function group(step, label, inner) {
    return '<div class="ls-hc-group" data-hc-step="' + step + '">' +
      '<span class="ls-hc-label">' + label + "</span>" + inner + "</div>";
  }

  function matrix(cols, rows) {
    var out = "";
    for (var i = 0; i < cols * rows; i++) out += "<i></i>";
    return '<span class="ls-hc-matrix" style="--hc-cols:' + cols + '">' + out + "</span>";
  }

  function headsHtml() {
    var out = "";
    for (var i = 1; i <= 4; i++) {
      out += '<span class="ls-hc-head"><b>H' + i + "</b>" + bars(4, "ls-hc-bars") + "</span>";
    }
    return '<span class="ls-hc-heads">' + out + "</span>";
  }

  function concatHtml() {
    var colors = ["sky", "green", "gold", "lilac"];
    var labels = ["h₁", "h₂", "h₃", "h₄"];
    var out = "";
    labels.forEach(function (label, i) {
      out += '<span class="ls-hc-concat-row" style="--hc-color:var(--ls-' + colors[i] + ')"><b>' + label + "</b><i></i><i></i><i></i></span>";
    });
    return '<span class="ls-hc-concat-block">' + out + "</span>";
  }

  function tokensHtml(DE) {
    var toks = DE ? ["Der", "Hund", "läuft", "."] : ["The", "dog", "runs", "."];
    return '<span class="ls-hc-tokens">' + toks.map(function (t) {
      return '<span class="ls-hc-token"><b>' + t + "</b>" + bars(3, "ls-hc-token-bars") + "</span>";
    }).join("") + "</span>";
  }

  function flowScene(root, api, mode) {
    var DE = api.lang === "de";
    var concat = mode === "concat";
    var notes = concat
      ? [
          DE ? "Jeder Head liefert pro Token einen eigenen Vektor." : "Each head produces its own vector per token.",
          DE ? "Concat hängt die vier Head-Vektoren hintereinander. Aus vier kurzen Vektoren wird ein langer." : "Concat joins the four head vectors. Four short vectors become one long one.",
          DE ? "Die Matrix <b>W<sub>O</sub></b> fasst die vier Head-Ergebnisse zu einem gemeinsamen Vektor zusammen. Das FFN bekommt also einen einzigen Token-Vektor, nicht vier getrennte Eingänge." : "The matrix <b>W<sub>O</sub></b> combines the four head results into one shared vector. The FFN therefore receives a single token vector, not four separate inputs."
        ]
      : [
          DE ? "Das FFN bekommt einen einzigen Vektor pro Token, nicht die einzelnen Heads." : "The FFN receives a single vector per token, not the individual heads.",
          DE ? "<b>W<sub>1</sub></b> macht daraus viele einzelne Hidden-Werte." : "<b>W<sub>1</sub></b> turns it into many individual hidden values.",
          DE ? "Die Aktivierung biegt jeden Hidden-Wert." : "The activation bends each hidden value.",
          DE ? "<b>W<sub>2</sub></b> macht aus den vielen Hidden-Werten wieder einen Vektor pro Token. Das Ergebnis geht zurück auf die einzelnen Tokens; jeder Token bekommt seinen eigenen neuen Vektor." : "<b>W<sub>2</sub></b> turns the many hidden values back into one vector per token. The result goes back to the individual tokens; each token receives its own new vector."
        ];
    var stage = 0;
    var last = notes.length - 1;
    var stageHtml;
    if (concat) {
      stageHtml =
        group(0, DE ? "Heads" : "heads", headsHtml()) +
        '<span class="ls-hc-arrow">→</span>' +
        group(1, "Concat", concatHtml()) +
        '<span class="ls-hc-arrow">→</span>' +
        group(2, "W_O", matrix(4, 4)) +
        '<span class="ls-hc-arrow">→</span>' +
        group(2, DE ? "Token-Vektor" : "token vector", bars(5, "ls-hc-vector")) +
        '<span class="ls-hc-arrow">→</span>' +
        group(2, "FFN", '<span class="ls-hc-box">FFN</span>');
    } else {
      stageHtml =
        group(0, DE ? "Token-Vektor" : "token vector", bars(5, "ls-hc-vector")) +
        '<span class="ls-hc-arrow">→</span>' +
        group(1, "W_1", matrix(5, 7)) +
        '<span class="ls-hc-arrow">→</span>' +
        group(1, DE ? "Hidden d_ff" : "hidden d_ff", bars(8, "ls-hc-vector")) +
        '<span class="ls-hc-arrow">→</span>' +
        group(2, "act", '<span class="ls-hc-box">GELU</span>') +
        '<span class="ls-hc-arrow">→</span>' +
        group(3, "W_2", matrix(7, 5)) +
        '<span class="ls-hc-arrow">→</span>' +
        group(3, DE ? "zurück" : "back", bars(5, "ls-hc-vector")) +
        '<span class="ls-hc-arrow">→</span>' +
        group(3, DE ? "zurück zu den Tokens" : "back to the tokens", tokensHtml(DE));
    }
    var el = document.createElement("div");
    el.className = "ls-hc-scene";
    el.innerHTML =
      '<div class="ls-hc-stage">' + stageHtml + "</div>" +
      '<p class="ls-hc-note"></p>' +
      '<p class="ls-hc-footer">' + (concat
        ? (DE ? "Wichtig: Das FFN sieht nicht die einzelnen Heads. Concat und W_O machen daraus einen Token-Vektor." : "Important: the FFN does not see the individual heads. Concat and W_O turn them into one token vector.")
        : (DE ? "Wichtig: Das FFN läuft für jedes Token einzeln. Es trennt nicht wieder nach Heads; es gibt jedem Token seinen neuen Vektor zurück." : "Important: the FFN runs separately for each token. It does not split the heads again; it gives each token its new vector back.")) + "</p>";
    root.appendChild(el);
    var note = el.querySelector(".ls-hc-note");
    function render() {
      el.setAttribute("data-stage", String(stage));
      note.innerHTML = notes[stage] || "";
      el.querySelectorAll("[data-hc-step]").forEach(function (node) {
        var s = parseInt(node.getAttribute("data-hc-step"), 10);
        node.classList.toggle("is-on", s === stage);
        node.classList.toggle("is-dim", s !== stage);
      });
    }
    render();
    return {
      update: function (s) {
        if (s && typeof s.step === "number") {
          stage = Math.max(0, Math.min(last, s.step));
          render();
        }
      },
      next: function () {
        if (stage < last) { stage += 1; render(); return true; }
        return false;
      },
      prev: function () {
        if (stage > 0) { stage -= 1; render(); return true; }
        return false;
      },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }

  core.register("headconcat", function (root, api) { return flowScene(root, api, "concat"); });
  core.register("ffnsplit", function (root, api) { return flowScene(root, api, "ffn"); });
})();
