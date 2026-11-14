(function () {
  "use strict";
  window.RagScene = function (root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-rag-scene";
    el.innerHTML = '<div class="ls-rag-query"><span>' + (DE ? "Frage" : "Query") + '</span><b>' + (DE ? "Warum ist der Himmel blau?" : "Why is the sky blue?") + '</b></div>' +
      '<div class="ls-rag-space"><canvas class="ls-rag-canvas" role="img"></canvas></div>' +
      '<div class="ls-rag-chunks"></div>' +
      '<div class="ls-rag-context" aria-live="polite"></div>' +
      '<div class="ls-rag-answer" aria-live="polite"></div>' +
      '<div class="ls-tokenize-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-rag-prev">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-tokenize-progress ls-rag-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-rag-next">' + (DE ? "Weiter" : "Next") + ' →</button></div>';
    root.appendChild(el);
    var chunks = DE ? [
      { id: "a", text: "Luftmoleküle streuen kurzwelliges blaues Licht stärker als langwelliges rotes.", score: .92, v: [0.94, 0.17] },
      { id: "b", text: "Die Rayleigh-Streuung erklärt die blaue Farbe des Himmels.", score: .88, v: [0.86, 0.30] },
      { id: "c", text: "Sonnenuntergänge sind rot, weil das Licht dann einen längeren Weg durch die Atmosphäre hat.", score: .61, v: [0.58, -0.32] },
      { id: "d", text: "Chlorophyll absorbiert rotes und blaues Licht für die Photosynthese.", score: .12, v: [-0.20, 0.82] }
    ] : [
      { id: "a", text: "Air molecules scatter short-wavelength blue light more strongly than long-wavelength red light.", score: .92, v: [0.94, 0.17] },
      { id: "b", text: "Rayleigh scattering explains the blue colour of the sky.", score: .88, v: [0.86, 0.30] },
      { id: "c", text: "Sunsets are red because light travels a longer path through the atmosphere.", score: .61, v: [0.58, -0.32] },
      { id: "d", text: "Chlorophyll absorbs red and blue light for photosynthesis.", score: .12, v: [-0.20, 0.82] }
    ];
    var step = 0;
    var selected = {};
    chunks.forEach(function (c) { selected[c.id] = c.score > .7; });
    var space = el.querySelector(".ls-rag-space");
    var canvas = el.querySelector(".ls-rag-canvas");
    var spaceSize = null;
    var chunksEl = el.querySelector(".ls-rag-chunks");
    var contextEl = el.querySelector(".ls-rag-context");
    var answerEl = el.querySelector(".ls-rag-answer");
    var prevBtn = el.querySelector(".ls-rag-prev");
    var nextBtn = el.querySelector(".ls-rag-next");
    var progress = el.querySelector(".ls-rag-progress");
    function drawSpace() {
      if (!canvas || !space) return;
      spaceSize = api.fit(canvas, space);
      var ctx = spaceSize.ctx, w = spaceSize.w, h = spaceSize.h;
      var C = api.colors();
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = C.line; ctx.globalAlpha = 0.55; ctx.lineWidth = 1;
      var cx = w * 0.5, cy = h * 0.55, s = Math.min(w, h) * 0.33;
      for (var g = -1; g <= 1; g += 0.25) {
        ctx.beginPath(); ctx.moveTo(cx - s, cy - g * s); ctx.lineTo(cx + s, cy - g * s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + g * s, cy - s); ctx.lineTo(cx + g * s, cy + s); ctx.stroke();
      }
      ctx.globalAlpha = 0.9; ctx.strokeStyle = C.lineStrong;
      ctx.beginPath(); ctx.moveTo(cx - s, cy); ctx.lineTo(cx + s, cy); ctx.moveTo(cx, cy - s); ctx.lineTo(cx, cy + s); ctx.stroke();
      ctx.globalAlpha = 1;
      var qv = [0.96, 0.12];
      function P(v) { return { x: cx + v[0] * s, y: cy - v[1] * s }; }
      function arrow(v, col, width) {
        var p = P(v);
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y); ctx.stroke();
        var a = Math.atan2(p.y - cy, p.x - cx), ah = 6;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - ah * Math.cos(a - 0.4), p.y - ah * Math.sin(a - 0.4)); ctx.lineTo(p.x - ah * Math.cos(a + 0.4), p.y - ah * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
      }
      var qp = P(qv);
      ctx.strokeStyle = C.gold; ctx.lineWidth = 2.4; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(qp.x, qp.y); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = C.gold; ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; ctx.textAlign = "left"; ctx.fillText(DE ? "Query" : "query", qp.x + 5, qp.y - 4);
      chunks.forEach(function (c) {
        var p = P(c.v), on = selected[c.id];
        arrow(c.v, on ? C.green : C.blue, on ? 3 : 1.8);
        ctx.strokeStyle = on ? C.green : C.muted; ctx.globalAlpha = on ? 0.65 : 0.25;
        ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(qp.x, qp.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        ctx.fillStyle = on ? C.green : C.ink; ctx.font = '700 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif'; ctx.textAlign = "center"; ctx.fillText(c.id + " · " + Math.round(c.score * 100) + "%", p.x, p.y - 7);
      });
      ctx.fillStyle = C.petrol; ctx.font = '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif'; ctx.textAlign = "left";
      ctx.fillText(DE ? "Query und Chunk-Vektoren (2D-Projektion)" : "Query and chunk vectors (2D projection)", 12, 18);
      canvas.setAttribute("aria-label", DE ? "Query- und Chunk-Vektoren im zweidimensionalen Raum; die grünen Chunks sind ausgewählt." : "Query and chunk vectors in a two-dimensional space; green chunks are selected.");
    }
    function render() {
      chunksEl.innerHTML = chunks.map(function (c) {
        var on = selected[c.id];
        return '<button type="button" class="ls-rag-chunk' + (on ? " is-on" : "") + '" data-chunk="' + c.id + '"><span class="ls-rag-score">' + Math.round(c.score * 100) + '%</span><span class="ls-rag-text">' + api.esc(c.text) + '</span><i class="ls-rag-bar" style="width:' + Math.round(c.score * 100) + '%"></i></button>';
      }).join("");
      chunksEl.querySelectorAll("[data-chunk]").forEach(function (b) {
        b.addEventListener("click", function () { selected[b.getAttribute("data-chunk")] = !selected[b.getAttribute("data-chunk")]; render(); });
      });
      var picked = chunks.filter(function (c) { return selected[c.id]; });
      contextEl.innerHTML = step >= 2 ? '<div class="ls-rag-context-head">' + (DE ? "Eingefügter Kontext" : "Inserted context") + '</div>' + picked.map(function (c, i) { return '<p><b>[' + (i + 1) + ']</b> ' + api.esc(c.text) + '</p>'; }).join("") : '<div class="ls-rag-context-head">' + (DE ? "Noch nichts eingefügt" : "Nothing inserted yet") + '</div><p>' + (DE ? "Die Suche findet Chunks; erst danach landen sie im Kontext." : "Retrieval finds chunks; only then do they enter the context.") + '</p>';
      answerEl.innerHTML = step >= 3 ? '<div class="ls-rag-answer-head">' + (DE ? "Antwort mit Quellen" : "Answer with sources") + '</div><p>' + (DE ? "Der Himmel ist blau, weil Luftmoleküle kurzwelliges blaues Licht stärker streuen als rotes. [1] Die Rayleigh-Streuung beschreibt diesen Effekt. [2]" : "The sky is blue because air molecules scatter short-wavelength blue light more strongly than red. [1] Rayleigh scattering describes this effect. [2]") + '</p><div class="ls-rag-agent">' + (DE ? "Agent: suchen → lesen → einsetzen → antworten" : "Agent: search → read → insert → answer") + '</div>' : "";
      progress.textContent = (step + 1) + " / 4";
      prevBtn.disabled = step === 0;
      nextBtn.textContent = step === 3 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
      drawSpace();
    }
    function setStep(i) { step = Math.max(0, Math.min(3, i)); render(); }
    function nextInternal() { if (step < 3) { setStep(step + 1); return true; } return false; }
    function prevInternal() { if (step > 0) { setStep(step - 1); return true; } return false; }
    function nextStep() { if (nextInternal()) return; api.goNext(); }
    function prevStep() { if (prevInternal()) return; api.goPrev(); }
    prevBtn.addEventListener("click", prevStep);
    nextBtn.addEventListener("click", nextStep);
    function resizeSpace() { drawSpace(); }
    window.addEventListener("resize", resizeSpace);
    window.addEventListener("tm:theme", drawSpace);
    render();
    return {
      update: function (s) { if (s && typeof s.step === "number") setStep(s.step); },
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) {
        if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return false;
        if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") return nextInternal();
        if (e.key === "ArrowLeft" || e.key === "PageUp") return prevInternal();
        return false;
      },
      resize: function () { drawSpace(); },
      destroy: function () { window.removeEventListener("resize", resizeSpace); window.removeEventListener("tm:theme", drawSpace); el.remove(); }
    };
  };
})();
