(function () {
  "use strict";

  var MASK = "radial-gradient(ellipse farthest-side at 50% 50%,#000 86%,rgba(0,0,0,.5) 95%,transparent 98%)";

  function makeCanvas(container, extra) {
    var canvas = document.createElement("canvas");
    canvas.className = "eoy-loading-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;"
      + "pointer-events:none;z-index:0;-webkit-mask-image:" + MASK + ";mask-image:" + MASK
      + (extra || "");
    container.appendChild(canvas);
    return canvas;
  }

  function attach(container, options) {
    if (!container) return null;
    if (container.__eoyLoading) return container.__eoyLoading;
    options = options || {};
    var subtle = !!options.subtle;

    var bgCanvas = makeCanvas(container, "");
    var trailCanvas = makeCanvas(container, "");
    var bg = bgCanvas.getContext("2d");
    var ctx = trailCanvas.getContext("2d");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var width = 0;
    var height = 0;
    var particles = [];
    var raf = 0;
    var running = false;
    var observer = null;

    function fieldAngle(x, y, t) {
      var tt = t * 0.00035;
      return Math.sin(x * 0.0062 + tt) * 1.15
        + Math.cos(y * 0.0074 - tt * 0.87) * 1.15
        + Math.sin((x + y) * 0.0031 + tt * 0.7) * 0.7
        + Math.sin(t * 0.00008) * 0.35;
    }

    function colorize(p, x, y, t) {
      var n = Math.sin(x * 0.0022 + t * 0.00012) * 0.5
        + Math.cos(y * 0.0028 - t * 0.00009) * 0.5;
      if (subtle) {
        p.hue = 164 + n * 18;
        p.sat = 22 + Math.random() * 16;
        p.light = 42 + Math.random() * 14;
        p.alpha = 0.035 + Math.random() * 0.045;
        return;
      }
      p.hue = 156 + n * 46;
      p.sat = 72 + Math.random() * 22;
      p.light = 54 + Math.random() * 20;
      p.alpha = 0.1 + Math.random() * 0.1;
    }

    function reset(p, t) {
      p.x = Math.random() * width;
      p.y = Math.random() * height;
      p.life = 70 + Math.random() * 180;
      p.speed = 0.7 + Math.random() * 1.1;
      p.width = 0.6 + Math.random() * 0.9;
      colorize(p, p.x, p.y, t || 0);
    }

    function seed() {
      var count = Math.round((width * height) / (subtle ? 3600 : 900));
      count = Math.max(subtle ? 70 : 450, Math.min(subtle ? 380 : 2600, count));
      particles = [];
      for (var i = 0; i < count; i++) {
        var p = {};
        reset(p, 0);
        p.life = Math.random() * 240;
        particles.push(p);
      }
    }

    function paintBackground(t) {
      var base = Math.max(width, height);
      bg.clearRect(0, 0, width, height);
      if (subtle) {
        var wash = bg.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, base * 0.72);
        wash.addColorStop(0, "rgba(99,164,75,.045)");
        wash.addColorStop(0.55, "rgba(18,117,172,.025)");
        wash.addColorStop(1, "rgba(255,255,255,0)");
        bg.fillStyle = wash;
        bg.fillRect(0, 0, width, height);
        return;
      }
      var core = bg.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, base * 0.72);
      core.addColorStop(0, "#00455c");
      core.addColorStop(0.55, "#00293a");
      core.addColorStop(1, "#00131e");
      bg.fillStyle = core;
      bg.fillRect(0, 0, width, height);

      var glows = [
        [0.36 + 0.12 * Math.sin(t * 0.00012), 0.42 + 0.1 * Math.cos(t * 0.0001), [99, 164, 75], 0.3],
        [0.64 + 0.12 * Math.cos(t * 0.00009), 0.58 + 0.1 * Math.sin(t * 0.00013), [18, 117, 172], 0.28],
        [0.5 + 0.15 * Math.sin(t * 0.00007 + 2), 0.32 + 0.12 * Math.cos(t * 0.00011 + 1), [201, 162, 39], 0.13]
      ];
      for (var i = 0; i < glows.length; i++) {
        var g = glows[i];
        var x = g[0] * width;
        var y = g[1] * height;
        var radius = Math.max(base * 0.5, 130);
        var grad = bg.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, "rgba(" + g[2][0] + "," + g[2][1] + "," + g[2][2] + "," + g[3] + ")");
        grad.addColorStop(1, "rgba(" + g[2][0] + "," + g[2][1] + "," + g[2][2] + ",0)");
        bg.fillStyle = grad;
        bg.fillRect(0, 0, width, height);
      }
    }

    function advance(t, fade) {
      if (fade) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0,0,0,0.035)";
        ctx.fillRect(0, 0, width, height);
      }
      ctx.globalCompositeOperation = subtle ? "source-over" : "lighter";
      ctx.lineCap = "round";
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var angle = fieldAngle(p.x, p.y, t);
        var nx = p.x + Math.cos(angle) * p.speed;
        var ny = p.y + Math.sin(angle) * p.speed;
        ctx.strokeStyle = "hsla(" + p.hue.toFixed(1) + "," + p.sat.toFixed(1) + "%,"
          + p.light.toFixed(1) + "%," + p.alpha.toFixed(3) + ")";
        ctx.lineWidth = p.width;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        p.x = nx;
        p.y = ny;
        p.life -= 1;
        if (p.life <= 0 || p.x < -24 || p.x > width + 24 || p.y < -24 || p.y > height + 24) {
          reset(p, t);
        }
      }
      ctx.globalCompositeOperation = "source-over";
    }

    function prewarm() {
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < 36; i++) advance(i * 16, true);
    }

    function resize() {
      var rect = container.getBoundingClientRect();
      var nextW = Math.max(1, Math.round(rect.width));
      var nextH = Math.max(1, Math.round(rect.height));
      if (nextW === width && nextH === height) return;
      width = nextW;
      height = nextH;
      bgCanvas.width = Math.round(width * dpr);
      bgCanvas.height = Math.round(height * dpr);
      trailCanvas.width = Math.round(width * dpr);
      trailCanvas.height = Math.round(height * dpr);
      bg.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      paintBackground(performance.now());
      prewarm();
    }

    function drawStatic() {
      paintBackground(0);
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < 70; i++) advance(i * 16, true);
    }

    function loop(now) {
      if (!running) return;
      paintBackground(now);
      advance(now, true);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      resize();
      running = true;
      if (reduce) {
        drawStatic();
        running = false;
        return;
      }
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
      if (bgCanvas.parentNode) bgCanvas.parentNode.removeChild(bgCanvas);
      if (trailCanvas.parentNode) trailCanvas.parentNode.removeChild(trailCanvas);
      container.__eoyLoading = null;
    }

    if (window.ResizeObserver) {
      observer = new ResizeObserver(function () { resize(); });
      observer.observe(container);
    } else {
      window.addEventListener("resize", resize);
    }

    resize();
    container.__eoyLoading = { start: start, stop: stop, destroy: destroy, canvas: trailCanvas };
    return container.__eoyLoading;
  }

  window.EoyLoading = { attach: attach };
})();
