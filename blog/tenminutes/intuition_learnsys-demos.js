(function () {
  "use strict";
  if (!window.LearnSys || !window.LearnSysDemoCore) return;
  var SCENES = window.LearnSysDemoCore.scenes;
  LearnSys.defineDemo("intuition", function (root, api) {
    var host = document.createElement("div");
    host.className = "ls-scene-host";
    root.appendChild(host);
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
        if (next !== name) {
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
      onKey: function (e) { return scene && scene.onKey ? scene.onKey(e) : false; },
      destroy: function () {
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
