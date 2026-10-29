"use strict";

let currentId = null;
let labCleanup = null;
let activeFilter = "all";
let searchTerm = "";
let heroGraph = null;

function renderRail() {
  const list = $("[data-rail-list]");
  if (!list) return;
  const query = searchTerm.trim().toLowerCase();
  const families = activeFilter === "all"
    ? ["creational", "structural", "behavioral"]
    : [activeFilter];

  const groups = families.map((family) => {
    const items = PATTERNS.filter((pattern) => {
      if (pattern.family !== family) return false;
      if (!query) return true;
      const haystack = (pattern.name + " " + pattern.tagline + " " + pattern.familyLabel).toLowerCase();
      return haystack.includes(query);
    });
    if (!items.length) return "";
    const color = familyColor(family);
    return '<div class="rail-group" style="--dot:' + color + '">' +
      '<span class="rail-group-label"><i></i>' + FAMILY_LABEL[family] + "</span>" +
      items.map((pattern) =>
        '<button type="button" class="rail-item' + (pattern.id === currentId ? " is-active" : "") + '" data-id="' + pattern.id + '" style="--dot:' + color + '">' +
          '<span class="no">' + pattern.no + "</span>" +
          '<span class="rail-copy"><strong>' + pattern.name + "</strong><small>" + pattern.tagline + "</small></span>" +
        "</button>"
      ).join("") +
      "</div>";
  }).join("");

  list.innerHTML = groups || '<p class="rail-empty">Nichts gefunden. Andere Suche?</p>';
}

function renderRegister() {
  const grid = $("[data-register-grid]");
  if (!grid) return;
  grid.innerHTML = REGISTER.map((entry) =>
    '<article class="register-card" style="--reg:' + familyColor(entry.family) + '">' +
      '<span class="fam">' + FAMILY_LABEL[entry.family] + "</span>" +
      "<h3>" + entry.name + "</h3>" +
      "<p>" + entry.text + "</p>" +
    "</article>"
  ).join("");
}

