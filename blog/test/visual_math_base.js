/* Shared helpers for the interactive math explainers. */
const VM = (() => {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function fmt(x, n = 1) {
    if (!Number.isFinite(x)) return "–";
    return x.toFixed(n).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  }

  function fit(canvas) {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: r.width, h: r.height, dpr };
  }

  function loop(canvas, draw) {
    let visible = true, raf = 0, last = performance.now(), t = 0;
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) last = performance.now();
      }, { rootMargin: "140px" });
      io.observe(canvas);
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += reduce ? 0 : dt;
      draw(t, dt);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }

  function pointer(canvas, handlers = {}) {
    const state = { x: 0, y: 0, down: false, inside: false };
    function pos(e) {
      const r = canvas.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return { x: p.clientX - r.left, y: p.clientY - r.top };
    }
    function emit(name, e) {
      const p = pos(e);
      state.x = p.x; state.y = p.y;
      if (handlers[name]) handlers[name](p, state, e);
    }
    canvas.addEventListener("pointerdown", (e) => {
      state.down = true; state.inside = true;
      if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
      emit("down", e);
    });
    canvas.addEventListener("pointermove", (e) => { state.inside = true; emit("move", e); });
    canvas.addEventListener("pointerleave", () => { state.inside = false; if (handlers.leave) handlers.leave(state); });
    canvas.addEventListener("pointerup", (e) => { state.down = false; emit("up", e); });
    canvas.addEventListener("pointercancel", (e) => { state.down = false; emit("up", e); });
    return state;
  }

  function seeded(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function deepMerge(a, b) {
    if (Array.isArray(b)) return b.slice();
    const out = Object.assign({}, a);
    if (b && typeof b === "object") {
      for (const k in b) {
        if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k])) out[k] = deepMerge(a[k] || {}, b[k]);
        else out[k] = b[k];
      }
    }
    return out;
  }

  function plot(id, traces, layout = {}, config = {}) {
    const el = document.getElementById(id);
    if (!el || !window.Plotly) return;
    const font = { family: css("--sans") || "sans-serif", color: css("--muted") || "#aaa", size: 12 };
    const axis = {
      gridcolor: "rgba(255,255,255,.07)",
      zerolinecolor: "rgba(255,255,255,.14)",
      tickfont: { color: css("--faint") || "#777", size: 11 },
      titlefont: { color: css("--muted") || "#aaa", size: 12 }
    };
    const base = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font,
      margin: { l: 56, r: 20, t: 28, b: 48 },
      showlegend: false,
      hoverlabel: {
        bgcolor: "#161624",
        bordercolor: "rgba(255,255,255,.22)",
        font: { color: "#f3f1ea", family: css("--sans") || "sans-serif", size: 12 }
      },
      xaxis: axis,
      yaxis: axis
    };
    const merged = deepMerge(base, layout);
    Plotly.react(el, traces, merged, Object.assign({ responsive: true, displayModeBar: false }, config));
  }

  function init() {
    const progress = document.getElementById("progress");
    if (progress) {
      let ticking = false;
      const update = () => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        progress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
        ticking = false;
      };
      addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      update();
    }

    const nav = document.getElementById("dotnav");
    const sections = $$("[data-nav]");
    if (nav && sections.length) {
      sections.forEach((sec) => {
        const a = document.createElement("a");
        a.href = "#" + sec.id;
        a.innerHTML = '<span class="dot-label">' + (sec.dataset.nav || sec.id) + '</span><span class="dot"></span>';
        nav.appendChild(a);
      });
      const links = $$("a", nav);
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const i = sections.indexOf(e.target);
            links.forEach((l, j) => l.classList.toggle("active", i === j));
          });
        }, { rootMargin: "-42% 0px -52% 0px" });
        sections.forEach((s) => io.observe(s));
      }
    }

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { rootMargin: "0px 0px -12% 0px" });
      $$(".reveal").forEach((el) => io.observe(el));
    } else {
      $$(".reveal").forEach((el) => el.classList.add("in"));
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  return { $, $$, clamp, lerp, smooth, easeInOut, css, fmt, fit, loop, pointer, seeded, plot, reduce };
})();
