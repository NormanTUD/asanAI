/* Independent eoy navigation fix. New filename on purpose: bypasses caches
   that still serve an older learnsys.js / eoy-nav.js. */
(function () {
  "use strict";
  function styled(el, side) {
    var s = el.style;
    s.setProperty("position", "fixed", "important");
    s.setProperty("bottom", "14px", "important");
    s.setProperty(side, "14px", "important");
    s.setProperty("top", "auto", "important");
    s.setProperty("z-index", "2147483000", "important");
    try { el.setAttribute("popover", "manual"); } catch (e) {}
    s.setProperty("min-width", "120px", "important");
    s.setProperty("min-height", "44px", "important");
    s.setProperty("padding", "0 16px", "important");
    s.setProperty("display", "inline-flex", "important");
    s.setProperty("align-items", "center", "important");
    s.setProperty("justify-content", "center", "important");
    s.setProperty("text-align", "center", "important");
    s.setProperty("border", "1px solid #4f8b3c", "important");
    s.setProperty("background", "#63a44b", "important");
    s.setProperty("color", "#fff", "important");
    s.setProperty("font", "600 15px/1 'Open Sans', system-ui, sans-serif", "important");
    s.setProperty("cursor", "pointer", "important");
    s.setProperty("box-shadow", "0 3px 14px rgba(0,20,30,.18)", "important");
  }

  function removeStray() {
    var els = document.querySelectorAll(".eoy-nav");
    for (var i = 0; i < els.length; i++) if (els[i].parentNode) els[i].parentNode.removeChild(els[i]);
    var kids = document.body ? document.body.children : [];
    for (var k = 0; k < kids.length; k++) {
      var kid = kids[k];
      if (!kid || kid.id === "learnsys" || kid.id === "eoy-embed-nav" || kid.tagName !== "DIV") continue;
      if (kid.querySelector && kid.querySelectorAll("button").length && /weiter|next|zurück|back/i.test(kid.textContent || "")) {
        kid.parentNode.removeChild(kid);
      }
    }
    var alt = document.getElementById("eoy-embed-nav");
    if (alt) alt.style.setProperty("display", "none", "important");
    var lb = document.querySelector(".ls-bottom-nav");
    if (lb) lb.style.setProperty("display", "none", "important");
  }

  function canPrev() {
    try { if (window.LearnSys && typeof LearnSys.canPrev === "function") return !!LearnSys.canPrev(); } catch (e) {}
    var b = document.getElementById("ls-prev");
    return b ? !b.hidden : false;
  }
  function canNext() {
    try { if (window.LearnSys && typeof LearnSys.canNext === "function") return !!LearnSys.canNext(); } catch (e) {}
    var b = document.getElementById("ls-next");
    return b ? !b.hidden : false;
  }
  function goPrev() {
    if (window.LearnSys && typeof LearnSys.prev === "function") return LearnSys.prev();
    var b = document.getElementById("ls-prev"); if (b) b.click();
  }
  function goNext() {
    if (window.LearnSys && typeof LearnSys.next === "function") return LearnSys.next();
    var b = document.getElementById("ls-next"); if (b) b.click();
  }

  function pop(btn, show) {
    try {
      if (!btn || typeof btn.showPopover !== "function") return;
      var open = btn.matches && btn.matches(":popover-open");
      if (show && !open) btn.showPopover();
      else if (!show && open) btn.hidePopover();
    } catch (e) {}
  }

  function install() {
    if (window.__navFixInstalled) return;
    window.__navFixInstalled = true;
    var de = !(window.TM && typeof TM.lang === "function") || TM.lang() === "de";

    // Reuse the buttons learnsys.js may already have created; otherwise make
    // our own, independent of the server-rendered markup.
    var prev = document.getElementById("ls-quick-prev");
    var next = document.getElementById("ls-quick-next");
    var ownedPrev = !prev, ownedNext = !next;
    if (!prev) {
      prev = document.createElement("button");
      prev.type = "button"; prev.id = "navfix-prev";
      prev.textContent = de ? "← Zurück" : "← Back";
      document.body.appendChild(prev);
    }
    if (!next) {
      next = document.createElement("button");
      next.type = "button"; next.id = "navfix-next";
      next.textContent = de ? "Weiter →" : "Next →";
      document.body.appendChild(next);
    }
    styled(prev, "left");
    styled(next, "right");
    prev.textContent = de ? "← Zurück" : "← Back";
    next.textContent = de ? "Weiter →" : "Next →";

    if (ownedPrev) prev.addEventListener("click", function () { goPrev(); setTimeout(update, 120); });
    if (ownedNext) next.addEventListener("click", function () { goNext(); setTimeout(update, 120); });

    function update() {
      removeStray();
      var ready = window.__lsPageReady === true && window.__lsDemoLoading !== true;
      var p = ready && canPrev(), n = ready && canNext();
      prev.style.setProperty("display", p ? "inline-flex" : "none", "important");
      next.style.setProperty("display", n ? "inline-flex" : "none", "important");
      pop(prev, p); pop(next, n);
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: "ls-nav-state", prev: !!p, next: !!n }, "*");
        }
      } catch (e) {}
    }

    var main = document.querySelector(".ls-main");
    if (main) main.style.setProperty("padding-bottom", "72px", "important");
    update();
    setInterval(update, 250);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    document.addEventListener("keyup", function () { setTimeout(update, 0); });
    window.addEventListener("resize", update);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();

/* Hide the full-page loader once everything has loaded. */
(function () {
  "use strict";
  function done() {
    window.__lsPageReady = true;
    if (document.body) document.body.classList.add("ls-loaded");
    var l = document.getElementById("ls-page-loader");
    if (!l) return;
    try { if (l.tagName === "DIALOG" && l.close) l.close(); } catch (e) {}
    if (l.parentNode) l.parentNode.removeChild(l);
  }
  if (document.readyState === "complete") setTimeout(done, 120);
  else window.addEventListener("load", function () { setTimeout(done, 120); });
  window.addEventListener("pageshow", function (e) { if (e.persisted) done(); });
  setTimeout(done, 9000);
})();
