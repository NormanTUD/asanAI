const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const waitFor = (animation, ms = 900) =>
  Promise.race([animation.finished.catch(() => {}), delay(ms)]);
const SUB = { 1: "₁", 2: "₂", 3: "₃" };
const LOCAL = {
  1: { T: "T₁", F: "F₁" },
  2: { T: "T₂", F: "F₂" },
  3: { T: "T₃", F: "F₃" },
};
const CLASS = {
  1: { T: 1, F: 2 },
  2: { T: 2, F: 3 },
  3: { T: 1, F: 3 },
};

function setFocus(container, value) {
  if (!container) return;
  const next = container.dataset.focus === value ? "" : value;
  container.dataset.focus = next;
  $$("[data-global-focus]", container).forEach((button) => {
    const active = button.dataset.globalFocus === next;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function activateWithKeyboard(container, selector, handler) {
  if (!container) return;
  container.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target.closest(selector);
    if (!target) return;
    event.preventDefault();
    handler(target);
  });
}

function initReveal() {
  const targets = $$(".reveal, [data-section]");
  if (!("IntersectionObserver" in window)) {
    targets.forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
        if (entry.target.classList.contains("reveal")) {
          window.setTimeout(() => {
            entry.target.classList.remove("reveal");
            entry.target.classList.add("revealed");
          }, 1400);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -7% 0px" }
  );
  targets.forEach((element) => observer.observe(element));
}

function initProgressAndNav() {
  const bar = $("#progressBar");
  const sections = $$("main section[id]");
  const links = $$(".chapter-nav a");
  let queued = false;

  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (bar) bar.style.width = `${progress * 100}%`;

    const marker = window.innerHeight * 0.42;
    let current = sections[0]?.id;
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= marker && rect.bottom > marker) current = section.id;
    });
    links.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.nav === current);
    });
  };

  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  update();
}

