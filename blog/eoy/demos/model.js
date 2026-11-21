(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var tfPromise = null;

  function loadTf(asset) {
    if (window.tf) return Promise.resolve();
    if (tfPromise) return tfPromise;
    tfPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = asset ? asset("assets/tf.min.js") : "assets/tf.min.js";
      script.async = true;
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error("tf-load")); };
      document.head.appendChild(script);
    });
    return tfPromise;
  }

  function modelScene(root, api) {
    if (window.tf && window.TfSinusScene) return window.TfSinusScene(root, api);
    if (!window.TfSinusScene) return null;
    var placeholder = document.createElement("div");
    placeholder.className = "ls-empty";
    placeholder.textContent = api.lang === "de" ? "Demo lädt …" : "Demo loading …";
    root.appendChild(placeholder);
    var instance = null;
    var pending = [];
    function call(name, args) {
      if (instance && typeof instance[name] === "function") return instance[name].apply(instance, args);
      if (name === "update") pending.push(args);
      return undefined;
    }
    loadTf(api.asset).then(function () {
      if (!root.isConnected) return;
      placeholder.remove();
      instance = window.TfSinusScene(root, api);
      pending.forEach(function (args) {
        try { if (instance.update) instance.update.apply(instance, args); } catch (err) {}
      });
      pending = [];
    }, function () {
      placeholder.textContent = api.lang === "de" ? "TF.js konnte nicht geladen werden." : "TF.js could not be loaded.";
    });
    return {
      update: function () { return call("update", arguments); },
      resize: function () { return call("resize", arguments); },
      pause: function () { return call("pause", arguments); },
      resume: function () { return call("resume", arguments); },
      next: function () { return call("next", arguments); },
      prev: function () { return call("prev", arguments); },
      hasNext: function () { return instance && instance.hasNext ? instance.hasNext() : false; },
      hasPrev: function () { return instance && instance.hasPrev ? instance.hasPrev() : false; },
      busy: function () { return instance && instance.busy ? instance.busy() : false; },
      finish: function () { return call("finish", arguments); },
      onKey: function () { return call("onKey", arguments); },
      destroy: function () {
        if (instance && instance.destroy) instance.destroy();
        else placeholder.remove();
      }
    };
  }

  core.register("model", modelScene);
})();
