(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function highdimScene(root, api) {
    var DE = api.lang === "de";
    var tokens = DE ? ["Bank", "Fluss", "Geld", "König", "Königin", "Bedeutung"] : ["bank", "river", "money", "king", "queen", "meaning"];
    var cols = 16;
    function value(ti, j) {
      var x = Math.sin((ti + 1) * 12.9898 + (j + 1) * 78.233) * 43758.5453;
      x = x - Math.floor(x);
      return (x * 2 - 1).toFixed(2);
    }
    var head = '<tr><th></th>';
    for (var j = 0; j < cols; j++) head += '<th>d' + (j + 1) + '</th>';
    head += '<th>…</th></tr>';
    var body = tokens.map(function (tok, ti) {
      var cells = '';
      for (var k = 0; k < cols; k++) cells += '<td>' + value(ti, k) + '</td>';
      return '<tr><th>' + api.esc(tok) + '</th>' + cells + '<td>…</td></tr>';
    }).join("");
    var el = document.createElement("div");
    el.className = "ls-highdim-scene";
    el.innerHTML =
      '<div class="ls-highdim-note">' + (DE ? "Ausschnitt: 16 von 4096 Dimensionen. Jede Zeile ist ein Vektor, jede Spalte eine Dimension." : "Slice: 16 of 4096 dimensions. Each row is a vector, each column a dimension.") + '</div>' +
      '<div class="ls-highdim-scroll"><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
      '<p class="ls-highdim-foot">' + (DE ? "Auch wenn wir uns 4096 Dimensionen nicht mehr vorstellen können: Es gelten dieselben Regeln. Mittelpunkt, Winkel und Matrixmultiplikation funktionieren koordinatenweise weiter. Nur die Zahl der Koordinaten wächst, und hier passen viel mehr unabhängige Beziehungen hinein als in zwei oder drei Dimensionen." : "Even though we cannot picture 4096 dimensions, the same rules apply. Midpoint, angle, and matrix multiplication still work coordinate by coordinate. Only the number of coordinates grows, and there is room for many more independent relations than in two or three dimensions.") + '</p>';
    root.appendChild(el);
    return { update: function () {}, resize: function () {}, destroy: function () { el.remove(); } };
  }

  core.register("highdim", highdimScene);
})();
