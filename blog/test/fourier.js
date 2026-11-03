/* ==========================================================================
   Fourier visuell — Interaktionen
   Keine Abhängigkeiten außer Temml und Plotly (beide lokal geladen).
   ========================================================================== */

(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const C = {
    teal: "#0f766e",
    tealSoft: "#99d8cf",
    amber: "#b45309",
    amberSoft: "#f0c48a",
    rose: "#be123c",
    violet: "#6d28d9",
    sky: "#0369a1",
    ink: "#20242e",
    dim: "#5b6270",
    faint: "#8b91a0",
    grid: "#e7e0d0",
    axis: "#cfc4aa",
    paper: "#fffdf7",
    card: "#fbf7ec"
  };

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

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        const tr = re[i]; re[i] = re[j]; re[j] = tr;
        const ti = im[i]; im[i] = im[j]; im[j] = ti;
      }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (-2 * Math.PI) / len;
      const wlenRe = Math.cos(ang);
      const wlenIm = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let wRe = 1;
        let wIm = 0;
        for (let j = 0; j < len / 2; j++) {
          const uRe = re[i + j];
          const uIm = im[i + j];
          const vRe = re[i + j + len / 2] * wRe - im[i + j + len / 2] * wIm;
          const vIm = re[i + j + len / 2] * wIm + im[i + j + len / 2] * wRe;
          re[i + j] = uRe + vRe;
          im[i + j] = uIm + vIm;
          re[i + j + len / 2] = uRe - vRe;
          im[i + j + len / 2] = uIm - vIm;
          const nwRe = wRe * wlenRe - wIm * wlenIm;
          const wImNew = wRe * wlenIm + wIm * wlenRe;
          wRe = nwRe;
          wIm = wImNew;
        }
      }
    }
  }

  /* ---------- Mathematik rendern ---------- */

  function renderMath() {
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

  /* ---------- Schritt-für-Schritt-Aufdecker ---------- */

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

  /* ---------- Hero ---------- */

  function initHero() {
    const canvas = $("#heroCanvas");
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

    const freqs = [1, 3, 5, 7, 9];
    const amps = [1, 0.33, 0.2, 0.14, 0.1];
    const colors = [C.teal, C.amber, C.violet, C.rose, C.sky];

    function wave(x, phase, n) {
      let y = 0;
      for (let i = 0; i < freqs.length; i++) {
        y += amps[i] * Math.sin((freqs[i] * 2 * Math.PI * x) + phase * freqs[i] * 0.6 + i * 0.7);
      }
      return y / 1.8;
    }

    function draw(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible && !document.hidden && !reduceMotion) t += dt;

      resize();
      const split = Math.round(W * 0.71);
      const m = mapper(split, H, { l: 18, r: 12, t: 18, b: 30 }, 0, 1, -1.15, 1.15);
      frame(ctx, split, H, m, { nx: 8, ny: 4 });

      for (let i = 0; i < freqs.length; i++) {
        const pts = [];
        for (let k = 0; k <= 180; k++) {
          const x = k / 180;
          const y = amps[i] * Math.sin(freqs[i] * 2 * Math.PI * x + t * freqs[i] * 0.6 + i * 0.7);
          pts.push([x, y]);
        }
        line(ctx, m, pts, colors[i], 1, null);
      }

      const pts = [];
      for (let k = 0; k <= 360; k++) {
        const x = k / 360;
        pts.push([x, wave(x, t, 0)]);
      }
      line(ctx, m, pts, C.teal, 2.4, null);

      text(ctx, "Zeit", m.X(0.02), H - 8, { size: 9.5, color: C.faint });
      text(ctx, "Summe", split - 10, 16, { size: 9.5, color: C.teal, align: "right", weight: 650 });

      // Spektrum rechts
      const bx = split + 18;
      const by = H - 42;
      const bw = W - bx - 18;
      const bh = H - 80;
      text(ctx, "Frequenz", bx, 18, { size: 9.5, color: C.faint, weight: 650 });
      for (let i = 0; i < freqs.length; i++) {
        const barW = bw / freqs.length - 6;
        const x = bx + i * (bw / freqs.length) + 3;
        const h = amps[i] * bh * 1.45;
        ctx.fillStyle = i === 0 ? C.teal : "rgba(15,118,110,.22)";
        ctx.fillRect(x, by - h, barW, h);
        ctx.fillStyle = C.faint;
        ctx.font = "9px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(freqs[i] + "ω₀", x + barW / 2, by + 14);
      }
      ctx.strokeStyle = C.axis;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + bw, by);
      ctx.stroke();
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
    if (!reduceMotion) {
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener("resize", debounce(function () {
      draw(performance.now());
    }, 120));
  }

  /* ---------- Labor 1: Harmonischen-Mixer ---------- */

  function initMixer() {
    const canvas = $("#mixerCanvas");
    if (!canvas) return;
    const controls = $("#mixerControls");
    const activeEl = $("#mixerActive");
    const presets = {
      square: [1, 0, 1 / 3, 0, 1 / 5, 0],
      saw: [1, -1 / 2, 1 / 3, -1 / 4, 1 / 5, -1 / 6],
      soft: [1, 1 / 2, 1 / 4, 1 / 8, 1 / 16, 1 / 32],
      chord: [1, 0, 0.6, 0, 0.35, 0],
      silence: [0, 0, 0, 0, 0, 0]
    };
    const amps = presets.square.slice();
    const sliders = [];
    const values = [];
    const colors = [C.teal, C.amber, C.violet, C.rose, C.sky, C.faint];

    for (let i = 0; i < 6; i++) {
      const lab = document.createElement("label");
      lab.className = "control";
      const row = document.createElement("span");
      row.className = "row";
      const name = document.createElement("span");
      name.textContent = "Harmonische n = " + (i + 1);
      const val = document.createElement("b");
      val.textContent = amps[i].toFixed(2);
      row.appendChild(name);
      row.appendChild(val);
      const input = document.createElement("input");
      input.type = "range";
      input.min = "-1.5";
      input.max = "1.5";
      input.step = "0.05";
      input.value = String(amps[i]);
      lab.appendChild(row);
      lab.appendChild(input);
      controls.appendChild(lab);
      sliders.push(input);
      values.push(val);
      input.addEventListener("input", function () {
        amps[i] = parseFloat(input.value);
        val.textContent = amps[i].toFixed(2);
        draw();
      });
    }

    function setPreset(name) {
      const p = presets[name] || presets.silence;
      for (let i = 0; i < 6; i++) {
        amps[i] = p[i];
        sliders[i].value = String(p[i]);
        values[i].textContent = p[i].toFixed(2);
      }
      draw();
    }

    $$("#mixerPresets .chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$("#mixerPresets .chip").forEach(function (b) { b.classList.remove("on"); });
        btn.classList.add("on");
        setPreset(btn.dataset.preset);
      });
    });

    function draw() {
      const v = fitCanvas(canvas);
      const ctx = v.ctx, W = v.W, H = v.H;
      const split = Math.round(W * 0.7);
      const m = mapper(split, H, { l: 34, r: 10, t: 18, b: 26 }, 0, 2, -2.1, 2.1);
      frame(ctx, split, H, m, { nx: 8, ny: 4 });

      for (let i = 0; i < 6; i++) {
        if (Math.abs(amps[i]) < 0.005) continue;
        const pts = [];
        for (let k = 0; k <= 260; k++) {
          const t = (k / 260) * 2;
          pts.push([t, amps[i] * Math.sin(2 * Math.PI * (i + 1) * t)]);
        }
        line(ctx, m, pts, colors[i], 1.1, [3, 3]);
        ctx.globalAlpha = 1;
      }

      const sum = [];
      for (let k = 0; k <= 500; k++) {
        const t = (k / 500) * 2;
        let y = 0;
        for (let i = 0; i < 6; i++) {
          y += amps[i] * Math.sin(2 * Math.PI * (i + 1) * t);
        }
        sum.push([t, y]);
      }
      line(ctx, m, sum, C.teal, 2.5, null);

      text(ctx, "Zeit →", split - 12, H - 8, { size: 9.5, color: C.faint, align: "right" });
      text(ctx, "Summe", 34, 14, { size: 9.5, color: C.teal, weight: 650 });

      // Spektrum
      const bx = split + 16;
      const by = H - 34;
      const bw = W - bx - 16;
      const bh = H - 74;
      text(ctx, "Spektrum", bx, 14, { size: 9.5, color: C.faint, weight: 650 });
      ctx.strokeStyle = C.axis;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + bw, by);
      ctx.stroke();
      const maxA = 1.5;
      for (let i = 0; i < 6; i++) {
        const x = bx + 6 + (i * (bw - 12)) / 6;
        const w = (bw - 12) / 6 - 8;
        const h = Math.max(1, (Math.abs(amps[i]) / maxA) * bh);
        ctx.fillStyle = Math.abs(amps[i]) < 0.005 ? "rgba(139,145,160,.18)" : C.amber;
        if (amps[i] < 0) {
          ctx.fillStyle = "rgba(190,18,60,.55)";
          ctx.fillRect(x, by, w, h);
        } else {
          ctx.fillRect(x, by - h, w, h);
        }
        ctx.fillStyle = C.faint;
        ctx.font = "9px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(i + 1), x + w / 2, by + 14);
      }

      let count = 0;
      for (let i = 0; i < 6; i++) if (Math.abs(amps[i]) > 0.005) count++;
      if (activeEl) activeEl.textContent = String(count);
    }

    draw();
    window.addEventListener("resize", debounce(draw, 120));
  }

  /* ---------- Labor 2: rotierender Zeiger ---------- */

  function initPhasor() {
    const canvas = $("#phasorCanvas");
    if (!canvas) return;
    const freq = $("#phasorFreq");
    const phase = $("#phasorPhase");
    const amp = $("#phasorAmp");
    const freqVal = $("#phasorFreqVal");
    const phaseVal = $("#phasorPhaseVal");
    const ampVal = $("#phasorAmpVal");
    const play = $("#phasorPlay");
    const reset = $("#phasorReset");
    const angleOut = $("#phasorAngle");
    const projOut = $("#phasorProj");
    const periodOut = $("#phasorPeriod");

    let angle = 0;
    let lastPhase = 0;
    let playing = !reduceMotion;
    let visible = true;
    let last = performance.now();
    let frameCount = 0;

    function current() {
      return {
        f: parseFloat(freq.value),
        ph: (parseFloat(phase.value) * Math.PI) / 180,
        a: parseFloat(amp.value)
      };
    }

    function draw() {
      const v = fitCanvas(canvas);
      const ctx = v.ctx, W = v.W, H = v.H;
      const s = current();
      const size = Math.min(H - 26, W * 0.4);
      const cx = 18 + size / 2;
      const cy = H / 2;
      const r = size * 0.37 * s.a;

      // Kreis und Achsen
      ctx.save();
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = C.axis;
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.48, cy);
      ctx.lineTo(cx + size * 0.48, cy);
      ctx.moveTo(cx, cy - size * 0.48);
      ctx.lineTo(cx, cy + size * 0.48);
      ctx.stroke();
      ctx.restore();

      const px = cx + r * Math.cos(angle);
      const py = cy - r * Math.sin(angle);

      ctx.save();
      ctx.strokeStyle = C.violet;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.fillStyle = C.violet;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(109,40,217,.45)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(cx, py);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.violet;
      ctx.beginPath();
      ctx.arc(cx, py, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      text(ctx, "Einheitskreis", cx, 14, { size: 9.5, color: C.faint, align: "center" });

      // Welle rechts
      const left = size + 42;
      const m = mapper(W, H, { l: left, r: 22, t: 20, b: 30 }, 0, 2 / s.f, -1.55, 1.55);
      frame(ctx, W, H, m, { nx: 8, ny: 4 });

      const pts = [];
      const steps = 400;
      for (let k = 0; k <= steps; k++) {
        const t = (k / steps) * (2 / s.f);
        pts.push([t, s.a * Math.sin(2 * Math.PI * s.f * t + s.ph)]);
      }
      line(ctx, m, pts, C.teal, 2.3, null);

      const tNow = (((angle - s.ph) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI * s.f);
      const yNow = s.a * Math.sin(angle);
      const mx = m.X(tNow);
      const my = m.Y(yNow);
      ctx.save();
      ctx.strokeStyle = "rgba(15,118,110,.35)";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(mx, m.Y(m.ymin));
      ctx.lineTo(mx, m.Y(m.ymax));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.teal;
      ctx.beginPath();
      ctx.arc(mx, my, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      text(ctx, "Projektion auf die y-Achse", left, 14, { size: 9.5, color: C.faint });
      text(ctx, "Zeit →", W - 22, H - 8, { size: 9.5, color: C.faint, align: "right" });

      if (frameCount % 4 === 0) {
        angleOut.textContent = (Math.round(((angle * 180) / Math.PI) % 360) + 360) % 360 + "°";
        projOut.textContent = yNow.toFixed(3);
        periodOut.textContent = (1 / s.f).toFixed(3) + " s";
      }
      frameCount++;
    }

    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (playing && visible && !document.hidden) {
        angle += 2 * Math.PI * parseFloat(freq.value) * dt;
      }
      draw();
      requestAnimationFrame(tick);
    }

    function syncLabels() {
      freqVal.textContent = parseFloat(freq.value).toFixed(2) + " Hz";
      phaseVal.textContent = phase.value + "°";
      ampVal.textContent = parseFloat(amp.value).toFixed(2);
      draw();
    }

    freq.addEventListener("input", syncLabels);
    phase.addEventListener("input", function () {
      const ph = (parseFloat(phase.value) * Math.PI) / 180;
      angle += ph - lastPhase;
      lastPhase = ph;
      syncLabels();
    });
    amp.addEventListener("input", syncLabels);
    play.addEventListener("click", function () {
      playing = !playing;
      play.textContent = playing ? "Pause" : "Weiter";
      last = performance.now();
    });
    reset.addEventListener("click", function () {
      freq.value = "1";
      phase.value = "0";
      amp.value = "1";
      angle = 0;
      lastPhase = 0;
      playing = true;
      play.textContent = "Pause";
      syncLabels();
    });

    visibleTracker(canvas, function (v) { visible = v; });
    syncLabels();
    if (reduceMotion) play.textContent = "Weiter";
    requestAnimationFrame(tick);
    window.addEventListener("resize", debounce(draw, 120));
  }

  /* ---------- Hilfen für Fourier-Reihen ---------- */

  function squarePartial(t, N) {
    let s = 0;
    for (let k = 0; k < (N + 1) / 2; k++) {
      const n = 2 * k + 1;
      s += Math.sin(n * t) / n;
    }
    return (4 / Math.PI) * s;
  }

  function sawPartial(t, N) {
    let s = 0;
    for (let n = 1; n <= N; n++) {
      s += (Math.pow(-1, n + 1) * Math.sin(n * t)) / n;
    }
    return (2 / Math.PI) * s;
  }

  function trianglePartial(t, N) {
    let s = 0;
    for (let k = 0; k < (N + 1) / 2; k++) {
      const n = 2 * k + 1;
      s += Math.cos(n * t) / (n * n);
    }
    return (8 / (Math.PI * Math.PI)) * s;
  }

  /* ---------- Labor 3: Rechteckwelle ---------- */

  function initSquare() {
    const canvas = $("#squareCanvas");
    const specCanvas = $("#squareSpectrum");
    if (!canvas || !specCanvas) return;
    const nSlider = $("#squareN");
    const nVal = $("#squareNVal");
    const mode = $("#squareMode");
    const play = $("#squarePlay");
    const reset = $("#squareReset");
    const peakOut = $("#squarePeak");

    let timer = null;

    function draw() {
      const N = parseInt(nSlider.value, 10);
      nVal.textContent = String(N);

      const v = fitCanvas(canvas);
      const ctx = v.ctx, W = v.W, H = v.H;
      const m = mapper(W, H, { l: 30, r: 18, t: 20, b: 28 }, 0, 2 * Math.PI, -1.6, 1.6);
      frame(ctx, W, H, m, { nx: 8, ny: 4 });

      // exakte Rechteckwelle
      const square = [];
      for (let k = 0; k <= 400; k++) {
        const t = (k / 400) * 2 * Math.PI;
        square.push([t, t < Math.PI ? 1 : -1]);
      }
      line(ctx, m, square, C.faint, 1.4, [5, 4]);

      if (mode.value === "terms") {
        for (let k = 0; k < (N + 1) / 2; k++) {
          const n = 2 * k + 1;
          const pts = [];
          for (let j = 0; j <= 220; j++) {
            const t = (j / 220) * 2 * Math.PI;
            pts.push([t, (4 / Math.PI) * Math.sin(n * t) / n]);
          }
          line(ctx, m, pts, "rgba(180,83,9,.25)", 1, null);
        }
      }

      const pts = [];
      let peak = 0;
      for (let k = 0; k <= 900; k++) {
        const t = (k / 900) * 2 * Math.PI;
        const y = squarePartial(t, N);
        if (Math.abs(y) > peak) peak = Math.abs(y);
        pts.push([t, y]);
      }
      line(ctx, m, pts, C.teal, 2.4, null);
      peakOut.textContent = peak.toFixed(3);

      text(ctx, "0", m.X(0), H - 9, { size: 9, color: C.faint, align: "center" });
      text(ctx, "π", m.X(Math.PI), H - 9, { size: 9, color: C.faint, align: "center" });
      text(ctx, "2π", m.X(2 * Math.PI), H - 9, { size: 9, color: C.faint, align: "right" });
      text(ctx, "Partialsumme mit " + N + " Harmonischen", 30, 14, { size: 9.5, color: C.faint });

      // Spektrum
      const s = fitCanvas(specCanvas);
      const sx = s.ctx, SW = s.W, SH = s.H;
      const sm = mapper(SW, SH, { l: 28, r: 12, t: 12, b: 20 }, 0, 32, -0.02, 1.35);
      sx.strokeStyle = C.axis;
      sx.beginPath();
      sx.moveTo(sm.X(0), sm.Y(0));
      sx.lineTo(sm.X(32), sm.Y(0));
      sx.stroke();
      for (let n = 1; n <= 31; n += 2) {
        const h = 4 / (n * Math.PI);
        const used = n <= N;
        const x = sm.X(n);
        sx.fillStyle = used ? C.amber : "rgba(139,145,160,.28)";
        const w = Math.max(2, (sm.iw / 32) * 0.55);
        sx.fillRect(x - w / 2, sm.Y(h), w, sm.Y(0) - sm.Y(h));
        if (n <= 15) {
          sx.fillStyle = C.faint;
          sx.font = "8.5px Inter, sans-serif";
          sx.textAlign = "center";
          sx.fillText(String(n), x, SH - 6);
        }
      }
      sx.fillStyle = C.faint;
      sx.font = "9px Inter, sans-serif";
      sx.textAlign = "left";
      sx.fillText("Amplitude 4/(nπ)", 28, 10);
    }

    function stopAnim() {
      if (timer) {
        clearInterval(timer);
        timer = null;
        play.textContent = "Animation";
        play.classList.remove("amber");
      }
    }

    function startAnim() {
      if (timer) return;
      play.textContent = "Stopp";
      play.classList.add("amber");
      timer = setInterval(function () {
        let n = parseInt(nSlider.value, 10) + 2;
        if (n > 31) n = 1;
        nSlider.value = String(n);
        draw();
      }, 520);
    }

    nSlider.addEventListener("input", function () {
      stopAnim();
      draw();
    });
    mode.addEventListener("change", draw);
    play.addEventListener("click", function () {
      if (timer) stopAnim();
      else startAnim();
    });
    reset.addEventListener("click", function () {
      stopAnim();
      nSlider.value = "7";
      mode.value = "sum";
      draw();
    });

    draw();
    window.addEventListener("resize", debounce(draw, 120));
  }

  /* ---------- Labor 4: Sägezahn und Dreieck ---------- */

  function initShape() {
    const canvas = $("#shapeCanvas");
    if (!canvas) return;
    const nSlider = $("#shapeN");
    const nVal = $("#shapeNVal");
    const decay = $("#shapeDecay");
    const needed = $("#shapeNeeded");
    let shape = "saw";

    const meta = {
      saw: { decay: "1/n", needed: "≈ 100" },
      triangle: { decay: "1/n²", needed: "≈ 10" },
      square: { decay: "1/n (nur ungerade)", needed: "≈ 50" }
    };

    function draw() {
      const N = parseInt(nSlider.value, 10);
      nVal.textContent = String(N);
      decay.textContent = meta[shape].decay;
      needed.textContent = meta[shape].needed;

      const v = fitCanvas(canvas);
      const ctx = v.ctx, W = v.W, H = v.H;
      const m = mapper(W, H, { l: 30, r: 18, t: 20, b: 28 }, -Math.PI, Math.PI, -1.7, 1.7);
      frame(ctx, W, H, m, { nx: 8, ny: 4 });

      const exact = [];
      for (let k = 0; k <= 500; k++) {
        const t = -Math.PI + (k / 500) * 2 * Math.PI;
        let y;
        if (shape === "saw") y = t / Math.PI;
        else if (shape === "triangle") y = 1 - (2 / Math.PI) * Math.abs(t);
        else y = t < 0 ? -1 : 1;
        exact.push([t, y]);
      }
      line(ctx, m, exact, C.faint, 1.4, [5, 4]);

      const pts = [];
      for (let k = 0; k <= 700; k++) {
        const t = -Math.PI + (k / 700) * 2 * Math.PI;
        let y;
        if (shape === "saw") y = sawPartial(t, N);
        else if (shape === "triangle") y = trianglePartial(t, N);
        else y = squarePartial(t, N);
        pts.push([t, y]);
      }
      line(ctx, m, pts, C.teal, 2.4, null);

      text(ctx, "−π", m.X(-Math.PI), H - 9, { size: 9, color: C.faint });
      text(ctx, "0", m.X(0), H - 9, { size: 9, color: C.faint, align: "center" });
      text(ctx, "π", m.X(Math.PI), H - 9, { size: 9, color: C.faint, align: "right" });
      text(ctx, shape === "saw" ? "Sägezahn" : shape === "triangle" ? "Dreieck" : "Rechteck", 30, 14, {
        size: 9.5, color: C.faint
      });
    }

    $$("#shapePresets .chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$("#shapePresets .chip").forEach(function (b) { b.classList.remove("on"); });
        btn.classList.add("on");
        shape = btn.dataset.shape;
        draw();
      });
    });
    nSlider.addEventListener("input", draw);
    draw();
    window.addEventListener("resize", debounce(draw, 120));
  }

  /* ---------- Labor 5: Epizyklen ---------- */

  function initEpicycles() {
    const canvas = $("#epicycleCanvas");
    if (!canvas) return;
    const nSlider = $("#epiN");
    const nVal = $("#epiNVal");
    const speedSlider = $("#epiSpeed");
    const speedVal = $("#epiSpeedVal");
    const play = $("#epiPlay");
    const reset = $("#epiReset");
    const circlesOut = $("#epiCircles");
    const valueOut = $("#epiValue");
    const phaseOut = $("#epiPhase");

    let theta = 0;
    let playing = !reduceMotion;
    let visible = true;
    let last = performance.now();
    let trail = [];

    function radii(N) {
      const r = [];
      for (let k = 0; k < (N + 1) / 2; k++) {
        const n = 2 * k + 1;
        r.push({ n, r: 4 / (n * Math.PI) });
      }
      return r;
    }

    function draw() {
      const N = parseInt(nSlider.value, 10);
      nVal.textContent = String(N);
      const speed = parseFloat(speedSlider.value);
      speedVal.textContent = speed.toFixed(1) + "×";

      const v = fitCanvas(canvas);
      const ctx = v.ctx, W = v.W, H = v.H;
      const leftW = Math.round(W * 0.46);
      const rs = radii(N);
      const total = rs.reduce(function (a, b) { return a + b.r; }, 0);
      const scale = Math.min(leftW * 0.38, H * 0.42) / Math.max(total, 0.001);
      const cx = leftW * 0.5;
      const cy = H * 0.5;

      // linker Bereich
      ctx.save();
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(leftW, 12);
      ctx.lineTo(leftW, H - 12);
      ctx.stroke();
      ctx.restore();

      let x = 0;
      let y = 0;
      ctx.save();
      for (let i = 0; i < rs.length; i++) {
        const item = rs[i];
        const r = item.r * scale;
        const angle = item.n * theta;
        ctx.strokeStyle = "rgba(109,40,217,.20)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx + x, cy - y, r, 0, Math.PI * 2);
        ctx.stroke();

        const nx = x + r * Math.cos(angle);
        const ny = y + r * Math.sin(angle);
        ctx.strokeStyle = "rgba(109,40,217,.55)";
        ctx.beginPath();
        ctx.moveTo(cx + x, cy - y);
        ctx.lineTo(cx + nx, cy - ny);
        ctx.stroke();
        x = nx;
        y = ny;
      }
      ctx.fillStyle = C.rose;
      ctx.beginPath();
      ctx.arc(cx + x, cy - y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      trail.push([cx + x, cy - y]);
      if (trail.length > 220) trail.shift();
      ctx.save();
      ctx.strokeStyle = "rgba(190,18,60,.18)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      if (trail.length > 1) {
        ctx.moveTo(trail[0][0], trail[0][1]);
        for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i][0], trail[i][1]);
      }
      ctx.stroke();
      ctx.restore();

      text(ctx, "Kette aus " + rs.length + " Kreisen", 16, 16, { size: 9.5, color: C.faint });

      // rechter Bereich
      const m = mapper(W, H, { l: leftW + 26, r: 20, t: 20, b: 28 }, 0, 2 * Math.PI, -1.4, 1.4);
      frame(ctx, W, H, m, { nx: 8, ny: 4 });
      const pts = [];
      for (let k = 0; k <= 500; k++) {
        const t = (k / 500) * 2 * Math.PI;
        let yy = 0;
        for (let i = 0; i < rs.length; i++) {
          yy += rs[i].r * Math.sin(rs[i].n * t);
        }
        pts.push([t, yy]);
      }
      line(ctx, m, pts, C.teal, 2.3, null);
      const ph = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      let yNow = 0;
      for (let i = 0; i < rs.length; i++) yNow += rs[i].r * Math.sin(rs[i].n * theta);
      ctx.save();
      ctx.fillStyle = C.rose;
      ctx.beginPath();
      ctx.arc(m.X(ph), m.Y(yNow), 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(190,18,60,.30)";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(m.X(ph), m.Y(m.ymin));
      ctx.lineTo(m.X(ph), m.Y(m.ymax));
      ctx.stroke();
      ctx.restore();

      text(ctx, "y-Koordinate der Spitze", leftW + 26, 14, { size: 9.5, color: C.faint });
      text(ctx, "Zeit →", W - 20, H - 8, { size: 9.5, color: C.faint, align: "right" });

      circlesOut.textContent = String(rs.length);
      valueOut.textContent = yNow.toFixed(3);
      phaseOut.textContent = Math.round((ph * 180) / Math.PI) + "°";
    }

    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (playing && visible && !document.hidden) {
        theta += dt * parseFloat(speedSlider.value);
      }
      draw();
      requestAnimationFrame(tick);
    }

    nSlider.addEventListener("input", function () {
      trail = [];
      draw();
    });
    speedSlider.addEventListener("input", draw);
    play.addEventListener("click", function () {
      playing = !playing;
      play.textContent = playing ? "Pause" : "Weiter";
      last = performance.now();
    });
    reset.addEventListener("click", function () {
      theta = 0;
      trail = [];
      nSlider.value = "7";
      speedSlider.value = "1";
      playing = true;
      play.textContent = "Pause";
      draw();
    });

    visibleTracker(canvas, function (v) { visible = v; });
    draw();
    if (reduceMotion) play.textContent = "Weiter";
    requestAnimationFrame(tick);
    window.addEventListener("resize", debounce(draw, 120));
  }

  /* ---------- Labor 6: Dichte Spektrallinien ---------- */

  function initDensity() {
    const canvas = $("#densityCanvas");
    if (!canvas) return;
    const tSlider = $("#densityT");
    const tVal = $("#densityTVal");
    const tauSlider = $("#densityTau");
    const tauVal = $("#densityTauVal");
    const gapOut = $("#densityGap");
    const linesOut = $("#densityLines");
    const zeroOut = $("#densityZero");

    function sinc(x) {
      if (Math.abs(x) < 1e-9) return 1;
      return Math.sin(x) / x;
    }

    function draw() {
      const T = parseFloat(tSlider.value);
      const tau = parseFloat(tauSlider.value);
      tVal.textContent = T.toFixed(1);
      tauVal.textContent = tau.toFixed(2);

      const v = fitCanvas(canvas);
      const ctx = v.ctx, W = v.W, H = v.H;
      const leftW = Math.round(W * 0.46);

      // Zeitbereich
      const tm = mapper(leftW, H, { l: 20, r: 12, t: 24, b: 28 }, -1.5 * T, 1.5 * T, -0.2, 1.3);
      frame(ctx, leftW, H, tm, { nx: 6, ny: 3 });
      for (let k = -2; k <= 2; k++) {
        const c = k * T;
        const x0 = tm.X(c - tau / 2);
        const x1 = tm.X(c + tau / 2);
        const y0 = tm.Y(1);
        const y1 = tm.Y(0);
        if (x1 < tm.X(tm.xmin) || x0 > tm.X(tm.xmax)) continue;
        ctx.save();
        ctx.fillStyle = "rgba(180,83,9,.26)";
        ctx.strokeStyle = C.amber;
        ctx.lineWidth = 1.4;
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
        ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
        ctx.restore();
      }
      text(ctx, "Pulszug im Zeitbereich", 20, 16, { size: 9.5, color: C.faint });
      text(ctx, "T = " + T.toFixed(1), leftW - 12, H - 8, { size: 9, color: C.faint, align: "right" });

      // Frequenzbereich
      const dOmega = (2 * Math.PI) / T;
      const omegaMax = Math.max(4 * Math.PI / tau, 6 * dOmega);
      const fm = mapper(W, H, { l: leftW + 30, r: 18, t: 24, b: 28 }, 0, omegaMax, -0.35, tau * 1.12);
      frame(ctx, W, H, fm, { nx: 7, ny: 4 });

      // Einhüllende
      const env = [];
      for (let k = 0; k <= 400; k++) {
        const w = (k / 400) * omegaMax;
        env.push([w, tau * sinc((w * tau) / 2)]);
      }
      line(ctx, fm, env, C.teal, 1.4, [5, 4]);

      const stems = Math.min(300, Math.floor(omegaMax / dOmega));
      for (let n = 0; n <= stems; n++) {
        const w = n * dOmega;
        const val = tau * sinc((w * tau) / 2);
        const x = fm.X(w);
        ctx.strokeStyle = C.teal;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, fm.Y(0));
        ctx.lineTo(x, fm.Y(val));
        ctx.stroke();
        ctx.fillStyle = C.teal;
        ctx.beginPath();
        ctx.arc(x, fm.Y(val), 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      text(ctx, "T · cₙ im Frequenzbereich", leftW + 30, 16, { size: 9.5, color: C.faint });
      text(ctx, "ω →", W - 18, H - 8, { size: 9, color: C.faint, align: "right" });

      gapOut.textContent = dOmega.toFixed(3);
      linesOut.textContent = String(Math.max(1, Math.floor((2 * Math.PI / tau) / dOmega)));
      zeroOut.textContent = (2 * Math.PI / tau).toFixed(3);
    }

    tSlider.addEventListener("input", draw);
    tauSlider.addEventListener("input", draw);
    draw();
    window.addEventListener("resize", debounce(draw, 120));
  }

  /* ---------- Labor 7: Rechteck und sinc ---------- */

  function initRect() {
    const canvas = $("#rectCanvas");
    if (!canvas) return;
    const tauSlider = $("#rectTau");
    const tauVal = $("#rectTauVal");
    const zoomSlider = $("#rectZoom");
    const zoomVal = $("#rectZoomVal");
    const tauOut = $("#rectTauOut");
    const zeroOut = $("#rectZeroOut");
    const areaOut = $("#rectAreaOut");

    function sinc(x) {
      if (Math.abs(x) < 1e-9) return 1;
      return Math.sin(x) / x;
    }

    function draw() {
      const tau = parseFloat(tauSlider.value);
      const zoom = parseFloat(zoomSlider.value);
      tauVal.textContent = tau.toFixed(2);
      zoomVal.textContent = "±" + zoom.toFixed(0);
      tauOut.textContent = tau.toFixed(2);
      zeroOut.textContent = (2 * Math.PI / tau).toFixed(3);
      areaOut.textContent = tau.toFixed(3);

      const v = fitCanvas(canvas);
      const ctx = v.ctx, W = v.W, H = v.H;
      const leftW = Math.round(W * 0.48);

      const tm = mapper(leftW, H, { l: 22, r: 14, t: 24, b: 28 }, -3, 3, -0.25, 1.35);
      frame(ctx, leftW, H, tm, { nx: 6, ny: 3 });
      const x0 = tm.X(-tau / 2);
      const x1 = tm.X(tau / 2);
      ctx.save();
      ctx.fillStyle = "rgba(180,83,9,.24)";
      ctx.strokeStyle = C.amber;
      ctx.lineWidth = 1.6;
      ctx.fillRect(x0, tm.Y(1), x1 - x0, tm.Y(0) - tm.Y(1));
      ctx.strokeRect(x0, tm.Y(1), x1 - x0, tm.Y(0) - tm.Y(1));
      ctx.restore();
      text(ctx, "Rechteck der Breite τ", 22, 16, { size: 9.5, color: C.faint });
      text(ctx, "t →", leftW - 14, H - 8, { size: 9, color: C.faint, align: "right" });

      const fm = mapper(W, H, { l: leftW + 30, r: 18, t: 24, b: 28 }, -zoom, zoom, -0.55, 2.9);
      frame(ctx, W, H, fm, { nx: 8, ny: 4 });
      const pts = [];
      for (let k = 0; k <= 700; k++) {
        const w = -zoom + (k / 700) * 2 * zoom;
        pts.push([w, tau * sinc((w * tau) / 2)]);
      }
      line(ctx, fm, pts, C.teal, 2.2, null);

      const firstZero = (2 * Math.PI) / tau;
      if (firstZero <= zoom) {
        [-firstZero, firstZero].forEach(function (z) {
          ctx.save();
          ctx.strokeStyle = "rgba(139,145,160,.55)";
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(fm.X(z), fm.Y(fm.ymin));
          ctx.lineTo(fm.X(z), fm.Y(fm.ymax));
          ctx.stroke();
          ctx.restore();
        });
      }
      text(ctx, "F(ω) = τ sinc(ωτ/2)", leftW + 30, 16, { size: 9.5, color: C.faint });
      text(ctx, "ω →", W - 18, H - 8, { size: 9, color: C.faint, align: "right" });
      text(ctx, "erste Nullstelle ±2π/τ", W - 18, 16, { size: 9, color: C.faint, align: "right" });
    }

    tauSlider.addEventListener("input", draw);
    zoomSlider.addEventListener("input", draw);
    draw();
    window.addEventListener("resize", debounce(draw, 120));
  }

  /* ---------- Labor 8: DFT / FFT ---------- */

  function initDFT() {
    const timeCanvas = $("#dftTime");
    const specCanvas = $("#dftSpec");
    if (!timeCanvas || !specCanvas) return;
    const f1 = $("#dftF1");
    const f2 = $("#dftF2");
    const noise = $("#dftNoise");
    const nSelect = $("#dftN");
    const winSelect = $("#dftWindow");
    const reroll = $("#dftReroll");
    const f1Val = $("#dftF1Val");
    const f2Val = $("#dftF2Val");
    const noiseVal = $("#dftNoiseVal");
    const resOut = $("#dftRes");
    const peak1Out = $("#dftPeak1");
    const peak2Out = $("#dftPeak2");

    const fs = 1000;
    let seed = 1234567;

    function hann(n, N) {
      return 0.5 * (1 - Math.cos((2 * Math.PI * n) / Math.max(1, N - 1)));
    }

    function draw() {
      const N = parseInt(nSelect.value, 10);
      const freq1 = parseFloat(f1.value);
      const freq2 = parseFloat(f2.value);
      const nz = parseFloat(noise.value);
      f1Val.textContent = Math.round(freq1) + " Hz";
      f2Val.textContent = Math.round(freq2) + " Hz";
      noiseVal.textContent = nz.toFixed(2);
      resOut.textContent = (fs / N).toFixed(2) + " Hz";

      const rand = mulberry32(seed);
      const x = new Float64Array(N);
      for (let n = 0; n < N; n++) {
        const t = n / fs;
        x[n] = 0.9 * Math.sin(2 * Math.PI * freq1 * t) +
          0.65 * Math.sin(2 * Math.PI * freq2 * t + 0.7) +
          nz * (rand() * 2 - 1);
      }

      // Zeitbereich
      const tv = fitCanvas(timeCanvas);
      const tctx = tv.ctx, TW = tv.W, TH = tv.H;
      let maxAbs = 0.001;
      for (let n = 0; n < N; n++) maxAbs = Math.max(maxAbs, Math.abs(x[n]));
      const tm = mapper(TW, TH, { l: 28, r: 12, t: 20, b: 24 }, 0, N / fs, -maxAbs * 1.1, maxAbs * 1.1);
      frame(tctx, TW, TH, tm, { nx: 5, ny: 3 });
      const tpts = [];
      for (let n = 0; n < N; n++) tpts.push([n / fs, x[n]]);
      line(tctx, tm, tpts, C.amber, 1.2, null);
      text(tctx, "t (s)", TW - 12, TH - 6, { size: 9, color: C.faint, align: "right" });
      text(tctx, "N = " + N, 28, 14, { size: 9.5, color: C.faint });

      // Fenster und FFT
      const re = new Float64Array(N);
      const im = new Float64Array(N);
      for (let n = 0; n < N; n++) {
        const w = winSelect.value === "hann" ? hann(n, N) : 1;
        re[n] = x[n] * w;
        im[n] = 0;
      }
      fft(re, im);
      const half = N / 2;
      const mag = new Float64Array(half);
      let maxMag = 1e-9;
      for (let k = 0; k < half; k++) {
        mag[k] = Math.hypot(re[k], im[k]);
        if (mag[k] > maxMag) maxMag = mag[k];
      }

      // Spektrum
      const sv = fitCanvas(specCanvas);
      const sctx = sv.ctx, SW = sv.W, SH = sv.H;
      const sm = mapper(SW, SH, { l: 28, r: 12, t: 20, b: 24 }, 0, fs / 2, 0, maxMag * 1.12);
      frame(sctx, SW, SH, sm, { nx: 5, ny: 3 });

      sctx.save();
      sctx.beginPath();
      sctx.moveTo(sm.X(0), sm.Y(0));
      for (let k = 0; k < half; k++) {
        sctx.lineTo(sm.X((k * fs) / N), sm.Y(mag[k]));
      }
      sctx.lineTo(sm.X(fs / 2), sm.Y(0));
      sctx.closePath();
      sctx.fillStyle = "rgba(15,118,110,.14)";
      sctx.fill();
      sctx.restore();
      const spts = [];
      for (let k = 0; k < half; k++) spts.push([(k * fs) / N, mag[k]]);
      line(sctx, sm, spts, C.teal, 1.7, null);

      // Peaks
      const candidates = [];
      for (let k = 2; k < half - 1; k++) {
        if (mag[k] > mag[k - 1] && mag[k] >= mag[k + 1]) {
          candidates.push({ k, v: mag[k] });
        }
      }
      candidates.sort(function (a, b) { return b.v - a.v; });
      const peaks = [];
      for (let i = 0; i < candidates.length && peaks.length < 2; i++) {
        const c = candidates[i];
        if (c.v < maxMag * 0.12) continue;
        if (peaks.some(function (p) { return Math.abs(p.k - c.k) < 6; })) continue;
        peaks.push(c);
      }
      peaks.sort(function (a, b) { return a.k - b.k; });
      peaks.forEach(function (p, i) {
        const fx = (p.k * fs) / N;
        const px = sm.X(fx);
        const py = sm.Y(p.v);
        sctx.save();
        sctx.fillStyle = i === 0 ? C.amber : C.violet;
        sctx.beginPath();
        sctx.arc(px, py, 3.2, 0, Math.PI * 2);
        sctx.fill();
        sctx.restore();
      });
      const p1 = peaks[0] ? (peaks[0].k * fs) / N : 0;
      const p2 = peaks[1] ? (peaks[1].k * fs) / N : 0;
      peak1Out.textContent = p1.toFixed(0) + " Hz";
      peak2Out.textContent = p2.toFixed(0) + " Hz";

      text(sctx, "f (Hz)", SW - 12, SH - 6, { size: 9, color: C.faint, align: "right" });
      text(sctx, "Betrag |Xₖ|", 28, 14, { size: 9.5, color: C.faint });
      text(sctx, "Δf = " + (fs / N).toFixed(1) + " Hz", SW - 12, 14, { size: 9, color: C.faint, align: "right" });
    }

    const schedule = scheduleDraw(draw);
    [f1, f2, noise].forEach(function (el) {
      el.addEventListener("input", schedule);
    });
    [nSelect, winSelect].forEach(function (el) {
      el.addEventListener("change", draw);
    });
    reroll.addEventListener("click", function () {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      draw();
    });
    draw();
    window.addEventListener("resize", debounce(draw, 120));
  }

  /* ---------- Labor 9: Spektrogramm ---------- */

  function initSpectrogram() {
    const plot = $("#spectrogram");
    if (!plot) return;
    const signalSelect = $("#specSignal");
    const winSelect = $("#specWin");
    const winOut = $("#specWinVal");
    const timeRes = $("#specTimeRes");
    const freqRes = $("#specFreqRes");
    const windowOut = $("#specWindowOut");

    const fs = 1600;
    const duration = 2;
    const total = Math.round(fs * duration);

    function makeSignal(type) {
      const x = new Float64Array(total);
      for (let n = 0; n < total; n++) {
        const t = n / fs;
        if (type === "chirp") {
          const f0 = 120;
          const f1 = 700;
          const k = (f1 - f0) / duration;
          const phase = 2 * Math.PI * (f0 * t + 0.5 * k * t * t);
          x[n] = 0.7 * Math.sin(phase) + 0.28 * Math.sin(2 * Math.PI * 250 * t);
        } else if (type === "tones") {
          x[n] = 0.65 * Math.sin(2 * Math.PI * 180 * t) +
            0.5 * Math.sin(2 * Math.PI * 420 * t) +
            0.28 * Math.sin(2 * Math.PI * 650 * t);
        } else {
          let v = 0;
          for (let t0 = 0.1; t0 < duration; t0 += 0.25) {
            v += Math.exp(-Math.pow((t - t0) / 0.008, 2)) * Math.sin(2 * Math.PI * 900 * t);
          }
          x[n] = 0.9 * v;
        }
      }
      return x;
    }

    function stft(signal, winLen) {
      const hop = Math.max(1, Math.floor(winLen / 4));
      const frames = Math.floor((signal.length - winLen) / hop) + 1;
      const bins = winLen / 2;
      const z = [];
      const times = [];
      const freqs = [];
      for (let k = 0; k < bins; k++) freqs.push((k * fs) / winLen);
      let maxVal = 1e-9;
      const mags = [];
      for (let f = 0; f < frames; f++) {
        const start = f * hop;
        const re = new Float64Array(winLen);
        const im = new Float64Array(winLen);
        for (let i = 0; i < winLen; i++) {
          const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (winLen - 1)));
          re[i] = signal[start + i] * w;
        }
        fft(re, im);
        const col = [];
        for (let k = 0; k < bins; k++) {
          const m = Math.hypot(re[k], im[k]);
          if (m > maxVal) maxVal = m;
          col.push(m);
        }
        mags.push(col);
        times.push((start + winLen / 2) / fs);
      }
      for (let k = 0; k < bins; k++) {
        const row = [];
        for (let f = 0; f < frames; f++) {
          const v = 20 * Math.log10(mags[f][k] / maxVal + 1e-8);
          row.push(Math.max(-70, v));
        }
        z.push(row);
      }
      return { z, times, freqs };
    }

    function render() {
      if (!window.Plotly) {
        plot.innerHTML = "<p style='padding:20px;color:#5b6270'>Plotly konnte nicht geladen werden.</p>";
        return;
      }
      const winLen = parseInt(winSelect.value, 10);
      winOut.textContent = String(winLen);
      windowOut.textContent = String(winLen);
      timeRes.textContent = ((winLen / fs) * 1000).toFixed(0) + " ms";
      freqRes.textContent = (fs / winLen).toFixed(1) + " Hz";

      const signal = makeSignal(signalSelect.value);
      const data = stft(signal, winLen);
      const trace = {
        type: "heatmap",
        x: data.times,
        y: data.freqs,
        z: data.z,
        zmin: -70,
        zmax: 0,
        colorscale: [
          [0, "#fffdf7"],
          [0.18, "#e4f2ef"],
          [0.42, "#5ab3a8"],
          [0.68, "#0f766e"],
          [0.86, "#b45309"],
          [1, "#fff1c9"]
        ],
        showscale: false,
        hovertemplate: "f = %{y:.0f} Hz<br>t = %{x:.2f} s<br>%{z:.0f} dB<extra></extra>"
      };
      const layout = {
        margin: { l: 58, r: 16, t: 12, b: 46 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "#fffdf7",
        font: { family: "Inter, system-ui, sans-serif", size: 11, color: "#5b6270" },
        xaxis: {
          title: { text: "Zeit (s)", font: { size: 11 } },
          gridcolor: "#eee6d6",
          zeroline: false
        },
        yaxis: {
          title: { text: "Frequenz (Hz)", font: { size: 11 } },
          gridcolor: "#eee6d6",
          zeroline: false,
          range: [0, 800]
        }
      };
      window.Plotly.react(plot, [trace], layout, {
        displayModeBar: false,
        responsive: true
      });
    }

    signalSelect.addEventListener("change", render);
    winSelect.addEventListener("change", render);
    render();
    window.addEventListener("resize", debounce(function () {
      if (window.Plotly) window.Plotly.Plots.resize(plot);
    }, 150));
  }

  /* ---------- Start ---------- */

  function start() {
    renderMath();
    initReadingUI();
    initReveal();
    initSteps();
    initHero();
    initMixer();
    initPhasor();
    initSquare();
    initShape();
    initEpicycles();
    initDensity();
    initRect();
    initDFT();
    initSpectrogram();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
