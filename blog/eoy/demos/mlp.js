(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function mlpScene(root, api) {
    if (window.__lsMlpEl) {
      root.appendChild(window.__lsMlpEl);
      if (window.IntuitionSpaceMorph && window.IntuitionSpaceMorph.resize) setTimeout(function () { window.IntuitionSpaceMorph.resize(); }, 40);
      return window.__lsMlpApi || {
        update: function () {},
        next: function () { return false; },
        prev: function () { return false; },
        hasNext: function () { return false; },
        hasPrev: function () { return false; },
        resize: function () {},
        onKey: function () { return false; },
        destroy: function () {}
      };
    }
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-mlp-scene";
    el.innerHTML =
      '<div class="ism-panel">' +
        '<div id="ism-copy" class="ism-copy" aria-live="polite"><div id="ism-title" class="ism-title"></div><div id="ism-body" class="ism-body"></div></div>' +
        '<div id="ism-dense-presets" class="ism-dense-presets" hidden></div>' +
        '<div class="ism-stage" id="ism-stage"><div id="ism-wrap" class="ism-wrap">' +
          '<canvas id="ism-canvas" style="display:block;width:100%;height:100%" aria-label="' + (DE ? "Eine Punktwolke: ein Kern in einem Ring wird angehoben, bis eine flache Ebene trennt" : "A point cloud: a core inside a ring is lifted until a flat plane separates them") + '" data-tip-de="Punktwolke: Kern im Ring wird angehoben, bis eine flache Ebene trennt." data-tip-en="Point cloud: a core inside a ring is lifted until a flat plane separates them."></canvas>' +
          '<div id="ism-canvas-status" class="ism-canvas-status" aria-live="polite" hidden></div>' +
        '</div><aside id="ism-side" class="ism-side"><div id="ism-formulas" class="ism-formulas" aria-live="polite"></div></aside></div>' +
        '<div id="ism-dense-controls" class="ism-dense-controls" hidden></div>' +
        '<div class="ism-controls"><button type="button" id="ism-prev" class="ism-btn ism-btn--nav" data-tip-de="Geht einen Schritt in der Erklärung zurück." data-tip-en="Goes one step back in the explanation.">← ' + (DE ? "Zurück" : "Back") + '</button><button type="button" id="ism-next" class="ism-btn ism-btn--nav" disabled data-tip-de="Geht einen Schritt in der Erklärung weiter." data-tip-en="Goes one step forward in the explanation.">' + (DE ? "Weiter" : "Next") + ' →</button><button type="button" id="ism-reset-camera" class="ism-btn" aria-label="' + (DE ? "Ansicht zurücksetzen" : "Reset view") + '" data-tip-de="Setzt die Kameraposition zurück." data-tip-en="Resets the camera position.">⟲</button><div id="ism-dots" class="ism-dots" role="group" aria-label="' + (DE ? "Folien" : "Slides") + '" data-tip-de="Springt direkt zu einer Folie." data-tip-en="Jumps directly to a slide."></div><span id="ism-counter" class="ism-counter">1 / 9</span></div>' +
      '</div>';
    root.appendChild(el);
    window.__lsMlpEl = el;
    var started = false;
    function init() {
      if (started) return;
      if (!window.IntuitionSpaceMorph) { setTimeout(init, 100); return; }
      started = true;
      try { window.IntuitionSpaceMorph.init(); } catch (e) {}
    }
    setTimeout(init, 30);
    var apiObj = {
      update: function () {},
      next: function () {
        var st = window.IntuitionSpaceMorph && window.IntuitionSpaceMorph.state ? window.IntuitionSpaceMorph.state() : null;
        if (!st || st.cur >= st.count - 1) return false;
        window.IntuitionSpaceMorph.next();
        return true;
      },
      prev: function () {
        var st = window.IntuitionSpaceMorph && window.IntuitionSpaceMorph.state ? window.IntuitionSpaceMorph.state() : null;
        if (!st || st.cur <= 0) return false;
        window.IntuitionSpaceMorph.prev();
        return true;
      },
      hasNext: function () {
        var st = window.IntuitionSpaceMorph && window.IntuitionSpaceMorph.state ? window.IntuitionSpaceMorph.state() : null;
        return !!(st && st.cur < st.count - 1);
      },
      hasPrev: function () {
        var st = window.IntuitionSpaceMorph && window.IntuitionSpaceMorph.state ? window.IntuitionSpaceMorph.state() : null;
        return !!(st && st.cur > 0);
      },
      resize: function () { if (window.IntuitionSpaceMorph && window.IntuitionSpaceMorph.resize) window.IntuitionSpaceMorph.resize(); },
      onKey: function (e) {
        var st = window.IntuitionSpaceMorph && window.IntuitionSpaceMorph.state ? window.IntuitionSpaceMorph.state() : null;
        if (!st) return false;
        if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
          if (st.cur < st.count - 1) { window.IntuitionSpaceMorph.next(); return true; }
          return false;
        }
        if (e.key === "ArrowLeft" || e.key === "PageUp") {
          if (st.cur > 0) { window.IntuitionSpaceMorph.prev(); return true; }
          return false;
        }
        return false;
      },
      destroy: function () { el.remove(); }
    };
    window.__lsMlpApi = apiObj;
    return apiObj;
  }

  core.register("mlp", mlpScene);
})();