function initSpotlights() {
  $$(".panel").forEach((panel) => {
    panel.addEventListener("pointermove", (event) => {
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      panel.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  });
}

function initHeroCanvas() {
  const canvas = $("#heroCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const palette = [
    [94, 234, 212],
    [251, 191, 36],
    [192, 132, 252],
    [34, 211, 238],
    [251, 113, 133],
    [167, 243, 208],
    [253, 230, 138],
  ];
  const fibers = Array.from({ length: 7 }, (_, index) => ({
    phase: index * 0.9,
    speed: 0.55 + (index % 3) * 0.17,
    color: palette[index % palette.length],
    x: index,
  }));
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let running = true;
  let visible = true;
  let frame = 0;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const pointAt = (p0, p1, p2, p3, t) => {
    const mt = 1 - t;
    return {
      x:
        mt * mt * mt * p0.x +
        3 * mt * mt * t * p1.x +
        3 * mt * t * t * p2.x +
        t * t * t * p3.x,
      y:
        mt * mt * mt * p0.y +
        3 * mt * mt * t * p1.y +
        3 * mt * t * t * p2.y +
        t * t * t * p3.y,
    };
  };

  const draw = (time) => {
    const seconds = time / 1000;
    ctx.clearRect(0, 0, width, height);
    const baseY = height * 0.88;
    const topY = height * 0.07;
    const usableWidth = width * 0.94;
    const startX = width * 0.03;

    mouse.x += (mouse.tx - mouse.x) * 0.055;
    mouse.y += (mouse.ty - mouse.y) * 0.055;

    const baseGradient = ctx.createLinearGradient(0, 0, width, 0);
    baseGradient.addColorStop(0, "rgba(94,234,212,0)");
    baseGradient.addColorStop(0.18, "rgba(94,234,212,.5)");
    baseGradient.addColorStop(0.5, "rgba(251,191,36,.55)");
    baseGradient.addColorStop(0.82, "rgba(192,132,252,.5)");
    baseGradient.addColorStop(1, "rgba(192,132,252,0)");
    ctx.save();
    ctx.strokeStyle = baseGradient;
    ctx.lineWidth = 1.4;
    ctx.shadowColor = "rgba(94,234,212,.55)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(width, baseY);
    ctx.stroke();
    ctx.restore();

    fibers.forEach((fiber, index) => {
      const x = startX + (usableWidth * (fiber.x + 0.35)) / fibers.length;
      const sway = Math.sin(seconds * fiber.speed + fiber.phase);
      const sway2 = Math.cos(seconds * fiber.speed * 0.7 + fiber.phase * 1.4);
      const p0 = { x, y: baseY };
      const p1 = {
        x: x + sway * 26 + mouse.x * 22,
        y: baseY - height * (0.21 + index * 0.006),
      };
      const p2 = {
        x: x + sway2 * 46 + mouse.x * 36,
        y: baseY - height * 0.54,
      };
      const p3 = {
        x: x + sway * 18 + mouse.x * 12,
        y: topY + Math.sin(fiber.phase) * 8 + mouse.y * 10,
      };
      const [r, g, b] = fiber.color;
      const gradient = ctx.createLinearGradient(p0.x, p0.y, p3.x, p3.y);
      gradient.addColorStop(0, `rgba(${r},${g},${b},0)`);
      gradient.addColorStop(0.25, `rgba(${r},${g},${b},.13)`);
      gradient.addColorStop(0.75, `rgba(${r},${g},${b},.42)`);
      gradient.addColorStop(1, `rgba(${r},${g},${b},.08)`);

      ctx.save();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      ctx.stroke();
      ctx.restore();

      [0.4, 0.66].forEach((t, nodeIndex) => {
        const point = pointAt(p0, p1, p2, p3, t);
        const pulse = 1 + Math.sin(seconds * 1.3 + fiber.phase + nodeIndex) * 0.12;
        ctx.save();
        ctx.fillStyle = `rgba(${r},${g},${b},.9)`;
        ctx.shadowColor = `rgba(${r},${g},${b},.9)`;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3.1 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      for (let particle = 0; particle < 4; particle += 1) {
        const offset = (seconds * fiber.speed * 0.075 + particle * 0.25 + fiber.phase * 0.1) % 1;
        const point = pointAt(p0, p1, p2, p3, 0.08 + offset * 0.8);
        const alpha = 0.15 + Math.sin(offset * Math.PI) * 0.55;
        ctx.save();
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.shadowColor = `rgba(${r},${g},${b},.8)`;
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    ctx.save();
    const haze = ctx.createRadialGradient(
      width * 0.5,
      height * 0.72,
      0,
      width * 0.5,
      height * 0.72,
      width * 0.56
    );
    haze.addColorStop(0, "rgba(94,234,212,.035)");
    haze.addColorStop(0.5, "rgba(192,132,252,.025)");
    haze.addColorStop(1, "rgba(6,8,18,0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  };

  const loop = (time) => {
    if (!running || !visible) return;
    draw(time);
    frame = requestAnimationFrame(loop);
  };

  const start = () => {
    if (running && visible && frame) return;
    running = true;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(loop);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
    frame = 0;
  };

  resize();
  if (reduceMotion) {
    draw(0);
  } else {
    start();
  }

  window.addEventListener("resize", () => {
    resize();
    if (reduceMotion) draw(0);
  });

  window.addEventListener("pointermove", (event) => {
    if (reduceMotion) return;
    mouse.tx = (event.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else if (!reduceMotion) start();
  });

  const hero = $(".hero");
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible && !reduceMotion) start();
        else stop();
      },
      { threshold: 0.02 }
    ).observe(hero);
  }

  let scrollQueued = false;
  window.addEventListener(
    "scroll",
    () => {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        if (!hero) return;
        const rect = hero.getBoundingClientRect();
        const inView = rect.bottom > 60 && rect.top < window.innerHeight - 60;
        visible = inView;
        if (inView && !reduceMotion) start();
        else stop();
      });
    },
    { passive: true }
  );
}

function initLoci() {
  const loci = $("#loci");
  if (!loci) return;
  const info = $("#lociInfo");
  const messages = {
    1: "Global 1 vereint T₁ und T₃. Zwei lokale Wahrheiten aus verschiedenen Fasern werden zu einer globalen Klasse.",
    2: "Global 2 vereint F₁ und T₂. Das ist der semantische Wechsel: Was in L₁ falsch ist, ist in L₂ wahr.",
    3: "Global 3 vereint F₂ und F₃. Zwei lokale Falschheiten, eine globale Klasse.",
  };
  const defaults = {
    local: "Sechs lokale Werte, drei globale Klassen. Klicke auf einen globalen Wert, um seine Spuren zu sehen.",
    global: "Drei globale Klassen, jede aus zwei lokalen Werten gebaut. Klicke eine Klasse an, um ihre Herkunft zu markieren.",
  };

  const render = () => {
    const focus = loci.dataset.focus;
    if (info) info.textContent = focus ? messages[focus] : defaults[loci.dataset.mode];
    $$("[data-global-focus]", loci).forEach((button) => {
      button.classList.toggle("is-active", button.dataset.globalFocus === focus);
      button.setAttribute("aria-pressed", String(button.dataset.globalFocus === focus));
    });
  };

  $$("[data-loci-mode]", loci).forEach((button) => {
    button.addEventListener("click", () => {
      loci.dataset.mode = button.dataset.lociMode;
      $$("[data-loci-mode]", loci).forEach((item) => {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-pressed", String(item === button));
      });
      render();
    });
  });

  loci.addEventListener("click", (event) => {
    const focusButton = event.target.closest("[data-global-focus]");
    if (focusButton) {
      setFocus(loci, focusButton.dataset.globalFocus);
      render();
      return;
    }
    const chip = event.target.closest(".vchip[data-global]");
    if (chip) {
      setFocus(loci, chip.dataset.global);
      render();
    }
  });

  render();
}

function addHitAreas(selector, radius) {
  $$(selector).forEach((node) => {
    const circle = node.querySelector("circle");
    if (!circle) return;
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    hit.setAttribute("class", "hit-area");
    hit.setAttribute("cx", circle.getAttribute("cx") || "0");
    hit.setAttribute("cy", circle.getAttribute("cy") || "0");
    hit.setAttribute("r", String(radius));
    node.insertBefore(hit, node.firstChild);
  });
}

function initMediation() {
  const mediation = $(".mediation");
  if (!mediation) return;
  addHitAreas(".mnode", 46);

  const render = () => {
    const focus = mediation.dataset.focus;
    $$("[data-global-focus]", mediation).forEach((button) => {
      const active = button.dataset.globalFocus === focus;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };

  mediation.addEventListener("click", (event) => {
    const focusButton = event.target.closest("[data-global-focus]");
    if (focusButton) {
      setFocus(mediation, focusButton.dataset.globalFocus);
      render();
      return;
    }
    const node = event.target.closest(".mnode[data-global]");
    if (node) {
      setFocus(mediation, node.dataset.global);
      render();
    }
  });

  activateWithKeyboard(mediation, ".mnode[data-global]", (node) => {
    setFocus(mediation, node.dataset.global);
    render();
  });

  const section = mediation.closest(".chapter");
  if (section && "IntersectionObserver" in window) {
    const pathObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        pathObserver.disconnect();
        window.setTimeout(() => {
          $$(".mpath", mediation).forEach((path) => {
            path.style.animation = "none";
            path.style.strokeDashoffset = "0";
          });
        }, 3000);
      },
      { threshold: 0.1 }
    );
    pathObserver.observe(section);
  }

  render();
}

function initBundle() {
  const bundle = $("#bundle");
  if (!bundle) return;
  addHitAreas(".bnode", 34);
  const sectionToggle = $("#bundleSectionToggle");
  const vector = $("#bundleVector");
  const info = $("#bundleInfo");
  const sectionPath = $("#sectionPath");
  const nodes = $$(".bnode", bundle);
  const gluePaths = $$(".glue-path", bundle);
  let visualTimer = 0;
  const state = {
    glued: false,
    section: false,
    selection: { 1: "T", 2: "T", 3: "T" },
  };

  const defaultInfo = () => {
    if (info) {
      info.textContent = state.glued
        ? "Die PCL-Verklebung identifiziert T₁ mit T₃, F₁ mit T₂ und F₂ mit F₃. Aus sechs lokalen Werten werden drei globale Klassen."
        : "Berühre eine Faser oder klicke auf einen Wert. Jede Faser ist für sich klassisch — der Schnitt wählt in jeder Faser genau einen Punkt.";
    }
  };

  const render = () => {
    bundle.dataset.glued = String(state.glued);
    bundle.dataset.section = String(state.section);
    if (sectionToggle) sectionToggle.setAttribute("aria-pressed", String(state.section));

    nodes.forEach((node) => {
      const locus = Number(node.dataset.locus);
      node.classList.toggle("is-selected", state.selection[locus] === node.dataset.value);
    });

    const y = { T: 230, F: 360 };
    const y1 = y[state.selection[1]];
    const y2 = y[state.selection[2]];
    const y3 = y[state.selection[3]];
    if (sectionPath) {
      sectionPath.setAttribute(
        "d",
        `M300 ${y1} C380 ${y1},470 ${y2},550 ${y2} C630 ${y2},720 ${y3},800 ${y3}`
      );
    }

    if (vector) {
      vector.innerHTML = [1, 2, 3]
        .map((locus) => {
          const value = state.selection[locus];
          const global = CLASS[locus][value];
          return `<span style="--env:var(--g${global})">${LOCAL[locus][value]}<small>→ ${global}</small></span>`;
        })
        .join("");
    }
    defaultInfo();

    gluePaths.forEach((path) => {
      path.style.transition = "";
      path.style.opacity = "";
      path.style.strokeDashoffset = "";
    });
    if (sectionPath) {
      sectionPath.style.transition = "";
      sectionPath.style.opacity = "";
    }
    window.clearTimeout(visualTimer);
    visualTimer = window.setTimeout(() => {
      gluePaths.forEach((path) => {
        path.style.transition = "none";
        path.style.opacity = state.glued ? "0.82" : "0";
        path.style.strokeDashoffset = state.glued ? "0" : "1";
      });
      if (sectionPath) {
        sectionPath.style.transition = "none";
        sectionPath.style.opacity = state.section ? "0.9" : "0";
      }
    }, 1900);
  };

  $$("[data-bundle-mode]", bundle).forEach((button) => {
    button.addEventListener("click", () => {
      state.glued = button.dataset.bundleMode === "glued";
      $$("[data-bundle-mode]", bundle).forEach((item) => {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-pressed", String(item === button));
      });
      render();
    });
  });

  if (sectionToggle) {
    sectionToggle.addEventListener("click", () => {
      state.section = !state.section;
      render();
    });
  }

  const selectNode = (node) => {
    const locus = Number(node.dataset.locus);
    state.selection[locus] = node.dataset.value;
    state.section = true;
    render();
  };

  bundle.addEventListener("click", (event) => {
    const node = event.target.closest(".bnode[data-locus]");
    if (node) selectNode(node);
  });

  activateWithKeyboard(bundle, ".bnode[data-locus]", selectNode);

  const fiberInfo = {
    1: "Faser über 1: π⁻¹(1) = L₁. Eine vollständige klassische zweiwertige Logik mit T₁ und F₁ — lokal völlig normal.",
    2: "Faser über 2: π⁻¹(2) = L₂. Dieselbe Art von Logik, aber an einem anderen Ort. Deshalb zählt der Index.",
    3: "Faser über 3: π⁻¹(3) = L₃. Lokal klassisch, global über die Klebungen mit den anderen Fasern verbunden.",
  };

  $$(".fiber", bundle).forEach((fiber) => {
    const locus = fiber.dataset.locus;
    const show = () => {
      if (info) info.textContent = fiberInfo[locus];
    };
    fiber.addEventListener("mouseenter", show);
    fiber.addEventListener("focusin", show);
    fiber.addEventListener("mouseleave", defaultInfo);
    fiber.addEventListener("focusout", defaultInfo);
  });

  render();
}

const OPS = {
  and: { sym: "∧", name: "Konjunktion", fn: (a, b) => a && b },
  or: { sym: "∨", name: "Disjunktion", fn: (a, b) => a || b },
  imp: { sym: "→", name: "Implikation", fn: (a, b) => !a || b },
  iff: { sym: "↔", name: "Äquivalenz", fn: (a, b) => a === b },
  xor: { sym: "⊕", name: "Exklusiv-Oder", fn: (a, b) => a !== b },
  nor: { sym: "↓", name: "Nicht-Oder", fn: (a, b) => !(a || b) },
};
const OP_KEYS = Object.keys(OPS);
const FIBER_SOFT = {
  1: "rgba(34, 211, 238, .13)",
  2: "rgba(251, 191, 36, .13)",
  3: "rgba(251, 113, 133, .13)",
};

function truthOut(opKey, a, b) {
  return OPS[opKey].fn(a === "T", b === "T") ? "T" : "F";
}

function initTransjunctions() {
  const localsEl = $("#tjLocals");
  const globalEl = $("#tjGlobal");
  const verdictEl = $("#tjVerdict");
  if (!localsEl || !globalEl || !verdictEl) return;

  const state = { ops: ["and", "or", "and"] };
  const values = ["T", "F"];
  const presetMap = {
    consistent: "and,or,and",
    conflict: "and,or,imp",
  };

  const renderLocals = () => {
    localsEl.innerHTML = [1, 2, 3]
      .map((locus) => {
        const opKey = state.ops[locus - 1];
        const op = OPS[opKey];
        const cells = [];
        values.forEach((a) => {
          values.forEach((b) => {
            const out = truthOut(opKey, a, b);
            const global = CLASS[locus][out];
            cells.push(
              `<div class="mcell g${global}" title="L${SUB[locus]}: ${LOCAL[locus][a]} ${op.sym} ${LOCAL[locus][b]} = ${LOCAL[locus][out]} → global ${global}"><span class="mcell__out">${LOCAL[locus][out]}</span><span class="mcell__badge">→ ${global}</span></div>`
            );
          });
        });
        return `<article class="tcard" data-locus="${locus}" style="--fiber:var(--f${locus});--fiber-soft:${FIBER_SOFT[locus]}">
          <div class="tcard__head">
            <div>
              <span class="tcard__locus">L${SUB[locus]}</span>
              <span class="tcard__opname">${op.name}</span>
            </div>
            <div class="op-picker" role="group" aria-label="Operator für L${SUB[locus]}">
              ${OP_KEYS.map(
                (key) =>
                  `<button type="button" data-op="${key}" class="${
                    key === opKey ? "is-active" : ""
                  }" title="${OPS[key].name}" aria-pressed="${key === opKey}">${OPS[key].sym}</button>`
              ).join("")}
            </div>
          </div>
          <div class="matrix">
            <span class="matrix__corner">x\\y</span>
            <span class="matrix__col">T${SUB[locus]}</span><span class="matrix__col">F${SUB[locus]}</span>
            <span class="matrix__row">T${SUB[locus]}</span>${cells[0]}${cells[1]}
            <span class="matrix__row">F${SUB[locus]}</span>${cells[2]}${cells[3]}
          </div>
        </article>`;
      })
      .join("");
  };

  const compute = () => {
    const map = new Map();
    [1, 2, 3].forEach((locus) => {
      const opKey = state.ops[locus - 1];
      values.forEach((a) => {
        values.forEach((b) => {
          const globalA = CLASS[locus][a];
          const globalB = CLASS[locus][b];
          const out = truthOut(opKey, a, b);
          const globalOut = CLASS[locus][out];
          const key = `${globalA}-${globalB}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key).push({ locus, a, b, out, globalOut });
        });
      });
    });
    return map;
  };

  const contributionTitle = (list) =>
    list
      .map(
        (item) =>
          `L${SUB[item.locus]}: (${LOCAL[item.locus][item.a]}, ${
            LOCAL[item.locus][item.b]
          }) → ${LOCAL[item.locus][item.out]} → global ${item.globalOut}`
      )
      .join(" | ");

  const renderGlobal = (map) => {
    let html = `<div class="matrix matrix--global"><span class="matrix__corner">x\\y</span>`;
    [1, 2, 3].forEach((global) => {
      html += `<span class="matrix__col">${global}</span>`;
    });

    [1, 2, 3].forEach((globalA) => {
      html += `<span class="matrix__row">${globalA}</span>`;
      [1, 2, 3].forEach((globalB) => {
        const list = map.get(`${globalA}-${globalB}`) || [];
        const outputs = Array.from(new Set(list.map((item) => item.globalOut)));
        if (outputs.length > 1) {
          html += `<div class="mcell mcell--global is-conflict" title="${contributionTitle(
            list
          )}"><span class="mcell__out">${outputs.join(" / ")}</span><span class="mcell__badge">KONFLIKT</span></div>`;
        } else {
          const global = outputs[0];
          const sources = Array.from(new Set(list.map((item) => `L${SUB[item.locus]}`))).join(
            " + "
          );
          html += `<div class="mcell mcell--global g${global}" title="${contributionTitle(
            list
          )}"><span class="mcell__out">${global}</span><span class="mcell__badge">${sources}</span></div>`;
        }
      });
    });

    html += "</div>";
    globalEl.innerHTML = html;
  };

  const renderVerdict = (map) => {
    const conflicts = [];
    [1, 2, 3].forEach((globalA) => {
      [1, 2, 3].forEach((globalB) => {
        const list = map.get(`${globalA}-${globalB}`) || [];
        const outputs = Array.from(new Set(list.map((item) => item.globalOut)));
        if (outputs.length > 1) {
          conflicts.push({ globalA, globalB, list, outputs });
        }
      });
    });

    if (!conflicts.length) {
      const pairs = [
        [1, 1],
        [2, 2],
        [3, 3],
      ]
        .map(
          ([a, b]) =>
            `<span class="pair" style="--pc:var(--g${a})"><i></i>(${a},${b}) stimmt überein</span>`
        )
        .join("");
      verdictEl.innerHTML = `<div class="verdict verdict--ok">
        <div class="verdict__head"><span class="verdict__icon">✓</span><h3>Wohldefiniert</h3></div>
        <p>Alle lokalen Berechnungen, die global denselben Input meinen, liefern denselben globalen Output. Die drei 2 × 2-Tabellen lassen sich zu einer 3 × 3-Tabelle verkleben.</p>
        <div class="verdict__pairs">${pairs}</div>
      </div>`;
      return;
    }

    const first = conflicts[0];
    const explain = first.list
      .map(
        (item) =>
          `In L${SUB[item.locus]} heißt das Paar (${LOCAL[item.locus][item.a]}, ${
            LOCAL[item.locus][item.b]
          }) und liefert ${LOCAL[item.locus][item.out]} → global ${item.globalOut}`
      )
      .join("; ");

    const chips = [
      `<span class="pair" style="--pc:var(--g${first.globalA})"><i></i>global (${first.globalA},${first.globalB})</span>`,
      ...first.list.map(
        (item) =>
          `<span class="pair" style="--pc:var(--g${item.globalOut})"><i></i>L${
            SUB[item.locus]
          }: (${LOCAL[item.locus][item.a]},${LOCAL[item.locus][item.b]}) → ${
            item.globalOut
          }</span>`
      ),
    ].join("");

    const more =
      conflicts.length > 1
        ? ` Weitere Konflikte: ${conflicts
            .slice(1)
            .map((item) => `(${item.globalA},${item.globalB})`)
            .join(", ")}.`
        : "";

    verdictEl.innerHTML = `<div class="verdict verdict--bad">
      <div class="verdict__head"><span class="verdict__icon">!</span><h3>Lokal konsistent, global nicht definiert</h3></div>
      <p>${explain}. Beide Paare gehören global zur selben Klasse, haben aber verschiedene Bilder. Eine Funktion kann demselben Input nicht zwei Werte zuordnen.${more}</p>
      <div class="verdict__pairs">${chips}</div>
    </div>`;
  };

  const updatePresetState = () => {
    const signature = state.ops.join(",");
    $$(".preset").forEach((button) => {
      const active = presetMap[button.dataset.preset] === signature;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };

  const render = () => {
    renderLocals();
    const map = compute();
    renderGlobal(map);
    renderVerdict(map);
    updatePresetState();
  };

  localsEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-op]");
    if (!button) return;
    const card = button.closest(".tcard");
    if (!card) return;
    const locus = Number(card.dataset.locus);
    state.ops[locus - 1] = button.dataset.op;
    render();
  });

  $(".tj__presets")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!button) return;
    if (button.dataset.preset === "consistent") state.ops = ["and", "or", "and"];
    else if (button.dataset.preset === "conflict") state.ops = ["and", "or", "imp"];
    else {
      state.ops = [0, 1, 2].map(() => OP_KEYS[Math.floor(Math.random() * OP_KEYS.length)]);
    }
    render();
  });

  render();
}

