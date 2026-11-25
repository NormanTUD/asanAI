"use strict";

function renderSingleton(root) {
  const tools = labTools();
  const singleId = "#A7F3";
  let calls = 0;
  let extras = 0;

  root.innerHTML = `
    <div class="single-grid">
      <div class="call-log">
        <span class="mini-label">Aufrufe</span>
        <ul data-log><li class="empty">Noch keine Aufrufe.</li></ul>
      </div>
      <div class="heap">
        <span class="mini-label">Objekte im Speicher</span>
        <div class="heap-chips" data-chips>
          <div class="heap-chip" data-chip><span>#A7F3</span><small>Database · die einzige</small></div>
        </div>
      </div>
    </div>
    <div class="lab-actions">
      <button type="button" class="btn btn--ghost" data-new>new Database()</button>
      <button type="button" class="btn btn--primary" data-get>Database.getInstance()</button>
      <button type="button" class="btn btn--quiet" data-reset>zurücksetzen</button>
    </div>
    <p class="readout" data-readout></p>
    <p class="lab-note">Der direkte Konstruktor ist im echten Code geschützt. Hier siehst du absichtlich, was ohne diesen Schutz passieren würde.</p>`;

  const logEl = $("[data-log]", root);
  const chipsEl = $("[data-chips]", root);
  const readoutEl = $("[data-readout]", root);
  const single = $("[data-chip]", root);
  const rows = [];

  function updateReadout() {
    readoutEl.textContent = calls + " Aufrufe · " + (1 + extras) + " Instanzen im Speicher";
  }

  function addRow(kind, id) {
    if (!rows.length) logEl.innerHTML = "";
    calls++;
    const isNew = kind === "new";
    const row = document.createElement("li");
    row.innerHTML = '<span class="badge' + (isNew ? " bad" : "") + '">' + (isNew ? "new Database()" : "getInstance()") + '</span><code>' + id + '</code><span class="note">' + (isNew ? "neue Instanz" : "schon vorhanden") + "</span>";
    logEl.prepend(row);
    rows.push(row);
    while (rows.length > 6) rows.shift().remove();
  }

  tools.on($("[data-get]", root), "click", () => {
    addRow("get", singleId);
    flashNode(single);
    updateReadout();
  });

  tools.on($("[data-new]", root), "click", () => {
    const id = "#" + Math.random().toString(16).slice(2, 6).toUpperCase();
    addRow("new", id);
    extras++;
    const chip = document.createElement("div");
    chip.className = "heap-chip bad";
    chip.dataset.extra = "1";
    chip.innerHTML = "<span>" + id + "</span><small>Database · eigener Speicher</small>";
    chipsEl.appendChild(chip);
    flashNode(chip);
    updateReadout();
  });

  tools.on($("[data-reset]", root), "click", () => {
    calls = 0;
    extras = 0;
    rows.length = 0;
    logEl.innerHTML = '<li class="empty">Noch keine Aufrufe.</li>';
    $$("[data-extra]", chipsEl).forEach((node) => node.remove());
    updateReadout();
  });

  updateReadout();
  return tools.dispose;
}

function renderFactory(root) {
  const tools = labTools();

  root.innerHTML = `
    <div class="factory-stage">
      <div class="factory-box">
        <span class="mini-label">Erzeuger</span>
        <strong data-factory>Logistics</strong>
        <code>createTransport()</code>
      </div>
      <div class="factory-arrow"><span class="pulse"></span></div>
      <div class="product-slot" data-product>
        <div class="product-empty">Warte auf Auftrag …</div>
      </div>
    </div>
    <div class="lab-actions">
      <button type="button" class="btn btn--ghost" data-type="truck">Straße</button>
      <button type="button" class="btn btn--ghost" data-type="ship">See</button>
      <button type="button" class="btn btn--ghost" data-type="plane">Luft</button>
    </div>
    <pre class="lab-log" data-log>// client: logistics.planDelivery()</pre>`;

  const stage = $(".factory-stage", root);
  const slot = $("[data-product]", root);
  const factoryName = $("[data-factory]", root);
  const log = $("[data-log]", root);

  $$("[data-type]", root).forEach((button) => {
    tools.on(button, "click", () => {
      const product = PRODUCTS[button.dataset.type];
      if (!product) return;
      factoryName.textContent = product.factory;
      slot.innerHTML = '<div class="product-card"><div class="product-icon">' + product.icon + "</div><h4>" + product.name + "</h4><p>" + product.verb + '</p><code>deliver() → "' + product.verb + '"</code></div>';
      slot.classList.add("has-product");
      stage.classList.remove("is-producing");
      void stage.offsetWidth;
      stage.classList.add("is-producing");
      log.textContent = "new " + product.factory + "().planDelivery()\n→ " + product.name + '.deliver() → "' + product.verb + '"';
    });
  });

  return tools.dispose;
}

