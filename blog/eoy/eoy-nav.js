/* Legacy loader kept for cached pages that still reference eoy-nav.js.
   It never creates a top bar; if the server-rendered nav is missing it adds
   the same bottom-left/bottom-right buttons. */
(function () {
  "use strict";
  function find(n) { return document.querySelector(n); }
  function install() {
    if (window.__eoyEmbedNavInstalled || window.__eoyLegacyNavInstalled) return;
    var prev = find("[data-eoy-prev]");
    var next = find("[data-eoy-next]");
    if (!prev || !next) {
      var bar = document.createElement("div");
      bar.id = "eoy-embed-nav";
      bar.setAttribute("style", "position:fixed;left:0;right:0;bottom:0;z-index:2147483000;pointer-events:none");
      function mk(attr, side, text) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute(attr, "");
        b.textContent = text;
        b.setAttribute("style", "position:fixed;" + side + ":14px;bottom:14px;z-index:2147483000;display:inline-flex;align-items:center;justify-content:center;min-width:120px;min-height:44px;padding:0 16px;border:1px solid #4f8b3c;background:#63a44b;color:#fff;font:600 15px/1 'Open Sans',system-ui,sans-serif;cursor:pointer;box-shadow:0 3px 14px rgba(0,20,30,.18);pointer-events:auto");
        bar.appendChild(b);
        return b;
      }
      prev = mk("data-eoy-prev", "left", "← Zurück");
      next = mk("data-eoy-next", "right", "Weiter →");
      document.body.appendChild(bar);
    }
    var s = document.createElement("script");
    s.src = "eoy-embed-nav.js";
    document.body.appendChild(s);
    window.__eoyLegacyNavInstalled = true;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
