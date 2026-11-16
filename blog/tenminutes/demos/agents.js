(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function agentsScene(root, api) {
    var DE = api.lang === "de";
    var STEPS = DE ? [
      { kind: "user", who: "Du", text: "Öffne example.com und finde den Preis. Schreibe ihn in price.txt." },
      { kind: "tool", who: "Modell", text: "Ich brauche die Seite. Ich rufe den Browser auf.", tool: "browser.goto(\"example.com\")" },
      { kind: "shot", who: "Runtime", text: "Screenshot der Seite", tool: "screenshot()", result: "Seite geladen · 1280 × 800" },
      { kind: "tool", who: "Modell", text: "Der Preis ist 42 €. Ich schreibe ihn in die Datei.", tool: "write_file(\"price.txt\", \"42 €\")" },
      { kind: "tool", who: "Runtime", text: "Datei geschrieben", tool: "", result: "ok · 4 Bytes" },
      { kind: "final", who: "Modell", text: "Fertig. Der Preis steht in price.txt." }
    ] : [
      { kind: "user", who: "You", text: "Open example.com and find the price. Write it to price.txt." },
      { kind: "tool", who: "Model", text: "I need the page. I will call the browser.", tool: "browser.goto(\"example.com\")" },
      { kind: "shot", who: "Runtime", text: "Screenshot of the page", tool: "screenshot()", result: "page loaded · 1280 × 800" },
      { kind: "tool", who: "Model", text: "The price is 42 €. I will write it to the file.", tool: "write_file(\"price.txt\", \"42 €\")" },
      { kind: "tool", who: "Runtime", text: "File written", tool: "", result: "ok · 4 bytes" },
      { kind: "final", who: "Model", text: "Done. The price is in price.txt." }
    ];
    var READ = DE ? [
      "Der Auftrag steht im Kontext. Das Modell ist dasselbe wie im Browser; es hat nur neue Werkzeuge.",
      "Das Modell hat keine Hände. Es schreibt einen Tool-Call. Die Runtime führt ihn aus.",
      "Die Runtime gibt einen Screenshot zurück. Ein multimodales Modell kann das Bild als Tokens sehen.",
      "Das Modell liest den Screenshot und entscheidet den nächsten Tool-Call.",
      "Die Runtime bestätigt: Die Datei ist geschrieben. Das Ergebnis steht wieder im Kontext.",
      "Das Modell antwortet mit dem Ergebnis. Dazwischen lief ein normaler LLM-Loop, kein neues Modell."
    ] : [
      "The task is in the context. The model is the same one as in the browser; it only has new tools.",
      "The model has no hands. It writes a tool call. The runtime executes it.",
      "The runtime returns a screenshot. A multimodal model can see the image as tokens.",
      "The model reads the screenshot and decides the next tool call.",
      "The runtime confirms: the file is written. The result is back in the context.",
      "The model answers with the result. A normal LLM loop ran in between, not a new model."
    ];
    var step = 0;
    var el = document.createElement("div");
    el.className = "ls-agents-scene";
    el.innerHTML =
      '<div class="ls-agents-head"><span class="ls-agents-badge">' + (DE ? "Gleiches Modell" : "Same model") + '</span><span class="ls-agents-sub">' + (DE ? "dieselben Gewichte wie im Browser · nur Kontext und Werkzeuge ändern sich" : "same weights as in the browser · only context and tools change") + '</span></div>' +
      '<div class="ls-agents-grid">' +
        '<section class="ls-agents-col"><div class="ls-agents-col-head"><b>' + (DE ? "Kontext" : "Context") + '</b><span>' + (DE ? "wächst mit Tool-Ausgaben" : "grows with tool output") + '</span></div><div class="ls-agents-context" aria-live="polite"></div></section>' +
        '<section class="ls-agents-col"><div class="ls-agents-col-head"><b>' + (DE ? "Runtime" : "Runtime") + '</b><span>' + (DE ? "außerhalb des Modells" : "outside the model") + '</span></div><div class="ls-agents-runtime"><div class="ls-agents-terminal" aria-live="polite"></div><div class="ls-agents-shot" role="img" aria-label="' + (DE ? "Browser-Screenshot: Beispiel-Shop mit dem Preis 42 Euro." : "Browser screenshot: example shop with the price 42 euros.") + '">' +
          '<div class="ls-code-monitor"><div class="ls-code-frame"><div class="ls-code-screen"><div class="ls-code-desktop" style="background-image:url(\'opera.jpg\')">' +
            '<div class="ls-code-window ls-agents-browser">' +
              '<div class="ls-code-bar"><i></i><i></i><i></i><span>Browser</span></div>' +
              '<div class="ls-agents-address">example.com</div>' +
              '<div class="ls-agents-web"><b>' + (DE ? "Beispiel-Shop" : "Example Shop") + '</b><div class="ls-agents-product"><span>' + (DE ? "Kaffeemaschine" : "coffee machine") + '</span><strong>42 €</strong></div><span class="ls-agents-buy">' + (DE ? "Kaufen" : "Buy") + '</span></div>' +
            '</div>' +
            '<div class="ls-code-taskbar"><span class="ls-code-start" aria-hidden="true">▦</span><span class="ls-code-task is-on" style="--task:#5c9baf" aria-hidden="true"></span><span class="ls-agents-taskname">Browser</span><span class="ls-code-clock">14:32</span></div>' +
          '</div></div></div></div>' +
        '</div></div></section>' +
      '</div>' +
      '<div class="ls-agents-loop"><span>' + (DE ? "Tool-Call" : "tool call") + '</span><i>→</i><span>' + (DE ? "ausführen" : "execute") + '</span><i>→</i><span>' + (DE ? "Ergebnis in den Kontext" : "result into context") + '</span><i>→</i><span>' + (DE ? "weiter" : "continue") + '</span></div>' +
      '<div class="ls-agents-controls"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-agents-prev">←</button><span class="ls-agents-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-agents-next">' + (DE ? "Nächster Schritt" : "Next step") + '</button></div>' +
      '<p class="ls-agents-readout"></p>';
    root.appendChild(el);
    var contextEl = el.querySelector(".ls-agents-context");
    var terminalEl = el.querySelector(".ls-agents-terminal");
    var shotEl = el.querySelector(".ls-agents-shot");
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
      shotEl.hidden = step < 2;
      shotEl.classList.toggle("is-pulsing", step === 2);
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
