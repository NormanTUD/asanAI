(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function agentsScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
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
        '<section class="ls-agents-col"><div class="ls-agents-col-head"><b>' + (DE ? "Runtime" : "Runtime") + '</b><span>' + (DE ? "außerhalb des Modells" : "outside the model") + '</span></div><div class="ls-agents-runtime"><div class="ls-agents-terminal" aria-live="polite"></div><div class="ls-agents-shot"><canvas class="ls-agents-canvas" role="img"></canvas></div></div></section>' +
      '</div>' +
      '<div class="ls-agents-loop"><span>' + (DE ? "Tool-Call" : "tool call") + '</span><i>→</i><span>' + (DE ? "ausführen" : "execute") + '</span><i>→</i><span>' + (DE ? "Ergebnis in den Kontext" : "result into context") + '</span><i>→</i><span>' + (DE ? "weiter" : "continue") + '</span></div>' +
      '<div class="ls-agents-controls"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-agents-prev">←</button><span class="ls-agents-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-agents-next">' + (DE ? "Nächster Schritt" : "Next step") + '</button></div>' +
      '<p class="ls-agents-readout"></p>';
    root.appendChild(el);
    var contextEl = el.querySelector(".ls-agents-context");
    var terminalEl = el.querySelector(".ls-agents-terminal");
    var shotEl = el.querySelector(".ls-agents-shot");
    var canvas = el.querySelector(".ls-agents-canvas");
    var progressEl = el.querySelector(".ls-agents-progress");
    var readoutEl = el.querySelector(".ls-agents-readout");
    var prevBtn = el.querySelector(".ls-agents-prev");
    var nextBtn = el.querySelector(".ls-agents-next");
    var C = api.colors();
    var size = null, pulseStart = 0;
    function esc(s) { return api.esc(s); }
    function fit() {
      if (!shotEl || shotEl.hidden) return;
      size = api.fit(canvas, shotEl);
      drawShot();
    }
    function drawShot() {
      if (!size) size = api.fit(canvas, shotEl);
      if (!size) return;
      var ctx = size.ctx, w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
      var pad = 10;
      ctx.fillStyle = C.paper2; ctx.fillRect(pad, pad, w - pad * 2, 24);
      ctx.fillStyle = C.muted;
      ["#92a19a", "#5c9baf", "#869b55"].forEach(function (col, i) {
        ctx.beginPath(); ctx.arc(pad + 12 + i * 13, pad + 12, 3.2, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      });
      ctx.fillStyle = C.line; ctx.fillRect(pad + 52, pad + 6, w - pad * 2 - 62, 13);
      ctx.fillStyle = C.soft; ctx.font = '600 8px "Open Sans", sans-serif'; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText("example.com", pad + 58, pad + 13);
      ctx.fillStyle = C.petrol; ctx.font = '700 ' + Math.max(10, api.font("canvas-sm")) + 'px "Barlow", sans-serif';
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(DE ? "Beispiel-Shop" : "Example Shop", pad + 16, pad + 40);
      ctx.fillStyle = C.line; ctx.fillRect(pad + 16, pad + 62, w - pad * 2 - 32, 1);
      ctx.fillStyle = C.paper2; ctx.fillRect(pad + 16, pad + 76, w - pad * 2 - 32, h - pad - 90);
      ctx.fillStyle = C.soft; ctx.font = '600 ' + Math.max(9, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "Kaffeemaschine" : "coffee machine", pad + 28, pad + 90);
      ctx.fillStyle = C.green; ctx.font = '700 ' + Math.max(14, api.font("canvas")) + 'px "Barlow", sans-serif';
      ctx.fillText("42 €", pad + 28, pad + 112);
      ctx.fillStyle = C.petrol; ctx.fillRect(w - pad - 96, h - pad - 42, 76, 24);
      ctx.fillStyle = "#fff"; ctx.font = '700 9px "Open Sans", sans-serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(DE ? "Kaufen" : "Buy", w - pad - 58, h - pad - 30);
      var age = performance.now() - pulseStart;
      if (age >= 0 && age < 1200) {
        var u = age / 1200;
        ctx.strokeStyle = V.alpha(C.gold, 0.65 * (1 - u));
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pad + 1, pad + 1 + u * (h - pad * 2));
        ctx.lineTo(w - pad - 1, pad + 1 + u * (h - pad * 2));
        ctx.stroke();
      }
      ctx.strokeStyle = C.gold; ctx.lineWidth = 1.8; ctx.strokeRect(pad + 20, pad + 106, 56, 26);
      ctx.fillStyle = C.gold; ctx.font = '600 8px "Open Sans", sans-serif'; ctx.textAlign = "left";
      ctx.fillText(DE ? "Preis erkannt" : "price detected", pad + 22, pad + 92);
      canvas.setAttribute("aria-label", DE ? "Browser-Screenshot: Beispiel-Shop mit dem Preis 42 Euro." : "Browser screenshot: example shop with the price 42 euros.");
    }
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
      if (step >= 2) { if (size) drawShot(); else requestAnimationFrame(fit); }
      progressEl.textContent = (step + 1) + " / " + STEPS.length;
      readoutEl.textContent = READ[step];
      prevBtn.disabled = step === 0;
      nextBtn.textContent = step === STEPS.length - 1 ? (DE ? "Fertig" : "Done") : (DE ? "Nächster Schritt" : "Next step");
      el.querySelector(".ls-agents-loop").classList.toggle("is-active", step > 0 && step < STEPS.length - 1);
      contextEl.scrollTop = contextEl.scrollHeight;
    }
    function setStep(next) {
      step = Math.max(0, Math.min(STEPS.length - 1, next));
      if (STEPS[step].kind === "shot") pulseStart = performance.now();
      render();
    }
    prevBtn.addEventListener("click", function () { setStep(step - 1); });
    nextBtn.addEventListener("click", function () { setStep(step + 1); });
    window.addEventListener("resize", fit);
    window.addEventListener("tm:theme", function () { C = api.colors(); fit(); });
    render();
    fit();
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
      resize: fit,
      pause: function () {},
      resume: function () { fit(); },
      destroy: function () {
        window.removeEventListener("resize", fit);
        el.remove();
      }
    };
  }
  core.register("agents", agentsScene);
})();
