(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function agentsScene(root, api) {
    var DE = api.lang === "de";
    var STEPS = DE ? [
      { kind: "user", who: "Du", text: "Berechne 1³ + 12³ und finde den Preis der Kaffeemaschine im Shop." },
      { kind: "tool", who: "Modell", text: "Ich rechne zuerst die Hardy-Ramanujan-Zahl.", tool: "bc <<< \"1^3 + 12^3\"" },
      { kind: "tool", who: "Runtime", text: "bc liefert das Ergebnis.", result: "1729" },
      { kind: "tool", who: "Modell", text: "Ich brauche die Seite. Ich rufe den Browser auf.", tool: "browser.goto(\"example.com/shop\")" },
      { kind: "tool", who: "Runtime", text: "Der Browser liefert den HTML-Code der Seite.", tool: "browser.html()", result: "HTML · 4,2 KB · Tabelle mit Produkten" },
      { kind: "user", who: "Du", text: "Mach jetzt einen Screenshot." },
      { kind: "shot", who: "Runtime", text: "Screenshot der Seite", tool: "screenshot()", result: "Seite geladen · 1280 × 800" },
      { kind: "tool", who: "Modell", text: "Die Kaffeemaschine kostet 42 €. Ich schreibe den Preis in price.txt.", tool: "write_file(\"price.txt\", \"42 €\")" },
      { kind: "tool", who: "Runtime", text: "Datei geschrieben", result: "ok · 4 Bytes" },
      { kind: "final", who: "Modell", text: "Fertig. 1³ + 12³ = 1729, und der Preis steht in price.txt." }
    ] : [
      { kind: "user", who: "You", text: "Compute 1³ + 12³ and find the price of the coffee machine in the shop." },
      { kind: "tool", who: "Model", text: "First I compute the Hardy–Ramanujan number.", tool: "bc <<< \"1^3 + 12^3\"" },
      { kind: "tool", who: "Runtime", text: "bc returns the result.", result: "1729" },
      { kind: "tool", who: "Model", text: "I need the page. I will call the browser.", tool: "browser.goto(\"example.com/shop\")" },
      { kind: "tool", who: "Runtime", text: "The browser returns the page HTML.", tool: "browser.html()", result: "HTML · 4.2 KB · table with products" },
      { kind: "user", who: "You", text: "Now take a screenshot." },
      { kind: "shot", who: "Runtime", text: "Screenshot of the page", tool: "screenshot()", result: "page loaded · 1280 × 800" },
      { kind: "tool", who: "Model", text: "The coffee machine costs 42 €. I will write the price to price.txt.", tool: "write_file(\"price.txt\", \"42 €\")" },
      { kind: "tool", who: "Runtime", text: "File written", result: "ok · 4 bytes" },
      { kind: "final", who: "Model", text: "Done. 1³ + 12³ = 1729, and the price is in price.txt." }
    ];
    var READ = DE ? [
      "Der Auftrag steht im Kontext. Das Modell hat neue Werkzeuge, aber dieselbe Art von Loop.",
      "Das Modell hat keine Hände. Es schreibt einen Tool-Call für die Konsole.",
      "bc rechnet 1³ + 12³ = 1729. Das Ergebnis steht wieder im Kontext.",
      "Jetzt braucht das Modell die Webseite. Es ruft den Browser auf.",
      "Der Browser gibt HTML zurück, noch keinen Screenshot. Das Modell liest die Produkttabelle.",
      "Du entscheidest, wann ein Screenshot gemacht wird. Erst jetzt kommt das Bild.",
      "Die Runtime gibt den Screenshot zurück. Ein multimodales Modell kann ihn als Tokens sehen.",
      "Das Modell liest den Preis und schreibt ihn in die Datei.",
      "Die Runtime bestätigt: Die Datei ist geschrieben.",
      "Das Modell antwortet mit Rechnung und Preis. Dazwischen lief ein normaler LLM-Loop."
    ] : [
      "The task is in the context. The model has new tools but the same kind of loop.",
      "The model has no hands. It writes a tool call for the console.",
      "bc computes 1³ + 12³ = 1729. The result is back in the context.",
      "Now the model needs the web page. It calls the browser.",
      "The browser returns HTML, not a screenshot. The model reads the product table.",
      "You decide when a screenshot is taken. Only now does the image arrive.",
      "The runtime returns the screenshot. A multimodal model can see it as tokens.",
      "The model reads the price and writes it to the file.",
      "The runtime confirms: the file is written.",
      "The model answers with the calculation and the price. A normal LLM loop ran in between."
    ];
    var step = 0;
    var el = document.createElement("div");
    el.className = "ls-agents-scene";
    el.innerHTML =
      '<div class="ls-agents-head"><span class="ls-agents-badge">' + (DE ? "Gleiches Modell" : "Same model") + '</span><span class="ls-agents-sub">' + (DE ? "Ein Agent kann dasselbe Modell verwenden; Kontext und Werkzeuge ändern sich." : "An agent can use the same model; context and tools change.") + '</span></div>' +
      '<div class="ls-agents-grid">' +
        '<section class="ls-agents-col"><div class="ls-agents-col-head"><b>' + (DE ? "Kontext" : "Context") + '</b><span>' + (DE ? "wächst mit Tool-Ausgaben" : "grows with tool output") + '</span></div><div class="ls-agents-context" aria-live="polite"></div></section>' +
        '<section class="ls-agents-col"><div class="ls-agents-col-head"><b>' + (DE ? "Runtime" : "Runtime") + '</b><span>' + (DE ? "außerhalb des Modells" : "outside the model") + '</span></div><div class="ls-agents-runtime"><div class="ls-agents-terminal" aria-live="polite"></div><div class="ls-agents-shot" role="img" aria-label="' + (DE ? "Browser-Screenshot: Beispiel-Shop mit dem Preis 42 Euro." : "Browser screenshot: example shop with the price 42 euros.") + '">' +
          '<div class="ls-code-monitor"><div class="ls-code-frame"><div class="ls-code-screen"><div class="ls-code-desktop" style="background-image:url(\'' + (api.asset ? api.asset("opera.jpg") : "opera.jpg") + '\')">' +
            '<div class="ls-code-window ls-agents-browser">' +
              '<div class="ls-code-bar"><i></i><i></i><i></i><span>Browser</span></div>' +
              '<div class="ls-agents-address"><span class="ls-agents-lock">https</span>example.com/shop</div>' +
              '<div class="ls-agents-web"><div class="ls-agents-site-head"><b>' + (DE ? "Beispiel-Shop" : "Example Shop") + '</b><span>' + (DE ? "Start · Kaffee · Hilfe" : "Home · Coffee · Help") + '</span></div>' +
                '<div class="ls-agents-product"><div class="ls-agents-thumb" aria-hidden="true"></div><div class="ls-agents-product-info"><span class="ls-agents-product-name">' + (DE ? "Kaffeemaschine" : "Coffee machine") + '</span><span class="ls-agents-rating">★★★★☆ 4,6</span></div><strong>42 €</strong></div>' +
                '<div class="ls-agents-product"><div class="ls-agents-thumb" aria-hidden="true"></div><div class="ls-agents-product-info"><span class="ls-agents-product-name">' + (DE ? "Kaffeemühle" : "Coffee grinder") + '</span><span class="ls-agents-rating">★★★★☆ 4,3</span></div><strong>89 €</strong></div><div class="ls-agents-actions"><span class="ls-agents-buy">' + (DE ? "In den Warenkorb" : "Add to cart") + '</span><span class="ls-agents-ship">' + (DE ? "Lieferung morgen" : "Delivery tomorrow") + '</span></div>' +
              '</div>' +
            '</div>' +
            '<div class="ls-code-taskbar"><span class="ls-code-start" aria-hidden="true">▦</span><span class="ls-code-task is-on" style="--task:#5c9baf" aria-hidden="true"></span><span class="ls-agents-taskname">Browser</span><span class="ls-code-clock">14:32</span></div>' +
          '</div></div></div></div>' +
        '</div><div class="ls-agents-html" hidden></div></div></section>' +
      '</div>' +
      '<div class="ls-agents-loop"><span>' + (DE ? "Tool-Call" : "tool call") + '</span><i>→</i><span>' + (DE ? "ausführen" : "execute") + '</span><i>→</i><span>' + (DE ? "Ergebnis in den Kontext" : "result into context") + '</span><i>→</i><span>' + (DE ? "weiter" : "continue") + '</span></div>' +
      '<div class="ls-agents-controls"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-agents-prev">←</button><span class="ls-agents-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-agents-next">' + (DE ? "Nächster Schritt" : "Next step") + '</button></div>' +
      '<p class="ls-agents-readout"></p>';
    root.appendChild(el);
    var contextEl = el.querySelector(".ls-agents-context");
    var terminalEl = el.querySelector(".ls-agents-terminal");
    var shotEl = el.querySelector(".ls-agents-shot");
    var htmlEl = el.querySelector(".ls-agents-html");
    var progressEl = el.querySelector(".ls-agents-progress");
    var readoutEl = el.querySelector(".ls-agents-readout");
    var prevBtn = el.querySelector(".ls-agents-prev");
    var nextBtn = el.querySelector(".ls-agents-next");
    function esc(s) { return api.esc(s); }
    function render() {
      var upTo = STEPS.slice(0, step + 1);
      var contextHtml = "";
      var terminal = [];
      upTo.forEach(function (s) {
        if (s.kind === "user") contextHtml += '<div class="ls-agents-msg is-user"><b>' + esc(s.who) + '</b><span>' + esc(s.text) + '</span></div>';
        else if (s.kind === "tool") {
          contextHtml += '<div class="ls-agents-msg is-model"><b>' + esc(s.who) + '</b><span>' + esc(s.text) + '</span>' + (s.tool ? '<code class="ls-agents-tool">' + esc(s.tool) + '</code>' : '') + '</div>';
          if (s.tool) terminal.push('<span class="is-cmd">$ ' + esc(s.tool) + '</span>');
          if (s.result) terminal.push('<span class="is-ok">' + esc(s.result) + '</span>');
        } else if (s.kind === "shot") {
          contextHtml += '<div class="ls-agents-msg is-model"><b>' + esc(s.who) + '</b><span>' + esc(s.text) + '</span><span class="ls-agents-image">' + (DE ? "Bildtokens im Kontext · 1280 × 800" : "image tokens in context · 1280 × 800") + '</span></div>';
          terminal.push('<span class="is-cmd">$ ' + esc(s.tool) + '</span>');
          terminal.push('<span class="is-ok">' + esc(s.result) + '</span>');
        } else if (s.kind === "final") {
          contextHtml += '<div class="ls-agents-msg is-final"><b>' + esc(s.who) + '</b><span>' + esc(s.text) + '</span></div>';
        }
      });
      contextEl.innerHTML = contextHtml;
      terminalEl.innerHTML = terminal.join("");
      var browserStep = 3, shotStep = 6;
      shotEl.hidden = step < shotStep;
      htmlEl.hidden = step < browserStep || step >= shotStep;
      shotEl.classList.toggle("is-pulsing", step === shotStep);
      if (step >= browserStep && step < shotStep) {
        htmlEl.innerHTML = '<div class="ls-agents-html-head">' + (DE ? "HTML-Ausschnitt · Produkttabelle" : "HTML excerpt · product table") + '</div><pre class="ls-agents-html-code">' +
          '<span class="ls-agents-tag">&lt;table&gt;</span>\n' +
          '  <span class="ls-agents-tag">&lt;tr&gt;</span><span class="ls-agents-tag">&lt;td&gt;</span>Kaffeemaschine<span class="ls-agents-tag">&lt;/td&gt;</span><span class="ls-agents-tag">&lt;td&gt;</span>42 €<span class="ls-agents-tag">&lt;/td&gt;</span><span class="ls-agents-tag">&lt;/tr&gt;</span>\n' +
          '  <span class="ls-agents-tag">&lt;tr&gt;</span><span class="ls-agents-tag">&lt;td&gt;</span>Kaffeemühle<span class="ls-agents-tag">&lt;/td&gt;</span><span class="ls-agents-tag">&lt;td&gt;</span>89 €<span class="ls-agents-tag">&lt;/td&gt;</span><span class="ls-agents-tag">&lt;/tr&gt;</span>\n' +
          '  <span class="ls-agents-ellipsis">…</span>\n' +
          '<span class="ls-agents-tag">&lt;/table&gt;</span></pre>';
      }
      progressEl.textContent = (step + 1) + " / " + STEPS.length;
      readoutEl.textContent = READ[step];
      prevBtn.disabled = step === 0;
      nextBtn.textContent = step === STEPS.length - 1 ? (DE ? "Fertig" : "Done") : (DE ? "Nächster Schritt" : "Next step");
      el.querySelector(".ls-agents-loop").classList.toggle("is-active", step > 0 && step < STEPS.length - 1);
      contextEl.scrollTop = contextEl.scrollHeight;
    }
    function setStep(next) {
      step = Math.max(0, Math.min(STEPS.length - 1, next));
      render();
    }
    prevBtn.addEventListener("click", function () { setStep(step - 1); });
    nextBtn.addEventListener("click", function () { setStep(step + 1); });
    render();
    return {
      update: function (s) { if (s && typeof s.step === "number") setStep(s.step); },
      next: function () {
        if (step < STEPS.length - 1) { setStep(step + 1); return true; }
        return false;
      },
      prev: function () {
        if (step > 0) { setStep(step - 1); return true; }
        return false;
      },
      resize: function () {},
      pause: function () {},
      resume: function () {},
      destroy: function () {
        el.remove();
      }
    };
  }
  core.register("agents", agentsScene);
})();
