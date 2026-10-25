/* ============================================================
   The Wiener Archive — shared interaction engine
   ============================================================ */
(function () {
  "use strict";

  var W = window.W = window.W || {};
  var TAU = Math.PI * 2;

  W.TAU = TAU;
  W.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  W.lerp = function (a, b, t) { return a + (b - a) * t; };
  W.ease = function (t) { return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3); };
  W.rand = function (a, b) { return a + Math.random() * (b - a); };
  W.gauss = function () {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
  };
  W.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  W.cssVar = function (name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  };

  W.alpha = function (color, a) {
    if (!color) return "rgba(255,255,255," + a + ")";
    color = color.trim();
    if (color.charAt(0) === "#") {
      var hex = color.slice(1);
      if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      var n = parseInt(hex, 16);
      if (!isNaN(n)) return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
    }
    if (color.indexOf("rgb(") === 0) return color.replace("rgb(", "rgba(").replace(")", "," + a + ")");
    if (color.indexOf("rgba(") === 0) return color;
    return color;
  };

  W.fit = function (canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width));
    var h = Math.max(1, Math.round(r.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h, dpr: dpr };
  };

  W.visible = function (el, onEnter, onExit) {
    if (!el || !("IntersectionObserver" in window)) {
      if (onEnter) onEnter();
      return null;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { if (onEnter) onEnter(); }
        else if (onExit) onExit();
      });
    }, { rootMargin: "120px 0px" });
    io.observe(el);
    return io;
  };

  W.onTheme = function (fn) {
    W._themeFns = W._themeFns || [];
    W._themeFns.push(fn);
  };

  W.setTheme = function (theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("wiener-theme", theme); } catch (e) {}
    var btn = document.getElementById("themeToggle");
    if (btn) {
      btn.setAttribute("aria-label", theme === "light" ? "Dunkles Design" : "Helles Design");
      btn.innerHTML = theme === "light"
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.7 6.7 0 0 0 9.8 9.8Z"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    }
    (W._themeFns || []).forEach(function (fn) { try { fn(theme); } catch (e) {} });
  };

  W.stage = function (canvas, draw, opts) {
    opts = opts || {};
    var animate = opts.animate !== false;
    var state = { ctx: null, w: 1, h: 1, dpr: 1, t0: 0, last: 0 };
    var raf = 0;
    var running = false;

    function size() {
      var f = W.fit(canvas);
      state.ctx = f.ctx; state.w = f.w; state.h = f.h; state.dpr = f.dpr;
    }
    function render(t) {
      if (!state.ctx) size();
      if (!state.w || !state.h) return;
      draw(state.ctx, state.w, state.h, t == null ? (performance.now() - state.t0) / 1000 : t, 0);
    }
    function frame(now) {
      if (!running) return;
      if (!state.last) state.last = now;
      var dt = Math.min(0.05, (now - state.last) / 1000);
      state.last = now;
      if (!state.ctx) size();
      if (state.w && state.h) draw(state.ctx, state.w, state.h, (now - state.t0) / 1000, dt);
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (!animate || running) return;
      size();
      running = true;
      state.last = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }
    function redraw() {
      size();
      render();
    }
    size();
    if (animate) {
      state.t0 = performance.now();
      render();
      W.visible(canvas, start, stop);
    } else {
      render();
    }
    if (window.ResizeObserver) new ResizeObserver(function () { redraw(); }).observe(canvas);
    else window.addEventListener("resize", redraw);
    W.onTheme(function () { redraw(); });
    return { state: state, redraw: redraw, start: start, stop: stop, render: render };
  };

  W.grid = function (ctx, w, h, color, step) {
    step = step || 42;
    ctx.save();
    ctx.strokeStyle = W.alpha(color || "#ffffff", 0.045);
    ctx.lineWidth = 1;
    for (var x = 0; x < w; x += step) {
      ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); ctx.stroke();
    }
    for (var y = 0; y < h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); ctx.stroke();
    }
    ctx.restore();
  };

  W.arrow = function (ctx, x1, y1, x2, y2, color, width) {
    var a = Math.atan2(y2 - y1, x2 - x1);
    var s = 6.5;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width || 1.2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - s * Math.cos(a - .36), y2 - s * Math.sin(a - .36));
    ctx.lineTo(x2 - s * Math.cos(a + .36), y2 - s * Math.sin(a + .36));
    ctx.closePath(); ctx.fill();
  };

  W.label = function (ctx, text, x, y, color, size, align, baseline) {
    ctx.fillStyle = color || "#8a938e";
    ctx.font = (size || 10) + "px " + (W.cssVar("--mono") || "monospace");
    ctx.textAlign = align || "left";
    ctx.textBaseline = baseline || "middle";
    ctx.fillText(text, x, y);
  };

  W.line = function (ctx, pts, color, width, dash) {
    if (!pts || pts.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = width || 1.4; ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    ctx.restore();
  };

  W.roundRect = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  W.fmt = function (v, digits) {
    if (digits === 0) return String(Math.round(v));
    return v.toFixed(digits == null ? 2 : digits);
  };

  W.bindRange = function (id, cb) {
    var el = document.getElementById(id);
    if (!el) return null;
    var out = el.getAttribute("data-out") ? document.getElementById(el.getAttribute("data-out")) : null;
    var fmt = el.getAttribute("data-format");
    function update() {
      var v = parseFloat(el.value);
      if (out) out.textContent = fmt === "int" ? Math.round(v) : (fmt ? v.toFixed(parseInt(fmt, 10)) : String(v));
      if (cb) cb(v, el);
    }
    el.addEventListener("input", update);
    update();
    return { el: el, value: parseFloat(el.value), update: update };
  };

  W.btnGroup = function (selector, cb) {
    var root = document.querySelector(selector);
    if (!root) return;
    var btns = Array.prototype.slice.call(root.querySelectorAll("button"));
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        cb(b.getAttribute("data-value"), b);
      });
    });
  };

  W.initProgress = function () {
    var bar = document.getElementById("progressBar");
    if (!bar) return;
    function upd() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    }
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  };

  W.works = [
    { id: "index", href: "wiener_index.html", label: "Übersicht", short: "Start" },
    { id: "01", href: "wiener_01_cybernetik.html", label: "Cybernetics", short: "1948" },
    { id: "02", href: "wiener_02_menschliche-nutzung.html", label: "Human Use", short: "1950" },
    { id: "03", href: "wiener_03_wiener-filter.html", label: "Filter", short: "1949" },
    { id: "04", href: "wiener_04_harmonische-analyse.html", label: "Spektrum", short: "1930" },
    { id: "05", href: "wiener_05_brownsche-bewegung.html", label: "Zufall", short: "1923" },
    { id: "06", href: "wiener_06_gott-und-golem.html", label: "Golem", short: "1964" },
    { id: "07", href: "wiener_07_leben.html", label: "Leben", short: "1953" },
    { id: "08", href: "wiener_08_regal.html", label: "Regal", short: "Mehr" }
  ];

  W.buildNav = function () {
    var nav = document.querySelector(".topnav");
    if (!nav) return;
    var sub = /\/seiten\//.test(location.pathname);
    var base = sub ? "../" : "";
    var current = (document.body.getAttribute("data-page") || (sub ? "" : "index")).toString();
    W.works.forEach(function (w) {
      var a = document.createElement("a");
      a.href = base + w.href;
      a.textContent = w.label;
      a.setAttribute("data-id", w.id);
      if (w.id === current) a.className = "on";
      nav.appendChild(a);
    });
    if (current && current !== "index") {
      var m = document.querySelector('.topnav a[data-id="' + current + '"]');
      if (m) setTimeout(function () { m.scrollIntoView({ block: "nearest", inline: "center" }); }, 60);
    }
  };

  W.initTopbar = function () {
    var bar = document.querySelector(".topbar");
    if (!bar) return;
    function upd() { bar.classList.toggle("scrolled", window.scrollY > 18); }
    window.addEventListener("scroll", upd, { passive: true });
    upd();
  };

  W.initReveal = function () {
    var els = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -7% 0px", threshold: .05 });
    els.forEach(function (e) { io.observe(e); });
  };

  W.initRanges = function () {
    Array.prototype.slice.call(document.querySelectorAll("input[type=range][data-out]")).forEach(function (el) {
      var out = document.getElementById(el.getAttribute("data-out"));
      if (!out) return;
      var fmt = el.getAttribute("data-format");
      function upd() {
        var v = parseFloat(el.value);
        out.textContent = fmt === "int" ? Math.round(v) : (fmt ? v.toFixed(parseInt(fmt, 10)) : String(v));
      }
      el.addEventListener("input", upd); upd();
    });
  };

  W.initQuiz = function () {
    Array.prototype.slice.call(document.querySelectorAll(".quiz")).forEach(function (quiz) {
      var ans = parseInt(quiz.getAttribute("data-answer"), 10);
      var opts = Array.prototype.slice.call(quiz.querySelectorAll(".quiz-option"));
      var ex = quiz.querySelector(".quiz-explain");
      opts.forEach(function (o, i) {
        o.addEventListener("click", function () {
          opts.forEach(function (x) { x.classList.remove("ok", "no"); x.disabled = true; });
          if (i === ans) o.classList.add("ok");
          else { o.classList.add("no"); if (opts[ans]) opts[ans].classList.add("ok"); }
          if (ex) ex.classList.add("show");
        });
      });
    });
  };

  W.initTheme = function () {
    var theme = "dark";
    try { theme = localStorage.getItem("wiener-theme") || "dark"; } catch (e) {}
    W.setTheme(theme);
    var btn = document.getElementById("themeToggle");
    if (btn) {
      btn.addEventListener("click", function () {
        W.setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
      });
    }
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: light)");
      if (mq.addEventListener) mq.addEventListener("change", function () {
        var stored = null;
        try { stored = localStorage.getItem("wiener-theme"); } catch (e) {}
        if (!stored) W.setTheme(mq.matches ? "light" : "dark");
      });
    }
  };

  /* ---------------- hero artwork ---------------- */
  function pointOnRoundRect(x, y, w, h, r, u) {
    var per = 2 * (w + h) - 8 * r + TAU * r;
    var d = ((u % 1) + 1) % 1 * per;
    var corner = Math.PI * r / 2;
    if (d < w - 2 * r) return [x + r + d, y];
    d -= w - 2 * r;
    if (d < corner) { var a = -Math.PI / 2 + d / r; return [x + w - r + Math.cos(a) * r, y + r + Math.sin(a) * r]; }
    d -= corner;
    if (d < h - 2 * r) return [x + w, y + r + d];
    d -= h - 2 * r;
    if (d < corner) { var a2 = d / r; return [x + w - r + Math.cos(a2) * r, y + h - r + Math.sin(a2) * r]; }
    d -= corner;
    if (d < w - 2 * r) return [x + w - r - d, y + h];
    d -= w - 2 * r;
    if (d < corner) { var a3 = Math.PI / 2 + d / r; return [x + r + Math.cos(a3) * r, y + h - r + Math.sin(a3) * r]; }
    d -= corner;
    if (d < h - 2 * r) return [x, y + h - r - d];
    d -= h - 2 * r;
    var a4 = Math.PI + d / r;
    return [x + r + Math.cos(a4) * r, y + r + Math.sin(a4) * r];
  }

  function motLoop(ctx, w, h, t) {
    var accent = W.cssVar("--accent");
    var accent2 = W.cssVar("--accent-2");
    var mobile = w < 900;
    var x = mobile ? w * .52 : w * .54;
    var y = mobile ? h * .16 : h * .2;
    var bw = mobile ? w * .43 : w * .37;
    var bh = mobile ? h * .48 : h * .56;
    var r = Math.min(bw, bh) * .18;

    ctx.save();
    ctx.globalAlpha = mobile ? .42 : .9;
    W.grid(ctx, w, h, accent, mobile ? 74 : 52);

    ctx.strokeStyle = W.alpha(accent, .28);
    ctx.lineWidth = 1.2;
    W.roundRect(ctx, x, y, bw, bh, r);
    ctx.stroke();

    var nodes = [
      [x + r, y, "Soll"],
      [x + bw, y + bh * .5, "Regler"],
      [x + bw - r, y + bh, "Strecke"],
      [x, y + bh * .5, "Ist"]
    ];

    var pts = [];
    for (var i = 0; i < 120; i++) pts.push(pointOnRoundRect(x, y, bw, bh, r, i / 120));
    W.line(ctx, pts, W.alpha(accent, .2), 1);

    for (var j = 0; j < 5; j++) {
      var u = (t * .06 + j / 5) % 1;
      var p = pointOnRoundRect(x, y, bw, bh, r, u);
      ctx.fillStyle = accent2;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(p[0], p[1], 3.1, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
    }

    nodes.forEach(function (n, k) {
      var active = Math.sin(t * 1.1 + k * 1.4) > .25;
      ctx.fillStyle = active ? W.alpha(accent, .22) : W.alpha("#ffffff", .035);
      ctx.strokeStyle = active ? accent : W.alpha(accent, .4);
      ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.arc(n[0], n[1], 5.5, 0, TAU); ctx.fill(); ctx.stroke();
      if (!mobile) W.label(ctx, n[2], n[0] + 11, n[1], W.alpha(accent, .72), 9);
    });

    var cy = y + bh * .5;
    var cw = bw * .62;
    ctx.strokeStyle = W.alpha(accent, .5);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (var k = 0; k < 90; k++) {
      var xx = x + bw * .19 + (cw * k / 89);
      var yy = cy + Math.sin(k * .19 + t * 2.2) * bh * .055 * Math.sin(k * .03 + t * .4);
      if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();

    ctx.fillStyle = W.alpha(accent, .08);
    ctx.beginPath(); ctx.arc(x + bw * .5, cy, Math.min(bw, bh) * .26, 0, TAU); ctx.fill();

    W.label(ctx, "RÜCK KOPPLUNG", x + bw * .5, y + bh * .86, W.alpha(accent, .48), 8.5, "center");
    ctx.restore();
  }

  function motEntropy(ctx, w, h, t) {
    var accent = W.cssVar("--accent");
    var accent2 = W.cssVar("--accent-2");
    var cols = w < 700 ? 18 : 30;
    var rows = w < 700 ? 13 : 19;
    var cell = Math.max(5, Math.floor(Math.min(w * .44 / cols, h * .58 / rows)));
    var ox = w < 900 ? w * .52 : w * .54;
    var oy = h * .2;
    var time = Math.floor(t * 3);
    var pat = function (c, r) {
      var cx = (c - cols * .5) / (cols * .5);
      var ry = (r - rows * .5) / (rows * .5);
      return (Math.abs(cx) > .12 && Math.abs(cx) < .2 && ry > -.55 && ry < .55) ||
        (Math.abs(cx) < .5 && Math.abs(ry) < .1) ? 1 : 0;
    };
    ctx.save();
    ctx.globalAlpha = w < 900 ? .42 : .82;
    W.grid(ctx, w, h, accent, 60);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var v = pat(c, r);
        var hash = (c * 73856093 ^ r * 19349663 ^ time * 83492791) >>> 0;
        var noise = (hash % 1000) / 1000;
        if (noise < .07) v = 1 - v;
        var a = v ? .55 + .35 * Math.sin(t * 1.3 + c * .2 + r * .3) : .05;
        ctx.fillStyle = v ? W.alpha(accent, a) : W.alpha("#ffffff", .025);
        ctx.fillRect(ox + c * cell, oy + r * cell, cell - 1.4, cell - 1.4);
      }
    }
    ctx.strokeStyle = W.alpha(accent2, .25);
    ctx.lineWidth = 1;
    ctx.strokeRect(ox - .5, oy - .5, cols * cell + 1, rows * cell + 1);
    W.label(ctx, "ORDNUNG ↔ RAUSCHEN", ox + cols * cell * .5, oy + rows * cell + 17, W.alpha(accent, .58), 8.5, "center");
    ctx.restore();
  }

  function motFilter(ctx, w, h, t) {
    var accent = W.cssVar("--accent");
    var accent2 = W.cssVar("--accent-2");
    var mobile = w < 900;
    var x0 = mobile ? w * .05 : w * .5;
    var x1 = w * .94;
    var y0 = h * .26;
    var y1 = h * .64;
    var n = 220;
    ctx.save();
    ctx.globalAlpha = mobile ? .5 : .92;
    W.grid(ctx, w, h, accent, 56);
    ctx.strokeStyle = W.alpha("#ffffff", .07);
    ctx.beginPath(); ctx.moveTo(x0, (y0 + y1) / 2); ctx.lineTo(x1, (y0 + y1) / 2); ctx.stroke();

    var noisy = [], smooth = [];
    for (var i = 0; i < n; i++) {
      var u = i / (n - 1);
      var xx = x0 + (x1 - x0) * u;
      var base = Math.sin(u * TAU * 2.1 + t * .8) * .42 + Math.sin(u * TAU * 5.7 + t * 1.2) * .14;
      var noise = W.gauss() * .13;
      noisy.push([xx, y0 + (y1 - y0) * .5 - (base + noise) * (y1 - y0) * .5]);
      smooth.push([xx, y0 + (y1 - y0) * .5 - base * (y1 - y0) * .5]);
    }
    W.line(ctx, noisy, W.alpha(accent, .22), 1);
    W.line(ctx, smooth, accent2, 1.7);
    W.label(ctx, "SIGNAL + RAUSCHEN", x0 + 2, y0 - 12, W.alpha(accent, .65), 8.5);
    W.label(ctx, "WIENER-SCHÄTZUNG", x0 + 2, y1 + 14, W.alpha(accent2, .75), 8.5);

    var bx = x0, bw = (x1 - x0) / 34;
    for (var b = 0; b < 34; b++) {
      var amp = .15 + .85 * Math.pow(Math.max(0, Math.sin(b * .42 + 1.1)), 3) * (.5 + .5 * Math.sin(b * 1.7 + t * .4));
      ctx.fillStyle = W.alpha(accent, .18 + amp * .4);
      ctx.fillRect(bx + b * bw, y1 + 38 - amp * 30, bw - 2, amp * 30);
    }
    W.label(ctx, "FREQUENZ", x0 + 2, y1 + 50, W.alpha(accent, .45), 8);
    ctx.restore();
  }

  function motSpectrum(ctx, w, h, t) {
    var accent = W.cssVar("--accent");
    var accent2 = W.cssVar("--accent-2");
    var mobile = w < 900;
    var cx = mobile ? w * .5 : w * .72;
    var cy = h * .48;
    var R = Math.min(w, h) * (mobile ? .28 : .3);
    ctx.save();
    ctx.globalAlpha = mobile ? .4 : .9;
    W.grid(ctx, w, h, accent, 58);
    var bars = 56;
    for (var i = 0; i < bars; i++) {
      var a = (i / bars) * TAU + t * .04;
      var amp = .16 + .84 * Math.pow(Math.max(0, Math.sin(i * .55 + 1.2)), 2) * (.55 + .45 * Math.sin(i * 1.7 - t * 1.2));
      var r1 = R * .52, r2 = R * (.7 + amp * .62);
      ctx.strokeStyle = W.alpha(i % 7 === 0 ? accent2 : accent, .18 + amp * .55);
      ctx.lineWidth = i % 7 === 0 ? 2 : 1.1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.strokeStyle = W.alpha(accent, .35);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R * .52, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * .7, 0, TAU); ctx.stroke();
    ctx.fillStyle = W.alpha(accent2, .8);
    ctx.shadowColor = accent; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(cx, cy, 3.3, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    W.label(ctx, "AUTOKORRELATION  ↔  SPEKTRUM", cx, cy + R * 1.05, W.alpha(accent, .55), 8.5, "center");
    ctx.restore();
  }

  function motBrownian(ctx, w, h, t) {
    var accent = W.cssVar("--accent");
    var accent2 = W.cssVar("--accent-2");
    var mobile = w < 900;
    var x0 = mobile ? w * .06 : w * .5;
    var x1 = w * .94;
    var y0 = h * .24;
    var y1 = h * .72;
    ctx.save();
    ctx.globalAlpha = mobile ? .45 : .9;
    W.grid(ctx, w, h, accent, 52);
    ctx.strokeStyle = W.alpha("#ffffff", .07);
    ctx.beginPath(); ctx.moveTo(x0, (y0 + y1) / 2); ctx.lineTo(x1, (y0 + y1) / 2); ctx.stroke();
    var seed = 1337;
    function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    for (var p = 0; p < 18; p++) {
      var pts = [];
      var v = 0;
      var n = 240;
      var amp = (y1 - y0) * .18;
      for (var i = 0; i < n; i++) {
        v += (rnd() - .5) * 2 * amp / Math.sqrt(n) * 3.4;
        pts.push([x0 + (x1 - x0) * i / (n - 1), (y0 + y1) / 2 - v]);
      }
      W.line(ctx, pts, W.alpha(accent, p === 0 ? .8 : .1), p === 0 ? 1.6 : .7);
      if (p === 0) {
        var k = Math.floor((.15 + .7 * ((t * .05) % 1)) * (n - 1));
        ctx.fillStyle = accent2;
        ctx.shadowColor = accent; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(pts[k][0], pts[k][1], 3.4, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    W.label(ctx, "WIENER-PROZESS", x0 + 2, y1 + 18, W.alpha(accent, .55), 8.5);
    ctx.restore();
  }

  function motGolem(ctx, w, h, t) {
    var accent = W.cssVar("--accent");
    var accent2 = W.cssVar("--accent-2");
    var mobile = w < 900;
    var cx = mobile ? w * .64 : w * .76;
    var cy = h * .48;
    var R = Math.min(w, h) * (mobile ? .2 : .24);
    ctx.save();
    ctx.globalAlpha = mobile ? .42 : .9;
    W.grid(ctx, w, h, accent, 58);
    var orbs = [
      [cx + Math.cos(t * .35) * R, cy + Math.sin(t * .35) * R * .55],
      [cx + Math.cos(t * .35 + TAU / 3) * R, cy + Math.sin(t * .35 + TAU / 3) * R * .55],
      [cx + Math.cos(t * .35 + 2 * TAU / 3) * R, cy + Math.sin(t * .35 + 2 * TAU / 3) * R * .55]
    ];
    for (var i = 0; i < 3; i++) {
      var p = orbs[i], q = orbs[(i + 1) % 3];
      ctx.strokeStyle = W.alpha(accent, .22);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p[0], p[1]); ctx.stroke();
    }
    orbs.forEach(function (p, i) {
      var g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 34);
      g.addColorStop(0, W.alpha(accent2, .8));
      g.addColorStop(.3, W.alpha(accent, .35));
      g.addColorStop(1, W.alpha(accent, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p[0], p[1], 34, 0, TAU); ctx.fill();
      ctx.fillStyle = accent2;
      ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, TAU); ctx.fill();
      W.label(ctx, ["LERNEN", "REPRODUZIEREN", "KOORDINIEREN"][i], p[0], p[1] + 25, W.alpha(accent, .62), 7.5, "center");
    });
    ctx.strokeStyle = W.alpha(accent, .38);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R * .52, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * .84, 0, TAU); ctx.stroke();
    W.label(ctx, "G O L E M", cx, cy + 3, W.alpha(accent, .72), 11, "center");
    ctx.restore();
  }

  function motLife(ctx, w, h, t) {
    var accent = W.cssVar("--accent");
    var accent2 = W.cssVar("--accent-2");
    var mobile = w < 900;
    var cx = mobile ? w * .58 : w * .72;
    var cy = h * .46;
    var pts = [
      [cx - 170, cy + 55], [cx - 60, cy - 80], [cx + 55, cy - 30], [cx + 165, cy + 65],
      [cx - 20, cy + 100], [cx + 120, cy - 112], [cx - 130, cy - 120], [cx + 210, cy - 20],
      [cx - 230, cy - 10], [cx + 20, cy + 25]
    ];
    var edges = [[0, 1], [1, 2], [2, 3], [0, 4], [4, 2], [1, 6], [6, 0], [2, 5], [5, 3], [3, 7], [0, 8], [2, 9], [9, 4], [9, 1]];
    ctx.save();
    ctx.globalAlpha = mobile ? .36 : .82;
    W.grid(ctx, w, h, accent, 62);
    edges.forEach(function (e, i) {
      var a = pts[e[0]], b = pts[e[1]];
      ctx.strokeStyle = W.alpha(accent, .13);
      ctx.lineWidth = .8;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      var u = (t * .09 + i * .13) % 1;
      var px = a[0] + (b[0] - a[0]) * u, py = a[1] + (b[1] - a[1]) * u;
      ctx.fillStyle = W.alpha(accent2, .65);
      ctx.beginPath(); ctx.arc(px, py, 1.7, 0, TAU); ctx.fill();
    });
    pts.forEach(function (p, i) {
      var r = i === 9 ? 4 : 2.3 + (i % 3) * .5;
      ctx.fillStyle = i === 9 ? accent2 : W.alpha(accent, .65);
      ctx.shadowColor = accent; ctx.shadowBlur = i === 9 ? 14 : 6;
      ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
    });
    W.label(ctx, "EINFLUSS · LEHRER · KOLLEGEN", cx, cy + 150, W.alpha(accent, .5), 8.5, "center");
    ctx.restore();
  }

  function motShelf(ctx, w, h, t) {
    var accent = W.cssVar("--accent");
    var accent2 = W.cssVar("--accent-2");
    var mobile = w < 900;
    var x0 = mobile ? w * .48 : w * .56;
    var y0 = h * .24;
    var y1 = h * .76;
    ctx.save();
    ctx.globalAlpha = mobile ? .4 : .82;
    W.grid(ctx, w, h, accent, 58);
    var n = 11;
    var bw = (w * .94 - x0) / n;
    for (var i = 0; i < n; i++) {
      var hh = (y1 - y0) * (.48 + .3 * Math.abs(Math.sin(i * 1.7 + .4)));
      var x = x0 + i * bw;
      var yy = y1 - hh + Math.sin(t * .5 + i * .7) * 2;
      var g = ctx.createLinearGradient(x, yy, x + bw, yy);
      g.addColorStop(0, W.alpha(accent, .05));
      g.addColorStop(.5, W.alpha(accent, .18 + .08 * Math.sin(t * .8 + i)));
      g.addColorStop(1, W.alpha(accent, .04));
      ctx.fillStyle = g;
      ctx.fillRect(x + 3, yy, bw - 7, hh);
      ctx.strokeStyle = W.alpha(accent, .35);
      ctx.strokeRect(x + 3, yy, bw - 7, hh);
      ctx.fillStyle = W.alpha(i === 4 ? accent2 : accent, .28);
      ctx.fillRect(x + 8, yy + 12, 2, hh * .5);
      if (i === 4) {
        ctx.strokeStyle = W.alpha(accent2, .7);
        ctx.strokeRect(x + .5, yy - 4, bw - 3, hh + 8);
      }
    }
    ctx.strokeStyle = W.alpha(accent, .35);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 - 10, y1 + 2); ctx.lineTo(w * .95, y1 + 2); ctx.stroke();
    W.label(ctx, "DIE BIBLIOTHEK", (x0 + w * .94) / 2, y1 + 20, W.alpha(accent, .55), 8.5, "center");
    ctx.restore();
  }

  W.motifs = {
    loop: motLoop, entropy: motEntropy, filter: motFilter, spectrum: motSpectrum,
    brownian: motBrownian, golem: motGolem, life: motLife, shelf: motShelf
  };

  W.initHero = function () {
    var canvas = document.querySelector("canvas.hero-canvas");
    if (!canvas) return;
    var motif = canvas.getAttribute("data-motif") || document.body.getAttribute("data-motif") || "loop";
    var fn = W.motifs[motif] || motLoop;
    W.stage(canvas, function (ctx, w, h, t) { fn(ctx, w, h, t); }, { animate: true });
  };


  W.initRail = function () {
    var sections = Array.prototype.slice.call(document.querySelectorAll(".chapter[id]")).filter(function (s) {
      return s.querySelector("h2");
    });
    if (sections.length < 3) return;
    var rail = document.createElement("nav");
    rail.className = "chapter-rail";
    rail.setAttribute("aria-label", "Abschnitte");
    var links = sections.map(function (s) {
      var a = document.createElement("a");
      a.href = "#" + s.id;
      var label = s.querySelector("h2").textContent.replace(/\s+/g, " ").trim();
      a.innerHTML = '<i></i><span>' + label + "</span>";
      a.setAttribute("aria-label", label);
      rail.appendChild(a);
      return a;
    });
    document.body.appendChild(rail);
    function upd() {
      var y = window.innerHeight * .32;
      var active = 0;
      sections.forEach(function (s, i) {
        if (s.getBoundingClientRect().top <= y) active = i;
      });
      links.forEach(function (a, i) { a.classList.toggle("on", i === active); });
    }
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  };

  W.boot = function () {
    W.initRail();
    W.initTheme();
    W.initProgress();
    W.initTopbar();
    W.buildNav();
    W.initReveal();
    W.initRanges();
    W.initQuiz();
    W.initHero();
    if (typeof W.pageInit === "function") W.pageInit();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", W.boot);
  else W.boot();
})();
