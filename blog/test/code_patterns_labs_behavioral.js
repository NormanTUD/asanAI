"use strict";

function renderObserver(root) {
  const tools = labTools();

  root.innerHTML = `
    <div class="observer-stage">
      <svg class="wire" data-wire viewBox="0 0 600 360" preserveAspectRatio="none" aria-hidden="true"></svg>
      <button type="button" class="observer-core" data-core>NewsFeed<small>publish()</small></button>
      <div data-nodes></div>
    </div>
    <div class="observer-controls">
      <div class="sub-chips" data-subs></div>
      <button type="button" class="btn btn--primary" data-publish>Event auslösen</button>
    </div>
    <p class="readout" data-readout></p>`;

  const wire = $("[data-wire]", root);
  const core = $("[data-core]", root);
  const nodesEl = $("[data-nodes]", root);
  const chips = $("[data-subs]", root);
  const readout = $("[data-readout]", root);
  const publishButton = $("[data-publish]", root);

  const subscribers = [
    { id: "app", name: "App", x: 105, y: 78, on: true, count: 0 },
    { id: "news", name: "Newsletter", x: 495, y: 78, on: true, count: 0 },
    { id: "slack", name: "Slack", x: 105, y: 282, on: false, count: 0 },
    { id: "sms", name: "SMS", x: 495, y: 282, on: false, count: 0 }
  ];

  function updateReadout() {
    const on = subscribers.filter((subscriber) => subscriber.on).length;
    const total = subscribers.reduce((sum, subscriber) => sum + subscriber.count, 0);
    readout.textContent = on + " Abonnenten · " + total + " zugestellte Nachrichten";
  }

  function render() {
    wire.innerHTML = subscribers.map((subscriber) =>
      '<line x1="300" y1="180" x2="' + subscriber.x + '" y2="' + subscriber.y + '"' + (subscriber.on ? ' class="is-on"' : "") + "></line>"
    ).join("");
    nodesEl.innerHTML = subscribers.map((subscriber) =>
      '<button type="button" class="observer-node' + (subscriber.on ? " is-on" : "") + '" data-sub="' + subscriber.id + '" style="left:' + (subscriber.x / 600 * 100) + "%;top:" + (subscriber.y / 360 * 100) + '%"><span>' + subscriber.name + '</span><span class="count">' + (subscriber.on ? subscriber.count + " erhalten" : "abonniert nicht") + "</span></button>"
    ).join("");
    chips.innerHTML = subscribers.map((subscriber) =>
      '<button type="button" class="sub-chip' + (subscriber.on ? " is-on" : "") + '" data-toggle="' + subscriber.id + '"><span class="dot"></span>' + subscriber.name + "</button>"
    ).join("");
    updateReadout();
  }

  function toggle(id) {
    const subscriber = subscribers.find((item) => item.id === id);
    if (!subscriber) return;
    subscriber.on = !subscriber.on;
    render();
  }

  function publish() {
    const targets = subscribers.filter((subscriber) => subscriber.on);
    if (!targets.length) {
      readout.textContent = "Niemand hört zu. Erst abonnieren.";
      return;
    }
    core.classList.remove("is-pulsing");
    void core.offsetWidth;
    core.classList.add("is-pulsing");
    targets.forEach((subscriber, index) => {
      tools.later(() => {
        const node = $('[data-sub="' + subscriber.id + '"]', nodesEl);
        pulseLine(wire, 300, 180, subscriber.x, subscriber.y);
        if (node) {
          flashNode(node);
          subscriber.count++;
          const count = node.querySelector(".count");
          if (count) count.textContent = subscriber.count + " erhalten";
        }
        updateReadout();
      }, index * 90);
    });
  }

  tools.on(nodesEl, "click", (event) => {
    const node = event.target.closest("[data-sub]");
    if (node) toggle(node.dataset.sub);
  });

  tools.on(chips, "click", (event) => {
    const chip = event.target.closest("[data-toggle]");
    if (chip) toggle(chip.dataset.toggle);
  });

  tools.on(core, "click", publish);
  tools.on(publishButton, "click", publish);

  render();
  return tools.dispose;
}

