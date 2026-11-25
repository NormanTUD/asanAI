(function () {
  "use strict";

  var THEME_KEY = "eoy_proto_theme";
  var LANG_KEY = "eoy_proto_lang";
  var root = document.documentElement;

  function safeGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) {}
  }
  function systemDark() {
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  var theme = safeGet(THEME_KEY) || (systemDark() ? "dark" : "light");
  var lang = safeGet(LANG_KEY) === "en" ? "en" : "de";

  root.setAttribute("data-theme", theme);
  root.setAttribute("lang", lang);

  var listeners = [];

  function t(de, en) { return lang === "en" ? en : de; }

  function applyText(scope) {
    var node = scope || document;
    var list = node.querySelectorAll("[data-de], [data-de-html], [data-de-aria]");
    Array.prototype.forEach.call(list, function (el) {
      if (el.hasAttribute("data-de")) {
        var val = el.getAttribute("data-" + lang);
        if (val != null) el.textContent = val;
      } else if (el.hasAttribute("data-de-html")) {
        var html = el.getAttribute("data-" + lang + "-html");
        if (html != null) el.innerHTML = html;
      } else if (el.hasAttribute("data-de-aria")) {
        var aria = el.getAttribute("data-" + lang + "-aria");
        if (aria != null) el.setAttribute("aria-label", aria);
      }
    });
  }

  function setLang(next) {
    lang = next === "en" ? "en" : "de";
    root.setAttribute("lang", lang);
    safeSet(LANG_KEY, lang);
    applyText(document);
    syncChrome();
    listeners.forEach(function (fn) { try { fn(lang); } catch (e) {} });
    try { window.dispatchEvent(new CustomEvent("proto:lang", { detail: { lang: lang } })); } catch (e) {}
  }

  function setTheme(next) {
    theme = next === "dark" ? "dark" : "light";
    root.setAttribute("data-theme", theme);
    safeSet(THEME_KEY, theme);
    syncChrome();
  }

  function toggleTheme() { setTheme(theme === "dark" ? "light" : "dark"); }
  function toggleLang() { setLang(lang === "de" ? "en" : "de"); }

  var chrome = null;
  function buildChrome() {
    if (document.body.getAttribute("data-no-chrome") != null) return;
    chrome = document.createElement("div");
    chrome.className = "proto-chrome";
    chrome.setAttribute("role", "group");
    chrome.innerHTML =
      '<button type="button" data-proto-theme></button>' +
      '<button type="button" data-proto-lang></button>';
    document.body.appendChild(chrome);
    chrome.querySelector("[data-proto-theme]").addEventListener("click", toggleTheme);
    chrome.querySelector("[data-proto-lang]").addEventListener("click", toggleLang);
    syncChrome();
  }

  function syncChrome() {
    if (!chrome) return;
    var themeBtn = chrome.querySelector("[data-proto-theme]");
    var langBtn = chrome.querySelector("[data-proto-lang]");
    if (themeBtn) {
      themeBtn.innerHTML = theme === "dark"
        ? '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.4" fill="currentColor"/><path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
        : '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.7 8.7 0 1 0 11.1 11.1Z" fill="currentColor"/></svg>';
      themeBtn.setAttribute("aria-label", t("Dunkles Design", "Dark theme"));
    }
    if (langBtn) {
      langBtn.textContent = lang === "de" ? "DE" : "EN";
      langBtn.setAttribute("aria-label", t("Auf Englisch wechseln", "Switch to German"));
    }
  }

  function ready() {
    applyText(document);
    buildChrome();
  }

  window.Proto = {
    t: t,
    lang: function () { return lang; },
    setLang: setLang,
    theme: function () { return theme; },
    setTheme: setTheme,
    toggleTheme: toggleTheme,
    toggleLang: toggleLang,
    applyText: applyText,
    onLang: function (fn) { if (typeof fn === "function") listeners.push(fn); },
    reduceMotion: function () {
      return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }
})();
