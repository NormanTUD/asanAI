(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;

  function inductionMatrixScene(root, api) {
    var DE = api.lang === "de";
    var tokens = ["A", "B", "C", "A", "B", "C", "A"];
    var weights = [
      [1.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
      [0.10, 0.90, 0.00, 0.00, 0.00, 0.00, 0.00],
      [0.05, 0.15, 0.80, 0.00, 0.00, 0.00, 0.00],
      [0.10, 0.10, 0.10, 0.70, 0.00, 0.00, 0.00],
      [0.02, 0.05, 0.01, 0.10, 0.82, 0.00, 0.00],
      [0.01, 0.02, 0.02, 0.05, 0.10, 0.80, 0.00],
      [0.01, 0.06, 0.01, 0.03, 0.82, 0.01, 0.06]
    ];
    var row = 6;
    var el = document.createElement("div");
    el.className = "ls-ix-scene";
    root.appendChild(el);

    function pct(v) { return Math.round(v * 100) + "%"; }

    function render() {
      var pred = ["–", "A", "B", "C", "A", "B", "C"];
      var head = '<tr><th>' + (DE ? "fragt ↓ / liest →" : "asks ↓ / reads →") + '</th>' +
        tokens.map(function (t, i) { return '<th class="' + (row === 6 && i === 4 ? "is-hot-col" : "") + '">' + i + ' ' + t + '</th>'; }).join("") + '</tr>' +
        '<tr><th>' + (DE ? "Vorgänger" : "Predecessor") + '</th>' + pred.map(function (t, i) { return '<th class="' + (row === 6 && i === 4 ? "is-hot-col" : "") + '">' + t + '</th>'; }).join("") + '</tr>';
      var body = weights.map(function (values, i) {
        var cells = values.map(function (v, j) {
          var hot = i === row && v === Math.max.apply(null, values.filter(function (x) { return x < 1; }));
          var bg = hot ? "rgba(159,151,0,.30)" : "rgba(0,75,111," + Math.min(0.24, v * 0.28) + ")";
          return '<td class="' + (hot ? "is-hot" : "") + '" style="background:' + bg + '">' + pct(v) + '</td>';
        }).join("");
        return '<tr class="' + (i === row ? "is-selected" : "") + '"><th>' + i + ' ' + tokens[i] + '</th>' + cells + '</tr>';
      }).join("");
      var current = weights[row];
      var best = 0;
      for (var i = 0; i < current.length; i++) if (i !== row && current[i] > current[best]) best = i;
      el.innerHTML =
        '<div class="ls-ix-head"><b>' + (DE ? "Attention-Gewichte: Wo liest A?" : "Attention weights: where does A read?") + '</b><span>' + (DE ? "Zeile 6 ist das aktuelle A. Die Spalte zeigt, was es liest." : "Row 6 is the current A. The column shows what it reads.") + '</span></div>' +
        '<div class="ls-ix-steps">' +
          '<div><span>1</span><b>' + (DE ? "Vorgänger merken" : "Remember predecessor") + '</b><p>' + (DE ? "Vor B an Position 4 stand A." : "Before B at position 4 stood A.") + '</p></div>' +
          '<div><span>2</span><b>' + (DE ? "Query trifft Key" : "Query meets key") + '</b><p>' + (DE ? "Das aktuelle A fragt nach A; Position 4 trägt A." : "The current A asks for A; position 4 carries A.") + '</p></div>' +
          '<div><span>3</span><b>' + (DE ? "B kopieren" : "Copy B") + '</b><p>' + (DE ? "OV kopiert B an die neue Stelle." : "OV copies B to the new position.") + '</p></div>' +
        '</div>' +
        '<div class="ls-ix-body">' +
          '<div class="ls-ix-table-wrap"><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
          '<div class="ls-ix-side">' +
            '<div class="ls-ix-row-label">' + (DE ? "Zeile 6 · A (Position 6)" : "Row 6 · A (position 6)") + '</div>' +
            '<div class="ls-ix-strong">' + (DE ? "82 % von B (Position 4)" : "82% from B (position 4)") + '</div>' +
            '<p>' + (DE ? "Spalte 4 ist B. Ihr Vorgänger ist A. Das aktuelle A fragt mit A und trifft deshalb diese Spalte. Der OV-Schaltkreis kopiert den Value von B." : "Column 4 is B. Its predecessor is A. The current A asks with A and therefore hits this column. The OV circuit copies B's value.") + '</p>' +
            '<p class="ls-ix-note">' + (DE ? "Hohe Werte sind gelernte Attention-Gewichte, keine statistische Korrelation. Zahlen illustriert." : "High values are learned attention weights, not statistical correlation. Numbers illustrative.") + '</p>' +
          '</div>' +
        '</div>';
      el.querySelector("table").setAttribute("aria-label", DE
        ? "Attention-Tabelle. Zeile " + row + ", Token " + tokens[row] + ", liest " + pct(current[best]) + " von Spalte " + best + ", " + tokens[best] + ", Vorgänger " + pred[best] + "."
        : "Attention table. Row " + row + ", token " + tokens[row] + ", reads " + pct(current[best]) + " from column " + best + ", " + tokens[best] + ", predecessor " + pred[best] + ".");
    }

    render();
    return {
      update: function (s) {
        if (s && typeof s.row === "number") { row = Math.max(0, Math.min(tokens.length - 1, s.row)); render(); }
      },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }

  core.register("inductionmatrix", inductionMatrixScene);
})();
