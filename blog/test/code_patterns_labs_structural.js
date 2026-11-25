"use strict";

function renderAdapter(root) {
  const tools = labTools();

  root.innerHTML = `
    <div class="adapter-stage" data-stage>
      <div class="adapter-rail">
        <div class="device-plug"><span class="plug-head"></span><span>EU · 230 V</span></div>
        <div class="adapter-slot"><span>+ Adapter</span><small>230 → 120 V</small></div>
        <div class="device-socket"><span class="socket-face"></span><span>US · 120 V</span></div>
      </div>
      <div class="adapter-line"></div>
      <span class="spark" aria-hidden="true">!</span>
      <div class="bulb"><span class="bulb-glass"></span><span>Gerät</span></div>
    </div>
    <div class="lab-actions">
      <button type="button" class="btn btn--ghost" data-toggle>Adapter: aus</button>
      <button type="button" class="btn btn--primary" data-plug>Einstecken</button>
      <button type="button" class="btn btn--quiet" data-reset>reset</button>
    </div>
    <p class="readout" data-readout>Der EU-Stecker passt nicht direkt in die US-Buchse.</p>`;

  const stage = $("[data-stage]", root);
  const toggle = $("[data-toggle]", root);
  const readout = $("[data-readout]", root);
  let hasAdapter = false;

  function clear() {
    stage.classList.remove("is-connected", "is-error");
    readout.className = "readout";
  }

  function sync() {
    stage.classList.toggle("has-adapter", hasAdapter);
    toggle.textContent = hasAdapter ? "Adapter: an" : "Adapter: aus";
    toggle.classList.toggle("is-on", hasAdapter);
  }

  tools.on(toggle, "click", () => {
    hasAdapter = !hasAdapter;
    sync();
    clear();
    readout.textContent = hasAdapter
      ? "Der Adapter sitzt dazwischen. Jetzt einstecken."
      : "Ohne Adapter passen 230 V nicht in eine 120-V-Buchse.";
  });

  tools.on($("[data-plug]", root), "click", () => {
    clear();
    void stage.offsetWidth;
    if (hasAdapter) {
      stage.classList.add("is-connected");
      readout.className = "readout is-ok";
      readout.textContent = "Erfolg: Der Adapter übersetzt 230 V → 120 V. Das Gerät läuft.";
    } else {
      stage.classList.add("is-error");
      readout.className = "readout is-error";
      readout.textContent = "Fehlschlag: 230 V passen nicht in die 120-V-Buchse.";
    }
  });

  tools.on($("[data-reset]", root), "click", () => {
    hasAdapter = false;
    sync();
    clear();
    readout.textContent = "Der EU-Stecker passt nicht direkt in die US-Buchse.";
  });

  sync();
  return tools.dispose;
}

function renderDecorator(root) {
  const tools = labTools();

  root.innerHTML = `
    <div class="decorator-stage">
      <div class="cup-wrap">
        <div class="cup"><div class="cup-handle"></div><div class="cup-liquid" data-liquid></div></div>
        <div class="cup-saucer"></div>
        <div class="cup-label" data-label>Espresso</div>
      </div>
      <div class="deco-controls">
        <label class="deco-base"><span>Basis</span><select data-base></select></label>
        <div class="topping-list" data-toppings></div>
        <div class="deco-receipt">
          <div class="deco-chain" data-chain></div>
          <div class="deco-price"><span>Gesamt</span><strong data-price></strong></div>
        </div>
      </div>
    </div>
    <p class="lab-note">Jeder Wrapper hat dasselbe Interface: cost() und label(). Der Aufruf wandert nach innen.</p>`;

  const baseSelect = $("[data-base]", root);
  const toppingList = $("[data-toppings]", root);
  const liquid = $("[data-liquid]", root);
  const label = $("[data-label]", root);
  const chainEl = $("[data-chain]", root);
  const priceEl = $("[data-price]", root);
  const active = new Set();
  let base = "espresso";

  baseSelect.innerHTML = Object.entries(COFFEE_BASE).map(([key, value]) =>
    '<option value="' + key + '">' + value.label + " · " + formatEUR(value.price) + "</option>"
  ).join("");

  toppingList.innerHTML = TOPPINGS.map((topping) =>
    '<button type="button" class="topping" data-top="' + topping.id + '" aria-pressed="false"><span class="dot" style="--tc:' + topping.color + '"></span>' + topping.label + '<span class="plus">+' + formatEUR(topping.price) + "</span></button>"
  ).join("");

  function update() {
    const baseData = COFFEE_BASE[base];
    const toppings = TOPPINGS.filter((topping) => active.has(topping.id));
    const total = baseData.price + toppings.reduce((sum, topping) => sum + topping.price, 0);
    liquid.innerHTML = '<div class="cup-band" style="background:' + baseData.color + ';flex:3"></div>' +
      toppings.map((topping) => '<div class="cup-band" style="background:' + topping.color + ';flex:1"></div>').join("");
    label.textContent = baseData.label + toppings.map((topping) => " + " + topping.label).join("");
    let chain = "new " + baseData.cls + "()";
    toppings.forEach((topping) => {
      chain = "new " + topping.cls + "(" + chain + ")";
    });
    chainEl.textContent = chain;
    priceEl.textContent = formatEUR(total);
    $$("[data-top]", root).forEach((button) => {
      const on = active.has(button.dataset.top);
      button.classList.toggle("is-on", on);
      button.setAttribute("aria-pressed", String(on));
    });
  }

  tools.on(baseSelect, "change", () => {
    base = baseSelect.value;
    update();
  });

  tools.on(toppingList, "click", (event) => {
    const button = event.target.closest("[data-top]");
    if (!button) return;
    if (active.has(button.dataset.top)) active.delete(button.dataset.top);
    else active.add(button.dataset.top);
    update();
  });

  update();
  return tools.dispose;
}

