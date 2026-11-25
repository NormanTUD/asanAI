(function () {
  "use strict";
  if (!window.LearnSys || !window.LearnSysDemoCore) return;
  var SCENES = window.LearnSysDemoCore.scenes;
  LearnSys.defineDemo("intuition", function (root, api) {
    var host = document.createElement("div");
    host.className = "ls-scene-host";
    root.appendChild(host);

    if (!api.tip) api.tip = function (de, en) { return api.lang === "de" ? de : en; };
    var tipEl = document.createElement("div");
    tipEl.className = "ls-eoy-tip";
    tipEl.hidden = true;
    document.body.appendChild(tipEl);
    var tipTarget = null;
    function tipEsc(v) {
      return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    function tipBreak(text) {
      return String(text)
        .replace(/\s*·\s*/g, "\n")
        .replace(/;\s+/g, ";\n")
        .replace(/([.!?])\s+(?=[A-ZÄÖÜ0-9])/g, "$1\n")
        .replace(/\n{3,}/g, "\n\n");
    }
    function tipHtml(text) {
      var parts = String(text).split("$");
      var html = "";
      for (var i = 0; i < parts.length; i++) {
        if (i % 2 === 1 && parts[i]) {
          if (window.temml && window.temml.renderToString) {
            try {
              html += window.temml.renderToString(parts[i], { displayMode: false, throwOnError: false });
              continue;
            } catch (err) {}
          }
          html += tipEsc(parts[i]);
        } else {
          html += tipEsc(tipBreak(parts[i]));
        }
      }
      return html;
    }
    function tipTextFor(node) {
      var text = node.getAttribute("data-tip");
      if (!text) text = node.getAttribute(api.lang === "de" ? "data-tip-de" : "data-tip-en");
      if (!text) text = node.getAttribute("aria-label") || node.getAttribute("title") || "";
      if (!text && node.matches && node.matches("button, [role=button]")) text = node.textContent.trim();
      if (!text && node.matches && node.matches("output")) {
        text = api.tip("Aktueller Wert", "Current value");
      }
      if (!text && node.matches && node.matches("input, select")) {
        text = node.getAttribute("placeholder") || node.getAttribute("name") || api.tip("Eingabefeld", "Input field");
      }
      if (!text) return "";
      if (node.matches && node.matches("input")) {
        var label = node.closest("label");
        var name = label ? label.textContent.replace(node.value, "").trim() : (node.getAttribute("aria-label") || "");
        text += "\n" + name + ": " + node.value;
      } else if (node.matches && node.matches("output")) {
        text += "\n" + api.tip("Aktueller Wert", "Current value") + ": " + node.value;
      }
      if (node.matches && node.matches("canvas, svg, [role=img]")) {
        var scope = node.closest(".ls-scene-layer, .ls-scene-host, .ls-bs-detail, .ls-stage, [data-demo]") || host;
        var live = scope && scope.querySelector('[aria-live="polite"]');
        var valueText = live ? live.textContent.replace(/\s+/g, " ").trim() : "";
        if (valueText && text.indexOf(valueText) === -1) text += "\n" + valueText.slice(0, 260);
      }
      return text;
    }
    function tipNode(e) {
      if (!e.target || !e.target.closest) return null;
      var node = e.target.closest("[data-tip],[data-tip-de],[data-tip-en]");
      if (!node) {
        node = e.target.closest("canvas, svg, [role=img], button, [role=button], input, select, output");
      }
      if (!node || !host.contains(node)) return null;
      if (node.closest("[data-ls-canvas-tip],.ls-rope-scene,.ls-bs-residual,.ls-wm-scene,.ls-ind-scene")) return null;
      return node;
    }
    function tipPlace(x, y) {
      if (tipEl.hidden) return;
      var pad = 14;
      var w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      var left = x + pad, top = y + pad;
      if (left + w > window.innerWidth - 8) left = x - w - pad;
      if (top + h > window.innerHeight - 8) top = y - h - pad;
      tipEl.style.left = Math.max(8, left) + "px";
      tipEl.style.top = Math.max(8, top) + "px";
    }
    function tipShow(node, x, y) {
      var text = tipTextFor(node);
      if (!text) return;
      tipTarget = node;
      tipEl.innerHTML = tipHtml(text);
      tipEl.hidden = false;
      tipPlace(x, y);
    }
    function tipHide() {
      tipTarget = null;
      tipEl.hidden = true;
    }
    host.addEventListener("pointerover", function (e) {
      var node = tipNode(e);
      if (node) tipShow(node, e.clientX, e.clientY);
      else tipHide();
    });
    host.addEventListener("pointermove", function (e) {
      if (tipTarget) tipPlace(e.clientX, e.clientY);
    });
    host.addEventListener("pointerout", function (e) {
      if (!tipTarget) return;
      if (!e.relatedTarget || !tipTarget.contains(e.relatedTarget)) tipHide();
    });
    host.addEventListener("pointerdown", tipHide);
    host.addEventListener("focusin", function (e) {
      var node = tipNode(e);
      if (!node) return;
      var r = node.getBoundingClientRect();
      tipShow(node, r.left + r.width / 2, r.bottom - 4);
    });
    host.addEventListener("focusout", tipHide);
    var scenes = {};
    var scene = null, name = null, ro = null, roRaf = 0;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () {
        if (roRaf) return;
        roRaf = requestAnimationFrame(function () {
          roRaf = 0;
          if (scene && scene.resize) { try { scene.resize(); } catch (e) {} }
        });
      });
      ro.observe(host);
    }
    function makeLayer(next) {
      var layer = document.createElement("div");
      layer.className = "ls-scene-layer";
      layer.setAttribute("data-scene", next);
      layer.hidden = true;
      host.appendChild(layer);
      var inst = SCENES[next] ? SCENES[next](layer, api) : null;
      return { layer: layer, api: inst };
    }
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    function mount(next, dir) {
      if (!scenes[next]) scenes[next] = makeLayer(next);
      var stepDir = dir < 0 ? "prev" : "next";
      Object.keys(scenes).forEach(function (key) {
        if (key === next) return;
        var other = scenes[key];
        if (!other.layer.hidden) {
          other.layer.classList.remove("is-active", "is-entering-next", "is-entering-prev");
          other.layer.classList.add("is-leaving-" + stepDir);
          if (other.api && other.api.pause) { try { other.api.pause(); } catch (e) {} }
          setTimeout(function () {
            if (!other.layer.classList.contains("is-active")) {
              other.layer.hidden = true;
              other.layer.classList.remove("is-leaving-next", "is-leaving-prev");
            }
          }, reduced ? 0 : 380);
        }
      });
      var entry = scenes[next];
      entry.layer.hidden = false;
      entry.layer.classList.remove("is-leaving-next", "is-leaving-prev");
      entry.layer.classList.add("is-entering-" + stepDir);
      void entry.layer.offsetWidth;
      entry.layer.classList.add("is-active");
      setTimeout(function () {
        entry.layer.classList.remove("is-entering-next", "is-entering-prev");
      }, reduced ? 0 : 300);
      if (!reduced) {
        setTimeout(function () {
          if (!entry.layer.classList.contains("is-active")) return;
          entry.layer.classList.add("is-settled");
          setTimeout(function () { entry.layer.classList.remove("is-settled"); }, 40);
        }, 700);
      }
      if (entry.api && entry.api.resume) { try { entry.api.resume(); } catch (e) {} }
      if (entry.api && entry.api.resize) entry.api.resize();
      name = next;
      scene = entry.api;
      if (!scene) {
        entry.layer.innerHTML = '<div class="ls-empty">' + (api.lang === "de" ? "Demo folgt." : "Demo follows.") + '</div>';
      }
    }
    return {
      update: function (s, meta) {
        var next = (s && s.scene) || "embedding";
        var active = host.querySelector(".ls-scene-layer.is-active");
        if (next !== name || !active || active.getAttribute("data-scene") !== next) {
          var dir = meta && (meta.subDir || meta.dir) ? (meta.subDir || meta.dir) : 1;
          mount(next, dir);
        }
        if (scene && scene.update) scene.update(s || {}, meta);
      },
      preload: function (nextName) {
        if (!nextName || scenes[nextName] || !SCENES[nextName]) return;
        var entry = makeLayer(nextName);
        if (entry.api && entry.api.pause) { try { entry.api.pause(); } catch (e) {} }
        scenes[nextName] = entry;
      },
      resize: function () { if (scene && scene.resize) scene.resize(); },
      setControl: function (name, value) { return scene && scene.setControl ? scene.setControl(name, value) : false; },
      pause: function () { if (scene && scene.pause) scene.pause(); },
      resume: function () { if (scene && scene.resume) scene.resume(); },
      busy: function () { return scene && scene.busy ? scene.busy() : false; },
      finish: function () { if (scene && scene.finish) scene.finish(); },
      next: function () { return scene && scene.next ? scene.next() : false; },
      prev: function () { return scene && scene.prev ? scene.prev() : false; },
      nextFull: function () { return scene && scene.nextFull ? scene.nextFull() : false; },
      prevFull: function () { return scene && scene.prevFull ? scene.prevFull() : false; },
      hasNext: function () {
        if (!scene) return false;
        if (typeof scene.hasNext === "function") return !!scene.hasNext();
        return typeof scene.next === "function";
      },
      hasPrev: function () {
        if (!scene) return false;
        if (typeof scene.hasPrev === "function") return !!scene.hasPrev();
        return typeof scene.prev === "function";
      },
      ownsKeys: function () { return scene && scene.ownsKeys ? !!scene.ownsKeys() : false; },
      onKey: function (e) { return scene && scene.onKey ? scene.onKey(e) : false; },
      destroy: function () {
        tipEl.remove();
        if (ro) ro.disconnect();
        if (roRaf) cancelAnimationFrame(roRaf);
        Object.keys(scenes).forEach(function (key) {
          if (scenes[key].api && scenes[key].api.destroy) { try { scenes[key].api.destroy(); } catch (e) {} }
        });
        scenes = {};
        scene = null;
      }
    };
  }, { tier: 1, label: "Intuition", staticLayer: false });
})();
