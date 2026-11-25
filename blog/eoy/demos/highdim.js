(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var esc = core.esc;
  function highdimScene(root, api) {
    var DE = api.lang === "de";
    var tokens = [
      { t: "Ġ", id: 220, name: DE ? "Leerzeichen" : "space" },
      { t: "The", id: 464 },
      { t: "the", id: 1169 },
      { t: "Paris", id: 40313 },
      { t: "London", id: 23421 },
      { t: "France", id: 28572 },
      { t: "Germany", id: 27079 },
      { t: "capital", id: 27544 },
      { t: "city", id: 19205 },
      { t: "river", id: 38291 },
      { t: "bank", id: 17796 },
      { t: "money", id: 26316 },
      { t: "king", id: 3364 },
      { t: "animal", id: 41607 }
    ];
    var cols = 16;
    var selected = 3;
    function value(ti, j) {
      var x = Math.sin((ti + 1) * 12.9898 + (j + 1) * 78.233) * 43758.5453;
      x = x - Math.floor(x);
      return (x * 2 - 1).toFixed(2);
    }
    function tokenLabel(t) { return t === "Ġ" ? "␣" : t; }
    var colgroup = '<colgroup><col class="ls-highdim-token-col">';
    for (var c = 0; c < cols; c++) colgroup += "<col>";
    colgroup += '<col class="ls-highdim-ellipsis-col"></colgroup>';
    var head = '<tr data-tip="' + (DE ? "Jede Spalte ist eine Embedding-Dimension; die Zeile zeigt die ersten Werte." : "Each column is one embedding dimension; the row shows the first values.") + '"><th></th>';
    for (var j = 0; j < cols; j++) head += '<th>d' + (j + 1) + '</th>';
    head += '<th class="ls-highdim-ellipsis">…</th></tr>';
    var body = tokens.map(function (tok, ti) {
      var cells = '';
      for (var k = 0; k < cols; k++) cells += '<td>' + value(ti, k) + '</td>';
      var rowTip = "Token " + esc(tokenLabel(tok.t)) + ", id " + tok.id + ": d1 " + value(ti, 0) + ", d2 " + value(ti, 1) + ", d3 " + value(ti, 2) + ". " + (DE ? "Klicken zeigt die ersten Werte oben." : "Click to show the first values above.");
      return '<tr data-token="' + ti + '" data-tip="' + rowTip + '"' + (ti === selected ? ' class="is-on"' : '') + '><th><span class="ls-highdim-token">' + esc(tokenLabel(tok.t)) + '</span><small>' + tok.id + '</small></th>' + cells + '<td class="ls-highdim-ellipsis">…</td></tr>';
    }).join("");
    var more = '<tr class="is-ellipsis" data-tip="' + (DE ? "Die Tabelle geht weiter; nur ein kleiner Ausschnitt des Vektors ist zu sehen." : "The table continues; only a small slice of the vector is shown.") + '"><td colspan="' + (cols + 2) + '">…</td></tr>';
    var el = document.createElement("div");
    el.className = "ls-highdim-scene";
    el.innerHTML =
      '<div class="ls-highdim-selected" aria-live="polite"></div>' +
      '<div class="ls-highdim-scroll" data-tip="' + (DE ? "Scrolle horizontal, um mehr der 4096 Dimensionen zu sehen." : "Scroll horizontally to see more of the 4096 dimensions.") + '"><table>' + colgroup + '<thead>' + head + '</thead><tbody>' + body + more + '</tbody></table></div>';
    root.appendChild(el);
    var selectedEl = el.querySelector(".ls-highdim-selected");
    function showSelected(ti) {
      selected = ti;
      el.querySelectorAll("tbody tr[data-token]").forEach(function (row) {
        row.classList.toggle("is-on", parseInt(row.getAttribute("data-token"), 10) === selected);
      });
      var vals = [];
      for (var k = 0; k < 4; k++) vals.push("d" + (k + 1) + " " + value(selected, k));
      selectedEl.innerHTML = '<span><b>' + esc(tokens[selected].name || tokenLabel(tokens[selected].t)) + '</b></span><span>id ' + tokens[selected].id + '</span><span>' + vals.join(" · ") + '</span><span>…</span>';
    }
    el.querySelectorAll("tbody tr[data-token]").forEach(function (row) {
      row.addEventListener("click", function () { showSelected(parseInt(row.getAttribute("data-token"), 10)); });
    });
    showSelected(selected);
    return { update: function () {}, resize: function () {}, destroy: function () { el.remove(); } };
  }
  core.register("highdim", highdimScene);
})();
