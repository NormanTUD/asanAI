(function () {
  "use strict";

  var K = {};
  var V = window.LearnSysVisuals || {};

  K.canvas = function (api, canvas, host, draw, opts) {
    var o = opts || {};
    var size = null;
    var visible = true;
    var observer = null;
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    function redraw() { if (size) draw(size, { visible: visible, reducedMotion: reduced }); }
    function resize() {
      size = api.fit(canvas, host);
      redraw();
    }
    function onTheme() { redraw(); }
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(function (entries) {
        visible = entries.some(function (en) { return en.isIntersecting; });
        if (o.onVisible) o.onVisible(visible);
        if (visible) redraw();
      }, { threshold: o.threshold || 0.05 });
      observer.observe(host || canvas);
    }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", onTheme);
    resize();
    return {
      resize: resize,
      redraw: redraw,
      isVisible: function () { return visible; },
      reducedMotion: reduced,
      destroy: function () {
        if (observer) observer.disconnect();
        window.removeEventListener("resize", resize);
        window.removeEventListener("tm:theme", onTheme);
      }
    };
  };

  K.nav = function (api, opts) {
    var o = opts || {};
    var el = document.createElement("div");
    el.className = "ls-scene-nav";
    var prev = document.createElement("button");
    prev.type = "button";
    prev.className = "ls-btn ls-btn--ghost ls-btn--tiny";
    prev.setAttribute("data-no-height-test", "1");
    prev.textContent = o.prevLabel || "←";
    var progress = document.createElement("span");
    progress.className = "ls-scene-progress";
    var next = document.createElement("button");
    next.type = "button";
    next.className = "ls-btn ls-btn--primary ls-btn--tiny";
    next.setAttribute("data-no-height-test", "1");
    next.textContent = o.nextLabel || "→";
    el.appendChild(prev);
    el.appendChild(progress);
    el.appendChild(next);
    if (o.onPrev) prev.addEventListener("click", o.onPrev);
    if (o.onNext) next.addEventListener("click", o.onNext);
    return {
      el: el,
      prev: prev,
      next: next,
      progress: progress,
      set: function (text) { progress.textContent = text || ""; },
      setDisabled: function (isPrev, isNext) { prev.disabled = !!isPrev; next.disabled = !!isNext; }
    };
  };

  K.readout = function (target, items) {
    var el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return null;
    el.innerHTML = (items || []).map(function (item) {
      if (typeof item === "string") return "<span>" + item + "</span>";
      return "<span><b>" + (item.label || "") + "</b> " + (item.value == null ? "" : item.value) + "</span>";
    }).join("");
    return el;
  };

  K.range = function (api, opts) {
    var o = opts || {};
    var label = document.createElement("label");
    label.className = "ls-range";
    label.appendChild(document.createTextNode((o.label || "") + " "));
    var input = document.createElement("input");
    input.type = "range";
    input.min = String(o.min == null ? 0 : o.min);
    input.max = String(o.max == null ? 1 : o.max);
    input.step = String(o.step == null ? 0.01 : o.step);
    input.value = String(o.value == null ? 0 : o.value);
    var output = document.createElement("output");
    output.textContent = o.format ? o.format(input.value) : input.value;
    label.appendChild(input);
    label.appendChild(output);
    input.addEventListener("input", function () {
      output.textContent = o.format ? o.format(input.value) : input.value;
      if (o.onInput) o.onInput(input.value, input);
    });
    return {
      el: label,
      input: input,
      output: output,
      set: function (value, silent) {
        input.value = String(value);
        output.textContent = o.format ? o.format(input.value) : input.value;
        if (!silent && o.onInput) o.onInput(input.value, input);
      }
    };
  };

  K.chips = function (api, opts) {
    var o = opts || {};
    var el = document.createElement("div");
    el.className = "ls-scene-chips";
    var buttons = (o.items || []).map(function (item, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-chip" + (i === (o.active || 0) ? " is-on" : "");
      b.textContent = item.label || item;
      b.addEventListener("click", function () {
        buttons.forEach(function (x) { x.classList.remove("is-on"); });
        b.classList.add("is-on");
        if (o.onPick) o.onPick(item, i);
      });
      el.appendChild(b);
      return b;
    });
    return { el: el, buttons: buttons };
  };

  window.LearnSysSceneKit = K;
})();