function renderBuilder(root) {
  const tools = labTools();

  root.innerHTML = `
    <div class="builder-stage">
      <div class="burger-stack" data-stack></div>
      <div class="builder-panel">
        <span class="mini-label">Zutaten</span>
        <div class="ing-list" data-ings></div>
        <div class="builder-total"><span>Summe</span><strong data-total></strong></div>
        <div class="lab-actions">
          <button type="button" class="btn btn--primary" data-build>build()</button>
          <button type="button" class="btn btn--quiet" data-clear>leeren</button>
        </div>
      </div>
    </div>
    <div class="builder-out" data-out>Bereit. Ein Patty ist Pflicht.</div>`;

  const stack = $("[data-stack]", root);
  const ingList = $("[data-ings]", root);
  const totalEl = $("[data-total]", root);
  const out = $("[data-out]", root);
  const selected = new Set();

  ingList.innerHTML = INGREDIENTS.map((ingredient) =>
    '<button type="button" class="ing" data-ing="' + ingredient.id + '" aria-pressed="false"><span class="ing-name"><span class="ing-dot" style="--ic:' + ingredient.color + '"></span>' + ingredient.name + '</span><span class="price">' + formatEUR(ingredient.price) + "</span></button>"
  ).join("");

  function price() {
    return 1.2 + INGREDIENTS
      .filter((ingredient) => selected.has(ingredient.id))
      .reduce((sum, ingredient) => sum + ingredient.price, 0);
  }

  function update() {
    const layers = INGREDIENTS.filter((ingredient) => selected.has(ingredient.id));
    const layerHtml = layers.length
      ? layers.slice().reverse().map((ingredient) =>
          '<div class="burger-layer" style="height:' + ingredient.h + "px;background:" + ingredient.color + '">' + ingredient.name + "</div>"
        ).join("")
      : '<div class="burger-empty">Wähle Zutaten →</div>';
    stack.innerHTML = '<div class="burger-bun top"></div>' + layerHtml + '<div class="burger-bun bottom"></div>';
    totalEl.textContent = formatEUR(price());
    $$("[data-ing]", root).forEach((button) => {
      const on = selected.has(button.dataset.ing);
      button.classList.toggle("is-on", on);
      button.setAttribute("aria-pressed", String(on));
    });
  }

  tools.on(ingList, "click", (event) => {
    const button = event.target.closest("[data-ing]");
    if (!button) return;
    const id = button.dataset.ing;
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    out.className = "builder-out";
    out.textContent = "Bereit. Ein Patty ist Pflicht.";
    update();
  });

  tools.on($("[data-clear]", root), "click", () => {
    selected.clear();
    out.className = "builder-out";
    out.textContent = "Bereit. Ein Patty ist Pflicht.";
    update();
  });

  tools.on($("[data-build]", root), "click", () => {
    if (!selected.has("patty")) {
      out.className = "builder-out is-error";
      out.textContent = "Fehler: Ein Burger braucht ein Patty. build() wirft.";
      return;
    }
    const layers = INGREDIENTS.filter((ingredient) => selected.has(ingredient.id));
    const chain = "new BurgerBuilder().bun()" + layers.map((ingredient) => "." + ingredient.id + "()").join("") + ".build()";
    out.className = "builder-out is-ok";
    out.textContent = chain + "\n→ " + formatEUR(price()) + " · " + (layers.length + 1) + " Zutaten";
    stack.classList.remove("is-served");
    void stack.offsetWidth;
    stack.classList.add("is-served");
    tools.later(() => stack.classList.remove("is-served"), 800);
  });

  update();
  return tools.dispose;
}