function renderFacade(root) {
  const tools = labTools();
  const subsystems = [
    { id: "lights", label: "Licht", icon: ICONS.bulb, on: "20 %" },
    { id: "screen", label: "Leinwand", icon: ICONS.screen, on: "unten" },
    { id: "projector", label: "Projektor", icon: ICONS.projector, on: "an" },
    { id: "sound", label: "Sound", icon: ICONS.speaker, on: "7 / 10" },
    { id: "stream", label: "Streaming", icon: ICONS.play, on: "läuft" }
  ];

  root.innerHTML = `
    <div class="facade-stage">
      <div class="facade-subs" data-subs></div>
      <div class="facade-screen" data-screen><div class="screen-text" data-screen-text>Bereit</div></div>
    </div>
    <div class="lab-actions">
      <button type="button" class="btn btn--primary" data-start>facade.watchMovie("Dune")</button>
      <button type="button" class="btn btn--quiet" data-reset>alles aus</button>
    </div>
    <p class="readout" data-readout>Ein Aufruf koordiniert fünf Subsysteme.</p>`;

  const subsEl = $("[data-subs]", root);
  const screen = $("[data-screen]", root);
  const screenText = $("[data-screen-text]", root);
  const readout = $("[data-readout]", root);
  const startButton = $("[data-start]", root);
  let token = 0;
  let running = false;

  subsEl.innerHTML = subsystems.map((subsystem) =>
    '<div class="sub-card" data-sub="' + subsystem.id + '"><span class="sub-icon">' + subsystem.icon + "</span><span>" + subsystem.label + '</span><small class="sub-status">aus</small></div>'
  ).join("");

  function resetVisual() {
    $$("[data-sub]", subsEl).forEach((card) => {
      card.classList.remove("is-on");
      card.querySelector(".sub-status").textContent = "aus";
    });
    screen.classList.remove("is-playing");
    screenText.textContent = "Bereit";
    readout.className = "readout";
  }

  async function start() {
    if (running) return;
    running = true;
    startButton.disabled = true;
    const my = ++token;
    resetVisual();
    readout.textContent = "Fassade startet die Sequenz …";
    for (const subsystem of subsystems) {
      await wait(340);
      if (my !== token || !root.isConnected) return;
      const card = $('[data-sub="' + subsystem.id + '"]', subsEl);
      if (!card) return;
      card.classList.add("is-on");
      card.querySelector(".sub-status").textContent = subsystem.on;
    }
    if (my !== token || !root.isConnected) return;
    screen.classList.add("is-playing");
    screenText.textContent = "Dune";
    readout.className = "readout is-ok";
    readout.textContent = "1 Aufruf · 5 Subsysteme · richtige Reihenfolge.";
    running = false;
    startButton.disabled = false;
  }

  tools.on(startButton, "click", start);

  tools.on($("[data-reset]", root), "click", () => {
    token++;
    running = false;
    startButton.disabled = false;
    resetVisual();
    readout.textContent = "Alles aus. Die Fassade hat fünf Aufrufe gespart.";
  });

  tools.add(() => { token++; });
  return tools.dispose;
}

