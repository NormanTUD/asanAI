(function () {
  "use strict";

  var STORAGE_KEY = "papers-progress-v1";
  var THEME_KEY = "papers-theme";
  var papers = ["kauffman", "anderson", "bertalanffy", "kolmogorov", "alexander"];

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function fmt(value, digits) {
    var places = typeof digits === "number" ? digits : 2;
    return Number(value).toFixed(places).replace(".", ",");
  }

  function readStore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function writeStore(store) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      return false;
    }
    return true;
  }

  function getPaper() {
    return document.body.dataset.paper || "";
  }

  function markVisited() {
    var slug = getPaper();
    if (!slug) return;
    var store = readStore();
    store.visited = store.visited || {};
    store.visited[slug] = Date.now();
    store.last = slug;
    writeStore(store);
  }

  function markComplete(slug) {
    var key = slug || getPaper();
    if (!key) return;
    var store = readStore();
    store.complete = store.complete || {};
    store.complete[key] = true;
    store.last = key;
    writeStore(store);
    updateProgressUI();
    document.dispatchEvent(new CustomEvent("papers:progress", { detail: { slug: key } }));
  }

  function unmarkComplete(slug) {
    var key = slug || getPaper();
    var store = readStore();
    if (store.complete) delete store.complete[key];
    writeStore(store);
    updateProgressUI();
    document.dispatchEvent(new CustomEvent("papers:progress", { detail: { slug: key } }));
  }

  function isComplete(slug) {
    var store = readStore();
    return !!(store.complete && store.complete[slug]);
  }

  function completedCount() {
    var store = readStore();
    return papers.reduce(function (sum, slug) {
      return sum + (store.complete && store.complete[slug] ? 1 : 0);
    }, 0);
  }

  function updateProgressUI() {
    var count = completedCount();
    var percent = Math.round((count / papers.length) * 100);
    $$("[data-progress-count]").forEach(function (el) {
      el.textContent = count + " / " + papers.length;
    });
    $$("[data-progress-percent]").forEach(function (el) {
      el.textContent = percent + "%";
    });
    $$("[data-progress-ring]").forEach(function (ring) {
      var radius = Number(ring.dataset.radius || 32);
      var circumference = 2 * Math.PI * radius;
      ring.style.strokeDasharray = circumference;
      ring.style.strokeDashoffset = String(circumference * (1 - count / papers.length));
    });
    $$("[data-paper-status]").forEach(function (el) {
      var done = isComplete(el.dataset.paperStatus);
      el.classList.toggle("is-done", done);
      el.textContent = done ? "abgeschlossen" : "offen";
    });
  }

  function initTheme() {
    var root = document.documentElement;
    var toggles = $$("[data-theme-toggle]");
    function apply(theme) {
      root.dataset.theme = theme;
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (error) {}
      toggles.forEach(function (button) {
        var label = button.querySelector("[data-theme-label]");
        if (label) label.textContent = theme === "dark" ? "Leselicht" : "Nachtlicht";
        button.setAttribute("aria-label", theme === "dark" ? "Helles Leselicht einschalten" : "Dunkles Nachtlicht einschalten");
        button.setAttribute("aria-pressed", String(theme === "light"));
      });
      document.dispatchEvent(new CustomEvent("papers:theme", { detail: { theme: theme } }));
    }
    toggles.forEach(function (button) {
      button.addEventListener("click", function () {
        apply(root.dataset.theme === "dark" ? "light" : "dark");
      });
    });
    apply(root.dataset.theme === "light" ? "light" : "dark");
  }

  function renderTex(target) {
    if (!window.temml || typeof window.temml.renderToString !== "function") return;
    var tex = target.getAttribute("data-tex");
    if (!tex) return;
    var display = target.hasAttribute("data-display");
    try {
      target.innerHTML = window.temml.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        annotate: false
      });
      target.classList.add("is-rendered");
    } catch (error) {
      target.textContent = tex;
    }
  }

  function initMath() {
    $$("[data-tex]").forEach(renderTex);
    document.addEventListener("papers:theme", function () {
      $$("[data-tex]").forEach(renderTex);
    });
  }

  function initReveal() {
    var nodes = $$(".section__head, .lab, .checkpoint, .idea-grid, .math-card, .end-card, .paper-card, .thesis, .ladder, .source-item");
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (node) {
        node.classList.add("reveal", "is-in");
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    nodes.forEach(function (node) {
      node.classList.add("reveal");
      observer.observe(node);
    });
  }

  function initScrollProgress() {
    var bar = $(".scroll-progress__bar");
    if (!bar) return;
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var progress = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      bar.style.width = (progress * 100).toFixed(2) + "%";
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function initChapterNav() {
    var links = $$(".chapter-nav a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = new Map();
    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (section) map.set(section, link);
    });
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.classList.remove("is-active");
          });
          var link = map.get(entry.target);
          if (link) link.classList.add("is-active");
        });
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0 }
    );
    map.forEach(function (link, section) {
      observer.observe(section);
    });
  }

  function initQuiz() {
    $$(".checkpoint").forEach(function (checkpoint) {
      var feedback = $(".checkpoint__feedback", checkpoint);
      var choices = $$(".choice", checkpoint);
      var right = checkpoint.dataset.right || "Genau. Du hast den Kern getroffen.";
      var wrong = checkpoint.dataset.wrong || "Noch nicht ganz. Lies den Abschnitt noch einmal und probiere es erneut.";
      choices.forEach(function (choice) {
        choice.setAttribute("aria-pressed", "false");
        choice.addEventListener("click", function () {
          var correct = choice.dataset.correct === "true";
          choices.forEach(function (item) {
            item.classList.remove("is-correct", "is-wrong");
            item.setAttribute("aria-pressed", "false");
            var mark = $(".choice__mark", item);
            if (mark) mark.textContent = item.dataset.mark || "○";
          });
          choice.classList.add(correct ? "is-correct" : "is-wrong");
          choice.setAttribute("aria-pressed", "true");
          var mark = $(".choice__mark", choice);
          if (mark) mark.textContent = correct ? "✓" : "×";
          if (feedback) feedback.textContent = correct ? right : wrong;
          checkpoint.dataset.solved = correct ? "true" : "false";
        });
      });
    });
  }

  function initLadder() {
    $$("[data-ladder]").forEach(function (ladder) {
      var buttons = $$("button[aria-expanded]", ladder);
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          var row = button.closest(".ladder__level");
          var open = row.classList.toggle("is-open");
          button.setAttribute("aria-expanded", String(open));
        });
      });
    });
  }

  function initReadingTime() {
    var blocks = $$(".prose");
    if (!blocks.length) return;
    var words = 0;
    blocks.forEach(function (block) {
      words += block.textContent.trim().split(/\s+/).filter(Boolean).length;
    });
    var minutes = Math.max(1, Math.round(words / 210));
    $$("[data-reading-time]").forEach(function (el) {
      el.textContent = minutes + " Min.";
    });
  }

  function initCompleteButtons() {
    $$("[data-complete-paper]").forEach(function (button) {
      var slug = button.dataset.completePaper || getPaper();
      function paint() {
        var done = isComplete(slug);
        button.dataset.complete = String(done);
        button.textContent = done ? "Etappe abgeschlossen ✓" : "Etappe abschließen";
        button.setAttribute("aria-pressed", String(done));
      }
      button.addEventListener("click", function () {
        if (isComplete(slug)) unmarkComplete(slug);
        else markComplete(slug);
        paint();
      });
      paint();
    });
    document.addEventListener("papers:progress", function (event) {
      if (event.detail && event.detail.slug === getPaper()) {
        $$("[data-complete-paper]").forEach(function (button) {
          var slug = button.dataset.completePaper || getPaper();
          var done = isComplete(slug);
          button.dataset.complete = String(done);
          button.textContent = done ? "Etappe abgeschlossen ✓" : "Etappe abschließen";
          button.setAttribute("aria-pressed", String(done));
        });
      }
    });
  }

  function initKeys() {
    document.addEventListener("keydown", function (event) {
      var tag = (event.target && event.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || (event.target && event.target.isContentEditable)) return;
      if (event.key === "t" || event.key === "T") {
        var toggle = $("[data-theme-toggle]");
        if (toggle) toggle.click();
      }
    });
  }

  function initProgressUI() {
    updateProgressUI();
    document.addEventListener("papers:progress", updateProgressUI);
  }

  function setupCanvas(canvas, width, height) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.aspectRatio = width + " / " + height;
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: width, h: height, dpr: dpr };
  }

  function cssColor(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function roundRect(ctx, x, y, width, height, radius) {
    var r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function seededRandom(seed) {
    var value = seed >>> 0;
    return function () {
      value += 0x6D2B79F5;
      var t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  window.MP = {
    $: $,
    $$: $$,
    clamp: clamp,
    lerp: lerp,
    fmt: fmt,
    papers: papers,
    readStore: readStore,
    writeStore: writeStore,
    progress: completedCount,
    isComplete: isComplete,
    markComplete: markComplete,
    unmarkComplete: unmarkComplete,
    setupCanvas: setupCanvas,
    cssColor: cssColor,
    roundRect: roundRect,
    seededRandom: seededRandom
  };

  document.addEventListener("DOMContentLoaded", function () {
    markVisited();
    initTheme();
    initMath();
    initReveal();
    initScrollProgress();
    initChapterNav();
    initQuiz();
    initLadder();
    initReadingTime();
    initCompleteButtons();
    initKeys();
    initProgressUI();
    document.dispatchEvent(new CustomEvent("papers:ready"));
  });
})();
