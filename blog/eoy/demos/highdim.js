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
    var DIMS = 16;
    var TOTAL = 4096;
    var selected = 3;
    function tokenLabel(t) { return t === "Ġ" ? "␣" : t; }
    function value(ti, j) {
      var x = Math.sin((ti + 1) * 12.9898 + (j + 1) * 78.233) * 43758.5453;
      x = x - Math.floor(x);
      return (x * 2 - 1);
    }
    function valueText(ti, j) { return value(ti, j).toFixed(2); }
    function cellColor(v) {
      var a = 0.10 + Math.abs(v) * 0.72;
      return v >= 0 ? "rgba(99,164,75," + a.toFixed(2) + ")" : "rgba(18,117,172," + a.toFixed(2) + ")";
    }
    function rowHTML(tok, ti) {
      var cells = "";
      for (var j = 0; j < DIMS; j++) {
        var v = value(ti, j);
        cells += '<div class="ls-highdim-cell" data-token="' + ti + '" data-dim="' + j + '" style="background:' + cellColor(v) + '"></div>';
      }
      return '<div class="ls-highdim-row' + (ti === selected ? " is-on" : "") + '" data-token="' + ti + '"><div class="ls-highdim-row-label"><span>' + esc(tokenLabel(tok.t)) + '</span><small>' + tok.id + '</small></div>' + cells + '</div>';
    }
    var head = '<div class="ls-highdim-row ls-highdim-head"><div class="ls-highdim-row-label">' + esc(DE ? "Token" : "token") + '</div>';
    for (var d = 0; d < DIMS; d++) head += '<div class="ls-highdim-dim">d' + (d + 1) + '</div>';
    head += '</div>';
    var el = document.createElement("div");
    el.className = "ls-highdim-scene";
    el.innerHTML =
      '<div class="ls-highdim-hero">' +
        '<div class="ls-highdim-hero-copy">' +
          '<span class="ls-highdim-kicker">' + esc(DE ? "Hochdimensionaler Vektor" : "High-dimensional vector") + '</span>' +
          '<h2>' + esc(DE ? "Ein Token, 4096 Dimensionen" : "One token, 4,096 dimensions") + '</h2>' +
          '<p>' + esc(DE ? "Rechts ist nur ein Ausschnitt: 16 der 4096 gelernten Merkmale. Jede Zelle ist ein Wert; klicke eine Zeile, um den Token zu wechseln." : "On the right is only a slice: 16 of the 4,096 learned features. Each cell is a value; click a row to switch the token.") + '</p>' +
        '</div>' +
        '<div class="ls-highdim-selected" aria-live="polite"></div>' +
      '</div>' +
      '<div class="ls-highdim-card">' +
        '<div class="ls-highdim-card-head"><b>' + esc(DE ? "16 von 4096 Dimensionen" : "16 of 4,096 dimensions") + '</b><span>' + esc(DE ? "Farbe = Wert · Klick = Token" : "colour = value · click = token") + '</span></div>' +
        '<div class="ls-highdim-grid">' + head + tokens.map(function (tok, ti) { return rowHTML(tok, ti); }).join("") + '</div>' +
        '<div class="ls-highdim-foot">' + esc(DE ? "… 4080 weitere Dimensionen" : "… 4,080 more dimensions") + '</div>' +
        '<div class="ls-highdim-tip" hidden></div>' +
      '</div>';
    root.appendChild(el);
    var selectedEl = el.querySelector(".ls-highdim-selected");
    var tipEl = el.querySelector(".ls-highdim-tip");
    function showTip(cell) {
      if (!tipEl) return;
      var ti = parseInt(cell.getAttribute("data-token"), 10);
      var d = parseInt(cell.getAttribute("data-dim"), 10);
      var tok = tokens[ti];
      if (!tok) return;
      tipEl.innerHTML = '<b>' + esc(tok.name || tokenLabel(tok.t)) + '</b><span>d' + (d + 1) + '</span><em>' + valueText(ti, d) + '</em>';
      tipEl.hidden = false;
      var card = tipEl.parentNode;
      var cr = card.getBoundingClientRect();
      var rr = cell.getBoundingClientRect();
      var left = rr.left - cr.left + rr.width / 2 - tipEl.offsetWidth / 2;
      var top = rr.top - cr.top - tipEl.offsetHeight - 7;
      if (top < 0) top = rr.bottom - cr.top + 7;
      tipEl.style.left = Math.max(4, Math.min(cr.width - tipEl.offsetWidth - 4, left)) + "px";
      tipEl.style.top = top + "px";
    }
    function hideTip() {
      if (tipEl) tipEl.hidden = true;
    }
    function showSelected(ti) {
      selected = ti;
      el.querySelectorAll(".ls-highdim-row[data-token]").forEach(function (row) {
        row.classList.toggle("is-on", parseInt(row.getAttribute("data-token"), 10) === selected);
      });
      var tok = tokens[selected];
      var chips = [];
      for (var d = 0; d < 8; d++) chips.push('<span>d' + (d + 1) + ' ' + valueText(selected, d) + '</span>');
      selectedEl.innerHTML = '<div class="ls-highdim-sel-head"><b>' + esc(tok.name || tokenLabel(tok.t)) + '</b><small>id ' + tok.id + '</small></div>' +
        '<div class="ls-highdim-sel-meta">' + esc(DE ? "4096 Dimensionen" : "4,096 dimensions") + ' · ' + esc(DE ? "8 Werte" : "8 values") + '</div>' +
        '<div class="ls-highdim-chips">' + chips.join("") + '</div>';
    }
    el.querySelectorAll(".ls-highdim-cell").forEach(function (cell) {
      cell.addEventListener("mouseenter", function () { showTip(cell); });
      cell.addEventListener("mouseleave", hideTip);
      cell.addEventListener("click", function () { showSelected(parseInt(cell.getAttribute("data-token"), 10)); });
    });
    showSelected(selected);
    return { update: function () {}, resize: function () {}, destroy: function () { el.remove(); } };
  }
  core.register("highdim", highdimScene);
})();