function initGroupMachine() {
  const machine = $("#groupMachine");
  if (!machine) return;
  const tokens = [$("#gmToken1"), $("#gmToken2"), $("#gmToken3")];
  const readout = $("#gmReadout");
  const log = $("#gmLog");
  const reset = $("#gmReset");
  const controls = $(".gm__controls", machine);
  const state = [true, true, false];
  let busy = false;

  const render = () => {
    tokens.forEach((token, index) => {
      if (!token) return;
      token.textContent = state[index] ? "T" : "F";
      token.classList.toggle("is-true", state[index]);
      token.classList.toggle("is-false", !state[index]);
    });
    if (readout) {
      readout.innerHTML = state
        .map(
          (value, index) =>
            `<span>L${SUB[index + 1]}: <b>${value ? "T" : "F"}</b></span>`
        )
        .join("");
    }
  };

  const setBusy = (value) => {
    busy = value;
    if (controls) controls.classList.toggle("is-busy", value);
  };

  const negate = async (index) => {
    const token = tokens[index];
    if (!token || reduceMotion) {
      state[index] = !state[index];
      render();
      return;
    }
    const out = token.animate(
      [
        { transform: "scaleX(1)", filter: "brightness(1)" },
        { transform: "scaleX(0)", filter: "brightness(1.7)" },
      ],
      { duration: 130, easing: "ease-in" }
    );
    await waitFor(out, 600);
    state[index] = !state[index];
    render();
    const back = token.animate(
      [
        { transform: "scaleX(0)", filter: "brightness(1.7)" },
        { transform: "scaleX(1)", filter: "brightness(1)" },
      ],
      { duration: 170, easing: "ease-out" }
    );
    await waitFor(back, 600);
  };

  const swap = async (first, second) => {
    const tokenA = tokens[first];
    const tokenB = tokens[second];
    if (!tokenA || !tokenB || reduceMotion) {
      [state[first], state[second]] = [state[second], state[first]];
      render();
      return;
    }
    const rectA = tokenA.getBoundingClientRect();
    const rectB = tokenB.getBoundingClientRect();
    const dx = rectB.left - rectA.left;
    const dy = rectB.top - rectA.top;
    tokenA.style.zIndex = "2";
    tokenB.style.zIndex = "1";
    const animationA = tokenA.animate(
      [
        { transform: "translate(0,0)" },
        { transform: `translate(${dx}px,${dy}px)` },
      ],
      { duration: 280, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
    const animationB = tokenB.animate(
      [
        { transform: "translate(0,0)" },
        { transform: `translate(${-dx}px,${-dy}px)` },
      ],
      { duration: 280, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
    await Promise.all([waitFor(animationA, 800), waitFor(animationB, 800)]);
    [state[first], state[second]] = [state[second], state[first]];
    render();
    tokenA.style.zIndex = "";
    tokenB.style.zIndex = "";
    await delay(40);
  };

  const execute = async (operation) => {
    if (busy) return;
    setBusy(true);
    if (log) log.textContent = "";
    try {
      if (operation === "n1" || operation === "n2" || operation === "n3") {
        const index = Number(operation.slice(1)) - 1;
        if (log) log.textContent = `n${SUB[index + 1]}: lokale Negation in L${SUB[index + 1]} — die anderen Fasern bleiben unverändert.`;
        await negate(index);
      } else if (operation === "t12" || operation === "t13" || operation === "t23") {
        const pairs = { t12: [0, 1], t13: [0, 2], t23: [1, 2] };
        const [first, second] = pairs[operation];
        if (log)
          log.textContent = `(${first + 1}${second + 1}): Systemwechsel — die Inhalte von L${
            SUB[first + 1]
          } und L${SUB[second + 1]} tauschen die Plätze.`;
        await swap(first, second);
      } else if (operation === "N1") {
        if (log)
          log.textContent = "N₁ = τ₂₃ ∘ n₁: zuerst in L₁ negieren, dann L₂ und L₃ tauschen.";
        await negate(0);
        await delay(120);
        await swap(1, 2);
      } else if (operation === "N2") {
        if (log)
          log.textContent = "N₂ = τ₁₃ ∘ n₂: zuerst in L₂ negieren, dann L₁ und L₃ tauschen.";
        await negate(1);
        await delay(120);
        await swap(0, 2);
      }
      if (log) {
        log.textContent = `Ergebnis: X = (${state.map((value) => (value ? "T" : "F")).join(", ")}).`;
      }
    } finally {
      setBusy(false);
    }
  };

  machine.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-op]");
    if (!button) return;
    execute(button.dataset.op);
  });

  if (reset) {
    reset.addEventListener("click", () => {
      if (busy) return;
      state.splice(0, 3, true, true, false);
      render();
      if (log) log.textContent = "Startzustand wiederhergestellt: X = (T, T, F).";
    });
  }

  render();
}

function initRobot() {
  const stage = $("#robotStage");
  const svg = $("#robotSvg");
  const path = $("#robotPath");
  const robot = $("#robot");
  const startButton = $("#robotStart");
  const zoneLabel = $("#robotZone");
  const logicLabel = $("#robotLogic");
  const status = $("#robotStatus");
  const toast = $("#robotToast");
  if (!stage || !svg || !path || !robot || !startButton) return;

  const zones = [
    {
      key: 1,
      name: "Zone A",
      logic: "L₁ · Konjunktion",
      color: "var(--f1)",
      center: { x: 230, y: 190 },
      status:
        "Der Roboter steht in Zone A. Lokal gilt eine klassische Konjunktion. Beim Verlassen der Zone wechselt die aktive Faser.",
    },
    {
      key: 2,
      name: "Zone B",
      logic: "L₂ · Disjunktion",
      color: "var(--f2)",
      center: { x: 660, y: 190 },
      status:
        "Zone B aktiviert die Disjunktion. Andere Region, andere lokale Logik — derselbe Roboter, andere Faser.",
    },
    {
      key: 3,
      name: "Zone C",
      logic: "L₃ · Implikation",
      color: "var(--f3)",
      center: { x: 450, y: 400 },
      status:
        "Zone C rechnet mit Implikation. Beim Übergang ändert sich nicht der Roboter, sondern die Logik über ihm.",
    },
  ];

  const length = path.getTotalLength();
  let running = false;
  let frame = 0;
  let startTime = 0;
  let currentZone = -1;
  let toastTimer = 0;
  const duration = 13000;

  const nearestZone = (point) => {
    let best = 0;
    let bestDistance = Infinity;
    zones.forEach((zone, index) => {
      const dx = point.x - zone.center.x;
      const dy = point.y - zone.center.y;
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  };

  const applyZone = (index, announce) => {
    if (index === currentZone) return;
    const previous = currentZone >= 0 ? zones[currentZone] : null;
    currentZone = index;
    const zone = zones[index];
    stage.style.setProperty("--zone-color", zone.color);
    if (zoneLabel) zoneLabel.textContent = zone.name;
    if (logicLabel) logicLabel.textContent = zone.logic;
    if (status) status.textContent = zone.status;
    if (announce && previous && toast) {
      toast.textContent = `Systemwechsel: ${previous.name} → ${zone.name}`;
      toast.classList.add("is-visible");
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast.classList.remove("is-visible");
      }, 1900);
    }
  };

  const place = (progress) => {
    const point = path.getPointAtLength(progress * length);
    robot.setAttribute("transform", `translate(${point.x} ${point.y})`);
    applyZone(nearestZone(point), true);
  };

  const loop = (now) => {
    if (!running) return;
    if (!startTime) startTime = now;
    const elapsed = now - startTime;
    const progress = (elapsed % duration) / duration;
    place(progress);
    frame = requestAnimationFrame(loop);
  };

  const start = () => {
    running = true;
    startTime = 0;
    stage.classList.add("is-running");
    startButton.innerHTML = `Route stoppen <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10v14H7z"/></svg>`;
    currentZone = -1;
    const point = path.getPointAtLength(0);
    robot.setAttribute("transform", `translate(${point.x} ${point.y})`);
    applyZone(nearestZone(point), false);
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(loop);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
    stage.classList.remove("is-running");
    startButton.innerHTML = `Route starten <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>`;
  };

  startButton.addEventListener("click", () => {
    if (running) stop();
    else start();
  });

  place(0);
  currentZone = 0;
  applyZone(0, false);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && running) {
      running = false;
      cancelAnimationFrame(frame);
    } else if (!document.hidden && !running) {
      stage.classList.remove("is-running");
    }
  });
}

function initGlossary() {
  const dialog = $("#glossary");
  if (!dialog) return;
  const openers = [$("#glossaryOpen"), $("#glossaryOpenFooter")];
  const close = $("#glossaryClose");

  const open = () => {
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    }
  };

  const closeDialog = () => {
    if (typeof dialog.close === "function") dialog.close();
    document.documentElement.style.overflow = "";
  };

  openers.forEach((button) => button?.addEventListener("click", open));
  close?.addEventListener("click", closeDialog);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener("close", () => {
    document.documentElement.style.overflow = "";
  });
}

function initSmoothAnchors() {
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
      try {
        history.replaceState(null, "", id);
      } catch (error) {
        window.location.hash = id;
      }
    });
  });
}

initReveal();
initProgressAndNav();
initSpotlights();
initHeroCanvas();
initLoci();
initMediation();
initBundle();
initTransjunctions();
initGroupMachine();
initRobot();
initGlossary();
initSmoothAnchors();
