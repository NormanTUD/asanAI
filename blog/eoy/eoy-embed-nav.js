/*
 * Wire the server-rendered eoy navigation (see _page.php) to LearnSys.
 * The buttons themselves are plain HTML so they are positioned even if the
 * proxy caches or strips scripts.
 */
(function () {
  "use strict";

  function buttons() {
    var nav = document.getElementById("eoy-embed-nav");
    if (!nav) return { prev: null, next: null };
    return {
      prev: nav.querySelector("[data-eoy-prev]") || nav.querySelector(".eoy-prev") || nav.querySelector("button"),
      next: nav.querySelector("[data-eoy-next]") || nav.querySelector(".eoy-next") || nav.querySelectorAll("button")[1]
    };
  }

  function canPrev() {
    try { if (window.LearnSys && typeof LearnSys.canPrev === "function") return !!LearnSys.canPrev(); } catch (e) {}
    var p = document.getElementById("ls-prev");
    return p ? !p.hidden : false;
  }

  function canNext() {
    try { if (window.LearnSys && typeof LearnSys.canNext === "function") return !!LearnSys.canNext(); } catch (e) {}
    var n = document.getElementById("ls-next");
    return n ? !n.hidden : false;
  }

  function goPrev() {
    if (window.LearnSys && typeof LearnSys.prev === "function") { LearnSys.prev(); return; }
    var p = document.getElementById("ls-prev");
    if (p) p.click();
  }

  function goNext() {
    if (window.LearnSys && typeof LearnSys.next === "function") { LearnSys.next(); return; }
    var n = document.getElementById("ls-next");
    if (n) n.click();
  }

  function install() {
    if (window.__eoyEmbedNavInstalled) return;
    var b = buttons();
    if (!b.prev || !b.next) return;
    window.__eoyEmbedNavInstalled = true;

    // Apply the layout at runtime as well: server-side sanitizers (WordPress
    // proxy/KSES) can strip <style> blocks and style="" attributes.
    var nav = document.getElementById("eoy-embed-nav");
    if (nav) {
      nav.style.position = "fixed";
      nav.style.left = "0";
      nav.style.right = "0";
      nav.style.bottom = "0";
      nav.style.zIndex = "2147483000";
      nav.style.pointerEvents = "none";
    }
    function place(btn, side) {
      btn.style.position = "fixed";
      btn.style.bottom = "14px";
      btn.style[side] = "14px";
      btn.style.display = "inline-flex";
      btn.style.alignItems = "center";
      btn.style.justifyContent = "center";
      btn.style.minWidth = "120px";
      btn.style.minHeight = "44px";
      btn.style.padding = "0 16px";
      btn.style.border = "1px solid #4f8b3c";
      btn.style.background = "#63a44b";
      btn.style.color = "#fff";
      btn.style.font = "600 15px/1 'Open Sans', system-ui, sans-serif";
      btn.style.cursor = "pointer";
      btn.style.pointerEvents = "auto";
      btn.style.boxShadow = "0 3px 14px rgba(0,20,30,.18)";
      btn.style.zIndex = "2147483000";
    }
    place(b.prev, "left");
    place(b.next, "right");

    var de = !(window.TM && typeof TM.lang === "function") || TM.lang() === "de";
    b.prev.textContent = de ? "← Zurück" : "← Back";
    b.next.textContent = de ? "Weiter →" : "Next →";

    b.prev.addEventListener("click", function () { goPrev(); update(); setTimeout(update, 140); });
    b.next.addEventListener("click", function () { goNext(); update(); setTimeout(update, 140); });

    function update() {
      var ready = window.__lsPageReady === true;
      var p = ready && canPrev();
      var n = ready && canNext();
      b.prev.hidden = !p;
      b.next.hidden = !n;
      // Inline display beats the UA [hidden] rule, so toggle it explicitly.
      b.prev.style.display = p ? "inline-flex" : "none";
      b.next.style.display = n ? "inline-flex" : "none";
    }

    update();
    setInterval(update, 250);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    document.addEventListener("keyup", function () { setTimeout(update, 0); });
    window.addEventListener("resize", update);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
