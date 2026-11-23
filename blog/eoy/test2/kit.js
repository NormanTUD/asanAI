/* EOY test2: shared helpers. Requires ../test/proto.js (window.Proto). */
(function () {
  "use strict";

  var T2 = window.T2 = window.T2 || {};

  T2.t = function (de, en) {
    return window.Proto && Proto.lang() === "en" ? en : de;
  };

  T2.lang = function () {
    return window.Proto && Proto.lang ? Proto.lang() : "de";
  };

  T2.onLang = function (fn) {
    if (window.Proto && Proto.onLang) Proto.onLang(fn);
  };

  T2.onTheme = function (fn) {
    var last = document.documentElement.getAttribute("data-theme");
    var mo = new MutationObserver(function () {
      var next = document.documentElement.getAttribute("data-theme");
      if (next === last) return;
      last = next;
      try { fn(next); } catch (e) {}
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    try { window.addEventListener("proto:theme", fn); } catch (e) {}
    return function () { mo.disconnect(); };
  };

  T2.reduced = function () {
    return !!(window.Proto && Proto.reduceMotion && Proto.reduceMotion());
  };

  T2.cssVar = function (name, el) {
    var target = el || document.documentElement;
    return getComputedStyle(target).getPropertyValue(name).trim();
  };

  T2.esc = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  T2.clamp = function (v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  };

  T2.lerp = function (a, b, t) {
    return a + (b - a) * t;
  };

  T2.ease = function (t) {
    t = T2.clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  };

  T2.fit = function (canvas, container) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(1, container.clientWidth);
    var h = Math.max(1, container.clientHeight);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h, dpr: dpr };
  };

  T2.onResize = function (el, fn) {
    var raf = 0;
    function run() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        try { fn(); } catch (e) {}
      });
    }
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(run);
      ro.observe(el);
    }
    window.addEventListener("resize", run);
    return function () {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", run);
      if (raf) cancelAnimationFrame(raf);
    };
  };

  T2.loop = function (fn) {
    var raf = 0;
    var running = false;
    function frame(now) {
      if (!running) return;
      try { fn(now); } catch (e) {}
      raf = requestAnimationFrame(frame);
    }
    return {
      start: function () {
        if (running) return;
        running = true;
        raf = requestAnimationFrame(frame);
      },
      stop: function () {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      },
      isRunning: function () { return running; }
    };
  };

  T2.particles = function (count, seed) {
    var list = [];
    var s = seed || 1;
    function rnd() {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    }
    for (var i = 0; i < count; i++) {
      list.push({ t: rnd(), speed: 0.18 + rnd() * 0.22, size: 1 + rnd() * 2, jitter: rnd() * 2 - 1 });
    }
    return list;
  };
})();
