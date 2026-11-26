(function () {
  "use strict";

  var FALLBACK = { petrol: "#004b6f", sky: "#1275ac", green: "#63a44b" };

  function cssColor(container, name, fallback) {
    try {
      var value = getComputedStyle(container).getPropertyValue(name).trim();
      if (value) return value;
    } catch (e) {}
    return fallback;
  }

  function makeCanvas(container) {
    var canvas = document.createElement("canvas");
    canvas.className = "eoy-loading-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;"
      + "pointer-events:none;z-index:0;";
    container.appendChild(canvas);
    return canvas;
  }

  function attach(container, options) {
    if (!container) return null;
    if (container.__eoyLoading) return container.__eoyLoading;
    options = options || {};
    var subtle = options.subtle !== false;

    var canvas = makeCanvas(container);
    var ctx = canvas.getContext("2d");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var width = 0;
    var height = 0;
    var lines = [];
    var raf = 0;
    var running = false;
    var startedAt = 0;
    var observer = null;
    var colors = [];

    function seedLines() {
      colors = [
        cssColor(container, "--ls-petrol", FALLBACK.petrol),
        cssColor(container, "--ls-sky", FALLBACK.sky),
        cssColor(container, "--ls-green", FALLBACK.green)
      ];
      lines = [];
      if (width < 2 || height < 2) return;
      var gap = subtle ? 44 : 36;
      var count = Math.max(5, Math.min(28, Math.round(height / gap)));
      for (var i = 0; i < count; i++) {
        var base = (i + 0.5) / count;
        lines.push({
          base: base,
          amp: (0.010 + Math.random() * 0.018) * height,
          amp2: (0.003 + Math.random() * 0.007) * height,
          k1: (Math.PI * 2) / (width * (0.55 + Math.random() * 0.75)),
          k2: (Math.PI * 2) / (width * (0.22 + Math.random() * 0.32)),
          speed: 0.00010 + Math.random() * 0.00010,
          phase: Math.random() * Math.PI * 2,
          color: colors[i % colors.length],
          alpha: (subtle ? 0.05 : 0.065) + Math.random() * (subtle ? 0.045 : 0.06),
          lineWidth: 0.8 + Math.random() * 0.55
        });
      }
    }

    function fadeEdges(now) {
      ctx.globalCompositeOperation = "destination-in";
      var gv = ctx.createLinearGradient(0, 0, 0, height);
      gv.addColorStop(0, "rgba(0,0,0,0)");
      gv.addColorStop(0.14, "rgba(0,0,0,1)");
      gv.addColorStop(0.86, "rgba(0,0,0,1)");
      gv.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gv;
      ctx.fillRect(0, 0, width, height);
      var gh = ctx.createLinearGradient(0, 0, width, 0);
      gh.addColorStop(0, "rgba(0,0,0,0)");
      gh.addColorStop(0.10, "rgba(0,0,0,1)");
      gh.addColorStop(0.90, "rgba(0,0,0,1)");
      gh.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gh;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";
    }

    function render(now) {
      if (width < 2 || height < 2) return;
      var t = reduce ? 0 : (now - startedAt);
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      var step = Math.max(12, width / 64);
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var baseY = line.base * height;
        ctx.beginPath();
        for (var x = -step; x <= width + step; x += step) {
          var y = baseY
            + Math.sin(x * line.k1 + line.phase + t * line.speed) * line.amp
            + Math.sin(x * line.k2 - line.phase * 0.7 + t * line.speed * 0.6) * line.amp2;
          if (x <= -step) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = line.color;
        ctx.globalAlpha = line.alpha;
        ctx.lineWidth = line.lineWidth;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      fadeEdges(now);
    }

    function resize() {
      var rect = container.getBoundingClientRect();
      var nextW = Math.max(1, Math.round(rect.width));
      var nextH = Math.max(1, Math.round(rect.height));
      if (nextW === width && nextH === height) return;
      width = nextW;
      height = nextH;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedLines();
      render(startedAt);
    }

    function loop(now) {
      if (!running) return;
      render(now);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      resize();
      if (reduce) {
        render(0);
        return;
      }
      running = true;
      startedAt = performance.now();
      raf = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    function destroy() {
      stop();
      if (observer && observer.disconnect) observer.disconnect();
      else window.removeEventListener("resize", resize);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      container.__eoyLoading = null;
    }

    if (window.ResizeObserver) {
      observer = new ResizeObserver(function () { resize(); });
      observer.observe(container);
    } else {
      window.addEventListener("resize", resize);
    }

    resize();
    container.__eoyLoading = { start: start, stop: stop, destroy: destroy, canvas: canvas };
    return container.__eoyLoading;
  }

  window.EoyLoading = { attach: attach };
})();
