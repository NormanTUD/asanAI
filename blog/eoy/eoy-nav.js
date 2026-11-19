/*
 * Always-visible navigation for the eoy lesson embeds.
 *
 * The lesson's own bottom bar is position:fixed, which lands at the bottom of
 * a tall iframe and is often invisible. This script adds a small fixed bar at
 * the top of the iframe and drives LearnSys.next/prev (or the lesson's own
 * buttons as a fallback).
 *
 * Loaded from _page.php after data.js: <script src="eoy-nav.js">.
 */
(function () {
  "use strict";
  if (window.__eoyNavInstalled) return;

  function entryNumber() {
    var body = document.body;
    var resolved = body ? parseInt(body.getAttribute("data-eoy-resolved") || "", 10) : 0;
    if (resolved > 0) return resolved;
    var m = (location.pathname + location.search + location.hash).match(/eoy(?:%2F|\/)(\d+)/i);
    if (m) return parseInt(m[1], 10);
    return typeof window.EOY_DAY === "number" ? window.EOY_DAY : 0;
  }

  function lang() {
    if (window.TM && typeof TM.lang === "function") return TM.lang();
    return (document.documentElement.lang || "en").indexOf("de") === 0 ? "de" : "en";
  }

  function baseButton(id) {
    return document.getElementById(id);
  }

  function visible(el) {
    if (!el) return false;
    if (el.hidden) return false;
    var s = window.getComputedStyle(el);
    return s.display !== "none" && s.visibility !== "hidden";
  }

  function canNext() {
    if (window.LearnSys && typeof LearnSys.canNext === "function") return !!LearnSys.canNext();
    var n = baseButton("ls-next");
    return n ? visible(n) : true;
  }

  function canPrev() {
    if (window.LearnSys && typeof LearnSys.canPrev === "function") return !!LearnSys.canPrev();
    var p = baseButton("ls-prev");
    return p ? visible(p) : true;
  }

  function goNext() {
    if (window.LearnSys && typeof LearnSys.next === "function") { LearnSys.next(); return; }
    var n = baseButton("ls-next");
    if (n) n.click();
  }

  function goPrev() {
    if (window.LearnSys && typeof LearnSys.prev === "function") { LearnSys.prev(); return; }
    var p = baseButton("ls-prev");
    if (p) p.click();
  }

  function install() {
    if (window.__eoyNavInstalled) return;
    if (!entryNumber()) return;
    if (!document.querySelector(".ls-app")) return;
    window.__eoyNavInstalled = true;

    var de = lang() === "de";
    var style = document.createElement("style");
    style.textContent =
      ".eoy-nav{position:fixed;top:10px;left:12px;right:12px;z-index:2147483000;display:flex;justify-content:space-between;pointer-events:none}" +
      ".eoy-nav button{pointer-events:auto;min-width:120px;min-height:42px;padding:0 16px;border:1px solid #4f8b3c;background:#63a44b;color:#fff;font:600 15px/1 'Open Sans',system-ui,sans-serif;cursor:pointer;box-shadow:0 3px 14px rgba(0,20,30,.18)}" +
      ".eoy-nav button:hover{background:#558c3f}" +
      ".eoy-nav button[hidden]{display:none!important}" +
      ".eoy-nav button:disabled{opacity:.35;cursor:default}" +
      ".ls-bottom-nav{display:none!important}";
    document.head.appendChild(style);

    var bar = document.createElement("div");
    bar.className = "eoy-nav";
    var prev = document.createElement("button");
    prev.type = "button";
    prev.textContent = de ? "← Zurück" : "← Back";
    var next = document.createElement("button");
    next.type = "button";
    next.textContent = de ? "Weiter →" : "Next →";
    bar.appendChild(prev);
    bar.appendChild(next);
    document.body.appendChild(bar);

    // Make room so the fixed bar does not cover the lesson header.
    var main = document.querySelector(".ls-main");
    if (main) {
      var pad = parseFloat(window.getComputedStyle(main).paddingTop) || 0;
      if (pad < 42) main.style.paddingTop = "58px";
    }

    prev.addEventListener("click", function () { goPrev(); update(); setTimeout(update, 120); });
    next.addEventListener("click", function () { goNext(); update(); setTimeout(update, 120); });

    function update() {
      var p = canPrev();
      var n = canNext();
      prev.hidden = !p;
      next.hidden = !n;
      prev.disabled = !p;
      next.disabled = !n;
      bar.style.display = (p || n) ? "flex" : "none";
    }

    update();
    setInterval(update, 250);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    document.addEventListener("keyup", function () { setTimeout(update, 0); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
