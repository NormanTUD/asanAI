(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function bookScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-book-scene";
    el.innerHTML = '<div class="ls-book-art"><canvas class="ls-book-canvas" role="img" aria-label="' + (DE ? "Ein aufgeschlagenes Buch mit einem Labyrinth" : "An open book with a labyrinth") + '"></canvas></div>' +
      '<div class="ls-book-page">' +
        '<div class="ls-book-kicker">Borges · Funes el memorioso</div>' +
        '<p class="ls-book-drop">' + (DE ? "Funes erinnert sich an alles: an jeden Stein, jede Wolke, jede Münze. Weil er nichts vergisst, kann er nicht abstrahieren. Borges schreibt, Denken heiße Unterschiede vergessen, verallgemeinern, abstrahieren." : "Funes remembers everything: every stone, every cloud, every coin. Because he forgets nothing, he cannot abstract. Borges writes that thinking means forgetting differences, generalising, abstracting.") + '</p>' +
        '<p>' + (DE ? "Ein Sprachmodell muss nicht alles speichern. Es lernt Strukturen, die viele Fälle zusammenfassen. Wer das nächste Token gut vorhersagt, trägt ein Modell der Daten in sich: Vorhersage wird Kompression." : "A language model does not store everything. It learns structures that summarise many cases. A model that predicts the next token well carries a model of the data inside it: prediction becomes compression.") + '</p>' +
        '<p>' + (DE ? "Lindsey et al. (2025) finden sogar Planung: Vor dem Reimwort hält das Modell mehrere Kandidaten bereit und baut den Satz auf sie zu. Othello-GPT entwickelt aus reinen Zugfolgen ein inneres Brettmodell. Die einfachste Art, richtig vorherzusagen, ist ein gutes inneres Modell." : "Lindsey et al. (2025) even find planning: before the rhyme word, the model holds several candidates and builds the sentence toward one. Othello-GPT develops an internal board model from move sequences alone. The simplest way to predict well is to have a good internal model.") + '</p>' +
      '</div>';
    root.appendChild(el);
    var canvas = el.querySelector(".ls-book-canvas");
    var size = null, ctx = null, C = api.colors();
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#f7f1e3"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = C.petrol; ctx.fillRect(w * .08, h * .10, w * .84, h * .80);
      ctx.fillStyle = "#efe4ca"; ctx.fillRect(w * .12, h * .14, w * .76, h * .72);
      ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.strokeRect(w * .15, h * .17, w * .70, h * .66);
      ctx.strokeStyle = C.petrol; ctx.lineWidth = 1;
      for (var i = 0; i < 8; i++) {
        var y = h * .25 + i * h * .055;
        ctx.beginPath(); ctx.moveTo(w * .22, y); ctx.lineTo(w * .78, y); ctx.stroke();
      }
      ctx.strokeStyle = C.gold; ctx.lineWidth = 2.2;
      var cx = w * .5, cy = h * .54;
      ctx.beginPath();
      for (var k = 0; k < 90; k++) {
        var a = k * .31, r = 5 + k * 1.1;
        var x = cx + Math.cos(a) * r, yy = cy + Math.sin(a) * r * .62;
        if (k === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
    }
    function resize() { size = api.fit(canvas, canvas.parentNode); draw(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    return { update: function () {}, resize: resize, destroy: function () { window.removeEventListener("resize", resize); el.remove(); } };
  }

  core.register("book", bookScene);
})();
