/* ==========================================================================
   Taylor visuell — Interaktionen
   Keine Abhängigkeiten außer Temml und Plotly (beide lokal geladen).
   ========================================================================== */

(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const C = {
    teal: "#0f766e",
    amber: "#b45309",
    rose: "#be123c",
    violet: "#6d28d9",
    sky: "#0369a1",
    ink: "#20242e",
    dim: "#5b6270",
    faint: "#8b91a0",
    grid: "#e7e0d0",
    axis: "#cfc4aa",
    paper: "#fffdf7"
  };

  const FACT = [1];
  for (let i = 1; i <= 100; i++) FACT.push(FACT[i - 1] * i);

  const reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Grundhelfer ---------- */

  function fitCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(1, Math.round(rect.width));
    const H = Math.max(1, Math.round(rect.height));
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    return { ctx, W, H };
  }

  function mapper(W, H, pad, xmin, xmax, ymin, ymax) {
    const iw = Math.max(1, W - pad.l - pad.r);
    const ih = Math.max(1, H - pad.t - pad.b);
    return {
      xmin, xmax, ymin, ymax, pad,
      X: (v) => pad.l + ((v - xmin) / (xmax - xmin)) * iw,
      Y: (v) => H - pad.b - ((v - ymin) / (ymax - ymin)) * ih,
      iw, ih
    };
  }

  function frame(ctx, W, H, m, opts) {
    opts = opts || {};
    const nx = opts.nx || 8;
    const ny = opts.ny || 5;
    ctx.save();
    ctx.strokeStyle = opts.grid || C.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= nx; i++) {
      const x = m.xmin + ((m.xmax - m.xmin) * i) / nx;
      const px = m.X(x);
      ctx.beginPath();
      ctx.moveTo(px, m.Y(m.ymin));
      ctx.lineTo(px, m.Y(m.ymax));
      ctx.stroke();
    }
    for (let j = 0; j <= ny; j++) {
      const y = m.ymin + ((m.ymax - m.ymin) * j) / ny;
      const py = m.Y(y);
      ctx.beginPath();
      ctx.moveTo(m.X(m.xmin), py);
      ctx.lineTo(m.X(m.xmax), py);
      ctx.stroke();
    }
    ctx.strokeStyle = opts.axis || C.axis;
    ctx.lineWidth = 1.2;
    if (m.ymin < 0 && m.ymax > 0) {
      const y0 = m.Y(0);
      ctx.beginPath();
      ctx.moveTo(m.X(m.xmin), y0);
      ctx.lineTo(m.X(m.xmax), y0);
      ctx.stroke();
    }
    if (m.xmin < 0 && m.xmax > 0) {
      const x0 = m.X(0);
      ctx.beginPath();
      ctx.moveTo(x0, m.Y(m.ymin));
      ctx.lineTo(x0, m.Y(m.ymax));
      ctx.stroke();
    }
    ctx.restore();
  }

  function line(ctx, m, pts, color, width, dash) {
    if (!pts.length) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(m.X(pts[0][0]), m.Y(pts[0][1]));
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(m.X(pts[i][0]), m.Y(pts[i][1]));
    }
    ctx.stroke();
    ctx.restore();
  }

  function text(ctx, str, x, y, opts) {
    opts = opts || {};
    ctx.save();
    ctx.fillStyle = opts.color || C.faint;
    ctx.font = (opts.weight || 500) + " " + (opts.size || 10) + "px Inter, system-ui, sans-serif";
    ctx.textAlign = opts.align || "left";
    ctx.textBaseline = opts.base || "alphabetic";
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function visibleTracker(el, onChange) {
    if (!("IntersectionObserver" in window)) {
      onChange(true);
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      onChange(entries[0].isIntersecting);
    }, { threshold: 0.02 });
    io.observe(el);
  }

  function debounce(fn, ms) {
    let t = null;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  function scheduleDraw(fn) {
    let pending = false;
    return function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        fn();
      });
    };
  }

  function fmt(x) {
    if (!isFinite(x)) return "—";
    const ax = Math.abs(x);
    if (ax !== 0 && (ax >= 1e5 || ax < 1e-4)) return x.toExponential(3);
    return String(Number(x.toFixed(4)));
  }

  function fmtTex(x) {
    if (!isFinite(x)) return "\\infty";
    const ax = Math.abs(x);
    if (ax !== 0 && (ax >= 1e5 || ax < 1e-4)) {
      const e = Math.floor(Math.log10(ax));
      const m = x / Math.pow(10, e);
      return fmt(m) + "\\times10^{" + e + "}";
    }
    return fmt(x);
  }

  function robustRange(values, fallbackLo, fallbackHi) {
    const finite = values.filter(function (v) { return isFinite(v); });
    if (!finite.length) return [fallbackLo, fallbackHi];
    let lo = Math.min.apply(null, finite);
    let hi = Math.max.apply(null, finite);
    lo = Math.max(-20, lo);
    hi = Math.min(20, hi);
    if (hi - lo < 0.35) {
      const mid = (lo + hi) / 2;
      lo = mid - 1;
      hi = mid + 1;
    }
    const pad = (hi - lo) * 0.12;
    return [lo - pad, hi + pad];
  }

  /* ---------- Mathematik rendern ---------- */

  function renderMath() {
    if (typeof temml === "undefined") {
      console.warn("Temml ist nicht geladen; die Formeln bleiben als Quelltext stehen.");
      return;
    }
    $$(".tex").forEach(function (el) {
      const tex = el.textContent;
      const display = el.dataset.display === "1";
      try {
        el.innerHTML = temml.renderToString(tex, {
          displayMode: display,
          throwOnError: false
        });
      } catch (err) {
        console.error("Temml-Fehler:", err, tex);
        el.textContent = tex;
      }
    });
  }

  function setTex(el, tex, display) {
    if (!el) return;
    if (typeof temml === "undefined") {
      el.textContent = tex;
      return;
    }
    try {
      el.innerHTML = temml.renderToString(tex, {
        displayMode: display !== false,
        throwOnError: false
      });
    } catch (err) {
      console.error("Temml-Fehler:", err, tex);
      el.textContent = tex;
    }
  }

  /* ---------- Lesefortschritt und Inhaltsverzeichnis ---------- */

  function initReadingUI() {
    const bar = $("#read-progress");
    const links = $$(".toc a");
    const sections = $$("main section[id]");
    let ticking = false;

    function update() {
      ticking = false;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar) bar.style.width = (p * 100).toFixed(2) + "%";

      let active = sections[0] ? sections[0].id : null;
      const probe = window.scrollY + 130;
      for (let i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= probe) active = sections[i].id;
      }
      links.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + active);
      });
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function initReveal() {
    const els = $$(".reveal");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.02 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initSteps() {
    $$(".steps").forEach(function (box) {
      const steps = Array.from(box.children).filter(function (el) {
        return el.classList.contains("step");
      });
      if (steps.length < 2) return;
      steps.forEach(function (s, i) {
        if (i > 0) s.classList.add("is-hidden");
      });

      const actions = document.createElement("div");
      actions.className = "step-actions";
      const next = document.createElement("button");
      next.className = "primary";
      next.textContent = "Nächster Schritt";
      const all = document.createElement("button");
      all.className = "ghost";
      all.textContent = "Alle zeigen";
      const status = document.createElement("span");
      status.className = "step-status";
      actions.appendChild(next);
      actions.appendChild(all);
      actions.appendChild(status);
      box.parentNode.insertBefore(actions, box.nextSibling);

      let shown = 1;
      function refresh() {
        status.textContent = shown + " / " + steps.length + " sichtbar";
        next.disabled = shown >= steps.length;
        next.textContent = shown >= steps.length ? "Alles sichtbar" : "Nächster Schritt";
      }
      next.addEventListener("click", function () {
        if (shown >= steps.length) return;
        steps[shown].classList.remove("is-hidden");
        shown++;
        refresh();
      });
      all.addEventListener("click", function () {
        steps.forEach(function (s) { s.classList.remove("is-hidden"); });
        shown = steps.length;
        refresh();
      });
      refresh();
    });
  }

  /* ---------- Hero: Tangente und Krümmung ---------- */

  function initHero() {
    const canvas = $("#taylorHero");
    if (!canvas) return;
    let t = 0;
    let last = performance.now();
    let visible = true;
    let raf = null;
    let ctx, W, H;

    function resize() {
      const v = fitCanvas(canvas);
      ctx = v.ctx; W = v.W; H = v.H;
    }

    function draw(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible && !document.hidden && !reduceMotion) t += dt;

      resize();
      const m = mapper(W, H, { l: 30, r: 20, t: 26, b: 30 }, -2 * Math.PI, 2 * Math.PI, -1.8, 1.8);
      frame(ctx, W, H, m, { nx: 8, ny: 4 });

      const pts = [];
      for (let k = 0; k <= 600; k++) {
        const x = -2 * Math.PI + (k / 600) * 4 * Math.PI;
        pts.push([x, Math.sin(x)]);
      }
      line(ctx, m, pts, C.faint, 2.2, null);

      const a = 2.35 * Math.sin(t * 0.45);
      const fa = Math.sin(a);
      const fpa = Math.cos(a);
      const fppa = -Math.sin(a);
      const tangent = [];
      for (let k = 0; k <= 120; k++) {
        const x = a - 1.25 + (k / 120) * 2.5;
        tangent.push([x, fa + fpa * (x - a)]);
      }
      line(ctx, m, tangent, C.rose, 1.8, null);

      const quad = [];
      for (let k = 0; k <= 120; k++) {
        const x = a - 1.25 + (k / 120) * 2.5;
        quad.push([x, fa + fpa * (x - a) + 0.5 * fppa * (x - a) * (x - a)]);
      }
      line(ctx, m, quad, C.violet, 1.4, [4, 4]);

      ctx.save();
      ctx.fillStyle = C.teal;
      ctx.beginPath();
      ctx.arc(m.X(a), m.Y(fa), 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(15,118,110,.3)";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(m.X(a), m.Y(m.ymin));
      ctx.lineTo(m.X(a), m.Y(m.ymax));
      ctx.stroke();
      ctx.restore();

      text(ctx, "sin x", 30, 18, { size: 9.5, color: C.faint });
      text(ctx, "Tangente", W - 20, 18, { size: 9.5, color: C.rose, align: "right" });
      text(ctx, "Taylor-Parabel", W - 20, 32, { size: 9.5, color: C.violet, align: "right" });
      text(ctx, "x = " + a.toFixed(2), m.X(a), H - 9, { size: 9, color: C.teal, align: "center" });
    }

    function loop(now) {
      draw(now);
      raf = requestAnimationFrame(loop);
    }

    resize();
    draw(performance.now());
    visibleTracker(canvas, function (v) {
      visible = v;
      if (v && !raf && !reduceMotion) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
      if (!v && raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    });
    if (!reduceMotion) raf = requestAnimationFrame(loop);
    window.addEventListener("resize", debounce(function () {
      draw(performance.now());
    }, 120));
  }

  /* ---------- Labor 1: Taylor-Baukasten ---------- */

  const TAYLOR = {
    sin: {
      label: "sin x",
      f: Math.sin,
      deriv: function (a, k) {
        const c = k % 4;
        return [Math.sin(a), Math.cos(a), -Math.sin(a), -Math.cos(a)][c];
      },
      aMin: -2, aMax: 2, domainMin: -Infinity
    },
    cos: {
      label: "cos x",
      f: Math.cos,
      deriv: function (a, k) {
        const c = k % 4;
        return [Math.cos(a), -Math.sin(a), -Math.cos(a), Math.sin(a)][c];
      },
      aMin: -2, aMax: 2, domainMin: -Infinity
    },
    exp: {
      label: "eˣ",
      f: Math.exp,
      deriv: function (a) { return Math.exp(a); },
      aMin: -2, aMax: 2, domainMin: -Infinity
    },
    ln: {
      label: "ln(1+x)",
      f: function (x) { return Math.log(1 + x); },
      deriv: function (a, k) {
        if (k === 0) return Math.log(1 + a);
        return (Math.pow(-1, k - 1) * FACT[k - 1]) / Math.pow(1 + a, k);
      },
      aMin: -0.75, aMax: 2, domainMin: -1
    },
    sqrt: {
      label: "√(1+x)",
      f: function (x) { return Math.sqrt(1 + x); },
      deriv: function (a, k) {
        if (k === 0) return Math.sqrt(1 + a);
        let p = 1;
        for (let j = 0; j < k; j++) p *= (0.5 - j);
        return p * Math.pow(1 + a, 0.5 - k);
      },
      aMin: -0.75, aMax: 2, domainMin: -1
    },
    geom: {
      label: "1/(1−x)",
      f: function (x) { return 1 / (1 - x); },
      deriv: function (a, k) {
        return FACT[k] / Math.pow(1 - a, k + 1);
      },
      aMin: -2, aMax: 0.75, domainMin: -Infinity
    }
  };

  function initTaylorBuilder() {
    const canvas = $("#taylorCanvas");
    if (!canvas) return;
    const fnSelect = $("#taylorFn");
    const aInput = $("#taylorA");
    const nInput = $("#taylorN");
    const zoomInput = $("#taylorZoom");
    const aVal = $("#taylorAVal");
    const nVal = $("#taylorNVal");
    const zoomVal = $("#taylorZoomVal");
    const play = $("#taylorPlay");
    const reset = $("#taylorReset");
    const formula = $("#taylorFormula");
    const tableBody = $("#taylorTable tbody");
    const degOut = $("#taylorDegOut");
    const aOut = $("#taylorAOut");
    const nextOut = $("#taylorNextOut");

    let timer = null;

    function current() {
      return {
        key: fnSelect.value,
        p: TAYLOR[fnSelect.value],
        a: parseFloat(aInput.value),
        n: parseInt(nInput.value, 10),
        zoom: parseFloat(zoomInput.value)
      };
    }

    function coeffs(p, a, n) {
      const out = [];
      for (let k = 0; k <= n; k++) {
        const d = p.deriv(a, k);
        out.push({ k, d, c: d / FACT[k] });
      }
      return out;
    }

    function termTex(c, k, a) {
      if (Math.abs(c) < 5e-5) return "";
      const base = Math.abs(a) < 1e-12 ? "x" : "\\left(x" + (a >= 0 ? "-" : "+") + fmt(Math.abs(a)) + "\\right)";
      let coef;
      const ac = Math.abs(c);
      if (Math.abs(ac - 1) < 1e-6) coef = "";
      else coef = fmtTex(ac);
      let body;
      if (k === 0) body = coef || "1";
      else if (k === 1) body = (coef ? coef : "") + base;
      else body = (coef ? coef : "") + base + "^{" + k + "}";
      return (c < 0 ? "-" : "+") + body;
    }

    function formulaTex(cs, a) {
      let s = "";
      for (let i = 0; i < cs.length; i++) {
        const t = termTex(cs[i].c, cs[i].k, a);
        if (!t) continue;
        if (!s) s = t.charAt(0) === "+" ? t.slice(1) : t;
        else s += " " + t;
      }
      return s || "0";
    }

    function draw() {
      const s = current();
      const p = s.p;
      const a = Math.min(p.aMax, Math.max(p.aMin, s.a));
      if (a !== s.a) {
        aInput.value = String(a);
        s.a = a;
      }
      aVal.textContent = a.toFixed(2);
      nVal.textContent = String(s.n);
      zoomVal.textContent = "±" + s.zoom.toFixed(1);
      degOut.textContent = String(s.n);
      aOut.textContent = a.toFixed(2);

      const cs = coeffs(p, a, s.n);
      setTex(formula, "T_{" + s.n + "}(x)=" + formulaTex(cs, a));

      tableBody.innerHTML = "";
      cs.forEach(function (row) {
        const tr = document.createElement("tr");
        const tdK = document.createElement("td");
        tdK.textContent = String(row.k);
        const tdD = document.createElement("td");
        tdD.textContent = fmt(row.d);
        const tdC = document.createElement("td");
        tdC.textContent = fmt(row.c);
        const tdT = document.createElement("td");
        const span = document.createElement("span");
        tdT.appendChild(span);
        tr.appendChild(tdK);
        tr.appendChild(tdD);
        tr.appendChild(tdC);
        tr.appendChild(tdT);
        tableBody.appendChild(tr);
        setTex(span, termTex(row.c, row.k, a).replace(/^\+/, "") || "0", false);
      });

      const nextD = p.deriv(a, s.n + 1);
      const nextC = nextD / FACT[s.n + 1];
      nextOut.textContent = (Math.abs(nextC) < 5e-5 ? "0" : fmt(nextC)) + (s.n + 1 === 0 ? "" : " · Term " + (s.n + 1));

      let lo = Math.max(a - s.zoom, p.domainMin + 0.02);
      let hi = a + s.zoom;
      if (p.domainMin > -Infinity && lo <= p.domainMin) lo = p.domainMin + 0.02;
      if (p.key === "geom" && hi > 0.98) hi = 0.98;

      const fvals = [];
      const tvals = [];
      for (let k = 0; k <= 700; k++) {
        const x = lo + (k / 700) * (hi - lo);
        const fx = p.f(x);
        if (isFinite(fx)) fvals.push(fx);
        let tx = 0;
        for (let j = cs.length - 1; j >= 0; j--) {
          tx = tx * (x - a) + cs[j].c;
        }
        if (isFinite(tx)) tvals.push(tx);
      }
      const yr = robustRange(fvals.concat(tvals), -3, 3);

      const v = fitCanvas(canvas);
      const ctx = v.ctx, W = v.W, H = v.H;
      const m = mapper(W, H, { l: 32, r: 18, t: 22, b: 28 }, lo, hi, yr[0], yr[1]);
      frame(ctx, W, H, m, { nx: 8, ny: 5 });

      const fp = [];
      for (let k = 0; k <= 800; k++) {
        const x = lo + (k / 800) * (hi - lo);
        const y = p.f(x);
        if (isFinite(y)) fp.push([x, y]);
      }
      line(ctx, m, fp, C.faint, 2.2, null);

      const tp = [];
      for (let k = 0; k <= 800; k++) {
        const x = lo + (k / 800) * (hi - lo);
        let y = 0;
        for (let j = cs.length - 1; j >= 0; j--) {
          y = y * (x - a) + cs[j].c;
        }
        if (isFinite(y)) tp.push([x, y]);
      }
      line(ctx, m, tp, C.teal, 2.4, null);

      ctx.save();
      ctx.strokeStyle = "rgba(190,18,60,.45)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(m.X(a), m.Y(m.ymin));
      ctx.lineTo(m.X(a), m.Y(m.ymax));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.rose;
      ctx.beginPath();
      ctx.arc(m.X(a), m.Y(p.f(a)), 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      text(ctx, "a = " + a.toFixed(2), m.X(a), H - 9, { size: 9, color: C.rose, align: "center" });
      text(ctx, p.label, 32, 15, { size: 9.5, color: C.faint });
      text(ctx, "T" + s.n, W - 18, 15, { size: 9.5, color: C.teal, align: "right" });
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
        play.textContent = "Terme aufbauen";
        play.classList.remove("amber");
      }
    }

    function start() {
      if (timer) return;
      if (parseInt(nInput.value, 10) >= 12) nInput.value = "0";
      play.textContent = "Stopp";
      play.classList.add("amber");
      timer = setInterval(function () {
        let n = parseInt(nInput.value, 10) + 1;
        if (n > 12) {
          stop();
          play.textContent = "Nochmal";
          return;
        }
        nInput.value = String(n);
        draw();
      }, 560);
    }

    fnSelect.addEventListener("change", function () {
      const p = TAYLOR[fnSelect.value];
      aInput.min = String(p.aMin);
      aInput.max = String(p.aMax);
      let a = parseFloat(aInput.value);
      if (a < p.aMin || a > p.aMax) {
        a = Math.min(p.aMax, Math.max(p.aMin, a));
        aInput.value = String(a);
      }
      stop();
      draw();
    });
    aInput.addEventListener("input", function () {
      stop();
      draw();
    });
    nInput.addEventListener("input", function () {
      stop();
      draw();
    });
    zoomInput.addEventListener("input", draw);
    play.addEventListener("click", function () {
      if (timer) stop();
      else start();
    });
    reset.addEventListener("click", function () {
      stop();
      fnSelect.value = "sin";
      aInput.min = "-2";
      aInput.max = "2";
      aInput.value = "0";
      nInput.value = "3";
      zoomInput.value = "4";
      draw();
    });

    aInput.min = String(TAYLOR[fnSelect.value].aMin);
    aInput.max = String(TAYLOR[fnSelect.value].aMax);
    draw();
    window.addEventListener("resize", debounce(draw, 120));
  }

  /* ---------- Labor 2: Konvergenzradius ---------- */

  const RADIUS = {
    geom: {
      f: function (x) { return 1 / (1 - x); },
      series: function (n, x) {
        let s = 0;
        for (let k = 0; k <= n; k++) s += Math.pow(x, k);
        return s;
      },
      radius: 1,
      behavior: "Pol",
      singText: "1",
      sing: [{ re: 1, im: 0, label: "1" }]
    },
    ln: {
      f: function (x) { return Math.log(1 + x); },
      series: function (n, x) {
        let s = 0;
        for (let k = 1; k <= n; k++) s += (Math.pow(-1, k - 1) * Math.pow(x, k)) / k;
        return s;
      },
      radius: 1,
      behavior: "Verzweigung",
      singText: "−1",
      sing: [{ re: -1, im: 0, label: "−1" }]
    },
    sqrt: {
      f: function (x) { return Math.sqrt(1 + x); },
      series: function (n, x) {
        let s = 0;
        for (let k = 0; k <= n; k++) {
          let p = 1;
          for (let j = 0; j < k; j++) p *= (0.5 - j);
          s += (p / FACT[k]) * Math.pow(x, k);
        }
        return s;
      },
      radius: 1,
      behavior: "Verzweigung",
      singText: "−1",
      sing: [{ re: -1, im: 0, label: "−1" }]
    },
    atan: {
      f: Math.atan,
      series: function (n, x) {
        let s = 0;
        for (let k = 0; k <= n; k++) {
          if (2 * k + 1 > n) break;
          s += (Math.pow(-1, k) * Math.pow(x, 2 * k + 1)) / (2 * k + 1);
        }
        return s;
      },
      radius: 1,
      behavior: "Verzweigung",
      singText: "±i",
      sing: [{ re: 0, im: 1, label: "i" }, { re: 0, im: -1, label: "−i" }]
    },
    inv: {
      f: function (x) { return 1 / (1 + x * x); },
      series: function (n, x) {
        let s = 0;
        for (let k = 0; k <= n; k++) {
          if (2 * k > n) break;
          s += Math.pow(-1, k) * Math.pow(x, 2 * k);
        }
        return s;
      },
      radius: 1,
      behavior: "Pol",
      singText: "±i",
      sing: [{ re: 0, im: 1, label: "i" }, { re: 0, im: -1, label: "−i" }]
    },
    exp: {
      f: Math.exp,
      series: function (n, x) {
        let s = 0;
        for (let k = 0; k <= n; k++) s += Math.pow(x, k) / FACT[k];
        return s;
      },
      radius: Infinity,
      behavior: "ganz",
      singText: "keine",
      sing: []
    },
    sin: {
      f: Math.sin,
      series: function (n, x) {
        let s = 0;
        for (let k = 0; k <= n; k++) {
          if (2 * k + 1 > n) break;
          s += (Math.pow(-1, k) * Math.pow(x, 2 * k + 1)) / FACT[2 * k + 1];
        }
        return s;
      },
      radius: Infinity,
      behavior: "ganz",
      singText: "keine",
      sing: []
    }
  };

  function initRadius() {
    const realCanvas = $("#radiusReal");
    const planeCanvas = $("#radiusPlane");
    if (!realCanvas || !planeCanvas) return;
    const fnSelect = $("#radiusFn");
    const nInput = $("#radiusN");
    const nVal = $("#radiusNVal");
    const radiusOut = $("#radiusOut");
    const singOut = $("#radiusSing");
    const behaviorOut = $("#radiusBehavior");

    function draw() {
      const p = RADIUS[fnSelect.value];
      const n = parseInt(nInput.value, 10);
      nVal.textContent = String(n);
      radiusOut.textContent = isFinite(p.radius) ? p.radius.toFixed(2) : "∞";
      singOut.textContent = p.singText;
      behaviorOut.textContent = p.behavior;

      // reelle Achse
      const v = fitCanvas(realCanvas);
      const ctx = v.ctx, W = v.W, H = v.H;
      const xmin = -2.5, xmax = 2.5;
      const fvals = [];
      for (let k = 0; k <= 700; k++) {
        const x = xmin + (k / 700) * (xmax - xmin);
        const y = p.f(x);
        if (isFinite(y)) fvals.push(y);
      }
      const yr = robustRange(fvals, -4, 4);
      const m = mapper(W, H, { l: 28, r: 14, t: 20, b: 26 }, xmin, xmax, yr[0], yr[1]);
      frame(ctx, W, H, m, { nx: 6, ny: 4 });

      if (isFinite(p.radius)) {
        ctx.save();
        ctx.fillStyle = "rgba(190,18,60,.06)";
        ctx.fillRect(m.X(xmin), m.Y(yr[1]), m.X(-p.radius) - m.X(xmin), m.Y(yr[0]) - m.Y(yr[1]));
        ctx.fillRect(m.X(p.radius), m.Y(yr[1]), m.X(xmax) - m.X(p.radius), m.Y(yr[0]) - m.Y(yr[1]));
        ctx.strokeStyle = "rgba(190,18,60,.35)";
        ctx.setLineDash([4, 4]);
        [-p.radius, p.radius].forEach(function (r) {
          ctx.beginPath();
          ctx.moveTo(m.X(r), m.Y(yr[0]));
          ctx.lineTo(m.X(r), m.Y(yr[1]));
          ctx.stroke();
        });
        ctx.restore();
      }

      const fp = [];
      for (let k = 0; k <= 800; k++) {
        const x = xmin + (k / 800) * (xmax - xmin);
        const y = p.f(x);
        if (isFinite(y)) fp.push([x, y]);
      }
      line(ctx, m, fp, C.faint, 2, null);

      const tp = [];
      for (let k = 0; k <= 800; k++) {
        const x = xmin + (k / 800) * (xmax - xmin);
        const y = p.series(n, x);
        if (isFinite(y)) tp.push([x, y]);
      }
      line(ctx, m, tp, C.teal, 2.2, null);
      text(ctx, "x", W - 14, H - 7, { size: 9, color: C.faint, align: "right" });
      if (isFinite(p.radius)) {
        text(ctx, "|x| > R", W - 14, 14, { size: 9, color: C.rose, align: "right" });
      }

      // komplexe Ebene
      const pv = fitCanvas(planeCanvas);
      const pctx = pv.ctx, PW = pv.W, PH = pv.H;
      const pm = mapper(PW, PH, { l: 24, r: 14, t: 18, b: 24 }, -2.5, 2.5, -2.5, 2.5);
      frame(pctx, PW, PH, pm, { nx: 4, ny: 4 });
      text(pctx, "Re", PW - 14, PH - 7, { size: 9, color: C.faint, align: "right" });
      text(pctx, "Im", 24, 13, { size: 9, color: C.faint });

      if (isFinite(p.radius)) {
        pctx.save();
        pctx.strokeStyle = "rgba(15,118,110,.55)";
        pctx.setLineDash([4, 4]);
        pctx.beginPath();
        pctx.arc(pm.X(0), pm.Y(0), (pm.X(p.radius) - pm.X(0)), 0, Math.PI * 2);
        pctx.stroke();
        pctx.restore();
      }

      p.sing.forEach(function (s) {
        const x = pm.X(s.re);
        const y = pm.Y(s.im);
        pctx.save();
        pctx.fillStyle = C.rose;
        pctx.beginPath();
        pctx.arc(x, y, 4, 0, Math.PI * 2);
        pctx.fill();
        pctx.fillStyle = C.rose;
        pctx.font = "10px Inter, sans-serif";
        pctx.textAlign = "left";
        pctx.fillText(s.label, x + 7, y - 6);
        pctx.restore();
      });

      if (!p.sing.length) {
        text(pctx, "keine Singularität", PW / 2, PH / 2, {
          size: 10, color: C.faint, align: "center"
        });
      }
    }

    fnSelect.addEventListener("change", draw);
    nInput.addEventListener("input", draw);
    draw();
    window.addEventListener("resize", debounce(draw, 120));
  }

  /* ---------- Labor 3: Euler ---------- */

  function initEuler() {
    const canvas = $("#eulerCanvas");
    if (!canvas) return;
    const thetaInput = $("#eulerTheta");
    const nInput = $("#eulerN");
    const thetaVal = $("#eulerThetaVal");
    const nVal = $("#eulerNVal");
    const sumOut = $("#eulerSum");
    const exactOut = $("#eulerExact");
    const errOut = $("#eulerErr");
    const play = $("#eulerPlay");
    const reset = $("#eulerReset");

    let timer = null;

    function draw() {
      const deg = parseFloat(thetaInput.value);
      const theta = (deg * Math.PI) / 180;
      const n = parseInt(nInput.value, 10);
      thetaVal.textContent = Math.round(deg) + "°";
      nVal.textContent = String(n);

      let zr = 0, zi = 0;
      let tr = 1, ti = 0;
      const points = [[0, 0]];
      for (let k = 0; k <= n; k++) {
        if (k > 0) {
          const nr = tr * 0 - ti * theta;
          const ni = tr * theta + ti * 0;
          tr = nr / k;
          ti = ni / k;
        }
        zr += tr;
        zi += ti;
        points.push([zr, zi]);
      }

      const v = fitCanvas(canvas);
      const ctx = v.ctx, W = v.W, H = v.H;
      const m = mapper(W, H, { l: 28, r: 18, t: 24, b: 28 }, -2.5, 2.5, -2.5, 2.5);
      frame(ctx, W, H, m, { nx: 5, ny: 5 });

      ctx.save();
      ctx.strokeStyle = "rgba(15,118,110,.45)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(m.X(0), m.Y(0), m.X(1) - m.X(0), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Termvektoren
      for (let i = 1; i < points.length; i++) {
        ctx.save();
        ctx.strokeStyle = "rgba(109,40,217,.30)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(m.X(points[i - 1][0]), m.Y(points[i - 1][1]));
        ctx.lineTo(m.X(points[i][0]), m.Y(points[i][1]));
        ctx.stroke();
        ctx.restore();
      }
      line(ctx, m, points, C.violet, 2.2, null);

      // exakter Punkt
      const er = Math.cos(theta);
      const ei = Math.sin(theta);
      ctx.save();
      ctx.fillStyle = C.teal;
      ctx.beginPath();
      ctx.arc(m.X(er), m.Y(ei), 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.rose;
      ctx.beginPath();
      ctx.arc(m.X(zr), m.Y(zi), 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const err = Math.hypot(zr - er, zi - ei);
      sumOut.textContent = zr.toFixed(3) + " " + (zi >= 0 ? "+" : "−") + " " + Math.abs(zi).toFixed(3) + "i";
      exactOut.textContent = er.toFixed(3) + " " + (ei >= 0 ? "+" : "−") + " " + Math.abs(ei).toFixed(3) + "i";
      errOut.textContent = err.toFixed(4);

      text(ctx, "Re", W - 18, H - 7, { size: 9, color: C.faint, align: "right" });
      text(ctx, "Im", 28, 14, { size: 9, color: C.faint });
      text(ctx, "e^(iθ)", W - 18, 16, { size: 9.5, color: C.teal, align: "right" });
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
        play.textContent = "Animation";
        play.classList.remove("amber");
      }
    }

    function start() {
      if (timer) return;
      if (parseInt(nInput.value, 10) >= 20) nInput.value = "0";
      play.textContent = "Stopp";
      play.classList.add("amber");
      timer = setInterval(function () {
        let n = parseInt(nInput.value, 10) + 1;
        if (n > 20) {
          stop();
          play.textContent = "Nochmal";
          return;
        }
        nInput.value = String(n);
        draw();
      }, 330);
    }

    thetaInput.addEventListener("input", function () {
      stop();
      draw();
    });
    nInput.addEventListener("input", function () {
      stop();
      draw();
    });
    play.addEventListener("click", function () {
      if (timer) stop();
      else start();
    });
    reset.addEventListener("click", function () {
      stop();
      thetaInput.value = "90";
      nInput.value = "5";
      draw();
    });

    draw();
    window.addEventListener("resize", debounce(draw, 120));
  }

  /* ---------- Labor 4: Mehrere Variablen ---------- */

  function initSurface() {
    const plot = $("#surfacePlot");
    if (!plot) return;
    const aInput = $("#surfA");
    const bInput = $("#surfB");
    const orderSelect = $("#surfOrder");
    const aVal = $("#surfAVal");
    const bVal = $("#surfBVal");
    const fOut = $("#surfF");
    const gradOut = $("#surfGrad");
    const hessOut = $("#surfHess");

    const N = 36;
    const xs = [];
    const ys = [];
    const xmin = -2.2, xmax = 2.2;

    function f(x, y) {
      return 0.5 * x * x + y * y + 0.6 * Math.sin(x) * Math.cos(y);
    }
    function fx(x, y) { return x + 0.6 * Math.cos(x) * Math.cos(y); }
    function fy(x, y) { return 2 * y - 0.6 * Math.sin(x) * Math.sin(y); }
    function fxx(x, y) { return 1 - 0.6 * Math.sin(x) * Math.cos(y); }
    function fxy(x, y) { return -0.6 * Math.cos(x) * Math.sin(y); }
    function fyy(x, y) { return 2 - 0.6 * Math.sin(x) * Math.cos(y); }

    for (let i = 0; i < N; i++) {
      xs.push(xmin + (i / (N - 1)) * (xmax - xmin));
      ys.push(xmin + (i / (N - 1)) * (xmax - xmin));
    }

    function build() {
      if (!window.Plotly) {
        plot.innerHTML = "<p style='padding:20px;color:#5b6270'>Plotly konnte nicht geladen werden.</p>";
        return;
      }
      const a = parseFloat(aInput.value);
      const b = parseFloat(bInput.value);
      aVal.textContent = a.toFixed(2);
      bVal.textContent = b.toFixed(2);

      const fa = f(a, b);
      const gx = fx(a, b);
      const gy = fy(a, b);
      const hxx = fxx(a, b);
      const hxy = fxy(a, b);
      const hyy = fyy(a, b);
      fOut.textContent = fa.toFixed(3);
      gradOut.textContent = "(" + gx.toFixed(2) + ", " + gy.toFixed(2) + ")";
      hessOut.textContent = "[[" + hxx.toFixed(2) + ", " + hxy.toFixed(2) + "], [" + hxy.toFixed(2) + ", " + hyy.toFixed(2) + "]]";

      const zf = [];
      const zap = [];
      for (let i = 0; i < N; i++) {
        const rowF = [];
        const rowA = [];
        for (let j = 0; j < N; j++) {
          const x = xs[j];
          const y = ys[i];
          const dx = x - a;
          const dy = y - b;
          rowF.push(f(x, y));
          let val = fa + gx * dx + gy * dy;
          if (orderSelect.value === "2") {
            val += 0.5 * (hxx * dx * dx + 2 * hxy * dx * dy + hyy * dy * dy);
          }
          rowA.push(val);
        }
        zf.push(rowF);
        zap.push(rowA);
      }

      const surfaceF = {
        type: "surface",
        x: xs, y: ys, z: zf,
        colorscale: [[0, "#e4f2ef"], [0.45, "#5ab3a8"], [1, "#0f766e"]],
        opacity: 0.86,
        showscale: false,
        name: "f(x,y)",
        hovertemplate: "x=%{x:.2f}<br>y=%{y:.2f}<br>f=%{z:.2f}<extra></extra>"
      };
      const surfaceA = {
        type: "surface",
        x: xs, y: ys, z: zap,
        colorscale: [[0, "#fdf1df"], [0.5, "#e8b06b"], [1, "#b45309"]],
        opacity: 0.72,
        showscale: false,
        name: orderSelect.value === "2" ? "quadratisch" : "linear",
        hovertemplate: "x=%{x:.2f}<br>y=%{y:.2f}<br>Näherung=%{z:.2f}<extra></extra>"
      };
      const point = {
        type: "scatter3d",
        mode: "markers",
        x: [a], y: [b], z: [fa],
        marker: { size: 5, color: "#be123c" },
        name: "Entwicklungspunkt",
        hovertemplate: "a=%{x:.2f}<br>b=%{y:.2f}<br>f=%{z:.2f}<extra></extra>"
      };

      const layout = {
        margin: { l: 0, r: 0, t: 6, b: 0 },
        paper_bgcolor: "rgba(0,0,0,0)",
        font: { family: "Inter, system-ui, sans-serif", size: 10, color: "#5b6270" },
        scene: {
          xaxis: { title: "x", gridcolor: "#eee6d6", zerolinecolor: "#d8cfbb" },
          yaxis: { title: "y", gridcolor: "#eee6d6", zerolinecolor: "#d8cfbb" },
          zaxis: { title: "z", gridcolor: "#eee6d6", zerolinecolor: "#d8cfbb" },
          bgcolor: "rgba(0,0,0,0)",
          camera: { eye: { x: 1.45, y: -1.7, z: 0.95 } },
          aspectratio: { x: 1, y: 1, z: 0.8 }
        },
        showlegend: false
      };

      window.Plotly.react(plot, [surfaceF, surfaceA, point], layout, {
        displayModeBar: false,
        responsive: true
      });
    }

    const schedule = scheduleDraw(build);
    [aInput, bInput].forEach(function (el) {
      el.addEventListener("input", schedule);
    });
    orderSelect.addEventListener("change", build);
    build();
    window.addEventListener("resize", debounce(function () {
      if (window.Plotly) window.Plotly.Plots.resize(plot);
    }, 150));
  }

  /* ---------- Labor 5: Newton ---------- */

  const NEWTON = {
    sq: {
      label: "x² − 2",
      f: function (x) { return x * x - 2; },
      fp: function (x) { return 2 * x; },
      root: Math.SQRT2,
      view: [-0.4, 3]
    },
    cos: {
      label: "cos x",
      f: Math.cos,
      fp: function (x) { return -Math.sin(x); },
      root: Math.PI / 2,
      view: [-0.6, 4]
    },
    cubic: {
      label: "x³ − 2x − 5",
      f: function (x) { return x * x * x - 2 * x - 5; },
      fp: function (x) { return 3 * x * x - 2; },
      root: 2.0945514815423265,
      view: [1, 3.2]
    },
    exp: {
      label: "eˣ − 2",
      f: function (x) { return Math.exp(x) - 2; },
      fp: Math.exp,
      root: Math.LN2,
      view: [-1.2, 2.2]
    }
  };

  function initNewton() {
    const canvas = $("#newtonCanvas");
    if (!canvas) return;
    const fnSelect = $("#newtonFn");
    const x0Input = $("#newtonX0");
    const x0Val = $("#newtonX0Val");
    const stepBtn = $("#newtonStep");
    const autoBtn = $("#newtonAuto");
    const resetBtn = $("#newtonReset");
    const iterOut = $("#newtonIter");
    const xOut = $("#newtonX");
    const fxOut = $("#newtonFx");
    const tableBody = $("#newtonTable tbody");

    let x = parseFloat(x0Input.value);
    let history = [];
    let timer = null;

    function current() {
      return NEWTON[fnSelect.value];
    }

    function step() {
      const p = current();
      const fx = p.f(x);
      const fpx = p.fp(x);
      if (!isFinite(fx) || !isFinite(fpx) || Math.abs(fpx) < 1e-12) {
        stopAuto();
        return;
      }
      const next = x - fx / fpx;
      history.push({ x: x, fx: fx, fpx: fpx, next: next });
      x = next;
      draw();
    }

    function draw() {
      const p = current();
      x0Val.textContent = parseFloat(x0Input.value).toFixed(2);
      iterOut.textContent = String(history.length);
      xOut.textContent = x.toFixed(5);
      fxOut.textContent = p.f(x).toFixed(5);

      const xmin = p.view[0];
      const xmax = p.view[1];
      const fvals = [];
      for (let k = 0; k <= 600; k++) {
        const xx = xmin + (k / 600) * (xmax - xmin);
        const yy = p.f(xx);
        if (isFinite(yy)) fvals.push(yy);
      }
      const yr = robustRange(fvals, -5, 5);
      const v = fitCanvas(canvas);
      const ctx = v.ctx, W = v.W, H = v.H;
      const m = mapper(W, H, { l: 30, r: 18, t: 22, b: 28 }, xmin, xmax, yr[0], yr[1]);
      frame(ctx, W, H, m, { nx: 7, ny: 4 });

      const curve = [];
      for (let k = 0; k <= 700; k++) {
        const xx = xmin + (k / 700) * (xmax - xmin);
        const yy = p.f(xx);
        if (isFinite(yy)) curve.push([xx, yy]);
      }
      line(ctx, m, curve, C.faint, 2, null);

      history.forEach(function (h) {
        ctx.save();
        ctx.fillStyle = "rgba(139,145,160,.45)";
        ctx.beginPath();
        ctx.arc(m.X(h.x), m.Y(h.fx), 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      const fx = p.f(x);
      const fpx = p.fp(x);
      if (isFinite(fx) && isFinite(fpx) && Math.abs(fpx) > 1e-12) {
        const next = x - fx / fpx;
        const t0 = x - Math.abs(fx / fpx) - 0.5;
        const t1 = x + Math.abs(fx / fpx) + 0.5;
        const tangent = [];
        for (let k = 0; k <= 120; k++) {
          const xx = t0 + (k / 120) * (t1 - t0);
          tangent.push([xx, fx + fpx * (xx - x)]);
        }
        line(ctx, m, tangent, C.amber, 1.6, [4, 4]);

        ctx.save();
        ctx.strokeStyle = "rgba(15,118,110,.35)";
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(m.X(x), m.Y(0));
        ctx.lineTo(m.X(x), m.Y(fx));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.teal;
        ctx.beginPath();
        ctx.arc(m.X(x), m.Y(fx), 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.rose;
        ctx.beginPath();
        ctx.arc(m.X(next), m.Y(0), 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        text(ctx, "xₙ", m.X(x), m.Y(fx) - 8, { size: 9, color: C.teal, align: "center" });
        text(ctx, "xₙ₊₁", m.X(next), m.Y(0) + 14, { size: 9, color: C.rose, align: "center" });
      }

      text(ctx, p.label, 30, 15, { size: 9.5, color: C.faint });
      text(ctx, "x", W - 16, H - 7, { size: 9, color: C.faint, align: "right" });

      const rows = history.slice(-6);
      tableBody.innerHTML = "";
      rows.forEach(function (h, idx) {
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" + (history.length - rows.length + idx + 1) + "</td>" +
          "<td>" + h.x.toFixed(5) + "</td>" +
          "<td>" + h.fx.toFixed(5) + "</td>" +
          "<td>" + h.fpx.toFixed(5) + "</td>";
        tableBody.appendChild(tr);
      });
      if (!rows.length) {
        const tr = document.createElement("tr");
        tr.innerHTML = "<td>0</td><td>" + x.toFixed(5) + "</td><td>" + p.f(x).toFixed(5) + "</td><td>" + p.fp(x).toFixed(5) + "</td>";
        tableBody.appendChild(tr);
      }
    }

    function stopAuto() {
      if (timer) {
        clearInterval(timer);
        timer = null;
        autoBtn.textContent = "Auto";
        autoBtn.classList.remove("amber");
      }
    }

    function startAuto() {
      if (timer) return;
      autoBtn.textContent = "Stopp";
      autoBtn.classList.add("amber");
      timer = setInterval(function () {
        if (Math.abs(current().f(x)) < 1e-10 || history.length > 25) {
          stopAuto();
          return;
        }
        step();
      }, 650);
    }

    fnSelect.addEventListener("change", function () {
      stopAuto();
      const p = current();
      x = Math.min(p.view[1], Math.max(p.view[0], parseFloat(x0Input.value)));
      x0Input.value = String(x);
      history = [];
      draw();
    });
    x0Input.addEventListener("input", function () {
      stopAuto();
      x = parseFloat(x0Input.value);
      history = [];
      draw();
    });
    stepBtn.addEventListener("click", function () {
      stopAuto();
      step();
    });
    autoBtn.addEventListener("click", function () {
      if (timer) stopAuto();
      else startAuto();
    });
    resetBtn.addEventListener("click", function () {
      stopAuto();
      x = parseFloat(x0Input.value);
      history = [];
      draw();
    });

    draw();
    window.addEventListener("resize", debounce(draw, 120));
  }

  /* ---------- Start ---------- */

  function start() {
    renderMath();
    initReadingUI();
    initReveal();
    initSteps();
    initHero();
    initTaylorBuilder();
    initRadius();
    initEuler();
    initSurface();
    initNewton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
