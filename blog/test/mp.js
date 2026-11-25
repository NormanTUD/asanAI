(function () {
  "use strict";

  var MP = (window.MP = {});
  MP.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var themeSubs = new Set();
  var reduceSubs = new Set();

  MP.css = function (name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  };
  MP.colors = function () {
    return {
      bg: MP.css("--bg"),
      panel: MP.css("--panel"),
      panel2: MP.css("--panel-2"),
      ink: MP.css("--ink"),
      muted: MP.css("--muted"),
      faint: MP.css("--faint"),
      accent: MP.css("--accent"),
      accent2: MP.css("--accent-2"),
      line: MP.css("--line"),
      glow: MP.css("--accent-glow")
    };
  };
  MP.onTheme = function (fn) { themeSubs.add(fn); return function () { themeSubs.delete(fn); }; };
  MP.onReduced = function (fn) { reduceSubs.add(fn); return function () { reduceSubs.delete(fn); }; };

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("mp_theme", theme); } catch (e) {}
    var btn = document.getElementById("themeToggle");
    if (btn) {
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      btn.innerHTML = theme === "dark"
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.8 6.8 0 0 0 9.8 9.8z"/></svg>';
    }
    requestAnimationFrame(function () { themeSubs.forEach(function (fn) { try { fn(theme); } catch (e) {} }); });
  }
  MP.setTheme = applyTheme;

  MP.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  MP.lerp = function (a, b, t) { return a + (b - a) * t; };
  MP.ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  MP.smooth = function (t) { return t * t * (3 - 2 * t); };
  MP.fmt = function (n, d) { return Number(n).toFixed(d == null ? 2 : d); };

  MP.mulberry32 = function (seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  MP.rr = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  MP.arrow = function (ctx, x1, y1, x2, y2, color, width, head) {
    var ang = Math.atan2(y2 - y1, x2 - x1);
    head = head == null ? 7 : head;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width == null ? 1.4 : width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    if (head > 0) {
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - head * Math.cos(ang - 0.42), y2 - head * Math.sin(ang - 0.42));
      ctx.lineTo(x2 - head * Math.cos(ang + 0.42), y2 - head * Math.sin(ang + 0.42));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  MP.dot = function (ctx, x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  MP.glowDot = function (ctx, x, y, r, color, glowColor) {
    ctx.save();
    ctx.shadowBlur = r * 4;
    ctx.shadowColor = glowColor || color;
    MP.dot(ctx, x, y, r, color);
    ctx.restore();
  };

  MP.label = function (ctx, text, x, y, color, size, align, font) {
    ctx.save();
    ctx.fillStyle = color || MP.css("--muted");
    ctx.font = (size || 11) + "px " + (font || '"SFMono-Regular", Menlo, Consolas, monospace');
    ctx.textAlign = align || "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  MP.grid = function (ctx, w, h, step, color) {
    ctx.save();
    ctx.strokeStyle = color || MP.css("--line");
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    for (var x = 0; x <= w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (var y = 0; y <= h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.restore();
  };

  MP.spikes = function (rate, count, seed, jitter) {
    var rnd = MP.mulberry32(seed || 1);
    var out = [];
    var t = 0;
    for (var i = 0; i < count; i++) {
      t += -Math.log(1 - rnd() * 0.999) / Math.max(0.001, rate);
      out.push(t + (jitter ? (rnd() - 0.5) * jitter : 0));
    }
    return out;
  };

  MP.canvas = function (el, draw, opts) {
    opts = opts || {};
    if (!el) return null;
    var ctx = el.getContext("2d");
    var w = 1, h = 1, dpr = 1, raf = 0, t0 = performance.now(), started = false;
    var api = {};

    function resize() {
      var r = el.getBoundingClientRect();
      var nextW = Math.max(1, r.width);
      var nextH = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr || 2);
      if (nextW !== w || nextH !== h || el.width !== Math.round(nextW * dpr)) {
        w = nextW; h = nextH;
        el.width = Math.round(w * dpr);
        el.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }

    function paint(now, dt) {
      resize();
      ctx.clearRect(0, 0, w, h);
      draw(ctx, w, h, (now - t0) / 1000, dt || 0, api);
    }

    function frame(now) {
      var dt = Math.min(0.05, (now - (api._last || now)) / 1000);
      api._last = now;
      paint(now, dt);
      raf = requestAnimationFrame(frame);
    }

    api.start = function () {
      if (started) return;
      started = true;
      if (MP.reduced && !opts.forceMotion) { paint(performance.now(), 0); return; }
      raf = requestAnimationFrame(frame);
    };
    api.stop = function () {
      started = false;
      cancelAnimationFrame(raf);
      raf = 0;
    };
    api.redraw = function () { paint(performance.now(), 0); };
    api.resize = function () { resize(); paint(performance.now(), 0); };
    Object.defineProperty(api, "ctx", { get: function () { return ctx; } });
    Object.defineProperty(api, "w", { get: function () { return w; } });
    Object.defineProperty(api, "h", { get: function () { return h; } });

    var ro = new ResizeObserver(function () { resize(); if (!raf) paint(performance.now(), 0); });
    ro.observe(el);
    themeSubs.add(function () { if (!raf) paint(performance.now(), 0); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; started = false; } }
      else if (!started) api.start();
    });
    api.start();
    return api;
  };

  MP.temml = function (root) {
    if (!window.temml) return;
    (root || document).querySelectorAll("[data-tex]").forEach(function (el) {
      if (el.dataset.rendered === "1") return;
      var tex = el.getAttribute("data-tex");
      if (!tex) return;
      try {
        temml.render(tex, el, { displayMode: el.hasAttribute("data-display"), throwOnError: false });
        el.dataset.rendered = "1";
      } catch (e) {
        el.textContent = tex;
      }
    });
  };

  MP.reveal = function () {
    var nodes = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || MP.reduced) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    nodes.forEach(function (n) { io.observe(n); });
  };

  MP.progress = function () {
    var bar = document.querySelector(".progress > span");
    var top = document.querySelector(".topbar");
    function onScroll() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? (window.scrollY / max) * 100 : 0;
      if (bar) bar.style.width = p + "%";
      if (top) top.classList.toggle("is-scrolled", window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  };

  MP.rail = function () {
    var rail = document.getElementById("rail");
    if (!rail) return;
    var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id][data-label]"));
    if (!sections.length) return;
    rail.innerHTML = "";
    sections.forEach(function (s, i) {
      if (i > 0) {
        var line = document.createElement("div");
        line.className = "rail-line";
        rail.appendChild(line);
      }
      var a = document.createElement("a");
      a.href = "#" + s.id;
      a.title = s.getAttribute("data-label");
      a.setAttribute("aria-label", s.getAttribute("data-label"));
      rail.appendChild(a);
    });
    var dots = Array.prototype.slice.call(rail.querySelectorAll("a"));
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var idx = sections.indexOf(en.target);
        dots.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
      });
    }, { rootMargin: "-40% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  };

  MP.lightbox = function () {
    var box = document.getElementById("lightbox");
    if (!box) return;
    var img = box.querySelector("img");
    var cap = box.querySelector(".cap");
    document.querySelectorAll(".facsimile").forEach(function (fig) {
      fig.addEventListener("click", function () {
        var source = fig.querySelector("img");
        if (!source) return;
        img.src = source.getAttribute("src");
        img.alt = source.getAttribute("alt") || "";
        var fc = fig.querySelector("figcaption");
        cap.textContent = fc ? fc.textContent.trim() : "";
        box.classList.add("is-open");
        document.body.style.overflow = "hidden";
      });
    });
    function close() {
      box.classList.remove("is-open");
      document.body.style.overflow = "";
      img.removeAttribute("src");
    }
    box.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  };

  MP.rangeFill = function (input) {
    function set() {
      var min = parseFloat(input.min || "0");
      var max = parseFloat(input.max || "100");
      var v = parseFloat(input.value);
      var p = ((v - min) / (max - min)) * 100;
      input.style.setProperty("--fill", p + "%");
    }
    input.addEventListener("input", set);
    set();
  };

  MP.bindRange = function (id, fn) {
    var input = document.getElementById(id);
    if (!input) return null;
    MP.rangeFill(input);
    input.addEventListener("input", function () { fn(parseFloat(input.value), input); });
    fn(parseFloat(input.value), input);
    return input;
  };

  MP.on = function (id, ev, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener(ev, fn);
    return el;
  };

  MP.activateGroup = function (selector, activeClass) {
    var els = Array.prototype.slice.call(document.querySelectorAll(selector));
    els.forEach(function (el) {
      el.addEventListener("click", function () {
        els.forEach(function (o) { o.classList.remove(activeClass || "is-active"); });
        el.classList.add(activeClass || "is-active");
      });
    });
    return els;
  };

  MP.C = function (t) { return MP.colors(); };

  function init() {
    var stored = null;
    try { stored = localStorage.getItem("mp_theme"); } catch (e) {}
    var prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    applyTheme(stored || (prefersLight ? "light" : "dark"));
    MP.on("themeToggle", "click", function () {
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
    MP.temml();
    MP.reveal();
    MP.progress();
    MP.rail();
    MP.lightbox();
    document.querySelectorAll('input[type="range"]').forEach(MP.rangeFill);
    window.addEventListener("load", function () { MP.temml(); requestAnimationFrame(function () { MP.temml(); }); });
    setTimeout(function () { MP.temml(); }, 120);
    setTimeout(function () { MP.temml(); }, 600);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