function updateRailActive() {
  $$("[data-rail-list] [data-id]").forEach((button) => {
    const active = button.dataset.id === currentId;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch (error) {
    ok = false;
  }
  area.remove();
  return Promise.resolve(ok);
}

function renderStage(pattern) {
  const stage = $("#stage");
  if (!stage) return;
  const index = PATTERNS.indexOf(pattern);
  const previous = PATTERNS[(index - 1 + PATTERNS.length) % PATTERNS.length];
  const next = PATTERNS[(index + 1) % PATTERNS.length];

  stage.dataset.family = pattern.family;
  stage.innerHTML = `
    <header class="stage-head">
      <div>
        <div class="specimen">
          <span class="specimen-no">Muster ${pattern.no} / 12</span>
          <span class="fam-chip">${pattern.familyLabel}</span>
        </div>
        <h2>${pattern.name}</h2>
        <p class="stage-lede">${pattern.lede}</p>
      </div>
      <span class="stage-mark" aria-hidden="true">${pattern.no}</span>
    </header>

    <div class="stage-grid">
      <section class="panel visual-panel">
        <div class="panel-head"><span class="panel-label"><span class="dot"></span>Labor</span><span>interaktiv</span></div>
        <div class="panel-body"></div>
      </section>
      <section class="panel code-panel">
        <div class="panel-head">
          <span class="file"><i></i>${pattern.id}.js</span>
          <button type="button" class="copy-btn" data-copy>kopieren</button>
        </div>
        <div class="code-wrap"><pre class="code"><code>${highlight(pattern.code)}</code></pre></div>
      </section>
    </div>

    <div class="stage-notes">
      <div class="note"><span class="note-label">Wann einsetzen</span><p>${pattern.when}</p></div>
      <div class="note"><span class="note-label">Stolperfallen</span><p>${pattern.pitfall}</p></div>
      <div class="note"><span class="note-label">Bild im Kopf</span><p>${pattern.analogy}</p></div>
    </div>

    <nav class="stage-pager" aria-label="Muster wechseln">
      <button type="button" data-prev aria-label="Vorheriges Muster: ${previous.name}">
        <span>← Vorher</span><strong>${previous.name}</strong>
      </button>
      <button type="button" data-next aria-label="Nächstes Muster: ${next.name}">
        <span>Nächstes →</span><strong>${next.name}</strong>
      </button>
    </nav>`;

  const labRoot = $(".visual-panel .panel-body", stage);
  labCleanup = pattern.render(labRoot);

  const copyButton = $("[data-copy]", stage);
  copyButton.addEventListener("click", () => {
    copyText(pattern.code).then((ok) => {
      if (!copyButton.isConnected) return;
      copyButton.textContent = ok ? "kopiert" : "fehlgeschlagen";
      setTimeout(() => {
        if (copyButton.isConnected) copyButton.textContent = "kopieren";
      }, 1400);
    });
  });

  $(".stage-pager [data-prev]", stage).addEventListener("click", () => selectPattern(previous.id, { scroll: true }));
  $(".stage-pager [data-next]", stage).addEventListener("click", () => selectPattern(next.id, { scroll: true }));

  stage.classList.remove("is-entering");
  void stage.offsetWidth;
  stage.classList.add("is-entering");
}

function selectPattern(id, options = {}) {
  const pattern = PATTERNS.find((item) => item.id === id);
  if (!pattern) return;
  if (labCleanup) {
    labCleanup();
    labCleanup = null;
  }
  currentId = pattern.id;
  if (options.hash !== false) {
    const hash = "#" + pattern.id;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
  }
  renderStage(pattern);
  updateRailActive();
  document.title = pattern.name + " — Code Patterns";
  if (options.scroll) {
    $("#atlas").scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
  }
}

function hashPattern() {
  const id = decodeURIComponent(window.location.hash.replace(/^#\/?/, ""));
  return PATTERNS.some((pattern) => pattern.id === id) ? id : null;
}

function initHeroGraph() {
  const canvas = $("#hero-canvas");
  if (!canvas) return null;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const hero = canvas.closest(".hero");
  let width = 0;
  let height = 0;
  let raf = 0;
  let time = 0;
  let colors = readCanvasColors();
  const mouse = { x: 0, y: 0 };

  const nodes = PATTERNS.map((pattern, index) => ({
    pattern,
    angle: -Math.PI / 2 + (index / PATTERNS.length) * Math.PI * 2,
    phase: index * 1.73,
    depth: 0.45 + (index % 3) * 0.25
  }));

  const links = [[0, 6], [1, 2], [2, 3], [4, 5], [5, 7], [6, 7], [8, 9], [8, 10], [9, 11], [10, 11], [1, 9], [4, 7], [0, 7], [3, 2], [6, 2]];

  function readCanvasColors() {
    const style = getComputedStyle(document.documentElement);
    return {
      a: style.getPropertyValue("--accent").trim() || "#e8b45a",
      b: style.getPropertyValue("--accent-2").trim() || "#5eead4",
      c: style.getPropertyValue("--accent-3").trim() || "#c084fc",
      line: style.getPropertyValue("--line-strong").trim() || "rgba(255,255,255,.16)",
      faint: style.getPropertyValue("--ink-faint").trim() || "#777185"
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function positionOf(node) {
    const radiusX = Math.min(width * 0.43, 660);
    const radiusY = Math.min(height * 0.35, 300);
    const drift = REDUCED ? 0 : Math.sin(time * 0.22 + node.phase) * 6;
    return {
      x: width / 2 + Math.cos(node.angle) * radiusX + mouse.x * 26 * node.depth + drift,
      y: height / 2 + Math.sin(node.angle) * radiusY + mouse.y * 22 * node.depth + drift * 0.6
    };
  }

  function nodeColor(node) {
    if (node.pattern.family === "creational") return colors.a;
    if (node.pattern.family === "structural") return colors.b;
    return colors.c;
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    const points = nodes.map(positionOf);

    context.lineWidth = 1;
    context.strokeStyle = colors.line;
    context.globalAlpha = 0.55;
    links.forEach(([from, to]) => {
      context.beginPath();
      context.moveTo(points[from].x, points[from].y);
      context.lineTo(points[to].x, points[to].y);
      context.stroke();
    });
    context.globalAlpha = 1;

    nodes.forEach((node, index) => {
      const point = points[index];
      const color = nodeColor(node);
      context.beginPath();
      context.arc(point.x, point.y, 8, 0, Math.PI * 2);
      context.fillStyle = color;
      context.globalAlpha = 0.1;
      context.fill();
      context.globalAlpha = 1;
      context.beginPath();
      context.arc(point.x, point.y, 2.4, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();

      if (width > 760) {
        const side = Math.cos(node.angle) >= 0 ? 1 : -1;
        context.font = "9px ui-monospace, Menlo, monospace";
        context.textAlign = side === 1 ? "left" : "right";
        context.textBaseline = "middle";
        context.fillStyle = colors.faint;
        context.globalAlpha = 0.7;
        context.fillText(node.pattern.name.toUpperCase(), point.x + side * 12, point.y + 1);
        context.globalAlpha = 1;
      }
    });
  }

  function loop(now) {
    time = now / 1000;
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (!raf && !REDUCED) raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) / rect.width - 0.5;
    mouse.y = (event.clientY - rect.top) / rect.height - 0.5;
  });

  hero.addEventListener("pointerleave", () => {
    mouse.x = 0;
    mouse.y = 0;
  });

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) start();
    else stop();
  }, { threshold: 0 });
  observer.observe(hero);

  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (REDUCED) draw();
    });
    resizeObserver.observe(canvas);
  }

  resize();
  draw();
  start();

  return {
    refresh() {
      colors = readCanvasColors();
      if (REDUCED) draw();
    }
  };
}

