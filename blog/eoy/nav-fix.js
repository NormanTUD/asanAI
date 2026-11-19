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
    if (window.LearnSys && typeof LearnSys.canPrev === "function") return !!LearnSys.canPrev();
    var b = document.getElementById("ls-prev");
    return b ? !b.hidden : true;
  }
  function canNext() {
    if (window.LearnSys && typeof LearnSys.canNext === "function") return !!LearnSys.canNext();
    var b = document.getElementById("ls-next");
    return b ? !b.hidden : true;
  }
  function goPrev() {
    if (window.LearnSys && typeof LearnSys.prev === "function") return LearnSys.prev();
    var b = document.getElementById("ls-prev"); if (b) b.click();
  }
  function goNext() {
    if (window.LearnSys && typeof LearnSys.next === "function") return LearnSys.next();
    var b = document.getElementById("ls-next"); if (b) b.click();
  }

  function install() {
    if (window.__navFixInstalled) return;
    window.__navFixInstalled = true;
    var de = !(window.TM && typeof TM.lang === "function") || TM.lang() === "de";

    // Reuse the buttons learnsys.js may already have created; otherwise make
    // our own, independent of the server-rendered markup.
    var prev = document.getElementById("ls-quick-prev");
    var next = document.getElementById("ls-quick-next");
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

    prev.addEventListener("click", function () { goPrev(); setTimeout(update, 120); });
    next.addEventListener("click", function () { goNext(); setTimeout(update, 120); });

    function update() {
      removeStray();
      var p = canPrev(), n = canNext();
      prev.style.setProperty("display", p ? "inline-flex" : "none", "important");
      next.style.setProperty("display", n ? "inline-flex" : "none", "important");
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