function renderStrategy(root) {
  const tools = labTools();

  root.innerHTML = `
    <div class="strategy-stage">
      <div class="bars" data-bars></div>
      <div class="strategy-readout" data-metric>0 Vergleiche · 0 Tauschvorgänge</div>
    </div>
    <div class="lab-actions strategy-actions">
      <select data-strategy>
        <option value="bubble">Bubble Sort</option>
        <option value="insertion">Insertion Sort</option>
        <option value="selection">Selection Sort</option>
      </select>
      <button type="button" class="btn btn--primary" data-run>sortieren</button>
      <button type="button" class="btn btn--quiet" data-shuffle>neu mischen</button>
    </div>
    <p class="lab-note">Der Kontext kennt nur sort(). Welche Strategie läuft, entscheidet die Auswahl.</p>`;

  const barsEl = $("[data-bars]", root);
  const metric = $("[data-metric]", root);
  const select = $("[data-strategy]", root);
  const runButton = $("[data-run]", root);
  let base = randomValues();
  let values = [...base];
  let token = 0;
  let running = false;

  function randomValues() {
    return Array.from({ length: 14 }, () => 12 + Math.floor(Math.random() * 88));
  }

  function buildBars(list) {
    barsEl.innerHTML = list.map((value) => '<div class="bar" style="height:' + value + '%"></div>').join("");
  }

  function paint(frame) {
    const bars = $$(".bar", barsEl);
    if (bars.length !== frame.values.length) return;
    bars.forEach((bar, index) => {
      bar.style.height = frame.values[index] + "%";
      bar.classList.toggle("is-active", frame.active.includes(index));
      bar.classList.toggle("is-sorted", frame.sorted.includes(index));
    });
    metric.textContent = frame.comparisons + " Vergleiche · " + frame.swaps + " Tauschvorgänge";
  }

  function stop() {
    token++;
    running = false;
    runButton.disabled = false;
  }

  function resetBars() {
    stop();
    values = [...base];
    buildBars(values);
    metric.textContent = "0 Vergleiche · 0 Tauschvorgänge";
  }

  async function run() {
    if (running) return;
    running = true;
    runButton.disabled = true;
    const my = ++token;
    const frames = select.value === "insertion"
      ? insertionFrames(values)
      : select.value === "selection"
        ? selectionFrames(values)
        : bubbleFrames(values);
    for (const frame of frames) {
      if (my !== token || !root.isConnected) return;
      paint(frame);
      await wait(20);
    }
    if (my !== token || !root.isConnected) return;
    values = frames[frames.length - 1].values.slice();
    running = false;
    runButton.disabled = false;
  }

  tools.on(runButton, "click", run);
  tools.on(select, "change", resetBars);
  tools.on($("[data-shuffle]", root), "click", () => {
    stop();
    base = randomValues();
    values = [...base];
    buildBars(values);
    metric.textContent = "0 Vergleiche · 0 Tauschvorgänge";
  });

  tools.add(() => { token++; });
  buildBars(values);
  return tools.dispose;
}

function renderCommand(root) {
  const tools = labTools();

  root.innerHTML = `
    <div class="command-stage">
      <div class="command-grid" data-grid>
        <div class="robot" data-robot><span class="robot-arrow"></span><span class="robot-body"></span></div>
      </div>
      <div class="command-side">
        <div class="command-pad">
          <button type="button" class="forward" data-cmd="forward"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>vorwärts</button>
          <button type="button" data-cmd="left"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M9 6H3M5.5 3.5 3 6l2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>links</button>
          <button type="button" data-cmd="right"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 6h6M6.5 3.5 9 6 6.5 8.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>rechts</button>
        </div>
        <div class="command-history">
          <div class="history-label"><span>History</span><span data-hcount>0 · Redo 0</span></div>
          <ul class="history-list" data-history></ul>
          <div class="history-actions">
            <button type="button" class="btn btn--ghost" data-undo>undo()</button>
            <button type="button" class="btn btn--ghost" data-redo>redo()</button>
            <button type="button" class="btn btn--quiet" data-reset>reset</button>
          </div>
        </div>
      </div>
    </div>
    <p class="lab-note">Jeder Befehl merkt sich den Zustand davor. Genau deshalb funktioniert undo().</p>`;

  const grid = $("[data-grid]", root);
  const robot = $("[data-robot]", root);
  const historyEl = $("[data-history]", root);
  const hcount = $("[data-hcount]", root);
  const undoButton = $("[data-undo]", root);
  const redoButton = $("[data-redo]", root);
  const names = { forward: "vorwärts", left: "links drehen", right: "rechts drehen" };
  let state = { x: 3, y: 2, dir: 0 };
  let undoStack = [];
  let redoStack = [];

  function bump() {
    grid.classList.remove("is-bump");
    void grid.offsetWidth;
    grid.classList.add("is-bump");
    tools.later(() => grid.classList.remove("is-bump"), 380);
  }

  function apply(type) {
    if (type === "left") state.dir = (state.dir + 3) % 4;
    else if (type === "right") state.dir = (state.dir + 1) % 4;
    else if (type === "forward") {
      const dx = [0, 1, 0, -1][state.dir];
      const dy = [-1, 0, 1, 0][state.dir];
      const nextX = state.x + dx;
      const nextY = state.y + dy;
      if (nextX >= 0 && nextX < 8 && nextY >= 0 && nextY < 6) {
        state.x = nextX;
        state.y = nextY;
      } else {
        bump();
      }
    }
  }

  function render() {
    robot.style.left = ((state.x + 0.5) / 8 * 100) + "%";
    robot.style.top = ((state.y + 0.5) / 6 * 100) + "%";
    robot.style.setProperty("--rot", state.dir * 90 + "deg");
    const recent = undoStack.slice(-5).reverse();
    historyEl.innerHTML = recent.length
      ? recent.map((entry) => "<li>" + names[entry.type] + "</li>").join("")
      : '<li class="empty">noch keine Befehle</li>';
    hcount.textContent = undoStack.length + " · Redo " + redoStack.length;
    undoButton.disabled = !undoStack.length;
    redoButton.disabled = !redoStack.length;
  }

  function execute(type) {
    const before = { ...state };
    apply(type);
    undoStack.push({ type, before });
    redoStack = [];
    render();
  }

  function undo() {
    const entry = undoStack.pop();
    if (!entry) return;
    redoStack.push(entry);
    state = { ...entry.before };
    render();
  }

  function redo() {
    const entry = redoStack.pop();
    if (!entry) return;
    const before = { ...state };
    apply(entry.type);
    undoStack.push({ type: entry.type, before });
    render();
  }

  function reset() {
    state = { x: 3, y: 2, dir: 0 };
    undoStack = [];
    redoStack = [];
    render();
  }

  $$("[data-cmd]", root).forEach((button) => {
    tools.on(button, "click", () => execute(button.dataset.cmd));
  });
  tools.on(undoButton, "click", undo);
  tools.on(redoButton, "click", redo);
  tools.on($("[data-reset]", root), "click", reset);

  render();
  return tools.dispose;
}