function initTheme() {
  const button = $("[data-theme-toggle]");
  if (!button) return;
  button.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("pattern-atlas-theme", next);
    } catch (error) {
      console.warn("Theme konnte nicht gespeichert werden.");
    }
    renderRail();
    renderRegister();
    if (heroGraph) heroGraph.refresh();
  });
}

function initRail() {
  const search = $("[data-search]");
  const list = $("[data-rail-list]");
  if (!search || !list) return;

  search.addEventListener("input", () => {
    searchTerm = search.value;
    renderRail();
  });

  $$("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      $$("[data-filter]").forEach((other) => other.classList.toggle("is-active", other === button));
      renderRail();
    });
  });

  list.addEventListener("click", (event) => {
    const item = event.target.closest("[data-id]");
    if (item) selectPattern(item.dataset.id);
  });
}

function initQuiz() {
  const dialog = $("#quiz");
  if (!dialog) return;
  const body = $("[data-quiz-body]", dialog);
  const done = $("[data-quiz-done]", dialog);
  const count = $("[data-quiz-count]", dialog);
  const bar = $("[data-quiz-bar]", dialog);
  const question = $("[data-quiz-question]", dialog);
  const options = $("[data-quiz-options]", dialog);
  const feedback = $("[data-quiz-feedback]", dialog);
  const nextButton = $("[data-quiz-next]", dialog);
  const score = $("[data-quiz-score]", dialog);
  const verdict = $("[data-quiz-verdict]", dialog);
  let index = 0;
  let points = 0;
  let answered = false;

  function start() {
    index = 0;
    points = 0;
    renderQuestion();
  }

  function renderQuestion() {
    const item = QUIZ[index];
    answered = false;
    body.hidden = false;
    done.hidden = true;
    count.textContent = "Frage " + (index + 1) + " von " + QUIZ.length;
    question.textContent = item.q;
    options.innerHTML = item.options.map((option, optionIndex) =>
      '<button type="button" class="quiz-option" data-option="' + optionIndex + '"><span class="opt-key">' + String.fromCharCode(65 + optionIndex) + "</span>" + option + "</button>"
    ).join("");
    feedback.className = "quiz-feedback";
    feedback.textContent = "";
    nextButton.hidden = true;
    bar.style.width = (index / QUIZ.length * 100) + "%";
    $$(".quiz-option", options).forEach((button) => {
      button.addEventListener("click", () => answer(Number(button.dataset.option)));
    });
  }

  function answer(selected) {
    if (answered) return;
    answered = true;
    const item = QUIZ[index];
    const buttons = $$(".quiz-option", options);
    buttons.forEach((button, optionIndex) => {
      button.disabled = true;
      if (optionIndex === item.answer) button.classList.add("is-correct");
      if (optionIndex === selected && selected !== item.answer) button.classList.add("is-wrong");
    });
    const correct = selected === item.answer;
    if (correct) points++;
    feedback.className = "quiz-feedback is-visible";
    feedback.innerHTML = "<strong>" + (correct ? "Richtig." : "Nicht ganz.") + "</strong> " + item.explain;
    nextButton.hidden = false;
    nextButton.textContent = index === QUIZ.length - 1 ? "Ergebnis ansehen" : "Weiter";
    bar.style.width = ((index + 1) / QUIZ.length * 100) + "%";
  }

  function next() {
    if (index < QUIZ.length - 1) {
      index++;
      renderQuestion();
    } else {
      showResult();
    }
  }

  function showResult() {
    body.hidden = true;
    done.hidden = false;
    count.textContent = "Fertig";
    bar.style.width = "100%";
    score.textContent = points + " / " + QUIZ.length;
    const ratio = points / QUIZ.length;
    if (ratio === 1) verdict.textContent = "Perfekt. Du sprichst fließend Pattern.";
    else if (ratio >= 0.75) verdict.textContent = "Sehr sicher. Die Stolperfallen kennst du schon.";
    else if (ratio >= 0.5) verdict.textContent = "Solide Basis. Ein zweiter Blick in den Atlas lohnt sich.";
    else verdict.textContent = "Nochmal durch den Atlas – die Labore helfen mehr als Karteikarten.";
  }

  function open() {
    if (dialog.open) return;
    dialog.showModal();
    document.body.classList.add("is-locked");
    start();
    window.setTimeout(() => {
      const close = $(".quiz-close", dialog);
      if (close) close.focus();
    }, 30);
  }

  $$("[data-open-quiz]").forEach((button) => button.addEventListener("click", open));
  $$("[data-close-quiz]").forEach((button) => button.addEventListener("click", () => dialog.close()));
  nextButton.addEventListener("click", next);
  $("[data-quiz-restart]", dialog).addEventListener("click", start);

  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
      dialog.close();
    }
  });

  dialog.addEventListener("close", () => {
    document.body.classList.remove("is-locked");
  });
}