function renderPrototype(root) {
  const tools = labTools();

  root.innerHTML = `
    <div class="proto-shelf" data-shelf></div>
    <div class="proto-tools">
      <label class="toggle"><input type="checkbox" data-deep checked> tiefes Klonen</label>
      <div class="swatches" data-swatches></div>
    </div>
    <div class="lab-actions">
      <button type="button" class="btn btn--primary" data-clone>clone()</button>
      <button type="button" class="btn btn--ghost" data-tag>+ Tag</button>
      <button type="button" class="btn btn--quiet" data-reset>reset</button>
    </div>
    <p class="lab-note" data-note>Wähle eine Karte. clone() kopiert Farbe und Tags.</p>`;

  const shelf = $("[data-shelf]", root);
  const swatches = $("[data-swatches]", root);
  const note = $("[data-note]", root);
  const deepInput = $("[data-deep]", root);
  let cards = [{ id: "P1", color: PROTO_COLORS[0].hex, tags: ["rund"] }];
  let selectedId = "P1";
  let nextId = 2;
  let tagIndex = 1;

  function selectedCard() {
    return cards.find((card) => card.id === selectedId) || cards[0];
  }

  function renderShelf() {
    shelf.innerHTML = cards.map((card) => {
      const shared = cards.filter((other) => other.tags === card.tags).length > 1;
      return '<button type="button" class="proto-card' + (card.id === selectedId ? " is-selected" : "") + '" data-card="' + card.id + '" aria-pressed="' + (card.id === selectedId) + '" style="--pc:' + card.color + '">' +
        '<span class="proto-id">' + card.id + "</span>" +
        '<span class="proto-blob"></span>' +
        '<span class="proto-tags">' + card.tags.map((tag) => "<span>" + escapeHtml(tag) + "</span>").join("") + "</span>" +
        (shared ? '<span class="share-badge">geteilt</span>' : "") +
        "</button>";
    }).join("");
  }

  function renderSwatches() {
    swatches.innerHTML = PROTO_COLORS.map((color) =>
      '<button type="button" class="swatch' + (selectedCard().color === color.hex ? " is-active" : "") + '" data-color="' + color.hex + '" style="--sw:' + color.hex + '" title="' + color.name + '" aria-label="Farbe ' + color.name + '"></button>'
    ).join("");
  }

  function render() {
    renderShelf();
    renderSwatches();
  }

  tools.on(shelf, "click", (event) => {
    const card = event.target.closest("[data-card]");
    if (!card) return;
    selectedId = card.dataset.card;
    note.textContent = "Ausgewählt: " + selectedId + ". Änderungen betreffen nur diese Karte.";
    render();
  });

  tools.on(swatches, "click", (event) => {
    const swatch = event.target.closest("[data-color]");
    if (!swatch) return;
    selectedCard().color = swatch.dataset.color;
    note.textContent = "Farbe von " + selectedId + " geändert. Die Farbe ist ein primitiver Wert – sie bleibt unabhängig.";
    render();
  });

  tools.on($("[data-clone]", root), "click", () => {
    const source = selectedCard();
    const deep = deepInput.checked;
    const card = { id: "P" + nextId++, color: source.color, tags: deep ? [...source.tags] : source.tags };
    cards.push(card);
    selectedId = card.id;
    note.textContent = deep
      ? card.id + " hat eine eigene Tag-Liste. Änderungen bleiben getrennt."
      : card.id + " teilt die Tag-Liste mit " + source.id + ". Ändere einen Tag und beide Karten ändern sich.";
    render();
  });

  tools.on($("[data-tag]", root), "click", () => {
    const card = selectedCard();
    const tag = PROTO_TAGS[tagIndex++ % PROTO_TAGS.length];
    card.tags.push(tag);
    const shared = cards.filter((other) => other.tags === card.tags).length;
    note.textContent = shared > 1
      ? "„" + tag + "“ erscheint auf " + shared + " Karten, weil die Liste geteilt ist."
      : "„" + tag + "“ gehört nur zu " + card.id + ".";
    render();
  });

  tools.on(deepInput, "change", () => {
    note.textContent = deepInput.checked
      ? "Nächster Klon: tiefe Kopie. Verschachtelte Werte werden dupliziert."
      : "Nächster Klon: flache Kopie. Die Tag-Liste wird geteilt.";
  });

  tools.on($("[data-reset]", root), "click", () => {
    cards = [{ id: "P1", color: PROTO_COLORS[0].hex, tags: ["rund"] }];
    selectedId = "P1";
    nextId = 2;
    tagIndex = 1;
    note.textContent = "Wähle eine Karte. clone() kopiert Farbe und Tags.";
    render();
  });

  render();
  return tools.dispose;
}