function renderState(root) {
  const tools = labTools();
  const states = {
    red: {
      label: "ROT",
      title: "Autos halten",
      desc: "Fußgänger:innen dürfen gehen.",
      next: "green",
      delay: 3200,
      log: "state = new RedState()"
    },
    green: {
      label: "GRÜN",
      title: "Autos fahren",
      desc: "Fußgänger:innen warten.",
      next: "yellow",
      delay: 2800,
      log: "state = new GreenState()"
    },
    yellow: {
      label: "GELB",
      title: "Gleich rot",
      desc: "Autos bremsen. Fußgänger:innen warten.",
      next: "red",
      delay: 1600,
      log: "state = new YellowState()"
    }
  };

  root.innerHTML = `
    <div class="state-stage">
      <div class="traffic-light" data-traffic data-state="red">
        <div class="lamp lamp--red"></div>
        <div class="lamp lamp--yellow"></div>
        <div class="lamp lamp--green"></div>
      </div>
      <div class="state-panel">
        <span class="state-badge" data-badge>ROT</span>
        <h4 data-title>Autos halten</h4>
        <p data-desc>Fußgänger:innen dürfen gehen.</p>
        <div class="lab-actions">
          <button type="button" class="btn btn--primary" data-next>next()</button>
          <button type="button" class="btn btn--ghost" data-auto>Auto: aus</button>
        </div>
        <div class="state-log" data-log></div>
      </div>
    </div>`;

  const traffic = $("[data-traffic]", root);
  const badge = $("[data-badge]", root);
  const title = $("[data-title]", root);
  const desc = $("[data-desc]", root);
  const log = $("[data-log]", root);
  const autoButton = $("[data-auto]", root);
  let current = "red";
  let auto = false;
  let timer = null;

  function schedule() {
    clearTimeout(timer);
    if (!auto) return;
    timer = setTimeout(() => {
      next();
    }, states[current].delay);
  }

  function setState(key) {
    current = key;
    const data = states[key];
    traffic.dataset.state = key;
    badge.textContent = data.label;
    title.textContent = data.title;
    desc.textContent = data.desc;
    log.textContent = data.log;
    schedule();
  }

  function next() {
    setState(states[current].next);
  }

  function toggleAuto() {
    auto = !auto;
    autoButton.textContent = auto ? "Auto: an" : "Auto: aus";
    autoButton.classList.toggle("is-on", auto);
    schedule();
  }

  tools.on($("[data-next]", root), "click", next);
  tools.on(autoButton, "click", toggleAuto);
  tools.add(() => {
    auto = false;
    clearTimeout(timer);
  });

  setState("red");
  return tools.dispose;
}
