(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var esc = core.esc;
  function highdimScene(root, api) {
    var DE = api.lang === "de";
    var tokens = [
      { t: "The", id: 464 },
      { t: " capital", id: 3139 },
      { t: " of", id: 286 },
      { t: " France", id: 4881 },
      { t: " is", id: 318 },
      { t: " city", id: 1748 },
      { t: " river", id: 7850 },
      { t: " bank", id: 3331 },
      { t: " money", id: 1637 },
      { t: " king", id: 5822 },
      { t: " queen", id: 16599 },
      { t: " animal", id: 5044 },
      { t: " street", id: 4675 },
      { t: " water", id: 1660 }
    ];
    var cols = 14;
    var selected = 3;
    function value(ti, j) {
      var x = Math.sin((ti + 1) * 12.9898 + (j + 1) * 78.233) * 43758.5453;
      x = x - Math.floor(x);
      return (x * 2 - 1).toFixed(2);
    }
    function tokenLabel(t) { return t.charAt(0) === " " ? "␣" + t.slice(1) : t; }
    var colgroup = '<colgroup><col class="ls-highdim-token-col">';
    for (var c = 0; c < cols; c++) colgroup += "<col>";
    colgroup += '<col class="ls-highdim-ellipsis-col"></colgroup>';
    var head = '<tr><th></th>';
    for (var j = 0; j < cols; j++) head += '<th>d' + (j + 1) + '</th>';
    head += '<th class="ls-highdim-ellipsis">…</th></tr>';
    var body = tokens.map(function (tok, ti) {
      var cells = '';
      for (var k = 0; k < cols; k++) cells += '<td>' + value(ti, k) + '</td>';
      return '<tr data-token="' + ti + '"' + (ti === selected ? ' class="is-on"' : '') + '><th><span class="ls-highdim-token">' + esc(tokenLabel(tok.t)) + '</span><small>' + tok.id + '</small></th>' + cells + '<td class="ls-highdim-ellipsis">…</td></tr>';
    }).join("");
    var more = '<tr class="is-ellipsis"><td colspan="' + (cols + 2) + '">…</td></tr>';
    var el = document.createElement("div");
    el.className = "ls-highdim-scene";
    el.innerHTML =
      '<div class="ls-highdim-note"><b>' + (DE ? "Jede Zeile ist die Position eines Tokens, jede Spalte eine Dimension." : "Each row is a token's position, each column a dimension.") + '</b> ' +
        (DE ? "Reale GPT-2-Tokens und IDs. Ausschnitt: 14 von 4096 Dimensionen; rechts und unten geht es weiter." : "Real GPT-2 tokens and IDs. Slice: 14 of 4096 dimensions; it continues to the right and below.") + '</div>' +
      '<div class="ls-highdim-selected" aria-live="polite"></div>' +
      '<div class="ls-highdim-scroll"><table>' + colgroup + '<thead>' + head + '</thead><tbody>' + body + more + '</tbody></table></div>' +
      '<p class="ls-highdim-foot">' + (DE ? "3D reicht nicht, so wie 1D nicht gereicht hat: Manche Unterschiede brauchen eigene Richtungen. Auch mit 4096 Dimensionen gelten dieselben Regeln; Differenz, Winkel und Matrixmultiplikation funktionieren koordinatenweise weiter." : "3D is not enough, just as 1D was not enough: some differences need their own directions. Even with 4096 dimensions the same rules apply; difference, angle, and matrix multiplication still work coordinate by coordinate.") + '</p>';
    root.appendChild(el);
    var selectedEl = el.querySelector(".ls-highdim-selected");
    function showSelected(ti) {
      selected = ti;
      el.querySelectorAll("tbody tr[data-token]").forEach(function (row) {
        row.classList.toggle("is-on", parseInt(row.getAttribute("data-token"), 10) === selected);
      });
      var vals = [];
      for (var k = 0; k < 4; k++) vals.push("d" + (k + 1) + " " + value(selected, k));
      selectedEl.innerHTML = '<span><b>' + esc(tokenLabel(tokens[selected].t)) + '</b></span><span>id ' + tokens[selected].id + '</span><span>' + vals.join(" · ") + '</span><span>…</span>';
    }
    el.querySelectorAll("tbody tr[data-token]").forEach(function (row) {
      row.addEventListener("click", function () { showSelected(parseInt(row.getAttribute("data-token"), 10)); });
    });
    showSelected(selected);
    return { update: function () {}, resize: function () {}, destroy: function () { el.remove(); } };
  }
  core.register("highdim", highdimScene);
})();
