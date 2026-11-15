(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var esc = core.esc;
  function highdimScene(root, api) {
    var DE = api.lang === "de";
    var tokens = DE
      ? ["Bank", "Fluss", "Geld", "König", "Königin", "Bedeutung", "Stadt", "Wasser"]
      : ["bank", "river", "money", "king", "queen", "meaning", "city", "water"];
    var cols = 64;
    var selected = 3;
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
      return '<tr data-token="' + ti + '"' + (ti === selected ? ' class="is-on"' : '') + '><th>' + esc(tok) + '</th>' + cells + '<td>…</td></tr>';
    }).join("");
    var more = '<tr class="is-ellipsis"><th>…</th>' + Array(cols + 2).join('<td>…</td>') + '</tr>';
    var el = document.createElement("div");
    el.className = "ls-highdim-scene";
    el.innerHTML =
      '<div class="ls-highdim-note"><b>' + (DE ? "Jede Zeile ist die Position eines Tokens, jede Spalte eine Dimension." : "Each row is a token's position, each column a dimension.") + '</b> ' +
        (DE ? "Ausschnitt: 64 von 4096 Dimensionen; rechts und unten geht es weiter." : "Slice: 64 of 4096 dimensions; it continues to the right and below.") + '</div>' +
      '<div class="ls-highdim-selected" aria-live="polite"></div>' +
      '<div class="ls-highdim-scroll"><table><thead>' + head + '</thead><tbody>' + body + more + '</tbody></table></div>' +
      '<p class="ls-highdim-foot">' + (DE ? "3D reicht nicht, so wie 1D nicht gereicht hat: Manche Unterschiede brauchen eigene Richtungen. Auch mit 4096 Dimensionen gelten dieselben Regeln; Mittelpunkt, Winkel und Matrixmultiplikation funktionieren koordinatenweise weiter." : "3D is not enough, just as 1D was not enough: some differences need their own directions. Even with 4096 dimensions the same rules apply; midpoint, angle, and matrix multiplication still work coordinate by coordinate.") + '</p>';
    root.appendChild(el);
    var selectedEl = el.querySelector(".ls-highdim-selected");
    function showSelected(ti) {
      selected = ti;
      el.querySelectorAll("tbody tr[data-token]").forEach(function (row) {
        row.classList.toggle("is-on", parseInt(row.getAttribute("data-token"), 10) === selected);
      });
      var vals = [];
      for (var k = 0; k < 4; k++) vals.push("d" + (k + 1) + " " + value(selected, k));
      selectedEl.innerHTML = '<span><b>' + esc(tokens[selected]) + '</b></span><span>' + vals.join(" · ") + '</span><span>…</span>';
    }
    el.querySelectorAll("tbody tr[data-token]").forEach(function (row) {
      row.addEventListener("click", function () { showSelected(parseInt(row.getAttribute("data-token"), 10)); });
    });
    showSelected(selected);
    return { update: function () {}, resize: function () {}, destroy: function () { el.remove(); } };
  }
  core.register("highdim", highdimScene);
})();