function renderProxy(root) {
  const tools = labTools();

  root.innerHTML = `
    <div class="proxy-stage">
      <div class="proxy-flow">
        <div class="proxy-node" data-client><strong>Client</strong><small data-role-label>Gast</small></div>
        <div class="proxy-node proxy-gate" data-gate><strong>VaultProxy</strong><small data-cache>Cache: leer</small><div class="cache-chips" data-cache-chips></div></div>
        <div class="proxy-node" data-vault><strong>Vault</strong><small>2 Dokumente</small></div>
      </div>
      <div class="proxy-controls">
        <div class="proxy-role"><span>Rolle:</span><button type="button" class="chip is-active" data-role="guest">Gast</button><button type="button" class="chip" data-role="admin">Admin</button></div>
        <select data-doc><option value="gehalt">Gehälter</option><option value="strategie">Strategie</option></select>
        <button type="button" class="btn btn--primary" data-ask>Anfragen</button>
        <button type="button" class="btn btn--quiet" data-clear>Cache leeren</button>
      </div>
      <ul class="event-log" data-log></ul>
    </div>
    <p class="lab-note">Der Proxy hat dieselbe Schnittstelle wie der Vault – nur mit Rollencheck, Cache und Latenz.</p>`;

  const gate = $("[data-gate]", root);
  const vault = $("[data-vault]", root);
  const client = $("[data-client]", root);
  const roleLabel = $("[data-role-label]", root);
  const select = $("[data-doc]", root);
  const cacheLabel = $("[data-cache]", root);
  const cacheChips = $("[data-cache-chips]", root);
  const log = $("[data-log]", root);
  const askButton = $("[data-ask]", root);
  let role = "guest";
  let busy = false;
  let token = 0;
  const cache = new Set();

  function addLog(message, kind) {
    const item = document.createElement("li");
    item.textContent = message;
    if (kind) item.className = kind;
    log.prepend(item);
    while (log.children.length > 8) log.lastElementChild.remove();
  }

  function updateCache() {
    cacheLabel.textContent = cache.size ? "Cache: " + cache.size + " Treffer" : "Cache: leer";
    cacheChips.innerHTML = Array.from(cache).map((doc) => "<span>" + doc + "</span>").join("");
  }

  async function ask() {
    if (busy) return;
    busy = true;
    askButton.disabled = true;
    const my = ++token;
    const doc = select.value;
    const label = doc === "gehalt" ? "Gehälter" : "Strategie";
    gate.classList.remove("is-hit", "is-blocked");
    flashNode(client);
    flashNode(gate);
    addLog('→ read("' + doc + '") als ' + role, "");
    await wait(300);
    if (my !== token || !root.isConnected) return;
    if (role !== "admin") {
      gate.classList.add("is-blocked");
      addLog("403 · Proxy blockiert den Zugriff", "bad");
      busy = false;
      askButton.disabled = false;
      return;
    }
    if (cache.has(doc)) {
      gate.classList.add("is-hit");
      addLog("200 · Cache Hit · " + label + " · 2 ms", "ok");
    } else {
      flashNode(vault);
      addLog("Cache Miss · Proxy fragt den Vault · 48 ms", "");
      await wait(400);
      if (my !== token || !root.isConnected) return;
      cache.add(doc);
      gate.classList.add("is-hit");
      addLog("200 · " + label + " geladen und gespeichert", "ok");
    }
    updateCache();
    busy = false;
    askButton.disabled = false;
  }

  $$("[data-role]", root).forEach((button) => {
    tools.on(button, "click", () => {
      role = button.dataset.role;
      roleLabel.textContent = role === "admin" ? "Admin" : "Gast";
      $$("[data-role]", root).forEach((other) => other.classList.toggle("is-active", other === button));
      addLog("Rolle gewechselt: " + roleLabel.textContent, "");
    });
  });

  tools.on(askButton, "click", ask);

  tools.on($("[data-clear]", root), "click", () => {
    cache.clear();
    gate.classList.remove("is-hit", "is-blocked");
    updateCache();
    addLog("Cache geleert", "");
  });

  tools.add(() => { token++; });
  updateCache();
  return tools.dispose;
}
