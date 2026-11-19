(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function langdataScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var langs = [
      { id: "de", label: DE ? "Deutsch" : "German", text: "Sonnenblumen sind die besten Blumen.", gloss: DE ? "Derselbe Inhalt, andere Schrift." : "The same content, a different script." },
      { id: "en", label: DE ? "Englisch" : "English", text: "Sunflowers are the best flowers.", gloss: DE ? "Derselbe Inhalt, andere Schrift." : "The same content, a different script." },
      { id: "fr", label: DE ? "Französisch" : "French", text: "Les tournesols sont les meilleures fleurs.", gloss: DE ? "Derselbe Inhalt, andere Schrift." : "The same content, a different script." },
      { id: "ja", label: DE ? "Japanisch" : "Japanese", text: "ひまわりは最高の花です。", gloss: DE ? "Derselbe Inhalt, andere Schrift." : "The same content, a different script." },
      { id: "ar", label: DE ? "Arabisch" : "Arabic", text: "زهور عباد الشمس هي الأفضل.", gloss: DE ? "Derselbe Inhalt, von rechts nach links." : "The same content, written right to left.", rtl: true },
      { id: "zh", label: DE ? "Chinesisch" : "Chinese", text: "向日葵是最好的花。", gloss: DE ? "Derselbe Inhalt, andere Schrift." : "The same content, a different script." }
    ];
    var mix = [
      { label: "Common Crawl", pct: 60, color: "#63a44b" },
      { label: "WebText2", pct: 22, color: "#5c9baf" },
      { label: "Books1", pct: 8, color: "#9f9700" },
      { label: "Books2", pct: 8, color: "#869b55" },
      { label: "Wikipedia", pct: 3, color: "#9185be" }
    ];
    var active = DE ? "de" : "en";
    var C = api.colors();
    var TRUTH = DE ? {
      title: "Viele Sätze, eine Wahrheit",
      headline: "Berlin liegt an der Spree.",
      note: "Illustration: Die Sätze sind Beispiele, keine Messung. Die meisten Beschreibungen liegen nahe an der Wahrheit; ein falscher Satz liegt weit daneben.",
      items: [
        { t: "Berlin liegt an der Spree.", d: 0.06, ok: true },
        { t: "Die Spree fließt durch Berlin.", d: -0.02, ok: true },
        { t: "Der Fluss, der durch Berlin läuft, ist die Spree.", d: 0.14, ok: true },
        { t: "Kann schon sein, dass Berlin an der Spree liegt.", d: 0.30, ok: true, label: "relativ nah" },
        { t: "Berlin liegt an der Elbe.", d: 1.45, ok: false }
      ]
    } : {
      title: "Many sentences, one truth",
      headline: "The Nile flows through Egypt.",
      note: "Illustration: the sentences are examples, not a measurement. Most descriptions sit near the truth; a false sentence lies far away.",
      items: [
        { t: "The Nile flows through Egypt.", d: 0.06, ok: true },
        { t: "Egypt lies on the Nile.", d: -0.02, ok: true },
        { t: "The river that runs through Egypt is the Nile.", d: 0.14, ok: true },
        { t: "It may well be that Egypt lies on the Nile.", d: 0.30, ok: true, label: "relatively near" },
        { t: "The Nile flows through Brazil.", d: 1.45, ok: false }
      ]
    };
    var wikiHtml = DE
      ? '<span class="ls-code-ellipsis">…</span>\n' +
        '<span class="ls-code-tag">&lt;p&gt;</span><span class="ls-code-tag">&lt;b&gt;</span>Paris<span class="ls-code-tag">&lt;/b&gt;</span> (deutsch: [paˈʁiːs]; französisch: [paʁi]) ist die <span class="ls-code-tag">&lt;a href=&quot;/wiki/Hauptstadt&quot; title=&quot;Hauptstadt&quot;&gt;</span>Hauptstadt<span class="ls-code-tag">&lt;/a&gt;</span> der <span class="ls-code-tag">&lt;a href=&quot;/wiki/Frankreich&quot; title=&quot;Frankreich&quot;&gt;</span>Französischen Republik<span class="ls-code-tag">&lt;/a&gt;</span> und Hauptort der <span class="ls-code-tag">&lt;a href=&quot;/wiki/Region_(Frankreich)&quot; title=&quot;Region (Frankreich)&quot;&gt;</span>Region<span class="ls-code-tag">&lt;/a&gt;</span> <span class="ls-code-tag">&lt;a href=&quot;/wiki/%C3%8Ele-de-France&quot; title=&quot;Île-de-France&quot;&gt;</span>Île-de-France<span class="ls-code-tag">&lt;/a&gt;</span>.<span class="ls-code-tag">&lt;/p&gt;</span>\n' +
        '<span class="ls-code-ellipsis">…</span>'
      : '<span class="ls-code-ellipsis">…</span>\n' +
        '<span class="ls-code-tag">&lt;p&gt;</span><span class="ls-code-tag">&lt;b&gt;</span>Paris<span class="ls-code-tag">&lt;/b&gt;</span> is the <span class="ls-code-tag">&lt;a href=&quot;/wiki/Capital_city&quot; title=&quot;Capital city&quot;&gt;</span>capital<span class="ls-code-tag">&lt;/a&gt;</span> and <span class="ls-code-tag">&lt;a href=&quot;/wiki/List_of_communes_in_France_with_over_20,000_inhabitants&quot; title=&quot;List of communes in France with over 20,000 inhabitants&quot;&gt;</span>largest city<span class="ls-code-tag">&lt;/a&gt;</span> of <span class="ls-code-tag">&lt;a href=&quot;/wiki/France&quot; title=&quot;France&quot;&gt;</span>France<span class="ls-code-tag">&lt;/a&gt;</span>, with an estimated city population of 2.04 million in an area of 105.4 km<span class="ls-code-tag">&lt;sup&gt;</span>2<span class="ls-code-tag">&lt;/sup&gt;</span> (40.7 sq mi).<span class="ls-code-tag">&lt;/p&gt;</span>\n' +
        '<span class="ls-code-ellipsis">…</span>';
    var el = document.createElement("div");
    el.className = "ls-lang-scene";
    el.innerHTML =
      '<div class="ls-lang-tabs" role="group" aria-label="' + (DE ? "Sprachen" : "Languages") + '"></div>' +
      '<div class="ls-lang-sample">' +
        '<span class="ls-lang-tag"></span>' +
        '<p class="ls-lang-text" lang="de"></p>' +
        '<p class="ls-lang-gloss"></p>' +
        '<div class="ls-lang-all" hidden></div>' +
      '</div>' +
      '<div class="ls-lang-truth">' +
        '<div class="ls-lang-truth-head"></div>' +
        '<div class="ls-lang-truth-grid"><div class="ls-lang-truth-plot"><canvas class="ls-lang-truth-canvas" role="img"></canvas></div><ol class="ls-lang-truth-list"></ol></div>' +
        '<p class="ls-lang-truth-note"></p>' +
      '</div>' +
      '<div class="ls-lang-mix">' +
        '<div class="ls-lang-data-summary" hidden>' +
          '<div class="ls-lang-data-stage">' +
            '<div class="ls-lang-data-stage-head"><span class="ls-lang-data-num">1</span><b>' + (DE ? "Vortraining" : "Pretraining") + '</b><span>' + (DE ? "großer Datensatz" : "large dataset") + '</span></div>' +
            '<p class="ls-lang-data-stage-data">' + (DE ? "Großer, gefilterter Textkorpus: Wikipedia, Reddit, Bücher, Webseiten, Quellcode." : "A large, filtered text corpus: Wikipedia, Reddit, books, websites, source code.") + '</p>' +
            '<p class="ls-lang-data-stage-do">' + (DE ? "Das Netz lernt Muster, Sprache, Fakten und Code und setzt rohe Daten fort." : "The net learns patterns, language, facts, and code, and continues raw data.") + '</p>' +
            '<p class="ls-lang-data-stage-source">' + (DE ? "Wikipedia-Artikel „Paris“" : "Wikipedia article “Paris”") + '</p>' +
            '<pre class="ls-lang-data-code"><code>' + wikiHtml + '</code></pre>' +
          '</div>' +
          '<div class="ls-lang-data-bridge">' + (DE ? "Erst die Breite des Internets, dann die Richtung der Fragen." : "First the breadth of the internet, then the direction of the questions.") + '</div>' +
          '<div class="ls-lang-data-stage ls-lang-data-stage--fine">' +
            '<div class="ls-lang-data-stage-head"><span class="ls-lang-data-num">2</span><b>' + (DE ? "Fine-Tuning" : "Fine-tuning") + '</b><span>' + (DE ? "kleiner Datensatz" : "small dataset") + '</span></div>' +
            '<p class="ls-lang-data-stage-data">' + (DE ? "Menschenfragen, auch mit Tippfehlern und Unklarheiten, plus nützliche Antworten." : "Human questions, including typos and unclear wording, plus useful answers.") + '</p>' +
            '<p class="ls-lang-data-stage-do">' + (DE ? "Das Netz antwortet als Gesprächspartner und geht auf konkrete Fragen detaillierter ein." : "The net answers as a conversation partner and goes into more detail on concrete questions.") + '</p>' +
            '<div class="ls-lang-data-chat"><div class="ls-lang-bubble ls-lang-bubble--user">' + (DE ? "Wie heißt die Hauptstadt von Frankreich?" : "What is the capital of France?") + '</div><div class="ls-lang-bubble ls-lang-bubble--agent">' + (DE ? "Die Hauptstadt von Frankreich ist Paris." : "The capital of France is Paris.") + '</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="ls-lang-mix-detail">' +
        '<div class="ls-lang-mix-head">' + (DE ? "Die Datenmischung" : "The data mix") + '</div>' +
        '<div class="ls-lang-scale"><span class="ls-lang-scale-label">' + (DE ? "Datenmenge" : "data scale") + '</span><span class="ls-lang-scale-unit">KB</span><span class="ls-lang-scale-unit">MB</span><span class="ls-lang-scale-unit">GB</span><span class="ls-lang-scale-unit">TB</span><span class="ls-lang-scale-unit">PB</span><span class="ls-lang-scale-unit">EB</span><span class="ls-lang-scale-unit is-on">ZB</span><span class="ls-lang-scale-year">2016</span></div>' +
        '<div class="ls-lang-scale-note">' + (DE ? "1 ZB = 10²¹ Byte. Erst seit der Zettabyte-Ära gibt es genug Text für diese Modelle." : "1 ZB = 10²¹ bytes. Only since the zettabyte era has there been enough text for these models.") + '</div>' +
        '<div class="ls-lang-bars"></div>' +
        '<p class="ls-lang-note">' + (DE ? "GPT-3-Mix nach Brown et al. (2020), Tabelle 2.2, gerundet. Labs veröffentlichen ihre genauen Rezepte nicht." : "GPT-3 mix from Brown et al. (2020), Table 2.2, rounded. Labs do not publish their exact recipes.") + '</p>' +
        '</div>' +
      '</div>' +
      '<p class="ls-lang-caveat">' + (DE ? "Dieselbe Schleife, dieselben Gewichte: Die Schrift ändert die Tokens, nicht die Aufgabe. Manche Sprachen brauchen für denselben Inhalt mehr Tokens; der Tokenizer kann sie dadurch teurer machen (Petrov et al., 2023)." : "The same loop, the same weights: the script changes the tokens, not the task. Some languages need more tokens for the same content, so the tokenizer can make them more expensive (Petrov et al., 2023).") + '</p>' +
      '<div class="ls-tokenize-nav ls-lang-nav"><button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-lang-prev">← ' + (DE ? "Zurück" : "Back") + '</button><span class="ls-tokenize-progress ls-lang-progress"></span><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-lang-next">' + (DE ? "Weiter →" : "Next →") + '</button></div>';
    root.appendChild(el);
    var tabs = el.querySelector(".ls-lang-tabs");
    var sampleEl = el.querySelector(".ls-lang-sample");
    var truthEl = el.querySelector(".ls-lang-truth");
    var mixEl = el.querySelector(".ls-lang-mix");
    var summaryEl = el.querySelector(".ls-lang-data-summary");
    var summaryStages = summaryEl ? Array.prototype.slice.call(summaryEl.querySelectorAll(".ls-lang-data-stage")) : [];
    var summaryBridge = summaryEl ? summaryEl.querySelector(".ls-lang-data-bridge") : null;
    var detailEl = el.querySelector(".ls-lang-mix-detail");
    var caveatEl = el.querySelector(".ls-lang-caveat");
    var navEl = el.querySelector(".ls-lang-nav");
    var allEl = el.querySelector(".ls-lang-all");
    var mode = "all";
    var showSummary = false;
    var summaryStep = 0;
    var tag = el.querySelector(".ls-lang-tag");
    var text = el.querySelector(".ls-lang-text");
    var gloss = el.querySelector(".ls-lang-gloss");
    var bars = el.querySelector(".ls-lang-bars");
    var truthHead = el.querySelector(".ls-lang-truth-head");
    var truthCanvas = el.querySelector(".ls-lang-truth-canvas");
    var truthList = el.querySelector(".ls-lang-truth-list");
    var truthNote = el.querySelector(".ls-lang-truth-note");
    var truthSize = null;
    var navPrev = el.querySelector(".ls-lang-prev");
    var navNext = el.querySelector(".ls-lang-next");
    var navProgress = el.querySelector(".ls-lang-progress");
    function updateNav() {
      var idx = 0;
      langs.forEach(function (l, i) { if (l.id === active) idx = i; });
      navProgress.textContent = (idx + 1) + ' / ' + langs.length;
      navPrev.disabled = idx === 0;
      navNext.textContent = idx === langs.length - 1 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
    }
    function show(id) {
      var item = langs.filter(function (l) { return l.id === id; })[0] || langs[0];
      active = item.id;
      Array.prototype.forEach.call(tabs.querySelectorAll("button"), function (b) {
        b.classList.toggle("is-on", b.getAttribute("data-lang") === item.id);
      });
      tag.textContent = item.label;
      text.textContent = item.text;
      text.setAttribute("lang", item.id);
      text.setAttribute("dir", item.rtl ? "rtl" : "ltr");
      gloss.textContent = item.gloss;
      updateNav();
    }
    langs.forEach(function (l) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-chip" + (l.id === active ? " is-on" : "");
      b.setAttribute("data-lang", l.id);
      b.textContent = l.label;
      b.addEventListener("click", function () { show(l.id); });
      tabs.appendChild(b);
    });
    bars.innerHTML = mix.map(function (m) {
      return '<div class="ls-lang-bar"><span class="ls-lang-bar-label">' + api.esc(m.label) + '</span>' +
        '<span class="ls-lang-bar-track"><i style="width:' + m.pct + '%;background:' + m.color + '"></i></span>' +
        '<span class="ls-lang-bar-val">' + m.pct + '%</span></div>';
    }).join("");
    if (allEl) allEl.innerHTML = langs.map(function (l) {
      return '<p class="ls-lang-all-row"><b>' + api.esc(l.label) + '</b><span lang="' + l.id + '" dir="' + (l.rtl ? "rtl" : "ltr") + '">' + api.esc(l.text) + '</span></p>';
    }).join("");
    function setSummaryStep(step) {
      summaryStep = step ? 1 : 0;
      if (summaryBridge) summaryBridge.hidden = summaryStep < 1;
      summaryStages.forEach(function (stage, i) {
        if (i === 0) {
          stage.hidden = false;
          stage.classList.remove("is-in");
          requestAnimationFrame(function () { stage.classList.add("is-in"); });
        } else if (summaryStep >= 1) {
          stage.hidden = false;
          stage.classList.remove("is-in");
          void stage.offsetWidth;
          stage.classList.add("is-in");
        } else {
          stage.hidden = true;
          stage.classList.remove("is-in");
        }
      });
    }
    function applyMode() {
      var isTruth = mode === "truth";
      el.classList.toggle("is-truth", isTruth);
      var isLang = mode === "languages";
      var isScale = mode === "scale";
      var showSummaryNow = isScale && showSummary;
      if (sampleEl) sampleEl.hidden = isTruth || isScale;
      if (tabs) tabs.hidden = true;
      if (truthEl) truthEl.hidden = !isTruth;
      if (mixEl) mixEl.hidden = !isScale;
      if (summaryEl) {
        var wasHidden = summaryEl.hidden;
        summaryEl.hidden = !showSummaryNow;
        if (showSummaryNow && wasHidden) setSummaryStep(0);
      }
      if (detailEl) detailEl.hidden = showSummaryNow;
      if (caveatEl) caveatEl.hidden = isTruth || showSummary;
      if (navEl) navEl.hidden = true;
      if (allEl) allEl.hidden = !isLang;
      if (sampleEl) sampleEl.querySelectorAll(":scope > .ls-lang-tag, :scope > .ls-lang-text, :scope > .ls-lang-gloss").forEach(function (x) { x.hidden = isLang; });
    }
    if (truthHead) truthHead.textContent = TRUTH.title;
    if (truthNote) truthNote.textContent = TRUTH.note;
    if (truthList) truthList.innerHTML = TRUTH.items.map(function (item, i) {
      return '<li class="' + (item.ok ? "is-near" : "is-false") + '"><span class="ls-lang-truth-dot">' + (i + 1) + '</span><span>' + api.esc(item.t) + '</span><b>' + (item.label || (item.ok ? (DE ? "nah" : "near") : (DE ? "falsch" : "false"))) + '</b></li>';
    }).join("");
    function drawTruth() {
      if (!truthCanvas) return;
      truthSize = api.fit(truthCanvas, truthCanvas.parentNode);
      var ctx = truthSize.ctx, w = truthSize.w, h = truthSize.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, w, h);
      V.grid(ctx, w, h, C, 24, 0.12);
      var padL = 38, padR = 14, padT = 22, padB = 30;
      var yMax = 1.55;
      function X(i) { return padL + (i / (TRUTH.items.length - 1)) * (w - padL - padR); }
      function Y(d) { return h - padB - (d / yMax) * (h - padT - padB); }
      function truthCurve(x) { return 0.10 + 0.06 * Math.sin(x * Math.PI * 1.7); }
      function curveY(x) { return Y(truthCurve(x)); }
      // Wrong items sit outside the truth band; the green band is smooth and wide.
      var bandOuter = 44;
      ctx.fillStyle = "rgba(145,133,190,.10)";
      ctx.fillRect(padL, padT, w - padL - padR, h - padT - padB);
      ctx.beginPath();
      for (var ub = 0; ub <= 100; ub++) {
        var ux = padL + ub / 100 * (w - padL - padR);
        var uy = curveY(ub / 100) - bandOuter;
        if (ub === 0) ctx.moveTo(ux, uy); else ctx.lineTo(ux, uy);
      }
      for (var lb = 100; lb >= 0; lb--) {
        var lx = padL + lb / 100 * (w - padL - padR);
        var ly = curveY(lb / 100) + bandOuter;
        ctx.lineTo(lx, ly);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(99,164,75,.22)";
      ctx.fill();
      ctx.strokeStyle = C.green; ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (var ci3 = 0; ci3 <= 80; ci3++) {
        var tx = ci3 / 80, tpx = padL + tx * (w - padL - padR);
        if (ci3 === 0) ctx.moveTo(tpx, curveY(tx)); else ctx.lineTo(tpx, curveY(tx));
      }
      ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left"; ctx.textBaseline = "bottom";
      ctx.fillText(DE ? "Wahrheit" : "truth", padL + 4, curveY(0) - 12);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB); ctx.lineTo(w - padR, h - padB); ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(DE ? "Sätze" : "sentences", (w + padL) / 2, h - 14);
      ctx.save();
      ctx.translate(12, (h + padT) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = "top";
      ctx.fillText(DE ? "Nähe zur Wahrheit" : "distance from truth", 0, 0);
      ctx.restore();
      TRUTH.items.forEach(function (item, i) {
        var x = X(i), y = Y(truthCurve(i / (TRUTH.items.length - 1)) + item.d);
        if (item.ok) {
          ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = C.blue; ctx.fill();
          ctx.strokeStyle = C.paper; ctx.lineWidth = 2; ctx.stroke();
        } else {
          ctx.strokeStyle = C.lilac; ctx.lineWidth = 2.8;
          ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y + 6); ctx.moveTo(x + 6, y - 6); ctx.lineTo(x - 6, y + 6); ctx.stroke();
        }
        ctx.fillStyle = item.ok ? C.ink : C.lilac;
        ctx.font = '700 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillText(String(i + 1), x, y - 9);
      });
      truthCanvas.setAttribute("aria-label", TRUTH.title + ": " + TRUTH.items.map(function (item) { return item.t; }).join("; "));
    }
    function resize() { drawTruth(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); drawTruth(); });
    applyMode();
    drawTruth();
    show(active);
    function stepLanguage(dir) {
      var idx = -1;
      langs.forEach(function (l, i) { if (l.id === active) idx = i; });
      var next = idx + dir;
      if (next < 0 || next >= langs.length) return false;
      show(langs[next].id);
      return true;
    }
    function nextStep() {
      if (stepLanguage(1)) return;
      api.goNext();
    }
    function prevStep() {
      if (stepLanguage(-1)) return;
      api.goPrev();
    }
    navPrev.addEventListener("click", prevStep);
    navNext.addEventListener("click", nextStep);
    return {
      update: function (s) {
        if (!s) return;
        if (s.summary !== undefined) showSummary = !!s.summary;
        if (s.mode) mode = s.mode;
        applyMode();
        requestAnimationFrame(drawTruth);
      },
      next: function () {
        if (showSummary && mode === "scale" && summaryStep < 1) {
          setSummaryStep(1);
          return true;
        }
        return false;
      },
      prev: function () {
        if (showSummary && mode === "scale" && summaryStep > 0) {
          setSummaryStep(0);
          return true;
        }
        return false;
      },
      onKey: function () { return false; },
      resize: function () { drawTruth(); },
      destroy: function () { window.removeEventListener("resize", resize); el.remove(); }
    };
  }

  core.register("langdata", langdataScene);
})();