function initKeyboard() {
  const search = $("[data-search]");
  document.addEventListener("keydown", (event) => {
    const dialog = $("#quiz");
    if (dialog && dialog.open) return;
    const target = event.target;
    const typing = target && (target.matches("input, textarea, select") || target.isContentEditable);
    if (typing) {
      if (event.key === "Escape") {
        target.blur();
        if (target === search) {
          search.value = "";
          searchTerm = "";
          renderRail();
        }
      }
      return;
    }
    if (event.key === "/" && search) {
      event.preventDefault();
      search.focus();
      return;
    }
    if (event.key === "j" || event.key === "k") {
      const atlas = $("#atlas");
      if (!atlas) return;
      const rect = atlas.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.8) return;
      const index = PATTERNS.findIndex((pattern) => pattern.id === currentId);
      const direction = event.key === "j" ? 1 : -1;
      const nextIndex = (index + direction + PATTERNS.length) % PATTERNS.length;
      selectPattern(PATTERNS[nextIndex].id);
    }
  });
}

function initScrollState() {
  const topbar = $(".topbar");
  if (!topbar) return;
  const sync = () => topbar.classList.toggle("is-scrolled", window.scrollY > 16);
  window.addEventListener("scroll", sync, { passive: true });
  sync();
}

function init() {
  renderRegister();
  renderRail();
  initRail();
  initTheme();
  initQuiz();
  initKeyboard();
  initScrollState();
  heroGraph = initHeroGraph();

  const initial = hashPattern();
  selectPattern(initial || PATTERNS[0].id, { hash: false });

  window.addEventListener("hashchange", () => {
    const id = hashPattern();
    if (id && id !== currentId) selectPattern(id, { hash: false });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
